/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  Download,
  Info
} from 'lucide-react';
import { LaunchReadinessCheck } from '../../types/launch';
import CustomerPilotGoLiveForm from './CustomerPilotGoLiveForm';

interface GoLiveReviewProps {
  workspaceId: string;
  state?: any;
  report: {
    checks: LaunchReadinessCheck[];
    readinessPercentage: number;
    blockingFailuresCount: number;
    warningsCount: number;
    goLiveEligible: boolean;
    recommendedNextAction: string;
  };
  onLaunched?: () => void;
}

export default function GoLiveReview({ 
  workspaceId, 
  state = {},
  report,
  onLaunched 
}: GoLiveReviewProps) {
  if (!report) {
    return <div className="text-xs text-text-tertiary">Evaluating diagnostics...</div>;
  }
  const { goLiveEligible, blockingFailuresCount, warningsCount } = report;
  const [isActivating, setIsActivating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleMarkLive = async () => {
    if (!goLiveEligible) {
      alert('Workspace launch is blocked due to active blocker failures.');
      return;
    }

    if (!window.confirm('Are you sure you want to mark this workspace live? This updates the tenant to production status.')) {
      return;
    }

    setIsActivating(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/mark-live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        alert('Workspace successfully marked live!');
        if (onLaunched) onLaunched();
      } else {
        const err = await res.json();
        alert('Failed to launch: ' + (err.message || 'Unknown error'));
      }
    } catch (e) {
      console.error(e);
      alert('Error marking workspace live.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleExportSummary = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/launch/summary`);
      const data = await res.json();
      
      const markdown = `# Go-Live Deployment Summary - ${data.workspaceName}
- **Timestamp**: ${data.timestamp}
- **Workspace ID**: ${data.workspaceId}
- **Launch Mode**: ${data.launchMode}
- **Go-Live Date**: ${data.goLiveDate}
- **Launch Onboarding Lead**: ${data.launchOwner}
- **Brokerage Owner**: ${data.customerOwner}
- **Readiness Score**: ${data.readinessPercentage}%
- **Required Blockers Status**: ${data.goLiveEligible ? 'PASSED' : 'BLOCKED'}
- **Warnings Count**: ${data.warningsCount}
- **Approval Policy**: ${data.workflowConfiguration.approvalPolicy}
- **Active SLA Rules**: ${data.workflowConfiguration.activeRulesCount}

---
### Team Members & Roles Summary
${Object.entries(data.usersRolesSummary || {}).map(([role, count]) => `- **${role}**: ${count} user(s)`).join('\n')}

---
### Integration Connectivity status
- **Rechat CRM Connected**: ${data.integrationsStatus.rechatConnected ? 'YES' : 'NO'}
- **Dotloop Webhook Status**: ${data.integrationsStatus.dotloopWebhookStatus}
- **Last Successful Rechat Sync**: ${data.lastSyncStatus.lastSyncAt || 'Never'}

---
### Applied Launch Waivers
${data.waivedBlockers.length === 0 ? '_No blockers waived_' : data.waivedBlockers.map((w: any) => `- **Check: ${w.readinessCheckId}**: Waived by ${w.waivedBy}. Reason: "${w.reason}"`).join('\n')}

---
### Diagnostics Checks Matrix:
${report.checks.map(c => `- **${c.label}**: ${c.status.toUpperCase()} (${c.requiredForLaunch ? 'Required' : 'Optional'})`).join('\n')}

---
### Immutable Audit Event IDs (Redacted)
${data.auditTrailIds.length === 0 ? '_No actions logged_' : data.auditTrailIds.map((id: string) => `- \`${id}\``).join('\n')}
`;

      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `launch_summary_${workspaceId}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert('Error exporting launch summary');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSummaryJson = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/launch/summary`);
      const data = await res.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `launch_summary_${workspaceId}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert('Error exporting JSON summary');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-xs text-text-secondary leading-normal text-left">
      
      {/* Launch Room Banner */}
      <div className="border border-border-soft rounded-2xl p-5 bg-white shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-primary" />
              <h4 className="font-bold text-text-primary text-sm">Customer Go-Live Validation</h4>
            </div>
            <p className="text-text-tertiary max-w-md">
              Review remaining blockers and configure all system check points before transitioning the workspace status to active.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportSummary}
              disabled={isExporting}
              className="px-3 py-2 border border-border-soft hover:bg-stone-50 text-text-primary rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 select-none"
            >
              <Download className="w-4 h-4 text-text-tertiary" />
              <span>Markdown</span>
            </button>
            <button
              onClick={handleExportSummaryJson}
              disabled={isExporting}
              className="px-3 py-2 border border-border-soft hover:bg-stone-50 text-text-primary rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 select-none"
            >
              <Download className="w-4 h-4 text-text-tertiary" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Warnings & Blockers Summary */}
      <div className="grid grid-cols-2 gap-4">
        {/* Blocker box */}
        <div className={`border rounded-2xl p-5 shadow-sm ${
          blockingFailuresCount > 0 
            ? 'bg-red-50/50 border-red-200 text-red-800' 
            : 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
        }`}>
          <h5 className="font-bold text-sm mb-1">Launch Eligibility Status</h5>
          {blockingFailuresCount > 0 ? (
            <p className="text-[11px] leading-relaxed">
              Launch is currently **blocked**. You have {blockingFailuresCount} unresolved launch check blockers. Correct these in the checklist/readiness tabs.
            </p>
          ) : (
            <p className="text-[11px] leading-relaxed">
              Workspace checks pass! The tenant is approved for live operational deployments.
            </p>
          )}
        </div>

        {/* Warning box */}
        <div className={`border rounded-2xl p-5 shadow-sm ${
          warningsCount > 0 
            ? 'bg-amber-50/50 border-amber-200 text-amber-800' 
            : 'bg-stone-50 border-border-soft text-text-secondary'
        }`}>
          <h5 className="font-bold text-sm mb-1">Launch Warnings & Adjustments</h5>
          {warningsCount > 0 ? (
            <p className="text-[11px] leading-relaxed">
              You have {warningsCount} warnings. Recommended to map baseline data syncs and check audit traces, but they do not block launch.
            </p>
          ) : (
            <p className="text-[11px] leading-relaxed">
              Zero launch configuration warnings. Highly polished and prepared!
            </p>
          )}
        </div>
      </div>

      {/* Pilot Go-Live Authorization Form */}
      <CustomerPilotGoLiveForm 
        workspaceId={workspaceId} 
        state={state} 
        onLaunched={onLaunched} 
      />

    </div>
  );
}
