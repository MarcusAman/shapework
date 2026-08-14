import pg from 'pg';
import crypto from 'crypto';
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
    invitations: 0,
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

    // 2. USERS (Pending activation with NO preassigned / shared passwords)
    const uatUsers = [
      { id: 'usr_ryan_bic', email: 'ryan@nestrealty.com', name: 'Ryan Crecelius', role: 'owner', wsId: 'ws_wilmington' },
      { id: 'usr_matt_orr', email: 'matt.orr@nestrealty.com', name: 'Matt Orr', role: 'admin', wsId: 'ws_wilmington' },
      { id: 'usr_melissa_ops', email: 'melissa@nestrealty.com', name: 'Melissa Operations', role: 'admin', wsId: 'ws_wilmington' },
      { id: 'usr_taylor_morgan', email: 'taylor.morgan@nestrealty.com', name: 'Taylor Morgan', role: 'events', wsId: 'ws_wilmington' },
      // Synthetic test accounts on non-deliverable .invalid domain
      { id: 'usr_uat_admin', email: 'uat-admin@shapework.invalid', name: 'UAT Test Administrator', role: 'admin', wsId: 'uat_workspace_a' },
      { id: 'usr_uat_member', email: 'uat-member@shapework.invalid', name: 'UAT Standard Member', role: 'events', wsId: 'uat_workspace_a' },
      { id: 'usr_uat_attacker_b', email: 'uat-tenant-b@shapework.invalid', name: 'UAT Tenant B User', role: 'admin', wsId: 'uat_workspace_b' }
    ];

    for (const u of uatUsers) {
      await client.query(`
        INSERT INTO users (id, email, name, password_hash, status, security_version)
        VALUES ($1, $2, $3, NULL, 'pending_activation', 1)
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = NULL, status = 'pending_activation', security_version = users.security_version + 1;
      `, [u.id, u.email, u.name]);
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

      // Create cryptographically random invitation token (hashed at rest)
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const invId = `inv_${u.id}_${Date.now()}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      await client.query(`
        INSERT INTO invitation_tokens (id, user_id, workspace_id, token_hash, role, permissions, expires_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (token_hash) DO NOTHING;
      `, [invId, u.id, u.wsId, tokenHash, u.role, perms, expiresAt]);
      counts.invitations++;
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

    // 5. STANDARD OPERATING PROCEDURES (SOPs)
    const sops = [
      {
        id: 'sop_listing_launch_001',
        workspaceId: 'ws_wilmington',
        tenantId: 'ws_wilmington',
        title: 'Listing Launch Protocol',
        purpose: 'Defines the end-to-end steps required to launch a new residential listing for Nest Realty Wilmington.',
        trigger: 'Signed Listing Agreement Received',
        processOwner: 'Melissa Operations',
        reviewer: 'Matt Orr',
        status: 'published',
        version: '2.0',
        orderedSteps: [
          { order: 1, title: 'Intake and Document Audit', description: 'Confirm MLS Exclusive Right to Sell is fully executed.', role: 'Transaction Coordinator' },
          { order: 2, title: 'Photography and Media Dispatch', description: 'Schedule twilight and HDR photography shoot.', role: 'Marketing Coordinator' },
          { order: 3, title: 'Sign Vendor Post Installation', description: 'Submit work order for post installation in yard.', role: 'Operations Assistant' },
          { order: 4, title: 'MLS Entry & Broker-in-Charge Review', description: 'Input all property details into NCRMLS as Incoming.', role: 'Listing Agent / BIC' }
        ],
        systemsUsed: ['NCRMLS', 'Dotloop', 'Marketing Studio', 'Sign Post Dispatch']
      },
      {
        id: 'sop_contract_verification_002',
        workspaceId: 'ws_wilmington',
        tenantId: 'ws_wilmington',
        title: 'Buyer Contract Verification & EMD Audit Protocol',
        purpose: 'Ensures strict compliance with NC Real Estate Commission rules for Earnest Money Deposits and Due Diligence Fees.',
        trigger: 'Executed Form 2-T Offer Received',
        processOwner: 'Matt Orr',
        reviewer: 'Ryan Crecelius',
        status: 'published',
        version: '1.0',
        orderedSteps: [
          { order: 1, title: 'Verify Due Diligence & EMD Deliverables', description: 'Confirm escrow agent receipt within 3 banking days.', role: 'Broker-in-Charge' },
          { order: 2, title: 'Dotloop File Compliance Review', description: 'Check all disclosures, Working With Real Estate Agents brochure, and addenda.', role: 'Transaction Coordinator' }
        ],
        systemsUsed: ['Dotloop', 'NC REC Escrow Ledger']
      },
      {
        id: 'sop_marketing_intake_003',
        workspaceId: 'ws_wilmington',
        tenantId: 'ws_wilmington',
        title: 'Marketing Intake & Campaign Dispatch Protocol',
        purpose: 'Standardizes property marketing brochures, digital assets, and social campaigns.',
        trigger: 'New Listing Status Active in MLS',
        processOwner: 'Sarah Jenkins',
        reviewer: 'Melissa Operations',
        status: 'draft',
        version: '1.0',
        orderedSteps: [
          { order: 1, title: 'Generate Print Assets', description: 'Create 4-page property brochure.', role: 'Marketing Coordinator' }
        ],
        systemsUsed: ['Canva', 'Print Partner Portal']
      },
      {
        id: 'sop_sign_vendor_004',
        workspaceId: 'ws_wilmington',
        tenantId: 'ws_wilmington',
        title: 'Sign Vendor Dispatch & Post Retrieval Protocol',
        purpose: 'Coordinates sign post installation, maintenance, and post-closing retrieval.',
        trigger: 'Listing Under Contract or Closed',
        processOwner: 'Melissa Operations',
        reviewer: 'Matt Orr',
        status: 'draft',
        version: '1.0',
        orderedSteps: [
          { order: 1, title: 'Submit Removal Order', description: 'Notify sign vendor of closing date for pickup.', role: 'Operations Assistant' }
        ],
        systemsUsed: ['Sign Post Portal']
      },
      {
        id: 'sop_buyer_onboarding_005',
        workspaceId: 'ws_wilmington',
        tenantId: 'ws_wilmington',
        title: 'Buyer Representation & Agency Onboarding Protocol',
        purpose: 'Mandates agency disclosure and representation agreement execution prior to showing properties.',
        trigger: 'New Buyer Consultation',
        processOwner: 'Ryan Crecelius',
        reviewer: 'Matt Orr',
        status: 'published',
        version: '1.0',
        orderedSteps: [
          { order: 1, title: 'Present Working with Real Estate Agents', description: 'Review agency options at first substantial contact.', role: 'Buyer Agent' },
          { order: 2, title: 'Execute Exclusive Buyer Agency Agreement', description: 'Establish legal agency before showing properties.', role: 'Buyer Agent' }
        ],
        systemsUsed: ['Dotloop']
      }
    ];

    for (const sop of sops) {
      await client.query(`
        INSERT INTO sop_drafts (
          id, workspace_id, tenant_id, title, purpose, trigger, process_owner, reviewer,
          status, version, ordered_steps, systems_used, revision_count, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1, NOW())
        ON CONFLICT (id) DO UPDATE SET 
          title = EXCLUDED.title,
          status = EXCLUDED.status,
          ordered_steps = EXCLUDED.ordered_steps,
          updated_at = NOW();
      `, [
        sop.id,
        sop.workspaceId,
        sop.tenantId,
        sop.title,
        sop.purpose,
        sop.trigger,
        sop.processOwner,
        sop.reviewer,
        sop.status,
        sop.version,
        JSON.stringify(sop.orderedSteps),
        sop.systemsUsed
      ]);
      counts.sops++;
    }

    // 6. OWNER DIGEST CONFIGURATION (Disabled by default, no recipients)
    for (const ws of workspaces) {
      await client.query(`
        INSERT INTO owner_digest_configs (
          workspace_id, enabled, recipients, day_of_week, delivery_time,
          workspace_timezone, include_needs_attention, include_open_requests,
          include_resolved_last_week, version, updated_at, updated_by
        )
        VALUES ($1, FALSE, '{}', 'monday', '08:00', 'America/New_York', TRUE, TRUE, TRUE, 1, NOW(), 'system_init')
        ON CONFLICT (workspace_id) DO UPDATE SET enabled = FALSE, recipients = '{}', updated_at = NOW();
      `, [ws.id]);
      counts.digestConfigs++;
    }

    await client.query('COMMIT');
    console.log('[UAT Seed Runner] Seed completed successfully with counts:', counts);
    return { success: true, counts };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[UAT Seed Runner] Seed failed with error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1]?.endsWith('seedUatData.ts')) {
  seedUatData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
