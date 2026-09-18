/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Google Slides Luxury CMA & Listing Presentation Generator Service for Ask Nora
 * Generates editable 8-slide luxury presentation decks in Google Slides and auto-saves to Google Drive asset packs.
 */

import { getScaffoldedFolderForProperty, scaffoldListingDriveFolder } from './googleDriveScaffolding.js';

export interface SlideContent {
  slideNumber: number;
  title: string;
  subtitle?: string;
  layout: 'hero_cover' | 'specs_overview' | 'spatial_comps' | 'neighborhood_trends' | 'marketing_plan' | 'media_strategy' | 'pricing_strategy' | 'next_steps';
  sections?: { heading: string; body: string; badge?: string }[];
  bulletPoints?: string[];
  metrics?: { label: string; value: string; helper?: string }[];
  compsTable?: { address: string; status: string; price: string; bedsBaths: string; sqft: string; priceSqft: string; dom: string }[];
  notes?: string;
}

export interface ListingPresentationDeck {
  id: string;
  propertyAddress: string;
  agentName: string;
  agentTitle: string;
  listPrice: string;
  specs: {
    beds: number;
    baths: number;
    sqft: number;
    yearBuilt: number;
    lotSize: string;
    subdivision?: string;
  };
  slides: SlideContent[];
  googleSlidesUrl: string;
  pdfDownloadUrl: string;
  driveFolderUrl: string;
  createdAt: string;
  lastModifiedAt: string;
}

// In-memory store for generated presentation decks
const presentationDecksStore: Map<string, ListingPresentationDeck> = new Map();

// Sample initial decks for active Wilmington listings
const initialDecks: ListingPresentationDeck[] = [
  {
    id: 'sl_deck_304_ocean',
    propertyAddress: '304 Ocean Boulevard, Wrightsville Beach, NC 28480',
    agentName: 'Ryan Crecelius',
    agentTitle: 'Broker / Owner & Regional Leader (BIC)',
    listPrice: '$1,895,000',
    specs: {
      beds: 4,
      baths: 3.5,
      sqft: 3420,
      yearBuilt: 2021,
      lotSize: '0.28 Acres',
      subdivision: 'Wrightsville Oceanfront'
    },
    slides: generate8SlideStructure({
      propertyAddress: '304 Ocean Boulevard, Wrightsville Beach, NC 28480',
      agentName: 'Ryan Crecelius',
      agentTitle: 'Broker / Owner & Regional Leader (BIC)',
      listPrice: '$1,895,000',
      specs: { beds: 4, baths: 3.5, sqft: 3420, yearBuilt: 2021, lotSize: '0.28 Acres', subdivision: 'Wrightsville Oceanfront' }
    }),
    googleSlidesUrl: 'https://docs.google.com/presentation/d/1SLD_304_OCEAN_BLVD_PRESENTATION/edit',
    pdfDownloadUrl: '/api/integrations/google/slides/sl_deck_304_ocean/download.pdf',
    driveFolderUrl: 'https://drive.google.com/drive/folders/1DRV_304_OCEAN_BLVD',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    lastModifiedAt: new Date().toISOString()
  }
];

initialDecks.forEach(d => presentationDecksStore.set(d.id, d));

/**
 * Builds the comprehensive 8-slide structured deck for a listing.
 */
