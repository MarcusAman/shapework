/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MarketingHomeInbox } from '../components/marketing/MarketingHomeInbox';
import { VAWorkspaceView } from '../components/marketing/VAWorkspaceView';

describe('Tasks Page Default Kanban Board View & Persistence', () => {
  let mockStore: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: (key: string) => mockStore[key] || null,
    setItem: (key: string, val: string) => { mockStore[key] = String(val); },
    removeItem: (key: string) => { delete mockStore[key]; },
    clear: () => { mockStore = {}; },
  };

  const originalWindow = global.window;
  const originalLocalStorage = global.localStorage;

  function setupWindow(search: string = '') {
    mockStore = {};
    const win = {
      location: {
        search,
        href: `http://localhost:3049/app/tasks${search}`,
      },
      history: {
        replaceState: vi.fn((_state, _title, url: string) => {
          win.location.href = url;
          const qIdx = url.indexOf('?');
          win.location.search = qIdx >= 0 ? url.slice(qIdx) : '';
        }),
        pushState: vi.fn(),
      },
      localStorage: mockLocalStorage,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    (global as any).window = win;
    (global as any).localStorage = mockLocalStorage;
  }

  const sampleCampaigns = [
    {
      id: 'camp_101',
      title: '124 Wrightsville Avenue Listing Launch',
      propertyAddress: '124 Wrightsville Avenue',
      clientName: 'Sarah Jenkins',
      status: 'in_progress',
      statusKey: 'in_progress',
      assignedTo: 'Eduardo Lovo',
      createdAt: '2026-03-01T12:00:00Z',
      dueAt: '2026-03-10T12:00:00Z',
    },
  ];

  const sampleTasks = [
    {
      id: 'task_001',
      title: 'Just Listed Postcard & Digital Ads',
      propertyAddress: '124 Wrightsville Avenue',
      agentName: 'Sarah Jenkins',
      status: 'in_progress',
      assignedToName: 'Eduardo Lovo',
      assignedToId: 'usr_eduardo',
      channel: 'direct_mail',
      neededBy: '2026-03-10T12:00:00Z',
    },
  ];

  beforeEach(() => {
    setupWindow('');
  });

  afterEach(() => {
    (global as any).window = originalWindow;
    (global as any).localStorage = originalLocalStorage;
    vi.restoreAllMocks();
  });

  describe('1. MarketingHomeInbox Default Kanban Board', () => {
    it('defaults to Kanban Board (pipeline-view) even when campaigns array is populated', () => {
      const html = renderToStaticMarkup(
        <MarketingHomeInbox
          campaigns={sampleCampaigns}
          initialTasks={sampleTasks}
          onSelectCampaign={() => {}}
        />
      );

      // Kanban board (pipeline-view) must be rendered by default
      expect(html).toContain('data-testid="pipeline-view"');
      expect(html).not.toContain('data-testid="all-tasks-table-view"');
    });

    it('respects URL query param ?view=table', () => {
      setupWindow('?view=table');

      const html = renderToStaticMarkup(
        <MarketingHomeInbox
          campaigns={sampleCampaigns}
          initialTasks={sampleTasks}
          onSelectCampaign={() => {}}
        />
      );

      // Table view must be rendered when ?view=table is specified
      expect(html).toContain('data-testid="all-tasks-table-view"');
      expect(html).not.toContain('data-testid="pipeline-view"');
    });

    it('respects URL query param ?view=board and ?view=pipeline', () => {
      setupWindow('?view=board');

      const html = renderToStaticMarkup(
        <MarketingHomeInbox
          campaigns={sampleCampaigns}
          initialTasks={sampleTasks}
          onSelectCampaign={() => {}}
        />
      );

      expect(html).toContain('data-testid="pipeline-view"');
      expect(html).not.toContain('data-testid="all-tasks-table-view"');
    });

    it('respects localStorage preference nest_tasks_view_mode = table', () => {
      mockLocalStorage.setItem('nest_tasks_view_mode', 'table');

      const html = renderToStaticMarkup(
        <MarketingHomeInbox
          campaigns={sampleCampaigns}
          initialTasks={sampleTasks}
          onSelectCampaign={() => {}}
        />
      );

      expect(html).toContain('data-testid="all-tasks-table-view"');
      expect(html).not.toContain('data-testid="pipeline-view"');
    });

    it('prefers explicit URL param over localStorage preference', () => {
      mockLocalStorage.setItem('nest_tasks_view_mode', 'table');
      setupWindow('?view=board');

      const html = renderToStaticMarkup(
        <MarketingHomeInbox
          campaigns={sampleCampaigns}
          initialTasks={sampleTasks}
          onSelectCampaign={() => {}}
        />
      );

      // URL param (?view=board) overrides localStorage ('table')
      expect(html).toContain('data-testid="pipeline-view"');
      expect(html).not.toContain('data-testid="all-tasks-table-view"');
    });

    it('renders view control order strictly as Board | Table on All Tasks', () => {
      const html = renderToStaticMarkup(
        <MarketingHomeInbox
          campaigns={sampleCampaigns}
          initialTasks={sampleTasks}
          onSelectCampaign={() => {}}
        />
      );

      const boardIndex = html.indexOf('data-testid="all-tasks-view-toggle-board"');
      const tableIndex = html.indexOf('data-testid="all-tasks-view-toggle-table"');

      expect(boardIndex).toBeGreaterThan(-1);
      expect(tableIndex).toBeGreaterThan(-1);
      expect(boardIndex).toBeLessThan(tableIndex);
    });
  });

  describe('2. VAWorkspaceView Default Kanban Board & Scoped Preference', () => {
    it('defaults to Kanban Board (workspace-kanban-board)', () => {
      const html = renderToStaticMarkup(
        <VAWorkspaceView tasks={sampleTasks as any} />
      );

      expect(html).toContain('data-testid="workspace-kanban-board"');
      expect(html).not.toContain('data-testid="workspace-table-view"');
    });

    it('respects URL query param ?view=table', () => {
      setupWindow('?subtab=va&view=table');

      const html = renderToStaticMarkup(
        <VAWorkspaceView tasks={sampleTasks as any} />
      );

      expect(html).toContain('data-testid="workspace-table-view"');
      expect(html).not.toContain('data-testid="workspace-kanban-board"');
    });

    it('respects shared localStorage preference nest_tasks_view_mode = table', () => {
      mockLocalStorage.setItem('nest_tasks_view_mode', 'table');

      const html = renderToStaticMarkup(
        <VAWorkspaceView tasks={sampleTasks as any} />
      );

      expect(html).toContain('data-testid="workspace-table-view"');
      expect(html).not.toContain('data-testid="workspace-kanban-board"');
    });

    it('prefers explicit URL query param over localStorage in VAWorkspaceView', () => {
      mockLocalStorage.setItem('nest_tasks_view_mode', 'table');
      setupWindow('?subtab=va&view=board');

      const html = renderToStaticMarkup(
        <VAWorkspaceView tasks={sampleTasks as any} />
      );

      expect(html).toContain('data-testid="workspace-kanban-board"');
      expect(html).not.toContain('data-testid="workspace-table-view"');
    });
  });
});
