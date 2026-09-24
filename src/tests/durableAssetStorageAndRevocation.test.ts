import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  saveDurableAssetAsync,
  getDurableAssetByFilenameAsync,
  getDurableAssetByIdAsync,
  createAssetDownloadTokenAsync,
  verifyAndConsumeDownloadTokenAsync,
  revokeDownloadTokenAsync,
  computeSha256,
  purgeDurableAssetsInMemory
} from '../../server/persistence/durableAssetRepository.js';

describe('Durable Asset Storage, Cross-Instance Retrieval & Revocable Tokens', () => {
  beforeEach(() => {
    purgeDurableAssetsInMemory();
  });

  it('persists asset with SHA-256 checksum and size metrics', async () => {
    const testContent = Buffer.from('PDF_TEST_BYTES_FOR_1104_LIVE_OAK_FLYER');
    const expectedChecksum = computeSha256(testContent);

    const asset = await saveDurableAssetAsync({
      filename: 'test_flyer_proof.pdf',
      contentType: 'application/pdf',
      buffer: testContent,
      metadata: { deliverable: 'Open House Tri-Fold Flyer' }
    });

    expect(asset.id).toBeDefined();
    expect(asset.filename).toBe('test_flyer_proof.pdf');
    expect(asset.contentType).toBe('application/pdf');
    expect(asset.sizeBytes).toBe(testContent.length);
    expect(asset.sha256Checksum).toBe(expectedChecksum);
    expect(asset.dataBase64).toBe(testContent.toString('base64'));
  });

  it('retrieves asset after local disk cache is purged (simulating container recycling/cold start)', async () => {
    const testContent = Buffer.from('PERSISTENT_ACROSS_CONTAINERS');
    const filename = `cold_start_${Date.now()}.pdf`;

    await saveDurableAssetAsync({
      filename,
      contentType: 'application/pdf',
      buffer: testContent
    });

    // Simulate container wipe by removing file from dist/uploads if it exists
    const diskPath = path.join(process.cwd(), 'dist', 'uploads', filename);
    if (fs.existsSync(diskPath)) {
      fs.unlinkSync(diskPath);
    }
    expect(fs.existsSync(diskPath)).toBe(false);

    // Retrieve via repository
    const retrieved = await getDurableAssetByFilenameAsync(filename);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.filename).toBe(filename);
    expect(Buffer.from(retrieved!.dataBase64, 'base64').toString()).toBe('PERSISTENT_ACROSS_CONTAINERS');
  });

  it('generates revocable download token and allows unauthenticated agent download', async () => {
    const testContent = Buffer.from('AGENT_DOWNLOADABLE_PROOF_V2');
    const asset = await saveDurableAssetAsync({
      filename: '1104_Live_Oak_V2.pdf',
      contentType: 'application/pdf',
      buffer: testContent
    });

    const tokenRecord = await createAssetDownloadTokenAsync({
      assetId: asset.id,
      filename: asset.filename,
      taskId: 'tsk_test_123',
      expiresInHours: 24
    });

    expect(tokenRecord.token).toBeDefined();
    expect(tokenRecord.token.startsWith('dl_')).toBe(true);
    expect(tokenRecord.isRevoked).toBe(false);

    // Consume token
    const result = await verifyAndConsumeDownloadTokenAsync(tokenRecord.token);
    expect(result.valid).toBe(true);
    expect(result.asset).toBeDefined();
    expect(result.asset?.filename).toBe('1104_Live_Oak_V2.pdf');
    expect(result.tokenRecord?.downloadCount).toBe(1);
  });

  it('immediately blocks download when token is revoked', async () => {
    const testContent = Buffer.from('REVOCABLE_CONTENT');
    const asset = await saveDurableAssetAsync({
      filename: 'revocable_flyer.pdf',
      contentType: 'application/pdf',
      buffer: testContent
    });

    const tokenRecord = await createAssetDownloadTokenAsync({
      assetId: asset.id,
      filename: asset.filename
    });

    // Revoke token
    const revoked = await revokeDownloadTokenAsync(tokenRecord.token, 'Melissa Gagliardi');
    expect(revoked).toBe(true);

    // Attempt download
    const result = await verifyAndConsumeDownloadTokenAsync(tokenRecord.token);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('revoked');
  });
});
