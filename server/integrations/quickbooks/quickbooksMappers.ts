/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FinanceSignal, QuickBooksInvoice, QuickBooksPayment, QuickBooksDeposit } from './quickbooksTypes.js';

/**
 * Fuzzy search to match counterparty name to transaction addresses
 */
export function findRelatedTransactionId(counterpartyName: string, transactions: any[] = []): string | undefined {
  if (!counterpartyName) return undefined;
  const nameLower = counterpartyName.toLowerCase();
  
  const match = transactions.find(t => {
    const address = (t.propertyAddress || t.streetAddress || t.name || '').toLowerCase().trim();
    const client = (t.clientName || '').toLowerCase().trim();
    if (address.length < 3 && client.length < 3) return false;
    
    return (address.length >= 3 && (nameLower.includes(address) || address.includes(nameLower))) || 
           (client.length >= 3 && (nameLower.includes(client) || client.includes(nameLower)));
  });

  return match?.id;
}

export function mapInvoiceToSignal(
  invoice: QuickBooksInvoice,
  workspaceId: string,
  transactions: any[] = []
): FinanceSignal {
  const counterparty = invoice.CustomerRef?.name || 'Unknown Client';
  const relatedTransactionId = findRelatedTransactionId(counterparty, transactions);
  const isPaid = invoice.Balance === 0;

  return {
    id: `qb_signal_invoice_${invoice.Id}`,
    workspaceId,
    sourceSystem: 'quickbooks',
    sourceRecordId: invoice.Id,
    signalType: 'invoice_open',
    relatedTransactionId,
    amount: invoice.TotalAmt,
    counterparty,
    date: invoice.TxnDate,
    status: isPaid ? 'resolved' : 'new',
    summary: `Invoice ${invoice.DocNumber || invoice.Id} for ${counterparty} is ${
      isPaid ? 'fully paid' : `open with a balance of $${invoice.Balance.toFixed(2)}`
    } (Total Amount: $${invoice.TotalAmt.toFixed(2)})`
  };
}

export function mapPaymentToSignal(
  payment: QuickBooksPayment,
  workspaceId: string,
  transactions: any[] = []
): FinanceSignal {
  const counterparty = payment.CustomerRef?.name || 'Unknown Client';
  const relatedTransactionId = findRelatedTransactionId(counterparty, transactions);

  return {
    id: `qb_signal_payment_${payment.Id}`,
    workspaceId,
    sourceSystem: 'quickbooks',
    sourceRecordId: payment.Id,
    signalType: 'payment_received',
    relatedTransactionId,
    amount: payment.TotalAmt,
    counterparty,
    date: payment.TxnDate,
    status: 'new',
    summary: `Commission payment of $${payment.TotalAmt.toFixed(2)} received from ${counterparty} on ${payment.TxnDate}.`
  };
}

export function mapDepositToSignal(
  deposit: QuickBooksDeposit,
  workspaceId: string,
  transactions: any[] = []
): FinanceSignal {
  // Extract counterparty from first line detail if available
  const firstLine = deposit.Line?.[0];
  const counterparty = firstLine?.DepositLineDetail?.Entity?.EntityRef?.name || 'QuickBooks Deposit';
  const relatedTransactionId = findRelatedTransactionId(counterparty, transactions);

  return {
    id: `qb_signal_deposit_${deposit.Id}`,
    workspaceId,
    sourceSystem: 'quickbooks',
    sourceRecordId: deposit.Id,
    signalType: 'deposit_received',
    relatedTransactionId,
    amount: deposit.TotalAmt,
    counterparty,
    date: deposit.TxnDate,
    status: 'new',
    summary: `Earnest money escrow deposit of $${deposit.TotalAmt.toFixed(2)} received from ${counterparty} on ${deposit.TxnDate}.`
  };
}
