import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { ResendProvider } from '../server/growth/providers/ResendProvider.js';

dotenv.config();

async function run() {
  console.log('[Smoke Test] Starting real Resend provider smoke test...');

  const enabled = process.env.RUN_REAL_RESEND_SMOKE_TEST === 'true';
  if (!enabled) {
    console.log('[Smoke Test] Skipped: RUN_REAL_RESEND_SMOKE_TEST is not set to true.');
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[Smoke Test] Failed: RESEND_API_KEY environment variable is missing.');
    process.exit(1);
  }

  const recipient = process.env.RESEND_TEST_RECIPIENT;
  if (!recipient) {
    console.error('[Smoke Test] Failed: RESEND_TEST_RECIPIENT is missing.');
    process.exit(1);
  }

  // Refuse multiple recipients
  if (recipient.includes(',') || recipient.includes(';') || recipient.trim().includes(' ')) {
    console.error('[Smoke Test] Failed: Multiple recipients are not allowed.');
    process.exit(1);
  }

  const fromEmail = process.env.RESEND_TEST_FROM;
  if (!fromEmail) {
    console.error('[Smoke Test] Failed: RESEND_TEST_FROM is missing.');
    process.exit(1);
  }

  // Refuse campaign/audience contact imports
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  if (fs.existsSync(dbPath)) {
    try {
      const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      const contacts = db.contacts || [];
      const isCampaignContact = contacts.some(
        (c: any) => c.email.toLowerCase() === recipient.toLowerCase()
      );
      if (isCampaignContact) {
        console.error('[Smoke Test] Refused: Recipient matches a campaign contact in the database.');
        process.exit(1);
      }
    } catch (err: any) {
      console.warn('[Smoke Test] Warning: Could not parse database to verify contacts:', err.message);
    }
  }

  console.log(`[Smoke Test] Sending exactly one test email to: ${recipient} from: ${fromEmail}`);
  
  // Real resend provider instance running in production mode
  const provider = new ResendProvider(apiKey, 'production');

  const unsubLink = 'https://localhost:3557/unsubscribe/smoke-test';
  const bodyContent = '<h1>Smoke Test</h1><p>This is a safe test email validating real Resend connectivity.</p>' +
    `<br/><br/><hr/><p style="font-size:12px;color:#666;">If you no longer wish to receive these emails, you can <a href="${unsubLink}">unsubscribe here</a>.</p>`;

  try {
    const result = await provider.sendEmail({
      to: recipient,
      from: fromEmail,
      subject: 'Shapework Growth Engine: Real Provider Smoke Test',
      body: bodyContent,
      headers: {
        'List-Unsubscribe': `<${unsubLink}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      }
    });

    const emailMessageId = `msg_smoke_${Math.random().toString(36).substring(2, 11)}`;

    console.log('[Smoke Test] Success!');
    console.log('  provider_message_id:', result.messageId);

    // Save to db if db exists
    if (fs.existsSync(dbPath)) {
      try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        db.emailMessages = db.emailMessages || [];
        db.providerLogs = db.providerLogs || [];

        db.emailMessages.push({
          id: emailMessageId,
          workspaceId: 'nest-realty-demo',
          campaignId: 'smoke-test-campaign',
          campaignStepId: 'smoke-test-step',
          contactId: 'smoke-test-contact',
          provider: 'resend',
          providerMessageId: result.messageId,
          fromEmail,
          toEmail: recipient,
          subject: 'Shapework Growth Engine: Real Provider Smoke Test',
          body: bodyContent,
          status: 'sent',
          sentAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });

        db.providerLogs.push({
          id: `log_smoke_${Math.random().toString(36).substring(2, 11)}`,
          workspaceId: 'nest-realty-demo',
          provider: 'resend',
          mode: 'production',
          action: 'email_send_smoke_test',
          status: 'success',
          requestMetadata: { to: recipient, from: fromEmail },
          responseMetadata: { providerMessageId: result.messageId },
          providerObjectId: result.messageId || null,
          createdAt: new Date().toISOString()
        });

        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
        console.log('  stored email_message_id:', emailMessageId);
      } catch (dbErr: any) {
        console.warn('[Smoke Test] Could not write to local DB:', dbErr.message);
      }
    }
  } catch (err: any) {
    console.error('[Smoke Test] Failed to send email via Resend API:', err.message);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error('[Smoke Test] Fatal error:', e);
  process.exit(1);
});
