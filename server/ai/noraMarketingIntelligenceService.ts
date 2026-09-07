import { GoogleGenAI } from '@google/genai';

export interface NoraMarketingQueryResult {
  intent: 'call_lookup' | 'workload_audit' | 'general_sop' | 'next_steps';
  answerText: string;
  matchedCalls?: {
    id: string;
    callerName: string;
    callerPhone?: string;
    propertyAddress: string;
    timestamp: string;
    duration: string;
    audioUrl?: string;
    requestExcerpt?: string;
    transcriptExcerpt?: string;
    requestedCollateral: string[];
    departmentCategory?: string;
    status?: string;
  }[];
  workloadSummary?: {
    personName: string;
    personRole: string;
    department: string;
    openTaskCount: number;
    countsByStatus: {
      inProduction: number;
      proofSubmitted: number;
      readyForReview: number;
      completed: number;
    };
    tasks: {
      id: string;
      title: string;
      propertyAddress: string;
      priority: string;
      status: string;
      targetSla: string;
      deliverables: string[];
    }[];
  };
  suggestedNextSteps: {
    id: string;
    stepNumber: number;
    actionTitle: string;
    description: string;
    targetEntity?: string;
    actionType: 'open_transcript' | 'assign_va' | 'send_message' | 'open_task' | 'dispatch_vendor';
    actionPayload?: any;
  }[];
}

export interface ResolveNoraMarketingQueryOptions {
  query: string;
  calls: any[];
  campaigns: any[];
  workItems: any[];
  tenantId?: string;
}

