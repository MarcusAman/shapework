import fs from 'fs';
import path from 'path';
import type { 
  OrgModel, 
  OrgPosition, 
  OrgRole, 
  OrgSop, 
  OrgConnection, 
  EscalationPolicy, 
  RoutingMatrixItem, 
  OrgKnowledgeDocument, 
  OrgLogicNode 
} from '../../src/services/orgChartService';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const STORAGE_PATH = path.join(BACKUP_DIR, 'org_chart_repository.json');
const AUDIT_PATH = path.join(BACKUP_DIR, 'org_chart_audit.json');

export interface OrgAuditRecord {
  id: string;
  workspaceId: string;
  action: string;
  entityType: 'position' | 'role' | 'sop' | 'routing_rule' | 'escalation' | 'model';
  entityId: string;
  previousValue?: any;
  newValue?: any;
  performedBy: string;
  timestamp: string;
  notes?: string;
}

function ensureStorage(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORAGE_PATH)) {
    fs.writeFileSync(STORAGE_PATH, JSON.stringify({}, null, 2), 'utf-8');
  }
  if (!fs.existsSync(AUDIT_PATH)) {
    fs.writeFileSync(AUDIT_PATH, JSON.stringify([], null, 2), 'utf-8');
  }
}

function loadAllModels(): Record<string, OrgModel> {
  ensureStorage();
  try {
    const raw = fs.readFileSync(STORAGE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read org chart repository, resetting:', err);
    return {};
  }
}

function saveAllModels(models: Record<string, OrgModel>): void {
  ensureStorage();
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(models, null, 2), 'utf-8');
}

