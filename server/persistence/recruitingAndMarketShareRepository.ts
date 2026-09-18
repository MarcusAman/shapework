/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Recruiting & MLS Market Share Repository
 * Provides Cape Fear MLS brokerage rankings, competitor luxury producer intelligence,
 * transition readiness scoring, and Nest Realty financial advantage calculations for the brokerage owner.
 */

export interface BrokerageMarketShare {
  id: string;
  name: string;
  shortName: string;
  closedVolume12Mo: number;
  marketSharePercent: number;
  agentCount: number;
  avgVolumePerAgent: number;
  avgSalePrice: number;
  totalSides: number;
  dominantSubmarkets: string[];
  isNestRealty: boolean;
}

export interface CompetitorAgentCandidate {
  id: string;
  name: string;
  currentBrokerage: string;
  officeLocation: string;
  annualClosedVolume: number;
  closedSides12Mo: number;
  avgSalePrice: number;
  primarySubmarket: string;
  experienceYears: number;
  phone: string;
  email: string;
  currentEstimatedSplit: string; // e.g. "70/30 Split + 6% Franchise Royalty"
  currentEstimatedAnnualDeskFees: number;
  currentEstimatedOutofPocketMarketing: number;
  transitionReadinessScore: number; // 1 - 100
  readinessFactors: string[];
  painPoints: string[];
  pipelineStatus: 'identified' | 'outreach_sent' | 'meeting_scheduled' | 'offer_extended' | 'transitioning' | 'joined';
  lastContactDate?: string;
  notes?: string[];
}

export interface AgentRecruitingSavingsAnalysis {
  candidate: CompetitorAgentCandidate;
  grossCommissionIncome: number; // Estimated 2.75% avg commission
  currentBrokerageTakeHome: number;
  nestRealtyTakeHome: number;
  annualTakeHomeIncrease: number;
  marketingSavingsWithNestVA: number;
  totalAnnualFinancialGain: number;
  keyDifferentiators: string[];
}

export class RecruitingAndMarketShareRepository {
  private static marketShareData: BrokerageMarketShare[] = [
    {
      id: 'firm_seacoast',
      name: 'Coldwell Banker Sea Coast Advantage',
      shortName: 'Sea Coast',
      closedVolume12Mo: 310500000,
      marketSharePercent: 18.3,
      agentCount: 210,
      avgVolumePerAgent: 1478571,
      avgSalePrice: 485000,
      totalSides: 640,
      dominantSubmarkets: ['Monkey Junction', 'Porters Neck', 'Hampstead'],
      isNestRealty: false
    },
    {
      id: 'firm_intracoastal',
      name: 'Intracoastal Realty Corp',
      shortName: 'Intracoastal',
      closedVolume12Mo: 265000000,
      marketSharePercent: 15.6,
      agentCount: 142,
      avgVolumePerAgent: 1866197,
      avgSalePrice: 820000,
      totalSides: 323,
      dominantSubmarkets: ['Wrightsville Beach', 'Landfall', 'Figure Eight Island'],
      isNestRealty: false
    },
    {
      id: 'firm_sothebys',
      name: "Landmark Sotheby's International Realty",
      shortName: "Sotheby's",
      closedVolume12Mo: 188200000,
      marketSharePercent: 11.1,
      agentCount: 68,
      avgVolumePerAgent: 2767647,
      avgSalePrice: 1150000,
      totalSides: 164,
      dominantSubmarkets: ['Landfall', 'Historic Downtown', 'Masonboro Sound'],
      isNestRealty: false
    },
    {
      id: 'firm_nest',
      name: 'Nest Realty Wilmington',
      shortName: 'Nest Realty',
      closedVolume12Mo: 142500000,
      marketSharePercent: 8.4,
      agentCount: 72,
      avgVolumePerAgent: 1979166,
      avgSalePrice: 945000,
      totalSides: 151,
      dominantSubmarkets: ['Mayfaire / Autumn Hall', 'Landfall', 'Wrightsville Beach'],
      isNestRealty: true
    },
    {
      id: 'firm_exp',
      name: 'eXp Realty LLC (Cape Fear Chapter)',
      shortName: 'eXp Realty',
      closedVolume12Mo: 112000000,
      marketSharePercent: 6.6,
      agentCount: 94,
      avgVolumePerAgent: 1191489,
      avgSalePrice: 420000,
      totalSides: 266,
      dominantSubmarkets: ['Midtown Wilmington', 'Ogden', 'Leland'],
      isNestRealty: false
    }
  ];

