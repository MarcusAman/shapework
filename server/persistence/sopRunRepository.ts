/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * sopRunRepository
 * Repository for active standard operating procedure checklist runs,
 * step-level evidence capture, SLA turnaround tracking, and bottleneck resolution.
 */
import { SopDocument } from '../../src/types/sopWorkflow.js';
import { sopRepository } from './sopRepository.js';

async function getDbPool() {
  if (typeof window !== 'undefined') return null;
  try {
    const { dbPool } = await import('./repositories.js');
    return dbPool;
  } catch {
    return null;
  }
}

export interface SopRunStepRecord {
  id: string;
  runId: string;
  stepNumber: number;
  action: string;
  role: string;
  systemUsed?: string;
  slaHours: number;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  completedById?: string;
  completedByName?: string;
  completedAt?: string;
  evidenceType?: 'url_link' | 'mls_number' | 'photo_upload' | 'text_note' | 'confirmation';
  evidenceValue?: string;
  notes?: string;
  createdAt: string;
}

export interface SopRunEvidenceRecord {
  id: string;
  runStepId: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  uploadedBy?: string;
  uploadedAt: string;
}

export interface SopRunRecord {
  id: string;
  workspaceId: string;
  tenantId: string;
  sopId: string;
  sopVersion: number;
  title: string;
  propertyAddress: string;
  transactionId?: string;
  assigneeId?: string;
  assigneeName: string;
  assigneeRole: string;
  status: 'in_progress' | 'at_risk' | 'awaiting_evidence' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progressPercent: number;
  currentStepNumber: number;
  totalSteps: number;
  targetCompletionAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  steps: SopRunStepRecord[];
}

// In-Memory Storage Cache & Fallback
const memoryRuns: Map<string, SopRunRecord> = new Map();

