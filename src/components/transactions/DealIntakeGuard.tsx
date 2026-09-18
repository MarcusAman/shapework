/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  FileText,
  Mail,
  UserCheck,
  Plus,
  Play,
  Clock,
  ExternalLink,
  Info,
  ShieldAlert,
  XCircle
} from 'lucide-react';

interface DealIntakeGuardProps {
  state?: any;
}

export default function DealIntakeGuard({ state = {} }: DealIntakeGuardProps) {
  const {
    workItems = [],
    fetchState,
    activeProfile
  } = state;

  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Load from live database
  const intakeGaps = workItems.filter((w: any) => w.type === 'transaction_intake_gap' && w.status !== 'completed');

  const handleAction = async (itemId: string, actionName: string) => {
    setIsProcessing(itemId);
    try {
      // Complete current task
      const res = await fetch(`/api/work-items/${itemId}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          userName: activeProfile?.name || 'Ann Gunn',
          userRole: activeProfile?.role || 'operations_lead'
        })
      });

      if (res.ok) {
        // If it's a nudge action, put it through the Approval Center
        if (actionName.toLowerCase().includes('nudge') || actionName.toLowerCase().includes('prompt')) {
          await fetch('/api/work-items/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `Approval Needed: SMS alert to agent for outstanding intake form`,
              type: 'approval_needed',
              source: 'system',
              ownerRole: 'operations_lead',
              priority: 'high',
              recommendedNextAction: `Approve sending electronic reminder to fill out transaction contract details.`,
              relatedType: 'workflow',
              relatedId: itemId,
              relatedLabel: 'Agent Contract Intake Reminder',
              approvalRequired: true
            })
          });
        }
        if (fetchState) await fetchState();
        alert(`Intake action "${actionName}" completed and logged.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans animate-fade-in pb-10">
      
      {/* Overview Card */}
      <div className="bg-brand-soft/20 border border-brand-primary/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-brand-primary" />
            Transaction Intake Guard Active
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed font-medium max-w-2xl">
            Intake Guard scans background signals (MLS changes, client emails, and commission questions) to ensure active contracts are filed immediately, preventing commission surprises and closing-week scrambles.
          </p>
        </div>
        <div className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-xl shrink-0">
          {intakeGaps.length} Missing Transaction Files Flagged
        </div>
      </div>

      {/* Grid: Triage Queue */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Cols: Missing Intake Queue */}
        <div className="xl:col-span-2 bg-surface border border-border-soft rounded-2xl overflow-hidden shadow-card">
          <div className="h-12 border-b border-border-soft px-4 flex items-center bg-surface-muted justify-between select-none">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Missing Transaction Files Triage
            </span>
            <span className="text-[10px] text-text-tertiary">Background signals detected</span>
          </div>

          <div className="divide-y divide-border-soft">
            {intakeGaps.map((item: any) => (
              <div key={item.id} className="p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 select-none">
                  <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider bg-stone-100 px-2 py-0.5 rounded">
                    Signal Type: {item.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[8px] font-bold uppercase px-1.5 py-0.2 rounded bg-risk-red-soft text-risk-red">
                    {item.priority} Risk
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 select-text">
                    <span className="text-[9px] text-text-tertiary font-bold uppercase block">Title</span>
                    <h4 className="font-serif font-bold text-text-primary text-sm leading-snug">{item.title}</h4>
                    <p className="text-xs text-text-secondary font-medium">Assigned: {item.ownerRole.replace(/_/g, ' ').toUpperCase()}</p>
                  </div>

                  <div className="space-y-1 select-text">
                    <span className="text-[9px] text-risk-red font-bold uppercase block">Recommended Next Action</span>
                    <p className="text-xs text-text-primary font-semibold">{item.recommendedNextAction}</p>
                    <p className="text-[10px] text-text-tertiary">Logged: {new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Checklist */}
                <div className="p-3 bg-stone-50 border border-border-soft rounded-xl space-y-2 select-none">
                  <span className="text-[9px] text-text-tertiary font-bold uppercase block">
                    shapework. Required Intake Checklist
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-success shrink-0" />
                      <span>Workspace configuration active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-3.5 h-3.5 text-risk-red shrink-0" />
                      <span>Closing date timeline synchronized</span>
                    </div>
                  </div>
                </div>

                {/* Operations buttons */}
                <div className="flex flex-wrap gap-2 pt-2 select-none">
                  <button
                    onClick={() => handleAction(item.id, 'Prompt Agent / Nudge')}
                    disabled={isProcessing === item.id}
                    className="px-3.5 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Prompt Agent (Gated Approval)</span>
                  </button>
                  <button
                    onClick={() => handleAction(item.id, 'Verify Database Loop')}
                    disabled={isProcessing === item.id}
                    className="px-3.5 py-2 border border-border-medium bg-white text-text-secondary hover:bg-stone-50 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    <span>Verify loop</span>
                  </button>
                </div>
              </div>
            ))}
            {intakeGaps.length === 0 && (
              <div className="p-10 text-center text-text-tertiary select-none">
                <CheckCircle className="w-8 h-8 mx-auto text-success/35 mb-2" />
                <p className="font-bold">Intake queue is clear.</p>
                <p className="text-[11px] mt-0.5">No missing transaction forms detected.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Policies sidebar */}
        <div className="space-y-4 select-none">
          <div className="bg-stone-50 border border-border-soft rounded-3xl p-6 space-y-4">
            <span className="font-mono font-bold text-[9px] text-text-tertiary uppercase tracking-wider block">
              // Compliance Safeguard Policies
            </span>
            <div className="space-y-3.5">
              <div className="flex gap-3 items-start">
                <ShieldAlert className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h5 className="font-bold text-text-primary text-xs">Revenue Leakage Safeguard</h5>
                  <p className="text-[10px] text-text-secondary leading-normal">
                    Transactions must have expected commission values logged. Files without numbers trigger alerts.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <Clock className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h5 className="font-bold text-text-primary text-xs">Closing Timeline Lock</h5>
                  <p className="text-[10px] text-text-secondary leading-normal">
                    Escrows are tracked within 7 days of scheduled settlement. Missing dates generate blocking tasks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
