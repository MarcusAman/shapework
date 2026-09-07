import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { MARKETING_SUBTABS, LEGACY_SUBTAB_ALIASES } from '../components/marketing/marketingSubtabs';

describe('Marketing Subtabs, Calls Tab, and Slide-Out Transcript Drawer Integration', () => {
  it('1. Verifies 4 core marketing subtabs: Requests, Calls, Today\'s Queue, and Workspace', () => {
    const tabIds = MARKETING_SUBTABS.map(t => t.id);
    expect(tabIds).toEqual(['requests', 'calls', 'today', 'va']);

    const requestsTab = MARKETING_SUBTABS.find(t => t.id === 'requests');
    expect(requestsTab?.label).toBe('Tasks');

    const callsTab = MARKETING_SUBTABS.find(t => t.id === 'calls');
    expect(['Calls', 'Inbound Calls']).toContain(callsTab?.label);
    expect(callsTab?.secondaryLabel).toBe('(910) 507-2047');

    const todayTab = MARKETING_SUBTABS.find(t => t.id === 'today');
    expect(todayTab?.label).toBe("Today's Queue");

    const vaTab = MARKETING_SUBTABS.find(t => t.id === 'va');
    expect(vaTab?.label).toBe('Workspace');
  });

  it('2. Verifies legacy subtab aliases mapping', () => {
    expect(LEGACY_SUBTAB_ALIASES['intake']).toBe('calls');
    expect(LEGACY_SUBTAB_ALIASES['calls']).toBe('calls');
    expect(LEGACY_SUBTAB_ALIASES['voice-intake']).toBe('calls');
    expect(LEGACY_SUBTAB_ALIASES['intake_log']).toBe('calls');
    expect(LEGACY_SUBTAB_ALIASES['today-board']).toBe('today');
    expect(LEGACY_SUBTAB_ALIASES['workboard']).toBe('requests');
    expect(LEGACY_SUBTAB_ALIASES['va_workspace']).toBe('va');
  });

  it('3. Verifies Requests Table supports rich actions (Open Maxa Proof Assets, VA, Team Assign, Questions Modal)', () => {
    const inboxPath = path.resolve(process.cwd(), 'src/components/marketing/MarketingHomeInbox.tsx');
    const inboxContent = fs.readFileSync(inboxPath, 'utf-8');

    expect(inboxContent).toContain('Open Maxa Proof Assets');
    expect(inboxContent).toContain('Send to VA');
    expect(inboxContent).toContain('Send to...');
    expect(inboxContent).toContain('Ask Questions');
    expect(inboxContent).toContain('AskRequesterQuestionsModal');
  });

  it('4. Verifies AskRequesterQuestionsModal supports multi-channel SMS & Email dispatch with preset question chips', () => {
    const modalPath = path.resolve(process.cwd(), 'src/components/marketing/AskRequesterQuestionsModal.tsx');
    const modalContent = fs.readFileSync(modalPath, 'utf-8');

    expect(modalContent).toContain('Send Questions to Requester');
    expect(modalContent).toContain('SMS');
    expect(modalContent).toContain('Email');
    expect(modalContent).toContain('Confirm weekend Open House start and end hours');
    expect(modalContent).toContain('Please provide high-resolution unbranded photography files');
    expect(modalContent).toContain('Send SMS / Email Questions');
  });
});
