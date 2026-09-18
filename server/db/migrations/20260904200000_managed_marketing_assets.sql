-- Migration: 20260904200000_managed_marketing_assets.sql
-- Description: Additive schema for managed marketing proof assets with verified dimensions, genuine DPI, and metadata.

BEGIN;

CREATE TABLE IF NOT EXISTS managed_marketing_assets (
  id VARCHAR(100) PRIMARY KEY,
  task_id VARCHAR(100) NOT NULL,
  request_id VARCHAR(100),
  deliverable_name VARCHAR(255) NOT NULL,
  storage_driver VARCHAR(50) NOT NULL DEFAULT 'unconfigured',
  storage_path TEXT,
  public_url TEXT,
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  width INTEGER,
  height INTEGER,
  aspect_ratio VARCHAR(50),
  orientation VARCHAR(50),
  dpi_value NUMERIC,
  dpi_verified BOOLEAN NOT NULL DEFAULT FALSE,
  page_count INTEGER DEFAULT 1,
  validation_status VARCHAR(50) NOT NULL DEFAULT 'unverified',
  version INTEGER NOT NULL DEFAULT 1,
  uploaded_by_id VARCHAR(100) NOT NULL,
  uploaded_by_name VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_managed_assets_task_id
ON managed_marketing_assets(task_id);

CREATE INDEX IF NOT EXISTS idx_managed_assets_uploader
ON managed_marketing_assets(uploaded_by_id);

COMMIT;
