import React from 'react';
import { ConnectorDemoResult, ConnectorDemoEvent } from './types';
import { createConnectorAuditEvent } from './connectorAudit';

/**
 * Interface representing the mutable React state setters.
 */
export interface SandboxState {
  transactions: any[];
  setTransactions: React.Dispatch<React.SetStateAction<any[]>>;
  listings: any[];
  setListings: React.Dispatch<React.SetStateAction<any[]>>;
  communications: any[];
  setCommunications: React.Dispatch<React.SetStateAction<any[]>>;
  auditEvents: any[];
  setAuditEvents: React.Dispatch<React.SetStateAction<any[]>>;
  decisions: any[];
  setDecisions: React.Dispatch<React.SetStateAction<any[]>>;
  integrations: any[];
  setIntegrations: React.Dispatch<React.SetStateAction<any[]>>;
}

/**
 * Runs a demo event inside the sandbox workspace, modifying mock databases dynamically.
 */
export async function runDemoEventInSandbox(
  connectorId: string,
  eventId: string,
  event: ConnectorDemoEvent,
  state: SandboxState
): Promise<ConnectorDemoResult> {
  const timestamp = new Date().toISOString();

  // 1. Log audit event
  const auditEvent = createConnectorAuditEvent(
    connectorId,
    `Demo Signal Triggered: "${event.label}". Source: ${event.sourceSystem}.`,
    'Simulation Engine',
    event.id
  );
  state.setAuditEvents((prev) => [auditEvent, ...prev]);

  // 2. Perform state changes based on event ID
  switch (event.id) {
    case 'evt_gmail_clear_to_close': {
      // Gmail signal -> Email Triage -> Transaction Stage -> Action Runtime
      state.setTransactions((prev) =>
        prev.map((tx) =>
          tx.property_address?.includes('Pine') || tx.id === 'tx_2'
            ? {
                ...tx,
                current_stage: 'closing_prep',
                risk_level: 'healthy',
                latest_update: 'Gmail sync: Lender confirmed Clear to Close. Advanced stage.'
              }
            : tx
        )
      );
      break;
    }

    case 'evt_outlook_date_change': {
      // Outlook signal -> Email Triage -> Closing Risk -> approval required
      const newDecision = {
        id: `dec_outlook_${Date.now()}`,
        title: 'Approve Escrow Date Shift: 742 Evergreen Terr',
        description: 'Attorney requested close postponement by 2 days. Requires coordinator signoff.',
        financial_impact: 11200,
        owner: 'Sarah Jenkins (COO)',
        time_remaining: '24 hours',
        why_it_matters: 'Escrow timeline must align with mortgage rate lock expirations.',
        evidence: 'Attorney mail: "Need to push appointment 2 days due to probate delay."',
        recommended_action: 'Approve close extension request'
      };
      state.setDecisions((prev) => [newDecision, ...prev]);
      break;
    }

    case 'evt_gcal_close_delay': {
      // Google Calendar event -> Closing Risk Agent -> risk update -> approval
      state.setTransactions((prev) =>
        prev.map((tx) =>
          tx.property_address?.includes('Evergreen') || tx.id === 'tx_1'
            ? {
                ...tx,
                expected_closing_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                latest_update: 'Google Calendar sync: Closing room reservation delayed 2 days.'
              }
            : tx
        )
      );
      break;
    }

    case 'evt_mscal_review_meeting': {
      // Calendar signal -> AI COO Orchestrator -> internal task/action
      const newDecision = {
        id: `dec_mscal_${Date.now()}`,
        title: 'Conduct Internal TC Review: 908 Colonial Ave',
        description: 'Outlook Calendar sync: coordinator review slot booked for at-risk file.',
        financial_impact: 24500,
        owner: 'Emma Watson',
        time_remaining: '18 hours',
        why_it_matters: 'At-risk files require immediate pipeline re-balancing check.',
        evidence: 'Meeting title: "TC Review slot - Emma & Sarah"',
        recommended_action: 'Accept calendar invite & log checklist outcomes'
      };
      state.setDecisions((prev) => [newDecision, ...prev]);
      break;
    }

    case 'evt_gdrive_disclosure': {
      // Drive signal -> Compliance Agent -> mark document received action
      state.setListings((prev) =>
        prev.map((l) =>
          l.property_address?.includes('Evergreen')
            ? {
                ...l,
                compliance_status: 'approved',
                blocking_items: l.blocking_items.filter((b: string) => !b.toLowerCase().includes('disclosure')),
                launch_checklist: l.launch_checklist?.map((step: any) =>
                  step.step_name?.toLowerCase().includes('disclosure') ? { ...step, status: 'completed' } : step
                )
              }
            : l
        )
      );
      break;
    }

    case 'evt_onedrive_agency': {
      // OneDrive signal -> Compliance Agent -> file status update
      state.setTransactions((prev) =>
        prev.map((tx) =>
          tx.property_address?.includes('Pine')
            ? {
                ...tx,
                latest_update: 'OneDrive Sync: Buyer Agency Agreement uploaded successfully.'
              }
            : tx
        )
      );
      break;
    }

    case 'evt_sharepoint_checklist': {
      // SharePoint signal -> Compliance Agent -> broker review status update
      state.setListings((prev) =>
        prev.map((l) =>
          l.property_address?.includes('Woodlawn')
            ? {
                ...l,
                compliance_status: 'approved'
              }
            : l
        )
      );
      break;
    }

    case 'evt_docusign_disclosure': {
      // DocuSign signal -> Compliance Agent -> document received
      state.setListings((prev) =>
        prev.map((l) =>
          l.property_address?.includes('Evergreen')
            ? {
                ...l,
                compliance_status: 'approved',
                blocking_items: l.blocking_items.filter((b: string) => !b.toLowerCase().includes('disclosure'))
              }
            : l
        )
      );
      break;
    }

    case 'evt_dotloop_sync_failure': {
      // Dotloop signal -> Integration Health -> operational risk
      state.setIntegrations((prev) =>
        prev.map((i) =>
          i.id === 'i_dotloop'
            ? {
                ...i,
                errorsCount: 2,
                recentErrors: ['401 Unauthorized API OAuth token refresh attempt. Stale credentials detected.']
              }
            : i
        )
      );
      break;
    }

    case 'evt_skyslope_missing_file': {
      // SkySlope signal -> Compliance Agent -> compliance exception -> approval center
      const newDecision = {
        id: `dec_skyslope_${Date.now()}`,
        title: 'Checklist Waiver: Missing Buyer Broker Agreement on 102 Pine St',
        description: 'SkySlope check flagged transaction without signed buyer representation agreement.',
        financial_impact: 11200,
        owner: 'Sarah Jenkins (COO)',
        time_remaining: '12 hours',
        why_it_matters: 'State licensing regulations require explicit representation filings before close.',
        evidence: 'SkySlope scan: checklist omission exception.',
        recommended_action: 'Escalate to Emma Watson to procure signature'
      };
      state.setDecisions((prev) => [newDecision, ...prev]);
      break;
    }

    case 'evt_rechat_deal_stage': {
      // Rechat signal -> Transaction Stage Agent -> Operating Memory update
      state.setTransactions((prev) =>
        prev.map((tx) =>
          tx.property_address?.includes('Woodlawn')
            ? {
                ...tx,
                current_stage: 'financing_milestone',
                latest_update: 'Rechat webhook: Deal stage updated to Under Contract.'
              }
            : tx
        )
      );
      break;
    }

    case 'evt_fub_no_response': {
      // Follow Up Boss signal -> Agent Support Agent -> follow-up draft
      const newDecision = {
        id: `dec_fub_${Date.now()}`,
        title: 'Approve Follow-up Draft: Emma Watson re 908 Colonial Ave',
        description: 'FUB detectedEmma Watson has not replied to lender update request for 54 hours.',
        financial_impact: 24500,
        owner: 'Sarah Jenkins (COO)',
        time_remaining: '48 hours',
        why_it_matters: 'Protects lender relationships and prevents loan commitment drops.',
        evidence: 'FUB thread audit: 54 hours elapsed with zero response.',
        recommended_action: 'Send prepared email draft'
      };
      state.setDecisions((prev) => [newDecision, ...prev]);
      break;
    }

    case 'evt_reso_listing_active': {
      // RESO signal -> Listing Launch Agent -> listing readiness update
      state.setListings((prev) =>
        prev.map((l) =>
          l.property_address?.includes('Woodlawn')
            ? {
                ...l,
                status: 'active'
              }
            : l
        )
      );
      break;
    }

    case 'evt_csv_import_run': {
      // CSV signal -> AI COO Orchestrator -> Operating Memory update
      state.setTransactions((prev) => [
        ...prev,
        {
          id: `tx_csv_${Date.now()}`,
          property_address: '154 Glenwood Ave',
          client_name: 'Arthur Pendragon',
          buyer_or_seller: 'buyer',
          responsible_agent_id: 'a_1',
          transaction_coordinator_id: 'tc_1',
          current_stage: 'contract_to_close',
          expected_closing_date: '2026-08-15',
          health_score: 95,
          risk_level: 'healthy',
          risk_reasons: [],
          outstanding_milestones_count: 3,
          latest_update: 'Ingested via CSV upload.',
          revenue: 14200,
          waiting_on: 'None',
          next_action: 'Perform title checklist scan',
          last_verified_update: timestamp
        }
      ]);
      break;
    }

    case 'evt_webhook_milestone': {
      // Webhook signal -> AI COO -> appropriate agent -> action runtime
      state.setTransactions((prev) =>
        prev.map((tx) =>
          tx.property_address?.includes('Woodlawn')
            ? {
                ...tx,
                latest_update: 'Webhook Ingest: Title milestones verified by Escrow agent.'
              }
            : tx
        )
      );
      break;
    }

    case 'evt_zapier_new_lead': {
      // Zapier signal -> AI COO -> record match -> task/action
      const newComm = {
        id: `comm_zapier_${Date.now()}`,
        sender: 'Zapier Lead Forwarder',
        sender_email: 'zapier-gateway@zapier.nest.local',
        recipient: 'sarah.j@nest-demo.local',
        subject: 'Lead Synced: Arthur Pendragon - 109 Woodlawn',
        body: 'Zapier synced preference update for buyer Arthur Pendragon on 109 Woodlawn.',
        timestamp,
        channel: 'email' as const,
        urgency: 'low' as const,
        status: 'unread' as const,
        related_property: '109 Woodlawn',
        related_agent: 'Emma Watson',
        extracted_intent: 'lead_profile_sync'
      };
      state.setCommunications((prev) => [newComm, ...prev]);
      break;
    }

    default:
      // Generic dynamic event
      break;
  }

  // Increment recordsSynchronized count for the connector
  state.setIntegrations((prev) =>
    prev.map((i) =>
      i.id === connectorId
        ? {
            ...i,
            recordsSynchronized: i.recordsSynchronized + 1,
            lastSync: timestamp
          }
        : i
    )
  );

  return {
    connectorId,
    eventId,
    status: 'created',
    createdSignals: [event.eventType],
    activatedAgents: event.expectedAgents,
    createdActions: event.expectedActions,
    createdAuditEvents: [auditEvent.id]
  };
}
