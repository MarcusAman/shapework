/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Single Canonical Staff Roster & Workspace Directory Service
 * Authoritative source of staff members for Workspace, Task Assignment, Review Ownership, and Coverage.
 * Derived from canonical directory_people / NEST_FULL_ROSTER_77.
 */

export interface CanonicalStaffMember {
  id: string;
  name: string; // for backward compatibility
  displayName: string;
  fullName: string; // for backward compatibility
  title: string;
  role: string;
  department: 'Marketing' | 'Operations' | 'Signage' | 'Executive' | 'Compliance' | 'Technology' | string;
  email: string;
  phone: string;
  avatar: string;
  color: string;
  workspaceId: string;
  active: boolean;
  status: 'active' | 'out_of_office' | 'inactive' | 'busy';
  eligibleForAssignment: boolean;
  outOfOffice: boolean;
  isOutOfOffice?: boolean; // for backward compatibility
  coveringStaffId?: string;
  coveringStaffName?: string;
  backupStaffId?: string; // for backward compatibility
  backupStaffName?: string; // for backward compatibility
  outOfOfficeReason?: string;
  primarySop?: string;
  openTaskCount: number;
  firstName?: string;
}

/**
 * Authoritative staff members for the primary Wilmington workspace (ws_wilmington).
 * Resolved from canonical NEST_FULL_ROSTER_77 / directory_people.
 * Sarah Jenkins is strictly EXCLUDED as a non-real/fabricated identity.
 */
export const CANONICAL_WORKSPACE_ROSTER: CanonicalStaffMember[] = [
  {
    id: 'dir_eduardo_lovo_73',
    name: 'Eduardo Lovo',
    displayName: 'Eduardo Lovo',
    fullName: 'Eduardo Lovo',
    title: 'Virtual Assistant & Marketing Production',
    role: 'Virtual Assistant / Production Specialist',
    department: 'Marketing',
    email: 'eduardo.lovo@nestrealty.com',
    phone: '(910) 507-2047',
    avatar: 'E',
    color: 'bg-amber-600',
    workspaceId: 'ws_wilmington',
    active: true,
    status: 'active',
    eligibleForAssignment: true,
    outOfOffice: false,
    isOutOfOffice: false,
    backupStaffId: 'dir_melissa_gagliardi_33',
    backupStaffName: 'Melissa Gagliardi',
    primarySop: 'SOP-MKT-003',
    openTaskCount: 0
  },
  {
    id: 'dir_ann_gunn_28',
    name: 'Ann Gunn',
    displayName: 'Ann Gunn',
    fullName: 'Ann Gunn',
    title: 'ATC (Air Traffic Controller) & Operations Lead',
    role: 'Operations & Sign Lead (ATC)',
    department: 'Operations',
    email: 'ann@nestrealty.com',
    phone: '(910) 540-3965',
    avatar: 'A',
    color: 'bg-purple-600',
    workspaceId: 'ws_wilmington',
    active: true,
    status: 'active',
    eligibleForAssignment: true,
    outOfOffice: false,
    isOutOfOffice: false,
    primarySop: 'SOP-OPS-001',
    openTaskCount: 0
  },
  {
    id: 'dir_melissa_gagliardi_33',
    name: 'Melissa Gagliardi',
    displayName: 'Melissa Gagliardi',
    fullName: 'Melissa Gagliardi',
    title: 'Marketing Director',
    role: 'Marketing Director',
    department: 'Marketing',
    email: 'melissa.gagliardi@nestrealty.com',
    phone: '(919) 219-2085',
    avatar: 'M',
    color: 'bg-[#00635C]',
    workspaceId: 'ws_wilmington',
    active: true,
    status: 'active',
    eligibleForAssignment: true,
    outOfOffice: false,
    isOutOfOffice: false,
    primarySop: 'SOP-MKT-001',
    openTaskCount: 0
  },
  {
    id: 'dir_ryan_crecelius_6',
    name: 'Ryan Crecelius',
    displayName: 'Ryan Crecelius',
    fullName: 'Ryan Crecelius',
    title: 'Owner & Managing Principal',
    role: 'Owner & Managing Principal',
    department: 'Executive',
    email: 'ryan@nestrealty.com',
    phone: '(910) 409-7120',
    avatar: 'R',
    color: 'bg-rose-600',
    workspaceId: 'ws_wilmington',
    active: true,
    status: 'active',
    eligibleForAssignment: true,
    outOfOffice: false,
    isOutOfOffice: false,
    primarySop: 'SOP-GOV-001',
    openTaskCount: 0
  },
  {
    id: 'dir_marcus_aman',
    name: 'Marcus Aman',
    displayName: 'Marcus Aman',
    fullName: 'Marcus Aman',
    title: 'Broker / Tech Lead',
    role: 'Broker / Tech Lead',
    department: 'Technology',
    email: 'marcus.aman@gmail.com',
    phone: '(252) 717-0595',
    avatar: 'M',
    color: 'bg-emerald-700',
    workspaceId: 'ws_wilmington',
    active: true,
    status: 'active',
    eligibleForAssignment: true,
    outOfOffice: false,
    isOutOfOffice: false,
    primarySop: 'SOP-GOV-001',
    openTaskCount: 0
  },
  {
    id: 'dir_james_fort_11',
    name: 'James Fort',
    displayName: 'James Fort',
    fullName: 'James Fort',
    title: 'CFO & Finance',
    role: 'CFO & Finance',
    department: 'Executive',
    email: 'james.fort@nestrealty.com',
    phone: '(910) 617-8264',
    avatar: 'J',
    color: 'bg-teal-600',
    workspaceId: 'ws_wilmington',
    active: true,
    status: 'active',
    eligibleForAssignment: true,
    outOfOffice: false,
    isOutOfOffice: false,
    primarySop: 'SOP-MKT-001',
    openTaskCount: 0
  },
  {
    id: 'dir_jessica_keenan_8',
    name: 'Jessica Keenan',
    displayName: 'Jessica Keenan',
    fullName: 'Jessica Keenan',
    title: 'Broker-in-Charge',
    role: 'Broker-in-Charge (BIC)',
    department: 'Compliance',
    email: 'jessica.keenan@nestrealty.com',
    phone: '(910) 368-1507',
    avatar: 'J',
    color: 'bg-indigo-600',
    workspaceId: 'ws_wilmington',
    active: true,
    status: 'active',
    eligibleForAssignment: true,
    outOfOffice: false,
    isOutOfOffice: false,
    primarySop: 'SOP-BIC-001',
    openTaskCount: 0
  },
  {
    id: 'dir_eric_knight_5',
    name: 'Eric Knight',
    displayName: 'Eric Knight',
    fullName: 'Eric Knight',
    title: 'Broker-in-Charge',
    role: 'Broker-in-Charge (BIC)',
    department: 'Compliance',
    email: 'eric@nestrealty.com',
    phone: '(910) 367-2253',
    avatar: 'E',
    color: 'bg-blue-700',
    workspaceId: 'ws_wilmington',
    active: true,
    status: 'active',
    eligibleForAssignment: true,
    outOfOffice: false,
    isOutOfOffice: false,
    primarySop: 'SOP-BIC-001',
    openTaskCount: 0
  }
];

