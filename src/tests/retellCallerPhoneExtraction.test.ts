import { describe, expect, it } from 'vitest';
import {
  extractCallerPhoneFromRetellCall,
  normalizeRetellCall,
} from '../../server/integrations/marketingCallsService';

describe('Retell caller phone extraction', () => {
  it('reads p-asserted-identity when from_number is empty (does not use Nest line)', () => {
    const phone = extractCallerPhoneFromRetellCall({
      from_number: '',
      custom_sip_headers: {
        'p-asserted-identity': '<sip:+12527170595@sip.twilio.com>',
      },
      retell_llm_dynamic_variables: {
        'p-asserted-identity': '<sip:+12527170595@sip.twilio.com>',
      },
    });
    expect(phone).toBe('+12527170595');
  });

  it('never falls back to Nest voice line as caller phone', () => {
    const norm = normalizeRetellCall({
      call_id: 'call_test_no_from',
      from_number: '',
      agent_id: 'agent_test',
      start_timestamp: Date.now(),
      end_timestamp: Date.now() + 60000,
      duration_ms: 60000,
      transcript: 'Agent: Thanks for calling Nest.',
      custom_sip_headers: {},
    });
    expect(norm.phone).not.toBe('+19105072047');
    expect(norm.phone).toBe('');
  });

  it('prefers explicit from_number when present', () => {
    expect(
      extractCallerPhoneFromRetellCall({ from_number: '+12527170595' }),
    ).toBe('+12527170595');
  });
});
