/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Pending Intake Review Modal Component — Phase 4A.4 Conversation-First Light Mode UX
 * Clean, premium modal allowing brokers to review offer details captured via text, phone, or email.
 */

import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Smartphone, PhoneCall, Mail } from 'lucide-react';
import { PendingContractIntake } from '../../../server/contracts/pendingContractIntake';
import { ContractIntakeSession } from '../../../server/contracts/contractDomainTypes';

interface PendingIntakeReviewModalProps {
  pendingIntake: PendingContractIntake;
  workspaceId?: string;
  onClose: () => void;
  onClaimSuccess: (session: ContractIntakeSession) => void;
}

export const PendingIntakeReviewModal: React.FC<PendingIntakeReviewModalProps> = ({
  pendingIntake,
  workspaceId = 'nest-realty-wilmington',
  onClose,
  onClaimSuccess
}) => {
  const [claiming, setClaiming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatCents = (cents?: number) => {
    if (cents === undefined || cents === null) return 'Not specified';
    return `$${(cents / 100).toLocaleString()}`;
  };

  const formatDate = (isoDate?: string) => {
    if (!isoDate) return 'Not specified';
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return isoDate;
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/contracts/channels/pending/${pendingIntake.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          actorCapability: 'contract_authoring'
        })
      });

      const data = await res.json();
      if (data.success && data.session) {
        onClaimSuccess(data.session);
        onClose();
      } else {
        setErrorMsg(data.error || 'Failed to process request.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error processing request.');
    } finally {
      setClaiming(false);
    }
  };

  const ChannelIcon = pendingIntake.channel === 'retell_sms' ? Smartphone : pendingIntake.channel === 'retell_phone' ? PhoneCall : Mail;
  const channelLabel = pendingIntake.channel === 'retell_sms' ? 'Text' : pendingIntake.channel === 'retell_phone' ? 'Phone' : 'Email';

  const buyerNames = pendingIntake.proposedParties?.filter(p => p.role === 'buyer').map(p => p.fullName).join(', ') || 'Not specified';
  const propertyAddress = pendingIntake.proposedProperty?.streetAddress
    ? `${pendingIntake.proposedProperty.streetAddress}, ${pendingIntake.proposedProperty.city || ''}`
    : 'Not specified';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#01362D]/30 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#17231F] font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-[#F7F8F5]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#00635C]/10 border border-[#00635C]/20 rounded-xl text-[#00635C]">
              <ChannelIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-serif font-black text-[#01362D]">Review Offer Details</h3>
                <span className="px-2.5 py-0.5 bg-[#00635C]/10 text-[#00635C] text-xs font-semibold rounded-full">
                  {channelLabel}
                </span>
              </div>
              <p className="text-xs text-[#52605B] mt-0.5">Received through Ask Nora</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#52605B] hover:text-[#01362D] hover:bg-stone-200/60 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Explainer Callout */}
          <div className="bg-[#F7F8F5] border border-stone-200/80 rounded-xl p-4 space-y-1">
            <h4 className="text-xs font-bold text-[#01362D]">Here's what I captured</h4>
            <p className="text-xs text-[#52605B] leading-relaxed">
              Ask Nora captured these details from your message. Review them before continuing.
            </p>
          </div>

          {/* BIC Warning Banner */}
          {pendingIntake.bicReviewRequired && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>BIC Review Needed</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                {pendingIntake.bicReviewReason || 'Custom clause or conflicting details detected.'}
              </p>
            </div>
          )}

          {/* Clean Facts Grid with Whitespace */}
          <div className="grid grid-cols-2 gap-4 bg-[#F7F8F5] border border-stone-200/80 rounded-xl p-4 text-xs">
            <div>
              <span className="text-[11px] font-medium text-[#52605B] block">Property</span>
              <span className="font-semibold text-[#01362D] block mt-0.5">{propertyAddress}</span>
            </div>

            <div>
              <span className="text-[11px] font-medium text-[#52605B] block">Buyers</span>
              <span className="font-semibold text-[#17231F] block mt-0.5">{buyerNames}</span>
            </div>

            <div>
              <span className="text-[11px] font-medium text-[#52605B] block">Purchase Price</span>
              <span className="font-bold text-[#01362D] block mt-0.5">{formatCents(pendingIntake.proposedTerms?.purchasePriceCents)}</span>
            </div>

            <div>
              <span className="text-[11px] font-medium text-[#52605B] block">Due Diligence Fee</span>
              <span className="font-semibold text-[#17231F] block mt-0.5">{formatCents(pendingIntake.proposedTerms?.dueDiligenceFeeCents)}</span>
            </div>

            <div>
              <span className="text-[11px] font-medium text-[#52605B] block">Earnest Money</span>
              <span className="font-semibold text-[#17231F] block mt-0.5">{formatCents(pendingIntake.proposedTerms?.initialEarnestMoneyCents)}</span>
            </div>

            <div>
              <span className="text-[11px] font-medium text-[#52605B] block">Closing Date</span>
              <span className="font-semibold text-[#17231F] block mt-0.5">{formatDate(pendingIntake.proposedTerms?.settlementDate)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-100 bg-[#F7F8F5]">
          <span className="text-[11px] text-[#52605B] font-medium">
            Draft preparation only. Nothing is signed or sent without your review.
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={claiming}
              className="px-4 py-2 bg-white hover:bg-stone-100 border border-stone-200 text-[#17231F] font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="px-5 py-2 bg-[#00635C] hover:bg-[#01362D] text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{claiming ? 'Loading...' : 'Continue Draft'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
