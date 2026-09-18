/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TaskRequestDetailModal — Universal Manager & Dispatcher Review Modal
 * 
 * Serves as the central review surface for marketing, signage, operations, and office requests.
 * Features:
 * - Authoritative record chain: Telephony Call (optional) -> Canonical Request -> Canonical Tasks (with siblings)
 * - Explicit record IDs with one-click copy buttons
 * - Dynamic category & deliverable badges (Yard Sign, Rider, Pickup/Install, Date Needed By, Flyers, Social)
 * - 4 Contextual Tabs: Overview & Assignment, Source & Conversation, Work & Proofs, Audit Timeline
 * - Universal staff assignment with automatic Out-of-Office (OOO) backup detection and assignment notes
 * - Verifiable DPI honesty and storage honesty (no fabricated 300 DPI claims, real proof versions)
 * - Full audio playback & speaker-separated transcript search for phone requests (honest empty state for direct)
 * - Strict server lifecycle validation: blocks completion of unapproved or needs_info tasks
 * - Sibling tasks visibility to prevent orphaned multi-deliverable requests
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Phone,
  PhoneCall,
  PhoneOff,
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
  Send,
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
  ChevronUp
} from 'lucide-react';
import {
  CanonicalMarketingRequest,
  CanonicalMarketingTask
} from '../../../server/persistence/marketingCampaignsRepository';
import { ProofLightboxViewer, LightboxAssetItem } from './ProofLightboxViewer';
import { ActivityAndContactTimeline } from './ActivityAndContactTimeline';
import { ContactSummaryCard } from './ContactSummaryCard';
import type { CanonicalActivityEvent, ContactSummary } from '../../../server/services/activityHistoryService.js';
import {
  CANONICAL_WORKSPACE_ROSTER,
  resolveCanonicalStaffMember,
  isSarahJenkinsTask
} from '../../services/canonicalRoster';

