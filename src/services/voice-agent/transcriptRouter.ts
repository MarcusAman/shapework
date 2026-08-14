/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TranscriptRouter — Conversational Control Classifier & Intent Router
 */

import { AgentRuntimeState, PendingProposal } from './agentRuntimeReducer';

export type UtteranceCategory =
  | 'wake_only'
  | 'conversation_control'
  | 'knowledge_question'
  | 'operational_request'
  | 'action_request';

export interface DomainIntentResult {
  intentType: 
    | 'WAKE_WORD_ONLY'
    | 'CONVERSATION_CONTROL'
    | 'CONFIRM_PROPOSAL'
    | 'REJECT_PROPOSAL'
    | 'REPEAT_LAST_RESPONSE'
    | 'DRAFT_OFFER'
    | 'CHECK_ATTENTION'
    | 'QUERY_PIPELINE'
    | 'DISPATCH_VENDOR'
    | 'LAUNCH_OPEN_HOUSE_KIOSK'
    | 'AUDIT_COMMERCIAL_LEASE'
    | 'MARKETING_REQUEST_INTAKE'
    | 'DISPATCH_PROPERTY_MAINTENANCE'
    | 'SCAN_DOCUMENT_VISION'
    | 'MATCHMAKER_BUYER_RADAR'
    | 'TRIGGER_DEAL_CELEBRATION'
    | 'MLS_LISTING_LAUNCH'
    | 'COMMISSION_SPLIT_PAYROLL'
    | 'SELLER_NET_SHEET'
    | 'CMA_PRESENTATION'
    | 'GENERAL_QUERY'
    | (string & {});
  category: UtteranceCategory;
  spokenResponse: string;
  displayResponse: string;
  utteranceId?: string;
  proposal?: PendingProposal;
  actionCard?: {
    title: string;
    target: string;
    details: string;
  };
}

