/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Wave 3: Knowledge Library Comprehensive Taxonomy & Core Brokerage Operations Suite Verification
 * Validates the 8 canonical categories from NEW SOP list, 22 official SOP renames,
 * consolidated SOP-11/18 Signage & Field Equipment Accountability Protocol,
 * 5 newly authored high-priority operational procedures, and 100% Role Guard compliance.
 */

import { describe, it, expect } from 'vitest';
import { 
  CANONICAL_SOP_CATEGORIES, 
  normalizeSopCategory, 
  SopCategory 
} from '../types/sopWorkflow';
import { 
  SOP_CATEGORY_TEMPLATES, 
  SOP_TEMPLATES 
} from '../components/sops/sopTemplates';
import { 
  sopRepository, 
  INITIAL_NEST_SOPS 
} from '../../server/persistence/sopRepository';
import { lintSopText, validateSopRoleCompliance } from '../utils/sopRoleGuard';
import { validateChecklistAffirmation } from '../utils/sopMetaStandard';

describe('Wave 3: Knowledge Library Comprehensive Taxonomy & Authoring', () => {

  describe('1. Canonical Category Taxonomy & Normalization Engine', () => {
    it('defines exactly the 8 official canonical categories from NEW SOP list', () => {
      const expectedCategories: SopCategory[] = [
        'Agent Onboarding, Training, Support and Retention',
        'Marketing',
        'Finance',
        'Office and Facilities',
        'Owner / Leadership',
        'Events',
        'Transactions and Compliance',
        'Vendors & Systems'
      ];

      expect(CANONICAL_SOP_CATEGORIES).toHaveLength(8);
      expectedCategories.forEach(cat => {
        expect(CANONICAL_SOP_CATEGORIES).toContain(cat);
      });
    });

    it('accurately normalizes legacy and variant category strings into canonical categories', () => {
      expect(normalizeSopCategory('Onboarding')).toBe('Agent Onboarding, Training, Support and Retention');
      expect(normalizeSopCategory('Support and retention')).toBe('Agent Onboarding, Training, Support and Retention');
      expect(normalizeSopCategory('Listings and marketing')).toBe('Marketing');
      expect(normalizeSopCategory('Finance')).toBe('Finance');
      expect(normalizeSopCategory('Office and facilities')).toBe('Office and Facilities');
      expect(normalizeSopCategory('Office')).toBe('Office and Facilities');
      expect(normalizeSopCategory('Owner / leadership')).toBe('Owner / Leadership');
      expect(normalizeSopCategory('Events')).toBe('Events');
      expect(normalizeSopCategory('Transactions and compliance')).toBe('Transactions and Compliance');
      expect(normalizeSopCategory('Transactions')).toBe('Transactions and Compliance');
      expect(normalizeSopCategory('Compliance')).toBe('Transactions and Compliance');
      expect(normalizeSopCategory('Vendors and systems')).toBe('Vendors & Systems');
      expect(normalizeSopCategory('Vendors')).toBe('Vendors & Systems');
      expect(normalizeSopCategory('Systems')).toBe('Vendors & Systems');
    });

    it('verifies SOP_CATEGORY_TEMPLATES covers all 8 canonical categories with NC jurisdiction', () => {
      const categoryTemplateMap = new Set(SOP_CATEGORY_TEMPLATES.map(t => t.category));
      CANONICAL_SOP_CATEGORIES.forEach(cat => {
        expect(categoryTemplateMap.has(cat), `Category starter template missing for ${cat}`).toBe(true);
      });

      SOP_CATEGORY_TEMPLATES.forEach(tmpl => {
        expect(tmpl.jurisdiction).toBe('NC');
        expect(tmpl.defaultOwnerRole.length).toBeGreaterThan(3);
        expect(tmpl.templateId.length).toBeGreaterThan(3);
      });
    });

    it('verifies 100% of all loaded repository SOPs map to valid canonical categories', () => {
      const sops = sopRepository.listDraftsSync('ws_wilmington', 'ws_wilmington');
      expect(sops.length).toBeGreaterThanOrEqual(18);

      sops.forEach(sop => {
        const canonicalCat = normalizeSopCategory(sop.category);
        expect(CANONICAL_SOP_CATEGORIES).toContain(canonicalCat);
      });
    });
  });

  describe('2. Official SOP Renames & Alignments', () => {
    it('verifies key SOPs have been renamed to match NEW SOP list', () => {
      const sops = sopRepository.listDraftsSync('ws_wilmington', 'ws_wilmington');
      
      const findSop = (id: string) => sops.find(s => s.id === id);

      const listingLaunch = findSop('sop_listing_launch_001');
      expect(listingLaunch).toBeDefined();
      expect(listingLaunch?.title).toContain('Listing Launch');

      const marketingIntake = findSop('sop_marketing_intake_003');
      expect(marketingIntake).toBeDefined();
      expect(marketingIntake?.title).toContain('Marketing Requests');

      const agentTriage = findSop('sop_agent_support_routing_002');
      expect(agentTriage).toBeDefined();
      expect(agentTriage?.title).toContain('Agent Question Triage & Support Desk');

      const ownerEscalation = findSop('sop_owner_escalation_rights_001');
      expect(ownerEscalation).toBeDefined();
      expect(ownerEscalation?.title).toContain('Owner Decision');
    });
  });

  describe('3. Combined SOP-11/18: Signage, Rider & Field Equipment Accountability Protocol', () => {
    it('verifies SOP-11/18 combines ordering, compliance, maintenance, and departure recovery', () => {
      const sop = INITIAL_NEST_SOPS['sop_agent_signage_accountability_011'];
      expect(sop).toBeDefined();
      expect(sop.title).toBe('Agent Signage, Rider & Field Equipment Accountability Protocol');
      expect(sop.category).toBe('Agent Onboarding, Training, Support and Retention');
      expect(sop.processOwner).toBe('Admin Coordinator');
      expect(sop.orderedSteps.length).toBeGreaterThanOrEqual(6);

      // Verify Onboarding / Procurement coverage (SOP-11)
      const step1 = sop.orderedSteps.find(s => s.stepNumber === 1);
      expect(step1?.title).toContain('Signage & Rider Specification');
      expect(step1?.action).toContain('NCREC advertising rules');

      // Verify Lockbox / Field Inventory allocation
      const step2 = sop.orderedSteps.find(s => s.stepNumber === 2);
      expect(step2?.action).toContain('Supra lockboxes');
      expect(step2?.action).toContain('master asset ledger');

      // Verify Municipal right-of-way and placement compliance
      const step3 = sop.orderedSteps.find(s => s.stepNumber === 3);
      expect(step3?.action).toContain('municipal right-of-way');

      // Verify 48h remediation nudges (SOP-18)
      const step4 = sop.orderedSteps.find(s => s.stepNumber === 4);
      expect(step4?.action).toContain('48-hour correction notices');

      // Verify 48h post-close retrieval
      const step5 = sop.orderedSteps.find(s => s.stepNumber === 5);
      expect(step5?.action).toContain('within 48 hours of deed recordation');

      // Verify Departure recovery within 5 business days (SOP-18)
      const step6 = sop.orderedSteps.find(s => s.stepNumber === 6);
      expect(step6?.action).toContain('within 5 business days');
      expect(step6?.action).toContain('replacement charge');
    });
  });

  describe('4. Core Brokerage Operations Suite Authoring', () => {
    const coreOperationsKeys = [
      'sop_new_agent_onboarding_008',
      'sop_agent_signage_accountability_011',
      'sop_google_reviews_engine_025',
      'sop_office_maintenance_routing_048',
      'sop_front_desk_hospitality_050'
    ];

    it('verifies all 5 core operational procedures exist in initial seeds and database repository', () => {
      const sops = sopRepository.listDraftsSync('ws_wilmington', 'ws_wilmington');

      coreOperationsKeys.forEach(key => {
        const seedSop = INITIAL_NEST_SOPS[key];
        expect(seedSop, `Seed SOP ${key} must exist`).toBeDefined();
        expect(seedSop.status).toBe('published');
        expect(seedSop.orderedSteps.length).toBeGreaterThanOrEqual(5);

        const loadedSop = sops.find(s => s.id === key);
        expect(loadedSop, `Repository must contain ${key}`).toBeDefined();
      });
    });

    it('verifies SOP-08 (New Agent Onboarding) covers complete 8-step progression', () => {
      const sop = INITIAL_NEST_SOPS['sop_new_agent_onboarding_008'];
      expect(sop.title).toBe('New Agent Onboarding');
      expect(sop.processOwner).toBe('Operations Lead');
      expect(sop.orderedSteps).toHaveLength(8);

      const stepTitles = sop.orderedSteps.map(s => s.title);
      expect(stepTitles).toContain('Independent Contractor Agreement & W-9 Intake');
      expect(stepTitles).toContain('NCREC License Affiliation & Board Membership Verification');
      expect(stepTitles).toContain('Enterprise Tech Stack & Platform Provisioning');
      expect(stepTitles).toContain('Professional Headshot & Website Bio Publication');
      expect(stepTitles).toContain('Custom Signage & Name Rider Order Dispatch');
      expect(stepTitles).toContain('Welcome Kit Presentation & Facility Key Fob Issuance');
      expect(stepTitles).toContain('Public Brokerage Welcome Announcement Campaign');
      expect(stepTitles).toContain('30-Day Mentorship Roadmap & Leadership Check-In');
    });

    it('verifies SOP-25 (Google Reviews) enforces 24h dispatch, response, and sentiment escalation', () => {
      const sop = INITIAL_NEST_SOPS['sop_google_reviews_engine_025'];
      expect(sop.title).toBe('Google Reviews');
      expect(sop.category).toBe('Marketing');
      expect(sop.processOwner).toBe('Marketing Lead');

      const step4 = sop.orderedSteps.find(s => s.stepNumber === 4);
      expect(step4?.action).toContain('within 24 hours');
      expect(step4?.action).toContain('Broker-in-Charge');
      expect(sop.decisions.some(d => d.includes('sub-4-star') || d.includes('negative'))).toBe(true);
    });

    it('verifies SOP-48 (Office Maintenance & Repair) enforces $500/$2500 thresholds and lease triage', () => {
      const sop = INITIAL_NEST_SOPS['sop_office_maintenance_routing_048'];
      expect(sop.title).toBe('Office Maintenance & Repair');
      expect(sop.category).toBe('Office and Facilities');
      expect(sop.processOwner).toBe('Admin Coordinator');

      // Lease audit
      const step2 = sop.orderedSteps.find(s => s.stepNumber === 2);
      expect(step2?.action).toContain('landlord');
      expect(step2?.action).toContain('tenant');

      // Authorization limits
      const step3 = sop.orderedSteps.find(s => s.stepNumber === 3);
      expect(step3?.action).toContain('$500');
      expect(step3?.action).toContain('$2,500');
    });

    it('verifies SOP-50 (Front Desk & Hospitality) enforces 8:30 AM opening, 15s greeting, and check security', () => {
      const sop = INITIAL_NEST_SOPS['sop_front_desk_hospitality_050'];
      expect(sop.title).toBe('Front Desk, Reception & Hospitality Procedures');
      expect(sop.category).toBe('Office and Facilities');
      expect(sop.processOwner).toBe('Admin Coordinator');

      // 8:30 AM opening
      const step1 = sop.orderedSteps.find(s => s.stepNumber === 1);
      expect(step1?.title).toContain('8:30 AM');
      expect(step1?.action).toContain('coffee');

      // 15-second greeting
      const step2 = sop.orderedSteps.find(s => s.stepNumber === 2);
      expect(step2?.action).toContain('15 seconds');

      // Earnest money check intake
      const step4 = sop.orderedSteps.find(s => s.stepNumber === 4);
      expect(step4?.action).toContain('earnest money');
      expect(step4?.action).toContain('fireproof safe');

      // 5:00 PM lockdown
      const step5 = sop.orderedSteps.find(s => s.stepNumber === 5);
      expect(step5?.title).toContain('5:00 PM');
      expect(step5?.action).toContain('deadbolted');
    });

    it('verifies every step in all newly authored SOPs has affirmative pass/fail verification checks', () => {
      coreOperationsKeys.forEach(key => {
        const sop = INITIAL_NEST_SOPS[key];
        sop.orderedSteps.forEach(step => {
          expect(step.affirmationCheck, `Step ${step.stepNumber} in ${key} must have affirmationCheck`).toBeDefined();
          expect(step.affirmationCheck!.length).toBeGreaterThan(15);
          
          const affirmationValidation = validateChecklistAffirmation(step.affirmationCheck!);
          expect(affirmationValidation.isValid, `Affirmation for step ${step.stepNumber} in ${key} should be valid`).toBe(true);
        });
      });
    });
  });

  describe('5. 100% Strict Role Guard Compliance', () => {
    it('verifies zero individual personal names in all 5 newly authored operational procedures', () => {
      const newKeys = [
        'sop_new_agent_onboarding_008',
        'sop_agent_signage_accountability_011',
        'sop_google_reviews_engine_025',
        'sop_office_maintenance_routing_048',
        'sop_front_desk_hospitality_050'
      ];

      newKeys.forEach(key => {
        const sop = INITIAL_NEST_SOPS[key];
        expect(sop).toBeDefined();

        const roleCompliance = validateSopRoleCompliance(sop);
        expect(roleCompliance.violations, `Role violations found in ${key}: ${roleCompliance.violations.join(', ')}`).toEqual([]);
        expect(roleCompliance.compliant).toBe(true);

        const allText = [
          sop.title,
          sop.purpose,
          sop.trigger,
          sop.processOwner,
          ...sop.participants,
          ...sop.orderedSteps.map(s => `${s.title || ''} ${s.action} ${s.role} ${s.primaryRole || ''} ${s.secondaryRole || ''} ${s.affirmationCheck || ''}`),
          ...(sop.decisions || []),
          ...(sop.exceptions || []),
          ...(sop.escalationPaths || [])
        ].join('\n');

        const lint = lintSopText(allText);
        expect(lint.hasViolations, `Lint violations in ${key}: ${JSON.stringify(lint.violations)}`).toBe(false);
      });
    });
  });

});
