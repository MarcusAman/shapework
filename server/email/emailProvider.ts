/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import nodemailer from 'nodemailer';
import { renderNoraEmailLayout, escapeEmailHtml, type NoraEmailStatus } from './noraEmailLayout.js';
import path from 'path';
import { evaluateOutboundDispatchGuard } from './outboundDispatchGuards.js';
import { EXPLICIT_OUTBOUND_ALLOWLIST } from '../../src/lib/outboundAllowlistGate.js';
import { checkOutbound } from './outboundGate.js';
import { deliverNodemailer } from './gatedTransport.js';

function readConfiguredSmtpSecret(): string {
  return String(
    process.env.NORA_EMAIL_PASSWORD ||
    process.env.SMTP_PASSWORD ||
    process.env.GOOGLE_SMTP_PASS ||
    ''
  ).trim();
}

export const SMTP_SECRET_MISSING = 'Outbound email transport is fail-closed: NORA_EMAIL_PASSWORD is not set.';

export const NORA_EMAIL_CONFIG = {
  user: process.env.NORA_EMAIL || 'asknora@nestrealty.com',
  get password() {
    return readConfiguredSmtpSecret();
  },
  fromName: 'Nora (Nest Realty Operations)',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true
};

/**
 * Creates the nodemailer transporter for Nora's Gmail account.
 */
export function getNoraTransporter() {
  const pass = readConfiguredSmtpSecret();
  if (!pass) {
    throw new Error(SMTP_SECRET_MISSING);
  }
  return nodemailer.createTransport({
    host: NORA_EMAIL_CONFIG.host,
    port: NORA_EMAIL_CONFIG.port,
    secure: NORA_EMAIL_CONFIG.secure,
    auth: {
      user: NORA_EMAIL_CONFIG.user,
      pass
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false
    }
  });
}

type EmailThreadContext = {
  workspaceId?: string; requestId?: string; taskId?: string; threadId?: string;
  inReplyTo?: string; references?: string | string[];
};

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
  setupUrl?: string;
  smtpAccepted?: boolean;
  smtpResponse?: string;
  acceptedRecipients?: string[];
  rejectedRecipients?: string[];
  confirmedReceipt?: boolean;
  suppressed?: boolean;
  held?: boolean;
  reason?: string;
  /** True only if transport conclusively did not accept this recipient. */
  retrySafe?: boolean;
}

/** Public email links must survive a deploy and must never point at a local host. */
export function toAbsolutePublicUrl(value?: string | null): string {
  const raw = String(value || '').trim();
  if (!raw || raw.startsWith('//')) return '';
  try {
    const base = process.env.PUBLIC_APP_URL || process.env.PUBLIC_BASE_URL || 'https://shapework.co';
    const url = raw.startsWith('/') ? new URL(raw, base) : new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password ||
        /^(localhost|127\.|0\.|\[?::1\]?)/i.test(url.hostname) || url.hostname.endsWith('.localhost')) return '';
    return url.toString();
  } catch { return ''; }
}

/**
 * Strict active whitelist for outgoing email testing.
 * Under no circumstances will emails be sent to any address outside this list in test/staging.
 */
export const ALLOWED_TEST_EMAIL_RECIPIENTS = EXPLICIT_OUTBOUND_ALLOWLIST;

/**
 * Explicit allowlist membership. APP_MODE, live mode, and DISABLE_EMAIL_WHITELIST do not widen it.
 * Whether a message may leave the process is checkOutbound, enforced in the transport.
 */
export function isAllowedEmailRecipient(email?: string): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  if (!normalized) return false;
  return ALLOWED_TEST_EMAIL_RECIPIENTS.some((allowed) => allowed.toLowerCase() === normalized);
}

export function getOutboundMasterMode(): 'disabled' | 'hold' | 'live' {
  const mode = (process.env.OUTBOUND_MASTER_MODE || process.env.OUTBOUND_MODE || 'hold').toLowerCase().trim();
  if (mode === 'live') return 'live';
  if (mode === 'hold') return 'hold';
  return 'disabled';
}

export function getNoraAutomationMode(): string {
  return (process.env.NORA_AUTOMATION_MODE || 'shadow').toLowerCase().trim();
}

