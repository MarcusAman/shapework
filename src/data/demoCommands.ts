/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommandPlan, CommandStep as CommandPlanStep } from '../types/shapework';

export interface CommandResponse {
  replyText: string;
  commandPlan?: CommandPlan;
}

export function getCommandResponse(msg: string): CommandResponse {
  const q = (msg || '').toLowerCase();
  
  if (q.includes('costing us money') || q.includes('cost us money') || q.includes('profitability')) {
    return {
      replyText: `**Brokerage Revenue Leakage Audit:**
• **$42,800 in Revenue at Risk** across 3 active escrow deals due to overdue contingencies.
• **$400 in administrative overhead wasted** this week due to manual data backup entries from stale API credentials.
• **28 Admin Hours Saved** by shapework auto-sync this month (equivalent to $1,400 in coordinator load).
• **1 duplicate document upload resolved automatically** for 102 Pine St.`,
      commandPlan: {
        id: 'cmd_cost',
        query: msg,
        intent_detected: 'Cost Audit and Revenue Leakage Sweeps',
        affected_records_count: 3,
        affected_records: ['102 Pine Street', '742 Evergreen Terr', '908 Colonial Ave'],
        required_integrations: ['Dotloop', 'Gmail'],
        steps: [
          { id: 's1', action: 'Scan stale Dotloop API sync records', target: 'Westlake Office credentials', system: 'Dotloop', status: 'completed', requires_approval: false },
          { id: 's2', action: 'Audit manual data entry fallback time logs', target: '4.5 admin hours recorded', system: 'shapework', status: 'completed', requires_approval: false },
          { id: 's3', action: 'Flag duplicate document uploads', target: '102 Pine Street disclosures', system: 'shapework', status: 'completed', requires_approval: false },
          { id: 's4', action: 'Queue re-authorization warning email to system admin', target: 'admin@nest-demo.local', system: 'Gmail', status: 'pending', requires_approval: true }
        ],
        risk_level: 'medium',
        requires_approval: true,
        execution_status: 'draft',
        impact_estimate: 'Highlights API overhead and triggers administrator credential updates to prevent manual backlog costs.'
      }
    };
  }
  
  if (q.includes('agents need') || q.includes('agent support') || q.includes('support radar')) {
    return {
      replyText: `**Agent Support Radar Report:**
We have identified **4 agents** requiring active coordinator support:
1. **Brooke Agent** (Westlake) - *Needs document support* (missing buyer agency agreement on Pine St).
2. **Todd Agent** (Downtown) - *Waiting on brokerage* (awaits listing marketing copy approval).
3. **Alex Carter** (Downtown) - *High-value transaction support* (contingency date check).
4. **Randy Agent** (Westlake) - *New-agent onboarding follow-up* (needs SkySlope setup walkthrough).`,
      commandPlan: {
        id: 'cmd_agents',
        query: msg,
        intent_detected: 'Agent Support Checklist Coordinator Assignment',
        affected_records_count: 4,
        affected_records: ['Brooke Agent', 'Todd Agent', 'Alex Carter', 'Randy Agent'],
        required_integrations: ['SkySlope', 'Rechat'],
        steps: [
          { id: 's1', action: 'Audit agent onboarding status logs', target: 'Randy Agent checklist', system: 'shapework', status: 'completed', requires_approval: false },
          { id: 's2', action: 'Draft SkySlope tutorial invitation to Randy Agent', target: 'randy@nest-demo.local', system: 'Rechat', status: 'pending', requires_approval: false },
          { id: 's3', action: 'Dispatch disclosures secure link SMS to Brooke Agent', target: 'brooke.s@nest-demo.local', system: 'Gmail', status: 'pending', requires_approval: true }
        ],
        risk_level: 'low',
        requires_approval: true,
        execution_status: 'draft',
        impact_estimate: 'Sends training follow-up and compliance links to support agent administration.'
      }
    };
  }
  
  if (q.includes('closings') || q.includes('slip') || q.includes('closing risk')) {
    return {
      replyText: `**Closing Risk Sweep Report:**
I detected **2 transactions** closing in the next 14 days with elevated risk:
• **102 Pine Street** ($11,200 Projected Rev) - Close date: 5 days. Risk: Appraisal delayed by lender. Owner: Diane Ross.
• **908 Colonial Ave** ($16,800 Projected Rev) - Close date: 12 days. Risk: Title wire routing unconfirmed. Owner: Emma Watson.`,
      commandPlan: {
        id: 'cmd_closings',
        query: msg,
        intent_detected: 'Closing Slippage Warning Sweep',
        affected_records_count: 2,
        affected_records: ['102 Pine Street', '908 Colonial Ave'],
        required_integrations: ['Gmail', 'Dotloop'],
        steps: [
          { id: 's1', action: 'Query lender appraisal logs in Gmail inbox', target: 'Coastal Lending records', system: 'Gmail', status: 'completed', requires_approval: false },
          { id: 's2', action: 'Draft appraisal escalation email to Sarah from Coastal Lending', target: 'sarah@coastallending.com', system: 'Gmail', status: 'pending', requires_approval: true },
          { id: 's3', action: 'Draft Wire verification checklist SMS to Anthony Sterling escrow contact', target: 'anthony@sterling.com', system: 'Gmail', status: 'pending', requires_approval: true }
        ],
        risk_level: 'high',
        requires_approval: true,
        execution_status: 'draft',
        impact_estimate: 'Dispatches wire checkoff and appraisal escalations to prevent closing delays on $28,000 revenue.'
      }
    };
  }
  
  if (q.includes('compliance') || q.includes('broker review')) {
    return {
      replyText: `**Compliance Risk Center Scan:**
I found **2 files** with pending compliance items requiring attention:
• **102 Pine Street** - Buyer Broker Agreement is *Missing* (High Risk - offer already submitted).
• **742 Evergreen Terr** - Lead Seller Disclosures is *Pending Broker Review* (Watch).`,
      commandPlan: {
        id: 'cmd_compliance',
        query: msg,
        intent_detected: 'Compliance Folder Review Checkoff',
        affected_records_count: 2,
        affected_records: ['102 Pine Street', '742 Evergreen Terr'],
        required_integrations: ['SkySlope'],
        steps: [
          { id: 's1', action: 'Scan listing compliance folders', target: 'disclosures & buyer agency agreements', system: 'SkySlope', status: 'completed', requires_approval: false },
          { id: 's2', action: 'Flag missing buyer broker agreement', target: '102 Pine Street file', system: 'shapework', status: 'completed', requires_approval: false },
          { id: 's3', action: 'Queue Broker review exception memo for Frank Miller', target: 'frank.m@nest-demo.local', system: 'SkySlope', status: 'pending', requires_approval: true }
        ],
        risk_level: 'medium',
        requires_approval: true,
        execution_status: 'draft',
        impact_estimate: 'Escalates critical document exceptions to the Broker to avoid post-settlement state compliance penalties.'
      }
    };
  }
  
  if (q.includes('listings') || q.includes('miss launch')) {
    return {
      replyText: `**Listing Launch Readiness Report:**
• **742 Evergreen Terr** is at risk of missing launch in 2 days because photos are not scheduled. Volume: $750,000.
• **109 Woodlawn** launch checklist is pending compliance review (Target launch: 4 days).`,
      commandPlan: {
        id: 'cmd_listings',
        query: msg,
        intent_detected: 'MLS Syndication Launch Checklist Validation',
        affected_records_count: 2,
        affected_records: ['742 Evergreen Terr', '109 Woodlawn'],
        required_integrations: ['SkySlope'],
        steps: [
          { id: 's1', action: 'Verify photographer schedule sync', target: 'Apex photography loop', system: 'shapework', status: 'completed', requires_approval: false },
          { id: 's2', action: 'Send photographer reminder text message', target: 'apexinspectors.com', system: 'shapework', status: 'pending', requires_approval: false },
          { id: 's3', action: 'Queue MLS copy checkoff for Managing Broker review', target: 'frank.m@nest-demo.local', system: 'SkySlope', status: 'pending', requires_approval: true }
        ],
        risk_level: 'medium',
        requires_approval: true,
        execution_status: 'draft',
        impact_estimate: 'Reminds photographer and queues MLS copy signoff to prevent listing launch delays.'
      }
    };
  }
  
  if (q.includes('waiting') || q.includes('waiting on people')) {
    return {
      replyText: `**Third-Party Communication Bottleneck Audit:**
We are currently stuck because of unreturned communication on 2 items:
• **908 Colonial Ave** - Lender Randy has not responded for **54 hours** regarding wire instructions.
• **742 Evergreen Terr** - Agent Alex Carter has not replied for **48 hours** regarding Lead Disclosures.`,
      commandPlan: {
        id: 'cmd_waiting',
        query: msg,
        intent_detected: 'Third-party Bottleneck Audit',
        affected_records_count: 2,
        affected_records: ['908 Colonial Ave', '742 Evergreen Terr'],
        required_integrations: ['Gmail', 'Rechat'],
        steps: [
          { id: 's1', action: 'Scan outgoing SMS and email replies log', target: 'lender and listing coordinator logs', system: 'Gmail', status: 'completed', requires_approval: false },
          { id: 's2', action: 'Draft SMS link to Alex Carter requesting disclosures PDF', target: 'alex.c@nest-demo.local', system: 'Rechat', status: 'pending', requires_approval: true },
          { id: 's3', action: 'Escalate unresponsive lender to buyer agent', target: 'randy@magnolialending.com', system: 'Gmail', status: 'pending', requires_approval: true }
        ],
        risk_level: 'medium',
        requires_approval: true,
        execution_status: 'draft',
        impact_estimate: 'Dispatches escalation prompts to unresponsive lenders and text reminders to agents.'
      }
    };
  }
  
  if (q.includes('safely') || q.includes('follow-ups can you prepare')) {
    return {
      replyText: `**Pre-Approved Automated Actions:**
I can safely prepare 2 automated follow-up drafts with low risk:
• Photographer schedule prompt for **742 Evergreen Terr**.
• Onboarding workbook setup reminder link for **Randy Agent**.`,
      commandPlan: {
        id: 'cmd_safe',
        query: msg,
        intent_detected: 'Pre-approved Automated Actions Dispatch',
        affected_records_count: 2,
        affected_records: ['742 Evergreen Terr', 'Randy Agent onboarding file'],
        required_integrations: ['Rechat'],
        steps: [
          { id: 's1', action: 'Match high-confidence compliance template rules', target: 'Auto-ingest guidelines', system: 'shapework', status: 'completed', requires_approval: false },
          { id: 's2', action: 'Prepare photographer scheduling alert', target: 'Apex photo systems', system: 'Rechat', status: 'pending', requires_approval: false },
          { id: 's3', action: 'Prepare onboarding workbook link', target: 'randy@nest-demo.local', system: 'Rechat', status: 'pending', requires_approval: false }
        ],
        risk_level: 'low',
        requires_approval: false,
        execution_status: 'draft',
        impact_estimate: 'Automatically queues low-risk coordination follow-ups.'
      }
    };
  }
  
  if (q.includes('changed') || q.includes('since yesterday')) {
    return {
      replyText: `**Overnight Activity Summary:**
• **742 Evergreen Terr**: DocuSign disclosures uploaded by Alex Carter.
• **102 Pine Street**: Lender clear-to-close CD signature received from Sarah at Coastal Lending.
• **908 Colonial Ave**: Closing date extended 3 days due to wiring issue.`,
      commandPlan: {
        id: 'cmd_changed',
        query: msg,
        intent_detected: 'Overnight Sync Audit',
        affected_records_count: 3,
        affected_records: ['742 Evergreen Terr', '102 Pine Street', '908 Colonial Ave'],
        required_integrations: ['Gmail', 'DocuSign'],
        steps: [
          { id: 's1', action: 'Download completed seller disclosures PDF from DocuSign', target: '742 Evergreen Terr', system: 'DocuSign', status: 'completed', requires_approval: false },
          { id: 's2', action: 'Sync disclosures to SkySlope transaction files', target: 'SkySlope File Sync', system: 'SkySlope', status: 'pending', requires_approval: false },
          { id: 's3', action: 'Update morning brief dashboard tiles', target: 'All active records', system: 'shapework', status: 'pending', requires_approval: false }
        ],
        risk_level: 'low',
        requires_approval: false,
        execution_status: 'draft',
        impact_estimate: 'Synchronizes overnight documents and clears staging checklists.'
      }
    };
  }
  
  if (q.includes('integrations') || q.includes('creating risk')) {
    return {
      replyText: `**Integration Reliability Alert:**
• **Dotloop API credentials** failed sync for **18 hours**.
• **Stale transaction files** are present on 3 active Westlake escrows.
• **Suggested Workaround:** coordinator Diane Ross must execute a manual loop check.`,
      commandPlan: {
        id: 'cmd_integrations',
        query: msg,
        intent_detected: 'API Credentials Heartbeat Check',
        affected_records_count: 1,
        affected_records: ['Dotloop API Connector'],
        required_integrations: ['Dotloop'],
        steps: [
          { id: 's1', action: 'Trace API webhook heartbeat latency logs', target: 'Recent 24 hours log', system: 'Dotloop', status: 'completed', requires_approval: false },
          { id: 's2', action: 'Generate manual loop upload checklists for Diane Ross', target: 'diane.r@nest-demo.local', system: 'shapework', status: 'pending', requires_approval: false },
          { id: 's3', action: 'Dispatch API credentials re-authorization email to systems admin', target: 'admin@nest-demo.local', system: 'Gmail', status: 'pending', requires_approval: true }
        ],
        risk_level: 'medium',
        requires_approval: true,
        execution_status: 'draft',
        impact_estimate: 'Alerts the administrator to update API OAuth tokens while prompting coordinators to double check manual file entries.'
      }
    };
  }
  
  if (q.includes('overloaded') || q.includes('staff')) {
    return {
      replyText: `**Coordinator Workload Capacity Audit:**
• **Diane Ross** is overloaded at **92% capacity** (4 overdue items, 3 incoming actions today).
• **Emma Watson** has high capacity at **44% capacity** (0 overdue items, 1 incoming action).
• **Recommendation:** Reassign 102 Pine St appraisal contingency check to Emma Watson.`,
      commandPlan: {
        id: 'cmd_staff',
        query: msg,
        intent_detected: 'Transaction Coordinator Workload capacity optimization',
        affected_records_count: 2,
        affected_records: ['Diane Ross', 'Emma Watson'],
        required_integrations: ['shapework'],
        steps: [
          { id: 's1', action: 'Compute coordinator queue length and task overdue counts', target: 'Active deal databases', system: 'shapework', status: 'completed', requires_approval: false },
          { id: 's2', action: 'Transfer 102 Pine Street appraisal checkoff from Diane to Emma', target: 'operations@nest-demo.local', system: 'shapework', status: 'pending', requires_approval: true }
        ],
        risk_level: 'low',
        requires_approval: true,
        execution_status: 'draft',
        impact_estimate: 'Redistributes pending task items to balance team workload and prevent closing delays.'
      }
    };
  }
  
  if (q.includes('summarize') || q.includes('leadership meeting') || q.includes('monday')) {
    return {
      replyText: `**Brokerage Executive Briefing Summary:**
• **Overall Health Score:** 84/100 (+2% weekly trend).
• **Revenue at Risk:** $42,800 across 3 active escrow files.
• **Primary Bottleneck:** Dotloop API sync delay (18h) causing stale compliance files.
• **Team Capacity:** Diane Ross overloaded at 92% capacity. Emma Watson has capacity (44%).`,
      commandPlan: {
        id: 'cmd_meeting',
        query: msg,
        intent_detected: 'Executive Briefing Memo Compilation',
        affected_records_count: 5,
        affected_records: ['All active brokerage logs'],
        required_integrations: ['Google Docs', 'Gmail'],
        steps: [
          { id: 's1', action: 'Query aggregate health inputs and trend scores', target: 'Database averages', system: 'shapework', status: 'completed', requires_approval: false },
          { id: 's2', action: 'Save summary PDF to Google Drive operations folder', target: 'operations/briefs', system: 'Google Docs', status: 'pending', requires_approval: false },
          { id: 's3', action: 'Email formatted briefing sheet to Ann Gunn', target: 'ann.g@nest-demo.local', system: 'Gmail', status: 'pending', requires_approval: true }
        ],
        risk_level: 'low',
        requires_approval: true,
        execution_status: 'draft',
        impact_estimate: 'Prepares executive summary PDF and emails it to Operations Lead.'
      }
    };
  }
  
  if (q.includes('reduce manual') || q.includes('plan to reduce') || q.includes('20%')) {
    return {
      replyText: `**Automation Optimization Modeling Plan (Target: -20% manual tasks):**
By enabling 2 specific auto-ingest rules, we can reduce coordinator manual checkoff workload by approximately 8.5 hours per week:
1. Auto-upload Lead Paint PDF disclosures when DocuSign envelope status returns 'completed'.
2. Auto-schedule photos directly when listing stage changes to 'preparing'.`,
      commandPlan: {
        id: 'cmd_efficiency',
        query: msg,
        intent_detected: 'Automation Optimization Modeling',
        affected_records_count: 2,
        affected_records: ['Lead Paint PDFs', 'Photographer API Scheduling'],
        required_integrations: ['Rechat', 'DocuSign'],
        steps: [
          { id: 's1', action: 'Compute manual workflow task latencies and frequencies', target: 'Past 90 days transaction logs', system: 'shapework', status: 'completed', requires_approval: false },
          { id: 's2', action: 'Enable auto-update policy rule for Lead Paint PDF uploads', target: 'Global Compliance Rules', system: 'shapework', status: 'pending', requires_approval: true },
          { id: 's3', action: 'Sync photographer automated webhooks to Rechat templates', target: 'Rechat developer keys', system: 'Rechat', status: 'pending', requires_approval: true }
        ],
        risk_level: 'medium',
        requires_approval: true,
        execution_status: 'draft',
        impact_estimate: 'Sets up auto-update webhooks for listings and disclosures to shave 8.5 hours off manual checking loops.'
      }
    };
  }
  
  return {
    replyText: `I have analyzed active listings and transaction escrow lines. Here is the operational state:
1. **102 Pine Street** is experiencing an elevated risk warning. The finance contingency lapses in **5 days** and the lender has not responded to our confirmations.
2. **742 Evergreen Terrace** slab inspection issue is unresolved.

Would you like me to dispatch the follow-up letter to the Pine Street lender?`
  };
}
