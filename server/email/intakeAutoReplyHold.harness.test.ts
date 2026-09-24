/**
 * Intake auto-reply must not leave the process while outbound is held.
 * Photo requests to a Nest address are recorded and never handed to the transport.
 *
 * Env is pinned before any import so a developer .env or shell cannot flip the driver
 * or the outbound mode. production + an explicit memory driver is refused before send;
 * hold still queues, and checkOutbound is what marks the row held.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('VITEST', 'true');
  vi.stubEnv('PERSISTENCE_DRIVER', 'memory');
  vi.stubEnv('STORAGE_DRIVER', 'memory');
  vi.stubEnv('OUTBOUND_MASTER_MODE', 'hold');
  vi.stubEnv('APP_MODE', 'production');
  vi.stubEnv('APP_ENV', 'development');
  vi.stubEnv('IS_PRODUCTION', 'false');
  vi.stubEnv('ALLOW_EXTERNAL_DISPATCH', 'false');
  vi.stubEnv('DISABLE_EMAIL_WHITELIST', 'true');
});

import { ingestInboundEmailToTask, memoryOutbox } from '../services/inboundEmailIngestionEngine.js';
import {
  resetNotificationPreferencesCacheForTesting,
  saveUserNotificationPreferencesAsync,
} from '../persistence/notificationPreferencesRepository.js';
import { _resetTombstonesForTests } from '../persistence/intakeTombstoneRepository.js';
import {
  getTransportSendCounts,
  resetTransportSendCounts,
  setNodemailerTransportForTests,
} from './gatedTransport.js';

const RECIPIENT = 'matt.orr@nestrealty.com';

describe('intake photo-request auto-reply at hold', () => {
  const prev = {
    master: process.env.OUTBOUND_MASTER_MODE,
    app: process.env.APP_MODE,
    appEnv: process.env.APP_ENV,
    allow: process.env.ALLOW_EXTERNAL_DISPATCH,
    disableWl: process.env.DISABLE_EMAIL_WHITELIST,
    persistence: process.env.PERSISTENCE_DRIVER,
    storage: process.env.STORAGE_DRIVER,
  };
  const transportCalls: string[] = [];

  afterEach(() => {
    setNodemailerTransportForTests(null);
    resetTransportSendCounts();
    restore('OUTBOUND_MASTER_MODE', prev.master);
    restore('APP_MODE', prev.app);
    restore('APP_ENV', prev.appEnv);
    restore('ALLOW_EXTERNAL_DISPATCH', prev.allow);
    restore('DISABLE_EMAIL_WHITELIST', prev.disableWl);
    restore('PERSISTENCE_DRIVER', prev.persistence);
    restore('STORAGE_DRIVER', prev.storage);
  });

  function restore(name: string, value: string | undefined) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }

  it('queues the photo_request, sends nothing, and records a held row for matt.orr@nestrealty.com at hold + production', async () => {
    process.env.OUTBOUND_MASTER_MODE = 'hold';
    process.env.APP_MODE = 'production';
    process.env.PERSISTENCE_DRIVER = 'memory';
    process.env.STORAGE_DRIVER = 'memory';
    process.env.NODE_ENV = 'test';
    process.env.ALLOW_EXTERNAL_DISPATCH = 'false';
    process.env.DISABLE_EMAIL_WHITELIST = 'true';
    resetTransportSendCounts();
    resetNotificationPreferencesCacheForTesting();
    _resetTombstonesForTests();
    transportCalls.length = 0;
    setNodemailerTransportForTests(async (mail) => {
      const to = Array.isArray(mail.to) ? mail.to.join(',') : String(mail.to || '');
      transportCalls.push(to);
      return { messageId: `should_not_send_${Date.now()}` };
    });

    await saveUserNotificationPreferencesAsync({
      userId: `email:${RECIPIENT}`,
      emailEnabled: true,
      intakeConfirmedEnabled: true,
      photoRequestEnabled: true,
      workspaceId: 'ws_wilmington',
    });

    const before = new Set(memoryOutbox.keys());
    const address = `${10000 + Math.floor(Math.random() * 80000)} Gatehouse Proof Ln`;
    const result = await ingestInboundEmailToTask({
      from: `Matt Orr <${RECIPIENT}>`,
      to: 'asknora@nestrealty.com',
      subject: `${address} Marketing Flyer Request`,
      textContent: `Please prepare a listing flyer for ${address}, Wilmington, NC.`,
      messageId: `msg_hold_photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      attachments: [],
      workspaceId: 'ws_wilmington',
    });

    expect(result.success, JSON.stringify({
      action: (result as { actionTaken?: string }).actionTaken,
      message: result.message,
      email: result.agentEmail,
      addr: result.propertyAddress,
      photos: result.photosCount,
      skipped: (result as { skipped?: boolean }).skipped,
      reason: (result as { reason?: string }).reason,
    })).toBe(true);

    const created = [...memoryOutbox.entries()].filter(([key]) => !before.has(key));
    const photo = created.filter(([, row]) => row.messageType === 'photo_request');
    expect(photo.length, JSON.stringify({
      action: (result as { actionTaken?: string }).actionTaken,
      message: result.message,
      addr: result.propertyAddress,
      created: created.map(([, row]) => ({ type: row.messageType, status: row.status, to: row.recipient, subject: row.subject })),
    })).toBeGreaterThan(0);
    for (const [, row] of photo) {
      expect(String(row.recipient || '').toLowerCase()).toBe(RECIPIENT);
      expect(String(row.subject || '')).toContain('Listing Photos Needed');
    }

    expect(transportCalls).toEqual([]);
    expect(getTransportSendCounts()).toEqual({
      nodemailer: 0,
      gmailMessages: 0,
      gmailDrafts: 0,
      resend: 0,
    });
    for (const [, row] of photo) {
      expect(String(row.status || '').toLowerCase()).toBe('held');
    }
    for (const [, row] of created) {
      expect(String(row.status || '').toLowerCase()).not.toBe('sent');
    }
  });
});
