/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { QuickBooksConnection, QuickBooksSyncSummary, FinanceSignal } from './quickbooksTypes.js';
import { getAuthenticatedClient } from './quickbooksOAuth.js';
import { QuickBooksClient } from './quickbooksClient.js';
import { mapInvoiceToSignal, mapPaymentToSignal, mapDepositToSignal } from './quickbooksMappers.js';

export async function runQuickBooksSync(
  connection: QuickBooksConnection,
  dbState: any,
  saveDbStateCallback: () => Promise<void>
): Promise<QuickBooksSyncSummary> {
  const workspaceId = connection.workspaceId;
  const realmId = connection.realmId;

  // Log start audit event
  const startAudit = {
    id: `audit_qb_sync_start_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    workspaceId,
    timestamp: new Date().toISOString(),
    user_name: 'System Scheduler',
    user_role: 'System',
    action_description: 'QuickBooks read-only sync started',
    impact_area: 'Integrations',
    impact_property: 'QuickBooks',
    rollback_available: false
  };
  if (!dbState.auditEvents) dbState.auditEvents = [];
  dbState.auditEvents = [startAudit, ...dbState.auditEvents];

  try {
    // 1. Get authenticated client
    const oauthClient = await getAuthenticatedClient(connection, dbState, saveDbStateCallback);
    const client = new QuickBooksClient(oauthClient, realmId);

    // 2. Fetch lookback settings
    const lookbackDays = parseInt(process.env.QUICKBOOKS_SYNC_LOOKBACK_DAYS || '90', 10);

    // 3. Fetch data from QBO Accounting REST API
    const companyInfo = await client.getCompanyInfo();
    const invoices = await client.getInvoices(lookbackDays);
    const payments = await client.getRecentPayments(lookbackDays);
    const deposits = await client.getDeposits(lookbackDays);
    
    // Fetch 30-day profit and loss report (cached on the connection or stored in dbState)
    const plSummary = await client.getProfitAndLossSummary(30);
    (connection as any).plSummary = plSummary;

    // 4. Initialize storage arrays if they don't exist
    if (!dbState.financeSignals) dbState.financeSignals = [];
    if (!dbState.workItems) dbState.workItems = [];
    if (!dbState.transactions) dbState.transactions = [];

    // Clear previous QuickBooks-sourced signals for this workspace to prevent stale accumulation
    dbState.financeSignals = dbState.financeSignals.filter(
      (s: any) => !(s.workspaceId === workspaceId && s.sourceSystem === 'quickbooks')
    );

    // 5. Map records to shapework FinanceSignals
    const mappedSignals: FinanceSignal[] = [];
    let exceptionsCreated = 0;

    for (const invoice of invoices) {
      const signal = mapInvoiceToSignal(invoice, workspaceId, dbState.transactions);
      mappedSignals.push(signal);
    }

    for (const payment of payments) {
      const signal = mapPaymentToSignal(payment, workspaceId, dbState.transactions);
      mappedSignals.push(signal);
    }

    for (const deposit of deposits) {
      const signal = mapDepositToSignal(deposit, workspaceId, dbState.transactions);
      mappedSignals.push(signal);
    }

    // Save mapped signals to global state
    dbState.financeSignals.push(...mappedSignals);

    // 6. Evaluate exceptions and raise deterministic Work Queue items
    
    // A. Unmatched open invoice exception
    for (const signal of mappedSignals) {
      if (signal.signalType === 'invoice_open' && !signal.relatedTransactionId && signal.status === 'new') {
        const workItemId = `quickbooks:${realmId}:invoice:${signal.sourceRecordId}:open_receivable`;
        const exists = dbState.workItems.some((wi: any) => wi.id === workItemId);
        if (!exists) {
          dbState.workItems.push({
            id: workItemId,
            workspaceId,
            title: `Unmatched Open Invoice — QBO #${signal.sourceRecordId}`,
            description: `Open receivable invoice for $${signal.amount?.toFixed(2)} from ${signal.counterparty} has no matching brokerage transaction.`,
            status: 'pending',
            assignedStaffMemberId: 'unassigned',
            assignedOwnerRole: 'operations_lead',
            dueDate: 'SLA: 48 Hours',
            sourceSystem: 'quickbooks',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          exceptionsCreated++;
          
          // Log signal creation audit
          dbState.auditEvents = [{
            id: `audit_qb_sig_created_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            workspaceId,
            timestamp: new Date().toISOString(),
            user_name: 'System Scheduler',
            user_role: 'System',
            action_description: `QuickBooks finance signal created: ${signal.id}`,
            impact_area: 'Integrations',
            impact_property: 'QuickBooks',
            rollback_available: false
          }, ...dbState.auditEvents];
        }
      }

      // B. Unmatched payment exception
      if (signal.signalType === 'payment_received' && !signal.relatedTransactionId) {
        const workItemId = `quickbooks:${realmId}:payment:${signal.sourceRecordId}:match_needed`;
        const exists = dbState.workItems.some((wi: any) => wi.id === workItemId);
        if (!exists) {
          dbState.workItems.push({
            id: workItemId,
            workspaceId,
            title: `Unmatched QuickBooks Payment — QBO #${signal.sourceRecordId}`,
            description: `Commission payment of $${signal.amount?.toFixed(2)} received from ${signal.counterparty} but no matching brokerage transaction was identified.`,
            status: 'pending',
            assignedStaffMemberId: 'unassigned',
            assignedOwnerRole: 'operations_lead',
            dueDate: 'SLA: 24 Hours',
            sourceSystem: 'quickbooks',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          exceptionsCreated++;
        }
      }

      // C. Large Expense / Uncategorized spend needing owner review
      if ((signal.signalType === 'payment_received' || signal.signalType === 'deposit_received') && signal.amount && signal.amount > 10000) {
        const workItemId = `quickbooks:${realmId}:expense:${signal.sourceRecordId}:large_spend`;
        const exists = dbState.workItems.some((wi: any) => wi.id === workItemId);
        if (!exists) {
          dbState.workItems.push({
            id: workItemId,
            workspaceId,
            title: `Large Transaction Review — $${signal.amount.toFixed(2)}`,
            description: `A financial record for $${signal.amount.toFixed(2)} from ${signal.counterparty} exceeds the $10,000 threshold and requires Owner review.`,
            status: 'pending',
            assignedStaffMemberId: 'unassigned',
            assignedOwnerRole: 'owner',
            dueDate: 'SLA: 72 Hours',
            sourceSystem: 'quickbooks',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          exceptionsCreated++;
        }
      }
    }

    // D. Closed transaction is missing expected commission payment
    const closedTransactions = dbState.transactions.filter(
      (t: any) => (t.currentStage || '').toLowerCase() === 'closed'
    );
    for (const txn of closedTransactions) {
      const expectedRevenue = txn.revenue || 0;
      if (expectedRevenue > 0) {
        // Find if we have a payment signal matching this transaction
        const hasPayment = mappedSignals.some(
          s => s.signalType === 'payment_received' && s.relatedTransactionId === txn.id
        );
        if (!hasPayment) {
          const workItemId = `quickbooks:${realmId}:transaction:${txn.id}:commission_gap`;
          const exists = dbState.workItems.some((wi: any) => wi.id === workItemId);
          if (!exists) {
            dbState.workItems.push({
              id: workItemId,
              workspaceId,
              title: `Expected Commission Missing — ${txn.propertyAddress}`,
              description: `Transaction ${txn.propertyAddress} has closed with expected revenue of $${expectedRevenue.toFixed(2)}, but no matching payment has been received in QuickBooks.`,
              status: 'pending',
              assignedStaffMemberId: 'unassigned',
              assignedOwnerRole: 'operations_lead',
              dueDate: 'SLA: 24 Hours',
              sourceSystem: 'quickbooks',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            exceptionsCreated++;
          }
        }
      }
    }

    // Update connection status
    connection.status = 'connected';
    connection.lastSyncedAt = new Date().toISOString();
    delete connection.lastError;

    // Log completion audit event
    const completeAudit = {
      id: `audit_qb_sync_complete_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      workspaceId,
      timestamp: new Date().toISOString(),
      user_name: 'System Scheduler',
      user_role: 'System',
      action_description: `QuickBooks read-only sync completed successfully (Invoices: ${invoices.length}, Payments: ${payments.length}, Deposits: ${deposits.length})`,
      impact_area: 'Integrations',
      impact_property: 'QuickBooks',
      rollback_available: false
    };
    dbState.auditEvents = [completeAudit, ...dbState.auditEvents];

    await saveDbStateCallback();

    return {
      companyName: companyInfo.CompanyName,
      invoicesChecked: invoices.length,
      paymentsChecked: payments.length,
      depositsChecked: deposits.length,
      exceptionsCreated,
      lastSyncedAt: connection.lastSyncedAt
    };
  } catch (err: any) {
    console.error(`[QuickBooks Sync] Synchronization failed for workspace ${workspaceId}:`, err.message);

    // Log failure audit event
    const failAudit = {
      id: `audit_qb_sync_fail_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      workspaceId,
      timestamp: new Date().toISOString(),
      user_name: 'System Scheduler',
      user_role: 'System',
      action_description: `QuickBooks sync failed: ${err.message}`,
      impact_area: 'Integrations',
      impact_property: 'QuickBooks',
      rollback_available: false
    };
    dbState.auditEvents = [failAudit, ...dbState.auditEvents];

    // Create sync exception item
    const syncErrorId = `quickbooks:${realmId}:sync:error`;
    const exists = dbState.workItems.some((wi: any) => wi.id === syncErrorId);
    if (!exists) {
      dbState.workItems.push({
        id: syncErrorId,
        workspaceId,
        title: 'QuickBooks Integration Sync Failed',
        description: `Failed to synchronize QuickBooks data for realm ${realmId}: ${err.message}`,
        status: 'pending',
        assignedStaffMemberId: 'unassigned',
        assignedOwnerRole: 'operations_lead',
        dueDate: 'SLA: 24 Hours',
        sourceSystem: 'quickbooks',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    connection.status = 'error';
    connection.lastError = err.message;

    await saveDbStateCallback();
    throw err;
  }
}
