import crypto from 'crypto';

export interface RawNestRosterRow {
  sourceMarker: string;          // column 0
  ambiguousDateOne: string;      // column 1
  sourceAccountId: string;       // column 2
  licenseOrReferenceId: string;  // column 3
  phone: string;                 // column 4
  fullName: string;              // column 5
  businessEmail: string;         // column 6
  rawRole: string;               // column 7
  rawOffice: string;             // column 8
  streetAddress: string;         // column 9
  cityStatePostal: string;       // column 10
  ambiguousDateTwo: string;      // column 11
  alternateEmail: string;        // column 12
  unused?: string;               // column 13
}

export interface NormalizedDirectoryPerson {
  id: string;
  workspaceId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  title: string;
  role: string;
  team: string;
  rawRole: string;
  rawOffice: string;
  primaryOfficeName: string;
  officeNames: string[];
  personType: 'leadership' | 'staff' | 'agent' | 'assistant' | 'contractor' | 'other';
  isBrokerInCharge: boolean;
  isTeamLeader: boolean;
  status: 'active' | 'inactive' | 'needs_review';
  communicationPreference: 'standard' | 'email_only';
  tags: string[];
  source: 'nest_rechat_roster';
  sourceParserVersion: 'nest_rechat_roster_v1';
  sourceRowKey: string;
  createdAt?: string;
  updatedAt?: string;
}

const OFFICE_ALIASES: Record<string, { primaryOfficeName: string; market: string }> = {
  "mayfaire": {
    primaryOfficeName: "Mayfaire",
    market: "Wilmington"
  },
  "wilmington": {
    primaryOfficeName: "Mayfaire",
    market: "Wilmington"
  },
  "carolina beach": {
    primaryOfficeName: "Carolina Beach",
    market: "Carolina Beach"
  },
  "hampstead": {
    primaryOfficeName: "Hampstead",
    market: "Greater Wilmington"
  },
  "home": {
    primaryOfficeName: "Remote / Home",
    market: "Remote"
  }
};

/**
 * Standardizes US phone numbers into (XXX) XXX-XXXX format.
 */
export function normalizePhone(rawPhone: string): { normalized: string; isDigitsOnly: string; needsReview: boolean } {
  const cleaned = rawPhone.trim();
  if (!cleaned) {
    return { normalized: '', isDigitsOnly: '', needsReview: false };
  }
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length === 10) {
    const formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    return { normalized: formatted, isDigitsOnly: digits, needsReview: false };
  }
  // If not 10 digits, keep original display, flag needs review
  return { normalized: cleaned, isDigitsOnly: digits, needsReview: true };
}

/**
 * Validates a basic email address structure.
 */
export function validateEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Parse full name into components while maintaining Display Name integrity.
 */
export function parseNameComponents(fullName: string): { firstName: string; middleName: string; lastName: string; displayName: string } {
  // Trim and collapse repeated spaces
  const displayName = fullName.trim().replace(/\s+/g, ' ');
  const tokens = displayName.split(' ').filter(Boolean);

  if (tokens.length === 0) {
    return { firstName: '', middleName: '', lastName: '', displayName };
  }
  if (tokens.length === 1) {
    return { firstName: tokens[0], middleName: '', lastName: '', displayName };
  }
  if (tokens.length === 2) {
    return { firstName: tokens[0], middleName: '', lastName: tokens[1], displayName };
  }

  const firstName = tokens[0];
  const lastName = tokens[tokens.length - 1];
  const middleName = tokens.slice(1, tokens.length - 1).join(' ');

  return { firstName, middleName, lastName, displayName };
}

/**
 * Parses and normalizes a single raw Nest Realty roster row.
 */
