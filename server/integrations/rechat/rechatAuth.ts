/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';

class RechatAuth {
  // Simple CSRF state manager
  private states = new Set<string>();

  public generateState(): string {
    const state = crypto.randomBytes(16).toString('hex');
    this.states.add(state);
    return state;
  }

  public validateState(state: string): boolean {
    if (!state) return false;
    const isValid = this.states.has(state);
    if (isValid) {
      this.states.delete(state); // One-time use state
    }
    return isValid;
  }
}

export const rechatAuth = new RechatAuth();
