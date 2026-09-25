/** @vitest-environment happy-dom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceTaskDrawer } from './WorkspaceTaskDrawer';

vi.mock('./ProofUploadWizard', () => ({ ProofUploadWizard: ({ onAssetConfirmed }: any) => {
  const [count, setCount] = React.useState(0);
  return <button data-testid="fixture-upload" onClick={() => {
    const id = count === 0 ? 'asset_one' : 'asset_two';
    onAssetConfirmed({ id, previewUrl: `/uploads/${id}.png`, fileName: 'brochure.png', mimeType: 'image/png', deliverableName: 'Brochure', version: 1 });
    setCount(count + 1);
  }}>Fixture uploaded file</button>;
} }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const task: any = { id: 'draft_fixture', workspaceId: 'ws_a', propertyAddress: '414 Fixture Street',
  title: 'Brochure', packageType: 'Brochure', status: 'in_progress', category: 'print', proofVersion: 0,
  assignedToId: 'eduardo', assignedTo: 'Eduardo', reviewOwnerId: 'melissa', reviewOwnerName: 'Melissa', photos: [],
  agentName: 'Unconfirmed requester', agentEmail: '', proofUrl: '', notes: '' };
const actor = { id: 'melissa', name: 'Melissa', role: 'marketing_director' };

describe('drawer saves draft independently of outbound eligibility', () => {
  let root: Root | undefined; let container: HTMLDivElement | undefined;
  afterEach(() => { act(() => root?.unmount()); container?.remove(); root = undefined; container = undefined; vi.unstubAllGlobals(); });
  async function render(activeTask = task) {
    if (!container) { container = document.createElement('div'); document.body.append(container); root = createRoot(container); }
    await act(async () => root!.render(<WorkspaceTaskDrawer isOpen onClose={() => {}} activeTask={activeTask} currentUser={actor} />));
  }
  function mockApi(options: { failed?: boolean; pending?: boolean; savedTask?: any } = {}) {
    const writes: any[] = []; let resolveSave: ((value: any) => void) | undefined;
    const reply = (data: any, ok = true) => ({ ok, status: ok ? 200 : 503, json: async () => data });
    const fetchMock = vi.fn(async (url: any, init?: any) => {
      if (String(url).endsWith('/draft')) {
        const body = JSON.parse(init.body); writes.push(body);
        const result = reply({ success: !options.failed, error: options.failed ? 'Storage unavailable' : undefined,
          task: { ...task, routingSnapshot: { proofDraft: { proofUrl: body.proofUrl, notes: body.notes, assets: body.stagedAssets, savedAt: new Date().toISOString(), savedById: 'melissa', baseProofVersion: 0, baseProofUrl: '' } } } }, !options.failed);
        return options.pending ? new Promise(resolve => { resolveSave = resolve; }).then(() => result) : result;
      }
      if (String(url) === `/api/marketing/tasks/${task.id}`) return reply({ success: true, task: options.savedTask || task });
      return reply({ allowed: false, recipientStatus: 'unresolved' });
    });
    vi.stubGlobal('fetch', fetchMock);
    return { writes, fetchMock, release: () => resolveSave?.(null) };
  }
  async function upload() { await act(async () => (container!.querySelector('[data-testid="fixture-upload"]') as HTMLButtonElement).click()); }
  function saveButton() { return container!.querySelector('[data-testid="save-task-draft"]') as HTMLButtonElement | null; }

  it('does not label a newly staged file Saved and allows saving without a confirmed recipient', async () => {
    const api = mockApi(); await render(); await upload();
    expect(container!.querySelector('[data-testid="draft-save-status"]')?.textContent).toContain('Unsaved changes');
    expect(saveButton()).not.toBeNull(); expect(saveButton()!.disabled).toBe(false);
    await act(async () => saveButton()!.click());
    expect(api.writes).toHaveLength(1);
    expect(api.writes[0].stagedAssets.map((a: any) => a.id)).toEqual(['asset_one']);
    expect(container!.querySelector('[data-testid="draft-save-status"]')?.textContent).toContain('Saved');
    expect(api.fetchMock.mock.calls.some(([url]) => /approve-and-dispatch|submit-proof|deliver$/.test(String(url)))).toBe(false);
  });

  it('retains staged files and an honest unsaved error after a failed save', async () => {
    mockApi({ failed: true }); await render(); await upload();
    expect(saveButton()).not.toBeNull();
    await act(async () => saveButton()!.click());
    expect(container!.textContent).toContain('Storage unavailable');
    expect(container!.textContent).toContain('brochure.png');
    expect(container!.querySelector('[data-testid="draft-save-status"]')?.textContent).toContain('Save failed');
    expect(saveButton()!.disabled).toBe(false);
  });

  it('restores all files and notes from the persisted draft on reopening', async () => {
    const savedTask = { ...task, routingSnapshot: { proofDraft: { proofUrl: '', notes: 'Saved design notes',
      assets: ['one', 'two'].map(id => ({ id, fileName: `${id}.png`, previewUrl: `/uploads/${id}.png`, deliverableName: 'Brochure', mimeType: 'image/png' })),
      savedAt: '2026-09-25T12:00:00Z', savedById: 'melissa', baseProofVersion: 0, baseProofUrl: '' } } };
    mockApi({ savedTask }); await render();
    expect(container!.textContent).toContain('one.png'); expect(container!.textContent).toContain('two.png');
    expect([...container!.querySelectorAll('textarea')].some(textarea => textarea.value === 'Saved design notes')).toBe(true);
    expect(saveButton()!.disabled).toBe(true);
  });

  it('does not lose edits made while a draft save is pending', async () => {
    const api = mockApi({ pending: true }); await render(); await upload();
    expect(saveButton()).not.toBeNull();
    await act(async () => saveButton()!.click());
    await upload();
    await act(async () => api.release());
    expect(container!.querySelector('[data-testid="draft-save-status"]')?.textContent).toContain('Unsaved changes');
    expect(container!.querySelectorAll('img[src="/uploads/asset_one.png"]')).toHaveLength(1);
    expect(container!.querySelectorAll('img[src="/uploads/asset_two.png"]')).toHaveLength(1);
    expect(saveButton()!.disabled).toBe(false);
  });
});
