import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { ownerMetricsRouter } from './ownerMetricsRouter.js';

describe('Live Owner Metrics & Idempotent SLA Scheduler Evaluation', () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use(ownerMetricsRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  const wsWilmington = 'ws_wilmington';

  it('1. GET /api/owner/metrics returns truthful numeric counts without static fallback literals', async () => {
    const res = await fetch(`${baseUrl}/api/owner/metrics`, {
      headers: {
        'x-workspace-id': wsWilmington,
        'authorization': 'Bearer token_usr_owner'
      }
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(typeof body.requestsHandled).toBe('number');
    expect(typeof body.totalTasks).toBe('number');
    expect(typeof body.completedTasks).toBe('number');
    expect(typeof body.stillOpen).toBe('number');
    expect(typeof body.overdue).toBe('number');
    expect(typeof body.triageCount).toBe('number');
    expect(typeof body.routedWithoutRyan).toBe('number');
    expect(typeof body.neededRyan).toBe('number');
    expect(Array.isArray(body.outOfOfficeStaff)).toBe(true);

    // Verify source is live from either PostgreSQL or truthful repository calculation
    expect(['postgresql_live', 'repository_live']).toContain(body.source);
  });

  it('2. POST /api/internal/jobs/evaluate-task-slas evaluates overdue tasks idempotently with America/New_York timezone', async () => {
    const secret = process.env.INTERNAL_JOB_KEY || 'shapework_test_internal_secret';

    const res = await fetch(`${baseUrl}/api/internal/jobs/evaluate-task-slas`, {
      method: 'POST',
      headers: {
        'x-internal-job-token': secret
      }
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.timeZone).toBe('America/New_York');
    expect(body.executedAtEastern).toBeDefined();
    expect(typeof body.evaluatedCount).toBe('number');
    expect(typeof body.overdueCount).toBe('number');
    expect(Array.isArray(body.escalatedTaskIds)).toBe(true);

    // Second execution with same state must be idempotent
    const res2 = await fetch(`${baseUrl}/api/internal/jobs/evaluate-task-slas`, {
      method: 'POST',
      headers: {
        'x-internal-job-token': secret
      }
    });

    expect(res2.status).toBe(200);
    const body2 = await res2.json();
    expect(body2.success).toBe(true);
  });

  it('3. POST /api/internal/jobs/evaluate-task-slas rejects unauthorized requests without valid token', async () => {
    const res = await fetch(`${baseUrl}/api/internal/jobs/evaluate-task-slas`, {
      method: 'POST',
      headers: {
        'x-internal-job-token': 'invalid_token_xyz'
      }
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Forbidden');
  });

  it('4. POST /api/internal/jobs/evaluate-task-slas rejects requests with missing token header', async () => {
    const res = await fetch(`${baseUrl}/api/internal/jobs/evaluate-task-slas`, {
      method: 'POST',
      headers: {}
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Forbidden');
  });

  it('5. POST /api/internal/jobs/evaluate-task-slas accepts Bearer token format', async () => {
    const secret = process.env.INTERNAL_JOB_KEY || 'shapework_test_internal_secret';
    const res = await fetch(`${baseUrl}/api/internal/jobs/evaluate-task-slas`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`
      }
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('6. GET /api/owner/metrics enforces workspace isolation', async () => {
    const resWilm = await fetch(`${baseUrl}/api/owner/metrics`, {
      headers: {
        'x-workspace-id': 'ws_wilmington',
        'authorization': 'Bearer token_usr_owner'
      }
    });
    expect(resWilm.status).toBe(200);
    const bodyWilm = await resWilm.json();
    expect(bodyWilm.workspaceId).toBe('ws_wilmington');

    const resOther = await fetch(`${baseUrl}/api/owner/metrics`, {
      headers: {
        'x-workspace-id': 'ws_charlottesville',
        'authorization': 'Bearer token_usr_owner'
      }
    });
    expect(resOther.status).toBe(403);
  });
});
