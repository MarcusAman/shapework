/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * MultiOfferMatrix: Competing Buyer Bidding War & Seller Net Proceeds Comparison Matrix
 */

import React, { useState, useEffect } from 'react';
import { 
  Award, DollarSign, ShieldCheck, CheckCircle2, AlertTriangle, 
  Plus, Users, Sparkles, TrendingUp, Calendar, Clock, ChevronRight, Copy, Printer, RefreshCw
} from 'lucide-react';
import { LuxuryPropertyComp, PropertyCompsRepository } from '../../../server/persistence/propertyCompsRepository';
import { useToast } from '../ui';

interface MultiOfferMatrixProps {
  subjectProperty: LuxuryPropertyComp;
}

export const MultiOfferMatrix: React.FC<MultiOfferMatrixProps> = ({
  subjectProperty
}) => {
  const { toast } = useToast();
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New offer form state
  const [buyerName, setBuyerName] = useState<string>('');
  const [offerPrice, setOfferPrice] = useState<string>(String(Math.round(subjectProperty.listPrice * 1.03)));
  const [dueDiligenceFee, setDueDiligenceFee] = useState<string>(String(Math.round(subjectProperty.listPrice * 0.025)));
  const [dueDiligenceDays, setDueDiligenceDays] = useState<string>('10');
  const [earnestMoney, setEarnestMoney] = useState<string>('25000');
  const [financingType, setFinancingType] = useState<any>('Conventional 20%');
  const [contingencies, setContingencies] = useState<any>('Appraisal Only');
  const [sellerConcessions, setSellerConcessions] = useState<string>('0');
  const [closingDays, setClosingDays] = useState<string>('28');
  const [specialTerms, setSpecialTerms] = useState<string>('');
  const [brokerRepresenting, setBrokerRepresenting] = useState<string>('Keller Williams Innovate');

  const fetchOffers = () => {
    setLoading(true);
    fetch(`/api/comps/multi-offer/${subjectProperty.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.comparison) {
          setComparison(data.comparison);
        } else {
          setComparison(PropertyCompsRepository.compareMultipleOffers(subjectProperty.id));
        }
      })
      .catch(() => {
        setComparison(PropertyCompsRepository.compareMultipleOffers(subjectProperty.id));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOffers();
  }, [subjectProperty.id]);

  const handleAddOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim()) {
      toast.error({ title: 'Missing Buyer Name', description: 'Please enter the buyer name.' });
      return;
    }

    const newOffer = {
      id: `offer_custom_${Date.now()}`,
      buyerName,
      offerPrice: Number(offerPrice) || subjectProperty.listPrice,
      dueDiligenceFee: Number(dueDiligenceFee) || 25000,
      dueDiligenceDays: Number(dueDiligenceDays) || 14,
      earnestMoney: Number(earnestMoney) || 25000,
      financingType,
      contingencies,
      sellerConcessions: Number(sellerConcessions) || 0,
      closingDays: Number(closingDays) || 30,
      specialTerms: specialTerms || 'Standard NC Form 2-T offer.',
      brokerRepresenting
    };

    const currentOffers = comparison?.offers || [];
    const updated = PropertyCompsRepository.compareMultipleOffers(subjectProperty.id, [
      ...currentOffers,
      newOffer
    ]);

    setComparison(updated);
    setShowAddModal(false);
    toast.success({
      title: 'Competing Offer Logged',
      description: `Added ${buyerName} ($${Number(offerPrice).toLocaleString()}) to seller decision matrix.`
    });
  };

  const handleCopySummary = () => {
    if (!comparison) return;
    const text = `🏡 MULTI-OFFER SELLER DECISION SUMMARY: ${subjectProperty.propertyAddress.split(',')[0]}
List Price: $${subjectProperty.listPrice.toLocaleString()}
Total Competing Offers: ${comparison.totalOffers}

${comparison.offers.map((o: any, idx: number) => `
#${idx + 1}: ${o.buyerName} (${o.financingType})
• Gross Price: $${o.offerPrice.toLocaleString()} (${o.priceDeltaPercent >= 0 ? '+' : ''}${o.priceDeltaPercent}%)
• Due Diligence Fee: $${o.dueDiligenceFee.toLocaleString()} (${o.dueDiligencePercent}%) - ${o.dueDiligenceDays} Days (${o.dueDiligenceDeadlineStr})
• Contingencies: ${o.contingencies}
• Estimated Seller Net: $${o.estimatedSellerNetProceeds.toLocaleString()}
• Closing Certainty Index: ${o.closingCertaintyScore}/100 (${o.certaintyRating})
`).join('')}

Nora AI Recommendation:
${comparison.topOfferReasoning}`;

    navigator.clipboard.writeText(text);
    toast.success({
      title: 'Decision Summary Copied',
      description: 'Formatted multi-offer summary copied to clipboard for client email/text!'
    });
  };

  if (loading || !comparison) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500 animate-pulse font-sans">
        Evaluating multiple competing buyer offers and reconciling seller net sheets...
      </div>
    );
  }

  const topOffer = comparison.offers.find((o: any) => o.id === comparison.topRecommendedOfferId) || comparison.offers[0];

  return (
    <div className="space-y-6 text-left font-sans animate-fadeIn">
      
      {/* 1. Header Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Multiple Offers Active
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {comparison.totalOffers} Competing Offers Under Review
            </span>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00635C]" />
            Multi-Offer Bidding War Comparison & Seller Net Ranker
          </h3>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Buyer Offer</span>
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Copy Decision Board</span>
          </button>
        </div>
      </div>

      {/* 2. Nora AI Top Recommendation Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs">
              ★
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Nora AI Recommendation • Top Ranked Offer
            </span>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
            {topOffer.certaintyRating}
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div>
            <h4 className="text-xl font-black text-white">
              Offer #{topOffer.rank}: {topOffer.buyerName} — ${topOffer.offerPrice.toLocaleString()} ({topOffer.financingType})
            </h4>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              {comparison.topOfferReasoning}
            </p>
          </div>

          <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700/80 text-right shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Estimated Seller Net Proceeds
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              ${topOffer.estimatedSellerNetProceeds.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400">
              Closing Certainty: <strong className="text-white">{topOffer.closingCertaintyScore}/100</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Side-by-Side Multi-Offer Comparison Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Rank & Buyer</th>
                <th className="py-3.5 px-4">Financing</th>
                <th className="py-3.5 px-4">Offer Price</th>
                <th className="py-3.5 px-4">Due Diligence (DD)</th>
                <th className="py-3.5 px-4">DD Period / Deadline</th>
                <th className="py-3.5 px-4">Contingencies</th>
                <th className="py-3.5 px-4">Est. Seller Net</th>
                <th className="py-3.5 px-4 text-right">Closing Certainty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {comparison.offers.map((offer: any) => {
                const isTop = offer.id === comparison.topRecommendedOfferId;
                return (
                  <tr 
                    key={offer.id} 
                    className={`hover:bg-slate-50/80 transition ${
                      isTop ? 'bg-emerald-50/40' : ''
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          isTop ? 'bg-[#00635C] text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {offer.rank}
                        </span>
                        <div>
                          <span className="font-extrabold text-slate-900 block text-xs">
                            {offer.buyerName}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate block max-w-[140px]">
                            {offer.brokerRepresenting}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        offer.financingType === 'All Cash' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                        offer.financingType === 'Conventional 20%' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                        'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}>
                        {offer.financingType}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-mono font-bold text-slate-900 text-xs">
                        ${offer.offerPrice.toLocaleString()}
                      </div>
                      <span className={`text-[10px] font-bold ${
                        offer.priceDeltaPercent >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {offer.priceDeltaPercent >= 0 ? '+' : ''}{offer.priceDeltaPercent}% vs List
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-mono font-bold text-amber-900 text-xs">
                        ${offer.dueDiligenceFee.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {offer.dueDiligencePercent}% Non-Refundable
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800 text-xs">
                        {offer.dueDiligenceDays} Days
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {offer.dueDiligenceDeadlineStr}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`text-[11px] font-semibold block ${
                        offer.contingencies.includes('No Contingencies') ? 'text-emerald-700 font-bold' :
                        offer.contingencies.includes('Appraisal Only') ? 'text-slate-700' :
                        'text-rose-700'
                      }`}>
                        {offer.contingencies}
                      </span>
                      {offer.sellerConcessions > 0 && (
                        <span className="text-[10px] text-rose-600 block">
                          -${offer.sellerConcessions.toLocaleString()} Concession
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 font-mono font-extrabold text-slate-900 text-sm">
                      ${offer.estimatedSellerNetProceeds.toLocaleString()}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-black text-xs font-mono text-slate-900">
                          {offer.closingCertaintyScore}/100
                        </span>
                        <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${offer.closingCertaintyScore}%` }}
                            className={`h-full rounded-full ${
                              offer.closingCertaintyScore >= 85 ? 'bg-emerald-600' :
                              offer.closingCertaintyScore >= 60 ? 'bg-blue-600' : 'bg-amber-600'
                            }`}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Strategic Pros & Cons Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {comparison.offers.map((offer: any) => (
          <div key={offer.id} className="bg-[#F7F8F5] border border-slate-200/80 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">
                Offer #{offer.rank}: {offer.buyerName}
              </span>
              <span className="font-mono text-xs font-extrabold text-[#00635C]">
                ${offer.offerPrice.toLocaleString()}
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] block">
                Advantages:
              </span>
              {offer.pros.map((p: string, idx: number) => (
                <div key={idx} className="flex items-start gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{p}</span>
                </div>
              ))}
            </div>

            {offer.cons.length > 0 && (
              <div className="space-y-1.5 text-[11px] pt-2 border-t border-slate-200/60">
                <span className="font-bold text-amber-800 uppercase tracking-wider text-[10px] block">
                  Considerations / Risks:
                </span>
                {offer.cons.map((c: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-1.5 text-slate-600">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 5. Add Buyer Offer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs font-sans text-left animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Log Competing Buyer Offer</h3>
                <p className="text-xs text-slate-500">Add an incoming offer to evaluate risk and seller net</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddOffer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Buyer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jonathan & Lisa Miller"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00635C] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Offer Price ($)</label>
                  <input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00635C] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Financing Type</label>
                  <select
                    value={financingType}
                    onChange={(e) => setFinancingType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00635C] outline-none bg-white cursor-pointer"
                  >
                    <option value="All Cash">All Cash</option>
                    <option value="Conventional 20%">Conventional 20%</option>
                    <option value="Jumbo Loan 10%">Jumbo Loan 10%</option>
                    <option value="FHA / VA">FHA / VA</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Due Diligence Fee ($)</label>
                  <input
                    type="number"
                    value={dueDiligenceFee}
                    onChange={(e) => setDueDiligenceFee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00635C] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">DD Period (Days)</label>
                  <input
                    type="number"
                    value={dueDiligenceDays}
                    onChange={(e) => setDueDiligenceDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00635C] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contingencies</label>
                  <select
                    value={contingencies}
                    onChange={(e) => setContingencies(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00635C] outline-none bg-white cursor-pointer"
                  >
                    <option value="No Contingencies (As-Is)">No Contingencies (As-Is)</option>
                    <option value="Appraisal Only">Appraisal Only</option>
                    <option value="Financing & Appraisal">Financing & Appraisal</option>
                    <option value="Home Sale Contingency">Home Sale Contingency</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Seller Concessions ($)</label>
                  <input
                    type="number"
                    value={sellerConcessions}
                    onChange={(e) => setSellerConcessions(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00635C] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00635C] hover:bg-[#004d47] text-white font-bold transition shadow-xs cursor-pointer"
                >
                  Rank Offer in Matrix
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
