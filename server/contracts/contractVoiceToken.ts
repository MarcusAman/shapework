/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Voice Authorization Token Subsystem — Phase 3 Architecture
 * Issues and validates short-lived, signed, session-bound, workspace-isolated voice tokens.
 */

import crypto from 'crypto';

export interface VoiceAuthorizationTokenPayload {
  tokenId: string;
  userId: string;
  workspaceId: string;
  sessionId: string;
  capability: string;
  issuedAt: string;
  expiresAt: string;
  nonce: string;
}

export class ContractVoiceTokenService {
  private static SECRET_KEY = process.env.CONTRACT_VOICE_TOKEN_SECRET || 'shapework_contract_voice_secret_key_2026';
  private static revokedTokenIds: Set<string> = new Set();

  /**
   * Generates a short-lived, HMAC-signed voice authorization token.
   */
  public static createVoiceToken(params: {
    userId: string;
    workspaceId: string;
    sessionId: string;
    capability?: string;
    expiresInSeconds?: number;
  }): { token: string; payload: VoiceAuthorizationTokenPayload } {
    const {
      userId,
      workspaceId,
      sessionId,
      capability = 'contract_authoring',
      expiresInSeconds = 900 // 15 minutes default
    } = params;

    const nowMs = Date.now();
    const expiresMs = nowMs + expiresInSeconds * 1000;
    const tokenId = `vtok_${nowMs}_${Math.random().toString(36).substring(2, 7)}`;
    const nonce = crypto.randomBytes(12).toString('hex');

    const payload: VoiceAuthorizationTokenPayload = {
      tokenId,
      userId,
      workspaceId,
      sessionId,
      capability,
      issuedAt: new Date(nowMs).toISOString(),
      expiresAt: new Date(expiresMs).toISOString(),
      nonce
    };

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.SECRET_KEY)
      .update(payloadBase64)
      .digest('base64url');

    const token = `${payloadBase64}.${signature}`;
    return { token, payload };
  }

  /**
   * Verifies and decodes a voice token, enforcing signature, expiration, revocation, and session binding.
   */
  public static verifyVoiceToken(
    tokenString: string,
    expectedSessionId?: string,
    expectedWorkspaceId?: string
  ): VoiceAuthorizationTokenPayload {
    if (!tokenString || typeof tokenString !== 'string') {
      throw new Error('UNAUTHORIZED_VOICE_TOKEN_MISSING: Voice authorization token is required.');
    }

    const parts = tokenString.split('.');
    if (parts.length !== 2) {
      throw new Error('UNAUTHORIZED_VOICE_TOKEN_MALFORMED: Malformed voice authorization token.');
    }

    const [payloadBase64, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', this.SECRET_KEY)
      .update(payloadBase64)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      throw new Error('UNAUTHORIZED_VOICE_TOKEN_INVALID_SIGNATURE: Voice authorization token signature check failed.');
    }

    let payload: VoiceAuthorizationTokenPayload;
    try {
      payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf-8'));
    } catch {
      throw new Error('UNAUTHORIZED_VOICE_TOKEN_DECODE_FAILED: Failed to parse voice token payload.');
    }

    // Check revocation
    if (this.revokedTokenIds.has(payload.tokenId)) {
      throw new Error('UNAUTHORIZED_VOICE_TOKEN_REVOKED: Voice authorization token has been revoked.');
    }

    // Check expiration
    if (new Date(payload.expiresAt).getTime() < Date.now()) {
      throw new Error('UNAUTHORIZED_VOICE_TOKEN_EXPIRED: Voice authorization token has expired.');
    }

    // Check session binding if requested
    if (expectedSessionId && payload.sessionId !== expectedSessionId) {
      throw new Error(`UNAUTHORIZED_VOICE_TOKEN_SESSION_MISMATCH: Token for session '${payload.sessionId}' cannot operate on session '${expectedSessionId}'.`);
    }

    // Check workspace binding if requested
    if (expectedWorkspaceId && payload.workspaceId !== expectedWorkspaceId) {
      throw new Error(`UNAUTHORIZED_VOICE_TOKEN_WORKSPACE_MISMATCH: Token for workspace '${payload.workspaceId}' cannot access workspace '${expectedWorkspaceId}'.`);
    }

    return payload;
  }

  /**
   * Revokes a voice authorization token.
   */
  public static revokeVoiceToken(tokenId: string): void {
    this.revokedTokenIds.add(tokenId);
  }

  public static clearForTesting(): void {
    this.revokedTokenIds.clear();
  }
}
