/**
 * Marketing Questions Dispatch Route
 * Handles "Ask Agent" missing information outreach.
 * Strictly enforces canonical recipient resolution, server-enforced Ask NORA sender,
 * provider-neutral responses, and outbound safety gates.
 */

import { Router, Request, Response } from 'express';
import { sendEmail as sendAskNoraEmail } from '../email/emailProvider.js';
import { enqueueOutboundEmail } from '../services/inboundEmailIngestionEngine.js';
import { isExactOutboundAllowlistHit } from '../../src/lib/outboundAllowlistGate.js';
import { dispatchEmailViaResend } from '../email/resendDispatchAdapter.js';
import {
  resolveServerCanonicalRecipient,
  isProhibitedPhone,
  isProhibitedEmail,
  isHotlineNumber
} from '../services/canonicalRecipientService.js';
import { recordActivityEvent, getActivityHistoryForTask } from '../services/activityHistoryService.js';
import {
  ensureAskNoraDeliveryDrivePack,
  isRealGoogleDriveUrl,
  loadLocalProofAttachments,
} from '../services/askNoraDriveDelivery.js';
import {
  getAllCanonicalMarketingTasks,
  getCanonicalMarketingTaskById,
  saveCanonicalMarketingTask,
} from '../persistence/marketingCampaignsRepository.js';
import {
  shouldBlockClientOutbound,
  dealTriageClientOutboundBlockReason,
} from '../services/nora/dealTriage.js';
import { canSendAgentOutbound } from '../persistence/notificationPreferencesRepository.js';

export const marketingQuestionsRouter = Router();

export interface SendQuestionsPayload {
  campaignId: string;
  taskId?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  requesterId?: string;
  channels: ('sms' | 'email')[];
  message: string;
  selectedQuestions?: string[];
  propertyAddress?: string;
  actorName?: string;
  workspaceId?: string;
  forceConfirmRecent?: boolean;
  /** ask_missing (default) | delivery_complete — marketing delivery always CCs Melissa */
  intent?: 'ask_missing' | 'delivery_complete';
  subject?: string;
  ccEmails?: string[];
  domain?: 'marketing' | 'operational' | 'other';
  /** Completed creative assets — Drive folder and/or direct file URLs */
  driveFolderUrl?: string;
  proofUrl?: string;
  assetUrls?: string[];
  attachments?: Array<{ filename?: string; url: string }>;
}

