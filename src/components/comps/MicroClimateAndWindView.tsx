/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * MicroClimateAndWindView: Micro-Climate & Coastal Wind Intelligence Console
 * Seasonal Wind Rose Analysis, Summer Sea Breeze Cooling Effect (-4.5°F),
 * Maritime Forest Canopy Windbreak, and Storm Surge Topographic Buffers.
 */

import React, { useState, useEffect } from 'react';
import { 
  Wind, Thermometer, ShieldCheck, Waves, Compass, 
  Trees, CloudSun, ArrowUpRight, ArrowDownLeft, Sparkles, Navigation
} from 'lucide-react';
import { LuxuryPropertyComp, PropertyCompsRepository } from '../../../server/persistence/propertyCompsRepository';
import { useToast } from '../ui';

interface MicroClimateAndWindViewProps {
  subjectProperty: LuxuryPropertyComp;
}

export const MicroClimateAndWindView: React.FC<MicroClimateAndWindViewProps> = ({
  subjectProperty
}) => {
  const { toast } = useToast();
  const [microClimate, setMicroClimate] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/comps/micro-climate/${subjectProperty.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.microClimate) {
          setMicroClimate(data.microClimate);
        } else {
          setMicroClimate(PropertyCompsRepository.getMicroClimateProfile(subjectProperty.id));
        }
      })
      .catch(() => {
        setMicroClimate(PropertyCompsRepository.getMicroClimateProfile(subjectProperty.id));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [subjectProperty.id]);

  if (loading || !microClimate) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center text-slate-500 font-bold animate-pulse border border-slate-200">
        Analyzing coastal meteorological wind rose & micro-climate patterns...
      </div>
    );
  }

  const { distanceToCoastMiles, microClimateIndex, averageAnnualSunnyDays, summerSeaBreezeCoolingDeltaF, windRosePatterns, stormProtectionShielding } = microClimate;

  return (
    <div className="w-full space-y-6 text-left font-sans animate-fadeIn">
      
      {/* 1. Master Micro-Climate Banner */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-900 border border-cyan-300 flex items-center gap-1">
              <Wind className="w-3 h-3 text-cyan-700" /> Coastal Meteorology
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">{distanceToCoastMiles} Mi to Coast</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Micro-Climate & Coastal Wind Intelligence
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Seasonal wind rose vectors, summer ocean breeze cooling effects, mature maritime canopy windbreak shielding, and topographic surge safety margins.
          </p>
        </div>

        {/* Summer Breeze Cooling Badge */}
        <div className="bg-[#F7F8F5] border border-slate-200 p-5 rounded-2xl text-right shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Summer Sea Breeze Cooling Buffer
          </span>
          <div className="text-3xl font-black text-cyan-700 font-mono mt-0.5">
            -{summerSeaBreezeCoolingDeltaF}°F
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            SSW 11.2 Knots off Masonboro Sound • {averageAnnualSunnyDays} Sunny Days/Yr
          </span>
        </div>
      </div>

      {/* 2. Key Climate Metrics Strip */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            USDA Hardiness Zone
          </span>
          <div className="text-lg font-black text-emerald-800 font-mono mt-0.5">
            Zone 8b
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Temperate Coastal Maritime
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Surge Elevation Margin
          </span>
          <div className="text-lg font-black text-[#00635C] font-mono mt-0.5">
            +{stormProtectionShielding.hurricaneSurgeTopographicSafetyMarginFeet} Feet
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Above 100-Yr Surge Level
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Structural Wind Rating
          </span>
          <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
            {stormProtectionShielding.structuralWindRatingMph} MPH
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Category 4 Hurricane Standard
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Canopy Windbreak
          </span>
          <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">
            80% Reduction
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Ground-Level Tree Shelter
          </span>
        </div>
      </div>

      {/* 3. Seasonal Wind Rose Matrix */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Seasonal Wind Rose Vectors & Oceanic Breezes</h3>
              <p className="text-[11px] text-slate-500">Directional vectors and thermal comfort across the 4 seasons.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {windRosePatterns.map((pattern: any, idx: number) => (
            <div key={idx} className="p-4 rounded-2xl bg-[#F7F8F5] border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-900">{pattern.season.split(' ')[0]}</span>
                <span className="font-mono text-[10px] font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-full">
                  {pattern.avgSpeedKnots} Knots
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Prevailing Wind:</span>
                <span className="font-mono font-bold text-slate-800">{pattern.prevailingDirection}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug pt-1 border-t border-slate-200/60">
                {pattern.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Natural Weather Shielding Summary */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldCheck className="w-4 h-4 text-[#00635C]" />
          <h3 className="text-sm font-bold text-slate-900">Natural Storm Buffers & Topographic Shielding</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#F7F8F5] p-4 rounded-2xl border border-slate-100 space-y-1">
            <span className="font-extrabold text-slate-900 block">Barrier Island Wave Buffer</span>
            <p className="text-slate-500 text-[11px]">
              Masonboro Island and Wrightsville Beach absorb 100% of open Atlantic wave energy {stormProtectionShielding.surroundingBarrierIslandBufferMiles} miles east.
            </p>
          </div>
          <div className="bg-[#F7F8F5] p-4 rounded-2xl border border-slate-100 space-y-1">
            <span className="font-extrabold text-slate-900 block">Evergreen Maritime Canopy</span>
            <p className="text-slate-500 text-[11px]">
              Dense stands of mature live oaks and longleaf pines disperse gust velocity, buffering the lanai and roofline.
            </p>
          </div>
          <div className="bg-[#F7F8F5] p-4 rounded-2xl border border-slate-100 space-y-1">
            <span className="font-extrabold text-slate-900 block">Topographic Surge Clearance</span>
            <p className="text-slate-500 text-[11px]">
              High coastal ridge elevation places the finished floor +24.5ft above any historic hurricane storm surge level.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
