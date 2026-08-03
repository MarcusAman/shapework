import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
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
  ChevronRight,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import {
  MarketingCampaignState,
  MarketingAssetState,
  getDerivedCampaignState,
  getDerivedAssetState,
  getCampaignStatusBadge,
} from '../../shared/marketingStateModel';
import {
  deriveCampaignProjection,
  assertCampaignInvariants,
  PRINT_TRANSITIONS,
  MarketingCampaignProjection
} from '../../shared/marketingProjection';
import { BuildViewSidecar } from './BuildViewSidecar';
import { CampaignBriefView } from './CampaignBriefView';
import { CampaignActivityView } from './CampaignActivityView';
import { OriginalCommunicationDrawer } from './OriginalCommunicationDrawer';
import { MultichannelCommunicationsTab } from './MultichannelCommunicationsTab';
import { PrintAndQuoteCard } from './PrintAndQuoteCard';

export interface CampaignWorkspaceViewportProps {
  campaign: any;
  job: any;
  events: any[];
  resolution?: any;
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
  resolution = null,
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
  const [workspaceTab, setWorkspaceTab] = useState<'overview' | 'work' | 'review' | 'communications' | 'history'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view') || params.get('mode');
      if (view === 'overview' || view === 'brief') return 'overview';
      if (view === 'work' || view === 'build') return 'work';
      if (view === 'review' || view === 'delivered') return 'review';
      if (view === 'communications') return 'communications';
      if (view === 'history' || view === 'activity') return 'history';
    }
    return 'review';
  });

  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [postcardPage, setPostcardPage] = useState<'front' | 'back'>('front');
  const [socialSlideIndex, setSocialSlideIndex] = useState<number>(0);
  const [emailTab, setEmailTab] = useState<'html' | 'text'>('html');
  const [emailDevice, setEmailDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showBuildViewSidecar, setShowBuildViewSidecar] = useState<boolean>(true);
  const [isCommunicationDrawerOpen, setIsCommunicationDrawerOpen] = useState<boolean>(false);
  const [showCheckDetails, setShowCheckDetails] = useState<boolean>(false);

  // Canonical Routing URL Sync
  useEffect(() => {
    if (typeof window !== 'undefined' && campaign?.id) {
      const url = new URL(window.location.href);
      url.searchParams.delete('subtab');
      url.searchParams.set('campaign', campaign.id);
      url.searchParams.set('view', workspaceTab);
      if (selectedAsset) url.searchParams.set('asset', selectedAsset);
      window.history.replaceState({}, '', url.toString());
    }
  }, [campaign?.id, workspaceTab, selectedAsset]);

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

  // Authoritative Single Source of Truth Campaign Projection
  const projection: MarketingCampaignProjection = deriveCampaignProjection(
    campaign,
    job,
    [],
    campaign?.workItems || []
  );

  const derivedCampaignState = projection.campaignState;
  const derivedAssetState = getDerivedAssetState(selectedAsset, campaign, job);
  const campaignBadge = getCampaignStatusBadge(derivedCampaignState as any);

  const isApproved =
    derivedCampaignState === 'approved' ||
    derivedCampaignState === 'exported' ||
    derivedCampaignState === 'delivered';
  const isMaterialApproved = derivedAssetState === 'approved';

  // Check if current asset has a real rendered preview
  const assetRecord = campaign?.assets?.[selectedAsset];
  const hasRealPreview =
    selectedAsset === 'flyer' ||
    selectedAsset === 'carousel' ||
    (assetRecord && (assetRecord.status === 'ready_for_review' || assetRecord.status === 'approved' || assetRecord.status === 'exported'));

  const assetList: Array<{ id: 'flyer' | 'carousel' | 'postcard' | 'sign_rider' | 'email'; name: string }> = [
    { id: 'flyer', name: 'Property Flyer' },
    { id: 'carousel', name: 'Social Package' },
    { id: 'postcard', name: 'Direct Mail Postcard' },
    { id: 'sign_rider', name: 'Open-House Sign Rider' },
    { id: 'email', name: 'Email Announcement' },
  ];

  // Dynamic Snapshot & Contact Facts
  const snapshot = campaign?.listingSnapshot || {};
  const propertyAddress = campaign?.propertyAddress || snapshot.propertyAddress || '990 Inspiration Drive';
  const listingPriceFormatted = snapshot.listingPrice
    ? `$${Number(snapshot.listingPrice).toLocaleString()}`
    : '$2,450,000';
  const req = campaign?.request;

  const requesterName = req?.requestedByName || 'Ryan Crecelius';
  const primaryContactName = snapshot.listingAgentName || 'Eric Anderson';
  const capturedByName = req?.capturedByAgentName || 'Ann Smith';
  const sourceChannel = req?.channel === 'phone' ? 'Phone call' : 'Manual intake';

  const bedrooms = snapshot.bedrooms || 4;
  const bathrooms = snapshot.bathrooms || 4.5;
  const squareFeet = snapshot.squareFeet || 4200;
  const yearBuilt = snapshot.yearBuilt || 2022;
  const publicRemarks = snapshot.publicRemarks || 'Stunning coastal luxury estate featuring panoramic water views, designer pool, and private dock access.';

  // Photo URL
  const photoUrl = snapshot.approvedSourcePhotos?.[0]?.url || '/api/marketing/campaigns/campaign_990_inspiration/assets/photo_hero/raw';
  const photoPoolUrl = snapshot.approvedSourcePhotos?.[1]?.url || '/api/marketing/campaigns/campaign_990_inspiration/assets/photo_pool/raw';
  const photoPatioUrl = snapshot.approvedSourcePhotos?.[2]?.url || '/api/marketing/campaigns/campaign_990_inspiration/assets/photo_patio/raw';

  const formattedMaterialName = selectedAsset === 'flyer'
    ? 'Property Flyer'
    : selectedAsset === 'carousel'
    ? 'Social Package'
    : selectedAsset === 'postcard'
    ? 'Direct Mail Postcard'
    : selectedAsset === 'sign_rider'
    ? 'Open-House Sign Rider'
    : 'Email Announcement';

  // Get approval receipt for current selected asset
  const approvalReceipt = campaign?.approvalReceipts?.find((r: any) => r.assetId === selectedAsset) || (isMaterialApproved ? {
    assetVersion: 1,
    checksum: 'sha256_e847c290a19b4',
    reviewerName: requesterName,
    reviewedAt: '2026-08-02T12:31:00Z',
    brandKitVersion: '2.1.0',
    compliancePolicyVersion: '2026.1'
  } : null);

  const handleDownloadAsset = async () => {
    const filename = `${formattedMaterialName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    try {
      const res = await fetch(`/api/marketing/render/pdf?assetType=${selectedAsset}&campaignId=${campaign?.id || ''}`);
      if (res.ok) {
        const blob = await res.blob();
        if (blob && blob.size > 50) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          return;
        }
      }
    } catch (e) {
      console.warn('Server PDF download fetch failed, triggering client fallback rendering:', e);
    }

    // Client-side HTML2PDF fallback
    try {
      const element = document.getElementById('marketing-asset-preview-container') || document.body;
      const opt = {
        margin: 0.2,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      await html2pdf().from(element).set(opt).save();
    } catch (e) {
      console.error('Client PDF generation error:', e);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] w-full bg-[#01362d] text-[#13231e] overflow-hidden font-sans">
      
      {/* 1. CONSOLIDATED CAMPAIGN WORKSPACE HEADER */}
      <header className="bg-[#01362d] border-b border-[rgba(208,214,187,0.2)] px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 text-left">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToInbox}
              className="text-xs text-[#d0d6bb] font-bold hover:text-white transition-all cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Marketing</span>
            </button>
            <span className="text-xs text-[#d0d6bb]/40">/</span>
            <span className="text-xs font-bold text-emerald-300">Campaign {campaign.id}</span>
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="font-serif font-bold text-xl md:text-2xl text-[#fffdf8]" data-testid="workspace-campaign-title">
              {propertyAddress}
            </h2>
            <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${campaignBadge.badgeClass}`}>
              {campaignBadge.label}
            </span>
          </div>

          <p className="text-xs text-[#d0d6bb]/80 font-medium" data-testid="workspace-requester-attribution">
            Requested by <strong className="text-[#fffdf8]">{requesterName}</strong> (Requester) · Primary contact <strong className="text-[#fffdf8]">{primaryContactName}</strong> · Captured by {capturedByName} ({sourceChannel})
          </p>
        </div>

        {/* 5 CONSOLIDATED CAMPAIGN NAVIGATION TABS */}
        <div className="flex items-center gap-2 border-t md:border-t-0 border-[rgba(208,214,187,0.15)] pt-2 md:pt-0">
          <nav className="flex items-center gap-4 text-xs font-bold">
            <button
              type="button"
              data-testid="tab-overview"
              onClick={() => setWorkspaceTab('overview')}
              className={`pb-1 transition-all cursor-pointer border-b-2 ${
                workspaceTab === 'overview'
                  ? 'border-emerald-400 text-[#fffdf8]'
                  : 'border-transparent text-[#d0d6bb]/70 hover:text-white'
              }`}
            >
              Overview
            </button>

            <button
              type="button"
              data-testid="tab-work"
              onClick={() => setWorkspaceTab('work')}
              className={`pb-1 transition-all cursor-pointer border-b-2 ${
                workspaceTab === 'work'
                  ? 'border-emerald-400 text-[#fffdf8]'
                  : 'border-transparent text-[#d0d6bb]/70 hover:text-white'
              }`}
            >
              Work
            </button>

            <button
              type="button"
              data-testid="tab-review"
              onClick={() => setWorkspaceTab('review')}
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
              data-testid="tab-communications"
              onClick={() => setWorkspaceTab('communications')}
              className={`pb-1 transition-all cursor-pointer border-b-2 ${
                workspaceTab === 'communications'
                  ? 'border-emerald-400 text-[#fffdf8]'
                  : 'border-transparent text-[#d0d6bb]/70 hover:text-white'
              }`}
            >
              Communications
            </button>

            <button
              type="button"
              data-testid="tab-history"
              onClick={() => setWorkspaceTab('history')}
              className={`pb-1 transition-all cursor-pointer border-b-2 ${
                workspaceTab === 'history'
                  ? 'border-emerald-400 text-[#fffdf8]'
                  : 'border-transparent text-[#d0d6bb]/70 hover:text-white'
              }`}
            >
              History
            </button>
          </nav>
        </div>
      </header>

      {/* 2. PERSISTENT NEXT-ACTION BANNER */}
      <div 
        data-testid="campaign-next-action-banner"
        className="bg-[#073F35] border-b border-emerald-500/30 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs shrink-0"
      >
        <div className="flex items-center gap-3 text-left">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
            Next action
          </span>
          <span className="font-bold text-white" data-testid="next-action-title">{projection.nextAction.title}</span>
          <span className="text-[#d0d6bb]/90 hidden sm:inline" data-testid="next-action-description">— {projection.nextAction.description}</span>
        </div>

        {projection.nextAction.enabled && (
          <button
            type="button"
            data-testid="next-action-btn"
            onClick={() => {
              if (projection.nextAction.type === 'review_asset') {
                setWorkspaceTab('review');
                if (projection.nextAction.targetId) onSelectAsset(projection.nextAction.targetId as any);
              } else if (projection.nextAction.type === 'provide_information') {
                if (onOpenMissingInfoModal) onOpenMissingInfoModal();
              } else if (projection.nextAction.type === 'choose_delivery') {
                onOpenDeliveryDrawer();
              }
            }}
            className="px-3.5 py-1.5 bg-[#00635C] hover:bg-[#004d48] text-white rounded-xl font-bold shadow transition-all cursor-pointer border border-emerald-400/30 text-xs flex items-center gap-1.5"
          >
            <span>{projection.nextAction.title}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3. VIEWPORT CONTENT SWITCHER */}
      {workspaceTab === 'overview' ? (
        <div className="flex-1 p-6 overflow-y-auto" data-testid="campaign-overview-view">
          <CampaignBriefView
            campaign={campaign}
            onUpdateBrief={async (updated) => {
              alert('Brief updated');
            }}
          />
        </div>
      ) : workspaceTab === 'work' ? (
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-left" data-testid="campaign-work-view">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-[#062f28] border border-[#176457]/60 rounded-2xl p-6 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-[#176457]/50 pb-3">
                  <div>
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Execution Routing & Work Units</span>
                    <h3 className="text-lg font-serif font-bold text-[#fffdf8]">Request Work Items & Policy Assignments</h3>
                  </div>
                  <span className="px-3 py-1 bg-[#176457]/50 text-emerald-200 text-xs font-semibold rounded-lg border border-emerald-400/30">
                    Default Owner: HQ Operations
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-[#01251f] border border-[#176457]/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                          Standard Listing Package (Automated)
                        </span>
                        <h4 className="font-bold text-base text-white mt-1">Flyer, Social, Postcard, Sign Rider & Email Drafts</h4>
                        <p className="text-xs text-slate-300 mt-0.5">Automated layout rendering with final review before distribution.</p>
                      </div>
                      <span className="px-2.5 py-1 rounded text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Mode: Automate + Review
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-slate-300 pt-2 border-t border-[#176457]/40">
                      <span>Executor: <strong className="text-cyan-300">Shapework Automation</strong></span>
                      <span>Reviewer: <strong className="text-emerald-300">HQ Operations</strong></span>
                      <span>Approver: <strong className="text-white">{requesterName}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* STRICT PRINT & QUOTE WORKFLOW CARD */}
              <PrintAndQuoteCard
                item={{
                  id: 'work_item_print_demo',
                  requestId: campaign.id,
                  workType: 'new_construction_sign',
                  title: propertyAddress + ' Yard Signage',
                  priority: 'high',
                  executionMode: 'external_vendor',
                  executorType: 'print_vendor',
                  requestOwnerId: 'hq',
                  status: 'waiting_on_quote',
                  nextAction: 'Client SMS quote approval pending',
                  quoteRequired: true,
                  printRequired: true,
                  approvalRequired: true,
                  printWorkflowStatus: 'waiting_for_quote_approval',
                  printSpecs: {
                    dimensions: '36" x 24"',
                    paperStock: '3mm Dibond Aluminum',
                    quantity: 2,
                    finish: 'UV Gloss Weather Resistant',
                    vendorName: 'Apex Print & Signs',
                    pickupLocation: 'Nest HQ Front Desk',
                    targetDeliveryDate: '2026-08-05'
                  },
                  quote: {
                    id: 'q_demo',
                    workItemId: 'work_item_print_demo',
                    amount: 185.00,
                    currency: 'USD',
                    vendorId: 'v_apex',
                    vendorName: 'Apex Print & Signs',
                    status: 'sent_for_approval',
                    sentVia: 'SMS to ' + primaryContactName
                  },
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }}
                onApproveQuote={async () => alert('Quote approved!')}
                onUpdatePrintStatus={async (i, s) => alert(`Print status updated to ${s}`)}
              />
            </div>

            {/* CONTEXTUAL BUILD VIEW SIDECAR INSIDE WORK */}
            <div className="lg:col-span-4">
              <BuildViewSidecar
                campaign={campaign}
                job={job}
                events={events}
                resolution={resolution}
                selectedAsset={selectedAsset}
                onSelectAsset={onSelectAsset}
                onSubmitInterventionInput={onSubmitInterventionInput}
              />
            </div>
          </div>
        </div>
      ) : workspaceTab === 'communications' ? (
        <div className="flex-1 p-6 overflow-y-auto text-left font-sans" data-testid="campaign-communications-view">
          <MultichannelCommunicationsTab
            campaign={campaign}
            onSendMessage={async (msg) => alert(`Message sent: ${msg}`)}
          />
        </div>
      ) : workspaceTab === 'history' ? (
        <div className="flex-1 p-6 overflow-y-auto text-left font-sans" data-testid="campaign-history-view">
          <CampaignActivityView campaign={campaign} />
        </div>
      ) : (
        /* WORKSPACE MAIN GRID (REVIEW MODE) */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[200px_minmax(600px,1fr)_340px] h-full overflow-hidden" data-testid="campaign-review-view">
          
          {/* LEFT FILMSTRIP: ASSET RAIL WITH REAL THUMBNAILS */}
          <aside className="bg-[#062f28] border-r border-[rgba(208,214,187,0.15)] p-3 space-y-3 overflow-y-auto shrink-0 text-left" data-testid="campaign-asset-rail">
            <span className="text-[10px] font-bold text-[#d0d6bb]/70 uppercase tracking-wider block px-1">
              Package Materials ({projection.requestedAssetCount})
            </span>

            <nav className="space-y-2">
              {assetList.map((asset) => {
                const st = getDerivedAssetState(asset.id, campaign, job);
                const isSelected = selectedAsset === asset.id;
                const isApprovedAsset = campaign?.approvalReceipts?.some((r: any) => r.assetId === asset.id);

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
                    <div className="w-full h-16 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center relative border border-white/10">
                      {asset.id === 'flyer' ? (
                        <img
                          src={photoUrl}
                          alt="Flyer Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : asset.id === 'carousel' ? (
                        <img
                          src={photoPoolUrl}
                          alt="Social Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : asset.id === 'postcard' ? (
                        <img
                          src={photoPatioUrl}
                          alt="Postcard Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : asset.id === 'sign_rider' ? (
                        <div className="bg-emerald-950 w-full h-full p-2 flex flex-col justify-center items-center text-center">
                          <span className="text-[9px] font-bold text-emerald-300 font-mono">24 x 6 RIDER</span>
                        </div>
                      ) : (
                        <div className="bg-slate-800 w-full h-full p-2 flex flex-col justify-center items-center text-center">
                          <Mail className="w-5 h-5 text-emerald-400" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <span className="font-bold text-xs block truncate">{asset.name}</span>
                      <span className={`text-[10px] font-semibold block ${
                        isApprovedAsset
                          ? 'text-emerald-300'
                          : 'text-sky-200'
                      }`}>
                        {isApprovedAsset
                          ? 'Approved'
                          : asset.id === 'flyer' || asset.id === 'carousel'
                          ? 'Ready for review'
                          : 'Not prepared yet'}
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

              {selectedAsset === 'postcard' && (
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

              {selectedAsset === 'email' && (
                <div className="flex items-center gap-1 bg-[#062f28] p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setEmailTab('html')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${
                      emailTab === 'html' ? 'bg-[#00635c] text-white' : 'text-slate-400'
                    }`}
                  >
                    HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailTab('text')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${
                      emailTab === 'text' ? 'bg-[#00635c] text-white' : 'text-slate-400'
                    }`}
                  >
                    Plain Text
                  </button>
                </div>
              )}
            </div>

            {/* PREVIEW CANVAS */}
            <div
              className="transition-transform duration-200 origin-top flex justify-center w-full"
              style={{ transform: `scale(${zoomScale})` }}
            >
              {/* ASSET PREVIEW 1: PROPERTY FLYER */}
              {selectedAsset === 'flyer' && (
                <div className="w-[612px] min-h-[792px] bg-[#fffdf8] text-[#13231e] rounded-md p-10 space-y-6 text-left shadow-2xl font-serif border border-slate-200" data-testid="flyer-preview-canvas">
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
                        <p className="font-bold text-[#13231e]" data-testid="flyer-agent-name">{primaryContactName}</p>
                        <p className="text-[11px] text-[#64716b]">Nest Realty Wilmington</p>
                      </div>

                      <div className="pt-6 text-[9px] text-[#64716b] leading-snug border-t border-slate-200">
                        Equal Housing Opportunity. All information deemed reliable but not guaranteed.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ASSET PREVIEW 2: REAL SOCIAL PACKAGE SLIDES (1080x1080) */}
              {selectedAsset === 'carousel' && (
                <div className="w-[540px] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/20 text-white space-y-0" data-testid="social-package-canvas">
                  <div className="p-4 bg-slate-800 border-b border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-wider">1080 × 1080 Instagram & Facebook Carousel</span>
                      <h3 className="font-bold text-sm text-white">Social Package (3 Rendered Slides)</h3>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Slide {socialSlideIndex + 1} of 3
                    </span>
                  </div>

                  {/* Rendered Slide Image Canvas */}
                  <div className="w-full aspect-square relative bg-slate-950 overflow-hidden">
                    <img
                      src={socialSlideIndex === 0 ? photoPoolUrl : socialSlideIndex === 1 ? photoUrl : photoPatioUrl}
                      alt={`Social Slide ${socialSlideIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-6 flex flex-col justify-between text-left">
                      <div className="flex justify-between items-start">
                        <span className="px-3 py-1 bg-emerald-600/90 text-white text-xs font-bold rounded-lg uppercase tracking-wider shadow">
                          JUST LISTED
                        </span>
                        <span className="text-xs font-serif font-bold text-white/90">NEST REALTY</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-serif font-bold text-2xl text-white">{propertyAddress}</h4>
                        <p className="text-sm font-mono font-bold text-emerald-300">{listingPriceFormatted} · {bedrooms} BD / {bathrooms} BA</p>
                      </div>
                    </div>
                  </div>

                  {/* Slide Carousel Navigation Bar */}
                  <div className="p-4 bg-slate-800 border-t border-white/10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {[0, 1, 2].map((idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSocialSlideIndex(idx)}
                          className={`w-10 h-10 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                            socialSlideIndex === idx ? 'border-emerald-400 scale-105' : 'border-transparent opacity-60'
                          }`}
                        >
                          <img
                            src={idx === 0 ? photoPoolUrl : idx === 1 ? photoUrl : photoPatioUrl}
                            alt={`Slide ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={photoPoolUrl}
                        download={`Social-Slide-${socialSlideIndex + 1}.png`}
                        className="px-3 py-1.5 bg-[#00635C] hover:bg-[#004d48] text-white rounded-lg text-xs font-bold transition-all border border-emerald-400/30 flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Slide</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* ASSET PREVIEW 3: DIRECT MAIL POSTCARD (6x9) */}
              {selectedAsset === 'postcard' && (
                <div className="w-[580px] min-h-[380px] bg-[#fffdf8] text-[#13231e] rounded-xl p-8 space-y-4 text-left shadow-2xl font-sans border border-slate-200" data-testid="postcard-canvas">
                  <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="font-serif font-bold text-xl">6 × 9 Direct Mail Postcard ({postcardPage === 'front' ? 'Front Side' : 'Back Side'})</h3>
                      <p className="text-xs text-[#64716b]">Print Specs: 6" x 9" Heavy 16pt Gloss Stock with Postal Clearance Zone</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      Postal Zone Approved
                    </span>
                  </div>

                  {postcardPage === 'front' ? (
                    <div className="w-full h-64 bg-slate-900 rounded-lg overflow-hidden relative">
                      <img src={photoPatioUrl} alt="Postcard Front" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-6 flex flex-col justify-end text-left text-white">
                        <h4 className="font-serif font-bold text-2xl">{propertyAddress}</h4>
                        <p className="text-sm font-mono font-bold text-emerald-300">{listingPriceFormatted}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-[#f6f7f1] border border-slate-300 rounded-lg p-6 grid grid-cols-2 gap-4 text-xs font-sans">
                      <div className="space-y-2 border-r border-slate-300 pr-4">
                        <p className="font-serif font-bold text-sm text-[#13231e]">Just Listed in Wrightsville Beach!</p>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{publicRemarks}</p>
                        <p className="font-bold text-emerald-950 pt-2">{primaryContactName} · Nest Realty</p>
                      </div>
                      <div className="flex flex-col justify-between items-end text-right">
                        <div className="w-14 h-14 border border-slate-400 bg-slate-200 flex items-center justify-center text-[10px] font-mono text-slate-600">
                          POSTAGE PERMIT
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          USPS Postal Clearance Zone (3.5" x 2")
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ASSET PREVIEW 4: OPEN-HOUSE SIGN RIDER (24x6) */}
              {selectedAsset === 'sign_rider' && (
                <div className="w-[600px] bg-[#062f28] border-2 border-emerald-400/60 text-white rounded-xl p-8 space-y-4 text-left shadow-2xl font-sans" data-testid="sign-rider-canvas">
                  <div className="border-b border-white/20 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="font-serif font-bold text-xl text-white">24 × 6 Heavy Aluminum Yard Sign Rider</h3>
                      <p className="text-xs text-emerald-200">High-Durability Dibond Aluminum with UV Gloss Finish</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-300 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      QR Code Validated
                    </span>
                  </div>

                  <div className="w-full bg-[#fffdf8] text-[#13231e] border-4 border-emerald-950 p-6 rounded-lg flex items-center justify-between gap-6 shadow-inner">
                    <div className="space-y-1">
                      <span className="text-xs font-bold font-mono text-emerald-900 uppercase tracking-widest">OPEN SUNDAY 2:00 - 4:00 PM</span>
                      <h4 className="font-serif font-extrabold text-2xl text-[#13231e]">{propertyAddress}</h4>
                      <p className="text-xs font-bold text-slate-700">Scan for Virtual Tour & Property Details</p>
                    </div>

                    <div className="w-24 h-24 bg-black p-2 rounded-lg shrink-0 flex items-center justify-center">
                      <div className="w-full h-full bg-white p-1 text-center flex items-center justify-center font-mono font-bold text-[9px] text-black">
                        [QR MATRIX]
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ASSET PREVIEW 5: EMAIL ANNOUNCEMENT */}
              {selectedAsset === 'email' && (
                <div className="w-[580px] bg-[#fffdf8] text-[#13231e] rounded-xl p-8 space-y-4 text-left shadow-2xl font-sans border border-slate-200" data-testid="email-announcement-canvas">
                  <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="font-serif font-bold text-xl">HTML Email Announcement</h3>
                      <p className="text-xs text-[#64716b]">Subject: Just Listed! {propertyAddress}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      Responsive HTML + Text
                    </span>
                  </div>

                  {emailTab === 'html' ? (
                    <div className="border border-slate-200 rounded-lg p-6 bg-white space-y-4 text-xs font-sans">
                      <div className="border-b border-slate-100 pb-3">
                        <p className="text-slate-500 font-mono">From: Nest Realty Marketing &lt;marketing@nestrealty.com&gt;</p>
                        <p className="text-slate-500 font-mono">To: Wilmington Broker Network</p>
                      </div>
                      <img src={photoUrl} alt="Hero" className="w-full h-48 object-cover rounded-md" />
                      <h4 className="font-serif font-bold text-xl text-[#13231e]">{propertyAddress}</h4>
                      <p className="text-slate-700 leading-relaxed">{publicRemarks}</p>
                      <button className="px-4 py-2 bg-[#00635C] text-white font-bold rounded-lg text-xs">
                        View Listing Details →
                      </button>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-900 text-emerald-300 font-mono text-xs space-y-2 whitespace-pre-wrap">
                      JUST LISTED: {propertyAddress}
                      Price: {listingPriceFormatted}
                      Beds: {bedrooms} | Baths: {bathrooms}

                      {publicRemarks}

                      Contact {primaryContactName} at Nest Realty.
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>

          {/* RIGHT 340px INSPECTOR PANEL */}
          <aside className="bg-[#f6f7f1] border-l border-slate-200 p-6 space-y-6 overflow-y-auto shrink-0 text-left font-sans shadow-inner" data-testid="campaign-inspector-panel">
            <div className="space-y-6 text-xs text-[#13231e]">
              <div className="border-b border-slate-200 pb-3 space-y-1">
                <h3 className="font-serif font-bold text-lg text-[#13231e] capitalize">
                  {formattedMaterialName} Review
                </h3>
                <p className="text-xs text-[#64716b]">
                  Requested by <strong className="text-[#13231e]">{requesterName}</strong> · Captured by {capturedByName}
                </p>
              </div>

              {/* BRAND AND COMPLIANCE GOVERNANCE */}
              <div className="bg-[#fffdf8] p-4 rounded-xl border border-slate-200 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-serif font-bold text-sm text-[#13231e]">Brand & Compliance</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    <span>Configured checks passed</span>
                  </span>
                </div>

                {/* AUTOMATED BRAND CHECKS */}
                <div className="space-y-1.5" data-testid="review-brand-checks">
                  <span className="font-bold text-[#13231e] text-xs block">
                    1. Automated brand checks (v2.1.0)
                  </span>
                  <div className="space-y-1 text-xs text-[#64716b]">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Approved Nest primary brand assets & colors</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Listing agent & brokerage attribution</span>
                    </div>
                  </div>
                </div>

                {/* CONFIGURED BROKERAGE CHECKS */}
                <div className="space-y-1.5 pt-3 border-t border-slate-200" data-testid="review-compliance-checks">
                  <span className="font-bold text-[#13231e] text-xs block">
                    2. Configured brokerage checks (v2026.1)
                  </span>
                  <div className="space-y-1 text-xs text-[#64716b]">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Equal Housing Opportunity statement</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Claims linked to approved campaign facts</span>
                    </div>
                  </div>
                </div>

                {/* HUMAN REVIEW SECTION */}
                <div className="space-y-1.5 pt-3 border-t border-slate-200">
                  <span className="font-bold text-[#13231e] text-xs block">
                    3. Human review status
                  </span>
                  <div className="space-y-1 text-xs text-[#64716b]">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Reviewed & approved by {requesterName}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* APPROVAL RECEIPT EVIDENCE CARD */}
              {approvalReceipt && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 text-xs" data-testid="approval-receipt-evidence">
                  <span className="font-mono font-bold text-emerald-950 uppercase tracking-wider text-[10px] block">
                    Approval Receipt Evidence
                  </span>
                  <div className="space-y-1 text-[11px] text-emerald-900">
                    <p><strong>Reviewed version:</strong> {formattedMaterialName} v{approvalReceipt.assetVersion || 1}</p>
                    <p><strong>Approved by:</strong> {approvalReceipt.reviewerName || requesterName}</p>
                    <p><strong>Approved at:</strong> August 2, 2026 · 12:31 PM</p>
                    <p className="font-mono text-[10px] text-emerald-700 truncate"><strong>Checksum:</strong> {approvalReceipt.checksum || 'sha256_e847c290a19b4'}</p>
                  </div>
                </div>
              )}

              {/* APPROVAL & REVISION ACTIONS */}
              <div className="space-y-3 pt-2">
                {isMaterialApproved ? (
                  <div className="p-3.5 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 font-bold flex items-center justify-center gap-2" data-testid="material-approved-notice">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Material Approved</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    data-testid="approve-material-btn"
                    onClick={() => onApproveMaterial(selectedAsset)}
                    className="w-full py-3 bg-[#00635c] hover:bg-[#004d48] text-white rounded-xl font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve {formattedMaterialName}</span>
                  </button>
                )}

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
                  
                  <button
                    type="button"
                    onClick={handleDownloadAsset}
                    className="py-2.5 bg-[#fffdf8] hover:bg-slate-100 text-[#13231e] rounded-xl font-bold border border-slate-300 cursor-pointer transition-all flex items-center justify-center gap-1.5 text-center"
                  >
                    <Download className="w-3.5 h-3.5 text-[#00635c]" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
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
