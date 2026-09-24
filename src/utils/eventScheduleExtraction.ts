/**
 * Event Schedule Extraction & Resolution Utilities
 * Extracts Event Type, Event Date (MM/DD), and Event Time from verbal transcripts and text briefs.
 */

export const MONTH_MAP: Record<string, string> = {
  january: '01', feb: '02', february: '02', mar: '03', march: '03',
  apr: '04', april: '04', may: '05', jun: '06', june: '06',
  jul: '07', july: '07', aug: '08', august: '08', sep: '09',
  sept: '09', september: '09', oct: '10', october: '10',
  nov: '11', november: '11', dec: '12', december: '12', jan: '01'
};

export const ORDINAL_WORD_MAP: Record<string, number> = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
  eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15, sixteenth: 16, seventeenth: 17,
  eighteenth: 18, nineteenth: 19, twentieth: 20, 'twenty-first': 21, 'twenty first': 21, 'twenty-second': 22,
  'twenty second': 22, 'twenty-third': 23, 'twenty third': 23, 'twenty-fourth': 24, 'twenty fourth': 24,
  'twenty-fifth': 25, 'twenty fifth': 25, 'twenty-sixth': 26, 'twenty sixth': 26, 'twenty-seventh': 27,
  'twenty seventh': 27, 'twenty-eighth': 28, 'twenty eighth': 28, 'twenty-ninth': 29, 'twenty ninth': 29,
  thirtieth: 30, 'thirty-first': 31, 'thirty first': 31
};

export const SPOKEN_NUM_MAP: Record<string, string> = {
  one: '1', two: '2', three: '3', four: '4', five: '5', six: '6',
  seven: '7', eight: '8', nine: '9', ten: '10', eleven: '11', twelve: '12'
};

export interface ExtractedEventSchedule {
  eventType?: string;
  eventDate?: string;
  eventTime?: string;
  rawEventDate?: string;
}

/**
 * Normalizes any date string or ISO timestamp to strict MM/DD format.
 */