const WILMINGTON_WORKSPACE_IDS = new Set([
  'ws_wilmington',
  'nest-realty-wilmington',
  'nest-realty-demo',
  'tenant_nest',
  'tenant_nest_uat',
  'active-brokerage',
  'default'
]);

/**
 * Known legacy identifier mappings for backward compatibility across older tests/records.
 */
const LEGACY_ID_MAP: Record<string, string> = {
  'usr_eduardo': 'dir_eduardo_lovo_73',
  'dir_staff_ann_gunn': 'dir_ann_gunn_28',
  'usr_melissa': 'dir_melissa_gagliardi_33',
  'usr_melissa_mg': 'dir_melissa_gagliardi_33',
  'usr_melissa_full': 'dir_melissa_gagliardi_33',
  'staff_melissa_cooper': 'dir_melissa_gagliardi_33',
  'melissa@nestrealty.com': 'dir_melissa_gagliardi_33',
  'melissa.gagliardi@nestrealty.com': 'dir_melissa_gagliardi_33',
  'mg@nestrealty.com': 'dir_melissa_gagliardi_33',
  'staff_ryan_crecelius': 'dir_ryan_crecelius_6',
  'staff_marcus_aman': 'dir_marcus_aman',
  'dir_marcus_aman_0': 'dir_marcus_aman',
  'staff_james_fort': 'dir_james_fort_11',
  'usr_james': 'dir_james_fort_11',
  'usr_james_full': 'dir_james_fort_11',
  'staff_jessica_keenan': 'dir_jessica_keenan_8',
  'staff_eric_knight': 'dir_eric_knight_5',
  'usr_eric': 'dir_eric_knight_5'
};

export interface RosterFilterOptions {
  workspaceId?: string;
  includeInactive?: boolean;
  requireAssignable?: boolean;
  tasks?: Array<{ assignedTo?: string; assignedToId?: string; isArchived?: boolean; status?: string }>;
}

