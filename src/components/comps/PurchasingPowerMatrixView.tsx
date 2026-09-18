/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PurchasingPowerMatrixView: High-Net-Worth Jumbo Mortgage & Buyer Purchasing Power Engine
 * Interest Rate Sensitivity Spectrum (5.75% - 7.25%), Down Payment Tiers (10%, 20%, 30%, Cash),
 * Itemized Monthly Housing Escrow, and Net Cash-to-Close Settlement Sheet.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, Calculator, TrendingDown, ShieldCheck, Home, 
  Percent, ArrowRight, CheckCircle2, Sliders, Info, Sparkles, Building2, Wallet
} from 'lucide-react';
import { LuxuryPropertyComp, PropertyCompsRepository } from '../../../server/persistence/propertyCompsRepository';
import { useToast } from '../ui';

interface PurchasingPowerMatrixViewProps {
  subjectProperty: LuxuryPropertyComp;
}

export const PurchasingPowerMatrixView: React.FC<PurchasingPowerMatrixViewProps> = ({
  subjectProperty
}) => {
  const { toast } = useToast();
  const [interestRate, setInterestRate] = useState<number>(6.25);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [loanTermYears, setLoanTermYears] = useState<number>(30);
  const [matrixData, setMatrixData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch or calculate purchasing power matrix
  useEffect(() => {
    setLoading(true);
    fetch(`/api/comps/purchasing-power/${subjectProperty.id}?rate=${interestRate}&downPayment=${downPaymentPercent}&term=${loanTermYears}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.matrix) {
          setMatrixData(data.matrix);
        } else {
          setMatrixData(PropertyCompsRepository.calculatePurchasingPowerMatrix(subjectProperty.id, {
            customInterestRate: interestRate,
            customDownPaymentPercent: downPaymentPercent,
            loanTermYears
          }));
        }
      })
      .catch(() => {
        setMatrixData(PropertyCompsRepository.calculatePurchasingPowerMatrix(subjectProperty.id, {
          customInterestRate: interestRate,
          customDownPaymentPercent: downPaymentPercent,
          loanTermYears
        }));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [subjectProperty.id, interestRate, downPaymentPercent, loanTermYears]);

  // Custom Live Calculations for active slider values
  const activeCalculations = useMemo(() => {
    const price = subjectProperty.listPrice;
    const downPaymentAmount = Math.round(price * (downPaymentPercent / 100));
    const loanAmount = price - downPaymentAmount;
    const monthlyPI = PropertyCompsRepository.calculateMonthlyPI(loanAmount, interestRate, loanTermYears);
    
    // Escrow
    const annualTax = Math.round(price * 0.00555);
    const monthlyTax = Math.round(annualTax / 12);
    const monthlyInsurance = Math.round((matrixData?.escrowComponents?.annualInsurance || 5200) / 12);
    const monthlyHoa = matrixData?.escrowComponents?.monthlyHoaDues || 245;
    const monthlyPMI = downPaymentPercent < 20 ? Math.round((loanAmount * 0.0035) / 12) : 0;
    const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + monthlyHoa + monthlyPMI;

    // Cash to close
    const lenderFees = loanAmount > 0 ? 4500 : 1500;
    const attorneyFee = 1850;
    const prepaidInsurance = matrixData?.escrowComponents?.annualInsurance || 5200;
    const prepaidTax = Math.round(annualTax / 2);
    const totalClosingCosts = lenderFees + attorneyFee + prepaidInsurance + prepaidTax;
    const cashToClose = downPaymentAmount + totalClosingCosts;

    return {
      price,
      downPaymentAmount,
      loanAmount,
      monthlyPI,
      monthlyTax,
      monthlyInsurance,
      monthlyHoa,
      monthlyPMI,
      totalMonthly,
      totalClosingCosts,
      cashToClose
    };
  }, [subjectProperty.listPrice, downPaymentPercent, interestRate, loanTermYears, matrixData]);

  return (
    <div className="w-full space-y-6 text-left font-sans animate-fadeIn">
      
      {/* 1. Master Financial Summary Banner */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
              HNW Financial Underwriting
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">{subjectProperty.neighborhood}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Jumbo Mortgage & Buyer Purchasing Power Matrix
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Real-time interest rate sensitivity and luxury cash-to-close underwriting calibrated for New Hanover County tax rates and coastal flood/wind insurance.
          </p>
        </div>

        {/* Live Monthly Outlay Badge */}
        <div className="bg-[#F7F8F5] border border-slate-200 p-5 rounded-2xl text-right shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Estimated Total Monthly Outlay
          </span>
          <div className="text-3xl font-black text-[#00635C] font-mono mt-0.5">
            ${activeCalculations.totalMonthly.toLocaleString()}<span className="text-xs text-slate-500 font-normal">/mo</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Includes P&I (${activeCalculations.monthlyPI.toLocaleString()}), Taxes, Insurance & HOA
          </span>
        </div>
      </div>

      {/* 2. Interactive Underwriting Controls Bar */}
      <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Interest Rate Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-[#00635C]" />
              <span>Interest Rate (Jumbo Fixed):</span>
            </label>
            <span className="font-mono font-extrabold text-sm text-[#00635C]">{interestRate.toFixed(2)}%</span>
          </div>
          <input
            type="range"
            min={5.0}
            max={8.0}
            step={0.125}
            value={interestRate}
            onChange={(e) => setInterestRate(parseFloat(e.target.value))}
            className="w-full accent-[#00635C] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>5.00%</span>
            <span>6.25% Benchmark</span>
            <span>8.00%</span>
          </div>
        </div>

        {/* Down Payment Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Down Payment ({downPaymentPercent}%):</span>
            </label>
            <span className="font-mono font-extrabold text-sm text-emerald-700">
              ${activeCalculations.downPaymentAmount.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={downPaymentPercent}
            onChange={(e) => setDownPaymentPercent(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>10% (Jumbo)</span>
            <span>20% (Standard)</span>
            <span>100% (Cash)</span>
          </div>
        </div>

        {/* Loan Term Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">Loan Term Structure:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setLoanTermYears(30)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                loanTermYears === 30
                  ? 'bg-[#00635C] text-white shadow-xs'
                  : 'bg-[#F7F8F5] text-slate-600 hover:bg-slate-200'
              }`}
            >
              30-Year Fixed
            </button>
            <button
              type="button"
              onClick={() => setLoanTermYears(15)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                loanTermYears === 15
                  ? 'bg-[#00635C] text-white shadow-xs'
                  : 'bg-[#F7F8F5] text-slate-600 hover:bg-slate-200'
              }`}
            >
              15-Year Fixed
            </button>
          </div>
        </div>
      </div>

      {/* 3. Interest Rate Sensitivity Spectrum Table */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#00635C] flex items-center justify-center font-bold text-xs">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Interest Rate Sensitivity Grid (20% Down Benchmark)</h3>
              <p className="text-[11px] text-slate-500">Evaluates monthly P&I across 25 bps rate increments on ${Math.round(subjectProperty.listPrice * 0.8).toLocaleString()} loan.</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-2">Interest Rate</th>
                <th className="pb-2">Monthly P&I</th>
                <th className="pb-2">Taxes & Insurance</th>
                <th className="pb-2">Total Monthly Outlay</th>
                <th className="pb-2">Annual Debt Service</th>
                <th className="pb-2">Rate Delta vs 6.25%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {matrixData?.rateTiers?.map((tier: any) => {
                const isSelected = Math.abs(tier.ratePercent - interestRate) < 0.01;
                return (
                  <tr 
                    key={tier.ratePercent}
                    className={`transition cursor-pointer ${
                      isSelected ? 'bg-emerald-50/90 font-bold' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setInterestRate(tier.ratePercent)}
                  >
                    <td className="py-3 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{tier.ratePercent.toFixed(2)}%</span>
                      {tier.ratePercent === 6.25 && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                          Benchmark
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[#00635C] text-white">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 font-mono font-extrabold text-[#00635C]">
                      ${tier.monthlyPI.toLocaleString()}
                    </td>
                    <td className="py-3 font-mono text-slate-500">
                      ${(activeCalculations.monthlyTax + activeCalculations.monthlyInsurance + activeCalculations.monthlyHoa).toLocaleString()}
                    </td>
                    <td className="py-3 font-mono font-black text-slate-900">
                      ${tier.totalMonthlyOutlay.toLocaleString()}
                    </td>
                    <td className="py-3 font-mono text-slate-600">
                      ${tier.annualDebtService.toLocaleString()}
                    </td>
                    <td className="py-3 font-mono">
                      {tier.monthlySavingsVsBaseline > 0 ? (
                        <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                          -${tier.monthlySavingsVsBaseline.toLocaleString()}/mo (${(tier.monthlySavingsVsBaseline * 12).toLocaleString()}/yr)
                        </span>
                      ) : tier.monthlySavingsVsBaseline < 0 ? (
                        <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                          +${Math.abs(tier.monthlySavingsVsBaseline).toLocaleString()}/mo
                        </span>
                      ) : (
                        <span className="text-slate-400">Baseline</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Down Payment Scenario Matrix (10%, 20%, 30%, Cash) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {matrixData?.downPaymentTiers?.map((tier: any, idx: number) => {
          const isSelected = downPaymentPercent === tier.downPaymentPercent;
          return (
            <div
              key={idx}
              onClick={() => setDownPaymentPercent(tier.downPaymentPercent)}
              className={`bg-white border rounded-3xl p-5 shadow-xs space-y-3 transition cursor-pointer ${
                isSelected 
                  ? 'border-[#00635C] ring-2 ring-[#00635C]/20 shadow-md bg-emerald-50/30' 
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {tier.downPaymentPercent}% Down
                </span>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-[#00635C]" />
                )}
              </div>

              <div>
                <h4 className="text-xs font-extrabold text-slate-900">{tier.tierLabel}</h4>
                <div className="text-lg font-black text-[#00635C] font-mono mt-0.5">
                  ${tier.totalMonthlyHousingOutlay.toLocaleString()}<span className="text-[10px] text-slate-400 font-normal">/mo</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
                <div className="flex justify-between text-slate-500">
                  <span>Down Payment:</span>
                  <span className="font-mono font-bold text-slate-800">${tier.downPaymentAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Loan Amount:</span>
                  <span className="font-mono font-bold text-slate-800">${tier.loanAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Monthly P&I:</span>
                  <span className="font-mono font-bold text-[#00635C]">${tier.monthlyPI.toLocaleString()}</span>
                </div>
                {tier.monthlyPMI > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>PMI Premium:</span>
                    <span className="font-mono font-bold">+${tier.monthlyPMI}/mo</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-100">
                  <span className="font-bold text-slate-700">Cash to Close:</span>
                  <span className="font-mono font-extrabold text-emerald-800">${tier.netCashToClose.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Itemized Escrow Breakdown & Cash-to-Close Settlement Sheet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Itemized Monthly Escrow */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Home className="w-4 h-4 text-[#00635C]" />
            <h3 className="text-sm font-bold text-slate-900">Itemized Monthly Housing Outlay</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Principal & Interest ({interestRate}% on ${activeCalculations.loanAmount.toLocaleString()}):</span>
              <span className="font-mono font-extrabold text-slate-900">${activeCalculations.monthlyPI.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">New Hanover County & City Taxes ($0.555/$100):</span>
              <span className="font-mono font-bold text-slate-800">${activeCalculations.monthlyTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Coastal Hazard, Wind & Hail Insurance:</span>
              <span className="font-mono font-bold text-slate-800">${activeCalculations.monthlyInsurance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Landfall Master Association HOA Dues:</span>
              <span className="font-mono font-bold text-slate-800">${activeCalculations.monthlyHoa.toLocaleString()}</span>
            </div>
            {activeCalculations.monthlyPMI > 0 && (
              <div className="flex justify-between py-1.5 border-b border-slate-100 text-amber-700 font-bold">
                <span>Private Mortgage Insurance (PMI &lt; 20% down):</span>
                <span className="font-mono">+${activeCalculations.monthlyPMI.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 text-sm font-extrabold text-[#00635C]">
              <span>Total Monthly Housing Cost:</span>
              <span className="font-mono font-black">${activeCalculations.totalMonthly.toLocaleString()}/mo</span>
            </div>
          </div>
        </div>

        {/* Net Cash to Close Settlement Sheet */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Estimated Cash-to-Close Settlement Sheet</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Required Down Payment ({downPaymentPercent}%):</span>
              <span className="font-mono font-bold text-slate-900">${activeCalculations.downPaymentAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Closing Attorney & Title Examination:</span>
              <span className="font-mono font-bold text-slate-800">$1,850</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Lender Underwriting & Appraisal Fees:</span>
              <span className="font-mono font-bold text-slate-800">${activeCalculations.loanAmount > 0 ? '$4,500' : '$1,500'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">12-Month Prepaid Coastal Hazard & Flood Policy:</span>
              <span className="font-mono font-bold text-slate-800">${(matrixData?.escrowComponents?.annualInsurance || 5200).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">6-Month Property Tax Escrow Reserve:</span>
              <span className="font-mono font-bold text-slate-800">${Math.round(subjectProperty.listPrice * 0.00555 / 2).toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 text-sm font-extrabold text-emerald-800">
              <span>Total Estimated Cash to Close:</span>
              <span className="font-mono font-black">${activeCalculations.cashToClose.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
