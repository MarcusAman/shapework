/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getMicrosoftGraphClient } from './graphClient.js';

export async function sendOutlookEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<string> {
  if (process.env.MOCK_INTEGRATIONS === 'true' || accessToken.startsWith('dev_mock_')) {
    console.log(`[Outlook Client] Mock sending email to: ${to}`);
    return `mock_outlook_msg_${Date.now()}`;
  }

  const client = getMicrosoftGraphClient(accessToken);
  const message = {
    subject,
    body: {
      contentType: 'HTML',
      content: body
    },
    toRecipients: [
      {
        emailAddress: {
          address: to
        }
      }
    ]
  };

  try {
    const res = await client.api('/me/sendMail').post({ message });
    // Graph sendMail returns 202 status code and empty body, so we generate a safe reference ID
    return `outlook_msg_${Date.now()}`;
  } catch (err: any) {
    console.error('[Outlook Client] Failed to send email via Microsoft Graph API:', err.message);
    throw new Error(`Microsoft Graph API failure: ${err.message}`);
  }
}

export interface OutlookMessage {
  id: string;
  subject?: string;
  bodyPreview?: string;
  from?: {
    emailAddress?: {
      address?: string;
      name?: string;
    };
  };
  receivedDateTime?: string;
}

export async function fetchRecentOutlookMessages(
  accessToken: string
): Promise<OutlookMessage[]> {
  if (process.env.MOCK_INTEGRATIONS === 'true' || accessToken.startsWith('dev_mock_')) {
    return [
      {
        id: 'out_msg_1',
        subject: 'URGENT: Missing wiring approval for 109 Woodlawn',
        bodyPreview: 'Please assign the wiring disclosure checklist to Sarah J so we can release escrow funds.',
        from: { emailAddress: { address: 'owner.partner@realty.com', name: 'James Partner' } },
        receivedDateTime: new Date().toISOString()
      }
    ];
  }

  const client = getMicrosoftGraphClient(accessToken);
  try {
    const res = await client.api('/me/messages')
      .select('id,subject,bodyPreview,from,receivedDateTime')
      .top(10)
      .get();
    return res.value || [];
  } catch (err: any) {
    console.error('[Outlook Client] Failed to fetch recent messages:', err.message);
    throw new Error(`Graph messages API failure: ${err.message}`);
  }
}
