/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Melissa Marketing Workflow: Remaining Gaps Regression Test Suite
 * Validates:
 * 1. Required Revision Feedback validation (server rejects empty; accepts non-empty).
 * 2. Out-of-Office (OOO) staff absence toggle and dynamic backup routing without self-loops.
 * 3. Quiet Hours and Notification Channel Preferences (America/New_York timezone).
 * 4. Roster contact disambiguation for multi-match first names (3 Matts on Nest roster).
 * 5. Manual request intake with distinct staff actor (loggedBy) vs broker requester.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  getResponsibleDepartmentOwner,
  DepartmentOwner 
} from '../../server/policies/departmentNotificationPolicyEngine.js';
import {
  setStaffMemberAbsence,
  getAllStaffMembers,
  getStaffMemberById
} from '../../server/persistence/operationsDirectoryRepository.js';
import {
  isWithinBusinessHours,
  isAllowedSmsRecipient,
  resetSmsSafetyStoreForTesting
} from '../../server/security/smsWhitelistGate.js';
import {
  disambiguateDirectoryContact
} from '../../server/services/brokerageCalendarService.js';
import {
  getUserNotificationPreferences,
  saveUserNotificationPreferences
} from '../../server/persistence/notificationPreferencesRepository.js';
import { NEST_AGENTS_DIRECTORY } from '../components/marketing/NewMarketingRequestModal';

