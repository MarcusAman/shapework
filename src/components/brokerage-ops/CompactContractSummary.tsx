/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Compact Contract Summary Component — Phase 4A.4 Conversation-First Light Mode UX
 * Renders a clean, spacious, white-card contract summary with progressive disclosure,
 * responsive multi-column layout, quiet forms provider messaging, and understated safety disclosures.
 * 
 * Strict Light Mode: Canvas #F7F8F5, Surfaces #FFFFFF, Deep Green #01362D, Teal #00635C.
 */

import React, { useState } from 'react';
import { Mic, MicOff, CheckCircle2, ShieldAlert, AlertTriangle, FileText, Sparkles, RefreshCw, User, MapPin, DollarSign, Calendar, Lock, ChevronRight, Edit3 } from 'lucide-react';
import { ContractIntakeSession } from '../../../server/contracts/contractDomainTypes';
import { ContractVoiceSdkService, ContractVoiceSessionState } from '../../services/contractVoiceSdkService';
import { useToast } from '../ui';

interface CompactContractSummaryProps {
  session: ContractIntakeSession;
  workspaceId?: string;
  onUpdateSession: (updatedSession: ContractIntakeSession) => void;
  onStartVoice: () => void;
  isVoiceActive?: boolean;
  voiceState?: ContractVoiceSessionState;
}

