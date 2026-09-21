/**
 * Tests for workspace runtime fixes, live Flex MLS workflow, and single lane placement.
 */
import { describe, it, expect } from 'vitest';
import { extractCleanBrief } from '../components/marketing/TaskRequestDetailModal';
import { getTaskKanbanLane } from '../components/marketing/VAWorkspaceView';

describe('Workspace Runtime & Live Flex MLS Workflow', () => {
  it('extractCleanBrief suppresses broker warning and displays Flex MLS instruction for live MLS listing', () => {
    const mockRequest: any = {
      id: 'req_call_call_612125f55cc8935ed3d0bd40411',
      title: 'Open House Tri-Fold Flyer — 518 North Fifth Avenue',
      propertyAddress: '518 North Fifth Avenue',
      agentName: 'Matt Orr',
      status: 'assigned',
      mlsNumber: '100576001',
      requestExcerpt: 'Caller stated listing is live in Flex MLS with number 100576001.'
    };

    const mockTask: any = {
      id: 'task_call_call_612125f55cc8935ed3d0bd40411_0',
      title: 'Open House Tri-Fold Flyer — 518 North Fifth Avenue',
      status: 'assigned',
      mlsNumber: '100576001',
      dueAt: '2026-09-27T00:00:00.000Z',
      notes: 'Retrieve listing details and photos from Flex MLS.'
    };

    const brief = extractCleanBrief(mockRequest, mockTask);

    expect(brief.missingInfo).toBe('Retrieve listing details and photos from Flex MLS.');
    expect(brief.missingInfo).not.toContain('Additional property details or photos required from broker');
  });

  it('getTaskKanbanLane assigns task with status "assigned" to "ready" lane, preventing dual-lane placement', () => {
    const assignedTask: any = {
      id: 'task_call_call_612125f55cc8935ed3d0bd40411_0',
      status: 'assigned',
      reviewState: undefined
    };

    const lane = getTaskKanbanLane(assignedTask);
    expect(lane).toBe('ready');
    expect(lane).not.toBe('in_progress');
    expect(lane).not.toBe('needs_info');
  });

  it('getTaskKanbanLane assigns task with reviewState "awaiting_review" to "awaiting_review" lane', () => {
    const reviewTask: any = {
      id: 'task_review_1',
      status: 'in_production',
      reviewState: 'awaiting_review'
    };

    expect(getTaskKanbanLane(reviewTask)).toBe('awaiting_review');
  });

  it('getTaskKanbanLane assigns task with reviewState "revisions_requested" to "revisions" lane', () => {
    const revTask: any = {
      id: 'task_rev_1',
      status: 'in_production',
      reviewState: 'revisions_requested'
    };

    expect(getTaskKanbanLane(revTask)).toBe('revisions');
  });
});
