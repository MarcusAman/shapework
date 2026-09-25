/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AskRequesterQuestionsModal } from './AskRequesterQuestionsModal';
import { driveCreateFailureReason } from '../../../server/services/evaluateDispatch';

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

  async function renderModal(campaign = freshCampaign()) {
    if (!container) {
      container = document.createElement('div');
      document.body.appendChild(container);
      root = createRoot(container);
    }
    await act(async () => {
      root?.render(
        React.createElement(AskRequesterQuestionsModal, {
          isOpen: true,
          onClose: () => {},
          intent: 'delivery_complete',
          isOutboundEnabled: true,
          campaign,
        })
      );
    });
    await act(async () => {
      await Promise.resolve();
    });
  }

  it('opens Notify, ensure-drive succeeds, rechecks, and enables Send', async () => {
    const pending = installFetch();
    await renderModal();
    expect(pending.checks, 'dispatch-check waits for ensure-drive').toHaveLength(0);

    await act(async () => {
      pending.releaseEnsure();
      await Promise.resolve();
      await Promise.resolve();
    });
    const allowed = pending.checks.find((check) => check.driveFolderUrl === FOLDER);
    expect(allowed, 'dispatch-check uses the ensure-drive folder').toBeTruthy();
    expect(sendButton()?.disabled).toBe(true);

    await act(async () => {
      allowed?.resolve(verdict(true));
    });
    expect(sendButton()?.disabled).toBe(false);
    expect(sendButton()?.getAttribute('data-send-ready')).toBe('true');
    expect(document.body.textContent).toContain("No one is CC'd.");
  });

  it('keeps the newer verdict when an older dispatch-check responds late', async () => {
    const pending = installFetch();
    const campaign = freshCampaign();
    await renderModal(campaign);

    await act(async () => {
      pending.releaseEnsure();
      await Promise.resolve();
      await Promise.resolve();
    });
    const first = pending.checks.find((check) => check.driveFolderUrl === FOLDER);
    expect(first).toBeTruthy();

    await renderModal({
      ...campaign,
      approvePayload: { proofUrl: 'https://drive.google.com/drive/folders/1AbCotherFolder111xyz' },
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    const newer = pending.checks[pending.checks.length - 1];
    expect(newer).toBeTruthy();
    expect(newer).not.toBe(first);

    await act(async () => {
      newer?.resolve(verdict(true));
    });
    expect(sendButton()?.disabled).toBe(false);

    await act(async () => {
      first?.resolve(verdict(false));
    });
    expect(sendButton()?.disabled).toBe(false);
    expect(sendButton()?.getAttribute('data-send-ready')).toBe('true');
    expect(document.body.textContent).not.toContain(BLOCKED);
  });

  it('shows the exact not-connected Drive reason and does not wrap it', async () => {
    const exact = "Google Drive isn't connected for this workspace.";
    const reason = driveCreateFailureReason(exact);
    (globalThis as { fetch: typeof fetch }).fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('ensure-drive')) {
        return jsonResponse({ success: false, reason, error: reason, code: 'DRIVE_FOLDER_CREATE_FAILED' }, 400);
      }
      if (url.includes('dispatch-check')) {
        return jsonResponse({ ...verdict(false), reason: exact }, 400);
      }
      return jsonResponse({});
    }) as typeof fetch;

    await renderModal();
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(document.body.textContent).toContain(exact);
    expect(document.body.textContent).not.toContain("Couldn't create the Drive folder");
  });

  it('checks internal finished proof without creating a Drive folder', async () => {
    const photo = '/uploads/1789593612358_Test_marcusgmail.png';
    const calls: Array<{ url: string; proofUrl?: string }> = [];
    (globalThis as { fetch: typeof fetch }).fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const body = JSON.parse(String(init?.body || '{}'));
      calls.push({ url, proofUrl: body.proofUrl });
      if (url.includes('ensure-drive')) {
        return jsonResponse({ linkable: false, reason: 'Drive folder is empty.' }, 400);
      }
      if (url.includes('dispatch-check')) {
        return jsonResponse(verdict(false), 400);
      }
      return jsonResponse({});
    }) as typeof fetch;

    await renderModal({
      ...freshCampaign(),
      proofUrl: photo,
      approvePayload: { proofUrl: photo },
      attachments: [{ url: photo, filename: 'Test.png' }],
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    const proofCalls = calls.filter((call) => call.url.includes('ensure-drive') || call.url.includes('dispatch-check'));
    expect(proofCalls.length).toBeGreaterThan(0);
    expect(proofCalls.some(call => call.url.includes('ensure-drive'))).toBe(false);
    expect(proofCalls.filter(call => call.url.includes('dispatch-check')).every(call => call.proofUrl === photo)).toBe(true);
  });

  it('sends proofUrl when the user pasted an https link', async () => {
    const pasted = 'https://drive.google.com/file/d/1UserPastedProof999xyz/view';
    const calls: Array<{ url: string; proofUrl?: string }> = [];
    (globalThis as { fetch: typeof fetch }).fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const body = JSON.parse(String(init?.body || '{}'));
      calls.push({ url, proofUrl: body.proofUrl });
      if (url.includes('ensure-drive')) return jsonResponse({ linkable: true, driveFolderUrl: FOLDER });
      if (url.includes('dispatch-check')) return jsonResponse(verdict(true));
      return jsonResponse({});
    }) as typeof fetch;

    await renderModal({
      ...freshCampaign(),
      approvePayload: { proofUrl: pasted },
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    const withProof = calls.filter((call) =>
      (call.url.includes('ensure-drive') || call.url.includes('dispatch-check')) && call.proofUrl === pasted
    );
    expect(withProof.length).toBeGreaterThan(0);
  });

  it('does not call dispatch-check until the recipient email is known', async () => {
    const checks: string[] = [];
    (globalThis as { fetch: typeof fetch }).fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const body = JSON.parse(String(init?.body || '{}'));
      if (url.includes('dispatch-check')) checks.push(String(body.recipientEmail || ''));
      if (url.includes('ensure-drive')) return jsonResponse({ linkable: true, driveFolderUrl: FOLDER });
      return jsonResponse(verdict(true));
    }) as typeof fetch;

    const campaign = { ...freshCampaign(), agentEmail: '', email: '' };
    await renderModal(campaign);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(checks).toEqual([]);

    await renderModal({ ...campaign, agentEmail: 'marcus.aman@gmail.com' });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(checks).toEqual(['marcus.aman@gmail.com']);
  });

  it('hides the paste fallback when Google Drive is not connected', async () => {
    const exact = "Google Drive isn't connected for this workspace.";
    (globalThis as { fetch: typeof fetch }).fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('ensure-drive')) {
        return jsonResponse({ success: false, reason: exact, error: exact }, 400);
      }
      return jsonResponse({ ...verdict(false), reason: exact }, 400);
    }) as typeof fetch;
    await renderModal();
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(document.body.textContent).toContain(exact);
    expect(document.body.textContent).not.toContain('retry Send or paste a link');
  });

  it('mentions the Drive link in the draft only when a Drive link is rendered, and says reply to this email', async () => {
    (globalThis as { fetch: typeof fetch }).fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('ensure-drive')) {
        return jsonResponse({ success: false, reason: 'Drive folder is empty.', error: 'Drive folder is empty.' }, 400);
      }
      return jsonResponse(verdict(false), 400);
    }) as typeof fetch;
    await renderModal();
    await act(async () => {
      await Promise.resolve();
    });
    const emptyDraft = (document.querySelector('[data-testid="ask-agent-message-textarea"]') as HTMLTextAreaElement).value;
    expect(emptyDraft).not.toContain('Click the Google Drive link below');
    expect(emptyDraft).toContain('Reply to this email');
    expect(emptyDraft).not.toContain('Respond to this text');

    (globalThis as { fetch: typeof fetch }).fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('ensure-drive')) return jsonResponse({ linkable: true, driveFolderUrl: FOLDER });
      return jsonResponse(verdict(true));
    }) as typeof fetch;
    await renderModal({ ...freshCampaign(), id: 'tsk_modal_with_drive', taskId: 'tsk_modal_with_drive' });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(document.querySelector(`a[href="${FOLDER}"]`)).toBeTruthy();
    const linkedDraft = (document.querySelector('[data-testid="ask-agent-message-textarea"]') as HTMLTextAreaElement).value;
    expect(linkedDraft).toContain('Click the Google Drive link below');
    expect(linkedDraft).toContain('Reply to this email');
  });

  it('does not render Completed assets when there is no folder or asset', async () => {
    (globalThis as { fetch: typeof fetch }).fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('ensure-drive')) {
        return jsonResponse({ success: false, reason: 'Drive folder is empty.', linkable: false }, 400);
      }
      return jsonResponse(verdict(false), 400);
    }) as typeof fetch;
    await renderModal({
      ...freshCampaign(),
      attachments: [],
      photos: [],
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(document.body.textContent).not.toMatch(/Completed assets/i);
  });
});
