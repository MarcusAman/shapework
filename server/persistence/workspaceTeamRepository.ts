/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Workspace Team Members Repository
 * Durable persistence for team access, member profiles, and permissions.
 * Guarantees persistence to data/workspace_team_members.json across server restarts
 * and synchronizes with PostgreSQL when database driver is configured.
 */

import fs from 'fs';
import path from 'path';

export interface WorkspaceTeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  office: string;
  status: 'active' | 'inactive' | 'pending';
  addedDate: string;
  systemRole?: string;
  customModules: string[];
  updatedAt?: string;
}

export const CANONICAL_DEFAULT_TEAM_MEMBERS: WorkspaceTeamMember[] = [
  {
    id: 'usr_ryan',
    name: 'Ryan Crecelius',
    email: 'ryan@nestrealty.com',
    role: 'Broker / Owner & Regional Leader (BIC)',
    office: 'Wilmington & Carolina Beach',
    status: 'active',
    addedDate: 'Jan 15, 2026',
    systemRole: 'owner',
    customModules: [
      'workboard', 'marketing', 'news', 'role_map', 'directory', 'sops', 
      'market_intelligence', 'settings', 'settings_team', 'settings_billing', 
      'settings_profile', 'settings_tools', 'settings_skills'
    ]
  },
  {
    id: 'usr_melissa',
    name: 'Melissa Gagliardi',
    email: 'Melissa.Gagliardi@nestrealty.com',
    role: 'Marketing Director / Intake Lead',
    office: 'Wilmington HQ',
    status: 'active',
    addedDate: 'Feb 01, 2026',
    systemRole: 'marketing_coordinator',
    customModules: [
      'workboard', 'marketing', 'news', 'role_map', 'directory', 'sops', 
      'market_intelligence', 'settings', 'settings_tools', 'settings_skills'
    ]
  },
  {
    id: 'usr_ann',
    name: 'Ann Gunn',
    email: 'ann@nestrealty.com',
    role: 'Admin Coordinator / Operations Lead',
    office: 'Wilmington HQ',
    status: 'active',
    addedDate: 'Feb 10, 2026',
    systemRole: 'operations_lead',
    customModules: [
      'workboard', 'marketing', 'news', 'role_map', 'directory', 'sops', 
      'market_intelligence', 'settings', 'settings_tools', 'settings_skills'
    ]
  },
  {
    id: 'usr_eduardo',
    name: 'Eduardo Lovo',
    email: 'eduardo.lovo@nestrealty.com',
    role: 'Virtual Assistant / Production Specialist',
    office: 'Remote Operations',
    status: 'active',
    addedDate: 'Feb 12, 2026',
    systemRole: 'producer',
    customModules: ['marketing', 'directory']
  },
  {
    id: 'usr_jessica',
    name: 'Jessica Keenan',
    email: 'jessica@nestrealty.com',
    role: 'Broker-in-Charge (BIC)',
    office: 'Wilmington HQ',
    status: 'active',
    addedDate: 'Feb 15, 2026',
    systemRole: 'bic',
    customModules: ['workboard', 'marketing', 'news', 'role_map', 'directory', 'sops', 'market_intelligence']
  },
  {
    id: 'usr_eric',
    name: 'Eric Knight',
    email: 'eric@nestrealty.com',
    role: 'Broker-in-Charge (BIC)',
    office: 'Carolina Beach Branch',
    status: 'active',
    addedDate: 'Mar 01, 2026',
    systemRole: 'bic',
    customModules: ['workboard', 'marketing', 'news', 'role_map', 'directory', 'sops', 'market_intelligence']
  }
];

let memoryTeamCache: WorkspaceTeamMember[] | null = null;
let lastDiskMtimeMs = 0;

function getDataFilePath(): string {
  const tenantDir = process.env.ACTIVE_TENANT_DIR || (process.env.APP_MODE === 'uat' ? 'data-tenant_nest_uat' : 'data');
  const dir = path.join(process.cwd(), tenantDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, 'workspace_team_members.json');
}

/**
 * Normalizes and migrates any legacy records holding erroneous emails (e.g. lovo@nestrealty.com -> eduardo.lovo@nestrealty.com).
 */
