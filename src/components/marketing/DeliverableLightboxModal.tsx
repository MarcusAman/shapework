/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DeliverableLightboxModal — Full-Screen 300 DPI Deliverable Inspector
 * Displays high-resolution vector print & digital proofs with zoom controls,
 * dimension inspection, NCREC compliance tags, and 1-click downloads in Apple Light Mode.
 */

import React, { useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  ExternalLink,
  ShieldCheck,
  FileText,
  Smartphone,
  Mail,
  Printer,
  Sparkles
} from 'lucide-react';

export interface DeliverableItem {
  title: string;
  type: string;
  previewUrl: string;
  dimensions?: string;
  specs?: string;
  downloadUrl?: string;
  maxaUrl?: string;
  propertyAddress?: string;
  price?: string;
}

interface DeliverableLightboxModalProps {
  isOpen: boolean;
  item: DeliverableItem | null;
  onClose: () => void;
}

export const DeliverableLightboxModal: React.FC<DeliverableLightboxModalProps> = ({
  isOpen,
  item,
  onClose
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  if (!isOpen || !item) return null;

  const handleZoomIn = () => setZoomLevel(prev => Math.min(220, prev + 25));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(75, prev - 25));
  const handleResetZoom = () => setZoomLevel(100);

  const getIcon = () => {
    const t = item.type.toLowerCase();
    if (t.includes('story') || t.includes('reel') || t.includes('social')) {
      return <Smartphone className="w-4 h-4 text-pink-600" />;
    }
    if (t.includes('postcard') || t.includes('mail')) {
      return <Mail className="w-4 h-4 text-amber-600" />;
    }
    return <FileText className="w-4 h-4 text-[#00635C]" />;
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 sm:p-6 md:p-10 animate-in fade-in duration-200"
      data-testid="deliverable-lightbox-modal"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Container in Apple Light Mode */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col z-10 text-slate-900 animate-in zoom-in-95 duration-200">
        
        {/* HEADER BAR */}
        <div className="px-6 py-4 bg-[#F7F8F5] border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
              {getIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>300 DPI Vector</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {item.propertyAddress || 'Nest Marketing Asset'} • <span className="font-mono text-slate-700 font-semibold">{item.dimensions || 'Print & Digital Asset'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-white border border-slate-200/90 rounded-2xl p-1 shadow-2xs mr-2">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 75}
                className="p-1.5 hover:bg-slate-100 disabled:opacity-30 rounded-xl text-slate-700 transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span 
                onClick={handleResetZoom}
                className="px-2.5 text-xs font-mono font-bold text-slate-700 cursor-pointer hover:text-[#00635C]"
                title="Reset to 100%"
              >
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 220}
                className="p-1.5 hover:bg-slate-100 disabled:opacity-30 rounded-xl text-slate-700 transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <a
              href={item.previewUrl}
              target="_blank"
              rel="noreferrer"
              download
              className="px-3.5 py-2 bg-[#00635C] hover:bg-[#004d48] text-white rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-200/80 rounded-2xl text-slate-500 hover:text-slate-900 transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* IMAGE / VECTOR PREVIEW CANVAS */}
        <div className="flex-1 overflow-auto p-6 bg-[#EBECE8] flex items-center justify-center min-h-[450px]">
          <div 
            className="transition-transform duration-200 origin-center bg-white rounded-xl shadow-2xl p-2 border border-slate-300/80"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            <img
              src={item.previewUrl}
              alt={item.title}
              className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm select-none"
            />
          </div>
        </div>

        {/* FOOTER METRICS BAR */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-slate-600">
            <span className="flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Dimensions: <strong className="text-slate-800">{item.dimensions || '8.5 x 11 in'}</strong></span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00635C]" />
              <span>Specification: <strong className="text-slate-800">{item.specs || 'NCREC Disclosures, 300 DPI Vector Geometry'}</strong></span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://nest.maxadesigns.com/categories/popular"
              target="_blank"
              rel="noreferrer"
              className="text-[#00635C] hover:text-[#004d48] font-semibold flex items-center gap-1 text-xs transition"
            >
              <span>Open in Nest Design Center (Maxa)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
