/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AskRequesterQuestionsModal } from './AskRequesterQuestionsModal';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const FOLDER = 'https://drive.google.com/drive/folders/1AbCrealFolder999xyz';
const BLOCKED = 'No Drive folder and no file to send.';

function freshCampaign() {
  return {
    id: 'tsk_modal_recheck',
    taskId: 'tsk_modal_recheck',
    agentName: 'Marcus Aman',
    agentEmail: 'marcus.aman@gmail.com',
    phone: '(252) 717-0595',
    propertyAddress: '7174 Peachtree Way',
    attachments: [{ url: '/uploads/1789593612358_Test_marcusgmail.png', filename: 'Test.png' }],
  };
}

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return {
    ok: status < 400,
    status,
    json: async () => data,
  };
}

function verdict(allowed: boolean) {
  return {
    allowed,
    reason: allowed ? '' : BLOCKED,
    recipientStatus: 'allowlisted_prove',
    recipientId: null,
    effectiveTo: ['marcus.aman@gmail.com'],
    effectiveCc: [] as string[],
  };
}

type PendingCheck = {
  driveFolderUrl: string;
  resolve: (data: ReturnType<typeof verdict>) => void;
};

function installFetch() {
  const checks: PendingCheck[] = [];
  let releaseEnsure: (() => void) | null = null;
  const fetchMock = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes('ensure-drive')) {
      return new Promise((resolve) => {
        releaseEnsure = () => resolve(jsonResponse({ linkable: true, driveFolderUrl: FOLDER }));
      });
    }
    if (url.includes('dispatch-check')) {
      const body = JSON.parse(String(init?.body || '{}'));
      return new Promise((resolve) => {
        checks.push({
          driveFolderUrl: String(body.driveFolderUrl || ''),
          resolve: (data) => resolve(jsonResponse(data, data.allowed ? 200 : 400)),
        });
      });
    }
    return jsonResponse({});
  };
  (globalThis as { fetch: typeof fetch }).fetch = fetchMock as typeof fetch;
  return {
    checks,
    releaseEnsure: () => {
      if (!releaseEnsure) throw new Error('ensure-drive was not called');
      releaseEnsure();
    },
  };
}

function sendButton() {
  return document.querySelector('[data-testid="ask-agent-submit-btn"]') as HTMLButtonElement | null;
}

describe('Notify modal rechecks dispatch after Drive and ignores stale verdicts', () => {
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

  async function renderModal() {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root?.render(
        React.createElement(AskRequesterQuestionsModal, {
          isOpen: true,
          onClose: () => {},
          intent: 'delivery_complete',
          isOutboundEnabled: true,
          campaign: freshCampaign(),
        })
      );
    });
    await act(async () => {
      await Promise.resolve();
    });
  }

  it('enables Send after ensure-drive returns a folder and dispatch-check allows it', async () => {
    const pending = installFetch();
    await renderModal();

    const blocked = pending.checks.find((check) => !check.driveFolderUrl);
    expect(blocked, 'dispatch-check before Drive').toBeTruthy();
    await act(async () => {
      blocked?.resolve(verdict(false));
    });
    expect(sendButton()?.disabled).toBe(true);
    expect(document.body.textContent).toContain(BLOCKED);

    await act(async () => {
      pending.releaseEnsure();
      await Promise.resolve();
      await Promise.resolve();
    });
    const allowed = pending.checks.find((check) => check.driveFolderUrl === FOLDER);
    expect(allowed, 'dispatch-check uses the ensure-drive folder').toBeTruthy();
    await act(async () => {
      allowed?.resolve(verdict(true));
    });
    expect(sendButton()?.disabled).toBe(false);
    expect(sendButton()?.getAttribute('data-send-ready')).toBe('true');
    expect(document.body.textContent).toContain("No one is CC'd.");
  });

  it('keeps the newer verdict when an older dispatch-check responds late', async () => {
    const pending = installFetch();
    await renderModal();

    const blocked = pending.checks.find((check) => !check.driveFolderUrl);
    expect(blocked).toBeTruthy();
    await act(async () => {
      pending.releaseEnsure();
      await Promise.resolve();
      await Promise.resolve();
    });
    const allowed = pending.checks.find((check) => check.driveFolderUrl === FOLDER);
    expect(allowed).toBeTruthy();

    await act(async () => {
      allowed?.resolve(verdict(true));
    });
    expect(sendButton()?.disabled).toBe(false);

    await act(async () => {
      blocked?.resolve(verdict(false));
    });
    expect(sendButton()?.disabled).toBe(false);
    expect(sendButton()?.getAttribute('data-send-ready')).toBe('true');
    expect(document.body.textContent).not.toContain(BLOCKED);
  });
});
