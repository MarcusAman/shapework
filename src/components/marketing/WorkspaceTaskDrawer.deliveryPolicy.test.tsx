/** @vitest-environment happy-dom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceTaskDrawer } from './WorkspaceTaskDrawer';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const task = { id: 'policy_task', workspaceId: 'ws_wilmington', propertyAddress: 'Test property', agentName: 'Marcus Aman', agentEmail: 'marcus.aman@gmail.com', packageType: 'Brochure', category: 'print', status: 'in_progress', assignedTo: 'Eduardo Lovo', assignedToId: 'dir_eduardo_lovo_73', reviewOwnerId: 'dir_melissa_gagliardi_33', reviewOwnerName: 'Melissa Gagliardi', proofUrl: '/uploads/proof.pdf', photos: [] };
const reviewer = { id: 'dir_melissa_gagliardi_33', name: 'Melissa Gagliardi', role: 'marketing_director', permissions: ['marketing.final_approval'] };
const reply = (data: unknown) => ({ ok: true, status: 200, json: async () => data });
let root: Root; let host: HTMLDivElement;
afterEach(() => { act(() => root?.unmount()); host?.remove(); vi.unstubAllGlobals(); });
async function render() {
 host = document.createElement('div'); document.body.append(host); root = createRoot(host);
 await act(async () => { root.render(<WorkspaceTaskDrawer isOpen activeTask={task as any} currentUser={reviewer} onClose={() => {}} />); });
}
function mockVerdict(verdict: unknown) { vi.stubGlobal('fetch', vi.fn(async (url) => reply(String(url).endsWith('/dispatch-check') ? verdict : {}))); }
const approval = () => host.querySelector<HTMLButtonElement>('[data-action="Approve & send to agent"]');
describe('Delivery policy is not requester identity', () => {
 it('explains disabled email instead of asking to reconfirm a known test recipient', async () => {
  mockVerdict({ allowed: false, reason: 'This recipient is not allowed.', recipientStatus: 'unresolved', recipientBlockReason: 'test_recipient_policy', outboundPolicy: { mode: 'disabled', allowed: false, reason: 'outbound_disabled' } });
  await render();
  expect(host.textContent).toContain('Email delivery is disabled');
  expect(host.textContent).not.toContain('Requester needs confirmation');
  expect(host.textContent).not.toContain('Confirm requester first');
  expect(approval()?.disabled).toBe(true);
 });
 it('shows a policy restriction when test recipients are unavailable in live mode', async () => {
  mockVerdict({ allowed: false, reason: 'This recipient is not allowed.', recipientStatus: 'unresolved', recipientBlockReason: 'test_recipient_policy', outboundPolicy: { mode: 'live', allowed: true, reason: 'live' } });
  await render();
  expect(host.textContent).toContain('Test recipient blocked by delivery settings');
  expect(host.textContent).not.toContain('Confirm requester first');
  expect(approval()?.disabled).toBe(true);
 });
 it('keeps delivery disabled for a verified directory contact when the transport is off', async () => {
  mockVerdict({ allowed: false, reason: 'Outbound is turned off.', recipientStatus: 'directory', recipientBlockReason: null, outboundPolicy: { mode: 'disabled', allowed: false, reason: 'outbound_disabled' } });
  await render();
  expect(host.textContent).toContain('Email delivery is disabled');
  expect(approval()?.disabled).toBe(true);
 });
 it('lets the user retry a failed check instead of changing the requester', async () => {
  let fail = true;
  vi.stubGlobal('fetch', vi.fn(async url => {
   if (!String(url).endsWith('/dispatch-check')) return reply({});
   if (fail) return { ok: false, status: 503, json: async () => ({ error: 'Temporary outage' }) };
   return reply({ allowed: true, reason: '', recipientStatus: 'allowlisted_prove', outboundPolicy: { mode: 'hold', allowed: true, reason: 'allowlisted' } });
  }));
  await render();
  expect(host.textContent).toContain('Could not check delivery readiness');
  expect(host.textContent).not.toContain('Confirm requester first');
  const retry = [...host.querySelectorAll('button')].find(button => button.textContent === 'Retry check');
  expect(retry).toBeDefined(); fail = false;
  await act(async () => retry!.click());
  expect(host.textContent).not.toContain('Could not check delivery readiness');
  expect(approval()?.disabled).toBe(false);
 });
});
