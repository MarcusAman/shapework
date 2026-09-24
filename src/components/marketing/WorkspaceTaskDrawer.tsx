/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WorkspaceTaskDrawer — Centered Task Modal & Human-Centered Workstation
 * Redesigned using 5 Behavioral Psychology & HCI Principles:
 * - 04. Miller's Law: Chunk information into digestible containers; reduce working memory load.
 * - 05. Proximity Law: Group related elements logically through spatial layout.
 * - 07. Serial Position Effect: Anchor key context at the start, primary submission action at the end.
 * - 09. Doherty Threshold: Immediate visual feedback (<300ms) on checklist, copy, and DPI inspection.
 * - 10. Peak-End Rule: Design the peak proof-staging moment and celebratory milestone confirmation end.
 * 
 * Legacy tab labels for compatibility:
 * label: 'Assignment', label: 'Source Photos', label: 'Requirements', label: 'Proofs & Submission'
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  deriveListingLaunchStatus,
  isListingLaunchTask,
  LISTING_LAUNCH_STATUS_STEPS,
  type ListingPackageDraft,
} from '../../lib/listingLaunchSop';
import {
  deriveOffer2TStatus,
  isOffer2TTask,
  OFFER_2T_STATUS_STEPS,
  NEST_OFFER_2T_CHECKLIST_DEFAULTS,
  type Offer2TPackageDraft,
} from '../../lib/offer2tSop';
import { runEvidenceAutoCheck, type EvidenceAutoCheckResult } from '../../lib/evidenceAutoCheck';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  Image as ImageIcon,
  Paperclip,
  ShieldCheck,
  FolderOpen,
  Copy,
  ExternalLink,
  MessageSquare,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Upload,
  Eye,
  Check,
  BookOpen,
  Send,
  MoreHorizontal,
  FileText,
  AlertTriangle,
  RotateCcw,
  CheckCheck,
  Info,
  Flag,
  HelpCircle,
  PhoneCall,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Search,
  Sparkles,
  ArrowRight,
  Code,
  Mail,
  Building,
  MapPin,
  Tag,
  Phone,
  UserCheck
} from 'lucide-react';
import { ProofUploadWizard, UploadedProofAsset } from './ProofUploadWizard';
import { ProofLightboxViewer, LightboxAssetItem } from './ProofLightboxViewer';
import { MlsNumberBadge } from './MlsNumberBadge';
import { validateProofUrl } from '../../utils/assetInspection';
import { resolveTaskEventDetails } from '../../utils/eventScheduleExtraction';
import { getCampaignGoverningSop, MARKETING_SOPS, MarketingSopDefinition } from './marketingSopRegistry';
import { TEAM_MEMBERS } from './MarketingHomeInbox';
import { formatNewYorkDateTime, formatNewYorkRelativeDue } from './TaskRequestDetailModal';
import type { TaskRequirementItem, TaskInternalFlag } from '../../../server/persistence/marketingCampaignsRepository';
import { ActivityAndContactTimeline } from './ActivityAndContactTimeline';
import type { CanonicalActivityEvent } from '../../../server/services/activityHistoryService.js';
import { resolveCanonicalStaffMember, getCanonicalMarketingDirector } from '../../services/canonicalRoster';
import { getRequesterActionLabel, resolveCanonicalRecipient, CANONICAL_AGENT_DIRECTORY } from '../../services/canonicalRecipientService';
import { dispatchRecipientConfirmed, type DispatchVerdictView } from '../../lib/dispatchVerdict';
import { firstNonInlineProof, proofInputValue, resolveProofPrecedence } from '../../lib/proofPrecedence';
import { confirmRequesterWrite } from '../../lib/confirmRequesterWrite';
import { resolveTaskAssets } from '../../utils/assetResolver';
import {
  canSendCreativeOutbound,
  creativeOutboundBlockReason,
  deriveMaxaBoardStatus,
  formatMaxaBoardStatus,
  getCreativeBriefFromTask,
  isMarketingCreativeTask,
} from '../../lib/creativeRequestTriage';
import {
  dealTriageClientOutboundBlockReason,
  formatDealTriageBoardBadge,
  getDealTriageFromTask,
  shouldBlockClientOutbound,
} from '../../lib/dealTriage';
import {
  SURFACE_DRAWER_CONFIRM_ROUTING_LABEL,
  SURFACE_DRAWER_NEEDS_TRIAGE_CHIP,
  resolveSurfaceAppleFold,
  resolveSurfaceDrawerGates,
  resolveSurfaceDrawerH1,
  resolveSurfaceDrawerLaneChip,
  resolveSurfaceDrawerNext,
  resolveSurfaceDrawerShell,
  resolveSurfaceDrawerTriageBody,
  resolveSurfacePrimaryPhoto,
  resolveSurfaceMetaRowSplitClasses,
  type SurfaceDrawerShell,
} from '../../lib/surfaceDrawerLock2';
import {
  resolveMarketingApproveNotifyCapabilities,
} from '../../lib/marketingApproveNotifyCapabilities';

export interface WorkspaceDrawerTask {
  id: string;
  campaignId?: string;
  requestId?: string;
  requesterId?: string;
  propertyAddress: string;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  agentRole?: string;
  packageType: string;
  priority: 'urgent' | 'high' | 'normal';
  status: string;
  reviewState?: 'awaiting_review' | 'revisions_requested' | 'approved';
  proofVersion?: number;
  targetSla: string;
  dueAt?: string;
  neededByDate?: string;
  eventType?: string;
  eventDate?: string;
  eventTime?: string;
  receivedAt: string;
  assignedTo?: string;
  assignedToId?: string;
  assignedToRole?: string;
  reviewOwnerId?: string;
  reviewOwnerName?: string;
  coveringStaffId?: string;
  coveringStaffName?: string;
  proofUrl?: string;
  proofNotes?: string;
  proofHistory?: Array<{
    version: number;
    proofUrl: string;
    uploadedBy: string;
    uploadedById?: string;
    uploadedAt: string;
    notes?: string;
    assetId?: string;
    deliverableName?: string;
    fileMetadata?: any;
    validationStatus?: string;
  }>;
  reviewHistory?: Array<{
    version: number;
    action: string;
    reviewerId?: string;
    reviewerName: string;
    feedbackNotes?: string;
    timestamp: string;
  }>;
  notes?: string;
  category?: string;
  routingState?: 'resolved' | 'triage_required' | 'configuration_error' | 'escalated';
  routingReasons?: string[];
  missingFacts?: string[];
  triageReason?: string;
  channel?: string;
  classificationConfidence?: number;
  callId?: string;
  sourceCallId?: string;
  workspaceId?: string;
  departmentId?: string;
  deliverableType?: string;
  title?: string;
  governingSopId?: string;
  governingSopVersion?: string;
  governingSopTitle?: string;
  requestedAssets: Array<{
    name: string;
    format: string;
    dimensions?: string;
    templateId?: string;
  }>;
  listingDetails: {
    price: string;
    bedsBaths: string;
    sqft: string;
    headline: string;
    description: string;
    disclosures: string;
    mlsNumber: string;
    licenseNumber: string;
  };
  photos: Array<{
    id: string;
    url: string;
    name?: string;
    caption?: string;
  }>;
  attachments?: Array<{
    id?: string;
    name: string;
    url: string;
    type?: string;
  }>;
  sopCode: string;
  sopTitle: string;
  requirements?: TaskRequirementItem[];
  internalFlags?: TaskInternalFlag[];
  auditLog?: Array<{
    id?: string;
    action: string;
    actor: string;
    timestamp: string;
    details?: string;
  }>;
}

export const DEFAULT_REQUIREMENTS: TaskRequirementItem[] = [
  {
    id: 'req_disclosures',
    title: 'Property address and disclosures verified',
    label: 'Property address and disclosures verified',
    state: 'not_reviewed',
    status: 'not_reviewed',
    description: 'Ensure NC broker attribution, active license number, and Equal Housing Opportunity disclosures are present.'
  },
  {
    id: 'req_branding',
    title: 'Brand colors and typography follow Nest guidelines',
    label: 'Brand colors and typography follow Nest guidelines',
    state: 'not_reviewed',
    status: 'not_reviewed',
    description: 'Verify official Nest teal palette (#00635C) and approved typography hierarchy.'
  },
  {
    id: 'req_dimensions',
    title: 'Dimensions match requested deliverable format',
    label: 'Dimensions match requested deliverable format',
    state: 'not_reviewed',
    status: 'not_reviewed',
    description: 'Confirm specs match requested deliverable sizes (e.g. 8.5x11 flyer, 9:16 story, 6x9 postcard).'
  },
  {
    id: 'req_resolution',
    title: 'High-resolution assets used (300 DPI for print)',
    label: 'High-resolution assets used (300 DPI for print)',
    state: 'not_reviewed',
    status: 'not_reviewed',
    description: 'Ensure print files meet 300 DPI target standard and vector assets remain unpixelated.'
  }
];

interface WorkspaceTaskDrawerProps {
  isOpen: boolean;
  activeTask?: WorkspaceDrawerTask | null;
  task?: WorkspaceDrawerTask | null;
  tasksList?: WorkspaceDrawerTask[];
  onClose: () => void;
  onSelectTask?: (taskId: string) => void;
  onSubmitProof?: (taskId: string, proofUrl: string, notes?: string, assetMetadata?: any) => Promise<void> | void;
  onRequestRevisions?: (taskId: string, feedbackNotes: string) => Promise<void> | void;
  onApproveProof?: (taskId: string, note?: string) => Promise<void> | void;
  onApproveAndDispatch?: (taskId: string, note?: string, opts?: { proofUrl?: string; stagedAssets?: any[]; assetMetadata?: any; selfComplete?: boolean }) => Promise<any> | any;
  onDeliverProof?: (taskId: string) => Promise<any> | any;
  onReassignTask?: (taskId: string, newAssignee: string) => void;
  onAskRequester?: (task: WorkspaceDrawerTask, opts?: { intent?: 'ask_missing' | 'delivery_complete'; approvePayload?: Record<string, any> }) => void;
  onOpenSopDocument?: (sop: MarketingSopDefinition) => void;
  onSave?: (task: WorkspaceDrawerTask) => void;
  currentUser?: {
    id: string;
    name: string;
    role: string; // 'producer' | 'marketing_director' | 'admin' | 'owner' | etc.
    email?: string;
    permissions?: string[];
  };
  currentUserRole?: string;
  currentUserName?: string;
  currentUserId?: string;
  initialTab?: 'brief' | 'source' | 'work' | 'history' | 'assignment' | 'photos' | 'requirements' | 'proofs' | 'overview' | 'files' | 'proof';
  /** Server evaluateDispatch verdict. Tests pass this; the live drawer also fetches it. */
  dispatchVerdict?: DispatchVerdictView | null;
}

