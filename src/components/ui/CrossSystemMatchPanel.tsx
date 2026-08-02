/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  GitCompare, 
  AlertTriangle, 
  ArrowRight,
  Zap
} from 'lucide-react';

interface CrossSystemMatchPanelProps {
  onRefreshParent?: () => void;
}

export default function CrossSystemMatchPanel({ onRefreshParent }: CrossSystemMatchPanelProps) {
  const [dbState, setDbState] = useState<any>(null);
  const [selectedDealIds, setSelectedDealIds] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const fetchDbState = async () => {
    try {
      const res = await fetch('/api/db-state');
      const data = await res.json();
      setDbState(data);
    } catch (e) {
      console.error('Error fetching db state:', e);
    }
  };

  useEffect(() => {
    fetchDbState();
    const interval = setInterval(fetchDbState, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirmMatch = async (eventId: string, dealId: string) => {
    if (!dealId) {
      alert('Please select a Rechat Deal to link.');
      return;
    }
    setIsSubmitting(eventId);
    try {
      const res = await fetch('/api/integrations/matches/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, dealId })
      });
      if (res.ok) {
        alert('Match confirmed! Dotloop loop linked to CRM record.');
        fetchDbState();
        if (onRefreshParent) onRefreshParent();
      } else {
        alert('Error confirming match.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleRejectMatch = async (eventId: string) => {
    setIsSubmitting(eventId);
    try {
      const res = await fetch('/api/integrations/matches/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });
      if (res.ok) {
        alert('Match rejected. Event marked as unmatched.');
        fetchDbState();
        if (onRefreshParent) onRefreshParent();
      } else {
        alert('Error rejecting match.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleCreateNewDeal = async (eventId: string, loopName: string) => {
    const address = prompt('Confirm property address for new escrow record:', loopName);
    if (address === null) return;
    setIsSubmitting(eventId);
    try {
      const res = await fetch('/api/integrations/matches/create-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, propertyAddress: address })
      });
      if (res.ok) {
        alert('Created new transaction record placeholder!');
        fetchDbState();
        if (onRefreshParent) onRefreshParent();
      } else {
        alert('Error creating deal.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(null);
    }
  };

  const needsReviewReceipts = dbState?.integrationReceipts?.filter(
    (r: any) => r.matchStatus === 'needs_review'
  ) || [];

  const deals = dbState?.transactions || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 select-none">
        <GitCompare className="w-5 h-5 text-brand-primary" />
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
          // Cross-System Record Match Review
        </h3>
      </div>

      <p className="text-xs text-text-secondary leading-relaxed">
        Review potential matches detected between primary CRM records (Rechat) and loop transaction folders (Dotloop). Merges require manual confirmation to prevent data pollution.
      </p>

      {needsReviewReceipts.length === 0 ? (
        <div className="p-8 text-center text-xs text-text-secondary border border-dashed border-border-soft rounded-2xl bg-surface-subtle/40 select-none">
          No pending cross-system match queues to review. (Trigger a "Low Confidence Match" in the QA console to test.)
        </div>
      ) : (
        <div className="space-y-4">
          {needsReviewReceipts.map((receipt: any) => {
            const defaultSuggestedDeal = deals[0] || null;
            const activeSelectedId = selectedDealIds[receipt.id] || defaultSuggestedDeal?.id || '';

            return (
              <div 
                key={receipt.id}
                className="bg-surface border border-border-soft rounded-2xl p-5 shadow-card space-y-4 hover:border-brand-primary/20 transition-all text-xs"
              >
                
                <div className="flex justify-between items-center border-b border-border-soft pb-3 select-none">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                      Manual Review Required
                    </span>
                    <span className="text-[10px] text-text-tertiary font-mono">Receipt ID: {receipt.id}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-brand-primary font-bold">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Ambiguous Match detected</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="bg-stone-50/50 p-3 rounded-xl border border-border-subtle/40 space-y-2.5">
                    <div className="flex items-center gap-1.5 select-none">
                      <span className="w-2 h-2 rounded-full bg-brand-primary"></span>
                      <span className="text-[10px] text-brand-primary font-bold uppercase tracking-wider font-mono">Rechat CRM (System of Record Target)</span>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[9px] text-text-tertiary font-bold uppercase block select-none">Select Matching CRM Deal Folder:</label>
                      <select
                        value={activeSelectedId}
                        onChange={(e) => setSelectedDealIds(prev => ({ ...prev, [receipt.id]: e.target.value }))}
                        className="w-full p-2 border border-border-soft rounded-lg bg-white text-xs text-text-secondary focus:outline-none"
                      >
                        <option value="">-- Choose target escrow file --</option>
                        {deals.map((d: any) => (
                          <option key={d.id} value={d.id}>
                            {d.property_address} ({d.client_name} - {d.agent_name})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-stone-50/50 p-3 rounded-xl border border-border-subtle/40 space-y-2">
                    <div className="flex items-center gap-1.5 select-none">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider font-mono">Dotloop Loop Ingested</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-text-primary text-[13px]">{receipt.loopName}</p>
                      <p className="text-[10px] text-text-tertiary font-mono">Source payload client: {receipt.redactedPayload?.clientName || 'N/A'}</p>
                      <span className="inline-block px-1.5 py-0.2 bg-stone-100 rounded text-[9px] font-mono text-text-secondary uppercase select-none">
                        Event: {receipt.eventType}
                      </span>
                    </div>
                  </div>

                </div>

                <div className="space-y-1 bg-amber-50/30 border border-amber-200/50 p-3 rounded-xl select-none">
                  <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Matching Gap Analysis</span>
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-text-secondary text-[11px]">
                    <li>Loop name "{receipt.loopName}" did not yield direct string matches in Rechat Deals index.</li>
                    <li>No active escrow files found with matching contact signatures.</li>
                  </ul>
                </div>

                <div className="flex flex-wrap justify-between items-center gap-3 pt-2 border-t border-border-soft select-none">
                  <div className="flex gap-2">
                    <button
                      disabled={isSubmitting !== null}
                      onClick={() => handleConfirmMatch(receipt.id, activeSelectedId)}
                      className="px-3.5 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-900 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Confirm Link</span>
                    </button>
                    <button
                      disabled={isSubmitting !== null}
                      onClick={() => handleRejectMatch(receipt.id)}
                      className="px-3.5 py-1.5 border border-border-medium text-text-secondary text-xs font-bold rounded-lg hover:bg-stone-50 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>

                  <button
                    disabled={isSubmitting !== null}
                    onClick={() => handleCreateNewDeal(receipt.id, receipt.loopName)}
                    className="px-3.5 py-1.5 border border-dashed border-brand-primary/45 text-brand-primary text-xs font-bold rounded-lg hover:bg-brand-soft/20 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <span>Orphan & Create New Escrow</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