  private static candidateRoster: CompetitorAgentCandidate[] = [
    {
      id: 'cand_sarah_jenkins',
      name: 'Sarah Jenkins',
      currentBrokerage: "Landmark Sotheby's International Realty",
      officeLocation: 'Autumn Hall / Eastwood',
      annualClosedVolume: 24500000,
      closedSides12Mo: 18,
      avgSalePrice: 1361111,
      primarySubmarket: 'Landfall Golf & Country Club',
      experienceYears: 9,
      phone: '(910) 555-8120',
      email: 'sjenkins@sothebysrealty-wilmington.com',
      currentEstimatedSplit: '70/30 Split + 6% Franchise Royalty Fee',
      currentEstimatedAnnualDeskFees: 6000,
      currentEstimatedOutofPocketMarketing: 28000,
      transitionReadinessScore: 92,
      readinessFactors: [
        'Franchise royalty cuts 6% off gross top-line commissions',
        'Spends 14 hrs/week manually designing marketing collateral',
        'Recently lost 2 luxury listings due to slow digital launch velocity'
      ],
      painPoints: [
        'Lack of in-house marketing production assistants',
        'No direct yard sign post & lockbox fleet management service',
        'High corporate desk fees with minimal localized luxury tools'
      ],
      pipelineStatus: 'meeting_scheduled',
      lastContactDate: '2026-08-18',
      notes: [
        'Met Ryan for coffee at drift coffee Autumn Hall. Very impressed with Nest Maxa Design Studio and Eduardo VA workload support.'
      ]
    },
    {
      id: 'cand_carter_vance',
      name: 'Carter Vance',
      currentBrokerage: 'Intracoastal Realty Corp',
      officeLocation: 'Lumina Station / Wrightsville',
      annualClosedVolume: 32000000,
      closedSides12Mo: 21,
      avgSalePrice: 1523809,
      primarySubmarket: 'Wrightsville Beach Oceanfront',
      experienceYears: 14,
      phone: '(910) 555-9431',
      email: 'cvance@intracoastalrealty.com',
      currentEstimatedSplit: '80/20 Split with $28k Cap + Tech Fees',
      currentEstimatedAnnualDeskFees: 4800,
      currentEstimatedOutofPocketMarketing: 36000,
      transitionReadinessScore: 86,
      readinessFactors: [
        'Top 5% oceanfront luxury producer seeking boutique modern branding',
        'Paying independent freelancer $3k/mo for print design and brochures',
        'Looking for institutional-grade spatial comps and contract automation'
      ],
      painPoints: [
        'Outdated legacy brokerage tech stack',
        'Slow contract review cycle with broker-in-charge',
        'Heavy competition within own brokerage office'
      ],
      pipelineStatus: 'outreach_sent',
      lastContactDate: '2026-08-12',
      notes: [
        'Sent initial personal note from Ryan highlighting Nest Spatial Comps 3D elevation and waterfront navigation tools.'
      ]
    },
    {
      id: 'cand_elena_rostova',
      name: 'Elena Rostova',
      currentBrokerage: 'Coldwell Banker Sea Coast Advantage',
      officeLocation: 'Military Cutoff / Mayfaire',
      annualClosedVolume: 18200000,
      closedSides12Mo: 24,
      avgSalePrice: 758333,
      primarySubmarket: 'Autumn Hall / Historic Downtown',
      experienceYears: 6,
      phone: '(910) 555-3290',
      email: 'elena.rostova@seacoastrealty.com',
      currentEstimatedSplit: '75/25 Split with $22k Cap',
      currentEstimatedAnnualDeskFees: 3600,
      currentEstimatedOutofPocketMarketing: 18000,
      transitionReadinessScore: 89,
      readinessFactors: [
        'Rising star producer feeling lost in 200+ agent mega-brokerage',
        'Wants collaborative culture and dedicated virtual assistant support',
        'High desire for turnkey sign post installation and lockbox logistics'
      ],
      painPoints: [
        'Zero dedicated virtual assistant support',
        'Impersonal brokerage leadership',
        'Brokerage brand perceived as volume/commodity rather than curated luxury'
      ],
      pipelineStatus: 'identified',
      lastContactDate: undefined,
      notes: [
        'Identified via Cape Fear MLS closed volume report for Autumn Hall listings.'
      ]
    },
    {
      id: 'cand_marcus_sterling',
      name: 'Marcus Sterling',
      currentBrokerage: "Landmark Sotheby's International Realty",
      officeLocation: 'Downtown Front Street',
      annualClosedVolume: 15400000,
      closedSides12Mo: 14,
      avgSalePrice: 1100000,
      primarySubmarket: 'Figure Eight Island & Masonboro',
      experienceYears: 11,
      phone: '(910) 555-6712',
      email: 'msterling@sothebysrealty-wilmington.com',
      currentEstimatedSplit: '70/30 Split + 6% Franchise Fee',
      currentEstimatedAnnualDeskFees: 5400,
      currentEstimatedOutofPocketMarketing: 22000,
      transitionReadinessScore: 78,
      readinessFactors: [
        'High dissatisfaction with corporate franchise fee deductions',
        'Spends weekend hours drafting NC Form 2-T offers manually'
      ],
      painPoints: [
        'Franchise brand royalty deduction',
        'No AI offer drafting tools'
      ],
      pipelineStatus: 'identified',
      lastContactDate: undefined,
      notes: []
    }
  ];

