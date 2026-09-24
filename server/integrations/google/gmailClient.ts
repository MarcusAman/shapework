/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { google } from 'googleapis';
import { getAuthorizedOAuthClient } from './googleClient.js';
import { checkOutbound } from '../../email/outboundGate.js';
import { deliverGmailMessage } from '../../email/gatedTransport.js';

function buildMimeMessage(to: string, subject: string, body: string): string {
  const emailLines = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    body
  ];
  const email = emailLines.join('\r\n');
  return Buffer.from(email).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function sendGmailEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<string> {
  const gate = checkOutbound({ to, channel: 'gmail', source: 'gmailClient' });
  if (!gate.allowed) {
    throw new Error(`Outbound ${gate.reason}: Gmail message was not sent.`);
  }

  // If in local mock testing mode
  if (process.env.MOCK_INTEGRATIONS === 'true' || accessToken.startsWith('dev_mock_')) {
    console.log(`[Gmail Client] Mock sending email to: ${to}`);
    return `mock_gmail_msg_${Date.now()}`;
  }

  const client = getAuthorizedOAuthClient(accessToken);
  const gmail = google.gmail({ version: 'v1', auth: client });

  const raw = buildMimeMessage(gate.effectiveTo[0] || to, subject, body);

  try {
    const res = await deliverGmailMessage(gmail, {
      requestBody: { raw },
      to: gate.effectiveTo,
      source: 'gmailClient',
    });
    if (!res.sent) {
      throw new Error(`Outbound ${res.gate.reason}: Gmail message was not sent.`);
    }
    return res.messageId || res.response?.data?.id || '';
  } catch (err: any) {
    console.error('[Gmail Client] Failed to send email via Gmail API:', err.message);
    throw new Error(`Gmail API failure: ${err.message}`);
  }
}
