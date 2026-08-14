import pg from 'pg';
import crypto from 'crypto';
import { hashPassword } from '../server/auth/password.js';
import { NEST_FULL_ROSTER_72 } from '../server/persistence/nestRosterSeed.js';

export async function seedUatData(connectionString?: string): Promise<{ success: boolean; counts: Record<string, number> }> {
  const dbUrl = connectionString || process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is required for seed runner.');
  }

  const pool = new pg.Pool({ connectionString: dbUrl, max: 2 });
  const client = await pool.connect();
  const counts: Record<string, number> = {
    workspaces: 0,
    users: 0,
    memberships: 0,
    directory: 0,
    orgPositions: 0,
    sops: 0,
    digestConfigs: 0
  };

  try {
    console.log('[UAT Seed Runner] Starting transactional seed of approved synthetic UAT data...');
    await client.query('BEGIN');

    // 1. WORKSPACES
    const workspaces = [
      { id: 'ws_wilmington', name: 'Nest Realty Wilmington (Mayfaire)', slug: 'nest-wilmington', launchOwner: 'Ryan Crecelius' },
      { id: 'ws_carolina_beach', name: 'Nest Realty Carolina Beach', slug: 'nest-carolina-beach', launchOwner: 'Matt Orr' },
      { id: 'uat_workspace_a', name: 'Nest UAT Workspace A', slug: 'nest-uat-a', launchOwner: 'UAT Lead' },
      { id: 'uat_workspace_b', name: 'Nest UAT Workspace B', slug: 'nest-uat-b', launchOwner: 'UAT Lead B' }
    ];

    for (const ws of workspaces) {
      await client.query(`
        INSERT INTO workspaces (id, name, slug, industry, status, phase, launch_owner)
        VALUES ($1, $2, $3, 'real_estate_brokerage', 'active', 'production', $4)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = 'active';
      `, [ws.id, ws.name, ws.slug, ws.launchOwner]);
      counts.workspaces++;
    }

    // 2. USERS & MEMBERSHIPS
    const defaultPasswordHash = await hashPassword('NestUAT2026!Secure');
    const uatUsers = [
      { id: 'usr_ryan_bic', email: 'ryan@nestrealty.com', name: 'Ryan Crecelius', role: 'owner', wsId: 'ws_wilmington' },
      { id: 'usr_matt_orr', email: 'matt.orr@nestrealty.com', name: 'Matt Orr', role: 'admin', wsId: 'ws_wilmington' },
      { id: 'usr_melissa_ops', email: 'melissa@nestrealty.com', name: 'Melissa Operations', role: 'admin', wsId: 'ws_wilmington' },
      { id: 'usr_taylor_morgan', email: 'taylor.morgan@nestrealty.com', name: 'Taylor Morgan', role: 'events', wsId: 'ws_wilmington' },
      { id: 'usr_uat_admin', email: 'uat-admin@nestrealty.com', name: 'UAT Test Administrator', role: 'admin', wsId: 'uat_workspace_a' },
      { id: 'usr_uat_member', email: 'uat-member@nestrealty.com', name: 'UAT Standard Member', role: 'events', wsId: 'uat_workspace_a' }
    ];

    for (const u of uatUsers) {
      await client.query(`
        INSERT INTO users (id, email, name, password_hash, status)
        VALUES ($1, $2, $3, $4, 'active')
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, status = 'active';
      `, [u.id, u.email, u.name, defaultPasswordHash]);
      counts.users++;

      const perms = u.role === 'owner' 
        ? ['*'] 
        : u.role === 'admin' 
        ? ['view_work_queue', 'org_chart.read', 'org_chart.write', 'org_chart.delete', 'sops.read', 'sops.write', 'sops.delete', 'directory.read', 'directory.manage', 'owner_digest.read', 'owner_digest.configure']
        : ['view_work_queue', 'org_chart.read', 'sops.read', 'directory.read'];

      await client.query(`
        INSERT INTO workspace_memberships (id, workspace_id, user_id, role, permissions)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role, permissions = EXCLUDED.permissions;
      `, [`mem_${u.id}_${u.wsId}`, u.wsId, u.id, u.role, perms]);
      counts.memberships++;
    }

    // 3. DIRECTORY PEOPLE
    const roster = NEST_FULL_ROSTER_72 || [];
    for (const p of roster) {
      const pId = p.id || `person_${counts.directory + 1}`;
      await client.query(`
        INSERT INTO directory_people (
          id, workspace_id, first_name, last_name, display_name, title, role, team,
          email, phone, status, is_broker_in_charge, is_team_leader, source
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', $11, $12, 'roster_seed')
        ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, email = EXCLUDED.email;
      `, [
        pId,
        p.workspaceId || 'ws_wilmington',
        p.firstName || p.name?.split(' ')[0] || 'Agent',
        p.lastName || p.name?.split(' ')[1] || 'Associate',
        p.displayName || p.name || 'Nest Agent',
        p.title || 'Broker Associate',
        p.role || 'Agent',
        p.team || 'General Brokerage',
        p.email || `${pId}@nestrealty.com`,
        p.phone || '(910) 555-0100',
        p.isBIC || false,
        p.isTeamLeader || false
      ]);
      counts.directory++;
    }

    // 4. ORG CHART POSITIONS
    const positions = [
      { id: 'pos_ryan_bic', title: 'Principal Broker / Owner', name: 'Ryan Crecelius', email: 'ryan@nestrealty.com', reportsTo: null },
      { id: 'pos_matt_bic', title: 'Managing Broker-in-Charge', name: 'Matt Orr', email: 'matt.orr@nestrealty.com', reportsTo: 'pos_ryan_bic' },
      { id: 'pos_melissa_ops', title: 'Director of Operations & TC', name: 'Melissa Operations', email: 'melissa@nestrealty.com', reportsTo: 'pos_matt_bic' },
      { id: 'pos_mktg_lead', title: 'Marketing Coordinator', name: 'Sarah Jenkins', email: 'marketing@nestrealty.com', reportsTo: 'pos_melissa_ops' },
      { id: 'pos_taylor_morgan', title: 'Senior Broker Associate', name: 'Taylor Morgan', email: 'taylor.morgan@nestrealty.com', reportsTo: 'pos_matt_bic' }
    ];

    for (const pos of positions) {
      await client.query(`
        INSERT INTO org_chart_positions (id, workspace_id, title, name, email, reports_to_id, version)
        VALUES ($1, 'ws_wilmington', $2, $3, $4, $5, 1)
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, name = EXCLUDED.name, reports_to_id = EXCLUDED.reports_to_id;
      `, [pos.id, pos.title, pos.name, pos.email, pos.reportsTo]);
      counts.orgPositions++;
    }

    // 5. STANDARD OPERATING PROCEDURES (SOPS)
    const sops = [
      {
        id: 'sop_listing_launch_001',
        title: 'Listing Launch Protocol',
        purpose: 'End-to-end execution protocol for launching residential real estate listings from professional photography to MLS activation and marketing distribution.',
        trigger: 'Executed listing agreement signed and returned by seller.',
        processOwner: 'Melissa — Transaction Coordinator',
        reviewer: 'Matt Orr — Broker-in-Charge',
        status: 'published',
        version: '2.0',
        steps: [
          { stepNumber: 1, action: 'Validate executed Exclusive Right to Sell Listing Agreement & WWREA in Dotloop.', role: 'Transaction Coordinator' },
          { stepNumber: 2, action: 'Schedule HDR photography, floor plan scan, and drone videography.', role: 'Listing Agent' },
          { stepNumber: 3, action: 'Dispatch Coastal Sign Post Co. work order for yard post & brochure box installation.', role: 'Admin Coordinator' },
          { stepNumber: 4, action: 'Install Bluetooth Supra lockbox on property and verify shackle code.', role: 'Listing Agent' },
          { stepNumber: 5, action: 'Collect Seller Property Disclosures (RPOADS & MOG) and upload to Dotloop.', role: 'Transaction Coordinator' },
          { stepNumber: 6, action: 'Draft MLS listing in NC Regional MLS with room dimensions and tax PIN.', role: 'Transaction Coordinator' },
          { stepNumber: 7, action: 'Submit listing draft to BIC Matt Orr for compliance review and approval.', role: 'Broker-in-Charge' },
          { stepNumber: 8, action: 'Trigger automated Just Listed social media campaign blitz and direct mail.', role: 'Marketing Coordinator' }
        ]
      },
      {
        id: 'sop_contract_verification_002',
        title: 'Buyer Contract Verification & EMD Audit Protocol',
        purpose: 'Auditing executed NC REALTORS® Form 2-T purchase offers, verifying earnest money escrow timelines, and establishing closing compliance ledgers.',
        trigger: 'Executed Form 2-T Offer to Purchase and Contract received.',
        processOwner: 'Matt Orr — Broker-in-Charge',
        reviewer: 'Matt Orr — BIC',
        status: 'published',
        version: '1.0',
        steps: [
          { stepNumber: 1, action: 'Audit Form 2-T execution dates, signature initials, and DD fee delivery confirmation.', role: 'Broker-in-Charge' },
          { stepNumber: 2, action: 'Verify Initial Earnest Money Deposit (EMD) is deposited into attorney escrow trust within 72 hours.', role: 'Transaction Coordinator' },
          { stepNumber: 3, action: 'Calculate critical milestone deadlines: Due Diligence expiration and Settlement Date.', role: 'Transaction Coordinator' }
        ]
      }
    ];

    for (const sop of sops) {
      await client.query(`
        INSERT INTO sop_drafts (
          id, workspace_id, tenant_id, title, purpose, trigger, process_owner, reviewer,
          status, version, ordered_steps, created_at, updated_at
        )
        VALUES ($1, 'ws_wilmington', 'ws_wilmington', $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, ordered_steps = EXCLUDED.ordered_steps, status = EXCLUDED.status;
      `, [sop.id, sop.title, sop.purpose, sop.trigger, sop.processOwner, sop.reviewer, sop.status, sop.version, JSON.stringify(sop.steps)]);
      counts.sops++;
    }

    // 6. OWNER DIGEST CONFIGURATION (Disabled by default, no recipients)
    await client.query(`
      INSERT INTO owner_digest_configs (
        workspace_id, enabled, recipients, day_of_week, delivery_time, workspace_timezone
      )
      VALUES ('ws_wilmington', FALSE, '{}', 'monday', '08:00', 'America/New_York')
      ON CONFLICT (workspace_id) DO UPDATE SET enabled = FALSE, recipients = '{}';
    `);
    counts.digestConfigs++;

    await client.query('COMMIT');
    console.log('[UAT Seed Runner] Seed completed successfully:', counts);
    return { success: true, counts };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[UAT Seed Runner] Seed failed, transaction rolled back:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] && process.argv[1].endsWith('seedUatData.ts')) {
  seedUatData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
