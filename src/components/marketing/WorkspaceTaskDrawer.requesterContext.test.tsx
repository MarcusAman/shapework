/** @vitest-environment happy-dom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceTaskDrawer } from './WorkspaceTaskDrawer';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const reviewer = { id: 'dir_melissa_gagliardi_33', name: 'Melissa Gagliardi', role: 'marketing_director', permissions: ['marketing.final_approval'] };
const task = (id = 'email_brochure') => ({ id, requestId: `request_${id}`, workspaceId: 'ws_wilmington', propertyAddress: 'Test property', agentName: 'Marcus Aman', agentEmail: '', packageType: 'Tri-fold brochure', status: 'in_progress', reviewState: 'awaiting_review', assignedTo: 'Eduardo Lovo', assignedToId: 'dir_eduardo_lovo_73', reviewOwnerId: reviewer.id, reviewOwnerName: reviewer.name, photos: [], requestedAssets: [] });
const reply = (data: unknown) => ({ ok: true, status: 200, json: async () => data });
let root: Root; let container: HTMLDivElement;
afterEach(() => { act(() => root?.unmount()); container?.remove(); vi.unstubAllGlobals(); });
async function render(activeTask: ReturnType<typeof task>) {
  if (!container?.isConnected) { container = document.createElement('div'); document.body.append(container); root = createRoot(container); }
  await act(async () => { root.render(<WorkspaceTaskDrawer isOpen activeTask={activeTask as any} currentUser={reviewer} onClose={() => {}} />); });
}

describe('Requester contact from the exact task detail', () => {
  it('checks the intake email from the parent request when the task row has no email', async () => {
    const checks: any[] = [];
    const current = task();
    vi.stubGlobal('fetch', vi.fn(async (input, init) => {
      const url = String(input);
      if (url.endsWith(`/tasks/${current.id}`)) return reply({ success: true, task: current, request: { id: current.requestId, workspaceId: current.workspaceId, agentName: 'Marcus Aman', agentEmail: 'marcus.aman@gmail.com' } });
      if (url.endsWith('/dispatch-check')) { checks.push(JSON.parse(init.body)); return reply({ recipientStatus: 'allowlisted_prove', allowed: false, reason: 'The finished asset is missing.' }); }
      return reply({});
    }));
    await render(current);
    expect(checks).toHaveLength(1);
    expect(checks[0].recipientEmail).toBe('marcus.aman@gmail.com');
    expect(container.textContent).not.toContain('Confirm requester first');
  });

  it('does not borrow a recipient from another request or workspace', async () => {
    const current = task(); const checks: any[] = [];
    vi.stubGlobal('fetch', vi.fn(async (input, init) => {
      const url = String(input);
      if (url.endsWith(`/tasks/${current.id}`)) return reply({ success: true, task: current, request: { id: 'different_request', workspaceId: 'another_workspace', agentEmail: 'wrong@example.com' } });
      if (url.endsWith('/dispatch-check')) checks.push(JSON.parse(init.body));
      return reply({});
    }));
    await render(current);
    expect(checks).toEqual([]);
    expect(container.textContent).toContain('Confirm requester first');
  });

  it('ignores task detail that arrives after switching to another task', async () => {
    const first = task(); const next = task('another_task'); const checks: any[] = [];
    let resolveFirst: (value: any) => void = () => {};
    vi.stubGlobal('fetch', vi.fn(async (input, init) => {
      const url = String(input);
      if (url.endsWith(`/tasks/${first.id}`)) return new Promise(resolve => { resolveFirst = resolve; });
      if (url.endsWith('/dispatch-check')) checks.push(JSON.parse(init.body));
      return reply({});
    }));
    await render(first); await render(next);
    await act(async () => { resolveFirst(reply({ success: true, task: first, request: { id: first.requestId, workspaceId: first.workspaceId, agentEmail: 'marcus.aman@gmail.com' } })); });
    expect(checks).toEqual([]);
    expect(container.textContent).toContain('Confirm requester first');
  });
  it('does not retain recipient confirmation when the next task has no contact', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input) => String(input).endsWith('/dispatch-check')
      ? reply({ recipientStatus: 'allowlisted_prove', allowed: false, reason: 'Missing proof' }) : reply({})));
    await render({ ...task(), agentEmail: 'marcus.aman@gmail.com' });
    expect(container.textContent).not.toContain('Confirm requester first');
    await render(task('missing_contact'));
    expect(container.textContent).toContain('Confirm requester first');
  });

  it('keeps approval disabled when review history exists but no finished proof is saved', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input) => String(input).endsWith('/dispatch-check')
      ? reply({ recipientStatus: 'allowlisted_prove', allowed: false, reason: 'Missing proof' }) : reply({})));
    await render({ ...task(), agentEmail: 'marcus.aman@gmail.com', proofVersion: 4, proofHistory: [{ proofUrl: 'https://drive.google.com/file/d/old-placeholder/view' }] } as any);
    const approve = container.querySelector<HTMLButtonElement>('[data-action="Approve & send to agent"]');
    expect(approve?.disabled).toBe(true);
    expect(approve?.title).toBe('Upload a finished proof before approving delivery.');
  });

});
