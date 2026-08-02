import React from 'react';
import { Phone, Mail, MessageSquare, UserCheck, AlertCircle, FileText, CheckCircle2, ShieldCheck, ExternalLink, Calendar, Plus } from 'lucide-react';
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
  const origComm = campaign.originalCommunication;
  const followUps = campaign.followUpRequests || [];

  const requesterName = req?.requestedByName || campaign.listingSnapshot?.listingAgentName || 'Agent';
  const requesterRole = req?.requestedByRole || 'Listing Agent';
  const agentName = req?.capturedByAgentName || 'Shapework Agent';
  const channel = req?.channel || 'manual';

  const getChannelBadge = (ch: string) => {
    switch (ch) {
      case 'phone':
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-950/60 text-emerald-300 px-3 py-1 rounded-lg border border-emerald-400/30 text-xs font-semibold">
            <Phone className="w-3.5 h-3.5" />
            Phone · {agentName}
          </span>
        );
      case 'email':
        return (
          <span className="inline-flex items-center gap-1.5 bg-sky-950/60 text-sky-300 px-3 py-1 rounded-lg border border-sky-400/30 text-xs font-semibold">
            <Mail className="w-3.5 h-3.5" />
            Email · {agentName}
          </span>
        );
      case 'sms':
      case 'chat':
      case 'website_chatbot':
        return (
          <span className="inline-flex items-center gap-1.5 bg-purple-950/60 text-purple-300 px-3 py-1 rounded-lg border border-purple-400/30 text-xs font-semibold">
            <MessageSquare className="w-3.5 h-3.5" />
            Chat · {agentName}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-slate-900/60 text-slate-300 px-3 py-1 rounded-lg border border-slate-700 text-xs font-semibold">
            <UserCheck className="w-3.5 h-3.5" />
            Manual Intake · {agentName}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-left font-sans animate-fade-in max-w-5xl mx-auto pb-12" data-testid="campaign-brief-view">
      {/* HEADER SUMMARY BAR */}
      <div className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.18)] rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(208,214,187,0.14)] pb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Campaign Brief & Request Record</span>
            <h2 className="text-2xl font-serif font-bold text-[#FFFDF8]" data-testid="brief-property-title">
              {campaign.propertyAddress}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {getChannelBadge(channel)}
            <span className="text-xs text-[rgba(246,247,241,0.7)] bg-[#073F35] px-3 py-1 rounded-lg border border-emerald-400/20" data-testid="brief-revision-badge">
              Revision {brief?.campaignRevision || 1}
            </span>
          </div>
        </div>

        {/* REQUESTER ATTRIBUTION GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1 bg-[#073F35] p-3 rounded-xl border border-[rgba(208,214,187,0.12)]">
            <span className="text-[10px] uppercase font-bold text-[rgba(246,247,241,0.5)]">Requested By</span>
            <p className="font-bold text-[#FFFDF8] text-sm" data-testid="brief-requested-by">{requesterName}</p>
            <p className="text-[11px] text-emerald-300">{requesterRole}</p>
          </div>

          <div className="space-y-1 bg-[#073F35] p-3 rounded-xl border border-[rgba(208,214,187,0.12)]">
            <span className="text-[10px] uppercase font-bold text-[rgba(246,247,241,0.5)]">Capturing AI Agent</span>
            <p className="font-bold text-[#FFFDF8] text-sm" data-testid="brief-captured-by">{agentName}</p>
            <p className="text-[11px] text-emerald-300">Channel: {channel.toUpperCase()}</p>
          </div>

          <div className="space-y-1 bg-[#073F35] p-3 rounded-xl border border-[rgba(208,214,187,0.12)]">
            <span className="text-[10px] uppercase font-bold text-[rgba(246,247,241,0.5)]">Received At</span>
            <p className="font-bold text-[#FFFDF8] text-sm">{req?.receivedAt ? new Date(req.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}</p>
            <p className="text-[11px] text-emerald-300">Urgency: {req?.urgency || 'Standard'}</p>
          </div>
        </div>
      </div>

      {/* ORIGINAL COMMUNICATION AUDIT SECTION */}
      <div className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.18)] rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-[rgba(208,214,187,0.14)] pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-300" />
            <h3 className="font-serif font-bold text-lg text-[#FFFDF8]">Original Communication & Interpretation</h3>
          </div>
          <button
            type="button"
            data-testid="open-original-communication-btn"
            onClick={onOpenOriginalCommunication}
            className="px-3.5 py-1.5 bg-[#00635C] hover:bg-[#004d48] text-[#FFFDF8] text-xs font-bold rounded-xl border border-emerald-400/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>View original transcript / message</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-300" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#073F35] p-4 rounded-xl border border-[rgba(208,214,187,0.12)] space-y-2">
            <span className="font-bold text-emerald-300 uppercase text-[10px] tracking-wider block">Verbatim Excerpt</span>
            <p className="text-[rgba(246,247,241,0.9)] italic leading-relaxed" data-testid="brief-verbatim-excerpt">
              “{req?.originalRequestText || 'Requesting full 5-part marketing package.'}”
            </p>
          </div>

          <div className="bg-[#073F35] p-4 rounded-xl border border-[rgba(208,214,187,0.12)] space-y-2">
            <span className="font-bold text-sky-300 uppercase text-[10px] tracking-wider block">Shapework AI Interpretation</span>
            <p className="text-[rgba(246,247,241,0.9)] leading-relaxed" data-testid="brief-ai-summary">
              {req?.aiSummary || brief?.objective || 'Interpreted as new listing campaign.'}
            </p>
          </div>
        </div>
      </div>

      {/* MISSING INFORMATION RESOLUTION SECTION */}
      {req?.missingInformation && req.missingInformation.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-6 shadow-md space-y-4" data-testid="brief-missing-info-section">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-lg">
              <AlertCircle className="w-5 h-5 text-amber-300" />
              <h3>Missing Information Required</h3>
            </div>
            <button
              type="button"
              data-testid="resolve-missing-info-btn"
              onClick={onResolveMissingInformation}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>Provide Missing Information</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {req.missingInformation.map((item: any) => (
              <div key={item.id} className="bg-[#073F35] p-4 rounded-xl border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 text-sm">{item.label}</span>
                  <span className="text-[10px] font-bold uppercase text-amber-200 bg-amber-900/60 px-2.5 py-0.5 rounded-full">
                    {item.status}
                  </span>
                </div>
                <p className="text-slate-200">{item.prompt}</p>
                <div className="pt-2 flex flex-wrap gap-4 text-[11px] border-t border-[rgba(208,214,187,0.1)]">
                  <div>
                    <span className="text-[rgba(246,247,241,0.5)]">Affected Materials: </span>
                    <span className="font-bold text-rose-300">{item.affectedMaterialTypes.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-[rgba(246,247,241,0.5)]">Unaffected: </span>
                    <span className="font-bold text-emerald-300">{item.unaffectedMaterialTypes.join(', ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXTRACTED REQUIREMENTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.18)] rounded-2xl p-6 shadow-md space-y-4">
          <h3 className="font-serif font-bold text-lg text-[#FFFDF8] border-b border-[rgba(208,214,187,0.14)] pb-3">
            Requested Deliverable Formats
          </h3>
          <div className="space-y-2 text-xs">
            {(brief?.requestedMaterialTypes || ['flyer', 'social', 'postcard', 'sign_rider', 'email']).map((fmt) => (
              <div key={fmt} className="flex items-center justify-between p-2.5 bg-[#073F35] rounded-xl border border-[rgba(208,214,187,0.12)]">
                <span className="font-bold text-[#FFFDF8] capitalize">{fmt.replace('_', ' ')}</span>
                <span className="text-emerald-300 text-[11px] font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Included in brief
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.18)] rounded-2xl p-6 shadow-md space-y-4">
          <h3 className="font-serif font-bold text-lg text-[#FFFDF8] border-b border-[rgba(208,214,187,0.14)] pb-3">
            Brand & Compliance Governance
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#073F35] rounded-xl border border-[rgba(208,214,187,0.12)] space-y-1">
              <span className="text-[10px] text-[rgba(246,247,241,0.5)] uppercase font-bold">Brand Kit Configuration</span>
              <p className="font-bold text-emerald-200" data-testid="brief-brandkit-version">
                {brandKit?.brokerageName || 'Nest Realty Wilmington'} (v{brandKit?.version || '2.1.0'})
              </p>
              <p className="text-[11px] text-[rgba(246,247,241,0.7)]">{brandKit?.officeName}</p>
            </div>

            <div className="p-3 bg-[#073F35] rounded-xl border border-[rgba(208,214,187,0.12)] space-y-1">
              <span className="text-[10px] text-[rgba(246,247,241,0.5)] uppercase font-bold">Compliance Policy Set</span>
              <p className="font-bold text-sky-200" data-testid="brief-compliance-version">
                {compliance?.name || 'NCREC Compliance Policy Set'} (v{compliance?.version || '2026.1'})
              </p>
              <p className="text-[11px] text-[rgba(246,247,241,0.7)]">State: {compliance?.stateCode || 'NC'} · Requires Broker Review</p>
            </div>
          </div>
        </div>
      </div>

      {/* FOLLOW-UP REQUESTS REVISION HISTORY */}
      {followUps.length > 0 && (
        <div className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.18)] rounded-2xl p-6 shadow-md space-y-3" data-testid="brief-followup-history">
          <h3 className="font-serif font-bold text-lg text-[#FFFDF8] border-b border-[rgba(208,214,187,0.14)] pb-2">
            Linked Follow-Up Requests ({followUps.length})
          </h3>
          <div className="space-y-2 text-xs">
            {followUps.map((fu: any) => (
              <div key={fu.id} className="p-3 bg-[#073F35] rounded-xl border border-[rgba(208,214,187,0.12)] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-200">Follow-up from {fu.requestedByName}</span>
                  <span className="text-[11px] text-slate-400">{new Date(fu.receivedAt).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-300 italic">“{fu.originalRequestText}”</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
