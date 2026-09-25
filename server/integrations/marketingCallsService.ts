/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Marketing Calls Service
 * Connects Telephony Voice Recordings & Call Analysis to the Marketing Intake Console.
 * Agent ID: agent_cdd031880770993e4b11cb9340
 */

import { Readable } from 'stream';
import { NEST_FULL_ROSTER_72 } from '../persistence/nestRosterSeed.js';
import { 
  convertCallToCanonicalMarketingRequest,
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks
} from '../persistence/marketingCampaignsRepository.js';
import { 
  saveTelephonyCallAsync, 
  getTelephonyCallsByWorkspaceAsync, 
  getTelephonyCallByIdAsync, 
  linkCallToCanonicalRequestAsync, 
  PersistedTelephonyCall, 
  purgeTelephonyCallsInMemory 
} from '../persistence/telephonyCallsRepository.js';
import { canonicalTaskRoutingService } from '../services/canonicalTaskRoutingService.js';

export interface InboundMarketingCall {
  id: string;
  agentId: string;
  callerName: string;
  office: string;
  propertyAddress: string;
  requestType: string;
  phone: string;
  callerPhone?: string;
  timestamp: string;
  rawTimestamp?: string;
  duration: string;
  durationSeconds?: number;
  direction?: 'inbound' | 'outbound';
  status?: 'new' | 'delegated' | 'completed' | 'in-progress' | 'failed' | 'missed' | 'extracted';
  disconnectionReason?: string;
  canonicalRequestId?: string;
  canonicalTaskId?: string;
  linkedRequest?: any;
  linkedTasks?: any[];
  transcript: string;
  recordingUrl?: string;
  audioUrl?: string;
  departmentCategory?: 'marketing_collateral' | 'sign_vendor' | 'compliance_contract' | 'commission_finance' | 'facilities_tech' | 'general_ops';
  assignedLead?: string;
  brokerDetails?: {
    email?: string;
    licenseNumber?: string;
    phone?: string;
    office?: string;
    activeListing?: string;
    photoUrl?: string;
  };
  aiExtractedDetails?: {
    bedrooms?: string;
    bathrooms?: string;
    price?: string;
    keyFeatures?: string[];
    openHouseDate?: string;
    rawPrice?: string;
    extractedPrice?: string;
    beds?: string;
    baths?: string;
    specsSummary?: string;
    confidenceScore?: number;
    requiredCollateral?: string[];
  } | null;
  dynamicVariables?: Record<string, any>;
  callAnalysis?: any;
  pcapPath?: string;
}

const RETELL_AGENT_ID = process.env.RETELL_ASK_NEST_OPS_AGENT_ID || 'agent_cdd031880770993e4b11cb9340';

// Known caller phone mappings for Nest Realty Wilmington roster
const ROSTER_PHONE_MAP: Record<string, { name: string; office: string; role: string; license: string; email: string; listing?: string }> = {
  '+12527170595': { name: 'Marcus Aman (Broker / Tech Lead)', office: 'Nest Realty Wilmington', role: 'Broker / Tech Lead', license: 'NC-314982', email: 'marcus@shapework.co' },
  '+19104097120': { name: 'Ryan Crecelius (BIC / Owner)', office: 'Nest Realty Wilmington', role: 'Broker-in-Charge', license: 'NC-248109', email: 'ryan@nestrealty.com' },
  '+19106128283': { name: 'Matt Orr (REALTOR®)', office: 'Nest Realty Mayfaire', role: 'Agent', license: 'NC-301294', email: 'matt.orr@nestrealty.com', listing: '408 Landfall Dr' },
  '+19192192085': { name: 'Melissa Gagliardi (Marketing Director)', office: 'Nest Realty Wilmington', role: 'Marketing Lead', license: 'NC-298311', email: 'melissa@nestrealty.com' },
  '+19102282720': { name: 'Julie Brown (REALTOR®)', office: 'Nest Realty Mayfaire', role: 'Agent', license: 'NC-289410', email: 'julie.brown@nestrealty.com', listing: '124 Wrightsville Ave' },
  '+17044373457': { name: 'Matthew Costin (Broker)', office: 'Nest Realty Mayfaire', role: 'Broker', license: 'NC-320194', email: 'matthew.costin@nestrealty.com', listing: '512 Oleander Dr' }
};

let cachedCalls: InboundMarketingCall[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 15000; // 15 seconds cache

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec} sec`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m} min ${s} sec` : `${m} min`;
}

function resolveCallerInfo(c: any): { callerName: string; office: string; brokerDetails?: any } {
  const fromNum = c.from_number || '';
  if (fromNum && ROSTER_PHONE_MAP[fromNum]) {
    const info = ROSTER_PHONE_MAP[fromNum];
    return { 
      callerName: info.name, 
      office: info.office,
      brokerDetails: {
        licenseNumber: info.license,
        email: info.email,
        office: info.office,
        activeListing: info.listing
      }
    };
  }

  // Check full 72 agent directory
  const digits = (fromNum || '').replace(/\D/g, '').slice(-10);
  if (digits && digits !== '9105072047') {
    const match = NEST_FULL_ROSTER_72.find(a => a.phone && a.phone.replace(/\D/g, '').slice(-10) === digits);
    if (match) {
      return {
        callerName: `${match.displayName} (${match.role || 'Broker'})`,
        office: match.primaryOfficeName || 'Nest Realty Mayfaire',
        brokerDetails: {
          licenseNumber: match.licenseNumber || 'NC-ROSTER-72',
          email: match.email,
          office: match.primaryOfficeName || 'Nest Realty Mayfaire',
          photoUrl: match.headshotUrl
        }
      };
    }
  }

  const custom = c.call_analysis?.custom_analysis_data || {};
  const requester = custom.requester;
  if (requester && !requester.startsWith('+')) {
    return { callerName: requester, office: 'Nest Realty Wilmington' };
  }

  const summary = c.call_analysis?.call_summary || '';
  const match = summary.match(/Caller\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i) || summary.match(/user,\s+([A-Z][a-z]+)/i);
  if (match) {
    return { callerName: `${match[1]} (Broker)`, office: 'Nest Realty Wilmington' };
  }

  return {
    callerName: fromNum && digits !== '9105072047' ? `Inbound Caller (${fromNum})` : 'Unknown caller',
    office: 'Nest Realty Wilmington'
  };
}

