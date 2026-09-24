import { describe, expect, it } from 'vitest';
import {
  LISTING_LAUNCH_INTERVIEW_EXAMPLE,
  buildSopFormFromInterview,
  listingLaunchExampleStepLines,
  listingLaunchExampleSystemsUsed,
} from '../lib/sopInterview';
import { NEST_LISTING_LAUNCH_CHECKLIST_DEFAULTS } from '../lib/listingLaunchSop';

describe('sopInterview', () => {
  it('exposes Listing Launch example step lines matching checklist defaults', () => {
    const lines = listingLaunchExampleStepLines();
    expect(lines.length).toBe(NEST_LISTING_LAUNCH_CHECKLIST_DEFAULTS.length);
    expect(lines[0]).toContain('Exclusive Right to Sell');
  });

  it('builds sopForm from interview answers into Studio shape', () => {
    const form = buildSopFormFromInterview(
      {
        department: 'Operations',
        title: 'Yard sign install',
        purpose: 'Get yard signs installed or confirmed for pickup.',
        trigger: 'Ops task created for yard sign.',
        ownerRole: 'admin_coordinator',
        systemsUsed: ['Sign Inventory Desk', 'SMS / Phone'],
        stepLines: ['Confirm address', 'Dispatch vendor', 'Photo proof'],
        completionEvidence: 'Photo of installed sign or pickup confirmation',
        usedListingLaunchExample: false,
      },
      'ws_wilmington'
    );
    expect(form.title).toBe('Yard sign install');
    expect(form.department).toBe('Operations');
    expect(form.status).toBe('draft');
    expect(form.workspaceId).toBe('ws_wilmington');
    expect((form.steps as any[]).length).toBe(3);
    expect((form.completionEvidence as any).description).toContain('Photo');
    expect(form.systemsUsed as string[]).toEqual(['Sign Inventory Desk', 'SMS / Phone']);
  });

  it('seeds Listing Launch example into form when flagged with empty steps', () => {
    const form = buildSopFormFromInterview(
      {
        department: LISTING_LAUNCH_INTERVIEW_EXAMPLE.department,
        title: LISTING_LAUNCH_INTERVIEW_EXAMPLE.title,
        purpose: LISTING_LAUNCH_INTERVIEW_EXAMPLE.purpose,
        trigger: LISTING_LAUNCH_INTERVIEW_EXAMPLE.trigger,
        ownerRole: LISTING_LAUNCH_INTERVIEW_EXAMPLE.ownerRole,
        systemsUsed: [],
        stepLines: [],
        completionEvidence: LISTING_LAUNCH_INTERVIEW_EXAMPLE.completionEvidence,
        usedListingLaunchExample: true,
      },
      'ws_wilmington'
    );
    expect((form.steps as any[]).length).toBe(NEST_LISTING_LAUNCH_CHECKLIST_DEFAULTS.length);
    expect(String(form.changeSummary)).toMatch(/Listing Launch/);
    expect((form.systemsUsed as string[]).length).toBeGreaterThan(0);
    expect(listingLaunchExampleSystemsUsed().length).toBeGreaterThan(0);
  });
});
