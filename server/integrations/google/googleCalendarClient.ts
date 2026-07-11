/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { google } from 'googleapis';
import { getAuthorizedOAuthClient } from './googleClient.js';

export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
}

export async function fetchGoogleCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<GoogleCalendarEvent[]> {
  // Mock fallback for test verification
  if (process.env.MOCK_INTEGRATIONS === 'true' || accessToken.startsWith('dev_mock_')) {
    return [
      {
        id: 'gcal_ev_1',
        summary: 'Closing Escrow: Bruce Wayne',
        description: 'Final signing compliance review for Gotham Mansion deal.',
        start: { dateTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString() },
        end: { dateTime: new Date(Date.now() + 25 * 3600 * 1000).toISOString() },
        htmlLink: 'https://calendar.google.com/event?id=gcal_ev_1'
      },
      {
        id: 'gcal_ev_2',
        summary: 'Client Meetup: 102 Pine Street Prep',
        description: 'Verify lead paint disclosures with buyer Arthur.',
        start: { dateTime: new Date(Date.now() + 48 * 3600 * 1000).toISOString() },
        end: { dateTime: new Date(Date.now() + 49 * 3600 * 1000).toISOString() },
        htmlLink: 'https://calendar.google.com/event?id=gcal_ev_2'
      }
    ];
  }

  const client = getAuthorizedOAuthClient(accessToken);
  const calendar = google.calendar({ version: 'v3', auth: client });

  try {
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime'
    });
    return (res.data.items || []) as GoogleCalendarEvent[];
  } catch (err: any) {
    console.error('[Google Calendar Client] Failed to fetch events:', err.message);
    throw new Error(`Google Calendar API failure: ${err.message}`);
  }
}
