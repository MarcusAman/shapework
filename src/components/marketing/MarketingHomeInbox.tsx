import React from 'react';
import {
  Phone,
  Mail,
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  User,
  Bot,
  FileText,
  Layers,
  ChevronRight
} from 'lucide-react';
import { ListingMarketingCampaign } from '../../../server/persistence/marketingCampaignsRepository';
import { getDerivedCampaignState, getDerivedAssetState } from '../../shared/marketingStateModel';

export interface MarketingHomeInboxProps {
  campaigns: ListingMarketingCampaign[];
  onSelectCampaign: (id: string, mode?: 'overview' | 'review' | 'activity' | 'brief' | 'build') => void;
  onOpenNewRequestModal: () => void;
}

export const MarketingHomeInbox: React.FC<MarketingHomeInboxProps> = ({
  campaigns,
  onSelectCampaign,
  onOpenNewRequestModal,
}) => {
  // Categorize campaigns into Request Queue sections
  const needsAttention = campaigns.filter(c => {
    const derived = getDerivedCampaignState(c, null);
    return derived === 'needs_information' || c.status === 'needs_information' || (c.request && c.request.status === 'needs_information');
  });

  const beingPrepared = campaigns.filter(c => {
    const derived = getDerivedCampaignState(c, null);
    return (derived === 'preparing' || derived === 'ready_to_prepare' || c.status === 'preparing' || c.status === 'draft') && !needsAttention.includes(c);
  });

  const readyForReview = campaigns.filter(c => {
    const derived = getDerivedCampaignState(c, null);
    return (derived === 'ready_for_review' || derived === 'approved' || derived === 'delivered' || derived === 'exported' || c.status === 'approved' || c.status === 'completed') && !needsAttention.includes(c) && !beingPrepared.includes(c);
  });

  const getChannelIcon = (channel?: string) => {
    switch (channel) {
      case 'phone':
        return <Phone className="w-4 h-4 text-emerald-700" />;
      case 'email':
        return <Mail className="w-4 h-4 text-sky-700" />;
      case 'chat':
      case 'sms':
      case 'website_chatbot':
        return <MessageSquare className="w-4 h-4 text-purple-700" />;
      default:
        return <FileText className="w-4 h-4 text-slate-700" />;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AG';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-full min-h-screen bg-[#01362d] text-[#13231e] font-sans p-6 md:p-10 space-y-8" data-testid="marketing-home-inbox">
      {/* CUSTOMER PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[rgba(208,214,187,0.2)] pb-6 max-w-7xl mx-auto">
        <div className="space-y-1 text-left">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#fffdf8] tracking-tight" data-testid="marketing-home-title">
            Marketing
          </h1>
          <p className="text-sm md:text-base text-[#d0d6bb]/90 font-medium">
            Requests and listing campaigns handled by Shapework.
          </p>
        </div>

        <button
          type="button"
          data-testid="btn-new-marketing-request"
          onClick={onOpenNewRequestModal}
          className="px-5 py-3 bg-[#00635c] hover:bg-[#004d48] text-[#fffdf8] font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/30 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Marketing Request</span>
        </button>
      </header>

      {/* TWO-COLUMN DELEGATED-WORK INBOX LAYOUT */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto items-start">
        {/* LEFT COLUMN: REQUEST QUEUE (8 COLS) */}
        <section className="lg:col-span-8 space-y-8 text-left">
          {/* 1. NEEDS ATTENTION SECTION */}
          {needsAttention.length > 0 && (
            <div className="space-y-4" data-testid="section-needs-attention">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <h2 className="text-lg font-serif font-bold text-[#fffdf8]">Needs Attention</h2>
                  <span className="text-xs font-bold text-amber-900 bg-amber-300 px-2 py-0.5 rounded-full">
                    {needsAttention.length}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {needsAttention.map((c) => {
                  const req = c.request;
                  const requesterName = req?.requestedByName || c.listingSnapshot?.listingAgentName || 'Eric Anderson';
                  const requesterRole = req?.requestedByRole || 'Listing Agent';
                  const agentName = req?.capturedByAgentName || 'Ava · AI Phone Agent';
                  const channel = req?.channel || 'phone';
                  const excerpt = req?.originalRequestText || req?.aiSummary || 'Create a flyer, social package, postcard, sign rider, and email for 304 Ocean Blvd.';
                  const missingInfo = req?.missingInformation?.[0];

                  return (
                    <div
                      key={c.id}
                      data-testid={`request-card-${c.id}`}
                      className="bg-[#fef3c7] border border-amber-300/80 rounded-2xl p-6 shadow-md space-y-4 transition-all hover:shadow-xl"
                    >
                      {/* TOP BAR: IDENTITY & CHANNEL */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/60 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#01362d] text-[#fffdf8] font-bold text-xs flex items-center justify-center shadow-sm">
                            {getInitials(requesterName)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#13231e] text-sm" data-testid="row-requester-name">
                                {requesterName}
                              </span>
                              <span className="text-xs text-amber-900/70 font-medium">({requesterRole})</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-emerald-950/80 font-semibold" data-testid="row-capturing-agent">
                              {getChannelIcon(channel)}
                              <span>Captured by {agentName}</span>
                            </div>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-amber-900 bg-amber-200/80 px-3 py-1 rounded-full flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Today at 9:14 AM</span>
                        </span>
                      </div>

                      {/* MAIN CONTENT: PROPERTY ADDRESS & EXCERPT */}
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-between gap-4">
                          <h3 className="text-xl font-serif font-bold text-[#13231e]">
                            {c.listingSnapshot?.propertyAddress || c.propertyAddress}
                          </h3>
                          <span className="text-xs font-bold text-emerald-900 bg-emerald-100/90 px-2.5 py-1 rounded-md">
                            New Listing Package
                          </span>
                        </div>

                        <p className="text-sm text-[#13231e]/90 leading-relaxed font-sans italic bg-amber-100/60 p-3 rounded-xl border border-amber-200/50" data-testid="row-request-excerpt">
                          “{excerpt}”
                        </p>
                      </div>

                      {/* MATERIALS LIST */}
                      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-700">
                        {['Flyer', 'Social Package', 'Postcard', 'Sign Rider', 'Email'].map((m) => (
                          <span key={m} className="bg-white/80 border border-amber-300/60 text-[#13231e] px-2.5 py-1 rounded-lg">
                            {m}
                          </span>
                        ))}
                      </div>

                      {/* BLOCKER & PRIMARY ACTION BAR */}
                      <div className="flex flex-wrap items-center justify-between gap-4 bg-amber-200/60 p-4 rounded-xl border border-amber-300">
                        <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>
                            {missingInfo ? `Blocked by: ${missingInfo.label}` : 'Open-house hours required before sign rider & email preparation'}
                          </span>
                        </div>

                        <button
                          type="button"
                          data-testid="btn-action-needs-attention"
                          onClick={() => onSelectCampaign(c.id, 'brief')}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                          <span>Provide information</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. BEING PREPARED SECTION */}
          {beingPrepared.length > 0 && (
            <div className="space-y-4" data-testid="section-being-prepared">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h2 className="text-lg font-serif font-bold text-[#fffdf8]">Being Prepared</h2>
                  <span className="text-xs font-bold text-emerald-950 bg-emerald-300 px-2 py-0.5 rounded-full">
                    {beingPrepared.length}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {beingPrepared.map((c) => {
                  const req = c.request;
                  const requesterName = req?.requestedByName || c.listingSnapshot?.listingAgentName || 'Sarah Jenkins';
                  const requesterRole = req?.requestedByRole || 'Listing Agent';
                  const agentName = req?.capturedByAgentName || 'Shapework Email Agent';
                  const channel = req?.channel || 'email';
                  const excerpt = req?.originalRequestText || req?.aiSummary || 'Prepare direct mail postcard and property brochure for 212 Wetland Court.';

                  return (
                    <div
                      key={c.id}
                      data-testid={`request-card-${c.id}`}
                      className="bg-[#fffdf8] border border-[rgba(1,54,45,0.14)] rounded-2xl p-6 shadow-sm space-y-4 transition-all hover:shadow-md"
                    >
                      {/* TOP BAR: IDENTITY & CHANNEL */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#00635c] text-[#fffdf8] font-bold text-xs flex items-center justify-center shadow-sm">
                            {getInitials(requesterName)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#13231e] text-sm" data-testid="row-requester-name">
                                {requesterName}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">({requesterRole})</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-sky-800 font-semibold" data-testid="row-capturing-agent">
                              {getChannelIcon(channel)}
                              <span>Captured by {agentName}</span>
                            </div>
                          </div>
                        </div>

                        <span className="text-xs text-slate-500 font-medium">Today at 10:30 AM</span>
                      </div>

                      {/* MAIN CONTENT */}
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-between gap-4">
                          <h3 className="text-xl font-serif font-bold text-[#13231e]">
                            {c.listingSnapshot?.propertyAddress || c.propertyAddress}
                          </h3>
                          <span className="text-xs font-bold text-sky-900 bg-sky-100 px-2.5 py-1 rounded-md">
                            Direct Mail & Brochure
                          </span>
                        </div>

                        <p className="text-sm text-[#64716b] leading-relaxed italic bg-[#f6f7f1] p-3 rounded-xl border border-slate-200/60" data-testid="row-request-excerpt">
                          “{excerpt}”
                        </p>
                      </div>

                      {/* PROGRESS & ACTION BAR */}
                      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#f6f7f1] p-4 rounded-xl border border-slate-200/80">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full border-2 border-[#00635c] border-t-transparent animate-spin" />
                          <div>
                            <span className="font-bold text-xs text-[#13231e]">Shapework is preparing materials</span>
                            <p className="text-[11px] text-[#64716b]">1 of 3 materials ready to preview</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          data-testid="btn-action-preparing"
                          onClick={() => onSelectCampaign(c.id, 'build')}
                          className="px-4 py-2 bg-[#00635c] hover:bg-[#004d48] text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                          <span>View progress</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. READY FOR REVIEW SECTION */}
          {readyForReview.length > 0 && (
            <div className="space-y-4" data-testid="section-ready-for-review">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-lg font-serif font-bold text-[#fffdf8]">Ready for Review & Completed</h2>
                  <span className="text-xs font-bold text-slate-900 bg-emerald-300 px-2 py-0.5 rounded-full">
                    {readyForReview.length}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {readyForReview.map((c) => {
                  const req = c.request;
                  const requesterName = req?.requestedByName || c.listingSnapshot?.listingAgentName || 'Ryan Crecelius';
                  const requesterRole = req?.requestedByRole || 'Broker in Charge';
                  const agentName = req?.capturedByAgentName || 'Ann Smith · Manual Intake';
                  const channel = req?.channel || 'manual';
                  const isFullyApproved = c.status === 'approved' || c.status === 'completed';

                  return (
                    <div
                      key={c.id}
                      data-testid={`request-card-${c.id}`}
                      className="bg-[#fffdf8] border border-[rgba(1,54,45,0.14)] rounded-2xl p-6 shadow-sm space-y-4 transition-all hover:shadow-md"
                    >
                      {/* TOP BAR: IDENTITY */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#01362d] text-[#fffdf8] font-bold text-xs flex items-center justify-center shadow-sm">
                            {getInitials(requesterName)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#13231e] text-sm" data-testid="row-requester-name">
                                {requesterName}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">({requesterRole})</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold" data-testid="row-capturing-agent">
                              {getChannelIcon(channel)}
                              <span>Captured by {agentName}</span>
                            </div>
                          </div>
                        </div>

                        <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                          isFullyApproved ? 'bg-emerald-100 text-emerald-900' : 'bg-sky-100 text-sky-900'
                        }`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isFullyApproved ? 'Package Approved' : 'Ready for Review'}</span>
                        </span>
                      </div>

                      {/* MAIN CONTENT */}
                      <div className="space-y-2">
                        <h3 className="text-xl font-serif font-bold text-[#13231e]">
                          {c.listingSnapshot?.propertyAddress || c.propertyAddress}
                        </h3>
                        <p className="text-xs text-[#64716b]">
                          5-Material Luxury Launch Package (Flyer, Carousel, Postcard, Sign Rider, Email)
                        </p>
                      </div>

                      {/* MATERIAL THUMBNAIL SUMMARY */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                        {['Flyer', 'Carousel', 'Postcard', 'Sign Rider', 'Email'].map((materialName, idx) => (
                          <div key={materialName} className="bg-[#f6f7f1] p-3 rounded-xl border border-slate-200 text-center space-y-1.5">
                            <div className="w-full h-14 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 overflow-hidden relative">
                              {idx === 0 ? (
                                <img
                                  src="/api/marketing/campaigns/campaign_990_inspiration/assets/photo_hero/raw"
                                  alt="Flyer Preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : idx === 2 ? (
                                <img
                                  src="/api/marketing/campaigns/campaign_990_inspiration/assets/photo_pool/raw"
                                  alt="Postcard Preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FileText className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-[#13231e] block truncate">{materialName}</span>
                            <span className="text-[10px] text-emerald-700 font-semibold block">Ready</span>
                          </div>
                        ))}
                      </div>

                      {/* ACTION BAR */}
                      <div className="flex items-center justify-between border-t border-slate-200/80 pt-4">
                        <span className="text-xs text-[#64716b] font-medium">
                          {isFullyApproved ? 'Export & Delivery Available' : 'Requires Human Review & Sign-Off'}
                        </span>

                        <button
                          type="button"
                          data-testid="btn-action-review"
                          onClick={() => onSelectCampaign(c.id, 'review')}
                          className="px-5 py-2.5 bg-[#00635c] hover:bg-[#004d48] text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{isFullyApproved ? 'View Package' : 'Review Package'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: TODAY SUMMARY SIDEBAR (4 COLS) */}
        <aside className="lg:col-span-4 space-y-6 text-left shrink-0">
          <div className="bg-[#fffdf8] border border-[rgba(1,54,45,0.14)] rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="font-serif font-bold text-lg text-[#13231e] border-b border-slate-200/80 pb-3">
              Today Overview
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#f6f7f1] rounded-xl border border-slate-200/60">
                <span className="text-xs font-semibold text-[#64716b]">Needs Action</span>
                <span className="font-serif font-bold text-base text-amber-700">{needsAttention.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#f6f7f1] rounded-xl border border-slate-200/60">
                <span className="text-xs font-semibold text-[#64716b]">Being Prepared</span>
                <span className="font-serif font-bold text-base text-emerald-700">{beingPrepared.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#f6f7f1] rounded-xl border border-slate-200/60">
                <span className="text-xs font-semibold text-[#64716b]">Ready for Review</span>
                <span className="font-serif font-bold text-base text-sky-700">{readyForReview.length}</span>
              </div>
            </div>

            <div className="border-t border-slate-200/80 pt-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64716b] block">
                Active AI Agents
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-[#f6f7f1] rounded-xl">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="font-bold text-[#13231e]">Ava</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">Phone Agent</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[#f6f7f1] rounded-xl">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-sky-700" />
                    <span className="font-bold text-[#13231e]">Shapework Agent</span>
                  </div>
                  <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">Email Agent</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};
