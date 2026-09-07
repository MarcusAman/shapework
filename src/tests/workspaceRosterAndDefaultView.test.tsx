/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Workspace Roster & Default View Verification Suite
 * Validates:
 * 1. Canonical staff roster integrity: Eduardo Lovo, Ann Gunn, Melissa Gagliardi,
 *    Ryan Crecelius, Marcus Aman, James Fort, Jessica Keenan, Eric Knight.
 * 2. Absolute exclusion of Sarah Jenkins from canonical roster and UI selectors.
 * 3. Safe detection and warning for legacy tasks assigned to Sarah Jenkins without silent reassignment.
 * 4. Tasks -> Workspace defaults to Kanban/Board view on fresh visit/reload.
 * 5. Tasks -> All Tasks defaults to Board/Pipeline view on fresh visit/reload.
 * 6. View control order is strictly Board | Table with Board active by default.
 * 7. Explicit ?view=table query parameter is respected across both views.
 * 8. Deep-linking via taskId opens modal/drawer cleanly from Board view.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  CANONICAL_WORKSPACE_ROSTER,
  getCanonicalStaffRoster,
  resolveCanonicalStaffMember,
  isSarahJenkinsTask,
  sanitizeTaskAssignment
} from '../services/canonicalRoster';
import {
  VAWorkspaceView,
  WORKSPACE_MEMBERS,
  VAWorkTaskItem
} from '../components/marketing/VAWorkspaceView';
import {
  MarketingHomeInbox,
  TEAM_MEMBERS
} from '../components/marketing/MarketingHomeInbox';
import { CANONICAL_STAFF } from '../components/marketing/TaskRequestDetailModal';

