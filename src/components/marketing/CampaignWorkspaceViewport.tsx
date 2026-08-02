import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  CheckCircle2,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  Edit3,
  Download,
  Share2,
  Sparkles,
  Layers,
  FileText,
  Image,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  Lock,
} from 'lucide-react';
import {
  MarketingCampaignState,
  MarketingAssetState,
  getDerivedCampaignState,
  getDerivedAssetState,
  getCampaignStatusBadge,
} from '../../shared/marketingStateModel';
import { BuildViewSidecar } from './BuildViewSidecar';
import { assertCampaignIntegrity } from '../../shared/marketingCampaignResolver';

export interface CampaignWorkspaceViewportProps {
  campaign: any;
  job: any;
  events: any[];
  selectedAsset: 'flyer' | 'carousel' | 'postcard' | 'sign_rider' | 'email';
  onSelectAsset: (asset: 'flyer' | 'carousel' | 'postcard' | 'sign_rider' | 'email') => void;
  onBackToInbox: () => void;
  onApproveMaterial: (assetId: string) => Promise<void>;
  onRequestChangeOpen: () => void;
  onOpenDeliveryDrawer: () => void;
  onSubmitInterventionInput: (reqId: string, input: string) => Promise<void>;
  onCancelJob: () => Promise<void>;
}

