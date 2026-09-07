-- Rollback: 20260904120000_notification_preferences_and_canonical_staff_coverage_down.sql

BEGIN;

DROP TABLE IF EXISTS user_notification_preferences CASCADE;
DROP TABLE IF EXISTS operations_directory_staff CASCADE;

ALTER TABLE canonical_marketing_tasks
  DROP COLUMN IF EXISTS assigned_to_id,
  DROP COLUMN IF EXISTS review_owner_id,
  DROP COLUMN IF EXISTS review_owner_name,
  DROP COLUMN IF EXISTS covering_staff_id,
  DROP COLUMN IF EXISTS covering_staff_name,
  DROP COLUMN IF EXISTS coverage_history,
  DROP COLUMN IF EXISTS review_state,
  DROP COLUMN IF EXISTS proof_version,
  DROP COLUMN IF EXISTS proof_history,
  DROP COLUMN IF EXISTS review_history;

ALTER TABLE canonical_marketing_requests
  DROP COLUMN IF EXISTS created_by_id,
  DROP COLUMN IF EXISTS created_by_name,
  DROP COLUMN IF EXISTS on_behalf_of;

COMMIT;
