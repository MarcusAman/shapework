/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAllStaffMembers } from '../persistence/operationsDirectoryRepository.js';

export interface DepartmentOwner {
  name: string;
  email: string;
  role: string;
  department: 'marketing' | 'signage' | 'contracts' | 'production' | 'operations';
}

export type TaskLifecycleEvent = 'intake' | 'routing' | 'review' | 'completed' | 'late';

function applyOutOfOfficeCoverage(owner: DepartmentOwner): DepartmentOwner {
  try {
    const staffList = getAllStaffMembers();
    const oooStaff = staffList.find(s =>
      s.status === 'out_of_office' &&
      s.backupStaffId &&
      (s.email.toLowerCase() === owner.email.toLowerCase() ||
       s.fullName.toLowerCase() === owner.name.toLowerCase() ||
       (s.fullName.toLowerCase().startsWith('melissa') && owner.name.toLowerCase().startsWith('melissa')) ||
       (s.fullName.toLowerCase().startsWith('ann') && owner.name.toLowerCase().startsWith('ann')) ||
       (s.role === 'marketing_specialist' && owner.department === 'marketing'))
    );
    const staff = oooStaff || staffList.find(s =>
      s.email.toLowerCase() === owner.email.toLowerCase() ||
      s.fullName.toLowerCase() === owner.name.toLowerCase() ||
      (s.fullName.toLowerCase().startsWith('melissa') && owner.name.toLowerCase().startsWith('melissa')) ||
      (s.fullName.toLowerCase().startsWith('ann') && owner.name.toLowerCase().startsWith('ann')) ||
      (s.role === 'marketing_specialist' && owner.department === 'marketing')
    );

    if (staff && staff.status === 'out_of_office' && staff.backupStaffId) {
      const backup = staffList.find(s =>
        (s.id === staff.backupStaffId ||
         s.fullName.toLowerCase() === staff.backupStaffId.toLowerCase() ||
         s.email.toLowerCase() === staff.backupStaffId.toLowerCase()) &&
        s.id !== staff.id &&
        s.status !== 'out_of_office'
      );
      if (backup) {
        return {
          name: backup.fullName,
          email: backup.email,
          role: `${backup.title} (Acting Coverage for ${owner.name})`,
          department: owner.department
        };
      }
    }
  } catch (err) {
    // Fallback to primary owner
  }
  return owner;
}

const DEPARTMENT_OWNERS: Record<string, DepartmentOwner> = {
  marketing: {
    name: 'Melissa Gagliardi',
    email: 'melissa.gagliardi@nestrealty.com',
    role: 'Marketing Director',
    department: 'marketing'
  },
  signage: {
    name: 'Ann Gunn',
    email: 'ann.gunn@nestrealty.com',
    role: 'Operations & Signage Lead',
    department: 'signage'
  },
  contracts: {
    name: 'Ryan Crecelius',
    email: 'ryan@nestrealty.com',
    role: 'BIC / Principal Broker',
    department: 'contracts'
  },
  production: {
    name: 'Eduardo Lovo',
    email: 'eduardo@nestrealty.com',
    role: 'Virtual Assistant / Maxa Lead',
    department: 'production'
  },
  technology: {
    name: 'Marcus Aman',
    email: 'marcus.aman@gmail.com',
    role: 'Broker / Tech Lead',
    department: 'operations'
  },
  operations: {
    name: 'Marcus Aman',
    email: 'marcus.aman@gmail.com',
    role: 'Broker / Tech Lead',
    department: 'operations'
  }
};

/**
 * Resolves the responsible department owner based on task category, deliverable title, or assignee.
 * Enforces that Melissa Gagliardi (melissa.gagliardi@nestrealty.com) is ONLY assigned/CC'd for Marketing.
 */
