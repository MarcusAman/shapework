import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Play, Eye, FileText, CheckCircle2, Clock, AlertCircle, 
  HelpCircle, ArrowRight, Search, Check, Layers, Mail, ShieldCheck,
  UserCheck, AlertTriangle, RefreshCw, Send, X, ExternalLink, Trash2, Edit3, MessageSquare,
  LayoutGrid, List, Sparkles, User, ChevronRight, Upload, Plus
} from 'lucide-react';
import type { SopAuthoringRequest } from '../../../server/persistence/sopAuthoringRequestRepository';
import { SOP_TEMPLATES } from './sopTemplates';
import ActiveRunsDashboard from './ActiveRunsDashboard';
import { useToast } from '../ui';

interface SOPLibraryProps {
  sops: any[];
  runs: any[];
  readOnly?: boolean;
  onStartCreate?: () => void;
  onOpenStaffTemplate?: () => void;
  onOpenAskModal?: () => void;
  onOpenUploadModal?: () => void;
  onSelectSop?: (sop: any, tab: 'sop' | 'run' | 'history') => void;
  onSelectRun?: (run: any) => void;
  onCompareVersions?: (verA: any, verB: any) => void;
  onSelectTemplate?: (template: any) => void;
}

export default function SOPLibrary({
  sops = [],
  runs = [],
  readOnly = false,
  onStartCreate,
  onOpenStaffTemplate,
  onOpenAskModal,
  onOpenUploadModal,
  onSelectSop,
  onSelectRun,
  onCompareVersions,
  onSelectTemplate
}: SOPLibraryProps) {
  const { toast } = useToast();
  // Tabs: Published first as recommended customer-facing order
  const [activeLibraryTab, setActiveLibraryTab] = useState<'published' | 'awaiting_review' | 'in_progress' | 'draft' | 'template' | 'active_runs' | 'archived'>('published');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

  // Authoring requests state
  const [authoringRequests, setAuthoringRequests] = useState<SopAuthoringRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedReviewRequest, setSelectedReviewRequest] = useState<SopAuthoringRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Admin SOP Deletion state
  const [sopToDelete, setSopToDelete] = useState<any | null>(null);
  const [isDeletingSop, setIsDeletingSop] = useState(false);

  // Determine admin access (Ryan, Adam, Marcus, Matt, or owner/admin/bic role)
  const activeToken = (typeof window !== 'undefined' ? localStorage.getItem('shapework_session_token') : '') || 'usr_ryan';
  const activeRole = (typeof window !== 'undefined' ? localStorage.getItem('shapework_active_user_role') : '') || 'owner';
  const activeEmail = (typeof window !== 'undefined' ? localStorage.getItem('shapework_active_user_email') : '') || '';
  const activeName = (typeof window !== 'undefined' ? localStorage.getItem('shapework_active_user_name') : '') || '';

  const isAdmin = 
    ['owner', 'admin', 'bic', 'operations_lead'].includes(activeRole) ||
    ['ryan', 'adam', 'marcus', 'matt', 'usr_ryan'].some(name => 
      activeToken.toLowerCase().includes(name) || 
      activeEmail.toLowerCase().includes(name) || 
      activeName.toLowerCase().includes(name)
    );

  const getSopCreator = (sop: any): string => {
    if (sop.createdBy && !sop.createdBy.toLowerCase().includes('nest team')) return sop.createdBy;
    if (sop.author && !sop.author.toLowerCase().includes('nest team')) return sop.author;
    if (sop.publisher && !sop.publisher.toLowerCase().includes('nest team')) return sop.publisher;
    if (sop.processOwner && !sop.processOwner.toLowerCase().includes('nest team')) return sop.processOwner;
    return 'Nest Team';
  };

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'x-workspace-id': 'nest-realty-wilmington',
    'Authorization': `Bearer ${localStorage.getItem('shapework_session_token') || 'usr_ryan'}`
  });

  // Fetch authoring requests from server
  const fetchAuthoringRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await fetch('/api/sops/authoring-requests?workspaceId=nest-realty-wilmington', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.requests) {
          setAuthoringRequests(data.requests);
        }
      }
    } catch (err) {
      console.error('Failed to load authoring requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchAuthoringRequests();
  }, []);

  const handleResend = async (id: string) => {
    try {
      const res = await fetch(`/api/sops/authoring-requests/${id}/resend`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        await fetchAuthoringRequests();
        setFeedbackSuccess('Invitation re-issued with new single-use token.');
        setTimeout(() => setFeedbackSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed to resend:', err);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this SOP authoring invitation?')) return;
    try {
      const res = await fetch(`/api/sops/authoring-requests/${id}/revoke`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        await fetchAuthoringRequests();
        setFeedbackSuccess('Authoring invitation revoked.');
        setTimeout(() => setFeedbackSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed to revoke:', err);
    }
  };

  const handleDeleteSopConfirm = async () => {
    if (!sopToDelete) return;
    try {
      setIsDeletingSop(true);
      const sopId = sopToDelete.id || sopToDelete.sopId;
      const res = await fetch(`/api/sops/${sopId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Failed to delete SOP');
      }
      toast.success({
        title: 'SOP Permanently Deleted',
        description: `SOP "${sopToDelete.title}" has been permanently removed.`
      });
      setFeedbackSuccess(`✓ SOP "${sopToDelete.title}" permanently removed.`);
      setTimeout(() => setFeedbackSuccess(null), 3000);
      setSopToDelete(null);
      // Dispatch window event so parent components / studio update their list
      window.dispatchEvent(new CustomEvent('sop-deleted', { detail: { sopId } }));
    } catch (err: any) {
      console.error('Failed to delete SOP:', err);
      toast.error({
        title: 'Delete Failed',
        description: err.message || 'Failed to delete SOP'
      });
    } finally {
      setIsDeletingSop(false);
    }
  };

  const handleRequestChanges = async (requestId: string) => {
    if (!reviewNotes.trim()) {
      toast.warning({
        title: 'Notes Required',
        description: 'Please provide change request notes for the contributor.'
      });
      return;
    }
    try {
      setActionLoading(true);
      const res = await fetch(`/api/sops/authoring-requests/${requestId}/request-changes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ notes: reviewNotes })
      });
      if (res.ok) {
        await fetchAuthoringRequests();
        setSelectedReviewRequest(null);
        setReviewNotes('');
        toast.success({
          title: 'Changes Requested',
          description: 'Change request returned to staff contributor.'
        });
        setFeedbackSuccess('Change request returned to staff contributor.');
        setTimeout(() => setFeedbackSuccess(null), 3000);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error({
          title: 'Request Failed',
          description: err.error || 'Failed to submit change request.'
        });
      }
    } catch (err: any) {
      console.error('Failed to request changes:', err);
      toast.error({
        title: 'Request Error',
        description: err.message || 'Failed to request changes.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBicApprove = async (requestId: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/sops/authoring-requests/${requestId}/bic-approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ notes: reviewNotes || 'Compliance review verified by BIC.' })
      });
      if (res.ok) {
        await fetchAuthoringRequests();
        setSelectedReviewRequest(null);
        setReviewNotes('');
        setFeedbackSuccess('BIC Compliance review approved.');
        setTimeout(() => setFeedbackSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed BIC approval:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveAndPublish = async (requestId: string, sopDraftId?: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/sops/authoring-requests/${requestId}/approve-and-publish`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ sopDraftId })
      });
      if (res.ok) {
        await fetchAuthoringRequests();
        setSelectedReviewRequest(null);
        setReviewNotes('');
        setFeedbackSuccess('SOP published and active as authoritative Nest policy.');
        setTimeout(() => setFeedbackSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed to approve and publish:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Metric derivations
  const publishedCount = sops.filter(s => s.status === 'published' || !s.status).length;
  const awaitingReviewList = authoringRequests.filter(r => r.status === 'submitted' || r.status === 'bic_approved');
  const awaitingBicCount = authoringRequests.filter(r => r.requiresBicReview && r.status === 'submitted').length;
  const inProgressList = authoringRequests.filter(r => ['sent', 'opened', 'in_progress', 'changes_requested'].includes(r.status));
  const draftsCount = sops.filter(s => s.status === 'draft').length;

  const activeRunsCount = runs.filter(r => r.status === 'active' || r.status === 'in_progress' || r.status === 'running').length;
  const atRiskRunsCount = runs.filter(r => r.status === 'at_risk' || r.status === 'delayed' || r.status === 'blocked').length;
  const completedRunsCount = runs.filter(r => r.status === 'completed').length;
  const avgProgress = runs.length > 0 
    ? Math.round(runs.reduce((acc, r) => acc + (r.progressPercent || 0), 0) / runs.length) 
    : 0;

  const filteredSops = sops.filter(sop => {
    if (activeLibraryTab === 'template') {
      if (!sop.isTemplate && !sop.tags?.includes('template')) return false;
    } else if (activeLibraryTab === 'published') {
      if (sop.status && sop.status !== 'published') return false;
    } else if (activeLibraryTab === 'draft') {
      if (sop.status !== 'draft') return false;
    } else if (activeLibraryTab === 'archived') {
      if (sop.status !== 'archived' && sop.status !== 'retired') return false;
    }

    if (deptFilter !== 'all' && sop.department !== deptFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = sop.title?.toLowerCase().includes(q);
      const matchPurpose = sop.purpose?.toLowerCase().includes(q);
      if (!matchTitle && !matchPurpose) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 text-left select-none font-sans min-h-screen">

      {/* Feedback Banner */}
      {feedbackSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      {/* 2. CONTEXTUAL SUMMARY METRIC CARDS (Tab-specific single row of 4 cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {activeLibraryTab === 'active_runs' ? (
          <>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Active Runs</div>
              <div className="text-2xl font-bold text-stone-900">{activeRunsCount}</div>
              <div className="text-[11px] text-stone-500">Live procedures running</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Needs Attention</div>
              <div className={`text-2xl font-bold ${atRiskRunsCount > 0 ? 'text-rose-700' : 'text-stone-900'}`}>{atRiskRunsCount}</div>
              <div className={`text-[11px] font-medium ${atRiskRunsCount > 0 ? 'text-rose-700' : 'text-stone-500'}`}>
                {atRiskRunsCount > 0 ? `${atRiskRunsCount} workflow needs attention` : 'All workflows on track'}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Avg Progress</div>
              <div className="text-2xl font-bold text-stone-900">{avgProgress}%</div>
              <div className="text-[11px] text-stone-500">Across active procedures</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Completed</div>
              <div className="text-2xl font-bold text-emerald-800">{completedRunsCount}</div>
              <div className="text-[11px] text-emerald-700 font-medium">Fully completed runs</div>
            </div>
          </>
        ) : activeLibraryTab === 'awaiting_review' ? (
          <>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Awaiting Review</div>
              <div className="text-2xl font-bold text-amber-900">{awaitingReviewList.length}</div>
              <div className="text-[11px] text-amber-700 font-medium">
                {awaitingReviewList.length > 0 ? 'Ready for owner verification' : 'All reviews clear'}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Awaiting BIC</div>
              <div className="text-2xl font-bold text-stone-900">{awaitingBicCount}</div>
              <div className="text-[11px] text-stone-500">Compliance-sensitive gates</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">BIC Approved</div>
              <div className="text-2xl font-bold text-emerald-800">{authoringRequests.filter(r => r.status === 'bic_approved').length}</div>
              <div className="text-[11px] text-emerald-700 font-medium">Ready for final publish</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Target Velocity</div>
              <div className="text-2xl font-bold text-stone-900">&lt; 24h</div>
              <div className="text-[11px] text-stone-500">Review turnaround</div>
            </div>
          </>
        ) : activeLibraryTab === 'in_progress' ? (
          <>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Staff Assignments</div>
              <div className="text-2xl font-bold text-stone-900">{inProgressList.length}</div>
              <div className="text-[11px] text-stone-500">Currently being documented</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Active Contributors</div>
              <div className="text-2xl font-bold text-stone-900">{new Set(inProgressList.map(r => r.employeeEmail)).size}</div>
              <div className="text-[11px] text-stone-500">Team members drafting</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">NORA-Guided</div>
              <div className="text-2xl font-bold text-[#00635C]">{inProgressList.filter(r => r.startingMethod === 'nora_guided').length}</div>
              <div className="text-[11px] text-stone-500">Interactive interview mode</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Structured Forms</div>
              <div className="text-2xl font-bold text-stone-900">{inProgressList.filter(r => r.startingMethod !== 'nora_guided').length}</div>
              <div className="text-[11px] text-stone-500">Section-by-section draft</div>
            </div>
          </>
        ) : activeLibraryTab === 'draft' ? (
          <>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Draft Procedures</div>
              <div className="text-2xl font-bold text-stone-900">{draftsCount}</div>
              <div className="text-[11px] text-stone-500">In-progress SOP drafts</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Ready for Review</div>
              <div className="text-2xl font-bold text-stone-900">{sops.filter(s => s.status === 'draft' && s.steps?.length > 0).length}</div>
              <div className="text-[11px] text-stone-500">Steps documented</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Total SOP Records</div>
              <div className="text-2xl font-bold text-stone-900">{sops.length}</div>
              <div className="text-[11px] text-stone-500">Across all statuses</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">System State</div>
              <div className="text-2xl font-bold text-emerald-800">Synced</div>
              <div className="text-[11px] text-emerald-700 font-medium">Postgres backed</div>
            </div>
          </>
        ) : activeLibraryTab === 'template' ? (
          <>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Available Templates</div>
              <div className="text-2xl font-bold text-stone-900">{SOP_TEMPLATES.length}</div>
              <div className="text-[11px] text-stone-500">Proven Nest structures</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Operations</div>
              <div className="text-2xl font-bold text-stone-900">{SOP_TEMPLATES.filter(t => t.department === 'Operations').length}</div>
              <div className="text-[11px] text-stone-500">Core office procedures</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Listing & Escrow</div>
              <div className="text-2xl font-bold text-stone-900">{SOP_TEMPLATES.filter(t => t.department !== 'Operations').length}</div>
              <div className="text-[11px] text-stone-500">Transaction & due diligence</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Edition</div>
              <div className="text-2xl font-bold text-[#00635C]">2026.1</div>
              <div className="text-[11px] text-stone-500">Nest Realty Wilmington</div>
            </div>
          </>
        ) : activeLibraryTab === 'archived' ? (
          <>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Archived SOPs</div>
              <div className="text-2xl font-bold text-stone-900">{sops.filter(s => s.status === 'archived' || s.status === 'retired').length}</div>
              <div className="text-[11px] text-stone-500">Historical versions</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Prior Executions</div>
              <div className="text-2xl font-bold text-stone-900">{runs.filter(r => r.status === 'archived').length}</div>
              <div className="text-[11px] text-stone-500">Logged run records</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Audit Trail</div>
              <div className="text-2xl font-bold text-emerald-800">Retained</div>
              <div className="text-[11px] text-emerald-700 font-medium">NCREC compliance safe</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Status</div>
              <div className="text-2xl font-bold text-stone-900">Immutable</div>
              <div className="text-[11px] text-stone-500">Read-only history</div>
            </div>
          </>
        ) : (
          /* Default: Published */
          <>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Published SOPs</div>
              <div className="text-2xl font-bold text-stone-900">{publishedCount}</div>
              <div className="text-[11px] text-emerald-700 font-medium">Authoritative in NORA RAG</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Awaiting Review</div>
              <div className="text-2xl font-bold text-amber-900">{awaitingReviewList.length}</div>
              <div className="text-[11px] text-amber-700 font-medium">
                {awaitingReviewList.length > 0 ? `${awaitingReviewList.length} require action` : 'All reviews clear'}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Awaiting BIC</div>
              <div className="text-2xl font-bold text-stone-900">{awaitingBicCount}</div>
              <div className="text-[11px] text-stone-500">Compliance verification</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Staff Assignments</div>
              <div className="text-2xl font-bold text-stone-900">{inProgressList.length}</div>
              <div className="text-[11px] text-stone-500">In progress drafting</div>
            </div>
          </>
        )}
      </div>

      {/* 3. HORIZONTALLY SCROLLABLE CLEAN TABS (No black pills, pale mint selection) */}
      <div 
        role="tablist"
        aria-label="Knowledge Library Sections"
        className="flex items-center gap-1.5 border-b border-stone-200 overflow-x-auto whitespace-nowrap scrollbar-none pb-1 text-xs"
      >
        {[
          { id: 'published', label: 'Published', count: publishedCount },
          { id: 'awaiting_review', label: 'Awaiting Review', count: awaitingReviewList.length, badge: awaitingReviewList.length > 0 },
          { id: 'in_progress', label: 'Staff Assignments', count: inProgressList.length },
          { id: 'draft', label: 'Drafts', count: draftsCount },
          { id: 'template', label: 'Templates', count: SOP_TEMPLATES.length },
          { id: 'active_runs', label: 'Active Runs', count: runs.length || 3 },
          { id: 'archived', label: 'Archived' }
        ].map((tab) => {
          const isSelected = activeLibraryTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveLibraryTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#E5EFEA] text-[#00635C] shadow-2xs font-bold border border-[#00635C]/20'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70 border border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-medium ${
                  isSelected
                    ? 'bg-white text-[#00635C] shadow-2xs font-bold'
                    : tab.badge
                    ? 'bg-amber-100 text-amber-800 font-bold'
                    : 'bg-stone-100 text-stone-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. TAB: ACTIVE CHECKLIST RUNS DASHBOARD */}
      {activeLibraryTab === 'active_runs' && (
        <ActiveRunsDashboard
          publishedSops={sops.filter(s => s.status === 'published' || !s.status)}
          workspaceId="nest-realty-wilmington"
          hideKpis={true}
        />
      )}

      {/* 5. TAB: AWAITING REVIEW QUEUE */}
      {activeLibraryTab === 'awaiting_review' && (
        <div className="space-y-4">
          {awaitingReviewList.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-xs text-stone-500 text-xs space-y-2">
              <CheckCircle2 className="w-9 h-9 text-emerald-600 mx-auto" />
              <div className="font-bold text-sm text-stone-900">No SOPs awaiting review</div>
              <p className="max-w-md mx-auto text-stone-500">
                When staff contributors submit their documented procedures, they will appear here for owner and BIC verification.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {awaitingReviewList.map((req) => (
                <div
                  key={req.id}
                  className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs hover:border-[#00635C]/40 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-stone-900 text-sm">{req.processName}</span>
                      {req.requiresBicReview && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                          BIC Review Required
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                        {req.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600">
                      Authored by <strong className="text-stone-800">{req.employeeName}</strong> ({req.employeeRole}) • Submitted {req.submittedAt ? new Date(req.submittedAt).toLocaleDateString() : 'Recently'}
                    </p>
                    {req.instructions && (
                      <p className="text-[11px] text-stone-500 italic">
                        "{req.instructions}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedReviewRequest(req);
                        setReviewNotes(req.reviewNotes || '');
                      }}
                      className="px-4 py-2 bg-[#00635C] hover:bg-[#00514B] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      Review & Publish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB: STAFF ASSIGNMENTS (IN PROGRESS) */}
      {activeLibraryTab === 'in_progress' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500">
              Active invitations sent to staff members to document operational workflows.
            </span>
            <button
              onClick={fetchAuthoringRequests}
              className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {inProgressList.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-xs text-stone-500 text-xs space-y-2">
              <Mail className="w-9 h-9 text-stone-400 mx-auto" />
              <div className="font-bold text-sm text-stone-900">No active authoring assignments</div>
              <p className="max-w-md mx-auto text-stone-500">
                Click "Invite Staff to Document an SOP" above to request process documentation from a team member.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F7F8F5] border-b border-stone-200 text-stone-600 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Process Name</th>
                    <th className="py-3 px-4">Staff Contributor</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800 font-medium">
                  {inProgressList.map((req) => (
                    <tr key={req.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-stone-900">
                        {req.processName}
                      </td>
                      <td className="py-3 px-4">
                        <div>{req.employeeName}</div>
                        <div className="text-[11px] text-stone-400 font-normal">{req.employeeEmail}</div>
                      </td>
                      <td className="py-3 px-4 text-stone-600">
                        {req.dueDate || 'Flexible'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] text-stone-600">
                          {req.startingMethod === 'nora_guided' ? 'NORA Guided' : 'Structured Form'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          req.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                          req.status === 'opened' ? 'bg-purple-50 text-purple-700' :
                          req.status === 'changes_requested' ? 'bg-amber-50 text-amber-700' :
                          'bg-stone-100 text-stone-600'
                        }`}>
                          {req.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleResend(req.id)}
                          className="text-[#00635C] hover:underline font-semibold text-[11px] cursor-pointer"
                        >
                          Resend Link
                        </button>
                        <button
                          onClick={() => handleRevoke(req.id)}
                          className="text-rose-600 hover:underline font-semibold text-[11px] cursor-pointer"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 7. TAB: PUBLISHED, DRAFTS, TEMPLATES, ARCHIVED (Unified Toolbar & Cards/List) */}
      {(activeLibraryTab === 'published' || activeLibraryTab === 'draft' || activeLibraryTab === 'template' || activeLibraryTab === 'archived') && (
        <div className="space-y-4">
          
          {/* UNIFIED TOOLBAR */}
          <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search procedures by title, steps, or systems..."
                className="w-full pl-9 pr-3 py-2 bg-[#F7F8F5] border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
              />
            </div>
            
            {/* Filter & View Controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-2 bg-[#F7F8F5] border border-stone-200 rounded-xl text-xs text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
              >
                <option value="all">All Departments</option>
                <option value="Operations">Operations</option>
                <option value="Listings">Listings</option>
                <option value="Closing">Closing & Escrow</option>
                <option value="Marketing">Marketing</option>
              </select>

              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewLayout('grid')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewLayout === 'grid' ? 'bg-white text-[#00635C] shadow-xs' : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewLayout('list')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewLayout === 'list' ? 'bg-white text-[#00635C] shadow-xs' : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {!readOnly && (
                <button
                  type="button"
                  onClick={() => {
                    if (onStartCreate) {
                      onStartCreate();
                    } else {
                      window.dispatchEvent(new CustomEvent('open-new-sop-modal'));
                    }
                  }}
                  className="px-3.5 py-2 bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New SOP</span>
                </button>
              )}
            </div>
          </div>

          {/* Cards Display */}
          {filteredSops.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-xs text-stone-500 text-xs space-y-2">
              <BookOpen className="w-9 h-9 text-stone-400 mx-auto" />
              <div className="font-bold text-sm text-stone-900">No procedures found</div>
              <p className="max-w-md mx-auto text-stone-500">
                {searchQuery.trim() ? `No procedures matching "${searchQuery}".` : 'No procedures recorded in this category.'}
              </p>
            </div>
          ) : viewLayout === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSops.map((sop) => (
                <div
                  key={sop.id || sop.sopId}
                  onClick={() => onSelectSop && onSelectSop(sop, 'sop')}
                  className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs hover:border-[#00635C]/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group text-left relative"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-0.5 bg-[#E5EFEA] text-[#00635C] rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {sop.department || 'Operations'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-stone-400 font-mono">
                          v{sop.version || '1.0'}
                        </span>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSopToDelete(sop);
                            }}
                            className="p-1 rounded-lg text-stone-300 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Admin: Delete SOP"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="font-serif font-bold text-stone-900 text-sm leading-snug group-hover:text-[#00635C] transition-colors">
                      {sop.title}
                    </h3>

                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {sop.purpose || sop.trigger || 'Standard Operating Procedure'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-medium">
                    <span>Created By: <strong className="text-stone-700">{getSopCreator(sop)}</strong></span>
                    <div className="flex items-center gap-1 text-[#00635C] font-semibold group-hover:translate-x-0.5 transition-transform">
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List Layout */
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F7F8F5] border-b border-stone-200 text-stone-600 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Procedure Title</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Created By</th>
                    <th className="py-3 px-4">Version</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800 font-medium">
                  {filteredSops.map((sop) => (
                    <tr 
                      key={sop.id || sop.sopId}
                      onClick={() => onSelectSop && onSelectSop(sop, 'sop')}
                      className="hover:bg-stone-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-semibold text-stone-900 group-hover:text-[#00635C]">
                        {sop.title}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-[#E5EFEA] text-[#00635C] rounded-full text-[10px] font-semibold">
                          {sop.department || 'Operations'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-600">
                        {getSopCreator(sop)}
                      </td>
                      <td className="py-3 px-4 text-stone-400 font-mono">
                        v{sop.version || '1.0'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSopToDelete(sop);
                              }}
                              className="p-1 rounded-lg text-stone-300 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                              title="Admin: Delete SOP"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <span className="text-[#00635C] font-semibold flex items-center gap-0.5">
                            <span>View</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Admin Delete Confirmation Modal in SOPLibrary */}
      {sopToDelete && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-scaleUp text-left">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm text-stone-900">
                  {sopToDelete.status === 'draft' ? 'Delete Working Draft' : 'Delete Published SOP'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSopToDelete(null)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-stone-600">
              <p>
                Are you sure you want to permanently delete <strong className="text-stone-900 font-bold font-serif">{sopToDelete.title}</strong>?
              </p>
              {sopToDelete.status !== 'draft' ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 space-y-1">
                  <span className="font-bold block">Admin Deletion Warning:</span>
                  <span>This procedure will be permanently removed from the operational knowledge library, active checklist runs, and NORA RAG indexing.</span>
                </div>
              ) : (
                <p className="text-stone-500">
                  This removes the working draft. Prior approved versions will not be affected.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                disabled={isDeletingSop}
                onClick={() => setSopToDelete(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingSop}
                onClick={handleDeleteSopConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingSop ? 'Deleting...' : sopToDelete.status === 'draft' ? 'Delete Draft' : 'Permanently Delete SOP'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. REVIEW & PUBLISH MODAL DRAWER (Apple Light System) */}
      {selectedReviewRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 font-sans animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl text-stone-900 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-[#F7F8F5] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#00635C] text-white flex items-center justify-center font-serif font-bold text-sm shadow-xs">
                  N
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-base">Owner & BIC Review Portal</h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Reviewing: {selectedReviewRequest.processName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReviewRequest(null)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#F7F8F5] border border-stone-200 space-y-2">
                <div className="font-bold text-stone-900 text-sm">{selectedReviewRequest.processName}</div>
                <p className="text-stone-600 text-xs leading-relaxed">
                  {selectedReviewRequest.processContext || 'Standard procedure verification.'}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200 text-xs">
                  <div>Contributor: <strong className="text-stone-900">{selectedReviewRequest.employeeName}</strong></div>
                  <div>Status: <strong className="text-[#00635C] uppercase">{selectedReviewRequest.status.replace('_', ' ')}</strong></div>
                </div>
              </div>

              {selectedReviewRequest.requiresBicReview && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>BIC Compliance Review Required</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    This SOP requires BIC review from {selectedReviewRequest.bicReviewerName || 'Broker-in-Charge'} before official publication.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Reviewer Notes / Feedback to Contributor
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Enter change request notes or approval commentary..."
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                />
              </div>
            </div>

            {/* Modal Controls */}
            <div className="px-6 py-4 bg-[#F7F8F5] border-t border-stone-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleRequestChanges(selectedReviewRequest.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Request Changes</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedReviewRequest.requiresBicReview && selectedReviewRequest.status !== 'bic_approved' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleBicApprove(selectedReviewRequest.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Approve BIC Compliance</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleApproveAndPublish(selectedReviewRequest.id, selectedReviewRequest.resultingSopDraftIds?.[0])}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Publish Official SOP</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
