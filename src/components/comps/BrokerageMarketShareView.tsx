/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BrokerageMarketShareView: Submarket Brokerage Market Share & Competitive Intelligence
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Award, DollarSign, Building2, 
  BarChart3, CheckCircle2, ArrowUpRight, Zap, RefreshCw
} from 'lucide-react';
import { PropertyCompsRepository } from '../../../server/persistence/propertyCompsRepository';
import { useToast } from '../ui';

interface BrokerageMarketShareViewProps {
  initialNeighborhood?: string;
}

export const BrokerageMarketShareView: React.FC<BrokerageMarketShareViewProps> = ({
  initialNeighborhood = 'all'
}) => {
  const { toast } = useToast();
  const [neighborhood, setNeighborhood] = useState<string>(initialNeighborhood);
  const [shareData, setShareData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchShare = () => {
    setLoading(true);
    fetch(`/api/comps/brokerage-share?neighborhood=${encodeURIComponent(neighborhood)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.shareData) {
          setShareData(data.shareData);
        } else {
          setShareData(PropertyCompsRepository.getBrokerageMarketShare(neighborhood));
        }
      })
      .catch(() => {
        setShareData(PropertyCompsRepository.getBrokerageMarketShare(neighborhood));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchShare();
  }, [neighborhood]);

  if (loading || !shareData) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500 animate-pulse font-sans">
        Aggregating coastal luxury MLS transaction sides and market share analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left font-sans animate-fadeIn">
      
      {/* 1. Header Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
              {shareData.nestRealtyMarketRank}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Submarket: {shareData.neighborhood}
            </span>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#00635C]" />
            Brokerage Market Share & Competitive Velocity
          </h3>
        </div>

        {/* Submarket Selector */}
        <div className="flex items-center gap-2">
          <select
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-[#F7F8F5] text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#00635C] outline-none cursor-pointer"
          >
            <option value="all">All Wilmington Luxury ($1M+)</option>
            <option value="Landfall Golf & Country Club">Landfall Golf & Country Club</option>
            <option value="Wrightsville Beach">Wrightsville Beach</option>
            <option value="Autumn Hall">Autumn Hall / Mayfaire</option>
          </select>
        </div>
      </div>

      {/* 2. Key Boutique Brokerage Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Nest Closed Volume
          </span>
          <div className="text-xl font-black text-[#00635C]">
            ${(shareData.nestRealtyVolume / 1000000).toFixed(1)}M
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {shareData.nestRealtySharePercent}% Market Share
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Average Days On Market
          </span>
          <div className="text-xl font-black text-emerald-700">
            11 Days
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {shareData.velocityDeltaDays} days faster than market (24d avg)
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            List-to-Sale Realization
          </span>
          <div className="text-xl font-black text-slate-900">
            98.6%
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            +{shareData.priceRealizationDeltaPercent}% higher net to sellers
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Submarket Volume
          </span>
          <div className="text-xl font-black text-amber-900 font-mono">
            ${(shareData.totalMarketVolume / 1000000).toFixed(1)}M
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Trailing 12-Month Closed ($1M+)
          </span>
        </div>
      </div>

      {/* 3. Competitive Brokerage Leaderboard Matrix */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Luxury Real Estate Brokerage Leaderboard ($1M+ Tier)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked by total closed dollar volume and listing performance
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">Brokerage Firm</th>
                <th className="pb-3">Closed Volume ($)</th>
                <th className="pb-3">Market Share (%)</th>
                <th className="pb-3">Sides</th>
                <th className="pb-3">Avg DOM</th>
                <th className="pb-3">List-to-Sale %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {shareData.leaderboard.map((entry: any, idx: number) => {
                return (
                  <tr 
                    key={entry.brokerageName}
                    className={`transition ${entry.isNestRealty ? 'bg-emerald-50/70 font-bold' : 'hover:bg-slate-50'}`}
                  >
                    <td className="py-3 pl-2 flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        idx === 0 ? 'bg-[#00635C] text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className={entry.isNestRealty ? 'text-[#00635C] font-extrabold' : 'text-slate-800'}>
                        {entry.brokerageName}
                      </span>
                      {entry.isNestRealty && (
                        <span className="text-[9px] uppercase tracking-wider font-extrabold bg-[#00635C] text-white px-1.5 py-0.5 rounded">
                          Our Firm
                        </span>
                      )}
                    </td>
                    <td className="py-3 font-mono font-bold text-slate-900">
                      ${(entry.closedVolume / 1000000).toFixed(1)}M
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${entry.isNestRealty ? 'bg-[#00635C]' : 'bg-slate-600'}`}
                            style={{ width: `${entry.marketSharePercent * 2}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-700">{entry.marketSharePercent}%</span>
                      </div>
                    </td>
                    <td className="py-3 font-mono">{entry.transactionSides}</td>
                    <td className="py-3 font-mono">
                      <span className={entry.isNestRealty ? 'text-emerald-700 font-bold' : 'text-slate-600'}>
                        {entry.avgDaysOnMarket} Days
                      </span>
                    </td>
                    <td className="py-3 font-mono">
                      <span className={entry.isNestRealty ? 'text-emerald-700 font-bold' : 'text-slate-600'}>
                        {entry.listToSaleRatioPercent}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
