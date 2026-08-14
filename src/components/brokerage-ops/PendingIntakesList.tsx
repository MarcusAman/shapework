/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Quiet Pending Intakes Component — Phase 4A.4 Conversation-First Light Mode UX
 * Displays a quiet, tasteful indicator when pending contract intake requests exist.
 * Consumes ZERO screen real estate when 0 pending items exist.
 */

import React, { useState, useEffect } from 'react';
import { Bell, Smartphone, PhoneCall, Mail, ChevronRight } from 'lucide-react';
import { PendingContractIntake } from '../../../server/contracts/pendingContractIntake';
import { PendingIntakeReviewModal } from './PendingIntakeReviewModal';
import { ContractIntakeSession } from '../../../server/contracts/contractDomainTypes';

interface PendingIntakesListProps {
  workspaceId?: string;
  onClaimSuccess: (session: ContractIntakeSession) => void;
  onPendingCountChange?: (count: number) => void;
}

export const PendingIntakesList: React.FC<PendingIntakesListProps> = ({
  workspaceId = 'nest-realty-wilmington',
  onClaimSuccess,
  onPendingCountChange
}) => {
  const [pendingList, setPendingList] = useState<PendingContractIntake[]>([]);
  const [selectedPending, setSelectedPending] = useState<PendingContractIntake | null>(null);

  const fetchPendingList = async () => {
    try {
      const res = await fetch(`/api/contracts/demo/pending?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.pendingIntakes)) {
        setPendingList(data.pendingIntakes);
        if (onPendingCountChange) onPendingCountChange(data.pendingIntakes.length);
      }
    } catch (err) {
      console.warn('[PendingIntakesList] Fetch error:', err);
    }
  };

  useEffect(() => {
    fetchPendingList();
    const interval = setInterval(fetchPendingList, 5000);
    return () => clearInterval(interval);
  }, [workspaceId]);

  // Requirement: Quiet pending intakes. Zero screen footprint when 0 pending requests exist.
  if (pendingList.length === 0) {
    return null;
  }

  const firstItem = pendingList[0];
  const channelText = firstItem.channel === 'retell_sms' ? 'Received by text' : firstItem.channel === 'retell_phone' ? 'Received by phone call' : 'Received by email';

  return (
    <>
      <div className="bg-amber-50 border border-amber-200/80 text-amber-950 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 border border-amber-300 rounded-xl text-amber-800 shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-amber-950">
                {pendingList.length} {pendingList.length === 1 ? 'request is' : 'requests are'} ready for your review
              </span>
              <span className="px-2 py-0.5 bg-amber-200/70 text-amber-900 font-mono font-bold text-[10px] rounded-full uppercase">
                Ready for Review
              </span>
            </div>
            <p className="text-[11px] text-amber-800/90 mt-0.5">
              {channelText}
            </p>
          </div>
        </div>

        <button
          onClick={() => setSelectedPending(firstItem)}
          className="px-4 py-2 bg-[#00635C] hover:bg-[#01362D] text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
        >
          <span>Review</span>
          <ChevronRight className="w-3.5 h-3.5 text-white" />
        </button>
      </div>

      {selectedPending && (
        <PendingIntakeReviewModal
          pendingIntake={selectedPending}
          workspaceId={workspaceId}
          onClose={() => setSelectedPending(null)}
          onClaimSuccess={(claimedSession) => {
            onClaimSuccess(claimedSession);
            fetchPendingList();
          }}
        />
      )}
    </>
  );
};
