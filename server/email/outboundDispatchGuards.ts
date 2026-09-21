/**
 * Fail-closed outbound guards: tombstone + no memory-driver in production.
 */
import { isTombstoned } from "../persistence/intakeTombstoneRepository.js";

export type OutboundGuardReason = "tombstone" | "memory_driver" | null;

export function isProductionAppMode(): boolean {
  const mode = (
    process.env.APP_MODE ||
    process.env.APP_ENV ||
    process.env.NODE_ENV ||
    ""
  ).toLowerCase();
  return mode === "production" || process.env.IS_PRODUCTION === "true";
}

export function isMemoryPersistenceDriver(): boolean {
  const driver = (
    process.env.PERSISTENCE_DRIVER ||
    process.env.STORAGE_DRIVER ||
    ""
  ).toLowerCase().trim();
  return driver === "memory" || driver === "mem" || driver === "inmemory" || driver === "in-memory";
}

export async function evaluateOutboundDispatchGuard(input?: {
  workspaceId?: string;
  requestId?: string | null;
  propertyAddress?: string | null;
  threadId?: string | null;
  messageId?: string | null;
}): Promise<{ allowed: boolean; reason: OutboundGuardReason; detail?: string }> {
  if (isProductionAppMode() && isMemoryPersistenceDriver()) {
    console.log("SUPPRESSED:memory_driver");
    return {
      allowed: false,
      reason: "memory_driver",
      detail: "PERSISTENCE_DRIVER/STORAGE_DRIVER=memory is forbidden for outbound in production",
    };
  }

  const tomb = await isTombstoned({
    workspaceId: input?.workspaceId,
    requestId: input?.requestId,
    propertyAddress: input?.propertyAddress,
    threadId: input?.threadId,
    messageId: input?.messageId,
  });
  if (tomb) {
    console.log("SUPPRESSED:tombstone");
    return {
      allowed: false,
      reason: "tombstone",
      detail: `scope=${tomb.scopeKey}`,
    };
  }

  return { allowed: true, reason: null };
}

export function looksLikeSmokeOrTestThread(subject?: string | null, body?: string | null): boolean {
  const hay = `${subject || ""}\n${body || ""}`.toLowerCase();
  return /asknora smtp smoke|smtp smoke|\bsmoke:|\btest memory driver\b|partial[- ]success/.test(hay);
}
