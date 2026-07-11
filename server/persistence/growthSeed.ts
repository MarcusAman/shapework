/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const seedPlaybooks = [
  {
    id: 'pb_1',
    name: 'Past Client Check-In',
    targetAudienceType: 'past_client',
    goal: 'Maintain relationship, ask for updates, and subtly solicit referrals or repeat business.',
    sequenceLength: 2,
    suggestedTone: 'warm',
    suggestedCta: 'Let me know if you would like a quick home equity check-in report!',
    sampleMessaging: [
      {
        step: 1,
        subject: 'Thinking of you! How is everything at {{listing_area}}?',
        body: 'Hi {{first_name}},\n\nI was just driving past {{listing_area}} the other day and thinking about how much fun we had finding that home. I hope everything is going wonderfully!\n\nJust wanted to check in and see how you are doing. How are any home projects coming along?\n\nWarmly,\n{{agent_name}}\n{{brokerage_name}}'
      },
      {
        step: 2,
        subject: 'Quick update (Local market info)',
        body: 'Hi {{first_name}},\n\nJust following up briefly. The local {{market}} market has been quite active lately. Home values in your neighborhood are moving. \n\nIf you are ever curious about a quick home equity update for your files, let me know. I would be happy to put one together for you.\n\nBest,\n{{agent_name}}'
      }
    ]
  },
  {
    id: 'pb_2',
    name: 'Seller Lead Reactivation',
    targetAudienceType: 'seller_lead',
    goal: 'Re-engage cold seller leads with updated market data and a direct valuation offer.',
    sequenceLength: 3,
    suggestedTone: 'professional',
    suggestedCta: 'Reply with your address to get an updated 2026 valuation report.',
    sampleMessaging: [
      {
        step: 1,
        subject: 'Updated home valuation report for {{first_name}}',
        body: 'Hi {{first_name}},\n\nA while ago we discussed the potential value of your property. Since then, local market trends have shifted, and buyers are looking in {{market}}.\n\nWe just compiled our mid-year market analysis. Would you be interested in a fresh, updated home valuation report for your records?\n\nBest,\n{{agent_name}}'
      }
    ]
  },
  {
    id: 'pb_3',
    name: 'Buyer Lead Reactivation',
    targetAudienceType: 'buyer_lead',
    goal: 'Re-engage cold buyer leads with target neighborhood listing updates.',
    sequenceLength: 2,
    suggestedTone: 'friendly',
    suggestedCta: 'Are you still looking to buy in the {{market}} area this year?',
    sampleMessaging: [
      {
        step: 1,
        subject: 'Still looking in {{market}}?',
        body: 'Hi {{first_name}},\n\nI hope your week is off to a great start. I noticed a couple of really nice homes just hit the market in {{market}} that fit the profile we were looking at previously.\n\nAre you still active in the home search, or have your plans shifted?\n\nBest,\n{{agent_name}}'
      }
    ]
  },
  {
    id: 'pb_4',
    name: 'Open House Follow-Up',
    targetAudienceType: 'event_attendee',
    goal: 'Follow up with open house visitors, capture feedback, and offer customized search setup.',
    sequenceLength: 2,
    suggestedTone: 'relationship-first',
    suggestedCta: 'What did you think of the layout/finishes at the property?',
    sampleMessaging: [
      {
        step: 1,
        subject: 'Thank you for stopping by! (Open House feedback)',
        body: 'Hi {{first_name}},\n\nIt was great meeting you at the open house yesterday. I wanted to follow up and see what your thoughts were on the property.\n\nDid the layout or finishes fit what you are looking for, or are you hoping to find something slightly different?\n\nBest,\n{{agent_name}}'
      }
    ]
  },
  {
    id: 'pb_5',
    name: 'Home Valuation Follow-Up',
    targetAudienceType: 'seller_lead',
    goal: 'Deliver automated valuation numbers and pivot to a professional CMA offer.',
    sequenceLength: 3,
    suggestedTone: 'direct',
    suggestedCta: 'Would you like to schedule a 10-minute walk-through to refine these figures?',
    sampleMessaging: [
      {
        step: 1,
        subject: 'Your home valuation report is ready',
        body: 'Hi {{first_name}},\n\nThanks for requesting a valuation for your home. Based on recent comps in {{market}}, the estimated value is hovering between $450,000 and $485,000.\n\nKeep in mind this is an automated estimate. To get a precise market analysis including recent upgrades, we should do a quick walk-through.\n\nBest,\n{{agent_name}}'
      }
    ]
  },
  {
    id: 'pb_6',
    name: 'Referral Partner Nurture',
    targetAudienceType: 'referral_partner',
    goal: 'Keep touchpoints fresh with local builders, lenders, and real estate attorneys.',
    sequenceLength: 2,
    suggestedTone: 'professional',
    suggestedCta: 'Let\'s grab coffee next Tuesday to catch up on local construction starts.',
    sampleMessaging: [
      {
        step: 1,
        subject: 'Catching up / Local market update',
        body: 'Hi {{first_name}},\n\nI hope business is going well. We are seeing a lot of buyer demand for new listings in {{market}} this quarter.\n\nI would love to sync up and see what construction projects or lending trends you are seeing on your end. Are you free for a quick coffee next week?\n\nWarmly,\n{{agent_name}}'
      }
    ]
  },
  {
    id: 'pb_7',
    name: 'Agent Recruiting Nurture',
    targetAudienceType: 'agent_recruit',
    goal: 'Attract top producing agents to the brokerage with value propositions and culture pitches.',
    sequenceLength: 3,
    suggestedTone: 'recruiting-focused',
    suggestedCta: 'Let\'s grab a confidential lunch to discuss our 100% commission splits.',
    sampleMessaging: [
      {
        step: 1,
        subject: 'Impressive production in {{market}}',
        body: 'Hi {{first_name}},\n\nI have been tracking local transaction volume in {{market}} and wanted to congratulate you on your recent closing. Excellent work!\n\nHere at {{brokerage_name}}, we are building a tech-forward platform that saves our agents 10+ hours of admin work per transaction.\n\nI would love to buy you lunch sometime to show you our operations stack. Let me know if you are open to a confidential chat.\n\nBest,\n{{agent_name}}'
      }
    ]
  },
  {
    id: 'pb_8',
    name: 'Brokerage Event Invitation',
    targetAudienceType: 'event_attendee',
    goal: 'Invite contacts to a local community seminar, open house party, or builder showcase.',
    sequenceLength: 2,
    suggestedTone: 'community-focused',
    suggestedCta: 'Click here or reply to RSVP for the event.',
    sampleMessaging: [
      {
        step: 1,
        subject: 'You are invited: {{brokerage_name}} Summer Social',
        body: 'Hi {{first_name}},\n\nWe are hosting our annual community showcase next Thursday evening at our main office.\n\nThere will be local food trucks, craft beer, and builder displays. We would love to have you stop by and say hello!\n\nBest,\n{{agent_name}}'
      }
    ]
  },
  {
    id: 'pb_9',
    name: 'New Listing Announcement',
    targetAudienceType: 'buyer_lead',
    goal: 'Send details of a hot new listing to active buyers in matching markets.',
    sequenceLength: 2,
    suggestedTone: 'luxury',
    suggestedCta: 'Would you like to schedule a private tour before the open house?',
    sampleMessaging: [
      {
        step: 1,
        subject: 'Just Listed in {{market}}! (Stunning layout)',
        body: 'Hi {{first_name}},\n\nWe just listed a beautiful new home in {{market}} that matches the criteria you looked at previously.\n\nIt features a gorgeous open layout, updated kitchen, and private backyard. Let me know if you want to take a look this weekend!\n\nBest,\n{{agent_name}}'
      }
    ]
  },
  {
    id: 'pb_10',
    name: 'New Construction Partner Follow-Up',
    targetAudienceType: 'builder',
    goal: 'Engage builders with land acquisition or buyer demand metrics.',
    sequenceLength: 2,
    suggestedTone: 'relationship-first',
    suggestedCta: 'Do you have any new inventory wrapping up in {{market}} next month?',
    sampleMessaging: [
      {
        step: 1,
        subject: 'Builder update: Buyer demand in {{market}}',
        body: 'Hi {{first_name}},\n\nWe currently have three qualified buyers looking specifically for new construction specs in {{market}}.\n\nIf you have any upcoming inventory that is not yet on the MLS, let me know. I\'d love to bring them through.\n\nBest,\n{{agent_name}}'
      }
    ]
  }
];