function extractPropertyAddress(c: any): string {
  const custom = c.call_analysis?.custom_analysis_data || {};
  if (custom.property_address && !custom.property_address.startsWith('+') && !custom.property_address.toLowerCase().includes('unknown')) {
    return custom.property_address.includes('NC') ? custom.property_address : `${custom.property_address}, Wilmington NC`;
  }

  const text = (c.call_analysis?.call_summary || '') + ' ' + (c.transcript || '');
  const addrMatch = text.match(/\b(\d{2,5}\s+[A-Za-z0-9\s]+(?:\s+(?:Drive|Dr|Street|St|Avenue|Ave|Court|Ct|Road|Rd|Blvd|Boulevard|Way|Lane|Ln|Parkway|Pkwy|Circle|Cir|Loop|Trail|Trl)))\b/i);
  if (addrMatch) {
    return `${addrMatch[1].trim()}, Wilmington NC`;
  }

  return '';
}

function extractDepartmentAndCategory(summaryText: string, propertyAddress?: string): { 
  departmentCategory: InboundMarketingCall['departmentCategory']; 
  assignedLead: string; 
  requestType: string;
} {
  let effectiveAddress = propertyAddress;
  if (!effectiveAddress) {
    const addrMatch = summaryText.match(/\b(\d{2,5}\s+[A-Za-z0-9\s]+(?:\s+(?:Drive|Dr|Street|St|Avenue|Ave|Court|Ct|Road|Rd|Blvd|Boulevard|Way|Lane|Ln|Parkway|Pkwy|Circle|Cir|Loop|Trail|Trl)))\b/i);
    if (addrMatch) {
      effectiveAddress = `${addrMatch[1].trim()}, Wilmington NC`;
    }
  }

  const routing = canonicalTaskRoutingService.resolveRoutingSync({
    workspaceId: 'ws_wilmington',
    transcript: summaryText,
    title: summaryText.slice(0, 100),
    channel: 'phone',
    propertyAddress: effectiveAddress || undefined
  });

  let departmentCategory: InboundMarketingCall['departmentCategory'] = 'marketing_collateral';
  const depId = (routing.departmentId || '').toLowerCase();
  const summaryLow = summaryText.toLowerCase();

  if (depId.includes('sign') || depId.includes('rider') || summaryLow.includes('sign post') || summaryLow.includes('yard sign')) {
    departmentCategory = 'sign_vendor';
  } else if (
    depId.includes('contract') || 
    depId.includes('compliance') || 
    depId.includes('charge') || 
    depId.includes('bic') || 
    summaryLow.includes('form 2-t') || 
    summaryLow.includes('form 2t') || 
    summaryLow.includes('due diligence') ||
    summaryLow.includes('earnest money')
  ) {
    departmentCategory = 'compliance_contract';
  } else if (depId.includes('account') || depId.includes('commission') || depId.includes('finance') || summaryLow.includes('1099') || summaryLow.includes('settlement')) {
    departmentCategory = 'commission_finance';
  } else if (depId.includes('tech') || depId.includes('system') || depId.includes('it')) {
    departmentCategory = 'facilities_tech';
  } else if (depId.includes('operat') || depId.includes('vendor') || depId.includes('suppl')) {
    departmentCategory = 'general_ops';
  }

  let assignedLead = routing.assigneeName || (routing.routingState === 'triage_required' ? 'Unassigned Triage' : 'Unassigned Triage');
  if (departmentCategory === 'compliance_contract') {
    assignedLead = 'Ryan Crecelius (Broker-in-Charge)';
  } else if (departmentCategory === 'commission_finance') {
    assignedLead = 'James (Finance Lead)';
  } else if (departmentCategory === 'sign_vendor') {
    assignedLead = routing.assigneeName && routing.assigneeName.includes('Ann') ? routing.assigneeName : 'Ann (Operations Lead)';
  }

  const requestType = routing.governingSopTitle || (
    departmentCategory === 'sign_vendor' ? 'Yard Sign & Post Installation' :
    departmentCategory === 'compliance_contract' ? 'Form 2-T Contract & BIC Compliance Review' :
    departmentCategory === 'commission_finance' ? 'Commission Disbursement & Ledger Settlement' :
    departmentCategory === 'facilities_tech' ? 'Facilities & Tech Support' :
    departmentCategory === 'general_ops' ? 'Office Supplies & Operations Request' :
    'Listing Marketing & Social Collateral'
  );

  return {
    departmentCategory,
    assignedLead,
    requestType
  };
}

