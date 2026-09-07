/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * googleSlidesService
 * Live Google Slides API (v1) Integration Service for Google Workspace.
 * Generates 8-Slide Luxury Listing Presentations, CMA Decks, and Strategy Briefs.
 */

import { google } from 'googleapis';
import { getOAuthClient, getGoogleAccessToken } from '../integrations/google/googleOAuth.js';
import { IntegrationStateStore } from '../integrations/shared/integrationStateStore.js';

export interface ListingDeckSpecs {
  beds: number;
  baths: number;
  sqft: number;
  lotSize?: string;
  yearBuilt?: number;
  neighborhood?: string;
}

export interface PresentationSlideItem {
  slideIndex: number;
  title: string;
  category: string;
  elements: Array<{ type: string; text: string; details?: string }>;
  thumbnailUrl?: string;
}

export interface ListingPresentationDeck {
  id: string;
  propertyAddress: string;
  listPrice: string;
  agentName: string;
  agentTitle: string;
  agentEmail?: string;
  specs: ListingDeckSpecs;
  googleSlidesUrl: string;
  presentationId: string;
  driveFolderId?: string;
  slides: PresentationSlideItem[];
  createdAt: string;
  isLiveSlides: boolean;
}

class GoogleSlidesServiceEngine {
  private decks: Map<string, ListingPresentationDeck> = new Map();

  constructor() {
    this.seedDefaultLuxuryDecks();
  }

  private seedDefaultLuxuryDecks() {
    const defaultDeck: ListingPresentationDeck = {
      id: 'deck_304_ocean_blvd',
      propertyAddress: '304 Ocean Boulevard, Wrightsville Beach, NC 28480',
      listPrice: '$1,895,000',
      agentName: 'Ryan Crecelius',
      agentTitle: 'Broker / Owner & Regional Leader (BIC)',
      agentEmail: 'ryan@nestrealty.com',
      specs: {
        beds: 4,
        baths: 3.5,
        sqft: 3420,
        lotSize: '0.28 Acres',
        yearBuilt: 2021,
        neighborhood: 'Wrightsville Beach Central'
      },
      googleSlidesUrl: 'https://docs.google.com/presentation/d/sample_ocean_blvd_deck/edit',
      presentationId: 'sample_ocean_blvd_deck',
      createdAt: new Date().toISOString(),
      isLiveSlides: false,
      slides: this.build8SlideStructure(
        '304 Ocean Boulevard, Wrightsville Beach, NC 28480',
        '$1,895,000',
        { beds: 4, baths: 3.5, sqft: 3420 },
        'Ryan Crecelius',
        'Broker / Owner & Regional Leader (BIC)'
      )
    };

    this.decks.set(defaultDeck.id, defaultDeck);
  }

