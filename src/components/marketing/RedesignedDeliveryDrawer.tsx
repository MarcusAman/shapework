import React, { useState } from 'react';
import { X, Download, Share2, FileText, CheckCircle2, ExternalLink, HardDrive } from 'lucide-react';

export interface RedesignedDeliveryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  propertyAddress: string;
  onDownloadFullPackage: () => Promise<void>;
  onExportDestination: (destination: string) => Promise<void>;
}

export const RedesignedDeliveryDrawer: React.FC<RedesignedDeliveryDrawerProps> = ({
  isOpen,
  onClose,
  campaignId,
  propertyAddress,
  onDownloadFullPackage,
  onExportDestination,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeExporting, setActiveExporting] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFullDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownloadFullPackage();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExport = async (dest: string) => {
    setActiveExporting(dest);
    try {
      await onExportDestination(dest);
    } finally {
      setActiveExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-[#0B4A3F] border-l border-[rgba(208,214,187,0.24)] h-full p-6 shadow-2xl overflow-y-auto space-y-6 text-[#FFFDF8] text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(208,214,187,0.14)] pb-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#FFFDF8]">Delivery options</h3>
            <p className="text-xs text-[rgba(246,247,241,0.7)] mt-0.5">{propertyAddress}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[rgba(246,247,241,0.6)] hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Direct Downloads */}
        <div className="space-y-3">
          <span className="font-serif font-bold text-sm text-emerald-200 block">Download</span>
          <div className="p-4 bg-[#073F35] border border-[rgba(208,214,187,0.18)] rounded-2xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-white">Download full package</h4>
                <p className="text-[11px] text-[rgba(246,247,241,0.75)] leading-relaxed">
                  Includes print-ready PDFs, web PNGs, HTML email, and complete package manifest ZIP.
                </p>
              </div>
              <Download className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
            </div>

            <button
              type="button"
              onClick={handleFullDownload}
              disabled={isDownloading}
              className="w-full py-2.5 bg-[#00635C] hover:bg-[#004d48] text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm border border-emerald-400/40 flex items-center justify-center gap-2"
            >
              <span>{isDownloading ? 'Preparing ZIP Archive...' : 'Download ZIP Package'}</span>
            </button>
          </div>
        </div>

        {/* 2. Connected Destinations */}
        <div className="space-y-3">
          <span className="font-serif font-bold text-sm text-emerald-200 block">Connected destinations</span>
          <div className="p-4 bg-[#073F35] border border-[rgba(208,214,187,0.18)] rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-4 h-4 text-emerald-300 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs text-white">Google Drive</h4>
                  <span className="text-[10px] text-emerald-300 font-bold block">Connected • Active</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleExport('google_drive')}
                disabled={activeExporting === 'google_drive'}
                className="px-3 py-1.5 bg-[#176457] hover:bg-[#00635C] text-white rounded-xl text-xs font-bold border border-emerald-400/30 cursor-pointer"
              >
                {activeExporting === 'google_drive' ? 'Exporting...' : 'Export Package'}
              </button>
            </div>
          </div>
        </div>

        {/* 3. Manual Exports */}
        <div className="space-y-3">
          <span className="font-serif font-bold text-sm text-emerald-200 block">Manual exports</span>
          <div className="space-y-2">
            <div className="p-3 bg-[#073F35]/70 border border-[rgba(208,214,187,0.12)] rounded-xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-white">Rechat export package</h4>
                <span className="text-[10px] text-[rgba(246,247,241,0.55)]">Pre-formatted marketing import payload</span>
              </div>
              <button
                type="button"
                onClick={() => handleExport('rechat')}
                disabled={activeExporting === 'rechat'}
                className="px-3 py-1 bg-[#073F35] hover:bg-[#176457] text-white rounded-xl text-xs font-bold border border-[rgba(208,214,187,0.2)] cursor-pointer"
              >
                {activeExporting === 'rechat' ? 'Generating...' : 'Export'}
              </button>
            </div>

            <div className="p-3 bg-[#073F35]/70 border border-[rgba(208,214,187,0.12)] rounded-xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-white">FlexMLS upload package</h4>
                <span className="text-[10px] text-[rgba(246,247,241,0.55)]">MLS media attachment archive</span>
              </div>
              <button
                type="button"
                onClick={() => handleExport('flexmls')}
                disabled={activeExporting === 'flexmls'}
                className="px-3 py-1 bg-[#073F35] hover:bg-[#176457] text-white rounded-xl text-xs font-bold border border-[rgba(208,214,187,0.2)] cursor-pointer"
              >
                {activeExporting === 'flexmls' ? 'Generating...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
