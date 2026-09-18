/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * InHouseBuyerMatchView: Real-Time In-House Luxury Buyer Cross-Match Engine
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Sparkles, Award, CheckCircle2, ShieldCheck, 
  DollarSign, Send, Phone, Mail, Clock, ArrowRight, RefreshCw, AlertCircle
} from 'lucide-react';
import { LuxuryPropertyComp, PropertyCompsRepository } from '../../../server/persistence/propertyCompsRepository';
import { useToast } from '../ui';

interface InHouseBuyerMatchViewProps {
  subjectProperty: LuxuryPropertyComp;
}

export const InHouseBuyerMatchView: React.FC<InHouseBuyerMatchViewProps> = ({
  subjectProperty
}) => {
  const { toast } = useToast();
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchedList, setDispatchedList] = useState<string[]>([]);

  const fetchMatches = () => {
    setLoading(true);
    fetch(`/api/comps/buyer-matches/${subjectProperty.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.matchedBuyers) {
          setMatchData(data);
        } else {
          setMatchData(PropertyCompsRepository.findInHouseBuyerMatches(subjectProperty.id));
        }
      })
      .catch(() => {
        setMatchData(PropertyCompsRepository.findInHouseBuyerMatches(subjectProperty.id));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMatches();
  }, [subjectProperty.id]);

  const handleDispatchPreview = async (buyerId?: string) => {
    setIsDispatching(true);
    try {
      const res = await fetch('/api/comps/dispatch-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectPropertyId: subjectProperty.id,
          buyerIds: buyerId ? [buyerId] : undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        if (buyerId) {
          setDispatchedList(prev => [...prev, buyerId]);
        } else {
          setDispatchedList(matchData.matchedBuyers.map((b: any) => b.id));
        }

        toast.success({
          title: 'In-House Preview Dispatched',
          description: `Sent private off-market preview alerts to ${data.totalAlertsSent} representing Nest agents.`
        });
      }
    } catch (err: any) {
      toast.error({ title: 'Dispatch Error', description: err.message });
    } finally {
      setIsDispatching(false);
    }
  };

  if (loading || !matchData) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500 animate-pulse font-sans">
        Cross-referencing {subjectProperty.propertyAddress.split(',')[0]} against active in-house luxury buyer mandates...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left font-sans animate-fadeIn">
      
      {/* 1. Header Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
              In-House Synergy
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {matchData.totalMatchedBuyers} Qualified In-House Buyers
            </span>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00635C]" />
            In-House Luxury Buyer Cross-Match & Preview Dispatcher
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {matchData.synergySummary}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={isDispatching}
            onClick={() => handleDispatchPreview()}
            className="px-4 py-2 rounded-xl bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isDispatching ? 'Dispatching...' : 'Broadcast Private Preview to All Matched Agents'}</span>
          </button>
        </div>
      </div>

      {/* 2. Matched Buyer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matchData.matchedBuyers.map((buyer: any) => {
          const isDispatched = dispatchedList.includes(buyer.id);
          return (
            <div 
              key={buyer.id}
              className={`bg-white border rounded-2xl p-5 shadow-2xs space-y-4 transition ${
                buyer.matchScore >= 90 ? 'border-emerald-300 ring-2 ring-emerald-500/10' : 'border-slate-200/90'
              }`}
            >
              {/* Card Top: Match Score & Financing */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`px-2.5 py-1 rounded-xl font-black text-xs ${
                    buyer.matchScore >= 90 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-800 text-white'
                  }`}>
                    {buyer.matchScore}% Match
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                      {buyer.clientName}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Budget: ${(buyer.minBudget/1000000).toFixed(2)}M – ${(buyer.maxBudget/1000000).toFixed(2)}M
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  buyer.financingStatus.includes('Cash') ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-blue-100 text-blue-900 border border-blue-200'
                }`}>
                  {buyer.financingStatus}
                </span>
              </div>

              {/* Match Criteria Reasons */}
              <div className="bg-[#F7F8F5] p-3 rounded-xl border border-slate-200/70 space-y-1 text-[11px]">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                  Mandate Alignment:
                </span>
                {buyer.matchReasons.map((r: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>

              {/* Representing Nest Agent Bar */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#00635C] text-white flex items-center justify-center font-bold text-[10px]">
                    {buyer.representingAgent.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">{buyer.representingAgent}</span>
                    <span className="text-[10px] text-slate-500">Nest Realty Wilmington Advisor</span>
                  </div>
                </div>

                {isDispatched ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                    ✓ Preview Sent
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDispatchPreview(buyer.id)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-2xs"
                  >
                    <Send className="w-3 h-3 text-[#00635C]" />
                    <span>Send Alert</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
