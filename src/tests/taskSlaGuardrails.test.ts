import { describe, it, expect, beforeEach } from 'vitest';
import {
  evaluateTaskSlaStatus,
  validateTaskCompletionGuardrail,
  runSlaGuardrailCheck,
  getSlaGuardrailSummary,
  resetSlaAlertHistory
} from '../../server/services/taskSlaGuardrailService';
import {
  saveCanonicalMarketingTask,
  saveCanonicalMarketingRequest
} from '../../server/persistence/marketingCampaignsRepository';

describe('Task Guardrails & SLA Approaching Overdue Alert Engine Test Suite', () => {
  beforeEach(() => {
    resetSlaAlertHistory();
  });

  it('1. Correctly calculates Approaching Overdue status when deadline is within 4 hours', () => {
    const now = new Date();
    const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();

    const task: any = {
      id: 'tsk_sla_warning_test',
      title: '1-Page Property Flyer (8.5x11)',
      status: 'in_progress',
      assignedTo: 'Eduardo Lovo',
      dueAt: threeHoursLater,
      createdAt: now.toISOString()
    };

    const result = evaluateTaskSlaStatus(task, now);
    expect(result.status).toBe('approaching_overdue');
    expect(result.isApproaching).toBe(true);
    expect(result.isOverdue).toBe(false);
    expect(result.badgeColor).toBe('amber');
    expect(result.badgeLabel).toContain('Due in');
  });

  it('2. Correctly calculates Overdue status when deadline has passed', () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

    const task: any = {
      id: 'tsk_sla_overdue_test',
      title: 'Yard Sign Post & Custom Rider Installation',
      category: 'signage',
      status: 'in_progress',
      assignedTo: 'Ann Gunn',
      dueAt: twoHoursAgo,
      createdAt: new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString()
    };

    const result = evaluateTaskSlaStatus(task, now);
    expect(result.status).toBe('overdue');
    expect(result.isOverdue).toBe(true);
    expect(result.isApproaching).toBe(false);
    expect(result.badgeColor).toBe('red');
    expect(result.badgeLabel).toContain('Overdue by');
  });

  it('3. Enforces Task Completion Guardrail (blocks completing empty task without deliverables/evidence)', () => {
    // Empty task without photos, attachments, or drive link
    const emptyTask: any = {
      id: 'tsk_empty_test',
      title: 'Brochure Print Run',
      status: 'in_progress',
      photos: [],
      attachments: []
    };

    const emptyCheck = validateTaskCompletionGuardrail(emptyTask);
    expect(emptyCheck.allowed).toBe(false);
    expect(emptyCheck.reason).toContain('Guardrail Block');

    // Valid task with photo attached
    const validTask: any = {
      id: 'tsk_valid_test',
      title: '1-Page Property Flyer',
      status: 'in_progress',
      photos: [{ id: 'p1', url: '/images/properties/1916_wolcott_1004.jpg', name: '1004.jpg' }]
    };

    const validCheck = validateTaskCompletionGuardrail(validTask);
    expect(validCheck.allowed).toBe(true);
  });

  it('4. Runs SLA Guardrail Monitor, dispatches role-based alerts, and ensures alert deduplication', async () => {
    const now = new Date();
    const warningDue = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
    const overdueDue = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();

    // Seed test tasks
    saveCanonicalMarketingTask({
      id: 'tsk_approaching_01',
      title: 'Open House Kit & Directionals',
      category: 'open_house',
      status: 'in_progress',
      assignedTo: 'Melissa Gagliardi',
      propertyAddress: '1104 S Live Oak Pkwy, Wilmington, NC',
      dueAt: warningDue,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    });

    saveCanonicalMarketingTask({
      id: 'tsk_overdue_01',
      title: 'Yard Sign Post & Rider',
      category: 'signage',
      status: 'in_progress',
      assignedTo: 'Ann Gunn',
      propertyAddress: '212 Wetland Drive, Wilmington, NC',
      dueAt: overdueDue,
      createdAt: new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString(),
      updatedAt: now.toISOString()
    });

    // First scan should find 1 approaching and 1 overdue task, and dispatch alerts
    const scan1 = await runSlaGuardrailCheck(now);
    expect(scan1.approachingCount).toBeGreaterThanOrEqual(1);
    expect(scan1.overdueCount).toBeGreaterThanOrEqual(1);
    expect(scan1.alertsDispatched).toBeGreaterThanOrEqual(2);

    // Second scan immediately after should NOT duplicate alerts (deduplication active)
    const scan2 = await runSlaGuardrailCheck(now);
    expect(scan2.alertsDispatched).toBe(0);

    // Verify summary metrics
    const summary = getSlaGuardrailSummary(now);
    expect(summary.totalActive).toBeGreaterThanOrEqual(2);
    expect(summary.overdue).toBeGreaterThanOrEqual(1);
    expect(summary.approaching).toBeGreaterThanOrEqual(1);
  });
});
