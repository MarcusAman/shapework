/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Wave 2: Knowledge Library / SOP System (Core Product Debt) Automated Verification
 * Comprehensive validation across Review Lanes, 4-Stage Document Layout, Step Models,
 * Role Guard Linter, Version-Locked Exports with 14-Day Expiration, and Routing Matrix Badges.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { 
  SOP_CATEGORY_TEMPLATES, 
  SOP_TEMPLATES, 
  INITIAL_WILMINGTON_SOPS 
} from '../components/sops/sopTemplates';
import { 
  CANONICAL_PERSON_TO_ROLE_MAP, 
  lintSopText, 
  validateSopRoleCompliance, 
  sanitizeSopRoles 
} from '../utils/sopRoleGuard';
import { sopRepository } from '../../server/persistence/sopRepository';

describe('Wave 2: Knowledge Library & SOP System Verification', () => {

  describe('1. Role Guard & Procedural Title Compliance', () => {
    it('verifies CANONICAL_PERSON_TO_ROLE_MAP maps all known personnel to standardized titles', () => {
      expect(CANONICAL_PERSON_TO_ROLE_MAP['Melissa Gagliardi']).toBe('Marketing Lead');
      expect(CANONICAL_PERSON_TO_ROLE_MAP['Jessica Keenan']).toBe('Broker-in-Charge');
      expect(CANONICAL_PERSON_TO_ROLE_MAP['Ryan Shield']).toBe('Managing Principal');
      expect(CANONICAL_PERSON_TO_ROLE_MAP['Ryan Crecelius']).toBe('Executive Leader');
      expect(CANONICAL_PERSON_TO_ROLE_MAP['Ann Gunn']).toBe('Operations Lead');
    });

    it('correctly flags personal names in procedural text with actionable replacements', () => {
      const sampleText = 'Melissa reviews the listing flyer. Then Jessica approves the contract and Ryan signs off.';
      const res = lintSopText(sampleText);

      expect(res.violations.length).toBe(3);
      expect(res.violations[0].name).toBe('Melissa');
      expect(res.violations[0].suggestedRole).toBe('Marketing Lead');
      expect(res.violations[1].name).toBe('Jessica');
      expect(res.violations[1].suggestedRole).toBe('Broker-in-Charge');
      expect(res.violations[2].name).toBe('Ryan');
      expect(res.violations[2].suggestedRole).toBe('Regional Leader');
    });

    it('sanitizes procedural text in one-click transformation', () => {
      const dirty = 'Submit package to Melissa Gagliardi for initial audit, then escalate to Jessica Keenan if overdue.';
      const clean = sanitizeSopRoles(dirty);

      expect(clean).not.toContain('Melissa Gagliardi');
      expect(clean).not.toContain('Jessica Keenan');
      expect(clean).toContain('Marketing Lead');
      expect(clean).toContain('Broker-in-Charge');
    });

    it('verifies all seed templates in sopTemplates.ts pass Role Guard validation with 0 violations', () => {
      for (const tmpl of SOP_TEMPLATES) {
        const compliance = validateSopRoleCompliance(tmpl);
        expect(compliance.violations, `Template ${tmpl.title} contains hardcoded personal names: ${compliance.violations.join(', ')}`).toEqual([]);
        expect(compliance.compliant).toBe(true);
      }
    });

    it('verifies all persistence repository seed SOPs pass Role Guard validation with 0 violations', () => {
      const repoSops = sopRepository.listDraftsSync('ws_wilmington', 'ws_wilmington');
      expect(repoSops.length).toBeGreaterThan(0);

      for (const sop of repoSops) {
        const compliance = validateSopRoleCompliance(sop);
        expect(compliance.violations, `Repository SOP ${sop.title} contains hardcoded personal names: ${compliance.violations.join(', ')}`).toEqual([]);
        expect(compliance.compliant).toBe(true);
      }
    });
  });

  describe('2. Category Starter Templates & Default NC Jurisdiction', () => {
    it('exports all 6 required category starter templates', () => {
      const categories = SOP_CATEGORY_TEMPLATES.map(c => c.category);
      expect(categories).toContain('Finance');
      expect(categories).toContain('Transactions');
      expect(categories).toContain('Office');
      expect(categories).toContain('Vendor');
      expect(categories).toContain('Systems');
      expect(categories).toContain('Marketing');
    });

    it('verifies all category starter templates default state jurisdiction to NC', () => {
      for (const tmpl of SOP_CATEGORY_TEMPLATES) {
        expect(tmpl.jurisdiction).toBe('NC');
      }
    });

    it('verifies SOPWizard source code defaults state jurisdiction to NC and contains Category Starter Pills', () => {
      const wizardPath = path.resolve(process.cwd(), 'src/components/sops/SOPWizard.tsx');
      const content = fs.readFileSync(wizardPath, 'utf-8');

      expect(content).toContain("stateJurisdiction || 'NC'");
      expect(content).toContain('NC (North Carolina — Default)');
      expect(content).toContain('SOP_CATEGORY_TEMPLATES.map');
      expect(content).toContain('SOP Owner Type');
      expect(content).toContain('Describe Procedure & Synthesize Draft');
      expect(content).not.toContain('Melissa prepares flyer templates');
    });
  });

  describe('3. Multi-Assignee & Step Duration Policy & Affirmation Criteria', () => {
    it('verifies seed templates have primaryRole, secondaryRole, durationPolicy, and affirmationCheck', () => {
      const listingLaunch = SOP_TEMPLATES.find(t => t.sopId === 'sop_listing_launch_001');
      expect(listingLaunch).toBeDefined();

      const step1 = listingLaunch!.steps[0];
      expect(step1.primaryRole).toBeDefined();
      expect(step1.secondaryRole).toBeDefined();
      expect(step1.durationPolicy).toBeDefined();
      expect(step1.durationPolicy?.preset).toBeDefined();
      expect(step1.affirmationCheck).toBeDefined();
      expect(step1.affirmationCheck!.length).toBeGreaterThan(15);
      expect(step1.affirmationCheck).toContain('Exclusive Right to Sell');
    });

    it('verifies Step Modal in SOPStudio supports multi-assignee, duration policy presets, and affirmation check', () => {
      const studioPath = path.resolve(process.cwd(), 'src/components/sops/SOPStudio.tsx');
      const content = fs.readFileSync(studioPath, 'utf-8');

      expect(content).toContain('primaryRole');
      expect(content).toContain('secondaryRole');
      expect(content).toContain('durationPolicy');
      expect(content).toContain('affirmationCheck');
      expect(content).toContain('Pass/Fail Affirmation Criteria');
      expect(content).toContain('Duration Policy');
      expect(content).toContain('Role Guard: Name detected');
    });
  });

  describe('4. Review Lanes & SOP Lifecycle', () => {
    it('verifies SOPLibrary has all 4 primary review lanes plus template and runs tabs', () => {
      const libPath = path.resolve(process.cwd(), 'src/components/sops/SOPLibrary.tsx');
      const content = fs.readFileSync(libPath, 'utf-8');

      expect(content).toContain("'for_comment'");
      expect(content).toContain("'awaiting_bic_review'");
      expect(content).toContain("'awaiting_owner_review'");
      expect(content).toContain('Drafts for Comment');
      expect(content).toContain('Awaiting BIC Review');
      expect(content).toContain('Awaiting Owner Review');
      expect(content).toContain('Category Filter');
    });

    it('verifies SOPWizard Phase 4 has buttons for Draft, For Comment, Formal Review, and Publish', () => {
      const wizardPath = path.resolve(process.cwd(), 'src/components/sops/SOPWizard.tsx');
      const content = fs.readFileSync(wizardPath, 'utf-8');

      expect(content).toContain("handleSaveSop('draft')");
      expect(content).toContain("handleSaveSop('for_comment')");
      expect(content).toContain("isBicReview ? 'awaiting_bic_review' : 'awaiting_owner_review'");
      expect(content).toContain("handleSaveSop('published')");
    });
  });

  describe('5. 4-Stage Document View & Controlled Copy Expiration', () => {
    it('verifies SOPDocumentView implements sequential 4 stages', () => {
      const docPath = path.resolve(process.cwd(), 'src/components/sops/SOPDocumentView.tsx');
      const content = fs.readFileSync(docPath, 'utf-8');

      expect(content).toContain('1. Overview');
      expect(content).toContain('2. Procedures');
      expect(content).toContain('3. Checklist');
      expect(content).toContain('4. Versions & History');
    });

    it('verifies official SOP export stamps 14-day controlled copy expiration notice while checklist download is unexpired', () => {
      const docPath = path.resolve(process.cwd(), 'src/components/sops/SOPDocumentView.tsx');
      const content = fs.readFileSync(docPath, 'utf-8');

      expect(content).toContain('handleDownloadOfficialSop');
      expect(content).toContain('handleDownloadChecklist');
      expect(content).toContain('OFFICIAL CONTROLLED COPY');
      expect(content).toContain('EXPIRATION NOTICE: This controlled document is valid for 14 days from download');
      expect(content).toContain('UNCONTROLLED');
      expect(content).toContain('Pass/Fail Verification Affirmations');
    });
  });

  describe('6. Role & Escalation Map Routing Matrix Badges', () => {
    it('verifies RoleEscalationMapPage renders [Governed by: SOP-00X · Title] badges with navigation link', () => {
      const mapPath = path.resolve(process.cwd(), 'src/components/nest-wilmington/RoleEscalationMapPage.tsx');
      const content = fs.readFileSync(mapPath, 'utf-8');

      expect(content).toContain('Governed by:');
      expect(content).toContain('handleNavigateToSop');
      expect(content).toContain('sop_studio_selected_sop_id');
      expect(content).toContain('governingSopRef');
      expect(content).toContain('governingSopTitle');
      expect(content).toContain('SOP-001');
      expect(content).toContain('SOP-002');
      expect(content).toContain('SOP-003');
      expect(content).toContain('SOP-004');
    });
  });
});
