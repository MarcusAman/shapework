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
    coveringStaffId: 'dir_ann_gunn_28',
    coveringStaffName: 'Ann Gunn',
    backupStaffId: 'dir_ann_gunn_28',
    backupStaffName: 'Ann Gunn',
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
  'staff_melissa_cooper': 'dir_melissa_gagliardi_33',
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
      const memberFirst = member.name.split(' ')[0].toLowerCase();
      const isEduardo = member.name === 'Eduardo Lovo';
      openCount = options.tasks.filter(t => {
        const isArchived = Boolean(t.isArchived || t.status === 'archived');
        if (isArchived) return false;
        const assigned = (t.assignedTo || '').toLowerCase();
        const assignedId = (t.assignedToId || '').toLowerCase();
        if (assignedId === member.id.toLowerCase() || (LEGACY_ID_MAP[assignedId] === member.id)) return true;
        if (isEduardo) {
          return assigned.includes('eduardo') || assigned === 'va' || assigned.includes('virtual assistant');
        }
        return assigned.includes(memberFirst);
      }).length;
    }

    return {
      ...member,
      openTaskCount: openCount
    };
  });
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
