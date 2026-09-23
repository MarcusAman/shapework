import { describe, it, expect } from 'vitest';
import { 
  APPROVED_ABBREVIATIONS, 
  CANONICAL_ROLE_DEFINITIONS, 
  validateChecklistAffirmation 
} from '../utils/sopMetaStandard';
import { lintSopText } from '../utils/sopRoleGuard';
import { INITIAL_NEST_SOPS } from '../../server/persistence/sopRepository';
import { SOP_TEMPLATES } from '../components/sops/sopTemplates';

describe('Wave 3: Meta-SOP (SOP-00) & Governance Standard', () => {
  it('verifies approved abbreviations registry is comprehensive and canonical', () => {
    const requiredAbbrs = ['BIC', 'PB', 'TC', 'EMD', 'DDF', 'CDA', 'WWREA', 'RPOADS', 'MOG', 'NCREC', 'SCREC', 'VAR', 'MLS'];
    requiredAbbrs.forEach(abbr => {
      const entry = APPROVED_ABBREVIATIONS[abbr];
      expect(entry, `Abbreviation ${abbr} should exist in registry`).toBeDefined();
      expect(entry.fullName.length).toBeGreaterThan(2);
      expect(entry.definition.length).toBeGreaterThan(10);
      expect(entry.exampleUsage.length).toBeGreaterThan(10);
    });
  });

  it('verifies canonical role definitions define authority limits and escalation triggers', () => {
    const canonicalRoles = ['Broker-in-Charge', 'Managing Principal', 'Operations Lead', 'Transaction Coordinator', 'Marketing Lead', 'Finance Lead', 'Admin Coordinator'];
    canonicalRoles.forEach(roleTitle => {
      const def = CANONICAL_ROLE_DEFINITIONS[roleTitle];
      expect(def, `Role definition for ${roleTitle} should exist`).toBeDefined();
      expect(def.decisionAuthority.length).toBeGreaterThanOrEqual(2);
      expect(def.escalationTriggers.length).toBeGreaterThanOrEqual(2);
      expect(['bic', 'owner']).toContain(def.defaultReviewLane);
    });
  });

  it('verifies pass/fail affirmation checklist validator enforces verifiable completed states', () => {
    // Valid affirmations
    const valid1 = validateChecklistAffirmation('Confirmed that Exclusive Right to Sell Agreement is executed by all sellers.');
    expect(valid1.isValid).toBe(true);
    expect(valid1.issues).toHaveLength(0);

    const valid2 = validateChecklistAffirmation('Verified EMD is deposited in attorney trust account within statutory 72 hours.');
    expect(valid2.isValid).toBe(true);

    // Invalid: copy paste of procedure
    const procedure = 'Dispatch yard post and brochure box to property address.';
    const copyPaste = validateChecklistAffirmation(procedure, procedure);
    expect(copyPaste.isValid).toBe(false);
    expect(copyPaste.issues.some(i => i.includes('copy-paste'))).toBe(true);
    expect(copyPaste.suggestedImprovement).toBeDefined();

    // Invalid: empty affirmation
    const empty = validateChecklistAffirmation('');
    expect(empty.isValid).toBe(false);
  });

  it('verifies sop_meta_sop_for_sops_000 (SOP-00) is seeded and compliant with role guard', () => {
    const metaSop = INITIAL_NEST_SOPS['sop_meta_sop_for_sops_000'];
    expect(metaSop).toBeDefined();
    expect(metaSop.title).toBe('SOP Authoring, Governance & Lifecycle Protocol');
    expect(metaSop.processOwner).toBe('Operations Lead');
    expect(metaSop.orderedSteps.length).toBe(6);

    // Verify zero personal name leaks
    const allText = [
      metaSop.title,
      metaSop.purpose,
      metaSop.trigger,
      ...metaSop.orderedSteps.map(s => `${s.action} ${s.role} ${s.primaryRole} ${s.affirmationCheck}`),
      ...metaSop.decisions,
      ...metaSop.exceptions,
      ...metaSop.escalationPaths
    ].join('\n');

    const lintResult = lintSopText(allText);
    expect(lintResult.hasViolations).toBe(false);
  });
});

