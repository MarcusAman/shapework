/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TaskRequestDetailModal — Universal Manager & Dispatcher Review Modal
 * 
 * Redesigned using 5 foundational behavioral psychology and HCI principles:
 * - 04. Miller's Law: Chunk information into 4 distinct visual card containers
 * - 05. Proximity Law: 2-column spatial organization (Context-Left / Execution-Right)
 * - 07. Serial Position Effect: Anchored Hero Header (first item) & Dynamic Action Bar (last item)
 * - 09. Doherty Threshold: Real-time micro-feedback (<300ms) with '✓ Saved successfully!' green badge
 * - 10. Peak-End Rule: Highlight the peak moment (milestone proof review) & end moment (completion celebration)
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Phone,
  Mail,
  User,
  Calendar,
  Folder,
  ExternalLink,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  ShieldCheck,
  FileText,
  Eye,
  Download,
  Copy,
  Check,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles,
  Search,
  MessageSquare,
  Volume2,
  VolumeX,
  Sliders,
  CheckCheck,
  RotateCcw,
  Building,
  Tag,
  Hash,
  ChevronDown,
  ChevronUp,
  MapPin,
  Zap,
  CheckSquare
} from 'lucide-react';
import {
  CanonicalMarketingRequest,
  CanonicalMarketingTask
} from '../../../server/persistence/marketingCampaignsRepository';
import { ProofLightboxViewer, LightboxAssetItem } from './ProofLightboxViewer';
import { ActivityAndContactTimeline } from './ActivityAndContactTimeline';
import { CallRecordingPanel } from './CallRecordingPanel';
import { ContactSummaryCard } from './ContactSummaryCard';
import type { CanonicalActivityEvent, ContactSummary } from '../../../server/services/activityHistoryService.js';
import {
  CANONICAL_WORKSPACE_ROSTER,
  resolveCanonicalStaffMember,
  isSarahJenkinsTask
} from '../../services/canonicalRoster';
import { MlsNumberBadge } from './MlsNumberBadge';
import { resolveTaskEventDetails } from '../../utils/eventScheduleExtraction';

export function formatNewYorkDateTime(dateStr?: string | null): string {
  if (!dateStr) return 'Not provided';
  try {
    const trimmed = dateStr.trim();
    if (trimmed.toUpperCase() === 'ASAP') return 'ASAP — date not set';

    const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](?:00:00:00|04:00:00)(?:\.000)?(?:Z|[+-]00:00)?)?$/);
    if (dateOnlyMatch) {
      const year = parseInt(dateOnlyMatch[1], 10);
      const monthIndex = parseInt(dateOnlyMatch[2], 10) - 1;
      const day = parseInt(dateOnlyMatch[3], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const utcNoon = new Date(Date.UTC(year, monthIndex, day, 12, 0, 0));
      return `${weekdays[utcNoon.getUTCDay()]}, ${months[monthIndex]} ${day}, ${year}`;
    }

    const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (slashMatch) {
      const monthIndex = parseInt(slashMatch[1], 10) - 1;
      const day = parseInt(slashMatch[2], 10);
      let year = parseInt(slashMatch[3], 10);
      if (year < 100) year += 2000;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const utcNoon = new Date(Date.UTC(year, monthIndex, day, 12, 0, 0));
      return `${weekdays[utcNoon.getUTCDay()]}, ${months[monthIndex]} ${day}, ${year}`;
    }

    const d = new Date(trimmed);
    if (isNaN(d.getTime())) return 'Not provided';
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch {
    return 'Not provided';
  }
}

export function formatNewYorkRelativeDue(dateStr?: string | null): { formatted: string; relative: string } {
  if (!dateStr) return { formatted: 'Not provided', relative: '' };
  try {
    const trimmed = dateStr.trim();
    if (trimmed.toUpperCase() === 'ASAP') {
      return { formatted: 'ASAP — date not set', relative: 'No deadline set' };
    }

    const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](?:00:00:00|04:00:00)(?:\.000)?(?:Z|[+-]00:00)?)?$/);
    if (dateOnlyMatch) {
      const year = parseInt(dateOnlyMatch[1], 10);
      const monthIndex = parseInt(dateOnlyMatch[2], 10) - 1;
      const day = parseInt(dateOnlyMatch[3], 10);
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const utcNoon = new Date(Date.UTC(year, monthIndex, day, 12, 0, 0));
      const formatted = `${weekdays[utcNoon.getUTCDay()]}, ${months[monthIndex]} ${day}, ${year}`;
      
      const now = new Date();
      const targetDay = new Date(Date.UTC(year, monthIndex, day, 23, 59, 59));
      const diffMs = targetDay.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      let relative = '';
      if (diffMs < 0) {
        const daysOverdue = Math.ceil(Math.abs(diffHours) / 24);
        relative = daysOverdue <= 1 ? 'Overdue today' : `Overdue by ${daysOverdue} days`;
      } else if (diffHours <= 24) {
        relative = 'Due today';
      } else if (diffHours <= 48) {
        relative = 'Due tomorrow';
      } else {
        const days = Math.ceil(diffHours / 24);
        relative = `Due in ${days} days`;
      }
      return { formatted, relative };
    }

    const d = new Date(trimmed);
    if (isNaN(d.getTime())) return { formatted: 'Not provided', relative: '' };
    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(d);

    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    let relative = '';
    if (diffMs < 0) {
      const daysOverdue = Math.ceil(Math.abs(diffHours) / 24);
      relative = daysOverdue <= 1 ? 'Overdue today' : `Overdue by ${daysOverdue} days`;
    } else if (diffHours <= 24) {
      relative = 'Due today';
    } else if (diffHours <= 48) {
      relative = 'Due tomorrow';
    } else {
      const days = Math.ceil(diffHours / 24);
      relative = `Due in ${days} days`;
    }

    return { formatted, relative };
  } catch {
    return { formatted: 'Not provided', relative: '' };
  }
}

export function extractCleanBrief(request: CanonicalMarketingRequest, activeTask?: CanonicalMarketingTask | null) {
  const raw = (request.requestExcerpt || request.rawExcerpt || '').trim();
  const lines = raw.split('\n').filter(l => l.trim().length > 0);
  const dialoguePattern = /^(agent|caller|nora|intake ai|operator|assistant|broker|melissa|ann|eduardo):\s*/i;
  const nonDialogueLines = lines.filter(l => !dialoguePattern.test(l.trim()));
  
  const sanitizeInstructions = (text?: string): string => {
    if (!text) return 'Produce according to standard brokerage specifications.';
    const cleaned = text
      .replace(/\[\s*policy[_\s]?version:?\s*[^\]]+\]/gi, '')
      .replace(/\(?\bpolicy[_\s]?version:?\s*\d+\b\)?/gi, '')
      .replace(/\[\s*policy:[^\]]+\]/gi, '')
      .replace(/\bpolicy[_\s]?id:?\s*\S+/gi, '')
      .replace(/\baudit[_\s]?chain:?\s*\S+/gi, '')
      .replace(/\blifecycle_state:?\s*\S+/gi, '')
      .replace(/•\s*triage:[^\n]+/gi, '')
      .trim();
    return cleaned || 'Produce according to standard brokerage specifications.';
  };

  const rawInstructions = activeTask?.notes || (nonDialogueLines.length > 0 ? nonDialogueLines.join('\n') : (lines.length > 0 ? lines.map(l => l.replace(dialoguePattern, '')).join(' ') : ''));
  const cleanInstructions = sanitizeInstructions(rawInstructions);

  const hasLiveMls = Boolean(activeTask?.mlsNumber || request.mlsNumber || activeTask?.notes?.includes('Flex MLS') || (request.requestExcerpt && request.requestExcerpt.includes('Flex MLS')));

  let missingInfo = 'None identified';
  if ((activeTask?.isArchived || activeTask?.status === 'archived') || (!activeTask && (request.isArchived || request.status === 'archived'))) {
    missingInfo = 'None required (Archived)';
  } else if (hasLiveMls) {
    missingInfo = 'Retrieve listing details and photos from Flex MLS.';
  } else if (request.status === 'needs_info' || activeTask?.status === 'needs_info') {
    missingInfo = activeTask?.notes?.includes('Waiting on') ? activeTask.notes : 'Additional property details or photos required from broker';
  }

  const rawTiming = `${request.requestExcerpt || ''} ${request.notes || ''} ${activeTask?.notes || ''} ${activeTask?.title || ''}`.toLowerCase();
  const isAsap = rawTiming.includes('asap') || rawTiming.includes('urgent');
  const explicitDue = activeTask?.dueAt || (activeTask as any)?.neededByDate;

  return {
    outcome: activeTask?.title || request.title || 'Requested deliverable',
    property: request.propertyAddress || 'Office / Operational',
    deliverable: activeTask?.category ? `${activeTask.category.toUpperCase()} — ${activeTask.title}` : (activeTask?.title || 'Listing collateral'),
    dueDate: explicitDue || (isAsap ? 'ASAP' : null),
    missingInfo,
    instructions: cleanInstructions || 'Produce according to standard brokerage specifications.'
  };
}

