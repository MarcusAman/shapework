import { describe, it, expect, beforeEach } from 'vitest';
import { convertCallToCanonicalMarketingRequest, getAllCanonicalMarketingTasks, cleanOrArchiveTasksForAssignees } from '../../server/persistence/marketingCampaignsRepository.js';
import { resolveActiveCoveringStaff, updateStaffMemberProfile, getAllStaffMembers } from '../../server/persistence/operationsDirectoryRepository.js';
import { CANONICAL_WORKSPACE_ROSTER } from '../services/canonicalRoster.js';
import { getTaskKanbanLane, KANBAN_LANES } from '../components/marketing/VAWorkspaceView.js';

describe('Marketing Intake Routing, Eduardo Delegation & Multi-Tier Backup Flow Suite', () => {
  const wsWilmington = 'ws_wilmington';

  beforeEach(() => {
    // Reset staff statuses to clean baseline
    updateStaffMemberProfile('dir_eduardo_lovo_73', { status: 'active', backupStaffId: 'dir_melissa_gagliardi_33', backupStaffName: 'Melissa Gagliardi' });
    updateStaffMemberProfile('dir_melissa_gagliardi_33', { status: 'active', backupStaffId: 'dir_ann_gunn_28', backupStaffName: 'Ann Gunn' });
    updateStaffMemberProfile('dir_ann_gunn_28', { status: 'active', backupStaffId: 'dir_ryan_crecelius_6', backupStaffName: 'Ryan Crecelius' });
  });

  it('1. Inbound marketing call creates tasks routed to Melissa Gagliardi first in Intake Received (request_received)', () => {
    const callPayload = {
      id: 'call_test_melissa_intake_001',
      callerName: 'Matt Orr',
      fromNumber: '+19105072047',
      propertyAddress: '117 South Live Oak Parkway, Wilmington, NC',
      transcript: 'Matt: I need 50 tri-fold open house flyers printed via CopyCat for 117 South Live Oak Parkway MLS 100458921.',
      durationSeconds: 45
    };

    const result = convertCallToCanonicalMarketingRequest(callPayload);
    expect(result.shouldCreate).toBe(true);
    expect(result.tasks.length).toBeGreaterThanOrEqual(1);

    const flyerTask = result.tasks.find(t => t.title.includes('Tri-Fold Flyer') || t.category === 'open_house');
    expect(flyerTask).toBeDefined();
    // Must route to Melissa Gagliardi first for intake review
    expect(flyerTask?.assignedTo).toBe('Melissa Gagliardi');
    expect(flyerTask?.assignedToRole).toBe('Marketing Director');
    expect(flyerTask?.status).toBe('request_received');
    expect(flyerTask?.reviewOwner).toBe('Melissa Gagliardi');
  });

  it('2. Inbound operations call creates tasks routed to Ann Gunn first in Intake Received (request_received)', () => {
    const callPayload = {
      id: 'call_test_ann_ops_002',
      callerName: 'Sarah Jenkins',
      fromNumber: '+19105551234',
      propertyAddress: '402 Ocean View Ave, Wilmington, NC',
      transcript: 'Sarah: We need a yard sign post installed with custom rider at 402 Ocean View Ave by Coastal Sign Post Co.',
      durationSeconds: 30
    };

    const result = convertCallToCanonicalMarketingRequest(callPayload);
    expect(result.shouldCreate).toBe(true);

    const signTask = result.tasks.find(t => t.category === 'signage');
    expect(signTask).toBeDefined();
    // Must route to Ann Gunn first for operations review (review owner BIC Ryan Crecelius under SOP-OPS-001)
    expect(signTask?.assignedTo).toBe('Ann Gunn');
    expect(signTask?.assignedToRole).toBe('Operations & Signage Lead');
    expect(signTask?.status).toBe('request_received');
    expect(signTask?.reviewOwner).toBe('Ryan Crecelius');
  });

  it('3. Roster verifies Eduardo Lovo backup is Melissa Gagliardi, and Melissa backup is Ann Gunn', () => {
    const eduardo = CANONICAL_WORKSPACE_ROSTER.find(m => m.id === 'dir_eduardo_lovo_73');
    expect(eduardo).toBeDefined();
    expect(eduardo?.backupStaffId).toBe('dir_melissa_gagliardi_33');
    expect(eduardo?.backupStaffName).toBe('Melissa Gagliardi');
    expect(eduardo?.coveringStaffName).toBe('Melissa Gagliardi');

    const melissa = CANONICAL_WORKSPACE_ROSTER.find(m => m.id === 'dir_melissa_gagliardi_33');
    expect(melissa).toBeDefined();
    expect(melissa?.backupStaffId).toBe('dir_ann_gunn_28');
    expect(melissa?.backupStaffName).toBe('Ann Gunn');
  });

  it('4. When Eduardo is Out of Office, tasks fall back to Melissa Gagliardi (not Ann Gunn)', () => {
    updateStaffMemberProfile('dir_eduardo_lovo_73', {
      status: 'out_of_office',
      backupStaffId: 'dir_melissa_gagliardi_33',
      backupStaffName: 'Melissa Gagliardi'
    });

    const covering = resolveActiveCoveringStaff('dir_eduardo_lovo_73', wsWilmington);
    expect(covering).toBeDefined();
    expect(covering?.fullName).toBe('Melissa Gagliardi');
    expect(covering?.id).toBe('dir_melissa_gagliardi_33');
  });

  it('5. Dual OOO Cascade: When Eduardo AND Melissa are both Out of Office, task cascades to Ann Gunn', () => {
    // Both Eduardo and Melissa are OOO
    updateStaffMemberProfile('dir_eduardo_lovo_73', {
      status: 'out_of_office',
      backupStaffId: 'dir_melissa_gagliardi_33',
      backupStaffName: 'Melissa Gagliardi'
    });
    updateStaffMemberProfile('dir_melissa_gagliardi_33', {
      status: 'out_of_office',
      backupStaffId: 'dir_ann_gunn_28',
      backupStaffName: 'Ann Gunn'
    });

    // Cascade resolution should evaluate Eduardo -> Melissa (OOO) -> Ann Gunn (Active)
    const emergencyCovering = resolveActiveCoveringStaff('dir_eduardo_lovo_73', wsWilmington);
    expect(emergencyCovering).toBeDefined();
    expect(emergencyCovering?.fullName).toBe('Ann Gunn');
    expect(emergencyCovering?.id).toBe('dir_ann_gunn_28');
  });

  it('6. Kanban Lane Configuration contains Ready queue lane', () => {
    const readyLane = KANBAN_LANES.find(l => l.id === 'ready');
    expect(readyLane).toBeDefined();
    expect(readyLane?.title).toBe('Ready');
  });

  it('7. Tasks in request_received map to ready Kanban lane in VA Workspace', () => {
    const intakeTask = {
      id: 'task_demo_intake_1',
      status: 'request_received',
      title: 'Open House Tri-Fold Flyer'
    } as any;

    const lane = getTaskKanbanLane(intakeTask);
    expect(lane).toBe('ready');
  });
});
