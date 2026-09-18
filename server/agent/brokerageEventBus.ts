/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Brokerage Event Bus — Foundation for Event-Driven Agent Observation
 * Enables Nora and brokerage subsystems to publish and observe meaningful operational events.
 */

import { BrokerageEvent } from './types.js';

export type BrokerageEventHandler = (event: BrokerageEvent) => Promise<void> | void;

export class BrokerageEventBus {
  private static handlers: Map<string, BrokerageEventHandler[]> = new Map();
  private static recentEvents: BrokerageEvent[] = [];

  /**
   * Subscribe a listener function to a specific event type.
   */
  public static subscribe(eventType: BrokerageEvent['type'] | '*', handler: BrokerageEventHandler) {
    const list = this.handlers.get(eventType) || [];
    list.push(handler);
    this.handlers.set(eventType, list);
  }

  /**
   * Publishes an event across subscribers and records it in recent history.
   */
  public static async emit(
    event: Omit<BrokerageEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
  ): Promise<BrokerageEvent> {
    const fullEvent: BrokerageEvent = {
      id: event.id || `evt_brk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: event.timestamp || new Date().toISOString(),
      type: event.type,
      brokerageId: event.brokerageId,
      tenantId: event.tenantId,
      workspaceId: event.workspaceId,
      userId: event.userId,
      entityType: event.entityType,
      entityId: event.entityId,
      payload: event.payload
    };

    this.recentEvents.unshift(fullEvent);
    if (this.recentEvents.length > 100) {
      this.recentEvents.pop();
    }

    // Notify specific type listeners
    const specificHandlers = this.handlers.get(fullEvent.type) || [];
    const wildcardHandlers = this.handlers.get('*') || [];
    const allHandlers = [...specificHandlers, ...wildcardHandlers];

    for (const handler of allHandlers) {
      try {
        await handler(fullEvent);
      } catch (err) {
        console.warn(`[Brokerage Event Bus] Error in handler for ${fullEvent.type}:`, err);
      }
    }

    return fullEvent;
  }

  /**
   * Retrieves recent events.
   */
  public static getRecentEvents(filterType?: BrokerageEvent['type']): BrokerageEvent[] {
    if (filterType) {
      return this.recentEvents.filter(e => e.type === filterType);
    }
    return [...this.recentEvents];
  }

  /**
   * Clears event history (useful for test isolation).
   */
  public static clearHistoryForTesting() {
    this.recentEvents = [];
    this.handlers.clear();
  }
}