export const sopRunRepository = {
  async listRuns(
    workspaceId: string,
    filters: {
      status?: string;
      assignee?: string;
      search?: string;
      sopId?: string;
    } = {}
  ): Promise<SopRunRecord[]> {
    this.seedDefaultRunsIfEmpty(workspaceId);

    const dbPool = await getDbPool();
    if (dbPool) {
      try {
        let query = 'SELECT * FROM sop_runs WHERE workspace_id = $1';
        const params: any[] = [workspaceId];

        if (filters.status && filters.status !== 'all') {
          params.push(filters.status);
          query += ` AND status = $${params.length}`;
        }
        if (filters.sopId) {
          params.push(filters.sopId);
          query += ` AND sop_id = $${params.length}`;
        }

        query += ' ORDER BY created_at DESC';
        const res = await dbPool.query(query, params);

        const runs: SopRunRecord[] = [];
        for (const row of res.rows) {
          const stepsRes = await dbPool.query(
            'SELECT * FROM sop_run_steps WHERE run_id = $1 ORDER BY step_number ASC',
            [row.id]
          );
          runs.push({
            id: row.id,
            workspaceId: row.workspace_id,
            tenantId: row.tenant_id,
            sopId: row.sop_id,
            sopVersion: row.sop_version,
            title: row.title,
            propertyAddress: row.property_address,
            transactionId: row.transaction_id,
            assigneeId: row.assignee_id,
            assigneeName: row.assignee_name,
            assigneeRole: row.assignee_role,
            status: row.status,
            priority: row.priority,
            progressPercent: row.progress_percent,
            currentStepNumber: row.current_step_number,
            totalSteps: row.total_steps,
            targetCompletionAt: row.target_completion_at ? new Date(row.target_completion_at).toISOString() : undefined,
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
            updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
            completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
            steps: stepsRes.rows.map(s => ({
              id: s.id,
              runId: s.run_id,
              stepNumber: s.step_number,
              action: s.action,
              role: s.role,
              systemUsed: s.system_used,
              slaHours: s.sla_hours,
              status: s.status,
              completedById: s.completed_by_id,
              completedByName: s.completed_by_name,
              completedAt: s.completed_at ? new Date(s.completed_at).toISOString() : undefined,
              evidenceType: s.evidence_type,
              evidenceValue: s.evidence_value,
              notes: s.notes,
              createdAt: s.created_at
            }))
          });
        }
        return runs;
      } catch (err) {
        console.error('[SopRunRepository] DB listRuns error, falling back to memory:', err);
      }
    }

    // Memory Mode
    let list = Array.from(memoryRuns.values()).filter(r => r.workspaceId === workspaceId);

    if (filters.status && filters.status !== 'all') {
      list = list.filter(r => r.status === filters.status);
    }
    if (filters.assignee && filters.assignee !== 'all') {
      list = list.filter(r => r.assigneeName.toLowerCase().includes(filters.assignee!.toLowerCase()));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(r => 
        r.propertyAddress.toLowerCase().includes(q) || 
        r.title.toLowerCase().includes(q) ||
        r.assigneeName.toLowerCase().includes(q)
      );
    }
    if (filters.sopId) {
      list = list.filter(r => r.sopId === filters.sopId);
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getRunById(runId: string): Promise<SopRunRecord | null> {
    const dbPool = await getDbPool();
    if (dbPool) {
      try {
        const res = await dbPool.query('SELECT * FROM sop_runs WHERE id = $1', [runId]);
        if (res.rows.length > 0) {
          const row = res.rows[0];
          const stepsRes = await dbPool.query(
            'SELECT * FROM sop_run_steps WHERE run_id = $1 ORDER BY step_number ASC',
            [runId]
          );
          return {
            id: row.id,
            workspaceId: row.workspace_id,
            tenantId: row.tenant_id,
            sopId: row.sop_id,
            sopVersion: row.sop_version,
            title: row.title,
            propertyAddress: row.property_address,
            transactionId: row.transaction_id,
            assigneeId: row.assignee_id,
            assigneeName: row.assignee_name,
            assigneeRole: row.assignee_role || 'Transaction Coordinator',
            status: row.status,
            priority: row.priority,
            progressPercent: row.progress_percent,
            currentStepNumber: row.current_step_number,
            totalSteps: row.total_steps,
            targetCompletionAt: row.target_completion_at,
            completedAt: row.completed_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            steps: stepsRes.rows.map(s => ({
              id: s.id,
              runId: s.run_id,
              stepNumber: s.step_number,
              action: s.action,
              role: s.role,
              systemUsed: s.system_used,
              slaHours: s.sla_hours || 24,
              status: s.status,
              completedById: s.completed_by_id,
              completedByName: s.completed_by_name,
              completedAt: s.completed_at,
              evidenceType: s.evidence_type,
              evidenceValue: s.evidence_value,
              notes: s.notes,
              createdAt: s.created_at
            }))
          };
        }
      } catch (err) {
        console.error('[SopRunRepository] DB getRunById error:', err);
      }
    }

    return memoryRuns.get(runId) || null;
  },

  async createRunFromSop(
    sop: SopDocument,
    propertyAddress: string,
    assigneeName: string,
    options: {
      workspaceId?: string;
      tenantId?: string;
      assigneeId?: string;
      assigneeRole?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      transactionId?: string;
      targetCompletionAt?: string;
    } = {}
  ): Promise<SopRunRecord> {
    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const workspaceId = options.workspaceId || 'nest-realty-wilmington';
    const tenantId = options.tenantId || 'tenant_nest_uat';
    const totalSteps = (sop.orderedSteps || []).length || 1;

    // Build step records from SOP orderedSteps
    const steps: SopRunStepRecord[] = (sop.orderedSteps || []).map((s, idx) => ({
      id: `step_${runId}_${s.stepNumber || idx + 1}`,
      runId,
      stepNumber: s.stepNumber || idx + 1,
      action: s.action,
      role: s.role,
      systemUsed: s.systemUsed,
      slaHours: (s.stepNumber === 1 || s.stepNumber === 2) ? 24 : 48,
      status: 'pending',
      createdAt: now
    }));

    const run: SopRunRecord = {
      id: runId,
      workspaceId,
      tenantId,
      sopId: sop.id,
      sopVersion: sop.version || 1,
      title: sop.title,
      propertyAddress,
      transactionId: options.transactionId,
      assigneeId: options.assigneeId || 'usr_melissa',
      assigneeName: assigneeName || 'Melissa Gagliardi',
      assigneeRole: options.assigneeRole || 'Transaction Coordinator',
      status: 'in_progress',
      priority: options.priority || 'medium',
      progressPercent: 0,
      currentStepNumber: 1,
      totalSteps,
      targetCompletionAt: options.targetCompletionAt || new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      createdAt: now,
      updatedAt: now,
      steps
    };

    const dbPool = await getDbPool();
    if (dbPool) {
      try {
        await dbPool.query(
          `INSERT INTO sop_runs 
           (id, workspace_id, tenant_id, sop_id, sop_version, title, property_address, transaction_id, assignee_id, assignee_name, assignee_role, status, priority, progress_percent, current_step_number, total_steps, target_completion_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
          [
            runId, workspaceId, tenantId, sop.id, run.sopVersion, run.title, propertyAddress,
            options.transactionId || null, run.assigneeId, run.assigneeName, run.assigneeRole,
            'in_progress', run.priority, 0, 1, totalSteps, run.targetCompletionAt, now, now
          ]
        );

        for (const s of steps) {
          await dbPool.query(
            `INSERT INTO sop_run_steps 
             (id, run_id, step_number, action, role, system_used, sla_hours, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [s.id, runId, s.stepNumber, s.action, s.role, s.systemUsed || null, s.slaHours, 'pending', now]
          );
        }
      } catch (err) {
        console.error('[SopRunRepository] DB createRunFromSop error:', err);
      }
    }

    memoryRuns.set(runId, run);
    return run;
  },

  async completeStep(
    runId: string,
    stepIdOrNumber: string | number,
    completionData: {
      completedById?: string;
      completedByName?: string;
      evidenceType?: 'url_link' | 'mls_number' | 'photo_upload' | 'text_note' | 'confirmation';
      evidenceValue?: string;
      notes?: string;
    } = {}
  ): Promise<{ run: SopRunRecord; step: SopRunStepRecord } | null> {
    const run = await this.getRunById(runId);
    if (!run) return null;

    const step = run.steps.find(s => 
      s.id === stepIdOrNumber || s.stepNumber === Number(stepIdOrNumber)
    );
    if (!step) return null;

    const now = new Date().toISOString();
    step.status = 'completed';
    step.completedById = completionData.completedById || 'usr_melissa';
    step.completedByName = completionData.completedByName || 'Melissa Gagliardi';
    step.completedAt = now;
    if (completionData.evidenceType) step.evidenceType = completionData.evidenceType;
    if (completionData.evidenceValue) step.evidenceValue = completionData.evidenceValue;
    if (completionData.notes) step.notes = completionData.notes;

    // Recalculate progress
    const completedCount = run.steps.filter(s => s.status === 'completed').length;
    run.progressPercent = Math.round((completedCount / run.totalSteps) * 100);
    
    // Find next uncompleted step
    const nextStep = run.steps.find(s => s.status !== 'completed');
    run.currentStepNumber = nextStep ? nextStep.stepNumber : run.totalSteps;
    run.updatedAt = now;

    if (run.progressPercent === 100) {
      run.status = 'completed';
      run.completedAt = now;
    } else {
      run.status = 'in_progress';
    }

    const dbPoolComplete = await getDbPool();
    if (dbPoolComplete) {
      try {
        await dbPoolComplete.query(
          `UPDATE sop_run_steps 
           SET status = 'completed', completed_by_id = $1, completed_by_name = $2, completed_at = $3, evidence_type = $4, evidence_value = $5, notes = $6
           WHERE id = $7`,
          [step.completedById, step.completedByName, now, step.evidenceType || null, step.evidenceValue || null, step.notes || null, step.id]
        );
        await dbPoolComplete.query(
          `UPDATE sop_runs 
           SET progress_percent = $1, current_step_number = $2, status = $3, completed_at = $4, updated_at = $5
           WHERE id = $6`,
          [run.progressPercent, run.currentStepNumber, run.status, run.completedAt || null, now, runId]
        );
      } catch (err) {
        console.error('[SopRunRepository] DB completeStep error:', err);
      }
    }

    memoryRuns.set(runId, run);
    return { run, step };
  },

  async reopenStep(runId: string, stepIdOrNumber: string | number): Promise<SopRunRecord | null> {
    const run = await this.getRunById(runId);
    if (!run) return null;

    const step = run.steps.find(s => 
      s.id === stepIdOrNumber || s.stepNumber === Number(stepIdOrNumber)
    );
    if (!step) return null;

    const now = new Date().toISOString();
    step.status = 'pending';
    step.completedAt = undefined;
    step.completedById = undefined;
    step.completedByName = undefined;

    const completedCount = run.steps.filter(s => s.status === 'completed').length;
    run.progressPercent = Math.round((completedCount / run.totalSteps) * 100);
    run.status = 'in_progress';
    run.completedAt = undefined;
    run.updatedAt = now;

    const dbPoolReopen = await getDbPool();
    if (dbPoolReopen) {
      try {
        await dbPoolReopen.query(
          `UPDATE sop_run_steps 
           SET status = 'pending', completed_by_id = NULL, completed_by_name = NULL, completed_at = NULL
           WHERE id = $1`,
          [step.id]
        );
        await dbPoolReopen.query(
          `UPDATE sop_runs 
           SET progress_percent = $1, status = 'in_progress', completed_at = NULL, updated_at = $2
           WHERE id = $3`,
          [run.progressPercent, now, runId]
        );
      } catch (err) {
        console.error('[SopRunRepository] DB reopenStep error:', err);
      }
    }

    memoryRuns.set(runId, run);
    return run;
  },

  seedDefaultRunsIfEmpty(workspaceId: string) {
    if (memoryRuns.size === 0) {
      const runId = 'run_seed_carolina_beach_01';
      const now = new Date().toISOString();
      const run: SopRunRecord = {
        id: runId,
        workspaceId: workspaceId || 'nest-realty-wilmington',
        tenantId: 'tenant_nest_uat',
        sopId: 'sop_listing_contract_review',
        sopVersion: 1,
        title: 'Form 2-T Contract Compliance Review',
        propertyAddress: '804 Carolina Beach Ave N, Carolina Beach NC',
        transactionId: 'tx_cb_001',
        assigneeId: 'usr_eric',
        assigneeName: 'Eric Knight',
        assigneeRole: 'Broker-in-Charge',
        status: 'in_progress',
        priority: 'high',
        progressPercent: 25,
        currentStepNumber: 1,
        totalSteps: 4,
        targetCompletionAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
        createdAt: now,
        updatedAt: now,
        steps: [
          {
            id: `step_${runId}_1`,
            runId,
            stepNumber: 1,
            action: 'Verify Due Diligence and Earnest Money receipts',
            role: 'Broker-in-Charge',
            systemUsed: 'Dotloop / NC REALTORS Form 2-T',
            slaHours: 24,
            status: 'in_progress',
            createdAt: now
          }
        ]
      };
      memoryRuns.set(runId, run);
    }
  },

  purgeAllRuns(): void {
    memoryRuns.clear();
  }
};
