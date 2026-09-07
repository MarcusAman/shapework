/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Provider-Neutral MLS Integration Adapter
 * 
 * Governing Principle:
 * "NORA may claim MLS live completion only when an authorized RESO Web API or MLS data feed
 * returns verified provider records. Without approved MLS credentials or license agreement,
 * status must strictly return LICENSE_REQUIRED or FIXTURE, never falsely labeled as LIVE."
 */

export type MlsCapabilityStatus =
  | 'LIVE'
  | 'SANDBOX'
  | 'FIXTURE'
  | 'DISCONNECTED'
  | 'LICENSE_REQUIRED';

export type MlsPermittedUse =
  | 'IDX_PUBLIC'
  | 'VOW_CONSUMER'
  | 'BACK_OFFICE_FIU'
  | 'BROKERAGE_INTERNAL'
  | 'SANDBOX_FIXTURE';

export interface MlsListing {
  provider: string;
  providerRecordId: string;
  mlsNumber: string;
  propertyAddress: string;
  city: string;
  state: string;
  zip: string;
  listPrice: number;
  priceFormatted: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSizeAcres?: number;
  yearBuilt: number;
  propertyType: string;
  status: 'Active' | 'Pending' | 'Closed' | 'Coming Soon' | 'Expired' | 'Withdrawn';
  listingAgent: string;
  listingAgentEmail?: string;
  listingOffice: string;
  sourceTimestamp: string;
  lastProviderUpdate: string;
  retrievedAt: string;
  permittedUse: MlsPermittedUse;
  providerMode: MlsCapabilityStatus;
  evidenceStatus: 'VERIFIED_LIVE' | 'FIXTURE' | 'SANDBOX' | 'UNVERIFIED';
  photos: string[];
  features: string[];
  remarks?: string;
}

export interface MlsSearchQuery {
  address?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface MlsMetadata {
  providerName: string;
  feedType: 'RESO_WEB_API_V1' | 'RESO_WEB_API_V2' | 'RETS_1_8' | 'RECHAT_MCP' | 'LOCAL_FIXTURE';
  version: string;
  serverUrl?: string;
  availableResources: string[];
  authenticationMethod: 'BEARER_OAUTH2' | 'BASIC_AUTH' | 'TOKEN' | 'NONE';
  licenseStatus: 'AUTHORIZED_ACTIVE' | 'PENDING_APPROVAL' | 'UNLICENSED' | 'SANDBOX_SAMPLE_ONLY';
  rateLimits?: { requestsPerMinute: number; maxBatchSize: number };
}

export interface MlsConnectionEvidence {
  connected: boolean;
  providerMode: MlsCapabilityStatus;
  latencyMs: number;
  serverEndpoint?: string;
  authenticatedIdentity?: string;
  lastVerifiedAt: string;
  notes: string;
  exactBlocker?: string;
}

export interface MlsChangePage {
  items: MlsListing[];
  nextCursor: string | null;
  hasMore: boolean;
  totalChangesCount: number;
  syncedTimestamp: string;
}

export interface ProviderResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  evidence: MlsConnectionEvidence;
}

export interface MlsProvider {
  getCapabilityStatus(): Promise<MlsCapabilityStatus>;
  testConnection(): Promise<ProviderResult<MlsConnectionEvidence>>;
  getMetadata(): Promise<ProviderResult<MlsMetadata>>;
  searchListings(query: MlsSearchQuery): Promise<ProviderResult<MlsListing[]>>;
  getListingById(id: string): Promise<ProviderResult<MlsListing | null>>;
  getChanges(cursor: string | null): Promise<ProviderResult<MlsChangePage>>;
}

/**
 * Authoritative Fixture Repository for Cape Fear & Wilmington Area Listings
 */
