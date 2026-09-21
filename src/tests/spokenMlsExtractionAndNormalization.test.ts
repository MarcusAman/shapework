import { describe, it, expect } from 'vitest';
import { extractSpokenMlsNumber } from '../../server/persistence/marketingCampaignsRepository';

describe('Spoken MLS Extraction and Normalization', () => {
  it('normalizes spoken digits with leading zeros or standard sequence', () => {
    // Exact phrase from caller: "one zero zero five seven six zero zero one"
    const phrase = 'Hi Nora, I need flyers for 518 North Fifth Avenue. The MLS number is one zero zero five seven six zero zero one.';
    expect(extractSpokenMlsNumber(phrase)).toBe('100576001');
  });

  it('preserves leading zeros', () => {
    const phrase = 'The listing is live under MLS zero zero one two three four five six';
    expect(extractSpokenMlsNumber(phrase)).toBe('00123456');
  });

  it('extracts direct numeric MLS numbers', () => {
    const phrase = 'It is already live in Flex MLS #100576001';
    expect(extractSpokenMlsNumber(phrase)).toBe('100576001');

    const phrase2 = 'Flex MLS is 10041289';
    expect(extractSpokenMlsNumber(phrase2)).toBe('10041289');
  });

  it('handles "oh" in spoken numbers', () => {
    const phrase = 'My MLS id is one oh oh five seven six oh oh one';
    expect(extractSpokenMlsNumber(phrase)).toBe('100576001');
  });

  it('does not extract phone numbers, quantities, or addresses as MLS', () => {
    const phrase1 = 'Call me at 910-612-8283 for 55 copies';
    expect(extractSpokenMlsNumber(phrase1)).toBeUndefined();

    const phrase2 = 'We need 55 copies at 518 North Fifth Avenue';
    expect(extractSpokenMlsNumber(phrase2)).toBeUndefined();
  });
});
