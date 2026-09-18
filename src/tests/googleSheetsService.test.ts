import { describe, it, expect } from 'vitest';
import { GoogleSheetsService } from '../../server/services/googleSheetsService.js';
import { executeGoogleSheetsTool } from '../../server/ai/tools/googleSheetsMcpTools.js';

describe('Google Sheets API (v4) Service Suite', () => {
  it('1. Retrieves 3-tab master spreadsheet metadata', () => {
    const meta = GoogleSheetsService.getMetadata();
    expect(meta.spreadsheetId).toBeDefined();
    expect(meta.spreadsheetUrl).toContain('docs.google.com/spreadsheets');
    expect(meta.tabs.marketingPipeline.title).toBe('Pipeline & Listings');
    expect(meta.tabs.vendorDispatches.title).toBe('Vendor Work Orders');
    expect(meta.tabs.listingAssetPacks.title).toBe('3-Day Escrow & Trust Compliance');
  });

  it('2. Exports database state to 3 tabs in Google Sheets', async () => {
    const res = await GoogleSheetsService.exportToGoogleSheets();
    expect(res.success).toBe(true);
    expect(res.sheetState.tabs.marketingPipeline.rowCount).toBeGreaterThanOrEqual(2);
    expect(res.sheetState.tabs.vendorDispatches.rowCount).toBeGreaterThanOrEqual(2);
    expect(res.sheetState.tabs.listingAssetPacks.rowCount).toBeGreaterThanOrEqual(2);
  });

  it('3. Appends a compliance record to 3-Day Escrow & Trust Compliance tab', async () => {
    const appendRes = await GoogleSheetsService.appendRowToSheet({
      tabName: '3-Day Escrow & Trust Compliance',
      rowValues: [
        'TX-9901',
        '219 Dock St, Wilmington NC',
        '$15,000.00',
        'Nest Realty Escrow Trust',
        '2026-09-03 (3 Banking Days)',
        '2026-09-02 (Logged)',
        'Compliant (Rule 58A)'
      ]
    });

    expect(appendRes.success).toBe(true);
    expect(appendRes.rowCount).toBe(7);
  });

  it('4. Pulls updates from Google Sheets into local memory', async () => {
    const pullRes = await GoogleSheetsService.pullFromGoogleSheets();
    expect(pullRes.success).toBe(true);
    expect(pullRes.sheetState).toBeDefined();
  });

  it('5. Executes Google Sheets tools via Nora AI tool caller', async () => {
    const queryRes = await executeGoogleSheetsTool('query_google_sheets_pipeline', {
      tabName: 'Pipeline & Listings'
    });
    expect(queryRes.spreadsheetUrl).toBeDefined();
    expect(queryRes.tab).toBe('Pipeline & Listings');

    const logRes = await executeGoogleSheetsTool('log_escrow_deposit_to_sheets', {
      transactionId: 'TX-4010',
      propertyAddress: '312 Red Cross St, Wilmington NC',
      amount: '$12,500.00',
      escrowHolder: 'Southern Coast Title'
    });
    expect(logRes.success).toBe(true);
  });
});
