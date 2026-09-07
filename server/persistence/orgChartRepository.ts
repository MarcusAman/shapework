import fs from 'fs';
import path from 'path';
import { 
  resolveStaffMember, 
  getAllStaffMembers, 
  validateBackupAssignment,
  type StaffMemberProfile
} from './operationsDirectoryRepository.js';
import { validateSopCompatibility } from '../policies/sopCategoryCompatibility.js';
import { 
  orgChartService,
  type OrgModel, 
  type OrgPosition, 
  type OrgRole, 
  type OrgSop, 
  type OrgConnection, 
  type EscalationPolicy, 
  type RoutingMatrixItem, 
  type OrgKnowledgeDocument, 
  type OrgLogicNode 
} from '../../src/services/orgChartService.js';

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

export interface PublishedRoutingPolicy {
  id: string;
  workspace_id: string;
  version: number;
  published_by: string;
  published_by_user_id?: string;
  published_at: string;
  is_active: boolean;
  rules_count: number;
  validation_hash?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PublishedRoutingRule {
  id: string;
  policy_id: string;
  workspace_id: string;
  rule_index: number;
  category: string;
  subcategory?: string;
  display_name?: string;
  match_keywords: string[];
  office_condition?: any;
  primary_position_id: string;
  primary_role_id?: string;
  primary_staff_id: string;
  review_position_id?: string;
  review_role_id?: string;
  review_staff_id?: string;
  backup_position_id?: string;
  backup_staff_id?: string;
  governing_sop_id?: string;
  governing_sop_version?: string;
  sla_hours: number;
  sla_display: string;
  escalation_policy_id?: string;
  status: 'active' | 'archived';
  metadata?: Record<string, any>;
  created_at: string;
}

export function getOrgChartBackupDir(): string {
  if (process.env.STORAGE_BACKUP_DIR) {
    return process.env.STORAGE_BACKUP_DIR;
  }
  if (process.env.NODE_ENV === 'test') {
    return path.join(process.cwd(), '.test_backups');
  }
  return path.join(process.cwd(), 'backups');
}

export function getOrgChartStoragePath(): string {
  return path.join(getOrgChartBackupDir(), 'org_chart_repository.json');
}

export function getOrgChartAuditPath(): string {
  return path.join(getOrgChartBackupDir(), 'org_chart_audit.json');
}

export function getPublishedPolicyPath(workspaceId: string): string {
  return path.join(getOrgChartBackupDir(), `published_policy_${workspaceId}.json`);
}

export interface CachedPolicyEntry {
  policy: PublishedRoutingPolicy;
  rules: PublishedRoutingRule[];
  cachedAt: number;
}

// In-memory cache for published routing policies and rules, populated from PostgreSQL
export const cachedActivePolicies = new Map<string, CachedPolicyEntry>();
export const POLICY_CACHE_TTL_MS = 30000; // 30 seconds TTL for multi-instance sync

let policyReadyResolvers: Array<() => void> = [];
let isPolicyReady = false;

export const policyReadyPromise = new Promise<void>((resolve) => {
  if (isPolicyReady) {
    resolve();
  } else {
    policyReadyResolvers.push(resolve);
  }
});

export function notifyPolicyReady(): void {
  isPolicyReady = true;
  while (policyReadyResolvers.length > 0) {
    const res = policyReadyResolvers.shift();
    if (res) res();
  }
}

function ensureStorage(): void {
  const dir = getOrgChartBackupDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const storagePath = getOrgChartStoragePath();
  if (!fs.existsSync(storagePath)) {
    const prodStorage = path.join(process.cwd(), 'backups', 'org_chart_repository.json');
    if (process.env.NODE_ENV === 'test' && fs.existsSync(prodStorage)) {
      try {
        fs.copyFileSync(prodStorage, storagePath);
      } catch {
        fs.writeFileSync(storagePath, JSON.stringify({}, null, 2), 'utf-8');
      }
    } else {
      fs.writeFileSync(storagePath, JSON.stringify({}, null, 2), 'utf-8');
    }
  }
  const auditPath = getOrgChartAuditPath();
  if (!fs.existsSync(auditPath)) {
    fs.writeFileSync(auditPath, JSON.stringify([], null, 2), 'utf-8');
  }
  // If in test mode, seed test published policy from baseline backups if available
  if (process.env.NODE_ENV === 'test') {
    const testPolicyFile = path.join(dir, 'published_policy_ws_wilmington.json');
    const basePolicyFile = path.join(process.cwd(), 'backups', 'published_policy_ws_wilmington.json');
    if (!fs.existsSync(testPolicyFile) && fs.existsSync(basePolicyFile)) {
      try {
        fs.copyFileSync(basePolicyFile, testPolicyFile);
      } catch {
        // ignore
      }
    }
  }
}

function loadAllModels(): Record<string, OrgModel> {
  ensureStorage();
  try {
    const raw = fs.readFileSync(getOrgChartStoragePath(), 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read org chart repository, resetting:', err);
    return {};
  }
}

function saveAllModels(models: Record<string, OrgModel>): void {
  ensureStorage();
  fs.writeFileSync(getOrgChartStoragePath(), JSON.stringify(models, null, 2), 'utf-8');
}

export const orgChartRepository = {
  getAuditLog(workspaceId: string): OrgAuditRecord[] {
    ensureStorage();
    try {
      const raw = fs.readFileSync(getOrgChartAuditPath(), 'utf-8');
      const all: OrgAuditRecord[] = JSON.parse(raw);
      return all.filter(a => a.workspaceId === workspaceId);
    } catch {
      return [];
    }
  },

  logAudit(record: Omit<OrgAuditRecord, 'id' | 'timestamp'>): void {
    ensureStorage();
    try {
      let all: OrgAuditRecord[] = [];
      try {
        const raw = fs.readFileSync(getOrgChartAuditPath(), 'utf-8');
        all = JSON.parse(raw);
        if (!Array.isArray(all)) all = [];
      } catch {
        all = [];
      }
      const newRecord: OrgAuditRecord = {
        ...record,
        id: `audit_org_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString()
      };
      all.push(newRecord);
      fs.writeFileSync(getOrgChartAuditPath(), JSON.stringify(all, null, 2), 'utf-8');
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

    if (workspaceId === 'ws_wilmington' || workspaceId === 'nest-realty-demo') {
      const defaultModel = orgChartService.getOrgChart(workspaceId);
      all[workspaceId] = defaultModel;
      saveAllModels(all);
      return defaultModel;
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
  },

  /**
   * Validates all staff, positions, roles, and hierarchy rules before publication.
   */
  validatePolicyBeforePublish(
    workspaceId: string, 
    model: OrgModel
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const allStaff = getAllStaffMembers();

    // 1. Validate reporting hierarchy loops
    for (const pos of model.positions) {
      if (pos.reportsToPositionId) {
        const loopCheck = this.validateReportingHierarchy(model.positions, pos.id, pos.reportsToPositionId);
        if (!loopCheck.valid) {
          errors.push(loopCheck.error || `Cyclic reporting loop found at position "${pos.name}".`);
        }
      }
    }

    // 2. Validate routing rules
    const rules = model.routingMatrix || [];
    if (rules.length === 0) {
      warnings.push('Routing matrix contains no rules. Intake requests will default to manager triage.');
    }

    for (const rule of rules) {
      if (rule.status === 'archived') continue;
      const primaryPos = model.positions.find(p => p.id === rule.primaryOwnerPositionId);
      if (!primaryPos) {
        errors.push(`Rule "${rule.displayName || rule.category}": Primary position "${rule.primaryOwnerPositionId}" does not exist in org positions.`);
        continue;
      }

      // Check staff resolution
      const primaryStaff = (primaryPos.email ? resolveStaffMember(primaryPos.email, workspaceId, allStaff) : undefined) || 
                           resolveStaffMember(primaryPos.name, workspaceId, allStaff);
      if (!primaryStaff) {
        errors.push(`Rule "${rule.displayName || rule.category}": Position "${primaryPos.name}" (${primaryPos.title}) cannot be resolved to any staff member in directory for workspace "${workspaceId}".`);
      } else if (primaryStaff.status === 'inactive') {
        errors.push(`Rule "${rule.displayName || rule.category}": Staff member "${primaryStaff.fullName}" assigned as primary owner is marked inactive.`);
      }

      // Check SOP compatibility and status if sopId is assigned
      if (rule.sopId) {
        const sopVal = validateSopCompatibility(rule.sopId, rule.category, workspaceId);
        if (!sopVal.valid) {
          errors.push(`Rule "${rule.displayName || rule.category}": Incompatible or invalid governing SOP "${rule.sopId}". ${sopVal.errorMessage}`);
        }
      }

      // Check self-reporting loop
      if (primaryPos.reportsToPositionId && primaryPos.reportsToPositionId === primaryPos.id) {
        errors.push(`Rule "${rule.displayName || rule.category}": Primary position cannot report to itself.`);
      }

      // Check backup position & cycle if assigned
      if (rule.backupOwnerPositionId) {
        if (rule.backupOwnerPositionId === rule.primaryOwnerPositionId) {
          errors.push(`Rule "${rule.displayName || rule.category}": Backup position cannot be the same as primary position.`);
        } else {
          const backupPos = model.positions.find(p => p.id === rule.backupOwnerPositionId);
          if (backupPos) {
            const backupStaff = (backupPos.email ? resolveStaffMember(backupPos.email, workspaceId, allStaff) : undefined) || 
                                resolveStaffMember(backupPos.name, workspaceId, allStaff);
            if (backupStaff && primaryStaff) {
              const backupVal = validateBackupAssignment(primaryStaff.id, backupStaff.id, workspaceId, allStaff);
              if (!backupVal.valid) {
                errors.push(`Rule "${rule.displayName || rule.category}": ${backupVal.error}`);
              }
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  },

  /**
   * Helper to construct immutable policy and rules from draft OrgModel.
   */
  buildPublishedPolicyData(
    workspaceId: string,
    model: OrgModel,
    version: number,
    authorUser: string = 'system',
    authorUserId?: string
  ): { policy: PublishedRoutingPolicy; rules: PublishedRoutingRule[] } {
    const policyId = `pol_${workspaceId}_v${version}`;
    const now = new Date().toISOString();

    const allStaff = getAllStaffMembers();

    const publishedRules: PublishedRoutingRule[] = [];
    const draftRules = (model.routingMatrix || []).filter(r => r.status !== 'archived');

    draftRules.forEach((dr, idx) => {
      const primaryPos = model.positions.find(p => p.id === dr.primaryOwnerPositionId);
      const backupPos = model.positions.find(p => p.id === dr.backupOwnerPositionId);
      const primaryStaff = primaryPos 
        ? ((primaryPos.email ? resolveStaffMember(primaryPos.email, workspaceId, allStaff) : undefined) || resolveStaffMember(primaryPos.name, workspaceId, allStaff))
        : undefined;
      const backupStaff = backupPos 
        ? ((backupPos.email ? resolveStaffMember(backupPos.email, workspaceId, allStaff) : undefined) || resolveStaffMember(backupPos.name, workspaceId, allStaff))
        : undefined;

      // Determine review position/staff strictly from reporting hierarchy or role definition
      let reviewPositionId: string | undefined = primaryPos?.reportsToPositionId;
      let reviewStaff: StaffMemberProfile | undefined;

      if (dr.category.toLowerCase().includes('contract') || dr.category.toLowerCase().includes('compliance')) {
        reviewPositionId = reviewPositionId || 'pos_bic';
        const bicPos = model.positions.find(p => p.id === reviewPositionId || p.id === 'pos_bic');
        reviewStaff = bicPos 
          ? ((bicPos.email ? resolveStaffMember(bicPos.email, workspaceId, allStaff) : undefined) || resolveStaffMember(bicPos.name, workspaceId, allStaff))
          : resolveStaffMember('dir_jessica_keenan_8', workspaceId, allStaff);
      } else if (reviewPositionId) {
        let currentPosId: string | undefined = reviewPositionId;
        while (currentPosId && !reviewStaff) {
          const managerPos = model.positions.find(p => p.id === currentPosId);
          if (!managerPos) break;
          if ((managerPos.status as string) === 'open' || (managerPos.status as string) === 'vacant' || managerPos.status === 'planned' || managerPos.status === 'wanted') {
            currentPosId = managerPos.reportsToPositionId;
            continue;
          }
          const staff = (managerPos.email ? resolveStaffMember(managerPos.email, workspaceId, allStaff) : undefined) || 
                        resolveStaffMember(managerPos.name, workspaceId, allStaff);
          if (staff && staff.status === 'active') {
            reviewPositionId = managerPos.id;
            reviewStaff = staff;
            break;
          }
          currentPosId = managerPos.reportsToPositionId;
        }
      } else if (dr.category.toLowerCase().includes('marketing')) {
        reviewPositionId = 'pos_melissa';
        reviewStaff = resolveStaffMember('dir_melissa_gagliardi_33', workspaceId, allStaff);
      }

      // Validate and resolve governing SOP (never silently substitute unrelated SOPs)
      let governingSopId: string | undefined = undefined;
      let governingSopVersion: string | undefined = undefined;
      if (dr.sopId) {
        const sopVal = validateSopCompatibility(dr.sopId, dr.category, workspaceId);
        if (sopVal.valid) {
          governingSopId = dr.sopId;
          governingSopVersion = sopVal.sopVersion || '1';
        }
      }

      // Parse SLA hours
      let slaHours = 24;
      if (dr.sla) {
        const match = dr.sla.match(/(\d+)\s*hour/i);
        if (match) slaHours = parseInt(match[1], 10);
      }

      const ruleId = dr.id || `rule_pub_${idx + 1}_${dr.category.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

      publishedRules.push({
        id: ruleId,
        policy_id: policyId,
        workspace_id: workspaceId,
        rule_index: idx,
        category: dr.category,
        subcategory: undefined,
        display_name: dr.displayName || dr.category,
        match_keywords: [dr.category.toLowerCase()],
        office_condition: dr.officeCondition,
        primary_position_id: dr.primaryOwnerPositionId,
        primary_role_id: primaryPos?.roleIds?.[0],
        primary_staff_id: primaryStaff?.id || 'dir_melissa_gagliardi_33',
        review_position_id: reviewPositionId,
        review_role_id: undefined,
        review_staff_id: reviewStaff?.id,
        backup_position_id: dr.backupOwnerPositionId,
        backup_staff_id: backupStaff?.id,
        governing_sop_id: governingSopId,
        governing_sop_version: governingSopVersion,
        sla_hours: slaHours,
        sla_display: dr.sla || '24 hours',
        escalation_policy_id: dr.escalationPolicyId,
        status: 'active',
        metadata: {
          postAssignmentSteps: dr.postAssignmentSteps || [],
          toolConnected: dr.toolConnected
        },
        created_at: now
      });
    });

    const validation = this.validatePolicyBeforePublish(workspaceId, model);

    const policy: PublishedRoutingPolicy = {
      id: policyId,
      workspace_id: workspaceId,
      version,
      published_by: authorUser,
      published_by_user_id: authorUserId,
      published_at: now,
      is_active: true,
      rules_count: publishedRules.length,
      metadata: {
        validationWarnings: validation.warnings,
        positionCount: model.positions.length
      },
      created_at: now,
      updated_at: now
    };

    return { policy, rules: publishedRules };
  },

  /**
   * Synchronously publishes the current draft Role & Escalation Map.
   */
  publishOrgChartRoutingPolicySync(
    workspaceId: string,
    authorUser: string = 'system',
    authorUserId?: string
  ): { policy: PublishedRoutingPolicy; rules: PublishedRoutingRule[] } {
    const model = this.getOrgChart(workspaceId);
    const validation = this.validatePolicyBeforePublish(workspaceId, model);

    if (!validation.valid) {
      throw new Error(`Cannot publish routing policy due to validation errors:\n- ${validation.errors.join('\n- ')}`);
    }

    ensureStorage();
    const pubPath = getPublishedPolicyPath(workspaceId);
    let currentVersion = 0;
    try {
      if (fs.existsSync(pubPath)) {
        const raw = fs.readFileSync(pubPath, 'utf-8');
        const parsed = JSON.parse(raw);
        currentVersion = parsed?.policy?.version || 0;
      }
    } catch {
      // ignore
    }

    const newVersion = currentVersion + 1;
    const { policy, rules } = this.buildPublishedPolicyData(workspaceId, model, newVersion, authorUser, authorUserId);

    try {
      fs.writeFileSync(pubPath, JSON.stringify({ policy, rules }, null, 2), 'utf-8');
    } catch (fileErr) {
      console.error('[OrgChartRepo] Failed to save published policy file backup:', fileErr);
    }

    this.logAudit({
      workspaceId,
      action: 'publish_routing_policy',
      entityType: 'model',
      entityId: policy.id,
      previousValue: { version: currentVersion },
      newValue: { version: newVersion, rulesCount: rules.length },
      performedBy: authorUser,
      notes: `Published Role & Escalation Map v${newVersion} with ${rules.length} executable rules (sync)`
    });

    cachedActivePolicies.set(workspaceId, { policy, rules });
    return { policy, rules };
  },

  /**
   * Publishes the current draft Role & Escalation Map as an immutable, versioned routing policy.
   */
  async publishOrgChartRoutingPolicy(
    workspaceId: string,
    authorUser: string = 'system',
    authorUserId?: string
  ): Promise<{ policy: PublishedRoutingPolicy; rules: PublishedRoutingRule[] }> {
    const model = this.getOrgChart(workspaceId);
    const validation = this.validatePolicyBeforePublish(workspaceId, model);

    if (!validation.valid) {
      throw new Error(`Cannot publish routing policy due to validation errors:\n- ${validation.errors.join('\n- ')}`);
    }

    // Determine new version
    const existing = await this.getPublishedPolicy(workspaceId);
    const newVersion = (existing?.policy?.version || 0) + 1;
    const { policy, rules: publishedRules } = this.buildPublishedPolicyData(workspaceId, model, newVersion, authorUser, authorUserId);

    // 1. PostgreSQL Persistence (if database available)
    try {
      const { getDbPool: getPool, storageDriver } = await import('./repositories.js');
      if (storageDriver === 'database') {
        const pool = getPool();
        if (pool) {
          await pool.query('BEGIN');
          // Deactivate previous active policies for this workspace
          await pool.query(
            'UPDATE published_routing_policies SET is_active = false, updated_at = NOW() WHERE workspace_id = $1',
            [workspaceId]
          );

          // Insert new policy
          await pool.query(
            `INSERT INTO published_routing_policies (
              id, workspace_id, version, published_by, published_by_user_id, published_at, is_active, rules_count, metadata, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              policy.id, policy.workspace_id, policy.version, policy.published_by, policy.published_by_user_id || null,
              policy.published_at, policy.is_active, policy.rules_count, JSON.stringify(policy.metadata),
              policy.created_at, policy.updated_at
            ]
          );

          // Insert rules
          for (const r of publishedRules) {
            await pool.query(
              `INSERT INTO published_routing_rules (
                id, policy_id, workspace_id, rule_index, category, subcategory, display_name, match_keywords, office_condition,
                primary_position_id, primary_role_id, primary_staff_id, review_position_id, review_role_id, review_staff_id,
                backup_position_id, backup_staff_id, governing_sop_id, governing_sop_version, sla_hours, sla_display,
                escalation_policy_id, status, metadata, created_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
              )`,
              [
                r.id, r.policy_id, r.workspace_id, r.rule_index, r.category, r.subcategory || null, r.display_name || null,
                r.match_keywords, JSON.stringify(r.office_condition || null),
                r.primary_position_id, r.primary_role_id || null, r.primary_staff_id,
                r.review_position_id || null, r.review_role_id || null, r.review_staff_id || null,
                r.backup_position_id || null, r.backup_staff_id || null,
                r.governing_sop_id || null, r.governing_sop_version || null,
                r.sla_hours, r.sla_display, r.escalation_policy_id || null, r.status,
                JSON.stringify(r.metadata || {}), r.created_at
              ]
            );
          }
          await pool.query('COMMIT');
        }
      }
    } catch (dbErr) {
      console.warn('[OrgChartRepo] Database persistence for published policy failed, using disk fallback:', dbErr);
    }

    // 2. Backup File Persistence
    try {
      ensureStorage();
      const pubPath = getPublishedPolicyPath(workspaceId);
      fs.writeFileSync(pubPath, JSON.stringify({ policy, rules: publishedRules }, null, 2), 'utf-8');
    } catch (fileErr) {
      console.error('[OrgChartRepo] Failed to save published policy file backup:', fileErr);
    }

    this.logAudit({
      workspaceId,
      action: 'publish_routing_policy',
      entityType: 'model',
      entityId: policy.id,
      previousValue: { version: existing?.policy?.version || 0 },
      newValue: { version: newVersion, rulesCount: publishedRules.length },
      performedBy: authorUser,
      notes: `Published Role & Escalation Map v${newVersion} with ${publishedRules.length} executable rules`
    });

    cachedActivePolicies.set(workspaceId, { policy, rules: publishedRules, cachedAt: Date.now() });
    return { policy, rules: publishedRules };
  },

  /**
   * Retrieves the active published routing policy and rules for a workspace.
   */
  async getPublishedPolicy(workspaceId: string): Promise<{ policy: PublishedRoutingPolicy; rules: PublishedRoutingRule[] } | null> {
    // 1. Try Database
    try {
      const { getDbPool: getPool, storageDriver } = await import('./repositories.js');
      if (storageDriver === 'database') {
        const pool = getPool();
        if (pool) {
          const policyRes = await pool.query(
            'SELECT * FROM published_routing_policies WHERE workspace_id = $1 AND is_active = true ORDER BY version DESC LIMIT 1',
            [workspaceId]
          );
          if (policyRes.rows.length > 0) {
            const p = policyRes.rows[0];
            const policy: PublishedRoutingPolicy = {
              id: p.id,
              workspace_id: p.workspace_id,
              version: p.version,
              published_by: p.published_by,
              published_by_user_id: p.published_by_user_id,
              published_at: p.published_at?.toISOString ? p.published_at.toISOString() : String(p.published_at),
              is_active: p.is_active,
              rules_count: p.rules_count,
              validation_hash: p.validation_hash,
              metadata: p.metadata || {},
              created_at: p.created_at?.toISOString ? p.created_at.toISOString() : String(p.created_at),
              updated_at: p.updated_at?.toISOString ? p.updated_at.toISOString() : String(p.updated_at)
            };

            const rulesRes = await pool.query(
              'SELECT * FROM published_routing_rules WHERE policy_id = $1 AND status = $2 ORDER BY rule_index ASC',
              [policy.id, 'active']
            );

            const rules: PublishedRoutingRule[] = rulesRes.rows.map(r => ({
              id: r.id,
              policy_id: r.policy_id,
              workspace_id: r.workspace_id,
              rule_index: r.rule_index,
              category: r.category,
              subcategory: r.subcategory,
              display_name: r.display_name,
              match_keywords: r.match_keywords || [],
              office_condition: r.office_condition,
              primary_position_id: r.primary_position_id,
              primary_role_id: r.primary_role_id,
              primary_staff_id: r.primary_staff_id,
              review_position_id: r.review_position_id,
              review_role_id: r.review_role_id,
              review_staff_id: r.review_staff_id,
              backup_position_id: r.backup_position_id,
              backup_staff_id: r.backup_staff_id,
              governing_sop_id: r.governing_sop_id,
              governing_sop_version: r.governing_sop_version,
              sla_hours: r.sla_hours || 24,
              sla_display: r.sla_display || '24 hours',
              escalation_policy_id: r.escalation_policy_id,
              status: r.status,
              metadata: r.metadata || {},
              created_at: r.created_at?.toISOString ? r.created_at.toISOString() : String(r.created_at)
            }));

            const result: CachedPolicyEntry = { policy, rules, cachedAt: Date.now() };
            cachedActivePolicies.set(workspaceId, result);
            if (workspaceId === 'ws_wilmington') {
              notifyPolicyReady();
            }
            return result;
          }
        }
      }
    } catch (dbErr) {
      // Non-blocking, fallback to disk
    }

    // 2. Try Disk Fallback
    try {
      ensureStorage();
      const pubPath = getPublishedPolicyPath(workspaceId);
      if (fs.existsSync(pubPath)) {
        const raw = fs.readFileSync(pubPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.policy && parsed.rules) {
          const entry: CachedPolicyEntry = { policy: parsed.policy, rules: parsed.rules, cachedAt: Date.now() };
          cachedActivePolicies.set(workspaceId, entry);
          if (workspaceId === 'ws_wilmington') {
            notifyPolicyReady();
          }
          return entry;
        }
      }
    } catch {
      // ignore
    }

    return null;
  },

  /**
   * Synchronous accessor for published routing policy (using memory cache and local file storage).
   * Strictly reads existing published policy; never auto-publishes an active policy on read.
   */
  getPublishedPolicySync(workspaceId: string): { policy: PublishedRoutingPolicy; rules: PublishedRoutingRule[] } | null {
    const inMemory = cachedActivePolicies.get(workspaceId);
    if (inMemory && inMemory.policy && inMemory.rules && inMemory.rules.length > 0) {
      // If cache TTL expired, trigger asynchronous refresh from PostgreSQL
      if (Date.now() - (inMemory.cachedAt || 0) > POLICY_CACHE_TTL_MS) {
        this.getPublishedPolicy(workspaceId).catch(err => {
          console.warn(`[OrgChartRepo] Background policy refresh failed for ${workspaceId}:`, err?.message || err);
        });
      }
      return inMemory;
    }

    try {
      ensureStorage();
      const pubPath = getPublishedPolicyPath(workspaceId);
      if (fs.existsSync(pubPath)) {
        const raw = fs.readFileSync(pubPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.policy && parsed.rules && parsed.rules.length > 0) {
          const entry: CachedPolicyEntry = { policy: parsed.policy, rules: parsed.rules, cachedAt: Date.now() };
          cachedActivePolicies.set(workspaceId, entry);
          if (workspaceId === 'ws_wilmington') {
            notifyPolicyReady();
          }
          return entry;
        }
      }
    } catch {
      // ignore
    }
    return null;
  }
};

export async function refreshPublishedPolicyCache(workspaceId: string): Promise<{ policy: PublishedRoutingPolicy; rules: PublishedRoutingRule[] } | null> {
  return orgChartRepository.getPublishedPolicy(workspaceId);
}

