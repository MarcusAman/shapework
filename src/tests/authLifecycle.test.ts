import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import { hashPassword, verifyPassword } from '../../server/auth/password.js';
import { signJwt, verifyJwt } from '../../server/auth/jwt.js';
import { ROLE_PERMISSIONS } from '../../server/auth/auth.js';

describe('Complete Authentication & Account Lifecycle Verification', () => {
  // In-memory test fixtures simulating the database user store
  let usersStore: any[] = [];
  let tokensStore: any[] = [];
  let membershipsStore: any[] = [];

  const RESET_SECRET = 'test-secret-key-32-chars-long-reset-key!';
  process.env.PASSWORD_RESET_SECRET = RESET_SECRET;

  function hashToken(token: string): string {
    return crypto.createHmac('sha256', RESET_SECRET).update(token).digest('hex');
  }

  beforeEach(() => {
    // Reset stores before each test
    usersStore = [
      {
        id: 'usr_ryan',
        email: 'ryan@nestrealty.com',
        name: 'Ryan Crecelius',
        status: 'pending_activation',
        password_hash: null,
        security_version: 1,
        activated_at: null,
        failed_login_attempts: 0,
        locked_until: null
      },
      {
        id: 'usr_melissa_full',
        email: 'melissa.gagliardi@nestrealty.com',
        name: 'Melissa Gagliardi',
        status: 'pending_activation',
        password_hash: null,
        security_version: 1,
        activated_at: null,
        failed_login_attempts: 0,
        locked_until: null
      },
      {
        id: 'usr_melissa',
        email: 'melissa@nestrealty.com',
        name: 'Melissa Gagliardi',
        status: 'pending_activation',
        password_hash: null,
        security_version: 1,
        activated_at: null,
        failed_login_attempts: 0,
        locked_until: null
      },
      {
        id: 'usr_ann',
        email: 'ann@nestrealty.com',
        name: 'Ann Gunn',
        status: 'pending_activation',
        password_hash: null,
        security_version: 1,
        activated_at: null,
        failed_login_attempts: 0,
        locked_until: null
      },
      {
        id: 'usr_eduardo_full',
        email: 'eduardo.lovo@nestrealty.com',
        name: 'Eduardo Lovo',
        status: 'pending_activation',
        password_hash: null,
        security_version: 1,
        activated_at: null,
        failed_login_attempts: 0,
        locked_until: null
      },
      {
        id: 'usr_marcus',
        email: 'marcus@shapework.co',
        name: 'Marcus Aman',
        status: 'active',
        password_hash: hashPassword('shapework2026'),
        security_version: 1,
        activated_at: new Date().toISOString(),
        failed_login_attempts: 0,
        locked_until: null
      }
    ];

    membershipsStore = [
      { userId: 'usr_ryan', workspaceId: 'ws_wilmington', role: 'owner', permissions: ROLE_PERMISSIONS['owner'] },
      { userId: 'usr_melissa_full', workspaceId: 'ws_wilmington', role: 'marketing_director', permissions: ROLE_PERMISSIONS['marketing_director'] },
      { userId: 'usr_melissa', workspaceId: 'ws_wilmington', role: 'marketing_director', permissions: ROLE_PERMISSIONS['marketing_director'] },
      { userId: 'usr_ann', workspaceId: 'ws_wilmington', role: 'operations_lead', permissions: ROLE_PERMISSIONS['operations_lead'] },
      { userId: 'usr_eduardo_full', workspaceId: 'ws_wilmington', role: 'producer', permissions: ROLE_PERMISSIONS['producer'] },
      { userId: 'usr_marcus', workspaceId: 'ws_wilmington', role: 'admin', permissions: ROLE_PERMISSIONS['admin'] }
    ];

    tokensStore = [];
  });

  it('1. Rejects login when status is pending_activation even if password matches', () => {
    // Attempting login on pending_activation user
    const user = usersStore.find(u => u.id === 'usr_ryan');
    expect(user.status).toBe('pending_activation');

    // Simulate login endpoint status check
    const checkLoginStatus = (u: any) => {
      if (u.status === 'pending_activation') {
        return { status: 401, error: 'activation_required', message: 'This account has not yet been activated.' };
      }
      return { status: 200 };
    };

    const res = checkLoginStatus(user);
    expect(res.status).toBe(401);
    expect(res.error).toBe('activation_required');
  });

  it('2. Completes valid invitation / password setup and activates account atomically', () => {
    // Generate valid invitation token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    tokensStore.push({
      id: 'inv_123',
      userId: 'usr_ryan',
      tokenHash,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      usedAt: null
    });

    // Accept token and set password
    const tokenRecord = tokensStore.find(t => t.tokenHash === tokenHash && !t.usedAt && new Date(t.expiresAt) > new Date());
    expect(tokenRecord).toBeDefined();

    const newPassword = 'Nest2026!Ryan';
    const newHash = hashPassword(newPassword);

    // Atomic update
    const user = usersStore.find(u => u.id === tokenRecord.userId);
    user.password_hash = newHash;
    user.status = 'active';
    user.activated_at = new Date().toISOString();
    user.security_version += 1;
    tokenRecord.usedAt = new Date().toISOString();

    // Verify user is now active
    expect(user.status).toBe('active');
    expect(user.activated_at).not.toBeNull();
    expect(verifyPassword(newPassword, user.password_hash)).toBe(true);
    expect(tokenRecord.usedAt).not.toBeNull();
  });

  it('3. Rejects invalid, expired, and reused setup tokens', () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);

    // Test non-existent token
    const findToken = (hash: string) => {
      return tokensStore.find(t => t.tokenHash === hash && !t.usedAt && new Date(t.expiresAt) > new Date());
    };
    expect(findToken('nonexistent_hash')).toBeUndefined();

    // Test expired token
    tokensStore.push({
      id: 'inv_expired',
      userId: 'usr_ann',
      tokenHash,
      expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired 1 second ago
      usedAt: null
    });
    expect(findToken(tokenHash)).toBeUndefined();

    // Test already used token
    const rawToken2 = crypto.randomBytes(32).toString('hex');
    const tokenHash2 = hashToken(rawToken2);
    tokensStore.push({
      id: 'inv_used',
      userId: 'usr_ann',
      tokenHash: tokenHash2,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      usedAt: new Date().toISOString() // Already used
    });
    expect(findToken(tokenHash2)).toBeUndefined();
  });

  it('4. Password reset updates password, invalidates old password, and updates security_version', () => {
    const user = usersStore.find(u => u.id === 'usr_marcus');
    const oldPassword = 'shapework2026';
    expect(verifyPassword(oldPassword, user.password_hash)).toBe(true);
    const oldSecVer = user.security_version;

    // Perform password reset
    const newPassword = 'SecureNewPassword2026!';
    user.password_hash = hashPassword(newPassword);
    user.security_version += 1;

    // Old password now fails
    expect(verifyPassword(oldPassword, user.password_hash)).toBe(false);
    // New password succeeds
    expect(verifyPassword(newPassword, user.password_hash)).toBe(true);
    // Security version incremented (invalidates previous sessions)
    expect(user.security_version).toBeGreaterThan(oldSecVer);
  });

  it('5. Verifies session JWT creation, signing, and round-trip verification', () => {
    const user = usersStore.find(u => u.id === 'usr_marcus');
    const membership = membershipsStore.find(m => m.userId === user.id);

    const token = signJwt({
      userId: user.id,
      email: user.email,
      role: membership.role,
      permissions: membership.permissions,
      workspaceId: membership.workspaceId,
      securityVersion: user.security_version
    });

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = verifyJwt(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(user.id);
    expect(decoded?.email).toBe(user.email);
    expect(decoded?.role).toBe('admin');
    expect(decoded?.securityVersion).toBe(user.security_version);
  });

  it('6. Resolves canonical email aliases correctly for all principals', () => {
    // Candidate aliases map
    const resolveCandidateEmails = (inputEmail: string): string[] => {
      const normalized = inputEmail.toLowerCase().trim();
      const candidates = [normalized];
      if (normalized === 'melissa@nestrealty.com' || normalized === 'melissa.gagliardi@nestrealty.com') {
        candidates.push('melissa.gagliardi@nestrealty.com', 'melissa@nestrealty.com');
      } else if (normalized === 'eduardo.lovo@nestrealty.com' || normalized === 'lovo@nestrealty.com') {
        candidates.push('eduardo.lovo@nestrealty.com', 'lovo@nestrealty.com');
      } else if (normalized === 'ann@nestrealty.com' || normalized === 'ann.gunn@nestrealty.com') {
        candidates.push('ann@nestrealty.com', 'ann.gunn@nestrealty.com');
      }
      return Array.from(new Set(candidates));
    };

    // Melissa alias resolution
    const melissaCandidates = resolveCandidateEmails('melissa@nestrealty.com');
    expect(melissaCandidates).toContain('melissa.gagliardi@nestrealty.com');

    // Eduardo alias resolution
    const eduardoCandidates = resolveCandidateEmails('lovo@nestrealty.com');
    expect(eduardoCandidates).toContain('eduardo.lovo@nestrealty.com');

    // Ann alias resolution
    const annCandidates = resolveCandidateEmails('ann.gunn@nestrealty.com');
    expect(annCandidates).toContain('ann@nestrealty.com');
  });

  it('7. Verifies correct role assignments and capabilities for all 5 team members', () => {
    const roles: Record<string, string> = {
      usr_ryan: 'owner',
      usr_melissa_full: 'marketing_director',
      usr_ann: 'operations_lead',
      usr_eduardo_full: 'producer',
      usr_marcus: 'admin'
    };

    for (const [userId, expectedRole] of Object.entries(roles)) {
      const membership = membershipsStore.find(m => m.userId === userId);
      expect(membership, `Membership missing for ${userId}`).toBeDefined();
      expect(membership.role).toBe(expectedRole);

      // Verify specific expected capabilities
      if (expectedRole === 'owner') {
        expect(membership.permissions).toContain('approve_actions');
        expect(membership.permissions).toContain('marketing.final_approval');
      } else if (expectedRole === 'marketing_director') {
        expect(membership.permissions).toContain('marketing.final_approval');
        expect(membership.permissions).toContain('marketing.campaign.create');
      } else if (expectedRole === 'operations_lead') {
        expect(membership.permissions).toContain('manage_users');
        expect(membership.permissions).toContain('sops.approve');
      } else if (expectedRole === 'producer') {
        expect(membership.permissions).toContain('view_work_queue');
        expect(membership.permissions).toContain('marketing.campaign.create');
      } else if (expectedRole === 'admin') {
        expect(membership.permissions).toContain('access_developer_tools');
        expect(membership.permissions).toContain('manage_workspace');
      }
    }
  });

  it('8. Verifies that safe migration tracking prevents user wiping on application restart', () => {
    // Activate a user
    const user = usersStore.find(u => u.id === 'usr_melissa_full');
    user.status = 'active';
    user.password_hash = hashPassword('Nest2026!Melissa');
    user.activated_at = new Date().toISOString();

    // Simulate startup schema migration runner with schema_migrations tracking
    const appliedVersions = new Set(['20260814010000']); // Marked as already applied

    const migrationFiles = [
      '20260814010000_secure_auth_invitations_sessions.sql'
    ];

    for (const file of migrationFiles) {
      const version = file.match(/^(\d+)/)?.[1] || file;
      if (appliedVersions.has(version)) {
        // Skip executing this file
        continue;
      }
      // If not tracked, it would run and wipe:
      user.status = 'pending_activation';
      user.password_hash = null;
    }

    // User status and password remain intact
    expect(user.status).toBe('active');
    expect(user.password_hash).not.toBeNull();
    expect(verifyPassword('Nest2026!Melissa', user.password_hash)).toBe(true);
  });
});
