/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite: Apple Minimalist Requests Tab & End-to-End Field MMS Ingest Engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MmsTextToRequestService } from '../../server/services/mmsTextToRequestService';
import {
  getAllCanonicalMarketingTasks,
  getAllCanonicalMarketingRequests,
  saveCanonicalMarketingTask,
  saveCanonicalMarketingRequest
} from '../../server/persistence/marketingCampaignsRepository';
import fs from 'fs';
import path from 'path';

describe('Apple Minimalist Requests & End-to-End MMS Autonomous Engine', () => {
  const CANONICAL_DATA_FILE = path.join(process.cwd(), 'server', 'data', 'canonical_marketing_store.json');
  const MMS_DATA_FILE = path.join(process.cwd(), 'server', 'data', 'mms_records.json');

  it('1. Dynamic NLP Address Extraction parses real custom addresses, prices, and specs', () => {
    const rawText1 = '1420 South Live Oak Pkwy, Wilmington NC. $2,450,000. 5 bed / 4.5 bath luxury coastal estate.';
    const result1 = MmsTextToRequestService.extractListingDetails(rawText1);

    expect(result1.propertyAddress).toContain('1420 South Live Oak Pkwy');
    expect(result1.price).toBe('$2,450,000');
    expect(result1.bedsBaths).toBe('5 Beds / 4.5 Baths');

    const rawText2 = 'Just listed 814 Ocean Blvd! Asking $3,100,000 with 4 beds and 4 baths. Photos attached.';
    const result2 = MmsTextToRequestService.extractListingDetails(rawText2);

    expect(result2.propertyAddress).toContain('814 Ocean Blvd');
    expect(result2.price).toBe('$3,100,000');
    expect(result2.bedsBaths).toBe('4 Beds / 4 Baths');
  });

  it('2. End-to-End Field MMS Ingest executes Drive scaffolding, Maxa trigger, Google Slides generation, and saves to disk', async () => {
    const customPhone = '+19106128283'; // Matt Orr (BIC)
    const customPhotos = [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=90',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=90'
    ];

    const result = await MmsTextToRequestService.processInboundMms({
      fromPhone: customPhone,
      body: '210 Causeway Dr, Wrightsville Beach NC — $1,475,000 (3 bed / 2 bath). Double-sided flyer, sign post, and Google Slides presentation deck please.',
      mediaUrls: customPhotos
    });

    expect(result.mmsRecord).toBeDefined();
    expect(result.mmsRecord.agentName).toContain('Matt Orr');
    expect(result.mmsRecord.extractedPropertyAddress).toContain('210 Causeway Dr');
    expect(result.mmsRecord.photos.length).toBe(2);
    expect(result.mmsRecord.driveFolderUrl).toContain('drive.google.com');
    expect(result.mmsRecord.googleSlidesUrl).toContain('docs.google.com/presentation');
    expect(result.mmsRecord.smsReceiptSent).toBe(true);

    // Verify parent request and tasks created
    expect(result.request).toBeDefined();
    expect(result.request.agentName).toContain('Matt Orr');
    expect(result.tasks.length).toBeGreaterThanOrEqual(4);
    expect(result.tasks.some(t => t.title.includes('Flyer'))).toBe(true);
    expect(result.tasks.some(t => t.title.includes('Google Slides'))).toBe(true);

    // Verify disk persistence
    expect(fs.existsSync(MMS_DATA_FILE)).toBe(true);
    expect(fs.existsSync(CANONICAL_DATA_FILE)).toBe(true);
  });

  it('3. 72-Agent Directory Phone Resolution correctly maps unknown and known brokers', () => {
    // Known key broker
    const sarah = MmsTextToRequestService.resolveBrokerByPhone('+19105550188');
    expect(sarah.name).toBe('Sarah Jenkins');
    expect(sarah.role).toBe('Listing Specialist');

    // Unknown phone fallback
    const fallback = MmsTextToRequestService.resolveBrokerByPhone('+19199998877');
    expect(fallback.name).toBe('Nest Listing Broker');
    expect(fallback.email).toBe('agent@nestrealty.com');
  });

  it('4. Canonical Requests & Tasks disk store preserves records', () => {
    const tasks = getAllCanonicalMarketingTasks();
    const requests = getAllCanonicalMarketingRequests();

    expect(tasks.length).toBeGreaterThan(0);
    expect(requests.length).toBeGreaterThan(0);
  });
});
