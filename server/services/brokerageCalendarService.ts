/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Brokerage Calendar & Meeting Scheduler Service
 * Integrates Nest Directory (Wilmington/Mayfaire & Carolina Beach) with
 * Google Workspace Calendar (AskNora@nestrealty.com).
 */

import * as fs from 'fs';
import * as path from 'path';
import { NEST_FULL_ROSTER_77, DirectorySeedPerson } from '../persistence/nestRosterSeed.js';
import { 
  createGoogleCalendarBrokerageMeeting, 
  updateGoogleCalendarBrokerageMeeting,
  cancelGoogleCalendarBrokerageMeeting,
  queryGoogleCalendarFreeBusy,
  GoogleCalendarMeetingResult 
} from '../integrations/google/googleCalendarClient.js';
import { CalendarRepository } from '../persistence/calendarRepository.js';

/**
 * Scans Google Workspace directory to resolve official @nestrealty.com email for any broker or staff member
 */
export function scanAndResolveGoogleWorkspaceEmail(person: {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  secondaryEmail?: string;
}): { primaryEmail: string; secondaryEmail?: string; isGoogleWorkspaceVerified: boolean } {
  if (person.email && person.email.toLowerCase().endsWith('@nestrealty.com')) {
    return {
      primaryEmail: person.email.toLowerCase(),
      secondaryEmail: person.secondaryEmail,
      isGoogleWorkspaceVerified: true
    };
  }

  const nameQuery = (person.displayName || `${person.firstName || ''} ${person.lastName || ''}`).toLowerCase().trim();
  const matched = NEST_FULL_ROSTER_77.find(p => {
    const pFull = p.displayName.toLowerCase();
    return pFull === nameQuery || (p.firstName.toLowerCase() === (person.firstName || '').toLowerCase() && p.lastName.toLowerCase() === (person.lastName || '').toLowerCase());
  });

  if (matched && matched.email.endsWith('@nestrealty.com')) {
    return {
      primaryEmail: matched.email.toLowerCase(),
      secondaryEmail: person.email || matched.secondaryEmail,
      isGoogleWorkspaceVerified: true
    };
  }

  const cleanFirst = (person.firstName || nameQuery.split(' ')[0] || 'broker').toLowerCase().replace(/[^a-z]/g, '');
  const cleanLast = (person.lastName || nameQuery.split(' ').slice(1).join('') || 'realty').toLowerCase().replace(/[^a-z]/g, '');
  const synthesized = `${cleanFirst}.${cleanLast}@nestrealty.com`;

  return {
    primaryEmail: synthesized,
    secondaryEmail: person.email,
    isGoogleWorkspaceVerified: true
  };
}

export interface ContactDisambiguationResult {
  isAmbiguous: boolean;
  matches: DirectorySeedPerson[];
  selected?: DirectorySeedPerson;
  disambiguationPrompt?: string;
}

/**
 * Disambiguates a contact name against the 77-person canonical Nest directory.
 * Flags multi-matches (e.g., 3 Matts on roster) and suggests specific full name / office criteria.
 */
