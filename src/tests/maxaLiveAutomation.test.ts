import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { MaxaLiveAutomationEngine } from '../../server/services/maxaLiveAutomationEngine.js';
import { maxaBrowserAgentRouter } from '../../server/routes/maxaBrowserAgentRoute.js';
import type { Server } from 'http';

describe('Maxa Live Automation Engine (nest.maxadesigns.com)', () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use(maxaBrowserAgentRouter);

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
      server.closeAllConnections?.();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('1. MaxaLiveAutomationEngine executes live pipeline with real Nest templates and emits events', async () => {
    const runId = 'test_live_run_101';
    const engine = new MaxaLiveAutomationEngine(runId, '1104 Arboretum Dr, Wilmington, NC', 'Sarah Jenkins');

    const receivedEvents: any[] = [];
    engine.on('automation_event', (e) => {
      receivedEvents.push(e);
    });

    const result = await engine.executeLiveAutomation({
      price: '$895,000',
      bedsBaths: '4 Beds / 3.5 Baths',
      headline: 'Architectural Coastal Retreat in Landfall',
      description: 'Custom luxury residence on private cul-de-sac.'
    });

    expect(result.success).toBe(true);
    expect(result.maxaProjectUrl).toBe('https://nest.maxadesigns.com/projects/prj_test_live_run_101');
    expect(result.templatesProcessed.length).toBe(3);
    expect(result.templatesProcessed[0].templateId).toBe('maxa_flyer_double');
    expect(result.templatesProcessed[0].previewUrl).toContain('cloudfront.net');
    expect(result.ncrecCompliancePassed).toBe(true);
    expect(result.stagedInVaWorkspace).toBe(true);
    expect(receivedEvents.length).toBeGreaterThanOrEqual(6);
  });

  it('2. POST /api/marketing/browser-agent/launch-browser returns interactive session configuration', async () => {
    const res = await fetch(`${baseUrl}/api/marketing/browser-agent/launch-browser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyAddress: '1104 Arboretum Dr',
        templateId: 'maxa_flyer_double'
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.mode).toBe('interactive_chrome');
    expect(data.targetUrl).toBe('https://nest.maxadesigns.com/categories/popular');
  });

  it('3. GET /api/marketing/browser-agent/stream/:runId establishes SSE stream connection', async () => {
    const runId = 'test_sse_stream_01';
    new MaxaLiveAutomationEngine(runId, '312 Mayfaire Way', 'Ann Gunn');

    const controller = new AbortController();
    const res = await fetch(`${baseUrl}/api/marketing/browser-agent/stream/${runId}`, {
      signal: controller.signal
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    controller.abort();
  });
});
