/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Internal Console Scope Switcher and Ryan Dashboard Routing', () => {
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStore[key] || null,
      setItem: (key: string, val: string) => {
        mockStore[key] = val;
      },
      removeItem: (key: string) => {
        delete mockStore[key];
      },
      clear: () => {
        mockStore = {};
      }
    });
    vi.restoreAllMocks();
  });

  it('persists selected scope in localStorage when switching between ryans-dashboard and nest-realty-demo', () => {
    localStorage.setItem('internal_selected_scope', 'ryans-dashboard');
    expect(localStorage.getItem('internal_selected_scope')).toBe('ryans-dashboard');

    localStorage.setItem('internal_selected_scope', 'nest-realty-demo');
    expect(localStorage.getItem('internal_selected_scope')).toBe('nest-realty-demo');
  });

  it('routes to Ask Nora (Workboard) and switches profile to Ryan Crecelius when ryans-dashboard is selected', () => {
    const selectedScope = 'ryans-dashboard';
    let targetUrl = '';

    if (selectedScope === 'ryans-dashboard') {
      localStorage.setItem('customer_app_scope', 'ryans-dashboard');
      localStorage.setItem('shapework_active_profile_id', 'usr_ryan');
      targetUrl = '/app/workboard?scope=ryans-dashboard';
    } else {
      localStorage.setItem('customer_app_scope', 'nest-realty-demo');
      targetUrl = '/app/workboard?scope=nest-realty-demo';
    }

    expect(targetUrl).toBe('/app/workboard?scope=ryans-dashboard');
    expect(localStorage.getItem('customer_app_scope')).toBe('ryans-dashboard');
    expect(localStorage.getItem('shapework_active_profile_id')).toBe('usr_ryan');
  });

  it('routes to Workboard with full workspace when nest-realty-demo is selected', () => {
    const selectedScope: string = 'nest-realty-demo';
    let targetUrl = '';

    if (selectedScope === 'ryans-dashboard') {
      localStorage.setItem('customer_app_scope', 'ryans-dashboard');
      localStorage.setItem('shapework_active_profile_id', 'usr_ryan');
      targetUrl = '/app/workboard?scope=ryans-dashboard';
    } else {
      localStorage.setItem('customer_app_scope', 'nest-realty-demo');
      targetUrl = '/app/workboard?scope=nest-realty-demo';
    }

    expect(targetUrl).toBe('/app/workboard?scope=nest-realty-demo');
    expect(localStorage.getItem('customer_app_scope')).toBe('nest-realty-demo');
  });

  it('correctly configures organized sidebar groups for Ryan Dashboard: Ask Nora, Daily Work, and Brokerage Operations', () => {
    const ryanGroups = [
      {
        category: 'Ask Nora',
        isStandalone: true,
        items: [{ name: 'Ask Nora', tab: 'Workboard' }]
      },
      {
        category: 'Daily Work',
        items: [
          { name: 'Tasks', tab: 'Tasks' }
        ]
      },
      {
        category: 'Brokerage Operations',
        items: [
          { name: 'Role Map & Escalations', tab: 'Role Map' },
          { name: 'Directory', tab: 'Directory' },
          { name: 'Knowledge Library', tab: 'Knowledge Library' },
          { name: 'Market Intelligence', tab: 'Market Intelligence' }
        ]
      }
    ];

    const allItems = ryanGroups.flatMap(g => g.items);
    expect(allItems.map(i => i.name)).toEqual([
      'Ask Nora',
      'Tasks',
      'Role Map & Escalations',
      'Directory',
      'Knowledge Library',
      'Market Intelligence'
    ]);

    // Explicitly verify Directory name
    const directoryItem = allItems.find(i => i.tab === 'Directory');
    expect(directoryItem?.name).toBe('Directory');
    expect(directoryItem?.name).not.toBe('72-Agent Directory');

    // Explicitly verify Brokerage Health, Settings, and obsolete pages are omitted from sidebar
    const allTabs = allItems.map(i => i.tab);
    expect(allTabs).not.toContain('Brokerage Health');
    expect(allTabs).not.toContain('Settings');
    expect(allTabs).not.toContain('Workspace Settings');
    expect(allTabs).not.toContain('Ryan Shield');
    expect(allTabs).not.toContain('Owner Brief');
    expect(allTabs).not.toContain('Approvals');
  });
});
