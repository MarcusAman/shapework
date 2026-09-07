/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Inbound Voice Caller Gatekeeper & Directory Resolver
 * 
 * Protects brokerage operations by verifying incoming callers:
 * 1. Known Caller ID: Instant personalized recognition ("Hello Matt... how are you today?")
 * 2. Unrecognized Caller ID: Identity challenge ("I don't recognize this number — what is your first and last name?")
 * 3. Directory Verification: Fuzzy matches spoken names against the 72-Agent Directory & Leadership Roster.
 * 4. Dynamic Auto-Linking: Remembers newly verified phone numbers for future recognition.
 * 5. Permission Gating: Restricts unverified callers from ordering office supplies or accessing internal files.
 */

import { NEST_FULL_ROSTER_72 } from '../../persistence/nestRosterSeed.js';
import { BROKERAGE_KEY_STAFF } from '../../knowledge/unifiedContextRetriever.js';

export interface DirectoryCaller {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  role: string;
  office: string;
  email: string;
  primaryPhone: string;
  secondaryPhones: string[];
  isStaff: boolean;
  permissionLevel: 'FULL_BROKERAGE_OPS' | 'RESTRICTED_GUEST';
}

export interface CallerResolutionResult {
  isRecognized: boolean;
  caller: DirectoryCaller | null;
  greeting: string;
  needsNameVerification: boolean;
  suggestedPrompt?: string;
}

export interface NameVerificationResult {
  isVerified: boolean;
  caller: DirectoryCaller | null;
  confirmationMessage: string;
  phoneLinked: boolean;
}

// In-memory linked secondary phone numbers map: normalizedDigits -> agentEmail
const linkedSecondaryPhones: Map<string, string> = new Map([
  ['2527170595', 'marcus@shapework.co'],
  ['9106128283', 'matt.orr@nestrealty.com']
]);

/**
 * Normalizes phone numbers to 10 standard digits
 */
export function normalizePhoneDigits(raw: string): string {
  if (!raw) return '';
  return raw.replace(/\D/g, '').slice(-10);
}

/**
 * Normalizes names for fuzzy speech recognition
 */
