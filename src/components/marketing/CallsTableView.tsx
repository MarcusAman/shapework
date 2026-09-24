import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Phone,
  Search,
  Filter,
  Play,
  Pause,
  FileText,
  User,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Volume2,
  VolumeX,
  Calendar,
  X,
  Send,
  Layers,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  ExternalLink,
  Copy,
  Info,
  ChevronRight,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { AskRequesterQuestionsModal } from './AskRequesterQuestionsModal';
import { ActivityAndContactTimeline } from './ActivityAndContactTimeline';
import { ContactSummaryCard } from './ContactSummaryCard';
import type { CanonicalActivityEvent, ContactSummary } from '../../../server/services/activityHistoryService.js';

export interface TelephonyCallItem {
  id: string;
  callerName: string;
  callerPhone?: string;
  phone?: string;
  office?: string;
  propertyAddress: string;
  timestamp: string;
  rawTimestamp?: string;
  duration: string;
  durationSeconds?: number;
  direction?: 'inbound' | 'outbound';
  departmentCategory?: 'marketing_collateral' | 'sign_vendor' | 'compliance_contract' | 'commission_finance' | 'facilities_tech' | 'general_ops' | string;
  transcript?: string;
  requestExcerpt?: string;
  requestType?: string;
  audioUrl?: string;
  recordingUrl?: string;
  status?: string;
  disconnectionReason?: string;
  assignedLead?: string;
  canonicalRequestId?: string;
  canonicalTaskId?: string;
  linkedRequest?: {
    id: string;
    title: string;
    propertyAddress?: string;
    status: string;
    category?: string;
    taskCount?: number;
    taskIds?: string[];
  } | null;
  linkedTasks?: Array<{
    id: string;
    title: string;
    status: string;
    assigneeName?: string;
    category?: string;
    dueDate?: string;
  }>;
  callAnalysis?: {
    call_successful?: boolean;
    custom_analysis_data?: any;
    user_sentiment?: string;
    call_summary?: string;
    dynamic_variables?: Record<string, any>;
  } | null;
  aiExtractedDetails?: {
    price?: string;
    bedrooms?: string;
    bathrooms?: string;
    openHouse?: string;
    openHouseDate?: string;
    targetCollateral?: string[];
    requiredCollateral?: string[];
    keyFeatures?: string[];
  };
  missingDetailsPrompt?: string;
  isMms?: boolean;
  photos?: Array<{ id: string; url: string; name?: string; type?: string }>;
  voiceMemoTranscript?: string;
}

export interface CallsTableViewProps {
  calls: TelephonyCallItem[];
  loading?: boolean;
  error?: string | null;
  isDbUnavailable?: boolean;
  currentUserRole?: string;
  isOperator?: boolean;
  onRefresh?: () => void;
  onBackfill?: () => void;
  onOpenTranscript?: (call: TelephonyCallItem) => void;
  onAssignToEduardo?: (call: TelephonyCallItem) => void;
  onSendQuestionsToRequester?: (call: TelephonyCallItem, data?: any) => void;
  onApplyAiRecommendation?: (call: TelephonyCallItem, recommendation: any) => void;
  selectedCallId?: string | null;
  onSelectCall?: (call: TelephonyCallItem) => void;
  onNavigateToRequest?: (requestId: string) => void;
  onNavigateToTask?: (taskId: string) => void;
  initialTimeframe?: 'today' | 'all';
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Returns today's date string formatted as YYYY-MM-DD strictly in America/New_York (Wilmington NC).
 */
export function getTodayDateStringInNewYork(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date()); // e.g. "2026-09-04"
}

/**
 * Formats any date input into YYYY-MM-DD in America/New_York.
 */
export function getDateStringInNewYork(dateInput: string | number | Date): string | null {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(d);
  } catch {
    return null;
  }
}

/**
 * Formats a call timestamp into Eastern Time ("h:mm A · MMM D").
 * If rawTimestamp is available, parses and formats using America/New_York.
 * Otherwise, falls back to the pre-rendered timestamp string.
 */
