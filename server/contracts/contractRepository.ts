/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Repository & Production Safety Gate — Phase 2.1 Hardened Architecture
 * Provides IContractRepository abstraction, DevelopmentContractRepository (JSON/in-memory),
 * and ProductionSafetyGate to fail closed in production without durable database storage.
 */

import { ContractIntakeSession, ContractAuditEvent } from './contractDomainTypes.js';
import fs from 'fs';
import path from 'path';

export interface IContractRepository {
  save(session: ContractIntakeSession): Promise<ContractIntakeSession>;
  findById(id: string, workspaceId: string): Promise<ContractIntakeSession | null>;
  findByIdempotencyKey(idempotencyKey: string, workspaceId: string): Promise<ContractIntakeSession | null>;
  listByWorkspace(workspaceId: string): Promise<ContractIntakeSession[]>;
  saveAuditEvent(event: ContractAuditEvent): Promise<void>;
  getAuditEvents(sessionId: string, workspaceId: string): Promise<ContractAuditEvent[]>;
  clearForTesting(): void;
}

export class ProductionSafetyGate {
  /**
   * Asserts that contract copilot is operating safely.
   * Fails closed in production if no durable database datastore is configured.
   */
  public static assertProductionSafety(): void {
    const isProduction = process.env.APP_MODE === 'production' || process.env.NODE_ENV === 'production';
    const hasDurableDb = process.env.STORAGE_DRIVER === 'database' || process.env.DATABASE_URL !== undefined || process.env.ALLOW_DEMO_CONTRACTS === 'true';

    if (isProduction && !hasDurableDb) {
      const err = new Error('CONTRACT_COPILOT_DISABLED_NO_DURABLE_STORAGE: Contract Copilot requires a durable database provider (PostgreSQL/Supabase) in production environments.');
      (err as any).code = 'CONTRACT_COPILOT_DISABLED_NO_DURABLE_STORAGE';
      throw err;
    }
  }
}

export class DevelopmentContractRepository implements IContractRepository {
  private sessions: Map<string, ContractIntakeSession> = new Map();
  private auditEvents: Map<string, ContractAuditEvent[]> = new Map();
  private storageDir = path.resolve(process.cwd(), 'data/private/contract-sessions');

  constructor() {
    this.ensureStorageDir();
    this.loadFromDisk();
  }

  private ensureStorageDir(): void {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
    } catch (err) {
      console.warn('[DevelopmentContractRepository] Could not create storage dir:', err);
    }
  }

  private loadFromDisk(): void {
    try {
      if (!fs.existsSync(this.storageDir)) return;
      const files = fs.readdirSync(this.storageDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.storageDir, file);
          const raw = fs.readFileSync(filePath, 'utf-8');
          const session: ContractIntakeSession = JSON.parse(raw);
          if (session && session.id && session.workspaceId) {
            this.sessions.set(session.id, session);
          }
        }
      }
    } catch (err) {
      console.warn('[DevelopmentContractRepository] Failed to load sessions from disk:', err);
    }
  }

  private saveToDisk(session: ContractIntakeSession): void {
    try {
      this.ensureStorageDir();
      const filePath = path.join(this.storageDir, `${session.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf-8');
    } catch (err) {
      console.warn(`[DevelopmentContractRepository] Failed to write session ${session.id} to disk:`, err);
    }
  }

  public async save(session: ContractIntakeSession): Promise<ContractIntakeSession> {
    ProductionSafetyGate.assertProductionSafety();
    this.sessions.set(session.id, { ...session });
    this.saveToDisk(session);
    return { ...session };
  }

  public async findById(id: string, workspaceId: string): Promise<ContractIntakeSession | null> {
    ProductionSafetyGate.assertProductionSafety();
    const session = this.sessions.get(id);
    if (!session || session.workspaceId !== workspaceId) {
      return null;
    }
    return { ...session };
  }

  public async findByIdempotencyKey(idempotencyKey: string, workspaceId: string): Promise<ContractIntakeSession | null> {
    ProductionSafetyGate.assertProductionSafety();
    for (const session of this.sessions.values()) {
      if (session.workspaceId === workspaceId && session.idempotencyKey === idempotencyKey) {
        return { ...session };
      }
    }
    return null;
  }

  public async listByWorkspace(workspaceId: string): Promise<ContractIntakeSession[]> {
    ProductionSafetyGate.assertProductionSafety();
    const result: ContractIntakeSession[] = [];
    for (const session of this.sessions.values()) {
      if (session.workspaceId === workspaceId) {
        result.push({ ...session });
      }
    }
    return result;
  }

  public async saveAuditEvent(event: ContractAuditEvent): Promise<void> {
    ProductionSafetyGate.assertProductionSafety();
    const list = this.auditEvents.get(event.sessionId) || [];
    
    // Append-only check: prevent duplicate event IDs
    if (list.some(e => e.id === event.id)) {
      return;
    }
    
    list.push({ ...event });
    this.auditEvents.set(event.sessionId, list);
  }

  public async getAuditEvents(sessionId: string, workspaceId: string): Promise<ContractAuditEvent[]> {
    ProductionSafetyGate.assertProductionSafety();
    const session = await this.findById(sessionId, workspaceId);
    if (!session) return [];
    return (this.auditEvents.get(sessionId) || []).map(e => ({ ...e }));
  }

  public clearForTesting(): void {
    this.sessions.clear();
    this.auditEvents.clear();
  }
}

// Singleton repository export
export const defaultContractRepository: IContractRepository = new DevelopmentContractRepository();
