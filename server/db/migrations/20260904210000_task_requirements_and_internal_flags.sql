-- Migration: 20260904210000_task_requirements_and_internal_flags.sql
-- Description: Additive schema for canonical task requirements checklist and internal escalation flags.

BEGIN;

ALTER TABLE canonical_marketing_tasks
  ADD COLUMN IF NOT EXISTS requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS internal_flags JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMIT;
