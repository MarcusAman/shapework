import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  FileText,
  Image,
  Layers
} from 'lucide-react';
import type { ListingMarketingCampaign } from '../../../server/persistence/marketingCampaignsRepository';
import { getDerivedAssetState } from '../../shared/marketingStateModel';

export interface BuildViewSidecarProps {
  campaign: ListingMarketingCampaign;
  job: any;
  events: any[];
  resolution?: any;
  selectedAsset: string;
  onSelectAsset: (assetId: any) => void;
  onSubmitInterventionInput?: (reqId: string, input: string) => Promise<void>;
  onStartPreparation?: () => void;
}

export const BuildViewSidecar: React.FC<BuildViewSidecarProps> = ({
  campaign,
  job,
  events,
  resolution,
  selectedAsset,
  onSelectAsset,
  onSubmitInterventionInput,
  onStartPreparation,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const req = campaign?.request;
  const requesterName = req?.requestedByName || campaign?.listingSnapshot?.listingAgentName || 'Eric Anderson';
  const agentName = req?.capturedByAgentName || 'Ava · AI Phone Agent';

  const isNotStarted = !job || resolution?.state === 'not_started';
  const isInterrupted = resolution?.state === 'interrupted' || (job && (job.status === 'failed' || job.status === 'cancelled'));
  const isUnavailable = resolution?.state === 'unavailable';

  const materialList = [
    { id: 'flyer', label: 'Property Flyer' },
    { id: 'carousel', label: 'Social Package' },
    { id: 'postcard', label: 'Direct Mail Postcard' },
    { id: 'sign_rider', label: 'Open-House Sign Rider' },
    { id: 'email', label: 'Email Announcement' },
  ];

  // Calculate ready vs preparing vs waiting
  const readyMaterials = materialList.filter((m) => {
    const st = getDerivedAssetState(m.id, campaign, job);
    return st === 'ready_for_review' || st === 'approved';
  });

  const preparingMaterials = materialList.filter((m) => {
    const st = getDerivedAssetState(m.id, campaign, job);
    return ((st as string) === 'preparing' || (st as string) === 'ready_to_prepare') && !readyMaterials.includes(m);
  });

  const waitingMaterials = materialList.filter(
    (m) => !readyMaterials.includes(m) && !preparingMaterials.includes(m)
  );

  return (
    <aside
      className="bg-[#f6f7f1] border-l border-slate-200 p-5 space-y-6 overflow-y-auto shrink-0 text-left font-sans h-full shadow-inner"
      data-testid="build-view-sidecar"
      role="region"
      aria-label="Build View Progress Panel"
    >
      {/* HONEST NO-JOB & STATUS BANNERS */}
      {isNotStarted && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl space-y-2 text-amber-900" data-testid="job-status-not-started">
          <div className="flex items-center gap-2 font-bold text-xs">
            <Clock className="w-4 h-4 text-amber-700" />
            <span>Ready to prepare</span>
          </div>
          <p className="text-xs text-amber-800">
            This work has not been started yet. Click below to begin generation.
          </p>
          {onStartPreparation && (
            <button
              type="button"
              onClick={onStartPreparation}
              className="w-full mt-2 px-3 py-2 bg-[#00635c] hover:bg-[#004d48] text-white text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer"
            >
              Start preparation
            </button>
          )}
        </div>
      )}

      {isInterrupted && (
        <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl space-y-2 text-rose-950" data-testid="job-status-interrupted">
          <div className="flex items-center gap-2 font-bold text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-700" />
            <span>Preparation was interrupted</span>
          </div>
          <p className="text-xs text-rose-900">
            Completed materials were preserved. You can resume or restart preparation.
          </p>
          {onStartPreparation && (
            <button
              type="button"
              onClick={onStartPreparation}
              className="w-full mt-2 px-3 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer"
            >
              Resume preparation
            </button>
          )}
        </div>
      )}

      {isUnavailable && (
        <div className="bg-slate-500/10 border border-slate-400/30 p-4 rounded-xl space-y-2 text-slate-800" data-testid="job-status-unavailable">
          <div className="flex items-center gap-2 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-slate-600" />
            <span>Preparation status unavailable</span>
          </div>
          <p className="text-xs text-slate-600">
            Unable to connect to generation status. Please try refreshing.
          </p>
        </div>
      )}

      {/* SIDECAR HEADER */}
      <div className="space-y-1 border-b border-slate-200 pb-4" data-testid="build-view-header">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#00635c]">
          <Sparkles className="w-3.5 h-3.5 text-[#00635c]" />
          <span>{isNotStarted ? 'Pending Preparation' : 'Active Preparation'}</span>
        </div>
        <h3 className="text-xl font-serif font-bold text-[#13231e]">
          {isNotStarted ? `Request from ${requesterName}` : `Preparing ${requesterName}’s request`}
        </h3>
        <p className="text-xs text-[#64716b]">
          Captured by {agentName} at 9:14 AM
        </p>
      </div>

      {/* COUNTER-BASED PROGRESS BADGE */}
      <div className="bg-[#fffdf8] p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-[#13231e]">
          <span data-testid="build-progress-text">{readyMaterials.length} of 5 materials ready</span>
          <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
            Rev 1
          </span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00635c] transition-all duration-500"
            style={{ width: `${(readyMaterials.length / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* 1. READY MATERIALS LIST WITH THUMBNAILS */}
      {readyMaterials.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64716b] block">
            Ready to Review ({readyMaterials.length})
          </span>
          <div className="space-y-2">
            {readyMaterials.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectAsset(m.id)}
                className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                  selectedAsset === m.id
                    ? 'bg-[#fffdf8] border-[#00635c] shadow-sm'
                    : 'bg-[#fffdf8]/60 hover:bg-[#fffdf8] border-slate-200'
                }`}
              >
                <div className="w-10 h-10 bg-slate-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                  {m.id === 'flyer' ? (
                    <img
                      src="/api/marketing/campaigns/campaign_990_inspiration/assets/photo_hero/raw"
                      alt="Flyer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs text-[#13231e] block truncate">{m.label}</span>
                  <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Ready to review
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. PREPARING MATERIALS LIST */}
      {preparingMaterials.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
            Actively Preparing ({preparingMaterials.length})
          </span>
          <div className="space-y-2">
            {preparingMaterials.map((m) => (
              <div
                key={m.id}
                className="p-3 bg-[#fffdf8] rounded-xl border border-sky-200 flex items-center gap-3"
              >
                <div className="w-4 h-4 rounded-full border-2 border-[#00635c] border-t-transparent animate-spin shrink-0" />
                <div>
                  <span className="font-bold text-xs text-[#13231e] block">{m.label}</span>
                  <span className="text-[10px] text-sky-700 font-medium">Generating layout & copy</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. WAITING MATERIALS LIST */}
      {waitingMaterials.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64716b] block">
            Waiting ({waitingMaterials.length})
          </span>
          <div className="space-y-1.5">
            {waitingMaterials.map((m) => (
              <div
                key={m.id}
                className="p-2.5 bg-[#fffdf8]/60 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-[#64716b]"
              >
                <span className="font-medium">{m.label}</span>
                <span className="text-[10px]">Queued</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COLLAPSIBLE PREPARATION DETAILS */}
      <div className="border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="flex items-center justify-between w-full text-xs font-bold text-[#64716b] hover:text-[#13231e] cursor-pointer"
        >
          <span>Preparation details</span>
          {showTechnicalDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {showTechnicalDetails && (
          <div className="mt-3 p-3 bg-[#fffdf8] rounded-xl border border-slate-200 text-[11px] text-[#64716b] space-y-1 font-mono">
            <p>Renderer: HTML5 PDF Engine v2.4</p>
            <p>Brand Kit: Nest Wilmington v2.1.0</p>
            <p>Compliance: NCREC v2026.1</p>
          </div>
        )}
      </div>
    </aside>
  );
};