export function getResponsibleDepartmentOwner(options: {
  category?: string;
  title?: string;
  assignee?: string;
  department?: string;
}): DepartmentOwner {
  const categoryLower = (options.category || '').toLowerCase();
  const titleLower = (options.title || '').toLowerCase();
  const assigneeLower = (options.assignee || '').toLowerCase();

  let resolved = DEPARTMENT_OWNERS.marketing;

  // 1. Signage & Yard Post Installation
  if (
    categoryLower === 'signage' ||
    categoryLower === 'yard_post' ||
    categoryLower === 'rider' ||
    titleLower.includes('sign') ||
    titleLower.includes('rider') ||
    titleLower.includes('post install') ||
    assigneeLower.includes('ann gunn')
  ) {
    resolved = DEPARTMENT_OWNERS.signage;
  }
  // 2. Contracts, Form 2-T, Compliance
  else if (
    categoryLower === 'contracts' ||
    categoryLower === 'compliance' ||
    categoryLower === 'form_2t' ||
    categoryLower === 'earnest_money' ||
    titleLower.includes('contract') ||
    titleLower.includes('addendum') ||
    titleLower.includes('form 2-t') ||
    assigneeLower.includes('ryan') ||
    assigneeLower.includes('bic')
  ) {
    resolved = DEPARTMENT_OWNERS.contracts;
  }
  // 3. Technology, Systems, IT & Hardware/Software Support
  else if (
    categoryLower === 'technology' ||
    categoryLower === 'it_systems' ||
    categoryLower === 'tech' ||
    titleLower.includes('wifi') ||
    titleLower.includes('internet') ||
    titleLower.includes('printer') ||
    titleLower.includes('laptop') ||
    titleLower.includes('password') ||
    titleLower.includes('tech support') ||
    titleLower.includes('software issue') ||
    titleLower.includes('dotloop access') ||
    titleLower.includes('rechat access') ||
    assigneeLower.includes('marcus')
  ) {
    resolved = DEPARTMENT_OWNERS.technology;
  }
  // 4. Virtual Assistant & Maxa Asset Production
  else if (
    categoryLower === 'production' ||
    categoryLower === 'virtual_assistant' ||
    assigneeLower.includes('eduardo')
  ) {
    resolved = DEPARTMENT_OWNERS.production;
  }
  // 5. General Facilities & Office Operations
  else if (
    categoryLower === 'operations' ||
    categoryLower === 'facilities' ||
    titleLower.includes('facility') ||
    titleLower.includes('office supplies')
  ) {
    resolved = DEPARTMENT_OWNERS.signage; // Ann Gunn (Operations Lead)
  }
  // 6. Marketing Deliverables (Flyer, Social Story, Postcard, Open House, Brochures)
  // Melissa Gagliardi is the strict owner for all Marketing collateral
  else if (
    categoryLower === 'marketing' ||
    categoryLower === 'print' ||
    categoryLower === 'social' ||
    categoryLower === 'open_house' ||
    categoryLower === 'flyer' ||
    titleLower.includes('flyer') ||
    titleLower.includes('social') ||
    titleLower.includes('postcard') ||
    titleLower.includes('brochure') ||
    titleLower.includes('open house') ||
    assigneeLower.includes('melissa')
  ) {
    resolved = DEPARTMENT_OWNERS.marketing;
  }

  return applyOutOfOfficeCoverage(resolved);
}

/**
 * Determines whether a department owner should be CC'd on an outbound email notification.
 * Returns true for all standard lifecycle events (intake, routing, review, completed, late).
 */
export function shouldCcDepartmentOwner(category: string, eventType: TaskLifecycleEvent): boolean {
  // All standard task lifecycle events warrant CC'ing the responsible department owner
  return true;
}

/**
 * Returns the exact CC email address for a given task or request based on category and event.
 */
export function getNotificationCcEmail(options: {
  category?: string;
  title?: string;
  assignee?: string;
  eventType?: TaskLifecycleEvent;
}): string {
  const owner = getResponsibleDepartmentOwner(options);
  return owner.email;
}
