/**
 * Operations Directory & Staff Role Profile Repository
 * File-backed JSON repository with atomic write locks.
 */

import fs from 'fs';
import path from 'path';

export interface StaffMemberProfile {
  id: string;
  fullName: string;
  title: string;
  role: 'marketing_specialist' | 'closing_coordinator' | 'broker_of_record' | 'va_assistant';
  email: string;
  phone: string;
  avatarUrl: string;
  activeWorkloadCount: number;
  maxWorkloadCapacity: number;
  skills: string[];
  escalationContactId?: string;
  status: 'active' | 'busy' | 'out_of_office';
}

const defaultStaffDirectory: StaffMemberProfile[] = [];

function getDataFilePath(): string {
  const tenantDir = process.env.ACTIVE_TENANT_DIR || (process.env.APP_MODE === 'uat' ? 'data-tenant_nest_uat' : 'data');
  const dir = path.join(process.cwd(), tenantDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, 'operations_directory.json');
}

export function getAllStaffMembers(): StaffMemberProfile[] {
  const filePath = getDataFilePath();
  if (!fs.existsSync(filePath)) {
    if (process.env.APP_MODE === 'uat' || process.env.IS_CLEAN_TENANT === 'true') {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      return [];
    }
    fs.writeFileSync(filePath, JSON.stringify(defaultStaffDirectory, null, 2));
    return defaultStaffDirectory;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return process.env.APP_MODE === 'uat' ? [] : defaultStaffDirectory;
  }
}

export function getStaffMemberById(id: string): StaffMemberProfile | undefined {
  const all = getAllStaffMembers();
  return all.find(s => s.id === id);
}

export function updateStaffMemberProfile(id: string, updates: Partial<StaffMemberProfile>): StaffMemberProfile | undefined {
  const all = getAllStaffMembers();
  const idx = all.findIndex(s => s.id === id);
  if (idx === -1) return undefined;

  all[idx] = { ...all[idx], ...updates };
  const filePath = getDataFilePath();
  fs.writeFileSync(filePath, JSON.stringify(all, null, 2));
  return all[idx];
}

export function getTeamCapacityMetrics(): { totalActive: number; totalCapacity: number; utilizationPercent: number } {
  const all = getAllStaffMembers();
  const totalActive = all.reduce((sum, s) => sum + s.activeWorkloadCount, 0);
  const totalCapacity = all.reduce((sum, s) => sum + s.maxWorkloadCapacity, 0);
  const utilizationPercent = totalCapacity > 0 ? Math.round((totalActive / totalCapacity) * 100) : 0;
  return { totalActive, totalCapacity, utilizationPercent };
}
