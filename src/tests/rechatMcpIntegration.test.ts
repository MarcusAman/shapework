/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Rechat MCP Integration Test Suite
 */

import { describe, it, expect } from 'vitest';
import { rechatMcpClient } from '../../server/integrations/rechat/rechatMcpClient';

describe('Rechat Model Context Protocol (MCP) Suite', () => {
  it('1. Initializes Rechat MCP protocol handshake', async () => {
    const res = await rechatMcpClient.sendJsonRpc('initialize');
    expect(res).toBeDefined();
    expect(res.protocolVersion).toBe('2024-11-05');
    expect(res.capabilities?.tools).toBeDefined();
  });

  it('2. Lists available Rechat MCP tools', async () => {
    const res = await rechatMcpClient.sendJsonRpc('tools/list');
    expect(res).toBeDefined();
    expect(Array.isArray(res.tools)).toBe(true);
    const toolNames = res.tools.map((t: any) => t.name);
    expect(toolNames).toContain('search_listings');
    expect(toolNames).toContain('get_listing_details');
    expect(toolNames).toContain('search_contacts');
  });

  it('3. Resolves 1104 S Live Oak Pkwy live MLS listing specs via MCP', async () => {
    const listing = await rechatMcpClient.lookupListingByAddress('1104 S Live Oak Pkwy, Wilmington NC');
    expect(listing).toBeDefined();
    expect(listing?.propertyAddress).toContain('1104 S Live Oak Pkwy');
    expect(listing?.mlsNumber).toBe('100458921');
    expect(listing?.bedrooms).toBe(4);
    expect(listing?.bathrooms).toBe(3.5);
    expect(listing?.squareFeet).toBe(3150);
    expect(listing?.priceFormatted).toBe('$849,000');
    expect(listing?.listingAgent).toContain('Matt Orr');
    expect(listing?.photos.length).toBeGreaterThan(0);
  });

  it('4. Resolves 212 Wetland Drive live MLS listing specs via MCP', async () => {
    const listing = await rechatMcpClient.lookupListingByAddress('212 Wetland Drive, Wilmington NC');
    expect(listing).toBeDefined();
    expect(listing?.propertyAddress).toContain('212 Wetland Drive');
    expect(listing?.bedrooms).toBe(3);
    expect(listing?.bathrooms).toBe(2.5);
    expect(listing?.priceFormatted).toBe('$625,000');
    expect(listing?.listingAgent).toContain('Marcus Aman');
  });

  it('5. Queries Rechat People Center contacts via MCP tools/call', async () => {
    const rpcRes = await rechatMcpClient.sendJsonRpc('tools/call', {
      name: 'search_contacts',
      arguments: { query: 'Matt Orr' }
    });
    expect(rpcRes?.content?.[0]?.text).toBeDefined();
    const parsed = JSON.parse(rpcRes.content[0].text);
    expect(parsed.contacts).toBeDefined();
    expect(parsed.contacts.length).toBeGreaterThan(0);
    expect(parsed.contacts[0].email).toBe('matt.orr@nestrealty.com');
  });
});
