/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  MARKETING_SOPS,
  getTeamMemberSops,
  getCampaignGoverningSop
} from '../components/marketing/marketingSopRegistry';
import { TEAM_MEMBERS } from '../components/marketing/MarketingHomeInbox';

describe('Marketing Team Members and Workstation SOP Connections', () => {
  it('1. All standard marketing and operational SOPs are registered with ordered steps and checklists', () => {
    expect(MARKETING_SOPS['SOP-MKT-001']).toBeDefined();
    expect(MARKETING_SOPS['SOP-MKT-001'].title).toContain('Marketing Intake');
    expect(MARKETING_SOPS['SOP-MKT-001'].orderedSteps.length).toBeGreaterThan(0);
    expect(MARKETING_SOPS['SOP-MKT-001'].qualityChecklist.length).toBeGreaterThan(0);

    expect(MARKETING_SOPS['SOP-MKT-003']).toBeDefined();
    expect(MARKETING_SOPS['SOP-MKT-003'].ownerName).toBe('Eduardo Lovo');
    expect(MARKETING_SOPS['SOP-MKT-003'].ownerRole).toBe('Virtual Assistant');

    expect(MARKETING_SOPS['SOP-OPS-001']).toBeDefined();
    expect(MARKETING_SOPS['SOP-OPS-001'].ownerName).toBe('Ann Gunn');

    expect(MARKETING_SOPS['SOP-GOV-001']).toBeDefined();
    expect(MARKETING_SOPS['SOP-GOV-001'].ownerName).toBe('Ryan Crecelius');

    expect(MARKETING_SOPS['SOP-BIC-001']).toBeDefined();
    expect(MARKETING_SOPS['SOP-BIC-001'].ownerRole).toContain('Broker-in-Charge');
  });

  it('2. getTeamMemberSops correctly maps each team member to their governing SOPs', () => {
    // Eduardo Lovo (VA)
    const eduardoSops = getTeamMemberSops('Eduardo Lovo');
    expect(eduardoSops.some(s => s.code === 'SOP-MKT-003')).toBe(true);
    expect(eduardoSops.some(s => s.code === 'SOP-MKT-004')).toBe(true);

    // Melissa Gagliardi (Marketing PM / Director)
    const melissaSops = getTeamMemberSops('Melissa Gagliardi');
    expect(melissaSops.some(s => s.code === 'SOP-MKT-001')).toBe(true);
    expect(melissaSops.some(s => s.code === 'SOP-MKT-002')).toBe(true);

    // Ann Gunn (Signs & Operations)
    const annSops = getTeamMemberSops('Ann Gunn');
    expect(annSops.some(s => s.code === 'SOP-OPS-001')).toBe(true);

    // Ryan Crecelius (Owner / Principal Broker)
    const ryanSops = getTeamMemberSops('Ryan Crecelius');
    expect(ryanSops.some(s => s.code === 'SOP-GOV-001')).toBe(true);

    // Eric Knight / Jessica Keenan (BIC)
    const bicSops = getTeamMemberSops('Jessica Keenan');
    expect(bicSops.some(s => s.code === 'SOP-BIC-001')).toBe(true);
  });

  it('3. getCampaignGoverningSop maps packages and requests to authoritative SOPs', () => {
    // Luxury Print Collateral
    const printSop = getCampaignGoverningSop('Luxury Collateral Suite (Print + Social)');
    expect(printSop.code).toBe('SOP-MKT-003');

    // Social Media Blitz
    const socialSop = getCampaignGoverningSop('Social Media Reel & Story Package');
    expect(socialSop.code).toBe('SOP-MKT-002');

    // Sign Post Dispatch
    const signSop = getCampaignGoverningSop('Sign Post Installation', 'Yard post order');
    expect(signSop.code).toBe('SOP-OPS-001');

    // BIC Compliance
    const complianceSop = getCampaignGoverningSop('Contract Compliance Audit', 'Form 2-T review');
    expect(complianceSop.code).toBe('SOP-BIC-001');
  });

  it('4. TEAM_MEMBERS definitions include primary governing SOP references', () => {
    expect(TEAM_MEMBERS.length).toBeGreaterThanOrEqual(6);
    TEAM_MEMBERS.forEach(member => {
      expect((member as any).primarySop).toBeDefined();
      expect((member as any).primarySop).toMatch(/^SOP-/);
    });
  });
});