export const orgChartRepository = {
  getAuditLog(workspaceId: string): OrgAuditRecord[] {
    ensureStorage();
    try {
      const raw = fs.readFileSync(AUDIT_PATH, 'utf-8');
      const all: OrgAuditRecord[] = JSON.parse(raw);
      return all.filter(a => a.workspaceId === workspaceId);
    } catch {
      return [];
    }
  },

  logAudit(record: Omit<OrgAuditRecord, 'id' | 'timestamp'>): void {
    ensureStorage();
    try {
      const raw = fs.readFileSync(AUDIT_PATH, 'utf-8');
      const all: OrgAuditRecord[] = JSON.parse(raw);
      const newRecord: OrgAuditRecord = {
        ...record,
        id: `audit_org_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString()
      };
      all.push(newRecord);
      fs.writeFileSync(AUDIT_PATH, JSON.stringify(all, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write org chart audit log:', e);
    }
  },

  /**
   * Prevents self-reporting and circular hierarchy loops (e.g. A -> B -> A)
   */
  validateReportingHierarchy(
    positions: OrgPosition[], 
    positionId: string, 
    newReportsToPositionId?: string
  ): { valid: boolean; error?: string } {
    if (!newReportsToPositionId) {
      return { valid: true };
    }

    if (newReportsToPositionId === positionId) {
      return { 
        valid: false, 
        error: 'A position cannot report to itself.' 
      };
    }

    const targetPos = positions.find(p => p.id === newReportsToPositionId);
    if (!targetPos) {
      return { 
        valid: false, 
        error: `Target reporting position ID "${newReportsToPositionId}" does not exist.` 
      };
    }

    // Traverse upwards from newReportsToPositionId to see if we ever reach positionId
    let current: OrgPosition | undefined = targetPos;
    const visited = new Set<string>();

    while (current) {
      if (current.id === positionId) {
        return { 
          valid: false, 
          error: `Circular reporting hierarchy detected: Position "${targetPos.name || targetPos.title}" reports directly or indirectly to "${positionId}".` 
        };
      }
      if (visited.has(current.id)) {
        break; // break if existing loop in legacy data
      }
      visited.add(current.id);
      current = current.reportsToPositionId ? positions.find(p => p.id === current?.reportsToPositionId) : undefined;
    }

    return { valid: true };
  },

  getOrgChart(workspaceId: string, fallbackDefaultModel?: OrgModel): OrgModel {
    const all = loadAllModels();
    const existing = all[workspaceId];
    if (existing && existing.positions && existing.positions.length > 0) {
      return existing;
    }

    if (fallbackDefaultModel) {
      all[workspaceId] = fallbackDefaultModel;
      saveAllModels(all);
      return fallbackDefaultModel;
    }

    return {
      positions: [],
      roles: [],
      sops: [],
      connections: [],
      escalationPolicies: [],
      routingMatrix: [],
      knowledgeDocuments: [],
      logicNodes: []
    };
  },

  saveOrgChart(workspaceId: string, model: OrgModel, authorUser: string = 'system'): OrgModel {
    const all = loadAllModels();
    const previous = all[workspaceId];
    all[workspaceId] = model;
    saveAllModels(all);

    this.logAudit({
      workspaceId,
      action: 'save_org_chart',
      entityType: 'model',
      entityId: workspaceId,
      previousValue: { positionCount: previous?.positions?.length || 0 },
      newValue: { positionCount: model.positions.length },
      performedBy: authorUser,
      notes: `Updated full org chart model for workspace ${workspaceId}`
    });

    return model;
  },

  updatePosition(
    workspaceId: string,
    id: string,
    updates: Partial<OrgPosition>,
    authorUser: string = 'system',
    fallbackDefaultModel?: OrgModel
  ): { model: OrgModel; position: OrgPosition } {
    const model = this.getOrgChart(workspaceId, fallbackDefaultModel);
    const existingIndex = model.positions.findIndex(p => p.id === id);

    if (existingIndex === -1) {
      throw new Error(`Position with ID "${id}" not found in workspace "${workspaceId}".`);
    }

    const existingPos = model.positions[existingIndex];

    // Validate reporting hierarchy if reportsToPositionId is being updated
    if (updates.reportsToPositionId !== undefined && updates.reportsToPositionId !== existingPos.reportsToPositionId) {
      const validation = this.validateReportingHierarchy(model.positions, id, updates.reportsToPositionId);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid reporting hierarchy.');
      }
    }

    const now = new Date().toISOString();
    const updatedPos: OrgPosition = {
      ...existingPos,
      ...updates,
      updatedAt: now
    };

    model.positions[existingIndex] = updatedPos;

    // Update connection lines if reportsToPositionId changed
    if (updates.reportsToPositionId !== undefined) {
      model.connections = (model.connections || []).filter(
        c => !(c.type === 'reporting' && c.fromPositionId === id)
      );
      if (updates.reportsToPositionId) {
        model.connections.push({
          id: `conn_rep_${id}_${updates.reportsToPositionId}`,
          workspaceId,
          type: 'reporting',
          fromPositionId: id,
          toPositionId: updates.reportsToPositionId,
          label: 'Reports To',
          createdAt: now,
          updatedAt: now
        });
      }
    }

    this.saveOrgChart(workspaceId, model, authorUser);

    this.logAudit({
      workspaceId,
      action: 'update_position',
      entityType: 'position',
      entityId: id,
      previousValue: {
        name: existingPos.name,
        title: existingPos.title,
        reportsToPositionId: existingPos.reportsToPositionId,
        department: existingPos.department
      },
      newValue: {
        name: updatedPos.name,
        title: updatedPos.title,
        reportsToPositionId: updatedPos.reportsToPositionId,
        department: updatedPos.department
      },
      performedBy: authorUser,
      notes: `Updated position "${updatedPos.name}" (${updatedPos.title})`
    });

    return { model, position: updatedPos };
  },

  deletePosition(
    workspaceId: string,
    id: string,
    reassignToPositionId?: string,
    authorUser: string = 'system'
  ): OrgModel {
    const model = this.getOrgChart(workspaceId);
    const existing = model.positions.find(p => p.id === id);
    if (!existing) {
      throw new Error(`Position "${id}" not found.`);
    }

    model.positions = model.positions.filter(p => p.id !== id);

    if (reassignToPositionId) {
      model.positions.forEach(p => {
        if (p.reportsToPositionId === id) p.reportsToPositionId = reassignToPositionId;
        if (p.backupPositionId === id) p.backupPositionId = reassignToPositionId;
      });
      model.roles.forEach(r => {
        if (r.positionId === id) r.positionId = reassignToPositionId;
      });
      model.sops.forEach(s => {
        if (s.ownerPositionId === id) s.ownerPositionId = reassignToPositionId;
      });
    }

    model.connections = (model.connections || []).filter(
      c => c.fromPositionId !== id && c.toPositionId !== id
    );

    this.saveOrgChart(workspaceId, model, authorUser);

    this.logAudit({
      workspaceId,
      action: 'delete_position',
      entityType: 'position',
      entityId: id,
      previousValue: existing,
      performedBy: authorUser,
      notes: `Deleted position "${existing.name}" (reassigned to: ${reassignToPositionId || 'none'})`
    });

    return model;
  },

  // Routing Rule management with stable unique ruleId
  updateRoutingRule(
    workspaceId: string,
    ruleIdOrCategory: string,
    updates: Partial<RoutingMatrixItem>,
    authorUser: string = 'system'
  ): OrgModel {
    const model = this.getOrgChart(workspaceId);
    const rules = model.routingMatrix || [];
    const idx = rules.findIndex(
      r => (r.id && r.id === ruleIdOrCategory) || r.category.toLowerCase() === ruleIdOrCategory.toLowerCase()
    );

    if (idx === -1) {
      throw new Error(`Routing rule "${ruleIdOrCategory}" not found.`);
    }

    const prev = rules[idx];
    const stableId = prev.id || `rule_${prev.category.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    rules[idx] = { ...prev, ...updates, id: stableId };
    model.routingMatrix = rules;

    this.saveOrgChart(workspaceId, model, authorUser);

    this.logAudit({
      workspaceId,
      action: 'update_routing_rule',
      entityType: 'routing_rule',
      entityId: stableId,
      previousValue: prev,
      newValue: rules[idx],
      performedBy: authorUser,
      notes: `Updated routing rule "${rules[idx].category}" (ID: ${stableId})`
    });

    return model;
  },

  deleteOrDeactivateRoutingRule(
    workspaceId: string,
    ruleIdOrCategory: string,
    mode: 'delete' | 'deactivate' = 'delete',
    authorUser: string = 'system'
  ): OrgModel {
    const model = this.getOrgChart(workspaceId);
    const rules = model.routingMatrix || [];
    const existing = rules.find(
      r => (r.id && r.id === ruleIdOrCategory) || r.category.toLowerCase() === ruleIdOrCategory.toLowerCase()
    );

    if (!existing) {
      throw new Error(`Routing rule "${ruleIdOrCategory}" not found.`);
    }

    const stableId = existing.id || `rule_${existing.category.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    if (mode === 'deactivate') {
      existing.id = stableId;
      existing.status = 'archived';
      model.routingMatrix = rules;
    } else {
      model.routingMatrix = rules.filter(
        r => (r.id && r.id !== stableId) && (r.category.toLowerCase() !== ruleIdOrCategory.toLowerCase())
      );
    }

    this.saveOrgChart(workspaceId, model, authorUser);

    this.logAudit({
      workspaceId,
      action: mode === 'deactivate' ? 'deactivate_routing_rule' : 'delete_routing_rule',
      entityType: 'routing_rule',
      entityId: stableId,
      previousValue: existing,
      performedBy: authorUser,
      notes: `${mode === 'deactivate' ? 'Deactivated' : 'Deleted'} routing rule "${existing.category}" (ID: ${stableId})`
    });

    return model;
  }
};
