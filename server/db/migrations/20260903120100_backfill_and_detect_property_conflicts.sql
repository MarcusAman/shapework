-- Migration: 20260903120100_backfill_and_detect_property_conflicts.sql
-- Description: Backfill normalized_property_key and detect duplicate active property conflicts.

BEGIN;

-- 1. Backfill workspace_id where null
UPDATE canonical_marketing_requests 
SET workspace_id = 'ws_wilmington' 
WHERE workspace_id IS NULL OR workspace_id = '';

UPDATE canonical_marketing_tasks 
SET workspace_id = 'ws_wilmington' 
WHERE workspace_id IS NULL OR workspace_id = '';

-- 2. Backfill normalized_property_key
UPDATE canonical_marketing_requests
SET normalized_property_key = LOWER(REGEXP_REPLACE(TRIM(COALESCE(property_address, title, '')), '[^a-zA-Z0-9]+', ' ', 'g'))
WHERE (normalized_property_key IS NULL OR normalized_property_key = '')
  AND property_address IS NOT NULL 
  AND property_address != '' 
  AND property_address != 'Address Pending';

-- 3. Duplicate Conflict Audit Block
DO $$
DECLARE
  conflict_count INTEGER;
  conflict_report TEXT;
BEGIN
  SELECT COUNT(*), STRING_AGG(workspace_id || ' : ' || normalized_property_key || ' (Count: ' || cnt || ')', E'\n')
  INTO conflict_count, conflict_report
  FROM (
    SELECT workspace_id, normalized_property_key, COUNT(*) as cnt
    FROM canonical_marketing_requests
    WHERE is_archived = FALSE 
      AND status NOT IN ('completed', 'merged', 'archived')
      AND normalized_property_key IS NOT NULL 
      AND normalized_property_key != ''
      AND normalized_property_key != 'address pending'
    GROUP BY workspace_id, normalized_property_key
    HAVING COUNT(*) > 1
  ) duplicates;

  IF conflict_count > 0 THEN
    RAISE WARNING 'Conflict Preflight Warning: Found % conflicting active property groups:\n%', conflict_count, conflict_report;
  ELSE
    RAISE NOTICE 'Preflight Check Passed: Zero duplicate active property conflicts found.';
  END IF;
END $$;

COMMIT;
