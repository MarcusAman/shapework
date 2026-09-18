import { describe, it, expect, afterAll } from 'vitest';
import { 
  convertCallToCanonicalMarketingRequest,
  archiveCanonicalMarketingRequestAndTasks
} from '../../server/persistence/marketingCampaignsRepository.js';

describe('Spoken Deliverable Extraction from Telephony Calls', () => {
  afterAll(async () => {
    const testIds = ['req_call_call_test_matt_open_house_99', 'req_call_call_test_sign_rider_99'];
    for (const id of testIds) {
      archiveCanonicalMarketingRequestAndTasks(id);
    }
    try {
      const { getDbPool } = await import('../../server/persistence/repositories.js');
      const pool = getDbPool ? getDbPool() : null;
      if (pool) {
        await pool.query(`DELETE FROM canonical_marketing_requests WHERE id = ANY($1)`, [testIds]);
        await pool.query(`DELETE FROM canonical_marketing_tasks WHERE request_id = ANY($1)`, [testIds]);
      }
    } catch {}
  });

  it('extracts Open House Flyer & Information Sheet for Matt Orr call', () => {
    const call = {
      id: 'call_test_matt_open_house_99',
      callerName: 'Matt Orr (REALTOR®)',
      propertyAddress: '104 Live Oak Dr, Wilmington NC',
      transcript: "Agent: Thanks for calling Ask Nest Ops. What do you need help with?\nUser: to get some help with an open house flyer and information sheet for an upcoming open house.\nAgent: Got it, I'll route this to marketing.",
      summary: 'Matt Orr requested an open house flyer and information sheet.'
    };

    const result = convertCallToCanonicalMarketingRequest(call);
    expect(result.shouldCreate).toBe(true);
    expect(result.tasks.length).toBeGreaterThan(0);
    expect(result.tasks[0].title).toBe('Open House Flyer & Information Sheet');
    expect(result.tasks[0].category).toBe('open_house');
  });

  it('extracts Yard Sign Post & Custom Rider Installation for sign calls', () => {
    const call = {
      id: 'call_test_sign_rider_99',
      callerName: 'Sarah Jenkins',
      propertyAddress: '212 Wetland Drive, Wilmington NC',
      transcript: "User: yeah, I need a sign writer and post for a house next Friday.",
      summary: 'Sarah Jenkins requested a sign writer and post.'
    };

    const result = convertCallToCanonicalMarketingRequest(call);
    expect(result.shouldCreate).toBe(true);
    expect(result.tasks.length).toBeGreaterThan(0);
    expect(result.tasks[0].title).toBe('Yard Sign Post & Custom Rider Installation');
    expect(result.tasks[0].category).toBe('signage');
  });
});
