/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { rasterizePdfToPng } from '../../server/media/mediaPipeline.js';

test.describe('Real Browser Download & Legacy Regression Verification (Release Gate)', () => {

  test('Export & Download APIs stream authoritative PKZIP archive and pass visual rasterization gate', async ({ request }) => {
    // 1. Issue HTTP request to authoritative export route (mimicking browser fetch)
    const res = await request.post('http://localhost:3000/api/marketing/campaigns/campaign_990_inspiration/deliver/export?format=binary', {
      headers: {
        'Authorization': 'Bearer token_usr_admin',
        'x-workspace-id': 'nest-realty-demo',
        'Content-Type': 'application/json'
      },
      data: { format: 'zip' }
    });

    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toBe('application/zip');
    expect(res.headers()['content-disposition']).toContain('attachment; filename="990-Inspiration-Drive-Marketing-Package.zip"');

    // 2. Save downloaded binary ZIP stream
    const buf = await res.body();
    const testDir = path.join(process.cwd(), 'test-results', 'browser_downloaded_package');
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
    fs.mkdirSync(testDir, { recursive: true });

    const zipPath = path.join(testDir, '990-Inspiration-Drive-Marketing-Package.zip');
    fs.writeFileSync(zipPath, buf);

    expect(fs.existsSync(zipPath)).toBe(true);
    const zipSha256 = crypto.createHash('sha256').update(buf).digest('hex');
    expect(buf.length).toBeGreaterThan(1000000); // Must be > 1 MB

    console.log(`📦 Captured streamed package download! Size: ${buf.length} bytes, SHA-256: ${zipSha256}`);

    // 3. Extract downloaded ZIP archive
    const extractDir = path.join(testDir, 'extracted');
    fs.mkdirSync(extractDir, { recursive: true });
    execSync(`unzip -q "${zipPath}" -d "${extractDir}"`);

    const pkgDir = path.join(extractDir, '990-Inspiration-Drive-Marketing-Package');
    expect(fs.existsSync(pkgDir)).toBe(true);

    // 4. Verify required PDF deliverables exist and rasterize cleanly
    const pdfDeliverables = [
      { path: path.join(pkgDir, 'Flyer', '990-Inspiration-Drive-Flyer.pdf'), name: 'Flyer' },
      { path: path.join(pkgDir, 'Postcard', '990-Inspiration-Drive-Postcard-Front.pdf'), name: 'Postcard Front' },
      { path: path.join(pkgDir, 'Postcard', '990-Inspiration-Drive-Postcard-Back.pdf'), name: 'Postcard Back' },
      { path: path.join(pkgDir, 'Story-Reel', 'Storyboard.pdf'), name: 'Storyboard' },
      { path: path.join(pkgDir, 'Sign-Rider', '990-Inspiration-Drive-Sign-Rider.pdf'), name: 'Sign Rider' },
      { path: path.join(pkgDir, 'Campaign', 'Campaign-Summary.pdf'), name: 'Campaign Summary' },
      { path: path.join(pkgDir, 'Campaign', 'Source-Photo-Contact-Sheet.pdf'), name: 'Source Photo Contact Sheet' },
      { path: path.join(pkgDir, 'Campaign', 'Release-Contact-Sheet.pdf'), name: 'Release Contact Sheet' }
    ];

    for (const pdf of pdfDeliverables) {
      expect(fs.existsSync(pdf.path), `Missing PDF asset: ${pdf.name}`).toBe(true);
      const pdfBuf = fs.readFileSync(pdf.path);
      expect(pdfBuf.toString('ascii', 0, 5)).toBe('%PDF-');

      // 5. Rasterize PDF page to image and assert non-blank visual content
      const rasterizedPng = await rasterizePdfToPng(pdfBuf, 1200);
      expect(rasterizedPng.length).toBeGreaterThan(5000); // Non-blank image buffer

      console.log(`✓ Rasterized & verified non-blank PDF page: ${pdf.name} (PNG length: ${rasterizedPng.length} bytes)`);
    }

    // 6. Verify PNG deliverables (Social Slides & Previews)
    const pngDeliverables = [
      path.join(pkgDir, 'Social', 'Slide-01.png'),
      path.join(pkgDir, 'Social', 'Slide-02.png'),
      path.join(pkgDir, 'Social', 'Slide-03.png'),
      path.join(pkgDir, 'Flyer', '990-Inspiration-Drive-Flyer-Preview.png'),
      path.join(pkgDir, 'Postcard', '990-Inspiration-Drive-Postcard-Front-Preview.png'),
      path.join(pkgDir, 'Postcard', '990-Inspiration-Drive-Postcard-Back-Preview.png'),
      path.join(pkgDir, 'Story-Reel', 'Storyboard-Preview.png'),
      path.join(pkgDir, 'Sign-Rider', '990-Inspiration-Drive-Sign-Rider-Preview.png'),
      path.join(pkgDir, 'Sign-Rider', 'QR-Code-Matrix.png')
    ];

    for (const pngPath of pngDeliverables) {
      expect(fs.existsSync(pngPath), `Missing PNG asset: ${pngPath}`).toBe(true);
      const pngBuf = fs.readFileSync(pngPath);
      expect(pngBuf.length).toBeGreaterThan(1000);
    }

    // 7. Assert Listing Snapshot & Package Manifest JSON contain truthful facts
    const snapshotPath = path.join(pkgDir, 'Campaign', 'Listing-Snapshot.json');
    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
    expect(String(snapshot.bathrooms)).toBe('4.5');
    expect(String(snapshot.bedrooms)).toBe('4');

    const manifestPath = path.join(pkgDir, 'Campaign', 'Package-Manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifest.campaignId).toBe('campaign_990_inspiration');

    // 8. Assert NO Unsplash URLs or unsupported claims appear in any extracted file
    const checkNoForbiddenText = (targetDir: string) => {
      const walk = (d: string) => {
        const items = fs.readdirSync(d, { withFileTypes: true });
        for (const item of items) {
          const fullPath = path.join(d, item.name);
          if (item.isDirectory()) {
            walk(fullPath);
          } else if (item.isFile() && (item.name.endsWith('.json') || item.name.endsWith('.txt') || item.name.endsWith('.html'))) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            expect(content).not.toContain('images.unsplash.com');
            expect(content).not.toContain('3.5 Designer Bathrooms');
            expect(content).not.toContain('ICWW water breeze');
            expect(content).not.toContain('WATERFRONT POOL HOME');
            expect(content).not.toContain('ACTIVE_CAMPAIGN_SYNCED');
          }
        }
      };
      walk(targetDir);
    };
    checkNoForbiddenText(pkgDir);

    console.log('✅ Streamed package download & visual verification release gate passed successfully!');
  });

  test('Repository regression test: Active production codebase contains zero legacy export builders or forbidden strings', async () => {
    const consolePath = path.join(process.cwd(), 'src', 'components', 'marketing', 'MarketingIntakeConsole.tsx');
    const content = fs.readFileSync(consolePath, 'utf-8');

    expect(content).not.toContain('1_Printable_Flyer_300DPI.html');
    expect(content).not.toContain('2_Social_Media_Captions_Suite.txt');
    expect(content).not.toContain('3_Direct_Mail_Postcard_6x9.html');
    expect(content).not.toContain('4_Open_House_Sign_Rider.txt');
    expect(content).not.toContain('5_Rechat_CRM_Syndication_Report.json');
    expect(content).not.toContain('README_Marketing_Package.txt');
    expect(content).not.toContain('ACTIVE_CAMPAIGN_SYNCED');
    expect(content).not.toContain('DRAFT_MATRIX_READY');
    expect(content).not.toContain('ICWW water breeze');
    expect(content).not.toContain('WATERFRONT POOL HOME');
    expect(content).not.toContain('Shapework OS & Nest Realty AI Marketing Studio');
    expect(content).not.toContain('3.5 Designer Bathrooms');
  });

});
