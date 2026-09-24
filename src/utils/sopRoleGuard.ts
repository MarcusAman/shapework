/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Wave 2 Role Guard Linter:
 * Enforces procedural role anonymity by preventing individual personnel names in SOP procedures,
 * checklists, and action steps, replacing or prompting with canonical brokerage role titles.
 */

export interface RoleGuardViolation {
  name: string;
  suggestedRole: string;
  index: number;
  context: string;
}

export interface RoleGuardLintResult {
  hasViolations: boolean;
  violations: RoleGuardViolation[];
  cleanedText: string;
}

// Canonical directory personnel to role mapping dictionary
// Canonical directory personnel to role mapping dictionary
export const CANONICAL_PERSON_TO_ROLE_MAP: Record<string, string> = {
  // Lowercase keys
  'jessica keenan': 'Broker-in-Charge',
  'jessica': 'Broker-in-Charge',
  'eric knight': 'Broker-in-Charge',
  'eric': 'Broker-in-Charge',
  'ryan daugherty': 'Regional Leader',
  'ryan shield': 'Managing Principal',
  'ryan crecelius': 'Executive Leader',
  'ryan': 'Regional Leader',
  'melissa gagliardi': 'Marketing Lead',
  'melissa': 'Marketing Lead',
  'james fort': 'Accounting Manager',
  'james': 'Accounting Manager',
  'ann gunn': 'Operations Lead',
  'ann': 'Operations Lead',
  'eduardo lovo': 'Field Operator',
  'eduardo': 'Field Operator',
  'todd whalen': 'Administrative Assistant',
  'todd': 'Administrative Assistant',
  'matt orr': 'Listing Broker',
  'matt costin': 'Team Leader Broker',
  'brian donovan': 'Broker Associate',
  'chris brown': 'Provisional Broker',

  // Title-cased keys for direct lookup
  'Jessica Keenan': 'Broker-in-Charge',
  'Jessica': 'Broker-in-Charge',
  'Eric Knight': 'Broker-in-Charge',
  'Eric': 'Broker-in-Charge',
  'Ryan Daugherty': 'Regional Leader',
  'Ryan Shield': 'Managing Principal',
  'Ryan Crecelius': 'Executive Leader',
  'Ryan': 'Regional Leader',
  'Melissa Gagliardi': 'Marketing Lead',
  'Melissa': 'Marketing Lead',
  'James Fort': 'Accounting Manager',
  'James': 'Accounting Manager',
  'Ann Gunn': 'Operations Lead',
  'Ann': 'Operations Lead',
  'Eduardo Lovo': 'Field Operator',
  'Eduardo': 'Field Operator',
  'Todd Whalen': 'Administrative Assistant',
  'Todd': 'Administrative Assistant',
  'Matt Orr': 'Listing Broker',
  'Matt Costin': 'Team Leader Broker',
  'Brian Donovan': 'Broker Associate',
  'Chris Brown': 'Provisional Broker'
};

/**
 * Lints an arbitrary string for hardcoded individual personnel names.
 */
export function lintSopText(text: string): RoleGuardLintResult {
  if (!text || typeof text !== 'string') {
    return { hasViolations: false, violations: [], cleanedText: '' };
  }

  const violations: RoleGuardViolation[] = [];
  let cleanedText = text;

  // Check unique names sorted longer first to match full names before first names
  const seen = new Set<string>();
  const uniqueNames = Object.keys(CANONICAL_PERSON_TO_ROLE_MAP).filter(name => {
    const lower = name.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  }).sort((a, b) => b.length - a.length);

  for (const name of uniqueNames) {
    // Word boundary regex, case-insensitive
    const regex = new RegExp(`\\b${name}\\b`, 'gi');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const startIndex = Math.max(0, match.index - 20);
      const endIndex = Math.min(text.length, match.index + match[0].length + 20);
      const snippet = text.slice(startIndex, endIndex);

      violations.push({
        name: match[0],
        suggestedRole: CANONICAL_PERSON_TO_ROLE_MAP[name],
        index: match.index,
        context: `...${snippet}...`
      });
    }

    // Auto-clean preview
    cleanedText = cleanedText.replace(regex, CANONICAL_PERSON_TO_ROLE_MAP[name]);
  }

  // Sort violations by their appearance position in the text
  violations.sort((a, b) => a.index - b.index);

  return {
    hasViolations: violations.length > 0,
    violations,
    cleanedText
  };
}

/**
 * Deep-validates an SOP object for personal names across title, steps, decisions, and escalation paths.
 */