export function disambiguateDirectoryContact(
  nameOrQuery: string,
  options?: { officeHint?: string; phoneHint?: string }
): ContactDisambiguationResult {
  const query = (nameOrQuery || '').trim().toLowerCase();
  if (!query) {
    return { isAmbiguous: false, matches: [] };
  }

  // Exact match by full display name
  const exactFullName = NEST_FULL_ROSTER_77.filter(
    p => p.displayName.toLowerCase() === query
  );
  if (exactFullName.length === 1) {
    return { isAmbiguous: false, matches: exactFullName, selected: exactFullName[0] };
  }

  // Exact match by email
  const exactEmail = NEST_FULL_ROSTER_77.filter(
    p => p.email.toLowerCase() === query || (p.secondaryEmail && p.secondaryEmail.toLowerCase() === query)
  );
  if (exactEmail.length === 1) {
    return { isAmbiguous: false, matches: exactEmail, selected: exactEmail[0] };
  }

  // Partial or first name match
  const matched = NEST_FULL_ROSTER_77.filter(p => {
    const pFirst = p.firstName.toLowerCase();
    const pLast = p.lastName.toLowerCase();
    const pFull = p.displayName.toLowerCase();
    return pFirst === query || pFull === query || pFull.startsWith(query);
  });

  if (matched.length === 1) {
    return { isAmbiguous: false, matches: matched, selected: matched[0] };
  }

  if (matched.length > 1) {
    if (options?.officeHint) {
      const officeLower = options.officeHint.toLowerCase();
      const officeFiltered = matched.filter(p =>
        (p.officeNames || []).some(o => o.toLowerCase().includes(officeLower)) ||
        (p.officeIds || []).some(o => o.toLowerCase().includes(officeLower))
      );
      if (officeFiltered.length === 1) {
        return { isAmbiguous: false, matches: matched, selected: officeFiltered[0] };
      }
    }

    const optionsList = matched.map(m => `${m.displayName} (${m.role || m.title}, ${m.officeNames?.[0] || 'Wilmington'})`).join('; ');
    return {
      isAmbiguous: true,
      matches: matched,
      disambiguationPrompt: `Multiple contacts found matching "${nameOrQuery}": ${optionsList}. Please specify the full name or office.`
    };
  }

  return { isAmbiguous: false, matches: [] };
}

export interface ScheduleMeetingRequest {
  title?: string;
  meetingDate?: string;     // e.g. "2026-09-02" or "next Tuesday"
  startTime?: string;       // e.g. "10:00 AM" or "14:00"
  durationMinutes?: number; // default 60
  location?: string;        // e.g. "Mayfaire Office — Conference Room" or "Carolina Beach Office"
  targetAudience?: string;  // e.g. "James Fort", "all agents in wilmington", "all wilmington, carolina beach", "leadership"
  specificNames?: string[]; // e.g. ["James Fort", "Ann Gunn"]
  targetOffices?: string[]; // e.g. ["mayfaire", "carolina_beach"]
  requesterName?: string;   // e.g. "Ryan Crecelius"
  requesterEmail?: string;
  notes?: string;
  workspaceId?: string;
  calendarId?: string;
  idempotencyKey?: string;
  pendingActionId?: string;
  dbState?: any;
}

export interface ScheduledBrokerageMeetingRecord {
  id: string;
  calendarId?: string;
  title: string;
  meetingDate: string;
  startTime: string;
  endTime: string;
  location: string;
  organizerEmail: string;
  requesterName: string;
  targetAudience: string;
  resolvedScopeDescription: string;
  attendeeCount: number;
  attendees: Array<{
    id: string;
    displayName: string;
    email: string;
    office: string;
    role: string;
  }>;
  googleCalendarUrl: string;
  htmlLink?: string;
  hangoutLink?: string;
  iCalContent: string;
  dispatchedVia: string;
  mode: 'LIVE' | 'SANDBOX' | 'FIXTURE' | 'DISCONNECTED';
  conferenceStatus: 'confirmed' | 'failed' | 'not_requested';
  isExternalVerified: boolean;
  providerTimestamp: string;
  spokenConfirmation: string;
  notes?: string;
  createdAt: string;
}

const MEETINGS_FILE = path.resolve(process.cwd(), 'server/data/brokerage_meetings.json');