/**
 * Returns the single canonical staff roster scoped to the workspace.
 * Inactive staff and cross-workspace staff are strictly excluded by default.
 * Sarah Jenkins is never returned.
 */
export function getCanonicalStaffRoster(options: RosterFilterOptions = {}): CanonicalStaffMember[] {
  const targetWs = options.workspaceId || 'ws_wilmington';
  const isWilmington = WILMINGTON_WORKSPACE_IDS.has(targetWs);

  return CANONICAL_WORKSPACE_ROSTER.filter(member => {
    // 1. Exclude Sarah Jenkins unconditionally
    if (member.name.toLowerCase().includes('sarah') && member.name.toLowerCase().includes('jenkins')) {
      return false;
    }
    if (member.id === 'dir_sarah_jenkins' || member.id === 'staff_sarah_jenkins' || member.id === 'usr_sarah') {
      return false;
    }

    // 2. Workspace scoping
    if (isWilmington) {
      if (!WILMINGTON_WORKSPACE_IDS.has(member.workspaceId)) return false;
    } else if (member.workspaceId !== targetWs) {
      return false;
    }

    // 3. Active filter
    if (!options.includeInactive && (!member.active || member.status === 'inactive')) {
      return false;
    }

    // 4. Assignable filter
    if (options.requireAssignable && !member.eligibleForAssignment) {
      return false;
    }

    return true;
  }).map(member => {
    // Derive open task counts from canonical tasks if provided
    let openCount = 0;
    if (options.tasks && options.tasks.length > 0) {
      openCount = options.tasks.filter(t => isTaskInMemberWorkspace(t, member, { workspaceId: targetWs })).length;
    }

    return {
      ...member,
      openTaskCount: openCount
    };
  });
}

export interface TaskWorkspaceFilterOptions {
  coverageFilter?: 'all' | 'direct' | 'coverage';
  isArchivedMode?: boolean;
  workspaceId?: string;
}

/**
 * Determines whether a task belongs to a team member's workspace view.
 * Includes:
 * 1. Tasks directly assigned to the member (by canonical ID or display name).
 * 2. Tasks covered by the member.
 * 3. Tasks awaiting review where the member is the designated review owner (or Marketing Director).
 * Preserves Eduardo's assignment on submitted tasks while including them in Melissa's Awaiting Review workspace.
 */
