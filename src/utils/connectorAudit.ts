/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuditEvent } from '../types/shapework';

/**
 * Creates a compliant AuditEvent for a specific connector operation.
 */
export function createConnectorAuditEvent(
  connectorId: string,
  actionDescription: string,
  impactArea: string,
  targetRecord?: string,
  metadata?: { before_value?: string; after_value?: string }
): AuditEvent {
  return {
    id: `audit_${connectorId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    user_name: 'AI Operations Agent',
    user_role: 'System specialist',
    action_description: actionDescription,
    impact_area: impactArea,
    action: 'Connector Synced',
    actor: 'shapework Integration Pipeline',
    system: connectorId,
    target_record: targetRecord || 'Global System',
    metadata
  };
}

/**
 * Log connector activity to the console for tracking.
 */
export function logConnectorAudit(connectorId: string, action: string, details: string): void {
  console.log(`[CONNECTOR AUDIT] ${connectorId} - ${action}: ${details}`);
}