export async function isRecipientSuppressed(recipientEmail?: string): Promise<{ suppressed: boolean; reason?: string }> {
  if (!recipientEmail) return { suppressed: false };
  const gate = checkOutbound({ to: recipientEmail, channel: 'email', source: 'isRecipientSuppressed' });
  if (!gate.allowed && gate.reason !== 'held') {
    return { suppressed: true, reason: gate.reason };
  }
  return { suppressed: false };
}

function suppressedByOutboundGate(to?: string | string[], cc?: string | string[], source = 'emailProvider'): EmailDispatchResult | null {
  const gate = checkOutbound({ to, cc, channel: 'email', source });
  if (gate.allowed) return null;
  return {
    success: true,
    suppressed: true,
    held: gate.reason === 'held',
    reason: gate.reason,
    smtpAccepted: false,
    confirmedReceipt: false,
    acceptedRecipients: [],
    rejectedRecipients: [],
    retrySafe: true,
    messageId: `suppressed_safe_mode_${Date.now()}`,
  } as EmailDispatchResult;
}

/** Render Nora's compact, logo-only email layout. */
export function renderNestEditorialEmailTemplate(options: {
  title: string; badgeText?: string; status?: NoraEmailStatus; serifTitle?: string; metadataDate?: string;
  propertyAddress?: string; greetingName?: string; bodyParagraphs?: string[];
  ctaButton?: { label: string; url: string }; infoBox?: { title: string; text: string };
  featureList?: { title: string; desc: string }[]; deliverables?: string[]; footnote?: string;
}): string {
  const status = options.status || (/NEEDED|SECURITY|ACCOUNT READY/i.test(options.badgeText || '') ? 'ACTION NEEDED'
    : /APPROVED|ONLINE|COMPLETE/i.test(options.badgeText || '') ? 'COMPLETE' : 'RECEIVED');
  const p = (body: string) => `<p style="margin:0 0 14px;">${body}</p>`;
  const bodyHtml = [
    options.greetingName ? p(`Hi ${escapeEmailHtml(options.greetingName)},`) : '',
    ...(options.bodyParagraphs || []).map(p),
    options.deliverables?.length ? `<ul style="margin:18px 0;padding-left:20px;">${options.deliverables.map(item => `<li style="padding-bottom:6px;">${escapeEmailHtml(item)}</li>`).join('')}</ul>` : '',
    options.infoBox && !/drive folder ready/i.test(options.infoBox.title) ? p(`<strong>${options.infoBox.title}</strong><br>${options.infoBox.text}`) : '',
    ...(options.featureList || []).map(item => p(`<strong>${item.title}</strong> ${item.desc}`)),
  ].join('');
  return renderNoraEmailLayout({ title: options.serifTitle || options.title, status, bodyHtml,
    propertyAddress: options.propertyAddress, metadata: options.metadataDate, cta: options.ctaButton, footnote: options.footnote });
}

/**
 * Sends a system verification test email to verify mailbox connectivity.
 */
export async function sendSystemVerificationEmail(toEmail: string = 'marcus.aman@gmail.com'): Promise<EmailDispatchResult> {
  console.log(`[Email] Dispatching live system verification email to: ${toEmail}`);

  const verificationHeld = suppressedByOutboundGate(toEmail, undefined, 'sendVerificationEmail');
  if (verificationHeld) return verificationHeld;

  const htmlContent = renderNestEditorialEmailTemplate({
    title: 'Nest Realty • Systems Active',
    badgeText: '● NORA ONLINE',
    serifTitle: 'Operations<br/>Active',
    metadataDate: 'Nora email verification',
    greetingName: 'Marcus',
    bodyParagraphs: [
      'This is a live system verification email from Nora on Shapework for <strong>Nest Realty Wilmington</strong>.',
      'This message checks the Nora email connection and the Nest Realty notification layout.'
    ],
    infoBox: {
      title: 'Mailbox Status: Connected',
      text: `Active Sender: ${NORA_EMAIL_CONFIG.user} via Google Workspace SMTP (Port ${NORA_EMAIL_CONFIG.port} Secure TLS)`
    },
    deliverables: [
      'Clear status labels and one primary action',
      'Single-Dispatch Intake Confirmation with Manager CC',
      'In-Progress, Need Info & Final Completion Notifications'
    ],
    ctaButton: {
      label: 'Open Nest Ops Console',
      url: 'https://shapework.co/app'
    },
    footnote: 'You received this email because a live email design verification test was requested.'
  });

  return sendEmail({
    to: toEmail,
    subject: 'Nest Ops Online — Luxury Editorial Design Verification from Nora',
    text: `Hi Marcus,\n\nThis is a live system verification email from Nora at asknora@nestrealty.com on Shapework.\n\nOutbound emails now use the Dark Forest Hunter Green editorial layout with the Nest Realty logo.\n\nBest,\nNora (Nest Operations)`,
    html: htmlContent
  });
}

