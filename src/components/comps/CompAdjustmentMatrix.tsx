/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CompAdjustmentMatrix: Live Appraisal-Grade Comp Feature Adjustment Engine
 * Computes marginal $/sqft deltas, feature premiums (pool, dock, golf, garage), and indicated subject value.
 */

import React, { useState } from 'react';
import { Sliders, Award, TrendingUp, CheckCircle2, DollarSign, Home, ShieldCheck, RefreshCw, ArrowRight } from 'lucide-react';
import { 
  LuxuryPropertyComp, 
  AppraisalAdjustmentsResult, 
  PropertyCompsRepository 
} from '../../../server/persistence/propertyCompsRepository';
import { useToast } from '../ui';

interface CompAdjustmentMatrixProps {
  subjectProperty: LuxuryPropertyComp;
  comps: (LuxuryPropertyComp & { distanceMiles?: number })[];
  onSelectComp?: (comp: LuxuryPropertyComp) => void;
}

export const CompAdjustmentMatrix: React.FC<CompAdjustmentMatrixProps> = ({
  subjectProperty,
  comps,
  onSelectComp
}) => {
  const { toast } = useToast();

  const [sqftRate, setSqftRate] = useState<number>(150);
  const [poolValue, setPoolValue] = useState<number>(65000);
  const [dockValue, setDockValue] = useState<number>(125000);
  const [golfValue, setGolfValue] = useState<number>(50000);
  const [garageValue, setGarageValue] = useState<number>(25000);

  const adjustmentsData: AppraisalAdjustmentsResult = PropertyCompsRepository.calculateAppraisalAdjustments(
    subjectProperty.id,
    {
      sqftRate,
      poolValue,
      dockValue,
      golfValue,
      garageValue
    }
  );

  const formatDeltaCurrency = (val: number) => {
    if (val > 0) return `+$${val.toLocaleString()}`;
    if (val < 0) return `-$${Math.abs(val).toLocaleString()}`;
    return '—';
  };

  const handleResetDefaults = () => {
    setSqftRate(150);
    setPoolValue(65000);
    setDockValue(125000);
    setGolfValue(50000);
    setGarageValue(25000);
    toast.info({
      title: 'Adjustments Reset',
      description: 'Restored local market standard appraisal adjustment baselines.'
    });
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm text-left font-sans space-y-6 p-6">
      
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#00635C]" />
            Appraisal-Grade Feature Adjustment Engine
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time appraisal adjustment grid reconciling subject property indicated value
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            Reset Baselines
          </button>
        </div>
      </div>

      {/* 2. Interactive Feature Premium Adjustment Sliders */}
      <div className="bg-[#F7F8F5] border border-slate-200/80 rounded-2xl p-5 space-y-4">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
          Market Adjustment Rates & Cost-to-Construct Factors
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-xs">
          
          {/* Marginal SqFt Rate */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/60 space-y-1.5 shadow-2xs">
            <div className="flex justify-between">
              <span className="font-bold text-slate-700">Marginal SqFt:</span>
              <span className="font-mono font-extrabold text-[#00635C]">${sqftRate}/sf</span>
            </div>
            <input
              type="range"
              min={75}
              max={275}
              step={5}
              value={sqftRate}
              onChange={(e) => setSqftRate(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#00635C]"
            />
          </div>

          {/* Heated Pool */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/60 space-y-1.5 shadow-2xs">
            <div className="flex justify-between">
              <span className="font-bold text-slate-700">Heated Pool:</span>
              <span className="font-mono font-extrabold text-[#00635C]">${(poolValue / 1000)}k</span>
            </div>
            <input
              type="range"
              min={30000}
              max={120000}
              step={5000}
              value={poolValue}
              onChange={(e) => setPoolValue(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#00635C]"
            />
          </div>

          {/* Deepwater Dock */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/60 space-y-1.5 shadow-2xs">
            <div className="flex justify-between">
              <span className="font-bold text-slate-700">Boat Dock:</span>
              <span className="font-mono font-extrabold text-[#00635C]">${(dockValue / 1000)}k</span>
            </div>
            <input
              type="range"
              min={50000}
              max={200000}
              step={5000}
              value={dockValue}
              onChange={(e) => setDockValue(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#00635C]"
            />
          </div>

          {/* Golf View */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/60 space-y-1.5 shadow-2xs">
            <div className="flex justify-between">
              <span className="font-bold text-slate-700">Golf Front:</span>
              <span className="font-mono font-extrabold text-[#00635C]">${(golfValue / 1000)}k</span>
            </div>
            <input
              type="range"
              min={20000}
              max={100000}
              step={5000}
              value={golfValue}
              onChange={(e) => setGolfValue(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#00635C]"
            />
          </div>

          {/* Garage Bays */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/60 space-y-1.5 shadow-2xs">
            <div className="flex justify-between">
              <span className="font-bold text-slate-700">Garage / Bay:</span>
              <span className="font-mono font-extrabold text-[#00635C]">${(garageValue / 1000)}k</span>
            </div>
            <input
              type="range"
              min={10000}
              max={50000}
              step={2500}
              value={garageValue}
              onChange={(e) => setGarageValue(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#00635C]"
            />
          </div>
        </div>
      </div>

      {/* 3. Reconciled Indicated Valuation Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Reconciled Indicated Subject Value
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white flex items-baseline gap-3">
            <span>${adjustmentsData.weightedIndicatedValue.toLocaleString()}</span>
            <span className="text-xs font-normal text-slate-400 font-sans">
              Range: ${adjustmentsData.valuationRangeLow.toLocaleString()} – ${adjustmentsData.valuationRangeHigh.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
            Weighted across {adjustmentsData.adjustments.length} Comps
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            Subject List Price: ${subjectProperty.listPrice.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 4. Side-by-Side Appraisal Adjustment Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Comparable Property</th>
              <th className="py-3 px-4">Sale/List Price</th>
              <th className="py-3 px-4">SqFt Adj (${sqftRate}/sf)</th>
              <th className="py-3 px-4">Pool</th>
              <th className="py-3 px-4">Boat Dock</th>
              <th className="py-3 px-4">Golf / Garage</th>
              <th className="py-3 px-4">Net Adj</th>
              <th className="py-3 px-4 text-right">Indicated Subject Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {adjustmentsData.adjustments.map((adj) => {
              const comp = comps.find(c => c.id === adj.compId);
              return (
                <tr 
                  key={adj.compId}
                  onClick={() => comp && onSelectComp && onSelectComp(comp)}
                  className="hover:bg-slate-50 transition cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{adj.compAddress.split(',')[0]}</span>
                    <span className="text-[10px] text-slate-500">{comp?.neighborhood} • Weight: {adj.weightPercent}%</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    ${adj.basePrice.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {formatDeltaCurrency(adj.sqftAdjustment)}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {formatDeltaCurrency(adj.poolAdjustment)}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {formatDeltaCurrency(adj.dockAdjustment)}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {formatDeltaCurrency(adj.golfAdjustment + adj.garageAdjustment)}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    <span className={adj.netAdjustment >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                      {formatDeltaCurrency(adj.netAdjustment)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-sm text-[#00635C]">
                    ${adj.adjustedIndicatedValue.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. Appraisal Methodology Notes */}
      <div className="bg-[#F7F8F5] border border-slate-200/80 rounded-xl p-4 space-y-1.5 text-xs text-slate-600">
        <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
          Appraisal Methodology Rationale:
        </span>
        {adjustmentsData.appraisalNotes.map((note, idx) => (
          <p key={idx} className="leading-snug">
            • {note}
          </p>
        ))}
      </div>
    </div>
  );
};
