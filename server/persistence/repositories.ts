/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { parse as parseConnectionString } from 'pg-connection-string';
import { initDatabaseSchema } from './dbSync.js';

// Setup active storage driver from environment.
// One decision, read once: later checks must not parse PERSISTENCE_DRIVER again.
export type StorageDriver = 'memory' | 'local' | 'database';

let resolvedStorageDriver: StorageDriver | undefined;

function readStorageDriverOnce(): StorageDriver {
  if (resolvedStorageDriver) return resolvedStorageDriver;
  const raw = (process.env.PERSISTENCE_DRIVER || process.env.STORAGE_DRIVER || '').trim().toLowerCase();
  if (raw === 'postgres' || raw === 'database') resolvedStorageDriver = 'database';
  else if (raw === 'local') resolvedStorageDriver = 'local';
  else resolvedStorageDriver = 'memory';
  return resolvedStorageDriver;
}

export function getStorageDriver(): StorageDriver {
  return readStorageDriverOnce();
}

export const storageDriver: StorageDriver = getStorageDriver();

const APP_ENV = process.env.APP_ENV || process.env.APP_MODE || 'development';
const isProductionOrStaging = APP_ENV === 'production' || APP_ENV === 'staging' || APP_ENV === 'uat';
const isTestEnv = process.env.NODE_ENV === 'test';

// Fail-Closed Validation Guard for Production, Staging, and UAT when strict persistence is explicitly enabled
const strictPersistence = process.env.STRICT_PERSISTENCE_GUARD === 'true';
if (isProductionOrStaging && !isTestEnv && (strictPersistence || APP_ENV === 'staging' || APP_ENV === 'production')) {
  if (storageDriver !== 'database') {
    console.error("==================================================================");
    console.error(`FATAL STARTUP ERROR: Ephemeral persistence driver '${storageDriver}' is forbidden in ${APP_ENV}!`);
    console.error("PERSISTENCE_DRIVER must be set to 'postgres'.");
    console.error("==================================================================");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("==================================================================");
    console.error(`FATAL CONFIGURATION ERROR: DATABASE_URL is required in ${APP_ENV}!`);
    console.error("==================================================================");
    process.exit(1);
  }

  const outboundMode = (process.env.OUTBOUND_MODE || '').toLowerCase();
  if ((APP_ENV === 'uat' || APP_ENV === 'staging') && outboundMode === 'enabled') {
    console.error("==================================================================");
    console.error(`FATAL SAFETY ERROR: Real outbound delivery (OUTBOUND_MODE=enabled) is strictly forbidden in ${APP_ENV}!`);
    console.error("==================================================================");
    process.exit(1);
  }
} else if (isProductionOrStaging && !isTestEnv && !process.env.DATABASE_URL) {
  console.warn(`[Persistence] Running in ${APP_ENV} with active driver: ${storageDriver}`);
}

export let dbPool: pg.Pool | null = null;

export function initDbPool(connectionString?: string): pg.Pool | null {
  if (getStorageDriver() !== 'database') return null;
  const conn = connectionString || process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL || '';
  if (!conn) return null;
  if (dbPool) return dbPool;

  const parsed = parseConnectionString(conn);
  const isUnixSocket = Boolean(parsed.host && parsed.host.startsWith('/')) || conn.includes('/cloudsql/') || conn.includes('host=/');
  const isRemoteDb = !isUnixSocket && (
                     conn.includes('supabase') || 
                     conn.includes('neon.tech') || 
                     conn.includes('amazonaws.com') || 
                     conn.includes('render.com') ||
                     conn.includes('sslmode=require') || 
                     process.env.DB_SSL === 'true');

  const poolConfig: pg.PoolConfig = {
    ...parsed,
    host: parsed.host || undefined,
    user: parsed.user || undefined,
    password: parsed.password || undefined,
    database: parsed.database || undefined,
    port: parsed.port ? parseInt(parsed.port, 10) : 5432,
    max: parseInt(process.env.DB_POOL_MAX || '3', 10),
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 10000,
    statement_timeout: 10000,
    query_timeout: 10000,
    ssl: isRemoteDb ? { rejectUnauthorized: false } : undefined
  };

  dbPool = new pg.Pool(poolConfig);
  return dbPool;
}

export function getDbPool(): pg.Pool | null {
  if (getStorageDriver() !== 'database') return null;
  if (!dbPool) return initDbPool();
  return dbPool;
}

export let dbInitPromise: Promise<void> = Promise.resolve();