export function formatNewYorkDateTime(dateStr?: string | null): string {
  if (!dateStr) return 'Not provided';
  try {
    const d = new Date(dateStr);
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
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { formatted: 'Not provided', relative: '' };
    
    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'long',
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
      const days = Math.round(diffHours / 24);
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
  
  const cleanInstructions = activeTask?.notes || (nonDialogueLines.length > 0 ? nonDialogueLines.join('\n') : (lines.length > 0 ? lines.map(l => l.replace(dialoguePattern, '')).join(' ') : ''));

  return {
    outcome: activeTask?.title || request.title || 'Requested deliverable',
    property: request.propertyAddress || 'Office / Operational',
    deliverable: activeTask?.category ? `${activeTask.category.toUpperCase()} — ${activeTask.title}` : (activeTask?.title || 'Listing collateral'),
    dueDate: activeTask?.dueAt || (request.createdAt ? new Date(new Date(request.createdAt).getTime() + 48 * 60 * 60 * 1000).toISOString() : null),
    missingInfo: request.status === 'needs_info' || activeTask?.status === 'needs_info' 
      ? (activeTask?.notes?.includes('Waiting on') ? activeTask.notes : 'Additional property details or photos required from broker')
      : 'None identified',
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

// Canonical operations directory staff derived from authoritative single roster
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
  // Additional out_of_office test fixture from operations_directory.json
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

  // Tab state: 'overview' | 'conversation' | 'work' | 'activity'
  const [activeTab, setActiveTab] = useState<'overview' | 'conversation' | 'work' | 'activity'>(initialTab || 'overview');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Canonical Activity & Contact History state
  const [activityEvents, setActivityEvents] = useState<CanonicalActivityEvent[]>([]);
  const [contactSummary, setContactSummary] = useState<ContactSummary | null>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState<boolean>(false);

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
  const [isLinkedRecordsExpanded, setIsLinkedRecordsExpanded] = useState<boolean>(false);
  const handleCopy = (id: string, text: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Notification / Alert banner state
  const [alertBanner, setAlertBanner] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAlertBanner({ type, message });
    setTimeout(() => setAlertBanner(null), 5000);
  };

  // Staff Assignment State
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [assignmentInstructions, setAssignmentInstructions] = useState<string>('');
  const [assignmentPriority, setAssignmentPriority] = useState<string>('normal');
  const [assignmentDueDate, setAssignmentDueDate] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  useEffect(() => {
    if (activeTask) {
      const resolved = resolveCanonicalStaffMember(activeTask.assignedToId || activeTask.assignedTo);
      setSelectedStaffId(resolved?.id || (isSarahJenkinsTask(activeTask) ? '' : (activeTask.assignedToId || '')));
      setAssignmentInstructions(activeTask.notes || '');
      setAssignmentPriority(activeTask.priority || 'normal');
      if (activeTask.dueAt) {
        try {
          setAssignmentDueDate(new Date(activeTask.dueAt).toISOString().split('T')[0]);
        } catch {
          setAssignmentDueDate('');
        }
      }
    }
  }, [activeTask]);

  // Out of office coverage preview
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

  // Audio player state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);

  // Transcript search state
  const [transcriptSearch, setTranscriptSearch] = useState<string>('');

  // Proof Lightbox state
  const [lightboxItem, setLightboxItem] = useState<LightboxAssetItem | null>(null);

  // Review Dialogs state
  const [showRevisionModal, setShowRevisionModal] = useState<boolean>(false);
  const [revisionNotes, setRevisionNotes] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Needs Info Dialog state
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

  // Header Deliverables & Deadline Badges (Yard Sign, Rider, Pickup/Install, Date Needed By, Flyers, Social)
  // Preserves exact logic tested by tests/ui/task-request-detail-modal-header-badges.spec.tsx
  const headerBadges = useMemo(() => {
    if (!request) return [];
    const rawContext = `${request.title || ''} ${request.rawExcerpt || ''} ${request.requestExcerpt || ''} ${childTasks.map(t => `${t.title} ${t.notes || ''} ${t.vendorName || ''}`).join(' ')}`.toLowerCase();

    const isSignage = childTasks.some(t => t.category === 'signage') || rawContext.includes('yard sign') || rawContext.includes('sign post') || rawContext.includes('rider') || rawContext.includes('signage') || rawContext.includes('lockbox');

    const badges: Array<{
      id: string;
      label: string;
      icon?: React.ReactNode;
      className: string;
    }> = [];

    if (isSignage) {
      // 1. Yard Sign Badge
      const hasYardSign = rawContext.includes('yard sign') || rawContext.includes('sign post') || rawContext.includes('for sale sign') || rawContext.includes('post install') || rawContext.includes('sign install') || rawContext.includes('install a sign') || (!rawContext.includes('rider only'));
      if (hasYardSign) {
        badges.push({
          id: 'badge-yard-sign',
          label: 'Yard Sign',
          className: 'bg-emerald-50 text-[#00635C] border border-emerald-200/80 font-bold'
        });
      }

      // 2. Rider Badge
      const hasRider = rawContext.includes('rider') || rawContext.includes('coming soon') || rawContext.includes('custom rider') || rawContext.includes('under contract rider') || rawContext.includes('waterfront rider');
      if (hasRider) {
        badges.push({
          id: 'badge-rider',
          label: 'Rider',
          className: 'bg-blue-50 text-blue-700 border border-blue-200/80 font-bold'
        });
      }

      // 3. Pickup vs Post Installation Badge
      const isPickup = rawContext.includes('pickup') || rawContext.includes('pick it up') || rawContext.includes('pick up') || rawContext.includes('office pickup');
      if (isPickup) {
        badges.push({
          id: 'badge-pickup',
          label: 'Pickup',
          className: 'bg-purple-50 text-purple-700 border border-purple-200/80 font-bold'
        });
      } else {
        badges.push({
          id: 'badge-install',
          label: 'Post Installation',
          className: 'bg-teal-50 text-teal-700 border border-teal-200/80 font-bold'
        });
      }
    } else {
      // Dynamic Deliverable Badges for Print / Social / Open House
      const hasFlyer = rawContext.includes('flyer') || rawContext.includes('brochure') || childTasks.some(t => t.category === 'print');
      const hasSocial = rawContext.includes('social') || rawContext.includes('instagram') || rawContext.includes('story') || rawContext.includes('carousel') || childTasks.some(t => t.category === 'social');
      const hasOpenHouse = rawContext.includes('open house') || childTasks.some(t => t.category === 'open_house');

      if (hasFlyer) {
        badges.push({
          id: 'badge-flyer',
          label: 'Property Flyer',
          className: 'bg-emerald-50 text-[#00635C] border border-emerald-200/80 font-bold'
        });
      }
      if (hasSocial) {
        badges.push({
          id: 'badge-social',
          label: 'Social Story Carousel',
          className: 'bg-blue-50 text-blue-700 border border-blue-200/80 font-bold'
        });
      }
      if (hasOpenHouse) {
        badges.push({
          id: 'badge-open-house',
          label: 'Open House Kit',
          className: 'bg-purple-50 text-purple-700 border border-purple-200/80 font-bold'
        });
      }
      if (badges.length === 0) {
        badges.push({
          id: 'badge-general',
          label: 'Listing Collateral',
          className: 'bg-slate-100 text-slate-700 border border-slate-200 font-bold'
        });
      }
    }

    // 4. Date Needed By Badge
    const taskDue = childTasks.find(t => t.dueAt)?.dueAt;
    const dueDateStr = taskDue || (request.createdAt ? new Date(new Date(request.createdAt).getTime() + 48 * 60 * 60 * 1000).toISOString() : null);

    if (dueDateStr) {
      const d = new Date(dueDateStr);
      let dateLabel = 'Monday 5:00 PM';
      if (!isNaN(d.getTime())) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const diffDays = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 6) {
          dateLabel = `${days[d.getDay()]} 5:00 PM`;
        } else {
          dateLabel = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
        }
      }

      badges.push({
        id: 'badge-date-needed',
        label: `Needed by: ${dateLabel}`,
        icon: <Calendar className="w-3 h-3 text-amber-600 shrink-0" />,
        className: 'bg-amber-50 text-amber-900 border border-amber-200/90 font-bold'
      });
    }

    return badges;
  }, [request, childTasks]);

  if (!isOpen || !request) return null;

  // Determine Department
  const departmentName = useMemo(() => {
    const raw = `${request.title || ''} ${activeTask?.category || ''} ${request.requestExcerpt || ''}`.toLowerCase();
    if (raw.includes('sign') || raw.includes('rider') || raw.includes('lockbox') || activeTask?.category === 'signage') {
      return 'Operations & Signage';
    }
    if (raw.includes('flyer') || raw.includes('postcard') || raw.includes('social') || raw.includes('marketing') || activeTask?.category === 'print' || activeTask?.category === 'social') {
      return 'Marketing & Collateral';
    }
    return 'Operations';
  }, [request, activeTask]);

  // Derived Task Review & Lifecycle States
  const taskStatus = activeTask?.status || request.status || 'request_received';
  const rawReviewState = activeTask?.reviewState;
  const taskReviewState = rawReviewState === 'in_review' ? 'awaiting_review' : rawReviewState;
  const isNeedsInfo = taskStatus === 'needs_info';
  const isApproved = taskReviewState === 'approved' || taskStatus === 'approved';
  const isCompleted = taskStatus === 'completed';

  // Determine if manager can mark complete
  const canMarkComplete = isApproved && !isNeedsInfo && !isCompleted;

  // Telephony call link
  const telephonyCallId = request.telephonyCallId || (activeTask as any)?.telephonyCallId || null;
  const hasTelephonyCall = Boolean(telephonyCallId);

  // Proofs list from active task
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

  // Sibling Tasks count
  const siblingTasks = childTasks.filter(t => t.id !== activeTaskId);

  // Audio Play / Pause handler
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

  // Assignment submission handler
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
          onUpdateTaskStatus(activeTask.id, 'in_progress', {
            assignedTo: assigneeName,
            assignedToRole: assigneeRole,
            notes: assignmentInstructions
          });
        }
        if (onTaskUpdated && data.task) {
          onTaskUpdated(data.task);
        }
        fetchActivity();
        const coverageMsg = data.coveringStaff ? ` (Covered by ${data.coveringStaff.fullName} due to Out-of-Office)` : '';
        showAlert(`Assigned to ${assigneeName}${coverageMsg} successfully!`);
      } else {
        showAlert(data.message || data.error || 'Failed to assign task.', 'error');
      }
    } catch (err: any) {
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
      const res = await fetch(`/api/marketing/tasks/${activeTask.id}/approve-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: 'Proofs approved by operations manager. Internal dispatch only.',
          performedBy: currentUser?.name || 'Operations Manager'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (onUpdateTaskStatus) {
          onUpdateTaskStatus(activeTask.id, 'approved');
        }
        if (onTaskUpdated && data.task) {
          onTaskUpdated(data.task);
        }
        fetchActivity();
        showAlert('Proof approved successfully! Ready for final completion.');
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

        // Trigger NORA agent inquiry outreach on parent request
        if (request?.id) {
          try {
            await fetch(`/api/marketing/requests/${request.id}/inquire-agent`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
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

  // Dynamic primary action calculation
  const isUnassigned = !activeTask?.assignedToId && !activeTask?.assignedTo;
  const isAssignmentDirty = Boolean(
    (selectedStaffId && selectedStaffId !== (activeTask?.assignedToId || '')) ||
    (assignmentInstructions && assignmentInstructions !== (activeTask?.notes || '')) ||
    (assignmentPriority && assignmentPriority !== (activeTask?.priority || 'normal'))
  );

  let primaryActionLabel = 'Mark Complete';
  let primaryActionHandler: () => void | Promise<void> = handleCompleteTask;
  let primaryActionDisabled = !canMarkComplete;
  let primaryActionColor = 'bg-[#00635C] hover:bg-[#004d47] text-white';

  if (isNeedsInfo) {
    primaryActionLabel = 'Request Missing Information';
    primaryActionHandler = () => setShowNeedsInfoModal(true);
    primaryActionDisabled = false;
    primaryActionColor = 'bg-rose-600 hover:bg-rose-700 text-white';
  } else if (isCompleted) {
    primaryActionLabel = 'Completed';
    primaryActionHandler = () => {};
    primaryActionDisabled = true;
    primaryActionColor = 'bg-slate-200 text-slate-400 cursor-not-allowed';
  } else if (taskReviewState === 'awaiting_review') {
    primaryActionLabel = 'Review Submitted Work';
    primaryActionHandler = () => setActiveTab('work');
    primaryActionDisabled = false;
    primaryActionColor = 'bg-indigo-600 hover:bg-indigo-700 text-white';
  } else if (taskReviewState === 'revisions_requested') {
    primaryActionLabel = 'View Revision Status';
    primaryActionHandler = () => setActiveTab('work');
    primaryActionDisabled = false;
    primaryActionColor = 'bg-amber-600 hover:bg-amber-700 text-white';
  } else if (canMarkComplete) {
    primaryActionLabel = 'Mark Complete';
    primaryActionHandler = handleCompleteTask;
    primaryActionDisabled = false;
    primaryActionColor = 'bg-[#00635C] hover:bg-[#004d47] text-white';
  } else if (isUnassigned || taskStatus === 'ready_for_review' || taskStatus === 'request_received') {
    if (isAssignmentDirty) {
      primaryActionLabel = 'Update Assignment';
      primaryActionHandler = handleAssignTask;
      primaryActionDisabled = isAssigning || !selectedStaffId;
      primaryActionColor = 'bg-[#00635C] hover:bg-[#004d47] text-white';
    } else {
      primaryActionLabel = 'Assign Work';
      primaryActionHandler = () => {
        setActiveTab('overview');
        const select = document.getElementById('staff-select');
        select?.focus();
      };
      primaryActionDisabled = false;
      primaryActionColor = 'bg-[#00635C] hover:bg-[#004d47] text-white';
    }
  }

  const renderCategoryDetails = () => {
    const cat = (activeTask?.category || request.category || 'marketing').toLowerCase();
    
    if (cat === 'signage') {
      return (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-500" />
            Signage &amp; Installation Details
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Property Location</span>
              <span className="font-bold text-slate-800 truncate block">{request.propertyAddress || 'Not provided'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Sign Post / Rider</span>
              <span className="font-bold text-slate-800 truncate block">{activeTask?.title || 'Yard Sign & Custom Rider'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Installation Method</span>
              <span className="font-bold text-slate-800 truncate block">{activeTask?.vendorName || 'Office Pickup'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Requested By</span>
              <span className="font-bold text-slate-800 truncate block">{request.agentName || 'Not provided'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Contact Phone/Email</span>
              <span className="font-bold text-slate-800 truncate block">{request.agentPhone || request.agentEmail || 'Not provided'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Date Needed By</span>
              <span className="font-bold text-slate-800 truncate block">{activeTask?.dueAt ? formatNewYorkDateTime(activeTask.dueAt) : 'Not provided'}</span>
            </div>
          </div>
        </section>
      );
    }

    if (cat === 'facilities') {
      return (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-500" />
            Location &amp; Service Details
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Facility / Office</span>
              <span className="font-bold text-slate-800 truncate block">{request.propertyAddress || 'Wilmington Central Office'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Service Needed</span>
              <span className="font-bold text-slate-800 truncate block">{activeTask?.title || request.title || 'Not provided'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Priority</span>
              <span className="font-bold text-slate-800 truncate block capitalize">{activeTask?.priority || 'normal'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Requested By</span>
              <span className="font-bold text-slate-800 truncate block">{request.agentName || 'Not provided'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Target Completion</span>
              <span className="font-bold text-slate-800 truncate block">{activeTask?.dueAt ? formatNewYorkDateTime(activeTask.dueAt) : 'Not provided'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Assigned Lead</span>
              <span className="font-bold text-slate-800 truncate block">{activeTask?.assignedTo || 'Unassigned'}</span>
            </div>
          </div>
        </section>
      );
    }

    if (cat === 'technology' || cat === 'tech' || cat === 'it' || cat === 'software') {
      return (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-500" />
            System &amp; Support Details
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">System / Platform</span>
              <span className="font-bold text-slate-800 truncate block">{activeTask?.vendorName || activeTask?.title || 'Follow Up Boss & Dotloop'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">License / Seat</span>
              <span className="font-bold text-slate-800 truncate block">{activeTask?.assignedTo ? `Seat: ${activeTask.assignedTo}` : 'Seat Reassignment'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Setup Credentials</span>
              <span className="font-bold text-slate-800 truncate block">SSO Google Workspace</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">2FA Status</span>
              <span className="font-bold text-slate-800 truncate block">Enforced Required</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Target Device</span>
              <span className="font-bold text-slate-800 truncate block">macOS / iPad Pro</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">SLA Target</span>
              <span className="font-bold text-slate-800 truncate block">{activeTask?.dueAt ? formatNewYorkDateTime(activeTask.dueAt) : 'Not provided'}</span>
            </div>
          </div>
        </section>
      );
    }

    if (cat === 'office' || cat === 'operations') {
      return (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-500" />
            Request Details
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Department / Office</span>
              <span className="font-bold text-slate-800 truncate block">{request.propertyAddress || 'Wilmington Operations'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Requested Action</span>
              <span className="font-bold text-slate-800 truncate block">{activeTask?.title || request.title || 'Not provided'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Requester</span>
              <span className="font-bold text-slate-800 truncate block">{request.agentName || 'Not provided'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Contact</span>
              <span className="font-bold text-slate-800 truncate block">{request.agentPhone || request.agentEmail || 'Not provided'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Due Date</span>
              <span className="font-bold text-slate-800 truncate block">{activeTask?.dueAt ? formatNewYorkDateTime(activeTask.dueAt) : 'Not provided'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Assigned Lead</span>
              <span className="font-bold text-slate-800 truncate block">{activeTask?.assignedTo || 'Unassigned'}</span>
            </div>
          </div>
        </section>
      );
    }

    // Default: Marketing & Collateral
    return (
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Building className="w-4 h-4 text-slate-500" />
          Property &amp; Marketing Details
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Property Address</span>
            <span className="font-bold text-slate-800 truncate block">{request.propertyAddress || 'Not provided'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Agent / Requester</span>
            <span className="font-bold text-slate-800 truncate block">{request.agentName || 'Not provided'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Contact</span>
            <span className="font-bold text-slate-800 truncate block">{request.agentPhone || request.agentEmail || 'Not provided'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Category</span>
            <span className="font-bold text-slate-800 truncate block capitalize">{activeTask?.category || 'Marketing'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Due Date</span>
            <span className="font-bold text-slate-800 truncate block">{activeTask?.dueAt ? formatNewYorkDateTime(activeTask.dueAt) : 'Not provided'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Vendor / Pickup</span>
            <span className="font-bold text-slate-800 truncate block">{activeTask?.vendorName || 'Not provided'}</span>
          </div>
        </div>
      </section>
    );
  };

  // Transcript dialogue turns with speaker segmentation
  const transcriptTurns = useMemo(() => {
    const raw = request.rawExcerpt || request.requestExcerpt || '';
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
  }, [request]);

  const filteredTurns = useMemo(() => {
    if (!transcriptSearch.trim()) return transcriptTurns;
    const term = transcriptSearch.toLowerCase();
    return transcriptTurns.filter(turn =>
      turn.text.toLowerCase().includes(term) || turn.speaker.toLowerCase().includes(term)
    );
  }, [transcriptTurns, transcriptSearch]);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-amber-200 text-amber-900 rounded-xs px-0.5 font-bold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Universal Task & Request Review Modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* TOP MODAL HEADER BANNER */}
        <header className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Task Title (Prominent Heading) */}
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {activeTask?.title || request.title || 'General Review Request'}
              </h2>
              {/* Location (Clear Subtitle) */}
              <p className="text-xs sm:text-sm text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{request.propertyAddress || 'Wilmington Operations'}</span>
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* STATUS & CONTEXT BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/70 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-2">
              {/* Department Badge */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-800">
                <Building className="w-3 h-3 text-slate-600" />
                {departmentName}
              </span>

              {/* Status Badge */}
              <span className={`px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] ${
                taskStatus === 'completed'
                  ? 'bg-slate-200 text-slate-800'
                  : taskStatus === 'needs_info'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : taskStatus === 'in_progress'
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {taskStatus.replace('_', ' ')}
              </span>

              {/* Review State Badge */}
              {taskReviewState && (
                <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${
                  taskReviewState === 'approved'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : taskReviewState === 'revisions_requested'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {taskReviewState.replace('_', ' ')}
                </span>
              )}

              {/* Priority */}
              <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                activeTask?.priority === 'urgent'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : activeTask?.priority === 'high'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {activeTask?.priority || 'normal'} priority
              </span>

              {/* Due Date (America/New_York) */}
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Due: {activeTask?.dueAt ? formatNewYorkDateTime(activeTask.dueAt) : 'Pending'}</span>
              </span>

              {/* Requester Details */}
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Requester: <strong className="font-semibold">{request.agentName || 'Agent'}</strong>
              </span>

              {/* Channel */}
              <span className="flex items-center gap-1 text-slate-500">
                {request.channel === 'phone' ? <Phone className="w-3 h-3 text-blue-500" /> : <Mail className="w-3 h-3 text-indigo-500" />}
                Via {request.channel || 'phone'}
              </span>

              {/* Header Deliverable Badges (Yard Sign, Rider, Pickup/Install, etc.) */}
              {headerBadges.map(badge => (
                <span
                  key={badge.id}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] ${badge.className}`}
                >
                  {badge.icon}
                  {badge.label}
                </span>
              ))}
            </div>

            {/* Current Assignee and OOO Coverage */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Assignee:</span>
              <span className="font-bold text-slate-800">
                {activeTask?.assignedTo || 'Unassigned'}
              </span>
              {activeTask?.coveringStaffName && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  OOO Covered by: {activeTask.coveringStaffName}
                </span>
              )}
            </div>
          </div>

          {/* COLLAPSIBLE LINKED RECORDS BAR */}
          <div className="bg-slate-100/90 rounded-xl p-2.5 border border-slate-200 text-[11px] font-mono text-slate-600 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 font-sans">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Linked Records:</span>
                {telephonyCallId && (
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5" /> Call
                  </span>
                )}
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-semibold flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" /> Request
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold flex items-center gap-1">
                  <CheckCheck className="w-2.5 h-2.5" /> Active Task
                </span>
                {childTasks.length > 1 && (
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold flex items-center gap-1">
                    <Layers className="w-2.5 h-2.5 text-amber-600" />
                    <span>{childTasks.length} deliverables in this request</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsLinkedRecordsExpanded(!isLinkedRecordsExpanded)}
                className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 font-medium px-2 py-0.5 rounded hover:bg-slate-200/80 transition cursor-pointer"
                aria-expanded={isLinkedRecordsExpanded}
              >
                <span>{isLinkedRecordsExpanded ? 'Collapse IDs' : 'Inspect Full IDs'}</span>
                {isLinkedRecordsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Collapsible Details */}
            <div className={`pt-2 border-t border-slate-200/80 ${isLinkedRecordsExpanded ? 'block' : 'hidden'} transition-all`}>
              <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Telephony Call ID */}
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

                  {/* Canonical Request ID */}
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

                  {/* Canonical Task ID */}
                  {activeTask && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-sans font-medium text-[10px] uppercase">Active Task:</span>
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

                {/* Workspace Tenant */}
                <div className="text-[10px] font-sans text-slate-500">
                  Workspace: <strong className="font-mono text-slate-700">{request.workspaceId || 'ws_wilmington'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* ALERT NOTIFICATION TOAST */}
          {alertBanner && (
            <div className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-in slide-in-from-top-1 ${
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

          {/* TABS NAVIGATION */}
          <nav aria-label="Modal Sections" className="flex items-center gap-1 border-b border-slate-200 -mb-4 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2.5 font-bold text-xs border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-[#00635C] text-[#00635C]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Overview & Assignment</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('conversation')}
              className={`px-4 py-2.5 font-bold text-xs border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'conversation'
                  ? 'border-[#00635C] text-[#00635C]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Source & Conversation</span>
              {hasTelephonyCall && (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('work')}
              className={`px-4 py-2.5 font-bold text-xs border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'work'
                  ? 'border-[#00635C] text-[#00635C]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Work & Proofs</span>
              {submittedProofs.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                  {submittedProofs.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-2.5 font-bold text-xs border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'activity'
                  ? 'border-[#00635C] text-[#00635C]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Activity &amp; Contact</span>
              {activityEvents.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold font-mono">
                  {activityEvents.length}
                </span>
              )}
            </button>
          </nav>
        </header>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: OVERVIEW & ASSIGNMENT */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* SIBLING DELIVERABLES WARNING & SWITCHER */}
              {childTasks.length > 1 && (
                <section className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-700" />
                      <h3 className="font-bold text-sm text-amber-900">
                        Multi-Deliverable Request ({childTasks.length} Tasks)
                      </h3>
                    </div>
                    <span className="text-xs text-amber-700">
                      Coordinate deliverables to ensure none are missed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {childTasks.map(t => {
                      const isCurrent = t.id === activeTaskId;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setActiveTaskId(t.id)}
                          className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                            isCurrent
                              ? 'bg-white border-[#00635C] shadow-sm ring-1 ring-[#00635C]'
                              : 'bg-white/80 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className={`font-bold text-xs truncate ${isCurrent ? 'text-[#00635C]' : 'text-slate-800'}`}>
                              {t.title}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              Assignee: <strong className="font-semibold">{t.assignedTo || 'Unassigned'}</strong>
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.status === 'completed'
                              ? 'bg-slate-100 text-slate-700'
                              : t.status === 'in_progress'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {t.status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* REQUEST BRIEF & CATEGORY-AWARE DETAILS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Request Brief (Deterministic verified facts, no raw dialogue transcript) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#00635C]" />
                      Request Brief
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Received {request.receivedAt || 'recently'}
                    </span>
                  </div>

                  {(() => {
                    const brief = extractCleanBrief(request, activeTask);
                    return (
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Requested Deliverable</span>
                            <span className="font-bold text-slate-800 block mt-0.5">{brief.outcome}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Property / Location</span>
                            <span className="font-bold text-slate-800 block mt-0.5">{brief.property}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Target SLA</span>
                            <span className="font-bold text-slate-800 block mt-0.5">{brief.dueDate ? formatNewYorkDateTime(brief.dueDate) : 'Standard Turnaround'}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Missing Information</span>
                            <span className={`font-bold block mt-0.5 ${brief.missingInfo !== 'None identified' ? 'text-rose-700' : 'text-slate-700'}`}>
                              {brief.missingInfo}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-500 block">Requester Instructions</span>
                          <p className="text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                            {brief.instructions}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </section>

                {/* Category-Aware Details Panel */}
                {renderCategoryDetails()}
              </div>

              {/* UNIVERSAL ASSIGNMENT & DELEGATION PANEL */}
              <section className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#00635C]" />
                    <h3 className="font-black text-sm text-slate-900">
                      Assignment &amp; Instructions
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">
                    Assign task to qualified staff member with automated OOO fallback
                  </span>
                </div>

                {/* Sarah Jenkins warning guard */}
                {isSarahJenkinsTask(activeTask) && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-2 text-amber-900 text-xs font-medium" data-testid="sarah-jenkins-task-warning">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <div>
                      <span className="font-bold">⚠️ Invalid Assignee Detected:</span> This task was previously assigned to Sarah Jenkins, who is not a valid team member. Please select a canonical team member below to reassign.
                    </div>
                  </div>
                )}

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Staff Picker */}
                  <div className="sm:col-span-1">
                    <label htmlFor="staff-select" className="block text-xs font-bold text-slate-700 mb-1">
                      Assignee
                    </label>
                    <select
                      id="staff-select"
                      value={selectedStaffId}
                      onChange={e => setSelectedStaffId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00635C]"
                    >
                      <option value="">-- Select Staff Member --</option>
                      {CANONICAL_STAFF.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.fullName} — {member.title || member.role} {member.status === 'out_of_office' ? '(Out of Office)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label htmlFor="priority-select" className="block text-xs font-bold text-slate-700 mb-1">
                      Priority
                    </label>
                    <select
                      id="priority-select"
                      value={assignmentPriority}
                      onChange={e => setAssignmentPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00635C]"
                    >
                      <option value="normal">Normal Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label htmlFor="due-date-input" className="block text-xs font-bold text-slate-700 mb-1">
                      Target Due Date
                    </label>
                    <input
                      id="due-date-input"
                      type="date"
                      value={assignmentDueDate}
                      onChange={e => setAssignmentDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00635C]"
                    />
                  </div>
                </div>

                {/* Out of office warning */}
                {selectedStaffMember?.status === 'out_of_office' && coveringStaffMember && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">
                        {selectedStaffMember.fullName} is currently Out of Office.
                      </p>
                      <p className="mt-0.5 text-amber-800">
                        Reason: {selectedStaffMember.outOfOfficeReason || 'Leave'}. Tasks will be actively covered by <strong className="font-bold">{coveringStaffMember.fullName}</strong> ({coveringStaffMember.title || coveringStaffMember.role}).
                      </p>
                    </div>
                  </div>
                )}

                {/* Assignment Instructions */}
                <div>
                  <label htmlFor="instructions-input" className="block text-xs font-bold text-slate-700 mb-1">
                    Production Instructions & Notes
                  </label>
                  <textarea
                    id="instructions-input"
                    rows={2}
                    value={assignmentInstructions}
                    onChange={e => setAssignmentInstructions(e.target.value)}
                    placeholder="Provide specific deliverable instructions, sizing standards, or vendor notes..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00635C]"
                  />
                </div>

                {/* Confirm Assignment Button */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-500">
                    {isNeedsInfo ? (
                      <span className="text-rose-600 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Cannot assign while in "needs_info" state.
                      </span>
                    ) : (
                      <span>Updating assignment transitions task to "In Progress"</span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isAssigning || isNeedsInfo || !selectedStaffId}
                    onClick={handleAssignTask}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00635C] hover:bg-[#004d47] text-white disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isAssigning ? 'Assigning...' : 'Confirm Assignment'}</span>
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: SOURCE & CONVERSATION */}
          {activeTab === 'conversation' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* AUDIO PLAYER (ONLY IF TELEPHONY CALL EXISTS) */}
              {hasTelephonyCall ? (
                <section className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-emerald-400" />
                      <h3 className="font-bold text-sm text-white">
                        Inbound Phone Call Recording
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      Call ID: {telephonyCallId}
                    </span>
                  </div>

                  <audio
                    ref={audioRef}
                    src={request.audioUrl || `/api/marketing/calls/${telephonyCallId}/audio`}
                    onTimeUpdate={() => {
                      if (audioRef.current) {
                        setAudioCurrentTime(audioRef.current.currentTime);
                      }
                    }}
                    onLoadedMetadata={() => {
                      if (audioRef.current) {
                        setAudioDuration(audioRef.current.duration);
                      }
                    }}
                    onEnded={() => setIsPlayingAudio(false)}
                    className="hidden"
                  />

                  {/* Audio Controls */}
                  <div className="flex items-center gap-4 pt-1">
                    <button
                      type="button"
                      onClick={handleToggleAudio}
                      className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition cursor-pointer shadow-md shrink-0"
                      title={isPlayingAudio ? 'Pause' : 'Play'}
                    >
                      {isPlayingAudio ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>

                    <div className="flex-1 space-y-1">
                      <input
                        type="range"
                        min="0"
                        max={audioDuration || 100}
                        value={audioCurrentTime}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setAudioCurrentTime(val);
                          if (audioRef.current) {
                            audioRef.current.currentTime = val;
                          }
                        }}
                        className="w-full accent-emerald-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>{Math.floor(audioCurrentTime / 60)}:{Math.floor(audioCurrentTime % 60).toString().padStart(2, '0')}</span>
                        <span>{Math.floor(audioDuration / 60)}:{Math.floor(audioDuration % 60).toString().padStart(2, '0')}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.muted = !audioMuted;
                          setAudioMuted(!audioMuted);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                </section>
              ) : (
                <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2">
                  <PhoneOff className="w-8 h-8 text-slate-400 mx-auto" />
                  <h3 className="font-bold text-sm text-slate-800">
                    Direct Inbound Request ({request.channel || 'web/portal'})
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    This request was submitted directly via {request.channel || 'portal'}. No automated telephony call recording is associated with this record.
                  </p>
                </section>
              )}

              {/* SPEAKER-SEPARATED TRANSCRIPT VIEWER */}
              <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-500" />
                    <h3 className="font-bold text-sm text-slate-900">
                      Request Transcript & Dialogue
                    </h3>
                  </div>

                  {/* Search / Filter dialogue */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search dialogue..."
                      value={transcriptSearch}
                      onChange={e => setTranscriptSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00635C]"
                    />
                  </div>
                </div>

                {/* Dialogue turns */}
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {filteredTurns.length > 0 ? (
                    filteredTurns.map(turn => {
                      const isAgent = turn.speaker.toLowerCase().includes('caller') || turn.speaker.toLowerCase().includes('agent') || turn.speaker.toLowerCase().includes('matt') || turn.speaker.toLowerCase().includes('broker');
                      return (
                        <div
                          key={turn.id}
                          className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                            isAgent
                              ? 'bg-blue-50/80 border border-blue-100 text-blue-950 mr-auto'
                              : 'bg-emerald-50/80 border border-emerald-100 text-emerald-950 ml-auto text-right'
                          }`}
                        >
                          <span className="font-bold text-[11px] uppercase tracking-wider block mb-1 opacity-70">
                            {turn.speaker}
                          </span>
                          <p className="whitespace-pre-wrap font-sans text-left">
                            {highlightText(turn.text, transcriptSearch)}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400">
                      No matching dialogue lines found.
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* TAB 3: WORK & PROOFS */}
          {activeTab === 'work' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* DELIVERABLE SPECIFICATIONS */}
              <section className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  Deliverable Technical Specifications
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Category</span>
                    <span className="font-bold text-slate-800">{activeTask?.category || 'Standard Collateral'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Print Target DPI</span>
                    <span className="font-bold text-slate-800">
                      {activeTask?.category === 'signage' || activeTask?.category === 'print' ? '300 DPI Standard' : '72 DPI (Screen)'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Print Bleed</span>
                    <span className="font-bold text-slate-800">
                      {activeTask?.category === 'print' ? '0.125 in' : 'None'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Drive Staging</span>
                    <a
                      href={request.driveFolderUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#00635C] hover:underline flex items-center gap-1"
                    >
                      <span>{request.driveFolderUrl ? 'Open Drive' : 'Local Archive'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </section>

              {/* SUBMITTED PROOFS HISTORY (VERIFIABLE DPI HONESTY) */}
              <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#00635C]" />
                    <h3 className="font-black text-sm text-slate-900">
                      Submitted Deliverables & Proof History
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Strict DPI & Asset Verification
                  </span>
                </div>

                {submittedProofs.length > 0 ? (
                  <div className="space-y-4">
                    {submittedProofs.map((proof, idx) => {
                      const isVerified300Dpi = proof.fileMetadata?.dpi === 300 || proof.validationStatus === 'valid_300dpi';
                      return (
                        <div
                          key={`proof_${proof.version || idx}`}
                          className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded font-bold text-xs bg-indigo-100 text-indigo-900">
                                Version {proof.version}
                              </span>

                              {/* Verifiable DPI honesty */}
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
                                {proof.proofUrl.includes('storage.googleapis.com') ? 'Cloud Storage' : proof.proofUrl.includes('drive.google.com') ? 'Google Drive' : 'Asset Link'}
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

                          {/* Proof Actions */}
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
                              className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:border-slate-400 text-slate-800 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Inspect Proof</span>
                            </button>

                            <a
                              href={proof.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-600 transition cursor-pointer"
                              title="Open in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
                    <Folder className="w-8 h-8 text-slate-300 mx-auto" />
                    <h4 className="font-bold text-xs text-slate-700">
                      No Proofs Submitted Yet
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Waiting for assignee ({activeTask?.assignedTo || 'Unassigned'}) to stage production assets and submit them for manager review.
                    </p>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 4: ACTIVITY & CONTACT HISTORY */}
          {activeTab === 'activity' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <ContactSummaryCard
                contactSummary={contactSummary}
                loading={isLoadingActivity}
              />

              <ActivityAndContactTimeline
                events={activityEvents}
                currentTaskId={activeTask?.id}
                currentRequestId={request?.id}
                viewRole="manager"
                loading={isLoadingActivity}
                onRefresh={fetchActivity}
              />
            </div>
          )}

        </div>

        {/* FIXED FOOTER / MANAGER ACTION BAR */}
        <footer className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left Actions & Safe Dispatch Notice */}
          <div className="flex flex-wrap items-center gap-2">
            {!isNeedsInfo && (
              <button
                type="button"
                onClick={() => setShowNeedsInfoModal(true)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-rose-200 text-rose-800 hover:bg-rose-50 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Request Missing Info</span>
              </button>
            )}

            <span className="text-[11px] text-slate-400 font-medium">
              Internal dispatch only — external notifications disabled
            </span>
          </div>

          {/* Right Actions: Secondary Review Actions + State-Aware Primary Dynamic Action */}
          <div className="flex items-center gap-2">
            {/* Secondary Review Actions when awaiting review */}
            {taskReviewState === 'awaiting_review' && (
              <>
                {activeTab !== 'work' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('work')}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Review Submitted Work</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowRevisionModal(true)}
                  disabled={isSubmittingReview}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Request Revisions</span>
                </button>

                <button
                  type="button"
                  onClick={handleApproveProofs}
                  disabled={isSubmittingReview}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Approve Proofs</span>
                </button>
              </>
            )}

            {/* Contextual Action for Revisions Requested */}
            {taskReviewState === 'revisions_requested' && activeTab !== 'work' && (
              <button
                type="button"
                onClick={() => setActiveTab('work')}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>View Revision Status</span>
              </button>
            )}

            {/* Contextual Action for Needs Info */}
            {isNeedsInfo && (
              <button
                type="button"
                onClick={() => setShowNeedsInfoModal(true)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Request Missing Information</span>
              </button>
            )}

            {/* Contextual Action for Unassigned or Dirty Assignment */}
            {(isUnassigned || taskStatus === 'ready_for_review' || taskStatus === 'request_received') && !isNeedsInfo && taskReviewState !== 'awaiting_review' && (
              <button
                type="button"
                onClick={isAssignmentDirty ? handleAssignTask : () => {
                  setActiveTab('overview');
                  document.getElementById('staff-select')?.focus();
                }}
                disabled={isAssigning || (isAssignmentDirty && !selectedStaffId)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#00635C] hover:bg-[#004d47] text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <User className="w-3.5 h-3.5" />
                <span>{isAssignmentDirty ? 'Update Assignment' : 'Assign Work'}</span>
              </button>
            )}

            {/* Terminal Lifecycle Action: Mark Complete */}
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
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs ${
                canMarkComplete
                  ? 'bg-[#00635C] hover:bg-[#004d47] text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isCompleted ? 'Completed' : 'Mark Complete'}</span>
            </button>
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
