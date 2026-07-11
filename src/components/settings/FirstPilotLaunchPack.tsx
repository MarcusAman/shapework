/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DownloadCloud, FileText } from 'lucide-react';

interface FirstPilotLaunchPackProps {
  state?: any;
}

export default function FirstPilotLaunchPack({ state = {} }: FirstPilotLaunchPackProps) {
  const {
    transactions = [],
    workItems = [],
    integrations = [],
    workspaceUsers = []
  } = state;

  const activeWorkspace = (state.workspaces || []).find((w: any) => w.id === state.workspaceId) || {};
  const pilotConfig = activeWorkspace.pilotConfig || {};
  const connectedList = integrations.filter((i: any) => i.connected).map((i: any) => i.name).join(', ') || 'None';

  const handleDownload = () => {
    const nextReviewDate = pilotConfig.pilotStartDate
      ? new Date(new Date(pilotConfig.pilotStartDate).getTime() + (pilotConfig.pilotLengthDays || 14) * 24 * 60 * 60 * 1000).toLocaleDateString()
      : 'TBD';

    const mdContent = `# SHAPEWORK. CUSTOMER PILOT LAUNCH PACKAGE
Exported: ${new Date().toLocaleDateString()}
Workspace ID: ${activeWorkspace.id || 'first-brokerage-pilot-rehearsal'}
Brokerage Name: ${activeWorkspace.name || 'First Brokerage Pilot'}

## 1. Pilot Configuration Summary
- Launch Mode: ${activeWorkspace.launchMode || 'manual_first'}
- Pilot Phase: ${activeWorkspace.phase || 'setup'}
- Pilot Start Date: ${pilotConfig.pilotStartDate || 'Not Started'}
- Expected Length: ${pilotConfig.pilotLengthDays || 14} Days
- Internal Launch Owner: ${pilotConfig.launchOwnerApproval || 'Marcus Aman'}
- Customer Owner Signature: ${pilotConfig.customerOwnerAck || 'Sarah Jenkins'}
- Included Workflows: ${(pilotConfig.includedWorkflows || []).join(', ') || 'marketing_desk, closing_tracker'}
- Excluded Workflows: ${(pilotConfig.excludedWorkflows || []).join(', ') || 'None'}
- Next Review Date: ${nextReviewDate}

## 2. Workspace Operational Summary
- Active Transactions Registered: ${transactions.length} files
- Unresolved Gaps / Checklist Tasks: ${workItems.filter((w: any) => w.status !== 'completed').length} items
- Enabled Third-Party Integrations: ${connectedList}

## 3. Team Role Configuration
${workspaceUsers.map((u: any) => `- **${u.role.replace('_', ' ').toUpperCase()}**: ${u.name} (${u.email})`).join('\n') || '- Principal Owner: Sarah Jenkins\n- Lead Operator: Alex Carter\n- Transaction Coordinator: Emma Watson\n- Marketing Coordinator: Robert Vance'}

## 4. Approval Policy Safeguards
- All outbound communications requesting files or details from external parties are quarantined.
- Outbound items require explicit Owner or Operations Lead approval inside the Approval Center before dispatch.

## 5. Daily Operator Checklists

### Owner / COO Checklist
1. Review Morning Briefing metrics cards.
2. Open the Approval Center and review queued outbound reminders.
3. Verify avoided interruptions count and download the WeeklyBrief.

### Operations Lead Checklist
1. Audit the Work Queue for unassigned tasks.
2. Check yard sign inventory levels under Office Readiness.
3. Review data import warning flags.

### Transaction Coordinator Checklist
1. Open the Closing Tracker and filter for "Missing Data".
2. Enter missing target closing dates.
3. Send document upload drafts to approvals.

### Marketing Coordinator Checklist
1. Triages incoming collateral requests in the Marketing Desk.
2. Complete flyer templates.

## 6. Support Boundaries & SLA Terms
- shapework. supports the configured operating layer, workflows, routing, approvals, and audit trail.
- Platform outages or errors in connected third-party systems (such as Rechat, Dotloop, SkySlope, or Google Workspace) are not shapework-owned bugs; they remain the sole responsibility of their respective providers.
- Any major layout adjustments, brand-new custom integrations, or custom database configurations require a separate Statement of Work (SOW).
- The monthly support retainer guarantees system uptime and operational support, but does not cover unlimited custom feature development.
- The client owns and maintains all logins, billing, and credentials for connected third-party accounts.
- shapework. retains ownership of the reusable templates, operating models, workflow logic, and implementation methodology.
- A clean handoff and data export process is available if the pilot engagement is terminated.

## 7. Pilot Success Criteria (Week 1-2 Targets)
- Work Items Created: Target 5, Current: ${workItems.length}
- Weekly briefs generated: Target 1
- At least 1 Approval completed
- At least 1 Transaction reviewed
- At least 1 Audit trail verified
- At least 1 Operational bottleneck identified

## 8. Known Limitations
- ${pilotConfig.knownLimitations || 'Manual data ingest; API connection optional.'}
`;

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shapework-pilot-launch-pack.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-border-soft rounded-3xl p-5 text-left text-xs text-text-secondary leading-normal space-y-4 font-sans select-none shadow-sm">
      <div className="flex justify-between items-center border-b border-border-soft pb-2">
        <div>
          <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <FileText className="w-5 h-5 text-brand-primary" />
            <span>Customer Pilot Launch Pack</span>
          </h4>
          <p className="text-[10px] text-text-tertiary mt-0.5">Export operational checklists, support boundaries, and week-1 playbooks.</p>
        </div>
        <button
          onClick={handleDownload}
          className="px-3.5 py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm text-[10px] tracking-wider uppercase"
        >
          <DownloadCloud className="w-4 h-4" />
          <span>Export Markdown Pack</span>
        </button>
      </div>

      <div className="bg-stone-50 border border-border-soft p-4 rounded-2xl space-y-3 font-mono text-[10px] text-text-secondary select-text max-h-48 overflow-y-auto leading-relaxed">
        <p className="font-bold text-text-primary"># Preview: shapework-pilot-launch-pack.md</p>
        <p>- Workspace ID: {activeWorkspace.id || 'first-brokerage-pilot-rehearsal'}</p>
        <p>- Launch Mode: {activeWorkspace.launchMode || 'manual_first'}</p>
        <p>- Pilot Phase: {activeWorkspace.phase || 'setup'}</p>
        <p>- Pilot Start Date: {pilotConfig.pilotStartDate || 'Not Started'}</p>
        <p>- Expected Length: {pilotConfig.pilotLengthDays || 14} Days</p>
        <p>- Customer Owner: {pilotConfig.customerOwnerAck || 'Sarah Jenkins'}</p>
      </div>
    </div>
  );
}
