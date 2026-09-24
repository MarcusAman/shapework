/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Surface drawer lock #2 / #2.1 / #2.2 — one drawer, two modes (Marcus GO).
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
  /** Lock #2.1 B1 Apple cut — Request / Next / Done when / Blocker above fold */
  showAppleFold: boolean;
  /** Lock #2.1 — Brief & copy / Headline / Remarks / NCREC behind Details ▸ */
  collapseBriefBehindDetails: boolean;
  /** Lock #2.2 — compress Apple fold vertical chrome */
  denseAppleFold: boolean;
  /** Lock #2.2 — work area primary is one photo, not multi-asset gallery */
  showOnePhotoPrimary: boolean;
};

/**
 * Visibility gates for one drawer / two modes.
 * pagerIndex is 0-based; pager shows only when 0 ≤ index < total and total > 1.
 * Lock #2.1: B1 Apple cut — Approve gated on proof; brief collapsed behind Details.
 */
export function resolveSurfaceDrawerGates(opts: {
  shell: SurfaceDrawerShell;
  pagerIndex: number;
  pagerTotal: number;
  task?: SurfaceDrawerTaskLike;
  nextVerb?: string;
  /** Lock #2.1 — hide Approve & Notify until proof exists (no disabled hero). */
  hasProof?: boolean;
}): SurfaceDrawerGates {
  const { shell, pagerIndex, pagerTotal, task, nextVerb, hasProof } = opts;
  const chase = isChasePhotosNext(task || {}, nextVerb);
  const proof = Boolean(hasProof);
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
      showAppleFold: false,
      collapseBriefBehindDetails: false,
      denseAppleFold: false,
      showOnePhotoPrimary: false,
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
      showAppleFold: false,
      collapseBriefBehindDetails: false,
      denseAppleFold: false,
      showOnePhotoPrimary: false,
    };
  }

  // B1 Marketing / Listing / Offer — Apple cut (#2.1) + denser #2.2
  return {
    showPager: pagerOk,
    showUpload: !chase,
    showMaps: true,
    showWorkstationTabs: true,
    // Never Upload + Approve competing when chase photos; hide Approve until proof
    showApproveNotify: !chase && proof,
    showEmailFooter: !chase && proof,
    showBriefAndCopy: true,
    showHeadlineRemarksCopy: true,
    showDealRiskShell: false,
    hideCapsPlaybookDump: true,
    showAppleFold: true,
    collapseBriefBehindDetails: true,
    denseAppleFold: true,
    showOnePhotoPrimary: true,
  };
}


/** Lock #2.1 B1 Apple fold — above-fold contract. */
export type SurfaceAppleFold = {
  request: string;
  next: string;
  doneWhen: string;
  blocker: string | null;
};

export function resolveSurfaceAppleFoldRequest(task: SurfaceDrawerTaskLike): string {
  const deliverable = resolveSurfaceDrawerDeliverableTitle(task);
  const addr = String(task.propertyAddress || '').trim();
  if (addr && !isPlaceholderDrawerAddress(addr)) {
    return `Request ${deliverable} for ${addr}.`;
  }
  return `Request ${deliverable}.`;
}

/**
 * Lock #2.2 — Done when must read as a human acceptance criterion,
 * never a system/status string (no "proof approved", ISO times, "needed by").
 */
export function isSurfaceHumanDoneWhen(text: string): boolean {
  const t = String(text || '').trim();
  if (!t || !/^done when\b/i.test(t)) return false;
  if (/proof approved/i.test(t)) return false;
  if (/\bstatus\b/i.test(t)) return false;
  if (/needed by/i.test(t)) return false;
  if (/T\d{2}:\d{2}:\d{2}/.test(t)) return false;
  if (/delivered to (system|pipeline|queue)/i.test(t)) return false;
  return true;
}

export function resolveSurfaceAppleFoldDoneWhen(task: SurfaceDrawerTaskLike): string {
  const deliverable = resolveSurfaceDrawerDeliverableTitle(task);
  const addr = String(task.propertyAddress || '').trim();
  if (addr && !isPlaceholderDrawerAddress(addr)) {
    return `Done when ${deliverable} for ${addr} looks right and the agent can use it`;
  }
  return `Done when ${deliverable} looks right and the agent can use it`;
}

/** Lock #2.2 — single primary photo for work area (not multi-asset gallery). */
export type SurfacePrimaryPhoto = {
  url: string;
  name: string;
  moreCount: number;
};

export function resolveSurfacePrimaryPhoto(
  task: SurfaceDrawerTaskLike | null | undefined
): SurfacePrimaryPhoto | null {
  if (!task) return null;
  const raw = Array.isArray(task.photos) ? task.photos : [];
  const normalized: Array<{ url: string; name: string }> = [];
  for (let i = 0; i < raw.length; i++) {
    const photo: any = raw[i];
    const url = typeof photo === 'string' ? photo : String(photo?.url || '').trim();
    if (!url) continue;
    const name =
      typeof photo === 'string'
        ? `Photo ${normalized.length + 1}`
        : String(photo?.name || photo?.caption || `Photo ${normalized.length + 1}`);
    normalized.push({ url, name });
  }
  if (normalized.length === 0) return null;
  return {
    url: normalized[0].url,
    name: normalized[0].name,
    moreCount: Math.max(0, normalized.length - 1),
  };
}

export function resolveSurfaceAppleFoldBlocker(task: SurfaceDrawerTaskLike): string | null {
  if (isChasePhotosNext(task)) return 'Waiting on photos';
  const facts = Array.isArray(task.missingFacts) ? task.missingFacts : [];
  for (const raw of facts) {
    const f = String(raw || '').trim();
    if (!f) continue;
    if (/photo/i.test(f)) return 'Waiting on photos';
    if (/mls/i.test(f)) return 'MLS number needed';
    if (/address/i.test(f)) return 'Address needed';
    return f.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  return null;
}

export function resolveSurfaceAppleFold(
  task: SurfaceDrawerTaskLike,
  shell: SurfaceDrawerShell = resolveSurfaceDrawerShell(task)
): SurfaceAppleFold {
  const next = resolveSurfaceDrawerNext(task, shell);
  return {
    request: resolveSurfaceAppleFoldRequest(task),
    next: next.sentence,
    doneWhen: resolveSurfaceAppleFoldDoneWhen(task),
    blocker: resolveSurfaceAppleFoldBlocker(task),
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

/** Lock #2.2 — dense meta badge row: ONE row, TWO zones only (no empty third column). */
export const SURFACE_META_ROW_SPLIT_CLASS = 'surface-meta-row-split';
export const SURFACE_META_ROW_LEFT_CLASS = 'surface-meta-row-left';
export const SURFACE_META_ROW_RIGHT_CLASS = 'surface-meta-row-right';

/**
 * Class hooks for the Mode B dense meta row.
 * LEFT packs start (Event · When · Maps badges); RIGHT packs end (Requester · Assignee · Reviewer).
 */
export function resolveSurfaceMetaRowSplitClasses(): {
  row: string;
  left: string;
  right: string;
} {
  return {
    row: `${SURFACE_META_ROW_SPLIT_CLASS} flex w-full items-center justify-between gap-x-3 gap-y-1 flex-wrap`,
    left: `${SURFACE_META_ROW_LEFT_CLASS} flex flex-wrap items-center gap-1.5 justify-start min-w-0`,
    right: `${SURFACE_META_ROW_RIGHT_CLASS} flex flex-wrap items-center gap-x-2.5 gap-y-0.5 justify-end shrink-0 ml-auto text-[11px] text-slate-600 leading-tight`,
  };
}

