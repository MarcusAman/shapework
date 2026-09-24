/**
 * The only module allowed to call nodemailer sendMail, Gmail messages.send / drafts.send,
 * or the Resend emails API. Every function checks checkOutbound before the network call.
 */
import { checkOutbound, type CheckOutboundResult } from './outboundGate.js';

export type TransportSendCounts = {
  nodemailer: number;
  gmailMessages: number;
  gmailDrafts: number;
  resend: number;
};

export type GatedSendResult = {
  sent: boolean;
  suppressed: boolean;
  held: boolean;
  gate: CheckOutboundResult;
  messageId?: string;
  info?: { messageId?: string };
  response?: { ok: boolean; status: number; json: () => Promise<any>; text: () => Promise<string> };
};

type NodemailerSender = (mail: Record<string, unknown>) => Promise<{ messageId?: string } | void>;

let nodemailerSender: NodemailerSender | null = null;
let sendCounts: TransportSendCounts = { nodemailer: 0, gmailMessages: 0, gmailDrafts: 0, resend: 0 };

export function setNodemailerTransportForTests(sender: NodemailerSender | null): void {
  nodemailerSender = sender;
}

export function resetTransportSendCounts(): void {
  sendCounts = { nodemailer: 0, gmailMessages: 0, gmailDrafts: 0, resend: 0 };
}

export function getTransportSendCounts(): TransportSendCounts {
  return { ...sendCounts };
}

function blocked(gate: CheckOutboundResult): GatedSendResult {
  return {
    sent: false,
    suppressed: true,
    held: gate.reason === 'held',
    gate,
  };
}

function mailFromGate(mail: Record<string, unknown>, gate: CheckOutboundResult): Record<string, unknown> {
  const next: Record<string, unknown> = {
    ...mail,
    to: gate.effectiveTo,
    cc: gate.effectiveCc.length ? gate.effectiveCc : undefined,
    bcc: gate.effectiveBcc.length ? gate.effectiveBcc : undefined,
  };
  return next;
}

export async function deliverNodemailer(options: {
  transporter?: { sendMail: (mail: Record<string, unknown>) => Promise<{ messageId?: string }> };
  mail: Record<string, unknown>;
  source: string;
}): Promise<GatedSendResult> {
  const gate = checkOutbound({
    to: options.mail.to as string | string[] | undefined,
    cc: options.mail.cc as string | string[] | undefined,
    bcc: options.mail.bcc as string | string[] | undefined,
    channel: 'email',
    source: options.source,
  });
  if (!gate.allowed) return blocked(gate);

  const mail = mailFromGate(options.mail, gate);
  sendCounts.nodemailer += 1;
  if (nodemailerSender) {
    const info = await nodemailerSender(mail);
    return { sent: true, suppressed: false, held: false, gate, messageId: info?.messageId, info: info || undefined };
  }
  if (!options.transporter) {
    throw new Error('Outbound email transport is fail-closed: SMTP transport is not configured.');
  }
  const info = await options.transporter.sendMail(mail);
  return { sent: true, suppressed: false, held: false, gate, messageId: info?.messageId, info };
}

export async function deliverGmailMessage(
  gmail: { users: { messages: { send: (args: Record<string, unknown>) => Promise<any> } } },
  args: {
    userId?: string;
    requestBody: Record<string, unknown>;
    to?: string | string[] | null;
    cc?: string | string[] | null;
    bcc?: string | string[] | null;
    source: string;
  }
): Promise<GatedSendResult & { response?: any }> {
  const gate = checkOutbound({
    to: args.to,
    cc: args.cc,
    bcc: args.bcc,
    channel: 'gmail',
    source: args.source,
  });
  if (!gate.allowed) return blocked(gate);
  sendCounts.gmailMessages += 1;
  const response = await gmail.users.messages.send({
    userId: args.userId || 'me',
    requestBody: args.requestBody,
  });
  return {
    sent: true,
    suppressed: false,
    held: false,
    gate,
    messageId: response?.data?.id,
    response,
  };
}