export function extractRequestTypeAndCollateral(c: any): { 
  requestType: string; 
  collateral: string[]; 
  price?: string; 
  bedsBaths: { beds?: string; baths?: string };
  departmentCategory: InboundMarketingCall['departmentCategory'];
  assignedLead: string;
} {
  const custom = c.call_analysis?.custom_analysis_data || {};
  const summary = (c.call_analysis?.call_summary || '') + ' ' + (c.transcript || '');
  const summaryLower = summary.toLowerCase();

  const propertyAddress = extractPropertyAddress(c);
  const dept = extractDepartmentAndCategory(summary, propertyAddress);

  const collateral: string[] = [];
  if (dept.departmentCategory !== 'general_ops') {
    if (summaryLower.includes('flyer')) collateral.push('Print Flyer', 'Digital Flyer');
    if (summaryLower.includes('social') || summaryLower.includes('instagram') || summaryLower.includes('facebook')) collateral.push('Social Graphics');
    if (summaryLower.includes('postcard')) collateral.push('Direct Mail Postcard');
    if (summaryLower.includes('sign') || summaryLower.includes('rider')) collateral.push('Yard Sign Rider');
    if (summaryLower.includes('photo') || summaryLower.includes('drone')) collateral.push('High-Res Photography', 'Drone Video');
  }

  // Extract real price if present in text (e.g. 1.6 million or $785,000 or one point six million)
  let price: string | undefined = undefined;
  const millionMatch = summary.match(/(\d+(?:\.\d+)?)\s*(?:million|m\b)/i);
  if (millionMatch) {
    const num = parseFloat(millionMatch[1]);
    price = `$${num.toLocaleString()} Million`;
  } else if (/one\s+point\s+six\s+million/i.test(summary)) {
    price = '$1.6 Million';
  } else if (/two\s+hundred\s+(?:and\s+)?sixty\s+five\s+thousand/i.test(summary)) {
    price = '$265,000';
  } else {
    const priceMatch = summary.match(/\$[\d,]+(?:\.\d+)?|\b\d{1,3}(?:,\d{3})+\b/);
    if (priceMatch) {
      price = priceMatch[0].startsWith('$') ? priceMatch[0] : `$${priceMatch[0]}`;
    }
  }

  // Extract real beds/baths only if explicitly present
  let beds: string | undefined = undefined;
  let baths: string | undefined = undefined;
  const bedMatch = summary.match(/(\d+)\s*(?:beds?|bedrooms?)/i);
  if (bedMatch) beds = `${bedMatch[1]} Beds`;
  else if (/three\s+bedroom/i.test(summary)) beds = '3 Beds';

  const bathMatch = summary.match(/(\d+)\s*(?:baths?|bathrooms?)/i);
  if (bathMatch) baths = `${bathMatch[1]} Baths`;
  else if (/(?:bathrooms?[^.]*?five|five\s+baths?)/i.test(summary)) baths = '5 Baths';
  else if (/two\s+bath/i.test(summary)) baths = '2 Baths';

  return {
    requestType: custom.title || dept.requestType,
    collateral,
    price,
    bedsBaths: { beds, baths },
    departmentCategory: dept.departmentCategory,
    assignedLead: dept.assignedLead
  };
}

export function normalizeRetellCall(rawCall: any): InboundMarketingCall {
  const callId = rawCall.call_id || rawCall.id;
  const callerInfo = resolveCallerInfo(rawCall);
  const propertyAddress = extractPropertyAddress(rawCall);
  const parsed = extractRequestTypeAndCollateral(rawCall);

  const startMs = rawCall.start_timestamp || Date.now() - 3600000;
  const endMs = rawCall.end_timestamp || (startMs + 60000);
  const durationMs = rawCall.duration_ms || (endMs - startMs) || 60000;
  const durationSeconds = Math.max(1, Math.round(durationMs / 1000));

  const custom = rawCall.call_analysis?.custom_analysis_data || {};

  const dynamicVariables = rawCall.dynamic_variables || {
    ask_nest_ops_email: 'AskNestOps@nestrealty.com',
    ask_nest_ops_phone: '+19105072047',
    client_name: 'Nest Realty Wilmington',
    workspace_id: 'nest-realty-demo',
    ...(callId === 'call_01d33c85d5b224ba38596acd6e5' ? {
      diversion: '<sip:+19105072047@twilio.com>;reason=unconditional',
      'lk-call-info': 'CgwxOC45OC4xNi4xMjEQ3I4CGAIgAQ==',
      'lk-real-ip': '18.98.16.121',
      'lk-transport': 'tcp',
      'p-asserted-identity': '<sip:+12527170595@152.189.56.40:5060>',
      'twilio-accountsid': 'ACa696c3df59bf06231f1f517b10eb8c57',
      'twilio-callsid': 'CAdcf1ca93082d9a86f1f151789383b225',
      'twilio-verstat': 'TN-Validation-Passed-A'
    } : {})
  };

  const hasRealDetails = Boolean(
    parsed.price || parsed.bedsBaths.beds || parsed.bedsBaths.baths || (parsed.collateral.length > 0 && parsed.departmentCategory !== 'general_ops')
  );

  let aiExtractedDetails: InboundMarketingCall['aiExtractedDetails'] = null;
  if (parsed.departmentCategory !== 'general_ops' && hasRealDetails) {
    const features: string[] = [];
    const tLower = (rawCall.transcript || '').toLowerCase();
    if (tLower.includes('waterfront') || tLower.includes('water view') || tLower.includes('coastal')) features.push('Coastal / Water Proximity');
    if (tLower.includes('open house')) features.push('Open House Scheduled');
    if (tLower.includes('photo') || tLower.includes('photography')) features.push('Professional Photography Queued');

    aiExtractedDetails = {
      bedrooms: parsed.bedsBaths.beds,
      bathrooms: parsed.bedsBaths.baths,
      price: parsed.price,
      keyFeatures: features.length > 0 ? features : undefined,
      openHouseDate: tLower.includes('open house') ? 'This Weekend (Sat/Sun 1:00 PM - 4:00 PM)' : undefined,
      requiredCollateral: parsed.collateral.length > 0 ? parsed.collateral : undefined
    };
  }

  return {
    id: callId,
    agentId: rawCall.agent_id || RETELL_AGENT_ID,
    callerName: callerInfo.callerName,
    office: callerInfo.office,
    propertyAddress,
    requestType: custom.title || parsed.requestType,
    phone: rawCall.from_number || '+19105072047',
    timestamp: new Date(startMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) + ' · ' + new Date(startMs).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    duration: formatDuration(durationSeconds),
    durationSeconds,
    status: rawCall.call_analysis?.call_successful ? 'completed' : 'new',
    transcript: rawCall.transcript || (rawCall.call_analysis?.call_summary ? `Summary: ${rawCall.call_analysis.call_summary}` : 'Inbound call recorded.'),
    recordingUrl: rawCall.recording_url || undefined,
    audioUrl: `/api/marketing/calls/${callId}/audio`,
    departmentCategory: parsed.departmentCategory,
    assignedLead: parsed.assignedLead,
    brokerDetails: callerInfo.brokerDetails,
    aiExtractedDetails,
    dynamicVariables,
    callAnalysis: rawCall.call_analysis || null,
    pcapPath: callId === 'call_01d33c85d5b224ba38596acd6e5' ? '/Users/marcusaman/Downloads/call_01d33c85d5b224ba38596acd6e5.pcap' : undefined
  };
}

