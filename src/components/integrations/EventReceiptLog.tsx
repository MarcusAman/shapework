/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Terminal, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Sliders,
  Filter,
  Eye,
  Info
} from 'lucide-react';
import { IntegrationReceipt } from '../../types/integrationReceipt';

export default function EventReceiptLog() {
  const [receipts, setReceipts] = useState<IntegrationReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(null);

  const fetchReceipts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/integrations/receipts');
      const data = await res.json();
      setReceipts(data || []);
    } catch (e) {
      console.error('Error fetching receipts:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
    // Poll for webhook receipts every 5 seconds to show real-time ingestion
    const interval = setInterval(fetchReceipts, 5000);
    return () => clearInterval(interval);
  }, []);

  const getFilteredReceipts = () => {
    return receipts.filter((r) => {
      if (filter === 'all') return true;
      if (filter === 'verified') return r.verificationStatus === 'verified';
      if (filter === 'needs_review') return r.matchStatus === 'needs_review';
      if (filter === 'failed') return r.normalizationStatus === 'failed' || r.verificationStatus === 'failed';
      if (filter === 'intake') return r.workflowTriggered === 'Deal Intake Guard';
      if (filter === 'compliance') return r.workflowTriggered === 'Closing Compliance Guard';
      if (filter === 'dotloop') return r.source === 'apination_dotloop';
      if (filter === 'rechat') return r.source === 'rechat';
      return true;
    });
  };

  const filteredReceipts = getFilteredReceipts();

  return (
    <div className="space-y-4 text-left">
      
      {/* Header card with refresh button */}
      <div className="flex justify-between items-center select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-brand-primary" />
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
            // Live Integration Event Receipt Log
          </h3>
        </div>
        <button
          onClick={fetchReceipts}
          disabled={isLoading}
          className="p-1.5 hover:bg-stone-50 border border-border-soft rounded-lg text-text-tertiary hover:text-text-primary transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-1.5 select-none pb-2 border-b border-border-subtle/50">
        {[
          { id: 'all', label: 'All Receipts' },
          { id: 'verified', label: 'Verified' },
          { id: 'needs_review', label: 'Needs Review' },
          { id: 'failed', label: 'Failed Alerts' },
          { id: 'intake', label: 'Intake Guard' },
          { id: 'compliance', label: 'Compliance Guard' },
          { id: 'dotloop', label: 'Dotloop via API Nation' },
          { id: 'rechat', label: 'Rechat' }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border transition-all cursor-pointer ${
              filter === f.id
                ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                : 'bg-white text-text-tertiary border-border-soft hover:text-text-secondary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Receipt Table */}
      {filteredReceipts.length === 0 ? (
        <div className="p-12 text-center text-xs text-text-secondary border border-dashed border-border-soft rounded-2xl bg-surface-subtle/40 select-none">
          No webhook event receipts match the active filter criteria.
        </div>
      ) : (
        <div className="border border-border-soft rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-border-soft text-text-tertiary font-bold uppercase tracking-wider text-[9px] font-mono select-none">
                <th className="p-3">Source</th>
                <th className="p-3">Channel / Event</th>
                <th className="p-3">Target Loop / Record</th>
                <th className="p-3">Verification</th>
                <th className="p-3">Match Status</th>
                <th className="p-3">Workflow</th>
                <th className="p-3 text-right">Received At</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40 bg-surface">
              {filteredReceipts.map((receipt) => {
                const isExpanded = expandedReceiptId === receipt.id;
                
                return (
                  <React.Fragment key={receipt.id}>
                    <tr 
                      onClick={() => setExpandedReceiptId(isExpanded ? null : receipt.id)}
                      className={`hover:bg-stone-50/50 cursor-pointer transition-colors ${
                        isExpanded ? 'bg-stone-50/30' : ''
                      }`}
                    >
                      <td className="p-3 font-semibold text-text-primary capitalize select-none">
                        {receipt.source === 'apination_dotloop' ? 'Dotloop' : 'Rechat'}
                      </td>
                      <td className="p-3">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-text-secondary font-mono text-[11px]">
                            {receipt.channel}
                          </span>
                          {receipt.eventType && (
                            <span className="text-[9px] text-text-tertiary block font-mono">
                              ({receipt.eventType})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-medium text-text-secondary">
                        {receipt.loopName || 'Global Address Book'}
                      </td>
                      <td className="p-3 select-none">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          receipt.verificationStatus === 'verified' 
                            ? 'bg-success-soft text-success' 
                            : receipt.verificationStatus === 'failed' 
                              ? 'bg-status-atrisk-soft text-status-atrisk' 
                              : 'bg-stone-100 text-text-secondary'
                        }`}>
                          {receipt.verificationStatus === 'verified' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : receipt.verificationStatus === 'failed' ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <Info className="w-3 h-3" />
                          )}
                          <span>{receipt.verificationStatus}</span>
                        </span>
                      </td>
                      <td className="p-3 select-none">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          receipt.matchStatus === 'matched' 
                            ? 'bg-success-soft text-success' 
                            : receipt.matchStatus === 'needs_review' 
                              ? 'bg-status-attention-soft text-status-attention' 
                              : 'bg-stone-100 text-text-secondary'
                        }`}>
                          {receipt.matchStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 select-none">
                        <span className="text-text-secondary font-semibold">
                          {receipt.workflowTriggered || 'None'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-text-tertiary text-[10px]">
                        {new Date(receipt.receivedAt).toLocaleTimeString()}
                      </td>
                      <td className="p-3 text-right">
                        <button className="text-text-tertiary hover:text-text-primary cursor-pointer">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded details block */}
                    {isExpanded && (
                      <tr className="bg-stone-50/50">
                        <td colSpan={8} className="p-4 select-text">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-text-secondary leading-normal">
                            
                            {/* Metadata list */}
                            <div className="space-y-2">
                              <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider block select-none">Event Parameters</span>
                              <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-border-soft">
                                <div>
                                  <span className="text-[9px] text-text-tertiary font-bold block select-none">Receipt ID</span>
                                  <span className="font-mono text-[10px]">{receipt.id}</span>
                                </div>
                                {receipt.auditEventId && (
                                  <div>
                                    <span className="text-[9px] text-text-tertiary font-bold block select-none">Audit Track ID</span>
                                    <span className="font-mono text-[10px] text-brand-primary font-bold">{receipt.auditEventId}</span>
                                  </div>
                                )}
                                {receipt.documentName && (
                                  <div>
                                    <span className="text-[9px] text-text-tertiary font-bold block select-none">Compliance Document</span>
                                    <span className="font-bold text-text-primary text-[11px]">{receipt.documentName}</span>
                                  </div>
                                )}
                                {receipt.participantRole && (
                                  <div>
                                    <span className="text-[9px] text-text-tertiary font-bold block select-none">Role Ingested</span>
                                    <span className="font-bold text-text-primary">{receipt.participantRole}</span>
                                  </div>
                                )}
                                {receipt.relatedDealTitle && (
                                  <div className="col-span-2 border-t border-stone-100 pt-1.5 mt-1.5">
                                    <span className="text-[9px] text-text-tertiary font-bold block select-none">Matched Escrow Ledger Record</span>
                                    <span className="font-bold text-brand-primary flex items-center gap-1">
                                      <CheckCircle className="w-3.5 h-3.5 text-success shrink-0" />
                                      <span>{receipt.relatedDealTitle}</span>
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Redacted Payload */}
                            <div className="space-y-2">
                              <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider block select-none">PII-Redacted JSON Payload</span>
                              <pre className="bg-stone-900 text-stone-300 font-mono text-[10px] p-3 rounded-xl border border-stone-850 overflow-x-auto max-h-[140px] whitespace-pre leading-relaxed select-text">
                                {JSON.stringify(receipt.redactedPayload, null, 2)}
                              </pre>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