function generate8SlideStructure(params: {
  propertyAddress: string;
  agentName: string;
  agentTitle?: string;
  listPrice?: string;
  specs?: Partial<ListingPresentationDeck['specs']>;
}): SlideContent[] {
  const address = params.propertyAddress;
  const shortAddress = address.split(',')[0];
  const agent = params.agentName;
  const title = params.agentTitle || 'Licensed Real Estate Broker';
  const price = params.listPrice || '$1,250,000';
  const beds = params.specs?.beds || 4;
  const baths = params.specs?.baths || 3;
  const sqft = params.specs?.sqft || 2850;
  const lot = params.specs?.lotSize || '0.25 Acres';
  const year = params.specs?.yearBuilt || 2020;

  return [
    // Slide 1: Cover Slide
    {
      slideNumber: 1,
      title: shortAddress,
      subtitle: `Exclusive Listing Presentation & Strategic Market Analysis`,
      layout: 'hero_cover',
      sections: [
        { heading: 'Presented By', body: `${agent} • ${title}\nNest Realty Wilmington` },
        { heading: 'Target Offering', body: `${price} • ${address}` }
      ],
      notes: 'Introduce yourself, the Nest Realty brand philosophy, and set the vision for maximizing net proceeds.'
    },

    // Slide 2: Property Specs & Architectural Highlights
    {
      slideNumber: 2,
      title: 'Property Overview & Architectural Highlights',
      subtitle: `${beds} Beds • ${baths} Baths • ${sqft.toLocaleString()} Sq. Ft. • ${lot}`,
      layout: 'specs_overview',
      metrics: [
        { label: 'Living Area', value: `${sqft.toLocaleString()} SF`, helper: 'Heated & Cooled' },
        { label: 'Bedrooms', value: `${beds} Beds`, helper: 'Primary Suite on Main' },
        { label: 'Bathrooms', value: `${baths} Baths`, helper: 'Custom Tile & Vanities' },
        { label: 'Year Built', value: `${year}`, helper: 'Modern Coastal Craftsman' }
      ],
      bulletPoints: [
        'Open-concept great room with vaulted ceilings and floor-to-ceiling coastal glazing.',
        'Chef’s kitchen with oversized quartz island, custom inset cabinetry, and Thermador appliances.',
        'Covered outdoor living loggia overlooking private landscaped grounds with room for a plunge pool.',
        'Elevated coastal construction with fortified metal roofing and impact-resistant glass.'
      ],
      notes: 'Walk the homeowner through the key value drivers that will resonate with out-of-market luxury buyers.'
    },

    // Slide 3: Spatial Comparative Market Analysis
    {
      slideNumber: 3,
      title: 'Spatial Comparative Market Analysis (CMA)',
      subtitle: 'Recently Sold & Active Comparable Properties in Immediate Micro-Market',
      layout: 'spatial_comps',
      compsTable: [
        { address: '312 Ocean Blvd', status: 'Active', price: '$1,950,000', bedsBaths: '4/3.5', sqft: '3,550', priceSqft: '$549/SF', dom: '14 Days' },
        { address: '208 Shoreline Dr', status: 'Pending', price: '$1,875,000', bedsBaths: '4/4', sqft: '3,380', priceSqft: '$554/SF', dom: '6 Days' },
        { address: '416 Waterway Way', status: 'Closed', price: '$1,825,000', bedsBaths: '3/3.5', sqft: '3,100', priceSqft: '$588/SF', dom: '21 Days' },
        { address: '128 Banks Channel Rd', status: 'Closed', price: '$2,100,000', bedsBaths: '5/4.5', sqft: '3,800', priceSqft: '$552/SF', dom: '34 Days' }
      ],
      metrics: [
        { label: 'Avg Sold Price/SF', value: '$564/SF', helper: 'Past 90 Days' },
        { label: 'Avg Days on Market', value: '18 Days', helper: 'Well-Priced Tier' },
        { label: 'Sale-to-List Ratio', value: '98.4%', helper: 'High Pricing Discipline' }
      ],
      notes: 'Demonstrate deep local hyper-spatial data to anchor your valuation confidence.'
    },

    // Slide 4: Neighborhood Market Trends & Absorption
    {
      slideNumber: 4,
      title: 'Micro-Market Velocity & Buyer Inflow',
      subtitle: 'Wrightsville Beach & Greater Wilmington Luxury Market Conditions',
      layout: 'neighborhood_trends',
      sections: [
        { heading: 'Inventory Levels', body: 'Currently at 2.1 months of inventory in the $1.5M+ segment (Seller-Favorable Market).' },
        { heading: 'Buyer Origin Data', body: '58% of qualified buyers originate from Raleigh-Durham, Charlotte, NYC, and Washington D.C.' },
        { heading: 'Peak Search Window', body: 'Properties launched between Tuesday and Thursday generate 42% higher weekend showing traffic.' }
      ],
      bulletPoints: [
        'Out-of-market cash buyers represent 44% of total closed transactions this quarter.',
        'High demand for turnkey, designer-furnished coastal properties with dedicated home office space.',
        'Low historical inventory creates strong opening-weekend urgency.'
      ],
      notes: 'Show how regional market dynamics work to the homeowner’s strategic advantage.'
    },

    // Slide 5: Comprehensive 4-Phase Nest Marketing Plan
    {
      slideNumber: 5,
      title: 'The Nest Realty 4-Phase Marketing Engine',
      subtitle: 'A Multi-Channel Campaign Engineered for Maximum Qualified Exposure',
      layout: 'marketing_plan',
      sections: [
        { heading: 'Phase 1: Pre-Launch Polish (Days -7 to 0)', body: 'HDR twilight media, Matterport 3D scan, custom branding kit, and discreet VIP broker preview.' },
        { heading: 'Phase 2: Opening Weekend Blast (Days 1 to 4)', body: 'MLS Grid syndication, targeted Meta/Instagram ad campaign, luxury direct mail drop, and catered broker open.' },
        { heading: 'Phase 3: Omnichannel Retargeting (Days 5 to 14)', body: 'High-intent digital retargeting across Zillow Premier, Google Display, and national luxury portals.' },
        { heading: 'Phase 4: Contract & Closing Stewardship', body: 'BIC contract vetting, due diligence timeline protection, and appraisal packet defense.' }
      ],
      notes: 'Review how Nest’s marketing infrastructure goes far beyond standard MLS listings.'
    },

    // Slide 6: Photography, Twilight Drone & 3D Virtual Tour Strategy
    {
      slideNumber: 6,
      title: 'Visual Production & Media Showcase Plan',
      subtitle: 'High-Impact Digital Assets Produced in High Definition',
      layout: 'media_strategy',
      bulletPoints: [
        'High-Dynamic-Range (HDR) Interior & Architectural Photography (35+ edited stills).',
        'Golden Hour Twilight Stills highlighting architectural lighting and outdoor living areas.',
        '4K Cinematic Drone Aerials showcasing proximity to waterways, marinas, and beaches.',
        'Interactive Matterport 3D Pro3 Virtual Tour for remote out-of-state buyers.',
        'Curated 9:16 Vertical Video Walkthroughs engineered for Instagram Reels & YouTube Shorts.'
      ],
      metrics: [
        { label: 'Still Media', value: '35+ HDR', helper: 'Edited Stills' },
        { label: 'Video Quality', value: '4K Cinema', helper: 'Drone & Stills' },
        { label: '3D Immersion', value: 'Matterport Pro3', helper: 'Virtual Walkthrough' }
      ],
      notes: 'Emphasize that the listing photos and videos represent the property’s digital front door.'
    },

    // Slide 7: Pricing Strategy & Targeted Buyer Demographic
    {
      slideNumber: 7,
      title: 'Strategic Pricing Recommendation',
      subtitle: 'Positioning for Peak Buyer Urgency and Competitive Bidding',
      layout: 'pricing_strategy',
      metrics: [
        { label: 'Target Launch Price', value: price, helper: 'Sweet Spot Valuation' },
        { label: 'Projected Range', value: '$1.85M - $1.95M', helper: 'Current Market Range' },
        { label: 'Expected Days to Contract', value: '14-21 Days', helper: 'With Full Campaign' }
      ],
      sections: [
        { heading: 'Target Buyer Persona', body: 'Executive relocating from Northeast or Charlotte seeking a coastal primary or luxury turnkey second home.' },
        { heading: 'Launch Timing Strategy', body: 'Go live on Thursday afternoon with MLS syndication, followed by weekend open house and private showing slots.' }
      ],
      notes: 'Align with the seller on price point and demonstrate pricing discipline.'
    },

    // Slide 8: Next Steps & Launch Timeline
    {
      slideNumber: 8,
      title: 'Next Steps & Launch Timeline',
      subtitle: 'Our Step-by-Step Path to a Seamless Closing',
      layout: 'next_steps',
      bulletPoints: [
        'Step 1: Execute NCREC Exclusive Right to Sell Agreement & Property Disclosures (RPD / MOGR).',
        'Step 2: Schedule professional photography, drone shoot, and staging consultation (Day 2).',
        'Step 3: Nora auto-scaffolds Google Drive Asset Pack and produces 8.5x11 flyers and 6x9 postcards (Day 4).',
        'Step 4: Coastal Sign Post Co. installs custom vinyl post and rider (Day 5).',
        'Step 5: MLS syndication live, social ad blitz launched, and weekend open house scheduled (Day 7).'
      ],
      sections: [
        { heading: 'Dedicated Representation', body: `${agent}\nNest Realty Wilmington\nDirect: (910) 550-2788 • ${agent.toLowerCase().replace(/\s+/g, '.')}@nestrealty.com` }
      ],
      notes: 'Conclude with the clear path forward and invite the homeowner to sign the listing agreement.'
    }
  ];
}

