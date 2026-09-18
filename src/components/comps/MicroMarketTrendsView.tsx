/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * MicroMarketTrendsView: 12-Month Luxury Market Price Velocity & Absorption Rate Analytics
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, BarChart3, Activity, Gauge, 
  Calendar, ShieldCheck, DollarSign, Clock, Layers, ArrowUpRight, CheckCircle2, RefreshCw
} from 'lucide-react';
import { PropertyCompsRepository } from '../../../server/persistence/propertyCompsRepository';
import { useToast } from '../ui';

interface MicroMarketTrendsViewProps {
  initialNeighborhood?: string;
}

export const MicroMarketTrendsView: React.FC<MicroMarketTrendsViewProps> = ({
  initialNeighborhood = 'all'
}) => {
  const { toast } = useToast();
  const [neighborhood, setNeighborhood] = useState<string>(initialNeighborhood);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTrends = () => {
    setLoading(true);
    fetch(`/api/comps/trends?neighborhood=${encodeURIComponent(neighborhood)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.trends) {
          setTrends(data.trends);
        } else {
          setTrends(PropertyCompsRepository.getMicroMarketTrends(neighborhood));
        }
      })
      .catch(() => {
        setTrends(PropertyCompsRepository.getMicroMarketTrends(neighborhood));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTrends();
  }, [neighborhood]);

  if (loading || !trends) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500 animate-pulse font-sans">
        Calculating luxury micro-market absorption and 12-month $/sqft price velocity...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left font-sans animate-fadeIn">
      
      {/* 1. Header Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#00635C]" />
            Coastal Luxury Micro-Market Velocity & Absorption
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            12-month trailing price trends, months of inventory supply, and tier velocity benchmarks
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-[#00635C] outline-none cursor-pointer"
          >
            <option value="all">All Luxury Submarkets (Wilmington & Coast)</option>
            <option value="Landfall Golf & Country Club">Landfall Golf & Country Club</option>
            <option value="Wrightsville Beach">Wrightsville Beach</option>
            <option value="Autumn Hall / Mayfaire">Autumn Hall / Mayfaire</option>
          </select>

          <button
            type="button"
            onClick={fetchTrends}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
            title="Refresh Market Feed"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* 2. Key Micro-Market Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Months of Supply (Absorption) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Absorption Rate
          </span>
          <div className="text-2xl font-black text-[#00635C] flex items-baseline gap-1.5">
            <span>{trends.monthsOfSupply} Mo</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Seller Market
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {trends.marketCondition}
          </span>
        </div>

        {/* 12-Month Appreciation */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            12-Mo Appreciation
          </span>
          <div className="text-2xl font-black text-emerald-700 flex items-center gap-1">
            <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            <span>+{trends.trailing12MoAppreciationPercent}%</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Average annual price growth
          </span>
        </div>

        {/* List-to-Sale Realization Ratio */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            List-to-Sale Realization
          </span>
          <div className="text-2xl font-black text-slate-900">
            {trends.listToSaleRatioPercent}%
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Average offer price discipline
          </span>
        </div>

        {/* Average Days on Market */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Avg Velocity (DOM)
          </span>
          <div className="text-2xl font-black text-amber-800">
            {trends.avgDaysOnMarket} Days
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Fastest turnaround in Landfall & Sound
          </span>
        </div>
      </div>

      {/* 3. 12-Month $/SqFt Trajectory Curve Table / Visual Matrix */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              12-Month Luxury Price Per Heated Square Foot ($/SqFt) Trajectory
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracking soundfront, golf course, and master-planned community pricing velocity
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-700 font-medium">
              <span className="w-3 h-3 rounded bg-[#00635C]" /> Wrightsville Beach ($550/sf)
            </span>
            <span className="flex items-center gap-1.5 text-slate-700 font-medium">
              <span className="w-3 h-3 rounded bg-blue-600" /> Landfall ($371/sf)
            </span>
            <span className="flex items-center gap-1.5 text-slate-700 font-medium">
              <span className="w-3 h-3 rounded bg-amber-600" /> Autumn Hall ($264/sf)
            </span>
          </div>
        </div>

        {/* Visual Bar Graph Strip */}
        <div className="space-y-3 pt-2">
          {trends.monthlyTrends.slice(-6).map((m: any, idx: number) => (
            <div key={idx} className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600 font-bold text-[11px]">
                <span>{m.month}</span>
                <span className="font-mono text-slate-900">Market Avg: ${m.brokerageWideAvgSqFt}/sf</span>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-lg overflow-hidden flex gap-0.5 p-0.5">
                <div 
                  style={{ width: `${(m.wrightsvilleAvgSqFt / 600) * 100}%` }}
                  className="bg-[#00635C] rounded-xs transition-all duration-300"
                  title={`Wrightsville Beach: $${m.wrightsvilleAvgSqFt}/sf`}
                />
                <div 
                  style={{ width: `${(m.landfallAvgSqFt / 600) * 100}%` }}
                  className="bg-blue-600 rounded-xs transition-all duration-300"
                  title={`Landfall: $${m.landfallAvgSqFt}/sf`}
                />
                <div 
                  style={{ width: `${(m.autumnHallAvgSqFt / 600) * 100}%` }}
                  className="bg-amber-600 rounded-xs transition-all duration-300"
                  title={`Autumn Hall: $${m.autumnHallAvgSqFt}/sf`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Price Tier Velocity Breakdown */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-slate-900">
          Luxury Price Tier Breakdown & Inventory Liquidity
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trends.tierBreakdown.map((tier: any, idx: number) => (
            <div key={idx} className="bg-[#F7F8F5] border border-slate-200/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{tier.tierLabel}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {tier.inventory} Active
                </span>
              </div>
              <div className="text-lg font-black text-[#00635C]">
                {tier.priceRange}
              </div>
              <div className="pt-2 border-t border-slate-200/60 flex justify-between text-xs text-slate-600">
                <span>Avg DOM: <strong className="text-slate-900 font-mono">{tier.avgDOM} Days</strong></span>
                <span className="text-[11px] font-bold text-slate-800">{tier.velocityRating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