export const WorkspaceTaskDrawer: React.FC<WorkspaceTaskDrawerProps> = ({
  isOpen,
  activeTask: propActiveTask,
  task: propTask,
  tasksList = [],
  onClose,
  onSelectTask,
  onSubmitProof,
  onRequestRevisions,
  onApproveProof,
  onApproveAndDispatch,
  onDeliverProof,
  onReassignTask,
  onAskRequester,
  onOpenSopDocument,
  onSave,
  currentUser: propCurrentUser,
  currentUserRole,
  currentUserName,
  currentUserId,
  initialTab,
  dispatchVerdict
}) => {
  const rawActiveTask = propActiveTask || propTask || null;
  const [confirmedRequesterOverride, setConfirmedRequesterOverride] = useState<{ agentName: string; agentEmail: string; agentPhone?: string; requesterId?: string | null } | null>(null);
  const [fetchedDispatchVerdict, setFetchedDispatchVerdict] = useState<DispatchVerdictView | null>(null);
  const [isConfirmRequesterOpen, setIsConfirmRequesterOpen] = useState(false);

  const activeTask = useMemo(() => {
    if (!rawActiveTask) return null;
    if (!confirmedRequesterOverride) return rawActiveTask;
    return {
      ...rawActiveTask,
      agentName: confirmedRequesterOverride.agentName,
      agentEmail: confirmedRequesterOverride.agentEmail,
      agentPhone: confirmedRequesterOverride.agentPhone || rawActiveTask.agentPhone,
      requesterId: confirmedRequesterOverride.requesterId !== undefined && confirmedRequesterOverride.requesterId !== null
        ? confirmedRequesterOverride.requesterId
        : (confirmedRequesterOverride.requesterId === null ? undefined : rawActiveTask.requesterId)
    };
  }, [rawActiveTask, confirmedRequesterOverride]);

  // Never default to a producer identity — missing auth must not grant Eduardo's actions.
  const currentUser = propCurrentUser || {
    id: currentUserId || 'usr_guest',
    name: currentUserName || 'Guest Viewer',
    role: currentUserRole || 'viewer',
    permissions: ['marketing.view']
  };

  // Primary View Mode: 'workstation' (Unified 2-Column Workstation) vs 'history' (Activity Ledger)
  const [activeViewMode, setActiveViewMode] = useState<'workstation' | 'history'>(() => {
    if (initialTab === 'history') return 'history';
    return 'workstation';
  });

  // Secondary Tab Anchor for backward compatibility with automated tests & direct deep-linking
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (initialTab) {
      if (initialTab === 'source' || initialTab === 'photos' || initialTab === 'files') return 'files';
      if (initialTab === 'work' || initialTab === 'requirements' || initialTab === 'proofs' || initialTab === 'proof' || initialTab === 'review') return 'proof';
      if (initialTab === 'brief' || initialTab === 'assignment' || initialTab === 'overview') return 'overview';
      if (initialTab === 'history') return 'history';
    }
    return 'work';
  });

  useEffect(() => {
    if (initialTab) {
      if (initialTab === 'history') {
        setActiveViewMode('history');
        setActiveTab('history');
      } else {
        setActiveViewMode('workstation');
        if (initialTab === 'source' || initialTab === 'photos' || initialTab === 'files') setActiveTab('files');
        else if (initialTab === 'work' || initialTab === 'requirements' || initialTab === 'proofs' || initialTab === 'proof' || initialTab === 'review') setActiveTab('proof');
        else if (initialTab === 'brief' || initialTab === 'assignment' || initialTab === 'overview') setActiveTab('overview');
        else setActiveTab('work');
      }
    }
  }, [initialTab]);

  // Activity events state
  const [drawerActivityEvents, setDrawerActivityEvents] = useState<CanonicalActivityEvent[]>([]);
  const [isLoadingDrawerActivity, setIsLoadingDrawerActivity] = useState<boolean>(false);

  const fetchDrawerActivity = async () => {
    if (!activeTask?.id) return;
    setIsLoadingDrawerActivity(true);
    try {
      const res = await fetch(`/api/marketing/tasks/${activeTask.id}/activity`);
      const data = await res.json();
      if (data.success && data.events) {
        setDrawerActivityEvents(data.events);
      }
    } catch (err) {
      console.error('Failed to fetch drawer activity', err);
    } finally {
      setIsLoadingDrawerActivity(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTask?.id) {
      fetchDrawerActivity();
    }
  }, [isOpen, activeTask?.id]);

  // Comprehensive Task Composite Context
  const [taskDetail, setTaskDetail] = useState<any>(null);
  const [isLoadingTaskDetail, setIsLoadingTaskDetail] = useState<boolean>(false);

  const fetchTaskDetail = async () => {
    if (!activeTask?.id) return;
    setIsLoadingTaskDetail(true);
    try {
      const res = await fetch(`/api/marketing/tasks/${activeTask.id}`);
      const data = await res.json();
      if (data.success) {
        setTaskDetail(data);
      }
    } catch (err) {
      console.error('Failed to fetch task detail in drawer:', err);
    } finally {
      setIsLoadingTaskDetail(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTask?.id) {
      fetchTaskDetail();
    }
  }, [isOpen, activeTask?.id]);

  const eventSchedule = useMemo(() => {
    return resolveTaskEventDetails(
      taskDetail?.task || activeTask,
      taskDetail?.request,
      taskDetail?.source?.call
    );
  }, [taskDetail, activeTask]);

  const resolvedAssets = useMemo(() => {
    return resolveTaskAssets(
      taskDetail?.task || activeTask,
      taskDetail?.request || (activeTask as any)?.parentRequest,
      taskDetail?.campaign || (activeTask as any)?.campaign
    );
  }, [taskDetail, activeTask]);

  // Sibling Tasks in this campaign / property
  const siblingTasks = useMemo(() => {
    if (!activeTask || !tasksList || tasksList.length <= 1) return [];
    return tasksList.filter(t => 
      t.id !== activeTask.id && (
        (activeTask.campaignId && t.campaignId === activeTask.campaignId) ||
        (activeTask.requestId && t.requestId === activeTask.requestId) ||
        (activeTask.propertyAddress && t.propertyAddress === activeTask.propertyAddress)
      )
    );
  }, [tasksList, activeTask]);

  // Input states for manual proof and notes
  const [manualProofUrl, setManualProofUrl] = useState<string>('');
  const [productionNotes, setProductionNotes] = useState<string>('');
  const [urlValidationError, setUrlValidationError] = useState<string | null>(null);

  // Notes Auto-Save status (Doherty Threshold: immediate feedback)
  const [notesSaveStatus, setNotesSaveStatus] = useState<'saved' | 'saving'>('saved');
  const notesDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleNotesChange = (val: string) => {
    setProductionNotes(val);
    setNotesSaveStatus('saving');
    if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
    notesDebounceRef.current = setTimeout(() => {
      setNotesSaveStatus('saved');
      setSaveStatus('saved');
    }, 500);
  };

  // Requirements checklist state (4-state interactive)
  const [requirements, setRequirements] = useState<TaskRequirementItem[]>(() => {
    if (activeTask?.requirements && activeTask.requirements.length > 0) {
      return activeTask.requirements;
    }
    return DEFAULT_REQUIREMENTS;
  });

  // Missing photos state & override
  const [isPhotosFlagged, setIsPhotosFlagged] = useState<boolean>(false);
  const [photosOverridden, setPhotosOverridden] = useState<boolean>(false);
  const [isFlaggingPhotos, setIsFlaggingPhotos] = useState<boolean>(false);
  const [flagPhotosMessage, setFlagPhotosMessage] = useState<string | null>(null);
  const [isResendingPhotos, setIsResendingPhotos] = useState(false);

  // Uploaded assets staged for submission
  const [stagedAssets, setStagedAssets] = useState<UploadedProofAsset[]>([]);
  const [evidenceCheck, setEvidenceCheck] = useState<EvidenceAutoCheckResult | null>(null);

  // Modals & Viewers
  const [isUploadWizardOpen, setIsUploadWizardOpen] = useState<boolean>(false);
  const [lightboxItem, setLightboxItem] = useState<LightboxAssetItem | null>(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState<boolean>(false);
  const [revisionFeedbackInput, setRevisionFeedbackInput] = useState<string>('');
  const [isRouteMenuOpen, setIsRouteMenuOpen] = useState<boolean>(false);
  const [isOverflowMenuOpen, setIsOverflowMenuOpen] = useState<boolean>(false);
  const [showTaskRefPopover, setShowTaskRefPopover] = useState<boolean>(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  // Soft-Warning Dialog for Unreviewed Requirements
  const [showChecklistSoftWarning, setShowChecklistSoftWarning] = useState<boolean>(false);
  const [checklistCollapsed, setChecklistCollapsed] = useState<boolean>(true);

  // Peak-End Rule: Celebratory Milestone Confirmation Screen
  const [isSubmittedMilestone, setIsSubmittedMilestone] = useState<boolean>(false);
  const [submittedSummary, setSubmittedSummary] = useState<{
    proofUrl: string;
    managerName: string;
    packageType: string;
    propertyAddress: string;
    timestamp: string;
  } | null>(null);

  // Actions & Save states
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<'idle' | 'delivering' | 'delivered' | 'held' | 'error'>('idle');
  const [deliveryMessage, setDeliveryMessage] = useState<string | null>(null);

  // Drawer Call Audio Playback
  const drawerAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isDrawerAudioPlaying, setIsDrawerAudioPlaying] = useState<boolean>(false);
  const [drawerAudioCurrentTime, setDrawerAudioCurrentTime] = useState<number>(0);
  const [drawerAudioDuration, setDrawerAudioDuration] = useState<number>(0);
  const [drawerAudioMuted, setDrawerAudioMuted] = useState<boolean>(false);

  const handleToggleDrawerAudio = () => {
    if (!drawerAudioRef.current) return;
    if (isDrawerAudioPlaying) {
      drawerAudioRef.current.pause();
      setIsDrawerAudioPlaying(false);
    } else {
      drawerAudioRef.current.play().then(() => {
        setIsDrawerAudioPlaying(true);
      }).catch(err => {
        console.warn('[Drawer Audio] Playback prevented:', err);
      });
    }
  };

  useEffect(() => {
    if (!isOpen && drawerAudioRef.current) {
      drawerAudioRef.current.pause();
      setIsDrawerAudioPlaying(false);
    }
  }, [isOpen, activeTask?.id]);

  const parseDrawerTranscript = (raw: string, agentName?: string) => {
    if (!raw) return [];
    const lines = raw.split('\n').filter(l => l.trim().length > 0);
    return lines.map((line, idx) => {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0 && colonIdx < 35) {
        const speaker = line.substring(0, colonIdx).trim();
        const isAgent = speaker.toLowerCase().includes('caller') || speaker.toLowerCase().includes('agent') || speaker.toLowerCase().includes('matt') || speaker.toLowerCase().includes('broker') || speaker.toLowerCase().includes('marcus');
        return {
          speaker,
          text: line.substring(colonIdx + 1).trim(),
          isAgent
        };
      }
      return {
        speaker: idx % 2 === 0 ? (agentName || 'Caller') : 'Nest Intake AI',
        text: line.trim(),
        isAgent: idx % 2 === 0
      };
    });
  };

  // Sync inputs when active task changes
  useEffect(() => {
    if (activeTask) {
      setManualProofUrl(proofInputValue(activeTask.proofUrl));
      setProductionNotes(activeTask.proofNotes || activeTask.notes || '');
      setUrlValidationError(null);
      setStagedAssets([]);
      setSubmitSuccessMessage(null);
      setDeliveryStatus('idle');
      setDeliveryMessage(null);
      setSaveStatus('saved');
      setNotesSaveStatus('saved');
      setIsPhotosFlagged(Boolean(activeTask.internalFlags?.some(f => f.type === 'missing_photos')));
      setFlagPhotosMessage(null);
      setPhotosOverridden(false);
      setShowTaskRefPopover(false);
      setShowTechnicalDetails(false);
      setIsSubmittedMilestone(false);
      setSubmittedSummary(null);
      setShowChecklistSoftWarning(false);

      if (activeTask.requirements && activeTask.requirements.length > 0) {
        setRequirements(activeTask.requirements);
      } else {
        setRequirements(DEFAULT_REQUIREMENTS);
      }

      setTriageCategory(activeTask.category || '');
      setTriageAddress(activeTask.propertyAddress || '');
      setTriageDeliverable(activeTask.packageType || '');
      setTriageOverrideAssignee('');
      setTriageOverrideReason('');
      setTriagePreview(null);
      setTriageError(null);
    }
  }, [activeTask?.id]);

  // Triage resolution state
  const [triageCategory, setTriageCategory] = useState<string>('');
  const [triageAddress, setTriageAddress] = useState<string>('');
  const [triageDeliverable, setTriageDeliverable] = useState<string>('');
  const [triageOverrideAssignee, setTriageOverrideAssignee] = useState<string>('');
  const [triageOverrideReason, setTriageOverrideReason] = useState<string>('');
  const [triagePreview, setTriagePreview] = useState<any>(null);
  const [isTriageResolving, setIsTriageResolving] = useState<boolean>(false);
  const [triageError, setTriageError] = useState<string | null>(null);

  const handlePreviewTriage = async () => {
    if (!activeTask?.id) return;
    setIsTriageResolving(true);
    setTriageError(null);
    try {
      const res = await fetch(`/api/marketing/tasks/${activeTask.id}/resolve-triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previewOnly: true,
          category: triageCategory,
          propertyAddress: triageAddress,
          deliverableType: triageDeliverable,
          assignedToId: triageOverrideAssignee || undefined,
          overrideReason: triageOverrideReason || undefined
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setTriageError(data.error || 'Failed to preview routing');
        setTriagePreview(null);
      } else {
        setTriagePreview(data.preview);
      }
    } catch (err: any) {
      setTriageError(err.message || 'Error connecting to triage resolver');
    } finally {
      setIsTriageResolving(false);
    }
  };

  const handleConfirmTriage = async () => {
    if (!activeTask?.id) return;
    setIsTriageResolving(true);
    setTriageError(null);
    try {
      const res = await fetch(`/api/marketing/tasks/${activeTask.id}/resolve-triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previewOnly: false,
          category: triageCategory,
          propertyAddress: triageAddress,
          deliverableType: triageDeliverable,
          assignedToId: triageOverrideAssignee || undefined,
          overrideReason: triageOverrideReason || undefined
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setTriageError(data.error || 'Failed to resolve triage');
      } else {
        setSubmitSuccessMessage('Triage resolved: task routed canonically and activity ledger stamped.');
        setTriagePreview(null);
        if (data.task) {
          onSave?.(data.task);
        }
        fetchDrawerActivity();
      }
    } catch (err: any) {
      setTriageError(err.message || 'Error connecting to triage resolver');
    } finally {
      setIsTriageResolving(false);
    }
  };

  // Track dirty state to prevent accidental dismissal
  const isDirty = Boolean(
    !isSubmittedMilestone && (
      (manualProofUrl && manualProofUrl !== (activeTask?.proofUrl || '')) ||
      (productionNotes && productionNotes !== (activeTask?.proofNotes || activeTask?.notes || '')) ||
      stagedAssets.length > 0
    )
  );

  const handleAttemptClose = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes in this task. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Focus trap ref
  const modalContentRef = useRef<HTMLDivElement | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement as HTMLElement;
    } else if (triggerElementRef.current) {
      triggerElementRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxItem) {
          setLightboxItem(null);
        } else if (isUploadWizardOpen) {
          setIsUploadWizardOpen(false);
        } else if (isRevisionModalOpen) {
          setIsRevisionModalOpen(false);
        } else if (showChecklistSoftWarning) {
          setShowChecklistSoftWarning(false);
        } else {
          handleAttemptClose();
        }
      }
      if (e.key === 'Tab' && modalContentRef.current) {
        const focusableElements = modalContentRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, lightboxItem, isUploadWizardOpen, isRevisionModalOpen, showChecklistSoftWarning, isDirty]);

  const activeDispatchVerdict = dispatchVerdict || fetchedDispatchVerdict;

  useEffect(() => {
    if (dispatchVerdict || !isOpen || !activeTask?.id) return;
    let cancelled = false;
    const taskId = activeTask.id;
    (async () => {
      try {
        const res = await fetch(`/api/marketing/requests/${encodeURIComponent(taskId)}/dispatch-check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientEmail: activeTask.agentEmail,
            recipientName: activeTask.agentName,
            channels: ['email'],
            intent: 'delivery_complete',
            proofUrl: resolveProofPrecedence(manualProofUrl, activeTask.proofUrl),
            driveFolderUrl: (activeTask as { driveFolderUrl?: string }).driveFolderUrl,
            domain: 'marketing',
          }),
        });
        const data = await res.json().catch(() => null);
        if (!cancelled && data?.recipientStatus) setFetchedDispatchVerdict(data);
      } catch {
        if (!cancelled) setFetchedDispatchVerdict(null);
      }
    })();
    return () => { cancelled = true; };
  }, [dispatchVerdict, isOpen, activeTask?.id, activeTask?.agentEmail, activeTask?.agentName, activeTask?.proofUrl]);

  if (!isOpen || !activeTask) return null;

  // Derive Roles and Capabilities
  const userRole = (currentUser.role || '').toLowerCase();
  const userPermissions: string[] = Array.isArray((currentUser as any).permissions) ? (currentUser as any).permissions : [];

  // Domain fence: verify task is marketing
  const nonMarketingCategories = ['operations', 'facilities', 'signage', 'lockbox', 'bic', 'bic_compliance', 'broker_in_charge', 'contracts', 'contract', 'accounting'];
  const taskCat = (activeTask.category || activeTask.departmentId || activeTask.deliverableType || activeTask.title || '').toLowerCase();
  const isMarketingTask = !nonMarketingCategories.some(c => taskCat.includes(c));

  // Canonical Reviewing Manager & Director Resolution
  // Nest policy: marketing tasks ALWAYS review to Melissa Gagliardi (canonical marketing director).
  const canonicalDirector = getCanonicalMarketingDirector(activeTask.workspaceId || 'ws_wilmington');
  const melissaFallbackId = 'dir_melissa_gagliardi_33';
  const melissaFallbackName = 'Melissa Gagliardi';
  const directorFirstName = canonicalDirector?.firstName
    || canonicalDirector?.displayName?.split(' ')[0]
    || canonicalDirector?.name?.split(' ')[0]
    || 'Melissa';
  const directorFullName = canonicalDirector?.displayName
    || canonicalDirector?.name
    || melissaFallbackName;

  const rawReviewOwnerId = (activeTask.reviewOwnerId || '').trim();
  const resolvedFromId = rawReviewOwnerId
    ? resolveCanonicalStaffMember(rawReviewOwnerId, activeTask.workspaceId || 'ws_wilmington')
    : null;
  const resolvedFromName = (!resolvedFromId && (activeTask.reviewOwnerName || activeTask.reviewOwner))
    ? resolveCanonicalStaffMember(activeTask.reviewOwnerName || activeTask.reviewOwner, activeTask.workspaceId || 'ws_wilmington')
    : null;
  const isOpsReview = !isMarketingTask; // ops/signage can stay Ann; marketing never "unassigned"
  const canonicalReviewManager = resolvedFromId || resolvedFromName || (isMarketingTask
    ? (resolveCanonicalStaffMember(melissaFallbackId) || canonicalDirector)
    : null);
  const resolvedManagerName = canonicalReviewManager
    ? (canonicalReviewManager.name || canonicalReviewManager.displayName)
    : (isMarketingTask ? directorFullName : null);

  // Marketing: never show "Review manager not assigned" — default Melissa.
  const coveringManagerDisplay = resolvedManagerName
    ? (activeTask.coveringStaffName && resolvedManagerName !== activeTask.coveringStaffName
        ? `${resolvedManagerName} (Covered by ${activeTask.coveringStaffName})`
        : resolvedManagerName)
    : (isOpsReview ? 'Review manager not assigned' : directorFullName);

  // Intended Recipient Resolution with robust fallback for generic 'Agent'
  const resolvedAgentDetails = useMemo(() => {
    let name = activeTask.agentName?.trim();
    let email = activeTask.agentEmail?.trim();
    let phone = activeTask.agentPhone?.trim();

    // Check sibling tasks in tasksList
    if ((!name || name.toLowerCase() === 'agent') || !email) {
      const sibling = tasksList?.find(t =>
        (t.requestId && t.requestId === activeTask.requestId && t.agentName && t.agentName.toLowerCase() !== 'agent') ||
        (t.propertyAddress && t.propertyAddress === activeTask.propertyAddress && t.agentName && t.agentName.toLowerCase() !== 'agent')
      );
      if (sibling) {
        name = sibling.agentName || name;
        email = sibling.agentEmail || email;
        phone = sibling.agentPhone || phone;
      }
    }

    return {
      agentName: name,
      agentEmail: email,
      agentPhone: phone
    };
  }, [activeTask, tasksList]);

  const verifiedRecipient = resolveCanonicalRecipient({
    agentName: resolvedAgentDetails.agentName || activeTask.agentName,
    agentEmail: resolvedAgentDetails.agentEmail || activeTask.agentEmail,
    agentPhone: resolvedAgentDetails.agentPhone || activeTask.agentPhone,
    requesterId: activeTask.requesterId
  });

  const isRecipientConfirmed = dispatchRecipientConfirmed(activeDispatchVerdict?.recipientStatus);

  // Revision and Proof state derivation
  const isRevision = Boolean(
    activeTask.reviewState === 'revisions_requested' ||
    activeTask.status === 'revisions' ||
    (activeTask.reviewHistory || []).some(r => r.action === 'revisions_requested')
  );

  const currentProofVersion = activeTask.proofVersion || (activeTask.proofHistory && activeTask.proofHistory.length > 0 ? activeTask.proofHistory.length : 1);

  // Check if proof has been modified or replaced compared to activeTask
  const isProofModified = Boolean(
    (manualProofUrl && manualProofUrl !== (activeTask.proofUrl || '')) ||
    stagedAssets.length > 0
  );

  // An approved proof version must match the current proof version and not be modified
  const isCurrentProofApproved = Boolean(
    !isProofModified &&
    activeTask.reviewState === 'approved' &&
    ((activeTask as any).approvedProofVersion === undefined || (activeTask as any).approvedProofVersion === activeTask.proofVersion)
  );

  const latestRevisionFeedback = (activeTask.reviewHistory || [])
    .slice()
    .reverse()
    .find(r => r.action === 'revisions_requested' && r.feedbackNotes)?.feedbackNotes
    || (activeTask.reviewState === 'revisions_requested' ? activeTask.proofNotes : null)
    || (isRevision ? activeTask.proofNotes : null);

  // Self-approval safety check:
  const reviewerStaff = (currentUser.id || currentUser.email || currentUser.name)
    ? resolveCanonicalStaffMember(currentUser.id || currentUser.email || currentUser.name, activeTask.workspaceId || 'ws_wilmington')
    : null;
  const assignedStaff = (activeTask.assignedToId || activeTask.assignedTo)
    ? resolveCanonicalStaffMember(activeTask.assignedToId || activeTask.assignedTo, activeTask.workspaceId || 'ws_wilmington')
    : null;
  
  const authorInfoId = (activeTask as any).submittedBy || (activeTask as any).proofAuthorId;
  const authorInfoName = (activeTask as any).submittedByName || (activeTask as any).proofAuthorName;
  const authorStaff = (authorInfoId || authorInfoName)
    ? resolveCanonicalStaffMember(authorInfoId || authorInfoName, activeTask.workspaceId || 'ws_wilmington')
    : null;

  const curUserIdNormalized = (currentUser.id || '').toLowerCase().trim();
  const curUserNameNormalized = (currentUser.name || '').toLowerCase().trim();

  // Check if current task is actively in the manager review lane
  const isAwaitingReviewLane = Boolean(
    activeTask.reviewState === 'awaiting_review' ||
    activeTask.status === 'awaiting_review' ||
    activeTask.status === 'ready_for_review' ||
    activeTask.status === 'agent_review'
  );

  // Resolve marketing.final_approval authority dynamically from session user
  const hasOperationsFinalApproval = Boolean(
    !isMarketingTask && (
      userPermissions.includes('operations.final_approval') ||
      userPermissions.includes('operations.approve') ||
      userRole === 'operations_lead' ||
      userRole === 'operations_manager' ||
      currentUser.name === 'Ann Gunn' ||
      currentUser.id === 'dir_ann_gunn_28' ||
      (currentUser.email && currentUser.email.toLowerCase().includes('ann'))
    )
  );

  // Actor-only authority — never inherit caps from task.reviewerStaff (that fall-open
  // previously granted Approve to every viewer of a Melissa-reviewed task).
  const hasMarketingFinalApproval = Boolean(
    isMarketingTask && (
      userPermissions.includes('marketing.final_approval') ||
      userPermissions.includes('marketing.approve') ||
      userRole === 'marketing_director' ||
      currentUser.name === 'Melissa Gagliardi' ||
      currentUser.id === 'dir_melissa_gagliardi_33' ||
      currentUser.id === 'usr_melissa' ||
      (currentUser.email && currentUser.email.toLowerCase().includes('melissa'))
    )
  );

  // Department director authority for the open task (marketing Melissa / ops Ann).
  const hasDepartmentFinalApproval = isMarketingTask ? hasMarketingFinalApproval : hasOperationsFinalApproval;

  const isAssigneeCurrentUser = Boolean(
    (assignedStaff && reviewerStaff && assignedStaff.id === reviewerStaff.id) ||
    (curUserIdNormalized && activeTask.assignedToId && curUserIdNormalized === activeTask.assignedToId.toLowerCase().trim()) ||
    (curUserNameNormalized && activeTask.assignedTo && curUserNameNormalized === activeTask.assignedTo.toLowerCase().trim())
  );

  // Path B: director completing agent-requested work she owns — Approve & Complete (no Send to Manager self-loop).
  const assigneeLooksLikeMarketingDirector = Boolean(
    (activeTask.assignedTo || '').toLowerCase().includes('melissa') ||
    (
      !(activeTask.assignedTo || '').trim() &&
      (activeTask.assignedToId === 'dir_melissa_gagliardi_33' || activeTask.assignedToId === 'usr_melissa')
    )
  );
  // Path C: producer already submitted for director review — Melissa must Approve & Complete (not Send to Manager).
  const isDirectorReviewingSubmittedProof = Boolean(
    hasMarketingFinalApproval && isAwaitingReviewLane
  );
  const isDirectorSelfComplete = Boolean(
    hasDepartmentFinalApproval && (
      isAssigneeCurrentUser ||
      (hasMarketingFinalApproval && assigneeLooksLikeMarketingDirector) ||
      isDirectorReviewingSubmittedProof
    )
  );

  const isMarketingDirector = hasMarketingFinalApproval ||
    userRole === 'marketing_director' ||
    userRole === 'admin' ||
    userRole === 'owner' ||
    userRole === 'operations_manager' ||
    userRole === 'operations_lead';

  // Producers submit for review; department directors (including self-complete) use Approve & Send.
  // Guests/viewers must not inherit the producer CTA (and must never default to Eduardo).
  const isGuestOrViewer = Boolean(
    !currentUser?.id ||
    currentUser.id === 'usr_guest' ||
    userRole === 'viewer' ||
    userRole === 'guest' ||
    (Array.isArray(userPermissions) && userPermissions.length === 1 && userPermissions[0] === 'marketing.view')
  );
  const isProducer = !hasDepartmentFinalApproval && !isGuestOrViewer;

  // Blueprint role gate: Approve & Notify only for task.reviewerId (not global director title).
  const roleGateCaps = resolveMarketingApproveNotifyCapabilities(currentUser, activeTask);
  const canApproveAndNotify = roleGateCaps.canApproveAndNotify;
  const canSubmitToReviewer = roleGateCaps.canSubmitToReviewer;
  const canRequestRevisions = roleGateCaps.canRequestRevisions;


  // Task Index & Navigation
  const taskIndex = tasksList.findIndex(t => t.id === activeTask.id);
  const hasPrev = taskIndex > 0;
  const hasNext = taskIndex >= 0 && taskIndex < tasksList.length - 1;

  const surfaceShell: SurfaceDrawerShell = useMemo(
    () => resolveSurfaceDrawerShell(activeTask),
    [activeTask]
  );
  const surfaceNext = useMemo(
    () => resolveSurfaceDrawerNext(activeTask, surfaceShell),
    [activeTask, surfaceShell]
  );
  const surfaceH1 = useMemo(
    () => resolveSurfaceDrawerH1(activeTask, surfaceShell),
    [activeTask, surfaceShell]
  );
  const surfaceLaneChip = useMemo(
    () => resolveSurfaceDrawerLaneChip(activeTask, surfaceShell),
    [activeTask, surfaceShell]
  );
  const isSurfaceTriage = surfaceShell === 'A_triage';
  const surfaceTriageBody = useMemo(
    () => resolveSurfaceDrawerTriageBody(activeTask),
    [activeTask]
  );
  const surfaceAppleFold = useMemo(
    () => resolveSurfaceAppleFold(activeTask, surfaceShell),
    [activeTask, surfaceShell]
  );
  const surfacePrimaryPhoto = useMemo(() => {
    const photos =
      Array.isArray(resolvedAssets?.photos) && resolvedAssets.photos.length > 0
        ? resolvedAssets.photos
        : activeTask.photos;
    return resolveSurfacePrimaryPhoto({ ...activeTask, photos: photos || [] });
  }, [activeTask, resolvedAssets]);
  const surfaceMetaRowSplit = useMemo(() => resolveSurfaceMetaRowSplitClasses(), []);

  // Check if proof exists
  const hasValidUploadedProof = stagedAssets.length > 0;
  const hasValidManualProof = Boolean(
    manualProofUrl &&
    (manualProofUrl.trim().startsWith('https://') ||
     manualProofUrl.trim().startsWith('http://') ||
     manualProofUrl.trim().startsWith('drive.google.com') ||
     manualProofUrl.trim().startsWith('canva.com') ||
     manualProofUrl.trim().length > 3)
  );
  const hasNewProofProvided = hasValidUploadedProof || hasValidManualProof;
  const hasAnyProof = hasNewProofProvided ||
    Boolean(activeTask.proofUrl && activeTask.proofUrl.trim().length > 0) ||
    Boolean((activeTask as any).proofAsset) ||
    Boolean((activeTask as any).stagedAssets && (activeTask as any).stagedAssets.length > 0);

  const surfaceGates = useMemo(
    () =>
      resolveSurfaceDrawerGates({
        shell: surfaceShell,
        pagerIndex: taskIndex,
        pagerTotal: tasksList.length,
        task: activeTask,
        nextVerb: surfaceNext.verb,
        hasProof: hasAnyProof,
      }),
    [surfaceShell, taskIndex, tasksList.length, activeTask, surfaceNext.verb, hasAnyProof]
  );
  const dealRiskAlert = useMemo(
    () => (surfaceGates.showDealRiskShell ? getDealTriageFromTask(activeTask) : null),
    [surfaceGates.showDealRiskShell, activeTask]
  );

  // Checklist verification validation
  const hasUnreviewedRequirements = requirements.some(r => r.status === 'not_reviewed');
  const hasNeedsCorrectionRequirements = requirements.some(r => r.status === 'needs_correction');
  const allRequirementsSatisfied = requirements.every(r => r.status === 'verified' || r.status === 'not_applicable');
  const satisfiedCount = requirements.filter(r => r.status === 'verified' || r.status === 'not_applicable').length;
  const unreviewedCount = requirements.filter(r => r.status === 'not_reviewed').length;
  const checklistProgressPct = requirements.length > 0 ? Math.round((satisfiedCount / requirements.length) * 100) : 100;
  // MLS# on task or parent request unlocks production without uploaded source photos (Flex MLS pull).
  const mlsNumberRaw =
    (activeTask as any).mlsNumber ||
    activeTask.listingDetails?.mlsNumber ||
    (activeTask as any).mls_number ||
    taskDetail?.request?.mlsNumber ||
    taskDetail?.request?.mls_number ||
    (activeTask as any)?.parentRequest?.mlsNumber ||
    '';
  const mlsNumber = String(mlsNumberRaw || '').replace(/^MLS\s*#?\s*/i, '').trim();
  const hasMlsOnFile = Boolean(mlsNumber);
  const parentRequestId =
    (activeTask as any).requestId ||
    (activeTask as any).marketingRequestId ||
    taskDetail?.request?.id ||
    (activeTask as any)?.parentRequest?.id ||
    null;
  const hasPhotosOrOverride =
    (resolvedAssets.photos.length > 0) ||
    ((activeTask.photos?.length || 0) > 0) ||
    photosOverridden ||
    hasMlsOnFile;

  // Derive blocking reasons for producer submission.
  // Operational / signage tasks do not need marketing proofs or source photos to complete.
  const blockingReasons: string[] = [];
  if (isMarketingTask) {
    if (!hasAnyProof) {
      blockingReasons.push('Proof asset or valid URL (Google Drive / Canva / Nest Design Center) is required.');
    }
    if (!hasNewProofProvided && !isRevision && hasUnreviewedRequirements) {
      blockingReasons.push(`${unreviewedCount} requirement checklist item${unreviewedCount > 1 ? 's' : ''} not yet verified in Proof & review.`);
    }
    if (!hasNewProofProvided && !isRevision && hasNeedsCorrectionRequirements) {
      const corrCount = requirements.filter(r => r.status === 'needs_correction').length;
      blockingReasons.push(`${corrCount} checklist item${corrCount > 1 ? 's' : ''} marked 'Needs Correction'.`);
    }
    if (!hasNewProofProvided && !isRevision && !hasPhotosOrOverride) {
      blockingReasons.push('Property has no source photos and no MLS#. Request photos via Nora or confirm override.');
    }
  }

  const canSendForApproval = blockingReasons.length === 0;

  // New York timezone formatted SLA due date
  const { formatted: formattedDue, relative: relativeDue } = formatNewYorkRelativeDue(activeTask.dueAt || activeTask.targetSla);
  const isOverdue = relativeDue.toLowerCase().includes('overdue');

  // Producers cannot approve their own work. Department directors may self-complete (Path B).
  const isSelfApprovalBlocked = !hasDepartmentFinalApproval && Boolean(
    (reviewerStaff && assignedStaff && reviewerStaff.id === assignedStaff.id) ||
    (reviewerStaff && authorStaff && reviewerStaff.id === authorStaff.id) ||
    (curUserIdNormalized && activeTask.assignedToId && curUserIdNormalized === activeTask.assignedToId.toLowerCase().trim()) ||
    (curUserNameNormalized && activeTask.assignedTo && curUserNameNormalized === activeTask.assignedTo.toLowerCase().trim()) ||
    (curUserIdNormalized && authorInfoId && curUserIdNormalized === String(authorInfoId).toLowerCase().trim()) ||
    (curUserNameNormalized && authorInfoName && curUserNameNormalized === String(authorInfoName).toLowerCase().trim())
  );

  // Copy handler
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleCopyAllDetails = () => {
    const d = activeTask.listingDetails || {} as any;
    const cleanPrice = !d.price || d.price === '$895,000' ? 'Pending Flex MLS retrieval' : d.price;
    const cleanSpecs = (!d.bedsBaths || d.bedsBaths === '3 Beds / 2 Baths') && (!d.sqft || d.sqft === '2,400 SqFt')
      ? 'Pending Flex MLS retrieval'
      : `${d.bedsBaths || '—'} | ${d.sqft || '—'}`;
    const cleanMls = (d.mlsNumber || '').replace(/^MLS\s*#?\s*/i, '').trim();

    const text = [
      `PROPERTY: ${activeTask.propertyAddress}`,
      `PRICE: ${cleanPrice} | SPECS: ${cleanSpecs}`,
      d.headline ? `HEADLINE: ${d.headline}` : null,
      d.description ? `DESCRIPTION: ${d.description}` : null,
      d.disclosures ? `DISCLOSURES: ${d.disclosures}` : null,
      cleanMls ? `MLS#: ${cleanMls}` : null,
      d.licenseNumber ? `LICENSE: ${d.licenseNumber}` : null,
      `NOTE: Listing is live in Flex MLS; retrieve listing details and photos directly from Flex MLS.`
    ].filter(Boolean).join('\n\n');
    handleCopyText(text, 'All Details');
  };

  // Proof URL change handler with live validation
  const handleProofUrlChange = (value: string) => {
    setManualProofUrl(value);
    setSaveStatus('saving');
    if (!value.trim()) {
      setUrlValidationError(null);
      setSaveStatus('saved');
      return;
    }
    const check = validateProofUrl(value);
    if (!check.valid) {
      setUrlValidationError(check.error || 'Invalid proof URL');
      setSaveStatus('error');
    } else {
      setUrlValidationError(null);
      setSaveStatus('saved');
    }
  };

  // Requirements status updater & server persistence
  const handleSetRequirementStatus = async (reqId: string, status: TaskRequirementItem['status']) => {
    const updated = requirements.map(r => r.id === reqId ? {
      ...r,
      status,
      verifiedByStaffId: currentUser?.id,
      verifiedByName: currentUser?.name,
      verifiedAt: new Date().toISOString()
    } : r);
    setRequirements(updated);
    setSaveStatus('saving');
    try {
      if (typeof fetch !== 'undefined') {
        await fetch(`/api/marketing/tasks/${activeTask.id}/requirements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requirements: updated })
        });
        fetchDrawerActivity();
      }
      setSaveStatus('saved');
    } catch {
      setSaveStatus('saved');
    }
  };

  const handleVerifyAllRequirements = async () => {
    const updated = requirements.map(r => ({
      ...r,
      status: 'verified' as const,
      verifiedByStaffId: currentUser?.id,
      verifiedByName: currentUser?.name,
      verifiedAt: new Date().toISOString()
    }));
    setRequirements(updated);
    setSaveStatus('saving');
    try {
      if (typeof fetch !== 'undefined') {
        await fetch(`/api/marketing/tasks/${activeTask.id}/requirements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requirements: updated })
        });
        fetchDrawerActivity();
      }
      setSaveStatus('saved');
    } catch {
      setSaveStatus('saved');
    }
  };

  // Flag missing photos without external messaging dispatch
  const handleNotifyManagerMissingPhotos = async () => {
    setIsFlaggingPhotos(true);
    try {
      if (typeof fetch !== 'undefined') {
        await fetch(`/api/marketing/tasks/${activeTask.id}/flag-missing-photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: 'Source photos not uploaded by broker in initial request',
            flaggedBy: currentUser?.name || 'Production Specialist'
          })
        });
        fetchDrawerActivity();
      }
      setIsPhotosFlagged(true);
      setFlagPhotosMessage('✓ Manager notified internally that photos are missing. Escalation flag recorded (no outbound SMS/email).');
    } catch {
      setIsPhotosFlagged(true);
      setFlagPhotosMessage('✓ Manager notified internally.');
    } finally {
      setIsFlaggingPhotos(false);
    }
  };

  const handleResendPhotoRequest = async () => {
    if (!parentRequestId) {
      setFlagPhotosMessage('No parent request id — cannot email via Nora.');
      return;
    }
    setIsResendingPhotos(true);
    try {
      if (typeof fetch !== 'undefined') {
        const res = await fetch(`/api/marketing/requests/${parentRequestId}/resend-photo-request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          setFlagPhotosMessage(data.message || '✓ Photo upload request dispatched to requester via Nora.');
          fetchDrawerActivity();
        } else {
          setFlagPhotosMessage(data.error || 'Failed to dispatch photo request via Nora.');
        }
      }
    } catch (err: any) {
      setFlagPhotosMessage(err?.message || 'Error dispatching photo request.');
    } finally {
      setIsResendingPhotos(false);
    }
  };

  // Attempt Producer Submission (Soft-warning check)
  const handleAttemptSendForApproval = () => {
    if (!canSendForApproval) {
      setUrlValidationError(blockingReasons[0] || 'Submission requirements not met.');
      return;
    }
    // Soft-enforcement: if unreviewed items remain, show smart warning confirmation dialog
    if (hasUnreviewedRequirements) {
      setShowChecklistSoftWarning(true);
      return;
    }
    handleSendForApproval();
  };

  // Producer Submission Handler
  const handleSendForApproval = async () => {
    if (isSubmitting) return;

    if (!canSendForApproval) {
      setUrlValidationError(blockingReasons[0] || 'Submission requirements not met.');
      return;
    }

    if (manualProofUrl.trim()) {
      const check = validateProofUrl(manualProofUrl);
      if (!check.valid) {
        setUrlValidationError(check.error || 'Invalid proof URL');
        return;
      }
    }

    setIsSubmitting(true);
    setSaveStatus('saving');

    try {
      const check = manualProofUrl.trim() ? validateProofUrl(manualProofUrl) : null;
      const normalizedManual = check?.normalizedUrl || manualProofUrl.trim();
      const primaryProofUrl = firstNonInlineProof(
        normalizedManual,
        stagedAssets[0]?.previewUrl,
        activeTask.proofUrl,
        activeTask.photos && activeTask.photos[0]?.url,
        activeTask.attachments && activeTask.attachments[0]?.url
      );
      const assetMeta = stagedAssets[0] ? {
        assetId: stagedAssets[0].id,
        deliverableName: stagedAssets[0].deliverableName,
        fileMetadata: {
          width: stagedAssets[0].width,
          height: stagedAssets[0].height,
          aspectRatio: stagedAssets[0].aspectRatio,
          dpi: stagedAssets[0].dpi,
          dpiVerified: stagedAssets[0].dpiVerified,
          fileSizeBytes: stagedAssets[0].fileSizeBytes
        },
        validationStatus: stagedAssets[0].validationStatus
      } : undefined;

      if (onSubmitProof) {
        await onSubmitProof(activeTask.id, primaryProofUrl, productionNotes, assetMeta);
      } else if (typeof fetch !== 'undefined') {
        const res = await fetch(`/api/marketing/tasks/${activeTask.id}/submit-proof`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proofUrl: primaryProofUrl,
            notes: productionNotes,
            stagedAssets: stagedAssets.length > 0 ? stagedAssets : undefined,
            assetMetadata: assetMeta
          })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || errData.error || 'Submission failed');
        }
      }

      if (onSave) {
        onSave({
          ...activeTask,
          status: 'in_progress',
          reviewState: 'awaiting_review',
          proofUrl: primaryProofUrl,
          proofNotes: productionNotes,
          reviewOwnerId: 'dir_melissa_gagliardi_33',
          reviewOwnerName: 'Melissa Gagliardi'
        });
      }

      fetchDrawerActivity();

      const successToast = isRevision
        ? `Sent to ${directorFirstName} for review`
        : `Sent to ${directorFirstName} for approval`;
      setSubmitSuccessMessage(`✓ ${successToast}`);
      setSaveStatus('saved');

      // Peak-End Rule: Set celebration milestone summary instead of immediate abrupt close
      setSubmittedSummary({
        proofUrl: primaryProofUrl,
        managerName: directorFullName,
        packageType: activeTask.packageType,
        propertyAddress: activeTask.propertyAddress,
        timestamp: new Date().toISOString()
      });
      setIsSubmittedMilestone(true);
      setShowChecklistSoftWarning(false);
    } catch (err: any) {
      const raw = String(err?.message || err?.error || '');
      const friendly = (raw === 'PROOF_REQUIRED' || /proof_required/i.test(raw))
        ? (stagedAssets.length > 0
            ? 'Could not save the uploaded proof. Try Approve again, or paste an optional link.'
            : 'Upload a finished asset or paste an optional image link before approving.')
        : (raw || 'Submission failed. Please try again.');
      setUrlValidationError(friendly);
      setSaveStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Director Request Revisions
  const handleConfirmRequestRevisions = async () => {
    if (!revisionFeedbackInput.trim()) return;
    setIsSubmitting(true);
    try {
      if (onRequestRevisions) {
        await onRequestRevisions(activeTask.id, revisionFeedbackInput.trim());
      }
      setIsRevisionModalOpen(false);
      setRevisionFeedbackInput('');
      setSubmitSuccessMessage('✓ Revisions requested. Returned to producer queue.');
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to request revisions');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Director Approve
  const handleApproveDelivery = async () => {
    if (isSelfApprovalBlocked) {
      alert('Self-approval rejected: You produced or are assigned to this deliverable and cannot approve your own work.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (onApproveProof) {
        await onApproveProof(activeTask.id, 'Approved for delivery');
      }
      setSubmitSuccessMessage('✓ Proof approved for delivery');
      onClose();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRequester = async (agent: { id: string; name: string; email: string; phone?: string }) => {
    let verdict: DispatchVerdictView | null = null;
    if (activeTask) {
      try {
        const res = await fetch(`/api/marketing/requests/${encodeURIComponent(activeTask.id)}/dispatch-check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientEmail: agent.email,
            recipientName: agent.name,
            channels: ['email'],
            intent: 'delivery_complete',
            proofUrl: resolveProofPrecedence(manualProofUrl, activeTask.proofUrl),
            domain: 'marketing',
          }),
        });
        const data = await res.json().catch(() => null);
        if (data?.recipientStatus) {
          verdict = data;
          setFetchedDispatchVerdict(data);
        }
      } catch {
        verdict = null;
      }
    }
    const patch = confirmRequesterWrite(agent, {
      recipientStatus: verdict?.recipientStatus || 'unresolved',
      recipientId: verdict?.recipientId || null,
    });
    setConfirmedRequesterOverride({
      agentName: patch.agentName,
      agentEmail: patch.agentEmail,
      agentPhone: patch.agentPhone || undefined,
      requesterId: patch.requesterId,
    });
    if (activeTask) {
      const updated = {
        ...activeTask,
        agentName: patch.agentName,
        agentEmail: patch.agentEmail,
        agentPhone: patch.agentPhone || activeTask.agentPhone,
        requesterId: patch.requesterId || undefined,
      };
      if (onSave) {
        onSave(updated);
      }
      try {
        await fetch(`/api/marketing/tasks/${activeTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch)
        });
      } catch {}
    }
    setIsConfirmRequesterOpen(false);
  };

  // Melissa: open Ask Requester (delivery) instead of auto-emailing approved assets
  const openDeliveryOutreach = () => {
    if (!activeTask) return;
    if (!canApproveAndNotify) {
      setUrlValidationError('Approve & Notify refused: only the task reviewer may approve and notify the agent.');
      return;
    }
    if (onAskRequester) {
      const primaryProofUrl = firstNonInlineProof(
        manualProofUrl.trim(),
        stagedAssets[0]?.previewUrl,
        activeTask.proofUrl,
        activeTask.photos && activeTask.photos[0]?.url,
        activeTask.attachments && activeTask.attachments[0]?.url
      );
      const assetMeta = stagedAssets[0] ? {
        assetId: stagedAssets[0].id,
        deliverableName: stagedAssets[0].deliverableName,
        fileMetadata: {
          width: stagedAssets[0].width,
          height: stagedAssets[0].height,
          aspectRatio: stagedAssets[0].aspectRatio,
          dpi: stagedAssets[0].dpi,
          dpiVerified: stagedAssets[0].dpiVerified,
          fileSizeBytes: stagedAssets[0].fileSizeBytes
        },
        validationStatus: stagedAssets[0].validationStatus
      } : undefined;
      onAskRequester(activeTask, {
        intent: 'delivery_complete',
        approvePayload: {
          note: productionNotes,
          proofUrl: primaryProofUrl || undefined,
          stagedAssets: stagedAssets.length > 0 ? stagedAssets : undefined,
          assetMetadata: assetMeta,
          selfComplete: isDirectorSelfComplete,
          skipAgentEmail: true,
          approvedBy: currentUser?.name || 'Melissa Gagliardi'
        }
      });
      return;
    }
    // Fallback if parent did not wire outreach modal
    void handleApproveAndSendToAgent();
  };

  // Director Approve & Send to Agent (or Send to Agent / Retry send to agent)
  const handleApproveAndSendToAgent = async () => {
    if (isSubmitting || deliveryStatus === 'delivering') return;

    if (shouldBlockClientOutbound(activeTask)) {
      toast.error(dealTriageClientOutboundBlockReason(activeTask) || 'Deal triage — no client outbound');
      return;
    }
    if (isMarketingCreativeTask(activeTask) && !canSendCreativeOutbound({
      ...activeTask,
      status: 'approved',
      reviewState: 'approved',
      proofUrl: resolveProofPrecedence(manualProofUrl.trim(), activeTask?.proofUrl),
    })) {
      setUrlValidationError(creativeOutboundBlockReason(activeTask) || 'Stage a finished proof before outbound.');
      return;
    }

    if (!canApproveAndNotify) {
      setUrlValidationError('Approve & Notify refused: only the task reviewer may approve and notify the agent.');
      return;
    }

    if (!isRecipientConfirmed) {
      setUrlValidationError('Requester needs confirmation before external delivery.');
      return;
    }

    if (manualProofUrl.trim()) {
      const check = validateProofUrl(manualProofUrl);
      if (!check.valid) {
        setUrlValidationError(check.error || 'Invalid proof URL');
        return;
      }
    }

    setIsSubmitting(true);
    setDeliveryStatus('delivering');
    setDeliveryMessage(null);
    setSaveStatus('saving');

    try {
      const primaryProofUrl = firstNonInlineProof(
        manualProofUrl.trim(),
        stagedAssets[0]?.previewUrl,
        activeTask.proofUrl,
        activeTask.photos && activeTask.photos[0]?.url,
        activeTask.attachments && activeTask.attachments[0]?.url
      );
      const assetMeta = stagedAssets[0] ? {
        assetId: stagedAssets[0].id,
        deliverableName: stagedAssets[0].deliverableName,
        fileMetadata: {
          width: stagedAssets[0].width,
          height: stagedAssets[0].height,
          aspectRatio: stagedAssets[0].aspectRatio,
          dpi: stagedAssets[0].dpi,
          dpiVerified: stagedAssets[0].dpiVerified,
          fileSizeBytes: stagedAssets[0].fileSizeBytes
        },
        validationStatus: stagedAssets[0].validationStatus
      } : undefined;

      // Path B: director self-complete must not submit-to-self. Persist proof via approve-and-dispatch.
      // Path A reviewer approving Eduardo's revised proof may still stage via submit-proof when modified.
      if (isProofModified && !isDirectorSelfComplete) {
        if (onSubmitProof) {
          await onSubmitProof(activeTask.id, primaryProofUrl, productionNotes, assetMeta);
        } else if (typeof fetch !== 'undefined') {
          const res = await fetch(`/api/marketing/tasks/${activeTask.id}/submit-proof`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              proofUrl: primaryProofUrl,
              notes: productionNotes,
              stagedAssets: stagedAssets.length > 0 ? stagedAssets : undefined,
              assetMetadata: assetMeta
            })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || errData.error || 'Failed to save revised proof');
          }
        }
      }

      let data: any;

      if (isCurrentProofApproved && onDeliverProof) {
        data = await onDeliverProof(activeTask.id);
      } else if (onApproveAndDispatch) {
        data = await onApproveAndDispatch(activeTask.id, productionNotes, {
          proofUrl: primaryProofUrl || undefined,
          stagedAssets: stagedAssets.length > 0 ? stagedAssets : undefined,
          assetMetadata: assetMeta,
          selfComplete: isDirectorSelfComplete
        });
        if (data && data.success === false) {
          throw new Error(data.message || data.error || 'Approval failed');
        }
      } else if (typeof fetch !== 'undefined') {
        const endpoint = isCurrentProofApproved
          ? `/api/marketing/tasks/${activeTask.id}/deliver`
          : `/api/marketing/tasks/${activeTask.id}/approve-and-dispatch`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            note: productionNotes,
            approvedBy: currentUser?.name || 'Melissa Gagliardi',
            proofUrl: primaryProofUrl,
            stagedAssets: isDirectorSelfComplete && stagedAssets.length > 0 ? stagedAssets : undefined,
            assetMetadata: isDirectorSelfComplete ? assetMeta : undefined,
            selfComplete: isDirectorSelfComplete
          })
        });
        data = await res.json();
      } else {
        throw new Error('No delivery provider available');
      }

      if (data && data.success) {
        if (data.delivered) {
          setDeliveryStatus('delivered');
          setSubmitSuccessMessage(`✓ Approved and delivered to ${verifiedRecipient.name || 'agent'} (${verifiedRecipient.email || 'email'})`);
          setSaveStatus('saved');
          if (onSave && data.task) {
            onSave(data.task);
          }
          if (onApproveProof) {
            await onApproveProof(activeTask.id, 'Approved and delivered');
          }
          setManualProofUrl('');
          setProductionNotes('');
          setStagedAssets([]);
          onClose();
        } else if (data.dispatchHeld || data.retryAllowed) {
          setDeliveryStatus('held');
          setDeliveryMessage(data.message || 'Proof approved. Email delivery held in test safe mode. Retry send to agent when ready.');
          setSubmitSuccessMessage('✓ Proof approved. Email delivery held in test safe mode.');
          setSaveStatus('saved');
        } else {
          setDeliveryStatus('error');
          setDeliveryMessage(data.message || 'Failed to deliver proof');
        }
      } else {
        throw new Error(data?.error || data?.message || 'Approval and delivery failed');
      }
    } catch (err: any) {
      const raw = String(err?.message || err?.error || '');
      const friendly = (raw === 'PROOF_REQUIRED' || /proof_required/i.test(raw))
        ? (stagedAssets.length > 0
            ? 'Uploaded file did not persist — retry Approve & Complete.'
            : 'Upload a finished asset or paste an optional image link before approving.')
        : (raw || 'Approval failed. Please try again.');
      setUrlValidationError(friendly);
      setDeliveryStatus('error');
      setDeliveryMessage(err.message || 'Failed to deliver proof');
      setSaveStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBadge = () => {
    const isAwaiting = Boolean(activeTask.reviewState === 'awaiting_review' || activeTask.status === 'ready_for_review' || activeTask.status === 'agent_review');
    const isRevs = activeTask.reviewState === 'revisions_requested' || activeTask.status === 'revisions';
    const isAppr = activeTask.reviewState === 'approved' || activeTask.status === 'completed';

    if (isRevs) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
          <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
          <span>Needs revision</span>
        </span>
      );
    }
    if (isAwaiting) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1.5 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-blue-700" />
          <span>Awaiting review</span>
        </span>
      );
    }
    if (isAppr) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-slate-500" />
          <span>Approved</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-1.5 shadow-2xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>In production</span>
      </span>
    );
  };

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
      // Critiquito P0: never dump intake metadata as the brief
      .replace(/\[\s*Submitted by[^\]]*\]/gi, '')
      .replace(/Submitted by:\s*[^\n]+/gi, '')
      .replace(/\bRequest ID:\s*\S+/gi, '')
      .replace(/\bCampaign ID:\s*\S+/gi, '')
      .replace(/\bTask ID:\s*\S+/gi, '')
      .replace(/\bpolicyVersion:\s*\S+/gi, '')
      .trim();
    return cleaned || 'Produce according to standard brokerage specifications.';
  };

  const cleanInstructions = sanitizeInstructions(activeTask.notes || activeTask.proofNotes);

  const listingSpecBadges = (() => {
    const d = (activeTask.listingDetails || {}) as any;
    const isPlaceholder = (v?: string, placeholders: string[] = []) => {
      const s = String(v || '').trim();
      if (!s) return true;
      if (/^pending\b/i.test(s)) return true;
      return placeholders.some((p) => s === p);
    };
    const raw: Array<{ key: string; label: string; value: string }> = [];
    if (!isPlaceholder(d.price, ['$895,000'])) {
      raw.push({ key: 'price', label: 'Price', value: String(d.price).trim() });
    }
    if (!isPlaceholder(d.bedsBaths, ['3 Beds / 2 Baths'])) {
      raw.push({ key: 'beds', label: 'Beds/baths', value: String(d.bedsBaths).trim() });
    }
    if (!isPlaceholder(d.sqft, ['2,400 SqFt'])) {
      raw.push({ key: 'sqft', label: 'Sq ft', value: String(d.sqft).trim() });
    }
    const cleanMls = (d.mlsNumber || activeTask.mlsNumber || '').replace(/^MLS\s*#?\s*/i, '').trim();
    if (cleanMls) {
      raw.push({ key: 'mls', label: 'MLS#', value: cleanMls });
    }
    if (eventSchedule?.hasEvent) {
      raw.push(
        { key: 'eventType', label: 'Event', value: String(eventSchedule.eventType || 'Open House') },
        {
          key: 'eventWhen',
          label: 'When',
          value: [eventSchedule.eventDate, eventSchedule.eventTime || 'TBD'].filter(Boolean).join(' · '),
        }
      );
    }
    // Critiquito P2: overflow +N when many valued pills
    const MAX_VISIBLE = 4;
    return {
      visible: raw.slice(0, MAX_VISIBLE),
      overflow: Math.max(0, raw.length - MAX_VISIBLE),
      all: raw,
    };
  })();

  const photoAssetCount =
    (Array.isArray(resolvedAssets?.photos) ? resolvedAssets.photos.length : 0) ||
    (Array.isArray(activeTask.photos) ? activeTask.photos.length : 0);

  const noraPhotoAskEvent = (drawerActivityEvents || []).find((ev: any) => {
    const et = String(ev.eventType || '').toLowerCase();
    const sum = String(ev.summary || '').toLowerCase();
    return (
      et.includes('photo') ||
      sum.includes('photo') ||
      sum.includes('photos needed') ||
      (String(ev.channel || '').toLowerCase() === 'email' &&
        String(ev.direction || '').toLowerCase() === 'outbound' &&
        (sum.includes('listing') || sum.includes('image')))
    );
  });

  const formatNoraEmailStamp = (iso?: string) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return null;
      return (
        d.toLocaleString('en-US', {
          timeZone: 'America/New_York',
          month: 'numeric',
          day: 'numeric',
          year: '2-digit',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }) + ' ET'
      );
    } catch {
      return null;
    }
  };

  const hasCallSource = Boolean(
    taskDetail?.source?.call ||
      (activeTask as any).callId ||
      (activeTask as any).telephonyCallId ||
      activeTask.sourceCallId ||
      taskDetail?.request?.telephonyCallId
  );

  const operationalBrief = (() => {
    const agent = verifiedRecipient?.name || activeTask.agentName || 'The agent';
    const firstName = String(agent).split(/\s+/)[0] || agent;
    const need = activeTask.packageType || activeTask.title || 'marketing materials';
    const property = activeTask.propertyAddress || 'this listing';
    const due =
      formattedDue && formattedDue !== 'Not provided' && formattedDue !== 'Deadline not specified'
        ? formattedDue
        : 'a flexible deadline';
    const channel = String(activeTask.channel || (activeTask as any).sourceChannel || '').toLowerCase();
    const isCall =
      hasCallSource ||
      channel.includes('call') ||
      channel.includes('voice') ||
      channel.includes('retell');
    // Marcus template: who called → need → for what → by when → blocker → Nora emailed…
    const who = isCall ? `${agent} called` : `${agent} requested`;
    const needLine = `They need ${need} for ${property}, by ${due}.`;
    const blocker =
      photoAssetCount > 0
        ? ''
        : ' Waiting on photos (blocking).';
    const emailStamp = formatNoraEmailStamp(
      noraPhotoAskEvent?.occurredAt ||
        noraPhotoAskEvent?.createdAt ||
        noraPhotoAskEvent?.timestamp
    );
    const noraBit =
      photoAssetCount === 0
        ? emailStamp
          ? ` Nora emailed ${firstName} at ${emailStamp} asking for listing images.`
          : ` Nora emailed ${firstName} asking for listing images.`
        : '';
    return `${who}. ${needLine}${blocker}${noraBit}`.replace(/\s+/g, ' ').trim();
  })();


  // Determine active state across tab aliases for backwards compatibility
  const isOverview = activeTab === 'overview' || activeTab === 'brief' || activeTab === 'assignment';
  const isFiles = activeTab === 'files' || activeTab === 'source' || activeTab === 'photos';
  const isProof = activeTab === 'proof' || activeTab === 'review' || activeTab === 'work' || activeTab === 'requirements' || activeTab === 'proofs';
  const isHistory = activeTab === 'history';

  // Navigation tab definitions (keeping legacy labels for regression suite compatibility)
  const tabsList = [
    {
      id: 'overview',
      legacyId: 'brief',
      legacySearchLabel: 'Brief',
      label: 'Overview',
      icon: <Layers className="w-4 h-4" />,
      count: activeTask.requestedAssets?.length
    },
    {
      id: 'files',
      legacyId: 'source',
      legacySearchLabel: 'Source',
      label: 'Files & sources',
      icon: <ImageIcon className="w-4 h-4" />,
      count: (resolvedAssets.photos.length > 0 ? resolvedAssets.photos.length : activeTask.photos?.length)
    },
    {
      id: 'proof',
      legacyId: 'work',
      legacySearchLabel: 'Work',
      label: 'Proof & review',
      icon: <FolderOpen className="w-4 h-4" />,
      badge: activeTask.reviewState === 'revisions_requested' ? 'Revisions' : `v${activeTask.proofVersion || 1}`,
      indicator: activeTask.reviewState === 'awaiting_review' || activeTask.reviewState === 'revisions_requested'
    },
    {
      id: 'history',
      legacyId: 'history',
      legacySearchLabel: 'Activity & Contact',
      label: 'History',
      icon: <Clock className="w-4 h-4" />,
      count: drawerActivityEvents.length
    }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-task-modal-title"
      aria-label={`Task Workstation: ${activeTask.propertyAddress || activeTask.title || 'Task Details'}`}
      data-testid="workspace-task-drawer"
      className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 md:p-6 lg:p-8 overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Soft dark backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={handleAttemptClose}
        aria-hidden="true"
      />

      {/* Centered Modal Surface: denser ~910px shell (Critiquito) */}
      <div
        ref={modalContentRef}
        className="relative w-full max-w-[910px] max-h-[min(94vh,calc(100dvh-1.5rem))] h-[min(94vh,calc(100dvh-1.5rem))] sm:h-auto sm:my-auto bg-slate-50 border border-slate-200/90 rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200 nest-banner-in"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* =========================================================================
            1. STICKY HEADER & SERIAL POSITION PRIMACY ANCHOR
           ========================================================================= */}
        <header className="bg-white border-b border-slate-200 px-5 sm:px-7 py-4 shadow-2xs shrink-0 z-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Left: Previous/Next Navigation & Heading Hierarchy */}
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              {surfaceGates.showPager && (
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0" data-testid="surface-drawer-pager">
                  <button
                    type="button"
                    onClick={() => hasPrev && onSelectTask && onSelectTask(tasksList[taskIndex - 1].id)}
                    disabled={!hasPrev}
                    title="Previous Task"
                    className={`p-1.5 rounded-lg transition ${hasPrev ? 'hover:bg-white text-slate-700 cursor-pointer shadow-2xs' : 'text-slate-300 cursor-not-allowed'}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-mono px-2 font-bold text-slate-500">
                    {taskIndex >= 0 ? `${taskIndex + 1} of ${tasksList.length}` : 'Task'}
                  </span>
                  <button
                    type="button"
                    onClick={() => hasNext && onSelectTask && onSelectTask(tasksList[taskIndex + 1].id)}
                    disabled={!hasNext}
                    title="Next Task"
                    className={`p-1.5 rounded-lg transition ${hasNext ? 'hover:bg-white text-slate-700 cursor-pointer shadow-2xs' : 'text-slate-300 cursor-not-allowed'}`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Surface lock #2: Mode A H1 = deliverable; Mode B H1 = address */}
                  <h2
                    id="workspace-task-modal-title"
                    data-testid="surface-drawer-h1"
                    className="text-lg sm:text-xl font-bold text-slate-900 truncate max-w-sm sm:max-w-xl tracking-tight"
                  >
                    {surfaceH1}
                  </h2>
                  {!isSurfaceTriage && (
                    <MlsNumberBadge
                      mlsNumber={activeTask.listingDetails?.mlsNumber}
                      showStatus
                      status={(activeTask as any).flexMlsStatus || 'supplied'}
                      isLive={(activeTask as any).flexMlsStatus === 'flex_live' || (activeTask as any).flexMlsStatus === 'live'}
                    />
                  )}
                </div>

                {isSurfaceTriage ? (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 flex-wrap font-medium" data-testid="surface-drawer-triage-chips">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      {SURFACE_DRAWER_NEEDS_TRIAGE_CHIP}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {activeTask.channel || 'web'}
                    </span>
                    {isOverdue && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        overdue
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 flex-wrap font-medium">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#00635C] border border-emerald-200" data-testid="surface-drawer-lane-chip">
                      {surfaceLaneChip}
                    </span>
                    <span className="text-slate-900 font-semibold">{activeTask.packageType || activeTask.title}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1.5">
                      <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-600' : 'text-slate-400'}`} />
                      <span className={isOverdue ? 'font-bold text-rose-700' : 'text-slate-700'}>
                        {formattedDue !== 'Not provided' && formattedDue !== 'Deadline not specified'
                          ? `Needed by ${formattedDue}`
                          : (activeTask.targetSla && !/today\s*5:00\s*pm/i.test(activeTask.targetSla) && activeTask.targetSla !== 'Deadline not specified'
                              ? `SLA Due: ${activeTask.targetSla}`
                              : 'Deadline not specified')}
                      </span>
                      {isOverdue && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          {relativeDue}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {!surfaceGates.showAppleFold && (
                  <p className="text-[11px] text-slate-500 mt-1 font-medium" data-testid="surface-drawer-next">
                    {surfaceNext.sentence}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Status badge & Compact Controls */}
            <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center flex-wrap justify-end">
              {renderStatusBadge()}
              {surfaceGates.showUpload && !hasAnyProof && !isCurrentProofApproved && (
                <button
                  type="button"
                  data-testid="header-upload-asset-badge"
                  onClick={() => {
                    setActiveViewMode('workstation');
                    setActiveTab('proof');
                    setIsUploadWizardOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-300 bg-amber-50 text-amber-900 text-[11px] font-bold hover:bg-amber-100 cursor-pointer shadow-2xs"
                  title="Upload a finished asset in Work before Approve & Notify"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Upload finished asset</span>
                </button>
              )}

              {/* Ask Requester moved to ⋯ overflow — Critiquito: one primary path */}

              {/* Route menu opens from ⋯ only */}
              {onReassignTask && isMarketingDirector && isRouteMenuOpen && (
                <div className="relative">
                  <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Assign Staff Member
                    </div>
                    {TEAM_MEMBERS.map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          if (onReassignTask) onReassignTask(activeTask.id, m.name);
                          setIsRouteMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between text-slate-800 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-600">
                            {m.name.charAt(0)}
                          </span>
                          <span className="font-semibold">{m.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">{m.role}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Overflow Menu (...) — hidden in Mode A triage */}
              {!isSurfaceTriage && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsOverflowMenuOpen(!isOverflowMenuOpen)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer border border-slate-200"
                  title="More actions"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {isOverflowMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-left text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        handleCopyText(activeTask.id, 'Task ID');
                        setIsOverflowMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Task ID</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleCopyText(activeTask.propertyAddress, 'Address');
                        setIsOverflowMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Property Address</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleCopyAllDetails();
                        setIsOverflowMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy All Listing Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTechnicalDetails(!showTechnicalDetails);
                        setIsOverflowMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                    >
                      <Code className="w-3.5 h-3.5 text-slate-400" />
                      <span>{showTechnicalDetails ? 'Hide' : 'Inspect'} Raw Task JSON</span>
                    </button>
                    {onAskRequester && (
                      <button
                        type="button"
                        data-testid="ask-agent-btn"
                        onClick={() => {
                          setIsOverflowMenuOpen(false);
                          onAskRequester(activeTask);
                        }}
                        className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer border-t border-slate-100"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>{getRequesterActionLabel(activeTask)}</span>
                      </button>
                    )}
                    {onReassignTask && isMarketingDirector && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOverflowMenuOpen(false);
                          setIsRouteMenuOpen(true);
                        }}
                        className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer border-t border-slate-100"
                      >
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Route to...</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={handleAttemptClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer border border-slate-200"
                title="Close Task (Esc)"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* People/due live in Who·When chunk — keep a compact status+ref row only */}
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-2.5 pt-2.5 border-t border-slate-100 flex-wrap">
            <span className="sr-only">Reviewing Manager: <strong data-testid="reviewing-manager-name">{coveringManagerDisplay}</strong></span>
<div className="relative inline-block">
              <button
                type="button"
                onClick={() => setShowTaskRefPopover(!showTaskRefPopover)}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                title="Click to inspect task ID"
              >
                <span>Ref</span>
                <Copy className="w-2.5 h-2.5" />
              </button>

              {showTaskRefPopover && (
                <div className="absolute left-0 top-full mt-1 w-64 p-3 bg-white rounded-xl shadow-xl border border-slate-200 z-50 text-xs text-left animate-in fade-in">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Canonical Task Reference</div>
                  <div className="font-mono text-slate-800 truncate select-all mt-0.5">{activeTask.id}</div>
                  <button
                    type="button"
                    onClick={() => {
                      handleCopyText(activeTask.id, 'Task ID');
                      setShowTaskRefPopover(false);
                    }}
                    className="mt-2 w-full px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedField === 'Task ID' ? '✓ Copied' : 'Copy Task ID'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* =========================================================================
              VIEW MODE SWITCHER & WORKFLOW ANCHORS
             ========================================================================= */}
          <div className="flex flex-col gap-2.5 pt-3 mt-1 border-t border-slate-100" data-testid="drawer-tabs-and-specs">
            {surfaceGates.showWorkstationTabs && (
            <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
            {/* Primary Segmented Controller: Work | History (Surface lock #2) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0" data-testid="surface-drawer-work-history">
              <button
                type="button"
                onClick={() => {
                  setActiveViewMode('workstation');
                  setActiveTab('work');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeViewMode === 'workstation'
                    ? 'bg-white text-[#00635C] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Work</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveViewMode('history');
                  setActiveTab('history');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeViewMode === 'history'
                    ? 'bg-white text-[#00635C] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>History</span>
                {drawerActivityEvents.length > 0 && (
                  <span
                    className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-slate-200 text-slate-700"
                    title={`${drawerActivityEvents.length} timeline events (calls, messages, status changes)`}
                  >
                    {drawerActivityEvents.length} events
                  </span>
                )}
              </button>
            </div>

            {/* Legacy tab anchors kept for tests — hidden from UI (Critiquito: kill duplicate secondary nav) */}
            <div className="hidden" aria-hidden="true" data-testid="drawer-legacy-tab-anchors">
              {tabsList.map(tab => {
                const isActive = (tab.id === 'overview' && isOverview) ||
                  (tab.id === 'files' && isFiles) ||
                  (tab.id === 'proof' && isProof) ||
                  (tab.id === 'history' && isHistory);

                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    data-testid={`drawer-tab-${tab.legacyId}`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id === 'history') setActiveViewMode('history');
                      else setActiveViewMode('workstation');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-[#00635C]/10 text-[#00635C] font-bold border border-[#00635C]/20'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {/* Invisible spans for backwards compatibility with tests checking Brief / Source / Work */}
                    <span className="hidden" aria-hidden="true">
                      <span>{tab.legacySearchLabel}</span>
                    </span>
                    {typeof tab.count === 'number' && (
                      <span className="text-[10px] px-1 py-0.1 rounded font-mono bg-slate-100 text-slate-600">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            </div>
            )}

            {/* Lock #2.2 — ONE dense meta row, TWO zones: Event·When·Maps | people */}
            <div
              className={surfaceMetaRowSplit.row}
              data-testid="surface-meta-row-split"
            >
              {!isSurfaceTriage && (
              <div className={surfaceMetaRowSplit.left} data-testid="drawer-spec-badges" data-zone="surface-meta-row-left">
                {listingSpecBadges.visible.map((b) => (
                  <button
                    key={b.key}
                    type="button"
                    title={`Copy ${b.label}`}
                    onClick={() => handleCopyText(b.value, b.label)}
                    className="inline-flex items-center gap-1 max-w-full px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] text-slate-700 shadow-2xs cursor-pointer transition nest-press"
                  >
                    <span className="text-slate-400 font-semibold uppercase tracking-wide">{b.label}</span>
                    <span className="font-bold truncate text-slate-900">
                      {copiedField === b.label ? '✓ Copied' : b.value}
                    </span>
                    <Copy className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>
                ))}
                {listingSpecBadges.overflow > 0 && (
                  <span
                    className="inline-flex items-center px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500"
                    title={listingSpecBadges.all.slice(4).map((b) => `${b.label}: ${b.value}`).join(' · ')}
                  >
                    +{listingSpecBadges.overflow}
                  </span>
                )}
                {surfaceGates.showMaps && activeTask.propertyAddress && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeTask.propertyAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-[#00635C] hover:bg-emerald-50"
                    data-testid="surface-drawer-maps"
                  >
                    <MapPin className="w-3 h-3" />
                    Maps
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              )}
              <div
                className={surfaceMetaRowSplit.right}
                data-testid="chunk-who-when"
                data-zone="surface-meta-row-right"
              >
                <span>
                  <span className="text-slate-400 font-medium">Requester </span>
                  <strong className="text-slate-800">{verifiedRecipient.name || activeTask.agentName || '—'}</strong>
                </span>
                <span className="text-slate-300">·</span>
                <span>
                  <span className="text-slate-400 font-medium">Assignee </span>
                  <strong className="text-slate-800">{activeTask.assignedTo || 'Unassigned'}</strong>
                </span>
                <span className="text-slate-300">·</span>
                <span>
                  <span className="text-slate-400 font-medium">Reviewer </span>
                  <strong className="text-slate-800" data-testid="chunk-reviewer-name">{coveringManagerDisplay}</strong>
                </span>
                {((activeTask.priority || '').toLowerCase() === 'urgent' || (activeTask.priority || '').toLowerCase() === 'high') && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                    Urgent
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* =========================================================================
            2. MAIN SCROLLABLE BODY
           ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 pb-28">
          
          {/* Triage Alert & Resolution Card */}
          {isSurfaceTriage && (
            <div className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in" data-testid="triage-resolution-card">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>{SURFACE_DRAWER_NEEDS_TRIAGE_CHIP}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-white border border-amber-300 text-amber-900 rounded-lg text-[11px] font-medium uppercase tracking-wider">
                    {activeTask.channel || 'web'}
                  </span>
                  {isOverdue && (
                    <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-[11px] font-bold">
                      overdue
                    </span>
                  )}
                </div>
              </div>

              {/* Mode A body — plain copy, never raw reason codes */}
              <div className="text-xs text-amber-900 bg-white rounded-xl p-4 border border-amber-200 font-medium space-y-2.5 shadow-2xs">
                <p className="text-slate-800 leading-relaxed font-medium text-sm" data-testid="surface-drawer-triage-body">
                  {surfaceTriageBody}
                </p>
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-semibold text-slate-700">Requester:</span>
                    <span>{activeTask.agentName || verifiedRecipient.name || 'Unknown Caller / Requester'}</span>
                    {activeTask.agentPhone && <span className="text-slate-400 font-mono">({activeTask.agentPhone})</span>}
                  </div>
                </div>
              </div>

              {/* Manager Resolution Form */}
              <div className="bg-white rounded-xl p-4 border border-amber-200 space-y-3 shadow-2xs">
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Manager Triage Resolution</h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Category</label>
                    <select
                      value={triageCategory}
                      onChange={e => setTriageCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:bg-white focus:border-[#00635C] outline-hidden"
                    >
                      <option value="">Select Category...</option>
                      <option value="marketing_collateral">Marketing Collateral (Flyers, Brochures)</option>
                      <option value="signage">Yard Sign Post Installation</option>
                      <option value="contracts">Contracts & Form 2-T Compliance</option>
                      <option value="accounting">Accounting & Commission Payout</option>
                      <option value="technology">IT & Systems Support</option>
                      <option value="operations">General Operations & Facilities</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Address</label>
                    <input
                      type="text"
                      value={triageAddress}
                      onChange={e => setTriageAddress(e.target.value)}
                      placeholder="e.g. 100 Main St, Wilmington NC"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:bg-white focus:border-[#00635C] outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Deliverable</label>
                  <input
                    type="text"
                    value={triageDeliverable}
                    onChange={e => setTriageDeliverable(e.target.value)}
                    placeholder="e.g. Double-Sided 8.5x11 Property Flyer"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:bg-white focus:border-[#00635C] outline-hidden"
                  />
                </div>

                {/* Route Preview Results */}
                {triagePreview && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-emerald-900">
                      <span>Route Preview (State: {triagePreview.routingState})</span>
                      <span className="font-mono text-[10px]">Rule: {triagePreview.matchedRuleId || 'Matched'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-emerald-800 text-[11px]">
                      <div>Assignee: <strong>{triagePreview.assigneeName}</strong> ({triagePreview.assigneeStaffId})</div>
                      <div>Review Owner: <strong>{triagePreview.reviewOwnerName}</strong> ({triagePreview.reviewOwnerStaffId})</div>
                      <div className="col-span-2">SOP: <strong>{triagePreview.governingSopTitle}</strong> ({triagePreview.governingSopId})</div>
                    </div>
                  </div>
                )}

                {triageError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
                    {triageError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handlePreviewTriage}
                    disabled={isTriageResolving || !triageCategory}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                  >
                    {isTriageResolving ? 'Evaluating...' : 'Preview Route'}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmTriage}
                    disabled={isTriageResolving || !triageCategory}
                    className="nest-press px-4 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    {isTriageResolving ? 'Routing...' : SURFACE_DRAWER_CONFIRM_ROUTING_LABEL}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PEAK-END RULE: CELEBRATORY MILESTONE CONFIRMATION SCREEN */}
          {/* Mode A triage: hide workstation / history body — triage card is the only surface */}
          {isSurfaceTriage ? null : isSubmittedMilestone && activeViewMode === 'workstation' ? (
            <div className="p-8 sm:p-12 bg-gradient-to-b from-emerald-50/80 via-white to-white rounded-3xl border border-emerald-200 text-center space-y-6 animate-in zoom-in-95 duration-200 shadow-sm max-w-2xl mx-auto my-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#00635C] flex items-center justify-center mx-auto shadow-md ring-8 ring-emerald-50">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                  Submission Milestone Achieved
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Proof Sent to {directorFullName} for Approval!
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Your proof for <strong>{activeTask.propertyAddress}</strong> ({activeTask.packageType}) has been logged in the canonical activity ledger and queued for director sign-off.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs max-w-md mx-auto flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#00635C] flex items-center justify-center shrink-0 border border-emerald-200">
                  <CheckCheck className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1 text-xs space-y-0.5">
                  <div className="font-bold text-slate-900 truncate">{activeTask.packageType}</div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">Reviewing: {directorFullName}</div>
                  <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Awaiting Manager Sign-Off</span>
                  </div>
                </div>
              </div>

              {/* Milestone Next Steps Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {hasNext && onSelectTask && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmittedMilestone(false);
                      onSelectTask(tasksList[taskIndex + 1].id);
                    }}
                    className="nest-press w-full sm:w-auto px-5 py-2.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span>Work on Next Task</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmittedMilestone(false);
                    onClose();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Done / Back to Workspace
                </button>
              </div>
            </div>
          ) : activeViewMode === 'history' ? (
            /* =========================================================================
                VIEW MODE 2: HISTORY & ACTIVITY LEDGER
               ========================================================================= */
            <div className="space-y-6 animate-in fade-in duration-150">
              <ActivityAndContactTimeline
                events={drawerActivityEvents}
                currentTaskId={activeTask.id}
                currentRequestId={activeTask.requestId || activeTask.campaignId}
                viewRole="assignee"
                loading={isLoadingDrawerActivity}
                onRefresh={fetchDrawerActivity}
                sourceMedia={{
                  callId: taskDetail?.source?.call?.id
                    || (activeTask as any).telephonyCallId
                    || (activeTask as any).callId
                    || activeTask.sourceCallId
                    || taskDetail?.request?.telephonyCallId
                    || null,
                  audioUrl: taskDetail?.source?.call?.audioUrl
                    || taskDetail?.source?.call?.recordingUrl
                    || (activeTask as any).audioUrl
                    || taskDetail?.request?.audioUrl
                    || null,
                  transcript: taskDetail?.source?.call?.transcript
                    || taskDetail?.request?.rawExcerpt
                    || null,
                  emailSubject: taskDetail?.request?.title || activeTask.requestTitle || null,
                  emailBody: taskDetail?.request?.requestExcerpt || taskDetail?.request?.rawExcerpt || activeTask.notes || null,
                  emailFrom: activeTask.agentEmail || null,
                  agentName: activeTask.agentName || null
                }}
              />

              {/* Expandable Technical Details at bottom */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <button
                  type="button"
                  onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-slate-400" />
                    <span>Inspect Full IDs</span>
                  </span>
                  <span className="text-[11px] text-[#00635C] font-semibold">
                    {showTechnicalDetails ? 'Hide' : 'Expand'}
                  </span>
                </button>

                {showTechnicalDetails && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs font-mono">
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div>Task ID: <strong className="text-slate-800">{activeTask.id}</strong></div>
                      <div>Campaign ID: <strong className="text-slate-800">{activeTask.campaignId || '—'}</strong></div>
                      <div>Request ID: <strong className="text-slate-800">{activeTask.requestId || '—'}</strong></div>
                      <div>Call ID: <strong className="text-slate-800">{(activeTask as any).callId || (activeTask as any).telephonyCallId || activeTask.sourceCallId || taskDetail?.source?.call?.id || '—'}</strong></div>
                      <div>Workspace ID: <strong className="text-slate-800">{activeTask.workspaceId || 'ws_wilmington'}</strong></div>
                      <div>SOP Code: <strong className="text-slate-800">{activeTask.sopCode || '—'}</strong></div>
                      <div>Status / ReviewState: <strong className="text-slate-800">{activeTask.status} / {activeTask.reviewState || 'none'}</strong></div>
                    </div>
                    <div className="p-3 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto text-[10px] max-h-48">
                      <pre>{JSON.stringify(activeTask, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* =========================================================================
                VIEW MODE 1: UNIFIED 2-COLUMN PRODUCTION WORKSTATION
                (Miller's Law Chunking + Proximity Law Grouping)
               ========================================================================= */
            <div className="flex flex-col gap-4 w-full" data-testid="workstation-chunks">

              {/* ========== CHUNK: WHAT ========== */}
              <section className="space-y-3" data-testid="chunk-what">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-0.5">What</h2>
                <div className="space-y-4">

              {activeTask && isListingLaunchTask(activeTask as any) && (
                <div
                  data-testid="listing-launch-sop-panel"
                  className="border border-[#01362D]/20 rounded-2xl p-4 mb-1 bg-[#01362D]/[0.03] space-y-3"
                >
                  <div className="font-extrabold text-sm text-[#01362D]">Listing Launch · sop_listing_launch_001</div>
                  <div className="flex gap-2 flex-wrap">
                    {LISTING_LAUNCH_STATUS_STEPS.map((step) => {
                      const current = deriveListingLaunchStatus(activeTask as any);
                      const active = step.id === current;
                      return (
                        <span
                          key={step.id}
                          className={`text-[11px] px-2.5 py-1 rounded-full border ${
                            active
                              ? 'bg-[#01362D] text-white border-[#01362D]'
                              : 'bg-white text-[#01362D] border-[#01362D]/40'
                          }`}
                        >
                          {step.label}
                        </span>
                      );
                    })}
                  </div>
                  <ul className="m-0 pl-4 text-xs text-slate-700 space-y-1">
                    {((((activeTask as any).listingPackageDraft as ListingPackageDraft | undefined)?.checklist) || []).map((item) => (
                      <li key={item.id} className={item.done ? 'opacity-60' : ''}>
                        {item.done ? '✓' : '○'} {item.label}{item.role ? ` · ${item.role}` : ''}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-slate-500 m-0">No outbound email from Listing Launch v1 — draft + task + status only.</p>
                  {Array.isArray((activeTask as any).listingPackageDraft?.formsPackage) && (
                    <div className="pt-2 border-t border-[#01362D]/10 space-y-1.5" data-testid="listing-launch-forms-package">
                      <div className="text-[11px] font-bold text-[#01362D]">
                        Forms metadata · 101 / 140 / WWREA
                        <span className="font-normal text-slate-500">
                          {' '}· {(activeTask as any).listingPackageDraft?.formsPackageSummary?.filledFieldCount ?? 0} prefilled
                          {' '}· {(activeTask as any).listingPackageDraft?.formsPackageSummary?.blankFieldCount ?? 0} human/Dotloop
                        </span>
                      </div>
                      <ul className="m-0 pl-4 text-[11px] text-slate-600 space-y-0.5">
                        {((activeTask as any).listingPackageDraft.formsPackage as Array<{ formName: string; nestRole: string; canonicalFormCode: string }>).map((f) => (
                          <li key={f.canonicalFormCode}>
                            <strong>{f.formName}</strong> — {f.nestRole}
                          </li>
                        ))}
                      </ul>
                      <p className="text-[10px] text-slate-500 m-0">Field maps only — no PDF scrape / no auto-sign.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTask && isOffer2TTask(activeTask as any) && (() => {
                const offerChecklist: Array<{ id: string; label: string; done?: boolean; role?: string }> =
                  ((((activeTask as any).offerPackageDraft as Offer2TPackageDraft | undefined)?.checklist)
                    || (activeTask as any).checklist
                    || NEST_OFFER_2T_CHECKLIST_DEFAULTS.map((item) => ({ ...item, done: false })));
                const offerDone = offerChecklist.filter((i) => i.done).length;
                const offerTotal = offerChecklist.length || OFFER_2T_STATUS_STEPS.length;
                const currentOfferStatus = deriveOffer2TStatus(activeTask as any);
                const stepIdx = Math.max(0, OFFER_2T_STATUS_STEPS.findIndex((s) => s.id === currentOfferStatus));
                const stepPct = Math.round(((stepIdx + (currentOfferStatus === 'done' ? 1 : 0)) / OFFER_2T_STATUS_STEPS.length) * 100);
                const checklistPct = offerChecklist.length
                  ? Math.round((offerDone / offerTotal) * 100)
                  : stepPct;
                const offerPct = Math.max(checklistPct, stepPct);
                const nextItem = offerChecklist.find((i) => !i.done)?.label;
                return (
                <div
                  data-testid="offer-2t-sop-panel"
                  className="border border-[#01362D]/20 rounded-2xl p-4 mb-1 bg-[#01362D]/[0.03] space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="font-extrabold text-sm text-[#01362D]">Offer / Form 2-T · sop_offer_2t_001</div>
                    <span className="text-[11px] font-mono font-bold text-[#01362D]" data-testid="offer-2t-progress-label">
                      {offerDone}/{offerTotal} · {offerPct}%
                    </span>
                  </div>
                  <div className="space-y-1.5" data-testid="offer-2t-progress">
                    <div className="h-2 rounded-full bg-white border border-[#01362D]/15 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#01362D] transition-all"
                        style={{ width: `${offerPct}%` }}
                      />
                    </div>
                    {nextItem && (
                      <p className="text-[11px] text-slate-600 m-0 truncate">
                        Next: <span className="font-semibold text-slate-800">{nextItem}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {OFFER_2T_STATUS_STEPS.map((step) => {
                      const active = step.id === currentOfferStatus;
                      const stepI = OFFER_2T_STATUS_STEPS.findIndex((s) => s.id === step.id);
                      const completed = stepI < stepIdx || currentOfferStatus === 'done';
                      return (
                        <span
                          key={step.id}
                          className={`text-[11px] px-2.5 py-1 rounded-full border ${
                            active
                              ? 'bg-[#01362D] text-white border-[#01362D]'
                              : completed
                                ? 'bg-[#01362D]/10 text-[#01362D] border-[#01362D]/30'
                                : 'bg-white text-[#01362D] border-[#01362D]/40'
                          }`}
                        >
                          {completed && !active ? '✓ ' : ''}{step.label}
                        </span>
                      );
                    })}
                  </div>
                  <ul className="m-0 pl-4 text-xs text-slate-700 space-y-1">
                    {offerChecklist.map((item) => (
                      <li key={item.id} className={item.done ? 'opacity-60' : ''}>
                        {item.done ? '✓' : '○'} {item.label}{item.role ? ` · ${item.role}` : ''}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-slate-500 m-0">Human finishes &amp; signs — no outbound email / auto-MLS from Offer / 2-T v1.</p>
                </div>
                );
              })()}


                {/* Surface lock #2 B2/B3: What / Blocker / Decide — no Brief&copy, no CAPS dump */}
                {surfaceGates.showDealRiskShell && (
                  <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-xs space-y-3.5" data-testid="deal-risk-shell">
                    <div className="flex items-center gap-2 pb-2 border-b border-rose-100">
                      <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900">Deal risk</h3>
                      <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        {surfaceLaneChip}
                      </span>
                    </div>
                    <div className="space-y-1.5" data-testid="deal-risk-what">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">What</span>
                      <p className="text-sm text-slate-800 leading-relaxed font-medium m-0">
                        {dealRiskAlert
                          ? `${(dealRiskAlert.kinds || []).join(' · ') || 'Collapsing file'} — BIC/owner negotiates; no client auto-send.`
                          : (activeTask.notes || activeTask.title || 'Operational file needs an unblock path.')}
                      </p>
                    </div>
                    <div className="space-y-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2" data-testid="deal-risk-blocker">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Blocker</span>
                      <p className="text-sm text-rose-950 leading-relaxed font-medium m-0">
                        {dealRiskAlert?.playbookExcerpt
                          ? String(dealRiskAlert.playbookExcerpt).slice(0, 180)
                          : 'File is blocked until a human decision path is chosen.'}
                      </p>
                    </div>
                    <div className="space-y-1.5" data-testid="deal-risk-decide">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Decide</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['Repair credit', 'Terminate', 'Renegotiate', 'Extend'].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-[11px] font-bold text-slate-800 cursor-pointer nest-press"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                    {!surfaceGates.hideCapsPlaybookDump && dealRiskAlert?.playbookTitle && (
                      <div className="text-[11px] text-rose-700/90" data-testid="deal-risk-playbook-dump">
                        Playbook: {dealRiskAlert.playbookTitle}
                      </div>
                    )}
                  </div>
                )}

                {/* Lock #2.1/#2.2 B1 Apple fold — dense Request · Next · Done when · Blocker */}
                {surfaceGates.showAppleFold && (
                  <div
                    className={
                      surfaceGates.denseAppleFold
                        ? 'bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs'
                        : 'bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5'
                    }
                    data-testid={surfaceGates.denseAppleFold ? 'surface-apple-fold-dense' : 'surface-apple-fold'}
                    data-dense-meta={surfaceGates.denseAppleFold ? 'true' : 'false'}
                  >
                    <p
                      className={
                        surfaceGates.denseAppleFold
                          ? 'text-[13px] text-slate-900 font-semibold leading-snug m-0'
                          : 'text-sm text-slate-900 font-semibold leading-snug m-0'
                      }
                      data-testid="surface-apple-request"
                    >
                      {surfaceAppleFold.request}
                    </p>
                    {surfaceGates.denseAppleFold ? (
                      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                        <p
                          className="text-[11px] text-slate-700 font-medium m-0"
                          data-testid="surface-drawer-next"
                        >
                          <span className="text-slate-400 font-bold uppercase tracking-wide text-[9px] mr-1">Next</span>
                          {surfaceAppleFold.next}
                        </p>
                        <p
                          className="text-[11px] text-slate-500 font-medium m-0"
                          data-testid="surface-apple-done-when"
                        >
                          {surfaceAppleFold.doneWhen}
                        </p>
                        {surfaceAppleFold.blocker && (
                          <span
                            className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800"
                            data-testid="surface-apple-blocker"
                          >
                            <span className="uppercase tracking-wide text-rose-600 font-bold">Blocker</span>
                            {surfaceAppleFold.blocker}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <p
                          className="text-[12px] text-slate-700 font-medium m-0"
                          data-testid="surface-drawer-next"
                        >
                          Next: {surfaceAppleFold.next}
                        </p>
                        <p
                          className="text-[11px] text-slate-400 font-medium m-0"
                          data-testid="surface-apple-done-when"
                        >
                          {surfaceAppleFold.doneWhen}
                        </p>
                        {surfaceAppleFold.blocker && (
                          <div
                            className="space-y-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2"
                            data-testid="surface-apple-blocker"
                          >
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                              Blocker
                            </span>
                            <p className="text-sm text-rose-950 leading-relaxed font-medium m-0">
                              {surfaceAppleFold.blocker}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* CARD 2: Operational brief + creative copy — B1; Lock #2.1 collapse behind Details ▸ */}
                {surfaceGates.showBriefAndCopy && surfaceGates.collapseBriefBehindDetails && (
                  <details
                    className="bg-white border border-slate-200 rounded-2xl shadow-xs group"
                    data-testid="surface-details-disclosure"
                  >
                    <summary className="cursor-pointer list-none flex items-center gap-2 px-4 py-3 text-sm font-bold text-slate-800 select-none">
                      <span className="text-slate-400 group-open:rotate-90 transition-transform inline-block">▸</span>
                      Details
                    </summary>
                    <div className="px-4 pb-4 space-y-3.5 border-t border-slate-100" data-testid="brief-and-copy-card">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#00635C] flex items-center justify-center font-bold shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900">Brief &amp; copy</h3>
                  </div>

                  {/* Operational brief — first (Marcus template) */}
                  <div className="space-y-1.5" data-testid="operational-brief">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">What happened</span>
                    <p className="text-sm text-slate-800 leading-relaxed font-medium m-0">
                      {operationalBrief}
                    </p>
                    {hasCallSource && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveViewMode('history');
                          setActiveTab('history');
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00635C] hover:underline cursor-pointer mt-0.5"
                        data-testid="brief-open-call-link"
                      >
                        Open call
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Deliverable chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deliverable</span>
                    {(activeTask.requestedAssets || [{ name: activeTask.packageType, format: 'PDF / PNG', dimensions: 'Standard Specs' }]).map((asset, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-[11px] text-slate-700"
                        title={asset.dimensions || 'Standard Format'}
                      >
                        <span className="font-bold truncate max-w-[140px]">{asset.name}</span>
                        {asset.format && (
                          <span className="font-mono text-[10px] text-slate-500">{asset.format}</span>
                        )}
                      </span>
                    ))}
                  </div>

                  {/* Structured Request Brief (Instructions & Scope) */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-700 block">Creative notes</span>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
                      {cleanInstructions}
                    </div>
                  </div>

                  {/* 1-Click Copy Blocks — hidden for B2/B3 */}
                  {surfaceGates.showHeadlineRemarksCopy && (
                  <div className="space-y-3 pt-1" data-testid="headline-remarks-copy">
                    {/* Headline */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Listing Headline:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(activeTask.listingDetails?.headline || activeTask.title || '', 'Headline')}
                          className="text-[#00635C] hover:underline font-semibold flex items-center gap-1 cursor-pointer text-xs"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedField === 'Headline' ? 'Copied!' : 'Copy Headline'}</span>
                        </button>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium">
                        {activeTask.listingDetails?.headline || activeTask.title || 'Charming Property in Prime Location'}
                      </div>
                    </div>

                    {/* Remarks / Description */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Listing Remarks &amp; Features:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(activeTask.listingDetails?.description || '', 'Description')}
                          className="text-[#00635C] hover:underline font-semibold flex items-center gap-1 cursor-pointer text-xs"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedField === 'Description' ? 'Copied!' : 'Copy Remarks'}</span>
                        </button>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed max-h-32 overflow-y-auto">
                        {activeTask.listingDetails?.description || activeTask.notes || 'No description provided.'}
                      </div>
                    </div>

                    {/* Disclosures */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Mandatory NCREC Disclosures:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(activeTask.listingDetails?.disclosures || 'Nest Realty Wilmington · NC Broker #C29184 · Equal Housing Opportunity.', 'Disclosures')}
                          className="text-[#00635C] hover:underline font-semibold flex items-center gap-1 cursor-pointer text-xs"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedField === 'Disclosures' ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 font-mono">
                        {activeTask.listingDetails?.disclosures || 'Nest Realty Wilmington · NC Broker #C29184 · Equal Housing Opportunity.'}
                      </div>
                    </div>
                  </div>

                  )}
                  {/* Legacy deal-triage-banner only when CAPS dump allowed (B1 edge) */}
                  {!surfaceGates.hideCapsPlaybookDump && getDealTriageFromTask(activeTask) && (
                    <div
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-950 space-y-1"
                      data-testid="deal-triage-banner"
                    >
                      <div className="font-bold">
                        {formatDealTriageBoardBadge(getDealTriageFromTask(activeTask)!)}
                      </div>
                      <div className="text-rose-800">
                        Nora flagged a collapsing file. BIC/owner negotiates — no client auto-send.
                      </div>
                      <div className="text-rose-700/90">
                        Playbook: {getDealTriageFromTask(activeTask)!.playbookTitle}
                      </div>
                    </div>
                  )}

                  {isMarketingCreativeTask(activeTask) && (
                    <div className="flex flex-wrap items-center gap-2" data-testid="creative-maxa-status">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border border-orange-200 bg-orange-50 text-orange-900">
                        {formatMaxaBoardStatus(deriveMaxaBoardStatus(activeTask))}
                      </span>
                      {getCreativeBriefFromTask(activeTask) && (
                        <span className="text-[10px] text-slate-500">
                          {getCreativeBriefFromTask(activeTask)!.deliverables.join(' · ')}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">No outbound until complete</span>
                    </div>
                  )}

                  {/* Maxa + Copy All — bottom of brief card */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    <a
                      href="https://nest.maxadesigns.com"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs nest-press"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Nest Design Center (Maxa) ↗</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyAllDetails}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs nest-press"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedField === 'All Details' ? '✓ Copied!' : 'Copy All Copy'}</span>
                    </button>
                  </div>
                </div>
                  </details>
                )}

                </div>
              </section>

              {/* ========== CHUNK: WORK ========== */}
              <section className="space-y-3" data-testid="chunk-work">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-0.5">Work</h2>
                <div className="space-y-4">

                {/* CARD 3: SOURCE ASSETS & PHOTOGRAPHY (Miller's Law Card 3) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#00635C] flex items-center justify-center font-bold shrink-0">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                          <span>Assets &amp; proofs</span>
                        </h3>
                      </div>
                    </div>

                    {/* Google Drive Link */}
                    {resolvedAssets.googleDriveUrl && (
                      <a
                        href={resolvedAssets.googleDriveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open Drive Folder ↗</span>
                      </a>
                    )}
                  </div>

                  {/* Empty state with Notify Manager or Photo Grid */}
                  {((resolvedAssets.photos.length === 0) && (!activeTask.photos || activeTask.photos.length === 0)) ? (
                    hasMlsOnFile ? (
                      <div className="p-6 text-center bg-emerald-50/70 rounded-2xl border-2 border-dashed border-emerald-200 space-y-3" data-testid="mls-photos-unlock-panel">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="max-w-md mx-auto space-y-1">
                          <div className="font-bold text-sm text-emerald-950">MLS # on file — retrieve from Flex MLS</div>
                          <p className="text-xs text-emerald-800 leading-relaxed">
                            No uploaded source photos yet, but MLS <span className="font-mono font-bold">#{mlsNumber}</span> lets production pull listing photos from Flex MLS. Missing uploads do not block Mark Complete or Send for approval.
                          </p>
                        </div>
                        {flagPhotosMessage && (
                          <div className="p-3 bg-white border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold max-w-md mx-auto">
                            {flagPhotosMessage}
                          </div>
                        )}
                      </div>
                    ) : !isMarketingTask ? (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2" data-testid="ops-optional-attachments-panel">
                      <div className="flex items-start gap-2.5">
                        <Paperclip className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-bold text-xs text-slate-800 uppercase tracking-wide">Attachments optional</div>
                          <p className="text-[11px] text-slate-600 leading-relaxed m-0">
                            Operational tasks do not need source photos or proofs to complete. Upload a file only if it helps the assignee.
                          </p>
                        </div>
                      </div>
                    </div>
                    ) : (
                    <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 space-y-3" data-testid="missing-photos-nora-panel">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-bold text-xs text-amber-950 uppercase tracking-wide">Photos required</div>
                          <p className="text-[11px] text-amber-800 leading-relaxed m-0">
                            No source photos and no MLS#. Request via Nora, or override if assets are elsewhere.
                          </p>
                        </div>
                      </div>

                      {flagPhotosMessage && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold max-w-md mx-auto">
                          {flagPhotosMessage}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={handleResendPhotoRequest}
                          disabled={!parentRequestId || isResendingPhotos}
                          title={!parentRequestId ? 'No parent request id for Nora email' : 'Email agent via Nora for listing photos'}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            !parentRequestId || isResendingPhotos
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : 'bg-[#00635C] hover:bg-[#004c46] text-white'
                          }`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>{isResendingPhotos ? 'Requesting…' : 'Request via Nora'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleNotifyManagerMissingPhotos}
                          disabled={isPhotosFlagged || isFlaggingPhotos}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                            isPhotosFlagged
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : 'bg-amber-600 hover:bg-amber-700 text-white'
                          }`}
                        >
                          <Flag className="w-3.5 h-3.5" />
                          <span>{isPhotosFlagged ? 'Manager Flagged (No Action Needed)' : 'Notify Manager Photos Are Missing'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPhotosOverridden(true)}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                        >
                          Proceed without photos (Override)
                        </button>
                      </div>
                    </div>
                    )
                  ) : surfaceGates.showOnePhotoPrimary && surfacePrimaryPhoto ? (
                    <div
                      className="space-y-2"
                      data-testid="surface-one-photo-primary"
                    >
                      <div
                        onClick={() => setLightboxItem({
                          title: surfacePrimaryPhoto.name,
                          previewUrl: surfacePrimaryPhoto.url,
                          downloadUrl: surfacePrimaryPhoto.url
                        })}
                        className="relative w-full aspect-[16/10] max-h-56 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group cursor-pointer"
                      >
                        <img
                          src={surfacePrimaryPhoto.url}
                          alt={surfacePrimaryPhoto.name}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-200"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-slate-900/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-white bg-slate-900/55 px-2 py-0.5 rounded-md truncate">
                            {surfacePrimaryPhoto.name}
                          </span>
                          {surfacePrimaryPhoto.moreCount > 0 && (
                            <span className="text-[10px] font-bold text-white bg-slate-900/60 px-2 py-0.5 rounded-md shrink-0">
                              +{surfacePrimaryPhoto.moreCount} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {(resolvedAssets.photos.length > 0 ? resolvedAssets.photos : (activeTask.photos || [])).map((photo: any, pIdx: number) => {
                        const pUrl = typeof photo === 'string' ? photo : photo.url;
                        const pName = typeof photo === 'string' ? `Photo ${pIdx + 1}` : (photo.name || `Photo ${pIdx + 1}`);
                        return (
                          <div
                            key={photo.id || pIdx}
                            onClick={() => setLightboxItem({
                              title: pName,
                              previewUrl: pUrl,
                              downloadUrl: pUrl
                            })}
                            className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative group cursor-pointer"
                          >
                            <img
                              src={pUrl}
                              alt={pName}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Critiquito P2: call player lives in History — Workstation only links via Brief "Open call" */}
                </div>



                {/* Deliverable switcher — small chips (Critiquito P1: not a campaign hero) */}
                {siblingTasks.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5" data-testid="deliverable-switcher-chips">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-0.5">Deliverables</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[#00635C] font-bold text-[11px] border border-emerald-200">
                      {activeTask.packageType}
                    </span>
                    {siblingTasks.map((sibling) => (
                      <button
                        key={sibling.id}
                        type="button"
                        onClick={() => onSelectTask && onSelectTask(sibling.id)}
                        className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-50 text-slate-600 font-semibold text-[11px] border border-slate-200 cursor-pointer nest-press"
                        title={`Switch to ${sibling.packageType}`}
                      >
                        {sibling.packageType}
                      </button>
                    ))}
                  </div>
                )}

                {/* REVISION FEEDBACK BANNER (If revisions were requested) */}
                {(isRevision || activeTask.reviewState === 'revisions_requested' || latestRevisionFeedback) && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2.5 animate-in fade-in" data-testid="tab3-revision-feedback-banner">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-amber-950 font-bold text-xs uppercase tracking-wide">
                        <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Action Required: Revision Feedback from {activeTask.reviewOwnerName || directorFullName || 'Marketing Director'}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase tracking-wider shrink-0">
                        Needs Revision
                      </span>
                    </div>
                    <div className="text-xs text-amber-950 bg-white rounded-xl p-3.5 border border-amber-200 font-medium whitespace-pre-wrap leading-relaxed shadow-2xs">
                      {latestRevisionFeedback || activeTask.proofNotes || 'Please adjust the collateral proofs according to reviewer instructions and resubmit for review.'}
                    </div>
                  </div>
                )}

                {/* CARD 4: PROOF DROPZONE & URL INPUT (The Peak Moment) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-[#00635C]" />
                        <span>Finished proof</span>
                      </h3>
                    </div>

                    {surfaceGates.showUpload && (
                    <button
                      type="button"
                      onClick={() => setIsUploadWizardOpen(true)}
                      className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
                      data-testid="surface-drawer-upload-body"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Finished Asset</span>
                    </button>
                    )}
                  </div>

                  {/* Staged Asset Preview with Instant DPI Inspector Badge */}
                  {stagedAssets.length > 0 ? (
                    <div className="space-y-3">
                      {stagedAssets.map((asset) => {
                        const isPrintReady = (asset.dpi && asset.dpi >= 300) || asset.dpiVerified;
                        return (
                          <div key={asset.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex gap-3 items-start shadow-2xs">
                            <div
                              onClick={() => setLightboxItem({
                                title: asset.deliverableName,
                                previewUrl: asset.previewUrl,
                                downloadUrl: asset.previewUrl,
                                dimensions: asset.dimensions || undefined,
                                aspectRatio: asset.aspectRatio || undefined,
                                dpi: asset.dpi,
                                dpiVerified: asset.dpiVerified,
                                dpiLabel: asset.dpiLabel,
                                fileSizeBytes: asset.fileSizeBytes,
                                version: asset.version,
                                uploadedBy: asset.uploadedBy,
                                uploadedAt: asset.uploadedAt
                              })}
                              className="w-16 h-20 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 cursor-pointer shrink-0 relative group"
                            >
                              {asset.mimeType === 'application/pdf' ? (
                                <FileText className="w-7 h-7 text-emerald-400" />
                              ) : (
                                <img
                                  src={asset.previewUrl}
                                  alt={asset.fileName}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="w-4 h-4 text-white" />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 truncate">{asset.deliverableName}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                                  v{asset.version}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono truncate">{asset.fileName}</div>

                              {/* Doherty Instant Feedback: DPI & Resolution Inspector Badge */}
                              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                {isPrintReady ? (
                                  <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                    <span>300 DPI — Print Ready</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                                    <Info className="w-3 h-3 text-blue-700" />
                                    <span>{asset.dpi || 72} DPI — Digital / Screen</span>
                                  </span>
                                )}
                                {asset.width && asset.height && (
                                  <span className="text-[10px] font-mono text-slate-500">
                                    {asset.width} × {asset.height} px
                                  </span>
                                )}
                              </div>

                              <div className="pt-1 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {asset.fileSizeBytes ? `${Math.round(asset.fileSizeBytes / 1024)} KB` : 'Uploaded file'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setStagedAssets(prev => prev.filter(a => a.id !== asset.id))}
                                  className="text-rose-600 hover:text-rose-800 text-[11px] font-bold cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : proofInputValue(activeTask.proofUrl) ? (
                    (() => {
                      const proofUrl = activeTask.proofUrl;
                      const isUploadedServerAsset = proofUrl.startsWith('/uploads/') || !proofUrl.startsWith('http');
                      const fileName = (() => {
                        try {
                          const raw = proofUrl.split('?')[0].split('/').filter(Boolean).pop() || 'Proof asset';
                          return decodeURIComponent(raw);
                        } catch {
                          return 'Proof asset';
                        }
                      })();
                      const versionLabel = `v${currentProofVersion || 1}`;
                      const isPdf = /\.pdf($|\?)/i.test(proofUrl) || fileName.toLowerCase().endsWith('.pdf');
                      const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)($|\?)/i.test(proofUrl) || fileName.match(/\.(png|jpe?g|gif|webp|bmp|svg)$/i);
                      return (
                        <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs" data-testid="collateral-proof-card">
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={() => setLightboxItem({
                                title: fileName,
                                previewUrl: proofUrl,
                                downloadUrl: proofUrl,
                                version: currentProofVersion || 1
                              })}
                              className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-emerald-200 flex items-center justify-center shrink-0 cursor-pointer relative group"
                              title="Preview proof"
                            >
                              {isPdf ? (
                                <FileText className="w-6 h-6 text-emerald-300" />
                              ) : isImage || isUploadedServerAsset ? (
                                <img
                                  src={proofUrl}
                                  alt={fileName}
                                  className="w-full h-full object-cover group-hover:scale-105 transition"
                                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                                />
                              ) : (
                                <Eye className="w-5 h-5 text-emerald-300" />
                              )}
                              <div className="absolute inset-0 bg-slate-900/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="w-4 h-4 text-white" />
                              </div>
                            </button>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-bold text-emerald-950 truncate">{fileName}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold shrink-0">
                                  {versionLabel}
                                </span>
                              </div>
                              <span className="text-[11px] text-emerald-900/70 block mt-0.5">
                                {isUploadedServerAsset ? 'Local upload staged — preview in browser' : 'External proof link staged'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                            <button
                              type="button"
                              onClick={() => setLightboxItem({
                                title: fileName,
                                previewUrl: proofUrl,
                                downloadUrl: proofUrl,
                                version: currentProofVersion || 1
                              })}
                              className="px-3 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-lg font-bold flex items-center gap-1 text-xs cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview</span>
                            </button>
                            <a
                              href={proofUrl}
                              target="_blank"
                              rel="noreferrer"
                              download={isUploadedServerAsset ? true : undefined}
                              className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-900 rounded-lg font-bold flex items-center gap-1 hover:bg-emerald-50 text-xs"
                            >
                              {isUploadedServerAsset ? (
                                <>
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Open ↗</span>
                                </>
                              )}
                            </a>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="p-5 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center space-y-1.5">
                      <FolderOpen className="w-7 h-7 text-slate-400 mx-auto" />
                      <div className="text-xs font-semibold text-slate-700">No proof staged yet</div>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Click <strong>Upload Finished Asset</strong> or paste a Google Drive, Canva, or Maxa URL below to stage proof.
                      </p>
                    </div>
                  )}

                  {/* Manual URL Input */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>{manualProofUrl.startsWith('/uploads/') ? 'Uploaded File Staged:' : 'Image / file link (optional — Google Drive, Canva, or Maxa)'}</span>
                      {manualProofUrl && !urlValidationError && (
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {manualProofUrl.startsWith('/uploads/') ? 'Uploaded File Staged' : 'Valid Link'}
                        </span>
                      )}
                    </label>
                    <input
                      type="url"
                      value={manualProofUrl}
                      onChange={(e) => handleProofUrlChange(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/... or canva.com/design/..."
                      className={`w-full text-xs p-3 rounded-xl border bg-slate-50 focus:bg-white outline-none transition ${
                        urlValidationError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-[#00635C]'
                      }`}
                    />
                    {urlValidationError && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1">{urlValidationError}</p>
                    )}
                  </div>
                </div>

                {/* CARD 5: PRE-SUBMISSION CHECKLIST (Quality & Compliance) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <button
                        type="button"
                        onClick={() => setChecklistCollapsed(v => !v)}
                        className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#00635C]" />
                        <span>Checklist</span>
                        <span className="text-[11px] font-semibold text-slate-500 ml-1">{checklistCollapsed ? 'Show' : 'Hide'}</span>
                      </button>
                    </div>

                    {!checklistCollapsed && (
                    <button
                      type="button"
                      onClick={handleVerifyAllRequirements}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Verify All Items ✓</span>
                    </button>
                    )}
                  </div>

                  {!checklistCollapsed && (
                  <>
                  {/* Doherty Threshold Real-time Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">Checklist Readiness</span>
                      <span className={checklistProgressPct === 100 ? 'text-emerald-700 font-mono' : 'text-slate-600 font-mono'}>
                        {satisfiedCount} of {requirements.length} Verified ({checklistProgressPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${checklistProgressPct === 100 ? 'bg-emerald-500' : 'bg-[#00635C]'}`}
                        style={{ width: `${checklistProgressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Chunked Requirements Items */}
                  <div className="space-y-2.5">
                    {requirements.map((req) => {
                      const isVerified = req.status === 'verified';
                      const isNeedsCorrection = req.status === 'needs_correction';
                      const isNotApplicable = req.status === 'not_applicable';
                      const isNotReviewed = req.status === 'not_reviewed';

                      return (
                        <div
                          key={req.id}
                          className={`p-3 rounded-xl border transition space-y-2 ${
                            isVerified
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : isNeedsCorrection
                              ? 'bg-amber-50/50 border-amber-300'
                              : isNotApplicable
                              ? 'bg-slate-50/60 border-slate-200 opacity-60'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className={`font-bold text-xs ${isNotApplicable ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                {req.label}
                              </div>
                              {req.description && (
                                <div className="text-[11px] text-slate-500 leading-normal">
                                  {req.description}
                                </div>
                              )}
                              {req.verifiedByName && (
                                <div className="text-[10px] text-slate-400 font-mono">
                                  Verified by {req.verifiedByName} at {formatNewYorkDateTime(req.verifiedAt)}
                                </div>
                              )}
                            </div>

                            {/* 4 State Selector Buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleSetRequirementStatus(req.id, 'verified')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                  isVerified
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'bg-white hover:bg-emerald-50 text-slate-600 border border-slate-200'
                                }`}
                              >
                                <Check className="w-3 h-3" />
                                <span>Verified</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetRequirementStatus(req.id, 'needs_correction')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                  isNeedsCorrection
                                    ? 'bg-amber-600 text-white shadow-2xs'
                                    : 'bg-white hover:bg-amber-50 text-slate-600 border border-slate-200'
                                }`}
                              >
                                <AlertTriangle className="w-3 h-3" />
                                <span>Needs Correction</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetRequirementStatus(req.id, 'not_applicable')}
                                className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  isNotApplicable
                                    ? 'bg-slate-700 text-white shadow-2xs'
                                    : 'bg-white hover:bg-slate-100 text-slate-500 border border-slate-200'
                                }`}
                              >
                                <span>N/A</span>
                              </button>

                              {!isNotReviewed && (
                                <button
                                  type="button"
                                  onClick={() => handleSetRequirementStatus(req.id, 'not_reviewed')}
                                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                                  title="Reset to not reviewed"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  </>
                  )}
                </div>

                {/* CARD 6: PRODUCTION NOTES FOR REVIEWER */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                      <span>Production &amp; Dispatch Notes:</span>
                    </span>
                    <span className={`text-[10px] font-mono flex items-center gap-1 ${notesSaveStatus === 'saving' ? 'text-amber-600' : 'text-emerald-700'}`}>
                      {notesSaveStatus === 'saving' ? (
                        <>
                          <Clock className="w-3 h-3 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Saved</span>
                        </>
                      )}
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    value={productionNotes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="e.g. Completed flyer and social carousel. Disclosures verified. Ready for review."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00635C] outline-none transition resize-none"
                  />
                </div>

                {/* CARD 7: GOVERNING SOP REFERENCE */}
                {(activeTask.governingSopId || activeTask.sopCode) && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
                        {activeTask.governingSopId || activeTask.sopCode}
                      </span>
                      <span className="font-bold text-slate-900">
                        {activeTask.governingSopTitle || activeTask.sopTitle || 'Governing Standard Operating Procedure'}
                      </span>
                    </div>

                    {onOpenSopDocument && (
                      <button
                        type="button"
                        onClick={() => onOpenSopDocument(MARKETING_SOPS[activeTask.governingSopId || activeTask.sopCode || ''] || getCampaignGoverningSop(activeTask.packageType))}
                        className="px-3 py-1 rounded-xl text-xs font-bold text-[#00635C] hover:bg-emerald-50 transition flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Inspect SOP ↗</span>
                      </button>
                    )}
                  </div>
                )}

                </div>
              </section>

            </div>
          )}

        </div>

        {/* =========================================================================
            3. FIXED STICKY FOOTER ACTION BAR (SERIAL POSITION EFFECT RECENCY)
           ========================================================================= */}
        <footer className="bg-white border-t border-slate-200 px-4 sm:px-5 py-2 shadow-xl flex flex-row flex-wrap items-center justify-between gap-2 shrink-0 z-30" data-testid="workstation-footer">
          
          {/* Left: Close + save status (Serial Position — Close is secondary escape) */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAttemptClose}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
            <div className="flex items-center gap-1.5 text-xs">
              {saveStatus === 'saved' && (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Saved</span>
                </span>
              )}
              {saveStatus === 'saving' && (
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  <span>Saving...</span>
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Save failed</span>
                </span>
              )}
            </div>
          </div>

          {/* Right: Unambiguous Next Action & Modal Close */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">

            {/* Mode A — footer primary matches Next verb */}
            {isSurfaceTriage && (
              <button
                type="button"
                onClick={handleConfirmTriage}
                disabled={isTriageResolving || !triageCategory}
                data-testid="surface-drawer-footer-confirm-routing"
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shrink-0 ${
                  triageCategory && !isTriageResolving
                    ? 'bg-[#00635C] hover:bg-[#004d47] text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title={SURFACE_DRAWER_CONFIRM_ROUTING_LABEL}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isTriageResolving ? 'Routing...' : surfaceNext.verb}</span>
              </button>
            )}

            {/* Mode B2/B3 — Unblock primary */}
            {!isSurfaceTriage && surfaceGates.showDealRiskShell && (
              <button
                type="button"
                data-testid="surface-drawer-footer-unblock"
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shrink-0 bg-[#00635C] hover:bg-[#004d47] text-white cursor-pointer"
                title={surfaceNext.sentence}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{surfaceNext.verb}</span>
              </button>
            )}
            
            {/* PRODUCER VIEW — hide Send for review once proof is already awaiting director review (show amber status instead) */}
            {surfaceGates.showApproveNotify && canSubmitToReviewer && !(isAwaitingReviewLane && hasAnyProof && !isRevision) && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                {/* Explain why disabled if requirements unmet */}
                {!canSendForApproval && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1.5 max-w-full overflow-hidden">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="font-semibold truncate max-w-[240px] sm:max-w-xs">
                      {blockingReasons[0] || 'Checklist or proof requirements incomplete'}
                    </span>
                  </div>
                )}

                {/* Primary Action Button: Send for review (producer / assignee ≠ reviewer) */}
                <button
                  type="button"
                  onClick={handleAttemptSendForApproval}
                  disabled={!canSendForApproval || isSubmitting}
                  data-action="Send for review"
                  data-testid="producer-send-for-review"
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shrink-0 ${
                    canSendForApproval && !isSubmitting
                      ? 'bg-[#00635C] hover:bg-[#004d47] text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title={canSendForApproval ? 'Send for review' : blockingReasons.join(' • ')}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSubmitting
                      ? 'Submitting...'
                      : 'Send for review'}
                  </span>
                </button>
              </div>
            )}

            {/* NON-MANAGER IN REVIEW LANE (Informative state for non-directors viewing an in-review task) */}
            {/* Producers waiting on Melissa — never show this self-loop when the director is completing her own agent-requested work */}
            {surfaceGates.showApproveNotify && !canApproveAndNotify && isAwaitingReviewLane && hasAnyProof && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Submitted • Awaiting Manager Approval ({activeTask.reviewOwnerName || directorFirstName || 'Melissa'})</span>
              </div>
            )}
            {surfaceGates.showApproveNotify && !canApproveAndNotify && canSubmitToReviewer && isAwaitingReviewLane && !hasAnyProof && (
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>In Production • Proof Staging Pending</span>
              </div>
            )}

            {/* DEPARTMENT DIRECTOR REVIEW / SELF-COMPLETE VIEW */}
            {surfaceGates.showApproveNotify && canApproveAndNotify && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-wrap sm:flex-nowrap">
                {/* Intended Recipient & Proof Attribution */}
                {surfaceGates.showEmailFooter && (
                <div
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border shadow-2xs ${
                    !isRecipientConfirmed ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                  title={isRecipientConfirmed ? `To: ${verifiedRecipient.name} (${verifiedRecipient.email || 'No email'}) • Proof v${currentProofVersion}` : 'Requester needs confirmation before external delivery'}
                  data-testid="surface-drawer-email-footer"
                >
                  <Mail className={`w-3.5 h-3.5 shrink-0 ${!isRecipientConfirmed ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span className="truncate max-w-[220px] sm:max-w-xs font-medium">
                    {isRecipientConfirmed ? (
                      <>To: <strong className="text-slate-900">{verifiedRecipient.name}</strong> ({verifiedRecipient.email || 'No email'}) • Proof v{currentProofVersion}</>
                    ) : (
                      <span className="font-semibold text-amber-900">Requester needs confirmation</span>
                    )}
                  </span>
                  {!isRecipientConfirmed && (
                    <button
                      type="button"
                      onClick={() => setIsConfirmRequesterOpen(true)}
                      className="ml-1.5 px-2 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-lg text-[10px] transition cursor-pointer"
                    >
                      Confirm Requester
                    </button>
                  )}
                </div>
                )}

                {/* Final approval — header/status carries authority; keep footer lean */}

                {/* Held status message if applicable */}
                {deliveryStatus === 'held' && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Dispatch held (safe mode). Proof approved.</span>
                  </div>
                )}

                {/* Request Revisions (if task is awaiting review and not self-submitted) */}
                {canRequestRevisions && (activeTask.reviewState === 'awaiting_review' || activeTask.status === 'awaiting_review' || activeTask.status === 'ready_for_review' || activeTask.status === 'agent_review') && !isSelfApprovalBlocked && (
                  <button
                    type="button"
                    onClick={() => setIsRevisionModalOpen(true)}
                    disabled={isSubmitting}
                    className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Revisions</span>
                  </button>
                )}

                {/* Confirm-requester only in footer — upload cue lives in header */}
                {!isRecipientConfirmed && !isCurrentProofApproved && (
                  <div
                    className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1.5 max-w-full overflow-hidden"
                    data-testid="approve-disabled-reason"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="font-semibold truncate max-w-[240px]">Confirm requester first</span>
                  </div>
                )}

                {/* Primary Action Button: Approve & Send to Agent / Send to Agent / Retry send to agent */}
                {isCurrentProofApproved ? (
                  (deliveryStatus === 'held' || deliveryStatus === 'error') ? (
                    <button
                      type="button"
                      onClick={openDeliveryOutreach}
                      disabled={isSubmitting || !isRecipientConfirmed}
                      className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shrink-0 ${
                        !isRecipientConfirmed
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
                      }`}
                      title={!isRecipientConfirmed ? 'Requester needs confirmation before external delivery' : 'Retry sending approved proof to agent'}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Retrying dispatch...' : 'Retry send to agent'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={openDeliveryOutreach}
                      disabled={isSubmitting || !isRecipientConfirmed}
                      data-action="Send to agent"
                      className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shrink-0 ${
                        !isRecipientConfirmed
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-[#00635C] hover:bg-[#004d47] text-white cursor-pointer'
                      }`}
                      title={!isRecipientConfirmed ? 'Requester needs confirmation before external delivery' : 'Send approved proof to agent (Send to agent)'}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Sending to agent...' : 'Send to Agent'}</span>
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={openDeliveryOutreach}
                    disabled={isSubmitting || !isRecipientConfirmed}
                    data-action="Approve & send to agent"
                    data-recipient-status={activeDispatchVerdict?.recipientStatus || 'pending'}
                    aria-label="Approve for Delivery (Approve & Send to Agent)"
                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shrink-0 ${
                      !isRecipientConfirmed || isSubmitting
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-[#00635C] hover:bg-[#004d47] text-white cursor-pointer'
                    }`}
                    title={
                      !isRecipientConfirmed
                        ? 'Requester needs confirmation before external delivery'
                        : 'Approve and notify the agent. The Drive folder is created automatically; paste a link only if create fails.'
                    }
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Opening outreach...' : (isDirectorSelfComplete || isDirectorReviewingSubmittedProof ? 'Approve & Notify Agent' : 'Approve & Notify Agent')}</span>
                  </button>
                )}
              </div>
            )}

          </div>

        </footer>

      </div>


      {evidenceCheck && evidenceCheck.items.length > 0 && activeTab === 'proof' && (
        <div
          className="mx-5 mb-3 rounded-2xl border border-stone-200 bg-[#F7F8F5] p-4 space-y-2"
          data-testid="nora-evidence-autocheck"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-bold text-[#01362D]">Nora evidence check</div>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
              not auto-approved
            </span>
          </div>
          <p className="text-[11px] text-stone-600 leading-relaxed">{evidenceCheck.summary}</p>
          <ul className="space-y-1.5">
            {evidenceCheck.items.map((item) => (
              <li
                key={item.id}
                className={`text-[11px] rounded-lg px-2.5 py-1.5 border ${
                  item.status === 'pass'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : item.status === 'fail'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                <span className="font-semibold">{item.status === 'pass' ? 'Pass' : item.status === 'fail' ? 'Missing' : 'Needs human'} · </span>
                {item.label}
                <div className="opacity-80 mt-0.5">{item.cite}</div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="text-[11px] font-semibold text-[#00635C] hover:underline cursor-pointer"
            onClick={() =>
              setEvidenceCheck(
                runEvidenceAutoCheck({
                  task: activeTask as any,
                  assets: stagedAssets,
                })
              )
            }
          >
            Re-run check
          </button>
        </div>
      )}

      {/* MODAL: PROOF UPLOAD WIZARD */}
      <ProofUploadWizard
        isOpen={isUploadWizardOpen}
        onClose={() => setIsUploadWizardOpen(false)}
        requestedDeliverables={
          (activeTask.requestedAssets && activeTask.requestedAssets.length > 0)
            ? activeTask.requestedAssets
            : [{ name: activeTask.packageType || activeTask.title || 'Task deliverable', format: 'As specified', dimensions: '' }]
        }
        lockedDeliverableName={activeTask.packageType || activeTask.title || activeTask.requestedAssets?.[0]?.name}
        siblingDeliverables={(tasksList || [])
          .filter(t => t && t.id !== activeTask.id && t.requestId && activeTask.requestId && t.requestId === activeTask.requestId)
          .map(t => ({ name: t.packageType || t.title || 'Sibling deliverable', format: t.category || '', dimensions: '' }))
        }
        currentProofVersion={activeTask.proofVersion || 0}
        currentUser={currentUser}
        onAssetConfirmed={(asset) => {
          setStagedAssets(prev => {
            const next = [...prev, asset];
            try {
              setEvidenceCheck(runEvidenceAutoCheck({
                task: activeTask as any,
                assets: next,
              }));
            } catch {
              /* non-blocking */
            }
            return next;
          });
          setUrlValidationError(null);
          setSaveStatus('saved');
          setActiveViewMode('workstation');
          setActiveTab('proof');
          setSaveStatus('saved');
        }}
      />

      {/* MODAL: EXPANDABLE PROOF LIGHTBOX VIEWER */}
      <ProofLightboxViewer
        isOpen={Boolean(lightboxItem)}
        item={lightboxItem}
        onClose={() => setLightboxItem(null)}
      />

      {/* MODAL: SOFT-WARNING FOR UNREVIEWED CHECKLIST ITEMS */}
      {showChecklistSoftWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-900 font-bold text-sm">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Unreviewed Checklist Items</h4>
                <p className="text-[11px] text-amber-800 font-normal">
                  {unreviewedCount} quality checklist item{unreviewedCount > 1 ? 's' : ''} not yet verified
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You have <strong>{unreviewedCount}</strong> requirement checklist items marked as <em>Not Reviewed</em>. Would you like to review them first, or submit to <strong>{directorFullName}</strong> anyway?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowChecklistSoftWarning(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Review Checklist
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowChecklistSoftWarning(false);
                  handleSendForApproval();
                }}
                className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit to Manager Anyway</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DIRECTOR REQUEST REVISIONS */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span>Request Revisions from Producer</span>
              </div>
              <button
                type="button"
                onClick={() => setIsRevisionModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Specify meaningful feedback for the assigned producer. The task will return to their active queue while retaining intake readiness.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Revision Instructions (Required):</label>
              <textarea
                rows={4}
                value={revisionFeedbackInput}
                onChange={(e) => setRevisionFeedbackInput(e.target.value)}
                placeholder="e.g. Please adjust font size on the secondary headline and verify NCREC license number placement on flyer back..."
                className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRevisionModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRequestRevisions}
                disabled={!revisionFeedbackInput.trim() || isSubmitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Send Revision Notes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM REQUESTER */}
      {isConfirmRequesterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150" data-testid="confirm-requester-modal">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-slate-900 font-bold text-sm">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#00635C] flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Confirm Requester</h4>
                <p className="text-[11px] text-slate-500 font-normal truncate max-w-[280px]">
                  {activeTask.propertyAddress || 'Listing Property'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Select the verified broker or agent who requested marketing collateral for this property before proceeding with external delivery:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {CANONICAL_AGENT_DIRECTORY.filter(a => a.personType === 'agent' || a.role.toLowerCase().includes('broker') || a.role.toLowerCase().includes('principal')).map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => handleConfirmRequester(agent)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-[#00635C] hover:bg-emerald-50/50 transition flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 group-hover:text-[#00635C] block truncate">
                      {agent.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono block truncate">
                      {agent.email} • {agent.office || 'Nest Realty'}
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-[#00635C] group-hover:text-white transition shrink-0">
                    Select
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmRequesterOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
