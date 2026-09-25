import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  save: vi.fn(async (call: any) => call),
  list: vi.fn(async () => []),
  link: vi.fn(async () => undefined),
  convert: vi.fn(() => ({ shouldCreate: true, request: { id: 'request_mock' }, tasks: [{ id: 'task_mock' }] })),
  send: vi.fn(),
}));
vi.mock('../persistence/telephonyCallsRepository.js', () => ({
  saveTelephonyCallAsync: mocks.save,
  getTelephonyCallsByWorkspaceAsync: mocks.list,
  getTelephonyCallByIdAsync: vi.fn(),
  linkCallToCanonicalRequestAsync: mocks.link,
  purgeTelephonyCallsInMemory: vi.fn(),
}));
vi.mock('../persistence/marketingCampaignsRepository.js', () => ({
  convertCallToCanonicalMarketingRequest: mocks.convert,
  getAllCanonicalMarketingRequests: vi.fn(() => []),
  getAllCanonicalMarketingTasks: vi.fn(() => []),
}));
vi.mock('../services/canonicalTaskRoutingService.js', () => ({
  canonicalTaskRoutingService: { resolveRoutingSync: vi.fn(() => ({ departmentId: 'marketing', assigneeName: 'Melissa Gagliardi', governingSopTitle: 'Marketing request' })) },
}));
vi.mock('../email/emailProvider.js', () => ({ sendEmail: mocks.send }));

import { syncRecentRetellCallsToDatabaseAsync, purgeAllCallsInMemory } from './marketingCallsService.js';

const agentId = 'agent_cdd031880770993e4b11cb9340';
const rawCall = {
  call_id: 'call_history_mock', agent_id: agentId,
  from_number: '+19105550101', start_timestamp: Date.parse('2026-09-24T12:00:00Z'),
  end_timestamp: Date.parse('2026-09-24T12:01:30Z'), duration_ms: 90000,
  call_status: 'ended', direction: 'inbound',
  transcript: 'I need a flyer for 123 Example Drive.',
  recording_url: 'https://example.invalid/history.wav',
  call_analysis: { call_successful: true, custom_analysis_data: { requester: 'Test Broker', property_address: '123 Example Drive' } },
};

beforeEach(() => {
  vi.clearAllMocks();
  purgeAllCallsInMemory();
  vi.stubEnv('RETELL_API_KEY', 'mock-key');
  vi.stubEnv('RETELL_ASK_NEST_OPS_AGENT_ID', agentId);
  vi.stubEnv('RETELL_SYNC_ENABLED', 'true');
  vi.stubEnv('STORAGE_DRIVER', 'database');
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [rawCall] })));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('Retell call history recovery', () => {
  it('restores normalized ledger records without creating requests, tasks, or email', async () => {
    const result = await syncRecentRetellCallsToDatabaseAsync({ workspaceId: 'ws_wilmington', agentId, createRequests: false });
    expect(result).toEqual({ totalFetched: 1, totalPersisted: 1, totalRequestsCreated: 0, errors: [] });
    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({
      id: rawCall.call_id, workspaceId: 'ws_wilmington', agentId,
      callerName: 'Test Broker', callerPhone: rawCall.from_number,
      durationSeconds: 90, recordingUrl: rawCall.recording_url,
      startedAt: '2026-09-24T12:00:00.000Z', transcript: rawCall.transcript,
    }));
    expect(mocks.convert).not.toHaveBeenCalled();
    expect(mocks.link).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('preserves request conversion for existing sync callers', async () => {
    const result = await syncRecentRetellCallsToDatabaseAsync({ workspaceId: 'ws_wilmington', agentId });
    expect(result.totalRequestsCreated).toBe(1);
    expect(mocks.convert).toHaveBeenCalledTimes(1);
    expect(mocks.link).toHaveBeenCalledWith(rawCall.call_id, 'request_mock', 'task_mock');
  });

  it('rejects another workspace before reading the configured Nest provider', async () => {
    const result = await syncRecentRetellCallsToDatabaseAsync({ workspaceId: 'another_tenant', agentId, createRequests: false });
    expect(result.totalPersisted).toBe(0);
    expect(result.errors).toContain('RETELL_WORKSPACE_AGENT_MISMATCH');
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('rejects another agent before provider access', async () => {
    const result = await syncRecentRetellCallsToDatabaseAsync({ workspaceId: 'ws_wilmington', agentId: 'another_agent', createRequests: false });
    expect(result.errors).toContain('RETELL_WORKSPACE_AGENT_MISMATCH');
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('does not trust provider filtering to exclude another agent', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [{ ...rawCall, agent_id: 'another_agent' }] })));
    const result = await syncRecentRetellCallsToDatabaseAsync({ workspaceId: 'ws_wilmington', agentId, createRequests: false });
    expect(result.totalPersisted).toBe(0);
    expect(result.errors).toContain('RETELL_CALL_AGENT_MISMATCH');
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.convert).not.toHaveBeenCalled();
  });
});
