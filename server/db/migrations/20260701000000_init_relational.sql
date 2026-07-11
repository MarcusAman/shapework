-- PostgreSQL Schema Migration: 20260701000000_init_relational.sql

-- 1. WORKSPACES
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

-- 2. USERS
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. WORKSPACE MEMBERSHIPS
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

-- 4. OPERATING RECORDS
CREATE TABLE IF NOT EXISTS operating_records (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    vertical VARCHAR(100),
    status VARCHAR(50),
    workflow_map_ids TEXT[],
    system_map_ids TEXT[],
    quick_win_ids TEXT[],
    build_sprint_ids TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ROLE OWNERSHIP (Responsibilities)
CREATE TABLE IF NOT EXISTS role_ownership (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    responsibility_title VARCHAR(255) NOT NULL,
    primary_owner_role VARCHAR(100),
    backup_owner_role VARCHAR(100),
    sla VARCHAR(255),
    escalation_rule VARCHAR(255),
    current_pain_level VARCHAR(50),
    notes TEXT,
    ownership_status VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. WORKFLOW TEMPLATES
CREATE TABLE IF NOT EXISTS workflow_templates (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_event VARCHAR(255),
    category VARCHAR(100),
    steps JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ACTIVE WORKFLOWS
CREATE TABLE IF NOT EXISTS active_workflows (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    template_id VARCHAR(100) REFERENCES workflow_templates(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'running',
    current_step_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. OPPORTUNITIES (Operational Priorities)
CREATE TABLE IF NOT EXISTS opportunities (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    estimated_hours_saved NUMERIC(6, 2),
    complexity VARCHAR(50),
    status VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. QUICK WINS
CREATE TABLE IF NOT EXISTS quick_wins (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    impact VARCHAR(255),
    status VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. BUILD SPRINTS
CREATE TABLE IF NOT EXISTS build_sprints (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    duration_weeks INTEGER,
    status VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    property_address TEXT NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    buyer_or_seller VARCHAR(50) NOT NULL,
    responsible_agent_id VARCHAR(100),
    transaction_coordinator_id VARCHAR(100),
    current_stage VARCHAR(100),
    expected_closing_date DATE,
    health_score INTEGER DEFAULT 100,
    risk_level VARCHAR(50) DEFAULT 'healthy',
    outstanding_milestones_count INTEGER DEFAULT 0,
    latest_update TEXT,
    source_system VARCHAR(50),
    risk_reasons TEXT[],
    revenue INTEGER DEFAULT 0,
    waiting_on VARCHAR(100),
    next_action TEXT,
    last_verified_update VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. TRANSACTION CHECKLISTS (Tasks)
CREATE TABLE IF NOT EXISTS transaction_checklists (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    transaction_id VARCHAR(100) REFERENCES transactions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50),
    category VARCHAR(100),
    evidence TEXT,
    priority VARCHAR(50),
    blocking_reason TEXT,
    property VARCHAR(255),
    due_date DATE,
    assigned_to_role VARCHAR(100),
    assigned_to_name VARCHAR(100),
    is_automated BOOLEAN DEFAULT FALSE,
    time_saved_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. WORK ITEMS (Inbox/Compliance tasks)
CREATE TABLE IF NOT EXISTS work_items (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    source VARCHAR(100) NOT NULL,
    related_type VARCHAR(100),
    related_id VARCHAR(100),
    related_label VARCHAR(255),
    assigned_to_role VARCHAR(100) NOT NULL,
    backup_owner_role VARCHAR(100),
    source_system VARCHAR(100),
    priority VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    recommended_next_action TEXT,
    approval_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13b. BROKERAGE ENTRY POINTS
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

-- 14. APPROVALS
CREATE TABLE IF NOT EXISTS approvals (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    proposed_action TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. APPROVAL EVENTS
CREATE TABLE IF NOT EXISTS approval_events (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    approval_id VARCHAR(100) NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
    actor_user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. AUDIT EVENTS
CREATE TABLE IF NOT EXISTS audit_events (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_name VARCHAR(255),
    user_role VARCHAR(100),
    action_description TEXT NOT NULL,
    impact_area VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. INTEGRATION CONNECTIONS
CREATE TABLE IF NOT EXISTS integration_connections (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    connected BOOLEAN DEFAULT FALSE NOT NULL,
    last_sync TIMESTAMPTZ,
    permissions_granted TEXT[],
    records_synchronized INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. INTEGRATION EVENTS
CREATE TABLE IF NOT EXISTS integration_events (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    source VARCHAR(100) NOT NULL,
    payload JSONB,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. IMPORT RUNS
CREATE TABLE IF NOT EXISTS import_runs (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    source VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    records_imported INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. PILOT SUCCESS CRITERIA
CREATE TABLE IF NOT EXISTS pilot_success_criteria (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    metric_name VARCHAR(255) NOT NULL,
    target_value VARCHAR(100),
    current_value VARCHAR(100),
    is_met BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. DAILY CHECK-INS
CREATE TABLE IF NOT EXISTS daily_check_ins (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. LAUNCH PACKS
CREATE TABLE IF NOT EXISTS launch_packs (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    export_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_workspaces_status ON workspaces(status);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_workspace_memberships_workspace_id ON workspace_memberships(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_memberships_user_id ON workspace_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_operating_records_workspace_id ON operating_records(workspace_id);
CREATE INDEX IF NOT EXISTS idx_role_ownership_workspace_id ON role_ownership(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_workspace_id ON workflow_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_active_workflows_workspace_id ON active_workflows(workspace_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_workspace_id ON opportunities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_quick_wins_workspace_id ON quick_wins(workspace_id);
CREATE INDEX IF NOT EXISTS idx_build_sprints_workspace_id ON build_sprints(workspace_id);
CREATE INDEX IF NOT EXISTS idx_transactions_workspace_id ON transactions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_transactions_expected_closing_date ON transactions(expected_closing_date);
CREATE INDEX IF NOT EXISTS idx_transactions_risk_level ON transactions(risk_level);
CREATE INDEX IF NOT EXISTS idx_transaction_checklists_workspace_id ON transaction_checklists(workspace_id);
CREATE INDEX IF NOT EXISTS idx_work_items_workspace_id ON work_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_work_items_assigned_to_role ON work_items(assigned_to_role);
CREATE INDEX IF NOT EXISTS idx_work_items_status ON work_items(status);
CREATE INDEX IF NOT EXISTS idx_approvals_workspace_id ON approvals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_approval_events_workspace_id ON approval_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_workspace_id ON audit_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at);
CREATE INDEX IF NOT EXISTS idx_integration_connections_workspace_id ON integration_connections(workspace_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_workspace_id ON integration_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_import_runs_workspace_id ON import_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pilot_success_criteria_workspace_id ON pilot_success_criteria(workspace_id);
CREATE INDEX IF NOT EXISTS idx_daily_check_ins_workspace_id ON daily_check_ins(workspace_id);
CREATE INDEX IF NOT EXISTS idx_launch_packs_workspace_id ON launch_packs(workspace_id);

ALTER TABLE transaction_checklists ADD COLUMN IF NOT EXISTS priority VARCHAR(50);
ALTER TABLE transaction_checklists ADD COLUMN IF NOT EXISTS blocking_reason TEXT;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS risk_reasons TEXT[];
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS revenue INTEGER DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS waiting_on VARCHAR(100);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS last_verified_update VARCHAR(100);

ALTER TABLE transactions ALTER COLUMN expected_closing_date DROP NOT NULL;

-- 23. SENDING DOMAINS
CREATE TABLE IF NOT EXISTS sending_domains (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    dns_records JSONB,
    daily_sending_limit INTEGER DEFAULT 1000,
    is_paused BOOLEAN DEFAULT FALSE,
    bounce_warning_status VARCHAR(50) DEFAULT 'healthy',
    complaint_warning_status VARCHAR(50) DEFAULT 'healthy',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 24. SENDING ACCOUNTS
CREATE TABLE IF NOT EXISTS sending_accounts (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    domain_id VARCHAR(100) NOT NULL REFERENCES sending_domains(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 25. CONTACTS
CREATE TABLE IF NOT EXISTS contacts (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    role VARCHAR(100),
    contact_type VARCHAR(50) NOT NULL DEFAULT 'lead',
    source VARCHAR(100) NOT NULL,
    source_detail TEXT,
    relationship_status VARCHAR(50) DEFAULT 'nurture',
    market VARCHAR(100),
    tags TEXT[],
    crm_external_id VARCHAR(100),
    annual_volume NUMERIC(15, 2) DEFAULT 0,
    stage VARCHAR(50) DEFAULT 'Target',
    priority VARCHAR(50) DEFAULT 'Medium',
    notes TEXT,
    last_action VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 26. CONTACT SOURCES
CREATE TABLE IF NOT EXISTS contact_sources (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    source_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 27. AUDIENCES
CREATE TABLE IF NOT EXISTS audiences (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 28. AUDIENCE CONTACTS
CREATE TABLE IF NOT EXISTS audience_contacts (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    audience_id VARCHAR(100) NOT NULL REFERENCES audiences(id) ON DELETE CASCADE,
    contact_id VARCHAR(100) NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (audience_id, contact_id)
);

-- 29. SEGMENTS
CREATE TABLE IF NOT EXISTS segments (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    filters JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 30. PLAYBOOKS
CREATE TABLE IF NOT EXISTS playbooks (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) REFERENCES workspaces(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    target_audience_type VARCHAR(100),
    goal TEXT,
    sequence_length INTEGER,
    suggested_tone VARCHAR(50),
    suggested_cta TEXT,
    sample_messaging JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 31. CAMPAIGNS
CREATE TABLE IF NOT EXISTS campaigns (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    playbook_id VARCHAR(100) REFERENCES playbooks(id) ON DELETE SET NULL,
    audience_id VARCHAR(100) REFERENCES audiences(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    goal TEXT,
    tone VARCHAR(50),
    market VARCHAR(100),
    cta TEXT,
    offer TEXT,
    created_by VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    launch_date VARCHAR(100),
    paused_at VARCHAR(100),
    completed_at VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 32. CAMPAIGN STEPS
CREATE TABLE IF NOT EXISTS campaign_steps (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    campaign_id VARCHAR(100) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    delay_days INTEGER NOT NULL DEFAULT 0,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    send_window_start VARCHAR(50),
    send_window_end VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 33. CAMPAIGN ENROLLMENTS
CREATE TABLE IF NOT EXISTS campaign_enrollments (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    campaign_id VARCHAR(100) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id VARCHAR(100) NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'queued',
    current_step INTEGER DEFAULT 1,
    last_sent_at VARCHAR(100),
    next_send_at VARCHAR(100),
    stopped_reason VARCHAR(100),
    reply_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 34. EMAIL MESSAGES
CREATE TABLE IF NOT EXISTS email_messages (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    campaign_id VARCHAR(100) REFERENCES campaigns(id) ON DELETE SET NULL,
    campaign_step_id VARCHAR(100) REFERENCES campaign_steps(id) ON DELETE SET NULL,
    contact_id VARCHAR(100) REFERENCES contacts(id) ON DELETE SET NULL,
    provider VARCHAR(50) NOT NULL,
    provider_message_id VARCHAR(255),
    from_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'queued',
    sent_at VARCHAR(100),
    delivered_at VARCHAR(100),
    opened_at VARCHAR(100),
    clicked_at VARCHAR(100),
    bounced_at VARCHAR(100),
    complained_at VARCHAR(100),
    unsubscribed_at VARCHAR(100),
    replied_at VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 35. EMAIL EVENTS
CREATE TABLE IF NOT EXISTS email_events (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email_message_id VARCHAR(100) REFERENCES email_messages(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    timestamp VARCHAR(100) NOT NULL,
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 36. REPLIES
CREATE TABLE IF NOT EXISTS replies (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email_message_id VARCHAR(100) REFERENCES email_messages(id) ON DELETE SET NULL,
    contact_id VARCHAR(100) REFERENCES contacts(id) ON DELETE SET NULL,
    from_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    received_at VARCHAR(100) NOT NULL,
    is_handled BOOLEAN DEFAULT FALSE,
    assigned_user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    recommended_action TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 37. REPLY CLASSIFICATIONS
CREATE TABLE IF NOT EXISTS reply_classifications (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    reply_id VARCHAR(100) NOT NULL REFERENCES replies(id) ON DELETE CASCADE,
    classification VARCHAR(100) NOT NULL,
    confidence NUMERIC(4, 2) DEFAULT 1.0,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 38. SUPPRESSION LIST
CREATE TABLE IF NOT EXISTS suppression_list (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    reason VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, email)
);

-- 39. UNSUBSCRIBE EVENTS
CREATE TABLE IF NOT EXISTS unsubscribe_events (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    campaign_id VARCHAR(100) REFERENCES campaigns(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 40. BOUNCE EVENTS
CREATE TABLE IF NOT EXISTS bounce_events (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    bounce_type VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 41. COMPLAINT EVENTS
CREATE TABLE IF NOT EXISTS complaint_events (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    complaint_type VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 42. COMPLIANCE CHECKS
CREATE TABLE IF NOT EXISTS compliance_checks (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    campaign_id VARCHAR(100) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    checked_by VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    findings JSONB,
    run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 43. PROVIDER LOGS
CREATE TABLE IF NOT EXISTS provider_logs (
    id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    request_type VARCHAR(100) NOT NULL,
    payload JSONB,
    response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Runtime extensions for growth engine integration
ALTER TABLE transaction_checklists ADD COLUMN IF NOT EXISTS contact_id VARCHAR(100) REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE transaction_checklists ADD COLUMN IF NOT EXISTS campaign_id VARCHAR(100) REFERENCES campaigns(id) ON DELETE SET NULL;
ALTER TABLE transaction_checklists ADD COLUMN IF NOT EXISTS reply_id VARCHAR(100) REFERENCES replies(id) ON DELETE SET NULL;
ALTER TABLE transaction_checklists ADD COLUMN IF NOT EXISTS task_type VARCHAR(100);