export function parseNestRechatRow(row: string[], wsId: string): NormalizedDirectoryPerson | null {
  // A candidate row must have at least 13 elements. If it is shorter, pad it with empty strings.
  const col = (idx: number): string => {
    if (idx >= row.length) return '';
    return (row[idx] || '').trim();
  };

  const fullName = col(5);
  // Row exclusions: ignore empty names, ignore section labels
  if (!fullName) return null;
  if (fullName === 'In Rechat' || fullName === 'Assistants with License') return null;

  const sourceMarker = col(0);
  const rawPhone = col(4);
  const rawEmail = col(6);
  const rawRole = col(7);
  const rawOffice = col(8);

  // 1. Name Parsing
  const { firstName, middleName, lastName, displayName } = parseNameComponents(fullName);

  // 2. Email Normalization & Validation
  let email = '';
  let emailNeedsReview = false;
  if (rawEmail) {
    const isVal = validateEmail(rawEmail);
    if (isVal) {
      email = rawEmail.toLowerCase();
    } else {
      // Invalid email: keep email empty, set needsReview warning flag
      emailNeedsReview = true;
    }
  }

  // 3. Phone Normalization
  const { normalized: phone, needsReview: phoneNeedsReview } = normalizePhone(rawPhone);

  // 4. Office Normalization
  let primaryOfficeName = 'Unknown';
  let officeNeedsReview = false;
  if (rawOffice) {
    const oLower = rawOffice.toLowerCase();
    const matched = OFFICE_ALIASES[oLower];
    if (matched) {
      primaryOfficeName = matched.primaryOfficeName;
    } else {
      // Custom/Unmapped office - preserve the text but flag for review
      primaryOfficeName = rawOffice;
      officeNeedsReview = true;
    }
  } else {
    officeNeedsReview = true;
  }

  // 5. Role and Person-Type Normalization
  let personType: NormalizedDirectoryPerson['personType'] = 'other';
  let role = '';
  let team = '';
  let isBrokerInCharge = false;
  let isTeamLeader = false;
  let roleNeedsReview = false;
  const tags: string[] = [];

  const rawRoleUpper = rawRole.toUpperCase();

  if (rawRoleUpper === 'PB') {
    personType = 'other';
    role = 'PB';
    roleNeedsReview = true;
    tags.push('role-needs-review');
  } else if (rawRoleUpper.includes('OWNER')) {
    personType = 'leadership';
    role = 'Owner / Principal Broker';
    tags.push('owner', 'leadership');
  } else if (rawRoleUpper.includes('BIC')) {
    personType = 'leadership';
    role = 'Broker-in-Charge';
    isBrokerInCharge = true;
    tags.push('broker-in-charge', 'leadership');
  } else if (rawRoleUpper.includes('ASSISTANT')) {
    personType = 'assistant';
    role = rawRole; // Preserve original assistant name/role
  } else if (rawRoleUpper.includes('LEADER') || rawRoleUpper.includes('TEAM')) {
    personType = 'agent';
    isTeamLeader = true;
    role = rawRole;
    // Extract team name if it contains a hyphen, colon, or matches leader pattern
    const sep = rawRole.indexOf('-') !== -1 ? '-' : (rawRole.indexOf(':') !== -1 ? ':' : '');
    if (sep) {
      team = rawRole.split(sep)[0].trim();
    } else if (rawRoleUpper.endsWith('LEADER') || rawRoleUpper.startsWith('LEADER')) {
      team = rawRole.replace(/Leader|leader|LEADER/g, '').trim();
    } else {
      team = rawRole;
    }
  } else if (rawRoleUpper.includes('BROKER') || rawRoleUpper.includes('REFERRAL BASED AGENT')) {
    personType = 'agent';
    role = rawRole;
    // Handle teams for brokers, e.g. "Broker - Costin Real Estate"
    const sep = rawRole.indexOf('-') !== -1 ? '-' : '';
    if (sep) {
      team = rawRole.split(sep)[1].trim();
    }
  } else if (rawRoleUpper.includes('ADMIN') || rawRoleUpper.includes('OPERATIONS') || rawRoleUpper.includes('FINANCE') || rawRoleUpper.includes('MARKETING') || rawRoleUpper.includes('COAST TO CLOSE') || rawRoleUpper.includes('DEBBIE L. TEAM')) {
    personType = 'staff';
    role = rawRole;
  } else if (!rawRole) {
    personType = 'other';
    roleNeedsReview = true;
    tags.push('role-needs-review');
  } else {
    // Unclassified role
    personType = 'other';
    role = rawRole;
    roleNeedsReview = true;
    tags.push('role-needs-review');
  }

  // 6. Source Marker & Status Rules
  let status: NormalizedDirectoryPerson['status'] = 'active';
  let communicationPreference: NormalizedDirectoryPerson['communicationPreference'] = 'standard';

  const marker = sourceMarker.trim().toLowerCase();
  if (marker === 'x') {
    status = 'needs_review';
    tags.push('source-marked-x');
  } else if (marker === 'email only') {
    status = 'active';
    communicationPreference = 'email_only';
    tags.push('email-only');
  }

  // Additional review triggers
  if (emailNeedsReview) {
    status = 'needs_review';
    tags.push('invalid-email-format');
  }
  if (phoneNeedsReview) {
    tags.push('phone-needs-review');
  }
  if (officeNeedsReview) {
    status = 'needs_review';
    tags.push('office-needs-review');
  }
  if (roleNeedsReview) {
    status = 'needs_review';
  }
  if (!email && !phone) {
    status = 'needs_review';
    tags.push('incomplete-contact');
  }

  // 7. Deterministic SHA256 Roster Key
  const normEmail = email || '';
  const normPhone = phone || '';
  const normOffice = primaryOfficeName || '';
  const rawKey = normEmail || normPhone || `${displayName}|${normOffice}`;
  const sourceRowKey = crypto.createHash('sha256').update(rawKey).digest('hex');
  const id = `nest_rechat_${sourceRowKey}`;

  return {
    id,
    workspaceId: wsId,
    firstName,
    middleName,
    lastName,
    displayName,
    email,
    phone,
    title: role || 'Agent', // Set title = role so UI renders it as the subtitle
    role,
    team,
    rawRole,
    rawOffice,
    primaryOfficeName,
    officeNames: [primaryOfficeName],
    personType,
    isBrokerInCharge,
    isTeamLeader,
    status,
    communicationPreference,
    tags,
    source: 'nest_rechat_roster',
    sourceParserVersion: 'nest_rechat_roster_v1',
    sourceRowKey
  };
}
