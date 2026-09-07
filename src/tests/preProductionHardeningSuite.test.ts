/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite: Pre-Production Polish & Hardening Suite
 * Tests HTTP compression, automated rolling snapshots, rate limiting, and PWA mobile manifests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { BackupSnapshotService } from '../../server/persistence/backupSnapshotService';
import {
  saveCanonicalMarketingTask,
  saveCanonicalMarketingRequest,
  getAllCanonicalMarketingRequests,
  getAllCanonicalMarketingTasks,
  resetCanonicalStoreForTesting
} from '../../server/persistence/marketingCampaignsRepository';

describe('Pre-Production Polish & Hardening Test Suite', () => {
  beforeEach(() => {
    resetCanonicalStoreForTesting();
  });

  describe('1. Automated Backup Snapshot & Integrity Service', () => {
    it('creates a complete snapshot of marketing requests and tasks to disk', () => {
      saveCanonicalMarketingRequest({
        id: 'req_snap_test_01',
        title: 'Snapshot Test Container',
        category: 'listing_launch',
        agentName: 'Marcus Aman',
        channel: 'phone',
        taskIds: ['task_snap_test_01'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      saveCanonicalMarketingTask({
        id: 'task_snap_test_01',
        requestId: 'req_snap_test_01',
        requestTitle: 'Snapshot Test Container',
        title: 'Feature Sheet',
        category: 'print',
        agentName: 'Marcus Aman',
        status: 'request_received',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const snapshot = BackupSnapshotService.createSnapshot('test_run');
      expect(snapshot).toBeDefined();
      expect(snapshot?.filePath).toBeDefined();
      expect(fs.existsSync(snapshot!.filePath)).toBe(true);

      const raw = fs.readFileSync(snapshot!.filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.reason).toBe('test_run');
      expect(parsed.data.canonicalRequests.length).toBeGreaterThanOrEqual(1);
      expect(parsed.data.canonicalTasks.length).toBeGreaterThanOrEqual(1);
    });

    it('lists created snapshots with metadata and file sizes', () => {
      const snapshots = BackupSnapshotService.listSnapshots();
      expect(Array.isArray(snapshots)).toBe(true);
      expect(snapshots.length).toBeGreaterThanOrEqual(1);

      const latest = snapshots[0];
      expect(latest.id).toBeDefined();
      expect(latest.fileSizeBytes).toBeGreaterThan(0);
    });

    it('validates and auto-repairs orphaned tasks missing a parent request', () => {
      const testRunId = Date.now();
      const orphanTaskId = `task_orphan_test_${testRunId}`;
      const orphanParentId = `req_nonexistent_parent_${testRunId}`;
      // Save an orphan task with nonexistent requestId
      const orphanTask = {
        id: orphanTaskId,
        requestId: orphanParentId,
        requestTitle: '100 Beachside Way',
        propertyAddress: '100 Beachside Way',
        title: 'Emergency Flyer',
        category: 'print' as const,
        status: 'request_received' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveCanonicalMarketingTask(orphanTask);

      const result = BackupSnapshotService.validateAndReconcileIntegrity();
      expect(result.repaired).toBeGreaterThanOrEqual(1);

      const allRequests = getAllCanonicalMarketingRequests();
      const parent = allRequests.find(r => r.id === orphanParentId);
      expect(parent).toBeDefined();
      expect(parent?.propertyAddress).toBe('100 Beachside Way');
      expect(parent?.taskIds).toContain(orphanTaskId);
    });
  });

  describe('2. PWA Mobile Manifest & iOS Meta Tags', () => {
    it('verifies public/manifest.json is valid JSON with standalone mobile parameters', () => {
      const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const raw = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(raw);

      expect(manifest.short_name).toBe('Shapework');
      expect(manifest.name).toContain('Shapework');
      expect(manifest.display).toBe('standalone');
      expect(manifest.start_url).toBe('/');
      expect(manifest.theme_color).toBe('#0B0F17');
    });

    it('verifies index.html links to manifest and includes Apple mobile web app tags', () => {
      const indexPath = path.join(process.cwd(), 'index.html');
      const html = fs.readFileSync(indexPath, 'utf-8');

      expect(html).toContain('<link rel="manifest" href="/manifest.json"');
      expect(html).toContain('<meta name="apple-mobile-web-app-capable" content="yes"');
      expect(html).toContain('<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"');
      expect(html).toContain('<meta name="apple-mobile-web-app-title" content="Shapework"');
    });
  });

  describe('3. Server Compression & Rate Limiting Verification', () => {
    it('verifies server.ts imports and mounts compression middleware', () => {
      const serverPath = path.join(process.cwd(), 'server.ts');
      const content = fs.readFileSync(serverPath, 'utf-8');

      expect(content).toContain("import compression from 'compression';");
      expect(content).toContain('app.use(compression());');
    });

    it('verifies server.ts configures sliding window rate limiters for auth and AI endpoints', () => {
      const serverPath = path.join(process.cwd(), 'server.ts');
      const content = fs.readFileSync(serverPath, 'utf-8');

      expect(content).toContain('createRateLimiter');
      expect(content).toContain("app.use('/api/auth/login', authRateLimiter)");
      expect(content).toContain("app.use('/api/voice-agent/context-query', aiVoiceRateLimiter)");
      expect(content).toContain("app.use('/api/', generalApiRateLimiter)");
    });
  });
});
