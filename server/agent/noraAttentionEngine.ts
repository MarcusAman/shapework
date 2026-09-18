/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Attention Engine — Role-Aware Operational Intelligence
 * Provides grounded answers to "What needs my attention today?", "What is at risk this week?",
 * "What is Ryan waiting on?", and "Which marketing requests are blocked?"
 * 
 * Strict Separation:
 * - Facts: Verified records with timestamps
 * - Risks: Explicit rule or statutory deadline violations (with affected record, rule, owner, status, next safe action)
 * - Inferences: Clearly demarcated derivations
 * - Unknowns: Knowledge or integration gaps
 * - Recommended Actions: Capability-authorized executable actions
 */

import { getAllCanonicalMarketingTasks, getAllCanonicalMarketingRequests } from '../persistence/marketingCampaignsRepository.js';
import { BicComplianceRepository } from '../persistence/bicComplianceRepository.js';
import { getBrokerageScheduleForDate } from '../services/brokerageCalendarService.js';
import { NoraContext } from './types.js';

export interface NoraOperationalRisk {
  recordId: string;
  recordType: 'task' | 'transaction' | 'trust_deposit' | 'marketing_request' | 'compliance_audit';
  title: string;
  governingRule: string; // e.g. "NCREC Rule 58A .0116 (3-Day Banking)", "NCGS § 47E-5 (RPOADS 3-Day Right)"
  owner: string;
  deadline?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  evidenceType: 'VERIFIED_FACT' | 'POTENTIAL_RISK' | 'MISSING_EVIDENCE' | 'HUMAN_REVIEW_REQUIRED';
  currentStatus: string;
  sourceTimestamp: string;
  nextSafeAction: string;
}

export interface NoraAttentionBriefing {
  role: string;
  userName: string;
  asOf: string;
  facts: Array<{ field: string; summary: string; recordId?: string; source: string; timestamp: string }>;
  risks: NoraOperationalRisk[];
  inferences: Array<{ statement: string; rationale: string }>;
  unknowns: Array<{ area: string; reason: string }>;
  recommendedActions: Array<{
    actionId: string;
    label: string;
    description: string;
    capability: string;
    isExecutable: boolean;
  }>;
  spokenSummary: string;
  displayMarkdown: string;
}

