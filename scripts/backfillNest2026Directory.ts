/**
 * Nest 2026 Agents Directory Backfill Script
 * 
 * Fetches the 2026 Agents worksheet from the Nest Realty Google Sheet
 * and upserts all valid people into the directory_people table via
 * the running server's API.
 * 
 * Usage:
 *   npm run directory:backfill:nest-2026 -- --preview     (default, dry run)
 *   npm run directory:backfill:nest-2026 -- --apply        (execute upsert)
 * 
 * Parser: nest_2026_agents_positional_v1
 * 
 * @license SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// ─── Configuration ───────────────────────────────────────────────────────────

const DEFAULT_SPREADSHEET_ID = '1ESWBGGQTz614hT_t1WNLtDHAZz7pApRy';
const DEFAULT_WORKSHEET     = '2026 Agents';
const DEFAULT_WORKSPACE_ID  = 'nest-realty-demo';
const PARSER_VERSION        = 'nest_2026_agents_positional_v1';
const SERVER_BASE_URL       = process.env.BACKFILL_SERVER_URL || 'http://localhost:3049';

// ─── Positional Column Map (A=0, B=1, ... N=13) ─────────────────────────────
const COL = {
  MARKER: 0,
  DATE_1: 1,
  SOURCE_ID: 2,
  LICENSE: 3,
  PHONE: 4,
  NAME: 5,
  EMAIL: 6,
  ROLE: 7,
  OFFICE: 8,
  STREET: 9,
  CITY_STATE: 10,
  DATE_2: 11,
  ALT_EMAIL: 12,
} as const;

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface ParsedPerson {
  id: string;
  workspaceId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  phoneDigitsOnly: string;
  title: string;
  role: string;
  team: string;
  rawRole: string;
  rawOffice: string;
  primaryOfficeName: string;
  officeNames: string[];
  personType: 'leadership' | 'staff' | 'agent' | 'assistant' | 'contractor' | 'other';
  isBrokerInCharge: boolean;
  isTeamLeader: boolean;
  status: 'active' | 'inactive' | 'needs_review';
  communicationPreference: 'standard' | 'email_only';
  tags: string[];
  source: string;
  sourceParserVersion: string;
  sourceRowKey: string;
  sourceSpreadsheetId: string;
  sourceSheetName: string;
  rowNumber: number;
  warnings: string[];
}

interface BackfillReceipt {
  parserVersion: string;
  workspaceId: string;
  spreadsheetId: string;
  worksheetName: string;
  executionTimestamp: string;
  initiatedBy: string;
  rowsRead: number;
  rowsIgnored: number;
  insertedCount: number;
  updatedCount: number;
  unchangedCount: number;
  needsReviewCount: number;
  duplicateCount: number;
  invalidCount: number;
  errors: string[];
}

// ─── Office Normalization ────────────────────────────────────────────────────

const OFFICE_ALIASES: Record<string, string> = {
  'mayfaire': 'Mayfaire',
  'wilmington': 'Mayfaire',
  'carolina beach': 'Carolina Beach',
  'hampstead': 'Hampstead',
  'home': 'Remote / Home',
  'remote': 'Remote / Home',
  'n/a': 'Unknown',
};

function normalizeOffice(raw: string): { name: string; needsReview: boolean } {
  const trimmed = raw.trim();
  if (!trimmed) return { name: 'Unknown', needsReview: true };
  const lower = trimmed.toLowerCase();
  const alias = OFFICE_ALIASES[lower];
  if (alias) return { name: alias, needsReview: false };
  return { name: trimmed, needsReview: true };
}

// ─── Phone Normalization ─────────────────────────────────────────────────────

function normalizePhone(raw: string): { normalized: string; digitsOnly: string; needsReview: boolean } {
  const cleaned = raw.trim();
  if (!cleaned) return { normalized: '', digitsOnly: '', needsReview: false };
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length === 10) {
    return {
      normalized: `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`,
      digitsOnly: digits,
      needsReview: false,
    };
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    const d10 = digits.slice(1);
    return {
      normalized: `(${d10.slice(0, 3)}) ${d10.slice(3, 6)}-${d10.slice(6)}`,
      digitsOnly: d10,
      needsReview: false,
    };
  }
  return { normalized: cleaned, digitsOnly: digits, needsReview: true };
}

// ─── Email Validation ────────────────────────────────────────────────────────

function validateEmail(email: string): boolean {
  const t = email.trim();
  if (!t) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

// ─── Name Parsing ────────────────────────────────────────────────────────────

function parseName(fullName: string): { firstName: string; middleName: string; lastName: string; displayName: string } {
  const displayName = fullName.trim().replace(/\s+/g, ' ');
  const tokens = displayName.split(' ').filter(Boolean);
  if (tokens.length === 0) return { firstName: '', middleName: '', lastName: '', displayName };
  if (tokens.length === 1) return { firstName: tokens[0], middleName: '', lastName: '', displayName };
  if (tokens.length === 2) return { firstName: tokens[0], middleName: '', lastName: tokens[1], displayName };
  return {
    firstName: tokens[0],
    middleName: tokens.slice(1, -1).join(' '),
    lastName: tokens[tokens.length - 1],
    displayName,
  };
}

// ─── Role Normalization ─────────────────────────────────────────────────────

function normalizeRole(rawRole: string): {
  role: string;
  personType: ParsedPerson['personType'];
  isBrokerInCharge: boolean;
  isTeamLeader: boolean;
  team: string;
  needsReview: boolean;
  tags: string[];
} {
  const upper = rawRole.toUpperCase().trim();
  const tags: string[] = [];

  if (!rawRole.trim()) {
    return { role: '', personType: 'other', isBrokerInCharge: false, isTeamLeader: false, team: '', needsReview: true, tags: ['role-needs-review'] };
  }

  if (upper === 'PB') {
    return { role: 'PB', personType: 'other', isBrokerInCharge: false, isTeamLeader: false, team: '', needsReview: true, tags: ['role-needs-review'] };
  }

  if (upper.includes('OWNER')) {
    tags.push('owner', 'leadership');
    return { role: 'Owner / Principal Broker', personType: 'leadership', isBrokerInCharge: false, isTeamLeader: false, team: '', needsReview: false, tags };
  }

  if (upper.includes('BIC') || upper.includes('BROKER-IN-CHARGE') || upper.includes('BROKER IN CHARGE')) {
    tags.push('broker-in-charge', 'leadership');
    return { role: 'Broker-in-Charge', personType: 'leadership', isBrokerInCharge: true, isTeamLeader: false, team: '', needsReview: false, tags };
  }

  if (upper.includes('ASSISTANT')) {
    return { role: rawRole.trim(), personType: 'assistant', isBrokerInCharge: false, isTeamLeader: false, team: '', needsReview: false, tags };
  }

  if (upper.includes('LEADER') || (upper.includes('TEAM') && upper.includes('LEAD'))) {
    let team = '';
    const sep = rawRole.indexOf('-') !== -1 ? '-' : (rawRole.indexOf(':') !== -1 ? ':' : '');
    if (sep) {
      team = rawRole.split(sep)[0].trim();
    } else if (upper.endsWith('LEADER') || upper.startsWith('LEADER')) {
      team = rawRole.replace(/Leader|leader|LEADER/g, '').trim();
    } else {
      team = rawRole.trim();
    }
    return { role: rawRole.trim(), personType: 'agent', isBrokerInCharge: false, isTeamLeader: true, team, needsReview: false, tags };
  }

  if (upper.includes('ADMIN') || upper.includes('OPERATIONS') || upper.includes('FINANCE') ||
      upper.includes('MARKETING') || upper.includes('COORDINATOR') || upper.includes('COAST TO CLOSE') ||
      upper.includes('DEBBIE L. TEAM') || upper.includes('OFFICE MANAGER')) {
    return { role: rawRole.trim(), personType: 'staff', isBrokerInCharge: false, isTeamLeader: false, team: '', needsReview: false, tags };
  }

  if (upper.includes('BROKER') || upper.includes('AGENT') || upper.includes('REFERRAL BASED AGENT')) {
    let team = '';
    const dashIdx = rawRole.indexOf('-');
    if (dashIdx !== -1) {
      team = rawRole.slice(dashIdx + 1).trim();
    }
    return { role: rawRole.trim(), personType: 'agent', isBrokerInCharge: false, isTeamLeader: false, team, needsReview: false, tags };
  }

  return { role: rawRole.trim(), personType: 'other', isBrokerInCharge: false, isTeamLeader: false, team: '', needsReview: true, tags: ['role-needs-review'] };
}

// ─── Row Parsing ─────────────────────────────────────────────────────────────

function isPersonRow(row: string[]): boolean {
  const name = (row[COL.NAME] || '').trim();
  if (!name) return false;
  const EXCLUDES = ['in rechat', 'assistants with license', 'total', 'totals', 'name', 'full name'];
  if (EXCLUDES.includes(name.toLowerCase())) return false;
  if (name.length <= 3 && name === name.toUpperCase()) return false;
  return true;
}

function parseRow(row: string[], rowNumber: number, wsId: string, spreadsheetId: string, sheetName: string): ParsedPerson | null {
  if (!isPersonRow(row)) return null;

  const col = (idx: number): string => (idx < row.length ? (row[idx] || '').trim() : '');

  const rawName   = col(COL.NAME);
  const rawEmail  = col(COL.EMAIL);
  const rawPhone  = col(COL.PHONE);
  const rawRole   = col(COL.ROLE);
  const rawOffice = col(COL.OFFICE);
  const rawMarker = col(COL.MARKER);

  const warnings: string[] = [];
  const tags: string[] = [];

  const { firstName, middleName, lastName, displayName } = parseName(rawName);
  if (!displayName) return null;

  let email = '';
  let emailInvalid = false;
  if (rawEmail) {
    if (validateEmail(rawEmail)) {
      email = rawEmail.toLowerCase().trim();
    } else {
      emailInvalid = true;
      warnings.push(`Invalid email format: ${rawEmail}`);
      tags.push('invalid-email-format');
    }
  }

  const phoneResult = normalizePhone(rawPhone);
  if (phoneResult.needsReview && rawPhone) {
    warnings.push(`Phone needs review: ${rawPhone}`);
    tags.push('phone-needs-review');
  }

  const officeResult = normalizeOffice(rawOffice);
  if (officeResult.needsReview) {
    warnings.push(`Office needs review: ${rawOffice || '(empty)'}`);
    tags.push('office-needs-review');
  }

  const roleResult = normalizeRole(rawRole);
  if (roleResult.needsReview) {
    warnings.push(`Role needs review: ${rawRole || '(empty)'}`);
  }
  tags.push(...roleResult.tags);

  let status: ParsedPerson['status'] = 'active';
  let communicationPreference: ParsedPerson['communicationPreference'] = 'standard';
  const marker = rawMarker.toLowerCase();

  if (marker === 'x') {
    status = 'needs_review';
    tags.push('source-marked-x');
    warnings.push('Source marked with X');
  } else if (marker === 'email only') {
    communicationPreference = 'email_only';
    tags.push('email-only');
  }

  if (emailInvalid) status = 'needs_review';
  if (officeResult.needsReview) status = 'needs_review';
  if (roleResult.needsReview) status = 'needs_review';
  if (!email && !phoneResult.normalized) {
    status = 'needs_review';
    tags.push('incomplete-contact');
    warnings.push('Missing both email and phone');
  }

  const keyParts = email || phoneResult.digitsOnly || `${displayName}|${officeResult.name}`;
  const sourceRowKey = crypto.createHash('sha256').update(keyParts).digest('hex');
  const id = `nest_2026_${sourceRowKey}`;

  return {
    id,
    workspaceId: wsId,
    firstName,
    middleName,
    lastName,
    displayName,
    email,
    phone: phoneResult.normalized,
    phoneDigitsOnly: phoneResult.digitsOnly,
    title: roleResult.role || 'Agent',
    role: roleResult.role,
    team: roleResult.team,
    rawRole,
    rawOffice,
    primaryOfficeName: officeResult.name,
    officeNames: [officeResult.name],
    personType: roleResult.personType,
    isBrokerInCharge: roleResult.isBrokerInCharge,
    isTeamLeader: roleResult.isTeamLeader,
    status,
    communicationPreference,
    tags,
    source: 'nest_2026_agents_sheet',
    sourceParserVersion: PARSER_VERSION,
    sourceRowKey,
    sourceSpreadsheetId: spreadsheetId,
    sourceSheetName: sheetName,
    rowNumber,
    warnings,
  };
}

// ─── Column Safety Check ─────────────────────────────────────────────────────

function verifyColumnPositions(rows: string[][]): { safe: boolean; reason?: string } {
  let emailLikeCount = 0;
  let phoneLikeCount = 0;
  let nameCount = 0;
  const sampleSize = Math.min(20, rows.length);

  for (let i = 1; i < sampleSize; i++) {
    const row = rows[i];
    if (!row || row.every(c => !c?.trim())) continue;
    
    const nameVal = (row[COL.NAME] || '').trim();
    const emailVal = (row[COL.EMAIL] || '').trim();
    const phoneVal = (row[COL.PHONE] || '').trim();

    if (nameVal && nameVal.includes(' ') && nameVal !== 'In Rechat') nameCount++;
    if (emailVal && emailVal.includes('@')) emailLikeCount++;
    if (phoneVal && /\d{3}/.test(phoneVal)) phoneLikeCount++;
  }

  if (nameCount < 2) {
    return { safe: false, reason: `Column F does not appear to contain names (found ${nameCount} name-like values in first ${sampleSize} rows)` };
  }
  if (emailLikeCount < 2) {
    return { safe: false, reason: `Column G does not appear to contain emails (found ${emailLikeCount} email-like values in first ${sampleSize} rows)` };
  }

  return { safe: true };
}

// ─── Google Sheets Fetch ─────────────────────────────────────────────────────

async function fetchGoogleSheet(spreadsheetId: string, sheetName: string): Promise<string[][]> {
  const { google } = await import('googleapis');
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.log('[Sheets] No Google OAuth credentials. Attempting public CSV export...');
    return fetchSheetViaCSVExport(spreadsheetId, sheetName);
  }

  // Try to load stored tokens from the local db.json
  const localDbPath = path.join(process.cwd(), 'data', 'db.json');
  let accessToken: string | null = null;

  if (fs.existsSync(localDbPath)) {
    try {
      const dbData = JSON.parse(fs.readFileSync(localDbPath, 'utf-8'));
      const connections = dbData.workspaceIntegrationConnections || [];
      const googleConn = connections.find((c: any) =>
        c.provider === 'google_workspace' && c.status === 'connected'
      );
      if (googleConn) {
        const rawToken = googleConn.encryptedAccessToken;
        if (rawToken) {
          try {
            accessToken = Buffer.from(rawToken, 'base64').toString('utf-8');
            if (!accessToken || accessToken.length < 10) accessToken = null;
          } catch {
            accessToken = null;
          }
        }
      }
    } catch {}
  }

  if (accessToken) {
    console.log('[Sheets] Using stored Google OAuth access token...');
    try {
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
      oauth2Client.setCredentials({ access_token: accessToken });
      
      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${sheetName}'`,
      });
      
      if (response.data.values) {
        console.log(`[Sheets] Successfully fetched ${response.data.values.length} rows via Sheets API`);
        return response.data.values as string[][];
      }
    } catch (err: any) {
      console.warn(`[Sheets] Sheets API call failed: ${err.message}. Falling back to CSV export...`);
    }
  }

  return fetchSheetViaCSVExport(spreadsheetId, sheetName, accessToken || undefined);
}

async function fetchSheetViaCSVExport(spreadsheetId: string, sheetName: string, accessToken?: string): Promise<string[][]> {
  let gid: string | null = null;

  if (accessToken) {
    try {
      const { google } = await import('googleapis');
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      oauth2Client.setCredentials({ access_token: accessToken });
      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
      
      const meta = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties',
      });
      
      const targetSheet = meta.data.sheets?.find(
        (s: any) => s.properties?.title === sheetName
      );
      if (targetSheet?.properties?.sheetId !== undefined) {
        gid = String(targetSheet.properties.sheetId);
        console.log(`[Sheets] Resolved sheet "${sheetName}" to GID: ${gid}`);
      }
    } catch (err: any) {
      console.warn(`[Sheets] Failed to resolve GID via API: ${err.message}`);
    }
  }

  let csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
  if (gid) csvUrl += `&gid=${gid}`;
  
  const headers: Record<string, string> = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  
  console.log(`[Sheets] Fetching CSV export...`);
  const res = await fetch(csvUrl, { headers });
  
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to fetch spreadsheet CSV: ${res.status} ${res.statusText}\n${body.slice(0, 200)}`);
  }
  
  const csvText = await res.text();
  return parseCSV(csvText);
}

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/);
  const result: string[][] = [];
  
  for (const line of lines) {
    const row: string[] = [];
    let insideQuote = false;
    let entry = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const next = line[i + 1];
      
      if (insideQuote) {
        if (char === '"') {
          if (next === '"') {
            entry += '"';
            i++;
          } else {
            insideQuote = false;
          }
        } else {
          entry += char;
        }
      } else {
        if (char === '"') {
          insideQuote = true;
        } else if (char === ',' || char === '\t') {
          row.push(entry);
          entry = '';
        } else {
          entry += char;
        }
      }
    }
    row.push(entry);
    result.push(row);
  }
  
  return result;
}

// ─── Duplicate Matching ──────────────────────────────────────────────────────

function findExistingMatch(person: ParsedPerson, existingPeople: any[]): any | null {
  for (const p of existingPeople) {
    if (person.email && p.email && p.email.toLowerCase() === person.email.toLowerCase()) return p;
  }
  for (const p of existingPeople) {
    const pDigits = (p.phone || '').replace(/\D/g, '');
    if (person.phoneDigitsOnly && pDigits && pDigits === person.phoneDigitsOnly) return p;
  }
  for (const p of existingPeople) {
    if (p.displayName?.toLowerCase() === person.displayName.toLowerCase() &&
        p.primaryOfficeName?.toLowerCase() === person.primaryOfficeName.toLowerCase()) return p;
  }
  for (const p of existingPeople) {
    if (p.sourceRowKey === person.sourceRowKey) return p;
  }
  return null;
}

function hasChanged(person: ParsedPerson, existing: any): boolean {
  return (
    existing.displayName !== person.displayName ||
    (existing.email || '') !== person.email ||
    (existing.phone || '') !== person.phone ||
    (existing.role || '') !== person.role ||
    existing.personType !== person.personType ||
    existing.primaryOfficeName !== person.primaryOfficeName ||
    existing.status !== person.status ||
    (existing.communicationPreference || 'standard') !== person.communicationPreference ||
    existing.isBrokerInCharge !== person.isBrokerInCharge ||
    existing.isTeamLeader !== person.isTeamLeader
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
Nest 2026 Agents Directory Backfill
====================================
Fetches the "2026 Agents" worksheet from Google Sheets and upserts
all valid people into the directory_people table.

Usage:
  npm run directory:backfill:nest-2026 -- --preview     (default, dry run)
  npm run directory:backfill:nest-2026 -- --apply        (execute upsert)

Options:
  --preview              Generate preview report (default)
  --apply                Execute the database changes
  --spreadsheet <id>     Spreadsheet ID (default: ${DEFAULT_SPREADSHEET_ID})
  --worksheet <name>     Worksheet name (default: ${DEFAULT_WORKSHEET})
  --workspace <id>       Workspace ID (default: ${DEFAULT_WORKSPACE_ID})
  --admin <email>        Admin identity (default: ryan@nestrealty.com)
  --help                 Show this help message
`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const getArg = (name: string): string => {
    const idx = args.indexOf(name);
    if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
    const eq = args.find(a => a.startsWith(`${name}=`));
    if (eq) return eq.split('=').slice(1).join('=');
    return '';
  };

  const spreadsheetId = getArg('--spreadsheet') || DEFAULT_SPREADSHEET_ID;
  const worksheetName = getArg('--worksheet') || DEFAULT_WORKSHEET;
  const workspaceId = getArg('--workspace') || DEFAULT_WORKSPACE_ID;
  const adminEmail = getArg('--admin') || 'ryan@nestrealty.com';
  const applyMode = args.includes('--apply');

  console.log('==============================================================');
  console.log('   Nest 2026 Agents Directory Backfill                        ');
  console.log('==============================================================');
  console.log(`  Parser:       ${PARSER_VERSION}`);
  console.log(`  Spreadsheet:  ${spreadsheetId}`);
  console.log(`  Worksheet:    ${worksheetName}`);
  console.log(`  Workspace:    ${workspaceId}`);
  console.log(`  Admin:        ${adminEmail}`);
  console.log(`  Mode:         ${applyMode ? 'APPLY (Writing changes)' : 'PREVIEW (Dry run)'}`);
  console.log('');

  // ─── 1. Fetch the Sheet ──────────────────────────────────────────────────

  console.log('Step 1: Fetching Google Sheet...');
  let rows: string[][];
  try {
    rows = await fetchGoogleSheet(spreadsheetId, worksheetName);
  } catch (err: any) {
    console.error(`\nFATAL: Cannot access the Google Sheet.`);
    console.error(`   Error: ${err.message}`);
    console.error(`\n   Ensure the connected Google account has access to spreadsheet ${spreadsheetId}`);
    process.exit(1);
  }

  console.log(`   Rows fetched: ${rows.length}`);
  if (rows.length < 2) {
    console.error('Sheet has fewer than 2 rows. Nothing to import.');
    process.exit(1);
  }

  // ─── 2. Verify Column Positions ──────────────────────────────────────────

  console.log('\nStep 2: Verifying column positions...');
  const colCheck = verifyColumnPositions(rows);
  if (!colCheck.safe) {
    console.error(`\nFATAL: Column structure verification failed!`);
    console.error(`   ${colCheck.reason}`);
    console.error('   The spreadsheet structure may have changed. Manual inspection required.');
    process.exit(1);
  }

  console.log(`   Row 1 (label): ${JSON.stringify(rows[0]?.slice(0, 9) || [])}`);
  console.log(`   Row 2 (first data): ${JSON.stringify(rows[1]?.slice(0, 9) || [])}`);
  console.log('   Column positions verified');

  // ─── 3. Parse All Rows ──────────────────────────────────────────────────

  console.log('\nStep 3: Parsing person rows...');
  const candidates: ParsedPerson[] = [];
  const ignoredRows: { rowNum: number; reason: string; content: string }[] = [];
  const sourceMarkers = { blank: 0, x: 0, emailOnly: 0, inRechat: 0 };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every(c => !(c || '').trim())) continue;

    if (i === 0) {
      ignoredRows.push({ rowNum: i + 1, reason: 'Row 1 label', content: (row[0] || '').trim() });
      sourceMarkers.inRechat++;
      continue;
    }

    const parsed = parseRow(row, i + 1, workspaceId, spreadsheetId, worksheetName);
    if (parsed) {
      candidates.push(parsed);
      const m = (row[COL.MARKER] || '').trim().toLowerCase();
      if (m === 'x') sourceMarkers.x++;
      else if (m === 'email only') sourceMarkers.emailOnly++;
      else sourceMarkers.blank++;
    } else {
      const name = (row[COL.NAME] || '').trim();
      ignoredRows.push({
        rowNum: i + 1,
        reason: name ? 'Non-person row (section heading or excluded label)' : 'No name in column F',
        content: name || row.slice(0, 6).join(' | '),
      });
    }
  }

  console.log(`   Total person candidates: ${candidates.length}`);
  console.log(`   Rows ignored: ${ignoredRows.length}`);

  // ─── 4. Check Existing Records ────────────────────────────────────────

  console.log('\nStep 4: Checking for existing directory records...');
  let existingPeople: any[] = [];

  const localDbPath = path.join(process.cwd(), 'data', 'db.json');
  if (fs.existsSync(localDbPath)) {
    try {
      const db = JSON.parse(fs.readFileSync(localDbPath, 'utf-8'));
      existingPeople = (db.directoryPeople || []).filter((p: any) => p.workspaceId === workspaceId);
      console.log(`   Existing directory records: ${existingPeople.length}`);
    } catch {}
  }

  // ─── 5. Classify Each Candidate ────────────────────────────────────────

  const inserts: ParsedPerson[] = [];
  const updates: { person: ParsedPerson; existing: any }[] = [];
  const unchanged: ParsedPerson[] = [];

  for (const c of candidates) {
    const match = findExistingMatch(c, existingPeople);
    if (!match) {
      inserts.push(c);
    } else {
      if (hasChanged(c, match)) {
        updates.push({ person: c, existing: match });
      } else {
        unchanged.push(c);
      }
    }
  }

  // ─── 6. Statistics ─────────────────────────────────────────────────────

  const stats = {
    totalRows: rows.length,
    validCandidates: candidates.length,
    toInsert: inserts.length,
    toUpdate: updates.length,
    unchanged: unchanged.length,
    needsReview: candidates.filter(c => c.status === 'needs_review').length,
    markedX: sourceMarkers.x,
    missingEmail: candidates.filter(c => !c.email).length,
    missingPhone: candidates.filter(c => !c.phone).length,
    missingOffice: candidates.filter(c => c.primaryOfficeName === 'Unknown').length,
    unknownRole: candidates.filter(c => c.tags.includes('role-needs-review')).length,
    invalidEmail: candidates.filter(c => c.tags.includes('invalid-email-format')).length,
    invalidPhone: candidates.filter(c => c.tags.includes('phone-needs-review')).length,
    emailOnly: sourceMarkers.emailOnly,
    possibleDuplicates: 0,
    ignoredRows: ignoredRows.length,
    bicCount: candidates.filter(c => c.isBrokerInCharge).length,
    teamLeaderCount: candidates.filter(c => c.isTeamLeader).length,
    errors: 0,
  };

  // ─── 7. Preview Report ─────────────────────────────────────────────────

  console.log('\n==============================================================');
  console.log('                    IMPORT PREVIEW                            ');
  console.log('==============================================================');
  console.log(`  Spreadsheet Rows Read:    ${stats.totalRows}`);
  console.log(`  Valid Person Candidates:  ${stats.validCandidates}`);
  console.log(`  People to Insert:         ${stats.toInsert}`);
  console.log(`  People to Update:         ${stats.toUpdate}`);
  console.log(`  Unchanged People:         ${stats.unchanged}`);
  console.log(`  Needs Review:             ${stats.needsReview}`);
  console.log(`  Source-Marked-X:          ${stats.markedX}`);
  console.log(`  Missing Business Email:   ${stats.missingEmail}`);
  console.log(`  Missing Phone:            ${stats.missingPhone}`);
  console.log(`  Missing Office:           ${stats.missingOffice}`);
  console.log(`  Unknown Role:             ${stats.unknownRole}`);
  console.log(`  Invalid Email:            ${stats.invalidEmail}`);
  console.log(`  Invalid Phone:            ${stats.invalidPhone}`);
  console.log(`  Email-Only Marker:        ${stats.emailOnly}`);
  console.log(`  Ignored Rows:             ${stats.ignoredRows}`);
  console.log(`  BIC Count:                ${stats.bicCount}`);
  console.log(`  Team Leader Count:        ${stats.teamLeaderCount}`);
  console.log('--------------------------------------------------------------');

  console.log('\nPreview Table (All Candidates):');
  const tableRows = candidates.map(c => {
    let action = 'INSERT';
    if (updates.some(u => u.person.id === c.id)) action = 'UPDATE';
    else if (unchanged.some(u => u.id === c.id)) action = 'UNCHANGED';

    return {
      '#': c.rowNumber,
      Name: c.displayName.slice(0, 25),
      Email: (c.email || '(none)').slice(0, 30),
      Phone: c.phone || '(none)',
      'Raw Role': (c.rawRole || '(none)').slice(0, 22),
      'Norm Role': (c.role || '(none)').slice(0, 22),
      Office: c.primaryOfficeName,
      Type: c.personType,
      BIC: c.isBrokerInCharge ? 'Y' : '',
      Status: c.status,
      Action: action,
      Warnings: c.warnings.length > 0 ? `${c.warnings.length} issue(s)` : 'none',
    };
  });
  console.table(tableRows);

  if (ignoredRows.length > 0) {
    console.log('\nIgnored Rows:');
    console.table(ignoredRows.slice(0, 20).map(r => ({ Row: r.rowNum, Reason: r.reason, Content: r.content.slice(0, 40) })));
  }

  // Save preview artifact
  const receiptDir = path.join(process.cwd(), 'data', 'receipts');
  const previewDir = path.join(process.cwd(), 'data', 'previews');
  fs.mkdirSync(receiptDir, { recursive: true });
  fs.mkdirSync(previewDir, { recursive: true });

  const timestamp = new Date().toISOString();
  const previewFilename = `preview_nest2026_${Date.now()}.json`;
  const previewPath = path.join(previewDir, previewFilename);
  fs.writeFileSync(previewPath, JSON.stringify({
    timestamp,
    parserVersion: PARSER_VERSION,
    spreadsheetId,
    worksheetName,
    workspaceId,
    stats,
    candidates: candidates.map(c => ({
      displayName: c.displayName,
      email: c.email,
      phone: c.phone,
      role: c.role,
      rawRole: c.rawRole,
      office: c.primaryOfficeName,
      personType: c.personType,
      isBrokerInCharge: c.isBrokerInCharge,
      status: c.status,
      warnings: c.warnings,
    })),
    ignoredRows,
  }, null, 2));
  console.log(`\nPreview artifact: data/previews/${previewFilename}`);

  // ─── 8. Apply (if requested) ──────────────────────────────────────────

  if (!applyMode) {
    console.log('\nPreview completed. Run with --apply to execute import.');
    process.exit(0);
  }

  console.log('\nAPPLYING BACKFILL...');

  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  // Update local db.json
  if (fs.existsSync(localDbPath)) {
    console.log('Applying to local JSON database...');
    try {
      const dbData = JSON.parse(fs.readFileSync(localDbPath, 'utf-8'));
      if (!dbData.directoryPeople) dbData.directoryPeople = [];

      for (const c of candidates) {
        const existingIdx = dbData.directoryPeople.findIndex((p: any) =>
          p.id === c.id ||
          (c.email && p.email && p.email.toLowerCase() === c.email.toLowerCase()) ||
          (c.phoneDigitsOnly && p.phone && p.phone.replace(/\D/g, '') === c.phoneDigitsOnly) ||
          (p.sourceRowKey === c.sourceRowKey)
        );

        const record: any = {
          id: c.id,
          workspaceId: c.workspaceId,
          firstName: c.firstName,
          middleName: c.middleName || undefined,
          lastName: c.lastName,
          displayName: c.displayName,
          email: c.email || undefined,
          phone: c.phone || undefined,
          title: c.title,
          role: c.role,
          team: c.team || undefined,
          rawRole: c.rawRole,
          personType: c.personType,
          primaryOfficeName: c.primaryOfficeName,
          officeNames: c.officeNames,
          isBrokerInCharge: c.isBrokerInCharge,
          isTeamLeader: c.isTeamLeader,
          status: c.status,
          communicationPreference: c.communicationPreference,
          tags: c.tags,
          source: c.source,
          sourceParserVersion: c.sourceParserVersion,
          sourceRowKey: c.sourceRowKey,
          sourceSpreadsheetId: c.sourceSpreadsheetId,
          sourceSheetName: c.sourceSheetName,
          lastSyncedAt: timestamp,
          updatedAt: timestamp,
        };

        if (existingIdx === -1) {
          record.createdAt = timestamp;
          dbData.directoryPeople.push(record);
          inserted++;
        } else {
          const existing = dbData.directoryPeople[existingIdx];
          dbData.directoryPeople[existingIdx] = {
            ...existing,
            ...record,
          };
          updated++;
        }
      }

      fs.writeFileSync(localDbPath, JSON.stringify(dbData, null, 2));
      console.log(`   Local DB: ${inserted} inserted, ${updated} updated`);
    } catch (err: any) {
      errors.push(`Local DB error: ${err.message}`);
      console.error(`   Local DB error: ${err.message}`);
    }
  }

  // Also push to the running server via the API so the in-memory state is updated
  console.log('Syncing to running server via API...');
  let apiInserted = 0;
  let apiErrors = 0;
  try {
    // Login to get session cookie
    const loginRes = await fetch(`${SERVER_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: 'password123' }),
    });
    if (!loginRes.ok) {
      const loginBody = await loginRes.text();
      console.warn(`   API login failed (${loginRes.status}), skipping server sync: ${loginBody.slice(0, 100)}`);
    } else {
      const cookies = loginRes.headers.getSetCookie?.() || [];
      const sessionCookie = cookies.find((c: string) => c.startsWith('shapework_session='));
      if (!sessionCookie) {
        console.warn('   No session cookie returned from login, skipping server sync.');
      } else {
        const cookieVal = sessionCookie.split(';')[0];
        for (const c of candidates) {
          const record: any = {
            id: c.id,
            workspaceId: c.workspaceId,
            firstName: c.firstName,
            middleName: c.middleName || undefined,
            lastName: c.lastName,
            displayName: c.displayName,
            preferredName: undefined,
            email: c.email || undefined,
            alternateEmail: undefined,
            phone: c.phone || undefined,
            alternatePhone: undefined,
            photoUrl: undefined,
            profileUrl: undefined,
            schedulingUrl: undefined,
            title: c.title,
            role: c.role,
            team: c.team || undefined,
            rawRole: c.rawRole,
            personType: c.personType,
            primaryOfficeName: c.primaryOfficeName,
            officeNames: c.officeNames,
            officeIds: [],
            isBrokerInCharge: c.isBrokerInCharge,
            isTeamLeader: c.isTeamLeader,
            status: c.status,
            communicationPreference: c.communicationPreference,
            tags: c.tags,
            notes: '',
            source: c.source,
            sourceParserVersion: c.sourceParserVersion,
            sourceRowKey: c.sourceRowKey,
            sourceSpreadsheetId: c.sourceSpreadsheetId,
            sourceSheetName: c.sourceSheetName,
            lastSyncedAt: timestamp,
            updatedAt: timestamp,
            createdAt: timestamp,
          };
          try {
            // Try PUT (update) first — most records already exist in the running server
            const putRes = await fetch(`${SERVER_BASE_URL}/api/directory/people/${c.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieVal,
                'X-Workspace-Id': workspaceId,
              },
              body: JSON.stringify(record),
            });
            if (putRes.ok) {
              apiInserted++;
            } else {
              // Record doesn't exist yet — POST to create
              const postRes = await fetch(`${SERVER_BASE_URL}/api/directory/people`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Cookie': cookieVal,
                  'X-Workspace-Id': workspaceId,
                },
                body: JSON.stringify(record),
              });
              if (postRes.ok) apiInserted++;
              else apiErrors++;
            }
          } catch {
            apiErrors++;
          }
        }
        console.log(`   Server API: ${apiInserted} synced, ${apiErrors} errors`);
      }
    }
  } catch (err: any) {
    console.warn(`   Server API sync skipped (server not running?): ${err.message}`);
  }

  // PostgreSQL upsert
  const connectionString = process.env.DATABASE_URL;
  let pgInserted = 0;
  let pgUpdated = 0;

  if (connectionString) {
    console.log('Applying to PostgreSQL database...');
    const pg = await import('pg');
    const pool = new pg.default.Pool({ connectionString });

    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        for (const c of candidates) {
          const res = await client.query('SELECT id FROM directory_people WHERE id = $1', [c.id]);
          
          if (res.rows.length === 0) {
            let existingId: string | null = null;
            if (c.email) {
              const emailRes = await client.query('SELECT id FROM directory_people WHERE workspace_id = $1 AND LOWER(email) = $2', [workspaceId, c.email.toLowerCase()]);
              if (emailRes.rows.length > 0) existingId = emailRes.rows[0].id;
            }
            if (!existingId && c.phoneDigitsOnly) {
              const phoneRes = await client.query(
                "SELECT id FROM directory_people WHERE workspace_id = $1 AND REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', '') = $2",
                [workspaceId, c.phoneDigitsOnly]
              );
              if (phoneRes.rows.length > 0) existingId = phoneRes.rows[0].id;
            }

            if (existingId) {
              await client.query(`
                UPDATE directory_people SET
                  first_name=$1, middle_name=$2, last_name=$3, display_name=$4,
                  email=$5, phone=$6, title=$7, role=$8, team=$9,
                  person_type=$10, is_broker_in_charge=$11, is_team_leader=$12,
                  raw_role=$13, primary_office_name=$14, office_names=$15,
                  status=$16, communication_preference=$17, tags=$18,
                  source=$19, source_parser_version=$20, source_row_key=$21,
                  source_spreadsheet_id=$22, source_sheet_name=$23,
                  updated_at=NOW(), last_synced_at=NOW()
                WHERE id=$24
              `, [
                c.firstName, c.middleName || null, c.lastName, c.displayName,
                c.email || null, c.phone || null, c.title, c.role, c.team || null,
                c.personType, c.isBrokerInCharge, c.isTeamLeader,
                c.rawRole, c.primaryOfficeName, c.officeNames,
                c.status, c.communicationPreference, c.tags,
                c.source, c.sourceParserVersion, c.sourceRowKey,
                spreadsheetId, worksheetName, existingId,
              ]);
              pgUpdated++;
            } else {
              await client.query(`
                INSERT INTO directory_people (
                  id, workspace_id, first_name, middle_name, last_name, display_name,
                  email, phone, title, role, team, person_type, is_broker_in_charge,
                  is_team_leader, raw_role, primary_office_name, office_names, status,
                  communication_preference, tags, source, source_parser_version, source_row_key,
                  source_spreadsheet_id, source_sheet_name,
                  created_at, updated_at, last_synced_at
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,NOW(),NOW(),NOW())
              `, [
                c.id, workspaceId, c.firstName, c.middleName || null, c.lastName, c.displayName,
                c.email || null, c.phone || null, c.title, c.role, c.team || null,
                c.personType, c.isBrokerInCharge, c.isTeamLeader,
                c.rawRole, c.primaryOfficeName, c.officeNames,
                c.status, c.communicationPreference, c.tags,
                c.source, c.sourceParserVersion, c.sourceRowKey,
                spreadsheetId, worksheetName,
              ]);
              pgInserted++;
            }
          } else {
            await client.query(`
              UPDATE directory_people SET
                first_name=$1, middle_name=$2, last_name=$3, display_name=$4,
                email=$5, phone=$6, title=$7, role=$8, team=$9,
                person_type=$10, is_broker_in_charge=$11, is_team_leader=$12,
                raw_role=$13, primary_office_name=$14, office_names=$15,
                status=$16, communication_preference=$17, tags=$18,
                source=$19, source_parser_version=$20, source_row_key=$21,
                source_spreadsheet_id=$22, source_sheet_name=$23,
                updated_at=NOW(), last_synced_at=NOW()
              WHERE id=$24
            `, [
              c.firstName, c.middleName || null, c.lastName, c.displayName,
              c.email || null, c.phone || null, c.title, c.role, c.team || null,
              c.personType, c.isBrokerInCharge, c.isTeamLeader,
              c.rawRole, c.primaryOfficeName, c.officeNames,
              c.status, c.communicationPreference, c.tags,
              c.source, c.sourceParserVersion, c.sourceRowKey,
              spreadsheetId, worksheetName, c.id,
            ]);
            pgUpdated++;
          }
        }

        await client.query('COMMIT');
        console.log(`   PostgreSQL: ${pgInserted} inserted, ${pgUpdated} updated`);
      } catch (err: any) {
        await client.query('ROLLBACK');
        errors.push(`PostgreSQL error: ${err.message}`);
        console.error(`   PostgreSQL ROLLBACK: ${err.message}`);
      } finally {
        client.release();
      }
    } catch (err: any) {
      errors.push(`PostgreSQL connection error: ${err.message}`);
      console.error(`   PostgreSQL connection failed: ${err.message}`);
    }

    await pool.end();
  }

  // ─── 9. Generate Receipt ───────────────────────────────────────────────

  const receipt: BackfillReceipt = {
    parserVersion: PARSER_VERSION,
    workspaceId,
    spreadsheetId,
    worksheetName,
    executionTimestamp: timestamp,
    initiatedBy: adminEmail,
    rowsRead: rows.length,
    rowsIgnored: ignoredRows.length,
    insertedCount: inserted + pgInserted,
    updatedCount: updated + pgUpdated,
    unchangedCount: unchanged.length,
    needsReviewCount: stats.needsReview,
    duplicateCount: stats.possibleDuplicates,
    invalidCount: stats.invalidEmail + stats.invalidPhone,
    errors,
  };

  const receiptFilename = `receipt_nest2026_${Date.now()}.json`;
  const receiptPath = path.join(receiptDir, receiptFilename);
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));

  console.log('\n==============================================================');
  console.log('                    IMPORT RECEIPT                             ');
  console.log('==============================================================');
  console.log(`  Receipt File:           data/receipts/${receiptFilename}`);
  console.log(`  Parser Version:         ${receipt.parserVersion}`);
  console.log(`  Workspace ID:           ${receipt.workspaceId}`);
  console.log(`  Spreadsheet ID:         ${receipt.spreadsheetId}`);
  console.log(`  Worksheet:              ${receipt.worksheetName}`);
  console.log(`  Execution Time:         ${receipt.executionTimestamp}`);
  console.log(`  Initiated By:           ${receipt.initiatedBy}`);
  console.log(`  Rows Read:              ${receipt.rowsRead}`);
  console.log(`  Rows Ignored:           ${receipt.rowsIgnored}`);
  console.log(`  Inserted:               ${receipt.insertedCount}`);
  console.log(`  Updated:                ${receipt.updatedCount}`);
  console.log(`  Needs Review:           ${receipt.needsReviewCount}`);
  console.log(`  Duplicates:             ${receipt.duplicateCount}`);
  console.log(`  Invalid:                ${receipt.invalidCount}`);
  console.log(`  Errors:                 ${receipt.errors.length}`);
  console.log('==============================================================\n');

  if (errors.length > 0) {
    console.error('Errors encountered:');
    errors.forEach(e => console.error(`  - ${e}`));
  }

  console.log('Backfill complete.');
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
