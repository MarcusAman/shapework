/**
 * Nest Design Center (Maxa Designs) Integration Service
 * Bridges Shapework & Ask Nora with Nest Realty's official Maxa design platform (https://nest.maxadesigns.com/)
 */

export interface MaxaTemplateDefinition {
  id: string;
  title: string;
  name?: string;
  category: 'print' | 'social' | 'direct_mail' | 'digital' | 'stationery';
  assetType?: string;
  dimensions: string;
  aspectRatio?: string;
  dpi?: number;
  previewUrl: string;
  maxaCategoryPath: string;
  recommendedFor: string[];
}

export const NEST_MAXA_TEMPLATES: MaxaTemplateDefinition[] = [
  {
    id: 'maxa_flyer_double',
    title: 'Double-Sided Luxury Property Flyer',
    category: 'print',
    dimensions: '8.5" x 11"',
    dpi: 300,
    previewUrl: 'https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/229058/image/original/open-uri20260804-25191-essk58.jpg?1785880440',
    maxaCategoryPath: '/categories/popular',
    recommendedFor: ['Open Houses', 'In-Property Displays', 'Broker Previews']
  },
  {
    id: 'maxa_flyer_single',
    title: 'Single-Sided Quick Listing Flyer',
    category: 'print',
    dimensions: '8.5" x 11"',
    dpi: 300,
    previewUrl: 'https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/229057/image/original/open-uri20260804-25013-t91f3n.jpg?1785880409',
    maxaCategoryPath: '/categories/popular',
    recommendedFor: ['Flyer Boxes', 'Neighborhood Canvassing']
  },
  {
    id: 'maxa_postcard_8_5x5_5',
    title: 'Direct Mail Just Listed Postcard',
    category: 'direct_mail',
    dimensions: '8.5" x 5.5"',
    previewUrl: 'https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/229016/image/original/open-uri20260804-25265-drq7ui.jpg?1785872123',
    maxaCategoryPath: '/categories/popular',
    recommendedFor: ['EDDM Radius Mailings', 'Target Sphere Mail']
  },
  {
    id: 'maxa_social_story',
    title: 'Property Story Reel (9:16)',
    category: 'social',
    dimensions: '1080 x 1920 px',
    aspectRatio: '9:16',
    previewUrl: 'https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/206208/image/original/open-uri20260529-58756-2yqjxb.jpg?1780064887',
    maxaCategoryPath: '/categories/popular',
    recommendedFor: ['Instagram Stories', 'Facebook Stories', 'TikTok']
  },
  {
    id: 'maxa_social_post_headshot',
    title: 'Property Feed Post with Agent Headshot',
    category: 'social',
    dimensions: '1080 x 1080 px',
    aspectRatio: '1:1',
    previewUrl: 'https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/206581/image/original/open-uri20260601-10350-jtsshu.jpg?1780317976',
    maxaCategoryPath: '/categories/popular',
    recommendedFor: ['Instagram Grid', 'Facebook Page', 'LinkedIn']
  },
  {
    id: 'maxa_brochure_4page',
    title: '4-Page Luxury Estate Brochure',
    category: 'print',
    dimensions: '8.5" x 11" (Folded)',
    dpi: 300,
    previewUrl: 'https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/98609/image/original/open-uri20250919-33014-5ek8bu.jpg?1758255938',
    maxaCategoryPath: '/categories/popular',
    recommendedFor: ['High-End Luxury ($1M+)', 'Waterfront Properties']
  },
  {
    id: 'maxa_email_signature',
    title: 'Nest Branded Email Signature Banner',
    category: 'digital',
    dimensions: '800 x 250 px',
    previewUrl: 'https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/128849/image/original/open-uri20251124-81965-467urf.jpg?1764013486',
    maxaCategoryPath: '/categories/popular',
    recommendedFor: ['Agent Gmail / Outlook Client', 'Transaction Email']
  }
];

export const MAXA_PORTAL_URLS = {
  baseUrl: 'https://nest.maxadesigns.com',
  popularTemplates: 'https://nest.maxadesigns.com/categories/popular',
  myListings: 'https://nest.maxadesigns.com/my_listings',
  mlsProfile: 'https://nest.maxadesigns.com/profile/mls',
  accountProfile: 'https://nest.maxadesigns.com/profile',
  scheduledSocial: 'https://nest.maxadesigns.com/scheduled'
};

export interface ListingPackageClipboardPayload {
  headline: string;
  propertyAddress: string;
  price: string;
  specs: string;
  keyFeatures: string[];
  description: string;
  agentName: string;
  agentLicense: string;
  agentPhone: string;
  office: string;
  fullClipboardText: string;
}