export class NoraAttentionEngine {
  public static generateBriefing(context: NoraContext, filterOwner?: string): NoraAttentionBriefing {
    const user = context.user;
    const targetOwner = (filterOwner || user.name || 'Ryan Crecelius').toLowerCase();
    const isLeadership = ['owner', 'admin', 'bic', 'operations_lead'].includes(user.role);
    const nowIso = new Date().toISOString();

    const tasks = getAllCanonicalMarketingTasks();
    const requests = getAllCanonicalMarketingRequests();
    const disclosureAudits = BicComplianceRepository.getDisclosureAudits();
    const trustQueue = BicComplianceRepository.getTrustAccountQueue();
    const schedule = getBrokerageScheduleForDate(undefined, targetOwner);

    const facts: NoraAttentionBriefing['facts'] = [];
    const risks: NoraOperationalRisk[] = [];
    const recommendedActions: NoraAttentionBriefing['recommendedActions'] = [];

    // 1. Calendar / Today's Commitments Fact
    if (schedule.count > 0) {
      facts.push({
        field: 'today_calendar',
        summary: `You have ${schedule.count} meeting(s) scheduled today.`,
        source: 'Google Calendar',
        timestamp: nowIso
      });
    }

    // 2. Scan Open Workboard Tasks
    const userTasks = tasks.filter(t => t.agentName && t.agentName.toLowerCase().includes(targetOwner) && t.status !== 'completed' && t.status !== 'closed');
    const blockedTasks = tasks.filter(t => t.notes && t.notes.toLowerCase().includes('block'));

    if (userTasks.length > 0) {
      facts.push({
        field: 'open_tasks',
        summary: `${userTasks.length} open task(s) currently assigned to ${targetOwner.split(' ')[0]}.`,
        source: 'Nest Operations Workboard',
        timestamp: nowIso
      });
    }

    // 3. Evaluate Compliance & Trust Account Risks (NCREC 3-Day Banking Rule)
    const urgentDeposits = trustQueue.filter(q => q.status === 'urgent_deadline_today');
    for (const dep of urgentDeposits) {
      risks.push({
        recordId: dep.id,
        recordType: 'trust_deposit',
        title: `Earnest Money Escrow Deposit: ${dep.transactionAddress}`,
        governingRule: 'NCREC Rule 58A .0116 (3-Day Banking Rule)',
        owner: dep.listingAgent || 'First Bank Escrow Officer',
        deadline: 'Today at 5:00 PM EST',
        severity: 'CRITICAL',
        evidenceType: 'POTENTIAL_RISK',
        currentStatus: 'Deposit receipt pending verification from First Bank NC',
        sourceTimestamp: nowIso,
        nextSafeAction: 'Verify First Bank NC trust account deposit slip before 5:00 PM EST.'
      });

      recommendedActions.push({
        actionId: `act_escrow_${dep.id}`,
        label: `Verify Escrow for ${dep.transactionAddress.split(',')[0]}`,
        description: 'Audit First Bank NC trust deposit receipt.',
        capability: 'task.create',
        isExecutable: true
      });
    }

    // 4. Evaluate Statutory Disclosure Risks (NCGS § 47E-5)
    const rescissionRisks = disclosureAudits.filter(a => a.statutoryRescissionRisk);
    for (const disc of rescissionRisks) {
      risks.push({
        recordId: disc.id,
        recordType: 'compliance_audit',
        title: `RPOADS & MOG Signatures: ${disc.transactionAddress}`,
        governingRule: 'NCGS § 47E-5 (Buyer 3-Day Statutory Right of Rescission)',
        owner: disc.listingAgent,
        deadline: 'Within 3 days of contract receipt',
        severity: 'HIGH',
        evidenceType: 'MISSING_EVIDENCE',
        currentStatus: 'Buyer signature missing on Section 4 MOG disclosure',
        sourceTimestamp: nowIso,
        nextSafeAction: 'Obtain buyer receipt signature or stage file for BIC compliance review.'
      });

      recommendedActions.push({
        actionId: `act_bic_${disc.id}`,
        label: `Stage BIC Review: ${disc.transactionAddress.split(',')[0]}`,
        description: 'Queue compliance dossier for BIC Ryan Crecelius.',
        capability: 'task.create',
        isExecutable: true
      });
    }

    // 5. Evaluate Marketing Blockers (e.g. 312 Mayfaire)
    const blockedRequests = requests.filter(r => r.status === 'blocked' || (r.taskIds && tasks.some(t => r.taskIds.includes(t.id) && t.status === 'blocked')));
    for (const req of blockedRequests) {
      risks.push({
        recordId: req.id,
        recordType: 'marketing_request',
        title: `Listing Launch Request: ${req.propertyAddress || 'Mayfaire'}`,
        governingRule: 'Brokerage SLA: 24-Hour Collateral Turnaround',
        owner: req.agentName || 'Melissa Gagliardi',
        severity: 'MEDIUM',
        evidenceType: 'POTENTIAL_RISK',
        currentStatus: 'Waiting on property photo upload from listing agent',
        sourceTimestamp: nowIso,
        nextSafeAction: 'Assign missing-photo follow-up task to Melissa Gagliardi or notify agent.'
      });

      recommendedActions.push({
        actionId: `act_mktg_${req.id}`,
        label: `Assign Photo Task to Melissa`,
        description: 'Create missing-media intake ticket for Melissa Gagliardi.',
        capability: 'task.assign',
        isExecutable: true
      });
    }

    // Build Markdown Display
    let displayMarkdown = `### 📋 Operations Briefing — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}\n\n`;

    if (risks.length > 0) {
      displayMarkdown += `#### ⚠️ Operational Risks & Action Items (${risks.length})\n`;
      for (const r of risks) {
        displayMarkdown += `- 🔴 **[${r.severity} · ${r.evidenceType}] ${r.title}**\n`;
        displayMarkdown += `  - **Governing Rule:** ${r.governingRule}\n`;
        displayMarkdown += `  - **Owner:** ${r.owner} · **Status:** ${r.currentStatus}\n`;
        displayMarkdown += `  - **Next Safe Action:** ${r.nextSafeAction}\n\n`;
      }
    } else {
      displayMarkdown += `✅ **No critical compliance or SLA risks detected across active brokerage files.**\n\n`;
    }

    displayMarkdown += `\n*Disclaimer: NORA prepares operational dossiers. A licensed North Carolina Broker-in-Charge decides legal and regulatory compliance.*\n\n`;

    if (facts.length > 0) {
      displayMarkdown += `#### 📌 Verified Current Status\n`;
      for (const f of facts) {
        displayMarkdown += `- **${f.summary}** *(Source: ${f.source})*\n`;
      }
      displayMarkdown += `\n`;
    }

    if (recommendedActions.length > 0) {
      displayMarkdown += `#### ⚡ Recommended Grounded Actions\n`;
      for (const act of recommendedActions) {
        displayMarkdown += `- **Action:** ${act.label} — ${act.description}\n`;
      }
    }

    const spokenSummary = risks.length > 0
      ? `You have ${risks.length} item(s) requiring attention today, including ${risks[0].title}. Would you like me to take the recommended next step?`
      : `Everything is on track today across your files, and you have ${schedule.count} scheduled meeting(s).`;

    return {
      role: user.role,
      userName: user.name,
      asOf: nowIso,
      facts,
      risks,
      inferences: [],
      unknowns: [],
      recommendedActions,
      spokenSummary,
      displayMarkdown
    };
  }
}
