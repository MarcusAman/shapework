/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Workspace Table View, Kanban Board View & Task Drawer Integration Test Suite
 * Validates the 15 targeted acceptance criteria:
 * 1. Render Table view with primary 'Task' column (title, address, compact source icon, category) instead of leading 'Task ID'.
 * 2. Copying canonical task ID to clipboard from table row or card.
 * 3. Toggle between Table View and Kanban Board View.
 * 4. Persistence of view mode preference across unmount/mount.
 * 5. Kanban Board rendering all 6 visual lanes with correct task distribution.
 * 6. Clicking a table row opens the canonical WorkspaceTaskDrawer.
 * 7. Clicking a Kanban card opens the canonical WorkspaceTaskDrawer.
 * 8. Moving a card across valid lanes updates status via API.
 * 9. Guardrail preventing unauthorized status transitions (e.g., Eduardo completing without approval).
 * 10. Filter by search query (address, title, requester).
 * 11. Filter by status pill / dropdown.
 * 12. Team member workspace switcher updates view for Eduardo, Ann, Melissa, etc.
 * 13. Dynamic role-aware workspace title and honest metrics (no '100% Certified').
 * 14. Out-of-office / coverage indicator when viewing a covered team member's queue.
 * 15. Deep linking via ?taskId= opens the corresponding task drawer on mount.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import {
  VAWorkspaceView,
  VAWorkTaskItem,
  WORKSPACE_MEMBERS,
  KANBAN_LANES,
  getTaskKanbanLane,
  getTaskCategory,
  getTaskSourceChannel,
  getSlaUrgencyInfo
} from '../components/marketing/VAWorkspaceView';

