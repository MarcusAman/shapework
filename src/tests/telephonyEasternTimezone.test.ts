import { describe, it, expect } from 'vitest';
import { formatEasternCallTimestamp, mapPersistedToMarketingCall } from '../../server/integrations/marketingCallsService';
import { formatCallTimestampInEastern } from '../components/marketing/CallsTableView';

describe('Telephony Eastern Timezone (America/New_York) Formatting Test Suite', () => {
  describe('1. Server formatEasternCallTimestamp helper', () => {
    it('accurately converts morning UTC timestamp to Eastern Daylight Time (UTC-4)', () => {
      // 11:12:37 UTC on Sep 8, 2026 is 7:12 AM EDT
      const utcIso = '2026-09-08T11:12:37.870Z';
      const formatted = formatEasternCallTimestamp(utcIso);
      expect(formatted).toBe('7:12 AM · Sep 8');
    });

    it('accurately converts afternoon UTC timestamp to Eastern Daylight Time', () => {
      // 18:45:00 UTC on Sep 8, 2026 is 2:45 PM EDT
      const utcIso = '2026-09-08T18:45:00.000Z';
      const formatted = formatEasternCallTimestamp(utcIso);
      expect(formatted).toBe('2:45 PM · Sep 8');
    });

    it('accurately shifts date across UTC midnight back to Eastern evening', () => {
      // 01:30:00 UTC on Sep 9, 2026 is 9:30 PM EDT on Sep 8
      const utcMidnightCross = '2026-09-09T01:30:00.000Z';
      const formatted = formatEasternCallTimestamp(utcMidnightCross);
      expect(formatted).toBe('9:30 PM · Sep 8');
    });

    it('accurately handles winter Eastern Standard Time (EST, UTC-5)', () => {
      // 17:00:00 UTC on Jan 15, 2026 is 12:00 PM EST
      const winterIso = '2026-01-15T17:00:00.000Z';
      const formatted = formatEasternCallTimestamp(winterIso);
      expect(formatted).toBe('12:00 PM · Jan 15');
    });

    it('does not append timezone abbreviation like ET or EDT to preserve UI cleanliness', () => {
      const utcIso = '2026-09-08T11:12:37.870Z';
      const formatted = formatEasternCallTimestamp(utcIso);
      expect(formatted).not.toContain('EDT');
      expect(formatted).not.toContain('EST');
      expect(formatted).not.toContain('ET');
    });

    it('handles numeric epoch timestamps gracefully', () => {
      const epochMs = new Date('2026-09-08T11:12:37.870Z').getTime();
      const formatted = formatEasternCallTimestamp(epochMs);
      expect(formatted).toBe('7:12 AM · Sep 8');
    });

    it('falls back gracefully on invalid date input', () => {
      expect(formatEasternCallTimestamp('not-a-date')).toBe('Today');
    });
  });

  describe('2. Client formatCallTimestampInEastern helper', () => {
    it('formats using rawTimestamp when present', () => {
      const call: any = {
        id: 'test_call_1',
        rawTimestamp: '2026-09-08T11:12:37.870Z',
        timestamp: '11:12 AM · Sep 8' // stale server or UTC string
      };
      const formatted = formatCallTimestampInEastern(call);
      expect(formatted).toBe('7:12 AM · Sep 8');
    });

    it('formats when timestamp contains an ISO string', () => {
      const call: any = {
        id: 'test_call_2',
        timestamp: '2026-09-08T11:12:37.870Z'
      };
      const formatted = formatCallTimestampInEastern(call);
      expect(formatted).toBe('7:12 AM · Sep 8');
    });

    it('preserves pre-formatted timestamp if no parseable ISO timestamp exists', () => {
      const call: any = {
        id: 'test_call_3',
        timestamp: '7:12 AM · Sep 8'
      };
      const formatted = formatCallTimestampInEastern(call);
      expect(formatted).toBe('7:12 AM · Sep 8');
    });

    it('falls back to Today when timestamp is missing or empty', () => {
      const call: any = { id: 'test_call_4' };
      expect(formatCallTimestampInEastern(call)).toBe('Today');
    });
  });

  describe('3. mapPersistedToMarketingCall produces Eastern timestamps', () => {
    it('maps persisted startedAt ISO string to Eastern Time', () => {
      const persistedCall: any = {
        id: 'call_test_eastern_1',
        callerName: 'Marcus Aman',
        callerPhone: '+12527170595',
        startedAt: '2026-09-08T11:12:37.870Z',
        durationSeconds: 45,
        transcript: 'Testing call audio timestamp'
      };

      const mapped = mapPersistedToMarketingCall(persistedCall);
      expect(mapped.timestamp).toBe('7:12 AM · Sep 8');
      expect(mapped.rawTimestamp).toBe('2026-09-08T11:12:37.870Z');
    });
  });
});
