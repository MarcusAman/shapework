/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const DEMO_MODE = true;

/**
 * Guard that intercepts real external calls or dispatches.
 * Returns true if the action was successfully guarded (prevented).
 */
export function guardOutboundAction(channel: 'email' | 'sms' | 'webhook' | 'oauth' | 'api_call', destination: string, payload: unknown): boolean {
  if (DEMO_MODE) {
    console.warn(`[PRODUCTION GUARD] Intercepted and blocked ${channel} dispatch to ${destination}. Demo sandbox mode is active.`);
    return true;
  }
  return false;
}
