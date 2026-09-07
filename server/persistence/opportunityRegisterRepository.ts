/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * opportunityRegisterRepository.ts
 * Persistence repository for the 8 extended Opportunity Register features:
 * - [25] Agent Happiness Monitor & Distress Radar
 * - [22] Agent Birthday & Life Event CRM
 * - [7] Agent Help Video Library
 * - [18] Friends of Nest VIP Relationship Engine
 * - [14] Event Follow-Up Engine & [21] Event Planning Playbook
 * - [15] Cost Leakage Alerts Auditor
 * - [13] Geographic Lead Routing Dispatch Matrix
 */

export interface AgentHappinessSignal {
  agentId: string;
  agentName: string;
  office: string;
  riskTier: 'high_distress' | 'moderate_friction' | 'healthy';
  distressScore: number; // 0 - 100 (higher = more distress)
  stalledDealsCount: number;
  daysSinceLastActivity: number;
  complianceEscalationCount: number;
  recentSentiment: string;
  primaryRiskFactor: string;
  recommendedAction: string;
  lastLeadershipOutreachAt?: string;
  outreachNotes?: string[];
}

export interface AgentLifeEvent {
  id: string;
  agentId: string;
  agentName: string;
  eventType: 'birthday' | 'work_anniversary' | 'production_milestone' | 'closing_record';
  eventDate: string; // MM-DD or YYYY-MM-DD
  title: string;
  description: string;
  status: 'upcoming' | 'sent' | 'scheduled';
  giftCardType?: string;
  personalizedMessage?: string;
  sentAt?: string;
}

export interface AgentHelpVideo {
  id: string;
  title: string;
  category: 'dotloop_compliance' | 'supra_lockbox' | 'mls_entry' | 'cda_commission' | 'nora_voice';
  durationMinutes: number;
  instructorName: string;
  videoUrl: string;
  thumbnailUrl: string;
  description: string;
  viewsCount: number;
  tags: string[];
}

export interface FriendsOfNestVip {
  id: string;
  clientName: string;
  advocateTier: 'platinum_referral' | 'gold_advocate' | 'silver_client';
  referringAgent: string;
  propertyAddress: string;
  closingDate: string;
  homeAnniversaryDate: string;
  totalReferralsProvided: number;
  lastTouchDate: string;
  nextTouchScheduledAt: string;
  nextTouchType: 'anniversary_gift' | 'quarterly_local_touch' | 'tax_assessment_review' | 'holiday_pie';
  localPartnerGift: string; // e.g. "Boombalatti's Ice Cream $25"
  notes: string;
}

export interface EventPlaybook {
  id: string;
  title: string;
  eventType: 'client_appreciation' | 'waterfront_gala' | 'broker_open' | 'community_seminar';
  scheduledDate: string;
  location: string;
  targetBudget: number;
  actualSpend: number;
  status: 'planning' | 'invitations_sent' | 'completed';
  rsvpCount: number;
  checkedInCount: number;
  vendorChecklist: Array<{ item: string; vendor: string; cost: number; status: 'confirmed' | 'pending' }>;
  postEventFollowUp: {
    blitzDispatched: boolean;
    smsSentCount: number;
    testimonialsCollectedCount: number;
    googleReviewsGeneratedCount: number;
    averageRating: number;
  };
}

export interface CostLeakageAlert {
  id: string;
  category: 'vendor_order' | 'subscription_creep' | 'uncollected_fee' | 'sign_penalty';
  title: string;
  vendorOrService: string;
  propertyAddress?: string;
  amount: number;
  frequency: 'one_time' | 'monthly_recurring';
  riskLevel: 'high' | 'medium' | 'low';
  detectedAt: string;
  status: 'active_leakage' | 'investigating' | 'resolved_refunded';
  rootCause: string;
  resolutionNote?: string;
}

export interface LeadRoutingTerritory {
  submarketId: string;
  submarketName: string;
  county: string;
  leadType: 'buyer' | 'seller' | 'luxury_waterfront';
  activeAgentsOnDuty: Array<{ agentId: string; agentName: string; office: string; isAvailable: boolean; leadsAssignedMonth: number }>;
  rotationMode: 'round_robin' | 'performance_weighted' | 'bic_discretionary';
  lastDispatchedAgentName: string;
  monthlyLeadsRoutedCount: number;
}

