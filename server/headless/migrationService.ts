/**
 * Legacy to Runtime Data Migration Service
 * Idempotent conversion utility for consolidating duplicated entities.
 */

export function migrateLegacyToRuntime(dbState: any): void {
  if (!dbState) return;

  // Initialize new collections if not present
  if (!dbState.signals) dbState.signals = [];
  if (!dbState.decisions) dbState.decisions = [];
  if (!dbState.shapeworkJobs) dbState.shapeworkJobs = [];
  if (!dbState.shapeworkJobSteps) dbState.shapeworkJobSteps = [];
  if (!dbState.approvals) dbState.approvals = [];
  if (!dbState.actions) dbState.actions = [];
  if (!dbState.deliveries) dbState.deliveries = [];
  if (!dbState.outcomes) dbState.outcomes = [];
  if (!dbState.receipts) dbState.receipts = [];
  if (!dbState.ownerBriefItems) dbState.ownerBriefItems = [];

  const nowStr = new Date().toISOString();

  // 1. workItems -> shapeworkJobs & shapeworkJobSteps
  const workItems = dbState.workItems || [];
  workItems.forEach((wi: any) => {
    if (!wi.id) return;
    const jobId = `job_migrated_${wi.id}`;
    const stepId = `step_migrated_${wi.id}`;
    const workspaceId = wi.workspaceId || 'nest-realty-demo';

    // Check if already migrated
    const exists = dbState.shapeworkJobs.some((j: any) => j.id === jobId);
    if (!exists) {
      dbState.shapeworkJobs.push({
        id: jobId,
        workspaceId,
        signalId: null,
        decisionId: null,
        requestedBy: 'System Migration',
        requestText: wi.title || 'Migrated Task',
        workflowKey: wi.type || 'general',
        workflowName: wi.title || 'Migrated Task',
        status: wi.status === 'completed' ? 'completed' : 'active',
        confidence: 1.0,
        currentStep: stepId,
        humanReviewRequired: wi.approvalRequired || false,
        ownerWorthy: wi.ownerRole === 'owner',
        createdAt: wi.createdAt || nowStr,
        updatedAt: nowStr,
        completedAt: wi.status === 'completed' ? nowStr : null,
        migrationSourceRef: wi.id
      });
    }

    const stepExists = dbState.shapeworkJobSteps.some((s: any) => s.id === stepId);
    if (!stepExists) {
      dbState.shapeworkJobSteps.push({
        id: stepId,
        workspaceId,
        jobId,
        stepOrder: 1,
        title: wi.title || 'Migrated Task Step',
        description: wi.title || 'Migrated Task Step',
        channel: 'internal_route',
        status: wi.status === 'completed' ? 'completed' : 'pending',
        requiresApproval: wi.approvalRequired || false,
        riskLevel: wi.priority === 'high' || wi.priority === 'critical' ? 'high' : 'low',
        assignedRole: wi.ownerRole || 'operations_lead',
        approvedBy: wi.status === 'completed' && wi.approvalRequired ? 'System' : null,
        approvedAt: wi.status === 'completed' && wi.approvalRequired ? nowStr : null,
        outputSummary: wi.title,
        safePayloadSummary: wi.title,
        createdAt: wi.createdAt || nowStr,
        updatedAt: nowStr
      });
    }
  });

  // 2. actionProposals -> approvals
  const actionProposals = dbState.actionProposals || [];
  actionProposals.forEach((ap: any) => {
    if (!ap.id) return;
    const approvalId = `approval_migrated_${ap.id}`;
    const workspaceId = ap.workspaceId || 'nest-realty-demo';
    const exists = dbState.approvals.some((a: any) => a.id === approvalId);
    if (!exists) {
      let approvalStatus = 'pending';
      if (ap.state === 'approved' || ap.status === 'approved') approvalStatus = 'approved';
      if (ap.state === 'rejected' || ap.status === 'rejected') approvalStatus = 'rejected';

      dbState.approvals.push({
        id: approvalId,
        workspaceId,
        jobId: ap.jobId || `job_migrated_${ap.id}`,
        stepId: ap.stepId || `step_migrated_${ap.id}`,
        approvalType: ap.actionType || 'legacy_migration',
        title: ap.title || 'Migrated Proposal',
        summary: ap.proposedAction?.summary || ap.title || 'Migrated Proposal',
        recipientRole: 'owner',
        recipientDisplay: 'Broker Owner',
        channel: 'email',
        draftActionSummary: JSON.stringify(ap.proposedAction || ap),
        riskLevel: 'medium',
        status: approvalStatus,
        createdAt: ap.createdAt || nowStr,
        migrationSourceRef: ap.id
      });
    }
  });

  // 3. shapeworkOutputs -> outcomes & receipts
  const shapeworkOutputs = dbState.shapeworkOutputs || [];
  shapeworkOutputs.forEach((so: any) => {
    if (!so.id) return;
    const outcomeId = `outcome_migrated_${so.id}`;
    const receiptId = `receipt_migrated_${so.id}`;
    const workspaceId = so.workspaceId || 'nest-realty-demo';

    const outcomeExists = dbState.outcomes.some((o: any) => o.id === outcomeId);
    if (!outcomeExists) {
      dbState.outcomes.push({
        id: outcomeId,
        workspaceId,
        jobId: so.jobId || `job_migrated_${so.id}`,
        stepId: so.stepId || `step_migrated_${so.id}`,
        actionId: null,
        outcomeType: 'success',
        title: so.title || 'Migrated Output',
        summary: so.summary || 'Migrated Output',
        followUpRequired: false,
        ownerBriefEligible: true,
        createdAt: so.createdAt || nowStr,
        migrationSourceRef: so.id
      });
    }

    const receiptExists = dbState.receipts.some((r: any) => r.id === receiptId);
    if (!receiptExists) {
      dbState.receipts.push({
        id: receiptId,
        workspaceId,
        jobId: so.jobId || `job_migrated_${so.id}`,
        outcomeId,
        title: so.title || 'Migrated Output',
        summary: so.summary || 'Migrated Output',
        actionTaken: so.action_taken || so.title || 'Migrated Action',
        completedTime: so.createdAt || nowStr,
        sourceWorkflow: so.source_workflow || 'legacy_migration',
        ownerBriefUpdated: true,
        followUpNeeded: false,
        createdAt: so.createdAt || nowStr,
        migrationSourceRef: so.id
      });
    }
  });

  // 4. quickWins -> ownerBriefItems
  const quickWins = dbState.quickWins || [];
  quickWins.forEach((qw: any) => {
    if (!qw.id) return;
    const briefId = `brief_migrated_${qw.id}`;
    const workspaceId = qw.workspaceId || 'nest-realty-demo';
    const exists = dbState.ownerBriefItems.some((b: any) => b.id === briefId);
    if (!exists) {
      dbState.ownerBriefItems.push({
        id: briefId,
        workspaceId,
        sourceType: qw.sourceType || 'legacy_migration',
        sourceId: qw.sourceId || qw.id,
        title: qw.title || 'Migrated Win',
        summary: qw.summary || qw.title || 'Migrated Win Description',
        category: qw.category || 'win',
        priority: qw.priority || 'medium',
        createdAt: qw.createdAt || nowStr,
        migrationSourceRef: qw.id
      });
    }
  });

  // 5. integrationEvents -> signals
  const integrationEvents = dbState.integrationEvents || [];
  integrationEvents.forEach((ie: any) => {
    if (!ie.id) return;
    const signalId = `signal_migrated_${ie.id}`;
    const workspaceId = ie.workspaceId || 'nest-realty-demo';
    const exists = dbState.signals.some((s: any) => s.id === signalId);
    if (!exists) {
      dbState.signals.push({
        id: signalId,
        workspaceId,
        sourceType: ie.source || 'webhook',
        sourceName: ie.source || 'webhook',
        signalType: ie.eventType || 'event',
        title: ie.title || ie.eventType || 'Migrated Signal',
        summary: ie.payload || ie.description || 'Migrated Signal Description',
        safePayloadSummary: ie.payload || ie.description || 'Migrated Signal Description',
        rawPayloadRef: null,
        linkedEntityType: 'transaction',
        linkedEntityId: ie.relatedId || null,
        receivedAt: ie.timestamp || nowStr,
        createdAt: ie.timestamp || nowStr,
        migrationSourceRef: ie.id
      });
    }
  });
}

