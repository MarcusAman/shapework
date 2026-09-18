import { describe, it, expect } from 'vitest';

function buildIntakeConfirmationIdempotencyKey(args: {
  workspaceId: string;
  agentEmail: string;
  propertyAddress: string;
}): string {
  const email = String(args.agentEmail || '').trim().toLowerCase();
  const addr = String(args.propertyAddress || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
  return `${args.workspaceId}:agent:${email}:addr:${addr || 'unknown'}:intake_confirmation:v2`;
}

describe('intake confirm idempotency v2', () => {
  it('collapses same agent+address across message ids', () => {
    const a = buildIntakeConfirmationIdempotencyKey({
      workspaceId: 'ws_wilmington',
      agentEmail: 'Matt.Orr@nestrealty.com',
      propertyAddress: '8820 Ocean Sound Way, Wilmington, NC',
    });
    const b = buildIntakeConfirmationIdempotencyKey({
      workspaceId: 'ws_wilmington',
      agentEmail: 'matt.orr@nestrealty.com',
      propertyAddress: '8820 Ocean Sound Way, Wilmington, NC',
    });
    expect(a).toBe(b);
    expect(a).toContain('intake_confirmation:v2');
    expect(a).toContain('matt.orr@nestrealty.com');
  });

  it('keeps different addresses distinct', () => {
    const a = buildIntakeConfirmationIdempotencyKey({
      workspaceId: 'ws_wilmington',
      agentEmail: 'matt.orr@nestrealty.com',
      propertyAddress: '100 Main St',
    });
    const b = buildIntakeConfirmationIdempotencyKey({
      workspaceId: 'ws_wilmington',
      agentEmail: 'matt.orr@nestrealty.com',
      propertyAddress: '200 Main St',
    });
    expect(a).not.toBe(b);
  });
});