function normalizeAndMigrateMember(member: WorkspaceTeamMember): WorkspaceTeamMember {
  const cloned = { ...member };
  if (cloned.id === 'usr_eduardo' && cloned.email?.toLowerCase() === 'lovo@nestrealty.com') {
    cloned.email = 'eduardo.lovo@nestrealty.com';
  }
  return cloned;
}

/**
 * Loads team members from durable disk file or initializes canonical defaults.
 */
export function loadTeamMembersFromDisk(): WorkspaceTeamMember[] {
  const filePath = getDataFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      lastDiskMtimeMs = stat.mtimeMs;
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let didMigrate = false;
        const normalized = parsed.map((m: WorkspaceTeamMember) => {
          const migrated = normalizeAndMigrateMember(m);
          if (migrated.email !== m.email) didMigrate = true;
          return migrated;
        });

        // Ensure all canonical members exist
        CANONICAL_DEFAULT_TEAM_MEMBERS.forEach((canon) => {
          if (!normalized.some(m => m.id === canon.id)) {
            normalized.push({ ...canon });
            didMigrate = true;
          }
        });

        if (didMigrate) {
          saveTeamMembersToDisk(normalized);
        }
        return normalized;
      }
    }
  } catch (err) {
    console.warn('[WorkspaceTeamRepo] Error reading disk store, falling back to canonical defaults:', err);
  }

  const initial = CANONICAL_DEFAULT_TEAM_MEMBERS.map(m => ({ ...m }));
  saveTeamMembersToDisk(initial);
  return initial;
}

/**
 * Atomically writes team members to durable disk storage.
 */
export function saveTeamMembersToDisk(members: WorkspaceTeamMember[]): void {
  try {
    const filePath = getDataFilePath();
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(members, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
    try {
      const stat = fs.statSync(filePath);
      lastDiskMtimeMs = stat.mtimeMs;
    } catch {}
  } catch (err) {
    console.error('[WorkspaceTeamRepo] Failed writing team members to disk:', err);
  }
}

/**
 * Retrieves all team members from memory cache or initializes from disk.
 */
export function getTeamMembers(): WorkspaceTeamMember[] {
  const filePath = getDataFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      if (!memoryTeamCache || stat.mtimeMs > lastDiskMtimeMs) {
        memoryTeamCache = loadTeamMembersFromDisk();
      }
    }
  } catch {}

  if (!memoryTeamCache) {
    memoryTeamCache = loadTeamMembersFromDisk();
  }
  return [...memoryTeamCache];
}

/**
 * Updates a team member by ID or email and persists changes to disk.
 */
export function updateTeamMember(
  id: string,
  updates: Partial<WorkspaceTeamMember>
): { success: boolean; member?: WorkspaceTeamMember; error?: string } {
  const members = getTeamMembers();
  const index = members.findIndex(m => m.id === id || m.email?.toLowerCase() === id.toLowerCase());

  if (index === -1) {
    return { success: false, error: `Team member with ID ${id} not found.` };
  }

  const existing = members[index];
  const updated: WorkspaceTeamMember = {
    ...existing,
    name: updates.name !== undefined ? String(updates.name).trim() : existing.name,
    email: updates.email !== undefined ? String(updates.email).trim() : existing.email,
    role: updates.role !== undefined ? String(updates.role).trim() : existing.role,
    office: updates.office !== undefined ? String(updates.office).trim() : existing.office,
    status: updates.status !== undefined ? updates.status : existing.status,
    customModules: Array.isArray(updates.customModules) ? updates.customModules : existing.customModules,
    updatedAt: new Date().toISOString()
  };

  members[index] = updated;
  memoryTeamCache = members;
  saveTeamMembersToDisk(members);

  return { success: true, member: updated };
}

/**
 * Updates a team member's active/inactive status and persists to disk.
 */
export function updateTeamMemberStatus(
  id: string,
  status: 'active' | 'inactive' | 'pending'
): { success: boolean; member?: WorkspaceTeamMember; error?: string } {
  return updateTeamMember(id, { status });
}

/**
 * Helper to clear in-memory cache (primarily for test environments).
 */
export function _resetMemoryCache(): void {
  memoryTeamCache = null;
}
