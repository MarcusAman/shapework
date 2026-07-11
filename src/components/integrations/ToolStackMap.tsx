/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Database, Link, Activity } from 'lucide-react';

interface ToolStackMapProps {
  state?: any;
}

export default function ToolStackMap({ state }: ToolStackMapProps) {
  const staffList = state?.profiles || [];
  const listings = state?.listings || [];
  const transactions = state?.transactions || [];

  const tools = [
    {
      name: "Rechat",
      tagline: "Priority 1 (Primary Agent CRM & Marketing)",
      status: "Connected",
      lastSync: "Just now",
      recordCount: listings.length || 4,
      details: "Agent CRM, Design Center, photography scheduling, flyer preparation, and Google Review requests.",
      ingests: "Listing agreement metadata, media assets, review requests, launch dates.",
      actions: "Triggers marketing setup queue, photog booking, review requests routing.",
      color: "border-emerald-800/40 bg-emerald-950/20 text-emerald-300"
    },
    {
      name: "Dotloop",
      tagline: "Priority 1 (E-signature & Transaction Files)",
      status: "Connected",
      lastSync: "5 minutes ago",
      recordCount: transactions.length || 5,
      details: "Under-contract documents audit, buyer agreements signature checks, and escrow chasing.",
      ingests: "Loops, compliance checklists, signed contract PDFs metadata.",
      actions: "Triggers compliance chase loops, commission payout approval generation.",
      color: "border-emerald-800/40 bg-emerald-950/20 text-emerald-300"
    },
    {
      name: "QuickBooks",
      tagline: "Priority 2 (Accounting & Commission Ledger)",
      status: "Configured (Read)",
      lastSync: "1 hour ago",
      recordCount: state?.operatingRecords?.length || 1,
      details: "Commission ledger payouts, referral invoices, agent balance matching.",
      ingests: "Invoices, general ledger lines, payout records.",
      actions: "Flags commission mismatch vs contract agreement, audits payment payouts.",
      color: "border-sky-800/40 bg-sky-950/20 text-sky-300"
    },
    {
      name: "Basecamp",
      tagline: "Priority 3 (Office Facilities & Event Planning)",
      status: "Simulated Pipeline",
      lastSync: "Daily",
      recordCount: (state?.signInventory?.length || 0) + (state?.facilitiesIssues?.length || 0) + (state?.officeSupplies?.length || 0) || 7,
      details: "Signage & lockbox delivery, office facilities maintenance, event calendar schedules.",
      ingests: "Yard sign checkout logs, facilities issues tickets, supply lists.",
      actions: "Generates maintenance work orders, updates sign inventory warnings.",
      color: "border-amber-800/40 bg-amber-955/20 text-amber-350"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center select-none pb-2 border-b border-[rgba(246,247,241,0.12)]">
        <div className="text-left">
          <h4 className="text-xs font-serif font-black text-white uppercase tracking-wider">
            Brokerage Tool Stack Map
          </h4>
          <p className="text-[11px] text-[#D0D6BB] mt-0.5 font-sans font-medium">
            Primary systems powering brokerage operations. Nest Ops orchestrates events across these boundaries.
          </p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 bg-[rgba(246,247,241,0.06)] rounded-lg border border-[rgba(246,247,241,0.12)] text-[#D0D6BB] flex items-center gap-1 font-mono">
          <Database className="w-3 h-3 text-[#D0D6BB]" />
          4 Systems Configured
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <div 
            key={tool.name} 
            className={`border rounded-2xl p-4 flex flex-col justify-between hover:shadow-lg transition-all duration-200 ${tool.color}`}
            style={{
              backdropFilter: 'blur(8px)'
            }}
          >
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-serif font-black text-sm text-white block">{tool.name}</span>
                  <span className="text-[9px] font-bold text-[#D0D6BB] block uppercase tracking-wider font-mono mt-0.5">
                    {tool.tagline}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 select-none">
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  <span className="text-[10px] font-bold uppercase font-mono">{tool.status}</span>
                </div>
              </div>

              <p className="text-[11px] text-[#D0D6BB] leading-relaxed font-sans font-medium">
                {tool.details}
              </p>

              <div className="space-y-1.5 pt-2 border-t border-[rgba(246,247,241,0.12)] text-[10px] font-mono">
                <div>
                  <span className="text-[8px] font-bold uppercase text-[#D0D6BB] block">Data Ingested</span>
                  <span className="text-white font-sans font-medium">{tool.ingests}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold uppercase text-[#D0D6BB] block">Downstream Routed Work</span>
                  <span className="text-white font-sans font-medium">{tool.actions}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[rgba(246,247,241,0.12)] flex justify-between items-center text-[9px] text-[#D0D6BB] font-mono select-none">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-current" />
                Active records: <strong className="text-white">{tool.recordCount}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Link className="w-3 h-3 text-current" />
                Last synched: <strong className="text-white">{tool.lastSync}</strong>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
