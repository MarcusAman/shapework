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

// Fatal production validation check
const APP_MODE = process.env.APP_MODE || 'development';
if (APP_MODE === 'production') {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required in production.');
    process.exit(1);
  }
  if (storageDriver === 'memory') {
    console.error("==================================================================");
    console.error("FATAL RUNTIME CONFIGURATION ERROR:");
    console.error("Production mode does NOT allow 'memory' storage driver.");
    console.error("Please configure 'local' or 'database' in environment settings.");
    console.error("==================================================================");
    process.exit(1);
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
const LOCAL_DB_PATH = path.join(process.cwd(), 'data', 'db.json');

function ensureLocalDbDirectory() {
  const dir = path.dirname(LOCAL_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function saveStateToStorage(dbState: any) {
  if (storageDriver === 'local') {
    try {
      ensureLocalDbDirectory();
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(dbState, null, 2));
    } catch (e) {
      console.error('Failed to persist state locally:', e);
    }
  }
}

export function loadStateFromStorage(defaultSeed: any): any {
  if (storageDriver === 'local' && fs.existsSync(LOCAL_DB_PATH)) {
    try {
      const data = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load local database, falling back to seed:', e);
      return defaultSeed;
    }
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