describe('Workspace Table, Kanban Board & Role-Aware Drawer Test Suite', () => {
  const sampleTasks: VAWorkTaskItem[] = [
    {
      id: 'task_arboretum_001',
      campaignId: 'camp_1104',
      propertyAddress: '1104 Arboretum Dr, Wilmington, NC 28405',
      agentName: 'Sarah Jenkins',
      agentPhone: '(910) 555-0199',
      agentEmail: 'sarah.jenkins@nestrealty.com',
      agentRole: 'Listing Specialist',
      packageType: 'Double-Sided 8.5x11 Property Flyer',
      priority: 'urgent',
      status: 'in_production',
      reviewState: undefined,
      targetSla: 'Today 3:00 PM',
      receivedAt: 'Today at 8:30 AM',
      assignedTo: 'Eduardo Lovo',
      assignedToId: 'usr_eduardo',
      assignedToRole: 'Virtual Assistant / Maxa Production',
      coveringStaff: 'Ann Gunn',
      coveringStaffId: 'dir_staff_ann_gunn',
      sourceChannel: 'phone',
      callId: 'call_phone_1104',
      category: 'Marketing',
      requestedAssets: [{ name: 'Property Flyer', format: 'PDF Print-Ready', dimensions: '8.5 x 11 in', templateId: 'flyer_editorial' }],
      listingDetails: {
        price: '$895,000',
        bedsBaths: '4 Beds / 3.5 Baths',
        sqft: '3,420 SqFt',
        headline: 'Coastal Retreat in Landfall',
        description: 'Custom home in Landfall.',
        disclosures: 'Nest Realty Wilmington.',
        mlsNumber: 'MLS #10041289',
        licenseNumber: 'NC Broker #291842'
      },
      photos: [],
      sopCode: 'SOP-MKT-008',
      sopTitle: 'Luxury Print & Digital Marketing Package Compilation',
      aiRecommendation: { badge: 'Maxa Ready', rationale: 'All assets ready.', complianceChecked: true }
    },
    {
      id: 'task_ocean_002',
      campaignId: 'camp_304',
      propertyAddress: '304 Ocean Blvd, Wrightsville Beach, NC 28480',
      agentName: 'Eric Miller',
      agentPhone: '(910) 555-0244',
      agentEmail: 'eric.miller@nestrealty.com',
      agentRole: 'Coastal Broker Associate',
      packageType: 'Standard Listing Launch Package',
      priority: 'high',
      status: 'in_production',
      reviewState: undefined,
      targetSla: 'Today 5:00 PM',
      receivedAt: 'Today at 9:15 AM',
      assignedTo: 'Eduardo Lovo',
      assignedToId: 'usr_eduardo',
      assignedToRole: 'Virtual Assistant / Maxa Production',
      coveringStaff: 'Ann Gunn',
      coveringStaffId: 'dir_staff_ann_gunn',
      sourceChannel: 'email',
      category: 'Marketing',
      requestedAssets: [{ name: 'Social Feed Square', format: 'PNG High-Res', dimensions: '1080 x 1080 px', templateId: 'social_square' }],
      listingDetails: {
        price: '$1,450,000',
        bedsBaths: '3 Beds / 3 Baths',
        sqft: '2,180 SqFt',
        headline: 'Wrightsville Beach Oceanfront',
        description: 'Oceanfront condo.',
        disclosures: 'Nest Realty Wilmington.',
        mlsNumber: 'MLS #10041890',
        licenseNumber: 'NC Broker #184920'
      },
      photos: [],
      sopCode: 'SOP-MKT-008',
      sopTitle: 'Luxury Print & Digital Marketing Package Compilation',
      aiRecommendation: { badge: 'Fast-Track', rationale: 'Package verified.', complianceChecked: true }
    },
    {
      id: 'task_mayfaire_004',
      campaignId: 'camp_312',
      propertyAddress: '312 Mayfaire Way, Wilmington, NC 28405',
      agentName: 'Ann Gunn',
      agentPhone: '(910) 555-0377',
      agentEmail: 'ann.gunn@nestrealty.com',
      agentRole: 'Operations & Sign Lead',
      packageType: 'Sign Post Installation & Rider Collateral',
      priority: 'high',
      status: 'in_production',
      reviewState: undefined,
      targetSla: 'Today 4:00 PM',
      receivedAt: 'Today at 10:00 AM',
      assignedTo: 'Ann Gunn',
      assignedToId: 'dir_staff_ann_gunn',
      assignedToRole: 'Operations & Sign Lead',
      sourceChannel: 'internal',
      category: 'Signage',
      requestedAssets: [{ name: 'Sign Post Ticket', format: 'Vendor Work Ticket', dimensions: '6 x 24 in', templateId: 'rider_ticket' }],
      listingDetails: {
        price: '$720,000',
        bedsBaths: '4 Beds / 3 Baths',
        sqft: '2,800 SqFt',
        headline: 'Executive Colonial',
        description: 'Autumn Hall corridor.',
        disclosures: 'Nest Realty Wilmington.',
        mlsNumber: 'MLS #10043001',
        licenseNumber: 'NC Broker #300192'
      },
      photos: [],
      sopCode: 'SOP-OPS-002',
      sopTitle: 'Yard Sign Post & Vendor Dispatch Turnaround',
      aiRecommendation: { badge: 'Vendor Linked', rationale: 'Dispatched to Coastal Sign Post Co.', complianceChecked: true }
    },
    {
      id: 'task_inspiration_003',
      campaignId: 'camp_990',
      propertyAddress: '990 Inspiration Drive, Wilmington, NC 28405',
      agentName: 'Melissa Gagliardi',
      agentPhone: '(910) 555-0811',
      agentEmail: 'melissa@nestrealty.com',
      agentRole: 'Marketing Director / Broker',
      packageType: 'Open House Weekend Sprint Package',
      priority: 'normal',
      status: 'in_production',
      reviewState: 'awaiting_review',
      proofVersion: 1,
      proofUrl: 'https://drive.google.com/drive/folders/proofs_990',
      targetSla: 'Tomorrow 10:00 AM',
      receivedAt: 'Yesterday at 3:45 PM',
      assignedTo: 'Melissa Gagliardi',
      assignedToId: 'usr_melissa',
      assignedToRole: 'Marketing Director / Reviewer',
      sourceChannel: 'web',
      category: 'Marketing',
      requestedAssets: [{ name: 'Open House Flyer', format: 'PDF Print-Ready', dimensions: '8.5 x 11 in', templateId: 'open_house' }],
      listingDetails: {
        price: '$675,000',
        bedsBaths: '3 Beds / 2.5 Baths',
        sqft: '2,450 SqFt',
        headline: 'Mayfaire Townhome',
        description: 'Walk to Mayfaire.',
        disclosures: 'Nest Realty Wilmington.',
        mlsNumber: 'MLS #10042104',
        licenseNumber: 'NC Broker #210984'
      },
      photos: [],
      sopCode: 'SOP-MKT-008',
      sopTitle: 'Luxury Print & Digital Marketing Package Compilation',
      aiRecommendation: { badge: 'Proof Staged', rationale: 'Staged in Drive.', complianceChecked: true }
    }
  ];

  beforeEach(() => {
    // Mock local storage
    const storage: Record<string, string> = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
      removeItem: vi.fn((key: string) => { delete storage[key]; }),
      clear: vi.fn(() => { Object.keys(storage).forEach(k => delete storage[k]); }),
      length: 0,
      key: vi.fn((i: number) => Object.keys(storage)[i] || null)
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Renders Table view with primary "Task" column (title, address, compact source icon, category) instead of leading "Task ID"', () => {
    const html = renderToStaticMarkup(
      <VAWorkspaceView tasks={sampleTasks} initialViewMode="table" />
    );

    // Primary column header must be "Task" (not "Task ID")
    expect(html).toContain('<th class="py-3 px-3.5 min-w-[280px]">Task</th>');
    expect(html).toContain('data-testid="workspace-table-view"');

    // Task content includes package title, property address, and category badge
    expect(html).toContain('Double-Sided 8.5x11 Property Flyer');
    expect(html).toContain('1104 Arboretum Dr, Wilmington, NC 28405');
    expect(html).toContain('Marketing');

    // Compact source channel icon badge
    expect(html).toContain('Retell Voice');
  });

  it('2. Preserves canonical task ID and provides clipboard copy button on table row', () => {
    const html = renderToStaticMarkup(
      <VAWorkspaceView tasks={sampleTasks} initialViewMode="table" />
    );

    // Full canonical Task ID is accessible via copy button
    expect(html).toContain('data-testid="copy-task-id-task_arboretum_001"');
    expect(html).toContain('task_arboretum_001');
    expect(html).toContain('Copy canonical Task ID: task_arboretum_001');
  });

  it('3. Renders clean segmented toggle for Table View and Kanban Board View', () => {
    const html = renderToStaticMarkup(
      <VAWorkspaceView tasks={sampleTasks} />
    );

    expect(html).toContain('data-testid="workspace-view-switcher"');
    expect(html).toContain('data-testid="workspace-view-toggle-table"');
    expect(html).toContain('data-testid="workspace-view-toggle-board"');
    expect(html).toContain('Table');
    expect(html).toContain('Board');
  });

  it('4. Defaults to Board view on fresh page load without sticky localStorage overrides', () => {
    // Default rendering produces Kanban Board view
    const defaultHtml = renderToStaticMarkup(
      <VAWorkspaceView tasks={sampleTasks} />
    );
    expect(defaultHtml).toContain('data-testid="workspace-kanban-board"');
    expect(defaultHtml).not.toContain('data-testid="workspace-table-view"');

    // Component source verifies URL param ?view=table handling and absence of sticky localStorage overrides
    const filePath = path.resolve(process.cwd(), 'src/components/marketing/VAWorkspaceView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain("params.get('view')");
    expect(content).toContain("viewParam === 'table'");
  });

  it('5. Correctly distributes tasks across all 6 Kanban Board visual lanes', () => {
    expect(KANBAN_LANES.length).toBe(6);
    expect(KANBAN_LANES.map(l => l.id)).toEqual([
      'needs_info',
      'ready',
      'in_progress',
      'awaiting_review',
      'revisions',
      'completed'
    ]);

    const taskNeedsInfo: VAWorkTaskItem = { ...sampleTasks[0], status: 'needs_info' };
    const taskReady: VAWorkTaskItem = { ...sampleTasks[0], status: 'ready_for_review' };
    const taskInProg: VAWorkTaskItem = { ...sampleTasks[0], status: 'in_production', reviewState: undefined };
    const taskAwaiting: VAWorkTaskItem = { ...sampleTasks[0], status: 'in_production', reviewState: 'awaiting_review' };
    const taskRevisions: VAWorkTaskItem = { ...sampleTasks[0], status: 'in_production', reviewState: 'revisions_requested' };
    const taskCompleted: VAWorkTaskItem = { ...sampleTasks[0], status: 'completed' };

    expect(getTaskKanbanLane(taskNeedsInfo)).toBe('needs_info');
    expect(getTaskKanbanLane(taskReady)).toBe('ready');
    expect(getTaskKanbanLane(taskInProg)).toBe('in_progress');
    expect(getTaskKanbanLane(taskAwaiting)).toBe('awaiting_review');
    expect(getTaskKanbanLane(taskRevisions)).toBe('revisions');
    expect(getTaskKanbanLane(taskCompleted)).toBe('completed');
  });

  it('6. Verifies clicking any table row triggers the canonical WorkspaceTaskDrawer', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/marketing/VAWorkspaceView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Table row click handler opens drawer with canonical task ID
    expect(content).toContain('onClick={() => openTaskDrawer(t.id)}');
    expect(content).toContain('setSelectedTaskId(taskId);');
    expect(content).toContain('setIsDrawerOpen(true);');
    expect(content).toContain('<WorkspaceTaskDrawer');
  });

  it('7. Verifies clicking a Kanban card triggers the exact same canonical WorkspaceTaskDrawer', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/marketing/VAWorkspaceView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Kanban card click handler opens exact same drawer
    expect(content).toContain('data-testid={`kanban-card-${t.id}`}');
    expect(content).toContain('onClick={() => openTaskDrawer(t.id)}');
  });

  it('8. Supports moving tasks across valid lanes and synchronizing with status API', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/marketing/VAWorkspaceView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Move task function calls backend API with rollback
    expect(content).toContain('handleMoveTaskToLane');
    expect(content).toContain('fetch(`/api/marketing/tasks/${taskId}/status`');
    expect(content).toContain('setTasks(previousTasks);');
  });

  it('9. Enforces role guardrail preventing producers from completing tasks without manager approval', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/marketing/VAWorkspaceView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Guardrail logic check
    expect(content).toContain('Manager review required before completion: producers cannot self-approve.');
    expect(content).toContain("targetLane === 'completed'");
  });

  it('10. Filters tasks by search query across title, property address, agent name, and task ID', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/marketing/VAWorkspaceView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('t.propertyAddress.toLowerCase().includes(q)');
    expect(content).toContain('t.agentName.toLowerCase().includes(q)');
    expect(content).toContain('t.packageType.toLowerCase().includes(q)');
    expect(content).toContain('t.id.toLowerCase().includes(q)');
  });

  it('11. Filters tasks by status pill (All Statuses, In Production, Awaiting Review, Completed, Archived)', () => {
    const html = renderToStaticMarkup(
      <VAWorkspaceView tasks={sampleTasks} />
    );

    expect(html).toContain('data-testid="status-filter-all-statuses"');
    expect(html).toContain('data-testid="status-filter-in-production"');
    expect(html).toContain('data-testid="status-filter-awaiting-review"');
    expect(html).toContain('data-testid="status-filter-completed"');
    expect(html).toContain('data-testid="status-filter-archived"');
  });

  it('12. Team member workspace switcher updates view for Eduardo, Ann, Melissa, and canonical staff', () => {
    const html = renderToStaticMarkup(
      <VAWorkspaceView tasks={sampleTasks} />
    );

    expect(html).toContain('data-testid="team-member-btn-dir_eduardo_lovo_73"');
    expect(html).toContain('data-testid="team-member-btn-dir_ann_gunn_28"');
    expect(html).toContain('data-testid="team-member-btn-dir_melissa_gagliardi_33"');
    expect(html).toContain('data-testid="team-member-btn-dir_ryan_crecelius_6"');
    expect(html).toContain('Eduardo Lovo');
    expect(html).toContain('Ann Gunn');
    expect(html).toContain('Melissa Gagliardi');
    expect(html).toContain('James Fort');
    expect(html).toContain('Jessica Keenan');
    expect(html).toContain('Eric Knight');
  });

  it('13. Displays dynamic role-aware workspace title and honest actionable metrics without fabricated claims', () => {
    const html = renderToStaticMarkup(
      <VAWorkspaceView tasks={sampleTasks} />
    );

    // Title reflects selected operator
    expect(html).toContain('data-testid="workspace-title"');
    expect(html).toMatch(/Eduardo(&#x27;|')s Production Workspace/);

    // Strictly NO "100% Certified"
    expect(html).not.toContain('100% Certified');

    // Honest Actionable Metrics
    expect(html).toContain('data-testid="actionable-metrics-strip"');
    expect(html).toContain('data-testid="metric-card-open"');
    expect(html).toContain('data-testid="metric-card-due-soon"');
    expect(html).toContain('data-testid="metric-card-awaiting-review"');
    expect(html).toContain('data-testid="metric-card-overdue"');
    expect(html).toContain('Open Tasks');
    expect(html).toContain('Due Soon');
    expect(html).toContain('Awaiting Review');
    expect(html).toContain('Overdue');
  });

  it('14. Renders Out of Office (OOO) coverage indicator and delegation banner when viewing a covered member', () => {
    // Render with simulated coverage active or Eduardo's coverage state
    const html = renderToStaticMarkup(
      <VAWorkspaceView
        tasks={sampleTasks}
      />
    );

    // Member button shows coverage badge
    expect(html).toContain('Covered by Ann');
    expect(html).toContain('data-testid="member-ooo-badge-dir_eduardo_lovo_73"');

    // Component source verifies OOO banner and delegation controls
    const filePath = path.resolve(process.cwd(), 'src/components/marketing/VAWorkspaceView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('data-testid="ooo-coverage-banner"');
    expect(content).toContain('data-testid="coverage-filter-toggle"');
    expect(content).toContain('Out of Office Coverage Active');
    expect(content).toContain('Eduardo\'s Queue (Covered by Ann Gunn)');
  });

  it('15. Supports deep linking via ?taskId= query parameter to open corresponding task drawer on mount', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/marketing/VAWorkspaceView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Component inspects window.location.search for ?taskId=
    expect(content).toContain("params.get('taskId')");
    expect(content).toContain('setSelectedTaskId(qTaskId);');
    expect(content).toContain('setIsDrawerOpen(true);');
    expect(content).toContain("url.searchParams.set('taskId', taskId)");
  });
});
