-- Migration Rollback: 20260903120000_canonical_marketing_and_idempotency_schema_down.sql
BEGIN;
DROP INDEX IF EXISTS idx_outbox_queue;
DROP INDEX IF EXISTS idx_outbox_key;
DROP TABLE IF EXISTS outbound_email_outbox;

DROP INDEX IF EXISTS idx_inbound_email_lookup;
DROP INDEX IF EXISTS idx_inbound_email_status;
DROP TABLE IF EXISTS inbound_email_idempotency_log;

DROP INDEX IF EXISTS idx_canonical_mkt_req_ws;
DROP INDEX IF EXISTS idx_canonical_mkt_req_prop_key;
COMMIT;
