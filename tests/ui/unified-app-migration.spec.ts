/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Phase C — Unified App Migration & Contrast Acceptance Tests
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RyanShieldPage from '../../src/components/nest-wilmington/RyanShieldPage';
import OwnerWeeklyBriefPage from '../../src/components/nest-wilmington/OwnerWeeklyBriefPage';
import PreMLSBoard from '../../src/components/brokerage-ops/PreMLSBoard';
import VendorDispatchBoard from '../../src/components/brokerage-ops/VendorDispatchBoard';
import OperatingRecordPage from '../../src/components/operating-record/OperatingRecordPage';
import ClosingComplianceGuard from '../../src/components/transactions/ClosingComplianceGuard';
import MyConnections from '../../src/components/brokerage-ops/MyConnections';
import WorkQueue from '../../src/components/layout/WorkQueue';
import ApprovalCenter from '../../src/components/approvals/ApprovalCenter';
import WeeklyOwnerBrief from '../../src/components/command/WeeklyOwnerBrief';
import CollapsibleNavigationRail from '../../src/components/layout/CollapsibleNavigationRail';

const mockProfile = {
  id: 'p1',
  name: 'Ryan Crecelius',
  email: 'ryan@nestrealty.com',
  role: 'owner' as const
};

const mockRyanShieldData = {
  needsRyan: [
    { id: '1', type: 'Commission Cut Veto', summary: 'Agent requested 1% fee reduction', impact: 'Financial Exception', urgency: 'urgent' as const }
  ],
  handled: [
    { category: 'Marketing request', count: 12, handler: 'Melissa Gagliardi' }
  ],
  atRisk: []
};

const mockOwnerBriefData = {
  activity: {
    requestsHandled: 24,
    routedWithoutRyan: 22,
    neededRyan: 2,
    stillOpen: 3,
    overdue: 0,
    missingInformation: 1
  },
  handled: [
    { category: 'Marketing', count: 10, handler: 'Melissa Gagliardi' }
  ],
  neededRyan: [
    { type: 'Legal Dispute Veto', resolution: 'Vetoed by Ryan', count: 1 }
  ],
  stuck: []
};

