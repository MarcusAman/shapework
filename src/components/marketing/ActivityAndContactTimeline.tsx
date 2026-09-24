/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Shared Unified Activity & Contact History Timeline Component
 * Chronological immutable event stream across Manager Modals, Assignee Drawers, and Calls Drawers.
 */

import React, { useState, useMemo } from 'react';
import {
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Upload,
  User,
  Users,
  ShieldAlert,
  ArrowUpDown,
  Filter,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  Check,
  Send,
  CornerDownLeft,
  XCircle,
  Building
} from 'lucide-react';
import { CallRecordingPanel } from './CallRecordingPanel';
import type {
  CanonicalActivityEvent,
  ActivityEventType,
  CommunicationStatus,
  ChannelType
} from '../../../server/services/activityHistoryService.js';

export interface ActivityTimelineSourceMedia {
  callId?: string | null;
  audioUrl?: string | null;
  transcript?: string | null;
  emailSubject?: string | null;
  emailBody?: string | null;
  emailFrom?: string | null;
  agentName?: string | null;
}

export interface ActivityAndContactTimelineProps {
  events: CanonicalActivityEvent[];
  currentTaskId?: string;
  currentRequestId?: string;
  viewRole?: 'manager' | 'assignee';
  loading?: boolean;
  onRefresh?: () => void;
  className?: string;
  /** Call/email proof for Details — Peak-End: show this before audit/tech */
  sourceMedia?: ActivityTimelineSourceMedia | null;
}

type FilterCategory =
  | 'all'
  | 'contact'
  | 'intake'
  | 'assignment'
  | 'files'
  | 'production'
  | 'review'
  | 'delivery'
  | 'errors';

/**
 * Formats timestamp into America/New_York human-readable string:
 * e.g. "Friday, Sep 5 at 9:46 AM"
 */
export function formatEasternDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Recently';

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const parts = formatter.formatToParts(d);
    const weekday = parts.find(p => p.type === 'weekday')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const day = parts.find(p => p.type === 'day')?.value || '';
    const hour = parts.find(p => p.type === 'hour')?.value || '';
    const minute = parts.find(p => p.type === 'minute')?.value || '';
    const dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value || '';

    return `${weekday}, ${month} ${day} at ${hour}:${minute} ${dayPeriod}`;
  } catch {
    return 'Recently';
  }
}

/**
 * Calculates relative time (e.g. '14m ago', '2h ago', 'yesterday')
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'just now';

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
  } catch {
    return 'recently';
  }
}

/**
 * Normalizes event summary to human-readable form:
 * Suppresses duplicate rejection prefixes and raw staff IDs on the normal timeline card.
 */
export function formatCleanEventSummary(summary?: string | null): string {
  if (!summary) return '';
  const s = String(summary).trim();
  if (
    s.includes('self_approval_rejected') ||
    s.toLowerCase().includes('self-approval attempt rejected') ||
    s.toLowerCase().includes('self-approval rejected') ||
    s.toLowerCase().includes('producer approval is not permitted')
  ) {
    return 'Approval attempt blocked — producer approval is not permitted.';
  }
  return s.replace(/\s*\(dir_[a-z0-9_]+\)/gi, '').trim();
}

