/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type QuickBooksConnection = {
  id: string;
  workspaceId: string;
  realmId: string;
  environment: 'sandbox' | 'production';
  status: 'connected' | 'expired' | 'disconnected' | 'error';
  encryptedAccessToken: string;
  encryptedRefreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt?: string;
  connectedByUserId: string;
  connectedAt: string;
  lastSyncedAt?: string;
  lastError?: string;
};

export type FinanceSignal = {
  id: string;
  workspaceId: string;
  sourceSystem: 'quickbooks';
  sourceRecordId: string;
  signalType:
    | 'payment_received'
    | 'invoice_open'
    | 'deposit_received'
    | 'commission_readiness_gap'
    | 'payment_match_needed'
    | 'owner_finance_review';
  relatedTransactionId?: string;
  amount?: number;
  counterparty?: string;
  date?: string;
  status: 'new' | 'reviewed' | 'resolved';
  summary: string;
};

export type QuickBooksCompanyInfo = {
  CompanyName: string;
  LegalName?: string;
  SupportedLanguages?: string;
  Country?: string;
  Email?: { Address: string };
  WebAddr?: { URI: string };
  CompanyAddr?: {
    Line1?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
  };
};

export type QuickBooksInvoice = {
  Id: string;
  DocNumber?: string;
  TxnDate: string;
  TotalAmt: number;
  Balance: number;
  CustomerRef: {
    value: string;
    name?: string;
  };
  Line?: any[];
};

export type QuickBooksPayment = {
  Id: string;
  TxnDate: string;
  TotalAmt: number;
  UnappliedAmt?: number;
  ProcessPayment?: boolean;
  CustomerRef: {
    value: string;
    name?: string;
  };
  Line?: {
    Amount: number;
    LinkedTxn: {
      TxnId: string;
      TxnType: string;
    }[];
  }[];
};

export type QuickBooksDeposit = {
  Id: string;
  TxnDate: string;
  TotalAmt: number;
  Line?: {
    Amount: number;
    DetailType?: string;
    DepositLineDetail?: {
      AccountRef?: {
        name?: string;
        value?: string;
      };
      Entity?: {
        Type?: string;
        EntityRef?: {
          name?: string;
          value?: string;
        };
      };
    };
  }[];
};

export type QuickBooksProfitAndLossSummary = {
  netIncome: number;
  totalRevenue: number;
  totalExpenses: number;
  startDate: string;
  endDate: string;
};

export type QuickBooksSyncSummary = {
  companyName?: string;
  invoicesChecked: number;
  paymentsChecked: number;
  depositsChecked: number;
  exceptionsCreated: number;
  lastSyncedAt: string;
};
