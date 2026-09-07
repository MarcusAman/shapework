/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * GolfCourseSpatialView: Golf Course Hole-by-Hole Buffer & Errant Ball Trajectory Heatmap
 * Country club fairway positioning (Landfall Dye/Nicklaus), tee-to-green distance,
 * lateral clearance buffers, errant shot slice dispersion physics, and pine tree canopy shielding.
 */

import React, { useState, useEffect } from 'react';
import { 
  Flag, Target, ShieldCheck, Trees, Compass, MapPin, 
  Sparkles, CheckCircle2, ArrowRight, Eye, Layers, Activity
} from 'lucide-react';
import { LuxuryPropertyComp, PropertyCompsRepository } from '../../../server/persistence/propertyCompsRepository';
import { useToast } from '../ui';

interface GolfCourseSpatialViewProps {
  subjectProperty: LuxuryPropertyComp;
}

export const GolfCourseSpatialView: React.FC<GolfCourseSpatialViewProps> = ({
  subjectProperty
}) => {
  const { toast } = useToast();
  const [golfData, setGolfData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/comps/golf-course/${subjectProperty.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.golfProfile) {
          setGolfData(data.golfProfile);
        } else {
          setGolfData(PropertyCompsRepository.getGolfCourseProfile(subjectProperty.id));
        }
      })
      .catch(() => {
        setGolfData(PropertyCompsRepository.getGolfCourseProfile(subjectProperty.id));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [subjectProperty.id]);

  if (loading || !golfData) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center text-slate-500 font-bold animate-pulse border border-slate-200">
        Analyzing golf fairway geometry, landing zone physics & errant shot trajectory...
      </div>
    );
  }

  const { courseDetails, fairwayGeometry, errantBallRiskAssessment, protectiveCanopyAndGlass, clubhouseAndAmenitiesProximity } = golfData;

  return (
    <div className="w-full space-y-6 text-left font-sans animate-fadeIn">
      
      {/* 1. Master Golf Course Header Banner */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
              <Flag className="w-3 h-3 text-[#00635C]" /> Country Club Fairway Spatial Intelligence
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">{courseDetails.courseName}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Hole #{courseDetails.holeNumber} Fairway Buffer & Errant Shot Heatmap
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hole geometry analysis, landing zone cone, errant shot slice dispersion physics, and mature longleaf pine canopy shielding.
          </p>
        </div>

        {/* Safety Score Badge */}
        <div className="bg-[#F7F8F5] border border-emerald-200 p-5 rounded-3xl text-right shrink-0">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Errant Ball Exposure Index
          </span>
          <div className="text-3xl sm:text-4xl font-black text-[#00635C] font-mono mt-0.5">
            {errantBallRiskAssessment.overallRiskScore}<span className="text-sm font-normal text-slate-500">/100</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-800 block mt-1">
            {errantBallRiskAssessment.riskCategory}
          </span>
        </div>
      </div>

      {/* 2. Key Fairway Dimensions Strip */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Lateral Clearance
          </span>
          <div className="text-lg font-black text-[#00635C] font-mono mt-0.5">
            {fairwayGeometry.lateralDistanceFromFairwayCenterlineFeet} Feet
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            +35ft Beyond 110ft Safe Limit
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Landing Zone Distance
          </span>
          <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
            {fairwayGeometry.distanceFromChampionshipTeesYards} Yards
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Primary Driver Landing Apex
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Elevation Above Fairway
          </span>
          <div className="text-lg font-black text-emerald-800 font-mono mt-0.5">
            +{fairwayGeometry.elevationAboveFairwayFeet} Feet
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Panoramic Deflection Grade
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Errant Ball Incidence
          </span>
          <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
            {errantBallRiskAssessment.annualErrantBallIncidenceEst}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Virtually Zero Direct Exposure
          </span>
        </div>
      </div>

      {/* 3. Fairway & Errant Trajectory Schematic Visualizer */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              <Target className="w-4 h-4 text-[#00635C]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Hole #{courseDetails.holeNumber} Architectural Schematic & Trajectory Cones</h3>
              <p className="text-[11px] text-slate-500">Par {courseDetails.par} • {courseDetails.holeYardage} Yards • {courseDetails.holeShape}</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Left Perimeter Safe Zone
          </span>
        </div>

        {/* 2D Vector Fairway Schematic */}
        <div className="relative w-full h-64 sm:h-80 bg-stone-900 rounded-2xl overflow-hidden border border-slate-300 p-4 flex flex-col justify-between text-white select-none">
          {/* Background Green & Rough Grass */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 opacity-90" />

          {/* Fairway Contour SVG */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 400">
            {/* Conservation Water Lagoon */}
            <path d="M 400 220 Q 550 280 700 350 L 800 400 L 400 400 Z" fill="#0891b2" opacity="0.35" />
            
            {/* Fairway Green Ribbon */}
            <path d="M 50 180 Q 250 160 400 190 T 720 220 L 720 270 Q 400 240 250 210 T 50 230 Z" fill="#059669" opacity="0.75" />
            
            {/* Fairway Centerline */}
            <path d="M 50 205 Q 250 185 400 215 T 720 245" fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />

            {/* Errant Slice Dispersion Cone (To the Right / Water Hazard) */}
            <path d="M 50 205 L 450 320 L 450 240 Z" fill="#f43f5e" opacity="0.15" />

            {/* Subject Property Lot Footprint (Left Side - Safe Zone) */}
            <rect x="320" y="30" width="160" height="90" rx="8" fill="#00635C" stroke="#34d399" strokeWidth="2" opacity="0.85" />
            
            {/* Buffer Line */}
            <line x1="400" y1="120" x2="400" y2="200" stroke="#facc15" strokeWidth="2" strokeDasharray="4 4" />
          </svg>

          {/* Top Overlays */}
          <div className="relative z-10 flex justify-between items-start text-xs font-mono">
            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <span>Tee Box: 0 Yds (Championship)</span>
            </div>

            {/* Subject Property Label */}
            <div className="bg-[#00635C] text-white px-3.5 py-1.5 rounded-xl font-bold shadow-lg border border-emerald-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>1104 Arboretum Way (145ft Clearance)</span>
            </div>

            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1">
              <Flag className="w-3.5 h-3.5 text-rose-400" />
              <span>Pin / Green: 415 Yds</span>
            </div>
          </div>

          {/* Bottom Trajectory Physics Legend */}
          <div className="relative z-10 flex flex-wrap justify-between items-end gap-2 text-[11px] bg-black/70 backdrop-blur-md p-3 rounded-xl border border-white/10 font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Fairway Center
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> 88% Slice Cone (Right)
              </span>
              <span className="flex items-center gap-1 text-amber-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> 145ft Lateral Safety Buffer
              </span>
            </div>

            <span className="text-emerald-300 font-bold">
              Protected by Left Dogleg Geometry
            </span>
          </div>
        </div>
      </div>

      {/* 4. Natural Vegetative Canopy & Protective Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Vegetative Screen & Trajectory Physics */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Trees className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">Canopy Shielding & Trajectory Physics</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Mature Pine Screen:</span>
              <span className="font-bold text-slate-900">{protectiveCanopyAndGlass.maturePineScreenCount} Specimen 50ft Longleaf Pines</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Slice vs Hook Dispersion:</span>
              <span className="font-bold text-emerald-800">88% of amateur drives slice right away from lot</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Cart Path Orientation:</span>
              <span className="font-bold text-slate-900">{errantBallRiskAssessment.cartPathLocation}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-600">Impact Glass Certification:</span>
              <span className="font-bold text-slate-800">{protectiveCanopyAndGlass.windowGlassImpactRating}</span>
            </div>
          </div>
        </div>

        {/* Country Club Logistics & Amenities */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Flag className="w-4 h-4 text-[#00635C]" />
            <h3 className="text-sm font-bold text-slate-900">Country Club Proximity & Cart Trail Access</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Distance to Pete Dye Clubhouse:</span>
              <span className="font-mono font-bold text-slate-900">{clubhouseAndAmenitiesProximity.distanceToDyeClubhouseMiles} Miles ({clubhouseAndAmenitiesProximity.cartTransitTimeMinutes} Mins by Cart)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Distance to Practice Range:</span>
              <span className="font-mono font-bold text-slate-900">{clubhouseAndAmenitiesProximity.distanceToPracticeRangeAndShortGameMiles} Miles</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Golf Cart Trail Access:</span>
              <span className="font-bold text-emerald-800">{clubhouseAndAmenitiesProximity.directCartTrailAccess}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-600">Play Hours & Maintenance Buffer:</span>
              <span className="font-bold text-slate-800">{protectiveCanopyAndGlass.hoaCourseHours}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