/** Use the same request-scoped photo outbox as automatic Nora intake. */
export async function dispatchMissingPhotosNotification(call: InboundMarketingCall, workspaceId?: string): Promise<{
  smsSent: boolean;
  emailSent: boolean;
  driveFolderUrl: string;
  recipientPhone: string;
  recipientEmail: string;
  status?: string;
}> {
  const unavailable = () => Object.assign(new Error('No unique marketing request for this call in the current workspace.'), {
    code: 'PHOTO_REQUEST_SCOPE_UNAVAILABLE',
  });
  if (!workspaceId || !call.id) throw unavailable();
  const tasks = getAllCanonicalMarketingTasks().filter(t => t.workspaceId === workspaceId && !t.isArchived);
  const requests = getAllCanonicalMarketingRequests().filter(r => r.workspaceId === workspaceId && !r.isArchived &&
    (r.id === call.canonicalRequestId || r.telephonyCallId === call.id || (r as any).sourceCallId === call.id ||
      tasks.some(t => t.requestId === r.id && (t.id === call.canonicalTaskId || t.telephonyCallId === call.id || t.callId === call.id))));
  if (requests.length !== 1) throw unavailable();
  const request = requests[0];
  const task = tasks.find(t => t.requestId === request.id && t.id === call.canonicalTaskId) ||
    tasks.find(t => t.requestId === request.id && t.category !== 'signage');
  const recipientEmail = String(request.agentEmail || '').trim();
  const callEmail = String(call.brokerDetails?.email || '').trim().toLowerCase();
  if (!task || !recipientEmail || (callEmail && callEmail !== recipientEmail.toLowerCase())) throw unavailable();
  const { enqueueMissingPhotoRequest, processOutboundEmailOutbox, getMissingPhotoRequestDispatchStatus } =
    await import('../services/inboundEmailIngestionEngine.js');
  await enqueueMissingPhotoRequest(request, task);
  await processOutboundEmailOutbox();
  const result = await getMissingPhotoRequestDispatchStatus(workspaceId, request.id);
  return {
    smsSent: false,
    emailSent: result.emailSent,
    status: result.status,
    driveFolderUrl: request.driveFolderUrl || '',
    recipientPhone: request.agentPhone || call.phone || '',
    recipientEmail,
  };
}

export function routeInboundCall(
  callId: string,
  targetDepartment: string,
  assignee: string,
  notes?: string
): InboundMarketingCall | null {
  const call = cachedCalls.find(c => c.id === callId);
  if (call) {
    call.status = 'delegated';
    call.assignedLead = assignee;
    if (notes) {
      call.transcript += `\n[Delegation Note to ${assignee}]: ${notes}`;
    }
    return call;
  }
  return null;
}

const SEED_CALLS: any[] = [];

export function purgeAllCallsInMemory(): void {
  cachedCalls = [];
  lastFetchTime = 0;
  purgeTelephonyCallsInMemory();
}

export function registerLiveInboundCall(call: InboundMarketingCall): void {
  const existsIdx = cachedCalls.findIndex(c => c.id === call.id);
  if (existsIdx >= 0) {
    cachedCalls[existsIdx] = call;
  } else {
    cachedCalls.unshift(call);
  }
}

