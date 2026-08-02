import React from 'react';
import { X, FileText, Phone, Mail, MessageSquare, Bot, User, CheckCircle2, ShieldCheck } from 'lucide-react';
import { OriginalCommunicationRecord, MarketingRequest } from '../../shared/marketingStateModel';

export interface OriginalCommunicationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  campaign?: any;
  record?: OriginalCommunicationRecord;
  request?: MarketingRequest;
  propertyAddress?: string;
}

export const OriginalCommunicationDrawer: React.FC<OriginalCommunicationDrawerProps> = ({
  isOpen,
  onClose,
  campaign,
  record,
  request,
  propertyAddress = '304 Ocean Blvd',
}) => {
  if (!isOpen) return null;

  const req = request || campaign?.request;
  const comm = record || campaign?.originalCommunication;

  const requesterName = req?.requestedByName || campaign?.listingSnapshot?.listingAgentName || 'Eric Anderson';
  const agentName = req?.capturedByAgentName || 'Ava · AI Phone Agent';
  
  const rawText =
    comm?.rawText ||
    req?.originalRequestText ||
    campaign?.originalCommunication?.rawText ||
    campaign?.request?.originalRequestText ||
    'No original request text retained for this demo.';

  const summaryText =
    req?.aiSummary ||
    campaign?.campaignBrief?.objective ||
    'New listing package request for 304 Ocean Blvd. (Flyer, Social, Postcard, Sign Rider, Email). Open-house hours pending.';

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex justify-end transition-opacity duration-300"
      data-testid="original-communication-drawer"
    >
      <div className="w-full max-w-2xl bg-[#fffdf8] text-[#13231e] h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slide-in-right overflow-hidden text-left font-sans">
        
        {/* LIGHT DRAWER HEADER */}
        <header className="p-6 bg-[#f6f7f1] border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00635c]">Source Communication</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#13231e]">
              Original request
            </h2>
            <p className="text-xs text-[#64716b] font-medium">
              Phone request captured by {agentName} on August 2 at 9:14 AM
            </p>
          </div>

          <button
            type="button"
            data-testid="close-communication-drawer"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* DRAWER BODY: TWO CLEAR SECTIONS */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* SECTION 1: ORIGINAL COMMUNICATION */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <Phone className="w-4 h-4 text-[#00635c]" />
              <h3 className="font-serif font-bold text-base text-[#13231e]">Original communication</h3>
            </div>

            <div
              data-testid="raw-communication-text"
              className="bg-[#f6f7f1] p-4 rounded-xl border border-slate-200 font-mono text-xs text-[#13231e] leading-relaxed whitespace-pre-wrap shadow-inner"
            >
              {rawText}
            </div>
          </div>

          {/* SECTION 2: AI-GENERATED SUMMARY */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#00635c]" />
                <h3 className="font-serif font-bold text-base text-[#13231e]">AI-generated summary</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00635c] bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Structured Interpretation
              </span>
            </div>

            <div className="bg-[#f6f7f1] p-4 rounded-xl border border-slate-200 space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#64716b] block">Objective</span>
                <p className="font-semibold text-[#13231e]" data-testid="extracted-objective">
                  {summaryText}
                </p>
              </div>

              <div className="space-y-1 border-t border-slate-200/60 pt-3">
                <span className="text-[10px] font-bold uppercase text-[#64716b] block">Requested Materials</span>
                <p className="font-medium text-[#13231e]">
                  Flyer, Social Package, Postcard, Sign Rider, Email Announcement
                </p>
              </div>

              <div className="space-y-1 border-t border-slate-200/60 pt-3">
                <span className="text-[10px] font-bold uppercase text-amber-800 block">Missing Information</span>
                <p className="font-medium text-amber-900">
                  Open-house hours (start and end times for Sunday)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* DRAWER FOOTER */}
        <footer className="p-4 bg-[#f6f7f1] border-t border-slate-200 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#00635c] hover:bg-[#004d48] text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
};
