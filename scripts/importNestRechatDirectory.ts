import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pg from 'pg';
import dotenv from 'dotenv';
import { parseNestRechatRow, NormalizedDirectoryPerson } from '../server/persistence/nestRechatParser.js';

dotenv.config();

function printHelp() {
  console.log(`
Nest Rechat Roster Positional Importer CLI
Usage:
  npm run directory:import:nest-rechat -- --file "/secure/path/to/roster.txt" --workspace "nest-realty-wilmington" [options]

Options:
  --file <path>        Path to the tab-separated roster file (Required)
  --workspace <id>     Workspace ID to import into (Default: nest-realty-wilmington)
  --apply              Execute the database changes (If omitted, runs in --preview mode)
  --preview            Generate a structured import preview report (Default)
  --help               Show this help message
`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  // Parse arguments
  const getArgVal = (name: string): string => {
    const prefix = `${name}=`;
    const arg = args.find(a => a.startsWith(prefix));
    if (arg) return arg.slice(prefix.length).replace(/^['"]|['"]$/g, '');
    const idx = args.indexOf(name);
    if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
    return '';
  };

  const filepath = getArgVal('--file');
  const workspaceId = getArgVal('--workspace') || 'nest-realty-wilmington';
  const apply = args.includes('--apply');

  if (!filepath) {
    console.error('Error: --file argument is required.');
    printHelp();
    process.exit(1);
  }

  const absPath = path.resolve(filepath);
  if (!fs.existsSync(absPath)) {
    console.error(`Error: Roster file not found at ${absPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(absPath, 'utf-8');
  const rawLines = content.split(/\r?\n/);
  
  console.log(`Loading roster file from: ${absPath}`);
  console.log(`Target Workspace: ${workspaceId}`);
  console.log(`Mode: ${apply ? 'APPLY (Writing changes)' : 'PREVIEW (Dry run)'}\n`);

  const candidates: NormalizedDirectoryPerson[] = [];
  let totalRows = 0;
  let sectionRowsIgnored = 0;

  for (let idx = 0; idx < rawLines.length; idx++) {
    const line = rawLines[idx];
    if (!line.trim()) continue;
    totalRows++;

    const parts = line.split('\t');
    const person = parseNestRechatRow(parts, workspaceId);
    if (person) {
      candidates.push(person);
    } else {
      sectionRowsIgnored++;
    }
  }

  console.log(`Total non-empty lines found: ${totalRows}`);
  console.log(`Section/Header rows ignored: ${sectionRowsIgnored}`);
  console.log(`Total person candidates parsed: ${candidates.length}\n`);

  // Count distinct categories for preview stats
  let activeCount = 0;
  let emailOnlyCount = 0;
  let needsReviewCount = 0;
  let missingEmail = 0;
  let missingPhone = 0;
  let missingOffice = 0;
  let missingRole = 0;
  let invalidEmail = 0;
  let invalidPhone = 0;

  const distinctOffices = new Set<string>();
  const distinctRoles = new Set<string>();

  for (const c of candidates) {
    if (c.status === 'active') activeCount++;
    if (c.status === 'needs_review') needsReviewCount++;
    if (c.communicationPreference === 'email_only') emailOnlyCount++;

    if (!c.email) missingEmail++;
    else if (c.tags.includes('invalid-email-format')) invalidEmail++;

    if (!c.phone) missingPhone++;
    else if (c.tags.includes('phone-needs-review')) invalidPhone++;

    if (c.primaryOfficeName === 'Unknown') missingOffice++;
    if (c.tags.includes('role-needs-review')) missingRole++;

    distinctOffices.add(c.primaryOfficeName);
    distinctRoles.add(c.rawRole);
  }

  // Connect to DB and fetch existing people to calculate duplicate, insert, update counts
  const connectionString = process.env.DATABASE_URL;
  let dbPeople: any[] = [];
  let pool: pg.Pool | null = null;

  // Also query local JSON database to match items
  const localDbPath = path.join(process.cwd(), 'data', 'db.json');
  let localDbPeople: any[] = [];
  if (fs.existsSync(localDbPath)) {
    try {
      const dbState = JSON.parse(fs.readFileSync(localDbPath, 'utf-8'));
      localDbPeople = dbState.directoryPeople || [];
    } catch {}
  }

  if (connectionString) {
    pool = new pg.Pool({ connectionString });
    try {
      // Create schema if needed
      const schemaCheck = await pool.query("SELECT to_regclass('public.directory_people')");
      if (schemaCheck.rows[0].to_regclass) {
        const res = await pool.query('SELECT * FROM directory_people WHERE workspace_id = $1', [workspaceId]);
        dbPeople = res.rows.map(row => {
          // convert snake keys to camel for local mapping comparison
          const camelRow: any = {};
          for (const k of Object.keys(row)) {
            const camelKey = k.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            camelRow[camelKey] = row[k];
          }
          return camelRow;
        });
      }
    } catch (dbErr: any) {
      console.warn(`Warning: Failed to fetch existing database records: ${dbErr.message}`);
    }
  }

  // Fallback to local db.json if database is empty or not configured
  const existingRecords = dbPeople.length > 0 ? dbPeople : localDbPeople.filter((p: any) => p.workspaceId === workspaceId);

  const newPeople: NormalizedDirectoryPerson[] = [];
  const updatedPeople: { existing: any; proposed: NormalizedDirectoryPerson }[] = [];
  const unchangedPeople: NormalizedDirectoryPerson[] = [];
  const duplicateCandidates: { proposed: NormalizedDirectoryPerson; existing: any; reason: string }[] = [];

  for (const c of candidates) {
    // Find matching person in DB based on normalized business email, normalized phone, display_name + office, or source_row_key
    const matched = existingRecords.find(p => {
      const emailMatch = c.email && p.email && p.email.toLowerCase() === c.email.toLowerCase();
      const phoneMatch = c.phone && p.phone && p.phone.replace(/\D/g, '') === c.phone.replace(/\D/g, '');
      const nameOfficeMatch = p.displayName && p.displayName.toLowerCase() === c.displayName.toLowerCase() && p.primaryOfficeName && p.primaryOfficeName.toLowerCase() === c.primaryOfficeName.toLowerCase();
      const keyMatch = p.sourceRowKey === c.sourceRowKey;
      return emailMatch || phoneMatch || nameOfficeMatch || keyMatch;
    });

    if (!matched) {
      newPeople.push(c);
    } else {
      // If matches but emails/phones are different, flag as possible duplicate candidates
      const diffEmail = c.email && matched.email && matched.email.toLowerCase() !== c.email.toLowerCase();
      const diffPhone = c.phone && matched.phone && matched.phone.replace(/\D/g, '') !== c.phone.replace(/\D/g, '');
      if (diffEmail || diffPhone) {
        duplicateCandidates.push({
          proposed: c,
          existing: matched,
          reason: diffEmail ? 'Different email for same name' : 'Different phone for same name'
        });
      }

      const isChanged =
        matched.displayName !== c.displayName ||
        matched.email !== c.email ||
        matched.phone !== c.phone ||
        matched.role !== c.role ||
        matched.personType !== c.personType ||
        matched.primaryOfficeName !== c.primaryOfficeName ||
        matched.status !== c.status ||
        matched.communicationPreference !== c.communicationPreference;

      if (isChanged) {
        updatedPeople.push({ existing: matched, proposed: c });
      } else {
        unchangedPeople.push(c);
      }
    }
  }

  // --- 14. PRINT IMPORT PREVIEW ---
  console.log('==================================================');
  console.log('                 IMPORT PREVIEW                   ');
  console.log('==================================================');
  console.log(`Total Person Candidates:   ${candidates.length}`);
  console.log(`  - Active:                ${activeCount}`);
  console.log(`  - Email-only:            ${emailOnlyCount}`);
  console.log(`  - Needs Review:          ${needsReviewCount}`);
  console.log(`Missing Email:             ${missingEmail}`);
  console.log(`Missing Phone:             ${missingPhone}`);
  console.log(`Missing Office:            ${missingOffice}`);
  console.log(`Missing Role:              ${missingRole}`);
  console.log(`Invalid Email:             ${invalidEmail}`);
  console.log(`Invalid Phone:             ${invalidPhone}`);
  console.log(`Possible Duplicates:       ${duplicateCandidates.length}`);
  console.log(`New People to Insert:      ${newPeople.length}`);
  console.log(`Existing People to Update: ${updatedPeople.length}`);
  console.log(`Unchanged People:          ${unchangedPeople.length}`);
  console.log('--------------------------------------------------\n');

  console.log('Proposed Records Table (First 15 candidates shown):');
  const tableRows = candidates.slice(0, 15).map(c => {
    let action = 'INSERT';
    const isUpdate = updatedPeople.some(up => up.proposed.id === c.id);
    const isUnchanged = unchangedPeople.some(up => up.id === c.id);
    if (isUpdate) action = 'UPDATE';
    else if (isUnchanged) action = 'UNCHANGED';

    const warnings: string[] = [];
    if (c.tags.includes('incomplete-contact')) warnings.push('No Email/Phone');
    if (c.tags.includes('invalid-email-format')) warnings.push('Invalid Email');
    if (c.tags.includes('phone-needs-review')) warnings.push('Invalid Phone');
    if (c.tags.includes('role-needs-review')) warnings.push('Unknown Role');
    if (c.tags.includes('office-needs-review')) warnings.push('Unknown Office');
    if (c.tags.includes('source-marked-x')) warnings.push('Marked X');

    return {
      Name: c.displayName,
      Email: c.email || '(none)',
      Phone: c.phone || '(none)',
      'Raw Role': c.rawRole || '(none)',
      'Norm Role': c.role || '(none)',
      'Raw Office': c.rawOffice || '(none)',
      'Norm Office': c.primaryOfficeName,
      Type: c.personType,
      Status: c.status,
      Warnings: warnings.join(', ') || 'none',
      Action: action
    };
  });
  console.table(tableRows);

  const receiptDir = path.join(process.cwd(), 'data', 'receipts');
  const previewDir = path.join(process.cwd(), 'data', 'previews');
  fs.mkdirSync(receiptDir, { recursive: true });
  fs.mkdirSync(previewDir, { recursive: true });

  const fileHash = crypto.createHash('sha256').update(content).digest('hex');
  const timestamp = new Date().toISOString();

  // Save preview artifact
  const previewFilename = `preview_${fileHash.slice(0, 10)}_${Date.now()}.json`;
  const previewPath = path.join(previewDir, previewFilename);
  fs.writeFileSync(previewPath, JSON.stringify({
    timestamp,
    fileHash,
    filepath,
    summary: {
      candidates: candidates.length,
      active: activeCount,
      emailOnly: emailOnlyCount,
      needsReview: needsReviewCount,
      missingEmail,
      missingPhone,
      newCount: newPeople.length,
      updateCount: updatedPeople.length,
      duplicateCount: duplicateCandidates.length
    },
    candidates
  }, null, 2));

  console.log(`Generated preview artifact saved at: data/previews/${previewFilename}`);

  if (!apply) {
    console.log('\nPreview completed. Run with --apply to execute import.');
    if (pool) await pool.end();
    process.exit(0);
  }

  // --- 15. APPLY IMPORT (EXECUTE UPSERTS) ---
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  // A. local db.json upsert
  if (fs.existsSync(localDbPath)) {
    console.log('Applying import to local JSON database...');
    try {
      const dbState = JSON.parse(fs.readFileSync(localDbPath, 'utf-8'));
      if (!dbState.directoryPeople) dbState.directoryPeople = [];
      
      for (const c of candidates) {
        const existingIdx = dbState.directoryPeople.findIndex((p: any) => p.id === c.id || p.email && c.email && p.email.toLowerCase() === c.email.toLowerCase());
        if (existingIdx === -1) {
          dbState.directoryPeople.push({
            ...c,
            createdAt: timestamp,
            updatedAt: timestamp,
            lastSyncedAt: timestamp
          });
          inserted++;
        } else {
          // Keep manual properties
          const existing = dbState.directoryPeople[existingIdx];
          dbState.directoryPeople[existingIdx] = {
            ...existing,
            ...c,
            updatedAt: timestamp,
            lastSyncedAt: timestamp
          };
          updated++;
        }
      }
      fs.writeFileSync(localDbPath, JSON.stringify(dbState, null, 2));
      console.log(`Local JSON DB updated: ${inserted} inserted/added, ${updated} updated.`);
    } catch (err: any) {
      console.error(`Warning: Failed to update local JSON database: ${err.message}`);
    }
  }

  // B. PostgreSQL upsert
  if (connectionString) {
    console.log('Applying import to PostgreSQL database...');
    if (!pool) pool = new pg.Pool({ connectionString });
    
    // Verify workspace exists or insert it
    try {
      const wsRes = await pool.query('SELECT id FROM workspaces WHERE id = $1', [workspaceId]);
      if (wsRes.rows.length === 0) {
        console.log(`Workspace ${workspaceId} not found, inserting bootstrap record...`);
        await pool.query(
          "INSERT INTO workspaces (id, name, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())",
          [workspaceId, 'Nest Realty Wilmington']
        );
      }
    } catch (err: any) {
      console.error(`Error verifying workspace in DB: ${err.message}`);
      if (pool) await pool.end();
      process.exit(1);
    }

    const client = await pool.connect();
    let pgInserted = 0;
    let pgUpdated = 0;
    try {
      await client.query('BEGIN');

      for (const c of candidates) {
        // Find existing record
        const res = await client.query('SELECT * FROM directory_people WHERE id = $1', [c.id]);
        if (res.rows.length === 0) {
          const insertQuery = `
            INSERT INTO directory_people (
              id, workspace_id, first_name, middle_name, last_name, display_name,
              email, phone, title, role, team, person_type, is_broker_in_charge,
              is_team_leader, raw_role, primary_office_name, office_names, status,
              communication_preference, tags, source, source_parser_version, source_row_key,
              created_at, updated_at, last_synced_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW(), NOW(), NOW())
          `;
          const values = [
            c.id, workspaceId, c.firstName, c.middleName || null, c.lastName, c.displayName,
            c.email || null, c.phone || null, c.title || null, c.role || null, c.team || null,
            c.personType, c.isBrokerInCharge, c.isTeamLeader, c.rawRole, c.primaryOfficeName,
            c.officeNames, c.status, c.communicationPreference, c.tags, c.source,
            c.sourceParserVersion, c.sourceRowKey
          ];
          await client.query(insertQuery, values);
          pgInserted++;
        } else {
          const matched = res.rows[0];
          // Update only when changed
          const isChanged =
            matched.display_name !== c.displayName ||
            matched.email !== c.email ||
            matched.phone !== c.phone ||
            matched.role !== c.role ||
            matched.person_type !== c.personType ||
            matched.primary_office_name !== c.primaryOfficeName ||
            matched.status !== c.status ||
            matched.communication_preference !== c.communicationPreference;

          if (isChanged) {
            const updateQuery = `
              UPDATE directory_people SET
                first_name = $1,
                middle_name = $2,
                last_name = $3,
                display_name = $4,
                email = $5,
                phone = $6,
                title = $7,
                role = $8,
                team = $9,
                person_type = $10,
                is_broker_in_charge = $11,
                is_team_leader = $12,
                raw_role = $13,
                primary_office_name = $14,
                office_names = $15,
                status = $16,
                communication_preference = $17,
                tags = $18,
                source = $19,
                source_parser_version = $20,
                source_row_key = $21,
                updated_at = NOW(),
                last_synced_at = NOW()
              WHERE id = $22
            `;
            const values = [
              c.firstName, c.middleName || null, c.lastName, c.displayName,
              c.email || null, c.phone || null, c.title || null, c.role || null, c.team || null,
              c.personType, c.isBrokerInCharge, c.isTeamLeader, c.rawRole, c.primaryOfficeName,
              c.officeNames, c.status, c.communicationPreference, c.tags, c.source,
              c.sourceParserVersion, c.sourceRowKey, matched.id
            ];
            await client.query(updateQuery, values);
            pgUpdated++;
          }
        }
      }

      await client.query('COMMIT');
      console.log(`PostgreSQL DB updated: ${pgInserted} inserted, ${pgUpdated} updated.`);
    } catch (err: any) {
      await client.query('ROLLBACK');
      errors++;
      console.error(`Error applying PostgreSQL database changes: ${err.message}`);
    } finally {
      client.release();
    }
  }

  // Generate Import Receipt
  const receiptFilename = `receipt_${fileHash.slice(0, 10)}_${Date.now()}.json`;
  const receiptPath = path.join(receiptDir, receiptFilename);

  const receipt = {
    parserVersion: 'nest_rechat_roster_v1',
    workspaceId,
    sourceFilenameHash: fileHash,
    importTimestamp: timestamp,
    initiatedBy: 'CLI_importer',
    totalRows,
    inserted,
    updated,
    skipped,
    needsReview: needsReviewCount,
    invalid: invalidEmail + invalidPhone,
    duplicateCandidates: duplicateCandidates.length,
    errors
  };

  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));

  console.log('\n==================================================');
  console.log('                 IMPORT RECEIPT                   ');
  console.log('==================================================');
  console.log(`Receipt File:           data/receipts/${receiptFilename}`);
  console.log(`Total Rows Parsed:      ${receipt.totalRows}`);
  console.log(`Inserted Records:       ${receipt.inserted}`);
  console.log(`Updated Records:        ${receipt.updated}`);
  console.log(`Skipped (Unchanged):    ${receipt.skipped}`);
  console.log(`Needs Review:           ${receipt.needsReview}`);
  console.log(`Errors encountered:     ${receipt.errors}`);
  console.log('==================================================\n');

  if (pool) await pool.end();
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
