/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * LotTopographyAndSetbacksView: Subdivision Lot Topography, Setbacks & Elevation Viewer
 * Site Plan Dimensions (120x165ft), Municipal Building Envelope, Grading Slope %,
 * and Mature Tree Preservation Canopy.
 */

import React, { useState, useEffect } from 'react';
import { 
  Maximize2, Compass, Trees, ShieldCheck, CheckCircle2, 
  MapPin, Layers, Ruler, ArrowRight, Activity, Mountain
} from 'lucide-react';
import { LuxuryPropertyComp, PropertyCompsRepository } from '../../../server/persistence/propertyCompsRepository';
import { useToast } from '../ui';

interface LotTopographyAndSetbacksViewProps {
  subjectProperty: LuxuryPropertyComp;
}

export const LotTopographyAndSetbacksView: React.FC<LotTopographyAndSetbacksViewProps> = ({
  subjectProperty
}) => {
  const { toast } = useToast();
  const [topography, setTopography] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/comps/lot-topography/${subjectProperty.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.topography) {
          setTopography(data.topography);
        } else {
          setTopography(PropertyCompsRepository.getLotTopographyProfile(subjectProperty.id));
        }
      })
      .catch(() => {
        setTopography(PropertyCompsRepository.getLotTopographyProfile(subjectProperty.id));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [subjectProperty.id]);

  if (loading || !topography) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center text-slate-500 font-bold animate-pulse border border-slate-200">
        Loading lot engineering, setbacks & site topography...
      </div>
    );
  }

  const { lotDimensions, setbacks, buildableFootprintSqFt, topographyAndGrading, preservationCanopy } = topography;

  return (
    <div className="w-full space-y-6 text-left font-sans animate-fadeIn">
      
      {/* 1. Master Lot Topography Banner */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
              <Mountain className="w-3 h-3 text-[#00635C]" /> Lot Engineering & GIS Topography
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">{lotDimensions.shape}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Subdivision Lot Topography & Setback Overlay
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Architectural site plan dimensions, municipal setback building envelope, drainage grading slope, and mature tree canopy preservation.
          </p>
        </div>

        {/* Buildable Footprint Stat */}
        <div className="bg-[#F7F8F5] border border-slate-200 p-5 rounded-2xl text-right shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Max Buildable Envelope
          </span>
          <div className="text-3xl font-black text-[#00635C] font-mono mt-0.5">
            {buildableFootprintSqFt.toLocaleString()} <span className="text-xs text-slate-500 font-normal">SqFt</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            {lotDimensions.frontageFeet}ft Frontage × {lotDimensions.depthFeet}ft Depth ({lotDimensions.lotAcres} Acres)
          </span>
        </div>
      </div>

      {/* 2. Key Dimensions Strip */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Front Yard Setback
          </span>
          <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
            {setbacks.frontYardFeet} Feet
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Estate Street Buffer
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Side Yard Setbacks
          </span>
          <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
            {setbacks.sideYardLeftFeet}ft / {setbacks.sideYardRightFeet}ft
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            30ft Total Separation
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Rear Yard Setback
          </span>
          <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
            {setbacks.rearYardFeet} Feet
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Conservation & Lanai Buffer
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Impervious Coverage
          </span>
          <div className="text-lg font-black text-[#00635C] font-mono mt-0.5">
            {setbacks.currentImperviousSurfacePercent}% / {setbacks.maxImperviousSurfacePercent}%
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Compliant with NC Coastal Rules
          </span>
        </div>
      </div>

      {/* 3. Site Plan & Topography Engineering Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Topography & Drainage */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Activity className="w-4 h-4 text-[#00635C]" />
            <h3 className="text-sm font-bold text-slate-900">Grading, Elevation & Storm Drainage</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Site Elevation (High / Low):</span>
              <span className="font-mono font-bold text-slate-900">{topographyAndGrading.elevationHighPointFeet}ft / {topographyAndGrading.elevationLowPointFeet}ft above MSL</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Lot Grading Slope:</span>
              <span className="font-bold text-emerald-800">{topographyAndGrading.slopePercentage}% ({topographyAndGrading.slopeDirection})</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Stormwater Drainage:</span>
              <span className="font-bold text-slate-900">{topographyAndGrading.drainageFlow}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-600">Subsurface Soil Classification:</span>
              <span className="font-bold text-slate-800">{topographyAndGrading.soilType}</span>
            </div>
          </div>
        </div>

        {/* Tree Canopy & Preservation */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Trees className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">Tree Canopy & Environmental Preservation</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Mature Specimen Live Oaks:</span>
              <span className="font-bold text-slate-900">{preservationCanopy.matureLiveOaksCount} Verified Specimen Trees</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Coastal Longleaf Pines:</span>
              <span className="font-bold text-slate-900">{preservationCanopy.longleafPinesCount} Mature Canopy Pines</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Tree Canopy Shade Coverage:</span>
              <span className="font-mono font-bold text-emerald-800">{preservationCanopy.treeCanopyCoveragePercent}% Lot Shaded</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-600">Max Height Allowance:</span>
              <span className="font-bold text-slate-800">{setbacks.maxBuildingHeightFeet} Feet (3 Stories)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
