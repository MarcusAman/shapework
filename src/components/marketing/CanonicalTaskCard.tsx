/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CanonicalTaskCard — Shared Compact Apple-inspired Task Card
 * Used across Tasks (MarketingHomeInbox) and Workspace (VAWorkspaceView).
 * 
 * Hierarchy:
 * 1. Street address: Primary headline (15–16px semibold, natural wrap)
 * 2. City/State: Quieter secondary line (12px slate-500)
 * 3. Requested work: Beneath address (13px medium, natural wrap)
 * 4. Middle Section:
 *    - Real thumbnail (~40px) only when actual, valid uploaded photo exists (never placeholder)
 *    - Single photo indicator: neutral "Retrieve photos from MLS" or "Missing photos" (no duplicates!)
 *    - Concise specifications line: "Tri-fold · 55 copies · CopyCat"
 *    - Needed-by date ("Needed Sep 27" / "Needed Today") — no "No deadline" pills
 *    - Copyable MLS number (full digits, stops propagation)
 *    - Consolidated actionable blocker line (non-photo blockers: "Needs Information", etc.)
 *    - No activity preview strips on the card face (full history in drawer)
 * 5. Compact Footer:
 *    - Assignee avatar & name
 *    - Primary action button in Nest green (#00635C)
 *    - Wraps gracefully when necessary
 */

import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Database,
  User,
  UserPlus,
  Eye,
  MoreHorizontal,
  MoreVertical,
  Play,
  Check,
  Building2,
  Folder
} from 'lucide-react';
import { MlsNumberBadge } from './MlsNumberBadge';
import { RequestSourceIcon } from './RequestSourceIcon';
import { CANONICAL_WORKSPACE_ROSTER } from '../../services/canonicalRoster';
import { resolveTaskAssets } from '../../utils/assetResolver';
import { getMarketingReviewHandoff } from '../../lib/marketingReviewHandoff';

export interface CanonicalTaskCardAction {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'amber' | 'purple' | 'emerald';
}

export interface QuickMoveOption {
  id: string;
  title: string;
  dotColor?: string;
  isActive?: boolean;
  onSelect: () => void;
}

export interface CanonicalTaskCardProps {
  task: any;
  parentRequest?: any;
  campaign?: any;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onClick?: () => void;
  onQuickActions?: (e: React.MouseEvent) => void;
  primaryAction?: CanonicalTaskCardAction;
  /** Open / secondary footer action (A/C dual footer). */
  secondaryAction?: CanonicalTaskCardAction;
  quickMoveOptions?: QuickMoveOption[];
  onActivityClick?: (e: React.MouseEvent) => void;
  className?: string;
  context?: 'tasks' | 'workspace';
  dataTestId?: string;
  'data-testid'?: string;
}

