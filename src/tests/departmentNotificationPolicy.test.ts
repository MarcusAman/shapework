import { describe, it, expect } from 'vitest';
import {
  getResponsibleDepartmentOwner,
  getNotificationCcEmail,
  shouldCcDepartmentOwner
} from '../../server/policies/departmentNotificationPolicyEngine';
import {
  isAllowedEmailRecipient,
  ALLOWED_TEST_EMAIL_RECIPIENTS
} from '../../server/email/emailProvider';
import { emailInboundWebhookRouter } from '../../server/routes/emailInboundWebhookRouter';
import {
  getAllCanonicalMarketingRequests,
  archiveCanonicalMarketingRequestAndTasks
} from '../../server/persistence/marketingCampaignsRepository.js';

describe('Department Notification Policy Engine & CC Routing Test Suite', () => {
  it('1. Verifies Melissa Gagliardi (melissa.gagliardi@nestrealty.com) is strictly assigned and CCd ONLY for marketing', () => {
    // Marketing Deliverables
    const flyerOwner = getResponsibleDepartmentOwner({ category: 'print', title: '1-Page Property Flyer (8.5x11)' });
    expect(flyerOwner.name).toBe('Melissa Gagliardi');
    expect(flyerOwner.email).toBe('melissa.gagliardi@nestrealty.com');
    expect(flyerOwner.department).toBe('marketing');

    const socialOwner = getResponsibleDepartmentOwner({ category: 'social', title: '3-Slide Instagram Story Carousel' });
    expect(socialOwner.name).toBe('Melissa Gagliardi');
    expect(socialOwner.email).toBe('melissa.gagliardi@nestrealty.com');

    const openHouseOwner = getResponsibleDepartmentOwner({ category: 'open_house', title: 'Open House Kit' });
    expect(openHouseOwner.name).toBe('Melissa Gagliardi');
    expect(openHouseOwner.email).toBe('melissa.gagliardi@nestrealty.com');
  });

  it('2. Verifies Signage requests are routed and CCd to Ann Gunn (ann.gunn@nestrealty.com)', () => {
    const signageOwner = getResponsibleDepartmentOwner({ category: 'signage', title: 'Yard Sign Post & Custom Rider Installation' });
    expect(signageOwner.name).toBe('Ann Gunn');
    expect(signageOwner.email).toBe('ann.gunn@nestrealty.com');
    expect(signageOwner.department).toBe('signage');

    const ccEmail = getNotificationCcEmail({ category: 'signage', eventType: 'intake' });
    expect(ccEmail).toBe('ann.gunn@nestrealty.com');
  });

  it('3. Verifies Contracts requests are routed and CCd to Ryan Crecelius (ryan@nestrealty.com)', () => {
    const contractOwner = getResponsibleDepartmentOwner({ category: 'contracts', title: 'NC Form 2-T Purchase Contract Review' });
    expect(contractOwner.name).toBe('Ryan Crecelius');
    expect(contractOwner.email).toBe('ryan@nestrealty.com');
    expect(contractOwner.department).toBe('contracts');

    const ccEmail = getNotificationCcEmail({ category: 'contracts', eventType: 'review' });
    expect(ccEmail).toBe('ryan@nestrealty.com');
  });

  it('4. Verifies VA / Maxa asset production is routed to Eduardo Lovo (eduardo@nestrealty.com)', () => {
    const vaOwner = getResponsibleDepartmentOwner({ category: 'production', assignee: 'Eduardo Lovo' });
    expect(vaOwner.name).toBe('Eduardo Lovo');
    expect(vaOwner.email).toBe('eduardo@nestrealty.com');
    expect(vaOwner.department).toBe('production');
  });

  it('5. Verifies melissa.gagliardi@nestrealty.com is suppressed by safety gate per directive', () => {
    expect(ALLOWED_TEST_EMAIL_RECIPIENTS).not.toContain('melissa.gagliardi@nestrealty.com');
    expect(isAllowedEmailRecipient('melissa.gagliardi@nestrealty.com')).toBe(false);
    expect(isAllowedEmailRecipient('ann.gunn@nestrealty.com')).toBe(false);
  });

  it('6. Verifies Inbound Webhook automatically assigns Marketing tasks to Melissa and Signage tasks to Ann', async () => {
    // Ensure no stale requests conflict on test addresses
    const existingReqs = getAllCanonicalMarketingRequests();
    for (const r of existingReqs) {
      if (r.propertyAddress?.includes('1916 Wolcott') || r.propertyAddress?.includes('212 Wetland') || (r as any).normalizedPropertyKey?.includes('WOLCOTT') || (r as any).normalizedPropertyKey?.includes('WETLAND')) {
        archiveCanonicalMarketingRequestAndTasks(r.id);
      }
    }
    try {
      const { getDbPool } = await import('../../server/persistence/repositories.js');
      const pool = getDbPool ? getDbPool() : null;
      if (pool) {
        await pool.query(`UPDATE canonical_marketing_requests SET is_archived = true WHERE property_address ILIKE '%1916 Wolcott%' OR property_address ILIKE '%212 Wetland%' OR normalized_property_key ILIKE '%WETLAND%' OR normalized_property_key ILIKE '%WOLCOTT%'`);
      }
    } catch {}

    // Marketing Intake
    const mktPayload = {
      from: 'Marcus Aman <marcus.aman@gmail.com>',
      to: 'AskNora@nestrealty.com',
      subject: '1916 Wolcott Ave Marketing Request',
      text: 'Please prepare property flyer for 1916 Wolcott Ave.'
    };

    const mktRes = await new Promise<{ status: number; body: any }>((resolve) => {
      const mockReq: any = {
        method: 'POST',
        url: '/inbound',
        body: mktPayload,
        headers: { 'content-type': 'application/json' }
      };
      const mockRes: any = {
        status: (s: number) => ({ json: (d: any) => resolve({ status: s, body: d }) }),
        json: (d: any) => resolve({ status: 200, body: d })
      };
      (emailInboundWebhookRouter as any).handle(mockReq, mockRes, (err?: any) => {
        if (err) resolve({ status: 500, body: { error: err.message } });
      });
    });

    expect(mktRes.body.assignedTo).toBe('Melissa Gagliardi');
    expect(mktRes.body.ccRecipient).toBe('melissa.gagliardi@nestrealty.com');

    // Signage Intake
    try {
      const { getDbPool } = await import('../../server/persistence/repositories.js');
      const pool = getDbPool ? getDbPool() : null;
      if (pool) {
        await pool.query(`UPDATE canonical_marketing_requests SET is_archived = true WHERE normalized_property_key LIKE '%WETLAND%' AND agent_name NOT LIKE '%Marcus%'`);
      }
    } catch {}

    const signPayload = {
      from: 'Marcus Aman <marcus.aman@gmail.com>',
      to: 'AskNora@nestrealty.com',
      subject: '212 Wetland Drive Yard Sign Post & Rider Request',
      text: 'Please install yard sign and open house rider at 212 Wetland Drive.'
    };

    const signRes = await new Promise<{ status: number; body: any }>((resolve) => {
      const mockReq: any = {
        method: 'POST',
        url: '/inbound',
        body: signPayload,
        headers: { 'content-type': 'application/json' }
      };
      const mockRes: any = {
        status: (s: number) => ({ json: (d: any) => resolve({ status: s, body: d }) }),
        json: (d: any) => resolve({ status: 200, body: d })
      };
      (emailInboundWebhookRouter as any).handle(mockReq, mockRes, (err?: any) => {
        if (err) resolve({ status: 500, body: { error: err.message } });
      });
    });

    expect(signRes.body.assignedTo).toBe('Ann Gunn');
    expect(signRes.body.ccRecipient).toBe('ann.gunn@nestrealty.com');
  }, 15000);
});
