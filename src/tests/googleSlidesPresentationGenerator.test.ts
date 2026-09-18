/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  generateListingPresentationSlides,
  listPresentationDecks,
  getPresentationDeck
} from '../../server/integrations/google/googleSlidesService';

describe('Google Slides Luxury CMA & Listing Presentation Generator Suite', () => {
  it('1. Generates complete 8-slide structured luxury presentation deck with tailored data', async () => {
    const deck = await generateListingPresentationSlides({
      propertyAddress: '820 Soundview Drive, Wrightsville Beach, NC 28480',
      agentName: 'Ryan Crecelius',
      agentTitle: 'Broker / Owner & Regional Leader (BIC)',
      listPrice: '$2,450,000',
      specs: {
        beds: 5,
        baths: 4.5,
        sqft: 4150,
        yearBuilt: 2022,
        lotSize: '0.35 Acres',
        subdivision: 'Soundview Waterfront'
      }
    });

    expect(deck.id).toBeDefined();
    expect(deck.propertyAddress).toBe('820 Soundview Drive, Wrightsville Beach, NC 28480');
    expect(deck.listPrice).toBe('$2,450,000');
    expect(deck.googleSlidesUrl).toContain('https://docs.google.com/presentation/d/');
    expect(deck.driveFolderUrl).toContain('https://drive.google.com/drive/folders/');
    expect(deck.slides.length).toBe(8);

    // Verify slide layout and content
    const slide1 = deck.slides[0];
    expect(slide1.slideNumber).toBe(1);
    expect(slide1.layout).toBe('hero_cover');
    expect(slide1.title).toBe('820 Soundview Drive');

    const slide2 = deck.slides[1];
    expect(slide2.slideNumber).toBe(2);
    expect(slide2.layout).toBe('specs_overview');
    expect(slide2.metrics?.some(m => m.value.includes('4,150'))).toBe(true);

    const slide3 = deck.slides[2];
    expect(slide3.slideNumber).toBe(3);
    expect(slide3.layout).toBe('spatial_comps');
    expect(slide3.compsTable?.length).toBeGreaterThanOrEqual(4);

    const slide4 = deck.slides[3];
    expect(slide4.slideNumber).toBe(4);
    expect(slide4.layout).toBe('neighborhood_trends');

    const slide5 = deck.slides[4];
    expect(slide5.slideNumber).toBe(5);
    expect(slide5.layout).toBe('marketing_plan');

    const slide6 = deck.slides[5];
    expect(slide6.slideNumber).toBe(6);
    expect(slide6.layout).toBe('media_strategy');

    const slide7 = deck.slides[6];
    expect(slide7.slideNumber).toBe(7);
    expect(slide7.layout).toBe('pricing_strategy');
    expect(slide7.metrics?.some(m => m.value === '$2,450,000')).toBe(true);

    const slide8 = deck.slides[7];
    expect(slide8.slideNumber).toBe(8);
    expect(slide8.layout).toBe('next_steps');
  });

  it('2. Retrieves generated decks by ID and in list of all presentation decks', () => {
    const decks = listPresentationDecks();
    expect(decks.length).toBeGreaterThanOrEqual(1);

    const firstDeck = decks[0];
    const retrieved = getPresentationDeck(firstDeck.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(firstDeck.id);
    expect(retrieved?.propertyAddress).toBe(firstDeck.propertyAddress);
  });
});
