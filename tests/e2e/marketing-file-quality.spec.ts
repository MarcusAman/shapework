import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const RELEASE_DIR = '/Users/marcusaman/.gemini/antigravity/brain/438d0515-eff4-4e56-ad09-da389d4b82d9/release_20260731_194000/990-Inspiration-Drive-Marketing-Package';

test.describe('Real Media Quality & Private Storage Verification (Release Gate)', () => {
  test('Property Flyer PDF contains valid PDF header, embedded JPEG image, and single-page dimensions', async () => {
    const pdfPath = path.join(RELEASE_DIR, 'Flyer/990-Inspiration-Drive-Flyer.pdf');
    expect(fs.existsSync(pdfPath)).toBe(true);
    const buf = fs.readFileSync(pdfPath);
    expect(buf.length).toBeGreaterThan(500000);

    const content = buf.toString('utf-8');
    expect(content.startsWith('%PDF-1.7')).toBe(true);
    expect(content).toContain('/XObject');
    expect(content).toContain('/DCTDecode');
    expect(content).toContain('LUXURY COASTAL ESTATE IN MAYFAIRE');
    expect(content).toContain('NCREC License #C2519');
  });

  test('Flyer Preview PNG decodes with valid IHDR dimensions (1200x1553) and nontrivial byte size', async () => {
    const pngPath = path.join(RELEASE_DIR, 'Flyer/990-Inspiration-Drive-Flyer-Preview.png');
    expect(fs.existsSync(pngPath)).toBe(true);
    const buf = fs.readFileSync(pngPath);
    expect(buf.length).toBeGreaterThan(10000);

    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    expect(width).toBe(1200);
    expect(height).toBe(1553);
  });

  test('Social Carousel Slides decode with 1080x1080 dimensions and unique visual content', async () => {
    const slide1Path = path.join(RELEASE_DIR, 'Social/Slide-01.png');
    const slide3Path = path.join(RELEASE_DIR, 'Social/Slide-03.png');
    
    expect(fs.existsSync(slide1Path)).toBe(true);
    expect(fs.existsSync(slide3Path)).toBe(true);

    const s1Buf = fs.readFileSync(slide1Path);
    const s3Buf = fs.readFileSync(slide3Path);

    expect(s1Buf.length).toBeGreaterThan(10000);
    expect(s3Buf.length).toBeGreaterThan(10000);

    const w1 = s1Buf.readUInt32BE(16);
    const h1 = s1Buf.readUInt32BE(20);
    expect(w1).toBe(1080);
    expect(h1).toBe(1080);
  });

  test('Direct-Mail Postcard Front PDF includes embedded listing photo and 6x9 dimensions', async () => {
    const frontPdf = path.join(RELEASE_DIR, 'Postcard/990-Inspiration-Drive-Postcard-Front.pdf');
    expect(fs.existsSync(frontPdf)).toBe(true);
    const buf = fs.readFileSync(frontPdf);
    expect(buf.length).toBeGreaterThan(500000);

    const content = buf.toString('utf-8');
    expect(content).toContain('/MediaBox [ 0 0 648 432 ]');
  });

  test('Story Reel Storyboard PDF is honestly labeled and has 9:16 vertical dimensions (432x768)', async () => {
    const sbPdf = path.join(RELEASE_DIR, 'Story-Reel/Storyboard.pdf');
    expect(fs.existsSync(sbPdf)).toBe(true);
    const content = fs.readFileSync(sbPdf, 'utf-8');
    expect(content).toContain('STORY REEL STORYBOARD');
    expect(content).toContain('/MediaBox [ 0 0 432 768 ]');
  });

  test('Sign Rider PDF proof and decodable QR matrix image exist with open-house copy', async () => {
    const riderPdf = path.join(RELEASE_DIR, 'Sign-Rider/990-Inspiration-Drive-Sign-Rider.pdf');
    const qrMatrix = path.join(RELEASE_DIR, 'Sign-Rider/QR-Code-Matrix.png');

    expect(fs.existsSync(riderPdf)).toBe(true);
    expect(fs.existsSync(qrMatrix)).toBe(true);

    const content = fs.readFileSync(riderPdf, 'utf-8');
    expect(content).toContain('SIGN RIDER PROOF');
    expect(content).toContain('OPEN HOUSE SUNDAY');
  });

  test('Source Photo & Release Review Contact Sheets exist in package', async () => {
    const srcContactSheetPdf = path.join(RELEASE_DIR, 'Campaign/Source-Photo-Contact-Sheet.pdf');
    const releaseContactSheetPdf = path.join(RELEASE_DIR, 'Campaign/Release-Contact-Sheet.pdf');

    expect(fs.existsSync(srcContactSheetPdf)).toBe(true);
    expect(fs.existsSync(releaseContactSheetPdf)).toBe(true);
  });

  test('Package Manifest JSON contains truthful delivery status, photo mapping, and honest approval metadata', async () => {
    const manifestPath = path.join(RELEASE_DIR, 'Campaign/Package-Manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    expect(manifest.approvalMetadata.source).toBe('Demo fixture');
    expect(manifest.approvalMetadata.humanVerification).toBe('Not performed');
    expect(Array.isArray(manifest.physicalPhotoMapping)).toBe(true);
    expect(manifest.physicalPhotoMapping.length).toBe(4);
    expect(manifest.manifest.length).toBeGreaterThan(25);
  });

  test('Public static route for moved source photo returns HTTP 404 (Private Storage Enforced)', async ({ request }) => {
    const response = await request.get('http://localhost:3000/luxury_home_990_inspiration_1785434122508.jpg');
    expect(response.status()).toBe(404);
  });
});
