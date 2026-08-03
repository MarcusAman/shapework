/**
 * Production Tenant Initializer
 * Purges mock test/demo records and provisions clean initial production state
 * for Ryan Crecelius and the Nest Realty team workspace.
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function initializeProductionNestTenant(): { success: boolean; purgedFiles: string[]; initializedAt: string } {
  ensureDataDir();
  const purgedFiles: string[] = [];

  // Files to reset to clean production state
  const targetFiles = [
    'marketing_campaigns.json',
    'operations_directory.json',
    'oauth_tokens.json',
    'boundary_telemetry.json',
    'quickbooks_ledger.json'
  ];

  for (const filename of targetFiles) {
    const filePath = path.join(DATA_DIR, filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        purgedFiles.push(filename);
      } catch (err) {
        console.error(`Failed to purge ${filename}:`, err);
      }
    }
  }

  // Write clean initial Nest Realty Operations Directory
  const initialNestStaff = [
    {
      id: 'staff_ryan_crecelius',
      fullName: 'Ryan Crecelius',
      title: 'Managing Broker of Record',
      role: 'broker_of_record',
      email: 'ryan.crecelius@nestrealty.com',
      phone: '(910) 555-0100',
      avatarUrl: '/org-avatars/ryan.png',
      activeWorkloadCount: 0,
      maxWorkloadCapacity: 10,
      skills: ['Contract Review', 'Compliance Signoff', 'Escrow Security'],
      status: 'active'
    },
    {
      id: 'staff_melissa_cooper',
      fullName: 'Melissa Cooper',
      title: 'Senior Marketing Director',
      role: 'marketing_specialist',
      email: 'melissa.cooper@nestrealty.com',
      phone: '(910) 555-0142',
      avatarUrl: '/org-avatars/melissa.png',
      activeWorkloadCount: 0,
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
      activeWorkloadCount: 0,
      maxWorkloadCapacity: 6,
      skills: ['Intake Triage', 'Basecamp Sync', 'Listing Copywriting'],
      escalationContactId: 'staff_melissa_cooper',
      status: 'active'
    }
  ];

  fs.writeFileSync(path.join(DATA_DIR, 'operations_directory.json'), JSON.stringify(initialNestStaff, null, 2));

  return {
    success: true,
    purgedFiles,
    initializedAt: new Date().toISOString()
  };
}