export async function deliverGmailDraft(
  gmail: { users: { drafts: { send: (args: Record<string, unknown>) => Promise<any> } } },
  args: {
    userId?: string;
    requestBody: Record<string, unknown>;
    to?: string | string[] | null;
    cc?: string | string[] | null;
    bcc?: string | string[] | null;
    source: string;
  }
): Promise<GatedSendResult & { response?: any }> {
  const gate = checkOutbound({
    to: args.to,
    cc: args.cc,
    bcc: args.bcc,
    channel: 'gmail',
    source: args.source,
  });
  if (!gate.allowed) return blocked(gate);
  sendCounts.gmailDrafts += 1;
  const response = await gmail.users.drafts.send({
    userId: args.userId || 'me',
    requestBody: args.requestBody,
  });
  return {
    sent: true,
    suppressed: false,
    held: false,
    gate,
    messageId: response?.data?.id,
    response,
  };
}

async function postResend(url: string, apiKey: string, body: unknown): Promise<GatedSendResult['response'] & { ok: boolean }> {
  sendCounts.resend += 1;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return response as GatedSendResult['response'] & { ok: boolean };
}

export async function deliverResendEmail(args: {
  apiKey?: string | null;
  to?: string | string[] | null;
  cc?: string | string[] | null;
  bcc?: string | string[] | null;
  source: string;
  payload: Record<string, unknown>;
}): Promise<GatedSendResult> {
  const gate = checkOutbound({
    to: args.to ?? (args.payload.to as string | string[] | undefined),
    cc: args.cc ?? (args.payload.cc as string | string[] | undefined),
    bcc: args.bcc ?? (args.payload.bcc as string | string[] | undefined),
    channel: 'resend',
    source: args.source,
  });
  if (!gate.allowed) return blocked(gate);
  if (!args.apiKey) {
    return {
      sent: false,
      suppressed: true,
      held: false,
      gate: { ...gate, allowed: false, reason: 'resend_unconfigured' },
    };
  }
  const payload = {
    ...args.payload,
    to: gate.effectiveTo,
    cc: gate.effectiveCc.length ? gate.effectiveCc : undefined,
    bcc: gate.effectiveBcc.length ? gate.effectiveBcc : undefined,
  };
  const response = await postResend('https://api.resend.com/emails', args.apiKey, payload);
  return { sent: Boolean(response?.ok), suppressed: false, held: false, gate, response };
}

export async function deliverResendBatch(args: {
  apiKey?: string | null;
  source: string;
  payloads: Array<Record<string, unknown>>;
}): Promise<GatedSendResult & { payloads?: Array<Record<string, unknown>> }> {
  const kept: Array<Record<string, unknown>> = [];
  let lastGate = checkOutbound({ to: [], channel: 'resend', source: args.source });
  for (const item of args.payloads) {
    const gate = checkOutbound({
      to: item.to as string | string[] | undefined,
      cc: item.cc as string | string[] | undefined,
      bcc: item.bcc as string | string[] | undefined,
      channel: 'resend',
      source: args.source,
    });
    lastGate = gate;
    if (!gate.allowed) continue;
    kept.push({
      ...item,
      to: gate.effectiveTo,
      cc: gate.effectiveCc.length ? gate.effectiveCc : undefined,
      bcc: gate.effectiveBcc.length ? gate.effectiveBcc : undefined,
    });
  }
  if (!kept.length) return { ...blocked(lastGate), payloads: [] };
  if (!args.apiKey) {
    return {
      sent: false,
      suppressed: true,
      held: false,
      gate: { ...lastGate, allowed: false, reason: 'resend_unconfigured' },
      payloads: [],
    };
  }
  const response = await postResend('https://api.resend.com/emails/batch', args.apiKey, kept);
  return { sent: Boolean(response?.ok), suppressed: false, held: false, gate: lastGate, response, payloads: kept };
}
