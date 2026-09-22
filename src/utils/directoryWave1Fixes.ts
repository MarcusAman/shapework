/**
 * Nest Directory Wave 1 pure helpers.
 * Banner counts, office labels, type options, title formatting, phone sanitization.
 */

export type DirectoryWave1Person = {
  status?: string | null;
  personType?: string | null;
  title?: string | null;
  role?: string | null;
  primaryOfficeName?: string | null;
  officeNames?: string[] | null;
  isBrokerInCharge?: boolean | null;
  isBIC?: boolean | null;
  phone?: string | null;
};

export type DirectoryBannerCounts = {
  totalActive: number;
  mayfaireAgents: number;
  carolinaBeachAgents: number;
  leadership: number;
  staff: number;
  bic: number;
};

const MAYFAIRE_ALIASES = new Set([
  'mayfaire',
  'nest realty mayfaire',
  'wilmington',
  'nest realty wilmington',
]);

const CAROLINA_BEACH_ALIASES = new Set([
  'carolina beach',
  'carolina beach office',
]);

export function normalizeOfficeLabel(office: string | null | undefined): string {
  const raw = (office || '').trim();
  if (!raw) return '';
  const key = raw.toLowerCase();
  if (MAYFAIRE_ALIASES.has(key) || key.includes('mayfaire') || key === 'wilmington') {
    return 'Mayfaire';
  }
  if (CAROLINA_BEACH_ALIASES.has(key) || key.includes('carolina beach')) {
    return 'Carolina Beach';
  }
  return raw;
}

/** Canonical office filter options — Wilmington remapped to Mayfaire. */
export function getDirectoryOfficeFilterOptions(): string[] {
  return ['Mayfaire', 'Carolina Beach', 'Hampstead', 'Remote / Home'];
}

export function normalizePersonType(
  personType: string | null | undefined,
): 'leadership' | 'staff' | 'agent' | 'bic' | 'other' {
  const t = (personType || '').toLowerCase().trim();
  if (t === 'assistant' || t === 'assistants') return 'staff'; // Assistants → Staff
  if (t === 'leadership' || t === 'leader') return 'leadership';
  if (t === 'staff') return 'staff';
  if (t === 'agent' || t === '' || !t) return 'agent';
  if (t === 'bic' || t === 'broker-in-charge' || t === 'broker_in_charge') return 'bic';
  return 'other';
}

/** Unique Type filter values; includes BIC; Assistants collapsed into Staff. */
export function getDirectoryTypeFilterOptions(): string[] {
  return ['leadership', 'agent', 'staff', 'bic'];
}

export function typeFilterLabel(value: string): string {
  switch (value) {
    case 'leadership':
      return 'Leadership';
    case 'agent':
      return 'Agents';
    case 'staff':
      return 'Staff';
    case 'bic':
      return 'BIC';
    default:
      return value;
  }
}

export function isActivePerson(p: DirectoryWave1Person): boolean {
  const s = (p.status || 'active').toLowerCase();
  return s !== 'inactive' && s !== 'archived';
}

export function isBicPerson(p: DirectoryWave1Person): boolean {
  if (p.isBrokerInCharge || p.isBIC) return true;
  const blob = `${p.title || ''} ${p.role || ''}`.toLowerCase();
  return (
    blob.includes('broker-in-charge') ||
    blob.includes('broker in charge') ||
    /\bbic\b/.test(blob)
  );
}

function personOffices(p: DirectoryWave1Person): string[] {
  const names = [
    normalizeOfficeLabel(p.primaryOfficeName),
    ...((p.officeNames || []).map(normalizeOfficeLabel)),
  ].filter(Boolean);
  return Array.from(new Set(names));
}

function belongsToOffice(p: DirectoryWave1Person, office: 'Mayfaire' | 'Carolina Beach'): boolean {
  return personOffices(p).includes(office);
}

/**
 * Banner aggregation:
 * - totalActive = all Nest people (agents + BIC + leaders + staff)
 * - Mayfaire / Carolina Beach agent counts use the same predicate (parity of method)
 * - Leadership and Staff are separate categories (Assistants count as Staff)
 */
