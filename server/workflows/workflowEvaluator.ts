/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkflowEvaluationResult } from '../../src/types/launch';

export function runWorkflowEvaluation(
  workspaceId: string,
  event: any,
  dbState: any
): WorkflowEvaluationResult {
  const actions: any[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  let summary = 'Event analyzed; no urgent operations actions triggered.';

  const eventType = event.type || event.eventType || 'loop_updated';
  const loopName = event.loopName || event.loop?.name || 'New Loop';
  const loopId = event.loopId || event.loop?.id || 'loop_000';

  // 1. Workflow Check: Missing Rechat CRM Link (New Loop Ingestion)
  if (eventType === 'loop_created') {
    const deals = dbState.transactions || [];
    const isMapped = deals.some((d: any) => d.workspaceId === workspaceId && d.property_address === loopName);
    
    if (!isMapped) {
      riskLevel = 'medium';
      summary = `New loop "${loopName}" created in Dotloop but lacks matching Rechat CRM folders.`;
      
      actions.push({
        type: 'create_work_item',
        reason: 'Missing Deal Intake Linkage',
        requiresApproval: false,
        payload: {
          id: `iss_${Date.now()}_intake`,
          workspaceId,
          transaction_id: `tr_${loopId}`,
          property_address: loopName,
          category: 'Intake Guard',
          title: 'Missing Rechat CRM Link',
          description: `A loop was created in Dotloop for "${loopName}" but no Rechat directory alignment exists.`,
          severity: 'medium',
          status: 'open',
          detected_at: new Date().toISOString(),
          remediation_action: 'Align CRM records or import target deal details'
        }
      });
    }
  }

  // 2. Workflow Check: Compliance Document near Closing
  if (eventType === 'document_signed') {
    const docName = event.documentName || event.document?.name || 'Document.pdf';
    const isClosingSoon = true; // Assume closing alert threshold is active

    if (isClosingSoon) {
      riskLevel = 'high';
      summary = `Critical compliance document "${docName}" uploaded on ${loopName} near target closing window.`;
      
      actions.push({
        type: 'create_work_item',
        reason: 'Closing Compliance Review',
        requiresApproval: false,
        payload: {
          id: `iss_${Date.now()}_compliance`,
          workspaceId,
          transaction_id: `tr_${loopId}`,
          property_address: loopName,
          category: 'Closing Compliance',
          title: 'Critical Document Uploaded',
          description: `The signed document "${docName}" was uploaded. Compliance partner must sign off before closing wire approval.`,
          severity: 'high',
          status: 'open',
          detected_at: new Date().toISOString(),
          remediation_action: 'Run document compliance review'
        }
      });
    }
  }

  // 3. Workflow Check: Low Confidence Match
  if (eventType === 'loop_match_attempted' && event.confidence < 0.85) {
    riskLevel = 'medium';
    summary = `Dotloop to Rechat match confidence score is only ${Math.round(event.confidence * 100)}% for loop "${loopName}".`;
    
    // Create Approval Center proposal card (Phase 7)
    actions.push({
      type: 'create_approval',
      reason: 'Low Match Confidence Override',
      requiresApproval: true,
      payload: {
        id: `app_${Date.now()}_match`,
        workspaceId,
        type: 'match_approval',
        title: `Verify Rechat connection match for loop "${loopName}"`,
        proposingAgent: 'Record Matcher Agent',
        targetRecord: loopName,
        recordType: 'deal',
        confidence: event.confidence,
        riskLevel: 'at_risk',
        policyReason: 'Integration Matching Confidence safeguarding policy',
        evidence: `Partial MLS address match identified. Match rating: ${Math.round(event.confidence * 100)}%. Confirm linkage.`,
        beforeValue: 'Unlinked Event',
        afterValue: `Linked to Rechat Deal: ${event.suggestedDealTitle || 'Address Match'}`
      }
    });
  }

  // 4. Workflow Check: Escalated Communication Signal
  if (eventType === 'owner_escalation_signal') {
    riskLevel = 'high';
    summary = `Critical client email/SMS escalation triggered for property: ${loopName}`;
    
    actions.push({
      type: 'create_work_item',
      reason: 'Owner Shield Escalation Rule',
      requiresApproval: false,
      payload: {
        id: `iss_${Date.now()}_escalation`,
        workspaceId,
        transaction_id: `tr_${loopId}`,
        property_address: loopName,
        category: 'Owner Shield',
        title: 'Overdue SLA Escalation Notice',
        description: `Agent unresponsiveness alert. Client has requested financing confirmation multiple times with no reply.`,
        severity: 'high',
        status: 'open',
        detected_at: new Date().toISOString(),
        remediation_action: 'Notify Managing Broker / Owner'
      }
    });
  }

  // 5. Default: Audit Event logged for every ingestion
  actions.push({
    type: 'create_audit',
    reason: 'Ingestion Audit Log',
    requiresApproval: false,
    payload: {
      id: `aud_${Date.now()}_eval`,
      workspaceId,
      timestamp: new Date().toISOString(),
      actor: 'System Evaluator',
      action: `Processed event "${eventType}" for loop "${loopName}". Risk: ${riskLevel.toUpperCase()}`,
      category: 'System'
    }
  });

  return {
    workspaceId,
    sourceEventId: event.id || `evt_${Date.now()}`,
    matchedRecordId: loopId,
    actions,
    riskLevel,
    summary
  };
}