export function normalizeDateToMMDD(dateStr?: string | null): string | undefined {
  if (!dateStr) return undefined;
  const trimmed = dateStr.trim();

  // Already MM/DD
  if (/^0?[1-9]\/[0-3]?[0-9]$/.test(trimmed)) {
    const [m, d] = trimmed.split('/');
    return `${m.padStart(2, '0')}/${d.padStart(2, '0')}`;
  }

  // YYYY-MM-DD or ISO string
  const isoMatch = trimmed.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[2]}/${isoMatch[3]}`;
  }

  // Month day (e.g. "September 13", "Sep 13th")
  const wordsMatch = trimmed.match(/([A-Za-z]+)\s+([0-9]{1,2})/);
  if (wordsMatch) {
    const m = MONTH_MAP[wordsMatch[1].toLowerCase()];
    if (m) {
      return `${m}/${wordsMatch[2].padStart(2, '0')}`;
    }
  }

  return trimmed;
}

/**
 * Normalizes time string to standard format (e.g., "1pm - 4pm").
 */
export function normalizeTimeRange(timeStr?: string | null): string | undefined {
  if (!timeStr) return undefined;
  const trimmed = timeStr.trim().toLowerCase();

  const timeMatch = trimmed.match(/(?:from\s+)?(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|[0-9]{1,2}(?::[0-9]{2})?)\s*(am|pm)?\s*(?:to|-)\s*(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|[0-9]{1,2}(?::[0-9]{2})?)\s*(am|pm)/i);
  if (timeMatch) {
    let startVal = timeMatch[1].toLowerCase();
    let endVal = timeMatch[3].toLowerCase();
    const meridiem = timeMatch[4].toLowerCase();

    if (SPOKEN_NUM_MAP[startVal]) startVal = SPOKEN_NUM_MAP[startVal];
    if (SPOKEN_NUM_MAP[endVal]) endVal = SPOKEN_NUM_MAP[endVal];

    const startNum = parseInt(startVal.split(':')[0], 10);
    const endNum = parseInt(endVal.split(':')[0], 10);
    let startMeridiem = timeMatch[2] ? timeMatch[2].toLowerCase() : meridiem;
    if (!timeMatch[2] && meridiem === 'pm' && startNum >= 9 && startNum <= 11 && endNum <= 6) {
      startMeridiem = 'am';
    }

    return `${startVal}${startMeridiem} - ${endVal}${meridiem}`;
  }

  return timeStr;
}

/**
 * Extracts event type, date (MM/DD), and time from raw speech or text.
 */
export function extractEventScheduleDetails(rawText: string): ExtractedEventSchedule {
  // Strip markdown links and URLs to prevent false positive date/time matches from URL slashes
  const cleanedText = rawText
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/[^\s)]+/g, ' ');
  const lower = cleanedText.toLowerCase();

  // 1. Event Type Detection
  let eventType: string | undefined;
  if (lower.includes('twilight open house') || lower.includes('twilight tour')) {
    eventType = 'Twilight Open House';
  } else if (lower.includes('broker tour') || lower.includes('broker caravan') || lower.includes('caravan')) {
    eventType = 'Broker Caravan / Tour';
  } else if (lower.includes('open house') || lower.includes('openhouse')) {
    eventType = 'Open House';
  }

  // 2. Event Date Detection
  let eventDate: string | undefined;
  let rawEventDate: string | undefined;

  const monthRegex = '\\b(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\\b';
  const dayWordRegex = '\\b(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|twenty-first|twenty first|twenty-second|twenty second|twenty-third|twenty third|twenty-fourth|twenty fourth|twenty-fifth|twenty fifth|twenty-sixth|twenty sixth|twenty-seventh|twenty seventh|twenty-eighth|twenty eighth|twenty-ninth|twenty ninth|thirtieth|thirty-first|thirty first)\\b';

  // Prioritize date associated with event (e.g. "for an open house September thirteenth")
  const eventDatePattern = new RegExp(`(?:open\\s+house|event|tour|caravan|showing)[^.,;\\n]*?(${monthRegex})\\s+(${dayWordRegex}|[0-9]{1,2}(?:st|nd|rd|th)?)`, 'i');
  let dateMatch = lower.match(eventDatePattern);

  // Fallback to standalone date if no event-linked date found and text contains open house / event context
  if (!dateMatch && (eventType || lower.includes('open house') || lower.includes('event'))) {
    const genericDatePattern = new RegExp(`(?:on|is|dated|for)\\s+(${monthRegex})\\s+(${dayWordRegex}|[0-9]{1,2}(?:st|nd|rd|th)?)`, 'i');
    dateMatch = lower.match(genericDatePattern);
  }

  // Fallback to slash date: 09/25/2026 or 9/25/26 or 9/25 associated with open house or general text
  const slashEventPattern = /(?:open\s*house|event|tour|caravan|showing)[^.,;\n]*?\b([0-1]?[0-9])\/([0-3]?[0-9])(?:\/(?:20\d{2}|\d{2}))?\b/i;
  const genericSlashPattern = /\b([0-1]?[0-9])\/([0-3]?[0-9])(?:\/(?:20\d{2}|\d{2}))?\b/i;
  let slashMatch = lower.match(slashEventPattern);
  if (!slashMatch && (eventType || lower.includes('open house') || lower.includes('event'))) {
    slashMatch = lower.match(genericSlashPattern);
  }

  if (dateMatch) {
    const monthKey = dateMatch[1].toLowerCase();
    const dayRaw = dateMatch[2].toLowerCase();
    const monthNum = MONTH_MAP[monthKey];

    let dayNum: number | undefined;
    if (ORDINAL_WORD_MAP[dayRaw]) {
      dayNum = ORDINAL_WORD_MAP[dayRaw];
    } else {
      const parsedDigit = parseInt(dayRaw.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsedDigit) && parsedDigit >= 1 && parsedDigit <= 31) {
        dayNum = parsedDigit;
      }
    }

    if (monthNum && dayNum) {
      const dayFormatted = String(dayNum).padStart(2, '0');
      eventDate = `${monthNum}/${dayFormatted}`;
      rawEventDate = `${dateMatch[1]} ${dayRaw}`;
    }
  } else if (slashMatch && (eventType || lower.includes('open house') || lower.includes('event'))) {
    const m = parseInt(slashMatch[1], 10);
    const d = parseInt(slashMatch[2], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      eventDate = `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
      rawEventDate = slashMatch[0];
    }
  }

  // 3. Event Time Detection
  let eventTime: string | undefined;
  const spokenTimePattern = /(?:from\s+)?(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|[0-9]{1,2}(?::[0-9]{2})?)\s*(am|pm)?\s*(?:to|-)\s*(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|[0-9]{1,2}(?::[0-9]{2})?)\s*(am|pm)/i;
  const timeMatch = lower.match(spokenTimePattern);

  if (timeMatch) {
    let startVal = timeMatch[1].toLowerCase();
    let endVal = timeMatch[3].toLowerCase();
    const meridiem = timeMatch[4].toLowerCase();

    if (SPOKEN_NUM_MAP[startVal]) startVal = SPOKEN_NUM_MAP[startVal];
    if (SPOKEN_NUM_MAP[endVal]) endVal = SPOKEN_NUM_MAP[endVal];

    const startNum = parseInt(startVal.split(':')[0], 10);
    const endNum = parseInt(endVal.split(':')[0], 10);
    let startMeridiem = timeMatch[2] ? timeMatch[2].toLowerCase() : meridiem;
    if (!timeMatch[2] && meridiem === 'pm' && startNum >= 9 && startNum <= 11 && endNum <= 6) {
      startMeridiem = 'am';
    }

    eventTime = `${startVal}${startMeridiem} - ${endVal}${meridiem}`;
  } else {
    const simpleTimePattern = /([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm))\s*(?:to|-)\s*([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm))/i;
    const simpleMatch = lower.match(simpleTimePattern);
    if (simpleMatch) {
      eventTime = `${simpleMatch[1].replace(/\s+/g, '').toLowerCase()} - ${simpleMatch[2].replace(/\s+/g, '').toLowerCase()}`;
    } else {
      // Single time point like "@ 2:00 PM" or "at 2pm"
      const singleTimePattern = /(?:@|at)\s*([0-9]{1,2}(?::[0-9]{2})?)\s*(am|pm)/i;
      const singleMatch = lower.match(singleTimePattern);
      if (singleMatch) {
        eventTime = `${singleMatch[1]}${singleMatch[2].toLowerCase()}`;
      }
    }
  }

  if ((eventDate || eventTime) && !eventType) {
    if (lower.includes('open house') || lower.includes('flyer') || lower.includes('showing')) {
      eventType = 'Open House';
    }
  }

  return {
    eventType,
    eventDate,
    eventTime,
    rawEventDate
  };
}

