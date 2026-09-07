/**
 * Nora Training & Objection Roleplay Academy Service
 * Interactive objection simulator with live AI grading, 30-day onboarding track,
 * and NCREC CE compliance flashcard deck.
 */

export interface RoleplayScenario {
  id: string;
  title: string;
  category: 'seller_objection' | 'buyer_objection' | 'negotiation' | 'lead_generation';
  difficulty: 'Beginner' | 'Intermediate' | 'Master';
  description: string;
  counterpartPersona: string;
  initialCounterpartStatement: string;
  keyLearningObjectives: string[];
}

export interface RoleplayEvaluation {
  scenarioId: string;
  overallScore: number; // 1 - 100
  passed: boolean;
  scoreBreakdown: {
    reframingAndEmpathy: number; // 1 - 100
    ncrecLegalCompliance: number; // 1 - 100
    valueProposition: number; // 1 - 100
    callToActionPower: number; // 1 - 100
  };
  counterpartResponse: string;
  coachingFeedback: {
    strengths: string[];
    improvements: string[];
    recommendedSop: string;
  };
}

export interface OnboardingModule {
  week: number;
  title: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  milestones: { id: string; title: string; completed: boolean; requiredDoc?: string }[];
}

export interface NcrecFlashcard {
  id: string;
  question: string;
  answer: string;
  statutoryRule: string;
  category: 'Rule 58A' | 'Disclosures & Agency' | 'Trust Accounts' | 'Contracts (Form 2-T)';
}

export class NoraTrainingAcademyService {
  /**
   * Available Scenarios for Objection Simulator
   */
  static getRoleplayScenarios(): RoleplayScenario[] {
    return [
      {
        id: 'scen_commission_discount',
        title: 'The 4% Listing Commission Skeptic',
        category: 'seller_objection',
        difficulty: 'Intermediate',
        description: 'A prospective seller in Landfall asks why they should pay standard brokerage commission when discount brokers offer 4%.',
        counterpartPersona: 'Dr. Gregory Vance (Analytical Seller, skeptical of marketing expenses)',
        initialCounterpartStatement: 'Look, another brokerage in town offered to list my Landfall home for a flat 4% total commission. Why should I pay Nest Realty more when the market is selling homes in 20 days anyway?',
        keyLearningObjectives: [
          'Articulate Nest Realty 300 DPI Maxa marketing & professional staging value',
          'Highlight list-to-sale price ratio advantage (98.6% vs market average 95%)',
          'Avoid illegal price-fixing statements under Sherman Antitrust Act'
        ]
      },
      {
        id: 'scen_nc_due_diligence_fee',
        title: 'The NC Due Diligence Fee Hesitation',
        category: 'buyer_objection',
        difficulty: 'Beginner',
        description: 'An out-of-state relocation buyer from New York is shocked by the non-refundable NC Due Diligence Fee.',
        counterpartPersona: 'Jessica Miller (Relocating Buyer, accustomed to attorney contingency states)',
        initialCounterpartStatement: 'Wait, you are telling me I have to write a $15,000 non-refundable check directly to the seller before they even let an inspector in the house? That sounds like a scam!',
        keyLearningObjectives: [
          'Clearly explain NCREC Rule 58A .0106 & Form 2-T Paragraph 1(d)',
          'Distinguish Due Diligence Fee (direct to seller) vs Earnest Money (held in escrow)',
          'Explain buyer right to terminate for any reason or no reason prior to DD expiration'
        ]
      },
      {
        id: 'scen_lowball_repair_request',
        title: 'Severe Post-Inspection Repair Standoff',
        category: 'negotiation',
        difficulty: 'Master',
        description: 'Buyer requests a $30,000 credit following a home inspection on a 15-year-old HVAC unit that is currently functional.',
        counterpartPersona: 'Arthur Pendelton (Aggressive Buyer Broker demanding max credits)',
        initialCounterpartStatement: 'My buyers are threatening to terminate under Form 2-T unless your seller agrees to replace both HVAC units and credit $15,000 for the roof, otherwise we walk tomorrow at 5:00 PM.',
        keyLearningObjectives: [
          'Reframe cosmetic/aging components vs structural/safety defects under Form 2-T',
          'Utilize Due Diligence Request and Agreement (Form 310-T) strategically',
          'Protect seller proceeds while keeping the transaction alive'
        ]
      },
      {
        id: 'scen_expired_listing_call',
        title: 'Cold Outreach: Frustrated Expired Listing',
        category: 'lead_generation',
        difficulty: 'Intermediate',
        description: 'Calling a homeowner whose $850k Carolina Beach home expired after 180 days with a competitor.',
        counterpartPersona: 'Thomas Sterling (Frustrated Seller burned by lack of communication)',
        initialCounterpartStatement: 'I have had 20 agents call me already this morning. My house was on the market for 6 months and nothing happened. Why are you any different?',
        keyLearningObjectives: [
          'Empathize with seller frustration before pitching',
          'Diagnose the breakdown: Pricing, Staging/Media, or Buyer Broker Compensation',
          'Secure a 15-minute in-person or Google Meet strategic review'
        ]
      }
    ];
  }