export function validateSopRoleCompliance(sop: any): { isCompliant: boolean; compliant: boolean; errors: string[]; violations: string[] } {
  const errors: string[] = [];

  if (!sop) return { isCompliant: true, compliant: true, errors, violations: errors };

  // 1. Check title
  if (sop.title) {
    const res = lintSopText(sop.title);
    if (res.hasViolations) {
      errors.push(`Title contains personal name "${res.violations[0].name}". Use role "${res.violations[0].suggestedRole}" instead.`);
    }
  }

  // 2. Check steps
  const steps = sop.orderedSteps || sop.steps || [];
  steps.forEach((st: any, idx: number) => {
    const stepText = `${st.action || ''} ${st.instruction || ''} ${st.title || ''} ${st.role || ''} ${st.primaryRole || ''} ${st.secondaryRole || ''}`;
    const res = lintSopText(stepText);
    if (res.hasViolations) {
      errors.push(`Step ${idx + 1} references person "${res.violations[0].name}". Replace with "${res.violations[0].suggestedRole}".`);
    }
  });

  // 3. Check participants
  if (Array.isArray(sop.participants)) {
    sop.participants.forEach((p: string) => {
      const res = lintSopText(p);
      if (res.hasViolations) {
        errors.push(`Participants list contains "${p}". Use standard role "${res.violations[0].suggestedRole}".`);
      }
    });
  }

  // 4. Check decisions & exceptions
  (sop.decisions || []).forEach((dec: any, idx: number) => {
    const decText = typeof dec === 'string' ? dec : `${dec.condition || ''} ${dec.action || ''}`;
    const res = lintSopText(decText);
    if (res.hasViolations) {
      errors.push(`Decision ${idx + 1} contains "${res.violations[0].name}". Use role "${res.violations[0].suggestedRole}".`);
    }
  });

  (sop.escalationPaths || []).forEach((esc: string, idx: number) => {
    const res = lintSopText(esc);
    if (res.hasViolations) {
      errors.push(`Escalation path ${idx + 1} references "${res.violations[0].name}". Use role "${res.violations[0].suggestedRole}".`);
    }
  });

  return {
    isCompliant: errors.length === 0,
    compliant: errors.length === 0,
    errors,
    violations: errors
  };
}

/**
 * Sanitizes an SOP by replacing personal names with canonical roles.
 */
export function sanitizeSopRoles(sop: any): any {
  if (!sop) return sop;
  if (typeof sop === 'string') {
    return lintSopText(sop).cleanedText;
  }
  const clone = JSON.parse(JSON.stringify(sop));

  if (clone.title) {
    clone.title = lintSopText(clone.title).cleanedText;
  }
  if (clone.purpose) {
    clone.purpose = lintSopText(clone.purpose).cleanedText;
  }
  if (clone.trigger) {
    clone.trigger = lintSopText(clone.trigger).cleanedText;
  }
  if (clone.processOwner) {
    clone.processOwner = lintSopText(clone.processOwner).cleanedText;
  }
  if (clone.reviewer) {
    clone.reviewer = lintSopText(clone.reviewer).cleanedText;
  }
  if (clone.publisher) {
    clone.publisher = lintSopText(clone.publisher).cleanedText;
  }
  if (clone.author) {
    clone.author = lintSopText(clone.author).cleanedText;
  }
  if (clone.createdBy) {
    clone.createdBy = lintSopText(clone.createdBy).cleanedText;
  }

  const cleanStep = (st: any) => ({
    ...st,
    action: st.action ? lintSopText(st.action).cleanedText : st.action,
    instruction: st.instruction ? lintSopText(st.instruction).cleanedText : st.instruction,
    title: st.title ? lintSopText(st.title).cleanedText : st.title,
    role: st.role ? lintSopText(st.role).cleanedText : st.role,
    primaryRole: st.primaryRole ? lintSopText(st.primaryRole).cleanedText : st.primaryRole,
    secondaryRole: st.secondaryRole ? lintSopText(st.secondaryRole).cleanedText : st.secondaryRole,
    assignedRole: st.assignedRole ? lintSopText(st.assignedRole).cleanedText : st.assignedRole
  });

  if (Array.isArray(clone.orderedSteps)) {
    clone.orderedSteps = clone.orderedSteps.map(cleanStep);
  }

  if (Array.isArray(clone.steps)) {
    clone.steps = clone.steps.map(cleanStep);
  }

  if (Array.isArray(clone.participants)) {
    clone.participants = clone.participants.map((p: string) => lintSopText(p).cleanedText);
  }

  if (Array.isArray(clone.decisions)) {
    clone.decisions = clone.decisions.map((d: any) => {
      if (typeof d === 'string') return lintSopText(d).cleanedText;
      return {
        ...d,
        condition: d.condition ? lintSopText(d.condition).cleanedText : d.condition,
        action: d.action ? lintSopText(d.action).cleanedText : d.action
      };
    });
  }

  if (Array.isArray(clone.escalationPaths)) {
    clone.escalationPaths = clone.escalationPaths.map((e: string) => lintSopText(e).cleanedText);
  }

  return clone;
}
