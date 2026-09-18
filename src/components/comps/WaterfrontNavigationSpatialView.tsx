/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WaterfrontNavigationSpatialView: Waterfront, Boat Slip & Deepwater Navigation Corridor Analyzer
 * Mean Low Water (5.5ft MLW) / Mean High Water (9.8ft MHW) tidal depths, 24,000 lb boat lift capacity,
 * CAMA major dock permit compliance, and navigation transit times to Masonboro Inlet & Wrightsville Beach.
 */

import React, { useState, useEffect } from 'react';
import { 
  Anchor, Waves, Navigation, ShieldCheck, Compass, MapPin, 
  Sparkles, CheckCircle2, ArrowRight, Gauge, Clock, Ruler, Zap
} from 'lucide-react';
import { LuxuryPropertyComp, PropertyCompsRepository } from '../../../server/persistence/propertyCompsRepository';
import { useToast } from '../ui';

interface WaterfrontNavigationSpatialViewProps {
  subjectProperty: LuxuryPropertyComp;
}

export const WaterfrontNavigationSpatialView: React.FC<WaterfrontNavigationSpatialViewProps> = ({
  subjectProperty
}) => {
  const { toast } = useToast();
  const [navData, setNavData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/comps/waterfront-navigation/${subjectProperty.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.navProfile) {
          setNavData(data.navProfile);
        } else {
          setNavData(PropertyCompsRepository.getWaterfrontNavigationProfile(subjectProperty.id));
        }
      })
      .catch(() => {
        setNavData(PropertyCompsRepository.getWaterfrontNavigationProfile(subjectProperty.id));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [subjectProperty.id]);

  if (loading || !navData) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center text-slate-500 font-bold animate-pulse border border-slate-200">
        Loading tidal bathymetry, boat lift engineering & navigation corridor routes...
      </div>
    );
  }

  const { waterwayLocation, tidalBathymetry, dockAndLiftSpecifications, navigationCorridor, bridgeAndClearanceRestrictions } = navData;

  return (
    <div className="w-full space-y-6 text-left font-sans animate-fadeIn">
      
      {/* 1. Master Waterfront Banner */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-900 border border-cyan-300 flex items-center gap-1">
              <Anchor className="w-3 h-3 text-cyan-700" /> Deepwater Marine Intelligence
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">{waterwayLocation.icwMileMarker}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Waterfront, Boat Slip & Deepwater Navigation Corridor
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            All-tide bathymetry, 24,000 lb boat lift engineering, verified NC CAMA dock permits, and direct ocean navigation to Masonboro Inlet.
          </p>
        </div>

        {/* Low Tide Depth Badge */}
        <div className="bg-[#F7F8F5] border border-cyan-200 p-5 rounded-3xl text-right shrink-0">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Mean Low Water Depth (MLW)
          </span>
          <div className="text-3xl sm:text-4xl font-black text-cyan-800 font-mono mt-0.5">
            {tidalBathymetry.meanLowWaterDepthFeet} <span className="text-sm font-normal text-slate-500">Feet</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-800 block mt-1">
            All-Tide Navigable (Max Draft {tidalBathymetry.maxDraftRecommendedFeet}ft)
          </span>
        </div>
      </div>

      {/* 2. Key Marine Dimensions Strip */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Boat Lift Capacity
          </span>
          <div className="text-lg font-black text-[#00635C] font-mono mt-0.5">
            {(dockAndLiftSpecifications.boatLiftWeightCapacityLbs / 1000).toFixed(0)}k Lbs
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            4-Post Heavy-Duty Aluminum
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Max Vessel Length
          </span>
          <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
            {dockAndLiftSpecifications.maxVesselLengthFeet} Feet
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Sportfish / Center Console
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Masonboro Inlet Transit
          </span>
          <div className="text-lg font-black text-cyan-800 font-mono mt-0.5">
            {navigationCorridor.transitToMasonboroInletMinutes} Minutes
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            3.2 NM to Open Atlantic
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Fixed Bridge Limits
          </span>
          <div className="text-lg font-black text-emerald-800 font-mono mt-0.5">
            None (0)
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Unrestricted Ocean Clearance
          </span>
        </div>
      </div>

      {/* 3. Bathymetry & Tidal Swing Diagram */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs">
              <Waves className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tidal Bathymetry & Navigational Draft Clearance</h3>
              <p className="text-[11px] text-slate-500">{waterwayLocation.tideStation}</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 px-3 py-1 rounded-full">
            Tidal Swing: {tidalBathymetry.averageTidalSwingFeet} Feet
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#F7F8F5] border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Low Tide (MLW)</span>
            <div className="text-xl font-black text-cyan-900 font-mono">{tidalBathymetry.meanLowWaterDepthFeet} Feet</div>
            <span className="text-[11px] text-slate-500 block">Lowest annual tide clearance</span>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 block">High Tide (MHW)</span>
            <div className="text-xl font-black text-cyan-900 font-mono">{tidalBathymetry.meanHighWaterDepthFeet} Feet</div>
            <span className="text-[11px] text-slate-500 block">Deepwater floating dock elevation</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F8F5] border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Channel Bottom Composition</span>
            <div className="text-sm font-extrabold text-slate-900">{tidalBathymetry.bottomComposition}</div>
            <span className="text-[11px] text-slate-500 block">Scoured saltwater flow with no silting</span>
          </div>
        </div>
      </div>

      {/* 4. Dock Engineering, Boat Lift Specs & Navigation Routes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Pier & Boat Lift Engineering */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Anchor className="w-4 h-4 text-[#00635C]" />
            <h3 className="text-sm font-bold text-slate-900">Pier, Boat Lift & CAMA Compliance</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Pier & Dock Structure:</span>
              <span className="font-bold text-slate-900">{dockAndLiftSpecifications.pierLengthFeet}ft Ipe Decking + {dockAndLiftSpecifications.floatingDockDimensions}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Primary Boat Lift:</span>
              <span className="font-bold text-emerald-800">{dockAndLiftSpecifications.boatLiftType} ({dockAndLiftSpecifications.boatLiftWeightCapacityLbs.toLocaleString()} lbs)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">PWC Jet Ski Lifts:</span>
              <span className="font-bold text-slate-900">{dockAndLiftSpecifications.pwcLiftsCount}x Golden Lifts ({dockAndLiftSpecifications.pwcLiftCapacityLbs} lbs each)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Slip Utilities:</span>
              <span className="font-bold text-slate-800">{dockAndLiftSpecifications.slipUtilities}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-600">NC CAMA Permit Status:</span>
              <span className="font-mono font-bold text-[#00635C]">{dockAndLiftSpecifications.camaPermitNumber} (Verified)</span>
            </div>
          </div>
        </div>

        {/* Navigation Corridor & Inlet Routes */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Navigation className="w-4 h-4 text-cyan-700" />
            <h3 className="text-sm font-bold text-slate-900">Navigation Corridor & Ocean Transit Times</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Masonboro Inlet (Open Ocean):</span>
              <span className="font-mono font-bold text-cyan-800">{navigationCorridor.transitToMasonboroInletMinutes} Mins ({navigationCorridor.distanceToMasonboroInletNauticalMiles} NM)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Wrightsville Beach Docks:</span>
              <span className="font-mono font-bold text-slate-900">{navigationCorridor.transitToWrightsvilleBeachDocksMinutes} Mins (1.8 NM)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Masonboro Island Sandbar:</span>
              <span className="font-mono font-bold text-slate-900">{navigationCorridor.transitToMasonboroIslandSandbarMinutes} Mins (1.2 NM)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Overhead Power Clearance:</span>
              <span className="font-mono font-bold text-emerald-800">{bridgeAndClearanceRestrictions.overheadPowerLinesClearanceFeet} Feet (Sailboat Mast Safe)</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-600">Heide Trask Drawbridge:</span>
              <span className="font-bold text-slate-800">{bridgeAndClearanceRestrictions.heideTraskSchedule}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
