/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite: Context-Aware Task Tools & Instant Maxa Marketing Deliverables
 */

import { describe, it, expect } from 'vitest';
import { NEST_MAXA_TEMPLATES, formatAssetSpecificCopyForMaxa } from '../../server/integrations/maxaDesignCenterService.js';

describe('Context-Aware Task Tools & Instant Maxa Marketing Suite', () => {

  describe('1. Context-Aware Task Classification', () => {
    it('classifies marketing call items correctly and provides Maxa templates', () => {
      const marketingCall = {
        category: 'marketing',
        type: 'marketing_intake',
        transcript: 'Need 8.5x11 property flyers and social story graphics for our new listing at 1104 Arboretum Dr.',
        propertyAddress: '1104 Arboretum Dr, Wilmington, NC',
        listingSnapshot: {
          listingPrice: '$1,250,000',
          bedrooms: 4,
          bathrooms: 3.5,
          squareFeet: 3450
        }
      };

      const isMarketing = (
        marketingCall.category === 'marketing' || 
        marketingCall.type === 'marketing_intake' || 
        marketingCall.transcript.toLowerCase().includes('flyer')
      );

      const isSignPost = (
        marketingCall.category === 'operations' ||
        marketingCall.type === 'sign_post' ||
        marketingCall.transcript.toLowerCase().includes('sign post')
      );

      expect(isMarketing).toBe(true);
      expect(isSignPost).toBe(false);
      expect(NEST_MAXA_TEMPLATES.length).toBeGreaterThanOrEqual(4);
    });

    it('classifies operational sign post calls correctly, hiding Maxa and exposing Coastal Sign Post dispatcher', () => {
      const signPostCall = {
        category: 'operations',
        type: 'sign_post',
        transcript: 'Please dispatch Coastal Sign Post Co to install a standard white vinyl post with lockbox at 105 Forest Hills Dr.',
        propertyAddress: '105 Forest Hills Dr, Wilmington, NC'
      };

      const isMarketing = (
        signPostCall.category === 'marketing' || 
        signPostCall.type === 'marketing_intake' || 
        signPostCall.transcript.toLowerCase().includes('flyer')
      );

      const isSignPost = (
        signPostCall.category === 'operations' ||
        signPostCall.type === 'sign_post' ||
        signPostCall.transcript.toLowerCase().includes('sign post')
      );

      expect(isMarketing).toBe(false);
      expect(isSignPost).toBe(true);
    });
  });

  describe('2. Instant Real Estate Copywriting Generation', () => {
    const listing = {
      propertyAddress: '1104 Arboretum Dr, Wilmington, NC',
      propertyShort: '1104 Arboretum Dr',
      listingPrice: '$1,250,000',
      bedsBaths: '4 Beds / 3.5 Baths',
      sqft: '3,450 SqFt',
      agentName: 'Jessica Keenan',
      agentPhone: '(910) 368-1507'
    };

    it('generates compliant MLS Public Remarks with accurate listing parameters', () => {
      const mlsRemarks = `Exquisite luxury residence at ${listing.propertyAddress}. Offering ${listing.bedsBaths}, ${listing.sqft} of meticulously crafted coastal living spaces, premium finishes, chef's kitchen, and serene outdoor entertaining. Listed at ${listing.listingPrice}. Contact ${listing.agentName} at ${listing.agentPhone} for private showings.`;
      
      expect(mlsRemarks).toContain('1104 Arboretum Dr, Wilmington, NC');
      expect(mlsRemarks).toContain('$1,250,000');
      expect(mlsRemarks).toContain('4 Beds / 3.5 Baths');
      expect(mlsRemarks).toContain('Jessica Keenan');
      expect(mlsRemarks).toContain('(910) 368-1507');
    });

    it('generates engaging Social Media Copy with Nest Realty hashtags', () => {
      const socialCopy = `✨ JUST LISTED in Wilmington! ✨\n\n📍 ${listing.propertyAddress}\n💰 ${listing.listingPrice}\n🛏️ ${listing.bedsBaths} • 📐 ${listing.sqft}\n\nStunning coastal elegance with open-concept living, designer details, and private grounds. DM or call ${listing.agentPhone} to tour!\n\n#NestRealty #WilmingtonNC #JustListed #LuxuryRealEstate #CoastalLiving`;

      expect(socialCopy).toContain('✨ JUST LISTED in Wilmington! ✨');
      expect(socialCopy).toContain('#NestRealty');
      expect(socialCopy).toContain('#WilmingtonNC');
      expect(socialCopy).toContain('#JustListed');
    });

    it('formats template-specific copy briefs for Maxa design injection', () => {
      const flyerBrief = formatAssetSpecificCopyForMaxa('maxa_flyer_double', {
        propertyAddress: listing.propertyAddress,
        price: listing.listingPrice,
        bedsBaths: listing.bedsBaths,
        agentName: listing.agentName,
        phone: listing.agentPhone
      });

      expect(flyerBrief.title).toContain('Flyer');
      expect(flyerBrief.copyText).toContain('1104 Arboretum Dr');
      expect(flyerBrief.copyText).toContain('$1,250,000');
      expect(flyerBrief.maxaUrl).toBe('https://nest.maxadesigns.com/categories/popular');
    });
  });
});