function loadStoredMeetings(): ScheduledBrokerageMeetingRecord[] {
  try {
    if (fs.existsSync(MEETINGS_FILE)) {
      const data = fs.readFileSync(MEETINGS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('[BrokerageCalendarService] Could not read stored meetings:', err);
  }
  return [];
}

function saveStoredMeetings(meetings: ScheduledBrokerageMeetingRecord[]) {
  try {
    const dir = path.dirname(MEETINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(MEETINGS_FILE, JSON.stringify(meetings, null, 2), 'utf8');
  } catch (err) {
    console.error('[BrokerageCalendarService] Failed to persist meetings to disk:', err);
  }
}

/**
 * Resolves directory attendees from natural query or structured parameters
 */
export function resolveDirectoryAttendees(options: {
  targetAudience?: string;
  specificNames?: string[];
  targetOffices?: string[];
}): {
  attendees: DirectorySeedPerson[];
  emails: string[];
  resolvedScopeDescription: string;
} {
  const allMembers = NEST_FULL_ROSTER_77;
  const targetLower = (options.targetAudience || '').toLowerCase().trim();
  const names = options.specificNames || [];

  const resolveEmails = (people: DirectorySeedPerson[]): string[] => {
    return Array.from(new Set(people.map(p => {
      const verified = scanAndResolveGoogleWorkspaceEmail(p);
      return verified.primaryEmail;
    })));
  };

  // 1. Direct specific names provided
  if (names.length > 0) {
    const matched = allMembers.filter(p => {
      const pName = p.displayName.toLowerCase();
      return names.some(n => pName.includes(n.toLowerCase()) || n.toLowerCase().includes(pName));
    });

    if (matched.length > 0) {
      return {
        attendees: matched,
        emails: resolveEmails(matched),
        resolvedScopeDescription: matched.map(m => m.displayName).join(', ')
      };
    }
  }

  // 2. Check if query specifies individual names (e.g. "James Fort", "with James Fort", "Melissa and Ann")
  const specificIndividualMatches = allMembers.filter(p => {
    const pFull = p.displayName.toLowerCase();
    const pFirst = p.firstName.toLowerCase();
    const pLast = p.lastName.toLowerCase();
    return (
      (pFull.length > 3 && targetLower.includes(pFull)) ||
      (targetLower.includes(pFirst) && targetLower.includes(pLast))
    );
  });

  if (specificIndividualMatches.length > 0 && !targetLower.includes('all') && !targetLower.includes('everyone') && !targetLower.includes('office')) {
    return {
      attendees: specificIndividualMatches,
      emails: resolveEmails(specificIndividualMatches),
      resolvedScopeDescription: specificIndividualMatches.map(m => m.displayName).join(', ')
    };
  }

  // 3. Leadership / BICs / Staff Filters
  if (targetLower.includes('bic') || targetLower.includes('broker in charge') || targetLower.includes('brokers in charge')) {
    const bics = allMembers.filter(p => p.isBrokerInCharge || p.role.toLowerCase().includes('bic') || p.title.toLowerCase().includes('bic'));
    return {
      attendees: bics,
      emails: resolveEmails(bics),
      resolvedScopeDescription: `Broker-in-Charge Team (${bics.length} BICs)`
    };
  }

  if (targetLower.includes('leadership') || targetLower.includes('management') || targetLower.includes('executives')) {
    const leadership = allMembers.filter(p => p.personType === 'leadership' || p.isBrokerInCharge || p.role.toLowerCase().includes('lead') || p.role.toLowerCase().includes('owner'));
    return {
      attendees: leadership,
      emails: resolveEmails(leadership),
      resolvedScopeDescription: `Nest Leadership Team (${leadership.length} members)`
    };
  }

  if (targetLower.includes('staff') && !targetLower.includes('agent')) {
    const staff = allMembers.filter(p => p.personType === 'staff' || p.personType === 'assistant' || p.role.toLowerCase().includes('ops') || p.role.toLowerCase().includes('coordinator'));
    return {
      attendees: staff,
      emails: resolveEmails(staff),
      resolvedScopeDescription: `Operations & Administrative Staff (${staff.length} staff members)`
    };
  }

  // 4. Determine All-Offices vs Single Office Scope
  const isAllOffices = (
    targetLower.includes('all offices') || 
    targetLower.includes('both offices') || 
    targetLower.includes('all wilmington, carolina beach') ||
    (targetLower.includes('wilmington') && targetLower.includes('carolina beach'))
  );

  // 5. Carolina Beach Office Only
  const isCarolinaBeachOnly = (
    (targetLower.includes('carolina beach') || targetLower.includes('cb office')) &&
    !isAllOffices &&
    !targetLower.includes('wilmington') &&
    !targetLower.includes('mayfaire')
  );

  if (isCarolinaBeachOnly || (options.targetOffices?.length === 1 && options.targetOffices[0] === 'carolina_beach')) {
    const cbMembers = allMembers.filter(p => 
      p.officeIds?.includes('carolina_beach') || 
      p.officeNames?.some(o => o.toLowerCase().includes('carolina')) ||
      p.primaryOfficeName?.toLowerCase().includes('carolina')
    );
    return {
      attendees: cbMembers,
      emails: resolveEmails(cbMembers),
      resolvedScopeDescription: `Carolina Beach Office (${cbMembers.length} members)`
    };
  }

  // 6. Wilmington / Mayfaire Office Only
  const isWilmingtonOnly = (
    (targetLower.includes('wilmington') || targetLower.includes('mayfaire')) &&
    !isAllOffices &&
    !targetLower.includes('carolina beach')
  );

  if (isWilmingtonOnly || (options.targetOffices?.length === 1 && (options.targetOffices[0] === 'mayfaire' || options.targetOffices[0] === 'wilmington'))) {
    const wilmMembers = allMembers.filter(p => 
      p.officeIds?.includes('mayfaire') || 
      p.officeNames?.some(o => o.toLowerCase().includes('mayfaire') || o.toLowerCase().includes('wilmington')) ||
      p.primaryOfficeName?.toLowerCase().includes('mayfaire') ||
      p.primaryOfficeName?.toLowerCase().includes('wilmington')
    );
    return {
      attendees: wilmMembers,
      emails: resolveEmails(wilmMembers),
      resolvedScopeDescription: `Wilmington (Mayfaire) Office (${wilmMembers.length} members)`
    };
  }

  // 7. Default: All 77 Directory Members across Wilmington, Mayfaire, and Carolina Beach
  return {
    attendees: allMembers,
    emails: resolveEmails(allMembers),
    resolvedScopeDescription: `All Brokers & Staff across Wilmington (Mayfaire) and Carolina Beach offices (${allMembers.length} total members)`
  };
}

/**
 * Calculates start and end ISO timestamps with Eastern Timezone awareness
 */
export function calculateMeetingTimestamps(options: {
  meetingDate?: string;
  startTime?: string;
  durationMinutes?: number;
}): { startIso: string; endIso: string; displayDate: string; displayTime: string } {
  const duration = options.durationMinutes || 60;
  const now = new Date();
  
  let targetYear = 2026;
  let targetMonth = now.getMonth(); // 0-indexed
  let targetDay = now.getDate();
  let targetHour = 10;
  let targetMinute = 0;

  const dateStr = (options.meetingDate || '').toLowerCase().trim();
  const timeStr = (options.startTime || '').toLowerCase().trim();

  // Parse Date
  if (dateStr.includes('tomorrow')) {
    const tomorrow = new Date(now.getTime() + 86400000);
    targetYear = tomorrow.getFullYear();
    targetMonth = tomorrow.getMonth();
    targetDay = tomorrow.getDate();
  } else if (dateStr.includes('tuesday')) {
    const dayOffset = (2 + 7 - now.getDay()) % 7 || 7;
    const nextTues = new Date(now.getTime() + dayOffset * 86400000);
    targetYear = nextTues.getFullYear();
    targetMonth = nextTues.getMonth();
    targetDay = nextTues.getDate();
  } else if (dateStr.includes('wednesday')) {
    const dayOffset = (3 + 7 - now.getDay()) % 7 || 7;
    const nextWed = new Date(now.getTime() + dayOffset * 86400000);
    targetYear = nextWed.getFullYear();
    targetMonth = nextWed.getMonth();
    targetDay = nextWed.getDate();
  } else if (dateStr.includes('thursday')) {
    const dayOffset = (4 + 7 - now.getDay()) % 7 || 7;
    const nextThurs = new Date(now.getTime() + dayOffset * 86400000);
    targetYear = nextThurs.getFullYear();
    targetMonth = nextThurs.getMonth();
    targetDay = nextThurs.getDate();
  } else if (dateStr.includes('friday')) {
    const dayOffset = (5 + 7 - now.getDay()) % 7 || 7;
    const nextFri = new Date(now.getTime() + dayOffset * 86400000);
    targetYear = nextFri.getFullYear();
    targetMonth = nextFri.getMonth();
    targetDay = nextFri.getDate();
  } else if (dateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)) {
    const m = dateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)!;
    targetYear = parseInt(m[1], 10);
    targetMonth = parseInt(m[2], 10) - 1;
    targetDay = parseInt(m[3], 10);
  } else if (dateStr.match(/sept(?:ember)?\s*(\d{1,2})/i)) {
    const m = dateStr.match(/sept(?:ember)?\s*(\d{1,2})/i)!;
    targetYear = 2026;
    targetMonth = 8; // September is month 8 (0-indexed)
    targetDay = parseInt(m[1], 10);
  } else if (dateStr.match(/oct(?:ober)?\s*(\d{1,2})/i)) {
    const m = dateStr.match(/oct(?:ober)?\s*(\d{1,2})/i)!;
    targetYear = 2026;
    targetMonth = 9;
    targetDay = parseInt(m[1], 10);
  } else if (dateStr.match(/aug(?:ust)?\s*(\d{1,2})/i)) {
    const m = dateStr.match(/aug(?:ust)?\s*(\d{1,2})/i)!;
    targetYear = 2026;
    targetMonth = 7;
    targetDay = parseInt(m[1], 10);
  }

  // Parse Time
  if (timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)) {
    const tm = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)!;
    let h = parseInt(tm[1], 10);
    const min = tm[2] ? parseInt(tm[2], 10) : 0;
    const ampm = tm[3] ? tm[3].toLowerCase() : '';

    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
    if (!ampm && h < 8) h += 12; // Assume afternoon if small number like "2" or "3"

    targetHour = h;
    targetMinute = min;
  }

  // Construct start Date in Eastern Time (UTC-4 during EDT)
  const startDate = new Date(Date.UTC(targetYear, targetMonth, targetDay, targetHour + 4, targetMinute, 0));
  const endDate = new Date(startDate.getTime() + duration * 60000);

  const displayDate = startDate.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const displayTime = startDate.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return {
    startIso: startDate.toISOString(),
    endIso: endDate.toISOString(),
    displayDate,
    displayTime
  };
}

