/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TrendingUp, Clock, AlertCircle, ShieldCheck } from 'lucide-react';

interface MissionImpactPanelProps {
  currentStep: number;
}

export default function MissionImpactPanel({ currentStep }: MissionImpactPanelProps) {
  // Simulate cumulative business metrics as the autopilot steps run
  const hoursSaved = currentStep >= 6 ? 2.5 : currentStep >= 4 ? 1.0 : 0.2;
  const revenueSecured = currentStep >= 7 ? 11200 : 0;
  const checksAvoided = currentStep >= 8 ? 8 : currentStep >= 4 ? 4 : 1;
  const riskStatus = currentStep >= 7 ? 'Resolved (Healthy)' : currentStep >= 5 ? 'Evaluating Rules' : 'Contingency Pending';

  return (
    <div className="bg-secondary-surface/40 border border-border-subtle rounded-2xl p-5 space-y-4 shadow-sm h-full flex flex-col justify-between text-left font-sans">
      <div className="space-y-4">
        
        {/* Title */}
        <div>
          <span className="text-[9px] font-bold text-brand-green uppercase tracking-wider block font-mono">Live Business Metrics</span>
          <h4 className="text-xs font-bold text-text-primary mt-0.5">Commercial ROI Summary</h4>
        </div>

        {/* Metric 1: Hours Saved */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface border border-border-subtle flex items-center justify-center shrink-0 text-text-secondary">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] text-text-tertiary block font-mono">ADMIN LOAD SAVED</span>
            <span className="text-xs font-bold text-text-primary font-mono mt-0.5 block">+{hoursSaved} Hours</span>
          </div>
        </div>

        {/* Metric 2: Revenue Secured */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface border border-border-subtle flex items-center justify-center shrink-0 text-text-secondary">
            <TrendingUp className="w-4 h-4 text-brand-green" />
          </div>
          <div>
            <span className="text-[9px] text-text-tertiary block font-mono">CLOSING REVENUE SECURED</span>
            <span className="text-xs font-bold text-brand-green font-mono mt-0.5 block">
              ${revenueSecured.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Metric 3: Manual Checks Avoided */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface border border-border-subtle flex items-center justify-center shrink-0 text-text-secondary">
            <ShieldCheck className="w-4 h-4 text-brand-green" />
          </div>
          <div>
            <span className="text-[9px] text-text-tertiary block font-mono">AUDIT STEPS COMPLETED</span>
            <span className="text-xs font-bold text-text-primary font-mono mt-0.5 block">{checksAvoided} Verified</span>
          </div>
        </div>

        {/* Metric 4: Risk Status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface border border-border-subtle flex items-center justify-center shrink-0 text-text-secondary">
            <AlertCircle className={`w-4 h-4 ${currentStep >= 7 ? 'text-brand-green' : 'text-status-attention'}`} />
          </div>
          <div>
            <span className="text-[9px] text-text-tertiary block font-mono">TRANSACTION RISK LEVEL</span>
            <span className={`text-xs font-bold mt-0.5 block ${currentStep >= 7 ? 'text-brand-green' : 'text-status-attention'}`}>
              {riskStatus}
            </span>
          </div>
        </div>

      </div>

      {/* Commercial Value Proposition note */}
      <div className="p-3 bg-surface border border-border-subtle/80 rounded-xl text-[10px] text-text-secondary leading-normal leading-relaxed">
        <strong>Autopilot Impact:</strong> Ingesting, parsing, matching, and logging updates automatically re-allocates 90% of closing audit actions away from staff.
      </div>

    </div>
  );
}
