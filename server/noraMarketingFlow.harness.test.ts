import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { signJwt } from './auth/jwt.js';
import * as email from './email/emailProvider.js';
import * as recipients from './services/canonicalRecipientService.js';
import * as outboundMode from '../src/lib/outboundAllowlistGate.js';
import { saveCanonicalMarketingTask, getCanonicalMarketingTaskById } from './persistence/marketingCampaignsRepository.js';
import { generateMarketingTrackerToken } from './services/taskTrackerService.js';
import { getCanonicalLaneForTask } from '../src/lib/canonicalMarketingTaskLane.js';

describe('Nora real HTTP approval, secure delivery, and revision flow (captured email)', () => {
  let server: Server; let base: string;
  const taskId = 'tsk_codex_http_flow';
  let upload: any; let portal: string;
  const completion = vi.spyOn(email, 'sendTaskCompletionEmail');
  const directory = vi.spyOn(recipients, 'resolveServerCanonicalRecipient');
  const productionRecipientRules = vi.spyOn(outboundMode, 'isProductionApp');
  const headers = (producer = false) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${signJwt({ userId: producer ? 'usr_eduardo_full' : 'usr_melissa_full', email: producer ? 'eduardo.lovo@nestrealty.com' : 'melissa.gagliardi@nestrealty.com', name: producer ? 'Eduardo Lovo' : 'Melissa Gagliardi', role: producer ? 'producer' : 'marketing_director', workspaceId: 'ws_wilmington' })}`,
  });
  async function post(path: string, body: any, producer = false) {
    const response = await fetch(base + path, { method: 'POST', headers: headers(producer), body: JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  }
  beforeAll(async () => {
    vi.stubEnv('PORT', '0'); vi.stubEnv('OUTBOUND_MASTER_MODE', 'live');
    directory.mockResolvedValue({ id: 'directory_agent', email: 'nora-flow-test@nestrealty.com', name: 'Listing Agent', emailVerified: true } as any);
    completion.mockResolvedValue({ success: true, smtpAccepted: true, messageId: '<captured-delivery@example.test>' } as any);
    const loaded = await import('../server.ts'); server = loaded.httpServer;
    if (!server.listening) await new Promise<void>(resolve => server.once('listening', resolve));
    base = `http://127.0.0.1:${(server.address() as any).port}`;
    // Exercise production recipient/CC rules while the SMTP boundary is captured.
    productionRecipientRules.mockReturnValue(true);
    saveCanonicalMarketingTask({ id: taskId, workspaceId: 'ws_wilmington', title: 'Property flyer', propertyAddress: '123 Test Street', agentName: 'Listing Agent', agentEmail: 'nora-flow-test@nestrealty.com', assignedTo: 'Eduardo Lovo', assignedToId: 'usr_eduardo_full', reviewOwnerId: 'usr_melissa_full', reviewOwnerName: 'Melissa Gagliardi', status: 'in_progress', routingSnapshot: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any);
  }, 180000);
  afterAll(async () => { if (server) await new Promise<void>(resolve => server.close(() => resolve())); vi.restoreAllMocks(); vi.unstubAllEnvs(); });

  it('saves a scoped proof, protects raw bytes, and submits it without Drive', async () => {
    const result = await post('/api/marketing/upload-asset', { taskId, filename: 'flyer.pdf', contentType: 'application/pdf', fileBase64: Buffer.from('%PDF-1.4\nNORA_APPROVED_TEST_PROOF').toString('base64') }, true);
    expect(result.status, JSON.stringify(result.body)).toBe(200); upload = result.body;
    expect(upload.assetId).toBeTruthy(); expect(upload.url).toContain('/uploads/asset_');
    expect((await fetch(base + upload.url)).status).toBe(401);
    const privateAsset = await fetch(base + upload.url, { headers: headers(true) });
    expect(privateAsset.status).toBe(200);
    expect(await privateAsset.text()).toContain('NORA_APPROVED_TEST_PROOF');
    const proof = await post(`/api/marketing/tasks/${taskId}/submit-proof`, { proofUrl: upload.url, assetMetadata: { assetId: upload.assetId } }, true);
    expect(proof.status, JSON.stringify(proof.body)).toBe(200);
    expect(proof.body.task.reviewState).toBe('awaiting_review');
    expect(proof.body.task.reviewOwnerName).toBe('Melissa Gagliardi');
  });

  it('rejects producer approval and refuses browser-only claims that email was sent', async () => {
    const denied = await post(`/api/marketing/tasks/${taskId}/approve-and-dispatch`, {}, true);
    expect(denied.status).toBe(403);
    const skipped = await post(`/api/marketing/tasks/${taskId}/approve-and-dispatch`, { skipAgentEmail: true });
    expect(skipped.status, JSON.stringify(skipped.body)).toBe(200);
    expect(skipped.body.delivered).toBe(false);
    expect(getCanonicalMarketingTaskById(taskId)?.status).not.toBe('completed');
    expect(getCanonicalLaneForTask(getCanonicalMarketingTaskById(taskId)!)).toBe('agent_review');
    expect(completion).not.toHaveBeenCalled();
  });

  it('sends with Melissa CC, completes once, and gives the agent a working public download', async () => {
    const result = await post(`/api/marketing/tasks/${taskId}/approve-and-dispatch`, {});
    expect(result.status, JSON.stringify(result.body)).toBe(200); expect(result.body.delivered, JSON.stringify(result.body)).toBe(true);
    expect(result.body.task.status).toBe('completed');
    expect(completion).toHaveBeenCalledWith(expect.objectContaining({ cc: ['melissa.gagliardi@nestrealty.com'] }));
    const sent = completion.mock.calls[0][0];
    const downloadPath = new URL(sent.proofUrl!).pathname;
    const download = await fetch(base + downloadPath);
    expect(download.status).toBe(200); expect(await download.text()).toContain('NORA_APPROVED_TEST_PROOF');
    const retry = await post(`/api/marketing/tasks/${taskId}/deliver`, {});
    expect(retry.body.delivered).toBe(true); expect(completion).toHaveBeenCalledTimes(1);
    portal = await generateMarketingTrackerToken(taskId);
  });

  it('rejects forged portal access, serves approved proof, and reopens the same task on requested changes', async () => {
    expect((await fetch(base + `/api/track/marketing/${taskId}`)).status).toBe(404);
    const approved = await fetch(base + `/api/track/marketing/${portal}/deliverable`);
    expect(approved.status).toBe(200);
    const revised = await fetch(base + `/api/track/marketing/${portal}/revisions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ feedback: 'Please update the listing price.' }) });
    expect(revised.status).toBe(200);
    const task = getCanonicalMarketingTaskById(taskId)!;
    expect(task.id).toBe(taskId); expect(task.reviewState).toBe('awaiting_review'); expect(task.status).not.toBe('completed');
    expect(getCanonicalLaneForTask(task)).toBe('agent_review');
    expect((await fetch(base + `/api/track/marketing/${portal}/deliverable`)).status).toBe(404);
  });
  it('sends a revised proof after a definite rejection and records completion only after acceptance', async () => {
    const fresh = await post('/api/marketing/upload-asset', { taskId, filename: 'flyer-v2.pdf', contentType: 'application/pdf', fileBase64: Buffer.from('%PDF-1.4\nREVISED_PROOF').toString('base64') }, true);
    expect(fresh.status).toBe(200);
    const submitted = await post(`/api/marketing/tasks/${taskId}/submit-proof`, { proofUrl: fresh.body.url, assetMetadata: { assetId: fresh.body.assetId } }, true);
    expect(submitted.status).toBe(200);
    completion.mockResolvedValueOnce({ success: false, smtpAccepted: false, retrySafe: true, error: 'SMTP_REJECTED' } as any);
    const rejected = await post(`/api/marketing/tasks/${taskId}/approve-and-dispatch`, {});
    expect(rejected.body.delivered).toBe(false);
    expect(getCanonicalMarketingTaskById(taskId)?.status).not.toBe('completed');
    const retried = await post(`/api/marketing/tasks/${taskId}/deliver`, {});
    expect(retried.status, JSON.stringify(retried.body)).toBe(200);
    expect(retried.body.delivered).toBe(true);
    expect(getCanonicalMarketingTaskById(taskId)?.status).toBe('completed');
    expect(completion).toHaveBeenCalledTimes(3);
    await post(`/api/marketing/tasks/${taskId}/deliver`, {});
    expect(completion).toHaveBeenCalledTimes(3);
  });

  it('holds an uncertain send for reconciliation instead of automatically sending it twice', async () => {
    const fresh = await post('/api/marketing/upload-asset', { taskId, filename: 'flyer-v3.pdf', contentType: 'application/pdf', fileBase64: Buffer.from('%PDF-1.4\nLATEST_PROOF').toString('base64') }, true);
    await post(`/api/marketing/tasks/${taskId}/submit-proof`, { proofUrl: fresh.body.url, assetMetadata: { assetId: fresh.body.assetId } }, true);
    completion.mockResolvedValueOnce({ success: false, smtpAccepted: false, retrySafe: false, error: 'SMTP_TIMEOUT' } as any);
    const uncertain = await post(`/api/marketing/tasks/${taskId}/approve-and-dispatch`, {});
    expect(uncertain.body.delivered).toBe(false);
    expect(uncertain.body.retryAllowed).toBe(false);
    const retried = await post(`/api/marketing/tasks/${taskId}/deliver`, {});
    expect(retried.body.error).toBe('DELIVERY_OUTCOME_UNCONFIRMED');
    expect(completion).toHaveBeenCalledTimes(4);
    expect(getCanonicalMarketingTaskById(taskId)?.status).not.toBe('completed');
  });

});