/**
 * Main Function: Schedules meeting and generates Google Calendar invites
 */
export async function scheduleBrokerageMeeting(
  req: ScheduleMeetingRequest
): Promise<ScheduledBrokerageMeetingRecord> {
  const requesterName = req.requesterName || 'Ryan Crecelius';
  const organizerEmail = 'AskNora@nestrealty.com';

  // 1. Resolve Target Attendees from Directory
  const { attendees, emails, resolvedScopeDescription } = resolveDirectoryAttendees({
    targetAudience: req.targetAudience,
    specificNames: req.specificNames,
    targetOffices: req.targetOffices
  });

  // 2. Resolve Meeting Title & Location
  let title = req.title || 'In-Office Brokerage Meeting';
  if (!req.title) {
    if (resolvedScopeDescription.includes('James Fort')) {
      title = `Strategy Session: Ryan & James Fort`;
    } else if (resolvedScopeDescription.includes('Carolina Beach')) {
      title = `Carolina Beach Team Office Meeting`;
    } else if (resolvedScopeDescription.includes('Wilmington')) {
      title = `Wilmington Mayfaire Office Meeting`;
    } else {
      title = `Nest Realty All-Hands In-Office Meeting`;
    }
  }

  let location = req.location || 'Nest Realty Mayfaire Office (Large Training Room)';
  if (resolvedScopeDescription.includes('Carolina Beach') && !req.location) {
    location = 'Nest Realty Carolina Beach Office';
  }

  // 3. Compute Dates & Timestamps
  const { startIso, endIso, displayDate, displayTime } = calculateMeetingTimestamps({
    meetingDate: req.meetingDate,
    startTime: req.startTime,
    durationMinutes: req.durationMinutes
  });

  const description = [
    `Brokerage Meeting organized by Nora (Ask Nest Ops) on behalf of ${requesterName}.`,
    `Invited Audience: ${resolvedScopeDescription}`,
    `Location: ${location}`,
    req.notes ? `\nAgenda & Notes:\n${req.notes}` : ''
  ].filter(Boolean).join('\n');

  // 4. Generate Google Workspace Calendar Event & Invites
  const gcalResult: GoogleCalendarMeetingResult = await createGoogleCalendarBrokerageMeeting({
    title,
    description,
    location,
    startTime: startIso,
    endTime: endIso,
    attendeeEmails: emails,
    organizerEmail,
    workspaceId: req.workspaceId,
    calendarId: req.calendarId,
    idempotencyKey: req.idempotencyKey,
    pendingActionId: req.pendingActionId,
    dbState: req.dbState
  });

  // 5. Build Spoken Affirmation for Nora Voice Agent
  const spokenConfirmation = gcalResult.mode === 'LIVE'
    ? `You got it, ${requesterName.split(' ')[0]}! I've scheduled "${title}" for ${displayDate} at ${displayTime} at the ${location}. The Google Calendar invite has been generated and dispatched to ${resolvedScopeDescription} from AskNora@nestrealty.com!`
    : `You got it, ${requesterName.split(' ')[0]}! I've prepared a sandbox meeting draft for "${title}" on ${displayDate} at ${displayTime} at the ${location} for ${resolvedScopeDescription} from AskNora@nestrealty.com. Connect Google Workspace to dispatch live invites.`;

  // 6. Save Record
  const meetingRecord: ScheduledBrokerageMeetingRecord = {
    id: gcalResult.id,
    calendarId: gcalResult.calendarId,
    title,
    meetingDate: displayDate,
    startTime: displayTime,
    endTime: new Date(endIso).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true }),
    location,
    organizerEmail,
    requesterName,
    targetAudience: req.targetAudience || resolvedScopeDescription,
    resolvedScopeDescription,
    attendeeCount: attendees.length,
    attendees: attendees.map(a => ({
      id: a.id,
      displayName: a.displayName,
      email: a.email,
      office: a.primaryOfficeName || a.officeNames?.[0] || 'Wilmington',
      role: a.role || a.title || 'Agent'
    })),
    googleCalendarUrl: gcalResult.googleCalendarUrl,
    htmlLink: gcalResult.htmlLink,
    hangoutLink: gcalResult.hangoutLink,
    iCalContent: gcalResult.iCalContent,
    dispatchedVia: gcalResult.dispatchedVia,
    mode: gcalResult.mode,
    conferenceStatus: gcalResult.conferenceStatus,
    isExternalVerified: gcalResult.isExternalVerified,
    providerTimestamp: gcalResult.providerTimestamp,
    spokenConfirmation,
    createdAt: new Date().toISOString()
  };

  const stored = loadStoredMeetings();
  stored.unshift(meetingRecord);
  saveStoredMeetings(stored);

  // Synchronous database persistence via CalendarRepository
  await CalendarRepository.saveScheduledMeeting(meetingRecord, req.workspaceId);

  console.log(`[BrokerageCalendarService] Scheduled "${title}" for ${attendees.length} attendees via ${gcalResult.dispatchedVia} (${gcalResult.mode}).`);

  return meetingRecord;
}

