import { describe, it, expect } from 'vitest';
import {
  isAgentOutboundTypeEnabled,
  type UserNotificationPreferences,
} from '../../server/persistence/notificationPreferencesRepository';

function prefs(partial: Partial<UserNotificationPreferences> = {}): UserNotificationPreferences {
  return {
    userId: 'usr_test',
    workspaceId: 'ws_wilmington',
    emailEnabled: false,
    smsEnabled: false,
    preferredChannel: 'none',
    quietHoursStart: '17:00',
    quietHoursEnd: '09:00',
    timezone: 'America/New_York',
    intakeConfirmedEnabled: false,
    photoRequestEnabled: false,
    materialsReadyEnabled: false,
    missingInfoEnabled: false,
    digestsEnabled: false,
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

describe('member notification prefs (default off)', () => {
  it('blocks all agent channels by default', () => {
    const p = prefs();
    expect(isAgentOutboundTypeEnabled(p, 'intake_confirmed')).toBe(false);
    expect(isAgentOutboundTypeEnabled(p, 'photo_request')).toBe(false);
    expect(isAgentOutboundTypeEnabled(p, 'materials_ready')).toBe(false);
    expect(isAgentOutboundTypeEnabled(p, 'missing_info')).toBe(false);
    expect(isAgentOutboundTypeEnabled(p, 'digest')).toBe(false);
    expect(isAgentOutboundTypeEnabled(p, 'sms', 'sms')).toBe(false);
  });

  it('allows intake confirmed only when toggled on', () => {
    const p = prefs({ emailEnabled: true, intakeConfirmedEnabled: true });
    expect(isAgentOutboundTypeEnabled(p, 'intake_confirmed')).toBe(true);
    expect(isAgentOutboundTypeEnabled(p, 'photo_request')).toBe(false);
  });

  it('allows materials ready when enabled', () => {
    const p = prefs({ emailEnabled: true, materialsReadyEnabled: true });
    expect(isAgentOutboundTypeEnabled(p, 'delivery_complete')).toBe(true);
  });
});
