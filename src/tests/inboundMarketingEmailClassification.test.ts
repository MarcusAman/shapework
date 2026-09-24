/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { classifyInboundEmail } from '../../server/services/nora/noraEmailClassifier.js';

describe('Nora Inbound Email Intent Classifier - Collateral vs Asset Submission', () => {
  it('1. Correctly classifies Marcus Aman\'s email with subject "test", deliverables, and image attachment as marketing_task', () => {
    const from = 'Marcus Aman <marcus.aman@gmail.com>';
    const subject = 'test';
    const body = `Nora - I have a request for marketing

The address is 120 Quail Drive Clinton NC 28328
MLS# 10014915

Its for an open house on Friday 09/18/2026 at 6pm

I need a social graphic for it to share out and a flyer to hand out at the
open house.

Here is the image of the home attached.`;

    const result = classifyInboundEmail(from, subject, body, 1);

    expect(result.intent).toBe('marketing_task');
    expect(result.confidence).toBeGreaterThanOrEqual(0.95);
    expect(result.detectedPropertyAddress).toBe('120 Quail Drive');
    expect(result.detectedDeliverable).toBeDefined();
  });

  it('2. Correctly classifies marketing requests with attached photos as marketing_task (never misclassified as pure asset upload)', () => {
    const from = 'Matt Orr <matt.orr@nestrealty.com>';
    const subject = '1916 Wolcott Ave - Need flyer and social post';
    const body = 'Hi Nora, please prepare marketing for 1916 Wolcott Ave. Attached are 5 high-res photos.';

    const result = classifyInboundEmail(from, subject, body, 5);

    expect(result.intent).toBe('marketing_task');
    expect(result.confidence).toBeGreaterThanOrEqual(0.95);
    expect(result.detectedPropertyAddress).toBe('1916 Wolcott Ave');
  });

  it('3. Retains asset_submission classification for pure photo submissions without deliverable creation requests', () => {
    const from = 'Matt Orr <matt.orr@nestrealty.com>';
    const subject = '13 Water St Pictures';
    const body = 'Hi Nora, Here is the pictures I needed for the 13 Water Street Instagram Story.';

    const result = classifyInboundEmail(from, subject, body, 2);

    expect(result.intent).toBe('asset_submission');
    expect(result.confidence).toBeGreaterThanOrEqual(0.95);
    expect(result.isAssetSubmission).toBe(true);
    expect(result.detectedPropertyAddress).toBe('13 Water St');
  });

  it('4. Classifies calendar RSVPs and automated notifications as automated_system', () => {
    const result = classifyInboundEmail(
      'matt.orr@nestrealty.com',
      'Accepted: Marketing Strategy @ Fri Sep 18, 2026',
      'Matt Orr has accepted this invitation.'
    );

    expect(result.intent).toBe('automated_system');
    expect(result.confidence).toBe(0.99);
  });
});
