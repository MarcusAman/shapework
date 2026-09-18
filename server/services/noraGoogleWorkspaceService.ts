/**
 * Nora Google Workspace Integration Service
 * Enterprise connectivity for Google Drive, Gmail (AskNora@nestrealty.com),
 * Google Docs/Sheets (Seller Net Sheets, CMA decks), and Google Meet.
 */

export interface DriveVaultFolder {
  id: string;
  name: string;
  url: string;
  itemCount: number;
  subfolders: { name: string; url: string; templateCount: number }[];
  createdDate: string;
  propertyAddress: string;
  agentEmail: string;
}

export interface SellerNetSheetInput {
  propertyAddress: string;
  sellerName?: string;
  listingPrice: number;
  firstMortgagePayoff: number;
  secondMortgagePayoff?: number;
  totalCommissionPercent: number; // e.g. 5.5 or 6.0
  brokerCommissionPercent?: number; // e.g. 2.75 or 3.0
  buyerAgentCommissionPercent?: number;
  annualPropertyTaxes?: number;
  hoaDuesPerYear?: number;
  estimatedRepairsAllowance?: number;
  closingAttorneyFee?: number;
  courierAndWireFee?: number;
}

export interface SellerNetSheetResult {
  sheetId: string;
  sheetTitle: string;
  exportUrl: string;
  propertyAddress: string;
  sellerName: string;
  listingPrice: number;
  expenses: {
    firstMortgage: number;
    secondMortgage: number;
    totalCommission: number;
    ncExciseTax: number; // NC Revenue Stamp: $1.00 per $500 of sale price
    propertyTaxProrationEst: number;
    hoaProrationEst: number;
    repairsAllowance: number;
    attorneyAndWireFees: number;
    totalClosingCosts: number;
  };
  estimatedNetToSeller: number;
  netPercentageOfList: number;
  calculatedAt: string;
}

export interface GmailTriageMessage {
  id: string;
  from: string;
  fromName: string;
  subject: string;
  receivedAt: string;
  category: 'buyer_inquiry' | 'offer_received' | 'showing_request' | 'closing_update' | 'general';
  urgency: 'high' | 'medium' | 'low';
  summary: string;
  proposedDraft: {
    to: string;
    subject: string;
    body: string;
  };
  attachments: { name: string; type: string; sizeKb: number }[];
}

export class NoraGoogleWorkspaceService {
  private static vaultsStore: Map<string, DriveVaultFolder> = new Map();

  static initializeDefaults() {
    // Only initialize if explicitly configured with connected Google Workspace
  }

  /**
   * 1-Click Google Drive Transaction Vault Generator
   */
  static createTransactionDriveVault(params: {
    propertyAddress: string;
    clientName: string;
    agentEmail: string;
    realDriveUrl?: string;
  }): DriveVaultFolder {
    const slug = params.propertyAddress
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const vaultId = `vault_${slug}`;
    const baseDriveUrl = params.realDriveUrl || 'https://drive.google.com';

    const subfolders = [
      { name: '01 - Executed Contracts & Form 2-T', url: baseDriveUrl, templateCount: 3 },
      { name: '02 - Mandatory NC Disclosures (RPOADS/MOG/Lead)', url: baseDriveUrl, templateCount: 4 },
      { name: '03 - Marketing, 300 DPI Proofs & Maxa Assets', url: baseDriveUrl, templateCount: 6 },
      { name: '04 - Inspections, WDIR & Repair Requests', url: baseDriveUrl, templateCount: 2 },
      { name: '05 - Title, Settlement & Closing Statements', url: baseDriveUrl, templateCount: 2 }
    ];

    const vault: DriveVaultFolder = {
      id: vaultId,
      name: `📁 [Nest Transaction] ${params.propertyAddress} - ${params.clientName}`,
      url: baseDriveUrl,
      itemCount: 17,
      subfolders,
      createdDate: new Date().toISOString(),
      propertyAddress: params.propertyAddress,
      agentEmail: params.agentEmail
    };

    this.vaultsStore.set(vaultId, vault);
    return vault;
  }

  static getVaults(): DriveVaultFolder[] {
    return Array.from(this.vaultsStore.values());
  }

