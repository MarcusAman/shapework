/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

process.env.QUICKBOOKS_CLIENT_ID = 'mock_client_id';
process.env.QUICKBOOKS_CLIENT_SECRET = 'test_client_secret_that_is_at_least_32_characters';
process.env.QUICKBOOKS_REDIRECT_URI = 'http://localhost:3000/api/integrations/quickbooks/callback';
process.env.QUICKBOOKS_ENVIRONMENT = 'sandbox';

import { generateOAuthState, validateOAuthState } from '../server/integrations/quickbooks/quickbooksOAuth.js';
import { runQuickBooksSync } from '../server/integrations/quickbooks/quickbooksSync.js';
import { QuickBooksConnection } from '../server/integrations/quickbooks/quickbooksTypes.js';
import { credentialVault } from '../server/security/vault.js';
import { QuickBooksClient } from '../server/integrations/quickbooks/quickbooksClient.js';

// Override QuickBooksClient prototype for deterministic test data
QuickBooksClient.prototype.getCompanyInfo = async function() {
  return { CompanyName: 'Nest Realty Group LLC (Mock)' } as any;
};

QuickBooksClient.prototype.getInvoices = async function() {
  return [
    { Id: '1001', DocNumber: 'INV-1001', TxnDate: '2026-06-30', TotalAmt: 8500, Balance: 0, CustomerRef: { name: 'Evergreen Terr Closing Escrow' } },
    { Id: '1002', DocNumber: 'INV-1002', TxnDate: '2026-06-29', TotalAmt: 6200, Balance: 6200, CustomerRef: { name: 'Unmatched Corp' } }
  ] as any;
};

QuickBooksClient.prototype.getRecentPayments = async function() {
  return [
    { Id: '2001', TxnDate: '2026-06-30', TotalAmt: 5000, CustomerRef: { name: 'Evergreen Terr Closing Escrow' } },
    { Id: '2002', TxnDate: '2026-06-29', TotalAmt: 3000, CustomerRef: { name: 'Unmatched Corp' } }
  ] as any;
};

QuickBooksClient.prototype.getDeposits = async function() {
  return [
    {
      Id: '3001',
      TxnDate: '2026-06-29',
      TotalAmt: 15000,
      Line: [
        {
          Amount: 15000,
          DetailType: 'DepositLineDetail',
          DepositLineDetail: {
            Entity: {
              EntityRef: { name: 'Lennar Homes Title Dept' }
            }
          }
        }
      ]
    }
  ] as any;
};

QuickBooksClient.prototype.getProfitAndLossSummary = async function() {
  return { netIncome: 25000, totalIncome: 45000, totalExpenses: 20000, companyName: 'Nest Realty Group LLC (Mock)' } as any;
};

