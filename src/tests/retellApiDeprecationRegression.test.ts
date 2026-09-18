/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Retell API Deprecation & Migration Regression Suite
 * 
 * Asserts:
 * 1. Codebase static scan: Ensures retired endpoints are NOT present in server/ or scripts/.
 * 2. Client unit tests:
 *    - POST /v2/list-agents with voice channel filter and items/pagination handling.
 *    - GET /list-agent-versions/:agent_id with descending version sort preservation.
 *    - POST /publish-agent-version/:agent_id targeting the modern unified endpoint.
 *    - GET /v2/list-phone-numbers with robust response parsing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  listAgents,
  listAllAgents,
  listAgentVersions,
  listAllAgentVersions,
  publishAgentVersion,
  listPhoneNumbers
} from '../../server/integrations/retellClient.js';

describe('Retell API Deprecation Static Codebase Scan', () => {
  const repoRoot = path.resolve(__dirname, '../..');
  const targetDirs = ['server', 'scripts'];

  function getAllFiles(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file !== '.git') {
          getAllFiles(filePath, fileList);
        }
      } else if (/\.(ts|js|cjs|mjs)$/.test(file)) {
        fileList.push(filePath);
      }
    }
    return fileList;
  }

  it('1. Confirms no retired Retell endpoints are present in server/ or scripts/', () => {
    const filesToCheck: string[] = [];
    for (const d of targetDirs) {
      getAllFiles(path.join(repoRoot, d), filesToCheck);
    }

    expect(filesToCheck.length).toBeGreaterThan(0);

    const retiredPatterns = [
      {
        name: 'Deprecated GET /list-agents (must be POST /v2/list-agents)',
        regex: /(?<!\/v2)\/list-agents(?!\w)/
      },
      {
        name: 'Deprecated GET /get-agent-versions/:id (must be GET /list-agent-versions/:id)',
        regex: /\/get-agent-versions(?!\w)/
      },
      {
        name: 'Deprecated POST /publish-agent/:id (must be POST /publish-agent-version/:id)',
        regex: /\/publish-agent\/(?!version)/
      },
      {
        name: 'Deprecated GET /list-phone-numbers (must be GET /v2/list-phone-numbers)',
        regex: /(?<!\/v2)\/list-phone-numbers(?!\w)/
      }
    ];

    const violations: Array<{ file: string; pattern: string; line: number; text: string }> = [];

    for (const filePath of filesToCheck) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((lineText, idx) => {
        // Skip comment lines in retellClient documentation referring to legacy names
        for (const pattern of retiredPatterns) {
          if (pattern.regex.test(lineText)) {
            violations.push({
              file: path.relative(repoRoot, filePath),
              pattern: pattern.name,
              line: idx + 1,
              text: lineText.trim()
            });
          }
        }
      });
    }

    if (violations.length > 0) {
      const failureMsg = violations
        .map(v => `${v.file}:${v.line} -> ${v.pattern} (found: "${v.text}")`)
        .join('\n');
      expect.fail(`Found deprecated Retell API endpoints in maintained code:\n${failureMsg}`);
    }

    expect(violations).toHaveLength(0);
  });
});

