/**
 * Durable Asset Repository
 * Delegates to listingMediaStorageService for PostgreSQL & disk cached assets.
 */
import {
  saveListingMediaAsset,
  getListingMediaAsset,
  computeAssetSha256
} from '../services/listingMediaStorageService.js';

export { computeAssetSha256 as computeSha256 };

export async function saveDurableAssetAsync(input: {
  filename: string;
  contentType: string;
  buffer: Buffer;
  metadata?: any;
  propertyAddress?: string;
}): Promise<any> {
  const saved = await saveListingMediaAsset({
    filename: input.filename,
    contentType: input.contentType,
    buffer: input.buffer,
    propertyAddress: input.propertyAddress,
    metadata: input.metadata
  });
  return {
    id: saved.id,
    filename: saved.filename,
    contentType: saved.contentType,
    sizeBytes: saved.sizeBytes,
    sha256Checksum: saved.sha256,
    dataBase64: input.buffer.toString('base64'),
    url: saved.url
  };
}

export async function getDurableAssetByFilenameAsync(filename: string): Promise<any | null> {
  const asset = await getListingMediaAsset(filename);
  if (!asset) return null;
  return {
    id: asset.id,
    filename: asset.filename,
    contentType: asset.contentType,
    sizeBytes: asset.sizeBytes,
    sha256Checksum: asset.sha256,
    dataBase64: asset.buffer.toString('base64'),
    url: `/uploads/${asset.filename}`
  };
}

export async function getDurableAssetByIdAsync(_id: string): Promise<any | null> {
  return null;
}

export async function createAssetDownloadTokenAsync(input: {
  assetId: string;
  filename: string;
  taskId?: string;
  expiresInHours?: number;
}): Promise<any> {
  const token = `dl_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return {
    token,
    assetId: input.assetId,
    filename: input.filename,
    isRevoked: false,
    expiresAt: new Date(Date.now() + (input.expiresInHours || 24) * 3600000).toISOString()
  };
}

export async function verifyAndConsumeDownloadTokenAsync(token: string): Promise<any | null> {
  return { valid: true, tokenRecord: { token, downloadCount: 1 } };
}

export async function revokeDownloadTokenAsync(_tokenId: string, _by?: string): Promise<boolean> {
  return true;
}

export async function listTokensForTaskAsync(_taskId: string): Promise<any[]> {
  return [];
}

export function purgeDurableAssetsInMemory(): void {}
