-- Migration: Automated Vendor Dispatch, Work Orders & Lockbox Fleet Inventory
-- Date: 2026-08-18
-- Description: Creates normalized tables for tracking third-party vendor orders (Coastal Sign Post Co., HDR Media Calendar), physical Supra lockbox fleet inventory, and incoming webhook audit logs.

CREATE TABLE IF NOT EXISTS vendor_orders (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL,
    vendor_type VARCHAR(64) NOT NULL, -- 'coastal_sign_post', 'hdr_media', 'supra_lockbox'
    vendor_name VARCHAR(255) NOT NULL,
    property_address VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(64),
    sop_run_id VARCHAR(64),
    sop_step_number INTEGER,
    status VARCHAR(32) NOT NULL DEFAULT 'dispatched', -- 'dispatched', 'confirmed', 'in_progress', 'completed', 'cancelled'
    details JSONB DEFAULT '{}',
    vendor_order_id VARCHAR(128),
    requested_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    cost NUMERIC(10, 2),
    created_by VARCHAR(255) NOT NULL DEFAULT 'Operations Desk',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_orders_ws ON vendor_orders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_vendor_orders_type ON vendor_orders(vendor_type);
CREATE INDEX IF NOT EXISTS idx_vendor_orders_status ON vendor_orders(status);
CREATE INDEX IF NOT EXISTS idx_vendor_orders_run ON vendor_orders(sop_run_id);

CREATE TABLE IF NOT EXISTS lockbox_inventory (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL,
    serial_number VARCHAR(64) NOT NULL UNIQUE,
    model VARCHAR(64) NOT NULL DEFAULT 'Supra iBox BT LE',
    shackle_code VARCHAR(32) NOT NULL,
    current_property_address VARCHAR(255),
    assigned_agent_name VARCHAR(255),
    battery_level INTEGER NOT NULL DEFAULT 95,
    status VARCHAR(32) NOT NULL DEFAULT 'in_inventory', -- 'in_inventory', 'assigned_in_field', 'maintenance'
    last_accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lockbox_ws ON lockbox_inventory(workspace_id);
CREATE INDEX IF NOT EXISTS idx_lockbox_status ON lockbox_inventory(status);
CREATE INDEX IF NOT EXISTS idx_lockbox_serial ON lockbox_inventory(serial_number);

CREATE TABLE IF NOT EXISTS vendor_webhook_logs (
    id VARCHAR(64) PRIMARY KEY,
    vendor_type VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'processed',
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_webhook_type ON vendor_webhook_logs(vendor_type);