  /**
   * Retrieves full Cape Fear MLS brokerage market share rankings
   */
  public static getMarketShareRankings(): BrokerageMarketShare[] {
    return [...this.marketShareData];
  }

  /**
   * Retrieves all competitor agent candidates for recruitment
   */
  public static getCandidates(filter?: {
    brokerage?: string;
    submarket?: string;
    status?: string;
    minVolume?: number;
  }): CompetitorAgentCandidate[] {
    let result = [...this.candidateRoster];
    if (filter?.brokerage) {
      result = result.filter(c => c.currentBrokerage.toLowerCase().includes(filter.brokerage!.toLowerCase()));
    }
    if (filter?.submarket) {
      result = result.filter(c => c.primarySubmarket.toLowerCase().includes(filter.submarket!.toLowerCase()));
    }
    if (filter?.status) {
      result = result.filter(c => c.pipelineStatus === filter.status);
    }
    if (filter?.minVolume) {
      result = result.filter(c => c.annualClosedVolume >= filter.minVolume!);
    }
    return result.sort((a, b) => b.transitionReadinessScore - a.transitionReadinessScore);
  }

  /**
   * Retrieves a candidate by ID
   */
  public static getCandidateById(candidateId: string): CompetitorAgentCandidate | null {
    return this.candidateRoster.find(c => c.id === candidateId) || null;
  }

  /**
   * Calculates detailed financial comparison & savings if candidate transitions to Nest Realty
   */
  public static calculateRecruitingSavings(candidateId: string): AgentRecruitingSavingsAnalysis | null {
    const candidate = this.getCandidateById(candidateId);
    if (!candidate) return null;

    const gci = Math.round(candidate.annualClosedVolume * 0.0275); // 2.75% avg GCI

    // Calculate current brokerage take-home
    let currentBrokerageCut = 0;
    if (candidate.currentEstimatedSplit.includes('70/30')) {
      currentBrokerageCut = Math.round(gci * 0.30);
    } else if (candidate.currentEstimatedSplit.includes('75/25')) {
      currentBrokerageCut = Math.min(Math.round(gci * 0.25), 22000);
    } else if (candidate.currentEstimatedSplit.includes('80/20')) {
      currentBrokerageCut = Math.min(Math.round(gci * 0.20), 28000);
    } else {
      currentBrokerageCut = Math.round(gci * 0.25);
    }

    // Add franchise royalty fee if applicable
    const franchiseFee = candidate.currentEstimatedSplit.includes('6% Franchise') ? Math.round(gci * 0.06) : 0;
    const currentTotalDeductions = currentBrokerageCut + franchiseFee + candidate.currentEstimatedAnnualDeskFees + candidate.currentEstimatedOutofPocketMarketing;
    const currentBrokerageTakeHome = gci - currentTotalDeductions;

    // Nest Realty Calculation: Fair split cap ($18,000 max) + $0 desk fees + $0 out-of-pocket marketing (in-house VA & Maxa covered)
    const nestBrokerageCap = 18000;
    const nestTotalDeductions = nestBrokerageCap;
    const nestRealtyTakeHome = gci - nestTotalDeductions;

    const annualTakeHomeIncrease = nestRealtyTakeHome - currentBrokerageTakeHome;
    const marketingSavingsWithNestVA = candidate.currentEstimatedOutofPocketMarketing;
    const totalAnnualFinancialGain = annualTakeHomeIncrease;

    return {
      candidate,
      grossCommissionIncome: gci,
      currentBrokerageTakeHome,
      nestRealtyTakeHome,
      annualTakeHomeIncrease,
      marketingSavingsWithNestVA,
      totalAnnualFinancialGain,
      keyDifferentiators: [
        `Save $${marketingSavingsWithNestVA.toLocaleString()}/yr on out-of-pocket marketing with dedicated in-house VA (Eduardo) & Maxa Design Studio`,
        `Zero franchise fees (Keep $${(franchiseFee || 8500).toLocaleString()}+ in your pocket every year)`,
        `Turnkey Coastal Sign Post Co. yard sign installations & Supra lockbox fleet managed for you`,
        `Autonomous 84% Playwright NC Form 2-T Contract Auto-Drafter (Save 8+ hours per transaction)`
      ]
    };
  }

