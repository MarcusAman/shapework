import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCanonicalMarketingRequestById,
  getCanonicalMarketingTaskById,
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks,
  saveCanonicalMarketingRequest,
  saveCanonicalMarketingTask,
  updateCanonicalMarketingTaskStatus
} from '../../server/persistence/marketingCampaignsRepository';
import { sendEmail } from '../../server/email/emailProvider';
import { isAllowedSmsRecipient, recordSmsDispatch } from '../../server/security/smsWhitelistGate';

describe('Nora Marketing Delegation & Review Relay Workflow Suite', () => {
  beforeEach(() => {
    // Reset test state if needed
  });

  it('1. Verifies 1916 Wolcott Avenue marketing request has structured photo, Drive folder, and agent attribution', () => {
    saveCanonicalMarketingRequest({
      id: 'req_email_eml_matt_orr_1916_wolcott_1788276923998',
      title: '1916 Wolcott Ave Marketing Request',
      sourceCallId: 'eml_matt_orr_1916_wolcott',
      channel: 'email',
      receivedAt: '10:24 AM · Today',
      status: 'assigned',
      agentName: 'Matt Orr (Broker)',
      agentEmail: 'matt.orr@nestrealty.com',
      agentPhone: '+12527170595',
      propertyAddress: '1916 Wolcott Ave, Wilmington, NC',
      requestExcerpt: 'Email Intake (matt.orr@nestrealty.com): 1-Page Flyer for new listing (1400 sq ft, 3 bed 2 bath, fully remodeled, $560,000, Go-Live Sep 24). Attachment: 1004.jpg',
      taskIds: ['tsk_email_eml_matt_orr_1916_wolcott_0'],
      assignedTo: 'Melissa Gagliardi',
      photos: [
        {
          id: 'photo_eml_matt_orr_1916_wolcott_0',
          url: '/images/properties/1916_wolcott_1004.jpg',
          name: '1004.jpg',
          type: 'image/jpeg',
          sizeBytes: 3840000,
          driveUrl: 'https://drive.google.com/file/d/1-Vph9XRJ6LCjllp9A0g5Y0M227lWack/view'
        }
      ],
      attachments: [
        {
          filename: '1004.jpg',
          contentType: 'image/jpeg',
          sizeBytes: 3840000,
          url: '/images/properties/1916_wolcott_1004.jpg',
          driveUrl: 'https://drive.google.com/file/d/1-Vph9XRJ6LCjllp9A0g5Y0M227lWack/view'
        }
      ],
      driveFolderUrl: 'https://drive.google.com/drive/folders/1DRV_1916_WOLCOTT_AVE',
      isArchived: false,
      createdAt: '2026-09-01T15:35:24.001Z',
      updatedAt: '2026-09-02T14:40:36.618Z'
    });

    saveCanonicalMarketingTask({
      id: 'tsk_email_eml_matt_orr_1916_wolcott_0',
      requestId: 'req_email_eml_matt_orr_1916_wolcott_1788276923998',
      title: '1-Page Property Flyer (8.5x11)',
      category: 'print',
      status: 'in_progress',
      assignedTo: 'Melissa Gagliardi',
      agentName: 'Matt Orr (Broker)',
      propertyAddress: '1916 Wolcott Ave, Wilmington, NC',
      photos: [
        {
          id: 'photo_eml_matt_orr_1916_wolcott_0',
          url: '/images/properties/1916_wolcott_1004.jpg',
          name: '1004.jpg',
          type: 'image/jpeg',
          sizeBytes: 3840000,
          driveUrl: 'https://drive.google.com/file/d/1-Vph9XRJ6LCjllp9A0g5Y0M227lWack/view'
        }
      ],
      attachments: [
        {
          filename: '1004.jpg',
          contentType: 'image/jpeg',
          sizeBytes: 3840000,
          url: '/images/properties/1916_wolcott_1004.jpg',
          driveUrl: 'https://drive.google.com/file/d/1-Vph9XRJ6LCjllp9A0g5Y0M227lWack/view'
        }
      ],
      driveFolderUrl: 'https://drive.google.com/drive/folders/1DRV_1916_WOLCOTT_AVE',
      createdAt: '2026-09-01T15:35:24.007Z',
      updatedAt: '2026-09-02T14:40:36.612Z',
      isArchived: false,
      notes: 'Email received at asknora@nestrealty.com from Matt Orr (REALTOR®).'
    });

    const wolcottReq = getCanonicalMarketingRequestById('req_email_eml_matt_orr_1916_wolcott_1788276923998');
    expect(wolcottReq).toBeDefined();
    expect(wolcottReq?.propertyAddress).toContain('1916 Wolcott');
    expect(wolcottReq?.agentEmail).toBe('matt.orr@nestrealty.com');
    expect(wolcottReq?.photos).toBeDefined();
    expect(wolcottReq?.photos!.length).toBeGreaterThan(0);
    expect(wolcottReq?.photos![0].name).toContain('1004.jpg');
    expect(wolcottReq?.photos![0].url).toContain('1916_wolcott_1004.jpg');
    expect(wolcottReq?.photos![0].driveUrl).toContain('1-Vph9XRJ6LCjllp9A0g5Y0M227lWack');
    expect(wolcottReq?.driveFolderUrl).toContain('1DRV_1916_WOLCOTT_AVE');

    const wolcottTask = getCanonicalMarketingTaskById('tsk_email_eml_matt_orr_1916_wolcott_0');
    expect(wolcottTask).toBeDefined();
    expect(wolcottTask?.propertyAddress).toContain('1916 Wolcott');
    expect(wolcottTask?.photos).toBeDefined();
    expect(wolcottTask?.photos![0].url).toContain('1916_wolcott_1004.jpg');
    expect(wolcottTask?.propertyAddress).toContain('1916 Wolcott');
    expect(wolcottTask?.photos).toBeDefined();
    expect(wolcottTask?.photos!.length).toBeGreaterThan(0);
  });

  it('2. Dispatches agent inquiry via Email with CC to Melissa Gagliardi and SMS text', async () => {
    const testReqId = 'req_email_test_inquiry_relay_01';
    const testTaskId = 'tsk_email_test_inquiry_relay_01';

    saveCanonicalMarketingRequest({
      id: testReqId,
      workspaceId: 'ws_wilmington',
      title: '704 Forest Hills Dr Marketing Package',
      propertyAddress: '704 Forest Hills Dr, Wilmington, NC',
      agentName: 'Matt Orr (REALTOR®)',
      agentEmail: 'matt.orr@nestrealty.com',
      agentPhone: '+12527170595',
      channel: 'email',
      status: 'request_received',
      taskIds: [testTaskId],
      driveFolderUrl: 'https://drive.google.com/drive/folders/1DRV_704_FOREST_HILLS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    saveCanonicalMarketingTask({
      id: testTaskId,
      requestId: testReqId,
      workspaceId: 'ws_wilmington',
      title: '1-Page Property Flyer (8.5x11)',
      category: 'print',
      assignedTo: 'Melissa Gagliardi',
      assignedToRole: 'Marketing Director',
      status: 'request_received',
      propertyAddress: '704 Forest Hills Dr, Wilmington, NC',
      agentName: 'Matt Orr (REALTOR®)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Simulate Agent Inquiry
    const note = 'Hi Matt, please send 3 high-res interior photos and confirm open house hours.';
    const emailResult = await sendEmail({
      to: 'matt.orr@nestrealty.com',
      cc: 'melissa@nestrealty.com',
      subject: 'Action Needed: Missing details for 704 Forest Hills Dr marketing package',
      text: note
    });

    expect(emailResult.success).toBe(true);

    const smsCheck = isAllowedSmsRecipient('+12527170595');
    expect(smsCheck.allowed).toBe(true);
    recordSmsDispatch('+12527170595', `Hi Matt, Melissa needs more info for 704 Forest Hills Dr: "${note}"`);

    // Update status to waiting_on_agent
    const updatedTask = updateCanonicalMarketingTaskStatus(testTaskId, 'revisions', {
      performedBy: 'Melissa Gagliardi',
      note: `[Inquiry Sent to Agent]: ${note}`
    });

    expect(updatedTask?.status).toBe('revisions');
    expect(updatedTask?.approvalHistory?.some(h => h.note?.includes('[Inquiry Sent to Agent]'))).toBe(true);
  });

  it('3. Delegates task to Eduardo Lovo and updates status to in_progress', () => {
    const testTaskId = 'tsk_email_test_inquiry_relay_01';
    const updated = updateCanonicalMarketingTaskStatus(testTaskId, 'in_progress', {
      assignedTo: 'Eduardo Lovo',
      assignedToRole: 'Virtual Assistant / Maxa Lead',
      performedBy: 'Melissa Gagliardi',
      note: 'Delegated to Eduardo Lovo for Maxa asset production.'
    });

    expect(updated).toBeDefined();
    expect(updated?.assignedTo).toBe('Eduardo Lovo');
    expect(updated?.assignedToRole).toBe('Virtual Assistant / Maxa Lead');
    expect(updated?.status).toBe('in_progress');
  });

  it('4. Eduardo submits to manager for review, triggering Email and SMS alert to Melissa Gagliardi', async () => {
    const testTaskId = 'tsk_email_test_inquiry_relay_01';
    
    // Status transition to agent_review
    const updated = updateCanonicalMarketingTaskStatus(testTaskId, 'agent_review', {
      performedBy: 'Eduardo Lovo',
      note: '[Submitted to Manager for Review by Eduardo Lovo]: Collateral prepared in Maxa and Google Drive.'
    });

    expect(updated?.status).toBe('agent_review');

    // Email alert to Melissa
    const emailResult = await sendEmail({
      to: 'melissa@nestrealty.com',
      subject: 'Ready for Review: 1-Page Property Flyer for 704 Forest Hills Dr (from Eduardo Lovo)',
      text: 'Eduardo Lovo submitted assets for 704 Forest Hills Dr for your review.'
    });
    expect(emailResult.success).toBe(true);

    // SMS alert to Melissa
    const smsCheck = isAllowedSmsRecipient('+19105072047');
    expect(smsCheck.allowed).toBe(true);
  });

  it('5. Melissa approves and dispatches final package to agent with Google Drive link (CC: Melissa)', async () => {
    const testTaskId = 'tsk_email_test_inquiry_relay_01';

    // Status transition to approved
    const updated = updateCanonicalMarketingTaskStatus(testTaskId, 'approved', {
      performedBy: 'Melissa Gagliardi',
      note: '[Approved & Dispatched to Agent by Melissa Gagliardi]: All proofs approved. Drive pack link delivered.'
    });

    expect(updated?.status).toBe('approved');

    // Final dispatch email to agent with CC to Melissa
    const emailResult = await sendEmail({
      to: 'matt.orr@nestrealty.com',
      cc: 'melissa@nestrealty.com',
      subject: 'Ready: Your Marketing Collateral for 704 Forest Hills Dr',
      text: 'Your marketing collateral for 704 Forest Hills Dr is ready: https://drive.google.com/drive/folders/1DRV_704_FOREST_HILLS'
    });

    expect(emailResult.success).toBe(true);
  });
});
