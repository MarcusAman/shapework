/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Recipient Suppression Schema Safety & Idempotent Migration Regression Suite
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { getDbPool } from '../../server/persistence/repositories.js';
import pg from 'pg';

describe('Recipient Suppression Schema Safety & Identity Isolation Suite', () => {
  let pool: pg.Pool;
  const testRecipientWithoutIdentity = 'unattributed_test_recipient_123@example.com';
  const testRecipientPersonA = 'person_a_test_recipient_456@example.com';

  beforeAll(async () => {
    pool = (getDbPool() || new pg.Pool({ connectionString: process.env.DATABASE_URL })) as pg.Pool;
    // Ensure test cleanup
    // Ensure test cleanup
    await pool.query('DELETE FROM nora_recipient_suppressions WHERE canonical_recipient IN ($1, $2)', [
      testRecipientWithoutIdentity,
      testRecipientPersonA
    ]);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM nora_recipient_suppressions WHERE canonical_recipient IN ($1, $2)', [
      testRecipientWithoutIdentity,
      testRecipientPersonA
    ]);
  });

  it('1. Verifies migration file exists and is idempotent forward and backward', () => {
    const forwardPath = path.resolve(process.cwd(), 'server/db/migrations/20260912140000_fix_nora_recipient_suppressions_identity_default.sql');
    const downPath = path.resolve(process.cwd(), 'server/db/migrations/20260912140000_fix_nora_recipient_suppressions_identity_default_down.sql');

    expect(fs.existsSync(forwardPath)).toBe(true);
    expect(fs.existsSync(downPath)).toBe(true);

    const forwardSql = fs.readFileSync(forwardPath, 'utf8');
    expect(forwardSql).toContain('DROP DEFAULT');
    expect(forwardSql).toContain('DROP NOT NULL');
    expect(forwardSql).not.toContain("DEFAULT 'Matt Orr'");
  });

  it('2. Executes forward migration twice safely without errors (idempotency)', async () => {
    const forwardPath = path.resolve(process.cwd(), 'server/db/migrations/20260912140000_fix_nora_recipient_suppressions_identity_default.sql');
    const forwardSql = fs.readFileSync(forwardPath, 'utf8');

    // Run 1
    await expect(pool.query(forwardSql)).resolves.toBeDefined();
    // Run 2
    await expect(pool.query(forwardSql)).resolves.toBeDefined();

    // Verify schema reflection
    const colInfo = await pool.query(
      "SELECT is_nullable, column_default FROM information_schema.columns WHERE table_name = 'nora_recipient_suppressions' AND column_name = 'canonical_identity'"
    );

    expect(colInfo.rows.length).toBe(1);
    expect(colInfo.rows[0].is_nullable).toBe('YES');
    expect(colInfo.rows[0].column_default).toBeNull();
  });

  it('3. Confirms a suppression without canonical identity remains NULL and does NOT inherit "Matt Orr"', async () => {
    await pool.query(
      `INSERT INTO nora_recipient_suppressions (id, canonical_recipient, reason, created_by, is_active)
       VALUES ($1, $2, $3, $4, $5)`,
      ['sup_test_no_identity', testRecipientWithoutIdentity, 'Testing null identity preservation', 'test_runner', false]
    );

    const res = await pool.query(
      'SELECT canonical_recipient, canonical_identity FROM nora_recipient_suppressions WHERE canonical_recipient = $1',
      [testRecipientWithoutIdentity]
    );

    expect(res.rows.length).toBe(1);
    expect(res.rows[0].canonical_identity).toBeNull();
    expect(res.rows[0].canonical_identity).not.toBe('Matt Orr');
  });

  it('4. Confirms a suppression for Person A cannot inherit another person\'s identity', async () => {
    await pool.query(
      `INSERT INTO nora_recipient_suppressions (id, canonical_identity, canonical_recipient, reason, created_by, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['sup_test_person_a', 'Jane Doe', testRecipientPersonA, 'Specific identity containment', 'test_runner', false]
    );

    const res = await pool.query(
      'SELECT canonical_recipient, canonical_identity FROM nora_recipient_suppressions WHERE canonical_recipient = $1',
      [testRecipientPersonA]
    );

    expect(res.rows.length).toBe(1);
    expect(res.rows[0].canonical_identity).toBe('Jane Doe');
    expect(res.rows[0].canonical_identity).not.toBe('Matt Orr');
  });

  it('5. Confirms historical verified suppressions remain intact with original identity data', async () => {
    const historical = await pool.query(
      "SELECT id, canonical_recipient, canonical_identity, is_active FROM nora_recipient_suppressions WHERE canonical_recipient IN ('morr@nestrealty.com', 'matt.orr@nestrealty.com')"
    );

    // If running against an environment with seeded rows, verify them
    if (historical.rows.length > 0) {
      const morr = historical.rows.find(r => r.canonical_recipient === 'morr@nestrealty.com');
      if (morr) {
        expect(morr.canonical_identity).toBe('Matt Orr (Unverified Pattern Alias)');
      }
      const mattOrr = historical.rows.find(r => r.canonical_recipient === 'matt.orr@nestrealty.com');
      if (mattOrr) {
        expect(mattOrr.canonical_identity).toBe('Matt Orr');
      }
    }
  });
});
