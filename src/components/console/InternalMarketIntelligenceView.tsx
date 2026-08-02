import React, { useState } from 'react';
import { 
  TrendingUp, 
  Search, 
  Filter, 
  BarChart3, 
  Building, 
  Target, 
  Clock, 
  Compass, 
  Cpu,
  Zap,
  CheckCircle,
  ArrowRight,
  Shield,
  Layers,
  Award,
  DollarSign,
  MapPin,
  CheckSquare,
  Users,
  PieChart
} from 'lucide-react';

interface InternalMarketIntelligenceViewProps {
  onNavigateTab: (tab: string) => void;
}

export default function InternalMarketIntelligenceView({ 
  onNavigateTab 
}: InternalMarketIntelligenceViewProps) {
  const [activeResearchTab, setActiveResearchTab] = useState<'overview' | 'tech_matrix' | 'roi_model' | 'expansion'>('overview');
  const [activeSegment, setActiveSegment] = useState<'all' | 'independent' | 'regional' | 'boutique'>('all');

  const marketMetrics = {
    tam: '106,000',
    sam: '28,500',
    som: '1,250',
    avgHoursSaved: '18.5h',
    bicTimeSaved: '24.0h',
    slaTurnaround: '14 mins',
    retentionBoost: '+28%'
  };

  const targetBrokerageSegments = [
    {
      id: 'independent',
      name: 'Independent Regional Brokerages',
      size: '25 – 150 Agents',
      primaryFriction: 'Scattered transaction tools & manual BIC signoffs',
      roiPotential: '18.5 hours saved / agent / mo',
      financialSavings: '$42,000 / yr saved',
      fitScore: 96,
      readiness: 'High',
      techStack: 'Follow Up Boss + Dotloop + QuickBooks'
    },
    {
      id: 'regional',
      name: 'Multi-Office Regional Franchises',
      size: '150 – 500 Agents',
      primaryFriction: 'Compliance audit backlog & delayed CDA approvals',
      roiPotential: '24.0 hours saved / BIC / mo',
      financialSavings: '$118,000 / yr saved',
      fitScore: 92,
      readiness: 'High',
      techStack: 'kvCORE + SkySlope + Lone Wolf'
    },
    {
      id: 'boutique',
      name: 'Luxury Boutique & Team Hubs',
      size: '10 – 40 Agents',
      primaryFriction: 'Unstructured client requests & vendor dispatch chaos',
      roiPotential: '14.0 hours saved / agent / mo',
      financialSavings: '$28,000 / yr saved',
      fitScore: 88,
      readiness: 'Medium',
      techStack: 'MoxiWorks + Brokermint + Google Workspace'
    }
  ];

  const techStackComparison = [
    {
      category: 'Inbound Agent Requests & Intake',
      legacyStack: 'Follow Up Boss / kvCORE',
      legacyMethod: 'Manual emails, text messages & sticky notes',
      shapeworkOS: 'Automated request intake, SOP routing & instant escalation',
      advantage: 'Zero dropped requests (100% resolution tracking)'
    },
    {
      category: 'Broker-in-Charge CDA & File Audit',
      legacyStack: 'Dotloop / SkySlope / Brokermint',
      legacyMethod: '3 - 5 business days waiting on manual email reviews',
      shapeworkOS: 'Under 15 minutes with automated compliance verification',
      advantage: '95% faster agent commission payouts'
    },
    {
      category: 'Agent Onboarding & Asset Setup',
      legacyStack: 'Paper Checklists / Google Forms',
      legacyMethod: '12 separate form signoffs across 4 disconnected portals',
      shapeworkOS: '1-click automated onboarding checklist & account setup',
      advantage: 'Day-1 agent productivity'
    },
    {
      category: 'Operating Audit & Decision History',
      legacyStack: 'Siloed Email Accounts',
      legacyMethod: 'Non-existent or buried in personal email threads',
      shapeworkOS: 'Immutable real-time audit trail & decision history',
      advantage: '100% compliance audit-ready'
    },
    {
      category: 'Knowledge Base & Policy Q&A',
      legacyStack: 'PDF Employee Handbooks',
      legacyMethod: 'Agents call/text BIC for routine policy questions',
      shapeworkOS: 'Grounded AI Assistant providing exact policy answers',
      advantage: '80% deflection of repetitive BIC inquiries'
    }
  ];

  const roiCalculations = [
    {
      metric: 'Broker-in-Charge Time Recovery',
      before: '18 hours/week spent auditing files & reviewing CDAs',
      after: '3 hours/week spent approving high-confidence AI checks',
      gain: '15 hours recovered / BIC / week'
    },
    {
      metric: 'Agent Transaction Processing Speed',
      before: '4.5 days average turn from contract-to-close review',
      after: '14 minutes average turn with automated SOP verification',
      gain: '95% reduction in processing friction'
    },
    {
      metric: 'Annual Administrative Payroll Overhead',
      before: '$68,000/yr per 50 agents spent on manual data entry',
      after: '$26,000/yr operating cost with Shapework OS automation',
      gain: '$42,000 net savings / 50 agents / year'
    },
    {
      metric: 'Agent Retention Rate',
      before: '74% annual retention due to back-office processing delays',
      after: '94% annual retention driven by fast payouts & seamless support',
      gain: '+20% improvement in agent retention'
    }
  ];

  const expansionRoadmap = [
    {
      phase: 'Phase 1 — Launch & Anchor',
      timeline: 'Q1 – Q2 2026',
      markets: 'Wilmington & Triangle NC (Nest Realty, Intracoastal, Landmark)',
      focus: 'Anchor Pilot Validation & CDA Auto-Audit Engine',
      status: 'Active Launch'
    },
    {
      phase: 'Phase 2 — Regional Expansion',
      timeline: 'Q3 – Q4 2026',
      markets: 'Charlotte & Triad NC (Allen Tate, Helen Adams, Cottingham Chalk)',
      focus: 'Multi-Office Franchise Hubs & High-Volume CDAs',
      status: 'Pipeline Pre-Launch'
    },
    {
      phase: 'Phase 3 — South Carolina & Coast',
      timeline: 'Q1 – Q2 2027',
      markets: 'Upstate SC & Lowcountry (Charleston, Greenville, Hilton Head)',
      focus: 'Boutique Luxury & Vendor Dispatch Workflows',
      status: 'Target Horizon'
    },
    {
      phase: 'Phase 4 — Tidewater & Virginia',
      timeline: 'Q3 – Q4 2027',
      markets: 'Richmond, Norfolk & Tidewater VA (Joyner, Long & Foster hubs)',
      focus: 'Full State Multi-Entity Compliance Engine',
      status: 'Target Horizon'
    }
  ];

  const filteredSegments = activeSegment === 'all' 
    ? targetBrokerageSegments 
    : targetBrokerageSegments.filter(s => s.id === activeSegment);

  return (
    <div className="space-y-6 text-left font-sans text-xs text-slate-800 animate-fade-in">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 rounded-3xl p-6 gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-base text-slate-900 font-sans">Shapework Real Estate Market Research</h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Market opportunity analysis, brokerage tech stack benchmarks, financial ROI models, and regional expansion roadmap for the internal Shapework team.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 select-none">
          <button 
            onClick={() => onNavigateTab('Customer Survey Studio')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-900 border border-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 text-slate-700" />
            <span>Customer Survey Studio</span>
          </button>
          <button
            onClick={() => onNavigateTab('Brokerage Accounts & Setup')}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm select-none"
          >
            <Building className="w-4 h-4" />
            <span>Brokerage Accounts</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Target Market (SAM)</span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold text-slate-900 font-mono">{marketMetrics.sam}</span>
            <span className="text-[10px] text-emerald-700 font-mono font-bold">Brokerages</span>
          </div>
          <span className="text-[10px] text-slate-500 block">US Independent & Regional Mid-Sized Brokerages</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Annual Financial Impact</span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold text-slate-900 font-mono">$42k</span>
            <span className="text-[10px] text-emerald-700 font-mono font-bold">/ Brokerage / Yr</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Net administrative overhead savings per 50 agents</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">BIC Audit Speed</span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold text-emerald-700 font-mono">{marketMetrics.slaTurnaround}</span>
            <span className="text-[10px] text-emerald-700 font-mono font-bold">(from 72 hrs)</span>
          </div>
          <span className="text-[10px] text-emerald-800 font-semibold block">95% reduction in compliance review cycle</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Agent Retention Impact</span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold text-slate-900 font-mono">{marketMetrics.retentionBoost}</span>
            <span className="text-[10px] text-emerald-700 font-mono font-bold">Retention</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Driven by fast CDA payouts & 1-click onboarding</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
        <button
          onClick={() => setActiveResearchTab('overview')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeResearchTab === 'overview'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Market Overview & Segments
        </button>
        <button
          onClick={() => setActiveResearchTab('tech_matrix')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeResearchTab === 'tech_matrix'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Tech Stack Disruption Matrix
        </button>
        <button
          onClick={() => setActiveResearchTab('roi_model')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeResearchTab === 'roi_model'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Financial ROI & Time Savings Model
        </button>
        <button
          onClick={() => setActiveResearchTab('expansion')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeResearchTab === 'expansion'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Regional Expansion Roadmap
        </button>
      </div>

      {/* TAB 1: MARKET OVERVIEW & SEGMENTS */}
      {activeResearchTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Target Brokerage Profiles</h3>
                <p className="text-xs text-slate-500 mt-0.5">High-fit brokerage segments for Shapework Operating System adoption.</p>
              </div>
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button 
                  onClick={() => setActiveSegment('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeSegment === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setActiveSegment('independent')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeSegment === 'independent' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Independent
                </button>
                <button 
                  onClick={() => setActiveSegment('regional')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeSegment === 'regional' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Regional
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredSegments.map(seg => (
                <div key={seg.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 hover:bg-slate-100/60 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-slate-700" />
                      <h4 className="font-bold text-slate-900 text-sm">{seg.name}</h4>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold font-mono">
                      Fit Score: {seg.fitScore}/100
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Size</span>
                      <span className="font-bold text-slate-900">{seg.size}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Legacy Tech</span>
                      <span className="font-medium text-slate-700">{seg.techStack}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Primary Friction</span>
                      <span className="font-medium text-slate-900">{seg.primaryFriction}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Financial Impact</span>
                      <span className="font-bold text-emerald-700">{seg.financialSavings}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">US Brokerage Market Breakdown</h3>
                <p className="text-xs text-slate-500 mt-0.5">Addressable market opportunity.</p>
              </div>
              <PieChart className="w-5 h-5 text-slate-700" />
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-xs">Total Addressable Market (TAM)</span>
                  <span className="font-bold font-mono text-slate-900">106,000</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Total active real estate brokerages in the United States operating 1 or more office locations.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-xs">Serviceable Addressable Market (SAM)</span>
                  <span className="font-bold font-mono text-emerald-700">28,500</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Mid-sized independent and regional franchises (15 – 250 active agents) with high transaction velocity.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-900 text-xs">Phase 1 Target Market (SOM)</span>
                  <span className="font-bold font-mono text-emerald-800">1,250</span>
                </div>
                <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                  Southeast & Mid-Atlantic independent brokerages operating in NC, SC, VA, TN, and GA.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TECH STACK DISRUPTION MATRIX */}
      {activeResearchTab === 'tech_matrix' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Real Estate Tech Stack Disruption Matrix</h3>
              <p className="text-xs text-slate-500 mt-0.5">How Shapework OS solves the systemic gaps of fragmented legacy tools.</p>
            </div>
            <Award className="w-5 h-5 text-slate-700" />
          </div>

          <div className="space-y-4">
            {techStackComparison.map(comp => (
              <div key={comp.category} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 text-xs font-sans">{comp.category}</h4>
                  <span className="px-2.5 py-0.5 bg-slate-200/80 text-slate-700 rounded text-[10px] font-bold font-mono">
                    Legacy: {comp.legacyStack}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Legacy Approach</span>
                    <p className="text-slate-700 font-medium">{comp.legacyMethod}</p>
                  </div>
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Shapework Operating System</span>
                    <p className="text-slate-900 font-bold">{comp.shapeworkOS}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 pt-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>Competitive Advantage: {comp.advantage}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: FINANCIAL ROI & TIME SAVINGS MODEL */}
      {activeResearchTab === 'roi_model' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="font-bold text-sm text-slate-900">Financial ROI & Time Savings Model</h3>
            <p className="text-xs text-slate-500 mt-0.5">Quantified operational savings for a standard 50-agent brokerage deployment.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roiCalculations.map(roi => (
              <div key={roi.metric} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">{roi.metric}</h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600">
                    <span>Before Shapework:</span>
                    <span className="font-medium text-slate-900">{roi.before}</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-slate-900 font-bold">
                    <span>With Shapework OS:</span>
                    <span className="text-emerald-800">{roi.after}</span>
                  </div>
                </div>

                <div className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-between font-mono">
                  <span>Net Efficiency Gain:</span>
                  <span className="text-emerald-400">{roi.gain}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: REGIONAL EXPANSION ROADMAP */}
      {activeResearchTab === 'expansion' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="font-bold text-sm text-slate-900">Regional Expansion Roadmap</h3>
            <p className="text-xs text-slate-500 mt-0.5">Target geographic rollout timeline across Southeast independent brokerages.</p>
          </div>

          <div className="space-y-4">
            {expansionRoadmap.map(item => (
              <div key={item.phase} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{item.phase}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      item.status === 'Active Launch' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{item.markets}</p>
                  <p className="text-[11px] text-slate-500">{item.focus}</p>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-xs font-bold font-mono text-slate-900 block">{item.timeline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
