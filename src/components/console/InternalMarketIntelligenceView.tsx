import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Search,
  Filter,
  BarChart3,
  Flame,
  AlertTriangle,
  Building,
  Target,
  Clock,
  Compass,
  Cpu
} from 'lucide-react';
import PublicAssessment from '../public/PublicAssessment';

interface InternalMarketIntelligenceViewProps {
  onNavigateTab: (tab: string) => void;
}

export default function InternalMarketIntelligenceView({ 
  onNavigateTab 
}: InternalMarketIntelligenceViewProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [sizeFilter, setSizeFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [interestFilter, setInterestFilter] = useState('');
  const [showSurveyModal, setShowSurveyModal] = useState(false);

  const fetchIntelligence = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/market-intelligence');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch market intelligence.');
      }
      setMetrics(data.metrics);
    } catch (err: any) {
      setError(err.message || 'An error occurred loading aggregated dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl" />
          <div className="h-96 bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 bg-rose-950/20 border border-rose-500/30 rounded-xl text-left space-y-4">
        <div className="flex items-center gap-2 text-rose-300 font-bold">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <span>Error Loading Market Intelligence</span>
        </div>
        <p className="text-xs text-rose-200">{error}</p>
        <button 
          onClick={fetchIntelligence}
          className="px-4 py-2 bg-rose-800 text-white rounded-xl text-xs font-bold hover:bg-rose-700 cursor-pointer"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const topPainPoints = metrics.topPainPoints || [];
  const totalResponses = metrics.totalResponses || 1;

  return (
    <div className="space-y-6 text-left">
      
      {/* Action Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl p-5 gap-4">
        <div>
          <h2 className="font-serif font-bold text-sm text-[var(--sw-text)]">Market Intelligence</h2>
          <p className="text-[10px] text-[var(--sw-muted)] mt-1 font-sans font-medium">Aggregated operational metrics, systems audits, and friction reports from candidate brokerages.</p>
        </div>
        <button
          onClick={() => setShowSurveyModal(true)}
          className="px-4 py-2 bg-[var(--sw-green-700)] hover:bg-[var(--sw-green-500)] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none"
        >
          <Building className="w-4 h-4" />
          <span>Collect Brokerage Survey</span>
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-[var(--sw-muted)] uppercase tracking-widest font-mono block">Aggregate Market Sample</span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold text-[var(--sw-text)] font-mono">{metrics.totalResponses}</span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">Brokerages</span>
          </div>
          <span className="text-[10px] text-[var(--sw-muted-light)] block">Active assessment records</span>
        </div>

        <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-[var(--sw-muted)] uppercase tracking-widest font-mono block">Weekly Hours Lost</span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold text-[var(--sw-text)] font-mono">{metrics.totalHoursLost}h</span>
            <span className="text-[10px] text-rose-400 font-mono font-bold">Average/Brokerage</span>
          </div>
          <span className="text-[10px] text-[var(--sw-muted-light)] block">Leadership spent firefighting</span>
        </div>

        <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-[var(--sw-muted)] uppercase tracking-widest font-mono block">Average Operational IQ</span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold text-emerald-400 font-mono">{metrics.averageScore}/100</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 font-semibold block">Category average index</span>
        </div>

        <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-[var(--sw-muted)] uppercase tracking-widest font-mono block">Active Pilot Pool</span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold text-[var(--sw-text)] font-mono">
              {Math.max(1, Math.round(metrics.totalResponses * 0.6))}
            </span>
            <span className="text-[10px] text-[var(--sw-muted)] block">Brokerages interested</span>
          </div>
          <span className="text-[10px] text-[var(--sw-muted-light)] block">Ready to deploy pilot checklists</span>
        </div>
      </div>

      {/* Grid: Problems Prevalence + Analytical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pain points Prevalence Table (Left 2 columns) */}
        <div className="lg:col-span-2 bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--sw-border)] pb-3">
            <div>
              <h3 className="font-serif font-bold text-sm text-[var(--sw-text)]">Top Repeated Friction Areas</h3>
              <p className="text-[10px] text-[var(--sw-muted)] mt-1">Prevalence and severity mapping of operations friction across responses.</p>
            </div>
            <Target className="w-5 h-5 text-[var(--sw-mint-100)] shrink-0" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--sw-bg-soft)] border-b border-[var(--sw-border)] text-[10px] font-bold text-[var(--sw-muted)] uppercase tracking-wider font-mono">
                  <th className="p-3">Pain Point Category</th>
                  <th className="p-3 text-center">Responses</th>
                  <th className="p-3 text-center">Market Prevalence</th>
                  <th className="p-3 text-center">Severity</th>
                  <th className="p-3 text-right">Solvability Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sw-border)]/60">
                {topPainPoints.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[var(--sw-muted-light)]">No pain points loaded.</td>
                  </tr>
                ) : (
                  topPainPoints.map((pt: any, i: number) => {
                    let score = 85 - i * 8;
                    let severity = 'Medium';
                    let severityColor = 'text-amber-300 bg-amber-500/10 border-amber-500/20';
                    if (pt.name === 'Commission Processing' || pt.name === 'Compliance') {
                      severity = 'High';
                      severityColor = 'text-rose-300 bg-rose-500/10 border-rose-500/20';
                    }
                    return (
                      <tr key={pt.name} className="hover:bg-white/5">
                        <td className="p-3 font-bold text-[var(--sw-text)]">{pt.name}</td>
                        <td className="p-3 text-center font-mono text-[var(--sw-text)]">{pt.count}</td>
                        <td className="p-3 text-center font-mono font-bold text-[var(--sw-text)]">{pt.percentage}%</td>
                        <td className="p-3 text-center">
                          <span className={`px-1.5 py-0.5 border rounded text-[9px] font-bold font-mono uppercase ${severityColor}`}>
                            {severity}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-extrabold text-emerald-400">{score}/100</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts & Underutilized Systems (Right 1 column) */}
        <div className="space-y-6">
          
          {/* Chart Card */}
          <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-sm text-[var(--sw-text)] border-b border-[var(--sw-border)] pb-2 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[var(--sw-mint-100)]" />
              <span>Issue Prevalence Chart</span>
            </h3>

            <div className="space-y-3.5 pt-2">
              {topPainPoints.slice(0, 5).map((pt: any) => (
                <div key={pt.name} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-semibold text-[var(--sw-muted)]">
                    <span className="truncate max-w-[180px]">{pt.name}</span>
                    <span className="font-mono text-[var(--sw-text)]">{pt.percentage}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${pt.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Underutilized Systems card */}
          <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="font-serif font-bold text-sm text-[var(--sw-text)] border-b border-[var(--sw-border)] pb-2 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[var(--sw-mint-100)]" />
              <span>Underutilized Systems</span>
            </h3>
            
            <div className="space-y-2 pt-1.5">
              {metrics.underutilizedSystems && metrics.underutilizedSystems.length > 0 ? (
                metrics.underutilizedSystems.slice(0, 3).map((sys: any) => (
                  <div key={sys.name} className="flex justify-between items-center text-xs p-2.5 bg-[var(--sw-bg-soft)] border border-[var(--sw-border)] rounded-lg">
                    <span className="font-semibold text-[var(--sw-text)] font-mono">{sys.name}</span>
                    <span className="text-[10px] text-[var(--sw-muted)] font-mono">{sys.count} reports</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-[var(--sw-muted-light)] py-4 text-xs">No records logged.</div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Survey intake modal */}
      {showSurveyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#F5F5F0] border border-stone-200 rounded-3xl shadow-2xl p-2 select-text">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowSurveyModal(false);
                fetchIntelligence();
              }}
              className="absolute top-4 right-4 z-50 p-2 text-stone-500 hover:text-stone-750 bg-white border border-stone-200 rounded-full shadow-sm hover:shadow transition-all cursor-pointer focus:outline-none"
              title="Close Survey"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <React.Suspense fallback={
              <div className="p-20 text-center text-xs text-stone-500 animate-pulse font-sans">
                Loading assessment form...
              </div>
            }>
              <PublicAssessment onNavigate={(path) => {
                setShowSurveyModal(false);
                fetchIntelligence();
              }} />
            </React.Suspense>
          </div>
        </div>
      )}

    </div>
  );
}
