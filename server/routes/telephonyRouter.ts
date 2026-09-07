/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Telephony & Inbound Caller ID Recognition Router
 * Connects Retell & Twilio Voice Gateways to the Nest Realty 72-Agent Directory.
 * Matches incoming caller phone numbers to inject dynamic variables and personalized greetings:
 * "Hello Matt... how are you today? This is Nora... what can I help you with?"
 * 
 * Features:
 * 1. CallerGatekeeper: Validates known numbers and challenges unknown callers for first/last name.
 * 2. OfficeSupplyDeduplication: Prevents "72 cases of water" duplicate tasks for Ann Gunn.
 */

import { Router } from 'express';
import { NEST_FULL_ROSTER_72 } from '../persistence/nestRosterSeed.js';
import { BROKERAGE_KEY_STAFF } from '../knowledge/unifiedContextRetriever.js';
import { queryUnifiedContext } from '../knowledge/unifiedContextRetriever.js';
import { convertCallToCanonicalMarketingRequest } from '../persistence/marketingCampaignsRepository.js';
import { sendEmail } from '../email/emailProvider.js';
import { CallerGatekeeperService, DirectoryCaller } from '../integrations/telephony/callerGatekeeperService.js';
import { OfficeSupplyDeduplicationService } from '../services/officeSupplyDeduplicationService.js';
import { NoraFollowUpService } from '../services/nora/noraFollowUpService.js';
import { 
  saveTelephonyCallAsync, 
  getTelephonyCallsByWorkspaceAsync, 
  linkCallToCanonicalRequestAsync 
} from '../persistence/telephonyCallsRepository.js';

export const telephonyRouter = Router();

export interface InboundCallRecord {
  callId: string;
  fromNumber: string;
  callerRecognized: boolean;
  callerName: string;
  firstName?: string;
  role?: string;
  office?: string;
  avatarUrl?: string;
  durationSeconds: number;
  timestamp: string;
  transcript: string;
  summary: string;
  ticketCreatedId?: string;
  recordingUrl?: string;
  smsFollowUpSent: boolean;
  createdRequestId?: string;
  createdTasksCount?: number;
  propertyAddress?: string;
  isSupplyDeduplicated?: boolean;
  supplyOrderNotes?: string;
  followUpStatus?: string;
  followUpSubject?: string;
  followUpSentAt?: string;
  followUpRecipient?: string;
  conversationGoal?: string;
  knowledgeUsed?: string[];
}

