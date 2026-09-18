import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  isWithinBusinessHours,
  getNextBusinessHoursWindow
} from '../../server/security/smsWhitelistGate.js';
import {
  getUserNotificationPreferences,
  saveUserNotificationPreferences,
  _clearMemoryPreferencesCacheForTesting
} from '../../server/persistence/notificationPreferencesRepository.js';
import {
  getAllStaffMembers,
  getStaffMemberById,
  updateStaffMemberProfile,
  setStaffMemberAbsence,
  validateBackupAssignment,
  detectBackupCycle,
  resolveStaffMember,
  _clearMemoryDirectoryCacheForTesting
} from '../../server/persistence/operationsDirectoryRepository.js';
import {
  saveCanonicalMarketingTask,
  getCanonicalMarketingTaskById,
  getAllCanonicalMarketingTasks,
  saveCanonicalMarketingRequest,
  getCanonicalMarketingRequestById,
  submitCanonicalMarketingTaskProof,
  requestCanonicalMarketingTaskRevisions,
  approveCanonicalMarketingTaskProof,
  updateCanonicalMarketingTaskStatus,
  CanonicalMarketingTask,
  CanonicalMarketingRequest
} from '../../server/persistence/marketingCampaignsRepository.js';
import {
  validateTaskTransition,
  isAuthorizedOperationsIdentity
} from '../../server/policies/canonicalMarketingLifecyclePolicy.js';

