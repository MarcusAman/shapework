/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { initDatabaseSchema } from './dbSync.js';

// Setup active storage driver from environment
export type StorageDriver = 'memory' | 'local' | 'database';
export const storageDriver: StorageDriver = (process.env.STORAGE_DRIVER as StorageDriver) || 'memory';

// Production mode startup check
const APP_MODE = process.env.APP_MODE || 'development';
if (APP_MODE === 'production') {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not set in production. Operating in fallback storage mode.');
  }
}

export let dbPool: pg.Pool | null = null;
export let dbInitPromise: Promise<void> = Promise.resolve();

if (storageDriver === 'database') {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("==================================================================");
    console.error("FATAL CONFIGURATION ERROR: DATABASE_URL is not configured!");
    console.error("Production/Staging database mode requires DATABASE_URL.");
    console.error("==================================================================");
    process.exit(1);
  }

  dbPool = new pg.Pool({ connectionString });

  // Fail closed if database is unreachable
  dbInitPromise = dbPool.query('SELECT 1').then(async () => {
    console.log('[Database] Connected to PostgreSQL database successfully.');
    if (dbPool) {
      await initDatabaseSchema(dbPool);
    }
  }).catch((err) => {
    console.error("==================================================================");
    console.error("FATAL DATABASE CONNECTION ERROR: Database is unreachable!");
    console.error(err);
    console.error("==================================================================");
    process.exit(1);
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
