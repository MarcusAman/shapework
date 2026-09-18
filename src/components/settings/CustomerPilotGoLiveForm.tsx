/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, Info, Send, FileText } from 'lucide-react';

interface CustomerPilotGoLiveFormProps {
  workspaceId: string;
  state?: any;
  onLaunched?: () => void;
}

export default function CustomerPilotGoLiveForm({ workspaceId, state = {}, onLaunched }: CustomerPilotGoLiveFormProps) {
  const {
    transactions = [],
    workspaceUsers = [],
    integrations = []
  } = state;

  const [pilotStartDate, setPilotStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [pilotLengthDays, setPilotLengthDays] = useState('14');
  const [includedWorkflows, setIncludedWorkflows] = useState<string[]>(['marketing_desk', 'closing_tracker']);
  const [excludedWorkflows, setExcludedWorkflows] = useState('');
  const [knownLimitations, setKnownLimitations] = useState('Manual data ingest; API Nation connection optional.');
  const [supportContact, setSupportContact] = useState('ops@shapework.com');
  const [customerOwnerAck, setCustomerOwnerAck] = useState('');
  const [launchOwnerApproval, setLaunchOwnerApproval] = useState('');

  // Readiness checklist checks
  const [roleMapReviewed, setRoleMapReviewed] = useState(false);
  const [approvalPolicyConfirmed, setApprovalPolicyConfirmed] = useState(false);
  const [auditVerified, setAuditVerified] = useState(false);
  const [supportBoundariesAck, setSupportBoundariesAck] = useState(false);
  const [launchPackExported, setLaunchPackExported] = useState(false);

  // Skip options/reasons
  const [tcReason, setTcReason] = useState('');
  const [marketingReason, setMarketingReason] = useState('');
  const [templatesReason, setTemplatesReason] = useState('');

  const isTcAssigned = workspaceUsers.some((u: any) => u.role === 'transaction_coordinator') || tcReason.trim().length > 0;
  const isMarketingAssigned = workspaceUsers.some((u: any) => u.role === 'marketing_coordinator') || marketingReason.trim().length > 0;
  const isTemplatesDone = transactions.length > 0 || templatesReason.trim().length > 0;

  const errors: string[] = [];
  if (!pilotStartDate) errors.push('Pilot start date is required.');
  if (!supportContact.trim()) errors.push('Support contact is required.');
  if (!customerOwnerAck.trim()) errors.push('Customer owner signature is required.');
  if (!launchOwnerApproval.trim()) errors.push('Internal launch owner approval is required.');
  if (!roleMapReviewed) errors.push('Role ownership map must be marked reviewed.');
  if (!approvalPolicyConfirmed) errors.push('Approval safety policy must be confirmed.');
  if (!auditVerified) errors.push('Audit verification is required.');
  if (!supportBoundariesAck) errors.push('SLA Support Boundaries must be acknowledged.');
  if (!launchPackExported) errors.push('Launch pack export checkbox is required.');
  if (!isTcAssigned) errors.push('Assign a Transaction Coordinator or provide a skip reason.');
  if (!isMarketingAssigned) errors.push('Assign a Marketing Coordinator or provide a skip reason.');
  if (!isTemplatesDone) errors.push('Complete manual data templates or provide a skip reason.');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (errors.length > 0) {
      alert('Cannot activate controlled pilot. Please fulfill all checklist criteria.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/activate-pilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pilotStartDate,
          pilotLengthDays,
          includedWorkflows,
          excludedWorkflows: excludedWorkflows.split(',').map(s => s.trim()).filter(Boolean),
          knownLimitations,
          supportContact,
          customerOwnerAck,
          launchOwnerApproval
        })
      });
      if (res.ok) {
        alert('Controlled Pilot successfully activated for workspace!');
        if (onLaunched) onLaunched();
      } else {
        const err = await res.json();
        alert('Activation failed: ' + (err.details ? err.details.join(', ') : err.error));
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to active workspace server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-border-soft rounded-3xl p-6 text-left text-xs text-text-secondary leading-normal space-y-6 font-sans">
      <div className="border-b border-border-soft pb-3 flex justify-between items-center select-none">
        <div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-5 h-5 text-brand-primary" />
            <span>// Controlled Pilot Go-Live Checklist</span>
          </h3>
          <p className="text-[10px] text-text-tertiary mt-0.5">Authorizing the workspace to transition to controlled pilot phase.</p>
        </div>
        <span className="text-[9px] bg-brand-soft text-brand-primary px-2 py-0.5 rounded font-mono font-bold uppercase">Setup Phase Gate</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Hand: Readiness checklist criteria */}
        <div className="space-y-4 bg-stone-50 border border-border-soft p-5 rounded-2xl">
          <span className="font-bold text-text-primary block uppercase tracking-wider text-[10px]">Readiness Validation Gates</span>
          
          <div className="space-y-3">
            {/* Roles */}
            <div className="space-y-2 border-b border-border-soft pb-2.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-text-primary uppercase font-mono">1. Assigned Operating Roles</span>
                <span className={workspaceUsers.length > 0 ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                  {workspaceUsers.length} User(s) mapped
                </span>
              </div>
              <div className="space-y-1.5 text-[10px]">
                {!workspaceUsers.some((u: any) => u.role === 'transaction_coordinator') && (
                  <input
                    type="text"
                    placeholder="Skip Reason: Missing Transaction Coordinator..."
                    value={tcReason}
                    onChange={(e) => setTcReason(e.target.value)}
                    className="w-full p-2 border border-border-soft rounded bg-white"
                  />
                )}
                {!workspaceUsers.some((u: any) => u.role === 'marketing_coordinator') && (
                  <input
                    type="text"
                    placeholder="Skip Reason: Missing Marketing Coordinator..."
                    value={marketingReason}
                    onChange={(e) => setMarketingReason(e.target.value)}
                    className="w-full p-2 border border-border-soft rounded bg-white"
                  />
                )}
              </div>
            </div>

            {/* Data Ingest */}
            <div className="space-y-2 border-b border-border-soft pb-2.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-text-primary uppercase font-mono">2. Customer Import Templates</span>
                <span className={transactions.length > 0 ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                  {transactions.length} Transactions
                </span>
              </div>
              {transactions.length === 0 && (
                <input
                  type="text"
                  placeholder="Skip Reason: No transactions imported yet..."
                  value={templatesReason}
                  onChange={(e) => setTemplatesReason(e.target.value)}
                  className="w-full p-2 border border-border-soft rounded bg-white text-[10px]"
                />
              )}
            </div>

            {/* Checkboxes */}
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={roleMapReviewed} onChange={(e) => setRoleMapReviewed(e.target.checked)} className="mt-0.5 rounded border-border-medium text-brand-primary" />
                <span className="font-medium text-text-secondary">Role ownership maps and permissions reviewed</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={approvalPolicyConfirmed} onChange={(e) => setApprovalPolicyConfirmed(e.target.checked)} className="mt-0.5 rounded border-border-medium text-brand-primary" />
                <span className="font-medium text-text-secondary">All outbound dispatch dispatches quarantined to Approval Center</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={auditVerified} onChange={(e) => setAuditVerified(e.target.checked)} className="mt-0.5 rounded border-border-medium text-brand-primary" />
                <span className="font-medium text-text-secondary">System audit trail checked and active</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={launchPackExported} onChange={(e) => setLaunchPackExported(e.target.checked)} className="mt-0.5 rounded border-border-medium text-brand-primary" />
                <span className="font-medium text-text-secondary">Onboarding Playbook & Launch Pack exported and saved</span>
              </label>
            </div>

            {/* Phase 5 Support boundaries text block */}
            <div className="bg-amber-50 border border-amber-200/50 p-3 rounded-xl space-y-2 mt-2">
              <span className="font-bold text-amber-950 text-[10px] block flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-amber-700" />
                <span>Support Boundaries & SLA Limits</span>
              </span>
              <p className="text-[9px] text-amber-800 leading-relaxed font-sans">
                shapework. supports the configured operating layer, workflows, routing, approvals, and audit trail. 
                Third-party tool outages, client-owned account access issues, and custom software requests outside the 
                agreed scope require separate review or SOW.
              </p>
              <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-amber-200/30">
                <input 
                  type="checkbox" 
                  checked={supportBoundariesAck} 
                  onChange={(e) => setSupportBoundariesAck(e.target.checked)} 
                  className="rounded border-amber-300 text-amber-700 focus:ring-amber-500" 
                />
                <span className="text-[9px] font-bold text-amber-950 uppercase">Acknowledge SLA limits</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Hand: Capture Fields */}
        <div className="space-y-4">
          <span className="font-bold text-text-primary block uppercase tracking-wider text-[10px]">Go-Live Authorization Parameters</span>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-text-tertiary uppercase text-[9px]">Pilot Start Date</label>
              <input 
                type="date" 
                value={pilotStartDate}
                onChange={(e) => setPilotStartDate(e.target.value)}
                className="w-full p-2.5 border border-border-soft rounded-lg bg-surface-subtle focus:bg-white text-xs" 
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-text-tertiary uppercase text-[9px]">Expected Pilot Length</label>
              <select 
                value={pilotLengthDays}
                onChange={(e) => setPilotLengthDays(e.target.value)}
                className="w-full p-2.5 border border-border-soft rounded-lg bg-surface-subtle focus:bg-white text-xs"
              >
                <option value="7">7 Business Days</option>
                <option value="14">14 Business Days</option>
                <option value="30">30 Business Days</option>
                <option value="60">60 Business Days</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-text-tertiary uppercase text-[9px]">Included Workflow modules</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {['marketing_desk', 'closing_tracker', 'intake_guard', 'compliance_guard', 'office_readiness'].map(wf => (
                <label key={wf} className="px-2.5 py-1.5 border border-border-soft rounded-lg flex items-center gap-1.5 cursor-pointer bg-stone-50 select-none hover:bg-stone-100">
                  <input 
                    type="checkbox"
                    checked={includedWorkflows.includes(wf)}
                    onChange={(e) => {
                      if (e.target.checked) setIncludedWorkflows([...includedWorkflows, wf]);
                      else setIncludedWorkflows(includedWorkflows.filter(w => w !== wf));
                    }}
                    className="rounded text-brand-primary"
                  />
                  <span className="capitalize">{wf.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-text-tertiary uppercase text-[9px]">Excluded Workflows / Integrations</label>
            <input 
              type="text" 
              placeholder="e.g. QuickBooks ledger sync, SkySlope folders"
              value={excludedWorkflows}
              onChange={(e) => setExcludedWorkflows(e.target.value)}
              className="w-full p-2.5 border border-border-soft rounded-lg bg-surface-subtle focus:bg-white text-xs" 
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-text-tertiary uppercase text-[9px]">Known Limits / Notes</label>
            <textarea 
              rows={2}
              placeholder="Notes on integrations, missing data streams..."
              value={knownLimitations}
              onChange={(e) => setKnownLimitations(e.target.value)}
              className="w-full p-2.5 border border-border-soft rounded-lg bg-surface-subtle focus:bg-white text-xs" 
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-text-tertiary uppercase text-[9px]">Support Desk Contact Email/Phone</label>
            <input 
              type="text"
              value={supportContact}
              onChange={(e) => setSupportContact(e.target.value)}
              className="w-full p-2.5 border border-border-soft rounded-lg bg-surface-subtle focus:bg-white text-xs font-mono" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border-soft pt-4">
            <div className="space-y-1">
              <label className="font-bold text-text-tertiary uppercase text-[9px] block">Customer Owner Signature</label>
              <input 
                type="text" 
                placeholder="Jessica Keenan"
                value={customerOwnerAck}
                onChange={(e) => setCustomerOwnerAck(e.target.value)}
                className="w-full p-2.5 border border-border-medium rounded-lg bg-white font-serif italic text-xs text-text-primary" 
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-text-tertiary uppercase text-[9px] block">Internal Launch Lead Signature</label>
              <input 
                type="text" 
                placeholder="Marcus Aman"
                value={launchOwnerApproval}
                onChange={(e) => setLaunchOwnerApproval(e.target.value)}
                className="w-full p-2.5 border border-border-medium rounded-lg bg-white font-serif italic text-xs text-text-primary" 
              />
            </div>
          </div>

        </div>

      </div>

      {/* Errors list feedback */}
      {errors.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl space-y-1 font-medium text-[10px]">
          <span className="font-bold block uppercase flex items-center gap-1.5 select-none">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Missing Activation Prerequisites</span>
          </span>
          <ul className="list-disc pl-4 space-y-0.5">
            {errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={errors.length > 0 || isSubmitting}
          className="px-5 py-3 bg-brand-primary text-white hover:bg-brand-secondary disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer shadow-sm"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>Authorize and Start Controlled Pilot</span>
        </button>
      </div>

    </form>
  );
}
