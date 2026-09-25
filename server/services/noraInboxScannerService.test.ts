import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const imap = vi.hoisted(() => ({
  connect: vi.fn(), search: vi.fn(), getMailboxLock: vi.fn(), release: vi.fn(),
  download: vi.fn(), messageFlagsAdd: vi.fn(), logout: vi.fn(), close: vi.fn(),
  ingest: vi.fn(), parse: vi.fn(),
}));

// No real IMAP, MIME parser, database, or outbound ingestion code is loaded.
vi.mock('imapflow', () => ({ ImapFlow: class {
  on() {}
  connect = imap.connect;
  search = imap.search;
  getMailboxLock = imap.getMailboxLock;
  download = imap.download;
  messageFlagsAdd = imap.messageFlagsAdd;
  logout = imap.logout;
  close = imap.close;
} }));
vi.mock('mailparser', () => ({ simpleParser: imap.parse }));
vi.mock('./inboundEmailIngestionEngine.js', () => ({ ingestInboundEmailToTask: imap.ingest }));

beforeEach(() => {
  vi.resetModules();
  for (const mock of Object.values(imap)) mock.mockReset();
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('MAINTENANCE_MODE', 'false');
  vi.stubEnv('NORA_UNIFIED_INTAKE_ENABLED', 'true');
  // Bypass only the test early return; ImapFlow itself is completely mocked above.
  vi.stubEnv('RUN_LIVE_IMAP_TEST', 'mocked');
  vi.stubEnv('GOOGLE_SMTP_PASS', 'unused-mock-password');
  vi.stubEnv('ASK_NORA_EMAIL', 'scanner-fixture@example.invalid');
  vi.stubEnv('NORA_WORKSPACE_ID', 'ws_scanner_fixture');
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  imap.connect.mockResolvedValue(undefined);
  imap.getMailboxLock.mockResolvedValue({ release: imap.release });
  imap.search.mockResolvedValue([]);
  imap.logout.mockResolvedValue(true);
  imap.messageFlagsAdd.mockResolvedValue(true);
  imap.parse.mockResolvedValue({ from: { text: 'agent@example.invalid' }, messageId: '<fixture@example.invalid>', text: 'Fixture request' });
  imap.ingest.mockResolvedValue({ success: true, taskId: 'fixture-task' });
});

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe('Ask Nora IMAP UID selection and connection cleanup', () => {
  it('downloads and marks the actual UID when mailbox sequence numbers differ', async () => {
    imap.search.mockImplementation(async (_query, options) => options?.uid ? [9042] : [1]);
    imap.download.mockImplementation(async (uid) => uid === '9042' ? { content: Buffer.from('mock mail') } : undefined);
    const { scanAskNoraInbox } = await import('./noraInboxScannerService.js');

    const result = await scanAskNoraInbox();

    expect(result.ingestedCount).toBe(1);
    expect(imap.search).toHaveBeenCalledWith({ seen: false }, { uid: true });
    expect(imap.download).toHaveBeenCalledWith('9042', undefined, { uid: true });
    expect(imap.messageFlagsAdd).toHaveBeenCalledWith('9042', ['\\Seen'], { uid: true });
    expect(imap.release).toHaveBeenCalledTimes(1);
    expect(imap.logout).toHaveBeenCalledTimes(1);
  });

  it('releases the mailbox and logs out when no unread messages exist', async () => {
    const { scanAskNoraInbox } = await import('./noraInboxScannerService.js');
    expect(await scanAskNoraInbox()).toEqual({ scannedCount: 0, ingestedCount: 0, results: [], errors: [] });
    expect(imap.release).toHaveBeenCalledTimes(1);
    expect(imap.logout).toHaveBeenCalledTimes(1);
    expect(imap.ingest).not.toHaveBeenCalled();
  });

  it.each(['search', 'getMailboxLock', 'connect'] as const)('cleans up after %s fails and permits the next scan', async (method) => {
    imap[method].mockRejectedValueOnce(new Error(`${method} failed`));
    const { scanAskNoraInbox } = await import('./noraInboxScannerService.js');

    expect((await scanAskNoraInbox()).errors).toContain(`${method} failed`);
    expect(imap.logout).toHaveBeenCalledTimes(1);
    expect(imap.release).toHaveBeenCalledTimes(method === 'search' ? 1 : 0);
    expect((await scanAskNoraInbox()).errors).toEqual([]);
    expect(imap.connect).toHaveBeenCalledTimes(2);
    expect(imap.logout).toHaveBeenCalledTimes(2);
    expect(imap.ingest).not.toHaveBeenCalled();
  });

  it('force closes a failed logout and still clears the scan-in-progress guard', async () => {
    imap.logout.mockRejectedValueOnce(new Error('logout failed'));
    const { scanAskNoraInbox } = await import('./noraInboxScannerService.js');

    expect((await scanAskNoraInbox()).errors).toContain('logout failed');
    expect(imap.close).toHaveBeenCalledTimes(1);
    expect((await scanAskNoraInbox()).errors).toEqual([]);
    expect(imap.connect).toHaveBeenCalledTimes(2);
    expect(imap.logout).toHaveBeenCalledTimes(2);
  });
});