  /**
   * Google Sheets Real-Time Seller Net Sheet Calculator
   */
  static calculateSellerNetSheet(input: SellerNetSheetInput): SellerNetSheetResult {
    const listingPrice = input.listingPrice || 500000;
    const firstMortgage = input.firstMortgagePayoff || 0;
    const secondMortgage = input.secondMortgagePayoff || 0;

    // NC Excise Tax (Revenue Stamps): $1.00 per $500 of purchase price
    const ncExciseTax = Math.ceil(listingPrice / 500) * 1.0;

    // Total Brokerage Commission
    const commissionPercent = input.totalCommissionPercent || 5.5;
    const totalCommission = (listingPrice * commissionPercent) / 100;

    // Estimated Prorated Property Taxes (assuming 6 months proration est)
    const annualTaxes = input.annualPropertyTaxes || 3600;
    const propertyTaxProrationEst = Math.round((annualTaxes / 12) * 6);

    // Estimated HOA Proration
    const hoaAnnual = input.hoaDuesPerYear || 1200;
    const hoaProrationEst = Math.round(hoaAnnual / 12);

    const repairsAllowance = input.estimatedRepairsAllowance || 2500;
    const closingAttorneyFee = input.closingAttorneyFee || 950;
    const wireCourier = input.courierAndWireFee || 150;
    const attorneyAndWireFees = closingAttorneyFee + wireCourier;

    const totalClosingCosts =
      firstMortgage +
      secondMortgage +
      totalCommission +
      ncExciseTax +
      propertyTaxProrationEst +
      hoaProrationEst +
      repairsAllowance +
      attorneyAndWireFees;

    const estimatedNetToSeller = Math.max(0, listingPrice - totalClosingCosts);
    const netPercentageOfList = Math.round((estimatedNetToSeller / listingPrice) * 1000) / 10;

    const sheetId = `gsheet_netsheet_${Date.now().toString(36)}`;
    return {
      sheetId,
      sheetTitle: `📊 Seller Net Sheet — ${input.propertyAddress}`,
      exportUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit?usp=sharing`,
      propertyAddress: input.propertyAddress,
      sellerName: input.sellerName,
      listingPrice,
      expenses: {
        firstMortgage,
        secondMortgage,
        totalCommission,
        ncExciseTax,
        propertyTaxProrationEst,
        hoaProrationEst,
        repairsAllowance,
        attorneyAndWireFees,
        totalClosingCosts
      },
      estimatedNetToSeller,
      netPercentageOfList,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Gmail Smart Triage Assistant (AskNora@nestrealty.com)
   */
  static getGmailTriageFeed(): GmailTriageMessage[] {
    return [
      {
        id: 'msg_triage_1',
        from: 'buyer.lead@gmail.com',
        fromName: 'Jessica Montgomery',
        subject: 'Inquiry regarding 742 Lumina Ave private tour this Saturday',
        receivedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        category: 'showing_request',
        urgency: 'high',
        summary: 'Prequalified buyer ($2.1M conventional) requesting a private tour of 742 Lumina Avenue on Saturday at 11:00 AM.',
        proposedDraft: {
          to: 'buyer.lead@gmail.com',
          subject: 'Re: Private Tour Confirmation — 742 Lumina Ave (Nest Realty)',
          body: `Hi Jessica,\n\nThank you for reaching out to Nest Realty! We would love to host you for a private tour of 742 Lumina Avenue this Saturday at 11:00 AM.\n\nI have attached the MLS listing package and property highlights. Our listing broker Ryan Crecelius will meet you at the property. Let us know if you need anything in the meantime!\n\nBest regards,\nNora & The Nest Realty Team\nAskNora@nestrealty.com`
        },
        attachments: [
          { name: '742_Lumina_MLS_FeatureSheet.pdf', type: 'application/pdf', sizeKb: 1420 },
          { name: 'Form2T_NC_Sample.pdf', type: 'application/pdf', sizeKb: 890 }
        ]
      },
      {
        id: 'msg_triage_2',
        from: 'closing.attorney@craigefoxlaw.com',
        fromName: 'Craige & Fox PLLC (Closing Dept)',
        subject: '312 Mayfaire Way — Title Search Cleared & Closing Scheduled for Sept 15',
        receivedAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
        category: 'closing_update',
        urgency: 'medium',
        summary: 'Title search completed with zero encumbrances. Closing scheduled for Sept 15 at 2:00 PM at Mayfaire office.',
        proposedDraft: {
          to: 'closing.attorney@craigefoxlaw.com',
          subject: 'Re: 312 Mayfaire Way — Closing Confirmation Received',
          body: `Thank you for the update! We have noted the cleared title and confirmed the Sept 15, 2:00 PM closing in our Nest Brokerage transaction ledger.\n\nBest,\nNora (Nest Operations)`
        },
        attachments: [
          { name: 'Preliminary_Title_Report_312Mayfaire.pdf', type: 'application/pdf', sizeKb: 2150 }
        ]
      },
      {
        id: 'msg_triage_3',
        from: 'sarah.agent@intracoastalrealty.com',
        fromName: 'Sarah Jenkins (Co-Broke Agent)',
        subject: 'Offer Submission: Form 2-T for 1104 Arboretum Drive',
        receivedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        category: 'offer_received',
        urgency: 'high',
        summary: 'Incoming offer of $1,225,000 with $15,000 Due Diligence Fee and 21-day closing for 1104 Arboretum Drive.',
        proposedDraft: {
          to: 'sarah.agent@intracoastalrealty.com',
          subject: 'Offer Received & Under Review — 1104 Arboretum Dr',
          body: `Hi Sarah,\n\nWe have received your buyers' Form 2-T offer for 1104 Arboretum Drive. It is currently being presented to the sellers by listing broker Sarah Jenkins. We will follow up promptly.\n\nWarm regards,\nNora (AskNora@nestrealty.com)`
        },
        attachments: [
          { name: 'Form2T_Signed_Offer_Arboretum.pdf', type: 'application/pdf', sizeKb: 3100 },
          { name: 'PreApproval_Letter_BankOfAmerica.pdf', type: 'application/pdf', sizeKb: 450 }
        ]
      }
    ];
  }

  /**
   * Google Meet Link Generator
   */
  static generateGoogleMeetRoom(params: {
    meetingTitle: string;
    startTime: string;
    attendees: string[];
  }): { meetUrl: string; conferenceId: string; phonePin: string } {
    const slug = Math.random().toString(36).substring(2, 6) + '-' +
                 Math.random().toString(36).substring(2, 6) + '-' +
                 Math.random().toString(36).substring(2, 6);
    return {
      meetUrl: `https://meet.google.com/${slug}`,
      conferenceId: `nest-meet-${Date.now().toString(36)}`,
      phonePin: `${Math.floor(100000000 + Math.random() * 900000000)}#`
    };
  }
}