/**
 * Sends an official Nest Ops onboarding invitation email from Nora.
 */
export async function sendWelcomeInvitationEmail(
  recipientEmail: string,
  recipientName: string,
  setupUrl: string,
  roleName: string = 'Team Member'
): Promise<EmailDispatchResult> {
  console.log(`[Email] Nora dispatching welcome invitation to: ${recipientEmail} (${recipientName})`);

  const welcomeHeld = suppressedByOutboundGate(recipientEmail, undefined, 'sendWelcomeInvitationEmail');
  if (welcomeHeld) return { ...welcomeHeld, setupUrl };

  if (process.env.NODE_ENV === 'test') {
    return {
      success: true,
      messageId: `test_${Date.now()}`,
      setupUrl
    };
  }

  const htmlContent = renderNestEditorialEmailTemplate({
    title: 'Welcome to Nest Realty Ops',
    badgeText: '● ACCOUNT READY',
    serifTitle: 'Welcome to<br/>Nest Ops',
    metadataDate: 'WILMINGTON HQ | ONBOARDING',
    greetingName: recipientName,
    bodyParagraphs: [
      `Your account for <strong>Nest Realty Wilmington</strong> is ready on Shapework.`,
      `As <strong>${roleName}</strong>, your workspace has been configured with direct access to Ask Nora, Role & Escalation Map, Vendor Dispatch, Directory, Marketing Intake, and Market Intelligence.`
    ],
    ctaButton: {
      label: 'Set Up My Password',
      url: setupUrl
    },
    footnote: 'If you did not expect this invitation, you can safely ignore this email.'
  });

  return sendEmail({
    to: recipientEmail,
    subject: `Welcome to Nest Ops — Set Up Your Password (${recipientName})`,
    text: `Hi ${recipientName},\n\nYour Shapework account for Nest Realty Wilmington is ready.\n\nPlease use the following link to set up your password:\n${setupUrl}\n\nThis link is valid for 7 days.\n\nBest,\nNora (Nest Operations)`,
    html: htmlContent
  });
}

/**
 * Sends a password reset email to the specified address.
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
  console.log(`[Email] Dispatching password reset request for: ${email}`);

  const resetHeld = suppressedByOutboundGate(email, undefined, 'sendPasswordResetEmail');
  if (resetHeld) return true;

  const htmlContent = renderNestEditorialEmailTemplate({
    title: 'Reset Your Shapework Password',
    badgeText: '● SECURITY NOTICE',
    serifTitle: 'Password<br/>Reset',
    metadataDate: 'WILMINGTON OPS | SECURITY',
    bodyParagraphs: [
      'We received a request to reset your Shapework password for <strong>Nest Realty Wilmington</strong>.',
      'Click the button below to create a new password. For security, this link will expire in 30 minutes.'
    ],
    ctaButton: {
      label: 'Reset Password',
      url: resetUrl
    },
    footnote: 'If you did not request a password reset, you can safely ignore this email.'
  });

  const res = await sendEmail({
    to: email,
    subject: `Reset your Shapework password`,
    text: `We received a request to reset your Shapework password. Use the secure link below to create a new password:\n\n${resetUrl}\n\nThis link expires in 30 minutes.\n\nBest,\nNora (Nest Operations)`,
    html: htmlContent
  });

  return res.success;
}

/**
 * Sends a branded email from asknora@nestrealty.com requesting listing photos via Google Drive.
 */