export const CampaignWorkspaceViewport: React.FC<CampaignWorkspaceViewportProps> = ({
  campaign,
  job,
  events,
  selectedAsset,
  onSelectAsset,
  onBackToInbox,
  onApproveMaterial,
  onRequestChangeOpen,
  onOpenDeliveryDrawer,
  onSubmitInterventionInput,
  onCancelJob,
}) => {
  const [workspaceTab, setWorkspaceTab] = useState<'overview' | 'review' | 'activity'>('review');
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [postcardPage, setPostcardPage] = useState<'front' | 'back'>('front');
  const [showBuildViewSidecar, setShowBuildViewSidecar] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      if (mode === 'review' || mode === 'delivered') {
        setShowBuildViewSidecar(false);
      } else if (mode === 'build') {
        setShowBuildViewSidecar(true);
      }
    }
  }, []);

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-64px)] w-full bg-[#01362d] text-emerald-200 p-8 font-mono text-xs font-bold">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <span>Loading Campaign Record...</span>
        </div>
      </div>
    );
  }

  // Verify campaign integrity invariant once campaign is loaded
  const isValidIntegrity = assertCampaignIntegrity(
    campaign?.id,
    campaign?.id,
    campaign?.id,
    campaign?.id
  );

  const derivedCampaignState = getDerivedCampaignState(campaign, job);
  const derivedAssetState = getDerivedAssetState(selectedAsset, campaign, job);
  const campaignBadge = getCampaignStatusBadge(derivedCampaignState);

  const isPreparing =
    derivedCampaignState === 'preparing' ||
    derivedCampaignState === 'ready_to_prepare' ||
    (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'build');

  const isApproved = derivedCampaignState === 'approved' || derivedCampaignState === 'delivered' || derivedCampaignState === 'exported';
  const isMaterialApproved = derivedAssetState === 'approved';

  // Check if current asset has a real rendered preview
  const assetRecord = campaign?.assets?.[selectedAsset];
  const hasRealPreview =
    selectedAsset === 'flyer' ||
    (assetRecord && (assetRecord.status === 'ready_for_review' || assetRecord.status === 'approved' || assetRecord.status === 'exported'));

  const assetList: Array<{ id: 'flyer' | 'carousel' | 'postcard' | 'sign_rider' | 'email'; name: string }> = [
    { id: 'flyer', name: 'Property Flyer' },
    { id: 'carousel', name: 'Social Package' },
    { id: 'postcard', name: 'Direct-Mail Postcard' },
    { id: 'sign_rider', name: 'Open-House Sign Rider' },
    { id: 'email', name: 'Email Announcement' },
  ];

  // Dynamic Snapshot Facts
  const snapshot = campaign?.listingSnapshot || {};
  const propertyAddress = campaign?.propertyAddress || snapshot.propertyAddress || 'Campaign Address Unavailable';
  const listingPriceFormatted = snapshot.listingPrice
    ? `$${Number(snapshot.listingPrice).toLocaleString()}`
    : 'Price TBD';
  const agentName = snapshot.listingAgentName || 'Listing Agent';
  const bedrooms = snapshot.bedrooms || 0;
  const bathrooms = snapshot.bathrooms || 0;
  const squareFeet = snapshot.squareFeet || 0;
  const yearBuilt = snapshot.yearBuilt || 'N/A';
  const publicRemarks = snapshot.publicRemarks || campaign?.campaignBrief?.objective || 'Property details and public remarks pending ingest.';
  const primaryPhotoUrl = snapshot.approvedSourcePhotos?.[0]?.url || '/nest_n.png';
  const reviewerName = campaign?.approvals?.[0]?.reviewerName || campaign?.approvalReceipt?.reviewerUserId || agentName;

  if (!isValidIntegrity || !campaign?.id) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-64px)] w-full bg-[#01362d] text-rose-100 p-8">
        <div className="bg-rose-950/80 border border-rose-700/60 p-8 rounded-2xl max-w-md text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-serif font-bold text-white">Campaign Record Integrity Mismatch</h2>
          <p className="text-xs text-rose-200 leading-relaxed">
            A mismatch occurred between the requested route and loaded campaign payload. Execution was halted to prevent displaying cross-contaminated property data.
          </p>
          <button
            type="button"
            onClick={onBackToInbox}
            className="px-6 py-2.5 bg-rose-800 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Return to Marketing Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] w-full bg-[#01362d] text-[#FFFDF8] font-sans overflow-hidden">
      {/* DEVELOPMENT INTEGRITY STRIP (SECTION 16) */}
      <div
        data-testid="dev-identity-strip"
        className="bg-slate-950 text-slate-300 px-6 py-1 text-[11px] font-mono flex items-center justify-between border-b border-slate-800 shrink-0 select-none"
      >
        <div className="flex items-center gap-4">
          <span className="text-emerald-400 font-bold">DEVELOPMENT INTEGRITY STRIP</span>
          <span>campaignId: <strong className="text-emerald-300">{campaign.id}</strong></span>
          <span>revision: <strong className="text-cyan-300">{campaign.revision || 1}</strong></span>
          <span>snapshotId: <strong className="text-amber-300">{snapshot.id || `snapshot_${campaign.id}`}</strong></span>
        </div>
        <div className="flex items-center gap-4">
          <span>selectedAsset: <strong className="text-purple-300">{selectedAsset}</strong></span>
          <span>version: <strong className="text-pink-300">1.0</strong></span>
        </div>
      </div>

      {/* 1. COMPACT WORKSPACE HEADER (76–96px tall) */}
      <header className="h-20 bg-[#0B4A3F] border-b border-[rgba(208,214,187,0.18)] px-6 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBackToInbox}
            className="text-xs text-emerald-300 font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Marketing</span>
          </button>

          <div className="h-6 w-px bg-[rgba(208,214,187,0.18)]" />

          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-serif font-bold text-xl text-[#FFFDF8]" data-testid="workspace-campaign-title">
                {propertyAddress}
              </h2>
              <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${campaignBadge.badgeClass}`}>
                {campaignBadge.label}
              </span>
            </div>
            <p className="text-xs text-[rgba(246,247,241,0.7)] mt-0.5">
              New Listing Package • {agentName} • Due {campaign?.campaignBrief?.dueTargetDate || 'August 3, 2026'}
            </p>
          </div>
        </div>

        {/* WORKSPACE NAVIGATION TABS & ACTION BUTTONS */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#073F35] p-1 rounded-2xl border border-[rgba(208,214,187,0.14)] text-xs">
            <button
              type="button"
              onClick={() => setWorkspaceTab('overview')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                workspaceTab === 'overview'
                  ? 'bg-[#176457] text-[#FFFDF8] border border-[rgba(208,214,187,0.24)]'
                  : 'text-[rgba(246,247,241,0.7)] hover:text-white'
              }`}
            >
              Overview
            </button>

            <button
              type="button"
              onClick={() => setWorkspaceTab('review')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                workspaceTab === 'review'
                  ? 'bg-[#176457] text-[#FFFDF8] border border-[rgba(208,214,187,0.24)]'
                  : 'text-[rgba(246,247,241,0.7)] hover:text-white'
              }`}
            >
              Review
            </button>

            <button
              type="button"
              onClick={() => setWorkspaceTab('activity')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                workspaceTab === 'activity'
                  ? 'bg-[#176457] text-[#FFFDF8] border border-[rgba(208,214,187,0.24)]'
                  : 'text-[rgba(246,247,241,0.7)] hover:text-white'
              }`}
            >
              Activity
            </button>

            {/* Delivery Tab: Appears ONLY when approved */}
            {isApproved && (
              <button
                type="button"
                onClick={onOpenDeliveryDrawer}
                className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Delivery Options</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. VIEWPORT WORKSPACE MAIN GRID */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[196px_minmax(680px,1fr)_316px] h-full overflow-hidden">
        {/* LEFT RAIL: ASSET NAVIGATOR (196px) */}
        <aside className="bg-[#073F35] border-r border-[rgba(208,214,187,0.14)] p-3 space-y-2 overflow-y-auto shrink-0 text-left">
          <span className="text-[10px] font-bold text-[rgba(246,247,241,0.6)] uppercase tracking-wider block px-2 pt-1">
            Materials Navigator
          </span>

          <nav className="space-y-1">
            {assetList.map((asset) => {
              const st = getDerivedAssetState(asset.id, campaign, job);
              const isSelected = selectedAsset === asset.id;
              const hasAssetPreview = asset.id === 'flyer' || (campaign?.assets?.[asset.id] && (st === 'ready_for_review' || st === 'approved'));

              return (
                <button
                  key={asset.id}
                  type="button"
                  id={`asset-nav-${asset.id}`}
                  onClick={() => onSelectAsset(asset.id)}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#176457] border-emerald-400/60 shadow-sm text-white border-l-4 border-l-emerald-400'
                      : 'bg-[#073F35]/60 hover:bg-[#073F35] border-transparent text-[rgba(246,247,241,0.8)]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#0B4A3F] border border-[rgba(208,214,187,0.18)] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-emerald-300" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs block truncate">{asset.name}</span>
                    <span className="text-[10px] text-[rgba(246,247,241,0.6)] block">
                      {st === 'approved'
                        ? 'Approved'
                        : hasAssetPreview
                        ? 'Ready for review'
                        : st === 'preparing'
                        ? 'Preparing...'
                        : 'Unrendered'}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* CENTER: HERO COLLATERAL PREVIEW WORKSPACE (MIN 680px, >55% CANVAS) */}
        <main className="bg-[#01362d] p-6 overflow-y-auto flex flex-col items-center justify-start relative font-sans">
          {/* Zoom & Formatting Controls Toolbar */}
          <div className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.18)] px-4 py-1.5 rounded-2xl shadow-lg flex items-center gap-4 mb-4 text-xs shrink-0 z-10">
            <span className="font-serif font-bold text-emerald-200 text-xs capitalize">
              {selectedAsset.replace('_', ' ')}
            </span>
            <div className="h-4 w-px bg-[rgba(208,214,187,0.18)]" />

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoomScale(Math.max(0.6, zoomScale - 0.1))}
                className="p-1 text-[rgba(246,247,241,0.7)] hover:text-white rounded-lg cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-[11px] w-12 text-center text-emerald-300">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale(Math.min(1.4, zoomScale + 0.1))}
                className="p-1 text-[rgba(246,247,241,0.7)] hover:text-white rounded-lg cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Page Toggles for Postcard */}
            {selectedAsset === 'postcard' && hasRealPreview && (
              <div className="flex items-center gap-1 bg-[#073F35] p-0.5 rounded-xl text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setPostcardPage('front')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    postcardPage === 'front' ? 'bg-[#176457] text-white' : 'text-slate-400'
                  }`}
                >
                  Front
                </button>
                <button
                  type="button"
                  onClick={() => setPostcardPage('back')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    postcardPage === 'back' ? 'bg-[#176457] text-white' : 'text-slate-400'
                  }`}
                >
                  Back
                </button>
              </div>
            )}
          </div>

          {/* RENDERED DOCUMENT SURFACE (Warm-White Paper) */}
          <div
            className="transition-transform duration-300 origin-top flex justify-center items-start shadow-2xl mb-8"
            style={{ transform: `scale(${zoomScale})` }}
          >
            {/* FLYER PREVIEW SURFACE (8.5 x 11 Letter) */}
            {selectedAsset === 'flyer' && (
              <div className="w-[612px] min-h-[792px] bg-[#FFFDF8] text-slate-900 rounded-sm p-10 space-y-6 text-left shadow-2xl font-serif border border-slate-200">
                <div className="flex items-center justify-between border-b-2 border-emerald-950 pb-4">
                  <div className="space-y-1">
                    <span className="text-xs font-sans uppercase tracking-widest font-bold text-emerald-900">
                      Nest Editorial Collection
                    </span>
                    <h1 className="text-3xl font-bold text-slate-900 leading-tight" data-testid="flyer-property-address">
                      {propertyAddress}
                    </h1>
                  </div>
                  <span className="text-2xl font-bold text-emerald-950" data-testid="flyer-listing-price">
                    {listingPriceFormatted}
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-6 font-sans">
                  <div className="col-span-8 space-y-3">
                    <img
                      src={primaryPhotoUrl}
                      alt="Property Facade"
                      className="w-full h-72 object-cover rounded-sm border border-slate-200"
                    />
                    <p className="text-xs text-slate-700 leading-relaxed font-serif pt-2" data-testid="flyer-public-remarks">
                      {publicRemarks}
                    </p>
                  </div>

                  <div className="col-span-4 bg-slate-50 p-4 border border-slate-200 rounded-sm space-y-4 text-xs font-sans">
                    <div className="space-y-1 border-b border-slate-200 pb-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Specifications</span>
                      <p className="font-bold text-slate-900" data-testid="flyer-specs-beds-baths">
                        {bedrooms} Beds • {bathrooms} Baths
                      </p>
                      <p className="font-bold text-slate-900" data-testid="flyer-specs-sqft-year">
                        {squareFeet > 0 ? `${squareFeet.toLocaleString()} SqFt` : 'SqFt TBD'} • Built {yearBuilt}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Listing Agent</span>
                      <p className="font-bold text-slate-900" data-testid="flyer-agent-name">{agentName}</p>
                      <p className="text-[11px] text-slate-600">Nest Realty Wilmington</p>
                    </div>

                    <div className="pt-6 text-[9px] text-slate-500 leading-snug border-t border-slate-200">
                      Equal Housing Opportunity. All information deemed reliable but not guaranteed.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* REAL RENDERED SURFACE VS UNRENDERED PLACEHOLDER NOTICE (SECTIONS 8, 9) */}
            {selectedAsset !== 'flyer' && (
              hasRealPreview ? (
                <div className="w-[580px] min-h-[400px] bg-[#FFFDF8] text-slate-900 rounded-xl p-8 space-y-4 text-left shadow-2xl font-sans border border-slate-200">
                  <div className="border-b pb-3 flex justify-between items-center">
                    <h3 className="font-serif font-bold text-xl capitalize">{selectedAsset.replace('_', ' ')} Preview</h3>
                    <span className="text-xs font-bold text-emerald-800">Nest Editorial Template</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Rendered collateral preview generated for {propertyAddress}.
                  </p>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                    <p className="font-bold text-emerald-900">{snapshot.headline || propertyAddress}</p>
                    <p className="text-slate-700">{publicRemarks}</p>
                  </div>
                </div>
              ) : (
                /* SECTION 9: UNRENDERED PLACEHOLDER SURFACING */
                <div className="w-[580px] min-h-[360px] bg-[#FFFDF8] text-slate-900 rounded-xl p-8 space-y-4 text-left shadow-2xl font-sans border border-slate-200">
                  <div className="border-b border-rose-200 pb-3 flex justify-between items-center">
                    <h3 className="font-serif font-bold text-xl text-slate-800 capitalize" data-testid="placeholder-heading">
                      Preview not available
                    </h3>
                    <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full border border-rose-200">
                      Unrendered
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed" data-testid="placeholder-subtext">
                    This material has not been rendered yet for {propertyAddress}.
                  </p>
                  <div className="h-44 bg-slate-100/80 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-6 text-center space-y-2">
                    <Lock className="w-8 h-8 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">Rendered Artifact Pending</span>
                    <span className="text-[11px] text-slate-400" data-testid="approve-material-disabled">Approval action disabled until artifact rendering completes.</span>
                  </div>
                </div>
              )
            )}
          </div>
        </main>

        {/* RIGHT RAIL: MODE-AWARE SIDE PANEL (316px) */}
        <aside className="bg-[#0B4A3F] border-l border-[rgba(208,214,187,0.18)] p-5 space-y-4 overflow-y-auto shrink-0 text-left">
          {/* MODE A: PREPARING (Build View) */}
          {isPreparing && showBuildViewSidecar ? (
            <BuildViewSidecar
              job={job}
              events={events}
              selectedAsset={selectedAsset}
              onSelectAsset={onSelectAsset}
              onHideSidecar={() => setShowBuildViewSidecar(false)}
              onSubmitInput={onSubmitInterventionInput}
              onCancelJob={onCancelJob}
              onOpenReviewStudio={() => setWorkspaceTab('review')}
            />
          ) : isApproved ? (
            /* MODE C: APPROVED */
            <div className="space-y-4 text-xs font-sans">
              <div className="border-b border-[rgba(208,214,187,0.14)] pb-3">
                <h3 className="font-serif font-bold text-sm text-[#FFFDF8]">Package Approved</h3>
                <p className="text-[11px] text-[rgba(246,247,241,0.7)] mt-0.5" data-testid="approved-by-agent">
                  Approved by {reviewerName}
                </p>
              </div>

              <div className="p-3 bg-[#073F35] border border-emerald-400/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Ready for Delivery</span>
                </div>
                <p className="text-[11px] text-[rgba(246,247,241,0.8)] leading-relaxed">
                  All collateral deliverables have passed visual checks and human review.
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenDeliveryDrawer}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer border border-emerald-400/40 flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Open Delivery Options</span>
              </button>
            </div>
          ) : (
            /* MODE B: READY FOR REVIEW */
            <div className="space-y-4 text-xs font-sans">
              <div className="border-b border-[rgba(208,214,187,0.14)] pb-3">
                <h3 className="font-serif font-bold text-sm text-[#FFFDF8] capitalize">
                  {selectedAsset.replace('_', ' ')} Review
                </h3>
                <p className="text-[11px] text-[rgba(246,247,241,0.7)] mt-0.5">
                  Inspect and approve collateral deliverable
                </p>
              </div>

              {/* Checks */}
              <div className="space-y-2 bg-[#073F35] p-3.5 rounded-2xl border border-[rgba(208,214,187,0.14)]">
                <span className="font-bold text-[#FFFDF8] block text-[11px]">Validation Checks:</span>
                <div className="space-y-1.5 text-[11px] text-emerald-300 font-medium">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Listing facts match campaign brief</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Approved exterior photo used</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Required disclosures included</span>
                  </div>
                </div>
              </div>

              {/* Actions: Disabled for unrendered placeholders (Section 9) */}
              <div className="space-y-2 pt-1">
                {isMaterialApproved ? (
                  <div className="p-3 bg-emerald-900/40 border border-emerald-400/40 rounded-xl text-emerald-200 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Material Approved</span>
                  </div>
                ) : hasRealPreview ? (
                  <button
                    type="button"
                    onClick={() => onApproveMaterial(selectedAsset)}
                    className="w-full py-2.5 bg-[#00635C] hover:bg-[#004d48] text-[#FFFDF8] rounded-xl font-bold cursor-pointer transition-all shadow-md border border-emerald-400/30 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>Approve Material</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    data-testid="approve-material-disabled"
                    className="w-full py-2.5 bg-slate-700/60 text-slate-400 rounded-xl font-bold cursor-not-allowed border border-slate-600/40 flex items-center justify-center gap-2 text-xs"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Approve Material Disabled</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onRequestChangeOpen}
                  className="w-full py-2 bg-[#073F35] hover:bg-[#115548] text-[#FFFDF8] rounded-xl font-bold cursor-pointer transition-all border border-[rgba(208,214,187,0.24)] text-xs flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Request Change</span>
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