/**
 * Extracts needed by date from speech (e.g. "need them by September eleventh twenty twenty six").
 */
export function extractNeededByDate(rawText: string): string | undefined {
  if (!rawText) return undefined;
  const lower = rawText.toLowerCase();

  const monthRegex = '(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)';
  const dayWordRegex = '(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|twenty-first|twenty first|twenty-second|twenty second|twenty-third|twenty third|twenty-fourth|twenty fourth|twenty-fifth|twenty fifth|twenty-sixth|twenty sixth|twenty-seventh|twenty seventh|twenty-eighth|twenty eighth|twenty-ninth|twenty ninth|thirtieth|thirty-first|thirty first)';

  const neededPattern = new RegExp(`(?:needed\\s+by|need\\s+(?:them|it)?\\s+by|due(?:\\s+date)?(?:\\s+is)?(?:\\s+by)?|ship\\s+by)\\s*(?:on\\s+)?(${monthRegex})\\s+(${dayWordRegex}|[0-9]{1,2}(?:st|nd|rd|th)?)(?:,?\\s*([0-9]{4}|twenty\\s+twenty\\s+[a-z]+))?`, 'i');
  const match = lower.match(neededPattern);

  if (match) {
    const monthKey = match[1].toLowerCase();
    const dayRaw = match[2].toLowerCase();
    const monthNum = MONTH_MAP[monthKey];

    let dayNum: number | undefined;
    if (ORDINAL_WORD_MAP[dayRaw]) {
      dayNum = ORDINAL_WORD_MAP[dayRaw];
    } else {
      const parsedDigit = parseInt(dayRaw.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsedDigit) && parsedDigit >= 1 && parsedDigit <= 31) {
        dayNum = parsedDigit;
      }
    }

    if (monthNum && dayNum) {
      let year = '2026';
      if (match[3]) {
        if (match[3].includes('twenty twenty six') || match[3].includes('2026')) year = '2026';
        else if (match[3].includes('2025')) year = '2025';
        else if (match[3].includes('2027')) year = '2027';
      }
      return `${year}-${monthNum}-${String(dayNum).padStart(2, '0')}T00:00:00.000Z`;
    }
  }

  return undefined;
}

/**
 * Comprehensive resolver for UI components.
 * Given a task, request, and/or call, resolves event schedule fields with fallback extraction.
 */
export function resolveTaskEventDetails(task?: any, request?: any, call?: any): {
  hasEvent: boolean;
  eventType?: string;
  eventDate?: string;
  eventTime?: string;
} {
  let eventType = task?.eventType || request?.eventType;
  let eventDate = normalizeDateToMMDD(task?.eventDate || request?.eventDate);
  let eventTime = normalizeTimeRange(task?.eventTime || request?.eventTime);

  // Fallback extraction from transcripts or text if any field is missing
  if (!eventDate || !eventTime || !eventType) {
    const textPool = [
      task?.notes,
      task?.vendorNotes,
      task?.listingDetails?.description,
      request?.rawExcerpt,
      request?.requestExcerpt,
      request?.notes,
      call?.transcript,
      call?.summary,
      call?.call_analysis?.call_summary
    ].filter(Boolean).join(' ');

    if (textPool.trim().length > 0) {
      const extracted = extractEventScheduleDetails(textPool);
      if (!eventType && extracted.eventType) eventType = extracted.eventType;
      if (!eventDate && extracted.eventDate) eventDate = extracted.eventDate;
      if (!eventTime && extracted.eventTime) eventTime = extracted.eventTime;
    }
  }

  const hasEvent = Boolean(eventDate || (eventType && eventType.toLowerCase().includes('open house')));

  return {
    hasEvent,
    eventType: eventType || (hasEvent ? 'Open House' : undefined),
    eventDate: eventDate || undefined,
    eventTime: eventTime || undefined
  };
}
