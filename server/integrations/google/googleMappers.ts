/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleCalendarEvent } from './googleCalendarClient.js';
import { WorkspaceCommunicationSignal } from '../shared/integrationTypes.js';

export function mapGoogleCalendarEventToSignal(
  event: GoogleCalendarEvent,
  workspaceId: string
): WorkspaceCommunicationSignal {
  const summary = event.summary || 'Untitled Event';
  const description = event.description || '';
  const lowercaseSummary = summary.toLowerCase();

  let signalType: WorkspaceCommunicationSignal['signalType'] = 'event_prep_needed';
  let title = `Google Calendar: ${summary}`;

  if (lowercaseSummary.includes('closing') || lowercaseSummary.includes('escrow') || lowercaseSummary.includes('signing')) {
    signalType = 'closing_detected';
    title = `Closing Escrow Detected: ${summary}`;
  } else if (lowercaseSummary.includes('meet') || lowercaseSummary.includes('prep') || lowercaseSummary.includes('disclosures')) {
    signalType = 'event_prep_needed';
    title = `Preparation Work Required: ${summary}`;
  } else if (lowercaseSummary.includes('conflict') || lowercaseSummary.includes('double')) {
    signalType = 'calendar_conflict';
    title = `Calendar Conflict Warning: ${summary}`;
  }

  const startDate = event.start?.dateTime || event.start?.date || new Date().toISOString();

  return {
    id: `signal_gcal_${event.id}`,
    workspaceId,
    provider: 'google_calendar',
    sourceRecordId: event.id,
    sourceUrl: event.htmlLink,
    signalType,
    title,
    summary: description || `Scheduled event from ${startDate}`,
    dueDate: startDate,
    status: 'new',
    createdAt: new Date().toISOString()
  };
}
