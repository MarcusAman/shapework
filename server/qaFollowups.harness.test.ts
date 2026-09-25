/**
 * Minor follow-ups after 1295ea0. Each case fails until the small fix lands.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { sendPhotoUploadRequestEmail } from './email/emailProvider.js';
import { classifyOutboundEmailResult } from './email/outboundSendOutcome.js';
import { ContactSummaryCard } from '../src/components/marketing/ContactSummaryCard.js';

describe('photo upload log waits for the gate', () => {
  const previous = process.env.OUTBOUND_MASTER_MODE;
  const allow = process.env.ALLOW_EXTERNAL_DISPATCH;

  afterEach(() => {
    if (previous === undefined) delete process.env.OUTBOUND_MASTER_MODE;
    else process.env.OUTBOUND_MASTER_MODE = previous;
    if (allow === undefined) delete process.env.ALLOW_EXTERNAL_DISPATCH;
    else process.env.ALLOW_EXTERNAL_DISPATCH = allow;
    vi.restoreAllMocks();
  });

  it('logs the gate outcome for a held send and does not say dispatching', async () => {
    process.env.OUTBOUND_MASTER_MODE = 'hold';
    process.env.ALLOW_EXTERNAL_DISPATCH = 'false';
    const lines: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      lines.push(args.map(String).join(' '));
    });
    await sendPhotoUploadRequestEmail({
      toEmail: 'matt.orr@nestrealty.com',
      agentName: 'Matt Orr',
      propertyAddress: '1 Held Lane',
      driveUploadUrl: 'https://drive.google.com/drive/folders/1Held',
    });
    const logged = lines.join('\n');
    expect(logged).not.toMatch(/dispatching/i);
    expect(logged).toMatch(/\[Outbound\] held:/);
    expect(logged).not.toMatch(/matt\.orr@nestrealty\.com/);
    expect(logged).not.toMatch(/password|secret|private_key/i);
  });

  it('logs dispatching only after the gate allows the photo email', async () => {
    process.env.OUTBOUND_MASTER_MODE = 'live';
    const lines: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      lines.push(args.map(String).join(' '));
    });
    await sendPhotoUploadRequestEmail({
      toEmail: 'marcus.aman@gmail.com',
      agentName: 'Marcus Aman',
      propertyAddress: '2 Live Lane',
      driveUploadUrl: 'https://drive.google.com/drive/folders/1Live',
    });
    const logged = lines.join('\n');
    expect(logged).toMatch(/Nora requesting listing photos/);
    expect(logged).not.toMatch(/\[Outbound\] held:/);
    expect(logged).not.toMatch(/\[Outbound\] blocked:/);
  });
});

describe('a held send is labeled held', () => {
  it('does not call a held photo send queued', () => {
    const held = classifyOutboundEmailResult({
      success: true,
      suppressed: true,
      held: true,
      reason: 'held',
    });
    expect(held.communicationStatus).toBe('held');
    expect(held.communicationStatus).not.toBe('queued');
  });

  it('shows Held on the contact card, not Queued', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContactSummaryCard, {
        contactSummary: {
          requestId: 'req_held',
          requesterName: 'Marcus Aman',
          requesterChannel: 'email',
          waitingOn: 'agent',
          communicationBlockedByPolicy: false,
          lastNoraContact: {
            summary: 'Photo request held',
            channel: 'email',
            status: 'held',
            timestamp: '2026-09-24T12:00:00.000Z',
          },
        },
      })
    );
    expect(html).toContain('Held');
    expect(html).not.toContain('Queued');
  });
});

describe('delivery email copy', () => {
  it('tells the reader to reply to the email, not to a text', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'server/routes/marketingQuestionsRoute.ts'), 'utf8');
    const start = src.indexOf('const deliveryBody');
    const end = src.indexOf('const outboundMessage');
    const emailTemplate = src.slice(start, end);
    expect(emailTemplate).toContain('Reply to this email');
    expect(emailTemplate).not.toContain('Respond to this text');
  });
});
