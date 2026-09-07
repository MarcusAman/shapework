/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Automated Backup Snapshot & Data Integrity Service
 * Performs hourly rolling state snapshots, enforces a 24-hour retention policy,
 * and runs startup integrity reconciliation.
 */

import fs from 'fs';
import path from 'path';
import {
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks,
  saveCanonicalMarketingRequest,
  saveCanonicalMarketingTask
} from './marketingCampaignsRepository';

const isServer = typeof process !== 'undefined' && Boolean(process.versions?.node);

const BACKUP_BASE_DIR = path.join(process.cwd(), 'backups');
const SNAPSHOTS_DIR = path.join(BACKUP_BASE_DIR, 'snapshots');
const MAX_SNAPSHOT_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours retention

export interface SnapshotMetadata {
  id: string;
  timestamp: string;
  filePath: string;
  totalRequests: number;
  totalTasks: number;
  fileSizeBytes: number;
}

export class BackupSnapshotService {
  private static intervalTimer: NodeJS.Timeout | null = null;

  private static ensureDirectories() {
    if (!isServer) return;
    try {
      if (!fs.existsSync(SNAPSHOTS_DIR)) {
        fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
      }
    } catch (e) {
      console.warn('[Backup Service] Failed to create snapshots directory:', e);
    }
  }

  /**
   * Captures a complete snapshot of current in-memory & persisted state to disk.
   */
  public static createSnapshot(reason = 'scheduled_hourly'): SnapshotMetadata | null {
    if (!isServer) return null;
    this.ensureDirectories();

    try {
      const now = new Date();
      const timestampIso = now.toISOString();
      const fileSafeDate = timestampIso.replace(/[:.]/g, '-');
      const filename = `snapshot_${fileSafeDate}.json`;
      const fullPath = path.join(SNAPSHOTS_DIR, filename);

      const requests = getAllCanonicalMarketingRequests();
      const tasks = getAllCanonicalMarketingTasks();

      const snapshotPayload = {
        version: '1.0.0',
        reason,
        createdAt: timestampIso,
        counts: {
          requests: requests.length,
          tasks: tasks.length
        },
        data: {
          canonicalRequests: requests,
          canonicalTasks: tasks
        }
      };

      const jsonStr = JSON.stringify(snapshotPayload, null, 2);
      fs.writeFileSync(fullPath, jsonStr, 'utf-8');

      // Prune expired snapshots
      this.pruneOldSnapshots();

      console.log(`[Backup Service] ✓ Created snapshot ${filename} (${requests.length} reqs, ${tasks.length} tasks)`);

      return {
        id: `snap_${Date.now()}`,
        timestamp: timestampIso,
        filePath: fullPath,
        totalRequests: requests.length,
        totalTasks: tasks.length,
        fileSizeBytes: Buffer.byteLength(jsonStr)
      };
    } catch (err) {
      console.error('[Backup Service] ❌ Failed to create snapshot:', err);
      return null;
    }
  }

  /**
   * Enforces 24-hour retention policy by removing expired snapshots.
   */
  public static pruneOldSnapshots(): number {
    if (!isServer) return 0;
    this.ensureDirectories();

    try {
      const files = fs.readdirSync(SNAPSHOTS_DIR);
      const now = Date.now();
      let prunedCount = 0;

      for (const file of files) {
        if (file.startsWith('snapshot_') && file.endsWith('.json')) {
          const filePath = path.join(SNAPSHOTS_DIR, file);
          const stats = fs.statSync(filePath);
          const age = now - stats.mtimeMs;

          if (age > MAX_SNAPSHOT_AGE_MS) {
            fs.unlinkSync(filePath);
            prunedCount++;
          }
        }
      }

      return prunedCount;
    } catch (err) {
      console.warn('[Backup Service] Failed to prune old snapshots:', err);
      return 0;
    }
  }

  /**
   * Lists all existing snapshots on disk.
   */
  public static listSnapshots(): SnapshotMetadata[] {
    if (!isServer) return [];
    this.ensureDirectories();

    try {
      const files = fs.readdirSync(SNAPSHOTS_DIR);
      const results: SnapshotMetadata[] = [];

      for (const file of files) {
        if (file.startsWith('snapshot_') && file.endsWith('.json')) {
          const filePath = path.join(SNAPSHOTS_DIR, file);
          const stats = fs.statSync(filePath);
          results.push({
            id: file.replace('.json', ''),
            timestamp: stats.mtime.toISOString(),
            filePath,
            totalRequests: 0,
            totalTasks: 0,
            fileSizeBytes: stats.size
          });
        }
      }

      return results.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } catch {
      return [];
    }
  }

  /**
   * Validates relational integrity between requests and child tasks on boot.
   * Auto-repairs orphaned tasks by ensuring valid parent requests exist.
   */
  public static validateAndReconcileIntegrity(): { checked: number; repaired: number } {
    if (!isServer) return { checked: 0, repaired: 0 };

    try {
      const requests = getAllCanonicalMarketingRequests();
      const tasks = getAllCanonicalMarketingTasks();
      const requestMap = new Map(requests.map(r => [r.id, r]));

      let repairedCount = 0;

      tasks.forEach(task => {
        if (!task.isArchived && task.status !== 'archived' && task.requestId && !requestMap.has(task.requestId)) {
          // Orphan active task detected: create parent placeholder request
          const recoveredRequest = {
            id: task.requestId,
            title: task.propertyAddress || task.requestTitle || 'Recovered Inbound Request',
            propertyAddress: task.propertyAddress || task.requestTitle || 'New Listing',
            category: task.category || 'listing_launch',
            agentName: task.agentName || 'Listing Broker',
            channel: 'phone' as const,
            requestExcerpt: `[Integrity Recovery]: Restored parent request for task ${task.title}`,
            taskIds: [task.id],
            receivedAt: 'Recovered',
            createdAt: task.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          saveCanonicalMarketingRequest(recoveredRequest);
          requestMap.set(recoveredRequest.id, recoveredRequest);
          repairedCount++;
        }
      });

      console.log(`[Integrity Check] Validated ${tasks.length} tasks & ${requests.length} requests. Repaired: ${repairedCount}`);
      return { checked: tasks.length + requests.length, repaired: repairedCount };
    } catch (err) {
      console.warn('[Integrity Check] Failed to run integrity validation:', err);
      return { checked: 0, repaired: 0 };
    }
  }

  /**
   * Initializes recurring hourly snapshot cron.
   */
  public static initAutomatedSnapshots(intervalMinutes = 60) {
    if (!isServer) return;
    if (this.intervalTimer) return;

    // Run initial integrity check and baseline snapshot
    this.validateAndReconcileIntegrity();
    this.createSnapshot('startup_baseline');

    const intervalMs = intervalMinutes * 60 * 1000;
    this.intervalTimer = setInterval(() => {
      this.createSnapshot('scheduled_hourly');
    }, intervalMs);

    this.intervalTimer.unref(); // Allow Node process to exit cleanly without waiting
  }
}