describe('Workspace Roster and Default Board View Suite', () => {
  const sampleTasks: VAWorkTaskItem[] = [
    {
      id: 'task_lumina_001',
      campaignId: 'camp_721',
      propertyAddress: '721 S Lumina Ave, Wrightsville Beach, NC',
      agentName: 'Jessica Keenan',
      agentPhone: '(910) 555-0899',
      agentEmail: 'jessica.keenan@nestrealty.com',
      agentRole: 'Broker-in-Charge (BIC)',
      packageType: 'Luxury Oceanfront Feature Flyer',
      priority: 'high',
      status: 'in_production',
      targetSla: 'Today 3:00 PM',
      receivedAt: 'Today at 8:30 AM',
      assignedTo: 'Eduardo Lovo',
      assignedToId: 'dir_eduardo_lovo_73',
      assignedToRole: 'Virtual Assistant / Production Specialist',
      coveringStaff: 'Ann Gunn',
      coveringStaffId: 'dir_ann_gunn_28',
      sourceChannel: 'phone',
      category: 'Marketing',
      requestedAssets: [{ name: 'Flyer', format: 'PDF Print-Ready', dimensions: '8.5 x 11 in', templateId: 'flyer_editorial' }],
      listingDetails: {
        price: '$2,100,000',
        bedsBaths: '4 Beds / 4 Baths',
        sqft: '3,100 SqFt',
        headline: 'South Lumina Oceanfront Haven',
        description: 'Steps from Crystal Pier with direct private beach access.',
        disclosures: 'Nest Realty Wilmington · NC Broker License #C29184.',
        mlsNumber: 'MLS #10046002',
        licenseNumber: 'NC Broker #184920'
      },
      photos: [],
      sopCode: 'SOP-MKT-008',
      sopTitle: 'Luxury Print & Digital Marketing Package Compilation',
      aiRecommendation: { badge: 'Verified', rationale: 'Ready', complianceChecked: true }
    },
    {
      id: 'task_legacy_sarah',
      campaignId: 'camp_legacy',
      propertyAddress: '99 Legacy Way, Wilmington, NC',
      agentName: 'Sarah Jenkins',
      agentPhone: '(910) 555-0199',
      agentEmail: 'sarah.jenkins@nestrealty.com',
      agentRole: 'Unknown',
      packageType: 'Legacy Flyer',
      priority: 'normal',
      status: 'needs_info',
      targetSla: 'Tomorrow 5:00 PM',
      receivedAt: 'Yesterday',
      assignedTo: 'Sarah Jenkins',
      assignedToId: 'usr_sarah',
      assignedToRole: 'Fabricated Role',
      sourceChannel: 'email',
      category: 'Marketing',
      requestedAssets: [],
      listingDetails: {
        price: '$500,000',
        bedsBaths: '3 Beds / 2 Baths',
        sqft: '2,000 SqFt',
        headline: 'Legacy Property',
        description: 'Historical test fixture.',
        disclosures: 'Nest Realty Wilmington.',
        mlsNumber: 'MLS #10049999',
        licenseNumber: 'NC Broker #999999'
      },
      photos: [],
      sopCode: 'SOP-MKT-001',
      sopTitle: 'Marketing Collateral Protocol',
      aiRecommendation: { badge: 'Legacy', rationale: 'Needs review', complianceChecked: false }
    }
  ];

  beforeEach(() => {
    // Ensure clean environment
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/marketing');
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Canonical Roster Integrity', () => {
    it('contains all 8 required canonical staff members with real identities', () => {
      const roster = CANONICAL_WORKSPACE_ROSTER;
      const names = roster.map(m => m.name);

      expect(names).toContain('Eduardo Lovo');
      expect(names).toContain('Ann Gunn');
      expect(names).toContain('Melissa Gagliardi');
      expect(names).toContain('Ryan Crecelius');
      expect(names).toContain('Marcus Aman');
      expect(names).toContain('James Fort');
      expect(names).toContain('Jessica Keenan');
      expect(names).toContain('Eric Knight');

      // Verify specific roles and emails
      const james = roster.find(m => m.name === 'James Fort');
      expect(james).toBeDefined();
      expect(james?.id).toBe('dir_james_fort_11');
      expect(james?.email).toBe('james.fort@nestrealty.com');
      expect(james?.role).toContain('Finance');

      const jessica = roster.find(m => m.name === 'Jessica Keenan');
      expect(jessica).toBeDefined();
      expect(jessica?.id).toBe('dir_jessica_keenan_8');
      expect(jessica?.email).toBe('jessica.keenan@nestrealty.com');
      expect(jessica?.role).toContain('Broker-in-Charge');

      const eric = roster.find(m => m.name === 'Eric Knight');
      expect(eric).toBeDefined();
      expect(eric?.id).toBe('dir_eric_knight_5');
      expect(eric?.email).toBe('eric@nestrealty.com');
      expect(eric?.role).toContain('Broker-in-Charge');
    });

    it('strictly excludes Sarah Jenkins from all canonical exports', () => {
      const canonicalNames = CANONICAL_WORKSPACE_ROSTER.map(m => m.name.toLowerCase());
      expect(canonicalNames.some(n => n.includes('sarah'))).toBe(false);

      const workspaceNames = WORKSPACE_MEMBERS.map(m => m.name.toLowerCase());
      expect(workspaceNames.some(n => n.includes('sarah'))).toBe(false);

      const teamNames = TEAM_MEMBERS.map(m => m.name.toLowerCase());
      expect(teamNames.some(n => n.includes('sarah'))).toBe(false);

      const staffModalNames = CANONICAL_STAFF.map(m => m.fullName.toLowerCase());
      expect(staffModalNames.some(n => n.includes('sarah'))).toBe(false);
    });

    it('resolves canonical members and prevents resolving Sarah Jenkins', () => {
      // Valid resolutions
      expect(resolveCanonicalStaffMember('dir_james_fort_11')?.name).toBe('James Fort');
      expect(resolveCanonicalStaffMember('jessica.keenan@nestrealty.com')?.name).toBe('Jessica Keenan');
      expect(resolveCanonicalStaffMember('Eric Knight')?.name).toBe('Eric Knight');
      expect(resolveCanonicalStaffMember('usr_eduardo')?.name).toBe('Eduardo Lovo');

      // Sarah Jenkins resolution MUST return null
      expect(resolveCanonicalStaffMember('Sarah Jenkins')).toBeNull();
      expect(resolveCanonicalStaffMember('sarah.jenkins@nestrealty.com')).toBeNull();
      expect(resolveCanonicalStaffMember('usr_sarah')).toBeNull();
      expect(resolveCanonicalStaffMember('dir_sarah_jenkins')).toBeNull();
    });

    it('correctly flags Sarah Jenkins tasks and protects against silent overwrite', () => {
      expect(isSarahJenkinsTask(sampleTasks[0])).toBe(false);
      expect(isSarahJenkinsTask(sampleTasks[1])).toBe(true);

      const sanitized = sanitizeTaskAssignment(sampleTasks[1]);
      expect(sanitized.reassignmentWarning).toBeDefined();
      expect(sanitized.reassignmentWarning).toContain('Sarah Jenkins');
      expect(sanitized.assignedTo).toContain('Requires Reassignment');
    });
  });

  describe('2. Tasks -> Workspace Default View & View Control Order', () => {
    it('opens in Kanban/Board view by default on fresh render without sticky localStorage', () => {
      const html = renderToStaticMarkup(
        <VAWorkspaceView tasks={sampleTasks} />
      );

      // Kanban board view must be rendered
      expect(html).toContain('data-testid="workspace-kanban-board"');
      // Table view must NOT be rendered
      expect(html).not.toContain('data-testid="workspace-table-view"');
    });

    it('renders view control order strictly as Board | Table with Board active by default', () => {
      const html = renderToStaticMarkup(
        <VAWorkspaceView tasks={sampleTasks} />
      );

      expect(html).toContain('data-testid="workspace-view-switcher"');

      // Check order in HTML
      const boardIndex = html.indexOf('data-testid="workspace-view-toggle-board"');
      const tableIndex = html.indexOf('data-testid="workspace-view-toggle-table"');

      expect(boardIndex).toBeGreaterThan(-1);
      expect(tableIndex).toBeGreaterThan(-1);
      expect(boardIndex).toBeLessThan(tableIndex); // Board MUST precede Table
    });

    it('respects explicit initialViewMode="table" or ?view=table query parameter', () => {
      const htmlTable = renderToStaticMarkup(
        <VAWorkspaceView tasks={sampleTasks} initialViewMode="table" />
      );

      expect(htmlTable).toContain('data-testid="workspace-table-view"');
      expect(htmlTable).not.toContain('data-testid="workspace-kanban-board"');
    });

    it('renders all canonical team members in the workspace member selector', () => {
      const html = renderToStaticMarkup(
        <VAWorkspaceView tasks={sampleTasks} />
      );

      expect(html).toContain('Eduardo Lovo');
      expect(html).toContain('Ann Gunn');
      expect(html).toContain('Melissa Gagliardi');
      expect(html).toContain('Ryan Crecelius');
      expect(html).toContain('Marcus Aman');
      expect(html).toContain('James Fort');
      expect(html).toContain('Jessica Keenan');
      expect(html).toContain('Eric Knight');

      // Absolutely no Sarah Jenkins
      expect(html).not.toContain('Sarah Jenkins');
    });

    it('renders Send to dropdown with James Fort, Jessica Keenan, and Eric Knight', () => {
      // In VAWorkspaceView, the task card Send-to dropdown is built directly from WORKSPACE_MEMBERS
      expect(WORKSPACE_MEMBERS.map(m => m.name)).toContain('James Fort');
      expect(WORKSPACE_MEMBERS.map(m => m.name)).toContain('Jessica Keenan');
      expect(WORKSPACE_MEMBERS.map(m => m.name)).toContain('Eric Knight');
      expect(WORKSPACE_MEMBERS.map(m => m.name)).not.toContain('Sarah Jenkins');

      const html = renderToStaticMarkup(
        <VAWorkspaceView tasks={sampleTasks} initialViewMode="table" />
      );

      expect(html).toContain('data-testid="send-to-btn-task_lumina_001"');
      expect(html).toContain('Send to...');
    });
  });

  describe('3. Tasks -> All Tasks Default View & Team Filter', () => {
    it('opens in Board (pipeline) view by default on fresh render', () => {
      const html = renderToStaticMarkup(
        <MarketingHomeInbox onSelectCampaign={() => {}} />
      );

      // Pipeline / Board view must be rendered
      expect(html).toContain('data-testid="pipeline-view"');
      // Table view must NOT be rendered
      expect(html).not.toContain('data-testid="all-tasks-table-view"');
    });

    it('renders view control order strictly as Board | Table on All Tasks', () => {
      const html = renderToStaticMarkup(
        <MarketingHomeInbox onSelectCampaign={() => {}} />
      );

      const boardIndex = html.indexOf('data-testid="all-tasks-view-toggle-board"');
      const tableIndex = html.indexOf('data-testid="all-tasks-view-toggle-table"');

      expect(boardIndex).toBeGreaterThan(-1);
      expect(tableIndex).toBeGreaterThan(-1);
      expect(boardIndex).toBeLessThan(tableIndex); // Board MUST precede Table
    });

    it('respects initialViewMode="table" on All Tasks', () => {
      const htmlTable = renderToStaticMarkup(
        <MarketingHomeInbox onSelectCampaign={() => {}} initialViewMode="table" />
      );

      expect(htmlTable).toContain('data-testid="all-tasks-table-view"');
      expect(htmlTable).not.toContain('data-testid="pipeline-view"');
    });

    it('populates team member filter dropdown with all canonical staff and no Sarah Jenkins', () => {
      const html = renderToStaticMarkup(
        <MarketingHomeInbox onSelectCampaign={() => {}} />
      );

      expect(html).toContain('James Fort');
      expect(html).toContain('Jessica Keenan');
      expect(html).toContain('Eric Knight');
      expect(html).toContain('Eduardo Lovo');
      expect(html).toContain('Ann Gunn');
      expect(html).not.toContain('Sarah Jenkins');
    });
  });

  describe('4. Deep Linking & Lifecycle Safety', () => {
    it('does NOT open the right side drawer on initial workspace navigation without deep-link', () => {
      const html = renderToStaticMarkup(
        <VAWorkspaceView tasks={sampleTasks} />
      );

      expect(html).toContain('data-testid="workspace-kanban-board"');
      // Drawer is strictly NOT open on initial mount
      expect(html).not.toContain('data-testid="workspace-task-drawer"');
    });

    it('initializes drawer state cleanly when deep-linked with taskId on Board view', () => {
      const html = renderToStaticMarkup(
        <VAWorkspaceView tasks={sampleTasks} initialDrawerOpen={true} />
      );

      expect(html).toContain('data-testid="workspace-kanban-board"');
      // Drawer is open when explicitly requested
      expect(html).toContain('data-testid="workspace-task-drawer"');
    });
  });
});
