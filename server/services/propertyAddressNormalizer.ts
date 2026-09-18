/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Property Address Normalizer & Conservative Matcher
 * Normalizes street suffixes, directionals, unit numbers, city/state/zip, and house numbers.
 * Enforces strict safety rules to avoid false collisions between distinct real estate properties.
 */

export interface NormalizedAddressResult {
  raw: string;
  normalized: string;
  houseNumber: string | null;
  streetName: string | null;
  streetSuffix: string | null;
  directional: string | null;
  unit: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  hasHouseNumber: boolean;
  searchKey: string;
}

export interface AddressMatchEvaluation {
  matchType: 'exact' | 'candidate' | 'ambiguous' | 'no_match';
  confidence: number;
  reason: string;
}

const SUFFIX_MAP: Record<string, string> = {
  'avenue': 'ave',
  'ave': 'ave',
  'street': 'st',
  'st': 'st',
  'drive': 'dr',
  'dr': 'dr',
  'road': 'rd',
  'rd': 'rd',
  'lane': 'ln',
  'ln': 'ln',
  'boulevard': 'blvd',
  'blvd': 'blvd',
  'court': 'ct',
  'ct': 'ct',
  'way': 'way',
  'parkway': 'pkwy',
  'pkwy': 'pkwy',
  'place': 'pl',
  'pl': 'pl',
  'circle': 'cir',
  'cir': 'cir',
  'trail': 'trl',
  'trl': 'trl',
  'highway': 'hwy',
  'hwy': 'hwy',
  'terrace': 'ter',
  'ter': 'ter',
  'loop': 'loop',
  'run': 'run',
  'landing': 'lndg',
  'cove': 'cv',
  'pass': 'pass'
};

const DIRECTIONAL_MAP: Record<string, string> = {
  'north': 'n',
  'n': 'n',
  'south': 's',
  's': 's',
  'east': 'e',
  'e': 'e',
  'west': 'w',
  'w': 'w',
  'northwest': 'nw',
  'nw': 'nw',
  'northeast': 'ne',
  'ne': 'ne',
  'southwest': 'sw',
  'sw': 'sw',
  'southeast': 'se',
  'se': 'se'
};

/**
 * Normalizes a property address conservatively.
 */
