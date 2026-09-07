BEGIN;

ALTER TABLE canonical_marketing_tasks
  DROP COLUMN IF EXISTS requirements,
  DROP COLUMN IF EXISTS internal_flags;

COMMIT;
