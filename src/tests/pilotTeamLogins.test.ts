import { describe, it, expect } from 'vitest';
import { PILOT_TEAM_USERS } from '../../server/persistence/dbSync';
import { SEEDED_USERS, SEEDED_MEMBERSHIPS } from '../../server/auth/auth';
import { hashPassword, verifyPassword } from '../../server/auth/password';
import { getProductProfile, PILOT_TEAM_EMAILS } from '../config/productProfiles';

describe('Pilot Team Logins & Dashboard Configuration', () => {
  const REQUIRED_TEAM = [
    { name: 'Ryan', primary: 'ryan@nestrealty.com' },
    { name: 'Matt', primary: 'matt.orr@nestrealty.com', aliases: ['matt@nestrealty.com'] },
    { name: 'Marcus', primary: 'marcus@nestrealty.com', aliases: ['marcus@capefearai.com'] },
    { name: 'Melissa', primary: 'mg@nestrealty.com', aliases: ['melissa@nestrealty.com', 'melissa.gagliardi@nestrealty.com'] },
    { name: 'Ann', primary: 'ann@nestrealty.com', aliases: ['ann.gunn@nestrealty.com'] },
    { name: 'James', primary: 'james@nestrealty.com', aliases: ['james.fort@nestrealty.com'] },
    { name: 'Eric', primary: 'eric@nestrealty.com', aliases: ['eric.knight@nestrealty.com'] },
    { name: 'Jessica', primary: 'jessica.keenan@nestrealty.com', aliases: ['jessica@nestrealty.com'] },
    { name: 'Eduardo', primary: 'eduardo.lovo@nestrealty.com', aliases: ['eduardo@nestrealty.com'] },
    { name: 'Ask Nora', primary: 'asknora@nestrealty.com', aliases: ['ask-nora@nestrealty.com'] }
  ];

  it('1. Verifies PILOT_TEAM_USERS contains all 8 pilot identities with password Ih@tep@$$word$', () => {
    for (const member of REQUIRED_TEAM) {
      const found = PILOT_TEAM_USERS.find(u => u.email.toLowerCase() === member.primary.toLowerCase());
      expect(found, `Missing pilot user for ${member.primary}`).toBeDefined();
      expect(found?.password).toBe('Ih@tep@$$word$');

      if (member.aliases) {
        for (const alias of member.aliases) {
          const foundAlias = PILOT_TEAM_USERS.find(u => u.email.toLowerCase() === alias.toLowerCase());
          expect(foundAlias, `Missing alias user for ${alias}`).toBeDefined();
          expect(foundAlias?.password).toBe('Ih@tep@$$word$');
        }
      }
    }
  });

  it('2. Verifies PBKDF2 password hashing and verification succeeds for Ih@tep@$$word$', () => {
    const password = 'Ih@tep@$$word$';
    const hash = hashPassword(password);
    expect(hash.startsWith('$pbkdf2-sha512$i=250000$l=64$')).toBe(true);
    expect(verifyPassword(password, hash)).toBe(true);
    expect(verifyPassword('WrongPassword123!', hash)).toBe(false);
  });

  it('3. Verifies SEEDED_USERS and SEEDED_MEMBERSHIPS contain all pilot members and aliases', () => {
    for (const member of REQUIRED_TEAM) {
      const seededUser = SEEDED_USERS.find(u => u.email.toLowerCase() === member.primary.toLowerCase());
      expect(seededUser, `Missing seeded user for ${member.primary}`).toBeDefined();
      const seededMem = SEEDED_MEMBERSHIPS.find(m => m.userId === seededUser?.id);
      expect(seededMem, `Missing seeded membership for ${member.primary}`).toBeDefined();

      if (member.aliases) {
        for (const alias of member.aliases) {
          const seededAlias = SEEDED_USERS.find(u => u.email.toLowerCase() === alias.toLowerCase());
          expect(seededAlias, `Missing seeded alias user for ${alias}`).toBeDefined();
        }
      }
    }
  });

  it('4. Verifies getProductProfile assigns curated pilot dashboard (ryan_pilot) to all 8 pilot emails', () => {
    const allEmails = REQUIRED_TEAM.flatMap(m => [m.primary, ...(m.aliases || [])]);
    
    for (const email of allEmails) {
      const profile = getProductProfile(email, undefined, 'nest-realty-wilmington');
      expect(profile.experience, `Expected ryan_pilot experience for ${email}`).toBe('ryan_pilot');
      
      const moduleTabs = profile.modules.filter(m => m.enabled).map(m => m.tab);
      expect(moduleTabs).toContain('Workboard');
      expect(moduleTabs).toContain('Role Map');
      expect(moduleTabs).not.toContain('Vendor Dispatch');
      expect(moduleTabs).toContain('Directory');
      expect(moduleTabs).toContain('Staff SOP Templates');
      expect(moduleTabs).toContain('Tasks');
      expect(moduleTabs).toContain('Market Intelligence');
      expect(moduleTabs).toContain('Settings');
    }
  });

  it('5. Verifies PILOT_TEAM_EMAILS list is complete and synchronized', () => {
    for (const member of REQUIRED_TEAM) {
      expect(PILOT_TEAM_EMAILS).toContain(member.primary);
      if (member.aliases) {
        for (const alias of member.aliases) {
          expect(PILOT_TEAM_EMAILS).toContain(alias);
        }
      }
    }
  });
});
