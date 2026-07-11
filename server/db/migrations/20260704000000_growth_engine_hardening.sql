-- Hardening Migration: Growth Engine Constraints, Schema Alterations and Indexes

-- 1. Apply runtime alters explicitly inside migration
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS annual_volume NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS stage VARCHAR(50) DEFAULT 'Target',
ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'Medium',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS last_action VARCHAR(255);

ALTER TABLE transaction_checklists 
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100) REFERENCES transactions(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS assigned_to_role VARCHAR(100),
ADD COLUMN IF NOT EXISTS assigned_to_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_automated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS time_saved_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS contact_id VARCHAR(100) REFERENCES contacts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS campaign_id VARCHAR(100) REFERENCES campaigns(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reply_id VARCHAR(100) REFERENCES replies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS task_type VARCHAR(100);

ALTER TABLE sending_domains
ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ;

-- 2. Uniqueness constraints/indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_unique_workspace_email ON contacts (workspace_id, email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_messages_unique_provider_msg_id ON email_messages (provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_suppression_list_unique_workspace_email ON suppression_list (workspace_id, email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_audience_contacts_unique_aud_con ON audience_contacts (audience_id, contact_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_playbooks_unique_workspace_name ON playbooks (workspace_id, name);

-- 3. Indexes on workspace_id / brokerage_id
CREATE INDEX IF NOT EXISTS idx_sending_domains_workspace_id ON sending_domains(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sending_accounts_workspace_id ON sending_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contacts_workspace_id ON contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contact_sources_workspace_id ON contact_sources(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audiences_workspace_id ON audiences(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audience_contacts_workspace_id ON audience_contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_playbooks_workspace_id ON playbooks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_id ON campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaign_steps_workspace_id ON campaign_steps(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_workspace_id ON campaign_enrollments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_workspace_id ON email_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_events_workspace_id ON email_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_replies_workspace_id ON replies(workspace_id);
CREATE INDEX IF NOT EXISTS idx_reply_classifications_workspace_id ON reply_classifications(workspace_id);
CREATE INDEX IF NOT EXISTS idx_suppression_list_workspace_id ON suppression_list(workspace_id);
CREATE INDEX IF NOT EXISTS idx_unsubscribe_events_workspace_id ON unsubscribe_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bounce_events_workspace_id ON bounce_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_complaint_events_workspace_id ON complaint_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_workspace_id ON compliance_checks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_provider_logs_workspace_id ON provider_logs(workspace_id);

-- 4. Indexes on campaign_id
CREATE INDEX IF NOT EXISTS idx_campaign_steps_campaign_id ON campaign_steps(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_campaign_id ON campaign_enrollments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_campaign_id ON email_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_unsubscribe_events_campaign_id ON unsubscribe_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_campaign_id ON compliance_checks(campaign_id);

-- 5. Indexes on contact_id
CREATE INDEX IF NOT EXISTS idx_audience_contacts_contact_id ON audience_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_contact_id ON campaign_enrollments(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_contact_id ON email_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_replies_contact_id ON replies(contact_id);

-- 6. Indexes on email_message_id
CREATE INDEX IF NOT EXISTS idx_email_events_email_message_id ON email_events(email_message_id);
CREATE INDEX IF NOT EXISTS idx_replies_email_message_id ON replies(email_message_id);

-- 7. Indexes on provider_message_id
CREATE INDEX IF NOT EXISTS idx_email_messages_provider_msg_id ON email_messages(provider_message_id);

-- 8. Indexes on status
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_status ON campaign_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_email_messages_status ON email_messages(status);

-- 9. Indexes on created_at
CREATE INDEX IF NOT EXISTS idx_sending_domains_created_at ON sending_domains(created_at);
CREATE INDEX IF NOT EXISTS idx_sending_accounts_created_at ON sending_accounts(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_sources_created_at ON contact_sources(created_at);
CREATE INDEX IF NOT EXISTS idx_audiences_created_at ON audiences(created_at);
CREATE INDEX IF NOT EXISTS idx_audience_contacts_created_at ON audience_contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_playbooks_created_at ON playbooks(created_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_campaign_steps_created_at ON campaign_steps(created_at);
CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_created_at ON campaign_enrollments(created_at);
CREATE INDEX IF NOT EXISTS idx_email_messages_created_at ON email_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON email_events(created_at);
CREATE INDEX IF NOT EXISTS idx_replies_created_at ON replies(created_at);
CREATE INDEX IF NOT EXISTS idx_reply_classifications_created_at ON reply_classifications(created_at);
CREATE INDEX IF NOT EXISTS idx_suppression_list_created_at ON suppression_list(created_at);
CREATE INDEX IF NOT EXISTS idx_unsubscribe_events_created_at ON unsubscribe_events(created_at);
CREATE INDEX IF NOT EXISTS idx_bounce_events_created_at ON bounce_events(created_at);
CREATE INDEX IF NOT EXISTS idx_complaint_events_created_at ON complaint_events(created_at);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_created_at ON compliance_checks(created_at);
CREATE INDEX IF NOT EXISTS idx_provider_logs_created_at ON provider_logs(created_at);
