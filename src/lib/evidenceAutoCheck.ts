/**
 * Evidence upload → Nora auto-check (Feature Lab).
 * Metadata / filename / checklist heuristics only.
 * Never auto-approves, auto-signs, or sends email.
 */

export type EvidenceCheckStatus = 'pass' | 'fail' | 'needs_human';

export type EvidenceCheckItem = {
  id: string;
  label: string;
  formHint: string;
  status: EvidenceCheckStatus;
  cite: string;
};

export type EvidenceAutoCheckResult = {
  packageKind: 'listing_launch' | 'offer_2t' | 'unknown';
  items: EvidenceCheckItem[];
  passCount: number;
  failCount: number;
  needsHumanCount: number;
  summary: string;
  /** Never true — Feature Lab won't */
  autoApproved: false;
};

export type EvidenceAssetLike = {
  fileName?: string;
  deliverableName?: string;
  mimeType?: string;
  label?: string;
};

const LISTING_EXPECTATIONS: Array<{ id: string; label: string; formHint: string; patterns: RegExp[] }> = [
  {
    id: 'form_101',
    label: 'Exclusive Right to Sell (Form 101)',
    formHint: 'NC_REALTORS_FORM_101',
    patterns: [/101/, /exclusive\s*right/, /listing\s*agreement/, /erts/i],
  },
  {
    id: 'wwrea',
    label: 'WWREA acknowledgment',
    formHint: 'NCREC_WWREA',
    patterns: [/wwrea/, /working\s*with\s*real\s*estate/, /agency\s*disc/],
  },
  {
    id: 'form_140',
    label: 'RPOADS / Form 140 disclosures',
    formHint: 'NC_REALTORS_FORM_140',
    patterns: [/140/, /rpoads/, /disclosure/, /owners?\s*association/],
  },
];

const OFFER_EXPECTATIONS: Array<{ id: string; label: string; formHint: string; patterns: RegExp[] }> = [
  {
    id: 'form_2t',
    label: 'Form 2-T offer draft',
    formHint: 'FORM_2T',
    patterns: [/2-?t/, /offer/, /purchase\s*contract/, /contract\s*to\s*purchase/],
  },
  {
    id: 'wwrea_buyer',
    label: 'WWREA / buyer agency',
    formHint: 'NCREC_WWREA',
    patterns: [/wwrea/, /buyer\s*agency/, /working\s*with\s*real\s*estate/],
  },
  {
    id: 'emd_proof',
    label: 'Earnest money / EMD note',
    formHint: 'EMD',
    patterns: [/emd/, /earnest/, /trust\s*deposit/, /escrow/],
  },
];

function haystack(assets: EvidenceAssetLike[]): string {
  return assets
    .map((a) => [a.fileName, a.deliverableName, a.label, a.mimeType].filter(Boolean).join(' '))
    .join(' \n ')
    .toLowerCase();
}

function matchExpectation(
  hay: string,
  patterns: RegExp[]
): EvidenceCheckStatus {
  if (!hay.trim()) return 'fail';
  const hit = patterns.some((p) => p.test(hay));
  if (hit) return 'pass';
  // PDFs present but not named — needs human eyes
  if (hay.includes('pdf') || hay.includes('application/pdf')) return 'needs_human';
  return 'fail';
}

export function detectPackageKind(task: {
  category?: string;
  packageType?: string;
  title?: string;
  sopId?: string;
  governingSopId?: string;
  domain?: string;
}): 'listing_launch' | 'offer_2t' | 'unknown' {
  const blob = [
    task.category,
    task.packageType,
    task.title,
    task.sopId,
    task.governingSopId,
    task.domain,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (/offer|2-?t|form\s*2/.test(blob) || blob.includes('sop_offer_2t')) return 'offer_2t';
  if (/listing\s*launch|listing_launch|sop_listing_launch/.test(blob)) return 'listing_launch';
  return 'unknown';
}

export function runEvidenceAutoCheck(opts: {
  task: {
    category?: string;
    packageType?: string;
    title?: string;
    sopId?: string;
    governingSopId?: string;
    domain?: string;
  };
  assets: EvidenceAssetLike[];
}): EvidenceAutoCheckResult {
  const packageKind = detectPackageKind(opts.task);
  const hay = haystack(opts.assets);
  // Marketing flyer/social/ops: do NOT show listing/offer form evidence (101 / WWREA / 2-T).
  if (packageKind === 'unknown') {
    return {
      packageKind,
      items: [],
      passCount: 0,
      failCount: 0,
      needsHumanCount: 0,
      summary: 'Evidence auto-check applies to listing launch and offer packages only.',
      autoApproved: false as const,
    };
  }
  const expectations =
    packageKind === 'offer_2t' ? OFFER_EXPECTATIONS : LISTING_EXPECTATIONS;

  const items: EvidenceCheckItem[] = expectations.map((e) => {
    const status = matchExpectation(hay, e.patterns);
    const cite =
      status === 'pass'
        ? `Matched upload name/label to ${e.formHint}`
        : status === 'needs_human'
          ? `Upload present but not clearly labeled as ${e.label} — Melissa/TC should confirm`
          : `Missing evidence for ${e.label} (${e.formHint})`;
    return {
      id: e.id,
      label: e.label,
      formHint: e.formHint,
      status,
      cite,
    };
  });

  if (opts.assets.length === 0) {
    for (const item of items) {
      item.status = 'fail';
      item.cite = `No proof uploaded yet for ${item.label}`;
    }
  }

  const passCount = items.filter((i) => i.status === 'pass').length;
  const failCount = items.filter((i) => i.status === 'fail').length;
  const needsHumanCount = items.filter((i) => i.status === 'needs_human').length;

  const summary =
    opts.assets.length === 0
      ? 'No proof uploaded — all package evidence checks failed.'
      : failCount === 0 && needsHumanCount === 0
        ? `Nora check: all ${passCount} expected package items look present by filename/label. Human still confirms before approve.`
        : `Nora check: ${passCount} pass, ${failCount} missing, ${needsHumanCount} need human eyes. Not auto-approved.`;

  return {
    packageKind,
    items,
    passCount,
    failCount,
    needsHumanCount,
    summary,
    autoApproved: false,
  };
}

/** Map auto-check into requirement statuses (additive; never auto-publishes). */
export function requirementStatusFromEvidence(
  status: EvidenceCheckStatus
): 'verified' | 'needs_correction' | 'not_reviewed' {
  if (status === 'pass') return 'not_reviewed'; // still needs human verify — Feature Lab won't auto-approve
  if (status === 'fail') return 'needs_correction';
  return 'not_reviewed';
}
