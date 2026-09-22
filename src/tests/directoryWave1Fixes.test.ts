import { describe, expect, it } from 'vitest';
import {
  aggregateDirectoryBannerCounts,
  formatProfileTitle,
  getDirectoryOfficeFilterOptions,
  getDirectoryTypeFilterOptions,
  matchesOfficeFilter,
  matchesTypeFilter,
  normalizeOfficeLabel,
  normalizePersonType,
  sanitizeDirectoryPhone,
  typeFilterLabel,
  type DirectoryWave1Person,
} from '../utils/directoryWave1Fixes';

describe('directoryWave1Fixes — office labels', () => {
  it('maps Wilmington → Mayfaire', () => {
    expect(normalizeOfficeLabel('Wilmington')).toBe('Mayfaire');
    expect(normalizeOfficeLabel('Nest Realty Wilmington')).toBe('Mayfaire');
    expect(normalizeOfficeLabel('Mayfaire')).toBe('Mayfaire');
    expect(normalizeOfficeLabel('Nest Realty Mayfaire')).toBe('Mayfaire');
  });

  it('keeps Carolina Beach canonical', () => {
    expect(normalizeOfficeLabel('Carolina Beach')).toBe('Carolina Beach');
  });

  it('office filter options use Mayfaire not Wilmington', () => {
    const opts = getDirectoryOfficeFilterOptions();
    expect(opts).toContain('Mayfaire');
    expect(opts).toContain('Carolina Beach');
    expect(opts).not.toContain('Wilmington');
  });
});

describe('directoryWave1Fixes — type filter (Assistants→Staff, BIC in Type)', () => {
  it('maps assistant → staff', () => {
    expect(normalizePersonType('assistant')).toBe('staff');
    expect(normalizePersonType('Assistants')).toBe('staff');
  });

  it('Type options include BIC and Staff, not a separate Assistants value', () => {
    const opts = getDirectoryTypeFilterOptions();
    expect(opts).toEqual(expect.arrayContaining(['leadership', 'agent', 'staff', 'bic']));
    expect(opts).not.toContain('assistant');
    expect(new Set(opts).size).toBe(opts.length);
    expect(typeFilterLabel('staff')).toBe('Staff');
    expect(typeFilterLabel('bic')).toBe('BIC');
  });

  it('BIC type filter matches isBrokerInCharge / title cues', () => {
    const bic: DirectoryWave1Person = {
      status: 'active',
      personType: 'agent',
      isBrokerInCharge: true,
      primaryOfficeName: 'Mayfaire',
    };
    const byTitle: DirectoryWave1Person = {
      status: 'active',
      personType: 'agent',
      title: 'Broker-in-Charge',
      primaryOfficeName: 'Carolina Beach',
    };
    expect(matchesTypeFilter(bic, 'bic')).toBe(true);
    expect(matchesTypeFilter(byTitle, 'bic')).toBe(true);
    expect(matchesTypeFilter({ status: 'active', personType: 'agent' }, 'bic')).toBe(false);
  });
});

