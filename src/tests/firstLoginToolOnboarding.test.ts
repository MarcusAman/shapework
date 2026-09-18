import { describe, it, expect } from 'vitest';
import { userToolCredentialsRouter } from '../../server/routes/userToolCredentialsRouter';

describe('First-Login Tool Connection & User Onboarding Test Suite', () => {
  it('1. GET /api/user/tools/status returns status for all 6 core brokerage tools', async () => {
    const res = await new Promise<{ status: number; body: any }>((resolve) => {
      const mockReq: any = {
        method: 'GET',
        url: '/status',
        headers: { authorization: 'Bearer usr_new_agent_01' }
      };
      const mockRes: any = {
        status: (s: number) => ({ json: (d: any) => resolve({ status: s, body: d }) }),
        json: (d: any) => resolve({ status: 200, body: d })
      };
      (userToolCredentialsRouter as any).handle(mockReq, mockRes, () => {});
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.totalTools).toBe(6);
    expect(res.body.tools).toBeDefined();
    expect(res.body.tools.google).toBeDefined();
    expect(res.body.tools.rechat).toBeDefined();
    expect(res.body.tools.dotloop).toBeDefined();
    expect(res.body.tools.maxa).toBeDefined();
    expect(res.body.tools.basecamp).toBeDefined();
    expect(res.body.tools.quickbooks).toBeDefined();
  });

  it('2. POST /api/user/tools/connect saves user credentials and marks tool as connected', async () => {
    const res = await new Promise<{ status: number; body: any }>((resolve) => {
      const mockReq: any = {
        method: 'POST',
        url: '/connect',
        headers: { authorization: 'Bearer usr_new_agent_01' },
        body: {
          toolType: 'rechat',
          email: 'agent.sarah@nestrealty.com',
          token: 'rechat_secret_token_123'
        }
      };
      const mockRes: any = {
        status: (s: number) => ({ json: (d: any) => resolve({ status: s, body: d }) }),
        json: (d: any) => resolve({ status: 200, body: d })
      };
      (userToolCredentialsRouter as any).handle(mockReq, mockRes, () => {});
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tool.connected).toBe(true);
    expect(res.body.tool.accountEmail).toBe('agent.sarah@nestrealty.com');
  });

  it('3. POST /api/user/tools/disconnect cleanly disconnects a tool', async () => {
    const res = await new Promise<{ status: number; body: any }>((resolve) => {
      const mockReq: any = {
        method: 'POST',
        url: '/disconnect',
        headers: { authorization: 'Bearer usr_new_agent_01' },
        body: {
          toolType: 'rechat'
        }
      };
      const mockRes: any = {
        status: (s: number) => ({ json: (d: any) => resolve({ status: s, body: d }) }),
        json: (d: any) => resolve({ status: 200, body: d })
      };
      (userToolCredentialsRouter as any).handle(mockReq, mockRes, () => {});
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Disconnected rechat');
  });
});
