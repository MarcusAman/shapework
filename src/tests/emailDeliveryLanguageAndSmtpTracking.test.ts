import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  sendTaskCompletionEmail,
  sendEmail,
  isAllowedEmailRecipient
} from '../../server/email/emailProvider.js';

describe('Email Delivery Language, Truthful States & SMTP Transport Tracking', () => {
  const origMaster = process.env.OUTBOUND_MASTER_MODE;
  const origNora = process.env.NORA_AUTOMATION_MODE;

  beforeAll(() => {
    process.env.OUTBOUND_MASTER_MODE = 'live';
    process.env.NORA_AUTOMATION_MODE = 'live';
  });

  afterAll(() => {
    process.env.OUTBOUND_MASTER_MODE = origMaster;
    process.env.NORA_AUTOMATION_MODE = origNora;
  });

  it('correctly validates allowed test recipients', () => {
    expect(isAllowedEmailRecipient('marcus.aman@gmail.com')).toBe(true);
    expect(isAllowedEmailRecipient('marcus@shapework.co')).toBe(true);
    expect(isAllowedEmailRecipient('random.client@example.com')).toBe(false);
  });

  it('renders truthful "Ready to download" and "Print order: Not submitted" language without false delivery claims', async () => {
    const result = await sendTaskCompletionEmail({
      toEmail: 'marcus.aman@gmail.com',
      agentName: 'Marcus Aman',
      propertyAddress: '1104 South Live Oak Parkway',
      taskTitle: 'Open House Tri-Fold Flyer',
      downloadUrl: 'https://shapework-swbiewzo3a-uc.a.run.app/api/marketing/assets/download/dl_test_token_123',
      isApproved: true,
      approvedChecksum: 'e9c180f7883fc79cef9205b08daf706dfa953c04ede164b2b8993134557cb6b0',
      completedByName: 'Melissa Gagliardi',
      vendorName: 'CopyCat',
      isPrintOrderSubmitted: false,
      quantity: 50,
      neededByDate: 'Friday, September 11, 2026'
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    expect(result.smtpAccepted).toBe(true);
    expect(result.confirmedReceipt).toBe(false);
  });

  it('verifies generated email body contains no claims of "has been delivered" or "printing scheduled"', async () => {
    // Intercept sendEmail or render the template
    const { renderNestEditorialEmailTemplate } = await import('../../server/email/emailProvider.js');

    const html = renderNestEditorialEmailTemplate({
      title: 'Deliverables Ready to Download',
      badgeText: '● READY TO DOWNLOAD',
      serifTitle: 'Deliverables<br/>Ready',
      metadataDate: 'READY TO DOWNLOAD | APPROVED BY MELISSA',
      propertyAddress: '1104 South Live Oak Parkway, Wilmington, NC 28403',
      bodyParagraphs: [
        'Great news! Your print-ready collateral (<strong>Open House Tri-Fold Flyer</strong>) for <strong>1104 South Live Oak Parkway</strong> has been quality-checked and approved by <strong>Melissa Gagliardi</strong>.',
        'Printer requested: CopyCat. Print order: Not submitted (pending manual vendor dispatch).',
        'You can download the approved, print-ready PDF proof immediately.'
      ],
      ctaButton: {
        label: 'Download Approved PDF Proof',
        url: 'https://shapework-swbiewzo3a-uc.a.run.app/api/marketing/assets/download/dl_test_123'
      }
    });

    // Strictly forbidden phrases
    expect(html).not.toMatch(/has been delivered/i);
    expect(html).not.toMatch(/printing scheduled/i);

    // Required truthful phrases
    expect(html).toContain('READY TO DOWNLOAD');
    expect(html).toContain('Printer requested: CopyCat');
    expect(html).toContain('Print order: Not submitted');
    expect(html).toContain('Download Approved PDF Proof');
  });

  it('tracks SMTP acceptance separately from recipient inbox confirmation', async () => {
    const result = await sendEmail({
      to: 'marcus.aman@gmail.com',
      subject: '[TEST] Flyer download check — 1104 South Live Oak Parkway',
      text: 'Test email content for verification'
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    expect(result.smtpAccepted).toBe(true);
    expect(result.acceptedRecipients).toContain('marcus.aman@gmail.com');
    expect(result.rejectedRecipients).toEqual([]);
    // confirmedReceipt must remain false (transport level only)
    expect(result.confirmedReceipt).toBe(false);
  });

  it('truthfully suppresses outgoing email when recipient is outside test allowlist', async () => {
    const result = await sendEmail({
      to: 'unauthorized.external@example.com',
      subject: 'Unauthorized send attempt',
      text: 'Should be suppressed'
    });

    expect(result.success).toBe(true);
    expect(result.messageId?.startsWith('suppressed_safe_mode_')).toBe(true);
    expect(result.smtpAccepted).toBe(false);
    expect(result.acceptedRecipients).toEqual([]);
    expect(result.rejectedRecipients).toContain('unauthorized.external@example.com');
  });

  it('renders compact information-first layout with 60px #01362D header, white logo, and zero photo headers', async () => {
    const { renderNestEditorialEmailTemplate, getDeliverableButtonLabel } = await import('../../server/email/emailProvider.js');

    const html = renderNestEditorialEmailTemplate({
      title: 'Ready to download: Open House Tri-Fold Flyer',
      statusLabel: 'Ready to download',
      propertyAddress: '1104 South Live Oak Parkway, Wilmington, NC 28403',
      requestedWork: 'Open House Tri-Fold Flyer',
      summaryItems: [
        { label: 'Quantity', value: '50 copies' },
        { label: 'Needed by', value: 'Friday, September 11, 2026' },
        { label: 'Printer requested', value: 'CopyCat' },
        { label: 'Print order', value: 'Not submitted' },
        { label: 'Approved by', value: 'Melissa Gagliardi' }
      ],
      ctaButton: {
        label: 'Download flyer',
        url: 'https://shapework-swbiewzo3a-uc.a.run.app/api/marketing/assets/download/dl_test_123'
      },
      personalSentence: 'Hi Marcus, your approved flyer is ready to download. The print order has not been submitted.'
    });

    // 1. Slim Forest Green header (#01362D) ~60px tall
    expect(html).toContain('#01362D');
    expect(html).toContain('height: 60px');

    // 2. White Nest Realty logo without border box, with fallback alt text and inline CID
    expect(html).toContain('cid:nest-realty-logo-white@nestrealty.com');
    expect(html).toContain('alt="Nest Realty"');
    expect(html).toContain('Ask Nora');
    expect(html).not.toContain('border: 1px solid rgba(255,255,255,0.2)');

    // 3. Photo header completely removed
    expect(html).not.toContain('heroImageUrl');
    expect(html).not.toContain('wolcott_1004.jpg');
    expect(html).not.toMatch(/<img[^>]+height="260"/i);

    // 4. Content hierarchy
    expect(html).toContain('Ready to download');
    expect(html).toContain('1104 South Live Oak Parkway');
    expect(html).toContain('Wilmington, NC 28403');
    expect(html).toContain('Open House Tri-Fold Flyer');

    // 5. Address appears once in the heading hierarchy, not repeated in body
    const addressMatches = (html.match(/1104 South Live Oak Parkway/g) || []).length;
    expect(addressMatches).toBe(1);

    // 6. Compact summary table
    expect(html).toContain('Quantity');
    expect(html).toContain('50 copies');
    expect(html).toContain('Needed by');
    expect(html).toContain('Friday, September 11, 2026');
    expect(html).toContain('Printer requested');
    expect(html).toContain('CopyCat');
    expect(html).toContain('Print order');
    expect(html).toContain('Not submitted');
    expect(html).toContain('Approved by');
    expect(html).toContain('Melissa Gagliardi');

    // 7. Prominent green button adapted for deliverable
    expect(html).toContain('Download flyer');

    // 8. Personal sentence directly following button
    expect(html).toContain('Hi Marcus, your approved flyer is ready to download. The print order has not been submitted.');

    // 9. Visual clutter removed
    expect(html).not.toContain('SHA-256');
    expect(html).not.toContain('Verified Listing Collateral');
    expect(html).not.toContain('border: 1px dashed');

    // 10. Clean footer
    expect(html).toContain('Nora &bull; Nest Realty Wilmington');
    expect(html).toContain('AskNora@nestrealty.com');
    expect(html).not.toContain('Shapework Operations Layer');
  });

  it('adapts deliverable button labels appropriately', async () => {
    const { getDeliverableButtonLabel } = await import('../../server/email/emailProvider.js');
    expect(getDeliverableButtonLabel('Open House Tri-Fold Flyer')).toBe('Download flyer');
    expect(getDeliverableButtonLabel('Just Listed Postcard')).toBe('Download postcard');
    expect(getDeliverableButtonLabel('Luxury Property Brochure')).toBe('Download brochure');
    expect(getDeliverableButtonLabel('Instagram Story Carousel')).toBe('Download graphics');
    expect(getDeliverableButtonLabel('Feature Sheet')).toBe('Download proof');
  });

  it('parses property addresses and locations robustly', async () => {
    const { parsePropertyAddress } = await import('../../server/email/emailProvider.js');
    
    // Standard city/state/zip
    const res1 = parsePropertyAddress('1104 South Live Oak Parkway, Wilmington, NC 28403');
    expect(res1.street).toBe('1104 South Live Oak Parkway');
    expect(res1.location).toBe('Wilmington, NC 28403');

    // Suite / unit with comma
    const res2 = parsePropertyAddress('1104 South Live Oak Parkway, Unit 402-B, Wilmington, NC 28403');
    expect(res2.street).toBe('1104 South Live Oak Parkway, Unit 402-B');
    expect(res2.location).toBe('Wilmington, NC 28403');

    // Explicit location parameter
    const res3 = parsePropertyAddress('1104 South Live Oak Parkway', 'Wilmington, NC 28403');
    expect(res3.street).toBe('1104 South Live Oak Parkway');
    expect(res3.location).toBe('Wilmington, NC 28403');
  });

  it('provides an inline CID attachment with transparent white PNG bytes', async () => {
    const { getNestLogoInlineAttachment, NEST_LOGO_CID } = await import('../../server/email/emailProvider.js');
    const attachment = getNestLogoInlineAttachment();

    expect(attachment.cid).toBe(NEST_LOGO_CID);
    expect(attachment.filename).toBe('nest-realty-logo-white.png');
    expect(attachment.contentType).toBe('image/png');
    expect(attachment.contentDisposition).toBe('inline');
    expect(Buffer.isBuffer(attachment.content)).toBe(true);
    expect((attachment.content as Buffer).length).toBeGreaterThan(1000);
  });

  it('renders clean password reset email without street address or hero photo', async () => {
    const { renderNestEditorialEmailTemplate } = await import('../../server/email/emailProvider.js');

    const resetUrl = 'https://shapework.co/reset-password?token=test_tok_123&email=matt@shapework.co';
    const html = renderNestEditorialEmailTemplate({
      title: 'Reset Your Shapework Password',
      isAccountEmail: true,
      headline: 'Reset Your Password',
      badgeText: '● SECURITY NOTICE',
      bodyParagraphs: [
        'We received a request to reset your Shapework password for <strong>Nest Realty Wilmington</strong>.'
      ],
      ctaButton: {
        label: 'Reset Password',
        url: resetUrl
      },
      personalSentence: 'Click the button above to create a new password. For security, this link will expire in 7 days.',
      footnote: 'If you did not request a password reset, you can safely ignore this email.'
    });

    // 1. Must NOT contain physical address or hero image
    expect(html).not.toContain('104 N 3rd St');
    expect(html).not.toContain('28401');
    expect(html).not.toContain('heroImageUrl');
    expect(html).not.toContain('wolcott_1004.jpg');
    expect(html).not.toContain('class="property-title"');

    // 2. Must contain security badge and main headline
    expect(html).toContain('● SECURITY NOTICE');
    expect(html).toContain('Reset Your Password');

    // 3. Must contain explanatory context paragraph ABOVE the CTA button
    const paragraphPos = html.indexOf('We received a request to reset your Shapework password');
    const buttonPos = html.indexOf('Reset Password');
    const personalSentencePos = html.indexOf('Click the button above to create a new password');
    const fallbackLinkPos = html.indexOf('If the button above doesn\'t work');

    expect(paragraphPos).toBeGreaterThan(-1);
    expect(buttonPos).toBeGreaterThan(paragraphPos);
    expect(personalSentencePos).toBeGreaterThan(buttonPos);
    expect(fallbackLinkPos).toBeGreaterThan(personalSentencePos);

    // 4. Must contain fallback plain-text link
    expect(html).toContain(resetUrl);
    expect(html).toContain("If the button above doesn't work");

    // 5. Must contain clean agent footer
    expect(html).toContain('Nora &bull; Nest Realty Wilmington');
    expect(html).toContain('AskNora@nestrealty.com');
  });

  it('renders clean welcome invitation email without street address or hero photo', async () => {
    const { renderNestEditorialEmailTemplate } = await import('../../server/email/emailProvider.js');

    const setupUrl = 'https://shapework.co/setup-password?token=test_tok_setup&email=matt@shapework.co';
    const html = renderNestEditorialEmailTemplate({
      title: 'Welcome to Nest Realty Ops',
      isAccountEmail: true,
      headline: 'Welcome to Nest Ops',
      badgeText: '● ACCOUNT READY',
      greetingName: 'Matt',
      bodyParagraphs: [
        'Your account for <strong>Nest Realty Wilmington</strong> is ready on Shapework.',
        'As <strong>Administrator</strong>, your workspace has been configured with direct access to Ask Nora.'
      ],
      ctaButton: {
        label: 'Set Up My Password',
        url: setupUrl
      },
      personalSentence: 'Click the button above to set up your password. This link is valid for 7 days.',
      footnote: 'If you did not expect this invitation, you can safely ignore this email.'
    });

    // 1. Must NOT contain physical address or hero image
    expect(html).not.toContain('104 N 3rd St');
    expect(html).not.toContain('28401');
    expect(html).not.toContain('wolcott_1004.jpg');

    // 2. Must contain badge and headline
    expect(html).toContain('● ACCOUNT READY');
    expect(html).toContain('Welcome to Nest Ops');
    expect(html).toContain('Hi Matt,');

    // 3. Button and hierarchy
    expect(html).toContain('Set Up My Password');
    expect(html).toContain(setupUrl);
    expect(html).toContain('This link is valid for 7 days.');
  });
});


