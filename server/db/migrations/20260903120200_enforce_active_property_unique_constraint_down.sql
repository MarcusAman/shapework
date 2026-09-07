-- Migration Rollback: 20260903120200_enforce_active_property_unique_constraint_down.sql
BEGIN;
DROP INDEX IF EXISTS uq_active_canonical_mkt_req_prop;
COMMIT;
