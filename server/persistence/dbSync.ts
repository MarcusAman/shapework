/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { convertKeysToSnake, convertKeysToCamel } from './databaseRepositories';
import crypto from 'crypto';

const resolvedFilename = typeof import.meta !== 'undefined' && import.meta.url 
  ? fileURLToPath(import.meta.url) 
  : (typeof __filename !== 'undefined' ? __filename : '');

const resolvedDirname = typeof import.meta !== 'undefined' && import.meta.url 
  ? path.dirname(resolvedFilename) 
  : (typeof __dirname !== 'undefined' ? __dirname : '');

// Run database schema migrations
export async function initDatabaseSchema(pool: pg.Pool) {
  try {
    const migrationPath = path.resolve(resolvedDirname, '../db/migrations/20260701000000_init_relational.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    await pool.query(sql);

    // Create brokerage entry points table dynamically and alter work_items columns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS brokerage_entry_points (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        type VARCHAR(100) NOT NULL,
        source_system VARCHAR(100) NOT NULL,
        source_record_id VARCHAR(100),
        related_transaction_id VARCHAR(100) REFERENCES transactions(id) ON DELETE SET NULL,
        related_marketing_request_id VARCHAR(100),
        related_person_id VARCHAR(100),
        received_at VARCHAR(100) NOT NULL,
        created_by VARCHAR(100),
        assigned_owner_role VARCHAR(100),
        backup_owner_role VARCHAR(100),
        requires_review BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(256) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        requested_ip VARCHAR(100),
        user_agent TEXT
      );

      CREATE TABLE IF NOT EXISTS quickbooks_connections (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        realm_id VARCHAR(100) NOT NULL,
        environment VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        encrypted_access_token TEXT NOT NULL,
        encrypted_refresh_token TEXT NOT NULL,
        access_token_expires_at VARCHAR(100) NOT NULL,
        refresh_token_expires_at VARCHAR(100),
        connected_by_user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        connected_at VARCHAR(100) NOT NULL,
        last_synced_at VARCHAR(100),
        last_error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS finance_signals (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        source_system VARCHAR(50) NOT NULL,
        source_record_id VARCHAR(100) NOT NULL,
        signal_type VARCHAR(100) NOT NULL,
        related_transaction_id VARCHAR(100) REFERENCES transactions(id) ON DELETE SET NULL,
        amount NUMERIC(15, 2),
        counterparty VARCHAR(255),
        date VARCHAR(100),
        status VARCHAR(50) NOT NULL,
        summary TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE work_items 
      ADD COLUMN IF NOT EXISTS backup_owner_role VARCHAR(100),
      ADD COLUMN IF NOT EXISTS source_system VARCHAR(100);

      CREATE TABLE IF NOT EXISTS basecamp_connections (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        account_id VARCHAR(100) NOT NULL,
        account_name VARCHAR(255),
        status VARCHAR(50) NOT NULL,
        encrypted_access_token TEXT NOT NULL,
        encrypted_refresh_token TEXT NOT NULL,
        access_token_expires_at VARCHAR(100),
        refresh_token_expires_at VARCHAR(100),
        connected_by_user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        connected_at VARCHAR(100) NOT NULL,
        last_synced_at VARCHAR(100),
        last_error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS basecamp_signals (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        source_system VARCHAR(50) NOT NULL,
        source_record_id VARCHAR(100) NOT NULL,
        source_project_id VARCHAR(100),
        source_url TEXT,
        signal_type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        summary TEXT NOT NULL,
        assigned_person_name VARCHAR(255),
        due_date VARCHAR(100),
        status VARCHAR(50) NOT NULL,
        created_at VARCHAR(100) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS workspace_integration_connections (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        provider VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        connected_by_user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        connected_at VARCHAR(100) NOT NULL,
        disconnected_at VARCHAR(100),
        provider_account_id VARCHAR(100),
        provider_account_email VARCHAR(255),
        tenant_id VARCHAR(100),
        scopes TEXT[] NOT NULL,
        encrypted_access_token TEXT NOT NULL,
        encrypted_refresh_token TEXT,
        access_token_expires_at VARCHAR(100),
        refresh_token_expires_at VARCHAR(100),
        last_synced_at VARCHAR(100),
        last_error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS workspace_communication_signals (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        provider VARCHAR(50) NOT NULL,
        source_record_id VARCHAR(100) NOT NULL,
        source_url TEXT,
        signal_type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        summary TEXT NOT NULL,
        related_person_email VARCHAR(255),
        related_staff_member_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
        due_date VARCHAR(100),
        status VARCHAR(50) NOT NULL,
        created_at VARCHAR(100) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS external_action_approvals (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        provider VARCHAR(50) NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        proposed_payload TEXT NOT NULL,
        status VARCHAR(50) NOT NULL,
        requested_by VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        approved_by VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
        created_at VARCHAR(100) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS attention_states (
        id VARCHAR(100) PRIMARY KEY,
        work_item_id VARCHAR(100) NOT NULL,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL,
        snoozed_until VARCHAR(100),
        last_presented_at VARCHAR(100),
        last_action_at VARCHAR(100),
        dismissed_count INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS signals (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        source_type VARCHAR(50) NOT NULL,
        source_name VARCHAR(255) NOT NULL,
        signal_type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        summary TEXT NOT NULL,
        safe_payload_summary TEXT NOT NULL,
        raw_payload_ref VARCHAR(255),
        linked_entity_type VARCHAR(100),
        linked_entity_id VARCHAR(100),
        received_at VARCHAR(100) NOT NULL,
        created_at VARCHAR(100) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS decisions (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        signal_id VARCHAR(100) NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
        decision_type VARCHAR(50) NOT NULL,
        confidence NUMERIC(5, 2) NOT NULL,
        owner_worthy BOOLEAN NOT NULL DEFAULT FALSE,
        human_review_required BOOLEAN NOT NULL DEFAULT FALSE,
        rules_triggered TEXT[] NOT NULL,
        rationale_summary TEXT NOT NULL,
        assigned_role VARCHAR(100) NOT NULL,
        created_at VARCHAR(100) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS shapework_jobs (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        signal_id VARCHAR(100) REFERENCES signals(id) ON DELETE SET NULL,
        decision_id VARCHAR(100) REFERENCES decisions(id) ON DELETE SET NULL,
        requested_by VARCHAR(255) NOT NULL,
        request_text TEXT NOT NULL,
        workflow_key VARCHAR(100) NOT NULL,
        workflow_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        source_context TEXT,
        confidence NUMERIC(5, 2) NOT NULL,
        current_step VARCHAR(255),
        human_review_required BOOLEAN NOT NULL DEFAULT FALSE,
        owner_worthy BOOLEAN NOT NULL DEFAULT FALSE,
        created_at VARCHAR(100) NOT NULL,
        updated_at VARCHAR(100) NOT NULL,
        completed_at VARCHAR(100)
      );

      CREATE TABLE IF NOT EXISTS shapework_job_steps (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        job_id VARCHAR(100) NOT NULL REFERENCES shapework_jobs(id) ON DELETE CASCADE,
        step_order INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        channel VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
        risk_level VARCHAR(50) NOT NULL,
        assigned_role VARCHAR(100) NOT NULL,
        approved_by VARCHAR(255),
        approved_at VARCHAR(100),
        output_summary TEXT,
        safe_payload_summary TEXT NOT NULL,
        created_at VARCHAR(100) NOT NULL,
        updated_at VARCHAR(100) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS shapework_approvals (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        job_id VARCHAR(100) NOT NULL REFERENCES shapework_jobs(id) ON DELETE CASCADE,
        step_id VARCHAR(100) NOT NULL REFERENCES shapework_job_steps(id) ON DELETE CASCADE,
        approval_type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        summary TEXT NOT NULL,
        recipient_role VARCHAR(100) NOT NULL,
        recipient_display VARCHAR(255) NOT NULL,
        channel VARCHAR(50) NOT NULL,
        draft_action_summary TEXT NOT NULL,
        risk_level VARCHAR(50) NOT NULL,
        what_could_go_wrong TEXT,
        status VARCHAR(50) NOT NULL,
        approved_by VARCHAR(255),
        approved_at VARCHAR(100),
        rejected_by VARCHAR(255),
        rejected_at VARCHAR(100),
        expires_at VARCHAR(100),
        created_at VARCHAR(100) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS shapework_actions (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        job_id VARCHAR(100) NOT NULL REFERENCES shapework_jobs(id) ON DELETE CASCADE,
        step_id VARCHAR(100) NOT NULL REFERENCES shapework_job_steps(id) ON DELETE CASCADE,
        approval_id VARCHAR(100),
        action_type VARCHAR(100) NOT NULL,
        channel VARCHAR(50) NOT NULL,
        recipient_role VARCHAR(100) NOT NULL,
        recipient_display VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        provider VARCHAR(100) NOT NULL,
        provider_ref_masked VARCHAR(255),
        safe_payload_summary TEXT NOT NULL,
        created_at VARCHAR(100) NOT NULL,
        dispatched_at VARCHAR(100),
        completed_at VARCHAR(100)
      );

      CREATE TABLE IF NOT EXISTS shapework_deliveries (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        action_id VARCHAR(100) NOT NULL REFERENCES shapework_actions(id) ON DELETE CASCADE,
        channel VARCHAR(50) NOT NULL,
        provider VARCHAR(100) NOT NULL,
        delivery_status VARCHAR(50) NOT NULL,
        attempt_count INTEGER NOT NULL DEFAULT 1,
        last_attempt_at VARCHAR(100),
        failure_reason_summary TEXT,
        safe_provider_response_summary TEXT,
        created_at VARCHAR(100) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS shapework_outcomes (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        job_id VARCHAR(100) NOT NULL REFERENCES shapework_jobs(id) ON DELETE CASCADE,
        step_id VARCHAR(100) NOT NULL REFERENCES shapework_job_steps(id) ON DELETE CASCADE,
        action_id VARCHAR(100) REFERENCES shapework_actions(id) ON DELETE SET NULL,
        outcome_type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        summary TEXT NOT NULL,
        follow_up_required BOOLEAN NOT NULL DEFAULT FALSE,
        follow_up_job_id VARCHAR(100),
        owner_brief_eligible BOOLEAN NOT NULL DEFAULT FALSE,
        created_at VARCHAR(100) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS shapework_receipts (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        job_id VARCHAR(100) NOT NULL REFERENCES shapework_jobs(id) ON DELETE CASCADE,
        outcome_id VARCHAR(100) NOT NULL REFERENCES shapework_outcomes(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        summary TEXT NOT NULL,
        action_taken VARCHAR(255) NOT NULL,
        completed_time VARCHAR(100) NOT NULL,
        source_workflow VARCHAR(255) NOT NULL,
        owner_brief_updated BOOLEAN NOT NULL DEFAULT FALSE,
        follow_up_needed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at VARCHAR(100) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS owner_brief_items (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        source_type VARCHAR(100) NOT NULL,
        source_id VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        summary TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        priority VARCHAR(50) NOT NULL,
        created_at VARCHAR(100) NOT NULL
      );
    `);

    // Sequentially execute the hardening migration
    const hardeningPath = path.resolve(resolvedDirname, '../db/migrations/20260704000000_growth_engine_hardening.sql');
    const hardeningSql = fs.readFileSync(hardeningPath, 'utf8');
    await pool.query(hardeningSql);

    // Sequentially execute the production migration
    const prodMigrationPath = path.resolve(resolvedDirname, '../db/migrations/20260705000000_growth_engine_production.sql');
    const prodMigrationSql = fs.readFileSync(prodMigrationPath, 'utf8');
    await pool.query(prodMigrationSql);

    console.log('[Database] Migrations executed successfully.');
  } catch (err) {
    console.error('[Database] Failed to execute migrations:', err);
    throw err;
  }
}

// Map dbState arrays to target SQL tables
const TABLE_MAPPINGS = [
  { stateKey: 'workspaces', table: 'workspaces', hasWorkspaceId: false },
  { stateKey: 'attentionStates', table: 'attention_states', hasWorkspaceId: true },
  { stateKey: 'transactions', table: 'transactions', hasWorkspaceId: true },
  { stateKey: 'tasks', table: 'transaction_checklists', hasWorkspaceId: true },
  { stateKey: 'workflowTemplates', table: 'workflow_templates', hasWorkspaceId: true },
  { stateKey: 'opportunities', table: 'opportunities', hasWorkspaceId: true },
  { stateKey: 'quickWins', table: 'quick_wins', hasWorkspaceId: true },
  { stateKey: 'buildSprints', table: 'build_sprints', hasWorkspaceId: true },
  { stateKey: 'workItems', table: 'work_items', hasWorkspaceId: true },
  { stateKey: 'actionProposals', table: 'approvals', hasWorkspaceId: true },
  { stateKey: 'auditEvents', table: 'audit_events', hasWorkspaceId: true },
  { stateKey: 'integrations', table: 'integration_connections', hasWorkspaceId: true },
  { stateKey: 'responsibilities', table: 'role_ownership', hasWorkspaceId: true },
  { stateKey: 'operatingRecords', table: 'operating_records', hasWorkspaceId: true },
  { stateKey: 'pilotSuccessCriteria', table: 'pilot_success_criteria', hasWorkspaceId: true },
  { stateKey: 'entryPoints', table: 'brokerage_entry_points', hasWorkspaceId: true },
  { stateKey: 'quickbooksConnections', table: 'quickbooks_connections', hasWorkspaceId: true },
  { stateKey: 'financeSignals', table: 'finance_signals', hasWorkspaceId: true },
  { stateKey: 'basecampConnections', table: 'basecamp_connections', hasWorkspaceId: true },
  { stateKey: 'basecampSignals', table: 'basecamp_signals', hasWorkspaceId: true },
  { stateKey: 'workspaceIntegrationConnections', table: 'workspace_integration_connections', hasWorkspaceId: true },
  { stateKey: 'workspaceCommunicationSignals', table: 'workspace_communication_signals', hasWorkspaceId: true },
  { stateKey: 'externalActionApprovals', table: 'external_action_approvals', hasWorkspaceId: true },
  { stateKey: 'sendingDomains', table: 'sending_domains', hasWorkspaceId: true },
  { stateKey: 'sendingAccounts', table: 'sending_accounts', hasWorkspaceId: true },
  { stateKey: 'contacts', table: 'contacts', hasWorkspaceId: true },
  { stateKey: 'contactSources', table: 'contact_sources', hasWorkspaceId: true },
  { stateKey: 'audiences', table: 'audiences', hasWorkspaceId: true },
  { stateKey: 'audienceContacts', table: 'audience_contacts', hasWorkspaceId: true },
  { stateKey: 'segments', table: 'segments', hasWorkspaceId: true },
  { stateKey: 'playbooks', table: 'playbooks', hasWorkspaceId: true },
  { stateKey: 'campaigns', table: 'campaigns', hasWorkspaceId: true },
  { stateKey: 'campaignSteps', table: 'campaign_steps', hasWorkspaceId: true },
  { stateKey: 'campaignEnrollments', table: 'campaign_enrollments', hasWorkspaceId: true },
  { stateKey: 'emailMessages', table: 'email_messages', hasWorkspaceId: true },
  { stateKey: 'emailEvents', table: 'email_events', hasWorkspaceId: true },
  { stateKey: 'replies', table: 'replies', hasWorkspaceId: true },
  { stateKey: 'replyClassifications', table: 'reply_classifications', hasWorkspaceId: true },
  { stateKey: 'suppressionList', table: 'suppression_list', hasWorkspaceId: true },
  { stateKey: 'unsubscribeEvents', table: 'unsubscribe_events', hasWorkspaceId: true },
  { stateKey: 'bounceEvents', table: 'bounce_events', hasWorkspaceId: true },
  { stateKey: 'complaintEvents', table: 'complaint_events', hasWorkspaceId: true },
  { stateKey: 'complianceChecks', table: 'compliance_checks', hasWorkspaceId: true },
  { stateKey: 'providerLogs', table: 'provider_logs', hasWorkspaceId: true },
  { stateKey: 'growthSendJobs', table: 'growth_send_jobs', hasWorkspaceId: true },
  { stateKey: 'signals', table: 'signals', hasWorkspaceId: true },
  { stateKey: 'decisions', table: 'decisions', hasWorkspaceId: true },
  { stateKey: 'shapeworkJobs', table: 'shapework_jobs', hasWorkspaceId: true },
  { stateKey: 'shapeworkJobSteps', table: 'shapework_job_steps', hasWorkspaceId: true },
  { stateKey: 'approvals', table: 'shapework_approvals', hasWorkspaceId: true },
  { stateKey: 'actions', table: 'shapework_actions', hasWorkspaceId: true },
  { stateKey: 'deliveries', table: 'shapework_deliveries', hasWorkspaceId: true },
  { stateKey: 'outcomes', table: 'shapework_outcomes', hasWorkspaceId: true },
  { stateKey: 'receipts', table: 'shapework_receipts', hasWorkspaceId: true },
  { stateKey: 'ownerBriefItems', table: 'owner_brief_items', hasWorkspaceId: true }
];

export async function loadWorkspaceState(pool: pg.Pool, workspaceId: string): Promise<any> {
  const state: any = {};
  
  // 1. Load Workspace info
  const wsRes = await pool.query('SELECT * FROM workspaces WHERE id = $1', [workspaceId]);
  state.workspaces = wsRes.rows.map(row => convertKeysToCamel(row));

  // 2. Load User Memberships
  const usersRes = await pool.query(
    `SELECT u.*, m.role, m.permissions 
     FROM users u 
     JOIN workspace_memberships m ON u.id = m.user_id 
     WHERE m.workspace_id = $1`,
    [workspaceId]
  );
  state.workspaceUsers = usersRes.rows.map(row => {
    const camel = convertKeysToCamel(row);
    return {
      ...camel,
      workspaceId
    };
  });

  // 3. Load all other tables mapped directly to workspace_id
  for (const mapping of TABLE_MAPPINGS) {
    if (!mapping.hasWorkspaceId) continue;
    const res = await pool.query(`SELECT * FROM ${mapping.table} WHERE workspace_id = $1`, [workspaceId]);
    if (mapping.stateKey === 'actionProposals') {
      state[mapping.stateKey] = res.rows.map(row => {
        try {
          const action = typeof row.proposed_action === 'string' 
            ? JSON.parse(row.proposed_action) 
            : row.proposed_action;
          const camel = convertKeysToCamel(action);
          return {
            ...camel,
            id: row.id,
            workspaceId: row.workspace_id,
            title: row.title,
            state: row.status
          };
        } catch {
          return convertKeysToCamel(row);
        }
      });
    } else {
      state[mapping.stateKey] = res.rows.map(row => {
        const camel = convertKeysToCamel(row);
        if (mapping.stateKey === 'workItems') {
          if ('assignedToRole' in camel) {
            camel.ownerRole = camel.assignedToRole;
            delete camel.assignedToRole;
          }
        }
        if (mapping.stateKey === 'buildSprints') {
          if ('title' in camel) {
            camel.name = camel.title;
            delete camel.title;
          }
        }
                if (mapping.stateKey === 'responsibilities') {
          if ('responsibilityTitle' in camel) {
            camel.label = camel.responsibilityTitle;
            delete camel.responsibilityTitle;
          }
        }
        if (mapping.stateKey === 'contacts') {
          if ('contactType' in camel) {
            camel.type = camel.contactType;
          }
          if ('sourceDetail' in camel) {
            camel.sourceDetails = camel.sourceDetail;
          }
        }
        return camel;
      });
    }
  }

  return state;
}

const tableColumnsCache: Record<string, string[]> = {};

async function getTableColumns(pool: pg.Pool, tableName: string): Promise<string[]> {
  if (tableColumnsCache[tableName]) {
    return tableColumnsCache[tableName];
  }
  try {
    const res = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public'",
      [tableName]
    );
    const columns = res.rows.map(row => row.column_name);
    tableColumnsCache[tableName] = columns;
    return columns;
  } catch (err) {
    console.error(`[Database] Failed to fetch columns for table ${tableName}:`, err);
    return [];
  }
}

export async function saveWorkspaceState(pool: pg.Pool, workspaceId: string, state: any): Promise<void> {
  // Sync core workspaces
  if (state.workspaces) {
    for (const ws of state.workspaces) {
      if (ws.id !== workspaceId) continue;
      const res = await pool.query('SELECT 1 FROM workspaces WHERE id = $1', [ws.id]);
      const dbRow = convertKeysToSnake(ws);
      if (res.rows.length === 0) {
        const keys = Object.keys(dbRow);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        await pool.query(`INSERT INTO workspaces (${keys.join(', ')}) VALUES (${placeholders})`, Object.values(dbRow));
      } else {
        const keys = Object.keys(dbRow).filter(k => k !== 'id');
        const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        const values = keys.map(k => dbRow[k]);
        values.push(ws.id);
        await pool.query(`UPDATE workspaces SET ${setClause} WHERE id = $${values.length}`, values);
      }
    }
  }

  // Sync users and memberships
  if (state.workspaceUsers) {
    for (const wu of state.workspaceUsers) {
      if (wu.workspaceId !== workspaceId) continue;
      
      // Upsert User by email to handle dynamic IDs gracefully
      const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [wu.email]);
      const userRow = convertKeysToSnake({
        id: userRes.rows.length > 0 ? userRes.rows[0].id : wu.id,
        email: wu.email,
        name: wu.name,
        passwordHash: wu.passwordHash || null,
        status: wu.status || 'active'
      });
      const resolvedUserId = userRow.id;
      if (userRes.rows.length === 0) {
        const keys = Object.keys(userRow);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        await pool.query(`INSERT INTO users (${keys.join(', ')}) VALUES (${placeholders})`, Object.values(userRow));
      } else {
        const keys = Object.keys(userRow).filter(k => k !== 'id');
        const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        const values = keys.map(k => userRow[k]);
        values.push(resolvedUserId);
        await pool.query(`UPDATE users SET ${setClause} WHERE id = $${values.length}`, values);
      }

      // Upsert Membership
      const memRes = await pool.query('SELECT 1 FROM workspace_memberships WHERE workspace_id = $1 AND user_id = $2', [workspaceId, resolvedUserId]);
      const memRow = convertKeysToSnake({
        id: `m_${resolvedUserId}_${workspaceId}`,
        workspaceId,
        userId: resolvedUserId,
        role: wu.role,
        permissions: wu.permissions || []
      });
      if (memRes.rows.length === 0) {
        const keys = Object.keys(memRow);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        await pool.query(`INSERT INTO workspace_memberships (${keys.join(', ')}) VALUES (${placeholders})`, Object.values(memRow));
      } else {
        const keys = Object.keys(memRow).filter(k => k !== 'workspace_id' && k !== 'user_id');
        const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        const values = keys.map(k => memRow[k]);
        values.push(workspaceId, resolvedUserId);
        await pool.query(`UPDATE workspace_memberships SET ${setClause} WHERE workspace_id = $${values.length - 1} AND user_id = $${values.length}`, values);
      }
    }
  }

  // Sync other tables mapped by workspaceId
  for (const mapping of TABLE_MAPPINGS) {
    if (!mapping.hasWorkspaceId) continue;
    const items = state[mapping.stateKey] || [];
    const workspaceItems = items.filter((item: any) => item.workspaceId === workspaceId);

    // 1. Fetch current database IDs
    const dbIdsRes = await pool.query(`SELECT id FROM ${mapping.table} WHERE workspace_id = $1`, [workspaceId]);
    const dbIds = dbIdsRes.rows.map(r => r.id);

    const validColumns = await getTableColumns(pool, mapping.table);

    // 2. Perform reconciliation inserts and updates using atomic ON CONFLICT upsert to prevent race conditions
    for (const item of workspaceItems) {
      let dbRow: any;
      if (mapping.stateKey === 'actionProposals') {
        dbRow = {
          id: item.id,
          workspace_id: workspaceId,
          title: item.title,
          status: item.state || 'awaiting_approval',
          proposed_action: JSON.stringify(item),
          created_at: item.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      } else {
        dbRow = convertKeysToSnake(item);
        if (mapping.stateKey === 'workItems') {
          if ('owner_role' in dbRow) {
            dbRow.assigned_to_role = dbRow.owner_role;
            delete dbRow.owner_role;
          }
        }
        if (mapping.stateKey === 'buildSprints') {
          if ('name' in dbRow) {
            dbRow.title = dbRow.name;
            delete dbRow.name;
          }
        }
                if (mapping.stateKey === 'responsibilities') {
          if ('label' in dbRow) {
            dbRow.responsibility_title = dbRow.label;
            delete dbRow.label;
          }
        }
        if (mapping.stateKey === 'contacts') {
          if ('type' in item) {
            dbRow.contact_type = item.type;
          }
          if ('sourceDetails' in item) {
            dbRow.source_detail = item.sourceDetails;
          }
        }
      }

      // Replace invalid string timestamps like 'Never' with null to satisfy TIMESTAMPTZ database constraints
      for (const k of Object.keys(dbRow)) {
        if (dbRow[k] === 'Never') {
          dbRow[k] = null;
        }
      }

      // Filter to only columns that actually exist in the DB schema
      if (validColumns.length > 0) {
        const filtered: any = {};
        for (const k of Object.keys(dbRow)) {
          if (validColumns.includes(k)) {
            filtered[k] = dbRow[k];
          }
        }
        dbRow = filtered;
      }

      const keys = Object.keys(dbRow);
      if (keys.length === 0) continue;
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      
      const updateKeys = keys.filter(k => k !== 'id');
      if (updateKeys.length > 0) {
        const updateClause = updateKeys.map(k => `${k} = EXCLUDED.${k}`).join(', ');
        const query = `INSERT INTO ${mapping.table} (${keys.join(', ')}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${updateClause}`;
        await pool.query(query, Object.values(dbRow));
      } else {
        const query = `INSERT INTO ${mapping.table} (${keys.join(', ')}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`;
        await pool.query(query, Object.values(dbRow));
      }
    }

    // 3. Delete removed items
    const activeIds = workspaceItems.map((item: any) => item.id);
    const toDelete = dbIds.filter(id => !activeIds.includes(id));
    if (toDelete.length > 0) {
      await pool.query(`DELETE FROM ${mapping.table} WHERE id = ANY($1)`, [toDelete]);
    }
  }
}

export async function seedDatabaseIfEmpty(pool: pg.Pool, state: any) {
  const isProduction = process.env.APP_MODE === 'production';
  if (isProduction && !process.env.ADMIN_BOOTSTRAP_SECRET) {
    console.log('[Database] No admin bootstrap secret provided. Skipping database seeding.');
    return;
  }
  try {
    const wsRes = await pool.query("SELECT 1 FROM workspaces WHERE id = 'nest-realty-demo'");
    if (wsRes.rows.length === 0) {
      console.log('[Database] Pilot workspace is missing. Seeding default demo workspace...');
      
      const defaultWorkspaces = [
        {
          id: 'nest-realty-demo',
          name: 'Nest Realty Demo Workspace',
          slug: 'nest-realty-demo',
          industry: 'real_estate_brokerage',
          status: 'active',
          phase: 'pilot',
          timezone: 'America/New_York',
          launchMode: 'integration_first',
          launchOwner: 'Sarah Jenkins',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      for (const ws of defaultWorkspaces) {
        const dbRow = convertKeysToSnake(ws);
        const keys = Object.keys(dbRow);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        await pool.query(`INSERT INTO workspaces (${keys.join(', ')}) VALUES (${placeholders})`, Object.values(dbRow));
      }

      const seededState = {
        ...state,
        workspaces: defaultWorkspaces,
        workspaceUsers: (state.workspaceUsers || []).map((u: any) => ({
          ...u,
          workspaceId: 'nest-realty-demo'
        }))
      };

      for (const mapping of TABLE_MAPPINGS) {
        if (mapping.hasWorkspaceId && seededState[mapping.stateKey]) {
          seededState[mapping.stateKey] = seededState[mapping.stateKey].map((item: any) => ({
            ...item,
            workspaceId: item.workspaceId || 'nest-realty-demo'
          }));
        }
      }

      await saveWorkspaceState(pool, 'nest-realty-demo', seededState);
      console.log('[Database] Seed data loaded successfully.');
    }
  } catch (err) {
    console.error('[Database] Failed to seed database on startup:', err);
  }
}

export async function ensureSuperAdminsExist(pool: pg.Pool) {
  const superAdmins = [
    { id: 'usr_admin', email: 'admin@shapework.co', name: 'Platform Admin', password: 'password123' },
    { id: 'usr_marcus', email: 'marcus@shapework.co', name: 'Marcus', password: 'shapework2026' },
    { id: 'usr_adam', email: 'adam@shapework.co', name: 'Adam', password: 'shapework2026' },
    { id: 'usr_matt', email: 'matt@shapework.co', name: 'Matt', password: 'shapework2026' }
  ];

  for (const sa of superAdmins) {
    try {
      const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [sa.email]);
      let userId = sa.id;
      const pwdHash = crypto.createHash('sha256').update(sa.password).digest('hex');

      if (userRes.rows.length === 0) {
        // Insert User
        await pool.query(
          'INSERT INTO users (id, email, name, password_hash, status) VALUES ($1, $2, $3, $4, $5)',
          [userId, sa.email, sa.name, pwdHash, 'active']
        );
        console.log(`[Database] Seeded Super Admin user: ${sa.email}`);
      } else {
        userId = userRes.rows[0].id;
        // Update Password and status to make sure they can login
        await pool.query(
          'UPDATE users SET password_hash = $1, status = $2 WHERE id = $3',
          [pwdHash, 'active', userId]
        );
      }

      // Check workspace membership
      const wsId = 'nest-realty-demo';
      // Ensure workspace exists
      const wsRes = await pool.query('SELECT 1 FROM workspaces WHERE id = $1', [wsId]);
      if (wsRes.rows.length > 0) {
        const memRes = await pool.query(
          'SELECT 1 FROM workspace_memberships WHERE workspace_id = $1 AND user_id = $2',
          [wsId, userId]
        );
        const permissions = ['view_work_queue', 'manage_work_queue', 'view_deals', 'manage_deals', 'view_compliance', 'manage_compliance', 'approve_actions', 'manage_integrations', 'manage_users', 'configure_routing', 'view_audit', 'export_audit', 'manage_workspace', 'access_developer_tools'];
        if (memRes.rows.length === 0) {
          await pool.query(
            'INSERT INTO workspace_memberships (id, workspace_id, user_id, role, permissions) VALUES ($1, $2, $3, $4, $5)',
            [`m_${userId}_${wsId}`, wsId, userId, 'admin', permissions]
          );
        } else {
          await pool.query(
            'UPDATE workspace_memberships SET role = $1, permissions = $2 WHERE workspace_id = $3 AND user_id = $4',
            ['admin', permissions, wsId, userId]
          );
        }
      }
    } catch (err) {
      console.error(`[Database] Error ensuring Super Admin ${sa.email}:`, err);
    }
  }
}
