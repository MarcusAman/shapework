/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuditEvent, Transaction } from '../types/shapework';
import { safeLower } from './string';

interface Profile {
  name: string;
  role: string;
}

/**
 * Normalizes a partial audit event to guarantee all fields are defined with safe fallbacks.
 */
export function normalizeAuditEvent(event: Partial<AuditEvent>): AuditEvent {
  const userName = event.user_name ?? event.actor ?? 'system';
  const actionDesc = event.action_description ?? event.action ?? 'Audit event';
  
  return {
    id: event.id ?? `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: event.timestamp ?? new Date().toISOString(),
    user_name: userName,
    user_role: event.user_role ?? 'system',
    action_description: actionDesc,
    impact_area: event.impact_area ?? 'general',
    action: event.action ?? actionDesc,
    actor: event.actor ?? userName,
    system: event.system ?? 'shapework',
    target_record: event.target_record ?? '',
    metadata: event.metadata ?? {}
  };
}

/**
 * Creates a standard audit log event using normalizeAuditEvent helper.
 */
export function createAuditEvent(
  profile: Profile,
  actionDescription: string,
  impactArea: string,
  targetRecord?: string,
  metadata?: { before_value: string; after_value: string }
): AuditEvent {
  return normalizeAuditEvent({
    user_name: profile.name,
    user_role: profile.role,
    action_description: actionDescription,
    impact_area: impactArea,
    target_record: targetRecord,
    metadata
  });
}

/**
 * Computes updated transaction list after rolling back an action.
 */
export function rollbackTransactionStage(
  log: AuditEvent,
  transactions: Transaction[]
): Transaction[] {
  if (!log.metadata?.before_value) return transactions;
  
  const actionText = log.action || log.action_description || '';
  const actionTextLower = safeLower(actionText);
  const isStageChange = actionTextLower.includes('stage') || actionTextLower.includes('status');
  
  if (!isStageChange) return transactions;

  // Try to find the target transaction by matching log target_record or address in action text
  const targetAddress = log.target_record || '';
  const matchedTx = transactions.find(t => 
    t.property_address === targetAddress || 
    actionText.includes(t.property_address)
  );

  if (!matchedTx) return transactions;

  return transactions.map(t => {
    if (t.id === matchedTx.id) {
      return {
        ...t,
        current_stage: (log.metadata?.before_value || t.current_stage) as any
      };
    }
    return t;
  });
}