describe('Phase C — Unified App Migration & Light-Mode Contract', () => {
  it('1. RyanShieldPage renders canonical primitives and zero dark container wrappers', () => {
    const html = renderToStaticMarkup(React.createElement(RyanShieldPage, { data: mockRyanShieldData as any }));
    
    // Must contain canonical text tokens and titles
    expect(html).toContain('Good morning, Ryan');
    expect(html).toContain('var(--sw-text-primary)');
    expect(html).toContain('var(--sw-text-secondary)');
    
    // Must NOT contain hardcoded legacy dark green containers or dark background rgba text
    expect(html).not.toContain('rgba(246, 247, 241, 0.10)');
    expect(html).not.toContain('bg-[#00E5C9]');
    expect(html).not.toContain('text-[#D0D6BB]/60');
  });

  it('2. OwnerWeeklyBriefPage renders canonical DataTable, MetricTile, and zero dark background rgba', () => {
    const html = renderToStaticMarkup(React.createElement(OwnerWeeklyBriefPage, { data: mockOwnerBriefData as any }));
    
    expect(html).toContain('Weekly Owner Brief');
    expect(html).toContain('Total Requests Handled');
    expect(html).toContain('var(--sw-text-primary)');
    
    expect(html).not.toContain('rgba(246, 247, 241, 0.10)');
    expect(html).not.toContain('text-[#D0D6BB]');
  });

  it('3. PreMLSBoard renders light-mode canvas, cards, and metric tiles', () => {
    const html = renderToStaticMarkup(React.createElement(PreMLSBoard));
    
    expect(html).toContain('Internal Off-Market &amp; Pre-MLS Match Board');
    expect(html).toContain('var(--sw-text-primary)');
    expect(html).not.toContain('text-[#F6F7F1]');
    expect(html).not.toContain('rgba(246, 247, 241, 0.10)');
  });

  it('4. VendorDispatchBoard renders light-mode cards and metric tiles', () => {
    const html = renderToStaticMarkup(React.createElement(VendorDispatchBoard));
    
    expect(html).toContain('Inspection Repair Addendum Contractor Dispatch Board');
    expect(html).toContain('var(--sw-text-primary)');
    expect(html).not.toContain('text-[#F6F7F1]');
  });

  it('5. OperatingRecordPage renders light-mode canvas and metric tiles', () => {
    const html = renderToStaticMarkup(React.createElement(OperatingRecordPage));
    
    expect(html).toContain('Operating Record &amp; System Map');
    expect(html).toContain('var(--sw-text-primary)');
    expect(html).not.toContain('rgba(246, 247, 241, 0.08)');
  });

  it('6. ClosingComplianceGuard renders light-mode canvas and metric tiles', () => {
    const html = renderToStaticMarkup(React.createElement(ClosingComplianceGuard, { state: { transactions: [] } }));
    
    expect(html).toContain('Closing File Risk &amp; Missing Document Guard');
    expect(html).toContain('var(--sw-text-primary)');
    expect(html).not.toContain('text-[#F6F7F1]');
  });

  it('7. MyConnections renders light-mode canvas and metric tiles', () => {
    const html = renderToStaticMarkup(React.createElement(MyConnections, { state: { workspaceId: 'nest-realty-demo' } }));
    
    expect(html).toContain('Integrations &amp; Communication Channels');
    expect(html).toContain('var(--sw-text-primary)');
    expect(html).not.toContain('text-[#F6F7F1]');
  });

  it('8. WorkQueue renders light mode tokens and no dark glass background classes', () => {
    const html = renderToStaticMarkup(React.createElement(WorkQueue, { state: { auditEvents: [] } }));
    
    expect(html).toContain('Work Queue');
    expect(html).toContain('var(--sw-text-primary)');
    expect(html).not.toContain('text-[#F6F7F1]');
    expect(html).not.toContain('bg-rose-950/40');
  });

  it('9. ApprovalCenter renders light mode cards and dark primary title', () => {
    const html = renderToStaticMarkup(React.createElement(ApprovalCenter, { state: { pendingActions: [] } }));
    
    expect(html).toContain('Approval Center');
    expect(html).toContain('var(--sw-text-primary)');
    expect(html).not.toContain('rgba(246, 247, 241, 0.10)');
  });

  it('10. WeeklyOwnerBrief renders light mode tokens and zero legacy white-on-white dark classes', () => {
    const html = renderToStaticMarkup(React.createElement(WeeklyOwnerBrief, { state: {} }));
    
    expect(html).toContain('Weekly Owner Brief &amp; Shield');
    expect(html).toContain('var(--sw-text-primary)');
    expect(html).not.toContain('text-[#F6F7F1]');
    expect(html).not.toContain('rgba(246, 247, 241, 0.10)');
    expect(html).not.toContain('bg-[#00635C]');
  });

  describe('Phase C.1.1 — Navigation Rail State Matrix', () => {
    it('11. Inactive nav items retain readable text and hover brand-soft tokens', () => {
      const html = renderToStaticMarkup(
        React.createElement(CollapsibleNavigationRail, {
          currentTab: 'Workboard',
          setCurrentTab: () => {},
          collapsed: false,
          setCollapsed: () => {},
          activeProfile: mockProfile as any,
          isMobileOpen: false,
          setIsMobileOpen: () => {},
          workspaceId: 'nest-realty-demo'
        })
      );

      // Inactive item has secondary text and hover brand-soft overlay
      expect(html).toContain('text-[var(--sw-text-secondary)]');
      expect(html).toContain('hover:bg-[var(--brand-soft)]');
      expect(html).toContain('hover:text-[var(--brand-primary)]');
      expect(html).not.toContain('hover:text-white');
      expect(html).not.toContain('hover:text-transparent');
    });

    it('12. Active nav item renders high contrast brand filled state', () => {
      const html = renderToStaticMarkup(
        React.createElement(CollapsibleNavigationRail, {
          currentTab: 'Workboard',
          setCurrentTab: () => {},
          collapsed: false,
          setCollapsed: () => {},
          activeProfile: mockProfile as any,
          isMobileOpen: false,
          setIsMobileOpen: () => {},
          workspaceId: 'nest-realty-demo'
        })
      );

      expect(html).toContain('nav-item-active');
      expect(html).toContain('bg-[var(--brand-primary)]');
      expect(html).toContain('text-white');
    });

    it('13. Keyboard focus ring classes are exposed on interactive elements', () => {
      const html = renderToStaticMarkup(
        React.createElement(CollapsibleNavigationRail, {
          currentTab: 'Workboard',
          setCurrentTab: () => {},
          collapsed: false,
          setCollapsed: () => {},
          activeProfile: mockProfile as any,
          isMobileOpen: false,
          setIsMobileOpen: () => {},
          workspaceId: 'nest-realty-demo'
        })
      );

      expect(html).toContain('focus-visible:ring-2');
      expect(html).toContain('focus-visible:ring-[var(--brand-primary)]');
    });

    it('14. Collapsed rail renders light surface tooltips with dark readable text', () => {
      const html = renderToStaticMarkup(
        React.createElement(CollapsibleNavigationRail, {
          currentTab: 'Workboard',
          setCurrentTab: () => {},
          collapsed: true,
          setCollapsed: () => {},
          activeProfile: mockProfile as any,
          isMobileOpen: false,
          setIsMobileOpen: () => {},
          workspaceId: 'nest-realty-demo'
        })
      );

      expect(html).toContain('bg-[var(--sw-surface)]');
      expect(html).toContain('text-[var(--sw-text-primary)]');
      expect(html).toContain('border border-[var(--sw-border)]');
      expect(html).toContain('z-50');
      expect(html).not.toContain('bg-stone-900 text-white');
    });

    it('15. Neutral workspace theme renders semantic CSS variable tokens', () => {
      const html = renderToStaticMarkup(
        React.createElement(CollapsibleNavigationRail, {
          currentTab: 'Workboard',
          setCurrentTab: () => {},
          collapsed: false,
          setCollapsed: () => {},
          activeProfile: mockProfile as any,
          isMobileOpen: false,
          setIsMobileOpen: () => {},
          workspaceId: 'default-neutral-demo'
        })
      );

      expect(html).toContain('bg-[var(--sw-surface)]');
      expect(html).toContain('border-[var(--sw-border)]');
      expect(html).toContain('text-[var(--sw-text-primary)]');
      expect(html).not.toContain('#00635C');
    });

    it('16. Mobile navigation drawer applies touch target sizing and identical state matrix', () => {
      const html = renderToStaticMarkup(
        React.createElement(CollapsibleNavigationRail, {
          currentTab: 'Workboard',
          setCurrentTab: () => {},
          collapsed: false,
          setCollapsed: () => {},
          activeProfile: mockProfile as any,
          isMobileOpen: true,
          setIsMobileOpen: () => {},
          workspaceId: 'nest-realty-demo'
        })
      );

      expect(html).toContain('md:hidden fixed inset-0 z-50');
      expect(html).toContain('min-h-[40px]');
      expect(html).toContain('text-[var(--sw-text-secondary)]');
    });
  });
});
