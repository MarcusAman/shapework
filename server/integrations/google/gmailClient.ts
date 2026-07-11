/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { google } from 'googleapis';
import { getAuthorizedOAuthClient } from './googleClient.js';

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
  // If in local mock testing mode
  if (process.env.MOCK_INTEGRATIONS === 'true' || accessToken.startsWith('dev_mock_')) {
    console.log(`[Gmail Client] Mock sending email to: ${to}`);
    return `mock_gmail_msg_${Date.now()}`;
  }

  const client = getAuthorizedOAuthClient(accessToken);
  const gmail = google.gmail({ version: 'v1', auth: client });

  const raw = buildMimeMessage(to, subject, body);

  try {
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw
      }
    });
    return res.data.id || '';
  } catch (err: any) {
    console.error('[Gmail Client] Failed to send email via Gmail API:', err.message);
    throw new Error(`Gmail API failure: ${err.message}`);
  }
}