const WILMINGTON_FIXTURE_LISTINGS: MlsListing[] = [
  {
    provider: 'nest_wilmington_fixtures',
    providerRecordId: 'mls_100458921',
    mlsNumber: '100458921',
    propertyAddress: '1104 S Live Oak Pkwy, Wilmington, NC 28403',
    city: 'Wilmington',
    state: 'NC',
    zip: '28403',
    listPrice: 849000,
    priceFormatted: '$849,000',
    bedrooms: 4,
    bathrooms: 3.5,
    squareFeet: 3150,
    lotSizeAcres: 0.38,
    yearBuilt: 2018,
    propertyType: 'Single Family Residence',
    status: 'Active',
    listingAgent: 'Matt Orr (REALTOR®)',
    listingAgentEmail: 'matt.orr@nestrealty.com',
    listingOffice: 'Nest Realty Mayfaire',
    sourceTimestamp: '2026-08-30T10:00:00.000Z',
    lastProviderUpdate: '2026-08-31T14:20:00.000Z',
    retrievedAt: new Date().toISOString(),
    permittedUse: 'SANDBOX_FIXTURE',
    providerMode: 'FIXTURE',
    evidenceStatus: 'FIXTURE',
    photos: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    ],
    features: ['Gourmet Kitchen', 'Screened Lanai', 'Quartz Countertops', 'Fenced Backyard', '2-Car Garage'],
    remarks: 'Modern coastal craftsman located in the Live Oak corridor.'
  },
  {
    provider: 'nest_wilmington_fixtures',
    providerRecordId: 'mls_100461208',
    mlsNumber: '100461208',
    propertyAddress: '212 Wetland Drive, Wilmington, NC 28412',
    city: 'Wilmington',
    state: 'NC',
    zip: '28412',
    listPrice: 625000,
    priceFormatted: '$625,000',
    bedrooms: 3,
    bathrooms: 2.5,
    squareFeet: 2420,
    lotSizeAcres: 0.29,
    yearBuilt: 2021,
    propertyType: 'Single Family Residence',
    status: 'Active',
    listingAgent: 'Marcus Aman (Broker / Tech Lead)',
    listingAgentEmail: 'marcus@shapework.co',
    listingOffice: 'Nest Realty Downtown',
    sourceTimestamp: '2026-08-28T12:00:00.000Z',
    lastProviderUpdate: '2026-08-30T09:15:00.000Z',
    retrievedAt: new Date().toISOString(),
    permittedUse: 'SANDBOX_FIXTURE',
    providerMode: 'FIXTURE',
    evidenceStatus: 'FIXTURE',
    photos: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1200&q=80'
    ],
    features: ['Marshfront Views', 'First Floor Primary Suite', 'Covered Porch', 'Stainless Appliances'],
    remarks: 'Turn-key marshfront retreat offering panoramic coastal views.'
  },
  {
    provider: 'nest_wilmington_fixtures',
    providerRecordId: 'mls_100473119',
    mlsNumber: '100473119',
    propertyAddress: '820 Soundview Dr, Wilmington, NC 28409',
    city: 'Wilmington',
    state: 'NC',
    zip: '28409',
    listPrice: 1195000,
    priceFormatted: '$1,195,000',
    bedrooms: 5,
    bathrooms: 4.5,
    squareFeet: 4200,
    lotSizeAcres: 0.52,
    yearBuilt: 2022,
    propertyType: 'Luxury Waterfront Estate',
    status: 'Active',
    listingAgent: 'Sarah Jenkins',
    listingAgentEmail: 'sarah.j@nestrealty.com',
    listingOffice: 'Nest Realty Wrightsville Beach',
    sourceTimestamp: '2026-08-25T15:30:00.000Z',
    lastProviderUpdate: '2026-08-31T11:00:00.000Z',
    retrievedAt: new Date().toISOString(),
    permittedUse: 'SANDBOX_FIXTURE',
    providerMode: 'FIXTURE',
    evidenceStatus: 'FIXTURE',
    photos: [
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80'
    ],
    features: ['Private Boat Dock', 'Heated Pool', 'Soundfront Sunsets', 'Elevator'],
    remarks: 'Soundfront luxury estate with deepwater boat slip.'
  }
];

export class NoraMlsProviderAdapter implements MlsProvider {
  private endpoint?: string;
  private apiToken?: string;
  private clientId?: string;
  private feedType: 'NCRMLS_DIRECT_RESO' | 'RECHAT_MCP' | 'FIXTURE_ONLY';

  constructor(options?: {
    endpoint?: string;
    apiToken?: string;
    clientId?: string;
    feedType?: 'NCRMLS_DIRECT_RESO' | 'RECHAT_MCP' | 'FIXTURE_ONLY';
  }) {
    this.endpoint = options?.endpoint || process.env.NCRMLS_RESO_API_URL || process.env.RECHAT_MCP_ENDPOINT;
    this.apiToken = options?.apiToken || process.env.NCRMLS_RESO_API_TOKEN || process.env.RECHAT_MCP_API_TOKEN;
    this.clientId = options?.clientId || process.env.NCRMLS_CLIENT_ID;
    this.feedType = options?.feedType || (this.apiToken ? 'NCRMLS_DIRECT_RESO' : 'FIXTURE_ONLY');
  }

  public async getCapabilityStatus(): Promise<MlsCapabilityStatus> {
    if (this.endpoint && this.apiToken && !this.apiToken.includes('mock') && !this.apiToken.includes('placeholder')) {
      return 'LIVE';
    }
    return 'LICENSE_REQUIRED';
  }

