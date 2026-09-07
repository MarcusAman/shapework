/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { ownerDigestEngine, OwnerDigestData } from '../../server/notifications/ownerDigestEngine';
import fs from 'fs';
import path from 'path';

describe('Weekly Owner Digest, TopBar Clean & Maxa Proofs Verification', () => {

  it('1. TopBar.tsx has removed Talk to NORA button and contains zero Sparkles icons', () => {
    const topBarPath = path.join(process.cwd(), 'src/components/layout/TopBar.tsx');
    const content = fs.readFileSync(topBarPath, 'utf-8');

    // Confirm "Talk to NORA" is completely removed from TopBar
    expect(content.includes('Talk to NORA')).toBe(false);
    expect(content.includes('open-nora-voice-drawer')).toBe(false);

    // Confirm no Sparkles or SparklesIcon
    expect(content.includes('<Sparkles')).toBe(false);
    expect(content.includes('SparklesIcon')).toBe(false);

    // Confirm Direct phone line and email are present
    expect(content.includes('910-507-2047')).toBe(true);
    expect(content.includes('AskNora@nestrealty.com')).toBe(true);
  });

  it('2. ContactSupportModal.tsx uses direct phone call and contains zero Sparkles icons', () => {
    const supportModalPath = path.join(process.cwd(), 'src/components/shared/ContactSupportModal.tsx');
    const content = fs.readFileSync(supportModalPath, 'utf-8');

    expect(content.includes('Talk to NORA')).toBe(false);
    expect(content.includes('<Sparkles')).toBe(false);
    expect(content.includes('tel:+19105072047')).toBe(true);
    expect(content.includes('Call 910-507-2047')).toBe(true);
  });

  it('3. ownerDigestEngine.renderDigestHtml produces co-branded email with Nest & Shapework logos', () => {
    const mockData: OwnerDigestData = {
      workspaceId: 'nest-realty-wilmington',
      brokerageName: 'Nest Realty Wilmington',
      principalName: 'Ryan',
      generationDate: 'Monday, August 24, 2026',
      reportingPeriod: 'Week of Aug 24',
      periodId: 'digest_nest_2026_W34',
      needsAttentionCount: 2,
      openRequestsCount: 5,
      resolvedLastWeekCount: 7,
      needsAttention: [
        {
          id: 'item_01',
          title: 'Closing Risk: 742 Lumina Ave ($1,950,000)',
          category: 'Closing Compliance',
          ownerName: 'Ryan Crecelius',
          status: 'Document Blocked',
          daysOverdue: 2
        }
      ],
      openRequests: [
        {
          id: 'item_02',
          title: 'Marketing Suite: 1104 Arboretum Dr',
          category: 'Marketing Production',
          ownerName: 'Eduardo Lovo',
          status: 'In Production'
        }
      ],
      resolvedLastWeek: [
        {
          id: 'item_03',
          title: 'Marketing Suite: 312 Mayfaire Way (Full Package)',
          category: 'Marketing Production',
          ownerName: 'Eduardo Lovo',
          status: 'Delivered',
          completedAt: 'Last week'
        }
      ]
    };

    const html = ownerDigestEngine.renderDigestHtml(mockData);

    // Branding verification
    expect(html).toContain('NEST');
    expect(html).toContain('REALTY');
    expect(html).toContain('SHAPEWORK.');
    expect(html).toContain('Monday Morning Briefing');

    // Section 1: Needs Attention / Overdue
    expect(html).toContain('Needs Attention');
    expect(html).toContain('Closing Risk: 742 Lumina Ave');
    expect(html).toContain('Document Blocked');

    // Section 2: Open Requests
    expect(html).toContain('Active Open Requests');
    expect(html).toContain('Marketing Suite: 1104 Arboretum Dr');

    // Section 3: Resolved Last Week
    expect(html).toContain('Resolved Last Week');
    expect(html).toContain('Marketing Suite: 312 Mayfaire Way');
    expect(html).toContain('Delivered');

    // Action button & Footer
    expect(html).toContain('Open Nest Ops Console');
    expect(html).toContain('Powered by Shapework Operating System');
  });

  it('4. RequestActionModal.tsx displays live returned Maxa templates, 300 DPI proof preview, and multi-select approval triggers', () => {
    const modalPath = path.join(process.cwd(), 'src/components/marketing/RequestActionModal.tsx');
    const content = fs.readFileSync(modalPath, 'utf-8');

    // Zero sparkles
    expect(content.includes('<Sparkles')).toBe(false);
    expect(content.includes('SparklesIcon')).toBe(false);

    // AI recommendation & proofs
    expect(content.includes('Nora Cognitive Recommendation')).toBe(true);
    expect(content.includes('Generated Marketing Proofs (300 DPI Vector PDF)')).toBe(true);

    // 3 templates preview
    expect(content.includes('Property Flyer')).toBe(true);
    expect(content.includes('Social Story')).toBe(true);
    expect(content.includes('EDDM Postcard')).toBe(true);

    // Multi-select approval triggers
    expect(content.includes('Eduardo Lovo (Virtual Assistant)')).toBe(true);
    expect(content.includes('Melissa Gagliardi (Marketing Director)')).toBe(true);
    expect(content.includes('Send for Approval')).toBe(true);
  });

  it('5. MarketingHomeInbox.tsx replaces Studio button with Handle button and connects RequestActionModal', () => {
    const inboxPath = path.join(process.cwd(), 'src/components/marketing/MarketingHomeInbox.tsx');
    const content = fs.readFileSync(inboxPath, 'utf-8');

    // Verify "Handle" button replaced Studio button
    expect(content.includes('>Handle<')).toBe(true);
    expect(content.includes('RequestActionModal')).toBe(true);
    expect(content.includes('selectedActionCampaign')).toBe(true);
  });

  it('6. TopBar.tsx renders Tasks & Operations title and unified pipeline description on Tasks tab', () => {
    const topBarPath = path.join(process.cwd(), 'src/components/layout/TopBar.tsx');
    const content = fs.readFileSync(topBarPath, 'utf-8');

    expect(content.includes('Tasks & Operations')).toBe(true);
    expect(content.includes('Unified Pipeline')).toBe(true);
    expect(content.includes('Unified brokerage pipeline for property marketing collateral, yard sign installations, lockboxes, and operational workflows.')).toBe(true);
  });

  it('7. unifiedContextRetriever asks clarifying questions when asked to create a meeting without details', async () => {
    const { queryUnifiedContext } = await import('../../server/knowledge/unifiedContextRetriever');
    
    // Underspecified meeting prompt
    const res = queryUnifiedContext('can you create a meeting for me', {
      workspaceId: 'nest-realty-wilmington',
      tenantId: 'tenant_nest_uat'
    });

    expect(res.spokenAnswer).toContain("What is the meeting title, date and time, who should I invite");
    expect(res.displayResponse).toContain("Schedule a Meeting — Calendar Dispatch");
    expect(res.displayResponse).toContain("1. **Title & Purpose**");
    expect(res.displayResponse).toContain("2. **Date & Time**");
    expect(res.displayResponse).toContain("3. **Attendees**");
    expect(res.displayResponse).toContain("4. **Location / Video**");
  });

});