export async function sendPhotoUploadRequestEmail(options: {
  toEmail: string;
  agentName: string;
  propertyAddress: string;
  driveUploadUrl?: string;
  trackerUrl?: string;
  requestedItems?: string[];
} & EmailThreadContext): Promise<EmailDispatchResult> {
  const { toEmail, agentName, propertyAddress, driveUploadUrl, requestedItems = ['Exterior photos', 'Kitchen & Living Areas', 'Primary Suite', 'Floorplans / Aerials'] } = options;

  const photoHeld = suppressedByOutboundGate(toEmail, undefined, 'sendPhotoUploadRequestEmail');
  if (photoHeld) {
    const outcome = (photoHeld as any).held ? 'held' : 'blocked';
    console.log(`[Outbound] ${outcome}: ${(photoHeld as any).reason || outcome}`);
    return photoHeld;
  }

  console.log(`[Email] Nora requesting listing photos to ${toEmail} for ${propertyAddress}`);



  const htmlContent = renderNestEditorialEmailTemplate({
    title: 'Listing Photos Needed',
    badgeText: '● ASSETS NEEDED',
    serifTitle: 'Listing Photos<br/>Needed',
    metadataDate: 'ACTIVE REQUEST | PRODUCTION STAGED',
    propertyAddress,
    greetingName: agentName.split(' ')[0],
    bodyParagraphs: [
      `Hey it's Nora from Nest. If you don't mind, send me those photos so we can get moving on that request for you!`,
      `We received your marketing collateral request for <strong>${propertyAddress}</strong>. To get started, please reply to this email with your high-resolution photos attached.`
    ],
    infoBox: {
      title: 'Reply with your listing photos',
      text: `Attach the original photo files to your reply. Nora will add them to the existing marketing request.`
    },
    deliverables: requestedItems,
    ctaButton: toAbsolutePublicUrl(options.trackerUrl || driveUploadUrl) ? {
      label: 'View your request',
      url: toAbsolutePublicUrl(options.trackerUrl || driveUploadUrl)
    } : { label: 'Reply with photos', url: 'mailto:asknora@nestrealty.com' },
    footnote: 'Your photos will stay with this request for the marketing team.'
  });

  return sendEmail({
    to: toEmail,
    replyTo: 'asknora@nestrealty.com',
    workspaceId: options.workspaceId,
    requestId: options.requestId,
    taskId: options.taskId,
    threadId: options.threadId,
    inReplyTo: options.inReplyTo,
    references: options.references,
    subject: `Photos Needed for ${propertyAddress} — Nora @ Nest Realty`,
    text: `Hi ${agentName.split(' ')[0]},\n\nHey it's Nora from Nest. If you don't mind, send me those photos so we can get moving on that request for you!\n\nReply to this email with your photos attached.${options.trackerUrl ? `\n\nView your request: ${options.trackerUrl}` : ''}\n\nBest,\nNora (Nest Operations)\nasknora@nestrealty.com`,
    html: htmlContent
  });
}

/**
 * Sends an intake confirmation email from asknora@nestrealty.com when an agent sends a marketing request via email.
 */
