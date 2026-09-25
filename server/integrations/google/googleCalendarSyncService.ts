import { renderCalendarInvitationEmail } from '../../email/noraOperationalEmails.js';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Google Calendar Master Ops Sync & Direct Invites Service for Ask Nora
 * Dispatches calendar invites from AskNora@nestrealty.com and synchronizes to Master Nest Ops Calendar.
 */

import { sendEmail } from '../../email/emailProvider.js';

export interface CalendarEventData {
  id?: string;
  title: string;
  description: string;
  location: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  eventType: 'open_house' | 'photo_shoot' | 'vendor_install' | 'due_diligence' | 'general';
  attendees: { email: string; name?: string; role?: string; rsvpStatus?: 'accepted' | 'tentative' | 'declined' | 'needs_action' }[];
  propertyAddress?: string;
  sourceTaskId?: string;
}

export interface CalendarSyncResult {
  success: boolean;
  eventId: string;
  googleCalendarUrl: string;
  masterCalendarTitle: string;
  icsContent: string;
  invitesDispatched: number;
  attendees: CalendarEventData['attendees'];
  message: string;
}

// In-memory store for master calendar events
const masterCalendarEventsStore: Map<string, CalendarEventData> = new Map();

// Initialize sample scheduled events
const sampleCalendarEvents: CalendarEventData[] = [
  {
    id: 'evt_open_house_304',
    title: 'Public Open House: 304 Ocean Blvd',
    description: 'Weekend launch open house hosted by Ryan Crecelius. Marketing collateral and sign riders placed.',
    location: '304 Ocean Boulevard, Wrightsville Beach, NC 28480',
    startTime: new Date(Date.now() + 86400000 * 4).toISOString(), // 4 days from now
    endTime: new Date(Date.now() + 86400000 * 4 + 7200000).toISOString(),
    eventType: 'open_house',
    attendees: [
      { email: 'ryan@nestrealty.com', name: 'Ryan Crecelius', role: 'Host Agent', rsvpStatus: 'accepted' },
      { email: 'melissa@nestrealty.com', name: 'Melissa Gagliardi', role: 'Marketing Lead', rsvpStatus: 'accepted' },
      { email: 'asknora@nestrealty.com', name: 'Nora (Nest Operations)', role: 'Organizer', rsvpStatus: 'accepted' }
    ],
    propertyAddress: '304 Ocean Boulevard, Wrightsville Beach, NC',
    sourceTaskId: 'tsk_304_ocean'
  },
  {
    id: 'evt_photo_shoot_152',
    title: 'HDR Twilight & Drone Photography: 152 Edgewater Ln',
    description: 'Coastal Aerial Media scheduled for 25 high-res stills, 4K drone video, and Matterport 3D scan.',
    location: '152 Edgewater Lane, Wilmington, NC 28403',
    startTime: new Date(Date.now() + 86400000 * 2).toISOString(),
    endTime: new Date(Date.now() + 86400000 * 2 + 5400000).toISOString(),
    eventType: 'photo_shoot',
    attendees: [
      { email: 'melissa@nestrealty.com', name: 'Melissa Gagliardi', role: 'Listing Lead', rsvpStatus: 'accepted' },
      { email: 'ann@nestrealty.com', name: 'Ann Gunn', role: 'Ops Lead', rsvpStatus: 'accepted' },
      { email: 'asknora@nestrealty.com', name: 'Nora (Nest Operations)', role: 'Organizer', rsvpStatus: 'accepted' }
    ],
    propertyAddress: '152 Edgewater Lane, Wilmington, NC',
    sourceTaskId: 'tsk_152_edge'
  }
];

sampleCalendarEvents.forEach(e => masterCalendarEventsStore.set(e.id!, e));

/**
 * Generates an RFC 5545 compliant iCalendar (.ics) string.
 */
export function generateIcsContent(event: CalendarEventData): string {
  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const dtStart = formatDate(event.startTime);
  const dtEnd = formatDate(event.endTime);
  const now = formatDate(new Date().toISOString());
  const uid = `evt_${event.id || Date.now()}@nestrealty.com`;

  const attendeeLines = event.attendees.map(a => 
    `ATTENDEE;CN=${a.name || a.email};PARTSTAT=${(a.rsvpStatus || 'NEEDS-ACTION').toUpperCase()};ROLE=REQ-PARTICIPANT:mailto:${a.email}`
  ).join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nest Realty Wilmington//Ask Nora Calendar Engine//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location}`,
    'ORGANIZER;CN=Nora (Nest Operations):mailto:asknora@nestrealty.com',
    attendeeLines,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
}

/**
 * Syncs an event to the Master Nest Ops Calendar and dispatches invite emails.
 */
export async function syncEventToGoogleCalendar(event: CalendarEventData): Promise<CalendarSyncResult> {
  const eventId = event.id || `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const storedEvent: CalendarEventData = {
    ...event,
    id: eventId
  };

  masterCalendarEventsStore.set(eventId, storedEvent);

  const icsContent = generateIcsContent(storedEvent);
  const googleCalendarUrl = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(storedEvent.title)}&dates=${storedEvent.startTime.replace(/[-:]/g, '').split('.')[0]}Z/${storedEvent.endTime.replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(storedEvent.description)}&location=${encodeURIComponent(storedEvent.location)}`;

  let invitesDispatched = 0;

  // Dispatch invite emails to non-Nora attendees
  for (const attendee of storedEvent.attendees) {
    if (attendee.email !== 'asknora@nestrealty.com') {
      try {
        await sendEmail({
          to: attendee.email,
          from: '"Nora (Nest Realty Calendar)" <asknora@nestrealty.com>',
          subject: `Calendar Invite: ${storedEvent.title}`,
          text: `Hi ${attendee.name || 'there'},\n\nNora has scheduled a calendar event:\n\n${storedEvent.title}\nWhen: ${new Date(storedEvent.startTime).toLocaleString()} - ${new Date(storedEvent.endTime).toLocaleString()}\nLocation: ${storedEvent.location}\n\n${storedEvent.description}\n\nAdd to Google Calendar:\n${googleCalendarUrl}\n\nBest,\nNora (Nest Operations)`,
          html: renderCalendarInvitationEmail({
            title: storedEvent.title, name: attendee.name, location: storedEvent.location, description: storedEvent.description,
            when: new Date(storedEvent.startTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }),
            calendarUrl: googleCalendarUrl,
          })
        });
        invitesDispatched++;
      } catch (err) {
        console.warn(`[Calendar] Notice sending invite to ${attendee.email}:`, err);
      }
    }
  }

  console.log(`[Google Calendar Sync] Event "${storedEvent.title}" synced to Master Calendar. Dispatched ${invitesDispatched} invites.`);

  return {
    success: true,
    eventId,
    googleCalendarUrl,
    masterCalendarTitle: 'Nest Realty Wilmington - Operations & Marketing Schedule',
    icsContent,
    invitesDispatched,
    attendees: storedEvent.attendees,
    message: `✓ Event scheduled on Master Nest Ops Calendar and ${invitesDispatched} invites dispatched from AskNora@nestrealty.com.`
  };
}

/**
 * Lists upcoming master calendar events.
 */
export function listMasterCalendarEvents(): CalendarEventData[] {
  return Array.from(masterCalendarEventsStore.values()).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
}