export const CompactContractSummary: React.FC<CompactContractSummaryProps> = ({
  session,
  workspaceId = 'nest-realty-wilmington',
  onUpdateSession,
  onStartVoice,
  isVoiceActive = false,
  voiceState = 'idle'
}) => {
  const { toast } = useToast();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  const formatCents = (cents?: number) => {
    if (cents === undefined || cents === null) return 'Not provided';
    return `$${(cents / 100).toLocaleString()}`;
  };

  const formatDate = (isoDate?: string) => {
    if (!isoDate) return 'Not provided';
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return isoDate;
    }
  };

  const buyerNames = session.parties?.filter(p => p.role === 'buyer').map(p => p.fullName).join(' & ') || 'Not provided';
  const propertyAddress = session.property?.streetAddress
    ? `${session.property.streetAddress}, ${session.property.city || ''} ${session.property.state || 'NC'}`.trim()
    : 'Address pending';

  const capturedCount = [
    session.property?.streetAddress,
    buyerNames !== 'Not provided',
    session.terms.purchasePriceCents !== undefined,
    session.terms.dueDiligenceFeeCents !== undefined,
    session.terms.initialEarnestMoneyCents !== undefined,
    session.terms.settlementDate,
    session.terms.financingType
  ].filter(Boolean).length;

  const handleConfirmTerms = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/contracts/intake-sessions/${session.id}/confirm-terms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, actorCapability: 'contract_authoring' })
      });
      const data = await res.json();
      if (data.success && data.session) {
        onUpdateSession(data.session);
        toast.success({ title: 'Offer Terms Confirmed', description: 'Offer terms confirmed and locked for package generation.' });
      } else {
        toast.error({ title: 'Confirmation Error', description: data.error || 'Failed to confirm offer terms.' });
      }
    } catch (err: any) {
      toast.error({ title: 'Confirmation Error', description: err.message || 'Error confirming terms.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestBicReview = async () => {
    const reason = 'Custom buyer clause requiring BIC review & signature authorization';

    setActionLoading(true);
    try {
      const res = await fetch(`/api/contracts/intake-sessions/${session.id}/request-bic-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, reason, actorCapability: 'contract_authoring' })
      });
      const data = await res.json();
      if (data.success && data.session) {
        onUpdateSession(data.session);
        toast.warning({ title: 'Escalated to BIC', description: 'File review request dispatched to Broker-in-Charge.' });
      }
    } catch (err: any) {
      toast.error({ title: 'Escalation Error', description: err.message || 'Error escalating to BIC.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[#01362D]/12 rounded-2xl shadow-sm p-6 space-y-6 text-[#17231F] font-sans text-left transition-all animate-fade-in">
      
      {/* Card Header & Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00635C] animate-pulse" />
            <h3 className="font-serif font-black text-lg text-[#01362D] tracking-tight">Offer Draft</h3>
            <span className="px-2.5 py-0.5 bg-[#00635C]/10 text-[#00635C] font-semibold text-xs rounded-full">
              Draft in progress • {capturedCount} details captured
            </span>
          </div>
          <p className="text-sm font-semibold text-[#01362D] mt-1">{propertyAddress}</p>
        </div>

        {/* Quiet BIC / Exceptional Alert Badge */}
        {session.bicReviewRequired && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium">Needs Brokerage Review</span>
          </div>
        )}
      </div>

      {/* Grid of Captured Facts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#F7F8F5] border border-stone-200/80 rounded-xl p-4">
        <div>
          <span className="text-[10px] font-bold text-[#52605B] uppercase tracking-wider block">Buyers</span>
          <span className="text-xs font-semibold text-[#17231F] block mt-0.5 truncate">{buyerNames}</span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-[#52605B] uppercase tracking-wider block">Offer Price</span>
          <span className="text-xs font-bold text-[#01362D] block mt-0.5">{formatCents(session.terms.purchasePriceCents)}</span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-[#52605B] uppercase tracking-wider block">Due Diligence</span>
          <span className="text-xs font-semibold text-[#17231F] block mt-0.5">{formatCents(session.terms.dueDiligenceFeeCents)}</span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-[#52605B] uppercase tracking-wider block">Earnest Money</span>
          <span className="text-xs font-semibold text-[#17231F] block mt-0.5">{formatCents(session.terms.initialEarnestMoneyCents)}</span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-[#52605B] uppercase tracking-wider block">Due Diligence Date</span>
          <span className="text-xs font-semibold text-[#17231F] block mt-0.5">{formatDate(session.terms.dueDiligenceDate)}</span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-[#52605B] uppercase tracking-wider block">Closing Date</span>
          <span className="text-xs font-semibold text-[#17231F] block mt-0.5">{formatDate(session.terms.settlementDate)}</span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-[#52605B] uppercase tracking-wider block">Financing</span>
          <span className="text-xs font-semibold text-[#17231F] capitalize block mt-0.5">{session.terms.financingType || 'Conventional'}</span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-[#52605B] uppercase tracking-wider block">Seller Concessions</span>
          <span className="text-xs font-semibold text-[#17231F] block mt-0.5">{formatCents(session.terms.sellerConcessionsCents)}</span>
        </div>
      </div>

      {/* Exceptional State Banners */}
      {session.bicReviewRequired && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Ask Nora found an item for Melissa / BIC review</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            {session.bicReviewReason || 'Custom clause or conflicting facts detected. Human BIC approval required before finalizing draft.'}
          </p>
        </div>
      )}

      {/* Quiet Forms Provider Message (Surface only at confirmation/forms stage) */}
      {['terms_confirmed', 'form_selection_required', 'validation_required', 'broker_review_required'].includes(session.status) && (
        <div className="bg-emerald-50/70 border border-emerald-200 text-emerald-900 rounded-xl p-3.5 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00635C] shrink-0" />
            <span><strong>Offer details confirmed.</strong> Licensed form generation will become available when Nest Realty's forms provider is connected.</span>
          </div>
        </div>
      )}

      {/* Action Controls & Voice Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onStartVoice}
            className={`px-4 py-2 rounded-xl font-medium text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              isVoiceActive
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-[#00635C] hover:bg-[#01362D] text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{isVoiceActive ? 'Voice Active — Speak Now' : 'Continue by Voice'}</span>
          </button>

          {session.status !== 'terms_confirmed' && session.status !== 'broker_approved' && (
            <button
              onClick={handleConfirmTerms}
              disabled={actionLoading}
              className="px-4 py-2 bg-[#F6F7F1] hover:bg-stone-200 border border-stone-300 text-[#01362D] font-semibold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00635C]" />
              <span>Confirm & Lock Details</span>
            </button>
          )}

          {!session.bicReviewRequired && (
            <button
              onClick={handleRequestBicReview}
              disabled={actionLoading}
              className="px-3 py-2 bg-stone-100 hover:bg-amber-100/60 border border-stone-200 text-stone-700 hover:text-amber-900 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Escalate to BIC</span>
            </button>
          )}
        </div>

        {/* Quiet Understated Safety Disclaimer */}
        <span className="text-[11px] text-[#52605B] font-medium">
          Draft preparation only. Nothing is signed or sent without your review.
        </span>
      </div>
    </div>
  );
};
