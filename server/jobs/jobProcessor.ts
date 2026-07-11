/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Job } from './jobTypes';
import { runWorkflowEvaluation } from '../workflows/workflowEvaluator';
import { IntegrationSyncRun } from '../../src/types/launch';

export async function executeJobProcessor(job: Job, dbState: any): Promise<void> {
  const wsId = job.workspaceId;

  switch (job.type) {
    case 'rechat_baseline_sync': {
      console.log(`[Job Processor] Running Rechat baseline sync for ${wsId}`);
      
      // Initialize sync runs tracking
      if (!dbState.syncRuns) dbState.syncRuns = [];
      
      const syncRun: IntegrationSyncRun = {
        id: `sync_${Date.now()}`,
        workspaceId: wsId,
        provider: 'rechat',
        syncType: 'baseline',
        status: 'running',
        startedAt: new Date().toISOString(),
        recordsFetched: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsSkipped: 0,
        errors: []
      };
      dbState.syncRuns.unshift(syncRun);

      // Simulate a network baseline sync fetch
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Fetch mock templates or data from Rechat connection
      syncRun.recordsFetched = 15;
      syncRun.recordsCreated = 8;
      syncRun.recordsUpdated = 2;
      syncRun.recordsSkipped = 5;
      syncRun.status = 'succeeded' as const;
      syncRun.completedAt = new Date().toISOString();
      
      // Seed default transactions or listings into workspace if empty
      if ((dbState.transactions || []).filter((t: any) => t.workspaceId === wsId).length === 0) {
        if (!dbState.transactions) dbState.transactions = [];
        dbState.transactions.push({
          id: `tr_init_${Date.now()}`,
          workspaceId: wsId,
          property_address: '109 Woodlawn Dr',
          client_name: 'Diane Ross Client',
          agent_id: 'ag_002',
          agent_name: 'Diane Ross',
          status: 'intake',
          stage: 'Intake Audit',
          closing_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
          source: 'Rechat',
          compliance_score: 50,
          missing_docs_count: 2
        });
      }

      break;
    }

    case 'dotloop_webhook_process': {
      console.log(`[Job Processor] Ingesting API Nation Dotloop webhook for ${wsId}`);

      const eventPayload = job.payload.eventPayload;
      if (!eventPayload) {
        throw new Error('Missing eventPayload in webhook job parameters.');
      }

      // Check if it's a test or empty payload
      if (eventPayload.testSignal || eventPayload.type === 'test') {
        console.log('[Job Processor] Webhook test signal confirmed. Recording success.');
        return;
      }

      // Execute Centralized Workflow Evaluation
      const evalResult = runWorkflowEvaluation(wsId, eventPayload, dbState);
      
      // Iterate actions returned by the Workflow Evaluator
      for (const action of evalResult.actions) {
        if (action.type === 'create_work_item') {
          if (!dbState.operationsInbox) dbState.operationsInbox = [];
          dbState.operationsInbox.unshift(action.payload);
        } else if (action.type === 'create_approval') {
          if (!dbState.actionProposals) dbState.actionProposals = [];
          dbState.actionProposals.unshift(action.payload);
        } else if (action.type === 'create_audit') {
          if (!dbState.auditEvents) dbState.auditEvents = [];
          dbState.auditEvents.unshift(action.payload);
        }
      }

      break;
    }

    case 'workflow_evaluate': {
      console.log(`[Job Processor] Running ad-hoc evaluation query for ${wsId}`);
      break;
    }

    case 'approval_execute': {
      console.log(`[Job Processor] Executing approved writeback transmission for ${wsId}`);
      break;
    }

    default:
      console.log(`[Job Processor] Idle task processor for type: ${job.type}`);
  }
}