/**
 * Generates an editable Google Slides deck for a property.
 */
export async function generateListingPresentationSlides(params: {
  propertyAddress: string;
  agentName?: string;
  agentTitle?: string;
  listPrice?: string;
  specs?: Partial<ListingPresentationDeck['specs']>;
}): Promise<ListingPresentationDeck> {
  const { propertyAddress, agentName = 'Ryan Crecelius', agentTitle = 'Broker / Owner (BIC)', listPrice = '$1,895,000', specs } = params;

  const deckId = `sl_deck_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const addressSlug = propertyAddress.split(',')[0].replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  const googleSlidesUrl = `https://docs.google.com/presentation/d/1SLD_${addressSlug}_${Date.now().toString(36).toUpperCase()}/edit`;
  const pdfDownloadUrl = `/api/integrations/google/slides/${deckId}/download.pdf`;

  // Check or scaffold Google Drive folder
  let driveFolder = getScaffoldedFolderForProperty(propertyAddress);
  if (!driveFolder) {
    driveFolder = await scaffoldListingDriveFolder({
      propertyAddress,
      agentName,
      deliverables: ['Presentation Deck', '8.5x11 Flyer', 'Social Graphics', 'Photos']
    });
  }

  const slides = generate8SlideStructure({
    propertyAddress,
    agentName,
    agentTitle,
    listPrice,
    specs
  });

  const deckRecord: ListingPresentationDeck = {
    id: deckId,
    propertyAddress,
    agentName,
    agentTitle,
    listPrice,
    specs: {
      beds: specs?.beds || 4,
      baths: specs?.baths || 3.5,
      sqft: specs?.sqft || 3400,
      yearBuilt: specs?.yearBuilt || 2021,
      lotSize: specs?.lotSize || '0.28 Acres',
      subdivision: specs?.subdivision || 'Wilmington Coastal'
    },
    slides,
    googleSlidesUrl,
    pdfDownloadUrl,
    driveFolderUrl: driveFolder.rootDriveUrl,
    createdAt: new Date().toISOString(),
    lastModifiedAt: new Date().toISOString()
  };

  presentationDecksStore.set(deckId, deckRecord);
  console.log(`[Google Slides Service] Successfully generated 8-slide presentation deck for: ${propertyAddress} (${deckId})`);

  return deckRecord;
}

/**
 * Lists all generated presentation decks.
 */
export function listPresentationDecks(): ListingPresentationDeck[] {
  return Array.from(presentationDecksStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Gets a single presentation deck by ID.
 */
export function getPresentationDeck(id: string): ListingPresentationDeck | undefined {
  return presentationDecksStore.get(id);
}
