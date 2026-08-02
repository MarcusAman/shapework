import React from 'react';
import { X, Phone, Mail, MessageSquare, Bot, User, CheckCircle2 } from 'lucide-react';
import { ListingMarketingCampaign } from '../../../server/persistence/marketingCampaignsRepository';

export interface OriginalCommunicationDrawerProps {
  campaign: ListingMarketingCampaign;
  isOpen: boolean;
  onClose: () => void;
}

export const OriginalCommunicationDrawer: React.FC<OriginalCommunicationDrawerProps> = ({
  campaign,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const req = campaign.request;
  const comm = campaign.originalCommunication;
  const channel = req?.channel || 'phone';
  const requesterName = req?.requestedByName || campaign.listingSnapshot?.listingAgentName || 'Agent';
  const agentName = req?.capturedByAgentName || 'Shapework Agent';

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex justify-end animate-fade-in" data-testid="original-communication-drawer">
      <div className="w-full max-w-2xl bg-[#073F35] border-l border-[rgba(208,214,187,0.2)] text-[#FFFDF8] h-full overflow-y-auto p-6 space-y-6 shadow-2xl flex flex-col justify-between font-sans">
        <div className="space-y-6">
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-[rgba(208,214,187,0.14)] pb-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Auditable Source Record</span>
              <h2 className="text-xl font-serif font-bold text-[#FFFDF8]" data-testid="communication-drawer-title">
                Original Request & Communication
              </h2>
            </div>
            <button
              type="button"
              data-testid="close-communication-drawer"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#0B4A3F] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* CHANNEL & ATTRIBUTION STRIP */}
          <div className="bg-[#0B4A3F] p-4 rounded-xl border border-[rgba(208,214,187,0.14)] grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-[rgba(246,247,241,0.5)] block">Captured By</span>
              <p className="font-bold text-emerald-200 text-sm">{agentName}</p>
              <p className="text-[11px] text-slate-300">Channel: {channel.toUpperCase()}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[rgba(246,247,241,0.5)] block">Requested By</span>
              <p className="font-bold text-[#FFFDF8] text-sm">{requesterName}</p>
              <p className="text-[11px] text-slate-300">Role: {req?.requestedByRole || 'Listing Agent'}</p>
            </div>
          </div>

          {/* VERBATIM ORIGINAL TRANSCRIPT / MESSAGE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-sm text-emerald-200 uppercase tracking-wide">
                Verbatim Source Recording / Message
              </h3>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
                RAW_UNMUTATED_TEXT
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap shadow-inner" data-testid="raw-communication-text">
              {comm?.rawText || req?.originalRequestText || 'No raw communication text recorded.'}
            </div>
          </div>

          {/* AI INTERPRETATION vs VERBATIM COMPARISON */}
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-sm text-sky-200 uppercase tracking-wide">
              Shapework AI Structured Interpretation
            </h3>
            <div className="bg-[#0B4A3F] p-4 rounded-xl border border-[rgba(208,214,187,0.14)] space-y-3 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Extracted Objective</span>
                <p className="text-slate-100 font-medium" data-testid="extracted-objective">
                  {req?.aiSummary || 'New listing collateral package generation.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[rgba(208,214,187,0.1)]">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Requested Assets</span>
                  <p className="text-emerald-300 font-bold capitalize">
                    {(req?.requestedMaterialTypes || ['flyer', 'social', 'postcard']).join(', ')}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Missing Details Flagged</span>
                  <p className="text-amber-300 font-bold">
                    {req?.missingInformation?.length > 0 ? req.missingInformation[0].label : 'None'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER CLOSE BUTTON */}
        <div className="pt-4 border-t border-[rgba(208,214,187,0.14)]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-[#00635C] hover:bg-[#004d48] text-[#FFFDF8] rounded-xl font-bold text-xs transition-all shadow cursor-pointer border border-emerald-400/30"
          >
            Close Audit Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
