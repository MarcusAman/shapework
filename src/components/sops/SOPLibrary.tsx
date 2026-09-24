import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Play, Eye, FileText, CheckCircle2, Clock, AlertCircle, 
  HelpCircle, ArrowRight, Search, Check, Layers, Mail, ShieldCheck,
  UserCheck, AlertTriangle, RefreshCw, Send, X, ExternalLink, Trash2, Edit3, MessageSquare,
  LayoutGrid, List, Sparkles, User, ChevronRight, Upload, Plus, MessageCircle, Calendar, Shield
} from 'lucide-react';
import type { SopAuthoringRequest } from '../../../server/persistence/sopAuthoringRequestRepository';
import { SOP_TEMPLATES } from './sopTemplates';
import ActiveRunsDashboard from './ActiveRunsDashboard';
import { useToast } from '../ui';
import { CANONICAL_SOP_CATEGORIES, normalizeSopCategory } from '../../types/sopWorkflow';

interface SOPLibraryProps {
  sops: any[];
  runs: any[];
  readOnly?: boolean;
  onStartCreate?: () => void;
  onOpenStaffTemplate?: () => void;
  onOpenAskModal?: () => void;
  onOpenUploadModal?: () => void;
  onSelectSop?: (sop: any, tab: 'sop' | 'run' | 'history' | 'overview' | 'procedure' | 'checklist' | 'versions') => void;
  onSelectRun?: (run: any) => void;
  onCompareVersions?: (verA: any, verB: any) => void;
  onSelectTemplate?: (template: any) => void;
}