// In-Memory Seed Storage
const initialHappinessSignals: AgentHappinessSignal[] = [
  {
    agentId: 'usr_sarah',
    agentName: 'Sarah Jenkins',
    office: 'Mayfaire Central',
    riskTier: 'high_distress',
    distressScore: 88,
    stalledDealsCount: 3,
    daysSinceLastActivity: 12,
    complianceEscalationCount: 2,
    recentSentiment: 'Expressed high frustration after losing 2 multiple-offer bids on Wrightsville Beach properties.',
    primaryRiskFactor: 'Consecutive multiple-offer losses & delayed listing paperwork.',
    recommendedAction: 'Schedule 1-on-1 Coffee with Jessica Keenan (BIC) & review escalation offer strategy.'
  },
  {
    agentId: 'usr_marcus',
    agentName: 'Marcus Vance',
    office: 'Carolina Beach',
    riskTier: 'moderate_friction',
    distressScore: 54,
    stalledDealsCount: 1,
    daysSinceLastActivity: 38,
    complianceEscalationCount: 1,
    recentSentiment: 'Seeking assistance with coastal septic permitting rules on Pleasure Island.',
    primaryRiskFactor: '38 days without active listing upload.',
    recommendedAction: 'Connect with Eric Knight (BIC) for local county soil perk consulting.'
  },
  {
    agentId: 'usr_melissa',
    agentName: 'Melissa Gagliardi',
    office: 'All Offices',
    riskTier: 'healthy',
    distressScore: 12,
    stalledDealsCount: 0,
    daysSinceLastActivity: 1,
    complianceEscalationCount: 0,
    recentSentiment: 'Positive workflow momentum; high TC throughput across 14 weekly files.',
    primaryRiskFactor: 'None. Operating at peak efficiency.',
    recommendedAction: 'Recognize weekly high-performance volume.'
  }
];

const initialLifeEvents: AgentLifeEvent[] = [
  {
    id: 'evt_sarah_anniv',
    agentId: 'usr_sarah',
    agentName: 'Sarah Jenkins',
    eventType: 'work_anniversary',
    eventDate: '2026-08-20',
    title: '4th Year Nest Work Anniversary',
    description: 'Celebrating 4 incredible years with Nest Realty Wilmington!',
    status: 'upcoming',
    giftCardType: 'Port City Java $50 Card',
    personalizedMessage: 'Happy 4th Nest Anniversary Sarah! Thank you for being such an essential pillar of our team.'
  },
  {
    id: 'evt_marcus_bday',
    agentId: 'usr_marcus',
    agentName: 'Marcus Vance',
    eventType: 'birthday',
    eventDate: '2026-08-25',
    title: 'Agent Birthday',
    description: 'Marcus Vance turns another year sharper!',
    status: 'upcoming',
    giftCardType: "Boombalatti's Artisan Ice Cream $25",
    personalizedMessage: 'Happy Birthday Marcus! Hope you have an awesome celebration on the island!'
  },
  {
    id: 'evt_matt_milestone',
    agentId: 'usr_matt',
    agentName: 'Matt Orr',
    eventType: 'production_milestone',
    eventDate: '2026-08-14',
    title: '$15M Production Milestone Reached',
    description: 'Surpassed $15M in year-to-date closed volume!',
    status: 'sent',
    sentAt: '2026-08-14T15:00:00Z',
    giftCardType: 'Ruth\'s Chris Steak House $100',
    personalizedMessage: 'Incredible milestone Matt! Congratulations on crossing $15M YTD.'
  }
];

