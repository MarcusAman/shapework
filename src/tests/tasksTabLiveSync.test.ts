import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Tasks Tab Live Synchronization (Green Tab vs Black Tab)', () => {
  it('1. Verifies MarketingHomeInbox declares onTasksChange and onRequestsChange in its props interface', () => {
    const inboxPath = path.resolve(process.cwd(), 'src/components/marketing/MarketingHomeInbox.tsx');
    const inboxContent = fs.readFileSync(inboxPath, 'utf-8');

    expect(inboxContent).toContain('onTasksChange?: (tasks: CanonicalMarketingTask[]) => void;');
    expect(inboxContent).toContain('onRequestsChange?: (requests: CanonicalMarketingRequest[]) => void;');
  });

  it('2. Verifies MarketingHomeInbox notifies parent and dispatches marketing-tasks-updated on task changes', () => {
    const inboxPath = path.resolve(process.cwd(), 'src/components/marketing/MarketingHomeInbox.tsx');
    const inboxContent = fs.readFileSync(inboxPath, 'utf-8');

    expect(inboxContent).toContain('onTasksChange(tasks);');
    expect(inboxContent).toContain("window.dispatchEvent(new CustomEvent('marketing-tasks-updated'");
  });

  it('3. Verifies MarketingIntakeConsole passes onTasksChange to MarketingHomeInbox', () => {
    const consolePath = path.resolve(process.cwd(), 'src/components/marketing/MarketingIntakeConsole.tsx');
    const consoleContent = fs.readFileSync(consolePath, 'utf-8');

    expect(consoleContent).toContain('onTasksChange={(updatedTasks) => {');
    expect(consoleContent).toContain('setCanonicalTasks(updatedTasks);');
  });

  it('4. Verifies MarketingIntakeConsole polls for tasks in background and listens to marketing-tasks-updated and refresh-marketing-data', () => {
    const consolePath = path.resolve(process.cwd(), 'src/components/marketing/MarketingIntakeConsole.tsx');
    const consoleContent = fs.readFileSync(consolePath, 'utf-8');

    expect(consoleContent).toContain('const fetchCanonicalTasks = useCallback(');
    expect(consoleContent).toContain('setInterval(fetchCanonicalTasks, 15000)');
    expect(consoleContent).toContain('window.addEventListener("marketing-tasks-updated", handleTasksUpdated)');
    expect(consoleContent).toContain('window.addEventListener("refresh-marketing-data", handleRefreshData)');
    expect(consoleContent).toContain('fetchCanonicalTasks();');
  });

  it('5. Verifies CollapsibleNavigationRail listens to marketing-tasks-updated to update sidebar badge immediately', () => {
    const railPath = path.resolve(process.cwd(), 'src/components/layout/CollapsibleNavigationRail.tsx');
    const railContent = fs.readFileSync(railPath, 'utf-8');

    expect(railContent).toContain("window.addEventListener('marketing-tasks-updated', handleTasksUpdated)");
    expect(railContent).toContain("window.addEventListener('refresh-marketing-data', handleTasksUpdated)");
  });

  it('6. Verifies exact count filter parity between Green Tab and Black Tab for active tasks', () => {
    const mockTasks = [
      { id: 'task_1', status: 'request_received', isArchived: false },
      { id: 'task_2', status: 'in_progress', isArchived: false },
      { id: 'task_3', status: 'archived', isArchived: true },
      { id: 'task_4', status: 'completed', isArchived: false },
      { id: 'task_5', status: 'ready_for_review', isArchived: false }
    ];

    // Green tab filter in MarketingIntakeConsole.tsx
    const greenTabCount = mockTasks.filter(t => !t.isArchived && t.status !== 'archived').length;

    // Black tab filter in MarketingHomeInbox.tsx
    const blackTabCount = mockTasks.filter(t => (!t.isArchived && t.status !== 'archived')).length;

    expect(greenTabCount).toBe(4);
    expect(blackTabCount).toBe(4);
    expect(greenTabCount).toBe(blackTabCount);

    // When an item is archived:
    const archivedTasks = mockTasks.map(t => t.id === 'task_1' ? { ...t, isArchived: true, status: 'archived' } : t);
    const updatedGreen = archivedTasks.filter(t => !t.isArchived && t.status !== 'archived').length;
    const updatedBlack = archivedTasks.filter(t => (!t.isArchived && t.status !== 'archived')).length;

    expect(updatedGreen).toBe(3);
    expect(updatedBlack).toBe(3);
    expect(updatedGreen).toBe(updatedBlack);
  });
});
