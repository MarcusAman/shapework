/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getMicrosoftGraphClient } from './graphClient.js';

export interface OutlookCalendarEvent {
  id: string;
  subject?: string;
  bodyPreview?: string;
  start?: {
    dateTime?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    timeZone?: string;
  };
  webLink?: string;
}

export async function fetchOutlookCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<OutlookCalendarEvent[]> {
  if (process.env.MOCK_INTEGRATIONS === 'true' || accessToken.startsWith('dev_mock_')) {
    return [
      {
        id: 'ocal_ev_1',
        subject: 'Closing Escrow: Bruce Wayne',
        bodyPreview: 'Final signing compliance review for Gotham Mansion deal.',
        start: { dateTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString() },
        end: { dateTime: new Date(Date.now() + 25 * 3600 * 1000).toISOString() },
        webLink: 'https://outlook.live.com/owa/?path=/calendar/view/Month'
      },
      {
        id: 'ocal_ev_2',
        subject: 'Client Meetup: 102 Pine Street Prep',
        bodyPreview: 'Verify lead paint disclosures with buyer Arthur.',
        start: { dateTime: new Date(Date.now() + 48 * 3600 * 1000).toISOString() },
        end: { dateTime: new Date(Date.now() + 49 * 3600 * 1000).toISOString() },
        webLink: 'https://outlook.live.com/owa/?path=/calendar/view/Month'
      }
    ];
  }

  const client = getMicrosoftGraphClient(accessToken);
  try {
    const res = await client.api('/me/calendar/calendarView')
      .query({
        startDateTime: timeMin,
        endDateTime: timeMax
      })
      .get();
    return (res.value || []) as OutlookCalendarEvent[];
  } catch (err: any) {
    console.error('[Outlook Calendar Client] Failed to fetch events:', err.message);
    throw new Error(`Outlook Calendar API failure: ${err.message}`);
  }
}
