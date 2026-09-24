/**
 * Intake auto-reply must not leave the process while outbound is held.
 * Photo requests to a Nest address are recorded and never handed to the transport.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { ingestInboundEmailToTask, memoryOutbox } from '../services/inboundEmailIngestionEngine.js';
import { saveUserNotificationPreferencesAsync } from '../persistence/notificationPreferencesRepository.js';
import {
  getTransportSendCounts,
  resetTransportSendCounts,
  setNodemailerTransportForTests,
} from './gatedTransport.js';

describe('intake photo-request auto-reply at hold', () => {
  const prev = {
    master: process.env.OUTBOUND_MASTER_MODE,
    app: process.env.APP_MODE,
    allow: process.env.ALLOW_EXTERNAL_DISPATCH,
    disableWl: process.env.DISABLE_EMAIL_WHITELIST,
  };
  const transportCalls: string[] = [];

  afterEach(() => {
    setNodemailerTransportForTests(null);
    resetTransportSendCounts();
    restore('OUTBOUND_MASTER_MODE', prev.master);
    restore('APP_MODE', prev.app);
    restore('ALLOW_EXTERNAL_DISPATCH', prev.allow);
    restore('DISABLE_EMAIL_WHITELIST', prev.disableWl);
  });

  function restore(name: string, value: string | undefined) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }

  it('sends nothing and records a suppressed/held row for matt.orr@nestrealty.com at hold + production', async () => {
    process.env.OUTBOUND_MASTER_MODE = 'hold';
    process.env.APP_MODE = 'production';
    delete process.env.ALLOW_EXTERNAL_DISPATCH;
    process.env.DISABLE_EMAIL_WHITELIST = 'true';
    resetTransportSendCounts();
    transportCalls.length = 0;
    setNodemailerTransportForTests(async (mail) => {
      const to = Array.isArray(mail.to) ? mail.to.join(',') : String(mail.to || '');
      transportCalls.push(to);
      return { messageId: `should_not_send_${Date.now()}` };
    });

    await saveUserNotificationPreferencesAsync({
      userId: 'email:matt.orr@nestrealty.com',
      emailEnabled: true,
      intakeConfirmedEnabled: true,
      photoRequestEnabled: true,
      workspaceId: 'ws_wilmington',
    });

    const before = new Set(memoryOutbox.keys());
    const address = `${10000 + Math.floor(Math.random() * 80000)} Gatehouse Proof Ln`;
    const result = await ingestInboundEmailToTask({
      from: 'Matt Orr <matt.orr@nestrealty.com>',
      to: 'asknora@nestrealty.com',
      subject: `${address} Marketing Flyer Request`,
      textContent: `Please prepare a listing flyer for ${address}, Wilmington, NC.`,
      messageId: `msg_hold_photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      attachments: [],
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
    const photo = created.filter(([, row]) => row.messageType === 'photo_request' || row.subject?.includes('Listing Photos Needed') || row.subject?.includes('Photos Needed'));
    expect(photo.length, JSON.stringify({
      action: (result as { actionTaken?: string }).actionTaken,
      message: result.message,
      addr: result.propertyAddress,
      created: created.map(([, row]) => ({ type: row.messageType, status: row.status, to: row.recipient, subject: row.subject })),
    })).toBeGreaterThan(0);

    for (const [, row] of photo) {
      expect(String(row.recipient || '').toLowerCase()).toBe('matt.orr@nestrealty.com');
      expect(String(row.status || '').toLowerCase()).toMatch(/held|suppressed/);
    }
    for (const [, row] of created) {
      expect(String(row.status || '').toLowerCase()).not.toBe('sent');
    }
    expect(transportCalls).toEqual([]);
    expect(getTransportSendCounts()).toEqual({
      nodemailer: 0,
      gmailMessages: 0,
      gmailDrafts: 0,
      resend: 0,
    });
  });
});