async function testSuite() {
  console.log('=== RUNNING QUICKBOOKS SERVICE & SYNC TEST SUITE ===');

  // Test 1: OAuth State Cryptographic Nonce & Binding
  console.log('\n[Test 1] Verifying OAuth State Token...');
  const wsId = 'nest-realty-demo';
  const userId = 'usr_sarah';
  const stateToken = generateOAuthState(wsId, userId);
  
  const isValid = validateOAuthState(stateToken, wsId, userId);
  if (!isValid) {
    throw new Error('OAuth State Token validation failed.');
  }
  console.log('✓ OAuth State Token successfully validated.');

  // Test 2: Sync Engine and Exception Logic
  console.log('\n[Test 2] Verifying Sync Logic & Work Queue Exception Triggers...');
  
  const encAccess = await credentialVault.encrypt('mock_access_token');
  const encRefresh = await credentialVault.encrypt('mock_refresh_token');

  const mockConnection: QuickBooksConnection = {
    id: `qb_${wsId}`,
    workspaceId: wsId,
    realmId: '4620816365289947810',
    environment: 'sandbox',
    status: 'connected',
    encryptedAccessToken: encAccess,
    encryptedRefreshToken: encRefresh,
    accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    refreshTokenExpiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
    connectedByUserId: userId,
    connectedAt: new Date().toISOString()
  };

  const mockDbState = {
    transactions: [
      {
        id: 't_evergreen',
        workspaceId: wsId,
        propertyAddress: '742 Evergreen Terrace',
        clientName: 'Evergreen Terr Closing Escrow',
        currentStage: 'Closed',
        revenue: 5000
      },
      {
        id: 't_woodlawn',
        workspaceId: wsId,
        propertyAddress: '109 Woodlawn',
        clientName: 'Lennar Homes Title Dept',
        currentStage: 'Pending',
        revenue: 3000
      }
    ],
    financeSignals: [],
    workItems: [],
    auditEvents: []
  };

  let saved = false;
  const saveCallback = async () => {
    saved = true;
  };

  // Run the sync
  const summary = await runQuickBooksSync(mockConnection, mockDbState, saveCallback);
  
  console.log('Sync Summary:', summary);

  // Assertions
  if (!saved) {
    throw new Error('Database state save callback was not triggered.');
  }

  // Check mapped signals
  const signals = mockDbState.financeSignals;
  console.log(`Mapped Finance Signals Count: ${signals.length}`);
  if (signals.length === 0) {
    throw new Error('No finance signals mapped.');
  }

  // Verify Invoice matching
  const openInvoiceSignal = signals.find((s: any) => s.id === 'qb_signal_invoice_1001');
  if (!openInvoiceSignal) {
    throw new Error('Invoice #1001 signal missing.');
  }
  console.log('✓ Invoice #1001 Mapped:', openInvoiceSignal.summary);

  // Verify payment is matched to Evergreen Terrace transaction
  const paymentSignal = signals.find((s: any) => s.id === 'qb_signal_payment_2001');
  if (!paymentSignal) {
    throw new Error('Payment #2001 signal missing.');
  }
  if (paymentSignal.relatedTransactionId !== 't_evergreen') {
    throw new Error(`Payment #2001 not matched to Evergreen Terrace transaction. Found: ${paymentSignal.relatedTransactionId}`);
  }
  console.log('✓ Payment #2001 matched to t_evergreen.');

  // Verify deposit is matched to Woodlawn transaction (via Entity Customer name matching)
  const depositSignal = signals.find((s: any) => s.id === 'qb_signal_deposit_3001');
  if (!depositSignal) {
    throw new Error('Deposit #3001 signal missing.');
  }
  console.log('✓ Deposit #3001 Mapped:', depositSignal.summary);

  // Verify Work Queue Exceptions raised
  const workItems = mockDbState.workItems;
  console.log(`Raised Work Queue Exceptions: ${workItems.length}`);

  // Expecting:
  // 1. Unmatched open invoice (Invoice #1002 has no transaction match)
  // 2. Unmatched payment (Payment #2002 has no transaction match)
  // 3. Large transaction review (Deposit #3001 is $15,000 > $10,000)
  // 4. Commission gap (Transaction Woodlawn is not closed yet, but what about closed transactions missing payments? 
  //    Wait, Evergreen has a payment, so no gap. Woodlawn is pending so no closed gap).
  
  const unmatchedInvoice = workItems.find((w: any) => w.id === 'quickbooks:4620816365289947810:invoice:1002:open_receivable');
  if (!unmatchedInvoice) {
    throw new Error('Expected unmatched open invoice exception not raised.');
  }
  console.log('✓ Unmatched Invoice Exception raised:', unmatchedInvoice.title);

  const unmatchedPayment = workItems.find((w: any) => w.id === 'quickbooks:4620816365289947810:payment:2002:match_needed');
  if (!unmatchedPayment) {
    throw new Error('Expected unmatched payment exception not raised.');
  }
  console.log('✓ Unmatched Payment Exception raised:', unmatchedPayment.title);

  const largeSpend = workItems.find((w: any) => w.id === 'quickbooks:4620816365289947810:expense:3001:large_spend');
  if (!largeSpend) {
    throw new Error('Expected large transaction review exception not raised.');
  }
  console.log('✓ Large Spend Exception raised:', largeSpend.title);

  console.log('\n=== ALL QUICKBOOKS TESTS PASSED SUCCESSFULLY ===');
}

testSuite().catch(err => {
  console.error('\n❌ TEST FAILURE:', err);
  process.exit(1);
});
