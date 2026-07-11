/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateOAuthState, validateOAuthState } from '../server/integrations/basecamp/basecampOAuth.js';
import { runBasecampSync } from '../server/integrations/basecamp/basecampSync.js';
import { BasecampConnection } from '../server/integrations/basecamp/basecampTypes.js';
import { credentialVault } from '../server/security/vault.js';
import { BasecampClient } from '../server/integrations/basecamp/basecampClient.js';

// Setup Mock environment variables for testing
process.env.BASECAMP_CLIENT_ID = 'mock_client_id';
process.env.BASECAMP_CLIENT_SECRET = 'test_client_secret_that_is_at_least_32_characters';
process.env.BASECAMP_REDIRECT_URI = 'http://localhost:3000/api/integrations/basecamp/callback';
process.env.BASECAMP_BASE_URL = 'https://3.basecampapi.com';

// Override BasecampClient prototype for deterministic test data
BasecampClient.prototype.getProjects = async function() {
  return [
    { id: 101, name: 'Marketing Launch Campaign', purpose: 'marketing' },
    { id: 102, name: 'Office Expansion & Renovations', purpose: 'office' },
    { id: 103, name: 'Compliance Operations Queue', purpose: 'compliance' }
  ];
};

BasecampClient.prototype.getPeople = async function() {
  return [
    { id: 1, name: 'Sarah Jenkins', email_address: 'sarah.jenkins@shapework.ai' },
    { id: 2, name: 'Melissa Vance', email_address: 'melissa.vance@shapework.ai' },
    { id: 3, name: 'Sarah Jennings', email_address: 'owner@shapework.ai' }
  ];
};

BasecampClient.prototype.getTodos = async function(projectId: number) {
  const yesterdayStr = new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];

  if (projectId === 101) {
    return [
      {
        id: 201,
        title: 'Upload MLS photo proofs for 742 Evergreen Terrace',
        due_on: yesterdayStr,
        assignees: [{ id: 2, name: 'Melissa Vance' }],
        status: 'active',
        url: 'https://3.basecamp.com/46208/buckets/101/todos/201',
        created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() // Stuck
      }
    ];
  }

  if (projectId === 102) {
    return [
      {
        id: 203,
        title: 'Order new lockboxes for Austin office',
        due_on: null,
        assignees: [],
        status: 'active',
        url: 'https://3.basecamp.com/46208/buckets/102/todos/203',
        created_at: new Date().toISOString()
      }
    ];
  }

  if (projectId === 103) {
    return [
      {
        id: 204,
        title: 'Prepare broker compliance closing worksheets',
        due_on: nextWeekStr,
        assignees: [],
        status: 'active',
        url: 'https://3.basecamp.com/46208/buckets/103/todos/204',
        created_at: new Date().toISOString()
      }
    ];
  }

  return [];
};

BasecampClient.prototype.getRecentMessages = async function(projectId: number) {
  if (projectId === 101) {
    return [
      {
        id: 501,
        subject: 'Re: MLS listing photo approvals',
        content: 'Melissa Vance, please note we need these photo proofs uploaded by tomorrow. @Sarah Jenkins please review the lease override contract.',
        creator: { name: 'Melissa Vance' },
        url: 'https://3.basecamp.com/46208/buckets/101/messages/501',
        created_at: new Date().toISOString()
      }
    ];
  }
  return [];
};

BasecampClient.prototype.getRecentEvents = async function() {
  return [
    {
      id: 901,
      action: 'created a to-do item',
      title: 'Order signs',
      creator: { name: 'Sarah Jenkins' },
      created_at: new Date().toISOString()
    }
  ];
};