export const seedContacts = [
  {
    id: 'c_grow_1',
    firstName: 'Bruce',
    lastName: 'Wayne',
    email: 'bruce@wayne.co',
    phone: '555-0199',
    company: 'Wayne Enterprises',
    role: 'CEO',
    contactType: 'buyer_lead',
    source: 'Website Valuation',
    sourceDetail: 'Valuation request for 1007 Mountain Drive',
    relationshipStatus: 'active',
    market: 'Luxury Escapes',
    tags: ['VIP', 'Luxury', 'Cash Buyer']
  },
  {
    id: 'c_grow_2',
    firstName: 'Clark',
    lastName: 'Kent',
    email: 'clark@dailyplanet.com',
    phone: '555-0120',
    company: 'Daily Planet',
    role: 'Journalist',
    contactType: 'past_client',
    source: 'Rechat CRM',
    sourceDetail: 'Closed purchase of 102 Pine Street',
    relationshipStatus: 'closed',
    market: 'Metro Suburbs',
    tags: ['Referral Source', 'Newsletter']
  },
  {
    id: 'c_grow_3',
    firstName: 'Diana',
    lastName: 'Prince',
    email: 'diana@themyscira.org',
    phone: '555-0188',
    company: 'Museum of Antiquities',
    role: 'Curator',
    contactType: 'agent_recruit',
    source: 'Manual Import',
    sourceDetail: 'Top Producer Recruiting Prospect List',
    relationshipStatus: 'nurture',
    market: 'Top Producer',
    tags: ['Recruit', 'Agent $5M+']
  },
  {
    id: 'c_grow_4',
    firstName: 'Barry',
    lastName: 'Allen',
    email: 'barry@ccpd.gov',
    phone: '555-0144',
    company: 'CCPD spec division',
    role: 'Investigator',
    contactType: 'referral_partner',
    source: 'Manual Import',
    sourceDetail: 'Local Builder & Developer List',
    relationshipStatus: 'nurture',
    market: 'New Construction',
    tags: ['Builder', 'Developer']
  }
];

