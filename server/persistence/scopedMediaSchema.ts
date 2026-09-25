/** Shared by startup schema initialization and the standalone migration. */
export const SCOPED_MEDIA_SCHEMA_SQL = `
-- Ownership is explicit; unknown or ambiguous historical ownership stays inaccessible.
ALTER TABLE durable_uploaded_assets ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(100);
ALTER TABLE durable_uploaded_assets ADD COLUMN IF NOT EXISTS task_id TEXT;
ALTER TABLE durable_uploaded_assets ADD COLUMN IF NOT EXISTS storage_filename VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS uq_durable_assets_storage_filename
  ON durable_uploaded_assets(storage_filename) WHERE storage_filename IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_durable_assets_workspace_filename
  ON durable_uploaded_assets(workspace_id, filename);
CREATE INDEX IF NOT EXISTS idx_durable_assets_workspace_task
  ON durable_uploaded_assets(workspace_id, task_id);
ALTER TABLE asset_download_tokens ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_asset_tokens_workspace_task
  ON asset_download_tokens(workspace_id, task_id);

UPDATE durable_uploaded_assets SET
  workspace_id = NULLIF(metadata->>'workspaceId', ''),
  task_id = COALESCE(task_id, NULLIF(metadata->>'taskId', ''))
WHERE workspace_id IS NULL AND NULLIF(metadata->>'workspaceId', '') IS NOT NULL;

-- Backfill only assets whose recorded task references identify exactly one workspace.
-- Duplicate original names across tenants are deliberately not guessed or assigned a default tenant.
WITH asset_references AS (
  SELECT DISTINCT a.id AS asset_id, t.workspace_id, t.id AS task_id
  FROM durable_uploaded_assets a
  JOIN canonical_marketing_tasks t ON t.workspace_id IS NOT NULL
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(to_jsonb(t)->'photos') = 'array' THEN to_jsonb(t)->'photos' ELSE '[]'::jsonb END
    || CASE WHEN jsonb_typeof(to_jsonb(t)->'attachments') = 'array' THEN to_jsonb(t)->'attachments' ELSE '[]'::jsonb END
    || jsonb_build_array(jsonb_build_object('url', to_jsonb(t)->>'proof_url'))
  ) ref
  WHERE a.workspace_id IS NULL AND (
    ref->>'assetId' = a.id OR ref->>'id' = a.id OR
    regexp_replace(split_part(COALESCE(ref->>'url',''), '?', 1), '^https?://[^/]+', '') = '/uploads/' || a.filename
  )
), unambiguous_owners AS (
  SELECT asset_id, MIN(workspace_id) AS workspace_id,
    CASE WHEN COUNT(DISTINCT task_id) = 1 THEN MIN(task_id) END AS task_id
  FROM asset_references GROUP BY asset_id HAVING COUNT(DISTINCT workspace_id) = 1
)
UPDATE durable_uploaded_assets a SET workspace_id = owners.workspace_id, task_id = owners.task_id
FROM unambiguous_owners owners WHERE a.id = owners.asset_id AND a.workspace_id IS NULL;

UPDATE asset_download_tokens tokens SET workspace_id = assets.workspace_id
FROM durable_uploaded_assets assets
WHERE tokens.asset_id = assets.id AND tokens.workspace_id IS NULL;
-- Old plaintext/unscoped tokens cannot be carried forward as secure bearer credentials.
UPDATE asset_download_tokens SET is_revoked = TRUE, revoked_at = COALESCE(revoked_at, NOW())
WHERE workspace_id IS NULL OR token !~ '^[a-f0-9]{64}$';
`;
