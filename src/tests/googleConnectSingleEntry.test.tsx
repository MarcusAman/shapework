// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ConnectedToolsDrawer from '../components/integrations/ConnectedToolsDrawer';

vi.mock('../components/ui/Drawer', () => ({ default: ({ children, footer }: any) => <div>{children}{footer}</div> }));
vi.mock('../components/integrations/RechatMcpIntegrationModal', () => ({ RechatMcpIntegrationModal: () => null }));

describe('Google connection has one home in Workspace settings', () => {
  let host: HTMLDivElement;
  let root: Root;
  const fetchMock = vi.fn();
  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    window.history.replaceState({}, '', '/app/role-map?workspace=nest-realty-wilmington');
    fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ success: true, providers: [], credentials: [] }) });
    vi.stubGlobal('fetch', fetchMock);
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
  });
  afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
  const googleCard = () => Array.from(host.querySelectorAll('h3')).find(h => h.textContent === 'Google Workspace')!.closest('.p-4')!;

  it('links secondary connection surfaces to Workspace settings without a Google OAuth button', async () => {
    await act(async () => root.render(<ConnectedToolsDrawer isOpen onClose={() => {}} />));
    const card = googleCard();
    const link = card.querySelector('a');
    expect(link?.textContent).toContain('Manage in Workspace settings');
    expect(link?.getAttribute('href')).toBe('/app/settings?workspace=nest-realty-wilmington&settingsTab=tools&integration=google');
    expect(card.textContent).not.toContain('Connect via OAuth');
  });

  it('retains one Google OAuth button in the canonical settings drawer', async () => {
    await act(async () => root.render(<ConnectedToolsDrawer isOpen onClose={() => {}} allowGoogleConnect />));
    expect(Array.from(googleCard().querySelectorAll('button')).filter(b => b.textContent === 'Connect via OAuth')).toHaveLength(1);
  });

  it('quick setup cannot create a second Google authorization path', async () => {
    await act(async () => root.render(<ConnectedToolsDrawer isOpen onClose={() => {}} />));
    const quickSetup = Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes('Quick Setup'))!;
    await act(async () => quickSetup.click());
    expect(fetchMock.mock.calls.some(([url]) => url === '/api/auth/google/authorize')).toBe(false);
    expect(fetchMock.mock.calls.some(([url]) => url === '/api/auth/rechat/authorize')).toBe(true);
  });
});
