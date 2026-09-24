/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * folderSubtasksEnclosureAndSeparation.test.ts
 * Verifies that folder tasks (parent requests containing subtasks) are visually enclosed
 * and clearly divided from individual standalone tasks in the Tasks & Operations table view.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { buildLaneListItems, type LaneListItem } from '../components/marketing/MarketingHomeInbox';
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
      requestId: '', // standalone task without parent request folder
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
    
    // Expect 1 folder item (collapsed) and 1 standalone task item
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

    // Expect 1 folder item + 3 subtasks + 1 standalone task = 5 items total
    expect(items).toHaveLength(5);
    expect(items[0].kind).toBe('request');

    // First subtask
    const subtask1 = items[1];
    expect(subtask1.kind).toBe('task');
    if (subtask1.kind === 'task') {
      expect(subtask1.task.id).toBe('task_ogilby_1');
      expect(subtask1.indent).toBe(1);
      expect(subtask1.isFirstSubtask).toBe(true);
      expect(subtask1.isLastSubtask).toBe(false);
    }

    // Middle subtask
    const subtask2 = items[2];
    expect(subtask2.kind).toBe('task');
    if (subtask2.kind === 'task') {
      expect(subtask2.task.id).toBe('task_ogilby_2');
      expect(subtask2.indent).toBe(1);
      expect(subtask2.isFirstSubtask).toBe(false);
      expect(subtask2.isLastSubtask).toBe(false);
    }

    // Last subtask terminating the enclosure
    const subtask3 = items[3];
    expect(subtask3.kind).toBe('task');
    if (subtask3.kind === 'task') {
      expect(subtask3.task.id).toBe('task_ogilby_3');
      expect(subtask3.indent).toBe(1);
      expect(subtask3.isFirstSubtask).toBe(false);
      expect(subtask3.isLastSubtask).toBe(true);
    }

    // Standalone task
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

describe('MarketingHomeInbox Template Visual Bracket & Enclosure Structure', () => {
  const src = readFileSync(join(root, 'components/marketing/MarketingHomeInbox.tsx'), 'utf8');

  it('renders parent folder row with dedicated checkbox and emerald left rail bracket', () => {
    // Parent folder checkbox
    expect(src).toContain('Select all ${reqTasks.length} subtasks in');
    expect(src).toContain('el.indeterminate = someSubtasksSelected');
    expect(src).toContain('border-l-4 border-l-[#00635C]');
    
    // Property Folder badge and subtask count badge
    expect(src).toContain('Property Folder');
    expect(src).toContain('{reqTasks.length} subtask');
  });

  it('encloses subtask rows in emerald tint, left rail, and tree branch connector', () => {
    // Enclosure background and left rail
    expect(src).toContain("bg-[#F9FBFA] hover:bg-[#EDF5F1]");
    expect(src).toContain("border-l-4 border-l-[#00635C]");

    // CornerDownRight tree branch connector icon
    expect(src).toContain('<CornerDownRight className="w-3.5 h-3.5 text-[#00635C] shrink-0" />');
    
    // Subtask pill badge
    expect(src).toContain('Subtask');
  });

  it('terminates the folder bracket on the last subtask with bottom border and spacing row', () => {
    // Closing bottom border bracket on last subtask
    expect(src).toContain("isLastSubtask ? 'border-b-2 border-b-[#00635C]/35' : 'border-b border-b-slate-100'");

    // Visual divider / spacing row separating folder group from subsequent tasks
    expect(src).toContain('isSubtask && isLastSubtask && (');
    expect(src).toContain('spacer-end-');
    expect(src).toContain('className="h-2.5 bg-slate-50/70 border-b border-slate-200"');
  });

  it('leaves standalone tasks on clean white background without emerald rail', () => {
    // Standalone tasks have neutral border and background
    expect(src).toContain("'bg-white hover:bg-slate-50/90'");
    expect(src).toContain("'border-b border-slate-200/80 border-l-4 border-l-transparent'");
  });
});