describe('Wave 3: Master SOP + State Addendum Architecture', () => {
  it('verifies sop_master_contract_review_031 (SOP-31) has master flag and multi-state addenda', () => {
    const masterSop = INITIAL_NEST_SOPS['sop_master_contract_review_031'];
    expect(masterSop).toBeDefined();
    expect(masterSop.isMasterSop).toBe(true);
    expect(masterSop.stateJurisdiction).toBe('NC');
    expect(masterSop.stateAddenda).toBeDefined();

    const addenda = masterSop.stateAddenda!;
    expect(addenda['NC']).toBeDefined();
    expect(addenda['SC']).toBeDefined();
    expect(addenda['VA']).toBeDefined();
  });

  it('verifies statutory escrow deposit rules differ by state addendum', () => {
    const masterSop = INITIAL_NEST_SOPS['sop_master_contract_review_031'];
    const addenda = masterSop.stateAddenda!;

    // NC: 72 hours (3 banking days per NCREC Rule 58A .0106)
    expect(addenda['NC'].statutoryDepositDeadlineHours).toBe(72);
    expect(addenda['NC'].governingCommission).toContain('NCREC');

    // SC: 48 hours per SCREC rules
    expect(addenda['SC'].statutoryDepositDeadlineHours).toBe(48);
    expect(addenda['SC'].governingCommission).toContain('SCREC');

    // VA: 120 hours (5 business days per VREB regulations)
    expect(addenda['VA'].statutoryDepositDeadlineHours).toBe(120);
    expect(addenda['VA'].governingCommission).toContain('Virginia');
  });

  it('verifies mandatory disclosures and step overrides for each state addendum', () => {
    const masterSop = INITIAL_NEST_SOPS['sop_master_contract_review_031'];
    const addenda = masterSop.stateAddenda!;

    // NC disclosures: WWREA, RPOADS, MOG
    const ncCodes = addenda['NC'].mandatoryDisclosures.map(d => d.code);
    expect(ncCodes).toContain('WWREA');
    expect(ncCodes).toContain('RPOADS');
    expect(ncCodes).toContain('MOG');

    // SC disclosures: SC_AGENCY, SC_RPD
    const scCodes = addenda['SC'].mandatoryDisclosures.map(d => d.code);
    expect(scCodes).toContain('SC_AGENCY');
    expect(scCodes).toContain('SC_RPD');

    // VA disclosures: VA_RPDA, VA_POA_HOA
    const vaCodes = addenda['VA'].mandatoryDisclosures.map(d => d.code);
    expect(vaCodes).toContain('VA_RPDA');
    expect(vaCodes).toContain('VA_POA_HOA');

    // Step 2 overrides
    expect(addenda['SC'].stepOverrides).toBeDefined();
    const scStep2 = addenda['SC'].stepOverrides!.find(o => o.stepNumber === 2);
    expect(scStep2?.actionOverride).toContain('48 hours');

    expect(addenda['VA'].stepOverrides).toBeDefined();
    const vaStep2 = addenda['VA'].stepOverrides!.find(o => o.stepNumber === 2);
    expect(vaStep2?.actionOverride).toContain('5 business days');
  });

  it('verifies master contract review template in SOP_TEMPLATES has state addenda attached', () => {
    const tmpl = SOP_TEMPLATES.find(t => t.id === 'sop_master_contract_review_031');
    expect(tmpl).toBeDefined();
    expect(tmpl?.isMasterSop).toBe(true);
    expect(tmpl?.stateAddenda).toBeDefined();
    expect(tmpl?.stateAddenda?.['SC'].statutoryDepositDeadlineHours).toBe(48);
  });
});

describe('Wave 3: High-Priority Operational SOPs Authoring & Role Guard', () => {
  const highPriorityKeys = [
    'sop_owner_escalation_rights_001',
    'sop_agent_support_routing_002',
    'sop_gospel_cash_cadence_040',
    'sop_payroll_processing_045',
    'sop_sign_lockbox_readiness_047'
  ];

  it('verifies all 5 high-priority operational SOPs exist with required procedural steps', () => {
    highPriorityKeys.forEach(key => {
      const sop = INITIAL_NEST_SOPS[key];
      expect(sop, `SOP ${key} should exist`).toBeDefined();
      expect(sop.orderedSteps.length).toBeGreaterThanOrEqual(5);
      expect(sop.purpose.length).toBeGreaterThan(20);
      expect(sop.trigger.length).toBeGreaterThan(10);
      expect(sop.status).toBe('published');
    });
  });

  it('verifies SOP-01 (Owner Escalation Rights) specifies $2,500 threshold and litigation rules', () => {
    const sop01 = INITIAL_NEST_SOPS['sop_owner_escalation_rights_001'];
    expect(sop01.processOwner).toBe('Managing Principal');
    const step2 = sop01.orderedSteps.find(s => s.stepNumber === 2);
    expect(step2?.action).toContain('$2,500');
    expect(sop01.decisions.some(d => d.includes('$2,500'))).toBe(true);
  });

  it('verifies SOP-40 (The Gospel Cash Sheet) specifies 48-hour cadence and bank reconciliation', () => {
    const sop40 = INITIAL_NEST_SOPS['sop_gospel_cash_cadence_040'];
    expect(sop40.processOwner).toBe('Finance Lead');
    expect(sop40.category).toBe('Finance');
    expect(sop40.expectedTiming).toContain('48 hours');
  });

  it('verifies SOP-45 (Payroll Processing) enforces ACH direct deposit 48 hours prior to pay date', () => {
    const sop45 = INITIAL_NEST_SOPS['sop_payroll_processing_045'];
    expect(sop45.processOwner).toBe('Finance Lead');
    const step5 = sop45.orderedSteps.find(s => s.stepNumber === 5);
    expect(step5?.title).toContain('48 Hours Prior');
    expect(step5?.action).toContain('banking cut-off');
  });

  it('verifies SOP-47 (Sign & Lockbox Readiness) enforces Supra testing and minimum buffer', () => {
    const sop47 = INITIAL_NEST_SOPS['sop_sign_lockbox_readiness_047'];
    expect(sop47.processOwner).toBe('Admin Coordinator');
    const step3 = sop47.orderedSteps.find(s => s.stepNumber === 3);
    expect(step3?.action).toContain('Supra');
    expect(step3?.action).toContain('80%');
  });

  it('verifies 100% Role Guard compliance across all newly authored Wave 3 SOPs', () => {
    const allWave3Keys = [
      'sop_meta_sop_for_sops_000',
      'sop_master_contract_review_031',
      ...highPriorityKeys
    ];

    allWave3Keys.forEach(key => {
      const sop = INITIAL_NEST_SOPS[key];
      const textToLint = [
        sop.title,
        sop.purpose,
        sop.trigger,
        sop.processOwner,
        ...sop.orderedSteps.map(s => `${s.action} ${s.role} ${s.primaryRole || ''} ${s.secondaryRole || ''} ${s.affirmationCheck || ''}`),
        ...(sop.decisions || []),
        ...(sop.exceptions || []),
        ...(sop.escalationPaths || [])
      ].join('\n');

      const lint = lintSopText(textToLint);
      expect(lint.hasViolations, `Violations found in ${key}: ${JSON.stringify(lint.violations)}`).toBe(false);
    });
  });
});
