/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const LOCAL_DB_PATH = path.join(process.cwd(), 'data', 'db.json');
if (!fs.existsSync(LOCAL_DB_PATH)) {
  console.error(`Error: Local JSON database not found at ${LOCAL_DB_PATH}`);
  process.exit(1);
}

const dbState = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
const pool = new pg.Pool({ connectionString });

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function convertKeysToSnake(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(convertKeysToSnake);
  
  const res = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = camelToSnake(key);
    const val = obj[key];
    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      res[snakeKey] = JSON.stringify(val);
    } else {
      res[snakeKey] = val;
    }
  }
  return res;
}

const TABLE_MAPPINGS = [
  { stateKey: 'workspaces', table: 'workspaces' },
  { stateKey: 'transactions', table: 'transactions' },
  { stateKey: 'tasks', table: 'transaction_checklists' },
  { stateKey: 'workflowTemplates', table: 'workflow_templates' },
  { stateKey: 'opportunities', table: 'opportunities' },
  { stateKey: 'quickWins', table: 'quick_wins' },
  { stateKey: 'buildSprints', table: 'build_sprints' },
  { stateKey: 'workItems', table: 'work_items' },
  { stateKey: 'actionProposals', table: 'approvals' },
  { stateKey: 'auditEvents', table: 'audit_events' },
  { stateKey: 'integrations', table: 'integration_connections' },
  { stateKey: 'responsibilities', table: 'role_ownership' },
  { stateKey: 'operatingRecords', table: 'operating_records' },
  { stateKey: 'pilotSuccessCriteria', table: 'pilot_success_criteria' }
];

async function runMigration() {
  console.log('[Migration] Starting legacy JSON to PostgreSQL migration...');
  
  // 1. Run migrations first
  const migrationPath = path.resolve(process.cwd(), 'server/db/migrations/20260701000000_init_relational.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  await pool.query(sql);
  console.log('[Migration] Table structure migrations initialized.');

  // 2. Migrate workspaces
  if (dbState.workspaces) {
    console.log(`[Migration] Migrating ${dbState.workspaces.length} workspaces...`);
    for (const ws of dbState.workspaces) {
      const dbRow = convertKeysToSnake(ws);
      const keys = Object.keys(dbRow);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      await pool.query(
        `INSERT INTO workspaces (${keys.join(', ')}) 
         VALUES (${placeholders}) 
         ON CONFLICT (id) DO UPDATE SET ${keys.map((k, i) => `${k} = $${i + 1}`).join(', ')}`,
        Object.values(dbRow)
      );
    }
  }

  // 3. Migrate Users & Memberships
  if (dbState.workspaceUsers) {
    console.log(`[Migration] Migrating ${dbState.workspaceUsers.length} workspace users & memberships...`);
    for (const wu of dbState.workspaceUsers) {
      // Create user
      const userRow = convertKeysToSnake({
        id: wu.id,
        email: wu.email,
        name: wu.name,
        passwordHash: null,
        status: wu.status || 'active'
      });
      const uKeys = Object.keys(userRow);
      const uPlaceholders = uKeys.map((_, i) => `$${i + 1}`).join(', ');
      await pool.query(
        `INSERT INTO users (${uKeys.join(', ')}) 
         VALUES (${uPlaceholders}) 
         ON CONFLICT (id) DO UPDATE SET ${uKeys.map((k, i) => `${k} = $${i + 1}`).join(', ')}`,
        Object.values(userRow)
      );

      // Create membership
      if (wu.workspaceId) {
        const memRow = convertKeysToSnake({
          id: `m_${wu.id}_${wu.workspaceId}`,
          workspaceId: wu.workspaceId,
          userId: wu.id,
          role: wu.role,
          permissions: wu.permissions || []
        });
        const mKeys = Object.keys(memRow);
        const mPlaceholders = mKeys.map((_, i) => `$${i + 1}`).join(', ');
        await pool.query(
          `INSERT INTO workspace_memberships (${mKeys.join(', ')}) 
           VALUES (${mPlaceholders}) 
           ON CONFLICT (workspace_id, user_id) DO UPDATE SET ${mKeys.map((k, i) => `${k} = $${i + 1}`).join(', ')}`,
          Object.values(memRow)
        );
      }
    }
  }

  // 4. Migrate direct tables
  for (const mapping of TABLE_MAPPINGS) {
    const list = dbState[mapping.stateKey];
    if (!list || !Array.isArray(list) || list.length === 0) continue;

    console.log(`[Migration] Migrating ${list.length} records to ${mapping.table}...`);
    for (const item of list) {
      if (!item.id) continue;
      const dbRow = convertKeysToSnake(item);
      const keys = Object.keys(dbRow);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      await pool.query(
        `INSERT INTO ${mapping.table} (${keys.join(', ')}) 
         VALUES (${placeholders}) 
         ON CONFLICT (id) DO UPDATE SET ${keys.map((k, i) => `${k} = $${i + 1}`).join(', ')}`,
        Object.values(dbRow)
      );
    }
  }

  console.log('[Migration] Legacy JSON migration completed successfully.');
  await pool.end();
}

runMigration().catch(err => {
  console.error('[Migration] Failed to execute JSON data migration:', err);
  process.exit(1);
});