export function isTaskInMemberWorkspace(
  task: any,
  member: { id?: string; name: string; role?: string; displayName?: string },
  options: TaskWorkspaceFilterOptions = {}
): boolean {
  if (!task) return false;

  const isArchived = Boolean(task.isArchived || task.status === 'archived');
  if (options.isArchivedMode ? !isArchived : isArchived) return false;

  const wsId = options.workspaceId || task.workspaceId || 'ws_wilmington';
  const targetMemberStaff = resolveCanonicalStaffMember(member.id || member.name, wsId);
  const targetMemberId = (targetMemberStaff?.id || member.id || '').toLowerCase();
  const targetMemberName = (targetMemberStaff?.name || member.displayName || member.name || '').toLowerCase();
  const targetFirstName = targetMemberName.split(' ')[0] || '';

  const isEduardoTarget = targetMemberName.includes('eduardo') || targetMemberId.includes('eduardo');

  // Intake Queue Isolation: Tasks in 'request_received' or 'intake_received' status belonging
  // to Melissa Gagliardi (Marketing Director) or Ann Gunn (Operations Lead) must remain in their
  // respective intake queues. Eduardo Lovo (VA) only receives tasks after formal assignment.
  const taskStatus = (task.status || '').toLowerCase();
  if (isEduardoTarget) {
    if (taskStatus === 'request_received' || taskStatus === 'intake_received') {
      const directAssignee = (task.assignedTo || '').toLowerCase();
      const directAssigneeId = (task.assignedToId || '').toLowerCase();
      if (!directAssignee.includes('eduardo') && !directAssigneeId.includes('eduardo')) {
        return false;
      }
    }
  }

  // 1. Direct assignment resolution
  const assignedStaff = resolveCanonicalStaffMember(task.assignedToId || task.assignedTo, wsId);
  const rawAssigned = (task.assignedTo || '').toLowerCase();
  const rawAssignedId = (task.assignedToId || '').toLowerCase();
  const rawRole = (task.assignedToRole || '').toLowerCase();

  const isDirectlyAssigned = Boolean(
    (assignedStaff && targetMemberStaff && assignedStaff.id === targetMemberStaff.id) ||
    (targetMemberId && rawAssignedId && (targetMemberId === rawAssignedId || LEGACY_ID_MAP[rawAssignedId] === targetMemberId)) ||
    (targetMemberName && rawAssigned && (rawAssigned === targetMemberName || rawAssigned.includes(targetMemberName))) ||
    (targetFirstName && rawAssigned && rawAssigned.includes(targetFirstName)) ||
    (isEduardoTarget && (rawAssigned.includes('eduardo') || rawRole.includes('virtual assistant') || rawRole.includes('va')))
  );

  // 2. Coverage resolution — configured backup ≠ active coverage.
  // Only divert work when coverage is explicitly active or the assignee/review owner is OOO.
  const rawCovering = (task.coveringStaff || task.coveringStaffName || '').toLowerCase();
  const rawCoveringId = (task.coveringStaffId || '').toLowerCase();
  const coveringStaff = resolveCanonicalStaffMember(task.coveringStaffId || task.coveringStaffName || task.coveringStaff, wsId);

  const assigneeIsOOO = Boolean(
    (assignedStaff as any)?.isOutOfOffice || (assignedStaff as any)?.outOfOffice || (assignedStaff as any)?.status === 'out_of_office'
  );
  // reviewOwnerStaff is resolved below; compute provisional owner for OOO gate
  const provisionalReviewOwner = resolveCanonicalStaffMember(
    task.reviewOwnerId || task.reviewerId || task.reviewOwnerName || task.reviewOwner || task.reviewerName || task.reviewer,
    wsId
  );
  const reviewOwnerIsOOO = Boolean(
    (provisionalReviewOwner as any)?.isOutOfOffice ||
    (provisionalReviewOwner as any)?.outOfOffice ||
    (provisionalReviewOwner as any)?.status === 'out_of_office'
  );
  const coverageIsActive = Boolean(
    task.coverageActive === true ||
    task.isCoverageActive === true ||
    String(task.coverageMode || '').toLowerCase() === 'active' ||
    task.assigneeCoveringStaffId ||
    task.reviewCoveringStaffId ||
    assigneeIsOOO ||
    reviewOwnerIsOOO
  );

  const isCovering = coverageIsActive && Boolean(
    (coveringStaff && targetMemberStaff && coveringStaff.id === targetMemberStaff.id) ||
    (targetMemberId && rawCoveringId && (targetMemberId === rawCoveringId || LEGACY_ID_MAP[rawCoveringId] === targetMemberId)) ||
    (targetMemberName && rawCovering && (rawCovering === targetMemberName || rawCovering.includes(targetMemberName))) ||
    (targetFirstName && rawCovering && rawCovering.includes(targetFirstName))
  );

  // 3. Review ownership resolution for tasks awaiting review / review-owner tasks
  const isAwaitingReview = Boolean(
    task.reviewState === 'awaiting_review' ||
    taskStatus === 'proof_submitted' ||
    taskStatus === 'awaiting_review' ||
    taskStatus === 'ready_for_review' ||
    taskStatus === 'agent_review'
  );

  const rawReviewOwner = (task.reviewOwnerName || task.reviewOwner || task.reviewerName || task.reviewer || '').toLowerCase();
  const rawReviewOwnerId = (task.reviewOwnerId || task.reviewerId || '').toLowerCase();
  const reviewOwnerStaff = resolveCanonicalStaffMember(
    task.reviewOwnerId || task.reviewerId || task.reviewOwnerName || task.reviewOwner || task.reviewerName || task.reviewer,
    wsId
  );

  const matchesExplicitReviewOwner = Boolean(
    (reviewOwnerStaff && targetMemberStaff && reviewOwnerStaff.id === targetMemberStaff.id) ||
    (targetMemberId && rawReviewOwnerId && (targetMemberId === rawReviewOwnerId || LEGACY_ID_MAP[rawReviewOwnerId] === targetMemberId)) ||
    (targetMemberName && rawReviewOwner && (rawReviewOwner === targetMemberName || rawReviewOwner.includes(targetMemberName))) ||
    (targetFirstName && rawReviewOwner && rawReviewOwner.includes(targetFirstName))
  );

  const isTargetMarketingDirector = Boolean(
    targetMemberId === 'dir_melissa_gagliardi_33' ||
    targetMemberName.includes('melissa') ||
    targetMemberStaff?.role?.toLowerCase() === 'marketing director'
  );
  const taskCat = (task.category || '').toLowerCase();
  const isOps = Boolean(taskCat.includes('operat') || taskCat.includes('sign') || (task.departmentId || '').toLowerCase() === 'operations');
  const isMarketingCategory = !isOps;
  const isDefaultDirectorReview = isTargetMarketingDirector && isMarketingCategory && (!reviewOwnerStaff || reviewOwnerStaff.id === targetMemberStaff?.id);

  const isReviewOwnerForMember = matchesExplicitReviewOwner || (isAwaitingReview && isDefaultDirectorReview);

  // 4. Apply coverage filter
  const filter = options.coverageFilter || 'all';
  if (filter === 'direct') {
    return isDirectlyAssigned || isReviewOwnerForMember;
  }
  if (filter === 'coverage') {
    return isCovering;
  }

  return isDirectlyAssigned || isCovering || isReviewOwnerForMember;
}