export const ActivityAndContactTimeline: React.FC<ActivityAndContactTimelineProps> = ({
  events = [],
  currentTaskId,
  currentRequestId,
  viewRole = 'manager',
  loading = false,
  onRefresh,
  className = '',
  sourceMedia = null
}) => {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // Chronological by default
  const [expandedEventIds, setExpandedEventIds] = useState<Set<string>>(new Set());
  const [techExpandedIds, setTechExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedEventIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let list = [...events];

    // Category filter
    if (activeCategory !== 'all') {
      list = list.filter(e => {
        switch (activeCategory) {
          case 'contact':
            return (
              e.channel === 'phone' ||
              e.channel === 'email' ||
              e.eventType.startsWith('outreach.') ||
              e.eventType.startsWith('call.') ||
              e.eventType.startsWith('email.')
            );
          case 'intake':
            return (
              e.eventType.startsWith('call.') ||
              e.eventType.startsWith('web_intake.') ||
              e.eventType.startsWith('email.') ||
              e.eventType.startsWith('request.') ||
              e.eventType === 'task.created'
            );
          case 'assignment':
            return (
              e.eventType.startsWith('task.assigned') ||
              e.eventType.startsWith('task.reassigned') ||
              e.eventType.startsWith('coverage.') ||
              e.eventType.startsWith('review_owner.')
            );
          case 'files':
            return (
              e.eventType.startsWith('photos.') ||
              e.eventType === 'asset.uploaded' ||
              e.eventType === 'proof_link.added' ||
              e.eventType === 'proof.submitted' ||
              Boolean(e.metadata?.photosCount || e.metadata?.assetId || e.metadata?.proofUrl)
            );
          case 'production':
            return (
              e.eventType.startsWith('work.') ||
              e.eventType.startsWith('requirement.') ||
              e.eventType === 'proof.submitted' ||
              e.eventType === 'draft.saved'
            );
          case 'review':
            return (
              e.eventType.startsWith('review.') ||
              e.eventType.startsWith('revisions.') ||
              e.eventType.startsWith('proof.')
            );
          case 'delivery':
            return (
              e.eventType.startsWith('delivery.') ||
              e.eventType.endsWith('.completed')
            );
          case 'errors':
            return (
              e.communicationStatus === 'failed' ||
              e.communicationStatus === 'bounced' ||
              e.communicationStatus === 'blocked' ||
              e.eventType.includes('blocked') ||
              e.eventType.includes('failed') ||
              e.eventType === 'requirement.needs_correction'
            );
          default:
            return true;
        }
      });
    }

    // Sort order
    list.sort((a, b) => {
      const diff = new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
      return sortDirection === 'desc' ? -diff : diff;
    });

    return list;
  }, [events, activeCategory, sortDirection]);

  // Event category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<FilterCategory, number> = {
      all: events.length,
      contact: 0,
      intake: 0,
      assignment: 0,
      files: 0,
      production: 0,
      review: 0,
      delivery: 0,
      errors: 0
    };

    events.forEach(e => {
      if (
        e.channel === 'phone' ||
        e.channel === 'email' ||
        e.eventType.startsWith('outreach.') ||
        e.eventType.startsWith('call.') ||
        e.eventType.startsWith('email.')
      ) {
        counts.contact++;
      }
      if (
        e.eventType.startsWith('call.') ||
        e.eventType.startsWith('web_intake.') ||
        e.eventType.startsWith('email.') ||
        e.eventType.startsWith('request.') ||
        e.eventType === 'task.created'
      ) {
        counts.intake++;
      }
      if (
        e.eventType.startsWith('task.assigned') ||
        e.eventType.startsWith('task.reassigned') ||
        e.eventType.startsWith('coverage.') ||
        e.eventType.startsWith('review_owner.')
      ) {
        counts.assignment++;
      }
      if (
        e.eventType.startsWith('photos.') ||
        e.eventType === 'asset.uploaded' ||
        e.eventType === 'proof_link.added' ||
        e.eventType === 'proof.submitted' ||
        Boolean(e.metadata?.photosCount || e.metadata?.assetId || e.metadata?.proofUrl)
      ) {
        counts.files++;
      }
      if (
        e.eventType.startsWith('work.') ||
        e.eventType.startsWith('requirement.') ||
        e.eventType === 'proof.submitted' ||
        e.eventType === 'draft.saved'
      ) {
        counts.production++;
      }
      if (
        e.eventType.startsWith('review.') ||
        e.eventType.startsWith('revisions.') ||
        e.eventType.startsWith('proof.')
      ) {
        counts.review++;
      }
      if (
        e.eventType.startsWith('delivery.') ||
        e.eventType.endsWith('.completed')
      ) {
        counts.delivery++;
      }
      if (
        e.communicationStatus === 'failed' ||
        e.communicationStatus === 'bounced' ||
        e.communicationStatus === 'blocked' ||
        e.eventType.includes('blocked') ||
        e.eventType.includes('failed') ||
        e.eventType === 'requirement.needs_correction'
      ) {
        counts.errors++;
      }
    });

    return counts;
  }, [events]);

  const getEventVisuals = (evt: CanonicalActivityEvent) => {
    // Communication blocked
    if (evt.communicationStatus === 'blocked' || evt.eventType.includes('blocked')) {
      return {
        icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />,
        dotBg: 'bg-amber-500',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        badgeText: 'Blocked (Not Sent)'
      };
    }

    // Call intake
    if (evt.eventType.startsWith('call.') || evt.channel === 'phone') {
      return {
        icon: <Phone className="w-3.5 h-3.5 text-emerald-700" />,
        dotBg: 'bg-emerald-500',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        badgeText: 'Phone Intake'
      };
    }

    // Email
    if (evt.eventType === 'email.received' || evt.eventType === 'outreach.reply_received') {
      return {
        icon: <Mail className="w-3.5 h-3.5 text-blue-700" />,
        dotBg: 'bg-blue-500',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
        badgeText: evt.eventType === 'outreach.reply_received' ? 'Reply Received' : 'Email Inbound'
      };
    }

    // Photos / Assets
    if (evt.eventType.startsWith('photos.') || evt.eventType === 'asset.uploaded') {
      return {
        icon: <ImageIcon className="w-3.5 h-3.5 text-teal-700" />,
        dotBg: 'bg-teal-500',
        badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
        badgeText: 'Assets Received'
      };
    }

    // Assignment & Coverage
    if (evt.eventType === 'coverage.activated') {
      return {
        icon: <Users className="w-3.5 h-3.5 text-indigo-700" />,
        dotBg: 'bg-indigo-500',
        badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        badgeText: 'OOO Coverage'
      };
    }

    if (evt.eventType.startsWith('task.assigned')) {
      return {
        icon: <User className="w-3.5 h-3.5 text-indigo-700" />,
        dotBg: 'bg-indigo-500',
        badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        badgeText: 'Assigned'
      };
    }

    // Work started
    if (evt.eventType === 'work.started') {
      return {
        icon: <Clock className="w-3.5 h-3.5 text-sky-700" />,
        dotBg: 'bg-sky-500',
        badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
        badgeText: 'Work Started'
      };
    }

    // Proof submitted
    if (evt.eventType === 'proof.submitted') {
      return {
        icon: <Upload className="w-3.5 h-3.5 text-purple-700" />,
        dotBg: 'bg-purple-500',
        badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
        badgeText: `Proof v${evt.metadata?.version || 1}`
      };
    }

    // Revisions requested
    if (evt.eventType === 'revisions.requested') {
      return {
        icon: <RotateCcw className="w-3.5 h-3.5 text-amber-700" />,
        dotBg: 'bg-amber-500',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        badgeText: 'Revisions'
      };
    }

    // Approved
    if (evt.eventType === 'proof.approved') {
      return {
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />,
        dotBg: 'bg-emerald-500',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        badgeText: 'Proof Approved'
      };
    }

    // Task completed
    if (evt.eventType === 'task.completed' || evt.eventType === 'request.completed') {
      return {
        icon: <Check className="w-3.5 h-3.5 text-emerald-800" />,
        dotBg: 'bg-[#00635C]',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
        badgeText: 'Completed'
      };
    }

    // Requirements
    if (evt.eventType === 'requirement.verified') {
      return {
        icon: <Check className="w-3.5 h-3.5 text-emerald-600" />,
        dotBg: 'bg-emerald-500',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badgeText: 'Requirement Verified'
      };
    }

    // Creation
    if (evt.eventType === 'task.created') {
      return {
        icon: <Clock className="w-3.5 h-3.5 text-slate-600" />,
        dotBg: 'bg-slate-500',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        badgeText: 'Task Created'
      };
    }
    if (evt.eventType === 'request.created') {
      return {
        icon: <Clock className="w-3.5 h-3.5 text-slate-600" />,
        dotBg: 'bg-slate-500',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        badgeText: 'Request Created'
      };
    }

    // Default
    return {
      icon: <Clock className="w-3.5 h-3.5 text-slate-600" />,
      dotBg: 'bg-slate-400',
      badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
      badgeText: evt.eventType.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    };
  };

  return (
    <div className={`space-y-4 ${className}`} data-testid="activity-and-contact-timeline">
      {/* FILTER BAR & CONTROLS */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'contact', label: 'Contact' },
              { id: 'intake', label: 'Intake' },
              { id: 'assignment', label: 'Assignment' },
              { id: 'files', label: 'Files' },
              { id: 'production', label: 'Production' },
              { id: 'review', label: 'Review' },
              { id: 'delivery', label: 'Delivery' },
              { id: 'errors', label: 'Blocked / Errors' }
            ] as const
          ).map(cat => {
            const count = categoryCounts[cat.id];
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#00635C] text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sort Toggle (Chronological vs Newest First) */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))}
            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Toggle Sort Order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>{sortDirection === 'asc' ? 'Oldest First' : 'Newest First'}</span>
          </button>
        </div>
      </div>

      {/* TIMELINE EVENT STREAM */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
            <Clock className="w-6 h-6 mx-auto mb-2 text-slate-400" />
            <p className="font-semibold text-slate-700">No activity events found in this category.</p>
            <p className="text-slate-400 mt-0.5">Events appear automatically as actions are persisted.</p>
          </div>
        ) : (
          filteredEvents.map(evt => {
            const visuals = getEventVisuals(evt);
            const isRequestLevel = !evt.taskId || (currentTaskId && evt.taskId !== currentTaskId);
            const isExpanded = expandedEventIds.has(evt.id);
            const hasMetadata = evt.metadata && Object.keys(evt.metadata).length > 0;
            const hasAdminDetails = Boolean(hasMetadata || evt.channel === 'internal' || evt.actorId || evt.idempotencyKey);
            const meta = (evt.metadata || {}) as Record<string, any>;
            const isPhoneEvent = evt.channel === 'phone' || evt.eventType.startsWith('call.') || Boolean(evt.callId) || visuals.badgeText === 'Phone Intake';
            const isEmailEvent = evt.channel === 'email' || evt.eventType.startsWith('email.') || evt.eventType.startsWith('outreach.');
            const eventCallId = evt.callId || meta.callId || sourceMedia?.callId || null;
            const eventAudio = meta.recordingUrl || meta.audioUrl || meta.recording_url || sourceMedia?.audioUrl || null;
            const eventTranscript = meta.transcript || meta.rawExcerpt || sourceMedia?.transcript || null;
            const eventEmailBody = meta.body || meta.emailBody || meta.text || meta.rawExcerpt || sourceMedia?.emailBody || null;
            const eventEmailSubject = meta.subject || meta.emailSubject || sourceMedia?.emailSubject || null;
            const eventEmailFrom = meta.from || meta.emailFrom || sourceMedia?.emailFrom || sourceMedia?.agentName || null;
            const hasCallProof = isPhoneEvent && Boolean(eventCallId || eventAudio || eventTranscript);
            const hasEmailProof = isEmailEvent && Boolean(eventEmailBody || eventEmailSubject);
            const hasProofDetails = hasCallProof || hasEmailProof;
            const canShowDetails = hasAdminDetails || hasProofDetails;
            const isTechOpen = techExpandedIds.has(evt.id);

            return (
              <div
                key={evt.id}
                data-testid={`activity-event-${evt.eventType}`}
                className="relative group transition"
              >
                {/* Timeline Dot */}
                <div
                  className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full ring-4 ring-white shadow-2xs ${visuals.dotBg}`}
                />

                {/* Event Card */}
                <div
                  className={`bg-white border rounded-xl p-3.5 space-y-2 shadow-2xs transition hover:border-slate-300 ${
                    evt.communicationStatus === 'blocked' ? 'border-amber-200/80 bg-amber-50/20' : 'border-slate-200/80'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="p-1 rounded-md bg-slate-50 border border-slate-200/70 shrink-0">
                        {visuals.icon}
                      </div>

                      <span className="font-bold text-xs text-slate-900 leading-tight">
                        {formatCleanEventSummary(evt.summary)}
                      </span>

                      {/* Event Type Badge */}
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${visuals.badgeClass}`}
                      >
                        {visuals.badgeText}
                      </span>

                      {/* Request Level vs Task Level Badge */}
                      {isRequestLevel && currentTaskId && (
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded">
                          Request activity
                        </span>
                      )}
                    </div>

                    {/* Timestamp in America/New_York + Relative Time */}
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto text-[11px] font-medium text-slate-400">
                      <span title={evt.occurredAt}>
                        {formatEasternDateTime(evt.occurredAt)}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-500 font-semibold font-mono">
                        {formatRelativeTime(evt.occurredAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actor Attribution Strip */}
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 pt-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>
                        By: <strong className="text-slate-700 font-semibold">{evt.actorDisplayName}</strong>
                      </span>

                      {evt.channel && evt.channel !== 'internal' && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="capitalize text-slate-600 font-medium">
                            Channel: {evt.channel}
                          </span>
                        </>
                      )}

                      {evt.direction && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="capitalize text-slate-600 font-medium">
                            {evt.direction}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Expandable Details Toggle */}
                    {canShowDetails && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(evt.id)}
                        className="text-xs text-[#00635C] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                        data-testid="activity-event-details-toggle"
                      >
                        <span>{isExpanded ? 'Hide Details' : 'Details'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>

                  {/* Details: PROOF FIRST (call/email), technical last/collapsed — Critiquito Peak-End */}
                  {isExpanded && canShowDetails && (
                    <div className="mt-2 space-y-3" data-testid="activity-event-details-panel">
                      {hasCallProof && (
                        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-3 space-y-2" data-testid="activity-details-call-proof">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 font-sans">
                            Call recording &amp; transcript
                          </div>
                          <CallRecordingPanel
                            callId={eventCallId}
                            fallbackAudioUrl={eventAudio}
                            fallbackTranscript={eventTranscript}
                          />
                        </div>
                      )}

                      {hasEmailProof && (
                        <div className="rounded-xl border border-sky-200/80 bg-sky-50/40 p-3 space-y-2" data-testid="activity-details-email-proof">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-sky-900 font-sans">
                            Email thread
                          </div>
                          {(eventEmailFrom || eventEmailSubject) && (
                            <div className="text-xs space-y-0.5 font-sans">
                              {eventEmailFrom && (
                                <div><span className="text-slate-500">From:</span> <strong className="text-slate-800">{eventEmailFrom}</strong></div>
                              )}
                              {eventEmailSubject && (
                                <div><span className="text-slate-500">Subject:</span> <strong className="text-slate-800">{eventEmailSubject}</strong></div>
                              )}
                            </div>
                          )}
                          {eventEmailBody ? (
                            <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto bg-white border border-sky-100 rounded-lg p-3 font-sans">
                              {String(eventEmailBody)}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-500 font-sans italic">No email body stored on this event.</p>
                          )}
                        </div>
                      )}

                      {!hasProofDetails && (
                        <p className="text-[11px] text-slate-500 font-sans px-0.5">
                          No call recording or email body attached to this event.
                        </p>
                      )}

                      {hasAdminDetails && (
                        <div className="rounded-lg border border-slate-200/80 bg-slate-50/80 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => {
                              setTechExpandedIds(prev => {
                                const next = new Set(prev);
                                if (next.has(evt.id)) next.delete(evt.id);
                                else next.add(evt.id);
                                return next;
                              });
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 cursor-pointer font-sans"
                            data-testid="activity-details-tech-toggle"
                          >
                            <span>Audit &amp; technical details</span>
                            <span className="text-[#00635C] font-semibold normal-case tracking-normal">{isTechOpen ? 'Hide' : 'Show'}</span>
                          </button>
                          {isTechOpen && (
                            <div className="px-2.5 pb-2.5 space-y-1.5 font-mono text-xs text-slate-700 border-t border-slate-200/60 pt-2">
                              {evt.channel === 'internal' && (
                                <div className="flex items-start gap-2">
                                  <span className="font-bold text-slate-500 shrink-0">channel:</span>
                                  <span className="text-slate-800">internal</span>
                                </div>
                              )}
                              {evt.actorId && (
                                <div className="flex items-start gap-2">
                                  <span className="font-bold text-slate-500 shrink-0">actorId:</span>
                                  <span className="text-slate-800">{evt.actorId}</span>
                                </div>
                              )}
                              {hasMetadata && Object.entries(evt.metadata).map(([k, v]) => {
                                if (k === 'isImportedHistorical' || v === undefined || v === null) return null;
                                if (['transcript', 'rawExcerpt', 'body', 'emailBody', 'text'].includes(k)) return null;
                                return (
                                  <div key={k} className="flex items-start gap-2">
                                    <span className="font-bold text-slate-500 shrink-0">{k}:</span>
                                    <span className="text-slate-800 break-all">
                                      {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                    </span>
                                  </div>
                                );
                              })}
                              {evt.idempotencyKey && (
                                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 truncate">
                                  idempotency: {evt.idempotencyKey}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActivityAndContactTimeline;
