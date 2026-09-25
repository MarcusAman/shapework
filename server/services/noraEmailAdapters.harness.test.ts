import { afterEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ ingest: vi.fn(), parsed: {} as any, seen: vi.fn(), uid: 0 }));
vi.mock('./inboundEmailIngestionEngine.js', () => ({ ingestInboundEmailToTask: state.ingest }));
vi.mock('../email/emailProvider.js', () => ({ NORA_EMAIL_CONFIG: { user: 'asknora@nestrealty.com' } }));
vi.mock('../persistence/marketingCampaignsRepository.js', () => ({}));
vi.mock('../integrations/google/googleOAuth.js', () => ({}));
vi.mock('../integrations/google/googleConfig.js', () => ({}));
vi.mock('../persistence/oauthTokensRepository.js', () => ({}));
vi.mock('../integrations/shared/integrationCredentialVault.js', () => ({}));
vi.mock('../integrations/shared/integrationStateStore.js', () => ({}));
vi.mock('../policies/departmentNotificationPolicyEngine.js', () => ({ getNotificationCcEmail: () => 'melissa@nestrealty.com' }));
vi.mock('googleapis', () => ({ google: {} }));
vi.mock('mailparser', () => ({ simpleParser: async () => state.parsed }));
vi.mock('imapflow', () => ({ ImapFlow: class {
  on() {} async connect() {} async logout() {} async getMailboxLock() { return { release() {} }; }
  async search() { return [++state.uid]; } async download() { return { content: 'mock email bytes' }; }
  messageFlagsAdd = state.seen;
} }));
import { processInboundAgentEmail } from '../integrations/google/noraEmailIntakeService.js';
import { emailInboundWebhookRouter } from '../routes/emailInboundWebhookRouter.js';
import { scanAskNoraInbox } from './noraInboxScannerService.js';

const success = { success: true, taskId: 'task', requestId: 'req', actionTaken: 'created_new', assignedTo: 'Melissa Gagliardi' };
afterEach(() => { vi.unstubAllEnvs(); state.ingest.mockReset(); state.seen.mockClear(); });

describe('Inbound email transport identity preservation', () => {
  it('Gmail processing delegates bytes and conversation identity to the canonical engine', async () => {
    state.ingest.mockResolvedValue(success);
    const content = Buffer.from('real photo');
    await processInboundAgentEmail({ id: 'gmail-id', messageId: '<rfc-id@example>', workspaceId: 'ws_a', threadId: 'gmail-thread',
      inReplyTo: '<sent@example>', references: '<first@example> <sent@example>', fromEmail: 'agent@nestrealty.com', fromName: 'Agent',
      subject: 'Re: Flyer', bodyText: 'Photos attached', receivedAt: '2026-09-25', attachments: [{ filename: 'a.jpg', contentType: 'image/jpeg', sizeBytes: content.length, content }] });
    expect(state.ingest).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 'ws_a', messageId: '<rfc-id@example>',
      threadId: 'gmail-thread', inReplyTo: '<sent@example>', references: '<first@example> <sent@example>',
      attachments: [expect.objectContaining({ content })] }));
  });

  it('webhook preserves provider headers, trusts server workspace and keeps actual attachment MIME/bytes', async () => {
    state.ingest.mockResolvedValue(success);
    const layer = (emailInboundWebhookRouter as any).stack.find((s: any) => s.route?.path === '/inbound');
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await layer.route.stack[0].handle({ workspaceId: 'ws_bound', headers: {}, body: { from: 'agent@nestrealty.com', workspaceId: 'ws_attacker',
      subject: 'Re: Flyer', text: 'Photos', headers: [{ Name: 'Message-ID', Value: '<incoming@example>' }, { Name: 'In-Reply-To', Value: '<sent@example>' },
      { Name: 'References', Value: '<initial@example> <sent@example>' }], attachments: [{ filename: 'a.png', contentType: 'image/png', content: 'YWJj' }] } }, res);
    expect(state.ingest).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 'ws_bound', messageId: '<incoming@example>',
      inReplyTo: '<sent@example>', references: '<initial@example> <sent@example>', attachments: [expect.objectContaining({ contentType: 'image/png', content: 'YWJj' })] }));
  });

  it('IMAP preserves reply headers and leaves an unsuccessful ingestion unread for retry', async () => {
    vi.stubEnv('NORA_UNIFIED_INTAKE_ENABLED', 'true'); vi.stubEnv('RUN_LIVE_IMAP_TEST', '1'); vi.stubEnv('GOOGLE_SMTP_PASS', 'mock-only');
    vi.stubEnv('NORA_WORKSPACE_ID', 'ws_bound');
    state.parsed = { from: { text: 'agent@nestrealty.com' }, subject: 'Re: Flyer', text: 'Change the price',
      messageId: '<imap@example>', inReplyTo: '<sent@example>', references: ['<initial@example>', '<sent@example>'] };
    state.ingest.mockResolvedValue({ success: false, message: 'Storage temporarily unavailable' });
    const result = await scanAskNoraInbox();
    expect(state.ingest).toHaveBeenCalledWith(expect.objectContaining({ messageId: '<imap@example>', inReplyTo: '<sent@example>',
      references: ['<initial@example>', '<sent@example>'], workspaceId: 'ws_bound' }));
    expect(state.seen).not.toHaveBeenCalled(); expect(result.ingestedCount).toBe(0); expect(result.errors).toHaveLength(1);
  });
});