export async function sendMarketingIntakeConfirmationEmail(options: {
  toEmail: string;
  agentName: string;
  propertyAddress: string;
  deliverables: string[];
  assignedLead: string;
  cc?: string;
  trackerUrl?: string;
} & EmailThreadContext): Promise<EmailDispatchResult> {
  const { toEmail, agentName, propertyAddress, deliverables, assignedLead, cc, trackerUrl } = options;

  const intakeHeld = suppressedByOutboundGate(toEmail, undefined, 'sendMarketingIntakeConfirmationEmail');
  if (intakeHeld) return intakeHeld;



  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();

  const htmlContent = renderNestEditorialEmailTemplate({
    title: 'Marketing Request Received',
    badgeText: '● IN PROGRESS',
    serifTitle: 'Marketing<br/>Request',
    metadataDate: `${dateFormatted} | IN PROGRESS WITH ${assignedLead.split(' ')[0].toUpperCase()}`,
    propertyAddress,
    greetingName: agentName.split(' ')[0],
    bodyParagraphs: [
      `I got your marketing request for <strong>${propertyAddress}</strong>!`,
      `I have forwarded your request and attached assets directly to <strong>${assignedLead}</strong>, and it is now in active production.`
    ],
    deliverables,
    ctaButton: {
      label: 'View Live Proof Portal',
      url: trackerUrl || 'https://shapework.co/app'
    },
    footnote: 'If you have any questions about this or if anything changes, just email me, Nora @ AskNora@Nestrealty.com or just respond to this email.'
  });

  return sendEmail({
    to: toEmail,
    replyTo: 'asknora@nestrealty.com',
    workspaceId: options.workspaceId,
    requestId: options.requestId,
    taskId: options.taskId,
    threadId: options.threadId,
    inReplyTo: options.inReplyTo,
    references: options.references,
    cc,
    subject: `Intake Confirmed: ${propertyAddress} — In Progress with ${assignedLead.split(' ')[0]}`,
    text: `Hi ${agentName},\n\nI got your marketing request for ${propertyAddress} and have forwarded it to ${assignedLead}, and it is now in progress.\n\nQueued Deliverables: ${deliverables.join(', ')}\nAssigned Director: ${assignedLead}${trackerUrl ? `\n\nLive Proof & Delivery Portal: ${trackerUrl}` : ''}\n\nIf you have any questions about this or if anything changes, just email me, Nora @ AskNora@Nestrealty.com or just respond to this email.\n\nBest,\nNora (Nest Operations)\nAskNora@Nestrealty.com`,
    html: htmlContent
  });
}

/**
 * Sends a notification asking the agent for the missing property address.
 */
export async function sendAddressRequestEmail(options: {
  toEmail: string;
  agentName: string;
  subjectTitle?: string;
}): Promise<EmailDispatchResult> {
  const { toEmail, agentName, subjectTitle = 'Marketing Request' } = options;

  const addressHeld = suppressedByOutboundGate(toEmail, undefined, 'sendAddressRequestEmail');
  if (addressHeld) return addressHeld;

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();

  const htmlContent = renderNestEditorialEmailTemplate({
    title: 'Property Address Needed',
    badgeText: '● ACTION NEEDED',
    serifTitle: 'Address<br/>Needed',
    metadataDate: `${dateFormatted} | MARKETING INTAKE`,
    propertyAddress: 'Property Address Needed',
    greetingName: agentName.split(' ')[0] || 'there',
    bodyParagraphs: [
      `Thanks for sending over your marketing request for <em>"${subjectTitle}"</em>!`,
      `We're ready to get your collateral rolling right away with Melissa and our marketing team. Could you please reply directly to this email with the <strong>property street address</strong> (and any pricing or specs you'd like included)?`,
      `Once we receive the address, our team will immediately start preparing your listing collateral suite.`
    ],
    infoBox: {
      title: 'Quick Reply Needed',
      text: 'Just reply to this email with the property address (e.g., 123 Main St, Wilmington NC) and we will take care of the rest!'
    },
    ctaButton: {
      label: 'Reply with address',
      url: 'mailto:asknora@nestrealty.com'
    },
    footnote: 'If you have any questions, you can also reach Nora at AskNora@nestrealty.com or call the Nest Hotline at (910) 507-2047.'
  });

  return sendEmail({
    to: toEmail,
    subject: `Action Needed: Please reply with property address for your marketing request`,
    text: `Hi ${agentName},\n\nThanks for sending over your marketing request!\n\nCould you please reply with the property street address so Melissa and our marketing team can get your collateral into production right away?\n\nBest,\nNora (Nest Operations)\nAskNora@Nestrealty.com`,
    html: htmlContent
  });
}

/**
 * Sends a status transition notification when a task moves to "In Progress"
 */