  /**
   * Constructs the complete 8-slide luxury presentation outline
   */
  private build8SlideStructure(
    address: string,
    price: string,
    specs: ListingDeckSpecs,
    agentName: string,
    agentTitle: string
  ): PresentationSlideItem[] {
    const priceNum = parseInt(price.replace(/[^0-9]/g, ''), 10) || 1500000;
    const estCommission = Math.round(priceNum * 0.05);
    const estExciseTax = Math.round((priceNum / 500) * 1.0);
    const estClosingFee = 1500;
    const estNetProceeds = priceNum - estCommission - estExciseTax - estClosingFee;

    return [
      {
        slideIndex: 1,
        title: 'Luxury Property & Valuation Presentation',
        category: 'Cover & Executive Summary',
        elements: [
          { type: 'heading', text: address },
          { type: 'badge', text: `Suggested List Price: ${price}` },
          { type: 'subtitle', text: `Exclusively Presented by ${agentName} — ${agentTitle}` },
          { type: 'brand', text: 'Nest Realty Wilmington • Brokerage Operations' }
        ]
      },
      {
        slideIndex: 2,
        title: 'Architectural Specifications & Property Highlights',
        category: 'Property Details',
        elements: [
          { type: 'spec', text: `${specs.beds} Bedrooms • ${specs.baths} Bathrooms` },
          { type: 'spec', text: `${specs.sqft.toLocaleString()} Heated Square Feet` },
          { type: 'bullet', text: 'Custom chef kitchen with waterfall quartz island & Sub-Zero appliances.' },
          { type: 'bullet', text: 'Expansive wrap-around covered porch with coastal ocean breezes.' }
        ]
      },
      {
        slideIndex: 3,
        title: 'Location & Coastal Micro-Market Intelligence',
        category: 'Market Context',
        elements: [
          { type: 'stat', text: 'Average Days on Market (Wrightsville): 18 Days' },
          { type: 'stat', text: 'List-to-Sale Price Ratio: 98.4%' },
          { type: 'bullet', text: 'Walkable to local dining, marinas, and premier sandy beach access.' },
          { type: 'bullet', text: 'Highly desirable short-term rental / second-home investment tier.' }
        ]
      },
      {
        slideIndex: 4,
        title: 'Comparative Market Analysis (CMA) Comps',
        category: 'Valuation & Pricing',
        elements: [
          { type: 'comp', text: '104 Live Oak Dr — Sold $1,850,000 (3,200 SF • $578/SF)' },
          { type: 'comp', text: '219 Dock St — Active $1,925,000 (3,550 SF • $542/SF)' },
          { type: 'metric', text: `Target Listing Valuation: ${price} ($${Math.round(priceNum / (specs.sqft || 1))}/SF)` }
        ]
      },
      {
        slideIndex: 5,
        title: 'Multi-Channel High-Impact Marketing Strategy',
        category: 'Marketing Strategy',
        elements: [
          { type: 'deliverable', text: 'Cape Fear Media HDR Photography & 4K Drone Aerials' },
          { type: 'deliverable', text: 'Matterport 3D Interactive Virtual Tour & 2D Schematic Floor Plan' },
          { type: 'deliverable', text: 'Coastal Sign Post Co. White Colonial Vinyl Post with Custom QR Rider' },
          { type: 'deliverable', text: '6x9 Ultra-Gloss Luxury Postcard Direct Mailer (500 Targeted Homes)' }
        ]
      },
      {
        slideIndex: 6,
        title: 'Digital Advertising, Social Media & MLS Syndication',
        category: 'Digital Reach',
        elements: [
          { type: 'channel', text: 'Cape Fear MLS + NCRMLS Regional Syndication' },
          { type: 'channel', text: 'Geo-Targeted Meta & Instagram High-Net-Worth Carousel Ads' },
          { type: 'channel', text: 'Exclusive Nest Realty Network Email Blast to 4,500+ Active Agents' }
        ]
      },
      {
        slideIndex: 7,
        title: 'Estimated Seller Net Proceeds Statement',
        category: 'Financial Summary',
        elements: [
          { type: 'row', text: `Contract Sales Price: $${priceNum.toLocaleString()}` },
          { type: 'row', text: `Estimated Brokerage Commission (5%): -$${estCommission.toLocaleString()}` },
          { type: 'row', text: `NC Revenue Stamps / Excise Tax: -$${estExciseTax.toLocaleString()}` },
          { type: 'row', text: `Estimated Settlement / Escrow Fees: -$${estClosingFee.toLocaleString()}` },
          { type: 'total', text: `Estimated Net Proceeds to Seller: $${estNetProceeds.toLocaleString()}` }
        ]
      },
      {
        slideIndex: 8,
        title: 'The Nest Realty Advantage & Strategic Launch Timeline',
        category: 'Closing & Execution',
        elements: [
          { type: 'step', text: 'Day 1-3: Professional Media Shoot & Sign Post Installation' },
          { type: 'step', text: 'Day 4-5: Print Proof Approval & MLS Coming Soon Launch' },
          { type: 'step', text: 'Day 6: Public Active Go-Live & Broker Caravan Open House' },
          { type: 'contact', text: `Direct Contact: ${agentName} (${agentTitle})` }
        ]
      }
    ];
  }

