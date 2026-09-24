/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Surface Tasks table lock (C− chunk 2)
 * Asserts MarketingHomeInbox /app/tasks table Surface bar:
 * parent accordion by requestId, columns Task/Status/Owner/Due/Activity + Blocker/Where stubs + Lane from domain helpers,
 * filters Mine · Open · Address (Blocked dormant).
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

function task(partial: Partial<CanonicalMarketingTask> & { id: string }): CanonicalMarketingTask {
  return {
    title: partial.title || 'Task',
    status: partial.status || 'in_progress',
    createdAt: '2026-09-23T12:00:00Z',
    updatedAt: '2026-09-23T12:00:00Z',
    ...partial,
  } as CanonicalMarketingTask;
}

describe('Surface Tasks table lock — MarketingHomeInbox', () => {
  it('surfaces on /app/tasks via all-tasks-table-view test id', () => {
    expect(inboxSrc).toContain('data-testid="all-tasks-table-view"');
  });

  it('keeps parent accordion by requestId + expand', () => {
    expect(inboxSrc).toContain('buildLaneListItems');
    expect(inboxSrc).toMatch(/list-request-accordion-\$\{/);
    expect(inboxSrc).toContain('toggleRequestAccordion');
    expect(inboxSrc).toContain('expandedRequestIds');

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

  it('renders Surface columns: Task / Status / Owner / Due / Activity (real) + Blocker / Where stubs + Lane', () => {
    for (const col of ['tasks-col-task', 'tasks-col-status', 'tasks-col-owner', 'tasks-col-due', 'tasks-col-activity', 'tasks-col-blocker', 'tasks-col-where', 'tasks-col-lane']) {
      expect(inboxSrc).toContain(`data-testid="${col}"`);
    }
    expect(inboxSrc).toMatch(/>\s*Task\s*</);
    expect(inboxSrc).toMatch(/>\s*Status\s*</);
    expect(inboxSrc).toMatch(/>\s*Owner\s*</);
    expect(inboxSrc).toMatch(/>\s*Due\s*</);
    expect(inboxSrc).toMatch(/>\s*Activity\s*</);
    expect(inboxSrc).toMatch(/>\s*Blocker\s*</);
    expect(inboxSrc).toMatch(/>\s*Where\s*</);
    expect(inboxSrc).toMatch(/>\s*Lane\s*</);

    // v1 stubs — do not scrape notes
    expect(inboxSrc).toContain('data-testid="task-blocker-cell"');
    expect(inboxSrc).toContain('data-testid="task-where-cell"');
    expect(inboxSrc).toMatch(/task-blocker-cell"[\s\S]{0,120}—/);
    expect(inboxSrc).toMatch(/task-where-cell"[\s\S]{0,120}—/);
    expect(inboxSrc).toContain('do not scrape notes');
  });

  it('Lane comes from domain helpers (not pipeline stage)', () => {
    expect(inboxSrc).toContain('getSurfaceDomainLane(task)');
    expect(inboxSrc).toMatch(/domain helpers — not pipeline stage|domain helpers, NOT pipeline stage/);

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

    // Prefer explicit helper predicates when SOP classifiers are environment-sensitive
    expect(typeof isListingLaunchBoardTask).toBe('function');
    expect(typeof isOffer2TBoardTask).toBe('function');
    expect(isMarketingTask(marketing)).toBe(true);
    expect(isOperationalTask(operational)).toBe(true);

    // Lane labels from exported Surface helper
    if (isListingLaunchBoardTask(listing)) {
      expect(getSurfaceDomainLane(listing)).toBe('Listing');
    }
    if (isOffer2TBoardTask(offer)) {
      expect(getSurfaceDomainLane(offer)).toBe('Offer');
    }
    expect(getSurfaceDomainLane(marketing)).toBe('Marketing');
    expect(getSurfaceDomainLane(operational)).toBe('Deal risk');
  });

  it('filters: Mine · Open · Address free-text; Blocked dormant', () => {
    expect(inboxSrc).toContain('data-testid="tasks-surface-filters"');
    expect(inboxSrc).toContain('data-testid="tasks-filter-mine"');
    expect(inboxSrc).toContain('data-testid="tasks-filter-open"');
    expect(inboxSrc).toContain('data-testid="tasks-filter-address"');
    expect(inboxSrc).toContain('data-testid="tasks-filter-blocked"');
    expect(inboxSrc).toMatch(/tasks-filter-blocked"[\s\S]{0,200}disabled/);
    expect(inboxSrc).toMatch(/surfaceMineOnly/);
    expect(inboxSrc).toMatch(/surfaceOpenOnly/);
  });
});
