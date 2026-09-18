/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PublicClientCompPortal: White-Glove Shareable Client Market & Offer Dossier
 * Hosted at /share/comps/:token for high-net-worth buyers & sellers.
 */

import React, { useState, useEffect } from 'react';
import { 
  MapPin, Home, TrendingUp, Sparkles, Award, 
  Phone, Mail, CheckCircle2, ShieldCheck, Download, Share2, Eye, Sliders, Calculator
} from 'lucide-react';
import { 
  ShareableClientDossier, 
  LuxuryPropertyComp, 
  PropertyCompsRepository 
} from '../../../server/persistence/propertyCompsRepository';
import { SpatialCompMap } from './SpatialCompMap';
import { CompMetricsMatrix } from './CompMetricsMatrix';
import { OfferScenarioSimulator } from './OfferScenarioSimulator';
import { NoraStrategyDossier } from './NoraStrategyDossier';
import { PropertyVisualInspectionDrawer } from './PropertyVisualInspectionDrawer';
import { useToast } from '../ui';

interface PublicClientCompPortalProps {
  shareToken?: string;
}

export const PublicClientCompPortal: React.FC<PublicClientCompPortalProps> = ({
  shareToken
}) => {
  const { toast } = useToast();
  const [dossier, setDossier] = useState<ShareableClientDossier | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedComp, setSelectedComp] = useState<LuxuryPropertyComp | null>(null);
  const [inspectingProperty, setInspectingProperty] = useState<LuxuryPropertyComp | null>(null);
  const [radiusMiles, setRadiusMiles] = useState<number>(3.0);
  const [activeTab, setActiveTab] = useState<'map' | 'simulator' | 'dossier'>('map');

  useEffect(() => {
    // Resolve share token from props or URL
    const token = shareToken || window.location.pathname.split('/share/comps/')[1] || '1104-arboretum';
    
    // Fetch shared dossier from API or repository fallback
    fetch(`/api/comps/share/${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.dossier) {
          setDossier(data.dossier);
        } else {
          // Fallback direct generation
          const fallback = PropertyCompsRepository.getSharedDossierByToken(token);
          setDossier(fallback || null);
        }
      })
      .catch(() => {
        const fallback = PropertyCompsRepository.getSharedDossierByToken(token);
        setDossier(fallback || null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center p-6 text-center font-sans">
        <div className="space-y-3">
          <div className="w-10 h-10 border-4 border-[#00635C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Loading Nest Realty Luxury Comparative Dossier...
          </p>
        </div>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md max-w-md space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Dossier Link Expired</h2>
          <p className="text-xs text-slate-500">
            This private market comparative link has expired. Please contact your Nest Realty advisor for a refreshed dossier.
          </p>
        </div>
      </div>
    );
  }

  const subject = dossier.subjectProperty;
  const comps = dossier.comps;

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-slate-900 text-left font-sans pb-16">
      
      {/* 1. Luxury Brokerage Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00635C] text-white flex items-center justify-center font-black text-sm shadow-2xs">
              N
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-slate-900 block leading-tight">
                NEST REALTY
              </span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                Luxury Private Client Dossier
              </span>
            </div>
          </div>

          {/* Agent Contact Action */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <span className="text-xs font-bold text-slate-900 block">{dossier.preparedBy}</span>
              <span className="text-[10px] text-slate-500">{subject.listingBrokerage}</span>
            </div>
            <a
              href={`tel:${subject.agentPhone}`}
              className="px-3.5 py-1.5 rounded-xl bg-[#00635C] hover:bg-[#004d47] text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Contact Advisor</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. Hero Property Banner */}
      <div className="bg-white border-b border-slate-200/90 py-8 px-4 sm:px-6 mb-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                Subject Property
              </span>
              <span className="text-xs text-slate-500 font-mono">{subject.mlsNumber}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {subject.propertyAddress}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              {subject.neighborhood} • {subject.city}, {subject.state} {subject.zip}
            </p>
          </div>

          <div className="flex items-center gap-6 bg-[#F7F8F5] p-4 rounded-2xl border border-slate-200/80">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">List Price</span>
              <div className="text-2xl font-black text-[#00635C]">
                ${subject.listPrice.toLocaleString()}
              </div>
            </div>
            <div className="border-l border-slate-200 pl-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Living Space</span>
              <div className="text-lg font-extrabold text-slate-900">
                {subject.heatedSqFt.toLocaleString()} SqFt
              </div>
              <span className="text-[11px] text-slate-500 font-mono">${subject.pricePerSqFt}/sf</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-2xl w-fit shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'map' ? 'bg-[#00635C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Spatial Map & Comparables
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'simulator' ? 'bg-[#00635C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Interactive Offer Calculator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dossier')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'dossier' ? 'bg-[#00635C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nora AI Market Valuation
          </button>
        </div>

        {/* Tab 1: Map & Matrix */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            <SpatialCompMap
              subjectProperty={subject}
              comps={comps}
              selectedCompId={selectedComp?.id || null}
              onSelectComp={(c) => {
                setSelectedComp(c);
                setInspectingProperty(c);
              }}
              radiusMiles={radiusMiles}
              onRadiusChange={(r) => setRadiusMiles(r)}
            />

            <CompMetricsMatrix
              subjectProperty={subject}
              comps={comps}
              selectedCompId={selectedComp?.id || null}
              onSelectComp={(c) => {
                setSelectedComp(c);
                setInspectingProperty(c);
              }}
            />
          </div>
        )}

        {/* Tab 2: Offer Simulator */}
        {activeTab === 'simulator' && (
          <OfferScenarioSimulator
            subjectProperty={subject}
            comps={comps}
          />
        )}

        {/* Tab 3: Nora AI Strategy Dossier */}
        {activeTab === 'dossier' && (
          <NoraStrategyDossier
            subjectProperty={subject}
            comps={comps}
          />
        )}
      </main>

      {/* Visual Inspection Drawer Modal */}
      <PropertyVisualInspectionDrawer
        property={inspectingProperty}
        isOpen={Boolean(inspectingProperty)}
        onClose={() => setInspectingProperty(null)}
      />
    </div>
  );
};
