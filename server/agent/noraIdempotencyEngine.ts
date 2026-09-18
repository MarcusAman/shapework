/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Idempotency Engine — Duplicate Execution Prevention
 * Prevents duplicate side-effect execution across voice transcription retries,
 * network retries, double submissions, and orchestrator replans.
 */

import crypto from 'crypto';
import { NoraActionResult } from './types.js';

export interface CachedExecution {
  key: string;
  result: NoraActionResult;
  timestamp: number;
}

export class NoraIdempotencyEngine {
  private static cache: Map<string, CachedExecution> = new Map();
  private static readonly TTL_MS = 5 * 60 * 1000; // 5 minutes retention

  /**
   * Generates a deterministic idempotency key if one is not explicitly provided.
   */
  public static computeKey(
    workspaceId: string,
    actionName: string,
    input: Record<string, any>,
    explicitKey?: string
  ): string {
    if (explicitKey && explicitKey.trim().length > 0) {
      return `idem_${workspaceId}_${explicitKey.trim()}`;
    }

    // Strip volatile fields like confirmed or timestamp
    const normalizedInput = { ...input };
    delete normalizedInput.confirmed;
    delete normalizedInput.timestamp;
    delete normalizedInput._t;

    const hash = crypto
      .createHash('sha256')
      .update(`${workspaceId}:${actionName}:${JSON.stringify(normalizedInput)}`)
      .digest('hex')
      .slice(0, 16);

    return `idem_${workspaceId}_${actionName}_${hash}`;
  }

  /**
   * Checks if an execution is cached and unexpired.
   */
  public static getCachedResult(key: string): NoraActionResult | null {
    this.prune();
    const hit = this.cache.get(key);
    if (!hit) return null;

    if (Date.now() - hit.timestamp > this.TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    return {
      ...hit.result,
      status: 'completed',
      humanReadableSummary: `${hit.result.humanReadableSummary} (Idempotent replay)`
    };
  }

  /**
   * Stores execution result in the idempotency cache.
   */
  public static recordExecution(key: string, result: NoraActionResult) {
    this.cache.set(key, {
      key,
      result,
      timestamp: Date.now()
    });
  }

  /**
   * Cleans expired keys from the cache.
   */
  private static prune() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL_MS) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears the cache (useful for testing).
   */
  public static clearForTesting() {
    this.cache.clear();
  }
}