export async function sendTaskInProgressNotificationEmail(options: {
  toEmail: string;
  agentName: string;
  propertyAddress: string;
  taskTitle: string;
  assignedTo: string;
  assignedToRole?: string;
  ccManagerEmail?: string;
}): Promise<EmailDispatchResult> {
  const { toEmail, agentName, propertyAddress, taskTitle, assignedTo, assignedToRole = 'Lead', ccManagerEmail } = options;

  const progressHeld = suppressedByOutboundGate(toEmail, ccManagerEmail, 'sendTaskInProgressNotificationEmail');
  if (progressHeld) return progressHeld;

  if (process.env.NODE_ENV === 'test') {
    return { success: true, messageId: `test_inprogress_${Date.now()}` };
  }

  const htmlContent = renderNestEditorialEmailTemplate({
    title: 'Task In Progress',
    badgeText: '● ACTIVE PRODUCTION',
    serifTitle: 'Task In<br/>Progress',
    metadataDate: `ACTIVE | ASSIGNED TO ${assignedTo.split(' ')[0].toUpperCase()}`,
    propertyAddress,
    greetingName: agentName.split(' ')[0],
    bodyParagraphs: [
      `Your request for <strong>${propertyAddress}</strong> (<em>${taskTitle}</em>) has moved into active production.`,
      `It is assigned to <strong>${assignedTo}</strong> (${assignedToRole}) who is actively staging your collateral.`
    ],
    infoBox: {
      title: 'Current Assignee',
      text: `${assignedTo} &bull; ${assignedToRole}`
    },
    ctaButton: {
      label: 'View Live Task Status',
      url: 'https://shapework.co/app'
    },
    footnote: 'If you have any questions or updates, email Nora @ AskNora@Nestrealty.com or respond directly to this email.'
  });

  return sendEmail({
    to: toEmail,
    cc: ccManagerEmail || undefined,
    subject: `Update: ${taskTitle} for ${propertyAddress} is In Progress with ${assignedTo.split(' ')[0]}`,
    text: `Hi ${agentName},\n\nYour request for ${propertyAddress} (${taskTitle}) is now actively in progress with ${assignedTo} (${assignedToRole}).\n\nTrack progress anytime at https://shapework.co/app\n\nBest,\nNora (Nest Operations)\nAskNora@Nestrealty.com`,
    html: htmlContent
  });
}

/**
 * Sends a notification when staff needs additional information/photos from the agent
 */
export async function sendTaskNeedMoreInfoEmail(options: {
  toEmail: string;
  agentName: string;
  propertyAddress: string;
  taskTitle: string;
  requestedItems: string[];
  staffNotes?: string;
  driveUploadUrl?: string;
  requesterStaffName?: string;
}): Promise<EmailDispatchResult> {
  const { toEmail, agentName, propertyAddress, taskTitle, requestedItems, staffNotes, driveUploadUrl, requesterStaffName = 'Melissa' } = options;

  const needInfoHeld = suppressedByOutboundGate(toEmail, undefined, 'sendTaskNeedMoreInfoEmail');
  if (needInfoHeld) return needInfoHeld;

  if (process.env.NODE_ENV === 'test') {
    return { success: true, messageId: `test_needinfo_${Date.now()}` };
  }

  const htmlContent = renderNestEditorialEmailTemplate({
    title: 'Information Needed',
    badgeText: '● ACTION NEEDED',
    serifTitle: 'Action<br/>Needed',
    metadataDate: `INFO REQUEST | ${requesterStaffName.toUpperCase()}`,
    propertyAddress,
    greetingName: agentName.split(' ')[0],
    bodyParagraphs: [
      `To finalize your <strong>${taskTitle}</strong> for <strong>${propertyAddress}</strong>, our brokerage team needs a few details from you.`,
      staffNotes ? `<em>"${staffNotes}"</em>` : `Please provide the requested items below so we can finish your collateral.`
    ],
    deliverables: requestedItems,
    ctaButton: {
      label: driveUploadUrl ? 'View your request' : 'Reply with details',
      url: toAbsolutePublicUrl(driveUploadUrl) || 'mailto:asknora@nestrealty.com'
    },
    footnote: 'You can also simply reply directly to this email with the requested information or photos attached.'
  });

  return sendEmail({
    to: toEmail,
    subject: `Action Needed: Info Requested for ${propertyAddress} (${taskTitle})`,
    text: `Hi ${agentName},\n\n${requesterStaffName} needs additional information to complete your ${taskTitle} for ${propertyAddress}:\n\n- ${requestedItems.join('\n- ')}\n${staffNotes ? `\nNotes: ${staffNotes}\n` : ''}\nReply directly to this email with the requested details or files.${driveUploadUrl ? `\n\nView your request: ${driveUploadUrl}` : ''}\n\nBest,\nNora (Nest Operations)\nAskNora@Nestrealty.com`,
    html: htmlContent
  });
}

