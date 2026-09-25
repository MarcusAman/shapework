/**
 * Proves that listing media assets are stored durably in PostgreSQL (durable_uploaded_assets),
 * cached to disk in public/uploads, and automatically rehydrated from the database
 * if the local container disk cache is missing.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  saveListingMediaAsset,
  getListingMediaAsset,
  computeAssetSha256
} from './services/listingMediaStorageService.js';

describe('Listing Media Storage & PostgreSQL Rehydration Harness', () => {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

  it('persists an asset buffer into PostgreSQL and caches it to public/uploads', async () => {
    const filename = `test_harness_photo_${Date.now()}.jpg`;
    const buffer = Buffer.from('FAKE_JPEG_IMAGE_BYTES_1104_LIVE_OAK_WILMINGTON');
    const expectedHash = computeAssetSha256(buffer);

    const saved = await saveListingMediaAsset({
      filename,
      contentType: 'image/jpeg',
      buffer,
      propertyAddress: '1104 S Live Oak Pkwy, Wilmington, NC',
      metadata: { source: 'harness_test' }
    });

    expect(saved.id).toBeDefined();
    expect(saved.filename).toBe(filename);
    expect(saved.contentType).toBe('image/jpeg');
    expect(saved.sizeBytes).toBe(buffer.length);
    expect(saved.sha256).toBe(expectedHash);
    expect(saved.url).toBe(`/uploads/${filename}`);

    // Verify written to disk cache
    const diskPath = path.join(uploadsDir, filename);
    expect(fs.existsSync(diskPath)).toBe(true);
    expect(fs.readFileSync(diskPath).toString()).toBe(buffer.toString());
  });

  it('rehydrates asset from PostgreSQL when local disk cache is wiped (Cloud Run cold start)', async () => {
    const filename = `cold_start_photo_${Date.now()}.jpg`;
    const buffer = Buffer.from('COLD_START_TEST_PHOTO_BYTES_WILMINGTON_WATERFRONT');

    // 1. Save asset
    await saveListingMediaAsset({
      filename,
      contentType: 'image/jpeg',
      buffer,
      propertyAddress: '742 Lumina Ave, Wrightsville Beach, NC'
    });

    // 2. Simulate container disk wipe (Cloud Run instance recycle)
    const diskPath = path.join(uploadsDir, filename);
    if (fs.existsSync(diskPath)) {
      fs.unlinkSync(diskPath);
    }
    expect(fs.existsSync(diskPath)).toBe(false);

    // 3. Retrieve asset -> should seamlessly fetch from PostgreSQL and re-create local disk cache
    const retrieved = await getListingMediaAsset(filename);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.filename).toBe(filename);
    expect(retrieved?.buffer.toString()).toBe(buffer.toString());
    expect(retrieved?.contentType).toBe('image/jpeg');

    // 4. Verify disk cache was rehydrated
    expect(fs.existsSync(diskPath)).toBe(true);

    // Cleanup test file from disk
    try {
      fs.unlinkSync(diskPath);
    } catch {}
  });

  it('generates a deterministic Proof Portal token and returns full task tracker with internal album photos', async () => {
    const {
      generateMarketingTrackerToken,
      getMarketingTrackerByToken,
      appendMarketingTrackerNote
    } = await import('./services/taskTrackerService.js');
    const {
      saveCanonicalMarketingTask,
      getAllCanonicalMarketingTasks
    } = await import('./persistence/marketingCampaignsRepository.js');

    const testTaskId = `task_album_test_${Date.now()}`;
    const token = generateMarketingTrackerToken(testTaskId);

    expect(token).toContain(testTaskId);
    expect(generateMarketingTrackerToken(testTaskId)).toBe(token); // Deterministic!

    // Create a mock task with photos in its internal media album
    const testTask = {
      id: testTaskId,
      workspaceId: 'ws_wilmington',
      title: 'Luxury Property Brochure (4-Page)',
      propertyAddress: '1104 S Live Oak Pkwy, Wilmington, NC',
      category: 'print_collateral',
      status: 'in_production',
      assignedTo: 'Eduardo Lovo',
      reviewer: 'Melissa Gagliardi',
      agentName: 'Marcus Aman',
      agentEmail: 'marcus.aman@gmail.com',
      photos: [
        {
          id: 'photo_1',
          name: 'live_oak_exterior.jpg',
          url: '/uploads/live_oak_exterior.jpg',
          type: 'image/jpeg',
          sizeBytes: 1024000
        },
        {
          id: 'photo_2',
          name: 'live_oak_interior.jpg',
          url: '/uploads/live_oak_interior.jpg',
          type: 'image/jpeg',
          sizeBytes: 2048000
        }
      ],
      notes: 'Initial request with 2 property photos attached.'
    };

    saveCanonicalMarketingTask(testTask as any);

    // Fetch tracker via token
    const tracker = await getMarketingTrackerByToken(token);
    expect(tracker).not.toBeNull();
    expect(tracker?.ticketId).toBeDefined();
    expect(tracker?.propertyAddress).toBe('1104 S Live Oak Pkwy, Wilmington, NC');
    expect(tracker?.isMarketingRequest).toBe(true);
    expect(tracker?.status).toBe('in_progress');
    expect(tracker?.stages.length).toBe(5);
    expect(tracker?.photos.length).toBe(2);
    expect(tracker?.photos[0].url).toBe('/uploads/live_oak_exterior.jpg');
    expect(tracker?.photos[0].url).not.toContain('unsplash.com');

    // Append note via tracker
    const updatedTracker = await appendMarketingTrackerNote(token, 'Marcus Aman', 'Please emphasize the waterfront dock in the brochure layout.');
    expect(updatedTracker).not.toBeNull();

    // Verify task updated
    const allTasks = getAllCanonicalMarketingTasks();
    const refreshed = allTasks.find(t => t.id === testTaskId);
    expect(refreshed?.notes).toContain('waterfront dock');

    // Clean up in-memory task
    const idx = allTasks.findIndex(t => t.id === testTaskId);
    if (idx >= 0) allTasks.splice(idx, 1);
  });
});