const initialHelpVideos: AgentHelpVideo[] = [
  {
    id: 'vid_dotloop_01',
    title: '5-Minute Form 2-T Offer Verification & Loop Compliance',
    category: 'dotloop_compliance',
    durationMinutes: 4.8,
    instructorName: 'Jessica Keenan (BIC)',
    videoUrl: 'https://loom.com/share/nest-form2t-compliance',
    thumbnailUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
    description: 'Step-by-step walkthrough of NC REALTORS® Form 2-T signature initials and earnest money escrow attachment.',
    viewsCount: 142,
    tags: ['dotloop', 'form 2-t', 'compliance', 'emd']
  },
  {
    id: 'vid_supra_02',
    title: 'Supra eKEY Bluetooth Pairing & Shackle Release Code Retrieval',
    category: 'supra_lockbox',
    durationMinutes: 3.2,
    instructorName: 'Eric Knight (BIC)',
    videoUrl: 'https://loom.com/share/nest-supra-ekey-pairing',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80',
    description: 'How to retrieve 4-digit shackle codes from the Nest Ops portal and assign boxes in the field.',
    viewsCount: 98,
    tags: ['supra', 'lockbox', 'shackle', 'ekey']
  },
  {
    id: 'vid_cda_03',
    title: 'Drafting Commission Disbursement Authorizations (CDA)',
    category: 'cda_commission',
    durationMinutes: 5.5,
    instructorName: 'James Fort (Accounting)',
    videoUrl: 'https://loom.com/share/nest-cda-ledger-drafting',
    thumbnailUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    description: 'Understanding brokerage splits, TC fee line items, and electronic BIC approval workflows.',
    viewsCount: 215,
    tags: ['cda', 'commission', 'splits', 'payout']
  }
];

const initialVips: FriendsOfNestVip[] = [
  {
    id: 'vip_harrison',
    clientName: 'Dr. David & Elena Harrison',
    advocateTier: 'platinum_referral',
    referringAgent: 'Sarah Jenkins',
    propertyAddress: '142 Market St, Wilmington NC',
    closingDate: '2025-08-15',
    homeAnniversaryDate: '2026-08-15',
    totalReferralsProvided: 4,
    lastTouchDate: '2026-05-10',
    nextTouchScheduledAt: '2026-08-15',
    nextTouchType: 'anniversary_gift',
    localPartnerGift: "PinPoint Restaurant $100 Experience Card",
    notes: 'Referred 2 hospital physician colleagues who purchased in Landfall.'
  },
  {
    id: 'vip_miller',
    clientName: 'Capt. Thomas Miller',
    advocateTier: 'gold_advocate',
    referringAgent: 'Marcus Vance',
    propertyAddress: '804 Carolina Beach Ave N',
    closingDate: '2024-09-01',
    homeAnniversaryDate: '2026-09-01',
    totalReferralsProvided: 2,
    lastTouchDate: '2026-06-01',
    nextTouchScheduledAt: '2026-09-01',
    nextTouchType: 'quarterly_local_touch',
    localPartnerGift: "Boombalatti's Ice Cream $25",
    notes: 'Avid boater on Pleasure Island; highly influential in local marina community.'
  }
];

const initialPlaybooks: EventPlaybook[] = [
  {
    id: 'evt_playbook_gala2026',
    title: 'Annual Summer Client Appreciation Sunset Cruise',
    eventType: 'client_appreciation',
    scheduledDate: '2026-09-12',
    location: 'Cape Fear Riverboats Dock, Downtown Wilmington',
    targetBudget: 4500,
    actualSpend: 3850,
    status: 'planning',
    rsvpCount: 84,
    checkedInCount: 0,
    vendorChecklist: [
      { item: 'Riverboat Charter 3h', vendor: 'Cape Fear Riverboats Inc', cost: 2400, status: 'confirmed' },
      { item: 'Coastal Oyster & Seafood Catering', vendor: 'Pine Valley Market', cost: 1200, status: 'confirmed' },
      { item: 'Live Acoustic Duo', vendor: 'Wilmington Sound Co', cost: 450, status: 'pending' }
    ],
    postEventFollowUp: {
      blitzDispatched: false,
      smsSentCount: 0,
      testimonialsCollectedCount: 0,
      googleReviewsGeneratedCount: 0,
      averageRating: 5.0
    }
  },
  {
    id: 'evt_playbook_waterfront_open',
    title: 'Figure Eight Island Luxury Waterfront Open House',
    eventType: 'waterfront_gala',
    scheduledDate: '2026-08-22',
    location: '518 Chestnut St Waterfront Annex',
    targetBudget: 1200,
    actualSpend: 950,
    status: 'invitations_sent',
    rsvpCount: 38,
    checkedInCount: 0,
    vendorChecklist: [
      { item: 'Wine & Charcuterie Board', vendor: 'Temptations Gourmet', cost: 650, status: 'confirmed' },
      { item: 'Valet Parking Attendant', vendor: 'Port City Valet', cost: 300, status: 'confirmed' }
    ],
    postEventFollowUp: {
      blitzDispatched: false,
      smsSentCount: 0,
      testimonialsCollectedCount: 0,
      googleReviewsGeneratedCount: 0,
      averageRating: 5.0
    }
  }
];

