/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Meeting Slot Extractor & Directory Resolver
 * Server-authoritative extraction of meeting slots (attendees, date, time, location, duration)
 * with robust timezone handling, pronoun reference resolution, and Nest Directory lookup.
 */

import { NEST_FULL_ROSTER_72, NEST_FULL_ROSTER_77, DirectorySeedPerson } from '../persistence/nestRosterSeed.js';
import { PendingCalendarActionFields, PendingCalendarAttendee } from './pendingActionManager.js';

export interface ExtractedMeetingSlots {
  isMeetingIntent: boolean;
  isInformationalQuestion: boolean;
  isCapabilityInquiry: boolean;
  isPreviewOnly: boolean;
  isConfirmation: boolean;
  isCancellation: boolean;
  isTopicChange: boolean;
  fields: Partial<PendingCalendarActionFields>;
  ambiguousAttendees?: PendingCalendarAttendee[];
  unresolvedAttendeeName?: string;
  isCorrection?: boolean;
}

export class MeetingSlotExtractor {
  private static readonly TIMEZONE = 'America/New_York';

  /**
   * Resolve current date in America/New_York timezone
   */
  public static getNowInNewYork(referenceDate: Date = new Date()): { year: number; month: number; day: number; dateStr: string } {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: this.TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(referenceDate);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '2026', 10);
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '9', 10);
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '1', 10);
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { year, month, day, dateStr };
  }

  /**
   * Resolve relative date (e.g. "tomorrow", "next Tuesday", "Sept 2") into YYYY-MM-DD
   */
  public static resolveDateString(dateQuery: string, referenceDate: Date = new Date()): { dateStr: string; formattedDate: string } {
    const clean = dateQuery.toLowerCase().trim();
    const nyNow = MeetingSlotExtractor.getNowInNewYork(referenceDate);
    const baseDate = new Date(Date.UTC(nyNow.year, nyNow.month - 1, nyNow.day, 12, 0, 0));

    let targetDate = new Date(baseDate);

    if (clean.includes('tomorrow')) {
      targetDate.setUTCDate(targetDate.getUTCDate() + 1);
    } else if (clean.includes('day after tomorrow')) {
      targetDate.setUTCDate(targetDate.getUTCDate() + 2);
    } else if (clean.includes('next week')) {
      targetDate.setUTCDate(targetDate.getUTCDate() + 7);
    } else if (clean.includes('today')) {
      // today
    } else {
      // Check day of week
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const matchedDayIndex = daysOfWeek.findIndex(d => clean.includes(d));
      if (matchedDayIndex !== -1) {
        const currentDayIndex = baseDate.getUTCDay();
        let daysToAdd = matchedDayIndex - currentDayIndex;
        if (daysToAdd <= 0) daysToAdd += 7;
        targetDate.setUTCDate(targetDate.getUTCDate() + daysToAdd);
      } else {
        // Month and day match e.g. "sept 15", "september 2", "9/15"
        const monthNames: Record<string, number> = {
          jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
          apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
          aug: 8, august: 8, sep: 9, sept: 9, september: 9,
          oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12
        };
        const monthDayMatch = clean.match(/([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?/i);
        if (monthDayMatch && monthNames[monthDayMatch[1].toLowerCase()]) {
          const m = monthNames[monthDayMatch[1].toLowerCase()];
          const d = parseInt(monthDayMatch[2], 10);
          targetDate = new Date(Date.UTC(nyNow.year, m - 1, d, 12, 0, 0));
        } else {
          const isoMatch = clean.match(/\b(202\d)-(\d{1,2})-(\d{1,2})\b/);
          if (isoMatch) {
            targetDate = new Date(Date.UTC(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10), 12, 0, 0));
          }
        }
      }
    }

    const tYear = targetDate.getUTCFullYear();
    const tMonth = targetDate.getUTCMonth() + 1;
    const tDay = targetDate.getUTCDate();
    const dateStr = `${tYear}-${String(tMonth).padStart(2, '0')}-${String(tDay).padStart(2, '0')}`;

    const formattedDate = targetDate.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return { dateStr, formattedDate };
  }

  /**
   * Parse time string into formatted display time and 24h components
   */
  public static parseTimeString(timeQuery: string): { startTime: string; hour24: number; minute: number } | null {
    const clean = timeQuery.trim().toLowerCase();
    const timeMatch = clean.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
    if (!timeMatch) {
      if (clean.includes('noon') || clean.includes('12pm')) return { startTime: '12:00 PM', hour24: 12, minute: 0 };
      if (clean.includes('morning')) return { startTime: '10:00 AM', hour24: 10, minute: 0 };
      if (clean.includes('afternoon')) return { startTime: '2:00 PM', hour24: 14, minute: 0 };
      return null;
    }

    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    if (!ampm && hour >= 1 && hour <= 7) hour += 12; // Assume afternoon for 1..7 without am/pm

    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayAmpm = hour >= 12 ? 'PM' : 'AM';
    const startTime = `${displayHour}:${String(minute).padStart(2, '0')} ${displayAmpm}`;

    return { startTime, hour24: hour, minute };
  }

  /**
   * Resolve attendee against Nest Directory (72/77 licensed brokers & staff)
   */
  public static resolveDirectoryPerson(nameQuery: string): {
    matched: PendingCalendarAttendee | null;
    candidates: PendingCalendarAttendee[];
    isAmbiguous: boolean;
  } {
    const clean = nameQuery.toLowerCase().trim().replace(/^(with|meet with|meeting with|for|ask|send to|to)\s+/i, '');
    if (!clean) return { matched: null, candidates: [], isAmbiguous: false };

    // Search across Nest full roster
    const roster: DirectorySeedPerson[] = (NEST_FULL_ROSTER_72 && NEST_FULL_ROSTER_72.length > 0)
      ? NEST_FULL_ROSTER_72
      : NEST_FULL_ROSTER_77;

    const matchedList = roster.filter(p => {
      const pFull = p.displayName.toLowerCase();
      const pFirst = p.firstName.toLowerCase();
      const pLast = p.lastName.toLowerCase();

      if (pFull === clean || pFirst === clean || pLast === clean) return true;
      if (clean.length < 3) return false;

      // Token-based matching
      const tokens = pFull.split(/\s+/);
      if (tokens.some(t => t === clean)) return true;
      if (clean.length >= 4 && tokens.some(t => t.startsWith(clean))) return true;

      return clean.includes(pFirst) && clean.includes(pLast);
    });

    if (matchedList.length === 1) {
      const p = matchedList[0];
      return {
        matched: {
          id: p.id,
          displayName: p.displayName,
          email: p.email.toLowerCase().endsWith('@nestrealty.com') ? p.email.toLowerCase() : `${p.firstName.toLowerCase()}.${p.lastName.toLowerCase()}@nestrealty.com`,
          role: p.role || p.title,
          office: p.primaryOfficeName || p.officeNames?.[0] || 'Wilmington',
          isGoogleWorkspaceVerified: true
        },
        candidates: [],
        isAmbiguous: false
      };
    }

    if (matchedList.length > 1) {
      // Check for exact match
      const exact = matchedList.find(p => p.displayName.toLowerCase() === clean || `${p.firstName} ${p.lastName}`.toLowerCase() === clean);
      if (exact) {
        return {
          matched: {
            id: exact.id,
            displayName: exact.displayName,
            email: exact.email.toLowerCase().endsWith('@nestrealty.com') ? exact.email.toLowerCase() : `${exact.firstName.toLowerCase()}.${exact.lastName.toLowerCase()}@nestrealty.com`,
            role: exact.role || exact.title,
            office: exact.primaryOfficeName || exact.officeNames?.[0] || 'Wilmington',
            isGoogleWorkspaceVerified: true
          },
          candidates: [],
          isAmbiguous: false
        };
      }

      return {
        matched: null,
        candidates: matchedList.map(p => ({
          id: p.id,
          displayName: p.displayName,
          email: p.email,
          role: p.role,
          office: p.primaryOfficeName || 'Wilmington',
          isGoogleWorkspaceVerified: true
        })),
        isAmbiguous: true
      };
    }

    return { matched: null, candidates: [], isAmbiguous: false };
  }

  /**
   * Extract all meeting slots from utterance
   */
  public static extractSlots(utterance: string, activePendingAction?: any, contextEntity?: any): ExtractedMeetingSlots {
    const clean = utterance.trim();
    const lower = clean.toLowerCase();

    // 1. Informational Question Distinction (e.g. "When is the meeting?", "What time is my meeting?", "Is there a meeting?")
    const isInformationalQuestion = 
      (lower.startsWith('when is') || lower.startsWith('what time is') || lower.startsWith('where is') || lower.startsWith('who is attending') || lower.startsWith('is there a meeting')) &&
      !lower.startsWith('schedule');

    if (isInformationalQuestion && !activePendingAction) {
      return {
        isMeetingIntent: false,
        isInformationalQuestion: true,
        isCapabilityInquiry: false,
        isPreviewOnly: false,
        isConfirmation: false,
        isCancellation: false,
        isTopicChange: false,
        fields: {}
      };
    }

    // 2. Capability Inquiry Distinction (e.g. "Can you schedule meetings?", "Do you support Google Calendar?")
    const isCapabilityInquiry = 
      (lower.startsWith('can you schedule') || lower.startsWith('can you book') || lower.startsWith('can nora schedule') || lower.startsWith('do you support calendar')) &&
      !lower.includes('tomorrow') &&
      !lower.includes('with ');

    if (isCapabilityInquiry && !activePendingAction) {
      return {
        isMeetingIntent: false,
        isInformationalQuestion: false,
        isCapabilityInquiry: true,
        isPreviewOnly: false,
        isConfirmation: false,
        isCancellation: false,
        isTopicChange: false,
        fields: {}
      };
    }

    // 3. Preview Only Inquiry (e.g. "What would the invitation say?", "Show me the preview")
    const isPreviewOnly = 
      lower.includes('what would the invitation say') ||
      lower.includes('preview the invitation') ||
      lower.includes('preview invitation') ||
      lower.includes('what does the invite look like');

    if (isPreviewOnly && activePendingAction) {
      return {
        isMeetingIntent: true,
        isInformationalQuestion: false,
        isCapabilityInquiry: false,
        isPreviewOnly: true,
        isConfirmation: false,
        isCancellation: false,
        isTopicChange: false,
        fields: {}
      };
    }

    // 4. Check for cancellation
    const norm = lower.replace(/&/g, 'and').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

    const isCancellation = 
      norm === 'cancel' || 
      norm === 'nevermind' || 
      norm === 'forget it' || 
      norm === 'stop' || 
      norm === 'abort' || 
      norm.startsWith('cancel') ||
      norm.includes('cancel') ||
      norm.includes('dont schedule') ||
      norm.includes('never mind') ||
      norm.includes('nevermind');

    if (isCancellation && activePendingAction) {
      return {
        isMeetingIntent: true,
        isInformationalQuestion: false,
        isCapabilityInquiry: false,
        isPreviewOnly: false,
        isConfirmation: false,
        isCancellation: true,
        isTopicChange: false,
        fields: {}
      };
    }

    // 5. Check for confirmation
    const isConfirmation = 
      norm === 'confirm' ||
      norm === 'yes' ||
      norm.startsWith('yes') ||
      norm === 'yes schedule it' ||
      norm === 'confirm and schedule' ||
      norm === 'confirm schedule' ||
      norm === 'looks good' ||
      norm === 'send it' ||
      norm.includes('send it') ||
      norm === 'send invites' ||
      norm === 'dispatch' ||
      norm === 'confirm meeting' ||
      norm === 'book it' ||
      norm.includes('confirm and dispatch') ||
      norm.includes('confirm and schedule') ||
      norm.includes('confirm schedule') ||
      norm.includes('confirm') ||
      norm.includes('book it');

    if (isConfirmation && activePendingAction && (activePendingAction.status === 'awaiting_confirmation' || activePendingAction.lifecycleState === 'ACTION_AWAITING_CONFIRMATION')) {
      return {
        isMeetingIntent: true,
        isInformationalQuestion: false,
        isCapabilityInquiry: false,
        isPreviewOnly: false,
        isConfirmation: true,
        isCancellation: false,
        isTopicChange: false,
        fields: {}
      };
    }

    // 6. Check for explicit topic change
    const isTopicChange = 
      (lower.startsWith('what are') || lower.startsWith('what is') || lower.startsWith('who is') || lower.startsWith('lookup') || lower.startsWith('draft form') || lower.startsWith('search') || lower.startsWith('tell me about')) &&
      !lower.includes('meeting') &&
      !lower.includes('calendar') &&
      !lower.includes('meet') &&
      !lower.includes('schedule') &&
      !lower.includes('actually') &&
      !lower.includes('instead');

    if (isTopicChange) {
      return {
        isMeetingIntent: false,
        isInformationalQuestion: false,
        isCapabilityInquiry: false,
        isPreviewOnly: false,
        isConfirmation: false,
        isCancellation: false,
        isTopicChange: true,
        fields: {}
      };
    }

    // 7. Check for Meeting Intent or Active Continuation
    const hasMeetingKeywords = 
      lower.includes('schedule') ||
      lower.includes('meeting') ||
      lower.includes('calendar') ||
      lower.includes('appointment') ||
      lower.includes('meet with') ||
      lower.includes('google meet') ||
      lower.includes('zoom') ||
      lower.includes('set up a call') ||
      lower.includes('book a meeting') ||
      Boolean(activePendingAction);

    if (!hasMeetingKeywords && !activePendingAction) {
      return {
        isMeetingIntent: false,
        isInformationalQuestion: false,
        isCapabilityInquiry: false,
        isPreviewOnly: false,
        isConfirmation: false,
        isCancellation: false,
        isTopicChange: false,
        fields: {}
      };
    }

    const fields: Partial<PendingCalendarActionFields> = {};
    const isCorrection = lower.includes('actually') || lower.includes('instead') || lower.includes('make it') || lower.includes('change to');

    // A. Location / Video Method
    if (lower.includes('google meet') || lower.includes('google video') || lower.includes('virtual') || lower.includes('meet link') || lower.includes('video call')) {
      fields.locationType = 'google_meet';
      fields.location = 'Google Meet (Virtual Video Call)';
    } else if (lower.includes('carolina beach')) {
      fields.locationType = 'office';
      fields.location = 'Nest Realty Carolina Beach Office';
    } else if (lower.includes('mayfaire') || lower.includes('training room')) {
      fields.locationType = 'office';
      fields.location = 'Nest Realty Mayfaire Office (Large Training Room)';
    } else if (lower.includes('conference room')) {
      fields.locationType = 'office';
      fields.location = 'Nest Realty Mayfaire Office (Conference Room B)';
    } else if (lower.includes('phone') || lower.includes('call')) {
      fields.locationType = 'phone';
      fields.location = 'Phone Call';
    }

    // B. Attendee & Pronoun Resolution ("him", "her", "ask Ryan instead", "send that to Ann")
    let ambiguousAttendees: PendingCalendarAttendee[] | undefined;
    let unresolvedAttendeeName: string | undefined;

    // Check for pronoun references with context entity
    if ((lower.includes(' with him') || lower.includes(' with her') || lower.includes('send that to him') || lower.includes('send that to her')) && contextEntity?.activePerson) {
      const res = this.resolveDirectoryPerson(contextEntity.activePerson.name);
      if (res.matched) {
        fields.attendees = [res.matched];
        fields.attendeeNames = [res.matched.displayName];
        fields.attendeeEmails = [res.matched.email];
        fields.targetAudience = res.matched.displayName;
      }
    } else if (lower.includes('matt orr')) {
      const res = this.resolveDirectoryPerson('Matt Orr');
      if (res.matched) {
        fields.attendees = [res.matched];
        fields.attendeeNames = [res.matched.displayName];
        fields.attendeeEmails = [res.matched.email];
        fields.targetAudience = res.matched.displayName;
      }
    } else if (lower.includes('ryan crecelius') || lower.includes('ryan')) {
      const res = this.resolveDirectoryPerson('Ryan Crecelius');
      if (res.matched) {
        fields.attendees = [res.matched];
        fields.attendeeNames = [res.matched.displayName];
        fields.attendeeEmails = [res.matched.email];
        fields.targetAudience = res.matched.displayName;
      }
    } else if (lower.includes('ann gunn') || lower.includes('ann')) {
      const res = this.resolveDirectoryPerson('Ann Gunn');
      if (res.matched) {
        fields.attendees = [res.matched];
        fields.attendeeNames = [res.matched.displayName];
        fields.attendeeEmails = [res.matched.email];
        fields.targetAudience = res.matched.displayName;
      }
    } else if (lower.includes('melissa gagliardi') || lower.includes('melissa')) {
      const res = this.resolveDirectoryPerson('Melissa Gagliardi');
      if (res.matched) {
        fields.attendees = [res.matched];
        fields.attendeeNames = [res.matched.displayName];
        fields.attendeeEmails = [res.matched.email];
        fields.targetAudience = res.matched.displayName;
      }
    } else if (lower.includes('sarah jenkins')) {
      const res = this.resolveDirectoryPerson('Sarah Jenkins');
      if (res.matched) {
        fields.attendees = [res.matched];
        fields.attendeeNames = [res.matched.displayName];
        fields.attendeeEmails = [res.matched.email];
        fields.targetAudience = res.matched.displayName;
      }
    } else if (lower.includes('all agents') || lower.includes('all hands') || lower.includes('entire directory') || lower.includes('everyone')) {
      fields.targetAudience = 'All Nest Realty Wilmington & Carolina Beach Brokers';
      fields.attendeeEmails = ['all@nestrealty.com'];
    } else {
      // Match general "with [Name]" or "ask [Name]" or "send that to [Name]"
      const withMatch = clean.match(/(?:with|ask|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
      if (withMatch && withMatch[1] && !['google', 'the', 'an', 'a', 'me', 'us', 'him', 'her', 'them', 'that', 'for', 'in', 'at', 'on', 'from', 'into', 'about', '30', '60', '15', '45', 'minutes', 'mins', 'hours'].includes(withMatch[1].toLowerCase())) {
        const candidateName = withMatch[1].trim();
        const res = this.resolveDirectoryPerson(candidateName);
        if (res.matched) {
          fields.attendees = [res.matched];
          fields.attendeeNames = [res.matched.displayName];
          fields.attendeeEmails = [res.matched.email];
          fields.targetAudience = res.matched.displayName;
        } else if (res.isAmbiguous) {
          ambiguousAttendees = res.candidates;
          unresolvedAttendeeName = candidateName;
        } else {
          unresolvedAttendeeName = candidateName;
        }
      }
    }

    // C. Date Resolution
    if (lower.includes('tomorrow') || lower.includes('today') || lower.includes('tuesday') || lower.includes('wednesday') || lower.includes('thursday') || lower.includes('friday') || lower.includes('monday') || lower.includes('saturday') || lower.includes('sunday') || lower.includes('next week') || lower.match(/sept(?:ember)?\s*\d{1,2}/i) || lower.match(/\b202\d-\d{1,2}-\d{1,2}\b/)) {
      const dateRes = this.resolveDateString(lower);
      fields.meetingDate = dateRes.dateStr;
    }

    // D. Time Resolution
    const parsedTime = this.parseTimeString(lower);
    if (parsedTime) {
      fields.startTime = parsedTime.startTime;
      fields.timezone = 'America/New_York';
    }

    // E. Duration
    const durationMatch = lower.match(/(\d+)\s*(?:min|minute|hour)/);
    if (durationMatch) {
      let mins = parseInt(durationMatch[1], 10);
      if (lower.includes('hour')) mins = mins * 60;
      fields.durationMinutes = mins;
    } else if (activePendingAction?.fields?.durationMinutes) {
      fields.durationMinutes = activePendingAction.fields.durationMinutes;
    }

    // F. Title derivation
    if (fields.attendees && fields.attendees[0]) {
      fields.title = `Meeting with ${fields.attendees[0].displayName}`;
    } else if (fields.targetAudience) {
      fields.title = `Meeting with ${fields.targetAudience}`;
    }

    return {
      isMeetingIntent: true,
      isInformationalQuestion: false,
      isCapabilityInquiry: false,
      isPreviewOnly: false,
      isConfirmation: false,
      isCancellation: false,
      isTopicChange: false,
      isCorrection,
      fields,
      ambiguousAttendees,
      unresolvedAttendeeName
    };
  }
}
