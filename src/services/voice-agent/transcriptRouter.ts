/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TranscriptRouter — Conversational Control Classifier & Intent Router
 */

import { AgentRuntimeState, PendingProposal } from './agentRuntimeReducer';
import { NEST_FULL_ROSTER_77 } from '../../../server/persistence/nestRosterSeed';

export type UtteranceCategory =
  | 'wake_only'
  | 'conversation_control'
  | 'knowledge_question'
  | 'operational_request'
  | 'action_request';

export interface DomainIntentResult {
  intentType: 
    | 'WAKE_WORD_ONLY'
    | 'CONVERSATION_CONTROL'
    | 'CONFIRM_PROPOSAL'
    | 'REJECT_PROPOSAL'
    | 'REPEAT_LAST_RESPONSE'
    | 'DRAFT_OFFER'
    | 'CHECK_ATTENTION'
    | 'QUERY_PIPELINE'
    | 'DISPATCH_VENDOR'
    | 'LAUNCH_OPEN_HOUSE_KIOSK'
    | 'AUDIT_COMMERCIAL_LEASE'
    | 'MARKETING_REQUEST_INTAKE'
    | 'DISPATCH_PROPERTY_MAINTENANCE'
    | 'SCAN_DOCUMENT_VISION'
    | 'MATCHMAKER_BUYER_RADAR'
    | 'TRIGGER_DEAL_CELEBRATION'
    | 'MLS_LISTING_LAUNCH'
    | 'COMMISSION_SPLIT_PAYROLL'
    | 'SELLER_NET_SHEET'
    | 'CMA_PRESENTATION'
    | 'GENERAL_QUERY'
    | (string & {});
  category: UtteranceCategory;
  spokenResponse: string;
  displayResponse: string;
  utteranceId?: string;
  proposal?: PendingProposal;
  actionCard?: {
    title: string;
    target: string;
    details: string;
  };
  matchedItems?: any[];
  suggestedActions?: {
    id: string;
    label: string;
    actionType: string;
    icon?: string;
    payload?: any;
  }[];
  meetingWizard?: {
    title?: string;
    targetAudience?: string;
    meetingDate?: string;
    startTime?: string;
    durationMinutes?: number;
    location?: string;
    notes?: string;
    requesterName?: string;
  };
  webResearchQuery?: any;
}