/**
 * Sends a task completion & delivery notification email to the agent
 */
export async function sendTaskCompletionEmail(options: {
  toEmail: string;
  agentName: string;
  propertyAddress: string;
  taskTitle: string;
  proofUrl?: string;
  driveFolderUrl?: string;
  completedByName?: string;
  /** Already filtered by evaluateDispatch.effectiveCc. */
  cc?: string[];
  [key: string]: any;
}): Promise<EmailDispatchResult> {
  const { toEmail, agentName, propertyAddress, taskTitle, proofUrl, driveFolderUrl, completedByName = 'Melissa Gagliardi', cc } = options;

  const completeHeld = suppressedByOutboundGate(toEmail, cc, 'sendTaskCompletionEmail');
  if (completeHeld) return completeHeld;

  const effectiveActionUrl = toAbsolutePublicUrl(options.downloadUrl || proofUrl ||
    (driveFolderUrl && driveFolderUrl !== 'https://drive.google.com' ? driveFolderUrl : ''));
  const trackerUrl = toAbsolutePublicUrl(options.trackerUrl);
  if (!effectiveActionUrl && !options.attachments?.length) {
    return { success: false, smtpAccepted: false, retrySafe: true, error: 'A valid asset link or attachment is required.' };
  }
  const actionButtonLabel = effectiveActionUrl.includes('/track/marketing/') ? 'Open Proof Portal' : 'View Approved Assets';

  const htmlContent = renderNestEditorialEmailTemplate({
    title: 'Deliverables Ready',
    badgeText: '● APPROVED',
    serifTitle: 'Deliverables<br/>Ready',
    metadataDate: `APPROVED BY ${completedByName.split(' ')[0].toUpperCase()}`,
    propertyAddress,
    greetingName: agentName.split(' ')[0],
    bodyParagraphs: [
      `Great news! <strong>${taskTitle}</strong> for <strong>${propertyAddress}</strong> has been approved by <strong>${completedByName}</strong>.`,
      `Your approved marketing assets are ready. Use the link below or open the attached files.`
    ],
    infoBox: {
      title: 'Listing Asset Package',
      text: `${propertyAddress}`
    },
    ctaButton: effectiveActionUrl ? { label: actionButtonLabel, url: effectiveActionUrl } : trackerUrl ? { label: 'View your request', url: trackerUrl } : { label: 'Reply to Nora', url: 'mailto:asknora@nestrealty.com' },
    footnote: 'Reply to this email if you need changes.'
  });

  return sendEmail({
    to: toEmail,
    cc: cc && cc.length ? cc : undefined,
    attachments: options.attachments,
    replyTo: options.replyTo || 'asknora@nestrealty.com',
    inReplyTo: options.inReplyTo,
    references: options.references,
    workspaceId: options.workspaceId,
    requestId: options.requestId,
    taskId: options.taskId,
    subject: `Approved assets ready: ${taskTitle} for ${propertyAddress}`,
    text: `Hi ${agentName},\n\nYour deliverables for ${propertyAddress} (${taskTitle}) have been approved by ${completedByName}.\n\n${effectiveActionUrl ? `Access your files: ${effectiveActionUrl}` : 'Your approved files are attached.'}${trackerUrl ? `\n\nView your request: ${trackerUrl}` : ''}\n\nBest,\nNora (Nest Operations)\nAskNora@Nestrealty.com`,
    html: htmlContent
  });
}

/**
 * Sends a generic custom email from Nora.
 */
