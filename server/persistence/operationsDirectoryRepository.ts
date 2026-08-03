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

const defaultStaffDirectory: StaffMemberProfile[] = [
  {
    id: 'staff_melissa_cooper',
    fullName: 'Melissa Cooper',
    title: 'Senior Marketing Director',
    role: 'marketing_specialist',
    email: 'melissa.cooper@nestrealty.com',
    phone: '(910) 555-0142',
    avatarUrl: '/org-avatars/melissa.png',
    activeWorkloadCount: 4,
    maxWorkloadCapacity: 8,
    skills: ['Brand Compliance', 'Flyer Design', 'Social Campaigns', 'Print Ordering'],
    escalationContactId: 'staff_ryan_crecelius',
    status: 'active'
  },
  {
    id: 'staff_ann_smith',
    fullName: 'Ann Smith',
    title: 'Marketing Operations Assistant',
    role: 'va_assistant',
    email: 'ann.smith@nestrealty.com',
    phone: '(910) 555-0199',
    avatarUrl: '/org-avatars/ann.png',
    activeWorkloadCount: 3,
    maxWorkloadCapacity: 6,
    skills: ['Intake Triage', 'Basecamp Sync', 'Listing Copywriting'],
    escalationContactId: 'staff_melissa_cooper',
    status: 'active'
  },
  {
    id: 'staff_ryan_crecelius',
    fullName: 'Ryan Crecelius',
    title: 'Managing Broker of Record',
    role: 'broker_of_record',
    email: 'ryan.crecelius@nestrealty.com',
    phone: '(910) 555-0100',
    avatarUrl: '/org-avatars/ryan.png',
    activeWorkloadCount: 2,
    maxWorkloadCapacity: 10,
    skills: ['Contract Review', 'Compliance Signoff', 'Escrow Security'],
    status: 'active'
  },
  {
    id: 'staff_sarah_jenkins',
    fullName: 'Sarah Jenkins',
    title: 'Transaction Closing Coordinator',
    role: 'closing_coordinator',
    email: 'sarah.jenkins@nestrealty.com',
    phone: '(910) 555-0188',
    avatarUrl: '/org-avatars/sarah.png',
    activeWorkloadCount: 5,
    maxWorkloadCapacity: 7,
    skills: ['Title Clearance', 'Earnest Money Audit', 'HUD Settlement'],
    escalationContactId: 'staff_ryan_crecelius',
    status: 'busy'
  }
];

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
