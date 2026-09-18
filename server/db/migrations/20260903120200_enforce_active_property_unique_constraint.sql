-- Migration: 20260903120200_enforce_active_property_unique_constraint.sql
-- Description: Enforces partial unique constraint on active canonical marketing requests per property per workspace.

BEGIN;

-- 1. Assert zero active property conflicts remain before attempting index creation
DO $$
DECLARE
  active_duplicates INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_duplicates
  FROM (
    SELECT workspace_id, normalized_property_key
    FROM canonical_marketing_requests
    WHERE is_archived = FALSE 
      AND status NOT IN ('completed', 'merged', 'archived')
      AND normalized_property_key IS NOT NULL 
      AND normalized_property_key != ''
      AND normalized_property_key != 'address pending'
    GROUP BY workspace_id, normalized_property_key
    HAVING COUNT(*) > 1
  ) dups;

  IF active_duplicates > 0 THEN
    RAISE EXCEPTION 'Cannot create unique index: Found % active property duplicate groups. Reconcile or archive duplicate active containers first.', active_duplicates;
  END IF;
END $$;

-- 2. Create the Partial Unique Index
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_canonical_mkt_req_prop 
ON canonical_marketing_requests(workspace_id, normalized_property_key) 
WHERE is_archived = FALSE 
  AND status NOT IN ('completed', 'merged', 'archived') 
  AND normalized_property_key IS NOT NULL 
  AND normalized_property_key != ''
  AND normalized_property_key != 'address pending';

COMMIT;
