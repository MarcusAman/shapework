/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Surface Tasks table lock v2 (supersedes v1)
 * Asserts MarketingHomeInbox /app/tasks table (all-tasks-table-view):
 * - Kill: status group bands, multi-status chrome, category domain pills, task-cell dump
 * - Parent by requestId: address + N subtasks + expand; children title-only
 * - Cols L→R: Task · Status · Owner · Due · Blocker · Where · Lane · Activity
 * - Toolbar one row: Mine · Open · Blocked · Address · Board|Table
 * - One filtered-set count everywhere
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  buildLaneListItems,
  getSurfaceDomainLane,
  isListingLaunchBoardTask,
  isOffer2TBoardTask,
  isMarketingTask,
  isOperationalTask,
} from '../components/marketing/MarketingHomeInbox';
import type { CanonicalMarketingTask } from '../types/marketing';

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
    // Flat list over filteredTasks (not pipeline stage groups)
    expect(inboxSrc).toMatch(/buildLaneListItems\(\s*filteredTasks\s*,\s*expandedRequestIds\s*\)/);

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

  it('one filtered-set count everywhere (no 120/123/119 drift)', () => {
    expect(inboxSrc).toContain('data-testid="tasks-filtered-count"');
    expect(inboxSrc).toMatch(/tasks-filtered-count"[\s\S]{0,120}filteredTasks\.length/);
    // Footer must not mix allTasksCombined / lane-group counts
    expect(tableSrc).not.toMatch(/Showing \{filteredTasks\.length\} of \{allTasksCombined\.length\}/);
    expect(tableSrc).not.toMatch(/tableLaneGroups\.length/);
  });
});
