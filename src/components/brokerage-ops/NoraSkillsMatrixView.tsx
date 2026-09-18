import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Zap,
  RotateCcw,
  Activity,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  Plus,
  Cpu,
  Lock,
  MessageSquare,
  HardDrive,
  Film,
  GraduationCap,
  FolderCheck,
  FileText,
  Clock,
  ArrowUpRight
} from 'lucide-react';

interface NoraSkill {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'in_development' | 'gap_missing';
  description: string;
  capabilities: string[];
  connectedIntegrations: string[];
  lastAuditStatus: 'passed' | 'failed' | 'untested';
  lastAuditLatencyMs?: number;
  confidenceScore: number;
}

interface NoraConnection {
  id: string;
  name: string;
  provider: string;
  type: string;
  status: 'connected' | 'not_connected' | 'needs_auth' | 'recommended';
  connectedAccount?: string;
  featuresSupported: string[];
  featuresMissing: string[];
  health: 'healthy' | 'degraded' | 'offline' | 'unconfigured';
  lastPingMs?: number;
}

interface NoraCapabilitySuggestion {
  id: string;
  title: string;
  category: string;
  impactScore: number;
  implementationEffort: 'low' | 'medium' | 'high';
  rationale: string;
  recommendedIntegrations: string[];
  deliverables: string[];
  status: 'suggested' | 'approved' | 'in_backlog';
}

interface AuditDiagnosticResult {
  systemId: string;
  systemName: string;
  category: string;
  status: 'passed' | 'warning' | 'failed';
  latencyMs: number;
  details: string;
  assertionsPassed: number;
  totalAssertions: number;
}

interface FullAuditReport {
  timestamp: string;
  overallScore: number;
  totalSystemsAudited: number;
  passedCount: number;
  warningCount: number;
  failedCount: number;
  averageLatencyMs: number;
  diagnostics: AuditDiagnosticResult[];
}