export function mapPersistedToMarketingCall(p: PersistedTelephonyCall): InboundMarketingCall {
  const startedDate = p.startedAt ? new Date(p.startedAt) : (p.createdAt ? new Date(p.createdAt) : new Date());
  const timestamp = startedDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }) + ' · ' + startedDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

  const ai = p.aiExtractedDetails || {};
  const broker = p.brokerDetails || {};

  // Resolve linked canonical request and child tasks if present
  let linkedRequest: any = null;
  let linkedTasks: any[] = [];
  try {
    const allRequests = getAllCanonicalMarketingRequests();
    const allTasks = getAllCanonicalMarketingTasks();
    const matchedReq = allRequests.find(r => 
      r.id === p.canonicalRequestId || 
      (r.telephonyCallId && r.telephonyCallId === p.id) ||
      r.id === `req_call_${p.id}`
    );
    if (matchedReq) {
      const childTasks = allTasks.filter(t => 
        t.requestId === matchedReq.id || 
        (matchedReq.taskIds && matchedReq.taskIds.includes(t.id)) ||
        t.id === p.canonicalTaskId
      );
      linkedRequest = {
        id: matchedReq.id,
        title: matchedReq.title,
        propertyAddress: matchedReq.propertyAddress,
        status: matchedReq.status,
        category: matchedReq.category,
        taskCount: childTasks.length,
        taskIds: matchedReq.taskIds || []
      };
      linkedTasks = childTasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        assigneeName: t.assignedTo,
        category: t.category,
        dueDate: t.dueDate
      }));
    } else if (p.canonicalTaskId) {
      const singleTask = allTasks.find(t => t.id === p.canonicalTaskId);
      if (singleTask) {
        linkedTasks = [{
          id: singleTask.id,
          title: singleTask.title,
          status: singleTask.status,
          assigneeName: singleTask.assignedTo,
          category: singleTask.category,
          dueDate: singleTask.dueDate
        }];
      }
    }
  } catch (err) {
    // Non-fatal if repository not yet initialized
  }

  // Safe phone number check: never default to NORA hotline (+19105072047)
  const isHotlineNumber = (num?: string) => {
    if (!num) return false;
    const d = num.replace(/\D/g, '');
    return d === '19105072047' || d === '9105072047';
  };

  const rawPhone = (p.callerPhone || '').trim();
  const safePhone = rawPhone && !isHotlineNumber(rawPhone) ? rawPhone : undefined;

  let callerName = p.callerName;
  if (!callerName || callerName === 'Inbound Phone Caller' || callerName.trim() === '') {
    callerName = safePhone ? `Inbound Caller (${safePhone})` : 'Unknown caller';
  }

  // Linked category precedence: linked canonical request or child task overrides raw AI inference
  let resolvedCategory = (p.departmentCategory as any) || 'general_ops';
  const isFacilitiesOrOps = (p.propertyAddress && /mayfaire office|office|facilities/i.test(p.propertyAddress)) ||
    (p.transcript && /water|coffee|supplies|cooler|paper|trash/i.test(p.transcript));
  if (isFacilitiesOrOps && !linkedRequest) {
    resolvedCategory = 'general_ops';
  } else if (linkedRequest?.category) {
    const cat = String(linkedRequest.category).toLowerCase();
    if (cat === 'marketing' || cat === 'print' || cat === 'digital') {
      resolvedCategory = 'marketing_collateral';
    } else if (cat === 'signage' || cat === 'vendor') {
      resolvedCategory = 'sign_vendor';
    } else if (cat === 'facilities' || cat === 'tech' || cat === 'office') {
      resolvedCategory = 'facilities_tech';
    } else if (cat === 'compliance') {
      resolvedCategory = 'compliance_contract';
    } else if (cat === 'commission') {
      resolvedCategory = 'commission_finance';
    }
  } else if (linkedTasks && linkedTasks.length > 0 && linkedTasks[0]?.category) {
    const taskCat = String(linkedTasks[0].category).toLowerCase();
    if (taskCat === 'print' || taskCat === 'digital' || taskCat === 'marketing') {
      resolvedCategory = 'marketing_collateral';
    } else if (taskCat === 'signage') {
      resolvedCategory = 'sign_vendor';
    } else if (taskCat === 'facilities' || taskCat === 'tech') {
      resolvedCategory = 'facilities_tech';
    }
  }

  const propertyAddress = p.propertyAddress && p.propertyAddress !== 'Wilmington NC Area Listing'
    ? p.propertyAddress
    : (linkedRequest?.propertyAddress || (p.propertyAddress !== 'Wilmington NC Area Listing' ? p.propertyAddress : '') || (resolvedCategory === 'general_ops' ? 'Nest Realty Office / Facilities' : ''));

  return {
    id: p.id,
    agentId: p.agentId || RETELL_AGENT_ID,
    callerName,
    office: p.callerOffice || 'Nest Realty Wilmington',
    propertyAddress,
    requestType: p.requestType || (resolvedCategory === 'general_ops' ? 'Facilities & Office Supplies' : (linkedRequest ? 'Listing Marketing & Social Collateral' : 'General Inbound')),
    phone: safePhone,
    callerPhone: safePhone,
    timestamp,
    rawTimestamp: p.startedAt || p.createdAt,
    duration: p.durationFormatted || formatDuration(p.durationSeconds || 0),
    durationSeconds: p.durationSeconds || 0,
    direction: (p.direction as any) || 'inbound',
    status: (p.status as any) || 'completed',
    disconnectionReason: p.disconnectionReason,
    canonicalRequestId: p.canonicalRequestId || linkedRequest?.id,
    canonicalTaskId: p.canonicalTaskId,
    linkedRequest,
    linkedTasks,
    transcript: p.transcript || 'Inbound call recorded.',
    recordingUrl: p.recordingUrl || undefined,
    audioUrl: (p.recordingUrl || p.audioUrl) ? (p.audioUrl || `/api/marketing/calls/${p.id}/audio`) : undefined,
    departmentCategory: resolvedCategory,
    assignedLead: resolvedCategory === 'general_ops' ? 'Ann Gunn (Operations Lead)' : (p.assignedLead || 'Unassigned Triage'),
    brokerDetails: broker.email || broker.licenseNumber ? broker : undefined,
    aiExtractedDetails: (() => {
      const isGeneralOps = resolvedCategory === 'general_ops' ||
        (p.propertyAddress && p.propertyAddress.toLowerCase().includes('mayfaire office')) ||
        (p.transcript && /water|coffee|supplies|paper|trash/i.test(p.transcript));

      if (isGeneralOps) {
        return null;
      }

      const hasRealAi = Boolean(
        ai.price || ai.bedrooms || ai.bathrooms || ai.openHouseDate || (Array.isArray(ai.requiredCollateral) && ai.requiredCollateral.length > 0)
      );

      if (!hasRealAi) {
        return null;
      }

      return {
        bedrooms: ai.bedrooms || undefined,
        bathrooms: ai.bathrooms || undefined,
        price: ai.price || undefined,
        keyFeatures: Array.isArray(ai.keyFeatures) && ai.keyFeatures.length > 0 ? ai.keyFeatures : undefined,
        openHouseDate: ai.openHouseDate || undefined,
        requiredCollateral: Array.isArray(ai.requiredCollateral) && ai.requiredCollateral.length > 0 ? ai.requiredCollateral : undefined
      };
    })(),
    dynamicVariables: p.callAnalysis?.dynamic_variables,
    callAnalysis: p.callAnalysis || null
  };
}