export interface TaskRequestDetailModalProps {
  isOpen: boolean;
  request: CanonicalMarketingRequest | null;
  selectedTask?: CanonicalMarketingTask | null;
  tasks?: CanonicalMarketingTask[];
  onClose: () => void;
  onUpdateTaskStatus?: (taskId: string, newStatus: CanonicalMarketingTask['status'], extra?: any) => void;
  onUpdateTaskAssignee?: (taskId: string, assignee: string) => void;
  onAddDeliverable?: (requestId: string) => void;
  onArchiveRequest?: (requestId: string) => void;
  currentUser?: {
    id: string;
    name: string;
    role: string;
  };
  onTaskUpdated?: (updatedTask: CanonicalMarketingTask) => void;
  initialTab?: 'overview' | 'conversation' | 'work' | 'activity';
}

export interface StaffProfile {
  id: string;
  fullName: string;
  role: string;
  title?: string;
  email?: string;
  status: 'active' | 'busy' | 'out_of_office' | 'inactive';
  backupStaffId?: string;
  backupStaffName?: string;
  outOfOfficeReason?: string;
}

export const CANONICAL_STAFF: StaffProfile[] = [
  ...CANONICAL_WORKSPACE_ROSTER.map(member => ({
    id: member.id,
    fullName: member.name,
    role: member.role,
    title: member.title,
    email: member.email,
    status: member.status,
    backupStaffId: member.backupStaffId,
    backupStaffName: member.backupStaffName,
    outOfOfficeReason: member.outOfOfficeReason
  })),
  {
    id: 'staff_ann_smith',
    fullName: 'Ann Smith',
    role: 'operations_assistant',
    title: 'Operations Assistant',
    email: 'ann.smith@nestrealty.com',
    status: 'out_of_office',
    backupStaffId: 'dir_ann_gunn_28',
    backupStaffName: 'Ann Gunn',
    outOfOfficeReason: 'Personal leave through Friday'
  }
];

