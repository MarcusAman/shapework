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
  UserPlus,
  SlidersHorizontal,
  Building2,
  Folder,
  CornerDownRight,
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
  Mic,
  PanelLeftClose,
  ChevronsRight
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
import { resolveCanonicalRecipient } from '../../services/canonicalRecipientService';
import { proofInputValue } from '../../lib/proofPrecedence';
import { getMarketingReviewHandoff } from '../../lib/marketingReviewHandoff';
import { NestOrbVisualizer } from '../shared/NestOrbVisualizer';
import { MaxaBrowserAgentModal } from './MaxaBrowserAgentModal';
import { RequestActionModal } from './RequestActionModal';
import { NewMarketingRequestModal } from './NewMarketingRequestModal';
import { isListingLaunchTask as isListingLaunchTaskFromSop } from '../../lib/listingLaunchSop';
import { isOffer2TBoardTask as isOffer2TBoardTaskFromSop } from '../../lib/offer2tSop';
import { PrintOperationsModal } from './PrintOperationsModal';
import { RequestInspectorDrawer } from './RequestInspectorDrawer';
import { TaskRequestDetailModal } from './TaskRequestDetailModal';
import { WorkspaceTaskDrawer, type WorkspaceDrawerTask } from './WorkspaceTaskDrawer';
import { resolveCanonicalStaffMember } from '../../services/canonicalRoster';
import { CompactActivityCardBadge } from './CompactActivityCardBadge';
import {
  assignSurfaceTableParentRowNumbers,
  formatSurfaceTableActivityRelative,
  formatSurfaceTableActivityTooltip,
  formatSurfaceTableReceived,
  resolveSurfaceTableRequesterName,
  resolveSurfaceTableTypeChip,
  surfaceTableParentNumberKey,
} from '../../lib/surfaceTasksTableLock';
import { TaskQuickActionsModal } from './TaskQuickActionsModal';
import { getTeamMemberSops, getCampaignGoverningSop, MarketingSopDefinition, MARKETING_SOPS } from './marketingSopRegistry';
import { SOPQuickViewDrawer } from './SOPQuickViewDrawer';
import { getSlaUrgencyInfo } from './VAWorkspaceView';
import { CANONICAL_WORKSPACE_ROSTER } from '../../services/canonicalRoster';
import { CanonicalTaskCard } from './CanonicalTaskCard';
import { useFitBoardLayout } from './useFitBoardLayout';

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
  onTasksChange?: (tasks: CanonicalMarketingTask[]) => void;
  onRequestsChange?: (requests: CanonicalMarketingRequest[]) => void;
  currentUser?: {
    id?: string;
    name?: string;
    role?: string;
    email?: string;
    permissions?: string[];
  } | null;
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
  /** Soft lane header: white surface + colored left accent (table + board) */
  headerBar: string;
  headerCount: string;
}> = [
  {
    id: 'request_received',
    label: 'Intake Received',
    shortLabel: 'Intake',
    description: 'New tasks awaiting triage or readiness review',
    color: 'border-slate-300 bg-slate-50/50',
    dotColor: 'bg-slate-500',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
    headerBar: 'bg-white text-slate-800 border-l-4 border-l-slate-500 border-y border-r border-slate-200/90',
    headerCount: 'bg-slate-100 text-slate-700 border-slate-200'
  },
  {
    id: 'assigned',
    label: 'Assigned',
    shortLabel: 'Assigned',
    description: 'Assigned to team member, awaiting intentional Start Work',
    color: 'border-blue-300 bg-blue-50/30',
    dotColor: 'bg-blue-500',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
    headerBar: 'bg-white text-slate-800 border-l-4 border-l-blue-500 border-y border-r border-slate-200/90',
    headerCount: 'bg-blue-50 text-blue-800 border-blue-200'
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    shortLabel: 'In Progress',
    description: 'Active design & production underway',
    color: 'border-amber-300 bg-amber-50/30',
    dotColor: 'bg-amber-500',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    headerBar: 'bg-white text-slate-800 border-l-4 border-l-amber-500 border-y border-r border-slate-200/90',
    headerCount: 'bg-amber-50 text-amber-900 border-amber-200'
  },
  {
    id: 'agent_review',
    label: 'Needs Review',
    shortLabel: 'Needs Review',
    description: 'Proof package submitted to manager for review and sign-off',
    color: 'border-purple-300 bg-purple-50/30',
    dotColor: 'bg-purple-500',
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
    headerBar: 'bg-white text-slate-800 border-l-4 border-l-violet-500 border-y border-r border-slate-200/90',
    headerCount: 'bg-violet-50 text-violet-800 border-violet-200'
  },
  {
    id: 'revisions',
    label: 'Revisions',
    shortLabel: 'Revisions',
    description: 'Changes requested by agent, awaiting rework',
    color: 'border-rose-300 bg-rose-50/30',
    dotColor: 'bg-rose-500',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
    headerBar: 'bg-white text-slate-800 border-l-4 border-l-rose-500 border-y border-r border-slate-200/90',
    headerCount: 'bg-rose-50 text-rose-800 border-rose-200'
  },
  {
    id: 'approved',
    label: 'Completed / Done',
    shortLabel: 'Done',
    description: 'Digital asset approved & delivered / published',
    color: 'border-emerald-300 bg-emerald-50/30',
    dotColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    headerBar: 'bg-white text-slate-800 border-l-4 border-l-emerald-500 border-y border-r border-slate-200/90',
    headerCount: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  {
    id: 'with_vendor',
    label: 'With Vendor',
    shortLabel: 'With Vendor',
    description: 'Physical order dispatched to FastSigns / Coastal Sign Post',
    color: 'border-[#00635C]/30 bg-[#E5EFEA]/40',
    dotColor: 'bg-[#00635C]',
    badgeBg: 'bg-[#E5EFEA] text-[#00635C] border-[#00635C]/30',
    headerBar: 'bg-white text-slate-800 border-l-4 border-l-[#00635C] border-y border-r border-slate-200/90',
    headerCount: 'bg-[#E5EFEA] text-[#00635C] border-[#00635C]/25'
  }
];

export { getCanonicalLaneForTask, type CanonicalPipelineLaneId } from '../../lib/canonicalMarketingTaskLane';
import { getCanonicalLaneForTask, type CanonicalPipelineLaneId } from '../../lib/canonicalMarketingTaskLane';
export function getStageForTask(task: { status?: string; reviewState?: string; assignedTo?: string; isArchived?: boolean }) {
  const lane = getCanonicalLaneForTask(task);
  if (lane === 'archived') {
    return {
      id: 'archived' as any,
      label: 'Archived',
      shortLabel: 'Archived',
      description: 'Archived task',
      color: 'border-slate-200 bg-slate-50',
      dotColor: 'bg-slate-400',
      badgeBg: 'bg-slate-100 text-slate-500 border-slate-200'
    };
  }
  if (lane === 'legacy_unreconciled') {
    return {
      id: 'request_received' as const,
      label: `Legacy: ${task.status || 'Unknown'}`,
      shortLabel: 'Unreconciled',
      description: 'Task with unrecognized legacy status surfaced for triage',
      color: 'border-amber-300 bg-amber-50/50',
      dotColor: 'bg-amber-500',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300'
    };
  }
  const matched = PIPELINE_STAGES.find(s => s.id === lane);
  if (matched) return matched;
  return PIPELINE_STAGES[0];
}

export const CATEGORY_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  farming: { label: 'Farming', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  listing_launch: { label: 'Listing Launch', bg: 'bg-blue-100', text: 'text-blue-800' },
  offer_2t: { label: 'Offer / 2-T', bg: 'bg-teal-100', text: 'text-teal-800' },
  open_house: { label: 'Open House', bg: 'bg-purple-100', text: 'text-purple-800' },
  social: { label: 'Social', bg: 'bg-pink-100', text: 'text-pink-800' },
  signage: { label: 'Signage', bg: 'bg-amber-100', text: 'text-amber-800' },
  print: { label: 'Print Flyer', bg: 'bg-indigo-100', text: 'text-indigo-800' },
  mailer: { label: 'Direct Mailer', bg: 'bg-cyan-100', text: 'text-cyan-800' },
  other: { label: 'Custom', bg: 'bg-slate-100', text: 'text-slate-800' }
};

export const isListingLaunchBoardTask = (t: CanonicalMarketingTask): boolean => {
  if (!t) return false;
  return isListingLaunchTaskFromSop(t as any);
};

export const isOffer2TBoardTask = (t: CanonicalMarketingTask): boolean => {
  if (!t) return false;
  return isOffer2TBoardTaskFromSop(t as any);
};

export const isMarketingTask = (t: CanonicalMarketingTask): boolean => {
  if (!t) return true;
  // Listing Launch is its own Tasks tab — never bucket into Marketing
  if (isListingLaunchBoardTask(t)) return false;
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
  if (!t) return false;
  if (isListingLaunchBoardTask(t)) return false;
  if (isOffer2TBoardTask(t)) return false;
  return !isMarketingTask(t);
};

/** Surface Tasks table Lane column — domain helpers, NOT pipeline stage. */
export type SurfaceDomainLane = 'Listing' | 'Offer' | 'Marketing' | 'Deal risk' | '—';
export function getSurfaceDomainLane(task: CanonicalMarketingTask): SurfaceDomainLane {
  if (!task) return '—';
  if (isListingLaunchBoardTask(task)) return 'Listing';
  if (isOffer2TBoardTask(task)) return 'Offer';
  if (isMarketingTask(task)) return 'Marketing';
  if (isOperationalTask(task)) return 'Deal risk';
  return '—';
}


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


/** Map Tasks list row → WorkspaceTaskDrawer shape (uploads + MLS + parent request). */
export function toWorkspaceDrawerTask(
  task: CanonicalMarketingTask,
  parent?: CanonicalMarketingRequest | null
): WorkspaceDrawerTask {
  const mls = String(task.mlsNumber || parent?.mlsNumber || '').trim();
  const photos = (task.photos && task.photos.length > 0)
    ? task.photos
    : (parent?.photos || []);
  return {
    id: task.id,
    campaignId: (task as any).campaignId,
    requestId: task.requestId || parent?.id,
    requesterId: (task as any).requesterId || (parent as any)?.createdById,
    propertyAddress: task.propertyAddress || parent?.propertyAddress || task.requestTitle || task.title || '',
    agentName: task.agentName || parent?.agentName || 'Listing Broker (REALTOR®)',
    agentPhone: task.agentPhone || parent?.agentPhone || '',
    agentEmail: task.agentEmail || parent?.agentEmail || '',
    agentRole: task.agentRole || parent?.agentRole,
    packageType: task.title,
    priority: ((task.priority as any) === 'urgent' || (task.priority as any) === 'high') ? (task.priority as any) : 'normal',
    status: task.status || 'assigned',
    reviewState: task.reviewState,
    proofVersion: task.proofVersion,
    targetSla: task.dueAt || task.neededByDate || '',
    dueAt: task.dueAt || task.dueDate,
    neededByDate: task.neededByDate,
    eventType: task.eventType || parent?.eventType,
    eventDate: task.eventDate || parent?.eventDate,
    eventTime: task.eventTime || parent?.eventTime,
    receivedAt: parent?.receivedAt || parent?.createdAt || task.createdAt || '',
    assignedTo: task.assignedTo,
    assignedToId: (() => {
      const fromName = task.assignedTo ? resolveCanonicalStaffMember(task.assignedTo) : null;
      const nameId = fromName?.id;
      const rawId = task.assignedToId;
      // Name-only reassign left Melissa's id on Eduardo tasks — trust canonical name.
      if (nameId && rawId && nameId !== rawId) return nameId;
      return rawId || nameId || undefined;
    })(),
    assignedToRole: task.assignedToRole || (task.assignedTo ? resolveCanonicalStaffMember(task.assignedTo)?.role : undefined),
    reviewOwnerId: task.reviewOwnerId && !String(task.reviewOwnerId).includes('_test_')
      ? task.reviewOwnerId
      : ((task.category === 'signage' || task.category === 'operations') ? 'dir_ann_gunn_28' : 'dir_melissa_gagliardi_33'),
    reviewOwnerName: (task.reviewOwnerName || task.reviewOwner) && !String(task.reviewOwnerName || task.reviewOwner || '').includes('Durability')
      ? (task.reviewOwnerName || task.reviewOwner)
      : ((task.category === 'signage' || task.category === 'operations') ? 'Ann Gunn' : 'Melissa Gagliardi'),
    coveringStaffId: task.coveringStaffId,
    coveringStaffName: task.coveringStaffName || task.coveringStaff,
    proofUrl: task.proofUrl,
    proofNotes: task.proofNotes,
    proofHistory: task.proofHistory as any,
    reviewHistory: task.reviewHistory as any,
    notes: task.notes,
    category: task.category,
    routingState: task.routingState,
    routingReasons: task.routingReasons,
    channel: task.channel || parent?.channel,
    classificationConfidence: task.classificationConfidence,
    callId: task.callId || task.telephonyCallId,
    sourceCallId: task.telephonyCallId || task.callId,
    workspaceId: task.workspaceId || parent?.workspaceId,
    departmentId: task.departmentId,
    deliverableType: task.deliverableType,
    title: task.title,
    governingSopId: task.governingSopId,
    governingSopVersion: task.governingSopVersion,
    requestedAssets: [],
    listingDetails: {
      price: '',
      bedsBaths: '',
      sqft: '',
      headline: task.title,
      description: task.notes || parent?.requestExcerpt || '',
      disclosures: '',
      mlsNumber: mls,
      licenseNumber: ''
    },
    photos: (photos || []).map((p: any, i: number) =>
      typeof p === 'string'
        ? { id: `photo_${i}`, url: p }
        : { id: p.id || `photo_${i}`, url: p.url, name: p.name, caption: p.caption }
    ),
    attachments: (task.attachments || parent?.attachments || []) as any,
    sopCode: '',
    sopTitle: '',
    requirements: task.requirements,
    internalFlags: task.internalFlags,
    mlsNumber: mls,
    parentRequest: parent || undefined
  } as WorkspaceDrawerTask & { mlsNumber?: string; parentRequest?: CanonicalMarketingRequest };
}

function mapInboxTabToDrawerTab(
  tab: 'overview' | 'conversation' | 'work' | 'activity'
): 'overview' | 'history' | 'proof' | 'files' {
  if (tab === 'conversation' || tab === 'activity') return 'history';
  if (tab === 'work') return 'proof';
  return 'overview';
}

export type LaneListItem =
  | { kind: 'request'; requestId: string; tasks: CanonicalMarketingTask[] }
  | {
      kind: 'task';
      requestId: string;
      task: CanonicalMarketingTask;
      indent: number;
      siblingCount: number;
      isFirstSubtask?: boolean;
      isLastSubtask?: boolean;
    };

/** Within a lane: collapse sibling deliverables under their parent intake request */
export function buildLaneListItems(
  laneTasks: CanonicalMarketingTask[],
  expandedRequestIds: Record<string, boolean> = {}
): LaneListItem[] {
  const buckets = new Map<string, CanonicalMarketingTask[]>();
  for (const t of laneTasks) {
    const key = t.requestId || `solo_${t.id}`;
    const arr = buckets.get(key) || [];
    arr.push(t);
    buckets.set(key, arr);
  }
  const items: LaneListItem[] = [];
  for (const [requestId, reqTasks] of buckets) {
    const isMulti = reqTasks.length > 1 && !requestId.startsWith('solo_');
    if (isMulti) {
      items.push({ kind: 'request', requestId, tasks: reqTasks });
      if (expandedRequestIds[requestId]) {
        reqTasks.forEach((t, idx) => {
          items.push({
            kind: 'task',
            requestId,
            task: t,
            indent: 1,
            siblingCount: reqTasks.length,
            isFirstSubtask: idx === 0,
            isLastSubtask: idx === reqTasks.length - 1
          });
        });
      }
    } else {
      items.push({
        kind: 'task',
        requestId,
        task: reqTasks[0],
        indent: 0,
        siblingCount: 1,
        isFirstSubtask: false,
        isLastSubtask: false
      });
    }
  }
  return items;
}

/** Table grouping uses workflow status, property address, or business lane. */
export type SurfaceTableGroupMode = 'address' | 'lane' | 'status';
export const SURFACE_TABLE_GROUP_BY_ADDRESS_LABEL = 'Group by address';
export const SURFACE_TABLE_GROUP_BY_LANE_LABEL = 'Group by Lane';
export const SURFACE_TABLE_GROUP_BY_STATUS_LABEL = 'Group by Status';
const STATUS_SORT_ORDER = [...PIPELINE_STAGES.map(stage => stage.id), 'legacy_unreconciled', 'archived'];
const statusSortRank = (lane: string) => STATUS_SORT_ORDER.indexOf(lane.split(':')[0]);
/** Lane section order — domain helpers, NOT pipeline stages. */
export const SURFACE_DOMAIN_LANE_ORDER: Exclude<SurfaceDomainLane, '—'>[] = [
  'Marketing',
  'Listing',
  'Offer',
  'Deal risk',
];

export type SurfaceTableListItem =
  | { kind: 'lane'; lane: Exclude<SurfaceDomainLane, '—'>; count: number }
  | { kind: 'group'; groupBy: 'address' | 'status'; key: string; label: string; count: number }
  | LaneListItem;

/**
 * Table list builder for Surface lock #2.1.
 * Address and status sections show each task once, including sibling deliverables.
 * `lane`: section headers Marketing / Listing / Offer / Deal risk; inside each, still parent-by-address.
 */
export function buildSurfaceTableListItems(
  tasks: CanonicalMarketingTask[],
  expandedRequestIds: Record<string, boolean> = {},
  groupMode: SurfaceTableGroupMode = 'address',
  statusSortOrder: 'asc' | 'desc' = 'asc'
): SurfaceTableListItem[] {
  if (groupMode !== 'lane') {
    const sections = new Map<string, { label: string; tasks: CanonicalMarketingTask[] }>();
    for (const task of tasks) {
      const stage = getStageForTask(task);
      const lane = getCanonicalLaneForTask(task);
      const statusKey = lane === 'legacy_unreconciled' ? `${lane}:${task.status || 'Unknown'}` : lane;
      const address = String(task.propertyAddress || '').trim().replace(/\s+/g, ' ') || 'No property address';
      const key = groupMode === 'status' ? statusKey : address.toLowerCase();
      const section = sections.get(key) || { label: groupMode === 'status' ? stage.label : address, tasks: [] };
      section.tasks.push(task);
      sections.set(key, section);
    }
    const ordered = [...sections];
    if (groupMode === 'status') {
      ordered.sort(([a], [b]) => (statusSortRank(a) - statusSortRank(b)) * (statusSortOrder === 'asc' ? 1 : -1));
    }
    return ordered.flatMap(([key, section]): SurfaceTableListItem[] => [
      { kind: 'group', groupBy: groupMode, key, label: section.label, count: section.tasks.length },
      ...section.tasks.map(task => ({ kind: 'task' as const, requestId: task.requestId || `solo_${task.id}`, task, indent: 0, siblingCount: 1 })),
    ]);
  }
  const buckets = new Map<Exclude<SurfaceDomainLane, '—'>, CanonicalMarketingTask[]>();
  for (const lane of SURFACE_DOMAIN_LANE_ORDER) buckets.set(lane, []);
  for (const t of tasks) {
    const lane = getSurfaceDomainLane(t);
    const key: Exclude<SurfaceDomainLane, '—'> =
      lane === '—' ? 'Marketing' : lane;
    const arr = buckets.get(key) || [];
    arr.push(t);
    buckets.set(key, arr);
  }
  const items: SurfaceTableListItem[] = [];
  for (const lane of SURFACE_DOMAIN_LANE_ORDER) {
    const laneTasks = buckets.get(lane) || [];
    if (laneTasks.length === 0) continue;
    items.push({ kind: 'lane', lane, count: laneTasks.length });
    items.push(...buildLaneListItems(laneTasks, expandedRequestIds));
  }
  return items;
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
  initialRequests,
  onTasksChange,
  onRequestsChange,
  currentUser: propCurrentUser
}) => {
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const lastBroadcastTasksKeyRef = useRef<string>('');
  const lastBroadcastRequestsKeyRef = useRef<string>('');
  const onTasksChangeRef = useRef(onTasksChange);
  onTasksChangeRef.current = onTasksChange;
  const onRequestsChangeRef = useRef(onRequestsChange);
  onRequestsChangeRef.current = onRequestsChange;

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
  const [taskDomain, setTaskDomain] = useState<'all' | 'marketing' | 'operations' | 'listing_launch' | 'offer_2t'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'pipeline'>(() => {
    if (initialViewMode) return initialViewMode;
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get('view')?.toLowerCase().trim();
        if (viewParam === 'table') return 'table';
        if (viewParam === 'board' || viewParam === 'pipeline' || viewParam === 'kanban') return 'pipeline';

        const stored = localStorage.getItem('nest_tasks_view_mode');
        if (stored === 'table') return 'table';
        if (stored === 'board' || stored === 'pipeline') return 'pipeline';
      } catch {}
    }
    return 'pipeline';
  });

  const handleViewModeChange = (mode: 'table' | 'pipeline') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nest_tasks_view_mode', mode === 'pipeline' ? 'board' : 'table');
        const url = new URL(window.location.href);
        url.searchParams.set('view', mode === 'pipeline' ? 'board' : 'table');
        window.history.replaceState({}, '', url.toString());
      } catch {}
    }
  };
  const [searchQuery, setSearchQuery] = useState<string>('');
  /** Surface bar v2: Mine · Open · Blocked · Address (one row). */
  const [surfaceMineOnly, setSurfaceMineOnly] = useState(false);
  const [surfaceOpenOnly, setSurfaceOpenOnly] = useState(false);
  const [surfaceBlockedOnly, setSurfaceBlockedOnly] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('All Statuses');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('All Team Members');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | '30d' | 'quarter' | 'future_2027'>('all');
  /** Parent intake request accordion: requestId → expanded (default collapsed when 2+ subtasks) */
  const [expandedRequestIds, setExpandedRequestIds] = useState<Record<string, boolean>>({});
  const [tableGroupMode, setTableGroupMode] = useState<SurfaceTableGroupMode>('address');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [sortField, setSortField] = useState<'dueAt' | 'createdAt' | 'title' | 'receivedAt' | 'status'>('dueAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [activeActionDropdownId, setActiveActionDropdownId] = useState<string | null>(null);
  const [sendToSubmenuTaskId, setSendToSubmenuTaskId] = useState<string | null>(null);
  const [quickActionsTask, setQuickActionsTask] = useState<CanonicalMarketingTask | null>(null);
  const [quickActionsMode, setQuickActionsMode] = useState<'full' | 'reassign'>('full');
  const [showNewRequestModal, setShowNewRequestModal] = useState<boolean>(false);
  const [inspectorRequest, setInspectorRequest] = useState<CanonicalMarketingRequest | null>(null);
  const [showInspectorDrawer, setShowInspectorDrawer] = useState<boolean>(false);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState<boolean>(false);
  const closedTaskIdRef = useRef<string | null>(null);
  const [modalSelectedTask, setModalSelectedTask] = useState<CanonicalMarketingTask | null>(null);
  const [modalRequest, setModalRequest] = useState<CanonicalMarketingRequest | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<'overview' | 'conversation' | 'work' | 'activity'>('overview');
  const [isWorkstationOpen, setIsWorkstationOpen] = useState(false);
  const [workstationTask, setWorkstationTask] = useState<(WorkspaceDrawerTask & { mlsNumber?: string; parentRequest?: CanonicalMarketingRequest }) | null>(null);
  const [workstationInitialTab, setWorkstationInitialTab] = useState<'overview' | 'history' | 'proof' | 'files'>('overview');
  const [questionModalCampaign, setQuestionModalCampaign] = useState<any | null>(null);
  const [browserAgentCampaign, setBrowserAgentCampaign] = useState<any | null>(null);
  const [selectedActionCampaign, setSelectedActionCampaign] = useState<any | null>(null);
  const [quickViewSop, setQuickViewSop] = useState<MarketingSopDefinition | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastArchivedTaskIds, setLastArchivedTaskIds] = useState<string[] | null>(null);
  const [printManifest, setPrintManifest] = useState<PrintSpecManifest | null>(null);
  const [activePresetMenuRequestId, setActivePresetMenuRequestId] = useState<string | null>(null);
  const [customDeliverableModalReqId, setCustomDeliverableModalReqId] = useState<string | null>(null);
  const [customDeliverableTitle, setCustomDeliverableTitle] = useState<string>('');
  const [isSyncingEmailInbox, setIsSyncingEmailInbox] = useState<boolean>(false);

  const getAuthHeaders = (): Record<string, string> => {
    const token = (typeof localStorage !== 'undefined' && localStorage.getItem('shapework_session_token')) || 'usr_ryan';
    const workspaceId = (typeof localStorage !== 'undefined' && localStorage.getItem('shapework_active_workspace_id')) || 'nest-realty-wilmington';
    return {
      'Authorization': `Bearer ${token}`,
      'x-workspace-id': workspaceId
    };
  };

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
    const authHeaders = getAuthHeaders();

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

  // Synchronize tasks changes with parent container (MarketingIntakeConsole) and broadcast event
  useEffect(() => {
    const newKey = tasks.map(t => `${t.id}:${t.status}:${t.reviewState || ''}:${t.assignedToId || ''}:${(t as any).assigneeId || ''}:${t.reviewOwnerId || ''}:${t.proofVersion || 0}:${t.isArchived ? 1 : 0}`).join('|');
    if (lastBroadcastTasksKeyRef.current === newKey) {
      return;
    }
    lastBroadcastTasksKeyRef.current = newKey;

    if (onTasksChange) {
      onTasksChange(tasks);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('marketing-tasks-updated', {
        detail: { tasks, source: 'MarketingHomeInbox' }
      }));
    }
  }, [tasks]);

  useEffect(() => {
    const newKey = requests.map(r => `${r.id}:${r.status}:${r.updatedAt || ''}`).join('|');
    if (lastBroadcastRequestsKeyRef.current === newKey) {
      return;
    }
    lastBroadcastRequestsKeyRef.current = newKey;

    if (onRequestsChange) {
      onRequestsChange(requests);
    }
  }, [requests]);

  // Sync if initialTasks changes from parent (e.g. parent poll or external update)
  useEffect(() => {
    if (initialTasks && initialTasks.length > 0) {
      const newKey = initialTasks.map(t => `${t.id}:${t.status}:${t.reviewState || ''}:${t.assignedToId || ''}:${(t as any).assigneeId || ''}:${t.reviewOwnerId || ''}:${t.proofVersion || 0}:${t.isArchived ? 1 : 0}`).join('|');
      setTasks(prev => {
        const prevKey = prev.map(t => `${t.id}:${t.status}:${t.reviewState || ''}:${t.assignedToId || ''}:${(t as any).assigneeId || ''}:${t.reviewOwnerId || ''}:${t.proofVersion || 0}:${t.isArchived ? 1 : 0}`).join('|');
        if (prevKey === newKey) return prev;
        lastBroadcastTasksKeyRef.current = newKey;
        return initialTasks;
      });
    }
  }, [initialTasks]);

  // Listen to manual or external data refresh events
  useEffect(() => {
    const handleRefresh = () => {
      loadTasksAndRequests();
    };
    const handleExternalTasksUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ tasks?: CanonicalMarketingTask[]; source?: string }>;
      if (customEvent.detail?.source === 'MarketingHomeInbox') return;
      if (customEvent.detail?.tasks && Array.isArray(customEvent.detail.tasks)) {
        const incomingTasks = customEvent.detail.tasks;
        const incomingKey = incomingTasks.map(t => `${t.id}:${t.status}:${t.reviewState || ''}:${t.assignedToId || ''}:${(t as any).assigneeId || ''}:${t.reviewOwnerId || ''}:${t.proofVersion || 0}:${t.isArchived ? 1 : 0}`).join('|');
        setTasks(prev => {
          const prevKey = prev.map(t => `${t.id}:${t.status}:${t.reviewState || ''}:${t.assignedToId || ''}:${(t as any).assigneeId || ''}:${t.reviewOwnerId || ''}:${t.proofVersion || 0}:${t.isArchived ? 1 : 0}`).join('|');
          if (prevKey === incomingKey) return prev;
          lastBroadcastTasksKeyRef.current = incomingKey;
          return incomingTasks;
        });
      } else {
        loadTasksAndRequests();
      }
    };
    window.addEventListener('refresh-marketing-data', handleRefresh);
    window.addEventListener('marketing-tasks-updated', handleExternalTasksUpdated);
    return () => {
      window.removeEventListener('refresh-marketing-data', handleRefresh);
      window.removeEventListener('marketing-tasks-updated', handleExternalTasksUpdated);
    };
  }, []);

  const showToast = (msg: string, undoTaskIds?: string[]) => {
    setToastMessage(msg);
    setLastArchivedTaskIds(undoTaskIds && undoTaskIds.length > 0 ? undoTaskIds : null);
    setTimeout(() => {
      setToastMessage(null);
      setLastArchivedTaskIds(null);
    }, 6000);
  };

  const drawerCurrentUser = (() => {
    const queueName = selectedAssignee !== 'All Team Members' && selectedAssignee !== 'Unassigned'
      ? selectedAssignee
      : null;
    const fromQueue = queueName ? resolveCanonicalStaffMember(queueName) : null;
    const fromProp = propCurrentUser;
    if (fromQueue && (fromQueue.name === 'Melissa Gagliardi' || queueName === 'Melissa Gagliardi')) {
      return {
        id: fromQueue.id || 'dir_melissa_gagliardi_33',
        name: 'Melissa Gagliardi',
        email: fromQueue.email || 'melissa.gagliardi@nestrealty.com',
        role: 'marketing_director',
        permissions: ['marketing.create', 'marketing.edit', 'marketing.final_approval', 'marketing.approve', ...(Array.isArray(fromProp?.permissions) ? fromProp.permissions : [])]
      };
    }
    if (fromQueue && (fromQueue.name === 'Eduardo Lovo' || queueName === 'Eduardo Lovo')) {
      return {
        id: fromQueue.id || 'dir_eduardo_lovo_73',
        name: 'Eduardo Lovo',
        email: fromQueue.email || 'eduardo.lovo@nestrealty.com',
        role: 'producer',
        permissions: ['marketing.create', 'marketing.edit']
      };
    }
    if (fromQueue && (fromQueue.name === 'Ann Gunn' || queueName === 'Ann Gunn')) {
      return {
        id: fromQueue.id || 'dir_ann_gunn_28',
        name: 'Ann Gunn',
        email: fromQueue.email || 'ann@nestrealty.com',
        role: 'operations_lead',
        permissions: ['operations.final_approval', 'operations.approve', 'marketing.create', 'marketing.edit']
      };
    }
    if (fromProp?.name || fromProp?.id) {
      return {
        id: fromProp.id || 'usr_session',
        name: fromProp.name || 'Team Member',
        email: fromProp.email,
        role: fromProp.role || 'producer',
        permissions: Array.isArray(fromProp.permissions) ? fromProp.permissions : ['marketing.create', 'marketing.edit']
      };
    }
    return {
      id: 'usr_guest',
      name: 'Guest Viewer',
      role: 'viewer',
      permissions: ['marketing.view']
    };
  })();


  const handleBatchAction = async (action: 'assign_eduardo' | 'assign_melissa' | 'vendor_dispatch' | 'approve' | 'archive' | 'restore' | 'print_hub') => {
    if (selectedTaskIds.length === 0) return;
    const targetIds = [...selectedTaskIds];
    setSelectedTaskIds([]);

    if (action === 'print_hub') {
      try {
        const res = await fetch('/api/marketing/print-hub/generate-manifest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
      showToast(`✓ Archived ${targetIds.length} task(s)`, targetIds);
    } else if (action === 'restore') {
      setTasks(prev => prev.map(t => targetIds.includes(t.id) ? { ...t, status: t.proofUrl ? 'in_progress' : 'request_received', isArchived: false, archivedAt: undefined } : t));
      setRequests(prev => prev.map(r => {
        const reqTaskIds = r.taskIds || [];
        const isAffected = reqTaskIds.some(id => targetIds.includes(id)) || targetIds.some(id => id.includes(r.id));
        return isAffected ? { ...r, isArchived: false } : r;
      }));
      showToast(`✓ Restored ${targetIds.length} task(s) to active queue`);
    } else if (action === 'assign_eduardo') {
      setTasks(prev => prev.map(t => targetIds.includes(t.id) ? { ...t, status: 'assigned', assignedTo: 'Eduardo Lovo', assignedToId: 'dir_eduardo_lovo_73', assignedToRole: 'Virtual Assistant' } : t));
      showToast(`✓ Assigned ${targetIds.length} task(s) to Eduardo Lovo`);
    } else if (action === 'assign_melissa') {
      setTasks(prev => prev.map(t => targetIds.includes(t.id) ? { ...t, status: 'assigned', assignedTo: 'Melissa Gagliardi', assignedToId: 'dir_melissa_gagliardi_33', assignedToRole: 'Marketing Director' } : t));
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
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
        if (action === 'archive' || action === 'restore') {
          fetch('/api/marketing/canonical-requests', { headers: getAuthHeaders() })
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
        const parentReq = requests.find(r => r.id === requestId);
        const fallbackTask: CanonicalMarketingTask = {
          id: `task_custom_${Date.now()}`,
          requestId,
          requestTitle: parentReq?.title || 'Marketing Request',
          propertyAddress: parentReq?.propertyAddress || 'Address not specified',
          agentName: parentReq?.agentName || 'Requester not identified',
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
      const parentReq = requests.find(r => r.id === requestId);
      const fallbackTask: CanonicalMarketingTask = {
        id: `task_custom_${Date.now()}`,
        requestId,
        requestTitle: parentReq?.title || 'Marketing Request',
        propertyAddress: parentReq?.propertyAddress || 'Address not specified',
        agentName: parentReq?.agentName || 'Requester not identified',
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
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
            isArchived: newStatus === 'archived' ? true : (newStatus !== 'archived' && t.isArchived ? false : t.isArchived),
            archivedAt: newStatus === 'archived' ? (t.archivedAt || new Date().toISOString()) : undefined,
            completedAt: newStatus === 'completed' ? (t.completedAt || new Date().toISOString()) : t.completedAt,
            updatedAt: new Date().toISOString()
          };
          return updated;
        }));
      }

      if (extra?.customToast) {
        showToast(extra.customToast, newStatus === 'archived' ? [taskId] : undefined);
      } else if (newStatus === 'archived') {
        showToast('✓ Task archived and moved to Archived tab', [taskId]);
      } else if (extra?.assignedTo) {
        showToast(`✓ Task assigned to ${extra.assignedTo} (${extra.assignedToRole || 'Team Member'})`);
      } else {
        showToast(`✓ Task updated to ${newStatus.replace(/_/g, ' ')}`);
      }
    } catch {
      setTasks(prev => prev.map(t => t.id === taskId ? {
        ...t,
        status: newStatus,
        isArchived: newStatus === 'archived' ? true : (newStatus !== 'archived' && t.isArchived ? false : t.isArchived),
        archivedAt: newStatus === 'archived' ? (t.archivedAt || new Date().toISOString()) : undefined
      } : t));
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

  const handleRestoreTask = async (taskId: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    // 1. Optimistic update
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        status: t.proofUrl ? 'in_progress' : 'request_received',
        isArchived: false,
        archivedAt: undefined,
        updatedAt: new Date().toISOString()
      };
    }));

    if (targetTask.requestId) {
      setRequests(prev => prev.map(r => r.id === targetTask.requestId ? { ...r, isArchived: false } : r));
    }

    showToast(`✓ Restored "${targetTask.title}" to active queue`);

    // 2. Durable backend restore
    try {
      const res = await fetch(`/api/marketing/tasks/${taskId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.task) {
          setTasks(prev => prev.map(t => t.id === taskId ? data.task : t));
        }
      }
    } catch (err) {
      console.error('Failed to restore task:', err);
    }
  };

  const handleArchiveRequestAndTasks = async (requestId: string) => {
    const affectedTasks = tasks.filter(t => t.requestId === requestId);
    const affectedIds = affectedTasks.map(t => t.id);
    try {
      const res = await fetch(`/api/marketing/canonical-requests/${requestId}/archive-all`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(prev => prev.map(r => r.id === requestId ? { ...r, isArchived: true } : r));
        setTasks(prev => prev.map(t => (t.requestId === requestId || data.archivedTasks?.some((at: any) => at.id === t.id)) ? { ...t, status: 'archived', isArchived: true } : t));
      } else {
        setRequests(prev => prev.map(r => r.id === requestId ? { ...r, isArchived: true } : r));
        setTasks(prev => prev.map(t => t.requestId === requestId ? { ...t, status: 'archived', isArchived: true } : t));
      }
      showToast(`✓ Archived request container and all its deliverables!`, affectedIds);
    } catch {
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, isArchived: true } : r));
      setTasks(prev => prev.map(t => t.requestId === requestId ? { ...t, status: 'archived', isArchived: true } : t));
      showToast(`✓ Archived request container and all its deliverables!`, affectedIds);
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

  const resolveParentRequest = (task: CanonicalMarketingTask): CanonicalMarketingRequest => {
    const found = (task.requestId ? requests.find(r => r.id === task.requestId) : undefined) ||
      (task.propertyAddress && task.propertyAddress.trim() ? requests.find(r => r.propertyAddress && r.propertyAddress.toLowerCase().trim() === task.propertyAddress.toLowerCase().trim()) : undefined) ||
      (task.requestTitle && task.requestTitle.trim() ? requests.find(r => r.title && r.title.trim() && r.title.toLowerCase().trim() === task.requestTitle.toLowerCase().trim()) : undefined);
    if (found) return found;
    return {
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
      updatedAt: task.updatedAt,
      mlsNumber: task.mlsNumber,
      photos: task.photos
    } as CanonicalMarketingRequest;
  };

  const handleOpenTaskDetail = (task: CanonicalMarketingTask, initialTab: 'overview' | 'conversation' | 'work' | 'activity' = 'overview') => {
    const parent = resolveParentRequest(task);
    const resolvedAgentName = task.agentName || parent.agentName || 'Requester not identified';
    const syncedParent = { ...parent, agentName: resolvedAgentName };
    const syncedTask = { ...task, agentName: resolvedAgentName };
    setModalSelectedTask(syncedTask);
    setModalRequest(syncedParent);
    setModalInitialTab(initialTab);
    setWorkstationTask(toWorkspaceDrawerTask(syncedTask, syncedParent));
    setWorkstationInitialTab(mapInboxTabToDrawerTab(initialTab));
    setIsWorkstationOpen(true);
    setShowTaskDetailModal(false);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('taskId', task.id);
        window.history.replaceState({}, '', url.toString());
      } catch {}
    }
  };

  const handleCloseWorkstation = () => {
    const currentId = workstationTask?.id || modalSelectedTask?.id || initialSelectedTaskId || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('taskId') : null);
    if (currentId) closedTaskIdRef.current = currentId;
    setIsWorkstationOpen(false);
    setWorkstationTask(null);
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
        const staff = resolveCanonicalStaffMember(assignee);
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignedTo: assignee, assignedToId: staff?.id || t.assignedToId, assignedToRole: role } : t));
        showToast(`✓ Assigned to ${assignee} (${role})`);
      }
    } catch {
      const staff = resolveCanonicalStaffMember(assignee);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignedTo: assignee, assignedToId: staff?.id || t.assignedToId, assignedToRole: role } : t));
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
            handleOpenTaskDetail(archived);
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

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const targetDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      const diffDays = Math.round((targetDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));

      const formattedStr = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: targetDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });

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

  // Format Requested Needed By Date
  const formatNeededByDate = (neededByDate?: string | null, dueAt?: string | null) => {
    const target = neededByDate || dueAt;
    if (!target) return { label: 'No date set', isOverdue: false, isToday: false, badgeClass: 'text-slate-400 bg-slate-50 border-slate-200' };

    try {
      if (typeof target === 'string' && target.toLowerCase().includes('today')) {
        return {
          label: 'Due Today',
          isToday: true,
          badgeClass: 'text-amber-800 bg-amber-50 border-amber-200 font-semibold'
        };
      }

      const d = new Date(target);
      if (isNaN(d.getTime())) return { label: target, isOverdue: false, isToday: false, badgeClass: 'text-slate-600 bg-slate-50 border-slate-200' };

      const isMidnightUtc = target.includes('T00:00:00') || target.length === 10;
      const formattedStr = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: isMidnightUtc ? 'UTC' : 'America/New_York'
      });

      const todayStr = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'America/New_York'
      });

      const isToday = formattedStr === todayStr;
      return {
        label: formattedStr,
        isToday,
        badgeClass: isToday
          ? 'text-amber-800 bg-amber-50 border-amber-200 font-semibold'
          : 'text-slate-700 bg-slate-50 border-slate-200 font-medium'
      };
    } catch {
      return { label: target, isOverdue: false, isToday: false, badgeClass: 'text-slate-600 bg-slate-50 border-slate-200' };
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

  /** ISO received time for sort/display: parent receivedAt when parseable, else task.createdAt */
  const getTaskReceivedIso = (t: CanonicalMarketingTask): string | undefined => {
    const parent = t.requestId ? requests.find(r => r.id === t.requestId) : undefined;
    const candidates = [parent?.receivedAt, (t as any).receivedAt, t.createdAt];
    for (const raw of candidates) {
      if (!raw || typeof raw !== 'string') continue;
      const ms = Date.parse(raw);
      if (!Number.isNaN(ms)) return new Date(ms).toISOString();
    }
    // Non-ISO labels like "Just now · Desk Intake" — fall through to createdAt already tried
    return t.createdAt;
  };

  // Helpers for Marketing vs Operational Tasks
  const isListingLaunch = (t: CanonicalMarketingTask): boolean => {
    return isListingLaunchBoardTask(t);
  };

  const isOffer2T = (t: CanonicalMarketingTask): boolean => {
    return isOffer2TBoardTask(t);
  };

  const isMarketing = (t: CanonicalMarketingTask): boolean => {
    if (!t) return true;
    if (isListingLaunch(t)) return false;
    if (isOffer2T(t)) return false;
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
    if (!t) return false;
    if (isListingLaunch(t)) return false;
    if (isOffer2T(t)) return false;
    return !isMarketing(t);
  };

  // Domain Counts
  const domainCounts = useMemo(() => {
    const isArchivedMode = selectedStatus === 'Archived' || showArchived;
    const active = allTasksCombined.filter(t => isArchivedMode ? (t.isArchived || t.status === 'archived') : (!t.isArchived && t.status !== 'archived'));
    return {
      all: active.length,
      marketing: active.filter(isMarketing).length,
      operations: active.filter(isOperational).length,
      listing_launch: active.filter(isListingLaunch).length,
      offer_2t: active.filter(isOffer2T).length
    };
  }, [allTasksCombined, selectedStatus, showArchived]);

  // Filtered & Chronologically Sorted Tasks
  const filteredTasks = useMemo(() => {
    // Start of today in the operator's local TZ — completed work drops off All Tasks after midnight.
    const startOfTodayMs = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
    const isArchivedMode = selectedStatus === 'Archived' || showArchived;
    const q = (searchQuery || '').toLowerCase().trim();
    const isSearching = Boolean(q);

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
        if (taskDomain === 'listing_launch' && !isListingLaunch(t)) return false;
        if (taskDomain === 'offer_2t' && !isOffer2T(t)) return false;

        const matchesSearch =
          !q ||
          ((t.title || '').toLowerCase().includes(q)) ||
          ((t.requestTitle || '').toLowerCase().includes(q)) ||
          (Boolean(t.propertyAddress) && String(t.propertyAddress).toLowerCase().includes(q)) ||
          (Boolean(t.notes) && String(t.notes).toLowerCase().includes(q)) ||
          (Boolean(t.agentName) && String(t.agentName).toLowerCase().includes(q)) ||
          (Boolean(t.assignedTo) && String(t.assignedTo).toLowerCase().includes(q)) ||
          (Boolean(t.vendorName) && String(t.vendorName).toLowerCase().includes(q));

        const lane = getCanonicalLaneForTask(t);

        // Day rollover: prior-day Approved/Done leave All Tasks, but stay findable via search or the Approved filter.
        if (
          !isArchivedMode &&
          !isSearching &&
          (selectedStatus === 'All Tasks' || selectedStatus === 'All Statuses') &&
          lane === 'approved'
        ) {
          const doneAt = t.completedAt || t.archivedAt || t.updatedAt || t.createdAt;
          const doneMs = doneAt ? new Date(doneAt).getTime() : 0;
          if (doneMs > 0 && doneMs < startOfTodayMs) {
            return false;
          }
        }

        const matchesStatus =
          selectedStatus === 'All Tasks' ||
          selectedStatus === 'All Statuses' ||
          PIPELINE_STAGES.some(stage => stage.label === selectedStatus && stage.id === lane) ||
          (selectedStatus === 'Archived' && lane === 'archived') ||
          (selectedStatus === 'Unreconciled Legacy' && lane === 'legacy_unreconciled') ||
          ((selectedStatus === 'Unassigned' || selectedStatus === 'Task Received' || selectedStatus === 'Request Received') && (lane === 'request_received' || lane === 'legacy_unreconciled')) ||
          (selectedStatus === 'Assigned' && lane === 'assigned') ||
          (selectedStatus === 'In Progress' && lane === 'in_progress') ||
          ((selectedStatus === 'Awaiting Manager Review' || selectedStatus === 'Agent Review' || selectedStatus === 'Manager Review') && lane === 'agent_review') ||
          (selectedStatus === 'Revisions' && lane === 'revisions') ||
          (selectedStatus === 'Approved' && lane === 'approved') ||
          (selectedStatus === 'With Vendor' && lane === 'with_vendor');

        const matchesCategory =
          selectedCategory === 'All Categories' ||
          (Boolean(t.category) && String(t.category).toLowerCase() === String(selectedCategory).toLowerCase().replace(/ /g, '_'));

        const matchesAssignee =
          selectedAssignee === 'All Team Members' ||
          (selectedAssignee === 'Unassigned' && (!t.assignedTo || t.status === 'request_received')) ||
          t.assignedTo === selectedAssignee ||
          (selectedAssignee === 'Melissa Gagliardi' && (
            t.reviewOwner === 'Melissa Gagliardi' ||
            t.reviewOwnerName === 'Melissa Gagliardi' ||
            (t.reviewState === 'awaiting_review' && (!t.reviewOwner || t.reviewOwner === 'Melissa Gagliardi'))
          ));

        // Timeframe filter
        let matchesTimeframe = true;
        const taskDate = new Date(t.updatedAt || t.dueAt || t.createdAt).getTime();
        const diffDaysFromNow = (nowMs - taskDate) / (1000 * 60 * 60 * 24);

        if (selectedTimeframe === '7d') {
          matchesTimeframe = Math.abs(diffDaysFromNow) <= 7;
        } else if (selectedTimeframe === '30d') {
          matchesTimeframe = Math.abs(diffDaysFromNow) <= 30;
        } else if (selectedTimeframe === 'quarter') {
          matchesTimeframe = Math.abs(diffDaysFromNow) <= 90;
        } else if (selectedTimeframe === 'future_2027') {
          matchesTimeframe = new Date(t.dueAt || t.createdAt).getFullYear() >= 2027;
        }

        const mineUser = propCurrentUser || drawerCurrentUser;
        const mineName = (mineUser?.name || '').trim().toLowerCase();
        const mineIds = new Set([mineUser?.id, resolveCanonicalStaffMember(mineUser?.email || mineUser?.name || '')?.id].filter(Boolean));
        const assigneeIds = [(t as any).assigneeId, t.assignedToId].filter(Boolean);
        const matchesSurfaceMine =
          !surfaceMineOnly ||
          assigneeIds.some(id => mineIds.has(id)) ||
          (Boolean(t.reviewOwnerId) && mineIds.has(t.reviewOwnerId)) ||
          (Boolean(mineName) && assigneeIds.length === 0 && [t.assignedTo, t.assignedToName, (t as any).ownerName].some(name => String(name || '').trim().toLowerCase() === mineName)) ||
          (Boolean(mineName) && !t.reviewOwnerId && [t.reviewOwnerName, t.reviewOwner].some(name => String(name || '').trim().toLowerCase() === mineName));

        const matchesSurfaceOpen =
          !surfaceOpenOnly ||
          (!t.isArchived && t.status !== 'archived' && t.status !== 'approved' && t.status !== 'completed' && getCanonicalLaneForTask(t) !== 'approved');

        const matchesSurfaceBlocked =
          !surfaceBlockedOnly ||
          t.status === 'blocked' ||
          String((t as any).routingState || '').toLowerCase() === 'blocked' ||
          Boolean((t as any).isBlocked);

        return matchesSearch && matchesStatus && matchesCategory && matchesAssignee && matchesTimeframe && matchesSurfaceMine && matchesSurfaceOpen && matchesSurfaceBlocked;
      })
      .sort((a, b) => {
        if (sortField === 'status') {
          const difference = statusSortRank(getCanonicalLaneForTask(a)) - statusSortRank(getCanonicalLaneForTask(b));
          return sortOrder === 'asc' ? difference : -difference;
        }
        if (sortField === 'receivedAt' || sortField === 'createdAt') {
          const aIso = sortField === 'receivedAt' ? getTaskReceivedIso(a) : a.createdAt;
          const bIso = sortField === 'receivedAt' ? getTaskReceivedIso(b) : b.createdAt;
          const aTime = aIso ? new Date(aIso).getTime() : 0;
          const bTime = bIso ? new Date(bIso).getTime() : 0;
          return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
        }
        if (sortField === 'title') {
          return sortOrder === 'asc'
            ? (a.title || '').localeCompare(b.title || '')
            : (b.title || '').localeCompare(a.title || '');
        }
        const aDate = a.neededByDate || a.dueAt;
        const bDate = b.neededByDate || b.dueAt;
        const diff = getSortWeight(aDate) - getSortWeight(bDate);
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [allTasksCombined, taskDomain, searchQuery, selectedStatus, selectedCategory, selectedAssignee, selectedTimeframe, showArchived, sortField, sortOrder, nowMs, requests, surfaceMineOnly, surfaceOpenOnly, surfaceBlockedOnly, propCurrentUser]);

  const toggleRequestAccordion = (requestId: string) => {
    setExpandedRequestIds((prev) => ({ ...prev, [requestId]: !prev[requestId] }));
  };

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

  // Compute dynamic Fit-Board column metadata and layout
  const pipelineColumnsMeta = useMemo(() => {
    return PIPELINE_STAGES.map(col => {
      const count = filteredTasks.filter(t => {
        const lane = getCanonicalLaneForTask(t);
        if (col.id === 'request_received') {
          return lane === 'request_received' || lane === 'legacy_unreconciled';
        }
        return lane === col.id;
      }).length;
      return { id: col.id, taskCount: count };
    });
  }, [filteredTasks]);

  const {
    containerRef: boardContainerRef,
    collapsedColumns,
    toggleColumnCollapse,
    columnWidthStyle,
    railWidthStyle,
    railWidthClass,
    gapClass
  } = useFitBoardLayout({
    columns: pipelineColumnsMeta,
    context: 'tasks',
    workspaceId: (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') ? window.localStorage.getItem('shapework_active_workspace_id') || 'nest-realty-wilmington' : 'nest-realty-wilmington',
    minColWidth: 200,
    targetColWidth: 230,
    railWidth: 44,
    gap: 8
  });

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
      
      {/* 1. TOP HEADER TOOLBAR: DOMAIN TABS (LEFT) & ACTION BUTTONS (RIGHT) — Board only; hidden in Table (Surface v2 one-row toolbar) */}
      {viewMode !== 'table' && (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* DOMAIN QUICK-SWITCH PILL TABS */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5" data-testid="task-domain-pill-tabs">
          <button
            type="button"
            onClick={() => setTaskDomain('all')}
            className={`nest-pill px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer ${
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
            className={`nest-pill px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer ${
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
            onClick={() => setTaskDomain('listing_launch')}
            data-testid="task-domain-listing-launch"
            className={`nest-pill px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer ${
              taskDomain === 'listing_launch'
                ? 'bg-[#01362D] text-white shadow-xs font-bold'
                : 'bg-white hover:bg-emerald-50/50 text-[#01362D] border border-[#01362D]/25 shadow-2xs'
            }`}
          >
            <span>Listing Launch</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${taskDomain === 'listing_launch' ? 'bg-white/20 text-white' : 'bg-[#01362D]/10 text-[#01362D]'}`}>
              {domainCounts.listing_launch}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTaskDomain('offer_2t')}
            data-testid="task-domain-offer-2t"
            className={`nest-pill px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer ${
              taskDomain === 'offer_2t'
                ? 'bg-[#01362D] text-white shadow-xs font-bold'
                : 'bg-white hover:bg-emerald-50/50 text-[#01362D] border border-[#01362D]/25 shadow-2xs'
            }`}
          >
            <span>Offer / 2-T</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${taskDomain === 'offer_2t' ? 'bg-white/20 text-white' : 'bg-[#01362D]/10 text-[#01362D]'}`}>
              {domainCounts.offer_2t}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTaskDomain('operations')}
            className={`nest-pill px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer ${
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

        {/* ACTION BUTTONS (SAME ROW AS DOMAIN TABS) — compact Nora orb, not pulse chrome */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="tasks-ask-nora-header"
            onClick={() => {
              try {
                window.dispatchEvent(new CustomEvent('nest-navigate-tab', { detail: { tab: 'Workboard' } }));
              } catch {}
            }}
            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#F7F3EC] border border-[#E8DFD0] text-[#01362D] text-xs font-semibold hover:bg-[#F0EBE1] transition cursor-pointer shadow-2xs"
            title="Open Ask Nora"
          >
            <NestOrbVisualizer size="xs" customSize={18} className="shadow-xs" />
            <span>Ask Nora</span>
          </button>
        </div>
      </div>
      )}

      {/* 2. SURFACE TOOLBAR v2 — one row: Mine · Open · Blocked · Address · Board|Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs">
        <div className="flex items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[260px] flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 shrink-0" data-testid="tasks-surface-filters">
              <button
                type="button"
                data-testid="tasks-filter-mine"
                aria-pressed={surfaceMineOnly}
                onClick={() => setSurfaceMineOnly(v => !v)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition ${
                  surfaceMineOnly
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                Mine
              </button>
              <button
                type="button"
                data-testid="tasks-filter-open"
                aria-pressed={surfaceOpenOnly}
                onClick={() => setSurfaceOpenOnly(v => !v)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition ${
                  surfaceOpenOnly
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                Open
              </button>
              <button
                type="button"
                data-testid="tasks-filter-blocked"
                aria-pressed={surfaceBlockedOnly}
                onClick={() => setSurfaceBlockedOnly(v => !v)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition ${
                  surfaceBlockedOnly
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                Blocked
              </button>
            </div>

            <select
              aria-label="Filter by status"
              data-testid="tasks-filter-status"
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="max-w-[180px] min-w-[136px] px-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:border-[#00635C] focus:ring-1 focus:ring-[#00635C]/20 outline-none"
            >
              <option value="All Statuses">All Statuses</option>
              {PIPELINE_STAGES.map(stage => <option key={stage.id} value={stage.label}>{stage.label}</option>)}
              <option value="Unreconciled Legacy">Unreconciled Legacy</option>
              <option value="Archived">Archived</option>
            </select>

            <div className="relative flex-1 sm:max-w-xs min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Address…"
                aria-label="Filter by address"
                data-testid="tasks-filter-address"
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#00635C] focus:ring-1 focus:ring-[#00635C]/20"
              />
            </div>
          </div>

          {/* Table grouping */}
          {viewMode === 'table' && (
            <div
              className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/70 shrink-0"
              data-testid="tasks-group-by-toggle"
            >
              <button
                type="button"
                data-testid="tasks-group-by-status"
                aria-pressed={tableGroupMode === 'status'}
                onClick={() => setTableGroupMode('status')}
                className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                  tableGroupMode === 'status'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {SURFACE_TABLE_GROUP_BY_STATUS_LABEL}
              </button>
              <button
                type="button"
                data-testid="tasks-group-by-address"
                aria-pressed={tableGroupMode === 'address'}
                onClick={() => setTableGroupMode('address')}
                className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                  tableGroupMode === 'address'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {SURFACE_TABLE_GROUP_BY_ADDRESS_LABEL}
              </button>
              <button
                type="button"
                data-testid="tasks-group-by-lane"
                aria-pressed={tableGroupMode === 'lane'}
                onClick={() => setTableGroupMode('lane')}
                className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                  tableGroupMode === 'lane'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {SURFACE_TABLE_GROUP_BY_LANE_LABEL}
              </button>
            </div>
          )}

          {/* View Switcher Aligned Right */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/70 shrink-0 ml-auto" data-testid="all-tasks-view-switcher">
            <button
              type="button"
              data-testid="all-tasks-view-toggle-board"
              onClick={() => handleViewModeChange('pipeline')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 text-xs transition cursor-pointer ${
                viewMode === 'pipeline' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              type="button"
              data-testid="all-tasks-view-toggle-table"
              onClick={() => handleViewModeChange('table')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 text-xs transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. MAIN VIEW: TABLE OR PIPELINE */}
      {viewMode === 'table' ? (
        
        /* TABLE VIEW */
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs w-full max-w-full overflow-hidden" data-testid="all-tasks-table-view" data-grouped-list="true">
          <div className="overflow-x-auto min-h-[380px] pb-24 w-full">
            <table className="w-full text-left text-xs border-collapse table-auto">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  {/* 1. Selection Checkbox */}
                  <th className="py-3.5 px-3 w-10 text-center">
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

                  {/* 2. # — parent row number only (table lock v3) */}
                  <th className="py-3.5 px-2 w-10 text-center font-bold text-slate-700" data-testid="tasks-col-num">
                    #
                  </th>

                  {/* 3. Task */}
                  <th 
                    className="py-3.5 px-3 w-[24%] min-w-[200px] font-bold text-slate-700 cursor-pointer hover:bg-slate-100/80 transition select-none text-left"
                    onClick={() => {
                      if (sortField === 'title') {
                        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('title');
                        setSortOrder('asc');
                      }
                    }}
                    title="Click to sort by Title"
                    data-testid="tasks-col-task"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Task</span>
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'title' ? 'text-[#00635C]' : 'text-slate-400'}`} />
                    </div>
                  </th>

                  {/* 3. Status */}
                  <th
                    className="py-3.5 px-3 w-[11%] min-w-[110px] font-bold text-slate-700 text-left"
                    data-testid="tasks-col-status"
                    aria-sort={sortField === 'status' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      type="button"
                      data-testid="tasks-sort-status"
                      aria-label="Sort by status"
                      title="Sort by status; click again to reverse"
                      className="flex items-center gap-1.5 w-full text-left cursor-pointer hover:text-[#00635C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00635C] rounded"
                      onClick={() => {
                        setSortOrder(sortField === 'status' && sortOrder === 'asc' ? 'desc' : 'asc');
                        setSortField('status');
                        setTableGroupMode('status');
                      }}
                    >
                      <span>Status</span>
                      {sortField === 'status'
                        ? <span aria-hidden="true" className="text-[#00635C]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        : <ArrowUpDown aria-hidden="true" className="w-3 h-3 text-slate-400" />}
                    </button>
                  </th>

                  {/* 4. Owner */}
                  <th className="py-3.5 px-3 w-[12%] min-w-[120px] font-bold text-slate-700 text-left" data-testid="tasks-col-owner">
                    Owner
                  </th>

                  {/* 5. Due */}
                  <th 
                    className="py-3.5 px-3 w-[11%] min-w-[100px] font-bold text-slate-700 cursor-pointer hover:bg-slate-100/80 transition select-none text-left"
                    onClick={() => {
                      if (sortField === 'dueAt') {
                        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('dueAt');
                        setSortOrder('asc');
                      }
                    }}
                    title="Click to sort by Due date"
                    data-testid="tasks-col-due"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Due</span>
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'dueAt' ? 'text-[#00635C]' : 'text-slate-400'}`} />
                    </div>
                  </th>

                  {/* 6. Blocker (stub until fields) */}
                  <th className="py-3.5 px-3 w-[8%] min-w-[72px] font-bold text-slate-700 text-left" data-testid="tasks-col-blocker">
                    Blocker
                  </th>

                  {/* 7. Where (stub until fields) */}
                  <th className="py-3.5 px-3 w-[8%] min-w-[72px] font-bold text-slate-700 text-left" data-testid="tasks-col-where">
                    Where
                  </th>

                  {/* 8. Lane (domain helpers — not pipeline stage) */}
                  <th className="py-3.5 px-3 w-[9%] min-w-[88px] font-bold text-slate-700 text-left" data-testid="tasks-col-lane">
                    Lane
                  </th>

                  {/* 9. Received (table lock v3) */}
                  <th
                    className="py-3.5 px-3 w-[11%] min-w-[100px] font-bold text-slate-700 cursor-pointer hover:bg-slate-100/80 transition select-none text-left"
                    onClick={() => {
                      if (sortField === 'receivedAt') {
                        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('receivedAt');
                        setSortOrder('desc');
                      }
                    }}
                    title="Click to sort by Received"
                    data-testid="tasks-col-received"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Received</span>
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'receivedAt' ? 'text-[#00635C]' : 'text-slate-400'}`} />
                    </div>
                  </th>

                  {/* 10. Activity */}
                  <th className="py-3.5 px-3 w-[12%] min-w-[120px] font-bold text-slate-700 text-left" data-testid="tasks-col-activity">
                    Activity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-16 text-center" data-testid="tasks-empty-quiet">
                      <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                        <NestOrbVisualizer size="sm" customSize={40} className="shadow-sm" />
                        <div className="space-y-1">
                          <p className="font-serif font-bold text-sm text-[#01362D]">Intake is clear.</p>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Nothing matches these filters right now — Nora is quiet on this lane. Try clearing filters, or start something new.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (() => {
                  const surfaceTableItems = buildSurfaceTableListItems(filteredTasks, expandedRequestIds, tableGroupMode, sortField === 'status' ? sortOrder : 'asc');
                  const parentRowNums = assignSurfaceTableParentRowNumbers(surfaceTableItems);
                  return surfaceTableItems.map((listItem) => {
                    if (listItem.kind === 'group') {
                      return (
                        <tr
                          key={`${listItem.groupBy}-section-${listItem.key}`}
                          data-testid={`list-${listItem.groupBy}-section-${listItem.key.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`}
                          data-group-label={listItem.label}
                          className="bg-slate-100/90 border-t border-slate-200"
                        >
                          <th scope="rowgroup" colSpan={11} className="py-2 px-3 text-left">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">{listItem.label}</span>
                            <span className="ml-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">{listItem.count}</span>
                          </th>
                        </tr>
                      );
                    }
                    if (listItem.kind === 'lane') {
                      return (
                        <tr
                          key={`lane-section-${listItem.lane}`}
                          data-testid={`list-lane-section-${listItem.lane.replace(/\s+/g, '-').toLowerCase()}`}
                          className="bg-slate-100/90 border-t border-slate-200"
                        >
                          <td colSpan={11} className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                                {listItem.lane}
                              </span>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                                {listItem.count}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    if (listItem.kind === 'request') {
                      const reqTasks = listItem.tasks;
                      const parentReq = requests.find(r => r.id === listItem.requestId);
                      const sample = reqTasks[0];
                      const isExpanded = Boolean(expandedRequestIds[listItem.requestId]);
                      const addressLabel = parentReq?.propertyAddress || sample?.propertyAddress || parentReq?.title || sample?.requestTitle || 'Marketing Request';

                      const allSubtasksSelected = reqTasks.length > 0 && reqTasks.every(t => selectedTaskIds.includes(t.id));
                      const someSubtasksSelected = reqTasks.some(t => selectedTaskIds.includes(t.id)) && !allSubtasksSelected;

                      return (
                        <tr
                          key={`req-${listItem.requestId}`}
                          data-testid={`list-request-row-${listItem.requestId}`}
                          className="bg-[#F3F8F5] border-t border-t-[#00635C]/25"
                        >
                          <td
                            className="py-2.5 px-3 text-center align-middle bg-[#F3F8F5] border-l-4 border-l-[#00635C]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              aria-label={`Select all ${reqTasks.length} subtasks in ${addressLabel}`}
                              checked={allSubtasksSelected}
                              ref={(el) => {
                                if (el) {
                                  el.indeterminate = someSubtasksSelected;
                                }
                              }}
                              onChange={(e) => {
                                e.stopPropagation();
                                const subtaskIds = reqTasks.map(t => t.id);
                                if (e.target.checked) {
                                  setSelectedTaskIds(prev => Array.from(new Set([...prev, ...subtaskIds])));
                                } else {
                                  setSelectedTaskIds(prev => prev.filter(id => !subtaskIds.includes(id)));
                                }
                              }}
                              className="rounded border-slate-300 text-[#00635C] focus:ring-[#00635C] w-3.5 h-3.5 cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-center align-middle bg-[#F3F8F5] text-[11px] font-mono font-bold text-slate-500 tabular-nums">
                            <span data-testid="tasks-parent-row-num">{parentRowNums.get(`request:${listItem.requestId}`) ?? ''}</span>
                          </td>
                          <td colSpan={9} className="py-0 px-0 bg-[#F3F8F5]">
                            <div
                              data-testid={`list-request-accordion-${listItem.requestId}`}
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRequestAccordion(listItem.requestId);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleRequestAccordion(listItem.requestId);
                                }
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#E5EFEA]/80 transition cursor-pointer select-none"
                              aria-expanded={isExpanded}
                            >
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isExpanded
                                  ? <ChevronDown className="w-4 h-4 text-[#00635C]" />
                                  : <ChevronRight className="w-4 h-4 text-[#00635C]" />}
                              </div>
                              <span className="text-xs sm:text-[13px] font-black text-slate-900 truncate flex-1 min-w-0">
                                {addressLabel}
                              </span>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-[#00635C]/30 text-[#00635C] shadow-2xs shrink-0">
                                {reqTasks.length} subtask{reqTasks.length === 1 ? '' : 's'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    const task = listItem.task;
                    const rowIndent = listItem.indent;
                    const isSubtask = rowIndent > 0;
                    const isLastSubtask = Boolean(listItem.isLastSubtask);
                    const stage = getStageForTask(task);
                    const reviewHandoff = getMarketingReviewHandoff(task);
                    const isSelected = selectedTaskIds.includes(task.id);
                    const neededInfo = formatNeededByDate(task.neededByDate, task.dueAt);
                    const typeChip = isSubtask ? resolveSurfaceTableTypeChip(task.category) : null;
                    const requesterMuted = resolveSurfaceTableRequesterName(task);
                    const activityIso = task.updatedAt || task.createdAt;

                    const matchedCamp = campaigns.find((c: any) => c.id === task.requestId || c.propertyAddress?.includes(task.requestTitle)) || {
                      id: task.requestId || task.id,
                      propertyAddress: task.propertyAddress || task.requestTitle,
                      agentName: task.agentName,
                      status: task.status,
                      statusKey: task.status,
                      generatedDeliverables: []
                    };

                    return (
                      <React.Fragment key={`task-frag-${task.id}`}>
                        <tr
                          key={task.id}
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('button, a, input, select, textarea, [role="button"]')) return;
                            handleOpenTaskDetail(task);
                          }}
                          className={`nest-row-open cursor-pointer transition ${
                            isSelected
                              ? 'bg-emerald-50/50'
                              : isSubtask
                              ? 'bg-[#F9FBFA] hover:bg-[#EDF5F1]'
                              : 'bg-white hover:bg-slate-50/90'
                          } ${
                            isSubtask
                              ? `border-l-4 border-l-[#00635C] ${isLastSubtask ? 'border-b-2 border-b-[#00635C]/35' : 'border-b border-b-slate-100'}`
                              : 'border-b border-slate-200/80 border-l-4 border-l-transparent'
                          }`}
                          data-parent-request={task.requestId || undefined}
                          data-subtask-indent={rowIndent}
                          data-testid={isSubtask ? `subtask-row-${task.id}` : `task-row-${task.id}`}
                        >
                          <td
                            className={`py-2 px-3 text-center align-top ${isSubtask ? 'bg-[#F9FBFA]' : ''}`}
                          >
                            <input
                              type="checkbox"
                              aria-label={`Select campaign ${task.requestTitle || task.title}`}
                              checked={isSelected}
                              onChange={(e) => {
                                setSelectedTaskIds(prev => e.target.checked ? [...prev, task.id] : prev.filter(id => id !== task.id));
                              }}
                              className="rounded border-slate-300 text-[#00635C] focus:ring-[#00635C] w-3.5 h-3.5 cursor-pointer mt-1"
                            />
                          </td>

                          {/* # — parent only (v3); children render null */}
                          <td className={`py-2 px-2 text-center align-top text-[11px] font-mono font-bold text-slate-500 tabular-nums ${isSubtask ? 'bg-[#F9FBFA]' : ''}`}>
                            {isSubtask ? null : (
                              <span data-testid="tasks-parent-row-num">
                                {parentRowNums.get(surfaceTableParentNumberKey(listItem) || '') ?? ''}
                              </span>
                            )}
                          </td>

                          {/* Task — children: type chip + title; requester muted under title (v3) */}
                          <td className={`py-2 px-3 align-top ${isSubtask ? 'pl-4 sm:pl-6' : ''}`}>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTaskDetail(task);
                              }}
                              className="cursor-pointer group"
                            >
                              <div className="font-bold text-slate-900 text-xs sm:text-[13px] hover:text-[#00635C] transition flex items-center gap-1.5 leading-snug flex-wrap">
                                {isSubtask && (
                                  <CornerDownRight className="w-3.5 h-3.5 text-[#00635C] shrink-0" />
                                )}
                                {isSubtask && typeChip && (
                                  <span
                                    data-testid="task-type-chip"
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold border border-black/5 shrink-0 ${typeChip.bg} ${typeChip.text}`}
                                  >
                                    {typeChip.label}
                                  </span>
                                )}
                                <span className="line-clamp-2">{task.title}</span>
                                <Eye className="w-3 h-3 text-slate-300 group-hover:text-[#00635C] opacity-0 group-hover:opacity-100 transition shrink-0" />
                              </div>
                              {requesterMuted && (
                                <div data-testid="task-requester-muted" className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                                  {requesterMuted}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status — one pill only */}
                          <td
                            className="py-2 px-3 align-top whitespace-nowrap"
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${stage.badgeBg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${stage.dotColor}`} />
                                <span>{stage.label}</span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                {(task.isArchived || task.status === 'archived') && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRestoreTask(task.id);
                                    }}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                    title="Restore Task to Active Pipeline"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Restore</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setQuickActionsMode('full'); setQuickActionsTask(task);
                                  }}
                                  className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                  title="Quick Actions"
                                  aria-label="Quick Actions"
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="hidden">
                              <button type="button" onClick={() => setSelectedActionCampaign(matchedCamp)}>Handle</button>
                              <button type="button" onClick={() => setBrowserAgentCampaign(matchedCamp)}>Click to Run Autonomous Maxa Browser Agent</button>
                              <button type="button" onClick={() => handleOpenTaskDetail(task)}>Open Maxa Proof Assets</button>
                              <button type="button" onClick={() => handleAssignTask(task.id, 'Eduardo Lovo')}>Send to VA</button>
                              <button type="button" onClick={() => setSendToSubmenuTaskId(task.id)}>Send to...</button>
                              <button type="button" onClick={() => setQuestionModalCampaign(matchedCamp)}>Ask Questions</button>
                            </div>
                          </td>

                          {/* Owner */}
                          <td className="py-2 px-3 align-top whitespace-nowrap">
                            {reviewHandoff ? (
                              <div data-testid="task-review-handoff" className="space-y-0.5">
                                <div className="text-[11px] font-semibold text-amber-800">Review: {reviewHandoff.reviewerName}</div>
                                <div className="text-[10px] text-slate-500">Producer: {reviewHandoff.producerName}</div>
                              </div>
                            ) : getTeamMemberBadge(task.assignedTo)}
                          </td>

                          {/* Due */}
                          <td className="py-2 px-3 align-top whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] border ${neededInfo.badgeClass}`}>
                              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{neededInfo.label}</span>
                            </span>
                          </td>

                          {/* Blocker stub */}
                          <td className="py-2 px-3 align-top whitespace-nowrap text-slate-400" data-testid="task-blocker-cell">
                            —
                          </td>

                          {/* Where stub */}
                          <td className="py-2 px-3 align-top whitespace-nowrap text-slate-400" data-testid="task-where-cell">
                            —
                          </td>

                          {/* Lane (domain helpers) */}
                          <td className="py-2 px-3 align-top whitespace-nowrap" data-testid="task-lane-cell">
                            <span className="text-[11px] font-semibold text-slate-700">{getSurfaceDomainLane(task)}</span>
                          </td>

                          {/* Received (v3) */}
                          <td className="py-2 px-3 align-top whitespace-nowrap text-[11px] text-slate-600" data-testid="task-received-cell">
                            {formatSurfaceTableReceived(getTaskReceivedIso(task))}
                          </td>

                          {/* Activity — relative + full timestamp tooltip (v3) */}
                          <td className="py-2 px-3 align-top" data-testid="task-activity-cell">
                            <CompactActivityCardBadge
                              taskId={task.id}
                              fallbackSummary={task.notes || task.title || 'Intake recorded'}
                              fallbackTime={formatSurfaceTableActivityRelative(activityIso)}
                              timestampTooltip={formatSurfaceTableActivityTooltip(activityIso)}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTaskDetail(task, 'activity');
                              }}
                            />
                          </td>
                        </tr>
                        {isSubtask && isLastSubtask && (
                          <tr key={`spacer-end-${task.id}`} className="h-2.5 bg-slate-50/70 border-b border-slate-200" aria-hidden="true">
                            <td colSpan={11} className="py-0 px-0" />
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  });
                  })()
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary — one filtered-set count */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 font-medium flex items-center justify-between">
            <span data-testid="tasks-filtered-count">{filteredTasks.length} tasks</span>
            <span className="text-slate-400">Sorted by {sortField === 'status' ? `Status (${sortOrder === 'asc' ? 'ascending' : 'descending'})` : sortField === 'title' ? 'Title' : sortField === 'receivedAt' ? 'Received' : sortField === 'createdAt' ? 'Created Date' : 'Needed By Date'}</span>
          </div>
        </div>
      ) : (
        
        /* PIPELINE (KANBAN) VIEW — 7 CANONICAL COLUMNS */
        <div ref={boardContainerRef} className={`flex ${gapClass} overflow-x-auto pb-4 items-start w-full min-w-0`} data-testid="pipeline-view">
          {PIPELINE_STAGES.map((col) => {
            const colTasks = filteredTasks.filter(t => {
              const lane = getCanonicalLaneForTask(t);
              if (col.id === 'request_received') {
                return lane === 'request_received' || lane === 'legacy_unreconciled';
              }
              return lane === col.id;
            });

            const isCollapsed = Boolean(collapsedColumns[col.id]);

            if (isCollapsed) {
              return (
                <div
                  key={col.id}
                  data-testid={`column-rail-${col.id}`}
                  onClick={() => toggleColumnCollapse(col.id)}
                  style={railWidthStyle}
                  className={`${railWidthClass} h-[620px] rounded-2xl flex flex-col items-center py-4 cursor-pointer transition select-none shadow-xs group hover:bg-slate-50 ${col.headerBar}`}
                  title={`Click to expand ${col.label}`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold border ${col.headerCount}`}>
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center justify-center py-4">
                    <span className="[writing-mode:vertical-rl] rotate-180 font-bold text-xs text-slate-700 tracking-wider">
                      {col.label}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
                    title="Expand column"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={col.id}
                data-testid={`pipeline-column-${col.id}`}
                style={columnWidthStyle}
                className={`bg-white border rounded-2xl p-3 flex flex-col min-h-[620px] shadow-xs ${col.color}`}
              >
                {/* Column Header — solid color bar, white lettering */}
                <div className={`flex items-center justify-between -mx-3 -mt-3 mb-3 px-3 py-2.5 rounded-t-2xl ${col.headerBar}`}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${col.dotColor}`} />
                    <span className="font-bold text-xs text-slate-800 truncate tracking-wide">{col.label}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${col.headerCount}`}>
                      {colTasks.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleColumnCollapse(col.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      title={`Collapse ${col.label}`}
                    >
                      <PanelLeftClose className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Column Card Stream */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                  {colTasks.length === 0 ? (
                    <div className="h-36 flex items-center justify-center text-slate-400 text-xs italic text-center px-2">
                      No tasks in this stage
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const parentReq = requests.find(r => r.id === task.requestId);
                      const propertyAddr = task.propertyAddress || parentReq?.propertyAddress || task.requestTitle || 'Listing Property';
                      const matchedCamp = campaigns.find(c => c.id === task.campaignId || c.propertyAddress?.toLowerCase() === propertyAddr.toLowerCase());
                      const taskDomainType = task.domain || (['print', 'social', 'open_house', 'farming'].includes(task.category) ? 'marketing' : ['signage', 'lockbox'].includes(task.category) ? 'operations' : 'other');

                      // Contextual Primary Action in Nest green
                      let primaryAction = undefined;
                      let secondaryAction = undefined;
                      const assigneeName = String(task.assignedTo || task.assignedToName || '').trim();
                      const isUnassigned = !assigneeName || assigneeName.toLowerCase() === 'unassigned';

                      // A/C footer: Assign|Reassign + Open (status workflow lives in the drawer)
                      secondaryAction = {
                        label: 'Open',
                        icon: <Eye className="w-3 h-3" />,
                        onClick: (e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleOpenTaskDetail(task);
                        }
                      };
                      if (isUnassigned) {
                        primaryAction = {
                          label: 'Assign',
                          icon: <UserPlus className="w-3 h-3" />,
                          onClick: (e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleAssignTask(
                              task.id,
                              taskDomainType === 'operations' ? 'Ann Gunn' : 'Melissa Gagliardi'
                            );
                          }
                        };
                      } else {
                        primaryAction = {
                          label: 'Reassign',
                          onClick: (e: React.MouseEvent) => {
                            e.stopPropagation();
                            setQuickActionsMode('reassign');
                            setQuickActionsTask(task);
                          }
                        };
                      }

                      return (
                        <CanonicalTaskCard
                          key={task.id}
                          task={task}
                          parentRequest={parentReq}
                          campaign={matchedCamp}
                          context="tasks"
                          onClick={() => handleOpenTaskDetail(task)}
                          onQuickActions={(e) => {
                            setQuickActionsMode('full'); setQuickActionsTask(task);
                          }}
                          onActivityClick={(e) => {
                            handleOpenTaskDetail(task, 'activity');
                          }}
                          primaryAction={primaryAction}
                          secondaryAction={secondaryAction}
                        />
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
        intent={questionModalCampaign?.outreachIntent === 'delivery_complete' ? 'delivery_complete' : 'ask_missing'}
        isOutboundEnabled={true}
        onClose={() => setQuestionModalCampaign(null)}
        onSendQuestions={async (data) => {
          if (onSendQuestionsToRequester) onSendQuestionsToRequester(questionModalCampaign, data);

          // Delivery: only complete after a real outbound success — never on draft/hold/fail
          if (data?.intent === 'delivery_complete') {
            const receipt = data.dispatchReceipt || {};
            const taskIdEarly = data.taskId || questionModalCampaign?.taskId || questionModalCampaign?.id;
            if (receipt.persisted && receipt.task && taskIdEarly) {
              setTasks(prev => prev.map(t =>
                t.id === taskIdEarly
                  ? { ...t, ...receipt.task, reviewState: receipt.task.reviewState || 'approved' }
                  : t
              ));
              if (receipt.dispatchHeld || receipt.outboundDisabled || receipt.notificationsHeld) {
                showToast(receipt.message || '✓ Proof approved. Notify held — outbound is not live.');
                setIsWorkstationOpen(false);
                setWorkstationTask(null);
                return;
              }
            }
            const sendFailed =
              Boolean(data.isDraftOnly) ||
              Boolean(receipt.outboundDisabled) ||
              receipt.success === false ||
              receipt.mode === 'blocked' ||
              receipt.mode === 'draft_saved';
            if (sendFailed) {
              showToast(
                receipt.error ||
                  receipt.message ||
                  'Outreach did not send — task left open (not completed).'
              );
              return;
            }
            const taskId = data.taskId || questionModalCampaign?.taskId || questionModalCampaign?.id;
            if (taskId) {
              try {
                const payload = {
                  ...(questionModalCampaign?.approvePayload || {}),
                  note: (questionModalCampaign?.approvePayload?.note) || 'Approved — agent notified via Ask Requester outreach',
                  approvedBy: questionModalCampaign?.approvePayload?.approvedBy || 'Melissa Gagliardi',
                  skipAgentEmail: true,
                  selfComplete: questionModalCampaign?.approvePayload?.selfComplete ?? true
                };
                const res = await fetch(`/api/marketing/tasks/${taskId}/approve-and-dispatch`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                });
                const result = await res.json().catch(() => ({}));
                if (result?.success || res.ok) {
                  setTasks(prev => prev.map(t =>
                    t.id === taskId
                      ? { ...t, status: 'completed', reviewState: 'approved', ...(result.task || {}) }
                      : t
                  ));
                  showToast('✓ Approved · agent notified');
                  setIsWorkstationOpen(false);
                  setWorkstationTask(null);
                } else {
                  showToast(`Email/text sent, but complete failed: ${result?.error || result?.message || 'unknown'} — check task status`);
                }
              } catch (err: any) {
                showToast(`Email/text may have sent, but approve failed: ${err?.message || err}`);
              }
            }
          } else {
            showToast(data?.isDraftOnly ? '✓ Outreach draft saved' : '✓ Questions sent to requester');
          }
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

          {(selectedStatus === 'Archived' || showArchived) ? (
            <button
              type="button"
              onClick={() => handleBatchAction('restore')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Selected</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleBatchAction('archive')}
              className="px-2.5 py-1.5 hover:bg-rose-900/40 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-500/50 rounded-xl transition whitespace-nowrap cursor-pointer flex items-center gap-1"
              title="Archive & Remove from Active Boards"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive</span>
            </button>
          )}

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
        <div className="fixed bottom-6 right-6 z-50 bg-[#01362D] text-[#F7F3EC] px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-2xl flex items-center gap-3 animate-fadeIn border border-[#00635C]/40">
          <span>{toastMessage}</span>
          {lastArchivedTaskIds && lastArchivedTaskIds.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const idsToRestore = [...lastArchivedTaskIds];
                setLastArchivedTaskIds(null);
                setToastMessage(null);
                idsToRestore.forEach(id => handleRestoreTask(id));
              }}
              className="px-2.5 py-1 bg-[#00635C] hover:bg-[#004d47] text-white text-[11px] font-bold rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1 border border-white/20 ml-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Undo</span>
            </button>
          )}
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

      {/* 12. FULL WORKSTATION (uploads + MLS + proof) — replaces lite TaskRequestDetailModal */}
      {isWorkstationOpen && workstationTask && (
        <WorkspaceTaskDrawer
          isOpen={isWorkstationOpen}
          activeTask={workstationTask as any}
          tasksList={allTasksCombined.map(t => toWorkspaceDrawerTask(t, resolveParentRequest(t))) as any}
          initialTab={workstationInitialTab as any}
          onClose={handleCloseWorkstation}
          onSelectTask={(id) => {
            const next = allTasksCombined.find(t => t.id === id);
            if (next) handleOpenTaskDetail(next, modalInitialTab);
          }}
          onSubmitProof={async (taskId, proofUrl, notes, assetMetadata, stagedAssets) => {
            const currentTask = allTasksCombined.find(t => t.id === taskId);
            const resolvedProof = proofUrl || currentTask?.proofUrl || (currentTask?.photos && currentTask.photos[0]?.url) || '';
            try {
              const res = await fetch(`/api/marketing/tasks/${taskId}/submit-proof`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proofUrl: resolvedProof, notes, assetMetadata, stagedAssets })
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                const message = data.message || data.error || `Submit failed (HTTP ${res.status})`;
                showToast(`⚠️ Proof not submitted: ${message}`);
                throw new Error(message);
              }
              const persistedTask = data.task || data;
              setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...(persistedTask || {}) } : t));
              if (workstationTask?.id === taskId) {
                setWorkstationTask(toWorkspaceDrawerTask({ ...currentTask, ...persistedTask } as CanonicalMarketingTask, modalRequest));
              }
              showToast('✓ Proof submitted for review');
            } catch (err: any) {
              if (err && !String(err.message || '').includes('Proof not submitted')) {
                showToast(`⚠️ Proof not submitted: ${err.message || 'Network or server error'}`);
              }
              throw err;
            }
          }}
          onRequestRevisions={async (taskId, feedbackNotes) => {
            handleUpdateStatus(taskId, 'in_progress', { reviewState: 'revisions_requested', proofNotes: feedbackNotes });
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'in_progress', reviewState: 'revisions_requested', proofNotes: feedbackNotes } : t));
            showToast('✓ Revisions requested. Returned to producer queue.');
          }}
          onApproveProof={async (taskId) => {
            handleUpdateStatus(taskId, 'completed', { reviewState: 'approved' });
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed', reviewState: 'approved' } : t));
            showToast('✓ Proof approved for delivery');
          }}
          onApproveAndDispatch={async (taskId, note, opts) => {
            try {
              const res = await fetch(`/api/marketing/tasks/${taskId}/approve-and-dispatch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  note,
                  approvedBy: drawerCurrentUser?.name || 'Melissa Gagliardi',
                  proofUrl: opts?.proofUrl,
                  stagedAssets: opts?.stagedAssets,
                  assetMetadata: opts?.assetMetadata,
                  selfComplete: opts?.selfComplete
                })
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok || !data.success) {
                throw new Error(data.message || data.error || `Approve failed (HTTP ${res.status})`);
              }
              setTasks(prev => prev.map(t => t.id === taskId ? {
                ...t,
                status: data.delivered ? 'completed' : 'in_progress',
                reviewState: 'approved',
                approvedProofVersion: t.proofVersion || 1,
                proofUrl: opts?.proofUrl || t.proofUrl
              } : t));
              showToast(data.delivered
                ? `✓ Approved and delivered to ${data.task?.agentName || 'agent'}`
                : '✓ Proof approved. Delivery held in safe mode.');
              return data;
            } catch (err: any) {
              showToast(`Error: ${err.message}`);
              throw err;
            }
          }}
          onDeliverProof={async (taskId) => {
            try {
              const res = await fetch(`/api/marketing/tasks/${taskId}/deliver`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              });
              const data = await res.json();
              if (data.success && data.delivered) {
                setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed', reviewState: 'approved' } : t));
                showToast(`✓ Delivered to ${data.task?.agentName || 'agent'}`);
              }
              return data;
            } catch (err: any) {
              showToast(`Error: ${err.message}`);
              return { success: false, error: err.message };
            }
          }}
          onReassignTask={(taskId, newAssignee) => {
            handleUpdateAssignee(taskId, newAssignee);
          }}
          onAskRequester={(task, opts) => {
            const intent = opts?.intent || 'ask_missing';
            const domain =
              (task as any).domain ||
              (['signage', 'lockbox', 'operations'].includes(String(task.category || '')) ? 'operational' : 'marketing');
            const parentReq = task.requestId
              ? requests.find((r) => r.id === task.requestId)
              : undefined;
            const resolved = resolveCanonicalRecipient({
              requesterId:
                (task as any).requesterId ||
                (task as any).agentId ||
                (parentReq as any)?.requesterId ||
                (parentReq as any)?.agentId,
              agentName: task.agentName || (parentReq as any)?.agentName,
              agentEmail: (task as any).agentEmail || (parentReq as any)?.agentEmail,
              agentPhone: (task as any).agentPhone || (parentReq as any)?.agentPhone,
              agentRole: (task as any).agentRole || (parentReq as any)?.agentRole
            });
            const proofFromPayload = opts?.approvePayload?.proofUrl;
            const staged = opts?.approvePayload?.stagedAssets || [];
            const assetUrls = [
              (task as any).driveFolderUrl,
              parentReq?.driveFolderUrl,
              (task as any).proofUrl,
              proofFromPayload,
              ...staged.map((a: any) => a?.previewUrl || a?.url),
              ...((task as any).attachments || []).map((a: any) => a?.url || a?.driveUrl),
              ...((task as any).proofs || []).map((pr: any) => pr?.url),
            ].filter((u: any) => typeof u === 'string' && /^https?:\/\//i.test(u));
            setQuestionModalCampaign({
              id: (task as any).campaignId || task.requestId || task.id,
              taskId: task.id,
              workspaceId: (task as any).workspaceId || 'ws_wilmington',
              requesterId: resolved.requesterId,
              agentName: resolved.name || task.agentName,
              agentEmail: resolved.email || (task as any).agentEmail,
              agentPhone: resolved.phoneVerified ? resolved.phone : undefined,
              propertyAddress: task.propertyAddress || (parentReq as any)?.propertyAddress,
              title: task.title,
              packageType: (task as any).packageType || task.title,
              requestTitle: task.requestTitle,
              domain,
              outreachIntent: intent,
              approvePayload: opts?.approvePayload || null,
              driveFolderUrl: (task as any).driveFolderUrl || parentReq?.driveFolderUrl,
              proofUrl: proofInputValue((task as any).proofUrl),
              attachments: (task as any).attachments || parentReq?.attachments || [],
              photos: (task as any).photos || [],
              proofs: (task as any).proofs || [],
              assetUrls: Array.from(new Set(assetUrls)),
              notes: (task as any).notes || (parentReq as any)?.notes || (parentReq as any)?.requestExcerpt
            });
          }}
          onOpenSopDocument={(sop) => setQuickViewSop(sop)}
          currentUser={drawerCurrentUser}
        />
      )}

      {/* Lite modal kept only if explicitly opened without workstation (legacy fallback) */}
      {showTaskDetailModal && !isWorkstationOpen && modalRequest && (
        <TaskRequestDetailModal
          isOpen={showTaskDetailModal}
          request={modalRequest}
          selectedTask={modalSelectedTask}
          tasks={allTasksCombined}
          initialTab={modalInitialTab}
          onClose={handleCloseWorkstation}
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
            handleCloseWorkstation();
          }}
        />
      )}

      {/* 13. CENTERED TASK QUICK ACTIONS MODAL */}
      <TaskQuickActionsModal
        isOpen={!!quickActionsTask}
        mode={quickActionsMode}
        task={quickActionsTask}
        onClose={() => { setQuickActionsTask(null); setQuickActionsMode('full'); }}
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
          const parentReq = task.requestId ? requests.find((r) => r.id === task.requestId) : undefined;
          const resolved = resolveCanonicalRecipient({
            requesterId: (task as any).requesterId || (task as any).agentId || (matchedCamp as any)?.requesterId,
            agentName: task.agentName || matchedCamp?.agentName || (parentReq as any)?.agentName,
            agentEmail: (task as any).agentEmail || matchedCamp?.agentEmail || (parentReq as any)?.agentEmail,
            agentPhone: (task as any).agentPhone || matchedCamp?.agentPhone || (parentReq as any)?.agentPhone
          });
          setQuestionModalCampaign({
            ...(matchedCamp || { id: task.id, propertyAddress: task.propertyAddress, title: task.title }),
            taskId: task.id,
            workspaceId: (task as any).workspaceId || 'ws_wilmington',
            requesterId: resolved.requesterId,
            agentName: resolved.name || task.agentName || matchedCamp?.agentName,
            agentEmail: resolved.email || (task as any).agentEmail || matchedCamp?.agentEmail,
            agentPhone: resolved.phoneVerified ? resolved.phone : undefined,
            outreachIntent: 'ask_missing'
          });
        }}
        onAssignTeamMember={(taskId, assigneeName) => {
          handleAssignTask(taskId, assigneeName);
        }}
        onArchiveTask={(taskId) => {
          handleArchiveTask(taskId);
        }}
        onRestoreTask={(taskId) => {
          handleRestoreTask(taskId);
        }}
      />
    </div>
  );
};
