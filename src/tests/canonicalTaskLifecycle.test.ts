import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateTaskTransition,
  isAuthorizedOperationsIdentity,
  AUTHORIZED_OPERATIONS_ROLES
} from '../../server/policies/canonicalMarketingLifecyclePolicy.js';
import {
  CanonicalMarketingTask,
  CanonicalMarketingRequest
} from '../../server/persistence/marketingCampaignsRepository.js';

describe('Canonical Marketing Lifecycle Transition Policy', () => {
  let sampleTask: CanonicalMarketingTask;
  let sampleRequest: CanonicalMarketingRequest;

  beforeEach(() => {
    sampleTask = {
      id: 'tsk_test_001',
      requestId: 'req_test_001',
      title: '1-Page Property Flyer (8.5x11)',
      status: 'needs_info',
      propertyAddress: '123 Oceanfront Ave, Wilmington NC',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvalHistory: []
    };

    sampleRequest = {
      id: 'req_test_001',
      title: 'Marketing Package for 123 Oceanfront Ave',
      propertyAddress: '123 Oceanfront Ave, Wilmington NC',
      agentName: 'Matt Orr',
      channel: 'web',
      taskIds: ['tsk_test_001'],
      status: 'needs_info',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  it('1. needs_info → in_progress rejection (HTTP 409 INVALID_STATE_TRANSITION)', () => {
    const sessionUser = { id: 'usr_marcus', email: 'marcus@nestrealty.com', role: 'admin' };
    const result = validateTaskTransition(sampleTask, 'in_progress', sessionUser, sampleRequest);

    expect(result.allowed).toBe(false);
    expect(result.statusCode).toBe(409);
    expect(result.errorCode).toBe('INVALID_STATE_TRANSITION');
    expect(result.message).toContain('cannot transition task directly from "needs_info" to "in_progress"');
  });

  it('2. needs_info → completed rejection (HTTP 409 INVALID_STATE_TRANSITION)', () => {
    const sessionUser = { id: 'usr_melissa', email: 'melissa.gagliardi@nestrealty.com', role: 'marketing_coordinator' };
    const result = validateTaskTransition(sampleTask, 'completed', sessionUser, sampleRequest);

    expect(result.allowed).toBe(false);
    expect(result.statusCode).toBe(409);
    expect(result.errorCode).toBe('INVALID_STATE_TRANSITION');
    expect(result.message).toContain('cannot transition task directly from "needs_info" to "completed"');
  });

  it('3. incomplete parent with child in_progress rejection (HTTP 409 INVALID_STATE_TRANSITION)', () => {
    // Task claims ready_for_review but parent request is still in needs_info
    sampleTask.status = 'ready_for_review';
    sampleRequest.status = 'needs_info';

    const sessionUser = { id: 'usr_melissa', email: 'melissa.gagliardi@nestrealty.com', role: 'marketing_coordinator' };
    const result = validateTaskTransition(sampleTask, 'in_progress', sessionUser, sampleRequest);

    expect(result.allowed).toBe(false);
    expect(result.statusCode).toBe(409);
    expect(result.errorCode).toBe('INVALID_STATE_TRANSITION');
    expect(result.message).toContain('parent marketing request is in "needs_info"');
  });

  it('4. ready_for_review → in_progress by unauthorized user rejection (HTTP 403 UNAUTHORIZED_OPERATIONS_ROLE)', () => {
    sampleTask.status = 'ready_for_review';
    sampleRequest.status = 'ready_for_review';

    // Matt Orr with role agent
    const sessionUser = { id: 'usr_matt', email: 'matt.orr@nestrealty.com', role: 'agent' };
    const result = validateTaskTransition(sampleTask, 'in_progress', sessionUser, sampleRequest);

    expect(result.allowed).toBe(false);
    expect(result.statusCode).toBe(403);
    expect(result.errorCode).toBe('UNAUTHORIZED_OPERATIONS_ROLE');
    expect(result.message).toContain('requires an authorized operations identity');
  });

  it('5. ready_for_review → in_progress by authorized operations user success', () => {
    sampleTask.status = 'ready_for_review';
    sampleRequest.status = 'ready_for_review';

    // Melissa Gagliardi with role marketing_coordinator
    const sessionUser = { id: 'usr_melissa', email: 'melissa.gagliardi@nestrealty.com', role: 'marketing_coordinator' };
    const result = validateTaskTransition(sampleTask, 'in_progress', sessionUser, sampleRequest);

    expect(result.allowed).toBe(true);
    expect(result.isNoteOnly).toBe(false);
  });

  it('6. internal note persistence without a status change', () => {
    sampleTask.status = 'needs_info';
    sampleRequest.status = 'needs_info';

    const sessionUser = { id: 'usr_marcus', email: 'marcus@nestrealty.com', role: 'admin' };
    
    // Omitting requested status or passing current status (note-only update)
    const resultNoStatus = validateTaskTransition(sampleTask, undefined, sessionUser, sampleRequest);
    expect(resultNoStatus.allowed).toBe(true);
    expect(resultNoStatus.isNoteOnly).toBe(true);

    const resultSameStatus = validateTaskTransition(sampleTask, 'needs_info', sessionUser, sampleRequest);
    expect(resultSameStatus.allowed).toBe(true);
    expect(resultSameStatus.isNoteOnly).toBe(true);
  });

  it('7. client-supplied admin/operations claims ignored', () => {
    sampleTask.status = 'ready_for_review';
    sampleRequest.status = 'ready_for_review';

    // Session is strictly agent (Matt Orr), even if client passed fake admin/operations claims
    const sessionUser = { id: 'usr_matt', email: 'matt.orr@nestrealty.com', role: 'agent' };
    
    // The policy function accepts only the session user, so any client-side payload claims are not part of evaluation
    expect(isAuthorizedOperationsIdentity(sessionUser)).toBe(false);

    const result = validateTaskTransition(sampleTask, 'in_progress', sessionUser, sampleRequest);
    expect(result.allowed).toBe(false);
    expect(result.statusCode).toBe(403);
  });
});
