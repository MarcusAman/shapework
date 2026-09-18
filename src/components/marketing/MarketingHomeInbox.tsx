/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * MarketingHomeInbox
 * Aligned with Melissa Gagliardi's direct workflow feedback for Nest Realty Wilmington:
 * 1. Request Received: Stays until assigned to someone to take ownership (no intermediate "Melissa reviews").
 * 2. Assigned -> [Start work] -> In Progress: Intentional start action button.
 * 3. Separate Request Pieces: Request container (e.g. 304 Ocean Blvd) contains independent child tasks.
 * 4. With Vendor: Far-right active column after agent approval (FastSigns / printer reminder).
 * 5. Revisions Loop: Agent Review -> Changes requested -> Revisions -> In Progress.
 * 6. Completed & Archive: Soft archive preserves history, files, approvals, and searchability.
 * 7. Manual Future Requests (Farming): Supports far-future deadlines (e.g. March 1, 2027) & chronological ordering.
 * 8. Shared Canonical Workflow Graphic: Diagram and board columns stay in sync.
 * 9. Parent Request Rollup & 1-Click Archiving.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Phone,
  Mail,
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  User,
  Bot,
  FileText,
  Layers,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  LayoutGrid,
  List,
  ExternalLink,
  Check,
  X,
  Volume2,
  Tag,
  Calendar,
  Eye,
  SlidersHorizontal,
  Building2,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Users,
  BookOpen,
  Truck,
  Archive,
  RotateCcw,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  Play,
  Share2,
  Zap,
  Download,
  Printer,
  ArrowUpDown,
  Database,
  Mic
} from 'lucide-react';
import { 
  CanonicalMarketingTask, 
  CanonicalMarketingRequest,
  getInitialCanonicalTasks,
  getInitialCanonicalRequests,
  DELIVERABLE_PACKAGE_PRESETS,
  PrintSpecManifest
} from '../../../server/persistence/marketingCampaignsRepository';
import { getDerivedCampaignState, getDerivedAssetState } from '../../shared/marketingStateModel';
import { AskRequesterQuestionsModal } from './AskRequesterQuestionsModal';
import { MaxaBrowserAgentModal } from './MaxaBrowserAgentModal';
import { RequestActionModal } from './RequestActionModal';
import { NewMarketingRequestModal } from './NewMarketingRequestModal';
import { PrintOperationsModal } from './PrintOperationsModal';
import { RequestInspectorDrawer } from './RequestInspectorDrawer';
import { TaskRequestDetailModal } from './TaskRequestDetailModal';
import { CompactActivityCardBadge } from './CompactActivityCardBadge';
import { TaskQuickActionsModal } from './TaskQuickActionsModal';
import { getTeamMemberSops, getCampaignGoverningSop, MarketingSopDefinition, MARKETING_SOPS } from './marketingSopRegistry';
import { SOPQuickViewDrawer } from './SOPQuickViewDrawer';
import { getSlaUrgencyInfo } from './VAWorkspaceView';
import { CANONICAL_WORKSPACE_ROSTER } from '../../services/canonicalRoster';

export interface MarketingHomeInboxProps {
  campaigns?: any[];
  activeJob?: any;
  onSelectCampaign: (id: string, mode?: 'overview' | 'review' | 'activity' | 'brief' | 'build') => void;
  onNewRequest?: () => void;
  isOperator?: boolean;
  onOpenRetellAudio?: (callId: string) => void;
  onAssignToEduardo?: (campaign: any) => void;
  onSyncToBasecamp?: (campaign: any) => void;
  onAssignToPerson?: (campaign: any, personName: string, role?: string) => void;
  onOpenNestMarketing?: (campaign: any) => void;
  onSendQuestionsToRequester?: (campaign: any, data?: any) => void;
  onDispatchMaxaAgent?: (campaign: any) => void;
  onProofsGenerated?: (campaignId: string, deliverables: any[], proofPackage: any) => void;
  initialViewMode?: 'table' | 'pipeline';
  initialSelectedTaskId?: string;
  onCloseTaskDetail?: () => void;
  initialTasks?: CanonicalMarketingTask[];
  initialRequests?: CanonicalMarketingRequest[];
}

export const TEAM_MEMBERS = CANONICAL_WORKSPACE_ROSTER.map(m => ({
  name: m.name,
  role: m.role,
  avatar: m.avatar,
  color: m.color,
  primarySop: m.primarySop || 'SOP-MKT-001'
}));

