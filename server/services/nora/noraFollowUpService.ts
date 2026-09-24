/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Conversation Follow-Up Orchestration Service
 * Connects caller identity resolution, verified knowledge grounding, decision rules,
 * Google Workspace / Gmail dispatch (AskNora@nestrealty.com), and persistent ledger auditing.
 */

import { google } from 'googleapis';
import { 
  NoraConversationOutcome, 
  NoraAgentIdentity, 
  NoraCallerIdentity, 
  NoraKnowledgeItem, 
  NoraSopItem, 
  NoraResourceItem, 
  PersistedFollowUpEmail,
  NoraFollowUpStatus 
} from './noraOutcomeTypes.js';
import { NoraFollowUpDecisionEngine } from './noraFollowUpDecisionEngine.js';
import { NoraEmailComposer } from './noraEmailComposer.js';
import { 
  saveFollowUpEmailAsync, 
  getFollowUpEmailByIdempotencyKeyAsync 
} from '../../persistence/noraFollowUpRepository.js';
import { updateTelephonyCallFollowUpAsync } from '../../persistence/telephonyCallsRepository.js';
import { CallerGatekeeperService, DirectoryCaller } from '../../integrations/telephony/callerGatekeeperService.js';
import { getGoogleServiceAccountJWTClient } from '../../integrations/google/googleOAuth.js';
import { isProhibitedEmail } from '../canonicalRecipientService.js';
import { checkOutbound } from '../../email/outboundGate.js';
import { deliverGmailMessage } from '../../email/gatedTransport.js';
import { NEST_FULL_ROSTER_72 } from '../../persistence/nestRosterSeed.js';
import { BROKERAGE_KEY_STAFF } from '../../knowledge/unifiedContextRetriever.js';

export interface ProcessCallFollowUpOptions {
  callId: string;
  fromNumber: string;
  callerName?: string;
  transcript: string;
  summary?: string;
  propertyAddress?: string;
  createdRequestId?: string;
  createdTasksCount?: number;
  durationSeconds?: number;
  forceFollowUp?: boolean;
}