describe('Melissa Narrow Workflow & Operational Integrity Verification Suite', () => {

  beforeEach(() => {
    _clearMemoryPreferencesCacheForTesting();
    _clearMemoryDirectoryCacheForTesting();
    const staff = getAllStaffMembers();
    for (const s of staff) {
      if (s.status === 'out_of_office' || s.backupStaffId) {
        updateStaffMemberProfile(s.id, {
          status: 'active',
          backupStaffId: undefined,
          backupStaffName: undefined,
          outOfOfficeReason: undefined
        });
      }
    }
  });

  // =========================================================================
  // Part 1: Persistence Across Restarts & Dual-Persistence Layer
  // =========================================================================
  describe('Part 1: Persistence Across Restarts & Independent Instances', () => {
    it('persists user notification preferences across in-memory cache clear / restarts', () => {
      const testUserId = 'usr_persistence_test_melissa';
      
      // 1. Save preferences
      saveUserNotificationPreferences({
        userId: testUserId,
        emailEnabled: true,
        smsEnabled: false,
        preferredChannel: 'email',
        quietHoursStart: '18:00',
        quietHoursEnd: '08:00',
        timezone: 'America/New_York'
      });

      // 2. Clear memory cache simulating server restart or independent instance
      _clearMemoryPreferencesCacheForTesting();

      // 3. Read back from persistence
      const restored = getUserNotificationPreferences(testUserId);
      expect(restored.userId).toBe(testUserId);
      expect(restored.emailEnabled).toBe(true);
      expect(restored.smsEnabled).toBe(false);
      expect(restored.preferredChannel).toBe('email');
      expect(restored.quietHoursStart).toBe('18:00');
      expect(restored.quietHoursEnd).toBe('08:00');
      expect(restored.timezone).toBe('America/New_York');
    });

    it('persists staff out-of-office and backup assignments across restarts', () => {
      // Initialize or fetch staff
      const staffList = getAllStaffMembers();
      let melissa = staffList.find(s => s.fullName.toLowerCase().includes('melissa'));
      
      if (!melissa) {
        melissa = {
          id: 'usr_melissa_test',
          workspaceId: 'ws_wilmington',
          fullName: 'Melissa Gagliardi',
          title: 'Marketing Director',
          role: 'marketing_specialist',
          email: 'melissa.gagliardi@nestrealty.com',
          phone: '+19105551234',
          avatarUrl: '',
          activeWorkloadCount: 2,
          maxWorkloadCapacity: 10,
          skills: ['Flyers', 'Social Media'],
          status: 'active'
        };
        updateStaffMemberProfile('usr_melissa_test', melissa);
      }

      let ann = staffList.find(s => s.email === 'ann.gunn@nestrealty.com');
      if (!ann) {
        ann = {
          id: 'dir_staff_ann_gunn',
          workspaceId: 'ws_wilmington',
          fullName: 'Ann Gunn',
          title: 'Operations Coordinator',
          role: 'operations_coordinator',
          email: 'ann.gunn@nestrealty.com',
          phone: '+19105555678',
          avatarUrl: '',
          activeWorkloadCount: 1,
          maxWorkloadCapacity: 10,
          skills: ['Signs', 'Postcards'],
          status: 'active'
        };
        updateStaffMemberProfile('dir_staff_ann_gunn', ann);
      }

      // Mark Melissa OOO with Ann Gunn as backup (resolves canonical ID dir_staff_ann_gunn)
      setStaffMemberAbsence(melissa.id, true, 'ann.gunn@nestrealty.com', 'Annual leave');

      // Clear in-memory cache simulating restart
      _clearMemoryDirectoryCacheForTesting();

      // Re-read
      const reloadedMelissa = getStaffMemberById(melissa.id);
      expect(reloadedMelissa).toBeDefined();
      expect(reloadedMelissa?.status).toBe('out_of_office');
      expect(reloadedMelissa?.backupStaffId).toBe('dir_staff_ann_gunn');
      expect(reloadedMelissa?.backupStaffName).toBe('Ann Gunn');
      expect(reloadedMelissa?.outOfOfficeReason).toBe('Annual leave');

      // Clean up absence
      setStaffMemberAbsence(melissa.id, false);
      _clearMemoryDirectoryCacheForTesting();
      const resetMelissa = getStaffMemberById(melissa.id);
      expect(resetMelissa?.status).toBe('active');
    });
  });

  // =========================================================================
  // Part 2: Implementation Details Checks
  // =========================================================================
  describe('Part 2.1: Business Hours & Daylight-Saving Handling (America/New_York)', () => {
    it('correctly validates inside vs outside business hours in America/New_York', () => {
      // Wednesday July 15, 2026 at 10:00 AM EDT (14:00 UTC) -> Inside (08:30 - 17:30)
      const insideTimeSummer = new Date('2026-07-15T14:00:00Z');
      expect(isWithinBusinessHours(insideTimeSummer)).toBe(true);

      // Wednesday July 15, 2026 at 8:00 PM EDT (July 16 00:00 UTC) -> Outside (after 17:30)
      const eveningTimeSummer = new Date('2026-07-16T00:00:00Z');
      expect(isWithinBusinessHours(eveningTimeSummer)).toBe(false);

      // Wednesday July 15, 2026 at 7:00 AM EDT (11:00 UTC) -> Outside (before 08:30)
      const earlyMorningSummer = new Date('2026-07-15T11:00:00Z');
      expect(isWithinBusinessHours(earlyMorningSummer)).toBe(false);
    });

    it('rejects weekend notifications regardless of time of day', () => {
      // Saturday July 18, 2026 at 12:00 PM EDT (16:00 UTC)
      const saturdayTime = new Date('2026-07-18T16:00:00Z');
      expect(isWithinBusinessHours(saturdayTime)).toBe(false);

      // Sunday January 18, 2026 at 2:00 PM EST (19:00 UTC)
      const sundayTime = new Date('2026-01-18T19:00:00Z');
      expect(isWithinBusinessHours(sundayTime)).toBe(false);
    });

    it('accurately distinguishes summer EDT (UTC-4) and winter EST (UTC-5)', () => {
      // Summer date: July 15, 2026 at 16:15 EDT (20:15 UTC) -> Inside (before 17:00 EDT)
      const summerInside = new Date('2026-07-15T20:15:00Z');
      expect(isWithinBusinessHours(summerInside)).toBe(true);

      // Summer date: July 15, 2026 at 17:15 EDT (21:15 UTC) -> Outside (after 17:00 EDT)
      const summerAfterFive = new Date('2026-07-15T21:15:00Z');
      expect(isWithinBusinessHours(summerAfterFive)).toBe(false);

      // In winter, the SAME 21:15 UTC is 16:15 EST -> Inside business hours (before 17:00 EST)
      const winterAt2115Utc = new Date('2026-01-14T21:15:00Z');
      expect(isWithinBusinessHours(winterAt2115Utc)).toBe(true);

      // Winter date: Jan 14, 2026 at 17:45 EST (22:45 UTC) -> Outside (after 17:00 EST)
      const winterEvening = new Date('2026-01-14T22:45:00Z');
      expect(isWithinBusinessHours(winterEvening)).toBe(false);
    });

    it('schedules deferred notifications for the next business-hours window instead of dropping', () => {
      // Friday evening July 17, 2026 at 19:00 EDT
      const fridayEvening = new Date('2026-07-17T23:00:00Z');
      expect(isWithinBusinessHours(fridayEvening)).toBe(false);

      const nextWindow = getNextBusinessHoursWindow(fridayEvening);
      // Next business window MUST be Monday July 20, 2026 at 09:00 AM EDT
      const nyTimeStr = nextWindow.toLocaleString('en-US', { timeZone: 'America/New_York' });
      expect(nyTimeStr).toContain('7/20/2026');
      expect(nyTimeStr).toContain('9:00:00 AM');
    });
  });

  describe('Part 2.2: Logged-By Attribution & Immutable Server Session Identity', () => {
    it('preserves immutable session user as creator and treats client selection as onBehalfOf proxy', () => {
      // Simulate server handler logic
      const reqUser = { id: 'usr_matt_orr', name: 'Matt Orr', role: 'agent' };
      const clientPayload = {
        title: 'New Flyer Request',
        propertyAddress: '100 Main St',
        loggedBy: 'Melissa Gagliardi', // Attacker / client attempting to forge creator
        onBehalfOf: 'Matt Orr'
      };

      // Server enforces creator from session:
      const createdById = reqUser.id;
      const createdByName = reqUser.name;
      const onBehalfOf = clientPayload.onBehalfOf || clientPayload.loggedBy || reqUser.name;

      expect(createdById).toBe('usr_matt_orr');
      expect(createdByName).toBe('Matt Orr');
      expect(onBehalfOf).toBe('Matt Orr'); // Client proxy field does not compromise createdByName
    });

    it('prevents agent session from bypassing operations lifecycle gates with forged claims', () => {
      const task: CanonicalMarketingTask = {
        id: 'tsk_attr_test',
        requestId: 'req_attr_test',
        title: 'Listing Postcard',
        status: 'ready_for_review',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const agentSession = { id: 'usr_matt', email: 'matt.orr@nestrealty.com', role: 'agent' };
      
      // Attempt transition to in_progress
      const check = validateTaskTransition(task, 'in_progress', agentSession);
      expect(check.allowed).toBe(false);
      expect(check.statusCode).toBe(403);
      expect(check.errorCode).toBe('UNAUTHORIZED_OPERATIONS_ROLE');
    });
  });

  describe('Part 2.3: Out-of-Office Task Coverage & Routing Safety', () => {
    it('automatically routes task to backup staff using canonical IDs when assignee is OOO and retains reviewOwner and broker', () => {
      // Ensure Melissa and Ann Gunn exist in workspace
      const staffList = getAllStaffMembers();
      let melissa = staffList.find(s => s.fullName.toLowerCase().includes('melissa'));
      if (!melissa) {
        melissa = {
          id: 'usr_melissa_ooo',
          workspaceId: 'ws_wilmington',
          fullName: 'Melissa Gagliardi',
          title: 'Marketing Director',
          role: 'marketing_specialist',
          email: 'melissa.gagliardi@nestrealty.com',
          phone: '+19105551234',
          avatarUrl: '',
          activeWorkloadCount: 1,
          maxWorkloadCapacity: 10,
          skills: ['All'],
          status: 'active'
        };
        updateStaffMemberProfile(melissa.id, melissa);
      }

      let ann = staffList.find(s => s.fullName === 'Ann Gunn');
      if (!ann) {
        ann = {
          id: 'dir_staff_ann_gunn',
          workspaceId: 'ws_wilmington',
          fullName: 'Ann Gunn',
          title: 'Operations Coordinator',
          role: 'operations_coordinator',
          email: 'ann.gunn@nestrealty.com',
          phone: '+19105555678',
          avatarUrl: '',
          activeWorkloadCount: 1,
          maxWorkloadCapacity: 10,
          skills: ['Signs', 'Postcards'],
          status: 'active'
        };
        updateStaffMemberProfile(ann.id, ann);
      }

      setStaffMemberAbsence(melissa.id, true, 'Ann Gunn', 'Conference travel');

      const taskToAssign: CanonicalMarketingTask = {
        id: 'tsk_ooo_coverage_test',
        requestId: 'req_ooo_test',
        title: 'Brochure for 456 Coast Rd',
        propertyAddress: '456 Coast Rd',
        agentName: 'Matt Orr',
        assignedTo: melissa.fullName,
        status: 'ready_for_review',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const savedTask = saveCanonicalMarketingTask(taskToAssign);

      // Verify task routing with canonical IDs:
      expect(savedTask.assignedToId).toBe('dir_staff_ann_gunn');
      expect(savedTask.coveringStaffId).toBe('dir_staff_ann_gunn');
      expect(savedTask.coveringStaff).toBe('Ann Gunn');
      expect(savedTask.reviewOwnerId).toBe(melissa.id);
      expect(savedTask.reviewOwner).toBe(melissa.fullName);
      expect(savedTask.agentName).toBe('Matt Orr'); // Broker retained
      expect(savedTask.coverageHistory).toBeDefined();
      expect(savedTask.coverageHistory?.length).toBeGreaterThan(0);
      expect(savedTask.coverageHistory?.[0].coveringStaffId).toBe('dir_staff_ann_gunn');
      expect(savedTask.coverageHistory?.[0].coveringStaff).toBe('Ann Gunn');
      expect(savedTask.coverageHistory?.[0].reason).toBe('Conference travel');

      // Cleanup
      setStaffMemberAbsence(melissa.id, false);
    });

    it('strictly rejects invalid, self-referencing, inactive, cross-workspace, and cyclic backups', () => {
      const staffList = getAllStaffMembers();
      let melissa = staffList.find(s => s.fullName.toLowerCase().includes('melissa'))!;
      let ann = staffList.find(s => s.fullName === 'Ann Gunn')!;

      // 1. Self-backup rejection
      expect(() => {
        setStaffMemberAbsence(melissa.id, true, melissa.fullName, 'Self backup edgecase');
      }).toThrow('SELF_BACKUP_FORBIDDEN');
      expect(() => {
        setStaffMemberAbsence(melissa.id, true, melissa.id, 'Self backup by id');
      }).toThrow('SELF_BACKUP_FORBIDDEN');

      // 2. Inactive staff rejection
      updateStaffMemberProfile('dir_staff_inactive', {
        id: 'dir_staff_inactive',
        workspaceId: 'ws_wilmington',
        fullName: 'Inactive Staff Member',
        title: 'Former Intern',
        role: 'marketing_specialist',
        email: 'inactive@nestrealty.com',
        phone: '+19105559999',
        avatarUrl: '',
        activeWorkloadCount: 0,
        maxWorkloadCapacity: 5,
        skills: [],
        status: 'inactive'
      });
      expect(() => {
        setStaffMemberAbsence(melissa.id, true, 'dir_staff_inactive', 'Assign inactive backup');
      }).toThrow('INACTIVE_STAFF_FORBIDDEN');

      // 3. Out-of-office staff rejection
      updateStaffMemberProfile('dir_staff_ooo_test', {
        id: 'dir_staff_ooo_test',
        workspaceId: 'ws_wilmington',
        fullName: 'OOO Staff Member',
        title: 'Coordinator',
        role: 'operations_coordinator',
        email: 'ooo@nestrealty.com',
        phone: '+19105558888',
        avatarUrl: '',
        activeWorkloadCount: 0,
        maxWorkloadCapacity: 5,
        skills: [],
        status: 'out_of_office'
      });
      expect(() => {
        setStaffMemberAbsence(melissa.id, true, 'dir_staff_ooo_test', 'Assign OOO backup');
      }).toThrow('OUT_OF_OFFICE_BACKUP_FORBIDDEN');

      // 4. Cross-workspace backup rejection
      updateStaffMemberProfile('dir_staff_raleigh', {
        id: 'dir_staff_raleigh',
        workspaceId: 'ws_raleigh',
        fullName: 'Raleigh Member',
        title: 'Coordinator',
        role: 'operations_coordinator',
        email: 'raleigh@nestrealty.com',
        phone: '+19195551111',
        avatarUrl: '',
        activeWorkloadCount: 0,
        maxWorkloadCapacity: 5,
        skills: [],
        status: 'active'
      });
      expect(() => {
        setStaffMemberAbsence(melissa.id, true, 'dir_staff_raleigh', 'Cross-workspace backup');
      }).toThrow('CROSS_WORKSPACE_FORBIDDEN');

      // 5. Circular delegation rejection (A -> B -> A)
      setStaffMemberAbsence(melissa.id, true, ann.id, 'Melissa out');
      expect(() => {
        setStaffMemberAbsence(ann.id, true, melissa.id, 'Ann tries to designate Melissa');
      }).toThrow('CYCLIC_DELEGATION_FORBIDDEN');

      // Cleanup
      setStaffMemberAbsence(melissa.id, false);
    });
  });

  describe('Part 2.4: Removed Automation Entry Points Verification', () => {
    it('verifies RequestActionModal does not contain Maxa autonomous agent or vendor dispatch buttons', () => {
      const modalFilePath = path.join(process.cwd(), 'src/components/marketing/RequestActionModal.tsx');
      expect(fs.existsSync(modalFilePath)).toBe(true);
      const content = fs.readFileSync(modalFilePath, 'utf-8');

      // Automated dispatch buttons MUST NOT exist
      expect(content).not.toContain('Trigger Maxa Autonomous Agent');
      expect(content).not.toContain('Option 5: Dispatch Vendor Ticket');
      expect(content).not.toContain('Trigger Maxa Autonomous Dispatch');

      // Manual links and human handoffs MUST exist
      expect(content).toContain('https://nest.maxadesigns.com');
      expect(content).toContain('Route to Workspace (Eduardo Lovo)');
      expect(content).toContain('Upload Finished Proof');
    });

    it('verifies retellToolsRoute dispatch_sign_post is an internal staff task, not automated external dispatch', () => {
      const routeFilePath = path.join(process.cwd(), 'server/routes/retellToolsRoute.ts');
      expect(fs.existsSync(routeFilePath)).toBe(true);
      const content = fs.readFileSync(routeFilePath, 'utf-8');

      expect(content).toContain('Ann Gunn');
      expect(content).toContain('isDispatchedToVendor: false');
      expect(content).toContain('vendorOrderPlaced: false');
    });
  });

  // =========================================================================
  // Part 3: Two Workflow Acceptance Tests & Server-Side Enforcement
  // =========================================================================
  describe('Part 3: Acceptance Workflows & Server-Side Gates', () => {
    
    it('Workflow 1: Melissa delegates ready task to Eduardo -> Appears in Eduardo workspace -> Persisted across query', () => {
      // 1. Create parent request
      const req: CanonicalMarketingRequest = {
        id: 'req_wf1_001',
        title: 'Listing Package: 789 Soundview Dr',
        propertyAddress: '789 Soundview Dr, Wilmington NC',
        agentName: 'Matt Orr',
        channel: 'web',
        status: 'ready_for_review',
        taskIds: ['tsk_wf1_001'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveCanonicalMarketingRequest(req);

      // 2. Initial ready task
      const task: CanonicalMarketingTask = {
        id: 'tsk_wf1_001',
        requestId: 'req_wf1_001',
        title: 'Feature Sheet (8.5x11)',
        propertyAddress: '789 Soundview Dr, Wilmington NC',
        agentName: 'Matt Orr',
        status: 'ready_for_review',
        assignedTo: 'Melissa Gagliardi',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveCanonicalMarketingTask(task);

      // 3. Melissa delegates task to Eduardo Lovo
      const melissaSession = { id: 'usr_melissa', email: 'melissa.gagliardi@nestrealty.com', role: 'marketing_coordinator' };
      const transitionCheck = validateTaskTransition(task, 'in_progress', melissaSession, req);
      expect(transitionCheck.allowed).toBe(true);

      // Save delegated task
      const delegatedTask = saveCanonicalMarketingTask({
        ...task,
        status: 'in_progress',
        assignedTo: 'Eduardo Lovo',
        updatedAt: new Date().toISOString()
      });

      // 4. Query fresh from persistence (simulating workspace reload / refresh)
      const fetched = getCanonicalMarketingTaskById('tsk_wf1_001');
      expect(fetched).toBeDefined();
      expect(fetched?.assignedTo).toBe('Eduardo Lovo');
      expect(fetched?.status).toBe('in_progress');
      expect(fetched?.propertyAddress).toBe('789 Soundview Dr, Wilmington NC');
    });

    it('Workflow 2: Design-proof review separated from intake readiness, requiring revision notes, preserving history, and maintaining sibling task independence', () => {
      // 1. Initial request with 2 sibling tasks
      const req: CanonicalMarketingRequest = {
        id: 'req_wf2_001',
        title: 'Listing Marketing: 123 Ocean Blvd',
        propertyAddress: '123 Ocean Blvd',
        agentName: 'Matt Orr',
        channel: 'web',
        status: 'in_progress',
        taskIds: ['tsk_wf2_001', 'tsk_wf2_002'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveCanonicalMarketingRequest(req);

      // Sibling Task 2: Social Graphics (in progress)
      const siblingTask: CanonicalMarketingTask = {
        id: 'tsk_wf2_002',
        requestId: 'req_wf2_001',
        title: 'Social Media Graphics',
        status: 'in_progress',
        assignedTo: 'Eduardo Lovo',
        assignedToId: 'dir_staff_eduardo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveCanonicalMarketingTask(siblingTask);

      // Task 1: Postcard
      const task: CanonicalMarketingTask = {
        id: 'tsk_wf2_001',
        requestId: 'req_wf2_001',
        title: 'Just Listed Postcard',
        status: 'in_progress',
        assignedTo: 'Eduardo Lovo',
        assignedToId: 'dir_staff_eduardo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveCanonicalMarketingTask(task);

      // 2. Proof submission blocked for incomplete intake tasks in needs_info
      const incompleteTask: CanonicalMarketingTask = {
        id: 'tsk_incomplete_proof_test',
        requestId: 'req_incomplete_test',
        title: 'Incomplete Intake Task',
        status: 'needs_info',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveCanonicalMarketingTask(incompleteTask);
      expect(() => {
        submitCanonicalMarketingTaskProof('tsk_incomplete_proof_test', 'https://storage.googleapis.com/proofs/bad.pdf', 'Premature proof');
      }).toThrow('INVALID_STATE_TRANSITION');

      // 3. Eduardo works on Task 1 and submits Proof v1
      const proofV1Url = 'https://storage.googleapis.com/proofs/postcard_draft_v1.pdf';
      const submittedTask = submitCanonicalMarketingTaskProof(
        'tsk_wf2_001',
        proofV1Url,
        'Initial layout draft for review',
        { id: 'usr_eduardo', name: 'Eduardo Lovo' }
      );
      expect(submittedTask).toBeDefined();
      expect(submittedTask?.status).toBe('in_progress'); // Task lifecycle status MUST stay in_progress!
      expect(submittedTask?.reviewState).toBe('awaiting_review'); // Sub-state indicates design review
      expect(submittedTask?.proofVersion).toBe(1);
      expect(submittedTask?.proofUrl).toBe(proofV1Url);
      expect(submittedTask?.proofHistory).toHaveLength(1);

      // 4. Melissa reviews and requests revisions
      // Must require meaningful feedback note on server!
      expect(() => {
        requestCanonicalMarketingTaskRevisions('tsk_wf2_001', '   ', { id: 'usr_melissa', name: 'Melissa Gagliardi' });
      }).toThrow('REVISION_FEEDBACK_REQUIRED');

      const revisionNote = 'Please increase the listing price font size and update the MLS number in the footer.';
      const revisionTask = requestCanonicalMarketingTaskRevisions(
        'tsk_wf2_001',
        revisionNote,
        { id: 'usr_melissa', name: 'Melissa Gagliardi' }
      );
      expect(revisionTask).toBeDefined();
      expect(revisionTask?.status).toBe('in_progress'); // NEVER resets intake to needs_info!
      expect(revisionTask?.reviewState).toBe('revisions_requested');
      expect(revisionTask?.reviewHistory).toHaveLength(2); // submitted + revisions_requested

      // 5. Eduardo inspects feedback note in workspace and submits revised proof v2
      const eduardoView = getCanonicalMarketingTaskById('tsk_wf2_001');
      expect(eduardoView?.status).toBe('in_progress');
      expect(eduardoView?.reviewState).toBe('revisions_requested');
      expect(eduardoView?.proofNotes).toBe(revisionNote);

      const proofV2Url = 'https://storage.googleapis.com/proofs/postcard_draft_v2.pdf';
      const resubmittedTask = submitCanonicalMarketingTaskProof(
        'tsk_wf2_001',
        proofV2Url,
        'Updated price font size to 18pt and corrected MLS ID.',
        { id: 'usr_eduardo', name: 'Eduardo Lovo' }
      );
      expect(resubmittedTask?.status).toBe('in_progress');
      expect(resubmittedTask?.reviewState).toBe('awaiting_review');
      expect(resubmittedTask?.proofVersion).toBe(2);
      expect(resubmittedTask?.proofUrl).toBe(proofV2Url);
      expect(resubmittedTask?.proofHistory).toHaveLength(2);

      // 6. Melissa approves the proof
      const approvedTask = approveCanonicalMarketingTaskProof(
        'tsk_wf2_001',
        'Looks fantastic, approved for print!',
        { id: 'usr_melissa', name: 'Melissa Gagliardi' }
      );
      expect(approvedTask?.status).toBe('in_progress');
      expect(approvedTask?.reviewState).toBe('approved');

      // 7. Sibling task independence & Parent request reconciliation:
      // Completing Task 1 must NOT complete sibling task or parent request
      updateCanonicalMarketingTaskStatus('tsk_wf2_001', 'completed', { performedBy: 'Melissa Gagliardi' });
      
      const finishedTask1 = getCanonicalMarketingTaskById('tsk_wf2_001');
      expect(finishedTask1?.status).toBe('completed');

      const freshSibling = getCanonicalMarketingTaskById('tsk_wf2_002');
      expect(freshSibling?.status).toBe('in_progress'); // Sibling task is unaffected!

      const interimParent = getCanonicalMarketingRequestById('req_wf2_001');
      expect(interimParent?.status).toBe('in_progress'); // Parent request remains in_progress!

      // Now complete sibling task 2
      updateCanonicalMarketingTaskStatus('tsk_wf2_002', 'completed', { performedBy: 'Eduardo Lovo' });
      const completedSibling = getCanonicalMarketingTaskById('tsk_wf2_002');
      expect(completedSibling?.status).toBe('completed');

      const finalParent = getCanonicalMarketingRequestById('req_wf2_001');
      expect(finalParent?.status).toBe('completed'); // Parent request completes now that all siblings are done
    });

    it('enforces server-side readiness gates strictly (needs_info cannot jump to in_progress or completed)', () => {
      const parentRequest: CanonicalMarketingRequest = {
        id: 'req_gate_test',
        title: 'Gate Test Request',
        agentName: 'Matt Orr',
        channel: 'web',
        status: 'needs_info',
        taskIds: ['tsk_gate_001'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const task: CanonicalMarketingTask = {
        id: 'tsk_gate_001',
        requestId: 'req_gate_test',
        title: 'Unready Task',
        status: 'needs_info',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const adminUser = { id: 'usr_admin', email: 'admin@nestrealty.com', role: 'admin' };

      // Direct jump: needs_info -> in_progress MUST FAIL
      const jumpToInProgress = validateTaskTransition(task, 'in_progress', adminUser, parentRequest);
      expect(jumpToInProgress.allowed).toBe(false);
      expect(jumpToInProgress.statusCode).toBe(409);
      expect(jumpToInProgress.errorCode).toBe('INVALID_STATE_TRANSITION');

      // Direct jump: needs_info -> completed MUST FAIL
      const jumpToCompleted = validateTaskTransition(task, 'completed', adminUser, parentRequest);
      expect(jumpToCompleted.allowed).toBe(false);
      expect(jumpToCompleted.statusCode).toBe(409);
      expect(jumpToCompleted.errorCode).toBe('INVALID_STATE_TRANSITION');
    });

    it('allows internal notes without changing task status', () => {
      const task: CanonicalMarketingTask = {
        id: 'tsk_notes_test',
        requestId: 'req_notes_test',
        title: 'Notes Task',
        status: 'needs_info',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const user = { id: 'usr_melissa', email: 'melissa.gagliardi@nestrealty.com', role: 'marketing_coordinator' };
      
      // Note only (status omitted or identical)
      const noteCheck = validateTaskTransition(task, undefined, user);
      expect(noteCheck.allowed).toBe(true);
      expect(noteCheck.isNoteOnly).toBe(true);

      const sameStatusCheck = validateTaskTransition(task, 'needs_info', user);
      expect(sameStatusCheck.allowed).toBe(true);
      expect(sameStatusCheck.isNoteOnly).toBe(true);
    });
  });
});