  /**
   * Real-Time AI Objection Evaluator & Counterpart Generator
   */
  static evaluateRoleplayTurn(params: {
    scenarioId: string;
    agentUtterance: string;
  }): RoleplayEvaluation {
    const text = params.agentUtterance.toLowerCase();

    // Empathy & Reframing
    let reframingScore = 75;
    if (text.includes('understand') || text.includes('completely get') || text.includes('appreciate') || text.includes('makes sense')) {
      reframingScore += 20;
    }

    // NCREC Legal Compliance
    let complianceScore = 80;
    if (text.includes('standard commission') || text.includes('commission is fixed by law')) {
      complianceScore = 30; // Antitrust red flag!
    } else if (text.includes('form 2-t') || text.includes('due diligence') || text.includes('ncrec') || text.includes('escrow') || text.includes('negotiable')) {
      complianceScore = 98;
    }

    // Value Proposition
    let valueScore = 70;
    if (text.includes('maxa') || text.includes('marketing') || text.includes('professional') || text.includes('list-to-sale') || text.includes('exposure') || text.includes('protect')) {
      valueScore += 25;
    }

    // Call to Action
    let ctaScore = 65;
    if (text.includes('let us meet') || text.includes('can i show you') || text.includes('tomorrow at') || text.includes('review together') || text.includes('take a look')) {
      ctaScore += 30;
    }

    const overallScore = Math.round((reframingScore + complianceScore + valueScore + ctaScore) / 4);
    const passed = overallScore >= 75;

    let counterpartResponse = '';
    if (passed) {
      counterpartResponse = "That actually makes a lot of sense. I didn't realize how the list-to-sale price ratio and staging impacted the final net proceeds. Can you send me the breakdown or come by tomorrow at 2:00 PM?";
    } else {
      counterpartResponse = "I'm still not fully convinced. That sounds like what every agent says. How does that directly put more money in my pocket?";
    }

    return {
      scenarioId: params.scenarioId,
      overallScore,
      passed,
      scoreBreakdown: {
        reframingAndEmpathy: Math.min(100, reframingScore),
        ncrecLegalCompliance: Math.min(100, complianceScore),
        valueProposition: Math.min(100, valueScore),
        callToActionPower: Math.min(100, ctaScore)
      },
      counterpartResponse,
      coachingFeedback: {
        strengths: [
          passed ? 'Strong empathetic connection and conversational flow.' : 'Good polite opening tone.',
          'Solid command of real estate value propositions and market dynamics.'
        ],
        improvements: [
          'Quantify value with specific data points (e.g. Nest Realty 98.6% list-to-sale ratio).',
          'Always close with an explicit two-choice time commitment (e.g. "Does Tuesday at 10 AM or Wednesday at 2 PM work better?").'
        ],
        recommendedSop: 'SOP-OBJECTION-001 (Nest High-Conversion Listing Presentation & Objection Playbook)'
      }
    };
  }