export class NoraFollowUpService {
  /**
   * Processes a completed voice call and executes automated knowledge follow-up if warranted.
   */
  public static async processVoiceCall(options: ProcessCallFollowUpOptions): Promise<NoraConversationOutcome> {
    const {
      callId,
      fromNumber,
      transcript = '',
      summary = '',
      createdRequestId,
      durationSeconds = 45
    } = options;

    // 1. Resolve Direct Caller & Check for Represented Agent ("on-behalf-of")
    const { agentIdentity, callerIdentity } = this.resolveConversationIdentities({
      fromNumber,
      callerName: options.callerName,
      transcript
    });

    // 2. Synthesize Goal, Intent, Knowledge Used, and Micro-SOPs
    const synthesis = this.synthesizeConversationKnowledge(transcript, summary, createdRequestId);

    // 3. Assemble Initial Outcome Candidate
    const now = new Date().toISOString();
    const candidateOutcome: NoraConversationOutcome = {
      conversationId: callId,
      channel: 'voice',
      startedAt: new Date(Date.now() - durationSeconds * 1000).toISOString(),
      endedAt: now,
      durationSeconds,
      agentIdentity,
      callerIdentity,
      intent: synthesis.intent,
      goal: synthesis.goal,
      summary: summary || synthesis.summary,
      transcript,
      knowledgeUsed: synthesis.knowledgeUsed,
      sopsUsed: synthesis.sopsUsed,
      resourcesUsed: synthesis.resourcesUsed,
      warnings: synthesis.warnings,
      requestsCreated: synthesis.requestsCreated,
      resolutionStatus: synthesis.resolutionStatus,
      followUp: {
        recommended: false,
        reason: '',
        followUpType: 'NONE',
        idempotencyKey: `${callId}_NONE`,
        status: 'pending'
      }
    };

    // 4. Run Follow-Up Decision Engine
    const decision = NoraFollowUpDecisionEngine.evaluateFollowUp({
      conversationId: callId,
      transcript,
      query: synthesis.goal,
      intent: synthesis.intent,
      agentIdentity,
      callerIdentity,
      knowledgeUsed: synthesis.knowledgeUsed,
      sopsUsed: synthesis.sopsUsed,
      requestsCreated: synthesis.requestsCreated
    });

    candidateOutcome.followUp.recommended = decision.recommended;
    candidateOutcome.followUp.reason = decision.reason;
    candidateOutcome.followUp.followUpType = decision.followUpType;
    candidateOutcome.followUp.idempotencyKey = decision.idempotencyKey;

    // If follow-up is not recommended or caller is unverified, update call ledger and exit
    if (!decision.recommended || decision.followUpType === 'NONE' || !agentIdentity.email) {
      candidateOutcome.followUp.status = 'suppressed';
      await this.syncTelephonyCallLedger(callId, candidateOutcome);
      return candidateOutcome;
    }

    // 5. Idempotency Check: Prevent duplicate dispatch
    const existing = await getFollowUpEmailByIdempotencyKeyAsync(decision.idempotencyKey);
    if (existing && (existing.status === 'sent' || existing.status === 'pending')) {
      candidateOutcome.followUp.status = 'suppressed';
      candidateOutcome.followUp.reason = 'Duplicate follow-up prevented by idempotency gate.';
      candidateOutcome.followUp.sentAt = existing.sentAt;
      candidateOutcome.followUp.messageId = existing.messageId;
      await this.syncTelephonyCallLedger(callId, candidateOutcome);
      return candidateOutcome;
    }

    // 6. Compose Knowledge-Grounded Email
    const composed = NoraEmailComposer.composeFollowUpEmail(candidateOutcome);
    if (!composed) {
      candidateOutcome.followUp.status = 'suppressed';
      candidateOutcome.followUp.reason = 'Email composer produced null output.';
      await this.syncTelephonyCallLedger(callId, candidateOutcome);
      return candidateOutcome;
    }

    candidateOutcome.followUp.subject = composed.subject;
    candidateOutcome.followUp.recipientEmail = composed.recipientEmail;

    // 7. Dispatch Email via Google Workspace (AskNora@nestrealty.com)
    const emailRecordId = `eml_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const persistedRecord: PersistedFollowUpEmail = {
      id: emailRecordId,
      conversationId: callId,
      conversationChannel: 'voice',
      idempotencyKey: decision.idempotencyKey,
      recipientEmail: composed.recipientEmail,
      recipientName: composed.recipientName,
      representedAgentId: callerIdentity.representedAgentId,
      callerName: callerIdentity.name,
      callerPhone: callerIdentity.phone,
      intent: synthesis.intent,
      subject: composed.subject,
      bodyText: composed.bodyText,
      bodyHtml: composed.bodyHtml,
      status: 'pending',
      knowledgeAssertionIds: composed.knowledgeAssertionIds,
      sopCodes: composed.sopCodes,
      resourceUrls: composed.resourceUrls,
      warnings: composed.warnings,
      metadata: {
        channel: 'voice',
        durationSeconds,
        isRepresented: callerIdentity.isRepresentingAgent
      },
      createdAt: now,
      updatedAt: now
    };

    // Save as pending before network dispatch
    await saveFollowUpEmailAsync(persistedRecord);

    try {
      const messageId = await this.sendOutboundEmailViaAskNora({
        to: composed.recipientEmail,
        subject: composed.subject,
        bodyHtml: composed.bodyHtml
      });

      persistedRecord.status = 'sent';
      persistedRecord.messageId = messageId;
      persistedRecord.sentAt = new Date().toISOString();
      await saveFollowUpEmailAsync(persistedRecord);

      candidateOutcome.followUp.status = 'sent';
      candidateOutcome.followUp.sentAt = persistedRecord.sentAt;
      candidateOutcome.followUp.messageId = messageId;
    } catch (sendErr: any) {
      console.error('[NoraFollowUpService] Failed to send outbound email:', sendErr.message);
      persistedRecord.status = 'failed';
      persistedRecord.errorMessage = sendErr.message;
      await saveFollowUpEmailAsync(persistedRecord);

      candidateOutcome.followUp.status = 'failed';
      candidateOutcome.followUp.errorMessage = sendErr.message;
    }

    // 8. Sync Call Ledger
    await this.syncTelephonyCallLedger(callId, candidateOutcome, emailRecordId);
    return candidateOutcome;
  }

  /**
   * Resolves direct caller identity and checks for "on-behalf-of" represented agent.
   */
  public static resolveConversationIdentities(params: {
    fromNumber: string;
    callerName?: string;
    transcript: string;
  }): { agentIdentity: NoraAgentIdentity; callerIdentity: NoraCallerIdentity } {
    const { fromNumber, callerName, transcript } = params;

    // 1. Direct Caller ID lookup
    let directCaller: DirectoryCaller | null = null;
    const phoneRes = CallerGatekeeperService.resolveCallerByPhone(fromNumber);
    if (phoneRes.isRecognized && phoneRes.caller) {
      directCaller = phoneRes.caller;
    } else if (callerName && !callerName.toLowerCase().includes('inbound') && !callerName.toLowerCase().includes('caller')) {
      const nameRes = CallerGatekeeperService.resolveCallerByName(callerName, fromNumber);
      if (nameRes.isVerified && nameRes.caller) {
        directCaller = nameRes.caller;
      }
    }

    // 2. Check for Assistant / Represented Agent cues in transcript
    // e.g. "calling for Marcus", "calling on behalf of Marcus Aman", "Jennifer calling for Marcus"
    const onBehalfMatch = transcript.match(/(?:calling for|on behalf of|calling on behalf of|assistant for|asking for)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
    
    // Also detect assistant identifying herself: "this is Jennifer" or "my name is Jennifer"
    let assistantName = '';
    const assistantIntroMatch = transcript.match(/(?:this is|my name is|i am|i'm)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
    if (assistantIntroMatch) {
      assistantName = assistantIntroMatch[1].trim();
    }

    if (onBehalfMatch) {
      const targetAgentSpoken = onBehalfMatch[1].trim();
      const representedRes = CallerGatekeeperService.resolveCallerByName(targetAgentSpoken);

      if (representedRes.isVerified && representedRes.caller) {
        const repAgent = representedRes.caller;
        const actualCallerName = assistantName || (directCaller ? directCaller.fullName : 'Assistant');

        return {
          agentIdentity: {
            status: 'verified',
            agentId: repAgent.id,
            fullName: repAgent.fullName,
            email: repAgent.email,
            office: repAgent.office,
            market: 'Wilmington',
            role: repAgent.role
          },
          callerIdentity: {
            name: actualCallerName,
            phone: fromNumber,
            isRepresentingAgent: true,
            representedAgentId: repAgent.id,
            representedAgentName: repAgent.fullName,
            relationshipToAgent: 'assistant'
          }
        };
      }
    }

    // 3. Fallback: Direct Agent caller
    if (directCaller) {
      return {
        agentIdentity: {
          status: 'verified',
          agentId: directCaller.id,
          fullName: directCaller.fullName,
          email: directCaller.email,
          office: directCaller.office,
          market: 'Wilmington',
          role: directCaller.role
        },
        callerIdentity: {
          name: directCaller.fullName,
          phone: fromNumber,
          isRepresentingAgent: false,
          relationshipToAgent: 'self'
        }
      };
    }

    // 4. Unrecognized Caller
    return {
      agentIdentity: {
        status: 'unverified',
        fullName: callerName || 'Inbound Caller',
        email: null,
        office: 'Nest Realty Wilmington',
        market: 'Wilmington',
        role: 'Unknown'
      },
      callerIdentity: {
        name: callerName || 'Inbound Caller',
        phone: fromNumber,
        isRepresentingAgent: false,
        relationshipToAgent: 'unknown'
      }
    };
  }

  /**
   * Synthesizes conversation knowledge, SOPs, links, and warnings based on verified Nest U data.
   */
  public static synthesizeConversationKnowledge(
    transcript: string,
    summary: string,
    createdRequestId?: string
  ): {
    intent: string;
    goal: string;
    summary: string;
    knowledgeUsed: NoraKnowledgeItem[];
    sopsUsed: NoraSopItem[];
    resourcesUsed: NoraResourceItem[];
    warnings: string[];
    requestsCreated: Array<{ requestId: string; type: string; assignedTo: string; summary: string }>;
    resolutionStatus: 'resolved' | 'escalated' | 'action_created' | 'unresolved';
  } {
    const text = `${transcript} ${summary}`.toLowerCase();
    const knowledgeUsed: NoraKnowledgeItem[] = [];
    const sopsUsed: NoraSopItem[] = [];
    const resourcesUsed: NoraResourceItem[] = [];
    const warnings: string[] = [];
    const requestsCreated: Array<{ requestId: string; type: string; assignedTo: string; summary: string }> = [];

    let intent = 'GENERAL_OPERATIONAL_INQUIRY';
    let goal = 'General Operational Inquiry';
    let resolutionStatus: 'resolved' | 'escalated' | 'action_created' | 'unresolved' = 'resolved';

    // 1. BRANDING & SELF-CREATED MARKETING COLLATERAL
    if (text.includes('brand') || text.includes('font') || text.includes('logo') || text.includes('making my own') || text.includes('marketing piece')) {
      intent = 'CREATE_NEST_MARKETING_MATERIAL';
      goal = 'Self-created compliant Nest marketing materials';

      knowledgeUsed.push({
        assertionId: 'ka_brand_fonts_01',
        title: 'Nest Brand Typography',
        summary: 'Official primary brand fonts are Elza (clean, modern sans-serif) and Larken (classic serif header font).',
        verificationStatus: 'VERIFIED',
        sourceTitle: 'Nest U: Branding & Maxa Design Center',
        sourceUrl: 'https://sites.google.com/nestrealty.com/nest-u/nest-branding'
      });

      knowledgeUsed.push({
        assertionId: 'ka_brand_logos_02',
        title: 'Vector Logo Library',
        summary: 'High-resolution vector EPS and transparent PNG logos are available in the official Box library.',
        verificationStatus: 'VERIFIED',
        sourceTitle: 'Nest U: Branding & Assets',
        sourceUrl: 'https://sites.google.com/nestrealty.com/nest-u/nest-branding'
      });

      resourcesUsed.push({
        title: 'Approved Brand Fonts Pack (Elza & Larken)',
        url: 'https://nestrealty.box.com/s/nest-fonts-elza-larken',
        description: 'Direct Box download for official typography files.',
        type: 'download'
      });

      resourcesUsed.push({
        title: 'Official Vector Logo Library',
        url: 'https://nestrealty.box.com/s/nest-vector-logos',
        description: 'Complete high-resolution vector and PNG logo assets.',
        type: 'download'
      });

      resourcesUsed.push({
        title: 'Nest Design Center (Maxa)',
        url: 'https://nest.maxadesigns.com',
        description: 'Self-service marketing design templates and print ordering.',
        type: 'portal'
      });

      // Video watermark guardrail
      if (text.includes('video') || text.includes('footage') || text.includes('tour')) {
        warnings.push('MLS & Portal Media Rule: Video walkthroughs must NOT contain agent contact numbers, personal URLs, or watermark overlays.');
      }
    }

    // 2. FRIENDS OF NEST (FON) / CLIENT NURTURING
    if (text.includes('friends of nest') || text.includes('fon') || text.includes('client nurturing')) {
      intent = 'SETUP_FRIENDS_OF_NEST';
      goal = 'Friends of Nest direct mail campaign setup';

      knowledgeUsed.push({
        assertionId: 'ka_fon_structure_01',
        title: 'Friends of Nest Annual Mailer Structure',
        summary: '8 annual touchpoints: 2 NEST Magazines, 2 Real Insights, and 4 high-grade educational postcards.',
        verificationStatus: 'VERIFIED',
        sourceTitle: 'Nest U: Friends of Nest Program',
        sourceUrl: 'https://sites.google.com/nestrealty.com/nest-u/friends-of-nest'
      });

      knowledgeUsed.push({
        assertionId: 'ka_fon_min_order_02',
        title: '50-Recipient Minimum Threshold',
        summary: 'Minimum order is 50 recipients. Client lists under 50 will be billed the base minimum charge.',
        verificationStatus: 'VERIFIED',
        sourceTitle: 'Nest U: Campaigns & FON Rules',
        sourceUrl: 'https://sites.google.com/nestrealty.com/nest-u/friends-of-nest'
      });

      resourcesUsed.push({
        title: 'Nest Campaigns Management Tool',
        url: 'https://campaigns.nestrealty.com',
        description: 'Portal to manage client address lists and verify campaign enrollment.',
        type: 'portal'
      });

      warnings.push('Campaign Deadline: Orders must be finalized before the quarterly deadline. Missed deadlines incur an automatic 50-mailer base penalty.');
    }

    // 3. SIGN POSTS & RIDERS (SOP-OPS-001)
    if (text.includes('sign') || text.includes('rider') || text.includes('post') || text.includes('yard sign')) {
      intent = 'ORDER_SIGN_POST_RIDER';
      goal = 'Coastal Sign Post installation and custom sign rider order';

      sopsUsed.push({
        code: 'SOP-OPS-001',
        title: 'Coastal Sign Post Co. Yard Post Protocol',
        owner: 'Ann Gunn (Operations Lead)',
        stepsSummary: [
          'Submit installation request with exact property address and pin placement.',
          'Coastal Sign Post initiates NC811 underground utility location ticket.',
          'White post and approved Nest yard sign installed within 24–48 hours of ticket clearance.'
        ]
      });

      resourcesUsed.push({
        title: 'Coastal Sign Post Ordering Portal',
        url: 'https://coastalsignpost.com',
        description: 'Vendor portal for yard post installation and rider attachments.',
        type: 'portal'
      });
    }

    // 4. BUYER BROKER AGREEMENT & COMPENSATION POLICY
    if (text.includes('buyer broker') || text.includes('compensation') || text.includes('commission policy') || text.includes('buyer agreement')) {
      intent = 'BUYER_BROKER_POLICY';
      goal = 'Mandatory Buyer Broker Agreement & Compensation Rules';

      knowledgeUsed.push({
        assertionId: 'ka_compliance_buyer_broker_01',
        title: 'Mandatory Written Buyer Broker Agreement',
        summary: 'In compliance with NAR antitrust settlement and NCREC rules, a fully executed written Buyer Broker Agreement specifying broker compensation is mandatory prior to touring any residential property.',
        verificationStatus: 'VERIFIED',
        sourceTitle: 'Nest Agent Handbook & NCREC Guidelines',
        sourceUrl: 'https://sites.google.com/nestrealty.com/nest-u/deals'
      });

      resourcesUsed.push({
        title: 'NC Form 201 (Exclusive Buyer Agency Agreement)',
        url: 'https://rechat.com',
        description: 'Standard agency contract available in Rechat Deals.',
        type: 'form'
      });

      warnings.push('Zero-Tour Exception: Touring any property (in-person or live virtual) without a signed agreement constitutes a serious license law violation.');
    }

    // 5. TECH SETUP / RECHAT ACCESS
    if (text.includes('rechat') || text.includes('login') || text.includes('password') || text.includes('trouble getting into') || text.includes('access')) {
      intent = 'TECH_SUPPORT_RECHAT';
      goal = 'Rechat CRM and Deals access troubleshooting';

      resourcesUsed.push({
        title: 'Rechat Web Login Portal',
        url: 'https://rechat.com',
        description: 'Direct login to CRM, Deals, and Marketing center.',
        type: 'portal'
      });
    }

    // 6. ACTION DISPATCHED / TICKET CREATED
    if (createdRequestId || text.includes('tell ann') || text.includes('ask ann') || text.includes('route this to melissa') || text.includes('marketing request')) {
      resolutionStatus = 'action_created';
      if (text.includes('rechat') || text.includes('trouble')) {
        requestsCreated.push({
          requestId: createdRequestId || `tkt_${Date.now()}`,
          type: 'Technical Support',
          assignedTo: 'Ann Gunn (Operations Lead)',
          summary: 'Rechat access login issue reported during phone call.'
        });
      } else if (text.includes('marketing') || text.includes('flyer')) {
        requestsCreated.push({
          requestId: createdRequestId || `tkt_${Date.now()}`,
          type: 'Marketing Collateral Production',
          assignedTo: 'Melissa Gagliardi (Marketing Director)',
          summary: summary || 'Listing collateral package intake.'
        });
      }
    }

    // 7. ESCALATION FOR UNVERIFIED POLICY (e.g. Farming Cancellation / Adwerx listing eligibility)
    if (text.includes('cancel my farming') || text.includes('cancel farming') || text.includes('farming contract')) {
      knowledgeUsed.push({
        assertionId: 'ka_farming_cancel_01',
        title: '1-Year Non-Cancelable Farming Commitment',
        summary: 'Farming contracts represent a binding 1-year corporate printing commitment with quarterly mailers.',
        verificationStatus: 'VERIFIED',
        sourceTitle: 'Nest U: Nest Farming Contract Rules',
        sourceUrl: 'https://sites.google.com/nestrealty.com/nest-u/nest-farming'
      });

      if (text.includes('refund') || text.includes('early termination fee') || text.includes('penalty')) {
        knowledgeUsed.push({
          assertionId: 'ka_farming_penalty_unverified',
          title: 'Early Termination Penalty Calculation',
          summary: 'Specific dollar calculations for early buyout are not documented in Nest U and require BIC sign-off.',
          verificationStatus: 'UNVERIFIED',
          sourceTitle: 'Nest U Operational Rules',
          caveat: 'Requires individual review by Ryan Crecelius.'
        });
        resolutionStatus = 'escalated';
      }
    }

    return {
      intent,
      goal,
      summary,
      knowledgeUsed,
      sopsUsed,
      resourcesUsed,
      warnings,
      requestsCreated,
      resolutionStatus
    };
  }

  /**
   * Dispatches email via authorized AskNora@nestrealty.com Google Workspace account.
   */
  public static async sendOutboundEmailViaAskNora(params: {
    to: string;
    subject: string;
    bodyHtml: string;
  }): Promise<string> {
    const { to, subject, bodyHtml } = params;

    // Safety checks
    if (!to || isProhibitedEmail(to)) {
      throw new Error(`DISPATCH_REJECTED: Recipient "${to}" is prohibited or invalid.`);
    }
    const gate = checkOutbound({ to, channel: 'gmail', source: 'noraFollowUpService' });
    if (!gate.allowed) {
      throw new Error(`DISPATCH_REJECTED: outbound ${gate.reason}`);
    }

    // Check test / mock environments
    const isTestMode = process.env.NODE_ENV === 'test';
    const isMock = process.env.MOCK_INTEGRATIONS === 'true' || isTestMode;

    const jwtClient = getGoogleServiceAccountJWTClient(
      'AskNora@nestrealty.com',
      ['https://www.googleapis.com/auth/gmail.send']
    );

    if (isMock || !jwtClient) {
      console.log(`[AskNora Outbound Mock] Dispatched email to "${to}" with subject: "${subject}"`);
      return `mock_msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    // Real Google Workspace Gmail API Call
    try {
      const gmail = google.gmail({ version: 'v1', auth: jwtClient });

      const emailLines = [
        `From: "NORA (Nest Operations)" <AskNora@nestrealty.com>`,
        `To: ${to}`,
        `Reply-To: AskNora@nestrealty.com`,
        `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=utf-8`,
        ``,
        bodyHtml
      ];

      const raw = Buffer.from(emailLines.join('\r\n'))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await deliverGmailMessage(gmail, {
        requestBody: { raw },
        to: gate.effectiveTo,
        source: 'noraFollowUpService',
      });
      if (!res.sent) {
        throw new Error(`DISPATCH_REJECTED: outbound ${res.gate.reason}`);
      }

      return res.messageId || res.response?.data?.id || `gmail_msg_${Date.now()}`;
    } catch (err: any) {
      console.error('[AskNora Gmail API Error]:', err.message);
      throw new Error(`Google Workspace Gmail API error: ${err.message}`);
    }
  }

  /**
   * Synchronizes follow-up status back to the persistent telephony call ledger.
   */
  private static async syncTelephonyCallLedger(
    callId: string,
    outcome: NoraConversationOutcome,
    followUpEmailId?: string
  ): Promise<void> {
    try {
      const knowledgeTitles = (outcome.knowledgeUsed || []).map(k => k.title);
      await updateTelephonyCallFollowUpAsync(callId, {
        followUpEmailId,
        followUpStatus: outcome.followUp.status,
        followUpSentAt: outcome.followUp.sentAt,
        conversationGoal: outcome.goal,
        knowledgeUsedSummary: knowledgeTitles
      });
    } catch (err: any) {
      console.warn('[NoraFollowUpService] Failed to sync call ledger with follow-up metadata:', err.message);
    }
  }
}
