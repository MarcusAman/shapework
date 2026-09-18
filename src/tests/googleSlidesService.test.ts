import { describe, it, expect } from 'vitest';
import { GoogleSlidesService } from '../../server/services/googleSlidesService.js';
import { executeGoogleSlidesTool } from '../../server/ai/tools/googleSlidesMcpTools.js';

describe('Google Slides API (v1) Service Suite', () => {
  it('1. Retrieves pre-seeded luxury presentation decks', () => {
    const decks = GoogleSlidesService.getPresentationDecks();
    expect(decks.length).toBeGreaterThanOrEqual(1);
    const defaultDeck = decks.find(d => d.id === 'deck_304_ocean_blvd');
    expect(defaultDeck).toBeDefined();
    expect(defaultDeck?.slides.length).toBe(8);
  });

  it('2. Generates an 8-Slide Luxury Listing Presentation with specifications & net sheet', async () => {
    const deck = await GoogleSlidesService.generateListingDeck({
      propertyAddress: '104 Live Oak Dr, Wrightsville Beach NC',
      listPrice: '$1,850,000',
      specs: {
        beds: 4,
        baths: 4.5,
        sqft: 3650,
        lotSize: '0.35 Acres',
        yearBuilt: 2023,
        neighborhood: 'Wrightsville Sound'
      },
      agentName: 'Melissa Gagliardi',
      agentTitle: 'Luxury Specialist & Partner',
      agentEmail: 'melissa.g@nestrealty.com'
    });

    expect(deck.id).toBeDefined();
    expect(deck.propertyAddress).toBe('104 Live Oak Dr, Wrightsville Beach NC');
    expect(deck.listPrice).toBe('$1,850,000');
    expect(deck.slides.length).toBe(8);

    // Verify slide categories
    expect(deck.slides[0].category).toBe('Cover & Executive Summary');
    expect(deck.slides[1].category).toBe('Property Details');
    expect(deck.slides[3].category).toBe('Valuation & Pricing');
    expect(deck.slides[6].category).toBe('Financial Summary');
    expect(deck.slides[6].elements.some(e => e.type === 'total')).toBe(true);

    const fetched = GoogleSlidesService.getDeckById(deck.id);
    expect(fetched).toBeDefined();
  });

  it('3. Executes Google Slides tools via Nora AI tool caller', async () => {
    const aiDeck = await executeGoogleSlidesTool('generate_luxury_listing_slides', {
      propertyAddress: '518 Chestnut St, Wilmington NC',
      listPrice: '$650,000',
      beds: 3,
      baths: 2,
      sqft: 2200,
      agentName: 'Ann Gunn'
    });

    expect(aiDeck.id).toBeDefined();
    expect(aiDeck.propertyAddress).toBe('518 Chestnut St, Wilmington NC');
    expect(aiDeck.slides.length).toBe(8);

    const lookupRes = await executeGoogleSlidesTool('get_listing_presentation_deck', {
      propertyAddress: '518 Chestnut St'
    });
    expect(lookupRes.id).toBe(aiDeck.id);
  });
});