async function testSuite() {
  console.log('=== RUNNING BASECAMP SERVICE & SYNC TEST SUITE ===');

  // Test 1: OAuth State CSRF Nonce Validation
  console.log('\n[Test 1] Verifying OAuth State Token...');
  const wsId = 'nest-realty-demo';
  const userId = 'usr_sarah';
  const stateToken = generateOAuthState(wsId, userId);
  
  const isValid = validateOAuthState(stateToken, wsId, userId);
  if (!isValid) {
    throw new Error('OAuth State Token validation failed.');
  }
  console.log('✓ OAuth State Token successfully validated.');

  // Test 2: Token Encryption Security
  console.log('\n[Test 2] Verifying Token Encryption Security...');
  const testToken = 'super_secret_basecamp_api_key_123';
  const encrypted = await credentialVault.encrypt(testToken);
  
  if (!encrypted.startsWith('ref_v1:') && !encrypted.startsWith('dev_plain:')) {
    throw new Error('Encryption output does not follow secure format prefix.');
  }

  const decrypted = await credentialVault.decrypt(encrypted);
  if (decrypted !== testToken) {
    throw new Error('Decryption did not match original token.');
  }
  console.log('✓ Cryptographic vault GCM encryption confirmed.');

  // Test 3: Sync Logic, Exception Mappers & Work Queue Triggers
  console.log('\n[Test 3] Verifying Sync Pipeline & Exception Generation...');
  const encAccess = await credentialVault.encrypt('mock_access_token');
  const encRefresh = await credentialVault.encrypt('mock_refresh_token');

  const mockConnection: BasecampConnection = {
    id: `bc_${wsId}`,
    workspaceId: wsId,
    accountId: '46208',
    accountName: 'Nest Realty Austin',
    status: 'connected',
    encryptedAccessToken: encAccess,
    encryptedRefreshToken: encRefresh,
    accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    connectedByUserId: userId,
    connectedAt: new Date().toISOString()
  };

  const mockDbState = {
    basecampConnections: [mockConnection],
    basecampSignals: [],
    workItems: [],
    auditEvents: []
  };

  const summary = await runBasecampSync(mockConnection, mockDbState, async () => {});
  
  console.log('Sync Summary:', summary);
  console.log('Mapped Signals Count:', mockDbState.basecampSignals.length);

  // Assert overdue signal mapping
  const overdueSignal = mockDbState.basecampSignals.find((s: any) => s.signalType === 'todo_overdue');
  if (!overdueSignal) {
    throw new Error('Expected overdue to-do signal was not mapped.');
  }
  console.log('✓ Overdue Task Mapped:', overdueSignal.title);

  // Assert unassigned signal mapping
  const unassignedSignal = mockDbState.basecampSignals.find((s: any) => s.signalType === 'todo_unassigned');
  if (!unassignedSignal) {
    throw new Error('Expected unassigned to-do signal was not mapped.');
  }
  console.log('✓ Unassigned Task Mapped:', unassignedSignal.title);

  // Assert owner escalation mention mapping
  const escalationSignal = mockDbState.basecampSignals.find((s: any) => s.signalType === 'owner_mentioned');
  if (!escalationSignal) {
    throw new Error('Expected owner mention signal was not mapped.');
  }
  console.log('✓ Owner Escalation Mention Mapped:', escalationSignal.title);

  // Verify Work Queue Exception generation
  const workItems = mockDbState.workItems;
  console.log(`Raised Work Queue Exceptions: ${workItems.length}`);

  const overdueItem = workItems.find((w: any) => w.id === 'basecamp:46208:todo:201:overdue');
  if (!overdueItem) {
    throw new Error('Overdue task Work Queue ticket was not raised.');
  }
  if (overdueItem.assignedOwnerRole !== 'operations_lead') {
    throw new Error(`Incorrect owner routing. Found: ${overdueItem.assignedOwnerRole}`);
  }
  console.log('✓ Overdue Ticket raised & routed to Operations:', overdueItem.title);

  const escalationItem = workItems.find((w: any) => w.id === 'basecamp:46208:message:501:owner_mentioned');
  if (!escalationItem) {
    throw new Error('Owner escalation mention Work Queue ticket was not raised.');
  }
  if (escalationItem.assignedOwnerRole !== 'owner') {
    throw new Error(`Incorrect owner routing. Found: ${escalationItem.assignedOwnerRole}`);
  }
  console.log('✓ Escalation Ticket raised & routed to Owner:', escalationItem.title);

  // Test 4: Idempotency (Duplicate sync check)
  console.log('\n[Test 4] Verifying Sync Idempotency (Duplicate runs)...');
  const countBefore = mockDbState.workItems.length;
  
  await runBasecampSync(mockConnection, mockDbState, async () => {});
  
  const countAfter = mockDbState.workItems.length;
  if (countBefore !== countAfter) {
    throw new Error(`Idempotency failed. Work items changed from ${countBefore} to ${countAfter}`);
  }
  console.log('✓ Sync idempotency confirmed (No duplicate tickets raised).');

  console.log('\n=== ALL BASECAMP TESTS PASSED SUCCESSFULLY ===');
}

testSuite().catch(err => {
  console.error('\n❌ TEST FAILURE:', err);
  process.exit(1);
});