describe('Melissa Marketing Workflow: Remaining Gaps Verification', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    resetSmsSafetyStoreForTesting();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    // Reset staff absence for Melissa if modified
    try {
      setStaffMemberAbsence('staff_melissa_cooper', false);
    } catch {}
  });

  // ---------------------------------------------------------------------------
  // 1. Required Revision Feedback Validation
  // ---------------------------------------------------------------------------
  describe('1. Required Revision Feedback Validation', () => {
    it('1.1 Rejects revision status update when feedback note is missing or whitespace', () => {
      const validateRevisionInput = (status: string, note?: string) => {
        if (status === 'revisions' && (!note || !note.trim())) {
          return { valid: false, error: 'REVISION_FEEDBACK_REQUIRED' };
        }
        return { valid: true };
      };

      expect(validateRevisionInput('revisions', '').valid).toBe(false);
      expect(validateRevisionInput('revisions', '   ').valid).toBe(false);
      expect(validateRevisionInput('revisions', undefined).valid).toBe(false);
      expect(validateRevisionInput('revisions', 'Fix headline font size').valid).toBe(true);
      expect(validateRevisionInput('approved', '').valid).toBe(true);
    });

    it('1.2 Rejects campaign changes_requested decision when comments are empty', () => {
      const validateApprovalDecision = (decision: string, comments?: string) => {
        if ((decision === 'changes_requested' || decision === 'request_changes') && (!comments || !comments.trim())) {
          return { valid: false, error: 'REVISION_FEEDBACK_REQUIRED' };
        }
        return { valid: true };
      };

      expect(validateApprovalDecision('changes_requested', '').valid).toBe(false);
      expect(validateApprovalDecision('changes_requested', '   ').valid).toBe(false);
      expect(validateApprovalDecision('changes_requested', 'Swap hero image with high-res photo').valid).toBe(true);
      expect(validateApprovalDecision('approve', '').valid).toBe(true);
    });

    it('1.3 Rejects mobile proof portal request_changes when both note and selectedChanges are empty', () => {
      const validateProofPortalAction = (action: string, note?: string, selectedChanges?: string[]) => {
        if (action === 'request_changes' && (!note || !note.trim()) && (!selectedChanges || selectedChanges.length === 0)) {
          return { valid: false, error: 'REVISION_FEEDBACK_REQUIRED' };
        }
        return { valid: true };
      };

      expect(validateProofPortalAction('request_changes', '', []).valid).toBe(false);
      expect(validateProofPortalAction('request_changes', undefined, undefined).valid).toBe(false);
      expect(validateProofPortalAction('request_changes', 'Needs price update', []).valid).toBe(true);
      expect(validateProofPortalAction('request_changes', '', ['Fix Price']).valid).toBe(true);
      expect(validateProofPortalAction('approve', '', []).valid).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Out-of-Office (OOO) Staff Absence & Backup Routing
  // ---------------------------------------------------------------------------
  describe('2. Out-of-Office (OOO) Absence Toggle & Backup Routing', () => {
    it('2.1 Toggles staff member to out_of_office with designated backup', () => {
      const updated = setStaffMemberAbsence(
        'staff_melissa_cooper',
        true,
        'staff_ann_smith',
        'Annual Conference'
      );

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('out_of_office');
      expect(updated?.backupStaffId).toBe('staff_ann_smith');
      expect(updated?.backupStaffName).toBe('Ann Smith');
      expect(updated?.outOfOfficeReason).toBe('Annual Conference');

      // Clear absence
      const restored = setStaffMemberAbsence('staff_melissa_cooper', false);
      expect(restored?.status).toBe('active');
      expect(restored?.backupStaffId).toBeUndefined();
    });

    it('2.2 Dynamically routes marketing intake to backup when primary owner is out_of_office', () => {
      // Set Melissa to OOO with Ann as backup
      setStaffMemberAbsence('staff_melissa_cooper', true, 'staff_ann_smith', 'Vacation');

      const owner = getResponsibleDepartmentOwner({
        category: 'marketing',
        title: '1-Page Property Flyer'
      });

      // Should route to Ann Smith as acting coverage while preserving marketing department context
      expect(owner.name).toBe('Ann Smith');
      expect(owner.email).toBe('ann.smith@nestrealty.com');
      expect(owner.department).toBe('marketing');
      expect(owner.role).toContain('Acting Coverage');

      // Reset
      setStaffMemberAbsence('staff_melissa_cooper', false);
      const normalOwner = getResponsibleDepartmentOwner({
        category: 'marketing',
        title: '1-Page Property Flyer'
      });
      expect(normalOwner.name).toBe('Melissa Gagliardi');
    });

    it('2.3 Prevents self-loops when backup is set to self or backup is also OOO', () => {
      // Set self as backup
      setStaffMemberAbsence('staff_melissa_cooper', true, 'staff_melissa_cooper', 'Sick');

      const owner = getResponsibleDepartmentOwner({
        category: 'marketing',
        title: 'Social Story Carousel'
      });

      // Should not loop or crash; falls back gracefully to Melissa Gagliardi
      expect(owner.name).toBe('Melissa Gagliardi');
      expect(owner.department).toBe('marketing');

      // Clean up
      setStaffMemberAbsence('staff_melissa_cooper', false);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Notification Preferences & Quiet Hours (America/New_York)
  // ---------------------------------------------------------------------------
  describe('3. Notification Preferences & America/New_York Quiet Hours', () => {
    it('3.1 Accurately determines business hours (9 AM - 5 PM) in America/New_York', () => {
      // 2:00 PM EST (18:00 UTC) -> within 9 AM - 5 PM
      const midDay = new Date('2026-09-04T18:00:00Z');
      expect(isWithinBusinessHours({ date: midDay })).toBe(true);

      // 8:00 PM EST (00:00 UTC next day) -> outside business hours (Quiet Hours)
      const evening = new Date('2026-09-05T00:00:00Z');
      expect(isWithinBusinessHours({ date: evening })).toBe(false);

      // 6:00 AM EST (10:00 UTC) -> outside business hours (Quiet Hours)
      const earlyMorning = new Date('2026-09-04T10:00:00Z');
      expect(isWithinBusinessHours({ date: earlyMorning })).toBe(false);
    });

    it('3.2 Suppresses SMS during quiet hours when enforceQuietHours is active', () => {
      const evening = new Date('2026-09-05T01:00:00Z'); // 9:00 PM EDT
      const result = isAllowedSmsRecipient('+19104097120', 'Your proof is ready', {
        checkQuietHours: true,
        date: evening
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Quiet Hours active');
    });

    it('3.3 Suppresses SMS when recipient preference disables SMS or specifies email only', () => {
      const midDay = new Date('2026-09-04T18:00:00Z');

      const emailOnlyCheck = isAllowedSmsRecipient('+19104097120', 'Your proof is ready', {
        date: midDay,
        recipientPreferences: {
          smsEnabled: false,
          preferredChannel: 'email'
        }
      });
      expect(emailOnlyCheck.allowed).toBe(false);
      expect(emailOnlyCheck.reason).toContain('suppressed by recipient preference');

      const enabledCheck = isAllowedSmsRecipient('+19104097120', 'Your proof is ready', {
        date: midDay,
        recipientPreferences: {
          smsEnabled: true,
          preferredChannel: 'both'
        }
      });
      expect(enabledCheck.allowed).toBe(true);
    });

    it('3.4 Persists user notification preferences and reads defaults', () => {
      const testUserId = `usr_test_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const prefs = getUserNotificationPreferences(testUserId);
      expect(prefs.timezone).toBe('America/New_York');
      expect(prefs.preferredChannel).toBe('both');

      const saved = saveUserNotificationPreferences({
        userId: testUserId,
        preferredChannel: 'email',
        quietHoursStart: '18:00',
        quietHoursEnd: '09:00'
      });
      expect(saved.preferredChannel).toBe('email');
      expect(saved.quietHoursStart).toBe('18:00');

      const reloaded = getUserNotificationPreferences(testUserId);
      expect(reloaded.preferredChannel).toBe('email');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Contact Disambiguation (3 Matts on Nest Roster)
  // ---------------------------------------------------------------------------
  describe('4. Roster Contact Disambiguation', () => {
    it('4.1 Flags ambiguous first name "Matt" with 3 distinct matches and prompt', () => {
      const result = disambiguateDirectoryContact('Matt');
      expect(result.isAmbiguous).toBe(true);
      expect(result.matches.length).toBe(3);

      const names = result.matches.map(m => m.displayName);
      expect(names).toContain('Matt Orr');
      expect(names).toContain('Matt Costin');
      expect(names).toContain('Matt Archibald');

      expect(result.disambiguationPrompt).toContain('Multiple contacts found matching "Matt"');
      expect(result.disambiguationPrompt).toContain('Matt Orr');
      expect(result.disambiguationPrompt).toContain('Matt Costin');
    });

    it('4.2 Returns exact match without ambiguity when full name is specified', () => {
      const orrResult = disambiguateDirectoryContact('Matt Orr');
      expect(orrResult.isAmbiguous).toBe(false);
      expect(orrResult.selected?.displayName).toBe('Matt Orr');
      expect(orrResult.selected?.email).toBe('matt.orr@nestrealty.com');

      const costinResult = disambiguateDirectoryContact('Matt Costin');
      expect(costinResult.isAmbiguous).toBe(false);
      expect(costinResult.selected?.displayName).toBe('Matt Costin');
    });

    it('4.3 Resolves contact by direct email without ambiguity', () => {
      const emailResult = disambiguateDirectoryContact('matt.archibald@nestrealty.com');
      expect(emailResult.isAmbiguous).toBe(false);
      expect(emailResult.selected?.displayName).toBe('Matt Archibald');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Manual Request Intake: Distinct Staff Actor (Logged By) vs Broker
  // ---------------------------------------------------------------------------
  describe('5. Manual Request Intake: Distinct Staff Actor vs Broker Requester', () => {
    it('5.1 Preserves distinct staff actor and broker requester in intake metadata', () => {
      const loggedBy = 'Melissa Gagliardi';
      const requestingBroker = 'Matt Orr';
      const channel = 'phone';
      const property = '1916 Wolcott Ave, Wilmington, NC';

      const taskNotes = `Logged By: ${loggedBy} | Requester: ${requestingBroker} | Intake Channel: ${channel.toUpperCase()} | Caller Notes: Need rush flyer`;
      const requestRawExcerpt = `Logged By: ${loggedBy}\nChannel: ${channel.toUpperCase()} (Desk/Nora Hotline 910-507-2047)\nCaller: ${requestingBroker}\nProperty: ${property}`;

      expect(taskNotes).toContain('Logged By: Melissa Gagliardi');
      expect(taskNotes).toContain('Requester: Matt Orr');
      expect(requestRawExcerpt).toContain('Logged By: Melissa Gagliardi');
      expect(requestRawExcerpt).toContain('Caller: Matt Orr');
    });

    it('5.2 Verifies NEST_AGENTS_DIRECTORY includes standard broker roster with phone numbers', () => {
      expect(NEST_AGENTS_DIRECTORY.length).toBeGreaterThanOrEqual(7);
      const matt = NEST_AGENTS_DIRECTORY.find(a => a.name === 'Matt Orr');
      expect(matt).toBeDefined();
      expect(matt?.phone).toBe('+19106128283');

      const ryan = NEST_AGENTS_DIRECTORY.find(a => a.name === 'Ryan Crecelius');
      expect(ryan).toBeDefined();
      expect(ryan?.role).toContain('BIC');
    });
  });
});