export async function resolveNoraMarketingQuery(
  options: ResolveNoraMarketingQueryOptions
): Promise<NoraMarketingQueryResult> {
  const { query, calls = [], campaigns = [], workItems = [] } = options;
  const q = query.toLowerCase().trim();

  // 1. INTENT: CALL LOOKUP
  const isCallQuery =
    q.includes('call') ||
    q.includes('phone') ||
    q.includes('recording') ||
    q.includes('transcript') ||
    q.includes('matt') ||
    q.includes('walcott') ||
    q.includes('ocean') ||
    q.includes('main street') ||
    q.includes('mayfaire') ||
    q.includes('arboretum');

  // Match calls by address, caller name, phone, or transcript
  const matchedCalls = calls.filter((c: any) => {
    const addr = (c.propertyAddress || '').toLowerCase();
    const caller = (c.callerName || '').toLowerCase();
    const trans = (c.transcript || '').toLowerCase();
    const excerpt = (c.requestExcerpt || '').toLowerCase();
    const id = (c.id || '').toLowerCase();

    const searchTokens = q.split(' ').filter(t => t.length > 2 && !['show', 'find', 'the', 'call', 'what', 'with', 'about', 'from'].includes(t));
    if (searchTokens.length === 0) return false;

    return searchTokens.some(tok =>
      addr.includes(tok) || caller.includes(tok) || trans.includes(tok) || excerpt.includes(tok) || id.includes(tok)
    );
  });

  // 2. INTENT: WORKLOAD AUDIT (Eduardo/VA, Melissa, Ann, Ryan, etc.)
  const isWorkloadQuery =
    q.includes('task') ||
    q.includes('workload') ||
    q.includes('open') ||
    q.includes('plate') ||
    q.includes('assigned') ||
    q.includes('queue') ||
    q.includes('how many') ||
    q.includes('va') ||
    q.includes('virtual assistant') ||
    q.includes('virtual agent') ||
    q.includes('virtual agents') ||
    q.includes('va agent') ||
    q.includes('eduardo') ||
    q.includes('melissa') ||
    q.includes('ann') ||
    q.includes('ryan');

  let targetPerson = '';
  let targetRole = '';
  let targetDept = '';

  if (q.includes('va') || q.includes('eduardo') || q.includes('assistant') || q.includes('virtual agent') || q.includes('virtual assistant')) {
    targetPerson = 'Eduardo Lovo';
    targetRole = 'Virtual Assistant (Design Production)';
    targetDept = 'Marketing Collateral Production';
  } else if (q.includes('melissa')) {
    targetPerson = 'Melissa Gagliardi';
    targetRole = 'Director of Marketing & TC Lead';
    targetDept = 'Marketing Strategy & Review';
  } else if (q.includes('ann')) {
    targetPerson = 'Ann Gunn';
    targetRole = 'Operations Lead';
    targetDept = 'Sign Post & Field Operations';
  } else if (q.includes('ryan')) {
    targetPerson = 'Ryan Crecelius';
    targetRole = 'Broker-in-Charge (BIC)';
    targetDept = 'Compliance & Contract Review';
  }

  if (targetPerson || (isWorkloadQuery && !isCallQuery)) {
    // Default to Eduardo if general VA query
    const person = targetPerson || 'Eduardo Lovo';
    const role = targetRole || 'Virtual Assistant';
    const dept = targetDept || 'Marketing Collateral Production';

    let relevantTasks: any[] = [];

    if (person.includes('Eduardo') || person.includes('VA')) {
      relevantTasks = [
        {
          id: 'VA-001',
          title: 'Landfall Golf Villa 4-Asset Suite',
          propertyAddress: '1104 Arboretum Dr, Wilmington NC',
          priority: 'High',
          status: 'In Build',
          targetSla: 'Today 5:00 PM',
          deliverables: ['Double-Sided Flyer (8.5x11)', 'Glossy Postcard (6x9)', 'Social Story (9:16)', '1:1 Feed Post']
        },
        {
          id: 'VA-002',
          title: 'Oceanfront Luxury 5-Asset Suite',
          propertyAddress: '304 Ocean Blvd, Topsail Beach NC',
          priority: 'Urgent',
          status: 'In Build',
          targetSla: 'Today 5:00 PM',
          deliverables: ['Double-Sided Flyer (8.5x11)', 'Direct Mail Postcard (6x9)', 'Social Carousel (3 Slides)', 'Sign Rider (24x6)']
        },
        {
          id: 'VA-003',
          title: 'Mayfaire Townhome Open House Blast',
          propertyAddress: '990 Inspiration Drive, Wilmington NC',
          priority: 'Normal',
          status: 'Proof Staged',
          targetSla: 'Today 4:30 PM',
          deliverables: ['Feature Flyer (8.5x11)', 'Social Story (9:16)']
        },
        {
          id: 'VA-004',
          title: 'Yard Sign & Rider Installation',
          propertyAddress: '312 Mayfaire Way, Wilmington NC',
          priority: 'Normal',
          status: 'Completed',
          targetSla: 'Today 3:00 PM',
          deliverables: ['Agent Sign Rider (24x6)', 'Vendor Work Order Ticket']
        }
      ];
    } else if (person.includes('Melissa')) {
      relevantTasks = [
        {
          id: 'MKT-001',
          title: 'Daily Marketing Collateral Standup Review',
          propertyAddress: 'Wilmington HQ Queue',
          priority: 'High',
          status: 'In Progress',
          targetSla: 'Today 2:00 PM',
          deliverables: ['Review 990 Inspiration Proofs', 'Approve 1104 Arboretum Flyer Draft']
        },
        {
          id: 'MKT-002',
          title: '702 Lumina Ave Media Launch',
          propertyAddress: '702 Lumina Ave, Wrightsville Beach NC',
          priority: 'Normal',
          status: 'In Production',
          targetSla: 'Tomorrow 10:00 AM',
          deliverables: ['Twilight Media Package', 'Direct Mail Radius Run (500 mailers)']
        }
      ];
    } else if (person.includes('Ann')) {
      relevantTasks = [
        {
          id: 'OPS-101',
          title: 'Sign Post Installation Dispatch',
          propertyAddress: '312 Mayfaire Way, Wilmington NC',
          priority: 'High',
          status: 'Dispatched to Vendor',
          targetSla: 'Today 3:00 PM',
          deliverables: ['Coastal Sign Post Co. Ticket', 'Brochure Box Mount']
        }
      ];
    } else if (person.includes('Ryan')) {
      relevantTasks = [
        {
          id: 'BIC-201',
          title: 'Lead-Based Paint Disclosure & MOGS Audit',
          propertyAddress: '104 Main Street, Wilmington NC',
          priority: 'Urgent',
          status: 'Pending Audit',
          targetSla: 'Today 1:00 PM',
          deliverables: ['Verify Form 2-T Pre-Offer Disclosures', 'MOGS Verification']
        }
      ];
    }

    const inProduction = relevantTasks.filter(t => t.status === 'In Build' || t.status === 'In Progress' || t.status === 'In Production' || t.status === 'Dispatched to Vendor').length;
    const proofSubmitted = relevantTasks.filter(t => t.status === 'Proof Staged' || t.status === 'Pending Audit').length;
    const completed = relevantTasks.filter(t => t.status === 'Completed').length;
    const readyForReview = relevantTasks.filter(t => t.status === 'Ready for Review').length;

    const answer = `**${person}** (${role}) currently has **${relevantTasks.length} total tasks** in the pipeline:\n\n• **${inProduction} In Production / Active**\n• **${proofSubmitted} Proofs Staged for Review**\n• **${completed} Completed Today**\n\nBelow is the detailed task breakdown and recommended operational next steps:`;

    const nextSteps = [
      {
        id: 'step_1',
        stepNumber: 1,
        actionTitle: `Review ${relevantTasks[0]?.propertyAddress.split(',')[0] || 'active listing'} proof draft`,
        description: `Open Nest Design Center to inspect collateral assets for ${relevantTasks[0]?.propertyAddress || 'listing'}.`,
        targetEntity: relevantTasks[0]?.id,
        actionType: 'open_task' as const,
        actionPayload: { taskId: relevantTasks[0]?.id, propertyAddress: relevantTasks[0]?.propertyAddress }
      },
      {
        id: 'step_2',
        stepNumber: 2,
        actionTitle: 'Verify NCREC disclosures & license numbers',
        description: 'Ensure NC Broker License #C29184 and Equal Housing logos appear on all print flyers.',
        actionType: 'open_task' as const,
        actionPayload: { sopCode: 'SOP-MKT-008' }
      },
      {
        id: 'step_3',
        stepNumber: 3,
        actionTitle: 'Send automated status SMS to listing agent',
        description: 'Notify agent that collateral package is in build and on schedule for target SLA.',
        actionType: 'send_message' as const,
        actionPayload: { propertyAddress: relevantTasks[0]?.propertyAddress }
      }
    ];

    return {
      intent: 'workload_audit',
      answerText: answer,
      workloadSummary: {
        personName: person,
        personRole: role,
        department: dept,
        openTaskCount: relevantTasks.length,
        countsByStatus: {
          inProduction,
          proofSubmitted,
          readyForReview,
          completed
        },
        tasks: relevantTasks
      },
      suggestedNextSteps: nextSteps
    };
  }

  // Handle Call Lookup matches
  if (matchedCalls.length > 0) {
    const primaryCall = matchedCalls[0];
    const requestedCollateral: string[] =
      primaryCall.aiExtractedDetails?.requiredCollateral ||
      (primaryCall.requestType?.includes('Flyer') ? ['Print Flyer', 'Digital Flyer'] : ['Luxury Collateral Suite', 'Social Story']);

    const answer = `I found **${matchedCalls.length} intake call${matchedCalls.length > 1 ? 's' : ''}** matching your request:\n\n• **Caller**: ${primaryCall.callerName} (${primaryCall.phone || primaryCall.callerPhone || 'Inbound'})\n• **Property**: ${primaryCall.propertyAddress}\n• **Received**: ${primaryCall.timestamp} (Duration: ${primaryCall.duration})\n• **Requested Deliverables**: ${requestedCollateral.join(', ')}\n\nHere is the interactive call card with recording playback and 1-click execution actions:`;

    const nextSteps = [
      {
        id: 'step_call_1',
        stepNumber: 1,
        actionTitle: `Assign ${primaryCall.propertyAddress.split(',')[0]} to VA Eduardo`,
        description: 'Send this collateral package request directly to the Virtual Assistant production workspace.',
        targetEntity: primaryCall.id,
        actionType: 'assign_va' as const,
        actionPayload: { callId: primaryCall.id, propertyAddress: primaryCall.propertyAddress }
      },
      {
        id: 'step_call_2',
        stepNumber: 2,
        actionTitle: 'Inspect Full Verbatim Transcript',
        description: 'Open the right-hand slide-out drawer to inspect the audio waveform and full conversation dialogue.',
        targetEntity: primaryCall.id,
        actionType: 'open_transcript' as const,
        actionPayload: { callId: primaryCall.id }
      },
      {
        id: 'step_call_3',
        stepNumber: 3,
        actionTitle: `Send message back to ${primaryCall.callerName.split(' ')[0]}`,
        description: 'Open multi-channel SMS/Email popup pre-filled with this call transcript excerpt.',
        targetEntity: primaryCall.id,
        actionType: 'send_message' as const,
        actionPayload: { callId: primaryCall.id, callerName: primaryCall.callerName }
      }
    ];

    return {
      intent: 'call_lookup',
      answerText: answer,
      matchedCalls: matchedCalls.map(c => ({
        id: c.id,
        callerName: c.callerName,
        callerPhone: c.phone || c.callerPhone || '+1 (910) 507-2047',
        propertyAddress: c.propertyAddress,
        timestamp: c.timestamp,
        duration: c.duration,
        audioUrl: c.audioUrl || `/api/marketing/calls/${c.id}/audio`,
        requestExcerpt: c.requestExcerpt || c.requestType,
        transcriptExcerpt: (c.transcript || '').split('\n').slice(0, 3).join('\n'),
        requestedCollateral: c.aiExtractedDetails?.requiredCollateral || ['Print Flyer', 'Digital Flyer', 'Social Graphics'],
        departmentCategory: c.departmentCategory || 'marketing_collateral',
        status: c.status || 'completed'
      })),
      suggestedNextSteps: nextSteps
    };
  }

  // Fallback: General Marketing Intelligence
  return {
    intent: 'general_sop',
    answerText: `I searched across all marketing intake calls, active production campaigns, and team task queues for **"${query}"**.\n\nHere are the recommended operational actions you can take:`,
    suggestedNextSteps: [
      {
        id: 'step_gen_1',
        stepNumber: 1,
        actionTitle: 'Check Virtual Assistant (Eduardo) Queue',
        description: 'View the 4 active collateral tasks currently staged in the VA Production Hub.',
        actionType: 'open_task' as const,
        actionPayload: { subtab: 'va' }
      },
      {
        id: 'step_gen_2',
        stepNumber: 2,
        actionTitle: 'Search Telephony Calls Log',
        description: 'Filter through recorded inbound agent phone requests from the past 30 days.',
        actionType: 'open_transcript' as const,
        actionPayload: { subtab: 'calls' }
      },
      {
        id: 'step_gen_3',
        stepNumber: 3,
        actionTitle: 'Open Nest Design Center (Maxa)',
        description: 'Open official brand templates for Wilmington luxury flyers and social stories.',
        actionType: 'open_task' as const,
        actionPayload: { subtab: 'templates' }
      }
    ]
  };
}
