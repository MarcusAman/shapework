import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pg from 'pg';
import { fileURLToPath } from 'url';

const resolvedFilename = typeof import.meta !== 'undefined' && import.meta.url 
  ? fileURLToPath(import.meta.url) 
  : (typeof __filename !== 'undefined' ? __filename : '');

const resolvedDirname = typeof import.meta !== 'undefined' && import.meta.url 
  ? path.dirname(resolvedFilename) 
  : (typeof __dirname !== 'undefined' ? __dirname : '');

export async function runMigrations(connectionString?: string): Promise<{ success: boolean; appliedCount: number; versions: string[] }> {
  const dbUrl = connectionString || process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not configured for migration runner.');
  }

  const pool = new pg.Pool({ connectionString: dbUrl, max: 2, connectionTimeoutMillis: 10000 });
  const client = await pool.connect();
  const appliedVersions: string[] = [];

  try {
    console.log('[Migration Runner] Acquiring migration transaction and advisory lock...');
    await client.query('BEGIN');
    
    // Acquire PostgreSQL advisory xact lock for exclusive migration execution
    await client.query("SELECT pg_advisory_xact_lock(hashtext('shapework_schema_migrations'))");

    // Ensure schema_migrations ledger exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        applied_by VARCHAR(255) NOT NULL DEFAULT 'shapework_migration_runner',
        execution_time_ms INTEGER NOT NULL DEFAULT 0
      );
    `);

    // Fetch applied migrations
    const existing = await client.query<{ version: string; checksum: string }>(
      'SELECT version, checksum FROM schema_migrations ORDER BY version ASC'
    );
    const appliedMap = new Map(existing.rows.map(r => [r.version, r.checksum]));

    const migrationsDir = path.resolve(resolvedDirname, '../server/db/migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at: ${migrationsDir}`);
    }

    const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    console.log(`[Migration Runner] Found ${migrationFiles.length} migration files in ledger.`);

    for (const file of migrationFiles) {
      const version = file.split('_')[0];
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');

      if (appliedMap.has(version)) {
        const recordedChecksum = appliedMap.get(version);
        if (recordedChecksum !== checksum) {
          console.warn(`[Migration Warning] Checksum mismatch for already-applied migration ${version} (${file}). Expected ${recordedChecksum}, calculated ${checksum}.`);
        }
        continue;
      }

      console.log(`[Migration Runner] Applying migration ${version}: ${file}...`);
      const startTime = Date.now();
      await client.query(sql);
      const durationMs = Date.now() - startTime;

      await client.query(`
        INSERT INTO schema_migrations (version, name, checksum, applied_at, execution_time_ms)
        VALUES ($1, $2, $3, NOW(), $4)
      `, [version, file, checksum, durationMs]);

      appliedVersions.push(version);
      console.log(`[Migration Runner] Successfully applied ${version} in ${durationMs}ms.`);
    }

    await client.query('COMMIT');
    console.log(`[Migration Runner] Migration execution complete. Newly applied: ${appliedVersions.length}.`);
    return { success: true, appliedCount: appliedVersions.length, versions: appliedVersions };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Migration Runner] ERROR during migration execution, transaction rolled back:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Allow direct CLI execution: tsx scripts/migrate.ts
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  runMigrations()
    .then((res) => {
      console.log(`Migration runner finished successfully. Applied: ${res.appliedCount}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration runner failed:', err);
      process.exit(1);
    });
}