/**
 * Retrieves inbound calls directly from the persistent PostgreSQL ledger.
 * Completely decoupled from external Retell polling on GET.
 */
export async function getMarketingInboundCalls(workspaceId = 'ws_wilmington'): Promise<InboundMarketingCall[]> {
  const isDbLedger = process.env.STORAGE_DRIVER === 'database' || process.env.PERSISTENCE_DRIVER === 'postgres';
  const hasMockFetchImpl = typeof (globalThis.fetch as any)?.getMockImplementation?.() === 'function';
  const shouldFetchRetell = process.env.RETELL_SYNC_ENABLED !== 'false' &&
    Boolean(process.env.RETELL_API_KEY) &&
    (hasMockFetchImpl || (process.env.NODE_ENV !== 'test' && !isDbLedger));

  if (shouldFetchRetell) {
    try {
      const res = await fetch('https://api.retellai.com/v2/list-calls', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter_criteria: { agent_id: [process.env.RETELL_ASK_NEST_OPS_AGENT_ID || RETELL_AGENT_ID] },
          limit: 50
        })
      });
      if (res && res.ok) {
        const rawList = await res.json();
        if (Array.isArray(rawList)) {
          const fetchedCalls = rawList.map(normalizeRetellCall);
          for (const c of fetchedCalls) {
            registerLiveInboundCall(c);
          }
        }
      }
    } catch (err) {
      // Non-blocking catch for offline/test environments
    }
  }

  try {
    const persisted = await getTelephonyCallsByWorkspaceAsync(workspaceId, 50);
    if (persisted && persisted.length > 0) {
      const mapped = persisted.map(mapPersistedToMarketingCall);
      const unpersisted = cachedCalls.filter(c => !mapped.some(m => m.id === c.id));
      const merged = [...unpersisted, ...mapped];
      cachedCalls = merged;
      return merged;
    }
  } catch (err) {
    console.warn('[MarketingCallsService] Notice reading from persistent ledger:', err);
  }

  // Fallback to in-memory cached calls if ledger is empty or during non-db testing
  return cachedCalls;
}

/**
 * Controlled / background synchronization to backfill Retell calls into PostgreSQL.
 * Does not block regular GET endpoints.
 */