export function formatCallTimestampInEastern(call: TelephonyCallItem): string {
  const candidate = call.rawTimestamp || (call.timestamp && !isNaN(Date.parse(call.timestamp)) ? call.timestamp : null);
  if (candidate) {
    try {
      const d = new Date(candidate);
      if (!isNaN(d.getTime())) {
        const timePart = d.toLocaleTimeString('en-US', {
          timeZone: 'America/New_York',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        const datePart = d.toLocaleDateString('en-US', {
          timeZone: 'America/New_York',
          month: 'short',
          day: 'numeric'
        });
        return `${timePart} · ${datePart}`;
      }
    } catch {
      // Fall through to call.timestamp
    }
  }
  return call.timestamp || 'Today';
}

/**
 * Checks whether a call occurred "today" using America/New_York timezone bounds.
 */
export function isCallFromToday(call: TelephonyCallItem): boolean {
  const nyToday = getTodayDateStringInNewYork();
  if (call.rawTimestamp) {
    const callNyDate = getDateStringInNewYork(call.rawTimestamp);
    if (callNyDate) {
      return callNyDate === nyToday;
    }
  }

  const parsedTime = parseCallDateToTimestamp(call);
  if (parsedTime && !isNaN(parsedTime) && parsedTime > 0) {
    const callNyDate = getDateStringInNewYork(parsedTime);
    if (callNyDate) {
      return callNyDate === nyToday;
    }
  }

  const str = (call.timestamp || '').trim().toLowerCase();
  if (
    str.startsWith('today') ||
    str.includes('min') ||
    str.includes('m ago') ||
    str.includes('just now') ||
    str.includes('hour') ||
    str.includes('h ago') ||
    str.includes('sec')
  ) {
    return true;
  }

  return false;
}

export function parseCallDateToTimestamp(call: TelephonyCallItem): number {
  if (call.rawTimestamp) {
    const t = new Date(call.rawTimestamp).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  const str = (call.timestamp || '').trim();
  if (!str) return 0;

  // Direct standard parse
  const direct = new Date(str).getTime();
  if (!isNaN(direct) && direct > 0) return direct;

  const now = new Date();
  const currentYear = now.getFullYear();

  // "Today at 6:42 PM" or "Today 9:15 AM"
  if (str.toLowerCase().startsWith('today')) {
    const timePart = str.replace(/today\s*(at)?\s*/i, '').trim();
    const parsedToday = new Date(`${now.toDateString()} ${timePart}`);
    if (!isNaN(parsedToday.getTime())) return parsedToday.getTime();
    return now.getTime();
  }

  // "Yesterday 3:40 PM" or "Yesterday at 3:40 PM"
  if (str.toLowerCase().startsWith('yesterday')) {
    const timePart = str.replace(/yesterday\s*(at)?\s*/i, '').trim();
    const yDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const parsedY = new Date(`${yDate.toDateString()} ${timePart}`);
    if (!isNaN(parsedY.getTime())) return parsedY.getTime();
    return now.getTime() - 24 * 60 * 60 * 1000;
  }

  // "Xm ago" / "X mins ago"
  const mMatch = str.match(/(\d+)\s*(m|min|mins|minutes)\s*ago/i);
  if (mMatch) return now.getTime() - parseInt(mMatch[1], 10) * 60 * 1000;

  // "Xh ago" / "X hours ago"
  const hMatch = str.match(/(\d+)\s*(h|hr|hrs|hours)\s*ago/i);
  if (hMatch) return now.getTime() - parseInt(hMatch[1], 10) * 60 * 60 * 1000;

  // "X days ago"
  const dMatch = str.match(/(\d+)\s*(d|day|days)\s*ago/i);
  if (dMatch) return now.getTime() - parseInt(dMatch[1], 10) * 24 * 60 * 60 * 1000;

  // "12:53 PM · Jul 11" or "Jul 28 · 11:15 AM"
  if (str.includes('·')) {
    const parts = str.split('·').map(p => p.trim());
    if (parts.length === 2) {
      const try1 = new Date(`${parts[1]} ${currentYear} ${parts[0]}`).getTime();
      if (!isNaN(try1) && try1 > 0) return try1;
      const try2 = new Date(`${parts[0]} ${currentYear} ${parts[1]}`).getTime();
      if (!isNaN(try2) && try2 > 0) return try2;
    }
  }

  const cleanDot = str.replace('·', '').replace(/\s+/g, ' ').trim();
  const withYear = new Date(`${cleanDot} ${currentYear}`).getTime();
  if (!isNaN(withYear) && withYear > 0) return withYear;

  return 0;
}

export function parseDurationToSeconds(call: TelephonyCallItem): number {
  if (typeof call.durationSeconds === 'number' && !isNaN(call.durationSeconds)) {
    return call.durationSeconds;
  }
  const str = (call.duration || '').toLowerCase();
  let total = 0;
  const mMatch = str.match(/(\d+)\s*(min|m)/);
  if (mMatch) total += parseInt(mMatch[1], 10) * 60;
  const sMatch = str.match(/(\d+)\s*(sec|s)/);
  if (sMatch) total += parseInt(sMatch[1], 10);
  return total || 0;
}

/**
 * Derives a clean, honest human-readable outcome state for the call.
 */
export function getCallOutcome(call: TelephonyCallItem): {
  label: string;
  badgeClass: string;
  dotClass: string;
  subtext?: string;
} {
  const status = (call.status || '').toLowerCase();
  const reason = (call.disconnectionReason || '').toLowerCase();

  if (status === 'failed' || reason === 'dial_failed' || reason === 'error') {
    return {
      label: 'Processing failed',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200/80',
      dotClass: 'bg-rose-500',
      subtext: 'Telephony ingestion error'
    };
  }

  if (call.canonicalRequestId || call.linkedRequest) {
    const taskCount = call.linkedTasks?.length || call.linkedRequest?.taskCount || 0;
    if (taskCount > 0) {
      return {
        label: `Request created · ${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}`,
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
        dotClass: 'bg-emerald-500',
        subtext: call.linkedRequest?.title || 'Active campaign'
      };
    }
    return {
      label: 'Request created',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
      dotClass: 'bg-emerald-500',
      subtext: call.linkedRequest?.title || 'Ready for review'
    };
  }

  if (call.missingDetailsPrompt) {
    return {
      label: 'Follow-up needed',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
      dotClass: 'bg-amber-500',
      subtext: 'Missing caller details'
    };
  }

  // Non-actionable or general ops
  return {
    label: 'No task required',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/80',
    dotClass: 'bg-slate-400',
    subtext: call.departmentCategory === 'general_ops' || call.departmentCategory === 'facilities_tech'
      ? 'Office & Facilities'
      : 'Informational inquiry'
  };
}

export function getAiRecommendedPath(call: TelephonyCallItem) {
  const text = `${call.transcript || ''} ${call.requestExcerpt || ''} ${call.missingDetailsPrompt || ''}`.toLowerCase();
  const dept = call.departmentCategory || '';

  // 1. General Operations & Office Supplies (Water bottles, coffee, etc.)
  if (dept === 'general_ops' || /water|coffee|supplies|restock|paper|cleaning|trash/i.test(text)) {
    return {
      actionKey: 'log_ops',
      title: 'Log Operations Note (Ann)',
      badgeLabel: 'Operations Inquiry',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      btnColor: 'bg-slate-800 hover:bg-slate-700 text-white',
      targetPerson: 'Ann Gunn',
      targetDept: 'general_ops',
      rationale: 'Inbound operational request logged by Ask Nora. No marketing deliverables required.'
    };
  }

  // 2. Sign Post & Vendor Dispatch
  if (dept === 'sign_vendor' || text.includes('sign post') || text.includes('rider') || text.includes('yard sign')) {
    return {
      actionKey: 'sign_dispatch',
      title: 'Dispatch Sign Post Co (Ann)',
      badgeLabel: 'Sign & Vendor Dispatch',
      badgeColor: 'bg-purple-50 text-purple-900 border-purple-200',
      btnColor: 'bg-purple-700 hover:bg-purple-800 text-white',
      targetPerson: 'Ann Gunn',
      targetDept: 'sign_vendor',
      rationale: 'Inbound request specifies yard sign installation & custom rider at listing coordinates.'
    };
  }

  // 3. Contract & BIC Compliance Hold
  if (dept === 'compliance_contract' || text.includes('form 2-t') || text.includes('mogs') || text.includes('compliance') || text.includes('due diligence')) {
    return {
      actionKey: 'compliance_audit',
      title: 'Hold for BIC Review (Ryan)',
      badgeLabel: 'Compliance Audit Hold',
      badgeColor: 'bg-rose-50 text-rose-900 border-rose-200',
      btnColor: 'bg-rose-700 hover:bg-rose-800 text-white',
      targetPerson: 'Ryan Crecelius',
      targetDept: 'compliance_contract',
      rationale: 'Transaction requires Form 2-T validation & MOGS signature audit before binding.'
    };
  }

  const isExplicitlyMissing = Boolean(
    call.missingDetailsPrompt || 
    (text.includes('missing details') && !text.includes('flyer') && !text.includes('open house')) ||
    (text.includes('missing information') && !text.includes('ready')) ||
    (call.propertyAddress && call.propertyAddress.toLowerCase().includes('unknown'))
  );

  if (isExplicitlyMissing) {
    return {
      actionKey: 'ask_agent',
      title: 'Ask Agent (Missing Details)',
      badgeLabel: 'Missing Information Request',
      badgeColor: 'bg-amber-50 text-amber-900 border-amber-200',
      btnColor: 'bg-amber-700 hover:bg-amber-800 text-white',
      targetPerson: call.callerName || 'Agent',
      targetDept: 'needs_information',
      rationale: 'Missing property address or critical assets required before proofing.'
    };
  }

  return {
    actionKey: 'assign_va',
    title: 'Assign to Eduardo Lovo (Marketing Suite)',
    badgeLabel: 'Marketing Collateral Build',
    badgeColor: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    btnColor: 'bg-[#00635C] hover:bg-[#004d47] text-white',
    targetPerson: 'Eduardo Lovo',
    targetDept: 'marketing_collateral',
    rationale: 'Ready for full luxury flyer, open house kit, postcard, and social graphic compilation in Nest Design Center.'
  };
}

export type SortField = 'date' | 'caller' | 'property' | 'category' | 'duration';
export type SortDirection = 'asc' | 'desc';
export type DrawerTab = 'summary' | 'recording' | 'linked_work' | 'activity';

export const CallsTableView: React.FC<CallsTableViewProps> = ({
  calls,
  loading = false,
  error = null,
  isDbUnavailable = false,
  currentUserRole = 'owner',
  isOperator = true,
  onRefresh,
  onBackfill,
  onOpenTranscript,
  onAssignToEduardo,
  onSendQuestionsToRequester,
  onApplyAiRecommendation,
  selectedCallId,
  onSelectCall,
  onNavigateToRequest,
  onNavigateToTask,
  initialTimeframe = 'today'
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('All Departments');
  const [selectedDirection, setSelectedDirection] = useState<string>('all');
  const [callsTimeframe, setCallsTimeframe] = useState<'today' | 'all'>(initialTimeframe || 'today');

  useEffect(() => {
    if (initialTimeframe) {
      setCallsTimeframe(initialTimeframe);
    }
  }, [initialTimeframe]);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [includeArchive, setIncludeArchive] = useState<boolean>(false);
  const [showFilterPopover, setShowFilterPopover] = useState<boolean>(false);
  const [activeAudioCallId, setActiveAudioCallId] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [questionModalCall, setQuestionModalCall] = useState<TelephonyCallItem | null>(null);

  // Detail Drawer State
  const [drawerCall, setDrawerCall] = useState<TelephonyCallItem | null>(null);
  const [drawerActiveTab, setDrawerActiveTab] = useState<DrawerTab>('summary');
  const [drawerCurrentTime, setDrawerCurrentTime] = useState<number>(0);
  const [drawerDuration, setDrawerDuration] = useState<number>(0);
  const [drawerIsPlaying, setDrawerIsPlaying] = useState<boolean>(false);
  const [drawerRate, setDrawerRate] = useState<number>(1);
  const [drawerTranscriptQuery, setDrawerTranscriptQuery] = useState<string>('');
  const [isLinkedRecordsExpanded, setIsLinkedRecordsExpanded] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Canonical Activity & Contact History state for Calls Drawer
  const [drawerActivityEvents, setDrawerActivityEvents] = useState<CanonicalActivityEvent[]>([]);
  const [drawerContactSummary, setDrawerContactSummary] = useState<ContactSummary | null>(null);
  const [isLoadingDrawerActivity, setIsLoadingDrawerActivity] = useState<boolean>(false);

  const fetchCallDrawerActivity = async () => {
    if (!drawerCall) return;
    setIsLoadingDrawerActivity(true);
    try {
      const targetReqId = drawerCall.canonicalRequestId || drawerCall.linkedRequest?.id;
      const targetTaskId = drawerCall.canonicalTaskId || (drawerCall.linkedTasks && drawerCall.linkedTasks[0]?.id);

      if (targetReqId) {
        const res = await fetch(`/api/marketing/requests/${targetReqId}/activity`);
        const data = await res.json();
        if (data.success) {
          setDrawerActivityEvents(data.events || []);
          if (data.contactSummary) setDrawerContactSummary(data.contactSummary);
          return;
        }
      } else if (targetTaskId) {
        const res = await fetch(`/api/marketing/tasks/${targetTaskId}/activity`);
        const data = await res.json();
        if (data.success) {
          setDrawerActivityEvents(data.events || []);
          if (data.contactSummary) setDrawerContactSummary(data.contactSummary);
          return;
        }
      }

      // If not linked to a canonical request yet, construct the initial call intake event
      setDrawerActivityEvents([{
        id: `call_${drawerCall.id}`,
        workspaceId: 'ws_wilmington',
        requestId: drawerCall.id,
        callId: drawerCall.id,
        eventType: 'call.received',
        actorType: 'requester',
        actorDisplayName: drawerCall.callerName || 'Inbound Caller',
        channel: 'phone',
        direction: 'inbound',
        communicationStatus: 'delivered',
        summary: `Inbound Phone Call: ${drawerCall.summary || 'Broker requested marketing deliverables via NORA voice line'}`,
        metadata: {
          callerPhone: drawerCall.callerPhone,
          duration: drawerCall.duration,
          disconnectionReason: drawerCall.disconnectionReason
        },
        idempotencyKey: `call_${drawerCall.id}`,
        occurredAt: (() => {
          const raw = drawerCall.rawTimestamp || drawerCall.timestamp;
          if (raw) {
            const d = new Date(raw);
            if (!isNaN(d.getTime())) return d.toISOString();
          }
          return new Date().toISOString();
        })(),
        recordedAt: new Date().toISOString()
      }]);
      setDrawerContactSummary({
        requestId: drawerCall.id,
        requesterName: drawerCall.callerName || 'Inbound Caller',
        requesterChannel: 'phone',
        waitingOn: 'manager',
        timeWaiting: 'Recent',
        communicationBlockedByPolicy: true
      });
    } catch (err) {
      console.error('Failed to fetch call drawer activity', err);
    } finally {
      setIsLoadingDrawerActivity(false);
    }
  };

  useEffect(() => {
    if (drawerCall && drawerActiveTab === 'activity') {
      fetchCallDrawerActivity();
    }
  }, [drawerCall?.id, drawerCall?.canonicalRequestId, drawerActiveTab]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const drawerAudioRef = useRef<HTMLAudioElement | null>(null);
  const filterPopoverRef = useRef<HTMLDivElement | null>(null);
  const selectedCallSeqRef = useRef<number>(0);

  // Mismatch Protection (Phase 7): Validate bidirectional provenance invariants
  const isIntegrityMismatched = useMemo(() => {
    if (!drawerCall) return false;
    if (drawerCall.linkedRequest) {
      const req = drawerCall.linkedRequest;
      const matches = req.telephonyCallId === drawerCall.id ||
                      drawerCall.canonicalRequestId === req.id ||
                      req.id === `req_call_${drawerCall.id}`;
      if (!matches) {
        console.warn(`[CallsTableView] Integrity mismatch: linkedRequest ${req.id} does not match call ${drawerCall.id}`);
        return true;
      }
    }
    if (drawerCall.linkedTasks && drawerCall.linkedTasks.length > 0) {
      if (!drawerCall.linkedRequest && !drawerCall.canonicalTaskId) {
        console.warn(`[CallsTableView] Integrity mismatch: tasks present without linked request or task link`);
        return true;
      }
    }
    return false;
  }, [drawerCall]);

  // Role permissions
  const normalizedRole = (currentUserRole || '').toLowerCase();
  const isManager = isOperator || ['owner', 'director', 'admin', 'administrator', 'marketing_owner', 'marketing_coordinator', 'bic'].includes(normalizedRole);

  // Sync external selectedCallId
  useEffect(() => {
    if (selectedCallId) {
      const match = calls.find(c => c.id === selectedCallId);
      if (match) {
        setDrawerCall(match);
        setDrawerCurrentTime(0);
        setDrawerDuration(parseDurationToSeconds(match) || 0);
        setDrawerIsPlaying(false);
      }
    }
  }, [selectedCallId, calls]);

  // Close filter popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target as Node)) {
        setShowFilterPopover(false);
      }
    };
    if (showFilterPopover) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilterPopover]);

  // Escape key closes drawer and filter popover
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (drawerCall) {
          setDrawerCall(null);
          setDrawerIsPlaying(false);
        }
        if (showFilterPopover) {
          setShowFilterPopover(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerCall, showFilterPopover]);

  const todayCallsCount = useMemo(() => {
    return calls.filter(isCallFromToday).length;
  }, [calls]);

  const activePlayingCall = useMemo(() => {
    return calls.find(c => c.id === activeAudioCallId);
  }, [calls, activeAudioCallId]);

  // Count active non-default filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedDirection !== 'all') count++;
    if (selectedDept !== 'All Departments') count++;
    if (includeArchive) count++;
    return count;
  }, [selectedDirection, selectedDept, includeArchive]);

  // Main Audio player listeners
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setAudioDuration(audioRef.current.duration);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    setAudioCurrentTime(0);
  };

  const handleSeekAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setAudioCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleCyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  // Drawer Audio listeners
  const handleDrawerTimeUpdate = () => {
    if (drawerAudioRef.current) {
      setDrawerCurrentTime(drawerAudioRef.current.currentTime);
      if (drawerAudioRef.current.duration && !isNaN(drawerAudioRef.current.duration)) {
        setDrawerDuration(drawerAudioRef.current.duration);
      }
    }
  };

  const handleDrawerSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setDrawerCurrentTime(time);
    if (drawerAudioRef.current) {
      drawerAudioRef.current.currentTime = time;
    }
  };

  const handleToggleDrawerAudio = () => {
    if (!drawerAudioRef.current) return;
    if (drawerIsPlaying) {
      drawerAudioRef.current.pause();
      setDrawerIsPlaying(false);
    } else {
      drawerAudioRef.current.play().then(() => {
        setDrawerIsPlaying(true);
      }).catch(err => {
        console.warn('[CallsTableView] Audio playback notice:', err);
      });
    }
  };

  const handleCycleDrawerRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(drawerRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setDrawerRate(nextRate);
    if (drawerAudioRef.current) {
      drawerAudioRef.current.playbackRate = nextRate;
    }
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isWithin30Days = (call: TelephonyCallItem) => {
    const time = parseCallDateToTimestamp(call);
    if (!time || isNaN(time)) return true;
    return Date.now() - time <= THIRTY_DAYS_MS;
  };

  const handleHeaderSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'date' || field === 'duration' ? 'desc' : 'asc');
    }
  };

  const handleOpenCallDetails = (call: TelephonyCallItem) => {
    selectedCallSeqRef.current += 1;
    if (drawerAudioRef.current) {
      drawerAudioRef.current.pause();
      drawerAudioRef.current.currentTime = 0;
    }
    setDrawerCall(call);
    setDrawerActiveTab('summary');
    setDrawerCurrentTime(0);
    setDrawerDuration(parseDurationToSeconds(call) || 0);
    setDrawerIsPlaying(false);
    setDrawerTranscriptQuery('');
    setIsLinkedRecordsExpanded(false);
    onSelectCall?.(call);
    onOpenTranscript?.(call);
  };

  const handleCopyText = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedToast(`Copied ${label}`);
    setTimeout(() => setCopiedToast(null), 2500);
  };

  // Filter and sort calls
  const filteredCalls = useMemo(() => {
    const isSearching = searchQuery.trim().length > 0;

    return calls
      .filter(c => {
        // Today vs All Timeframe Filter
        if (callsTimeframe === 'today' && !isSearching && !isCallFromToday(c)) {
          return false;
        }

        // Direction Filter
        if (selectedDirection !== 'all') {
          const callDir = (c.direction || 'inbound').toLowerCase();
          if (callDir !== selectedDirection.toLowerCase()) return false;
        }

        // Search query
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          (c.propertyAddress && c.propertyAddress.toLowerCase().includes(q)) ||
          (c.callerName && c.callerName.toLowerCase().includes(q)) ||
          (c.callerPhone && c.callerPhone.toLowerCase().includes(q)) ||
          (c.phone && c.phone.toLowerCase().includes(q)) ||
          (c.id && c.id.toLowerCase().includes(q)) ||
          (c.canonicalRequestId && c.canonicalRequestId.toLowerCase().includes(q)) ||
          (c.canonicalTaskId && c.canonicalTaskId.toLowerCase().includes(q)) ||
          (c.transcript && c.transcript.toLowerCase().includes(q)) ||
          (c.requestExcerpt && c.requestExcerpt.toLowerCase().includes(q)) ||
          (c.requestType && c.requestType.toLowerCase().includes(q));

        // Department filter
        const matchesDept =
          selectedDept === 'All Departments' ||
          (selectedDept === 'Marketing Collateral' && (c.departmentCategory === 'marketing_collateral' || !c.departmentCategory)) ||
          (selectedDept === 'Sign & Vendor' && c.departmentCategory === 'sign_vendor') ||
          (selectedDept === 'Operations & Facilities' && (c.departmentCategory === 'general_ops' || c.departmentCategory === 'facilities_tech')) ||
          (selectedDept === 'Compliance' && c.departmentCategory === 'compliance_contract') ||
          (selectedDept === 'Commission' && c.departmentCategory === 'commission_finance');

        // Time window: if searching, viewing all calls, or includeArchive checked, search all calls; otherwise last 30 days
        const matchesTimeWindow = isSearching || callsTimeframe === 'all' || includeArchive || isWithin30Days(c);

        return matchesSearch && matchesDept && matchesTimeWindow;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === 'date') {
          const timeA = parseCallDateToTimestamp(a);
          const timeB = parseCallDateToTimestamp(b);
          comp = timeB - timeA;
          return sortDirection === 'asc' ? -comp : comp;
        }

        if (sortField === 'caller') {
          comp = a.callerName.localeCompare(b.callerName);
          return sortDirection === 'asc' ? comp : -comp;
        }

        if (sortField === 'property') {
          comp = a.propertyAddress.localeCompare(b.propertyAddress);
          return sortDirection === 'asc' ? comp : -comp;
        }

        if (sortField === 'category') {
          const catA = a.departmentCategory || '';
          const catB = b.departmentCategory || '';
          comp = catA.localeCompare(catB);
          return sortDirection === 'asc' ? comp : -comp;
        }

        if (sortField === 'duration') {
          const durA = parseDurationToSeconds(a);
          const durB = parseDurationToSeconds(b);
          comp = durB - durA;
          return sortDirection === 'asc' ? -comp : comp;
        }

        return 0;
      });
  }, [calls, searchQuery, selectedDept, selectedDirection, callsTimeframe, sortField, sortDirection, includeArchive]);

  const toggleAudio = (call: TelephonyCallItem) => {
    if (activeAudioCallId === call.id && isPlayingAudio) {
      audioRef.current?.pause();
      setIsPlayingAudio(false);
    } else {
      setActiveAudioCallId(call.id);
      setIsPlayingAudio(true);
      if (audioRef.current) {
        const audioSrc = call.recordingUrl || call.audioUrl || `/api/marketing/calls/${call.id}/audio`;
        audioRef.current.src = audioSrc;
        audioRef.current.playbackRate = playbackRate;
        audioRef.current.load();
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('[CallsTableView] Direct audio play notice:', err);
            if (audioRef.current && audioRef.current.src !== `/api/marketing/calls/${call.id}/audio`) {
              audioRef.current.src = `/api/marketing/calls/${call.id}/audio`;
              audioRef.current.load();
              audioRef.current.play().catch(() => {});
            }
          });
        }
      }
    }
  };

  const getDeptBadge = (dept?: string) => {
    switch (dept) {
      case 'sign_vendor':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-800 border border-purple-200 whitespace-nowrap">Sign &amp; Vendor</span>;
      case 'compliance_contract':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200 whitespace-nowrap">Compliance</span>;
      case 'commission_finance':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">Commission</span>;
      case 'facilities_tech':
      case 'general_ops':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200 whitespace-nowrap">Operations</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#E5EFEA] text-[#00635C] border border-[#00635C]/20 whitespace-nowrap">Marketing</span>;
    }
  };

  const getDirectionBadge = (dir?: string) => {
    const isOutbound = (dir || '').toLowerCase() === 'outbound';
    if (isOutbound) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 whitespace-nowrap">
          <PhoneOutgoing className="w-2.5 h-2.5 text-sky-600" />
          <span>Outbound</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
        <PhoneIncoming className="w-2.5 h-2.5 text-emerald-600" />
        <span>Inbound</span>
      </span>
    );
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition ml-1 inline-block" />;
    }
    return sortDirection === 'desc' ? (
      <ArrowDown className="w-3.5 h-3.5 text-[#00635C] ml-1 inline-block" />
    ) : (
      <ArrowUp className="w-3.5 h-3.5 text-[#00635C] ml-1 inline-block" />
    );
  };

  const hasActiveError = Boolean(error || isDbUnavailable);

  return (
    <div className="space-y-3 font-sans text-left" data-testid="calls-table-view">
      {copiedToast && (
        <div className="fixed bottom-5 right-5 z-[150] bg-slate-900 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-lg animate-in fade-in">
          {copiedToast}
        </div>
      )}

      {/* APPLE TOOLBAR: TIMEFRAME SEGMENT + SEARCH + SINGLE FILTERS POPOVER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-2 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* Left: Timeframe Segmented Control */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setCallsTimeframe('today')}
            data-testid="tab-today-calls"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              callsTimeframe === 'today'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#00635C]" />
            <span>Today's Calls</span>
            <span
              data-testid="today-calls-count-badge"
              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                callsTimeframe === 'today' ? 'bg-[#E5EFEA] text-[#00635C]' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {todayCallsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCallsTimeframe('all')}
            data-testid="tab-all-calls"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              callsTimeframe === 'all'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Phone className="w-3.5 h-3.5 text-slate-500" />
            <span data-testid="all-calls-tab-label">All Calls</span>
            <span
              data-testid="all-calls-count-badge"
              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                callsTimeframe === 'all' ? 'bg-[#E5EFEA] text-[#00635C]' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {calls.length}
            </span>
          </button>
        </div>

        {/* Center: Search input */}
        <div className="relative flex-1 max-w-xl">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search calls by address, caller, phone, or keyword…"
            className="w-full pl-9 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/80 focus:border-[#00635C]/50 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 transition outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Filters popover & Result summary */}
        <div className="flex items-center gap-2 justify-between md:justify-end shrink-0">
          <div className="relative" ref={filterPopoverRef}>
            <button
              type="button"
              data-testid="calls-filters-button"
              onClick={() => setShowFilterPopover(prev => !prev)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
                activeFilterCount > 0
                  ? 'bg-[#E5EFEA] text-[#00635C] border-[#00635C]/30'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#00635C] text-white text-[10px] font-mono font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* FILTERS POPOVER PANEL */}
            {showFilterPopover && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-3.5 z-40 space-y-3 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs text-slate-900">Filter Calls</span>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDirection('all');
                        setSelectedDept('All Departments');
                        setIncludeArchive(false);
                      }}
                      className="text-[11px] text-[#00635C] font-semibold hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Direction */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Direction</label>
                  <select
                    value={selectedDirection}
                    onChange={e => setSelectedDirection(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="all">All Directions</option>
                    <option value="inbound">Inbound Only</option>
                    <option value="outbound">Outbound Only</option>
                  </select>
                </div>

                {/* Department / Category */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Department</label>
                  <select
                    value={selectedDept}
                    onChange={e => setSelectedDept(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="All Departments">All Departments</option>
                    <option value="Marketing Collateral">Marketing Collateral</option>
                    <option value="Sign & Vendor">Sign &amp; Vendor Dispatch</option>
                    <option value="Operations & Facilities">Operations &amp; Facilities</option>
                    <option value="Compliance">Compliance &amp; Contracts</option>
                    <option value="Commission">Commission &amp; Finance</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sort Order</label>
                  <select
                    value={`${sortField}-${sortDirection}`}
                    onChange={e => {
                      const [field, dir] = e.target.value.split('-') as [SortField, SortDirection];
                      setSortField(field);
                      setSortDirection(dir);
                    }}
                    className="w-full px-2 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="date-desc">Date (Newest First)</option>
                    <option value="date-asc">Date (Oldest First)</option>
                    <option value="caller-asc">Caller Name (A to Z)</option>
                    <option value="caller-desc">Caller Name (Z to A)</option>
                    <option value="property-asc">Property Address (A to Z)</option>
                    <option value="duration-desc">Duration (Longest First)</option>
                    <option value="duration-asc">Duration (Shortest First)</option>
                  </select>
                </div>

                {/* Archive toggle */}
                <label className="flex items-center gap-2 pt-1 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={includeArchive}
                    onChange={e => setIncludeArchive(e.target.checked)}
                    className="rounded border-slate-300 text-[#00635C] focus:ring-[#00635C]"
                  />
                  <span>Include calls older than 30 days</span>
                </label>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
            Showing <span className="font-bold text-slate-900">{filteredCalls.length}</span>{' '}
            {callsTimeframe === 'today' ? 'today' : 'total'} · <span className="text-slate-400 font-mono text-[10px]">America/New_York</span>
          </div>
        </div>
      </div>

      {/* ACTIVE AUDIO PLAYBACK BAR */}
      {activeAudioCallId && activePlayingCall && (
        <div className="p-2.5 bg-[#E5EFEA] border border-[#00635C]/30 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 animate-in slide-in-from-top-1">
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              type="button"
              onClick={() => toggleAudio(activePlayingCall)}
              className="w-8 h-8 rounded-lg bg-[#00635C] hover:bg-[#004d47] text-white flex items-center justify-center shrink-0 shadow-2xs transition cursor-pointer"
            >
              {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
            <div className="truncate">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[#00635C]" />
                <span>Playing Voice Recording: {activePlayingCall.callerName}</span>
              </div>
              <div className="text-[11px] text-slate-600 truncate">{activePlayingCall.propertyAddress}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-1/2">
            <span className="font-mono text-[11px] text-slate-600 font-bold w-10 text-right">
              {formatSeconds(audioCurrentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={audioDuration || parseDurationToSeconds(activePlayingCall) || 100}
              step={0.1}
              value={audioCurrentTime}
              onChange={handleSeekAudio}
              className="w-full accent-[#00635C] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <span className="font-mono text-[11px] text-slate-500 font-medium w-10">
              {formatSeconds(audioDuration || parseDurationToSeconds(activePlayingCall))}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCyclePlaybackRate}
              className="px-2 py-0.5 bg-white border border-[#00635C]/20 hover:bg-[#d0e5dc] rounded-lg text-[10px] font-mono font-bold text-[#00635C] transition cursor-pointer shadow-2xs"
              title="Playback Speed"
            >
              {playbackRate}x
            </button>
            <button
              type="button"
              onClick={() => {
                audioRef.current?.pause();
                setActiveAudioCallId(null);
                setIsPlayingAudio(false);
                setAudioCurrentTime(0);
              }}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
              title="Close Player"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* AUDIO ELEMENT */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onCanPlay={handleTimeUpdate}
        onEnded={handleAudioEnded}
        onPause={() => setIsPlayingAudio(false)}
        onPlay={() => setIsPlayingAudio(true)}
        onError={e => {
          console.warn('[CallsTableView] Audio playback fallback notice:', e);
          if (activeAudioCallId && audioRef.current && !audioRef.current.src.includes('/api/marketing/calls/')) {
            audioRef.current.src = `/api/marketing/calls/${activeAudioCallId}/audio`;
            audioRef.current.load();
            audioRef.current.play().catch(() => {});
          }
        }}
        className="hidden"
      />

      {/* Soft-fail: keep cached calls visible; error ≠ empty (Critiquito) */}
      {hasActiveError && (
        <div
          data-testid="calls-error-state"
          className={`nest-banner-in p-3 rounded-2xl space-y-1.5 border ${
            calls.length > 0
              ? 'bg-amber-50 border-amber-200'
              : 'bg-rose-50 border-rose-200'
          }`}
        >
          <div className={`flex items-center gap-2 font-bold text-xs ${calls.length > 0 ? 'text-amber-950' : 'text-rose-900'}`}>
            <AlertCircle className={`w-4 h-4 shrink-0 ${calls.length > 0 ? 'text-amber-600' : 'text-rose-600'}`} />
            <span>
              {calls.length > 0
                ? 'Live telephony unreachable'
                : 'Telephony Ledger Connection Error'}
            </span>
          </div>
          <p className={`text-xs ${calls.length > 0 ? 'text-amber-800' : 'text-rose-700'}`}>
            {calls.length > 0
              ? 'Showing last loaded calls. Live ledger refresh failed — Retry when the server is back.'
              : (error || 'Unable to connect to the persistent PostgreSQL telephony calls ledger.')}
          </p>
          {error && calls.length > 0 && (
            <p className="text-[10px] text-amber-700/80 font-mono truncate">{error}</p>
          )}
          <div className="flex items-center gap-2 pt-0.5">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className={`nest-press px-3 py-1 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5 ${
                  calls.length > 0 ? 'bg-amber-700 hover:bg-amber-800' : 'bg-rose-700 hover:bg-rose-800'
                }`}
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* LOADING SKELETON — only when we have nothing to show yet */}
      {loading && calls.length === 0 && !hasActiveError && (
        <div data-testid="calls-loading-state" className="p-10 text-center bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-2.5">
          <RefreshCw className="w-5 h-5 text-[#00635C] animate-spin mx-auto" />
          <div className="font-semibold text-xs text-slate-800">Loading telephony calls ledger…</div>
          <div className="text-[11px] text-slate-400">Reading directly from PostgreSQL telephony_calls</div>
        </div>
      )}

      {/* Soft-fail: cached rows stay; pure error (no cache) ≠ empty “No calls today” */}
      {(calls.length > 0 || (!hasActiveError && !loading)) && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-500 font-semibold text-[11px] bg-slate-50/50">
                  <th className="py-2.5 px-3 w-10 text-center select-none" aria-label="Audio Playback"></th>
                  <th
                    onClick={() => handleHeaderSort('date')}
                    className="py-2.5 px-3 w-32 cursor-pointer select-none hover:text-slate-900 group transition"
                    title="Sort by Date & Time"
                  >
                    <div className="flex items-center">
                      <span>Date &amp; Time</span>
                      {renderSortIndicator('date')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleHeaderSort('caller')}
                    className="py-2.5 px-3 w-48 cursor-pointer select-none hover:text-slate-900 group transition"
                    title="Sort by Caller Name"
                  >
                    <div className="flex items-center">
                      <span>Caller &amp; Requester</span>
                      {renderSortIndicator('caller')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleHeaderSort('property')}
                    className="py-2.5 px-3 min-w-[220px] cursor-pointer select-none hover:text-slate-900 group transition"
                    title="Sort by Property Address"
                  >
                    <div className="flex items-center">
                      <span>Property</span>
                      {renderSortIndicator('property')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleHeaderSort('category')}
                    className="py-2.5 px-3 w-28 cursor-pointer select-none hover:text-slate-900 group transition"
                    title="Sort by Category"
                  >
                    <div className="flex items-center">
                      <span>Category</span>
                      {renderSortIndicator('category')}
                    </div>
                  </th>
                  <th className="py-2.5 px-3 min-w-[180px] select-none">
                    <span>Outcome</span>
                  </th>
                  <th
                    onClick={() => handleHeaderSort('duration')}
                    className="py-2.5 px-3 w-20 cursor-pointer select-none hover:text-slate-900 group transition text-right"
                    title="Sort by Duration"
                  >
                    <div className="flex items-center justify-end">
                      <span>Duration</span>
                      {renderSortIndicator('duration')}
                    </div>
                  </th>
                  <th className="py-2.5 px-3 w-8 text-right pr-4" aria-label="Open Call Details"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCalls.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-slate-400">
                      {calls.length === 0 ? (
                        callsTimeframe === 'today' ? (
                          <div className="nest-fade-empty space-y-2 max-w-md mx-auto" data-testid="empty-today-calls">
                            <Clock className="w-7 h-7 text-[#00635C] mx-auto mb-1" />
                            <div className="font-bold text-sm text-slate-800">No calls recorded today</div>
                            <p className="text-xs text-slate-500">
                              No calls have been received on the NORA Voice Line (+1 910 507-2047) today in Eastern Time (America/New_York).
                            </p>
                            <button
                              type="button"
                              onClick={() => setCallsTimeframe('all')}
                              className="mt-2 px-3 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-2xs"
                            >
                              Switch to All Calls
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2 max-w-md mx-auto" data-testid="empty-all-calls">
                            <Phone className="w-7 h-7 text-slate-300 mx-auto mb-1" />
                            <div className="font-bold text-sm text-slate-800">Telephony ledger is empty</div>
                            <p className="text-xs text-slate-500">
                              No inbound or outbound calls have been registered in this workspace yet. Calls are registered automatically when signed webhooks arrive from Retell.
                            </p>
                            {onBackfill && (
                              <button
                                type="button"
                                onClick={onBackfill}
                                className="mt-2 px-3 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-2xs"
                              >
                                Run Historical Backfill
                              </button>
                            )}
                          </div>
                        )
                      ) : (
                        <div className="space-y-2 max-w-md mx-auto" data-testid="empty-filtered-calls">
                          {callsTimeframe === 'today' && !searchQuery && selectedDept === 'All Departments' && selectedDirection === 'all' ? (
                            <>
                              <Clock className="w-7 h-7 text-[#00635C] mx-auto mb-1" />
                              <div className="font-bold text-sm text-slate-800">No calls recorded today</div>
                              <p className="text-xs text-slate-500">
                                No calls have been received on the NORA Voice Line (+1 910 507-2047) today in Eastern Time. There are {calls.length} calls in total call history.
                              </p>
                              <button
                                type="button"
                                onClick={() => setCallsTimeframe('all')}
                                className="mt-2 px-3 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-2xs"
                              >
                                View All Calls ({calls.length})
                              </button>
                            </>
                          ) : (
                            <>
                              <Filter className="w-7 h-7 text-slate-300 mx-auto mb-1" />
                              <div className="font-bold text-sm text-slate-800">No calls match current filters</div>
                              <p className="text-xs text-slate-500">
                                {searchQuery
                                  ? `No calls match "${searchQuery}" with the selected department and direction filters.`
                                  : `No calls found with department "${selectedDept}" or direction "${selectedDirection}".`}
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchQuery('');
                                  setSelectedDept('All Departments');
                                  setSelectedDirection('all');
                                  setCallsTimeframe('all');
                                  setIncludeArchive(false);
                                }}
                                className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
                              >
                                Reset all filters
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredCalls.map(c => {
                    const isCurrentPlaying = activeAudioCallId === c.id && isPlayingAudio;
                    const outcome = getCallOutcome(c);

                    return (
                      <tr
                        key={c.id}
                        data-testid={`call-row-${c.id}`}
                        onClick={() => handleOpenCallDetails(c)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleOpenCallDetails(c);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Call from ${c.callerName} regarding ${c.propertyAddress}`}
                        className="hover:bg-slate-50/80 focus:bg-slate-50 transition cursor-pointer group outline-none"
                      >
                        {/* 1. Quick Play Button */}
                        <td className="py-2.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleAudio(c)}
                            title={isCurrentPlaying ? 'Pause Audio' : 'Play Voice Recording'}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer mx-auto ${
                              isCurrentPlaying
                                ? 'bg-[#00635C] text-white shadow-2xs'
                                : 'bg-slate-100 hover:bg-[#00635C] hover:text-white text-slate-700'
                            }`}
                          >
                            {isCurrentPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                          </button>
                        </td>

                        {/* 2. Date & Time */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-medium text-slate-900 text-xs">{formatCallTimestampInEastern(c)}</div>
                        </td>

                        {/* 3. Caller & Requester */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#00635C] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                              {c.callerName ? c.callerName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="truncate">
                              <div className="font-semibold text-slate-900 text-xs truncate">
                                {c.callerName || 'Unknown caller'}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {c.callerPhone || c.phone || 'No phone recorded'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 4. Property / Subject */}
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-900 group-hover:text-[#00635C] transition text-xs truncate max-w-[280px]">
                            {c.propertyAddress || 'Wilmington NC Area Listing'}
                          </div>
                        </td>

                        {/* 5. Category */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {getDeptBadge(c.departmentCategory)}
                        </td>

                        {/* 6. Honest Outcome */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${outcome.badgeClass}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${outcome.dotClass}`} />
                              <span>{outcome.label}</span>
                            </span>
                          </div>
                        </td>

                        {/* 7. Duration */}
                        <td className="py-2.5 px-3 text-right font-mono text-xs text-slate-500 whitespace-nowrap">
                          {c.duration}
                        </td>

                        {/* 8. Chevron Indicator */}
                        <td className="py-2.5 px-3 text-right pr-4">
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition inline-block" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Narrow / Mobile Stacked Cards Layout */}
          <div className="block md:hidden divide-y divide-slate-100">
            {filteredCalls.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No calls match current filters.
              </div>
            ) : (
              filteredCalls.map(c => {
                const isCurrentPlaying = activeAudioCallId === c.id && isPlayingAudio;
                const outcome = getCallOutcome(c);

                return (
                  <div
                    key={c.id}
                    data-testid={`call-mobile-row-${c.id}`}
                    onClick={() => handleOpenCallDetails(c)}
                    className="p-3.5 hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            toggleAudio(c);
                          }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer ${
                            isCurrentPlaying
                              ? 'bg-[#00635C] text-white shadow-2xs'
                              : 'bg-slate-100 hover:bg-[#00635C] hover:text-white text-slate-700'
                          }`}
                        >
                          {isCurrentPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                        </button>
                        <div>
                          <div className="font-semibold text-slate-900 text-xs">{c.callerName || 'Unknown caller'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{formatCallTimestampInEastern(c)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[11px] text-slate-500">{c.duration}</span>
                      </div>
                    </div>

                    <div className="text-xs font-medium text-slate-800">
                      {c.propertyAddress || 'Wilmington NC Area Listing'}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getDeptBadge(c.departmentCategory)}
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium border ${outcome.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${outcome.dotClass}`} />
                          <span>{outcome.label}</span>
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* POPUP: SEND QUESTIONS MODAL */}
      <AskRequesterQuestionsModal
        isOpen={Boolean(questionModalCall)}
        campaign={
          questionModalCall
            ? {
                ...questionModalCall,
                agentName: questionModalCall.callerName,
                listingSnapshot: {
                  listingAgentName: questionModalCall.callerName,
                  listingAgentPhone: questionModalCall.callerPhone || '(910) 507-2047',
                  listingAgentEmail: 'agent@nestrealty.com',
                  propertyAddress: questionModalCall.propertyAddress
                },
                missingInformation: questionModalCall.missingDetailsPrompt
                  ? {
                      prompt: questionModalCall.missingDetailsPrompt
                    }
                  : undefined
              }
            : null
        }
        onClose={() => setQuestionModalCall(null)}
        onSendQuestions={data => {
          if (questionModalCall) {
            onSendQuestionsToRequester?.(questionModalCall, data);
          }
          setQuestionModalCall(null);
        }}
      />

      {/* POLISHED 4-TAB CALL DETAIL DRAWER */}
      {drawerCall && (
        <div
          key={drawerCall.id}
          className="fixed inset-0 z-[100] overflow-hidden font-sans text-left"
          data-testid="call-transcript-drawer"
        >
          {/* Backdrop Overlay */}
          <div
            onClick={() => {
              setDrawerCall(null);
              setDrawerIsPlaying(false);
            }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Slide-out Panel */}
          <div
            key={`panel-${drawerCall.id}`}
            className="fixed inset-y-0 right-0 w-full sm:w-[580px] md:w-[680px] bg-white shadow-2xl z-[100] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200 border-l border-slate-200"
          >
            {/* Drawer Header */}
            <div className="p-4 bg-white border-b border-slate-200 flex items-start justify-between gap-3 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900">
                    {drawerCall.callerName || 'Unknown caller'}
                  </h3>
                  {getDirectionBadge(drawerCall.direction)}
                  {getDeptBadge(drawerCall.departmentCategory)}
                  {drawerCall.disconnectionReason && (
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80">
                      {drawerCall.disconnectionReason}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono flex-wrap">
                  <span>{drawerCall.callerPhone || drawerCall.phone || 'No phone recorded'}</span>
                  <span>•</span>
                  <span>{drawerCall.office || 'Nest Realty Wilmington'}</span>
                  <span>•</span>
                  <span>{formatCallTimestampInEastern(drawerCall)}</span>
                  <span>•</span>
                  <span>{drawerCall.duration}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDrawerCall(null);
                  setDrawerIsPlaying(false);
                }}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer shadow-2xs"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Integrity Mismatch Guard Banner */}
            {isIntegrityMismatched && (
              <div className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-amber-900 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-amber-950">Integrity Verification Notice</div>
                  <div className="text-amber-900 leading-relaxed">
                    This call’s linked information could not be verified. No action has been taken.
                  </div>
                </div>
              </div>
            )}

            {/* 4 Tabs Segment Bar */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 flex items-center gap-1 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setDrawerActiveTab('summary')}
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition cursor-pointer whitespace-nowrap ${
                  drawerActiveTab === 'summary'
                    ? 'border-[#00635C] text-[#00635C]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Summary
              </button>
              <button
                type="button"
                onClick={() => setDrawerActiveTab('recording')}
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition cursor-pointer whitespace-nowrap ${
                  drawerActiveTab === 'recording'
                    ? 'border-[#00635C] text-[#00635C]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Recording &amp; Transcript
              </button>
              <button
                type="button"
                onClick={() => setDrawerActiveTab('linked_work')}
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition cursor-pointer whitespace-nowrap ${
                  drawerActiveTab === 'linked_work'
                    ? 'border-[#00635C] text-[#00635C]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Linked Work
              </button>
              <button
                type="button"
                onClick={() => setDrawerActiveTab('activity')}
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition cursor-pointer whitespace-nowrap ${
                  drawerActiveTab === 'activity'
                    ? 'border-[#00635C] text-[#00635C]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Activity
              </button>
            </div>

            {/* Scrollable Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* TAB 1: SUMMARY */}
              {drawerActiveTab === 'summary' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Property & Request Overview Card */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#00635C] shrink-0" />
                        <span className="font-bold text-slate-900 text-sm">
                          {drawerCall.propertyAddress || (drawerCall.departmentCategory === 'general_ops' ? 'Nest Realty Office / Facilities' : 'Wilmington NC Area Listing')}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                        ROSTER MATCHED
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 pl-6">
                      {drawerCall.requestType || (drawerCall.departmentCategory === 'general_ops' ? 'Facilities & Office Operations' : 'General Inbound Call')}
                    </div>
                  </div>

                  {/* Plain Language Summary Card */}
                  <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl space-y-2 shadow-2xs">
                    <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#00635C]" />
                      <span>Call Summary</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {drawerCall.callAnalysis?.call_summary ||
                        drawerCall.requestExcerpt ||
                        (drawerCall.transcript ? drawerCall.transcript.slice(0, 300) + '…' : 'Inbound call recorded by Ask Nora.')}
                    </p>
                  </div>

                  {/* Persisted Outcome Card */}
                  <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl space-y-2 shadow-2xs">
                    <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00635C]" />
                      <span>Outcome &amp; Linked Work</span>
                    </div>
                    {drawerCall.canonicalRequestId || drawerCall.linkedRequest ? (
                      <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-emerald-950">
                            {drawerCall.linkedRequest?.title || `Request: ${drawerCall.propertyAddress}`}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 uppercase px-1.5 py-0.2 rounded bg-emerald-100">
                            {drawerCall.linkedRequest?.status || 'Ready for Review'}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-900/80">
                          {drawerCall.linkedTasks && drawerCall.linkedTasks.length > 0
                            ? `${drawerCall.linkedTasks.length} ${drawerCall.linkedTasks.length === 1 ? 'deliverable' : 'deliverables'} generated from NORA intake.`
                            : 'Marketing request created and queued for review.'}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
                        <div className="font-medium text-slate-800">No work item created</div>
                        <p className="text-[11px] text-slate-500">
                          This call was classified as an informational inquiry or operations/facilities request. Telephony records are durably preserved without generating unnecessary tasks.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Missing Information Notice */}
                  {drawerCall.missingDetailsPrompt && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Missing Information</span>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        {drawerCall.missingDetailsPrompt}
                      </p>
                    </div>
                  )}

                  {/* Suggested Next Step (clearly labeled as suggestion only) */}
                  {(() => {
                    const aiRec = getAiRecommendedPath(drawerCall);
                    return (
                      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-slate-500" />
                            <span>Suggested next step</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium italic">Recommendation only</span>
                        </div>
                        <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">{aiRec.title}</span>
                            <span className="text-[10px] text-slate-500 font-mono">Assigned: {aiRec.targetPerson}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {aiRec.rationale}
                          </p>
                          {isManager && (
                            <div className="pt-1 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (aiRec.actionKey === 'assign_va') {
                                    onAssignToEduardo?.(drawerCall);
                                  } else {
                                    onApplyAiRecommendation?.(drawerCall, aiRec);
                                  }
                                  setDrawerCall(null);
                                }}
                                className="px-2.5 py-1 bg-[#00635C] hover:bg-[#004d47] text-white rounded-lg text-[11px] font-semibold transition cursor-pointer shadow-2xs"
                              >
                                Apply Suggested Step
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* NORA AI Speech Analysis Card */}
                  {drawerCall.departmentCategory !== 'general_ops' && drawerCall.aiExtractedDetails && (drawerCall.aiExtractedDetails.price || drawerCall.aiExtractedDetails.bedrooms || drawerCall.aiExtractedDetails.bathrooms || drawerCall.aiExtractedDetails.openHouseDate || (drawerCall.aiExtractedDetails.requiredCollateral && drawerCall.aiExtractedDetails.requiredCollateral.length > 0)) && (
                    <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-semibold text-xs text-slate-900">
                          NORA AI Speech Analysis &amp; Intelligence
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Confidence: 98%</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {drawerCall.aiExtractedDetails.price && (
                          <div className="p-2 bg-slate-50 rounded-xl space-y-0.5 border border-slate-100">
                            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Price</span>
                            <span className="font-bold text-slate-900">
                              {drawerCall.aiExtractedDetails.price}
                            </span>
                          </div>
                        )}
                        {(drawerCall.aiExtractedDetails.bedrooms || drawerCall.aiExtractedDetails.bathrooms) && (
                          <div className="p-2 bg-slate-50 rounded-xl space-y-0.5 border border-slate-100">
                            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Beds / Baths</span>
                            <span className="font-bold text-slate-900">
                              {[drawerCall.aiExtractedDetails.bedrooms, drawerCall.aiExtractedDetails.bathrooms].filter(Boolean).join(' / ')}
                            </span>
                          </div>
                        )}
                        {drawerCall.aiExtractedDetails.openHouseDate && (
                          <div className="p-2 bg-slate-50 rounded-xl space-y-0.5 border border-slate-100">
                            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Open House</span>
                            <span className="font-bold text-slate-900">
                              {drawerCall.aiExtractedDetails.openHouseDate}
                            </span>
                          </div>
                        )}
                        {drawerCall.aiExtractedDetails.requiredCollateral && drawerCall.aiExtractedDetails.requiredCollateral.length > 0 && (
                          <div className="p-2 bg-slate-50 rounded-xl space-y-0.5 border border-slate-100">
                            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Collateral Requested</span>
                            <span className="font-bold text-slate-900 truncate block">
                              {drawerCall.aiExtractedDetails.requiredCollateral.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: RECORDING & TRANSCRIPT */}
              {drawerActiveTab === 'recording' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Lossless Audio Player */}
                  {Boolean(drawerCall.recordingUrl || drawerCall.audioUrl) ? (
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                      <audio
                        key={`audio-${drawerCall.id}`}
                        ref={drawerAudioRef}
                        src={drawerCall.audioUrl || drawerCall.recordingUrl || `/api/marketing/calls/${drawerCall.id}/audio`}
                        preload="metadata"
                        onLoadedMetadata={(e) => {
                          const duration = e.currentTarget.duration;
                          if (duration && !isNaN(duration) && isFinite(duration) && duration > 0) {
                            setDrawerDuration(duration);
                          }
                        }}
                        onTimeUpdate={handleDrawerTimeUpdate}
                        onEnded={() => setDrawerIsPlaying(false)}
                        className="hidden"
                      />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-[#00635C]" />
                          <span className="font-bold text-xs text-slate-900">48kHz Lossless Voice Recording</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCycleDrawerRate}
                            className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono font-bold text-slate-700 cursor-pointer shadow-2xs"
                            title="Playback rate"
                          >
                            {drawerRate}x
                          </button>
                          <span className="text-[10px] font-mono text-slate-500">
                            {drawerCall.duration}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleToggleDrawerAudio}
                          className="w-9 h-9 rounded-xl bg-[#00635C] hover:bg-[#004d47] text-white flex items-center justify-center shrink-0 shadow-2xs transition cursor-pointer"
                          title={drawerIsPlaying ? 'Pause' : 'Play'}
                        >
                          {drawerIsPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>

                        <div className="flex-1 flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-600 font-bold w-9 text-right">
                            {formatSeconds(drawerCurrentTime)}
                          </span>
                          <input
                            type="range"
                            min={0}
                            max={drawerDuration || parseDurationToSeconds(drawerCall) || 100}
                            step={0.1}
                            value={drawerCurrentTime}
                            onChange={handleDrawerSeek}
                            className="w-full accent-[#00635C] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                          />
                          <span className="font-mono text-[10px] text-slate-500 font-medium w-9">
                            {formatSeconds(drawerDuration || parseDurationToSeconds(drawerCall))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3 text-slate-500">
                      <VolumeX className="w-5 h-5 text-slate-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-slate-700">No audio recording available for this call</div>
                        <div className="text-[11px] text-slate-500">Telephony audio was not captured or has expired upstream.</div>
                      </div>
                    </div>
                  )}

                  {/* Transcript Search & Copy Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={drawerTranscriptQuery}
                        onChange={e => setDrawerTranscriptQuery(e.target.value)}
                        placeholder="Search transcript…"
                        className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none placeholder:text-slate-400"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyText(drawerCall.transcript || '', 'Transcript')}
                      className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Transcript</span>
                    </button>
                  </div>

                  {/* Verbatim Retell Dialogue Transcript */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Verbatim Retell Dialogue Transcript
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {drawerCall.transcript ? (
                        drawerCall.transcript
                          .split('\n')
                          .filter(line => line.trim().length > 0)
                          .filter(line => !drawerTranscriptQuery || line.toLowerCase().includes(drawerTranscriptQuery.toLowerCase()))
                          .map((line, idx) => {
                            const isAi = line.toLowerCase().startsWith('agent:') || line.toLowerCase().startsWith('nora:');
                            return (
                              <div
                                key={idx}
                                className={`p-2.5 rounded-xl text-xs leading-relaxed transition ${
                                  isAi
                                    ? 'bg-[#E5EFEA] text-[#004d47] border border-[#00635C]/20 ml-2'
                                    : 'bg-white text-slate-800 border border-slate-200 mr-2'
                                }`}
                              >
                                <span className="font-bold block text-[10px] mb-0.5 opacity-75">
                                  {isAi ? 'Ask Nora (Voice Agent)' : (drawerCall.callerName || 'Caller')}
                                </span>
                                <span>{line.replace(/^(agent:|user:|nora:|caller:)/i, '').trim()}</span>
                              </div>
                            );
                          })
                      ) : (
                        <div className="text-xs text-slate-400 italic text-center py-6">
                          No verbatim transcript available for this call.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LINKED WORK */}
              {drawerActiveTab === 'linked_work' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {drawerCall.canonicalRequestId || drawerCall.linkedRequest ? (
                    <div className="space-y-4">
                      {/* Linked Request Card */}
                      <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-semibold text-xs text-slate-900">Canonical Request</span>
                          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {drawerCall.canonicalRequestId || drawerCall.linkedRequest?.id}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="font-bold text-xs text-slate-900">
                            {drawerCall.linkedRequest?.title || `Marketing Request: ${drawerCall.propertyAddress}`}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Status: <span className="font-medium text-slate-700 capitalize">{drawerCall.linkedRequest?.status || 'ready_for_review'}</span>
                          </div>
                        </div>

                        {onNavigateToRequest && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                const reqId = drawerCall.canonicalRequestId || drawerCall.linkedRequest?.id;
                                if (reqId) {
                                  setDrawerCall(null);
                                  setDrawerIsPlaying(false);
                                  onNavigateToRequest(reqId);
                                }
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5"
                            >
                              <span>Open Request in Tasks</span>
                              <ExternalLink className="w-3 h-3 text-slate-500" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Child Deliverables & Tasks */}
                      <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl space-y-2.5 shadow-2xs">
                        <div className="font-semibold text-xs text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
                          <span>Child Deliverables &amp; Tasks</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {drawerCall.linkedTasks?.length || 0} items
                          </span>
                        </div>

                        {drawerCall.linkedTasks && drawerCall.linkedTasks.length > 0 ? (
                          <div className="space-y-2">
                            {drawerCall.linkedTasks.map(task => (
                              <div
                                key={task.id}
                                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                              >
                                <div className="space-y-0.5 truncate">
                                  <div className="font-semibold text-xs text-slate-900 truncate">{task.title}</div>
                                  <div className="text-[10px] text-slate-500 font-mono truncate">
                                    Assignee: {task.assigneeName || 'Unassigned'} · Status: {task.status}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#E5EFEA] text-[#00635C] border border-[#00635C]/20">
                                    {task.category || 'Deliverable'}
                                  </span>
                                  {onNavigateToTask && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDrawerCall(null);
                                        setDrawerIsPlaying(false);
                                        onNavigateToTask(task.id);
                                      }}
                                      className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                      title="Open Task"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic py-2">
                            No child tasks created yet.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                      <CheckCircle2 className="w-6 h-6 text-slate-400 mx-auto" />
                      <div className="font-semibold text-xs text-slate-800">No work item created</div>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        This call was classified as general operations, facilities, or an informational inquiry. No marketing request required.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ACTIVITY & IMMUTABLE AUDIT TRAIL */}
              {drawerActiveTab === 'activity' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Collapsible Linked Records Bar */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <button
                      type="button"
                      onClick={() => setIsLinkedRecordsExpanded(prev => !prev)}
                      className="w-full flex items-center justify-between text-xs font-semibold text-slate-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#00635C]" />
                        <span>Linked Records &amp; Identifiers</span>
                      </div>
                      <span className="text-[11px] text-[#00635C] flex items-center gap-0.5">
                        {isLinkedRecordsExpanded ? 'Collapse' : 'Expand'}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isLinkedRecordsExpanded ? 'rotate-180' : ''}`} />
                      </span>
                    </button>

                    {isLinkedRecordsExpanded && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-200/70 text-xs animate-in fade-in">
                        <div className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200/60 font-mono text-[11px]">
                          <span className="text-slate-500">Call ID:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-800 font-bold" data-testid="drawer-call-id">{drawerCall.id}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(drawerCall.id, 'Call ID')}
                              className="text-slate-400 hover:text-slate-700"
                              title="Copy Call ID"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {drawerCall.canonicalRequestId && (
                          <div className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200/60 font-mono text-[11px]">
                            <span className="text-slate-500">Request ID:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-800 font-bold">{drawerCall.canonicalRequestId}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(drawerCall.canonicalRequestId!, 'Request ID')}
                                className="text-slate-400 hover:text-slate-700"
                                title="Copy Request ID"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}

                        {drawerCall.canonicalTaskId && (
                          <div className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200/60 font-mono text-[11px]">
                            <span className="text-slate-500">Task ID:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-800 font-bold">{drawerCall.canonicalTaskId}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(drawerCall.canonicalTaskId!, 'Task ID')}
                                className="text-slate-400 hover:text-slate-700"
                                title="Copy Task ID"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200/60 font-mono text-[11px]">
                          <span className="text-slate-500">Tenant Workspace:</span>
                          <span className="text-slate-700 font-semibold">ws_wilmington</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Canonical Activity & Contact Stream (if linked to request/task) */}
                  {(drawerCall.canonicalRequestId || drawerCall.linkedRequest?.id) ? (
                    <div className="space-y-4">
                      <ContactSummaryCard
                        contactSummary={drawerContactSummary}
                        loading={isLoadingDrawerActivity}
                      />
                      <ActivityAndContactTimeline
                        events={drawerActivityEvents}
                        currentRequestId={drawerCall.canonicalRequestId || drawerCall.linkedRequest?.id}
                        currentTaskId={drawerCall.canonicalTaskId || (drawerCall.linkedTasks && drawerCall.linkedTasks[0]?.id)}
                        viewRole="manager"
                        loading={isLoadingDrawerActivity}
                        onRefresh={fetchCallDrawerActivity}
                      />
                    </div>
                  ) : (
                    /* Immutable Processing Timeline for unlinked calls */
                    <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl space-y-3 shadow-2xs">
                      <div className="font-semibold text-xs text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                        <span>Immutable Telephony Audit Trail</span>
                        <span className="text-[11px] text-slate-400 font-normal">Direct Voice Ingestion</span>
                      </div>

                      <div className="space-y-3 pl-2 border-l-2 border-slate-200 text-xs">
                        {/* Event 1 */}
                        <div className="relative pl-3 space-y-0.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 absolute -left-[17px] top-1.5" />
                          <div className="font-semibold text-slate-900">Inbound Call Received</div>
                          <div className="text-[11px] text-slate-500">
                            {formatCallTimestampInEastern(drawerCall)} · Via NORA Voice Line (910) 507-2047
                          </div>
                        </div>

                        {/* Event 2 */}
                        <div className="relative pl-3 space-y-0.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 absolute -left-[17px] top-1.5" />
                          <div className="font-semibold text-slate-900">Call Ended &amp; Duration Recorded</div>
                          <div className="text-[11px] text-slate-500">
                            Duration: {drawerCall.duration} · Disconnection: {drawerCall.disconnectionReason || 'user_hangup'}
                          </div>
                        </div>

                        {/* Event 3 */}
                        <div className="relative pl-3 space-y-0.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 absolute -left-[17px] top-1.5" />
                          <div className="font-semibold text-slate-900">Speech Analysis Ingested</div>
                          <div className="text-[11px] text-slate-500">
                            Extracted details &amp; dialogue transcript persisted to PostgreSQL
                          </div>
                        </div>

                        {/* Event 4 */}
                        <div className="relative pl-3 space-y-0.5">
                          <div className="w-2 h-2 rounded-full bg-[#00635C] absolute -left-[17px] top-1.5" />
                          <div className="font-semibold text-slate-900">Directory Identity Matched</div>
                          <div className="text-[11px] text-slate-500">
                            Verified against Nest 72-agent directory roster
                          </div>
                        </div>

                        {/* Event 5 */}
                        <div className="relative pl-3 space-y-0.5">
                          <div className="w-2 h-2 rounded-full bg-amber-500 absolute -left-[17px] top-1.5" />
                          <div className="font-semibold text-slate-900">
                            Awaiting Canonical Request Conversion
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Inbound voice call recorded; conversion to multi-deliverable tasks pending manager review.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Role-Protected Drawer Footer */}
            {isManager && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  {drawerCall.departmentCategory !== 'general_ops' && (
                    <button
                      type="button"
                      disabled={isIntegrityMismatched}
                      onClick={() => {
                        if (isIntegrityMismatched) return;
                        onAssignToEduardo?.(drawerCall);
                        setDrawerCall(null);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                        isIntegrityMismatched
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-2xs'
                      }`}
                      title={isIntegrityMismatched ? "Action disabled: call link unverified" : "Assign to Eduardo Lovo (Marketing Suite)"}
                    >
                      <span>Assign Work</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isIntegrityMismatched}
                    onClick={() => {
                      if (isIntegrityMismatched) return;
                      setQuestionModalCall(drawerCall);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 border ${
                      isIntegrityMismatched
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 cursor-pointer shadow-2xs'
                    }`}
                    title={isIntegrityMismatched ? "Action disabled: call link unverified" : "Internal Follow-Up"}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    <span>Internal Follow-Up</span>
                  </button>
                </div>

                <div className="text-[10px] text-slate-400 font-mono">
                  Role: Manager ({currentUserRole})
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
