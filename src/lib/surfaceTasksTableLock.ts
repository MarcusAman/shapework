/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Surface Tasks table lock v3 — parent #, child type chips, Activity relative+tooltip,
 * Received column, requester muted under Task (Marcus/Conductor GO).
 * Leave group-by-Lane (#2.1) and drawer #2.2 alone.
 */

export type SurfaceTableTypeChip = {
  label: string;
  bg: string;
  text: string;
};

/** Category → chip styles (mirrors inbox CATEGORY_LABELS + common aliases). */
export const SURFACE_TABLE_TYPE_CHIPS: Record<string, SurfaceTableTypeChip> = {
  farming: { label: 'Farming', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  listing_launch: { label: 'Listing Launch', bg: 'bg-blue-100', text: 'text-blue-800' },
  offer_2t: { label: 'Offer / 2-T', bg: 'bg-teal-100', text: 'text-teal-800' },
  open_house: { label: 'Open House', bg: 'bg-purple-100', text: 'text-purple-800' },
  social: { label: 'Social', bg: 'bg-pink-100', text: 'text-pink-800' },
  signage: { label: 'Signage', bg: 'bg-amber-100', text: 'text-amber-800' },
  print: { label: 'Print Flyer', bg: 'bg-indigo-100', text: 'text-indigo-800' },
  mailer: { label: 'Direct Mailer', bg: 'bg-cyan-100', text: 'text-cyan-800' },
  direct_mail: { label: 'Direct Mailer', bg: 'bg-cyan-100', text: 'text-cyan-800' },
  operations: { label: 'Operations', bg: 'bg-orange-100', text: 'text-orange-800' },
  other: { label: 'Custom', bg: 'bg-slate-100', text: 'text-slate-800' },
};

export type SurfaceTableRowNumberItem =
  | { kind: 'lane' }
  | { kind: 'request'; requestId: string }
  | { kind: 'task'; indent?: number; task: { id: string } };

/**
 * Sequential # for address parent rows + standalone (indent 0) task rows.
 * Child subtasks (indent > 0) and lane headers get no number.
 */
export function assignSurfaceTableParentRowNumbers(
  items: SurfaceTableRowNumberItem[]
): Map<string, number> {
  const map = new Map<string, number>();
  let n = 0;
  for (const item of items) {
    if (item.kind === 'lane') continue;
    if (item.kind === 'request') {
      n += 1;
      map.set(`request:${item.requestId}`, n);
      continue;
    }
    if (item.kind === 'task' && (item.indent ?? 0) === 0 && item.task?.id) {
      n += 1;
      map.set(`task:${item.task.id}`, n);
    }
  }
  return map;
}

export function surfaceTableParentNumberKey(
  item: SurfaceTableRowNumberItem
): string | null {
  if (item.kind === 'request') return `request:${item.requestId}`;
  if (item.kind === 'task' && (item.indent ?? 0) === 0 && item.task?.id) {
    return `task:${item.task.id}`;
  }
  return null;
}

/** Type chip for child rows only — null when missing/unknown category. */
export function resolveSurfaceTableTypeChip(
  category?: string | null
): SurfaceTableTypeChip | null {
  if (!category || !String(category).trim()) return null;
  const key = String(category).trim().toLowerCase();
  if (SURFACE_TABLE_TYPE_CHIPS[key]) return SURFACE_TABLE_TYPE_CHIPS[key];
  // Humanize unknown categories without inventing domain chrome
  const label = key
    .split(/[_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  if (!label) return null;
  return { label, bg: 'bg-slate-100', text: 'text-slate-700' };
}

export function looksLikeIsoTimestamp(value?: string | null): boolean {
  if (!value || typeof value !== 'string') return false;
  const ms = Date.parse(value);
  return !Number.isNaN(ms) && /\d{4}-\d{2}-\d{2}/.test(value);
}

/** Activity cell: relative time (e.g. "14m ago"). */
export function formatSurfaceTableActivityRelative(
  iso?: string | null,
  nowTimestamp = Date.now()
): string {
  if (!iso) return '—';
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return '—';
    const diffMs = nowTimestamp - date.getTime();
    if (diffMs < 0) return 'just now';
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'America/New_York',
    });
  } catch {
    return '—';
  }
}

/** Activity hover/tooltip: full America/New_York timestamp. */
export function formatSurfaceTableActivityTooltip(iso?: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return formatter.format(d);
  } catch {
    return '';
  }
}

/** Received column display (compact eastern date/time). */
export function formatSurfaceTableReceived(iso?: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return formatter.format(d);
  } catch {
    return '—';
  }
}

/** Requester muted line under Task title. */
export function resolveSurfaceTableRequesterName(task: {
  agentName?: string | null;
  requestedByName?: string | null;
  requesterName?: string | null;
  [key: string]: unknown;
} | null | undefined): string | null {
  if (!task) return null;
  const candidates = [
    (task as any).requestedByName,
    (task as any).requesterName,
    task.agentName,
  ];
  for (const raw of candidates) {
    const name = String(raw || '').trim();
    if (!name) continue;
    if (/^agent$/i.test(name)) continue;
    if (/requester not identified/i.test(name)) continue;
    if (/listing broker/i.test(name)) continue;
    return name;
  }
  return null;
}
