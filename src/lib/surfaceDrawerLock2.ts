/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Surface drawer lock #2 — one drawer, two modes (Marcus GO).
 * Mode A: triage / unrouted / low confidence
 * Mode B: routed shells (B1 creative · B2 deal risk · B3 ops)
 */

import { isListingLaunchTask } from './listingLaunchSop';
import { isOffer2TTask } from './offer2tSop';
import { getDealTriageFromTask } from './dealTriage';
import { isMarketingCreativeTask } from './creativeRequestTriage';

export type SurfaceDrawerShell = 'A_triage' | 'B1_creative' | 'B2_deal_risk' | 'B3_ops';

/** Loose task shape — accepts WorkspaceDrawerTask / CanonicalMarketingTask fields. */
export type SurfaceDrawerTaskLike = {
  id?: string;
  title?: string;
  packageType?: string;
  propertyAddress?: string;
  status?: string;
  routingState?: string;
  routingReasons?: string[];
  triageReason?: string;
  classificationConfidence?: number;
  channel?: string;
  category?: string;
  departmentId?: string;
  deliverableType?: string;
  governingSopId?: string;
  notes?: string;
  missingFacts?: string[];
  photos?: unknown[];
  dueAt?: string;
  neededByDate?: string;
  targetSla?: string;
  [key: string]: unknown;
};

export const SURFACE_DRAWER_TRIAGE_BODY =
  "We're not sure which lane — pick one";

export const SURFACE_DRAWER_CONFIRM_ROUTING_LABEL = 'Confirm routing';

export const SURFACE_DRAWER_NEEDS_TRIAGE_CHIP = 'Needs triage';

/** Placeholder / pending addresses must never be Mode A H1. */
export function isPlaceholderDrawerAddress(address?: string | null): boolean {
  if (!address || !String(address).trim()) return true;
  const clean = String(address).trim().toLowerCase();
  return (
    clean === 'address pending' ||
    clean === 'address needed' ||
    clean === 'tbd' ||
    clean === 'unknown' ||
    clean.includes('address pending') ||
    clean.includes('address needed') ||
    clean.includes('[address needed]') ||
    clean.includes('address tbd') ||
    clean.includes('new listing (address pending)') ||
    clean.includes('wilmington nc area listing') ||
    clean.includes('inbound phone request')
  );
}

export function isSurfaceDrawerTriageTask(task: SurfaceDrawerTaskLike | null | undefined): boolean {
  if (!task) return false;
  if (String(task.status || '').toLowerCase() === 'triage') return true;
  if (task.routingState === 'triage_required') return true;
  const reasons = Array.isArray(task.routingReasons) ? task.routingReasons : [];
  if (reasons.some((r) => String(r).includes('LOW_CLASSIFICATION_CONFIDENCE'))) return true;
  if (
    typeof task.classificationConfidence === 'number' &&
    Number.isFinite(task.classificationConfidence) &&
    task.classificationConfidence < 0.55
  ) {
    return true;
  }
  return false;
}

export function resolveSurfaceDrawerDeliverableTitle(task: SurfaceDrawerTaskLike): string {
  const candidates = [task.packageType, task.title, task.deliverableType];
  for (const c of candidates) {
    const raw = String(c || '').trim();
    if (!raw) continue;
    if (isPlaceholderDrawerAddress(raw)) continue;
    if (/^address pending$/i.test(raw)) continue;
    return raw;
  }
  return 'Unrouted request';
}

export function resolveSurfaceDrawerShell(
  task: SurfaceDrawerTaskLike | null | undefined
): SurfaceDrawerShell {
  if (!task || isSurfaceDrawerTriageTask(task)) return 'A_triage';

  if (isListingLaunchTask(task as any) || isOffer2TTask(task as any)) {
    return 'B1_creative';
  }

  const deal = getDealTriageFromTask(task as any);
  if (deal) return 'B2_deal_risk';

  if (isMarketingCreativeTask(task as any)) return 'B1_creative';

  const cat = String(task.category || task.departmentId || task.deliverableType || '').toLowerCase();
  const title = String(task.title || task.packageType || '').toLowerCase();
  const opsHints = [
    'operations',
    'signage',
    'sign',
    'lockbox',
    'facilities',
    'photo',
    'compliance',
    'contract',
    'accounting',
    'escrow',
    'bic',
  ];
  if (opsHints.some((h) => cat.includes(h) || title.includes(h))) {
    return 'B3_ops';
  }

  return 'B1_creative';
}

export function resolveSurfaceDrawerH1(
  task: SurfaceDrawerTaskLike,
  shell: SurfaceDrawerShell = resolveSurfaceDrawerShell(task)
): string {
  if (shell === 'A_triage') {
    const h1 = resolveSurfaceDrawerDeliverableTitle(task);
    if (isPlaceholderDrawerAddress(h1) || /address pending/i.test(h1)) {
      return 'Unrouted request';
    }
    return h1;
  }
  const addr = String(task.propertyAddress || '').trim();
  if (addr && !isPlaceholderDrawerAddress(addr)) return addr;
  return resolveSurfaceDrawerDeliverableTitle(task);
}

