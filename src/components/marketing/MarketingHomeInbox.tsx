import React from 'react';
import { Sparkles, Plus, AlertCircle, CheckCircle2, ChevronRight, FileText, Phone, Mail, MessageSquare, UserCheck, Bot } from 'lucide-react';
import { getDerivedCampaignState, getCampaignStatusBadge } from '../../shared/marketingStateModel';

export interface CampaignRowItem {
  id: string;
  propertyAddress: string;
  listingAgentId?: string;
  status: string;
  deliveryStatus?: string;
  approvalReceipt?: any;
  deliveryReceipts?: any[];
  missingInformation?: any;
  assetApprovals?: Record<string, boolean>;
  request?: {
    id: string;
    channel: string;
    status: string;
    receivedAt: string;
    capturedByAgentName?: string;
    capturedByAgentType?: string;
    requestedByName?: string;
    requestedByRole?: string;
    onBehalfOfName?: string;
    originalRequestText?: string;
    aiSummary?: string;
    missingInformation?: any[];
  };
  listingSnapshot?: {
    listingAgentName?: string;
    propertyAddress?: string;
  };
}

export interface MarketingHomeInboxProps {
  campaigns: CampaignRowItem[];
  activeJob: any;
  onSelectCampaign: (campaignId: string, mode?: 'brief' | 'build' | 'review' | 'activity') => void;
  onNewRequest: () => void;
  isOperator?: boolean;
}

