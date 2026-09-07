import React from 'react';
import { X, ExternalLink, Sparkles, CheckCircle2, Calendar, FileText, Download, Send, ArrowRight } from 'lucide-react';

export interface GlobalEvidenceCardData {
  title: string;
  target?: string;
  details?: string;
  deepLinkUrl?: string;
  dataPoints?: Record<string, string | number>;
  flyerPdfUrl?: string;
  instagramAssetUrl?: string;
  emailBlastTemplateUrl?: string;
  googleCalendarUrl?: string;
  pdfReportUrl?: string;
  checkNumber?: string;
  netAgentPayout?: string;
}

interface GlobalEvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  evidenceCard: GlobalEvidenceCardData | null;
  onNavigateToTab?: (tabName: string) => void;
}

export function GlobalEvidenceDrawer({
  isOpen,
  onClose,
  evidenceCard,
  onNavigateToTab
}: GlobalEvidenceDrawerProps) {
  if (!isOpen || !evidenceCard) return null;

  const handleJumpToWorkspace = () => {
    if (evidenceCard.deepLinkUrl && onNavigateToTab) {
      const url = evidenceCard.deepLinkUrl;
      if (url.includes('sops')) onNavigateToTab('Staff SOP Templates');
      else if (url.includes('directory')) onNavigateToTab('Directory');
      else if (url.includes('contracts')) onNavigateToTab('Contract Copilot');
      else if (url.includes('financials')) onNavigateToTab('QuickBooks Escrow');
      else if (url.includes('marketing')) onNavigateToTab('Listing Marketing');
      else if (url.includes('integrations')) onNavigateToTab('Integrations');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity pointer-events-auto"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-auto">
        <div className="w-screen max-w-md bg-white/95 backdrop-blur-2xl border-l border-slate-200/90 shadow-2xl flex flex-col justify-between p-6 overflow-y-auto">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#00635C]/10 border border-[#00635C]/30 flex items-center justify-center text-[#00635C]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#00635C] uppercase tracking-wider">NORA AI Execution</span>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{evidenceCard.title}</h3>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target & Details */}
            {evidenceCard.details && (
              <div className="mt-4 p-3 bg-emerald-50/80 border border-emerald-200/60 rounded-xl text-xs text-emerald-950 font-medium leading-relaxed">
                {evidenceCard.details}
              </div>
            )}

            {/* Data Points Grid */}
            {evidenceCard.dataPoints && (
              <div className="mt-4 space-y-2.5">
                <h4 className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-500">Execution Highlights</h4>
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 divide-y divide-slate-200/60 space-y-2">
                  {Object.entries(evidenceCard.dataPoints).map(([key, val]) => (
                    <div key={key} className="pt-2 first:pt-0 flex items-start justify-between gap-3 text-xs">
                      <span className="font-semibold text-slate-600 shrink-0">{key}:</span>
                      <span className="font-bold text-slate-900 text-right">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special Action Buttons */}
            <div className="mt-5 space-y-2">
              {evidenceCard.flyerPdfUrl && (
                <a
                  href={evidenceCard.flyerPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Print Flyer PDF</span>
                </a>
              )}

              {evidenceCard.googleCalendarUrl && (
                <a
                  href={evidenceCard.googleCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Open in Google Calendar</span>
                </a>
              )}
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-6 border-t border-slate-200/80">
            <button
              onClick={handleJumpToWorkspace}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#00635C] to-emerald-600 hover:from-[#004d47] hover:to-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Jump to Workspace Module</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