/**
 * Derives and populates legacy compatibility collections from current runtime collections.
 */
export function syncRuntimeToLegacy(dbState: any): void {
  if (!dbState) return;

  // 1. workItems derived from shapeworkJobs
  if (dbState.shapeworkJobs) {
    dbState.workItems = dbState.shapeworkJobs.map((job: any) => {
      const step = (dbState.shapeworkJobSteps || []).find((s: any) => s.jobId === job.id && s.id === job.currentStep)
                 || (dbState.shapeworkJobSteps || []).filter((s: any) => s.jobId === job.id)[0];
      const legacyId = job.id.replace('job_migrated_', '');
      return {
        id: legacyId,
        workspaceId: job.workspaceId,
        type: job.workflowKey || 'general',
        title: job.workflowName || job.requestText || 'Task',
        source: 'system',
        relatedType: 'transaction',
        relatedId: job.signalId || null,
        relatedLabel: job.requestText || '',
        ownerRole: step?.assignedRole || 'operations_lead',
        priority: job.ownerWorthy ? 'high' : 'medium',
        status: job.status === 'completed' ? 'completed' : 'pending',
        recommendedNextAction: step?.description || '',
        approvalRequired: job.humanReviewRequired || false,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      };
    });
  }

  // 2. actionProposals derived from approvals
  if (dbState.approvals) {
    dbState.actionProposals = dbState.approvals.map((app: any) => {
      const legacyId = app.id.replace('approval_migrated_', '');
      let proposedAction = {};
      try {
        proposedAction = typeof app.draftActionSummary === 'string' ? JSON.parse(app.draftActionSummary) : app.draftActionSummary;
      } catch {
        proposedAction = { summary: app.summary };
      }
      const legacyStatus = app.status === 'approved' ? 'approved' : app.status === 'rejected' ? 'rejected' : 'pending';
      return {
        id: legacyId,
        workspaceId: app.workspaceId,
        title: app.title,
        state: legacyStatus,
        status: legacyStatus,
        proposedAction,
        createdAt: app.createdAt
      };
    });
  }

  // 3. shapeworkOutputs derived from receipts
  if (dbState.receipts) {
    dbState.shapeworkOutputs = dbState.receipts.map((rec: any) => {
      const legacyId = rec.id.replace('receipt_migrated_', '');
      return {
        id: legacyId,
        workspaceId: rec.workspaceId,
        title: rec.title,
        summary: rec.summary,
        action_taken: rec.actionTaken,
        outcome: 'success',
        createdAt: rec.createdAt
      };
    });
  }

  // 4. quickWins derived from ownerBriefItems
  if (dbState.ownerBriefItems) {
    dbState.quickWins = dbState.ownerBriefItems.map((bi: any) => {
      const legacyId = bi.id.replace('brief_migrated_', '');
      return {
        id: legacyId,
        workspaceId: bi.workspaceId,
        sourceType: bi.sourceType,
        sourceId: bi.sourceId,
        title: bi.title,
        summary: bi.summary,
        category: bi.category,
        priority: bi.priority,
        createdAt: bi.createdAt
      };
    });
  }

  // 5. integrationEvents derived from signals
  if (dbState.signals) {
    dbState.integrationEvents = dbState.signals.map((sig: any) => {
      const legacyId = sig.id.replace('signal_migrated_', '');
      return {
        id: legacyId,
        workspaceId: sig.workspaceId,
        source: sig.sourceType,
        eventType: sig.signalType,
        title: sig.title,
        description: sig.summary,
        payload: sig.safePayloadSummary,
        timestamp: sig.receivedAt
      };
    });
  }
}
