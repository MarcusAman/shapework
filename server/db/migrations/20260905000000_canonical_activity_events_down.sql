-- Migration: 20260905000000_canonical_activity_events_down.sql
BEGIN;
DROP TABLE IF EXISTS canonical_activity_events CASCADE;
COMMIT;