export const MarketingHomeInbox: React.FC<MarketingHomeInboxProps> = ({
  campaigns,
  activeJob,
  onSelectCampaign,
  onNewRequest,
}) => {
  const needsAttention: CampaignRowItem[] = [];
  const activePreparing: CampaignRowItem[] = [];
  const readyForReview: CampaignRowItem[] = [];
  const recentCompleted: CampaignRowItem[] = [];

  campaigns.forEach((c) => {
    const jobForCampaign = activeJob?.campaignId === c.id ? activeJob : null;
    const derived = getDerivedCampaignState(c as any, jobForCampaign);

    if (derived === 'needs_information' || derived === 'changes_requested') {
      needsAttention.push(c);
    } else if (derived === 'preparing' || derived === 'ready_to_prepare') {
      activePreparing.push(c);
    } else if (derived === 'ready_for_review' || derived === 'partially_approved') {
      readyForReview.push(c);
    } else {
      recentCompleted.push(c);
    }
  });

  const getChannelIcon = (channel?: string) => {
    switch (channel) {
      case 'phone':
        return <Phone className="w-3.5 h-3.5 text-emerald-300 shrink-0" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-sky-300 shrink-0" />;
      case 'sms':
      case 'chat':
      case 'website_chatbot':
        return <MessageSquare className="w-3.5 h-3.5 text-purple-300 shrink-0" />;
      default:
        return <UserCheck className="w-3.5 h-3.5 text-slate-300 shrink-0" />;
    }
  };

  const renderCampaignRow = (campaign: CampaignRowItem) => {
    const jobForCampaign = activeJob?.campaignId === campaign.id ? activeJob : null;
    const derivedState = getDerivedCampaignState(campaign as any, jobForCampaign);
    const badge = getCampaignStatusBadge(derivedState);
    const req = campaign.request;

    const requesterName = req?.requestedByName || campaign.listingSnapshot?.listingAgentName || 'Agent';
    const agentName = req?.capturedByAgentName || 'Shapework Agent';
    const channel = req?.channel || 'manual';

    let primaryActionLabel = 'Review package';
    let targetMode: 'brief' | 'build' | 'review' | 'activity' = 'review';

    if (derivedState === 'needs_information') {
      primaryActionLabel = 'Provide information';
      targetMode = 'brief';
    } else if (derivedState === 'ready_to_prepare' || derivedState === 'preparing') {
      primaryActionLabel = 'View progress';
      targetMode = 'build';
    } else if (derivedState === 'approved') {
      primaryActionLabel = 'Review package';
      targetMode = 'review';
    } else if (derivedState === 'exported' || derivedState === 'delivered') {
      primaryActionLabel = 'View campaign';
      targetMode = 'review';
    }

    const requestExcerpt = req?.originalRequestText
      ? `“${req.originalRequestText.length > 80 ? req.originalRequestText.slice(0, 80) + '…' : req.originalRequestText}”`
      : '“Create property flyer, social package, postcard, sign rider, and email.”';

    return (
      <div
        key={campaign.id}
        data-testid={`campaign-row-${campaign.id}`}
        onClick={() => onSelectCampaign(campaign.id, targetMode)}
        className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.18)] hover:border-emerald-400/40 rounded-2xl p-5 shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 h-auto group"
      >
        <div className="space-y-1.5 min-w-0 text-left flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3
              className="font-serif font-bold text-lg text-[#FFFDF8] group-hover:text-emerald-200 transition-colors truncate"
              data-testid={`campaign-title-${campaign.id}`}
            >
              {campaign.propertyAddress}
            </h3>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold border shrink-0 ${badge.badgeClass}`}
              data-testid={`campaign-status-${campaign.id}`}
            >
              {badge.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[rgba(246,247,241,0.85)] font-sans">
            <span className="font-semibold text-emerald-200">New Listing Package</span>
            <span>•</span>
            <span>
              Requested by <strong className="text-[#FFFDF8]" data-testid="row-requester-name">{requesterName}</strong>
            </span>
            <span>•</span>
            <div className="inline-flex items-center gap-1 bg-[#073F35] px-2 py-0.5 rounded-md border border-emerald-400/20 text-[11px]" data-testid="row-capturing-agent">
              {getChannelIcon(channel)}
              <span>Captured by {agentName}</span>
            </div>
          </div>

          <p className="text-xs text-[rgba(246,247,241,0.7)] font-sans italic" data-testid="row-request-excerpt">
            {requestExcerpt}
          </p>

          {derivedState === 'needs_information' && (
            <p className="text-xs text-amber-300 font-medium flex items-center gap-1.5 pt-0.5" data-testid="row-missing-info-notice">
              <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>Open-house start and end time still needed</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          <button
            type="button"
            data-testid={`campaign-action-${campaign.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectCampaign(campaign.id, targetMode);
            }}
            className="px-4 py-2 bg-[#00635C] hover:bg-[#004d48] text-[#FFFDF8] rounded-xl text-xs font-bold transition-all shadow-sm border border-emerald-400/30 flex items-center gap-1.5 cursor-pointer"
          >
            <span>{primaryActionLabel}</span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-300" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans text-left pb-16 animate-fade-in" data-testid="marketing-home-inbox">
      {/* 1. MARKETING HOME HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(208,214,187,0.14)] pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-serif text-[#FFFDF8]">Marketing</h1>
          <p className="text-sm text-[rgba(246,247,241,0.75)]">
            Requests and listing campaigns prepared by Shapework.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewRequest}
          className="px-5 py-2.5 bg-[#00635C] hover:bg-[#004d48] text-[#FFFDF8] rounded-2xl font-bold text-xs shadow-lg border border-emerald-400/40 flex items-center gap-2 cursor-pointer transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-emerald-200" />
          <span>New Marketing Request</span>
        </button>
      </div>

      {/* 2. DELEGATED-WORK INBOX SECTIONS */}
      {needsAttention.length > 0 && (
        <div className="space-y-3" data-testid="section-needs-attention">
          <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-base">
            <AlertCircle className="w-4.5 h-4.5 text-amber-300 shrink-0" />
            <h2>Needs your attention</h2>
          </div>
          <div className="space-y-3">{needsAttention.map(renderCampaignRow)}</div>
        </div>
      )}

      {activePreparing.length > 0 && (
        <div className="space-y-3" data-testid="section-being-prepared">
          <div className="flex items-center gap-2 text-emerald-300 font-serif font-bold text-base">
            <Sparkles className="w-4.5 h-4.5 text-emerald-300 animate-pulse shrink-0" />
            <h2>Being prepared</h2>
          </div>
          <div className="space-y-3">{activePreparing.map(renderCampaignRow)}</div>
        </div>
      )}

      {readyForReview.length > 0 && (
        <div className="space-y-3" data-testid="section-ready-for-review">
          <div className="flex items-center gap-2 text-[#FFFDF8] font-serif font-bold text-base">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
            <h2>Ready for review</h2>
          </div>
          <div className="space-y-3">{readyForReview.map(renderCampaignRow)}</div>
        </div>
      )}

      {recentCompleted.length > 0 && (
        <div className="space-y-3" data-testid="section-recent">
          <div className="flex items-center gap-2 text-[rgba(246,247,241,0.7)] font-serif font-bold text-base">
            <FileText className="w-4.5 h-4.5 text-slate-400 shrink-0" />
            <h2>Recent</h2>
          </div>
          <div className="space-y-3">{recentCompleted.map(renderCampaignRow)}</div>
        </div>
      )}
    </div>
  );
};