export async function sendEmail(options: {
  to: string;
  cc?: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  inReplyTo?: string;
  references?: string | string[];
  attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>;
  workspaceId?: string;
  requestId?: string;
  taskId?: string;
  propertyAddress?: string;
  threadId?: string;
}): Promise<EmailDispatchResult> {
  const dispatchGuard = await evaluateOutboundDispatchGuard({
    workspaceId: options.workspaceId,
    propertyAddress: (options as any).propertyAddress,
    requestId: (options as any).requestId || (options as any).campaignId,
    threadId: (options as any).threadId,
    messageId: (options as any).inReplyTo,
  });
  if (!dispatchGuard.allowed) {
    console.log(`[Email Safety Gate] Outbound BLOCKED (${dispatchGuard.reason}): ${dispatchGuard.detail || ''}`);
    return {
      success: true,
      messageId: `suppressed_${dispatchGuard.reason || 'guard'}_${Date.now()}`,
      suppressed: true,
      reason: dispatchGuard.reason,
      smtpAccepted: false,
      confirmedReceipt: false,
      retrySafe: true,
    } as any;
  }

  const sendHeld = suppressedByOutboundGate(options.to, options.cc, 'sendEmail');
  if (sendHeld) return sendHeld;

  if (process.env.NODE_ENV === 'test') {
    return {
      success: true,
      suppressed: true,
      reason: 'test_mode',
      smtpAccepted: false,
      confirmedReceipt: false,
    };
  }

  try {
    if (!readConfiguredSmtpSecret()) {
      return { success: false, smtpAccepted: false, retrySafe: true, error: SMTP_SECRET_MISSING };
    }
    const transporter = getNoraTransporter();
    const delivered = await deliverNodemailer({
      transporter,
      source: 'sendEmail',
      mail: {
        from: options.from || `"${NORA_EMAIL_CONFIG.fromName}" <${NORA_EMAIL_CONFIG.user}>`,
        to: options.to,
        cc: options.cc,
        replyTo: options.replyTo,
        inReplyTo: options.inReplyTo,
        references: options.references,
        attachments: options.attachments,
        subject: options.subject,
        text: options.text || '',
        html: options.html || options.text || ''
      }
    });
    if (!delivered.sent) {
      return {
        success: true,
        suppressed: true,
        held: delivered.held,
        reason: delivered.gate.reason,
        smtpAccepted: false,
        confirmedReceipt: false,
        messageId: `suppressed_safe_mode_${Date.now()}`
      } as EmailDispatchResult;
    }

    const info = delivered.info as { accepted?: Array<string | { address?: string }>; rejected?: Array<string | { address?: string }>; response?: string } | undefined;
    const addresses = (items: Array<string | { address?: string }> = []) => items.map(item =>
      (typeof item === 'string' ? item : item.address || '').trim().toLowerCase()).filter(Boolean);
    const acceptedRecipients = addresses(info?.accepted);
    const rejectedRecipients = addresses(info?.rejected);
    const smtpAccepted = Boolean(delivered.messageId) && acceptedRecipients.includes(options.to.trim().toLowerCase());
    return {
      success: smtpAccepted,
      messageId: delivered.messageId,
      smtpAccepted,
      smtpResponse: info?.response,
      acceptedRecipients,
      rejectedRecipients,
      retrySafe: !smtpAccepted && rejectedRecipients.includes(options.to.trim().toLowerCase()),
      confirmedReceipt: false,
      ...(!smtpAccepted ? { error: 'SMTP did not accept the intended recipient.' } : {}),
    };
  } catch (err: any) {
    console.warn(`[Email] Custom send notice to ${options.to}:`, err?.message || err);
    return {
      success: false,
      smtpAccepted: false,
      confirmedReceipt: false,
      retrySafe: err?.code === 'EENVELOPE' && Array.isArray(err?.rejected) && err.rejected.some((address: string) => address.toLowerCase() === options.to.toLowerCase()),
      error: err?.message || 'SMTP delivery pending'
    };
  }
}




export async function sendIntakeMissingInfoAcknowledgmentEmail(_opts: any): Promise<{ success: boolean; messageId?: string }> {
  console.log('[Email] sendIntakeMissingInfoAcknowledgmentEmail stubbed');
  return { success: true, messageId: `stub_missing_info_${Date.now()}` };
}
