import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import fs from 'fs';
import path from 'path';

// Import router under test
import { supportRouter } from '../../server/routes/supportRouter.js';
import * as emailProvider from '../../server/email/emailProvider.js';

describe('Support Ticket Submission & Email Forwarding Engine', () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;
  let sendEmailSpy: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json({ limit: '20mb' }));
    app.use('/api/support', supportRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  beforeEach(() => {
    vi.restoreAllMocks();

    // Spy on email provider
    sendEmailSpy = vi.spyOn(emailProvider, 'sendEmail').mockResolvedValue({
      success: true,
      messageId: 'test_msg_support_123',
      smtpAccepted: true,
      smtpResponse: '250 OK'
    } as any);
  });

  it('GET /api/support/health returns service info with primary recipient and support channel', async () => {
    const res = await fetch(`${baseUrl}/api/support/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.primaryRecipient).toBe('marcus.aman@gmail.com');
    expect(body.supportChannel).toBe('support@shapework.co');
  });

  it('POST /api/support/ticket rejects requests without a description', async () => {
    const res = await fetch(`${baseUrl}/api/support/ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageUrl: 'https://shapework.co/app/tasks',
        userEmail: 'agent@nestrealty.com'
      })
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Issue description is required');
  });

  it('POST /api/support/ticket successfully dispatches email to marcus.aman@gmail.com with support@shapework.co CC and replyTo', async () => {
    const res = await fetch(`${baseUrl}/api/support/ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'The task card drag and drop into Intake Received is not persisting.',
        pageUrl: 'https://shapework.co/app/tasks?subtab=requests&view=board',
        pageTitle: 'Marketing Tasks Board',
        userName: 'Sarah Jenkins',
        userEmail: 'sarah.jenkins@nestrealty.com',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      })
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.ticketId).toMatch(/^tick_\d+_/);
    expect(body.emailSent).toBe(true);

    // Verify email delivery parameters
    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
    const emailCallArgs = sendEmailSpy.mock.calls[0][0];

    // Recipient requirements
    expect(emailCallArgs.to).toBe('marcus.aman@gmail.com');
    expect(emailCallArgs.cc).toBe('support@shapework.co');
    expect(emailCallArgs.replyTo).toBe('sarah.jenkins@nestrealty.com');
    expect(emailCallArgs.subject).toContain('Sarah Jenkins');
    expect(emailCallArgs.html).toContain('The task card drag and drop into Intake Received is not persisting.');
    expect(emailCallArgs.html).toContain('https://shapework.co/app/tasks?subtab=requests&amp;view=board');
  });

  it('POST /api/support/ticket attaches and decodes base64 screenshot correctly', async () => {
    // 1x1 transparent PNG data URI
    const testPngDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const res = await fetch(`${baseUrl}/api/support/ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Here is a screenshot of the broken button.',
        pageUrl: 'https://shapework.co/app/workspace',
        userName: 'Matt Orr',
        userEmail: 'matt.orr@nestrealty.com',
        screenshot: testPngDataUri
      })
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    const emailCallArgs = sendEmailSpy.mock.calls[0][0];
    expect(emailCallArgs.attachments).toBeDefined();
    expect(emailCallArgs.attachments.length).toBe(1);

    const attachment = emailCallArgs.attachments[0];
    expect(attachment.filename).toMatch(/^screenshot_tick_\d+.*\.png$/);
    expect(attachment.contentType).toBe('image/png');
    expect(attachment.cid).toBe('support-screenshot');
    expect(Buffer.isBuffer(attachment.content)).toBe(true);
    expect(attachment.content.length).toBeGreaterThan(0);
  });

  it('verifies support ticket is appended to data/support_tickets.jsonl audit log', async () => {
    const res = await fetch(`${baseUrl}/api/support/ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Audit log verification test ticket.',
        pageUrl: 'https://shapework.co/audit',
        userName: 'Auditor',
        userEmail: 'audit@shapework.co'
      })
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    const ticketId = body.ticketId;

    const logPath = path.join(process.cwd(), 'data', 'support_tickets.jsonl');
    expect(fs.existsSync(logPath)).toBe(true);

    const logContent = fs.readFileSync(logPath, 'utf-8');
    expect(logContent).toContain(ticketId);
    expect(logContent).toContain('Audit log verification test ticket.');
  });
});

describe('ContactSupportModal UI Rendering', () => {
  it('renders modal with support@shapework.co, removes phone number and tel: links', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { default: ContactSupportModal } = await import('../components/shared/ContactSupportModal');

    const html = renderToStaticMarkup(
      React.createElement(ContactSupportModal, {
        isOpen: true,
        onClose: () => {},
        userEmail: 'marcus@shapework.co',
        userName: 'Marcus Aman'
      })
    );

    // Title and branding
    expect(html).toContain('Submit Support Request');
    expect(html).toContain('Shapework &amp; Operations Technical Support');

    // Email channel displayed
    expect(html).toContain('support@shapework.co');

    // NO phone number or tel: links
    expect(html).not.toContain('910-507-2047');
    expect(html).not.toContain('9105072047');
    expect(html).not.toContain('tel:');

    // Form fields present
    expect(html).toContain('Describe the Issue');
    expect(html).toContain('Page / Location of Issue');
    expect(html).toContain('Screenshot of Issue (Optional)');
    expect(html).toContain('Click to upload screenshot');
    expect(html).toContain('Submit Support Ticket');
  });

  it('renders nothing when isOpen is false', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { default: ContactSupportModal } = await import('../components/shared/ContactSupportModal');

    const html = renderToStaticMarkup(
      React.createElement(ContactSupportModal, {
        isOpen: false,
        onClose: () => {}
      })
    );

    expect(html).toBe('');
  });
});
