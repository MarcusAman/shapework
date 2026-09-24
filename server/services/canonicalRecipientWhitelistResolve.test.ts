/**
 * send-questions 400 was resolveServerCanonicalRecipient returning null for
 * marcus.aman@gmail.com (not in directory_people, not in NEST_FULL_ROSTER_77).
 * Whitelist emails resolve. Random gmail stays null. Nest roster is unchanged.
 */
import { describe, it, expect } from 'vitest';
import { resolveServerCanonicalRecipient } from './canonicalRecipientService.js';
import { NEST_FULL_ROSTER_77 } from '../persistence/nestRosterSeed.js';

describe('resolveServerCanonicalRecipient whitelist fallback', () => {
  it('resolves whitelist marcus.aman@gmail.com with no directory or roster row', async () => {
    expect(
      NEST_FULL_ROSTER_77.some((m) => String(m.email || '').toLowerCase() === 'marcus.aman@gmail.com')
    ).toBe(false);

    const resolved = await resolveServerCanonicalRecipient({
      requesterName: 'Marcus Aman',
      requesterEmail: 'marcus.aman@gmail.com',
      requesterPhone: '(252) 717-0595',
      workspaceId: 'ws_wilmington',
    });

    expect(resolved).not.toBeNull();
    expect(resolved!.email).toBe('marcus.aman@gmail.com');
    expect(resolved!.emailVerified).toBe(true);
    expect(resolved!.name).toBe('Marcus Aman');
    expect(resolved!.id).toBe('dir_marcus_aman');
    expect(
      NEST_FULL_ROSTER_77.some((m) => m.id === 'dir_marcus_aman')
    ).toBe(false);
  });

  it('does not resolve a client-directory Nest email that is not on the whitelist', async () => {
    const resolved = await resolveServerCanonicalRecipient({
      requesterName: 'Dawn',
      requesterEmail: 'dawn@nestrealty.com',
      workspaceId: 'ws_wilmington',
    });
    expect(resolved).toBeNull();
  });

  it('still returns null for a random gmail (route 400 RECIPIENT_UNRESOLVED)', async () => {
    const resolved = await resolveServerCanonicalRecipient({
      requesterName: 'Random Person',
      requesterEmail: 'random.person@gmail.com',
      workspaceId: 'ws_wilmington',
    });
    expect(resolved).toBeNull();
  });

  it('still resolves a Nest roster person on the directory/roster path', async () => {
    const resolved = await resolveServerCanonicalRecipient({
      requesterName: 'Eduardo Lovo',
      requesterEmail: 'eduardo.lovo@nestrealty.com',
      workspaceId: 'ws_wilmington',
    });
    expect(resolved).not.toBeNull();
    expect(resolved!.id).toBe('dir_eduardo_lovo_73');
    expect(resolved!.email).toBe('eduardo.lovo@nestrealty.com');
  });
});
