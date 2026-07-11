/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import OAuthClient from 'intuit-oauth';
import {
  QuickBooksCompanyInfo,
  QuickBooksInvoice,
  QuickBooksPayment,
  QuickBooksDeposit,
  QuickBooksProfitAndLossSummary
} from './quickbooksTypes.js';

export class QuickBooksClient {
  private client: OAuthClient;
  private realmId: string;
  private isMockMode: boolean = false;

  constructor(client: OAuthClient, realmId: string) {
    this.client = client;
    this.realmId = realmId;
    
    // Determine if we should run in Mock Mode for testing/e2e
    const mockEnv = process.env.QUICKBOOKS_CLIENT_ID === 'mock_client_id' || 
                    process.env.NODE_ENV === 'test' || 
                    !process.env.QUICKBOOKS_CLIENT_ID;
    this.isMockMode = mockEnv;
  }

  private getBaseUrl(): string {
    return this.client.getQBOEnvironmentURI();
  }

  /**
   * Fetch company metadata info
   */
  public async getCompanyInfo(): Promise<QuickBooksCompanyInfo> {
    if (this.isMockMode) {
      return {
        CompanyName: 'Nest Realty Group LLC (Mock)',
        LegalName: 'Nest Realty Group LLC',
        SupportedLanguages: 'en',
        Country: 'US',
        Email: { Address: 'accounting@nestrealty.com' },
        WebAddr: { URI: 'https://nestrealty.com' },
        CompanyAddr: {
          Line1: '123 Brokerage Way',
          City: 'Austin',
          CountrySubDivisionCode: 'TX',
          PostalCode: '78701'
        }
      };
    }

    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}v3/company/${this.realmId}/companyinfo/${this.realmId}`;
    
    const response = await this.client.makeApiCall({
      url,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.status !== 200) {
      throw new Error(`QBO getCompanyInfo returned status ${response.status}: ${response.body}`);
    }

    const data = response.json || JSON.parse(response.body);
    return data.CompanyInfo;
  }

  /**
   * General SQL-like query capability against QBO entities
   */
  public async query(queryStr: string): Promise<any> {
    if (this.isMockMode) {
      return { QueryResponse: {} };
    }

    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}v3/company/${this.realmId}/query?query=${encodeURIComponent(queryStr)}`;

    const response = await this.client.makeApiCall({
      url,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.status !== 200) {
      throw new Error(`QBO query returned status ${response.status}: ${response.body}`);
    }

    return response.json || JSON.parse(response.body);
  }

  /**
   * Fetch invoices within the lookback window
   */
  public async getInvoices(lookbackDays: number = 90): Promise<QuickBooksInvoice[]> {
    if (this.isMockMode) {
      const pastDate = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0];
      const olderDate = new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString().split('T')[0];
      return [
        {
          Id: 'inv_101',
          DocNumber: 'INV-2026-001',
          TxnDate: pastDate,
          TotalAmt: 8500.00,
          Balance: 0.00,
          CustomerRef: { value: 'c_01', name: 'Evergreen Terr Closing Escrow' }
        },
        {
          Id: 'inv_102',
          DocNumber: 'INV-2026-002',
          TxnDate: olderDate,
          TotalAmt: 6200.00,
          Balance: 6200.00,
          CustomerRef: { value: 'c_02', name: 'Woodlawn Ave Title' }
        }
      ];
    }

    const dateLimit = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const queryStr = `select * from Invoice where TxnDate >= '${dateLimit}' order by TxnDate desc`;
    const data = await this.query(queryStr);
    return data?.QueryResponse?.Invoice || [];
  }

  /**
   * Fetch payments within the lookback window
   */
  public async getRecentPayments(lookbackDays: number = 90): Promise<QuickBooksPayment[]> {
    if (this.isMockMode) {
      const todayStr = new Date().toISOString().split('T')[0];
      return [
        {
          Id: 'pay_201',
          TxnDate: todayStr,
          TotalAmt: 8500.00,
          UnappliedAmt: 0.00,
          CustomerRef: { value: 'c_01', name: 'Evergreen Terr Closing Escrow' },
          Line: [
            {
              Amount: 8500.00,
              LinkedTxn: [
                { TxnId: 'inv_101', TxnType: 'Invoice' }
              ]
            }
          ]
        }
      ];
    }

    const dateLimit = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const queryStr = `select * from Payment where TxnDate >= '${dateLimit}' order by TxnDate desc`;
    const data = await this.query(queryStr);
    return data?.QueryResponse?.Payment || [];
  }

  /**
   * Fetch deposits within the lookback window
   */
  public async getDeposits(lookbackDays: number = 90): Promise<QuickBooksDeposit[]> {
    if (this.isMockMode) {
      const yesterdayStr = new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0];
      return [
        {
          Id: 'dep_301',
          TxnDate: yesterdayStr,
          TotalAmt: 15000.00,
          Line: [
            {
              Amount: 15000.00,
              DetailType: 'DepositLineDetail',
              DepositLineDetail: {
                AccountRef: { name: 'Escrow Holding Account', value: 'acc_88' },
                Entity: {
                  Type: 'Customer',
                  EntityRef: { name: 'Lennar Homes Title Dept', value: 'ent_99' }
                }
              }
            }
          ]
        }
      ];
    }

    const dateLimit = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const queryStr = `select * from Deposit where TxnDate >= '${dateLimit}' order by TxnDate desc`;
    const data = await this.query(queryStr);
    return data?.QueryResponse?.Deposit || [];
  }

  /**
   * Fetch Profit & Loss Report Summary
   */
  public async getProfitAndLossSummary(lookbackDays: number = 30): Promise<QuickBooksProfitAndLossSummary> {
    const startDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    if (this.isMockMode) {
      return {
        netIncome: 24500.00,
        totalRevenue: 52000.00,
        totalExpenses: 27500.00,
        startDate,
        endDate
      };
    }

    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}v3/company/${this.realmId}/reports/ProfitAndLoss?start_date=${startDate}&end_date=${endDate}`;

    const response = await this.client.makeApiCall({
      url,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.status !== 200) {
      throw new Error(`QBO P&L report returned status ${response.status}: ${response.body}`);
    }

    const data = response.json || JSON.parse(response.body);

    // Parse Net Income, Revenue, and Expense rows from standard QBO Report JSON structure safely
    let totalRevenue = 0;
    let totalExpenses = 0;
    let netIncome = 0;

    try {
      const rows = data.Rows?.Row || [];
      for (const row of rows) {
        if (row.Type === 'Section') {
          if (row.group === 'Income') {
            totalRevenue = parseFloat(row.Summary?.ColData?.[1]?.value || '0');
          } else if (row.group === 'Expenses') {
            totalExpenses = parseFloat(row.Summary?.ColData?.[1]?.value || '0');
          }
        } else if (row.Type === 'Data' && row.group === 'NetIncome') {
          netIncome = parseFloat(row.ColData?.[1]?.value || '0');
        }
      }
      
      // Fallbacks if section parsing fails
      if (!netIncome && data.Header?.Option?.find((o: any) => o.Name === 'NetIncome')?.Value) {
        netIncome = parseFloat(data.Header.Option.find((o: any) => o.Name === 'NetIncome').Value);
      }
    } catch (e: any) {
      console.warn('[QuickBooks Client] Failed to parse fine-grained details from P&L report:', e.message);
    }

    return {
      netIncome: netIncome || (totalRevenue - totalExpenses),
      totalRevenue,
      totalExpenses,
      startDate,
      endDate
    };
  }
}
