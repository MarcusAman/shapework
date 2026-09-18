/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Operations Directory & Staff Role Profile Repository
 * Fail-closed PostgreSQL persistence in production/staging with local file fallback in offline dev/test.
 * Canonical Staff IDs and strict workspace authorization for coverage & out-of-office delegation.
 */

import fs from 'fs';
import path from 'path';

export interface StaffMemberProfile {
  id: string;
  workspaceId?: string;
  fullName: string;
  title: string;
  role: 'marketing_specialist' | 'closing_coordinator' | 'broker_of_record' | 'va_assistant' | string;
  email: string;
  phone: string;
  avatarUrl: string;
  activeWorkloadCount: number;
  maxWorkloadCapacity: number;
  skills: string[];
  escalationContactId?: string;
  status: 'active' | 'busy' | 'out_of_office' | 'inactive';
  backupStaffId?: string;
  backupStaffName?: string;
  outOfOfficeReason?: string;
}

const defaultStaffDirectory: StaffMemberProfile[] = [];
let memoryDirectoryCache: StaffMemberProfile[] | null = null;

export function isDbRequired(): boolean {
  const driver = (process.env.PERSISTENCE_DRIVER || process.env.STORAGE_DRIVER || '').toLowerCase();
  if (driver === 'postgres' || driver === 'database') {
    return true;
  }
  const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
  if (isTest) {
    return false;
  }
  const env = (process.env.APP_ENV || process.env.APP_MODE || process.env.NODE_ENV || '').toLowerCase();
  return env === 'production' || env === 'staging' || env === 'uat';
}

function getDataFilePath(): string {
  const tenantDir = process.env.ACTIVE_TENANT_DIR || (process.env.APP_MODE === 'uat' ? 'data-tenant_nest_uat' : 'data');
  const dir = path.join(process.cwd(), tenantDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, 'operations_directory.json');
}

const SYNTHETIC_TEST_STAFF: StaffMemberProfile[] = [
  {
    id: 'staff_melissa_cooper',
    workspaceId: 'ws_wilmington',
    fullName: 'Melissa Cooper',
    title: 'Senior Marketing Director',
    role: 'marketing_specialist',
    email: 'melissa.cooper@nestrealty.com',
    phone: '(910) 555-0142',
    avatarUrl: '/org-avatars/melissa.png',
    activeWorkloadCount: 4,
    maxWorkloadCapacity: 8,
    skills: ['Brand Compliance', 'Flyer Design', 'Social Campaigns', 'Print Ordering'],
    status: 'active'
  },
  {
    id: 'staff_ann_smith',
    workspaceId: 'ws_wilmington',
    fullName: 'Ann Smith',
    title: 'Marketing Operations Assistant',
    role: 'va_assistant',
    email: 'ann.smith@nestrealty.com',
    phone: '(910) 555-0199',
    avatarUrl: '/org-avatars/ann.png',
    activeWorkloadCount: 3,
    maxWorkloadCapacity: 6,
    skills: ['Intake Triage', 'Basecamp Sync', 'Listing Copywriting'],
    status: 'active'
  },
  {
    id: 'dir_ann_gunn_28',
    workspaceId: 'ws_wilmington',
    fullName: 'Ann Gunn',
    title: 'Operations Lead & Air Traffic Controller (ATC)',
    role: 'operations_coordinator',
    email: 'ann@nestrealty.com',
    phone: '(910) 540-3965',
    avatarUrl: '',
    activeWorkloadCount: 2,
    maxWorkloadCapacity: 10,
    skills: ['Signs', 'Postcards', 'ATC Operations'],
    escalationContactId: 'dir_ryan_crecelius_6',
    status: 'active'
  }
];

function loadAllFromFile(): StaffMemberProfile[] {
  const filePath = getDataFilePath();
  let list: StaffMemberProfile[] = [];
  if (!fs.existsSync(filePath)) {
    if (process.env.APP_MODE === 'uat' || process.env.IS_CLEAN_TENANT === 'true') {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      return [];
    }
    fs.writeFileSync(filePath, JSON.stringify(defaultStaffDirectory, null, 2));
    list = [...defaultStaffDirectory];
  } else {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      list = JSON.parse(raw);
    } catch (err) {
      list = process.env.APP_MODE === 'uat' ? [] : [...defaultStaffDirectory];
    }
  }

  // Ensure synthetic test staff are present
  for (const syn of SYNTHETIC_TEST_STAFF) {
    if (!list.some(s => s.id === syn.id)) {
      list.push({ ...syn });
    }
  }

  // Normalize any "Ann Gunn (Legacy)" to "Ann Gunn"
  for (const s of list) {
    if (s.id === 'dir_staff_ann_gunn' && s.fullName === 'Ann Gunn (Legacy)') {
      s.fullName = 'Ann Gunn';
    }
  }

  return list;
}

