-- Migration Down: 20260904200000_managed_marketing_assets_down.sql
-- Description: Drop managed_marketing_assets table.

BEGIN;

DROP TABLE IF EXISTS managed_marketing_assets CASCADE;

COMMIT;
