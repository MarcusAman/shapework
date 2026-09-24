/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Surface Tasks table lock v2 + v3 (supersedes v1)
 * Asserts MarketingHomeInbox /app/tasks table (all-tasks-table-view):
 * - Kill: status group bands, multi-status chrome, category domain pills, task-cell dump
 * - Parent by requestId: address + N subtasks + expand; children title-only
 * - Cols L→R: Task · Status · Owner · Due · Blocker · Where · Lane · Activity
 * - Toolbar one row: Mine · Open · Blocked · Address · Board|Table
 * - One filtered-set count everywhere
 * v3: # on parent only · type chips on child · Activity relative+tooltip ·
 *     Received column · requester muted under Task (group-by-Lane #2.1 preserved)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  buildLaneListItems,
  buildSurfaceTableListItems,
  getSurfaceDomainLane,
  isListingLaunchBoardTask,
  isOffer2TBoardTask,
  isMarketingTask,
  isOperationalTask,
  SURFACE_DOMAIN_LANE_ORDER,
  SURFACE_TABLE_GROUP_BY_ADDRESS_LABEL,
  SURFACE_TABLE_GROUP_BY_LANE_LABEL,
} from '../components/marketing/MarketingHomeInbox';
import type { CanonicalMarketingTask } from '../types/marketing';
import {
  assignSurfaceTableParentRowNumbers,
  formatSurfaceTableActivityRelative,
  formatSurfaceTableActivityTooltip,
  formatSurfaceTableReceived,
  resolveSurfaceTableRequesterName,
  resolveSurfaceTableTypeChip,
  surfaceTableParentNumberKey,
} from '../lib/surfaceTasksTableLock';

const root = join(__dirname, '..');
const inboxSrc = readFileSync(join(root, 'components/marketing/MarketingHomeInbox.tsx'), 'utf8');

/** Slice only the table view JSX so kills are scoped to all-tasks-table-view. */
function tableViewSlice(src: string): string {
  const start = src.indexOf('data-testid="all-tasks-table-view"');
  expect(start).toBeGreaterThan(-1);
  const endMarker = 'data-testid="pipeline-view"';
  const end = src.indexOf(endMarker, start);
  expect(end).toBeGreaterThan(start);
  return src.slice(start, end);
}

function task(partial: Partial<CanonicalMarketingTask> & { id: string }): CanonicalMarketingTask {
  return {
    title: partial.title || 'Task',
    status: partial.status || 'in_progress',
    createdAt: '2026-09-23T12:00:00Z',
    updatedAt: '2026-09-23T12:00:00Z',
    ...partial,
  } as CanonicalMarketingTask;
}

