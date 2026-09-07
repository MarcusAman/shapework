/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Workspace Tasks Cleaning & Cascading Archiving Test Suite
 * Validates morning workspace cleanup, zero-task empty states (no fixture resurrecting),
 * and two-way cascading synchronization between tasks and parent marketing requests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAllCanonicalMarketingTasks,
  saveCanonicalMarketingTask,
  getAllCanonicalMarketingRequests,
  saveCanonicalMarketingRequest,
  archiveCanonicalMarketingTask,
  archiveCanonicalMarketingRequestAndTasks,
  cleanOrArchiveTasksForAssignees,
  CanonicalMarketingTask,
  CanonicalMarketingRequest
} from '../../server/persistence/marketingCampaignsRepository.js';

describe('Workspace Tasks Cleaning & Cascading Archiving Suite', () => {
  beforeEach(() => {
    // Reset test state with fresh tasks
    const req1: CanonicalMarketingRequest = {
      id: 'req_test_clean_001',
      title: '312 Mayfaire Way Collateral',
      propertyAddress: '312 Mayfaire Way, Wilmington NC',
      agentName: 'Marcus Aman',
      channel: 'web',
      status: 'in_progress',
      category: 'collateral',
      taskIds: ['task_melissa_001', 'task_eduardo_001'],
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const req2: CanonicalMarketingRequest = {
      id: 'req_test_clean_002',
      title: '702 Lumina Ave Sign Post',
      propertyAddress: '702 Lumina Ave, Wrightsville Beach NC',
      agentName: 'Ryan Crecelius',
      channel: 'web',
      status: 'in_progress',
      category: 'signage',
      taskIds: ['task_ann_001'],
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const task1: CanonicalMarketingTask = {
      id: 'task_melissa_001',
      requestId: 'req_test_clean_001',
      requestTitle: '312 Mayfaire Way Collateral',
      propertyAddress: '312 Mayfaire Way, Wilmington NC',
      agentName: 'Marcus Aman',
      title: 'Double-Sided Feature Flyer',
      category: 'flyer',
      assignedTo: 'Melissa Gagliardi',
      assignedToRole: 'Marketing Director',
      status: 'in_production',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const task2: CanonicalMarketingTask = {
      id: 'task_eduardo_001',
      requestId: 'req_test_clean_001',
      requestTitle: '312 Mayfaire Way Collateral',
      propertyAddress: '312 Mayfaire Way, Wilmington NC',
      agentName: 'Marcus Aman',
      title: 'Social Media Announcement Tiles',
      category: 'social_graphics',
      assignedTo: 'Eduardo Lovo',
      assignedToRole: 'Virtual Assistant',
      status: 'in_production',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const task3: CanonicalMarketingTask = {
      id: 'task_ann_001',
      requestId: 'req_test_clean_002',
      requestTitle: '702 Lumina Ave Sign Post',
      propertyAddress: '702 Lumina Ave, Wrightsville Beach NC',
      agentName: 'Ryan Crecelius',
      title: 'Yard Sign Post & Custom Rider Installation',
      category: 'signage',
      assignedTo: 'Ann Gunn',
      assignedToRole: 'Operations Coordinator',
      status: 'assigned',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveCanonicalMarketingRequest(req1);
    saveCanonicalMarketingRequest(req2);
    saveCanonicalMarketingTask(task1);
    saveCanonicalMarketingTask(task2);
    saveCanonicalMarketingTask(task3);
  });

  it('1. Clean/archive operation marks all tasks for Melissa, Eduardo, and Ann as archived', () => {
    const result = cleanOrArchiveTasksForAssignees(['Melissa Gagliardi', 'Eduardo Lovo', 'Ann Gunn']);

    expect(result.archivedTaskCount).toBeGreaterThanOrEqual(3);

    const allTasks = getAllCanonicalMarketingTasks();
    const melissaTasks = allTasks.filter(t => t.assignedTo === 'Melissa Gagliardi');
    const eduardoTasks = allTasks.filter(t => t.assignedTo === 'Eduardo Lovo');
    const annTasks = allTasks.filter(t => t.assignedTo === 'Ann Gunn');

    expect(melissaTasks.every(t => t.isArchived && t.status === 'archived')).toBe(true);
    expect(eduardoTasks.every(t => t.isArchived && t.status === 'archived')).toBe(true);
    expect(annTasks.every(t => t.isArchived && t.status === 'archived')).toBe(true);
  });

  it('2. Cascading Archiving: Archiving all child tasks auto-archives the parent request', () => {
    // Both child tasks for req_test_clean_001 archived
    archiveCanonicalMarketingTask('task_melissa_001');
    archiveCanonicalMarketingTask('task_eduardo_001');

    const requests = getAllCanonicalMarketingRequests();
    const req1 = requests.find(r => r.id === 'req_test_clean_001');
    expect(req1?.isArchived).toBe(true);
  });

  it('3. Cascading Archiving: Archiving a request archives all of its child deliverables', () => {
    const result = archiveCanonicalMarketingRequestAndTasks('req_test_clean_002');
    expect(result.request?.isArchived).toBe(true);
    expect(result.archivedTasks.length).toBe(1);

    const allTasks = getAllCanonicalMarketingTasks();
    const task3 = allTasks.find(t => t.id === 'task_ann_001');
    expect(task3?.isArchived).toBe(true);
    expect(task3?.status).toBe('archived');
  });

  it('4. Zero Active Tasks verification: Active task queries return 0 and do not resurrect demo fixtures', () => {
    cleanOrArchiveTasksForAssignees(['Melissa Gagliardi', 'Eduardo Lovo', 'Ann Gunn']);

    const allTasks = getAllCanonicalMarketingTasks();
    const activeEduardoTasks = allTasks.filter(
      t => !t.isArchived && t.status !== 'archived' && (t.assignedTo === 'Eduardo Lovo' || t.assignedToRole?.includes('Virtual Assistant'))
    );

    const activeMelissaTasks = allTasks.filter(
      t => !t.isArchived && t.status !== 'archived' && t.assignedTo === 'Melissa Gagliardi'
    );

    const activeAnnTasks = allTasks.filter(
      t => !t.isArchived && t.status !== 'archived' && t.assignedTo === 'Ann Gunn'
    );

    expect(activeEduardoTasks.length).toBe(0);
    expect(activeMelissaTasks.length).toBe(0);
    expect(activeAnnTasks.length).toBe(0);
  });

  it('5. Workstation Chip Counter logic: Correctly returns 0 active count for all cleaned assignees', () => {
    cleanOrArchiveTasksForAssignees(['Melissa Gagliardi', 'Eduardo Lovo', 'Ann Gunn']);

    const allTasks = getAllCanonicalMarketingTasks();
    const TEAM_MEMBERS = [
      { name: 'Melissa Gagliardi' },
      { name: 'Eduardo Lovo' },
      { name: 'Ann Gunn' }
    ];

    TEAM_MEMBERS.forEach(member => {
      const memberFirst = member.name.split(' ')[0].toLowerCase();
      const isEduardoMember = member.name === 'Eduardo Lovo';
      const countForMember = allTasks.filter(t => {
        const isArchived = Boolean(t.isArchived || t.status === 'archived');
        if (isArchived) return false;
        const assigned = (t.assignedTo || '').toLowerCase();
        const role = (t.assignedToRole || '').toLowerCase();
        if (isEduardoMember) {
          return assigned.includes('eduardo') || role.includes('virtual assistant') || role.includes('va');
        }
        return assigned.includes(memberFirst);
      }).length;

      expect(countForMember).toBe(0);
    });
  });

  it('6. VAWorkspaceView local state preserves isArchived flag and correctly hides archived tasks by default', () => {
    cleanOrArchiveTasksForAssignees(['Melissa Gagliardi', 'Eduardo Lovo', 'Ann Gunn']);
    const canonicalTasks = getAllCanonicalMarketingTasks();

    // Map tasks exactly as VAWorkspaceView does
    const mappedTasks = canonicalTasks.map((t: any, idx: number) => {
      const isArchived = Boolean(t.isArchived || t.status === 'archived');
      const resolvedStatus = isArchived
        ? 'archived'
        : (t.status === 'approved' || t.status === 'completed'
            ? 'completed'
            : (t.status === 'agent_review' || t.status === 'ready_for_review')
              ? 'ready_for_review'
              : t.status === 'proof_submitted'
                ? 'proof_submitted'
                : 'in_production');

      return {
        id: t.id,
        status: resolvedStatus,
        isArchived,
        assignedTo: t.assignedTo,
        assignedToRole: t.assignedToRole
      };
    });

    const activeForEduardo = mappedTasks.filter(t => {
      const isArchived = Boolean(t.isArchived || t.status === 'archived');
      if (isArchived) return false;
      const assigned = (t.assignedTo || '').toLowerCase();
      const role = (t.assignedToRole || '').toLowerCase();
      return assigned.includes('eduardo') || role.includes('virtual assistant') || role.includes('va');
    });

    const activeForMelissa = mappedTasks.filter(t => {
      const isArchived = Boolean(t.isArchived || t.status === 'archived');
      if (isArchived) return false;
      return (t.assignedTo || '').toLowerCase().includes('melissa');
    });

    const activeForAnn = mappedTasks.filter(t => {
      const isArchived = Boolean(t.isArchived || t.status === 'archived');
      if (isArchived) return false;
      return (t.assignedTo || '').toLowerCase().includes('ann');
    });

    expect(activeForEduardo.length).toBe(0);
    expect(activeForMelissa.length).toBe(0);
    expect(activeForAnn.length).toBe(0);
  });
});