export const seedAudiences = [
  {
    id: 'aud_grow_1',
    name: 'Past Clients Circle',
    description: 'Clients who closed a transaction in the last 24 months',
    status: 'active'
  },
  {
    id: 'aud_grow_2',
    name: 'Agent Recruits Target',
    description: 'High performing local agents producing $5M+ in volume',
    status: 'active'
  },
  {
    id: 'aud_grow_3',
    name: 'Cold Seller Leads',
    description: 'Leads from home evaluation landing page who did not list',
    status: 'active'
  }
];

export const seedAudienceContacts = [
  {
    id: 'ac_grow_1',
    audienceId: 'aud_grow_1',
    contactId: 'c_grow_2'
  },
  {
    id: 'ac_grow_2',
    audienceId: 'aud_grow_2',
    contactId: 'c_grow_3'
  },
  {
    id: 'ac_grow_3',
    audienceId: 'aud_grow_3',
    contactId: 'c_grow_1'
  }
];

export const seedSendingDomains = [
  {
    id: 'sd_grow_1',
    domain: 'nestrealty.com',
    status: 'verified',
    dnsRecords: [
      { type: 'TXT', host: '@', value: 'v=spf1 include:mailgun.org include:resend.com ~all', status: 'valid' },
      { type: 'CNAME', host: 'resend._domainkey', value: 'dkim.resend.com', status: 'valid' },
      { type: 'TXT', host: '_dmarc', value: 'v=DMARC1; p=quarantine; pct=100', status: 'valid' }
    ],
    dailySendingLimit: 1000,
    isPaused: false,
    bounceWarningStatus: 'healthy',
    complaintWarningStatus: 'healthy'
  }
];

export const seedSendingAccounts = [
  {
    id: 'sa_grow_1',
    domainId: 'sd_grow_1',
    email: 'outreach@nestrealty.com',
    status: 'active'
  }
];

export const seedContactSources = [
  { id: 'cs_grow_1', sourceName: 'Rechat CRM', description: 'Primary agent CRM integration' },
  { id: 'cs_grow_2', sourceName: 'Open House Form', description: 'Digital sign-in sheets' },
  { id: 'cs_grow_3', sourceName: 'Manual Import', description: 'CSV file uploads' }
];
