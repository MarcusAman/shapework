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
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import {
  MarketingCampaignState,
  MarketingAssetState,
  getDerivedCampaignState,
  getDerivedAssetState,
  getCampaignStatusBadge,
} from '../../shared/marketingStateModel';
import { BuildViewSidecar } from './BuildViewSidecar';
import { CampaignBriefView } from './CampaignBriefView';
import { CampaignActivityView } from './CampaignActivityView';
import { OriginalCommunicationDrawer } from './OriginalCommunicationDrawer';
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
  onOpenMissingInfoModal?: () => void;
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
  onOpenMissingInfoModal,
  onSubmitInterventionInput,
  onCancelJob,
}) => {
  const [workspaceTab, setWorkspaceTab] = useState<'brief' | 'build' | 'review' | 'activity'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      if (mode === 'brief' || mode === 'build' || mode === 'review' || mode === 'activity') {
        return mode;
      }
    }
    return 'review';
  });
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [postcardPage, setPostcardPage] = useState<'front' | 'back'>('front');
  const [showBuildViewSidecar, setShowBuildViewSidecar] = useState<boolean>(true);
  const [isCommunicationDrawerOpen, setIsCommunicationDrawerOpen] = useState<boolean>(false);
  const [showCheckDetails, setShowCheckDetails] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      if (mode === 'brief') {
        setWorkspaceTab('brief');
      } else if (mode === 'activity') {
        setWorkspaceTab('activity');
      } else if (mode === 'build') {
        setWorkspaceTab('build');
        setShowBuildViewSidecar(true);
      } else if (mode === 'review' || mode === 'delivered') {
        setWorkspaceTab('review');
        setShowBuildViewSidecar(false);
      }
    }
  }, [campaign?.id]);

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-64px)] w-full bg-[#01362d] text-[#fffdf8] p-8 font-mono text-xs font-bold">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <span>Loading Campaign Record...</span>
        </div>
      </div>
    );
  }

  // Verify campaign integrity invariant once campaign is loaded
  assertCampaignIntegrity(
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

  const isApproved = derivedCampaignState === 'approved' || derivedCampaignState === 'partially_approved' || derivedCampaignState === 'delivered' || derivedCampaignState === 'exported' || campaign?.status === 'approved';
  const isMaterialApproved = derivedAssetState === 'approved';

  // Check if current asset has a real rendered preview
  const assetRecord = campaign?.assets?.[selectedAsset];
  const hasRealPreview =
    selectedAsset === 'flyer' ||
    (assetRecord && (assetRecord.status === 'ready_for_review' || assetRecord.status === 'approved' || assetRecord.status === 'exported'));

  const assetList: Array<{ id: 'flyer' | 'carousel' | 'postcard' | 'sign_rider' | 'email'; name: string }> = [
    { id: 'flyer', name: 'Property Flyer' },
    { id: 'carousel', name: 'Social Package' },
    { id: 'postcard', name: 'Direct Mail Postcard' },
    { id: 'sign_rider', name: 'Open-House Sign Rider' },
    { id: 'email', name: 'Email Announcement' },
  ];

  // Dynamic Snapshot Facts
  const snapshot = campaign?.listingSnapshot || {};
  const propertyAddress = campaign?.propertyAddress || snapshot.propertyAddress || 'Campaign Address Unavailable';
  const listingPriceFormatted = snapshot.listingPrice
    ? `$${Number(snapshot.listingPrice).toLocaleString()}`
    : 'Price TBD';
  const req = campaign?.request;
  const agentName = req?.requestedByName || snapshot.listingAgentName || 'Eric Anderson';
  const capturingAgentName = req?.capturedByAgentName || 'Ava · AI Phone Agent';
  const bedrooms = snapshot.bedrooms || 4;
  const bathrooms = snapshot.bathrooms || 4.5;
  const squareFeet = snapshot.squareFeet || 4200;
  const yearBuilt = snapshot.yearBuilt || 2022;
  const publicRemarks = snapshot.publicRemarks || campaign?.campaignBrief?.objective || 'Property details and public remarks pending ingest.';
  
  // Property Photo Logic
  const photoUrl = selectedAsset === 'postcard' && snapshot.approvedSourcePhotos?.[1]?.url
    ? snapshot.approvedSourcePhotos[1].url
    : snapshot.approvedSourcePhotos?.[0]?.url || '/nest_n.png';

  const formattedMaterialName = selectedAsset === 'flyer'
    ? 'Property Flyer'
    : selectedAsset === 'carousel'
    ? 'Social Package'
    : selectedAsset === 'postcard'
    ? 'Direct Mail Postcard'
    : selectedAsset === 'sign_rider'
    ? 'Open-House Sign Rider'
    : 'Email Announcement';

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] w-full bg-[#01362d] text-[#13231e] overflow-hidden font-sans">
      
      {/* 1. CAMPAIGN WORKSPACE HEADER */}
      <header className="bg-[#01362d] border-b border-[rgba(208,214,187,0.2)] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 text-left">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToInbox}
              className="text-xs text-[#d0d6bb] font-bold hover:text-white transition-all cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Marketing</span>
            </button>
            <span className="text-xs text-[#d0d6bb]/40">/</span>
            <span className="text-xs font-bold text-emerald-300">New Listing Package</span>
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="font-serif font-bold text-2xl md:text-3xl text-[#fffdf8]" data-testid="workspace-campaign-title">
              {propertyAddress}
            </h2>
            <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${campaignBadge.badgeClass}`}>
              {campaignBadge.label}
            </span>
          </div>

          <p className="text-xs text-[#d0d6bb]/80 font-medium" data-testid="workspace-requester-attribution">
            Requested by <strong className="text-[#fffdf8]">{agentName}</strong> · Captured by {capturingAgentName} · Today at 9:14 AM
          </p>
        </div>

        {/* WORKSPACE NAVIGATION SECONDARY ROW */}
        <div className="flex items-center gap-2 border-t md:border-t-0 border-[rgba(208,214,187,0.15)] pt-3 md:pt-0">
          <nav className="flex items-center gap-6 text-sm font-bold">
            <button
              type="button"
              data-testid="tab-brief"
              onClick={() => setWorkspaceTab('brief')}
              className={`pb-1 transition-all cursor-pointer border-b-2 ${
                workspaceTab === 'brief'
                  ? 'border-emerald-400 text-[#fffdf8]'
                  : 'border-transparent text-[#d0d6bb]/70 hover:text-white'
              }`}
            >
              Brief
            </button>

            <button
              type="button"
              data-testid="tab-build"
              onClick={() => {
                setWorkspaceTab('build');
                setShowBuildViewSidecar(true);
              }}
              className={`pb-1 transition-all cursor-pointer border-b-2 ${
                workspaceTab === 'build'
                  ? 'border-emerald-400 text-[#fffdf8]'
                  : 'border-transparent text-[#d0d6bb]/70 hover:text-white'
              }`}
            >
              Build
            </button>

            <button
              type="button"
              data-testid="tab-review"
              onClick={() => {
                setWorkspaceTab('review');
                setShowBuildViewSidecar(false);
              }}
              className={`pb-1 transition-all cursor-pointer border-b-2 ${
                workspaceTab === 'review'
                  ? 'border-emerald-400 text-[#fffdf8]'
                  : 'border-transparent text-[#d0d6bb]/70 hover:text-white'
              }`}
            >
              Review
            </button>

            <button
              type="button"
              data-testid="tab-activity"
              onClick={() => setWorkspaceTab('activity')}
              className={`pb-1 transition-all cursor-pointer border-b-2 ${
                workspaceTab === 'activity'
                  ? 'border-emerald-400 text-[#fffdf8]'
                  : 'border-transparent text-[#d0d6bb]/70 hover:text-white'
              }`}
            >
              Activity
            </button>

            {/* Delivery Tab */}
            {isApproved && (
              <button
                type="button"
                data-testid="tab-delivery"
                onClick={onOpenDeliveryDrawer}
                className="px-3.5 py-1.5 bg-[#00635c] hover:bg-[#004d48] text-white rounded-xl font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 text-xs ml-2"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Delivery Options</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* 2. VIEWPORT CONTENT SWITCHER */}
      {workspaceTab === 'brief' ? (
        <div className="flex-1 p-6 overflow-y-auto">
          <CampaignBriefView
            campaign={campaign}
            onOpenOriginalCommunication={() => setIsCommunicationDrawerOpen(true)}
            onResolveMissingInformation={onOpenMissingInfoModal || onRequestChangeOpen}
          />
        </div>
      ) : workspaceTab === 'activity' ? (
        <div className="flex-1 p-6 overflow-y-auto">
          <CampaignActivityView campaign={campaign} />
        </div>
      ) : (
        /* WORKSPACE MAIN GRID (BUILD / REVIEW MODE) */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[190px_minmax(600px,1fr)_330px] h-full overflow-hidden">
          
          {/* LEFT 190px FILMSTRIP: ASSET NAVIGATOR */}
          <aside className="bg-[#062f28] border-r border-[rgba(208,214,187,0.15)] p-3 space-y-3 overflow-y-auto shrink-0 text-left">
            <span className="text-[10px] font-bold text-[#d0d6bb]/70 uppercase tracking-wider block px-1">
              Package Materials
            </span>

            <nav className="space-y-2">
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
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-[#00635c] border-emerald-400 text-white shadow-md'
                        : 'bg-[#01362d]/60 hover:bg-[#01362d] border-transparent text-[#d0d6bb]'
                    }`}
                  >
                    {/* THUMBNAIL BOX */}
                    <div className="w-full h-16 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center relative">
                      {asset.id === 'flyer' ? (
                        <img
                          src="/api/marketing/campaigns/campaign_990_inspiration/assets/photo_hero/raw"
                          alt="Flyer Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : asset.id === 'postcard' && hasAssetPreview ? (
                        <img
                          src="/api/marketing/campaigns/campaign_990_inspiration/assets/photo_pool/raw"
                          alt="Postcard Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="w-6 h-6 text-slate-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <span className="font-bold text-xs block truncate">{asset.name}</span>
                      <span className={`text-[10px] font-semibold block ${
                        st === 'approved'
                          ? 'text-emerald-300'
                          : hasAssetPreview
                          ? 'text-sky-200'
                          : 'text-[#d0d6bb]/60'
                      }`}>
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

          {/* CENTER: UNCLUTTERED DARK WORKSPACE CANVAS */}
          <main className="bg-[#062f28] p-6 overflow-y-auto flex flex-col items-center justify-start relative font-sans">
            {/* Zoom & Page Controls Toolbar */}
            <div className="bg-[#01362d] border border-[rgba(208,214,187,0.2)] px-4 py-1.5 rounded-xl shadow-lg flex items-center gap-4 mb-4 text-xs shrink-0 z-10">
              <span className="font-serif font-bold text-[#fffdf8] text-xs capitalize">
                {formattedMaterialName}
              </span>
              <div className="h-4 w-px bg-[rgba(208,214,187,0.2)]" />

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setZoomScale(Math.max(0.6, zoomScale - 0.1))}
                  className="p-1 text-[#d0d6bb] hover:text-white rounded-lg cursor-pointer"
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
                  className="p-1 text-[#d0d6bb] hover:text-white rounded-lg cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {selectedAsset === 'postcard' && hasRealPreview && (
                <div className="flex items-center gap-1 bg-[#062f28] p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPostcardPage('front')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${
                      postcardPage === 'front' ? 'bg-[#00635c] text-white' : 'text-slate-400'
                    }`}
                  >
                    Front
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostcardPage('back')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${
                      postcardPage === 'back' ? 'bg-[#00635c] text-white' : 'text-slate-400'
                    }`}
                  >
                    Back
                  </button>
                </div>
              )}
            </div>

            {/* PREVIEW CANVAS */}
            <div
              className="transition-transform duration-200 origin-top flex justify-center w-full"
              style={{ transform: `scale(${zoomScale})` }}
            >
              {selectedAsset === 'flyer' && (
                <div className="w-[612px] min-h-[792px] bg-[#fffdf8] text-[#13231e] rounded-md p-10 space-y-6 text-left shadow-2xl font-serif border border-slate-200">
                  <div className="flex items-center justify-between border-b-2 border-emerald-950 pb-4">
                    <div className="space-y-1">
                      <span className="text-xs font-sans uppercase tracking-widest font-bold text-emerald-900">
                        Nest Editorial Collection
                      </span>
                      <h1 className="text-3xl font-bold text-[#13231e] leading-tight" data-testid="flyer-property-address">
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
                        src={photoUrl}
                        alt="Property Facade"
                        className="w-full h-72 object-cover rounded-sm border border-slate-200"
                      />
                      <p className="text-xs text-[#13231e]/90 leading-relaxed font-serif pt-2" data-testid="flyer-public-remarks">
                        {publicRemarks}
                      </p>
                    </div>

                    <div className="col-span-4 bg-[#f6f7f1] p-4 border border-slate-200 rounded-sm space-y-4 text-xs font-sans">
                      <div className="space-y-1 border-b border-slate-200 pb-2">
                        <span className="text-[10px] text-[#64716b] font-bold uppercase">Specifications</span>
                        <p className="font-bold text-[#13231e]" data-testid="flyer-specs-beds-baths">
                          {bedrooms} Beds • {bathrooms} Baths
                        </p>
                        <p className="font-bold text-[#13231e]" data-testid="flyer-specs-sqft-year">
                          {squareFeet > 0 ? `${squareFeet.toLocaleString()} SqFt` : 'SqFt TBD'} • Built {yearBuilt}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-[#64716b] font-bold uppercase">Listing Agent</span>
                        <p className="font-bold text-[#13231e]" data-testid="flyer-agent-name">{agentName}</p>
                        <p className="text-[11px] text-[#64716b]">{campaign?.brandKit?.officeName || 'Nest Realty Wilmington'}</p>
                      </div>

                      <div className="pt-6 text-[9px] text-[#64716b] leading-snug border-t border-slate-200">
                        Equal Housing Opportunity. All information deemed reliable but not guaranteed.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RENDERED PREVIEW VS UNRENDERED QUIET EMPTY STATE */}
              {selectedAsset !== 'flyer' && (
                hasRealPreview ? (
                  <div className="w-[580px] min-h-[400px] bg-[#fffdf8] text-[#13231e] rounded-xl p-8 space-y-4 text-left shadow-2xl font-sans border border-slate-200">
                    <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                      <h3 className="font-serif font-bold text-xl capitalize">{formattedMaterialName} Preview</h3>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        Nest Editorial Template
                      </span>
                    </div>
                    <p className="text-xs text-[#64716b]">
                      Rendered collateral preview generated for {propertyAddress}.
                    </p>
                    <div className="p-4 bg-[#f6f7f1] border border-slate-200 rounded-lg text-xs space-y-2">
                      <p className="font-bold text-emerald-950">{snapshot.headline || propertyAddress}</p>
                      <p className="text-[#13231e]">{publicRemarks}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-[580px] min-h-[360px] bg-[#fffdf8] text-[#13231e] rounded-xl p-8 space-y-6 text-left shadow-2xl font-sans border border-slate-200">
                    <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                      <div>
                        <h3 className="font-serif font-bold text-xl text-[#13231e]" data-testid="placeholder-heading">
                          {formattedMaterialName}
                        </h3>
                        <p className="text-xs text-[#64716b]">Not prepared yet</p>
                      </div>
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                        Unrendered
                      </span>
                    </div>

                    <p className="text-sm text-[#64716b] leading-relaxed" data-testid="placeholder-subtext">
                      Shapework will begin preparing this material once the required campaign information is complete.
                    </p>

                    <div className="bg-amber-50 border border-amber-300 p-5 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Blocked by missing information</span>
                      </div>
                      <p className="text-xs text-amber-950">
                        Open-house start and end time needed for {formattedMaterialName}.
                      </p>
                      <button
                        type="button"
                        onClick={onOpenMissingInfoModal || onRequestChangeOpen}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
                      >
                        Provide information
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </main>

          {/* RIGHT 330px REVIEW PANEL */}
          <aside className="bg-[#f6f7f1] border-l border-slate-200 p-6 space-y-6 overflow-y-auto shrink-0 text-left font-sans shadow-inner">
            {workspaceTab === 'build' || (isPreparing && showBuildViewSidecar) ? (
              <BuildViewSidecar
                campaign={campaign}
                job={job}
                events={events}
                selectedAsset={selectedAsset}
                onSelectAsset={onSelectAsset}
                onSubmitInterventionInput={onSubmitInterventionInput}
              />
            ) : (
              /* LIGHT REVIEW PANEL */
              <div className="space-y-6 text-xs text-[#13231e]">
                <div className="border-b border-slate-200 pb-3 space-y-1">
                  <h3 className="font-serif font-bold text-lg text-[#13231e] capitalize">
                    {formattedMaterialName} Review
                  </h3>
                  <p className="text-xs text-[#64716b]">
                    Requested by <strong className="text-[#13231e]">{agentName}</strong> · Captured by {capturingAgentName}
                  </p>
                </div>

                {/* BRAND AND COMPLIANCE GOVERNANCE */}
                <div className="bg-[#fffdf8] p-4 rounded-xl border border-slate-200 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-serif font-bold text-sm text-[#13231e]">Brand & Compliance</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      Passed
                    </span>
                  </div>

                  {/* BRAND KIT CHECKS */}
                  <div className="space-y-1.5" data-testid="review-brand-checks">
                    <span className="font-bold text-[#13231e] text-xs block">
                      Nest Wilmington brand kit (v{campaign?.brandKit?.version || '2.1.0'})
                    </span>
                    {hasRealPreview ? (
                      <div className="space-y-1 text-xs text-[#64716b]">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Approved primary logo & colors</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Listing agent & brokerage attribution</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">Not run (Unrendered)</p>
                    )}
                  </div>

                  {/* COMPLIANCE CHECKS */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-200" data-testid="review-compliance-checks">
                    <span className="font-bold text-[#13231e] text-xs block">
                      North Carolina marketing policy (v{campaign?.compliancePolicySet?.version || '2026.1'})
                    </span>
                    {hasRealPreview ? (
                      <div className="space-y-1 text-xs text-[#64716b]">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Equal Housing Opportunity disclosure</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Claims linked to approved campaign facts</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">Not run (Unrendered)</p>
                    )}
                  </div>

                  {/* DETAILS TOGGLE */}
                  <button
                    type="button"
                    onClick={() => setShowCheckDetails(!showCheckDetails)}
                    className="text-[11px] font-bold text-[#00635c] hover:underline cursor-pointer flex items-center gap-1 pt-1"
                  >
                    <span>{showCheckDetails ? 'Hide check details' : 'View check details'}</span>
                    {showCheckDetails ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>

                  {showCheckDetails && (
                    <div className="p-3 bg-[#f6f7f1] rounded-lg text-[10px] text-[#64716b] font-mono space-y-1">
                      <p>Brand Rule: #00635C, #D0D6BB, #FFFDF8</p>
                      <p>Compliance Rule: NCREC #C2519 Validated</p>
                    </div>
                  )}
                </div>

                {/* APPROVAL & REVISION ACTIONS */}
                <div className="space-y-3 pt-2">
                  {isMaterialApproved ? (
                    <div className="p-3.5 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 font-bold flex items-center justify-center gap-2" data-testid="material-approved-notice">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Material Approved</span>
                    </div>
                  ) : hasRealPreview ? (
                    <button
                      type="button"
                      data-testid="approve-material-btn"
                      onClick={() => onApproveMaterial(selectedAsset)}
                      className="w-full py-3 bg-[#00635c] hover:bg-[#004d48] text-white rounded-xl font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Flyer</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      data-testid="approve-material-disabled"
                      className="w-full py-3 bg-slate-200 text-slate-400 rounded-xl font-bold cursor-not-allowed border border-slate-300 flex items-center justify-center gap-2 text-xs"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Approve Disabled</span>
                    </button>
                  )}

                  {hasRealPreview ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        data-testid="request-change-btn"
                        onClick={onRequestChangeOpen}
                        className="py-2.5 bg-[#fffdf8] hover:bg-slate-100 text-[#13231e] rounded-xl font-bold border border-slate-300 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#00635c]" />
                        <span>Request change</span>
                      </button>
                      
                      <a
                        href="/Nest-Editorial-Flyer.pdf"
                        download="Nest-Editorial-Flyer.pdf"
                        className="py-2.5 bg-[#fffdf8] hover:bg-slate-100 text-[#13231e] rounded-xl font-bold border border-slate-300 cursor-pointer transition-all flex items-center justify-center gap-1.5 text-center"
                      >
                        <Download className="w-3.5 h-3.5 text-[#00635c]" />
                        <span>Download</span>
                      </a>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setWorkspaceTab('brief')}
                      className="w-full py-2.5 bg-[#fffdf8] hover:bg-slate-100 text-[#13231e] rounded-xl font-bold border border-slate-300 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#00635c]" />
                      <span>Edit campaign brief</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ORIGINAL COMMUNICATION DRAWER */}
      <OriginalCommunicationDrawer
        campaign={campaign}
        isOpen={isCommunicationDrawerOpen}
        onClose={() => setIsCommunicationDrawerOpen(false)}
      />
    </div>
  );
};
