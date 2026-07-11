/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { rechatClient } from './rechatClient';
import { normalizeRechatDeal, normalizeRechatContact, normalizeRechatTask } from '../../../src/integrations/rechat/rechatMappings';
import { ShapeworkRechatDeal, ShapeworkRechatContact, ShapeworkRechatTask } from '../../../src/integrations/rechat/rechatTypes';

/**
 * Helper to log audit events into dbState.
 */
function logServerAuditEvent(dbState: any, user: string, role: string, desc: string, category: string, impact = 'General') {
  const newAudit = {
    id: `audit_rechat_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    user_name: user,
    user_role: role,
    action_description: desc,
    impact_area: category,
    impact_property: impact,
    rollback_available: false
  };
  dbState.auditEvents = [newAudit, ...dbState.auditEvents];
  return newAudit;
}

/**
 * Helper to propose a Rechat writeback action (approval-gated OutboundAction)
 */
export function proposeRechatWriteback(
  dbState: any,
  workspaceId: string,
  dealId: string,
  propertyAddress: string,
  taskTitle: string,
  taskDescription: string,
  assigneeName: string,
  dueDate: string,
  reason: string,
  evidence: string
) {
  const proposalId = `p_rechat_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const newProposal = {
    id: proposalId,
    workspaceId,
    transaction_id: dealId,
    property_address: propertyAddress,
    action_type: 'draft_email', // Maps to standard ActionProposal UI types
    title: `Create Rechat Task: ${taskTitle}`,
    description: taskDescription,
    state: 'awaiting_approval' as const,
    confidence: 0.95,
    created_at: new Date().toISOString(),
    // Custom payload for RechatWritebackPreview
    isRechatWriteback: true,
    rechatWriteback: {
      actionType: 'Create Rechat Task',
      recordId: dealId,
      recordType: 'Deal',
      recordTitle: propertyAddress,
      taskTitle,
      taskDescription,
      assigneeName,
      dueDate,
      whyRecommends: reason,
      evidence
    }
  };
  
  dbState.actionProposals = [newProposal, ...dbState.actionProposals];
  console.log(`[Rechat Webhook Processor] Proposed approval-gated writeback: "${taskTitle}"`);
}

export class RechatWebhookProcessor {
  public async processEvent(dbState: any, topic: string, eventId: string, brandId: string, recordId: string, rawPayload: Record<string, any>): Promise<any> {
    console.log(`[Rechat Webhook Processor] Processing verified webhook topic: ${topic}, recordId: ${recordId}`);
    const workspaceId = rawPayload.workspaceId || 'nest-realty-demo';
    
    // Log baseline verification audit event
    logServerAuditEvent(
      dbState,
      'Rechat Webhook Gateway',
      'Integration System',
      `Verified HMAC-SHA256 signature for Rechat event ${eventId} (Topic: ${topic})`,
      'Webhooks',
      recordId
    );

    if (topic === 'Deals') {
      // 1. Fetch full record context through Rechat API before making decision
      const rawDeal = await rechatClient.getDeal(recordId);
      if (!rawDeal) {
        console.error(`[Rechat Webhook Processor] Could not fetch deal detail for ID: ${recordId}`);
        return { status: 'error', message: 'Deal details fetch failed' };
      }

      // 2. Normalize deal data
      const normalizedDeal = normalizeRechatDeal(rawDeal);
      console.log(`[Rechat Webhook Processor] Normalized deal details:`, normalizedDeal.title);

      // 3. Update dbState transactions list
      const existingTx = dbState.transactions.find((t: any) => t.id === recordId || t.property_address?.includes(normalizedDeal.title));
      if (existingTx) {
        existingTx.current_stage = (normalizedDeal.stage === 'under_contract' ? 'financing_milestone' : existingTx.current_stage);
        existingTx.latest_update = `Rechat sync: Deal Stage updated to ${normalizedDeal.stage || 'active'}.`;
      } else {
        // Add new transaction
        const newTx = {
          id: normalizedDeal.rechatId,
          property_address: normalizedDeal.propertyAddress || normalizedDeal.title,
          client_name: normalizedDeal.roles.find(r => r.role === 'Buyer' || r.role === 'Seller')?.name || 'Anonymous Client',
          buyer_or_seller: (normalizedDeal.dealType === 'Selling' ? 'seller' : 'buyer') as 'buyer' | 'seller',
          responsible_agent_id: 'agent_alex_carter',
          transaction_coordinator_id: 'agent_diane_ross',
          current_stage: 'financing_milestone' as const,
          expected_closing_date: normalizedDeal.closingDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          health_score: 95,
          risk_level: 'watch' as const,
          risk_reasons: normalizedDeal.missingFields,
          outstanding_milestones_count: normalizedDeal.missingFields.length,
          latest_update: 'Rechat webhook: new under-contract deal registered.',
          revenue: 12500,
          waiting_on: 'None' as const,
          next_action: 'Perform intake checklist audit',
          last_verified_update: new Date().toISOString()
        };
        dbState.transactions.push(newTx);
      }

      // 4. Run Deal Intake Guard & propose gated writebacks for gaps
      if (normalizedDeal.missingFields.length > 0) {
        normalizedDeal.missingFields.forEach(gap => {
          if (gap === 'missing intake form') {
            proposeRechatWriteback(
              dbState,
              workspaceId,
              normalizedDeal.rechatId,
              normalizedDeal.propertyAddress || normalizedDeal.title,
              'Submit Brokerage Intake Form',
              'Complete the missing transaction intake sheet for compliance filing.',
              'Emma Watson',
              new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              'Deal Intake Guard: Missing intake form blocks closing file preparation.',
              `Rechat transaction detail context for ${normalizedDeal.title} is missing the required intake checklist metadata.`
            );
          } else if (gap === 'missing coordinator') {
            proposeRechatWriteback(
              dbState,
              workspaceId,
              normalizedDeal.rechatId,
              normalizedDeal.propertyAddress || normalizedDeal.title,
              'Assign Transaction Coordinator',
              'Assign a licensed operations assistant or coordinator to this deal.',
              'Sarah Jenkins',
              new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              'Deal Intake Guard: Unassigned file blocks compliance auditing.',
              `Rechat deal role ledger contains zero designated Transaction Coordinator assignments.`
            );
          }
        });
      }

      // 5. Run Closing Compliance Guard if closing date exists
      if (normalizedDeal.closingDate) {
        const daysToClose = Math.ceil((new Date(normalizedDeal.closingDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        if (daysToClose <= 15 && normalizedDeal.missingFields.includes('missing transaction file')) {
          proposeRechatWriteback(
            dbState,
            workspaceId,
            normalizedDeal.rechatId,
            normalizedDeal.propertyAddress || normalizedDeal.title,
            'Verify Executed Closing Files',
            'Verify executed purchase contracts and title disclosures before critical closing room deadlines.',
            'Emma Watson',
            new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            'Closing Compliance Guard: Escrow is closing in 15 days with missing files.',
            `Rechat transaction detail context reports contract files are not uploaded, posing a title insurance lockup risk.`
          );
        }
      }

      logServerAuditEvent(
        dbState,
        'Deal Intake Guard',
        'AI Compliance Specialist',
        `Completed intake audit on deal ${normalizedDeal.title}. Found ${normalizedDeal.missingFields.length} compliance anomalies.`,
        'Deals',
        normalizedDeal.title
      );

      return { status: 'success', normalizedDeal };

    } else if (topic === 'Contacts') {
      const rawContact = await rechatClient.getContact(recordId);
      if (!rawContact) return { status: 'error', message: 'Contact details fetch failed' };

      const normalizedContact = normalizeRechatContact(rawContact);
      console.log(`[Rechat Webhook Processor] Normalized contact details:`, normalizedContact.displayName);

      // Log contact update
      logServerAuditEvent(
        dbState,
        'Contact Sync Agent',
        'CRM Sync Engine',
        `Synced Rechat CRM contact ${normalizedContact.displayName} (Masked PII: ${normalizedContact.emailMasked})`,
        'Contacts',
        normalizedContact.displayName
      );

      return { status: 'success', normalizedContact };

    } else if (topic === 'Showings') {
      // Normalize showing event and associate with listing if possible
      const showingProperty = rawPayload.property_address || rawPayload.property || '109 Woodlawn Boulevard';
      
      logServerAuditEvent(
        dbState,
        'Showings Sync Agent',
        'Integration Gateway',
        `Ingested lockbox showing update for ${showingProperty} via Rechat Webhook.`,
        'Showings',
        showingProperty
      );

      return { status: 'success', property: showingProperty };
    }

    return { status: 'ignored', message: `Unhandled webhook topic: ${topic}` };
  }
}

export const rechatWebhookProcessor = new RechatWebhookProcessor();
