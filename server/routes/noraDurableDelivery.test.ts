import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
const state = vi.hoisted(() => ({ tasks: new Map<string, any>(), durableTasks: new Map<string, any>(), events: [] as any[], send: vi.fn(), getAsset: vi.fn(), createToken: vi.fn(), resend: vi.fn(), approveQuery: vi.fn() }));
vi.mock('../services/marketingPortalAccess.js', () => ({ getMarketingPortalDbPool: () => ({ query: state.approveQuery }) }));
vi.mock('../auth/auth.js', () => ({ requireAuth: vi.fn(), resolveWorkspaceContext: vi.fn(), requireWorkspaceMembership: vi.fn(), WILMINGTON_WORKSPACE_ALIASES: ['ws_wilmington'] }));
vi.mock('../services/marketingDeliveryLock.js', () => {
  const persistRouting = (task: any) => {
    const durable = state.durableTasks.get(task.id);
    if (durable) durable.routingSnapshot = structuredClone(task.routingSnapshot);
  };
  return {
    acquireMarketingDeliveryLock: async () => async () => {},
    refreshMarketingDeliveryState: async (task: any) => {
      const durable = state.durableTasks.get(task.id);
      if (!durable || durable.workspaceId !== task.workspaceId) return false;
      Object.assign(task, structuredClone(durable));
      return true;
    },
    persistMarketingDeliverySnapshot: async (task: any, patch: any) => {
      task.routingSnapshot = { ...task.routingSnapshot, ...patch }; persistRouting(task);
    },
    beginMarketingDeliveryAttempt: async (task: any, key: string) => {
      if (task.routingSnapshot?.deliveryAttempt?.key === key && task.routingSnapshot.deliveryAttempt.status === 'sending') return false;
      task.routingSnapshot.deliveryAttempt = { key, status: 'sending' }; persistRouting(task); return true;
    },
    finishMarketingDeliveryAttempt: async (task: any, key: string, status: string) => {
      task.routingSnapshot.deliveryAttempt = { key, status }; persistRouting(task);
    },
  };
});
vi.mock('../email/emailProvider.js', () => ({ sendEmail: state.send, toAbsolutePublicUrl: (path: string) => `https://nest.example${path}` }));
vi.mock('../email/resendDispatchAdapter.js', () => ({ dispatchEmailViaResend: state.resend }));
vi.mock('../services/inboundEmailIngestionEngine.js', () => ({ enqueueOutboundEmail: vi.fn() }));
vi.mock('../services/googleDriveService.js', () => ({ GoogleDriveService: { listFilesInFolder: vi.fn() } }));
vi.mock('../persistence/durableAssetRepository.js', () => ({ getDurableAssetByFilenameAsync: state.getAsset, createAssetDownloadTokenAsync: state.createToken }));
vi.mock('../services/canonicalRecipientService.js', () => ({ resolveServerCanonicalRecipient: async () => ({ id: 'agent-1', name: 'Agent One', firstName: 'Agent', email: 'agent@nestrealty.com', emailVerified: true, phoneVerified: false, maskedEmail: 'agent@nestrealty.com' }), isHotlineNumber: () => false }));
vi.mock('../services/activityHistoryService.js', () => ({ recordActivityEvent: async (event: any) => state.events.push(event), getActivityHistoryForTask: async () => state.events }));
vi.mock('../persistence/marketingCampaignsRepository.js', () => ({
  persistTaskToDatabase: async () => {},
  getCanonicalMarketingTaskById: (id: string) => state.tasks.get(id),
  getAllCanonicalMarketingTasks: () => [...state.tasks.values()],
  saveCanonicalMarketingTask: (task: any) => { state.tasks.set(task.id, task); return task; },
  approveCanonicalMarketingTaskProof: (id: string) => { const task = state.tasks.get(id); task.reviewState = 'approved'; return task; },
}));
vi.mock('../services/nora/dealTriage.js', () => ({ shouldBlockClientOutbound: () => false, dealTriageClientOutboundBlockReason: () => '' }));
vi.mock('../persistence/notificationPreferencesRepository.js', () => ({ canSendAgentOutbound: async () => ({ allowed: true }) }));
vi.mock('../services/noraEmailReplyLifecycle.js', () => ({ recordEmailConversation: (task: any, message: any) => { task.routingSnapshot = { ...task.routingSnapshot, emailConversation: message }; } }));
import { marketingQuestionsRouter } from './marketingQuestionsRoute.js';
const sendHandler = (marketingQuestionsRouter as any).stack.find((entry: any) => entry.route?.path === '/api/marketing/requests/send-questions').route.stack.at(-1).handle;
const content = Buffer.from('approved durable asset');
let task: any;
async function post(overrides: any = {}, actor = 'melissa') {
  let status = 200; let body: any;
  const req = { body: { campaignId: 'request-1', taskId: 'task-1', workspaceId: 'ws_wilmington', recipientName: 'Agent One', recipientEmail: 'agent@nestrealty.com', channels: ['email'], message: 'Your marketing assets are ready.', intent: 'delivery_complete', ...overrides }, authUser: { id: actor, name: actor }, workspace: { id: 'ws_wilmington' } };
  const res = { headersSent: false, status: (code: number) => { status = code; return res; }, json: (value: any) => { body = value; res.headersSent = true; return res; } };
  await sendHandler(req, res);
  return { status, body };
}
describe('Nora durable delivery route lifecycle', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development'); vi.stubEnv('APP_MODE', 'production'); vi.stubEnv('OUTBOUND_MASTER_MODE', 'live'); vi.stubEnv('RESEND_API_KEY', '');
    state.tasks.clear(); state.durableTasks.clear(); state.events.length = 0; (globalThis as any).__NEST_OUTREACH_ONCE = new Map();
    task = { id: 'task-1', requestId: 'request-1', workspaceId: 'ws_wilmington', reviewerId: 'melissa', agentEmail: 'agent@nestrealty.com', proofUrl: '/uploads/proof-1.pdf', proofVersion: 1, status: 'awaiting_review', reviewState: 'awaiting_review', routingSnapshot: {} };
    state.tasks.set(task.id, task);
    state.durableTasks.set(task.id, structuredClone(task));
    state.approveQuery.mockImplementation(async (sql: string, values: any[]) => {
      const durable = state.durableTasks.get(values[0]);
      if (!durable || durable.workspaceId !== values[1]) return { rows: [] };
      if (/^SELECT /i.test(sql.trim())) {
        return { rows: [Object.fromEntries(Object.entries(structuredClone(durable)).map(([key, value]) =>
          [key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`), value]))] };
      }
      if (durable.proofVersion !== values[9]) return { rows: [] };
      Object.assign(durable, {
        proofUrl: values[2], proofVersion: values[3], proofHistory: JSON.parse(values[4]),
        reviewState: values[5], reviewHistory: JSON.parse(values[6]), approvalHistory: JSON.parse(values[7]),
        proofNotes: values[11] ?? durable.proofNotes,
      });
      if (values[10] && durable.routingSnapshot?.proofDraft?.savedAt === values[10]) delete durable.routingSnapshot.proofDraft;
      if (values[12]) durable.status = values[13];
      return { rows: [{ routing_snapshot: structuredClone(durable.routingSnapshot) }] };
    });
    state.getAsset.mockResolvedValue({ id: 'asset-1', filename: 'proof.pdf', workspaceId: task.workspaceId, taskId: task.id, dataBase64: content.toString('base64'), sha256Checksum: createHash('sha256').update(content).digest('hex') });
    state.createToken.mockResolvedValue({ token: 'dl_large_proof' });
    state.send.mockResolvedValue({ success: true, smtpAccepted: true, messageId: '<delivered@test>' });
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
  it('sends real durable bytes with Melissa CC, then retries completion without another email', async () => {
    const first = await post();
    expect(first.status).toBe(200); expect(first.body.deliveryReceipt.messageId).toBe('<delivered@test>');
    expect(state.send).toHaveBeenCalledWith(expect.objectContaining({ cc: ['melissa.gagliardi@nestrealty.com'], attachments: [{ filename: 'proof.pdf', content, contentType: 'application/octet-stream' }], replyTo: 'AskNora@nestrealty.com' }));
    expect(task.routingSnapshot.delivery.key).toBe(first.body.dispatchKey);
    expect(task.status).toBe('awaiting_review'); // Parent completion endpoint owns Done.
    const retry = await post();
    expect(retry.body.alreadySent).toBe(true); expect(state.send).toHaveBeenCalledTimes(1);
  });
  it('promotes every saved draft asset and attaches the full approved package with Melissa CC', async () => {
    const files = [1, 2, 3].map(index => {
      const bytes = Buffer.from(`finished asset ${index}`);
      return { id: `asset-${index}`, filename: `photo-${index}.jpg`, url: `/uploads/proof-${index}.pdf`,
        contentType: 'image/jpeg', workspaceId: task.workspaceId, taskId: task.id,
        dataBase64: bytes.toString('base64'), sha256Checksum: createHash('sha256').update(bytes).digest('hex') };
    });
    task.routingSnapshot.proofDraft = {
      proofUrl: task.proofUrl, baseProofUrl: task.proofUrl, baseProofVersion: task.proofVersion,
      savedAt: '2026-09-25T20:00:00.000Z', savedById: 'eduardo', notes: 'Three selected photos',
      assets: files.map(file => ({ id: file.id, previewUrl: file.url, fileName: file.filename })),
    };
    state.durableTasks.set(task.id, structuredClone(task));
    state.getAsset.mockImplementation(async (filename: string) => files.find(file => file.url === `/uploads/${filename}`) || null);
    expect(state.send).not.toHaveBeenCalled();
    const result = await post();
    expect(result.status, JSON.stringify(result.body)).toBe(200);
    const durable = state.durableTasks.get(task.id);
    expect(durable.proofVersion).toBe(2);
    expect(durable.proofHistory.at(-1).assets.map((asset: any) => asset.assetId)).toEqual(files.map(file => file.id));
    expect(durable.routingSnapshot.proofDraft).toBeUndefined();
    expect(state.send).toHaveBeenCalledWith(expect.objectContaining({
      cc: ['melissa.gagliardi@nestrealty.com'],
      attachments: files.map(file => ({ filename: file.filename, content: Buffer.from(file.dataBase64, 'base64'), contentType: file.contentType })),
    }));
    expect(state.send).toHaveBeenCalledTimes(1);
  });
  it('does not send before approval persistence succeeds', async () => {
    state.approveQuery.mockRejectedValueOnce(new Error('Approval storage unavailable'));
    expect((await post()).status).toBe(500);
    expect(state.send).not.toHaveBeenCalled();
    expect(task.routingSnapshot.delivery).toBeUndefined();
    expect(task.proofVersion).toBe(1);
    expect(state.durableTasks.get(task.id).proofVersion).toBe(1);
    expect((await post()).status).toBe(200);
    expect(state.send).toHaveBeenCalledTimes(1);
    expect(task.proofVersion).toBe(state.durableTasks.get(task.id).proofVersion);
  });
  it('uses a scoped download link when the approved file is too large for email', async () => {
    const large = Buffer.alloc(16 * 1024 * 1024, 7);
    state.getAsset.mockResolvedValue({ id: 'asset-large', filename: 'large.pdf', workspaceId: task.workspaceId, taskId: task.id, dataBase64: large.toString('base64'), sha256Checksum: createHash('sha256').update(large).digest('hex') });
    expect((await post()).status).toBe(200);
    expect(state.createToken).toHaveBeenCalledWith(expect.objectContaining({ assetId: 'asset-large', workspaceId: task.workspaceId, taskId: task.id }));
    expect(state.send.mock.calls[0][0].attachments).toBeUndefined();
    expect(state.send.mock.calls[0][0].text).toContain('https://nest.example/api/marketing/assets/download/dl_large_proof');
  });
  it('allows information request then delivery then a revised proof delivery', async () => {
    expect((await post({ intent: 'ask_missing' })).status).toBe(200);
    expect((await post()).status).toBe(200);
    task.proofVersion += 1; task.proofUrl = '/uploads/proof-2.pdf'; task.reviewState = 'awaiting_review';
    state.durableTasks.set(task.id, structuredClone(task));
    expect((await post()).status).toBe(200);
    expect(state.send).toHaveBeenCalledTimes(3);
  });
  it('does not reuse a receipt whose recipient or Melissa CC does not match', async () => {
    expect((await post()).status).toBe(200);
    const receipt = task.routingSnapshot.delivery;
    receipt.cc = [];
    state.durableTasks.get(task.id).routingSnapshot.delivery = structuredClone(receipt);
    expect((await post()).body.code).toBe('DELIVERY_RECIPIENT_CHANGED');
    receipt.cc = ['melissa.gagliardi@nestrealty.com']; receipt.recipient = 'another@nestrealty.com';
    state.durableTasks.get(task.id).routingSnapshot.delivery = structuredClone(receipt);
    expect((await post()).body.code).toBe('DELIVERY_RECIPIENT_CHANGED');
    expect(state.send).toHaveBeenCalledTimes(1);
  });
  it('rejects another reviewer and another task tenant before sending', async () => {
    expect((await post({}, 'eduardo')).status).toBe(403);
    task.workspaceId = 'other';
    expect((await post()).status).toBe(404); expect(state.send).not.toHaveBeenCalled();
  });
  it('does not persist delivery or complete a failed or held email', async () => {
    state.send.mockResolvedValue({ success: false, smtpAccepted: false, retrySafe: true, error: 'Rejected' });
    expect((await post()).status).toBe(502);
    expect(task.routingSnapshot.delivery).toBeUndefined(); expect(task.status).toBe('awaiting_review');
    vi.stubEnv('OUTBOUND_MASTER_MODE', 'hold');
    const held = await post();
    expect(held.body.dispatchHeld).toBe(true); expect(state.send).toHaveBeenCalledTimes(1);
    expect(task.routingSnapshot.delivery).toBeUndefined();
  });
  it('blocks retry after an ambiguous SMTP timeout without a Resend fallback', async () => {
    vi.stubEnv('RESEND_API_KEY', 'configured-fake-key-for-test');
    state.send.mockResolvedValue({ success: false, smtpAccepted: false, retrySafe: false, error: 'Timeout' });
    expect((await post()).status).toBe(502);
    expect((await post()).body.code).toBe('DELIVERY_OUTCOME_UNCONFIRMED');
    expect(state.send).toHaveBeenCalledTimes(1); expect(state.resend).not.toHaveBeenCalled();
  });
  it('allows retry after a conclusive recipient rejection', async () => {
    state.send.mockResolvedValueOnce({ success: false, smtpAccepted: false, retrySafe: true, error: 'Rejected' });
    expect((await post()).status).toBe(502);
    expect((await post()).status).toBe(200); expect(state.send).toHaveBeenCalledTimes(2);
  });
  it('does not let SMS-only dispatch count as the required email delivery', async () => {
    expect((await post({ channels: ['sms'] })).status).toBe(400); expect(state.send).not.toHaveBeenCalled();
  });
});
