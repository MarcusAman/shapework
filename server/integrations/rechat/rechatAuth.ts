/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';

export interface RechatOAuthState {
  workspaceId: string;
  userId: string;
  expiresAt: number;
}

export const rechatActiveStates = new Map<string, RechatOAuthState>();

class RechatAuth {
  public generateState(workspaceId: string, userId: string): string {
    const state = crypto.randomBytes(32).toString('hex');
    rechatActiveStates.set(state, {
      workspaceId,
      userId,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    return state;
  }

  public validateState(state: string, userId: string): RechatOAuthState | null {
    const data = rechatActiveStates.get(state);
    if (!data) return null;
    if (data.userId !== userId) return null;
    if (Date.now() > data.expiresAt) return null;
    rechatActiveStates.delete(state);
    return data;
  }
}

export const rechatAuth = new RechatAuth();