export function formatListingCopyForMaxa(data: {
  propertyAddress: string;
  callerName?: string;
  agentName?: string;
  price?: string;
  bedsBaths?: string;
  keyFeatures?: string[];
  transcriptOrExcerpt?: string;
  licenseNumber?: string;
  office?: string;
  phone?: string;
}): ListingPackageClipboardPayload {
  const address = data.propertyAddress || 'Wilmington Luxury Listing';
  const agent = data.agentName || (data.callerName ? data.callerName.split('(')[0].trim() : 'Nest Realty Broker');
  const price = data.price || 'Price Upon Request';
  const specs = data.bedsBaths || 'Specs Upon Request';
  const license = data.licenseNumber || 'NC-ROSTER-72';
  const office = data.office || 'Nest Realty Mayfaire · 990 Inspiration Drive, Wilmington NC';
  const phone = data.phone || '(910) 507-2047';
  
  const headline = `Distinctive Coastal Living at ${address.split(',')[0]}`;
  const keyFeatures = data.keyFeatures && data.keyFeatures.length > 0 ? data.keyFeatures : [
    'Open-Concept Coastal Floor Plan & Chef\'s Kitchen',
    'Custom Millwork, Hardwood Flooring & Designer Fixtures',
    'Expansive Outdoor Living with Water / Landscaping Proximity',
    'Prime Location Near Shopping, Dining & Wrightsville Beach'
  ];

  const description = `Welcome to ${address.split(',')[0]}. This premier residence offers ${specs} of meticulously crafted living space priced at ${price}. Designed for modern elegance and relaxed coastal entertaining, featuring expansive natural light and top-tier finishes throughout.`;

  const fullClipboardText = `🏡 PROPERTY: ${address}
💰 PRICE: ${price}
📐 SPECS: ${specs}
🌟 HEADLINE: ${headline}

📝 LISTING DESCRIPTION:
${description}

✨ KEY HIGHLIGHTS:
${keyFeatures.map(f => `• ${f}`).join('\n')}

👤 LISTING AGENT:
${agent} | REALTOR® | License #${license}
Direct: ${phone}
Office: ${office}

🌐 BRAND ASSETS (NEST REALTY):
Logo: White Vector & Emerald Badge
Primary Color: #00635C (Nest Forest Emerald)
Font Pairings: GT America / Canela / Inter`;

  return {
    headline,
    propertyAddress: address,
    price,
    specs,
    keyFeatures,
    description,
    agentName: agent,
    agentLicense: license,
    agentPhone: phone,
    office,
    fullClipboardText
  };
}

/**
 * Generates copy formatted specifically for individual Maxa design templates
 */
export function formatAssetSpecificCopyForMaxa(templateId: string, data: {
  propertyAddress: string;
  callerName?: string;
  agentName?: string;
  price?: string;
  bedsBaths?: string;
  sqft?: string;
  headline?: string;
  description?: string;
  disclosures?: string;
  keyFeatures?: string[];
  licenseNumber?: string;
  office?: string;
  phone?: string;
  agentPhone?: string;
  agentEmail?: string;
}): { title: string; copyText: string; maxaUrl: string } {
  const generic = formatListingCopyForMaxa(data);
  const shortAddress = generic.propertyAddress.split(',')[0];

  switch (templateId) {
    case 'maxa_flyer_double':
    case 'maxa_flyer_single':
      return {
        title: '8.5" x 11" Flyer Copy Brief',
        maxaUrl: 'https://nest.maxadesigns.com/categories/popular',
        copyText: `[8.5" x 11" FLYER HEADER]
${generic.headline}
${generic.propertyAddress} · Offered at ${generic.price}

[PROPERTY SPECS]
${generic.specs}

[KEY HIGHLIGHTS]
${generic.keyFeatures.map(f => `• ${f}`).join('\n')}

[PROPERTY OVERVIEW]
${generic.description}

[AGENT CARD]
${generic.agentName} | REALTOR® | License #${generic.agentLicense}
Direct: ${generic.agentPhone} | ${generic.office}`
      };

    case 'maxa_postcard_8_5x5_5':
      return {
        title: '8.5" x 5.5" Direct Mail Postcard Copy Brief',
        maxaUrl: 'https://nest.maxadesigns.com/categories/popular',
        copyText: `[FRONT HEADLINE]
JUST LISTED IN WILMINGTON
${shortAddress} · ${generic.price}

[BACK TEASER]
${generic.specs} of luxury coastal living.
${generic.keyFeatures.slice(0, 3).map(f => `✓ ${f}`).join('\n')}

Schedule your private showing today with ${generic.agentName} at ${generic.agentPhone}.
${generic.office}`
      };

    case 'maxa_social_story':
      return {
        title: '9:16 Story Reel Copy Brief',
        maxaUrl: 'https://nest.maxadesigns.com/categories/popular',
        copyText: `✨ NEW LISTING ✨
📍 ${shortAddress}
💰 ${generic.price}
📐 ${generic.specs}

👉 DM for private preview or link in bio!
Listed by ${generic.agentName} (@nestrealty)`
      };

    case 'maxa_social_post_headshot':
      return {
        title: '1:1 Feed Post Copy Brief',
        maxaUrl: 'https://nest.maxadesigns.com/categories/popular',
        copyText: `Proud to present ${shortAddress} in Wilmington! 🏡✨

Offered at ${generic.price}, this stunning home features ${generic.specs} with unmatched finishes.

${generic.keyFeatures.slice(0, 3).map(f => `▫️ ${f}`).join('\n')}

Ready to tour? Contact ${generic.agentName} at ${generic.agentPhone}.

#NestRealty #WilmingtonRealEstate #JustListed #CoastalLiving #LuxuryRealEstate #WrightsvilleBeach`
      };

    case 'maxa_brochure_4page':
      return {
        title: '4-Page Brochure Copy Brief',
        maxaUrl: 'https://nest.maxadesigns.com/categories/popular',
        copyText: `[PAGE 1: COVER]
${generic.headline}
${generic.propertyAddress} · ${generic.price}

[PAGE 2: INTERIOR RETREAT]
${generic.description}
${generic.keyFeatures.map(f => `• ${f}`).join('\n')}

[PAGE 3: OUTDOOR LIVING & LOCATION]
Prime coastal positioning with convenient access to premier shopping, fine dining, and coastal waterways.

[PAGE 4: SPECIFICATIONS & AGENT INFO]
${generic.specs}
Offered at ${generic.price}
Listed Exclusively by:
${generic.agentName} | REALTOR® | License #${generic.agentLicense}
${generic.office} | ${generic.agentPhone}`
      };

    default:
      return {
        title: 'General Collateral Copy Brief',
        maxaUrl: 'https://nest.maxadesigns.com/categories/popular',
        copyText: generic.fullClipboardText
      };
  }
}

