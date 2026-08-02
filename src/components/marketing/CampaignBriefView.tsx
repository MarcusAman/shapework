import React from 'react';
import { Phone, Mail, MessageSquare, UserCheck, AlertCircle, FileText, CheckCircle2, ShieldCheck, ExternalLink, Calendar, Plus, Clock, User } from 'lucide-react';
import { ListingMarketingCampaign } from '../../../server/persistence/marketingCampaignsRepository';

export interface CampaignBriefViewProps {
  campaign: ListingMarketingCampaign;
  onOpenOriginalCommunication: () => void;
  onResolveMissingInformation: () => void;
  onAddFollowUpRequest?: () => void;
}

export const CampaignBriefView: React.FC<CampaignBriefViewProps> = ({
  campaign,
  onOpenOriginalCommunication,
  onResolveMissingInformation,
  onAddFollowUpRequest,
}) => {
  const req = campaign.request;
  const brief = campaign.campaignBrief;
  const brandKit = campaign.brandKit;
  const compliance = campaign.compliancePolicySet;
  const followUps = campaign.followUpRequests || [];

  const requesterName = req?.requestedByName || campaign.listingSnapshot?.listingAgentName || 'Eric Anderson';
  const requesterRole = req?.requestedByRole || 'Listing Agent';
  const agentName = req?.capturedByAgentName || 'Ava · AI Phone Agent';
  const channel = req?.channel || 'phone';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 text-left font-sans animate-fade-in pb-12" data-testid="campaign-brief-view">
      {/* EDITORIAL LIGHT WORKSPACE CONTAINER */}
      <div className="bg-[#fffdf8] border border-[rgba(1,54,45,0.14)] rounded-2xl p-6 md:p-8 shadow-sm space-y-8">
        
        {/* TOP BRIEF BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00635c]">Campaign Brief</span>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200" data-testid="brief-revision-badge">
                Revision {brief?.campaignRevision || 1}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#13231e]" data-testid="brief-property-title">
              {campaign.listingSnapshot?.propertyAddress || campaign.propertyAddress}
            </h2>
          </div>

          <button
            type="button"
            data-testid="open-original-communication-btn"
            onClick={onOpenOriginalCommunication}
            className="px-4 py-2.5 bg-[#f6f7f1] hover:bg-slate-200 text-[#13231e] font-bold text-xs rounded-xl border border-slate-300 transition-all shadow-sm cursor-pointer flex items-center gap-2 shrink-0"
          >
            <FileText className="w-4 h-4 text-[#00635c]" />
            <span>View original request</span>
          </button>
        </div>

        {/* TWO-COLUMN EDITORIAL GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT 8 COLS: CAMPAIGN BRIEF CONTENT */}
          <div className="lg:col-span-8 space-y-6">
            {/* OBJECTIVE */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64716b] block">Objective</span>
              <p className="text-base text-[#13231e] font-serif leading-relaxed bg-[#f6f7f1] p-4 rounded-xl border border-slate-200/60" data-testid="brief-ai-summary">
                {req?.aiSummary || brief?.objective || 'Premier launch for luxury oceanfront trophy property.'}
              </p>
            </div>

            {/* REQUESTED MATERIALS */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64716b] block">Requested Materials</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {(brief?.requestedMaterialTypes || ['flyer', 'social', 'postcard', 'sign_rider', 'email']).map((fmt) => (
                  <div key={fmt} className="flex items-center justify-between p-3 bg-[#f6f7f1] rounded-xl border border-slate-200/80">
                    <span className="font-bold text-[#13231e] capitalize">{fmt.replace('_', ' ')}</span>
                    <CheckCircle2 className="w-4 h-4 text-[#00635c]" />
                  </div>
                ))}
              </div>
            </div>

            {/* SPECIAL INSTRUCTIONS */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64716b] block">Special Instructions</span>
              <p className="text-sm text-[#13231e] leading-relaxed bg-[#f6f7f1] p-4 rounded-xl border border-slate-200/60">
                {req?.specialInstructions?.[0] || brief?.specialInstructions?.[0] || 'Promote Sunday open house and highlight oceanfront dune boardwalk photography.'}
              </p>
            </div>
          </div>

          {/* RIGHT 4 COLS: REQUEST DETAILS SIDEBAR */}
          <div className="lg:col-span-4 space-y-6 bg-[#f6f7f1] p-5 rounded-xl border border-slate-200/80 text-xs">
            <h3 className="font-serif font-bold text-sm text-[#13231e] uppercase tracking-wider border-b border-slate-200 pb-2">
              Request Details
            </h3>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#64716b]">Requested By</span>
              <p className="font-bold text-[#13231e] text-sm" data-testid="brief-requested-by">{requesterName}</p>
              <p className="text-[#64716b]">{requesterRole}</p>
            </div>

            <div className="space-y-1 border-t border-slate-200/60 pt-3">
              <span className="text-[10px] uppercase font-bold text-[#64716b]">Captured By</span>
              <p className="font-bold text-[#13231e] text-sm" data-testid="brief-captured-by">{agentName}</p>
              <p className="text-emerald-800 font-semibold">Channel: {channel.toUpperCase()}</p>
            </div>

            <div className="space-y-1 border-t border-slate-200/60 pt-3">
              <span className="text-[10px] uppercase font-bold text-[#64716b]">Received</span>
              <p className="font-bold text-[#13231e]">Today at 9:14 AM</p>
            </div>

            <div className="space-y-1 border-t border-slate-200/60 pt-3">
              <span className="text-[10px] uppercase font-bold text-[#64716b]">Target Deadline</span>
              <p className="font-bold text-[#13231e]">August 6, 2026</p>
            </div>
          </div>
        </div>

        {/* FOLLOW-UP REQUEST HISTORY SECTION */}
        <div className="border-t border-slate-200/80 pt-6 space-y-4" data-testid="brief-followup-history">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-[#13231e]">
              Follow-Up Request History ({followUps.length})
            </h3>
            {onAddFollowUpRequest && (
              <button
                type="button"
                data-testid="add-followup-request-btn"
                onClick={onAddFollowUpRequest}
                className="px-3 py-1.5 bg-[#00635c] text-white rounded-xl text-xs font-bold hover:bg-[#004d48] cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Follow-up</span>
              </button>
            )}
          </div>

          {followUps.length > 0 ? (
            <div className="space-y-3 text-xs">
              {followUps.map((item: any, idx: number) => (
                <div key={item.id || idx} className="p-4 bg-[#f6f7f1] rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between font-bold text-[#13231e]">
                    <span>Revision {item.revision || idx + 2}: {item.title || 'Follow-Up Adjustment'}</span>
                    <span className="text-[10px] text-[#64716b]">{item.requestedAt || 'Just now'}</span>
                  </div>
                  <p className="text-[#64716b]">{item.description || item.instructions}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#64716b] italic bg-[#f6f7f1] p-4 rounded-xl border border-slate-200">
              No follow-up revision requests submitted yet for this campaign.
            </p>
          )}
        </div>

        {/* MISSING INFORMATION RESOLUTION SECTION */}
        {req?.missingInformation && req.missingInformation.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 space-y-4" data-testid="brief-missing-info-section">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2 text-amber-900 font-serif font-bold text-lg">
                <AlertCircle className="w-5 h-5 text-amber-700" />
                <h3>Missing Information Required</h3>
              </div>
              <button
                type="button"
                data-testid="resolve-missing-info-btn"
                onClick={onResolveMissingInformation}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Calendar className="w-4 h-4" />
                <span>Provide missing information</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {req.missingInformation.map((item: any) => (
                <div key={item.id} className="bg-white p-4 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 text-sm">{item.label}</span>
                    <span className="text-[10px] font-bold uppercase text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-[#13231e]">{item.prompt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BRAND & COMPLIANCE GOVERNANCE SECTION */}
        <div className="border-t border-slate-200/80 pt-6 space-y-4">
          <h3 className="font-serif font-bold text-lg text-[#13231e]">
            Brand & Compliance Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-[#f6f7f1] rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] text-[#64716b] uppercase font-bold">Nest Wilmington Brand Kit</span>
              <p className="font-bold text-[#13231e] text-sm" data-testid="brief-brandkit-version">
                {brandKit?.brokerageName || 'Nest Realty Wilmington'} (v{brandKit?.version || '2.1.0'})
              </p>
              <p className="text-[#64716b]">{brandKit?.officeName}</p>
            </div>

            <div className="p-4 bg-[#f6f7f1] rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] text-[#64716b] uppercase font-bold">State Compliance Policy Set</span>
              <p className="font-bold text-[#13231e] text-sm" data-testid="brief-compliance-version">
                {compliance?.name || 'NCREC Compliance Policy Set'} (v{compliance?.version || '2026.1'})
              </p>
              <p className="text-[#64716b]">State: {compliance?.stateCode || 'NC'} · Requires Broker Review</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