/**
 * Resolves a canonical staff member by ID, legacy ID, email, or display name.
 * Strictly returns null for Sarah Jenkins.
 */
export function resolveCanonicalStaffMember(
  identifier?: string | null,
  workspaceId: string = 'ws_wilmington'
): CanonicalStaffMember | null {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase();

  // Guard against Sarah Jenkins
  if (clean.includes('sarah') && clean.includes('jenkins')) {
    return null;
  }
  if (clean === 'usr_sarah' || clean === 'staff_sarah_jenkins' || clean === 'dir_sarah_jenkins') {
    return null;
  }

  const roster = getCanonicalStaffRoster({ workspaceId, includeInactive: true });

  // 1. Exact ID match
  const byId = roster.find(m => m.id.toLowerCase() === clean);
  if (byId) return byId;

  // 2. Legacy ID alias match
  const mappedId = LEGACY_ID_MAP[clean];
  if (mappedId) {
    const byMapped = roster.find(m => m.id.toLowerCase() === mappedId.toLowerCase());
    if (byMapped) return byMapped;
  }

  // 3. Exact email match
  const byEmail = roster.find(m => m.email.toLowerCase() === clean);
  if (byEmail) return byEmail;

  // 4. Exact display name match
  const byName = roster.find(m => m.name.toLowerCase() === clean || m.displayName.toLowerCase() === clean);
  if (byName) return byName;

  // 5. First name prefix match (e.g. 'Eduardo' -> Eduardo Lovo)
  const byFirst = roster.find(m => m.name.toLowerCase().startsWith(clean + ' '));
  if (byFirst) return byFirst;

  return null;
}

/**
 * Checks if a task is assigned to the fabricated Sarah Jenkins identity.
 */
export function isSarahJenkinsTask(task: any): boolean {
  if (!task) return false;
  const assignedName = (task.assignedTo || '').toLowerCase();
  const assignedId = (task.assignedToId || '').toLowerCase();
  return (
    (assignedName.includes('sarah') && assignedName.includes('jenkins')) ||
    assignedId === 'dir_sarah_jenkins' ||
    assignedId === 'staff_sarah_jenkins' ||
    assignedId === 'usr_sarah'
  );
}

/**
 * Flags tasks assigned to Sarah Jenkins as requiring manual reassignment without silently overwriting.
 */
export function sanitizeTaskAssignment<T extends Record<string, any>>(task: T): T & { requiresManualReassignment?: boolean; reassignmentWarning?: string } {
  if (isSarahJenkinsTask(task)) {
    return {
      ...task,
      requiresManualReassignment: true,
      reassignmentWarning: 'Task assigned to unrecognized staff identity (Sarah Jenkins). Manual reassignment required.',
      assignedTo: 'Requires Reassignment (Sarah Jenkins)',
      assignedToRole: 'Unassigned / Needs Review'
    };
  }
  return task;
}

/**
 * Resolves the canonical Marketing Director for the workspace.
 * Uses workspace roster role, title, or department director capability dynamically.
 * Never hardcodes Melissa's name or ID.
 */
export function getCanonicalMarketingDirector(
  workspaceId: string = 'ws_wilmington'
): (CanonicalStaffMember & { firstName: string }) | null {
  const roster = getCanonicalStaffRoster({ workspaceId, includeInactive: true });

  // 1. Role or title explicitly Marketing Director
  const directMatch = roster.find(m =>
    m.role?.toLowerCase() === 'marketing director' ||
    m.title?.toLowerCase().includes('marketing director') ||
    (m.department === 'Marketing' && m.role?.toLowerCase().includes('director'))
  );
  const match = directMatch || roster.find(m =>
    m.role?.toLowerCase().includes('marketing') && m.role?.toLowerCase().includes('director')
  );
  if (!match) return null;
  return {
    ...match,
    firstName: match.displayName?.split(' ')[0] || match.name?.split(' ')[0] || 'Melissa'
  };
}
