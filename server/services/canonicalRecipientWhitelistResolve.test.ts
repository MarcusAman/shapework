/**
 * Two gates: Nest directory first, then an exact outbound allowlist hit.
 * Prod / kill empties the allowlist. Prove addresses are not inserted into directory_people.
 * Hold writes the existing outbox and the tri-fold leaves awaiting_review.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import express from 'express';
import fs from 'fs';
import path from 'path';
import type { Server } from 'http';
import { resolveServerCanonicalRecipient } from './canonicalRecipientService.js';
import { NEST_FULL_ROSTER_77 } from '../persistence/nestRosterSeed.js';
import { resolveCanonicalRecipient } from '../../src/services/canonicalRecipientService.js';
import { marketingQuestionsRouter } from '../routes/marketingQuestionsRoute.js';
import { memoryOutbox } from './inboundEmailIngestionEngine.js';
import {
  getCanonicalMarketingTaskById,
  saveCanonicalMarketingTask,
} from '../persistence/marketingCampaignsRepository.js';

const storePath = path.join(process.cwd(), 'server', 'data', 'canonical_marketing_store_test.json');

describe('directory then exact outbound allowlist', () => {
  it('resolves whitelist marcus.aman@gmail.com with no directory or roster row', async () => {
    const rosterBefore = NEST_FULL_ROSTER_77.length;
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
    expect(resolved!.id).toBe('allowlist:marcus.aman@gmail.com');
    expect(resolved!.id.startsWith('dir_')).toBe(false);
    expect(NEST_FULL_ROSTER_77.length).toBe(rosterBefore);
    expect(NEST_FULL_ROSTER_77.some((m) => m.id === resolved!.id)).toBe(false);
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

  it('fail-closes with an empty allowlist in production and on outbound kill', async () => {
    const prevApp = process.env.APP_MODE;
    const prevMaster = process.env.OUTBOUND_MASTER_MODE;
    try {
      process.env.APP_MODE = 'production';
      const prod = await resolveServerCanonicalRecipient({
        requesterName: 'Marcus Aman',
        requesterEmail: 'marcus.aman@gmail.com',
      });
      expect(prod).toBeNull();

      delete process.env.APP_MODE;
      process.env.OUTBOUND_MASTER_MODE = 'disabled';
      const killed = await resolveServerCanonicalRecipient({
        requesterName: 'Marcus Aman',
        requesterEmail: 'marcus.aman@gmail.com',
      });
      expect(killed).toBeNull();

      const eduardo = await resolveServerCanonicalRecipient({
        requesterName: 'Eduardo Lovo',
        requesterEmail: 'eduardo.lovo@nestrealty.com',
      });
      expect(eduardo?.id).toBe('dir_eduardo_lovo_73');
    } finally {
      if (prevApp === undefined) delete process.env.APP_MODE;
      else process.env.APP_MODE = prevApp;
      if (prevMaster === undefined) delete process.env.OUTBOUND_MASTER_MODE;
      else process.env.OUTBOUND_MASTER_MODE = prevMaster;
    }
  });

  it('uses the same allowlist predicate on the UI resolver', () => {
    const prevApp = process.env.APP_MODE;
    try {
      delete process.env.APP_MODE;
      const marcus = resolveCanonicalRecipient({
        agentName: 'Marcus Aman',
        agentEmail: 'marcus.aman@gmail.com',
      });
      expect(marcus.emailVerified).toBe(true);
      expect(marcus.email).toBe('marcus.aman@gmail.com');

      const random = resolveCanonicalRecipient({
        agentName: 'Random Person',
        agentEmail: 'random.person@gmail.com',
      });
      expect(random.emailVerified).toBe(false);
      expect(random.phoneVerified).toBe(false);

      const dawn = resolveCanonicalRecipient({
        agentName: 'Dawn',
        agentEmail: 'dawn@nestrealty.com',
      });
      expect(dawn.emailVerified).toBe(false);

      const matt = resolveCanonicalRecipient({ agentName: 'Matt Orr' });
      expect(matt.emailVerified).toBe(true);
      expect(matt.email).toBe('matt.orr@nestrealty.com');

      process.env.APP_MODE = 'production';
      const marcusProd = resolveCanonicalRecipient({
        agentName: 'Marcus Aman',
        agentEmail: 'marcus.aman@gmail.com',
      });
      expect(marcusProd.emailVerified).toBe(false);
      const mattProd = resolveCanonicalRecipient({ agentName: 'Matt Orr' });
      expect(mattProd.emailVerified).toBe(true);
    } finally {
      if (prevApp === undefined) delete process.env.APP_MODE;
      else process.env.APP_MODE = prevApp;
    }
  });
});

describe('send-questions allowlist hold writes the existing outbox', () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;
  let storeSnapshot: string | null = null;
  const prevMaster = process.env.OUTBOUND_MASTER_MODE;

  beforeAll(async () => {
    storeSnapshot = fs.existsSync(storePath) ? fs.readFileSync(storePath, 'utf8') : null;
    process.env.OUTBOUND_MASTER_MODE = 'hold';
    app = express();
    app.use(express.json());
    app.use(marketingQuestionsRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (prevMaster === undefined) delete process.env.OUTBOUND_MASTER_MODE;
    else process.env.OUTBOUND_MASTER_MODE = prevMaster;
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    if (storeSnapshot === null) {
      if (fs.existsSync(storePath)) fs.unlinkSync(storePath);
    } else {
      fs.writeFileSync(storePath, storeSnapshot);
    }
  });

  it('returns 200, outbox To is only marcus.aman@gmail.com, and the tri-fold leaves awaiting_review', async () => {
    const taskId = 'tsk_trifold_allowlist_prove';
    saveCanonicalMarketingTask({
      id: taskId,
      title: 'Tri-fold',
      status: 'in_progress',
      reviewState: 'awaiting_review',
      agentName: 'Marcus Aman',
      agentEmail: 'marcus.aman@gmail.com',
      propertyAddress: '1 Prove Lane, Wilmington, NC',
      workspaceId: 'ws_wilmington',
      category: 'marketing',
    });
    expect(getCanonicalMarketingTaskById(taskId)?.reviewState).toBe('awaiting_review');

    const beforeKeys = new Set(memoryOutbox.keys());
    const res = await fetch(`${baseUrl}/api/marketing/requests/send-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: taskId,
        taskId,
        recipientName: 'Marcus Aman',
        recipientEmail: 'marcus.aman@gmail.com',
        recipientPhone: '(252) 717-0595',
        channels: ['email'],
        message: 'Your tri-fold is ready to review.',
        propertyAddress: '1 Prove Lane, Wilmington, NC',
        intent: 'delivery_complete',
        subject: 'Your marketing materials are ready — 1 Prove Lane',
        ccEmails: ['melissa.gagliardi@nestrealty.com'],
        workspaceId: 'ws_wilmington',
      }),
    });
    const body = await res.json();
    expect(res.status, JSON.stringify(body)).toBe(200);
    expect(body.success).toBe(true);
    expect(body.outboundDisabled).toBeUndefined();

    const created = [...memoryOutbox.entries()].filter(([key]) => !beforeKeys.has(key));
    expect(created.length).toBe(1);
    expect(created[0][1].recipient).toBe('marcus.aman@gmail.com');
    expect(created.every(([, row]) => row.recipient === 'marcus.aman@gmail.com')).toBe(true);

    const task = getCanonicalMarketingTaskById(taskId);
    expect(task?.reviewState).not.toBe('awaiting_review');
    expect(task?.title).toBe('Tri-fold');
    expect(
      NEST_FULL_ROSTER_77.some((m) => String(m.email || '').toLowerCase() === 'marcus.aman@gmail.com')
    ).toBe(false);
  });

  it('still 400s a random gmail that is not an allowlist hit', async () => {
    const res = await fetch(`${baseUrl}/api/marketing/requests/send-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: 'tsk_random_gmail_unresolved',
        recipientName: 'Random Person',
        recipientEmail: 'random.person@gmail.com',
        channels: ['email'],
        message: 'This must not send.',
        propertyAddress: '9 Nowhere',
        intent: 'delivery_complete',
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(String(body.error)).toContain('Could not resolve a canonical directory record');
  });
});
