/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Context Engine — Unified Runtime Context Builder
 * Constructs an authentic, tenant-scoped, role-aware runtime context for all Nora interactions.
 */

import { NoraContext, NoraUserContext } from './types.js';
import { ROLE_PERMISSIONS, CANONICAL_WILMINGTON_WORKSPACE_ID } from '../auth/auth.js';

export interface BuildContextOptions {
  user?: Partial<NoraUserContext>;
  userId?: string;
  userRole?: string;
  tenantId?: string;
  workspaceId?: string;
  sessionMemory?: {
    activeContract?: any;
    activeSop?: any;
    activePerson?: any;
  };
  req?: any;
}

export class NoraContextEngine {
  private static recentActionAuditBuffer: any[] = [];

  /**
   * Appends an action execution audit record to the in-memory context buffer.
   */
  public static recordAction(actionRecord: any) {
    this.recentActionAuditBuffer.unshift(actionRecord);
    if (this.recentActionAuditBuffer.length > 50) {
      this.recentActionAuditBuffer.pop();
    }
  }

  /**
   * Builds a complete, verified NoraContext for a given request or turn.
   */
  public static buildContext(options: BuildContextOptions = {}): NoraContext {
    // Strict Server-Side Authentication & Tenant Isolation Precedence
    let tenantId = 'tenant_nest_uat';
    let workspaceId = CANONICAL_WILMINGTON_WORKSPACE_ID;
    let user: NoraUserContext;

    if (options.req) {
      // In HTTP request context, server session / JWT takes absolute precedence over client bodies
      tenantId = options.req.session?.tenantId || options.req.tenantId || 'tenant_nest_uat';
      workspaceId = options.req.session?.workspaceId || options.req.workspaceId || CANONICAL_WILMINGTON_WORKSPACE_ID;

      if (options.req.user) {
        const u = options.req.user;
        const role = (u.role || 'agent') as NoraUserContext['role'];
        user = {
          id: u.id || 'usr_authenticated',
          email: u.email || 'user@nestrealty.com',
          name: u.name || 'Nest Broker',
          role,
          primaryOffice: u.primaryOffice || 'Mayfaire Town Center HQ (Wilmington, NC)',
          isBrokerInCharge: role === 'bic' || role === 'owner' || (u.name && u.name.toLowerCase().includes('bic'))
        };
      } else {
        // Unauthenticated request context - strictly assign guest with zero elevated privileges
        user = {
          id: 'usr_guest_unauth',
          email: 'guest@shapework.co',
          name: 'Guest User',
          role: 'guest',
          primaryOffice: 'Mayfaire Town Center HQ (Wilmington, NC)',
          isBrokerInCharge: false
        };
      }
    } else {
      // Non-HTTP / Internal Programmatic or Unit Testing invocation
      tenantId = options.tenantId || 'tenant_nest_uat';
      workspaceId = options.workspaceId || CANONICAL_WILMINGTON_WORKSPACE_ID;

      const role = (options.user?.role || options.userRole || 'agent') as NoraUserContext['role'];
      const userId = options.user?.id || options.userId || (role === 'bic' ? 'usr_ryan_crecelius' : 'usr_agent_test');
      const name = options.user?.name || (role === 'bic' ? 'Ryan Crecelius (BIC)' : 'Marcus Aman (Broker)');
      const email = options.user?.email || (role === 'bic' ? 'ryan@nestrealty.com' : 'marcus@shapework.co');

      user = {
        id: userId,
        email,
        name,
        role,
        primaryOffice: 'Mayfaire Town Center HQ (Wilmington, NC)',
        isBrokerInCharge: role === 'bic' || role === 'owner' || name.toLowerCase().includes('bic')
      };
    }

    // Resolve role permissions from canonical permissions table
    const permissions = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS['guest'] || [];

    // Resolve active transaction if present in session memory
    let activeTransaction: NoraContext['activeTransaction'] = undefined;
    if (options.sessionMemory?.activeContract) {
      const c = options.sessionMemory.activeContract;
      const addr = c.address || c.propertyAddress;
      if (addr) {
        activeTransaction = {
          id: c.id || `tx_${Date.now()}`,
          propertyAddress: addr,
          status: c.status || 'under_contract',
          buyers: c.buyers ? (Array.isArray(c.buyers) ? c.buyers : [c.buyers]) : (c.buyerName ? [c.buyerName] : ['Buyer Client']),
          purchasePrice: c.price || c.purchasePrice || 0,
          dueDiligenceFee: c.ddFee || c.dueDiligenceFee || 0,
          earnestMoneyDeposit: c.emd || c.earnestMoneyDeposit || 0
        };
      }
    }

    // Resolve active SOP
    let activeSop: NoraContext['activeSop'] = undefined;
    if (options.sessionMemory?.activeSop) {
      const s = options.sessionMemory.activeSop;
      activeSop = {
        id: s.id,
        title: s.title,
        processOwner: s.processOwner || 'Operations Lead',
        currentStepIndex: s.currentStepIndex || 0
      };
    }

    // Resolve active person
    let activePerson: NoraContext['activePerson'] = undefined;
    if (options.sessionMemory?.activePerson) {
      const p = options.sessionMemory.activePerson;
      activePerson = {
        name: p.name,
        role: p.role,
        email: p.email,
        phone: p.phone
      };
    }

    return {
      user,
      tenantId,
      workspaceId,
      permissions,
      activeTransaction,
      activeSop,
      activePerson,
      recentActionHistory: [...this.recentActionAuditBuffer],
      environment: (process.env.NODE_ENV === 'production' ? 'production' : (process.env.NODE_ENV === 'test' ? 'test' : 'development'))
    };
  }
}
