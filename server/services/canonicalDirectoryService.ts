/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical Directory Service
 * Queries the live active Directory repository (directory_people) scoped to the trusted workspace.
 * In production, static bootstrap rosters (e.g. NEST_FULL_ROSTER_77) CANNOT authenticate senders.
 */

import { getDbPool, storageDriver } from '../persistence/repositories.js';
import { NEST_FULL_ROSTER_77 } from '../persistence/nestRosterSeed.js';

export interface CanonicalDirectoryMember {
  id: string;
  name: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: string;
  title?: string;
  primaryOfficeName?: string;
  status: 'active' | 'inactive' | 'departed' | 'pending';
  isBrokerInCharge?: boolean;
  isAdmin?: boolean;
  workspaceId?: string;
}

const WILMINGTON_WORKSPACE_ALIASES = [
  'ws_wilmington',
  'nest-realty-wilmington',
  'nest-realty-demo',
  'tenant_nest',
  'tenant_nest_uat',
  'active-brokerage',
  'default'
];

/**
 * Retrieves an active directory member by exact email match from the canonical active repository.
 */
export async function getActiveDirectoryMemberByEmail(
  email: string,
  workspaceId: string = 'ws_wilmington'
): Promise<CanonicalDirectoryMember | null> {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  const isProduction = process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production';

  // 1. Try Live Database Repository if available
  const activePool = getDbPool();
  if (storageDriver === 'database' && activePool) {
    try {
      const dbRes = await activePool.query(
        `SELECT * FROM directory_people 
         WHERE LOWER(email) = $1 
           AND status NOT IN ('inactive', 'departed') 
           AND (workspace_id = $2 OR workspace_id IN ('ws_wilmington', 'nest-realty-wilmington', 'nest-realty-demo', 'tenant_nest', 'tenant_nest_uat'))`,
        [cleanEmail, workspaceId]
      );
      if (dbRes.rows.length === 1) {
        const row = dbRes.rows[0];
        return {
          id: row.id,
          name: row.display_name || `${row.first_name || ''} ${row.last_name || ''}`.trim(),
          displayName: row.display_name || row.email,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email.toLowerCase(),
          phone: row.phone,
          role: row.role || row.title || 'Broker',
          title: row.title || row.role || 'Broker',
          primaryOfficeName: row.primary_office_name,
          status: (row.status || 'active').toLowerCase() as any,
          isBrokerInCharge: Boolean(row.is_broker_in_charge),
          isAdmin: Boolean(row.is_admin || row.is_broker_in_charge),
          workspaceId: row.workspace_id
        };
      }
      if (dbRes.rows.length > 1) {
        // Ambiguous match -> fail verification
        console.warn(`[Canonical Directory] Ambiguous directory match for email: ${cleanEmail} (${dbRes.rows.length} records found)`);
        return null;
      }
      if (isProduction) {
        return null;
      }
    } catch (err) {
      console.error('[Canonical Directory] Database lookup error:', err);
      // If production database is unavailable, fail-closed: do not fall back to static seed in production
      if (isProduction) {
        return null;
      }
    }
  }

  // 2. In production, if database is unconfigured / unavailable, fail-closed
  if (isProduction) {
    console.warn(`[Canonical Directory] Production directory repository unavailable; denying static fallback for ${cleanEmail}`);
    return null;
  }

  // 3. Local/Test Bootstrap Fallback (Only allowed in development / test mode)
  if (cleanEmail === 'marcus.aman@gmail.com' || cleanEmail === 'marcus@shapework.co') {
    return {
      id: 'dir_marcus_aman_0',
      name: 'Marcus Aman',
      displayName: 'Marcus Aman',
      email: cleanEmail,
      phone: '+12527170595',
      role: 'Broker / Tech Lead',
      title: 'Broker / Tech Lead',
      primaryOfficeName: 'Mayfaire HQ',
      status: 'active',
      isBrokerInCharge: false,
      isAdmin: true,
      workspaceId: 'ws_wilmington'
    };
  }

  if (cleanEmail === 'sarah.jenkins@nestrealty.com') {
    return {
      id: 'dir_sarah_jenkins',
      name: 'Sarah Jenkins',
      displayName: 'Sarah Jenkins',
      email: cleanEmail,
      phone: '+19105551234',
      role: 'Broker',
      title: 'Broker',
      primaryOfficeName: 'Mayfaire HQ',
      status: 'active',
      isBrokerInCharge: false,
      isAdmin: false,
      workspaceId: 'ws_wilmington'
    };
  }



  const matchingMembers = NEST_FULL_ROSTER_77.filter(m => 
    m.email && m.email.toLowerCase() === cleanEmail && (m.status as string) !== 'inactive' && (m.status as string) !== 'departed'
  );

  if (matchingMembers.length === 1) {
    const mem = matchingMembers[0];
    return {
      id: mem.id,
      name: mem.displayName,
      displayName: mem.displayName,
      firstName: mem.firstName,
      lastName: mem.lastName,
      email: mem.email.toLowerCase(),
      phone: mem.phone,
      role: mem.role || mem.title || 'Broker',
      title: mem.title || mem.role || 'Broker',
      primaryOfficeName: mem.primaryOfficeName,
      status: (mem.status || 'active').toLowerCase() as any,
      isBrokerInCharge: Boolean(mem.isBrokerInCharge),
      isAdmin: Boolean((mem as any).isAdmin || mem.isBrokerInCharge),
      workspaceId: 'ws_wilmington'
    };
  }

  return null;
}

