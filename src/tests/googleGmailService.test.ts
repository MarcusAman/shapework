import { describe, it, expect } from 'vitest';
import { GoogleGmailService } from '../../server/services/googleGmailService.js';
import { executeGoogleGmailTool } from '../../server/ai/tools/googleGmailMcpTools.js';
import { vendorOrderRepository } from '../../server/persistence/vendorOrderRepository.js';

describe('Gmail API (v1) Service Suite', () => {
  it('1. Retrieves staged email drafts in Human-in-the-Loop queue', () => {
    const drafts = GoogleGmailService.getDrafts();
    expect(drafts.length).toBeGreaterThanOrEqual(2);
    expect(drafts.some(d => d.category === 'Vendor Coordination')).toBe(true);
    expect(drafts.some(d => d.category === 'Contract & Escrow')).toBe(true);
  });

  it('2. Stages a new email draft for broker review', async () => {
    const draft = await GoogleGmailService.stageDraft({
      recipient: 'closings@wilmingtontitle.com',
      recipientName: 'Wilmington Title & Trust',
      subject: 'Executed NC 2-T Contract: 104 Live Oak Dr (Jenkins)',
      body: 'Hi Team,\n\nPlease find attached the fully executed contract for 104 Live Oak Dr.\n\nBest,\nMelissa Gagliardi',
      category: 'Contract & Escrow',
      propertyAddress: '104 Live Oak Dr, Wrightsville Beach NC'
    });

    expect(draft.id).toBeDefined();
    expect(draft.status).toBe('staged');
    expect(draft.recipient).toBe('closings@wilmingtontitle.com');

    const drafts = GoogleGmailService.getDrafts();
    expect(drafts.some(d => d.id === draft.id)).toBe(true);
  });

  it('3. Sends an approved draft via Gmail API', async () => {
    const drafts = GoogleGmailService.getDrafts();
    const targetDraft = drafts.find(d => d.status === 'staged')!;

    const sendRes = await GoogleGmailService.sendDraft(targetDraft.id);
    expect(sendRes.success).toBe(true);
    expect(sendRes.draft.status).toBe('sent');
    expect(sendRes.draft.sentAt).toBeDefined();
  });

  it('4. Parses inbound vendor email reply and auto-completes matching task', async () => {
    // 1. Create active order in repository
    const order = await vendorOrderRepository.createOrder({
      workspaceId: 'nest-realty-demo',
      vendorType: 'coastal_sign_post',
      vendorName: 'Coastal Sign Post Co.',
      propertyAddress: '702 South Front St, Wilmington NC',
      details: { postType: 'White Colonial' },
      cost: 75.00,
      createdBy: 'Ryan Crecelius'
    });

    expect(order.status).toBe('confirmed');

    // 2. Simulate installer reply with completion
    const parseRes = await GoogleGmailService.parseInboundVendorReply({
      emailText: 'Yard post has been installed at 702 South Front St. Photo proof attached.',
      senderEmail: 'dave@coastalsignposts.com'
    });

    expect(parseRes.status).toBe('completed');
    expect(parseRes.photoProofUrl).toBeDefined();
  });

  it('5. Executes Gmail tools via Nora AI tool caller', async () => {
    const staged = await executeGoogleGmailTool('stage_gmail_draft', {
      recipient: 'buyer@example.com',
      recipientName: 'Sarah Jenkins',
      subject: 'Your Inspection Report — 104 Live Oak Dr',
      body: 'Hi Sarah, here is the inspection report summary.'
    });

    expect(staged.id).toBeDefined();
    expect(staged.status).toBe('staged');

    const threads = await executeGoogleGmailTool('search_gmail_threads', {
      query: 'Live Oak'
    });
    expect(threads).toBeDefined();
  });
});