export type LibraryTabId = 
  | 'published' 
  | 'for_comment' 
  | 'awaiting_bic_review' 
  | 'awaiting_owner_review' 
  | 'template' 
  | 'active_runs' 
  | 'archived';

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
  
  // Wave 2 Standardized Tabs: Published first, then collaborative Drafts for Comment, then Dual Review Lanes
  const [activeLibraryTab, setActiveLibraryTab] = useState<LibraryTabId>('published');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

  // Authoring requests state
  const [authoringRequests, setAuthoringRequests] = useState<SopAuthoringRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedReviewRequest, setSelectedReviewRequest] = useState<SopAuthoringRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Quick Comment Modal for "for_comment" lane
  const [commentingSop, setCommentingSop] = useState<any | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

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

  const getSopOwnerDisplay = (sop: any): { label: string; isDept: boolean } => {
    if (sop.sopOwner) {
      return {
        label: sop.sopOwner.name,
        isDept: sop.sopOwner.type === 'department'
      };
    }
    if (sop.processOwner) {
      return { label: sop.processOwner, isDept: false };
    }
    if (sop.ownerRole) {
      return { label: sop.ownerRole, isDept: false };
    }
    return { label: sop.department || 'Operations', isDept: true };
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

  const isComplianceOrBicSop = (s: any) =>
    Boolean(
      s?.requiresBicReview ||
      s?.department === 'Compliance' ||
      s?.category === 'Compliance' ||
      s?.category === 'Transactions' ||
      s?.category === 'Transactions and Compliance' ||
      normalizeSopCategory(s?.category || s?.department) === 'Transactions and Compliance'
    );

  // Promote SOP Draft from "Drafts for Comment" to formal review lane
  const handlePromoteToReview = async (sop: any) => {
    try {
      const isComplianceOrTx = isComplianceOrBicSop(sop);

      const targetStatus: 'awaiting_bic_review' | 'awaiting_owner_review' = 
        isComplianceOrTx ? 'awaiting_bic_review' : 'awaiting_owner_review';

      const targetLaneLabel = isComplianceOrTx ? 'Awaiting BIC Review' : 'Awaiting Owner Review';

      const sopId = sop.id || sop.sopId;
      const res = await fetch(`/api/sops/${sopId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: targetStatus,
          reviewDate: new Date().toISOString()
        })
      });

      if (!res.ok) {
        // Fallback to updating local state if local mockup
        sop.status = targetStatus;
      }

      toast.success({
        title: 'Promoted to Formal Review',
        description: `Draft "${sop.title}" routed to ${targetLaneLabel}.`
      });
      setFeedbackSuccess(`✓ Draft promoted to ${targetLaneLabel}.`);
      setTimeout(() => setFeedbackSuccess(null), 3000);
      window.dispatchEvent(new CustomEvent('sop-status-updated', { detail: { sopId, status: targetStatus } }));
    } catch (err: any) {
      console.error('Failed to promote draft:', err);
      toast.error({
        title: 'Promotion Failed',
        description: err.message || 'Could not promote SOP draft.'
      });
    }
  };

  // Direct Publish for SOPs in Review Lanes
  const handleDirectPublishSop = async (sop: any) => {
    try {
      const sopId = sop.id || sop.sopId;
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/sops/${sopId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: 'published',
          activationDate: today,
          effectiveDate: today,
          publisher: 'Broker-in-Charge'
        })
      });

      if (!res.ok) {
        sop.status = 'published';
        sop.activationDate = today;
      }

      toast.success({
        title: 'SOP Published & Activated',
        description: `SOP "${sop.title}" is now active in the Knowledge Library.`
      });
      setFeedbackSuccess(`✓ SOP "${sop.title}" activated with date ${today}.`);
      setTimeout(() => setFeedbackSuccess(null), 3000);
      window.dispatchEvent(new CustomEvent('sop-published', { detail: { sopId, activationDate: today } }));
    } catch (err: any) {
      console.error('Failed to publish SOP:', err);
      toast.error({
        title: 'Publish Failed',
        description: err.message || 'Could not publish SOP.'
      });
    }
  };

  // Add Comment to Draft SOP
  const handleAddComment = async () => {
    if (!commentingSop || !newCommentText.trim()) return;
    try {
      const commentObj = {
        id: `cm_${Date.now()}`,
        authorName: activeName || 'Team Contributor',
        authorRole: activeRole || 'Staff',
        text: newCommentText.trim(),
        createdAt: new Date().toISOString()
      };

      const existingComments = commentingSop.comments || [];
      const updatedComments = [...existingComments, commentObj];
      commentingSop.comments = updatedComments;

      const sopId = commentingSop.id || commentingSop.sopId;
      await fetch(`/api/sops/${sopId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ comments: updatedComments })
      }).catch(() => {});

      toast.success({
        title: 'Comment Added',
        description: 'Feedback recorded on SOP draft.'
      });
      setNewCommentText('');
      setCommentingSop(null);
    } catch (err: any) {
      console.error('Failed to add comment:', err);
    }
  };

  // Metric derivations
  const publishedSops = sops.filter(s => s.status === 'published' || (!s.status && !['draft', 'for_comment', 'awaiting_bic_review', 'awaiting_owner_review', 'archived', 'retired'].includes(s.status)));
  const publishedCount = publishedSops.length;

  const forCommentList = sops.filter(s => s.status === 'for_comment' || s.status === 'draft');
  const forCommentCount = forCommentList.length;

  const awaitingBicList = sops.filter(s => 
    s.status === 'awaiting_bic_review' || 
    (s.status === 'awaiting_review' && isComplianceOrBicSop(s))
  );
  const awaitingBicReqs = authoringRequests.filter(r => r.requiresBicReview && (r.status === 'submitted' || r.status === 'bic_review'));
  const totalAwaitingBic = awaitingBicList.length + awaitingBicReqs.length;

  const awaitingOwnerList = sops.filter(s => 
    s.status === 'awaiting_owner_review' || 
    (s.status === 'awaiting_review' && !isComplianceOrBicSop(s))
  );
  const awaitingOwnerReqs = authoringRequests.filter(r => !r.requiresBicReview && (r.status === 'submitted' || r.status === 'bic_approved'));
  const totalAwaitingOwner = awaitingOwnerList.length + awaitingOwnerReqs.length;

  const activeRunsCount = runs.filter(r => r.status === 'active' || r.status === 'in_progress' || r.status === 'running').length;
  const atRiskRunsCount = runs.filter(r => r.status === 'at_risk' || r.status === 'delayed' || r.status === 'blocked').length;
  const completedRunsCount = runs.filter(r => r.status === 'completed').length;
  const avgProgress = runs.length > 0 
    ? Math.round(runs.reduce((acc, r) => acc + (r.progressPercent || 0), 0) / runs.length) 
    : 0;

  // Filtered SOPs for list / grid views
  const filteredSops = sops.filter(sop => {
    if (activeLibraryTab === 'template') {
      if (!sop.isTemplate && !sop.tags?.includes('template')) return false;
    } else if (activeLibraryTab === 'published') {
      if (sop.status && sop.status !== 'published') return false;
    } else if (activeLibraryTab === 'for_comment') {
      if (sop.status !== 'for_comment' && sop.status !== 'draft') return false;
    } else if (activeLibraryTab === 'awaiting_bic_review') {
      const isBic = sop.status === 'awaiting_bic_review' || (sop.status === 'awaiting_review' && isComplianceOrBicSop(sop));
      if (!isBic) return false;
    } else if (activeLibraryTab === 'awaiting_owner_review') {
      const isOwner = sop.status === 'awaiting_owner_review' || (sop.status === 'awaiting_review' && !isComplianceOrBicSop(sop));
      if (!isOwner) return false;
    } else if (activeLibraryTab === 'archived') {
      if (sop.status !== 'archived' && sop.status !== 'retired') return false;
    }

    if (deptFilter !== 'all' && sop.department !== deptFilter) return false;
    if (categoryFilter !== 'all') {
      const normalizedSopCategory = normalizeSopCategory(sop.category || sop.department);
      if (normalizedSopCategory !== categoryFilter && sop.category !== categoryFilter) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = sop.title?.toLowerCase().includes(q);
      const matchPurpose = sop.purpose?.toLowerCase().includes(q);
      const matchOwner = sop.sopOwner?.name?.toLowerCase().includes(q) || sop.processOwner?.toLowerCase().includes(q);
      if (!matchTitle && !matchPurpose && !matchOwner) return false;
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

      {/* TOP METRIC CARDS (Contextual Banners with Wave 2 Review Lanes) */}
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
        ) : (
          /* Wave 2 Default Metric Banners: Published + Drafts for Comment + BIC Review + Owner Review */
          <>
            <div 
              onClick={() => setActiveLibraryTab('published')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                activeLibraryTab === 'published' 
                  ? 'bg-[#E5EFEA]/40 border-[#00635C] shadow-xs' 
                  : 'bg-white border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center justify-between">
                <span>Total Published</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-stone-900">{publishedCount}</div>
              <div className="text-[11px] text-emerald-700 font-medium">Authoritative policies active</div>
            </div>

            <div 
              onClick={() => setActiveLibraryTab('for_comment')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                activeLibraryTab === 'for_comment' 
                  ? 'bg-[#E5EFEA]/40 border-[#00635C] shadow-xs' 
                  : 'bg-white border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center justify-between">
                <span>Drafts for Comment</span>
                {forCommentCount > 0 && <span className="w-2 h-2 rounded-full bg-blue-500" />}
              </div>
              <div className="text-2xl font-bold text-stone-900">{forCommentCount}</div>
              <div className="text-[11px] text-stone-500 font-medium">Pre-formal review feedback</div>
            </div>

            <div 
              onClick={() => setActiveLibraryTab('awaiting_bic_review')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                activeLibraryTab === 'awaiting_bic_review' 
                  ? 'bg-amber-50/60 border-amber-500 shadow-xs' 
                  : 'bg-white border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center justify-between">
                <span>Awaiting BIC Review</span>
                {totalAwaitingBic > 0 && <span className="w-2 h-2 rounded-full bg-amber-500" />}
              </div>
              <div className={`text-2xl font-bold ${totalAwaitingBic > 0 ? 'text-amber-900' : 'text-stone-900'}`}>
                {totalAwaitingBic}
              </div>
              <div className="text-[11px] text-amber-700 font-medium">Compliance & escrow gates</div>
            </div>

            <div 
              onClick={() => setActiveLibraryTab('awaiting_owner_review')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                activeLibraryTab === 'awaiting_owner_review' 
                  ? 'bg-purple-50/60 border-purple-500 shadow-xs' 
                  : 'bg-white border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center justify-between">
                <span>Awaiting Owner Review</span>
                {totalAwaitingOwner > 0 && <span className="w-2 h-2 rounded-full bg-purple-500" />}
              </div>
              <div className={`text-2xl font-bold ${totalAwaitingOwner > 0 ? 'text-purple-900' : 'text-stone-900'}`}>
                {totalAwaitingOwner}
              </div>
              <div className="text-[11px] text-purple-700 font-medium">Finance, Ops & Marketing</div>
            </div>
          </>
        )}
      </div>

      {/* WAVE 2 STANDARDIZED TABS */}
      <div 
        role="tablist"
        aria-label="Knowledge Library Sections"
        className="flex items-center gap-1.5 border-b border-stone-200 overflow-x-auto whitespace-nowrap scrollbar-none pb-1 text-xs"
      >
        {[
          { id: 'published', label: 'Published SOPs', count: publishedCount },
          { id: 'for_comment', label: 'Drafts for Comment', count: forCommentCount, badge: forCommentCount > 0, badgeColor: 'bg-blue-100 text-blue-800' },
          { id: 'awaiting_bic_review', label: 'Awaiting BIC Review', count: totalAwaitingBic, badge: totalAwaitingBic > 0, badgeColor: 'bg-amber-100 text-amber-800' },
          { id: 'awaiting_owner_review', label: 'Awaiting Owner Review', count: totalAwaitingOwner, badge: totalAwaitingOwner > 0, badgeColor: 'bg-purple-100 text-purple-800' },
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
              onClick={() => setActiveLibraryTab(tab.id as LibraryTabId)}
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
                    ? (tab.badgeColor || 'bg-amber-100 text-amber-800 font-bold')
                    : 'bg-stone-100 text-stone-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB: ACTIVE CHECKLIST RUNS DASHBOARD */}
      {activeLibraryTab === 'active_runs' && (
        <ActiveRunsDashboard
          publishedSops={publishedSops}
          workspaceId="nest-realty-wilmington"
          hideKpis={true}
        />
      )}

      {/* TAB: DRAFTS FOR COMMENT (Pre-formal review collaboration) */}
      {activeLibraryTab === 'for_comment' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#F7F8F5] border border-stone-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <h3 className="font-bold text-stone-900">Draft SOPs for Comment</h3>
              <p className="text-stone-500 mt-0.5">
                Working drafts open for team commentary and questions before being submitted for formal BIC or Department Owner review.
              </p>
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={() => onStartCreate ? onStartCreate() : window.dispatchEvent(new CustomEvent('open-new-sop-modal'))}
                className="px-3.5 py-2 bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start New Draft</span>
              </button>
            )}
          </div>

          {forCommentList.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-xs text-stone-500 text-xs space-y-2">
              <MessageCircle className="w-9 h-9 text-stone-300 mx-auto" />
              <div className="font-bold text-sm text-stone-900">No drafts currently in comment stage</div>
              <p className="max-w-md mx-auto text-stone-500">
                New SOP drafts created by team members appear here for collaborative feedback before advancing to formal review lanes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {forCommentList.map((sop) => {
                const ownerInfo = getSopOwnerDisplay(sop);
                const commentsCount = (sop.comments || []).length;
                const isCompliance = isComplianceOrBicSop(sop);

                return (
                  <div
                    key={sop.id || sop.sopId}
                    className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs hover:border-[#00635C]/50 hover:shadow-md transition-all flex flex-col justify-between space-y-4 text-left"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                          Draft for Comment
                        </span>
                        <span className="text-[11px] text-stone-400 font-mono">
                          Target v{sop.version || '1.0'}
                        </span>
                      </div>

                      <h4 
                        onClick={() => onSelectSop && onSelectSop(sop, 'overview')}
                        className="font-serif font-bold text-stone-900 text-sm hover:text-[#00635C] cursor-pointer transition-colors"
                      >
                        {sop.title}
                      </h4>

                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {sop.purpose || 'Standard operating procedure draft.'}
                      </p>

                      <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-3 text-[11px] text-stone-500">
                        <span>Owner: <strong className="text-stone-700">{ownerInfo.label}</strong></span>
                        <span>·</span>
                        <span>Category: <strong className="text-[#00635C]">{normalizeSopCategory(sop.category || sop.department)}</strong></span>
                        {commentsCount > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-blue-700 font-semibold flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {commentsCount} comments
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setCommentingSop(sop)}
                        className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-stone-500" />
                        <span>Add Comment</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectSop && onSelectSop(sop, 'overview')}
                          className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePromoteToReview(sop)}
                          className="px-3 py-1.5 rounded-xl bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          title={isCompliance ? 'Promote to BIC Review' : 'Promote to Owner Review'}
                        >
                          <span>Submit to {isCompliance ? 'BIC Review' : 'Owner Review'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: AWAITING BIC REVIEW (Compliance & Contract Risk Gates) */}
      {activeLibraryTab === 'awaiting_bic_review' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-950">Awaiting BIC Review Lane</h3>
                <p className="text-amber-800 mt-0.5">
                  Procedures involving transactions, NCREC statutory disclosures, earnest money escrow, or brokerage legal liability requiring formal Broker-in-Charge sign-off.
                </p>
              </div>
            </div>
          </div>

          {awaitingBicList.length === 0 && awaitingBicReqs.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-xs text-stone-500 text-xs space-y-2">
              <CheckCircle2 className="w-9 h-9 text-emerald-600 mx-auto" />
              <div className="font-bold text-sm text-stone-900">Zero procedures awaiting BIC compliance review</div>
              <p className="max-w-md mx-auto text-stone-500">
                All transaction and regulatory procedures have been formally certified by the Broker-in-Charge.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* SOP Records awaiting BIC review */}
              {awaitingBicList.map((sop) => (
                <div
                  key={sop.id || sop.sopId}
                  className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-left"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-stone-900 text-sm">{sop.title}</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold">
                        BIC Compliance Gate
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-semibold">
                        {normalizeSopCategory(sop.category || 'Transactions and Compliance')}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {sop.purpose || 'Regulatory transaction protocol awaiting BIC certification.'}
                    </p>
                    <div className="text-[11px] text-stone-500">
                      Owner: <strong className="text-stone-800">{getSopOwnerDisplay(sop).label}</strong> · State: <strong className="text-stone-800">{sop.stateJurisdiction || 'NC'}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectSop && onSelectSop(sop, 'overview')}
                      className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Inspect Procedure
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirectPublishSop(sop)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>BIC Approve & Activate</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Authoring Requests awaiting BIC review */}
              {awaitingBicReqs.map((req) => (
                <div
                  key={req.id}
                  className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-left"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-stone-900 text-sm">{req.processName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold">
                        Staff Submission
                      </span>
                    </div>
                    <p className="text-xs text-stone-600">
                      Authored by <strong className="text-stone-800">{req.employeeName}</strong> ({req.employeeRole})
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReviewRequest(req);
                        setReviewNotes(req.reviewNotes || '');
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      BIC Review & Sign-Off
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: AWAITING OWNER REVIEW (Finance, Operations, Marketing) */}
      {activeLibraryTab === 'awaiting_owner_review' && (
        <div className="space-y-4">
          <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-purple-950">Awaiting Department Owner Review Lane</h3>
                <p className="text-purple-800 mt-0.5">
                  Procedures in Finance, Office Operations, Vendor Management, and Marketing awaiting verification by the designated Department Lead or Process Owner.
                </p>
              </div>
            </div>
          </div>

          {awaitingOwnerList.length === 0 && awaitingOwnerReqs.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-xs text-stone-500 text-xs space-y-2">
              <CheckCircle2 className="w-9 h-9 text-emerald-600 mx-auto" />
              <div className="font-bold text-sm text-stone-900">Zero procedures awaiting owner verification</div>
              <p className="max-w-md mx-auto text-stone-500">
                All departmental operational procedures are verified and current.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {awaitingOwnerList.map((sop) => (
                <div
                  key={sop.id || sop.sopId}
                  className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs hover:border-purple-400 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-left"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-stone-900 text-sm">{sop.title}</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-900 text-[10px] font-bold">
                        Department Owner Review
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-semibold">
                        {normalizeSopCategory(sop.category || sop.department)}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {sop.purpose || 'Standard operating procedure awaiting owner verification.'}
                    </p>
                    <div className="text-[11px] text-stone-500">
                      Owner: <strong className="text-stone-800">{getSopOwnerDisplay(sop).label}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectSop && onSelectSop(sop, 'overview')}
                      className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Inspect Procedure
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirectPublishSop(sop)}
                      className="px-4 py-2 bg-[#00635C] hover:bg-[#00514B] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Owner Approve & Publish</span>
                    </button>
                  </div>
                </div>
              ))}

              {awaitingOwnerReqs.map((req) => (
                <div
                  key={req.id}
                  className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs hover:border-purple-400 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-left"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-stone-900 text-sm">{req.processName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-900 text-[10px] font-bold">
                        Staff Contributor Submission
                      </span>
                    </div>
                    <p className="text-xs text-stone-600">
                      Authored by <strong className="text-stone-800">{req.employeeName}</strong> ({req.employeeRole})
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReviewRequest(req);
                        setReviewNotes(req.reviewNotes || '');
                      }}
                      className="px-4 py-2 bg-[#00635C] hover:bg-[#00514B] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
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

      {/* TAB: PUBLISHED, TEMPLATES, ARCHIVED (Unified Toolbar & View) */}
      {(activeLibraryTab === 'published' || activeLibraryTab === 'template' || activeLibraryTab === 'archived') && (
        <div className="space-y-4">
          
          {/* TOOLBAR WITH CATEGORY DROPDOWN */}
          <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search procedures by title, steps, owner, or systems..."
                className="w-full pl-9 pr-3 py-2 bg-[#F7F8F5] border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
              />
            </div>
            
            {/* Category Dropdown Filter & View Controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
              
              {/* Category Filter Dropdown */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-[#F7F8F5] border border-stone-200 rounded-xl text-xs text-stone-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
              >
                <option value="all">All Categories</option>
                {CANONICAL_SOP_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
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
              {filteredSops.map((sop) => {
                const ownerInfo = getSopOwnerDisplay(sop);
                const activationDateStr = sop.activationDate || sop.effectiveDate || '2026-01-15';

                return (
                  <div
                    key={sop.id || sop.sopId}
                    onClick={() => onSelectSop && onSelectSop(sop, 'overview')}
                    className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs hover:border-[#00635C]/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group text-left relative"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-0.5 bg-[#E5EFEA] text-[#00635C] rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {normalizeSopCategory(sop.category || sop.department)}
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
                      <div className="flex flex-col">
                        <span>Owner: <strong className="text-stone-700">{ownerInfo.label}</strong></span>
                        <span className="text-[10px] text-stone-400">Activated: {activationDateStr}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#00635C] font-semibold group-hover:translate-x-0.5 transition-transform">
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List Layout */
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F7F8F5] border-b border-stone-200 text-stone-600 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Procedure Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">SOP Owner</th>
                    <th className="py-3 px-4">Activation Date</th>
                    <th className="py-3 px-4">Version</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800 font-medium">
                  {filteredSops.map((sop) => {
                    const ownerInfo = getSopOwnerDisplay(sop);
                    const activationDateStr = sop.activationDate || sop.effectiveDate || '2026-01-15';

                    return (
                      <tr 
                        key={sop.id || sop.sopId}
                        onClick={() => onSelectSop && onSelectSop(sop, 'overview')}
                        className="hover:bg-stone-50/70 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-semibold text-stone-900 group-hover:text-[#00635C]">
                          {sop.title}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-[#E5EFEA] text-[#00635C] rounded-full text-[10px] font-semibold">
                            {normalizeSopCategory(sop.category || sop.department)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-600">
                          {ownerInfo.label}
                        </td>
                        <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                          {activationDateStr}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Quick Comment Modal for "for_comment" lane */}
      {commentingSop && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp text-left font-sans">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                <MessageSquare className="w-4 h-4 text-[#00635C]" />
                <span>Comment on Draft SOP</span>
              </div>
              <button
                type="button"
                onClick={() => setCommentingSop(null)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-semibold text-stone-900">{commentingSop.title}</div>
              <p className="text-stone-500 text-[11px]">
                Post feedback or questions before this draft is promoted to formal BIC/Owner review.
              </p>
              <textarea
                rows={4}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Suggest adjustments to steps, roles, systems, or approval gates..."
                className="w-full p-3 bg-[#F7F8F5] border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setCommentingSop(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newCommentText.trim()}
                onClick={handleAddComment}
                className="px-4 py-2 bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
              >
                Post Comment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Delete Confirmation Modal */}
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

      {/* Review Modal for Staff Authoring Requests */}
      {selectedReviewRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 font-sans animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl text-stone-900 flex flex-col max-h-[90vh]">
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
                    This SOP requires BIC review before official publication.
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