export function normalizePropertyAddress(rawAddress?: string | null): NormalizedAddressResult {
  if (!rawAddress || typeof rawAddress !== 'string') {
    return {
      raw: '',
      normalized: '',
      houseNumber: null,
      streetName: null,
      streetSuffix: null,
      directional: null,
      unit: null,
      city: null,
      state: null,
      zip: null,
      hasHouseNumber: false,
      searchKey: ''
    };
  }

  const raw = rawAddress.trim();
  // 1. Clean punctuation and lower-case
  let cleaned = raw
    .toLowerCase()
    .replace(/[,\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Extract ZIP code (5 digits at end)
  let zip: string | null = null;
  const zipMatch = cleaned.match(/\b(28\d{3})\b/);
  if (zipMatch) {
    zip = zipMatch[1];
    cleaned = cleaned.replace(zipMatch[0], ' ').trim();
  }

  // 3. Extract State (NC / North Carolina)
  let state: string | null = null;
  if (/\bnorth carolina\b|\bnc\b/.test(cleaned)) {
    state = 'nc';
    cleaned = cleaned.replace(/\bnorth carolina\b|\bnc\b/g, ' ').trim();
  }

  // 4. Extract City (Wilmington, Wrightsville Beach, Carolina Beach, Hampstead, Leland)
  let city: string | null = null;
  const cities = ['wrightsville beach', 'carolina beach', 'wilmington', 'hampstead', 'leland', 'kure beach'];
  for (const c of cities) {
    if (cleaned.includes(c)) {
      city = c;
      cleaned = cleaned.replace(c, ' ').trim();
      break;
    }
  }

  // 5. Extract Unit / Apt / Suite / Unit #
  let unit: string | null = null;
  const unitMatch = cleaned.match(/\b(?:unit|apt|apartment|ste|suite|#)\s*([a-z0-9\-]+)\b/i);
  if (unitMatch) {
    unit = unitMatch[1].toLowerCase();
    cleaned = cleaned.replace(unitMatch[0], ' ').trim();
  }

  // 6. Tokenize remaining street portion
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return {
      raw,
      normalized: '',
      houseNumber: null,
      streetName: null,
      streetSuffix: null,
      directional: null,
      unit,
      city,
      state,
      zip,
      hasHouseNumber: false,
      searchKey: ''
    };
  }

  // Check house number (first token if numeric or alphanumeric like 1916A)
  let houseNumber: string | null = null;
  let remainingTokens = [...tokens];

  if (/^\d+[a-z]?$/i.test(tokens[0])) {
    houseNumber = tokens[0].toLowerCase();
    remainingTokens = tokens.slice(1);
  }

  // Check leading directional (e.g. S Live Oak Pkwy -> directional = 's')
  let directional: string | null = null;
  if (remainingTokens.length > 0 && DIRECTIONAL_MAP[remainingTokens[0]]) {
    directional = DIRECTIONAL_MAP[remainingTokens[0]];
    remainingTokens = remainingTokens.slice(1);
  }

  // Check trailing street suffix (e.g. Avenue -> ave)
  let streetSuffix: string | null = null;
  if (remainingTokens.length > 0) {
    const lastToken = remainingTokens[remainingTokens.length - 1];
    if (SUFFIX_MAP[lastToken]) {
      streetSuffix = SUFFIX_MAP[lastToken];
      remainingTokens = remainingTokens.slice(0, -1);
    }
  }

  const streetName = remainingTokens.join(' ').trim() || null;

  // Build canonical normalized string
  const parts = [
    houseNumber,
    directional,
    streetName,
    streetSuffix,
    unit ? `unit ${unit}` : null
  ].filter(Boolean);

  const normalized = parts.join(' ');
  const searchKey = `${houseNumber || ''}_${directional || ''}_${streetName || ''}_${streetSuffix || ''}_${unit || ''}`.replace(/__+/g, '_');

  return {
    raw,
    normalized,
    houseNumber,
    streetName,
    streetSuffix,
    directional,
    unit,
    city,
    state: state || 'nc',
    zip,
    hasHouseNumber: !!houseNumber,
    searchKey
  };
}

/**
 * Evaluates whether two property addresses refer to the same physical property.
 */
export function matchPropertyAddresses(queryAddress: string, candidateAddress: string): AddressMatchEvaluation {
  const norm1 = normalizePropertyAddress(queryAddress);
  const norm2 = normalizePropertyAddress(candidateAddress);

  if (!norm1.normalized || !norm2.normalized) {
    return { matchType: 'no_match', confidence: 0, reason: 'EMPTY_OR_UNPARSEABLE_ADDRESS' };
  }

  // CRITICAL RULE: Street name without a house number must NEVER be an exact match
  if (!norm1.hasHouseNumber || !norm2.hasHouseNumber) {
    if (norm1.streetName && norm2.streetName && norm1.streetName === norm2.streetName) {
      return { 
        matchType: 'candidate', 
        confidence: 0.4, 
        reason: 'STREET_ONLY_QUERY_REQUIRES_HOUSE_NUMBER_CONFIRMATION' 
      };
    }
    return { matchType: 'no_match', confidence: 0, reason: 'MISSING_HOUSE_NUMBER' };
  }

  // CRITICAL RULE: Different house numbers MUST NEVER MATCH
  if (norm1.houseNumber !== norm2.houseNumber) {
    return { matchType: 'no_match', confidence: 0, reason: `HOUSE_NUMBER_MISMATCH_${norm1.houseNumber}_VS_${norm2.houseNumber}` };
  }

  // CRITICAL RULE: Unit numbers must NOT be collapsed together
  if (norm1.unit && norm2.unit && norm1.unit !== norm2.unit) {
    return { matchType: 'no_match', confidence: 0, reason: `UNIT_NUMBER_MISMATCH_${norm1.unit}_VS_${norm2.unit}` };
  }

  // If one has unit and one doesn't, but house number and street match, it's a candidate requiring unit clarification
  if ((norm1.unit && !norm2.unit) || (!norm1.unit && norm2.unit)) {
    if (norm1.streetName === norm2.streetName) {
      return { 
        matchType: 'candidate', 
        confidence: 0.75, 
        reason: 'POTENTIAL_UNIT_SUBDIVISION_REQUIRES_CONFIRMATION' 
      };
    }
  }

  // Exact Match: House number + Street Name match (+ matching suffix or directional if present)
  if (norm1.streetName === norm2.streetName) {
    // Check directional conflict (e.g. N vs S)
    if (norm1.directional && norm2.directional && norm1.directional !== norm2.directional) {
      return { matchType: 'no_match', confidence: 0, reason: `DIRECTIONAL_MISMATCH_${norm1.directional}_VS_${norm2.directional}` };
    }

    // Check suffix conflict if both specified and different
    if (norm1.streetSuffix && norm2.streetSuffix && norm1.streetSuffix !== norm2.streetSuffix) {
      return { matchType: 'no_match', confidence: 0, reason: `SUFFIX_MISMATCH_${norm1.streetSuffix}_VS_${norm2.streetSuffix}` };
    }

    return { 
      matchType: 'exact', 
      confidence: 1.0, 
      reason: 'CANONICAL_EXACT_ADDRESS_MATCH' 
    };
  }

  // Street Name fuzzy containment check (e.g. "Live Oak Pkwy" vs "South Live Oak")
  if (norm1.streetName && norm2.streetName) {
    if (norm1.streetName.includes(norm2.streetName) || norm2.streetName.includes(norm1.streetName)) {
      return { 
        matchType: 'candidate', 
        confidence: 0.85, 
        reason: 'HIGH_CONFIDENCE_STREET_SUBSTRING_MATCH' 
      };
    }
  }

  return { matchType: 'no_match', confidence: 0, reason: 'DIFFERENT_STREETS' };
}