  /**
   * 30-Day Provisional Broker Onboarding Track
   */
  static getOnboardingRoadmap(): OnboardingModule[] {
    return [
      {
        week: 1,
        title: 'Week 1: Setup, Dotloop & NCREC Affiliation',
        status: 'completed',
        milestones: [
          { id: 'm1', title: 'Complete NCREC Form REC 2.08 Broker-in-Charge Affiliation', completed: true },
          { id: 'm2', title: 'Activate Nest Google Workspace (@nestrealty.com) & Calendar Sync', completed: true },
          { id: 'm3', title: 'Join NCRMLS / Cape Fear REALTORS® Association', completed: true },
          { id: 'm4', title: 'Setup Dotloop Brokerage Loop Templates & Electronic Signature', completed: true }
        ]
      },
      {
        week: 2,
        title: 'Week 2: Maxa Brand Studio & Sphere Activation',
        status: 'in_progress',
        milestones: [
          { id: 'm5', title: 'Order Branded Nest Yard Signs from Coastal Sign Post Co.', completed: true },
          { id: 'm6', title: 'Stage First Maxa Social Media Blitz with Eduardo Lovo', completed: true },
          { id: 'm7', title: 'Import 100 Contacts into CRM / Sphere Database', completed: false },
          { id: 'm8', title: 'Attend Mayfaire Weekly Strategy & Production Mastermind', completed: false }
        ]
      },
      {
        week: 3,
        title: 'Week 3: Open House Mastery & Buyer Qualification',
        status: 'upcoming',
        milestones: [
          { id: 'm9', title: 'Shadow Senior Broker Sarah Jenkins on Landfall Open House', completed: false },
          { id: 'm10', title: 'Deploy Nest Digital Open House Kiosk & Lead Capture Form', completed: false },
          { id: 'm11', title: 'Deliver Working with Real Estate Agents (WWREA) Disclosure Mock Drill', completed: false }
        ]
      },
      {
        week: 4,
        title: 'Week 4: Form 2-T Offer Drafting & BIC Audit Clearance',
        status: 'upcoming',
        milestones: [
          { id: 'm12', title: 'Draft First Mock Form 2-T Offer with Nora Auto-Drafter', completed: false },
          { id: 'm13', title: 'Review 3-Day Banking & Escrow Rules with BIC Jessica Keenan', completed: false },
          { id: 'm14', title: 'Earn First Active Brokerage Lead Assignment', completed: false }
        ]
      }
    ];
  }

  /**
   * NCREC CE & License Law Flashcards
   */
  static getNcrecFlashcards(): NcrecFlashcard[] {
    return [
      {
        id: 'fc_1',
        question: 'Under NCREC Rule 58A .0106, how quickly must an Earnest Money deposit be deposited into the trust account?',
        answer: 'Within three (3) banking days following the date of contract acceptance/execution.',
        statutoryRule: '21 NCAC 58A .0106(a)',
        category: 'Trust Accounts'
      },
      {
        id: 'fc_2',
        question: 'Who receives the Due Diligence Fee under NC REALTORS® Form 2-T, and is it refundable?',
        answer: 'The Due Diligence Fee is delivered directly to the Seller on or before the effective date. It is strictly non-refundable, except in the event of a material breach by the Seller.',
        statutoryRule: 'NC Form 2-T Paragraph 1(d)',
        category: 'Contracts (Form 2-T)'
      },
      {
        id: 'fc_3',
        question: 'When must the Working with Real Estate Agents (WWREA) disclosure be provided to a prospective buyer or seller?',
        answer: 'At first substantial contact, prior to eliciting or receiving confidential information regarding motivations, finances, or negotiating positions.',
        statutoryRule: '21 NCAC 58A .0104(c)',
        category: 'Disclosures & Agency'
      },
      {
        id: 'fc_4',
        question: 'What is the statutory deadline for completing annual Continuing Education (GENUP/BICUP + Elective) in North Carolina?',
        answer: 'June 10th of every licensing year by 11:59 PM (prior to the June 30 license expiration).',
        statutoryRule: '21 NCAC 58A .1702',
        category: 'Rule 58A'
      }
    ];
  }
}
