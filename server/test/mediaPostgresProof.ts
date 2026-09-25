/** Explicit opt-in integration proof; requires a newly created disposable local database. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import crypto from 'node:crypto';

const url = new URL(process.env.DATABASE_URL || 'http://invalid');
if (url.hostname !== '127.0.0.1' || !/^\/codex_nora_media_[a-z0-9_]+$/.test(url.pathname) || process.env.NODE_ENV !== 'test') {
  throw new Error('Only a dedicated codex_nora_media_* database on 127.0.0.1 is allowed.');
}
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const scratch = path.join(repo, 'work/media-tests', url.pathname.slice(1));
fs.mkdirSync(scratch, { recursive: true });
process.chdir(scratch);
const pool = new pg.Pool({ connectionString: url.href, max: 1 });
const scope = { workspaceId: 'ws_a', taskId: 'task_a' };
const phase = process.argv[2];
const report: string[] = [];
try {
  if (phase === 'schema') {
    await pool.query(`CREATE TABLE durable_uploaded_assets (
      id VARCHAR(100) PRIMARY KEY, filename VARCHAR(255) NOT NULL, content_type VARCHAR(100) NOT NULL,
      size_bytes BIGINT NOT NULL, sha256_checksum VARCHAR(64) NOT NULL, data_base64 TEXT NOT NULL,
      storage_driver VARCHAR(50) DEFAULT 'database', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), metadata JSONB);
      CREATE TABLE asset_download_tokens (
        token VARCHAR(100) PRIMARY KEY, asset_id VARCHAR(100) NOT NULL REFERENCES durable_uploaded_assets(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL, task_id VARCHAR(100), expires_at TIMESTAMPTZ, is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
        revoked_at TIMESTAMPTZ, revoked_by VARCHAR(255), download_count INTEGER NOT NULL DEFAULT 0,
        last_downloaded_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
      CREATE TABLE canonical_marketing_tasks (id VARCHAR(100) PRIMARY KEY, workspace_id VARCHAR(100), photos JSONB, attachments JSONB, proof_url TEXT);`);
    const legacy = Buffer.from('legacy saved photo');
    for (const filename of ['legacy.jpg', 'ambiguous.jpg']) {
      await pool.query('INSERT INTO durable_uploaded_assets (id,filename,content_type,size_bytes,sha256_checksum,data_base64) VALUES ($1,$2,$3,$4,$5,$6)',
        [filename, filename, 'image/jpeg', legacy.length, crypto.createHash('sha256').update(legacy).digest('hex'), legacy.toString('base64')]);
    }
    await pool.query(`INSERT INTO canonical_marketing_tasks (id,workspace_id,photos) VALUES
      ('legacy_task','ws_a','[{"url":"/uploads/legacy.jpg"},{"url":"/uploads/ambiguous.jpg"}]'),
      ('other_task','ws_b','[{"url":"/uploads/ambiguous.jpg"}]')`);
    const migration = fs.readFileSync(path.join(repo, 'server/db/migrations/20260925160000_scoped_media_and_download_tokens.sql'), 'utf8');
    await pool.query(migration);
    await pool.query(migration);
    const rows = (await pool.query('SELECT filename,workspace_id FROM durable_uploaded_assets ORDER BY filename')).rows;
    assert.deepEqual(rows, [{ filename: 'ambiguous.jpg', workspace_id: null }, { filename: 'legacy.jpg', workspace_id: 'ws_a' }]);
    report.push('Real PostgreSQL migration executes twice; legacy ownership backfills only unambiguously');
  } else {
    const media = await import('../persistence/durableAssetRepository.js');
    const repositories = await import('../persistence/repositories.js');
    try {
      if (phase === 'write') {
        const asset = await media.saveDurableAssetAsync({ ...scope, filename: 'proof.pdf', contentType: 'application/pdf', buffer: Buffer.from('APPROVED_VERSION_ONE') });
        const other = await media.saveDurableAssetAsync({ workspaceId: 'ws_b', taskId: 'task_b', filename: 'proof.pdf', contentType: 'application/pdf', buffer: Buffer.from('OTHER_TENANT') });
        assert.notEqual(asset.storageFilename, other.storageFilename);
        const token = await media.createAssetDownloadTokenAsync({ ...scope, assetId: asset.id });
        const dbToken = (await pool.query('SELECT token FROM asset_download_tokens')).rows[0].token;
        assert.notEqual(dbToken, token.token);
        assert.equal(dbToken, token.id);
        fs.writeFileSync(path.join(scratch, 'state.json'), JSON.stringify({ asset, other, token }));
        for (const dir of ['public', 'dist']) fs.rmSync(path.join(scratch, dir), { recursive: true, force: true });
        report.push('Real asset and hashed token inserts; both disk caches removed before process exit');
      } else if (phase === 'read') {
        const { asset, other, token } = JSON.parse(fs.readFileSync(path.join(scratch, 'state.json'), 'utf8'));
        assert.equal(fs.existsSync(path.join(scratch, 'public/uploads')), false);
        const recovered = await media.getDurableAssetByIdAsync(asset.id, scope);
        assert.equal(recovered?.dataBase64, Buffer.from('APPROVED_VERSION_ONE').toString('base64'));
        assert.equal(recovered?.id, asset.id);
        assert.equal(recovered?.contentType, 'application/pdf');
        assert.equal(await media.getDurableAssetByIdAsync(asset.id, { workspaceId: 'ws_b' }), null);
        assert.equal(await media.getDurableAssetByFilenameAsync(other.storageFilename, scope), null);
        assert.equal(await media.getDurableAssetByFilenameAsync('ambiguous.jpg', scope), null);
        assert.equal((await media.getDurableAssetByFilenameAsync('legacy.jpg', { workspaceId: 'ws_a' }))?.id, 'legacy.jpg');
        const valid = await media.verifyAndConsumeDownloadTokenAsync(token.token);
        assert.equal(valid.valid, true);
        if (valid.valid) { assert.equal(valid.asset.id, asset.id); assert.equal(valid.tokenRecord.downloadCount, 1); }
        await pool.query('UPDATE asset_download_tokens SET expires_at = NOW() - INTERVAL \'1 second\' WHERE token = $1', [token.id]);
        assert.deepEqual(await media.verifyAndConsumeDownloadTokenAsync(token.token), { valid: false, reason: 'expired' });
        await pool.query('UPDATE asset_download_tokens SET expires_at = NOW() + INTERVAL \'1 hour\' WHERE token = $1', [token.id]);
        assert.equal(await media.revokeDownloadTokenAsync(token.token, 'other tenant', { workspaceId: 'ws_b' }), false);
        assert.equal(await media.revokeDownloadTokenAsync(token.id, 'Melissa', scope), true);
        assert.deepEqual(await media.verifyAndConsumeDownloadTokenAsync(token.token), { valid: false, reason: 'revoked' });
        await pool.query("ALTER TABLE durable_uploaded_assets ADD CONSTRAINT test_insert_failure CHECK (filename <> 'fail.pdf')");
        await assert.rejects(media.saveDurableAssetAsync({ ...scope, filename: 'fail.pdf', contentType: 'application/pdf', buffer: Buffer.from('must fail') }));
        assert.equal(Number((await pool.query("SELECT COUNT(*) AS count FROM durable_uploaded_assets WHERE filename = 'fail.pdf'")).rows[0].count), 0);
        report.push('Fresh process restores exact ID/MIME/bytes; workspace isolation and scoped legacy lookup pass');
        report.push('Persisted bearer survives process reset; expiry, revoke, and cross-tenant denial pass');
        report.push('Real PostgreSQL rejected insert propagates instead of acknowledging success');
      } else if (phase === 'portal') {
        await pool.query(`ALTER TABLE canonical_marketing_tasks
          ADD COLUMN request_id TEXT, ADD COLUMN title TEXT, ADD COLUMN agent_name TEXT,
          ADD COLUMN status TEXT DEFAULT 'in_progress', ADD COLUMN review_state TEXT, ADD COLUMN proof_version INTEGER DEFAULT 1,
          ADD COLUMN review_history JSONB DEFAULT '[]', ADD COLUMN notes TEXT, ADD COLUMN is_archived BOOLEAN DEFAULT FALSE,
          ADD COLUMN routing_snapshot JSONB DEFAULT '{}', ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(),
          ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW(), ADD COLUMN completed_at TIMESTAMPTZ;
          CREATE TABLE canonical_marketing_requests (id TEXT PRIMARY KEY, workspace_id TEXT, photos JSONB DEFAULT '[]',
            status TEXT, is_archived BOOLEAN DEFAULT FALSE, updated_at TIMESTAMPTZ DEFAULT NOW());
          INSERT INTO canonical_marketing_requests (id,workspace_id,status) VALUES ('request_a','ws_a','in_progress'),('request_b','ws_b','in_progress');
          INSERT INTO canonical_marketing_tasks (id,workspace_id,request_id,title,agent_name,status,photos,notes)
            VALUES ('portal_a','ws_a','request_a','Test flyer','Test agent','in_progress','[]','Private staff note'),
                   ('portal_b','ws_b','request_b','Other flyer','Other agent','in_progress','[]','Other private note');`);
        const portal = await import('../services/marketingPortalAccess.js');
        const tracker = await import('../services/taskTrackerService.js');
        const issued = await Promise.all(Array.from({ length: 8 }, () => portal.ensureMarketingPortalToken('portal_a')));
        assert.equal(new Set(issued).size, 1);
        const token = issued[0];
        await Promise.all([
          ...Array.from({ length: 12 }, (_, i) => tracker.appendMarketingTrackerNote(token, `Concurrent note ${i}`)),
          ...Array.from({ length: 4 }, (_, i) => tracker.addMarketingTrackerAsset(token, {
            filename: 'same.jpg', contentType: 'image/jpeg', buffer: Buffer.from(`photo ${i}`),
          })),
          pool.query(`UPDATE canonical_marketing_tasks SET status = 'completed', review_state = 'approved', completed_at = NOW(),
            routing_snapshot = jsonb_set(routing_snapshot, '{delivery}', '{"messageId":"staff_delivery","proofVersion":1}'::jsonb)
            WHERE id = 'portal_a' AND workspace_id = 'ws_a'`),
        ]);
        let task = (await pool.query("SELECT * FROM canonical_marketing_tasks WHERE id = 'portal_a'")).rows[0];
        assert.equal(task.status, 'completed');
        assert.equal(task.review_state, 'approved');
        assert.equal(task.routing_snapshot.delivery.messageId, 'staff_delivery');
        assert.equal(task.routing_snapshot.clientPortal.token, token);
        assert.equal(task.routing_snapshot.clientNotes.length, 12);
        assert.equal(new Set(task.routing_snapshot.clientNotes.map((n: any) => n.content)).size, 12);
        assert.equal(task.photos.length, 4);
        assert.equal(new Set(task.photos.map((p: any) => p.url)).size, 4);
        assert.equal((await pool.query("SELECT photos FROM canonical_marketing_requests WHERE id = 'request_a'")).rows[0].photos.length, 4);
        const other = (await pool.query("SELECT * FROM canonical_marketing_tasks WHERE id = 'portal_b'")).rows[0];
        assert.equal(other.photos.length, 0);
        assert.deepEqual(other.routing_snapshot, {});
        const revised = await tracker.requestMarketingTrackerRevision(token, 'Please change the price.');
        assert.equal(revised.canRequestRevision, false);
        task = (await pool.query("SELECT * FROM canonical_marketing_tasks WHERE id = 'portal_a'")).rows[0];
        assert.equal(task.status, 'in_progress');
        assert.equal(task.review_state, 'awaiting_review');
        assert.equal(task.routing_snapshot.clientNotes.length, 13);
        assert.equal(task.routing_snapshot.delivery.messageId, 'staff_delivery');
        assert.equal(task.photos.length, 4);
        assert.equal(task.review_history[0].action, 'revisions_requested');
        assert.equal(await tracker.requestMarketingTrackerRevision(token, 'Duplicate revision'), null);
        await pool.query("UPDATE canonical_marketing_tasks SET routing_snapshot = jsonb_set(routing_snapshot, '{clientPortal,revokedAt}', to_jsonb(NOW()::text)) WHERE id = 'portal_a'");
        assert.equal(await tracker.appendMarketingTrackerNote(token, 'must not write'), null);
        report.push('Eight concurrent portal issuers return one persisted token');
        report.push('Twelve concurrent notes + four uploads preserve every append, staff completion/delivery, and tenant boundaries');
        report.push('Revision atomically reopens task/request, preserves prior assets/receipt, appends one note, and denies repeat/revoked requests');
      } else throw new Error('Unknown test phase');
    } finally { await repositories.getDbPool()?.end(); }
  }
  console.log(JSON.stringify({ database: url.pathname.slice(1), phase, passed: report }, null, 2));
} finally { await pool.end(); }