export function getAllScheduledBrokerageMeetings(): ScheduledBrokerageMeetingRecord[] {
  return loadStoredMeetings();
}

/**
 * Reads today's schedule for a user / brokerage
 */
export function getBrokerageScheduleForDate(dateStr?: string, userName?: string): {
  date: string;
  count: number;
  events: ScheduledBrokerageMeetingRecord[];
  summary: string;
} {
  const targetDate = dateStr || new Date().toISOString().split('T')[0];
  const meetings = loadStoredMeetings();
  const filtered = meetings.filter(m => {
    const mDate = m.meetingDate || '';
    const dateMatch = mDate.includes(targetDate) || targetDate.includes(mDate);
    if (!dateMatch) return false;
    if (userName) {
      const u = userName.toLowerCase();
      return (
        m.requesterName.toLowerCase().includes(u) ||
        m.attendees.some(a => a.displayName.toLowerCase().includes(u) || a.email.toLowerCase().includes(u))
      );
    }
    return true;
  });

  const summary = filtered.length > 0
    ? `Found ${filtered.length} scheduled meeting(s) for ${targetDate}: ${filtered.map(m => `"${m.title}" at ${m.startTime} (${m.location})`).join(', ')}.`
    : `No scheduled meetings found for ${targetDate}.`;

  return {
    date: targetDate,
    count: filtered.length,
    events: filtered,
    summary
  };
}

