import { describe, expect, it } from 'vitest';
import { selectHistoryCalls, toHistoryInsert } from '../../scripts/recoverNestCallHistory.js';

const from = Date.parse('2026-08-26T12:00:00Z');
const to = Date.parse('2026-09-25T12:00:00Z');
const raw = {
  call_id: 'call_history_unit', agent_id: 'agent_nest_unit', start_timestamp: to - 100000,
  end_timestamp: to - 10000, duration_ms: 90000, direction: 'inbound', call_status: 'ended',
  from_number: '+19105550123', transcript: 'A historical transcript.', recording_url: 'https://example.invalid/call.wav',
  call_analysis: { custom_analysis_data: { requester: 'Example Broker', property_address: '123 Test Drive', title: 'Flyer request' } },
};

describe('bounded additive history recovery', () => {
  it('selects only unique dated records for the configured agent inside the reviewed range', () => {
    const result = selectHistoryCalls([
      raw, { ...raw }, { ...raw, call_id: 'call_other', agent_id: 'other_agent' },
      { ...raw, call_id: 'call_tool_mock' }, { ...raw, call_id: 'call_old', start_timestamp: from - 1 },
      { ...raw, call_id: 'call_missing_date', start_timestamp: undefined },
    ], 'agent_nest_unit', from, to, 100);
    expect(result.calls).toEqual([raw]);
    expect(result.skipped).toBe(5);
  });

  it('caps recovery at 100 rows regardless of caller limit', () => {
    const result = selectHistoryCalls(Array.from({ length: 110 }, (_, i) => ({ ...raw, call_id: `call_${i}` })), 'agent_nest_unit', from, to, 500);
    expect(result.calls).toHaveLength(100);
  });

  it('prepares parameterized insert-only ledger data and never changes existing call or task records', () => {
    const insert = toHistoryInsert(raw, 'ws_wilmington');
    expect(insert.text).toContain('INSERT INTO telephony_calls');
    expect(insert.text).toContain('ON CONFLICT (id) DO NOTHING');
    expect(insert.text).not.toContain('DO UPDATE');
    expect(insert.text).not.toContain('canonical_marketing');
    expect(insert.text).not.toContain(raw.transcript);
    expect(insert.values).toEqual(expect.arrayContaining([
      raw.call_id, 'ws_wilmington', raw.agent_id, 'Example Broker', '+19105550123',
      '123 Test Drive', 'Flyer request', 90, raw.transcript, raw.recording_url,
      '/api/marketing/calls/call_history_unit/audio', new Date(raw.start_timestamp).toISOString(),
    ]));
  });
});
