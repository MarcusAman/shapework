/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Nora Marketing Intake Orchestrator — Unified Omnichannel Policy Engine
 * 
 * Shared by all three Ask NORA channels:
 * 1. Retell AI Voice Agent (910) 507-2047
 * 2. AskNora@NestRealty.com Email Inbound Gateway
 * 3. Ask NORA Dashboard Page (Ryan's Shapework Hub)
 * 
 * Governing Policy:
 * - Single source of truth for Flex MLS vs Pre-MLS intake branch logic.
 * - Enforces 6 required property marketing inputs for Pre-MLS:
 *   Price, Square Footage, Bedrooms, Bathrooms, Description, Photos.
 * - Provider-neutral listing lookup via NoraMlsProviderAdapter (Rechat MCP).
 * - Surfaces broker vs MLS conflicts rather than silently overwriting.
 * - Prevents duplicate active property requests and protects placeholder addresses.
 * - Enforces needs_info gating until required inputs & photos are received.
 */

import { NoraMlsProviderAdapter, MlsListing } from '../integrations/mls/mlsProviderAdapter.js';
import { 
  getAllCanonicalMarketingRequests, 
  getAllCanonicalMarketingTasks,
  saveCanonicalMarketingRequest,
  saveCanonicalMarketingTask,
  CanonicalMarketingRequest,
  CanonicalMarketingTask
} from '../persistence/marketingCampaignsRepository.js';
import { NEST_FULL_ROSTER_77, DirectorySeedPerson } from '../persistence/nestRosterSeed.js';
import { canonicalTaskRoutingService } from './canonicalTaskRoutingService.js';
import { coalesceRealDriveUrl, isRealGoogleDriveUrl, promoteAskNoraListingFolder } from './askNoraDriveDelivery.js';


export const NORA_POLICY_VERSION = 'nora_marketing_intake_v2.1';
export const NORA_KNOWLEDGE_VERSION = 'nest_handbook_2026.1';

export type FlexMlsStatus = 'flex_live' | 'pre_mls' | 'unknown';

export type IntakeChannel = 'phone' | 'email' | 'web';

export type FieldProvenance = 
  | 'flex_mls'
  | 'rechat'
  | 'voice_caller'
  | 'email_body'
  | 'email_attachment'
  | 'web_form'
  | 'operations_override';

export interface FieldConflict {
  field: 'price' | 'squareFeet' | 'bedrooms' | 'bathrooms' | 'description';
  brokerValue: any;
  mlsValue: any;
  message: string;
  isConfirmed: boolean;
  brokerProvenance?: FieldProvenance;
  mlsProvenance?: FieldProvenance;
  confirmedValue?: any;
  confirmedSource?: 'broker' | 'flex_mls';
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ConflictResolution {
  field: 'price' | 'squareFeet' | 'bedrooms' | 'bathrooms' | 'description';
  selectedSource: 'broker' | 'flex_mls';
  confirmedValue?: any;
}

/**
 * Public / Caller-Controlled Intake Input Contract
 * Explicitly EXCLUDES workspaceId, requesterDirectoryMemberId, email, and phone.
 * Those identity parameters MUST be passed through the TrustedServerContext.
 */
export interface CallerControlledMarketingIntakeInput {
  propertyAddress?: string;
  flexMlsStatus?: FlexMlsStatus;
  mlsNumber?: string;
  price?: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyDescription?: string;
  deliverables?: string[];
  neededByDate?: string;
  deadlineIsFlexible?: boolean;
  notes?: string;
  verifiedAttachmentIds?: string[];
  managedUploadIds?: string[];
  photoReferences?: Array<{ id?: string; url: string; name?: string; hash?: string; source?: string; isManaged?: boolean }>;
  attachments?: Array<{ filename: string; contentType: string; url: string; hash?: string; isManaged?: boolean }>;
  existingRequestId?: string;
  intakeType?: 'property_listing' | 'signage_only' | 'non_property_general';
  conflictResolutions?: ConflictResolution[];
  representedAgentName?: string;
  callerName?: string;
  onBehalfOf?: string;
}

/**
 * Trusted Server-Side Context
 * Derived exclusively from Retell inbound call context (directory_phone_match),
 * verified email sender (exact active directory member + DMARC alignment),
 * or authenticated web session.
 */
export interface TrustedServerContext {
  channel: IntakeChannel;
  workspaceId: string;
  authSource: 'directory_phone_match' | 'verified_active_member_email' | 'authenticated_web_session' | 'unverified_inbound_email' | 'internal_system' | 'telephony_caller_id' | 'dkim_verified_email' | 'authenticated_session';
  requesterDirectoryMemberId?: string;
  requesterName?: string;
  requesterEmail?: string;
  requesterPhone?: string;
  callerName?: string;
  callerPhone?: string;
  onBehalfOf?: string;
  representedAgentName?: string;
  isCallerVerified?: boolean;
  assuranceLevel?: 'identified_unauthenticated' | 'dmarc_directory_verified' | 'authenticated_session' | 'unverified_draft';
}

// Canonical input alias for backwards compatibility
export type CanonicalMarketingIntakeInput = CallerControlledMarketingIntakeInput & Partial<TrustedServerContext>;

// Backward compatibility alias for raw adapter input
export type MarketingIntakeRawInput = Partial<CanonicalMarketingIntakeInput> & {
  squareFeet?: number | string;
  bedsBaths?: string;
  photos?: Array<{ id?: string; url: string; name?: string; hash?: string; source?: string; isManaged?: boolean }>;
  isDeadlineFlexible?: boolean;
  requesterId?: string;
  description?: string;
};

export interface MarketingIntakeEvaluationResult {
  policyVersion: string;
  knowledgeVersion: string;
  channel: IntakeChannel;
  workspaceId: string;
  authSource?: string;
  assuranceLevel?: string;
  requester: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    isVerified: boolean;
  };
  caller?: {
    name?: string;
    phone?: string;
    isVerified: boolean;
  };
  onBehalfOf?: string;
  propertyAddress: string;
  isAddressConfirmed: boolean;
  isPlaceholderAddress: boolean;
  normalizedPropertyKey: string | null;
  telephonyCallId?: string;
  flexMlsStatus: FlexMlsStatus;
  mlsNumber?: string;
  intakeType: 'property_listing' | 'signage_only' | 'non_property_general';
  
  // Canonical Values with Provenance
  extractedFields: {
    price?: number;
    squareFeet?: number;
    bedrooms?: number;
    bathrooms?: number;
    description?: string;
    deliverables: string[];
    neededByDate?: string;
    isDeadlineFlexible: boolean;
    photosCount: number;
    photos: Array<{ url: string; name?: string; hash?: string }>;
  };
  fieldProvenance: Record<string, FieldProvenance>;
  fieldConflicts: FieldConflict[];
  
  // MLS Integration State
  mlsLookupAttempted: boolean;
  mlsLookupSuccess: boolean;
  mlsListingData?: Partial<MlsListing>;
  mlsLookupMessage?: string;

  // Readiness & Gating
  readinessStatus: 'needs_info' | 'ready_for_review';
  missingFields: string[];
  existingOpenRequest?: CanonicalMarketingRequest;
  hasExistingOpenTask: boolean;

  // Channel-Specific Formatted Representations
  voiceResponse: {
    spokenPrompt: string;
    nextQuestion?: string;
    photoInstructions?: string;
  };
  emailResponse: {
    subject: string;
    bodyMarkdown: string;
    missingChecklist: string[];
    isClarificationNeeded: boolean;
  };
  webResponse: {
    cardTitle: string;
    statusBadge: 'Needs Information' | 'Ready for Review';
    receivedFields: Record<string, any>;
    neededFields: string[];
    photoStatus: string;
    nextAction: string;
    conflicts: FieldConflict[];
  };
}

// Known placeholder patterns that MUST NOT be converted to unique property keys
const PLACEHOLDER_ADDRESS_PATTERNS = [
  /wilmington\s*,?\s*nc\s*area\s*listing/i,
  /\[address\s*needed\]/i,
  /address\s*needed/i,
  /address\s*pending/i,
  /address\s*tbd/i,
  /inbound\s*phone\s*request/i,
  /inbound\s*phone\s*call/i,
  /unknown\s*property/i,
  /new\s*listing\s*\(address\s*pending\)/i,
  /new\s*listing/i,
  /tbd/i
];

export function isPlaceholderAddress(address?: string): boolean {
  if (!address || address.trim().length === 0) return true;
  const clean = address.trim();
  return PLACEHOLDER_ADDRESS_PATTERNS.some(pattern => pattern.test(clean));
}

export function computeCanonicalPropertyKey(address?: string): string | null {
  if (!address || isPlaceholderAddress(address)) return null;
  const normalized = address
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized.length > 3 ? normalized : null;
}

export class NoraMarketingIntakeOrchestrator {
  private mlsAdapter: NoraMlsProviderAdapter;

  constructor() {
    this.mlsAdapter = new NoraMlsProviderAdapter();
  }

  /**
   * Match requester against the 77-member Nest Directory
   */
  public resolveRequester(input: { id?: string; name?: string; email?: string; phone?: string }): {
    id: string;
    name: string;
    email: string;
    phone?: string;
    isVerified: boolean;
  } {
    let matched: DirectorySeedPerson | undefined;

    if (input.id) {
      matched = NEST_FULL_ROSTER_77.find(p => p.id === input.id || p.basecampPersonId === input.id);
    }
    if (!matched && input.email) {
      const emailLower = input.email.toLowerCase().trim();
      matched = NEST_FULL_ROSTER_77.find(p => 
        p.email?.toLowerCase() === emailLower || 
        p.secondaryEmail?.toLowerCase() === emailLower
      );
    }
    if (!matched && input.phone) {
      const cleanPhone = input.phone.replace(/\D/g, '').slice(-10);
      matched = NEST_FULL_ROSTER_77.find(p => p.phone?.replace(/\D/g, '').slice(-10) === cleanPhone);
    }
    if (!matched && input.name) {
      const nameLower = input.name.toLowerCase().trim();
      matched = NEST_FULL_ROSTER_77.find(p => 
        p.displayName?.toLowerCase() === nameLower ||
        `${p.firstName} ${p.lastName}`.toLowerCase() === nameLower
      );
    }

    if (matched) {
      return {
        id: matched.id,
        name: matched.displayName || `${matched.firstName} ${matched.lastName}`,
        email: matched.email,
        phone: matched.phone,
        isVerified: true
      };
    }

    return {
      id: input.id || `dir_unknown_${Date.now()}`,
      name: input.name || 'Unidentified Caller',
      email: input.email || '',
      phone: input.phone,
      isVerified: false
    };
  }

  /**
   * Main Evaluation Function — Evaluates intake across voice, email, and web
   */
  public async evaluateMarketingIntake(
    rawInput: CallerControlledMarketingIntakeInput | MarketingIntakeRawInput,
    trustedContext?: TrustedServerContext
  ): Promise<MarketingIntakeEvaluationResult> {
    // 1. Resolve channel and workspace strictly from trustedContext when provided
    const channel: IntakeChannel = trustedContext?.channel || (rawInput as any).channel || 'phone';
    const workspaceId: string = trustedContext?.workspaceId || (rawInput as any).workspaceId || 'ws_wilmington';
    const authSource = trustedContext?.authSource || 'internal_system';

    const isCallerVerified = trustedContext?.isCallerVerified !== undefined
      ? Boolean(trustedContext.isCallerVerified)
      : true;
    const onBehalfOf = trustedContext?.onBehalfOf || (rawInput as any).onBehalfOf || (rawInput as any).representedAgentName;
    const callerName = trustedContext?.callerName || (rawInput as any).callerName;

    // Resolve primary requester (represented agent if onBehalfOf is present, or caller)
    const targetAgentIdentifier = onBehalfOf 
      ? (trustedContext?.representedAgentName || onBehalfOf)
      : (trustedContext?.requesterName || (rawInput as any).requesterName);

    const requester = this.resolveRequester({
      id: trustedContext?.requesterDirectoryMemberId || (rawInput as any).requesterDirectoryMemberId || (rawInput as any).requesterId,
      name: targetAgentIdentifier || trustedContext?.requesterName || (rawInput as any).requesterName,
      email: trustedContext?.requesterEmail || (rawInput as any).requesterEmail,
      phone: trustedContext?.requesterPhone || (rawInput as any).requesterPhone
    });

    const callerObj = {
      name: callerName || (isCallerVerified ? requester.name : 'Unmatched Caller'),
      phone: trustedContext?.callerPhone || (rawInput as any).callerPhone,
      isVerified: isCallerVerified
    };

    const propertyAddress = rawInput.propertyAddress?.trim() || '';
    const isPlaceholder = isPlaceholderAddress(propertyAddress);
    const isAddressConfirmed = !isPlaceholder && propertyAddress.length > 5;
    const normalizedPropertyKey = computeCanonicalPropertyKey(propertyAddress);

    // Determine Flex MLS Status canonically
    let flexMlsStatus: FlexMlsStatus = rawInput.flexMlsStatus || 'unknown';
    if (flexMlsStatus === 'unknown') {
      if (rawInput.mlsNumber && rawInput.mlsNumber.trim().length > 3) {
        flexMlsStatus = 'flex_live';
      }
    }

    const intakeType = rawInput.intakeType || (
      (rawInput.deliverables?.some(d => d.toLowerCase().includes('sign') || d.toLowerCase().includes('rider')) &&
       !rawInput.deliverables?.some(d => d.toLowerCase().includes('flyer') || d.toLowerCase().includes('postcard') || d.toLowerCase().includes('social')))
        ? 'signage_only'
        : 'property_listing'
    );

    const fieldProvenance: Record<string, FieldProvenance> = {};
    const fieldConflicts: FieldConflict[] = [];

    // Extract numerical and text fields without fabricating defaults
    let price: number | undefined = typeof rawInput.price === 'number' ? rawInput.price : (
      rawInput.price ? parseFloat(String(rawInput.price).replace(/[^0-9.]/g, '')) || undefined : undefined
    );
    let squareFootage: number | undefined = typeof (rawInput.squareFootage ?? (rawInput as any).squareFeet) === 'number'
      ? (rawInput.squareFootage ?? (rawInput as any).squareFeet as number)
      : (rawInput.squareFootage ?? (rawInput as any).squareFeet ? parseFloat(String(rawInput.squareFootage ?? (rawInput as any).squareFeet).replace(/[^0-9.]/g, '')) || undefined : undefined);
    let bedrooms: number | undefined = typeof rawInput.bedrooms === 'number' ? rawInput.bedrooms : (
      rawInput.bedrooms ? parseFloat(String(rawInput.bedrooms).replace(/[^0-9.]/g, '')) || undefined : undefined
    );
    let bathrooms: number | undefined = typeof rawInput.bathrooms === 'number' ? rawInput.bathrooms : (
      rawInput.bathrooms ? parseFloat(String(rawInput.bathrooms).replace(/[^0-9.]/g, '')) || undefined : undefined
    );
    let propertyDescription: string | undefined = (rawInput.propertyDescription ?? (rawInput as any).description)?.trim();

    const channelProvenance: FieldProvenance = (channel === 'phone' || (channel as string) === 'voice')
      ? 'voice_caller' 
      : channel === 'email' 
        ? 'email_body' 
        : 'web_form';

    if (price !== undefined) fieldProvenance.price = channelProvenance;
    if (squareFootage !== undefined) fieldProvenance.squareFootage = channelProvenance;
    if (bedrooms !== undefined) fieldProvenance.bedrooms = channelProvenance;
    if (bathrooms !== undefined) fieldProvenance.bathrooms = channelProvenance;
    if (propertyDescription) fieldProvenance.propertyDescription = channelProvenance;

    // Do NOT fabricate default deliverables or due dates!
    const deliverables: string[] = Array.isArray(rawInput.deliverables) && rawInput.deliverables.length > 0 
      ? rawInput.deliverables 
      : [];
    if (deliverables.length > 0) fieldProvenance.deliverables = channelProvenance;

    const neededByDate = rawInput.neededByDate?.trim();
    const isDeadlineFlexible = Boolean(rawInput.deadlineIsFlexible ?? (rawInput as any).isDeadlineFlexible);
    if (neededByDate) fieldProvenance.neededByDate = channelProvenance;

    // Photos & Managed Attachments Validation
    const rawPhotos = rawInput.photoReferences || (rawInput as any).photos || [];
    const verifiedUploadIds = new Set(rawInput.managedUploadIds || []);
    const verifiedAttIds = new Set(rawInput.verifiedAttachmentIds || []);

    const photos: Array<{ id?: string; url: string; name?: string; hash?: string; source?: string; isManaged?: boolean }> = [];

    for (const p of rawPhotos) {
      const isManagedStorage = p.isManaged === true || 
        (p.id && (verifiedUploadIds.has(p.id) || verifiedAttIds.has(p.id))) ||
        p.source === 'email_attachment' || 
        p.source === 'managed_upload' || 
        p.source === 'flex_mls' ||
        p.url?.startsWith('/uploads/') ||
        p.url?.includes('drive.google.com') ||
        p.url?.includes('images.unsplash.com');

      if (isManagedStorage) {
        photos.push({
          id: p.id,
          url: p.url,
          name: p.name || 'Photo Asset',
          hash: p.hash,
          source: p.source || (channel === 'email' ? 'email_attachment' : 'managed_upload'),
          isManaged: true
        });
      } else {
        console.warn(`[Orchestrator] Rejecting unverified arbitrary photo URL: ${p.url}`);
      }
    }

    if (photos.length > 0) {
      fieldProvenance.photos = channel === 'email' ? 'email_attachment' : channelProvenance;
    }

    // BRANCH A: Property is live in Flex MLS -> Query NoraMlsProviderAdapter
    let mlsLookupAttempted = false;
    let mlsLookupSuccess = false;
    let mlsListingData: Partial<MlsListing> | undefined;
    let mlsLookupMessage: string | undefined;

    if (flexMlsStatus === 'flex_live' && (isAddressConfirmed || rawInput.mlsNumber)) {
      mlsLookupAttempted = true;
      try {
        let lookupResult: any = null;
        if (rawInput.mlsNumber) {
          lookupResult = await this.mlsAdapter.getListingByMlsNumber(rawInput.mlsNumber);
        }
        if (!lookupResult?.data && isAddressConfirmed) {
          lookupResult = await this.mlsAdapter.searchListings({ address: propertyAddress, limit: 1 });
          if (lookupResult?.data && Array.isArray(lookupResult.data)) {
            lookupResult = lookupResult.data.length > 0 ? { success: true, data: lookupResult.data[0] } : null;
          }
        }

        if (lookupResult?.data && !Array.isArray(lookupResult.data)) {
          mlsLookupSuccess = true;
          const listing = lookupResult.data as MlsListing;
          mlsListingData = listing;

          // Merge listing data & check for conflicts with broker-provided values
          if (listing.listPrice) {
            if (price !== undefined && Math.abs(price - listing.listPrice) > 1) {
              const resolution = (rawInput.conflictResolutions || []).find(r => r.field === 'price');
              const isConfirmed = Boolean(resolution);
              const confirmedSource = resolution?.selectedSource;
              const originalBrokerPrice = price;
              const confirmedValue = isConfirmed 
                ? (resolution?.confirmedValue !== undefined ? resolution.confirmedValue : (confirmedSource === 'broker' ? originalBrokerPrice : listing.listPrice))
                : undefined;

              if (isConfirmed) {
                price = confirmedValue;
                fieldProvenance.price = confirmedSource === 'broker' ? channelProvenance : 'flex_mls';
              }

              fieldConflicts.push({
                field: 'price',
                brokerValue: originalBrokerPrice,
                mlsValue: listing.listPrice,
                brokerProvenance: channelProvenance,
                mlsProvenance: 'flex_mls',
                message: isConfirmed
                  ? `Resolved: Confirmed $${confirmedValue?.toLocaleString()} (${confirmedSource === 'broker' ? 'Broker Value' : 'MLS Value'}). Broker specified $${originalBrokerPrice.toLocaleString()}, MLS listed $${listing.listPrice.toLocaleString()}.`
                  : `Broker specified $${originalBrokerPrice.toLocaleString()} but ${listing.provider || 'MLS'} lists $${listing.listPrice.toLocaleString()}. Confirmation required.`,
                isConfirmed,
                confirmedValue,
                confirmedSource,
                resolvedAt: isConfirmed ? new Date().toISOString() : undefined,
                resolvedBy: isConfirmed ? (trustedContext?.requesterEmail || trustedContext?.requesterName || 'Broker') : undefined
              });
            } else if (price === undefined) {
              price = listing.listPrice;
              fieldProvenance.price = 'flex_mls';
            }
          }

          if (listing.squareFeet) {
            if (squareFootage !== undefined && Math.abs(squareFootage - listing.squareFeet) > 5) {
              const resolution = (rawInput.conflictResolutions || []).find(r => r.field === 'squareFeet');
              const isConfirmed = Boolean(resolution);
              const confirmedSource = resolution?.selectedSource;
              const originalBrokerSqft = squareFootage;
              const confirmedValue = isConfirmed 
                ? (resolution?.confirmedValue !== undefined ? resolution.confirmedValue : (confirmedSource === 'broker' ? originalBrokerSqft : listing.squareFeet))
                : undefined;

              if (isConfirmed) {
                squareFootage = confirmedValue;
                fieldProvenance.squareFootage = confirmedSource === 'broker' ? channelProvenance : 'flex_mls';
              }

              fieldConflicts.push({
                field: 'squareFeet',
                brokerValue: originalBrokerSqft,
                mlsValue: listing.squareFeet,
                brokerProvenance: channelProvenance,
                mlsProvenance: 'flex_mls',
                message: isConfirmed
                  ? `Resolved: Confirmed ${confirmedValue} sqft (${confirmedSource === 'broker' ? 'Broker Value' : 'MLS Value'}). Broker specified ${originalBrokerSqft} sqft, MLS listed ${listing.squareFeet} sqft.`
                  : `Broker specified ${originalBrokerSqft} sqft but ${listing.provider || 'MLS'} lists ${listing.squareFeet} sqft. Confirmation required.`,
                isConfirmed,
                confirmedValue,
                confirmedSource,
                resolvedAt: isConfirmed ? new Date().toISOString() : undefined,
                resolvedBy: isConfirmed ? (trustedContext?.requesterEmail || trustedContext?.requesterName || 'Broker') : undefined
              });
            } else if (squareFootage === undefined) {
              squareFootage = listing.squareFeet;
              fieldProvenance.squareFootage = 'flex_mls';
            }
          }

          if (listing.bedrooms) {
            if (bedrooms !== undefined && bedrooms !== listing.bedrooms) {
              const resolution = (rawInput.conflictResolutions || []).find(r => r.field === 'bedrooms');
              const isConfirmed = Boolean(resolution);
              const confirmedSource = resolution?.selectedSource;
              const originalBrokerBeds = bedrooms;
              const confirmedValue = isConfirmed 
                ? (resolution?.confirmedValue !== undefined ? resolution.confirmedValue : (confirmedSource === 'broker' ? originalBrokerBeds : listing.bedrooms))
                : undefined;

              if (isConfirmed) {
                bedrooms = confirmedValue;
                fieldProvenance.bedrooms = confirmedSource === 'broker' ? channelProvenance : 'flex_mls';
              }

              fieldConflicts.push({
                field: 'bedrooms',
                brokerValue: originalBrokerBeds,
                mlsValue: listing.bedrooms,
                brokerProvenance: channelProvenance,
                mlsProvenance: 'flex_mls',
                message: isConfirmed
                  ? `Resolved: Confirmed ${confirmedValue} beds (${confirmedSource === 'broker' ? 'Broker Value' : 'MLS Value'}). Broker specified ${originalBrokerBeds} beds, MLS listed ${listing.bedrooms} beds.`
                  : `Broker specified ${originalBrokerBeds} beds but ${listing.provider || 'MLS'} lists ${listing.bedrooms} beds. Confirmation required.`,
                isConfirmed,
                confirmedValue,
                confirmedSource,
                resolvedAt: isConfirmed ? new Date().toISOString() : undefined,
                resolvedBy: isConfirmed ? (trustedContext?.requesterEmail || trustedContext?.requesterName || 'Broker') : undefined
              });
            } else if (bedrooms === undefined) {
              bedrooms = listing.bedrooms;
              fieldProvenance.bedrooms = 'flex_mls';
            }
          }

          if (listing.bathrooms) {
            if (bathrooms !== undefined && Math.abs(bathrooms - listing.bathrooms) > 0.1) {
              const resolution = (rawInput.conflictResolutions || []).find(r => r.field === 'bathrooms');
              const isConfirmed = Boolean(resolution);
              const confirmedSource = resolution?.selectedSource;
              const originalBrokerBaths = bathrooms;
              const confirmedValue = isConfirmed 
                ? (resolution?.confirmedValue !== undefined ? resolution.confirmedValue : (confirmedSource === 'broker' ? originalBrokerBaths : listing.bathrooms))
                : undefined;

              if (isConfirmed) {
                bathrooms = confirmedValue;
                fieldProvenance.bathrooms = confirmedSource === 'broker' ? channelProvenance : 'flex_mls';
              }

              fieldConflicts.push({
                field: 'bathrooms',
                brokerValue: originalBrokerBaths,
                mlsValue: listing.bathrooms,
                brokerProvenance: channelProvenance,
                mlsProvenance: 'flex_mls',
                message: isConfirmed
                  ? `Resolved: Confirmed ${confirmedValue} baths (${confirmedSource === 'broker' ? 'Broker Value' : 'MLS Value'}). Broker specified ${originalBrokerBaths} baths, MLS listed ${listing.bathrooms} baths.`
                  : `Broker specified ${originalBrokerBaths} baths but ${listing.provider || 'MLS'} lists ${listing.bathrooms} baths. Confirmation required.`,
                isConfirmed,
                confirmedValue,
                confirmedSource,
                resolvedAt: isConfirmed ? new Date().toISOString() : undefined,
                resolvedBy: isConfirmed ? (trustedContext?.requesterEmail || trustedContext?.requesterName || 'Broker') : undefined
              });
            } else if (bathrooms === undefined) {
              bathrooms = listing.bathrooms;
              fieldProvenance.bathrooms = 'flex_mls';
            }
          }

          if (listing.remarks && !propertyDescription) {
            propertyDescription = listing.remarks;
            fieldProvenance.propertyDescription = 'flex_mls';
          }

          if (listing.photos && listing.photos.length > 0 && photos.length === 0) {
            listing.photos.forEach((photoUrl, idx) => {
              photos.push({
                id: `mls_photo_${idx}`,
                url: photoUrl,
                name: `Listing Photo ${idx + 1}`,
                source: 'flex_mls'
              });
            });
            fieldProvenance.photos = 'flex_mls';
          }
        } else {
          mlsLookupSuccess = false;
          mlsLookupMessage = "I wasn’t able to retrieve the live listing information. I can still help—I’ll collect the property details directly.";
        }
      } catch (mlsErr: any) {
        mlsLookupSuccess = false;
        mlsLookupMessage = "I wasn’t able to retrieve the live listing information. I can still help—I’ll collect the property details directly.";
      }
    }

    // CHECK FOR EXISTING OPEN TASKS / REQUESTS FOR THIS PROPERTY
    let existingOpenRequest: CanonicalMarketingRequest | undefined;
    let hasExistingOpenTask = false;

    if (normalizedPropertyKey) {
      const allRequests = getAllCanonicalMarketingRequests();
      const allTasks = getAllCanonicalMarketingTasks();

      existingOpenRequest = allRequests.find(r => {
        if (r.isArchived || r.status === 'completed' || r.status === 'merged' || r.status === 'archived') return false;
        const key = computeCanonicalPropertyKey(r.propertyAddress);
        return key === normalizedPropertyKey;
      });

      if (existingOpenRequest) {
        hasExistingOpenTask = true;
      } else {
        const matchingTask = allTasks.find(t => {
          if (t.isArchived || t.status === 'completed' || t.status === 'merged' || t.status === 'archived') return false;
          const key = computeCanonicalPropertyKey(t.propertyAddress);
          return key === normalizedPropertyKey;
        });
        if (matchingTask) {
          hasExistingOpenTask = true;
        }
      }
    }

    // DETERMINE MISSING REQUIRED FIELDS & READINESS STRICTLY
    const missingFields: string[] = [];

    if (intakeType !== 'non_property_general') {
      if (!isAddressConfirmed) {
        missingFields.push('propertyAddress');
      }
    }

    if (deliverables.length === 0) {
      missingFields.push('deliverables');
    }

    if (!neededByDate && !isDeadlineFlexible) {
      missingFields.push('neededByDate');
    }

    if (intakeType === 'property_listing') {
      if (price === undefined) missingFields.push('price');
      if (squareFootage === undefined) missingFields.push('squareFootage');
      if (bedrooms === undefined) missingFields.push('bedrooms');
      if (bathrooms === undefined) missingFields.push('bathrooms');
      if (!propertyDescription || propertyDescription.length < 10) missingFields.push('propertyDescription');
      if (photos.length === 0) missingFields.push('photoReferences');
    }

    if (!isCallerVerified) {
      missingFields.push('broker_authorization_verification');
    }

    const unconfirmedConflicts = fieldConflicts.filter(c => !c.isConfirmed);

    for (const conf of unconfirmedConflicts) {
      missingFields.push(`${conf.field}_confirmation_required`);
    }

    const readinessStatus: 'needs_info' | 'ready_for_review' = 
      (missingFields.length === 0 && unconfirmedConflicts.length === 0)
        ? 'ready_for_review'
        : 'needs_info';

    // FORMAT OUTPUTS PER CHANNEL

    // 1. Voice Formatting (Spoken conversation + 1-question-at-a-time next step)
    let spokenPrompt = '';
    let nextQuestion: string | undefined;
    let photoInstructions: string | undefined = (photos.length === 0 && intakeType === 'property_listing')
      ? "Since the property isn’t live yet, I’ll need the photos before the marketing package can move into production. You can email them to AskNora@NestRealty.com with the property address in the subject, or upload them through the Ask NORA page."
      : undefined;

    if (onBehalfOf && !isCallerVerified) {
      spokenPrompt = `I’ve saved your request for ${propertyAddress || 'the property'} on behalf of ${requester.name}. The team will get right on it.`;
      nextQuestion = undefined;
    } else if (unconfirmedConflicts.length > 0) {
      const conflictSummaries = unconfirmedConflicts.map(c => `${c.field}: broker entered ${c.brokerValue} vs MLS ${c.mlsValue}`).join(', ');
      spokenPrompt = `I found a discrepancy between your provided information and the MLS listing (${conflictSummaries}). Please confirm which value is correct before we proceed.`;
      nextQuestion = spokenPrompt;
    } else if (flexMlsStatus === 'unknown') {
      spokenPrompt = "Is the property already live in Flex MLS, or are we getting the marketing ready before it goes live?";
      nextQuestion = spokenPrompt;
    } else if (flexMlsStatus === 'flex_live' && mlsLookupSuccess && mlsListingData) {
      const formattedPrice = price ? `$${price.toLocaleString()}` : 'the list price';
      const providerLabel = mlsListingData.provider || 'the listing service';
      spokenPrompt = `I found the listing information from ${providerLabel}. I have the price at ${formattedPrice}, ${squareFootage || 'unspecified'} square feet, ${bedrooms || 'unspecified'} bedrooms, and ${bathrooms || 'unspecified'} bathrooms. Is that all correct?`;
      if (missingFields.length > 0) {
        if (missingFields.includes('deliverables')) {
          nextQuestion = `Which marketing materials would you like us to prepare for ${propertyAddress}?`;
        } else if (missingFields.includes('neededByDate')) {
          nextQuestion = `What is your target deadline for these materials, or is the timeline flexible?`;
        }
      }
    } else if (missingFields.length > 0) {
      if (!isAddressConfirmed && intakeType !== 'non_property_general') {
        spokenPrompt = "What is the complete street address of the property?";
        nextQuestion = spokenPrompt;
      } else if (missingFields.includes('price')) {
        spokenPrompt = `Since ${propertyAddress} isn't live yet, I'll collect the property details directly. What price are you planning to list it at?`;
        nextQuestion = spokenPrompt;
      } else if (missingFields.includes('squareFootage')) {
        spokenPrompt = `Got it. What is the total square footage for ${propertyAddress}?`;
        nextQuestion = spokenPrompt;
      } else if (missingFields.includes('bedrooms')) {
        spokenPrompt = `How many bedrooms does the property have?`;
        nextQuestion = spokenPrompt;
      } else if (missingFields.includes('bathrooms')) {
        spokenPrompt = `How many bathrooms does the property have?`;
        nextQuestion = spokenPrompt;
      } else if (missingFields.includes('propertyDescription')) {
        spokenPrompt = `Could you share a brief property description or top key features to highlight?`;
        nextQuestion = spokenPrompt;
      } else if (missingFields.includes('photoReferences')) {
        spokenPrompt = `I have the property specs recorded. ${photoInstructions}`;
        nextQuestion = "Would you like me to send you an email confirmation with the photo upload link?";
      } else if (missingFields.includes('deliverables')) {
        spokenPrompt = `Which marketing materials do you need for ${propertyAddress}? (e.g. 1-page flyer, social story, postcard)`;
        nextQuestion = spokenPrompt;
      } else if (missingFields.includes('neededByDate')) {
        spokenPrompt = `When do you need these marketing materials completed by, or is your deadline flexible?`;
        nextQuestion = spokenPrompt;
      }
    } else {
      spokenPrompt = `All details for ${propertyAddress} are complete and verified! I have staged the marketing package for review.`;
    }

    // 2. Email Formatting (Concise written checklist requesting ONLY missing items)
    const friendlyMissingLabels: Record<string, string> = {
      propertyAddress: 'Confirmed property address',
      price: 'Planned listing price',
      squareFootage: 'Square footage',
      bedrooms: 'Bedrooms count',
      bathrooms: 'Bathrooms count',
      propertyDescription: 'Property description or key features',
      photoReferences: 'High-resolution property photos (attached or shared via Google Drive)',
      deliverables: 'Requested marketing deliverables (e.g. Flyer, Social Story, Postcard)',
      neededByDate: 'Needed-by delivery deadline (or note that deadline is flexible)',
      price_confirmation_required: 'Confirmation of listing price discrepancy with MLS',
      squareFootage_confirmation_required: 'Confirmation of square footage discrepancy with MLS',
      bedrooms_confirmation_required: 'Confirmation of bedroom count discrepancy with MLS',
      bathrooms_confirmation_required: 'Confirmation of bathroom count discrepancy with MLS'
    };

    const missingChecklist = missingFields.map(f => friendlyMissingLabels[f] || f);
    const isClarificationNeeded = missingFields.length > 0 || unconfirmedConflicts.length > 0;

    let emailSubject = `Marketing Request Intake: ${propertyAddress || 'New Property Inquiry'}`;
    let emailBodyMarkdown = '';

    if (isClarificationNeeded) {
      emailSubject = `Action Needed: Marketing details for ${propertyAddress || 'your listing'}`;
      emailBodyMarkdown = `Thanks for sending this over. Before we can start the marketing materials for **${propertyAddress || 'your property'}**, we still need:\n\n` +
        missingChecklist.map(item => `- [ ] ${item}`).join('\n') +
        (unconfirmedConflicts.length > 0 ? `\n\n**Please confirm the following discrepancies:**\n` + unconfirmedConflicts.map(c => `- **${c.field}**: ${c.message}`).join('\n') : '') +
        `\n\nYou can reply directly to this email with the missing details and attach the photos.`;
    } else {
      emailSubject = `Confirmed: Marketing package in review for ${propertyAddress}`;
      emailBodyMarkdown = `Great news! All required marketing specifications for **${propertyAddress}** have been verified and assigned to our review team.\n\n` +
        `- **Deliverables**: ${deliverables.join(', ')}\n` +
        `- **Price**: $${(price || 0).toLocaleString()}\n` +
        `- **Specs**: ${bedrooms} Bed / ${bathrooms} Bath • ${(squareFootage || 0).toLocaleString()} SqFt\n` +
        `- **Photos Received**: ${photos.length} photos staged\n` +
        `- **Target Completion**: ${isDeadlineFlexible ? 'Flexible Timeline' : (neededByDate || 'Standard SLA')}\n\n` +
        `We will notify you as soon as your initial proofs are ready for review!`;
    }

    // 3. Web Formatting (Structured interactive intake card)
    const receivedFields: Record<string, any> = {};
    if (isAddressConfirmed) receivedFields.address = propertyAddress;
    if (price !== undefined) receivedFields.price = `$${price.toLocaleString()}`;
    if (squareFootage !== undefined) receivedFields.squareFootage = `${squareFootage.toLocaleString()} sqft`;
    if (bedrooms !== undefined) receivedFields.bedrooms = bedrooms;
    if (bathrooms !== undefined) receivedFields.bathrooms = bathrooms;
    if (propertyDescription) receivedFields.propertyDescription = propertyDescription;
    if (deliverables.length > 0) receivedFields.deliverables = deliverables;
    if (neededByDate) receivedFields.neededByDate = neededByDate;
    if (isDeadlineFlexible) receivedFields.deadlineIsFlexible = true;

    const webResponse = {
      cardTitle: `Marketing Intake • ${propertyAddress || 'Property Listing'}`,
      statusBadge: (readinessStatus === 'ready_for_review' ? 'Ready for Review' : 'Needs Information') as 'Needs Information' | 'Ready for Review',
      receivedFields,
      neededFields: missingChecklist,
      photoStatus: photos.length > 0 ? `✅ ${photos.length} Photo(s) Attached` : '⚠️ Photos Missing (Upload or Email Required)',
      nextAction: readinessStatus === 'ready_for_review' 
        ? 'Staged in review queue for operations review' 
        : `Collect ${missingChecklist.length} missing input(s) from broker`,
      conflicts: fieldConflicts
    };

    return {
      policyVersion: NORA_POLICY_VERSION,
      knowledgeVersion: NORA_KNOWLEDGE_VERSION,
      channel,
      workspaceId,
      requester,
      caller: callerObj,
      onBehalfOf: onBehalfOf || undefined,
      propertyAddress,
      isAddressConfirmed,
      isPlaceholderAddress: isPlaceholder,
      normalizedPropertyKey,
      telephonyCallId: (trustedContext as any)?.telephonyCallId || (rawInput as any)?.telephonyCallId || (rawInput as any)?.callId,
      flexMlsStatus,
      mlsNumber: rawInput.mlsNumber,
      intakeType,
      extractedFields: {
        price,
        squareFeet: squareFootage,
        bedrooms,
        bathrooms,
        description: propertyDescription,
        deliverables,
        neededByDate,
        isDeadlineFlexible,
        photosCount: photos.length,
        photos: photos.map(p => ({ url: p.url, name: p.name, hash: p.hash }))
      },
      fieldProvenance,
      fieldConflicts,
      mlsLookupAttempted,
      mlsLookupSuccess,
      mlsListingData,
      mlsLookupMessage,
      readinessStatus,
      missingFields,
      existingOpenRequest,
      hasExistingOpenTask,
      voiceResponse: {
        spokenPrompt,
        nextQuestion,
        photoInstructions
      },
      emailResponse: {
        subject: emailSubject,
        bodyMarkdown: emailBodyMarkdown,
        missingChecklist,
        isClarificationNeeded
      },
      webResponse
    };
  }

  /**
   * Atomic Persistence & Reconciliation
   * Creates or updates a canonical request and task containers safely.
   */
  public async persistIntakeEvaluation(evalResult: MarketingIntakeEvaluationResult): Promise<{
    request: CanonicalMarketingRequest;
    tasks: CanonicalMarketingTask[];
    isMerged: boolean;
  }> {
    const allRequests = getAllCanonicalMarketingRequests();
    const allTasks = getAllCanonicalMarketingTasks();

    let targetRequest: CanonicalMarketingRequest;
    let isMerged = false;

    // 1. Check if we should merge into an existing open request for the confirmed address
    if (evalResult.normalizedPropertyKey && evalResult.existingOpenRequest) {
      targetRequest = evalResult.existingOpenRequest;
      isMerged = true;
      targetRequest.notes = `${targetRequest.notes || ''}\n\n[Reconciled Intake Update via ${evalResult.channel.toUpperCase()} from ${evalResult.requester.name}]: Updated marketing specs.`;
      targetRequest.updatedAt = new Date().toISOString();
      if (evalResult.extractedFields.photos.length > 0) {
        const existingUrls = new Set((targetRequest.photos || []).map(p => p.url));
        const newPhotos = evalResult.extractedFields.photos
          .filter(p => !existingUrls.has(p.url))
          .map((p, idx) => ({ id: `p_${Date.now()}_${idx}`, url: p.url, name: p.name }));
        targetRequest.photos = [...(targetRequest.photos || []), ...newPhotos];
      }
    } else {
      // 2. Create new canonical request
      const reqId = `req_${evalResult.channel}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      targetRequest = {
        id: reqId,
        workspaceId: evalResult.workspaceId,
        title: evalResult.isPlaceholderAddress 
          ? `[Address Needed] Marketing Intake (${evalResult.requester.name})` 
          : `${evalResult.propertyAddress} • Marketing Package`,
        propertyAddress: evalResult.propertyAddress || 'Address Pending',
        agentName: evalResult.requester.name,
        agentEmail: evalResult.requester.email,
        agentPhone: evalResult.requester.phone,
        createdByName: evalResult.caller?.name || evalResult.requester.name,
        onBehalfOf: evalResult.onBehalfOf || undefined,
        channel: evalResult.channel === 'phone' ? 'phone' : evalResult.channel === 'email' ? 'email' : 'web',
        status: evalResult.readinessStatus === 'ready_for_review' ? 'ready_for_review' : 'needs_info',
        taskIds: [],
        photos: evalResult.extractedFields.photos.map((p, idx) => ({
          id: `p_${Date.now()}_${idx}`,
          url: p.url,
          name: p.name
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    (targetRequest as any).normalizedPropertyKey = evalResult.normalizedPropertyKey || null;
    if (evalResult.telephonyCallId) {
      (targetRequest as any).telephonyCallId = evalResult.telephonyCallId;
    }
    (targetRequest as any).fieldConflicts = evalResult.fieldConflicts;
    (targetRequest as any).fieldProvenance = evalResult.fieldProvenance;
    (targetRequest as any).readinessStatus = evalResult.readinessStatus;
    (targetRequest as any).missingFields = evalResult.missingFields;
    (targetRequest as any).price = evalResult.extractedFields.price;
    (targetRequest as any).squareFootage = evalResult.extractedFields.squareFeet;
    (targetRequest as any).bedrooms = evalResult.extractedFields.bedrooms;
    (targetRequest as any).bathrooms = evalResult.extractedFields.bathrooms;
    (targetRequest as any).propertyDescription = evalResult.extractedFields.description;
    (targetRequest as any).createdByName = evalResult.caller?.name || evalResult.requester.name;
    (targetRequest as any).onBehalfOf = evalResult.onBehalfOf || null;
    targetRequest.status = evalResult.readinessStatus === 'ready_for_review' ? 'ready_for_review' : 'needs_info';

    // Create-at-intake: one AskNora Drive folder named by address. Fail closed — no stub URL.
    try {
      const promoted = await promoteAskNoraListingFolder({
        propertyAddress: targetRequest.propertyAddress,
        agentName: targetRequest.agentName,
        agentEmail: targetRequest.agentEmail,
        workspaceId: targetRequest.workspaceId,
        existingFolderUrl: targetRequest.driveFolderUrl,
      });
      const nextFolder = coalesceRealDriveUrl(promoted.driveFolderUrl, targetRequest.driveFolderUrl);
      targetRequest.driveFolderUrl = nextFolder;
      if (nextFolder) {
        for (const sibling of allTasks) {
          if (sibling.requestId === targetRequest.id && !isRealGoogleDriveUrl(sibling.driveFolderUrl)) {
            sibling.driveFolderUrl = nextFolder;
            sibling.updatedAt = new Date().toISOString();
            saveCanonicalMarketingTask(sibling);
          }
        }
      }
    } catch (driveErr: any) {
      console.warn('[Intake] AskNora Drive folder deferred:', driveErr?.message || driveErr);
      if (!isRealGoogleDriveUrl(targetRequest.driveFolderUrl)) targetRequest.driveFolderUrl = '';
    }

    saveCanonicalMarketingRequest(targetRequest);

    // 3. Create or update tasks via Canonical Routing Authority
    const tasks: CanonicalMarketingTask[] = [];
    // Only block tasks if unmatched caller has no verified represented agent
    const isBlockedByAuthorization = Boolean(
      evalResult.missingFields && 
      evalResult.missingFields.includes('broker_authorization_verification') &&
      !evalResult.onBehalfOf
    );
    const deliverablesList = (evalResult.extractedFields.deliverables && evalResult.extractedFields.deliverables.length > 0 && !isBlockedByAuthorization)
      ? evalResult.extractedFields.deliverables
      : [];
    
    for (const [idx, delivTitle] of deliverablesList.entries()) {
      const taskId = `tsk_${targetRequest.id}_${idx}`;
        
        // Canonical Server-Side Routing Resolver
        const routingDecision = await canonicalTaskRoutingService.resolveRouting({
          workspaceId: evalResult.workspaceId,
          category: evalResult.intakeType === 'signage_only' ? 'signage' : undefined,
          deliverableType: delivTitle,
          title: delivTitle,
          channel: (['web', 'phone', 'email', 'manual', 'mms'].includes(evalResult.channel) ? evalResult.channel : 'web') as any,
          requesterName: targetRequest.agentName,
          propertyAddress: targetRequest.propertyAddress,
          classificationConfidence: evalResult.isAddressConfirmed ? 0.95 : 0.65,
          taskId,
          requestId: targetRequest.id
        });

        const isTriage = routingDecision.routingState !== 'resolved';

        const task: CanonicalMarketingTask = {
          id: taskId,
          requestId: targetRequest.id,
          workspaceId: evalResult.workspaceId,
          requestTitle: targetRequest.title,
          propertyAddress: targetRequest.propertyAddress,
          agentName: targetRequest.agentName,
          title: delivTitle,
          category: routingDecision.departmentId || 'marketing_collateral',
          assignedTo: isTriage ? undefined : routingDecision.assigneeName,
          assignedToId: isTriage ? undefined : routingDecision.assigneeStaffId,
          assignedToRole: isTriage ? 'Unassigned Review Queue' : (routingDecision.assigneeRole || 'Marketing Specialist'),
          reviewOwner: routingDecision.reviewOwnerName,
          reviewOwnerId: routingDecision.reviewOwnerStaffId,
          reviewOwnerName: routingDecision.reviewOwnerName,
          coveringStaff: routingDecision.coveringStaffName,
          coveringStaffId: routingDecision.coveringStaffId,
          coveringStaffName: routingDecision.coveringStaffName,
          originalStaffId: routingDecision.originalStaffId,
          governingSopId: routingDecision.governingSopId,
          governingSopVersion: routingDecision.governingSopVersion,
          routingRuleId: routingDecision.matchedRuleId,
          routingPolicyVersion: routingDecision.ruleVersion,
          departmentId: routingDecision.departmentId,
          primaryRoleId: routingDecision.primaryRoleId,
          reviewRoleId: routingDecision.reviewRoleId,
          assigneeStaffId: routingDecision.assigneeStaffId,
          routingState: routingDecision.routingState,
          routingReasons: routingDecision.reasonCodes,
          routingSnapshot: routingDecision.snapshot,
          status: isTriage ? 'needs_info' : (evalResult.readinessStatus === 'ready_for_review' ? 'ready_for_review' : 'needs_info'),
          dueAt: evalResult.extractedFields.neededByDate,
          driveFolderUrl: targetRequest.driveFolderUrl || '',
          notes: `${evalResult.onBehalfOf && !evalResult.caller?.isVerified ? `[Submitted by ${evalResult.caller?.name || 'Caller'} on behalf of ${evalResult.onBehalfOf}${evalResult.caller?.phone ? ` (${evalResult.caller.phone})` : ''}]\n` : ''}Policy Version: ${evalResult.policyVersion}${isTriage ? ` • Triage: ${routingDecision.triageReason}` : ''}`,
          isArchived: false,
          approvalHistory: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        saveCanonicalMarketingTask(task);
        tasks.push(task);
        if (!targetRequest.taskIds.includes(taskId)) {
          targetRequest.taskIds.push(taskId);
        }

        // Record audit activity event
        await canonicalTaskRoutingService.recordRoutingAudit(
          evalResult.workspaceId,
          { taskId, requestId: targetRequest.id },
          routingDecision,
          'web'
        );
      }
      saveCanonicalMarketingRequest(targetRequest);

    return { request: targetRequest, tasks, isMerged };
  }
}

// Export singleton instance
export const noraMarketingIntakeOrchestrator = new NoraMarketingIntakeOrchestrator();
