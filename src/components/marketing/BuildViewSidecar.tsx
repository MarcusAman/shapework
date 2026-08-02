import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  MinusCircle,
  RefreshCw,
} from 'lucide-react';
import { MarketingGenerationJob, MarketingBuildEvent, MarketingAssetType } from '../../server/media/generationJobStore';

export interface BuildViewSidecarProps {
  job: MarketingGenerationJob | null;
  events: MarketingBuildEvent[];
  selectedAsset: MarketingAssetType;
  onSelectAsset: (asset: MarketingAssetType) => void;
  onHideSidecar: () => void;
  onSubmitInput: (requirementId: string, input: string) => Promise<void>;
  onCancelJob: () => Promise<void>;
  onOpenReviewStudio?: () => void;
}

export const BuildViewSidecar: React.FC<BuildViewSidecarProps> = ({
  job,
  events,
  selectedAsset,
  onSelectAsset,
  onHideSidecar,
  onSubmitInput,
  onCancelJob,
  onOpenReviewStudio,
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCheckpointsDetails, setShowCheckpointsDetails] = useState(false);
  const [interventionText, setInterventionText] = useState('Sunday 2:00 - 4:00 PM');
  const [isSubmittingInput, setIsSubmittingInput] = useState(false);

  const completedCount = job?.completedMaterialsCount || 0;
  const totalCount = job?.totalMaterialsCount || 5;

  const isCompleted = job?.status === 'completed';
  const isFailed = job?.status === 'failed';
  const isWaitingInput = job?.status === 'waiting_for_input';

  const assetLabels: Record<MarketingAssetType, string> = {
    flyer: 'Property flyer',
    carousel: 'Social package',
    postcard: 'Direct-mail postcard',
    sign_rider: 'Open-house sign rider',
    email: 'Email announcement',
  };

  const handleInterventionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job?.inputRequired || !interventionText.trim()) return;
    setIsSubmittingInput(true);
    try {
      await onSubmitInput(job.inputRequired.requirementId, interventionText);
    } finally {
      setIsSubmittingInput(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Build View Progress Panel"
      className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.18)] rounded-3xl p-5 shadow-2xl space-y-4 font-sans text-xs text-[#FFFDF8] w-full max-w-sm flex flex-col justify-between"
    >
      {/* 1. HEADER */}
      <div className="border-b border-[rgba(208,214,187,0.14)] pb-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse shrink-0" />
            <h3 className="font-serif font-bold text-sm text-[#FFFDF8]">
              {isCompleted
                ? 'Package prepared'
                : isFailed
                ? 'Preparation paused'
                : isWaitingInput
                ? 'Needs your attention'
                : 'Shapework is preparing your package'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onHideSidecar}
            title="Hide Build View"
            className="p-1 text-[rgba(246,247,241,0.6)] hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <MinusCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Counter-Based Progress */}
        <p className="text-[11px] text-[rgba(246,247,241,0.75)] font-medium">
          {isCompleted
            ? `${totalCount} of ${totalCount} materials ready`
            : `${completedCount} of ${totalCount} materials ready`}
          {job?.campaignRevision ? ` • Rev ${job.campaignRevision}` : ''}
        </p>
      </div>

      {/* 2. USER INTERVENTION CARD */}
      {isWaitingInput && job?.inputRequired && (
        <form
          onSubmit={handleInterventionSubmit}
          className="p-3.5 bg-amber-500/15 border border-amber-400/30 rounded-2xl space-y-2.5 animate-fade-in"
        >
          <div className="flex items-center gap-2 text-amber-200 font-bold text-xs">
            <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
            <span>Needs your attention</span>
          </div>
          <p className="text-[11px] text-amber-100/90 leading-snug">
            {job.inputRequired.message}
          </p>
          <input
            type="text"
            value={interventionText}
            onChange={(e) => setInterventionText(e.target.value)}
            placeholder="e.g. Sunday 2:00 - 4:00 PM"
            className="w-full p-2 bg-[#073F35] border border-amber-300/40 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-300"
          />
          <button
            type="submit"
            disabled={isSubmittingInput}
            className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
          >
            {isSubmittingInput ? 'Resuming...' : job.inputRequired.actionLabel}
          </button>
        </form>
      )}

      {/* 3. SIMPLIFIED RESTRAINED MATERIALS LISTING */}
      <div className="space-y-2.5">
        <div className="space-y-1.5">
          {(Object.keys(assetLabels) as MarketingAssetType[]).map((type) => {
            const statusObj = job?.assetStatuses[type];
            const status = statusObj?.status || 'waiting';
            const isReady = status === 'ready_for_preview' || status === 'rendered' || status === 'ready_for_review';
            const isSelected = selectedAsset === type;

            let badgeText = 'Waiting';
            if (type === 'flyer' && isReady) {
              badgeText = 'Ready for human visual review';
            } else if (isReady) {
              badgeText = 'Ready to preview';
            } else if (status === 'rendering' || status === 'preparing') {
              badgeText = 'Preparing';
            } else if (status === 'needs_attention') {
              badgeText = 'Needs attention';
            }

            return (
              <div
                key={type}
                className={`w-full px-3 py-2 rounded-xl flex items-center justify-between transition-all ${
                  isReady
                    ? isSelected
                      ? 'bg-[#176457] text-white border border-emerald-400/40'
                      : 'bg-[#073F35]/70 hover:bg-[#073F35] text-white cursor-pointer'
                    : 'bg-[#073F35]/30 text-slate-300 opacity-70'
                }`}
                onClick={() => isReady && onSelectAsset(type)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isReady ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : status === 'rendering' || status === 'preparing' ? (
                    <RefreshCw className="w-3.5 h-3.5 text-amber-300 animate-spin shrink-0" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="font-medium text-xs truncate">{assetLabels[type]}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                  <span className={isReady ? 'text-emerald-300 font-bold' : 'text-slate-400'}>
                    {badgeText}
                  </span>
                  {isReady && <Eye className="w-3 h-3 text-emerald-300" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. COLLAPSED PREPARATION DETAILS ACCORDION */}
      <div className="border-t border-[rgba(208,214,187,0.14)] pt-2.5">
        <button
          type="button"
          onClick={() => setShowCheckpointsDetails(!showCheckpointsDetails)}
          className="w-full flex items-center justify-between text-[11px] text-[rgba(246,247,241,0.65)] hover:text-white font-medium cursor-pointer"
        >
          <span>Preparation details</span>
          {showCheckpointsDetails ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {showCheckpointsDetails && (
          <div className="mt-2 space-y-1.5 text-[11px] text-[rgba(246,247,241,0.8)] animate-fade-in pl-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Listing information verified</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Approved photography loaded</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Nest brand requirements applied</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. CUSTOMER ACTION FOOTER */}
      <div className="border-t border-[rgba(208,214,187,0.14)] pt-3 space-y-2">
        {isCompleted ? (
          <button
            type="button"
            onClick={onOpenReviewStudio}
            className="w-full py-2.5 bg-[#00635C] hover:bg-[#004d48] text-[#FFFDF8] rounded-xl font-bold transition-all shadow-md border border-emerald-400/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>Review Package</span>
          </button>
        ) : (
          <div className="flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={onHideSidecar}
              className="text-emerald-300 hover:underline font-medium cursor-pointer"
            >
              Hide Build View
            </button>

            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="text-[rgba(246,247,241,0.5)] hover:text-rose-300 font-medium cursor-pointer"
            >
              Cancel Preparation
            </button>
          </div>
        )}
      </div>

      {/* CANCEL CONFIRMATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.24)] rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-[#FFFDF8]">
            <div className="flex items-center justify-between border-b border-[rgba(208,214,187,0.14)] pb-2">
              <h4 className="font-serif font-bold text-sm text-[#FFFDF8]">
                Cancel Package Preparation?
              </h4>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="text-[rgba(246,247,241,0.6)] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[rgba(246,247,241,0.75)]">
              This will stop remaining background work. Completed materials ({completedCount} ready) will be preserved.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-3.5 py-1.5 bg-[#073F35] text-white rounded-xl text-xs font-bold border border-[rgba(208,214,187,0.2)] cursor-pointer"
              >
                Continue Preparation
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowCancelModal(false);
                  await onCancelJob();
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
