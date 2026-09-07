/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Retell API Modern Client Integration
 * Implements official v2/modern Retell API endpoints:
 * - POST /v2/list-agents (voice filter, items array, pagination_key)
 * - GET /list-agent-versions/:agent_id (items array, version sorting, pagination_key)
 * - POST /publish-agent-version/:agent_id (version_description)
 * - GET /v2/list-phone-numbers (items array, pagination_key)
 */

export interface RetellAgent {
  agent_id: string;
  agent_name?: string;
  channel?: 'voice' | 'chat';
  voice_id?: string;
  version?: number;
  is_published?: boolean;
  last_modification_timestamp?: number;
  [key: string]: any;
}

export interface RetellAgentVersion {
  agent_id: string;
  version: number;
  version_description?: string;
  is_published?: boolean;
  last_modification_timestamp?: number;
  [key: string]: any;
}

export interface RetellPhoneNumber {
  phone_number: string;
  phone_number_pretty?: string;
  inbound_agents?: Array<{ agent_id: string; agent_version?: number; weight: number }>;
  outbound_agents?: Array<{ agent_id: string; agent_version?: number; weight: number }>;
  [key: string]: any;
}

export interface ListAgentsOptions {
  channel?: 'voice' | 'chat';
  limit?: number;
  paginationKey?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface ListAgentVersionsOptions {
  limit?: number;
  paginationKey?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface PublishAgentVersionOptions {
  versionDescription?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface ListPhoneNumbersOptions {
  limit?: number;
  paginationKey?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
  paginationKey?: string;
}

const DEFAULT_RETELL_BASE_URL = 'https://api.retellai.com';

function resolveApiKey(explicitKey?: string): string {
  const key = explicitKey || process.env.RETELL_API_KEY || '';
  if (!key) {
    throw new Error('RETELL_API_KEY is not configured');
  }
  return key;
}

function resolveBaseUrl(explicitUrl?: string): string {
  return (explicitUrl || process.env.RETELL_BASE_URL || DEFAULT_RETELL_BASE_URL).replace(/\/+$/, '');
}

/**
 * Lists agents using the modern POST /v2/list-agents endpoint.
 * Applies channel filter ('voice' by default) and handles pagination.
 */
export async function listAgents(
  options: ListAgentsOptions = {}
): Promise<PaginatedResult<RetellAgent>> {
  const apiKey = resolveApiKey(options.apiKey);
  const baseUrl = resolveBaseUrl(options.baseUrl);

  const payload: Record<string, any> = {};
  if (options.limit !== undefined) {
    payload.limit = options.limit;
  }
  if (options.paginationKey) {
    payload.pagination_key = options.paginationKey;
  }
  const channel = options.channel ?? 'voice';
  if (channel) {
    payload.filter_criteria = {
      channel: {
        type: 'string',
        op: 'eq',
        value: channel
      }
    };
  }

  const response = await fetch(`${baseUrl}/v2/list-agents`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Retell listAgents error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const items: RetellAgent[] = Array.isArray(data?.items) ? data.items : [];
  const hasMore = Boolean(data?.has_more);
  const paginationKey = data?.pagination_key || undefined;

  return {
    items,
    hasMore,
    paginationKey
  };
}

/**
 * Helper to fetch all agents across all pages.
 */
export async function listAllAgents(
  options: Omit<ListAgentsOptions, 'paginationKey'> & { maxPages?: number } = {}
): Promise<RetellAgent[]> {
  const allItems: RetellAgent[] = [];
  let currentKey: string | undefined = undefined;
  const maxPages = options.maxPages ?? 20;
  let pageCount = 0;

  do {
    const page = await listAgents({
      ...options,
      paginationKey: currentKey
    });
    allItems.push(...page.items);
    currentKey = page.paginationKey;
    pageCount++;
  } while (currentKey && pageCount < maxPages);

  return allItems;
}

/**
 * Lists agent versions using the modern GET /list-agent-versions/:agent_id endpoint.
 * Preserves descending version sorting.
 */
export async function listAgentVersions(
  agentId: string,
  options: ListAgentVersionsOptions = {}
): Promise<PaginatedResult<RetellAgentVersion>> {
  if (!agentId) {
    throw new Error('agentId is required for listAgentVersions');
  }

  const apiKey = resolveApiKey(options.apiKey);
  const baseUrl = resolveBaseUrl(options.baseUrl);

  const queryParams = new URLSearchParams();
  if (options.limit !== undefined) {
    queryParams.set('limit', String(options.limit));
  }
  if (options.paginationKey) {
    queryParams.set('pagination_key', options.paginationKey);
  }

  const queryString = queryParams.toString();
  const url = `${baseUrl}/list-agent-versions/${encodeURIComponent(agentId)}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Retell listAgentVersions error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawItems: RetellAgentVersion[] = Array.isArray(data?.items) 
    ? data.items 
    : (Array.isArray(data) ? data : []);

  // Sort descending by version number to preserve selection behavior
  const items = [...rawItems].sort((a, b) => (Number(b.version) || 0) - (Number(a.version) || 0));
  const hasMore = Boolean(data?.has_more);
  const paginationKey = data?.pagination_key || undefined;

  return {
    items,
    hasMore,
    paginationKey
  };
}

/**
 * Helper to fetch all agent versions across all pages.
 */
export async function listAllAgentVersions(
  agentId: string,
  options: Omit<ListAgentVersionsOptions, 'paginationKey'> & { maxPages?: number } = {}
): Promise<RetellAgentVersion[]> {
  const allItems: RetellAgentVersion[] = [];
  let currentKey: string | undefined = undefined;
  const maxPages = options.maxPages ?? 20;
  let pageCount = 0;

  do {
    const page = await listAgentVersions(agentId, {
      ...options,
      paginationKey: currentKey
    });
    allItems.push(...page.items);
    currentKey = page.paginationKey;
    pageCount++;
  } while (currentKey && pageCount < maxPages);

  // Maintain descending order overall
  return allItems.sort((a, b) => (Number(b.version) || 0) - (Number(a.version) || 0));
}

/**
 * Publishes an agent version using the unified modern POST /publish-agent-version/:agent_id endpoint.
 */
export async function publishAgentVersion(
  agentId: string,
  options: PublishAgentVersionOptions = {}
): Promise<RetellAgentVersion> {
  if (!agentId) {
    throw new Error('agentId is required for publishAgentVersion');
  }

  const apiKey = resolveApiKey(options.apiKey);
  const baseUrl = resolveBaseUrl(options.baseUrl);

  const payload: Record<string, any> = {};
  if (options.versionDescription) {
    payload.version_description = options.versionDescription;
  }

  const response = await fetch(`${baseUrl}/publish-agent-version/${encodeURIComponent(agentId)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Retell publishAgentVersion error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Lists phone numbers using the modern GET /v2/list-phone-numbers endpoint.
 */
export async function listPhoneNumbers(
  options: ListPhoneNumbersOptions = {}
): Promise<PaginatedResult<RetellPhoneNumber>> {
  const apiKey = resolveApiKey(options.apiKey);
  const baseUrl = resolveBaseUrl(options.baseUrl);

  const queryParams = new URLSearchParams();
  if (options.limit !== undefined) {
    queryParams.set('limit', String(options.limit));
  }
  if (options.paginationKey) {
    queryParams.set('pagination_key', options.paginationKey);
  }

  const queryString = queryParams.toString();
  const url = `${baseUrl}/v2/list-phone-numbers${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Retell listPhoneNumbers error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const items: RetellPhoneNumber[] = Array.isArray(data?.items)
    ? data.items
    : (Array.isArray(data) ? data : []);
  const hasMore = Boolean(data?.has_more);
  const paginationKey = data?.pagination_key || undefined;

  return {
    items,
    hasMore,
    paginationKey
  };
}