  /**
   * Generates a tailored Nora recruiting outreach letter / pitch script
   */
  public static generateRecruitingPitch(candidateId: string): {
    candidate: CompetitorAgentCandidate;
    subjectLine: string;
    emailBody: string;
    phoneScript: string;
    financialGainSummary: string;
  } | null {
    const analysis = this.calculateRecruitingSavings(candidateId);
    if (!analysis) return null;

    const c = analysis.candidate;
    const gainFormatted = `$${analysis.totalAnnualFinancialGain.toLocaleString()}`;

    const subjectLine = `Confidential note from Ryan Crecelius — Scaling your luxury business at Nest`;
    
    const emailBody = `Hi ${c.name.split(' ')[0]},\n\n` +
      `I've been following your impressive luxury sales in ${c.primarySubmarket} this past year ($${(c.annualClosedVolume / 1000000).toFixed(1)}M across ${c.closedSides12Mo} transactions is exceptional).\n\n` +
      `At Nest Realty Wilmington, we've built a model specifically designed so high-producing luxury brokers never have to spend weekend hours creating flyers, chasing sign post vendors, or paying 6% franchise royalties.\n\n` +
      `Based on your current production, moving to Nest's platform would put an estimated ${gainFormatted} more directly in your pocket every single year:\n` +
      `• $0 Desk & Franchise Fees (Save ~$${(analysis.grossCommissionIncome * 0.06).toLocaleString()} on franchise cuts)\n` +
      `• Free In-House VA & Maxa Studio: Full 4-asset marketing packages produced within 4 hours\n` +
      `• Turnkey Sign Post & Lockbox Logistics: Dispatched automatically in 1 click\n` +
      `• Nora Autonomous 80% NC Contract Auto-Drafter: Instant Form 2-T offers cross-validated with New Hanover GIS\n\n` +
      `I'd love to treat you to coffee at Drift in Autumn Hall this week for a casual, completely confidential chat about how we can support your business.\n\n` +
      `Best regards,\n` +
      `Ryan Crecelius\n` +
      `Principal Broker & Owner | Nest Realty Wilmington\n` +
      `(910) 555-0100`;

    const phoneScript = `Hey ${c.name.split(' ')[0]}, this is Ryan Crecelius from Nest Realty. Hope you're having a great week! ` +
      `I wanted to reach out personally because I've seen your incredible work in ${c.primarySubmarket} this year. ` +
      `We recently launched our in-house luxury marketing studio and autonomous contract drafter, and with your $${(c.annualClosedVolume / 1000000).toFixed(1)}M volume, ` +
      `our model would save you over ${gainFormatted} a year while handling all your collateral and vendor dispatch. ` +
      `Are you open to grabbing a quick, confidential coffee at Drift in Autumn Hall next Tuesday?`;

    return {
      candidate: c,
      subjectLine,
      emailBody,
      phoneScript,
      financialGainSummary: gainFormatted
    };
  }

  /**
   * Updates candidate status in recruiting pipeline
   */
  public static updateCandidateStatus(
    candidateId: string, 
    status: CompetitorAgentCandidate['pipelineStatus'],
    note?: string
  ): CompetitorAgentCandidate | null {
    const candidate = this.getCandidateById(candidateId);
    if (!candidate) return null;

    candidate.pipelineStatus = status;
    candidate.lastContactDate = new Date().toISOString().split('T')[0];
    if (note) {
      candidate.notes = candidate.notes || [];
      candidate.notes.unshift(`[${candidate.lastContactDate}] ${note}`);
    }
    return candidate;
  }
}