describe('directoryWave1Fixes — banner counts', () => {
  const roster: DirectoryWave1Person[] = [
    { status: 'active', personType: 'agent', primaryOfficeName: 'Mayfaire' },
    { status: 'active', personType: 'agent', primaryOfficeName: 'Wilmington' },
    { status: 'active', personType: 'agent', primaryOfficeName: 'Nest Realty Mayfaire' },
    { status: 'active', personType: 'agent', primaryOfficeName: 'Carolina Beach' },
    { status: 'active', personType: 'agent', primaryOfficeName: 'Carolina Beach' },
    { status: 'active', personType: 'agent', primaryOfficeName: 'Carolina Beach' },
    {
      status: 'active',
      personType: 'agent',
      primaryOfficeName: 'Mayfaire',
      isBrokerInCharge: true,
      title: 'Broker-in-Charge',
    },
    { status: 'active', personType: 'leadership', primaryOfficeName: 'Mayfaire', title: 'Owner' },
    { status: 'active', personType: 'staff', primaryOfficeName: 'Mayfaire' },
    { status: 'active', personType: 'assistant', primaryOfficeName: 'Carolina Beach' },
    { status: 'inactive', personType: 'agent', primaryOfficeName: 'Mayfaire' },
  ];

  it('totalActive = all Nest people (agents+BIC+leaders+staff), not agents-only', () => {
    const c = aggregateDirectoryBannerCounts(roster);
    expect(c.totalActive).toBe(10);
    expect(c.totalActive).toBeGreaterThan(c.mayfaireAgents + c.carolinaBeachAgents);
  });

  it('Mayfaire agent count uses same method as Carolina Beach (parity)', () => {
    const c = aggregateDirectoryBannerCounts(roster);
    expect(c.mayfaireAgents).toBe(4);
    expect(c.carolinaBeachAgents).toBe(3);
    expect(
      roster.filter(
        (p) =>
          (p.status || 'active') !== 'inactive' &&
          normalizePersonType(p.personType) === 'agent' &&
          matchesOfficeFilter(p, 'Mayfaire'),
      ).length,
    ).toBe(c.mayfaireAgents);
    expect(
      roster.filter(
        (p) =>
          (p.status || 'active') !== 'inactive' &&
          normalizePersonType(p.personType) === 'agent' &&
          matchesOfficeFilter(p, 'Carolina Beach'),
      ).length,
    ).toBe(c.carolinaBeachAgents);
  });

  it('Leadership and Staff are separate banner categories; assistants roll into Staff', () => {
    const c = aggregateDirectoryBannerCounts(roster);
    expect(c.leadership).toBe(1);
    expect(c.staff).toBe(2);
    expect(c.leadership).not.toBe(c.staff);
    expect(c).toHaveProperty('leadership');
    expect(c).toHaveProperty('staff');
    expect(c).not.toHaveProperty('leadershipAndStaff');
  });
});

describe('directoryWave1Fixes — profile titles', () => {
  it('expands bare PB and prefers Broker - {Group} - Leader', () => {
    expect(formatProfileTitle('PB')).toBe('Producing Broker');
    expect(formatProfileTitle('Fresh Nest RE - Leader')).toBe(
      'Broker - Fresh Nest RE - Leader',
    );
    expect(formatProfileTitle('Broker - Barbee Group Realty')).toBe(
      'Broker - Barbee Group Realty',
    );
    expect(formatProfileTitle('Broker-MAC Real Estate')).toBe('Broker - MAC Real Estate');
    expect(formatProfileTitle('', { group: 'Urti Real Estate', isLeader: true })).toBe(
      'Broker - Urti Real Estate - Leader',
    );
  });
});

describe('directoryWave1Fixes — phones', () => {
  it('formats 10-digit phones consistently', () => {
    expect(sanitizeDirectoryPhone('9105814705').phone).toBe('(910) 581-4705');
    expect(sanitizeDirectoryPhone('(910) 581-4705').phone).toBe('(910) 581-4705');
    expect(sanitizeDirectoryPhone('1-910-581-4705').phone).toBe('(910) 581-4705');
  });

  it('date/junk phones → blank + Needs Review', () => {
    for (const junk of ['4/22/2026', '6/18/2026', '3/30/2026']) {
      const r = sanitizeDirectoryPhone(junk);
      expect(r.phone).toBe('');
      expect(r.needsReview).toBe(true);
    }
  });
});

describe('directoryWave1Fixes — hardcoded headcount ban (regression guard)', () => {
  it('banner helper never returns a magic 74 — it derives from input length', () => {
    expect(aggregateDirectoryBannerCounts([]).totalActive).toBe(0);
    expect(
      aggregateDirectoryBannerCounts([
        { status: 'active', personType: 'agent', primaryOfficeName: 'Mayfaire' },
      ]).totalActive,
    ).toBe(1);
  });
});


describe('directoryWave1Fixes — WorkspaceDirectoryPage wiring regression', () => {
  it('Directory page no longer hardcodes 74 / Wilmington office filter / video libraries copy', async () => {
    const fs = await import('node:fs');
    const page = fs.readFileSync(
      new URL('../components/people/WorkspaceDirectoryPage.tsx', import.meta.url),
      'utf8',
    );
    expect(page).not.toMatch(/Manage all 74 agents/);
    expect(page).not.toMatch(/video libraries/);
    expect(page).toMatch(/directoryWave1Fixes/);
    expect(page).toMatch(/getDirectoryOfficeFilterOptions/);
    expect(page).toMatch(/formatProfileTitle/);
    expect(page).toMatch(/sanitizeDirectoryPhone/);
    expect(page).toMatch(/matchesTypeFilter/);
    // Office filter must not offer a Wilmington option value
    expect(page).not.toMatch(/value=\"Wilmington\"/);
    expect(page).not.toMatch(/value=\{?'Wilmington'\}?/);
  });
});
