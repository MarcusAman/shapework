/** In-process SQL boundary fake: never constructs pg.Pool or opens a socket. */
export function createMediaDatabaseFake() {
  const assets = new Map<string, any>();
  const tokens = new Map<string, any>();
  const calls: Array<{ sql: string; values: any[] }> = [];
  let insertFailure = false;
  const query = async (sql: string, values: any[] = []) => {
    calls.push({ sql, values });
    const q = sql.replace(/\s+/g, ' ').trim();
    if (q.startsWith('INSERT INTO durable_uploaded_assets')) {
      if (insertFailure) throw new Error('database unavailable');
      const [id, filename, storage_filename, workspace_id, task_id, content_type, size_bytes, sha256_checksum, data_base64, created_at, metadata] = values;
      assets.set(id, { id, filename, storage_filename, workspace_id, task_id, content_type, size_bytes, sha256_checksum, data_base64, created_at, metadata: JSON.parse(metadata) });
      return { rows: [], rowCount: 1 };
    }
    if (q.startsWith('SELECT * FROM durable_uploaded_assets')) {
      const [workspace, task, value] = values;
      const byId = q.includes('AND id = $3');
      const rows = [...assets.values()].filter(a => a.workspace_id === workspace && (!task || !a.task_id || a.task_id === task)
        && (byId ? a.id === value : a.storage_filename === value || a.filename === value));
      return { rows: rows.slice(0, 2) };
    }
    if (q.startsWith('INSERT INTO asset_download_tokens')) {
      if (insertFailure) throw new Error('database unavailable');
      const [token, asset_id, filename, workspace_id, task_id, expires_at, created_at] = values;
      tokens.set(token, { token, asset_id, filename, workspace_id, task_id, expires_at, created_at, is_revoked: false, download_count: 0 });
      return { rows: [], rowCount: 1 };
    }
    if (q.startsWith('SELECT * FROM asset_download_tokens WHERE token')) {
      return { rows: tokens.has(values[0]) ? [{ ...tokens.get(values[0]) }] : [] };
    }
    if (q.startsWith('SELECT * FROM asset_download_tokens WHERE workspace_id')) {
      return { rows: [...tokens.values()].filter(t => t.workspace_id === values[0] && t.task_id === values[1]).map(t => ({ ...t })) };
    }
    if (q.startsWith('UPDATE asset_download_tokens SET download_count')) {
      const token = tokens.get(values[0]);
      if (!token || token.workspace_id !== values[1] || token.is_revoked || Date.parse(token.expires_at) <= Date.now()) return { rows: [] };
      token.download_count++;
      return { rows: [{ ...token }] };
    }
    if (q.startsWith('UPDATE asset_download_tokens SET is_revoked')) {
      const token = tokens.get(values[0]);
      if (!token || token.workspace_id !== values[1] || (values[3] && token.task_id !== values[3])) return { rows: [] };
      token.is_revoked = true;
      token.revoked_at = new Date().toISOString();
      token.revoked_by = values[2];
      return { rows: [{ token: token.token }] };
    }
    throw new Error(`Unsupported test SQL: ${q}`);
  };
  return { pool: { query }, assets, tokens, calls, failInserts: () => { insertFailure = true; } };
}
