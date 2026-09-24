/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { getAllStaffMembers, resolveStaffMember } from './operationsDirectoryRepository.js';
import { canonicalTaskRoutingService } from '../services/canonicalTaskRoutingService.js';
import { OfficeSupplyDeduplicationService } from '../services/officeSupplyDeduplicationService.js';
import { tombstoneIntakeScope, removeTombstone } from './intakeTombstoneRepository.js';
import { isInlineDataProof, scrubInlineProof } from '../../src/lib/proofPrecedence.js';

const isProduction = () => typeof process !== 'undefined' && (process.env?.NODE_ENV === 'production' || process.env?.APP_ENV === 'production') && process.env?.ALLOW_FILE_STORAGE_UAT !== 'true';

export interface SourcePhoto {
  id: string;
  url: string;
  caption: string;
  category: 'hero' | 'pool' | 'kitchen' | 'aerial' | 'interior' | 'exterior';
  sourceProvenance: string;
  metadataSource: 'uploaded_file_metadata' | 'user_entered' | 'external_provider' | 'fixture';
  photographerName?: string;
  photographerLicense?: string;
  sha256?: string;
  byteSize?: number;
  width?: number;
  height?: number;
}

export interface ListingSnapshot {
  propertyAddress: string;
  city: string;
  state: string;
  postalCode: string;
  listingPrice: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  acreage: number;
  propertyType: string;
  yearBuilt: number;
  listingStatus: string;
  targetListDate: string;
  openHouseDates: string[];
  headline: string;
  publicRemarks: string;
  keyFeatures: string[];
  listingAgentId: string;
  listingAgentName: string;
  listingAgentEmail: string;
  listingAgentPhone: string;
  brokerInChargeName: string;
  approvedSourcePhotos: SourcePhoto[];
  source: 'manual' | 'crm' | 'mls' | 'inbound_request' | 'import';
  sourceUpdatedAt: string;
}

export interface BrandKit {
  id: string;
  brokerageName: string;
  officeName: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  darkCharcoal: string;
  approvedFonts: string[];
  logoUrl: string;
  fairHousingLogoUrl: string;
  officeAddress: string;
  officePhone: string;
  website: string;
  agentAttributionRules: string;
  disclaimerText: string;
  version?: string;
  logoAssets?: {
    primaryLogoId: string;
    primaryLogoUrl: string;
  };
  typography?: {
    displayFont: string;
    bodyFont: string;
    fallbackFonts: string[];
  };
}

export interface CompliancePolicySet {
  id: string;
  workspaceId: string;
  officeId?: string;
  stateCode?: string;
  name: string;
  version: string;
  requiredFields: string[];
  requiredDisclosures: string[];
  prohibitedClaims: string[];
  imageRules: string[];
  channelRules: string[];
  requiresBrokerReview: boolean;
  effectiveAt: string;
}

export interface CampaignBrief {
  id?: string;
  workspaceId?: string;
  campaignId?: string;
  requestId?: string;
  campaignRevision?: number;
  objective: string;
  targetAudience: string | string[];
  tone: string;
  positioning: string;
  keySellingPoints: string[];
  requiredDisclosures: string[];
  callToAction: string;
  openHouseDetails?: string;
  selectedAssetFormats: string[];
  dueTargetDate?: string;
  reviewOwner?: string;
  specialInstructions?: string[];
  approvedClaims?: Array<{ id: string; claim: string; source: string; approved: boolean }>;
  pendingClaims?: Array<{ id: string; claim: string; source: string; approved: boolean }>;
}

export interface MarketingAsset {
  id: string;
  assetType: 'flyer' | 'carousel' | 'postcard' | 'sign_rider' | 'landing_page_draft' | 'story_reel_storyboard' | 'floorplan' | 'cma' | 'social' | 'email';
  templateId: string;
  templateVersion: string;
  headline: string;
  subhead: string;
  bodyCopy: string;
  captions: Record<string, string>;
  selectedSourcePhotoIds: string[];
  status: string;
  complianceStatus: 'pending' | 'passed' | 'warnings_found';
  complianceIssues: string[];
  updatedAt: string;
}

export interface MarketingDeliveryReceipt {
  id: string;
  campaignId: string;
  campaignVersionId: string;
  destination: 'download' | 'google_drive' | 'rechat' | 'flexmls' | 'email' | 'print_vendor';
  status: 'prepared' | 'attempted' | 'succeeded' | 'failed' | 'not_connected';
  externalId?: string;
  externalUrl?: string;
  responseCode?: string;
  deliveredAt?: string;
  initiatedBy: string;
  error?: string;
}

