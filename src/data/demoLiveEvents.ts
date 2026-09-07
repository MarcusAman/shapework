/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LiveEvent {
  id: string;
  timestamp: string;
  source: 'gmail' | 'outlook' | 'docusign' | 'gcal' | 'gdrive' | 'rechat' | 'webhook' | 'system';
  trigger: string;
  agentName: string;
  recordName: string;
  recordType: 'transaction' | 'listing' | 'person' | 'document' | 'integration';
  confidence: number; // 0.0 - 1.0
  riskLevel: 'healthy' | 'at_risk' | 'blocked';
  status: 'completed' | 'queued' | 'needs_approval' | 'failed';
  description: string;
  recommendedAction: string;
  beforeValue?: string;
  afterValue?: string;
  evidenceQuote?: string;
  policyName?: string;
  auditId?: string;
}

export const initialLiveEvents: LiveEvent[] = [
  {
    id: 'evt_1',
    timestamp: '2026-06-27T18:30:00Z',
    source: 'gmail',
    trigger: 'Inbound email from loan-officer@apexmortgage.com',
    agentName: 'Email Triage Agent',
    recordName: '102 Pine Street',
    recordType: 'transaction',
    confidence: 0.94,
    riskLevel: 'healthy',
    status: 'completed',
    description: 'Lender confirmed: "Underwriting approved clear to close on Pine Street. Scheduling closing session."',
    recommendedAction: 'Transition transaction stage from Under Contract to Closing Prep.',
    beforeValue: 'Under Contract',
    afterValue: 'Closing Prep',
    evidenceQuote: 'Underwriting approved clear to close on Pine Street.',
    policyName: 'Milestone Auto-Sync Policy (>90% confidence)',
    auditId: 'aud_stage_update_pine_st'
  },
  {
    id: 'evt_2',
    timestamp: '2026-06-27T18:15:00Z',
    source: 'gmail',
    trigger: 'Inbound email from randy.agent@nestrealty.com',
    agentName: 'Email Triage Agent',
    recordName: '221 B Baker Street',
    recordType: 'transaction',
    confidence: 0.78,
    riskLevel: 'at_risk',
    status: 'needs_approval',
    description: 'Addendum signature field match rating is below 85% safety threshold. Flagged for review.',
    recommendedAction: 'Verify seller signature authenticity on Addendum #3.',
    evidenceQuote: 'See attached seller signed addendum for Baker St.',
    policyName: 'Ambiguous Signature Match Check (<85% rating)',
    auditId: 'aud_sig_match_fail'
  },
  {
    id: 'evt_3',
    timestamp: '2026-06-27T17:45:00Z',
    source: 'docusign',
    trigger: 'Webhook sync handshake failure',
    agentName: 'Integration Health Agent',
    recordName: 'DocuSign API Connector',
    recordType: 'integration',
    confidence: 1.0,
    riskLevel: 'blocked',
    status: 'failed',
    description: 'DocuSign Webhook connection returned 502 Gateway Timeout.',
    recommendedAction: 'Trigger credentials sync check and queue warning alert.',
    beforeValue: 'Connected',
    afterValue: 'Error',
    policyName: 'Integration Endpoint Watchdog Rule',
    auditId: 'aud_ds_handshake_timeout'
  },
  {
    id: 'evt_4',
    timestamp: '2026-06-27T17:10:00Z',
    source: 'rechat',
    trigger: 'Daily launch check for upcoming listings',
    agentName: 'Listing Launch Agent',
    recordName: '104 Maple Avenue',
    recordType: 'listing',
    confidence: 1.0,
    riskLevel: 'blocked',
    status: 'completed',
    description: 'Launch is scheduled in 48 hours but MLS photography uploads are missing.',
    recommendedAction: 'Block listing active status and alert listing coordinator.',
    beforeValue: 'Drafting',
    afterValue: 'Blocked',
    policyName: 'Pre-launch Marketing Audit Rule',
    auditId: 'aud_maple_launch_blocked'
  },
  {
    id: 'evt_5',
    timestamp: '2026-06-27T16:50:00Z',
    source: 'gmail',
    trigger: 'Inbound email from closing-attorney@landtitle.com',
    agentName: 'Closing Risk Agent',
    recordName: '908 Colonial Avenue',
    recordType: 'transaction',
    confidence: 0.96,
    riskLevel: 'at_risk',
    status: 'completed',
    description: 'Attorney requested rescheduling: closing date shifted 10 days out due to escrow holding delay.',
    recommendedAction: 'Flag escrow delay risk and update target date to July 15.',
    beforeValue: 'July 5, 2026',
    afterValue: 'July 15, 2026',
    evidenceQuote: 'Rescheduling session to July 15 due to outstanding title clear.',
    policyName: 'Attorney Escrow Timeline Adjustment Policy',
    auditId: 'aud_colonial_date_change'
  },
  {
    id: 'evt_6',
    timestamp: '2026-06-27T15:20:00Z',
    source: 'gmail',
    trigger: 'Support query received from randy.agent@nestrealty.com',
    agentName: 'Agent Support Agent',
    recordName: 'Randy Agent Profile',
    recordType: 'person',
    confidence: 0.94,
    riskLevel: 'at_risk',
    status: 'needs_approval',
    description: 'Agent is managing 9 active escrows and has requested SkySlope disclosures folder setup help.',
    recommendedAction: 'Delegate auxiliary TC support to Diane Ross to assist Randy.',
    policyName: 'Agent Capacity Support Threshold Rule',
    auditId: 'aud_randy_support_allocation'
  },
  {
    id: 'evt_7',
    timestamp: '2026-06-27T14:40:00Z',
    source: 'docusign',
    trigger: 'Escrow envelope signature audit scan',
    agentName: 'Compliance Agent',
    recordName: 'Evergreen Transaction',
    recordType: 'transaction',
    confidence: 1.0,
    riskLevel: 'blocked',
    status: 'completed',
    description: 'DocuSign folder scan returned only 2/3 signed disclosures. Mandatory Buyer Agency Agreement is missing.',
    recommendedAction: 'Block deal progression and draft document request email to buyer.',
    beforeValue: 'Compliant',
    afterValue: 'Exception Logged',
    policyName: 'Mandatory Disclosure Audit Rule',
    auditId: 'aud_evergreen_compliance_alert'
  },
  {
    id: 'evt_8',
    timestamp: '2026-06-27T08:00:00Z',
    source: 'system',
    trigger: 'Scheduled morning sweep 08:00 AM',
    agentName: 'AI COO Orchestrator',
    recordName: 'Global Brokerage Database',
    recordType: 'integration',
    confidence: 1.0,
    riskLevel: 'healthy',
    status: 'completed',
    description: 'Overnight sweep completed. Morning Operational Briefing generated for Ann Gunn.',
    recommendedAction: 'Load Operations Panel Daily Briefing feed.',
    policyName: 'Scheduled Morning Briefing Sweep',
    auditId: 'aud_briefing_gen_sweep'
  }
];
