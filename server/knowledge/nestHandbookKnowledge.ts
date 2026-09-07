/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Nest Realty Agent Handbook 2026 — Comprehensive RAG Knowledge Base
 * Extracted and synthesized from the official 96-page Nest Handbook publication.
 */

export interface NestHandbookArticle {
  id: string;
  title: string;
  section: string;
  pageRange: string;
  tags: string[];
  summary: string;
  content?: string;
}

export const NEST_HANDBOOK_KNOWLEDGE: NestHandbookArticle[] = [
  {
    "id": "handbook-intro",
    "title": "Welcome to the Nest Realty Handbook (2026 Edition)",
    "section": "Introduction & Overview",
    "pageRange": "Pg. 1-4",
    "tags": [
      "welcome",
      "overview",
      "handbook",
      "mission",
      "founding",
      "2008"
    ],
    "summary": "Founded in 2008, Nest Realty provides agents with technology, marketing, and support systems to deliver exceptional service and scale their business.",
    "content": "Since our founding in 2008, Nest Realty has been focused on providing each and every Nest agent with the support and capabilities to build their business the right way.\nThe Nest Handbook is designed to simplify and highlight core resources across 6 key pillars:\n1. Buyer Journey (Buyer Guide, Home Search App, Toursheets, Inspection Survival Kit, Closing Package)\n2. Seller Journey (Listing Presentations, CMA, Seller's Advantage, Service Network, Listing Marketing, Maxa Design Center)\n3. Market Yourself (Rechat CRM, Profile Setup, Testimonials, Nest Design Center, Email Marketing, Farming, Website, Adwerx, Social Media)\n4. Client Nurturing (Friends of Nest / FON, Market Reports, Education Mailers, NEST Magazine, Summer Mailer, Greeting Cards, Events, Gifts)\n5. Resources + Communication (Rechat Dashboard, Nest HQ Team, Bird Calls Newsletter, Nest Referral Network)\n6. Checklists + Glossary (Listing Presentation Checklist, Personal Marketing Checklist, A-Z Operations Glossary)"
  },
  {
    "id": "handbook-buyer-guide",
    "title": "Nest Homebuyer's Guide & Initial Consultation",
    "section": "Section 1: Buyer Journey",
    "pageRange": "Pg. 5-7",
    "tags": [
      "buyer guide",
      "buyer journey",
      "consultation",
      "buyer consult",
      "homebuyers",
      "pre-approval",
      "timeline"
    ],
    "summary": "The Nest Homebuyer's Guide structures the 4 key pillars of an initial consultation: Needs Assessment, Local Market Dynamics, Buying Process Timeline, and The Nest Difference.",
    "content": "The Buyer Guide is the ideal foundation for an initial buyer consultation.\nRecommended initial buyer consultation agenda:\n1. Needs & Criteria Assessment: Understand lifestyle goals, timeline, financing pre-approval, and non-negotiable property features.\n2. Local Market Dynamics: Review active inventory levels, absorption rates, average days on market, and competitive bidding conditions.\n3. Buying Process Timeline: Walk through the 7 milestones from pre-approval, search, offer drafting, due diligence & inspections, appraisal, to settlement.\n4. The Nest Difference: Explain how Nest tools (collaborative Home Search App, live Toursheets, Inspection Survival Kit) provide a seamless client experience.\nCustomization: Physical printed Buyer Guides and interactive digital flipbook links are available in the Nest Design Center (nest.maxadesigns.com)."
  },
  {
    "id": "handbook-home-search-tours",
    "title": "Nest Home Search App & Interactive Toursheets",
    "section": "Section 1: Buyer Journey",
    "pageRange": "Pg. 8-9",
    "tags": [
      "home search app",
      "toursheet",
      "property tours",
      "saved searches",
      "client collaboration",
      "showing tour"
    ],
    "summary": "Nest Home Search provides direct MLS search collaboration without third-party portal ads, while Toursheet Creator generates structured showing itineraries with maps and notes.",
    "content": "Nest Home Search App:\n- Direct MLS integration with real-time property updates.\n- Keeps clients inside your branded ecosystem without distracting third-party advertisements or competing agent leads.\n- In-app collaboration: Clients can favorite properties, request showings, and add private notes that sync directly with the agent's Rechat CRM.\n\nNest Toursheets:\n- Quickly compile scheduled property showings into a clean, branded showing itinerary.\n- Includes turn-by-turn routing, property highlights, MLS specs, estimated arrival times, and client evaluation check-boxes.\n- Easily shareable via digital mobile link or 300 DPI print handout."
  },
  {
    "id": "handbook-inspection-closing",
    "title": "Inspection Survival Kit & Closing Package",
    "section": "Section 1: Buyer Journey",
    "pageRange": "Pg. 10-15",
    "tags": [
      "inspection survival kit",
      "closing package",
      "due diligence",
      "final walkthrough",
      "homeowner resources"
    ],
    "summary": "Turn stressful due diligence into a delightful milestone using the branded Inspection Survival Kit, Final Walkthrough Checklist, and Closing Gift Package.",
    "content": "Inspection Survival Kit (Pg. 10-11):\n- Due diligence and home inspections can be intimidating for buyers.\n- Nest provides branded Inspection Survival Kits containing essential snacks, inspection tips, what-to-expect checklists, and QR code access to preferred local contractor directories.\n\nClosing Package & Final Walkthrough (Pg. 12-15):\n- Final Walkthrough Checklist: Verification of seller repairs, HVAC/appliance operation, key transfer, and broom-clean condition.\n- Nest Closing Package: High-grade document folder for settlement statements, warranty docs, key tags, and customized welcome home gifts."
  },
  {
    "id": "handbook-listing-presentation",
    "title": "The Perfect Listing Presentation & CMA",
    "section": "Section 2: Seller Journey",
    "pageRange": "Pg. 17-24",
    "tags": [
      "listing presentation",
      "cma",
      "seller journey",
      "comparative market analysis",
      "presentation folder",
      "flipbook"
    ],
    "summary": "Nest provides premium printed presentation folders, digital flipbooks, and CloudCMA integrations with customizable marketing roadmaps.",
    "content": "The Nest Listing Presentation:\n- Available in both luxury physical print folders and interactive digital flipbook formats.\n- Core Sections:\n  1. Agent Background, Bio & Proven Track Record\n  2. In-Depth Comparative Market Analysis (CMA) with active/pending/sold comps and price positioning\n  3. Strategic Omnichannel Marketing Plan (Direct mail flyers, social carousels, EDDM postcards, Adwerx digital campaigns, Nest Magazine features)\n  4. Professional Photography & Media Standards\n  5. The Nest Service Network & Step-by-Step Closing Timeline\nCustomization: Order pre-assembled luxury print presentation folders through the Nest Design Center (nest.maxadesigns.com) or download digital slide decks."
  },
  {
    "id": "handbook-seller-advantage",
    "title": "Seller's Advantage & Service Network",
    "section": "Section 2: Seller Journey",
    "pageRange": "Pg. 25-27",
    "tags": [
      "sellers advantage",
      "service network",
      "vendor directory",
      "contractors",
      "pre-listing staging",
      "home repairs"
    ],
    "summary": "Seller's Advantage provides automated listing traffic reports, while Service Network connects sellers to vetted local trades for pre-listing repairs and staging.",
    "content": "Seller's Advantage:\n- Automated weekly performance reporting for active listings.\n- Aggregates digital views across NestRealty.com, MLS syndication (Zillow, Realtor.com), social media impressions, and agent showing feedback into a clean seller digest.\n\nService Network:\n- A curated directory of vetted local vendors, trades, and service providers (painters, staging consultants, home inspectors, HVAC technicians, landscapers, photographers).\n- Eliminates friction when preparing homes for market and resolving due diligence repair requests."
  },
  {
    "id": "handbook-listing-marketing",
    "title": "Listing Marketing Suite: Print, Social & Digital",
    "section": "Section 2: Seller Journey",
    "pageRange": "Pg. 28-34",
    "tags": [
      "listing marketing",
      "maxa",
      "flyer",
      "social story",
      "postcard",
      "eddm",
      "adwerx",
      "digital marketing"
    ],
    "summary": "Every Nest listing receives a full 300 DPI collateral package: 8.5x11 Property Flyer, 9:16 Social Story, 6x9 Jumbo EDDM Postcard, and Adwerx digital ad campaigns.",
    "content": "Core Collateral Package:\n1. Double-Sided 8.5x11 Property Flyer: 300 DPI vector PDF designed for property display and brochure boxes.\n2. 9:16 Social Story Carousel: 1080x1920 PNG high-impact mobile assets for Instagram & Facebook Stories.\n3. 6x9 Jumbo EDDM Postcard: USPS EDDM Clear Zone verified direct mail sent to surrounding neighborhoods.\n4. Adwerx Automated Digital Campaigns: Geo-targeted web and social ads placed across local zip codes and top websites.\n5. Nest Design Center (Maxa): Automated generation pulling MLS photos and property details with 1-click export."
  },
  {
    "id": "handbook-rechat-crm",
    "title": "Rechat CRM & Database Hygiene Standards",
    "section": "Section 3: Market Yourself",
    "pageRange": "Pg. 35-40",
    "tags": [
      "rechat",
      "crm",
      "database",
      "tags",
      "contacts",
      "client relationship manager",
      "sphere"
    ],
    "summary": "Rechat is Nest's central operating CRM for contact management, email campaigns, transaction tracking, and Friends of Nest (FON) list synchronization.",
    "content": "Rechat CRM Best Practices:\n- Clean Database Hygiene: Ensure all sphere contacts have verified full names, mailing addresses, phone numbers, and email addresses.\n- Segmentation & Tagging: Apply tags such as 'Past Client', 'A-List Sphere', 'Active Buyer', 'Potential Seller', 'Vendor Partner'.\n- Friends of Nest (FON) Tagging: Tag contacts with 'FON' to automatically enroll them in quarterly direct mail touchpoints.\n- Activity Logging: Record client conversations, milestone dates (home purchase anniversaries, birthdays), and showing feedback."
  },
  {
    "id": "handbook-nest-design-center",
    "title": "Nest Design Center (NDC / Maxa Designs)",
    "section": "Section 3: Market Yourself",
    "pageRange": "Pg. 41-44",
    "tags": [
      "nest design center",
      "ndc",
      "maxa",
      "templates",
      "marketing proofs",
      "brand assets",
      "nest.maxadesigns.com"
    ],
    "summary": "Nest Design Center (hosted on nest.maxadesigns.com via Maxa) houses the complete template library for brand collateral, print, digital, and social media.",
    "content": "Nest Design Center (nest.maxadesigns.com):\n- The central portal for all Nest-approved marketing templates.\n- Automatically populates agent headshots, contact information, brokerage licenses, and MLS listing data.\n- Template Library:\n  \u2022 Property Flyers (8.5x11 Single & Double-Sided)\n  \u2022 Social Media Graphics (Square 1:1, Story 9:16, Header 16:9)\n  \u2022 Direct Mail Postcards (4x6, 6x9, 6x11 EDDM)\n  \u2022 Personal Branding Brochures & Bi-Fold Folders\n  \u2022 Market Report Templates & Infographics\n  \u2022 Email Banners & Newsletter Headers"
  },
  {
    "id": "handbook-email-farming-ads",
    "title": "Email Marketing, Farming Program & Digital Ads",
    "section": "Section 3: Market Yourself",
    "pageRange": "Pg. 45-54",
    "tags": [
      "email marketing",
      "farming program",
      "adwerx",
      "digital advertising",
      "social media",
      "geographic farming"
    ],
    "summary": "Comprehensive personal marketing strategies including Rechat automated email newsletters, targeted direct-mail farming, Adwerx digital ads, and social playbooks.",
    "content": "Email Marketing (Pg. 45):\n- Monthly curated market updates, local community guides, and lifestyle content pre-built in Rechat.\n- Automated delivery to tagged client segments with tracking for opens, clicks, and replies.\n\nGeographic Farming Program (Pg. 47):\n- Turn high-turnover neighborhoods into consistent listing pipelines.\n- Multi-touch direct mail sequences: Market Update postcards, Just Listed / Just Sold notifications, and neighborhood equity reports.\n\nDigital Advertising & Social Media (Pg. 51-53):\n- Adwerx automated listing ads and brand campaigns shown on Facebook, Instagram, and premium web publications (NYT, ESPN, CNN).\n- Social Media Guidelines: Maintain brand consistency using official Nest fonts, color palettes (#00635C Hunter Green, Warm Creams), and logo formats."
  },
  {
    "id": "handbook-friends-of-nest",
    "title": "Friends of Nest (FON) Touchpoint Program",
    "section": "Section 4: Client Nurturing",
    "pageRange": "Pg. 55-70",
    "tags": [
      "friends of nest",
      "fon",
      "nest magazine",
      "client nurturing",
      "touchpoints",
      "direct mail",
      "market reports",
      "summer mailer"
    ],
    "summary": "Friends of Nest (FON) is Nest's flagship client retention program, delivering 4-6 premium physical touchpoints per year (including NEST Magazine and Market Reports) directly to your past clients.",
    "content": "What is Friends of Nest (FON)?\n- A turnkey relationship-nurturing program where Nest designs, produces, addresses, and mails luxury physical publications on your behalf.\n- Enrolled clients receive steady, non-salesy touchpoints that keep you top-of-mind.\n\nAnnual FON Touchpoint Schedule:\n1. Q1: Annual Market Report & Housing Outlook (Pg. 61-62)\n2. Q2: Spring NEST Magazine (Luxury lifestyle publication with personalized agent cover letter) (Pg. 65)\n3. Q3: Summer Fun Mailer (Lighthearted community piece, recipes, summer guide) (Pg. 66)\n4. Q4: Fall NEST Magazine + Year-End Review (Pg. 65)\n5. Winter: Annual Holiday Card & Calendar Mailer (Pg. 93)\n6. Interim: FON Education Mailers covering home maintenance, renovation ROI, and equity growth (Pg. 63).\n\nHow to Enroll Clients:\n- Add the contact to Rechat CRM with a complete physical mailing address and tag them with 'FON'."
  },
  {
    "id": "handbook-cards-events-gifts",
    "title": "Greeting Cards, Client Events & Gift Protocol",
    "section": "Section 4: Client Nurturing",
    "pageRange": "Pg. 71-76",
    "tags": [
      "greeting cards",
      "client events",
      "client gifts",
      "pop-bys",
      "closing gifts",
      "pie day",
      "appreciation"
    ],
    "summary": "Building lifelong referral relationships through handwritten milestone cards, signature client appreciation events, and thoughtful closing gifts.",
    "content": "Greeting Cards Program (Pg. 71):\n- High-touch, handwritten notes create unmatched emotional connection.\n- Milestone Triggers: Home purchase anniversaries, birthdays, promotions, holidays, and referrals.\n- Pre-printed Nest artisan greeting card packs available at every local office.\n\nClient Appreciation Events (Pg. 73):\n- Annual signature events: Thanksgiving Pie Giveaways, Spring Shredding Days, Summer Ice Cream Socials, Private Movie Screenings.\n- Nest HQ provides turnkey event marketing kits (invitations, social graphics, RSVP registration pages).\n\nClosing Gifts (Pg. 75):\n- Recommended gift strategies: Local artisanal baskets, custom home portraits, engraved cutting boards, or donations to client-chosen local charities."
  },
  {
    "id": "handbook-tech-stack-hq",
    "title": "Nest Technology Stack & Nest HQ Support",
    "section": "Section 5: Resources + Communication",
    "pageRange": "Pg. 77-85",
    "tags": [
      "tech stack",
      "nest hq",
      "bird calls",
      "rechat",
      "maxa",
      "nest network",
      "internal communication",
      "referrals"
    ],
    "summary": "Integrated technology tools, weekly 'Bird Calls' newsletter, Nest HQ operational departments, and cross-brokerage referral networks.",
    "content": "Core Technology Stack:\n1. Rechat: Central CRM, email campaigns, contact management, and task workflows.\n2. Nest Design Center (Maxa): Print, digital, and social marketing studio.\n3. NestRealty.com: Public MLS search portal, lead capture, and custom agent profile pages.\n4. Adwerx: Automated digital ad retargeting and listing promotions.\n5. CloudCMA: Visual comparative market analysis reports.\n\nNest HQ Departments (Pg. 81):\n- Leadership & Strategic Growth\n- Brand Studio & Marketing Production\n- Operations & Agent Success\n\nInternal Communication:\n- Bird Calls (Pg. 83): Weekly company-wide newsletter highlighting upcoming campaigns, market data, tech tips, and new marketing assets.\n- Nest Network (Pg. 84): High-converting agent-to-agent referral network across Virginia, North Carolina, Tennessee, Kentucky, Georgia, and South Carolina."
  },
  {
    "id": "handbook-checklists-glossary",
    "title": "Listing Presentation & Marketing Checklists (A-Z Operations Glossary)",
    "section": "Section 6: Checklists + Glossary",
    "pageRange": "Pg. 87-96",
    "tags": [
      "checklist",
      "checklists",
      "listing checklist",
      "listing presentation checklist",
      "marketing checklist",
      "personal marketing checklist",
      "glossary",
      "definitions",
      "fon terms"
    ],
    "summary": "Operational checklists for listing presentations and personal marketing, plus complete definitions of all Nest programs, tools, and proprietary systems.",
    "content": "Operational checklists for listing presentations and personal marketing (including the Listing Presentation Checklist and Personal Marketing Checklist), plus complete definitions of all Nest programs, tools, and proprietary systems. Includes step-by-step verification before listing launch, marketing calendar timelines, and standard terminology across all offices."
  },
  {
    "id": "handbook-nest-brand-library",
    "title": "Nest Brand Library & Approved Assets (Brand Guidelines)",
    "section": "Section 3: Market Yourself & Brand Standards",
    "pageRange": "Pg. 38-42",
    "tags": [
      "nest library",
      "brand library",
      "branding",
      "brand guidelines",
      "logos",
      "colors",
      "hunter green",
      "fonts",
      "assets"
    ],
    "summary": "The official Nest Brand Library provides authorized logo lockups, primary Hunter Green (#00635C) color palette, typography guidelines, and approved media assets via brand.nestrealty.com and nest.maxadesigns.com/brand-library.",
    "content": "Nest Brand Library & Assets:\n- Official Portal: https://brand.nestrealty.com and https://nest.maxadesigns.com/brand-library\n- Primary Palette: Hunter Green (#00635C), Warm Cream (#F6F7F1), Deep Forest (#01362D), and Crisp Slate.\n- Official Typography: Editorial serif headings, clean modern geometric sans-serif for body copy and technical specs.\n- Logo Formats: Vector SVG, high-resolution 300 DPI transparent PNG, and circular badges. Never distort, recolor, or modify official Nest logo lockups.\n- Compliance: All agent advertising must display brokerage licensing attribution ('Nest Realty Wilmington · Equal Housing Opportunity')."
  }
];