const initialCostLeakages: CostLeakageAlert[] = [
  {
    id: 'leak_001',
    category: 'sign_penalty',
    title: 'Overdue Post Retrieval Extended Rental Surcharge',
    vendorOrService: 'Coastal Sign Post Co.',
    propertyAddress: '312 Red Cross St, Wilmington NC',
    amount: 15.00,
    frequency: 'monthly_recurring',
    riskLevel: 'medium',
    detectedAt: '2026-08-10',
    status: 'active_leakage',
    rootCause: 'Property closed on 07/28 but post removal was not scheduled within 48h window.'
  },
  {
    id: 'leak_002',
    category: 'vendor_order',
    title: 'Duplicate Floor Plan Add-on Invoice Detected',
    vendorOrService: 'Cape Fear Media (HDR)',
    propertyAddress: '142 Market St, Wilmington NC',
    amount: 75.00,
    frequency: 'one_time',
    riskLevel: 'high',
    detectedAt: '2026-08-14',
    status: 'active_leakage',
    rootCause: 'Photographer billed $75 2D Floor Plan separately despite being bundled in Pro Plus Tier ($275).'
  },
  {
    id: 'leak_003',
    category: 'uncollected_fee',
    title: 'Uncollected Admin Tech Split on Non-Resident Broker',
    vendorOrService: 'Transaction Ledger #4029',
    propertyAddress: '804 Carolina Beach Ave N',
    amount: 195.00,
    frequency: 'one_time',
    riskLevel: 'high',
    detectedAt: '2026-08-12',
    status: 'active_leakage',
    rootCause: 'Outside co-op broker form omitted standard $195 brokerage admin archival fee.'
  }
];

const initialTerritories: LeadRoutingTerritory[] = [
  {
    submarketId: 'terr_mayfaire',
    submarketName: 'Mayfaire / Landfall / Wrightsville Sound',
    county: 'New Hanover',
    leadType: 'luxury_waterfront',
    activeAgentsOnDuty: [
      { agentId: 'usr_sarah', agentName: 'Sarah Jenkins', office: 'Mayfaire Central', isAvailable: true, leadsAssignedMonth: 4 },
      { agentId: 'usr_matt', agentName: 'Matt Orr', office: 'Mayfaire Central', isAvailable: true, leadsAssignedMonth: 6 }
    ],
    rotationMode: 'round_robin',
    lastDispatchedAgentName: 'Sarah Jenkins',
    monthlyLeadsRoutedCount: 10
  },
  {
    submarketId: 'terr_pleasure_island',
    submarketName: 'Carolina Beach / Kure Beach / Pleasure Island',
    county: 'New Hanover',
    leadType: 'buyer',
    activeAgentsOnDuty: [
      { agentId: 'usr_marcus', agentName: 'Marcus Vance', office: 'Carolina Beach', isAvailable: true, leadsAssignedMonth: 3 },
      { agentId: 'usr_eric', agentName: 'Eric Knight (BIC)', office: 'Carolina Beach', isAvailable: true, leadsAssignedMonth: 2 }
    ],
    rotationMode: 'round_robin',
    lastDispatchedAgentName: 'Marcus Vance',
    monthlyLeadsRoutedCount: 5
  },
  {
    submarketId: 'terr_downtown',
    submarketName: 'Downtown Historic District / Midtown',
    county: 'New Hanover',
    leadType: 'seller',
    activeAgentsOnDuty: [
      { agentId: 'usr_melissa', agentName: 'Melissa Gagliardi', office: 'All Offices', isAvailable: true, leadsAssignedMonth: 7 }
    ],
    rotationMode: 'round_robin',
    lastDispatchedAgentName: 'Melissa Gagliardi',
    monthlyLeadsRoutedCount: 7
  }
];

