/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CompMetricsMatrix: Side-by-Side Luxury Market Metrics Matrix
 * Compares subject property against active, pending, and closed comparables.
 */

import React from 'react';
import { Home, TrendingUp, DollarSign, Calendar, Sparkles, CheckCircle2, ShieldCheck, ArrowUpRight, ArrowDownRight, Award } from 'lucide-react';
import { LuxuryPropertyComp } from '../../../server/persistence/propertyCompsRepository';

interface CompMetricsMatrixProps {
  subjectProperty: LuxuryPropertyComp;
  comps: (LuxuryPropertyComp & { distanceMiles?: number })[];
  selectedCompId: string | null;
  onSelectComp: (comp: LuxuryPropertyComp) => void;
}

export const CompMetricsMatrix: React.FC<CompMetricsMatrixProps> = ({
  subjectProperty,
  comps,
  selectedCompId,
  onSelectComp
}) => {
  const getStatusBadge = (status: LuxuryPropertyComp['status']) => {
    switch (status) {
      case 'subject':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">Subject</span>;
      case 'active':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">Active</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">Pending</span>;
      case 'closed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">Closed</span>;
      case 'pocket_exclusive':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">Pocket</span>;
      default:
        return null;
    }
  };

  const calculateVariancePercent = (value: number, base: number) => {
    const delta = value - base;
    const pct = Math.round((delta / base) * 100);
    if (pct > 0) {
      return (
        <span className="text-emerald-700 font-bold inline-flex items-center text-[10px]">
          <ArrowUpRight className="w-3 h-3" /> +{pct}%
        </span>
      );
    } else if (pct < 0) {
      return (
        <span className="text-rose-600 font-bold inline-flex items-center text-[10px]">
          <ArrowDownRight className="w-3 h-3" /> {pct}%
        </span>
      );
    }
    return <span className="text-slate-400 font-medium text-[10px]">0%</span>;
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm text-left font-sans">
      {/* Header */}
      <div className="px-6 py-4 bg-[#F7F8F5] border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#00635C]" />
            Side-by-Side Luxury Market Matrix
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time metric alignment and feature adjustment benchmarks
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {comps.length} Spatial Comps Indexed
        </span>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Property & Status</th>
              <th className="py-3 px-4">Price / $/SqFt</th>
              <th className="py-3 px-4">Specs & Size</th>
              <th className="py-3 px-4">Age & Lot</th>
              <th className="py-3 px-4">DOM & Speed</th>
              <th className="py-3 px-4">Due Diligence</th>
              <th className="py-3 px-4">Key Luxury Amenities</th>
              <th className="py-3 px-4 text-right">Distance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Subject Property Row (Pinned Top) */}
            <tr className="bg-emerald-50/40 font-medium hover:bg-emerald-50/70 transition">
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-2.5">
                  <img 
                    src={subjectProperty.heroPhoto} 
                    alt={subjectProperty.propertyAddress}
                    className="w-10 h-10 rounded-lg object-cover border border-emerald-300 shrink-0" 
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-xs">
                        {subjectProperty.propertyAddress.split(',')[0]}
                      </span>
                      {getStatusBadge(subjectProperty.status)}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      {subjectProperty.neighborhood} • {subjectProperty.mlsNumber}
                    </span>
                  </div>
                </div>
              </td>
              <td className="py-3.5 px-4">
                <div className="font-extrabold text-[#00635C] text-sm">
                  ${subjectProperty.listPrice.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  ${subjectProperty.pricePerSqFt}/sf
                </div>
              </td>
              <td className="py-3.5 px-4">
                <span className="font-bold text-slate-800">{subjectProperty.beds} Bed, {subjectProperty.baths} Bath</span>
                <span className="text-[11px] text-slate-500 block font-mono">{subjectProperty.heatedSqFt.toLocaleString()} sf</span>
              </td>
              <td className="py-3.5 px-4">
                <span className="text-slate-800 font-medium">Built {subjectProperty.yearBuilt}</span>
                <span className="text-[11px] text-slate-500 block">{subjectProperty.lotAcres} Acres</span>
              </td>
              <td className="py-3.5 px-4">
                <span className="font-bold text-slate-900">{subjectProperty.daysOnMarket} Days</span>
                <span className="text-[10px] text-emerald-700 block font-semibold">Active Listing</span>
              </td>
              <td className="py-3.5 px-4">
                <span className="font-bold text-slate-900">${(subjectProperty.dueDiligenceFee || 25000).toLocaleString()}</span>
                <span className="text-[10px] text-slate-500 block">{( (subjectProperty.dueDiligenceFee || 25000) / subjectProperty.listPrice * 100 ).toFixed(1)}% Benchmark</span>
              </td>
              <td className="py-3.5 px-4">
                <div className="flex flex-wrap gap-1 max-w-xs">
                  {subjectProperty.amenities.slice(0, 3).map((amenity, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded bg-emerald-100/80 text-emerald-900 text-[10px] font-medium border border-emerald-200">
                      {amenity}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-3.5 px-4 text-right">
                <span className="px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-900 font-bold text-[10px]">
                  Center
                </span>
              </td>
            </tr>

            {/* Comps Rows */}
            {comps.map((comp) => {
              const isSelected = selectedCompId === comp.id;
              const price = comp.soldPrice || comp.listPrice;
              return (
                <tr 
                  key={comp.id}
                  onClick={() => onSelectComp(comp)}
                  className={`cursor-pointer transition hover:bg-slate-50 ${
                    isSelected ? 'bg-amber-50/50 border-l-4 border-amber-500' : ''
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={comp.heroPhoto} 
                        alt={comp.propertyAddress}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" 
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs">
                            {comp.propertyAddress.split(',')[0]}
                          </span>
                          {getStatusBadge(comp.status)}
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium block">
                          {comp.listingBrokerage} • {comp.mlsNumber}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-xs">
                      ${price.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="font-mono text-slate-500">${comp.pricePerSqFt}/sf</span>
                      {calculateVariancePercent(comp.pricePerSqFt, subjectProperty.pricePerSqFt)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-slate-800">{comp.beds} Bed, {comp.baths} Bath</span>
                    <span className="text-[11px] text-slate-500 block font-mono">{comp.heatedSqFt.toLocaleString()} sf</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-slate-800">Built {comp.yearBuilt}</span>
                    <span className="text-[11px] text-slate-500 block">{comp.lotAcres} Acres</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900">{comp.daysOnMarket} Days</span>
                    {comp.soldDate ? (
                      <span className="text-[10px] text-slate-500 block font-medium">Sold {comp.soldDate}</span>
                    ) : (
                      <span className="text-[10px] text-amber-700 block font-semibold">Active</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-900">${(comp.dueDiligenceFee || 20000).toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500 block">{( (comp.dueDiligenceFee || 20000) / price * 100 ).toFixed(1)}% Fee</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {comp.amenities.slice(0, 3).map((amenity, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-mono text-slate-600 font-semibold text-xs">
                      {comp.distanceMiles !== undefined ? `${comp.distanceMiles} mi` : '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
