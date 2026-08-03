/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  targetAudience: string;
  tone: string;
  positioning: string;
  keySellingPoints: string[];
  requiredDisclosures: string[];
  callToAction: string;
  openHouseDetails?: string;
  selectedAssetFormats: string[];
  dueTargetDate: string;
  reviewOwner: string;
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
  status: 'draft' | 'ready_for_review' | 'changes_requested' | 'approved' | 'exported';
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
  workspaceId: string;
  propertyAddress: string;
  listingAgentId: string;
  marketingOwnerId: string;
  status: 'intake' | 'request_received' | 'interpreting_request' | 'needs_information' | 'ready_to_prepare' | 'ready_to_generate' | 'generating' | 'preparing' | 'partially_prepared' | 'review' | 'ready_for_review' | 'changes_requested' | 'partially_approved' | 'approved' | 'exported' | 'delivered';
  deliveryStatus?: string;
  listingSnapshot: ListingSnapshot;
  brandKit: BrandKit;
  compliancePolicySet?: CompliancePolicySet;
  campaignBrief: CampaignBrief;
  request?: any;
  originalCommunication?: any;
  followUpRequests?: any[];
  assets: Record<string, MarketingAsset>;
  readinessCheck: {
    propertyDetailsComplete: boolean;
    approvedPhotosCount: number;
    listingAgentAssigned: boolean;
    brandKitValid: boolean;
    disclosuresApproved: boolean;
    isReadyForGeneration: boolean;
    missingFields: string[];
  };
  approvals: Array<{
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
  auditTrail: Array<{
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
    fairHousingLogoUrl: '/nest_n.png',
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
      fairHousingLogoUrl: '/nest_n.png',
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
    requestedByPersonId: 'person_sarah_jenkins',
    requestedByName: 'Sarah Jenkins',
    requestedByRole: 'Listing Agent',
    onBehalfOfPersonId: 'person_sarah_jenkins',
    onBehalfOfName: 'Sarah Jenkins',
    onBehalfOfRole: 'Listing Agent',
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
    from: 'sarah.jenkins@nestrealty.com',
    to: 'marketing-agent@nestrealty.com',
    timestamp: '2026-08-02T08:42:00Z',
    rawText: `From: Sarah Jenkins <sarah.jenkins@nestrealty.com>
To: Shapework Email Agent <marketing-agent@nestrealty.com>
Subject: Marketing Package Request: 212 Wetland Court
Date: Sun, 2 Aug 2026 08:42:00 -0400

Hi Shapework team,

Please create a marketing package for my new listing at 212 Wetland Court. Need the property flyer, postcard, and sign rider ready ASAP.

Thanks,
Sarah Jenkins
Nest Realty Wilmington`
  };

  return {
    id: 'campaign_212_wetland',
    workspaceId: 'nest-realty-demo',
    propertyAddress: '212 Wetland Court, Wilmington, NC 28411',
    listingAgentId: 'agent_sarah_jenkins',
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
      listingAgentId: 'agent_sarah_jenkins',
      listingAgentName: 'Sarah Jenkins',
      listingAgentEmail: 'sarah@nestrealty.com',
      listingAgentPhone: '(910) 555-0144',
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
      fairHousingLogoUrl: '/nest_n.png',
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
      callToAction: 'Contact Sarah Jenkins at (910) 555-0144',
      selectedAssetFormats: ['flyer', 'postcard', 'sign_rider'],
      dueTargetDate: '2026-08-01',
      reviewOwner: 'Sarah Jenkins',
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
        details: 'Received email request from Sarah Jenkins.'
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

export function initializeCampaignsStore(initialData?: ListingMarketingCampaign[]) {
  if (initialData && initialData.length > 0) {
    campaignsStore = initialData;
  } else {
    campaignsStore = [];
  }
  return campaignsStore;
}

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
  return [];
}
    {
      id: 'work_item_flow_b',
      requestId: 'req_304_ocean',
      campaignId: 'campaign_304_ocean',
      workType: 'social_graphic',
      title: '304 Ocean Boulevard — Instagram & Facebook Carousel',
      description: '3-slide social graphic highlighting oceanfront deck and master suite',
      priority: 'urgent',
      executionMode: 'assign_to_va',
      executorType: 'virtual_assistant',
      executorId: 'va_maria',
      executorName: 'Maria (Virtual Assistant)',
      requestOwnerId: 'melissa',
      reviewerId: 'melissa',
      approverId: 'sarah_jenkins',
      status: 'ready_for_review',
      nextAction: 'Melissa to review VA submitted proof v2 after headline correction',
      quoteRequired: false,
      printRequired: false,
      approvalRequired: true,
      requestedDueAt: '2026-08-02T14:00:00Z',
      internalTargetAt: '2026-08-02T12:00:00Z',
      hardDeadline: '2026-08-02T18:00:00Z',
      vaReadiness: {
        workstreamId: 'ws_social_graphics',
        status: 'ready',
        requiredSopUrl: 'https://sop.nest.internal/va/social-graphics-v2',
        templateAccess: true,
        brandKitAccess: true,
        platformAccess: true,
        sampleWorkReviewed: true,
        readinessDate: '2026-07-15'
      },
      sopUrl: 'https://sop.nest.internal/va/social-graphics-v2',
      sopTitle: 'SOP-014: Nest Social Media Post Guidelines',
      producedAssetIds: ['asset_social_304'],
      routingOverrides: [
        {
          recommendedRoute: 'automate_with_review',
          selectedRoute: 'assign_to_va',
          changedBy: 'melissa',
          reason: 'Custom layout requested by Sarah Jenkins requires VA design touch',
          timestamp: '2026-08-02T08:30:00Z'
        }
      ],
      privateNotes: [
        {
          id: 'note_b_01',
          authorId: 'melissa',
          authorName: 'Melissa',
          content: 'Maria adjusted font spacing per my morning note. Looks crisp.',
          visibility: 'melissa_private',
          createdAt: '2026-08-02T10:00:00Z'
        }
      ],
      createdAt: '2026-08-02T08:15:00Z',
      updatedAt: '2026-08-02T09:45:00Z'
    },
    {
      id: 'work_item_flow_c',
      requestId: 'req_212_wetland',
      campaignId: 'campaign_212_wetland',
      workType: 'email_campaign',
      title: '212 Wetland Court — Broker e-Blast Announcement',
      description: 'HTML email blast to regional broker network announcing new marshfront listing',
      priority: 'standard',
      executionMode: 'hybrid',
      executorType: 'virtual_assistant',
      executorId: 'va_maria',
      executorName: 'Maria (Virtual Assistant)',
      requestOwnerId: 'melissa',
      reviewerId: 'melissa',
      approverId: 'sarah_jenkins',
      status: 'in_progress',
      nextAction: 'VA performing final link QA check on Shapework drafted HTML template',
      quoteRequired: false,
      printRequired: false,
      approvalRequired: true,
      requestedDueAt: '2026-08-04T12:00:00Z',
      internalTargetAt: '2026-08-03T15:00:00Z',
      vaReadiness: {
        workstreamId: 'ws_email_qa',
        status: 'ready_with_review',
        requiredSopUrl: 'https://sop.nest.internal/va/email-qa',
        templateAccess: true,
        brandKitAccess: true,
        platformAccess: true,
        sampleWorkReviewed: true
      },
      sopUrl: 'https://sop.nest.internal/va/email-qa',
      sopTitle: 'SOP-009: Email Template QA & Testing Checklist',
      producedAssetIds: ['asset_email_212'],
      createdAt: '2026-08-02T08:45:00Z',
      updatedAt: '2026-08-02T09:00:00Z'
    },
    {
      id: 'work_item_flow_d',
      requestId: 'req_990_sign_print',
      campaignId: 'campaign_990_inspiration',
      workType: 'new_construction_sign',
      title: '990 Inspiration Drive — Heavy-Duty Aluminum Yard Sign (36x24)',
      description: 'Physical custom yard sign rider with QR code for architectural rendering walkthrough',
      priority: 'urgent',
      executionMode: 'external_vendor',
      executorType: 'print_vendor',
      executorName: 'Apex Print & Signs',
      requestOwnerId: 'melissa',
      reviewerId: 'melissa',
      approverId: 'eric_anderson',
      status: 'waiting_on_quote',
      nextAction: 'Awaiting client SMS approval for $185.00 vendor print quote',
      quoteRequired: true,
      printRequired: true,
      approvalRequired: true,
      requestedDueAt: '2026-08-05T17:00:00Z',
      internalTargetAt: '2026-08-03T12:00:00Z',
      printWorkflowStatus: 'waiting_for_quote_approval',
      printSpecs: {
        dimensions: '36" x 24"',
        paperStock: '3mm Dibond Aluminum',
        quantity: 2,
        finish: 'UV Gloss Weather Resistant',
        vendorName: 'Apex Print & Signs',
        pickupLocation: 'Nest HQ Front Desk',
        targetDeliveryDate: '2026-08-05'
      },
      quote: {
        id: 'quote_990_sign',
        workItemId: 'work_item_flow_d',
        amount: 185.0,
        currency: 'USD',
        vendorId: 'vendor_apex',
        vendorName: 'Apex Print & Signs',
        status: 'sent_for_approval',
        sentVia: 'SMS to Eric Anderson (+1-910-555-0199)'
      },
      privateNotes: [
        {
          id: 'note_d_01',
          authorId: 'melissa',
          authorName: 'Melissa',
          content: 'Apex confirmed 48-hour turn time after quote approval.',
          visibility: 'melissa_private',
          createdAt: '2026-08-02T09:20:00Z'
        }
      ],
      createdAt: '2026-08-02T09:00:00Z',
      updatedAt: '2026-08-02T09:50:00Z'
    },
    {
      id: 'work_item_flow_e',
      requestId: 'req_basecamp_hq',
      workType: 'basecamp_task',
      title: 'Q3 Coastal Region Brand Kit Audit & Signage Compliance',
      description: 'Review updated Wilmington & Wrightsville Beach municipal sign ordinances in Basecamp',
      priority: 'standard',
      executionMode: 'assign_to_hq',
      executorType: 'nest_hq',
      executorName: 'Nest HQ Compliance Team',
      requestOwnerId: 'melissa',
      reviewerId: 'melissa',
      approverId: 'melissa',
      status: 'in_progress',
      nextAction: 'Review sign ordinance updates attached in Basecamp project #88412',
      quoteRequired: false,
      printRequired: false,
      approvalRequired: false,
      requestedDueAt: '2026-08-10T17:00:00Z',
      internalTargetAt: '2026-08-08T17:00:00Z',
      basecampRef: {
        projectId: '88412',
        taskId: '99201',
        url: 'https://3.basecamp.com/nest/projects/88412/todolists/99201',
        owner: 'Ann Smith (HQ)',
        lastCheckedAt: '2026-08-02T08:00:00Z',
        label: 'Managed in Basecamp'
      },
      createdAt: '2026-08-01T10:00:00Z',
      updatedAt: '2026-08-02T08:00:00Z'
    },
    {
      id: 'work_item_flow_f',
      requestId: 'req_sop_openhouse',
      workType: 'sop_documentation',
      title: 'Create SOP for Virtual Assistant Open House Collateral Packages',
      description: 'Draft step-by-step SOP and checklist for VA setup of open house directional flyers & social teasers',
      priority: 'standard',
      executionMode: 'assign_to_va',
      executorType: 'virtual_assistant',
      executorId: 'va_maria',
      executorName: 'Maria (Virtual Assistant)',
      requestOwnerId: 'melissa',
      reviewerId: 'melissa',
      approverId: 'melissa',
      status: 'in_progress',
      nextAction: 'VA assembling initial draft outline in shared Google Drive folder',
      quoteRequired: false,
      printRequired: false,
      approvalRequired: true,
      requestedDueAt: '2026-08-07T17:00:00Z',
      internalTargetAt: '2026-08-06T17:00:00Z',
      sopUrl: 'https://sop.nest.internal/va/drafts/open-house-collateral-v1',
      sopTitle: 'SOP Candidate: Open House Collateral Execution Protocol',
      vaReadiness: {
        workstreamId: 'ws_sop_creation',
        status: 'training_required',
        requiredTraining: 'Standard Operating Procedure Documentation Workshop',
        templateAccess: true,
        brandKitAccess: true,
        platformAccess: true,
        sampleWorkReviewed: false
      },
      createdAt: '2026-08-01T14:00:00Z',
      updatedAt: '2026-08-02T09:00:00Z'
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
    item.executorName = item.executorName || 'Maria (Virtual Assistant)';
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
    campaignId: receiptData.campaignId || 'campaign_990_inspiration',
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




