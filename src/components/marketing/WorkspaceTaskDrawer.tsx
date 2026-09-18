/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WorkspaceTaskDrawer — Human-Centered Proof Submission & Review Drawer
 * Replaces monolithic inline drawer in VAWorkspaceView with an accessible, role-adaptive workspace.
 * Producer (Eduardo): Brief, Source, Work, History, managed upload, requirements checklist, send for approval.
 * Marketing Operations Director (Melissa): Review proofs, request revisions with required notes, approve for delivery.
 * Zero autonomous Maxa presentation in producer view. Strict server authorization & verifiable DPI honesty.
 * 
 * Legacy tab labels for compatibility:
 * label: 'Assignment', label: 'Source Photos', label: 'Requirements', label: 'Proofs & Submission'
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  Image as ImageIcon,
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
  CheckSquare,
  Square,
  XCircle,
  MinusCircle,
  User
} from 'lucide-react';
import { ProofUploadWizard, UploadedProofAsset } from './ProofUploadWizard';
import { ProofLightboxViewer, LightboxAssetItem } from './ProofLightboxViewer';
import { validateProofUrl } from '../../utils/assetInspection';
import { getCampaignGoverningSop, MARKETING_SOPS, MarketingSopDefinition } from './marketingSopRegistry';
import { TEAM_MEMBERS } from './MarketingHomeInbox';
import { formatNewYorkDateTime, formatNewYorkRelativeDue } from './TaskRequestDetailModal';
import type { TaskRequirementItem, TaskInternalFlag } from '../../../server/persistence/marketingCampaignsRepository';
import { ActivityAndContactTimeline } from './ActivityAndContactTimeline';
import type { CanonicalActivityEvent } from '../../../server/services/activityHistoryService.js';
import { resolveCanonicalStaffMember } from '../../services/canonicalRoster';
import { getRequesterActionLabel } from '../../services/canonicalRecipientService';