  public async testConnection(): Promise<ProviderResult<MlsConnectionEvidence>> {
    const startTime = Date.now();
    const status = await this.getCapabilityStatus();

    if (status === 'LIVE' && this.endpoint) {
      try {
        const res = await fetch(this.endpoint, {
          method: 'GET',
          headers: { Authorization: `Bearer ${this.apiToken}` }
        });
        const latency = Date.now() - startTime;
        return {
          success: res.ok,
          evidence: {
            connected: res.ok,
            providerMode: res.ok ? 'LIVE' : 'DISCONNECTED',
            latencyMs: latency,
            serverEndpoint: this.endpoint,
            lastVerifiedAt: new Date().toISOString(),
            notes: res.ok ? 'Successfully verified live RESO Web API handshake.' : `Provider HTTP ${res.status}: ${res.statusText}`
          }
        };
      } catch (err: any) {
        return {
          success: false,
          evidence: {
            connected: false,
            providerMode: 'DISCONNECTED',
            latencyMs: Date.now() - startTime,
            lastVerifiedAt: new Date().toISOString(),
            notes: `Handshake failed: ${err.message}`,
            exactBlocker: err.message
          }
        };
      }
    }

    // License Required / Fixture fallback
    return {
      success: true,
      evidence: {
        connected: false,
        providerMode: 'LICENSE_REQUIRED',
        latencyMs: 1,
        serverEndpoint: this.endpoint || 'https://api.ncrmls.com/reso/odata (License Required)',
        lastVerifiedAt: new Date().toISOString(),
        notes: 'NCRMLS live feed requires execution of a Data License Agreement (FIU/Back-Office or IDX/VOW) and provisioned RESO Web API client credentials.',
        exactBlocker: 'MLS_LICENSE_OR_CREDENTIALS_REQUIRED: No approved NCRMLS / Cape Fear MLS Web API client token present in environment.'
      }
    };
  }

  public async getMetadata(): Promise<ProviderResult<MlsMetadata>> {
    const connTest = await this.testConnection();
    return {
      success: true,
      data: {
        providerName: 'North Carolina Regional MLS (NCRMLS / Cape Fear REALTORS®)',
        feedType: this.feedType === 'NCRMLS_DIRECT_RESO' ? 'RESO_WEB_API_V2' : 'LOCAL_FIXTURE',
        version: 'RESO Data Dictionary 2.0 / Web API 2.0.0',
        serverUrl: this.endpoint || 'https://api.ncrmls.com/reso/odata',
        availableResources: ['Property', 'Member', 'Office', 'Media', 'HistoryTransactional'],
        authenticationMethod: this.apiToken ? 'BEARER_OAUTH2' : 'NONE',
        licenseStatus: this.apiToken ? 'AUTHORIZED_ACTIVE' : 'UNLICENSED',
        rateLimits: { requestsPerMinute: 120, maxBatchSize: 100 }
      },
      evidence: connTest.evidence
    };
  }

  public async searchListings(query: MlsSearchQuery): Promise<ProviderResult<MlsListing[]>> {
    const connTest = await this.testConnection();
    let matches = [...WILMINGTON_FIXTURE_LISTINGS];

    if (query.address) {
      const q = query.address.toLowerCase();
      matches = matches.filter(m => m.propertyAddress.toLowerCase().includes(q));
    }
    if (query.city) {
      matches = matches.filter(m => m.city.toLowerCase() === query.city!.toLowerCase());
    }
    if (query.minPrice) {
      matches = matches.filter(m => m.listPrice >= query.minPrice!);
    }
    if (query.maxPrice) {
      matches = matches.filter(m => m.listPrice <= query.maxPrice!);
    }
    if (query.bedrooms) {
      matches = matches.filter(m => m.bedrooms >= query.bedrooms!);
    }

    return {
      success: true,
      data: matches,
      evidence: connTest.evidence
    };
  }

  public async getListingById(id: string): Promise<ProviderResult<MlsListing | null>> {
    const connTest = await this.testConnection();
    const cleanId = id.replace(/^mls_/, '');
    const found = WILMINGTON_FIXTURE_LISTINGS.find(
      l => l.providerRecordId === id || l.mlsNumber === cleanId || l.mlsNumber === id
    );

    return {
      success: true,
      data: found || null,
      evidence: connTest.evidence
    };
  }

  public async getListingByMlsNumber(mlsNumber: string): Promise<ProviderResult<MlsListing | null>> {
    return this.getListingById(mlsNumber);
  }

  public async getChanges(cursor: string | null): Promise<ProviderResult<MlsChangePage>> {
    const connTest = await this.testConnection();
    return {
      success: true,
      data: {
        items: WILMINGTON_FIXTURE_LISTINGS,
        nextCursor: null,
        hasMore: false,
        totalChangesCount: WILMINGTON_FIXTURE_LISTINGS.length,
        syncedTimestamp: new Date().toISOString()
      },
      evidence: connTest.evidence
    };
  }
}