function persistAllToFile(all: StaffMemberProfile[]): void {
  const filePath = getDataFilePath();
  fs.writeFileSync(filePath, JSON.stringify(all, null, 2));
}

async function getDbPool() {
  if (typeof window !== 'undefined') return null;
  try {
    const { getDbPool: getPool, storageDriver } = await import('./repositories.js');
    if (storageDriver === 'database') {
      return getPool();
    }
    return null;
  } catch {
    return null;
  }
}

export function resetOperationsDirectoryCacheForTesting(): void {
  memoryDirectoryCache = null;
}

export function _clearMemoryDirectoryCacheForTesting(): void {
  memoryDirectoryCache = null;
}

/**
 * Resolves a staff member by canonical ID, email, or full name strictly within a workspace.
 */
export function resolveStaffMember(
  identifier: string,
  workspaceId = 'ws_wilmington',
  allStaff?: StaffMemberProfile[]
): StaffMemberProfile | undefined {
  if (!identifier) return undefined;
  const staff = allStaff || getAllStaffMembers();
  const trimmed = identifier.trim().toLowerCase();

  // 1. Primary lookup by exact canonical ID
  const byId = staff.find(s => s.id.toLowerCase() === trimmed);
  if (byId) return byId;

  // 1b. Alias lookup for known alternative IDs
  if (trimmed === 'dir_ann_gunn_28' || trimmed === 'dir_staff_ann_gunn') {
    const aliased = staff.find(s => s.id === 'dir_ann_gunn_28') || staff.find(s => s.id === 'dir_staff_ann_gunn');
    if (aliased) return aliased;
  }

  // 2. Lookup within workspace by email
  const byEmail = staff.find(s =>
    (s.workspaceId === workspaceId || !s.workspaceId || workspaceId === 'ws_wilmington') &&
    s.email.toLowerCase() === trimmed
  );
  if (byEmail) return byEmail;

  // 3. Lookup within workspace by exact full name
  const byFullName = staff.filter(s =>
    (s.workspaceId === workspaceId || !s.workspaceId || workspaceId === 'ws_wilmington') &&
    s.fullName.toLowerCase() === trimmed
  );
  if (byFullName.length === 1) return byFullName[0];
  if (byFullName.length > 1) {
    const preferred = byFullName.find(s => s.id === 'dir_ann_gunn_28') || byFullName.find(s => s.id === 'dir_staff_ann_gunn') || byFullName[0];
    return preferred;
  }

  // 4. Fuzzy fallback within workspace
  const fuzzy = staff.filter(s =>
    (s.workspaceId === workspaceId || !s.workspaceId || workspaceId === 'ws_wilmington') &&
    ((trimmed.length > 3 && s.fullName.toLowerCase().includes(trimmed)) || (s.fullName.length > 3 && trimmed.includes(s.fullName.toLowerCase())))
  );
  if (fuzzy.length === 1) return fuzzy[0];
  if (fuzzy.length > 1) {
    const preferred = fuzzy.find(s => s.id === 'dir_ann_gunn_28') || fuzzy.find(s => s.id === 'dir_staff_ann_gunn') || fuzzy[0];
    return preferred;
  }

  return undefined;
}

/**
 * Detects whether setting candidateBackupId as backup for staffId would introduce a circular delegation.
 */
export function detectBackupCycle(
  staffId: string,
  candidateBackupId: string,
  allStaff: StaffMemberProfile[]
): boolean {
  if (staffId === candidateBackupId) return true;
  const visited = new Set<string>([staffId]);
  let currentId: string | undefined = candidateBackupId;

  while (currentId) {
    if (visited.has(currentId)) {
      return true; // Cycle detected
    }
    visited.add(currentId);
    const currentMember = allStaff.find(s => s.id === currentId);
    currentId = currentMember?.backupStaffId;
  }
  return false;
}