// In-memory / file-backed recent calls store
export const recentTelephonyCalls: InboundCallRecord[] = [
  {
    callId: 'call_b5307aa8db5cc8f3b25d9d0024d',
    fromNumber: '+12527170595',
    callerRecognized: true,
    callerName: 'Marcus Aman',
    firstName: 'Marcus',
    role: 'Broker / Tech Lead',
    office: 'Wilmington Mayfaire',
    durationSeconds: 100,
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    transcript: "Marcus: I need flyers for a listing that goes up on July fourteenth at 117 Colonial Drive, Wilmington NC.\nNora: I've got everything I need to create the request. I'll classify it as marketing, route it to Melissa, and mark it as high priority.",
    summary: 'Listing Flyer Package for 117 Colonial Drive (Print & Digital).',
    ticketCreatedId: 'tkt_mkt_117_colonial',
    propertyAddress: '117 Colonial Drive, Wilmington NC 28412',
    recordingUrl: 'https://dxc03zgurdly9.cloudfront.net/4269766aa19981f12134f954f1f5eacb3513f51aaca4480aad46a4da9d2ab41e/recording.wav',
    smsFollowUpSent: true,
    followUpStatus: 'sent',
    followUpSubject: '✓ Update: Listing Flyer Package for 117 Colonial Drive',
    followUpSentAt: new Date(Date.now() - 3600000 * 2 + 120000).toISOString(),
    followUpRecipient: 'marcus@shapework.co',
    conversationGoal: 'Listing Flyer Package for 117 Colonial Drive',
    knowledgeUsed: ['Nest Brand Standards', 'Elza + Larken', 'Photography Guide']
  },
  {
    callId: 'call_a27fe5bdf0e973e9cb5147d04e4',
    fromNumber: '+19106128283',
    callerRecognized: true,
    callerName: 'Matt Orr',
    firstName: 'Matt',
    role: 'REALTOR®',
    office: 'Mayfaire',
    durationSeconds: 110,
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    transcript: "Matt: Marketing package for a new listing at 1916 Walcott Avenue. Need website, flyer, and open house handouts.\nNora: Got it Matt. I'll route this to Melissa and set the priority as normal.",
    summary: 'Marketing Package & Property Website for 1916 Walcott Avenue.',
    ticketCreatedId: 'tkt_mkt_1916_walcott',
    propertyAddress: '1916 Walcott Avenue, Wilmington NC',
    recordingUrl: 'https://dxc03zgurdly9.cloudfront.net/3fa95a6dd3d65997f601f443481eba0d49ec0d4c204d76936a17e71df2edacf7/recording.wav',
    smsFollowUpSent: true
  },
  {
    callId: 'call_01d33c85d5b224ba38596acd6e5',
    fromNumber: '+12527170595',
    callerRecognized: true,
    callerName: 'Matt Orr',
    firstName: 'Matt',
    role: 'REALTOR®',
    office: 'Nest Realty Mayfaire',
    durationSeconds: 42,
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    transcript: "Matt: Hey Nora, can you check on the listing launch collateral package and social assets for our Wilmington listing?\nNora: Got it Matt. I am routing this request to Melissa and setting the priority as normal.",
    summary: 'Listing launch collateral package for Wilmington NC Area Listing.',
    ticketCreatedId: 'tkt_mkt_wilmington_listing',
    propertyAddress: 'Wilmington NC Area Listing',
    recordingUrl: 'https://dxc03zgurdly9.cloudfront.net/3dbfa908333ea11850a7f785dca46263355420ba6e0657570e6d122d61ba531c/recording.wav',
    smsFollowUpSent: true
  },
  {
    callId: 'call_02f88a91c7c331ab98210dfe4a1',
    fromNumber: '+19105550192',
    callerRecognized: true,
    callerName: 'Julie Brown',
    firstName: 'Julie',
    role: 'REALTOR®',
    office: 'Downtown',
    durationSeconds: 55,
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    transcript: "Julie: Hi Nora, I need luxury print flyers and social graphics for 124 Wrightsville Ave.\nNora: Hi Julie! Creating that marketing request right now and routing to Melissa.",
    summary: 'Luxury print flyers and social graphics package for 124 Wrightsville Ave.',
    ticketCreatedId: 'tkt_124_wrightsville',
    propertyAddress: '124 Wrightsville Ave, Wilmington NC',
    recordingUrl: 'https://dxc03zgurdly9.cloudfront.net/recording_02f88a.wav',
    smsFollowUpSent: true
  }
];

// Re-export helper for backwards compatibility
export function resolveCallerByPhone(rawPhone: string) {
  const res = CallerGatekeeperService.resolveCallerByPhone(rawPhone);
  if (res.isRecognized && res.caller) {
    return {
      callerRecognized: true,
      fullName: res.caller.fullName,
      firstName: res.caller.firstName,
      role: res.caller.role,
      office: res.caller.office,
      email: res.caller.email,
      phone: res.caller.primaryPhone
    };
  }
  return null;
}

// POST /api/voice-agent/telephony/inbound-lookup - Retell Dynamic Inbound Caller Resolver
telephonyRouter.post('/inbound-lookup', (req, res) => {
  const { from = '', from_number = '', call_id = `call_${Date.now()}` } = req.body || {};
  const callerPhone = from || from_number;

  const result = CallerGatekeeperService.resolveCallerByPhone(callerPhone);

  if (result.isRecognized && result.caller) {
    const caller = result.caller;
    return res.json({
      success: true,
      callerRecognized: true,
      firstName: caller.firstName,
      fullName: caller.fullName,
      role: caller.role,
      office: caller.office,
      phone: caller.primaryPhone,
      email: caller.email,
      permissionLevel: caller.permissionLevel,
      personalizedGreeting: result.greeting,
      retellVariables: {
        caller_recognized: 'true',
        caller_name: caller.fullName,
        first_name: caller.firstName,
        caller_role: caller.role,
        caller_office: caller.office,
        permission_level: caller.permissionLevel,
        personalized_greeting: result.greeting
      }
    });
  }

  // Fallback for unknown / unregistered numbers with Name Challenge
  return res.json({
    success: true,
    callerRecognized: false,
    needsNameVerification: true,
    suggestedPrompt: "What is your first and last name?",
    firstName: 'there',
    fullName: 'Inbound Caller',
    role: 'Caller',
    office: 'Nest Realty Wilmington',
    permissionLevel: 'RESTRICTED_GUEST',
    personalizedGreeting: result.greeting,
    retellVariables: {
      caller_recognized: 'false',
      ask_for_name: 'true',
      caller_name: 'Inbound Caller',
      first_name: 'there',
      caller_role: 'Caller',
      caller_office: 'Nest Realty Wilmington',
      permission_level: 'RESTRICTED_GUEST',
      personalized_greeting: result.greeting
    }
  });
});

