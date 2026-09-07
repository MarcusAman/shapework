import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DeliverableLightboxModal, DeliverableItem } from '../components/marketing/DeliverableLightboxModal';
import { getSlaUrgencyInfo, VAWorkspaceView } from '../components/marketing/VAWorkspaceView';
import { MarketingHomeInbox } from '../components/marketing/MarketingHomeInbox';

describe('Marketing Intake Console Polish & Deliverable Lightbox Suite', () => {

  describe('1. DeliverableLightboxModal (300 DPI High-Res Inspector)', () => {
    const mockItem: DeliverableItem = {
      title: '8.5x11 Double-Sided Property Flyer',
      type: 'Flyer',
      previewUrl: 'https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/229058/image/original/open-uri20260804-25191-essk58.jpg',
      dimensions: '8.5 x 11 in (Letter)',
      specs: 'Front Hero + 3 Interior Photos, NCREC Brokerage Disclosures',
      propertyAddress: '1104 Arboretum Dr, Wilmington, NC',
      price: '$1,250,000'
    };

    it('renders modal with 300 DPI Vector badge, dimensions, and specifications', () => {
      const html = renderToStaticMarkup(
        <DeliverableLightboxModal
          isOpen={true}
          item={mockItem}
          onClose={() => {}}
        />
      );

      expect(html).toContain('deliverable-lightbox-modal');
      expect(html).toContain('8.5x11 Double-Sided Property Flyer');
      expect(html).toContain('300 DPI Vector');
      expect(html).toContain('Download PDF');
      expect(html).toContain('8.5 x 11 in (Letter)');
      expect(html).toContain('1104 Arboretum Dr');
    });

    it('returns empty when isOpen is false', () => {
      const html = renderToStaticMarkup(
        <DeliverableLightboxModal
          isOpen={false}
          item={mockItem}
          onClose={() => {}}
        />
      );
      expect(html).toBe('');
    });
  });

  describe('2. Live SLA Urgency Info & Countdown Calculation', () => {
    it('returns urgent SLA when targetSla contains "today" or priority is urgent', () => {
      const sla = getSlaUrgencyInfo('Today 3:00 PM', 'urgent', 'in_production');
      expect(sla.isUrgent).toBe(true);
      expect(sla.label).toContain('Due Today');
      expect(sla.color).toContain('rose');
    });

    it('returns high priority SLA for tomorrow deadlines', () => {
      const sla = getSlaUrgencyInfo('Tomorrow 10:00 AM', 'normal', 'in_production');
      expect(sla.isUrgent).toBe(false);
      expect(sla.label).toContain('High Priority (Tomorrow 10:00 AM)');
      expect(sla.color).toContain('amber');
    });

    it('returns on schedule verified status for completed or review-ready items', () => {
      const sla = getSlaUrgencyInfo('Today 5:00 PM', 'urgent', 'completed');
      expect(sla.isUrgent).toBe(false);
      expect(sla.label).toBe('On Schedule · Verified');
      expect(sla.color).toContain('emerald');
    });

    it('returns standard SLA for routine 48h turnaround items', () => {
      const sla = getSlaUrgencyInfo('Friday 5:00 PM', 'normal', 'in_production');
      expect(sla.isUrgent).toBe(false);
      expect(sla.label).toContain('Standard SLA (48h Turnaround)');
      expect(sla.color).toContain('slate');
    });
  });

  describe('3. MarketingHomeInbox & VAWorkspaceView Light Mode & SLA Badges', () => {
    it('renders multi-select checkbox column and SLA urgency chips in MarketingHomeInbox', () => {
      const mockCampaigns = [
        {
          id: 'campaign_1104_arboretum',
          propertyAddress: '1104 Arboretum Dr, Wilmington, NC',
          agentName: 'Jessica Keenan',
          packageType: 'Luxury Collateral Suite',
          status: 'in_production',
          slaTarget: 'Today 3:00 PM',
          priority: 'urgent'
        }
      ];

      const html = renderToStaticMarkup(
        <MarketingHomeInbox
          campaigns={mockCampaigns}
          onSelectCampaign={() => {}}
        />
      );

      expect(html).toContain('aria-label="Select all marketing tasks"');
      expect(html).toContain('Select campaign');
      expect(html).toContain('Due Today');
      expect(html).toContain('Handle');
      expect(html).toContain('Click to Run Autonomous Maxa Browser Agent');
    });

    it('renders SLA urgency badges in VAWorkspaceView', () => {
      const html = renderToStaticMarkup(
        <VAWorkspaceView
          tasks={[{
            id: 'VA-001',
            title: 'Feature Flyer',
            dueAt: 'Today 5:00 PM',
            priority: 'urgent',
            assignedTo: 'Eduardo Lovo'
          }]}
        />
      );

      expect(html).toContain('Due Today');
      expect(html).toContain('VA-001');
    });
  });
});