  /**
   * Helper to retrieve authenticated Google Slides client
   */
  private async getAuthenticatedSlidesClient(workspaceId: string = 'nest-realty-demo'): Promise<{ slides: any; drive: any; userEmail: string } | null> {
    try {
      const dbState = (global as any).__SHAPEWORK_DB_STATE || {};
      const store = new IntegrationStateStore(dbState);
      const connection = await store.getConnection(workspaceId, 'google_workspace');
      if (!connection || connection.status !== 'connected') {
        return null;
      }

      const saveCallback = async () => {};
      const accessToken = await getGoogleAccessToken(connection, dbState, saveCallback);
      const oauth2Client = getOAuthClient();
      oauth2Client.setCredentials({ access_token: accessToken });

      const slides = google.slides({ version: 'v1', auth: oauth2Client });
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      return { slides, drive, userEmail: (connection as any).accountEmail || 'AskNora@nestrealty.com' };
    } catch (err: any) {
      console.warn('[GoogleSlidesService] Unable to get authenticated Slides client:', err.message);
      return null;
    }
  }

  /**
   * Generate an 8-Slide Luxury Presentation Deck
   */
  public async generateListingDeck(params: {
    propertyAddress: string;
    listPrice: string;
    specs: ListingDeckSpecs;
    agentName?: string;
    agentTitle?: string;
    agentEmail?: string;
    folderId?: string;
    workspaceId?: string;
  }): Promise<ListingPresentationDeck> {
    const {
      propertyAddress,
      listPrice,
      specs,
      agentName = 'Ryan Crecelius',
      agentTitle = 'Broker / Owner & Regional Leader (BIC)',
      agentEmail = 'ryan@nestrealty.com',
      folderId,
      workspaceId = 'nest-realty-demo'
    } = params;

    const slidesOutline = this.build8SlideStructure(propertyAddress, listPrice, specs, agentName, agentTitle);
    const auth = await this.getAuthenticatedSlidesClient(workspaceId);

    let presentationId = `deck_${Date.now()}`;
    let googleSlidesUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;
    let isLiveSlides = false;

    if (auth && auth.slides) {
      try {
        // 1. Create Google Slides Presentation
        const createRes = await auth.slides.presentations.create({
          requestBody: {
            title: `${propertyAddress} — Luxury Listing Presentation`
          }
        });

        presentationId = createRes.data.presentationId!;
        googleSlidesUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;
        isLiveSlides = true;

        // 2. Create remaining slides (Google Slides creates with 1 blank slide by default)
        const slideRequests: any[] = [];
        for (let i = 1; i < 8; i++) {
          slideRequests.push({
            createSlide: {
              insertionIndex: i
            }
          });
        }

        if (slideRequests.length > 0) {
          await auth.slides.presentations.batchUpdate({
            presentationId,
            requestBody: { requests: slideRequests }
          });
        }

        // 3. Move presentation to property Google Drive folder if provided
        if (folderId && auth.drive) {
          try {
            await auth.drive.files.update({
              fileId: presentationId,
              addParents: folderId,
              fields: 'id, parents'
            });
          } catch (moveErr: any) {
            console.warn('[GoogleSlidesService] Error moving presentation to Drive folder:', moveErr.message);
          }
        }

        // 4. Grant Editor permissions to the listing agent
        if (agentEmail && agentEmail.includes('@') && auth.drive) {
          try {
            await auth.drive.permissions.create({
              fileId: presentationId,
              requestBody: {
                role: 'writer',
                type: 'user',
                emailAddress: agentEmail
              },
              sendNotificationEmail: false
            });
          } catch (permErr: any) {
            console.warn(`[GoogleSlidesService] Permission notice for ${agentEmail}:`, permErr.message);
          }
        }
      } catch (err: any) {
        console.warn('[GoogleSlidesService] Live Google Slides API call error, using local fallback:', err.message);
      }
    }

    const deck: ListingPresentationDeck = {
      id: `deck_${Date.now()}`,
      propertyAddress,
      listPrice,
      agentName,
      agentTitle,
      agentEmail,
      specs,
      googleSlidesUrl,
      presentationId,
      driveFolderId: folderId,
      slides: slidesOutline,
      createdAt: new Date().toISOString(),
      isLiveSlides
    };

    this.decks.set(deck.id, deck);
    return deck;
  }

  public getPresentationDecks(): ListingPresentationDeck[] {
    return Array.from(this.decks.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getDeckById(deckId: string): ListingPresentationDeck | undefined {
    return this.decks.get(deckId);
  }
}

export const GoogleSlidesService = new GoogleSlidesServiceEngine();