export function aggregateDirectoryBannerCounts(
  people: DirectoryWave1Person[],
): DirectoryBannerCounts {
  const active = people.filter(isActivePerson);
  const totalActive = active.length;

  const mayfaireAgents = active.filter(
    (p) => normalizePersonType(p.personType) === 'agent' && belongsToOffice(p, 'Mayfaire'),
  ).length;

  const carolinaBeachAgents = active.filter(
    (p) => normalizePersonType(p.personType) === 'agent' && belongsToOffice(p, 'Carolina Beach'),
  ).length;

  const leadership = active.filter(
    (p) => normalizePersonType(p.personType) === 'leadership',
  ).length;

  const staff = active.filter(
    (p) => normalizePersonType(p.personType) === 'staff',
  ).length;

  const bic = active.filter(isBicPerson).length;

  return {
    totalActive,
    mayfaireAgents,
    carolinaBeachAgents,
    leadership,
    staff,
    bic,
  };
}

const TITLE_ABBREV: Record<string, string> = {
  pb: 'Producing Broker',
  bic: 'Broker-in-Charge',
  va: 'Virtual Assistant',
};

/**
 * Prefer `Broker - {Group} - Leader`. Expand bare abbreviations like PB.
 */
export function formatProfileTitle(
  title: string | null | undefined,
  opts?: { group?: string | null; isLeader?: boolean },
): string {
  let raw = (title || '').trim();
  if (!raw) {
    if (opts?.group && opts?.isLeader) {
      return `Broker - ${opts.group.trim()} - Leader`;
    }
    return '';
  }

  const lower = raw.toLowerCase();
  if (TITLE_ABBREV[lower]) {
    raw = TITLE_ABBREV[lower];
  }

  // Normalize hyphen spacing: "Broker-MAC" → "Broker - MAC"
  raw = raw.replace(/\s*-\s*/g, ' - ');

  // "{Group} - Leader" / "{Group}-Leader" without Broker prefix
  const leaderOnly = raw.match(/^(.+?)\s-\s*Leader$/i);
  if (leaderOnly && !/^broker\b/i.test(leaderOnly[1])) {
    return `Broker - ${leaderOnly[1].trim()} - Leader`;
  }

  // "Broker - {Group}" already good; ensure Leader suffix when flagged
  if (opts?.isLeader && !/\bleader\b/i.test(raw)) {
    if (/^broker\b/i.test(raw)) {
      return `${raw} - Leader`;
    }
    const group = opts.group?.trim() || raw;
    return `Broker - ${group} - Leader`;
  }

  return raw;
}

export type SanitizedPhone = {
  phone: string;
  needsReview: boolean;
  reason?: 'date_or_junk' | 'invalid';
};

function looksLikeDateOrJunk(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  // M/D/YYYY or MM-DD-YYYY etc.
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(v)) return true;
  if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(v)) return true;
  // Mostly letters / nonsense
  const digits = v.replace(/\D/g, '');
  if (digits.length === 0 && /[a-zA-Z]/.test(v)) return true;
  return false;
}

/** Consistent (XXX) XXX-XXXX; date/junk → blank + Needs Review. */
export function sanitizeDirectoryPhone(phone: string | null | undefined): SanitizedPhone {
  const raw = (phone || '').trim();
  if (!raw) {
    return { phone: '', needsReview: false };
  }
  if (looksLikeDateOrJunk(raw)) {
    return { phone: '', needsReview: true, reason: 'date_or_junk' };
  }
  const digits = raw.replace(/\D/g, '');
  let core = digits;
  if (core.length === 11 && core.startsWith('1')) {
    core = core.slice(1);
  }
  if (core.length !== 10) {
    // Keep original if it had some digits but isn't formattable — still flag review when clearly bad
    if (digits.length > 0 && digits.length < 10) {
      return { phone: '', needsReview: true, reason: 'invalid' };
    }
    return { phone: raw, needsReview: false };
  }
  const formatted = `(${core.slice(0, 3)}) ${core.slice(3, 6)}-${core.slice(6)}`;
  return { phone: formatted, needsReview: false };
}

export function matchesOfficeFilter(
  person: DirectoryWave1Person,
  filterOffice: string,
): boolean {
  if (filterOffice === 'all') return true;
  const want = normalizeOfficeLabel(filterOffice);
  return personOffices(person).includes(want);
}

export function matchesTypeFilter(
  person: DirectoryWave1Person,
  filterType: string,
): boolean {
  if (filterType === 'all') return true;
  if (filterType === 'bic') return isBicPerson(person);
  return normalizePersonType(person.personType) === filterType;
}
