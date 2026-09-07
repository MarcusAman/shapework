/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  MARKET_INTELLIGENCE_SUBTABS,
  MARKET_INTELLIGENCE_ALIASES
} from '../components/market-intelligence/marketIntelligenceSubtabs';
import { MARKETING_SUBTABS } from '../components/marketing/marketingSubtabs';
import { getProductProfile } from '../config/productProfiles';
import fs from 'fs';
import path from 'path';

describe('Market Intelligence Dedicated Page and Subtabs Suite', () => {
  it('1. Verifies 5 dedicated intelligence subtabs in MARKET_INTELLIGENCE_SUBTABS', () => {
    const tabIds = MARKET_INTELLIGENCE_SUBTABS.map(t => t.id);
    expect(tabIds).toEqual(['comps', 'roi', 'recruiting', 'bic_compliance', 'nora_employee']);

    const compsTab = MARKET_INTELLIGENCE_SUBTABS.find(t => t.id === 'comps');
    expect(compsTab?.label).toBe('Spatial Comps');
    expect(compsTab?.secondaryLabel).toBe('Offer Map');

    const roiTab = MARKET_INTELLIGENCE_SUBTABS.find(t => t.id === 'roi');
    expect(roiTab?.label).toBe('Executive ROI');
    expect(roiTab?.secondaryLabel).toBe('21.8x ROAS');

    const recruitingTab = MARKET_INTELLIGENCE_SUBTABS.find(t => t.id === 'recruiting');
    expect(recruitingTab?.label).toBe('Recruiting & MLS');
    expect(recruitingTab?.secondaryLabel).toBe('$90.1M Target');

    const bicTab = MARKET_INTELLIGENCE_SUBTABS.find(t => t.id === 'bic_compliance');
    expect(bicTab?.label).toBe('BIC Sentinel');
    expect(bicTab?.secondaryLabel).toBe('3-Day Banking');

    const noraTab = MARKET_INTELLIGENCE_SUBTABS.find(t => t.id === 'nora_employee');
    expect(noraTab?.label).toBe('Nora Employee');
    expect(noraTab?.secondaryLabel).toBe('Autonomous Hub');
  });

  it('2. Verifies Marketing Intake page contains strictly 4 operational subtabs', () => {
    const marketingTabIds = MARKETING_SUBTABS.map(t => t.id);
    expect(marketingTabIds).toEqual(['requests', 'calls', 'today', 'va']);
  });

  it('3. Verifies Market Intelligence aliases resolve correctly', () => {
    expect(MARKET_INTELLIGENCE_ALIASES['comps']).toBe('comps');
    expect(MARKET_INTELLIGENCE_ALIASES['spatial-comps']).toBe('comps');
    expect(MARKET_INTELLIGENCE_ALIASES['roi']).toBe('roi');
    expect(MARKET_INTELLIGENCE_ALIASES['recruiting']).toBe('recruiting');
    expect(MARKET_INTELLIGENCE_ALIASES['bic_compliance']).toBe('bic_compliance');
    expect(MARKET_INTELLIGENCE_ALIASES['nora_employee']).toBe('nora_employee');
  });

  it('4. Verifies Market Intelligence is registered in product profiles for ryan_pilot and full_customer', () => {
    const ryanProfile = getProductProfile('ryan@nestrealty.com', 'owner', 'nest-realty-wilmington');
    const hasMarketIntelligenceRyan = ryanProfile.modules.some(m => m.tab === 'Market Intelligence' && m.visible);
    expect(hasMarketIntelligenceRyan).toBe(true);

    const fullProfile = getProductProfile('admin@nestrealty.com', 'admin', 'nest-realty-wilmington');
    const hasMarketIntelligenceFull = fullProfile.modules.some(m => m.tab === 'Market Intelligence' && m.visible);
    expect(hasMarketIntelligenceFull).toBe(true);
  });

  it('5. Verifies MarketIntelligenceConsole.tsx exists and renders navigation and view containers', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/market-intelligence/MarketIntelligenceConsole.tsx');
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('Market Intelligence');
    expect(content).toContain('SpatialCompsView');
    expect(content).toContain('BrokerageMarketingRoiCommandCenter');
    expect(content).toContain('RecruitingAndMarketShareCommandCenter');
    expect(content).toContain('BicComplianceCommandCenter');
    expect(content).toContain('NoraAutonomousEmployeeHub');
    expect(content).toContain('market-intelligence-shell');
  });

  it('6. Verifies useWorkspaceConsoleState correctly resolves Market Intelligence routes and paths', () => {
    const stateFile = fs.readFileSync(path.resolve(process.cwd(), 'src/state/useWorkspaceConsoleState.ts'), 'utf-8');
    expect(stateFile).toContain("clean.startsWith('/demo/market-intelligence')");
    expect(stateFile).toContain("clean.startsWith('/demo/marketing-intelligence')");
    expect(stateFile).toContain("return `${prefix}/market-intelligence`");
  });

  it('7. Verifies CustomerAppRoutes correctly handles all Market/Marketing Intelligence aliases', () => {
    const routesFile = fs.readFileSync(path.resolve(process.cwd(), 'src/routes/CustomerAppRoutes.tsx'), 'utf-8');
    expect(routesFile).toContain("case 'Market Intelligence':");
    expect(routesFile).toContain("case 'Marketing Intelligence':");
    expect(routesFile).toContain("case 'market-intelligence':");
    expect(routesFile).toContain("case 'marketing-intelligence':");
    expect(routesFile).toContain("<MarketIntelligenceConsole");
  });

  it('8. Renders MarketIntelligenceConsole across all 5 subtabs without crashing', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { MarketIntelligenceConsole } = await import('../components/market-intelligence/MarketIntelligenceConsole');
    const { ToastProvider } = await import('../components/ui/ToastContext');

    const tabs = ['comps', 'roi', 'recruiting', 'bic_compliance', 'nora_employee'] as const;
    for (const tab of tabs) {
      const html = renderToStaticMarkup(
        React.createElement(
          ToastProvider,
          null,
          React.createElement(MarketIntelligenceConsole, { initialTab: tab })
        )
      );
      expect(html).toContain('Market Intelligence');
    }
  });

  it('9. Verifies Ryan profile (ryan@nestrealty.com) allowed tabs includes Market Intelligence and subtabs without flashing or redirecting to Workboard', () => {
    const ryanProfile = getProductProfile('ryan@nestrealty.com', 'owner', 'nest-realty-wilmington');
    const moduleTabs = ryanProfile.modules.filter(m => m.enabled).map(m => m.tab);
    expect(moduleTabs).toContain('Market Intelligence');

    const stateFile = fs.readFileSync(path.resolve(process.cwd(), 'src/state/useWorkspaceConsoleState.ts'), 'utf-8');
    expect(stateFile).toContain("'Market Intelligence'");
    expect(stateFile).toContain("getProductProfile(activeProfile?.email");
  });
});
