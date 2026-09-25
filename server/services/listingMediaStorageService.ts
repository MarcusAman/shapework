/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Listing Media Storage Service
 * Durable multi-tier media asset storage for Shapework:
 * 1. Persists raw bytes (base64) into PostgreSQL table `durable_uploaded_assets` with SHA-256 integrity.
 * 2. Writes through to local `/public/uploads` disk cache for high-speed static asset delivery.
 * 3. Seamlessly rehydrates local disk cache from PostgreSQL upon Cloud Run cold starts/container recycling.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pg from 'pg';
import { getDbPool } from '../persistence/repositories.js';

export interface SaveListingMediaAssetParams {
  filename: string;
  contentType: string;
  buffer: Buffer;
  propertyAddress?: string;
  metadata?: Record<string, any>;
}

export interface StoredListingMediaAsset {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  url: string;
  propertyAddress?: string;
  createdAt: string;
}

export interface RetrievedMediaAsset {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  buffer: Buffer;
}

// In-memory cache for fast lookups in testing / dev
const memoryAssetCache = new Map<string, RetrievedMediaAsset>();

export function computeAssetSha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function getUploadsDir(): string {
  const dir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {}
  }
  return dir;
}

function getActiveDbPool(): pg.Pool | null {
  const pool = getDbPool();
  if (pool) return pool;
  const connStr = process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL;
  if (connStr) {
    return new pg.Pool({ connectionString: connStr });
  }
  return null;
}

/**
 * Saves a media asset durably to PostgreSQL and writes to the local public/uploads directory.
 */
export async function saveListingMediaAsset(params: SaveListingMediaAssetParams): Promise<StoredListingMediaAsset> {
  const { filename, contentType, buffer, propertyAddress, metadata = {} } = params;
  const sizeBytes = buffer.length;
  const sha256 = computeAssetSha256(buffer);
  const assetId = `asset_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const now = new Date().toISOString();
  const dataBase64 = buffer.toString('base64');

  // 1. Write to local disk cache in /public/uploads
  try {
    const uploadsDir = getUploadsDir();
    const diskPath = path.join(uploadsDir, filename);
    fs.writeFileSync(diskPath, buffer);
  } catch (err) {
    console.warn(`[ListingMediaStorage] Notice caching to disk for ${filename}:`, err);
  }

  // Also cache in memory
  memoryAssetCache.set(filename, {
    id: assetId,
    filename,
    contentType,
    sizeBytes,
    sha256,
    buffer
  });

  // 2. Persist to PostgreSQL durable_uploaded_assets
  const pool = getActiveDbPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO durable_uploaded_assets (
          id, filename, content_type, size_bytes, sha256_checksum, data_base64, storage_driver, created_at, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, 'database', NOW(), $7::jsonb)
        ON CONFLICT (id) DO UPDATE SET
          filename = EXCLUDED.filename,
          content_type = EXCLUDED.content_type,
          size_bytes = EXCLUDED.size_bytes,
          sha256_checksum = EXCLUDED.sha256_checksum,
          data_base64 = EXCLUDED.data_base64,
          metadata = EXCLUDED.metadata`,
        [
          assetId,
          filename,
          contentType,
          sizeBytes,
          sha256,
          dataBase64,
          JSON.stringify({ ...metadata, propertyAddress: propertyAddress || null })
        ]
      );
    } catch (dbErr: any) {
      console.warn(`[ListingMediaStorage] Notice inserting into durable_uploaded_assets:`, dbErr?.message || dbErr);
    }
  }

  return {
    id: assetId,
    filename,
    contentType,
    sizeBytes,
    sha256,
    url: `/uploads/${filename}`,
    propertyAddress,
    createdAt: now
  };
}

/**
 * Retrieves a media asset by filename.
 * Checks local disk cache first; if missing (container cold start), retrieves from PostgreSQL and restores disk cache.
 */
export async function getListingMediaAsset(filename: string): Promise<RetrievedMediaAsset | null> {
  const cleanFilename = path.basename(filename);
  const uploadsDir = getUploadsDir();
  const diskPath = path.join(uploadsDir, cleanFilename);

  // 1. Check disk cache
  if (fs.existsSync(diskPath)) {
    try {
      const buffer = fs.readFileSync(diskPath);
      const sha256 = computeAssetSha256(buffer);
      const ext = path.extname(cleanFilename).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.pdf' ? 'application/pdf' : 'image/jpeg';
      return {
        id: `disk_${cleanFilename}`,
        filename: cleanFilename,
        contentType,
        sizeBytes: buffer.length,
        sha256,
        buffer
      };
    } catch (err) {
      console.warn(`[ListingMediaStorage] Notice reading disk cache for ${cleanFilename}:`, err);
    }
  }

  // 2. Check memory cache
  const cached = memoryAssetCache.get(cleanFilename);
  if (cached) {
    try {
      fs.writeFileSync(diskPath, cached.buffer);
    } catch {}
    return cached;
  }

  // 3. Rehydrate from PostgreSQL durable_uploaded_assets
  const pool = getActiveDbPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, filename, content_type, size_bytes, sha256_checksum, data_base64
         FROM durable_uploaded_assets
         WHERE filename = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [cleanFilename]
      );

      if (res.rows.length > 0) {
        const row = res.rows[0];
        const buffer = Buffer.from(row.data_base64, 'base64');

        // Rehydrate local disk cache so subsequent requests are lightning-fast
        try {
          fs.writeFileSync(diskPath, buffer);
        } catch (writeErr) {
          console.warn(`[ListingMediaStorage] Notice rehydrating disk cache for ${cleanFilename}:`, writeErr);
        }

        const asset: RetrievedMediaAsset = {
          id: row.id,
          filename: row.filename,
          contentType: row.content_type,
          sizeBytes: Number(row.size_bytes),
          sha256: row.sha256_checksum,
          buffer
        };

        memoryAssetCache.set(cleanFilename, asset);
        return asset;
      }
    } catch (dbErr: any) {
      console.warn(`[ListingMediaStorage] Notice querying durable_uploaded_assets for ${cleanFilename}:`, dbErr?.message || dbErr);
    }
  }

  return null;
}
