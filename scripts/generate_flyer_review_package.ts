import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { chromium } from 'playwright';
import { buildRealMarketingPackage } from '../server/media/mediaPipeline.js';
import { generateNestEditorialFlyerHtml } from '../src/marketing-templates/nest-editorial/flyer/FlyerTemplate.js';

async function generateReviewPackage() {
  console.log('=== GENERATING OFFICIAL NEST EDITORIAL V1 FLYER REVIEW PACKAGE ===');

  const rootDir = path.resolve(import.meta.dirname, '..');
  const reviewDir = path.join(rootDir, 'artifacts', 'design-review', 'nest-editorial-v1', 'flyer');
  fs.mkdirSync(reviewDir, { recursive: true });

  // 1. Generate real campaign package via server media pipeline
  const mockCampaign = {
    id: 'campaign_990_inspiration',
    listingId: 'listing_990',
    title: '990 Inspiration Drive',
    status: 'ready_review',
    address: '990 Inspiration Drive',
    price: '$1,250,000',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const releaseDir = path.join(rootDir, 'data', 'releases', 'release_flyer_review');
  fs.mkdirSync(releaseDir, { recursive: true });

  const packageResult = await buildRealMarketingPackage(mockCampaign as any, releaseDir);
  const zipBuffer = fs.readFileSync(packageResult.zipPath);
  console.log(`✓ Generated server package ZIP (${zipBuffer.length} bytes) at ${packageResult.zipPath}`);

  // Compute package ZIP SHA-256
  const packageSha256 = packageResult.zipSha256;

  // Extract exact flyer PDF from package ZIP
  const JSZip = (await import('jszip')).default;
  const unzipped = await JSZip.loadAsync(zipBuffer);
  const pdfEntryKey = Object.keys(unzipped.files).find((k) => k.endsWith('Flyer/990-Inspiration-Drive-Flyer.pdf') || k.endsWith('Flyer.pdf'));
  if (!pdfEntryKey) throw new Error('Flyer PDF not found in package ZIP');

  const pdfBuffer = await unzipped.files[pdfEntryKey].async('nodebuffer');
  const pdfPath = path.join(reviewDir, '990-Inspiration-Drive-Flyer.pdf');
  fs.writeFileSync(pdfPath, pdfBuffer);

  const pdfSha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
  console.log(`✓ Saved Flyer PDF: ${pdfPath}`);
  console.log(`  Package Checksum: ${packageSha256}`);
  console.log(`  Flyer PDF Checksum: ${pdfSha256}`);

  // 2. Render Proof Rasters using Playwright Chromium & CLI tools
  const browser = await chromium.launch();

  // A. 300 DPI Print Review PNG (2550 x 3300 px)
  const page300 = await browser.newPage({ viewport: { width: 2550, height: 3300 }, deviceScaleFactor: 1 });
  const flyerHtml = generateNestEditorialFlyerHtml({
    brandName: 'Nest Realty Wilmington',
    subBrand: 'LUXURY COASTAL COLLECTION',
    eyebrow: 'JUST LISTED',
    headline: 'LUXURY COASTAL ESTATE AT MAYFAIRE',
    address: '990 Inspiration Drive',
    cityStateZip: 'Wilmington, NC 28405',
    priceFormatted: '$1,250,000',
    facts: [
      { label: 'BEDROOMS', value: '4' },
      { label: 'BATHROOMS', value: '4.5' },
      { label: 'SQ FT', value: '4,200' },
      { label: 'ACRES', value: '0.84' },
    ],
    heroPhoto: {
      id: 'photo_hero',
      category: 'hero',
      url: packageResult.heroPhotoDataUri,
      altText: '990 Inspiration Drive Estate Facade',
    },
    featuresTitle: 'VERIFIED PROPERTY HIGHLIGHTS',
    features: [
      'Private Heated Saltwater Pool with Sun Shelf & Resort Deck',
      'Gourmet Quartzite Kitchen with Custom Cabinetry Suite',
      'Main-Floor Primary Suite Sanctuary with Spa Bath',
      'Prime Wilmington Location Minutes to Wrightsville Beach & Marina',
    ],
    agent: {
      name: 'Ryan Crecelius (BIC)',
      title: 'Broker in Charge',
      office: 'Nest Realty Wilmington',
      phone: '(910) 232-1772',
      email: 'ryan@nestrealty.com',
      licenseNumber: 'C2519',
    },
    legal: {
      ncrecLicense: 'C2519',
      equalHousingText: 'Equal Housing Opportunity',
      disclaimer: 'Independently Owned & Operated',
    },
  });

  await page300.setContent(flyerHtml, { waitUntil: 'networkidle' });
  const print300Path = path.join(reviewDir, 'flyer_print_review_300dpi.png');
  await page300.screenshot({ path: print300Path, fullPage: true });

  // B. Desktop Review PNG (~1500px high -> 1159 x 1500 px)
  const pageDesktop = await browser.newPage({ viewport: { width: 1159, height: 1500 }, deviceScaleFactor: 1 });
  await pageDesktop.setContent(flyerHtml, { waitUntil: 'networkidle' });
  const desktopPath = path.join(reviewDir, 'flyer_desktop_review_1500h.png');
  await pageDesktop.screenshot({ path: desktopPath, fullPage: true });

  // C. Print Preview Scale PNG (612 x 792 px)
  const pagePreview = await browser.newPage({ viewport: { width: 612, height: 792 }, deviceScaleFactor: 1 });
  await pagePreview.setContent(flyerHtml, { waitUntil: 'networkidle' });
  const previewPath = path.join(reviewDir, 'flyer_print_preview_scale.png');
  await pagePreview.screenshot({ path: previewPath, fullPage: true });

  // 3. Render Diagnostic Layout Grid Overlay (Nest-Editorial-V1-Flyer-Layout-Diagnostic.png)
  const diagnosticHtml = flyerHtml.replace(
    '</style>',
    `
    .nest-flyer-body { position: relative; }
    .diag-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
    }
    .diag-margin-box {
      position: absolute;
      top: 24pt; left: 28pt; right: 28pt; bottom: 18pt;
      border: 1.5pt dashed #EF4444;
    }
    .diag-label {
      position: absolute;
      background: rgba(0,0,0,0.85);
      color: #FFFFFF;
      font-size: 7pt;
      font-family: monospace;
      padding: 1pt 4pt;
      border-radius: 2pt;
    }
    </style>`
  ).replace(
    '<body class="nest-flyer-body">',
    `<body class="nest-flyer-body">
    <div class="diag-overlay">
      <div class="diag-margin-box">
        <span class="diag-label" style="top:-9pt; left:0;">PAGE MARGIN BOUNDARY (24pt Top/Bottom, 28pt Left/Right | Clear Print Zone 556pt x 750pt)</span>
      </div>
    </div>`
  );

  const pageDiag = await browser.newPage({ viewport: { width: 1224, height: 1584 }, deviceScaleFactor: 1 });
  await pageDiag.setContent(diagnosticHtml, { waitUntil: 'networkidle' });
  const diagPath = path.join(reviewDir, 'Nest-Editorial-V1-Flyer-Layout-Diagnostic.png');
  await pageDiag.screenshot({ path: diagPath, fullPage: true });

  await browser.close();

  // 4. Execute Native CLI Commands for PDF Validation (pdftoppm & mutool)
  const popplerPrefix = path.join(reviewDir, 'flyer_poppler');
  execSync(`pdftoppm -png -r 150 "${pdfPath}" "${popplerPrefix}"`);
  
  // Rename generated poppler file to flyer_poppler_150dpi.png
  const generatedPoppler = `${popplerPrefix}-1.png`;
  const targetPoppler = path.join(reviewDir, 'flyer_poppler_150dpi.png');
  if (fs.existsSync(generatedPoppler)) {
    fs.renameSync(generatedPoppler, targetPoppler);
  }

  const targetMuPdf = path.join(reviewDir, 'flyer_mupdf_150dpi.png');
  execSync(`mutool draw -r 150 -o "${targetMuPdf}" "${pdfPath}"`);

  // Run pdfinfo
  const pdfinfoOut = execSync(`pdfinfo "${pdfPath}"`).toString();

  // Run pdffonts
  const pdffontsOut = execSync(`pdffonts "${pdfPath}"`).toString();

  console.log('\n=== PDFINFO OUTPUT ===\n' + pdfinfoOut);
  console.log('=== PDFFONTS OUTPUT ===\n' + pdffontsOut);

  // 5. Execute Content Fit Stress Test
  const stressFlyerHtml = generateNestEditorialFlyerHtml({
    brandName: 'Nest Realty Wilmington',
    subBrand: 'LUXURY COASTAL COLLECTION',
    eyebrow: 'JUST LISTED',
    headline: 'EXTRAORDINARY DEEPWATER WATERFRONT RESIDENCE WITH PRIVATE SLIP',
    address: '1287 North Lumina Avenue, Unit 1402',
    cityStateZip: 'Wrightsville Beach, North Carolina 28480',
    priceFormatted: '$2,850,000',
    facts: [
      { label: 'BEDROOMS', value: '5' },
      { label: 'BATHROOMS', value: '5.5' },
      { label: 'SQ FT', value: '5,400' },
      { label: 'ACRES', value: '1.12' },
    ],
    heroPhoto: {
      id: 'photo_hero',
      category: 'hero',
      url: packageResult.heroPhotoDataUri,
      altText: '1287 North Lumina Avenue',
    },
    featuresTitle: 'VERIFIED PROPERTY HIGHLIGHTS',
    features: [
      'Private heated saltwater swimming pool with oversized sun shelf deck',
      'Gourmet quartzite kitchen featuring custom cabinetry & Thermador appliances',
      'Main-floor primary suite sanctuary with spa-inspired bath & custom walk-in closet',
      'Deepwater boat slip providing direct access to the Intracoastal Waterway',
      'Expansive covered loggia with outdoor fireplace & summer kitchen',
    ],
    agent: {
      name: 'Alexandra Montgomery-Sinclair, Senior Broker-in-Charge',
      title: 'Senior Broker-in-Charge',
      office: 'Nest Realty Wilmington Coastal Division',
      phone: '(910) 232-1772',
      email: 'alexandra.montgomery@nestrealty.com',
      licenseNumber: 'C2519',
    },
    legal: {
      ncrecLicense: 'C2519',
      equalHousingText: 'Equal Housing Opportunity',
      disclaimer: 'Independently Owned & Operated',
    },
  });

  const stressPath = path.join(reviewDir, 'flyer_stress_test_render.png');
  const browser2 = await chromium.launch();
  const pageStress = await browser2.newPage({ viewport: { width: 1224, height: 1584 } });
  await pageStress.setContent(stressFlyerHtml, { waitUntil: 'networkidle' });
  await pageStress.screenshot({ path: stressPath, fullPage: true });
  await browser2.close();
  console.log(`✓ Saved Stress Test Screenshot: ${stressPath}`);

  // Write summary json
  const summaryJson = {
    packagePath: packageResult.zipPath,
    packageChecksum: packageSha256,
    extractedPdfPath: pdfPath,
    flyerPdfChecksum: pdfSha256,
    templateId: 'nest_editorial_v1',
    templateVersion: '1.0.0',
    campaignRevision: 1,
    rendererVersion: '1.0.0',
    humanVisualApproval: 'pending',
    pdfinfo: pdfinfoOut,
    pdffonts: pdffontsOut,
  };

  fs.writeFileSync(path.join(reviewDir, 'review_summary.json'), JSON.stringify(summaryJson, null, 2));
  console.log('=== FLYER REVIEW PACKAGE GENERATION COMPLETE ===');
}

generateReviewPackage().catch(console.error);
