/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function logIntegrationAudit(
  dbState: any,
  workspaceId: string,
  userName: string,
  userRole: string,
  actionDescription: string,
  impactProperty: string
) {
  if (!dbState.auditEvents) {
    dbState.auditEvents = [];
  }

  const newAudit = {
    id: `au_int_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    workspaceId,
    timestamp: new Date().toISOString(),
    user_name: userName,
    user_role: userRole,
    action_description: actionDescription,
    impact_area: 'Integrations',
    impact_property: impactProperty,
    rollback_available: false
  };

  dbState.auditEvents.unshift(newAudit);
  return newAudit;
}
