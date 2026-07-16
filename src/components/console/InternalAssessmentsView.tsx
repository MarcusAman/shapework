import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  FileText, 
  Share2, 
  ExternalLink,
  Clipboard,
  FileDown,
  Archive,
  Star,
  Users,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Building
} from 'lucide-react';
import PublicAssessment from '../public/PublicAssessment';

interface InternalAssessmentsViewProps {
  state: any;
  onNavigateTab: (tab: string) => void;
  setSelectedResponseId: (id: string | null) => void;
}

export default function InternalAssessmentsView({ 
  state, 
  onNavigateTab,
  setSelectedResponseId
}: InternalAssessmentsViewProps) {
  const [list, setList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);

  // Load responses from API
  const fetchResponses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/assessments');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch assessments.');
      }
      setList(data.list || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading assessment list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  const copyAssessmentLink = () => {
    const link = `${window.location.origin}/survey`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleExportCSV = (id: string) => {
    window.open(`/api/assessments/${id}/export/csv`, '_blank');
  };

  const handleExportAllCSV = () => {
    window.open('/api/assessments/export/csv', '_blank');
  };

  const handleViewDetail = (id: string) => {
    setSelectedResponseId(id);
    onNavigateTab('Assessment Detail');
    window.history.pushState({}, '', `/internal/assessments/${id}`);
  };

  // Filter list
  const filteredList = list.filter(item => {
    const matchesSearch = 
      item.brokerageName?.toLowerCase().includes(search.toLowerCase()) ||
      item.respondentName?.toLowerCase().includes(search.toLowerCase()) ||
      item.emailAddress?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || item.status === statusFilter;
    const matchesSize = !sizeFilter || item.numberOfAgents === sizeFilter;
    const matchesRole = !roleFilter || item.role === roleFilter;

    return matchesSearch && matchesStatus && matchesSize && matchesRole;
  });

  // Calculate Summary metrics from filtered list
  const totalResponses = filteredList.length;
  const completedCount = filteredList.filter(item => item.status === 'completed').length;
  const completionRate = totalResponses > 0 ? Math.round((completedCount / totalResponses) * 100) : 0;
  
  const brokeragesRepresented = new Set(filteredList.map(item => item.brokerageName)).size;
  
  let totalScore = 0;
  let scoredCount = 0;
  const painPointsMap: Record<string, number> = {};

  filteredList.forEach(item => {
    if (item.scores?.overallScore) {
      totalScore += item.scores.overallScore;
      scoredCount++;
    }
    const topIssue = item.answers?.greatestCostArea || item.internalClassification?.primaryPainCategory;
    if (topIssue) {
      painPointsMap[topIssue] = (painPointsMap[topIssue] || 0) + 1;
    }
  });

  const averageScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;
  
  let topIssue = 'None';
  let maxCount = 0;
  Object.entries(painPointsMap).forEach(([issue, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topIssue = issue;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-24 bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-950/20 border border-rose-500/30 rounded-xl text-left space-y-4">
        <div className="flex items-center gap-2 text-rose-300 font-bold">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <span>Error Loading Assessments</span>
        </div>
        <p className="text-xs text-rose-200 leading-relaxed">{error}</p>
        <button 
          onClick={fetchResponses}
          className="px-4 py-2 bg-rose-800 text-white rounded-xl text-xs font-bold hover:bg-rose-700 cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      
      {/* Action Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl p-5 gap-4">
        <div>
          <h2 className="font-serif font-bold text-sm text-[var(--sw-text)]">Operational Surveys</h2>
          <p className="text-[10px] text-[var(--sw-muted)] mt-1 font-sans">Deploy intelligence assessments and analyze friction signals.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyAssessmentLink}
            className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              copiedLink 
                ? 'bg-emerald-800 border-emerald-700 text-white'
                : 'bg-white/10 border-[var(--sw-border)] hover:bg-white/15 text-[var(--sw-text)]'
            }`}
          >
            <Clipboard className="w-4 h-4" />
            <span>{copiedLink ? 'Link Copied!' : 'Create Assessment Link'}</span>
          </button>
          
          <button
            onClick={() => setShowSurveyModal(true)}
            className="px-4 py-2 bg-white/10 border border-[var(--sw-border)] hover:bg-white/15 text-[var(--sw-text)] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Building className="w-4 h-4" />
            <span>Run Survey Intake</span>
          </button>

          <button
            onClick={handleExportAllCSV}
            className="px-4 py-2 bg-[var(--sw-green-700)] hover:bg-[var(--sw-green-500)] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-[var(--sw-muted)] uppercase tracking-widest font-mono block">Total Responses</span>
          <span className="text-xl font-bold text-[var(--sw-text)] font-mono block pt-1">{totalResponses}</span>
          <span className="text-[10px] text-[var(--sw-muted-light)] block">Surveys initiated</span>
        </div>

        <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-[var(--sw-muted)] uppercase tracking-widest font-mono block">Completed</span>
          <span className="text-xl font-bold text-emerald-400 font-mono block pt-1">{completedCount}</span>
          <span className="text-[10px] text-emerald-400/80 font-semibold block">{completionRate}% Completion rate</span>
        </div>

        <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-[var(--sw-muted)] uppercase tracking-widest font-mono block">Brokerages</span>
          <span className="text-xl font-bold text-[var(--sw-text)] font-mono block pt-1">{brokeragesRepresented}</span>
          <span className="text-[10px] text-[var(--sw-muted-light)] block">Distinct brands</span>
        </div>

        <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-[9px] font-bold text-[var(--sw-muted)] uppercase tracking-widest font-mono block">Avg IQ Score</span>
          <span className="text-xl font-bold text-emerald-400 font-mono block pt-1">{averageScore}/100</span>
          <span className="text-[10px] text-[var(--sw-muted-light)] block">Calculated index</span>
        </div>

        <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl p-5 shadow-sm xl:col-span-2 space-y-1">
          <span className="text-[9px] font-bold text-[var(--sw-muted)] uppercase tracking-widest font-mono block">Top Friction Area</span>
          <span className="text-sm font-bold text-rose-300 truncate block uppercase tracking-tight pt-1">{topIssue}</span>
          <span className="text-[10px] text-[var(--sw-muted-light)] block">Reported greatest cost/friction</span>
        </div>
      </div>

      {/* Filter and Table Panel */}
      <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl p-5 shadow-sm space-y-4">
        
        {/* Filter bar */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--sw-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brokerage, respondent, or email..."
              className="w-full pl-9 pr-4 py-2 bg-[var(--sw-bg-soft)] border border-[var(--sw-border)] rounded-xl text-xs text-[var(--sw-text)] focus:outline-none focus:border-emerald-500/50 placeholder:text-[var(--sw-muted)]/50"
            />
          </div>

          <div className="flex gap-2 select-none shrink-0 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#01362D] border border-[var(--sw-border)] rounded-xl text-xs text-[var(--sw-text)] focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
            </select>

            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="px-3 py-2 bg-[#01362D] border border-[var(--sw-border)] rounded-xl text-xs text-[var(--sw-text)] focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">All Sizes</option>
              <option value="1–25">1-25 Agents</option>
              <option value="26–50">26-50 Agents</option>
              <option value="51–100">51-100 Agents</option>
              <option value="101–250">101-250 Agents</option>
              <option value="251–500">251-500 Agents</option>
              <option value="500+">500+ Agents</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-[#01362D] border border-[var(--sw-border)] rounded-xl text-xs text-[var(--sw-text)] focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">All Roles</option>
              <option value="Owner">Owner</option>
              <option value="Brokerage Principal">Brokerage Principal</option>
              <option value="Broker-in-Charge">Broker-in-Charge</option>
              <option value="Operations Director">Operations Director</option>
              <option value="Accounting">Accounting</option>
              <option value="Marketing">Marketing</option>
              <option value="Transaction Coordinator">Transaction Coordinator</option>
              <option value="Agent">Agent</option>
            </select>
          </div>
        </div>

        {/* Datatable */}
        <div className="overflow-x-auto border border-[var(--sw-border)] rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--sw-bg-soft)] border-b border-[var(--sw-border)] text-[10px] font-bold text-[var(--sw-muted)] uppercase tracking-wider font-mono">
                <th className="p-3.5">Brokerage</th>
                <th className="p-3.5">Respondent</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5 text-center">Agents</th>
                <th className="p-3.5 text-center">Locations</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">IQ Score</th>
                <th className="p-3.5">Top Cost Issue</th>
                <th className="p-3.5">Submitted Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--sw-border)]/60 text-xs text-[var(--sw-text)]">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-[var(--sw-muted-light)]">
                    No matching operational assessment records found.
                  </td>
                </tr>
              ) : (
                filteredList.map((row) => (
                  <tr key={row.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-bold text-[var(--sw-text)]">{row.brokerageName}</td>
                    <td className="p-3.5">
                      <div className="flex flex-col">
                        <span className="text-[var(--sw-text)]">{row.respondentName}</span>
                        <span className="text-[10px] text-[var(--sw-muted)]">{row.emailAddress}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-semibold text-[var(--sw-muted)]">{row.role}</td>
                    <td className="p-3.5 text-center font-mono font-medium">{row.numberOfAgents}</td>
                    <td className="p-3.5 text-center font-mono">{row.numberOfLocations || 1}</td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase border ${
                        row.status === 'completed' 
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-mono font-extrabold text-emerald-400">
                      {row.scores?.overallScore !== undefined ? `${row.scores.overallScore}/100` : 'N/A'}
                    </td>
                    <td className="p-3.5 font-mono text-[10px] text-rose-300">
                      {row.answers?.greatestCostArea || row.internalClassification?.primaryPainCategory || 'None'}
                    </td>
                    <td className="p-3.5 font-mono text-[10px] text-[var(--sw-muted)]">
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewDetail(row.id)}
                          className="p-1.5 border border-[var(--sw-border)] bg-white/10 hover:bg-white/15 rounded-lg transition-colors text-[var(--sw-text)] cursor-pointer"
                          title="View response details"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExportCSV(row.id)}
                          className="p-1.5 border border-[var(--sw-border)] bg-white/10 hover:bg-white/15 rounded-lg transition-colors text-[var(--sw-text)] cursor-pointer"
                          title="Export CSV"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                fetchResponses();
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
                fetchResponses();
              }} />
            </React.Suspense>
          </div>
        </div>
      )}

    </div>
  );
}