/**
 * Searches the Nest Handbook RAG database for matching articles, SOPs, checklists, and guidelines.
 */
export function queryNestHandbook(query: string): {
  results: NestHandbookArticle[];
  bestMatch: NestHandbookArticle | null;
  spokenSummary: string;
} {
  if (!query || typeof query !== 'string') {
    return {
      results: NEST_HANDBOOK_KNOWLEDGE,
      bestMatch: NEST_HANDBOOK_KNOWLEDGE[0],
      spokenSummary: 'The Nest Handbook covers 6 core sections: Buyer Journey, Seller Journey, Personal Marketing, Client Nurturing (FON), Tech Resources, and Checklists.'
    };
  }

  const cleanQuery = query.toLowerCase().trim();
  const queryTokens = cleanQuery.split(/\s+/).filter(t => t.length > 2);

  const scored = NEST_HANDBOOK_KNOWLEDGE.map(article => {
    let score = 0;
    const titleLower = article.title.toLowerCase();
    const summaryLower = article.summary.toLowerCase();
    const contentLower = (article.content || article.summary || '').toLowerCase();
    const tagsLower = article.tags.map(t => t.toLowerCase());

    // Exact matches
    if (titleLower === cleanQuery) score += 100;
    if (titleLower.includes(cleanQuery)) score += 60;
    if (summaryLower.includes(cleanQuery)) score += 40;
    
    for (const tag of tagsLower) {
      if (tag === cleanQuery) score += 80;
      else if (cleanQuery.includes(tag)) score += 30 + tag.length;
    }

    // Token matches
    for (const token of queryTokens) {
      if (titleLower.includes(token)) score += 15;
      if (tagsLower.some(t => t.includes(token))) score += 15;
      if (summaryLower.includes(token)) score += 10;
      if (contentLower.includes(token)) score += 5;
    }

    return { article, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const matched = scored.filter(s => s.score > 0).map(s => s.article);
  const best = matched[0] || null;

  const spokenSummary = best ? `According to the Nest Handbook (${best.section}, ${best.pageRange}): ${best.summary}` : '';

  return {
    results: matched,
    bestMatch: best,
    spokenSummary
  };
}