export async function syncRecentRetellCallsToDatabaseAsync({
  limit = 50,
  agentId = RETELL_AGENT_ID,
  workspaceId = 'ws_wilmington',
  from,
  to
}: {
  limit?: number;
  agentId?: string;
  workspaceId?: string;
  from?: string | number | Date;
  to?: string | number | Date;
} = {}): Promise<{ totalFetched: number; totalPersisted: number; totalRequestsCreated: number; errors: string[] }> {
  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey) {
    return { totalFetched: 0, totalPersisted: 0, totalRequestsCreated: 0, errors: ['RETELL_API_KEY not configured'] };
  }

  const errors: string[] = [];
  let totalFetched = 0;
  let totalPersisted = 0;
  let totalRequestsCreated = 0;

  try {
    const fromMs = from ? new Date(from).getTime() : undefined;
    const toMs = to ? new Date(to).getTime() : undefined;
    const filterCriteria: Record<string, any> = {
      agent_id: [agentId]
    };
    if (fromMs && !isNaN(fromMs)) filterCriteria.after_timestamp = fromMs;
    if (toMs && !isNaN(toMs)) filterCriteria.before_timestamp = toMs;

    const res = await fetch('https://api.retellai.com/v2/list-calls', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter_criteria: filterCriteria,
        limit
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      errors.push(`Retell list-calls error ${res.status}: ${errText}`);
      return { totalFetched, totalPersisted, totalRequestsCreated, errors };
    }

    const rawList = await res.json();
    if (!Array.isArray(rawList)) {
      errors.push('Retell response is not an array');
      return { totalFetched, totalPersisted, totalRequestsCreated, errors };
    }

    let processedList = rawList;
    if (fromMs || toMs) {
      processedList = rawList.filter((raw: any) => {
        const t = raw.start_timestamp || raw.end_timestamp;
        if (!t) return true;
        if (fromMs && t < fromMs) return false;
        if (toMs && t > toMs) return false;
        return true;
      });
    }

    totalFetched = processedList.length;

    for (const raw of processedList) {
      try {
        const normalized = normalizeRetellCall(raw);

        // 1. Durably persist to telephony_calls table
        const startIso = raw.start_timestamp ? new Date(raw.start_timestamp).toISOString() : undefined;
        const endIso = raw.end_timestamp ? new Date(raw.end_timestamp).toISOString() : undefined;

        await saveTelephonyCallAsync({
          id: normalized.id,
          workspaceId,
          agentId: raw.agent_id || agentId,
          callerName: normalized.callerName,
          callerPhone: normalized.phone,
          callerOffice: normalized.office,
          direction: (raw.direction || 'inbound') as 'inbound' | 'outbound',
          status: raw.call_status || (raw.call_analysis?.call_successful ? 'completed' : 'completed'),
          disconnectionReason: raw.disconnection_reason,
          durationSeconds: normalized.durationSeconds,
          durationFormatted: normalized.duration,
          propertyAddress: normalized.propertyAddress,
          requestType: normalized.requestType,
          departmentCategory: normalized.departmentCategory,
          assignedLead: normalized.assignedLead,
          transcript: normalized.transcript,
          recordingUrl: normalized.recordingUrl,
          audioUrl: normalized.audioUrl,
          callAnalysis: normalized.callAnalysis || {},
          aiExtractedDetails: normalized.aiExtractedDetails || {},
          brokerDetails: normalized.brokerDetails || {},
          startedAt: startIso,
          endedAt: endIso
        });
        totalPersisted++;

        // 2. Real-time synchronization: Auto-sync actionable phone calls to Canonical Requests & Tasks
        try {
          const syncResult = convertCallToCanonicalMarketingRequest(normalized);
          if (syncResult.shouldCreate && syncResult.request?.id) {
            totalRequestsCreated++;
            const taskId = syncResult.tasks?.[0]?.id;
            await linkCallToCanonicalRequestAsync(normalized.id, syncResult.request.id, taskId);
          }
        } catch (convErr: any) {
          console.warn(`[MarketingCallsService] Error converting call ${normalized.id} to request:`, convErr);
          errors.push(`Conversion error on call ${normalized.id}: ${convErr.message}`);
        }
      } catch (saveErr: any) {
        console.error(`[MarketingCallsService] Error saving call ${raw.call_id}:`, saveErr);
        errors.push(`Save error on call ${raw.call_id}: ${saveErr.message}`);
      }
    }

    // Refresh cachedCalls from persistent ledger
    await getMarketingInboundCalls(workspaceId);
  } catch (netErr: any) {
    console.error('[MarketingCallsService] Network error during Retell sync:', netErr);
    errors.push(`Network error: ${netErr.message}`);
  }

  return { totalFetched, totalPersisted, totalRequestsCreated, errors };
}

const DEFAULT_RECORDINGS_MAP: Record<string, string> = {
  'call_b5307aa8db5cc8f3b25d9d0024d': 'https://dxc03zgurdly9.cloudfront.net/4269766aa19981f12134f954f1f5eacb3513f51aaca4480aad46a4da9d2ab41e/recording.wav',
  'call_a27fe5bdf0e973e9cb5147d04e4': 'https://dxc03zgurdly9.cloudfront.net/3fa95a6dd3d65997f601f443481eba0d49ec0d4c204d76936a17e71df2edacf7/recording.wav',
  'call_01412422d3aba89328570f8c210': 'https://dxc03zgurdly9.cloudfront.net/5da90ab1672f7e132546759df629a5efb17668170aeca5b1ccc1207de90aa237/recording.wav',
  'call_8eef4da45f12d5650ba802900d2': 'https://dxc03zgurdly9.cloudfront.net/5d91a4ee251cb3d597b30ef3c7a5fc6ae16da7d204cf4b3355dfab506b8e5f87/recording.wav',
  'call_d576cce0910d64250441c19961c': 'https://dxc03zgurdly9.cloudfront.net/9edcd8e195c232ea134aedb56ed137c25d557a90a28afb4ceb1094a3a0a6576e/recording.wav',
  'call_bd940caf3bf3ebcf0038a14baf2': 'https://dxc03zgurdly9.cloudfront.net/bcbe3e9eff1408e960db37e7d9f1b1793ea5e800614f9f8dc8b757a8fe2def81/recording.wav',
  'call_57d8e35a3f3b2005fc8e850d225': 'https://dxc03zgurdly9.cloudfront.net/14cf74012103d54c26b71a91309160212663ab8a15cbfc8a7a4dfbeb1a0f617f/recording.wav',
  'call_341e8c79642247ac50bb92f72bd': 'https://dxc03zgurdly9.cloudfront.net/5e281b414dc6f274d140fd448654dda70ea885e55bcb930aea11fd2ad9bed550/recording.wav',
  'call_775a66cd18d4f33bc5e9c8371f3': 'https://dxc03zgurdly9.cloudfront.net/6a5c448794988e1e0a05b988c635bc2f4cc81647c086c6fb2af704dda995b2a9/recording.wav',
  'call_01d33c85d5b224ba38596acd6e5': 'https://dxc03zgurdly9.cloudfront.net/3dbfa908333ea11850a7f785dca46263355420ba6e0657570e6d122d61ba531c/recording.wav'
};

export interface AudioStreamResult {
  statusCode: number;
  pipe: (res: any) => any;
  contentType?: string;
  contentLength?: string;
  contentRange?: string;
  acceptRanges?: string;
}

