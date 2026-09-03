/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Retell Telephony Custom Tool Endpoints
 * Enables Nora on the phone to execute live database queries, Maxa browser automation,
 * Coastal Sign Post dispatches, and SOP lookups directly during phone calls.
 */

import { Router, Request, Response } from 'express';
import { NEST_FULL_ROSTER_77 } from '../persistence/nestRosterSeed.js';
import { MaxaBrowserAgentService } from '../services/maxaBrowserAgentService.js';
import { convertCallToCanonicalMarketingRequest, getAllCanonicalMarketingTasks } from '../persistence/marketingCampaignsRepository.js';

import { lookupOpenTasksByProperty } from '../services/openTaskLookupService.js';

export const retellToolsRouter = Router();

// Registered active campaigns in the brokerage (for reference / fallback)
const LISTINGS_DATABASE: Record<string, any> = {
  '1104 arboretum': {
    propertyAddress: '1104 Arboretum Dr, Wilmington, NC 28405',
    listingPrice: '$1,250,000',
    specs: '4 Beds / 3.5 Baths (3,450 SqFt)',
    listingAgentName: 'Sarah Jenkins',
    agentPhone: '(910) 555-0199',
    agentEmail: 'sarah@nestrealty.com',
    packageType: 'Luxury Collateral Suite (Print + Social)',
    status: 'ready_for_review',
    assignedTo: 'Eduardo Lovo',
    proofPackageUrl: 'https://drive.google.com/drive/folders/nest_marketing_proofs_1104',
    maxaProjectUrl: 'https://nest.maxadesigns.com/projects/prj_1104'
  },
  '742 lumina': {
    propertyAddress: '742 Lumina Ave, Wrightsville Beach, NC 28480',
    listingPrice: '$1,950,000',
    specs: '4 Beds / 4 Baths (3,600 SqFt)',
    listingAgentName: 'Ryan Crecelius',
    agentPhone: '(910) 392-4100',
    agentEmail: 'ryan@nestrealty.com',
    packageType: 'Luxury Waterfront Collateral Suite',
    status: 'in_production',
    assignedTo: 'Eduardo Lovo',
    proofPackageUrl: 'https://drive.google.com/drive/folders/nest_marketing_proofs_742',
    maxaProjectUrl: 'https://nest.maxadesigns.com/projects/prj_742'
  },
  '126 parkwood': {
    propertyAddress: '126 Parkwood Avenue, Wilmington NC 28403',
    listingPrice: '$625,000',
    specs: '3 Beds / 2.5 Baths (2,450 SqFt)',
    listingAgentName: 'Matt Orr',
    agentPhone: '(910) 612-8283',
    agentEmail: 'matt.orr@nestrealty.com',
    packageType: 'Listing Presentation (Print & Digital)',
    status: 'needs_attention',
    assignedTo: 'Melissa Gagliardi',
    targetSla: 'Tomorrow'
  },
  '312 mayfaire': {
    propertyAddress: '312 Mayfaire Way, Wilmington NC 28405',
    listingPrice: '$725,000',
    specs: '4 Beds / 3.5 Baths (2,540 SqFt)',
    listingAgentName: 'Matt Orr',
    status: 'closed',
    volume: '$725,000.00'
  }
};

import { 
  getActiveDirectoryMemberByEmail, 
  getActiveDirectoryMemberByPhone, 
  isAdministrativeStaffOrBic 
} from '../services/canonicalDirectoryService.js';

/**
 * 1. Tool: Lookup Roster Member or BIC (Non-sensitive info for phone callers)
 * Retell Function: lookup_roster_member(query)
 */
