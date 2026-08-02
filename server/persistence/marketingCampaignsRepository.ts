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
}

export interface CampaignBrief {
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
}

export interface MarketingAsset {
  id: string;
  assetType: 'flyer' | 'carousel' | 'postcard' | 'sign_rider' | 'landing_page_draft' | 'story_reel_storyboard' | 'floorplan' | 'cma';
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
  status: 'intake' | 'needs_information' | 'ready_to_generate' | 'generating' | 'review' | 'changes_requested' | 'approved' | 'exported' | 'delivered';
  listingSnapshot: ListingSnapshot;
  brandKit: BrandKit;
  campaignBrief: CampaignBrief;
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

// Seed Default Primary Campaign (990 Inspiration Drive)
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
    },
    {
      id: 'photo_kitchen',
      url: '/api/marketing/campaigns/campaign_990_inspiration/assets/photo_kitchen/raw',
      caption: 'Gourmet Quartzite Kitchen & Thermador Suite',
      category: 'kitchen',
      sourceProvenance: 'Physical Photo #1 (Shared Facade/Interior): luxury_home_990_inspiration_1785434122508.jpg (Fixture)',
      metadataSource: 'fixture',
      photographerName: 'Alex Carter',
      photographerLicense: 'FAA License #FA-394201',
      byteSize: 1025857,
      width: 1920,
      height: 1280,
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    {
      id: 'photo_aerial',
      url: '/api/marketing/campaigns/campaign_990_inspiration/assets/photo_aerial/raw',
      caption: '0.84-Acre Private Parcel Overview',
      category: 'aerial',
      sourceProvenance: 'Physical Photo #2 (Shared Pool/Aerial): luxury_home_212_wetland_1785433917769.jpg (Fixture)',
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
    id: 'brand_nest_wilmington',
    brokerageName: 'Nest Realty Wilmington',
    officeName: 'Wilmington Main Office',
    primaryColor: '#00635C',
    secondaryColor: '#D0D6BB',
    backgroundColor: '#FFFFFF',
    darkCharcoal: '#0F172A',
    approvedFonts: ['Inter', 'Outfit', 'Playfair Display'],
    logoUrl: '/nest-realty-logo.png',
    fairHousingLogoUrl: '/nest_n.png',
    officeAddress: '1055 Military Cutoff Rd, Wilmington NC 28405',
    officePhone: '(910) 392-4100',
    website: 'https://nestrealty.com/wilmington',
    agentAttributionRules: 'Listing Agent attribution required on all print & digital collateral per NCREC rules.',
    disclaimerText: 'Equal Housing Opportunity. All information deemed reliable but not guaranteed. Each Nest Realty office is independently owned and operated.'
  };

  const defaultBrief: CampaignBrief = {
    objective: 'High-impact launch campaign for luxury Mayfaire estate',
    targetAudience: 'Move-up buyers, coastal luxury seekers & relocations',
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
    selectedAssetFormats: ['flyer', 'carousel', 'postcard', 'sign_rider', 'email_announcement'],
    dueTargetDate: '2026-08-03',
    reviewOwner: 'Ryan Crecelius (BIC)'
  };

  return {
    id: 'campaign_990_inspiration',
    workspaceId: 'nest-realty-demo',
    propertyAddress: '990 Inspiration Drive, Wilmington, NC 28405',
    listingAgentId: 'agent_ryan_crecelius',
    marketingOwnerId: 'marketing_melissa',
    status: 'approved',
    listingSnapshot: defaultSnapshot,
    brandKit: defaultBrandKit,
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
        selectedSourcePhotoIds: ['photo_hero', 'photo_pool', 'photo_kitchen', 'photo_aerial'],
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
          '1_instagram': '✨ JUST LISTED IN WILMINGTON! 990 Inspiration Drive ($1,250,000). 4 Beds, 4.5 Baths, private heated pool & gourmet quartzite kitchen. Contact Ryan Crecelius at (910) 232-1772 for a private briefing! 🌊 #NestRealty #WilmingtonNC #LuxuryRealEstate'
        },
        selectedSourcePhotoIds: ['photo_hero', 'photo_pool', 'photo_kitchen', 'photo_aerial'],
        status: 'approved',
        complianceStatus: 'passed',
        complianceIssues: [],
        updatedAt: new Date().toISOString()
      }
    },
    readinessCheck: {
      propertyDetailsComplete: true,
      approvedPhotosCount: 4,
      listingAgentAssigned: true,
      brandKitValid: true,
      disclosuresApproved: true,
      isReadyForGeneration: true,
      missingFields: []
    },
    approvals: [
      {
        id: 'appr_001',
        reviewerName: 'Demo Fixture System',
        role: 'System Seeded Fixture',
        status: 'approved',
        comments: 'Source: Demo fixture | Approval state: Approved in seeded demonstration campaign | Human verification: Not performed',
        timestamp: new Date().toISOString()
      }
    ],
    auditTrail: [
      {
        id: 'audit_001',
        action: 'CAMPAIGN_CREATED',
        performedBy: 'Ryan Crecelius (BIC)',
        timestamp: new Date().toISOString(),
        details: 'Created listing marketing campaign for 990 Inspiration Drive'
      },
      {
        id: 'audit_002',
        action: 'COMPLIANCE_AUDITED',
        performedBy: 'Shapework Compliance Engine',
        timestamp: new Date().toISOString(),
        details: 'Verified NCREC attribution & Equal Housing Opportunity compliance.'
      },
      {
        id: 'audit_003',
        action: 'PACKAGE_APPROVED',
        performedBy: 'Ryan Crecelius (BIC)',
        timestamp: new Date().toISOString(),
        details: 'Approved collateral package for distribution.'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function initializeCampaignsStore(initialData?: ListingMarketingCampaign[]) {
  if (initialData && initialData.length > 0) {
    campaignsStore = initialData;
  } else if (campaignsStore.length === 0) {
    campaignsStore = [getInitialDefaultCampaign()];
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
  return campaignsStore.find(c => c.id === id || c.id === normalizedId || c.propertyAddress.toLowerCase().includes(id.toLowerCase()));
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