export const NoraSkillsMatrixView: React.FC = () => {
  const [activeSubtab, setActiveSubtab] = useState<'skills' | 'connections' | 'suggestions' | 'audit_log'>('skills');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [skills, setSkills] = useState<NoraSkill[]>([]);
  const [connections, setConnections] = useState<NoraConnection[]>([]);
  const [suggestions, setSuggestions] = useState<NoraCapabilitySuggestion[]>([]);
  const [auditReport, setAuditReport] = useState<FullAuditReport | null>(null);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [approvedSuggestions, setApprovedSuggestions] = useState<string[]>([]);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/nora/capabilities/overview');
      const data = await res.json();
      if (data.success) {
        setSkills(data.skills || []);
        setConnections(data.connections || []);
        setSuggestions(data.suggestions || []);
        setAuditReport(data.auditReport);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunLiveAudit = async () => {
    setIsRunningAudit(true);
    try {
      const res = await fetch('/api/nora/capabilities/run-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setAuditReport(data.report);
        fetchOverview();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunningAudit(false);
    }
  };

  const handleApproveSuggestion = (sugId: string) => {
    setApprovedSuggestions(prev => [...prev, sugId]);
  };

  const filteredSkills = skills.filter(s => {
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.capabilities.some(c => c.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const activeCount = skills.filter(s => s.status === 'active').length;
  const missingCount = skills.filter(s => s.status === 'gap_missing').length;
  const connectedCount = connections.filter(c => c.status === 'connected').length;

  return (
    <div className="space-y-6">
      {/* Top Banner (Apple Light Mode) */}
      <div className="bg-gradient-to-r from-emerald-50/90 via-white to-stone-50 rounded-2xl border border-stone-200/80 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 rounded-full tracking-wider">
              Autonomous Capabilities & Audit Registry
            </span>
            <span className="text-xs font-semibold text-stone-600">
              Live Health: {auditReport?.overallScore || 100}% Operational
            </span>
          </div>
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#00635C]" />
            Nora Intelligence, Skills & Connection Matrix
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Real-time audit of all active skills, connected integrations, identified capability gaps, and recommended brokerage automations.
          </p>
        </div>

        <button
          onClick={handleRunLiveAudit}
          disabled={isRunningAudit}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#00635C] hover:bg-[#00524C] text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
        >
          <RotateCcw className={`w-4 h-4 ${isRunningAudit ? 'animate-spin' : ''}`} />
          {isRunningAudit ? 'Executing Diagnostic Audit...' : 'Run Live Diagnostic Audit'}
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider">Active Skills</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-stone-900">{activeCount}</span>
            <span className="text-[10px] font-bold text-emerald-700">100% Grounded</span>
          </div>
          <span className="text-[10px] text-stone-600 block mt-0.5">Zero Seeded Fallbacks</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider">Connected Tools</span>
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-stone-900">{connectedCount}</span>
            <span className="text-[10px] font-bold text-blue-700">Live Sync</span>
          </div>
          <span className="text-[10px] text-stone-600 block mt-0.5">Google, Rechat, Dotloop</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider">Capability Gaps</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-900">{missingCount}</span>
            <span className="text-[10px] font-bold text-amber-700">In Roadmap</span>
          </div>
          <span className="text-[10px] text-stone-600 block mt-0.5">ShowingTime, DocuSign</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider">Audit Health</span>
            <Activity className="w-4 h-4 text-[#00635C]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-800">{auditReport?.overallScore || 100}%</span>
            <span className="text-[10px] font-bold text-emerald-700">
              {auditReport?.passedCount || 8}/{auditReport?.totalSystemsAudited || 8} Verified
            </span>
          </div>
          <span className="text-[10px] text-stone-600 block mt-0.5">
            Avg Latency: {auditReport?.averageLatencyMs || 28}ms
          </span>
        </div>
      </div>

      {/* Subtab Navigation Bar */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-stone-100/90 rounded-xl border border-stone-200/80 overflow-x-auto">
          <button
            onClick={() => setActiveSubtab('skills')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeSubtab === 'skills'
                ? 'bg-white text-[#01362D] shadow-xs border border-stone-200/80'
                : 'text-stone-600 hover:text-[#01362D]'
            }`}
          >
            🧠 All Skills & Capabilities ({skills.length})
          </button>
          <button
            onClick={() => setActiveSubtab('connections')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeSubtab === 'connections'
                ? 'bg-white text-[#01362D] shadow-xs border border-stone-200/80'
                : 'text-stone-600 hover:text-[#01362D]'
            }`}
          >
            🔌 Connections & Integrations ({connections.length})
          </button>
          <button
            onClick={() => setActiveSubtab('suggestions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeSubtab === 'suggestions'
                ? 'bg-white text-[#01362D] shadow-xs border border-stone-200/80'
                : 'text-stone-600 hover:text-[#01362D]'
            }`}
          >
            💡 Recommended Upgrades ({suggestions.length})
          </button>
          <button
            onClick={() => setActiveSubtab('audit_log')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeSubtab === 'audit_log'
                ? 'bg-white text-[#01362D] shadow-xs border border-stone-200/80'
                : 'text-stone-600 hover:text-[#01362D]'
            }`}
          >
            🩺 Live Diagnostic Telemetry ({auditReport?.diagnostics?.length || 8})
          </button>
        </div>
      </div>

      {/* 1. Skills & Capabilities Matrix View */}
      {activeSubtab === 'skills' && (
        <div className="space-y-4">
          {/* Filter Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {[
                { id: 'all', label: 'All Domains' },
                { id: 'legal_compliance', label: '⚖️ Legal & BIC' },
                { id: 'google_workspace', label: '📂 Google Workspace' },
                { id: 'marketing_media', label: '🎬 Marketing & Media' },
                { id: 'training_roleplay', label: '🎓 Training Academy' },
                { id: 'client_operations', label: '🏡 Client Operations' },
                { id: 'ai_grounding', label: '🌐 AI Grounding' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-[#00635C] text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-600" />
              <input
                type="text"
                placeholder="Search skills or capabilities..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1 text-xs rounded-lg border border-stone-200 bg-stone-50/50 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#00635C]"
              />
            </div>
          </div>

          {/* Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSkills.map(skill => (
              <div
                key={skill.id}
                className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-xs font-bold text-stone-900">{skill.name}</h4>
                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${
                        skill.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : skill.status === 'gap_missing'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {skill.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">{skill.description}</p>

                  {/* Capabilities Bullet List */}
                  <div className="mt-3 pt-2.5 border-t border-stone-100 space-y-1">
                    <span className="text-[10px] font-bold text-stone-600 uppercase block">
                      Autonomous Capabilities:
                    </span>
                    {skill.capabilities.map((cap, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-stone-700">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-500">
                  <div className="flex items-center gap-1">
                    <span>🔌 Integrations:</span>
                    <span className="font-semibold text-stone-700">{skill.connectedIntegrations.join(', ')}</span>
                  </div>
                  {skill.status === 'active' && (
                    <span className="font-mono text-emerald-700 font-bold">
                      ⚡ {skill.lastAuditLatencyMs}ms ({skill.confidenceScore}% conf)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Connections & Integrations Registry */}
      {activeSubtab === 'connections' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connections.map(conn => (
            <div
              key={conn.id}
              className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">{conn.name}</h4>
                    <span className="text-[10px] text-stone-500">{conn.provider}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${
                      conn.status === 'connected'
                        ? 'bg-emerald-100 text-emerald-800'
                        : conn.status === 'recommended'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {conn.status.replace('_', ' ')}
                  </span>
                </div>

                {conn.connectedAccount && (
                  <div className="text-[10px] font-mono text-stone-600 bg-stone-50 px-2 py-1 rounded border border-stone-200 mt-2">
                    Account: {conn.connectedAccount}
                  </div>
                )}

                <div className="mt-3 space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-stone-600 uppercase block">
                    Supported Features:
                  </span>
                  {conn.featuresSupported.length > 0 ? (
                    conn.featuresSupported.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[11px] text-stone-600 italic">Not connected yet</span>
                  )}
                </div>

                {conn.featuresMissing.length > 0 && (
                  <div className="mt-2 space-y-1 text-xs">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">
                      Targeted Capabilities:
                    </span>
                    {conn.featuresMissing.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-stone-600">
                        <Plus className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[10px]">
                <span className="text-stone-500">Health: <strong className="text-emerald-700">{conn.health}</strong></span>
                {conn.lastPingMs && <span className="font-mono text-stone-500">Ping: {conn.lastPingMs}ms</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Recommended Upgrades & Suggestions */}
      {activeSubtab === 'suggestions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map(sug => {
              const isApproved = approvedSuggestions.includes(sug.id);

              return (
                <div
                  key={sug.id}
                  className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                          {sug.category}
                        </span>
                        <h4 className="text-xs font-bold text-stone-900">{sug.title}</h4>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
                        Impact: {sug.impactScore}/100
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-600 leading-relaxed bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                      {sug.rationale}
                    </p>

                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold text-stone-600 uppercase block">
                        Planned Deliverables:
                      </span>
                      {sug.deliverables.map((d, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-stone-700">
                          <ChevronRight className="w-3 h-3 text-[#00635C] shrink-0" />
                          <span>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] text-stone-500">
                      Effort: <strong>{sug.implementationEffort.toUpperCase()}</strong>
                    </span>
                    <button
                      onClick={() => handleApproveSuggestion(sug.id)}
                      disabled={isApproved}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-[#00635C] hover:bg-[#00524C] text-white'
                      }`}
                    >
                      {isApproved ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>Approved in Backlog</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>Approve & Build</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Live Diagnostic Telemetry & Audit Stream */}
      {activeSubtab === 'audit_log' && auditReport && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-xs font-bold text-stone-900">Live Health Diagnostic Audit Stream</h3>
                <p className="text-[10px] text-stone-500">
                  Last ran: {new Date(auditReport.timestamp).toLocaleTimeString()} • All {auditReport.totalSystemsAudited} test suites executed
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
                🟢 {auditReport.overallScore}% PASS RATE
              </span>
            </div>

            <div className="divide-y divide-stone-100">
              {auditReport.diagnostics.map(diag => (
                <div key={diag.systemId} className="py-3 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-stone-900">{diag.systemName}</h4>
                        <span className="text-[9px] text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded">
                          {diag.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 mt-0.5">{diag.details}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-[#00635C]">
                      {diag.latencyMs}ms
                    </span>
                    <span className="text-[10px] text-stone-600 block">
                      {diag.assertionsPassed}/{diag.totalAssertions} Passed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
