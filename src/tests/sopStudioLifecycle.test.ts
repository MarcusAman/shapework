import { describe, it, expect, beforeEach } from 'vitest';
import { sopRepository } from '../../server/persistence/sopRepository';
import { queryUnifiedContext } from '../../server/knowledge/unifiedContextRetriever';
import { SopDocument } from '../types/sopWorkflow';

describe('Staff SOP Studio Lifecycle & Instant Zero-Lag RAG Update Suite', () => {
  const tenantId = 'tenant_sop_studio_test';
  const workspaceId = 'ws_sop_studio_test';

  it('BIC approval gate: publishing a draft SOP increments version and changes status to published', async () => {
    const draftId = `sop_studio_${Date.now()}`;
    const customTitle = `Brokerage Aerial Drone Inspection Protocol ${Date.now()}`;
    
    const draftSop: SopDocument = {
      id: draftId,
      tenantId,
      workspaceId,
      title: customTitle,
      purpose: 'Standard operating procedures for scheduling and executing FAA Part 107 drone listing shoots.',
      trigger: 'Listing onboarding requiring professional aerial media package.',
      processOwner: 'Media Coordinator',
      participants: ['Listing Agent', 'FAA Drone Pilot'],
      prerequisites: ['FAA Airspace Clearance'],
      requiredInputs: ['Property Boundaries', 'Flight Date'],
      orderedSteps: [
        { id: 'st_1', stepNumber: 1, action: 'Submit FAA airspace authorization request.', role: 'Drone Pilot', systemUsed: 'FAA LAANC' },
        { id: 'st_2', stepNumber: 2, action: 'Capture 4K oblique boundary shots & HDR video.', role: 'Drone Pilot', systemUsed: 'DJI Media Hub' }
      ],
      decisions: ['If wind exceeds 20mph, reschedule flight.'],
      exceptions: ['Restricted airspace requires 48h advance notice.'],
      escalationPaths: ['Airspace denials escalate to Broker-in-Charge.'],
      completionEvidence: 'Raw footage uploaded to Google Drive folder.',
      expectedTiming: '24-48 hours',
      systemsUsed: ['FAA LAANC', 'DJI Media Hub'],
      reviewer: 'Matt Orr — Broker-in-Charge (#281940)',
      publisher: '',
      effectiveDate: '',
      reviewDate: '',
      openQuestions: [],
      status: 'draft',
      author: 'Media Coordinator',
      aiAssisted: true,
      transcriptRetention: 'sop_only',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    // 1. Save draft
    await sopRepository.saveDraft(draftSop);

    // Verify draft query returns draft status
    const draftQuery = queryUnifiedContext(`What is the ${customTitle} procedure?`, { tenantId, workspaceId });
    expect(draftQuery.spokenAnswer).toContain('currently a draft under review');
    expect(draftQuery.displayResponse).toContain('Draft SOP in Review');

    // 2. Publish as BIC
    const published = await sopRepository.publishSop(draftId, tenantId, 'Matt Orr — Broker-in-Charge (#281940)');
    expect(published.status).toBe('published');
    expect(published.version).toBe(2);

    // 3. Query immediately on next turn — verify it is now approved policy
    const pubQuery = queryUnifiedContext(`What is the ${customTitle} procedure?`, { tenantId, workspaceId });
    expect(pubQuery.spokenAnswer).toContain(`According to the approved ${customTitle}`);
    expect(pubQuery.displayResponse).toContain('Approved & Published (v2)');
    expect(pubQuery.confidence).toBe('high');
  });
});
