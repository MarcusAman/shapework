/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CoastalRiskIntelligenceView: FEMA Flood Zone, Coastal Elevation & Insurance Risk Intelligence
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Waves, CloudRain, 
  DollarSign, ArrowUpRight, CheckCircle2, AlertTriangle, 
  MapPin, Clock, Copy, RefreshCw, Layers, Compass
} from 'lucide-react';
import { LuxuryPropertyComp, PropertyCompsRepository } from '../../../server/persistence/propertyCompsRepository';
import { useToast } from '../ui';

interface CoastalRiskIntelligenceViewProps {
  subjectProperty: LuxuryPropertyComp;
}

export const CoastalRiskIntelligenceView: React.FC<CoastalRiskIntelligenceViewProps> = ({
  subjectProperty
}) => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRiskProfile = () => {
    setLoading(true);
    fetch(`/api/comps/flood-risk/${subjectProperty.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.riskProfile) {
          setProfile(data.riskProfile);
        } else {
          setProfile(PropertyCompsRepository.getCoastalRiskProfile(subjectProperty.id));
        }
      })
      .catch(() => {
        setProfile(PropertyCompsRepository.getCoastalRiskProfile(subjectProperty.id));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRiskProfile();
  }, [subjectProperty.id]);

  const handleCopyBrief = () => {
    if (!profile) return;
    const text = `🌊 COASTAL ELEVATION & FLOOD RISK BRIEF: ${subjectProperty.propertyAddress.split(',')[0]}
FEMA Flood Zone: ${profile.femaFloodZone}
Flood Insurance Mandatory: ${profile.isFloodInsuranceMandatory ? 'YES (SFHA Zone AE)' : 'NO (Zone X - Preferred)'}
Ground Elevation: ${profile.groundElevationFeet} ft MSL (Base Flood Elevation: ${profile.baseFloodElevationFeet} ft MSL)
Freeboard Safety Margin: ${profile.freeboardMarginFeet >= 0 ? '+' : ''}${profile.freeboardMarginFeet} ft above BFE
Storm Surge Evacuation Zone: ${profile.evacuationZone}

ESTIMATED ANNUAL INSURANCE BENCHMARKS:
• Homeowners Hazard: $${profile.insuranceEstimates.homeownersHazardAnnual.toLocaleString()}/yr
• NC Wind & Hail Beach Plan: $${profile.insuranceEstimates.windAndHailBeachPlanAnnual.toLocaleString()}/yr
• NFIP Flood Insurance: $${profile.insuranceEstimates.floodInsuranceNfipAnnual.toLocaleString()}/yr
TOTAL ANNUAL INSURANCE: $${profile.insuranceEstimates.totalAnnualInsurance.toLocaleString()}/yr ($${profile.insuranceEstimates.monthlyInsuranceEscrow}/mo escrow)

KEY LIFESTYLE DRIVE TIMES:
${profile.lifestyleLandmarks.map((lm: any) => `• ${lm.name}: ${lm.driveTimeMinutes} min (${lm.distanceMiles} mi)`).join('\n')}`;

    navigator.clipboard.writeText(text);
    toast.success({
      title: 'Insurance Brief Copied',
      description: 'Formatted coastal risk brief copied to clipboard for lender/buyer review!'
    });
  };

  if (loading || !profile) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500 animate-pulse font-sans">
        Analyzing FEMA flood zone maps, coastal elevation contours, and NC insurance benchmarks...
      </div>
    );
  }

  const isZoneX = profile.femaFloodZone.includes('Zone X');

  return (
    <div className="space-y-6 text-left font-sans animate-fadeIn">
      
      {/* 1. Header Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              isZoneX ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-amber-100 text-amber-900 border-amber-300'
            }`}>
              {isZoneX ? 'Zone X • Minimal Risk' : 'Zone AE • Special Flood Hazard'}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Elevation: {profile.groundElevationFeet} ft MSL
            </span>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-2">
            <Waves className="w-5 h-5 text-[#00635C]" />
            Coastal Elevation, FEMA Flood Risk & Insurance Intelligence
          </h3>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyBrief}
            className="px-3.5 py-1.5 rounded-xl bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Insurance Brief</span>
          </button>
        </div>
      </div>

      {/* 2. Key Flood & Elevation Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* FEMA Zone */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            FEMA Flood Zone
          </span>
          <div className="text-xl font-black text-[#00635C]">
            {isZoneX ? 'Zone X (Low Risk)' : 'Zone AE (Coastal)'}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {profile.isFloodInsuranceMandatory ? 'Mandatory Flood Policy' : 'No Federal Mandate (Savings)'}
          </span>
        </div>

        {/* Ground Elevation */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Ground Elevation
          </span>
          <div className="text-xl font-black text-emerald-700">
            {profile.groundElevationFeet} Feet MSL
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            BFE: {profile.baseFloodElevationFeet} ft ({profile.freeboardMarginFeet >= 0 ? '+' : ''}{profile.freeboardMarginFeet} ft Freeboard)
          </span>
        </div>

        {/* Storm Surge Risk */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Surge & Evac Zone
          </span>
          <div className="text-xl font-black text-slate-900">
            {profile.evacuationZone.split(' ')[0]} {profile.evacuationZone.split(' ')[1]}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {profile.stormSurgeRiskLevel} Surge Risk
          </span>
        </div>

        {/* Total Annual Insurance */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Est. Total Insurance
          </span>
          <div className="text-xl font-black text-amber-900 font-mono">
            ${profile.insuranceEstimates.totalAnnualInsurance.toLocaleString()}/yr
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            ${profile.insuranceEstimates.monthlyInsuranceEscrow}/mo Escrow
          </span>
        </div>
      </div>

      {/* 3. Itemized Coastal Insurance Benchmark Sheet */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Itemized Coastal Property Insurance Benchmark Sheet
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Reconciled quotes based on local Wilmington & Coastal NC insurance carriers
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
            Valuation Basis: ${subjectProperty.listPrice.toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          
          {/* Hazard */}
          <div className="bg-[#F7F8F5] border border-slate-200/80 rounded-2xl p-4 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              1. Homeowners Hazard (Fire/Liability)
            </span>
            <div className="text-xl font-black text-slate-900 font-mono">
              ${profile.insuranceEstimates.homeownersHazardAnnual.toLocaleString()}/yr
            </div>
            <p className="text-[11px] text-slate-500">
              Standard HO-3 coverage for structural replacement and interior finishes.
            </p>
          </div>

          {/* Wind & Hail */}
          <div className="bg-[#F7F8F5] border border-slate-200/80 rounded-2xl p-4 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              2. NC Wind & Hail (Beach Plan)
            </span>
            <div className="text-xl font-black text-slate-900 font-mono">
              ${profile.insuranceEstimates.windAndHailBeachPlanAnnual.toLocaleString()}/yr
            </div>
            <p className="text-[11px] text-slate-500">
              NC Underwriting Association coastal windstorm and named tropical storm rider.
            </p>
          </div>

          {/* Flood Insurance */}
          <div className="bg-[#F7F8F5] border border-slate-200/80 rounded-2xl p-4 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              3. NFIP / Private Flood Policy
            </span>
            <div className="text-xl font-black text-[#00635C] font-mono">
              ${profile.insuranceEstimates.floodInsuranceNfipAnnual.toLocaleString()}/yr
            </div>
            <p className="text-[11px] text-slate-500">
              {isZoneX ? 'Optional preferred risk policy (Zone X savings applied).' : 'Federally required for conforming and jumbo mortgage underwriting.'}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Coastal Lifestyle Proximity & Commute Matrix */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-slate-900">
          Coastal Lifestyle Landmarks & Drive-Time Proximity
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {profile.lifestyleLandmarks.map((lm: any) => (
            <div key={lm.id} className="bg-[#F7F8F5] border border-slate-200/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span className="text-base">{lm.icon}</span> {lm.name.split(' ')[0]}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {lm.driveTimeMinutes} Min ({lm.distanceMiles} mi)
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-snug">
                {lm.highlight}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Underwriting Notes */}
      <div className="bg-[#F7F8F5] border border-slate-200/80 rounded-2xl p-4 space-y-1.5 text-xs text-slate-600">
        <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
          Mortgage Underwriting & Risk Rationale:
        </span>
        {profile.riskSummaryNotes.map((note: string, idx: number) => (
          <p key={idx} className="leading-snug">
            • {note}
          </p>
        ))}
      </div>
    </div>
  );
};