export const opportunityRegisterRepository = {
  // 1. Agent Happiness
  async listHappinessSignals(): Promise<AgentHappinessSignal[]> {
    return [...initialHappinessSignals];
  },

  async recordLeadershipOutreach(agentId: string, performedBy: string, note: string) {
    const item = initialHappinessSignals.find(s => s.agentId === agentId);
    if (item) {
      item.lastLeadershipOutreachAt = new Date().toISOString();
      if (!item.outreachNotes) item.outreachNotes = [];
      item.outreachNotes.push(`[${new Date().toISOString().slice(0, 10)}] ${performedBy}: ${note}`);
      if (item.riskTier === 'high_distress') {
        item.riskTier = 'moderate_friction';
        item.distressScore = Math.max(30, item.distressScore - 30);
      }
    }
    return item;
  },

  // 2. Life Events
  async listLifeEvents(): Promise<AgentLifeEvent[]> {
    return [...initialLifeEvents];
  },

  async sendLifeEventTouch(eventId: string, senderName: string) {
    const event = initialLifeEvents.find(e => e.id === eventId);
    if (event) {
      event.status = 'sent';
      event.sentAt = new Date().toISOString();
    }
    return event;
  },

  // 3. Videos
  async listHelpVideos(): Promise<AgentHelpVideo[]> {
    return [...initialHelpVideos];
  },

  // 4. Friends of Nest
  async listVips(): Promise<FriendsOfNestVip[]> {
    return [...initialVips];
  },

  async scheduleVipTouch(vipId: string, touchType: any, giftItem: string) {
    const vip = initialVips.find(v => v.id === vipId);
    if (vip) {
      vip.lastTouchDate = new Date().toISOString().slice(0, 10);
      vip.nextTouchType = touchType;
      vip.localPartnerGift = giftItem;
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 3);
      vip.nextTouchScheduledAt = nextMonth.toISOString().slice(0, 10);
    }
    return vip;
  },

  // 5. Events Playbook & Follow-Up
  async listEventPlaybooks(): Promise<EventPlaybook[]> {
    return [...initialPlaybooks];
  },

  async triggerEventFollowUpBlitz(playbookId: string) {
    const pb = initialPlaybooks.find(p => p.id === playbookId);
    if (pb) {
      pb.status = 'completed';
      pb.postEventFollowUp = {
        blitzDispatched: true,
        smsSentCount: pb.rsvpCount || 42,
        testimonialsCollectedCount: Math.round((pb.rsvpCount || 42) * 0.45),
        googleReviewsGeneratedCount: Math.round((pb.rsvpCount || 42) * 0.28),
        averageRating: 4.95
      };
    }
    return pb;
  },

  // 6. Cost Leakage
  async listCostLeakages(): Promise<CostLeakageAlert[]> {
    return [...initialCostLeakages];
  },

  async resolveCostLeakage(leakageId: string, resolutionNote: string) {
    const alert = initialCostLeakages.find(l => l.id === leakageId);
    if (alert) {
      alert.status = 'resolved_refunded';
      alert.resolutionNote = resolutionNote || 'Disputed with vendor and refund credited to brokerage ledger.';
    }
    return alert;
  },

  // 7. Lead Routing Matrix
  async listTerritories(): Promise<LeadRoutingTerritory[]> {
    return [...initialTerritories];
  },

  async updateAgentDuty(submarketId: string, agentId: string, isAvailable: boolean) {
    const terr = initialTerritories.find(t => t.submarketId === submarketId);
    if (terr) {
      const ag = terr.activeAgentsOnDuty.find(a => a.agentId === agentId);
      if (ag) {
        ag.isAvailable = isAvailable;
      }
    }
    return terr;
  }
};
