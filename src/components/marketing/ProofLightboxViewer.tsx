/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProofLightboxViewer — Accessible Full-Screen Asset Previewer
 * Supports zoom, multi-panel carousel navigation, keyboard trap, Escape handling,
 * focus restoration, and honest metadata display (dimensions, version, genuine DPI).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  ShieldCheck,
  FileText,
  Smartphone,
  Mail,
  AlertCircle
} from 'lucide-react';

export interface LightboxAssetItem {
  id?: string;
  title: string;
  deliverableName?: string;
  type?: string;
  previewUrl: string;
  downloadUrl?: string;
  dimensions?: string;
  aspectRatio?: string;
  dpi?: number | null;
  dpiVerified?: boolean;
  dpiLabel?: string;
  fileSizeBytes?: number;
  version?: number;
  uploadedBy?: string;
  uploadedAt?: string;
  specs?: string;
  pageCount?: number;
  slides?: Array<{
    title: string;
    url: string;
    description?: string;
  }>;
}

interface ProofLightboxViewerProps {
  isOpen: boolean;
  item: LightboxAssetItem | null;
  onClose: () => void;
  triggerElementRef?: React.RefObject<HTMLElement | null>;
}

export const ProofLightboxViewer: React.FC<ProofLightboxViewerProps> = ({
  isOpen,
  item,
  onClose,
  triggerElementRef
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Store active element on open to restore focus on close
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      setZoomLevel(100);
      setCurrentSlideIndex(0);
    } else if (previousActiveElement.current instanceof HTMLElement) {
      if (triggerElementRef?.current) {
        triggerElementRef.current.focus();
      } else {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen, triggerElementRef]);

  const slides = item?.slides && item.slides.length > 0 ? item.slides : (item ? [{ title: item.title, url: item.previewUrl }] : []);
  const hasMultipleSlides = slides.length > 1;

  const handlePrevSlide = useCallback(() => {
    setCurrentSlideIndex(prev => (prev > 0 ? prev - 1 : slides.length - 1));
  }, [slides.length]);

  const handleNextSlide = useCallback(() => {
    setCurrentSlideIndex(prev => (prev < slides.length - 1 ? prev + 1 : 0));
  }, [slides.length]);

  // Keyboard navigation: Escape to close, Left/Right arrows for carousel, Tab trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft' && hasMultipleSlides) {
        e.preventDefault();
        handlePrevSlide();
      } else if (e.key === 'ArrowRight' && hasMultipleSlides) {
        e.preventDefault();
        handleNextSlide();
      } else if (e.key === 'Tab') {
        // Focus trap
        if (!modalRef.current) return;
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasMultipleSlides, handlePrevSlide, handleNextSlide, onClose]);

  if (!isOpen || !item) return null;

  const currentSlide = slides[currentSlideIndex] || { title: item.title, url: item.previewUrl };
  const isPdf = currentSlide.url.toLowerCase().endsWith('.pdf') || (item.previewUrl || '').toLowerCase().endsWith('.pdf');

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const getIcon = () => {
    const t = (item.type || item.title || '').toLowerCase();
    if (t.includes('story') || t.includes('carousel') || t.includes('9:16')) {
      return <Smartphone className="w-4 h-4 text-blue-600" />;
    }
    if (t.includes('postcard') || t.includes('6x9') || t.includes('mail')) {
      return <Mail className="w-4 h-4 text-purple-600" />;
    }
    return <FileText className="w-4 h-4 text-[#00635C]" />;
  };

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Proof Preview: ${item.title}`}
      data-testid="proof-lightbox-viewer"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      {/* Background click to close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} aria-hidden="true" />

      {/* Main Lightbox Frame */}
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col z-10 text-slate-900 animate-in zoom-in-95 duration-150">
        
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-2xs shrink-0">
              {getIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{item.title}</h3>
                {item.version && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold shrink-0">
                    v{item.version}
                  </span>
                )}
                {hasMultipleSlides && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-bold shrink-0">
                    Slide {currentSlideIndex + 1} of {slides.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {item.deliverableName || item.specs || 'Finished Collateral Deliverable'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Download Button */}
            <a
              href={item.downloadUrl || currentSlide.url}
              download
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
              title="Download asset"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Download</span>
            </a>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-xl transition cursor-pointer"
              title="Close Preview (Esc)"
              aria-label="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none min-h-[360px] max-h-[65vh]">
          {isPdf ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-slate-900 rounded-2xl border border-slate-800 text-white space-y-4">
              <FileText className="w-16 h-16 text-emerald-400" />
              <div>
                <h4 className="text-base font-bold text-white">PDF Deliverable Document</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  {item.dimensions || 'Standard Page Size'} • {item.pageCount ? `${item.pageCount} page(s)` : 'Multi-page document'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={currentSlide.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open PDF in New Tab ↗</span>
                </a>
              </div>
            </div>
          ) : (
            <div
              className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-150"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              <img
                src={currentSlide.url}
                alt={currentSlide.title || item.title}
                className="max-h-[58vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800"
              />
            </div>
          )}

          {/* Carousel Prev/Next Buttons */}
          {hasMultipleSlides && (
            <>
              <button
                type="button"
                onClick={handlePrevSlide}
                aria-label="Previous Slide"
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full border border-slate-700 shadow-lg transition cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNextSlide}
                aria-label="Next Slide"
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full border border-slate-700 shadow-lg transition cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Zoom Controls Bar */}
          {!isPdf && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-lg backdrop-blur-xs text-white">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))}
                disabled={zoomLevel <= 50}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Zoom Out"
                aria-label="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-semibold px-1 w-12 text-center text-slate-200">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(250, prev + 25))}
                disabled={zoomLevel >= 250}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Zoom In"
                aria-label="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-slate-700 mx-1" />
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
                title="Fit to Window"
                aria-label="Reset Zoom"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Metadata Drawer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 shrink-0">
          <div className="flex items-center flex-wrap gap-4">
            {item.dimensions && (
              <div>
                <span className="text-slate-400 font-medium">Dimensions: </span>
                <strong className="text-slate-800 font-mono">{item.dimensions}</strong>
              </div>
            )}
            {item.aspectRatio && (
              <div>
                <span className="text-slate-400 font-medium">Ratio: </span>
                <strong className="text-slate-800 font-mono">{item.aspectRatio}</strong>
              </div>
            )}
            {formatFileSize(item.fileSizeBytes) && (
              <div>
                <span className="text-slate-400 font-medium">Size: </span>
                <strong className="text-slate-800 font-mono">{formatFileSize(item.fileSizeBytes)}</strong>
              </div>
            )}
            {item.uploadedBy && (
              <div>
                <span className="text-slate-400 font-medium">Uploaded by: </span>
                <strong className="text-slate-800">{item.uploadedBy}</strong>
              </div>
            )}
            {item.uploadedAt && (
              <div>
                <span className="text-slate-400 font-medium">Date: </span>
                <span className="text-slate-700">{new Date(item.uploadedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Genuine DPI Status */}
          <div className="flex items-center gap-1.5 shrink-0">
            {item.dpiVerified && item.dpi ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{item.dpiLabel || `${item.dpi} DPI (Verified)`}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>{item.dpiLabel || 'DPI could not be verified from this file.'}</span>
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
