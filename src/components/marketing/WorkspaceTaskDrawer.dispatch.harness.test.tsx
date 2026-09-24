/**
 * @vitest-environment happy-dom
 * Drawer dispatch-check must wait for a recipient, ignore stale responses,
 * and never send an upload or attachment URL as proof.
 */
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { WorkspaceTaskDrawer } from './WorkspaceTaskDrawer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const UPLOAD = '/uploads/1789593612358_Test_marcusgmail.png';

const melissa = {
  id: 'dir_melissa_gagliardi_33',
  name: 'Melissa Gagliardi',
  role: 'marketing_director',
  email: 'melissa.gagliardi@nestrealty.com',
  permissions: ['marketing.final_approval', 'marketing.approve'],
};

function task(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tsk_drawer_dispatch_guard',
    campaignId: 'tsk_drawer_dispatch_guard',
    propertyAddress: '9 QA Gate Lane, Wilmington, NC',
    agentName: 'Marcus Aman',
    agentPhone: '(252) 717-0595',
    agentEmail: '',
    agentRole: 'Requester',
    packageType: 'Brochure',
    priority: 'normal',
    status: 'in_production',
    proofVersion: 1,
    targetSla: 'Deadline not specified',
    receivedAt: 'Today',
    assignedTo: 'Eduardo Lovo',
    assignedToId: 'dir_eduardo_lovo_73',
    reviewOwnerId: 'dir_melissa_gagliardi_33',
    reviewOwnerName: 'Melissa Gagliardi',
    proofUrl: UPLOAD,
    photos: [],
    attachments: [{ url: UPLOAD, filename: 'intake.png' }],
    category: 'print',
    ...overrides,
  };
}

type PendingCheck = {
  recipientEmail: string;
  proofUrl?: string;
  url: string;
  resolve: (data: Record<string, unknown>) => void;
};

function installFetch() {
  const checks: PendingCheck[] = [];
  const fetchMock = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const body = JSON.parse(String(init?.body || '{}'));
    if (url.includes('dispatch-check') || url.includes('ensure-drive')) {
      return new Promise((resolve) => {
        checks.push({
          url,
          recipientEmail: String(body.recipientEmail || ''),
          proofUrl: body.proofUrl,
          resolve: (data) => resolve({
            ok: true,
            status: 200,
            json: async () => data,
          }),
        });
      });
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };
  (globalThis as { fetch: typeof fetch }).fetch = fetchMock as typeof fetch;
  return checks;
}

describe('WorkspaceTaskDrawer dispatch-check', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container?.remove();
    root = null;
    container = null;
  });

  async function renderDrawer(activeTask: ReturnType<typeof task>, extra: Record<string, unknown> = {}) {
    if (!container) {
      container = document.createElement('div');
      document.body.appendChild(container);
      root = createRoot(container);
    }
    await act(async () => {
      root?.render(
        React.createElement(WorkspaceTaskDrawer, {
          isOpen: true,
          onClose: () => {},
          activeTask,
          currentUser: melissa,
          ...extra,
        })
      );
    });
    await act(async () => {
      await Promise.resolve();
    });
  }

  it('does not dispatch-check an empty recipient, ignores a stale verdict, and never sends an upload as proof', async () => {
    const checks = installFetch();
    await renderDrawer(task({ agentEmail: '' }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(checks.filter((call) => call.url.includes('dispatch-check') && !call.recipientEmail)).toEqual([]);
    expect(checks.some((call) => call.url.includes('dispatch-check'))).toBe(false);

    await renderDrawer(task({ agentEmail: 'marcus@shapework.co' }));
    await act(async () => {
      await Promise.resolve();
    });
    const first = checks.find((call) => call.recipientEmail === 'marcus@shapework.co');
    expect(first, 'dispatch-check starts once the recipient is known').toBeTruthy();

    await renderDrawer(task({ agentEmail: 'marcus.aman@gmail.com' }));
    await act(async () => {
      await Promise.resolve();
    });
    const current = checks.find((call) => call.recipientEmail === 'marcus.aman@gmail.com');
    expect(current).toBeTruthy();

    await act(async () => {
      current?.resolve({
        allowed: true,
        reason: '',
        recipientStatus: 'allowlisted_prove',
        recipientId: null,
        effectiveTo: ['marcus.aman@gmail.com'],
        effectiveCc: [],
      });
      await Promise.resolve();
    });
    await act(async () => {
      first?.resolve({
        allowed: false,
        reason: 'This recipient is not allowed.',
        recipientStatus: 'unresolved',
        recipientId: null,
        effectiveTo: [],
        effectiveCc: [],
      });
      await Promise.resolve();
    });

    const button = document.querySelector('[data-action="Approve & send to agent"]');
    expect(button?.getAttribute('data-recipient-status')).toBe('allowlisted_prove');

    const outbound = checks.filter((call) => call.url.includes('dispatch-check') || call.url.includes('ensure-drive'));
    expect(outbound.length).toBeGreaterThan(0);
    for (const call of outbound) {
      expect(String(call.proofUrl || ''), call.url).not.toContain('/uploads/');
      expect(String(call.proofUrl || '')).not.toBe(UPLOAD);
    }
  });

  it('passes no photo or attachment proof to the notify modal when nothing was pasted', async () => {
    const photo = 'https://cdn.example/listing-photo.jpg';
    const attachment = '/uploads/1789593612358_brochure.pdf';
    const calls: Array<{ url: string; proofUrl?: string }> = [];
    (globalThis as { fetch: typeof fetch }).fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const body = JSON.parse(String(init?.body || '{}'));
      calls.push({ url, proofUrl: body.proofUrl });
      return { ok: true, status: 200, json: async () => ({}) };
    }) as typeof fetch;

    let received: { intent?: string; approvePayload?: { proofUrl?: string } } | null = null;
    await renderDrawer(task({
      agentEmail: 'marcus.aman@gmail.com',
      proofUrl: '',
      photos: [{ id: 'photo_1', url: photo, name: 'front.jpg' }],
      attachments: [{ url: attachment, name: 'brochure.pdf' }],
    }), {
      dispatchVerdict: {
        allowed: true,
        reason: '',
        recipientStatus: 'allowlisted_prove',
        recipientId: null,
        effectiveTo: ['marcus.aman@gmail.com'],
        effectiveCc: [],
      },
      onAskRequester: (_task: unknown, opts?: { intent?: string; approvePayload?: { proofUrl?: string } }) => {
        received = opts || null;
      },
    });

    const button = document.querySelector('[data-action="Approve & send to agent"]') as HTMLButtonElement | null;
    expect(button, 'Approve & Notify is available without a pasted link').toBeTruthy();
    await act(async () => {
      button?.click();
    });

    expect(received?.intent).toBe('delivery_complete');
    expect(received?.approvePayload?.proofUrl).toBeFalsy();
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) {
      expect(call.proofUrl, call.url).toBeFalsy();
    }
  });
});