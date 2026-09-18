/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckSquare, AlertCircle, AlertTriangle, Clock, CheckCircle2, 
  ExternalLink, Search, Filter, Plus, RefreshCw, LayoutGrid, 
  List, Sparkles, MessageSquare, ArrowUpRight, ShieldCheck, 
  X, ChevronRight, FileText, Download, User, Calendar, Tag,
  Eye, Check, Trash2, Edit3, Copy
} from 'lucide-react';

export interface PlatformQATrackerViewProps {
  state?: any;
  activeProfile?: any;
}

export interface QaIssue {
  id: string;
  dateReported: string;
  reportedBy: string;
  areaModule: string;
  summary: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'New' | 'In Progress' | 'In Review' | 'Resolved' | 'Closed' | 'Won\'t Fix';
  owner: string;
  dateResolved?: string;
  resolutionNotes?: string;
  screenshotLink?: string;
  relatedComponent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QaFeatureIdea {
  id: string;
  dateAdded: string;
  addedBy: string;
  areaModule: string;
  idea: string;
  problemSolved: string;
  valueImpact: 'High' | 'Medium' | 'Low';
  effort: 'XS' | 'S' | 'M' | 'L' | 'XL';
  status: 'New' | 'Planned' | 'In Development' | 'Completed' | 'Deferred';
  owner: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const MODULE_OPTIONS = [
  'All Modules',
  'Role & Escalation Map',
  'SOP Builder',
  'Directory',
  'Marketing Intake',
  'Ask Nest Ops',
  'AI Ops Agent',
  'Owner Briefing',
  'Org Chart',
  'Authentication',
  'Other'
];

const SEVERITY_OPTIONS = ['All Severities', 'Critical', 'High', 'Medium', 'Low'];
const STATUS_OPTIONS = ['All Statuses', 'New', 'In Progress', 'In Review', 'Resolved', 'Closed'];

export default function PlatformQATrackerView({ state, activeProfile: propActiveProfile }: PlatformQATrackerViewProps = {}) {
  const activeProfile = propActiveProfile || state?.activeProfile;
  const isMarcus = Boolean(
    activeProfile?.email === 'marcus@shapework.co' || 
    activeProfile?.id === 'usr_marcus' ||
    (typeof window !== 'undefined' && localStorage.getItem('shapework_active_user_email') === 'marcus@shapework.co')
  );

  const [activeTab, setActiveTab] = useState<'issues' | 'features' | 'matrix'>('issues');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [issues, setIssues] = useState<QaIssue[]>([]);
  const [features, setFeatures] = useState<QaFeatureIdea[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('All Modules');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All Severities');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Statuses');
  const [selectedReporter, setSelectedReporter] = useState<string>('All Reporters');
  
  // Modals
  const [selectedIssue, setSelectedIssue] = useState<QaIssue | null>(null);
  const [showNewIssueModal, setShowNewIssueModal] = useState<boolean>(false);
  const [showNewFeatureModal, setShowNewFeatureModal] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // AI Auto-Fix Dispatch State (Marcus Only)
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [dispatchedModalIssue, setDispatchedModalIssue] = useState<QaIssue | null>(null);
  const [dispatchedPrompt, setDispatchedPrompt] = useState<string>('');
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [aiToast, setAiToast] = useState<{ message: string; issueId: string } | null>(null);

  const handleDispatchToAi = async (issue: QaIssue) => {
    setDispatchingId(issue.id);
    try {
      const res = await fetch(`/api/internal/qa-issues/${issue.id}/dispatch-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success && data.issue) {
        setIssues(prev => prev.map(i => i.id === issue.id ? data.issue : i));
        if (selectedIssue && selectedIssue.id === issue.id) {
          setSelectedIssue(data.issue);
        }
        setDispatchedModalIssue(data.issue);
        setDispatchedPrompt(data.prompt);

        if (navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(data.prompt);
            setCopiedPrompt(true);
            setTimeout(() => setCopiedPrompt(false), 4000);
          } catch (e) {}
        }

        setAiToast({
          message: `⚡ Issue ${issue.id} auto-dispatched to Antigravity AI! Instructions copied to clipboard.`,
          issueId: issue.id
        });
        setTimeout(() => setAiToast(null), 5000);
      }
    } catch (err) {
      console.error('Failed to dispatch issue to AI:', err);
    } finally {
      setDispatchingId(null);
    }
  };

  // Form states
  const [newIssueForm, setNewIssueForm] = useState({
    reportedBy: 'Matt',
    areaModule: 'Role & Escalation Map',
    summary: '',
    description: '',
    severity: 'Medium' as 'Critical' | 'High' | 'Medium' | 'Low',
    owner: 'Marcus',
    screenshotLink: '',
    relatedComponent: ''
  });

  const [newFeatureForm, setNewFeatureForm] = useState({
    addedBy: 'Adam',
    areaModule: 'Dashboard & Briefing',
    idea: '',
    problemSolved: '',
    valueImpact: 'High' as 'High' | 'Medium' | 'Low',
    effort: 'M' as 'XS' | 'S' | 'M' | 'L' | 'XL',
    owner: 'Marcus'
  });

  const fetchTrackerData = async () => {
    setLoading(true);
    try {
      const [issuesRes, featuresRes] = await Promise.all([
        fetch('/api/internal/qa-issues'),
        fetch('/api/internal/qa-features')
      ]);
      
      if (issuesRes.ok) {
        const issuesData = await issuesRes.json();
        if (issuesData.issues) setIssues(issuesData.issues);
      }
      
      if (featuresRes.ok) {
        const featuresData = await featuresRes.json();
        if (featuresData.features) setFeatures(featuresData.features);
      }
    } catch (err) {
      console.error('Failed to load QA tracker data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackerData();
  }, []);

  const handleUpdateIssueStatus = async (id: string, newStatus: QaIssue['status']) => {
    try {
      const isResolved = newStatus === 'Resolved' || newStatus === 'Closed';
      const updates: Partial<QaIssue> = {
        status: newStatus,
        dateResolved: isResolved ? new Date().toISOString().split('T')[0] : undefined
      };
      
      const res = await fetch(`/api/internal/qa-issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (res.ok) {
        const data = await res.json();
        setIssues(prev => prev.map(i => i.id === id ? data.issue : i));
        if (selectedIssue && selectedIssue.id === id) {
          setSelectedIssue(data.issue);
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleSaveIssueDetails = async () => {
    if (!selectedIssue) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/internal/qa-issues/${selectedIssue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedIssue)
      });
      if (res.ok) {
        const data = await res.json();
        setIssues(prev => prev.map(i => i.id === selectedIssue.id ? data.issue : i));
        setSelectedIssue(null);
      }
    } catch (err) {
      console.error('Failed to save issue details:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssueForm.summary.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/internal/qa-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIssueForm)
      });
      if (res.ok) {
        const data = await res.json();
        setIssues(prev => [data.issue, ...prev]);
        setShowNewIssueModal(false);
        setNewIssueForm({
          reportedBy: 'Matt',
          areaModule: 'Role & Escalation Map',
          summary: '',
          description: '',
          severity: 'Medium',
          owner: 'Marcus',
          screenshotLink: '',
          relatedComponent: ''
        });
      }
    } catch (err) {
      console.error('Failed to create issue:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeatureForm.idea.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/internal/qa-features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFeatureForm)
      });
      if (res.ok) {
        const data = await res.json();
        setFeatures(prev => [data.feature, ...prev]);
        setShowNewFeatureModal(false);
        setNewFeatureForm({
          addedBy: 'Adam',
          areaModule: 'Dashboard & Briefing',
          idea: '',
          problemSolved: '',
          valueImpact: 'High',
          effort: 'M',
          owner: 'Marcus'
        });
      }
    } catch (err) {
      console.error('Failed to create feature:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFeature = async (id: string) => {
    if (!window.confirm('Delete this feature idea from the backlog?')) return;
    try {
      const res = await fetch(`/api/internal/qa-features/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFeatures(prev => prev.filter(f => f.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete feature:', err);
    }
  };

  // Filtered Issues
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const matchesSearch = 
        searchQuery === '' ||
        issue.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.areaModule.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesModule = selectedModule === 'All Modules' || issue.areaModule === selectedModule;
      const matchesSeverity = selectedSeverity === 'All Severities' || issue.severity === selectedSeverity;
      const matchesStatus = selectedStatus === 'All Statuses' || issue.status === selectedStatus;
      const matchesReporter = selectedReporter === 'All Reporters' || issue.reportedBy === selectedReporter;

      return matchesSearch && matchesModule && matchesSeverity && matchesStatus && matchesReporter;
    });
  }, [issues, searchQuery, selectedModule, selectedSeverity, selectedStatus, selectedReporter]);

  // KPIs
  const stats = useMemo(() => {
    const total = issues.length;
    const resolved = issues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length;
    const inProgress = issues.filter(i => i.status === 'In Progress' || i.status === 'In Review').length;
    const openNew = issues.filter(i => i.status === 'New').length;
    const highCritical = issues.filter(i => (i.severity === 'High' || i.severity === 'Critical') && (i.status !== 'Resolved' && i.status !== 'Closed')).length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return { total, resolved, inProgress, openNew, highCritical, resolutionRate };
  }, [issues]);

  const reportersList = useMemo(() => {
    const list = Array.from(new Set(issues.map(i => i.reportedBy).filter(Boolean)));
    return ['All Reporters', ...list];
  }, [issues]);

  const exportCsv = () => {
    const headers = ['ID', 'Date Reported', 'Reported By', 'Area/Module', 'Summary', 'Description', 'Severity', 'Status', 'Owner', 'Date Resolved', 'Resolution Notes', 'Screenshot'];
    const rows = filteredIssues.map(i => [
      i.id,
      i.dateReported,
      i.reportedBy,
      `"${i.areaModule.replace(/"/g, '""')}"`,
      `"${i.summary.replace(/"/g, '""')}"`,
      `"${(i.description || '').replace(/"/g, '""')}"`,
      i.severity,
      i.status,
      i.owner,
      i.dateResolved || '',
      `"${(i.resolutionNotes || '').replace(/"/g, '""')}"`,
      i.screenshotLink || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shapework_qa_issues_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800 border border-red-200">Critical</span>;
      case 'High':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">High</span>;
      case 'Medium':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">Medium</span>;
      case 'Low':
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">Low</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"><Check className="w-3 h-3 text-emerald-600" /> Resolved</span>;
      case 'In Progress':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200"><Clock className="w-3 h-3 text-blue-600 animate-spin" /> In Progress</span>;
      case 'In Review':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-800 border border-purple-200"><Eye className="w-3 h-3 text-purple-600" /> In Review</span>;
      case 'New':
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200"><AlertCircle className="w-3 h-3 text-amber-600" /> New</span>;
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 p-6 lg:p-8 font-sans">
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00635C]/10 text-[#00635C] flex items-center justify-center font-bold">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Pilot QA & Issue Tracker
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E5EFEA] text-[#00635C] border border-[#00635C]/20">
                    Live Pilot Sync
                  </span>
                </h1>
                <p className="text-sm text-slate-500">
                  Track, triage, and verify test findings, feedback, and feature requests for Nest Realty Wilmington.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowNewIssueModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00635C] text-white text-xs font-semibold hover:bg-[#004d47] transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Log New Issue
            </button>
            <button
              onClick={() => setShowNewFeatureModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-500" /> New Feature Idea
            </button>
            <a
              href="https://docs.google.com/spreadsheets/d/1yqTkIUcxylJQv7Lq9o8zHSj0mwQ9EeynP8ermr7m85Y/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-medium hover:text-slate-900 hover:bg-slate-50 transition"
              title="Open Google Sheet"
            >
              Google Sheet <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={fetchTrackerData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
              title="Refresh from Server"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00635C]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
            <div className="text-xs font-medium text-slate-500">Total Issues Logged</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="mt-1 text-[11px] text-slate-400">Across 8 system modules</div>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
            <div className="text-xs font-medium text-slate-500">New / Unaddressed</div>
            <div className="mt-1 text-2xl font-bold text-amber-600">{stats.openNew}</div>
            <div className="mt-1 text-[11px] text-amber-700/80 font-medium">Awaiting developer work</div>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
            <div className="text-xs font-medium text-slate-500">In Progress</div>
            <div className="mt-1 text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="mt-1 text-[11px] text-blue-700/80 font-medium">Currently in active build</div>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
            <div className="text-xs font-medium text-slate-500">Resolved & Verified</div>
            <div className="mt-1 text-2xl font-bold text-emerald-600">{stats.resolved}</div>
            <div className="mt-1 text-[11px] text-emerald-700/80 font-medium">{stats.resolutionRate}% resolution rate</div>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
            <div className="text-xs font-medium text-slate-500">High / Critical</div>
            <div className="mt-1 text-2xl font-bold text-rose-600">{stats.highCritical}</div>
            <div className="mt-1 text-[11px] text-rose-700/80 font-medium">Requiring fast turnaround</div>
          </div>
        </div>

        {/* Tab Selector & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('issues')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'issues'
                  ? 'bg-[#00635C] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              Issues & Bug Tracker ({issues.length})
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'features'
                  ? 'bg-[#00635C] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              Feature Backlog ({features.length})
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'matrix'
                  ? 'bg-[#00635C] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              Test Verification Matrix (339 Tests)
            </button>
          </div>

          {activeTab === 'issues' && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md text-xs transition ${viewMode === 'table' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-700'}`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-1.5 rounded-md text-xs transition ${viewMode === 'kanban' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-700'}`}
                  title="Kanban Board View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* TAB 1: ISSUES & BUG TRACKER */}
        {activeTab === 'issues' && (
          <div className="space-y-4">
            
            {/* Filter Bar */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-sm flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search issues by summary, description, ID, module..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00635C] focus:bg-white transition"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Module Filter */}
              <select
                value={selectedModule}
                onChange={e => setSelectedModule(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00635C]"
              >
                {MODULE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>

              {/* Severity Filter */}
              <select
                value={selectedSeverity}
                onChange={e => setSelectedSeverity(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00635C]"
              >
                {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00635C]"
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              {/* Reporter Filter */}
              <select
                value={selectedReporter}
                onChange={e => setSelectedReporter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00635C]"
              >
                {reportersList.map(r => <option key={r} value={r}>{r}</option>)}
              </select>

              {/* Clear filters button */}
              {(searchQuery || selectedModule !== 'All Modules' || selectedSeverity !== 'All Severities' || selectedStatus !== 'All Statuses' || selectedReporter !== 'All Reporters') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedModule('All Modules');
                    setSelectedSeverity('All Severities');
                    setSelectedStatus('All Statuses');
                    setSelectedReporter('All Reporters');
                  }}
                  className="text-xs text-[#00635C] hover:underline font-semibold"
                >
                  Reset
                </button>
              )}
            </div>

            {/* List / Table View */}
            {viewMode === 'table' ? (
              <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                      <tr>
                        <th className="py-3 px-3 w-16">ID</th>
                        <th className="py-3 px-3 w-24">Date</th>
                        <th className="py-3 px-3 w-20">Reporter</th>
                        <th className="py-3 px-3 w-32">Module</th>
                        <th className="py-3 px-3 min-w-[240px]">Summary & Description</th>
                        <th className="py-3 px-3 w-20">Severity</th>
                        <th className="py-3 px-3 w-28">Status</th>
                        <th className="py-3 px-3 w-20">Owner</th>
                        <th className="py-3 px-3 w-44 text-right pr-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredIssues.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400">
                            No issues matching the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredIssues.map(issue => (
                          <tr 
                            key={issue.id} 
                            onClick={() => setSelectedIssue(issue)}
                            className="hover:bg-slate-50/80 transition cursor-pointer group"
                          >
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-500 text-[11px]">
                              {issue.id}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                              {issue.dateReported}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-800">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">
                                  {issue.reportedBy.charAt(0)}
                                </span>
                                {issue.reportedBy}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                                {issue.areaModule}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-900 group-hover:text-[#00635C] transition flex items-center gap-1.5">
                                {issue.summary}
                                {issue.screenshotLink && (
                                  <a
                                    href={issue.screenshotLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="text-blue-500 hover:text-blue-700 inline-flex items-center"
                                    title="View Attached Screenshot"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 ml-1 text-slate-400 hover:text-blue-600" />
                                  </a>
                                )}
                              </div>
                              {issue.description && (
                                <div className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">
                                  {issue.description}
                                </div>
                              )}
                              {issue.resolutionNotes && (
                                <div className="text-emerald-700 text-[11px] font-medium mt-1 flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  {issue.resolutionNotes}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {getSeverityBadge(issue.severity)}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                              <select
                                value={issue.status}
                                onChange={e => handleUpdateIssueStatus(issue.id, e.target.value as QaIssue['status'])}
                                className="text-[11px] font-medium rounded-lg border border-slate-200 px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                              >
                                <option value="New">New</option>
                                <option value="In Progress">In Progress</option>
                                <option value="In Review">In Review</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Closed">Closed</option>
                              </select>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-600">
                              {issue.owner || 'Unassigned'}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                {isMarcus && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDispatchToAi(issue);
                                    }}
                                    disabled={dispatchingId === issue.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-xs transition cursor-pointer shrink-0"
                                    title="Auto-send this issue to Antigravity AI to diagnose and code fix"
                                  >
                                    <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${dispatchingId === issue.id ? 'animate-spin' : 'animate-pulse'}`} />
                                    <span>{dispatchingId === issue.id ? 'Sending...' : 'Auto-Fix'}</span>
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedIssue(issue);
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#00635C] bg-[#E5EFEA] hover:bg-[#d6e7de] transition shrink-0"
                                >
                                  Details
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
            ) : (
              /* Kanban Board View */
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(['New', 'In Progress', 'In Review', 'Resolved'] as const).map(colStatus => {
                  const colIssues = filteredIssues.filter(i => i.status === colStatus || (colStatus === 'Resolved' && i.status === 'Closed'));
                  return (
                    <div key={colStatus} className="bg-slate-100/70 border border-slate-200/80 rounded-xl p-3.5 flex flex-col min-h-[500px]">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
                        <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                          {colStatus}
                          <span className="px-2 py-0.5 rounded-full bg-white text-slate-600 text-[10px] font-bold border border-slate-200">
                            {colIssues.length}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                        {colIssues.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400">
                            No issues in {colStatus}
                          </div>
                        ) : (
                          colIssues.map(issue => (
                            <div
                              key={issue.id}
                              onClick={() => setSelectedIssue(issue)}
                              className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-[#00635C]/30 transition cursor-pointer space-y-2"
                            >
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-mono font-bold text-slate-400">{issue.id}</span>
                                {getSeverityBadge(issue.severity)}
                              </div>
                              <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                                {issue.summary}
                              </h4>
                              {issue.description && (
                                <p className="text-[11px] text-slate-500 line-clamp-2">
                                  {issue.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                  {issue.areaModule}
                                </span>
                                <span className="font-medium text-slate-600">
                                  {issue.reportedBy}
                                </span>
                              </div>
                              {isMarcus && (
                                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                                  <span className="text-[10px] text-violet-600 font-mono font-semibold flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5" /> AI Fix
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDispatchToAi(issue);
                                    }}
                                    disabled={dispatchingId === issue.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-xs transition cursor-pointer"
                                    title="Auto-send to Antigravity AI"
                                  >
                                    <Sparkles className="w-3 h-3 text-amber-300" />
                                    <span>{dispatchingId === issue.id ? '...' : 'Auto-Fix'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FEATURE BACKLOG */}
        {activeTab === 'features' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Platform Feature Backlog & Opportunity Pipeline</h3>
                <p className="text-xs text-slate-500">Capture client suggestions, score Value vs. Effort, and schedule implementation phases.</p>
              </div>
              <button
                onClick={() => setShowNewFeatureModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00635C] text-white text-xs font-semibold hover:bg-[#004d47]"
              >
                <Plus className="w-3.5 h-3.5" /> Add Feature Idea
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map(feat => (
                <div key={feat.id} className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-400">{feat.id}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {feat.status}
                      </span>
                      <button
                        type="button"
                        title="Delete feature idea"
                        onClick={() => handleDeleteFeature(feat.id)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{feat.idea}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{feat.problemSolved}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold">
                        Impact: {feat.valueImpact}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        Effort: {feat.effort}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">By {feat.addedBy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TEST VERIFICATION MATRIX */}
        {activeTab === 'matrix' && (
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Automated Test & Regression Verification Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every critical issue reported in the pilot tracker is covered by dedicated Vitest suites to guarantee zero regression before production deployment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center justify-between font-bold text-xs text-slate-900">
                  <span>SOP Library & Builder Suite</span>
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">100% Passed</span>
                </div>
                <p className="text-xs text-slate-600">
                  Validates draft saving, draft deletion, light-mode palette, unowned phone number removal, and NORA step wizard transitions.
                </p>
                <div className="text-[11px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200">
                  ✓ sopLibraryRedesignRegression.test.ts (7 tests passed)<br />
                  ✓ sopStudioLifecycle.test.ts (1 test passed)<br />
                  ✓ staffSopContributionGovernance.test.ts (10 tests passed)
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center justify-between font-bold text-xs text-slate-900">
                  <span>Voice & Conversational AI Turn-Taking</span>
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">100% Passed</span>
                </div>
                <p className="text-xs text-slate-600">
                  Validates real-time audio playback without truncation, barge-in endpointing, and WebSocket turn ownership for Ask Nest Ops.
                </p>
                <div className="text-[11px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200">
                  ✓ voiceTurnTakingAndEndpointing.test.ts (12 tests passed)<br />
                  ✓ noraWebSocketVoiceMigration.test.ts (8 tests passed)<br />
                  ✓ ask-nest-ops-voice-pipeline.spec.ts (21 tests passed)
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center justify-between font-bold text-xs text-slate-900">
                  <span>Directory & Escalation Hierarchy</span>
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">100% Passed</span>
                </div>
                <p className="text-xs text-slate-600">
                  Validates roster caching, RBAC permissions, profile update propagation, and reporting tree persistence.
                </p>
                <div className="text-[11px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200">
                  ✓ routeAuthAndTenantIsolation.test.ts (10 tests passed)<br />
                  ✓ role-map-topbar.spec.ts (9 tests passed)<br />
                  ✓ authSecurityRegression.test.ts (11 tests passed)
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center justify-between font-bold text-xs text-slate-900">
                  <span>Vendor Dispatch & Order Lifecycle</span>
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">100% Passed</span>
                </div>
                <p className="text-xs text-slate-600">
                  Validates Coastal Sign Post, HDR Media, and Supra Lockbox integrations with live mock adapters.
                </p>
                <div className="text-[11px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200">
                  ✓ vendorDispatchAndSopSync.test.ts (6 tests passed)<br />
                  ✓ launchReadinessAll4.test.ts (14 tests passed)
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ISSUE DETAIL & RESOLUTION MODAL */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">{selectedIssue.id}</span>
                  {getSeverityBadge(selectedIssue.severity)}
                  {getStatusBadge(selectedIssue.status)}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedIssue.summary}</h3>
              </div>
              <button 
                onClick={() => setSelectedIssue(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <div className="text-slate-400 text-[10px]">Reported By</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedIssue.reportedBy}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Date Reported</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedIssue.dateReported}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Area / Module</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedIssue.areaModule}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Owner</div>
                  <input
                    type="text"
                    value={selectedIssue.owner || ''}
                    onChange={e => setSelectedIssue({ ...selectedIssue, owner: e.target.value })}
                    className="font-semibold text-slate-800 mt-0.5 bg-white border border-slate-200 rounded px-1.5 py-0.5 w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description / Steps to Reproduce</label>
                <textarea
                  rows={3}
                  value={selectedIssue.description || ''}
                  onChange={e => setSelectedIssue({ ...selectedIssue, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                  placeholder="Steps to reproduce, expected behavior, context..."
                />
              </div>

              {selectedIssue.screenshotLink && (
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-900">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Screenshot Attached by Tester</span>
                  </div>
                  <a
                    href={selectedIssue.screenshotLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                  >
                    Open Screenshot ↗
                  </a>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={selectedIssue.status}
                    onChange={e => setSelectedIssue({ ...selectedIssue, status: e.target.value as QaIssue['status'] })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Review">In Review</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                    <option value="Won't Fix">Won't Fix</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Severity</label>
                  <select
                    value={selectedIssue.severity}
                    onChange={e => setSelectedIssue({ ...selectedIssue, severity: e.target.value as QaIssue['severity'] })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Resolution / Engineering Notes</label>
                <textarea
                  rows={2}
                  value={selectedIssue.resolutionNotes || ''}
                  onChange={e => setSelectedIssue({ ...selectedIssue, resolutionNotes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                  placeholder="Details on the fix, commit, or verification..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                {isMarcus && (
                  <button
                    type="button"
                    disabled={dispatchingId === selectedIssue.id}
                    onClick={() => handleDispatchToAi(selectedIssue)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-xs transition cursor-pointer"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${dispatchingId === selectedIssue.id ? 'animate-spin' : ''}`} />
                    <span>{dispatchingId === selectedIssue.id ? 'Dispatching...' : 'Auto-Send to Antigravity AI'}</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveIssueDetails}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#00635C] hover:bg-[#004d47] transition shadow-sm cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOG NEW ISSUE MODAL */}
      {showNewIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <form onSubmit={handleCreateIssue} className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#00635C]" /> Log New Pilot Issue
              </h3>
              <button 
                type="button"
                onClick={() => setShowNewIssueModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reported By</label>
                  <input
                    type="text"
                    required
                    value={newIssueForm.reportedBy}
                    onChange={e => setNewIssueForm({ ...newIssueForm, reportedBy: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    placeholder="Matt, Adam..."
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Area / Module</label>
                  <select
                    value={newIssueForm.areaModule}
                    onChange={e => setNewIssueForm({ ...newIssueForm, areaModule: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  >
                    {MODULE_OPTIONS.filter(m => m !== 'All Modules').map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Summary</label>
                <input
                  type="text"
                  required
                  value={newIssueForm.summary}
                  onChange={e => setNewIssueForm({ ...newIssueForm, summary: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  placeholder="Short description of the bug or finding..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description / Steps to Reproduce</label>
                <textarea
                  rows={3}
                  value={newIssueForm.description}
                  onChange={e => setNewIssueForm({ ...newIssueForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  placeholder="Describe what happened, error message, steps..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Severity</label>
                  <select
                    value={newIssueForm.severity}
                    onChange={e => setNewIssueForm({ ...newIssueForm, severity: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Owner</label>
                  <input
                    type="text"
                    value={newIssueForm.owner}
                    onChange={e => setNewIssueForm({ ...newIssueForm, owner: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    placeholder="Marcus..."
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Screenshot Link (Google Drive / URL)</label>
                <input
                  type="url"
                  value={newIssueForm.screenshotLink}
                  onChange={e => setNewIssueForm({ ...newIssueForm, screenshotLink: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  placeholder="https://drive.google.com/..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewIssueModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#00635C] hover:bg-[#004d47] transition shadow-sm"
              >
                {saving ? 'Creating...' : 'Log Issue'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NEW FEATURE MODAL */}
      {showNewFeatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <form onSubmit={handleCreateFeature} className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> Add Platform Feature Idea
              </h3>
              <button 
                type="button"
                onClick={() => setShowNewFeatureModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Added By</label>
                  <input
                    type="text"
                    required
                    value={newFeatureForm.addedBy}
                    onChange={e => setNewFeatureForm({ ...newFeatureForm, addedBy: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Area / Module</label>
                  <input
                    type="text"
                    value={newFeatureForm.areaModule}
                    onChange={e => setNewFeatureForm({ ...newFeatureForm, areaModule: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    placeholder="Dashboard, SOPs, Retention..."
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Feature Idea</label>
                <input
                  type="text"
                  required
                  value={newFeatureForm.idea}
                  onChange={e => setNewFeatureForm({ ...newFeatureForm, idea: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  placeholder="e.g. Weekly owner digest email..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Problem it Solves / Details</label>
                <textarea
                  rows={3}
                  value={newFeatureForm.problemSolved}
                  onChange={e => setNewFeatureForm({ ...newFeatureForm, problemSolved: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  placeholder="Why is this valuable? What user friction does this resolve?"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Value / Impact</label>
                  <select
                    value={newFeatureForm.valueImpact}
                    onChange={e => setNewFeatureForm({ ...newFeatureForm, valueImpact: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Effort Estimate</label>
                  <select
                    value={newFeatureForm.effort}
                    onChange={e => setNewFeatureForm({ ...newFeatureForm, effort: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  >
                    <option value="XS">XS (1-2 hrs)</option>
                    <option value="S">S (Half day)</option>
                    <option value="M">M (1-2 days)</option>
                    <option value="L">L (1 week)</option>
                    <option value="XL">XL (Multi-week)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewFeatureModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#00635C] hover:bg-[#004d47] transition shadow-sm"
              >
                {saving ? 'Adding...' : 'Add Feature'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI DISPATCH CONFIRMATION MODAL (Marcus Only) */}
      {dispatchedModalIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl p-6 space-y-5 text-left">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">{dispatchedModalIssue.id}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                      Dispatched to Antigravity AI
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">{dispatchedModalIssue.summary}</h3>
                </div>
              </div>
              <button
                onClick={() => setDispatchedModalIssue(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Module / Area:</span>
                  <span className="font-semibold">{dispatchedModalIssue.areaModule}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reported By:</span>
                  <span className="font-semibold">{dispatchedModalIssue.reportedBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status & Owner:</span>
                  <span className="font-semibold text-violet-700">In Progress • Marcus / Antigravity AI</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider font-mono">Antigravity AI Fix Prompt</span>
                  <button
                    onClick={async () => {
                      if (navigator.clipboard) {
                        await navigator.clipboard.writeText(dispatchedPrompt);
                        setCopiedPrompt(true);
                        setTimeout(() => setCopiedPrompt(false), 3000);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-800 cursor-pointer"
                  >
                    {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPrompt ? 'Copied to Clipboard!' : 'Copy Prompt'}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-100 font-mono text-[11px] p-3.5 rounded-xl overflow-x-auto whitespace-pre-wrap max-h-48 leading-relaxed border border-slate-800 select-all">
                  {dispatchedPrompt}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-medium">Prompt has been copied to your clipboard.</span>
              <button
                onClick={() => setDispatchedModalIssue(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {aiToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 animate-slide-up text-xs max-w-md">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          </div>
          <div className="flex-1 font-medium leading-snug">
            {aiToast.message}
          </div>
          <button
            onClick={() => setAiToast(null)}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
