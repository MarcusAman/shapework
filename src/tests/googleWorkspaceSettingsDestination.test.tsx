/** @vitest-environment happy-dom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../components/ui/Drawer', () => ({ default: ({ isOpen, children, footer }: any) => isOpen ? <div data-testid="settings-drawer">{children}{footer}</div> : null }));
vi.mock('../components/integrations/RechatMcpIntegrationModal', () => ({ RechatMcpIntegrationModal: () => null }));
vi.mock('../services/orgChartService', () => ({ orgChartService: {
  getOrgChart: () => ({ positions: [], roles: [], sops: [], escalationPolicies: [] }), fetchPublishedPolicy: async () => null,
} }));

import CustomerAppRoutes from '../routes/CustomerAppRoutes';
import RyanSettingsPage from '../components/nest-wilmington/RyanSettingsPage';
import RoleEscalationMapPage from '../components/nest-wilmington/RoleEscalationMapPage';

const melissa = { id: 'usr_melissa', email: 'melissa.gagliardi@nestrealty.com', role: 'marketing_director' };
const ryan = { id: 'usr_ryan', email: 'ryan@nestrealty.com', role: 'owner' };
let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) || null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) });
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ success: true, providers: [], credentials: [], members: [] }) })));
  window.history.replaceState({}, '', '/app/settings?workspace=tenant_a&settingsTab=tools&integration=google');
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root?.unmount()); host?.remove(); vi.unstubAllGlobals(); });
async function render(element: React.ReactNode) { await act(async () => root.render(element)); }
function assertGoogleDestination() {
  const toolsTab = [...host.querySelectorAll('[role="radio"]')].find(el => el.textContent?.startsWith('Connected Tools'));
  expect(toolsTab?.getAttribute('aria-checked')).toBe('true');
  const google = [...host.querySelectorAll('h3')].find(el => el.textContent === 'Google Workspace')?.closest('.p-4');
  expect(google).not.toBeNull();
  expect([...google!.querySelectorAll('button')].filter(button => button.textContent === 'Connect via OAuth')).toHaveLength(1);
}

describe('Google Workspace settings destination', () => {
  it('opens the real tools tab and canonical connection drawer for the owner deep link', async () => {
    await render(<RyanSettingsPage state={{ activeProfile: ryan, workspaceId: 'tenant_a' }} />);
    assertGoogleDestination();
  });

  it.each(['/app', '/demo'])('routes Melissa %s Google deep links to the same tools drawer without owner privileges', async prefix => {
    window.history.replaceState({}, '', `${prefix}/settings?workspace=tenant_a&settingsTab=tools&integration=google`);
    await render(<CustomerAppRoutes state={{ currentTab: 'Settings', activeProfile: melissa, workspaceId: 'tenant_a' }} />);
    assertGoogleDestination();
    expect([...host.querySelectorAll('[role="radio"]')].some(el => /Team Access|Billing/.test(el.textContent || ''))).toBe(false);
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).includes('/api/auth/google/connect'))).toBe(false);
  });

  it.each(['/app', '/demo'])('Role Map %s Google links preserve workspace and target the canonical drawer', async prefix => {
    window.history.replaceState({}, '', `${prefix}/role-map?workspace=tenant_a`);
    await render(<RoleEscalationMapPage defaultTab="connected_tools" workspaceId="tenant_a" />);
    const links = [...host.querySelectorAll('a')].filter(a => a.textContent === 'Manage in Workspace settings');
    expect(links).toHaveLength(2);
    expect(links.every(link => link.getAttribute('href') === `${prefix}/settings?workspace=tenant_a&settingsTab=tools&integration=google`)).toBe(true);
    expect(host.querySelector('[data-testid="settings-drawer"]')).toBeNull();
  });
});
