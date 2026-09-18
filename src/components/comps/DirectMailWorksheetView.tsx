/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DirectMailWorksheetView: Automated Neighborhood Direct Mail Postcard Dispatcher
 * USPS EDDM Carrier Route Targeting, 250 Spatial Neighbors, Live Maxa Postcard Proof,
 * and 1-Click Print Production Dispatch.
 */

import React, { useState, useEffect } from 'react';
import { 
  Mail, Send, CheckCircle2, QrCode, MapPin, DollarSign, 
  Layers, Sparkles, Printer, ArrowRight, ShieldCheck, Eye, Loader2
} from 'lucide-react';
import { LuxuryPropertyComp, PropertyCompsRepository } from '../../../server/persistence/propertyCompsRepository';
import { useToast } from '../ui';

interface DirectMailWorksheetViewProps {
  subjectProperty: LuxuryPropertyComp;
}

export const DirectMailWorksheetView: React.FC<DirectMailWorksheetViewProps> = ({
  subjectProperty
}) => {
  const { toast } = useToast();
  const [size, setSize] = useState<'6x9_oversized' | '6x11_panoramic'>('6x9_oversized');
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [dispatchedOrder, setDispatchedOrder] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/comps/direct-mail/${subjectProperty.id}?size=${size}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.campaign) {
          setCampaign(data.campaign);
        } else {
          setCampaign(PropertyCompsRepository.getDirectMailCampaignProfile(subjectProperty.id, { postcardSize: size }));
        }
      })
      .catch(() => {
        setCampaign(PropertyCompsRepository.getDirectMailCampaignProfile(subjectProperty.id, { postcardSize: size }));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [subjectProperty.id, size]);

  const handleDispatchCampaign = async () => {
    setDispatching(true);
    try {
      const res = await fetch('/api/comps/direct-mail/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: subjectProperty.id,
          size
        })
      });
      const data = await res.json();
      if (data.success) {
        setDispatchedOrder(data);
        toast.success({
          title: 'Direct Mail Campaign Dispatched!',
          description: `Order ${data.orderConfirmationNumber} sent to Maxa Print Queue (${data.recipients} homes).`
        });
      }
    } catch {
      toast.error({
        title: 'Dispatch Failed',
        description: 'Unable to reach print production queue.'
      });
    } finally {
      setDispatching(false);
    }
  };

  if (loading || !campaign) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center text-slate-500 font-bold animate-pulse border border-slate-200">
        Loading USPS EDDM carrier route intelligence & postcard proof...
      </div>
    );
  }

  const { postcardFormat, carrierRoutes, metrics } = campaign;

  return (
    <div className="w-full space-y-6 text-left font-sans animate-fadeIn">
      
      {/* 1. Master Direct Mail Banner */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
              <Mail className="w-3 h-3 text-[#00635C]" /> Automated EDDM Dispatcher
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">{carrierRoutes.length} Carrier Routes</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Neighborhood Direct Mail Postcard Dispatcher
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            1-Click Just Listed mailer to the 250 closest high-net-worth spatial neighbors mapped across USPS EDDM carrier routes with full QR code tracking.
          </p>
        </div>

        {/* 1-Click Dispatch Button */}
        <div className="bg-[#F7F8F5] border border-slate-200 p-5 rounded-2xl text-right shrink-0 flex flex-col items-end gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Campaign Cost (Print + Postage)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#00635C] font-mono">
              ${metrics.totalCampaignCost.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              ${metrics.totalCostPerCard}/card • {metrics.totalRecipients} Homes
            </span>
          </div>

          <button
            type="button"
            onClick={handleDispatchCampaign}
            disabled={dispatching || Boolean(dispatchedOrder)}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shadow-xs ${
              dispatchedOrder 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-[#00635C] text-white hover:bg-[#00514B]'
            }`}
          >
            {dispatching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Dispatching Order...</span>
              </>
            ) : dispatchedOrder ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Dispatched: {dispatchedOrder.orderConfirmationNumber}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Dispatch Direct Mail Campaign</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Format Selector & Route Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Postcard Size Selector */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Select Postcard Format</h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setSize('6x9_oversized')}
              className={`w-full p-4 rounded-2xl border text-left transition cursor-pointer ${
                size === '6x9_oversized'
                  ? 'bg-emerald-50/80 border-[#00635C] ring-2 ring-[#00635C]/20 shadow-xs'
                  : 'bg-[#F7F8F5] border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-xs text-slate-900">6" x 9" Jumbo Gloss Card</span>
                <span className="font-mono text-xs font-bold text-[#00635C]">$0.602 / home</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">16pt Silk Cover with UV Gloss Coat</p>
            </button>

            <button
              type="button"
              onClick={() => setSize('6x11_panoramic')}
              className={`w-full p-4 rounded-2xl border text-left transition cursor-pointer ${
                size === '6x11_panoramic'
                  ? 'bg-emerald-50/80 border-[#00635C] ring-2 ring-[#00635C]/20 shadow-xs'
                  : 'bg-[#F7F8F5] border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-xs text-slate-900">6" x 11" Panoramic Luxury</span>
                <span className="font-mono text-xs font-bold text-[#00635C]">$0.702 / home</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Maximum USPS EDDM Dimensions with Soft-Touch</p>
            </button>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
            <div className="flex justify-between">
              <span>Print Production:</span>
              <span className="font-mono font-bold">${metrics.printCostPerCard}/card</span>
            </div>
            <div className="flex justify-between">
              <span>USPS EDDM Postage:</span>
              <span className="font-mono font-bold">${metrics.uspsEddmPostagePerCard}/card</span>
            </div>
            <div className="flex justify-between">
              <span>Est. Delivery:</span>
              <span className="font-bold text-slate-900">{metrics.estimatedDeliveryDays}</span>
            </div>
          </div>
        </div>

        {/* USPS EDDM Carrier Routes */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#00635C]" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">USPS EDDM Spatial Carrier Routes</h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">{metrics.totalRecipients} Total Homes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {carrierRoutes.map((route: any, idx: number) => (
              <div key={idx} className="p-4 rounded-2xl bg-[#F7F8F5] border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-extrabold text-xs text-slate-900 bg-slate-200 px-2 py-0.5 rounded-full">
                    {route.routeId}
                  </span>
                  <span className="font-mono font-bold text-[#00635C]">{route.residentialCount} Homes</span>
                </div>
                <div className="space-y-1 text-slate-500 text-[11px] pt-1">
                  <div className="flex justify-between">
                    <span>Average Home Value:</span>
                    <span className="font-mono font-bold text-slate-800">${(route.averageHomeValue / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Median Route Income:</span>
                    <span className="font-mono font-bold text-slate-800">${(route.medianIncome / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. Live 300 DPI Maxa Postcard Proof Mockup */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#00635C]" />
            <h3 className="text-sm font-bold text-slate-900">Live 300 DPI Maxa Postcard Proof Mockup</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Front & Back Spread Preview</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Front of Card */}
          <div className="relative aspect-[1.5/1] rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-stone-900 text-white flex flex-col justify-between p-6">
            <img 
              src={subjectProperty.heroPhoto || (subjectProperty as any).photoUrls?.[0] || subjectProperty.photos?.[0]?.url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'} 
              alt="Front" 
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60" />

            <div className="relative z-10 flex justify-between items-start">
              <div className="bg-[#00635C] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                Just Listed Exclusive
              </div>
              <span className="text-xs font-black tracking-wider uppercase drop-shadow-sm">Nest Realty Luxury</span>
            </div>

            <div className="relative z-10 space-y-1">
              <h4 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-md">
                {postcardFormat.headline}
              </h4>
              <p className="text-xs text-emerald-300 font-bold drop-shadow-sm">
                {postcardFormat.subheadline} • {subjectProperty.beds || (subjectProperty as any).bedrooms || 4} Beds • {subjectProperty.baths || (subjectProperty as any).bathrooms || 3.5} Baths • {(subjectProperty.heatedSqFt || 4000).toLocaleString()} SqFt
              </p>
            </div>
          </div>

          {/* Back of Card */}
          <div className="aspect-[1.5/1] rounded-2xl border border-slate-300 shadow-md bg-[#FAF9F5] p-6 flex flex-col justify-between text-xs text-slate-800">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase text-[#00635C] tracking-wider">Private Client Portal</span>
                <p className="text-xs font-bold text-slate-900">{postcardFormat.callToAction}</p>
              </div>

              {/* USPS EDDM Indicia Box */}
              <div className="border border-slate-400 p-2 text-center text-[8px] font-mono uppercase rounded leading-tight">
                PRSRT STD<br />
                ECRWSS<br />
                U.S. POSTAGE PAID<br />
                PERMIT #412
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="space-y-1 text-[11px] text-slate-600">
                <p className="font-bold text-slate-900">Schedule a Private Showing:</p>
                <p>Marcus Aman • Luxury Division Lead</p>
                <p className="font-mono text-slate-500">+1 (910) 555-0199</p>
                <p className="font-mono text-slate-500">nora@nest-realty.com</p>
              </div>

              <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl text-center">
                <QrCode className="w-12 h-12 text-slate-900" />
                <span className="text-[9px] font-mono text-slate-500 mt-1">Scan for 3D Virtual Tour</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-2 text-[9px] text-slate-400 flex justify-between font-mono">
              <span>****ECRWSS**** POSTAL CUSTOMER</span>
              <span>WILMINGTON NC 28405</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