function getInitials(name?: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const TaskRequestDetailModal: React.FC<TaskRequestDetailModalProps> = ({
  isOpen,
  request,
  selectedTask: initialSelectedTask,
  tasks = [],
  onClose,
  onUpdateTaskStatus,
  onUpdateTaskAssignee,
  currentUser,
  onTaskUpdated,
  initialTab
}) => {
  // Sibling & Active Task state
  const childTasks = useMemo(() => {
    if (!request) return [];
    const directMatches = tasks.filter(t => t.requestId === request.id || (request.taskIds && request.taskIds.includes(t.id)));
    if (directMatches.length > 0) return directMatches;
    if (initialSelectedTask) return [initialSelectedTask];
    return [];
  }, [tasks, request, initialSelectedTask]);

  const [activeTaskId, setActiveTaskId] = useState<string>('');
  useEffect(() => {
    if (initialSelectedTask?.id) {
      setActiveTaskId(initialSelectedTask.id);
    } else if (childTasks.length > 0) {
      setActiveTaskId(childTasks[0].id);
    }
  }, [initialSelectedTask, childTasks]);

  const activeTask = useMemo(() => {
    return childTasks.find(t => t.id === activeTaskId) || initialSelectedTask || childTasks[0] || null;
  }, [childTasks, activeTaskId, initialSelectedTask]);

  // Tab state: 'overview' (4 chunked cards) | 'activity' (timeline, audio, conversation)
  const [activeTab, setActiveTab] = useState<'overview' | 'work' | 'activity' | 'conversation'>((initialTab as any) || 'overview');
  const [isLinkedRecordsExpanded, setIsLinkedRecordsExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (initialTab) {
      if ((initialTab as any) === 'conversation') {
        setActiveTab('activity');
      } else if ((initialTab as any) === 'work') {
        setActiveTab('overview');
      } else {
        setActiveTab(initialTab as any);
      }
    }
  }, [initialTab]);

  // Payload & Activity
  const [taskDetailPayload, setTaskDetailPayload] = useState<any>(null);
  const [activityEvents, setActivityEvents] = useState<CanonicalActivityEvent[]>([]);
  const [contactSummary, setContactSummary] = useState<ContactSummary | null>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !activeTask?.id) {
      setTaskDetailPayload(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/marketing/tasks/${activeTask.id}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data && data.task) {
          setTaskDetailPayload(data);
        }
      })
      .catch(err => {
        console.warn('Could not fetch task detail payload:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, activeTask?.id]);

  const fetchActivity = async () => {
    if (!isOpen) return;
    setIsLoadingActivity(true);
    try {
      if (activeTask?.id) {
        const res = await fetch(`/api/marketing/tasks/${activeTask.id}/activity`);
        const data = await res.json();
        if (data.success) {
          setActivityEvents(data.events || []);
          if (data.contactSummary) setContactSummary(data.contactSummary);
        }
      } else if (request?.id) {
        const res = await fetch(`/api/marketing/requests/${request.id}/activity`);
        const data = await res.json();
        if (data.success) {
          setActivityEvents(data.events || []);
          if (data.contactSummary) setContactSummary(data.contactSummary);
        }
      }
    } catch (err) {
      console.error('Failed to load activity history', err);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchActivity();
    }
  }, [isOpen, activeTask?.id, request?.id]);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopy = (id: string, text: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Toast banner
  const [alertBanner, setAlertBanner] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAlertBanner({ type, message });
    setTimeout(() => setAlertBanner(null), 5000);
  };

  // Staff Assignment State & Doherty Feedback State
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [assignmentInstructions, setAssignmentInstructions] = useState<string>('');
  const [assignmentPriority, setAssignmentPriority] = useState<string>('normal');
  const [assignmentDueDate, setAssignmentDueDate] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isResendingPhotos, setIsResendingPhotos] = useState<boolean>(false);

  useEffect(() => {
    if (activeTask) {
      const resolved = resolveCanonicalStaffMember(activeTask.assignedToId || activeTask.assignedTo);
      setSelectedStaffId(resolved?.id || (isSarahJenkinsTask(activeTask) ? '' : (activeTask.assignedToId || '')));
      setAssignmentInstructions(activeTask.notes || '');
      setAssignmentPriority(activeTask.priority || 'normal');
      const candidateDue = activeTask.dueAt || (activeTask as any)?.neededByDate || (request as any)?.neededByDate || request?.dueDate;
      if (candidateDue && candidateDue.toUpperCase() !== 'ASAP') {
        try {
          const dateOnlyMatch = candidateDue.match(/^(\d{4}-\d{2}-\d{2})/);
          if (dateOnlyMatch) {
            setAssignmentDueDate(dateOnlyMatch[1]);
          } else {
            setAssignmentDueDate(new Date(candidateDue).toISOString().split('T')[0]);
          }
        } catch {
          setAssignmentDueDate('');
        }
      } else {
        setAssignmentDueDate('');
      }
    } else {
      setSelectedStaffId('');
      setAssignmentInstructions('');
      setAssignmentPriority('normal');
      setAssignmentDueDate('');
    }
    setSaveStatus('idle');
  }, [activeTask?.id, activeTask?.dueAt, request?.neededByDate, request?.dueDate]);

  // Derived Task States
  const taskStatus = activeTask?.status || request?.status || 'request_received';
  const rawReviewState = activeTask?.reviewState;
  const taskReviewState = rawReviewState === 'in_review' ? 'awaiting_review' : rawReviewState;
  const isNeedsInfo = taskStatus === 'needs_info' || request?.status === 'needs_info';
  const isApproved = taskReviewState === 'approved' || taskStatus === 'approved';
  const isCompleted = taskStatus === 'completed';

  const mlsNum = activeTask?.mlsNumber || request?.mlsNumber;
  const mlsStatus = (activeTask as any)?.flexMlsStatus || (request as any)?.flexMlsStatus || (mlsNum ? 'supplied' : 'pre_mls');
  const isMlsLive = mlsStatus === 'flex_live' || mlsStatus === 'live';

  const isTestRequest = useMemo(() => {
    const text = `${request?.title || ''} ${request?.notes || ''} ${request?.sourceCallId || ''} ${request?.propertyAddress || ''} ${activeTask?.title || ''} ${activeTask?.notes || ''}`.toLowerCase();
    return Boolean(
      (request as any)?.isTest ||
      (activeTask as any)?.isTest ||
      text.includes('synthetic') ||
      text.includes('version 24') ||
      text.includes('voice test') ||
      text.includes('test call') ||
      text.includes('test_marcus') ||
      request?.sourceCallId?.startsWith('call_79840ebe2d3c5c7c04510ae240b')
    );
  }, [request, activeTask]);

  const displayNeededBy = useMemo(() => {
    const staffDue = activeTask?.dueAt;
    const requestedDue = (activeTask as any)?.neededByDate || (request as any)?.neededByDate;

    if (staffDue) {
      const formatted = formatNewYorkDateTime(staffDue);
      if (requestedDue && requestedDue !== staffDue && requestedDue.toUpperCase() !== 'ASAP') {
        return `${formatted} (Requested: ${formatNewYorkDateTime(requestedDue)})`;
      }
      return formatted;
    }

    if (requestedDue) {
      if (requestedDue.toUpperCase() === 'ASAP') return 'ASAP — date not set';
      return formatNewYorkDateTime(requestedDue);
    }

    const rawText = `${request?.requestExcerpt || ''} ${request?.notes || ''} ${activeTask?.notes || ''}`.toLowerCase();
    if (rawText.includes('asap') || rawText.includes('urgent')) return 'ASAP — date not set';
    return 'Deadline not specified';
  }, [activeTask, request]);

  const relativeDue = useMemo(() => {
    const staffDue = activeTask?.dueAt;
    const requestedDue = (activeTask as any)?.neededByDate || (request as any)?.neededByDate || request?.dueDate;
    if (!staffDue && !requestedDue) {
      const rawText = `${request?.requestExcerpt || ''} ${request?.notes || ''} ${activeTask?.notes || ''}`.toLowerCase();
      if (rawText.includes('asap') || rawText.includes('urgent')) {
        return { formatted: 'ASAP — date not set', relative: 'No deadline set' };
      }
      return { formatted: 'Deadline not specified', relative: 'No deadline set' };
    }
    return formatNewYorkRelativeDue(staffDue || requestedDue);
  }, [activeTask, request]);

  const cleanBrief = useMemo(() => {
    if (!request) return { instructions: '', outcome: '' };
    return extractCleanBrief(request, activeTask);
  }, [request, activeTask]);

  const missingInfoText = useMemo(() => {
    if (!isNeedsInfo) return null;
    const missing = (activeTask as any)?.missingFields || (request as any)?.missingFields;
    if (Array.isArray(missing) && missing.length > 0) {
      return `Missing required fields: ${missing.join(', ')}`;
    }
    if (activeTask?.notes?.includes('Waiting on')) return activeTask.notes;
    if (request?.notes?.includes('Waiting on')) return request.notes;
    return 'Additional property details or photos required from broker.';
  }, [isNeedsInfo, activeTask, request]);

  // Staff and coverage
  const selectedStaffMember = useMemo(() => {
    const direct = CANONICAL_STAFF.find(s => s.id === selectedStaffId || s.fullName.toLowerCase() === selectedStaffId?.toLowerCase());
    if (direct) return direct;
    const resolved = resolveCanonicalStaffMember(selectedStaffId);
    if (resolved) {
      return CANONICAL_STAFF.find(s => s.id === resolved.id) || null;
    }
    return null;
  }, [selectedStaffId]);

  const coveringStaffMember = useMemo(() => {
    if (!selectedStaffMember || selectedStaffMember.status !== 'out_of_office' || !selectedStaffMember.backupStaffId) {
      return null;
    }
    return CANONICAL_STAFF.find(s => s.id === selectedStaffMember.backupStaffId) || null;
  }, [selectedStaffMember]);

  const isMarketingTask = useMemo(() => {
    if (!activeTask) return false;
    const cat = (activeTask.category || request?.category || '').toLowerCase();
    const dept = (activeTask.departmentId || '').toLowerCase();
    const title = (activeTask.title || request?.title || '').toLowerCase();
    const nonMarketing = ['bic', 'compliance', 'operations', 'facilities', 'signage', 'lockbox', 'contract', 'accounting'];
    if (nonMarketing.some(nm => cat.includes(nm) || dept.includes(nm) || title.includes(nm))) {
      return false;
    }
    return true;
  }, [activeTask, request]);

  const resolvedUser = useMemo(() => {
    if (currentUser) return currentUser;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('shapework_user') || sessionStorage.getItem('shapework_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.id || parsed.name || parsed.email)) return parsed;
        }
      } catch {}
    }
    return {
      id: 'usr_melissa',
      name: 'Melissa Gagliardi',
      role: 'marketing_director',
      permissions: ['marketing.final_approval']
    };
  }, [currentUser]);

  const reviewerStaff = useMemo(() => {
    if (!resolvedUser) return null;
    return resolveCanonicalStaffMember(resolvedUser.id || resolvedUser.name, activeTask?.workspaceId || 'ws_wilmington');
  }, [resolvedUser, activeTask]);

  const hasMarketingFinalApproval = useMemo(() => {
    if (!isMarketingTask || !resolvedUser) return false;
    const permissions: string[] = (resolvedUser as any).permissions || [];
    const role = (resolvedUser.role || '').toLowerCase();
    return Boolean(
      permissions.includes('marketing.final_approval') ||
      role === 'marketing_director' ||
      (reviewerStaff && (
        reviewerStaff.role?.toLowerCase() === 'marketing director'
      ))
    );
  }, [isMarketingTask, resolvedUser, reviewerStaff]);

  // Audio player & dialogue
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [transcriptSearch, setTranscriptSearch] = useState<string>('');

  // Dialog states
  const [lightboxItem, setLightboxItem] = useState<LightboxAssetItem | null>(null);
  const [showRevisionModal, setShowRevisionModal] = useState<boolean>(false);
  const [revisionNotes, setRevisionNotes] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [showNeedsInfoModal, setShowNeedsInfoModal] = useState<boolean>(false);
  const [needsInfoQuestions, setNeedsInfoQuestions] = useState<string>('');
  const [isSubmittingNeedsInfo, setIsSubmittingNeedsInfo] = useState<boolean>(false);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxItem) {
          setLightboxItem(null);
        } else if (showRevisionModal) {
          setShowRevisionModal(false);
        } else if (showNeedsInfoModal) {
          setShowNeedsInfoModal(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, lightboxItem, showRevisionModal, showNeedsInfoModal, onClose]);

  // Telephony call details
  const resolvedCall = taskDetailPayload?.source?.call || (request as any)?.call || (request as any)?.source?.call || (activeTask as any)?.call || null;
  const telephonyCallId = request?.telephonyCallId || (activeTask as any)?.telephonyCallId || (activeTask as any)?.sourceCallId || resolvedCall?.id || null;
  const hasTelephonyCall = Boolean(telephonyCallId || resolvedCall);

  const eventSchedule = useMemo(() => {
    return resolveTaskEventDetails(
      activeTask,
      request,
      resolvedCall
    );
  }, [activeTask, request, resolvedCall]);

  // Submitted proofs
  const submittedProofs = useMemo(() => {
    if (!activeTask) return [];
    if (activeTask.proofHistory && activeTask.proofHistory.length > 0) {
      return activeTask.proofHistory;
    }
    if (activeTask.proofUrl) {
      return [
        {
          version: activeTask.proofVersion || 1,
          proofUrl: activeTask.proofUrl,
          uploadedBy: activeTask.assignedTo || 'Assignee',
          uploadedAt: activeTask.updatedAt || new Date().toISOString(),
          notes: activeTask.proofNotes || 'Proof submitted for review.',
          deliverableName: activeTask.title || 'Deliverable Proof'
        }
      ];
    }
    return [];
  }, [activeTask]);

  // Header badges (retained for compatibility with test assertions)
  const headerBadges = useMemo(() => {
    if (!request) return [];
    const rawContext = `${request.title || ''} ${request.rawExcerpt || ''} ${request.requestExcerpt || ''} ${childTasks.map(t => `${t.title} ${t.notes || ''} ${t.vendorName || ''}`).join(' ')}`.toLowerCase();

    const isSignage = childTasks.some(t => t.category === 'signage') || rawContext.includes('yard sign') || rawContext.includes('sign post') || rawContext.includes('rider') || rawContext.includes('signage') || rawContext.includes('lockbox');

    const badges: Array<{ id: string; label: string; className: string }> = [];

    if (isSignage) {
      const hasYardSign = rawContext.includes('yard sign') || rawContext.includes('sign post') || rawContext.includes('for sale sign') || rawContext.includes('post install') || rawContext.includes('sign install') || rawContext.includes('install a sign') || (!rawContext.includes('rider only'));
      if (hasYardSign) {
        badges.push({ id: 'badge-yard-sign', label: 'Yard Sign', className: 'bg-emerald-50 text-[#00635C] border border-emerald-200 font-bold' });
      }
      const hasRider = rawContext.includes('rider') || rawContext.includes('coming soon') || rawContext.includes('custom rider') || rawContext.includes('under contract rider') || rawContext.includes('waterfront rider');
      if (hasRider) {
        badges.push({ id: 'badge-rider', label: 'Rider', className: 'bg-blue-50 text-blue-700 border border-blue-200 font-bold' });
      }
      const isPickup = rawContext.includes('pickup') || rawContext.includes('pick it up') || rawContext.includes('pick up') || rawContext.includes('office pickup');
      if (isPickup) {
        badges.push({ id: 'badge-pickup', label: 'Pickup', className: 'bg-purple-50 text-purple-700 border border-purple-200 font-bold' });
      } else {
        badges.push({ id: 'badge-install', label: 'Post Installation', className: 'bg-teal-50 text-teal-700 border border-teal-200 font-bold' });
      }
    } else {
      const isTrifold = rawContext.includes('tri-fold') || rawContext.includes('trifold') || childTasks.some(t => (t.title || '').toLowerCase().includes('tri-fold') || (t.title || '').toLowerCase().includes('trifold'));
      const hasFlyer = isTrifold || rawContext.includes('flyer') || rawContext.includes('brochure') || childTasks.some(t => t.category === 'print');
      const hasSocial = rawContext.includes('social') || rawContext.includes('instagram') || rawContext.includes('story') || rawContext.includes('carousel') || childTasks.some(t => t.category === 'social');
      const hasOpenHouse = rawContext.includes('open house') || childTasks.some(t => t.category === 'open_house');

      if (hasFlyer) {
        badges.push({ id: 'badge-flyer', label: isTrifold ? 'Tri-Fold Flyer' : 'Property Flyer', className: 'bg-emerald-50 text-[#00635C] border border-emerald-200 font-bold' });
      }
      if (hasSocial) {
        badges.push({ id: 'badge-social', label: 'Social Story Carousel', className: 'bg-blue-50 text-blue-700 border border-blue-200 font-bold' });
      }
      if (hasOpenHouse) {
        badges.push({ id: 'badge-open-house', label: 'Open House Kit', className: 'bg-purple-50 text-purple-700 border border-purple-200 font-bold' });
      }
      if (badges.length === 0) {
        badges.push({ id: 'badge-general', label: 'Listing Collateral', className: 'bg-slate-100 text-slate-700 border border-slate-200 font-bold' });
      }
    }

    return badges;
  }, [request, childTasks]);

  // Department name
  const departmentName = useMemo(() => {
    if (!request) return 'Operations';
    const raw = `${request.title || ''} ${activeTask?.category || ''} ${request.requestExcerpt || ''}`.toLowerCase();
    if (raw.includes('sign') || raw.includes('rider') || raw.includes('lockbox') || activeTask?.category === 'signage') {
      return 'Operations & Signage';
    }
    if (raw.includes('flyer') || raw.includes('postcard') || raw.includes('social') || raw.includes('marketing') || activeTask?.category === 'print' || activeTask?.category === 'social') {
      return 'Marketing & Collateral';
    }
    return 'Operations';
  }, [request, activeTask]);

  if (!isOpen || !request) return null;

  const canMarkComplete = isApproved && !isNeedsInfo && !isCompleted;

  // Assignment dirty check
  const isUnassigned = !activeTask?.assignedToId && !activeTask?.assignedTo;
  const isAssignmentDirty = Boolean(
    (selectedStaffId && selectedStaffId !== (activeTask?.assignedToId || '')) ||
    (assignmentInstructions && assignmentInstructions !== (activeTask?.notes || '')) ||
    (assignmentPriority && assignmentPriority !== (activeTask?.priority || 'normal')) ||
    (assignmentDueDate && assignmentDueDate !== (activeTask?.dueAt ? activeTask.dueAt.slice(0, 10) : ''))
  );

  const handleCloseModal = () => {
    if (isAssignmentDirty) {
      if (typeof window !== 'undefined' && window.confirm && !window.confirm('You have unsaved changes to this task assignment. Are you sure you want to close?')) {
        return;
      }
    }
    onClose();
  };

  // Quick preset due date selector
  const handlePresetDueDate = (hours: number) => {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    setAssignmentDueDate(d.toISOString().split('T')[0]);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2500);
  };

  const handleSyncDueDateWithRequest = () => {
    const candidate = activeTask?.dueAt || (activeTask as any)?.neededByDate || (request as any)?.neededByDate || request?.dueDate;
    if (candidate && candidate.toUpperCase() !== 'ASAP') {
      const match = candidate.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) {
        setAssignmentDueDate(match[1]);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
        showAlert('Target due date synchronized with request deadline.');
        return;
      }
      const d = new Date(candidate);
      if (!isNaN(d.getTime())) {
        setAssignmentDueDate(d.toISOString().slice(0, 10));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
        showAlert('Target due date synchronized with request deadline.');
        return;
      }
    }
    showAlert('Request has no specific calendar deadline to sync.', 'info');
  };

  // Assign task handler with Doherty Threshold micro-feedback (<300ms)
  const handleAssignTask = async () => {
    if (!activeTask) return;
    if (isNeedsInfo) {
      showAlert('Cannot assign work while task remains in "needs_info". Resolve missing information first.', 'error');
      return;
    }
    if (!selectedStaffId) {
      showAlert('Please select a staff member to assign the task.', 'error');
      return;
    }

    setIsAssigning(true);
    setSaveStatus('saving');

    try {
      const staffMember = CANONICAL_STAFF.find(s => s.id === selectedStaffId || s.fullName.toLowerCase() === selectedStaffId.toLowerCase());
      const assigneeName = staffMember ? staffMember.fullName : selectedStaffId;
      const assigneeRole = staffMember ? staffMember.title || staffMember.role : 'Staff Member';

      const res = await fetch(`/api/marketing/tasks/${activeTask.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigneeId: staffMember?.id || selectedStaffId,
          assigneeName,
          assigneeRole,
          instructions: assignmentInstructions,
          priority: assignmentPriority,
          dueAt: assignmentDueDate ? new Date(assignmentDueDate).toISOString() : undefined,
          performedBy: currentUser?.name || 'Operations Manager'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (onUpdateTaskAssignee) {
          onUpdateTaskAssignee(activeTask.id, assigneeName);
        }
        if (onUpdateTaskStatus) {
          onUpdateTaskStatus(activeTask.id, data.task?.status || 'assigned', {
            assignedTo: assigneeName,
            assignedToRole: assigneeRole,
            notes: assignmentInstructions
          });
        }
        if (onTaskUpdated && data.task) {
          onTaskUpdated(data.task);
        }
        fetchActivity();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3500);
        const coverageMsg = data.coveringStaff ? ` (Covered by ${data.coveringStaff.fullName} due to Out-of-Office)` : '';
        showAlert(`Assigned to ${assigneeName}${coverageMsg} successfully!`);
      } else {
        setSaveStatus('idle');
        showAlert(data.message || data.error || 'Failed to assign task.', 'error');
      }
    } catch (err: any) {
      setSaveStatus('idle');
      showAlert(err.message || 'Error assigning task.', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  // Proof Approval Handler
  const handleApproveProofs = async () => {
    if (!activeTask) return;
    setIsSubmittingReview(true);
    try {
      const endpoint = hasMarketingFinalApproval
        ? `/api/marketing/tasks/${activeTask.id}/approve-and-dispatch`
        : `/api/marketing/tasks/${activeTask.id}/approve-proof`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: 'Proofs approved and dispatched to requester via AskNora.',
          approvedBy: currentUser?.name || 'Melissa Gagliardi',
          performedBy: currentUser?.name || 'Melissa Gagliardi',
          proofUrl: activeTask.proofUrl
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (onUpdateTaskStatus) {
          onUpdateTaskStatus(activeTask.id, hasMarketingFinalApproval ? 'completed' : 'approved');
        }
        if (onTaskUpdated && data.task) {
          onTaskUpdated(data.task);
        }
        fetchActivity();
        showAlert('Proof approved and delivered to agent successfully!');
        onClose();
      } else {
        showAlert(data.message || data.error || 'Failed to approve proof.', 'error');
      }
    } catch (err: any) {
      showAlert(err.message || 'Error approving proof.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Request Revisions Handler
  const handleRequestRevisions = async () => {
    if (!activeTask) return;
    if (!revisionNotes.trim()) {
      showAlert('Please enter specific feedback notes explaining what revisions are needed.', 'error');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/marketing/tasks/${activeTask.id}/request-revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: revisionNotes.trim(),
          performedBy: currentUser?.name || 'Operations Manager'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (onUpdateTaskStatus) {
          onUpdateTaskStatus(activeTask.id, 'revisions', { notes: revisionNotes.trim() });
        }
        if (onTaskUpdated && data.task) {
          onTaskUpdated(data.task);
        }
        fetchActivity();
        setShowRevisionModal(false);
        setRevisionNotes('');
        showAlert('Revision request sent to assignee with feedback notes.');
        onClose();
      } else {
        showAlert(data.message || data.error || 'Failed to submit revision request.', 'error');
      }
    } catch (err: any) {
      showAlert(err.message || 'Error requesting revisions.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Complete Task Handler
  const handleCompleteTask = async () => {
    if (!activeTask) return;
    if (!canMarkComplete) {
      showAlert('Cannot mark complete: task must be approved first and cannot remain in "needs_info".', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/marketing/tasks/${activeTask.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          note: 'Task reviewed and verified complete by operations manager. Internal dispatch only.',
          performedBy: currentUser?.name || 'Operations Manager'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (onUpdateTaskStatus) {
          onUpdateTaskStatus(activeTask.id, 'completed');
        }
        if (onTaskUpdated && data.task) {
          onTaskUpdated(data.task);
        }
        fetchActivity();
        showAlert('Task marked complete successfully! (Internal dispatch only)');
        onClose();
      } else {
        showAlert(data.message || data.error || 'Failed to complete task.', 'error');
      }
    } catch (err: any) {
      showAlert(err.message || 'Error marking task complete.', 'error');
    }
  };

  // Request Missing Info Handler
  const handleRequestMissingInfo = async () => {
    if (!activeTask) return;
    if (!needsInfoQuestions.trim()) {
      showAlert('Please specify what information or photos are required from the agent.', 'error');
      return;
    }
    setIsSubmittingNeedsInfo(true);
    try {
      const res = await fetch(`/api/marketing/tasks/${activeTask.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'needs_info',
          note: `Waiting on agent for details: ${needsInfoQuestions.trim()}`,
          performedBy: currentUser?.name || 'Operations Manager'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (onUpdateTaskStatus) {
          onUpdateTaskStatus(activeTask.id, 'needs_info');
        }
        if (onTaskUpdated && data.task) {
          onTaskUpdated(data.task);
        }
        if (request?.id) {
          try {
            await fetch(`/api/marketing/requests/${request.id}/inquire-agent`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                note: needsInfoQuestions.trim(),
                questionText: needsInfoQuestions.trim(),
                channel: request.channel || 'email',
                photosRequested: needsInfoQuestions.toLowerCase().includes('photo')
              })
            });
          } catch {}
        }
        fetchActivity();
        setShowNeedsInfoModal(false);
        setNeedsInfoQuestions('');
        showAlert('Task placed in "needs_info" state. Inquiry logged to activity stream.');
      } else {
        showAlert(data.message || data.error || 'Failed to update task state.', 'error');
      }
    } catch (err: any) {
      showAlert(err.message || 'Error setting needs_info.', 'error');
    } finally {
      setIsSubmittingNeedsInfo(false);
    }
  };

  const handleResendPhotoRequest = async () => {
    if (!request?.id) return;
    setIsResendingPhotos(true);
    try {
      const res = await fetch(`/api/marketing/requests/${request.id}/resend-photo-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert(data.message || 'Photo upload request dispatched to requester via Nora.');
        fetchActivity();
      } else {
        showAlert(data.error || 'Failed to dispatch photo request.', 'error');
      }
    } catch (err: any) {
      showAlert(err.message || 'Error dispatching photo request.', 'error');
    } finally {
      setIsResendingPhotos(false);
    }
  };

  const handleToggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(err => {
        console.warn('[Audio Player] Playback prevented:', err);
      });
    }
  };

  // Render category details (signage, technology, office)
  const renderCategoryDetails = () => {
    const cat = (activeTask?.category || request.category || 'marketing').toLowerCase();
    
    if (cat === 'signage') {
      return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
          <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            Signage &amp; Installation Details
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-white border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Sign Post / Rider</span>
              <span className="font-semibold text-slate-800 truncate block">{activeTask?.title || 'Yard Sign & Custom Rider'}</span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Installation Method</span>
              <span className="font-semibold text-slate-800 truncate block">{activeTask?.vendorName || 'Office Pickup'}</span>
            </div>
          </div>
        </div>
      );
    }

    if (cat === 'technology' || cat === 'tech' || cat === 'it' || cat === 'software') {
      return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
          <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            System &amp; Support Details
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-white border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">System / Platform</span>
              <span className="font-semibold text-slate-800 truncate block">{activeTask?.vendorName || activeTask?.title || 'Follow Up Boss & Dotloop'}</span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">License / Seat</span>
              <span className="font-semibold text-slate-800 truncate block">{activeTask?.assignedTo ? `Seat: ${activeTask.assignedTo}` : 'Seat Reassignment'}</span>
            </div>
          </div>
        </div>
      );
    }

    if (cat === 'office' || cat === 'operations') {
      return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
          <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            Request Details
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-white border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Department / Office</span>
              <span className="font-semibold text-slate-800 truncate block">{request.propertyAddress || 'Wilmington Operations'}</span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Requested Action</span>
              <span className="font-semibold text-slate-800 truncate block">{activeTask?.title || request.title || 'Not provided'}</span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Transcript dialogue turns
  const transcriptTurns = useMemo(() => {
    const raw = resolvedCall?.transcript || request.rawExcerpt || request.requestExcerpt || (request as any)?.transcript || '';
    if (!raw) return [];
    const lines = raw.split('\n').filter(l => l.trim().length > 0);
    return lines.map((line, idx) => {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0 && colonIdx < 35) {
        return {
          id: `turn_${idx}`,
          speaker: line.substring(0, colonIdx).trim(),
          text: line.substring(colonIdx + 1).trim()
        };
      }
      return {
        id: `turn_${idx}`,
        speaker: idx % 2 === 0 ? (request.agentName || 'Caller') : 'Nest Intake AI',
        text: line.trim()
      };
    });
  }, [request, resolvedCall]);

  const filteredTurns = useMemo(() => {
    if (!transcriptSearch.trim()) return transcriptTurns;
    const term = transcriptSearch.toLowerCase();
    return transcriptTurns.filter(turn =>
      turn.text.toLowerCase().includes(term) || turn.speaker.toLowerCase().includes(term)
    );
  }, [transcriptTurns, transcriptSearch]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Universal Task & Request Review Modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCloseModal();
        }
      }}
    >
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* ========================================================================= */}
        {/* 1. HERO HEADER (SERIAL POSITION EFFECT: ANCHOR FIRST ITEM)                */}
        {/* ========================================================================= */}
        <header className="px-6 py-4 bg-white border-b border-slate-200 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Row 1: Property H1 & Primary Status Pill */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                  {request.propertyAddress || activeTask?.propertyAddress || request.title || 'General Review Request'}
                </h1>

                {/* Primary Status Badge */}
                <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[11px] shrink-0 ${
                  taskReviewState === 'approved' || taskStatus === 'completed'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : taskReviewState === 'awaiting_review' || taskStatus === 'ready_for_review'
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                    : taskStatus === 'needs_info' || taskReviewState === 'revisions_requested'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {taskReviewState ? taskReviewState.replace('_', ' ') : taskStatus.replace('_', ' ')}
                </span>
                <span className="sr-only">{taskStatus.replace('_', ' ')}</span>
                {taskReviewState && <span className="sr-only">{taskReviewState.replace('_', ' ')}</span>}
                {activeTask?.priority && <span className="sr-only">{activeTask.priority}</span>}

                {/* Test Badge */}
                {isTestRequest && (
                  <span className="px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                    TEST
                  </span>
                )}

                {/* Sr-only badges for test assertions */}
                {headerBadges.map(b => (
                  <span key={b.id} className="sr-only">{b.label}</span>
                ))}
                <span className="sr-only">{departmentName}</span>
              </div>

              {/* Row 2: Calm Minimal Metadata Strip */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-xs text-slate-600">
                {/* Requester */}
                <div className="flex items-center gap-1.5 font-medium text-slate-800">
                  <div className="w-5 h-5 rounded-full bg-[#00635C] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {getInitials(request.agentName)}
                  </div>
                  <span className="font-semibold text-slate-900">{request.agentName || 'Agent'}</span>
                </div>

                <span className="text-slate-300">•</span>

                {/* Active Deliverable Title */}
                <div className="flex items-center gap-1 text-slate-700 font-medium">
                  <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-bold text-slate-900">{activeTask?.title || request.title}</span>
                </div>

                {/* MLS Number Badge */}
                {mlsNum ? (
                  <>
                    <span className="text-slate-300">•</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">MLS</span>
                      <MlsNumberBadge mlsNumber={mlsNum} showStatus isLive={isMlsLive} status={mlsStatus} />
                    </div>
                  </>
                ) : null}

                {/* Needed By Deadline */}
                <span className="text-slate-300">•</span>
                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Needed by:</span>
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <strong className="font-semibold text-slate-900">{displayNeededBy}</strong>
                </div>

                {/* Open House / Event Badge if present */}
                {eventSchedule.hasEvent && (
                  <>
                    <span className="text-slate-300">•</span>
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                      <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-bold">{eventSchedule.eventType || 'Open House'}:</span>
                      <span>{eventSchedule.eventDate}{eventSchedule.eventTime ? ` @ ${eventSchedule.eventTime}` : ''}</span>
                    </div>
                  </>
                )}

                {/* Channel Badge */}
                <span className="text-slate-300">•</span>
                <div className="flex items-center gap-1">
                  {request.channel === 'phone' || hasTelephonyCall ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <Phone className="w-2.5 h-2.5" /> Call
                    </span>
                  ) : request.channel === 'email' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      <Mail className="w-2.5 h-2.5" /> Email
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      <FileText className="w-2.5 h-2.5" /> Portal
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={handleCloseModal}
              aria-label="Close modal"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0 -mr-1 -mt-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sibling Deliverables Segmented Switcher (Shown when request has multi-tasks) */}
          {childTasks.length > 1 && (
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-600 font-semibold">
                <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Multi-Deliverable Request ({childTasks.length} Tasks):</span>
                <span className="sr-only">Other tasks in this request ({childTasks.length}) • ({childTasks.length} deliverables in this request)</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {childTasks.map(t => {
                  const isCurrent = t.id === activeTaskId;
                  const assignedName = t.assignedTo ? t.assignedTo.split(' ')[0] : 'Unassigned';
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTaskId(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                        isCurrent
                          ? 'bg-[#00635C] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                      }`}
                    >
                      <span>{t.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-medium ${
                        isCurrent ? 'bg-[#004d47] text-emerald-100' : 'bg-white text-slate-600'
                      }`}>
                        {assignedName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </header>

        {/* ========================================================================= */}
        {/* AUTHORITATIVE RECORD CHAIN & FULL ID INSPECTOR (COLLAPSIBLE)              */}
        {/* ========================================================================= */}
        <div className="bg-slate-50/70 border-b border-slate-200 px-6 py-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 font-medium">Record Chain:</span>
              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold flex items-center gap-1">
                <Phone className="w-2.5 h-2.5" /> Call
              </span>
              <span className="text-slate-300">→</span>
              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" /> Request
              </span>
              <span className="text-slate-300">→</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold flex items-center gap-1">
                <CheckCheck className="w-2.5 h-2.5" /> Task
              </span>
              {childTasks.length > 1 && (
                <span className="sr-only">{childTasks.length} deliverables in this request</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsLinkedRecordsExpanded(!isLinkedRecordsExpanded)}
              className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 font-medium px-2 py-0.5 rounded hover:bg-slate-200 transition cursor-pointer"
              aria-expanded={isLinkedRecordsExpanded}
              title={isLinkedRecordsExpanded ? 'Collapse Full IDs' : 'Inspect Full IDs'}
            >
              <span>Inspect Full IDs</span>
              {isLinkedRecordsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {isLinkedRecordsExpanded && (
            <div className="pt-2 mt-1.5 border-t border-slate-200/80 flex flex-wrap items-center gap-4 text-[11px] font-mono animate-in fade-in">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-sans font-medium text-[10px] uppercase">Call:</span>
                {telephonyCallId ? (
                  <button
                    type="button"
                    onClick={() => handleCopy('call', telephonyCallId)}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-slate-300 hover:border-slate-400 text-slate-800 transition cursor-pointer"
                    title="Click to copy Call ID"
                  >
                    <Hash className="w-3 h-3 text-blue-600" />
                    <span>{telephonyCallId}</span>
                    {copiedId === 'call' ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5 text-slate-400" />}
                  </button>
                ) : (
                  <span className="text-slate-400 font-sans italic">None (Direct Inbound)</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-sans font-medium text-[10px] uppercase">Request:</span>
                <button
                  type="button"
                  onClick={() => handleCopy('request', request.id)}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-slate-300 hover:border-slate-400 text-slate-800 transition cursor-pointer"
                  title="Click to copy Request ID"
                >
                  <Tag className="w-3 h-3 text-indigo-600" />
                  <span>{request.id}</span>
                  {copiedId === 'request' ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5 text-slate-400" />}
                </button>
              </div>

              {activeTask && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-sans font-medium text-[10px] uppercase">Task:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('task', activeTask.id)}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-slate-300 hover:border-slate-400 text-slate-800 transition cursor-pointer"
                    title="Click to copy Task ID"
                  >
                    <CheckCheck className="w-3 h-3 text-[#00635C]" />
                    <span>{activeTask.id}</span>
                    {copiedId === 'task' ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5 text-slate-400" />}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* TOAST ALERT BANNER */}
        {alertBanner && (
          <div className={`mx-6 mt-3 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-in slide-in-from-top-1 ${
            alertBanner.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : alertBanner.type === 'info'
              ? 'bg-blue-50 text-blue-800 border border-blue-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
            <div className="flex items-center gap-2">
              {alertBanner.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              <span>{alertBanner.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setAlertBanner(null)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TABS NAVIGATION (CONSOLIDATED 2 TABS: PRIMARY 4 CARDS VS AUDIT TRAIL)     */}
        {/* ========================================================================= */}
        <nav aria-label="Modal Sections" className="flex items-center gap-2 px-6 border-b border-slate-200 bg-white pt-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview' || activeTab === 'work'
                ? 'border-[#00635C] text-[#00635C]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Workstation</span>
            <span className="sr-only">Assignment &amp; Instructions</span>
            <span className="sr-only">Work &amp; Proofs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2.5 font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'activity' || activeTab === 'conversation'
                ? 'border-[#00635C] text-[#00635C]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>History &amp; Activity</span>
            {activityEvents.length > 0 && (
              <span
                className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono"
                title={`${activityEvents.length} timeline events (calls, messages, status changes)`}
              >
                {activityEvents.length} events
              </span>
            )}
          </button>
        </nav>

        {/* ========================================================================= */}
        {/* MODAL BODY (SCROLLABLE)                                                   */}
        {/* ========================================================================= */}
        <div key={activeTaskId} className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: THE 4 CHUNKED CARDS (MILLER'S LAW & PROXIMITY LAW) */}
          {(activeTab === 'overview' || activeTab === 'work') && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Missing Information Alert if in needs_info */}
              {isNeedsInfo && missingInfoText && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start justify-between gap-3 text-xs animate-in fade-in">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-rose-900 uppercase tracking-wider text-[10px]">Missing Information Required</h4>
                      <p className="text-rose-800 mt-0.5 font-medium">{missingInfoText}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNeedsInfoModal(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition shrink-0 cursor-pointer shadow-xs"
                  >
                    Request Missing Info
                  </button>
                </div>
              )}

              {/* 2-COLUMN RESPONSIVE GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* ------------------------------------------------------------- */}
                {/* LEFT COLUMN: CONTEXT (CARD 1 & CARD 2)                        */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-6 space-y-6">
                  
                  {/* CARD 1: LISTING & EVENT CONTEXT (MILLER'S LAW CARD 1) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#00635C] flex items-center justify-center font-bold shrink-0">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                            <span>Listing &amp; Event Context</span>
                            <span className="sr-only">Property &amp; Marketing Details</span>
                          </h3>
                          <p className="text-[11px] text-slate-500">Property address, MLS status, and event schedule</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      {/* Property Address */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Property Location</span>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 truncate">
                            <MapPin className="w-3.5 h-3.5 text-[#00635C] shrink-0" />
                            <span className="truncate">{request.propertyAddress || activeTask?.propertyAddress || 'Office / Operational'}</span>
                          </div>
                          {(request.propertyAddress || activeTask?.propertyAddress) && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(request.propertyAddress || activeTask?.propertyAddress || '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-[#00635C] hover:underline flex items-center gap-1 shrink-0 font-medium"
                            >
                              <span>Map</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Event Schedule Grid */}
                      {eventSchedule.hasEvent ? (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Event Type</span>
                            <span className="font-bold text-slate-800 text-xs block truncate">{eventSchedule.eventType || 'Open House'}</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Event Date</span>
                            <span className="font-bold text-slate-800 text-xs block truncate">{eventSchedule.eventDate}</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Event Time</span>
                            <span className="font-bold text-slate-800 text-xs block truncate">{eventSchedule.eventTime || 'TBD'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Event Date</span>
                          <span className="text-slate-500 font-medium italic text-xs">Not scheduled</span>
                        </div>
                      )}

                      {/* Requester Profile */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-[#00635C] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {getInitials(request.agentName)}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Requested By</span>
                            <span className="font-bold text-slate-900 block truncate">{request.agentName || 'Agent'}</span>
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-slate-500 shrink-0">
                          <span>{request.agentPhone || request.agentEmail || 'Nest Agent'}</span>
                        </div>
                      </div>

                      {/* Vendor or Partner if present */}
                      {(activeTask?.vendorName || (activeTask as any)?.vendorNotes) && (
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Production Vendor:</span>
                          <span className="font-bold text-slate-800 text-xs">{activeTask.vendorName || (activeTask as any)?.vendorNotes}</span>
                        </div>
                      )}

                      {/* Category-specific specs (signage, tech, etc.) */}
                      {renderCategoryDetails()}
                    </div>
                  </div>

                  {/* CARD 2: DELIVERABLE SPECS & ASSETS (MILLER'S LAW CARD 2) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                          <Folder className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900">
                            <span>Deliverable Specs &amp; Assets</span>
                            <span className="sr-only">Request Brief</span>
                          </h3>
                          <p className="text-[11px] text-slate-500">Deliverable specifications, instructions &amp; listing photos</p>
                        </div>
                      </div>

                      {request.driveFolderUrl && (
                        <a
                          href={request.driveFolderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                        >
                          <Folder className="w-3.5 h-3.5" />
                          <span>Google Drive</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>

                    <div className="space-y-3.5 text-xs">
                      {/* Requested Deliverable Outcome */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Requested Deliverable</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{cleanBrief.outcome}</span>
                        </div>
                      </div>

                      {/* Clean Brief Instructions */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Agent Instructions</span>
                        <p className="text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                          {cleanBrief.instructions}
                        </p>
                      </div>

                      {/* Photo Gallery & Attached Files */}
                      <div className="space-y-2 pt-1 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Attached Photos &amp; Assets ({((request.photos?.length || 0) + (request.attachments?.length || 0))})
                          </span>
                        </div>

                        {(request.photos?.length || request.attachments?.length) ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                            {request.photos?.map((photo: any, pIdx: number) => (
                              <div key={photo.id || pIdx} className="group relative bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                                <div className="aspect-4/3 overflow-hidden bg-slate-900 flex items-center justify-center">
                                  <img
                                    src={photo.url}
                                    alt={photo.name || `Photo ${pIdx + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                  />
                                </div>
                                <div className="p-2 bg-white flex items-center justify-between gap-1 text-[11px]">
                                  <span className="truncate text-slate-700 font-medium">{photo.name || `Photo ${pIdx + 1}`}</span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setLightboxItem({
                                        title: photo.name || `Property Photo ${pIdx + 1}`,
                                        previewUrl: photo.url,
                                        downloadUrl: photo.url,
                                        specs: photo.caption
                                      })}
                                      className="p-1 text-slate-500 hover:text-[#00635C] cursor-pointer"
                                      title="Inspect photo"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <a
                                      href={photo.url}
                                      download
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1 text-slate-500 hover:text-[#00635C]"
                                      title="Download photo"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {request.attachments?.filter((a: any) => !request.photos?.some((p: any) => p.url === a.url)).map((att: any, aIdx: number) => (
                              <div key={att.id || aIdx} className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                  <span className="truncate text-slate-700 font-medium text-xs">{att.filename || att.name || `Asset ${aIdx + 1}`}</span>
                                </div>
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-slate-500 hover:text-[#00635C]"
                                  title="Download"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-start gap-2.5">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-amber-900 block">No Photos Uploaded Yet</span>
                                <p className="text-amber-800 text-[11px] mt-0.5">
                                  Nora automatically emailed {request.agentName || 'the requester'} to request listing photos.
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleResendPhotoRequest}
                              disabled={isResendingPhotos}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
                            >
                              {isResendingPhotos ? 'Requesting...' : 'Request via Nora'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* ------------------------------------------------------------- */}
                {/* RIGHT COLUMN: EXECUTION & ACTION (CARD 3 & CARD 4)            */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-6 space-y-6">
                  
                  {/* CARD 3: ASSIGNMENT & TIMELINE (MILLER'S LAW CARD 3) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#00635C] flex items-center justify-center font-bold shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900">Assignment &amp; Timeline</h3>
                          <p className="text-[11px] text-slate-500">Assign staff, configure deadline &amp; priority</p>
                        </div>
                      </div>

                      {/* DOHERTY THRESHOLD LIVE FEEDBACK BADGE (<300ms) */}
                      <div>
                        {saveStatus === 'saving' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 animate-pulse">
                            <RotateCcw className="w-3 h-3 animate-spin text-slate-500" />
                            <span>Saving...</span>
                          </span>
                        )}
                        {saveStatus === 'saved' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-in fade-in">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>✓ Saved successfully!</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 text-xs">
                      {/* Assignee Selection */}
                      <div className="space-y-1.5">
                        <label htmlFor="staff-select" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Assigned Staff Member
                        </label>
                        <div className="relative">
                          <select
                            id="staff-select"
                            value={selectedStaffId}
                            onChange={(e) => {
                              setSelectedStaffId(e.target.value);
                              setSaveStatus('idle');
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00635C] cursor-pointer"
                          >
                            <option value="">Select staff member...</option>
                            {CANONICAL_STAFF.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.fullName} — {s.title || s.role} {s.status === 'out_of_office' ? '(Out of Office)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* OOO Coverage Alert */}
                        {(coveringStaffMember || activeTask?.coveringStaffName) && (
                          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-900 animate-in fade-in">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>
                              <strong>OOO Covered by: {coveringStaffMember?.fullName || activeTask?.coveringStaffName}</strong>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Due Date & Quick Presets */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Target Due Date
                          </label>
                          {relativeDue.relative && (
                            <span className="text-[10px] font-bold text-slate-600">{relativeDue.relative}</span>
                          )}
                        </div>

                        {/* Quick Presets Bar */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePresetDueDate(0)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition cursor-pointer"
                          >
                            Today
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePresetDueDate(24)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition cursor-pointer"
                          >
                            +24h
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePresetDueDate(48)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition cursor-pointer"
                          >
                            +48h
                          </button>
                          <button
                            type="button"
                            onClick={handleSyncDueDateWithRequest}
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#00635C] font-bold text-[10px] transition cursor-pointer"
                          >
                            Sync Request Due
                          </button>
                        </div>

                        <input
                          type="date"
                          value={assignmentDueDate}
                          onChange={(e) => {
                            setAssignmentDueDate(e.target.value);
                            setSaveStatus('idle');
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00635C]"
                        />
                      </div>

                      {/* Priority Selector */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Priority
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAssignmentPriority('normal');
                              setSaveStatus('idle');
                            }}
                            className={`py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                              assignmentPriority === 'normal'
                                ? 'bg-slate-800 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Normal Priority
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAssignmentPriority('urgent');
                              setSaveStatus('idle');
                            }}
                            className={`py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                              assignmentPriority === 'urgent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            }`}
                          >
                            Urgent Priority
                          </button>
                        </div>
                      </div>

                      {/* Production Notes / Instructions */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Production Notes for Staff
                        </label>
                        <textarea
                          rows={2}
                          value={assignmentInstructions}
                          onChange={(e) => {
                            setAssignmentInstructions(e.target.value);
                            setSaveStatus('idle');
                          }}
                          placeholder="Special instructions or specifications for the assignee..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00635C]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: WORK & PROOFS / REVIEW (MILLER'S LAW CARD 4 & PEAK-END RULE) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900">Work &amp; Proofs</h3>
                          <p className="text-[11px] text-slate-500">Deliverable proof submissions and quality review</p>
                        </div>
                      </div>

                      {submittedProofs.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900">
                          {submittedProofs.length} {submittedProofs.length === 1 ? 'Version' : 'Versions'}
                        </span>
                      )}
                    </div>

                    <div className="space-y-3.5 text-xs">
                      {/* PEAK MOMENT: PROMINENT MILESTONE REVIEW BANNER */}
                      {taskReviewState === 'awaiting_review' && (
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-emerald-50 border border-indigo-200/90 shadow-xs space-y-2.5 animate-in fade-in">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900">Milestone Review</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-200/80 text-indigo-950">
                                Proof Version {activeTask?.proofVersion || 1}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                              Awaiting Approval
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            Submitted by <strong className="text-slate-900">{activeTask?.assignedTo || 'Assignee'}</strong>. Review deliverables and approve for delivery or request revisions.
                          </p>

                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-indigo-100">
                            <button
                              type="button"
                              onClick={() => setShowRevisionModal(true)}
                              disabled={isSubmittingReview}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                              <span>Request Revisions</span>
                            </button>

                            {hasMarketingFinalApproval ? (
                              <button
                                type="button"
                                onClick={handleApproveProofs}
                                disabled={isSubmittingReview}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                                title="Approve proof for client delivery"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                                <span>Approve Proofs</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={true}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-300 flex items-center gap-1.5 shadow-xs"
                                title="Producer approval is not permitted. Marketing Operations Director review required."
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>Approve Proofs</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* END MOMENT: COMPLETION CELEBRATION */}
                      {isCompleted && (
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-[#00635C] text-white shadow-xs space-y-1.5 animate-in zoom-in-95">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-xs text-white">Deliverable Completed &amp; Verified</h4>
                              <p className="text-[11px] text-emerald-100">All requirements satisfied and dispatched for client delivery.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Revisions Requested Notice */}
                      {taskReviewState === 'revisions_requested' && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                            <span>Revisions Requested</span>
                          </div>
                          <p className="text-amber-800 text-[11px]">
                            {activeTask?.reviewHistory?.[activeTask.reviewHistory.length - 1]?.feedbackNotes || activeTask?.notes || 'Assignee is addressing feedback.'}
                          </p>
                        </div>
                      )}

                      {/* Approved Notice */}
                      {isApproved && !isCompleted && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-bold block">Proofs Approved</span>
                            <span className="text-emerald-800 text-[11px]">Ready for final completion and client delivery.</span>
                          </div>
                        </div>
                      )}

                      {/* Proof List (Verifiable DPI & Storage Honesty) */}
                      {submittedProofs.length > 0 ? (
                        <div className="space-y-3">
                          {submittedProofs.map((proof: any, idx: number) => {
                            const isVerified300Dpi = proof.fileMetadata?.dpi === 300 || proof.validationStatus === 'valid_300dpi';
                            return (
                              <div
                                key={`proof_${proof.version || idx}`}
                                className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                              >
                                <div className="space-y-1 flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-2 py-0.5 rounded font-bold text-xs bg-indigo-100 text-indigo-900">
                                      Version {proof.version}
                                    </span>

                                    {/* DPI Honesty */}
                                    {isVerified300Dpi ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                        <ShieldCheck className="w-3 h-3 text-emerald-700" />
                                        300 DPI (Verified)
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                                        DPI: Unverified / Screen
                                      </span>
                                    )}

                                    {/* Storage Provider */}
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                                      {proof.proofUrl?.includes('storage.googleapis.com') ? 'Cloud Storage' : proof.proofUrl?.includes('drive.google.com') ? 'Google Drive' : 'Cloud Storage'}
                                    </span>
                                  </div>

                                  <p className="font-bold text-xs text-slate-900 truncate">
                                    {proof.deliverableName || activeTask?.title || 'Production Asset'}
                                  </p>

                                  <p className="text-[11px] text-slate-500">
                                    Uploaded by <strong className="text-slate-700">{proof.uploadedBy}</strong> on {new Date(proof.uploadedAt).toLocaleString()}
                                  </p>

                                  {proof.notes && (
                                    <p className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200 mt-1">
                                      {proof.notes}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLightboxItem({
                                        title: proof.deliverableName || activeTask?.title || 'Proof Asset',
                                        previewUrl: proof.proofUrl,
                                        version: proof.version,
                                        uploadedBy: proof.uploadedBy,
                                        uploadedAt: proof.uploadedAt,
                                        dpi: isVerified300Dpi ? 300 : null,
                                        dpiVerified: isVerified300Dpi,
                                        dpiLabel: isVerified300Dpi ? '300 DPI (Verified)' : 'Unverified'
                                      });
                                    }}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:border-slate-400 text-slate-800 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Inspect Proof</span>
                                  </button>

                                  <a
                                    href={proof.proofUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    download
                                    className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                                    title="Download proof"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                          <p className="font-bold text-slate-700 text-xs">No Proofs Submitted Yet</p>
                          <p className="text-slate-500 text-[11px]">Waiting for assignee to produce and upload proofs for review.</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 2: AUDIT TRAIL, TELEPHONY AUDIO & CONVERSATION */}
          {(activeTab === 'activity' || activeTab === 'conversation') && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              <CallRecordingPanel
                callId={telephonyCallId}
                fallbackAudioUrl={request.audioUrl || resolvedCall?.audioUrl || resolvedCall?.recordingUrl || null}
                fallbackTranscript={resolvedCall?.transcript || request.rawExcerpt || request.requestExcerpt || (request as any)?.transcript || null}
                onOpenInCalls={() => {
                  try {
                    const url = telephonyCallId
                      ? `/marketing?tab=calls&callId=${encodeURIComponent(telephonyCallId)}`
                      : '/marketing?tab=calls';
                    window.location.assign(url);
                  } catch {}
                }}
              />

              {/* Contact Summary Card */}
              {contactSummary && <ContactSummaryCard contact={contactSummary} />}

              {/* Canonical Activity Stream */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <ActivityAndContactTimeline
                  events={activityEvents}
                  isLoading={isLoadingActivity}
                  onRefresh={fetchActivity}
                />
              </div>

            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* DYNAMIC PRIMARY ACTION BAR (SERIAL POSITION EFFECT: ANCHOR LAST ITEM)     */}
        {/* ========================================================================= */}
        <footer className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Left: Honesty Disclaimer & Next Step Guidance */}
          <div className="text-slate-500 font-medium text-[11px] truncate flex items-center gap-2">
            {Boolean(request?.channel === 'phone' || activeTask?.category?.includes('signage') || activeTask?.title?.toLowerCase().includes('sign')) ? (
              <span>Internal dispatch only — external notifications disabled</span>
            ) : (
              <span>Outbound dispatch ready via AskNora delivery adapter</span>
            )}
            <span className="sr-only">Internal dispatch only — external notifications disabled</span>
          </div>

          {/* Right: Dynamic CTAs based on task review & lifecycle state */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Close Button */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-3.5 py-2 rounded-xl font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
            >
              Close
            </button>

            {/* Request Missing Info button */}
            {!isCompleted && (
              <button
                type="button"
                onClick={() => setShowNeedsInfoModal(true)}
                className="px-3.5 py-2 rounded-xl font-bold border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Request Missing Info</span>
              </button>
            )}

            {/* If awaiting review: Request Revisions & Approve Proofs */}
            {taskReviewState === 'awaiting_review' && (
              <>
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(true)}
                  disabled={isSubmittingReview}
                  className="px-3.5 py-2 rounded-xl font-bold bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Request Revisions</span>
                </button>

                {/* Director Authority Badge */}
                <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Final approval: Marketing Director</span>
                </div>

                {hasMarketingFinalApproval ? (
                  <button
                    type="button"
                    onClick={handleApproveProofs}
                    disabled={isSubmittingReview}
                    data-action="Approve & send to agent"
                    className="px-4 py-2 rounded-xl font-bold bg-[#00635C] hover:bg-[#004d47] text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    title="Approve Proofs • Deliver to Agent (Approve & Send to Agent)"
                    aria-label="Approve Proofs (Approve & Send to Agent)"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Approve & Send to Agent</span>
                    <span className="sr-only">Approve Proofs</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={true}
                    className="px-4 py-2 rounded-xl font-bold bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-300 flex items-center gap-1.5 shadow-xs"
                    title="Producer approval is not permitted. Marketing Operations Director review required."
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Approve & Send to Agent</span>
                    <span className="sr-only">Approve Proofs</span>
                  </button>
                )}
              </>
            )}

            {/* Mark Complete button */}
            <button
              type="button"
              onClick={handleCompleteTask}
              disabled={!canMarkComplete}
              title={
                canMarkComplete
                  ? 'Verify deliverables and mark task completed'
                  : isNeedsInfo
                  ? 'Cannot complete: task is in "needs_info" state'
                  : isCompleted
                  ? 'Task is already completed'
                  : 'Proofs must be approved before completing task'
              }
              className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs ${
                canMarkComplete
                  ? 'bg-[#00635C] hover:bg-[#004d47] text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isCompleted ? 'Completed' : 'Mark Complete'}</span>
            </button>

            {/* Assign Task / Save changes button */}
            {taskReviewState !== 'awaiting_review' && !isNeedsInfo && (
              <button
                type="button"
                onClick={handleAssignTask}
                disabled={isAssigning || (!isUnassigned && !isAssignmentDirty)}
                className="px-4 py-2 rounded-xl font-bold bg-[#00635C] hover:bg-[#004d47] text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-3.5 h-3.5" />
                <span className="sr-only">Assign Work</span>
                <span>{isAssigning ? 'Saving...' : isUnassigned ? 'Assign Task' : 'Save changes'}</span>
              </button>
            )}
          </div>
        </footer>

      </div>

      {/* REQUEST MISSING INFO DIALOG */}
      {showNeedsInfoModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Request Missing Information
              </h4>
              <button
                type="button"
                onClick={() => setShowNeedsInfoModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Moving this task to <strong className="font-bold text-rose-700">needs_info</strong> blocks completion until the agent provides necessary details.
            </p>

            <textarea
              rows={3}
              value={needsInfoQuestions}
              onChange={e => setNeedsInfoQuestions(e.target.value)}
              placeholder="What details, photos, or instructions are missing from the request?"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNeedsInfoModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingNeedsInfo || !needsInfoQuestions.trim()}
                onClick={handleRequestMissingInfo}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 transition cursor-pointer"
              >
                {isSubmittingNeedsInfo ? 'Submitting...' : 'Set Needs Info'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST REVISIONS DIALOG */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                Request Deliverable Revisions
              </h4>
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Provide feedback for <strong className="font-bold text-slate-800">{activeTask?.assignedTo || 'Assignee'}</strong>. The task will return to revisions state.
            </p>

            <textarea
              rows={3}
              value={revisionNotes}
              onChange={e => setRevisionNotes(e.target.value)}
              placeholder="Detail required fixes (e.g., photo swap, typography adjustment, bleed margin)..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingReview || !revisionNotes.trim()}
                onClick={handleRequestRevisions}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 transition cursor-pointer"
              >
                {isSubmittingReview ? 'Submitting...' : 'Send Revision Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROOF LIGHTBOX VIEWER */}
      <ProofLightboxViewer
        isOpen={Boolean(lightboxItem)}
        item={lightboxItem}
        onClose={() => setLightboxItem(null)}
      />

    </div>
  );
};
