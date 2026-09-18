import { describe, it, expect, beforeEach } from 'vitest';
import type { Request } from 'express';
import { unpackRetellPayload } from '../../server/routes/retellToolsRoute';
import { cachedActivePolicies, orgChartRepository, PublishedRoutingPolicy, PublishedRoutingRule } from '../../server/persistence/orgChartRepository';

describe('Retell Telephony Payload Unpacking & Integrity Suite', () => {
  it('correctly extracts arguments from Retell nested { args, call } schema', () => {
    const mockReq = {
      body: {
        name: 'lookup_open_tasks_by_property',
        args: {
          address: '1916 Oleander Drive',
          neededByDate: '2026-09-10'
        },
        call: {
          call_id: 'call_c11e4f297f9895a45acfb74fe3e',
          from_number: '+19106128283',
          to_number: '+19105072047'
        }
      },
      headers: {}
    } as unknown as Request;

    const unpacked = unpackRetellPayload(mockReq);

    expect(unpacked.address).toBe('1916 Oleander Drive');
    expect(unpacked.neededByDate).toBe('2026-09-10');
    expect(unpacked.call_id).toBe('call_c11e4f297f9895a45acfb74fe3e');
    expect(unpacked.caller_phone).toBe('+19106128283');
    expect(unpacked.from_number).toBe('+19106128283');
  });

  it('preserves top-level arguments for direct / test invocations', () => {
    const mockReq = {
      body: {
        address: '136 Market Street',
        callerPhone: '+19106128283',
        deliverables: ['1-Page Flyer']
      },
      headers: {
        'x-retell-call-id': 'call_header_789'
      }
    } as unknown as Request;

    const unpacked = unpackRetellPayload(mockReq);

    expect(unpacked.address).toBe('136 Market Street');
    expect(unpacked.caller_phone).toBe('+19106128283');
    expect(unpacked.deliverables).toEqual(['1-Page Flyer']);
    expect(unpacked.call_id).toBe('call_header_789');
  });

  it('prefers explicit args over top-level body when both exist', () => {
    const mockReq = {
      body: {
        address: 'Old Address',
        args: {
          address: '1916 Oleander Drive'
        },
        call: {
          call_id: 'call_abc',
          from_number: '+19106128283'
        }
      },
      headers: {}
    } as unknown as Request;

    const unpacked = unpackRetellPayload(mockReq);
    expect(unpacked.address).toBe('1916 Oleander Drive');
    expect(unpacked.caller_phone).toBe('+19106128283');
  });
});

describe('Role & Escalation Policy In-Memory Cache Suite', () => {
  const workspaceId = 'ws_test_cache';

  beforeEach(() => {
    cachedActivePolicies.delete(workspaceId);
  });

  it('getPublishedPolicySync reads directly from in-memory cache when populated from database', () => {
    const mockPolicy: PublishedRoutingPolicy = {
      id: 'pol_ws_wilmington_v17',
      workspace_id: workspaceId,
      version: 17,
      published_by: 'system',
      published_at: new Date().toISOString(),
      is_active: true,
      rules_count: 5,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const mockRules: PublishedRoutingRule[] = [
      {
        id: 'rule_1',
        policy_id: mockPolicy.id,
        workspace_id: workspaceId,
        rule_index: 0,
        category: 'marketing',
        match_keywords: ['marketing', 'flyer'],
        primary_position_id: 'pos_melissa',
        primary_staff_id: 'dir_melissa_gagliardi_33',
        sla_hours: 24,
        sla_display: '24 hours',
        status: 'active',
        created_at: new Date().toISOString()
      }
    ];

    // Warm cache as done on DB load
    cachedActivePolicies.set(workspaceId, { policy: mockPolicy, rules: mockRules });

    const synced = orgChartRepository.getPublishedPolicySync(workspaceId);
    expect(synced).not.toBeNull();
    expect(synced?.policy.id).toBe('pol_ws_wilmington_v17');
    expect(synced?.policy.version).toBe(17);
    expect(synced?.rules.length).toBe(1);
    expect(synced?.rules[0].primary_staff_id).toBe('dir_melissa_gagliardi_33');
  });
});