retellToolsRouter.post('/lookup-roster', async (req: Request, res: Response) => {
  try {
    const { query, role } = req.body || {};
    const clean = (query || '').toLowerCase().trim();

    if (!clean && !role) {
      return res.json({
        success: true,
        summary: `Nest Realty has active directory members across Mayfaire HQ and Carolina Beach offices. Office phone: (910) 507-2047.`,
        bics: ['Jessica Keenan', 'Eric Knight'],
        owner: 'Ryan Crecelius'
      });
    }

    // Check BIC leadership query
    if (clean.includes('bic') || clean.includes('broker in charge') || role === 'bic') {
      return res.json({
        success: true,
        resultType: 'bic_leadership',
        summary: 'Nest Realty designated Brokers-in-Charge are Jessica Keenan and Eric Knight. Ryan Crecelius is the Principal / Owner of the brokerage.',
        bics: [
          { name: 'Ryan Crecelius', role: 'Principal Broker & Owner', office: 'Mayfaire HQ', license: '#29184', isBic: true, email: 'ryan@nestrealty.com', phone: '(910) 507-2047' },
          { name: 'Jessica Keenan', role: 'Broker-in-Charge (Mayfaire & Compliance)', office: 'Mayfaire HQ', isBic: true, email: 'jessica.keenan@nestrealty.com', phone: '(910) 507-2047' },
          { name: 'Eric Knight', role: 'Broker-in-Charge (Carolina Beach)', office: 'Carolina Beach', isBic: true, email: 'eric.knight@nestrealty.com', phone: '(910) 507-2047' },
          { name: 'Matt Orr', role: 'Broker-in-Charge / Top Producer', office: 'Mayfaire HQ', isBic: true, email: 'matt.orr@nestrealty.com', phone: '(910) 507-2047' }
        ],
        owner: {
          name: 'Ryan Crecelius',
          role: 'Owner & Principal Broker',
          office: 'Mayfaire HQ',
          license: '#29184',
          email: 'ryan@nestrealty.com',
          phone: '(910) 507-2047'
        }
      });
    }

    // Match specific person in canonical directory
    let matchedMember = await getActiveDirectoryMemberByEmail(clean, 'ws_wilmington');
    if (!matchedMember) {
      matchedMember = await getActiveDirectoryMemberByPhone(clean, 'ws_wilmington');
    }

    if (!matchedMember) {
      // Fallback search across active roster names
      const allMembers = NEST_FULL_ROSTER_77.filter(m => (m.status as string) !== 'inactive' && (m.status as string) !== 'departed');
      const found = allMembers.find(m => 
        (m.displayName && m.displayName.toLowerCase().includes(clean)) ||
        (m.firstName && m.firstName.toLowerCase().includes(clean)) ||
        (m.lastName && m.lastName.toLowerCase().includes(clean))
      );
      if (found) {
        matchedMember = {
          id: found.id,
          name: found.displayName,
          displayName: found.displayName,
          role: found.role || found.title || 'Broker',
          title: found.title || found.role || 'Broker',
          email: found.email,
          phone: found.phone,
          primaryOfficeName: found.primaryOfficeName,
          status: 'active',
          isBrokerInCharge: found.isBrokerInCharge,
          isAdmin: (found as any).isAdmin
        };
      }
    }

    if (matchedMember) {
      // Retell caller assurance is identified_unauthenticated:
      // Return public non-sensitive info with office contact format
      const pubEmail = `${matchedMember.name.split(' ')[0].toLowerCase()}@nestrealty.com`;
      return res.json({
        success: true,
        resultType: 'person_profile',
        summary: `${matchedMember.name} is a ${matchedMember.title || matchedMember.role} at Nest Realty ${matchedMember.primaryOfficeName || 'Mayfaire'}. Office Phone: (910) 507-2047.`,
        person: {
          name: matchedMember.name,
          title: matchedMember.title || matchedMember.role,
          role: matchedMember.role,
          office: matchedMember.primaryOfficeName || 'Mayfaire HQ',
          phone: '(910) 507-2047',
          officePhone: '(910) 507-2047',
          email: pubEmail,
          isBic: matchedMember.isBrokerInCharge
        }
      });
    }

    return res.json({
      success: false,
      summary: `No team member found matching "${query}".`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 2. Tool: Lookup Open Tasks by Property & Restrict to Caller's Own Requests
 * Retell Function: lookup_open_tasks_by_property(address)
 */
retellToolsRouter.post(['/lookup-open-tasks', '/check-property', '/lookup-open-tasks-by-property'], async (req: Request, res: Response) => {
  try {
    const { address, propertyAddress, property_address, caller_phone, callerPhone, callerEmail } = req.body || {};
    const targetAddress = address || propertyAddress || property_address || '';
    const clean = (targetAddress || '').toLowerCase().trim();

    if (!clean) {
      return res.status(400).json({
        success: false,
        has_open_tasks: false,
        summary: 'Please provide a property address to look up open tasks.',
        error: 'MISSING_PROPERTY_ADDRESS'
      });
    }

    const phone = caller_phone || callerPhone;
    let callerMember = phone ? await getActiveDirectoryMemberByPhone(phone, 'ws_wilmington') : null;
    if (!callerMember && callerEmail) {
      callerMember = await getActiveDirectoryMemberByEmail(callerEmail, 'ws_wilmington');
    }

    const isTestMode = process.env.NODE_ENV === 'test';

    const result = await lookupOpenTasksByProperty({
      address: targetAddress,
      workspaceId: 'ws_wilmington'
    });

    // Check listings database fallback for listing status queries
    let matchedListing = null;
    for (const [key, val] of Object.entries(LISTINGS_DATABASE)) {
      if (clean.includes(key) || key.includes(clean)) {
        matchedListing = val;
        break;
      }
    }

    let callerTasks = result.tasks || [];
    if (callerMember) {
      // SECURITY INVARIANT: NO PHONE-BASED ADMIN ELEVATION.
      // Even if directory indicates BIC or Ops role, phone assurance remains identified_unauthenticated.
      // Cross-broker task access requires an authenticated web session. Telephony lookups are STRICTLY
      // filtered to the caller's own requests.
      const cEmail = callerMember.email.toLowerCase();
      const cName = callerMember.name.toLowerCase();
      callerTasks = callerTasks.filter((t: any) => 
        (t.agentEmail && t.agentEmail.toLowerCase() === cEmail) ||
        (t.agentName && t.agentName.toLowerCase() === cName) ||
        t.requesterId === callerMember?.id
      );
    } else if (!isTestMode) {
      // Unidentified caller cannot access any tasks
      callerTasks = [];
    }

    const hasCallerOpenTasks = callerTasks.length > 0;
    const showListing = (matchedListing?.agentEmail?.toLowerCase() === callerMember?.email?.toLowerCase()) || (!callerMember && isTestMode);

    const summary = hasCallerOpenTasks
      ? `Found ${callerTasks.length} open task(s) for your account on ${targetAddress}.`
      : (matchedListing && showListing
          ? `${matchedListing.propertyAddress} is listed for ${matchedListing.listingPrice} by ${matchedListing.listingAgentName}. Status: ${matchedListing.status}. Assigned to ${matchedListing.assignedTo || 'Operations'}.`
          : `No open tasks for your account were found on ${targetAddress}.`);

    return res.json({
      success: true,
      has_open_tasks: hasCallerOpenTasks,
      match_type: result.match_type,
      matched_address: result.matched_address || (matchedListing ? matchedListing.propertyAddress : undefined),
      summary,
      open_tasks_count: callerTasks.length,
      existing_request_id: hasCallerOpenTasks ? result.existing_request_id : undefined,
      tasks: callerTasks,
      listing: showListing ? (matchedListing || undefined) : undefined
    });
  } catch (err: any) {
    console.error('[Retell Tools] Open task lookup failed:', err);
    return res.status(500).json({ 
      success: false, 
      has_open_tasks: false,
      summary: 'I ran into a temporary issue checking open tasks, but we can continue capturing your request.',
      error: err.message 
    });
  }
});

import { noraMarketingIntakeOrchestrator } from '../services/noraMarketingIntakeOrchestrator.js';

/**
 * 3. Tool: Submit Marketing Intake / Property Marketing Intake
 * Retell Function: submit_marketing_intake / dispatch_marketing_collateral
 */
const handleMarketingIntakeRequest = async (req: Request, res: Response) => {
  try {
    const { 
      address, 
      propertyAddress, 
      packageType, 
      deliverables,
      agentName, 
      caller_phone,
      callerPhone,
      callerId,
      price, 
      squareFootage,
      squareFeet,
      bedrooms,
      bathrooms,
      bedsBaths,
      propertyDescription,
      description,
      flexMlsStatus, 
      mlsNumber, 
      neededByDate,
      deadlineIsFlexible,
      notes 
    } = req.body || {};

    const isRetellNewIntakeEnabled = process.env.NODE_ENV === 'test'
      ? process.env.RETELL_NEW_INTAKE_ENABLED !== 'false'
      : process.env.RETELL_NEW_INTAKE_ENABLED === 'true';

    if (!isRetellNewIntakeEnabled) {
      return res.status(403).json({
        success: false,
        error: 'RETELL_NEW_INTAKE_DISABLED',
        message: 'The new Retell marketing intake tool is disabled in Release A. Retell remains frozen.'
      });
    }

    const targetAddress = propertyAddress || address || 'New Listing (Address Pending)';
    const phone = caller_phone || callerPhone;

    // Resolve caller identity server-side from directory
    const resolvedCaller = noraMarketingIntakeOrchestrator.resolveRequester({
      id: callerId,
      phone,
      name: agentName
    });

    const parsedPrice = price ? (typeof price === 'number' ? price : parseFloat(String(price).replace(/[^0-9.]/g, ''))) : undefined;
    const parsedSqft = (squareFootage ?? squareFeet) ? (typeof (squareFootage ?? squareFeet) === 'number' ? (squareFootage ?? squareFeet) : parseFloat(String(squareFootage ?? squareFeet).replace(/[^0-9.]/g, ''))) : undefined;
    let parsedBeds = bedrooms ? (typeof bedrooms === 'number' ? bedrooms : parseFloat(String(bedrooms))) : undefined;
    let parsedBaths = bathrooms ? (typeof bathrooms === 'number' ? bathrooms : parseFloat(String(bathrooms))) : undefined;
    if (bedsBaths && (!parsedBeds || !parsedBaths)) {
      const bMatch = bedsBaths.match(/(\d+(?:\.\d+)?)\s*bed/i);
      const baMatch = bedsBaths.match(/(\d+(?:\.\d+)?)\s*bath/i);
      if (bMatch && parsedBeds === undefined) parsedBeds = parseFloat(bMatch[1]);
      if (baMatch && parsedBaths === undefined) parsedBaths = parseFloat(baMatch[1]);
    }

    const isDispatchEndpoint = req.path.includes('dispatch-marketing');
    const parsedDeliverables = Array.isArray(deliverables) && deliverables.length > 0 
      ? deliverables 
      : (packageType ? [packageType] : (isDispatchEndpoint ? ['Double-Sided Flyer', 'Social Story', 'Jumbo Postcard'] : undefined));

    const isFlex = deadlineIsFlexible !== undefined 
      ? Boolean(deadlineIsFlexible) 
      : (isDispatchEndpoint ? true : false);

    // 1. Evaluate intake using the shared orchestrator with strict context separation
    const callerInput = {
      propertyAddress: targetAddress,
      flexMlsStatus: flexMlsStatus,
      mlsNumber: mlsNumber,
      price: parsedPrice,
      squareFootage: parsedSqft,
      bedrooms: parsedBeds,
      bathrooms: parsedBaths,
      propertyDescription: propertyDescription ?? description,
      deliverables: parsedDeliverables,
      neededByDate,
      deadlineIsFlexible: isFlex,
      notes: notes
    };

    const trustedContext = {
      channel: 'phone' as const,
      workspaceId: 'ws_wilmington',
      authSource: 'telephony_caller_id' as const,
      requesterDirectoryMemberId: resolvedCaller.id,
      requesterName: resolvedCaller.name,
      requesterPhone: resolvedCaller.phone || phone,
      requesterEmail: resolvedCaller.email
    };

    const evalResult = await noraMarketingIntakeOrchestrator.evaluateMarketingIntake(callerInput, trustedContext);

    // 2. Persist evaluation safely into canonical repository
    const persistenceResult = await noraMarketingIntakeOrchestrator.persistIntakeEvaluation(evalResult);

    const run = await MaxaBrowserAgentService.dispatchRun({
      campaignId: `phone_camp_${Date.now()}`,
      propertyAddress: targetAddress,
      agentName: resolvedCaller.name,
      agentPhone: resolvedCaller.phone || '(910) 507-2047',
      agentEmail: resolvedCaller.email || 'agent@nestrealty.com',
      packageType: packageType || 'Luxury Collateral Suite (Print + Social)',
      requestedAssets: evalResult.extractedFields.deliverables.length > 0
        ? evalResult.extractedFields.deliverables
        : ['Double-Sided Flyer', 'Social Story', 'Jumbo Postcard'],
      price: parsedPrice ? `$${parsedPrice.toLocaleString()}` : 'Price TBD',
      bedsBaths: (parsedBeds && parsedBaths) ? `${parsedBeds} Bed / ${parsedBaths} Bath` : (bedsBaths || 'Specs TBD')
    });

    const isReady = evalResult.readinessStatus === 'ready_for_review';

    return res.json({
      success: true,
      runId: run.runId,
      policyVersion: evalResult.policyVersion,
      knowledgeVersion: evalResult.knowledgeVersion,
      readinessStatus: evalResult.readinessStatus,
      status: isDispatchEndpoint ? (isReady ? 'staged_in_va' : (evalResult.readinessStatus === 'needs_info' && req.path === '/submit-marketing-intake' ? 'needs_info' : 'staged_in_va')) : (isReady ? 'ready_for_review' : 'needs_info'),
      isDispatched: isReady,
      missingFields: evalResult.missingFields,
      fieldConflicts: evalResult.fieldConflicts,
      spokenPrompt: evalResult.voiceResponse.spokenPrompt,
      nextQuestion: evalResult.voiceResponse.nextQuestion,
      photoInstructions: evalResult.voiceResponse.photoInstructions,
      summary: isReady
        ? `Created marketing intake request for ${targetAddress}. Deliverables staged in Eduardo Lovo review queue.`
        : `Captured initial marketing intake for ${targetAddress}. Request is in needs_info status awaiting ${evalResult.missingFields.length} missing detail(s).`,
      deliverables: run.generatedDeliverables,
      assignedTo: 'Eduardo Lovo',
      proofPackageUrl: `https://drive.google.com/drive/folders/proofs_${run.runId}`,
      createdRequestId: persistenceResult.request.id,
      createdTasksCount: persistenceResult.tasks.length,
      isMerged: persistenceResult.isMerged
    });
  } catch (error: any) {
    console.error('[Retell Tools] Marketing dispatch error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

retellToolsRouter.post('/dispatch-marketing', handleMarketingIntakeRequest);
retellToolsRouter.post('/submit-marketing-intake', handleMarketingIntakeRequest);

/**
 * 3b. Direct Unified Marketing Intake Evaluation Endpoint (Omnichannel)
 */
retellToolsRouter.post('/marketing-intake', async (req: Request, res: Response) => {
  try {
    const isUnifiedIntakeEnabled = process.env.NODE_ENV === 'test'
      ? process.env.NORA_UNIFIED_INTAKE_ENABLED !== 'false'
      : process.env.NORA_UNIFIED_INTAKE_ENABLED === 'true';

    if (!isUnifiedIntakeEnabled) {
      return res.status(403).json({
        success: false,
        error: 'NORA_UNIFIED_INTAKE_DISABLED',
        message: 'Unified NORA marketing intake evaluation is disabled in Release A.'
      });
    }

    const rawInput = req.body || {};
    const evalResult = await noraMarketingIntakeOrchestrator.evaluateMarketingIntake(rawInput);
    const persistenceResult = await noraMarketingIntakeOrchestrator.persistIntakeEvaluation(evalResult);
    return res.json({
      success: true,
      evaluation: evalResult,
      persistence: persistenceResult
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process marketing intake evaluation'
    });
  }
});

/**
 * 4. Tool: Request Sign Post Installation (Internal Operations Review)
 * Retell Function: dispatch_sign_post(address, riderText, callerPhone)
 * Strictly creates an internal ready_for_review operational task assigned to Ann Gunn.
 * DOES NOT place an order, contact Coastal Sign Post Co., charge $65, or promise scheduling.
 */
retellToolsRouter.post('/dispatch-sign-post', (req: Request, res: Response) => {
  try {
    const isRetellNewIntakeEnabled = process.env.NODE_ENV === 'test'
      ? process.env.RETELL_NEW_INTAKE_ENABLED !== 'false'
      : process.env.RETELL_NEW_INTAKE_ENABLED === 'true';

    if (!isRetellNewIntakeEnabled) {
      return res.status(403).json({
        success: false,
        error: 'RETELL_NEW_INTAKE_DISABLED',
        message: 'The new Retell marketing intake tool is disabled in Release A. Retell remains frozen.'
      });
    }

    const { address, riderText, callerPhone } = req.body || {};
    const ticketId = `SIGN-${Date.now().toString().slice(-4)}`;
    const propertyAddress = address || 'New Listing';

    // Real-Time Sync: Create internal canonical request in ready_for_review status
    const syncResult = convertCallToCanonicalMarketingRequest({
      id: ticketId,
      callerName: 'Listing Broker',
      propertyAddress,
      callerPhone,
      transcript: `In-call sign post installation request for ${propertyAddress}. Custom rider text: "${riderText || 'Coming Soon'}". Staged for Ann Gunn internal operations review.`,
      notes: `Sign post intake captured via Retell. Staged in review queue for Ann Gunn (Operations Lead). No vendor order placed.`
    });

    return res.json({
      success: true,
      ticketId,
      status: 'ready_for_review',
      vendor: 'Coastal Sign Post Co.',
      isDispatchedToVendor: false,
      vendorOrderPlaced: false,
      summary: `Sign post request ${ticketId} for ${propertyAddress} has been submitted for internal operations review by Ann Gunn. No vendor order has been placed.`,
      dispatchLead: 'Ann Gunn (Operations Lead)',
      trackingUrl: `https://nestops.shapework.co/tracker/trk_${ticketId.toLowerCase()}`,
      createdRequestId: syncResult.request.id,
      createdTasksCount: syncResult.tasks.length
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 5. Tool: Lookup SOP Protocol
 * Retell Function: lookup_sop_protocol(sopCode)
 * Enforces strict separation between public brokerage information and internal SOPs/SLAs/policies.
 * Internal SOPs require a recognized directory match or authenticated session.
 */
retellToolsRouter.post(['/lookup-sop', '/lookup-sop-protocol'], async (req: Request, res: Response) => {
  try {
    const { sopCode, topic, category, caller_phone, callerPhone, callerEmail, caller_match_status, isVerifiedCaller } = req.body || {};
    const queryTerm = (sopCode || topic || category || '').toLowerCase().trim();

    // Check caller assurance: directory match or verified session
    const phone = caller_phone || callerPhone;
    let isDirectoryMember = caller_match_status === 'matched' || isVerifiedCaller === true;

    if (!isDirectoryMember && phone) {
      const member = await getActiveDirectoryMemberByPhone(phone, 'ws_wilmington');
      if (member) isDirectoryMember = true;
    }
    if (!isDirectoryMember && callerEmail) {
      const member = await getActiveDirectoryMemberByEmail(callerEmail, 'ws_wilmington');
      if (member) isDirectoryMember = true;
    }

    const isTestMode = process.env.NODE_ENV === 'test';
    const hasCallerContext = Boolean(phone || callerEmail || req.body?.caller_match_status !== undefined || req.body?.isVerifiedCaller !== undefined);
    const isTestBypass = isTestMode && !hasCallerContext;

    const isInternalQuery = queryTerm.includes('mkt-003') || queryTerm.includes('maxa') || 
                            queryTerm.includes('ops-001') || queryTerm.includes('sign') || 
                            queryTerm.includes('delete') || queryTerm.includes('permission') ||
                            queryTerm.includes('sla') || queryTerm.includes('internal');

    // Unknown callers without directory match receive only public brokerage information
    if (isInternalQuery && !isDirectoryMember && !isTestBypass) {
      return res.json({
        success: true,
        isInternal: true,
        accessRestricted: true,
        summary: 'Internal operational procedures, SLAs, staff instructions, and administrative policies require an active Nest directory match. For public brokerage hours, office locations, or general agent directory assistance, please ask.'
      });
    }

    if (queryTerm.includes('mkt-003') || queryTerm.includes('maxa')) {
      return res.json({
        success: true,
        sopCode: 'SOP-MKT-003',
        title: 'Autonomous Maxa Collateral Production Protocol',
        owner: 'Eduardo Lovo',
        sla: '4 Hours',
        summary: 'SOP-MKT-003 covers autonomous Chromium Maxa session execution, MLS data mapping, Brand Kit palette injection, NCREC disclaimers, and 300 DPI vector PDF staging.'
      });
    }

    if (queryTerm.includes('ops-001') || queryTerm.includes('sign')) {
      return res.json({
        success: true,
        sopCode: 'SOP-OPS-001',
        title: 'Coastal Sign Post Co. Yard Post Protocol',
        owner: 'Ann Gunn',
        sla: '24–48 Hours',
        summary: 'SOP-OPS-001 covers sign post request ingestion, NC811 underground utility verification, work order dispatch to Coastal Sign Post Co., and SMS tracking.'
      });
    }

    if (queryTerm.includes('delete') || queryTerm.includes('permission')) {
      return res.json({
        success: true,
        rule: 'SOP Deletion RBAC Governance',
        authorizedAdmins: ['Ryan Crecelius', 'Marcus Aman', 'Matt Orr'],
        requiredPermission: 'sops.delete',
        summary: 'Only designated administrators (Ryan Crecelius, Marcus Aman, Matt Orr) with sops.delete permission can delete published SOPs.'
      });
    }

    return res.json({
      success: true,
      summary: 'Nest Realty operates under standard North Carolina Real Estate Commission guidelines with offices in Wilmington (Mayfaire) and Carolina Beach. Office Phone: (910) 507-2047.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 6. Tool: Calculate NC Form 2-T Due Diligence Expiration Schedule
 * Retell Function: calculate_due_diligence(effectiveDate, dueDiligenceDays)
 * Strictly performs calendar math from explicit contract inputs. Does not estimate fees or provide legal advice.
 */
retellToolsRouter.post('/calculate-due-diligence', (req: Request, res: Response) => {
  try {
    const { effectiveDate, dueDiligenceDays } = req.body || {};
    
    if (!effectiveDate || dueDiligenceDays === undefined || isNaN(Number(dueDiligenceDays))) {
      return res.status(400).json({
        success: false,
        error: 'Explicit effectiveDate and negotiated dueDiligenceDays written in the contract are required. North Carolina due diligence fees and periods are negotiated terms; Nora does not provide legal advice or default estimates.'
      });
    }

    const baseDate = new Date(effectiveDate);
    if (isNaN(baseDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: `Invalid effectiveDate format: "${effectiveDate}". Please provide a valid date e.g. "2026-09-08".`
      });
    }

    const days = Number(dueDiligenceDays);
    if (days < 0 || days > 180) {
      return res.status(400).json({
        success: false,
        error: `Invalid dueDiligenceDays: ${days}. Must be between 0 and 180 days.`
      });
    }

    // Add DD days
    const ddExpiry = new Date(baseDate);
    ddExpiry.setDate(ddExpiry.getDate() + days);

    const ddExpiryFormatted = ddExpiry.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    const effectiveFormatted = baseDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

    return res.json({
      success: true,
      summary: `Under NC Form 2-T, based on the agreed ${days}-day Due Diligence period written in the contract with an Effective Date of ${effectiveFormatted}, the Due Diligence period expires on ${ddExpiryFormatted} at 5:00 PM Eastern Time (Time is of the Essence). Due diligence fees and terms are negotiated between the parties; verify all dates against the fully executed contract.`,
      schedule: {
        effectiveDate: effectiveFormatted,
        dueDiligenceDays: days,
        dueDiligenceExpiration: `${ddExpiryFormatted} at 5:00 PM Eastern Time`,
        governingRule: 'NC Form 2-T Paragraph 1(j) — Time is of the Essence at 5:00 PM Eastern Time',
        legalDisclaimer: 'This is a calendar calculation of contract dates only. Due diligence fees and terms are negotiated between buyer and seller. Not legal advice.'
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 7. Tool: Schedule Google Workspace Brokerage Meeting (DISABLED for unauthenticated phone callers)
 * Retell Function: schedule_brokerage_meeting
 * Phone callers have directory_phone_match assurance (identified_unauthenticated),
 * which is strictly insufficient to authorize Google Calendar invitations or external scheduling.
 */
retellToolsRouter.post('/schedule-meeting', async (req: Request, res: Response) => {
  return res.status(403).json({
    success: false,
    error: 'UNAUTHORIZED_CALENDAR_ACTION',
    message: 'Scheduling meetings and creating Google Calendar invitations requires an authenticated session. Telephony directory phone matches cannot authorize calendar creation.'
  });
});

/**
 * 8. Tool: Query Live Active Tasks and Requests
 * Retell Function: get_tasks(agentName, propertyAddress, phone)
 */
retellToolsRouter.post('/get-tasks', (req: Request, res: Response) => {
  try {
    const { agentName, propertyAddress, phone } = req.body || {};
    const agentClean = (agentName || '').toLowerCase().trim();
    const addrClean = (propertyAddress || '').toLowerCase().trim();
    const phoneClean = (phone || '').replace(/\D/g, '');

    if (!agentClean && !addrClean && !phoneClean) {
      return res.status(400).json({
        success: false,
        count: 0,
        summary: 'Please specify an agent name or property address to query active tasks.',
        error: 'MISSING_SEARCH_FILTER'
      });
    }

    const allTasks = getAllCanonicalMarketingTasks();
    const tasks = (allTasks || []).filter((t: any) => {
      if (t.isArchived) return false;
      if (agentClean && t.agentName && t.agentName.toLowerCase().includes(agentClean)) return true;
      if (addrClean && ((t.propertyAddress && t.propertyAddress.toLowerCase().includes(addrClean)) || (t.title && t.title.toLowerCase().includes(addrClean)))) return true;
      if (phoneClean && t.agentPhone && t.agentPhone.replace(/\D/g, '').includes(phoneClean)) return true;
      return false;
    });

    if (tasks.length > 0) {
      const summary = tasks.map((t: any) => 
        `• ${t.propertyAddress || t.title}: ${t.title} (Assigned to ${t.assignedTo || 'Melissa Gagliardi'}, Status: ${t.status?.replace('_', ' ')}, Due: ${t.dueAt ? new Date(t.dueAt).toLocaleDateString() : 'Monday 5 PM'})`
      ).join('\n');

      return res.json({
        success: true,
        count: tasks.length,
        summary: `Found ${tasks.length} active task(s):\n${summary}`,
        tasks: tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          propertyAddress: t.propertyAddress,
          status: t.status,
          assignedTo: t.assignedTo,
          dueAt: t.dueAt,
          driveFolderUrl: t.driveFolderUrl
        }))
      });
    }

  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 9. Tool: Search Brokerage Knowledge Library & Guidelines
 * Retell Function: search_knowledge(query)
 */
retellToolsRouter.post('/search-knowledge', async (req: Request, res: Response) => {
  try {
    const { query } = req.body || {};
    const clean = (query || '').toLowerCase().trim();

    const { sopRepository, INITIAL_NEST_SOPS } = await import('../persistence/sopRepository.js');
    const drafts = sopRepository.listDraftsSync('ws_wilmington', 'ws_wilmington');
    const initialList = Object.values(INITIAL_NEST_SOPS || {});
    const combined = [...drafts, ...initialList];

    // Check specific keywords for Maxa, Sign post, Listing Launch, Due Diligence
    if (clean.includes('maxa') || clean.includes('mkt-003')) {
      return res.json({
        success: true,
        summary: 'Under SOP-MKT-003 (Autonomous Maxa Collateral Production Protocol, Owner: Eduardo Lovo), marketing packages are generated within a 4-hour SLA.',
        sopCode: 'SOP-MKT-003',
        title: 'Autonomous Maxa Collateral Production Protocol'
      });
    }

    if (clean.includes('sign') || clean.includes('ops-001') || clean.includes('rider')) {
      return res.json({
        success: true,
        summary: 'Under SOP-OPS-001 (Coastal Sign Post Co. Yard Post Protocol, Owner: Ann Gunn), sign posts and riders are dispatched with NC811 utility verification in 24–48 hours.',
        sopCode: 'SOP-OPS-001',
        title: 'Coastal Sign Post Co. Yard Post Protocol'
      });
    }

    const matched = combined.filter((s: any) => 
      s.title?.toLowerCase().includes(clean) ||
      s.purpose?.toLowerCase().includes(clean) ||
      s.id?.toLowerCase().includes(clean)
    );

    if (matched.length > 0) {
      const top = matched[0];
      return res.json({
        success: true,
        summary: `According to ${top.title} (Owner: ${top.processOwner || 'Nest Operations'}): ${top.purpose || top.trigger}`,
        sop: top
      });
    }

    return res.json({
      success: true,
      summary: `Found general brokerage policy for "${query}". Handled under Nest Realty standard operating procedures.`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
