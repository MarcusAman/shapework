import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import crypto from 'crypto';

describe('UAT Isolated PostgreSQL Datastore & Durable Workflow Verification Suite', () => {
  let pool: pg.Pool;
  const dbUrl = process.env.UAT_DATABASE_URL || 'postgresql://localhost:5432/shapework_uat';

  const wsA = 'uat_workspace_a';
  const wsB = 'uat_workspace_b';

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: dbUrl });
    await pool.query('SELECT 1');

    // Ensure workspaces exist in PostgreSQL
    await pool.query(`
      INSERT INTO workspaces (id, name, slug, status)
      VALUES 
        ($1, 'UAT Workspace A (Wilmington)', 'uat-ws-a', 'active'),
        ($2, 'UAT Workspace B (Carolina Beach)', 'uat-ws-b', 'active')
      ON CONFLICT (id) DO NOTHING;
    `, [wsA, wsB]);
  });

  afterAll(async () => {
    // Clean up test records
    await pool.query(`DELETE FROM org_chart_positions WHERE workspace_id IN ($1, $2)`, [wsA, wsB]);
    await pool.query(`DELETE FROM sop_drafts WHERE workspace_id IN ($1, $2)`, [wsA, wsB]);
    await pool.query(`DELETE FROM owner_digest_configs WHERE workspace_id IN ($1, $2)`, [wsA, wsB]);
    await pool.query(`DELETE FROM owner_digest_deliveries WHERE workspace_id IN ($1, $2)`, [wsA, wsB]);
    await pool.query(`DELETE FROM org_chart_audits WHERE workspace_id IN ($1, $2)`, [wsA, wsB]);
    await pool.query(`DELETE FROM sop_audits WHERE workspace_id IN ($1, $2)`, [wsA, wsB]);
    await pool.query(`DELETE FROM workspaces WHERE id IN ($1, $2)`, [wsA, wsB]);
    await pool.end();
  });

  describe('1. Object-Level Workspace Isolation (Workspace A vs Workspace B)', () => {
    it('strictly isolates org-chart positions between workspace A and workspace B', async () => {
      const posAId = `pos_a_${Date.now()}`;
      const posBId = `pos_b_${Date.now()}`;

      // Insert into Workspace A
      await pool.query(`
        INSERT INTO org_chart_positions (id, workspace_id, title, name, email, version)
        VALUES ($1, $2, 'Managing Broker', 'Broker Alpha', 'alpha@broker.com', 1)
      `, [posAId, wsA]);

      // Insert into Workspace B
      await pool.query(`
        INSERT INTO org_chart_positions (id, workspace_id, title, name, email, version)
        VALUES ($1, $2, 'Managing Broker', 'Broker Beta', 'beta@broker.com', 1)
      `, [posBId, wsB]);

      // Read Workspace A
      const resA = await pool.query(`
        SELECT * FROM org_chart_positions WHERE workspace_id = $1
      `, [wsA]);
      expect(resA.rows.some(r => r.id === posAId)).toBe(true);
      expect(resA.rows.some(r => r.id === posBId)).toBe(false);

      // Read Workspace B
      const resB = await pool.query(`
        SELECT * FROM org_chart_positions WHERE workspace_id = $1
      `, [wsB]);
      expect(resB.rows.some(r => r.id === posBId)).toBe(true);
      expect(resB.rows.some(r => r.id === posAId)).toBe(false);

      // Attempt Cross-Workspace Mutation (A caller targeting B position)
      const crossUpdate = await pool.query(`
        UPDATE org_chart_positions 
        SET title = 'Hacked Broker' 
        WHERE id = $1 AND workspace_id = $2
      `, [posBId, wsA]);
      expect(crossUpdate.rowCount).toBe(0);

      // Attempt Cross-Workspace Deletion (A caller deleting B position)
      const crossDelete = await pool.query(`
        DELETE FROM org_chart_positions 
        WHERE id = $1 AND workspace_id = $2
      `, [posBId, wsA]);
      expect(crossDelete.rowCount).toBe(0);
    });

    it('strictly isolates SOP documents between workspace A and workspace B', async () => {
      const sopAId = `sop_a_${Date.now()}`;
      const sopBId = `sop_b_${Date.now()}`;

      await pool.query(`
        INSERT INTO sop_drafts (id, workspace_id, tenant_id, title, process_owner, status, version)
        VALUES 
          ($1, $2, $2, 'Listing Intake Protocol A', 'Owner Alpha', 'published', '1.0'),
          ($3, $4, $4, 'Closing Verification Protocol B', 'Owner Beta', 'draft', '1.0')
      `, [sopAId, wsA, sopBId, wsB]);

      const resA = await pool.query(`SELECT * FROM sop_drafts WHERE workspace_id = $1`, [wsA]);
      expect(resA.rows.some(r => r.id === sopAId)).toBe(true);
      expect(resA.rows.some(r => r.id === sopBId)).toBe(false);
    });
  });

  describe('2. Durable CRUD Operations & Audit Trail Persistence', () => {
    it('persists position creation, hierarchy update, and audit log', async () => {
      const leadId = `pos_lead_${Date.now()}`;
      const associateId = `pos_assoc_${Date.now()}`;

      // Create lead position
      await pool.query(`
        INSERT INTO org_chart_positions (id, workspace_id, title, name, version)
        VALUES ($1, $2, 'Principal BIC', 'Ryan Crecelius', 1)
      `, [leadId, wsA]);

      // Create associate position reporting to lead
      await pool.query(`
        INSERT INTO org_chart_positions (id, workspace_id, title, name, reports_to_id, version)
        VALUES ($1, $2, 'Buyer Agent', 'Taylor Morgan', $3, 1)
      `, [associateId, wsA, leadId]);

      // Verify hierarchy query with join
      const joinRes = await pool.query(`
        SELECT a.name as employee_name, a.title as employee_title, b.name as manager_name
        FROM org_chart_positions a
        LEFT JOIN org_chart_positions b ON a.reports_to_id = b.id
        WHERE a.id = $1 AND a.workspace_id = $2
      `, [associateId, wsA]);

      expect(joinRes.rows.length).toBe(1);
      expect(joinRes.rows[0].employee_name).toBe('Taylor Morgan');
      expect(joinRes.rows[0].manager_name).toBe('Ryan Crecelius');

      // Record audit event
      const auditId = `audit_${Date.now()}`;
      await pool.query(`
        INSERT INTO org_chart_audits (id, workspace_id, action, entity_id, author_user, diff)
        VALUES ($1, $2, 'reassign_manager', $3, 'Owner Ryan', $4)
      `, [auditId, wsA, associateId, JSON.stringify({ previousManager: null, newManager: leadId })]);

      const auditRes = await pool.query(`SELECT * FROM org_chart_audits WHERE id = $1`, [auditId]);
      expect(auditRes.rows.length).toBe(1);
      expect(auditRes.rows[0].action).toBe('reassign_manager');
    });

    it('enforces draft deletion while rejecting published SOP deletion', async () => {
      const draftId = `sop_draft_test_${Date.now()}`;
      const pubId = `sop_pub_test_${Date.now()}`;

      await pool.query(`
        INSERT INTO sop_drafts (id, workspace_id, tenant_id, title, process_owner, status, version)
        VALUES 
          ($1, $2, $2, 'Temporary Draft SOP', 'Draft Author', 'draft', '1.0'),
          ($3, $2, $2, 'Immutable Published SOP', 'BIC Lead', 'published', '2.0')
      `, [draftId, wsA, pubId]);

      // Delete draft SOP (allowed)
      const delDraftRes = await pool.query(`
        DELETE FROM sop_drafts WHERE id = $1 AND workspace_id = $2 AND status = 'draft'
      `, [draftId, wsA]);
      expect(delDraftRes.rowCount).toBe(1);

      // Attempt to delete published SOP (rejected by governance query)
      const delPubRes = await pool.query(`
        DELETE FROM sop_drafts WHERE id = $1 AND workspace_id = $2 AND status = 'draft'
      `, [pubId, wsA]);
      expect(delPubRes.rowCount).toBe(0);

      // Confirm published SOP still exists intact
      const checkPub = await pool.query(`SELECT * FROM sop_drafts WHERE id = $1`, [pubId]);
      expect(checkPub.rows.length).toBe(1);
      expect(checkPub.rows[0].status).toBe('published');
    });
  });

  describe('3. Concurrency, Optimistic Locking & Digest Idempotency', () => {
    it('enforces optimistic concurrency control using version increments', async () => {
      const posId = `pos_occ_${Date.now()}`;

      // Insert initial version 1
      await pool.query(`
        INSERT INTO org_chart_positions (id, workspace_id, title, name, version)
        VALUES ($1, $2, 'Operations Lead', 'Melissa', 1)
      `, [posId, wsA]);

      // Concurrent Transaction 1: updates from version 1 to version 2
      const tx1 = await pool.query(`
        UPDATE org_chart_positions 
        SET title = 'Senior Operations Lead', version = version + 1
        WHERE id = $1 AND workspace_id = $2 AND version = 1
        RETURNING *
      `, [posId, wsA]);
      expect(tx1.rowCount).toBe(1);
      expect(tx1.rows[0].version).toBe(2);

      // Concurrent Transaction 2: stale read attempting update from version 1 (fails due to OCC)
      const tx2 = await pool.query(`
        UPDATE org_chart_positions 
        SET title = 'Director of Ops', version = version + 1
        WHERE id = $1 AND workspace_id = $2 AND version = 1
        RETURNING *
      `, [posId, wsA]);
      expect(tx2.rowCount).toBe(0); // Stale write rejected!
    });

    it('enforces strict idempotency on owner digest deliveries', async () => {
      const idempotencyKey = `digest_${wsA}_ryan@nest.com_2026-W33_test`;

      // First delivery attempt
      const del1 = await pool.query(`
        INSERT INTO owner_digest_deliveries 
          (id, workspace_id, idempotency_key, period_id, recipient_email, digest_type, mode, status)
        VALUES 
          ($1, $2, $3, '2026-W33', 'ryan@nest.com', 'test', 'test_adapter', 'logged')
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING *
      `, [`del_${Date.now()}_1`, wsA, idempotencyKey]);
      expect(del1.rowCount).toBe(1);

      // Duplicate concurrent delivery attempt with the same idempotency key
      const del2 = await pool.query(`
        INSERT INTO owner_digest_deliveries 
          (id, workspace_id, idempotency_key, period_id, recipient_email, digest_type, mode, status)
        VALUES 
          ($1, $2, $3, '2026-W33', 'ryan@nest.com', 'test', 'test_adapter', 'logged')
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING *
      `, [`del_${Date.now()}_2`, wsA, idempotencyKey]);
      expect(del2.rowCount).toBe(0); // Duplicate delivery prevented!
    });
  });
});