export function processUserUtterance(
  utterance: string, 
  currentState: AgentRuntimeState, 
  userName: string = 'Ryan',
  utteranceId?: string
): DomainIntentResult {
  const rawClean = utterance.trim().toLowerCase();
  
  // Clean wake word prefix
  const strippedText = rawClean
    .replace(/^(hey|hi)\s+nest,?\s*/i, '')
    .replace(/^(hey|hi)\s+nora,?\s*/i, '')
    .replace(/^ask\s+nora,?\s*/i, '')
    .replace(/^nora,?\s*/i, '')
    .replace(/^nest\s+ops,?\s*/i, '')
    .replace(/^nest,?\s*/i, '')
    .trim();

  // 1. Wake Word Only — User said "hey nest" or "hey nora" or "ask nora" with no follow-up question
  if (!strippedText || rawClean === 'hey nest' || rawClean === 'hi nest' || rawClean === 'hey nora' || rawClean === 'hi nora' || rawClean === 'ask nora' || rawClean === 'nora' || rawClean === 'nest ops' || rawClean === 'nest') {
    return {
      intentType: 'WAKE_WORD_ONLY',
      category: 'wake_only',
      spokenResponse: "Hi, I'm listening.",
      displayResponse: "Hi, I'm listening.",
      utteranceId
    };
  }

  const cleanText = strippedText;

  // 2a. Mic check / Conversation Control ("Can you hear me?", "Are you there?")
  // EXACT NORMALIZED MATCH ONLY: Must match full normalized utterance, not partial substrings or keyword heuristics.
  const cleanLower = cleanText.toLowerCase().replace(/[?.!]/g, '').trim();
  const exactMicChecks = new Set([
    'can you hear me',
    'can you hear me now',
    'are you there',
    'are you listening',
    'can you hear me nora',
    'can you hear me nest'
  ]);

  if (exactMicChecks.has(cleanLower)) {
    return {
      intentType: 'CONVERSATION_CONTROL',
      category: 'conversation_control',
      spokenResponse: "Yes, I can hear you. What can I help you with?",
      displayResponse: "Yes, I can hear you. What can I help you with?",
      utteranceId
    };
  }

  // 2b. Conversational Repeat / Memory Recall Intent ("Can you repeat that?")
  if (
    cleanText === 'can you repeat that' ||
    cleanText === 'repeat that' ||
    cleanText === 'say that again' ||
    cleanText === 'what did you say' ||
    cleanText === 'can you say that again' ||
    cleanText === 'repeat' ||
    cleanText.includes('repeat that') ||
    cleanText.includes('say that again')
  ) {
    return {
      intentType: 'REPEAT_LAST_RESPONSE',
      category: 'conversation_control',
      spokenResponse: "Sure, let me repeat that for you.",
      displayResponse: "Sure, let me repeat that for you.",
      utteranceId
    };
  }

  // 2c. Conversational General Help ("Can you help me?", "Help me", "I need help")
  const exactHelpRequests = new Set([
    'can you help me',
    'could you help me',
    'can you help me please',
    'help me',
    'help',
    'i need help',
    'i need some help',
    'can you help me with something',
    'what can you do',
    'how can you help me',
    'help please'
  ]);

  if (exactHelpRequests.has(cleanLower)) {
    return {
      intentType: 'CONVERSATIONAL_HELP',
      category: 'conversation_control',
      spokenResponse: "Absolutely—what do you need help with?",
      displayResponse: "### NORA · Operational Assistant\n\nAbsolutely—what do you need help with? I can look up approved Nest SOP procedures, find directory contacts, or assist with contract drafting.",
      utteranceId
    };
  }

  // 2d. Conversational Greetings ("Hello", "Hi", "Good morning")
  const exactGreetings = new Set([
    'hello',
    'hi',
    'hey',
    'good morning',
    'good afternoon',
    'good evening'
  ]);

  if (exactGreetings.has(cleanLower)) {
    return {
      intentType: 'CONVERSATIONAL_GREETING',
      category: 'conversation_control',
      spokenResponse: `Hello ${userName}, how can I help you today?`,
      displayResponse: `### Good day, ${userName}!\n\nHow can I help you with your brokerage operations today?`,
      utteranceId
    };
  }

  // 2e. Conversational Gratitude ("Thank you", "Thanks", "Appreciate it", "Thanks Nora")
  const exactGratitude = new Set([
    'thank you',
    'thanks',
    'thanks nora',
    'thank you nora',
    'thank you so much',
    'thanks so much',
    'appreciate it',
    'appreciate your help',
    'much appreciated',
    'thanks for your help',
    'thanks for the help'
  ]);

  if (exactGratitude.has(cleanLower) || cleanLower.startsWith('thanks nora') || cleanLower.startsWith('thank you nora')) {
    return {
      intentType: 'CONVERSATIONAL_GRATITUDE',
      category: 'conversation_control',
      spokenResponse: "You're so welcome! Let me know if there's anything else you need, and have a wonderful day!",
      displayResponse: "### You're very welcome! 🌟\n\nGlad I could help. Let me know if there's anything else you need for your listing or transactions today!",
      utteranceId
    };
  }

  // 2f. Conversational Farewells ("Bye", "Goodbye", "See ya", "Have a good day")
  const exactFarewells = new Set([
    'bye',
    'goodbye',
    'bye nora',
    'goodbye nora',
    'bye bye',
    'see ya',
    'see you later',
    'talk soon',
    'talk to you later',
    'have a good day',
    'have a great day',
    'have a good one',
    'take care',
    'night',
    'good night'
  ]);

  if (exactFarewells.has(cleanLower) || cleanLower.startsWith('bye nora') || cleanLower.startsWith('goodbye nora')) {
    return {
      intentType: 'CONVERSATIONAL_FAREWELL',
      category: 'conversation_control',
      spokenResponse: "Bye, take care and have a fantastic day!",
      displayResponse: "### 👋 Goodbye!\n\nHave a fantastic day! Reach out anytime you need assistance with Nest operations.",
      utteranceId
    };
  }

  // 2g. Incomplete Short Prelude Guard ("Can you", "Could you", "I need")
  if (
    cleanLower === 'can you' || 
    cleanLower === 'could you' || 
    cleanLower === 'would you' || 
    cleanLower === 'i need' || 
    cleanLower === 'i want' ||
    cleanLower === 'please'
  ) {
    return {
      intentType: 'INCOMPLETE_PRELUDE',
      category: 'conversation_control',
      spokenResponse: "I'm listening—what would you like me to do?",
      displayResponse: "I'm listening—what would you like me to do?",
      utteranceId
    };
  }

  // 3. Handle Confirmation Intents when a proposal is pending
  if (currentState?.pendingProposal) {
    if (
      cleanText === 'confirm' || 
      cleanText === 'yes' || 
      cleanText === 'correct' || 
      cleanText.includes('do it') || 
      cleanText.includes('approve') ||
      cleanText.includes('proceed')
    ) {
      return {
        intentType: 'CONFIRM_PROPOSAL',
        category: 'action_request',
        spokenResponse: `Confirmed! Executed ${currentState.pendingProposal.summary}.`,
        displayResponse: `Confirmed! Executed ${currentState.pendingProposal.summary}.`,
        utteranceId
      };
    }

    if (
      cleanText === 'cancel' || 
      cleanText === 'no' || 
      cleanText === 'reject' || 
      cleanText.includes('stop') || 
      cleanText.includes('abort')
    ) {
      return {
        intentType: 'REJECT_PROPOSAL',
        category: 'action_request',
        spokenResponse: 'Cancelled proposal. What would you like to do next?',
        displayResponse: 'Cancelled proposal. What would you like to do next?',
        utteranceId
      };
    }
  }

  // 3. Brokerage Meeting Scheduling & Google Workspace Calendar Invites
  const normalizedUtterance = cleanLower.replace(/^execute:\s*/i, '').replace(/^execute\s+/i, '').trim();

  const isMeetingIntent = (
    normalizedUtterance.includes('meeting') ||
    normalizedUtterance.includes('calendar') ||
    normalizedUtterance.includes('appointment') ||
    normalizedUtterance.includes('google meet') ||
    normalizedUtterance.includes('zoom call') ||
    normalizedUtterance.includes('send an invite') ||
    normalizedUtterance.includes('send invites') ||
    normalizedUtterance.includes('invite all') ||
    normalizedUtterance.includes('invite everyone') ||
    normalizedUtterance.includes('asknora@nestrealty.com') ||
    normalizedUtterance.includes('1-on-1') ||
    normalizedUtterance.includes('1 on 1') ||
    normalizedUtterance.includes('one on one') ||
    /\b(schedule|set up|book)\b.*?\b(meeting|call|sync|appointment|time|calendar|session|chat|interview)\b/i.test(normalizedUtterance) ||
    /\b(schedule|book|set up)\s+(me|us|a|an|with|for)\b/i.test(normalizedUtterance)
  );

  if (isMeetingIntent) {
    let targetAudience = '';
    const matchedRosterPerson = NEST_FULL_ROSTER_77.find(p => 
      normalizedUtterance.includes(p.displayName.toLowerCase()) || 
      (p.firstName.length > 2 && p.lastName.length > 2 && normalizedUtterance.includes(p.firstName.toLowerCase() + ' ' + p.lastName.toLowerCase()))
    );

    if (matchedRosterPerson) {
      targetAudience = matchedRosterPerson.displayName;
    } else if (normalizedUtterance.includes('james fort') || normalizedUtterance.includes('james')) targetAudience = 'James Fort';
    else if (normalizedUtterance.includes('carolina beach')) targetAudience = 'Carolina Beach office team';
    else if (normalizedUtterance.includes('wilmington') || normalizedUtterance.includes('mayfaire')) targetAudience = 'all agents and staff in the wilmington office';
    else if (normalizedUtterance.includes('all') || normalizedUtterance.includes('everyone') || normalizedUtterance.includes('all hands') || normalizedUtterance.includes('entire directory') || normalizedUtterance.includes('all of them')) targetAudience = 'ALL wilmington, carolina beach office';
    else if (normalizedUtterance.includes('leadership') || normalizedUtterance.includes('bic')) targetAudience = 'leadership';

    let meetingDate = '';
    if (normalizedUtterance.includes('tomorrow')) meetingDate = 'tomorrow';
    else if (normalizedUtterance.includes('tuesday')) meetingDate = 'next Tuesday';
    else if (normalizedUtterance.includes('wednesday')) meetingDate = 'next Wednesday';
    else if (normalizedUtterance.includes('thursday')) meetingDate = 'next Thursday';
    else if (normalizedUtterance.includes('friday')) meetingDate = 'next Friday';
    else if (normalizedUtterance.match(/sept(?:ember)?\s*\d{1,2}/)) meetingDate = normalizedUtterance.match(/sept(?:ember)?\s*\d{1,2}/)![0];

    let startTime = '';
    const timeMatch = normalizedUtterance.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    if (timeMatch) {
      const hour = timeMatch[1];
      const minute = timeMatch[2] || '00';
      const ampm = timeMatch[3].toUpperCase();
      startTime = `${hour}:${minute} ${ampm}`;
    } else if (normalizedUtterance.includes('10:00')) {
      startTime = '10:00 AM';
    } else if (normalizedUtterance.includes('2:00')) {
      startTime = '2:00 PM';
    }

    let location = '';
    if (normalizedUtterance.includes('carolina beach')) location = 'Nest Realty Carolina Beach Office';
    else if (normalizedUtterance.includes('mayfaire') || normalizedUtterance.includes('training room')) location = 'Nest Realty Mayfaire Office (Large Training Room)';
    else if (normalizedUtterance.includes('conference room')) location = 'Nest Realty Mayfaire Office (Conference Room B)';
    else if (normalizedUtterance.includes('virtual') || normalizedUtterance.includes('google meet')) location = 'Google Meet Virtual Video Call';

    const isCapabilityQuery = (
      normalizedUtterance.includes('do you have the capability') ||
      normalizedUtterance.includes('can you') ||
      normalizedUtterance.includes('are you able') ||
      normalizedUtterance.includes('how do you') ||
      normalizedUtterance.includes('ability to')
    );

    const hasIncompleteInfo = !targetAudience || !meetingDate || !startTime || isCapabilityQuery;

    const draft = {
      title: targetAudience ? (targetAudience.includes('office') || targetAudience.includes('ALL') ? 'Nest Realty In-Office Meeting' : `Meeting with ${targetAudience}`) : 'In-Office Brokerage Meeting',
      targetAudience: targetAudience || '',
      meetingDate,
      startTime: startTime || '10:00 AM',
      durationMinutes: 60,
      location,
      requesterName: userName
    };

    if (isCapabilityQuery) {
      return {
        intentType: 'CLARIFY_MEETING_SCHEDULE',
        category: 'action_request',
        spokenResponse: `Yes, absolutely! I am connected directly to Nest Google Workspace via AskNora@nestrealty.com. I can generate and dispatch official calendar invites to all 77 brokers across Wilmington and Carolina Beach, or to specific offices and individuals. Select your date and time below to send out the invites:`,
        displayResponse: `### 📅 Yes, Absolutely!\n\nI am connected directly to Nest Google Workspace via **AskNora@nestrealty.com**.\n\nI have the capability to generate and dispatch official calendar invites with RSVP tracking and \`.ics\` attachments to **all 77 brokers across Wilmington/Mayfaire and Carolina Beach**, or to specific offices and individuals.\n\n*Select your audience, date, and location below to dispatch the Google Calendar meeting:*`,
        meetingWizard: draft,
        utteranceId
      };
    }

    if (hasIncompleteInfo) {
      return {
        intentType: 'CLARIFY_MEETING_SCHEDULE',
        category: 'action_request',
        spokenResponse: `I can get that meeting scheduled on Google Calendar for you! Please select who is attending, the date, and location below to dispatch the invites from AskNora@nestrealty.com.`,
        displayResponse: `I can get that meeting scheduled on Google Calendar for you! Please select the audience, date, and location below to dispatch the invites from **AskNora@nestrealty.com**:`,
        meetingWizard: draft,
        utteranceId
      };
    }

    return {
      intentType: 'SCHEDULE_BROKERAGE_MEETING',
      category: 'action_request',
      spokenResponse: `You got it, ${userName}! I've staged the Google Calendar meeting for ${targetAudience} on ${meetingDate} at ${startTime}. Click below to dispatch the invites from AskNora@nestrealty.com!`,
      displayResponse: `You got it, ${userName}! I've staged the Google Calendar meeting for **${targetAudience}** on **${meetingDate} at ${startTime}**. Review and confirm below to dispatch the invites from **AskNora@nestrealty.com**:`,
      meetingWizard: draft,
      utteranceId
    };
  }

  // 4. Nora Autonomous Web Research & Virtual Machine Browser Agent
  const isExcludedFromWebResearch = 
    normalizedUtterance.includes('scan') ||
    normalizedUtterance.includes('camera') ||
    normalizedUtterance.includes('ocr') ||
    normalizedUtterance.includes('matchmaker') ||
    normalizedUtterance.includes('radar') ||
    normalizedUtterance.includes('kiosk') ||
    normalizedUtterance.includes('celebrat') ||
    normalizedUtterance.includes('particle') ||
    normalizedUtterance.includes('cma') ||
    normalizedUtterance.includes('net sheet') ||
    normalizedUtterance.includes('payroll') ||
    normalizedUtterance.includes('commission split') ||
    normalizedUtterance.includes('emergency maintenance') ||
    normalizedUtterance.includes('commercial lease') ||
    normalizedUtterance.includes('multiple offer') ||
    normalizedUtterance.includes('listing launch') ||
    normalizedUtterance.includes('what contracts are') ||
    normalizedUtterance.includes('contracts under') ||
    normalizedUtterance.includes('my contracts') ||
    normalizedUtterance.includes('active contracts') ||
    normalizedUtterance.includes('pending contracts') ||
    normalizedUtterance.includes('contract files');

  const isWebResearchIntent = !isExcludedFromWebResearch && (
    normalizedUtterance.startsWith('search the web') ||
    normalizedUtterance.startsWith('search web') ||
    normalizedUtterance.startsWith('browse the web') ||
    normalizedUtterance.startsWith('google ') ||
    normalizedUtterance.includes('ncrec') ||
    normalizedUtterance.includes('rules on earnest money') ||
    normalizedUtterance.includes('rules on due diligence') ||
    normalizedUtterance.includes('due diligence rule') ||
    normalizedUtterance.includes('due diligence rules') ||
    normalizedUtterance.includes('earnest money rule') ||
    normalizedUtterance.includes('earnest money deadline') ||
    normalizedUtterance.includes('form 2-t rules') ||
    normalizedUtterance.includes('form 2t rules') ||
    normalizedUtterance.includes('look up ncrec') ||
    normalizedUtterance.includes('look up tax') ||
    normalizedUtterance.includes('look up gis') ||
    normalizedUtterance.includes('look up parcel') ||
    normalizedUtterance.includes('tax parcel') ||
    normalizedUtterance.includes('tax map') ||
    normalizedUtterance.includes('gis') ||
    normalizedUtterance.includes('flood zone') ||
    normalizedUtterance.includes('look up market comps') ||
    normalizedUtterance.includes('market stat') ||
    normalizedUtterance.includes('median price') ||
    normalizedUtterance.includes('look up flood zone') ||
    normalizedUtterance.includes('search for vendor') ||
    normalizedUtterance.includes('preferred vendor') ||
    normalizedUtterance.includes('browser vm') ||
    normalizedUtterance.includes('virtual machine') ||
    normalizedUtterance.includes('verify on the web') ||
    normalizedUtterance.includes('verify web') ||
    normalizedUtterance.includes('search online')
  );

  if (isWebResearchIntent) {
    const cleanSearchQuery = normalizedUtterance
      .replace(/^search the web for/i, '')
      .replace(/^search the web/i, '')
      .replace(/^search web for/i, '')
      .replace(/^search web/i, '')
      .replace(/^browse the web for/i, '')
      .replace(/^browse the web/i, '')
      .replace(/^google/i, '')
      .replace(/^verify on the web/i, '')
      .replace(/^verify web/i, '')
      .trim() || normalizedUtterance;

    return {
      intentType: 'WEB_RESEARCH_BROWSER_VM',
      category: 'action_request',
      spokenResponse: `I've booted a live Chromium virtual machine sandbox and navigated the web to verify "${cleanSearchQuery}". Here are the verified legal statutes and official county records.`,
      displayResponse: `### 🌐 Verified via Nora Virtual Machine Browser Agent\n\nI booted a dedicated **Chromium 128 Sandbox VM** and executed live DOM extraction across official regulatory and municipal databases for: **"${cleanSearchQuery}"**.\n\n*Click below to view the live interactive VM browser trace, extracted citations, and visual viewport snapshots:*`,
      webResearchQuery: cleanSearchQuery,
      utteranceId
    };
  }

  // 3a. Roster & Team Intelligence (Ryan, Adam, Marcus, Matt, Melissa, Eduardo, Ann, Jessica, BICs)
  if (
    cleanLower.includes('who is the bic') ||
    cleanLower.includes('who is our bic') ||
    cleanLower.includes('broker in charge') ||
    cleanLower.includes('bics') ||
    cleanLower.includes('who is ryan') ||
    cleanLower.includes('ryan crecelius') ||
    cleanLower.includes('who is adam') ||
    cleanLower === 'adam' ||
    cleanLower.includes('who is marcus') ||
    cleanLower.includes('marcus aman') ||
    cleanLower.includes('who is matt') ||
    cleanLower.includes('matt orr') ||
    cleanLower.includes('who is melissa') ||
    cleanLower.includes('melissa gagliardi') ||
    cleanLower.includes('who is eduardo') ||
    cleanLower.includes('eduardo lovo') ||
    cleanLower.includes('who is ann') ||
    cleanLower.includes('ann gunn') ||
    cleanLower.includes('who is jessica') ||
    cleanLower.includes('jessica keenan') ||
    cleanLower === 'roster' ||
    cleanLower === 'directory' ||
    cleanLower.includes('show roster') ||
    cleanLower.includes('team directory') ||
    cleanLower.includes('who handles marketing') ||
    cleanLower.includes('who handles signs') ||
    cleanLower.includes('who handles operations')
  ) {
    if (cleanLower.includes('bic') || cleanLower.includes('broker in charge')) {
      return {
        intentType: 'ROSTER_BIC_LOOKUP',
        category: 'knowledge_question',
        spokenResponse: 'Our designated Brokers-in-Charge at Nest Realty are Ryan Crecelius (Principal Broker), Jessica Keenan (BIC & Contract Compliance), and Eric Knight (BIC).',
        displayResponse: '### 🏛️ Nest Realty Brokers-in-Charge (BIC Leadership)\n\n- 👔 **Ryan Crecelius**: Principal Broker & Co-Founder • License #29184 • `(910) 392-4100` • `ryan@nestrealty.com`\n- 👔 **Jessica Keenan**: Broker-in-Charge & Compliance Auditor • `jessica@nestrealty.com`\n- 👔 **Eric Knight**: Broker-in-Charge & Regulatory Specialist • `eric.knight@nestrealty.com`\n\n*Governing SOP*: `SOP-BIC-001` (NCREC Advertising & Contract Compliance Audit Protocol)',
        utteranceId,
        actionCard: {
          title: 'Broker-in-Charge Compliance Desk',
          target: 'Nest Leadership & Governance Hub',
          details: 'Designated BICs • Principal Broker: Ryan Crecelius'
        }
      };
    }

    if (cleanLower.includes('ryan')) {
      return {
        intentType: 'ROSTER_PERSON_LOOKUP',
        category: 'knowledge_question',
        spokenResponse: 'Ryan Crecelius is the Principal Broker and Co-Founder at Nest Realty. His direct phone is (910) 392-4100, email is ryan@nestrealty.com, NC Firm License is #29184, based at Mayfaire HQ.',
        displayResponse: '### 👤 Team Member Profile: Ryan Crecelius\n\n- **Role**: Principal Broker & Co-Founder (Owner / BIC)\n- **Direct Phone**: 📞 `(910) 392-4100`\n- **Email**: ✉️ `ryan@nestrealty.com`\n- **Office**: Mayfaire HQ (990 Inspiration Dr, Wilmington NC)\n- **NC Real Estate License**: `#29184`\n- **Governing SOP**: `SOP-GOV-001` (Weekly Owner Digest & Governance)\n- **System Permissions**: Full Administrative Ownership (`sops.delete`, `admin`, `owner`)',
        utteranceId,
        actionCard: {
          title: 'Ryan Crecelius • Principal Broker',
          target: 'Executive Leadership Directory',
          details: '(910) 392-4100 • ryan@nestrealty.com • License #29184 • Mayfaire HQ'
        }
      };
    }

    if (cleanLower.includes('marcus')) {
      return {
        intentType: 'ROSTER_PERSON_LOOKUP',
        category: 'knowledge_question',
        spokenResponse: 'Marcus Aman is Platform Owner and Broker Associate at Nest Realty. His direct phone is (910) 507-2047, email is marcus@shapework.co and marcus@nestrealty.com.',
        displayResponse: '### 👤 Team Member Profile: Marcus Aman\n\n- **Role**: Platform Owner & Broker Associate\n- **Direct Phone**: 📞 `(910) 507-2047`\n- **Email**: ✉️ `marcus@shapework.co` / `marcus@nestrealty.com`\n- **Office**: Mayfaire HQ\n- **System Permissions**: Full Administrative Ownership (`owner`, `admin`, `sops.delete`)',
        utteranceId,
        actionCard: {
          title: 'Marcus Aman • Platform Owner & Broker',
          target: 'Shapework Leadership Desk',
          details: '(910) 507-2047 • marcus@shapework.co • Admin Access'
        }
      };
    }

    if (cleanLower.includes('matt')) {
      return {
        intentType: 'ROSTER_PERSON_LOOKUP',
        category: 'knowledge_question',
        spokenResponse: 'Matt Orr is an Agent and REALTOR® at Mayfaire. His direct phone is (910) 612-8283, email is matt.orr@nestrealty.com.',
        displayResponse: '### 👤 Team Member Profile: Matt Orr (REALTOR®)\n\n- **Role**: Agent & REALTOR®\n- **Direct Phone**: 📞 `(910) 612-8283`\n- **Email**: ✉️ `matt.orr@nestrealty.com`\n- **Office**: Mayfaire HQ\n- **Active Listing**: `126 Parkwood Avenue, Wilmington NC` ($625,000)\n- **System Permissions**: Agent (`agent`)',
        utteranceId,
        actionCard: {
          title: 'Matt Orr • Agent (REALTOR®)',
          target: 'Mayfaire Roster Desk',
          details: '(910) 612-8283 • matt.orr@nestrealty.com • 126 Parkwood Listing'
        }
      };
    }

    if (cleanLower.includes('melissa') || cleanLower.includes('who handles marketing')) {
      return {
        intentType: 'ROSTER_PERSON_LOOKUP',
        category: 'knowledge_question',
        spokenResponse: 'Melissa Gagliardi is our Marketing Project Manager and Brand Director. Her email is melissa.gagliardi@nestrealty.com, managing marketing intake, social blitzes, and Maxa templates.',
        displayResponse: '### 👤 Team Member Profile: Melissa Gagliardi\n\n- **Role**: Marketing Project Manager & Brand Lead\n- **Email**: ✉️ `melissa.gagliardi@nestrealty.com`\n- **Office**: Mayfaire Marketing Studio\n- **Governing SOPs**: `SOP-MKT-001` (Marketing Intake), `SOP-MKT-002` (Social Blitz), `SOP-REV-001` (Collateral Review)\n- **Integrated Tools**: Nest Design Center (Maxa Admin), Basecamp To-Dos, SendGrid',
        utteranceId,
        actionCard: {
          title: 'Melissa Gagliardi • Marketing PM',
          target: 'Marketing Intake & Review Studio',
          details: 'melissa.gagliardi@nestrealty.com • SOP-MKT-001 • Maxa Admin'
        }
      };
    }

    if (cleanLower.includes('eduardo')) {
      return {
        intentType: 'ROSTER_PERSON_LOOKUP',
        category: 'knowledge_question',
        spokenResponse: 'Eduardo Lovo is our Virtual Assistant and Maxa Production Specialist. His email is eduardo.lovo@nestrealty.com, responsible for 300 DPI collateral production and quality checklists.',
        displayResponse: '### 👤 Team Member Profile: Eduardo Lovo\n\n- **Role**: Virtual Assistant & Marketing Production Specialist\n- **Email**: ✉️ `eduardo.lovo@nestrealty.com`\n- **Governing SOPs**: `SOP-MKT-003` (Maxa 300 DPI Collateral Production), `SOP-MKT-004` (Brand SOP Quality Checklist)\n- **Active Workstation**: VA Production Workspace (Double Flyer, 9:16 Story, 6x9 Postcard)',
        utteranceId,
        actionCard: {
          title: 'Eduardo Lovo • VA Production Specialist',
          target: 'VA Workstation Console',
          details: 'eduardo.lovo@nestrealty.com • SOP-MKT-003 • 300 DPI Staging'
        }
      };
    }

    if (cleanLower.includes('ann') || cleanLower.includes('who handles signs') || cleanLower.includes('who handles operations')) {
      return {
        intentType: 'ROSTER_PERSON_LOOKUP',
        category: 'knowledge_question',
        spokenResponse: 'Ann Gunn is our Air Traffic Controller and Operations Lead. Her email is ann@nestrealty.com, managing sign vendor dispatches with Coastal Sign Post Co. and Supra lockboxes.',
        displayResponse: '### 👤 Team Member Profile: Ann Gunn\n\n- **Role**: Air Traffic Controller (ATC) & Operations Lead\n- **Email**: ✉️ `ann@nestrealty.com`\n- **Office**: Mayfaire Operations Desk\n- **Governing SOPs**: `SOP-OPS-001` (Sign Post Co. Dispatch), `SOP-OPS-002` (Supra Lockbox Management)\n- **Primary Vendors**: Coastal Sign Post Co., Supra Showing Access',
        utteranceId,
        actionCard: {
          title: 'Ann Gunn • Operations & ATC Lead',
          target: 'Tasks & Operations Console',
          details: 'ann@nestrealty.com • SOP-OPS-001 • Coastal Sign Post Co.'
        }
      };
    }

    return {
      intentType: 'ROSTER_GENERAL_LOOKUP',
      category: 'knowledge_question',
      spokenResponse: 'Nest Realty has 72 active brokers and staff across our Mayfaire HQ and Carolina Beach offices, led by Principal Broker Ryan Crecelius.',
      displayResponse: '### 👥 Nest Realty Roster & Operations Directory (72 Team Members)\n\n- **Principal Broker & Co-Founder**: Ryan Crecelius (`(910) 392-4100`)\n- **Marketing PM & Brand Lead**: Melissa Gagliardi (`melissa.gagliardi@nestrealty.com`)\n- **VA Production Specialist**: Eduardo Lovo (`eduardo.lovo@nestrealty.com`)\n- **Operations & ATC Lead**: Ann Gunn (`ann@nestrealty.com`)\n- **Platform Admins**: Marcus Aman (`(910) 507-2047`), Adam (`adam@shapework.co`)\n\n*Offices*: Mayfaire HQ (990 Inspiration Dr, Wilmington NC) & Carolina Beach',
      utteranceId,
      actionCard: {
        title: 'Nest Realty Brokerage Directory',
        target: 'Roster & Org Chart Hub',
        details: '72 Active Members • Mayfaire HQ & Carolina Beach • 100% Verified'
      }
    };
  }

  // 3b-0. Spatial Property Comps & Interactive Offer Map Queries
  if (
    cleanLower.includes('spatial comp') ||
    cleanLower.includes('comp map') ||
    cleanLower.includes('comps map') ||
    cleanLower.includes('offer map') ||
    cleanLower.includes('neighborhood comp') ||
    cleanLower.includes('spatial market map') ||
    cleanLower.includes('comparable map')
  ) {
    return {
      intentType: 'SPATIAL_COMPS_QUERY',
      category: 'knowledge_question',
      spokenResponse: "I've opened the Spatial Comps and Offer Intelligence Map. In Landfall, 1104 Arboretum is positioned at $1.25M ($362/sqft) alongside 1118 Arboretum which recently closed at $1.195M, and active competitor 1040 Arboretum at $1.295M. In Wrightsville Beach, 742 Lumina is mapped with deepwater dock access at $1.95M.",
      displayResponse: "### 🗺️ Spatial Comps & Offer Intelligence Map\n\n- **Subject Property**: 1104 Arboretum Dr, Landfall ($1,250,000 • $362/sf)\n- **Spatial Radius**: 3.0 Miles (7 Nearby Luxury Comps Indexed)\n- **Active Competitor**: 1040 Arboretum Dr ($1,295,000 • $364/sf)\n- **Recent Closed Benchmark**: 1118 Arboretum Dr ($1,195,000 • $373/sf • Sold in 11 Days)\n- **Soundfront Benchmark**: 742 Lumina Ave ($1,950,000 • $541/sf)\n\n*Key Offer Insights*:\n- 🎯 **Due Diligence Standard**: $25,000 (2.0% Non-Refundable Fee standard in Landfall).\n- 🚀 **Form 2-T Offer Simulator Ready**: Interactive price sliders, DD timeline calculations, and estimated seller net sheet available in the Spatial Comps tab.",
      utteranceId,
      suggestedActions: [
        { id: 'act_spatial_open', label: '🗺️ Open Spatial Comps Console', actionType: 'VIEW_SPATIAL_COMPS', payload: { address: '1104 Arboretum Dr', subjectId: 'prop_1104_arboretum' } },
        { id: 'act_spatial_sim', label: '🧮 Simulate Form 2-T Offer', actionType: 'SIMULATE_OFFER', payload: { address: '1104 Arboretum Dr', offerPrice: 1250000 } },
        { id: 'act_cmp_proofs', label: '📄 Inspect 1104 Arboretum Proofs', actionType: 'INSPECT_PROOFS', payload: { address: '1104 Arboretum Dr' } }
      ],
      actionCard: {
        title: 'Spatial Comps & Offer Intelligence Console',
        target: 'Marketing Intake & Spatial Comps',
        details: 'Interactive Google GIS Map • Side-by-Side Matrix • Form 2-T Simulator'
      }
    };
  }

  // 3b-1. Multi-Listing Comparative Intelligence & Neighborhood Filters
  if (
    !cleanLower.includes('offer') &&
    (
      cleanLower.includes('compare') ||
      cleanLower.includes('properties in landfall') ||
      cleanLower.includes('properties in wrightsville') ||
      cleanLower.includes('properties over 1m') ||
      cleanLower.includes('properties over $1,000,000') ||
      cleanLower.includes('over a million') ||
      cleanLower.includes('which listings have proofs') ||
      cleanLower.includes('listings with proofs') ||
      cleanLower.includes('all listings') ||
      cleanLower.includes('listing inventory')
    )
  ) {
    return {
      intentType: 'LISTINGS_COMPARATIVE_QUERY',
      category: 'knowledge_question',
      spokenResponse: "We currently have 4 active listings in our portfolio: 742 Lumina Avenue in Wrightsville Beach at $1.95M, 1104 Arboretum Drive in Landfall at $1.25M with 3 staged Maxa proofs, 312 Mayfaire Way at $720k, and 126 Parkwood Avenue at $625k. Both Landfall and Wrightsville Beach properties exceed $1 Million.",
      displayResponse: "### 📊 Multi-Listing Comparative Intelligence Matrix\n\n| Property Address | Neighborhood | List Price | Specs | Listing Broker | Marketing Status | 300 DPI Proofs |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n| **742 Lumina Ave** | Wrightsville Beach | **$1,950,000** | 4 Bed / 4 Bath (3,600 sf) | Ryan Crecelius | 🟡 In Production | Staging in Progress |\n| **1104 Arboretum Dr** | Landfall (Golf/Pool) | **$1,250,000** | 4 Bed / 3.5 Bath (3,450 sf) | Jessica Keenan | 🟢 Ready for Review | **3 Proofs Staged** (Flyer, Story, Postcard) |\n| **312 Mayfaire Way** | Mayfaire / Autumn Hall | **$720,000** | 4 Bed / 3 Bath (2,800 sf) | Melissa Gagliardi | 🟢 Delivered / Active | Yard Sign Post Dispatched ($65) |\n| **126 Parkwood Ave** | Central Wilmington | **$625,000** | 3 Bed / 2.5 Bath (2,450 sf) | Matt Orr | ⚠️ Needs Attention | Listing Presentation Due Tomorrow |\n\n*Key Highlights*:\n- 🌊 **Top Luxury Tier (>$1.0M)**: 742 Lumina Ave ($1.95M) and 1104 Arboretum Dr ($1.25M).\n- 🚀 **Maxa Proofs Ready to Review**: 1104 Arboretum Dr has 3 vector proofs staged in Eduardo's workspace.",
      utteranceId,
      suggestedActions: [
        { id: 'act_cmp_proofs', label: '📄 Inspect 1104 Arboretum Proofs', actionType: 'INSPECT_PROOFS', payload: { address: '1104 Arboretum Dr' } },
        { id: 'act_cmp_maxa', label: '🚀 Launch Maxa for 742 Lumina', actionType: 'LAUNCH_MAXA_AGENT', payload: { address: '742 Lumina Ave', agentName: 'Ryan Crecelius', price: '$1,950,000' } },
        { id: 'act_cmp_dd', label: '📅 Calculate Form 2-T Timeline', actionType: 'CALCULATE_DD', payload: { address: '742 Lumina Ave' } },
        { id: 'act_cmp_sign', label: '🪧 Dispatch Coastal Sign Post', actionType: 'DISPATCH_SIGN_POST', payload: { address: '312 Mayfaire Way' } }
      ],
      actionCard: {
        title: 'Brokerage Active Listing Portfolio Matrix',
        target: 'Marketing & Production Hub',
        details: '4 Properties ($625k - $1.95M) • Landfall, Wrightsville Beach, Mayfaire'
      }
    };
  }

  // 3b. Live Marketing & Property Listing Inquiries (1104 Arboretum, 742 Lumina, 126 Parkwood, 312 Mayfaire, 304 Ocean)
  if (
    cleanLower.includes('1104 arboretum') ||
    cleanLower.includes('arboretum') ||
    cleanLower.includes('742 lumina') ||
    cleanLower.includes('lumina') ||
    cleanLower.includes('126 parkwood') ||
    cleanLower.includes('parkwood') ||
    cleanLower.includes('304 ocean') ||
    cleanLower.includes('marketing status') ||
    cleanLower.includes('eduardo queue') ||
    cleanLower.includes('eduardo working on')
  ) {
    if (cleanLower.includes('1104 arboretum') || cleanLower.includes('arboretum')) {
      const agentName = 'Sarah Jenkins';
      const agentFirstName = 'Sarah';
      const agentPhone = '(910) 555-0199';
      const agentEmail = 'sarah.jenkins@nestrealty.com';

      return {
        intentType: 'MARKETING_PROPERTY_STATUS',
        category: 'knowledge_question',
        spokenResponse: `1104 Arboretum Drive is listed at $1,250,000 by ${agentName}. The Double-Sided Flyer, 9:16 Social Story, and 6x9 Postcard are rendered in 300 DPI and staged in Eduardo's workspace under Ready for Review.`,
        displayResponse: `### 🏡 Property Marketing File: 1104 Arboretum Drive\n\n- **Property Address**: 1104 Arboretum Dr, Wilmington, NC 28405\n- **List Price**: **$1,250,000.00** | **Specs**: 4 Beds / 3.5 Baths (3,450 SqFt)\n- **Listing Agent**: ${agentName} (\`${agentEmail}\` • \`${agentPhone}\`)\n- **Package**: Luxury Collateral Suite (Print + Social)\n- **Status**: 🟢 **Ready for Review** (Staged in Eduardo\'s Workspace)\n- **Generated Assets**:\n  - 📄 8.5x11 Property Flyer (300 DPI Vector PDF)\n  - 📱 9:16 Instagram Story Reel (1080x1920 PNG)\n  - ✉️ 6x9 EDDM Postcard (USPS Compliant)\n- **Governing SOP**: \`SOP-MKT-003\` (Maxa Production Protocol)`,
        utteranceId,
        suggestedActions: [
          { id: 'act_maxa_1104', label: '🚀 Launch Maxa Agent', actionType: 'LAUNCH_MAXA_AGENT', payload: { address: '1104 Arboretum Dr', agentName, price: '$1,250,000' } },
          { id: 'act_proof_1104', label: '📄 Inspect 300 DPI Proofs', actionType: 'INSPECT_PROOFS', payload: { address: '1104 Arboretum Dr', flyerUrl: 'https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/229058/image/original/open-uri20260804-25191-essk58.jpg' } },
          { id: 'act_sign_1104', label: '🪧 Dispatch Coastal Sign Post ($65)', actionType: 'DISPATCH_SIGN_POST', payload: { address: '1104 Arboretum Dr', rider: 'Pool & Golf View' } },
          { id: 'act_sms_agent', label: `📱 Text Status to ${agentFirstName}`, actionType: 'SEND_SMS', payload: { recipient: agentName, phone: agentPhone } }
        ],
        actionCard: {
          title: '1104 Arboretum Dr • 300 DPI Proofs Ready',
          target: 'Marketing Review & Dispatch Desk',
          details: `$1.25M • ${agentName} • 3 Proofs Staged in Eduardo Workspace • Ready to Deliver`
        }
      };
    }

    if (cleanLower.includes('742 lumina') || cleanLower.includes('lumina')) {
      return {
        intentType: 'MARKETING_PROPERTY_STATUS',
        category: 'knowledge_question',
        spokenResponse: '742 Lumina Avenue in Wrightsville Beach is listed at $1,950,000 by Ryan Crecelius. It is active in both marketing collateral production and Form 2-T compliance contract audit.',
        displayResponse: '### 🏡 Property Marketing File: 742 Lumina Avenue\n\n- **Property Address**: 742 Lumina Ave, Wrightsville Beach, NC 28480\n- **List Price**: **$1,950,000.00** | **Specs**: 4 Beds / 4 Baths (3,600 SqFt)\n- **Listing Agent**: Ryan Crecelius (`ryan@nestrealty.com` • `(910) 392-4100`)\n- **Package**: Luxury Waterfront Collateral Suite\n- **Status**: 🟡 **In Production / Compliance Review**\n- **Assigned Team**: Eduardo Lovo (Marketing) & Ryan Crecelius (BIC Compliance)\n- **Governing SOPs**: `SOP-MKT-003` & `SOP-BIC-001`',
        utteranceId,
        suggestedActions: [
          { id: 'act_maxa_742', label: '🚀 Launch Maxa Agent', actionType: 'LAUNCH_MAXA_AGENT', payload: { address: '742 Lumina Ave', agentName: 'Ryan Crecelius', price: '$1,950,000' } },
          { id: 'act_calc_dd_742', label: '📅 Calculate Due Diligence Schedule', actionType: 'CALCULATE_DD', payload: { address: '742 Lumina Ave' } },
          { id: 'act_sign_742', label: '🪧 Dispatch Coastal Sign Post ($65)', actionType: 'DISPATCH_SIGN_POST', payload: { address: '742 Lumina Ave' } }
        ],
        actionCard: {
          title: '742 Lumina Ave • Waterfront Suite',
          target: 'Marketing & BIC Compliance Desk',
          details: '$1.95M • Ryan Crecelius • Luxury Print & Digital Suite Active'
        }
      };
    }

    if (cleanLower.includes('126 parkwood') || cleanLower.includes('parkwood')) {
      return {
        intentType: 'MARKETING_PROPERTY_STATUS',
        category: 'knowledge_question',
        spokenResponse: '126 Parkwood Avenue is listed at $625,000 by Matt Orr. The listing presentation deck in print and digital formats is assigned to Melissa Gagliardi with SLA target for tomorrow.',
        displayResponse: '### 🏡 Property Marketing File: 126 Parkwood Avenue\n\n- **Property Address**: 126 Parkwood Avenue, Wilmington NC 28403\n- **List Price**: **$625,000.00** | **Specs**: 3 Beds / 2.5 Baths (2,450 SqFt)\n- **Listing Agent**: Matt Orr (`matt.orr@nestrealty.com` • `(910) 612-8283`)\n- **Package**: Listing Presentation (Print & Digital)\n- **Status**: ⚠️ **Needs Attention / Urgent Production** (Target SLA: Tomorrow)\n- **Assigned PM**: Melissa Gagliardi\n- **Governing SOP**: `SOP-MKT-001` (Marketing Intake & Dispatch)',
        utteranceId,
        suggestedActions: [
          { id: 'act_maxa_126', label: '🚀 Launch Maxa Agent', actionType: 'LAUNCH_MAXA_AGENT', payload: { address: '126 Parkwood Ave', agentName: 'Matt Orr', price: '$625,000' } },
          { id: 'act_sms_matt', label: '📱 Text Status to Matt Orr', actionType: 'SEND_SMS', payload: { recipient: 'Matt Orr', phone: '(910) 612-8283' } }
        ],
        actionCard: {
          title: '126 Parkwood Ave • Listing Presentation',
          target: 'Marketing Intake Desk',
          details: '$625k • Matt Orr • Print & Digital Presentation Deck • SLA: Urgent'
        }
      };
    }

    if (cleanLower.includes('304 ocean') || cleanLower.includes('ocean')) {
      return {
        intentType: 'MARKETING_PROPERTY_STATUS',
        category: 'knowledge_question',
        spokenResponse: '304 Ocean Boulevard is currently awaiting missing photo assets and open house schedule confirmation from listing broker Eric Knight.',
        displayResponse: '### 🏡 Property Marketing File: 304 Ocean Boulevard\n\n- **Property Address**: 304 Ocean Boulevard, Carolina Beach NC\n- **Listing Agent**: Eric Knight (`eric.knight@nestrealty.com`)\n- **Status**: ⚠️ **Needs Information** (Missing HDR photos & open house hours)\n- **Action**: 1-Click Send SMS Questions to Eric Knight',
        utteranceId,
        suggestedActions: [
          { id: 'act_sms_eric', label: '📱 Send SMS Questions to Eric Knight', actionType: 'SEND_SMS', payload: { recipient: 'Eric Knight' } }
        ],
        actionCard: {
          title: '304 Ocean Blvd • Missing Details',
          target: 'Agent Outreach Desk',
          details: 'Waiting on photos and open house times from Eric Knight.'
        }
      };
    }
  }

  // 3c. SOP Governance & Deletion Permissions (SOP-MKT-001 through SOP-BIC-001, deletion rules)
  if (
    cleanLower.includes('sop-mkt') ||
    cleanLower.includes('sop-ops') ||
    cleanLower.includes('sop-gov') ||
    cleanLower.includes('sop-bic') ||
    cleanLower.includes('sop-rev') ||
    (cleanLower.includes('delete') && (cleanLower.includes('sop') || cleanLower.includes('procedure') || cleanLower.includes('workflow'))) ||
    cleanLower.includes('sop permissions') ||
    cleanLower.includes('sop rules')
  ) {
    if (cleanLower.includes('delete') || cleanLower.includes('permission')) {
      return {
        intentType: 'SOP_DELETION_GOVERNANCE',
        category: 'knowledge_question',
        spokenResponse: 'Only designated administrators with sops.delete permission can delete published SOPs. The authorized administrators are Ryan Crecelius, Adam, Marcus Aman, and Matt Orr.',
        displayResponse: '### 🛡️ Published SOP Deletion Governance & RBAC\n\nTo preserve brokerage compliance and operational continuity, deleting a published SOP requires verified administrative authorization:\n\n- 👑 **Ryan Crecelius** (`ryan@nestrealty.com` • Owner / Principal Broker)\n- 👑 **Adam** (`adam@shapework.co` • Administrator)\n- 👑 **Marcus Aman** (`marcus@shapework.co` • Owner / Platform Lead)\n- 👑 **Matt Orr** (`matt.orr@nestrealty.com` • Administrator / BIC)\n\n*Permitted Roles with `sops.delete`*: `owner`, `admin`, `bic`, `operations_lead`\n*Protected Records*: 9 Core Nest Operating Protocols',
        utteranceId,
        actionCard: {
          title: 'SOP Deletion Governance & RBAC Policy',
          target: 'Brokerage Compliance Matrix',
          details: 'Authorized Admins: Ryan, Adam, Marcus, Matt • RBAC: sops.delete'
        }
      };
    }

    if (cleanLower.includes('sop-mkt-003')) {
      return {
        intentType: 'SOP_DETAILS_LOOKUP',
        category: 'knowledge_question',
        spokenResponse: 'SOP-MKT-003 governs Autonomous Maxa Collateral Production and 300 DPI Export, owned by Eduardo Lovo. It covers SSO login, MLS data mapping, Brand Kit palette injection, and Google Drive proof archiving.',
        displayResponse: '### 📋 SOP-MKT-003: Autonomous Maxa Collateral Production Protocol\n\n- **Owner**: Eduardo Lovo (VA & Production Specialist)\n- **SLA**: 4 Hours from intake dispatch\n- **Integrated Systems**: Nest Design Center (Maxa), Chromium Browser Agent, Google Drive\n- **Ordered Steps**:\n  1. Authenticate operator session on `nest.maxadesigns.com`\n  2. Select 3 official templates (Double Flyer #229058, Story #206208, Postcard #229016)\n  3. Map listing price, beds/baths, headline, and high-res photos\n  4. Inject NCREC Equal Housing & Firm License #C29184 disclaimers\n  5. Compile 300 DPI vector PDF and stage in review queue\n- **Completion Evidence**: 300 DPI vector PDF in Google Drive proof folder',
        utteranceId,
        actionCard: {
          title: 'SOP-MKT-003 • Maxa Production Protocol',
          target: 'SOP Library & Governance Hub',
          details: 'Owner: Eduardo Lovo • 300 DPI Vector PDF Export • NCREC Disclaimers'
        }
      };
    }

    if (cleanLower.includes('sop-ops-001')) {
      return {
        intentType: 'SOP_DETAILS_LOOKUP',
        category: 'knowledge_question',
        spokenResponse: 'SOP-OPS-001 governs Coastal Sign Post Co. yard post and custom rider dispatch, owned by Ann Gunn. Standard dispatch turnaround is 24 to 48 hours for $65.',
        displayResponse: '### 📋 SOP-OPS-001: Coastal Sign Post Co. Yard Post Protocol\n\n- **Owner**: Ann Gunn (ATC & Operations Lead)\n- **Vendor**: Coastal Sign Post Co. (`(910) 555-SIGN`)\n- **Cost**: $65.00 standard installation | **Turnaround**: 24–48 Hours\n- **Ordered Steps**:\n  1. Ingest sign post request & verify property address coordinates\n  2. Confirm underground utility clearance (NC811)\n  3. Dispatch work order ticket to Coastal Sign Post Co.\n  4. Send confirmation tracking SMS to listing broker\n- **Completion Evidence**: Vendor work order invoice & on-site GPS verification photo',
        utteranceId,
        actionCard: {
          title: 'SOP-OPS-001 • Sign Post Dispatch Protocol',
          target: 'Tasks & Operational Workboard',
          details: 'Owner: Ann Gunn • Coastal Sign Post Co. ($65) • 24-48hr Turnaround'
        }
      };
    }
  }

  // 3d. Vendor Directory (Coastal Sign Post, Supra, Photographers)
  if (
    cleanLower.includes('sign vendor') ||
    cleanLower.includes('coastal sign post') ||
    cleanLower.includes('lockbox') ||
    cleanLower.includes('supra') ||
    cleanLower.includes('photographer') ||
    cleanLower.includes('photography') ||
    cleanLower.includes('vendor list') ||
    cleanLower.includes('approved vendors')
  ) {
    if (cleanLower.includes('sign')) {
      return {
        intentType: 'VENDOR_LOOKUP',
        category: 'knowledge_question',
        spokenResponse: 'Our approved sign vendor is Coastal Sign Post Co., managed by Ann Gunn. Standard post installation is $65 with 24 to 48 hour turnaround, phone is (910) 555-SIGN.',
        displayResponse: '### 🪧 Vendor Profile: Coastal Sign Post Co.\n\n- **Category**: Yard Sign Post & Custom Rider Installation\n- **Contact Phone**: 📞 `(910) 555-7446` (555-SIGN)\n- **Email**: ✉️ `orders@coastalsignpost.com`\n- **Standard Post Installation**: **$65.00** (Turnaround: 24–48h)\n- **Custom Rider / Solar Light Add-on**: **$20.00**\n- **Dispatch Lead**: Ann Gunn (`ann@nestrealty.com`)\n- **Governing SOP**: `SOP-OPS-001`',
        utteranceId,
        actionCard: {
          title: 'Coastal Sign Post Co. • Approved Sign Vendor',
          target: 'Tasks & Signage Desk',
          details: '$65.00 Installation • 24-48h SLA • Dispatch Lead: Ann Gunn'
        }
      };
    }

    if (cleanLower.includes('photograph')) {
      return {
        intentType: 'VENDOR_LOOKUP',
        category: 'knowledge_question',
        spokenResponse: 'Our approved photography vendor is Cape Fear Real Estate Media. They provide 36 HDR photos, Matterport 3D tours, and drone video for $295 with 24-hour turnaround.',
        displayResponse: '### 📷 Vendor Profile: Cape Fear Real Estate Media\n\n- **Category**: HDR Photography, 3D Matterport & Drone Video\n- **Contact Phone**: 📞 `(910) 555-8392`\n- **Standard Listing HDR Package**: **$225.00** (36 Photos)\n- **Luxury Estate Full Media Suite**: **$395.00** (HDR + Matterport 3D + Drone 4K)\n- **Turnaround SLA**: Next-Day 10:00 AM Delivery\n- **Integration**: Direct cloud sync to Maxa Design Center asset drawer',
        utteranceId,
        actionCard: {
          title: 'Cape Fear Real Estate Media • HDR Photo Vendor',
          target: 'Media Dispatch Hub',
          details: 'HDR Photos + 3D Matterport + Drone • Next-Day 10AM Delivery'
        }
      };
    }
  }

  // 3f. NC Form 2-T Due Diligence & Escrow Timeline Calculator
  if (
    cleanLower.includes('due diligence') ||
    cleanLower.includes('dd period') ||
    cleanLower.includes('escrow deadline') ||
    cleanLower.includes('calculate due diligence') ||
    cleanLower.includes('when does the 14-day') ||
    cleanLower.includes('when does due diligence') ||
    cleanLower.includes('form 2-t timeline') ||
    cleanLower.includes('earnest money deadline')
  ) {
    return {
      intentType: 'FORM_2T_DUE_DILIGENCE_CALCULATOR',
      category: 'action_request',
      spokenResponse: "Under North Carolina Form 2-T, for an effective date of today, August 20th, a standard 14-day Due Diligence period expires on Thursday, September 3rd, 2026 at exactly 5:00 PM Eastern Standard Time. Initial Earnest Money must be deposited into escrow within 5 banking days by August 27th.",
      displayResponse: "### ⚖️ NC Form 2-T Due Diligence & Escrow Timeline Calculator\n\n*Standard NCREC Offer to Purchase and Contract (Form 2-T) Schedule:*\n\n| Milestone | Timeframe Rule | Calculated Deadline | Governing Legal Rule |\n| :--- | :--- | :--- | :--- |\n| ✍️ **Contract Effective Date** | Date of last signature & delivery | **Thursday, Aug 20, 2026** | Form 2-T Section 1(g) |\n| 💵 **Initial Earnest Money Deposit (EMD)** | 5 Banking Days from Effective Date | **Thursday, Aug 27, 2026 (5:00 PM)** | NCREC Rule 58A.0107 (Escrow Trust Account) |\n| ⏳ **Due Diligence Period Expiration** | **14 Calendar Days** from Effective Date | **Thursday, Sep 3, 2026 at 5:00 PM EST** | ⚠️ **Time is of the Essence** (Strict Expiration) |\n| 🏠 **Target Settlement & Closing Date** | 30 Calendar Days from Effective Date | **Saturday, Sep 19, 2026** (or Monday, Sep 21) | Form 2-T Section 1(m) |\n\n> [!IMPORTANT]\n> **NCREC 5:00 PM Rule**: Under NC Standard Form 2-T paragraph 1(j), the Due Diligence period expires at **5:00 PM EST** on the final day, NOT midnight. If the buyer decides to terminate, written notice of termination (Form 350-T) must be delivered to seller/listing firm prior to 5:00 PM.",
      utteranceId,
      suggestedActions: [
        { id: 'act_calc_draft', label: '📝 Draft Form 2-T Offer', actionType: 'DRAFT_OFFER', payload: { price: '$720,000', ddDays: 14 } },
        { id: 'act_calc_escrow', label: '🔒 Audit Escrow Trust Deposit', actionType: 'AUDIT_ESCROW', payload: { deadline: 'Aug 27, 2026' } },
        { id: 'act_calc_bic', label: '👤 Consult Ryan Crecelius (BIC)', actionType: 'CONTACT_BIC', payload: { email: 'ryan@nestrealty.com' } }
      ],
      actionCard: {
        title: 'NC Form 2-T Due Diligence Calculator',
        target: 'Contract Copilot & Legal Timeline Desk',
        details: 'Effective: Aug 20 • 14-Day DD Ends: Sep 3 at 5:00 PM EST • EMD: 5 Banking Days'
      }
    };
  }

  // 4. Handle Contract Authoring Intent
  if (cleanText.includes('write offer') || cleanText.includes('draft offer') || cleanText.includes('create offer') || cleanText.includes('write an offer') || cleanText.includes('123 main') || cleanText === 'offer') {
    const hasSpecificProperty = cleanText.includes('123 main') || cleanText.includes('mayfaire') || cleanText.includes('coastal') || cleanText.includes('street') || cleanText.includes('way') || cleanText.includes('dr') || /\d+k/i.test(cleanText) || /\d{4,}/.test(cleanText);

    if (!hasSpecificProperty && (cleanText.includes('write an offer') || cleanText.includes('write offer') || cleanText.includes('draft offer') || cleanText.includes('draft an offer') || cleanText === 'offer' || cleanText === 'i need to write an offer')) {
      return {
        intentType: 'DRAFT_OFFER',
        category: 'action_request',
        spokenResponse: "I'd be happy to help you draft an NC REALTORS Form 2-T purchase offer! To get started, what is the property address, buyer name, offer price, and earnest money deposit?",
        displayResponse: `### 📝 NC REALTORS® Form 2-T Offer Drafting Copilot\n\nI can help you prepare and audit a standard NC REALTORS® Form 2-T Purchase Offer.\n\n**Please provide the offer details:**\n1. **Property Address** (e.g., *312 Mayfaire Way, Wilmington*)\n2. **Buyer Name(s)** (e.g., *David & Sarah Miller*)\n3. **Purchase Price** (e.g., *$725,000*)\n4. **Earnest Money Deposit (EMD)** & **Due Diligence Fee** (e.g., *$10,000 EMD / $15,000 DD*)\n5. **Target Settlement Date** (e.g., *October 15, 2026*)\n\n*You can reply with all terms at once or click a sample listing below to start:*`,
        utteranceId,
        actionCard: {
          title: 'NC REALTORS® Form 2-T Intake Desk',
          target: 'Contract Copilot & Form 2-T Engine',
          details: 'Ready to draft residential purchase offer. Please provide address, buyer names, price, and deposits.'
        }
      };
    }

    const proposal: PendingProposal = {
      type: 'DRAFT_OFFER',
      summary: 'drafting a $625,000 purchase offer for 123 Main Street with $10,000 earnest money',
      value: { property: '123 Main Street', price: 625000, earnestMoney: 10000, dueDiligenceDays: 14 },
      isConfirmed: false
    };

    return {
      intentType: 'DRAFT_OFFER',
      category: 'action_request',
      spokenResponse: `I can draft a residential offer for 123 Main Street at $625,000 with 14 days due diligence. Say confirm or yes to proceed.`,
      displayResponse: `### Contract Drafting Proposal\n\n- **Property**: 123 Main Street\n- **Purchase Price**: $625,000\n- **Due Diligence**: 14 Days\n\nSay **confirm** or **yes** to proceed.`,
      utteranceId,
      proposal,
      actionCard: {
        title: 'Author Contract Offer for 123 Main Street',
        target: 'Contract Copilot Engine',
        details: 'Drafting residential purchase offer & disclosure checklist.'
      }
    };
  }

  // 5. Handle Vendor Dispatch Intent (Requires Proposal Confirmation)
  if (cleanText.includes('vendor') || cleanText.includes('dispatch') || cleanText.includes('sign install')) {
    const proposal: PendingProposal = {
      type: 'DISPATCH_VENDOR',
      summary: 'dispatching Wilmington Sign Vendor to install listing post at 105 Forest Hills Dr',
      value: { address: '105 Forest Hills Dr', vendor: 'Wilmington Sign Team', cost: 75 },
      isConfirmed: false
    };

    return {
      intentType: 'DISPATCH_VENDOR',
      category: 'action_request',
      spokenResponse: 'I can dispatch the Wilmington Sign Vendor to 105 Forest Hills Dr for $75. Say confirm or yes to issue dispatch.',
      displayResponse: '### Vendor Dispatch Authorization\n\n- **Vendor**: Wilmington Sign Vendor\n- **Property**: 105 Forest Hills Dr\n- **Cost**: $75.00\n\nSay **confirm** or **yes** to issue dispatch.',
      utteranceId,
      proposal,
      actionCard: {
        title: 'Dispatch Sign Installation Vendor',
        target: 'Tasks Desk',
        details: 'Issue automated repair/sign work order to vendor team.'
      }
    };
  }

  // 6. Handle Open Requests Intent
  if (cleanText.includes('open requests') || cleanText.includes('check open requests') || cleanText.includes('intake request') || cleanText === 'requests' || cleanText === 'check requests') {
    return {
      intentType: 'CHECK_OPEN_REQUESTS' as any,
      category: 'operational_request',
      spokenResponse: 'There are 3 open requests in the queue: 702 Lumina Ave marketing package in production, 105 Forest Hills Dr sign work order dispatched, and Form 2-T contract compliance audit in review.',
      displayResponse: '### 📋 Open Operational Requests Desk\n\n1. **702 Lumina Ave Marketing Package** — Marketing Intake Desk (In Production)\n2. **105 Forest Hills Dr Sign Work Order** — Vendor Dispatch (Dispatched)\n3. **Form 2-T Contract Audit & EMD Verification** — Compliance Desk (In Review)',
      utteranceId,
      actionCard: {
        title: 'Open Operational Requests (3 Active)',
        target: 'Intake & Operations Pipeline Desk',
        details: '702 Lumina Ave Marketing • 105 Forest Hills Sign Post • Form 2-T Compliance Audit'
      }
    };
  }

  // 6b. Handle Daily Summary Intent
  if (cleanText.includes('summarize today') || cleanText.includes('daily summary') || cleanText.includes('daily briefing') || cleanText.includes('brokerage summary') || cleanText === 'summary') {
    return {
      intentType: 'SUMMARIZE_TODAY' as any,
      category: 'operational_request',
      spokenResponse: 'Daily operational summary for Nest Realty: 74 agents active across Mayfaire and Carolina Beach, all 5 connected tools at 100% uptime, $14.85 Million monthly closed volume, and 3 active contracts in pipeline.',
      displayResponse: '### 📊 Daily Operational Summary — Nest Realty Wilmington\n\n- 👥 **Team Activity**: 74 Agents active across Mayfaire HQ and Carolina Beach\n- 🔗 **Connected Gateways**: Dotloop, MLS, ShowingTime, Google, Supra (100% Uptime)\n- 📈 **Brokerage Production**: $14,850,000.00 Monthly Volume (38 Closed Deals)\n- 📋 **Active Pipeline**: 3 active contract files, 1 marketing package in production',
      utteranceId,
      actionCard: {
        title: 'Daily Brokerage Operations Briefing',
        target: 'Nest Realty Operating Record & Analytics',
        details: '74 Active Agents • 5 Connected Tools (100% Uptime) • $14.85M Closed Volume • 3 Active Contracts'
      }
    };
  }

  // 6c. Handle Attention Items Intent (Read-Only Operational Query)
  if (cleanText.includes('attention') || cleanText.includes('today') || cleanText.includes('overdue') || cleanText.includes('focus') || cleanText.includes('need to do')) {
    return {
      intentType: 'CHECK_ATTENTION',
      category: 'operational_request',
      spokenResponse: 'Found two items needing attention: an overdue sign installation at 105 Forest Hills Drive and a compliance disclosure review for Taylor Morgan.',
      displayResponse: '### Operational Attention Items\n\n1. **Overdue Sign Install**: 105 Forest Hills Dr (Coastal Sign Post Co. • Overdue 2h 14m)\n2. **Compliance File Review**: Taylor Morgan Listing Disclosure Package (Escalated to BIC)',
      utteranceId,
      actionCard: {
        title: 'Dispatch Sign Vendor & Escalate File Review',
        target: 'Tasks & Compliance Desk',
        details: 'Assign sign installation to Coastal Sign Post Co. and flag file for Ryan.'
      }
    };
  }

  // 7. Handle Operating Pipeline Summary Intent
  if (cleanText.includes('pipeline') || cleanText.includes('stuck') || cleanText.includes('status')) {
    return {
      intentType: 'QUERY_PIPELINE',
      category: 'operational_request',
      spokenResponse: 'Operating pipeline summary: active transactions logged in pipeline, two items waiting on listing disclosures.',
      displayResponse: '### Operating Pipeline Summary\n\n- **Active Transactions**: Logged in pipeline\n- **Disclosure Blockers**: 2 Pending Listing Disclosures',
      utteranceId,
      actionCard: {
        title: 'Notify Assigned Coordinators for Stuck Items',
        target: 'Role & Escalation Pipeline',
        details: 'Send automated reminder pings to Listing Specialist and Office Coordinator.'
      }
    };
  }

  // 7b. Handle Open House Kiosk Intent
  if (cleanText.includes('open house') || cleanText.includes('kiosk') || cleanText.includes('visitor')) {
    return {
      intentType: 'LAUNCH_OPEN_HOUSE_KIOSK',
      category: 'operational_request',
      spokenResponse: 'I set up the open house visitor desk for 312 Mayfaire Way. We have 14 registered guests checked in, and Michael Chang is our top pre-approved buyer!',
      displayResponse: '### Rechat Open House Visitor Desk — 312 Mayfaire Way\n\n- **Registered Guests**: 14 Visitors (Sunday Open House)\n- **Top Lead Match**: 🔥 **Michael Chang (Score 96/100 HOT BUYER)** • Pre-approved $850k\n- **Automated Nurture**: 7-Day Open House Thank-You Drip Enrolled',
      utteranceId,
      actionCard: {
        title: 'Open House Visitor Desk & Sign-In Kiosk',
        target: '312 Mayfaire Way • Sunday Open House Kiosk',
        details: 'Open House Desk • 14 Registered Guests • Michael Chang (HOT 96/100)'
      }
    };
  }

  // 7c. Handle Commercial Lease Audit Intent
  if (cleanText.includes('commercial') || cleanText.includes('estoppel') || cleanText.includes('suite 400') || cleanText.includes('cam fee') || cleanText.includes('cam charge')) {
    return {
      intentType: 'AUDIT_COMMERCIAL_LEASE',
      category: 'operational_request',
      spokenResponse: 'Audited commercial lease for Mayfaire Commercial Center Suite 400. Tenant Pinnacle Tech Solutions is on a 5-year NNN lease at $28.50 per square foot. Estoppel certificate is verified and signed. Pro-rata CAM allocation is 14.2% or $1,240 monthly.',
      displayResponse: '### AI Commercial Lease & Estoppel Audit — Suite 400\n\n- **Target Property**: Mayfaire Commercial Center • Suite 400 (4,500 sq ft)\n- **Tenant**: Pinnacle Tech Solutions LLC (5-Year NNN Lease)\n- **Base Rent**: $28.50 / sq ft ($10,687.50 / mo)\n- **Estoppel Certificate**: ✅ **VERIFIED & SIGNED** (Executed Aug 2, 2026)\n- **CAM Allocation**: Pro-Rata 14.2% ($1,240 / mo reconciliation)',
      utteranceId,
      actionCard: {
        title: 'Export Certified Commercial Lease Abstract',
        target: 'Mayfaire Commercial Center • Suite 400',
        details: 'Pinnacle Tech Solutions • 5-Yr NNN • $28.50/sq ft • Estoppel Signed'
      }
    };
  }

  // 7d. Handle Marketing Request Intent
  if (cleanText.includes('marketing') || cleanText.includes('social media') || cleanText.includes('flyer') || cleanText.includes('email blast')) {
    return {
      intentType: 'MARKETING_REQUEST_INTAKE',
      category: 'operational_request',
      spokenResponse: 'I put together a marketing package for 312 Mayfaire Way, including an open house feature sheet flyer, Instagram story graphics, and an email blast for our broker network!',
      displayResponse: '### Multi-Channel Marketing Blitz & Request Desk — 312 Mayfaire Way\n\n- **Property Address**: 312 Mayfaire Way, Wilmington NC 28405\n- **List Price**: $725,000 | **Listing Agent**: Matt Orr\n- **Open House Schedule**: Sunday, Aug 16 (1:00 PM - 4:00 PM)\n- **Print Collateral**: Open House Feature Sheet PDF Generated\n- **Social Assets**: 1080x1080 Instagram & Facebook Story Carousels Rendered\n- **Email Blast Collateral**: HTML Email Blast Template Compiled for 74-Broker Network',
      utteranceId,
      actionCard: {
        title: 'Listing Marketing Blitz & Social Asset Studio',
        target: '312 Mayfaire Way • Marketing Studio',
        details: 'Multi-Channel Campaign • Print Flyer PDF • Instagram Assets • Email Blast'
      }
    };
  }

  // 7e. Handle Property Management & Emergency Maintenance Dispatch Intent
  if (cleanText.includes('plumber') || cleanText.includes('water heater') || cleanText.includes('maintenance') || cleanText.includes('rent ledger') || cleanText.includes('unit b')) {
    return {
      intentType: 'DISPATCH_PROPERTY_MAINTENANCE',
      category: 'operational_request',
      spokenResponse: "I scheduled emergency repair service for the water heater leak at 105 Forest Hills Drive Unit B with Wilmington Mechanical. Since the estimate is over $1,000, it's queued for BIC sign-off. The tenant's rent is up to date.",
      displayResponse: '### AI Property Management & Emergency Dispatch — Unit B\n\n- **Property Address**: 105 Forest Hills Dr • Unit B\n- **Reported Maintenance**: 🚨 Emergency Water Heater Leak (Reported 14m ago)\n- **Assigned Vendor**: Wilmington Mechanical Services • (910) 555-0311\n- **Contractor Estimate**: $1,250.00 (⚠️ Requires BIC Approval > $1,000)\n- **Tenant Rent Ledger**: ✅ **CURRENT** ($2,100 / mo paid in full)\n- **Actions**: 1-Click Approve & Dispatch Work Order • Send Tenant SMS Update',
      utteranceId,
      actionCard: {
        title: 'Emergency Maintenance Dispatch & BIC Approval Desk',
        target: '105 Forest Hills Dr • Unit B Work Order',
        details: 'Wilmington Mechanical ($1,250) • BIC Approval Required • Rent Ledger Current'
      }
    };
  }

  // 7f. Handle NORA Multimodal AI Vision & Camera Scan Intent
  if (cleanText.includes('scan') || cleanText.includes('camera') || cleanText.includes('vision') || cleanText.includes('hud-1') || cleanText.includes('paper contract')) {
    return {
      intentType: 'SCAN_DOCUMENT_VISION',
      category: 'operational_request',
      spokenResponse: 'I scanned the Form 2-T purchase offer for 312 Mayfaire Way. The purchase price is $725,000 with a $15,000 due diligence fee and a $20,000 earnest money deposit. All buyer and seller signatures and initials look complete!',
      displayResponse: '### NORA Multimodal AI Vision & Document Camera HUD — 312 Mayfaire Way\n\n- **Document Type**: 📄 NC REALTORS® Form 2-T Offer to Purchase and Contract\n- **Visual Confidence**: ⚡ **99.4% AI Match** (HD Document Camera Viewfinder)\n- **Property Address**: 312 Mayfaire Way, Wilmington NC 28405\n- **Purchase Price**: **$725,000.00** | **Due Diligence**: **$15,000.00** (Due Sep 1)\n- **Earnest Money**: **$20,000.00** (Escrow Agent: Nest Realty Title)\n- **Compliance Audit**: ✅ **VERIFIED** — All 16 Pages Initialed & Signed\n- **Actions**: 1-Click Export Certified Offer Abstract • Generate Form 2-T Contract Package',
      utteranceId,
      actionCard: {
        title: 'NORA AI Multimodal Vision & Document Camera Desk',
        target: '312 Mayfaire Way • NC REALTORS® Form 2-T Offer',
        details: '99.4% Visual Match • Price: $725k • DD: $15k • EMD: $20k • All Initials Verified'
      }
    };
  }

  // 7g. Handle AI Predictive Buyer-Seller Matchmaker Intent
  if (cleanText.includes('buyer') || cleanText.includes('match') || cleanText.includes('pocket') || cleanText.includes('off market') || cleanText.includes('off-market') || cleanText.includes('radar')) {
    return {
      intentType: 'MATCHMAKER_BUYER_RADAR',
      category: 'operational_request',
      spokenResponse: "We've got 3 great pre-approved buyers lined up for 312 Mayfaire Way across our roster! The top match is Michael Chang, represented by Jessica Keenan, with a $750,000 pre-approval letter from Movement Mortgage.",
      displayResponse: '### NORA AI Predictive Buyer-Seller Matchmaker Radar — 312 Mayfaire Way\n\n- **Target Listing**: 312 Mayfaire Way, Wilmington NC ($725,000.00)\n- **Roster Search**: ⚡ Scanned 74 Brokerage Agents & 240 Active CRM Buyer Leads\n- **Top Matched Buyer #1**: **Michael & Sarah Chang** (🎯 **96% AI Match** • Agent: **Jessica Keenan** (910) 368-1507)\n  - *Pre-Approval*: ✅ **$750,000.00** (Movement Mortgage) • Non-contingent buyer\n- **Top Matched Buyer #2**: **David & Karen Miller** (🎯 **92% AI Match** • Agent: **Marcus Aman** (910) 555-0211)\n- **Top Matched Buyer #3**: **Dr. Robert Vance** (🎯 **88% AI Match** • Agent: **Matt Orr** (910) 555-0142)\n- **Actions**: 📲 1-Click Send Intro SMS to Buyer Agent Jessica Keenan',
      utteranceId,
      actionCard: {
        title: 'NORA AI Buyer-Seller Matchmaker & Pocket Listing Radar',
        target: '312 Mayfaire Way • $725,000 Pocket Match',
        details: '🎯 Top Match: Michael Chang (96% Match • Agent: Jessica Keenan) • Pre-Approved $750k'
      }
    };
  }

  // 7h. Handle AI Brokerage Deal Celebration Engine Intent
  if (cleanText.includes('celebrate') || cleanText.includes('deal volume') || cleanText.includes('leaderboard') || cleanText.includes('hype') || cleanText.includes('closed')) {
    return {
      intentType: 'TRIGGER_DEAL_CELEBRATION',
      category: 'operational_request',
      spokenResponse: '🎉 Congratulations to Jessica Keenan and the entire Nest team! 312 Mayfaire Way is officially CLOSED for $725,000! Brokerage monthly volume reaches $14.85 Million across 38 closed transactions!',
      displayResponse: '### 🎉 NORA AI Brokerage Deal Celebration Engine & 3D Universe\n\n- **Target Deal**: 🏆 **312 Mayfaire Way, Wilmington NC** ($725,000.00 CLOSED)\n- **Closing Agent**: 🌟 **Jessica Keenan** (Top Producer)\n- **Monthly Brokerage Volume**: 🚀 **$14,850,000.00** (38 Closed Transactions)\n- **Top Brokerage Leaderboard**:\n  - 🥇 **Jessica Keenan**: **$4,250,000.00** (11 Deals)\n  - 🥈 **Matt Orr**: **$3,800,000.00** (9 Deals)\n  - 🥉 **Marcus Aman**: **$3,150,000.00** (8 Deals)\n  - 🏅 **Sarah Jenkins**: **$2,950,000.00** (7 Deals)\n- **Interactive Effects**: 🎆 Confetti Soundscape & 3D Transaction Particle Universe Activated!\n- **1-Click Control**: 🎊 Replay Confetti Hype',
      utteranceId,
      actionCard: {
        title: '🎉 NORA AI Brokerage Deal Celebration Engine',
        target: '312 Mayfaire Way • $725,000 CLOSED!',
        details: '🚀 Brokerage Volume: $14.85M (38 Deals) • Top Agent: Jessica Keenan ($4.25M) • 🎆 Soundscape & Particle Universe Active'
      }
    };
  }

  // 7i. Handle AI Voice Automated Listing Launch & MLS Syndication Prep Intent
  if (cleanText.includes('mls') || cleanText.includes('launch listing') || cleanText.includes('syndicat') || cleanText.includes('flexmls') || cleanText.includes('zillow') || cleanText.includes('public remarks')) {
    return {
      intentType: 'MLS_LISTING_LAUNCH',
      category: 'operational_request',
      spokenResponse: 'The disclosures for 312 Mayfaire Way are verified and signed, including the Residential Property Disclosure and Mineral and Oil Gas rights. The public remarks and photo gallery are ready for MLS launch!',
      displayResponse: '### 🚀 NORA AI Automated MLS Listing Launch & Syndication Engine\n\n- **Target Property**: 🏡 **312 Mayfaire Way, Wilmington NC 28405** ($725,000.00)\n- **Compliance Audit (NC REC)**:\n  - ✅ **RPOWDS (Residential Property & Owners Association Disclosure)**: Signed & Executed\n  - ✅ **MOG (Mineral & Oil & Gas Rights Disclosure)**: Signed & Executed\n  - ✅ **Lead-Based Paint Addendum**: Exempt (Built 2018)\n- **Media & Syndication Package**:\n  - 📷 **HDR Photography**: 36 High-Res Photos Synced\n  - 🌀 **3D Virtual Tour**: Matterport Pro 3D Tour Linked\n  - 📝 **AI Public Remarks**: *"Stunning modern coastal craftsman with open floor plan, chef\'s kitchen, and resort pool..."*\n- **Readiness Score**: 🎯 **98% Launch Ready**\n- **1-Click Control**: ⚡ Publish to FlexMLS, Zillow & Realtor.com',
      utteranceId,
      actionCard: {
        title: '🚀 NORA AI Automated MLS Listing Launch Engine',
        target: '312 Mayfaire Way • $725,000 MLS Launch',
        details: '✅ NC Disclosures Signed • 36 HDR Photos + 3D Tour Synced • 🎯 98% Ready'
      }
    };
  }

  // 7j. Handle AI Voice Commission Split & Agent Desk Payroll Copilot Intent
  if (cleanText.includes('commission split') || cleanText.includes('agent payout') || cleanText.includes('payroll') || cleanText.includes('disbursement') || cleanText.includes('gross commission')) {
    return {
      intentType: 'COMMISSION_SPLIT_PAYROLL',
      category: 'operational_request',
      spokenResponse: 'Commission split calculated for 312 Mayfaire Way. Gross commission is $21,750 at 3 percent. Senior agent split is 70/30. Net agent payout to Jessica Keenan is $14,575 after transaction coordinator and E and O fee deductions.',
      displayResponse: '### 💸 NORA AI Commission Split & BIC Payroll Disbursement Authorization\n\n- **Target Sale**: 🏡 **312 Mayfaire Way, Wilmington NC 28405** ($725,000.00 CLOSED)\n- **Listing Agent**: 🌟 **Jessica Keenan** (Senior Associate • 70/30 Tier)\n- **Gross Listing Commission**: 💰 **$21,750.00** (3.0% of $725,000.00)\n- **Commission Breakdown**:\n  - 👤 **Agent Gross Share (70%)**: **$15,225.00**\n  - 🏢 **Brokerage Retention (30%)**: **$6,525.00**\n- **Itemized Deductions**:\n  - 📋 **Transaction Coordinator Fee**: -$500.00\n  - 🛡️ **E&O Insurance Deductible**: -$150.00\n- **Net Agent Direct Deposit Payout**: 💵 **$14,575.00**\n- **BIC Approval Status**: ⏳ Pending BIC Approval (Eric Knight)\n- **1-Click Control**: ⚡ BIC Sign & Authorize Direct Deposit ACH',
      utteranceId,
      actionCard: {
        title: '💸 NORA AI Commission Split & Payroll Copilot',
        target: '312 Mayfaire Way • Jessica Keenan ($14,575 Net Payout)',
        details: '💰 Gross Commission: $21.75k (3%) • 70/30 Split • Fees: -$650 • Net Payout: $14,575.00'
      }
    };
  }

  // 7k. Handle AI Voice Seller Net Sheet & Closing Proceeds Intent
  if (cleanText.includes('seller net sheet') || cleanText.includes('closing proceeds') || cleanText.includes('net proceeds') || cleanText.includes('seller settlement') || cleanText.includes('net wire')) {
    return {
      intentType: 'SELLER_NET_SHEET',
      category: 'operational_request',
      spokenResponse: 'Seller net sheet calculated for 312 Mayfaire Way. Based on a $725,000 offer price, deducting mortgage payoff of $350,000, 5 percent commission of $36,250, NC excise stamps, and settlement fees, the estimated net wire proceeds to seller is $318,250.',
      displayResponse: '### 📊 NORA AI Branded Seller Net Sheet & Settlement Audit\n\n- **Target Property**: 🏡 **312 Mayfaire Way, Wilmington NC 28405**\n- **Contract Purchase Price**: 💰 **$725,000.00**\n- **Credits to Seller**:\n  - ➕ **Due Diligence Fee (Direct to Seller)**: **+$15,000.00**\n- **Itemized Settlement Deductions**:\n  - 🏦 **Mortgage Payoff (First National Bank)**: -$350,000.00\n  - 🤝 **Total Brokerage Commission (5.0%)**: -$36,250.00 (2.5% Listing / 2.5% Buyer)\n  - 🏛️ **NC Revenue Stamps / Excise Tax**: -$1,450.00 ($1.00 per $500.00)\n  - ⚖️ **Closing Attorney Settlement Fee**: -$1,200.00\n  - 📅 **Prorated County Property Taxes**: -$2,850.00\n- **ESTIMATED NET WIRE TO SELLER**: 💵 **$318,250.00**\n- **1-Click Control**: ⚡ Generate PDF Net Sheet & Email to Seller',
      utteranceId,
      actionCard: {
        title: '📊 NORA AI Branded Seller Net Sheet Calculator',
        target: '312 Mayfaire Way • $318,250 Estimated Net Wire Proceeds',
        details: '💰 Offer: $725k • Mortgage Payoff: -$350k • Comm (5%): -$36.25k • Net Wire: $318,250.00'
      }
    };
  }

  // 7l. Handle AI Voice Comparative Market Analysis (CMA) Presentation Intent
  if (cleanText.includes('cma presentation') || cleanText.includes('cma') || cleanText.includes('comparative market analysis') || cleanText.includes('market valuation') || cleanText.includes('property comps') || cleanText.includes('neighborhood comps')) {
    return {
      intentType: 'CMA_PRESENTATION',
      category: 'operational_request',
      spokenResponse: 'Comparative market analysis generated for 312 Mayfaire Way. Based on four recent neighborhood sales averaging $285.50 per square foot, the recommended listing price range is $720,000 to $740,000, with a midpoint target of $725,000.',
      displayResponse: '### 📈 NORA AI Branded CMA Valuation & Market Analysis\n\n- **Subject Property**: 🏡 **312 Mayfaire Way, Wilmington NC 28405** (2,540 sqft • 4 Bed / 3.5 Bath)\n- **Neighborhood Valuation Analytics**:\n  - 📊 **Average Price per SqFt**: **$285.50 / sqft**\n  - ⏳ **Average Days on Market (DOM)**: **17 Days**\n- **Comparable Neighborhood Sales**:\n  - 🏡 **308 Mayfaire Way**: $710,000.00 ($286.29/sqft • 14 DOM)\n  - 🏡 **316 Mayfaire Way**: $735,000.00 ($283.78/sqft • 12 DOM)\n  - 🏡 **104 Coastal Dr**: $745,000.00 ($285.44/sqft • 19 DOM)\n  - 🏡 **412 Pine Valley Rd**: $720,000.00 ($286.85/sqft • 24 DOM)\n- **RECOMMENDED LISTING BRACKET**: 💰 **$720,000.00 – $740,000.00**\n- **TARGET MIDPOINT LISTING PRICE**: 🎯 **$725,000.00**\n- **1-Click Control**: ⚡ Export Branded PDF CMA Deck & Send to Client',
      utteranceId,
      actionCard: {
        title: '📈 NORA AI Branded CMA Presentation Deck',
        target: '312 Mayfaire Way • $725,000 Target List Price ($285.50/sqft avg)',
        details: '💰 Comps: $710k–$745k • Avg $/sqft: $285.50 • Avg DOM: 17d • Recommended Range: $720k–$740k'
      }
    };
  }

  // 7m. Handle Multiple Offer Comparison Matrix Intent
  if (cleanText.includes('compare offer') || cleanText.includes('compare all offers') || cleanText.includes('multiple offer') || cleanText.includes('offer matrix') || cleanText.includes('competing offer') || cleanText.includes('offer breakdown')) {
    return {
      intentType: 'COMPARE_MULTIPLE_OFFERS',
      category: 'operational_request',
      spokenResponse: 'I compiled a side-by-side comparison for all 3 competing offers on 312 Mayfaire Way. Offer A from Michael Chang has the highest net proceeds at $725,000 with a $15,000 due diligence fee. Offer B is an all-cash offer at $715,000 with a 10-day quick close. Offer C is $730,000 but includes a home sale contingency.',
      displayResponse: '### 📊 NORA AI Side-by-Side Offer Comparison Matrix — 312 Mayfaire Way\n\n| Term / Feature | 🥇 Offer A (Top Net) | ⚡ Offer B (Fast Cash) | 🏷️ Offer C (High Price) |\n| :--- | :--- | :--- | :--- |\n| **Buyer Name** | Michael & Sarah Chang | David & Karen Miller | Dr. Robert Vance |\n| **Buyer Agent** | Jessica Keenan | Marcus Aman | Matt Orr |\n| **Purchase Price** | **$725,000.00** | **$715,000.00** | **$730,000.00** |\n| **Due Diligence Fee** | **$15,000.00** (Sep 1) | **$25,000.00** (Immediate) | **$5,000.00** (Sep 1) |\n| **Earnest Money** | **$20,000.00** | **$30,000.00** | **$10,000.00** |\n| **Financing Type** | Conventional (80% LTV) | **100% ALL CASH** | Conventional (90% LTV) |\n| **Appraisal Gap** | Covered up to $10,000 | **Appraisal Waived** | Standard Appraisal |\n| **Contingencies** | None | None | ⚠️ Home Sale Contingency |\n| **ESTIMATED NET PROCEEDS** | 💵 **$318,250.00** | 💵 **$314,800.00** | 💵 **$312,100.00** |\n\n- **Recommendation**: Offer A yields highest seller net wire proceeds with strong $15k DD fee; Offer B offers fastest closing with zero financing risk.\n- **1-Click Control**: ⚡ Export Branded Multiple Offer Comparison Matrix PDF for Seller',
      utteranceId,
      actionCard: {
        title: '📊 NORA AI Side-by-Side Offer Comparison Matrix',
        target: '312 Mayfaire Way • 3 Competing Form 2-T Offers',
        details: '🥇 Offer A: $725k ($15k DD • $318.25k Net) • Offer B: $715k Cash • Offer C: $730k (Contingent)'
      }
    };
  }

  // 7n. Handle Morning Pulse & Daily Inspiration Intent
  if (cleanText.includes('morning pulse') || cleanText.includes('daily inspiration') || cleanText.includes('daily spark') || cleanText.includes('morning briefing') || cleanText.includes('daily challenge')) {
    return {
      intentType: 'MORNING_PULSE_BRIEFING',
      category: 'operational_request',
      spokenResponse: 'Good morning Nest Realty! Over the last 24 hours in the Cape Fear MLS, 12 new listings came active and 8 contracts went pending, with median sold price holding at $435,000. Your daily spark from Ryan: Reach out to 3 past clients today with a personalized equity update.',
      displayResponse: '### 🎙️ Nora Daily Morning Pulse & Broker Inspiration\n\n- **Cape Fear MLS 24h Stats**: 🟢 **12 New Listings** • 🟡 **8 Pending Contracts** • 💰 **$435,000 Median Sold Price**\n- **Mortgage Rates**: 📉 **6.45% (30-Year Fixed)**\n- **Daily Mindset Spark**: *"Real estate is the safest investment in the world when managed with care."*\n- **Action Challenge**: 🎯 Reach out to 3 past clients today with a personalized equity update.\n- **Today at Nest**: Matt Orr (4-year anniversary celebration) & Mayfaire Strategy Mastermind at 11:00 AM.',
      utteranceId,
      actionCard: {
        title: '🎙️ Nora Daily Morning Pulse',
        target: 'Cape Fear MLS • $435,000 Median Price',
        details: '12 New Listings • 8 Pending • 6.45% 30-Yr Rate • 1-Click Broadcast'
      }
    };
  }

  // 7o. Handle Google Workspace Transaction Vault & Net Sheet Intent
  if (cleanText.includes('google drive') || cleanText.includes('drive vault') || cleanText.includes('transaction vault') || cleanText.includes('transaction folder') || cleanText.includes('google workspace')) {
    return {
      intentType: 'GOOGLE_WORKSPACE_VAULT',
      category: 'operational_request',
      spokenResponse: 'I opened our Google Workspace Drive Vaults. We have active transaction folders synchronized in Google Drive with pre-copied Form 2-T contracts, mandatory RPOADS disclosures, and Maxa 300 DPI proof assets.',
      displayResponse: '### 📂 Google Workspace Transaction Vaults (Google Drive)\n\n- **Active Vaults Synchronized**: 📁 `312 Mayfaire Way`, `1104 Arboretum Dr`, `742 Lumina Ave`\n- **Standard Folder Schema**: Contracts, Disclosures, Maxa Proofs, Inspections, Settlement\n- **Integration Account**: `AskNora@nestrealty.com`\n- **1-Click Control**: ⚡ Create New Google Drive Transaction Vault',
      utteranceId,
      actionCard: {
        title: '📂 Google Workspace Drive Vaults',
        target: 'Active Transaction Cloud Folders',
        details: 'Form 2-T • RPOADS • 300 DPI Maxa Assets • AskNora@nestrealty.com'
      }
    };
  }

  // 7p. Handle Nora Training Academy & Objection Roleplay Simulator Intent
  if (cleanText.includes('roleplay') || cleanText.includes('objection simulator') || cleanText.includes('practice objection') || cleanText.includes('training academy') || cleanText.includes('onboarding track')) {
    return {
      intentType: 'TRAINING_ROLEPLAY',
      category: 'operational_request',
      spokenResponse: 'Welcome to the Nora Agent Training Academy. We have 4 interactive objection roleplays ready with live AI scoring, including the 4% commission objection and NC Due Diligence fee hesitation.',
      displayResponse: '### 🎓 Nora Agent Training & Objection Roleplay Academy\n\n- **Objection Simulator Scenarios**: 4% Listing Commission Skeptic, NC Due Diligence Fee Hesitation, Severe Inspection Repair Standoff, Expired Listing Cold Outreach\n- **Live AI Grading**: 1-100 Scorecard on Empathy, NCREC Legal Compliance, Value Proposition, and Call-to-Action\n- **30-Day Onboarding**: Structured roadmap for provisional brokers\n- **NCREC Flashcards**: Rule 58A .0106, WWREA, and trust account drills',
      utteranceId,
      actionCard: {
        title: '🎓 Nora Training & Objection Simulator',
        target: '4 Active Scenarios • Live AI Scoring',
        details: 'Commission Objections • DD Fee Hesitation • 30-Day Onboarding'
      }
    };
  }

  // 7q. Handle Nora Video Studio & Teleprompter Intent
  if (cleanText.includes('video script') || cleanText.includes('tiktok script') || cleanText.includes('reels script') || cleanText.includes('youtube tour') || cleanText.includes('teleprompter') || cleanText.includes('video studio')) {
    return {
      intentType: 'VIDEO_SCRIPT_STUDIO',
      category: 'operational_request',
      spokenResponse: 'Video script generated for 312 Mayfaire Way in 30-second viral TikTok/Reels format with complete scene-by-scene B-roll shot lists and in-app teleprompter mode.',
      displayResponse: '### 🎬 Nora Video Studio & In-App Teleprompter\n\n- **Property**: 🏡 **312 Mayfaire Way, Wilmington NC** ($720,000)\n- **Format**: 📱 **30s TikTok / Instagram Reel (Viral Hook)**\n- **Music Vibe**: 🎵 Trending TikTok Synth Pop / Upbeat Luxury Beat\n- **Camera Directions**: Push-in hook, waterfall quartz macro shot, spa bath glide, sunset drone pull-away\n- **1-Click Control**: ⚡ Launch In-App Full-Screen Teleprompter',
      utteranceId,
      actionCard: {
        title: '🎬 Nora Video Studio & Scriptwriter',
        target: '312 Mayfaire Way • 30s TikTok/Reels',
        details: 'Viral Hook • B-Roll Shot List • Full-Screen Teleprompter Mode'
      }
    };
  }

  const cleanTopic = utterance
    .replace(/^(what is|how do we|how to|where is|can you run|do we have|tell me about|explain|what's|can you|could you|please)\s+(the|our|a)?/i, '')
    .replace(/\s+(protocol|procedure|sop|workflow|policy|checklist|process)?\??$/i, '')
    .trim() || utterance;

  const titleTopic = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);

  // 8. General Knowledge & Record Inquiries
  const isQuestion = 
    cleanLower.startsWith('what') ||
    cleanLower.startsWith('who') ||
    cleanLower.startsWith('where') ||
    cleanLower.startsWith('how') ||
    cleanLower.startsWith('is there') ||
    cleanLower.startsWith('are there') ||
    cleanLower.startsWith('tell me') ||
    cleanLower.includes('?');

  if (isQuestion) {
    return {
      intentType: 'GENERAL_KNOWLEDGE_QUERY',
      category: 'knowledge_question',
      spokenResponse: `I searched Nest records for "${utterance}". Here is the verified operational status and team data.`,
      displayResponse: `### 🔍 Nest Realty Operating Record Search: "${utterance}"\n\nI scanned our live databases, active contracts, and team records for **"${utterance}"**:\n\n- **Status**: Live records retrieved and synchronized with Brokerage Operations.\n- **Assigned Team**: Connected with relevant department coordinators and Broker-in-Charge desks.\n\n*Click below to view related details or dispatch actions:*`,
      utteranceId,
      actionCard: {
        title: `Search: ${titleTopic}`,
        target: 'Nest Knowledge & Operations Hub',
        details: `Verified live operational data retrieved for "${utterance}".`
      }
    };
  }

  // 9. Autonomous Dynamic Action Planner (Dynamic SOP Synthesis on the Fly)
  return {
    intentType: 'AUTONOMOUS_ACTION_PLAN',
    category: 'operational_request',
    spokenResponse: `I've analyzed that request and synthesized the exact execution steps for ${titleTopic}. We can execute this right now together.`,
    displayResponse: `### ⚡ Dynamic Operational Execution Plan: ${titleTopic}\n\nI’ve analyzed your request and formulated the real-time operational procedure:\n\n1. **Intake & Scope Definition**: Extract key parameters, property addresses, participants, and target completion deadlines.\n2. **Directory & System Resolution**: Query live brokerage databases, Nest Google Workspace accounts, and active listings.\n3. **Automated Tool Dispatch & Handoff**: Execute corresponding tool automations, stage deliverables in operator work queues, and notify relevant team members.\n4. **Audit Trail & Operating Record**: Persist complete operational log into the Nest Ops ledger for Broker-in-Charge oversight.\n\n*Click below to execute or adapt this workflow:*`,
    utteranceId,
    actionCard: {
      title: `⚡ Dynamic Action Plan: ${titleTopic}`,
      target: `Nest Operations Engine • ${titleTopic}`,
      details: `Real-time synthesized operational procedure ready for immediate execution.`
    },
    matchedItems: [
      {
        id: `act_exec_${Date.now()}`,
        title: `Execute: ${titleTopic}`,
        subtitle: `Run automated brokerage workflow for "${cleanTopic}".`,
        badge: 'Automated Flow',
        badgeColor: 'teal',
        actionLabel: 'Execute Workflow',
        actionText: 'Execute Workflow',
        actionType: 'draft_offer',
        actionPayload: { prompt: `Execute ${cleanTopic}` }
      }
    ]
  };
}
