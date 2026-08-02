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
import { ListingMarketingCampaign } from '../../../server/persistence/marketingCampaignsRepository';
import { getDerivedAssetState } from '../../shared/marketingStateModel';

export interface BuildViewSidecarProps {
  campaign: ListingMarketingCampaign;
  job: any;
  events: any[];
  selectedAsset: string;
  onSelectAsset: (assetId: any) => void;
  onSubmitInterventionInput?: (reqId: string, input: string) => Promise<void>;
}

export const BuildViewSidecar: React.FC<BuildViewSidecarProps> = ({
  campaign,
  job,
  events,
  selectedAsset,
  onSelectAsset,
  onSubmitInterventionInput,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const req = campaign?.request;
  const requesterName = req?.requestedByName || campaign?.listingSnapshot?.listingAgentName || 'Eric Anderson';
  const agentName = req?.capturedByAgentName || 'Ava · AI Phone Agent';

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
    return (st === 'preparing' || st === 'ready_to_prepare') && !readyMaterials.includes(m);
  });

  const waitingMaterials = materialList.filter(
    (m) => !readyMaterials.includes(m) && !preparingMaterials.includes(m)
  );

  return (
    <aside
      className="bg-[#f6f7f1] border-l border-slate-200 p-5 space-y-6 overflow-y-auto shrink-0 text-left font-sans h-full shadow-inner"
      data-testid="build-view-sidecar"
    >
      {/* SIDECAR HEADER */}
      <div className="space-y-1 border-b border-slate-200 pb-4" data-testid="build-view-header">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#00635c]">
          <Sparkles className="w-3.5 h-3.5 text-[#00635c]" />
          <span>Active Preparation</span>
        </div>
        <h3 className="text-xl font-serif font-bold text-[#13231e]">
          Preparing {requesterName}’s request
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