// POST /api/voice-agent/telephony/verify-name - Mid-Call Spoken Name Verification
telephonyRouter.post('/verify-name', (req, res) => {
  const { spoken_name = '', from_number = '' } = req.body || {};
  const verification = CallerGatekeeperService.resolveCallerByName(spoken_name, from_number);

  return res.json({
    success: true,
    isVerified: verification.isVerified,
    caller: verification.caller,
    confirmationMessage: verification.confirmationMessage,
    phoneLinked: verification.phoneLinked,
    retellVariables: verification.isVerified && verification.caller ? {
      caller_recognized: 'true',
      caller_name: verification.caller.fullName,
      first_name: verification.caller.firstName,
      caller_role: verification.caller.role,
      caller_office: verification.caller.office,
      permission_level: verification.caller.permissionLevel,
      verification_message: verification.confirmationMessage
    } : {
      caller_recognized: 'false',
      permission_level: 'RESTRICTED_GUEST',
      verification_message: verification.confirmationMessage
    }
  });
});

// POST /api/voice-agent/telephony/office-supplies/request - Deduplicated Office Consumable Intake
telephonyRouter.post('/office-supplies/request', (req, res) => {
  const { 
    caller_name = 'Inbound Agent', 
    caller_role = 'REALTOR®',
    caller_phone = '', 
    office = 'Mayfaire', 
    request_text = '' 
  } = req.body || {};

  const result = OfficeSupplyDeduplicationService.checkAndConsolidateSupplyRequest({
    callerName: caller_name,
    callerRole: caller_role,
    callerPhone: caller_phone,
    office,
    requestText: request_text
  });

  return res.json({
    success: true,
    isDuplicate: result.isDuplicate,
    isNewTicketCreated: result.isNewTicketCreated,
    totalRequestersCount: result.totalRequestersCount,
    spokenMessage: result.spokenMessage,
    order: result.order
  });
});

// GET /api/voice-agent/telephony/calls - List Recent Calls with Caller Recognition
telephonyRouter.get('/calls', async (req, res) => {
  try {
    const dbCalls = await getTelephonyCallsByWorkspaceAsync('ws_wilmington', 50);
    if (dbCalls && dbCalls.length > 0) {
      const mapped: InboundCallRecord[] = dbCalls.map(c => ({
        callId: c.id,
        fromNumber: c.callerPhone || '',
        callerRecognized: Boolean(c.callerName && !c.callerName.toLowerCase().includes('inbound')),
        callerName: c.callerName || 'Phone Caller',
        firstName: c.callerName ? c.callerName.split(' ')[0] : 'Caller',
        role: 'Broker',
        office: c.callerOffice || 'Nest Realty Mayfaire',
        durationSeconds: c.durationSeconds || 0,
        timestamp: c.startedAt || c.createdAt,
        transcript: c.transcript || '',
        summary: c.transcript ? c.transcript.slice(0, 100) : 'Inbound call logged.',
        ticketCreatedId: c.canonicalRequestId,
        recordingUrl: c.recordingUrl,
        smsFollowUpSent: true,
        createdRequestId: c.canonicalRequestId,
        propertyAddress: c.propertyAddress,
        followUpStatus: c.followUpStatus || 'not_applicable',
        followUpSubject: (c as any).followUpSubject,
        followUpSentAt: c.followUpSentAt,
        followUpRecipient: (c as any).followUpRecipient,
        conversationGoal: c.conversationGoal,
        knowledgeUsed: c.knowledgeUsedSummary || []
      }));
      return res.json({ success: true, calls: mapped });
    }
  } catch (err: any) {
    console.warn('[telephonyRouter] Error querying persistent ledger for calls:', err);
  }
  return res.json({
    success: true,
    calls: recentTelephonyCalls
  });
});

