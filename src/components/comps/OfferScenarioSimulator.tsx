/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OfferScenarioSimulator: Live NC Form 2-T Offer Terms & Pricing Simulator
 * Calculates offer competitiveness index, $/sqft delta vs comps, and seller net proceeds.
 */

import React, { useState, useEffect } from 'react';
import { 
  Calculator, ShieldCheck, DollarSign, Clock, FileText, 
  TrendingUp, Award, CheckCircle2, AlertTriangle, Sparkles, Send, Download
} from 'lucide-react';
import { LuxuryPropertyComp, OfferAnalysisResult, PropertyCompsRepository } from '../../../server/persistence/propertyCompsRepository';
import { useToast } from '../ui';

interface OfferScenarioSimulatorProps {
  subjectProperty: LuxuryPropertyComp;
  comps: LuxuryPropertyComp[];
}

export const OfferScenarioSimulator: React.FC<OfferScenarioSimulatorProps> = ({
  subjectProperty,
  comps
}) => {
  const { toast } = useToast();

  const [offerPrice, setOfferPrice] = useState<number>(subjectProperty.listPrice);
  const [ddFee, setDdFee] = useState<number>(subjectProperty.dueDiligenceFee || 25000);
  const [ddDays, setDdDays] = useState<number>(14);
  const [earnestMoney, setEarnestMoney] = useState<number>(subjectProperty.earnestMoneyDeposit || 25000);
  const [closingDays, setClosingDays] = useState<number>(30);
  const [concessions, setConcessions] = useState<number>(0);

  // Auto-sync when subject property changes
  useEffect(() => {
    setOfferPrice(subjectProperty.listPrice);
    setDdFee(subjectProperty.dueDiligenceFee || Math.round(subjectProperty.listPrice * 0.02));
    setEarnestMoney(subjectProperty.earnestMoneyDeposit || Math.round(subjectProperty.listPrice * 0.02));
  }, [subjectProperty.id]);

  const analysis: OfferAnalysisResult = PropertyCompsRepository.analyzeOfferScenario({
    subjectPropertyId: subjectProperty.id,
    proposedOfferPrice: offerPrice,
    proposedDueDiligenceFee: ddFee,
    dueDiligenceDays: ddDays,
    proposedEarnestMoney: earnestMoney,
    closingDays,
    sellerConcessions: concessions
  });

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-700 bg-emerald-100 border-emerald-300';
    if (score >= 45) return 'text-amber-800 bg-amber-100 border-amber-300';
    return 'text-rose-700 bg-rose-100 border-rose-300';
  };

  const handleCopyOfferSummary = () => {
    const summaryText = `### NC Form 2-T Offer Summary
Property: ${subjectProperty.propertyAddress}
Proposed Purchase Price: $${offerPrice.toLocaleString()} ($${analysis.proposedPricePerSqFt}/sqft)
Due Diligence Fee: $${ddFee.toLocaleString()} (${analysis.dueDiligencePercent}%)
Due Diligence Expiration: ${analysis.dueDiligenceDeadlineStr}
Initial Earnest Money: $${earnestMoney.toLocaleString()}
Estimated Settlement Date: ${analysis.estimatedSettlementDateStr}
Competitiveness Rating: ${analysis.competitivenessRating} (${analysis.competitivenessScore}/100)
Estimated Seller Net: $${analysis.estimatedSellerNetProceeds.toLocaleString()}`;

    navigator.clipboard.writeText(summaryText);
    toast.success({
      title: 'Offer Summary Copied',
      description: 'Formatted Form 2-T offer scenario terms copied to clipboard.'
    });
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm text-left font-sans space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#00635C]" />
            NC Form 2-T Offer & Net Strategy Simulator
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Test offer prices, due diligence fees, and settlement dates in real-time
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Competitiveness Score Pill */}
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${getScoreColor(analysis.competitivenessScore)}`}>
            <Award className="w-4 h-4 shrink-0" />
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider block leading-none">
                Win Index: {analysis.competitivenessScore}/100
              </span>
              <span className="text-xs font-bold leading-none">
                {analysis.competitivenessRating.split('/')[0]}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyOfferSummary}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Copy Form 2-T Brief
          </button>
        </div>
      </div>

      {/* Main Grid: Controls vs Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Offer Sliders & Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* 1. Proposed Purchase Price */}
          <div className="bg-[#F7F8F5] p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-900">Proposed Purchase Price:</label>
              <div className="text-right">
                <span className="font-extrabold text-base text-[#00635C]">
                  ${offerPrice.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  List: ${subjectProperty.listPrice.toLocaleString()} ({analysis.priceDeltaPercent >= 0 ? '+' : ''}{analysis.priceDeltaPercent}%)
                </span>
              </div>
            </div>

            <input
              type="range"
              min={Math.round(subjectProperty.listPrice * 0.85)}
              max={Math.round(subjectProperty.listPrice * 1.15)}
              step={5000}
              value={offerPrice}
              onChange={(e) => setOfferPrice(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#00635C]"
            />

            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-15% (${Math.round(subjectProperty.listPrice * 0.85).toLocaleString()})</span>
              <span className="font-bold text-slate-600">Asking (${subjectProperty.listPrice.toLocaleString()})</span>
              <span>+15% (${Math.round(subjectProperty.listPrice * 1.15).toLocaleString()})</span>
            </div>
          </div>

          {/* 2. Due Diligence (DD) Fee & Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#F7F8F5] p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-900">Due Diligence Fee:</label>
                <span className="font-extrabold text-sm text-slate-900">
                  ${ddFee.toLocaleString()} ({analysis.dueDiligencePercent}%)
                </span>
              </div>
              <input
                type="range"
                min={5000}
                max={Math.round(subjectProperty.listPrice * 0.05)}
                step={2500}
                value={ddFee}
                onChange={(e) => setDdFee(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#00635C]"
              />
              <span className="text-[10px] text-slate-500 block">
                Neighborhood Comp Benchmark: ${analysis.avgCompDueDiligenceFee.toLocaleString()}
              </span>
            </div>

            <div className="bg-[#F7F8F5] p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-900">DD Window (Days):</label>
                <span className="font-extrabold text-sm text-slate-900">{ddDays} Days</span>
              </div>
              <input
                type="range"
                min={7}
                max={30}
                step={1}
                value={ddDays}
                onChange={(e) => setDdDays(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#00635C]"
              />
              <span className="text-[10px] text-slate-500 block">
                Expires: <strong className="text-slate-800">{analysis.dueDiligenceDeadlineStr}</strong>
              </span>
            </div>
          </div>

          {/* 3. Earnest Money & Settlement Days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#F7F8F5] p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-900">Earnest Money (EMD):</label>
                <span className="font-extrabold text-sm text-slate-900">${earnestMoney.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={5000}
                max={Math.round(subjectProperty.listPrice * 0.05)}
                step={2500}
                value={earnestMoney}
                onChange={(e) => setEarnestMoney(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#00635C]"
              />
              <span className="text-[10px] text-slate-500 block">Held in Trust (NCREC Rule 58A.0107)</span>
            </div>

            <div className="bg-[#F7F8F5] p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-900">Closing Settlement:</label>
                <span className="font-extrabold text-sm text-slate-900">{closingDays} Days</span>
              </div>
              <input
                type="range"
                min={15}
                max={60}
                step={5}
                value={closingDays}
                onChange={(e) => setClosingDays(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#00635C]"
              />
              <span className="text-[10px] text-slate-500 block">
                Target Closing: <strong className="text-slate-800">{analysis.estimatedSettlementDateStr}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Key Financial Outputs & Net Sheet (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-5 space-y-5">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Offer Financial Breakdown
            </span>
            <span className="text-[10px] font-mono text-slate-400">NC Form 2-T Matrix</span>
          </div>

          {/* Metric Highlights */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Offered Price / SqFt:</span>
              <span className="font-mono font-extrabold text-white text-sm">
                ${analysis.proposedPricePerSqFt}/sf 
                <span className={`text-[11px] ml-1.5 font-sans ${analysis.pricePerSqFtVariance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ({analysis.pricePerSqFtVariance >= 0 ? '+' : ''}${analysis.pricePerSqFtVariance}/sf vs comps)
                </span>
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Neighborhood Avg $/SqFt:</span>
              <span className="font-mono text-slate-300">${analysis.avgCompPricePerSqFt}/sf</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Non-Refundable DD Fee:</span>
              <span className="font-mono font-bold text-amber-400">
                ${ddFee.toLocaleString()} ({analysis.dueDiligencePercent}%)
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Due Diligence Deadline:</span>
              <span className="text-slate-200 font-medium">{analysis.dueDiligenceDeadlineStr}</span>
            </div>
          </div>

          {/* Estimated Seller Net Sheet */}
          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Estimated Seller Net Proceeds:
            </span>
            <div className="text-2xl font-black text-emerald-400">
              ${analysis.estimatedSellerNetProceeds.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 space-y-0.5">
              <div className="flex justify-between">
                <span>Gross Purchase Price:</span>
                <span>${offerPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Est. Brokerage & Closing Fees (~5.5%):</span>
                <span>-${Math.round(offerPrice * 0.055 + 2500).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Strategic Action Notes */}
          <div className="space-y-1.5">
            {analysis.strategicNotes.map((note, idx) => (
              <p key={idx} className="text-[11px] text-slate-300 leading-snug">
                {note}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
