import { Signal } from './runtimeTypes.js';

export function createSignal(dbState: any, params: Partial<Signal>): Signal {
  if (!dbState.signals) dbState.signals = [];

  const signal: Signal = {
    id: params.id || `sig_${Math.random().toString(36).substring(2, 11)}`,
    workspace_id: params.workspace_id || 'nest-realty-demo',
    source_type: params.source_type || 'demo',
    source_name: params.source_name || 'System event',
    signal_type: params.signal_type || 'operational_trigger',
    title: params.title || 'Signal Detected',
    summary: params.summary || 'A new signal was recorded by Shapework.',
    safe_payload_summary: params.safe_payload_summary || '{}',
    raw_payload_ref: params.raw_payload_ref || undefined,
    linked_entity_type: params.linked_entity_type || undefined,
    linked_entity_id: params.linked_entity_id || undefined,
    received_at: params.received_at || new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  dbState.signals.push(signal);
  return signal;
}
