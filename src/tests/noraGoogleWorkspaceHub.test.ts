import { describe, it, expect } from 'vitest';
import { NoraGoogleWorkspaceService } from '../../server/services/noraGoogleWorkspaceService';

describe('Nora Google Workspace Integration Suite', () => {
  it('1. Generates structured Google Drive Transaction Vaults with standardized templates', () => {
    const vault = NoraGoogleWorkspaceService.createTransactionDriveVault({
      propertyAddress: '504 Soundview Drive, Wilmington NC',
      clientName: 'Arthur & Linda Pendelton',
      agentEmail: 'ryan@nestrealty.com'
    });

    expect(vault).toBeDefined();
    expect(vault.id).toContain('vault_');
    expect(vault.name).toContain('504 Soundview Drive');
    expect(vault.subfolders.length).toBe(5);
    expect(vault.subfolders[0].name).toContain('Form 2-T');
    expect(vault.subfolders[1].name).toContain('RPOADS');
    expect(vault.subfolders[2].name).toContain('Maxa');
  });

  it('2. Calculates NC Seller Net Sheet with statutory $1 per $500 excise tax and broker split', () => {
    const netSheet = NoraGoogleWorkspaceService.calculateSellerNetSheet({
      propertyAddress: '742 Lumina Avenue, Wrightsville Beach NC',
      sellerName: 'David & Karen Miller',
      listingPrice: 1950000,
      firstMortgagePayoff: 650000,
      totalCommissionPercent: 5.5,
      brokerCommissionPercent: 2.75,
      buyerAgentCommissionPercent: 2.75,
      annualPropertyTaxes: 8500,
      hoaDuesPerYear: 3600,
      estimatedRepairsAllowance: 5000,
      closingAttorneyFee: 1200
    });

    expect(netSheet).toBeDefined();
    expect(netSheet.listingPrice).toBe(1950000);
    // NC Excise Tax: $1.00 per $500 on $1,950,000 = $3,900
    expect(netSheet.expenses.ncExciseTax).toBe(3900);
    // Total Commission: 5.5% on $1.95M = $107,250
    expect(netSheet.expenses.totalCommission).toBe(107250);
    expect(netSheet.estimatedNetToSeller).toBeGreaterThan(1100000);
    expect(netSheet.exportUrl).toContain('docs.google.com/spreadsheets');
  });

  it('3. Generates verified Google Meet conference rooms with dial-in PINs', () => {
    const meet = NoraGoogleWorkspaceService.generateGoogleMeetRoom({
      meetingTitle: 'Landfall Production Mastermind',
      startTime: 'Today, 2:00 PM',
      attendees: ['ryan@nestrealty.com', 'sarah.jenkins@nestrealty.com']
    });

    expect(meet.meetUrl).toContain('https://meet.google.com/');
    expect(meet.phonePin).toBeDefined();
  });

  it('4. Triages incoming client inquiries from AskNora@nestrealty.com with attachments', () => {
    const feed = NoraGoogleWorkspaceService.getGmailTriageFeed();
    expect(feed.length).toBeGreaterThanOrEqual(3);
    const showingReq = feed.find(m => m.category === 'showing_request');
    expect(showingReq).toBeDefined();
    expect(showingReq?.proposedDraft.body).toContain('AskNora@nestrealty.com');
  });
});
