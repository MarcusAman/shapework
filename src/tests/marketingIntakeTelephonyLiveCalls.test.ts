import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMarketingInboundCalls, getCallAudioStream, normalizeRetellCall } from '../../server/integrations/marketingCallsService';
import { MARKETING_SUBTABS } from '../components/marketing/marketingSubtabs';

describe('Marketing Intake Telephony & Voice Agent Integration Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.RETELL_API_KEY = 'test_retell_key';
    process.env.RETELL_ASK_NEST_OPS_AGENT_ID = 'agent_cdd031880770993e4b11cb9340';
  });

  it('Test 1: Subtab configuration names the intake subtab "Calls" with hotline number', () => {
    const callsSubtab = MARKETING_SUBTABS.find(t => t.id === 'calls');
    expect(callsSubtab).toBeDefined();
    expect(['Calls', 'Inbound Calls']).toContain(callsSubtab?.label);
    expect(callsSubtab?.secondaryLabel).toBe('(910) 507-2047');
  });

  it('Test 2: Normalizes call_01d33c85d5b224ba38596acd6e5 with full dynamic variables and telephony metadata', () => {
    const rawCall = {
      call_id: 'call_01d33c85d5b224ba38596acd6e5',
      agent_id: 'agent_cdd031880770993e4b11cb9340',
      from_number: '+12527170595',
      start_timestamp: 1786728999035,
      end_timestamp: 1786729007312,
      duration_ms: 8277,
      recording_url: 'https://dxc03zgurdly9.cloudfront.net/3dbfa908333ea11850a7f785dca46263355420ba6e0657570e6d122d61ba531c/recording.wav',
      transcript: 'Agent: Thanks for calling Ask Nest Ops. I can help route your issue, question, or request to the right person.',
      call_analysis: {
        call_summary: 'The inbound call connected briefly to Ask Nest Ops.',
        custom_analysis_data: {
          requester: '+12527170595',
          title: 'Inbound Hotline Verification'
        }
      }
    };

    const call = normalizeRetellCall(rawCall);
    expect(call.id).toBe('call_01d33c85d5b224ba38596acd6e5');
    expect(call.agentId).toBe('agent_cdd031880770993e4b11cb9340');
    expect(call.callerName).toContain('Marcus Aman');
    expect(call.audioUrl).toBe('/api/marketing/calls/call_01d33c85d5b224ba38596acd6e5/audio');
    expect(call.recordingUrl).toContain('cloudfront.net');
    expect(call.pcapPath).toContain('call_01d33c85d5b224ba38596acd6e5.pcap');

    // Dynamic Variables check
    expect(call.dynamicVariables?.ask_nest_ops_email).toBe('AskNestOps@nestrealty.com');
    expect(call.dynamicVariables?.ask_nest_ops_phone).toBe('+19105072047');
    expect(call.dynamicVariables?.client_name).toBe('Nest Realty Wilmington');
    expect(call.dynamicVariables?.['twilio-callsid']).toBe('CAdcf1ca93082d9a86f1f151789383b225');
    expect(call.dynamicVariables?.['twilio-accountsid']).toBe('ACa696c3df59bf06231f1f517b10eb8c57');
    expect(call.dynamicVariables?.workspace_id).toBe('nest-realty-demo');
  });

  it('Test 3: getMarketingInboundCalls retrieves live calls from Retell for agent_cdd031880770993e4b11cb9340', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('list-calls')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              call_id: 'call_01d33c85d5b224ba38596acd6e5',
              agent_id: 'agent_cdd031880770993e4b11cb9340',
              from_number: '+12527170595',
              start_timestamp: 1786728999035,
              end_timestamp: 1786729007312,
              duration_ms: 8277,
              recording_url: 'https://dxc03zgurdly9.cloudfront.net/3dbfa908333ea11850a7f785dca46263355420ba6e0657570e6d122d61ba531c/recording.wav',
              transcript: 'Agent: Thanks for calling Ask Nest Ops. What do you need help with?'
            },
            {
              call_id: 'call_b5307aa8db5cc8f3b25d9d0024d',
              agent_id: 'agent_cdd031880770993e4b11cb9340',
              from_number: '+12527170595',
              start_timestamp: 1786729000000,
              end_timestamp: 1786729100000,
              duration_ms: 100000,
              recording_url: 'https://dxc03zgurdly9.cloudfront.net/recording2.wav',
              transcript: 'Caller Marcus requested print and digital flyers for listing in Wilmington.'
            }
          ])
        });
      }
      return Promise.resolve({
        ok: true,
        headers: {
          get: (headerName: string) => {
            if (headerName.toLowerCase() === 'content-type') return 'audio/wav';
            if (headerName.toLowerCase() === 'content-length') return '12345';
            return null;
          }
        },
        body: new ReadableStream()
      });
    });

    const calls = await getMarketingInboundCalls();
    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(calls.some(c => c.id === 'call_01d33c85d5b224ba38596acd6e5')).toBe(true);
    expect(calls.every(c => c.agentId === 'agent_cdd031880770993e4b11cb9340')).toBe(true);
  });

  it('Test 4: getCallAudioStream streams the wav recording stream for playback', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('get-call')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            call_id: 'call_01d33c85d5b224ba38596acd6e5',
            recording_url: 'https://dxc03zgurdly9.cloudfront.net/recording.wav'
          })
        });
      }
      return Promise.resolve({
        ok: true,
        headers: {
          get: (headerName: string) => {
            if (headerName.toLowerCase() === 'content-type') return 'audio/wav';
            if (headerName.toLowerCase() === 'content-length') return '12345';
            return null;
          }
        },
        body: new ReadableStream()
      });
    });

    const stream = await getCallAudioStream('call_01d33c85d5b224ba38596acd6e5');
    expect(stream).toBeDefined();
    expect(stream?.contentType).toBe('audio/wav');
    expect(typeof stream?.pipe).toBe('function');
  });

  it('Test 5: Virtual Assistant executor in Marketing persistence is named Eduardo', async () => {
    const { getAllWorkItems } = await import('../../server/persistence/marketingCampaignsRepository');
    const items = getAllWorkItems();
    const vaItems = items.filter(i => i.executorType === 'virtual_assistant');
    expect(vaItems.length).toBeGreaterThan(0);
    for (const item of vaItems) {
      expect(item.executorName).toContain('Eduardo');
      expect(item.executorName).not.toContain('Maria');
    }
  });

  it('Test 6: getCallAudioStream overrides application/octet-stream with audio/wav for proper browser playback', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      return Promise.resolve({
        ok: true,
        headers: {
          get: (headerName: string) => {
            if (headerName.toLowerCase() === 'content-type') return 'application/octet-stream';
            if (headerName.toLowerCase() === 'content-length') return '397758';
            return null;
          }
        },
        body: new ReadableStream()
      });
    });

    const stream = await getCallAudioStream('call_01d33c85d5b224ba38596acd6e5');
    expect(stream).toBeDefined();
    expect(stream?.contentType).toBe('audio/wav');
  });
});
