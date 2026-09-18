/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TaxAndPermitsView: Historical Permitting & Tax Assessment Intelligence Console
 * 5-Year County Assessment Progression, Verified Municipal Building Permits Ledger,
 * Documented Capital Improvements ($155.5k), and Submarket Effective Tax Benchmarks.
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, ShieldCheck, CheckCircle2, TrendingUp, DollarSign, 
  Calendar, Wrench, Building2, MapPin, Award, Check, Clock, Info, Hammer
} from 'lucide-react';
import { LuxuryPropertyComp, PropertyCompsRepository } from '../../../server/persistence/propertyCompsRepository';
import { useToast } from '../ui';

interface TaxAndPermitsViewProps {
  subjectProperty: LuxuryPropertyComp;
}

export const TaxAndPermitsView: React.FC<TaxAndPermitsViewProps> = ({
  subjectProperty
}) => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/comps/tax-and-permits/${subjectProperty.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.profile) {
          setProfile(data.profile);
        } else {
          setProfile(PropertyCompsRepository.getTaxAndPermitProfile(subjectProperty.id));
        }
      })
      .catch(() => {
        setProfile(PropertyCompsRepository.getTaxAndPermitProfile(subjectProperty.id));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [subjectProperty.id]);

  if (loading || !profile) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center text-slate-500 font-bold animate-pulse border border-slate-200">
        Loading New Hanover County tax assessments & verified municipal permit records...
      </div>
    );
  }

  const { countyTaxRecord, buildingPermitsLedger, capitalImprovementsSummary, submarketTaxComparisons, mechanicalLifespanStatus } = profile;

  return (
    <div className="w-full space-y-6 text-left font-sans animate-fadeIn">
      
      {/* 1. Master Tax & Permitting Summary Banner */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#00635C]" /> Verified County Records
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">{countyTaxRecord.parcelId}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Historical Permitting & Tax Assessment Intelligence
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Verified {countyTaxRecord.countyName} GIS tax assessment history, municipal building permits ledger, and documented mechanical capital improvements.
          </p>
        </div>

        {/* Capital Upgrades Stat Badge */}
        <div className="bg-[#F7F8F5] border border-slate-200 p-5 rounded-2xl text-right shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Documented Capital Improvements
          </span>
          <div className="text-2xl sm:text-3xl font-black text-[#00635C] font-mono mt-0.5">
            +${capitalImprovementsSummary.totalInvestedSinceBuild.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            {capitalImprovementsSummary.majorUpgradesCount} Verified Permits • Est. Value Add +${capitalImprovementsSummary.estimatedValueAdd.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 2. Key Assessment Metrics Strip */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            2026 Total Assessed Value
          </span>
          <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
            ${countyTaxRecord.currentAssessedValue.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {countyTaxRecord.assessmentToMarketRatioPercent}% of Asking Price
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Land / Lot Assessment
          </span>
          <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
            ${countyTaxRecord.landAssessedValue.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {subjectProperty.lotAcres} Acres ({subjectProperty.neighborhood.split(' ')[0]})
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Improvements (Building)
          </span>
          <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
            ${countyTaxRecord.buildingAssessedValue.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {subjectProperty.heatedSqFt.toLocaleString()} Heated SqFt
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Effective Annual Property Tax
          </span>
          <div className="text-lg font-black text-[#00635C] font-mono mt-0.5">
            ${countyTaxRecord.totalAnnualTax.toLocaleString()}<span className="text-xs font-normal text-slate-500">/yr</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            ${(countyTaxRecord.totalAnnualTax / 12).toFixed(0)}/mo • ${countyTaxRecord.effectiveTaxRatePerHundred}/$100
          </span>
        </div>
      </div>

      {/* 3. 5-Year Historical Tax Assessment Progression */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#00635C] flex items-center justify-center font-bold text-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">5-Year County Assessment Progression (2022–2026)</h3>
              <p className="text-[11px] text-slate-500">Official revaluation records from New Hanover County Tax Administration.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {countyTaxRecord.historicalAssessments.map((rec: any) => {
            const isSelected = selectedYear === rec.taxYear;
            return (
              <div
                key={rec.taxYear}
                onClick={() => setSelectedYear(rec.taxYear)}
                className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                  isSelected 
                    ? 'bg-emerald-50/80 border-[#00635C] ring-2 ring-[#00635C]/20 shadow-sm' 
                    : 'bg-[#F7F8F5] border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">{rec.taxYear} Tax Year</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#00635C]" />
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Assessed Value:</span>
                  <div className="text-base font-black text-[#00635C] font-mono">
                    ${rec.totalAssessedValue.toLocaleString()}
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-slate-500 border-t border-slate-200/60 pt-2">
                  <div className="flex justify-between">
                    <span>Land:</span>
                    <span className="font-mono">${rec.landValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Building:</span>
                    <span className="font-mono">${rec.improvementValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-700 pt-1">
                    <span>Tax Paid:</span>
                    <span className="font-mono">${rec.annualTaxPaid.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Verified Municipal Building Permits Ledger */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
              <Hammer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Verified Municipal Building Permits & Capital Improvements</h3>
              <p className="text-[11px] text-slate-500">Documented scope of work, licensed general contractors, and closed inspections.</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600 bg-[#F7F8F5] px-3 py-1 rounded-xl border border-slate-200">
            {buildingPermitsLedger.length} Total Permits On File
          </span>
        </div>

        <div className="space-y-3">
          {buildingPermitsLedger.map((permit: any, idx: number) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-200 bg-[#F7F8F5] hover:bg-slate-100/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-900 text-white font-mono">
                    {permit.permitNumber}
                  </span>
                  <span className="text-xs font-bold text-[#00635C] bg-emerald-100 px-2 py-0.5 rounded-full">
                    {permit.category}
                  </span>
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" /> {permit.issueDate}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                  {permit.scopeOfWork}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Licensed Contractor: <strong className="text-slate-700">{permit.contractorName}</strong>
                </p>
              </div>

              {/* Cost & Inspection Badge */}
              <div className="flex md:flex-col items-center md:items-end justify-between gap-1 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-200">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Documented Cost:</span>
                  <span className="text-sm font-black text-slate-900 font-mono">
                    ${permit.estimatedCost.toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Passed Final
                </span>
                {permit.warrantyRemainingYears && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {permit.warrantyRemainingYears} Yrs Warranty Left
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Mechanical Lifespan & Submarket Tax Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Mechanical Systems Lifespan */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Wrench className="w-4 h-4 text-[#00635C]" />
            <h3 className="text-sm font-bold text-slate-900">Major Mechanical Systems & Warranty Status</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-[#F7F8F5] p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-slate-900 block">Standing Seam Metal Roof (2023)</span>
                <span className="text-[11px] text-slate-500">{mechanicalLifespanStatus.roofSystem.type}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-emerald-700 block">{mechanicalLifespanStatus.roofSystem.remainingLifeYears} Yrs Remaining</span>
                <span className="text-[10px] text-slate-500">{mechanicalLifespanStatus.roofSystem.condition}</span>
              </div>
            </div>

            <div className="bg-[#F7F8F5] p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-slate-900 block">Dual-Zone Trane Heat Pump (2024)</span>
                <span className="text-[11px] text-slate-500">{mechanicalLifespanStatus.hvacSystem.type}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-emerald-700 block">{mechanicalLifespanStatus.hvacSystem.remainingLifeYears} Yrs Remaining</span>
                <span className="text-[10px] text-slate-500">{mechanicalLifespanStatus.hvacSystem.condition}</span>
              </div>
            </div>

            <div className="bg-[#F7F8F5] p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-slate-900 block">Heated Saltwater Pool System (2021)</span>
                <span className="text-[11px] text-slate-500">{mechanicalLifespanStatus.poolSystem.type}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-emerald-700 block">{mechanicalLifespanStatus.poolSystem.remainingLifeYears} Yrs Remaining</span>
                <span className="text-[10px] text-slate-500">{mechanicalLifespanStatus.poolSystem.condition}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submarket Tax Rate Comparison */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">Wilmington Submarket Effective Tax Rates</h3>
          </div>

          <div className="space-y-2 text-xs">
            {submarketTaxComparisons.map((item: any, idx: number) => {
              const isCurrent = item.jurisdiction.includes(subjectProperty.neighborhood.split(' ')[0]);
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                    isCurrent 
                      ? 'bg-emerald-50/90 border-[#00635C] font-bold' 
                      : 'bg-[#F7F8F5] border-slate-200'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="text-xs font-bold text-slate-900 block truncate">{item.jurisdiction}</span>
                    <span className="text-[10px] text-slate-500 truncate block">{item.notes}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-[#00635C] text-xs block">${item.taxRatePerHundred}/$100</span>
                    <span className="font-mono text-[10px] text-slate-500">${item.annualTaxOnTargetPrice.toLocaleString()}/yr</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