export function normalizeSpokenName(name: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Name alias dictionary for common agent nicknames
 */
const NAME_ALIASES: Record<string, string[]> = {
  matt: ['matthew', 'matt'],
  matthew: ['matt', 'matthew'],
  jess: ['jessica', 'jess'],
  jessica: ['jess', 'jessica'],
  dan: ['daniel', 'dan'],
  daniel: ['dan', 'daniel'],
  chris: ['christopher', 'chris'],
  christopher: ['chris', 'christopher'],
  mike: ['michael', 'mike'],
  michael: ['mike', 'michael'],
  dave: ['david', 'dave'],
  david: ['dave', 'david'],
  rob: ['robert', 'rob', 'bob', 'bobby'],
  robert: ['rob', 'robert', 'bob', 'bobby'],
  alex: ['alexander', 'alexandra', 'alex'],
  sam: ['samuel', 'samantha', 'sam']
};

export class CallerGatekeeperService {
  /**
   * Resolves an incoming caller by caller ID phone number.
   */
  public static resolveCallerByPhone(rawPhone: string): CallerResolutionResult {
    const digits = normalizePhoneDigits(rawPhone);
    if (!digits || digits.length < 7) {
      return {
        isRecognized: false,
        caller: null,
        greeting: "Hello! Thank you for calling Ask Nest Ops. This is Nora... I don't recognize this number. What is your first and last name?",
        needsNameVerification: true,
        suggestedPrompt: "What is your first and last name?"
      };
    }

    // 1. Check linked secondary phone numbers
    const linkedEmail = linkedSecondaryPhones.get(digits);
    if (linkedEmail) {
      const matchedAgent = this.findAgentByEmail(linkedEmail);
      if (matchedAgent) {
        return {
          isRecognized: true,
          caller: matchedAgent,
          greeting: `Hello ${matchedAgent.firstName}... how are you today? This is Nora... what can I help you with?`,
          needsNameVerification: false
        };
      }
    }

    // 2. Check Key Staff Leadership (Ann, Melissa, James, BIC, Ryan)
    for (const staff of BROKERAGE_KEY_STAFF) {
      if (staff.phone && normalizePhoneDigits(staff.phone) === digits) {
        const caller = this.mapStaffToCaller(staff);
        return {
          isRecognized: true,
          caller,
          greeting: `Hello ${caller.firstName}... how are you today? This is Nora... what can I help you with?`,
          needsNameVerification: false
        };
      }
    }

    // 3. Check 72-Agent Directory
    for (const agent of NEST_FULL_ROSTER_72) {
      if (agent.phone && normalizePhoneDigits(agent.phone) === digits) {
        const caller = this.mapRosterAgentToCaller(agent);
        return {
          isRecognized: true,
          caller,
          greeting: `Hello ${caller.firstName}... how are you today? This is Nora... what can I help you with?`,
          needsNameVerification: false
        };
      }
    }

    // Unrecognized Caller ID
    return {
      isRecognized: false,
      caller: null,
      greeting: "Hello! Thank you for calling Ask Nest Ops. This is Nora... I don't recognize this number. What is your first and last name?",
      needsNameVerification: true,
      suggestedPrompt: "What is your first and last name?"
    };
  }

  /**
   * Verifies an unrecognized caller by matching their spoken first and last name against the Directory.
   * Auto-links the phone number for future instant recognition if provided.
   */
  public static resolveCallerByName(spokenName: string, callingFromPhone?: string): NameVerificationResult {
    const cleanSpoken = normalizeSpokenName(spokenName);
    if (!cleanSpoken || cleanSpoken.length < 2) {
      return {
        isVerified: false,
        caller: null,
        confirmationMessage: "I didn't catch that name. Could you please state your first and last name again?",
        phoneLinked: false
      };
    }

    const tokens = cleanSpoken.split(' ').filter(Boolean);
    const spokenFirst = tokens[0];
    const spokenLast = tokens.length > 1 ? tokens[tokens.length - 1] : '';

    // 0. Check Marcus Aman (Broker / Tech Lead)
    if (spokenFirst === 'marcus' || cleanSpoken.includes('marcus aman') || cleanSpoken === 'marcus') {
      const marcus = this.findAgentByEmail('marcus@shapework.co');
      if (marcus) {
        let phoneLinked = false;
        if (callingFromPhone) {
          this.linkPhoneNumberToAgent(marcus.email, callingFromPhone);
          phoneLinked = true;
        }
        return {
          isVerified: true,
          caller: marcus,
          confirmationMessage: `Got it, thanks ${marcus.firstName}. I've verified you as ${marcus.fullName} from ${marcus.office}. How can I help you today?`,
          phoneLinked
        };
      }
    }

    // 1. Search Key Staff
    for (const staff of BROKERAGE_KEY_STAFF) {
      const staffName = normalizeSpokenName(staff.displayName || staff.name);
      const staffTokens = staffName.split(' ');
      const sFirst = staffTokens[0];
      const sLast = staffTokens.length > 1 ? staffTokens[staffTokens.length - 1] : '';

      if (this.isNameMatch(spokenFirst, spokenLast, sFirst, sLast, staffName, cleanSpoken)) {
        const caller = this.mapStaffToCaller(staff);
        let phoneLinked = false;
        if (callingFromPhone) {
          this.linkPhoneNumberToAgent(caller.email, callingFromPhone);
          phoneLinked = true;
        }
        return {
          isVerified: true,
          caller,
          confirmationMessage: `Got it, thanks ${caller.firstName}. I've verified you as ${caller.fullName} from ${caller.office}. How can I help you today?`,
          phoneLinked
        };
      }
    }

    // 2. Search 72-Agent Directory Roster
    for (const agent of NEST_FULL_ROSTER_72) {
      const fullName = normalizeSpokenName(agent.displayName || `${agent.firstName} ${agent.lastName}`);
      const aFirst = normalizeSpokenName(agent.firstName || fullName.split(' ')[0]);
      const aLast = normalizeSpokenName(agent.lastName || fullName.split(' ').slice(1).join(' '));

      if (this.isNameMatch(spokenFirst, spokenLast, aFirst, aLast, fullName, cleanSpoken)) {
        const caller = this.mapRosterAgentToCaller(agent);
        let phoneLinked = false;
        if (callingFromPhone) {
          this.linkPhoneNumberToAgent(caller.email, callingFromPhone);
          phoneLinked = true;
        }
        return {
          isVerified: true,
          caller,
          confirmationMessage: `Got it, thanks ${caller.firstName}. I've verified you as ${caller.fullName} from ${caller.office}. How can I help you today?`,
          phoneLinked
        };
      }
    }

    // Name not found in Directory
    return {
      isVerified: false,
      caller: null,
      confirmationMessage: `Thanks for providing your name. I wasn't able to locate "${spokenName}" in the Nest Realty Directory. I'll connect your call as an external guest inquiry. What can I assist you with?`,
      phoneLinked: false
    };
  }

  /**
   * Links a new phone number to an agent's email profile for future recognition.
   */
  public static linkPhoneNumberToAgent(agentEmail: string, rawPhone: string): boolean {
    const digits = normalizePhoneDigits(rawPhone);
    if (!digits || digits.length !== 10) return false;
    linkedSecondaryPhones.set(digits, agentEmail.toLowerCase().trim());
    return true;
  }

  /**
   * Evaluates if a caller is authorized to perform internal brokerage operations.
   */
  public static evaluateCallerAuthorization(caller: DirectoryCaller | null): {
    isAuthorized: boolean;
    permissionLevel: 'FULL_BROKERAGE_OPS' | 'RESTRICTED_GUEST';
    allowedActions: string[];
    deniedActions: string[];
  } {
    if (!caller) {
      return {
        isAuthorized: false,
        permissionLevel: 'RESTRICTED_GUEST',
        allowedActions: ['general_inquiry', 'leave_message', 'ask_showing_instructions', 'connect_to_agent'],
        deniedActions: ['order_office_supplies', 'dispatch_marketing_package', 'view_commission_ledger', 'dispatch_vendor']
      };
    }

    return {
      isAuthorized: true,
      permissionLevel: 'FULL_BROKERAGE_OPS',
      allowedActions: [
        'order_office_supplies',
        'dispatch_marketing_package',
        'schedule_meeting',
        'generate_cma_slides',
        'request_sign_post',
        'access_sops'
      ],
      deniedActions: []
    };
  }

  // --- Private Helpers ---

  private static isNameMatch(
    spokenFirst: string,
    spokenLast: string,
    targetFirst: string,
    targetLast: string,
    targetFull: string,
    spokenFull: string
  ): boolean {
    if (spokenFull === targetFull) return true;

    const firstMatches = 
      spokenFirst === targetFirst ||
      (NAME_ALIASES[spokenFirst] && NAME_ALIASES[spokenFirst].includes(targetFirst)) ||
      (NAME_ALIASES[targetFirst] && NAME_ALIASES[targetFirst].includes(spokenFirst));

    if (!spokenLast) {
      // If only first name was spoken, must match targetFirst exactly and target must be unique or key staff
      return firstMatches;
    }

    const lastMatches = spokenLast === targetLast || targetLast.includes(spokenLast) || spokenLast.includes(targetLast);
    return firstMatches && lastMatches;
  }

  private static findAgentByEmail(email: string): DirectoryCaller | null {
    const cleanEmail = email.toLowerCase().trim();

    if (cleanEmail === 'marcus@shapework.co' || cleanEmail.includes('marcus.aman')) {
      return {
        id: 'staff_marcus_aman',
        fullName: 'Marcus Aman',
        firstName: 'Marcus',
        lastName: 'Aman',
        role: 'Broker / Tech Lead',
        office: 'Wilmington Mayfaire',
        email: 'marcus@shapework.co',
        primaryPhone: '(252) 717-0595',
        secondaryPhones: [],
        isStaff: true,
        permissionLevel: 'FULL_BROKERAGE_OPS'
      };
    }

    for (const staff of BROKERAGE_KEY_STAFF) {
      if (staff.email && staff.email.toLowerCase() === cleanEmail) {
        return this.mapStaffToCaller(staff);
      }
    }

    for (const agent of NEST_FULL_ROSTER_72) {
      if (agent.email && agent.email.toLowerCase() === cleanEmail) {
        return this.mapRosterAgentToCaller(agent);
      }
    }

    return null;
  }

  private static mapStaffToCaller(staff: any): DirectoryCaller {
    return {
      id: staff.id || `staff_${staff.name.toLowerCase().replace(/\s+/g, '_')}`,
      fullName: staff.displayName || staff.name,
      firstName: staff.name.split(' ')[0],
      lastName: staff.name.split(' ').slice(1).join(' '),
      role: staff.role,
      office: staff.office || 'Mayfaire HQ',
      email: staff.email,
      primaryPhone: staff.phone || '',
      secondaryPhones: [],
      isStaff: true,
      permissionLevel: 'FULL_BROKERAGE_OPS'
    };
  }

  private static mapRosterAgentToCaller(agent: any): DirectoryCaller {
    const fullName = agent.displayName || `${agent.firstName} ${agent.lastName}`;
    return {
      id: agent.id || `agt_${fullName.toLowerCase().replace(/\s+/g, '_')}`,
      fullName,
      firstName: agent.firstName || fullName.split(' ')[0],
      lastName: agent.lastName || fullName.split(' ').slice(1).join(' '),
      role: agent.role || 'Broker / REALTOR®',
      office: agent.primaryOfficeName || 'Mayfaire',
      email: agent.email || '',
      primaryPhone: agent.phone || '',
      secondaryPhones: [],
      isStaff: false,
      permissionLevel: 'FULL_BROKERAGE_OPS'
    };
  }
}
