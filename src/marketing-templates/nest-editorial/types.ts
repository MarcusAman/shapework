// Nest Editorial Template System Type Definitions (nest_editorial_v1)

export interface ApprovedPhoto {
  id: string;
  category: 'hero' | 'exterior' | 'pool' | 'patio' | 'living' | 'kitchen' | 'aerial' | 'bathroom';
  url: string; // Base64 data URI or resolved HTTP URL
  altText: string;
  width?: number;
  height?: number;
}

export interface AgentProfile {
  name: string;
  title: string;
  office: string;
  phone: string;
  email: string;
  licenseNumber: string;
  avatarUrl?: string;
}

export interface LegalMetadata {
  ncrecLicense: string;
  equalHousingText: string;
  disclaimer: string;
}

export interface PropertyFact {
  label: string;
  value: string;
}

export interface FlyerTemplateContent {
  brandName: string;
  subBrand?: string;
  eyebrow: string;
  headline: string;
  address: string;
  cityStateZip: string;
  priceFormatted: string;

  facts: PropertyFact[];

  heroPhoto: ApprovedPhoto;
  secondaryPhoto?: ApprovedPhoto;

  featuresTitle?: string;
  features: string[];

  positioningNarrative?: string;

  agent: AgentProfile;
  legal: LegalMetadata;
}

export interface TemplateVersionMetadata {
  templateId: 'nest_editorial_v1';
  variant: 'editorial_hero' | 'property_details' | 'open_house';
  campaignRevision: number;
  listingSnapshotVersion: string;
  brandKitVersion: string;
  rendererVersion: string;
  generatedAt: string;
}