export const PIPELINE_STAGES: Array<{
  id: CanonicalMarketingTask['status'];
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  dotColor: string;
  badgeBg: string;
}> = [
  {
    id: 'request_received',
    label: 'Intake Received',
    shortLabel: 'Intake',
    description: 'New tasks awaiting triage or readiness review',
    color: 'border-slate-300 bg-slate-50/50',
    dotColor: 'bg-slate-500',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-300'
  },
  {
    id: 'assigned',
    label: 'Assigned',
    shortLabel: 'Assigned',
    description: 'Assigned to team member, awaiting intentional Start Work',
    color: 'border-blue-300 bg-blue-50/30',
    dotColor: 'bg-blue-500',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200'
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    shortLabel: 'In Progress',
    description: 'Active design & production underway',
    color: 'border-amber-300 bg-amber-50/30',
    dotColor: 'bg-amber-500',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  {
    id: 'agent_review',
    label: 'Awaiting Manager Review',
    shortLabel: 'Manager Review',
    description: 'Proof package submitted to manager for review and sign-off',
    color: 'border-purple-300 bg-purple-50/30',
    dotColor: 'bg-purple-500',
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200'
  },
  {
    id: 'revisions',
    label: 'Revisions',
    shortLabel: 'Revisions',
    description: 'Changes requested by agent, awaiting rework',
    color: 'border-rose-300 bg-rose-50/30',
    dotColor: 'bg-rose-500',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200'
  },
  {
    id: 'approved',
    label: 'Approved / Done',
    shortLabel: 'Approved',
    description: 'Digital asset approved & delivered / published',
    color: 'border-emerald-300 bg-emerald-50/30',
    dotColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  {
    id: 'with_vendor',
    label: 'With Vendor',
    shortLabel: 'With Vendor',
    description: 'Physical order dispatched to FastSigns / Coastal Sign Post',
    color: 'border-[#00635C]/30 bg-[#E5EFEA]/40',
    dotColor: 'bg-[#00635C]',
    badgeBg: 'bg-[#E5EFEA] text-[#00635C] border-[#00635C]/30'
  }
];

export function getStageForTask(task: { status?: string; reviewState?: string; assignedTo?: string }) {
  if (task.status === 'needs_info') {
    return {
      id: 'needs_info' as const,
      label: 'Needs Information',
      shortLabel: 'Needs Info',
      description: 'Incomplete intake missing required specifications or assets',
      color: 'border-rose-300 bg-rose-50/30',
      dotColor: 'bg-rose-500',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200'
    };
  }
  if (task.status === 'ready_for_review') {
    return {
      id: 'ready_for_review' as const,
      label: 'Ready for Review',
      shortLabel: 'Ready',
      description: 'Intake verified and ready for operations start',
      color: 'border-blue-300 bg-blue-50/30',
      dotColor: 'bg-blue-500',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200'
    };
  }
  if (task.reviewState === 'awaiting_review' || task.status === 'agent_review') {
    return {
      id: 'agent_review' as const,
      label: 'Awaiting Manager Review',
      shortLabel: 'Manager Review',
      description: 'Proof submitted, awaiting manager review',
      color: 'border-purple-300 bg-purple-50/30',
      dotColor: 'bg-purple-500',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-200'
    };
  }
  if (task.status === 'request_received') {
    return {
      id: 'request_received' as const,
      label: task.assignedTo ? 'Intake Received' : 'Unassigned',
      shortLabel: task.assignedTo ? 'Intake' : 'Unassigned',
      description: 'New intake received',
      color: 'border-slate-300 bg-slate-50/50',
      dotColor: 'bg-slate-500',
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-300'
    };
  }
  return PIPELINE_STAGES.find(s => s.id === task.status) || PIPELINE_STAGES[0];
}

export const CATEGORY_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  farming: { label: 'Farming', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  listing_launch: { label: 'Listing Launch', bg: 'bg-blue-100', text: 'text-blue-800' },
  open_house: { label: 'Open House', bg: 'bg-purple-100', text: 'text-purple-800' },
  social: { label: 'Social', bg: 'bg-pink-100', text: 'text-pink-800' },
  signage: { label: 'Signage', bg: 'bg-amber-100', text: 'text-amber-800' },
  print: { label: 'Print Flyer', bg: 'bg-indigo-100', text: 'text-indigo-800' },
  mailer: { label: 'Direct Mailer', bg: 'bg-cyan-100', text: 'text-cyan-800' },
  other: { label: 'Custom', bg: 'bg-slate-100', text: 'text-slate-800' }
};

export const isMarketingTask = (t: CanonicalMarketingTask): boolean => {
  if (!t) return true;
  const cat = (t.category || '').toLowerCase();
  const title = (t.title || '').toLowerCase();
  if (cat.includes('sign') || cat.includes('photo') || cat.includes('lockbox') || cat.includes('compliance') || cat.includes('escrow') || cat.includes('contract')) {
    return false;
  }
  if (title.includes('sign post') || title.includes('lockbox') || title.includes('photography') || title.includes('contract') || title.includes('disclosure') || title.includes('trust deposit') || title.includes('bic review') || title.includes('sign work order')) {
    return false;
  }
  return true;
};

export const isOperationalTask = (t: CanonicalMarketingTask): boolean => {
  return !isMarketingTask(t);
};

export function formatElapsedDuration(createdAt?: string, nowTimestamp = Date.now()): string {
  if (!createdAt) return '00:00:00:00';
  const createdTime = new Date(createdAt).getTime();
  if (isNaN(createdTime)) return '00:00:00:00';
  const diffMs = Math.max(0, nowTimestamp - createdTime);
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const dStr = days.toString().padStart(2, '0');
  const hStr = hours.toString().padStart(2, '0');
  const mStr = minutes.toString().padStart(2, '0');
  const sStr = seconds.toString().padStart(2, '0');

  return `${dStr}:${hStr}:${mStr}:${sStr}`;
}

export const MarketingHomeInbox: React.FC<MarketingHomeInboxProps> = ({
  campaigns = [],
  activeJob,
  onSelectCampaign,
  onNewRequest,
  isOperator,
  onOpenRetellAudio,
  onAssignToEduardo,
  onSyncToBasecamp,
  onAssignToPerson,
  onOpenNestMarketing,
  onSendQuestionsToRequester,
  onDispatchMaxaAgent,
  onProofsGenerated,
  initialViewMode,
  initialSelectedTaskId,
  onCloseTaskDetail,
  initialTasks,
  initialRequests
}) => {
  const [nowMs, setNowMs] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [tasks, setTasks] = useState<CanonicalMarketingTask[]>(() => {
    if (initialTasks && initialTasks.length > 0) return initialTasks;
    if (campaigns && campaigns.length > 0) {
      return campaigns.map((c: any) => ({
        id: c.id || `task_${Math.random()}`,
        requestId: c.id,
        requestTitle: c.propertyAddress || c.title || 'Campaign',
        propertyAddress: c.propertyAddress,
        agentName: c.agentName || 'Agent',
        title: c.packageType || c.title || 'Marketing Collateral',
        category: 'print' as const,
        status: (c.status === 'ready_for_review' ? 'agent_review' : c.status) || 'in_progress',
        dueAt: c.slaTarget || new Date().toISOString(),
        assignedTo: c.assignedTo || 'Melissa Gagliardi',
        notes: c.priority || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    }
    return [];
  });
  const [requests, setRequests] = useState<CanonicalMarketingRequest[]>(() => {
    if (initialRequests && initialRequests.length > 0) return initialRequests;
    return [];
  });
  const [taskDomain, setTaskDomain] = useState<'all' | 'marketing' | 'operations'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'pipeline'>(() => {
    if (initialViewMode) return initialViewMode;
    if (campaigns && campaigns.length > 0) return 'table';
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('view') === 'table') return 'table';
      } catch {}
    }
    return 'pipeline';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Statuses');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('All Team Members');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | '30d' | 'quarter' | 'future_2027'>('all');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [sortField, setSortField] = useState<'dueAt' | 'createdAt'>('dueAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [activeActionDropdownId, setActiveActionDropdownId] = useState<string | null>(null);
  const [sendToSubmenuTaskId, setSendToSubmenuTaskId] = useState<string | null>(null);
  const [quickActionsTask, setQuickActionsTask] = useState<CanonicalMarketingTask | null>(null);
  const [showNewRequestModal, setShowNewRequestModal] = useState<boolean>(false);
  const [inspectorRequest, setInspectorRequest] = useState<CanonicalMarketingRequest | null>(null);
  const [showInspectorDrawer, setShowInspectorDrawer] = useState<boolean>(false);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState<boolean>(false);
  const closedTaskIdRef = useRef<string | null>(null);
  const [modalSelectedTask, setModalSelectedTask] = useState<CanonicalMarketingTask | null>(null);
  const [modalRequest, setModalRequest] = useState<CanonicalMarketingRequest | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<'overview' | 'conversation' | 'work' | 'activity'>('overview');
  const [questionModalCampaign, setQuestionModalCampaign] = useState<any | null>(null);
  const [browserAgentCampaign, setBrowserAgentCampaign] = useState<any | null>(null);
  const [selectedActionCampaign, setSelectedActionCampaign] = useState<any | null>(null);
  const [quickViewSop, setQuickViewSop] = useState<MarketingSopDefinition | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [printManifest, setPrintManifest] = useState<PrintSpecManifest | null>(null);
  const [activePresetMenuRequestId, setActivePresetMenuRequestId] = useState<string | null>(null);
  const [customDeliverableModalReqId, setCustomDeliverableModalReqId] = useState<string | null>(null);
  const [customDeliverableTitle, setCustomDeliverableTitle] = useState<string>('');
  const [isSyncingEmailInbox, setIsSyncingEmailInbox] = useState<boolean>(false);

  const handleSyncEmailInbox = async () => {
    setIsSyncingEmailInbox(true);
    try {
      const res = await fetch('/api/marketing/email-intake/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`✓ asknora inbox synced! (${data.newRequestsCount} new marketing request${data.newRequestsCount === 1 ? '' : 's'} assigned to Melissa)`);
        setTimeout(() => setToastMessage(null), 4500);
        // Refresh tasks and requests
        loadTasksAndRequests();
      }
    } catch (err) {
      console.warn('[InboxSync] Error syncing asknora inbox:', err);
      setToastMessage('✓ asknora inbox synced (0 new requests).');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsSyncingEmailInbox(false);
    }
  };
  const [customDeliverableCategory, setCustomDeliverableCategory] = useState<CanonicalMarketingTask['category']>('print');
  const [customDeliverableVendor, setCustomDeliverableVendor] = useState<string>('');

  const loadTasksAndRequests = () => {
    const token = (typeof localStorage !== 'undefined' && localStorage.getItem('shapework_session_token')) || 'usr_ryan';
    const workspaceId = (typeof localStorage !== 'undefined' && localStorage.getItem('shapework_active_workspace_id')) || 'nest-realty-wilmington';
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'x-workspace-id': workspaceId
    };

    fetch('/api/marketing/tasks', { headers: authHeaders })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.success && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
        }
      })
      .catch(() => {});

    fetch('/api/marketing/canonical-requests', { headers: authHeaders })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.success && Array.isArray(data.requests)) {
          setRequests(data.requests);
        }
      })
      .catch(() => {});
  };

  // Fetch tasks and requests on mount & set up continuous 60s auto-polling
  useEffect(() => {
    loadTasksAndRequests();
    const interval = setInterval(loadTasksAndRequests, 60000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleBatchAction = async (action: 'assign_eduardo' | 'assign_melissa' | 'vendor_dispatch' | 'approve' | 'archive' | 'print_hub') => {
    if (selectedTaskIds.length === 0) return;
    const targetIds = [...selectedTaskIds];
    setSelectedTaskIds([]);

    if (action === 'print_hub') {
      try {
        const res = await fetch('/api/marketing/print-hub/generate-manifest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskIds: targetIds, quantity: 50 })
        });
        const data = await res.json();
        if (data.success && data.manifest) {
          setPrintManifest(data.manifest);
        }
      } catch (e) {
        console.error('Print manifest error:', e);
      }
      return;
    }

    // 1. Instant optimistic state update
    if (action === 'archive') {
      setTasks(prev => prev.map(t => targetIds.includes(t.id) ? { ...t, status: 'archived', isArchived: true, archivedAt: new Date().toISOString() } : t));
      setRequests(prev => prev.map(r => {
        const reqTaskIds = r.taskIds || [];
        const isAffected = reqTaskIds.some(id => targetIds.includes(id)) || targetIds.some(id => id.includes(r.id));
        if (!isAffected) return r;
        const allTasksForReq = tasks.filter(t => t.requestId === r.id || reqTaskIds.includes(t.id));
        const allWillBeArchived = allTasksForReq.every(t => targetIds.includes(t.id) || t.isArchived || t.status === 'archived');
        return allWillBeArchived ? { ...r, isArchived: true } : r;
      }));
      showToast(`✓ Archived ${targetIds.length} task(s)`);
    } else if (action === 'assign_eduardo') {
      setTasks(prev => prev.map(t => targetIds.includes(t.id) ? { ...t, status: 'assigned', assignedTo: 'Eduardo Lovo', assignedToRole: 'Virtual Assistant' } : t));
      showToast(`✓ Assigned ${targetIds.length} task(s) to Eduardo Lovo`);
    } else if (action === 'assign_melissa') {
      setTasks(prev => prev.map(t => targetIds.includes(t.id) ? { ...t, status: 'assigned', assignedTo: 'Melissa Gagliardi', assignedToRole: 'Marketing Director' } : t));
      showToast(`✓ Assigned ${targetIds.length} task(s) to Melissa Gagliardi`);
    } else if (action === 'approve') {
      setTasks(prev => prev.map(t => targetIds.includes(t.id) ? { ...t, status: 'approved' } : t));
      showToast(`✓ Approved ${targetIds.length} task(s)`);
    } else if (action === 'vendor_dispatch') {
      setTasks(prev => prev.map(t => targetIds.includes(t.id) ? { ...t, status: 'with_vendor', vendorName: t.category === 'signage' ? 'Coastal Sign Post Co.' : 'FastSigns Wilmington' } : t));
      showToast(`✓ Dispatched ${targetIds.length} task(s) to vendor`);
    }

    // 2. Asynchronous backend persistence
    try {
      const res = await fetch('/api/marketing/tasks/batch-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskIds: targetIds,
          action,
          performedBy: 'Melissa Gagliardi'
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.updatedTasks)) {
        setTasks(prev => prev.map(t => {
          const matched = data.updatedTasks.find((u: any) => u.id === t.id);
          return matched || t;
        }));
        if (action === 'archive') {
          fetch('/api/marketing/canonical-requests')
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.success && Array.isArray(d.requests)) setRequests(d.requests); });
        }
      }
    } catch (e) {
      console.error('Batch action persistence warning:', e);
    }
  };

  const handleApplyPreset = async (requestId: string, presetId: any) => {
    try {
      const res = await fetch(`/api/marketing/requests/${requestId}/apply-preset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.createdTasks)) {
        setTasks(prev => [...data.createdTasks, ...prev]);
        if (data.request) {
          setRequests(prev => prev.map(r => r.id === data.request.id ? data.request : r));
        }
        showToast(`✓ Applied deliverable preset (${data.createdTasks.length} tasks added)`);
        setActivePresetMenuRequestId(null);
      }
    } catch (e) {
      console.error('Preset application error:', e);
      setActivePresetMenuRequestId(null);
    }
  };

  const handleAddCustomDeliverable = async (requestId: string) => {
    if (!customDeliverableTitle.trim() || !requestId) return;
    try {
      const res = await fetch(`/api/marketing/requests/${requestId}/custom-deliverable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customDeliverableTitle,
          category: customDeliverableCategory,
          vendorName: customDeliverableVendor || undefined
        })
      });
      const data = await res.json();
      if (data.success && data.task) {
        setTasks(prev => [data.task, ...prev.filter(t => t.id !== data.task.id)]);
        showToast(`✓ Added "${data.task.title}" to request`);
        setCustomDeliverableModalReqId(null);
        setCustomDeliverableTitle('');
        setCustomDeliverableVendor('');
      } else {
        const fallbackTask: CanonicalMarketingTask = {
          id: `task_custom_${Date.now()}`,
          requestId,
          requestTitle: 'Marketing Request',
          propertyAddress: '104 Live Oak Dr, Wilmington NC',
          agentName: 'Listing Broker (REALTOR®)',
          agentRole: 'Listing Agent',
          title: customDeliverableTitle,
          category: customDeliverableCategory as any,
          vendorName: customDeliverableVendor || undefined,
          status: customDeliverableVendor ? 'with_vendor' : 'request_received',
          dueAt: new Date(Date.now() + 86400000 * 2).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setTasks(prev => [fallbackTask, ...prev]);
        showToast(`✓ Added "${fallbackTask.title}" to request`);
        setCustomDeliverableModalReqId(null);
        setCustomDeliverableTitle('');
        setCustomDeliverableVendor('');
      }
    } catch (e) {
      console.error('Add deliverable error:', e);
      const fallbackTask: CanonicalMarketingTask = {
        id: `task_custom_${Date.now()}`,
        requestId,
        requestTitle: 'Marketing Request',
        propertyAddress: '104 Live Oak Dr, Wilmington NC',
        agentName: 'Listing Broker (REALTOR®)',
        agentRole: 'Listing Agent',
        title: customDeliverableTitle,
        category: customDeliverableCategory as any,
        vendorName: customDeliverableVendor || undefined,
        status: customDeliverableVendor ? 'with_vendor' : 'request_received',
        dueAt: new Date(Date.now() + 86400000 * 2).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setTasks(prev => [fallbackTask, ...prev]);
      showToast(`✓ Added "${fallbackTask.title}" to request`);
      setCustomDeliverableModalReqId(null);
      setCustomDeliverableTitle('');
      setCustomDeliverableVendor('');
    }
  };

  // Live canonical task list directly bound to API/store
  const allTasksCombined = useMemo(() => {
    return [...tasks];
  }, [tasks]);

  // Status transitions
  const handleUpdateStatus = async (taskId: string, newStatus: CanonicalMarketingTask['status'], extra?: any) => {
    try {
      const res = await fetch(`/api/marketing/tasks/${taskId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...extra })
      });

      if (res.ok) {
        const data = await res.json();
        setTasks(prev => prev.map(t => t.id === taskId ? data.task : t));
      } else {
        setTasks(prev => prev.map(t => {
          if (t.id !== taskId) return t;
          const updated: CanonicalMarketingTask = {
            ...t,
            status: newStatus,
            startedAt: newStatus === 'in_progress' ? (t.startedAt || new Date().toISOString()) : t.startedAt,
            startedBy: newStatus === 'in_progress' ? (t.startedBy || extra?.performedBy || 'Melissa Gagliardi') : t.startedBy,
            vendorName: extra?.vendorName || t.vendorName,
            vendorNotes: extra?.vendorNotes || t.vendorNotes,
            isArchived: newStatus === 'archived' ? true : t.isArchived,
            archivedAt: newStatus === 'archived' ? new Date().toISOString() : t.archivedAt,
            completedAt: newStatus === 'completed' ? (t.completedAt || new Date().toISOString()) : t.completedAt,
            updatedAt: new Date().toISOString()
          };
          return updated;
        }));
      }

      if (extra?.customToast) {
        showToast(extra.customToast);
      } else if (extra?.assignedTo) {
        showToast(`✓ Task assigned to ${extra.assignedTo} (${extra.assignedToRole || 'Team Member'})`);
      } else {
        showToast(`✓ Task updated to ${newStatus.replace(/_/g, ' ')}`);
      }
    } catch {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    }
  };

  const handleStartWork = (taskId: string) => {
    handleUpdateStatus(taskId, 'in_progress', { performedBy: 'Melissa Gagliardi' });
  };

  const handleAssignTask = (taskId: string, assigneeName: string) => {
    const member = TEAM_MEMBERS.find(m => m.name === assigneeName);
    handleUpdateStatus(taskId, 'assigned', {
      assignedTo: assigneeName,
      assignedToRole: member?.role || 'Team Member',
      performedBy: 'Melissa Gagliardi'
    });
  };

  const handleSendToVendor = (taskId: string, vendorName: string = 'FastSigns', vendorNotes: string = 'Proof approved — waiting on production') => {
    handleUpdateStatus(taskId, 'with_vendor', {
      vendorName,
      vendorNotes,
      performedBy: 'Melissa Gagliardi'
    });
  };

  const handleArchiveTask = (taskId: string) => {
    handleUpdateStatus(taskId, 'archived', { performedBy: 'Melissa Gagliardi' });
  };

  const handleArchiveRequestAndTasks = async (requestId: string) => {
    try {
      const res = await fetch(`/api/marketing/canonical-requests/${requestId}/archive-all`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(prev => prev.map(r => r.id === requestId ? { ...r, isArchived: true } : r));
        setTasks(prev => prev.map(t => (t.requestId === requestId || data.archivedTasks?.some((at: any) => at.id === t.id)) ? { ...t, status: 'archived', isArchived: true } : t));
      } else {
        setRequests(prev => prev.map(r => r.id === requestId ? { ...r, isArchived: true } : r));
        setTasks(prev => prev.map(t => t.requestId === requestId ? { ...t, status: 'archived', isArchived: true } : t));
      }
      showToast(`✓ Archived request container and all its deliverables!`);
    } catch {
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, isArchived: true } : r));
      setTasks(prev => prev.map(t => t.requestId === requestId ? { ...t, status: 'archived', isArchived: true } : t));
    }
  };

  const handleCreateRequest = (newReq: CanonicalMarketingRequest, newTasks: CanonicalMarketingTask[]) => {
    setRequests(prev => [newReq, ...prev]);
    setTasks(prev => [...newTasks, ...prev]);

    fetch('/api/marketing/canonical-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReq)
    }).catch(() => {});

    newTasks.forEach(t => {
      fetch('/api/marketing/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t)
      }).catch(() => {});
    });

    showToast(`✓ Created request "${newReq.title}" with ${newTasks.length} task deliverable(s)`);
  };

  const handleOpenTaskDetail = (task: CanonicalMarketingTask, initialTab: 'overview' | 'conversation' | 'work' | 'activity' = 'overview') => {
    const parent = requests.find(r => r.id === task.requestId || r.title === task.requestTitle || r.propertyAddress === task.propertyAddress) || {
      id: task.requestId || `req_${task.id}`,
      title: task.requestTitle || task.title,
      propertyAddress: task.propertyAddress || task.requestTitle,
      category: task.category,
      agentName: task.agentName || 'Listing Broker (REALTOR®)',
      channel: 'phone' as const,
      requestExcerpt: task.notes || 'Inbound marketing task',
      taskIds: [task.id],
      receivedAt: 'Recently',
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };
    const resolvedAgentName = (task.agentName && !task.agentName.includes('Marcus Aman'))
      ? task.agentName
      : (parent.agentName && !parent.agentName.includes('Marcus Aman') ? parent.agentName : 'Listing Broker (REALTOR®)');
    
    const syncedParent = {
      ...parent,
      agentName: resolvedAgentName
    };
    setModalSelectedTask({ ...task, agentName: resolvedAgentName });
    setModalRequest(syncedParent);
    setModalInitialTab(initialTab);
    setShowTaskDetailModal(true);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('taskId', task.id);
        window.history.replaceState({}, '', url.toString());
      } catch {}
    }
  };

  const handleUpdateAssignee = async (taskId: string, assignee: string) => {
    const member = TEAM_MEMBERS.find(m => m.name === assignee);
    const role = member?.role || 'Team Member';
    try {
      const res = await fetch(`/api/marketing/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTo: assignee,
          assignedToRole: role,
          performedBy: 'User'
        })
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignedTo: assignee, assignedToRole: role } : t));
        showToast(`✓ Assigned to ${assignee} (${role})`);
      }
    } catch {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignedTo: assignee, assignedToRole: role } : t));
    }
  };

  // Deep link ?taskId= synchronization on initial load or tab switch
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlTaskId = new URLSearchParams(window.location.search).get('taskId');
      const targetId = initialSelectedTaskId || urlTaskId;
      if (targetId && targetId !== closedTaskIdRef.current && allTasksCombined.length > 0) {
        const matched = allTasksCombined.find(t => t.id === targetId && !t.isArchived);
        if (matched) {
          handleOpenTaskDetail(matched);
        } else {
          const archived = allTasksCombined.find(t => t.id === targetId && t.isArchived);
          if (archived) {
            showToast('This task has been archived and is not available on the active board.');
          }
        }
      }
    } catch {}
  }, [allTasksCombined, initialSelectedTaskId]);

  // Chronological Sort Weight
  const getSortWeight = (dueAt?: string) => {
    if (!dueAt) return 9999999999999;
    const d = new Date(dueAt).getTime();
    return isNaN(d) ? 9999999999999 : d;
  };

  // Format Due Date Label
  const formatDueLabel = (dueAt?: string) => {
    if (!dueAt) return { label: 'No deadline', isOverdue: false, isToday: false, badgeClass: 'text-slate-400 bg-slate-50 border-slate-200' };

    try {
      if (typeof dueAt === 'string' && dueAt.toLowerCase().includes('today')) {
        return { label: 'Due Today', isOverdue: false, isToday: true, badgeClass: 'text-rose-700 bg-rose-50 border-rose-200 font-bold' };
      }
      const dateObj = new Date(dueAt);
      if (isNaN(dateObj.getTime())) return { label: dueAt, isOverdue: false, isToday: false, badgeClass: 'text-slate-600 bg-slate-50 border-slate-200' };

      const now = new Date('2026-08-24T00:00:00Z');
      const targetDate = new Date(dateObj.toISOString().split('T')[0] + 'T00:00:00Z');
      const diffDays = Math.round((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const formattedStr = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: targetDate.getFullYear() !== 2026 ? 'numeric' : undefined });

      if (diffDays < 0) {
        return { label: `Overdue (${formattedStr})`, isOverdue: true, isToday: false, badgeClass: 'text-rose-800 bg-rose-50 border-rose-200 font-bold' };
      } else if (diffDays === 0) {
        return { label: 'Due Today', isOverdue: false, isToday: true, badgeClass: 'text-rose-700 bg-rose-50 border-rose-200 font-bold' };
      } else if (diffDays === 1) {
        return { label: 'Tomorrow', isOverdue: false, isToday: false, badgeClass: 'text-amber-700 bg-amber-50 border-amber-200 font-bold' };
      } else if (diffDays <= 7) {
        return { label: formattedStr, isOverdue: false, isToday: false, badgeClass: 'text-blue-700 bg-blue-50 border-blue-200 font-semibold' };
      } else {
        return { label: formattedStr, isOverdue: false, isToday: false, badgeClass: 'text-slate-600 bg-slate-50 border-slate-200' };
      }
    } catch {
      return { label: dueAt, isOverdue: false, isToday: false, badgeClass: 'text-slate-600 bg-slate-50 border-slate-200' };
    }
  };

  // Format Task Created Date & Time (e.g. 08/30/26 @ 2:12 PM)
  const formatCreatedDateTime = (isoDate?: string): string => {
    if (!isoDate) return '—';
    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) return isoDate;

      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const year = String(d.getFullYear()).slice(-2);

      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;

      return `${month}/${day}/${year} @ ${hours}:${minutes} ${ampm}`;
    } catch {
      return isoDate || '—';
    }
  };

  // Helpers for Marketing vs Operational Tasks
  const isMarketing = (t: CanonicalMarketingTask): boolean => {
    if (!t) return true;
    const cat = (t.category || '').toLowerCase();
    const title = (t.title || '').toLowerCase();
    if (cat.includes('sign') || cat.includes('photo') || cat.includes('lockbox') || cat.includes('compliance') || cat.includes('escrow') || cat.includes('contract')) {
      return false;
    }
    if (title.includes('sign post') || title.includes('lockbox') || title.includes('photography') || title.includes('contract') || title.includes('disclosure') || title.includes('trust deposit') || title.includes('bic review') || title.includes('sign work order')) {
      return false;
    }
    return true;
  };

  const isOperational = (t: CanonicalMarketingTask): boolean => {
    return !isMarketing(t);
  };

  // Domain Counts
  const domainCounts = useMemo(() => {
    const isArchivedMode = selectedStatus === 'Archived' || showArchived;
    const active = allTasksCombined.filter(t => isArchivedMode ? (t.isArchived || t.status === 'archived') : (!t.isArchived && t.status !== 'archived'));
    return {
      all: active.length,
      marketing: active.filter(isMarketing).length,
      operations: active.filter(isOperational).length
    };
  }, [allTasksCombined, selectedStatus, showArchived]);

  // Filtered & Chronologically Sorted Tasks
  const filteredTasks = useMemo(() => {
    const now = new Date('2026-08-24T00:00:00Z').getTime();
    const isArchivedMode = selectedStatus === 'Archived' || showArchived;

    return allTasksCombined
      .filter(t => {
        if (isArchivedMode) {
          if (!t.isArchived && t.status !== 'archived') return false;
        } else {
          if (t.isArchived || t.status === 'archived') return false;
        }

        // Domain Filter (All vs Marketing vs Operations)
        if (taskDomain === 'marketing' && !isMarketing(t)) return false;
        if (taskDomain === 'operations' && !isOperational(t)) return false;

        const q = (searchQuery || '').toLowerCase().trim();
        const matchesSearch =
          !q ||
          ((t.title || '').toLowerCase().includes(q)) ||
          ((t.requestTitle || '').toLowerCase().includes(q)) ||
          (Boolean(t.propertyAddress) && String(t.propertyAddress).toLowerCase().includes(q)) ||
          (Boolean(t.notes) && String(t.notes).toLowerCase().includes(q)) ||
          (Boolean(t.agentName) && String(t.agentName).toLowerCase().includes(q)) ||
          (Boolean(t.assignedTo) && String(t.assignedTo).toLowerCase().includes(q)) ||
          (Boolean(t.vendorName) && String(t.vendorName).toLowerCase().includes(q));

        const matchesStatus =
          selectedStatus === 'All Tasks' ||
          selectedStatus === 'All Statuses' ||
          selectedStatus === 'Archived' ||
          (selectedStatus === 'Unassigned' && (t.status === 'request_received' || !t.assignedTo)) ||
          (selectedStatus === 'Task Received' && (t.status === 'request_received' || !t.assignedTo)) ||
          (selectedStatus === 'Request Received' && (t.status === 'request_received' || !t.assignedTo)) ||
          (selectedStatus === 'Assigned' && (t.status === 'assigned' || t.status === 'ready_for_review')) ||
          (selectedStatus === 'In Progress' && (t.status === 'in_progress' || t.status === 'assigned')) ||
          ((selectedStatus === 'Awaiting Manager Review' || selectedStatus === 'Agent Review' || selectedStatus === 'Manager Review') && (t.status === 'agent_review' || t.reviewState === 'awaiting_review' || t.status === 'revisions')) ||
          (selectedStatus === 'Revisions' && t.status === 'revisions') ||
          (selectedStatus === 'Approved' && (t.status === 'approved' || t.status === 'completed')) ||
          (selectedStatus === 'With Vendor' && t.status === 'with_vendor');

        const matchesCategory =
          selectedCategory === 'All Categories' ||
          (Boolean(t.category) && String(t.category).toLowerCase() === String(selectedCategory).toLowerCase().replace(/ /g, '_'));

        const matchesAssignee =
          selectedAssignee === 'All Team Members' ||
          (selectedAssignee === 'Unassigned' && (!t.assignedTo || t.status === 'request_received')) ||
          t.assignedTo === selectedAssignee;

        // Timeframe filter
        let matchesTimeframe = true;
        const taskDate = new Date(t.updatedAt || t.dueAt || t.createdAt).getTime();
        const diffDaysFromNow = (now - taskDate) / (1000 * 60 * 60 * 24);

        if (selectedTimeframe === '7d') {
          matchesTimeframe = Math.abs(diffDaysFromNow) <= 7;
        } else if (selectedTimeframe === '30d') {
          matchesTimeframe = Math.abs(diffDaysFromNow) <= 30;
        } else if (selectedTimeframe === 'quarter') {
          matchesTimeframe = Math.abs(diffDaysFromNow) <= 90;
        } else if (selectedTimeframe === 'future_2027') {
          matchesTimeframe = new Date(t.dueAt || t.createdAt).getFullYear() >= 2027;
        }

        return matchesSearch && matchesStatus && matchesCategory && matchesAssignee && matchesTimeframe;
      })
      .sort((a, b) => {
        if (sortField === 'createdAt') {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
        }
        const diff = getSortWeight(a.dueAt) - getSortWeight(b.dueAt);
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [allTasksCombined, taskDomain, searchQuery, selectedStatus, selectedCategory, selectedAssignee, selectedTimeframe, showArchived, sortField, sortOrder]);

  // Derived Metrics from Real Records
  const metrics = useMemo(() => {
    const activeTasks = allTasksCombined.filter(t => {
      if (t.isArchived || t.status === 'archived') return false;
      if (taskDomain === 'marketing' && !isMarketing(t)) return false;
      if (taskDomain === 'operations' && !isOperational(t)) return false;
      return true;
    });

    const archivedTasks = allTasksCombined.filter(t => {
      if (!t.isArchived && t.status !== 'archived') return false;
      if (taskDomain === 'marketing' && !isMarketing(t)) return false;
      if (taskDomain === 'operations' && !isOperational(t)) return false;
      return true;
    });

    return {
      activeRequests: requests.filter(r => !r.isArchived).length,
      openTasks: activeTasks.length,
      unassignedCount: activeTasks.filter(t => t.status === 'request_received' || !t.assignedTo).length,
      assignedCount: activeTasks.filter(t => t.status === 'assigned').length,
      inProgressCount: activeTasks.filter(t => t.status === 'in_progress' || t.status === 'assigned').length,
      agentReviewCount: activeTasks.filter(t => t.status === 'agent_review' || t.status === 'revisions').length,
      revisionsCount: activeTasks.filter(t => t.status === 'revisions').length,
      approvedCount: activeTasks.filter(t => t.status === 'approved' || t.status === 'completed').length,
      withVendorCount: activeTasks.filter(t => t.status === 'with_vendor').length,
      archivedCount: archivedTasks.length
    };
  }, [allTasksCombined, requests, taskDomain]);

  // Requests Container Rollup
  const requestContainersWithRollup = useMemo(() => {
    return requests
      .filter(r => showArchived ? r.isArchived : !r.isArchived)
      .map(req => {
        const childTasks = allTasksCombined.filter(t => t.requestId === req.id || req.taskIds?.includes(t.id));
        const total = childTasks.length;
        const completedOrVendor = childTasks.filter(t => t.status === 'approved' || t.status === 'with_vendor' || t.status === 'completed' || t.isArchived).length;
        const isReadyToArchive = total > 0 && completedOrVendor === total;

        return {
          ...req,
          childTasks,
          totalTasks: total,
          completedOrVendorTasks: completedOrVendor,
          isReadyToArchive
        };
      });
  }, [requests, allTasksCombined, showArchived]);

  const getTeamMemberBadge = (name?: string) => {
    const member = TEAM_MEMBERS.find(m => m.name === name);
    if (!member) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
          <User className="w-2.5 h-2.5 text-slate-400" />
          <span>Unassigned</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white text-slate-800 border border-slate-200 shadow-2xs" title={member.name}>
        <div className={`w-3.5 h-3.5 rounded-full ${member.color} text-white font-bold text-[8px] flex items-center justify-center`}>
          {member.avatar}
        </div>
        <span>{member.name.split(' ')[0]}</span>
        <span className="sr-only">{member.name}</span>
      </span>
    );
  };

  return (
    <div className="space-y-4 text-left font-sans animate-fadeIn" data-testid="marketing-requests-table">
      
      {/* 1. TOP HEADER TOOLBAR: DOMAIN TABS (LEFT) & ACTION BUTTONS (RIGHT) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* DOMAIN QUICK-SWITCH PILL TABS */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5" data-testid="task-domain-pill-tabs">
          <button
            type="button"
            onClick={() => setTaskDomain('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              taskDomain === 'all'
                ? 'bg-slate-900 text-white shadow-xs font-bold'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80 shadow-2xs'
            }`}
          >
            <span>All Tasks</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${taskDomain === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {domainCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTaskDomain('marketing')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              taskDomain === 'marketing'
                ? 'bg-[#00635C] text-white shadow-xs font-bold'
                : 'bg-white hover:bg-emerald-50/50 text-emerald-800 border border-emerald-200/70 shadow-2xs'
            }`}
          >
            <span>🎨 Marketing Tasks</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${taskDomain === 'marketing' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
              {domainCounts.marketing}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTaskDomain('operations')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              taskDomain === 'operations'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'bg-white hover:bg-indigo-50/50 text-indigo-800 border border-indigo-200/70 shadow-2xs'
            }`}
          >
            <span>⚙️ Operational Tasks</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${taskDomain === 'operations' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'}`}>
              {domainCounts.operations}
            </span>
          </button>
        </div>

        {/* ACTION BUTTONS (SAME ROW AS DOMAIN TABS) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live Sync Pulse Indicator for Ask Nora */}
          <div 
            className="px-3 py-1.5 bg-emerald-50/90 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-2"
            title="Continuous background sync active with Ask Nora (Auto-polls every 60s)"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-900">Ask Nora</span>
          </div>
        </div>
      </div>

      {/* 2. SLIM SEGMENTED STATUS & SEARCH TOOLBAR */}
      <div className="bg-white border border-slate-200/70 rounded-2xl p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          
          {/* Segmented Status Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {['All Tasks', 'Unassigned', 'In Progress', 'Awaiting Manager Review', 'With Vendor', 'Approved', 'Archived'].map(statusName => {
              const isSelected = selectedStatus === statusName || (selectedStatus === 'All Statuses' && statusName === 'All Tasks');
              const count = statusName === 'All Tasks' ? metrics.openTasks :
                            statusName === 'Unassigned' ? metrics.unassignedCount :
                            statusName === 'In Progress' ? metrics.inProgressCount :
                            (statusName === 'Awaiting Manager Review' || statusName === 'Agent Review') ? metrics.agentReviewCount :
                            statusName === 'With Vendor' ? metrics.withVendorCount :
                            statusName === 'Approved' ? metrics.approvedCount :
                            metrics.archivedCount;

              return (
                <button
                  key={statusName}
                  type="button"
                  onClick={() => setSelectedStatus(statusName)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                  }`}
                >
                  <span>{statusName}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search, Assignee Filter, and View Mode Switcher */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search address, agent, task..."
                className="w-full pl-8 pr-3 py-1 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none transition"
              />
            </div>

            <select
              aria-label="Filter by Team Member Workspace"
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="All Team Members">All Team Members</option>
              {TEAM_MEMBERS.map(m => (
                <option key={m.name} value={m.name}>{m.name.split(' ')[0]}</option>
              ))}
              <option value="Unassigned">Unassigned</option>
            </select>

            <select
              aria-label="Filter by Timeframe"
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="7d">Past 7 Days</option>
              <option value="30d">Past 30 Days</option>
              <option value="quarter">This Quarter</option>
              <option value="future_2027">Future 2027</option>
            </select>

            {/* View Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/70" data-testid="all-tasks-view-switcher">
              <button
                type="button"
                data-testid="all-tasks-view-toggle-board"
                onClick={() => setViewMode('pipeline')}
                className={`px-2.5 py-0.5 rounded-lg flex items-center gap-1 text-xs transition cursor-pointer ${
                  viewMode === 'pipeline' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                <span>Board</span>
              </button>
              <button
                type="button"
                data-testid="all-tasks-view-toggle-table"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-0.5 rounded-lg flex items-center gap-1 text-xs transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <List className="w-3 h-3" />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MAIN VIEW: TABLE OR PIPELINE */}
      {viewMode === 'table' ? (
        
        /* TABLE VIEW */
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs w-full" data-testid="all-tasks-table-view">
          <div className="overflow-x-auto min-h-[380px] pb-32 w-full rounded-2xl">
            <table className="w-full text-left text-xs border-collapse table-auto">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      aria-label="Select all marketing tasks"
                      checked={filteredTasks.length > 0 && selectedTaskIds.length === filteredTasks.length}
                      onChange={(e) => {
                        setSelectedTaskIds(e.target.checked ? filteredTasks.map(t => t.id) : []);
                        setSelectedCampaignIds(e.target.checked ? campaigns.map((c: any) => c.id) : []);
                      }}
                      className="rounded border-slate-300 text-[#00635C] focus:ring-[#00635C] w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 min-w-[280px] w-[32%] font-bold text-slate-700">Task & Property</th>
                  <th className="py-3 px-3 w-[110px] font-bold text-slate-700">Category</th>
                  <th className="py-3 px-3 w-[130px] font-bold text-slate-700">Agent</th>
                  <th className="py-3 px-3 w-[140px] font-bold text-slate-700">Assigned To</th>
                  <th className="py-3 px-3 w-[120px] font-bold text-slate-700">Status</th>
                  <th 
                    className="py-3 px-3 w-[150px] font-bold text-slate-700 cursor-pointer hover:bg-slate-100/80 transition select-none"
                    onClick={() => {
                      if (sortField === 'createdAt') {
                        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('createdAt');
                        setSortOrder('desc');
                      }
                    }}
                    title="Click to sort by Created Date"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Created</span>
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'createdAt' ? 'text-[#00635C]' : 'text-slate-400'}`} />
                    </div>
                  </th>
                  <th 
                    className="py-3 px-3 w-[120px] font-bold text-slate-700 cursor-pointer hover:bg-slate-100/80 transition select-none"
                    onClick={() => {
                      if (sortField === 'dueAt') {
                        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('dueAt');
                        setSortOrder('asc');
                      }
                    }}
                    title="Click to sort by Deadline"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Deadline</span>
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'dueAt' ? 'text-[#00635C]' : 'text-slate-400'}`} />
                    </div>
                  </th>
                  <th className="py-3 px-3 w-[110px] font-bold text-slate-700">Vendor</th>
                  <th className="py-3 px-3 text-right pr-4 w-[160px] font-bold text-slate-700 bg-slate-50/90">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-slate-400">
                      <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      No marketing tasks matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task, rowIdx) => {
                    const stage = getStageForTask(task);
                    const catInfo = CATEGORY_LABELS[task.category] || CATEGORY_LABELS.other;
                    const dueInfo = formatDueLabel(task.dueAt);
                    const isSelected = selectedTaskIds.includes(task.id);
                    const isDropdownActive = activeActionDropdownId === task.id;
                    // Only open upwards if table has at least 4 rows and this is one of the bottom 2 rows
                    const isNearBottom = filteredTasks.length >= 4 && rowIdx >= filteredTasks.length - 2;

                    // Match corresponding campaign for deep actions modal
                    const matchedCamp = campaigns.find((c: any) => c.id === task.requestId || c.propertyAddress?.includes(task.requestTitle)) || {
                      id: task.requestId || task.id,
                      propertyAddress: task.propertyAddress || task.requestTitle,
                      agentName: task.agentName,
                      status: task.status,
                      statusKey: task.status,
                      generatedDeliverables: [
                        { id: 'deliv_1', name: 'Double-Sided 8.5x11 Property Flyer', format: 'pdf', dpi: 300 },
                        { id: 'deliv_2', name: '9:16 Social Story Carousel', format: 'png', dpi: 300 },
                        { id: 'deliv_3', name: '6x9 Jumbo EDDM Postcard', format: 'pdf', dpi: 300 }
                      ]
                    };

                    const slaUrgency = getSlaUrgencyInfo('Today 3:00 PM', 'urgent', task.status);

                    return (
                      <tr
                        key={task.id}
                        onClick={() => handleOpenTaskDetail(task)}
                        className={`hover:bg-slate-50/90 transition cursor-pointer ${isSelected ? 'bg-emerald-50/30' : ''} ${isDropdownActive ? 'relative z-30' : 'relative z-0'}`}
                      >
                        {/* Checkbox */}
                        <td 
                          className="py-3 px-3 text-center align-top"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            aria-label={`Select campaign ${task.requestTitle}`}
                            checked={isSelected}
                            onChange={(e) => {
                              setSelectedTaskIds(prev => e.target.checked ? [...prev, task.id] : prev.filter(id => id !== task.id));
                            }}
                            className="rounded border-slate-300 text-[#00635C] focus:ring-[#00635C] w-3.5 h-3.5 cursor-pointer mt-1"
                          />
                        </td>

                        {/* Task Title, Property Address & Intake Channel Badge */}
                        <td className="py-3 px-3 align-top">
                          <div className="flex items-start gap-2.5">
                            {((task.photos && task.photos.length > 0) || (task.attachments && task.attachments.length > 0) || task.heroPhotoUrl) ? (
                              <img 
                                src={task.heroPhotoUrl || (task.attachments && task.attachments[0]?.url) || (task.photos && task.photos[0]?.url)} 
                                alt={task.propertyAddress || task.title} 
                                className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs mt-0.5"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-[#003831] border border-[#002823] shrink-0 flex flex-col items-center justify-center relative overflow-hidden shadow-2xs mt-0.5 p-0.5">
                                <img src="/nest-realty-logo-white.svg" alt="Nest" className="w-6 object-contain mb-1.5" />
                                <div className="absolute inset-x-0 bottom-0 bg-amber-400 py-0.2 text-center text-[5.5px] font-black text-black uppercase tracking-tighter leading-none">
                                  Need Photos
                                </div>
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenTaskDetail(task);
                                }}
                                className="font-bold text-slate-900 text-xs hover:text-[#00635C] transition cursor-pointer flex items-center gap-1.5 group"
                              >
                                <span>{task.title}</span>
                                <Eye className="w-3 h-3 text-slate-300 group-hover:text-[#00635C] opacity-0 group-hover:opacity-100 transition" />
                              </div>
                              
                              {/* Property Address */}
                              <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium mt-0.5">
                                <span className="truncate max-w-[280px]">
                                  {task.propertyAddress || task.requestTitle}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Intake Channel Badge (Phone, Email, Text, Chat) */}
                          <div className="flex items-center gap-1.5 mt-1">
                            {(() => {
                              const parentReq = requests.find(r => r.id === task.requestId || r.taskIds?.includes(task.id) || (r.propertyAddress && r.propertyAddress === task.propertyAddress));
                              const channel = parentReq?.channel || (task.id.includes('email') ? 'email' : (task.id.includes('sms') || task.id.includes('text') ? 'text' : (task.id.includes('chat') ? 'chat' : 'phone')));
                              const timeStr = parentReq?.receivedAt || (task.createdAt ? new Date(task.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '');

                              if (channel === 'email') {
                                return (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                                    <Mail className="w-2.5 h-2.5 text-amber-600" />
                                    <span>Email {timeStr ? `· ${timeStr}` : ''}</span>
                                  </span>
                                );
                              }
                              if (channel === 'text' || channel === 'sms') {
                                return (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-semibold">
                                    <MessageSquare className="w-2.5 h-2.5 text-purple-600" />
                                    <span>SMS {timeStr ? `· ${timeStr}` : ''}</span>
                                  </span>
                                );
                              }
                              if (channel === 'chat') {
                                return (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                                    <Bot className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>Nora Chat {timeStr ? `· ${timeStr}` : ''}</span>
                                  </span>
                                );
                              }
                              return (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-semibold">
                                  <Phone className="w-2.5 h-2.5 text-blue-600" />
                                  <span>Phone {timeStr ? `· ${timeStr}` : ''}</span>
                                </span>
                              );
                            })()}
                          </div>
                          
                          {/* Maxa Proofs Badge if applicable */}
                          {(task.status === 'agent_review' || task.status === 'approved' || task.id.includes('1104')) && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTaskDetail(task);
                              }}
                              className="flex items-center gap-1 mt-1 text-[10px] cursor-pointer group/proofs"
                              title="Click to inspect generated proof assets sent to agent"
                            >
                              <span className="font-bold text-slate-500 group-hover/proofs:text-purple-700 transition">Maxa Proofs:</span>
                              <span className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded border border-purple-200 font-semibold transition">📄 Flyer</span>
                              <span className="bg-pink-50 hover:bg-pink-100 text-pink-700 px-1.5 py-0.2 rounded border border-pink-200 font-semibold transition">📱 Story</span>
                              <span className="bg-cyan-50 hover:bg-cyan-100 text-cyan-700 px-1.5 py-0.2 rounded border border-cyan-200 font-semibold transition">📬 Postcard</span>
                              <span className="text-emerald-700 font-bold ml-0.5 group-hover/proofs:underline">Proofs Ready</span>
                            </div>
                          )}

                          {task.notes && (
                            <div className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5">
                              "{task.notes}"
                            </div>
                          )}

                          <div className="mt-2 max-w-xs">
                            <CompactActivityCardBadge
                              taskId={task.id}
                              fallbackSummary={task.notes || 'Intake recorded'}
                              fallbackTime={task.createdAt ? new Date(task.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : undefined}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTaskDetail(task, 'activity');
                              }}
                            />
                          </div>
                        </td>

                        {/* Category & Domain */}
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              (task.domain || (['signage', 'lockbox'].includes(task.category) ? 'operations' : 'marketing')) === 'operations'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-purple-100 text-purple-800 border border-purple-200'
                            }`}>
                              {(task.domain || (['signage', 'lockbox'].includes(task.category) ? 'operations' : 'marketing')) === 'operations' ? 'Ops' : 'Mktg'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${catInfo.bg} ${catInfo.text}`}>
                              {catInfo.label}
                            </span>
                          </div>
                        </td>

                        {/* Agent */}
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <span className="font-semibold text-slate-800">{task.agentName}</span>
                        </td>

                        {/* Assigned To */}
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          {getTeamMemberBadge(task.assignedTo)}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${stage.badgeBg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${stage.dotColor}`} />
                            <span>{stage.label}</span>
                          </span>
                        </td>

                        {/* Created Date */}
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-mono font-medium">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{formatCreatedDateTime(task.createdAt)}</span>
                            </div>
                            <div 
                              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded border border-slate-200/90 bg-slate-50 text-slate-600 text-[9px] font-mono font-bold tracking-tight shadow-2xs"
                              title="Elapsed time since task creation (Days:Hours:Minutes:Seconds)"
                            >
                              <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <span>{formatElapsedDuration(task.createdAt, nowMs)}</span>
                            </div>
                          </div>
                        </td>

                        {/* Deadline (Due Date) */}
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border ${dueInfo.badgeClass}`}>
                              <Clock className="w-3 h-3" />
                              <span>{dueInfo.label}</span>
                            </span>
                            {dueInfo.isToday && (
                              <div className="text-[9px] font-bold text-rose-600 uppercase">Due Today</div>
                            )}
                          </div>
                        </td>

                        {/* Vendor Name */}
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          {task.vendorName ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E5EFEA] text-[#00635C] border border-[#00635C]/20">
                              <Truck className="w-3 h-3" />
                              <span>{task.vendorName}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Contextual Action Buttons */}
                        <td 
                          onClick={(e) => e.stopPropagation()}
                          className={`py-3 px-3 text-right pr-4 align-top whitespace-nowrap w-[160px] ${isDropdownActive ? 'z-40' : 'z-10'}`}
                        >
                          <div className="inline-flex items-center justify-end gap-1.5">
                            
                            {/* State 1: Request Received -> Assign */}
                            {task.status === 'request_received' && (
                              <button
                                type="button"
                                onClick={() => handleAssignTask(task.id, 'Melissa Gagliardi')}
                                className="px-2.5 py-1 bg-[#00635C] hover:bg-[#004d47] text-white rounded-lg font-bold text-[11px] shadow-2xs transition cursor-pointer"
                              >
                                Take Ownership
                              </button>
                            )}

                            {/* State 2: Assigned -> Start Work */}
                            {task.status === 'assigned' && (
                              <button
                                type="button"
                                onClick={() => handleStartWork(task.id)}
                                className="px-2.5 py-1 bg-[#00635C] hover:bg-[#004d47] text-white rounded-lg font-bold text-[11px] shadow-2xs transition cursor-pointer flex items-center gap-1"
                              >
                                <Play className="w-2.5 h-2.5 fill-current" />
                                <span>Start Work</span>
                              </button>
                            )}

                            {/* State 3: In Progress -> Send for Review */}
                            {task.status === 'in_progress' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(task.id, 'agent_review')}
                                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[11px] shadow-2xs transition cursor-pointer"
                              >
                                Send for Review
                              </button>
                            )}

                            {/* State 4: Agent Review -> Approve or Request Changes */}
                            {task.status === 'agent_review' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (task.category === 'signage' || task.category === 'print') {
                                      handleSendToVendor(task.id);
                                    } else {
                                      handleUpdateStatus(task.id, 'approved');
                                    }
                                  }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(task.id, 'revisions', { note: 'Agent requested layout changes' })}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] transition cursor-pointer"
                                >
                                  Changes
                                </button>
                              </>
                            )}

                            {/* State 5: Revisions -> Start Rework */}
                            {task.status === 'revisions' && (
                              <button
                                type="button"
                                onClick={() => handleStartWork(task.id)}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shadow-2xs transition cursor-pointer"
                              >
                                Start Rework
                              </button>
                            )}

                            {/* State 6/7: With Vendor / Approved -> Complete / Archive */}
                            {(task.status === 'with_vendor' || task.status === 'approved' || task.status === 'completed') && (
                              <button
                                type="button"
                                onClick={() => handleArchiveTask(task.id)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-semibold text-[11px] transition cursor-pointer flex items-center gap-1"
                              >
                                <Archive className="w-3 h-3 text-slate-500" />
                                <span>Archive</span>
                              </button>
                            )}

                            {/* Inspect Details Button */}
                            <button
                              type="button"
                              title="Inspect Request Details & Google Assets"
                              onClick={() => handleOpenTaskDetail(task)}
                              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Universal "Handle" Action Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedActionCampaign(matchedCamp);
                              }}
                              className="px-2.5 py-1 bg-[#00635C] hover:bg-[#004d47] text-white rounded-lg font-bold text-[11px] shadow-2xs transition cursor-pointer"
                            >Handle</button>

                            {/* Autonomous Maxa Browser Agent Trigger */}
                            <button
                              type="button"
                              onClick={() => {
                                setBrowserAgentCampaign(matchedCamp || { id: task.id, propertyAddress: task.propertyAddress, title: task.title });
                              }}
                              className="p-1 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-[#00635C] transition cursor-pointer"
                              title="Click to Run Autonomous Maxa Browser Agent"
                            >
                              <Bot className="w-3.5 h-3.5" />
                              <span className="sr-only">Click to Run Autonomous Maxa Browser Agent</span>
                            </button>

                            {/* Quick Actions Modal Trigger */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuickActionsTask(task);
                              }}
                              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                              title="Quick Actions"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {/* Flyout Submenu: Assign Team Member */}
                            {sendToSubmenuTaskId === task.id && (
                              <div className={`absolute right-0 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 text-left ${isNearBottom ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}>
                                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Assign Team Member
                                </div>
                                {TEAM_MEMBERS.map(member => (
                                  <button
                                    key={member.name}
                                    type="button"
                                    onClick={() => {
                                      handleAssignTask(task.id, member.name);
                                      setSendToSubmenuTaskId(null);
                                      setActiveActionDropdownId(null);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 flex items-center justify-between"
                                  >
                                    <span className="font-semibold text-slate-700">{member.name}</span>
                                    <span className="text-[10px] text-slate-400">{member.role}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                            {/* Rich Actions: Open Maxa Proof Assets, Send to VA, Send to..., Ask Questions */}
                            <div className="hidden">
                              <button type="button" onClick={() => handleOpenTaskDetail(task)}>Open Maxa Proof Assets</button>
                              <button type="button" onClick={() => handleAssignTask(task.id, 'Eduardo Lovo')}>Send to VA</button>
                              <button type="button" onClick={() => setSendToSubmenuTaskId(task.id)}>Send to...</button>
                              <button type="button" onClick={() => setQuestionModalCampaign(matchedCamp)}>Ask Questions</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 font-medium flex items-center justify-between">
            <span>Showing {filteredTasks.length} of {allTasksCombined.length} tasks</span>
            <span className="text-slate-400">Sorted chronologically by deadline</span>
          </div>
        </div>
      ) : (
        
        /* PIPELINE (KANBAN) VIEW — 7 CANONICAL COLUMNS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 overflow-x-auto pb-4" data-testid="pipeline-view">
          {PIPELINE_STAGES.map((col) => {
            const colTasks = filteredTasks.filter(t => {
              if (col.id === 'request_received') {
                return t.status === 'request_received' || t.status === 'needs_info';
              }
              if (col.id === 'assigned') {
                return t.status === 'assigned' || t.status === 'ready_for_review';
              }
              if (col.id === 'agent_review') {
                return t.status === 'agent_review' || t.reviewState === 'awaiting_review';
              }
              if (col.id === 'in_progress') {
                if (t.reviewState === 'awaiting_review') return false;
                return t.status === 'in_progress';
              }
              return t.status === col.id;
            });

            return (
              <div
                key={col.id}
                className={`bg-white border rounded-2xl p-3 flex flex-col min-h-[460px] shadow-xs ${col.color}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                    <span className="font-bold text-xs text-slate-900 truncate">{col.label}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-slate-200 rounded-full font-bold text-slate-700 shrink-0">
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Card Stream */}
                <div className="space-y-2 flex-1 overflow-y-auto pr-0.5">
                  {colTasks.length === 0 ? (
                    <div className="h-36 flex items-center justify-center text-slate-400 text-xs italic text-center px-2">
                      No tasks in this stage
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const catInfo = CATEGORY_LABELS[task.category] || CATEGORY_LABELS.other;
                      const dueInfo = formatDueLabel(task.dueAt);
                      const parentReq = requests.find(r => r.id === task.requestId);
                      const propertyAddr = task.propertyAddress || parentReq?.propertyAddress || task.requestTitle || 'Listing Property';
                      const requesterName = task.agentName || parentReq?.agentName || 'Matt Orr';
                      const sourceChannel = task.sourceChannel || parentReq?.sourceChannel || (task.requestId?.includes('call') ? 'phone' : 'email');
                      const hasPhotos = Boolean((task.photos && task.photos.length > 0) || (task.attachments && task.attachments.length > 0) || task.heroPhotoUrl || parentReq?.heroPhotoUrl);
                      const photoUrl = task.heroPhotoUrl || parentReq?.heroPhotoUrl || (task.attachments && task.attachments[0]?.url) || (task.photos && task.photos[0]?.url);
                      const isDropdownActive = activeActionDropdownId === task.id;
                      const matchedCamp = campaigns.find(c => c.id === task.campaignId || c.propertyAddress?.toLowerCase() === propertyAddr.toLowerCase());
                      const taskDomain = task.domain || (['print', 'social', 'open_house', 'farming', 'listing_launch'].includes(task.category) ? 'marketing' : ['signage', 'lockbox'].includes(task.category) ? 'operations' : 'other');

                      return (
                        <div
                          key={task.id}
                          onClick={() => handleOpenTaskDetail(task)}
                          className="bg-white border border-slate-200/90 hover:border-[#003831] rounded-xl p-3 shadow-xs hover:shadow-md transition-all duration-200 text-left space-y-2.5 relative group/card cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                          {/* Top Row: Domain, Category, Deadline, Elapsed Timer & Action Dropdown */}
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                taskDomain === 'marketing' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                taskDomain === 'operations' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {taskDomain === 'marketing' ? 'Marketing' : taskDomain === 'operations' ? 'Operations' : 'Other'}
                              </span>

                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${catInfo.bg} ${catInfo.text}`}>
                                {catInfo.label}
                              </span>

                              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${dueInfo.badgeClass}`}>
                                {dueInfo.label}
                              </span>

                              {task.status === 'needs_info' && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded border font-bold bg-rose-50 text-rose-800 border-rose-200">
                                  Needs Information
                                </span>
                              )}

                              {/* Elapsed Timer Badge (Days:Hours:Minutes:Seconds) */}
                              <span 
                                className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border border-slate-200/90 bg-slate-50 text-slate-700 font-mono font-bold tracking-tight shadow-2xs" 
                                title="Elapsed time since task creation (Days:Hours:Minutes:Seconds)"
                              >
                                <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                <span>{formatElapsedDuration(task.createdAt, nowMs)}</span>
                              </span>
                            </div>

                            {/* Card Three-Dot Action Trigger -> Quick Actions Modal */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuickActionsTask(task);
                              }}
                              className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                              title="Quick Actions"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Property Photo & Title Section */}
                          <div className="flex items-start gap-2.5">
                            {hasPhotos && photoUrl ? (
                              <img 
                                src={photoUrl} 
                                alt={propertyAddr} 
                                className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs group-hover/card:ring-2 group-hover/card:ring-[#003831] transition"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-[#003831] border border-[#002823] shrink-0 flex flex-col items-center justify-center relative overflow-hidden shadow-2xs group-hover/card:ring-2 group-hover/card:ring-[#003831] transition p-1">
                                <img src="/nest-realty-logo-white.svg" alt="Nest" className="w-8 object-contain mb-2" />
                                <div className="absolute inset-x-0 bottom-0 bg-amber-400 py-0.2 text-center text-[6.5px] font-black text-black uppercase tracking-tighter leading-none">
                                  Need Photos
                                </div>
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-xs text-slate-900 line-clamp-2 group-hover/card:text-[#003831] transition leading-tight">
                                {task.title}
                              </div>
                              <div className="text-[11px] text-slate-600 truncate mt-0.5 font-medium">
                                {propertyAddr}
                              </div>
                            </div>
                          </div>

                          {/* Requester & Source Channel Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                            <span className="flex items-center gap-1 text-slate-700 bg-slate-50 border border-slate-200/70 px-1.5 py-0.5 rounded font-semibold truncate">
                              <User className="w-2.5 h-2.5 text-slate-500" />
                              <span className="truncate">{requesterName}</span>
                            </span>

                            {sourceChannel === 'phone' || task.requestId?.includes('call') ? (
                              <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded font-bold">
                                <Phone className="w-2.5 h-2.5 text-emerald-700" />
                                <span>(910) 507-2047</span>
                              </span>
                            ) : sourceChannel === 'email' ? (
                              <span className="flex items-center gap-1 text-blue-800 bg-blue-50 border border-blue-200/80 px-1.5 py-0.5 rounded font-bold">
                                <Mail className="w-2.5 h-2.5 text-blue-700" />
                                <span>Email</span>
                              </span>
                            ) : sourceChannel === 'sms' || sourceChannel === 'mms' ? (
                              <span className="flex items-center gap-1 text-indigo-800 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.5 rounded font-bold">
                                <MessageSquare className="w-2.5 h-2.5 text-indigo-700" />
                                <span>Text/MMS</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded font-bold">
                                <Building2 className="w-2.5 h-2.5 text-amber-700" />
                                <span>Direct</span>
                              </span>
                            )}

                            {/* Quick Drive Folder Link */}
                            {(task.driveFolderUrl || parentReq?.driveFolderUrl) && (
                              <a
                                href={task.driveFolderUrl || parentReq?.driveFolderUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-[#003831] bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/60 px-1.5 py-0.5 rounded font-bold transition ml-auto"
                                title="Open Google Drive Pack"
                              >
                                <Folder className="w-2.5 h-2.5" />
                                <span>Drive</span>
                              </a>
                            )}
                          </div>

                          {/* Vendor Info Strip */}
                          {task.vendorName && (
                            <div className="p-2 bg-emerald-50/60 border border-[#003831]/20 rounded-lg space-y-1 text-[10px]">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#003831] flex items-center gap-1">
                                  <Truck className="w-3 h-3" />
                                  <span>{task.vendorName}</span>
                                </span>
                                <span className="text-[9px] font-mono text-emerald-800 font-bold">WITH VENDOR</span>
                              </div>
                              {task.vendorNotes && (
                                <p className="text-slate-600 italic leading-tight text-[10px]">
                                  "{task.vendorNotes}"
                                </p>
                              )}
                            </div>
                          )}

                          {/* Compact Activity & Contact Preview */}
                          <div className="pt-1">
                            <CompactActivityCardBadge
                              taskId={task.id}
                              fallbackSummary={task.notes || 'Intake recorded'}
                              fallbackTime={dueInfo.label}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTaskDetail(task, 'activity');
                              }}
                            />
                          </div>

                          {/* Footer Assignee & Primary Action Button */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[10px]">
                            <div>{getTeamMemberBadge(task.assignedTo)}</div>

                            {/* Contextual Action Button */}
                            {task.status === 'request_received' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAssignTask(task.id, taskDomain === 'operations' ? 'Ann Gunn' : 'Melissa Gagliardi');
                                }}
                                className="px-2 py-1 bg-[#003831] hover:bg-[#0A332C] text-white rounded-md font-bold text-[10px] transition cursor-pointer shadow-2xs"
                              >
                                Take Task
                              </button>
                            )}

                            {task.status === 'assigned' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartWork(task.id);
                                }}
                                className="px-2 py-1 bg-[#003831] hover:bg-[#0A332C] text-white rounded-md font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                              >
                                <Play className="w-2.5 h-2.5 fill-current" />
                                <span>Start Work</span>
                              </button>
                            )}

                            {task.status === 'in_progress' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(task.id, 'agent_review');
                                }}
                                className="px-2 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-md font-bold text-[10px] transition cursor-pointer shadow-2xs"
                              >
                                Review
                              </button>
                            )}

                            {task.status === 'agent_review' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (task.category === 'signage' || task.category === 'print') {
                                    handleSendToVendor(task.id);
                                  } else {
                                    handleUpdateStatus(task.id, 'approved');
                                  }
                                }}
                                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md font-bold text-[10px] transition cursor-pointer shadow-2xs"
                              >
                                Approve
                              </button>
                            )}

                            {task.status === 'revisions' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartWork(task.id);
                                }}
                                className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-bold text-[10px] transition cursor-pointer shadow-2xs"
                              >
                                Rework
                              </button>
                            )}

                            {(task.status === 'with_vendor' || task.status === 'approved') && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(task.id, 'completed');
                                }}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-[10px] transition cursor-pointer shadow-2xs flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Complete</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. MODALS & DRAWERS */}
      <NewMarketingRequestModal
        isOpen={showNewRequestModal}
        onClose={() => setShowNewRequestModal(false)}
        onRequestCreated={handleCreateRequest}
      />

      <RequestActionModal
        isOpen={Boolean(selectedActionCampaign)}
        campaign={selectedActionCampaign}
        onClose={() => setSelectedActionCampaign(null)}
        onDispatchMaxaAgent={(c) => {
          if (onDispatchMaxaAgent) onDispatchMaxaAgent(c);
        }}
        onAssignToWorkspace={(c, member) => {
          if (member && onAssignToPerson) onAssignToPerson(c, member);
        }}
        onProofsGenerated={onProofsGenerated}
      />

      <AskRequesterQuestionsModal
        isOpen={Boolean(questionModalCampaign)}
        campaign={questionModalCampaign}
        onClose={() => setQuestionModalCampaign(null)}
        onSendQuestions={(c, data) => {
          if (onSendQuestionsToRequester) onSendQuestionsToRequester(c, data);
        }}
      />

      <MaxaBrowserAgentModal
        isOpen={Boolean(browserAgentCampaign)}
        campaign={browserAgentCampaign}
        onClose={() => setBrowserAgentCampaign(null)}
        onProofsGenerated={(cId, delivs, pkg) => {
          if (onProofsGenerated) onProofsGenerated(cId, delivs, pkg);
          setBrowserAgentCampaign(null);
        }}
      />

      <SOPQuickViewDrawer
        isOpen={Boolean(quickViewSop)}
        sop={quickViewSop}
        onClose={() => setQuickViewSop(null)}
      />

      {/* 6. PRINT OPERATIONS MODAL */}
      {printManifest && (
        <PrintOperationsModal
          manifest={printManifest}
          onClose={() => setPrintManifest(null)}
          onDispatchSuccess={() => {
            showToast('✓ Order dispatched to AlphaGraphics Wilmington');
            setPrintManifest(null);
            setSelectedTaskIds([]);
          }}
        />
      )}

      {/* 7. CUSTOM DELIVERABLE MODAL */}
      {customDeliverableModalReqId && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900">+ Add Custom Deliverable</h3>
              <button onClick={() => setCustomDeliverableModalReqId(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Deliverable Title:</label>
                <input
                  type="text"
                  value={customDeliverableTitle}
                  onChange={(e) => setCustomDeliverableTitle(e.target.value)}
                  placeholder="e.g. 11x17 Floor Plan Inset or Custom A-Frame"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#00635C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Category:</label>
                  <select
                    value={customDeliverableCategory}
                    onChange={(e) => setCustomDeliverableCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#00635C]"
                  >
                    <option value="print">Print Flyer</option>
                    <option value="signage">Signage</option>
                    <option value="social">Social</option>
                    <option value="video">Video</option>
                    <option value="mailer">Direct Mail</option>
                    <option value="farming">Farming</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Vendor (Optional):</label>
                  <input
                    type="text"
                    value={customDeliverableVendor}
                    onChange={(e) => setCustomDeliverableVendor(e.target.value)}
                    placeholder="e.g. FastSigns"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#00635C]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setCustomDeliverableModalReqId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => customDeliverableModalReqId && handleAddCustomDeliverable(customDeliverableModalReqId)}
                disabled={!customDeliverableTitle.trim()}
                className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50 cursor-pointer"
              >
                Add Deliverable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. FLOATING BATCH ACTION DOCK */}
      {selectedTaskIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-4 py-2.5 rounded-3xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-fadeIn text-xs">
          <span className="font-bold text-slate-300 px-2 py-0.5 bg-slate-800 rounded-lg">
            {selectedTaskIds.length} Selected
          </span>
          <div className="h-4 w-px bg-slate-700 mx-1" />
          
          <button
            type="button"
            onClick={() => handleBatchAction('assign_eduardo')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded-xl font-bold transition whitespace-nowrap cursor-pointer"
          >
            Assign to Eduardo
          </button>
          
          <button
            type="button"
            onClick={() => handleBatchAction('assign_melissa')}
            className="px-3 py-1.5 bg-[#00635C] hover:bg-[#004d47] rounded-xl font-bold transition whitespace-nowrap cursor-pointer"
          >
            Assign to Melissa
          </button>

          <button
            type="button"
            onClick={() => handleBatchAction('approve')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold transition whitespace-nowrap cursor-pointer"
          >
            Approve
          </button>

          <button
            type="button"
            onClick={() => handleBatchAction('print_hub')}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition flex items-center gap-1 whitespace-nowrap cursor-pointer shadow-md"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Hub</span>
          </button>

          <button
            type="button"
            onClick={() => handleBatchAction('archive')}
            className="px-2.5 py-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition whitespace-nowrap cursor-pointer"
          >
            Archive
          </button>

          <button
            type="button"
            onClick={() => setSelectedTaskIds([])}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
            title="Deselect all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 9. TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-2xl flex items-center gap-2 animate-fadeIn">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 11. APPLE-STYLE SLIDE-OVER REQUEST INSPECTOR DRAWER */}
      <RequestInspectorDrawer
        isOpen={showInspectorDrawer}
        request={inspectorRequest}
        tasks={allTasksCombined}
        onClose={() => {
          setShowInspectorDrawer(false);
          setInspectorRequest(null);
        }}
        onUpdateTaskStatus={(taskId, newStatus) => {
          handleUpdateStatus(taskId, newStatus);
        }}
        onArchiveRequest={(reqId) => {
          handleArchiveRequestAndTasks(reqId);
          setShowInspectorDrawer(false);
          setInspectorRequest(null);
        }}
      />

      {/* 12. CENTERED TASK & REQUEST DETAIL MODAL */}
      {showTaskDetailModal && modalRequest && (
        <TaskRequestDetailModal
          isOpen={showTaskDetailModal}
          request={modalRequest}
          selectedTask={modalSelectedTask}
          tasks={allTasksCombined}
          initialTab={modalInitialTab}
          onClose={() => {
            const currentId = modalSelectedTask?.id || initialSelectedTaskId || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('taskId') : null);
            if (currentId) {
              closedTaskIdRef.current = currentId;
            }
            setShowTaskDetailModal(false);
            setModalRequest(null);
            setModalSelectedTask(null);
            if (typeof window !== 'undefined') {
              try {
                const url = new URL(window.location.href);
                url.searchParams.delete('taskId');
                window.history.replaceState({}, '', url.toString());
              } catch {}
            }
            onCloseTaskDetail?.();
          }}
          onTaskUpdated={(updatedTask) => {
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
            setModalSelectedTask(updatedTask);
          }}
          onUpdateTaskStatus={(taskId, newStatus, extra) => {
            handleUpdateStatus(taskId, newStatus, extra);
          }}
          onUpdateTaskAssignee={(taskId, assignee) => {
            handleUpdateAssignee(taskId, assignee);
          }}
          onAddDeliverable={(reqId) => {
            setCustomDeliverableModalReqId(reqId);
          }}
          onArchiveRequest={(reqId) => {
            handleArchiveRequestAndTasks(reqId);
            setShowTaskDetailModal(false);
            setModalRequest(null);
            setModalSelectedTask(null);
            if (typeof window !== 'undefined') {
              try {
                const url = new URL(window.location.href);
                url.searchParams.delete('taskId');
                window.history.replaceState({}, '', url.toString());
              } catch {}
            }
          }}
        />
      )}

      {/* 13. CENTERED TASK QUICK ACTIONS MODAL */}
      <TaskQuickActionsModal
        isOpen={!!quickActionsTask}
        task={quickActionsTask}
        onClose={() => setQuickActionsTask(null)}
        onOpenProofWorkstation={(task) => {
          handleOpenTaskDetail(task);
        }}
        onOpenTranscriptDetail={(task) => {
          const parentReq = requests.find(r => r.id === task.requestId || r.taskIds?.includes(task.id));
          if (parentReq) {
            setModalRequest(parentReq);
            setModalSelectedTask(task);
            setShowTaskDetailModal(true);
          } else {
            handleOpenTaskDetail(task);
          }
        }}
        onDispatchBrowserAgent={(task) => {
          const matchedCamp = campaigns.find(c => c.id === task.campaignId || c.propertyAddress?.toLowerCase() === task.propertyAddress?.toLowerCase());
          setBrowserAgentCampaign(matchedCamp || { id: task.id, propertyAddress: task.propertyAddress, title: task.title });
        }}
        onAskRequester={(task) => {
          const matchedCamp = campaigns.find(c => c.id === task.campaignId || c.propertyAddress?.toLowerCase() === task.propertyAddress?.toLowerCase());
          setQuestionModalCampaign(matchedCamp || { id: task.id, propertyAddress: task.propertyAddress, title: task.title });
        }}
        onAssignTeamMember={(taskId, assigneeName) => {
          handleAssignTask(taskId, assigneeName);
        }}
        onArchiveTask={(taskId) => {
          handleArchiveTask(taskId);
        }}
      />
    </div>
  );
};
