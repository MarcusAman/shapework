/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { convertKeysToSnake, convertKeysToCamel } from './databaseRepositories.js';
import crypto from 'crypto';
import { hashPassword } from '../auth/password.js';
import { NEST_FULL_ROSTER_72 } from './nestRosterSeed.js';

const resolvedDirname = typeof process !== 'undefined' && process.cwd ? path.join(process.cwd(), 'server', 'persistence') : '';

// Run database schema migrations
export async function initDatabaseSchema(pool: pg.Pool) {
  try {
    // 0. Ensure core relational tables exist first with robust error handling
    await pool.query(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        industry VARCHAR(100) DEFAULT 'real_estate_brokerage',
        status VARCHAR(50) DEFAULT 'active',
        phase VARCHAR(50) DEFAULT 'setup',
        timezone VARCHAR(100) DEFAULT 'America/New_York',
        launch_mode VARCHAR(100) DEFAULT 'integration_first',
        launch_owner VARCHAR(255),
        target_go_live_date DATE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending_activation',
        security_version INTEGER NOT NULL DEFAULT 1,
        failed_login_attempts INTEGER NOT NULL DEFAULT 0,
        last_failed_login_at TIMESTAMPTZ,
        locked_until TIMESTAMPTZ,
        activated_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS security_version INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;

      CREATE TABLE IF NOT EXISTS invitation_tokens (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL UNIQUE,
        role VARCHAR(100) NOT NULL,
        permissions TEXT[] NOT NULL DEFAULT '{}',
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        used_by_ip VARCHAR(100),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        used_by_ip VARCHAR(100),
        requested_ip VARCHAR(100),
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS requested_ip VARCHAR(100);
      ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS user_agent TEXT;

      CREATE TABLE IF NOT EXISTS auth_audit_logs (
        id VARCHAR(100) PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        user_id VARCHAR(100),
        email_redacted VARCHAR(255),
        workspace_id VARCHAR(100),
        ip_address VARCHAR(100),
        user_agent TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS nora_durable_actions (
        id VARCHAR(100) PRIMARY KEY,
        request_id VARCHAR(100),
        idempotency_key VARCHAR(255) UNIQUE NOT NULL,
        authenticated_user_id VARCHAR(100) NOT NULL,
        tenant_id VARCHAR(100) NOT NULL,
        workspace_id VARCHAR(100) NOT NULL,
        action_name VARCHAR(100) NOT NULL,
        entity_id VARCHAR(255),
        normalized_args JSONB NOT NULL DEFAULT '{}',
        external_provider_id VARCHAR(255),
        execution_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        verification_status BOOLEAN NOT NULL DEFAULT TRUE,
        final_result_status VARCHAR(50) NOT NULL DEFAULT 'completed',
        human_readable_summary TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_nora_durable_actions_idempotency ON nora_durable_actions(idempotency_key);
      CREATE INDEX IF NOT EXISTS idx_nora_durable_actions_workspace_action ON nora_durable_actions(workspace_id, action_name, created_at DESC);

      CREATE TABLE IF NOT EXISTS nora_pending_actions (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL,
        user_id VARCHAR(100) NOT NULL,
        session_id VARCHAR(100) NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        lifecycle_state VARCHAR(50),
        channel VARCHAR(50) DEFAULT 'typed_chat',
        originating_turn_id VARCHAR(100),
        fields JSONB NOT NULL DEFAULT '{}',
        missing_fields TEXT[] NOT NULL DEFAULT '{}',
        last_clarification_prompt TEXT,
        idempotency_key VARCHAR(255),
        execution_result JSONB,
        error TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_nora_pending_actions_lookup ON nora_pending_actions(workspace_id, user_id, session_id);
      CREATE INDEX IF NOT EXISTS idx_nora_pending_actions_status ON nora_pending_actions(status, expires_at);

      CREATE TABLE IF NOT EXISTS nora_conversation_states (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL,
        user_id VARCHAR(100) NOT NULL,
        session_id VARCHAR(100) NOT NULL,
        channel VARCHAR(50) NOT NULL DEFAULT 'typed',
        active_goal JSONB,
        active_entities JSONB NOT NULL DEFAULT '[]',
        collected_fields JSONB NOT NULL DEFAULT '{}',
        missing_fields TEXT[] NOT NULL DEFAULT '{}',
        corrections JSONB NOT NULL DEFAULT '[]',
        suspended_goals JSONB NOT NULL DEFAULT '[]',
        recent_evidence_ids TEXT[] NOT NULL DEFAULT '{}',
        version INTEGER NOT NULL DEFAULT 1,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (workspace_id, user_id, session_id)
      );

      CREATE INDEX IF NOT EXISTS idx_nora_conv_states_lookup ON nora_conversation_states(workspace_id, user_id, session_id);

      CREATE TABLE IF NOT EXISTS nora_operational_commitments (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL,
        user_id VARCHAR(100) NOT NULL,
        session_id VARCHAR(100),
        target_record_type VARCHAR(100) NOT NULL,
        target_record_id VARCHAR(100) NOT NULL,
        condition_type VARCHAR(100) NOT NULL,
        condition_expression JSONB NOT NULL DEFAULT '{}',
        owner VARCHAR(255) NOT NULL,
        recipient_id VARCHAR(100),
        recipient_channel VARCHAR(50) NOT NULL DEFAULT 'in_app',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        evaluate_at TIMESTAMPTZ NOT NULL,
        last_evaluated_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        cancellation_reason TEXT,
        idempotency_key VARCHAR(255) UNIQUE,
        execution_receipt JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS nora_execution_plans (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL,
        user_id VARCHAR(100) NOT NULL,
        originating_query TEXT NOT NULL,
        summary TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'planning',
        steps JSONB NOT NULL DEFAULT '[]'::jsonb,
        executed_count INTEGER NOT NULL DEFAULT 0,
        failed_step_id VARCHAR(100),
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_nora_exec_plans_user ON nora_execution_plans(workspace_id, user_id, status);

      CREATE TABLE IF NOT EXISTS canonical_marketing_requests (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        property_address TEXT NOT NULL,
        normalized_property_key VARCHAR(255),
        agent_name VARCHAR(255) NOT NULL,
        agent_phone VARCHAR(50),
        agent_email VARCHAR(255),
        channel VARCHAR(50) NOT NULL DEFAULT 'web',
        status VARCHAR(50) NOT NULL DEFAULT 'request_received',
        category VARCHAR(100),
        task_ids TEXT[] NOT NULL DEFAULT '{}',
        is_archived BOOLEAN NOT NULL DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE canonical_marketing_requests ADD COLUMN IF NOT EXISTS normalized_property_key VARCHAR(255);
      ALTER TABLE canonical_marketing_requests ADD COLUMN IF NOT EXISTS field_conflicts JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE canonical_marketing_requests ADD COLUMN IF NOT EXISTS field_provenance JSONB DEFAULT '{}'::jsonb;
      CREATE INDEX IF NOT EXISTS idx_canonical_mkt_req_ws ON canonical_marketing_requests(workspace_id, is_archived);
      CREATE INDEX IF NOT EXISTS idx_canonical_mkt_req_prop_key ON canonical_marketing_requests(workspace_id, normalized_property_key);

      -- Partial Unique Index enforcing EXACTLY ONE active request container per property in a workspace
      CREATE UNIQUE INDEX IF NOT EXISTS uq_active_canonical_mkt_req_prop 
      ON canonical_marketing_requests(workspace_id, normalized_property_key) 
      WHERE is_archived = FALSE AND status NOT IN ('completed', 'merged', 'archived') AND normalized_property_key IS NOT NULL AND normalized_property_key != '';

      CREATE TABLE IF NOT EXISTS canonical_marketing_tasks (
        id VARCHAR(100) PRIMARY KEY,
        request_id VARCHAR(100) NOT NULL,
        workspace_id VARCHAR(100) NOT NULL,
        request_title VARCHAR(255),
        property_address TEXT,
        agent_name VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        assigned_to VARCHAR(255),
        assigned_to_role VARCHAR(100),
        status VARCHAR(50) NOT NULL DEFAULT 'request_received',
        due_at TIMESTAMPTZ,
        notes TEXT,
        is_archived BOOLEAN NOT NULL DEFAULT FALSE,
        archived_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        approval_history JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_canonical_mkt_tasks_req ON canonical_marketing_tasks(request_id, is_archived);
      CREATE INDEX IF NOT EXISTS idx_canonical_mkt_tasks_assignee ON canonical_marketing_tasks(assigned_to, is_archived);
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS review_owner VARCHAR(255);
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS covering_staff VARCHAR(255);
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS coverage_history JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS internal_flags JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS governing_sop_id VARCHAR(100);
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS governing_sop_version VARCHAR(50);
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS routing_rule_id VARCHAR(100);
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS routing_policy_version INTEGER;
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS department_id VARCHAR(100);
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS primary_role_id VARCHAR(100);
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS review_role_id VARCHAR(100);
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS review_owner_id VARCHAR(100);
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS assignee_staff_id VARCHAR(100);
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS original_staff_id VARCHAR(100);
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS covering_staff_id VARCHAR(100);
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS routing_state VARCHAR(50) NOT NULL DEFAULT 'resolved';
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS routing_reasons TEXT[] DEFAULT '{}';
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS routing_snapshot JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS routing_policy_id VARCHAR(100);
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS fulfillment_role_id VARCHAR(100);
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS original_review_owner_id VARCHAR(100);
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS review_covering_staff_id VARCHAR(100);
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS original_assignee_id VARCHAR(100);
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS assignee_covering_staff_id VARCHAR(100);
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS classification_confidence NUMERIC(4,3);
      ALTER TABLE canonical_marketing_tasks ADD COLUMN IF NOT EXISTS routed_at TIMESTAMPTZ;
      ALTER TABLE canonical_marketing_requests ADD COLUMN IF NOT EXISTS created_by_id VARCHAR(100);
      ALTER TABLE canonical_marketing_requests ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(255);
      ALTER TABLE canonical_marketing_requests ADD COLUMN IF NOT EXISTS on_behalf_of VARCHAR(255);

      CREATE TABLE IF NOT EXISTS published_routing_policies (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL DEFAULT 'ws_wilmington',
        version INTEGER NOT NULL DEFAULT 1,
        published_by VARCHAR(255) NOT NULL,
        published_by_user_id VARCHAR(100),
        published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        rules_count INTEGER NOT NULL DEFAULT 0,
        validation_hash VARCHAR(64),
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_routing_policy_ws_version UNIQUE (workspace_id, version)
      );

      CREATE TABLE IF NOT EXISTS published_routing_rules (
        id VARCHAR(100) PRIMARY KEY,
        policy_id VARCHAR(100) NOT NULL,
        workspace_id VARCHAR(100) NOT NULL DEFAULT 'ws_wilmington',
        rule_index INTEGER NOT NULL DEFAULT 0,
        category VARCHAR(100) NOT NULL,
        subcategory VARCHAR(100),
        display_name VARCHAR(255),
        match_keywords TEXT[] DEFAULT '{}',
        office_condition JSONB,
        primary_position_id VARCHAR(100) NOT NULL,
        primary_role_id VARCHAR(100),
        primary_staff_id VARCHAR(100) NOT NULL,
        review_position_id VARCHAR(100),
        review_role_id VARCHAR(100),
        review_staff_id VARCHAR(100),
        backup_position_id VARCHAR(100),
        backup_staff_id VARCHAR(100),
        governing_sop_id VARCHAR(100),
        governing_sop_version VARCHAR(50),
        sla_hours INTEGER DEFAULT 24,
        sla_display VARCHAR(50) DEFAULT '24 hours',
        escalation_policy_id VARCHAR(100),
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_notification_preferences (
        user_id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL DEFAULT 'ws_wilmington',
        email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        sms_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        preferred_channel VARCHAR(50) NOT NULL DEFAULT 'both',
        quiet_hours_start VARCHAR(20) NOT NULL DEFAULT '17:00',
        quiet_hours_end VARCHAR(20) NOT NULL DEFAULT '09:00',
        timezone VARCHAR(100) NOT NULL DEFAULT 'America/New_York',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE user_notification_preferences ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(100) NOT NULL DEFAULT 'ws_wilmington';

      CREATE TABLE IF NOT EXISTS operations_directory_staff (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL DEFAULT 'ws_wilmington',
        full_name VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        role VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(100),
        avatar_url TEXT,
        active_workload_count INTEGER DEFAULT 0,
        max_workload_capacity INTEGER DEFAULT 10,
        skills TEXT[] DEFAULT '{}',
        escalation_contact_id VARCHAR(100),
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        backup_staff_id VARCHAR(100),
        backup_staff_name VARCHAR(255),
        out_of_office_reason TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE operations_directory_staff ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(100) NOT NULL DEFAULT 'ws_wilmington';

      CREATE TABLE IF NOT EXISTS inbound_email_idempotency_log (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL,
        provider VARCHAR(50) NOT NULL DEFAULT 'google_workspace',
        mailbox_id VARCHAR(255) NOT NULL,
        message_id VARCHAR(255) NOT NULL,
        thread_id VARCHAR(255),
        sender_email VARCHAR(255) NOT NULL,
        processing_status VARCHAR(50) NOT NULL DEFAULT 'processing',
        attempt_count INTEGER NOT NULL DEFAULT 1,
        last_error_code VARCHAR(100),
        task_id VARCHAR(100),
        request_id VARCHAR(100),
        processing_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        lease_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_inbound_email_workspace_provider_mailbox_msg UNIQUE (workspace_id, provider, mailbox_id, message_id)
      );
      CREATE INDEX IF NOT EXISTS idx_inbound_email_lookup ON inbound_email_idempotency_log(workspace_id, provider, mailbox_id, message_id);
      CREATE INDEX IF NOT EXISTS idx_inbound_email_status ON inbound_email_idempotency_log(processing_status, lease_expires_at);

      CREATE TABLE IF NOT EXISTS outbound_email_outbox (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL,
        message_type VARCHAR(100) NOT NULL,
        idempotency_key VARCHAR(255) UNIQUE NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        attempt_count INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 5,
        next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        lease_expires_at TIMESTAMPTZ,
        provider_message_id VARCHAR(255),
        last_error_code VARCHAR(100),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        sent_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_outbox_queue ON outbound_email_outbox(status, next_attempt_at) WHERE status IN ('pending', 'failed');
      CREATE INDEX IF NOT EXISTS idx_outbox_key ON outbound_email_outbox(idempotency_key);

      CREATE TABLE IF NOT EXISTS workspace_memberships (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(100) NOT NULL,
        permissions TEXT[] NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (workspace_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS org_charts (
        workspace_id VARCHAR(100) PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
        model JSONB NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_by VARCHAR(255) NOT NULL DEFAULT 'system'
      );

      CREATE TABLE IF NOT EXISTS org_chart_positions (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(100),
        reports_to_id VARCHAR(100) REFERENCES org_chart_positions(id) ON DELETE SET NULL,
        roles JSONB DEFAULT '[]'::jsonb,
        responsibilities JSONB DEFAULT '[]'::jsonb,
        sla VARCHAR(255),
        escalation_rule VARCHAR(255),
        version INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS org_chart_audits (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        action VARCHAR(100) NOT NULL,
        entity_id VARCHAR(100),
        author_user VARCHAR(255) NOT NULL,
        diff JSONB
      );

      CREATE TABLE IF NOT EXISTS sop_drafts (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        tenant_id VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        purpose TEXT,
        trigger VARCHAR(255),
        process_owner VARCHAR(255) NOT NULL,
        reviewer VARCHAR(255),
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        version VARCHAR(50) NOT NULL DEFAULT '1.0',
        ordered_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
        systems_used TEXT[] DEFAULT '{}',
        completion_evidence TEXT,
        expected_timing VARCHAR(100),
        revision_count INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sop_audits (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        action VARCHAR(100) NOT NULL,
        sop_id VARCHAR(100) NOT NULL,
        performed_by VARCHAR(255) NOT NULL,
        reason VARCHAR(255),
        snapshot JSONB
      );

      CREATE TABLE IF NOT EXISTS owner_digest_configs (
        workspace_id VARCHAR(100) PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
        enabled BOOLEAN NOT NULL DEFAULT FALSE,
        recipients TEXT[] NOT NULL DEFAULT '{}',
        day_of_week VARCHAR(50) NOT NULL DEFAULT 'monday',
        delivery_time VARCHAR(50) NOT NULL DEFAULT '08:00',
        workspace_timezone VARCHAR(100) NOT NULL DEFAULT 'America/New_York',
        include_needs_attention BOOLEAN NOT NULL DEFAULT TRUE,
        include_open_requests BOOLEAN NOT NULL DEFAULT TRUE,
        include_resolved_last_week BOOLEAN NOT NULL DEFAULT TRUE,
        version INTEGER NOT NULL DEFAULT 1,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_by VARCHAR(255) NOT NULL DEFAULT 'system'
      );

      CREATE TABLE IF NOT EXISTS owner_digest_deliveries (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        idempotency_key VARCHAR(255) UNIQUE NOT NULL,
        period_id VARCHAR(100) NOT NULL,
        recipient_email VARCHAR(255) NOT NULL,
        digest_type VARCHAR(50) NOT NULL DEFAULT 'weekly_owner_brief',
        mode VARCHAR(50) NOT NULL DEFAULT 'test_adapter',
        status VARCHAR(50) NOT NULL DEFAULT 'logged',
        html_body TEXT,
        text_body TEXT,
        delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Candidate search paths for migration files
    const candidateDirs = [
      path.resolve(process.cwd(), 'server/db/migrations'),
      path.resolve('/app/server/db/migrations'),
      path.resolve(resolvedDirname, '../server/db/migrations'),
      path.resolve(resolvedDirname, '../db/migrations')
    ];
    const migrationsDir = candidateDirs.find(d => {
      try {
        return fs.existsSync(d) && fs.statSync(d).isDirectory() && fs.readdirSync(d).some(f => f.endsWith('.sql'));
      } catch {
        return false;
      }
    });

    if (migrationsDir) {
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql') && !f.endsWith('_down.sql')).sort();
      for (const file of files) {
        try {
          const filePath = path.join(migrationsDir, file);
          if (fs.existsSync(filePath)) {
            const sql = fs.readFileSync(filePath, 'utf8');
            await pool.query(sql);
          }
        } catch (mErr: any) {
          console.warn(`[Migration Notice] Non-fatal migration notice in ${file}:`, mErr.message);
        }
      }
    }

    // Default seed for UAT workspaces if table is empty
    await pool.query(`
      INSERT INTO workspaces (id, name, slug, status, phase)
      VALUES 
        ('ws_wilmington', 'Nest Realty Wilmington (Mayfaire)', 'nest-wilmington', 'active', 'production'),
        ('nest-realty-wilmington', 'Nest Realty Wilmington', 'nest-realty-wilmington', 'active', 'production'),
        ('nest-realty-demo', 'Nest Realty Demo', 'nest-realty-demo', 'active', 'production'),
        ('ws_carolina_beach', 'Nest Realty Carolina Beach', 'nest-carolina-beach', 'active', 'production'),
        ('uat_workspace_a', 'Nest UAT Workspace A', 'nest-uat-a', 'active', 'production'),
        ('uat_workspace_b', 'Nest UAT Workspace B', 'nest-uat-b', 'active', 'production')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 1. Create directory_people first in a separate call to avoid PostgreSQL compilation/dependency errors
    await pool.query(`
      CREATE TABLE IF NOT EXISTS directory_people (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        first_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100),
        last_name VARCHAR(100) NOT NULL,
        preferred_name VARCHAR(100),
        display_name VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        role VARCHAR(255),
        team VARCHAR(255),
        person_type VARCHAR(50),
        office_ids VARCHAR(100)[],
        office_names VARCHAR(255)[],
        primary_office_id VARCHAR(100),
        primary_office_name VARCHAR(255),
        email VARCHAR(255),
        alternate_email VARCHAR(255),
        phone VARCHAR(100),
        alternate_phone VARCHAR(100),
        photo_url TEXT,
        profile_url TEXT,
        scheduling_url TEXT,
        status VARCHAR(50) NOT NULL,
        is_broker_in_charge BOOLEAN DEFAULT FALSE,
        is_team_leader BOOLEAN DEFAULT FALSE,
        raw_role VARCHAR(255),
        source_parser_version VARCHAR(50),
        communication_preference VARCHAR(50) DEFAULT 'standard',
        tags VARCHAR(100)[],
        source VARCHAR(50) NOT NULL,
        source_spreadsheet_id VARCHAR(100),
        source_sheet_name VARCHAR(100),
        source_row_key VARCHAR(100),
        last_source_modified_at VARCHAR(100),
        last_synced_at VARCHAR(100),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE directory_people
      ADD COLUMN IF NOT EXISTS is_team_leader BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS raw_role VARCHAR(255),
      ADD COLUMN IF NOT EXISTS source_parser_version VARCHAR(50),
      ADD COLUMN IF NOT EXISTS communication_preference VARCHAR(50) DEFAULT 'standard';
    `);

    // 2. Create brokerage entry points table and other tables dynamically
    await pool.query(`
      CREATE TABLE IF NOT EXISTS brokerage_entry_points (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        type VARCHAR(100) NOT NULL,
        source_system VARCHAR(100) NOT NULL,
        source_record_id VARCHAR(100),
        related_transaction_id VARCHAR(100) REFERENCES transactions(id) ON DELETE SET NULL,
        related_marketing_request_id VARCHAR(100),
        related_person_id VARCHAR(100) REFERENCES directory_people(id) ON DELETE SET NULL,
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
        token_version INTEGER DEFAULT 1,
        last_refresh_attempt TIMESTAMPTZ,
        last_successful_refresh TIMESTAMPTZ,
        last_refresh_error_category VARCHAR(100),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE workspace_integration_connections ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 1;
      ALTER TABLE workspace_integration_connections ADD COLUMN IF NOT EXISTS last_refresh_attempt TIMESTAMPTZ;
      ALTER TABLE workspace_integration_connections ADD COLUMN IF NOT EXISTS last_successful_refresh TIMESTAMPTZ;
      ALTER TABLE workspace_integration_connections ADD COLUMN IF NOT EXISTS last_refresh_error_category VARCHAR(100);

      CREATE TABLE IF NOT EXISTS workspace_calendar_settings (
        workspace_id VARCHAR(100) PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
        selected_calendar_id VARCHAR(255) NOT NULL,
        selected_calendar_name VARCHAR(255) NOT NULL,
        access_role VARCHAR(50) NOT NULL,
        timezone VARCHAR(100) NOT NULL DEFAULT 'America/New_York',
        auto_meet_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        is_dedicated_nora_calendar BOOLEAN NOT NULL DEFAULT TRUE,
        last_verified_at TIMESTAMPTZ,
        last_error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS scheduled_brokerage_meetings (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL,
        calendar_id VARCHAR(255) NOT NULL,
        google_event_id VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        meeting_date VARCHAR(100) NOT NULL,
        start_time VARCHAR(100) NOT NULL,
        end_time VARCHAR(100) NOT NULL,
        start_iso TIMESTAMPTZ,
        end_iso TIMESTAMPTZ,
        location TEXT,
        organizer_email VARCHAR(255) NOT NULL,
        requester_name VARCHAR(255) NOT NULL,
        target_audience TEXT,
        resolved_scope_description TEXT,
        attendee_count INT NOT NULL DEFAULT 0,
        attendees JSONB NOT NULL DEFAULT '[]'::jsonb,
        google_calendar_url TEXT,
        html_link TEXT,
        hangout_link TEXT,
        ical_content TEXT,
        dispatched_via VARCHAR(100) NOT NULL,
        mode VARCHAR(50) NOT NULL,
        conference_status VARCHAR(50) NOT NULL,
        is_external_verified BOOLEAN NOT NULL DEFAULT FALSE,
        idempotency_key VARCHAR(255),
        pending_action_id VARCHAR(100),
        provider_timestamp TIMESTAMPTZ,
        spoken_confirmation TEXT,
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
        description TEXT,
        channel VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
        risk_level VARCHAR(50) NOT NULL,
        assigned_role VARCHAR(100),
        approved_by VARCHAR(255),
        approved_at VARCHAR(100),
        output_summary TEXT,
        safe_payload_summary TEXT,
        created_at VARCHAR(100) NOT NULL,
        updated_at VARCHAR(100) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS shapework_approvals (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        job_id VARCHAR(100) NOT NULL,
        step_id VARCHAR(100) NOT NULL,
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
        job_id VARCHAR(100) NOT NULL,
        step_id VARCHAR(100) NOT NULL,
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
        job_id VARCHAR(100) NOT NULL,
        step_id VARCHAR(100) NOT NULL,
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
        job_id VARCHAR(100) NOT NULL,
        outcome_id VARCHAR(100) NOT NULL,
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

      CREATE TABLE IF NOT EXISTS ops_sops (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        sop_id VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        department VARCHAR(100),
        owner_role VARCHAR(100),
        owner_user_id VARCHAR(100),
        backup_role VARCHAR(100),
        backup_user_id VARCHAR(100),
        final_approver_user_id VARCHAR(100),
        escalation_recipient_role VARCHAR(100),
        purpose TEXT NOT NULL,
        expected_outcome TEXT NOT NULL,
        scope TEXT,
        exclusions TEXT,
        tags TEXT[],
        trigger_type VARCHAR(100) NOT NULL,
        trigger TEXT,
        trigger_conditions TEXT,
        required_info JSONB,
        steps JSONB,
        decisions JSONB,
        escalation_behavior JSONB,
        completion_evidence JSONB,
        governance JSONB,
        status VARCHAR(50) NOT NULL,
        version VARCHAR(50) NOT NULL,
        versions JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ops_sop_runs (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        sop_id VARCHAR(100) NOT NULL,
        sop_version VARCHAR(50) NOT NULL,
        related_request_id VARCHAR(100),
        title VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        started_by VARCHAR(100) NOT NULL,
        started_at VARCHAR(100) NOT NULL,
        completed_at VARCHAR(100),
        current_step_id VARCHAR(100),
        completed_steps JSONB,
        blocked_steps JSONB,
        step_statuses JSONB,
        step_evidence JSONB,
        step_notes JSONB,
        required_info_data JSONB,
        timeline JSONB,
        feedback_submitted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ops_feedback (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        object_type VARCHAR(50) NOT NULL,
        object_id VARCHAR(100) NOT NULL,
        helpful BOOLEAN,
        rating VARCHAR(50),
        reasons JSONB,
        comment TEXT,
        submitted_by VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ops_improvement_requests (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        feedback_id VARCHAR(100),
        sop_id VARCHAR(100) NOT NULL,
        sop_version VARCHAR(50) NOT NULL,
        affected_step VARCHAR(100),
        reason TEXT,
        comment TEXT,
        submitted_by VARCHAR(255),
        assigned_reviewer VARCHAR(255),
        status VARCHAR(50) NOT NULL,
        resolution_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS news_sources (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        feed_url TEXT NOT NULL,
        site_url TEXT NOT NULL,
        feed_type VARCHAR(50) NOT NULL,
        is_enabled BOOLEAN DEFAULT TRUE,
        priority INTEGER DEFAULT 1,
        description TEXT,
        last_synced_at TIMESTAMPTZ,
        last_error TEXT,
        item_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS news_items (
        id VARCHAR(100) PRIMARY KEY,
        workspace_id VARCHAR(100) NOT NULL,
        title TEXT NOT NULL,
        source_name VARCHAR(255) NOT NULL,
        source_url TEXT NOT NULL,
        canonical_url TEXT NOT NULL,
        author VARCHAR(255),
        published_at TIMESTAMPTZ NOT NULL,
        discovered_at TIMESTAMPTZ NOT NULL,
        content_type VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        geography VARCHAR(50) NOT NULL,
        image_url TEXT,
        video_url TEXT,
        podcast_url TEXT,
        duration VARCHAR(50),
        source_excerpt TEXT,
        nora_summary TEXT NOT NULL,
        why_worth_knowing TEXT NOT NULL,
        tags TEXT[],
        source_priority INTEGER DEFAULT 1,
        featured BOOLEAN DEFAULT FALSE,
        secondary_recommendation VARCHAR(50),
        saved BOOLEAN DEFAULT FALSE,
        hidden BOOLEAN DEFAULT FALSE,
        content_hash VARCHAR(64) NOT NULL,
        duplicate_group_id VARCHAR(100),
        also_covered_by TEXT[],
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE news_items ADD COLUMN IF NOT EXISTS original_url TEXT;
      ALTER TABLE news_items ADD COLUMN IF NOT EXISTS resolved_url TEXT;
      ALTER TABLE news_items ADD COLUMN IF NOT EXISTS url_status VARCHAR(50) DEFAULT 'unverified';
      ALTER TABLE news_items ADD COLUMN IF NOT EXISTS url_http_status INTEGER;
      ALTER TABLE news_items ADD COLUMN IF NOT EXISTS url_last_verified_at TIMESTAMPTZ;
      ALTER TABLE news_items ADD COLUMN IF NOT EXISTS redirect_count INTEGER DEFAULT 0;

      CREATE INDEX IF NOT EXISTS idx_news_items_url_status ON news_items(url_status);

      -- Purge fabricated demo seed stories with broken/unreachable URLs
      DELETE FROM news_items WHERE id IN (
        'news_featured_1', 
        'news_video_1', 
        'news_local_1', 
        'news_podcast_1', 
        'news_housing_1', 
        'news_local_2'
      );

      -- Backfill existing valid rows with default URL integrity values if missing
      UPDATE news_items 
      SET 
        original_url = COALESCE(original_url, source_url),
        resolved_url = COALESCE(resolved_url, canonical_url, source_url),
        url_status = 'valid',
        url_last_verified_at = COALESCE(url_last_verified_at, NOW())
      WHERE url_status = 'unverified' OR resolved_url IS NULL OR original_url IS NULL;

      CREATE TABLE IF NOT EXISTS news_user_actions (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        item_id VARCHAR(100) NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- NORA Follow-Up Emails Ledger Table
      CREATE TABLE IF NOT EXISTS nora_followup_emails (
        id VARCHAR(100) PRIMARY KEY,
        conversation_id VARCHAR(100) NOT NULL,
        conversation_channel VARCHAR(50) NOT NULL DEFAULT 'voice',
        idempotency_key VARCHAR(255) NOT NULL UNIQUE,
        recipient_email VARCHAR(255) NOT NULL,
        recipient_name VARCHAR(255) NOT NULL,
        represented_agent_id VARCHAR(100),
        caller_name VARCHAR(255),
        caller_phone VARCHAR(50),
        intent VARCHAR(100),
        subject VARCHAR(255) NOT NULL,
        body_text TEXT NOT NULL,
        body_html TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        error_message TEXT,
        message_id VARCHAR(100),
        knowledge_assertion_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
        sop_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
        resource_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
        warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_nora_followup_conversation ON nora_followup_emails(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_nora_followup_recipient ON nora_followup_emails(recipient_email);
      CREATE INDEX IF NOT EXISTS idx_nora_followup_status ON nora_followup_emails(status);

      ALTER TABLE telephony_calls 
      ADD COLUMN IF NOT EXISTS follow_up_email_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS follow_up_status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS follow_up_sent_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS conversation_goal TEXT,
      ADD COLUMN IF NOT EXISTS knowledge_used_summary JSONB DEFAULT '[]'::jsonb;

      -- News editorial quality & destination accuracy columns
      ALTER TABLE news_items
        ADD COLUMN IF NOT EXISTS destination_accuracy VARCHAR(20) DEFAULT 'exact',
        ADD COLUMN IF NOT EXISTS editorial_decision VARCHAR(30) DEFAULT 'publish',
        ADD COLUMN IF NOT EXISTS editorial_rejection_reason VARCHAR(50),
        ADD COLUMN IF NOT EXISTS event_cluster_id VARCHAR(100);

      CREATE INDEX IF NOT EXISTS idx_news_items_editorial_decision ON news_items (editorial_decision);
      CREATE INDEX IF NOT EXISTS idx_news_items_destination_accuracy ON news_items (destination_accuracy);
      CREATE INDEX IF NOT EXISTS idx_news_items_canonical_url ON news_items (canonical_url);
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
  { stateKey: 'ownerBriefItems', table: 'owner_brief_items', hasWorkspaceId: true },
  { stateKey: 'directoryPeople', table: 'directory_people', hasWorkspaceId: true },
  { stateKey: 'opsSops', table: 'ops_sops', hasWorkspaceId: true },
  { stateKey: 'opsSopRuns', table: 'ops_sop_runs', hasWorkspaceId: true },
  { stateKey: 'opsFeedback', table: 'ops_feedback', hasWorkspaceId: true },
  { stateKey: 'opsImprovementRequests', table: 'ops_improvement_requests', hasWorkspaceId: true }
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
  state.profiles = state.workspaceUsers;

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
        if (mapping.stateKey === 'opsSops') {
          if (!camel.decisions || !Array.isArray(camel.decisions)) {
            camel.decisions = [];
          }
          if (!camel.requiredInfo || !Array.isArray(camel.requiredInfo)) {
            camel.requiredInfo = [];
          }
          if (!camel.steps || !Array.isArray(camel.steps)) {
            camel.steps = [];
          }
          if (!camel.versions || !Array.isArray(camel.versions)) {
            camel.versions = [];
          }
        }
        if (mapping.stateKey === 'opsSopRuns') {
          if (!camel.completedSteps || !Array.isArray(camel.completedSteps)) {
            camel.completedSteps = [];
          }
          if (!camel.blockedSteps || !Array.isArray(camel.blockedSteps)) {
            camel.blockedSteps = [];
          }
          if (!camel.stepStatuses || typeof camel.stepStatuses !== 'object') {
            camel.stepStatuses = {};
          }
          if (!camel.stepEvidence || typeof camel.stepEvidence !== 'object') {
            camel.stepEvidence = {};
          }
          if (!camel.stepNotes || typeof camel.stepNotes !== 'object') {
            camel.stepNotes = {};
          }
          if (!camel.requiredInfoData || typeof camel.requiredInfoData !== 'object') {
            camel.requiredInfoData = {};
          }
          if (!camel.timeline || !Array.isArray(camel.timeline)) {
            camel.timeline = [];
          }
        }
        if (mapping.stateKey === 'opsFeedback') {
          camel.userId = camel.submittedBy;
          camel.interactionType = camel.helpful ? 'thumbs_up' : 'thumbs_down';
          camel.reasonCodes = camel.reasons || [];
          camel.submittedBy = camel.submittedBy || 'Anonymous';
        }
        if (mapping.stateKey === 'opsImprovementRequests') {
          // Normalize DB columns back to legacy/API fields for frontend compatibility
          camel.sourceFeedbackId = camel.feedbackId;
          camel.targetType = 'sop';
          camel.targetId = camel.sopId;
          camel.title = `Improvement needed for SOP: ${camel.sopId}`;
          camel.description = camel.comment || camel.reason || 'User reported issue';
          if (camel.reason && typeof camel.reason === 'string') {
            camel.reasonCodes = camel.reason.split(', ').map((s: string) => s.trim());
          } else {
            camel.reasonCodes = [];
          }
        }
        return camel;
      });
    }
  }

  if (!state.directoryPeople || state.directoryPeople.length < 70) {
    try {
      const targetWsId = (workspaceId === 'nest-realty-demo' || workspaceId === 'nest-realty-wilmington') ? 'ws_wilmington' : workspaceId;
      for (const person of NEST_FULL_ROSTER_72) {
        await pool.query(`
          INSERT INTO directory_people (
            id, workspace_id, first_name, last_name, display_name, email, phone,
            title, role, person_type, office_ids, office_names, primary_office_id, primary_office_name,
            is_broker_in_charge, status, tags, source, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            workspace_id = EXCLUDED.workspace_id,
            display_name = EXCLUDED.display_name,
            title = EXCLUDED.title,
            role = EXCLUDED.role,
            person_type = EXCLUDED.person_type,
            office_ids = EXCLUDED.office_ids,
            office_names = EXCLUDED.office_names,
            primary_office_id = EXCLUDED.primary_office_id,
            primary_office_name = EXCLUDED.primary_office_name,
            is_broker_in_charge = EXCLUDED.is_broker_in_charge,
            status = EXCLUDED.status,
            tags = EXCLUDED.tags,
            source = EXCLUDED.source,
            updated_at = NOW();
        `, [
          person.id, targetWsId, person.firstName, person.lastName, person.displayName,
          person.email, person.phone, person.title, person.role, person.personType,
          person.officeIds || ['mayfaire'], person.officeNames || ['Mayfaire'],
          person.primaryOfficeId || 'mayfaire', person.primaryOfficeName || 'Mayfaire',
          person.isBrokerInCharge || false, person.status || 'active',
          person.tags || ['agent'], person.source || 'nest_2026_agents_sheet'
        ]);
      }
      const reloaded = await pool.query(
        'SELECT * FROM directory_people WHERE workspace_id = $1 OR workspace_id = \'ws_wilmington\'',
        [workspaceId]
      );
      state.directoryPeople = reloaded.rows.map(row => convertKeysToCamel(row));
    } catch (e) {
      console.error('Failed to seed DB directory_people:', e);
      state.directoryPeople = NEST_FULL_ROSTER_72.map(p => ({ ...p, workspaceId: 'ws_wilmington' }));
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
      const resolvedUserId = userRes.rows.length > 0 ? userRes.rows[0].id : (wu.id || `usr_${Math.random().toString(36).substring(2, 11)}`);
      const userRow = convertKeysToSnake({
        id: resolvedUserId,
        email: wu.email,
        name: wu.name,
        passwordHash: wu.passwordHash || null,
        status: wu.status || 'active'
      });
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
        if (mapping.stateKey === 'opsSops') {
          dbRow.sop_id = item.sopId || item.id;
          dbRow.purpose = item.purpose || item.description || item.title || 'Standard Operating Procedure';
          dbRow.expected_outcome = item.expected_outcome || item.expectedOutcome || 'Successful execution of process.';
          dbRow.trigger_type = item.triggerType || 'manual_start';
          dbRow.status = item.status || 'published';
          dbRow.version = item.version || '1.0';
        }
        if (mapping.stateKey === 'opsSopRuns') {
          dbRow.sop_id = item.sopId || dbRow.sop_id || 'sop_unknown';
          dbRow.sop_version = item.sopVersion || dbRow.sop_version || '1.0';
          dbRow.started_by = item.startedBy || dbRow.started_by || 'system';
          dbRow.status = item.status || dbRow.status || 'completed';
        }
        if (mapping.stateKey === 'opsFeedback') {
          dbRow.reasons = item.reasonCodes || item.reasons || [];
          dbRow.submitted_by = item.submittedBy || item.userId || 'Anonymous';
        }
        if (mapping.stateKey === 'opsImprovementRequests') {
          console.log('[DEBUG DB IR] item:', JSON.stringify(item));
          console.log('[DEBUG DB IR] initial dbRow:', JSON.stringify(dbRow));
          dbRow.feedback_id = item.sourceFeedbackId || item.feedbackId;
          
          let resolvedSopId = item.sopId;
          let resolvedSopVersion = item.sopVersion || '1.0';
          
          const targetId = item.targetId || item.sopId;
          if (targetId) {
            if (targetId.startsWith('run_')) {
              const runs = state.opsSopRuns || [];
              const run = runs.find((r: any) => r.id === targetId);
              if (run) {
                resolvedSopId = run.sopId;
                resolvedSopVersion = run.sopVersion;
              }
            } else {
              resolvedSopId = targetId;
            }
          }
          
          dbRow.sop_id = resolvedSopId || 'sop_unknown';
          dbRow.sop_version = resolvedSopVersion;
          dbRow.reason = item.reason || (item.reasonCodes ? item.reasonCodes.join(', ') : 'user_feedback');
          dbRow.comment = item.comment || item.description || 'Improvement needed';
          console.log('[DEBUG DB IR] final dbRow:', JSON.stringify(dbRow));
        }
      }

      // Replace invalid string timestamps like 'Never' with null to satisfy TIMESTAMPTZ database constraints
      for (const k of Object.keys(dbRow)) {
        if (dbRow[k] === 'Never') {
          dbRow[k] = null;
        }
        
        // Clean and normalize JSONB columns to avoid double-stringification errors
        const isJsonColumn = [
          'dns_records', 'steps', 'findings', 'sample_messaging', 'filters', 
          'raw_payload', 'payload', 'response', 'proposed_action', 
          'completion_evidence', 'escalation_behavior', 'governance', 'decision_rules',
          'decisions', 'required_info', 'versions', 'completed_steps', 'blocked_steps',
          'step_statuses', 'step_evidence', 'step_notes', 'required_info_data', 'timeline', 'reasons'
        ].includes(k);
        
        if (isJsonColumn && dbRow[k] !== null && dbRow[k] !== undefined) {
          if (typeof dbRow[k] === 'string') {
            try {
              const parsed = JSON.parse(dbRow[k]);
              if (typeof parsed === 'string') {
                dbRow[k] = JSON.parse(parsed);
              } else {
                dbRow[k] = parsed;
              }
            } catch (e) {
              // Not a valid JSON string, leave as is
            }
          }
          if (typeof dbRow[k] === 'object') {
            dbRow[k] = JSON.stringify(dbRow[k]);
          }
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
    { id: 'usr_admin', email: 'admin@shapework.co', name: 'Platform Admin', password: 'shapework2026' },
    { id: 'usr_admin_invalid', email: 'admin@shapework.invalid', name: 'Platform Admin', password: 'shapework2026' },
    { id: 'usr_marcus', email: 'marcus@shapework.co', name: 'Marcus', password: 'shapework2026' },
    { id: 'usr_adam', email: 'adam@shapework.co', name: 'Adam', password: 'shapework2026' },
    { id: 'usr_matt', email: 'matt@shapework.co', name: 'Matt', password: 'shapework2026' }
  ];

  for (const sa of superAdmins) {
    try {
      const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [sa.email]);
      let userId = sa.id;
      const pwdHash = hashPassword(sa.password);

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

      // Check workspace membership for both canonical ws_wilmington and demo
      const targetWorkspaces = ['ws_wilmington', 'nest-realty-demo'];
      for (const wsId of targetWorkspaces) {
        // Ensure workspace exists
        const wsRes = await pool.query('SELECT 1 FROM workspaces WHERE id = $1', [wsId]);
        if (wsRes.rows.length > 0) {
          const memRes = await pool.query(
            'SELECT 1 FROM workspace_memberships WHERE workspace_id = $1 AND user_id = $2',
            [wsId, userId]
          );
          const permissions = [
            'view_work_queue', 'manage_work_queue', 'view_deals', 'manage_deals',
            'view_compliance', 'manage_compliance', 'approve_actions', 'manage_integrations',
            'manage_users', 'configure_routing', 'view_audit', 'export_audit',
            'manage_workspace', 'access_developer_tools',
            'directory.read', 'directory.manage', 'directory.sync',
            'org_chart.read', 'org_chart.write', 'org_chart.audit.read',
            'sops.read', 'sops.write', 'sops.delete',
            'owner_digest.read', 'owner_digest.configure',
            'ai.use', 'ai.generate_sop', 'ai.review_sop', 'ai.analyze_knowledge', 'ai.answer_from_knowledge', 'ai.manage_prompts'
          ];
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
      }
    } catch (err) {
      console.error(`[Database] Error ensuring Super Admin ${sa.email}:`, err);
    }
  }
}

export const PILOT_TEAM_USERS = [
  { id: 'usr_ryan', email: 'ryan@nestrealty.com', name: 'Ryan Crecelius', role: 'owner', password: 'Ih@tep@$$word$' },
  { id: 'usr_matt_full', email: 'matt.orr@nestrealty.com', name: 'Matt Orr', role: 'bic', password: 'Ih@tep@$$word$' },
  { id: 'usr_matt_nest', email: 'matt@nestrealty.com', name: 'Matt Orr', role: 'bic', password: 'Ih@tep@$$word$' },
  { id: 'usr_matt', email: 'matt@shapework.co', name: 'Matt', role: 'admin', password: 'shapework2026' },
  { id: 'usr_marcus_nest', email: 'marcus@nestrealty.com', name: 'Marcus Aman', role: 'admin', password: 'Ih@tep@$$word$' },
  { id: 'usr_marcus', email: 'marcus@shapework.co', name: 'Marcus Aman', role: 'admin', password: 'shapework2026' },
  { id: 'usr_marcus_ai', email: 'marcus@capefearai.com', name: 'Marcus Aman', role: 'admin', password: 'Ih@tep@$$word$' },
  { id: 'usr_admin', email: 'admin@shapework.co', name: 'Platform Admin', role: 'admin', password: 'shapework2026' },
  { id: 'usr_adam', email: 'adam@shapework.co', name: 'Adam', role: 'admin', password: 'shapework2026' },
  { id: 'usr_melissa_mg', email: 'mg@nestrealty.com', name: 'Melissa Gagliardi', role: 'marketing_coordinator', password: 'Ih@tep@$$word$' },
  { id: 'usr_melissa', email: 'melissa@nestrealty.com', name: 'Melissa Gagliardi', role: 'marketing_coordinator', password: 'Ih@tep@$$word$' },
  { id: 'usr_melissa_full', email: 'melissa.gagliardi@nestrealty.com', name: 'Melissa Gagliardi', role: 'marketing_coordinator', password: 'Ih@tep@$$word$' },
  { id: 'usr_ann', email: 'ann@nestrealty.com', name: 'Ann Gunn', role: 'operations_lead', password: 'Ih@tep@$$word$' },
  { id: 'usr_ann_full', email: 'ann.gunn@nestrealty.com', name: 'Ann Gunn', role: 'operations_lead', password: 'Ih@tep@$$word$' },
  { id: 'usr_james', email: 'james@nestrealty.com', name: 'James Fort', role: 'transaction_coordinator', password: 'Ih@tep@$$word$' },
  { id: 'usr_james_full', email: 'james.fort@nestrealty.com', name: 'James Fort', role: 'transaction_coordinator', password: 'Ih@tep@$$word$' },
  { id: 'usr_eric', email: 'eric@nestrealty.com', name: 'Eric Knight', role: 'bic', password: 'Ih@tep@$$word$' },
  { id: 'usr_eric_full', email: 'eric.knight@nestrealty.com', name: 'Eric Knight', role: 'bic', password: 'Ih@tep@$$word$' },
  { id: 'usr_jessica_full', email: 'jessica.keenan@nestrealty.com', name: 'Jessica Keenan', role: 'bic', password: 'Ih@tep@$$word$' },
  { id: 'usr_jessica', email: 'jessica@nestrealty.com', name: 'Jessica Keenan', role: 'bic', password: 'Ih@tep@$$word$' },
  { id: 'usr_eduardo_full', email: 'eduardo.lovo@nestrealty.com', name: 'Eduardo Lovo', role: 'marketing_coordinator', password: 'Ih@tep@$$word$' },
  { id: 'usr_eduardo', email: 'eduardo@nestrealty.com', name: 'Eduardo Lovo', role: 'marketing_coordinator', password: 'Ih@tep@$$word$' },
  { id: 'usr_asknora', email: 'asknora@nestrealty.com', name: 'Nora Operations Assistant', role: 'operations_lead', password: 'Ih@tep@$$word$' },
  { id: 'usr_asknora_dash', email: 'ask-nora@nestrealty.com', name: 'Nora Operations Assistant', role: 'operations_lead', password: 'Ih@tep@$$word$' }
];

export async function ensurePilotUsersExist(pool: pg.Pool) {
  for (const pu of PILOT_TEAM_USERS) {
    try {
      const userRes = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [pu.email.trim()]);
      let userId = pu.id;
      const pwdHash = hashPassword(pu.password);

      if (userRes.rows.length === 0) {
        await pool.query(
          'INSERT INTO users (id, email, name, password_hash, status) VALUES ($1, $2, $3, $4, $5)',
          [userId, pu.email.toLowerCase().trim(), pu.name, pwdHash, 'active']
        );
        console.log(`[Database] Seeded Pilot User: ${pu.email} (${pu.name})`);
      } else {
        userId = userRes.rows[0].id;
        await pool.query(
          'UPDATE users SET password_hash = $1, status = $2, name = $3 WHERE id = $4',
          [pwdHash, 'active', pu.name, userId]
        );
      }

      const targetWorkspaces = ['ws_wilmington', 'nest-realty-demo', 'nest-realty-wilmington'];
      for (const wsId of targetWorkspaces) {
        const wsRes = await pool.query('SELECT 1 FROM workspaces WHERE id = $1', [wsId]);
        if (wsRes.rows.length > 0) {
          const memRes = await pool.query(
            'SELECT 1 FROM workspace_memberships WHERE workspace_id = $1 AND user_id = $2',
            [wsId, userId]
          );
          const permissions = [
            'view_work_queue', 'manage_work_queue', 'view_deals', 'manage_deals',
            'view_compliance', 'manage_compliance', 'approve_actions', 'manage_integrations',
            'manage_users', 'configure_routing', 'view_audit', 'export_audit',
            'manage_workspace', 'directory.read', 'directory.manage', 'directory.sync',
            'org_chart.read', 'org_chart.write', 'org_chart.audit.read',
            'sops.read', 'sops.write', 'sops.delete',
            'owner_digest.read', 'owner_digest.configure',
            'ai.use', 'ai.generate_sop', 'ai.review_sop', 'ai.analyze_knowledge', 'ai.answer_from_knowledge', 'ai.manage_prompts',
            'contract_authoring', 'marketing.campaign.read_all', 'marketing.campaign.create', 'marketing.campaign.approve', 'marketing.campaign.export', 'marketing.ask'
          ];
          if (memRes.rows.length === 0) {
            await pool.query(
              'INSERT INTO workspace_memberships (id, workspace_id, user_id, role, permissions) VALUES ($1, $2, $3, $4, $5)',
              [`m_${userId}_${wsId}`, wsId, userId, pu.role, permissions]
            );
          } else {
            await pool.query(
              'UPDATE workspace_memberships SET role = $1, permissions = $2 WHERE workspace_id = $3 AND user_id = $4',
              [pu.role, permissions, wsId, userId]
            );
          }
        }
      }
    } catch (err) {
      console.error(`[Database] Error ensuring Pilot User ${pu.email}:`, err);
    }
  }
}