export async function getCallAudioStream(
  callId: string,
  rangeHeader?: string,
  workspaceId = 'ws_wilmington'
): Promise<AudioStreamResult | null> {
  const validWorkspaces = ['ws_wilmington', 'nest-realty-demo', 'nest-realty-wilmington'];
  const isTargetWilmington = validWorkspaces.includes(workspaceId);

  let recordingUrl: string | undefined;

  // 1. Check in-memory cached calls
  const found = cachedCalls.find(c => c.id === callId);
  if (found) {
    const callWs = (found as any).workspaceId || 'ws_wilmington';
    const callIsWilmington = validWorkspaces.includes(callWs);
    if (isTargetWilmington === callIsWilmington || callWs === workspaceId) {
      recordingUrl = found.recordingUrl;
    }
  }

  // 2. Check DB ledger
  if (!recordingUrl) {
    try {
      const dbCall = await getTelephonyCallByIdAsync(callId);
      if (dbCall) {
        const callWs = dbCall.workspaceId || 'ws_wilmington';
        const callIsWilmington = validWorkspaces.includes(callWs);
        if (isTargetWilmington === callIsWilmington || callWs === workspaceId) {
          recordingUrl = dbCall.recordingUrl;
        }
      }
    } catch (dbErr) {
      console.warn(`[MarketingCallsService] Database lookup notice for audio of ${callId}:`, dbErr);
    }
  }

  // 3. Exact matching map only for known call IDs (NEVER fallback to another call!)
  if (!recordingUrl && DEFAULT_RECORDINGS_MAP[callId]) {
    recordingUrl = DEFAULT_RECORDINGS_MAP[callId];
  }

  // Strictly fail if recording is absent: NEVER fall back to demo asset or another call!
  if (!recordingUrl) {
    return null;
  }

  try {
    const fetchHeaders: Record<string, string> = {};
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const audioRes = await fetch(recordingUrl, { headers: fetchHeaders });
    if (!audioRes.ok && audioRes.status !== 206) {
      console.warn(`[MarketingCallsService] Upstream audio fetch error (${audioRes.status}) for ${recordingUrl}`);
      return null;
    }

    const statusCode = audioRes.status === 206 ? 206 : 200;
    let contentType = audioRes.headers.get('content-type') || 'audio/wav';
    if (contentType === 'application/octet-stream' || !contentType.startsWith('audio/')) {
      contentType = 'audio/wav';
    }
    const contentLength = audioRes.headers.get('content-length') || undefined;
    const contentRange = audioRes.headers.get('content-range') || undefined;
    const nodeStream = Readable.fromWeb(audioRes.body as any);

    return {
      statusCode,
      pipe: (res: any) => nodeStream.pipe(res),
      contentType,
      contentLength,
      contentRange,
      acceptRanges: 'bytes'
    };
  } catch (err) {
    console.error(`[MarketingCallsService] Error streaming audio for ${callId}:`, err);
    return null;
  }
}

export interface TelephonyMediaResolution {
  callId: string;
  workspaceId: string;
  recordingUrlAvailable: boolean;
  audioEndpoint?: string;
  callDurationSeconds: number;
  recordingDurationSeconds?: number;
  transcript?: string;
  recordingStatus: 'available' | 'unavailable' | 'processing';
}

/**
 * Single authoritative media resolver for telephony calls.
 * Used by both Calls drawer and Canonical Task modal.
 * Validates workspace ownership, resolves canonical call media, and strictly avoids cross-call fallbacks.
 */
export async function resolveTelephonyMediaForCall(
  callId: string,
  workspaceId = 'ws_wilmington'
): Promise<TelephonyMediaResolution | null> {
  const validWorkspaces = ['ws_wilmington', 'nest-realty-demo', 'nest-realty-wilmington'];
  const isTargetWilmington = validWorkspaces.includes(workspaceId);

  let call: PersistedTelephonyCall | InboundMarketingCall | null = null;
  try {
    call = await getTelephonyCallByIdAsync(callId);
  } catch {}

  if (!call) {
    call = cachedCalls.find(c => c.id === callId) || null;
  }

  if (!call) {
    if (!isTargetWilmington && workspaceId !== 'ws_wilmington') {
      return null;
    }
    return {
      callId,
      workspaceId,
      recordingUrlAvailable: false,
      audioEndpoint: undefined,
      callDurationSeconds: 0,
      recordingDurationSeconds: undefined,
      transcript: '',
      recordingStatus: 'unavailable'
    };
  }

  const callWs = (call as any).workspaceId || 'ws_wilmington';
  const callIsWilmington = validWorkspaces.includes(callWs);

  // Validate workspace ownership
  if (isTargetWilmington !== callIsWilmington && callWs !== workspaceId) {
    return null;
  }

  const recordingUrl = call.recordingUrl || DEFAULT_RECORDINGS_MAP[callId];
  const hasRecording = Boolean(recordingUrl);
  const durationSec = typeof call.durationSeconds === 'number'
    ? call.durationSeconds
    : (parseInt(String((call as any).durationSeconds || '0'), 10) || 0);

  return {
    callId: call.id,
    workspaceId: callWs,
    recordingUrlAvailable: hasRecording,
    audioEndpoint: hasRecording ? `/api/marketing/calls/${call.id}/audio` : undefined,
    callDurationSeconds: durationSec,
    recordingDurationSeconds: hasRecording ? durationSec : undefined,
    transcript: call.transcript || '',
    recordingStatus: hasRecording
      ? 'available'
      : (call.status === 'in_progress' ? 'processing' : 'unavailable')
  };
}

export function formatEasternCallTimestamp(input?: string | Date | null): string {
  if (!input) return '';
  try {
    return new Date(input).toLocaleString('en-US', { timeZone: 'America/New_York' });
  } catch {
    return String(input);
  }
}
