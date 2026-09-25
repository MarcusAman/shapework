/**
 * Restore Nest call history without replaying intake. Defaults to a read-only preview.
 * Run: node --import tsx scripts/recoverNestCallHistory.ts [--apply] [--to=<ISO timestamp>]
 * Fixed scope: configured Nest agent, ws_wilmington, preceding 30 days, at most 100 calls.
 * No application/bootstrap imports: no schema sync, task creation, or notifications.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import { parse as parseConnectionString } from 'pg-connection-string';
import { NEST_FULL_ROSTER_72 } from '../server/persistence/nestRosterSeed.js';

const WORKSPACE_ID = 'ws_wilmington';
const DEFAULT_AGENT_ID = 'agent_cdd031880770993e4b11cb9340';
const LIMIT = 100;
const DAYS = 30;

type RetellCall = Record<string, any>;

export function selectHistoryCalls(raw: RetellCall[], agentId: string, from: number, to: number, limit = LIMIT) {
  const selected: RetellCall[] = [];
  const seen = new Set<string>();
  const cap = Math.min(LIMIT, Math.max(0, Math.floor(limit)));
  for (const call of raw) {
    const start = call?.start_timestamp;
    const id = call?.call_id;
    if (selected.length >= cap || call?.agent_id !== agentId || typeof id !== 'string' ||
        !/^call_[a-zA-Z0-9_]+$/.test(id) || id.startsWith('call_tool_') || seen.has(id) ||
        typeof start !== 'number' || !Number.isFinite(start) || start < from || start > to) continue;
    seen.add(id);
    selected.push(call);
  }
  return { calls: selected, skipped: raw.length - selected.length };
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

export function toHistoryInsert(raw: RetellCall, workspaceId: string) {
  const custom = raw.call_analysis?.custom_analysis_data || {};
  const variables = raw.retell_llm_dynamic_variables || raw.dynamic_variables || {};
  const phone = text(raw.from_number);
  const digits = phone?.replace(/\D/g, '').slice(-10);
  const person = digits ? NEST_FULL_ROSTER_72.find(entry => entry.phone?.replace(/\D/g, '').slice(-10) === digits) : undefined;
  const durationMs = Number.isFinite(raw.duration_ms) ? raw.duration_ms :
    Number.isFinite(raw.end_timestamp) ? Math.max(0, raw.end_timestamp - raw.start_timestamp) : 0;
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  const duration = seconds < 60 ? `${seconds} sec` : `${Math.floor(seconds / 60)} min${seconds % 60 ? ` ${seconds % 60} sec` : ''}`;
  const summary = text(raw.call_analysis?.call_summary);
  const values = [
    raw.call_id, workspaceId, raw.agent_id,
    person?.displayName || text(custom.requester) || text(variables.agent_name) || (phone ? `Inbound Caller (${phone})` : 'Unknown caller'),
    phone, person?.primaryOfficeName || 'Nest Realty Wilmington',
    raw.direction === 'outbound' ? 'outbound' : 'inbound', text(raw.call_status) || 'completed',
    text(raw.disconnection_reason), seconds, duration,
    text(custom.property_address) || text(variables.property_address), text(custom.title) || 'Recorded call',
    // Historical display does not infer a new routing/assignment decision.
    text(custom.department_category) || 'general_ops', text(custom.primary_owner),
    text(raw.transcript) || (summary ? `Summary: ${summary}` : null), text(raw.recording_url),
    `/api/marketing/calls/${raw.call_id}/audio`, JSON.stringify(raw.call_analysis || {}),
    JSON.stringify(person ? { email: person.email, phone: person.phone, office: person.primaryOfficeName } : {}),
    new Date(raw.start_timestamp).toISOString(),
    Number.isFinite(raw.end_timestamp) ? new Date(raw.end_timestamp).toISOString() : null,
  ];
  return {
    text: `INSERT INTO telephony_calls (
      id, workspace_id, agent_id, caller_name, caller_phone, caller_office,
      direction, status, disconnection_reason, duration_seconds, duration_formatted,
      property_address, request_type, department_category, assigned_lead,
      transcript, recording_url, audio_url, call_analysis, broker_details, started_at, ended_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18, $19::jsonb, $20::jsonb, $21, $22
    ) ON CONFLICT (id) DO NOTHING RETURNING id`,
    values,
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--apply' && !arg.startsWith('--to='))) throw new Error('INVALID_ARGUMENT');
  const apply = args.includes('--apply');
  const endArg = args.find(arg => arg.startsWith('--to='))?.slice(5);
  const to = endArg ? Date.parse(endArg) : Date.now();
  if (!Number.isFinite(to) || to > Date.now() + 60000) throw new Error('INVALID_RANGE_END');
  const from = to - DAYS * 24 * 60 * 60 * 1000;
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  // The local server's launch has no DATABASE_URL override; use its checkout configuration.
  const env = dotenv.parse(fs.readFileSync(path.join(repoRoot, '.env')));
  const agentId = env.RETELL_ASK_NEST_OPS_AGENT_ID || DEFAULT_AGENT_ID;
  const connectionString = env.DATABASE_URL || env.LOCAL_DATABASE_URL;
  if (!env.RETELL_API_KEY || !connectionString) throw new Error('MISSING_RECOVERY_CONFIGURATION');

  const response = await fetch('https://api.retellai.com/v2/list-calls', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RETELL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ filter_criteria: { agent_id: [agentId], after_timestamp: from, before_timestamp: to }, limit: LIMIT }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`PROVIDER_HTTP_${response.status}`);
  const raw = await response.json();
  if (!Array.isArray(raw)) throw new Error('INVALID_PROVIDER_RESPONSE');
  const selection = selectHistoryCalls(raw, agentId, from, to);
  const parsed = parseConnectionString(connectionString);
  const unix = Boolean(parsed.host?.startsWith('/')) || connectionString.includes('/cloudsql/') || connectionString.includes('host=/');
  const remote = !unix && (['supabase', 'neon.tech', 'amazonaws.com', 'render.com', 'sslmode=require'].some(value => connectionString.includes(value)) || env.DB_SSL === 'true');
  const pool = new pg.Pool({ ...parsed, host: parsed.host || undefined, user: parsed.user || undefined,
    password: parsed.password || undefined, database: parsed.database || undefined,
    port: parsed.port ? Number(parsed.port) : 5432, ssl: remote ? { rejectUnauthorized: false } : undefined,
    max: 1, connectionTimeoutMillis: 10000, statement_timeout: 10000, query_timeout: 10000 });
  const client = await pool.connect();
  try {
    await client.query(apply ? 'BEGIN' : 'BEGIN READ ONLY');
    const before = await client.query(`SELECT count(*) FILTER (WHERE id NOT LIKE 'call_tool_%')::int AS visible,
      count(*) FILTER (WHERE id LIKE 'call_tool_%')::int AS tool_only FROM telephony_calls WHERE workspace_id = $1`, [WORKSPACE_ID]);
    const existing = await client.query('SELECT id, workspace_id FROM telephony_calls WHERE id = ANY($1::text[])', [selection.calls.map(call => call.call_id)]);
    if (existing.rows.some(row => !['ws_wilmington', 'nest-realty-demo', 'nest-realty-wilmington'].includes(row.workspace_id))) throw new Error('EXISTING_CALL_TENANT_MISMATCH');
    const ids = new Set(existing.rows.map(row => row.id));
    const missing = selection.calls.filter(call => !ids.has(call.call_id));
    let inserted = 0;
    if (apply) {
      for (const call of missing) {
        const query = toHistoryInsert(call, WORKSPACE_ID);
        const result = await client.query(query.text, query.values);
        inserted += result.rowCount || 0;
      }
    }
    await client.query(apply ? 'COMMIT' : 'ROLLBACK');
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'preview', workspaceId: WORKSPACE_ID, configuredAgentOnly: true,
      from: new Date(from).toISOString(), to: new Date(to).toISOString(), limit: LIMIT,
      providerReturned: raw.length, selected: selection.calls.length, skipped: selection.skipped,
      existing: ids.size, proposedInsertCount: missing.length, inserted,
      visibleBefore: before.rows[0].visible, toolCallsPreserved: before.rows[0].tool_only,
      createsRequests: false, sendsNotifications: false }, null, 2));
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => {
    // Never log provider payloads, connection strings, phone numbers, or transcripts.
    console.error(JSON.stringify({ error: 'HISTORY_RECOVERY_FAILED', code: error.code || (/^[A-Z_0-9]+$/.test(error.message || '') ? error.message : 'UNSPECIFIED') }));
    process.exitCode = 1;
  });
}