describe('Surface Tasks table lock v2 — MarketingHomeInbox', () => {
  const tableSrc = tableViewSlice(inboxSrc);

  it('surfaces on /app/tasks via all-tasks-table-view test id', () => {
    expect(inboxSrc).toContain('data-testid="all-tasks-table-view"');
  });

  it('parents by requestId only (address + N subtasks + expand); never groups by pipeline status', () => {
    expect(inboxSrc).toContain('buildLaneListItems');
    expect(inboxSrc).toMatch(/list-request-accordion-\$\{/);
    expect(inboxSrc).toContain('toggleRequestAccordion');
    expect(inboxSrc).toContain('expandedRequestIds');

    // v2: no status-group bands inside table view
    expect(tableSrc).not.toMatch(/list-lane-header-/);
    expect(tableSrc).not.toMatch(/tableLaneGroups\.map/);
    expect(tableSrc).not.toMatch(/INTAKE RECEIVED|Request Received/i);
    // Flat list over filteredTasks via Surface table builder (default address = parent-by-requestId)
    expect(inboxSrc).toMatch(
      /buildSurfaceTableListItems\(\s*filteredTasks\s*,\s*expandedRequestIds\s*,\s*tableGroupMode\s*\)/
    );

    const siblings = [
      task({ id: 'a', requestId: 'req_1', title: 'Flyer' }),
      task({ id: 'b', requestId: 'req_1', title: 'Social' }),
      task({ id: 'c', requestId: '', title: 'Solo' }),
    ];
    const collapsed = buildLaneListItems(siblings, { req_1: false });
    expect(collapsed.map((i) => i.kind)).toEqual(['request', 'task']);
    const expanded = buildLaneListItems(siblings, { req_1: true });
    expect(expanded.map((i) => i.kind)).toEqual(['request', 'task', 'task', 'task']);
  });

  it('kills task-cell dump / Property Folder chrome / multi-status / category pills in table view', () => {
    expect(tableSrc).not.toMatch(/Property Folder/i);
    expect(tableSrc).not.toMatch(/PROPERTY FOLDER/i);
    expect(tableSrc).not.toContain('Photos needed');
    expect(tableSrc).not.toMatch(/Needed \{needed\.label\}|Needed \{neededInfo/);
    expect(tableSrc).not.toContain('Included deliverables');
    // Category domain label dump on children
    expect(tableSrc).not.toMatch(/catInfo\.label/);
    // Multi-status chrome (keep one stage pill only)
    expect(tableSrc).not.toContain('board-maxa-status');
    expect(tableSrc).not.toContain('board-deal-triage');
    expect(tableSrc).not.toContain('formatMaxaBoardStatus');
    expect(tableSrc).not.toContain('formatDealTriageBoardBadge');
  });

  it('children render title only in Task cell (no address/meta secondary line)', () => {
    // Subtask / standalone task cell: title present; secondary address dump gone for subtasks
    expect(tableSrc).toContain('{task.title}');
    // No property address secondary line inside indented children path
    expect(tableSrc).not.toMatch(/isSubtask \? \([\s\S]*?propertyAddress/);
    expect(tableSrc).not.toMatch(/isSubtask \? \([\s\S]*?catInfo/);
  });

  it('column order L→R exact: Task · Status · Owner · Due · Blocker · Where · Lane · Activity', () => {
    const cols = [
      'tasks-col-task',
      'tasks-col-status',
      'tasks-col-owner',
      'tasks-col-due',
      'tasks-col-blocker',
      'tasks-col-where',
      'tasks-col-lane',
      'tasks-col-activity',
    ];
    for (const col of cols) {
      expect(tableSrc).toContain(`data-testid="${col}"`);
    }
    const positions = cols.map((c) => tableSrc.indexOf(`data-testid="${c}"`));
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
    // Stubs until fields exist
    expect(tableSrc).toContain('data-testid="task-blocker-cell"');
    expect(tableSrc).toContain('data-testid="task-where-cell"');
    expect(tableSrc).toMatch(/task-blocker-cell"[\s\S]{0,120}—/);
    expect(tableSrc).toMatch(/task-where-cell"[\s\S]{0,120}—/);
  });

  it('Lane comes from domain helpers (not pipeline stage)', () => {
    expect(inboxSrc).toContain('getSurfaceDomainLane(task)');
    expect(inboxSrc).toMatch(/domain helpers — not pipeline stage|domain helpers, NOT pipeline stage|domain helpers\)/);

    const listing = task({
      id: 'l1',
      title: 'Listing Launch Package',
      category: 'listing_launch',
      governingSopId: 'sop_listing_launch',
    } as any);
    const offer = task({
      id: 'o1',
      title: 'Offer / 2-T Packet',
      category: 'offer_2t',
      governingSopId: 'sop_offer_2t',
    } as any);
    const marketing = task({
      id: 'm1',
      title: 'Just Listed Postcard',
      category: 'direct_mail',
    });
    const operational = task({
      id: 'op1',
      title: 'Sign Post Installation & Lockbox',
      category: 'operations',
    });

    expect(typeof isListingLaunchBoardTask).toBe('function');
    expect(typeof isOffer2TBoardTask).toBe('function');
    expect(isMarketingTask(marketing)).toBe(true);
    expect(isOperationalTask(operational)).toBe(true);

    if (isListingLaunchBoardTask(listing)) {
      expect(getSurfaceDomainLane(listing)).toBe('Listing');
    }
    if (isOffer2TBoardTask(offer)) {
      expect(getSurfaceDomainLane(offer)).toBe('Offer');
    }
    expect(getSurfaceDomainLane(marketing)).toBe('Marketing');
    expect(getSurfaceDomainLane(operational)).toBe('Deal risk');
  });

  it('toolbar one row: Mine · Open · Blocked · Address · Board|Table; no status/category filter rows; Workspace+date hidden', () => {
    expect(inboxSrc).toContain('data-testid="tasks-surface-filters"');
    expect(inboxSrc).toContain('data-testid="tasks-filter-mine"');
    expect(inboxSrc).toContain('data-testid="tasks-filter-open"');
    expect(inboxSrc).toContain('data-testid="tasks-filter-blocked"');
    expect(inboxSrc).toContain('data-testid="tasks-filter-address"');
    expect(inboxSrc).toContain('data-testid="all-tasks-view-switcher"');

    // Blocked is active in toolbar (not dormant/disabled)
    expect(inboxSrc).toMatch(/surfaceBlockedOnly/);
    const blockedIdx = inboxSrc.indexOf('data-testid="tasks-filter-blocked"');
    const blockedChunk = inboxSrc.slice(blockedIdx, blockedIdx + 350);
    expect(blockedChunk).not.toMatch(/\bdisabled\b/);
    expect(blockedChunk).not.toMatch(/dormant/);

    // No status filter row (All Tasks / In Progress / … pills)
    expect(inboxSrc).not.toMatch(/ROW 2: Status Filters/);
    expect(inboxSrc).not.toMatch(/\['All Tasks', 'Unassigned', 'In Progress'/);

    // Workspace + date hidden by default from surface toolbar
    expect(inboxSrc).not.toMatch(/data-testid="team-queue-filter"/);
    expect(inboxSrc).not.toMatch(/<option value="All Team Members">Workspace<\/option>/);
    // Date select should not sit in the surface one-row toolbar area
    const surfaceStart = inboxSrc.indexOf('data-testid="tasks-surface-filters"');
    const viewSwitcher = inboxSrc.indexOf('data-testid="all-tasks-view-switcher"');
    const toolbarSlice = inboxSrc.slice(surfaceStart, viewSwitcher + 200);
    expect(toolbarSlice).not.toMatch(/Filter by Timeframe|All Dates|Past 7 Days/);
  });

  it('Table view: task-domain-pill-tabs absent (no All Tasks/Marketing/Listing/Offer/Operational category row)', () => {
    // Category domain pill row must never sit inside the table branch
    expect(tableSrc).not.toContain('task-domain-pill-tabs');
    expect(tableSrc).not.toContain('task-domain-listing-launch');
    expect(tableSrc).not.toContain('task-domain-offer-2t');

    // Domain pills still exist for Board, but must be gated off when viewMode is table
    const pillIdx = inboxSrc.indexOf('data-testid="task-domain-pill-tabs"');
    expect(pillIdx).toBeGreaterThan(-1);
    const gateWindow = inboxSrc.slice(Math.max(0, pillIdx - 400), pillIdx);
    expect(gateWindow).toMatch(/viewMode\s*!==\s*['"]table['"]/);
  });

  it('one filtered-set count everywhere (no 120/123/119 drift)', () => {
    expect(inboxSrc).toContain('data-testid="tasks-filtered-count"');
    expect(inboxSrc).toMatch(/tasks-filtered-count"[\s\S]{0,120}filteredTasks\.length/);
    // Footer must not mix allTasksCombined / lane-group counts
    expect(tableSrc).not.toMatch(/Showing \{filteredTasks\.length\} of \{allTasksCombined\.length\}/);
    expect(tableSrc).not.toMatch(/tableLaneGroups\.length/);
  });
});

describe('Surface Tasks table lock #2.1 — optional group-by-Lane', () => {
  it('default group mode is parent-by-address (no lane section headers)', () => {
    const siblings = [
      task({ id: 'a', requestId: 'req_1', title: 'Flyer', category: 'direct_mail' }),
      task({ id: 'b', requestId: 'req_1', title: 'Social', category: 'social' }),
      task({
        id: 'op1',
        title: 'Sign Post Installation & Lockbox',
        category: 'operations',
      }),
    ];
    const addressMode = buildSurfaceTableListItems(siblings, { req_1: false }, 'address');
    expect(addressMode.every((i) => i.kind !== 'lane')).toBe(true);
    expect(addressMode.map((i) => i.kind)).toEqual(['request', 'task']);
    // Same shape as buildLaneListItems default
    expect(addressMode.map((i) => i.kind)).toEqual(
      buildLaneListItems(siblings, { req_1: false }).map((i) => i.kind)
    );
  });

  it('Group by Lane sections = Marketing / Listing / Offer / Deal risk (domain helpers)', () => {
    expect(SURFACE_DOMAIN_LANE_ORDER).toEqual([
      'Marketing',
      'Listing',
      'Offer',
      'Deal risk',
    ]);
    expect(SURFACE_TABLE_GROUP_BY_LANE_LABEL).toBe('Group by Lane');
    expect(SURFACE_TABLE_GROUP_BY_ADDRESS_LABEL).toBe('Group by address');

    const mix = [
      task({ id: 'm1', requestId: 'req_m', title: 'Just Listed Postcard', category: 'direct_mail' }),
      task({ id: 'm2', requestId: 'req_m', title: 'Social carousel', category: 'social' }),
      task({
        id: 'l1',
        title: 'Listing Launch Package',
        category: 'listing_launch',
        governingSopId: 'sop_listing_launch',
      } as any),
      task({
        id: 'o1',
        title: 'Offer / 2-T Packet',
        category: 'offer_2t',
        governingSopId: 'sop_offer_2t',
      } as any),
      task({
        id: 'op1',
        title: 'Sign Post Installation & Lockbox',
        category: 'operations',
      }),
    ];
    const laneMode = buildSurfaceTableListItems(mix, { req_m: true }, 'lane');
    const laneHeaders = laneMode.filter((i) => i.kind === 'lane') as Array<{
      kind: 'lane';
      lane: string;
      count: number;
    }>;
    expect(laneHeaders.map((h) => h.lane)).toEqual(
      expect.arrayContaining(['Marketing', 'Deal risk'])
    );
    // Inside Marketing lane: still parent-by-address + expandable children
    const mIdx = laneMode.findIndex(
      (i) => i.kind === 'lane' && (i as any).lane === 'Marketing'
    );
    expect(mIdx).toBeGreaterThanOrEqual(0);
    expect(laneMode[mIdx + 1].kind).toBe('request');
    expect(laneMode[mIdx + 2].kind).toBe('task');
    expect(laneMode[mIdx + 3].kind).toBe('task');
    // No pipeline stage band names
    expect(laneHeaders.every((h) => !/intake|received|in progress/i.test(h.lane))).toBe(true);
  });

  it('MarketingHomeInbox wires Group by Lane | Group by address toggle', () => {
    expect(inboxSrc).toContain('buildSurfaceTableListItems');
    expect(inboxSrc).toContain('tableGroupMode');
    expect(inboxSrc).toContain('SURFACE_TABLE_GROUP_BY_LANE_LABEL');
    expect(inboxSrc).toContain('SURFACE_TABLE_GROUP_BY_ADDRESS_LABEL');
    expect(inboxSrc).toContain('data-testid="tasks-group-by-lane"');
    expect(inboxSrc).toContain('data-testid="tasks-group-by-address"');
    expect(inboxSrc).toContain('list-lane-section-');
    // Default remains address (parent-by-address)
    expect(inboxSrc).toMatch(/useState<SurfaceTableGroupMode>\(['"]address['"]\)/);
  });
});

describe('Surface Tasks table lock v3 — parent #, type chips, Activity, Received, requester', () => {
  const tableSrc = tableViewSlice(inboxSrc);
  const helperSrc = readFileSync(
    join(root, 'lib/surfaceTasksTableLock.ts'),
    'utf8'
  );

  it('# on parent only — row number on address/standalone parents, never on child subtasks', () => {
    expect(helperSrc).toContain('assignSurfaceTableParentRowNumbers');
    expect(inboxSrc).toContain('assignSurfaceTableParentRowNumbers');
    expect(tableSrc).toContain('data-testid="tasks-col-num"');
    expect(tableSrc).toContain('data-testid="tasks-parent-row-num"');

    const siblings = [
      task({ id: 'a', requestId: 'req_1', title: 'Flyer', category: 'direct_mail' }),
      task({ id: 'b', requestId: 'req_1', title: 'Social', category: 'social' }),
      task({ id: 'solo', title: 'Solo task', category: 'print' }),
    ];
    const items = buildSurfaceTableListItems(siblings, { req_1: true }, 'address');
    const nums = assignSurfaceTableParentRowNumbers(items);
    // Parent request + standalone get numbers; children do not
    expect(nums.get('request:req_1')).toBe(1);
    expect(nums.get('task:solo')).toBe(2);
    expect(nums.has('task:a')).toBe(false);
    expect(nums.has('task:b')).toBe(false);
    for (const item of items) {
      if (item.kind === 'task' && item.indent > 0) {
        expect(surfaceTableParentNumberKey(item)).toBeNull();
      }
    }
    // Child rows must not render parent-num testid in the subtask path
    expect(tableSrc).toMatch(/isSubtask[\s\S]{0,80}\?[\s\S]{0,40}null/);
  });

  it('Type chips on child — task-type chip on child rows, not bloating parent accordion', () => {
    expect(inboxSrc).toContain('resolveSurfaceTableTypeChip');
    expect(tableSrc).toContain('data-testid="task-type-chip"');
    // Chip gated to children
    expect(tableSrc).toMatch(/isSubtask[\s\S]{0,500}task-type-chip|task-type-chip[\s\S]{0,500}isSubtask/);
    expect(resolveSurfaceTableTypeChip('social')?.label).toBe('Social');
    expect(resolveSurfaceTableTypeChip('direct_mail')?.label).toBe('Direct Mailer');
    expect(resolveSurfaceTableTypeChip(null)).toBeNull();
    // Parent accordion block must not dump type chips
    const reqIdx = tableSrc.indexOf('list-request-accordion-');
    expect(reqIdx).toBeGreaterThan(-1);
    const reqChunk = tableSrc.slice(reqIdx, reqIdx + 900);
    expect(reqChunk).not.toContain('task-type-chip');
  });

  it('Activity relative + tooltip — relative display; full timestamp on hover', () => {
    expect(inboxSrc).toContain('formatSurfaceTableActivityRelative');
    expect(inboxSrc).toContain('formatSurfaceTableActivityTooltip');
    expect(tableSrc).toContain('task-activity-cell');
    expect(tableSrc).toMatch(
      /formatSurfaceTableActivityTooltip|timestampTooltip/
    );
    const now = Date.parse('2026-09-24T14:00:00Z');
    expect(
      formatSurfaceTableActivityRelative('2026-09-24T13:46:00Z', now)
    ).toBe('14m ago');
    const tip = formatSurfaceTableActivityTooltip('2026-09-24T13:46:00Z');
    expect(tip.length).toBeGreaterThan(8);
    expect(tip).toMatch(/2026|Sep|AM|PM/i);
  });

  it('Received column present', () => {
    expect(tableSrc).toContain('data-testid="tasks-col-received"');
    expect(tableSrc).toContain('data-testid="task-received-cell"');
    expect(inboxSrc).toContain('formatSurfaceTableReceived');
    // Received sits after Lane, before Activity (L→R)
    const lane = tableSrc.indexOf('data-testid="tasks-col-lane"');
    const received = tableSrc.indexOf('data-testid="tasks-col-received"');
    const activity = tableSrc.indexOf('data-testid="tasks-col-activity"');
    expect(received).toBeGreaterThan(lane);
    expect(activity).toBeGreaterThan(received);
    expect(formatSurfaceTableReceived('2026-09-23T12:00:00Z')).not.toBe('—');
    expect(formatSurfaceTableReceived(undefined)).toBe('—');
  });

  it('Requester muted under Task — secondary line under title', () => {
    expect(inboxSrc).toContain('resolveSurfaceTableRequesterName');
    expect(tableSrc).toContain('data-testid="task-requester-muted"');
    expect(resolveSurfaceTableRequesterName({ agentName: 'Ryan Crecelius' })).toBe(
      'Ryan Crecelius'
    );
    expect(resolveSurfaceTableRequesterName({ agentName: 'Agent' })).toBeNull();
    // Must sit under Task title (not parent-only dump)
    expect(tableSrc).toMatch(/task\.title[\s\S]{0,800}task-requester-muted|resolveSurfaceTableRequesterName[\s\S]{0,400}task-requester-muted/);
  });

  it('does not regress group-by-Lane default parent-by-address (#2.1)', () => {
    expect(inboxSrc).toMatch(/useState<SurfaceTableGroupMode>\(['"]address['"]\)/);
    expect(inboxSrc).toContain('buildSurfaceTableListItems');
    const siblings = [
      task({ id: 'a', requestId: 'req_1', title: 'Flyer', category: 'direct_mail' }),
      task({ id: 'b', requestId: 'req_1', title: 'Social', category: 'social' }),
    ];
    expect(
      buildSurfaceTableListItems(siblings, { req_1: false }, 'address').every(
        (i) => i.kind !== 'lane'
      )
    ).toBe(true);
  });
});
