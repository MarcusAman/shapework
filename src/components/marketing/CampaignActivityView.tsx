import React from 'react';
import { Clock, CheckCircle2, User, Sparkles, AlertCircle, FileText } from 'lucide-react';
import { ListingMarketingCampaign } from '../../../server/persistence/marketingCampaignsRepository';

export interface CampaignActivityViewProps {
  campaign: ListingMarketingCampaign;
}

export const CampaignActivityView: React.FC<CampaignActivityViewProps> = ({ campaign }) => {
  const auditTrail = campaign?.auditTrail || [];
  const req = campaign?.request;
  const agentName = req?.capturedByAgentName || 'Ava · AI Phone Agent';

  // Story events
  const storyEvents = [
    {
      time: '9:14 AM',
      actor: agentName,
      title: `${agentName} received ${req?.requestedByName || 'Eric'}’s request`,
      description: `Inbound ${req?.channel || 'phone'} communication processed and converted to marketing request.`,
      icon: <Clock className="w-4 h-4 text-[#00635c]" />
    },
    {
      time: '9:15 AM',
      actor: 'Shapework Brief Engine',
      title: 'Shapework created the campaign brief',
      description: 'Structured campaign objective, 5 collateral formats, and Nest Wilmington brand rules.',
      icon: <Sparkles className="w-4 h-4 text-sky-700" />
    },
    ...(req?.missingInformation?.length > 0 ? [
      {
        time: '9:16 AM',
        actor: 'Brief Engine',
        title: 'Open-house time was identified as missing',
        description: 'Flagged open-house hours requirement for sign rider, social posts, and email announcement.',
        icon: <AlertCircle className="w-4 h-4 text-amber-700" />
      }
    ] : []),
    ...auditTrail.map(a => ({
      time: new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actor: a.performedBy,
      title: a.action.replace(/_/g, ' '),
      description: a.details,
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-700" />
    }))
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans text-left pb-12" data-testid="campaign-activity-story">
      {/* HEADER CARD */}
      <div className="bg-[#fffdf8] border border-[rgba(1,54,45,0.14)] rounded-2xl p-6 shadow-sm space-y-2">
        <span className="text-xs font-bold text-[#00635c] uppercase tracking-wider">Human-Readable Timeline</span>
        <h2 className="text-2xl font-serif font-bold text-[#13231e]">Campaign Request & Fulfillment Story</h2>
        <p className="text-xs text-[#64716b]">
          Audit history tracking request intake, brief creation, collateral rendering, and approval steps.
        </p>
      </div>

      {/* STORY TIMELINE CONTAINER */}
      <div className="bg-[#fffdf8] border border-[rgba(1,54,45,0.14)] rounded-2xl p-6 shadow-sm space-y-6">
        <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 pl-6">
          {storyEvents.map((evt, idx) => (
            <div key={idx} className="relative group" data-testid="activity-story-event">
              <div className="absolute -left-[31px] top-0 bg-[#f6f7f1] p-1.5 rounded-full border border-slate-300">
                {evt.icon}
              </div>

              <div className="space-y-1 bg-[#f6f7f1] p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#13231e] capitalize">{evt.title}</h4>
                  <span className="text-xs font-semibold text-[#00635c] bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-200">
                    {evt.time}
                  </span>
                </div>
                <p className="text-xs text-[#64716b]">{evt.description}</p>
                <div className="pt-2 text-[10px] text-slate-500 border-t border-slate-200 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>Actor: {evt.actor}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