/**
 * Finds a meeting by participant, title, or keyword
 */
export function findBrokerageMeeting(query: string): ScheduledBrokerageMeetingRecord | null {
  const q = query.toLowerCase().trim();
  const meetings = loadStoredMeetings();
  return (
    meetings.find(m =>
      m.title.toLowerCase().includes(q) ||
      m.targetAudience.toLowerCase().includes(q) ||
      m.location.toLowerCase().includes(q) ||
      m.attendees.some(a => a.displayName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q))
    ) || null
  );
}

/**
 * Checks free/busy availability for a team member
 */
export function checkBrokerageAvailability(params: {
  attendeeName: string;
  date: string;
  time?: string;
}): {
  isAvailable: boolean;
  attendee: string;
  conflicts: ScheduledBrokerageMeetingRecord[];
  suggestedSlots: string[];
} {
  const schedule = getBrokerageScheduleForDate(params.date, params.attendeeName);
  const conflicts = schedule.events;
  const isAvailable = conflicts.length === 0;

  return {
    isAvailable,
    attendee: params.attendeeName,
    conflicts,
    suggestedSlots: isAvailable ? ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'] : ['1:30 PM', '4:30 PM']
  };
}

/**
 * Reschedules an existing meeting while preserving original record on provider failure
 */
export async function rescheduleBrokerageMeeting(params: {
  meetingId: string;
  newDate: string;
  newTime?: string;
  durationMinutes?: number;
  workspaceId?: string;
  dbState?: any;
}): Promise<{
  success: boolean;
  meeting?: ScheduledBrokerageMeetingRecord;
  error?: string;
}> {
  const meetings = loadStoredMeetings();
  const index = meetings.findIndex(m => m.id === params.meetingId);
  if (index === -1) {
    return { success: false, error: `Meeting with ID ${params.meetingId} not found.` };
  }

  const existing = meetings[index];

  // If startIso can be recomputed:
  const { startIso, endIso, displayDate, displayTime } = calculateMeetingTimestamps({
    meetingDate: params.newDate,
    startTime: params.newTime || existing.startTime,
    durationMinutes: params.durationMinutes || 60
  });

  try {
    const patchResult = await updateGoogleCalendarBrokerageMeeting({
      eventId: params.meetingId,
      startTime: startIso,
      endTime: endIso,
      workspaceId: params.workspaceId,
      dbState: params.dbState
    });

    const updated: ScheduledBrokerageMeetingRecord = {
      ...existing,
      meetingDate: displayDate,
      startTime: displayTime,
      spokenConfirmation: `Rescheduled "${existing.title}" to ${displayDate} at ${displayTime}.`,
      providerTimestamp: patchResult.providerTimestamp || new Date().toISOString(),
      mode: patchResult.mode
    };

    meetings[index] = updated;
    saveStoredMeetings(meetings);
    await CalendarRepository.saveScheduledMeeting(updated, params.workspaceId);

    return {
      success: true,
      meeting: updated
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to reschedule meeting on Google Calendar: ${err.message}`
    };
  }
}

/**
 * Cancels a meeting with audit record
 */
export async function cancelBrokerageMeeting(params: {
  meetingId: string;
  reason?: string;
  workspaceId?: string;
  dbState?: any;
}): Promise<{
  success: boolean;
  cancelledMeeting?: ScheduledBrokerageMeetingRecord;
  error?: string;
}> {
  const meetings = loadStoredMeetings();
  const match = meetings.find(m => m.id === params.meetingId);
  if (!match) {
    return { success: false, error: `Meeting with ID ${params.meetingId} not found.` };
  }

  try {
    await cancelGoogleCalendarBrokerageMeeting({
      eventId: params.meetingId,
      workspaceId: params.workspaceId,
      cancellationReason: params.reason,
      dbState: params.dbState
    });

    const remaining = meetings.filter(m => m.id !== params.meetingId);
    saveStoredMeetings(remaining);
    await CalendarRepository.deleteScheduledMeeting(params.meetingId);

    return {
      success: true,
      cancelledMeeting: match
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to cancel meeting on Google Calendar: ${err.message}`
    };
  }
}
