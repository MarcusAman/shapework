import React from 'react';
import { Sparkles, Plus, AlertCircle, CheckCircle2, Clock, ChevronRight, FileText } from 'lucide-react';
import { getDerivedCampaignState, getCampaignStatusBadge, MarketingCampaignState } from '../../shared/marketingStateModel';

export interface CampaignRowItem {
  id: string;
  propertyAddress: string;
  agentName: string;
  targetDate: string;
  status: string;
  deliveryStatus?: string;
  approvalReceipt?: any;
  deliveryReceipts?: any[];
  missingInformation?: { field: string; prompt: string };
  assetApprovals?: Record<string, boolean>;
}

export interface MarketingHomeInboxProps {
  campaigns: CampaignRowItem[];
  activeJob: any;
  onSelectCampaign: (campaignId: string, mode?: 'overview' | 'review' | 'activity') => void;
  onNewRequest: () => void;
  isOperator?: boolean;
}

export const MarketingHomeInbox: React.FC<MarketingHomeInboxProps> = ({
  campaigns,
  activeJob,
  onSelectCampaign,
  onNewRequest,
  isOperator = false,
}) => {
  // Group campaigns into categorized status sections
  const needsAttention: CampaignRowItem[] = [];
  const activePreparing: CampaignRowItem[] = [];
  const readyForReview: CampaignRowItem[] = [];
  const recentCompleted: CampaignRowItem[] = [];

  campaigns.forEach((c) => {
    const jobForCampaign = activeJob?.campaignId === c.id ? activeJob : null;
    const derived = getDerivedCampaignState(c, jobForCampaign);

    if (derived === 'needs_information' || derived === 'changes_requested') {
      needsAttention.push(c);
    } else if (derived === 'preparing' || derived === 'ready_to_prepare') {
      activePreparing.push(c);
    } else if (derived === 'ready_for_review') {
      readyForReview.push(c);
    } else {
      recentCompleted.push(c);
    }
  });

  const renderCampaignRow = (campaign: CampaignRowItem) => {
    const jobForCampaign = activeJob?.campaignId === campaign.id ? activeJob : null;
    const derivedState = getDerivedCampaignState(campaign, jobForCampaign);
    const badge = getCampaignStatusBadge(derivedState);

    let primaryActionLabel = 'Review Package';
    if (derivedState === 'needs_information') primaryActionLabel = 'Provide Information';
    else if (derivedState === 'ready_to_prepare') primaryActionLabel = 'Prepare Package';
    else if (derivedState === 'preparing') primaryActionLabel = 'View Progress';
    else if (derivedState === 'approved') primaryActionLabel = 'Delivery Options';
    else if (derivedState === 'exported' || derivedState === 'delivered') primaryActionLabel = 'View Campaign';

    return (
      <div
        key={campaign.id}
        onClick={() => onSelectCampaign(campaign.id, derivedState === 'preparing' ? 'review' : 'review')}
        className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.18)] hover:border-emerald-400/40 rounded-2xl p-4 shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 h-auto md:h-24 group"
      >
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-serif font-bold text-lg text-[#FFFDF8] group-hover:text-emerald-200 transition-colors truncate">
              {campaign.propertyAddress}
            </h3>
            <span className={`px-3 py-0.5 rounded-full text-xs font-bold border shrink-0 ${badge.badgeClass}`}>
              {badge.label}
            </span>
          </div>

          <p className="text-xs text-[rgba(246,247,241,0.72)] font-sans">
            New Listing Package • <span className="text-[#FFFDF8] font-medium">{campaign.agentName}</span> • Due <span className="text-[#FFFDF8] font-medium">{campaign.targetDate}</span> • 5 materials prepared
          </p>

          <p className="text-[11px] text-[rgba(246,247,241,0.55)] font-sans">
            Flyer • Social • Postcard • Sign Rider • Email
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectCampaign(campaign.id, 'review');
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
    <div className="max-w-6xl mx-auto space-y-8 font-sans text-left pb-16 animate-fade-in">
      {/* 1. MARKETING HOME HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(208,214,187,0.14)] pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-serif text-[#FFFDF8]">Marketing</h1>
          <p className="text-sm text-[rgba(246,247,241,0.75)]">
            Campaigns and listing requests prepared by Shapework.
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

      {/* 2. CATEGORIZED SECTIONS */}

      {/* Section A: Needs Your Attention */}
      {needsAttention.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-base">
            <AlertCircle className="w-4.5 h-4.5 text-amber-300 shrink-0" />
            <h2>Needs your attention</h2>
          </div>
          <div className="space-y-3">{needsAttention.map(renderCampaignRow)}</div>
        </div>
      )}

      {/* Section B: Active Campaigns */}
      {activePreparing.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-300 font-serif font-bold text-base">
            <Sparkles className="w-4.5 h-4.5 text-emerald-300 animate-pulse shrink-0" />
            <h2>Active campaigns</h2>
          </div>
          <div className="space-y-3">{activePreparing.map(renderCampaignRow)}</div>
        </div>
      )}

      {/* Section C: Ready for Review */}
      {readyForReview.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#FFFDF8] font-serif font-bold text-base">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
            <h2>Ready for review</h2>
          </div>
          <div className="space-y-3">{readyForReview.map(renderCampaignRow)}</div>
        </div>
      )}

      {/* Section D: Recent Campaigns */}
      {recentCompleted.length > 0 && (
        <div className="space-y-3">
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
