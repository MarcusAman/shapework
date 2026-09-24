import { describe, expect, it } from 'vitest';
import {
  NORA_CHAT_TOOL_ALLOWLIST,
  isNoraChatToolAllowed,
  resolveNoraChatToolAlias,
} from '../../server/agent/noraToolAllowlist';
import { NoraActionRegistry } from '../../server/agent/noraActionRegistry';

describe('Nora tool allowlist v1', () => {
  it('lists Feature Lab must/should tools', () => {
    expect(NORA_CHAT_TOOL_ALLOWLIST).toContain('create_or_update_task');
    expect(NORA_CHAT_TOOL_ALLOWLIST).toContain('start_listing_launch');
    expect(NORA_CHAT_TOOL_ALLOWLIST).toContain('start_offer_2t');
    expect(NORA_CHAT_TOOL_ALLOWLIST).toContain('start_creative_request');
    expect(NORA_CHAT_TOOL_ALLOWLIST).toContain('get_task_status');
    expect(NORA_CHAT_TOOL_ALLOWLIST).toContain('prefill_form_fields');
    expect(NORA_CHAT_TOOL_ALLOWLIST).toContain('search_sop_kb');
  });

  it('allows allowlist and blocks denylist names', () => {
    expect(isNoraChatToolAllowed('get_task_status')).toBe(true);
    expect(isNoraChatToolAllowed('send_email')).toBe(false);
    expect(isNoraChatToolAllowed('notification.send_sms')).toBe(false);
  });

  it('resolves legacy aliases', () => {
    expect(resolveNoraChatToolAlias('task.create')).toBe('create_or_update_task');
    expect(resolveNoraChatToolAlias('sop.retrieve')).toBe('search_sop_kb');
  });

  it('registers allowlist tools in NoraActionRegistry', () => {
    for (const name of NORA_CHAT_TOOL_ALLOWLIST) {
      expect(NoraActionRegistry.getAction(name), name).toBeTruthy();
    }
  });
});
