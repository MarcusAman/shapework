/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Google Chat routes. Session plus manage_integrations.
 * Mutating requests also require the CSRF header.
 */

import { Router } from 'express';
import { GoogleChatService } from '../../services/googleChatService.js';
import { requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission, AuthenticatedRequest } from '../../auth/auth.js';
import { csrfProtection } from '../../auth/csrf.js';

export function getGoogleChatRouter(): Router {
  const router = Router();

  router.use((req, res, next) => {
    const authed = req as AuthenticatedRequest;
    requireAuth(authed, res, () => {
      void resolveWorkspaceContext(authed, res, () => {
        requireWorkspaceMembership(authed, res, () => {
          requirePermission('manage_integrations')(authed, res, () => {
            csrfProtection(req, res, next);
          });
        });
      });
    });
  });

  router.get('/spaces', async (req: any, res) => {
    try {
      const wsId = req.query.workspaceId || req.workspace?.id || 'nest-realty-demo';
      const spaces = await GoogleChatService.getSpacesAndDMs(wsId);
      return res.json({ success: true, spaces, count: spaces.length });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/messages/:spaceId', async (req: any, res) => {
    try {
      const wsId = req.query.workspaceId || req.workspace?.id || 'nest-realty-demo';
      const messages = await GoogleChatService.getMessages(req.params.spaceId, wsId);
      return res.json({ success: true, spaceId: req.params.spaceId, messages, count: messages.length });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/send', async (req: any, res) => {
    try {
      const wsId = req.body?.workspaceId || req.workspace?.id || 'nest-realty-demo';
      const { spaceId, senderName = 'Ryan Crecelius', senderEmail = 'ryan@nestrealty.com', text, attachments } = req.body || {};
      if (!spaceId || !text) {
        return res.status(400).json({ success: false, error: 'spaceId and text are required' });
      }
      const result = await GoogleChatService.sendMessage({
        spaceId,
        senderName,
        senderEmail,
        text,
        attachments,
        workspaceId: wsId
      });
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  router.get('/roster', async (req, res) => {
    try {
      const roster = GoogleChatService.getRoster();
      const query = (req.query.q as string || '').toLowerCase().trim();
      const filtered = query
        ? roster.filter(p =>
            p.displayName.toLowerCase().includes(query) ||
            p.email.toLowerCase().includes(query) ||
            p.role.toLowerCase().includes(query) ||
            p.officeNames.some(o => o.toLowerCase().includes(query))
          )
        : roster;
      return res.json({ success: true, roster: filtered, count: filtered.length, totalMembers: roster.length });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  router.post('/create-dm', async (req, res) => {
    try {
      const { recipientEmail, currentUserName = 'Ryan Crecelius', currentUserEmail = 'ryan@nestrealty.com' } = req.body || {};
      if (!recipientEmail) {
        return res.status(400).json({ success: false, error: 'recipientEmail is required' });
      }
      const space = GoogleChatService.createOrGetDirectMessage(recipientEmail, currentUserName, currentUserEmail);
      return res.json({ success: true, space });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
