/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SpatialCompsView: Unified Luxury Spatial Comps & Offer Intelligence Command Console
 * Includes Full-Width GIS Map Canvas, Metric Matrix, In-House Buyer Cross-Matching, Brokerage Market Share,
 * Appraisal Adjustments, Micro-Market Trends, Multi-Offer Bidding Matrix, FEMA Flood Risk, 1-Click Maxa CMA Deck, and Client Share Portal.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, Home, TrendingUp, Calculator, Sparkles, 
  Layers, ExternalLink, Presentation, ChevronDown, CheckCircle2, 
  ArrowRight, ShieldCheck, Printer, RefreshCw, Sliders, Share2, Eye, Copy, Plus, Users, Waves, Building2, BookOpen,
  DollarSign, Mail, Sun, Mountain, Wind, GraduationCap, Scale, Flag, Anchor, Volume2
} from 'lucide-react';
import { 
  LuxuryPropertyComp, 
  PropertyCompsRepository, 
  LUXURY_PROPERTY_DATABASE 
} from '../../../server/persistence/propertyCompsRepository';
import { SpatialCompMap } from './SpatialCompMap';
import { CompMetricsMatrix } from './CompMetricsMatrix';
import { CompAdjustmentMatrix } from './CompAdjustmentMatrix';
import { MicroMarketTrendsView } from './MicroMarketTrendsView';
import { MultiOfferMatrix } from './MultiOfferMatrix';
import { CoastalRiskIntelligenceView } from './CoastalRiskIntelligenceView';
import { InHouseBuyerMatchView } from './InHouseBuyerMatchView';
import { BrokerageMarketShareView } from './BrokerageMarketShareView';
import { OfferScenarioSimulator } from './OfferScenarioSimulator';
import { NoraStrategyDossier } from './NoraStrategyDossier';
import { PropertyVisualInspectionDrawer } from './PropertyVisualInspectionDrawer';
import { CustomCompModal } from './CustomCompModal';
import { LuxuryCmaBookletModal } from './LuxuryCmaBookletModal';
import { PurchasingPowerMatrixView } from './PurchasingPowerMatrixView';
import { TaxAndPermitsView } from './TaxAndPermitsView';
import { SchoolDistrictView } from './SchoolDistrictView';
import { DirectMailWorksheetView } from './DirectMailWorksheetView';
import { SolarExposureSimulatorView } from './SolarExposureSimulatorView';
import { LotTopographyAndSetbacksView } from './LotTopographyAndSetbacksView';
import { MicroClimateAndWindView } from './MicroClimateAndWindView';
import { GolfCourseSpatialView } from './GolfCourseSpatialView';
import { WaterfrontNavigationSpatialView } from './WaterfrontNavigationSpatialView';
import { AcousticSoundscapeView } from './AcousticSoundscapeView';
import { NoraContractSentinelView } from '../nora/NoraContractSentinelView';
import { ContractAutoDrafterWorkbench } from '../contracts/ContractAutoDrafterWorkbench';
import { useToast } from '../ui';

interface SpatialCompsViewProps {
  initialSubjectId?: string;
  onNavigateToMarketing?: (propertyAddress: string) => void;
}