/**
 * Retrieves an active directory member by phone number from the canonical active repository.
 */
export async function getActiveDirectoryMemberByPhone(
  phone: string,
  workspaceId: string = 'ws_wilmington'
): Promise<CanonicalDirectoryMember | null> {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return null;
  const isProduction = process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production';

  const activePool = getDbPool();
  if (storageDriver === 'database' && activePool) {
    try {
      const dbRes = await activePool.query(
        `SELECT * FROM directory_people 
         WHERE status NOT IN ('inactive', 'departed') 
           AND (workspace_id = $1 OR workspace_id IN ('ws_wilmington', 'nest-realty-wilmington', 'nest-realty-demo', 'tenant_nest', 'tenant_nest_uat'))`,
        [workspaceId]
      );
      const matches = dbRes.rows.filter(row => {
        if (!row.phone) return false;
        const rowDigits = row.phone.replace(/\D/g, '');
        return rowDigits.includes(digits) || digits.includes(rowDigits);
      });

      if (matches.length === 1) {
        const row = matches[0];
        return {
          id: row.id,
          name: row.display_name || `${row.first_name || ''} ${row.last_name || ''}`.trim(),
          displayName: row.display_name || row.email,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email.toLowerCase(),
          phone: row.phone,
          role: row.role || row.title || 'Broker',
          title: row.title || row.role || 'Broker',
          primaryOfficeName: row.primary_office_name,
          status: (row.status || 'active').toLowerCase() as any,
          isBrokerInCharge: Boolean(row.is_broker_in_charge),
          isAdmin: Boolean(row.is_admin || row.is_broker_in_charge),
          workspaceId: row.workspace_id
        };
      }
      return null;
    } catch (err) {
      console.error('[Canonical Directory] Database phone lookup error:', err);
      if (isProduction) return null;
    }
  }

  if (isProduction) {
    return null;
  }

  // Local/Test Fallback
  const matches = NEST_FULL_ROSTER_77.filter(m => {
    if (!m.phone || (m.status as string) === 'inactive' || (m.status as string) === 'departed') return false;
    const mDigits = m.phone.replace(/\D/g, '');
    return mDigits.includes(digits) || digits.includes(mDigits);
  });

  if (matches.length === 1) {
    const mem = matches[0];
    return {
      id: mem.id,
      name: mem.displayName,
      displayName: mem.displayName,
      firstName: mem.firstName,
      lastName: mem.lastName,
      email: mem.email.toLowerCase(),
      phone: mem.phone,
      role: mem.role || mem.title || 'Broker',
      title: mem.title || mem.role || 'Broker',
      primaryOfficeName: mem.primaryOfficeName,
      status: (mem.status || 'active').toLowerCase() as any,
      isBrokerInCharge: Boolean(mem.isBrokerInCharge),
      isAdmin: Boolean((mem as any).isAdmin || mem.isBrokerInCharge),
      workspaceId: 'ws_wilmington'
    };
  }

  return null;
}

/**
 * Checks if a directory member has administrative/brokerage-wide privileges.
 */
export function isAdministrativeStaffOrBic(member?: CanonicalDirectoryMember | null): boolean {
  if (!member) return false;
  if (member.isAdmin || member.isBrokerInCharge) return true;
  const roleLower = (member.role || '').toLowerCase();
  const titleLower = (member.title || '').toLowerCase();
  const nameLower = (member.name || '').toLowerCase();

  return (
    roleLower.includes('bic') ||
    roleLower.includes('broker-in-charge') ||
    roleLower.includes('principal') ||
    roleLower.includes('operations') ||
    roleLower.includes('marketing director') ||
    titleLower.includes('bic') ||
    titleLower.includes('operations lead') ||
    nameLower.includes('ryan crecelius') ||
    nameLower.includes('ann gunn') ||
    nameLower.includes('jessica keenan') ||
    nameLower.includes('eric knight') ||
    nameLower.includes('melissa gagliardi')
  );
}
