import crypto from 'crypto';
import { SecureActionToken, logNotificationAudit } from './notificationTypes.js';

/**
 * Generates a cryptographically secure random token, hashes it,
 * saves the hash to dbState.secureActionTokens, and returns both the raw token and token object.
 */
export function generateSecureActionToken(
  dbState: any,
  workspaceId: string,
  recipientStaffMemberId: string,
  actionType: string,
  workItemId?: string,
  approvalId?: string
): { token: string; secureToken: SecureActionToken } {
  // Generate random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Compute SHA-256 hash
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  // Set expiration to 24 hours from now
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  
  const secureToken: SecureActionToken = {
    id: `sat_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    workspaceId,
    recipientStaffMemberId,
    actionType,
    tokenHash,
    expiresAt,
    createdAt: new Date().toISOString()
  };
  
  if (workItemId) secureToken.workItemId = workItemId;
  if (approvalId) secureToken.approvalId = approvalId;
  
  if (!dbState.secureActionTokens) dbState.secureActionTokens = [];
  dbState.secureActionTokens.push(secureToken);
  
  // Log audit event for token creation
  logNotificationAudit(
    dbState,
    'System',
    'system',
    `Generated secure action token for action type "${actionType}"`,
    'security'
  );
  
  return { token, secureToken };
}

/**
 * Validates a raw token by checking the hash, expiration, and usage status.
 * Returns the matching SecureActionToken if valid, otherwise null.
 */
export function validateSecureActionToken(dbState: any, token: string): SecureActionToken | null {
  if (!token) return null;
  
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  if (!dbState.secureActionTokens) dbState.secureActionTokens = [];
  const secureToken = dbState.secureActionTokens.find((t: any) => t.tokenHash === tokenHash);
  
  if (!secureToken) {
    return null;
  }
  
  // Check if expired
  if (new Date(secureToken.expiresAt).getTime() < Date.now()) {
    logNotificationAudit(
      dbState,
      'System',
      'system',
      `Blocked validation of expired action token (ID: ${secureToken.id})`,
      'security'
    );
    return null;
  }
  
  // Check if already used
  if (secureToken.usedAt) {
    logNotificationAudit(
      dbState,
      'System',
      'system',
      `Blocked validation of already used action token (ID: ${secureToken.id})`,
      'security'
    );
    return null;
  }
  
  return secureToken;
}

/**
 * Marks a secure action token as used.
 */
export function useSecureActionToken(dbState: any, token: string): boolean {
  if (!token) return false;
  
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  if (!dbState.secureActionTokens) dbState.secureActionTokens = [];
  const secureToken = dbState.secureActionTokens.find((t: any) => t.tokenHash === tokenHash);
  
  if (secureToken) {
    secureToken.usedAt = new Date().toISOString();
    logNotificationAudit(
      dbState,
      'System',
      'system',
      `Used action token for action type "${secureToken.actionType}"`,
      'security'
    );
    return true;
  }
  
  return false;
}
