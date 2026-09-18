/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Recruiting & MLS Market Share Command Center
 * Executive intelligence console for the brokerage owner (Ryan Crecelius) to track
 * Cape Fear MLS market share, monitor competitor luxury producers, and dispatch
 * Nora personalized recruiting pitches showing exact financial gains at Nest Realty.
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Award, 
  Sparkles, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Copy, 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  BarChart3, 
  ShieldCheck, 
  Briefcase, 
  Bot, 
  X, 
  RefreshCw,
  Building2,
  PieChart
} from 'lucide-react';
import { 
  RecruitingAndMarketShareRepository, 
  BrokerageMarketShare, 
  CompetitorAgentCandidate, 
  AgentRecruitingSavingsAnalysis 
} from '../../../server/persistence/recruitingAndMarketShareRepository';
import { useToast } from '../ui';

export const RecruitingAndMarketShareCommandCenter: React.FC = () => {
  const { toast } = useToast();
  const [rankings, setRankings] = useState<BrokerageMarketShare[]>([]);
  const [candidates, setCandidates] = useState<CompetitorAgentCandidate[]>([]);
  const [selectedBrokerageFilter, setSelectedBrokerageFilter] = useState<string>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<CompetitorAgentCandidate | null>(null);
  const [savingsAnalysis, setSavingsAnalysis] = useState<AgentRecruitingSavingsAnalysis | null>(null);
  const [generatedPitch, setGeneratedPitch] = useState<{
    subjectLine: string;
    emailBody: string;
    phoneScript: string;
    financialGainSummary: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Try API route first
      let rData: BrokerageMarketShare[] | null = null;
      let cData: CompetitorAgentCandidate[] | null = null;
      try {
        const [rRes, cRes] = await Promise.all([
          fetch('/api/recruiting/market-share'),
          fetch('/api/recruiting/candidates')
        ]);
        if (rRes.ok && cRes.ok) {
          const rJson = await rRes.json();
          const cJson = await cRes.json();
          rData = rJson.rankings;
          cData = cJson.candidates;
        }
      } catch {
        rData = null;
        cData = null;
      }

      // Fallback to client repository
      if (!rData) rData = RecruitingAndMarketShareRepository.getMarketShareRankings();
      if (!cData) cData = RecruitingAndMarketShareRepository.getCandidates();

      setRankings(rData);
      setCandidates(cData);
    } catch (err: any) {
      toast.error({
        title: 'Data Load Error',
        description: err.message || 'Unable to load recruiting data.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCandidate = (cand: CompetitorAgentCandidate) => {
    setSelectedCandidate(cand);
    const savings = RecruitingAndMarketShareRepository.calculateRecruitingSavings(cand.id);
    const pitch = RecruitingAndMarketShareRepository.generateRecruitingPitch(cand.id);
    setSavingsAnalysis(savings);
    setGeneratedPitch(pitch);
  };

  const handleCopyPitch = () => {
    if (!generatedPitch) return;
    navigator.clipboard.writeText(generatedPitch.emailBody);
    toast.success({
      title: 'Recruiting Email Copied',
      description: `Personalized outreach note for ${selectedCandidate?.name} copied to clipboard!`
    });
  };

  const handleCopyScript = () => {
    if (!generatedPitch) return;
    navigator.clipboard.writeText(generatedPitch.phoneScript);
    toast.success({
      title: 'Phone Script Copied',
      description: `Call script with financial proof points copied to clipboard!`
    });
  };

  const handleUpdateStatus = (status: CompetitorAgentCandidate['pipelineStatus']) => {
    if (!selectedCandidate) return;
    const updated = RecruitingAndMarketShareRepository.updateCandidateStatus(
      selectedCandidate.id, 
      status, 
      `Stage advanced to ${status.replace('_', ' ').toUpperCase()} by Ryan.`
    );
    if (updated) {
      setSelectedCandidate({ ...updated });
      setCandidates(prev => prev.map(c => c.id === updated.id ? updated : c));
      toast.success({
        title: 'Recruiting Stage Updated',
        description: `${updated.name} moved to ${status.replace('_', ' ').toUpperCase()}.`
      });
    }
  };

  const filteredCandidates = candidates.filter(c => {
    if (selectedBrokerageFilter === 'all') return true;
    return c.currentBrokerage.toLowerCase().includes(selectedBrokerageFilter.toLowerCase());
  });

  const totalTargetVolume = candidates.reduce((sum, c) => sum + c.annualClosedVolume, 0);
  const nestRank = rankings.find(r => r.isNestRealty);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 text-left font-sans animate-fadeIn">
      
      {/* 1. Brokerage Owner Executive Hero Banner */}
      <div className="w-full bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#00635C]/30 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Executive Owner Intelligence
              </span>
              <span className="bg-white/10 text-slate-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Cape Fear REALTORS® (CFR) MLS
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              MLS Market Share & Luxury Producer Recruiting Radar
            </h1>
            <p className="text-sm text-slate-300">
              Track regional market dominance, monitor high-producing luxury agents at Sotheby's and Intracoastal, and dispatch Nora personalized value-proposition pitches showing exact take-home financial gains at Nest Realty.
            </p>
          </div>

          {/* KPI Header Grid */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3.5 rounded-2xl">
              <div className="text-[10px] font-bold text-slate-300 uppercase">Nest 12-Mo Volume</div>
              <div className="text-xl font-black text-white font-mono mt-0.5">$142.5M</div>
              <div className="text-[11px] text-emerald-400 font-semibold">#1 Luxury Avg ($945k)</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3.5 rounded-2xl">
              <div className="text-[10px] font-bold text-slate-300 uppercase">Target Pipeline Volume</div>
              <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                ${(totalTargetVolume / 1000000).toFixed(1)}M
              </div>
              <div className="text-[11px] text-slate-300 font-semibold">4 High-Priority Recruits</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Cape Fear MLS Market Share Comparison Card */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#00635C]" />
            <h2 className="text-sm font-extrabold text-slate-900">
              Cape Fear MLS Brokerage Market Share Rankings (12-Month Closed Volume)
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-400">Total Market: $1.70B</span>
        </div>

        {/* Visual Market Share Progress Bars */}
        <div className="space-y-3">
          {rankings.map((r, idx) => (
            <div key={r.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono w-4">#{idx + 1}</span>
                  <span className={r.isNestRealty ? 'text-[#00635C] font-black' : 'text-slate-800'}>
                    {r.name}
                  </span>
                  {r.isNestRealty && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">
                      OUR FIRM
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-slate-600 font-mono">
                  <span>${(r.closedVolume12Mo / 1000000).toFixed(1)}M</span>
                  <span className="text-slate-900 font-bold w-12 text-right">{r.marketSharePercent}%</span>
                </div>
              </div>
              
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    r.isNestRealty 
                      ? 'bg-[#00635C]' 
                      : idx === 0 ? 'bg-slate-700' : 'bg-slate-400'
                  }`}
                  style={{ width: `${(r.marketSharePercent / 20) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Competitor Luxury Producer Radar & Candidate Cards */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00635C]" />
            <h2 className="text-base font-extrabold text-slate-900">
              High-Priority Luxury Competitor Producer Radar
            </h2>
          </div>

          {/* Brokerage Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Filter Firm:</span>
            {['all', 'Sotheby', 'Intracoastal', 'Sea Coast'].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setSelectedBrokerageFilter(f)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedBrokerageFilter === f
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f === 'all' ? 'All Competitors' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Candidate Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCandidates.map(cand => {
            const savings = RecruitingAndMarketShareRepository.calculateRecruitingSavings(cand.id);
            return (
              <div 
                key={cand.id}
                onClick={() => handleSelectCandidate(cand)}
                className="bg-white border border-slate-200 hover:border-[#00635C] rounded-3xl p-5 shadow-xs hover:shadow-md transition cursor-pointer space-y-4 relative group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#00635C] transition">
                      {cand.name}
                    </h3>
                    <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cand.currentBrokerage}</span>
                    </div>
                  </div>

                  {/* Transition Readiness Pill */}
                  <div className="text-right">
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-full font-mono">
                      {cand.transitionReadinessScore}/100 Readiness
                    </span>
                    <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
                      {cand.pipelineStatus.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-3 gap-2 text-center bg-[#F7F8F5] p-3 rounded-2xl border border-slate-100">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">12-Mo Volume</div>
                    <div className="text-xs font-black text-slate-900 font-mono mt-0.5">
                      ${(cand.annualClosedVolume / 1000000).toFixed(1)}M
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Sides</div>
                    <div className="text-xs font-black text-slate-900 font-mono mt-0.5">
                      {cand.closedSides12Mo} Deals
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-emerald-700 uppercase">Gain at Nest</div>
                    <div className="text-xs font-black text-[#00635C] font-mono mt-0.5">
                      +${(savings?.totalAnnualFinancialGain || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Submarket & Pain Points */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="text-[11px] font-bold text-slate-400">Territory:</span>
                    <span>{cand.primarySubmarket}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {cand.painPoints.slice(0, 2).map((p, idx) => (
                      <span key={idx} className="bg-amber-50 text-amber-900 border border-amber-200/80 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                        ⚠️ {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Trigger */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#00635C]">
                  <span>Generate Nora Value Pitch</span>
                  <ChevronRight className="w-4 h-4 text-[#00635C] group-hover:translate-x-1 transition" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Candidate Deep-Dive & Nora Value Pitch Drawer */}
      {selectedCandidate && savingsAnalysis && generatedPitch && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scaleIn">
            
            {/* Drawer Header */}
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full font-mono">
                    {selectedCandidate.transitionReadinessScore}/100 Transition Score
                  </span>
                  <span className="text-xs text-slate-300 font-bold">
                    {selectedCandidate.currentBrokerage}
                  </span>
                </div>
                <h2 className="text-2xl font-black">{selectedCandidate.name}</h2>
                <p className="text-xs text-slate-300">
                  {selectedCandidate.primarySubmarket} • ${(selectedCandidate.annualClosedVolume / 1000000).toFixed(1)}M Volume ({selectedCandidate.closedSides12Mo} sides)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/10 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800">
              
              {/* Financial Take-Home Comparison Table */}
              <div className="bg-[#F7F8F5] border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                  <DollarSign className="w-4 h-4 text-[#00635C]" />
                  Annual Financial Take-Home Comparison
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Gross Commission (GCI)</div>
                    <div className="text-sm font-black text-slate-900 font-mono mt-0.5">
                      ${savingsAnalysis.grossCommissionIncome.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Current Take-Home</div>
                    <div className="text-sm font-black text-rose-700 font-mono mt-0.5">
                      ${savingsAnalysis.currentBrokerageTakeHome.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">After splits & desk fees</div>
                  </div>

                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase">Nest Realty Take-Home</div>
                    <div className="text-sm font-black text-[#00635C] font-mono mt-0.5">
                      ${savingsAnalysis.nestRealtyTakeHome.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-extrabold">
                      +${savingsAnalysis.totalAnnualFinancialGain.toLocaleString()}/yr GAIN
                    </div>
                  </div>
                </div>
              </div>

              {/* Nora Tailored Outreach Email Pitch */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                    <Bot className="w-4 h-4 text-[#00635C]" />
                    Nora Tailored Outreach Letter (Confidential from Ryan)
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPitch}
                    className="px-3 py-1 bg-[#00635C] hover:bg-[#004d47] text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Copy className="w-3 h-3" />
                    Copy Email
                  </button>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {generatedPitch.emailBody}
                </div>
              </div>

              {/* Nora Phone Call Script */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                    <Phone className="w-4 h-4 text-[#00635C]" />
                    Nora 30-Second Casual Call Script
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    Copy Script
                  </button>
                </div>

                <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl text-purple-950 font-sans text-xs italic leading-relaxed">
                  "{generatedPitch.phoneScript}"
                </div>
              </div>

              {/* Pipeline Stage Advance Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Update Candidate Pipeline Stage:
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(['identified', 'outreach_sent', 'meeting_scheduled', 'offer_extended', 'joined'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateStatus(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        selectedCandidate.pipelineStatus === st
                          ? 'bg-slate-900 text-white font-black shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {st === selectedCandidate.pipelineStatus ? '✓ ' : ''}
                      {st.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-[#F7F8F5] border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">Candidate ID: {selectedCandidate.id}</span>
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl cursor-pointer transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
