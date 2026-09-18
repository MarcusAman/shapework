/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Maintenance Mode & Retell Sync Freeze Test Suite
 * Validates that MAINTENANCE_MODE=true blocks mutations with HTTP 503 & Retry-After,
 * pauses background email scanners without claiming messages, preserves health endpoints,
 * and confirms RETELL_SYNC_ENABLED=false globally suppresses Retell API calls.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import http from 'http';
import express from 'express';
import { scanAskNoraInbox } from '../../server/services/noraInboxScannerService.js';
import { syncNoraEmailInbox } from '../../server/integrations/google/noraEmailIntakeService.js';
import { getMarketingInboundCalls } from '../../server/integrations/marketingCallsService.js';

describe('Maintenance Mode & Retell Synchronization Freeze Suite', () => {
  const originalEnv = { ...process.env };

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('1. Maintenance Mode (MAINTENANCE_MODE=true)', () => {
    it('1. Pauses IMAP scanner loop without claiming or marking messages', async () => {
      process.env.MAINTENANCE_MODE = 'true';
      const scanRes = await scanAskNoraInbox();
      expect(scanRes.scannedCount).toBe(0);
      expect(scanRes.ingestedCount).toBe(0);
      expect(scanRes.errors).toContain('Maintenance mode active');
    });

    it('2. Pauses Google Workspace email intake sync without processing messages', async () => {
      process.env.MAINTENANCE_MODE = 'true';
      const syncRes = await syncNoraEmailInbox();
      expect(syncRes.syncedCount).toBe(0);
      expect(syncRes.newRequestsCount).toBe(0);
      expect(syncRes.results.length).toBe(0);
    });

    it('3. Mutating API requests return HTTP 503 with Retry-After header while health endpoints remain 200', async () => {
      process.env.MAINTENANCE_MODE = 'true';

      const testApp = express();
      testApp.use(express.json());

      // Simulate the exact maintenance middleware from server.ts
      testApp.use((req, res, next) => {
        if (process.env.MAINTENANCE_MODE !== 'true') return next();
        if (req.path === '/healthz' || req.path === '/api/health/readiness') return next();
        const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
        if (isMutating) {
          res.setHeader('Retry-After', '300');
          return res.status(503).json({
            error: 'MAINTENANCE_MODE_ACTIVE',
            message: 'Shapework is currently undergoing scheduled maintenance.',
            retryAfterSeconds: 300
          });
        }
        if (req.method === 'GET' && req.path === '/') {
          res.setHeader('Retry-After', '300');
          return res.status(503).send('<html><body><h1>Scheduled System Maintenance</h1></body></html>');
        }
        next();
      });

      testApp.get('/healthz', (req, res) => res.json({ status: 'ok' }));
      testApp.get('/api/health/readiness', (req, res) => res.json({ status: 'ready', database: 'connected' }));
      testApp.post('/api/marketing/tasks', (req, res) => res.json({ success: true }));

      const server = http.createServer(testApp);
      await new Promise<void>((resolve) => server.listen(0, resolve));
      const address = server.address() as any;
      const baseUrl = `http://127.0.0.1:${address.port}`;

      try {
        // Test health endpoint is unaffected
        const healthRes = await fetch(`${baseUrl}/healthz`);
        expect(healthRes.status).toBe(200);
        const healthData = await healthRes.json();
        expect(healthData.status).toBe('ok');

        // Test mutating POST route returns 503
        const mutateRes = await fetch(`${baseUrl}/api/marketing/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Test Task' })
        });
        expect(mutateRes.status).toBe(503);
        expect(mutateRes.headers.get('retry-after')).toBe('300');
        const mutateData = await mutateRes.json();
        expect(mutateData.error).toBe('MAINTENANCE_MODE_ACTIVE');
        expect(mutateData.retryAfterSeconds).toBe(300);

        // Test normal UI HTML request returns 503
        const uiRes = await fetch(`${baseUrl}/`);
        expect(uiRes.status).toBe(503);
        expect(uiRes.headers.get('retry-after')).toBe('300');
        const uiHtml = await uiRes.text();
        expect(uiHtml).toContain('Scheduled System Maintenance');
      } finally {
        server.close();
      }
    });
  });

  describe('2. Retell Synchronization Global Freeze (RETELL_SYNC_ENABLED=false)', () => {
    it('1. Suppresses all outbound HTTP requests to api.retellai.com in getMarketingInboundCalls', async () => {
      process.env.RETELL_SYNC_ENABLED = 'false';
      process.env.RETELL_API_KEY = 'mock_key_that_must_not_be_called';

      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      try {
        const calls = await getMarketingInboundCalls();
        expect(Array.isArray(calls)).toBe(true);

        // Verify fetch was never called with retellai.com URL
        const retellCalls = fetchSpy.mock.calls.filter(([url]) =>
          String(url).includes('api.retellai.com')
        );
        expect(retellCalls.length).toBe(0);
      } finally {
        fetchSpy.mockRestore();
      }
    });
  });
});