export default function SpatialCompsView({
  initialSubjectId = 'prop_1104_arboretum',
  onNavigateToMarketing
}: SpatialCompsViewProps) {
  const { toast } = useToast();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const subjects = PropertyCompsRepository.getSubjectProperties();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId);
  const [customResolvedSubject, setCustomResolvedSubject] = useState<LuxuryPropertyComp | null>(null);
  const [radiusMiles, setRadiusMiles] = useState<number>(3.0);
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedComp, setSelectedComp] = useState<LuxuryPropertyComp | null>(null);
  const [inspectingProperty, setInspectingProperty] = useState<LuxuryPropertyComp | null>(null);
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'map_and_matrix' | 'purchasing_power' | 'direct_mail' | 'buyer_matches' | 'brokerage_share' | 'adjustments' | 'multi_offer' | 'tax_and_permits' | 'schools' | 'solar' | 'lot_topography' | 'micro_climate' | 'golf_course' | 'waterfront_nav' | 'acoustic_soundscape' | 'flood_risk' | 'trends' | 'offer_simulator' | 'nora_dossier' | 'contract_sentinel' | 'contract_drafter'>('map_and_matrix');
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showAddCompModal, setShowAddCompModal] = useState<boolean>(false);
  const [showCmaModal, setShowCmaModal] = useState<boolean>(false);
  const [clientName, setClientName] = useState<string>('');
  const [generatedShareUrl, setGeneratedShareUrl] = useState<string>('');
  const [polygonFilteredResult, setPolygonFilteredResult] = useState<any | null>(null);

  // Query comps
  const { subjectProperty: defaultSubjectProperty, comps: defaultComps, summary: defaultSummary } = PropertyCompsRepository.findSpatialComps({
    subjectId: selectedSubjectId,
    radiusMiles,
    neighborhood: neighborhoodFilter,
    statusFilter
  });

  const subjectProperty = (customResolvedSubject && customResolvedSubject.id === selectedSubjectId)
    ? customResolvedSubject
    : defaultSubjectProperty;

  const comps = polygonFilteredResult ? polygonFilteredResult.comps : defaultComps;
  const summary = polygonFilteredResult ? polygonFilteredResult.summary : defaultSummary;

  const allSubjectOptions = React.useMemo(() => {
    const list = PropertyCompsRepository.getSubjectProperties();
    if (customResolvedSubject && !list.some(s => s.id === customResolvedSubject.id)) {
      return [customResolvedSubject, ...list];
    }
    return list;
  }, [customResolvedSubject]);

  const handleSelectSubject = (id: string) => {
    setCustomResolvedSubject(null);
    setSelectedSubjectId(id);
    setSelectedComp(null);
    setPolygonFilteredResult(null);
    const prop = PropertyCompsRepository.getPropertyById(id);
    if (prop) {
      toast.info({
        title: 'Subject Property Loaded',
        description: `Loaded ${prop.propertyAddress.split(',')[0]} (${prop.neighborhood}).`
      });
    }
  };

  const handleGenerateClientShare = () => {
    const dossier = PropertyCompsRepository.createShareableDossier({
      subjectPropertyId: subjectProperty.id,
      clientName: clientName || 'Private Luxury Client'
    });

    const fullUrl = `${window.location.origin}/share/comps/${dossier.shareToken}`;
    setGeneratedShareUrl(fullUrl);
    navigator.clipboard.writeText(fullUrl);
    toast.success({
      title: 'Client Dossier Link Created',
      description: 'Private interactive client URL copied to clipboard!'
    });
  };

  const handleCompAdded = (newComp: LuxuryPropertyComp) => {
    setSelectedComp(newComp);
  };

  return (
    <div className="w-full space-y-6 text-left font-sans animate-fadeIn">
      
      {/* 1. Header Toolbar: Subject Property Switcher, Neighborhood Radius, and Actions */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Subject Property Selector Badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00635C] border border-emerald-200 flex items-center justify-center font-bold">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#00635C] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Spatial Intelligence
              </span>
              <span className="text-xs text-slate-500 font-medium font-mono">{subjectProperty.mlsNumber}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                value={selectedSubjectId}
                onChange={(e) => handleSelectSubject(e.target.value)}
                className="text-base sm:text-lg font-extrabold text-slate-900 bg-transparent border-none p-0 pr-6 focus:ring-0 cursor-pointer hover:text-[#00635C] transition"
              >
                {allSubjectOptions.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.propertyAddress.split(',')[0]} (${(sub.listPrice / 1000000).toFixed(2)}M) — {sub.neighborhood}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Controls & Presentation Mode Switch */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Subtabs Switcher */}
          <div className="flex flex-wrap items-center bg-[#F7F8F5] border border-slate-200 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('map_and_matrix')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'map_and_matrix'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Map & Matrix
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('purchasing_power')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'purchasing_power'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3 h-3 text-emerald-600" />
              <span>Purchasing Power</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('direct_mail')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'direct_mail'
                  ? 'bg-white text-[#00635C] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3 h-3 text-[#00635C]" />
              <span>Direct Mail</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('solar')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'solar'
                  ? 'bg-white text-amber-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3 h-3 text-amber-600" />
              <span>Solar & Pool</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('lot_topography')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'lot_topography'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mountain className="w-3 h-3 text-emerald-700" />
              <span>Lot & Topo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('micro_climate')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'micro_climate'
                  ? 'bg-white text-cyan-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wind className="w-3 h-3 text-cyan-700" />
              <span>Micro-Climate</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('golf_course')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'golf_course'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flag className="w-3 h-3 text-[#00635C]" />
              <span>Golf Fairway</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('waterfront_nav')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'waterfront_nav'
                  ? 'bg-white text-cyan-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Anchor className="w-3 h-3 text-cyan-700" />
              <span>Deepwater Dock</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('acoustic_soundscape')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'acoustic_soundscape'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Volume2 className="w-3 h-3 text-[#00635C]" />
              <span>Acoustic Noise</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('buyer_matches')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'buyer_matches'
                  ? 'bg-white text-purple-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3 h-3 text-purple-600" />
              <span>In-House Buyers</span>
              <span className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">4</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('brokerage_share')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'brokerage_share'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3 h-3 text-emerald-600" />
              <span>Market Share</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('adjustments')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'adjustments'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Adjustments
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('multi_offer')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'multi_offer'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Multi-Offer
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tax_and_permits')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'tax_and_permits'
                  ? 'bg-white text-[#00635C] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-[#00635C]" />
              <span>Tax & Permits</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('schools')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'schools'
                  ? 'bg-white text-[#00635C] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3 h-3 text-[#00635C]" />
              <span>Schools</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('flood_risk')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'flood_risk'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Flood Risk
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('trends')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'trends'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trends
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('offer_simulator')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'offer_simulator'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Form 2-T
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('contract_sentinel')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'contract_sentinel'
                  ? 'bg-white text-[#00635C] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3 h-3 text-[#00635C]" />
              <span>Risk Sentinel</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('contract_drafter')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'contract_drafter'
                  ? 'bg-white text-[#00635C] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>80% Auto-Drafter</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('nora_dossier')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'nora_dossier'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nora AI
            </button>
          </div>

          {/* 1-Click Export CMA Deck Action */}
          <button
            type="button"
            onClick={() => setShowCmaModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Export CMA Deck</span>
          </button>

          {/* Add Custom Comp Action */}
          <button
            type="button"
            onClick={() => setShowAddCompModal(true)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#00635C]" />
            <span>Add Comp</span>
          </button>

          {/* Share with Client Action */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5 text-[#00635C]" />
            <span>Share</span>
          </button>

          {/* Presentation Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsPresentationMode(!isPresentationMode);
              toast.info({
                title: !isPresentationMode ? 'Client Mode Activated' : 'Standard View Restored',
                description: !isPresentationMode ? 'Distraction-free high-res presentation layout.' : 'Back to operational mode.'
              });
            }}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isPresentationMode 
                ? 'bg-purple-900 text-white border-purple-800 shadow-md' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Presentation className="w-3.5 h-3.5" />
            {isPresentationMode ? 'Exit' : 'Client Mode'}
          </button>
        </div>
      </div>

      {/* 2. Key Summary Metric Strip */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Subject Asking Price
          </span>
          <div className="text-lg font-extrabold text-[#00635C]">
            ${subjectProperty.listPrice.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            ${subjectProperty.pricePerSqFt}/sf • {subjectProperty.heatedSqFt.toLocaleString()} SqFt
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Avg Comp Price
          </span>
          <div className="text-lg font-extrabold text-slate-900">
            ${summary.avgPrice.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            ${summary.avgPricePerSqFt}/sf ({comps.length} nearby sales)
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Neighborhood DOM
          </span>
          <div className="text-lg font-extrabold text-emerald-700">
            {summary.avgDaysOnMarket} Days Avg
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Fast market velocity in {subjectProperty.neighborhood.split(' ')[0]}
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Standard Due Diligence
          </span>
          <div className="text-lg font-extrabold text-amber-800">
            ${(subjectProperty.dueDiligenceFee || 25000).toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            2.0% Non-Refundable Fee Standard
          </span>
        </div>
      </div>

      {/* 3. Main Views */}
      {activeTab === 'map_and_matrix' && (
        <div className="w-full space-y-6">
          {/* Full-Width Interactive Photoreal Satellite Map Canvas */}
          <SpatialCompMap
            subjectProperty={subjectProperty}
            comps={comps}
            selectedCompId={selectedComp?.id || null}
            onSelectComp={(comp) => {
              setSelectedComp(comp);
              setInspectingProperty(comp);
            }}
            radiusMiles={radiusMiles}
            onRadiusChange={(r) => {
              setPolygonFilteredResult(null);
              setRadiusMiles(r);
            }}
            onAddressResolved={(res) => {
              setCustomResolvedSubject(res.subjectProperty);
              setSelectedSubjectId(res.subjectProperty.id);
              setSelectedComp(null);
              setPolygonFilteredResult(null);
            }}
            onPolygonFilterChange={(res) => {
              setPolygonFilteredResult(res);
            }}
          />

          {/* Side-by-Side Comparison Matrix */}
          <CompMetricsMatrix
            subjectProperty={subjectProperty}
            comps={comps}
            selectedCompId={selectedComp?.id || null}
            onSelectComp={(comp) => {
              setSelectedComp(comp);
              setInspectingProperty(comp);
            }}
          />
        </div>
      )}

      {activeTab === 'purchasing_power' && (
        <PurchasingPowerMatrixView
          subjectProperty={subjectProperty}
        />
      )}

      {activeTab === 'direct_mail' && (
        <DirectMailWorksheetView
          subjectProperty={subjectProperty}
        />
      )}

      {activeTab === 'solar' && (
        <SolarExposureSimulatorView
          subjectProperty={subjectProperty}
        />
      )}

      {activeTab === 'lot_topography' && (
        <LotTopographyAndSetbacksView
          subjectProperty={subjectProperty}
        />
      )}

      {activeTab === 'micro_climate' && (
        <MicroClimateAndWindView
          subjectProperty={subjectProperty}
        />
      )}

      {activeTab === 'golf_course' && (
        <GolfCourseSpatialView
          subjectProperty={subjectProperty}
        />
      )}

      {activeTab === 'waterfront_nav' && (
        <WaterfrontNavigationSpatialView
          subjectProperty={subjectProperty}
        />
      )}

      {activeTab === 'acoustic_soundscape' && (
        <AcousticSoundscapeView
          subjectProperty={subjectProperty}
        />
      )}

      {activeTab === 'buyer_matches' && (
        <InHouseBuyerMatchView
          subjectProperty={subjectProperty}
        />
      )}

      {activeTab === 'brokerage_share' && (
        <BrokerageMarketShareView
          initialNeighborhood={subjectProperty.neighborhood}
        />
      )}

      {activeTab === 'adjustments' && (
        <CompAdjustmentMatrix
          subjectProperty={subjectProperty}
          comps={comps}
          onSelectComp={(comp) => {
            setSelectedComp(comp);
            setInspectingProperty(comp);
          }}
        />
      )}

      {activeTab === 'multi_offer' && (
        <MultiOfferMatrix
          subjectProperty={subjectProperty}
        />
      )}

      {activeTab === 'tax_and_permits' && (
        <TaxAndPermitsView
          subjectProperty={subjectProperty}
        />
      )}

      {activeTab === 'schools' && (
        <SchoolDistrictView
          subjectProperty={subjectProperty}
        />
      )}

      {activeTab === 'flood_risk' && (
        <CoastalRiskIntelligenceView
          subjectProperty={subjectProperty}
        />
      )}

      {activeTab === 'trends' && (
        <MicroMarketTrendsView
          initialNeighborhood={subjectProperty.neighborhood}
        />
      )}

      {activeTab === 'offer_simulator' && (
        <OfferScenarioSimulator
          subjectProperty={subjectProperty}
          comps={comps}
        />
      )}

      {activeTab === 'contract_sentinel' && (
        <NoraContractSentinelView />
      )}

      {activeTab === 'contract_drafter' && (
        <ContractAutoDrafterWorkbench
          subjectProperty={subjectProperty}
          onNavigateToComps={() => setActiveTab('map_and_matrix')}
        />
      )}

      {activeTab === 'nora_dossier' && (
        <NoraStrategyDossier
          subjectProperty={subjectProperty}
          comps={comps}
        />
      )}

      {/* Visual Inspection Drawer */}
      <PropertyVisualInspectionDrawer
        property={inspectingProperty}
        isOpen={Boolean(inspectingProperty)}
        onClose={() => setInspectingProperty(null)}
        onSimulateOffer={(p) => {
          setActiveTab('offer_simulator');
        }}
      />

      {/* Custom Comp Modal */}
      <CustomCompModal
        isOpen={showAddCompModal}
        onClose={() => setShowAddCompModal(false)}
        onCompAdded={handleCompAdded}
        defaultNeighborhood={subjectProperty.neighborhood}
      />

      {/* 8-Page High-Res Luxury CMA Booklet Modal */}
      <LuxuryCmaBookletModal
        subjectProperty={subjectProperty}
        isOpen={showCmaModal}
        onClose={() => setShowCmaModal(false)}
      />

      {/* Share with Client Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#00635C] text-white flex items-center justify-center font-bold text-xs">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Share Client Dossier</h3>
                  <p className="text-[11px] text-slate-500">Generate a branded link for {subjectProperty.propertyAddress.split(',')[0]}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setGeneratedShareUrl('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Client Name (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. John & Caroline Smith"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00635C] outline-none"
                />
              </div>

              {generatedShareUrl ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                    ✓ Share Link Ready:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedShareUrl}
                      className="w-full font-mono text-[11px] text-slate-800 bg-white p-2 rounded-lg border border-slate-200 truncate"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedShareUrl);
                        toast.success({ title: 'Copied', description: 'Link copied to clipboard!' });
                      }}
                      className="px-3 py-2 bg-[#00635C] text-white font-bold rounded-lg shrink-0 cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerateClientShare}
                  className="w-full py-2.5 rounded-xl bg-[#00635C] hover:bg-[#004d47] text-white font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  Generate Private Client URL
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
