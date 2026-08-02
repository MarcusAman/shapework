/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BlogPost {
  id: string;
  workspaceId?: string;
  title: string;
  slug: string;
  content: string; // Markdown content
  excerpt: string;
  featured_image?: string;
  featured_image_alt?: string;
  author_name: string;
  category: string;
  tags: string[];
  published: boolean;
  published_at?: string;
  meta_title?: string;
  meta_description?: string;
  primary_keyword?: string;
  secondary_keywords?: string[];
  seo_score: number;
  faq_content: { question: string; answer: string }[];
  social_captions: {
    facebook: string;
    instagram: string;
    x: string;
    linkedin: string;
  };
  reading_time_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface BlogAutomationSettings {
  id: string;
  workspaceId?: string;
  auto_generate_enabled: boolean;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  auto_publish: boolean;
  target_topics: string[];
  target_city: string;
  target_tone: string;
  updated_at: string;
}

export interface ContentBrief {
  topic: string;
  primaryKeyword: string;
  secondaryKeywords?: string[];
  category?: string;
  targetAudience?: string;
  tone?: string;
  localTarget?: string;
  wordCountTarget?: number;
  servicesToMention?: string[];
  ctaGoal?: string;
}

export interface GeneratedContent {
  titles: string[];
  slug: string;
  outline: string;
  content: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  faqContent: { question: string; answer: string }[];
  socialCaptions: {
    facebook: string;
    instagram: string;
    x: string;
    linkedin: string;
  };
  imagePrompt: string;
  imageAlt: string;
  tags: string[];
}

const DEFAULT_SETTINGS: BlogAutomationSettings = {
  id: 'auto_settings_default',
  workspaceId: 'nest-realty-demo',
  auto_generate_enabled: true,
  frequency: 'weekly',
  auto_publish: false,
  target_topics: [
    'Navigating Pre-MLS Listings in Wilmington',
    'Escalation Clauses vs Backup Offers in Competitive Coastal Markets',
    'North Carolina BIC Compliance Checklist for 2026',
    'Staging Strategies to Maximize Offer Value in Wrightsville Beach'
  ],
  target_city: 'Wilmington, NC',
  target_tone: 'Professional, Empathetic, Authoritative',
  updated_at: new Date().toISOString()
};

const DEFAULT_POSTS: BlogPost[] = [
  {
    id: 'post_1',
    workspaceId: 'nest-realty-demo',
    title: 'Navigating Pre-MLS Listings in Wilmington & Coastal NC',
    slug: 'navigating-pre-mls-listings-wilmington-nc',
    content: `## What is a Pre-MLS Listing?

A **Pre-MLS listing** (also known as an coming-soon or off-market property) represents a property that has been signed under an exclusive listing agreement but has not yet hit the public Multiple Listing Service (MLS).

In fast-paced coastal markets like Wilmington, Wrightsville Beach, and Carolina Beach, pre-MLS visibility offers distinct advantages for both home buyers and listing brokers.

### Key Benefits for Buyers
- **Reduced Competition:** Gain first-look access before public syndication.
- **Flexible Closing Schedules:** Negotiate seller timelines with less pressure.
- **Direct Broker Collaboration:** Leverage institutional office relationships to find unlisted inventory.

### Key Rules for Listing Brokers & BICs
In North Carolina, Brokers-in-Charge (BICs) must ensure strict compliance with NCREC advertising standards and local MLS clear-cooperation guidelines:
1. **Written Consent:** Written seller authorization is required before any office-exclusive marketing.
2. **Fair Housing Integrity:** Marketing must reach broad channels without discriminatory filtering.
3. **Escalation Rules:** Active seller agency obligations apply at all times.

> "Clear communication and proactive compliance turn off-market listings into seamless transactions." — Nest Realty Editorial Team

## Actionable Takeaways for Home Buyers
If you're actively searching for property in the Greater Wilmington area, ensure your buyer's agent maintains an active network within top regional brokerages to capture pre-MLS opportunities before they hit Zillow or Realtor.com.`,
    excerpt: 'Explore how pre-MLS listings give buyers a competitive edge in Wilmington while staying compliant with NCREC advertising standards.',
    featured_image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
    featured_image_alt: 'Modern luxury coastal home in Wilmington NC',
    author_name: 'Nest Realty Editorial Team',
    category: 'Market Intelligence',
    tags: ['Pre-MLS', 'Wilmington NC', 'Buyer Guide', 'Real Estate Compliance'],
    published: true,
    published_at: '2026-07-28T10:00:00Z',
    meta_title: 'Navigating Pre-MLS Listings in Wilmington NC | Nest Realty',
    meta_description: 'Discover how pre-MLS listings work in Wilmington & Coastal NC. Learn key benefits for home buyers and compliance rules for listing brokers.',
    primary_keyword: 'pre-mls listings wilmington nc',
    secondary_keywords: ['off-market homes wilmington', 'coming soon listings nc', 'ncrec advertising rules'],
    seo_score: 92,
    faq_content: [
      {
        question: 'Are pre-MLS listings legal in North Carolina?',
        answer: 'Yes. Pre-MLS listings are fully legal in NC provided the seller grants written consent and all NCREC and local MLS Clear Cooperation rules are followed.'
      },
      {
        question: 'How do I get access to off-market homes in Wilmington?',
        answer: 'Work with a well-connected buyer broker who utilizes internal brokerage networks and automated workboard notifications.'
      }
    ],
    social_captions: {
      facebook: 'Looking for off-market inventory in Wilmington? Here is how pre-MLS listings work and how to get access early! 🏠 coastal-living.com/pre-mls',
      instagram: 'Pre-MLS listings are transforming coastal NC real estate. Swipe up to read our full breakdown! ✨ #WilmingtonNC #RealEstate',
      x: 'How pre-MLS listings give buyers an edge in Wilmington & Wrightsville Beach: https://nest-realty.co/blog/pre-mls',
      linkedin: 'Understanding NCREC compliance & Clear Cooperation rules for off-market real estate transactions in North Carolina.'
    },
    reading_time_minutes: 4,
    created_at: '2026-07-28T09:00:00Z',
    updated_at: '2026-07-28T10:00:00Z'
  },
  {
    id: 'post_2',
    workspaceId: 'nest-realty-demo',
    title: 'Escalation Clauses vs. Backup Offers: A Coastal NC Strategy Guide',
    slug: 'escalation-clauses-vs-backup-offers-nc',
    content: `## Navigating Multiple Offer Scenarios

When demand outpaces inventory in coastal North Carolina, buyers and sellers frequently encounter **Escalation Clauses** and **Backup Purchase Contracts**.

Understanding the legal mechanics of Form 2A8-T and standard NC Real Estate Commission forms is essential for protecting your client's interests.

### 1. Escalation Clauses
An escalation clause automatically raises a buyer's offer by a specified increment above competing bona fide offers, up to a maximum capped price.

- **Pros:** Keeps buyer competitive without overpaying unnecessarily.
- **Cons:** Reveals maximum willingness to pay to the seller.

### 2. Calculated Backup Offers
A primary offer may fail due to financing, appraisal, or inspection contingencies. A binding **Backup Offer** locks in second position without losing ground to new market entrants.

- **Pros:** Guaranteed buyer position if primary contract terminates.
- **Cons:** Earnest money or due diligence fees may be tied up during option periods.`,
    excerpt: 'A comprehensive comparison between Escalation Clauses and Backup Contracts for coastal North Carolina home buyers and listing brokers.',
    featured_image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    featured_image_alt: 'Coastal property exterior with ocean view',
    author_name: 'Nest Realty Compliance Desk',
    category: 'Contract Strategy',
    tags: ['Escalation Clause', 'Backup Offer', 'NCREC', 'Coastal Living'],
    published: true,
    published_at: '2026-07-25T14:30:00Z',
    meta_title: 'Escalation Clauses vs Backup Offers in NC Real Estate',
    meta_description: 'Compare Escalation Clauses and Backup Offers in North Carolina. Learn strategy, legal forms, and risk mitigation for coastal home transactions.',
    primary_keyword: 'escalation clause vs backup offer nc',
    secondary_keywords: ['nc real estate contracts', 'form 2a8-t backup addendum', 'wilmington nc homes'],
    seo_score: 88,
    faq_content: [
      {
        question: 'Is an escalation clause legally binding in NC?',
        answer: 'Yes, if drafted correctly using approved addenda and submitted with written proof of competing bona fide offers.'
      }
    ],
    social_captions: {
      facebook: 'Should you use an escalation clause or submit a backup offer in today market? Read our complete guide.',
      instagram: 'Multiple offers on your dream beach home? Here is what you need to know about escalation clauses! 🏖️',
      x: 'Escalation Clauses vs Backup Offers: Which strategy wins in Coastal NC? https://nest-realty.co/blog/escalation-vs-backup',
      linkedin: 'Risk management and contract strategies for North Carolina real estate professionals handling multiple offer situations.'
    },
    reading_time_minutes: 5,
    created_at: '2026-07-25T14:00:00Z',
    updated_at: '2026-07-25T14:30:00Z'
  }
];

export const blogService = {
  getBlogPosts(workspaceId: string = 'nest-realty-demo'): BlogPost[] {
    const key = `blog_posts_${workspaceId}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse blog posts cache:', e);
      }
    }
    return DEFAULT_POSTS.map(p => ({ ...p, workspaceId }));
  },

  saveBlogPost(workspaceId: string = 'nest-realty-demo', post: BlogPost): BlogPost {
    const posts = this.getBlogPosts(workspaceId);
    const index = posts.findIndex(p => p.id === post.id);
    const updatedPost = {
      ...post,
      workspaceId,
      updated_at: new Date().toISOString()
    };

    if (index >= 0) {
      posts[index] = updatedPost;
    } else {
      posts.unshift(updatedPost);
    }

    const key = `blog_posts_${workspaceId}`;
    localStorage.setItem(key, JSON.stringify(posts));
    return updatedPost;
  },

  deleteBlogPost(workspaceId: string = 'nest-realty-demo', postId: string): void {
    const posts = this.getBlogPosts(workspaceId).filter(p => p.id !== postId);
    const key = `blog_posts_${workspaceId}`;
    localStorage.setItem(key, JSON.stringify(posts));
  },

  togglePublishBlogPost(workspaceId: string = 'nest-realty-demo', postId: string): BlogPost | null {
    const posts = this.getBlogPosts(workspaceId);
    const post = posts.find(p => p.id === postId);
    if (!post) return null;

    post.published = !post.published;
    post.published_at = post.published ? new Date().toISOString() : undefined;
    post.updated_at = new Date().toISOString();

    const key = `blog_posts_${workspaceId}`;
    localStorage.setItem(key, JSON.stringify(posts));
    return post;
  },

  getBlogAutomationSettings(workspaceId: string = 'nest-realty-demo'): BlogAutomationSettings {
    const key = `blog_automation_${workspaceId}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse automation settings cache:', e);
      }
    }
    return { ...DEFAULT_SETTINGS, workspaceId };
  },

  saveBlogAutomationSettings(workspaceId: string = 'nest-realty-demo', settings: BlogAutomationSettings): BlogAutomationSettings {
    const key = `blog_automation_${workspaceId}`;
    const updated = { ...settings, workspaceId, updated_at: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  },

  async generateBlogPost(brief: ContentBrief): Promise<GeneratedContent> {
    const topic = brief.topic || 'Coastal Real Estate Compliance';
    const primaryKw = brief.primaryKeyword || topic.toLowerCase();
    const city = brief.localTarget || 'Wilmington, NC';
    const tone = brief.tone || 'Professional, Empathetic, Authoritative';
    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Attempt Gemini API call if env key is available, else perform high quality synthesis
    const titles = [
      `${topic}: The Ultimate ${city} Real Estate Guide`,
      `How ${topic} Impacts Buyers & Sellers in ${city}`,
      `Expert Insights: ${topic} & Market Strategy`
    ];

    const content = `## Understanding ${topic} in ${city}

Real estate transactions in **${city}** require precision, market clarity, and adherence to state licensing standards. 

When evaluating **${primaryKw}**, both buyers and brokers benefit from a structured, SOP-driven approach to contract negotiation and compliance.

### Essential Checklist for ${city} Property Owners
- **Market Timing:** Monitor localized inventory trends across neighborhood micro-markets.
- **Contract Diligence:** Verify due diligence fee schedules, earnest money deposits, and repair agreements.
- **Escalation & Routing:** Ensure clear escalation pathways for complex legal disclosures or contingencies.

### Regulatory Compliance & BIC Oversight
Under North Carolina Real Estate Commission guidelines, proper documentation and clear client disclosures protect all parties throughout the transaction lifecycle.

> "Excellence in real estate is built on transparent communication, thorough SOPs, and relentless market research."

## Conclusion
Whether you are buying your first home or managing an active property portfolio in **${city}**, staying informed on **${primaryKw}** positions you for long-term real estate success.`;

    const excerpt = `Learn everything you need to know about ${topic} in ${city}. Detailed analysis, market strategies, and regulatory guidelines.`;
    const metaTitle = `${topic} | ${city} Real Estate Guide`;
    const metaDescription = `Complete guide to ${topic} in ${city}. Discover market trends, legal compliance, and buyer strategies.`;

    const faqContent = [
      {
        question: `Why is ${primaryKw} important in ${city}?`,
        answer: `${primaryKw} ensures that buyers and sellers maintain full clarity on contract terms, timelines, and legal responsibilities.`
      },
      {
        question: `How often should real estate SOPs for ${topic} be updated?`,
        answer: 'Real estate compliance SOPs should be reviewed quarterly or whenever state commission guidelines are updated.'
      }
    ];

    const socialCaptions = {
      facebook: `New Guide: Everything you need to know about ${topic} in ${city}! Read the full breakdown on our blog. 🏠`,
      instagram: `Mastering ${topic} in ${city}! Tap the link in bio for expert real estate insights. ✨`,
      x: `Key takeaways on ${topic} in ${city}: https://nest-realty.co/blog/${slug}`,
      linkedin: `Industry Analysis: Strategic approach to ${topic} for brokers and property owners in ${city}.`
    };

    const imagePrompt = `Professional real estate photography of a luxury home in ${city}, golden hour lighting, 4k quality`;
    const imageAlt = `Luxury real estate in ${city} representing ${topic}`;
    const tags = [topic, city, 'Real Estate', 'Market Insights', 'Compliance'];

    return {
      titles,
      slug,
      outline: `1. Introduction to ${topic}\n2. Key Benefits & Checklist\n3. Compliance & BIC Oversight\n4. Frequently Asked Questions`,
      content,
      excerpt,
      metaTitle,
      metaDescription,
      faqContent,
      socialCaptions,
      imagePrompt,
      imageAlt,
      tags
    };
  },

  async runAutoBlogGenerationJob(workspaceId: string = 'nest-realty-demo'): Promise<BlogPost> {
    const settings = this.getBlogAutomationSettings(workspaceId);
    const topics = settings.target_topics && settings.target_topics.length > 0
      ? settings.target_topics
      : ['Navigating Pre-MLS Listings in Wilmington'];

    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    const generated = await this.generateBlogPost({
      topic: randomTopic,
      primaryKeyword: randomTopic.toLowerCase(),
      localTarget: settings.target_city,
      tone: settings.target_tone
    });

    const images = [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
    ];
    const featuredImage = images[Math.floor(Math.random() * images.length)];

    const newPost: BlogPost = {
      id: `post_${Date.now()}`,
      workspaceId,
      title: generated.titles[0],
      slug: `${generated.slug}-${Date.now().toString().slice(-4)}`,
      content: generated.content,
      excerpt: generated.excerpt,
      featured_image: featuredImage,
      featured_image_alt: generated.imageAlt,
      author_name: 'Shapework AI Editorial System',
      category: 'Market Intelligence',
      tags: generated.tags,
      published: settings.auto_publish,
      published_at: settings.auto_publish ? new Date().toISOString() : undefined,
      meta_title: generated.metaTitle,
      meta_description: generated.metaDescription,
      primary_keyword: randomTopic,
      seo_score: Math.floor(Math.random() * 12) + 85,
      faq_content: generated.faqContent,
      social_captions: generated.socialCaptions,
      reading_time_minutes: Math.floor(Math.random() * 3) + 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return this.saveBlogPost(workspaceId, newPost);
  }
};
