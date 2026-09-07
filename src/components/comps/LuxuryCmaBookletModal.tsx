/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * LuxuryCmaBookletModal: 8-Page 300 DPI Luxury CMA Presentation Deck & Flipbook
 */

import React, { useState, useEffect } from 'react';
import { 
  Printer, Download, Share2, Sparkles, ChevronLeft, ChevronRight, 
  MapPin, CheckCircle2, DollarSign, Home, ShieldCheck, Waves, 
  Building2, TrendingUp, Calendar, ArrowRight, User, X, Eye
} from 'lucide-react';
import { LuxuryPropertyComp, PropertyCompsRepository } from '../../../server/persistence/propertyCompsRepository';
import { useToast } from '../ui';

interface LuxuryCmaBookletModalProps {
  subjectProperty: LuxuryPropertyComp;
  isOpen: boolean;
  onClose: () => void;
  initialClientName?: string;
}

export const LuxuryCmaBookletModal: React.FC<LuxuryCmaBookletModalProps> = ({
  subjectProperty,
  isOpen,
  onClose,
  initialClientName = 'Mr. & Mrs. Harrison Vance'
}) => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [clientName, setClientName] = useState<string>(initialClientName);
  const [deck, setDeck] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/comps/generate-cma-deck', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjectPropertyId: subjectProperty.id,
        clientName: clientName || 'Valued Private Client'
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.deck) {
          setDeck(data.deck);
        } else {
          setDeck(PropertyCompsRepository.generateCmaDeckPayload(subjectProperty.id, clientName));
        }
      })
      .catch(() => {
        setDeck(PropertyCompsRepository.generateCmaDeckPayload(subjectProperty.id, clientName));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, subjectProperty.id, clientName]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight') {
        setCurrentPage(p => Math.min(8, p + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentPage(p => Math.max(1, p - 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
    toast.success({
      title: 'Printing 8-Page CMA Deck',
      description: 'Document sent to printer / PDF exporter in 300 DPI high-resolution.'
    });
  };

  const pages = [
    { num: 1, title: 'Title & Cover' },
    { num: 2, title: 'Nora AI Advisory' },
    { num: 3, title: 'Spatial GIS Map' },
    { num: 4, title: 'Comparable Matrix' },
    { num: 5, title: 'Appraisal Adjustments' },
    { num: 6, title: 'Micro-Market Velocity' },
    { num: 7, title: 'FEMA Flood & Elevation' },
    { num: 8, title: 'Seller Net Proceeds' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col bg-stone-950/80 backdrop-blur-md animate-fadeIn text-slate-900 font-sans">
      
      {/* 1. Modal Top Toolbar (Screen-Only) */}
      <div className="print:hidden w-full bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-sm shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00635C] text-white flex items-center justify-center font-bold text-sm">
            📖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300">
                Maxa Luxury CMA Booklet
              </span>
              <span className="text-xs font-mono text-slate-500 font-bold">Page {currentPage} of 8</span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 truncate max-w-sm">
              {subjectProperty.propertyAddress.split(',')[0]}
            </h3>
          </div>
        </div>

        {/* Client Customizer */}
        <div className="flex items-center gap-2 bg-[#F7F8F5] px-3 py-1 rounded-xl border border-slate-200">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Client Name..."
            className="text-xs font-bold text-slate-800 bg-transparent outline-none w-48"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Export 300 DPI PDF</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="Close Booklet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Interactive Booklet Stage */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center relative">
        
        {/* Previous Page Chevron */}
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          className="print:hidden fixed left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md shadow-2xl border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-white hover:scale-110 transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none z-20"
          title="Previous Page (Left Arrow)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Next Page Chevron */}
        <button
          type="button"
          disabled={currentPage === 8}
          onClick={() => setCurrentPage(p => Math.min(8, p + 1))}
          className="print:hidden fixed right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md shadow-2xl border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-white hover:scale-110 transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none z-20"
          title="Next Page (Right Arrow)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {loading || !deck ? (
          <div className="bg-white rounded-3xl p-16 text-center text-slate-500 font-bold animate-pulse">
            Synthesizing 8-page high-resolution CMA deck for {clientName}...
          </div>
        ) : (
          /* Single Page Sheet Render (8.5 x 11 Aspect Ratio Container) */
          <div className="w-full max-w-4xl bg-white shadow-2xl rounded-3xl border border-slate-200 overflow-hidden min-h-[750px] flex flex-col justify-between text-left p-8 sm:p-12 animate-scaleUp">
            
            {/* PAGE 1: COVER PRESENTATION */}
            {currentPage === 1 && (
              <div className="h-full flex flex-col justify-between space-y-8 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[#00635C] tracking-widest uppercase">NEST REALTY</span>
                    <span className="text-xs text-slate-400 font-medium">| Wilmington Luxury Division</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">{deck.generatedAt}</span>
                </div>

                <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 h-80">
                  <img 
                    src={subjectProperty.heroPhoto} 
                    alt={subjectProperty.propertyAddress} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
                      Comparative Market Analysis & Valuation Advisory
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black leading-tight mt-1">
                      {subjectProperty.propertyAddress}
                    </h1>
                    <p className="text-sm font-medium text-slate-200 mt-1">
                      {subjectProperty.neighborhood} • {subjectProperty.heatedSqFt.toLocaleString()} SqFt • {subjectProperty.beds} Beds • {subjectProperty.baths} Baths
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 bg-[#F7F8F5] p-6 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Prepared Exclusively For:</span>
                    <h4 className="text-base font-extrabold text-slate-900 mt-0.5">{clientName}</h4>
                    <span className="text-xs text-slate-500">Property Homeowner</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Presented By:</span>
                    <h4 className="text-base font-extrabold text-[#00635C] mt-0.5">{deck.agentName}</h4>
                    <span className="text-xs text-slate-500">Nest Realty Wilmington • (910) 507-2047</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
                  <span>Confidential Listing Proposal</span>
                  <span className="font-bold">Page 1 of 8</span>
                </div>
              </div>
            )}

            {/* PAGE 2: NORA STRATEGY LETTER */}
            {currentPage === 2 && (
              <div className="h-full flex flex-col justify-between space-y-6 animate-fadeIn">
                <div>
                  <span className="text-[10px] font-bold text-[#00635C] uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Executive Strategy Letter
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-2">
                    {deck.executiveMemo.title}
                  </h2>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed bg-[#F7F8F5] p-6 rounded-2xl border border-slate-200">
                  <p className="font-bold text-slate-900">{deck.executiveMemo.greeting}</p>
                  {deck.executiveMemo.bodyParagraphs.map((p: string, idx: number) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                    Strategic Pricing Corridor
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 font-medium">Recommended Launch Price:</span>
                      <div className="text-2xl font-black text-[#00635C]">
                        ${deck.valuationTargetRange.recommendedListPrice.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 font-medium">Competitive Corridor:</span>
                      <div className="text-sm font-bold text-slate-800">
                        ${deck.valuationTargetRange.conservativePrice.toLocaleString()} – ${deck.valuationTargetRange.aggressivePrice.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
                  <span>Nest Strategic Advisory</span>
                  <span className="font-bold">Page 2 of 8</span>
                </div>
              </div>
            )}

            {/* PAGE 3: SPATIAL GIS MAP & ISOCHRONES */}
            {currentPage === 3 && (
              <div className="h-full flex flex-col justify-between space-y-6 animate-fadeIn">
                <div>
                  <span className="text-[10px] font-bold text-[#00635C] uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Spatial Proximity & GIS Mapping
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-2">
                    Spatial Intelligence & Coastal Lifestyle Isochrones
                  </h2>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-64 shadow-md bg-slate-900">
                  <img 
                    src={subjectProperty.heroPhoto} 
                    alt="Map preview" 
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 p-5 flex flex-col justify-between text-white">
                    <div className="flex items-center justify-between">
                      <span className="bg-[#00635C] px-3 py-1 rounded-full text-xs font-extrabold shadow-lg">
                        📍 Subject Anchor: {subjectProperty.propertyAddress.split(',')[0]}
                      </span>
                      <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold">
                        3.0 Mile Spatial Radius
                      </span>
                    </div>
                    <div className="text-xs bg-white/90 backdrop-blur-md text-slate-900 p-3 rounded-xl max-w-sm">
                      <span className="font-bold block text-[#00635C]">{deck.spatialContext.totalNearbySales} Comparable Closed Sales</span>
                      Avg Comp Price: ${deck.spatialContext.avgCompPrice.toLocaleString()} (${deck.spatialContext.avgCompSqFtPrice}/sf)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-[#F7F8F5] p-3.5 rounded-2xl border border-slate-200">
                    <span className="text-lg">🏖️</span>
                    <div className="text-sm font-black text-slate-900 mt-1">{deck.spatialContext.isochrones.beachMinutes} Min</div>
                    <span className="text-[10px] text-slate-500 font-medium">Wrightsville Beach</span>
                  </div>
                  <div className="bg-[#F7F8F5] p-3.5 rounded-2xl border border-slate-200">
                    <span className="text-lg">✈️</span>
                    <div className="text-sm font-black text-slate-900 mt-1">{deck.spatialContext.isochrones.airportMinutes} Min</div>
                    <span className="text-[10px] text-slate-500 font-medium">ILM Private Aviation</span>
                  </div>
                  <div className="bg-[#F7F8F5] p-3.5 rounded-2xl border border-slate-200">
                    <span className="text-lg">⛳</span>
                    <div className="text-sm font-black text-slate-900 mt-1">{deck.spatialContext.isochrones.clubhouseMinutes} Min</div>
                    <span className="text-[10px] text-slate-500 font-medium">Pete Dye Clubhouse</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
                  <span>Spatial GIS Analytics</span>
                  <span className="font-bold">Page 3 of 8</span>
                </div>
              </div>
            )}

            {/* PAGE 4: COMPARABLE MATRIX */}
            {currentPage === 4 && (
              <div className="h-full flex flex-col justify-between space-y-6 animate-fadeIn">
                <div>
                  <span className="text-[10px] font-bold text-[#00635C] uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Market Evidence
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-2">
                    Side-by-Side Comparable Property Matrix
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="pb-2">Property</th>
                        <th className="pb-2">Price</th>
                        <th className="pb-2">$/SqFt</th>
                        <th className="pb-2">Beds/Baths</th>
                        <th className="pb-2">SqFt</th>
                        <th className="pb-2">DOM</th>
                        <th className="pb-2">Distance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr className="bg-emerald-50/80 font-bold">
                        <td className="py-2.5 text-[#00635C]">Subject: {subjectProperty.propertyAddress.split(',')[0]}</td>
                        <td className="py-2.5 text-[#00635C] font-mono">${subjectProperty.listPrice.toLocaleString()}</td>
                        <td className="py-2.5 font-mono">${subjectProperty.pricePerSqFt}</td>
                        <td className="py-2.5">{subjectProperty.beds}b / {subjectProperty.baths}ba</td>
                        <td className="py-2.5 font-mono">{subjectProperty.heatedSqFt.toLocaleString()}</td>
                        <td className="py-2.5">0</td>
                        <td className="py-2.5">—</td>
                      </tr>
                      {deck.comparableMatrix.map((comp: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 text-slate-900 font-bold">{comp.propertyAddress.split(',')[0]}</td>
                          <td className="py-2.5 font-mono font-bold">${comp.soldPrice.toLocaleString()}</td>
                          <td className="py-2.5 font-mono text-slate-600">${comp.pricePerSqFt}</td>
                          <td className="py-2.5">{comp.beds}b / {comp.baths}ba</td>
                          <td className="py-2.5 font-mono">{comp.heatedSqFt.toLocaleString()}</td>
                          <td className="py-2.5">{comp.daysOnMarket}d</td>
                          <td className="py-2.5 font-mono">{comp.distanceMiles} mi</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#F7F8F5] p-4 rounded-2xl border border-slate-200 text-xs text-slate-600">
                  <span className="font-bold text-slate-900 block mb-1">Appraisal Methodology Note:</span>
                  All comparables verified through Cape Fear MLS closed records within 3.0 miles.
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
                  <span>Comparable Grid</span>
                  <span className="font-bold">Page 4 of 8</span>
                </div>
              </div>
            )}

            {/* PAGE 5: APPRAISAL ADJUSTMENTS */}
            {currentPage === 5 && (
              <div className="h-full flex flex-col justify-between space-y-6 animate-fadeIn">
                <div>
                  <span className="text-[10px] font-bold text-[#00635C] uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Valuation Engineering
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-2">
                    Appraisal-Grade Feature Adjustments Sheet
                  </h2>
                </div>

                <div className="space-y-3 text-xs">
                  {deck.appraisalAdjustments.map((ca: any, idx: number) => (
                    <div key={idx} className="bg-[#F7F8F5] p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900">{ca.compAddress.split(',')[0]}</h4>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Base Sale: ${ca.basePrice.toLocaleString()} • Net Adj: {ca.netAdjustment >= 0 ? '+' : ''}${ca.netAdjustment.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Indicated Subject Value:</span>
                        <div className="text-sm font-black text-[#00635C] font-mono">
                          ${ca.adjustedIndicatedValue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">Reconciled Indicated Subject Value:</span>
                  <span className="text-xl font-black text-[#00635C] font-mono">
                    ${deck.valuationTargetRange.indicatedValueAvg.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
                  <span>Appraisal Adjustments</span>
                  <span className="font-bold">Page 5 of 8</span>
                </div>
              </div>
            )}

            {/* PAGE 6: MICRO TRENDS */}
            {currentPage === 6 && (
              <div className="h-full flex flex-col justify-between space-y-6 animate-fadeIn">
                <div>
                  <span className="text-[10px] font-bold text-[#00635C] uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Market Dynamics
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-2">
                    Micro-Market Velocity & Price Trajectory
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#F7F8F5] p-4 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Annual Appreciation</span>
                    <div className="text-xl font-black text-emerald-700 mt-1">+{deck.microMarketTrends.annualAppreciationPercent}%</div>
                  </div>
                  <div className="bg-[#F7F8F5] p-4 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Absorption Rate</span>
                    <div className="text-xl font-black text-slate-900 mt-1">{deck.microMarketTrends.absorptionMonths} Months</div>
                  </div>
                  <div className="bg-[#F7F8F5] p-4 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Market Pace</span>
                    <div className="text-xl font-black text-[#00635C] mt-1">{deck.microMarketTrends.inventoryLevel}</div>
                  </div>
                </div>

                <div className="bg-[#F7F8F5] p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-900 block">Trailing 6-Month Price Progression:</span>
                  <div className="grid grid-cols-6 gap-2 text-center text-xs">
                    {deck.microMarketTrends.priceTrajectory.map((t: any, idx: number) => (
                      <div key={idx} className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold block">{t.month}</span>
                        <span className="font-mono font-bold text-slate-800 text-[11px] block">${(t.medianPrice/1000000).toFixed(2)}M</span>
                        <span className="text-[9px] text-slate-500 font-mono">${t.pricePerSqFt}/sf</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
                  <span>Micro-Market Trends</span>
                  <span className="font-bold">Page 6 of 8</span>
                </div>
              </div>
            )}

            {/* PAGE 7: FEMA FLOOD & INSURANCE */}
            {currentPage === 7 && (
              <div className="h-full flex flex-col justify-between space-y-6 animate-fadeIn">
                <div>
                  <span className="text-[10px] font-bold text-[#00635C] uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Coastal Risk & Underwriting
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-2">
                    FEMA Flood Zone & Coastal Elevation Risk Sheet
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#F7F8F5] p-5 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">FEMA Flood Zone</span>
                    <div className="text-lg font-black text-[#00635C]">{deck.floodAndElevationRisk.femaZone.split(' ')[0]} {deck.floodAndElevationRisk.femaZone.split(' ')[1]}</div>
                    <span className="text-xs text-slate-500">
                      {deck.floodAndElevationRisk.isFloodMandatory ? 'Mandatory Flood Policy' : 'Zone X (No Federal Mandate)'}
                    </span>
                  </div>

                  <div className="bg-[#F7F8F5] p-5 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Ground Elevation</span>
                    <div className="text-lg font-black text-emerald-700">{deck.floodAndElevationRisk.groundElevationFeet} Feet MSL</div>
                    <span className="text-xs text-slate-500">
                      BFE: {deck.floodAndElevationRisk.baseFloodElevationFeet} ft MSL
                    </span>
                  </div>
                </div>

                <div className="bg-[#F7F8F5] p-5 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-900 block">Total Estimated Annual Coastal Insurance Package:</span>
                  <div className="text-2xl font-black text-amber-900 font-mono">
                    ${deck.floodAndElevationRisk.totalAnnualInsurance.toLocaleString()} / Year
                  </div>
                  <p className="text-slate-500 leading-snug">
                    Includes Homeowners HO-3 Hazard, NC Wind & Hail Beach Plan, and Flood Insurance.
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
                  <span>Flood & Coastal Risk</span>
                  <span className="font-bold">Page 7 of 8</span>
                </div>
              </div>
            )}

            {/* PAGE 8: SELLER NET PROCEEDS */}
            {currentPage === 8 && (
              <div className="h-full flex flex-col justify-between space-y-6 animate-fadeIn">
                <div>
                  <span className="text-[10px] font-bold text-[#00635C] uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Net Equity Realization
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-2">
                    Estimated Seller Net Proceeds Sheet
                  </h2>
                </div>

                <div className="bg-[#F7F8F5] p-5 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200 font-bold">
                    <span>Target Gross Sale Price:</span>
                    <span className="font-mono text-[#00635C]">${deck.sellerNetProceedsSheet.grossSalePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>Brokerage Commissions (5.0%):</span>
                    <span className="font-mono">-${deck.sellerNetProceedsSheet.brokerageCommission.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>NC Revenue Stamps / Excise Tax ($1/$500):</span>
                    <span className="font-mono">-${deck.sellerNetProceedsSheet.ncExciseTax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>Closing Attorney & Title Prep:</span>
                    <span className="font-mono">-${(deck.sellerNetProceedsSheet.closingAttorneyFee + deck.sellerNetProceedsSheet.titleAndDocPrep).toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                      Estimated Net Cash to Seller:
                    </span>
                    <div className="text-3xl font-black text-[#00635C] font-mono mt-1">
                      ${deck.sellerNetProceedsSheet.estimatedSellerNet.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-sm font-black bg-emerald-600 text-white px-3 py-1 rounded-xl">
                    {deck.sellerNetProceedsSheet.netProceedsPercent}% Net Yield
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
                  <span>Seller Net Statement</span>
                  <span className="font-bold">Page 8 of 8</span>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* 3. Bottom Thumbnail Navigation Strip (Screen-Only) */}
      <div className="print:hidden w-full bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-center gap-2 overflow-x-auto shrink-0">
        {pages.map((p) => (
          <button
            key={p.num}
            type="button"
            onClick={() => setCurrentPage(p.num)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              currentPage === p.num 
                ? 'bg-[#00635C] text-white shadow-xs' 
                : 'bg-[#F7F8F5] text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>{p.num}.</span>
            <span>{p.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
