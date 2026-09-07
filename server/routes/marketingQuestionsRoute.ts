/**
 * Marketing Questions Dispatch Route
 * Handles "Ask Agent" missing information outreach.
 * Strictly enforces canonical recipient resolution, server-enforced Ask NORA sender,
 * provider-neutral responses, and outbound safety gates.
 */

import { Router, Request, Response } from 'express';
import { dispatchEmailViaResend } from '../email/resendDispatchAdapter.js';
import {
  resolveServerCanonicalRecipient,
  isProhibitedPhone,
  isProhibitedEmail,
  isHotlineNumber
} from '../services/canonicalRecipientService.js';
import { recordActivityEvent } from '../services/activityHistoryService.js';

export const marketingQuestionsRouter = Router();

export interface SendQuestionsPayload {
  campaignId: string;
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
      workspaceId = 'ws_wilmington'
    } = req.body as SendQuestionsPayload;

    if (!campaignId || !message || (!recipientName && !requesterId && !recipientEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required request parameters (campaignId, message, recipient identifier).'
      });
    }

    // 1. Strictly Reject Hotline Number and Generic Placeholder Email if submitted
    if (recipientPhone && isHotlineNumber(recipientPhone)) {
      return res.status(400).json({
        success: false,
        error: 'Prohibited recipient: The NORA hotline number (910) 507-2047 cannot be used as an agent destination.'
      });
    }
    if (recipientEmail && isProhibitedEmail(recipientEmail)) {
      return res.status(400).json({
        success: false,
        error: `Prohibited recipient: Placeholder email "${recipientEmail}" cannot receive messages.`
      });
    }

    // 2. Server-side Canonical Recipient Re-resolution
    const resolvedRecipient = await resolveServerCanonicalRecipient({
      requesterId,
      requesterName: recipientName,
      requesterEmail: recipientEmail,
      requesterPhone: recipientPhone,
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

    // 3. Check Outbound Mode Safety Gate
    const isOutboundDisabled = 
      process.env.OUTBOUND_MODE === 'disabled' || 
      process.env.NODE_ENV === 'test' || 
      process.env.ALLOW_EXTERNAL_DISPATCH !== 'true';

    if (isOutboundDisabled) {
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
          fromAddress: 'AskNora@NestRealty.com'
        },
        idempotencyKey: `outreach_draft_${campaignId}_${Date.now()}`
      }).catch(err => console.warn('[Activity Event Warning]:', err));

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

    // 5. Dispatch Email via Provider
    if (channels.includes('email') && resolvedRecipient.email) {
      const emailSubject = `[Task #${campaignId}] Missing Information Request — ${propertyAddress}`;
      const questionsListHtml = selectedQuestions.length > 0
        ? `<ul style="margin: 12px 0; padding-left: 20px; color: #01362D; line-height: 1.6;">${selectedQuestions.map(q => `<li style="margin-bottom: 6px;"><strong>${q}</strong></li>`).join('')}</ul>`
        : '';

      const formattedHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="background: #00635C; padding: 24px; color: #ffffff; text-align: left;">
            <h2 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700;">Nest Realty • Marketing Request</h2>
            <p style="margin: 0; font-size: 13px; color: #e6fffa; opacity: 0.9;">Property: ${propertyAddress}</p>
          </div>
          <div style="padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.6;">
            <p>Hi <strong>${resolvedRecipient.firstName}</strong>,</p>
            <p>We need a few additional details to continue the marketing request for <strong>${propertyAddress}</strong>:</p>
            ${questionsListHtml}
            <div style="background: #f8fafc; border-left: 4px solid #00635C; padding: 14px 18px; margin: 20px 0; border-radius: 6px;">
              <p style="margin: 0; font-size: 13px; color: #334155; white-space: pre-line;">${message}</p>
            </div>
            <p style="font-size: 13px; color: #64748b;">You can reply directly to this email, and NORA will add the information to the existing request.</p>
          </div>
          <div style="background: #f1f5f9; padding: 16px 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0;">
            From Ask NORA • AskNora@NestRealty.com
          </div>
        </div>
      `;

      try {
        // Record queued event
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
          metadata: { recipientEmail: resolvedRecipient.maskedEmail, from: enforcedFromAddress },
          idempotencyKey: `outreach_queued_email_${campaignId}_${Date.now()}`
        }).catch(() => {});

        const emailResult = await dispatchEmailViaResend({
          to: resolvedRecipient.email,
          from: enforcedFromAddress,
          subject: emailSubject,
          html: formattedHtml,
          text: message,
          campaignId
        });

        if (emailResult.success) {
          // Record provider accepted event
          await recordActivityEvent({
            workspaceId,
            requestId: campaignId,
            eventType: 'outreach.provider_accepted',
            actorType: 'system',
            actorDisplayName: 'Email Gateway',
            channel: 'email',
            direction: 'outbound',
            communicationStatus: 'provider_accepted',
            summary: `Email accepted by provider.`,
            metadata: { messageId: emailResult.receipt?.resendMessageId, recipient: resolvedRecipient.maskedEmail },
            idempotencyKey: `outreach_accepted_email_${campaignId}_${Date.now()}`
          }).catch(() => {});

          results.email = {
            success: true,
            recipient: resolvedRecipient.maskedEmail,
            status: 'sent'
          };
        } else {
          results.email = {
            success: false,
            recipient: resolvedRecipient.maskedEmail,
            status: 'failed'
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

    // 6. Dispatch SMS via Gateway
    if (channels.includes('sms') && resolvedRecipient.phone) {
      const { isAllowedSmsRecipient, recordSmsDispatch } = await import('../security/smsWhitelistGate.js');
      const safetyCheck = isAllowedSmsRecipient(resolvedRecipient.phone, message);

      if (!safetyCheck.allowed) {
        results.sms = {
          success: true,
          recipient: resolvedRecipient.maskedPhone,
          status: 'suppressed',
          reason: safetyCheck.reason
        };
      } else {
        recordSmsDispatch(safetyCheck.cleanPhone, message);
        results.sms = {
          success: true,
          recipient: resolvedRecipient.maskedPhone,
          status: 'sent'
        };
      }
    }

    return res.status(200).json({
      success: true,
      campaignId,
      dispatchedAt: new Date().toISOString(),
      channels: results,
      message: `Request successfully dispatched to ${resolvedRecipient.name}!`
    });
  } catch (err: any) {
    console.error('[Marketing Questions Route Exception]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal error dispatching questions.'
    });
  }
});
