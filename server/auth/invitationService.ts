/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { dbPool } from '../persistence/repositories.js';
import { hashPassword, validatePasswordPolicy, redactEmail } from './password.js';
import { signJwt } from './jwt.js';

export interface InvitationResult {
  id: string;
  userId: string;
  workspaceId: string;
  rawToken: string;
  expiresAt: string;
}

export async function logAuthEvent(
  eventType: string,
  userId?: string | null,
  email?: string | null,
  workspaceId?: string | null,
  ipAddress?: string | null,
  userAgent?: string | null,
  metadata?: Record<string, any>
): Promise<void> {
  const redacted = redactEmail(email);
  const safeMeta = metadata ? { ...metadata } : {};
  // Strip any accidental sensitive fields
  delete safeMeta.password;
  delete safeMeta.token;
  delete safeMeta.passwordHash;
  delete safeMeta.secret;

  if (dbPool) {
    try {
      await dbPool.query(`
        INSERT INTO auth_audit_logs (
          id, event_type, user_id, email_redacted, workspace_id, ip_address, user_agent, metadata, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `, [
        `audit_auth_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        eventType,
        userId || null,
        redacted,
        workspaceId || null,
        ipAddress || 'unknown',
        userAgent || 'unknown',
        JSON.stringify(safeMeta)
      ]);
    } catch (err) {
      console.error('[Auth Audit] Failed to persist auth audit log:', err);
    }
  } else {
    console.log(`[AUTH AUDIT] ${eventType} for ${redacted} (workspace: ${workspaceId || 'none'})`);
  }
}

export async function createInvitationToken(
  userId: string,
  workspaceId: string,
  role: string,
  permissions: string[] = []
): Promise<InvitationResult> {
  if (!dbPool) {
    throw new Error('Database pool is required for invitation token management.');
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const id = `inv_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  await dbPool.query(`
    INSERT INTO invitation_tokens (id, user_id, workspace_id, token_hash, role, permissions, expires_at, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
  `, [id, userId, workspaceId, tokenHash, role, permissions, expiresAt]);

  await logAuthEvent('invitation_created', userId, null, workspaceId, null, null, {
    invitationId: id,
    role,
    expiresAt
  });

  return { id, userId, workspaceId, rawToken, expiresAt };
}

export async function activateAccountWithToken(
  rawToken: string,
  newPassword: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; user: any; token: string }> {
  if (!dbPool) {
    throw new Error('Database pool is required for account activation.');
  }

  const policyCheck = validatePasswordPolicy(newPassword);
  if (!policyCheck.valid) {
    throw new Error(policyCheck.reason || 'Invalid password.');
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const invRes = await dbPool.query(`
    SELECT * FROM invitation_tokens 
    WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
  `, [tokenHash]);

  if (invRes.rows.length === 0) {
    await logAuthEvent('account_activation_failed', null, null, null, ipAddress, userAgent, {
      reason: 'invalid_or_expired_token'
    });
    throw new Error('Invalid, expired, or already used invitation token.');
  }

  const invitation = invRes.rows[0];
  const userId = invitation.user_id;
  const workspaceId = invitation.workspace_id;
  const role = invitation.role;
  const permissions = invitation.permissions || [];

  const passwordHash = hashPassword(newPassword);

  // Update User state
  const userRes = await dbPool.query(`
    UPDATE users 
    SET password_hash = $1, 
        status = 'active', 
        activated_at = NOW(), 
        security_version = security_version + 1,
        failed_login_attempts = 0,
        locked_until = NULL,
        updated_at = NOW()
    WHERE id = $2
    RETURNING id, email, name, status, security_version;
  `, [passwordHash, userId]);

  if (userRes.rows.length === 0) {
    throw new Error('User account not found.');
  }

  const user = userRes.rows[0];

  // Upsert Workspace Membership
  await dbPool.query(`
    INSERT INTO workspace_memberships (id, workspace_id, user_id, role, permissions, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    ON CONFLICT (workspace_id, user_id) DO UPDATE SET
      role = EXCLUDED.role,
      permissions = EXCLUDED.permissions,
      updated_at = NOW();
  `, [`mem_${userId}_${workspaceId}`, workspaceId, userId, role, permissions]);

  // Mark invitation token used
  await dbPool.query(`
    UPDATE invitation_tokens 
    SET used_at = NOW(), used_by_ip = $1 
    WHERE id = $2;
  `, [ipAddress || 'unknown', invitation.id]);

  // Generate new JWT
  const sessionToken = signJwt({
    userId: user.id,
    email: user.email,
    role,
    workspaceId,
    securityVersion: user.security_version
  }, { expiresInSeconds: 8 * 3600, securityVersion: user.security_version });

  await logAuthEvent('account_activation_success', user.id, user.email, workspaceId, ipAddress, userAgent, {
    invitationId: invitation.id,
    role
  });

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role,
      workspaceId,
      status: user.status
    },
    token: sessionToken
  };
}

export async function createPasswordResetToken(
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; rawToken?: string }> {
  if (!dbPool) return { success: true };

  const userRes = await dbPool.query('SELECT id, email, status FROM users WHERE email = $1', [email]);
  if (userRes.rows.length === 0) {
    await logAuthEvent('password_reset_request_nonexistent', null, email, null, ipAddress, userAgent);
    return { success: true }; // Generic non-disclosing response
  }

  const user = userRes.rows[0];
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const id = `rst_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  await dbPool.query(`
    INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at)
    VALUES ($1, $2, $3, $4, NOW())
  `, [id, user.id, tokenHash, expiresAt]);

  await logAuthEvent('password_reset_request_success', user.id, user.email, null, ipAddress, userAgent, {
    resetId: id
  });

  return { success: true, rawToken };
}

export async function resetPasswordWithToken(
  rawToken: string,
  newPassword: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean }> {
  if (!dbPool) {
    throw new Error('Database pool is required for password reset.');
  }

  const policyCheck = validatePasswordPolicy(newPassword);
  if (!policyCheck.valid) {
    throw new Error(policyCheck.reason || 'Invalid password.');
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const rstRes = await dbPool.query(`
    SELECT * FROM password_reset_tokens 
    WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
  `, [tokenHash]);

  if (rstRes.rows.length === 0) {
    await logAuthEvent('password_reset_failed', null, null, null, ipAddress, userAgent, {
      reason: 'invalid_or_expired_token'
    });
    throw new Error('Invalid or expired password reset token.');
  }

  const rst = rstRes.rows[0];
  const userId = rst.user_id;
  const passwordHash = hashPassword(newPassword);

  // Invalidate all existing sessions by incrementing security_version
  await dbPool.query(`
    UPDATE users 
    SET password_hash = $1, 
        security_version = security_version + 1,
        failed_login_attempts = 0,
        locked_until = NULL,
        updated_at = NOW()
    WHERE id = $2;
  `, [passwordHash, userId]);

  // Mark token used
  await dbPool.query(`
    UPDATE password_reset_tokens 
    SET used_at = NOW(), used_by_ip = $1 
    WHERE id = $2;
  `, [ipAddress || 'unknown', rst.id]);

  await logAuthEvent('password_reset_success', userId, null, null, ipAddress, userAgent, {
    resetId: rst.id
  });

  return { success: true };
}