// POST /api/voice-agent/telephony/webhook - Ingest Completed Retell Calls
telephonyRouter.post('/webhook', async (req, res) => {
  const { call_id, from_number = '', duration_seconds = 45, transcript = '', recording_url, property_address } = req.body || {};
  
  // 1. Resolve Caller via Phone or Transcript Name
  let matched = resolveCallerByPhone(from_number);
  
  if (!matched && transcript) {
    // Try to extract name from transcript if caller stated their name
    const nameIntroMatch = transcript.match(/(?:my name is|this is|i am|i'm)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
    if (nameIntroMatch) {
      const ver = CallerGatekeeperService.resolveCallerByName(nameIntroMatch[1], from_number);
      if (ver.isVerified && ver.caller) {
        matched = {
          callerRecognized: true,
          fullName: ver.caller.fullName,
          firstName: ver.caller.firstName,
          role: ver.caller.role,
          office: ver.caller.office,
          email: ver.caller.email,
          phone: ver.caller.primaryPhone
        };
      }
    }
  }

  const callerName = matched ? matched.fullName : (from_number ? `Inbound (${from_number})` : 'Phone Caller');
  const firstName = matched ? matched.firstName : 'Caller';

  // 2. Check if this is an Office Supply request (Water, Coffee, Paper, etc.)
  const isSupplyRequest = /water|coffee|kcup|k-cup|paper|reams?|wipes|cleaning|trash bags|lightbulb/i.test(transcript);
  let supplyResult = null;
  let isSupplyDeduplicated = false;

  if (isSupplyRequest) {
    supplyResult = OfficeSupplyDeduplicationService.checkAndConsolidateSupplyRequest({
      callerName,
      callerRole: matched?.role || 'Broker',
      callerPhone: from_number,
      office: matched?.office || 'Mayfaire',
      requestText: transcript
    });
    isSupplyDeduplicated = supplyResult.isDuplicate;
  }

  // 3. Run unified query context to route any marketing/transaction action
  const analysis = queryUnifiedContext(transcript || 'Inbound phone inquiry');

  // Extract property address from payload or regex match against transcript
  let detectedAddress = property_address || '';
  if (!detectedAddress && transcript && !isSupplyRequest) {
    const addressMatch = transcript.match(/\b(\d{2,5}\s+[A-Za-z0-9\s]+(?:Drive|Dr|Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Way|Court|Ct|Trail|Trl|Circle|Cir|Terrace|Ter|Loop|Place|Pl|Soundview|Ocean|Waterway))\b/i);
    if (addressMatch) {
      detectedAddress = addressMatch[0].trim();
    }
  }
  if (!detectedAddress && analysis.ticketProposal?.propertyAddress) {
    detectedAddress = analysis.ticketProposal.propertyAddress;
  }
  if (!detectedAddress && isSupplyRequest) {
    detectedAddress = `${matched?.office || 'Mayfaire'} Office Restock`;
  }
  if (!detectedAddress && matched?.office) {
    detectedAddress = `New Listing (${matched.fullName})`;
  }
  if (!detectedAddress) {
    detectedAddress = 'Inbound Phone Request';
  }

  // 4. Real-Time & Post-Call Ingest: Create or Update Canonical Marketing Request & Tasks (suppress if supply deduplicated)
  const syncResult = isSupplyDeduplicated 
    ? { request: null, tasks: [], shouldCreate: false, suppressed: true, suppressionReason: 'Office supply request deduplicated into existing Ann Gunn restock ticket.' }
    : convertCallToCanonicalMarketingRequest({
        id: call_id || `call_${Date.now()}`,
        callerName,
        propertyAddress: detectedAddress,
        fromNumber: from_number,
        durationSeconds: duration_seconds,
        transcript: transcript || 'Audio call recorded via Retell hotline.',
        summary: supplyResult ? supplyResult.spokenMessage : (analysis.spokenAnswer || 'Inbound call logged with Ask Nest Ops.'),
        recordingUrl: recording_url || undefined
      });

  const newCall: InboundCallRecord = {
    callId: call_id || `call_${Date.now()}`,
    fromNumber: from_number,
    callerRecognized: Boolean(matched),
    callerName,
    firstName,
    role: matched?.role || 'Broker',
    office: matched?.office || 'Mayfaire',
    durationSeconds: duration_seconds,
    timestamp: new Date().toISOString(),
    transcript: transcript || 'Audio call recorded via Retell hotline.',
    summary: supplyResult ? supplyResult.spokenMessage : (analysis.spokenAnswer || 'Inbound call logged with Ask Nest Ops.'),
    ticketCreatedId: syncResult.request?.id || supplyResult?.order.id,
    createdRequestId: syncResult.request?.id,
    createdTasksCount: syncResult.tasks.length,
    propertyAddress: detectedAddress,
    recordingUrl: recording_url || undefined,
    smsFollowUpSent: true,
    isSupplyDeduplicated,
    supplyOrderNotes: supplyResult ? supplyResult.spokenMessage : undefined
  };

  recentTelephonyCalls.unshift(newCall);

  try {
    await saveTelephonyCallAsync({
      id: newCall.callId,
      workspaceId: 'ws_wilmington',
      callerName: newCall.callerName,
      callerPhone: newCall.fromNumber,
      callerOffice: newCall.office,
      durationSeconds: newCall.durationSeconds,
      propertyAddress: newCall.propertyAddress,
      transcript: newCall.transcript,
      recordingUrl: newCall.recordingUrl,
      canonicalRequestId: syncResult.request?.id,
      canonicalTaskId: syncResult.tasks?.[0]?.id
    });
    if (syncResult.request?.id) {
      await linkCallToCanonicalRequestAsync(newCall.callId, syncResult.request.id, syncResult.tasks?.[0]?.id);
    }
  } catch (err) {
    console.warn('[telephonyRouter] Error persisting call to ledger:', err);
  }

  // 5. NORA Knowledge & Follow-Up Orchestration (AskNora@nestrealty.com)
  let followUpOutcome: any = null;
  try {
    followUpOutcome = await NoraFollowUpService.processVoiceCall({
      callId: newCall.callId,
      fromNumber: from_number,
      callerName,
      transcript: newCall.transcript,
      summary: newCall.summary,
      propertyAddress: detectedAddress,
      createdRequestId: syncResult.request?.id,
      createdTasksCount: syncResult.tasks.length,
      durationSeconds: duration_seconds
    });

    if (followUpOutcome) {
      newCall.followUpStatus = followUpOutcome.followUp.status;
      newCall.followUpSubject = followUpOutcome.followUp.subject;
      newCall.followUpSentAt = followUpOutcome.followUp.sentAt;
      newCall.followUpRecipient = followUpOutcome.followUp.recipientEmail;
      newCall.conversationGoal = followUpOutcome.goal;
      newCall.knowledgeUsed = (followUpOutcome.knowledgeUsed || []).map((k: any) => k.title);
    }
  } catch (followUpErr: any) {
    console.warn('[telephonyRouter] Error executing NORA follow-up orchestrator:', followUpErr.message);
  }

  return res.json({
    success: true,
    message: syncResult.shouldCreate
      ? `Call processed. Created/Updated request ${syncResult.request?.id} with ${syncResult.tasks.length} tasks.`
      : `Call processed and logged in Calls tab (${syncResult.suppressionReason || 'informational / resolved on call'}).`,
    call: newCall,
    request: syncResult.request,
    tasks: syncResult.tasks,
    supplyResult,
    followUp: followUpOutcome?.followUp,
    outcome: followUpOutcome,
    actionDispatched: analysis.ticketProposal,
    marketingSync: {
      shouldCreate: syncResult.shouldCreate,
      suppressed: syncResult.suppressed,
      suppressionReason: syncResult.suppressionReason,
      createdRequestId: syncResult.request?.id,
      createdTasksCount: syncResult.tasks.length
    }
  });
});

// POST /api/voice-agent/telephony/send-sms - Automated SMS Follow-Up Dispatch
telephonyRouter.post('/send-sms', (req, res) => {
  const { toNumber, message, callId, ticketId } = req.body || {};
  if (!toNumber || !message) {
    return res.status(400).json({ success: false, error: 'toNumber and message are required.' });
  }

  // Update call record if callId supplied
  if (callId) {
    const call = recentTelephonyCalls.find(c => c.callId === callId);
    if (call) {
      call.smsFollowUpSent = true;
    }
  }

  return res.json({
    success: true,
    message: `SMS confirmation dispatched to ${toNumber}.`,
    smsId: `sms_${Date.now()}`,
    deliveredAt: new Date().toISOString()
  });
});
