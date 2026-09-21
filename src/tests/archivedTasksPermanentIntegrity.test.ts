import { describe, it, expect, beforeEach } from "vitest";
import {
  saveCanonicalMarketingRequest,
  saveCanonicalMarketingTask,
  getAllCanonicalMarketingTasks,
  getAllCanonicalMarketingRequests,
  archiveCanonicalMarketingTask,
  updateCanonicalMarketingTaskStatus,
  convertCallToCanonicalMarketingRequest,
  performBulkTaskAction,
  purgeAllCanonicalMarketingData
} from "../../server/persistence/marketingCampaignsRepository.js";

describe("Archived Tasks Permanent Integrity Suite", () => {
  beforeEach(() => {
    purgeAllCanonicalMarketingData();
  });

  it("1. Archiving a task marks isArchived: true and status: archived", () => {
    const task = saveCanonicalMarketingTask({
      id: "task_test_arch_1",
      requestId: "req_test_arch_1",
      title: "Double-Sided 8.5x11 Property Flyer",
      status: "request_received",
      propertyAddress: "100 Water Street, Wilmington NC",
      agentName: "Ryan Crecelius"
    });

    expect(task.isArchived).toBeFalsy();
    expect(task.status).toBe("request_received");

    const archived = archiveCanonicalMarketingTask(task.id);
    expect(archived).toBeDefined();
    expect(archived?.isArchived).toBe(true);
    expect(archived?.status).toBe("archived");
    expect(archived?.archivedAt).toBeDefined();

    const inMemory = getAllCanonicalMarketingTasks().find(t => t.id === task.id);
    expect(inMemory?.isArchived).toBe(true);
    expect(inMemory?.status).toBe("archived");
  });

  it("2. Inbound call conversion does NOT resurrect an already-archived deliverable", () => {
    const propertyAddress = "102 Water Street, Wilmington NC";
    const req = saveCanonicalMarketingRequest({
      id: "req_call_12345",
      title: propertyAddress,
      propertyAddress,
      status: "archived",
      isArchived: true,
      category: "print"
    });

    const task = saveCanonicalMarketingTask({
      id: "task_call_12345_0",
      requestId: req.id,
      title: "Double-Sided 8.5x11 Property Flyer",
      status: "archived",
      isArchived: true,
      propertyAddress,
      category: "print",
      channel: "phone",
      callId: "12345"
    });

    // Simulate an incoming call replay or background sync for the same call
    const callPayload = {
      id: "12345",
      callerName: "Ryan Crecelius",
      propertyAddress,
      transcript: "Hi, I need a double-sided property flyer for 102 Water Street.",
      summary: "Property flyer request for 102 Water Street."
    };

    const conversionResult = convertCallToCanonicalMarketingRequest(callPayload);
    expect(conversionResult.tasks).toBeDefined();

    // The task should remain archived and no duplicate active task should be created
    const allTasksForAddress = getAllCanonicalMarketingTasks().filter(t => t.propertyAddress === propertyAddress);
    expect(allTasksForAddress.length).toBe(1);
    expect(allTasksForAddress[0].id).toBe(task.id);
    expect(allTasksForAddress[0].isArchived).toBe(true);
    expect(allTasksForAddress[0].status).toBe("archived");
  });

  it("3. Updating metadata on an archived task does NOT un-archive it", () => {
    const task = saveCanonicalMarketingTask({
      id: "task_test_arch_3",
      requestId: "req_test_arch_3",
      title: "Sign Post Installation",
      status: "archived",
      isArchived: true,
      propertyAddress: "104 Water Street, Wilmington NC"
    });

    // Adding an internal note
    const updatedWithNote = updateCanonicalMarketingTaskStatus(task.id, undefined, {
      note: "Coastal Sign Post confirms removal complete",
      performedBy: "Ann Gunn"
    });

    expect(updatedWithNote?.isArchived).toBe(true);
    expect(updatedWithNote?.status).toBe("archived");

    // Updating vendor info
    const updatedWithVendor = updateCanonicalMarketingTaskStatus(task.id, undefined, {
      vendorName: "Coastal Sign Post Co.",
      vendorNotes: "Work order closed",
      performedBy: "Ann Gunn"
    });

    expect(updatedWithVendor?.isArchived).toBe(true);
    expect(updatedWithVendor?.status).toBe("archived");
  });

  it("4. Explicit transition away from archived status un-archives properly", () => {
    const task = saveCanonicalMarketingTask({
      id: "task_test_arch_4",
      requestId: "req_test_arch_4",
      title: "Open House Kit",
      status: "archived",
      isArchived: true,
      propertyAddress: "106 Water Street, Wilmington NC"
    });

    const unarchived = updateCanonicalMarketingTaskStatus(task.id, "in_progress", {
      performedBy: "Melissa Gagliardi",
      note: "Re-opened upon agent request"
    });

    expect(unarchived?.isArchived).toBe(false);
    expect(unarchived?.status).toBe("in_progress");
    expect(unarchived?.archivedAt).toBeUndefined();
  });

  it("5. Bulk archive marks selected tasks archived and cascades to parent request if all are archived", () => {
    const req = saveCanonicalMarketingRequest({
      id: "req_bulk_1",
      title: "108 Water Street, Wilmington NC",
      propertyAddress: "108 Water Street, Wilmington NC",
      status: "in_progress",
      isArchived: false,
      taskIds: ["task_bulk_1a", "task_bulk_1b"]
    });

    const task1 = saveCanonicalMarketingTask({
      id: "task_bulk_1a",
      requestId: req.id,
      title: "Flyer",
      status: "in_progress",
      isArchived: false
    });

    const task2 = saveCanonicalMarketingTask({
      id: "task_bulk_1b",
      requestId: req.id,
      title: "Social Graphic",
      status: "in_progress",
      isArchived: false
    });

    const bulkResult = performBulkTaskAction(["task_bulk_1a", "task_bulk_1b"], "archive", {
      performedBy: "Melissa Gagliardi"
    });

    expect(bulkResult.success).toBe(true);
    expect(bulkResult.affectedCount).toBe(2);

    const reloadedReq = getAllCanonicalMarketingRequests().find(r => r.id === req.id);
    expect(reloadedReq?.isArchived).toBe(true);

    const reloadedTasks = getAllCanonicalMarketingTasks().filter(t => t.requestId === req.id);
    expect(reloadedTasks.every(t => t.isArchived && t.status === "archived")).toBe(true);
  });

  it("6. Inbound call whose request/task was purged does NOT resurrect tasks when re-evaluated", async () => {
    const { saveTelephonyCallAsync } = await import("../../server/persistence/telephonyCallsRepository.js");
    const callId = `call_test_purged_${Date.now()}`;
    
    // Save call with canonicalRequestId already set in telephony ledger
    await saveTelephonyCallAsync({
      id: callId,
      workspaceId: 'ws_wilmington',
      callerName: 'Marcus Aman',
      canonicalRequestId: `req_purged_${callId}`,
      canonicalTaskId: `task_purged_${callId}_0`
    });

    // Attempt to convert call again (e.g. background sync or refresh)
    const callPayload = {
      id: callId,
      callerName: 'Marcus Aman',
      propertyAddress: '999 Purged Blvd, Wilmington NC',
      transcript: 'I need a property flyer for 999 Purged Blvd.',
      canonicalRequestId: `req_purged_${callId}`
    };

    const res = convertCallToCanonicalMarketingRequest(callPayload);
    expect(res.shouldCreate).toBe(false);
    expect(res.suppressed).toBe(true);
    expect(res.suppressionReason).toContain('CALL_ALREADY_');

    // Verify no tasks were created in memory
    const tasks = getAllCanonicalMarketingTasks().filter(t => t.propertyAddress?.includes('999 Purged Blvd'));
    expect(tasks.length).toBe(0);
  });
});