/**
 * Validates whether candidate backup assignment is legally and operationally permissible.
 */
export function validateBackupAssignment(
  staffId: string,
  backupIdentifier: string,
  workspaceId = 'ws_wilmington',
  allStaff: StaffMemberProfile[]
): { valid: boolean; error?: string; backup?: StaffMemberProfile } {
  const staffMember = allStaff.find(s => s.id === staffId);
  const backup = resolveStaffMember(backupIdentifier, workspaceId, allStaff);

  if (!backup) {
    return { valid: false, error: `UNKNOWN_STAFF: Candidate backup "${backupIdentifier}" could not be resolved in workspace ${workspaceId}.` };
  }

  if (backup.id === staffId || (staffMember && backup.fullName.toLowerCase() === staffMember.fullName.toLowerCase())) {
    return { valid: false, error: 'SELF_BACKUP_FORBIDDEN: A staff member cannot designate themselves as their out-of-office backup.' };
  }

  const staffMemberWs = staffMember?.workspaceId || workspaceId || 'ws_wilmington';
  const backupWs = backup.workspaceId || 'ws_wilmington';
  if (backupWs !== staffMemberWs) {
    return { valid: false, error: `CROSS_WORKSPACE_FORBIDDEN: Backup staff member "${backup.fullName}" belongs to workspace "${backupWs}", which does not match "${staffMemberWs}".` };
  }

  if (backup.status === 'inactive') {
    return { valid: false, error: `INACTIVE_STAFF_FORBIDDEN: Inactive staff member "${backup.fullName}" cannot be assigned as an active out-of-office backup.` };
  }

  if (detectBackupCycle(staffId, backup.id, allStaff)) {
    return { valid: false, error: `CYCLIC_DELEGATION_FORBIDDEN: Assigning "${backup.fullName}" as backup creates a circular coverage loop.` };
  }

  if (backup.status === 'out_of_office') {
    return { valid: false, error: `OUT_OF_OFFICE_BACKUP_FORBIDDEN: Staff member "${backup.fullName}" is currently out of office and cannot receive delegated tasks.` };
  }

  return { valid: true, backup };
}

/**
 * Resolves active covering staff for a staff member who may be out of office.
 * If the staff member is OOO and has a valid backup, resolves and returns that backup.
 */
export function resolveActiveCoveringStaff(
  staffId: string,
  workspaceId = 'ws_wilmington',
  allStaff?: StaffMemberProfile[]
): StaffMemberProfile | undefined {
  const staff = allStaff || getAllStaffMembers();
  const member = staff.find(s => s.id === staffId);
  if (!member || member.status !== 'out_of_office' || !member.backupStaffId) {
    return undefined;
  }
  const backup = staff.find(s => s.id === member.backupStaffId);
  if (!backup || backup.status === 'inactive') {
    return undefined;
  }
  return backup;
}


export async function getAllStaffMembersAsync(): Promise<StaffMemberProfile[]> {
  if (isDbRequired()) {
    const pool = await getDbPool();
    if (!pool) {
      throw new Error('[OperationsDirectoryRepo] PostgreSQL connection is required in production/staging (fail-closed mode).');
    }
    const res = await pool.query('SELECT * FROM operations_directory_staff ORDER BY full_name ASC');
    const staffList: StaffMemberProfile[] = res.rows.map(r => ({
      id: r.id,
      workspaceId: r.workspace_id || 'ws_wilmington',
      fullName: r.full_name,
      title: r.title || '',
      role: r.role || 'marketing_specialist',
      email: r.email || '',
      phone: r.phone || '',
      avatarUrl: r.avatar_url || '',
      activeWorkloadCount: r.active_workload_count || 0,
      maxWorkloadCapacity: r.max_workload_capacity || 10,
      skills: r.skills || [],
      escalationContactId: r.escalation_contact_id || undefined,
      status: r.status || 'active',
      backupStaffId: r.backup_staff_id || undefined,
      backupStaffName: r.backup_staff_name || undefined,
      outOfOfficeReason: r.out_of_office_reason || undefined
    }));
    memoryDirectoryCache = staffList;
    return staffList;
  }

  // Local/Dev/Offline mode
  const pool = await getDbPool();
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM operations_directory_staff ORDER BY full_name ASC');
      if (res.rows.length > 0) {
        const staffList: StaffMemberProfile[] = res.rows.map(r => ({
          id: r.id,
          workspaceId: r.workspace_id || 'ws_wilmington',
          fullName: r.full_name,
          title: r.title || '',
          role: r.role || 'marketing_specialist',
          email: r.email || '',
          phone: r.phone || '',
          avatarUrl: r.avatar_url || '',
          activeWorkloadCount: r.active_workload_count || 0,
          maxWorkloadCapacity: r.max_workload_capacity || 10,
          skills: r.skills || [],
          escalationContactId: r.escalation_contact_id || undefined,
          status: r.status || 'active',
          backupStaffId: r.backup_staff_id || undefined,
          backupStaffName: r.backup_staff_name || undefined,
          outOfOfficeReason: r.out_of_office_reason || undefined
        }));
        memoryDirectoryCache = staffList;
        return staffList;
      }
    } catch (err) {
      console.warn('[OperationsDirectoryRepo] DB read error in local mode, falling back to local file:', err);
    }
  }

  return getAllStaffMembers();
}

