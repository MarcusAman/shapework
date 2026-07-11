/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, HelpCircle, FileText, Camera, X } from 'lucide-react';
import { Listing } from '../../types/shapework';
import StatusBadge from '../ui/StatusBadge';
import { safeLower } from '../../utils/string';
import ZillowImageWidget from '../ui/ZillowImageWidget';

interface ListingsViewProps {
  listings: Listing[];
  onSelectListing: (id: string) => void;
  selectedListingId: string | null;
  onCloseDetail: () => void;
}

export default function ListingsView({
  listings,
  onSelectListing,
  selectedListingId,
  onCloseDetail
}: ListingsViewProps) {
  const selectedListing = listings.find(l => l.id === selectedListingId) || null;

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="bg-surface border border-border-soft rounded-2xl p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-text-primary uppercase tracking-wider font-mono">Listing Launch Readiness</h2>
            <p className="text-xs text-text-secondary mt-0.5">Track marketing, compliance, and disclosure checkpoints before publication.</p>
          </div>
        </div>

        {/* Listings Table Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-soft text-text-tertiary font-bold uppercase tracking-wider text-[10px] font-mono">
                <th className="pb-3 pr-4 pl-1">Property Address</th>
                <th className="pb-3 pr-4">Agent Assigned</th>
                <th className="pb-3 pr-4">Target Launch</th>
                <th className="pb-3 pr-4">Listing Status</th>
                <th className="pb-3 pr-4 text-right">List Price</th>
                <th className="pb-3 pr-4 text-center">Checklist Progress</th>
                <th className="pb-3 pr-4">Compliance</th>
                <th className="pb-3 pr-4">Blockers</th>
                <th className="pb-3 pl-1">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft/40">
              {listings.map((l) => {
                 // Calculate checklist percentage
                const completedSteps = (l.launch_checklist || []).filter(s => s.status === 'completed').length;
                const totalSteps = (l.launch_checklist || []).length;
                const pct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 100;

                return (
                  <tr
                    key={l.id}
                    onClick={() => onSelectListing(l.id)}
                    className={`hover:bg-secondary-surface/75 cursor-pointer transition-all ${
                      selectedListingId === l.id ? 'bg-brand-green-soft/30' : ''
                    }`}
                  >
                    <td className="py-3.5 pr-4 pl-1 font-semibold text-text-primary">
                      {l.property_address.split(',')[0]}
                    </td>
                    <td className="py-3.5 pr-4 text-text-secondary">Alex Carter</td>
                    <td className="py-3.5 pr-4 font-mono text-text-secondary">{l.target_launch_date || 'N/A'}</td>
                    <td className="py-3.5 pr-4">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="py-3.5 pr-4 text-right font-mono font-bold text-text-primary">
                      ${(l.list_price || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-stone-200 h-1.5 rounded-full overflow-hidden shrink-0">
                          <div className="bg-brand-green h-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-mono text-[10px] font-bold text-text-primary shrink-0">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        l.compliance_status === 'approved'
                          ? 'bg-status-healthy-soft text-status-healthy border-status-healthy/10'
                          : l.compliance_status === 'rejected'
                          ? 'bg-status-atrisk-soft text-status-atrisk border-status-atrisk/15'
                          : 'bg-status-attention-soft text-status-attention border-status-attention/15'
                      }`}>
                        {l.compliance_status}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 max-w-xs">
                      {(l.blocking_items || []).length > 0 ? (
                        <div className="flex items-center gap-1 text-status-atrisk font-medium truncate">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{l.blocking_items[0]}</span>
                        </div>
                      ) : (
                        <span className="text-text-tertiary italic">Ready</span>
                      )}
                    </td>
                    <td className="py-3.5 pl-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectListing(l.id);
                        }}
                        className="text-xs text-brand-green font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Checklist</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {listings.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-text-tertiary italic">
                    No listing records match the active launch filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded Listing Launch checklist detail view */}
      {selectedListing && (
        <div className="bg-surface border border-border-subtle rounded-2xl shadow-sm p-6 space-y-6 animate-fade-in relative">
          <button
            onClick={onCloseDetail}
            className="absolute top-4 right-4 p-1 hover:bg-brand-green-soft text-text-secondary hover:text-text-primary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div>
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Listing Details & Blockers</span>
            <h3 className="font-serif font-bold text-text-primary text-xl mt-1">{selectedListing.property_address}</h3>
            <p className="text-xs text-text-secondary mt-1">Listing Owner: {selectedListing.owner} • Target Launch Date: {selectedListing.target_launch_date}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Launch Checklist Panel */}
            <div className="md:col-span-2 p-4 bg-secondary-surface rounded-xl border border-border-subtle space-y-3">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Launch Step Checklist</span>
              <div className="divide-y divide-border-subtle/50">
                {(selectedListing.launch_checklist || []).map((step) => (
                  <div key={step.id} className="py-2.5 flex items-center justify-between gap-4">
                    <span className="font-medium text-text-primary">{step.step_name}</span>
                    <div className="flex items-center gap-2">
                      {step.status === 'completed' ? (
                        <span className="px-2 py-0.5 bg-status-healthy-soft text-status-healthy font-bold text-[10px] rounded border border-status-healthy/10 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Done</span>
                        </span>
                      ) : step.status === 'overdue' ? (
                        <span className="px-2 py-0.5 bg-status-atrisk-soft text-status-atrisk font-bold text-[10px] rounded border border-status-atrisk/15 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Overdue</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-600 font-bold text-[10px] rounded border border-stone-200">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {(selectedListing.launch_checklist || []).length === 0 && (
                  <p className="text-text-tertiary italic text-center py-6">
                    All listing checkpoints have been finalized. The listing is fully published.
                  </p>
                )}
              </div>
            </div>

            {/* Blockers & Next Action */}
            <div className="space-y-4">
              <div className="p-4 bg-secondary-surface rounded-xl border border-border-subtle space-y-3">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Active Blockers</span>
                {(selectedListing.blocking_items || []).length > 0 ? (
                  <div className="space-y-2">
                    {(selectedListing.blocking_items || []).map((bl, idx) => (
                      <div key={idx} className="flex gap-2 items-start text-[11px] text-status-atrisk font-medium">
                        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{bl}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-status-healthy font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    No active blockers detected.
                  </p>
                )}
              </div>

              <div className="p-4 bg-brand-green-soft/40 border border-brand-green/20 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider block">Recommended Next Step</span>
                <p className="text-xs text-text-primary font-bold leading-relaxed">{selectedListing.next_action}</p>
                <div className="text-[10px] text-text-tertiary mt-2">
                  Last communication sync: {selectedListing.last_communication}
                </div>
              </div>
            </div>
          </div>

          {selectedListing.property_address && (
            <div className="space-y-1 border-t border-border-subtle/50 pt-4">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Property Listing Photo</span>
              <ZillowImageWidget address={selectedListing.property_address} height="180px" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
