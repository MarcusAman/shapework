/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { encryptToken, decryptToken } from '../integrations/shared/integrationCredentialVault.js';

export const userToolCredentialsRouter = express.Router();

// In-memory / persistent user tool credentials store
const userToolStore = new Map<string, Record<string, {
  connected: boolean;
  connectedAt?: string;
  accountEmail?: string;
  toolType: string;
  lastSyncedAt?: string;
  statusBadge: 'connected' | 'needs_attention' | 'disconnected';
  encryptedCredentials?: string;
}>>();

// Seed demo defaults for primary test users
userToolStore.set('usr_ryan', {
  google: { connected: true, connectedAt: '2026-08-15T10:00:00Z', accountEmail: 'ryan@nestrealty.com', toolType: 'google', statusBadge: 'connected' },
  rechat: { connected: true, connectedAt: '2026-08-15T10:05:00Z', accountEmail: 'ryan@nestrealty.com', toolType: 'rechat', statusBadge: 'connected' },
  dotloop: { connected: true, connectedAt: '2026-08-15T10:10:00Z', accountEmail: 'ryan@nestrealty.com', toolType: 'dotloop', statusBadge: 'connected' },
  maxa: { connected: true, connectedAt: '2026-08-15T10:15:00Z', accountEmail: 'melissa.gagliardi@nestrealty.com', toolType: 'maxa', statusBadge: 'connected' },
  basecamp: { connected: false, toolType: 'basecamp', statusBadge: 'disconnected' },
  quickbooks: { connected: false, toolType: 'quickbooks', statusBadge: 'disconnected' }
});

function getUserIdFromReq(req: Request): string {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer usr_')) {
    return authHeader.replace('Bearer ', '').trim();
  }
  return req.headers['x-user-id']?.toString() || 'usr_ryan';
}

/**
 * GET /api/user/tools/status
 * Returns connection status for all 6 core brokerage tools
 */
userToolCredentialsRouter.get('/status', (req: Request, res: Response) => {
  const userId = getUserIdFromReq(req);
  const userTools = userToolStore.get(userId) || {
    google: { connected: false, toolType: 'google', statusBadge: 'disconnected' },
    rechat: { connected: false, toolType: 'rechat', statusBadge: 'disconnected' },
    dotloop: { connected: false, toolType: 'dotloop', statusBadge: 'disconnected' },
    maxa: { connected: false, toolType: 'maxa', statusBadge: 'disconnected' },
    basecamp: { connected: false, toolType: 'basecamp', statusBadge: 'disconnected' },
    quickbooks: { connected: false, toolType: 'quickbooks', statusBadge: 'disconnected' }
  };

  const connectedCount = Object.values(userTools).filter(t => t.connected).length;

  return res.json({
    success: true,
    userId,
    connectedCount,
    totalTools: 6,
    tools: userTools
  });
});

/**
 * POST /api/user/tools/connect
 * Connects a tool with user credentials / API token
 */
userToolCredentialsRouter.post('/connect', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    const { toolType, email, password, apiKey, token } = req.body || {};

    if (!toolType) {
      return res.status(400).json({ success: false, error: 'toolType is required' });
    }

    const current = userToolStore.get(userId) || {
      google: { connected: false, toolType: 'google', statusBadge: 'disconnected' },
      rechat: { connected: false, toolType: 'rechat', statusBadge: 'disconnected' },
      dotloop: { connected: false, toolType: 'dotloop', statusBadge: 'disconnected' },
      maxa: { connected: false, toolType: 'maxa', statusBadge: 'disconnected' },
      basecamp: { connected: false, toolType: 'basecamp', statusBadge: 'disconnected' },
      quickbooks: { connected: false, toolType: 'quickbooks', statusBadge: 'disconnected' }
    };

    const credentialPayload = JSON.stringify({ email, password, apiKey, token });
    const encryptedCredentials = await encryptToken(credentialPayload);

    current[toolType] = {
      connected: true,
      connectedAt: new Date().toISOString(),
      accountEmail: email || 'user@nestrealty.com',
      toolType,
      lastSyncedAt: new Date().toISOString(),
      statusBadge: 'connected',
      encryptedCredentials
    };

    userToolStore.set(userId, current);

    console.log(`[User Tools] Connected ${toolType} for user ${userId} (${email || 'OAuth Token'}).`);

    return res.json({
      success: true,
      message: `Successfully connected ${toolType}`,
      tool: current[toolType],
      allTools: current
    });
  } catch (err: any) {
    console.error('[User Tools Connect Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/user/tools/disconnect
 * Disconnects a tool
 */
userToolCredentialsRouter.post('/disconnect', (req: Request, res: Response) => {
  const userId = getUserIdFromReq(req);
  const { toolType } = req.body || {};

  const current = userToolStore.get(userId) || {};
  if (current[toolType]) {
    current[toolType] = {
      connected: false,
      toolType,
      statusBadge: 'disconnected'
    };
    userToolStore.set(userId, current);
  }

  return res.json({ success: true, message: `Disconnected ${toolType}` });
});
