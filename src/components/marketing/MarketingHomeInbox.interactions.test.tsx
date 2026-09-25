/** @vitest-environment happy-dom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./WorkspaceTaskDrawer', () => ({ WorkspaceTaskDrawer: ({ isOpen, activeTask, initialTab, onClose }: any) =>
  isOpen ? <div data-testid="test-drawer" data-task-id={activeTask.id} data-tab={initialTab}><button onClick={onClose}>Close drawer</button></div> : null }));
vi.mock('./TaskQuickActionsModal', () => ({ TaskQuickActionsModal: ({ task, onClose }: any) =>
  task ? <div data-testid="test-quick-actions"><button onClick={onClose}>Close actions</button></div> : null }));
vi.mock('./CompactActivityCardBadge', () => ({ CompactActivityCardBadge: ({ onClick }: any) => <button data-testid="test-activity" onClick={onClick}>Activity</button> }));

import { MarketingHomeInbox, buildSurfaceTableListItems } from './MarketingHomeInbox';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const melissa = { id: 'dir_melissa_gagliardi_33', name: 'Melissa Gagliardi', role: 'marketing_director' };
const eduardo = { id: 'dir_eduardo_lovo_73', name: 'Eduardo Lovo' };
const task = (id: string, overrides: any = {}) => ({ id, requestId: `req_${id}`, title: `Flyer ${id}`, propertyAddress: '123 Main St',
  category: 'print', status: 'request_received', createdAt: '2026-09-25T12:00:00Z', updatedAt: '2026-09-25T12:00:00Z', ...overrides });

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) || null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) });
  window.history.replaceState({}, '', '/');
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ success: false }) })));
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root?.unmount()); host?.remove(); vi.unstubAllGlobals(); });
async function render(tasks: any[], currentUser: any = melissa) {
  await act(async () => { root.render(<MarketingHomeInbox initialTasks={tasks} initialViewMode="table" currentUser={currentUser} onSelectCampaign={() => {}} />); });
}
async function click(element: Element | null) {
  expect(element).not.toBeNull();
  await act(async () => { element!.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
}
const testId = (id: string) => host.querySelector(`[data-testid="${id}"]`);
const taskIds = () => [...host.querySelectorAll('[data-testid^="task-row-"], [data-testid^="subtask-row-"]')]
  .map(row => row.getAttribute('data-testid')!.replace(/^(?:sub)?task-row-/, '')).sort();

describe('Tasks Mine ownership', () => {
  it('shows Eduardo his assigned tasks and excludes work he neither owns nor reviews', async () => {
    await render([
      task('eduardo-assigned', { assignedToId: eduardo.id, reviewOwnerId: melissa.id }),
      task('eduardo-assignee', { assigneeId: eduardo.id, reviewOwnerId: melissa.id }),
      task('melissa-only', { assignedToId: melissa.id, reviewOwnerId: melissa.id }),
    ], eduardo);
    await click(testId('tasks-filter-mine'));
    expect(taskIds()).toEqual(['eduardo-assigned', 'eduardo-assignee']);
  });

  it('includes reviewer Melissa on Eduardo work and both supported assignee ID fields', async () => {
    await render([
      task('review', { assignedTo: eduardo.name, assignedToId: eduardo.id, reviewOwnerId: melissa.id }),
      task('assigned', { assignedToId: melissa.id }),
      task('assignee', { assigneeId: melissa.id }),
      task('other', { assignedTo: eduardo.name, assignedToId: eduardo.id, reviewOwnerId: 'other' }),
    ]);
    await click(testId('tasks-filter-mine'));
    expect(taskIds()).toEqual(['assigned', 'assignee', 'review']);
  });

  it('uses a user ID even when their display name is absent', async () => {
    await render([task('mine', { reviewOwnerId: melissa.id }), task('other', { reviewOwnerId: 'someone_else' })], { id: melissa.id });
    await click(testId('tasks-filter-mine'));
    expect(taskIds()).toEqual(['mine']);
  });

  it('refreshes Mine when only the review owner changes', async () => {
    const before = task('review', { assignedTo: eduardo.name, assignedToId: eduardo.id, reviewOwnerId: 'other' });
    await render([before]); await click(testId('tasks-filter-mine')); expect(taskIds()).toEqual([]);
    await render([{ ...before, reviewOwnerId: melissa.id }]);
    expect(taskIds()).toEqual(['review']);
  });
});

describe('Tasks table row interactions', () => {
  it.each([0, 3, 10])('opens the task drawer from noninteractive cell %i', async (column) => {
    await render([task('row')]);
    await click(testId('task-row-row')!.querySelectorAll('td')[column]);
    expect(testId('test-drawer')?.getAttribute('data-task-id')).toBe('row');
  });

  it('selects a checkbox without opening the drawer', async () => {
    await render([task('row')]);
    const checkbox = testId('task-row-row')!.querySelector('input')!;
    await click(checkbox);
    expect(checkbox.checked).toBe(true); expect(testId('test-drawer')).toBeNull();
  });

  it('opens Quick Actions without opening the drawer', async () => {
    await render([task('row')]);
    await click(testId('task-row-row')!.querySelector('[aria-label="Quick Actions"]'));
    expect(testId('test-quick-actions')).not.toBeNull(); expect(testId('test-drawer')).toBeNull();
  });

  it('keeps the activity button opening the history tab', async () => {
    await render([task('row')]); await click(testId('test-activity'));
    expect(testId('test-drawer')?.getAttribute('data-tab')).toBe('history');
  });
});

describe('Tasks table grouping', () => {
  it('keeps each legacy status separate from intake and orders legacy groups before archived', () => {
    const items = buildSurfaceTableListItems([
      task('legacy_a', { status: 'new' }),
      task('archived', { status: 'archived' }),
      task('legacy_b', { status: 'queued_legacy' }),
      task('intake', { status: 'request_received' }),
      task('legacy_a_again', { status: 'new' }),
      task('production', { status: 'in_progress' }),
    ] as any, {}, 'status');
    const groups = new Map<string, string[]>(); let label = '';
    for (const item of items) {
      if (item.kind === 'group') { label = item.label; groups.set(label, []); }
      if (item.kind === 'task') groups.get(label)!.push(item.task.id);
    }
    expect([...groups.keys()]).toEqual(['Intake Received', 'In Progress', 'Legacy: new', 'Legacy: queued_legacy', 'Archived']);
    expect(Object.fromEntries(groups)).toEqual({
      'Intake Received': ['intake'], 'In Progress': ['production'], 'Legacy: new': ['legacy_a', 'legacy_a_again'],
      'Legacy: queued_legacy': ['legacy_b'], Archived: ['archived'],
    });
  });

  const rows = () => [
    task('intake', { requestId: 'shared', propertyAddress: '123 Main St', status: 'request_received' }),
    task('production', { requestId: 'shared', propertyAddress: '123 Main St', status: 'in_progress', assignedTo: eduardo.name }),
    task('review', { propertyAddress: '456 Oak Ave', status: 'needs_review', reviewState: 'awaiting_review' }),
    task('no_address', { propertyAddress: '', status: 'assigned' }),
    task('same_address', { propertyAddress: '  123 MAIN ST  ', status: 'in_progress' }),
  ];
  function sectionTasks() {
    const groups = new Map<string, string[]>(); let label = '';
    for (const row of host.querySelectorAll('tbody tr')) {
      if (row.hasAttribute('data-group-label')) { label = row.getAttribute('data-group-label')!; groups.set(label, []); }
      const id = row.getAttribute('data-testid')?.match(/^(?:sub)?task-row-(.+)$/)?.[1];
      if (id) groups.get(label)?.push(id);
    }
    return Object.fromEntries([...groups].map(([key, ids]) => [key, ids.sort()]));
  }

  it('groups by status beside Lane and shows siblings once under their own status', async () => {
    await render(rows()); await click(testId('tasks-group-by-status'));
    expect(testId('tasks-group-by-lane')).not.toBeNull(); expect(testId('tasks-group-by-address')).not.toBeNull();
    expect(taskIds()).toEqual(['intake', 'no_address', 'production', 'review', 'same_address']);
    expect(sectionTasks()).toEqual({
      'Intake Received': ['intake'], Assigned: ['no_address'], 'In Progress': ['production', 'same_address'], 'Needs Review': ['review'],
    });
  });

  it('groups by address across request IDs, normalizes whitespace/case, and retains tasks without addresses', async () => {
    await render(rows()); await click(testId('tasks-group-by-address'));
    expect(taskIds()).toEqual(['intake', 'no_address', 'production', 'review', 'same_address']);
    expect(sectionTasks()).toEqual({ '123 Main St': ['intake', 'production', 'same_address'], '456 Oak Ave': ['review'], 'No property address': ['no_address'] });
  });
});