export function resolveSurfaceDrawerLaneChip(
  task: SurfaceDrawerTaskLike,
  shell: SurfaceDrawerShell = resolveSurfaceDrawerShell(task)
): string {
  if (shell === 'A_triage') return SURFACE_DRAWER_NEEDS_TRIAGE_CHIP;
  if (shell === 'B2_deal_risk') return 'Deal risk';
  if (shell === 'B3_ops') return 'Ops';
  if (isListingLaunchTask(task as any)) return 'Listing';
  if (isOffer2TTask(task as any)) return 'Offer';
  return 'Marketing';
}

export function isChasePhotosNext(task: SurfaceDrawerTaskLike, nextVerb?: string): boolean {
  const blob = [
    nextVerb,
    task.title,
    task.packageType,
    task.notes,
    task.triageReason,
    ...(task.missingFacts || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return /chase\s+photos|photos?\s+needed|request\s+photos|awaiting\s+photos|need\s+photos/.test(
    blob
  );
}

export function resolveSurfaceDrawerNext(
  task: SurfaceDrawerTaskLike,
  shell: SurfaceDrawerShell = resolveSurfaceDrawerShell(task)
): { sentence: string; verb: string } {
  if (shell === 'A_triage') {
    return {
      sentence: 'Confirm routing to the right lane.',
      verb: SURFACE_DRAWER_CONFIRM_ROUTING_LABEL,
    };
  }
  if (shell === 'B2_deal_risk' || shell === 'B3_ops') {
    return {
      sentence: 'Unblock the file — pick a decision path.',
      verb: 'Unblock',
    };
  }
  if (isChasePhotosNext(task)) {
    return {
      sentence: 'Chase photos from the requester before production.',
      verb: 'Chase photos',
    };
  }
  return {
    sentence: 'Stage the creative next step — upload or open Maxa.',
    verb: 'Upload finished asset',
  };
}

export type SurfaceDrawerGates = {
  showPager: boolean;
  showUpload: boolean;
  showMaps: boolean;
  showWorkstationTabs: boolean;
  showApproveNotify: boolean;
  showEmailFooter: boolean;
  showBriefAndCopy: boolean;
  showHeadlineRemarksCopy: boolean;
  showDealRiskShell: boolean;
  hideCapsPlaybookDump: boolean;
};

/**
 * Visibility gates for one drawer / two modes.
 * pagerIndex is 0-based; pager shows only when 0 ≤ index < total and total > 1.
 */
export function resolveSurfaceDrawerGates(opts: {
  shell: SurfaceDrawerShell;
  pagerIndex: number;
  pagerTotal: number;
  task?: SurfaceDrawerTaskLike;
  nextVerb?: string;
}): SurfaceDrawerGates {
  const { shell, pagerIndex, pagerTotal, task, nextVerb } = opts;
  const chase = isChasePhotosNext(task || {}, nextVerb);
  const pagerOk =
    pagerTotal > 1 && Number.isFinite(pagerIndex) && pagerIndex >= 0 && pagerIndex < pagerTotal;

  if (shell === 'A_triage') {
    return {
      showPager: false,
      showUpload: false,
      showMaps: false,
      showWorkstationTabs: false,
      showApproveNotify: false,
      showEmailFooter: false,
      showBriefAndCopy: false,
      showHeadlineRemarksCopy: false,
      showDealRiskShell: false,
      hideCapsPlaybookDump: true,
    };
  }

  if (shell === 'B2_deal_risk' || shell === 'B3_ops') {
    return {
      showPager: pagerOk,
      showUpload: false,
      showMaps: true,
      showWorkstationTabs: true,
      showApproveNotify: false,
      showEmailFooter: false,
      showBriefAndCopy: false,
      showHeadlineRemarksCopy: false,
      showDealRiskShell: true,
      hideCapsPlaybookDump: true,
    };
  }

  // B1 Marketing / Listing / Offer
  return {
    showPager: pagerOk,
    showUpload: !chase,
    showMaps: true,
    showWorkstationTabs: true,
    // Never Upload + Approve/Send competing when next is chase photos
    showApproveNotify: !chase,
    showEmailFooter: !chase,
    showBriefAndCopy: true,
    showHeadlineRemarksCopy: true,
    showDealRiskShell: false,
    hideCapsPlaybookDump: true,
  };
}

/** Plain triage body — never leak raw reason codes like LOW_CLASSIFICATION_CONFIDENCE. */
export function resolveSurfaceDrawerTriageBody(task: SurfaceDrawerTaskLike): string {
  void task;
  return SURFACE_DRAWER_TRIAGE_BODY;
}

export function sanitizeTriageReasonForDisplay(raw?: string | null): string {
  if (!raw) return SURFACE_DRAWER_TRIAGE_BODY;
  const cleaned = String(raw)
    .replace(/LOW_CLASSIFICATION_CONFIDENCE/gi, '')
    .replace(/[_-]{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned || /classification.?confidence/i.test(cleaned)) {
    return SURFACE_DRAWER_TRIAGE_BODY;
  }
  return SURFACE_DRAWER_TRIAGE_BODY;
}
