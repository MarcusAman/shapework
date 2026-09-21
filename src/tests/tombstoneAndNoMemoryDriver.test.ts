import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../server/persistence/repositories.js", () => ({
  getDbPool: () => null,
}));

import {
  _resetTombstonesForTests,
  upsertTombstone,
  isTombstoned,
} from "../../server/persistence/intakeTombstoneRepository.js";
import {
  evaluateOutboundDispatchGuard,
  isMemoryPersistenceDriver,
  looksLikeSmokeOrTestThread,
} from "../../server/email/outboundDispatchGuards.js";

describe("tombstone + no memory-driver in prod", () => {
  beforeEach(() => {
    _resetTombstonesForTests();
    delete process.env.APP_MODE;
    delete process.env.APP_ENV;
    delete process.env.IS_PRODUCTION;
    process.env.NODE_ENV = "test";
    delete process.env.PERSISTENCE_DRIVER;
    delete process.env.STORAGE_DRIVER;
  });

  it("archive/tombstone then same IMAP identity => zero dispatch allowance", async () => {
    await upsertTombstone({
      workspaceId: "ws_wilmington",
      requestId: "req_email_414_help_me",
      propertyAddress: "414 Help Me Street, Wilmington, NC 28412",
      threadIds: ["thread-414"],
      messageIds: ["mid-414-smoke"],
      reason: "archived",
    });

    const byAddr = await evaluateOutboundDispatchGuard({
      propertyAddress: "414 Help Me Street, Wilmington, NC 28412",
    });
    const byMsg = await evaluateOutboundDispatchGuard({
      messageId: "mid-414-smoke",
    });
    const byThread = await evaluateOutboundDispatchGuard({
      threadId: "thread-414",
    });

    expect(byAddr.allowed).toBe(false);
    expect(byAddr.reason).toBe("tombstone");
    expect(byMsg.allowed).toBe(false);
    expect(byThread.allowed).toBe(false);
    expect(await isTombstoned({ propertyAddress: "414 Help Me Street" })).toBeTruthy();
  });

  it("production + memory driver => SUPPRESSED:memory_driver (refuse outbound)", async () => {
    process.env.APP_MODE = "production";
    process.env.PERSISTENCE_DRIVER = "memory";
    expect(isMemoryPersistenceDriver()).toBe(true);

    const logs: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((...args) => {
      logs.push(args.map(String).join(" "));
    });

    const result = await evaluateOutboundDispatchGuard({
      propertyAddress: "414 Help Me Street",
    });
    spy.mockRestore();

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("memory_driver");
    expect(logs.some((l) => l.includes("SUPPRESSED:memory_driver"))).toBe(true);
  });

  it("smoke/test subjects are detected for IMAP skip", () => {
    expect(
      looksLikeSmokeOrTestThread("Re: AskNora SMTP smoke — 414 Help Me Street")
    ).toBe(true);
    expect(looksLikeSmokeOrTestThread("Marketing request for 100 Main St")).toBe(false);
  });
});
