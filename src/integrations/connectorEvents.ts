/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConnectorDemoEvent } from './types';

/**
 * Creates a structured demo event object for testing and playback.
 */
export function createConnectorDemoEvent(
  id: string,
  label: string,
  description: string,
  eventType: string,
  sourceSystem: string,
  payload: Record<string, unknown>,
  expectedAgents: string[] = [],
  expectedActions: string[] = [],
  expectedAuditEvents: string[] = []
): ConnectorDemoEvent {
  return {
    id,
    label,
    description,
    eventType,
    sourceSystem,
    payload,
    expectedAgents,
    expectedActions,
    expectedAuditEvents
  };
}
