/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import pg from 'pg';
import { IRepository } from './repositories';

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function snakeToCamel(str: string): string {
  return str.replace(/([-_][a-z])/g, group =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
}

export function convertKeysToSnake(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) {
    if (obj.length > 0 && typeof obj[0] !== 'object') {
      return obj;
    }
    return obj.map(convertKeysToSnake);
  }
  
  const res: any = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = camelToSnake(key);
    const val = obj[key];
    if (snakeKey === 'steps' || snakeKey === 'payload' || snakeKey === 'details') {
      res[snakeKey] = val ? JSON.stringify(convertKeysToSnake(val)) : null;
    } else if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      res[snakeKey] = JSON.stringify(convertKeysToSnake(val));
    } else if (Array.isArray(val)) {
      res[snakeKey] = val.map(convertKeysToSnake);
    } else {
      res[snakeKey] = val === '' ? null : val;
    }
  }
  return res;
}

export function convertKeysToCamel(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamel);
  }
  
  const res: any = {};
  for (const key of Object.keys(obj)) {
    const camelKey = snakeToCamel(key);
    const val = obj[key];
    if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
      try {
        res[camelKey] = convertKeysToCamel(JSON.parse(val));
      } catch {
        res[camelKey] = val;
      }
    } else if (val instanceof Date) {
      res[camelKey] = val.toISOString();
    } else {
      res[camelKey] = convertKeysToCamel(val);
    }
  }
  return res;
}

export class DatabaseRepository<T extends { id: string; workspaceId?: string }> implements IRepository<T> {
  protected pool: pg.Pool;
  protected tableName: string;

  constructor(pool: pg.Pool, tableName: string) {
    this.pool = pool;
    this.tableName = tableName;
  }

  async get(id: string): Promise<T | null> {
    const res = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    return convertKeysToCamel(res.rows[0]);
  }

  async list(filter?: (item: T) => boolean): Promise<T[]> {
    const res = await this.pool.query(`SELECT * FROM ${this.tableName}`);
    const items = res.rows.map(row => convertKeysToCamel(row));
    return filter ? items.filter(filter) : items;
  }

  async create(item: T): Promise<T> {
    const dbRow = convertKeysToSnake(item);
    const keys = Object.keys(dbRow);
    const values = Object.values(dbRow);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    await this.pool.query(
      `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
    return item;
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const dbRow = convertKeysToSnake(updates);
    const keys = Object.keys(dbRow).filter(k => k !== 'id');
    if (keys.length === 0) return this.get(id);

    const values = keys.map(k => dbRow[k]);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    
    values.push(id);
    const res = await this.pool.query(
      `UPDATE ${this.tableName} SET ${setClause} WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (res.rows.length === 0) return null;
    return convertKeysToCamel(res.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.pool.query(
      `DELETE FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return (res.rowCount || 0) > 0;
  }
}

// Repositories subclasses
export class DatabaseWorkspaceRepository extends DatabaseRepository<any> {}
export class DatabaseUserRepository extends DatabaseRepository<any> {}
export class DatabaseMembershipRepository extends DatabaseRepository<any> {}
export class DatabaseOperatingRecordRepository extends DatabaseRepository<any> {}
export class DatabaseWorkItemRepository extends DatabaseRepository<any> {}
export class DatabaseTransactionRepository extends DatabaseRepository<any> {}
export class DatabaseApprovalRepository extends DatabaseRepository<any> {}
export class DatabaseAuditRepository extends DatabaseRepository<any> {}
export class DatabaseImportRepository extends DatabaseRepository<any> {}
export class DatabaseLaunchRepository extends DatabaseRepository<any> {}