export const CanonicalTaskCard: React.FC<CanonicalTaskCardProps> = ({
  task,
  parentRequest,
  campaign,
  isDraggable = false,
  onDragStart,
  onClick,
  onQuickActions,
  primaryAction,
  secondaryAction,
  quickMoveOptions,
  className = '',
  context = 'tasks',
  dataTestId,
  'data-testid': testIdProp,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);

  // 1. Resolve Street Address vs City/State Hierarchy
  const rawPropertyAddress = (
    task.propertyAddress ||
    parentRequest?.propertyAddress ||
    campaign?.propertyAddress ||
    ''
  ).trim();

  const rawTitle = (
    task.title ||
    task.packageType ||
    task.requestTitle ||
    parentRequest?.title ||
    ''
  ).trim();

  let streetAddress = '';
  let cityState = '';

  if (rawPropertyAddress) {
    if (rawPropertyAddress.includes(',')) {
      const parts = rawPropertyAddress.split(',');
      streetAddress = parts[0].trim();
      cityState = parts.slice(1).join(',').trim();
    } else {
      streetAddress = rawPropertyAddress;
    }
  } else {
    // Non-property / operational task
    const officeLocation =
      task.officeLocation ||
      task.location ||
      (task.category === 'office' ? 'Wilmington Office' : '');

    if (officeLocation) {
      streetAddress = officeLocation;
    } else {
      streetAddress = rawTitle || 'Task Request';
    }
  }

  // Secondary line: requested work beneath address
  let secondaryWork = '';
  if (rawPropertyAddress) {
    if (
      rawTitle &&
      rawTitle.toLowerCase() !== rawPropertyAddress.toLowerCase() &&
      rawTitle.toLowerCase() !== streetAddress.toLowerCase()
    ) {
      secondaryWork = rawTitle;
    } else {
      secondaryWork = task.packageType || parentRequest?.title || 'Marketing Request';
    }
  } else {
    secondaryWork = task.category
      ? `${task.category.charAt(0).toUpperCase() + task.category.slice(1)} Task`
      : '';
  }

  // 2. Resolve Valid Photo (Real uploaded thumbnail only, NO placeholders)
  const resolvedAssets = useMemo(() => {
    return resolveTaskAssets(task, parentRequest, campaign);
  }, [task, parentRequest, campaign]);

  const validPhotoUrl = useMemo(() => {
    if (imgFailed) return null;
    return resolvedAssets.heroPhotoUrl || null;
  }, [resolvedAssets, imgFailed]);

  // 3. Photo Requirement & Accurate State
  const cat = (task.category || '').toLowerCase();
  const titleLower = (task.title || '').toLowerCase();
  const domain = String(task.domain || '').toLowerCase();
  const isSopListingLaunch = cat === 'listing_launch' || domain === 'listing_launch' || Boolean(task.listingPackageDraft);
  const isSopOffer2T = cat === 'offer_2t' || domain === 'offer_2t' || Boolean(task.offerPackageDraft);
  const isSopParent = isSopListingLaunch || isSopOffer2T;

  const sopChecklist: Array<{ id?: string; label?: string; done?: boolean }> =
    (isSopListingLaunch
      ? (task.listingPackageDraft?.checklist || task.checklist)
      : isSopOffer2T
        ? (task.offerPackageDraft?.checklist || task.checklist)
        : null) || [];
  const sopDone = sopChecklist.filter((i) => i.done).length;
  const sopTotal = sopChecklist.length;
  const sopNext = sopChecklist.find((i) => !i.done)?.label || null;

  const isVisualMarketing =
    !isSopOffer2T && (
    ['print', 'social', 'open_house', 'farming', 'listing_launch', 'mailer'].includes(cat) ||
    cat === 'marketing' ||
    titleLower.includes('flyer') ||
    titleLower.includes('social') ||
    titleLower.includes('brochure') ||
    titleLower.includes('postcard') ||
    titleLower.includes('marketing'));

  const mlsNumber =
    task.mlsNumber ||
    task.listingDetails?.mlsNumber ||
    parentRequest?.mlsNumber ||
    campaign?.mlsNumber ||
    null;

  const hasRealPhoto = Boolean(validPhotoUrl && !imgFailed);

  // Determine single photo indicator state
  const photoIndicator = useMemo(() => {
    if (hasRealPhoto || !isVisualMarketing || imgFailed) return null;
    if (mlsNumber) return 'mls';
    return 'missing';
  }, [hasRealPhoto, isVisualMarketing, imgFailed, mlsNumber]);

  // 4. Needed-by Date Formatting (No "No deadline" pill!)
  const formattedNeededBy = useMemo(() => {
    const target = task.neededByDate || task.dueAt || task.targetSla || task.dueDate;
    if (!target) return null;

    try {
      if (typeof target === 'string' && target.toLowerCase().includes('today')) {
        return { label: 'Due Today', isUrgent: true, isOverdue: false };
      }
      const d = new Date(target);
      if (isNaN(d.getTime())) {
        return { label: `Needed ${target}`, isUrgent: false, isOverdue: false };
      }

      const now = new Date('2026-08-24T00:00:00Z');
      const targetDate = new Date(d.toISOString().split('T')[0] + 'T00:00:00Z');
      const diffDays = Math.round((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const monthDayStr = targetDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      });

      if (diffDays < 0) {
        return { label: `Overdue (${monthDayStr})`, isUrgent: true, isOverdue: true };
      }
      if (diffDays === 0) {
        return { label: 'Due Today', isUrgent: true, isOverdue: false };
      }
      if (diffDays === 1) {
        return { label: 'Needed Tomorrow', isUrgent: true, isOverdue: false };
      }
      if (diffDays <= 3) {
        return { label: `Due in ${diffDays}d`, isUrgent: false, isOverdue: false };
      }
      return { label: `Needed ${monthDayStr}`, isUrgent: false, isOverdue: false };
    } catch {
      return { label: `Needed ${target}`, isUrgent: false, isOverdue: false };
    }
  }, [task.neededByDate, task.dueAt, task.targetSla, task.dueDate]);

  // 5. One Concise Specifications Line (e.g. "Tri-fold · 55 copies · CopyCat")
  const conciseSpecs = useMemo(() => {
    const parts: string[] = [];

    if (task.printSpecs) {
      if (task.printSpecs.paperStock) parts.push(task.printSpecs.paperStock);
      if (task.printSpecs.quantity) parts.push(`${task.printSpecs.quantity} copies`);
    } else if (task.specifications) {
      parts.push(task.specifications);
    }

    if (task.vendorName) {
      const cleanVendor = task.vendorName.replace(/^Printer:\s*/i, '');
      parts.push(cleanVendor);
    }

    if (parts.length === 0 && task.packageType && task.packageType !== secondaryWork) {
      parts.push(task.packageType);
    }

    if (parts.length === 0 && task.listingDetails) {
      if (task.listingDetails.bedsBaths) parts.push(task.listingDetails.bedsBaths);
      if (task.listingDetails.price) parts.push(task.listingDetails.price);
    }

    return parts.join(' · ');
  }, [task, secondaryWork]);

  // 6. Actionable Blockers (Non-photo blockers only, ensuring ZERO duplication of Missing photos)
  const blockers = useMemo(() => {
    const list: string[] = [];
    if (task.status === 'needs_info') {
      list.push('Needs Information');
    }
    if (task.reviewState === 'revisions_requested' || task.status === 'revisions') {
      list.push('Revisions requested');
    }
    if (task.internalFlags && Array.isArray(task.internalFlags)) {
      task.internalFlags.forEach((f: any) => {
        if (f && f.label && !f.label.toLowerCase().includes('photo')) {
          list.push(f.label);
        }
      });
    }
    if (task.complianceStatus === 'flagged' || task.complianceStatus === 'failed') {
      list.push('Compliance review flagged');
    }
    return list;
  }, [task]);

  const primaryBlocker = useMemo(() => {
    if (blockers.length === 0) return null;
    const first = blockers[0];
    const extraCount = blockers.length - 1;
    if (extraCount > 0) {
      return `${first} (+${extraCount} detail${extraCount > 1 ? 's' : ''})`;
    }
    return first;
  }, [blockers]);

  // 7. Assignee Info
  const reviewHandoff = getMarketingReviewHandoff(task);
  const assigneeName = task.assignedTo || task.assignedToName || 'Unassigned';
  const staffMember = CANONICAL_WORKSPACE_ROSTER.find(
    (m) =>
      m.name.toLowerCase() === assigneeName.toLowerCase() ||
      m.fullName.toLowerCase() === assigneeName.toLowerCase() ||
      m.id === task.assignedToId
  );

  const requesterName =
    task.agentName || parentRequest?.agentName || campaign?.agentName || 'Matt Orr';

  return (
    <div
      data-testid={testIdProp || dataTestId || `canonical-task-card-${task.id}`}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className={`group/card relative bg-white border border-slate-200/90 hover:border-[#00635C]/50 rounded-xl p-3 shadow-2xs hover:shadow-sm transition-all duration-200 text-left cursor-pointer select-none space-y-2.5 ${
        isSopParent ? 'border-l-[3px] border-l-[#01362D]' : ''
      } ${className}`}
    >
      {/* ── TOP METADATA PILLS: DOMAIN, NEEDED-BY, MLS, SINGLE STATUS ── */}
      <div className="flex items-center justify-between gap-1 text-[10px]">
        <div className="flex items-center gap-1 flex-wrap">
          {/* Source Channel Indicator (Phone, Email, Chat, Web) */}
          <RequestSourceIcon
            channel={task.channel || parentRequest?.channel}
            callId={task.callId || (task as any).telephonyCallId}
            id={task.id}
            size="xs"
            variant="subdued"
          />

          {isSopParent && (
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-[#01362D]/8 text-[#01362D] border border-[#01362D]/20"
              data-testid="sop-parent-chip"
            >
              {isSopOffer2T ? 'Offer / 2-T' : 'Listing Launch'}
            </span>
          )}

          {/* Needed-by Date */}
          {formattedNeededBy && (
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                formattedNeededBy.isOverdue
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : formattedNeededBy.isUrgent
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {formattedNeededBy.label}
            </span>
          )}

          {/* Copyable MLS Number */}
          {mlsNumber && (
            <MlsNumberBadge mlsNumber={mlsNumber} size="xs" />
          )}

          {/* Single Photo Indicator (Rendered here only, never duplicated) */}
          {photoIndicator === 'mls' && (
            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-600 bg-slate-50 border border-slate-200/80 px-1.5 py-0.5 rounded">
              <Database className="w-2.5 h-2.5 text-slate-400" />
              <span>Retrieve photos from MLS</span>
            </span>
          )}

          {photoIndicator === 'missing' && (
            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-rose-700 bg-rose-50 border border-rose-200/80 px-1.5 py-0.5 rounded">
              <AlertCircle className="w-2.5 h-2.5 text-rose-500" />
              <span>Missing photos</span>
            </span>
          )}

          {imgFailed && (
            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
              <AlertCircle className="w-2.5 h-2.5 text-slate-400" />
              <span>Preview unavailable</span>
            </span>
          )}
        </div>

        {/* Card Secondary Actions Trigger */}
        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {onQuickActions && (
            <button
              type="button"
              data-testid={`quick-actions-${task.id}`}
              onClick={onQuickActions}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Quick Actions"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          )}

          {quickMoveOptions && quickMoveOptions.length > 0 && (
            <div className="relative">
              <button
                type="button"
                data-testid={`move-btn-${task.id}`}
                onClick={() => setIsMoveOpen(!isMoveOpen)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Move task"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {isMoveOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 text-left animate-fadeIn">
                  <div className="px-2 py-0.5 text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                    Move to:
                  </div>
                  {quickMoveOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      data-testid={`move-to-${opt.id}-${task.id}`}
                      onClick={() => {
                        setIsMoveOpen(false);
                        opt.onSelect();
                      }}
                      className={`w-full px-2 py-1 text-[10px] font-medium text-left transition flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 ${
                        opt.isActive ? 'text-[#00635C] font-bold bg-[#E5EFEA]/40' : 'text-slate-700'
                      }`}
                    >
                      {opt.dotColor && (
                        <span className={`w-1.5 h-1.5 rounded-full ${opt.dotColor}`} />
                      )}
                      <span>{opt.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 1. STREET ADDRESS (15–16px Semibold) & QUIETER CITY/STATE ── */}
      <div className="space-y-0.5">
        <h4 className="text-[15px] sm:text-[16px] font-semibold text-slate-900 leading-snug break-words group-hover/card:text-[#00635C] transition-colors">
          {streetAddress}
        </h4>
        {cityState && (
          <p className="text-[12px] text-slate-500 font-medium break-words leading-tight">
            {cityState}
          </p>
        )}
        {/* ── 2. REQUESTED WORK BENEATH ADDRESS (13px) ── */}
        {secondaryWork && (
          <p className="text-[13px] text-slate-700 font-medium leading-normal break-words pt-0.5">
            {secondaryWork}
          </p>
        )}
        {isSopParent && sopTotal > 0 && (
          <div className="pt-1.5 space-y-1" data-testid="sop-checklist-progress">
            <div className="flex items-center justify-between gap-2 text-[10px]">
              <span className="font-bold text-[#01362D] tabular-nums">
                {sopDone}/{sopTotal}
              </span>
              {sopNext && (
                <span className="truncate text-slate-500 font-medium">Next: {sopNext}</span>
              )}
            </div>
            <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#01362D] transition-all"
                style={{ width: `${Math.round((sopDone / sopTotal) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 3. MIDDLE SECTION: REAL THUMBNAIL (~40px) & CONCISE SPECS ── */}
      <div className="space-y-1.5">
        <div className="flex items-start gap-2.5">
          {/* Real Thumbnail (40px, rendered ONLY when actual uploaded image exists; NO empty boxes) */}
          {hasRealPhoto && (
            <img
              src={validPhotoUrl!}
              alt={streetAddress}
              onError={() => setImgFailed(true)}
              className="w-10 h-10 rounded-lg object-cover border border-slate-200/90 shadow-2xs shrink-0 group-hover/card:ring-1 group-hover/card:ring-[#00635C]/30 transition"
            />
          )}

          <div className="min-w-0 flex-1 space-y-1">
            {/* Requester & Optional Drive Link */}
            <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
              <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded text-[10px] font-medium">
                <User className="w-2.5 h-2.5 text-slate-400" />
                <span className="truncate max-w-[120px]">{requesterName}</span>
              </span>

              {(task.driveFolderUrl || parentRequest?.driveFolderUrl) && (
                <a
                  href={task.driveFolderUrl || parentRequest?.driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[#00635C] hover:text-[#004D47] bg-emerald-50/70 border border-emerald-200/60 px-1.5 py-0.5 rounded text-[10px] font-semibold transition"
                  title="Open Google Drive Pack"
                >
                  <Folder className="w-2.5 h-2.5" />
                  <span>Drive</span>
                </a>
              )}
            </div>

            {/* Concise Specifications Line (e.g. "Tri-fold · 55 copies · CopyCat") */}
            {conciseSpecs && (
              <p className="text-[11px] sm:text-[12px] text-slate-500 font-normal leading-tight break-words">
                {conciseSpecs}
              </p>
            )}
          </div>
        </div>

        {/* ── CONSOLIDATED ACTIONABLE BLOCKER (Non-photo blockers, single line) ── */}
        {primaryBlocker && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-200/80 text-[11px] font-medium text-amber-900 leading-snug">
            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
            <span className="truncate">{primaryBlocker}</span>
          </div>
        )}
      </div>

      {/* ── 4. FOOTER: assignee + A/C action row (Nest #00635C) ── */}
      <div className="pt-2 border-t border-slate-100 flex flex-col gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 min-w-0">
          {reviewHandoff ? (
            <div data-testid="task-review-handoff" className="min-w-0 space-y-0.5">
              <div className="text-[11px] font-semibold text-amber-800">Review: {reviewHandoff.reviewerName}</div>
              <div className="text-[10px] text-slate-500">Producer: {reviewHandoff.producerName}</div>
            </div>
          ) : staffMember ? (
            <div className="flex items-center gap-1.5 truncate">
              <div
                className={`w-4 h-4 rounded-full ${staffMember.color || 'bg-[#00635C]'} text-white font-bold text-[8px] flex items-center justify-center shrink-0 shadow-2xs`}
              >
                {staffMember.avatar || staffMember.displayName.charAt(0)}
              </div>
              <span className="font-semibold text-slate-800 text-[11px] truncate">
                {staffMember.displayName}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-400">
              <div className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                <User className="w-2.5 h-2.5 text-slate-400" />
              </div>
              <span className="font-medium text-[11px] text-slate-500">Unassigned</span>
            </div>
          )}
        </div>

        {secondaryAction && primaryAction ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="grid grid-cols-2 gap-1.5 w-full"
          >
            {(() => {
              const isAssigned = Boolean(staffMember) || (Boolean(assigneeName) && assigneeName !== 'Unassigned');
              // A: unassigned → Assign solid + Open outline
              // C: assigned → Reassign outline + Open solid
              const assignBtn = primaryAction;
              const openBtn = secondaryAction;
              const solid =
                'inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#00635C] hover:bg-[#004D47] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs';
              const outline =
                'inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white hover:bg-slate-50 text-[#00635C] border border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
              const assignClass = isAssigned ? outline : solid;
              const openClass = isAssigned ? solid : outline;
              return (
                <>
                  <button
                    type="button"
                    disabled={assignBtn.disabled}
                    onClick={assignBtn.onClick}
                    className={assignClass}
                  >
                    {assignBtn.icon}
                    <span>{assignBtn.label}</span>
                  </button>
                  <button
                    type="button"
                    disabled={openBtn.disabled}
                    onClick={openBtn.onClick}
                    className={openClass}
                  >
                    {openBtn.icon}
                    <span>{openBtn.label}</span>
                  </button>
                </>
              );
            })()}
          </div>
        ) : primaryAction ? (
          <div onClick={(e) => e.stopPropagation()} className="shrink-0 self-end">
            <button
              type="button"
              disabled={primaryAction.disabled}
              onClick={primaryAction.onClick}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs ${
                primaryAction.variant === 'secondary'
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : primaryAction.variant === 'amber'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : primaryAction.variant === 'purple'
                  ? 'bg-purple-700 hover:bg-purple-800 text-white'
                  : 'bg-[#00635C] hover:bg-[#004D47] text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {primaryAction.icon}
              <span>{primaryAction.label}</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
