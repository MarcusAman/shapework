/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Comprehensive Test Suite for Google Capability Audit Engine & 4-Layer Verification
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GoogleCapabilityAuditService } from '../../server/audit/googleCapabilityAuditService.js';
import { IntegrationStateStore } from '../../server/integrations/shared/integrationStateStore.js';
import { encryptToken } from '../../server/integrations/shared/integrationCredentialVault.js';

describe('Google Capability Audit Engine Suite', () => {
  let mockDbState: any;

  beforeEach(() => {
    mockDbState = {
      workspaceIntegrationConnections: [],
      integrationAuditLogs: []
    };
  });

  it('1. Reports OAUTH_REQUIRED when workspace has no active connection', async () => {
    const report = await GoogleCapabilityAuditService.runAudit({
      workspaceId: 'ws_test_disconnected',
      dbState: mockDbState
    });

    expect(report.canonicalWorkspace).toBe('ws_test_disconnected');
    expect(report.canonicalIdentity).toBe('AskNora@nestrealty.com');
    expect(report.identityVerification.tokenStatus).toBe('DISCONNECTED');
    expect(report.identityVerification.isAskNoraAccount).toBe(false);

    const calCap = report.capabilities.find(c => c.capabilityId === 'calendar_discovery_freebusy');
    expect(calCap).toBeDefined();
    expect(calCap?.overallStatus).toBe('OAUTH_REQUIRED');
    expect(calCap?.worksForIndividualUsers).toBe(false);
  });

  it('2. Correctly identifies AskNora@nestrealty.com live connection and 4-layer readiness', async () => {
    const store = new IntegrationStateStore(mockDbState);
    await store.upsertConnection({
      id: 'conn_gw_test',
      workspaceId: 'ws_test_connected',
      provider: 'google_workspace',
      status: 'connected',
      connectedByUserId: 'usr_ryan',
      connectedAt: new Date().toISOString(),
      providerAccountEmail: 'AskNora@nestrealty.com',
      providerAccountId: 'google_sub_10482910',
      encryptedAccessToken: await encryptToken('mock_access_token_asknora'),
      encryptedRefreshToken: await encryptToken('mock_refresh_token_asknora'),
      accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
      scopes: [
        'openid',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/drive.file'
      ]
    });

    const report = await GoogleCapabilityAuditService.runAudit({
      workspaceId: 'ws_test_connected',
      dbState: mockDbState
    });

    expect(report.identityVerification.authenticatedEmail).toBe('AskNora@nestrealty.com');
    expect(report.identityVerification.isAskNoraAccount).toBe(true);
    expect(report.identityVerification.accountType).toBe('REAL_WORKSPACE_USER');

    const calendarCap = report.capabilities.find(c => c.capabilityId === 'calendar_event_meet_creation');
    expect(calendarCap).toBeDefined();
    expect(calendarCap?.layer3_scopeGranted).toBe(true);
  });

  it('3. Enforces that domain-wide delegation is false and not required for AskNora shared-resource operations', async () => {
    const report = await GoogleCapabilityAuditService.runAudit({
      workspaceId: 'ws_test_dwd',
      dbState: mockDbState
    });

    expect(report.delegationAudit.domainWideDelegationConfigured).toBe(false);
    expect(report.delegationAudit.isDomainWideDelegationNecessary).toBe(false);
    expect(report.delegationAudit.recommendedModel).toBe('ASKNORA_OAUTH_AND_SHARED_RESOURCES');
  });

  it('4. Confirms that no raw token or secret values are leaked in the audit report', async () => {
    const store = new IntegrationStateStore(mockDbState);
    await store.upsertConnection({
      id: 'conn_gw_secret_test',
      workspaceId: 'ws_test_secrets',
      provider: 'google_workspace',
      status: 'connected',
      connectedByUserId: 'usr_ryan',
      connectedAt: new Date().toISOString(),
      providerAccountEmail: 'AskNora@nestrealty.com',
      encryptedAccessToken: await encryptToken('SUPER_SECRET_TOKEN_12345'),
      scopes: ['openid']
    });

    const report = await GoogleCapabilityAuditService.runAudit({
      workspaceId: 'ws_test_secrets',
      dbState: mockDbState
    });

    const reportJson = JSON.stringify(report);
    expect(reportJson).not.toContain('SUPER_SECRET_TOKEN_12345');
    expect(reportJson).not.toContain('clientSecret');
  });
});
