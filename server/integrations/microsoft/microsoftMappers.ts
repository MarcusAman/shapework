/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OutlookCalendarEvent } from './microsoftCalendarClient.js';
import { OutlookMessage } from './outlookClient.js';
import { TeamsMessage } from './teamsClient.js';
import { WorkspaceCommunicationSignal } from '../shared/integrationTypes.js';

export function mapOutlookCalendarEventToSignal(
  event: OutlookCalendarEvent,
  workspaceId: string
): WorkspaceCommunicationSignal {
  const summary = event.subject || 'Untitled Event';
  const description = event.bodyPreview || '';
  const lowercaseSummary = summary.toLowerCase();

  let signalType: WorkspaceCommunicationSignal['signalType'] = 'event_prep_needed';
  let title = `Outlook Calendar: ${summary}`;

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

  const startDate = event.start?.dateTime || new Date().toISOString();

  return {
    id: `signal_ocal_${event.id}`,
    workspaceId,
    provider: 'outlook_calendar',
    sourceRecordId: event.id,
    sourceUrl: event.webLink,
    signalType,
    title,
    summary: description || `Scheduled event from ${startDate}`,
    dueDate: startDate,
    status: 'new',
    createdAt: new Date().toISOString()
  };
}

export function mapOutlookMessageToSignal(
  msg: OutlookMessage,
  workspaceId: string
): WorkspaceCommunicationSignal {
  const subject = msg.subject || 'No Subject';
  const bodyPreview = msg.bodyPreview || '';
  const lowercaseSubject = subject.toLowerCase();
  const lowercaseBody = bodyPreview.toLowerCase();

  let signalType: WorkspaceCommunicationSignal['signalType'] = 'inbound_request';
  let title = `Inbound Email: ${subject}`;

  if (lowercaseSubject.includes('urgent') || lowercaseBody.includes('urgent') || lowercaseBody.includes('@owner') || lowercaseSubject.includes('wiring')) {
    signalType = 'owner_mentioned';
    title = `Owner Shield Alarm: ${subject}`;
  } else if (lowercaseSubject.includes('approve') || lowercaseBody.includes('approve')) {
    signalType = 'approval_needed';
    title = `Approval Requested: ${subject}`;
  }

  return {
    id: `signal_outlook_${msg.id}`,
    workspaceId,
    provider: 'outlook',
    sourceRecordId: msg.id,
    signalType,
    title,
    summary: bodyPreview,
    relatedPersonEmail: msg.from?.emailAddress?.address,
    status: 'new',
    createdAt: msg.receivedDateTime || new Date().toISOString()
  };
}

export function mapTeamsMessageToSignal(
  msg: TeamsMessage,
  workspaceId: string
): WorkspaceCommunicationSignal {
  const content = msg.body?.content || '';
  const lowercaseContent = content.toLowerCase();

  let signalType: WorkspaceCommunicationSignal['signalType'] = 'unassigned_team_thread';
  let title = 'Teams Coordination Thread';

  if (lowercaseContent.includes('@owner') || lowercaseContent.includes('owner')) {
    signalType = 'owner_mentioned';
    title = 'Teams Mention Alarm';
  } else if (lowercaseContent.includes('marketing') || lowercaseContent.includes('office') || lowercaseContent.includes('supplies')) {
    signalType = 'unassigned_team_thread';
    title = 'Teams Unassigned Thread';
  }

  const createdTime = msg.createdDateTime || new Date().toISOString();
  const createdMs = new Date(createdTime).getTime();
  const isOverdue = (Date.now() - createdMs) > 24 * 3600 * 1000; // Active > 24 hrs
  if (isOverdue && signalType === 'unassigned_team_thread') {
    signalType = 'overdue_team_followup';
    title = 'Teams Overdue Thread Alarm';
  }

  return {
    id: `signal_teams_${msg.id}`,
    workspaceId,
    provider: 'microsoft_teams',
    sourceRecordId: msg.id,
    sourceUrl: msg.webUrl,
    signalType,
    title,
    summary: content.replace(/<[^>]*>/g, ''), // Strip tags
    relatedPersonEmail: msg.from?.user?.displayName,
    status: 'new',
    createdAt: createdTime
  };
}
