/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * folderSubtasksEnclosureAndSeparation.test.ts (Surface v2)
 * Parent accordion by requestId: address + N subtasks + expand.
 * Children title-only. Enclosure/rail retained; Property Folder dump killed.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { buildLaneListItems } from '../components/marketing/MarketingHomeInbox';
import type { CanonicalMarketingTask } from '../types/marketing';

const root = join(__dirname, '..');

describe('Folder Tasks Enclosure & Separation Logic', () => {
  const mockTasks: CanonicalMarketingTask[] = [
    {
      id: 'task_ogilby_1',
      requestId: 'req_ogilby_119',
      requestTitle: "119 Ogilby's Court",
      propertyAddress: "119 Ogilby's Court, Wilmington, NC 28405",
      title: 'Open House Flyer (8.5x11 PDF)',
      category: 'print_collateral',
      status: 'in_progress',
      assignedTo: 'Eduardo Lovo',
      agentName: 'Jessica Keenan',
      createdAt: '2026-09-23T10:00:00Z',
      updatedAt: '2026-09-23T10:00:00Z',
    } as any,
    {
      id: 'task_ogilby_2',
      requestId: 'req_ogilby_119',
      requestTitle: "119 Ogilby's Court",
      propertyAddress: "119 Ogilby's Court, Wilmington, NC 28405",
      title: 'Social Media Carousel (Instagram Story 9:16)',
      category: 'social_media',
      status: 'in_progress',
      assignedTo: 'Eduardo Lovo',
      agentName: 'Jessica Keenan',
      createdAt: '2026-09-23T10:05:00Z',
      updatedAt: '2026-09-23T10:05:00Z',
    } as any,
    {
      id: 'task_ogilby_3',
      requestId: 'req_ogilby_119',
      requestTitle: "119 Ogilby's Court",
      propertyAddress: "119 Ogilby's Court, Wilmington, NC 28405",
      title: 'Just Listed Postcard (Direct Mail 6x9)',
      category: 'direct_mail',
      status: 'in_progress',
      assignedTo: 'Eduardo Lovo',
      agentName: 'Jessica Keenan',
      createdAt: '2026-09-23T10:10:00Z',
      updatedAt: '2026-09-23T10:10:00Z',
    } as any,
    {
      id: 'task_solo_yard_sign',
      requestId: '',
      requestTitle: 'Yard Sign Post Installation',
      propertyAddress: '804 Carolina Beach Ave N',
      title: 'Yard Sign Post Installation & Lockbox Setup',
      category: 'operations',
      status: 'in_progress',
      assignedTo: 'Eric Knight',
      agentName: 'Eric Knight',
      createdAt: '2026-09-23T10:15:00Z',
      updatedAt: '2026-09-23T10:15:00Z',
    } as any,
  ];

  it('buildLaneListItems collapses folder subtasks when folder accordion is closed', () => {
    const items = buildLaneListItems(mockTasks, { req_ogilby_119: false });
    expect(items).toHaveLength(2);
    expect(items[0].kind).toBe('request');
    if (items[0].kind === 'request') {
      expect(items[0].requestId).toBe('req_ogilby_119');
      expect(items[0].tasks).toHaveLength(3);
    }
    expect(items[1].kind).toBe('task');
    if (items[1].kind === 'task') {
      expect(items[1].task.id).toBe('task_solo_yard_sign');
      expect(items[1].indent).toBe(0);
      expect(items[1].isFirstSubtask).toBe(false);
      expect(items[1].isLastSubtask).toBe(false);
    }
  });

  it('buildLaneListItems expands folder subtasks and correctly flags boundary subtasks', () => {
    const items = buildLaneListItems(mockTasks, { req_ogilby_119: true });
    expect(items).toHaveLength(5);
    expect(items[0].kind).toBe('request');

    const subtask1 = items[1];
    expect(subtask1.kind).toBe('task');
    if (subtask1.kind === 'task') {
      expect(subtask1.task.id).toBe('task_ogilby_1');
      expect(subtask1.indent).toBe(1);
      expect(subtask1.isFirstSubtask).toBe(true);
      expect(subtask1.isLastSubtask).toBe(false);
    }

    const subtask2 = items[2];
    expect(subtask2.kind).toBe('task');
    if (subtask2.kind === 'task') {
      expect(subtask2.task.id).toBe('task_ogilby_2');
      expect(subtask2.indent).toBe(1);
      expect(subtask2.isFirstSubtask).toBe(false);
      expect(subtask2.isLastSubtask).toBe(false);
    }

    const subtask3 = items[3];
    expect(subtask3.kind).toBe('task');
    if (subtask3.kind === 'task') {
      expect(subtask3.task.id).toBe('task_ogilby_3');
      expect(subtask3.indent).toBe(1);
      expect(subtask3.isFirstSubtask).toBe(false);
      expect(subtask3.isLastSubtask).toBe(true);
    }

    const soloTask = items[4];
    expect(soloTask.kind).toBe('task');
    if (soloTask.kind === 'task') {
      expect(soloTask.task.id).toBe('task_solo_yard_sign');
      expect(soloTask.indent).toBe(0);
      expect(soloTask.isFirstSubtask).toBe(false);
      expect(soloTask.isLastSubtask).toBe(false);
    }
  });
});

describe('MarketingHomeInbox Surface v2 parent/child table structure', () => {
  const src = readFileSync(join(root, 'components/marketing/MarketingHomeInbox.tsx'), 'utf8');
  const start = src.indexOf('data-testid="all-tasks-table-view"');
  const end = src.indexOf('data-testid="pipeline-view"', start);
  const tableSrc = src.slice(start, end);

  it('parent row: address + N subtasks + expand; no Property Folder dump', () => {
    expect(tableSrc).toContain('Select all ${reqTasks.length} subtasks in');
    expect(tableSrc).toContain('el.indeterminate = someSubtasksSelected');
    expect(tableSrc).toContain('border-l-4 border-l-[#00635C]');
    expect(tableSrc).toContain('{reqTasks.length} subtask');
    expect(tableSrc).not.toContain('Property Folder');
    expect(tableSrc).not.toContain('Photos needed');
    expect(tableSrc).not.toContain('Included deliverables');
  });

  it('encloses subtask rows with rail + tree connector; title only (no Subtask dump pill)', () => {
    expect(tableSrc).toContain("bg-[#F9FBFA] hover:bg-[#EDF5F1]");
    expect(tableSrc).toContain("border-l-4 border-l-[#00635C]");
    expect(tableSrc).toContain('<CornerDownRight className="w-3.5 h-3.5 text-[#00635C] shrink-0" />');
    expect(tableSrc).not.toMatch(/>\s*Subtask\s*</);
    expect(tableSrc).toContain('{task.title}');
  });

  it('terminates the folder bracket on the last subtask with bottom border and spacing row', () => {
    expect(tableSrc).toContain("isLastSubtask ? 'border-b-2 border-b-[#00635C]/35' : 'border-b border-b-slate-100'");
    expect(tableSrc).toContain('isSubtask && isLastSubtask && (');
    expect(tableSrc).toContain('spacer-end-');
    expect(tableSrc).toContain('className="h-2.5 bg-slate-50/70 border-b border-slate-200"');
  });

  it('leaves standalone tasks on clean white background without emerald rail', () => {
    expect(tableSrc).toContain("'bg-white hover:bg-slate-50/90'");
    expect(tableSrc).toContain("'border-b border-slate-200/80 border-l-4 border-l-transparent'");
  });
});