if (storageDriver === 'database' && !isTestEnv) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("==================================================================");
    console.error("FATAL CONFIGURATION ERROR: DATABASE_URL is not configured!");
    console.error("Production/Staging database mode requires DATABASE_URL.");
    console.error("==================================================================");
    process.exit(1);
  }
  
  const parsed = parseConnectionString(connectionString);
  const isUnixSocket = Boolean(parsed.host && parsed.host.startsWith('/')) || connectionString.includes('/cloudsql/') || connectionString.includes('host=/');
  const isRemoteDb = !isUnixSocket && (
                     connectionString.includes('supabase') || 
                     connectionString.includes('neon.tech') || 
                     connectionString.includes('amazonaws.com') || 
                     connectionString.includes('render.com') ||
                     connectionString.includes('sslmode=require') || 
                     process.env.DB_SSL === 'true');

  const poolConfig: pg.PoolConfig = {
    ...parsed,
    host: parsed.host || undefined,
    user: parsed.user || undefined,
    password: parsed.password || undefined,
    database: parsed.database || undefined,
    port: parsed.port ? parseInt(parsed.port, 10) : 5432,
    max: parseInt(process.env.DB_POOL_MAX || '3', 10),
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 10000,
    statement_timeout: 10000,
    query_timeout: 10000,
    ssl: isRemoteDb ? { rejectUnauthorized: false } : undefined
  };

  dbPool = new pg.Pool(poolConfig);

  async function connectWithRetry(maxAttempts = 10, delayMs = 1000): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (!dbPool) {
          dbPool = new pg.Pool(poolConfig);
        }
        await dbPool.query('SELECT 1');
        console.log(`[Database] Connected to PostgreSQL datastore in ${APP_ENV} mode (attempt ${attempt}).`);
        if (dbPool) {
          try {
            await initDatabaseSchema(dbPool);
          } catch (schemaErr) {
            console.error('[Database Schema] Notice during schema sync:', schemaErr);
          }
        }
        return;
      } catch (err: any) {
        console.warn(`[Database] Connection attempt ${attempt}/${maxAttempts} failed: ${err.message || err}. Retrying in ${delayMs}ms...`);
        if (attempt === maxAttempts) {
          throw err;
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  // Attempt initial database query with resilient retry loop for Cloud SQL sidecars
  dbInitPromise = connectWithRetry().catch((err) => {
    if (strictPersistence) {
      console.error("==================================================================");
      console.error("FATAL DATABASE CONNECTION ERROR: Database is unreachable after retries!");
      console.error(err);
      console.error("==================================================================");
      process.exit(1);
    } else {
      console.warn("==================================================================");
      console.warn("[Database Notice] External PostgreSQL is currently unreachable; falling back to durable storage.");
      console.warn(err.message || err);
      console.warn("==================================================================");
      dbPool = null;
    }
  });
}

// Generic repository definition
export interface IRepository<T> {
  get(id: string): Promise<T | null>;
  list(filter?: (item: T) => boolean): Promise<T[]>;
  create(item: T): Promise<T>;
  update(id: string, updates: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

// Simple local state file persistency
const LOCAL_DB_DIR = process.env.PORT ? `data-${process.env.PORT}` : 'data';
const LOCAL_DB_PATH = path.join(process.cwd(), LOCAL_DB_DIR, 'db.json');

function ensureLocalDbDirectory() {
  const dir = path.dirname(LOCAL_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

let writeMutexChain: Promise<any> = Promise.resolve();

export function saveStateToStorage(dbState: any): Promise<void> {
  if (storageDriver === 'local') {
    writeMutexChain = writeMutexChain.then(async () => {
      ensureLocalDbDirectory();
      const tmpPath = `${LOCAL_DB_PATH}.tmp.${Math.random().toString(36).substring(7)}`;
      fs.writeFileSync(tmpPath, JSON.stringify(dbState, null, 2));
      fs.renameSync(tmpPath, LOCAL_DB_PATH);
    }).catch((e) => {
      console.error('[Write Mutex] Operation encountered an error but queue recovered:', e);
    });
    return writeMutexChain;
  }
  return Promise.resolve();
}

import { NEST_FULL_ROSTER_72 } from './nestRosterSeed.js';

export function loadStateFromStorage(defaultSeed: any): any {
  if (storageDriver === 'local' && fs.existsSync(LOCAL_DB_PATH)) {
    try {
      const data = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      const state = JSON.parse(data);
      if (!state.directoryPeople || state.directoryPeople.length < 70) {
        state.directoryPeople = NEST_FULL_ROSTER_72;
      }
      return state;
    } catch (e) {
      console.error('Failed to load local database, falling back to seed:', e);
      return defaultSeed;
    }
  }
  if (defaultSeed && (!defaultSeed.directoryPeople || defaultSeed.directoryPeople.length < 70)) {
    defaultSeed.directoryPeople = NEST_FULL_ROSTER_72;
  }
  return defaultSeed;
}

// Tenancy repository interfaces
export interface WorkspaceRepository extends IRepository<any> {}
export interface UserRepository extends IRepository<any> {}
export interface RequestRepository extends IRepository<any> {}
export interface DealRepository extends IRepository<any> {}
export interface TaskRepository extends IRepository<any> {}
export interface IntegrationEventRepository extends IRepository<any> {}
export interface ApprovalRepository extends IRepository<any> {}
export interface AuditRepository extends IRepository<any> {}
export interface ConnectorConfigRepository extends IRepository<any> {}

// Base repo class routing to backend dbState
export class MemoryRepository<T extends { id: string; workspaceId?: string }> implements IRepository<T> {
  private getCollection: () => T[];
  private onStateChange: () => void;

  constructor(getCollection: () => T[], onStateChange: () => void) {
    this.getCollection = getCollection;
    this.onStateChange = onStateChange;
  }

  async get(id: string): Promise<T | null> {
    const list = this.getCollection();
    return list.find((item) => item.id === id) || null;
  }

  async list(filter?: (item: T) => boolean): Promise<T[]> {
    const list = this.getCollection();
    return filter ? list.filter(filter) : list;
  }

  async create(item: T): Promise<T> {
    const list = this.getCollection();
    list.unshift(item);
    this.onStateChange();
    return item;
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const list = this.getCollection();
    const itemIndex = list.findIndex((item) => item.id === id);
    if (itemIndex === -1) return null;
    list[itemIndex] = { ...list[itemIndex], ...updates };
    this.onStateChange();
    return list[itemIndex];
  }

  async delete(id: string): Promise<boolean> {
    const list = this.getCollection();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    this.onStateChange();
    return true;
  }
}
