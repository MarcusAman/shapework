import { describe, it, expect } from 'vitest';
import {
  isOpenMarketingTask,
  countOpenFor,
  countMelissaOpen,
  collectBicStuckItems,
  digestJokeFingerprint,
  DIGEST_RECIPIENTS,
  DIGEST_ALLOWLIST_EMAILS,
} from '../../server/services/nora/dailyLeadershipDigestService';

describe('dailyLeadershipDigest helpers', () => {
  const tasks = [
    { id: '1', status: 'in_progress', assignedTo: 'Eduardo Lovo' },
    { id: '2', status: 'completed', assignedTo: 'Eduardo Lovo' },
    { id: '3', status: 'in_progress', assignedTo: 'Ann Gunn' },
    { id: '4', status: 'archived', assignedTo: 'Ann Gunn', isArchived: true },
    { id: '5', status: 'cancelled', assignedTo: 'Melissa Gagliardi' },
    {
      id: '6',
      status: 'awaiting_review',
      assignedTo: 'Eduardo Lovo',
      reviewOwnerName: 'Melissa Gagliardi',
    },
    { id: '7', status: 'in_progress', assignedTo: 'Melissa Gagliardi' },
  ];

  it('treats completed/archived/cancelled as closed', () => {
    expect(isOpenMarketingTask(tasks[0])).toBe(true);
    expect(isOpenMarketingTask(tasks[1])).toBe(false);
    expect(isOpenMarketingTask(tasks[3])).toBe(false);
    expect(isOpenMarketingTask(tasks[4])).toBe(false);
  });

  it('counts Eduardo / Ann by assignee/executor name', () => {
    expect(countOpenFor(tasks, ['eduardo lovo', 'eduardo'])).toBe(2);
    expect(countOpenFor(tasks, ['ann gunn', 'ann'])).toBe(1);
  });

  it('counts Melissa open including review-owner lane', () => {
    expect(countMelissaOpen(tasks)).toBe(2);
  });

  it('rotates jokes by day-of-year fingerprint', () => {
    expect(digestJokeFingerprint(1)).not.toEqual(digestJokeFingerprint(2));
    expect(digestJokeFingerprint(10)).toEqual(digestJokeFingerprint(10));
  });

  it('has Nest recipients + marcus test override on allowlist export', () => {
    expect(DIGEST_RECIPIENTS.ryan.email).toBe('ryan@nestrealty.com');
    expect(DIGEST_RECIPIENTS.melissa.email).toBe('melissa.gagliardi@nestrealty.com');
    expect(DIGEST_RECIPIENTS.ann.email).toBe('ann@nestrealty.com');
    expect(DIGEST_ALLOWLIST_EMAILS).toContain('marcus.aman@gmail.com');
  });

  it('collects BIC stuck listing/offer signals without inventing agent blasts', () => {
    const now = new Date('2026-09-17T16:00:00.000Z');
    const stuckTasks = [
      {
        id: 'a',
        title: 'Listing Launch: 119 Ogilby',
        category: 'listing_launch',
        status: 'in_progress',
        dueAt: '2026-09-10T12:00:00.000Z',
        agentName: '',
        requirements: [{ title: 'Form 101', status: 'not_reviewed' }],
      },
      {
        id: 'b',
        title: 'Offer / 2-T: 515 North Walls',
        category: 'offer',
        status: 'in_progress',
        assignedTo: 'Ann Gunn',
        requirements: [{ title: 'Form 2-T draft', status: 'needs_correction' }],
        dueAt: '2026-09-20T12:00:00.000Z',
      },
      {
        id: 'c',
        title: 'Flyer for Melissa',
        category: 'social',
        status: 'in_progress',
        assignedTo: 'Eduardo Lovo',
      },
    ];
    const items = collectBicStuckItems(stuckTasks as any, now);
    expect(items.some((i) => i.id === 'a')).toBe(true);
    expect(items.find((i) => i.id === 'a')?.reasons).toEqual(
      expect.arrayContaining(['past_sla', 'orphaned_owner', 'missing_form_steps'])
    );
    expect(items.some((i) => i.id === 'b')).toBe(true);
    expect(items.find((i) => i.id === 'b')?.reasons).toContain('evidence_needs_human');
    expect(items.some((i) => i.id === 'c')).toBe(false);
  });
});
