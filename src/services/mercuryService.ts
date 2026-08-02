/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MercuryAccount {
  id: string;
  name: string;
  accountNumberLast4: string;
  routingNumber: string;
  status: 'active' | 'frozen';
  type: 'checking' | 'savings';
  availableBalance: number;
  currentBalance: number;
  currency: string;
}

export interface MercuryInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface MercuryInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientWorkspaceId: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  issueDate: string;
  paymentMethod: 'ach' | 'wire' | 'card';
  paymentLink: string;
  items: MercuryInvoiceItem[];
  notes?: string;
}

export interface MercuryTransaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  counterpartyName: string;
  counterpartyNickname?: string;
  category: string;
  status: 'pending' | 'sent' | 'settled' | 'failed';
  postedAt: string;
  description: string;
  referenceNumber: string;
}

export interface MercuryPayoutRequest {
  recipientName: string;
  recipientEmail: string;
  accountNumber: string;
  routingNumber: string;
  amount: number;
  paymentType: 'ach' | 'wire';
  note: string;
}

// Initial Mock Ledger State for Mercury Demo
export const INITIAL_MERCURY_ACCOUNTS: MercuryAccount[] = [
  {
    id: 'mercury_acc_main',
    name: 'Shapework Primary Operations Checking',
    accountNumberLast4: '8841',
    routingNumber: '121141822',
    status: 'active',
    type: 'checking',
    availableBalance: 142850.00,
    currentBalance: 148350.00,
    currency: 'USD'
  },
  {
    id: 'mercury_acc_reserve',
    name: 'Shapework Tax & Treasury Reserve',
    accountNumberLast4: '3309',
    routingNumber: '121141822',
    status: 'active',
    type: 'savings',
    availableBalance: 65000.00,
    currentBalance: 65000.00,
    currency: 'USD'
  }
];

export const INITIAL_MERCURY_INVOICES: MercuryInvoice[] = [
  {
    id: 'inv_001',
    invoiceNumber: 'INV-2026-081',
    clientName: 'Nest Realty Wilmington',
    clientEmail: 'ryan@nestrealty.com',
    clientWorkspaceId: 'nest-realty-demo',
    status: 'paid',
    amountDue: 4500.00,
    amountPaid: 4500.00,
    issueDate: '2026-07-01',
    dueDate: '2026-07-15',
    paymentMethod: 'ach',
    paymentLink: 'https://pay.mercury.com/inv_001',
    items: [
      { id: 'item_1', description: 'Shapework OS Enterprise Platform License (Monthly)', quantity: 1, unitPrice: 3500.00, amount: 3500.00 },
      { id: 'item_2', description: 'AI Hotline Marketing Intake & Autopilot Sidecar', quantity: 1, unitPrice: 1000.00, amount: 1000.00 }
    ],
    notes: 'Thank you for your business! Auto-settled via Mercury ACH Direct.'
  },
  {
    id: 'inv_002',
    invoiceNumber: 'INV-2026-094',
    clientName: 'Nest Realty Triangle (Raleigh/Durham)',
    clientEmail: 'ryan@nestrealty.com',
    clientWorkspaceId: 'nest-realty-triangle',
    status: 'sent',
    amountDue: 3200.00,
    amountPaid: 0.00,
    issueDate: '2026-07-20',
    dueDate: '2026-08-05',
    paymentMethod: 'ach',
    paymentLink: 'https://pay.mercury.com/inv_002',
    items: [
      { id: 'item_3', description: 'Shapework OS Pilot Subscription — Triangle Office', quantity: 1, unitPrice: 3200.00, amount: 3200.00 }
    ],
    notes: 'Due in 15 days.'
  },
  {
    id: 'inv_003',
    invoiceNumber: 'INV-2026-098',
    clientName: 'Landmark Realty Group',
    clientEmail: 'billing@landmarkrealty.com',
    clientWorkspaceId: 'landmark-realty',
    status: 'sent',
    amountDue: 2800.00,
    amountPaid: 0.00,
    issueDate: '2026-07-25',
    dueDate: '2026-08-10',
    paymentMethod: 'card',
    paymentLink: 'https://pay.mercury.com/inv_003',
    items: [
      { id: 'item_4', description: 'Custom SOP Setup & Brokerage Org Chart Provisioning', quantity: 1, unitPrice: 2800.00, amount: 2800.00 }
    ],
    notes: '1-Click Card or ACH payment link.'
  }
];

export const INITIAL_MERCURY_TRANSACTIONS: MercuryTransaction[] = [
  {
    id: 'tx_501',
    amount: 4500.00,
    type: 'credit',
    counterpartyName: 'Nest Realty Wilmington',
    category: 'Subscription Income',
    status: 'settled',
    postedAt: '2026-07-01 14:32:00',
    description: 'INV-2026-081 Payment Received via Mercury ACH',
    referenceNumber: 'ACH-8891023'
  },
  {
    id: 'tx_502',
    amount: 450.00,
    type: 'debit',
    counterpartyName: 'Apex Media & Photography',
    category: 'Vendor Payout',
    status: 'settled',
    postedAt: '2026-07-15 09:12:00',
    description: 'Twilight Photography Payout — 702 Lumina Ave',
    referenceNumber: 'ACH-4412091'
  },
  {
    id: 'tx_503',
    amount: 120.00,
    type: 'debit',
    counterpartyName: 'Wilmington Sign Courier LLC',
    category: 'Vendor Payout',
    status: 'settled',
    postedAt: '2026-07-22 16:45:00',
    description: 'Sign Rider Courier Placement — 304 Ocean Blvd',
    referenceNumber: 'ACH-9912044'
  }
];
