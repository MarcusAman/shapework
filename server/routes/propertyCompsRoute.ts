/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Express Router: Property Comps & Spatial Market Intelligence
 * Includes Appraisal Adjustments and Shareable Client Portal APIs.
 */

import { Router } from 'express';
import { PropertyCompsRepository, LUXURY_PROPERTY_DATABASE } from '../persistence/propertyCompsRepository.js';

export const propertyCompsRouter = Router();

// 1. GET /api/comps/properties — List all subject properties & active inventory
propertyCompsRouter.get('/properties', (req, res) => {
  try {
    const subjects = PropertyCompsRepository.getSubjectProperties();
    res.json({
      success: true,
      subjects,
      totalInventory: LUXURY_PROPERTY_DATABASE.length,
      allProperties: LUXURY_PROPERTY_DATABASE
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET /api/comps/spatial — Spatial comps search around a subject property
propertyCompsRouter.get('/spatial', (req, res) => {
  try {
    const { subjectId, radiusMiles, neighborhood, statusFilter } = req.query;

    const result = PropertyCompsRepository.findSpatialComps({
      subjectId: subjectId ? String(subjectId) : undefined,
      radiusMiles: radiusMiles ? parseFloat(String(radiusMiles)) : undefined,
      neighborhood: neighborhood ? String(neighborhood) : undefined,
      statusFilter: statusFilter ? String(statusFilter) : undefined
    });

    res.json({
      success: true,
      ...result
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST /api/comps/offer-analysis — Live NC Form 2-T Offer Scenario Simulator
propertyCompsRouter.post('/offer-analysis', (req, res) => {
  try {
    const {
      subjectPropertyId = 'prop_1104_arboretum',
      proposedOfferPrice,
      proposedDueDiligenceFee,
      dueDiligenceDays,
      proposedEarnestMoney,
      closingDays,
      sellerConcessions
    } = req.body || {};

    const analysis = PropertyCompsRepository.analyzeOfferScenario({
      subjectPropertyId,
      proposedOfferPrice: Number(proposedOfferPrice),
      proposedDueDiligenceFee: Number(proposedDueDiligenceFee),
      dueDiligenceDays: Number(dueDiligenceDays),
      proposedEarnestMoney: Number(proposedEarnestMoney),
      closingDays: Number(closingDays),
      sellerConcessions: Number(sellerConcessions || 0)
    });

    res.json({
      success: true,
      analysis
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 4. POST /api/comps/adjustments — Live Appraisal-Grade Comp Adjustments
propertyCompsRouter.post('/adjustments', (req, res) => {
  try {
    const {
      subjectPropertyId = 'prop_1104_arboretum',
      sqftRate,
      poolValue,
      dockValue,
      golfValue,
      garageValue
    } = req.body || {};

    const result = PropertyCompsRepository.calculateAppraisalAdjustments(subjectPropertyId, {
      sqftRate: sqftRate ? Number(sqftRate) : undefined,
      poolValue: poolValue ? Number(poolValue) : undefined,
      dockValue: dockValue ? Number(dockValue) : undefined,
      golfValue: golfValue ? Number(golfValue) : undefined,
      garageValue: garageValue ? Number(garageValue) : undefined
    });

    res.json({
      success: true,
      adjustments: result
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. POST /api/comps/share — Create Shareable Client Dossier Link
propertyCompsRouter.post('/share', (req, res) => {
  try {
    const {
      subjectPropertyId = 'prop_1104_arboretum',
      clientName,
      clientEmail,
      preparedBy
    } = req.body || {};

    const dossier = PropertyCompsRepository.createShareableDossier({
      subjectPropertyId,
      clientName,
      clientEmail,
      preparedBy
    });

    res.json({
      success: true,
      shareToken: dossier.shareToken,
      shareUrl: `/share/comps/${dossier.shareToken}`,
      dossier
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. GET /api/comps/share/:token — Get Shared Dossier by Token
propertyCompsRouter.get('/share/:token', (req, res) => {
  try {
    const { token } = req.params;
    const dossier = PropertyCompsRepository.getSharedDossierByToken(token);

    if (!dossier) {
      return res.status(404).json({ success: false, error: 'Shared client dossier expired or not found.' });
    }

    res.json({
      success: true,
      dossier
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. POST /api/comps/generate-dossier — Generate Comprehensive Luxury Comp Dossier
propertyCompsRouter.post('/generate-dossier', (req, res) => {
  try {
    const { subjectPropertyId = 'prop_1104_arboretum' } = req.body || {};
    const subject = PropertyCompsRepository.getPropertyById(subjectPropertyId) || LUXURY_PROPERTY_DATABASE[0];
    const { comps, summary } = PropertyCompsRepository.findSpatialComps({ subjectId: subject.id, radiusMiles: 5.0 });

    const dossier = {
      title: `Nest Realty Luxury Comparative Market Dossier: ${subject.propertyAddress.split(',')[0]}`,
      generatedAt: new Date().toISOString(),
      brokerage: 'Nest Realty Wilmington',
      subjectProperty: subject,
      marketSummary: summary,
      comparableProperties: comps,
      executiveValuationRecommendation: {
        suggestedListRange: `$${(Math.round((subject.listPrice * 0.98) / 10000) * 10000).toLocaleString()} – $${(Math.round((subject.listPrice * 1.03) / 10000) * 10000).toLocaleString()}`,
        recommendedTarget: `$${subject.listPrice.toLocaleString()}`,
        recommendedDueDiligence: `$${(subject.dueDiligenceFee || 25000).toLocaleString()} (2.0% Commitment)`,
        keyDifferentiators: subject.amenities
      }
    };

    res.json({
      success: true,
      dossier
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. POST /api/comps/custom — Add Custom Off-Market Comp or Pocket Listing
propertyCompsRouter.post('/custom', (req, res) => {
  try {
    const compData = req.body || {};
    const created = PropertyCompsRepository.addCustomComp(compData);

    res.json({
      success: true,
      comp: created,
      message: `Custom comp ${created.propertyAddress.split(',')[0]} added successfully.`
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 9. GET /api/comps/trends — Micro-Market Luxury Trend Analytics & Absorption Engine
propertyCompsRouter.get('/trends', (req, res) => {
  try {
    const { neighborhood } = req.query;
    const trends = PropertyCompsRepository.getMicroMarketTrends(neighborhood ? String(neighborhood) : undefined);

    res.json({
      success: true,
      trends
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. GET /api/comps/multi-offer/:subjectId — Fetch Multiple Competing Offers
propertyCompsRouter.get('/multi-offer/:subjectId', (req, res) => {
  try {
    const { subjectId } = req.params;
    const comparison = PropertyCompsRepository.compareMultipleOffers(subjectId);

    res.json({
      success: true,
      comparison
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. POST /api/comps/multi-offer/compare — Compare Custom Competing Buyer Offers
propertyCompsRouter.post('/multi-offer/compare', (req, res) => {
  try {
    const { subjectPropertyId = 'prop_1104_arboretum', offers } = req.body || {};
    const comparison = PropertyCompsRepository.compareMultipleOffers(subjectPropertyId, offers);

    res.json({
      success: true,
      comparison
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 12. GET /api/comps/flood-risk/:subjectId — Coastal Elevation, FEMA Flood Risk & Lifestyle Isochrones
propertyCompsRouter.get('/flood-risk/:subjectId', (req, res) => {
  try {
    const { subjectId } = req.params;
    const riskProfile = PropertyCompsRepository.getCoastalRiskProfile(subjectId);

    res.json({
      success: true,
      riskProfile
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. GET /api/comps/brokerage-share — Competitive Brokerage Market Share Intelligence
propertyCompsRouter.get('/brokerage-share', (req, res) => {
  try {
    const { neighborhood } = req.query;
    const shareData = PropertyCompsRepository.getBrokerageMarketShare(neighborhood ? String(neighborhood) : undefined);

    res.json({
      success: true,
      shareData
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 14. GET /api/comps/buyer-matches/:subjectId — In-House Luxury Buyer Cross-Match
propertyCompsRouter.get('/buyer-matches/:subjectId', (req, res) => {
  try {
    const { subjectId } = req.params;
    const matches = PropertyCompsRepository.findInHouseBuyerMatches(subjectId);

    res.json({
      success: true,
      ...matches
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 15. POST /api/comps/dispatch-preview — Dispatch Private In-House Preview Alerts
propertyCompsRouter.post('/dispatch-preview', (req, res) => {
  try {
    const { subjectPropertyId = 'prop_1104_arboretum', buyerIds } = req.body || {};
    const result = PropertyCompsRepository.dispatchInHousePreview(subjectPropertyId, buyerIds);

    res.json({
      success: true,
      ...result
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 16. GET /api/comps/address-search — Autocomplete Typeahead Suggestions
propertyCompsRouter.get('/address-search', (req, res) => {
  try {
    const { q = '' } = req.query;
    const suggestions = PropertyCompsRepository.getAddressSuggestions(String(q));

    res.json({
      success: true,
      suggestions
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 17. POST /api/comps/resolve-address — Resolve Address & Dynamically Generate Comps
propertyCompsRouter.post('/resolve-address', (req, res) => {
  try {
    const { addressQuery = '', options = {} } = req.body || {};
    const result = PropertyCompsRepository.resolveAddressSearch(addressQuery, options);

    res.json({
      success: true,
      ...result
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 18. POST /api/comps/generate-cma-deck — 8-Page High-Res Luxury CMA Booklet Synthesizer
propertyCompsRouter.post('/generate-cma-deck', (req, res) => {
  try {
    const { 
      subjectPropertyId = 'prop_1104_arboretum',
      clientName = 'Valued Private Client',
      agentName = 'Ryan Crecelius, Managing Broker'
    } = req.body || {};

    const deckPayload = PropertyCompsRepository.generateCmaDeckPayload(
      subjectPropertyId,
      clientName,
      agentName
    );

    res.json({
      success: true,
      deck: deckPayload
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 19. POST /api/comps/polygon-filter — Custom Spatial Polygon / Lasso Boundary Filter
propertyCompsRouter.post('/polygon-filter', (req, res) => {
  try {
    const { 
      subjectId = 'prop_1104_arboretum',
      polygon = []
    } = req.body || {};

    const result = PropertyCompsRepository.filterCompsByPolygon(subjectId, polygon);

    res.json({
      success: true,
      ...result
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 20. GET /api/comps/purchasing-power/:subjectId — HNW Jumbo Mortgage & Purchasing Power Matrix
propertyCompsRouter.get('/purchasing-power/:subjectId', (req, res) => {
  try {
    const { subjectId } = req.params;
    const { rate, downPayment, term } = req.query;

    const matrix = PropertyCompsRepository.calculatePurchasingPowerMatrix(subjectId, {
      customInterestRate: rate ? Number(rate) : undefined,
      customDownPaymentPercent: downPayment ? Number(downPayment) : undefined,
      loanTermYears: term ? Number(term) : undefined
    });

    res.json({
      success: true,
      matrix
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 21. GET /api/comps/tax-and-permits/:subjectId — Historical Permitting & Tax Assessment Profile
propertyCompsRouter.get('/tax-and-permits/:subjectId', (req, res) => {
  try {
    const { subjectId } = req.params;
    const profile = PropertyCompsRepository.getTaxAndPermitProfile(subjectId);

    res.json({
      success: true,
      profile
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 22. GET /api/comps/school-district/:subjectId — Assigned Public Schools & Premier Academies Profile
propertyCompsRouter.get('/school-district/:subjectId', (req, res) => {
  try {
    const { subjectId } = req.params;
    const profile = PropertyCompsRepository.getSchoolDistrictProfile(subjectId);

    res.json({
      success: true,
      profile
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 23. GET & POST /api/comps/direct-mail — Automated Neighborhood Direct Mailer & USPS EDDM Engine
propertyCompsRouter.get('/direct-mail/:subjectId', (req, res) => {
  try {
    const { subjectId } = req.params;
    const { size } = req.query;

    const campaign = PropertyCompsRepository.getDirectMailCampaignProfile(subjectId, {
      postcardSize: size as any
    });

    res.json({
      success: true,
      campaign
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

propertyCompsRouter.post('/direct-mail/dispatch', (req, res) => {
  try {
    const { subjectId = 'prop_1104_arboretum', size = '6x9_oversized', customHeadline } = req.body || {};
    const campaign = PropertyCompsRepository.getDirectMailCampaignProfile(subjectId, { postcardSize: size });

    res.json({
      success: true,
      dispatchedAt: new Date().toISOString(),
      orderConfirmationNumber: `EDDM-NC-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'Dispatched to Maxa Production Print Queue',
      recipients: campaign.metrics.totalRecipients,
      totalCost: campaign.metrics.totalCampaignCost
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 24. GET /api/comps/solar-exposure/:subjectId — Solar Exposure & Pool Sunlight Simulator
propertyCompsRouter.get('/solar-exposure/:subjectId', (req, res) => {
  try {
    const { subjectId } = req.params;
    const { season, hour } = req.query;

    const solarProfile = PropertyCompsRepository.getSolarExposureProfile(subjectId, {
      season: season as any,
      timeHour: hour ? Number(hour) : undefined
    });

    res.json({
      success: true,
      solarProfile
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 25. GET /api/comps/lot-topography/:subjectId — Lot Topography, Setbacks & Elevation Profile
propertyCompsRouter.get('/lot-topography/:subjectId', (req, res) => {
  try {
    const { subjectId } = req.params;
    const topography = PropertyCompsRepository.getLotTopographyProfile(subjectId);

    res.json({
      success: true,
      topography
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 26. GET /api/comps/micro-climate/:subjectId — Micro-Climate & Coastal Wind Intelligence
propertyCompsRouter.get('/micro-climate/:subjectId', (req, res) => {
  try {
    const { subjectId } = req.params;
    const microClimate = PropertyCompsRepository.getMicroClimateProfile(subjectId);

    res.json({
      success: true,
      microClimate
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 27. GET /api/comps/golf-course/:subjectId — Golf Course Fairway & Errant Ball Trajectory Heatmap
propertyCompsRouter.get('/golf-course/:subjectId', (req, res) => {
  try {
    const { subjectId } = req.params;
    const golfProfile = PropertyCompsRepository.getGolfCourseProfile(subjectId);

    res.json({
      success: true,
      golfProfile
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 28. GET /api/comps/waterfront-navigation/:subjectId — Waterfront, Boat Slip & Deepwater Navigation Corridor
propertyCompsRouter.get('/waterfront-navigation/:subjectId', (req, res) => {
  try {
    const { subjectId } = req.params;
    const navProfile = PropertyCompsRepository.getWaterfrontNavigationProfile(subjectId);

    res.json({
      success: true,
      navProfile
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 29. GET /api/comps/acoustic-soundscape/:subjectId — Ambient Acoustic Soundscape & Traffic Decibel
propertyCompsRouter.get('/acoustic-soundscape/:subjectId', (req, res) => {
  try {
    const { subjectId } = req.params;
    const soundscape = PropertyCompsRepository.getAcousticSoundscapeProfile(subjectId);

    res.json({
      success: true,
      soundscape
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