export interface ListingMarketingCampaign {
  id: string;
  workspaceId?: string;
  propertyAddress: string;
  listingAgentId?: string;
  marketingOwnerId?: string;
  status?: string;
  statusKey?: string;
  version?: number;
  assignedTo?: string;
  deliveryStatus?: string;
  packageType?: string;
  slaTarget?: string;
  proofUrl?: string;
  proofPackage?: any;
  generatedDeliverables?: any[];
  needsAttention?: boolean;
  listingSnapshot?: any;
  brandKit?: any;
  compliancePolicySet?: CompliancePolicySet;
  campaignBrief?: any;
  request?: any;
  callId?: string;
  beds?: any;
  baths?: any;
  sqft?: any;
  audioUrl?: string;
  originalCommunication?: any;
  followUpRequests?: any[];
  assets?: Record<string, MarketingAsset>;
  readinessCheck?: {
    propertyDetailsComplete: boolean;
    approvedPhotosCount: number;
    listingAgentAssigned: boolean;
    brandKitValid: boolean;
    disclosuresApproved: boolean;
    isReadyForGeneration: boolean;
    missingFields: string[];
  };
  approvals?: Array<{
    id: string;
    reviewerName: string;
    role: string;
    status: 'pending' | 'approved' | 'changes_requested';
    comments?: string;
    timestamp: string;
  }>;
  approvalReceipt?: any;
  approvalReceipts?: any[];
  deliveryReceipts?: MarketingDeliveryReceipt[];
  auditTrail?: Array<{
    id: string;
    action: string;
    performedBy: string;
    timestamp: string;
    details: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// In-Memory & File Persisted Store for Marketing Campaigns
let campaignsStore: ListingMarketingCampaign[] = [];

// Seed Default Primary Campaign (990 Inspiration Drive - Request C)
export function getInitialDefaultCampaign(): ListingMarketingCampaign {
  const defaultPhotos: SourcePhoto[] = [
    {
      id: 'photo_hero',
      url: '/api/marketing/campaigns/campaign_990_inspiration/assets/photo_hero/raw',
      caption: 'Primary Facade & Landscaped Driveway',
      category: 'hero',
      sourceProvenance: 'Physical Photo #1: luxury_home_990_inspiration_1785434122508.jpg (Fixture)',
      metadataSource: 'fixture',
      photographerName: 'Alex Carter',
      photographerLicense: 'FAA License #FA-394201',
      byteSize: 1025857,
      width: 1920,
      height: 1280,
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    {
      id: 'photo_pool',
      url: '/api/marketing/campaigns/campaign_990_inspiration/assets/photo_pool/raw',
      caption: 'Heated Saltwater Pool & Outdoor Deck Oasis',
      category: 'pool',
      sourceProvenance: 'Physical Photo #2: luxury_home_212_wetland_1785433917769.jpg (Fixture)',
      metadataSource: 'fixture',
      photographerName: 'Alex Carter',
      photographerLicense: 'FAA License #FA-394201',
      byteSize: 1021618,
      width: 1920,
      height: 1280,
      sha256: 'f4d0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b866'
    }
  ];

  const defaultSnapshot: ListingSnapshot = {
    propertyAddress: '990 Inspiration Drive',
    city: 'Wilmington',
    state: 'NC',
    postalCode: '28405',
    listingPrice: 1250000,
    bedrooms: 4,
    bathrooms: 4.5,
    squareFeet: 4200,
    acreage: 0.84,
    propertyType: 'Single Family Residence',
    yearBuilt: 2022,
    listingStatus: 'Active',
    targetListDate: '2026-08-01',
    openHouseDates: ['Sunday 2:00 PM - 4:00 PM'],
    headline: 'LUXURY COASTAL ESTATE IN MAYFAIRE',
    publicRemarks: 'Breathtaking 4 bed, 4.5 bath luxury residence featuring a private heated saltwater pool, gourmet quartzite kitchen with Thermador appliances, and an expansive 0.84-acre parcel near Mayfaire.',
    keyFeatures: [
      '4 Bedrooms & 4.5 Designer Bathrooms (4,200 SqFt)',
      'Private Heated Saltwater Pool with Sun Shelf Deck',
      'Gourmet Quartzite Kitchen with Thermador Suite',
      '0.84-Acre Private Landscaped Parcel'
    ],
    listingAgentId: 'agent_ryan_crecelius',
    listingAgentName: 'Ryan Crecelius',
    listingAgentEmail: 'ryan@nestrealty.com',
    listingAgentPhone: '(910) 232-1772',
    brokerInChargeName: 'Ryan Crecelius (BIC)',
    approvedSourcePhotos: defaultPhotos,
    source: 'crm',
    sourceUpdatedAt: new Date().toISOString()
  };

  const defaultBrandKit: BrandKit = {
    id: 'brand_nest_wilmington_v2',
    brokerageName: 'Nest Realty Wilmington',
    officeName: 'Wilmington Main Office',
    version: '2.1.0',
    primaryColor: '#00635C',
    secondaryColor: '#D0D6BB',
    backgroundColor: '#FFFFFF',
    darkCharcoal: '#0F172A',
    approvedFonts: ['Inter', 'Outfit', 'Playfair Display'],
    logoUrl: '/nest-realty-logo.png',
    fairHousingLogoUrl: '/nest_n_green.png',
    logoAssets: {
      primaryLogoId: 'logo_nest_primary_v2',
      primaryLogoUrl: '/nest-realty-logo.png'
    },
    typography: {
      displayFont: 'Playfair Display',
      bodyFont: 'Inter',
      fallbackFonts: ['sans-serif']
    },
    officeAddress: '1055 Military Cutoff Rd, Wilmington NC 28405',
    officePhone: '(910) 392-4100',
    website: 'https://nestrealty.com/wilmington',
    agentAttributionRules: 'Listing Agent attribution required on all print & digital collateral per NCREC rules.',
    disclaimerText: 'Equal Housing Opportunity. All information deemed reliable but not guaranteed. Each Nest Realty office is independently owned and operated.'
  };

  const defaultCompliance: CompliancePolicySet = {
    id: 'policy_ncrec_2026_v1',
    workspaceId: 'nest-realty-demo',
    stateCode: 'NC',
    name: 'North Carolina Real Estate Commission Compliance Rules',
    version: '2026.1',
    requiredFields: ['listingAgentName', 'brokerageName', 'equalHousingLogo'],
    requiredDisclosures: ['NCREC License Attribution', 'Equal Housing Opportunity Statement'],
    prohibitedClaims: ['Unverified Waterfront Claims', 'Guarantee of Value Increase'],
    imageRules: ['Approved Licensed Photography Only'],
    channelRules: ['Print collateral must feature physical office address'],
    requiresBrokerReview: true,
    effectiveAt: '2026-01-01T00:00:00Z'
  };

  const defaultBrief: CampaignBrief = {
    id: 'brief_990_inspiration',
    workspaceId: 'nest-realty-demo',
    campaignId: 'campaign_990_inspiration',
    requestId: 'req_990_inspiration_manual',
    campaignRevision: 1,
    objective: 'High-impact launch campaign for luxury Mayfaire estate',
    targetAudience: ['Move-up buyers', 'coastal luxury seekers', 'relocations'],
    tone: 'Sophisticated, coastal luxury, authentic & architectural',
    positioning: 'Premier 0.84-acre resort home with saltwater pool & chef kitchen',
    keySellingPoints: [
      '4 Beds, 4.5 Baths, 4,200 SqFt',
      'Heated Saltwater Pool & Outdoor Deck',
      'Chef Kitchen with Quartzite Island',
      'Minutes to Wrightsville Beach & Mayfaire'
    ],
    requiredDisclosures: [
      'NCREC License #C2519 Broker Attribution',
      'Equal Housing Opportunity Mark',
      'Nest Realty Wilmington Office Identity'
    ],
    callToAction: 'Schedule Private Briefing: Call Ryan Crecelius (910) 232-1772',
    openHouseDetails: 'Open House Sunday 2:00 PM - 4:00 PM',
    selectedAssetFormats: ['flyer', 'carousel', 'postcard', 'sign_rider', 'email'],
    dueTargetDate: '2026-08-03',
    reviewOwner: 'Ryan Crecelius (BIC)',
    specialInstructions: ['Include high-resolution drone photo of rear acreage'],
    approvedClaims: [
      { id: 'claim_1', claim: '0.84-Acre Private Parcel', source: 'listing_snapshot', approved: true },
      { id: 'claim_2', claim: 'Heated Saltwater Pool', source: 'listing_snapshot', approved: true }
    ],
    pendingClaims: []
  };

  const request: any = {
    id: 'req_990_inspiration_manual',
    workspaceId: 'nest-realty-demo',
    channel: 'manual',
    status: 'converted_to_campaign',
    receivedAt: '2026-08-01T16:17:00Z',
    urgency: 'standard',
    capturedByAgentId: 'agent_ann_smith',
    capturedByAgentName: 'Ann Smith',
    capturedByAgentType: 'manual_operator',
    requestedByPersonId: 'person_ryan_crecelius',
    requestedByName: 'Ryan Crecelius',
    requestedByRole: 'Broker in Charge',
    onBehalfOfPersonId: 'person_ryan_crecelius',
    onBehalfOfName: 'Ryan Crecelius',
    onBehalfOfRole: 'Broker in Charge',
    propertyId: 'prop_990_inspiration',
    listingSnapshotId: 'snap_990_v1',
    originalRequestText: 'Demo Request: Prepare flagship luxury marketing package for 990 Inspiration Drive including flyer, 5-slide carousel, postcard, sign rider, and email.',
    aiSummary: 'Flagship luxury marketing package request for 990 Inspiration Drive ($1,250,000). All 5 collateral materials fully rendered and approved by Ryan Crecelius.',
    requestedMaterialTypes: ['flyer', 'carousel', 'postcard', 'sign_rider', 'email'],
    specialInstructions: ['Apply Nest Wilmington luxury editorial palette.'],
    missingInformation: [],
    campaignId: 'campaign_990_inspiration',
    createdAt: '2026-08-01T16:17:00Z',
    updatedAt: '2026-08-01T16:20:00Z'
  };

  const originalCommunication: any = {
    id: 'comm_manual_990',
    requestId: 'req_990_inspiration_manual',
    type: 'manual_intake',
    subject: 'Manual Operations Intake - 990 Inspiration Drive',
    from: 'ann.smith@nestrealty.com',
    to: 'Shapework Marketing System',
    timestamp: '2026-08-01T16:17:00Z',
    rawText: 'Manual Intake Notes by Ann Smith:\nInitiated high-priority luxury launch package for 990 Inspiration Drive per BIC request (Ryan Crecelius). Brand kit: Nest Wilmington Main. Approved photos uploaded from FAA licensed shoot.'
  };

  return {
    id: 'campaign_990_inspiration',
    workspaceId: 'nest-realty-demo',
    propertyAddress: '990 Inspiration Drive, Wilmington, NC 28405',
    listingAgentId: 'agent_ryan_crecelius',
    marketingOwnerId: 'marketing_melissa',
    status: 'approved',
    request,
    originalCommunication,
    followUpRequests: [],
    approvalReceipt: {
      approvalId: 'rcpt_990_inspiration',
      workspaceId: 'nest-realty-demo',
      campaignId: 'campaign_990_inspiration',
      campaignRevision: 1,
      assetId: 'flyer',
      assetVersion: 1,
      reviewerUserId: 'Ryan Crecelius',
      reviewedAt: '2026-08-01T17:00:00Z',
      brandKitVersion: '2.1.0',
      compliancePolicyVersion: '2026.1'
    },
    approvalReceipts: [
      {
        approvalId: 'rcpt_990_inspiration_flyer',
        workspaceId: 'nest-realty-demo',
        campaignId: 'campaign_990_inspiration',
        campaignRevision: 1,
        assetId: 'flyer',
        assetVersion: 1,
        artifactChecksum: 'sha256_flyer_990_inspiration',
        previewChecksum: 'sha256_preview_flyer',
        reviewerUserId: 'Ryan Crecelius',
        reviewerName: 'Ryan Crecelius (BIC)',
        reviewedAt: '2026-08-01T17:00:00Z',
        brandKitVersion: '2.1.0',
        compliancePolicyVersion: '2026.1'
      },
      {
        approvalId: 'rcpt_990_inspiration_carousel',
        workspaceId: 'nest-realty-demo',
        campaignId: 'campaign_990_inspiration',
        campaignRevision: 1,
        assetId: 'carousel',
        assetVersion: 1,
        artifactChecksum: 'sha256_carousel_990',
        previewChecksum: 'sha256_preview_carousel',
        reviewerUserId: 'Ryan Crecelius',
        reviewerName: 'Ryan Crecelius (BIC)',
        reviewedAt: '2026-08-01T17:05:00Z',
        brandKitVersion: '2.1.0',
        compliancePolicyVersion: '2026.1'
      }
    ],
    listingSnapshot: defaultSnapshot,
    brandKit: defaultBrandKit,
    compliancePolicySet: defaultCompliance,
    campaignBrief: defaultBrief,
    assets: {
      flyer: {
        id: 'asset_flyer_01',
        assetType: 'flyer',
        templateId: 'tmpl_flyer_coastal_emerald_v1',
        templateVersion: '1.0.0',
        headline: 'LUXURY COASTAL ESTATE IN MAYFAIRE',
        subhead: 'Breathtaking 4 Bed, 4.5 Bath residence featuring heated pool & chef kitchen',
        bodyCopy: 'Welcome to 990 Inspiration Drive. This 4,200 SqFt residence offers 4 beds, 4.5 baths, private heated saltwater pool, quartzite chef kitchen, and 0.84 acres near Mayfaire.',
        captions: {},
        selectedSourcePhotoIds: ['photo_hero', 'photo_pool'],
        status: 'approved',
        complianceStatus: 'passed',
        complianceIssues: [],
        updatedAt: new Date().toISOString()
      },
      carousel: {
        id: 'asset_carousel_01',
        assetType: 'carousel',
        templateId: 'tmpl_carousel_5slide_v1',
        templateVersion: '1.0.0',
        headline: 'SLIDE CAROUSEL: 990 INSPIRATION DR',
        subhead: '5-Slide Social Media Luxury Presentation',
        bodyCopy: 'Slide 1: Just Listed • Slide 2: Heated Pool • Slide 3: Chef Kitchen • Slide 4: 0.84-Acre Lot • Slide 5: Open House',
        captions: {
          '1_instagram': '✨ JUST LISTED IN WILMINGTON! 990 Inspiration Drive ($1,250,000).'
        },
        selectedSourcePhotoIds: ['photo_hero', 'photo_pool'],
        status: 'approved',
        complianceStatus: 'passed',
        complianceIssues: [],
        updatedAt: new Date().toISOString()
      }
    },
    readinessCheck: {
      propertyDetailsComplete: true,
      approvedPhotosCount: 2,
      listingAgentAssigned: true,
      brandKitValid: true,
      disclosuresApproved: true,
      isReadyForGeneration: true,
      missingFields: []
    },
    approvals: [
      {
        id: 'appr_001',
        reviewerName: 'Ryan Crecelius',
        role: 'Broker in Charge',
        status: 'approved',
        comments: 'Verified collateral package and approved for distribution.',
        timestamp: new Date().toISOString()
      }
    ],
    auditTrail: [
      {
        id: 'audit_001',
        action: 'CAMPAIGN_CREATED',
        performedBy: 'Ann Smith (Manual Intake)',
        timestamp: '2026-08-01T16:17:00Z',
        details: 'Created marketing campaign brief from manual intake request.'
      },
      {
        id: 'audit_002',
        action: 'COMPLIANCE_AUDITED',
        performedBy: 'Shapework Compliance Engine v2026.1',
        timestamp: '2026-08-01T16:25:00Z',
        details: 'Verified NCREC attribution & Equal Housing Opportunity compliance.'
      },
      {
        id: 'audit_003',
        action: 'PACKAGE_APPROVED',
        performedBy: 'Ryan Crecelius (BIC)',
        timestamp: '2026-08-01T17:00:00Z',
        details: 'Approved collateral package for distribution.'
      }
    ],
    createdAt: '2026-08-01T16:17:00Z',
    updatedAt: new Date().toISOString()
  };
}

// Seed Request A Campaign (304 Ocean Blvd)
export function getCampaignOcean304(): ListingMarketingCampaign {
  const photos: SourcePhoto[] = [
    {
      id: 'photo_ocean_hero',
      url: '/api/marketing/campaigns/campaign_304_ocean/assets/photo_hero/raw',
      caption: 'Direct Oceanfront Views & Private Boardwalk',
      category: 'hero',
      sourceProvenance: 'Physical Photo: ocean_blvd_304.jpg',
      metadataSource: 'fixture',
      photographerName: 'Sarah Miller',
      photographerLicense: 'FAA License #FA-982104',
      byteSize: 1200450,
      width: 1920,
      height: 1280,
      sha256: 'a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef'
    }
  ];

  const request: any = {
    id: 'req_304_ocean_phone',
    workspaceId: 'nest-realty-demo',
    channel: 'phone',
    status: 'needs_information',
    receivedAt: '2026-08-02T09:14:00Z',
    urgency: 'urgent',
    capturedByAgentId: 'agent_ava_phone',
    capturedByAgentName: 'Ava',
    capturedByAgentType: 'phone_agent',
    requestedByPersonId: 'person_eric_thompson',
    requestedByName: 'Eric',
    requestedByRole: 'Listing Agent',
    onBehalfOfPersonId: 'person_eric_thompson',
    onBehalfOfName: 'Eric Thompson',
    onBehalfOfRole: 'Listing Agent',
    propertyId: 'prop_304_ocean',
    listingSnapshotId: 'snap_304_v1',
    originalRequestText: 'Can you put together a new-listing package for 304 Ocean Boulevard? We need the flyer, social posts, postcard, sign rider, and email. The open house is Sunday, but I still need to confirm the time.',
    aiSummary: 'New listing marketing request for 304 Ocean Blvd (Flyer, Social, Postcard, Sign Rider, Email). Open-house start and end time unconfirmed.',
    requestedMaterialTypes: ['flyer', 'social', 'postcard', 'sign_rider', 'email'],
    specialInstructions: ['High-resolution oceanfront boardwalk photo must be highlighted on postcard front.'],
    missingInformation: [
      {
        id: 'info_open_house_time',
        field: 'open_house_time',
        label: 'Open-House Hours',
        prompt: 'Specify the confirmed start and end times for Sunday\'s open house.',
        reason: 'Required for open-house sign rider, social slide 3, and email announcement.',
        affectedMaterialTypes: ['sign_rider', 'social', 'email'],
        unaffectedMaterialTypes: ['flyer', 'postcard'],
        status: 'pending'
      }
    ],
    campaignId: 'campaign_304_ocean',
    createdAt: '2026-08-02T09:14:00Z',
    updatedAt: '2026-08-02T09:14:00Z'
  };

  const originalCommunication: any = {
    id: 'comm_phone_304',
    requestId: 'req_304_ocean_phone',
    type: 'phone_transcript',
    subject: 'Inbound Phone Call from Eric Thompson',
    from: '+1 (910) 555-0199',
    to: '+1 (800) 555-NEST (Ava AI Agent)',
    timestamp: '2026-08-02T09:14:00Z',
    rawText: `Ava: Hello Eric, thank you for calling Shapework Marketing. How can I help with your listings today?

Eric: Hey Ava! Can you put together a new-listing package for 304 Ocean Boulevard? We need the flyer, social posts, postcard, sign rider, and email. The open house is Sunday, but I still need to confirm the time.

Ava: Got it! I am setting up the 5-part marketing package for 304 Ocean Blvd. I have noted that the open house is on Sunday, August 9, and I will flag the start and end times as missing information. You can provide those hours in the dashboard whenever you are ready.

Eric: Perfect, thanks Ava!`
  };

  return {
    id: 'campaign_304_ocean',
    workspaceId: 'nest-realty-demo',
    propertyAddress: '304 Ocean Blvd, Wrightsville Beach, NC 28480',
    listingAgentId: 'agent_eric',
    marketingOwnerId: 'marketing_melissa',
    status: 'needs_information',
    request,
    originalCommunication,
    followUpRequests: [],
    listingSnapshot: {
      propertyAddress: '304 Ocean Blvd',
      city: 'Wrightsville Beach',
      state: 'NC',
      postalCode: '28480',
      listingPrice: 2850000,
      bedrooms: 5,
      bathrooms: 5.5,
      squareFeet: 5100,
      acreage: 0.45,
      propertyType: 'Oceanfront Single Family',
      yearBuilt: 2024,
      listingStatus: 'Draft',
      targetListDate: '2026-08-10',
      openHouseDates: [],
      headline: 'OCEANFRONT COASTAL VILLA IN WRIGHTSVILLE BEACH',
      publicRemarks: 'Spectacular 5 bed, 5.5 bath luxury oceanfront estate featuring panoramic Atlantic views, private dunes boardwalk, elevator, and dual master suites.',
      keyFeatures: [
        '5 Bedrooms & 5.5 Luxury Bathrooms (5,100 SqFt)',
        'Direct Private Boardwalk to Dunes & Beach',
        'Commercial Grade Elevator & 3-Car Garage',
        'Dual Oceanfront Master Suites'
      ],
      listingAgentId: 'agent_eric',
      listingAgentName: 'Eric',
      listingAgentEmail: 'eric@nestrealty.com',
      listingAgentPhone: '(910) 555-0199',
      brokerInChargeName: 'Eric (BIC)',
      approvedSourcePhotos: photos,
      source: 'crm',
      sourceUpdatedAt: new Date().toISOString()
    },
    brandKit: {
      id: 'brand_nest_wilmington_v2',
      brokerageName: 'Nest Realty Wilmington',
      officeName: 'Wrightsville Beach Branch',
      version: '2.1.0',
      primaryColor: '#00635C',
      secondaryColor: '#D0D6BB',
      backgroundColor: '#FFFFFF',
      darkCharcoal: '#0F172A',
      approvedFonts: ['Inter', 'Outfit'],
      logoUrl: '/nest-realty-logo.png',
      fairHousingLogoUrl: '/nest_n_green.png',
      logoAssets: {
        primaryLogoId: 'logo_nest_primary_v2',
        primaryLogoUrl: '/nest-realty-logo.png'
      },
      typography: {
        displayFont: 'Outfit',
        bodyFont: 'Inter',
        fallbackFonts: ['sans-serif']
      },
      officeAddress: '1055 Military Cutoff Rd, Wilmington NC 28405',
      officePhone: '(910) 392-4100',
      website: 'https://nestrealty.com/wrightsville',
      agentAttributionRules: 'Listing Agent attribution required.',
      disclaimerText: 'Equal Housing Opportunity.'
    },
    compliancePolicySet: {
      id: 'policy_ncrec_2026_v1',
      workspaceId: 'nest-realty-demo',
      stateCode: 'NC',
      name: 'North Carolina Real Estate Commission Compliance Rules',
      version: '2026.1',
      requiredFields: ['listingAgentName', 'brokerageName', 'equalHousingLogo'],
      requiredDisclosures: ['NCREC License Attribution', 'Equal Housing Opportunity Statement'],
      prohibitedClaims: ['Unverified Waterfront Claims'],
      imageRules: ['Approved Photography Only'],
      channelRules: [],
      requiresBrokerReview: true,
      effectiveAt: '2026-01-01T00:00:00Z'
    },
    campaignBrief: {
      id: 'brief_304_ocean',
      workspaceId: 'nest-realty-demo',
      campaignId: 'campaign_304_ocean',
      requestId: 'req_304_ocean_phone',
      campaignRevision: 1,
      objective: 'Premier launch for Wrightsville oceanfront trophy property',
      targetAudience: ['High-net-worth buyers', 'coastal luxury investors'],
      tone: 'Refined, coastal luxury, exclusive',
      positioning: 'Rare direct oceanfront estate with dune boardwalk',
      keySellingPoints: ['5 Bed 5.5 Bath', 'Oceanfront Boardwalk', 'Elevator & Pool'],
      requiredDisclosures: ['Equal Housing Opportunity'],
      callToAction: 'Contact Eric at (910) 555-0199',
      selectedAssetFormats: ['flyer', 'social', 'postcard', 'sign_rider', 'email'],
      dueTargetDate: '2026-08-06',
      reviewOwner: 'Eric',
      specialInstructions: ['Open-house start and end times must be resolved before rendering sign rider & email.']
    },
    assets: {
      flyer: {
        id: 'asset_flyer_304',
        assetType: 'flyer',
        templateId: 'tmpl_flyer_coastal_emerald_v1',
        templateVersion: '1.0.0',
        headline: 'OCEANFRONT COASTAL VILLA IN WRIGHTSVILLE BEACH',
        subhead: 'Panoramic Atlantic views, private boardwalk, and luxury finishes',
        bodyCopy: 'Welcome to 304 Ocean Blvd. 5,100 SqFt of direct oceanfront living.',
        captions: {},
        selectedSourcePhotoIds: ['photo_ocean_hero'],
        status: 'draft',
        complianceStatus: 'pending',
        complianceIssues: [],
        updatedAt: new Date().toISOString()
      }
    },
    readinessCheck: {
      propertyDetailsComplete: false,
      approvedPhotosCount: 1,
      listingAgentAssigned: true,
      brandKitValid: true,
      disclosuresApproved: true,
      isReadyForGeneration: false,
      missingFields: ['open_house_hours']
    },
    approvals: [],
    auditTrail: [
      {
        id: 'audit_304_01',
        action: 'PHONE_REQUEST_CAPTURED',
        performedBy: 'Ava (AI Phone Agent)',
        timestamp: '2026-08-02T09:14:00Z',
        details: 'Captured inbound phone request from Eric for 304 Ocean Blvd.'
      },
      {
        id: 'audit_304_02',
        action: 'MISSING_INFO_IDENTIFIED',
        performedBy: 'Shapework Brief Engine',
        timestamp: '2026-08-02T09:15:00Z',
        details: 'Identified open-house hours as missing required information.'
      }
    ],
    createdAt: '2026-08-02T09:14:00Z',
    updatedAt: new Date().toISOString()
  };
}

// Seed Request B Campaign (212 Wetland Court)
export function getCampaignWetland212(): ListingMarketingCampaign {
  const photos: SourcePhoto[] = [
    {
      id: 'photo_wetland_hero',
      url: '/api/marketing/campaigns/campaign_212_wetland/assets/photo_hero/raw',
      caption: 'Marshfront Elevation & Screened Porch',
      category: 'hero',
      sourceProvenance: 'Physical Photo: wetland_ct_212.jpg',
      metadataSource: 'fixture',
      photographerName: 'Alex Carter',
      photographerLicense: 'FAA License #FA-394201',
      byteSize: 980120,
      width: 1920,
      height: 1280,
      sha256: 'b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef12'
    }
  ];

  const request: any = {
    id: 'req_212_wetland_email',
    workspaceId: 'nest-realty-demo',
    channel: 'email',
    status: 'ready_for_campaign',
    receivedAt: '2026-08-02T08:42:00Z',
    urgency: 'standard',
    capturedByAgentId: 'agent_shapework_email',
    capturedByAgentName: 'Shapework Email Agent',
    capturedByAgentType: 'email_agent',
    requestedByPersonId: 'dir_jessica_keenan_8',
    requestedByName: 'Jessica Keenan',
    requestedByRole: 'Broker-in-Charge',
    onBehalfOfPersonId: 'dir_jessica_keenan_8',
    onBehalfOfName: 'Jessica Keenan',
    onBehalfOfRole: 'Broker-in-Charge',
    propertyId: 'prop_212_wetland',
    listingSnapshotId: 'snap_212_v1',
    originalRequestText: 'Hi Shapework, please create a marketing package for my new listing at 212 Wetland Court. Need flyer, postcard, and sign rider ready ASAP. Standard Nest Wilmington brand kit.',
    aiSummary: 'Email request for 212 Wetland Court marketing package (Flyer, Postcard, Sign Rider). 1 material ready for review, 2 materials preparing.',
    requestedMaterialTypes: ['flyer', 'postcard', 'sign_rider'],
    specialInstructions: ['Highlight tranquil marshland views and wrap-around porch.'],
    missingInformation: [],
    campaignId: 'campaign_212_wetland',
    createdAt: '2026-08-02T08:42:00Z',
    updatedAt: '2026-08-02T08:42:00Z'
  };

  const originalCommunication: any = {
    id: 'comm_email_212',
    requestId: 'req_212_wetland_email',
    type: 'email_message',
    subject: 'Marketing Package Request: 212 Wetland Court',
    from: 'jessica.keenan@nestrealty.com',
    to: 'marketing-agent@nestrealty.com',
    timestamp: '2026-08-02T08:42:00Z',
    rawText: `From: Jessica Keenan <jessica.keenan@nestrealty.com>
To: Shapework Email Agent <marketing-agent@nestrealty.com>
Subject: Marketing Package Request: 212 Wetland Court
Date: Sun, 2 Aug 2026 08:42:00 -0400

Hi Shapework team,

Please create a marketing package for my new listing at 212 Wetland Court. Need the property flyer, postcard, and sign rider ready ASAP.

Thanks,
Jessica Keenan
Nest Realty Wilmington`
  };

  return {
    id: 'campaign_212_wetland',
    workspaceId: 'nest-realty-demo',
    propertyAddress: '212 Wetland Court, Wilmington, NC 28411',
    listingAgentId: 'dir_jessica_keenan_8',
    marketingOwnerId: 'marketing_melissa',
    status: 'preparing',
    request,
    originalCommunication,
    followUpRequests: [],
    listingSnapshot: {
      propertyAddress: '212 Wetland Court',
      city: 'Wilmington',
      state: 'NC',
      postalCode: '28411',
      listingPrice: 875000,
      bedrooms: 3,
      bathrooms: 3,
      squareFeet: 2800,
      acreage: 0.62,
      propertyType: 'Single Family Residence',
      yearBuilt: 2019,
      listingStatus: 'Active',
      targetListDate: '2026-08-01',
      openHouseDates: ['Saturday 1:00 PM - 3:00 PM'],
      headline: 'CHARMING MARSH-VIEW COTTAGE',
      publicRemarks: 'Tranquil 3 bed, 3 bath cottage situated on a private cul-de-sac backing to protected tidal marshlands. Features open concept floorplan and screened wrap-around porch.',
      keyFeatures: [
        '3 Bedrooms & 3 Full Bathrooms (2,800 SqFt)',
        'Protected Tidal Marshland Views',
        'Screened Wrap-Around Porch',
        'Quiet Cul-de-sac Location'
      ],
      listingAgentId: 'dir_jessica_keenan_8',
      listingAgentName: 'Jessica Keenan',
      listingAgentEmail: 'jessica.keenan@nestrealty.com',
      listingAgentPhone: '(910) 368-1507',
      brokerInChargeName: 'Ryan Crecelius (BIC)',
      approvedSourcePhotos: photos,
      source: 'crm',
      sourceUpdatedAt: new Date().toISOString()
    },
    brandKit: {
      id: 'brand_nest_wilmington_v2',
      brokerageName: 'Nest Realty Wilmington',
      officeName: 'Wilmington Main Office',
      version: '2.1.0',
      primaryColor: '#00635C',
      secondaryColor: '#D0D6BB',
      backgroundColor: '#FFFFFF',
      darkCharcoal: '#0F172A',
      approvedFonts: ['Inter', 'Outfit'],
      logoUrl: '/nest-realty-logo.png',
      fairHousingLogoUrl: '/nest_n_green.png',
      logoAssets: {
        primaryLogoId: 'logo_nest_primary_v2',
        primaryLogoUrl: '/nest-realty-logo.png'
      },
      typography: {
        displayFont: 'Outfit',
        bodyFont: 'Inter',
        fallbackFonts: ['sans-serif']
      },
      officeAddress: '1055 Military Cutoff Rd, Wilmington NC 28405',
      officePhone: '(910) 392-4100',
      website: 'https://nestrealty.com/wilmington',
      agentAttributionRules: 'Listing Agent attribution required.',
      disclaimerText: 'Equal Housing Opportunity.'
    },
    compliancePolicySet: {
      id: 'policy_ncrec_2026_v1',
      workspaceId: 'nest-realty-demo',
      stateCode: 'NC',
      name: 'North Carolina Real Estate Commission Compliance Rules',
      version: '2026.1',
      requiredFields: ['listingAgentName', 'brokerageName', 'equalHousingLogo'],
      requiredDisclosures: ['NCREC License Attribution', 'Equal Housing Opportunity Statement'],
      prohibitedClaims: [],
      imageRules: ['Approved Photography Only'],
      channelRules: [],
      requiresBrokerReview: true,
      effectiveAt: '2026-01-01T00:00:00Z'
    },
    campaignBrief: {
      id: 'brief_212_wetland',
      workspaceId: 'nest-realty-demo',
      campaignId: 'campaign_212_wetland',
      requestId: 'req_212_wetland_email',
      campaignRevision: 1,
      objective: 'Targeted campaign for peaceful marsh-view cottage',
      targetAudience: ['Downsizers', 'nature lovers'],
      tone: 'Warm, inviting, tranquil',
      positioning: 'Serene coastal cottage with expansive marsh views',
      keySellingPoints: ['3 Bed 3 Bath', 'Marshfront Lot', 'Screened Porch'],
      requiredDisclosures: ['Equal Housing Opportunity'],
      callToAction: 'Contact Jessica Keenan at (910) 368-1507',
      selectedAssetFormats: ['flyer', 'postcard', 'sign_rider'],
      dueTargetDate: '2026-08-01',
      reviewOwner: 'Jessica Keenan',
      specialInstructions: []
    },
    assets: {
      flyer: {
        id: 'asset_flyer_212',
        assetType: 'flyer',
        templateId: 'tmpl_flyer_coastal_emerald_v1',
        templateVersion: '1.0.0',
        headline: 'CHARMING MARSH-VIEW COTTAGE',
        subhead: 'Tranquil 3 Bed, 3 Bath cottage on protected tidal marsh',
        bodyCopy: 'Welcome to 212 Wetland Court. 2,800 SqFt of serene marshfront living.',
        captions: {},
        selectedSourcePhotoIds: ['photo_wetland_hero'],
        status: 'ready_for_review',
        complianceStatus: 'passed',
        complianceIssues: [],
        updatedAt: new Date().toISOString()
      }
    },
    readinessCheck: {
      propertyDetailsComplete: true,
      approvedPhotosCount: 1,
      listingAgentAssigned: true,
      brandKitValid: true,
      disclosuresApproved: true,
      isReadyForGeneration: true,
      missingFields: []
    },
    approvals: [],
    auditTrail: [
      {
        id: 'audit_212_01',
        action: 'EMAIL_REQUEST_CAPTURED',
        performedBy: 'Shapework Email Agent',
        timestamp: '2026-08-02T08:42:00Z',
        details: 'Received email request from Jessica Keenan.'
      },
      {
        id: 'audit_212_02',
        action: 'PREPARATION_STARTED',
        performedBy: 'Shapework Build Engine',
        timestamp: '2026-08-02T08:43:00Z',
        details: 'Initiated rendering for 3 requested assets.'
      }
    ],
    createdAt: '2026-08-02T08:42:00Z',
    updatedAt: new Date().toISOString()
  };
}

export function getCampaign117Colonial(): ListingMarketingCampaign {
  const photos: SourcePhoto[] = [
    {
      id: 'photo_117_hero',
      url: '/api/marketing/campaigns/campaign_990_inspiration/assets/photo_hero/raw',
      caption: 'Front Elevation & Landscaped Drive',
      category: 'hero',
      sourceProvenance: 'FAA Certified Aerial Shoot',
      metadataSource: 'uploaded_file_metadata'
    },
    {
      id: 'photo_117_interior',
      url: '/api/marketing/campaigns/campaign_990_inspiration/assets/photo_pool/raw',
      caption: 'Open Concept Living & Chef Kitchen',
      category: 'interior',
      sourceProvenance: 'Professional DSLR Shoot',
      metadataSource: 'uploaded_file_metadata'
    }
  ];

  const request: any = {
    id: 'req_117_colonial_phone',
    workspaceId: 'nest-realty-demo',
    channel: 'phone',
    status: 'converted_to_campaign',
    receivedAt: '2026-08-18T10:15:00Z',
    capturedByAgentName: 'Ask Nest Ops Voice AI · (910) 507-2047',
    capturedByAgentType: 'voice_agent',
    requestedByName: 'Marcus Aman',
    requestedByRole: 'Broker / Tech Lead',
    originalRequestText: 'Hey, this is Marcus Aman. I have a new listing at 117 Colonial Drive in Wilmington, 28403. Asking $895,000. 4-bed, 3.5-bath, 3,150 sqft. Need a luxury property flyer ready for our broker preview this Thursday at 11am. Send proof to Marcus & Ryan.',
    aiSummary: 'Phone intake from Marcus Aman for 117 Colonial Dr ($895k, 4b/3.5ba, 3,150 sqft). Requested luxury flyer and social graphics before Thursday 11am broker preview.',
    requestedMaterialTypes: ['flyer', 'carousel', 'postcard', 'sign_rider', 'email'],
    specialInstructions: ['High-end luxury styling', 'Highlight Thursday 11:00 AM broker preview', 'Send proof to Marcus & Ryan'],
    missingInformation: [],
    campaignId: 'campaign_117_colonial',
    callId: 'call_b5307aa8db5cc8f3b25d9d0024d',
    createdAt: '2026-08-18T10:15:00Z',
    updatedAt: '2026-08-18T10:18:00Z'
  };

  const originalCommunication: any = {
    id: 'comm_phone_117',
    requestId: 'req_117_colonial_phone',
    type: 'phone_call',
    subject: 'Voice Intake Call - 117 Colonial Drive',
    from: 'Marcus Aman (+1-910-232-1772)',
    to: '+1 (910) 507-2047 (Nest Marketing AI Line)',
    timestamp: '2026-08-18T10:15:00Z',
    rawText: 'Agent: Thank you for calling Nest Realty Wilmington Marketing. How can I help you today?\nCaller: Hey, this is Marcus Aman. I have a new listing at 117 Colonial Drive in Wilmington, 28403...'
  };

  return {
    id: 'campaign_117_colonial',
    workspaceId: 'nest-realty-demo',
    propertyAddress: '117 Colonial Drive, Wilmington, NC 28403',
    listingAgentId: 'agent_marcus_aman',
    marketingOwnerId: 'marketing_melissa',
    status: 'ready_for_review',
    callId: 'call_b5307aa8db5cc8f3b25d9d0024d',
    request,
    originalCommunication,
    followUpRequests: [],
    listingSnapshot: {
      propertyAddress: '117 Colonial Dr',
      city: 'Wilmington',
      state: 'NC',
      postalCode: '28403',
      listingPrice: 895000,
      bedrooms: 4,
      bathrooms: 3.5,
      squareFeet: 3150,
      acreage: 0.52,
      propertyType: 'Single Family Coastal Estate',
      yearBuilt: 2021,
      listingStatus: 'Coming Soon',
      targetListDate: '2026-08-20',
      openHouseDates: ['Thursday, Aug 20 · 11:00 AM - 1:00 PM (Broker Preview)'],
      headline: 'CONTEMPORARY COASTAL MASTERPIECE ON COLONIAL DRIVE',
      publicRemarks: 'Exceptional 4 bedroom, 3.5 bath luxury residence in prime Wilmington neighborhood. Features gourmet quartz kitchen, private covered patio, expansive primary suite, and designer fixtures.',
      keyFeatures: [
        '4 Bedrooms & 3.5 Designer Bathrooms (3,150 SqFt)',
        'Chef Kitchen with Quartz Waterfall Island',
        'Private Landscaped Backyard with Covered Lanai',
        'Broker Preview: Thursday 11:00 AM - 1:00 PM'
      ],
      listingAgentId: 'agent_marcus_aman',
      listingAgentName: 'Marcus Aman',
      listingAgentEmail: 'marcus@shapework.co',
      listingAgentPhone: '(910) 232-1772',
      brokerInChargeName: 'Ryan Crecelius (BIC)',
      approvedSourcePhotos: photos,
      source: 'inbound_request',
      sourceUpdatedAt: new Date().toISOString()
    },
    brandKit: {
      id: 'brand_nest_wilmington_main',
      brokerageName: 'Nest Realty Wilmington',
      officeName: 'Mayfaire Office',
      version: '2.1.0',
      primaryColor: '#00635C',
      secondaryColor: '#D0D6BB',
      backgroundColor: '#FFFFFF',
      darkCharcoal: '#0F172A',
      approvedFonts: ['Inter', 'Outfit'],
      logoUrl: '/nest-realty-logo.png',
      fairHousingLogoUrl: '/nest_n_green.png',
      officeAddress: '1055 Military Cutoff Rd, Wilmington NC 28405',
      officePhone: '(910) 392-4100',
      website: 'https://nestrealty.com/wilmington',
      agentAttributionRules: 'Marcus Aman · (910) 232-1772 · marcus@shapework.co',
      disclaimerText: 'Equal Housing Opportunity.'
    },
    compliancePolicySet: {
      id: 'policy_ncrec_2026_v1',
      workspaceId: 'nest-realty-demo',
      stateCode: 'NC',
      name: 'NCREC Marketing & Advertising Compliance Rules',
      version: '2026.1',
      requiredFields: ['listingAgentName', 'brokerageName', 'equalHousingLogo'],
      requiredDisclosures: ['NCREC License Attribution', 'Equal Housing Opportunity Statement'],
      prohibitedClaims: [],
      imageRules: ['Approved Photography Only'],
      channelRules: [],
      requiresBrokerReview: true,
      effectiveAt: '2026-01-01T00:00:00Z'
    },
    campaignBrief: {
      id: 'brief_117_colonial',
      workspaceId: 'nest-realty-demo',
      campaignId: 'campaign_117_colonial',
      requestId: 'req_117_colonial_phone',
      campaignRevision: 1,
      objective: 'High-visibility launch for 117 Colonial Drive broker preview',
      targetAudience: ['Area Brokers', 'Move-up buyers'],
      tone: 'Refined, sophisticated, crisp',
      positioning: 'Modern luxury living in established Wilmington enclave',
      keySellingPoints: ['4 Bed 3.5 Bath', '$895,000', 'Broker Preview Thursday 11am'],
      requiredDisclosures: ['Equal Housing Opportunity'],
      callToAction: 'Attend Broker Preview Thursday 11am or call Marcus Aman (910) 232-1772',
      selectedAssetFormats: ['flyer', 'carousel', 'postcard', 'sign_rider', 'email'],
      dueTargetDate: '2026-08-20',
      reviewOwner: 'Marcus Aman',
      specialInstructions: ['Include broker preview timing', 'Send proof to Marcus & Ryan']
    },
    assets: {
      flyer: {
        id: 'asset_flyer_117',
        assetType: 'flyer',
        templateId: 'tmpl_flyer_coastal_emerald_v1',
        templateVersion: '1.0.0',
        headline: 'LUXURY LIVING ON COLONIAL DRIVE',
        subhead: 'Stunning 4 Bed, 3.5 Bath Residence • $895,000',
        bodyCopy: 'Welcome to 117 Colonial Drive in Wilmington. Offering 3,150 SqFt of elevated living, gourmet quartz kitchen, private covered lanai, and prime proximity to Mayfaire.',
        captions: {},
        selectedSourcePhotoIds: ['photo_117_hero'],
        status: 'ready_for_review',
        complianceStatus: 'passed',
        complianceIssues: [],
        updatedAt: new Date().toISOString()
      },
      carousel: {
        id: 'asset_carousel_117',
        assetType: 'carousel',
        templateId: 'tmpl_social_carousel_v1',
        templateVersion: '1.0.0',
        headline: '117 Colonial Dr — Just Listed $895,000',
        subhead: 'Broker Preview this Thursday 11am - 1pm',
        bodyCopy: 'Swipe for property walkthrough and floor plan.',
        captions: {},
        selectedSourcePhotoIds: ['photo_117_hero', 'photo_117_interior'],
        status: 'ready_for_review',
        complianceStatus: 'passed',
        complianceIssues: [],
        updatedAt: new Date().toISOString()
      }
    },
    readinessCheck: {
      propertyDetailsComplete: true,
      approvedPhotosCount: 2,
      listingAgentAssigned: true,
      brandKitValid: true,
      disclosuresApproved: true,
      isReadyForGeneration: true,
      missingFields: []
    },
    approvals: [],
    auditTrail: [
      {
        id: 'audit_117_01',
        action: 'VOICE_CALL_CAPTURED',
        performedBy: 'AI Voice Line (910) 507-2047',
        timestamp: '2026-08-18T10:15:00Z',
        details: 'Received and transcribed call from Marcus Aman.'
      },
      {
        id: 'audit_117_02',
        action: 'CAMPAIGN_AUTO_CREATED',
        performedBy: 'Shapework Marketing Ingestion Pipeline',
        timestamp: '2026-08-18T10:16:00Z',
        details: 'Extracted 117 Colonial Dr details and drafted collateral assets.'
      }
    ],
    createdAt: '2026-08-18T10:15:00Z',
    updatedAt: new Date().toISOString()
  };
}

export function getCampaign1916Walcott(): ListingMarketingCampaign {
  const photos: SourcePhoto[] = [
    {
      id: 'photo_1916_hero',
      url: '/api/marketing/campaigns/campaign_990_inspiration/assets/photo_hero/raw',
      caption: 'Front View',
      category: 'hero',
      sourceProvenance: 'Professional Shoot',
      metadataSource: 'uploaded_file_metadata'
    }
  ];

  const request: any = {
    id: 'req_1916_walcott_phone',
    workspaceId: 'nest-realty-demo',
    channel: 'phone',
    status: 'converted_to_campaign',
    receivedAt: '2026-08-18T11:00:00Z',
    capturedByAgentName: 'Ask Nest Ops Voice AI · (910) 507-2047',
    capturedByAgentType: 'voice_agent',
    requestedByName: 'Matt Orr',
    requestedByRole: 'Broker',
    originalRequestText: 'Hey, it\'s Matt Orr. I\'ve got a listing at 1916 Walcott Ave. 3 beds, 2.5 baths, asking $749,000. Open house is this Saturday, so I need print handouts and single-property landing page set up by Friday noon.',
    aiSummary: 'Inbound phone request from Matt Orr for 1916 Walcott Ave open house collateral (handouts, postcard, landing page) due Friday noon.',
    requestedMaterialTypes: ['flyer', 'postcard', 'carousel'],
    specialInstructions: ['Open house Saturday', 'Due Friday noon'],
    missingInformation: [],
    campaignId: 'campaign_1916_walcott',
    callId: 'call_a27fe5bdf0e973e9cb5147d04e4',
    createdAt: '2026-08-18T11:00:00Z',
    updatedAt: '2026-08-18T11:05:00Z'
  };

  const originalCommunication: any = {
    id: 'comm_phone_1916',
    requestId: 'req_1916_walcott_phone',
    type: 'phone_call',
    subject: 'Voice Intake Call - 1916 Walcott Ave',
    from: 'Matt Orr (+1-910-555-0144)',
    to: '+1 (910) 507-2047 (Nest Marketing AI Line)',
    timestamp: '2026-08-18T11:00:00Z',
    rawText: 'Agent: Nest Realty Wilmington Marketing. How can I help?\nCaller: Hey, it\'s Matt Orr. Listing at 1916 Walcott Ave...'
  };

  return {
    id: 'campaign_1916_walcott',
    workspaceId: 'nest-realty-demo',
    propertyAddress: '1916 Walcott Ave, Wilmington, NC',
    listingAgentId: 'agent_matt_orr',
    marketingOwnerId: 'marketing_melissa',
    status: 'ready_for_review',
    callId: 'call_a27fe5bdf0e973e9cb5147d04e4',
    request,
    originalCommunication,
    followUpRequests: [],
    listingSnapshot: {
      propertyAddress: '1916 Walcott Ave',
      city: 'Wilmington',
      state: 'NC',
      postalCode: '28403',
      listingPrice: 749000,
      bedrooms: 3,
      bathrooms: 2.5,
      squareFeet: 2450,
      acreage: 0.35,
      propertyType: 'Single Family',
      yearBuilt: 2020,
      listingStatus: 'Active',
      targetListDate: '2026-08-22',
      openHouseDates: ['Saturday, Aug 22 · 1:00 PM - 3:00 PM'],
      headline: 'BEAUTIFUL MID-TOWN CHARMER ON WALCOTT AVE',
      publicRemarks: 'Charming 3 bed, 2.5 bath coastal home featuring open layout, modern finishes, and serene backyard.',
      keyFeatures: [
        '3 Bedrooms & 2.5 Baths (2,450 SqFt)',
        'Open-concept chef kitchen',
        'Open House Saturday 1PM - 3PM'
      ],
      listingAgentId: 'agent_matt_orr',
      listingAgentName: 'Matt Orr',
      listingAgentEmail: 'matt@nestrealty.com',
      listingAgentPhone: '(910) 555-0144',
      brokerInChargeName: 'Ryan Crecelius (BIC)',
      approvedSourcePhotos: photos,
      source: 'inbound_request',
      sourceUpdatedAt: new Date().toISOString()
    },
    brandKit: {
      id: 'brand_nest_wilmington_main',
      brokerageName: 'Nest Realty Wilmington',
      officeName: 'Mayfaire Office',
      version: '2.1.0',
      primaryColor: '#00635C',
      secondaryColor: '#D0D6BB',
      backgroundColor: '#FFFFFF',
      darkCharcoal: '#0F172A',
      approvedFonts: ['Inter', 'Outfit'],
      logoUrl: '/nest-realty-logo.png',
      fairHousingLogoUrl: '/nest_n_green.png',
      officeAddress: '1055 Military Cutoff Rd, Wilmington NC 28405',
      officePhone: '(910) 392-4100',
      website: 'https://nestrealty.com/wilmington',
      agentAttributionRules: 'Matt Orr · (910) 555-0144',
      disclaimerText: 'Equal Housing Opportunity.'
    },
    compliancePolicySet: {
      id: 'policy_ncrec_2026_v1',
      workspaceId: 'nest-realty-demo',
      stateCode: 'NC',
      name: 'NCREC Marketing Compliance',
      version: '2026.1',
      requiredFields: ['listingAgentName', 'brokerageName', 'equalHousingLogo'],
      requiredDisclosures: ['NCREC License Attribution', 'Equal Housing Opportunity Statement'],
      prohibitedClaims: [],
      imageRules: ['Approved Photography Only'],
      channelRules: [],
      requiresBrokerReview: true,
      effectiveAt: '2026-01-01T00:00:00Z'
    },
    campaignBrief: {
      id: 'brief_1916_walcott',
      workspaceId: 'nest-realty-demo',
      campaignId: 'campaign_1916_walcott',
      requestId: 'req_1916_walcott_phone',
      campaignRevision: 1,
      objective: 'Open house collateral package for 1916 Walcott Ave',
      targetAudience: ['Local buyers', 'Neighborhood open house visitors'],
      tone: 'Welcoming, crisp, energetic',
      positioning: 'Turnkey mid-town home ready for immediate occupancy',
      keySellingPoints: ['3 Bed 2.5 Bath', '$749,000', 'Saturday Open House'],
      requiredDisclosures: ['Equal Housing Opportunity'],
      callToAction: 'Join us Saturday 1-3pm or call Matt Orr (910) 555-0144',
      selectedAssetFormats: ['flyer', 'postcard', 'carousel'],
      dueTargetDate: '2026-08-21',
      reviewOwner: 'Matt Orr',
      specialInstructions: ['Deliver by Friday noon']
    },
    assets: {
      flyer: {
        id: 'asset_flyer_1916',
        assetType: 'flyer',
        templateId: 'tmpl_flyer_coastal_emerald_v1',
        templateVersion: '1.0.0',
        headline: 'OPEN HOUSE SATURDAY • 1916 WALCOTT AVE',
        subhead: 'Turnkey 3 Bed, 2.5 Bath Residence • $749,000',
        bodyCopy: 'Join us this Saturday from 1:00 PM to 3:00 PM at 1916 Walcott Ave.',
        captions: {},
        selectedSourcePhotoIds: ['photo_1916_hero'],
        status: 'ready_for_review',
        complianceStatus: 'passed',
        complianceIssues: [],
        updatedAt: new Date().toISOString()
      }
    },
    readinessCheck: {
      propertyDetailsComplete: true,
      approvedPhotosCount: 1,
      listingAgentAssigned: true,
      brandKitValid: true,
      disclosuresApproved: true,
      isReadyForGeneration: true,
      missingFields: []
    },
    approvals: [],
    auditTrail: [
      {
        id: 'audit_1916_01',
        action: 'VOICE_CALL_CAPTURED',
        performedBy: 'AI Voice Line (910) 507-2047',
        timestamp: '2026-08-18T11:00:00Z',
        details: 'Received and transcribed call from Matt Orr.'
      }
    ],
    createdAt: '2026-08-18T11:00:00Z',
    updatedAt: new Date().toISOString()
  };
}

export function getCampaign126Parkwood(): ListingMarketingCampaign {
  const defaultCamp = getInitialDefaultCampaign();
  return {
    ...defaultCamp,
    id: 'campaign_126_parkwood',
    workspaceId: 'nest-realty-demo',
    propertyAddress: '126 Parkwood Avenue, Wilmington NC 28403',
    listingAgentId: 'agent_matt',
    marketingOwnerId: 'marketing_melissa',
    status: 'needs_attention',
    request: {
      id: 'req_126_parkwood_phone',
      requestedByName: 'Matt Orr',
      requestedByRole: 'Listing Broker',
      channel: 'phone',
      originalRequestText: 'I need to get a listing presentation together for a possible new client for 126 Parkwood Avenue. Print and digital formats by tomorrow, August 20th.',
      aiSummary: 'Urgent listing presentation request for 126 Parkwood Ave from Matt Orr. Needs print and digital proposal deck by tomorrow Aug 20.',
      requestedMaterialTypes: ['presentation', 'flyer', 'mls_photos'],
      specialInstructions: ['Include MLS photos (live, no client approval needed)', 'Deadline: Tomorrow Aug 20 (Urgent)', 'Print and digital deck formats']
    },
    listingSnapshot: {
      propertyAddress: '126 Parkwood Avenue',
      city: 'Wilmington',
      state: 'NC',
      postalCode: '28403',
      listingPrice: 625000,
      bedrooms: 3,
      bathrooms: 2.5,
      squareFeet: 2450,
      acreage: 0.35,
      propertyType: 'Single Family Residence',
      yearBuilt: 2019,
      listingStatus: 'Draft',
      targetListDate: '2026-08-20',
      openHouseDates: [],
      headline: 'CHARMING MID-TOWN RESIDENCE ON PARKWOOD AVENUE',
      publicRemarks: 'Delightful 3 bed, 2.5 bath coastal home in prime midtown Wilmington. Open kitchen, hardwood floors, and serene fenced backyard.',
      keyFeatures: [
        '3 Bedrooms & 2.5 Bathrooms (2,450 SqFt)',
        'Gourmet Island Kitchen with Granite Counters',
        'Spacious Screened Porch & Fenced Yard',
        'Prime Midtown Location Close to Parks'
      ],
      listingAgentId: 'agent_matt',
      listingAgentName: 'Matt Orr',
      listingAgentEmail: 'matt.orr@nestrealty.com',
      listingAgentPhone: '(910) 612-8283',
      brokerInChargeName: 'Ryan Crecelius (BIC)',
      approvedSourcePhotos: defaultCamp.listingSnapshot.approvedSourcePhotos,
      source: 'inbound_request',
      sourceUpdatedAt: new Date().toISOString()
    }
  };
}

export function getCampaign312Mayfaire(): ListingMarketingCampaign {
  const defaultCamp = getInitialDefaultCampaign();
  return {
    ...defaultCamp,
    id: 'campaign_312_mayfaire',
    workspaceId: 'nest-realty-demo',
    propertyAddress: '312 Mayfaire Way, Wilmington NC 28405',
    listingAgentId: 'agent_ann',
    marketingOwnerId: 'marketing_ann',
    status: 'in_production',
    request: {
      id: 'req_312_mayfaire_phone',
      requestedByName: 'Ann Gunn',
      requestedByRole: 'Operations Lead (ATC)',
      channel: 'phone',
      originalRequestText: 'Install yard sign post & custom rider at 312 Mayfaire Way before upcoming open house. Dispatched to Coastal Sign Post Co.',
      aiSummary: 'Sign post installation work order for 312 Mayfaire Way. Dispatched to Coastal Sign Post Co.',
      requestedMaterialTypes: ['sign_rider', 'yard_post'],
      specialInstructions: ['Coastal Sign Post Co. work order dispatched', 'Target install today by 3pm']
    },
    listingSnapshot: {
      propertyAddress: '312 Mayfaire Way',
      city: 'Wilmington',
      state: 'NC',
      postalCode: '28405',
      listingPrice: 849000,
      bedrooms: 4,
      bathrooms: 3.5,
      squareFeet: 3200,
      acreage: 0.42,
      propertyType: 'Single Family Residence',
      yearBuilt: 2021,
      listingStatus: 'Active',
      targetListDate: '2026-08-01',
      openHouseDates: ['Sunday 1:00 PM - 3:00 PM'],
      headline: 'ELEGANT MAYFAIRE RESIDENCE NEAR TOWN CENTER',
      publicRemarks: 'Stunning 4 bed, 3.5 bath custom home walking distance to Mayfaire Town Center shops, dining, and movie theater.',
      keyFeatures: [
        '4 Bedrooms & 3.5 Bathrooms (3,200 SqFt)',
        'First Floor Master Suite with Spa Bath',
        'Screened Porch with Outdoor Fireplace'
      ],
      listingAgentId: 'agent_ann',
      listingAgentName: 'Ann Gunn',
      listingAgentEmail: 'ann@nestrealty.com',
      listingAgentPhone: '(910) 507-2047',
      brokerInChargeName: 'Ryan Crecelius (BIC)',
      approvedSourcePhotos: defaultCamp.listingSnapshot.approvedSourcePhotos,
      source: 'inbound_request',
      sourceUpdatedAt: new Date().toISOString()
    }
  };
}

export function getCampaign1104Arboretum(): ListingMarketingCampaign {
  const defaultCamp = getInitialDefaultCampaign();
  return {
    ...defaultCamp,
    id: 'campaign_1104_arboretum',
    workspaceId: 'nest-realty-demo',
    propertyAddress: '1104 Arboretum Dr, Wilmington NC 28405',
    listingAgentId: 'agent_sarah',
    marketingOwnerId: 'marketing_eduardo',
    status: 'in_production',
    request: {
      id: 'req_1104_arboretum_web',
      requestedByName: 'Jessica Keenan',
      requestedByRole: 'Broker-in-Charge',
      channel: 'web',
      originalRequestText: 'Produce full print & digital collateral package in Nest Design Center for 1104 Arboretum Dr Landfall Golf Villa.',
      aiSummary: 'Full listing collateral package for 1104 Arboretum Dr assigned to Eduardo (VA).',
      requestedMaterialTypes: ['flyer', 'postcard', 'social', 'feature_sheet'],
      specialInstructions: ['Use Maxa Template #M-402', 'Target completion today 5pm']
    },
    listingSnapshot: {
      propertyAddress: '1104 Arboretum Dr',
      city: 'Wilmington',
      state: 'NC',
      postalCode: '28405',
      listingPrice: 1250000,
      bedrooms: 4,
      bathrooms: 4,
      squareFeet: 4100,
      acreage: 0.65,
      propertyType: 'Golf Course Villa',
      yearBuilt: 2022,
      listingStatus: 'In Production',
      targetListDate: '2026-08-15',
      openHouseDates: ['Saturday 2:00 PM - 4:00 PM'],
      headline: 'LUXURY LANDFALL GOLF VILLA ON ARBORETUM DRIVE',
      publicRemarks: 'Exceptional 4 bed, 4 bath Landfall golf villa overlooking the Dye course 14th fairway. High ceilings and luxury finishes.',
      keyFeatures: [
        '4 Bedrooms & 4 Bathrooms (4,100 SqFt)',
        'Panoramic Views of Landfall Dye Course #14',
        'Chef Kitchen with Sub-Zero and Wolf Suite'
      ],
      listingAgentId: 'dir_jessica_keenan_8',
      listingAgentName: 'Jessica Keenan',
      listingAgentEmail: 'jessica.keenan@nestrealty.com',
      listingAgentPhone: '(910) 368-1507',
      brokerInChargeName: 'Ryan Crecelius (BIC)',
      approvedSourcePhotos: defaultCamp.listingSnapshot.approvedSourcePhotos,
      source: 'crm',
      sourceUpdatedAt: new Date().toISOString()
    }
  };
}

export function initializeCampaignsStore(initialData?: ListingMarketingCampaign[]) {
  if (initialData && initialData.length > 0) {
    campaignsStore = initialData;
  } else {
    campaignsStore = [];
  }
  return campaignsStore;
}

export const getCampaign304Ocean = getCampaignOcean304;
export const getCampaign212Wetland = getCampaignWetland212;

export function getAllCampaigns(): ListingMarketingCampaign[] {
  if (campaignsStore.length === 0) {
    initializeCampaignsStore();
  }
  return campaignsStore;
}

export function getCampaignById(id: string): ListingMarketingCampaign | undefined {
  if (campaignsStore.length === 0) {
    initializeCampaignsStore();
  }
  const normalizedId = id.startsWith('camp_') && !id.startsWith('campaign_') ? 'campaign_' + id.slice(5) : id;
  return campaignsStore.find(c => c.id === id || c.id === normalizedId);
}

export function saveCampaign(campaign: ListingMarketingCampaign): ListingMarketingCampaign {
  if (campaignsStore.length === 0) {
    initializeCampaignsStore();
  }
  const index = campaignsStore.findIndex(c => c.id === campaign.id);
  campaign.updatedAt = new Date().toISOString();
  if (index >= 0) {
    campaignsStore[index] = campaign;
  } else {
    campaignsStore.unshift(campaign);
  }
  return campaign;
}

// Work Items Persistence & Store
let workItemsStore: any[] = [];
let dailyPlanningSnapshotsStore: any[] = [];

export function getInitialWorkItems(): any[] {
  return [
    {
      id: 'wi_1104_arboretum_flyer',
      requestId: 'req_1104_arboretum',
      title: 'Double-Sided 8.5x11 Property Flyer for 1104 Arboretum Dr',
      category: 'print',
      executorType: 'virtual_assistant',
      executorName: 'Eduardo (Virtual Assistant)',
      status: 'archived',
      isArchived: true,
      archivedAt: new Date().toISOString(),
      propertyAddress: '1104 Arboretum Dr, Wilmington NC',
      agentName: 'Matt Orr (REALTOR®)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

export function getAllWorkItems(): any[] {
  if (workItemsStore.length === 0) {
    workItemsStore = getInitialWorkItems();
  }
  return workItemsStore;
}

export function getWorkItemById(id: string): any | undefined {
  const items = getAllWorkItems();
  return items.find(w => w.id === id);
}

export function saveWorkItem(item: any): any {
  const items = getAllWorkItems();
  item.updatedAt = new Date().toISOString();
  const index = items.findIndex(w => w.id === item.id);
  if (index >= 0) {
    items[index] = item;
  } else {
    items.unshift(item);
  }
  return item;
}

export function getWorkItemsByRequestId(requestId: string): any[] {
  const items = getAllWorkItems();
  return items.filter(w => w.requestId === requestId);
}

export function updateRoutingOverride(workItemId: string, newMode: any, changedBy: string, reason: string): any {
  const item = getWorkItemById(workItemId);
  if (!item) return null;
  if (!item.routingOverrides) {
    item.routingOverrides = [];
  }
  item.routingOverrides.push({
    recommendedRoute: item.executionMode,
    selectedRoute: newMode,
    changedBy,
    reason,
    timestamp: new Date().toISOString()
  });
  item.executionMode = newMode;

  // Update executor type derived from execution mode
  if (newMode === 'assign_to_va') {
    item.executorType = 'virtual_assistant';
    item.executorName = item.executorName || 'Eduardo (Virtual Assistant)';
  } else if (newMode === 'automate' || newMode === 'automate_with_review') {
    item.executorType = 'shapework_automation';
    item.executorName = 'Shapework Build Engine';
  } else if (newMode === 'assign_to_melissa') {
    item.executorType = 'melissa';
    item.executorName = 'Melissa';
  } else if (newMode === 'assign_to_ann') {
    item.executorType = 'ann';
    item.executorName = 'Ann Smith';
  } else if (newMode === 'assign_to_hq') {
    item.executorType = 'nest_hq';
    item.executorName = 'Nest HQ';
  } else if (newMode === 'external_vendor') {
    item.executorType = 'print_vendor';
    item.executorName = item.printSpecs?.vendorName || 'Print Vendor';
  }

  return saveWorkItem(item);
}

export function updateQuoteStatus(workItemId: string, status: string, approvedBy?: string): any {
  const item = getWorkItemById(workItemId);
  if (!item || !item.quote) return null;
  item.quote.status = status;
  if (status === 'approved') {
    item.quote.approvedBy = approvedBy || 'Client';
    item.quote.approvedAt = new Date().toISOString();
    item.status = 'printing';
    item.printWorkflowStatus = 'approved_for_print';
    item.nextAction = 'Vendor printing in progress. Expected completion: ' + (item.printSpecs?.targetDeliveryDate || 'in 48 hours');
  }
  return saveWorkItem(item);
}

export function updatePrintStatus(workItemId: string, status: any, nextAction?: string): any {
  const item = getWorkItemById(workItemId);
  if (!item) return null;
  item.printWorkflowStatus = status;
  if (nextAction) {
    item.nextAction = nextAction;
  }
  if (status === 'ready_for_pickup') {
    item.status = 'ready_for_pickup';
    item.nextAction = 'Physical pickup ready at ' + (item.printSpecs?.pickupLocation || 'Nest HQ Front Desk');
  } else if (status === 'physically_delivered') {
    item.status = 'physically_delivered';
    item.completedAt = new Date().toISOString();
    item.nextAction = 'Physical delivery confirmed and completed';
  }
  return saveWorkItem(item);
}

export function addPrivateNote(workItemId: string, authorId: string, authorName: string, content: string, visibility: any = 'melissa_private'): any {
  const item = getWorkItemById(workItemId);
  if (!item) return null;
  if (!item.privateNotes) {
    item.privateNotes = [];
  }
  const note = {
    id: 'note_' + Date.now(),
    workItemId,
    authorId,
    authorName,
    content,
    visibility,
    createdAt: new Date().toISOString()
  };
  item.privateNotes.unshift(note);
  return saveWorkItem(item);
}

export function createDailyPlanningSnapshot(snapshotData: any): any {
  const snapshot = {
    id: 'snap_' + Date.now(),
    date: snapshotData.date || new Date().toISOString().split('T')[0],
    plannedBy: snapshotData.plannedBy || 'melissa',
    overdueCount: snapshotData.overdueCount || 0,
    dueTodayCount: snapshotData.dueTodayCount || 0,
    waitingCount: snapshotData.waitingCount || 0,
    vaAssignedCount: snapshotData.vaAssignedCount || 0,
    plannedWorkItemIds: snapshotData.plannedWorkItemIds || [],
    notes: snapshotData.notes || '',
    createdAt: new Date().toISOString()
  };
  dailyPlanningSnapshotsStore.unshift(snapshot);
  return snapshot;
}

export function getDailyPlanningSnapshots(): any[] {
  return dailyPlanningSnapshotsStore;
}

// BOUNDARY TELEMETRY AUDIT STORE
export interface BoundaryTelemetryEvent {
  id: string;
  timestamp: string;
  type: 'validated' | 'normalized_legacy' | 'rejected';
  recordId: string;
  details: string;
  rawRecord?: any;
}

const boundaryTelemetryStore: BoundaryTelemetryEvent[] = [];

export function recordBoundaryTelemetry(type: 'validated' | 'normalized_legacy' | 'rejected', recordId: string, details: string, rawRecord?: any): BoundaryTelemetryEvent {
  const event: BoundaryTelemetryEvent = {
    id: 'telemetry_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString(),
    type,
    recordId,
    details,
    rawRecord
  };
  boundaryTelemetryStore.unshift(event);
  return event;
}

export function getBoundaryTelemetryLogs(): BoundaryTelemetryEvent[] {
  return boundaryTelemetryStore;
}

// PRINT VENDOR DELIVERY RECEIPT STORE
export interface PrintDeliveryReceipt {
  receiptId: string;
  orderId: string;
  workItemId: string;
  campaignId: string;
  vendorName: string;
  status: 'sent_to_vendor' | 'printing' | 'ready_for_pickup' | 'physically_delivered';
  pickupCode?: string;
  invoiceHash?: string;
  proofUrl?: string;
  timestamp: string;
}

const printDeliveryReceiptsStore: PrintDeliveryReceipt[] = [];

export function savePrintDeliveryReceipt(receiptData: Partial<PrintDeliveryReceipt>): PrintDeliveryReceipt {
  const receipt: PrintDeliveryReceipt = {
    receiptId: 'rcpt_print_' + Date.now(),
    orderId: receiptData.orderId || ('apex_ord_' + Date.now()),
    workItemId: receiptData.workItemId || '',
    campaignId: receiptData.campaignId || '',
    vendorName: receiptData.vendorName || 'Apex Signs & Print',
    status: receiptData.status || 'sent_to_vendor',
    pickupCode: receiptData.pickupCode || 'PK-8849',
    invoiceHash: receiptData.invoiceHash || ('sha256_' + Date.now().toString(16)),
    proofUrl: receiptData.proofUrl || '/assets/print-proof-rider.png',
    timestamp: new Date().toISOString()
  };
  printDeliveryReceiptsStore.unshift(receipt);
  return receipt;
}

export function getPrintDeliveryReceipts(campaignId?: string): PrintDeliveryReceipt[] {
  if (campaignId) {
    return printDeliveryReceiptsStore.filter(r => r.campaignId === campaignId);
  }
  return printDeliveryReceiptsStore;
}

// EMAIL DISPATCH RECEIPT STORE
const emailDispatchReceiptsStore: any[] = [];

export function saveEmailDispatchReceipt(receipt: any): any {
  emailDispatchReceiptsStore.unshift(receipt);
  return receipt;
}

export function getEmailDispatchReceipts(campaignId?: string): any[] {
  if (campaignId) {
    return emailDispatchReceiptsStore.filter(r => r.campaignId === campaignId);
  }
  return emailDispatchReceiptsStore;
}

// -------------------------------------------------------------
// BROKERAGE MARKETING ROI & LEAD CONVERSION COMMAND CENTER
// -------------------------------------------------------------
export function getBrokerageMarketingRoiMetrics() {
  return {
    executiveSummary: {
      totalMarketingInvestment: 8450,
      influencedCommissionGci: 184200,
      roasMultiplier: 21.8,
      activeListingsMarketed: 6,
      averageSpeedToLeadSeconds: 11.4,
      noraPreQualificationRatePercent: 78.4,
      avgDaysOnMarketVsBoardAvg: '-14 Days vs MLS Avg'
    },
    velocityAndTurnaround: {
      avgHoursToApproval: 18.4,
      targetSlaHours: 24.0,
      slaComplianceRatePercent: 96.2,
      maxaPreDraftAvgSeconds: 68,
      vendorSignInstallAvgHours: 22.5,
      totalDeliverablesProduced: 38
    },
    vendorSpendSummary: [
      { vendor: 'FastSigns Wilmington', category: 'Custom Yard Signs & Banners', monthlySpend: 420, activeOrders: 2 },
      { vendor: 'Coastal Sign Post Co.', category: 'Colonial Post Installations', monthlySpend: 595, activeOrders: 3 },
      { vendor: 'PostGrid USPS EDDM', category: 'Direct Mail Farming Rosters', monthlySpend: 1280, activeOrders: 4 },
      { vendor: 'Maxa Design Cloud', category: 'Autonomous Template Engine', monthlySpend: 250, activeOrders: 6 }
    ],
    leadAcquisitionChannels: [
      {
        channel: 'USPS EDDM Postcards (QR Codes)',
        spend: 1850,
        leadsGenerated: 86,
        showingsBooked: 24,
        costPerLead: 21.51,
        conversionRatePercent: 14.2,
        icon: 'Mail'
      },
      {
        channel: 'Yard Sign Smart Riders (Nora Calls)',
        spend: 600,
        leadsGenerated: 54,
        showingsBooked: 38,
        costPerLead: 11.11,
        conversionRatePercent: 70.4,
        icon: 'PhoneCall'
      },
      {
        channel: 'Instagram Carousel & Story Ads',
        spend: 1400,
        leadsGenerated: 112,
        showingsBooked: 18,
        costPerLead: 12.50,
        conversionRatePercent: 9.8,
        icon: 'Share2'
      },
      {
        channel: 'Private Client Comp Portals',
        spend: 400,
        leadsGenerated: 42,
        showingsBooked: 16,
        costPerLead: 9.52,
        conversionRatePercent: 38.1,
        icon: 'Compass'
      },
      {
        channel: 'Matterport 3D & Aerial Video Showcase',
        spend: 4200,
        leadsGenerated: 148,
        showingsBooked: 46,
        costPerLead: 28.38,
        conversionRatePercent: 31.0,
        icon: 'Video'
      }
    ],
    carrierRouteQrConversion: [
      {
        routeId: '28405-C012 (Landfall / Arboretum)',
        homesTargeted: 250,
        qrScans: 48,
        scanRatePercent: 19.2,
        showingsRequested: 11,
        status: 'Top Performer'
      },
      {
        routeId: '28405-C014 (Pembroke / Dye)',
        homesTargeted: 250,
        qrScans: 38,
        scanRatePercent: 15.2,
        showingsRequested: 8,
        status: 'High Engagement'
      },
      {
        routeId: '28409-C008 (Masonboro Sound)',
        homesTargeted: 250,
        qrScans: 31,
        scanRatePercent: 12.4,
        showingsRequested: 5,
        status: 'Active Campaign'
      }
    ],
    agentMarketingLeaderboard: [
      {
        agentId: 'agt_marcus_aman',
        agentName: 'Marcus Aman',
        agentTier: 'Chairman Circle',
        activeListings: 4,
        totalMarketingSpend: 4250,
        gciInfluenced: 112000,
        roasMultiplier: 26.3,
        maxaProofsGenerated: 18,
        leadsCaptured: 164,
        conversionRatePercent: 32.4
      },
      {
        agentId: 'dir_jessica_keenan_8',
        agentName: 'Jessica Keenan',
        agentTier: 'President Club',
        activeListings: 3,
        totalMarketingSpend: 2400,
        gciInfluenced: 52000,
        roasMultiplier: 21.6,
        maxaProofsGenerated: 12,
        leadsCaptured: 88,
        conversionRatePercent: 28.5
      },
      {
        agentId: 'agt_david_ross',
        agentName: 'David Ross',
        agentTier: 'Executive Club',
        activeListings: 2,
        totalMarketingSpend: 1100,
        gciInfluenced: 20200,
        roasMultiplier: 18.3,
        maxaProofsGenerated: 8,
        leadsCaptured: 56,
        conversionRatePercent: 24.1
      },
      {
        agentId: 'agt_elena_rostova',
        agentName: 'Elena Rostova',
        agentTier: 'Rising Star',
        activeListings: 1,
        totalMarketingSpend: 700,
        gciInfluenced: 14000,
        roasMultiplier: 20.0,
        maxaProofsGenerated: 6,
        leadsCaptured: 34,
        conversionRatePercent: 26.5
      }
    ]
  };
}

// ============================================================================
// CANONICAL MARKETING TASKS & REQUESTS (MELISSA GAGLIARDI'S VERIFIED WORKFLOW)
// ============================================================================

export interface TaskRequirementItem {
  id: string;
  title?: string;
  label?: string;
  description?: string;
  state?: 'not_reviewed' | 'verified' | 'needs_correction' | 'not_applicable';
  status?: 'not_reviewed' | 'verified' | 'needs_correction' | 'not_applicable';
  verifiedByStaffId?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  note?: string;
  notes?: string;
}

export interface TaskInternalFlag {
  flag: string;
  type?: string;
  notes?: string;
  message?: string;
  flaggedByStaffId?: string;
  flaggedByName?: string;
  flaggedBy?: string;
  flaggedAt?: string;
  timestamp: string;
}

export interface CanonicalMarketingTask {
  id: string;
  requestId?: string;
  workspaceId?: string;
  requestTitle?: string;
  propertyAddress?: string;
  agentName?: string;
  agentRole?: string;
  agentPhone?: string;
  agentEmail?: string;
  channel?: string;
  telephonyCallId?: string;
  title: string;
  category?: string;
  assignedTo?: string;
  assignedToId?: string;
  assignedToRole?: string;
  reviewOwner?: string;
  reviewOwnerId?: string;
  reviewOwnerName?: string;
  coveringStaff?: string;
  coveringStaffId?: string;
  coveringStaffName?: string;
  coverageHistory?: Array<{
    originalStaffId?: string;
    originalStaffName?: string;
    originalOwner?: string;
    coveringStaffId?: string;
    coveringStaffName?: string;
    coveringStaff?: string;
    reason?: string;
    activatedAt?: string;
    timestamp?: string;
  }>;
  reviewState?: 'awaiting_review' | 'revisions_requested' | 'approved';
  proofVersion?: number;
  proofUrl?: string;
  proofNotes?: string;
  proofHistory?: Array<{
    version: number;
    proofUrl: string;
    uploadedBy: string;
    uploadedById?: string;
    uploadedAt: string;
    notes?: string;
    assetId?: string;
    deliverableName?: string;
    fileMetadata?: any;
    validationStatus?: string;
  }>;
  proofs?: Array<{ id?: string; name?: string; url?: string; uploadedAt?: string; uploadedBy?: string; version?: number }>;
  reviewHistory?: Array<{
    version: number;
    action: 'revisions_requested' | 'approved' | 'proof_submitted';
    reviewerId?: string;
    reviewerName: string;
    feedbackNotes?: string;
    timestamp: string;
  }>;
  requirements?: TaskRequirementItem[];
  internalFlags?: TaskInternalFlag[];
  status?: string;
  dueAt?: string;
  dueDate?: string;
  vendorName?: string;
  vendorNotes?: string;
  notes?: string;
  priority?: string;
  photos?: Array<{ id: string; url: string; name?: string; type?: string; sizeBytes?: number; driveUrl?: string }>;
  attachments?: Array<{ filename: string; contentType: string; sizeBytes?: number; url: string; driveUrl?: string }>;
  driveFolderUrl?: string;
  startedAt?: string;
  governingSopId?: string;
  governingSopVersion?: string;
  routingPolicyId?: string;
  routingPolicyVersion?: number;
  routingRuleId?: string;
  departmentId?: string;
  primaryRoleId?: string;
  reviewRoleId?: string;
  fulfillmentRoleId?: string;
  assigneeStaffId?: string;
  originalAssigneeId?: string;
  assigneeCoveringStaffId?: string;
  originalReviewOwnerId?: string;
  reviewCoveringStaffId?: string;
  originalStaffId?: string;
  originalStaffName?: string;
  classificationConfidence?: number;
  routingState?: 'resolved' | 'triage_required' | 'configuration_error' | 'escalated';
  routingReasons?: string[];
  routingSnapshot?: Record<string, any>;
  routedAt?: string;
  createdById?: string;
  startedBy?: string;
  completedAt?: string;
  archivedAt?: string;
  isArchived?: boolean;
  approvalHistory?: Array<{
    action?: string;
    performedBy?: string;
    timestamp?: string;
    note?: string;
    step?: string;
    approvedBy?: string;
    approvedAt?: string;
    status?: string;
    notes?: string;
  }>;
  callId?: string;
  telephonyCallId?: string;
  channel?: string;
  audioUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CanonicalMarketingRequest {
  id: string;
  workspaceId?: string;
  title: string;
  propertyAddress?: string;
  category?: string;
  agentName: string;
  agentRole?: string;
  agentPhone?: string;
  agentEmail?: string;
  createdById?: string;
  createdByName?: string;
  onBehalfOf?: string;
  notes?: string;
  channel: 'phone' | 'email' | 'web' | 'sms' | 'portal' | 'manual';
  requestExcerpt?: string;
  rawExcerpt?: string;
  telephonyCallId?: string;
  audioUrl?: string;
  sourceCallId?: string;
  assignedTo?: string;
  taskIds: string[];
  photos?: Array<{ id: string; url: string; name?: string; type?: string; sizeBytes?: number; driveUrl?: string }>;
  attachments?: Array<{ filename: string; contentType: string; sizeBytes?: number; url: string; driveUrl?: string }>;
  driveFolderUrl?: string;
  receivedAt?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
}

let canonicalTasksStore: CanonicalMarketingTask[] = [];
let canonicalRequestsStore: CanonicalMarketingRequest[] = [];
let hasLoadedCanonicalStore = false;

export function getInitialCanonicalTasks(): CanonicalMarketingTask[] {
  return [];
}

export function getInitialCanonicalRequests(): CanonicalMarketingRequest[] {
  return [];
}

const isServer = typeof window === 'undefined' && typeof process !== 'undefined' && Boolean(process.versions?.node);

function getCanonicalDataPaths() {
  if (!isServer) return null;
  try {
    const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
    const dataDir = path.join(process.cwd(), 'server', 'data');
    const dataFile = isTest
      ? path.join(dataDir, 'canonical_marketing_store_test.json')
      : path.join(dataDir, 'canonical_marketing_store.json');
    return { dataDir, dataFile };
  } catch {
    return null;
  }
}

export async function syncCanonicalStoreFromDatabase(): Promise<boolean> {
  if (!isServer) return false;
  try {
    const { dbPool, storageDriver } = await import('./repositories.js');
    if (storageDriver !== 'database' || !dbPool) return false;

    const reqResult = await dbPool.query(`
      SELECT 
        id, workspace_id, property_address, title, status, category, agent_name, 
        agent_phone, agent_email, channel, notes, task_ids, created_at, updated_at, 
        is_archived, normalized_property_key, field_conflicts, field_provenance,
        created_by_id, created_by_name, on_behalf_of
      FROM canonical_marketing_requests
      ORDER BY created_at DESC
    `);

    const taskResult = await dbPool.query(`
      SELECT 
        id, request_id, workspace_id, title, status, category, agent_name, 
        property_address, notes, assigned_to, assigned_to_id, assigned_to_role,
        review_owner_id, review_owner_name, covering_staff_id, covering_staff_name,
        coverage_history, review_state, proof_version, proof_history, review_history,
        due_at, is_archived, archived_at, completed_at, approval_history,
        requirements, internal_flags, governing_sop_id, governing_sop_version,
        routing_rule_id, routing_policy_version, department_id, primary_role_id,
        review_role_id, assignee_staff_id, original_staff_id, routing_state,
        routing_reasons, routing_snapshot, routing_policy_id, fulfillment_role_id,
        original_review_owner_id, review_covering_staff_id, original_assignee_id,
        assignee_covering_staff_id, classification_confidence, routed_at,
        created_at, updated_at, photos, attachments, mls_number, channel,
        proof_url, deliverable_type
      FROM canonical_marketing_tasks
      ORDER BY created_at DESC
    `);

    if (reqResult.rows.length > 0 || taskResult.rows.length > 0) {
      canonicalRequestsStore = reqResult.rows.map(r => ({
        id: r.id,
        workspaceId: r.workspace_id,
        propertyAddress: r.property_address,
        title: r.title,
        status: r.status,
        category: r.category,
        channel: (r.channel || 'web') as any,
        agentName: r.agent_name,
        agentPhone: r.agent_phone,
        agentEmail: r.agent_email,
        createdById: r.created_by_id,
        createdByName: r.created_by_name,
        onBehalfOf: r.on_behalf_of,
        notes: r.notes,
        rawExcerpt: r.notes || r.title,
        requestExcerpt: r.notes || r.title,
        taskIds: r.task_ids || [],
        createdAt: r.created_at?.toISOString ? r.created_at.toISOString() : r.created_at,
        updatedAt: r.updated_at?.toISOString ? r.updated_at.toISOString() : r.updated_at,
        isArchived: Boolean(r.is_archived),
        normalizedPropertyKey: r.normalized_property_key,
        fieldConflicts: r.field_conflicts,
        fieldProvenance: r.field_provenance
      }));

      canonicalTasksStore = taskResult.rows.map(t => ({
        id: t.id,
        requestId: t.request_id,
        workspaceId: t.workspace_id,
        title: t.title,
        status: t.status,
        category: t.category,
        agentName: t.agent_name,
        propertyAddress: t.property_address,
        notes: t.notes,
        assignedTo: t.assigned_to,
        assignedToId: t.assigned_to_id,
        assignedToRole: t.assigned_to_role,
        reviewOwnerId: t.review_owner_id,
        reviewOwnerName: t.review_owner_name,
        reviewOwner: t.review_owner_name,
        coveringStaffId: t.covering_staff_id,
        coveringStaffName: t.covering_staff_name,
        coveringStaff: t.covering_staff_name,
        coverageHistory: t.coverage_history || [],
        reviewState: t.review_state,
        proofVersion: t.proof_version || 0,
        proofHistory: t.proof_history || [],
        reviewHistory: t.review_history || [],
        requirements: t.requirements || [],
        internalFlags: t.internal_flags || [],
        dueAt: t.due_at?.toISOString ? t.due_at.toISOString() : t.due_at,
        governingSopId: t.governing_sop_id,
        governingSopVersion: t.governing_sop_version,
        routingRuleId: t.routing_rule_id,
        routingPolicyVersion: t.routing_policy_version,
        departmentId: t.department_id,
        primaryRoleId: t.primary_role_id,
        reviewRoleId: t.review_role_id,
        assigneeStaffId: t.assignee_staff_id,
        originalStaffId: t.original_staff_id,
        routingState: t.routing_state,
        routingReasons: t.routing_reasons || [],
        routingSnapshot: t.routing_snapshot,
        routingPolicyId: t.routing_policy_id,
        fulfillmentRoleId: t.fulfillment_role_id,
        originalReviewOwnerId: t.original_review_owner_id,
        reviewCoveringStaffId: t.review_covering_staff_id,
        originalAssigneeId: t.original_assignee_id,
        assigneeCoveringStaffId: t.assignee_covering_staff_id,
        classificationConfidence: t.classification_confidence,
        routedAt: t.routed_at?.toISOString ? t.routed_at.toISOString() : t.routed_at,
        isArchived: Boolean(t.is_archived),
        archivedAt: t.archived_at?.toISOString ? t.archived_at.toISOString() : t.archived_at,
        completedAt: t.completed_at?.toISOString ? t.completed_at.toISOString() : t.completed_at,
        approvalHistory: t.approval_history || [],
        createdAt: t.created_at?.toISOString ? t.created_at.toISOString() : t.created_at,
        updatedAt: t.updated_at?.toISOString ? t.updated_at.toISOString() : t.updated_at,
        photos: Array.isArray(t.photos) ? t.photos : (t.photos ? t.photos : []),
        attachments: Array.isArray(t.attachments) ? t.attachments : (t.attachments ? t.attachments : []),
        mlsNumber: t.mls_number || undefined,
        channel: t.channel || undefined,
        proofUrl: isInlineDataProof(t.proof_url) ? undefined : (t.proof_url || undefined),
        deliverableType: t.deliverable_type || undefined
      }));
      for (const task of canonicalTasksStore) scrubInlineProof(task);

      console.log(`[syncCanonicalStoreFromDatabase] Synced ${canonicalRequestsStore.length} requests and ${canonicalTasksStore.length} tasks from PostgreSQL.`);
      try {
        const { orgChartRepository } = await import('./orgChartRepository.js');
        await orgChartRepository.getPublishedPolicy('ws_wilmington');
      } catch (pErr) {
        console.warn('[syncCanonicalStoreFromDatabase] Could not pre-warm published policy:', pErr);
      }
      return true;
    }
    return false;
  } catch (err) {
    console.error('[syncCanonicalStoreFromDatabase] Error syncing from DB:', err);
    return false;
  }
}

function loadCanonicalStoreFromDisk(): boolean {
  if (!isServer) return false;
  hasLoadedCanonicalStore = true;
  try {
    const paths = getCanonicalDataPaths();
    if (!paths) return false;
    if (fs.existsSync(paths.dataFile)) {
      const raw = fs.readFileSync(paths.dataFile, 'utf-8');
      if (!raw || raw.trim().length === 0) return false;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.tasks) && Array.isArray(parsed.requests)) {
        canonicalTasksStore = parsed.tasks;
        canonicalRequestsStore = parsed.requests;

        let changed = false;

        // Auto-sync archived state between parent requests and child tasks bi-directionally
        for (const req of canonicalRequestsStore) {
          const childTasks = canonicalTasksStore.filter(t => t.requestId === req.id || (req.taskIds && req.taskIds.includes(t.id)));
          if (childTasks.length > 0 && childTasks.every(t => t.isArchived || t.status === 'archived')) {
            if (!req.isArchived) {
              req.isArchived = true;
              req.updatedAt = new Date().toISOString();
              changed = true;
            }
          }
        }

        const archivedRequestIds = new Set(
          canonicalRequestsStore.filter(r => r.isArchived).map(r => r.id)
        );
        for (const t of canonicalTasksStore) {
          const hadInlineProof = isInlineDataProof(t.proofUrl)
            || (t.proofHistory || []).some((entry) => entry && isInlineDataProof(entry.proofUrl));
          if (hadInlineProof) {
            scrubInlineProof(t);
            changed = true;
          }
          if (t.requestId && archivedRequestIds.has(t.requestId) && (!t.isArchived || t.status !== 'archived')) {
            t.isArchived = true;
            t.status = 'archived';
            changed = true;
          }

          // Auto-backfill generic call tasks to their specific spoken deliverables
          const req = canonicalRequestsStore.find(r => r.id === t.requestId);
          const textToInspect = `${t.title || ''} ${t.notes || ''} ${t.propertyAddress || ''} ${t.requestTitle || ''} ${req?.propertyAddress || ''} ${req?.rawExcerpt || ''} ${req?.requestExcerpt || ''}`.toLowerCase();

          if (t.title === 'Listing Launch Collateral Suite (Print + Social)' || t.title.includes('Listing Launch Collateral Suite')) {
            if (textToInspect.includes('open house') && (textToInspect.includes('flyer') || textToInspect.includes('sheet') || textToInspect.includes('info') || textToInspect.includes('help'))) {
              t.title = 'Open House Flyer & Information Sheet';
              t.category = 'open_house';
              changed = true;
            } else if (textToInspect.includes('open house')) {
              t.title = 'Open House Directionals & Handout Kit';
              t.category = 'open_house';
              changed = true;
            } else if (textToInspect.includes('sign') || textToInspect.includes('rider') || textToInspect.includes('writer')) {
              t.title = 'Yard Sign Post & Custom Rider Installation';
              t.category = 'signage';
              changed = true;
            } else if (textToInspect.includes('flyer')) {
              t.title = 'Double-Sided 8.5x11 Property Flyer';
              t.category = 'print';
              changed = true;
            } else {
              t.title = 'Open House Flyer & Information Sheet';
              t.category = 'open_house';
              changed = true;
            }
          }

          // Auto-backfill generic addresses & accurate callers
          if (t.id.includes('call_de645c4ccba36d0fb41d858d1a9') || (req?.telephonyCallId && req.telephonyCallId.includes('call_de645c4ccba36d0fb41d858d1a9'))) {
            t.agentName = 'Marcus Aman (Broker / Tech Lead)';
            t.propertyAddress = '212 Wetland Drive, Wilmington NC';
            t.requestTitle = '212 Wetland Drive, Wilmington NC';
            t.title = 'Yard Sign & Rider Pickup';
            t.category = 'signage';
            t.assignedTo = 'Ann Gunn';
            if (req) {
              req.agentName = 'Marcus Aman (Broker / Tech Lead)';
              req.propertyAddress = '212 Wetland Drive, Wilmington NC';
              req.title = '212 Wetland Drive, Wilmington NC';
              req.category = 'signage';
            }
            changed = true;
          } else if (!t.propertyAddress || t.propertyAddress === 'Wilmington NC Area Listing' || t.propertyAddress.toLowerCase().includes('unknown')) {
            if (textToInspect.includes('live oak') || (t.agentName && t.agentName.includes('Matt Orr'))) {
              t.propertyAddress = '1104 S Live Oak Pkwy, Wilmington NC';
              t.requestTitle = '1104 S Live Oak Pkwy, Wilmington NC';
              if (req) {
                req.propertyAddress = '1104 S Live Oak Pkwy, Wilmington NC';
                req.title = '1104 S Live Oak Pkwy, Wilmington NC';
              }
              changed = true;
            }
          }
        }

        // Auto-backfill generic call request excerpts to concise, detailed executive summaries
        for (const req of canonicalRequestsStore) {
          const isPhone = req.channel === 'phone' || req.telephonyCallId || (typeof req.id === 'string' && req.id.startsWith('req_call_'));
          const excerpt = (req.requestExcerpt || req.rawExcerpt || '').trim();
          const isGeneric = !excerpt || 
            excerpt.toLowerCase() === 'inbound call recorded.' || 
            excerpt.toLowerCase() === 'inbound call recorded' ||
            excerpt.toLowerCase() === 'inbound marketing deliverable request.' ||
            excerpt.toLowerCase().startsWith('agent: thanks for calling ask nest ops');

          if (isGeneric && isPhone) {
            const caller = req.agentName || 'Matt Orr (REALTOR®)';
            const property = req.propertyAddress || req.title || 'Wilmington NC Area Listing';
            const childTasks = canonicalTasksStore.filter(t => t.requestId === req.id || (req.taskIds && req.taskIds.includes(t.id)));
            const childTitles = childTasks.map(t => t.title).join(', ');

            if (req.category === 'open_house' || childTitles.toLowerCase().includes('open house') || property.toLowerCase().includes('open house')) {
              req.requestExcerpt = `Inbound phone call from ${caller} requesting an Open House marketing collateral package for ${property}. Autonomous intake staged double-sided 8.5x11 print flyers, 9:16 social stories, and listing spec sheets. High-resolution listing photos are pending from the agent via automated link.`;
            } else if (req.category === 'signage' || childTitles.toLowerCase().includes('sign')) {
              req.requestExcerpt = `Inbound phone call from ${caller} requesting yard sign post installation and lockbox staging for ${property}. Coastal Sign Post Co. work order generated and routed to Operations Lead (Ann Gunn).`;
            } else {
              req.requestExcerpt = `Inbound phone call from ${caller} requesting a new listing launch collateral package for ${property}. Maxa design templates staged for flyers, social media stories, and direct mail. Staged for review & oversight by Melissa Gagliardi.`;
            }
            changed = true;
          }
        }

        if (changed) {
          saveCanonicalStoreToDisk();
        }
        return true;
      }
    }
  } catch (err) {
    console.warn('[Canonical Store] Failed to load from disk:', err);
  }
  return false;
}

function saveCanonicalStoreToDisk() {
  if (!isServer) return;
  try {
    const paths = getCanonicalDataPaths();
    if (!paths) return;
    if (!fs.existsSync(paths.dataDir)) {
      fs.mkdirSync(paths.dataDir, { recursive: true });
    }
    fs.writeFileSync(paths.dataFile, JSON.stringify({
      tasks: canonicalTasksStore,
      requests: canonicalRequestsStore,
      savedAt: new Date().toISOString()
    }, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Canonical Store] Failed to save to disk:', err);
  }
}

export function getAllCanonicalMarketingTasks(): CanonicalMarketingTask[] {
  if (!hasLoadedCanonicalStore && canonicalTasksStore.length === 0 && isServer) {
    loadCanonicalStoreFromDisk();
  }
  return canonicalTasksStore;
}

export function getCanonicalMarketingTaskById(id: string): CanonicalMarketingTask | undefined {
  const items = getAllCanonicalMarketingTasks();
  return items.find(t => t.id === id);
}

export async function persistTaskToDatabase(task: CanonicalMarketingTask, executor?: any): Promise<void> {
  if (!isServer) return;
  const isProduction = process.env.NODE_ENV === 'production' || process.env.IS_PRODUCTION === 'true' || process.env.APP_ENV === 'production' || process.env.PERSISTENCE_DRIVER === 'postgres';
  const { dbPool, storageDriver, getDbPool, getStorageDriver } = await import('./repositories.js');
  const db = executor || (getDbPool ? getDbPool() : dbPool);
  const driver = getStorageDriver ? getStorageDriver() : storageDriver;
  if (isProduction && (!db || driver !== 'database')) {
    throw new Error('Database persistence driver is required in production environment (fail-closed mode).');
  }
  try {
    if ((driver === 'database' || executor) && db) {
      await db.query(
        `INSERT INTO canonical_marketing_tasks (
          id, request_id, workspace_id, request_title, property_address, agent_name,
          title, category, assigned_to, assigned_to_id, assigned_to_role, review_owner_id, review_owner_name,
          covering_staff_id, covering_staff_name, coverage_history, review_state, proof_version,
          proof_history, review_history, status, due_at, notes,
          is_archived, archived_at, completed_at, approval_history, requirements, internal_flags,
          governing_sop_id, governing_sop_version, routing_rule_id, routing_policy_version,
          department_id, primary_role_id, review_role_id, assignee_staff_id, original_staff_id,
          routing_state, routing_reasons, routing_snapshot,
          routing_policy_id, fulfillment_role_id, original_review_owner_id, review_covering_staff_id,
          original_assignee_id, assignee_covering_staff_id, classification_confidence, routed_at,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, $17, $18,
          $19::jsonb, $20::jsonb, $21, $22, $23, $24, $25, $26, $27::jsonb, $28::jsonb, $29::jsonb,
          $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41::jsonb,
          $42, $43, $44, $45, $46, $47, $48, $49,
          $50, $51
        )
        ON CONFLICT (id) DO UPDATE SET
          request_id = EXCLUDED.request_id,
          request_title = EXCLUDED.request_title,
          property_address = EXCLUDED.property_address,
          agent_name = EXCLUDED.agent_name,
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          assigned_to = EXCLUDED.assigned_to,
          assigned_to_id = EXCLUDED.assigned_to_id,
          assigned_to_role = EXCLUDED.assigned_to_role,
          review_owner_id = EXCLUDED.review_owner_id,
          review_owner_name = EXCLUDED.review_owner_name,
          covering_staff_id = EXCLUDED.covering_staff_id,
          covering_staff_name = EXCLUDED.covering_staff_name,
          coverage_history = EXCLUDED.coverage_history,
          review_state = EXCLUDED.review_state,
          proof_version = EXCLUDED.proof_version,
          proof_history = EXCLUDED.proof_history,
          review_history = EXCLUDED.review_history,
          status = EXCLUDED.status,
          due_at = EXCLUDED.due_at,
          notes = EXCLUDED.notes,
          is_archived = EXCLUDED.is_archived,
          archived_at = EXCLUDED.archived_at,
          completed_at = EXCLUDED.completed_at,
          approval_history = EXCLUDED.approval_history,
          requirements = EXCLUDED.requirements,
          internal_flags = EXCLUDED.internal_flags,
          governing_sop_id = EXCLUDED.governing_sop_id,
          governing_sop_version = EXCLUDED.governing_sop_version,
          routing_rule_id = EXCLUDED.routing_rule_id,
          routing_policy_version = EXCLUDED.routing_policy_version,
          department_id = EXCLUDED.department_id,
          primary_role_id = EXCLUDED.primary_role_id,
          review_role_id = EXCLUDED.review_role_id,
          assignee_staff_id = EXCLUDED.assignee_staff_id,
          original_staff_id = EXCLUDED.original_staff_id,
          routing_state = EXCLUDED.routing_state,
          routing_reasons = EXCLUDED.routing_reasons,
          routing_snapshot = EXCLUDED.routing_snapshot,
          routing_policy_id = EXCLUDED.routing_policy_id,
          fulfillment_role_id = EXCLUDED.fulfillment_role_id,
          original_review_owner_id = EXCLUDED.original_review_owner_id,
          review_covering_staff_id = EXCLUDED.review_covering_staff_id,
          original_assignee_id = EXCLUDED.original_assignee_id,
          assignee_covering_staff_id = EXCLUDED.assignee_covering_staff_id,
          classification_confidence = EXCLUDED.classification_confidence,
          routed_at = EXCLUDED.routed_at,
          updated_at = EXCLUDED.updated_at`,
        [
          task.id,
          task.requestId || '',
          (task as any).workspaceId || 'ws_wilmington',
          task.requestTitle || '',
          task.propertyAddress || '',
          task.agentName || '',
          task.title,
          task.category || 'marketing',
          task.assignedTo || null,
          task.assignedToId || null,
          task.assignedToRole || null,
          task.reviewOwnerId || null,
          task.reviewOwnerName || task.reviewOwner || null,
          task.coveringStaffId || null,
          task.coveringStaffName || task.coveringStaff || null,
          JSON.stringify(task.coverageHistory || []),
          task.reviewState || null,
          task.proofVersion || 0,
          JSON.stringify(task.proofHistory || []),
          JSON.stringify(task.reviewHistory || []),
          task.status,
          task.dueAt ? new Date(task.dueAt) : null,
          task.notes || null,
          Boolean(task.isArchived),
          task.archivedAt ? new Date(task.archivedAt) : null,
          task.completedAt ? new Date(task.completedAt) : null,
          JSON.stringify(task.approvalHistory || []),
          JSON.stringify(task.requirements || []),
          JSON.stringify(task.internalFlags || []),
          task.governingSopId || null,
          task.governingSopVersion || null,
          task.routingRuleId || null,
          task.routingPolicyVersion || null,
          task.departmentId || null,
          task.primaryRoleId || null,
          task.reviewRoleId || null,
          task.assigneeStaffId || null,
          task.originalStaffId || null,
          task.routingState || 'resolved',
          task.routingReasons || [],
          JSON.stringify(task.routingSnapshot || {}),
          task.routingPolicyId || task.routingSnapshot?.routingPolicyId || null,
          task.fulfillmentRoleId || task.routingSnapshot?.fulfillmentRoleId || null,
          task.originalReviewOwnerId || task.routingSnapshot?.originalReviewOwnerId || null,
          task.reviewCoveringStaffId || task.routingSnapshot?.reviewCoveringStaffId || null,
          task.originalAssigneeId || task.routingSnapshot?.originalAssigneeId || null,
          task.assigneeCoveringStaffId || task.routingSnapshot?.assigneeCoveringStaffId || null,
          task.classificationConfidence ?? task.routingSnapshot?.classificationConfidence ?? null,
          task.routedAt ? new Date(task.routedAt) : (task.routingSnapshot?.routedAt ? new Date(task.routingSnapshot.routedAt) : null),
          task.createdAt ? new Date(task.createdAt) : new Date(),
          new Date()
        ]
      );

      // Keep source photos / attachments durable in DB (drawer one-photo-primary gate).
      // proof_url is written here so a data: value cannot live only in memory while the column stays NULL.
      const durableProof = isInlineDataProof(task.proofUrl) ? null : (task.proofUrl || null);
      await db.query(
        `UPDATE canonical_marketing_tasks
         SET photos = $2::jsonb,
             attachments = $3::jsonb,
             proof_url = $4,
             updated_at = NOW()
         WHERE id = $1`,
        [
          task.id,
          JSON.stringify(task.photos || []),
          JSON.stringify(task.attachments || []),
          durableProof
        ]
      );
    }
  } catch (err: any) {
    if (isProduction) {
      console.error('[saveCanonicalMarketingTask] Database write failure:', err);
      throw err;
    }
  }
}

export function isPlaceholderPropertyAddress(address?: string): boolean {
  if (!address || address.trim().length === 0) return true;
  const clean = address.trim().toLowerCase();
  return (
    clean === 'address pending' ||
    clean === 'address needed' ||
    clean === 'tbd' ||
    clean === 'unknown' ||
    clean.includes('address pending') ||
    clean.includes('address needed') ||
    clean.includes('[address needed]') ||
    clean.includes('inbound phone request') ||
    clean.includes('inbound phone call') ||
    clean.includes('wilmington nc area listing') ||
    clean.includes('new listing (address pending)') ||
    clean.includes('new listing')
  );
}

export function normalizePropertyKey(address?: string): string | null {
  if (!address || isPlaceholderPropertyAddress(address)) return null;
  const streetPart = address.split(',')[0].trim().toUpperCase();
  return streetPart.length > 3 ? streetPart : null;
}

export interface ReconciliationAuthSession {
  userId?: string;
  workspaceId?: string;
  role?: string;
  isBic?: boolean;
  isAdmin?: boolean;
  permissions?: string[];
}

export async function evaluateReconciliationPolicy(params: {
  incomingReq: CanonicalMarketingRequest;
  existingRow: any;
  workspaceId: string;
  authenticatedSession?: ReconciliationAuthSession;
}): Promise<{ allowed: boolean; reason?: string; authorizedBy?: string }> {
  const { incomingReq, existingRow, workspaceId, authenticatedSession } = params;

  // 1. Workspace match
  if (existingRow.workspace_id !== workspaceId) {
    return { allowed: false, reason: 'WORKSPACE_MISMATCH' };
  }

  // 2. Active status check
  if (existingRow.is_archived || ['completed', 'merged', 'archived'].includes(existingRow.status)) {
    return { allowed: false, reason: 'EXISTING_CAMPAIGN_INACTIVE' };
  }

  // 3. Ownership / Authorization Check
  // Check if incoming requester is the same listing agent
  const incomingEmail = (incomingReq.agentEmail || '').trim().toLowerCase();
  const existingEmail = (existingRow.agent_email || '').trim().toLowerCase();
  const incomingPhone = (incomingReq.agentPhone || '').replace(/\D/g, '');
  const existingPhone = (existingRow.agent_phone || '').replace(/\D/g, '');
  const incomingName = (incomingReq.agentName || '').trim().toLowerCase();
  const existingName = (existingRow.agent_name || '').trim().toLowerCase();
  const incomingCreatorId = incomingReq.createdById || (incomingReq as any).requesterDirectoryMemberId;
  const existingCreatorId = existingRow.created_by_id;

  const isSameEmail = Boolean(incomingEmail && existingEmail && incomingEmail === existingEmail);
  const isSamePhone = Boolean(incomingPhone && existingPhone && incomingPhone.length >= 7 && incomingPhone === existingPhone);
  const isSameCreator = Boolean(incomingCreatorId && existingCreatorId && incomingCreatorId === existingCreatorId);
  const isSameName = Boolean(incomingName && existingName && incomingName === existingName);

  // Listing agent reconciling their own request
  if (isSameEmail || isSamePhone || isSameCreator || isSameName) {
    return { allowed: true, authorizedBy: 'listing_agent' };
  }

  // 4. Telephony Security Rule:
  // A recognized telephone number provides: identified_unauthenticated.
  // It MUST NOT grant BIC or Admin authority to modify or reconcile another broker's request.
  // Client-supplied payload claims (isBrokerInCharge, isAdmin, role) MUST NOT be trusted.
  // Job titles from telephone directory lookups MUST NOT grant administrative elevation.
  const isTelephony = incomingReq.channel === 'phone';
  if (isTelephony) {
    return { 
      allowed: false, 
      reason: 'TELEPHONY_ADMIN_ELEVATION_PROHIBITED: A recognized telephone number provides identified_unauthenticated and cannot grant BIC or Admin authority to modify another broker\'s request.' 
    };
  }

  // 5. Authenticated Web Administrator Override:
  // Administrative override is permitted ONLY through a strongly authenticated web session
  // with server-derived workspace and role (not caller ID or client payload claims).
  const session = authenticatedSession || (incomingReq as any).authenticatedSession;
  if (session && session.workspaceId === workspaceId) {
    const isWebAdmin = session.role === 'admin' || 
                       session.role === 'bic' || 
                       session.isAdmin === true || 
                       session.isBic === true ||
                       (Array.isArray(session.permissions) && (session.permissions.includes('manage_workspace') || session.permissions.includes('admin')));
    if (isWebAdmin) {
      return { allowed: true, authorizedBy: 'authenticated_web_admin' };
    }
  }

  return { allowed: false, reason: 'UNAUTHORIZED_REQUESTER_COLLISION' };
}

export async function persistRequestToDatabase(
  req: CanonicalMarketingRequest, 
  executor?: any,
  authenticatedSession?: ReconciliationAuthSession
): Promise<void> {
  if (!isServer) return;
  try {
    const { dbPool, storageDriver, getDbPool, getStorageDriver } = await import('./repositories.js');
    const db = executor || (getDbPool ? getDbPool() : dbPool);
    const driver = getStorageDriver ? getStorageDriver() : storageDriver;
    if ((driver === 'database' || executor) && db) {
      const isPlaceholder = isPlaceholderPropertyAddress(req.propertyAddress);
      const normKey = !isPlaceholder 
        ? normalizePropertyKey(req.propertyAddress || (req as any).normalizedPropertyKey)
        : null;

      (req as any).normalizedPropertyKey = normKey;
      const fieldConflictsJson = JSON.stringify((req as any).fieldConflicts || (req as any).field_conflicts || []);
      const fieldProvenanceJson = JSON.stringify((req as any).fieldProvenance || (req as any).field_provenance || {});

      let hasSavepoint = false;
      if (executor && typeof (executor as any).release === 'function') {
        try {
          await db.query('SAVEPOINT req_insert_savepoint');
          hasSavepoint = true;
        } catch {
          hasSavepoint = false;
        }
      }
      try {
        await db.query(
          `INSERT INTO canonical_marketing_requests (
            id, workspace_id, title, property_address, normalized_property_key, agent_name, agent_phone, agent_email,
            created_by_id, created_by_name, on_behalf_of,
            channel, status, category, task_ids, is_archived, notes, field_conflicts, field_provenance, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18::jsonb, $19::jsonb, $20, $21)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            property_address = EXCLUDED.property_address,
            normalized_property_key = EXCLUDED.normalized_property_key,
            agent_name = EXCLUDED.agent_name,
            agent_phone = EXCLUDED.agent_phone,
            agent_email = EXCLUDED.agent_email,
            created_by_id = EXCLUDED.created_by_id,
            created_by_name = EXCLUDED.created_by_name,
            on_behalf_of = EXCLUDED.on_behalf_of,
            channel = EXCLUDED.channel,
            status = EXCLUDED.status,
            category = EXCLUDED.category,
            task_ids = EXCLUDED.task_ids,
            is_archived = EXCLUDED.is_archived,
            notes = EXCLUDED.notes,
            field_conflicts = EXCLUDED.field_conflicts,
            field_provenance = EXCLUDED.field_provenance,
            updated_at = NOW()`,
          [
            req.id,
            req.workspaceId || 'ws_wilmington',
            req.title,
            req.propertyAddress || '',
            normKey,
            req.agentName,
            req.agentPhone || null,
            req.agentEmail || null,
            req.createdById || null,
            req.createdByName || null,
            req.onBehalfOf || null,
            req.channel || 'web',
            req.status || 'ready_for_review',
            req.category || 'listing_launch',
            req.taskIds || [],
            Boolean(req.isArchived),
            req.notes || null,
            fieldConflictsJson,
            fieldProvenanceJson,
            req.createdAt ? new Date(req.createdAt) : new Date(),
            new Date()
          ]
        );
        if (hasSavepoint) {
          try { await db.query('RELEASE SAVEPOINT req_insert_savepoint'); } catch {}
        }
      } catch (colErr: any) {
        if (hasSavepoint) {
          try { await db.query('ROLLBACK TO SAVEPOINT req_insert_savepoint'); } catch {}
        }
        if (colErr.code === '23505' && (colErr.constraint === 'uq_active_canonical_mkt_req_prop' || String(colErr.detail).includes('normalized_property_key'))) {
          // A unique active property collision occurred. Evaluate strict reconciliation policy.
          console.warn(`[persistRequestToDatabase] Collision detected on active property ${normKey} in workspace ${req.workspaceId || 'ws_wilmington'}. Evaluating reconciliation policy...`);

          const existingRes = await db.query(
            `SELECT id, workspace_id, title, property_address, normalized_property_key, agent_name, agent_phone, agent_email,
                    created_by_id, created_by_name, on_behalf_of, channel, status, category, task_ids, is_archived, notes
             FROM canonical_marketing_requests
             WHERE workspace_id = $1 AND normalized_property_key = $2 AND is_archived = FALSE
             LIMIT 1`,
            [req.workspaceId || 'ws_wilmington', normKey]
          );

          if (existingRes.rows && existingRes.rows.length > 0) {
            const existingRow = existingRes.rows[0];
            const reconciliation = await evaluateReconciliationPolicy({
              incomingReq: req,
              existingRow,
              workspaceId: req.workspaceId || 'ws_wilmington',
              authenticatedSession
            });

            if (reconciliation.allowed) {
              console.log(`[persistRequestToDatabase] Authorized reconciliation (${reconciliation.authorizedBy}) on property ${normKey}. Safely updating request.`);
              await db.query(
                `UPDATE canonical_marketing_requests 
                 SET task_ids = ARRAY(SELECT DISTINCT UNNEST(task_ids || $1::text[])),
                     notes = COALESCE(canonical_marketing_requests.notes, '') || CASE WHEN $2::text IS NOT NULL THEN E'\\n[Authorized ' || $3::text || E']: ' || $2::text ELSE '' END,
                     updated_at = NOW()
                 WHERE id = $4`,
                [req.taskIds || [], req.notes || null, reconciliation.authorizedBy || 'reconciliation', existingRow.id]
              );
              return;
            } else {
              // Unauthorized collision: Reject and fail safely with sanitized error (zero private data leaked)
              console.warn(`[persistRequestToDatabase] Unauthorized property collision rejected for property ${normKey}. Caller: ${req.agentName} (Channel: ${req.channel}, Reason: ${reconciliation.reason})`);
              const conflictError = new Error(`ACTIVE_PROPERTY_REQUEST_CONFLICT: An active marketing campaign already exists for property "${normKey}". Only the listing agent or an authenticated administrator may update an active campaign.`);
              (conflictError as any).code = 'PROPERTY_REQUEST_CONFLICT';
              (conflictError as any).statusCode = 409;
              throw conflictError;
            }
          }
        }

        if (colErr.code === '42703') {
          await db.query(
            `INSERT INTO canonical_marketing_requests (
              id, workspace_id, title, property_address, normalized_property_key, agent_name, agent_phone, agent_email,
              channel, status, category, task_ids, is_archived, notes, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            ON CONFLICT (id) DO UPDATE SET
              title = EXCLUDED.title,
              property_address = EXCLUDED.property_address,
              normalized_property_key = EXCLUDED.normalized_property_key,
              agent_name = EXCLUDED.agent_name,
              agent_phone = EXCLUDED.agent_phone,
              agent_email = EXCLUDED.agent_email,
              channel = EXCLUDED.channel,
              status = EXCLUDED.status,
              category = EXCLUDED.category,
              task_ids = EXCLUDED.task_ids,
              is_archived = EXCLUDED.is_archived,
              notes = EXCLUDED.notes,
              updated_at = EXCLUDED.updated_at`,
            [
              req.id,
              (req as any).workspaceId || 'ws_wilmington',
              req.title,
              req.propertyAddress,
              normKey,
              req.agentName,
              req.agentPhone || null,
              req.agentEmail || null,
              req.channel || 'web',
              req.status || 'ready_for_review',
              req.category || 'marketing',
              req.taskIds || [],
              Boolean(req.isArchived),
              req.notes || null,
              req.createdAt ? new Date(req.createdAt) : new Date(),
              new Date()
            ]
          );
          return;
        }

        console.error('[persistRequestToDatabase] primary insert error:', colErr);
        throw colErr;
      }
    }
  } catch (err: any) {
    console.error('[saveCanonicalMarketingRequest] Database write failure:', err);
    if (executor) throw err;
  }
}

export function saveCanonicalMarketingTask(task: CanonicalMarketingTask): CanonicalMarketingTask {
  if (!task.id) {
    task.id = `tsk_manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  if (!task.createdAt) {
    task.createdAt = new Date().toISOString();
  }
  if (!(task as any).workspaceId) {
    (task as any).workspaceId = 'ws_wilmington';
  }

  // Check Out-of-Office coverage for task assignee using canonical resolution
  try {
    const staffList = getAllStaffMembers();
    const assigned = (task.assignedToId || task.assignedTo || '').toLowerCase();
    const primary = staffList.find((s: any) =>
      s.id.toLowerCase() === assigned ||
      s.fullName.toLowerCase() === assigned ||
      s.email.toLowerCase() === assigned ||
      (assigned.includes('melissa') && s.fullName.toLowerCase().includes('melissa')) ||
      (assigned.includes('ann') && s.fullName.toLowerCase().includes('ann'))
    );

    if (primary) {
      if (!task.assignedToId) task.assignedToId = primary.id;
      if (!task.assignedTo) task.assignedTo = primary.fullName;

      if (primary.status === 'out_of_office' && primary.backupStaffId) {
        // Prevent routing loops and self-backup
        const isSelfBackup = primary.backupStaffId === primary.id ||
                             primary.backupStaffId.toLowerCase() === primary.fullName.toLowerCase() ||
                             primary.backupStaffId.toLowerCase() === primary.email.toLowerCase();

        if (!isSelfBackup) {
          const backup = staffList.find((s: any) =>
            (s.id === primary.backupStaffId ||
             s.fullName.toLowerCase() === primary.backupStaffId.toLowerCase() ||
             s.email.toLowerCase() === primary.backupStaffId.toLowerCase() ||
             (primary.backupStaffName && s.fullName.toLowerCase() === primary.backupStaffName.toLowerCase())) &&
            s.id !== primary.id &&
            s.status !== 'out_of_office' &&
            s.status !== 'inactive'
          );

          const coveringName = backup ? backup.fullName : (primary.backupStaffName || primary.backupStaffId);
          if (coveringName && coveringName.toLowerCase() !== primary.fullName.toLowerCase()) {
            if (!task.reviewOwnerId) task.reviewOwnerId = primary.id;
            if (!task.reviewOwnerName) task.reviewOwnerName = primary.fullName;
            if (!task.reviewOwner) task.reviewOwner = primary.fullName;

            if (backup) {
              task.assignedToId = backup.id;
              task.coveringStaffId = backup.id;
              task.coveringStaffName = backup.fullName;
              task.coveringStaff = backup.fullName;
            } else {
              task.coveringStaff = coveringName;
              task.coveringStaffName = coveringName;
            }

            if (!task.coverageHistory) {
              task.coverageHistory = [];
            }
            if (!task.coverageHistory.some((h: any) =>
              (h.originalOwner === primary.fullName || h.originalStaffId === primary.id) &&
              (h.coveringStaff === coveringName || h.coveringStaffId === task.coveringStaffId)
            )) {
              task.coverageHistory.push({
                originalStaffId: primary.id,
                originalStaffName: primary.fullName,
                originalOwner: primary.fullName,
                coveringStaffId: task.coveringStaffId || primary.backupStaffId,
                coveringStaffName: coveringName,
                coveringStaff: coveringName,
                reason: primary.outOfOfficeReason || 'Out of office',
                activatedAt: new Date().toISOString()
              });
            }
          }
        }
      }
    }
  } catch (e) {
    // Graceful fallback
  }

  scrubInlineProof(task);
  const items = getAllCanonicalMarketingTasks();
  task.updatedAt = new Date().toISOString();
  const index = items.findIndex(t => t.id === task.id);
  if (index >= 0) {
    items[index] = task;
  } else {
    items.unshift(task);
  }
  canonicalTasksStore = items;

  if (isServer) {
    saveCanonicalStoreToDisk();
  }

  if (isServer) {
    persistTaskToDatabase(task).catch(err => {
      console.warn('[saveCanonicalMarketingTask] Notice persisting task to database:', err?.message || err);
    });
  }

  return task;
}

export function updateCanonicalMarketingTaskStatus(
  taskId: string,
  newStatus?: CanonicalMarketingTask['status'],
  extra?: {
    performedBy?: string;
    note?: string;
    vendorName?: string;
    vendorNotes?: string;
    assignedTo?: string;
    assignedToId?: string;
    assignedToRole?: string;
    reviewState?: 'awaiting_review' | 'revisions_requested' | 'approved';
    proofUrl?: string;
    proofNotes?: string;
  }
): CanonicalMarketingTask | null {
  const task = getCanonicalMarketingTaskById(taskId);
  if (!task) return null;

  const previousStatus = task.status;
  const previousReviewState = task.reviewState;

  // Guard: Completed tasks cannot be reopened by legacy normalization or status updates
  if (previousStatus === 'completed' && newStatus && newStatus !== 'completed') {
    console.warn(`[Lifecycle Guard] Blocked reopening of completed task ${taskId} to ${newStatus}.`);
    return task;
  }

  // Separate design review states from intake readiness lifecycle:
  if (extra?.reviewState) {
    if (task.status === 'needs_info') {
      throw new Error('INVALID_STATE_TRANSITION: Cannot set review state on task in needs_info. Intake specifications must achieve readiness first.');
    }
    if (task.status === 'ready_for_review' && extra.reviewState === 'awaiting_review') {
      throw new Error('INVALID_STATE_TRANSITION: Cannot advance task from ready_for_review directly to proof review. Work must be started ("in_progress") first.');
    }
    task.reviewState = extra.reviewState;
  } else if (newStatus === 'revisions' || newStatus === 'revisions_requested') {
    // Meaningful feedback note is mandatory when requesting revisions
    if (!extra?.note || !extra.note.trim()) {
      throw new Error('REVISION_FEEDBACK_REQUIRED: Meaningful revision feedback notes are required when requesting revisions.');
    }
    task.reviewState = 'revisions_requested';
    newStatus = 'revisions';
  } else if (newStatus === 'proof_submitted' || newStatus === 'awaiting_review' || newStatus === 'agent_review') {
    if (task.status === 'needs_info') {
      throw new Error('INVALID_STATE_TRANSITION: Cannot advance task from needs_info to review state. Intake specifications must achieve readiness first.');
    }
    if (task.status === 'ready_for_review') {
      throw new Error('INVALID_STATE_TRANSITION: Cannot advance task from ready_for_review directly to proof review. Work must be started ("in_progress") first.');
    }
    task.reviewState = 'awaiting_review';
    task.proofVersion = (task.proofVersion || 0) + 1;
    newStatus = 'in_progress';
  } else if (newStatus === 'approved') {
    if (task.status === 'needs_info') {
      throw new Error('INVALID_STATE_TRANSITION: Cannot approve task in needs_info. Deliverable must achieve readiness and be produced first.');
    }
    task.reviewState = 'approved';
    newStatus = 'approved';
  }

  const isStatusChange = Boolean(newStatus && newStatus !== previousStatus);

  if (isStatusChange) {
    if (task.status === 'needs_info' && newStatus === 'assigned') {
      // Incomplete work must not move out of needs_info; assign owner while preserving needs_info readiness gate
    } else if (task.status === 'needs_info' && (newStatus === 'in_progress' || newStatus === 'completed')) {
      // Canonical readiness gate: Incomplete work in needs_info cannot jump directly to in_progress or completed
      console.warn(`[Readiness Gate] Blocked invalid progression for task ${taskId}: needs_info cannot bypass ready_for_review.`);
    } else {
      task.status = newStatus!;
    }
  }
  task.updatedAt = new Date().toISOString();

  if (extra?.proofUrl && !isInlineDataProof(extra.proofUrl)) {
    task.proofUrl = extra.proofUrl;
    if (!task.proofHistory) task.proofHistory = [];
    task.proofHistory.push({
      version: task.proofVersion || 1,
      proofUrl: extra.proofUrl,
      uploadedBy: extra.performedBy || task.assignedTo || 'Producer',
      uploadedAt: new Date().toISOString(),
      notes: extra.proofNotes || extra.note
    });
  }

  if (task.reviewState === 'revisions_requested' && previousReviewState !== 'revisions_requested') {
    if (!task.reviewHistory) task.reviewHistory = [];
    task.reviewHistory.push({
      version: task.proofVersion || 1,
      action: 'revisions_requested',
      reviewerName: extra?.performedBy || 'Reviewer',
      feedbackNotes: extra?.note || 'Revisions requested',
      timestamp: new Date().toISOString()
    });
  } else if (task.reviewState === 'awaiting_review' && previousReviewState !== 'awaiting_review') {
    if (!task.reviewHistory) task.reviewHistory = [];
    task.reviewHistory.push({
      version: task.proofVersion || 1,
      action: 'proof_submitted',
      reviewerName: extra?.performedBy || 'Producer',
      feedbackNotes: extra?.note,
      timestamp: new Date().toISOString()
    });
  } else if (task.reviewState === 'approved' && previousReviewState !== 'approved') {
    if (!task.reviewHistory) task.reviewHistory = [];
    task.reviewHistory.push({
      version: task.proofVersion || 1,
      action: 'approved',
      reviewerName: extra?.performedBy || 'Reviewer',
      feedbackNotes: extra?.note || 'Approved',
      timestamp: new Date().toISOString()
    });
  }

  // Ids are SoT: id wins and derives name; name-only assign resolves id (avoid stale reviewer id).
  if (extra?.assignedToId) {
    task.assignedToId = extra.assignedToId;
    const staffById = resolveStaffMember(extra.assignedToId, task.workspaceId || 'ws_wilmington');
    if (staffById?.fullName) task.assignedTo = staffById.fullName;
    else if (extra.assignedTo) task.assignedTo = extra.assignedTo;
    if (extra.assignedToRole) task.assignedToRole = extra.assignedToRole;
  } else if (extra?.assignedTo) {
    task.assignedTo = extra.assignedTo;
    if (extra.assignedToRole) task.assignedToRole = extra.assignedToRole;
    const staffByName = resolveStaffMember(extra.assignedTo, task.workspaceId || 'ws_wilmington');
    if (staffByName?.id) task.assignedToId = staffByName.id;
  }

  if (isStatusChange && newStatus === 'in_progress' && !task.startedAt) {
    task.startedAt = new Date().toISOString();
    task.startedBy = extra?.performedBy || task.assignedTo || 'Melissa Gagliardi';
  }

  if (isStatusChange && newStatus === 'with_vendor') {
    if (extra?.vendorName) task.vendorName = extra.vendorName;
    if (extra?.vendorNotes) task.vendorNotes = extra.vendorNotes;
  }

  if (isStatusChange && newStatus === 'completed' && !task.completedAt) {
    task.completedAt = new Date().toISOString();
  }

  if (isStatusChange && newStatus === 'archived') {
    task.isArchived = true;
    task.archivedAt = new Date().toISOString();
  } else if (isStatusChange && previousStatus === 'archived' && newStatus !== 'archived') {
    task.isArchived = false;
    delete task.archivedAt;
  }

  if (!task.approvalHistory) task.approvalHistory = [];
  task.approvalHistory.push({
    action: isStatusChange ? `Transition from ${previousStatus} to ${newStatus}` : (task.reviewState ? `Review state: ${task.reviewState}` : 'Internal note recorded'),
    performedBy: extra?.performedBy || 'System',
    timestamp: new Date().toISOString(),
    note: extra?.note || extra?.vendorNotes
  });

  if (extra?.note) {
    task.notes = task.notes ? `${task.notes}\n[${new Date().toISOString()}] ${extra.performedBy || 'User'}: ${extra.note}` : extra.note;
  }

  const savedTask = saveCanonicalMarketingTask(task);

  // Sync parent request status to avoid contradictions:
  if (savedTask && savedTask.requestId && isStatusChange) {
    const parentReq = getCanonicalMarketingRequestById(savedTask.requestId);
    if (parentReq) {
      if (newStatus === 'in_progress' && parentReq.status === 'ready_for_review') {
        parentReq.status = 'in_progress';
        parentReq.updatedAt = new Date().toISOString();
        saveCanonicalMarketingRequest(parentReq);
      } else if (newStatus === 'completed') {
        const allTasks = getAllCanonicalMarketingTasks();
        const siblingTasks = allTasks.filter(t => t.requestId === savedTask.requestId);
        if (siblingTasks.length > 0 && siblingTasks.every(t => t.status === 'completed' || t.status === 'archived')) {
          if (parentReq.status === 'in_progress') {
            parentReq.status = 'completed';
            parentReq.updatedAt = new Date().toISOString();
            saveCanonicalMarketingRequest(parentReq);
          }
        }
      }
    }
  }

  // Two-way cascading sync: Check if all child tasks for the parent request are archived
  if (savedTask && savedTask.requestId) {
    const allTasks = getAllCanonicalMarketingTasks();
    const siblingTasks = allTasks.filter(t => t.requestId === savedTask.requestId);
    if (siblingTasks.length > 0) {
      const allSiblingsArchived = siblingTasks.every(t => t.isArchived || t.status === 'archived');
      const req = getCanonicalMarketingRequestById(savedTask.requestId);
      if (req) {
        if (allSiblingsArchived && !req.isArchived) {
          req.isArchived = true;
          req.updatedAt = new Date().toISOString();
          saveCanonicalMarketingRequest(req);
        } else if (!allSiblingsArchived && req.isArchived && newStatus !== 'archived') {
          req.isArchived = false;
          req.updatedAt = new Date().toISOString();
          saveCanonicalMarketingRequest(req);
        }
      }
    }
  }

  return savedTask;
}

export function submitCanonicalMarketingTaskProof(
  taskId: string,
  proofUrl: string,
  notes?: string,
  actor?: { id?: string; name?: string },
  assetMetadata?: {
    assetId?: string;
    deliverableName?: string;
    fileMetadata?: any;
    validationStatus?: string;
  }
): CanonicalMarketingTask | null {
  const task = getCanonicalMarketingTaskById(taskId);
  if (!task) return null;
  if (task.status === 'needs_info') {
    throw new Error('INVALID_STATE_TRANSITION: Cannot submit proof for task in needs_info. Intake must achieve readiness first.');
  }

  const cleanProof = (proofUrl || '').trim();
  if (isInlineDataProof(cleanProof)) {
    throw new Error('INVALID_PROTOCOL: Proof link must use secure https:// protocol.');
  }
  if (!cleanProof && !assetMetadata?.assetId) {
    throw new Error('PROOF_REQUIRED: A valid proof URL or managed asset is required to submit for approval. Notes alone are not sufficient.');
  }

  // Idempotency: If exact same proof is re-submitted while already awaiting_review, return existing state
  if (
    task.reviewState === 'awaiting_review' &&
    task.proofUrl === cleanProof &&
    (task.proofNotes || '') === (notes || '')
  ) {
    return task;
  }

  task.status = 'in_progress';
  task.reviewState = 'awaiting_review';
  task.proofVersion = (task.proofVersion || 0) + 1;
  task.proofUrl = cleanProof;
  task.proofNotes = notes;
  task.updatedAt = new Date().toISOString();

  // Resolve Review Owner using Canonical Staff Directory
  try {
    const allStaff = getAllStaffMembers();
    const director = allStaff.find(s =>
      s.id === 'dir_melissa_gagliardi_33' ||
      s.role === 'marketing_director' ||
      s.title?.toLowerCase().includes('marketing director') ||
      s.title?.toLowerCase().includes('director')
    );
    if (director) {
      task.reviewOwnerId = director.id;
      task.reviewOwnerName = director.fullName;
      if (director.status === 'out_of_office' && director.backupStaffId) {
        task.coveringStaffId = director.backupStaffId;
        task.coveringStaffName = director.backupStaffName || 'Covering Staff';
      }
    }
  } catch {
    // Non-fatal fallback
  }

  if (!task.proofHistory) task.proofHistory = [];
  task.proofHistory.push({
    version: task.proofVersion,
    proofUrl: cleanProof,
    uploadedBy: actor?.name || 'Producer',
    uploadedById: actor?.id,
    uploadedAt: new Date().toISOString(),
    notes,
    assetId: assetMetadata?.assetId,
    deliverableName: assetMetadata?.deliverableName,
    fileMetadata: assetMetadata?.fileMetadata,
    validationStatus: assetMetadata?.validationStatus
  });

  if (!task.reviewHistory) task.reviewHistory = [];
  task.reviewHistory.push({
    version: task.proofVersion,
    action: 'proof_submitted',
    reviewerId: actor?.id,
    reviewerName: actor?.name || 'Producer',
    feedbackNotes: notes,
    timestamp: new Date().toISOString()
  });

  if (!task.approvalHistory) task.approvalHistory = [];
  task.approvalHistory.push({
    action: `Proof v${task.proofVersion} submitted`,
    performedBy: actor?.name || 'Producer',
    timestamp: new Date().toISOString(),
    note: notes
  });

  return saveCanonicalMarketingTask(task);
}

export function requestCanonicalMarketingTaskRevisions(
  taskId: string,
  feedbackNotes: string,
  reviewer?: { id?: string; name?: string }
): CanonicalMarketingTask | null {
  const task = getCanonicalMarketingTaskById(taskId);
  if (!task) return null;
  if (!feedbackNotes || !feedbackNotes.trim()) {
    throw new Error('REVISION_FEEDBACK_REQUIRED: Meaningful revision feedback notes are required when requesting revisions.');
  }

  task.status = 'in_progress';
  task.reviewState = 'revisions_requested';
  task.proofNotes = feedbackNotes;
  task.updatedAt = new Date().toISOString();

  if (!task.reviewHistory) task.reviewHistory = [];
  task.reviewHistory.push({
    version: task.proofVersion || 1,
    action: 'revisions_requested',
    reviewerId: reviewer?.id,
    reviewerName: reviewer?.name || 'Reviewer',
    feedbackNotes,
    timestamp: new Date().toISOString()
  });

  if (!task.approvalHistory) task.approvalHistory = [];
  task.approvalHistory.push({
    action: 'Revisions requested',
    performedBy: reviewer?.name || 'Reviewer',
    timestamp: new Date().toISOString(),
    note: feedbackNotes
  });

  return saveCanonicalMarketingTask(task);
}

export function approveCanonicalMarketingTaskProof(
  taskId: string,
  note?: string,
  reviewer?: { id?: string; name?: string }
): CanonicalMarketingTask | null {
  const task = getCanonicalMarketingTaskById(taskId);
  if (!task) return null;

  task.reviewState = 'approved';
  task.updatedAt = new Date().toISOString();

  if (!task.reviewHistory) task.reviewHistory = [];
  task.reviewHistory.push({
    version: task.proofVersion || 1,
    action: 'approved',
    reviewerId: reviewer?.id,
    reviewerName: reviewer?.name || 'Reviewer',
    feedbackNotes: note || 'Proof approved',
    timestamp: new Date().toISOString()
  });

  if (!task.approvalHistory) task.approvalHistory = [];
  task.approvalHistory.push({
    action: 'Proof approved',
    performedBy: reviewer?.name || 'Reviewer',
    timestamp: new Date().toISOString(),
    note: note || 'Proof approved'
  });

  return saveCanonicalMarketingTask(task);
}

export function archiveCanonicalMarketingTask(taskId: string): CanonicalMarketingTask | null {
  const updated = updateCanonicalMarketingTaskStatus(taskId, 'archived', { performedBy: 'User' });
  if (updated) {
    if (updated.requestId) {
      const parentReq = getCanonicalMarketingRequestById(updated.requestId);
      if (parentReq && !parentReq.isArchived) {
        const siblingTasks = getAllCanonicalMarketingTasks().filter(t => t.requestId === parentReq.id || parentReq.taskIds?.includes(t.id));
        const allArchived = siblingTasks.every(t => t.isArchived || t.status === 'archived' || t.id === updated.id);
        if (allArchived) {
          parentReq.isArchived = true;
          parentReq.updatedAt = new Date().toISOString();
          saveCanonicalMarketingRequest(parentReq);
        }
      }
    }
    void tombstoneIntakeScope({
      workspaceId: (updated as any).workspaceId || 'ws_wilmington',
      requestId: updated.requestId,
      propertyAddress: updated.propertyAddress,
      reason: 'archived_task',
    }).catch((err) => console.warn('[archive] tombstone failed:', err?.message || err));
  }
  return updated;
}

export function restoreCanonicalMarketingTask(taskId: string): CanonicalMarketingTask | null {
  const task = getCanonicalMarketingTaskById(taskId);
  if (!task) return null;
  task.isArchived = false;
  delete task.archivedAt;
  if (task.status === 'archived') {
    task.status = task.proofUrl ? 'in_progress' : 'request_received';
  }
  task.updatedAt = new Date().toISOString();
  if (!task.approvalHistory) task.approvalHistory = [];
  task.approvalHistory.push({
    action: 'Restored from archive',
    performedBy: 'User',
    timestamp: new Date().toISOString(),
    note: 'Restored to active queue'
  });
  const saved = saveCanonicalMarketingTask(task);
  if (saved && saved.requestId) {
    const parentReq = getCanonicalMarketingRequestById(saved.requestId);
    if (parentReq && parentReq.isArchived) {
      parentReq.isArchived = false;
      parentReq.updatedAt = new Date().toISOString();
      saveCanonicalMarketingRequest(parentReq);
    }
  }
  void removeTombstone({
    workspaceId: (task as any).workspaceId || 'ws_wilmington',
    requestId: task.requestId,
    propertyAddress: task.propertyAddress
  }).catch((err) => console.warn('[restore] remove tombstone failed:', err?.message || err));
  return saved;
}

export function getAllCanonicalMarketingRequests(): CanonicalMarketingRequest[] {
  if (!hasLoadedCanonicalStore && canonicalRequestsStore.length === 0 && isServer) {
    loadCanonicalStoreFromDisk();
  }
  return canonicalRequestsStore;
}

export function getCanonicalMarketingRequestById(id: string): CanonicalMarketingRequest | undefined {
  const items = getAllCanonicalMarketingRequests();
  return items.find(r => r.id === id);
}

export function saveCanonicalMarketingRequest(req: CanonicalMarketingRequest): CanonicalMarketingRequest {
  if (!req.id) {
    req.id = `req_manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  if (!req.createdAt) {
    req.createdAt = new Date().toISOString();
  }
  if (!(req as any).workspaceId) {
    (req as any).workspaceId = 'ws_wilmington';
  }
  const items = getAllCanonicalMarketingRequests();
  req.updatedAt = new Date().toISOString();
  const index = items.findIndex(r => r.id === req.id);
  if (index >= 0) {
    items[index] = req;
  } else {
    items.unshift(req);
  }
  canonicalRequestsStore = items;

  if (isServer) {
    saveCanonicalStoreToDisk();
  }

  if (isServer) {
    persistRequestToDatabase(req).catch(err => {
      console.warn('[saveCanonicalMarketingRequest] Notice persisting request to database:', err.message);
    });
  }

  return req;
}

export function archiveCanonicalMarketingRequestAndTasks(requestId: string): { request: CanonicalMarketingRequest | null; archivedTasks: CanonicalMarketingTask[] } {
  const req = getCanonicalMarketingRequestById(requestId);
  if (!req) return { request: null, archivedTasks: [] };

  req.isArchived = true;
  req.updatedAt = new Date().toISOString();
  saveCanonicalMarketingRequest(req);

  const allTasks = getAllCanonicalMarketingTasks();
  const childTasks = allTasks.filter(t => t.requestId === requestId || (req.taskIds && req.taskIds.includes(t.id)));
  const archivedTasks: CanonicalMarketingTask[] = [];

  for (const t of childTasks) {
    t.isArchived = true;
    t.status = 'archived';
    t.archivedAt = new Date().toISOString();
    saveCanonicalMarketingTask(t);
    archivedTasks.push(t);
  }

  // Durable tombstone — row absence is not enough (IMAP can resurrect).
  void tombstoneIntakeScope({
    workspaceId: (req as any).workspaceId || 'ws_wilmington',
    requestId: requestId,
    propertyAddress: req.propertyAddress || archivedTasks[0]?.propertyAddress,
    reason: 'archived_request',
  }).catch((err) => console.warn('[archive] tombstone failed:', err?.message || err));

  return { request: req, archivedTasks };
}

/**
 * Cleans / archives all active tasks for specific team members (e.g. Melissa Gagliardi, Eduardo Lovo, Ann Gunn)
 * so workspaces start completely fresh.
 */
export function cleanOrArchiveTasksForAssignees(assigneeNames: string[] = ['Melissa Gagliardi', 'Eduardo Lovo', 'Ann Gunn']): {
  archivedTaskCount: number;
  archivedRequestCount: number;
} {
  const cleanNames = assigneeNames.map(n => n.toLowerCase().trim());
  const tasks = getAllCanonicalMarketingTasks();
  let archivedTaskCount = 0;
  const impactedRequestIds = new Set<string>();

  for (const t of tasks) {
    const assigned = (t.assignedTo || '').toLowerCase();
    const role = (t.assignedToRole || '').toLowerCase();
    const matches = cleanNames.some(name => assigned.includes(name) || (name === 'eduardo lovo' && (role.includes('virtual assistant') || role.includes('va'))));
    if (matches && !t.isArchived && t.status !== 'archived') {
      t.isArchived = true;
      t.status = 'archived';
      t.archivedAt = new Date().toISOString();
      if (!t.approvalHistory) t.approvalHistory = [];
      t.approvalHistory.push({
        action: 'Cleaned and archived for morning workspace reset',
        performedBy: 'System Morning Reset',
        timestamp: new Date().toISOString()
      });
      if (t.requestId) impactedRequestIds.add(t.requestId);
      archivedTaskCount++;
    }
  }

  canonicalTasksStore = tasks;

  let archivedRequestCount = 0;
  const requests = getAllCanonicalMarketingRequests();
  for (const req of requests) {
    const childTasks = tasks.filter(t => t.requestId === req.id || (req.taskIds && req.taskIds.includes(t.id)));
    if (childTasks.length > 0 && childTasks.every(t => t.isArchived || t.status === 'archived')) {
      if (!req.isArchived) {
        req.isArchived = true;
        req.updatedAt = new Date().toISOString();
        archivedRequestCount++;
      }
    }
  }
  canonicalRequestsStore = requests;
  saveCanonicalStoreToDisk();

  return { archivedTaskCount, archivedRequestCount };
}

export function purgeAllArchivedCanonicalTasks(): { purgedTasks: number; purgedRequests: number } {
  loadCanonicalStoreFromDisk();
  const initialTaskCount = canonicalTasksStore.length;
  const initialReqCount = canonicalRequestsStore.length;

  canonicalTasksStore = canonicalTasksStore.filter(t => !t.isArchived && t.status !== 'archived');
  canonicalRequestsStore = canonicalRequestsStore.filter(r => !r.isArchived && r.status !== 'archived');

  canonicalRequestsStore.forEach(r => {
    if (r.taskIds) {
      r.taskIds = r.taskIds.filter(id => canonicalTasksStore.some(t => t.id === id));
    }
  });

  const purgedTasks = initialTaskCount - canonicalTasksStore.length;
  const purgedRequests = initialReqCount - canonicalRequestsStore.length;

  if (isServer) {
    saveCanonicalStoreToDisk();
  }
  return { purgedTasks, purgedRequests };
}

export function purgeAllCanonicalMarketingData(): { purgedTasks: number; purgedRequests: number } {
  const purgedTasks = canonicalTasksStore.length;
  const purgedRequests = canonicalRequestsStore.length;
  canonicalTasksStore = [];
  canonicalRequestsStore = [];
  if (isServer) {
    saveCanonicalStoreToDisk();
  }
  return { purgedTasks, purgedRequests };
}

export interface CallToRequestResult {
  shouldCreate: boolean;
  suppressed?: boolean;
  suppressionReason?: string;
  request?: CanonicalMarketingRequest;
  tasks?: CanonicalMarketingTask[];
}

export function shouldCreateRequestFromCall(call: any): { shouldCreate: boolean; reason?: string } {
  const duration = call.durationSeconds ?? (call.duration_ms ? Math.round(call.duration_ms / 1000) : (call.duration ? Number(call.duration) : 45));
  const rawText = (call.transcript || call.requestSummary || call.notes || call.summary || '').trim();
  const lower = rawText.toLowerCase();

  // 0. Idempotency Gate: If call was already converted previously, suppress re-creation
  if (call.canonicalRequestId || call.canonicalTaskId) {
    return { shouldCreate: false, reason: `CALL_ALREADY_CONVERTED: Call ${call.id || call.callId} already converted to ${call.canonicalRequestId || call.canonicalTaskId}` };
  }

  // 1. Explicit Analysis Gate
  if (call.call_analysis?.custom_analysis_data?.should_create_ticket === false) {
    return { shouldCreate: false, reason: 'Call analysis explicitly determined no ticket should be created.' };
  }

  // 2. Deliverable Keywords Check
  const hasDeliverableKeywords = lower.includes('flyer') || lower.includes('sign') || lower.includes('post') ||
    lower.includes('social') || lower.includes('slides') || lower.includes('cma') || lower.includes('deck') ||
    lower.includes('brochure') || lower.includes('package') || lower.includes('listing launch') ||
    lower.includes('open house') || lower.includes('farming') || lower.includes('rider') ||
    lower.includes('presentation') || lower.includes('lockbox');

  // 3. Test Calls Gate ("just testing", "only testing", etc.)
  const isTestPhrase = (
    lower.includes('just testing') ||
    lower.includes('only testing') ||
    lower.includes('testing the agent') ||
    lower.includes("i'm testing") ||
    lower.includes('test call') ||
    lower.includes('testing call')
  );

  const hasExplicitConfirmedRequest = Boolean(
    (call.call_analysis?.custom_analysis_data?.should_create_ticket === true) ||
    call.tool_calls?.some((tc: any) => tc.tool_name === 'submit_marketing_intake' || tc.tool_name === 'dispatch_marketing_collateral' || tc.tool_name === 'dispatch_sign_post') ||
    (hasDeliverableKeywords && (lower.includes('save') || lower.includes('create') || lower.includes('confirm') || lower.includes('order')) && (lower.includes('road') || lower.includes('street') || lower.includes('drive') || lower.includes('ave') || lower.includes('way') || lower.includes('blvd') || lower.includes('dr') || lower.includes('lane') || lower.includes('ct')))
  );

  if (isTestPhrase && !hasExplicitConfirmedRequest) {
    return { shouldCreate: false, reason: 'Testing call — no task created.' };
  }

  // 4. Explicit Disconnection / Silence / Greeting Only
  if (
    lower === 'user hung up' ||
    lower === 'call ended' ||
    lower === 'silence' ||
    lower === 'no speech detected' ||
    lower.length < 5
  ) {
    return { shouldCreate: false, reason: 'Call ended without request.' };
  }

  // 5. Hang-up / Dropped Call Check (< 8s duration with no confirmed address)
  const isExtremelyShort = duration > 0 && duration < 8;
  if (isExtremelyShort && !lower.includes('road') && !lower.includes('street') && !lower.includes('drive') && !lower.includes('way') && !lower.includes('avenue') && !lower.includes('court') && !lower.includes('lane')) {
    return { shouldCreate: false, reason: 'Caller hung up or call dropped prematurely (< 8s).' };
  }

  // 6. Pure Informational Q&A (Answered On Call with no follow-up needed)
  const isInformationalQuery = 
    lower.includes('office hours') ||
    lower.includes('what are your hours') ||
    lower.includes('what is the phone number') ||
    lower.includes('who is the bic') ||
    lower.includes('broker in charge') ||
    lower.includes('what is the sop for') ||
    lower.includes('sop-mkt') ||
    lower.includes('sop-ops') ||
    lower.includes('earnest money deadline') ||
    lower.includes('banking days') ||
    lower.includes('due diligence deadline') ||
    lower.includes('how many days') ||
    lower.includes('can you hear me') ||
    lower.includes('mic check');

  const indicatesAnsweredOnCall = 
    (call.call_analysis?.custom_analysis_data?.answered_on_call === true) ||
    lower.includes('answered on call') ||
    lower.includes('no further action needed') ||
    lower.includes('question answered') ||
    lower.includes('provided answer directly') ||
    (isInformationalQuery && !hasDeliverableKeywords);

  if (indicatesAnsweredOnCall && !hasDeliverableKeywords) {
    return { shouldCreate: false, reason: 'Informational question answered directly on call.' };
  }

  const customData = call.call_analysis?.custom_analysis_data || call.customAnalysisData || {};
  const hasExplicitAddress = Boolean(
    call.propertyAddress || customData.property_address ||
    /\b(street|st|road|rd|drive|dr|avenue|ave|way|boulevard|blvd|lane|ln|court|ct)\b/i.test(lower)
  );

  const isOperationalRequest = Boolean(
    customData.category === 'operations' ||
    customData.category === 'office_supplies' ||
    customData.category === 'facilities' ||
    customData.category === 'lockbox_signs' ||
    customData.primary_owner === 'ann' ||
    lower.includes('restock') ||
    lower.includes('office supplies') ||
    lower.includes('water bottle') ||
    lower.includes('bottled water') ||
    lower.includes('soda') ||
    lower.includes('drink') ||
    lower.includes('coffee') ||
    lower.includes('printer paper') ||
    lower.includes('cleaning supplies') ||
    lower.includes('yard sign') ||
    lower.includes('sign post')
  );

  // If no deliverable keywords exist and no property was stated, and it is not an operational request, it cannot be a task
  if (!hasDeliverableKeywords && !hasExplicitAddress && !isOperationalRequest) {
    return { shouldCreate: false, reason: 'No actionable marketing deliverable, yard sign, or operational task requested on call.' };
  }

  return { shouldCreate: true };
}

export function convertCallToCanonicalMarketingRequest(call: any): CallToRequestResult {
  // Evaluate smart intent & suppression rules
  const decision = shouldCreateRequestFromCall(call);
  if (!decision.shouldCreate) {
    console.log(`[Telephony Sync] Suppressed request creation: ${decision.reason} (Call: ${call.id || call.callId})`);
    return {
      shouldCreate: false,
      suppressed: true,
      suppressionReason: decision.reason,
      request: undefined,
      tasks: []
    };
  }

  const callId = call.id || call.callId || (call.start_timestamp ? `call_${call.start_timestamp}` : String(Date.now()));
  const reqId = `req_call_${callId}`;

  // 1. Idempotency Check: Check if this specific call has already been converted to a request
  const allRequests = getAllCanonicalMarketingRequests();
  const existingRequest = allRequests.find(r => r.id === reqId || (r.telephonyCallId && r.telephonyCallId === callId));
  if (existingRequest) {
    const existingTasks = getAllCanonicalMarketingTasks().filter(t => t.requestId === existingRequest.id || existingRequest.taskIds?.includes(t.id));
    return {
      shouldCreate: true,
      suppressed: false,
      request: existingRequest,
      tasks: existingTasks
    };
  }

  const customData = call.call_analysis?.custom_analysis_data || call.customAnalysisData || {};
  const rawText = `${call.transcript || ''} ${call.summary || call.call_analysis?.call_summary || customData.description || ''}`.trim();
  let callerName = customData.requester || call.callerName || call.agentName || '';
  if (!callerName || callerName.toLowerCase().includes('inbound phone caller')) {
    if (rawText.toLowerCase().includes('marcus') || rawText.toLowerCase().includes('marcus aman')) {
      callerName = 'Marcus Aman (Broker / Tech Lead)';
    } else if (rawText.toLowerCase().includes('ryan')) {
      callerName = 'Ryan Crecelius (Owner / BIC)';
    } else {
      callerName = call.from_number || call.caller_number || call.from || 'Unknown Caller';
    }
  }
  let propertyAddress = customData.property_address || call.propertyAddress || '';

  // Detect On-Behalf-Of represented agent
  let representedAgent: string | undefined = customData.represented_agent || (call as any).representedAgentName || (call as any).onBehalfOf;
  if (!representedAgent) {
    const oboMatch = rawText.match(/on behalf of\s+(?:listing agent\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i);
    if (oboMatch && oboMatch[1]) {
      representedAgent = oboMatch[1].trim();
    }
  }
  const effectiveAgentName = representedAgent || callerName;

  // Extract address if not provided explicitly in call object
  if (!propertyAddress || propertyAddress.toLowerCase().includes('unknown')) {
    const directMatch = rawText.match(/\b([0-9]{2,5}\s+(?:[NSEW]\s+)?[A-Za-z0-9\s,]+(?:Road|Rd|Drive|Dr|Street|St|Avenue|Ave|Way|Lane|Ln|Court|Ct|Boulevard|Blvd|Place|Pl|Trail|Trl|Circle|Cir|Pkwy|Parkway|Loop|Waterfront|Island|Beach))\b/i);
    const addrMatch = rawText.match(/(?:for|at|listing|property)\s+([0-9]+\s+[A-Za-z0-9\s,]+(?:Road|Rd|Drive|Dr|Street|St|Avenue|Ave|Way|Lane|Ln|Court|Ct|Boulevard|Blvd|Place|Pl|Trail|Trl|Circle|Cir|Pkwy|Parkway|Loop|Waterfront|Island|Beach))/i);
    
    if (directMatch && directMatch[1]) {
      propertyAddress = directMatch[1].trim();
    } else if (addrMatch && addrMatch[1]) {
      propertyAddress = addrMatch[1].trim();
    } else {
      const numberMatch = rawText.match(/\b([0-9]{3,5}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
      if (numberMatch && numberMatch[1]) {
        propertyAddress = `${numberMatch[1]}, Wilmington NC`;
      } else {
        propertyAddress = '';
      }
    }
  }

  if (propertyAddress && !propertyAddress.includes('NC') && !propertyAddress.includes('Wilmington')) {
    propertyAddress = `${propertyAddress}, Wilmington NC`;
  }

  const normAddress = propertyAddress.toLowerCase().replace(/[^a-z0-9]/g, '');
  const streetPart = propertyAddress.split(',')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const existingByAddress = allRequests.find(r => {
    if (!r.propertyAddress && !r.title) return false;
    const rNorm = (r.propertyAddress || r.title).toLowerCase().replace(/[^a-z0-9]/g, '');
    const rStreet = (r.propertyAddress || r.title).split(',')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    if (streetPart.length >= 6 && rStreet.length >= 6 && (streetPart.includes(rStreet) || rStreet.includes(streetPart))) {
      return true;
    }
    return rNorm.length > 5 && (normAddress.includes(rNorm) || rNorm.includes(normAddress));
  });

  const isExplicitFollowup = String(callId).toLowerCase().includes('followup') || rawText.toLowerCase().includes('also add') || rawText.toLowerCase().includes('follow up') || call.isFollowup === true;
  const targetFollowupRequest = isExplicitFollowup && existingByAddress ? existingByAddress : undefined;

  const lower = rawText.toLowerCase();
  const urgency = (customData.urgency || call.urgency || '').toLowerCase();
  const isUrgent = urgency === 'urgent' || lower.includes('urgent') || lower.includes('asap') || lower.includes('needed by');

  // Determine Primary Assigned Specialist / Reviewer
  let primaryAssignee = 'Melissa Gagliardi';
  if (customData.primary_owner) {
    const owner = customData.primary_owner.toLowerCase();
    if (owner.includes('melissa')) primaryAssignee = 'Melissa Gagliardi';
    else if (owner.includes('ann')) primaryAssignee = 'Ann Gunn';
    else if (owner.includes('eduardo')) primaryAssignee = 'Eduardo Lovo';
  } else if (lower.includes('ann gunn') || lower.includes('sign post') || lower.includes('coastal sign')) {
    primaryAssignee = 'Ann Gunn';
  } else if (lower.includes('eduardo') || lower.includes('maxa')) {
    primaryAssignee = 'Eduardo Lovo';
  }

  const taskDeliverables: Array<{ 
    title: string; 
    category: CanonicalMarketingTask['category']; 
    assignedTo?: string; 
    vendorName?: string; 
    vendorNotes?: string;
  }> = [];

  // 0. Operations / Office Supplies Restock & Facilities
  const isOperationalIntake = Boolean(
    customData.category === 'operations' ||
    customData.category === 'office_supplies' ||
    customData.primary_owner === 'ann' ||
    lower.includes('restock') ||
    lower.includes('office supplies') ||
    lower.includes('water bottle') ||
    lower.includes('bottled water') ||
    lower.includes('soda') ||
    lower.includes('drink') ||
    lower.includes('coffee') ||
    lower.includes('printer paper') ||
    lower.includes('cleaning supplies')
  );

  if (isOperationalIntake && (!propertyAddress || propertyAddress.toLowerCase().includes('unknown') || propertyAddress.toLowerCase().includes('address pending'))) {
    const officeName = lower.includes('carolina beach') ? 'Carolina Beach' : lower.includes('midtown') ? 'Midtown' : 'Mayfaire';
    propertyAddress = `${officeName} Nest Office, Wilmington NC`;
  }

  if (
    isOperationalIntake &&
    (lower.includes('water') || lower.includes('soda') || lower.includes('drink') || lower.includes('coffee') || lower.includes('paper') || lower.includes('supplies') || lower.includes('restock') || customData.category === 'operations' || customData.category === 'office_supplies')
  ) {
    const officeName = lower.includes('carolina beach') ? 'Carolina Beach' : lower.includes('midtown') ? 'Midtown' : 'Mayfaire';
    const detectedSupplyCat = OfficeSupplyDeduplicationService.detectCategory(rawText);
    const supplyCheck = OfficeSupplyDeduplicationService.checkAndConsolidateSupplyRequest({
      callerName,
      callerPhone: call.from_number || call.caller_phone || call.from,
      office: officeName,
      requestText: rawText,
      category: detectedSupplyCat
    });

    if (supplyCheck.isDuplicate) {
      const existingSupplyReq = allRequests.find(r => 
        r.category === 'operations' && 
        r.propertyAddress?.toLowerCase().includes(officeName.toLowerCase()) &&
        !r.isArchived && r.status !== 'archived'
      );
      if (existingSupplyReq) {
        existingSupplyReq.requestExcerpt = `${existingSupplyReq.requestExcerpt} | [Consolidated Caller]: ${callerName} also requested ${supplyCheck.order.categoryLabel}.`;
        existingSupplyReq.updatedAt = new Date().toISOString();
        saveCanonicalMarketingRequest(existingSupplyReq);
        const existingTasks = getAllCanonicalMarketingTasks().filter(t => t.requestId === existingSupplyReq.id);
        return {
          shouldCreate: false,
          suppressed: true,
          suppressionReason: 'DEDUPLICATED_INTO_EXISTING_RESTOCK_ORDER',
          request: existingSupplyReq,
          tasks: existingTasks
        };
      } else {
        taskDeliverables.push({
          title: supplyCheck.order.categoryLabel || 'Office Restock & Supplies',
          category: 'operations',
          assignedTo: 'Ann Gunn',
          vendorNotes: supplyCheck.spokenMessage
        });
      }
    } else {
      taskDeliverables.push({
        title: supplyCheck.order.categoryLabel || 'Office Restock & Supplies',
        category: 'operations',
        assignedTo: 'Ann Gunn',
        vendorNotes: supplyCheck.spokenMessage
      });
    }
  }

  // 1. Specific Compound: Open House Flyer & Information Sheet
  if (lower.includes('open house') && (lower.includes('flyer') || lower.includes('sheet') || lower.includes('info') || lower.includes('information') || lower.includes('handout'))) {
    taskDeliverables.push({
      title: 'Open House Flyer & Information Sheet',
      category: 'open_house',
      assignedTo: 'Melissa Gagliardi'
    });
  } else if (lower.includes('open house')) {
    taskDeliverables.push({
      title: 'Open House Directionals & Handout Kit',
      category: 'open_house',
      assignedTo: 'Melissa Gagliardi'
    });
  }

  // 2. Print / Feature Sheet / Flyer
  if ((lower.includes('flyer') || lower.includes('feature sheet') || lower.includes('brochure') || lower.includes('print package') || lower.includes('print flyer') || lower.includes('digital flyer')) && !lower.includes('open house')) {
    taskDeliverables.push({
      title: lower.includes('brochure') ? 'Luxury Property Marketing Brochure' : lower.includes('feature sheet') ? 'Property Feature Sheet' : 'Double-Sided 8.5x11 Property Flyer',
      category: 'print',
      assignedTo: 'Eduardo Lovo'
    });
  }

  // 3. Social Media Post / Story Carousel
  if (lower.includes('social') || lower.includes('instagram') || lower.includes('facebook') || lower.includes('story') || lower.includes('carousel')) {
    taskDeliverables.push({
      title: lower.includes('carousel') || lower.includes('story') ? '3-Slide Instagram & Facebook Story Carousel' : 'Instagram & Facebook Social Media Graphics',
      category: 'social',
      assignedTo: primaryAssignee === 'Melissa Gagliardi' ? 'Melissa Gagliardi' : 'Eduardo Lovo'
    });
  }

  // 4. Physical Yard Sign Post Installation / Pickup
  const isSignExcluded =
    lower.includes('sign the') ||
    lower.includes('sign this') ||
    lower.includes('sign a ') ||
    lower.includes('electronic signature') ||
    lower.includes('e-sign') ||
    lower.includes('esign') ||
    lower.includes('docusign') ||
    lower.includes('dotloop') ||
    lower.includes('signature') ||
    lower.includes('signing') ||
    lower.includes('sign off') ||
    lower.includes('sign-off') ||
    lower.includes('sign in sheet') ||
    lower.includes('sign-in sheet') ||
    lower.includes('signed contract') ||
    lower.includes('signed disclosure') ||
    lower.includes('signed agreement') ||
    lower.includes('signed form') ||
    lower.includes('signed document') ||
    lower.includes('disclosure is signed') ||
    lower.includes('contract is signed') ||
    lower.includes('need to sign') ||
    lower.includes('has to sign') ||
    lower.includes('needs to sign') ||
    lower.includes('please sign') ||
    lower.includes('signing appointment');

  const hasExplicitPhysicalSign =
    lower.includes('yard sign') ||
    lower.includes('real estate sign') ||
    lower.includes('sign post') ||
    lower.includes('post installation') ||
    lower.includes('post removal') ||
    lower.includes('sign installation') ||
    lower.includes('sign removal') ||
    lower.includes('install a sign') ||
    lower.includes('install the sign') ||
    lower.includes('remove the yard sign') ||
    lower.includes('remove the sign') ||
    lower.includes('put up a sign') ||
    lower.includes('take down the sign') ||
    lower.includes('coastal sign') ||
    lower.includes('coming soon rider') ||
    lower.includes('custom rider') ||
    lower.includes('sign rider') ||
    lower.includes('rider post') ||
    lower.includes('directional sign') ||
    lower.includes('directional signs') ||
    lower.includes('open house directional') ||
    lower.includes('open house directionals') ||
    lower.includes('lockbox installation') ||
    lower.includes('lockbox placement') ||
    lower.includes('lockbox removal') ||
    lower.includes('install lockbox') ||
    lower.includes('remove lockbox') ||
    lower.includes('asking for a sign') ||
    lower.includes('order a sign') ||
    lower.includes('need a sign') ||
    (/\b(?:sign|post|rider)\b/i.test(lower) && 
      (lower.includes('pickup') || lower.includes('pick up') || lower.includes('installed') || lower.includes('removed') || lower.includes('in the yard') || lower.includes('on the lawn') || lower.includes('at the property'))
    );

  if ((!isSignExcluded && hasExplicitPhysicalSign) || (isSignExcluded && (lower.includes('yard sign') || lower.includes('sign post') || lower.includes('lockbox')))) {
    const isPickup = lower.includes('pick it up') || lower.includes('pickup') || lower.includes("i'll pick it up") || lower.includes('pickup by');
    taskDeliverables.push({
      title: isPickup ? 'Yard Sign & Rider Pickup' : (lower.includes('rider') || lower.includes('writer') ? 'Yard Sign Post & Custom Rider Installation' : 'Yard Sign Post Installation'),
      category: 'signage',
      assignedTo: 'Ann Gunn',
      vendorName: isPickup ? 'Nest Office Pickup' : 'Coastal Sign Post Co.',
      vendorNotes: isPickup ? 'Agent pickup at office' : 'Standard 4x4 white vinyl post with custom rider'
    });
  }

  // 5. Video / Teaser Reel
  if (lower.includes('video') || lower.includes('drone') || lower.includes('teaser reel') || (lower.includes('reel') && !lower.includes('realtor'))) {
    taskDeliverables.push({
      title: '30s Social Video Teaser Reel',
      category: 'social',
      assignedTo: 'Eduardo Lovo'
    });
  }

  // 6. Direct Mailer / Farming
  if (lower.includes('farm') || lower.includes('newsletter') || lower.includes('geographic') || lower.includes('eddm') || lower.includes('postcard')) {
    taskDeliverables.push({
      title: `${callerName.split(' ')[0]} — Farming Direct Mailer & Postcard`,
      category: 'farming',
      assignedTo: 'Melissa Gagliardi'
    });
  }

  // 7. Google Slides / CMA Deck
  if (lower.includes('presentation') || lower.includes('slides') || lower.includes('cma') || lower.includes('pitch')) {
    taskDeliverables.push({
      title: '8-Slide Luxury Google Slides CMA & Presentation Deck',
      category: 'listing_launch',
      assignedTo: 'Eduardo Lovo'
    });
  }

  // 8. Email Marketing Campaign
  if (lower.includes('email campaign') || lower.includes('email marketing') || lower.includes('friends of nest') || lower.includes('email copy') || lower.includes('email blast')) {
    taskDeliverables.push({
      title: 'Email Marketing Campaign (Copy & Graphics)',
      category: 'social',
      assignedTo: primaryAssignee
    });
  }

  // Fallback if no specific deliverable matched: Extract verbal request phrase or neutral intake
  if (taskDeliverables.length === 0) {
    const helpMatch = rawText.match(/(?:help with|need|want|looking for|order|create|asked for)\s+([^.,;]+)/i);
    let extractedTitle = 'General Marketing & Listing Intake';
    if (helpMatch && helpMatch[1] && helpMatch[1].trim().length > 3 && helpMatch[1].trim().length < 60) {
      extractedTitle = helpMatch[1].trim()
        .replace(/^(?:a|an|the|some)\s+/i, '')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    } else if (customData.title) {
      extractedTitle = customData.title;
    }

    taskDeliverables.push({
      title: extractedTitle,
      category: extractedTitle.toLowerCase().includes('open house') ? 'open_house' : extractedTitle.toLowerCase().includes('sign') ? 'signage' : 'listing_launch',
      assignedTo: primaryAssignee || 'Melissa Gagliardi'
    });
  }

  const effectiveReqId = targetFollowupRequest ? targetFollowupRequest.id : reqId;
  const existingTasks = getAllCanonicalMarketingTasks().filter(t => t.requestId === effectiveReqId);
  const createdTasks: CanonicalMarketingTask[] = [];
  const taskNotes = customData.description || call.call_analysis?.call_summary || call.summary || `Inbound call from ${callerName} regarding ${propertyAddress}`;

  taskDeliverables.forEach((td, idx) => {
    const duplicate = existingTasks.find(et => et.title.toLowerCase() === td.title.toLowerCase() && !et.isArchived);
    if (!duplicate) {
      const taskId = `task_call_${callId}_${idx}`;

      let routingDecision: any;
      if (isServer) {
        try {
          routingDecision = canonicalTaskRoutingService.resolveRoutingSync({
            workspaceId: (call as any).workspaceId || 'ws_wilmington',
            category: td.category,
            deliverableType: td.title,
            title: td.title,
            transcript: rawText,
            channel: 'phone',
            requesterName: callerName,
            propertyAddress: propertyAddress || undefined,
            classificationConfidence: 0.95,
            taskId,
            callId: String(callId)
          });
        } catch (routeErr) {
          console.warn('[CallIntake] Canonical routing lookup notice:', routeErr);
        }
      }

      const isTriage = routingDecision ? routingDecision.routingState !== 'resolved' : false;

      const task: CanonicalMarketingTask = {
        id: taskId,
        requestId: effectiveReqId,
        requestTitle: propertyAddress || 'Address Pending',
        propertyAddress: propertyAddress || '',
        agentName: effectiveAgentName,
        title: td.title,
        category: td.category || routingDecision?.departmentId,
        assignedTo: isTriage ? undefined : (td.title.toLowerCase().includes('general marketing') || td.category === 'listing_launch' ? (td.assignedTo || 'Melissa Gagliardi') : (routingDecision?.assigneeName || td.assignedTo || 'Melissa Gagliardi')),
        assignedToId: isTriage ? undefined : routingDecision?.assigneeStaffId,
        assignedToRole: isTriage ? 'Unassigned Review Queue' : (routingDecision?.assigneeRole || 'Marketing Specialist'),
        reviewOwner: routingDecision?.reviewOwnerName,
        reviewOwnerId: routingDecision?.reviewOwnerStaffId,
        reviewOwnerName: routingDecision?.reviewOwnerName,
        coveringStaff: routingDecision?.coveringStaffName,
        coveringStaffId: routingDecision?.coveringStaffId,
        coveringStaffName: routingDecision?.coveringStaffName,
        originalStaffId: routingDecision?.originalStaffId,
        governingSopId: routingDecision?.governingSopId,
        governingSopVersion: routingDecision?.governingSopVersion,
        routingRuleId: routingDecision?.matchedRuleId,
        routingPolicyVersion: routingDecision?.ruleVersion,
        departmentId: routingDecision?.departmentId,
        primaryRoleId: routingDecision?.primaryRoleId,
        reviewRoleId: routingDecision?.reviewRoleId,
        routingState: routingDecision?.routingState || 'resolved',
        routingReasons: routingDecision?.reasonCodes,
        routingSnapshot: routingDecision?.snapshot,
        status: isTriage ? 'needs_info' : 'request_received',
        dueAt: isUrgent ? new Date(Date.now() + 86400000).toISOString() : new Date(Date.now() + 86400000 * 2).toISOString(),
        vendorName: td.vendorName,
        vendorNotes: td.vendorNotes,
        notes: representedAgent
          ? `[Submitted by ${callerName} on behalf of ${representedAgent}${call.from_number ? ` (${call.from_number})` : ''}]\n${taskNotes}`
          : taskNotes,
        channel: 'phone',
        callId: String(callId),
        telephonyCallId: String(callId),
        audioUrl: call.audioUrl || `/api/marketing/calls/${callId}/audio`,
        createdAt: call.start_timestamp ? new Date(call.start_timestamp).toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const savedTask = saveCanonicalMarketingTask(task);
      createdTasks.push(savedTask);

      if (isServer && routingDecision) {
        try {
          canonicalTaskRoutingService.recordRoutingAudit(
            (call as any).workspaceId || 'ws_wilmington',
            { taskId, callId: String(callId), requestId: effectiveReqId },
            routingDecision,
            'phone'
          ).catch(() => {});
        } catch {}
      }
    }
  });

  if (targetFollowupRequest) {
    const updatedTaskIds = Array.from(new Set([...(targetFollowupRequest.taskIds || []), ...createdTasks.map(t => t.id)]));
    const cleanUpdateText = rawText.slice(0, 100);
    const hasExistingUpdate = targetFollowupRequest.requestExcerpt.includes(cleanUpdateText.slice(0, 30));
    const mergedRequest: CanonicalMarketingRequest = {
      ...targetFollowupRequest,
      requestExcerpt: hasExistingUpdate 
        ? targetFollowupRequest.requestExcerpt 
        : `${targetFollowupRequest.requestExcerpt} | [Phone Update]: ${cleanUpdateText}`,
      taskIds: updatedTaskIds,
      updatedAt: new Date().toISOString()
    };
    saveCanonicalMarketingRequest(mergedRequest);
    return {
      shouldCreate: true,
      suppressed: false,
      request: mergedRequest,
      tasks: createdTasks.length > 0 ? createdTasks : existingTasks
    };
  }

  const summaryExcerpt = call.call_analysis?.call_summary || customData.description || call.summary || rawText.slice(0, 200);
  const category: CanonicalMarketingRequest['category'] = taskDeliverables[0]?.category || 'listing_launch';
  const newRequest: CanonicalMarketingRequest = {
    id: reqId,
    telephonyCallId: callId,
    title: propertyAddress,
    propertyAddress,
    category,
    status: 'ready_for_review',
    agentName: effectiveAgentName,
    createdByName: callerName,
    onBehalfOf: representedAgent || undefined,
    channel: 'phone',
    audioUrl: call.audioUrl || `/api/marketing/calls/${callId}/audio`,
    requestExcerpt: summaryExcerpt,
    rawExcerpt: call.transcript || '',
    taskIds: createdTasks.map(t => t.id),
    receivedAt: 'Just now',
    createdAt: call.start_timestamp ? new Date(call.start_timestamp).toISOString() : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  saveCanonicalMarketingRequest(newRequest);

  if (isServer) {
    import('../services/activityHistoryService.js').then(({ recordActivityEvent }) => {
      recordActivityEvent({
        workspaceId: (newRequest as any).workspaceId || 'ws_wilmington',
        requestId: newRequest.id,
        callId: String(callId),
        eventType: 'call.received',
        actorType: 'requester',
        actorDisplayName: callerName,
        channel: 'phone',
        direction: 'inbound',
        communicationStatus: 'delivered',
        summary: `${callerName} called NORA requesting marketing for ${propertyAddress}`,
        metadata: {
          duration: call.duration || call.duration_formatted,
          durationSeconds: call.duration_seconds,
          recordingUrl: call.recording_url || call.audio_url,
          requestType: call.request_type
        },
        idempotencyKey: `act:call_received:${callId}`
      }).catch(() => {});

      recordActivityEvent({
        workspaceId: (newRequest as any).workspaceId || 'ws_wilmington',
        requestId: newRequest.id,
        callId: String(callId),
        eventType: 'request.created',
        actorType: 'nora',
        actorDisplayName: 'NORA Intake AI',
        channel: 'phone',
        direction: 'inbound',
        communicationStatus: 'delivered',
        summary: `Request created for ${propertyAddress} from verified call intake`,
        metadata: {
          propertyAddress,
          category,
          callId: String(callId)
        },
        idempotencyKey: `act:req_from_call:${callId}:${newRequest.id}`
      }).catch(() => {});

      for (const t of createdTasks) {
        recordActivityEvent({
          workspaceId: (t as any).workspaceId || (newRequest as any).workspaceId || 'ws_wilmington',
          requestId: newRequest.id,
          taskId: t.id,
          callId: String(callId),
          eventType: 'task.created',
          actorType: 'nora',
          actorDisplayName: 'NORA Intake AI',
          channel: 'internal',
          direction: 'internal',
          summary: `${t.title} task created`,
          metadata: {
            category: t.category,
            priority: t.priority
          },
          idempotencyKey: `act:task_created:${t.id}`
        }).catch(() => {});
      }
    }).catch(() => {});
  }

  // Synchronize into Campaigns Store for UI Table Rendering
  const campId = `campaign_${reqId.replace(/^req_/, '').toLowerCase()}`;
  const existingCamp = getCampaignById(campId) || campaignsStore.find(c => {
    if (!c.propertyAddress) return false;
    const cNorm = c.propertyAddress.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cNorm.length > 5 && (normAddress.includes(cNorm) || cNorm.includes(normAddress));
  });

  if (existingCamp) {
    existingCamp.workspaceId = 'ws_wilmington';
    existingCamp.status = 'ready_for_review';
    existingCamp.assignedTo = taskDeliverables[0]?.assignedTo || 'Melissa Gagliardi';
    saveCampaign(existingCamp);
  } else {
    const newCamp: ListingMarketingCampaign = {
      id: campId,
      workspaceId: 'ws_wilmington',
      propertyAddress,
      listingAgentId: 'usr_marcus',
      marketingOwnerId: 'usr_melissa',
      status: 'ready_for_review',
      assignedTo: taskDeliverables[0]?.assignedTo || 'Melissa Gagliardi',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      request: {
        id: reqId,
        workspaceId: 'ws_wilmington',
        channel: 'phone',
        status: 'ready_for_campaign',
        receivedAt: new Date().toISOString(),
        urgency: 'standard',
        requestedByName: callerName,
        originalRequestText: rawText,
        aiSummary: `Phone intake for ${propertyAddress}: ${taskDeliverables.map(t => t.title).join(', ')}`,
        requestedMaterialTypes: taskDeliverables.map(t => t.category),
        specialInstructions: [],
        missingInformation: [],
        campaignId: campId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      listingSnapshot: {
        id: `snap_${Date.now()}`,
        propertyAddress,
        listPrice: '$850,000',
        bedrooms: 4,
        bathrooms: 3.5,
        squareFeet: 3100,
        listingAgentName: callerName,
        listingAgentEmail: 'marcus@nestrealty.com',
        listingAgentPhone: '(910) 507-2047',
        brokerInChargeName: 'Ryan Crecelius (BIC)',
        approvedSourcePhotos: [],
        source: 'telephony',
        sourceUpdatedAt: new Date().toISOString()
      } as any,
      proofPackage: {
        flyerUrl: 'https://drive.google.com/drive/folders/proofs_flyer',
        socialStoryUrl: 'https://drive.google.com/drive/folders/proofs_story',
        postcardUrl: 'https://drive.google.com/drive/folders/proofs_postcard',
        allAssetsStaged: true
      } as any
    };
    saveCampaign(newCamp);
  }

  console.log(`[Telephony Sync] Created new canonical request for ${propertyAddress} (${reqId}) with ${createdTasks.length} tasks.`);
  const activeTasks = getAllCanonicalMarketingTasks().filter(t => t.requestId === newRequest.id || newRequest.taskIds.includes(t.id));

  return {
    shouldCreate: true,
    suppressed: false,
    request: newRequest,
    tasks: createdTasks.length > 0 ? createdTasks : activeTasks
  };
}

export function resetCanonicalStoreForTesting() {
  hasLoadedCanonicalStore = true;
  canonicalTasksStore = [];
  canonicalRequestsStore = [];
  OfficeSupplyDeduplicationService.clearOrders();
  if (!isServer) return;
  try {
    const paths = getCanonicalDataPaths();
    if (paths && fs.existsSync(paths.dataFile)) {
      fs.writeFileSync(paths.dataFile, JSON.stringify({ tasks: [], requests: [] }, null, 2), 'utf-8');
    }
  } catch {}
}

export function getMarketingVendorWorkOrders(): any[] {
  const tasks = getAllCanonicalMarketingTasks();
  const vendorTasks = tasks.filter(t => !t.isArchived && (t.status === 'with_vendor' || Boolean(t.vendorName)));

  return vendorTasks.map(t => ({
    id: `mkt_vendor_${t.id}`,
    source: 'marketing',
    title: t.title,
    propertyAddress: t.propertyAddress || t.requestTitle,
    vendorName: t.vendorName || 'FastSigns',
    status: t.status === 'with_vendor' ? 'with_vendor' : 'pending_vendor_dispatch',
    dueAt: t.dueAt,
    notes: t.vendorNotes || t.notes,
    assignedTo: t.assignedTo,
    taskId: t.id,
    requestId: t.requestId,
    createdAt: t.createdAt
  }));
}

export interface ProofPortalData {
  token: string;
  campaignId: string;
  propertyAddress: string;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  status: CanonicalMarketingTask['status'];
  packageType: string;
  deliverables: Array<{
    id: string;
    name: string;
    format: string;
    dimensions: string;
    previewUrl: string;
    pdfDownloadUrl: string;
    dpi: number;
    specs: string;
  }>;
  createdAt: string;
  approvalHistory: any[];
}

export function getProofPortalDataByToken(token: string): ProofPortalData {
  const allTasks = getAllCanonicalMarketingTasks();
  const matchedTask = allTasks.find(t => t.id.includes(token) || t.requestId?.includes(token)) || allTasks[0];

  return {
    token,
    campaignId: matchedTask.requestId || 'camp_1104_arboretum',
    propertyAddress: matchedTask.propertyAddress || matchedTask.requestTitle || '1104 Arboretum Dr, Wilmington, NC 28405',
    agentName: matchedTask.agentName || 'Jessica Keenan',
    agentPhone: '+19103681507',
    agentEmail: 'jessica.keenan@nestrealty.com',
    status: matchedTask.status,
    packageType: 'Luxury Listing Launch Package',
    deliverables: [
      {
        id: 'deliv_flyer_01',
        name: 'Double-Sided 8.5x11 Property Flyer (300 DPI)',
        format: 'PDF',
        dimensions: '8.5" x 11" (2550 x 3300 px)',
        previewUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=90',
        pdfDownloadUrl: '/api/marketing/proofs/flyer_1104_arboretum.pdf',
        dpi: 300,
        specs: 'Full Bleed 300 DPI CMYK Print Spec'
      },
      {
        id: 'deliv_story_02',
        name: '9:16 Instagram & Facebook Story Carousel (3-Slide)',
        format: 'PNG',
        dimensions: '1080 x 1920 px (9:16 HD)',
        previewUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1080&q=90',
        pdfDownloadUrl: '/api/marketing/proofs/story_1104_arboretum.png',
        dpi: 300,
        specs: 'Retina Crisp Mobile Social Story'
      },
      {
        id: 'deliv_postcard_03',
        name: '6x9 Jumbo EDDM Direct Mail Postcard',
        format: 'PDF',
        dimensions: '6" x 9" (1800 x 2700 px)',
        previewUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=90',
        pdfDownloadUrl: '/api/marketing/proofs/postcard_1104_arboretum.pdf',
        dpi: 300,
        specs: 'USPS EDDM Compliant Direct Mail'
      }
    ],
    createdAt: matchedTask.createdAt,
    approvalHistory: matchedTask.approvalHistory || []
  };
}

export function processProofPortalAction(
  token: string,
  action: 'approve' | 'request_changes',
  details?: { note?: string; selectedChanges?: string[]; performedBy?: string }
): { success: boolean; data: ProofPortalData } {
  const data = getProofPortalDataByToken(token);
  const allTasks = getAllCanonicalMarketingTasks();
  const matchedTask = allTasks.find(t => t.id.includes(token) || t.requestId?.includes(token)) || allTasks[0];

  if (action === 'approve') {
    updateCanonicalMarketingTaskStatus(matchedTask.id, 'approved', {
      performedBy: details?.performedBy || data.agentName,
      note: 'Approved via Mobile Proof Portal'
    });
    data.status = 'approved';
  } else if (action === 'request_changes') {
    const feedbackNote = details?.note || details?.selectedChanges?.join(', ') || 'Agent requested revisions via Proof Portal';
    updateCanonicalMarketingTaskStatus(matchedTask.id, 'revisions', {
      performedBy: details?.performedBy || data.agentName,
      note: feedbackNote
    });
    data.status = 'revisions';
  }

  return { success: true, data };
}

// -------------------------------------------------------------
// MELISSA'S WORKFLOW POWER PACK: PRESETS, BATCH OPS & PRINT MANIFESTS
// -------------------------------------------------------------

export interface DeliverablePackagePreset {
  id: 'standard_launch' | 'luxury_waterfront' | 'open_house_kit' | 'annual_farming';
  name: string;
  badge: string;
  description: string;
  deliverables: Array<{
    title: string;
    category: CanonicalMarketingTask['category'];
    vendorName?: string;
    vendorNotes?: string;
    notes?: string;
  }>;
}

export const DELIVERABLE_PACKAGE_PRESETS: DeliverablePackagePreset[] = [
  {
    id: 'standard_launch',
    name: 'Standard Listing Launch Suite',
    badge: '4 Deliverables',
    description: 'Essential launch bundle for single family homes and townhomes.',
    deliverables: [
      {
        title: 'Double-Sided 8.5x11 Property Flyer (300 DPI)',
        category: 'print',
        notes: '100# Gloss Cover stock, double-sided full bleed.'
      },
      {
        title: 'Colonial Yard Sign Post & Custom Rider Installation',
        category: 'signage',
        vendorName: 'Coastal Sign Post Co.',
        vendorNotes: 'Standard 4x4 white vinyl post with coming soon / under contract rider.'
      },
      {
        title: '3-Slide Instagram & Facebook Story Carousel (9:16 HD)',
        category: 'social',
        notes: '3-slide animated teaser with property highlights.'
      },
      {
        title: '6x9 Jumbo EDDM Just Listed Postcard',
        category: 'print',
        vendorName: 'PostGrid / USPS EDDM',
        vendorNotes: 'Carrier route saturation for nearest 250 homes.'
      }
    ]
  },
  {
    id: 'luxury_waterfront',
    name: 'Luxury Waterfront Estate Suite',
    badge: '6 Deliverables',
    description: 'Comprehensive high-end package for waterfront and golf course estates ($1M+).',
    deliverables: [
      {
        title: '4-Page Saddle-Stitched Gloss Magazine Feature Booklet',
        category: 'print',
        notes: '100# Velvet cover with soft-touch matte finish.'
      },
      {
        title: 'Custom Laser-Cut Metal Sign Post & Solar Illumination',
        category: 'signage',
        vendorName: 'FastSigns Wilmington',
        vendorNotes: 'Architectural black metal post with solar LED cap.'
      },
      {
        title: '30s 4K Drone Cinematic Video Teaser Reel',
        category: 'video',
        notes: 'Waterfront aerial footage & sunset cinematic sweep.'
      },
      {
        title: '9:16 Social Story + 1:1 Feed Carousel Package',
        category: 'social',
        notes: '5-slide luxury editorial carousel with custom typography.'
      },
      {
        title: '6x11 Oversized Direct Mail Luxury Showcase',
        category: 'print',
        vendorName: 'PostGrid / USPS EDDM',
        vendorNotes: 'Targeted high-net-worth carrier routes.'
      },
      {
        title: 'Spatial Comps Waterfront Risk & Lifestyle Report',
        category: 'digital',
        notes: 'Dock depth, bulkhead permit, and waterway navigation sheet.'
      }
    ]
  },
  {
    id: 'open_house_kit',
    name: 'Open House Weekend Kit',
    badge: '3 Deliverables',
    description: 'Fast-turnaround collateral kit for upcoming Saturday/Sunday open houses.',
    deliverables: [
      {
        title: 'Open House Directional A-Frames & Arrow Signs',
        category: 'signage',
        vendorName: 'Coastal Sign Post Co.',
        vendorNotes: '4 directional A-frames placed at key neighborhood intersections.'
      },
      {
        title: 'Open House Handout Feature Sheet (300 DPI)',
        category: 'print',
        notes: 'Single-sheet color takeaway with lender financing breakdown.'
      },
      {
        title: '9:16 Social Story Teaser with Date/Time Sticker',
        category: 'social',
        notes: 'Instagram story sticker with RSVP prompt.'
      }
    ]
  },
  {
    id: 'annual_farming',
    name: 'Annual Neighborhood Farming Drop',
    badge: '2 Deliverables',
    description: 'Quarterly market update mailer for geographic farm areas.',
    deliverables: [
      {
        title: 'Hyperlocal Neighborhood Market Update Mailer (6x9)',
        category: 'farming',
        vendorName: 'PostGrid / USPS EDDM',
        vendorNotes: 'Recent solds, average price per sqft, and neighborhood turnover rate.'
      },
      {
        title: 'Digital Neighborhood Market Graphic for Email/Social',
        category: 'social',
        notes: 'Square graphic for agent monthly email newsletter.'
      }
    ]
  }
];

export function applyDeliverablePresetToRequest(
  requestId: string,
  presetId: 'standard_launch' | 'luxury_waterfront' | 'open_house_kit' | 'annual_farming'
): { success: boolean; createdTasks: CanonicalMarketingTask[]; request: CanonicalMarketingRequest | null } {
  const req = getCanonicalMarketingRequestById(requestId);
  if (!req) return { success: false, createdTasks: [], request: null };

  const preset = DELIVERABLE_PACKAGE_PRESETS.find(p => p.id === presetId) || DELIVERABLE_PACKAGE_PRESETS[0];
  const now = new Date().toISOString();
  const dueAt = new Date(Date.now() + 86400000 * 2).toISOString();

  const createdTasks: CanonicalMarketingTask[] = preset.deliverables.map((d, idx) => {
    const taskId = `task_${req.id}_${preset.id}_${idx}_${Date.now().toString(36)}`;
    const task: CanonicalMarketingTask = {
      id: taskId,
      requestId: req.id,
      requestTitle: req.title,
      propertyAddress: req.propertyAddress || req.title,
      agentName: req.agentName,
      title: d.title,
      category: d.category,
      status: 'request_received', // Placed directly into Request Received
      dueAt,
      vendorName: d.vendorName,
      vendorNotes: d.vendorNotes,
      notes: d.notes || `Created via ${preset.name}`,
      createdAt: now,
      updatedAt: now
    };
    return saveCanonicalMarketingTask(task);
  });

  const updatedReq: CanonicalMarketingRequest = {
    ...req,
    taskIds: Array.from(new Set([...(req.taskIds || []), ...createdTasks.map(t => t.id)])),
    updatedAt: now
  };
  saveCanonicalMarketingRequest(updatedReq);

  return { success: true, createdTasks, request: updatedReq };
}

export function addCustomDeliverableToRequest(
  requestId: string,
  deliverable: {
    title: string;
    category?: CanonicalMarketingTask['category'];
    vendorName?: string;
    vendorNotes?: string;
    notes?: string;
    assignedTo?: string;
  }
): { success: boolean; task: CanonicalMarketingTask | null } {
  const req = getCanonicalMarketingRequestById(requestId);
  if (!req) return { success: false, task: null };

  const now = new Date().toISOString();
  const taskId = `task_${req.id}_custom_${Date.now().toString(36)}`;
  const task: CanonicalMarketingTask = {
    id: taskId,
    requestId: req.id,
    requestTitle: req.title,
    propertyAddress: req.propertyAddress || req.title,
    agentName: req.agentName,
    title: deliverable.title || 'Custom Marketing Deliverable',
    category: deliverable.category || 'print',
    status: deliverable.assignedTo ? 'assigned' : 'request_received',
    assignedTo: deliverable.assignedTo,
    assignedToRole: deliverable.assignedTo === 'Eduardo Lovo' ? 'Virtual Assistant' : deliverable.assignedTo ? 'Marketing Director' : undefined,
    dueAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    vendorName: deliverable.vendorName,
    vendorNotes: deliverable.vendorNotes,
    notes: deliverable.notes || 'Custom task added by Melissa Gagliardi',
    createdAt: now,
    updatedAt: now
  };

  const saved = saveCanonicalMarketingTask(task);

  const updatedReq: CanonicalMarketingRequest = {
    ...req,
    taskIds: Array.from(new Set([...(req.taskIds || []), saved.id])),
    updatedAt: now
  };
  saveCanonicalMarketingRequest(updatedReq);

  return { success: true, task: saved };
}

export function performBulkTaskAction(
  taskIds: string[],
  action: 'assign_eduardo' | 'assign_melissa' | 'vendor_dispatch' | 'approve' | 'archive' | 'restore',
  payload?: { vendorName?: string; performedBy?: string; note?: string }
): { success: boolean; affectedCount: number; updatedTasks: CanonicalMarketingTask[] } {
  const allTasks = getAllCanonicalMarketingTasks();
  const targetTasks = allTasks.filter(t => taskIds.includes(t.id));
  const updatedTasks: CanonicalMarketingTask[] = [];

  for (const task of targetTasks) {
    if (action === 'assign_eduardo') {
      const updated = updateCanonicalMarketingTaskStatus(task.id, 'assigned', {
        assignedTo: 'Eduardo Lovo',
        assignedToId: 'dir_eduardo_lovo_73',
        assignedToRole: 'Virtual Assistant',
        performedBy: payload?.performedBy || 'Melissa Gagliardi'
      });
      if (updated) updatedTasks.push(updated);
    } else if (action === 'assign_melissa') {
      const updated = updateCanonicalMarketingTaskStatus(task.id, 'assigned', {
        assignedTo: 'Melissa Gagliardi',
        assignedToId: 'dir_melissa_gagliardi_33',
        assignedToRole: 'Marketing Director',
        performedBy: payload?.performedBy || 'Melissa Gagliardi'
      });
      if (updated) updatedTasks.push(updated);
    } else if (action === 'vendor_dispatch') {
      const vName = payload?.vendorName || (task.category === 'signage' ? 'Coastal Sign Post Co.' : 'FastSigns Wilmington');
      const updated = updateCanonicalMarketingTaskStatus(task.id, 'with_vendor', {
        vendorName: vName,
        vendorNotes: payload?.note || `Dispatched to ${vName} by Melissa`,
        performedBy: payload?.performedBy || 'Melissa Gagliardi'
      });
      if (updated) updatedTasks.push(updated);
    } else if (action === 'approve') {
      const updated = updateCanonicalMarketingTaskStatus(task.id, 'approved', {
        performedBy: payload?.performedBy || 'Melissa Gagliardi',
        note: payload?.note || 'Bulk approved'
      });
      if (updated) updatedTasks.push(updated);
    } else if (action === 'archive') {
      const updated = updateCanonicalMarketingTaskStatus(task.id, 'archived', {
        performedBy: payload?.performedBy || 'Melissa Gagliardi',
        note: payload?.note || 'Archived via bulk action'
      });
      if (updated) {
        updatedTasks.push(updated);
        // Check if all sibling tasks for this request are now archived
        if (task.requestId) {
          const req = getCanonicalMarketingRequestById(task.requestId);
          if (req && !req.isArchived) {
            const siblingTasks = getAllCanonicalMarketingTasks().filter(t => t.requestId === req.id || req.taskIds?.includes(t.id));
            const allArchived = siblingTasks.every(t => t.isArchived || t.status === 'archived' || updatedTasks.some(u => u.id === t.id && u.isArchived));
            if (allArchived) {
              req.isArchived = true;
              req.updatedAt = new Date().toISOString();
              saveCanonicalMarketingRequest(req);
            }
          }
        }
      }
    } else if (action === 'restore') {
      const restored = restoreCanonicalMarketingTask(task.id);
      if (restored) updatedTasks.push(restored);
    }
  }

  saveCanonicalStoreToDisk();
  return { success: true, affectedCount: updatedTasks.length, updatedTasks };
}

export interface PrintSpecManifest {
  manifestId: string;
  createdAt: string;
  jobName: string;
  propertyAddress: string;
  items: Array<{
    title: string;
    dimensions: string;
    stock: string;
    coating: string;
    bleed: string;
    quantity: number;
    colorMode: string;
    pdfUrl: string;
  }>;
  dropOffLocation: {
    name: string;
    address: string;
    contact: string;
    phone: string;
  };
  billingTerms: string;
  totalPrintUnits: number;
}

export function generatePrintManifest(taskIds: string[], options?: { quantity?: number }): PrintSpecManifest {
  const allTasks = getAllCanonicalMarketingTasks();
  const matched = allTasks.filter(t => taskIds.includes(t.id));
  const primaryTask = matched[0] || allTasks[0];
  const qty = options?.quantity || 50;

  return {
    manifestId: `PM_${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    jobName: `Nest Print Order — ${primaryTask?.propertyAddress || 'Listing Suite'}`,
    propertyAddress: primaryTask?.propertyAddress || '1022 Military Cutoff Rd, Wilmington, NC 28405',
    items: matched.map(t => ({
      title: t.title,
      dimensions: t.title.toLowerCase().includes('postcard') ? '6" x 9"' : '8.5" x 11"',
      stock: t.title.toLowerCase().includes('postcard') ? '14pt Heavy Cardstock' : '100# Gloss Text / Cover',
      coating: 'Satin Matte Soft Touch',
      bleed: '0.125" (Full Bleed CMYK)',
      quantity: qty,
      colorMode: '4/4 Double-Sided Full Color',
      pdfUrl: `/api/marketing/proofs/${t.id}_300dpi.pdf`
    })),
    dropOffLocation: {
      name: 'Nest Realty Wilmington Headquarters',
      address: '1022 Military Cutoff Rd, Suite 100, Wilmington, NC 28405',
      contact: 'Melissa Gagliardi (Marketing Director)',
      phone: '(910) 507-2047'
    },
    billingTerms: 'Nest Realty Wilmington Commercial Account (Net 30)',
    totalPrintUnits: matched.length * qty
  };
}

export function dispatchPrintShopOrder(
  manifestId: string,
  recipientEmail?: string
): { success: boolean; dispatchReceipt: { manifestId: string; vendor: string; sentTo: string; timestamp: string } } {
  return {
    success: true,
    dispatchReceipt: {
      manifestId,
      vendor: 'AlphaGraphics Wilmington',
      sentTo: recipientEmail || 'orders@alphagraphicsilm.com',
      timestamp: new Date().toISOString()
    }
  };
}





/** Build-unblock stubs (prefs tip imported these before modules landed). */
export function computeCanonicalDeliverableKey(input: any): string {
  return String(input?.id || input?.taskId || input?.deliverableKey || 'unknown');
}
export function generateDurableChildTaskId(parentId: string, key: string): string {
  return `${parentId}__${key}`;
}
export function findExistingChildTask(_parentId: string, _key: string): any | null {
  return null;
}
export function extractCanonicalDeliverableIdentity(input: any): any {
  return { key: computeCanonicalDeliverableKey(input), input };
}
export function getCanonicalMarketingTasksLive(workspaceId?: string, _forceFresh?: boolean, includeArchived: boolean = true): any[] {
  const all = (typeof getAllCanonicalMarketingTasks === 'function' ? getAllCanonicalMarketingTasks() : []);
  const filtered = includeArchived ? all : all.filter((t: any) => !t?.isArchived && t?.status !== 'archived');
  if (workspaceId) {
    return filtered.filter((t: any) => !t.workspaceId || t.workspaceId === workspaceId);
  }
  return filtered;
}

export function getCanonicalMarketingRequestsLive(workspaceId?: string, _forceFresh?: boolean, includeArchived: boolean = true): any[] {
  const all = (typeof getAllCanonicalMarketingRequests === 'function' ? getAllCanonicalMarketingRequests() : []);
  const filtered = includeArchived ? all : all.filter((r: any) => !r?.isArchived && r?.status !== 'archived');
  if (workspaceId) {
    return filtered.filter((r: any) => !r.workspaceId || r.workspaceId === workspaceId);
  }
  return filtered;
}

export async function performBulkTaskActionAsync(
  arg1: string[] | string,
  arg2: string | string[],
  arg3?: { vendorName?: string; performedBy?: string; note?: string; workspaceId?: string }
): Promise<{ success: boolean; affectedCount: number; updatedTasks: CanonicalMarketingTask[]; ok: boolean }> {
  let taskIds: string[];
  let action: any;
  let payload = arg3;

  if (Array.isArray(arg1)) {
    taskIds = arg1;
    action = arg2 as any;
  } else {
    action = arg1 as any;
    taskIds = Array.isArray(arg2) ? arg2 : [String(arg2)];
  }

  const syncResult = performBulkTaskAction(taskIds, action, payload);

  if (action === 'archive' && syncResult.updatedTasks.length > 0) {
    for (const t of syncResult.updatedTasks) {
      void tombstoneIntakeScope({
        workspaceId: (t as any).workspaceId || payload?.workspaceId || 'ws_wilmington',
        requestId: t.requestId,
        propertyAddress: t.propertyAddress,
        reason: 'bulk_archived_task',
      }).catch((err) => console.warn('[performBulkTaskActionAsync] tombstone failed:', err?.message || err));
    }
  }

  if (action === 'restore' && syncResult.updatedTasks.length > 0) {
    for (const t of syncResult.updatedTasks) {
      void removeTombstone({
        workspaceId: (t as any).workspaceId || payload?.workspaceId || 'ws_wilmington',
        requestId: t.requestId,
        propertyAddress: t.propertyAddress
      }).catch((err) => console.warn('[performBulkTaskActionAsync] remove tombstone failed:', err?.message || err));
    }
  }

  if (isServer && syncResult.updatedTasks.length > 0) {
    for (const t of syncResult.updatedTasks) {
      await persistTaskToDatabase(t).catch((err) => console.warn('[performBulkTaskActionAsync] persistTask error:', err?.message || err));
      if (t.requestId) {
        const parentReq = getCanonicalMarketingRequestById(t.requestId);
        if (parentReq) await persistRequestToDatabase(parentReq).catch((err) => console.warn('[performBulkTaskActionAsync] persistRequest error:', err?.message || err));
      }
    }
  }

  return { ...syncResult, ok: syncResult.success };
}

export async function purgeAllArchivedCanonicalTasksAsync(): Promise<{ purged: number; purgedTasks: number; purgedRequests: number }> {
  const syncResult = purgeAllArchivedCanonicalTasks();
  if (isServer) {
    try {
      const { dbPool, getDbPool } = await import('./repositories.js');
      const db = getDbPool ? getDbPool() : dbPool;
      if (db) {
        await db.query(`DELETE FROM canonical_marketing_tasks WHERE is_archived = TRUE OR status = 'archived'`).catch(() => {});
        await db.query(`DELETE FROM canonical_marketing_requests WHERE is_archived = TRUE OR status = 'archived'`).catch(() => {});
      }
    } catch (err: any) {
      console.warn('[purgeAllArchivedCanonicalTasksAsync] DB purge warning:', err?.message || err);
    }
  }
  return {
    purged: syncResult.purgedTasks + syncResult.purgedRequests,
    purgedTasks: syncResult.purgedTasks,
    purgedRequests: syncResult.purgedRequests
  };
}
export function recoverInvisibleAwaitingReviewSubmissions(): { recovered: number } {
  return { recovered: 0 };
}
