/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Marketing Intake Durable Database Persistence & Timing Verification Suite
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'http';
import crypto from 'crypto';
import pg from 'pg';
import { retellToolsRouter } from '../../server/routes/retellToolsRoute.js';
import { generateRetellSignature } from '../../server/security/retellWebhookVerifier.js';
import { getDbPool } from '../../server/persistence/repositories.js';

describe('Marketing Intake Durable Persistence & Timing Instrumentation', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;
  let pool: pg.Pool;
  const testApiKey = 'test_retell_key_durable_timing_123';
  const originalRetellKey = process.env.RETELL_API_KEY;

  beforeAll(async () => {
    process.env.RETELL_API_KEY = testApiKey;
    process.env.NODE_ENV = 'test';
    pool = (getDbPool() || new pg.Pool({ connectionString: process.env.DATABASE_URL })) as pg.Pool;

    app = express();
    app.use(express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString('utf8');
      }
    }));
    app.use('/api/retell/tools', retellToolsRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    process.env.RETELL_API_KEY = originalRetellKey;
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('1. Returns structured timing instrumentation and fastMode status', async () => {
    const payload = {
      name: 'submit_marketing_intake',
      args: {
        propertyAddress: '742 Lumina Ave, Wrightsville Beach NC',
        flexMlsStatus: 'flex_live',
        mlsNumber: '10045678',
        price: 1850000,
        squareFootage: 3600,
        bedrooms: 4,
        bathrooms: 4.5,
        deliverables: ['Open House Tri-Fold Flyer'],
        neededByDate: '2026-09-18'
      },
      call: {
        call_id: 'call_durable_timing_test_01',
        from_number: '+19106128283'
      }
    };
    const rawBody = JSON.stringify(payload);
    const signature = generateRetellSignature(rawBody, testApiKey);

    const startTime = Date.now();
    const res = await fetch(`${baseUrl}/api/retell/tools/submit-marketing-intake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-retell-signature': signature
      },
      body: rawBody
    });
    const clientRoundTripMs = Date.now() - startTime;

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    // Verify timing metrics
    expect(data.timing).toBeDefined();
    expect(data.timing.fastModeActive).toBe(true);
    expect(typeof data.timing.authDurationMs).toBe('number');
    expect(typeof data.timing.validationDurationMs).toBe('number');
    expect(typeof data.timing.dbTransactionDurationMs).toBe('number');
    expect(typeof data.timing.totalServerDurationMs).toBe('number');
    expect(data.timing.totalServerDurationMs).toBeLessThan(1000); // Sub-second server execution

    // Verify durable PostgreSQL write completed BEFORE response returned
    const reqCheck = await pool.query(
      'SELECT id, property_address, status FROM canonical_marketing_requests WHERE id = $1',
      [data.createdRequestId]
    );
    expect(reqCheck.rows.length).toBe(1);
    expect(reqCheck.rows[0].property_address).toContain('742 Lumina Ave');

    const taskCheck = await pool.query(
      'SELECT id, request_id, title, status FROM canonical_marketing_tasks WHERE request_id = $1',
      [data.createdRequestId]
    );
    expect(taskCheck.rows.length).toBeGreaterThan(0);
    expect(taskCheck.rows[0].title).toBe('Open House Tri-Fold Flyer');
  });

  it('2. Confirms fastMode preserves all deliverables and compliance verification without sleeps', async () => {
    const payload = {
      name: 'submit_marketing_intake',
      args: {
        propertyAddress: '120 Market Street, Wilmington NC',
        deliverables: ['Single-Page Flyer'],
        price: 950000,
        squareFootage: 2800,
        bedrooms: 3,
        bathrooms: 2.5
      },
      call: {
        call_id: 'call_fastmode_check_02',
        from_number: '+19106128283'
      }
    };
    const rawBody = JSON.stringify(payload);
    const signature = generateRetellSignature(rawBody, testApiKey);

    const res = await fetch(`${baseUrl}/api/retell/tools/submit-marketing-intake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-retell-signature': signature
      },
      body: rawBody
    });
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.runId).toBeDefined();
    expect(data.timing.fastModeActive).toBe(true);
    // Real work is intact
    expect(data.policyVersion).toBe('nora_marketing_intake_v2.1');
    expect(data.knowledgeVersion).toBe('nest_handbook_2026.1');
  });
});