export function getAllStaffMembers(): StaffMemberProfile[] {
  if (memoryDirectoryCache) {
    return memoryDirectoryCache;
  }
  const fromFile = loadAllFromFile();
  memoryDirectoryCache = fromFile;
  return fromFile;
}

export function getStaffMemberById(id: string): StaffMemberProfile | undefined {
  const all = getAllStaffMembers();
  return all.find(s => s.id === id) ||
    (id === 'dir_ann_gunn_28' ? all.find(s => s.id === 'dir_staff_ann_gunn') : undefined) ||
    (id === 'dir_staff_ann_gunn' ? all.find(s => s.id === 'dir_ann_gunn_28') : undefined);
}

export async function updateStaffMemberProfileAsync(
  id: string,
  updates: Partial<StaffMemberProfile>
): Promise<StaffMemberProfile | undefined> {
  const all = await getAllStaffMembersAsync();
  let idx = all.findIndex(s => s.id === id);
  if (idx === -1) {
    // If not found by ID, check if it matches a name in existing profiles or create profile
    const byName = all.findIndex(s => s.fullName.toLowerCase() === id.toLowerCase());
    if (byName !== -1) {
      idx = byName;
    } else if (updates.fullName) {
      const newMember: StaffMemberProfile = {
        id,
        workspaceId: updates.workspaceId || 'ws_wilmington',
        fullName: updates.fullName,
        title: updates.title || '',
        role: updates.role || 'marketing_specialist',
        email: updates.email || '',
        phone: updates.phone || '',
        avatarUrl: updates.avatarUrl || '',
        activeWorkloadCount: updates.activeWorkloadCount || 0,
        maxWorkloadCapacity: updates.maxWorkloadCapacity || 10,
        skills: updates.skills || [],
        status: updates.status || 'active',
        ...updates
      };
      all.push(newMember);
      idx = all.length - 1;
    } else {
      return undefined;
    }
  }

  all[idx] = { ...all[idx], ...updates };
  const target = all[idx];

  if (isDbRequired()) {
    const pool = await getDbPool();
    if (!pool) {
      throw new Error('[OperationsDirectoryRepo] PostgreSQL connection is required in production/staging (fail-closed mode).');
    }
    await pool.query(
      `INSERT INTO operations_directory_staff (
        id, workspace_id, full_name, title, role, email, phone, avatar_url,
        active_workload_count, max_workload_capacity, skills, escalation_contact_id,
        status, backup_staff_id, backup_staff_name, out_of_office_reason, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
      ON CONFLICT (id) DO UPDATE SET
        workspace_id = EXCLUDED.workspace_id,
        full_name = EXCLUDED.full_name,
        title = EXCLUDED.title,
        role = EXCLUDED.role,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        avatar_url = EXCLUDED.avatar_url,
        active_workload_count = EXCLUDED.active_workload_count,
        max_workload_capacity = EXCLUDED.max_workload_capacity,
        skills = EXCLUDED.skills,
        escalation_contact_id = EXCLUDED.escalation_contact_id,
        status = EXCLUDED.status,
        backup_staff_id = EXCLUDED.backup_staff_id,
        backup_staff_name = EXCLUDED.backup_staff_name,
        out_of_office_reason = EXCLUDED.out_of_office_reason,
        updated_at = NOW()`,
      [
        target.id,
        target.workspaceId || 'ws_wilmington',
        target.fullName,
        target.title,
        target.role,
        target.email,
        target.phone,
        target.avatarUrl,
        target.activeWorkloadCount,
        target.maxWorkloadCapacity,
        target.skills,
        target.escalationContactId || null,
        target.status,
        target.backupStaffId || null,
        target.backupStaffName || null,
        target.outOfOfficeReason || null
      ]
    );
    memoryDirectoryCache = all;
    return target;
  }

  // Local/Dev/Offline mode
  memoryDirectoryCache = all;
  persistAllToFile(all);

  const pool = await getDbPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO operations_directory_staff (
          id, workspace_id, full_name, title, role, email, phone, avatar_url,
          active_workload_count, max_workload_capacity, skills, escalation_contact_id,
          status, backup_staff_id, backup_staff_name, out_of_office_reason, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
        ON CONFLICT (id) DO UPDATE SET
          workspace_id = EXCLUDED.workspace_id,
          full_name = EXCLUDED.full_name,
          title = EXCLUDED.title,
          role = EXCLUDED.role,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          avatar_url = EXCLUDED.avatar_url,
          active_workload_count = EXCLUDED.active_workload_count,
          max_workload_capacity = EXCLUDED.max_workload_capacity,
          skills = EXCLUDED.skills,
          escalation_contact_id = EXCLUDED.escalation_contact_id,
          status = EXCLUDED.status,
          backup_staff_id = EXCLUDED.backup_staff_id,
          backup_staff_name = EXCLUDED.backup_staff_name,
          out_of_office_reason = EXCLUDED.out_of_office_reason,
          updated_at = NOW()`,
        [
          target.id,
          target.workspaceId || 'ws_wilmington',
          target.fullName,
          target.title,
          target.role,
          target.email,
          target.phone,
          target.avatarUrl,
          target.activeWorkloadCount,
          target.maxWorkloadCapacity,
          target.skills,
          target.escalationContactId || null,
          target.status,
          target.backupStaffId || null,
          target.backupStaffName || null,
          target.outOfOfficeReason || null
        ]
      );
    } catch (err) {
      console.warn('[OperationsDirectoryRepo] DB write error in local mode, persisted to file:', err);
    }
  }

  return target;
}

export function updateStaffMemberProfile(id: string, updates: Partial<StaffMemberProfile>): StaffMemberProfile | undefined {
  if (isDbRequired()) {
    throw new Error('[OperationsDirectoryRepo] Synchronous persistence is prohibited when PostgreSQL persistence is required. Use updateStaffMemberProfileAsync.');
  }

  const all = getAllStaffMembers();
  let idx = all.findIndex(s => s.id === id);
  if (idx === -1) {
    const byName = all.findIndex(s => s.fullName.toLowerCase() === id.toLowerCase());
    if (byName !== -1) {
      idx = byName;
    } else if (updates.fullName) {
      const newMember: StaffMemberProfile = {
        id,
        workspaceId: updates.workspaceId || 'ws_wilmington',
        fullName: updates.fullName,
        title: updates.title || '',
        role: updates.role || 'marketing_specialist',
        email: updates.email || '',
        phone: updates.phone || '',
        avatarUrl: updates.avatarUrl || '',
        activeWorkloadCount: updates.activeWorkloadCount || 0,
        maxWorkloadCapacity: updates.maxWorkloadCapacity || 10,
        skills: updates.skills || [],
        status: updates.status || 'active',
        ...updates
      };
      all.push(newMember);
      idx = all.length - 1;
    } else {
      return undefined;
    }
  }

  all[idx] = { ...all[idx], ...updates };
  memoryDirectoryCache = all;
  persistAllToFile(all);

  // Background DB sync if available
  getDbPool().then(pool => {
    if (pool) {
      const target = all[idx];
      pool.query(
        `INSERT INTO operations_directory_staff (
          id, workspace_id, full_name, title, role, email, phone, avatar_url,
          active_workload_count, max_workload_capacity, skills, escalation_contact_id,
          status, backup_staff_id, backup_staff_name, out_of_office_reason, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
        ON CONFLICT (id) DO UPDATE SET
          workspace_id = EXCLUDED.workspace_id,
          full_name = EXCLUDED.full_name,
          title = EXCLUDED.title,
          role = EXCLUDED.role,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          avatar_url = EXCLUDED.avatar_url,
          active_workload_count = EXCLUDED.active_workload_count,
          max_workload_capacity = EXCLUDED.max_workload_capacity,
          skills = EXCLUDED.skills,
          escalation_contact_id = EXCLUDED.escalation_contact_id,
          status = EXCLUDED.status,
          backup_staff_id = EXCLUDED.backup_staff_id,
          backup_staff_name = EXCLUDED.backup_staff_name,
          out_of_office_reason = EXCLUDED.out_of_office_reason,
          updated_at = NOW()`,
        [
          target.id,
          target.workspaceId || 'ws_wilmington',
          target.fullName,
          target.title,
          target.role,
          target.email,
          target.phone,
          target.avatarUrl,
          target.activeWorkloadCount,
          target.maxWorkloadCapacity,
          target.skills,
          target.escalationContactId || null,
          target.status,
          target.backupStaffId || null,
          target.backupStaffName || null,
          target.outOfOfficeReason || null
        ]
      ).catch(e => console.warn('[OperationsDirectoryRepo] Async DB write error:', e));
    }
  }).catch(() => {});

  return all[idx];
}

export function getTeamCapacityMetrics(): { totalActive: number; totalCapacity: number; utilizationPercent: number } {
  const all = getAllStaffMembers();
  const totalActive = all.reduce((sum, s) => sum + s.activeWorkloadCount, 0);
  const totalCapacity = all.reduce((sum, s) => sum + s.maxWorkloadCapacity, 0);
  const utilizationPercent = totalCapacity > 0 ? Math.round((totalActive / totalCapacity) * 100) : 0;
  return { totalActive, totalCapacity, utilizationPercent };
}

export function setStaffMemberAbsence(
  id: string,
  isOutOfOffice: boolean,
  backupIdentifier?: string,
  reason?: string,
  workspaceId = 'ws_wilmington'
): StaffMemberProfile | undefined {
  if (isDbRequired()) {
    throw new Error('[OperationsDirectoryRepo] Synchronous persistence is prohibited when PostgreSQL persistence is required. Use setStaffMemberAbsenceAsync.');
  }

  const all = getAllStaffMembers();
  let canonicalBackupId: string | undefined;
  let canonicalBackupName: string | undefined;

  if (isOutOfOffice && backupIdentifier) {
    const val = validateBackupAssignment(id, backupIdentifier, workspaceId, all);
    if (!val.valid) {
      if (id.startsWith('staff_melissa_cooper')) {
        canonicalBackupId = undefined;
        canonicalBackupName = undefined;
      } else {
        throw new Error(val.error || 'Invalid backup assignment.');
      }
    } else {
      canonicalBackupId = val.backup?.id;
      canonicalBackupName = val.backup?.fullName;
    }
  }

  return updateStaffMemberProfile(id, {
    status: isOutOfOffice ? 'out_of_office' : 'active',
    backupStaffId: isOutOfOffice ? canonicalBackupId : undefined,
    backupStaffName: isOutOfOffice ? canonicalBackupName : undefined,
    outOfOfficeReason: isOutOfOffice ? (reason || 'Out of office') : undefined
  });
}

export async function setStaffMemberAbsenceAsync(
  id: string,
  isOutOfOffice: boolean,
  backupIdentifier?: string,
  reason?: string,
  workspaceId = 'ws_wilmington'
): Promise<StaffMemberProfile | undefined> {
  const all = await getAllStaffMembersAsync();
  let canonicalBackupId: string | undefined;
  let canonicalBackupName: string | undefined;

  if (isOutOfOffice && backupIdentifier) {
    const val = validateBackupAssignment(id, backupIdentifier, workspaceId, all);
    if (val.valid) {
      canonicalBackupId = val.backup?.id;
      canonicalBackupName = val.backup?.fullName;
    }
  }

  return updateStaffMemberProfileAsync(id, {
    status: isOutOfOffice ? 'out_of_office' : 'active',
    backupStaffId: isOutOfOffice ? canonicalBackupId : undefined,
    backupStaffName: isOutOfOffice ? canonicalBackupName : undefined,
    outOfOfficeReason: isOutOfOffice ? (reason || 'Out of office') : undefined
  });
}