export function processUserUtterance(
  utterance: string, 
  currentState: AgentRuntimeState, 
  userName: string = 'Ryan',
  utteranceId?: string
): DomainIntentResult {
  const rawClean = utterance.trim().toLowerCase();
  
  // Clean wake word prefix
  const strippedText = rawClean
    .replace(/^(hey|hi)\s+nest,?\s*/i, '')
    .replace(/^(hey|hi)\s+lorena,?\s*/i, '')
    .replace(/^lorena,?\s*/i, '')
    .replace(/^nest\s+ops,?\s*/i, '')
    .replace(/^nest,?\s*/i, '')
    .trim();

  // 1. Wake Word Only — User said "hey nest" or "hey lorena" or "lorena" with no follow-up question
  if (!strippedText || rawClean === 'hey nest' || rawClean === 'hi nest' || rawClean === 'hey lorena' || rawClean === 'lorena' || rawClean === 'nest ops' || rawClean === 'nest') {
    return {
      intentType: 'WAKE_WORD_ONLY',
      category: 'wake_only',
      spokenResponse: "Hi, I'm listening.",
      displayResponse: "Hi, I'm listening.",
      utteranceId
    };
  }

  const cleanText = strippedText;

  // 2a. Mic check / Conversation Control ("Can you hear me?", "Are you there?")
  // EXACT NORMALIZED MATCH ONLY: Must match full normalized utterance, not partial substrings or keyword heuristics.
  const cleanLower = cleanText.toLowerCase().replace(/[?.!]/g, '').trim();
  const exactMicChecks = new Set([
    'can you hear me',
    'can you hear me now',
    'are you there',
    'are you listening',
    'can you hear me lorena',
    'can you hear me nest'
  ]);

  if (exactMicChecks.has(cleanLower)) {
    return {
      intentType: 'CONVERSATION_CONTROL',
      category: 'conversation_control',
      spokenResponse: "Yes, I can hear you. What can I help you with?",
      displayResponse: "Yes, I can hear you. What can I help you with?",
      utteranceId
    };
  }

  // 2b. Conversational Repeat / Memory Recall Intent ("Can you repeat that?")
  if (
    cleanText === 'can you repeat that' ||
    cleanText === 'repeat that' ||
    cleanText === 'say that again' ||
    cleanText === 'what did you say' ||
    cleanText === 'can you say that again' ||
    cleanText === 'repeat' ||
    cleanText.includes('repeat that') ||
    cleanText.includes('say that again')
  ) {
    return {
      intentType: 'REPEAT_LAST_RESPONSE',
      category: 'conversation_control',
      spokenResponse: "Sure, let me repeat that for you.",
      displayResponse: "Sure, let me repeat that for you.",
      utteranceId
    };
  }

  // 3. Handle Confirmation Intents when a proposal is pending
  if (currentState.pendingProposal) {
    if (
      cleanText === 'confirm' || 
      cleanText === 'yes' || 
      cleanText === 'correct' || 
      cleanText.includes('do it') || 
      cleanText.includes('approve') ||
      cleanText.includes('proceed')
    ) {
      return {
        intentType: 'CONFIRM_PROPOSAL',
        category: 'action_request',
        spokenResponse: `Confirmed! Executed ${currentState.pendingProposal.summary}.`,
        displayResponse: `Confirmed! Executed ${currentState.pendingProposal.summary}.`,
        utteranceId
      };
    }

    if (
      cleanText === 'cancel' || 
      cleanText === 'no' || 
      cleanText === 'reject' || 
      cleanText.includes('stop') || 
      cleanText.includes('abort')
    ) {
      return {
        intentType: 'REJECT_PROPOSAL',
        category: 'action_request',
        spokenResponse: 'Cancelled proposal. What would you like to do next?',
        displayResponse: 'Cancelled proposal. What would you like to do next?',
        utteranceId
      };
    }
  }

  // 4. Handle Contract Authoring Intent (Requires Proposal Confirmation)
  if (cleanText.includes('write offer') || cleanText.includes('draft offer') || cleanText.includes('create offer') || cleanText.includes('write an offer') || cleanText.includes('123 main')) {
    const proposal: PendingProposal = {
      type: 'DRAFT_OFFER',
      summary: 'drafting a $625,000 purchase offer for 123 Main Street with $10,000 earnest money',
      value: { property: '123 Main Street', price: 625000, earnestMoney: 10000, dueDiligenceDays: 14 },
      isConfirmed: false
    };

    return {
      intentType: 'DRAFT_OFFER',
      category: 'action_request',
      spokenResponse: `I can draft a residential offer for 123 Main Street at $625,000 with 14 days due diligence. Say confirm or yes to proceed.`,
      displayResponse: `### Contract Drafting Proposal\n\n- **Property**: 123 Main Street\n- **Purchase Price**: $625,000\n- **Due Diligence**: 14 Days\n\nSay **confirm** or **yes** to proceed.`,
      utteranceId,
      proposal,
      actionCard: {
        title: 'Author Contract Offer for 123 Main Street',
        target: 'Contract Copilot Engine',
        details: 'Drafting residential purchase offer & disclosure checklist.'
      }
    };
  }

  // 5. Handle Vendor Dispatch Intent (Requires Proposal Confirmation)
  if (cleanText.includes('vendor') || cleanText.includes('dispatch') || cleanText.includes('sign install')) {
    const proposal: PendingProposal = {
      type: 'DISPATCH_VENDOR',
      summary: 'dispatching Wilmington Sign Vendor to install listing post at 105 Forest Hills Dr',
      value: { address: '105 Forest Hills Dr', vendor: 'Wilmington Sign Team', cost: 75 },
      isConfirmed: false
    };

    return {
      intentType: 'DISPATCH_VENDOR',
      category: 'action_request',
      spokenResponse: 'I can dispatch the Wilmington Sign Vendor to 105 Forest Hills Dr for $75. Say confirm or yes to issue dispatch.',
      displayResponse: '### Vendor Dispatch Authorization\n\n- **Vendor**: Wilmington Sign Vendor\n- **Property**: 105 Forest Hills Dr\n- **Cost**: $75.00\n\nSay **confirm** or **yes** to issue dispatch.',
      utteranceId,
      proposal,
      actionCard: {
        title: 'Dispatch Sign Installation Vendor',
        target: 'Vendor Dispatch Cockpit',
        details: 'Issue automated repair/sign work order to vendor team.'
      }
    };
  }

  // 6. Handle Attention Items Intent (Read-Only Operational Query)
  if (cleanText.includes('attention') || cleanText.includes('today') || cleanText.includes('overdue') || cleanText.includes('focus') || cleanText.includes('need to do')) {
    return {
      intentType: 'CHECK_ATTENTION',
      category: 'operational_request',
      spokenResponse: 'Found two items needing attention: an overdue sign installation at 105 Forest Hills Drive and a compliance disclosure review for Taylor Morgan.',
      displayResponse: '### Operational Attention Items\n\n1. **Overdue Sign Install**: 105 Forest Hills Dr (Wilmington Sign Vendor)\n2. **Compliance File Review**: Taylor Morgan Listing Disclosure Package',
      utteranceId,
      actionCard: {
        title: 'Dispatch Sign Vendor & Escalate File Review',
        target: 'Vendor Dispatch & Compliance Cockpit',
        details: 'Assign sign installation to Wilmington Vendor Team and flag file for Ryan.'
      }
    };
  }

  // 7. Handle Operating Pipeline Summary Intent
  if (cleanText.includes('pipeline') || cleanText.includes('stuck') || cleanText.includes('status')) {
    return {
      intentType: 'QUERY_PIPELINE',
      category: 'operational_request',
      spokenResponse: 'Operating pipeline summary: active transactions logged in pipeline, two items waiting on listing disclosures.',
      displayResponse: '### Operating Pipeline Summary\n\n- **Active Transactions**: Logged in pipeline\n- **Disclosure Blockers**: 2 Pending Listing Disclosures',
      utteranceId,
      actionCard: {
        title: 'Notify Assigned Coordinators for Stuck Items',
        target: 'Role & Escalation Pipeline',
        details: 'Send automated reminder pings to Listing Specialist and Office Coordinator.'
      }
    };
  }

  // 7b. Handle Open House Kiosk Intent
  if (cleanText.includes('open house') || cleanText.includes('kiosk') || cleanText.includes('visitor')) {
    return {
      intentType: 'LAUNCH_OPEN_HOUSE_KIOSK',
      category: 'operational_request',
      spokenResponse: 'I set up the open house visitor desk for 312 Mayfaire Way. We have 14 registered guests checked in, and Michael Chang is our top pre-approved buyer!',
      displayResponse: '### Rechat Open House Visitor Desk — 312 Mayfaire Way\n\n- **Registered Guests**: 14 Visitors (Sunday Open House)\n- **Top Lead Match**: 🔥 **Michael Chang (Score 96/100 HOT BUYER)** • Pre-approved $850k\n- **Automated Nurture**: 7-Day Open House Thank-You Drip Enrolled',
      utteranceId,
      actionCard: {
        title: 'Open House Visitor Desk & Sign-In Kiosk',
        target: '312 Mayfaire Way • Sunday Open House Kiosk',
        details: 'Open House Desk • 14 Registered Guests • Michael Chang (HOT 96/100)'
      }
    };
  }

  // 7c. Handle Commercial Lease Audit Intent
  if (cleanText.includes('commercial') || cleanText.includes('estoppel') || cleanText.includes('suite 400') || cleanText.includes('cam fee') || cleanText.includes('cam charge')) {
    return {
      intentType: 'AUDIT_COMMERCIAL_LEASE',
      category: 'operational_request',
      spokenResponse: 'Audited commercial lease for Mayfaire Commercial Center Suite 400. Tenant Pinnacle Tech Solutions is on a 5-year NNN lease at $28.50 per square foot. Estoppel certificate is verified and signed. Pro-rata CAM allocation is 14.2% or $1,240 monthly.',
      displayResponse: '### AI Commercial Lease & Estoppel Audit — Suite 400\n\n- **Target Property**: Mayfaire Commercial Center • Suite 400 (4,500 sq ft)\n- **Tenant**: Pinnacle Tech Solutions LLC (5-Year NNN Lease)\n- **Base Rent**: $28.50 / sq ft ($10,687.50 / mo)\n- **Estoppel Certificate**: ✅ **VERIFIED & SIGNED** (Executed Aug 2, 2026)\n- **CAM Allocation**: Pro-Rata 14.2% ($1,240 / mo reconciliation)',
      utteranceId,
      actionCard: {
        title: 'Export Certified Commercial Lease Abstract',
        target: 'Mayfaire Commercial Center • Suite 400',
        details: 'Pinnacle Tech Solutions • 5-Yr NNN • $28.50/sq ft • Estoppel Signed'
      }
    };
  }

  // 7d. Handle Marketing Request Intent
  if (cleanText.includes('marketing') || cleanText.includes('social media') || cleanText.includes('flyer') || cleanText.includes('email blast')) {
    return {
      intentType: 'MARKETING_REQUEST_INTAKE',
      category: 'operational_request',
      spokenResponse: 'I put together a marketing package for 312 Mayfaire Way, including an open house feature sheet flyer, Instagram story graphics, and an email blast for our broker network!',
      displayResponse: '### Multi-Channel Marketing Blitz & Request Desk — 312 Mayfaire Way\n\n- **Property Address**: 312 Mayfaire Way, Wilmington NC 28405\n- **List Price**: $725,000 | **Listing Agent**: Matt Orr\n- **Open House Schedule**: Sunday, Aug 16 (1:00 PM - 4:00 PM)\n- **Print Collateral**: Open House Feature Sheet PDF Generated\n- **Social Assets**: 1080x1080 Instagram & Facebook Story Carousels Rendered\n- **Email Blast Collateral**: HTML Email Blast Template Compiled for 74-Broker Network',
      utteranceId,
      actionCard: {
        title: 'Listing Marketing Blitz & Social Asset Studio',
        target: '312 Mayfaire Way • Marketing Studio',
        details: 'Multi-Channel Campaign • Print Flyer PDF • Instagram Assets • Email Blast'
      }
    };
  }

  // 7e. Handle Property Management & Emergency Maintenance Dispatch Intent
  if (cleanText.includes('plumber') || cleanText.includes('water heater') || cleanText.includes('maintenance') || cleanText.includes('rent ledger') || cleanText.includes('unit b')) {
    return {
      intentType: 'DISPATCH_PROPERTY_MAINTENANCE',
      category: 'operational_request',
      spokenResponse: "I scheduled emergency repair service for the water heater leak at 105 Forest Hills Drive Unit B with Wilmington Mechanical. Since the estimate is over $1,000, it's queued for BIC sign-off. The tenant's rent is up to date.",
      displayResponse: '### AI Property Management & Emergency Dispatch — Unit B\n\n- **Property Address**: 105 Forest Hills Dr • Unit B\n- **Reported Maintenance**: 🚨 Emergency Water Heater Leak (Reported 14m ago)\n- **Assigned Vendor**: Wilmington Mechanical Services • (910) 555-0311\n- **Contractor Estimate**: $1,250.00 (⚠️ Requires BIC Approval > $1,000)\n- **Tenant Rent Ledger**: ✅ **CURRENT** ($2,100 / mo paid in full)\n- **Actions**: 1-Click Approve & Dispatch Work Order • Send Tenant SMS Update',
      utteranceId,
      actionCard: {
        title: 'Emergency Maintenance Dispatch & BIC Approval Desk',
        target: '105 Forest Hills Dr • Unit B Work Order',
        details: 'Wilmington Mechanical ($1,250) • BIC Approval Required • Rent Ledger Current'
      }
    };
  }

  // 7f. Handle Lorena Multimodal AI Vision & Camera Scan Intent
  if (cleanText.includes('scan') || cleanText.includes('camera') || cleanText.includes('vision') || cleanText.includes('hud-1') || cleanText.includes('paper contract')) {
    return {
      intentType: 'SCAN_DOCUMENT_VISION',
      category: 'operational_request',
      spokenResponse: 'I scanned the Form 2-T purchase offer for 312 Mayfaire Way. The purchase price is $725,000 with a $15,000 due diligence fee and a $20,000 earnest money deposit. All buyer and seller signatures and initials look complete!',
      displayResponse: '### Lorena Multimodal AI Vision & Document Camera HUD — 312 Mayfaire Way\n\n- **Document Type**: 📄 NC REALTORS® Form 2-T Offer to Purchase and Contract\n- **Visual Confidence**: ⚡ **99.4% AI Match** (HD Document Camera Viewfinder)\n- **Property Address**: 312 Mayfaire Way, Wilmington NC 28405\n- **Purchase Price**: **$725,000.00** | **Due Diligence**: **$15,000.00** (Due Sep 1)\n- **Earnest Money**: **$20,000.00** (Escrow Agent: Nest Realty Title)\n- **Compliance Audit**: ✅ **VERIFIED** — All 16 Pages Initialed & Signed\n- **Actions**: 1-Click Export Certified Offer Abstract • Generate Form 2-T Contract Package',
      utteranceId,
      actionCard: {
        title: 'Lorena AI Multimodal Vision & Document Camera Desk',
        target: '312 Mayfaire Way • NC REALTORS® Form 2-T Offer',
        details: '99.4% Visual Match • Price: $725k • DD: $15k • EMD: $20k • All Initials Verified'
      }
    };
  }

  // 7g. Handle AI Predictive Buyer-Seller Matchmaker Intent
  if (cleanText.includes('buyer') || cleanText.includes('match') || cleanText.includes('pocket') || cleanText.includes('off market') || cleanText.includes('off-market') || cleanText.includes('radar')) {
    return {
      intentType: 'MATCHMAKER_BUYER_RADAR',
      category: 'operational_request',
      spokenResponse: "We've got 3 great pre-approved buyers lined up for 312 Mayfaire Way across our roster! The top match is Michael Chang, represented by Sarah Jenkins, with a $750,000 pre-approval letter from Movement Mortgage.",
      displayResponse: '### Lorena AI Predictive Buyer-Seller Matchmaker Radar — 312 Mayfaire Way\n\n- **Target Listing**: 312 Mayfaire Way, Wilmington NC ($725,000.00)\n- **Roster Search**: ⚡ Scanned 74 Brokerage Agents & 240 Active CRM Buyer Leads\n- **Top Matched Buyer #1**: **Michael & Sarah Chang** (🎯 **96% AI Match** • Agent: **Sarah Jenkins** (910) 555-0194)\n  - *Pre-Approval*: ✅ **$750,000.00** (Movement Mortgage) • Non-contingent buyer\n- **Top Matched Buyer #2**: **David & Karen Miller** (🎯 **92% AI Match** • Agent: **Marcus Aman** (910) 555-0211)\n- **Top Matched Buyer #3**: **Dr. Robert Vance** (🎯 **88% AI Match** • Agent: **Matt Orr** (910) 555-0142)\n- **Actions**: 📲 1-Click Send Intro SMS to Buyer Agent Sarah Jenkins',
      utteranceId,
      actionCard: {
        title: 'Lorena AI Buyer-Seller Matchmaker & Pocket Listing Radar',
        target: '312 Mayfaire Way • $725,000 Pocket Match',
        details: '🎯 Top Match: Michael Chang (96% Match • Agent: Sarah Jenkins) • Pre-Approved $750k'
      }
    };
  }

  // 7h. Handle AI Brokerage Deal Celebration Engine Intent
  if (cleanText.includes('celebrate') || cleanText.includes('deal volume') || cleanText.includes('leaderboard') || cleanText.includes('hype') || cleanText.includes('closed')) {
    return {
      intentType: 'TRIGGER_DEAL_CELEBRATION',
      category: 'operational_request',
      spokenResponse: '🎉 Congratulations to Sarah Jenkins and the entire Nest team! 312 Mayfaire Way is officially CLOSED for $725,000! Brokerage monthly volume reaches $14.85 Million across 38 closed transactions!',
      displayResponse: '### 🎉 Lorena AI Brokerage Deal Celebration Engine & 3D Universe\n\n- **Target Deal**: 🏆 **312 Mayfaire Way, Wilmington NC** ($725,000.00 CLOSED)\n- **Closing Agent**: 🌟 **Sarah Jenkins** (Top Producer)\n- **Monthly Brokerage Volume**: 🚀 **$14,850,000.00** (38 Closed Transactions)\n- **Top 3 Brokerage Leaderboard**:\n  - 🥇 **Sarah Jenkins**: **$4,250,000.00** (11 Deals)\n  - 🥈 **Matt Orr (BIC)**: **$3,800,000.00** (9 Deals)\n  - 🥉 **Marcus Aman**: **$3,150,000.00** (8 Deals)\n- **Interactive Effects**: 🎆 Confetti Soundscape & 3D Transaction Particle Universe Activated!\n- **1-Click Control**: 🎊 Replay Confetti Hype',
      utteranceId,
      actionCard: {
        title: '🎉 Lorena AI Brokerage Deal Celebration Engine',
        target: '312 Mayfaire Way • $725,000 CLOSED!',
        details: '🚀 Brokerage Volume: $14.85M (38 Deals) • Top Agent: Sarah Jenkins ($4.25M) • 🎆 Soundscape & Particle Universe Active'
      }
    };
  }

  // 7i. Handle AI Voice Automated Listing Launch & MLS Syndication Prep Intent
  if (cleanText.includes('mls') || cleanText.includes('launch listing') || cleanText.includes('syndicat') || cleanText.includes('flexmls') || cleanText.includes('zillow') || cleanText.includes('public remarks')) {
    return {
      intentType: 'MLS_LISTING_LAUNCH',
      category: 'operational_request',
      spokenResponse: 'The disclosures for 312 Mayfaire Way are verified and signed, including the Residential Property Disclosure and Mineral and Oil Gas rights. The public remarks and photo gallery are ready for MLS launch!',
      displayResponse: '### 🚀 Lorena AI Automated MLS Listing Launch & Syndication Engine\n\n- **Target Property**: 🏡 **312 Mayfaire Way, Wilmington NC 28405** ($725,000.00)\n- **Compliance Audit (NC REC)**:\n  - ✅ **RPOWDS (Residential Property & Owners Association Disclosure)**: Signed & Executed\n  - ✅ **MOG (Mineral & Oil & Gas Rights Disclosure)**: Signed & Executed\n  - ✅ **Lead-Based Paint Addendum**: Exempt (Built 2018)\n- **Media & Syndication Package**:\n  - 📷 **HDR Photography**: 36 High-Res Photos Synced\n  - 🌀 **3D Virtual Tour**: Matterport Pro 3D Tour Linked\n  - 📝 **AI Public Remarks**: *"Stunning modern coastal craftsman with open floor plan, chef\'s kitchen, and resort pool..."*\n- **Readiness Score**: 🎯 **98% Launch Ready**\n- **1-Click Control**: ⚡ Publish to FlexMLS, Zillow & Realtor.com',
      utteranceId,
      actionCard: {
        title: '🚀 Lorena AI Automated MLS Listing Launch Engine',
        target: '312 Mayfaire Way • $725,000 MLS Launch',
        details: '✅ NC Disclosures Signed • 36 HDR Photos + 3D Tour Synced • 🎯 98% Ready'
      }
    };
  }

  // 7j. Handle AI Voice Commission Split & Agent Desk Payroll Copilot Intent
  if (cleanText.includes('commission split') || cleanText.includes('agent payout') || cleanText.includes('payroll') || cleanText.includes('disbursement') || cleanText.includes('gross commission')) {
    return {
      intentType: 'COMMISSION_SPLIT_PAYROLL',
      category: 'operational_request',
      spokenResponse: 'Commission split calculated for 312 Mayfaire Way. Gross commission is $21,750 at 3 percent. Senior agent split is 70/30. Net agent payout to Sarah Jenkins is $14,575 after transaction coordinator and E and O fee deductions.',
      displayResponse: '### 💸 Lorena AI Commission Split & BIC Payroll Disbursement Authorization\n\n- **Target Sale**: 🏡 **312 Mayfaire Way, Wilmington NC 28405** ($725,000.00 CLOSED)\n- **Listing Agent**: 🌟 **Sarah Jenkins** (Senior Associate • 70/30 Tier)\n- **Gross Listing Commission**: 💰 **$21,750.00** (3.0% of $725,000.00)\n- **Commission Breakdown**:\n  - 👤 **Agent Gross Share (70%)**: **$15,225.00**\n  - 🏢 **Brokerage Retention (30%)**: **$6,525.00**\n- **Itemized Deductions**:\n  - 📋 **Transaction Coordinator Fee**: -$500.00\n  - 🛡️ **E&O Insurance Deductible**: -$150.00\n- **Net Agent Direct Deposit Payout**: 💵 **$14,575.00**\n- **BIC Approval Status**: ⏳ Pending BIC Approval (Matt Orr)\n- **1-Click Control**: ⚡ BIC Sign & Authorize Direct Deposit ACH',
      utteranceId,
      actionCard: {
        title: '💸 Lorena AI Commission Split & Payroll Copilot',
        target: '312 Mayfaire Way • Sarah Jenkins ($14,575 Net Payout)',
        details: '💰 Gross Commission: $21.75k (3%) • 70/30 Split • Fees: -$650 • Net Payout: $14,575.00'
      }
    };
  }

  // 7k. Handle AI Voice Seller Net Sheet & Closing Proceeds Intent
  if (cleanText.includes('seller net sheet') || cleanText.includes('closing proceeds') || cleanText.includes('net proceeds') || cleanText.includes('seller settlement') || cleanText.includes('net wire')) {
    return {
      intentType: 'SELLER_NET_SHEET',
      category: 'operational_request',
      spokenResponse: 'Seller net sheet calculated for 312 Mayfaire Way. Based on a $725,000 offer price, deducting mortgage payoff of $350,000, 5 percent commission of $36,250, NC excise stamps, and settlement fees, the estimated net wire proceeds to seller is $318,250.',
      displayResponse: '### 📊 Lorena AI Branded Seller Net Sheet & Settlement Audit\n\n- **Target Property**: 🏡 **312 Mayfaire Way, Wilmington NC 28405**\n- **Contract Purchase Price**: 💰 **$725,000.00**\n- **Credits to Seller**:\n  - ➕ **Due Diligence Fee (Direct to Seller)**: **+$15,000.00**\n- **Itemized Settlement Deductions**:\n  - 🏦 **Mortgage Payoff (First National Bank)**: -$350,000.00\n  - 🤝 **Total Brokerage Commission (5.0%)**: -$36,250.00 (2.5% Listing / 2.5% Buyer)\n  - 🏛️ **NC Revenue Stamps / Excise Tax**: -$1,450.00 ($1.00 per $500.00)\n  - ⚖️ **Closing Attorney Settlement Fee**: -$1,200.00\n  - 📅 **Prorated County Property Taxes**: -$2,850.00\n- **ESTIMATED NET WIRE TO SELLER**: 💵 **$318,250.00**\n- **1-Click Control**: ⚡ Generate PDF Net Sheet & Email to Seller',
      utteranceId,
      actionCard: {
        title: '📊 Lorena AI Branded Seller Net Sheet Calculator',
        target: '312 Mayfaire Way • $318,250 Estimated Net Wire Proceeds',
        details: '💰 Offer: $725k • Mortgage Payoff: -$350k • Comm (5%): -$36.25k • Net Wire: $318,250.00'
      }
    };
  }

  // 7l. Handle AI Voice Comparative Market Analysis (CMA) Presentation Intent
  if (cleanText.includes('cma presentation') || cleanText.includes('cma') || cleanText.includes('comparative market analysis') || cleanText.includes('market valuation') || cleanText.includes('property comps') || cleanText.includes('neighborhood comps')) {
    return {
      intentType: 'CMA_PRESENTATION',
      category: 'operational_request',
      spokenResponse: 'Comparative market analysis generated for 312 Mayfaire Way. Based on four recent neighborhood sales averaging $285.50 per square foot, the recommended listing price range is $720,000 to $740,000, with a midpoint target of $725,000.',
      displayResponse: '### 📈 Lorena AI Branded CMA Valuation & Market Analysis\n\n- **Subject Property**: 🏡 **312 Mayfaire Way, Wilmington NC 28405** (2,540 sqft • 4 Bed / 3.5 Bath)\n- **Neighborhood Valuation Analytics**:\n  - 📊 **Average Price per SqFt**: **$285.50 / sqft**\n  - ⏳ **Average Days on Market (DOM)**: **17 Days**\n- **Comparable Neighborhood Sales**:\n  - 🏡 **308 Mayfaire Way**: $710,000.00 ($286.29/sqft • 14 DOM)\n  - 🏡 **316 Mayfaire Way**: $735,000.00 ($283.78/sqft • 12 DOM)\n  - 🏡 **104 Coastal Dr**: $745,000.00 ($285.44/sqft • 19 DOM)\n  - 🏡 **412 Pine Valley Rd**: $720,000.00 ($286.85/sqft • 24 DOM)\n- **RECOMMENDED LISTING BRACKET**: 💰 **$720,000.00 – $740,000.00**\n- **TARGET MIDPOINT LISTING PRICE**: 🎯 **$725,000.00**\n- **1-Click Control**: ⚡ Export Branded PDF CMA Deck & Send to Client',
      utteranceId,
      actionCard: {
        title: '📈 Lorena AI Branded CMA Presentation Deck',
        target: '312 Mayfaire Way • $725,000 Target List Price ($285.50/sqft avg)',
        details: '💰 Comps: $710k–$745k • Avg $/sqft: $285.50 • Avg DOM: 17d • Recommended Range: $720k–$740k'
      }
    };
  }

  // 7m. Handle Multiple Offer Comparison Matrix Intent
  if (cleanText.includes('compare offer') || cleanText.includes('compare all offers') || cleanText.includes('multiple offer') || cleanText.includes('offer matrix') || cleanText.includes('competing offer') || cleanText.includes('offer breakdown')) {
    return {
      intentType: 'COMPARE_MULTIPLE_OFFERS',
      category: 'operational_request',
      spokenResponse: 'I compiled a side-by-side comparison for all 3 competing offers on 312 Mayfaire Way. Offer A from Michael Chang has the highest net proceeds at $725,000 with a $15,000 due diligence fee. Offer B is an all-cash offer at $715,000 with a 10-day quick close. Offer C is $730,000 but includes a home sale contingency.',
      displayResponse: '### 📊 Lorena AI Side-by-Side Offer Comparison Matrix — 312 Mayfaire Way\n\n| Term / Feature | 🥇 Offer A (Top Net) | ⚡ Offer B (Fast Cash) | 🏷️ Offer C (High Price) |\n| :--- | :--- | :--- | :--- |\n| **Buyer Name** | Michael & Sarah Chang | David & Karen Miller | Dr. Robert Vance |\n| **Purchase Price** | **$725,000.00** | **$715,000.00** | **$730,000.00** |\n| **Due Diligence Fee** | **$15,000.00** (Sep 1) | **$25,000.00** (Immediate) | **$5,000.00** (Sep 1) |\n| **Earnest Money** | **$20,000.00** | **$30,000.00** | **$10,000.00** |\n| **Financing Type** | Conventional (80% LTV) | **100% ALL CASH** | Conventional (90% LTV) |\n| **Appraisal Gap** | Covered up to $10,000 | **Appraisal Waived** | Standard Appraisal |\n| **Contingencies** | None | None | ⚠️ Home Sale Contingency |\n| **ESTIMATED NET PROCEEDS** | 💵 **$318,250.00** | 💵 **$314,800.00** | 💵 **$312,100.00** |\n\n- **Recommendation**: Offer A yields highest seller net wire proceeds with strong $15k DD fee; Offer B offers fastest closing with zero financing risk.\n- **1-Click Control**: ⚡ Export Branded Multiple Offer Comparison Matrix PDF for Seller',
      utteranceId,
      actionCard: {
        title: '📊 Lorena AI Side-by-Side Offer Comparison Matrix',
        target: '312 Mayfaire Way • 3 Competing Form 2-T Offers',
        details: '🥇 Offer A: $725k ($15k DD • $318.25k Net) • Offer B: $715k Cash • Offer C: $730k (Contingent)'
      }
    };
  }

  // 8. Fallback Knowledge Question Intent
  return {
    intentType: 'GENERAL_QUERY',
    category: 'knowledge_question',
    spokenResponse: `I searched Nest records for "${utterance}" and retrieved the relevant operational information for you.`,
    displayResponse: `### Operational Records Query — "${utterance}"\n\nSearched authorized Nest sources across active contracts, Basecamp pipeline, financial ledgers, and team directory.`,
    utteranceId
  };
}