marketingQuestionsRouter.post('/api/marketing/requests/send-questions', async (req: Request, res: Response) => {
  try {
    const {
      campaignId,
      recipientName,
      recipientPhone,
      recipientEmail,
      requesterId,
      channels = ['email'],
      message,
      selectedQuestions = [],
      propertyAddress = 'Listing Property',
      actorName = 'Melissa Gagliardi',
      workspaceId = 'ws_wilmington',
      intent = 'ask_missing',
      subject,
      ccEmails = [],
      domain = 'marketing',
      driveFolderUrl,
      proofUrl,
      assetUrls = [],
      attachments = [],
      taskId,
      forceConfirmRecent = false
    } = req.body as SendQuestionsPayload;

    if (!campaignId || !message || (!recipientName && !requesterId && !recipientEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required request parameters (campaignId, message, recipient identifier).'
      });
    }

    // 1. Reject hotline / placeholder destinations only for the channels actually requested.
    // Email-only outreach must not 400 just because a call-ingest task still carries Nora's
    // hotline on agentPhone (common on Tasks → Ask Requester / Approve & Notify).
    const wantsSms = channels.includes('sms');
    const wantsEmail = channels.includes('email');
    if (wantsSms && recipientPhone && isHotlineNumber(recipientPhone)) {
      return res.status(400).json({
        success: false,
        error: 'Prohibited recipient: The NORA hotline number (910) 507-2047 cannot be used as an agent text destination.'
      });
    }
    if (wantsEmail && recipientEmail && isProhibitedEmail(recipientEmail)) {
      return res.status(400).json({
        success: false,
        error: `Prohibited recipient: Placeholder email "${recipientEmail}" cannot receive messages.`
      });
    }
    // Strip hotline from phone before directory resolve so it cannot poison email-only sends
    const safeRecipientPhone =
      recipientPhone && isHotlineNumber(recipientPhone) ? undefined : recipientPhone;

    // 2. Server-side Canonical Recipient Re-resolution
    const resolvedRecipient = await resolveServerCanonicalRecipient({
      requesterId,
      requesterName: recipientName,
      requesterEmail: recipientEmail,
      requesterPhone: safeRecipientPhone,
      workspaceId
    });

    if (!resolvedRecipient) {
      return res.status(400).json({
        success: false,
        error: 'Could not resolve a canonical directory record for this recipient in the current workspace.'
      });
    }

    // Validate destinations for requested channels
    if (channels.includes('email') && (!resolvedRecipient.email || !resolvedRecipient.emailVerified)) {
      return res.status(400).json({
        success: false,
        error: 'No verified email address is available for this agent.'
      });
    }

    if (channels.includes('sms') && (!resolvedRecipient.phone || !resolvedRecipient.phoneVerified)) {
      return res.status(400).json({
        success: false,
        error: 'No verified mobile number is available for this agent.'
      });
    }


    // Allowlist prove addresses are not directory people. Member prefs stay on the Nest path.
    const viaAllowlist =
      String(resolvedRecipient.id || '').startsWith('allowlist:') &&
      isExactOutboundAllowlistHit(resolvedRecipient.email);

    // Member notification prefs (materials ready / missing info / SMS)
    if (!viaAllowlist) try {
      const msgType =
        intent === 'delivery_complete'
          ? 'materials_ready'
          : intent === 'ask_missing'
            ? 'missing_info'
            : String(intent || 'missing_info');
      const channel =
        wantsSms && !wantsEmail ? 'sms' : wantsSms && wantsEmail ? 'both' : 'email';
      const recipEmail = resolvedRecipient.email || recipientEmail || '';
      const userId = resolvedRecipient.id || resolvedRecipient.userId || `email:${String(recipEmail).toLowerCase()}`;
      if (channel === 'both' || channel === 'email') {
        const g = await canSendAgentOutbound({ userId, messageType: msgType, channel: 'email' });
        if (!g.allowed) {
          return res.status(403).json({
            success: false,
            error: `Notifications disabled for this teammate (${msgType}). Enable under Team Access → Notifications.`,
            reason: g.reason,
          });
        }
      }
      if (channel === 'both' || channel === 'sms') {
        const gSms = await canSendAgentOutbound({ userId, messageType: 'sms', channel: 'sms' });
        if (!gSms.allowed && wantsSms) {
          return res.status(403).json({
            success: false,
            error: 'SMS notifications disabled for this teammate. Enable under Team Access → Notifications.',
            reason: gSms.reason,
          });
        }
      }
    } catch (err) {
      console.warn('[send-questions] pref gate error', err);
    }

    // 2b. Delivery outreach: always from AskNora; marketing completes CC Melissa
    const melissaCc = 'melissa.gagliardi@nestrealty.com';
    const isDeliveryComplete = intent === 'delivery_complete';
    const shouldCcMelissa = isDeliveryComplete && domain !== 'operational';
    const resolvedCc = Array.from(new Set([
      ...(Array.isArray(ccEmails) ? ccEmails : []),
      ...(shouldCcMelissa ? [melissaCc] : [])
    ].map((e) => String(e || '').trim().toLowerCase()).filter(Boolean)));
    const emailSubject = (subject && String(subject).trim())
      || (isDeliveryComplete
        ? `Your marketing materials are ready — ${propertyAddress}`
        : `[Task #${campaignId}] Missing Information Request — ${propertyAddress}`);


    // 2c2. Deal triage: never auto-outbound to clients / agents when collapse flagged
    try {
      const allTasks = getAllCanonicalMarketingTasks() || [];
      const dealTask = allTasks.find(
        (x: any) => x?.id === taskId || x?.id === campaignId || x?.campaignId === campaignId
      );
      if (dealTask && shouldBlockClientOutbound(dealTask)) {
        return res.status(403).json({
          success: false,
          error: dealTriageClientOutboundBlockReason(dealTask) ||
            'Deal triage active — BIC/owner negotiates; no client auto-outbound.',
          outbound: 'blocked_no_client_send',
        });
      }
    } catch {
      /* non-fatal if task store unavailable */
    }

    // 2c. Block smoke/debug copy from reaching agent inboxes (ops-only with flag)
    const smokeHay = `${emailSubject}\n${message}`.toLowerCase();
    const looksLikeSmoke = /partial[- ]success|smtp smoke|asknora smtp smoke|\bsmoke:/.test(smokeHay);
    if (looksLikeSmoke && process.env.OUTREACH_ALLOW_SMOKE !== 'true') {
      return res.status(400).json({
        success: false,
        error: 'Blocked smoke/debug outreach copy. Use the materials-ready template, or set OUTREACH_ALLOW_SMOKE=true for ops-only tests.'
      });
    }

    // 2d. Hard idempotency: one outbound per task + template (intent)
    const outreachTaskKey = String(taskId || campaignId);
    const outreachOnceKey = `outreach_sent_${outreachTaskKey}_${intent}`;
    const sentOnceMap: Map<string, number> = ((global as any).__NEST_OUTREACH_ONCE ||= new Map());
    if (!forceConfirmRecent && sentOnceMap.has(outreachOnceKey)) {
      return res.status(409).json({
        success: false,
        error: `Already sent ${intent} for this task. One outbound per state change.`,
        idempotencyKey: outreachOnceKey
      });
    }
    if (!forceConfirmRecent) {
      try {
        const hist = await getActivityHistoryForTask(outreachTaskKey, workspaceId);
        const already = (hist || []).some((e: any) =>
          e?.idempotencyKey === `${outreachOnceKey}:done` ||
          (e?.eventType === 'outreach.provider_accepted' &&
            e?.metadata?.intent === intent &&
            e?.metadata?.dispatched === true)
        );
        if (already) {
          sentOnceMap.set(outreachOnceKey, Date.now());
          return res.status(409).json({
            success: false,
            error: `Already sent ${intent} for this task. One outbound per state change.`,
            idempotencyKey: outreachOnceKey
          });
        }
        // Never send materials-ready AND missing-info for the same task in one window
        const otherIntent = intent === 'delivery_complete' ? 'ask_missing' : 'delivery_complete';
        const otherKey = `outreach_sent_${outreachTaskKey}_${otherIntent}`;
        const otherSent =
          sentOnceMap.has(otherKey) ||
          (hist || []).some((e: any) =>
            e?.idempotencyKey === `${otherKey}:done` ||
            (e?.eventType === 'outreach.provider_accepted' &&
              e?.metadata?.intent === otherIntent &&
              e?.metadata?.dispatched === true)
          );
        if (otherSent) {
          return res.status(409).json({
            success: false,
            error: `Blocked ${intent}: ${otherIntent} already sent for this task. One agent-facing outreach only.`,
            idempotencyKey: otherKey
          });
        }
      } catch (idemErr: any) {
        console.warn('[send-questions] idempotency history warning:', idemErr?.message || idemErr);
      }
    }

    // 3. Check Outbound Mode Safety Gate
    const masterMode = (process.env.OUTBOUND_MASTER_MODE || process.env.OUTBOUND_MODE || 'hold').toLowerCase().trim();
    const isOutboundDisabled =
      masterMode === 'disabled' ||
      process.env.NODE_ENV === 'test' ||
      (masterMode !== 'live' && process.env.ALLOW_EXTERNAL_DISPATCH !== 'true');

    if (isOutboundDisabled) {
      // Hold (including :3049 OUTBOUND_MASTER_MODE=hold): queue the existing outbox for an
      // exact allowlist To. Do not SMTP. Do not invent a second mailer. Directory recipients
      // keep the draft / 503 path below.
      const holdQueue =
        viaAllowlist &&
        wantsEmail &&
        masterMode !== 'live' &&
        masterMode !== 'disabled' &&
        Boolean(resolvedRecipient.email);

      if (holdQueue && resolvedRecipient.email) {
        const queued = await enqueueOutboundEmail({
          workspaceId,
          messageType: isDeliveryComplete ? 'materials_ready' : 'missing_info',
          idempotencyKey: `allowlist_hold_${outreachTaskKey}_${intent}`,
          recipient: resolvedRecipient.email,
          subject: emailSubject,
          payload: {
            body: message,
            propertyAddress,
            requestId: campaignId,
            campaignId,
            taskId: outreachTaskKey,
            cc: resolvedCc,
            intent,
            hold: true,
          },
          skipMemberPrefs: true,
        });
        if (!queued.enqueued) {
          return res.status(503).json({
            success: false,
            error: 'Outbound hold did not accept this allowlist recipient.',
            reason: (queued as { reason?: string }).reason,
          });
        }

        const heldTask = getCanonicalMarketingTaskById(String(taskId || campaignId));
        if (heldTask && heldTask.reviewState === 'awaiting_review') {
          heldTask.reviewState = 'approved';
          saveCanonicalMarketingTask(heldTask);
        }

        sentOnceMap.set(outreachOnceKey, Date.now());
        return res.status(200).json({
          success: true,
          mode: 'held',
          campaignId,
          outboxId: queued.outboxId,
          recipient: {
            name: resolvedRecipient.name,
            maskedEmail: resolvedRecipient.maskedEmail,
            maskedPhone: resolvedRecipient.maskedPhone,
          },
          message: `Queued to outbound hold for ${resolvedRecipient.name}.`,
        });
      }

      // Record truthful audit event for saved draft / blocked external send
      const channelLabel = channels.includes('email') && channels.includes('sms')
        ? 'Email & Text'
        : (channels.includes('email') ? 'Email' : 'Text message');

      const auditSummary = `${actorName} prepared a request for ${resolvedRecipient.name}. External communication blocked by policy · Not sent`;

      await recordActivityEvent({
        workspaceId,
        requestId: campaignId,
        eventType: 'outreach.drafted',
        actorType: 'staff',
        actorDisplayName: actorName,
        channel: channels.includes('email') ? 'email' : 'phone',
        direction: 'internal',
        communicationStatus: 'blocked',
        summary: auditSummary,
        metadata: {
          recipientId: resolvedRecipient.id,
          recipientName: resolvedRecipient.name,
          maskedEmail: resolvedRecipient.maskedEmail,
          maskedPhone: resolvedRecipient.maskedPhone,
          channels,
          selectedQuestions,
          propertyAddress,
          outboundPolicy: 'disabled',
          fromAddress: 'AskNora@NestRealty.com',
          intent,
          domain,
          cc: resolvedCc,
          subject: emailSubject
        },
        idempotencyKey: `outreach_draft_${campaignId}_${Date.now()}`
      }).catch(err => console.warn('[Activity Event Warning]:', err));

      // Delivery "Send & complete" must NOT succeed as a quiet draft — UI must leave task open.
      if (isDeliveryComplete) {
        return res.status(503).json({
          success: false,
          outboundDisabled: true,
          mode: 'blocked',
          campaignId,
          error: 'Outbound is not live — email/text was not sent. Task left open (not completed).',
          recipient: {
            name: resolvedRecipient.name,
            maskedEmail: resolvedRecipient.maskedEmail,
            maskedPhone: resolvedRecipient.maskedPhone
          },
          summary: auditSummary
        });
      }

      return res.status(200).json({
        success: true,
        outboundDisabled: true,
        mode: 'draft_saved',
        campaignId,
        recipient: {
          name: resolvedRecipient.name,
          maskedEmail: resolvedRecipient.maskedEmail,
          maskedPhone: resolvedRecipient.maskedPhone
        },
        channels: {
          email: channels.includes('email') ? { status: 'draft_saved', maskedRecipient: resolvedRecipient.maskedEmail } : undefined,
          sms: channels.includes('sms') ? { status: 'draft_saved', maskedRecipient: resolvedRecipient.maskedPhone } : undefined
        },
        summary: auditSummary,
        message: 'External communication is currently disabled. Outreach draft saved for the team.'
      });
    }

    // 4. Server Enforced From Address
    const enforcedFromAddress = 'Ask NORA <AskNora@NestRealty.com>';
    const results: Record<string, any> = {};

    // Delivery: create/reuse AskNora Drive folder + upload proofs; only link if verified non-empty
    let ensuredDriveUrl = '';
    let driveWarning: string | undefined;
    if (isDeliveryComplete) {
      const tasks = getAllCanonicalMarketingTasks();
      const task = tasks.find((x: any) => x.id === taskId || x.id === campaignId);
      const pack = task
        ? await ensureAskNoraDeliveryDrivePack(task, {
            stagedAssets: (attachments || []).map((a: any) => ({ url: a?.url, fileName: a?.filename })),
          })
        : await ensureAskNoraDeliveryDrivePack({
            id: String(taskId || campaignId),
            propertyAddress,
            agentName: recipientName,
            agentEmail: recipientEmail,
            driveFolderUrl,
            proofUrl,
            notes: message,
            attachments,
          });

      if (pack.linkable && pack.driveFolderUrl && isRealGoogleDriveUrl(pack.driveFolderUrl)) {
        ensuredDriveUrl = pack.driveFolderUrl;
        if (task) {
          task.driveFolderUrl = pack.driveFolderUrl;
          if (pack.uploaded.length) {
            const uploadNote = pack.uploaded.map((u) => u.webViewLink).join('\n');
            task.notes = `${task.notes || ''}\n[AskNora Drive proofs]:\n${uploadNote}`.trim();
          }
          task.updatedAt = new Date().toISOString();
          saveCanonicalMarketingTask(task);
        }
      } else {
        driveWarning = pack.error || 'Drive link omitted — folder empty or unverified; email attachments only.';
        console.warn('[send-questions] Drive not linkable:', driveWarning);
      }
    }

    // ONE verified Drive URL only for delivery — never scrape message body (typo duplex → 404)
    const assetLinks: string[] = [];
    if (isDeliveryComplete && ensuredDriveUrl && isRealGoogleDriveUrl(ensuredDriveUrl)) {
      assetLinks.push(ensuredDriveUrl);
    }
    const assetLinksHtml = assetLinks.length
      ? `<div style="margin:18px 0;padding:14px 16px;background:#E5EFEA;border-radius:10px;border:1px solid #b7d4c8;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#00635C;margin-bottom:8px;">Google Drive</div>
            <p style="margin:0;color:#01362D;font-size:13px;line-height:1.55;">
              <a href="${assetLinks[0]}" style="color:#00635C;font-weight:600;word-break:break-all;">Open your marketing assets</a>
            </p>
          </div>`
      : (isDeliveryComplete
          ? `<p style="font-size:12px;color:#01362D;background:#E5EFEA;padding:10px 12px;border-radius:8px;">Your assets are attached to this email. Reply if you need them resent.</p>`
          : '');
    const assetLinksText = assetLinks.length
      ? `\n\nGoogle Drive:\n${assetLinks[0]}`
      : (isDeliveryComplete ? '\n\nYour assets are attached to this email / were emailed — reply if you need them resent.' : '');

    const agentLabel = String(resolvedRecipient.name || resolvedRecipient.firstName || 'there').trim();
    const hasDriveLink = assetLinks.length > 0;
    const deliveryBody = isDeliveryComplete
      ? [
          hasDriveLink
            ? `${agentLabel}, we have your requested marketing assets ready. Click the Google Drive link below to view.`
            : `${agentLabel}, we have your requested marketing assets ready. Your files are attached to this email.`,
          ...(propertyAddress && propertyAddress !== 'Listing Property' ? ['', `Property: ${propertyAddress}`] : []),
          '',
          'Respond to this text if you need any revisions.',
        ].join('\n')
      : '';
    const outboundMessage = isDeliveryComplete ? deliveryBody : message;

    // 5. Dispatch Email via Provider
    if (channels.includes('email') && resolvedRecipient.email) {
      const questionsListHtml = !isDeliveryComplete && selectedQuestions.length > 0
        ? `<ul style="margin: 12px 0; padding-left: 20px; color: #01362D; line-height: 1.6;">${selectedQuestions.map(q => `<li style="margin-bottom: 6px;"><strong>${q}</strong></li>`).join('')}</ul>`
        : '';

      const introHtml = isDeliveryComplete
        ? `<p style="white-space:pre-line;">${deliveryBody}</p>`
        : `<p>Hi <strong>${resolvedRecipient.firstName}</strong>,</p>
            <p>We need a few additional details to continue the marketing request for <strong>${propertyAddress}</strong>:</p>
            ${questionsListHtml}`;

      const ccNote = resolvedCc.length
        ? `<p style="font-size:12px;color:#64748b;margin-top:16px;">CC: ${resolvedCc.join(', ')}</p>`
        : '';

      const formattedHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="background: #00635C; padding: 24px; color: #ffffff; text-align: left;">
            <h2 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700;">${isDeliveryComplete ? 'Nest Realty • Materials ready' : 'Nest Realty • Marketing Request'}</h2>
            <p style="margin: 0; font-size: 13px; color: #e6fffa; opacity: 0.9;">Property: ${propertyAddress}</p>
          </div>
          <div style="padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.6;">
            ${introHtml}
            ${isDeliveryComplete ? '' : `<div style="background: #f8fafc; border-left: 4px solid #00635C; padding: 14px 18px; margin: 20px 0; border-radius: 6px;">
              <p style="margin: 0; font-size: 13px; color: #334155; white-space: pre-line;">${outboundMessage}</p>
            </div>`}
            ${assetLinksHtml}
            ${ccNote}
            <p style="font-size: 13px; color: #64748b;">You can reply directly to this email — it goes to AskNora@NestRealty.com.</p>
          </div>
          <div style="background: #f1f5f9; padding: 16px 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0;">
            From Ask NORA • AskNora@NestRealty.com
          </div>
        </div>
      `;

      const textBody = [outboundMessage, assetLinksText].filter(Boolean).join('\n');

      try {
        await recordActivityEvent({
          workspaceId,
          requestId: campaignId,
          eventType: 'outreach.queued',
          actorType: 'nora',
          actorDisplayName: 'NORA',
          channel: 'email',
          direction: 'outbound',
          communicationStatus: 'queued',
          summary: `NORA queued an email from AskNora@NestRealty.com.`,
          metadata: {
            recipientEmail: resolvedRecipient.maskedEmail,
            from: enforcedFromAddress,
            cc: resolvedCc,
            assetLinks,
            intent,
            taskId
          },
          idempotencyKey: `outreach_queued_email_${campaignId}_${Date.now()}`
        }).catch(() => {});

        let emailAttachments: Array<{ filename: string; content: Buffer; contentType?: string }> = [];
        if (isDeliveryComplete) {
          const tasksForAttach = getAllCanonicalMarketingTasks();
          const taskForAttach = tasksForAttach.find((x: any) => x.id === taskId || x.id === campaignId);
          if (taskForAttach) {
            emailAttachments = loadLocalProofAttachments(taskForAttach, (attachments || []).map((a: any) => ({ url: a?.url, fileName: a?.filename })));
          }
        }

        // Prefer AskNora Gmail SMTP (Workspace mailbox). Resend only as fallback if SMTP fails hard.
        let providerUsed: 'asknora_smtp' | 'resend' = 'asknora_smtp';
        let messageId: string | undefined;
        let sendError: string | undefined;

        const smtpResult = await sendAskNoraEmail({
          to: resolvedRecipient.email,
          from: enforcedFromAddress,
          replyTo: 'AskNora@nestrealty.com',
          subject: emailSubject,
          html: formattedHtml,
          text: textBody,
          ...(resolvedCc.length ? { cc: resolvedCc } : {}),
          ...(emailAttachments.length ? { attachments: emailAttachments } : {})
        });

        const smtpOk = Boolean(smtpResult.success) && Boolean(smtpResult.smtpAccepted);
        if (smtpOk) {
          messageId = smtpResult.messageId;
        } else {
          // Fallback to Resend only when a non-mock key is configured
          const resendKey = String(process.env.RESEND_API_KEY || '');
          const resendUsable = resendKey.length > 10 && !resendKey.startsWith('re_mock');
          if (resendUsable) {
            providerUsed = 'resend';
            const emailResult = await dispatchEmailViaResend({
              to: resolvedRecipient.email,
              from: enforcedFromAddress,
              subject: emailSubject,
              html: formattedHtml,
              text: textBody,
              campaignId,
              ...(resolvedCc.length ? { cc: resolvedCc } : {}),
              ...(emailAttachments.length ? { attachments: emailAttachments } : {})
            });
            const reallySent =
              Boolean(emailResult.success) &&
              emailResult.receipt?.provider === 'resend' &&
              emailResult.receipt?.status === 'delivered';
            if (reallySent) {
              messageId = emailResult.receipt?.resendMessageId;
            } else {
              sendError =
                emailResult.receipt?.error ||
                smtpResult.error ||
                smtpResult.smtpResponse ||
                'Email provider did not accept the message';
            }
          } else {
            sendError =
              smtpResult.error ||
              smtpResult.smtpResponse ||
              'AskNora mailbox did not accept the message (Resend not configured)';
          }
        }

        if (messageId) {
          await recordActivityEvent({
            workspaceId,
            requestId: campaignId,
            eventType: 'outreach.provider_accepted',
            actorType: 'system',
            actorDisplayName: providerUsed === 'asknora_smtp' ? 'AskNora Gmail' : 'Email Gateway',
            channel: 'email',
            direction: 'outbound',
            communicationStatus: 'provider_accepted',
            summary: `Email accepted via ${providerUsed}.`,
            metadata: {
              messageId,
              provider: providerUsed,
              recipient: resolvedRecipient.maskedEmail,
              cc: resolvedCc,
              assetLinks
            },
            idempotencyKey: `outreach_accepted_email_${campaignId}_${Date.now()}`
          }).catch(() => {});

          results.email = {
            success: true,
            recipient: resolvedRecipient.maskedEmail,
            status: 'sent',
            messageId,
            provider: providerUsed,
            cc: resolvedCc,
            assetLinks
          };
        } else {
          results.email = {
            success: false,
            recipient: resolvedRecipient.maskedEmail,
            status: 'failed',
            error: sendError || 'Email not sent',
            provider: providerUsed
          };
        }
      } catch (err: any) {
        results.email = {
          success: false,
          recipient: resolvedRecipient.maskedEmail,
          status: 'failed',
          error: err.message
        };
      }
    }

    // 6. Dispatch SMS via real provider (Twilio when configured) — no fake "sent"
    if (channels.includes('sms') && resolvedRecipient.phone) {
      const agentLabelSms = String(resolvedRecipient.name || resolvedRecipient.firstName || 'there').trim();
      const smsCore = isDeliveryComplete
        ? [
            assetLinks.length
              ? `${agentLabelSms}, we have your requested marketing assets ready. Click the Google Drive link below to view.`
              : `${agentLabelSms}, we have your requested marketing assets ready. Your assets were emailed — reply if you need them resent.`,
            '',
            'Respond to this text if you need any revisions.',
          ].join('\n')
        : message;
      const smsBody = isDeliveryComplete
        ? (assetLinks.length
            ? `${smsCore}\n\n${assetLinks[0]}`
            : `${smsCore}\n\nYour assets were emailed — reply if you need them resent.`)
        : (assetLinks.length ? `${smsCore}\n\nFiles:\n${assetLinks.join('\n')}` : smsCore);
      try {
        const { sendSmsNotification } = await import('../notifications/smsProvider.js');
        const smsResult = await sendSmsNotification({}, resolvedRecipient.phone, smsBody);
        if (smsResult.success) {
          results.sms = {
            success: true,
            recipient: resolvedRecipient.maskedPhone,
            status: 'sent',
            messageId: smsResult.messageId
          };
        } else {
          results.sms = {
            success: false,
            recipient: resolvedRecipient.maskedPhone,
            status: 'failed',
            error: smsResult.error || 'SMS not sent'
          };
        }
      } catch (err: any) {
        results.sms = {
          success: false,
          recipient: resolvedRecipient.maskedPhone,
          status: 'failed',
          error: err?.message || 'SMS dispatch error'
        };
      }
    }

    const emailChannelRequested = channels.includes('email');
    const smsChannelRequested = channels.includes('sms');
    const emailOk = !emailChannelRequested || results.email?.success === true;
    const smsOk = !smsChannelRequested || results.sms?.success === true;

    // Independent channels: email success must never be blocked by SMS failure.
    // Fail closed only when every requested channel failed (or the sole channel failed).
    const anyDelivered = (emailChannelRequested && emailOk) || (smsChannelRequested && smsOk);
    const hardFail = !anyDelivered;

    if (hardFail) {
      const parts: string[] = [];
      if (emailChannelRequested && !emailOk) {
        parts.push(`email: ${results.email?.error || results.email?.status || 'failed'}`);
      }
      if (smsChannelRequested && !smsOk) {
        parts.push(`text: ${results.sms?.error || results.sms?.status || 'failed'}`);
      }
      return res.status(502).json({
        success: false,
        campaignId,
        channels: results,
        assetLinks,
        cc: resolvedCc,
        error: `Outreach not sent (${parts.join('; ')}). Task left open — not completed.`,
        message: `Outreach not sent (${parts.join('; ')}). Task left open — not completed.`
      });
    }

    const warnings: string[] = [];
    if (emailChannelRequested && !emailOk) {
      warnings.push(`email failed: ${results.email?.error || results.email?.status || 'failed'}`);
    }
    if (smsChannelRequested && !smsOk) {
      warnings.push(`text failed: ${results.sms?.error || results.sms?.status || 'failed'}`);
    }

    sentOnceMap.set(outreachOnceKey, Date.now());
    try {
      await recordActivityEvent({
        workspaceId,
        requestId: campaignId,
        taskId: outreachTaskKey,
        eventType: 'outreach.provider_accepted',
        actorType: 'system',
        actorDisplayName: 'NORA',
        channel: channels.includes('email') ? 'email' : 'phone',
        direction: 'outbound',
        communicationStatus: 'provider_accepted',
        summary: `Dispatched ${intent} for ${outreachTaskKey}`,
        metadata: { intent, taskId: outreachTaskKey, dispatched: true, assetLinks, warnings },
        idempotencyKey: `${outreachOnceKey}:done`
      });
    } catch {}

    return res.status(200).json({
      success: true,
      partial: warnings.length > 0,
      campaignId,
      dispatchedAt: new Date().toISOString(),
      channels: results,
      assetLinks,
      cc: resolvedCc,
      warnings: [...warnings, ...(driveWarning ? [driveWarning] : [])],
      message: warnings.length || driveWarning
        ? `Delivered with warnings (${[...warnings, ...(driveWarning ? [driveWarning] : [])].join('; ')}).`
        : `Request successfully dispatched to ${resolvedRecipient.name}!`
    });
  } catch (err: any) {
    console.error('[Marketing Questions Route Exception]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal error dispatching questions.'
    });
  }
});

/** Create/reuse AskNora Drive folder + upload proofs; only returns URL when linkable. */
marketingQuestionsRouter.post('/api/marketing/tasks/:taskId/ensure-drive', async (req: Request, res: Response) => {
  try {
    const taskId = String(req.params.taskId || '').trim();
    if (!taskId) return res.status(400).json({ success: false, error: 'taskId required' });
    const tasks = getAllCanonicalMarketingTasks();
    const task = tasks.find((x: any) => x.id === taskId);
    const stagedAssets = Array.isArray(req.body?.stagedAssets) ? req.body.stagedAssets : [];
    const pack = task
      ? await ensureAskNoraDeliveryDrivePack(task, { stagedAssets })
      : await ensureAskNoraDeliveryDrivePack({
          id: taskId,
          propertyAddress: req.body?.propertyAddress,
          agentName: req.body?.agentName,
          agentEmail: req.body?.agentEmail,
          proofUrl: req.body?.proofUrl,
          attachments: req.body?.attachments,
        }, { stagedAssets });

    if (task && pack.linkable && pack.driveFolderUrl) {
      task.driveFolderUrl = pack.driveFolderUrl;
      task.updatedAt = new Date().toISOString();
      saveCanonicalMarketingTask(task);
    }

    return res.status(pack.linkable ? 200 : 200).json({
      success: true,
      linkable: pack.linkable,
      driveFolderUrl: pack.linkable ? pack.driveFolderUrl : '',
      driveFolderId: pack.linkable ? pack.driveFolderId : '',
      uploaded: pack.uploaded || [],
      error: pack.linkable ? undefined : (pack.error || 'Folder not linkable yet'),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'ensure-drive failed' });
  }
});