describe('Retell Modern Client Implementation Suite', () => {
  const originalFetch = global.fetch;
  const mockApiKey = 'test_retell_secret_key_12345';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('listAgents (POST /v2/list-agents)', () => {
    it('sends POST /v2/list-agents with voice channel filter by default', async () => {
      let interceptedUrl = '';
      let interceptedMethod = '';
      let interceptedBody: any = null;
      let interceptedHeaders: any = null;

      global.fetch = vi.fn().mockImplementation(async (url, init) => {
        interceptedUrl = String(url);
        interceptedMethod = init?.method || '';
        interceptedHeaders = init?.headers;
        interceptedBody = init?.body ? JSON.parse(init.body) : null;

        return {
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              { agent_id: 'agent_voice_1', agent_name: 'Ask Nest Ops', channel: 'voice' }
            ],
            has_more: false,
            pagination_key: null
          })
        } as any;
      });

      const result = await listAgents({ apiKey: mockApiKey });

      expect(interceptedUrl).toBe('https://api.retellai.com/v2/list-agents');
      expect(interceptedMethod).toBe('POST');
      expect(interceptedHeaders).toMatchObject({
        Authorization: `Bearer ${mockApiKey}`,
        'Content-Type': 'application/json'
      });
      expect(interceptedBody).toEqual({
        filter_criteria: {
          channel: {
            type: 'string',
            op: 'eq',
            value: 'voice'
          }
        }
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].agent_id).toBe('agent_voice_1');
      expect(result.hasMore).toBe(false);
    });

    it('paginates correctly using pagination_key while has_more is true', async () => {
      const calls: any[] = [];

      global.fetch = vi.fn().mockImplementation(async (url, init) => {
        const body = JSON.parse(init?.body);
        calls.push(body);

        if (!body.pagination_key) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              items: [{ agent_id: 'agent_p1' }],
              has_more: true,
              pagination_key: 'cursor_token_page_2'
            })
          } as any;
        } else {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              items: [{ agent_id: 'agent_p2' }],
              has_more: false,
              pagination_key: null
            })
          } as any;
        }
      });

      const allAgents = await listAllAgents({ apiKey: mockApiKey });

      expect(calls).toHaveLength(2);
      expect(calls[0].pagination_key).toBeUndefined();
      expect(calls[1].pagination_key).toBe('cursor_token_page_2');
      expect(allAgents).toHaveLength(2);
      expect(allAgents.map(a => a.agent_id)).toEqual(['agent_p1', 'agent_p2']);
    });
  });

  describe('listAgentVersions (GET /list-agent-versions/:agent_id)', () => {
    it('sends GET /list-agent-versions/:agent_id and preserves descending version order', async () => {
      let interceptedUrl = '';
      let interceptedMethod = '';

      global.fetch = vi.fn().mockImplementation(async (url, init) => {
        interceptedUrl = String(url);
        interceptedMethod = init?.method || 'GET';

        return {
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              { agent_id: 'agent_cdd031880770993e4b11cb9340', version: 14, is_published: false },
              { agent_id: 'agent_cdd031880770993e4b11cb9340', version: 16, is_published: true },
              { agent_id: 'agent_cdd031880770993e4b11cb9340', version: 15, is_published: false }
            ],
            has_more: false,
            pagination_key: null
          })
        } as any;
      });

      const result = await listAgentVersions('agent_cdd031880770993e4b11cb9340', { apiKey: mockApiKey });

      expect(interceptedUrl).toBe('https://api.retellai.com/list-agent-versions/agent_cdd031880770993e4b11cb9340');
      expect(interceptedMethod).toBe('GET');
      expect(result.items).toHaveLength(3);
      // Verify descending sort order preservation
      expect(result.items.map(v => v.version)).toEqual([16, 15, 14]);
      expect(result.items[0].is_published).toBe(true);
      expect(result.hasMore).toBe(false);
    });

    it('handles query parameters (limit and pagination_key) correctly', async () => {
      let interceptedUrl = '';

      global.fetch = vi.fn().mockImplementation(async (url) => {
        interceptedUrl = String(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            items: [],
            has_more: false
          })
        } as any;
      });

      await listAgentVersions('agent_xyz', {
        limit: 10,
        paginationKey: 'test_token',
        apiKey: mockApiKey
      });

      const parsedUrl = new URL(interceptedUrl);
      expect(parsedUrl.pathname).toBe('/list-agent-versions/agent_xyz');
      expect(parsedUrl.searchParams.get('limit')).toBe('10');
      expect(parsedUrl.searchParams.get('pagination_key')).toBe('test_token');
    });
  });

  describe('publishAgentVersion (POST /publish-agent-version/:agent_id)', () => {
    it('sends POST /publish-agent-version/:agent_id with version_description', async () => {
      let interceptedUrl = '';
      let interceptedMethod = '';
      let interceptedBody: any = null;

      global.fetch = vi.fn().mockImplementation(async (url, init) => {
        interceptedUrl = String(url);
        interceptedMethod = init?.method || '';
        interceptedBody = init?.body ? JSON.parse(init.body) : null;

        return {
          ok: true,
          status: 200,
          json: async () => ({
            agent_id: 'agent_cdd031880770993e4b11cb9340',
            version: 17,
            version_description: 'Automated release test version',
            is_published: true
          })
        } as any;
      });

      const result = await publishAgentVersion('agent_cdd031880770993e4b11cb9340', {
        versionDescription: 'Automated release test version',
        apiKey: mockApiKey
      });

      expect(interceptedUrl).toBe('https://api.retellai.com/publish-agent-version/agent_cdd031880770993e4b11cb9340');
      expect(interceptedMethod).toBe('POST');
      expect(interceptedBody).toEqual({
        version_description: 'Automated release test version'
      });
      expect(result.version).toBe(17);
      expect(result.is_published).toBe(true);
    });
  });

  describe('listPhoneNumbers (GET /v2/list-phone-numbers)', () => {
    it('correctly queries GET /v2/list-phone-numbers and normalizes items array', async () => {
      let interceptedUrl = '';
      let interceptedMethod = '';

      global.fetch = vi.fn().mockImplementation(async (url, init) => {
        interceptedUrl = String(url);
        interceptedMethod = init?.method || 'GET';

        return {
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                phone_number: '+19105072047',
                phone_number_pretty: '+1 (910) 507-2047',
                inbound_agents: [{ agent_id: 'agent_cdd031880770993e4b11cb9340', agent_version: 16, weight: 1 }]
              }
            ],
            has_more: false
          })
        } as any;
      });

      const result = await listPhoneNumbers({ apiKey: mockApiKey });

      expect(interceptedUrl).toBe('https://api.retellai.com/v2/list-phone-numbers');
      expect(interceptedMethod).toBe('GET');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].phone_number).toBe('+19105072047');
      expect(result.hasMore).toBe(false);
    });
  });
});