export interface WorkspaceDrawerTask {
  id: string;
  campaignId?: string;
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
  requestId?: string;
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
  onReassignTask?: (taskId: string, newAssignee: string) => void;
  onAskRequester?: (task: WorkspaceDrawerTask) => void;
  onOpenSopDocument?: (sop: MarketingSopDefinition) => void;
  onSave?: (task: WorkspaceDrawerTask) => void;
  currentUser?: {
    id: string;
    name: string;
    role: string; // 'producer' | 'marketing_director' | 'admin' | 'owner' | etc.
  };
  currentUserRole?: string;
  currentUserName?: string;
  currentUserId?: string;
  initialTab?: 'brief' | 'source' | 'work' | 'history' | 'assignment' | 'photos' | 'requirements' | 'proofs';
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
  onReassignTask,
  onAskRequester,
  onOpenSopDocument,
  onSave,
  currentUser: propCurrentUser,
  currentUserRole,
  currentUserName,
  currentUserId,
  initialTab
}) => {
  const activeTask = propActiveTask || propTask || null;
  const currentUser = propCurrentUser || {
    id: currentUserId || 'staff_eduardo_lovo',
    name: currentUserName || 'Eduardo Lovo',
    role: currentUserRole || 'producer'
  };
  // Navigation tabs: 4 canonical tabs: Brief | Source | Work | History
  const [activeTab, setActiveTab] = useState<'brief' | 'source' | 'work' | 'history' | 'assignment' | 'photos' | 'requirements' | 'proofs'>(initialTab || 'brief');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Canonical Activity & Contact state
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

  // Input states for manual proof and notes
  const [manualProofUrl, setManualProofUrl] = useState<string>('');
  const [productionNotes, setProductionNotes] = useState<string>('');
  const [urlValidationError, setUrlValidationError] = useState<string | null>(null);

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

  // Uploaded assets staged for submission
  const [stagedAssets, setStagedAssets] = useState<UploadedProofAsset[]>([]);

  // Modals & Viewers
  const [isUploadWizardOpen, setIsUploadWizardOpen] = useState<boolean>(false);
  const [lightboxItem, setLightboxItem] = useState<LightboxAssetItem | null>(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState<boolean>(false);
  const [revisionFeedbackInput, setRevisionFeedbackInput] = useState<string>('');
  const [isRouteMenuOpen, setIsRouteMenuOpen] = useState<boolean>(false);
  const [isOverflowMenuOpen, setIsOverflowMenuOpen] = useState<boolean>(false);
  const [showTaskRefPopover, setShowTaskRefPopover] = useState<boolean>(false);

  // Actions & Save states
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Sync inputs when active task changes
  useEffect(() => {
    if (activeTask) {
      setManualProofUrl(activeTask.proofUrl || '');
      setProductionNotes(activeTask.proofNotes || activeTask.notes || '');
      setUrlValidationError(null);
      setStagedAssets([]);
      setSubmitSuccessMessage(null);
      setSaveStatus('saved');
      setIsPhotosFlagged(Boolean(activeTask.internalFlags?.some(f => f.type === 'missing_photos')));
      setFlagPhotosMessage(null);
      setPhotosOverridden(false);
      setShowTaskRefPopover(false);

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

  // Keyboard Escape listener
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
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, lightboxItem, isUploadWizardOpen, isRevisionModalOpen, onClose]);

  if (!isOpen || !activeTask) return null;

  // Derive Roles
  const userRole = (currentUser.role || '').toLowerCase();
  const isMarketingDirector =
    userRole === 'marketing_director' ||
    userRole === 'admin' ||
    userRole === 'owner' ||
    userRole === 'operations_manager' ||
    userRole === 'operations_lead';

  const isProducer = !isMarketingDirector;

  // Task Index & Navigation
  const taskIndex = tasksList.findIndex(t => t.id === activeTask.id);
  const hasPrev = taskIndex > 0;
  const hasNext = taskIndex >= 0 && taskIndex < tasksList.length - 1;

  // Check if proof exists
  const hasValidUploadedProof = stagedAssets.length > 0;
  const hasValidManualProof = Boolean(manualProofUrl && manualProofUrl.trim().startsWith('https://'));
  const hasAnyProof = hasValidUploadedProof || hasValidManualProof;

  // Checklist verification validation
  const hasUnreviewedRequirements = requirements.some(r => r.status === 'not_reviewed');
  const hasNeedsCorrectionRequirements = requirements.some(r => r.status === 'needs_correction');
  const allRequirementsSatisfied = requirements.every(r => r.status === 'verified' || r.status === 'not_applicable');
  const hasPhotosOrOverride = (activeTask.photos?.length || 0) > 0 || photosOverridden;

  // Derive blocking reasons for producer submission
  const blockingReasons: string[] = [];
  if (!hasAnyProof) {
    blockingReasons.push('Proof asset or valid URL (Google Drive / Canva / Nest Design Center) is required.');
  }
  if (hasUnreviewedRequirements) {
    const unrevCount = requirements.filter(r => r.status === 'not_reviewed').length;
    blockingReasons.push(`${unrevCount} requirement checklist item${unrevCount > 1 ? 's' : ''} not yet verified in the Work tab.`);
  }
  if (hasNeedsCorrectionRequirements) {
    const corrCount = requirements.filter(r => r.status === 'needs_correction').length;
    blockingReasons.push(`${corrCount} checklist item${corrCount > 1 ? 's' : ''} marked 'Needs Correction'.`);
  }
  if (!hasPhotosOrOverride) {
    blockingReasons.push('Property has no source photos. Please flag missing photos or confirm override.');
  }

  const canSendForApproval = blockingReasons.length === 0;

  // New York timezone formatted SLA due date
  const { formatted: formattedDue, relative: relativeDue } = formatNewYorkRelativeDue(activeTask.dueAt || activeTask.targetSla);
  const isOverdue = relativeDue.toLowerCase().includes('overdue');

  // Canonical Reviewing Manager Resolution
  // task.reviewOwnerId -> canonical staff directory lookup -> Melissa Gagliardi
  const canonicalReviewManager = activeTask.reviewOwnerId
    ? resolveCanonicalStaffMember(activeTask.reviewOwnerId, activeTask.workspaceId || 'ws_wilmington')
    : null;
  const resolvedManagerName = canonicalReviewManager ? canonicalReviewManager.name : null;

  const coveringManagerDisplay = resolvedManagerName
    ? (activeTask.coveringStaffName
        ? `${resolvedManagerName} (Covered by ${activeTask.coveringStaffName})`
        : resolvedManagerName)
    : 'Review manager not assigned';

  // Copy handler
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleCopyAllDetails = () => {
    const d = activeTask.listingDetails;
    const text = [
      `PROPERTY: ${activeTask.propertyAddress}`,
      `PRICE: ${d.price} | SPECS: ${d.bedsBaths} | ${d.sqft}`,
      `HEADLINE: ${d.headline}`,
      `DESCRIPTION: ${d.description}`,
      `DISCLOSURES: ${d.disclosures}`,
      `MLS: ${d.mlsNumber} | LICENSE: ${d.licenseNumber}`
    ].join('\n\n');
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

  // Producer Submission Handler
  const handleSendForApproval = async () => {
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
      const primaryProofUrl = manualProofUrl.trim() || stagedAssets[0]?.previewUrl || '';
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

      await onSubmitProof(activeTask.id, primaryProofUrl, productionNotes, assetMeta);
      fetchDrawerActivity();

      const coveringManager = activeTask.coveringStaffName || activeTask.reviewOwnerName || 'Melissa';
      setSubmitSuccessMessage(`✓ Sent to ${coveringManager} for approval`);
      setSaveStatus('saved');
    } catch (err: any) {
      setUrlValidationError(err.message || 'Submission failed. Please try again.');
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
    } catch (err: any) {
      alert(err.message || 'Failed to request revisions');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Director Approve
  const handleApproveDelivery = async () => {
    setIsSubmitting(true);
    try {
      if (onApproveProof) {
        await onApproveProof(activeTask.id, 'Approved for delivery');
      }
      setSubmitSuccessMessage('✓ Proof approved for delivery');
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unified Chronological History Events
  const historyEvents = [
    {
      id: 'evt_intake',
      title: 'Task Created from Request',
      actor: activeTask.agentName ? `Intake: ${activeTask.agentName}` : 'Nora Intake AI',
      timestamp: activeTask.receivedAt,
      icon: <FolderOpen className="w-4 h-4 text-blue-600" />,
      badge: 'Intake',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      details: `Task initiated for ${activeTask.propertyAddress} (${activeTask.packageType})`
    },
    ...(activeTask.assignedTo ? [{
      id: 'evt_assigned',
      title: `Assigned to ${activeTask.assignedTo}`,
      actor: resolvedManagerName || 'Reviewing Manager',
      timestamp: activeTask.receivedAt,
      icon: <Users className="w-4 h-4 text-emerald-600" />,
      badge: 'Assignment',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      details: `Assigned team member: ${activeTask.assignedTo} (${activeTask.assignedToRole || 'Production Specialist'})`
    }] : []),
    ...(activeTask.internalFlags || []).map(flag => ({
      id: `flag_${flag.id}`,
      title: `Internal Flag: ${flag.type.replace('_', ' ').toUpperCase()}`,
      actor: flag.flaggedBy,
      timestamp: flag.flaggedAt,
      icon: <AlertCircle className="w-4 h-4 text-amber-600" />,
      badge: 'Internal Flag',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      details: flag.message
    })),
    ...(isPhotosFlagged ? [{
      id: 'flag_local_missing_photos',
      title: 'Missing Photos Escalation Flagged',
      actor: currentUser.name,
      timestamp: new Date().toISOString(),
      icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
      badge: 'Missing Photos',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      details: 'Manager notified internally that broker source photos are missing.'
    }] : []),
    ...(activeTask.proofHistory || []).map(h => ({
      id: `proof_v${h.version}`,
      title: `Proof v${h.version} Submitted`,
      actor: h.uploadedBy,
      timestamp: h.uploadedAt,
      icon: <Upload className="w-4 h-4 text-indigo-600" />,
      badge: `v${h.version}`,
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      details: h.notes || 'Proof assets uploaded for review',
      link: h.proofUrl
    })),
    ...(activeTask.reviewHistory || []).map((r, rIdx) => ({
      id: `rev_${rIdx}`,
      title: r.action === 'revisions_requested' ? 'Revisions Requested' : 'Proof Approved',
      actor: r.reviewerName,
      timestamp: r.timestamp,
      icon: r.action === 'revisions_requested' ? <RotateCcw className="w-4 h-4 text-amber-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      badge: r.action === 'revisions_requested' ? 'Revisions' : 'Approved',
      badgeColor: r.action === 'revisions_requested' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200',
      details: r.feedbackNotes || (r.action === 'revisions_requested' ? 'Revisions requested by manager' : 'Deliverables approved for distribution')
    })),
    ...(activeTask.status === 'completed' || activeTask.reviewState === 'approved' ? [{
      id: 'evt_completed',
      title: 'Task Approved for Delivery',
      actor: resolvedManagerName || 'Reviewing Manager',
      timestamp: new Date().toISOString(),
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      badge: 'Completed',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      details: 'Task finalized and approved by marketing operations.'
    }] : [])
  ];

  // Human-readable status badge
  const renderStatusBadge = () => {
    if (activeTask.reviewState === 'approved' || activeTask.status === 'completed') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Approved</span>
        </span>
      );
    }
    if (activeTask.reviewState === 'revisions_requested') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>Revisions Requested</span>
        </span>
      );
    }
    if (activeTask.reviewState === 'awaiting_review') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>Awaiting Manager Review</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span>In Production</span>
      </span>
    );
  };

  // Structured brief clean instructions
  const cleanInstructions = activeTask.notes || activeTask.proofNotes || 'Produce according to standard brokerage specifications.';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Task Workstation: ${activeTask.propertyAddress}`}
      data-testid="workspace-task-drawer"
      className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-6 lg:pl-10">
        <div className="w-screen max-w-5xl bg-slate-50 border-l border-slate-200 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-250">
          
          {/* =========================================================================
              1. STICKY REFINED HEADER & METADATA
             ========================================================================= */}
          <div className="bg-white border-b border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3 shrink-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              
              {/* Left: Previous/Next & Property Header */}
              <div className="flex items-center gap-3 min-w-0">
                {tasksList.length > 1 && (
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0">
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-sm sm:max-w-md">
                      {activeTask.propertyAddress}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                      {activeTask.packageType}
                    </span>
                    {renderStatusBadge()}
                  </div>

                  {/* Metadata Row */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap">
                    {/* Due Date */}
                    <div className="flex items-center gap-1.5">
                      <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-600' : 'text-slate-400'}`} />
                      <span className={isOverdue ? 'font-bold text-rose-700' : 'text-slate-700'}>
                        {formattedDue !== 'Not provided' ? `Due ${formattedDue} (${relativeDue})` : (activeTask.targetSla ? `SLA Due: ${activeTask.targetSla}` : 'No due date')}
                      </span>
                      {isOverdue && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          {relativeDue}
                        </span>
                      )}
                    </div>

                    <span>•</span>

                    {/* Requester */}
                    <span>
                      Requester: <strong className="text-slate-700">{activeTask.agentName}</strong>
                    </span>

                    <span>•</span>

                    {/* Assigned Team Member */}
                    <span className="flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-[#00635C] text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                        {(activeTask.assignedTo || 'U').charAt(0)}
                      </span>
                      <span>Assigned Team Member: <strong className="text-slate-700">{activeTask.assignedTo || 'Unassigned'}</strong></span>
                    </span>

                    <span>•</span>

                    {/* Reviewing Manager */}
                    <span>
                      Reviewing Manager: <strong className="text-slate-700" data-testid="reviewing-manager-name">{coveringManagerDisplay}</strong>
                    </span>

                    <span>•</span>

                    {/* De-emphasized Task Reference Popover */}
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
                </div>
              </div>

              {/* Right: Actions & Controls */}
              <div className="flex items-center flex-wrap gap-2 shrink-0">
                {onAskRequester && (
                  <button
                    type="button"
                    onClick={() => onAskRequester(activeTask)}
                    data-testid="ask-agent-btn"
                    data-requester-action="ask-agent"
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                    <span>{getRequesterActionLabel(activeTask)}</span>
                  </button>
                )}

                {/* Reassign / Route Dropdown - MARKETING DIRECTORS ONLY */}
                {onReassignTask && isMarketingDirector && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsRouteMenuOpen(!isRouteMenuOpen)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Users className="w-3.5 h-3.5 text-slate-600" />
                      <span>Route to...</span>
                    </button>

                    {isRouteMenuOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
                        <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                          Assign Task Lead:
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {TEAM_MEMBERS.map(member => (
                            <button
                              key={member.name}
                              type="button"
                              onClick={() => {
                                onReassignTask(activeTask.id, member.name);
                                setIsRouteMenuOpen(false);
                              }}
                              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-50 transition cursor-pointer text-xs"
                            >
                              <div className={`w-5 h-5 rounded-full ${member.color} text-white flex items-center justify-center text-[9px] font-bold shrink-0`}>
                                {member.avatar}
                              </div>
                              <div className="truncate">
                                <div className="font-semibold text-slate-800">{member.name}</div>
                                <div className="text-[10px] text-slate-400">{member.role}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Overflow Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsOverflowMenuOpen(!isOverflowMenuOpen)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    title="More actions"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  {isOverflowMenuOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-left text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          handleCopyText(activeTask.id, 'Task ID');
                          setIsOverflowMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Task ID</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleCopyText(activeTask.propertyAddress, 'Address');
                          setIsOverflowMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Property Address</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  title="Close Drawer (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* =========================================================================
                2. 4 COMPACT WORKFLOW NAVIGATION TABS: Brief | Source | Work | History
               ========================================================================= */}
            <div className="flex items-center gap-2 border-t border-slate-100 pt-2.5 overflow-x-auto no-scrollbar">
              {[
                {
                  id: 'brief',
                  label: 'Brief',
                  icon: <Layers className="w-3.5 h-3.5" />,
                  count: activeTask.requestedAssets.length
                },
                {
                  id: 'source',
                  label: 'Source',
                  icon: <ImageIcon className="w-3.5 h-3.5" />,
                  count: activeTask.photos.length
                },
                {
                  id: 'work',
                  label: 'Work',
                  icon: <FolderOpen className="w-3.5 h-3.5" />,
                  badge: activeTask.reviewState === 'revisions_requested' ? 'Revisions' : `v${activeTask.proofVersion || 1}`,
                  indicator: activeTask.reviewState === 'awaiting_review' || activeTask.reviewState === 'revisions_requested'
                },
                {
                  id: 'history',
                  label: 'Activity & Contact',
                  icon: <Clock className="w-3.5 h-3.5" />,
                  count: drawerActivityEvents.length || historyEvents.length
                }
              ].map(tab => {
                const isActive = activeTab === tab.id ||
                  (tab.id === 'brief' && activeTab === 'assignment') ||
                  (tab.id === 'source' && activeTab === 'photos') ||
                  (tab.id === 'work' && (activeTab === 'requirements' || activeTab === 'proofs'));

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-[#00635C] text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {typeof tab.count === 'number' && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                    {tab.badge && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                    {tab.indicator && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* =========================================================================
              3. MAIN SCROLLABLE WORKSPACE (pb-32 padding ensures no footer overlap)
             ========================================================================= */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 pb-32">
            
            {/* Revisions Alert Banner */}
            {activeTask.reviewState === 'revisions_requested' && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 shadow-xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Action Required: Revisions Requested by Marketing Director</span>
                </div>
                <div className="text-xs text-amber-900 bg-white rounded-xl p-3 border border-amber-200 font-medium whitespace-pre-wrap leading-relaxed shadow-2xs">
                  {activeTask.proofNotes || 'Please adjust the collateral proofs according to reviewer instructions and resubmit for approval.'}
                </div>
              </div>
            )}

            {/* Success Toast Banner */}
            {submitSuccessMessage && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-emerald-900 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="font-bold">{submitSuccessMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitSuccessMessage(null)}
                  className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Triage Alert & Resolution Card */}
            {(activeTask.status === 'triage' || activeTask.routingState === 'triage_required') && (
              <div className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in" data-testid="triage-resolution-card">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>Triage Required: Work Item Unrouted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-white border border-amber-300 text-amber-900 rounded-lg text-[11px] font-medium uppercase tracking-wider">
                      Channel: {activeTask.channel || 'web'}
                    </span>
                    <span className="px-2.5 py-1 bg-amber-200 text-amber-950 rounded-lg text-[11px] font-mono font-bold">
                      {activeTask.classificationConfidence ? `${(activeTask.classificationConfidence * 100).toFixed(0)}% Conf` : 'Ambiguous'}
                    </span>
                  </div>
                </div>

                {/* Problem & Facts Grid */}
                <div className="text-xs text-amber-900 bg-white rounded-xl p-4 border border-amber-200 font-medium space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Failure Reason:</span>
                    {activeTask.callId && <span className="font-mono text-[10px] text-slate-400">Call ID: {activeTask.callId}</span>}
                  </div>
                  <p className="text-slate-700 leading-relaxed font-normal">
                    {activeTask.triageReason || (activeTask.routingReasons && activeTask.routingReasons.join(', ')) || 'Task facts require manager classification or address confirmation.'}
                  </p>
                  
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="font-semibold text-slate-700">Requester:</span>
                      <span>{activeTask.agentName || 'Unknown Caller / Requester'}</span>
                      {activeTask.agentPhone && <span className="text-slate-400 font-mono">({activeTask.agentPhone})</span>}
                    </div>
                    {activeTask.missingFacts && activeTask.missingFacts.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-rose-600 uppercase">Missing:</span>
                        {activeTask.missingFacts.map(fact => (
                          <span key={fact} className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-semibold">
                            {fact.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Suggestions Label */}
                <div className="text-[11px] text-slate-600 bg-amber-100/50 rounded-lg p-2.5 border border-amber-200/60 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    <strong>Candidate Suggestions:</strong> Marketing Collateral, Yard Sign Post Installation, Form 2-T Contract Review, or IT & Systems Support. Select a category below to route.
                  </span>
                </div>

                {/* Manager Resolution Form */}
                <div className="bg-white rounded-xl p-4 border border-amber-200 space-y-3 shadow-2xs">
                  <h5 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Manager Triage Resolution</h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Target Category</label>
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
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Property Address</label>
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
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Deliverable Type</label>
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
                      className="px-4 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                      {isTriageResolving ? 'Routing...' : 'Confirm Rerouting'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: BRIEF */}
            {(activeTab === 'brief' || activeTab === 'assignment') && (
              <div className="space-y-5 animate-in fade-in duration-150">
                
                {/* Production Workstation Resources */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                      Production Workstation Resources
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Produce assets in Nest Design Center using verified listing copy blocks.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href="https://nest.maxadesigns.com"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Nest Design Center (Maxa) ↗</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleCopyAllDetails}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedField === 'All Details' ? '✓ Copied!' : 'Copy All Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Structured Request Brief Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#00635C]" />
                      Structured Request Brief
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">Intake Extraction</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Deliverable Target</span>
                      <span className="font-bold text-slate-800 block">{activeTask.packageType}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Target SLA Due</span>
                      <span className="font-bold text-slate-800 block">
                        {formattedDue !== 'Not provided' ? `${formattedDue} (${relativeDue})` : activeTask.targetSla}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Identified Blockers</span>
                      <span className={`font-bold block ${activeTask.photos.length === 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {activeTask.photos.length === 0 ? 'Source photos missing' : 'None identified'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-bold text-slate-700 block">Requester Instructions &amp; Scope:</span>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
                      {cleanInstructions}
                    </div>
                  </div>
                </div>

                {/* Requested Deliverables List */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                      Requested Deliverables ({activeTask.requestedAssets.length})
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500">High-Resolution Production</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {activeTask.requestedAssets.map((asset, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{asset.name}</span>
                          <span className="text-[9px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                            {asset.format}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {asset.dimensions || 'Standard Specification'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Property Details & 1-Click Copy Blocks */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                      Verified Property Information &amp; Copy Blocks
                    </h4>
                    <span className="text-[11px] font-mono text-emerald-700 font-semibold">MLS Verified</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-slate-400 font-medium">List Price</div>
                      <div className="font-bold font-mono text-slate-900 text-sm mt-0.5">{activeTask.listingDetails.price}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-slate-400 font-medium">Beds / Baths</div>
                      <div className="font-bold text-slate-900 mt-0.5">{activeTask.listingDetails.bedsBaths}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-slate-400 font-medium">Square Footage</div>
                      <div className="font-bold text-slate-900 mt-0.5">{activeTask.listingDetails.sqft}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-slate-400 font-medium">MLS / License</div>
                      <div className="font-mono text-slate-900 text-[11px] mt-0.5">{activeTask.listingDetails.mlsNumber}</div>
                    </div>
                  </div>

                  {/* Copy Block: Headline */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Listing Headline:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(activeTask.listingDetails.headline, 'Headline')}
                        className="text-[#00635C] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedField === 'Headline' ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium">
                      {activeTask.listingDetails.headline}
                    </div>
                  </div>

                  {/* Copy Block: Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Listing Remarks &amp; Features:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(activeTask.listingDetails.description, 'Description')}
                        className="text-[#00635C] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedField === 'Description' ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed max-h-36 overflow-y-auto">
                      {activeTask.listingDetails.description}
                    </div>
                  </div>

                  {/* Copy Block: NCREC Disclosures */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Mandatory NCREC Disclosures:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(activeTask.listingDetails.disclosures, 'Disclosures')}
                        className="text-[#00635C] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedField === 'Disclosures' ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 font-mono">
                      {activeTask.listingDetails.disclosures}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: SOURCE */}
            {(activeTab === 'source' || activeTab === 'photos') && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                        Aggregated Property Photography ({activeTask.photos.length} High-Res Assets)
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        High-resolution media aggregated from broker email, SMS, and property listing drive.
                      </p>
                    </div>
                  </div>

                  {/* Actionable Empty State if no photos */}
                  {activeTask.photos.length === 0 ? (
                    <div className="p-6 sm:p-8 text-center bg-amber-50/60 rounded-2xl border-2 border-dashed border-amber-200 space-y-4">
                      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div className="max-w-md mx-auto space-y-1">
                        <div className="font-bold text-sm text-amber-950">Photos Required Before Proceeding</div>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          No source photos have been uploaded for this property yet. High-resolution photography is required to produce standard marketing collateral.
                        </p>
                      </div>

                      {flagPhotosMessage && (
                        <div className="max-w-md mx-auto p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold">
                          {flagPhotosMessage}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleNotifyManagerMissingPhotos}
                          disabled={isFlaggingPhotos || isPhotosFlagged}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                        >
                          <Flag className="w-3.5 h-3.5" />
                          <span>{isPhotosFlagged ? 'Manager Already Flagged' : isFlaggingPhotos ? 'Notifying...' : 'Notify Manager Photos Are Missing'}</span>
                        </button>

                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
                          <input
                            type="checkbox"
                            checked={photosOverridden}
                            onChange={(e) => setPhotosOverridden(e.target.checked)}
                            className="rounded text-[#00635C] focus:ring-[#00635C]"
                          />
                          <span className="font-medium">Proceed without photos (Override)</span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {activeTask.photos.map((photo, pIdx) => (
                        <div key={photo.id || pIdx} className="group relative bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                          <div className="aspect-4/3 overflow-hidden bg-slate-900 flex items-center justify-center">
                            <img
                              src={photo.url}
                              alt={photo.caption || photo.name || 'Property Photo'}
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
                    </div>
                  )}
                </div>

                {/* Agent Notes & Instructions */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-500" />
                    Agent Notes &amp; Requester Context
                  </h4>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
                    {cleanInstructions}
                  </div>
                </div>

                {/* Brand Assets Reference Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#00635C]" />
                    Nest Brand Assets &amp; Guidelines
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="font-bold text-slate-900">Brand Guidelines</div>
                      <p className="text-slate-500 text-[11px]">Official primary teal palette (#00635C) &amp; layout standards.</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="font-bold text-slate-900">Official Logo Pack</div>
                      <p className="text-slate-500 text-[11px]">Vector SVG and transparent 300 DPI high-res logos.</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="font-bold text-slate-900">Typography</div>
                      <p className="text-slate-500 text-[11px]">Approved brand typefaces and hierarchy rules.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: WORK (Proof Upload, Interactive Checklist, SOP, History) */}
            {(activeTab === 'work' || activeTab === 'proofs' || activeTab === 'requirements') && (
              <div className="space-y-5 animate-in fade-in duration-150">
                
                {/* 1. Requirements Quality & Compliance Checklist (4-State Interactive) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#00635C]" />
                        Production Quality &amp; Compliance Checklist
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Verify each requirement before submitting to manager. Items support 4 distinct review states.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyAllRequirements}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Verify All Items ✓</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {requirements.map((req) => {
                      const isVerified = req.status === 'verified';
                      const isNeedsCorrection = req.status === 'needs_correction';
                      const isNotApplicable = req.status === 'not_applicable';
                      const isNotReviewed = req.status === 'not_reviewed';

                      return (
                        <div
                          key={req.id}
                          className={`p-3.5 rounded-xl border transition space-y-2.5 ${
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
                            <div className="flex items-center gap-1.5 shrink-0">
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

                              {(!isNotReviewed) && (
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
                </div>

                {/* 2. Managed Upload Wizard Trigger Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                        Managed Finished Asset Proofs
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Upload finished JPEG, PNG, WEBP, or vector PDF proofs with verifiable DPI and dimension inspection.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsUploadWizardOpen(true)}
                      className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Finished Asset</span>
                    </button>
                  </div>

                  {/* Staged Uploads Display */}
                  {stagedAssets.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                        Staged Proofs Ready for Submission ({stagedAssets.length})
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {stagedAssets.map((asset) => (
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
                              className="w-20 h-24 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 cursor-pointer shrink-0 relative group"
                            >
                              {asset.mimeType === 'application/pdf' ? (
                                <FileText className="w-8 h-8 text-emerald-400" />
                              ) : (
                                <img src={asset.previewUrl} alt={asset.fileName} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" />
                              )}
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="w-4 h-4 text-white" />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0 space-y-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 truncate">{asset.deliverableName}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                                  v{asset.version}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono truncate">{asset.fileName}</div>
                              <div className="text-[11px] text-slate-600 font-mono">
                                {asset.width && asset.height ? `${asset.width} × ${asset.height} px` : asset.aspectRatio}
                              </div>
                              <div className="pt-1 flex items-center justify-between">
                                <span className="text-[10px] text-slate-500">{asset.dpiLabel}</span>
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
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                      No files uploaded in this session. Click <strong>Upload Finished Asset</strong> above or enter a manual proof link below.
                    </div>
                  )}
                </div>

                {/* 3. Manual Proof Links & Dispatch Notes */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                      Manual External Proof Link &amp; Notes
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">Google Drive / Canva / Maxa</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Google Drive or Canva Proof URL:</label>
                      <input
                        type="url"
                        value={manualProofUrl}
                        onChange={(e) => handleProofUrlChange(e.target.value)}
                        placeholder="https://drive.google.com/drive/folders/..."
                        className={`w-full text-xs p-2.5 rounded-xl border bg-slate-50 focus:bg-white outline-none transition ${
                          urlValidationError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-[#00635C]'
                        }`}
                      />
                      {urlValidationError && (
                        <p className="text-[11px] text-rose-600 font-medium mt-1">{urlValidationError}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Production &amp; Dispatch Notes:</label>
                      <input
                        type="text"
                        value={productionNotes}
                        onChange={(e) => {
                          setProductionNotes(e.target.value);
                          setSaveStatus('saved');
                        }}
                        placeholder="e.g. Completed flyer and social carousel. Disclosures verified."
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00635C] outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Governing SOP Card (Only displayed when SOP provenance is stamped) */}
                {(activeTask.governingSopId || activeTask.sopCode) && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
                          {activeTask.governingSopId || activeTask.sopCode}
                        </span>
                        {activeTask.governingSopVersion && (
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            v{activeTask.governingSopVersion}
                          </span>
                        )}
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                          {activeTask.governingSopTitle || activeTask.sopTitle || 'Governing Standard Operating Procedure'}
                        </h4>
                      </div>

                      {onOpenSopDocument && (
                        <button
                          type="button"
                          onClick={() => onOpenSopDocument(MARKETING_SOPS[activeTask.governingSopId || activeTask.sopCode || ''] || getCampaignGoverningSop(activeTask.packageType))}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-[#00635C]" />
                          <span>Inspect Full SOP Document ↗</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. Proof Version & Review History */}
                {activeTask.proofHistory && activeTask.proofHistory.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight pb-2 border-b border-slate-100">
                      Proof Version Audit History ({activeTask.proofHistory.length} Versions)
                    </h4>
                    <div className="space-y-2">
                      {activeTask.proofHistory.map((h, hIdx) => (
                        <div key={hIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#00635C] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              v{h.version}
                            </span>
                            <span className="text-slate-800 font-medium">{h.uploadedBy}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500 font-mono text-[11px]">
                              {formatNewYorkDateTime(h.uploadedAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {h.notes && <span className="text-slate-600 italic truncate max-w-xs">{h.notes}</span>}
                            {h.proofUrl && (
                              <a
                                href={h.proofUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:text-[#00635C] rounded-lg font-bold text-[11px] shadow-2xs flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Inspect Proof</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB 4: ACTIVITY & CONTACT */}
            {activeTab === 'history' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <ActivityAndContactTimeline
                  events={drawerActivityEvents}
                  currentTaskId={activeTask.id}
                  currentRequestId={activeTask.campaignId}
                  viewRole="assignee"
                  loading={isLoadingDrawerActivity}
                  onRefresh={fetchDrawerActivity}
                />
              </div>
            )}

          </div>

          {/* =========================================================================
              4. FIXED ROLE-AWARE FOOTER
             ========================================================================= */}
          <div className="bg-white border-t border-slate-200 p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            
            {/* Save Status & Secondary Action */}
            <div className="flex items-center gap-3">
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

              <button
                type="button"
                onClick={() => setSaveStatus('saved')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                Save Draft
              </button>
            </div>

            {/* Primary Role-Aware Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              
              {/* PRODUCER VIEW (Eduardo) */}
              {isProducer && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  {!canSendForApproval && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1.5 max-w-full overflow-hidden">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-semibold truncate max-w-[220px] sm:max-w-xs">
                        {blockingReasons[0] || 'Checklist or proof requirements incomplete'}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSendForApproval}
                    disabled={!canSendForApproval || isSubmitting}
                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shrink-0 ${
                      canSendForApproval && !isSubmitting
                        ? 'bg-[#00635C] hover:bg-[#004d47] text-white cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                    title={canSendForApproval ? 'Send finished proofs to manager for approval' : blockingReasons.join(' • ')}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Submitting...' : 'Send to Manager for Approval'}</span>
                  </button>
                </div>
              )}

              {/* MARKETING DIRECTOR REVIEW VIEW (Melissa) */}
              {isMarketingDirector && (
                <div className="flex items-center gap-2">
                  {activeTask.reviewState === 'awaiting_review' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsRevisionModalOpen(true)}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                        <span>Request Revisions</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleApproveDelivery}
                        disabled={isSubmitting}
                        className="px-5 py-2 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve for Delivery</span>
                      </button>
                    </>
                  ) : (
                    <div className="text-xs text-slate-500 font-medium px-2">
                      Review State: <strong className="text-slate-800 uppercase">{activeTask.reviewState || activeTask.status}</strong>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* MODAL: PROOF UPLOAD WIZARD */}
      <ProofUploadWizard
        isOpen={isUploadWizardOpen}
        onClose={() => setIsUploadWizardOpen(false)}
        requestedDeliverables={activeTask.requestedAssets}
        currentProofVersion={activeTask.proofVersion || 0}
        currentUser={currentUser}
        onAssetConfirmed={(asset) => {
          setStagedAssets(prev => [...prev, asset]);
          setActiveTab('work');
          setSaveStatus('saved');
        }}
      />

      {/* MODAL: EXPANDABLE PROOF LIGHTBOX VIEWER */}
      <ProofLightboxViewer
        isOpen={Boolean(lightboxItem)}
        item={lightboxItem}
        onClose={() => setLightboxItem(null)}
      />

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

    </div>
  );
};
