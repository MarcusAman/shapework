/** @vitest-environment happy-dom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProofLightboxViewer, type LightboxAssetItem } from './ProofLightboxViewer';
import { WorkspaceTaskDrawer } from './WorkspaceTaskDrawer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('Task asset previews', () => {
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    act(() => root?.unmount());
    container?.remove();
    root = undefined;
    container = undefined;
    vi.unstubAllGlobals();
  });

  async function render(element: React.ReactNode) {
    if (!container) {
      container = document.createElement('div');
      document.body.appendChild(container);
      root = createRoot(container);
    }
    await act(async () => { root!.render(element); });
  }

  const item: LightboxAssetItem = {
    title: 'Brochure proof', previewUrl: '/uploads/missing-proof.png',
  };
  const preview = (asset = item) => <ProofLightboxViewer isOpen item={asset} onClose={() => {}} />;
  const failImage = () => act(() => {
    const image = container!.querySelector('img');
    expect(image).not.toBeNull();
    image!.dispatchEvent(new Event('error'));
  });

  it('replaces a failed lightbox image with an honest message while preserving the file link', async () => {
    await render(preview());
    failImage();
    expect(container!.textContent).toContain('Preview unavailable');
    expect(container!.querySelector('img')).toBeNull();
    expect(container!.querySelector('[title="Download asset"]')?.getAttribute('href')).toBe(item.previewUrl);
  });

  it('allows retrying the same file after a transient image failure', async () => {
    await render(preview());
    const originalImage = container!.querySelector('img');
    failImage();
    const retry = [...container!.querySelectorAll('button')].find(button => button.textContent === 'Try again');
    expect(retry).toBeDefined();
    act(() => retry!.click());
    const retriedImage = container!.querySelector('img');
    expect(retriedImage).not.toBe(originalImage);
    expect(retriedImage?.getAttribute('src')).toBe(item.previewUrl);
    expect(container!.textContent).not.toContain('Preview unavailable');
  });

  it('clears the failure when a different image is opened', async () => {
    await render(preview());
    failImage();
    expect(container!.textContent).toContain('Preview unavailable');
    await render(preview({ title: 'Listing photo', previewUrl: '/uploads/available-photo.png' }));
    expect(container!.querySelector('img')?.getAttribute('src')).toBe('/uploads/available-photo.png');
    expect(container!.textContent).not.toContain('Preview unavailable');
  });

  async function renderDrawer() {
    // Every API is mocked: this regression never loads real tasks or dispatches mail.
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) })));
    await render(<WorkspaceTaskDrawer isOpen onClose={() => {}} currentUser={{
      id: 'dir_melissa_gagliardi_33', name: 'Melissa Gagliardi', role: 'marketing_director',
      permissions: ['marketing.final_approval', 'marketing.approve'],
    }} activeTask={{
      id: 'local_asset_preview_fixture', propertyAddress: '10 Local Fixture Lane',
      agentName: 'Requester', agentEmail: '', packageType: 'Brochure', priority: 'normal',
      status: 'in_progress', reviewState: 'awaiting_review', proofVersion: 4,
      assignedTo: 'Eduardo Lovo', assignedToId: 'dir_eduardo_lovo_73',
      reviewOwnerId: 'dir_melissa_gagliardi_33', reviewOwnerName: 'Melissa Gagliardi',
      category: 'print', photos: [{ id: 'source', name: 'Listing source', url: '/uploads/source.png' }],
      proofHistory: [{ version: 4, proofUrl: 'https://example.com/old-qa-placeholder.png' }],
    } as any} />);
  }

  it('shows an accessible failure state for a source thumbnail instead of hiding it', async () => {
    await renderDrawer();
    const sourceImage = container!.querySelector('img[src="/uploads/source.png"]');
    expect(sourceImage).not.toBeNull();
    act(() => sourceImage!.dispatchEvent(new Event('error')));
    expect(container!.querySelector('[aria-label="Preview unavailable for Listing source"]')).not.toBeNull();
  });

  it('requires a real finished proof when review metadata exists without a current proof', async () => {
    await renderDrawer();
    expect(container!.textContent).toContain('Finished proof is missing');
    expect(container!.textContent).toContain('Upload the finished asset again before review or delivery.');
    expect(container!.querySelector('[data-testid="collateral-proof-card"]')).toBeNull();
    expect(container!.querySelector('img[src="https://example.com/old-qa-placeholder.png"]')).toBeNull();
  });
});
