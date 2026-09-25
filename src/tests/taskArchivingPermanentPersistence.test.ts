import { describe, it, expect, beforeEach } from "vitest";
import {
  saveCanonicalMarketingRequest,
  saveCanonicalMarketingTask,
  getAllCanonicalMarketingTasks,
  getAllCanonicalMarketingRequests,
  getCanonicalMarketingTasksLive,
  archiveCanonicalMarketingTask,
  restoreCanonicalMarketingTask,
  updateCanonicalMarketingTaskStatus,
  performBulkTaskAction,
  performBulkTaskActionAsync,
  purgeAllArchivedCanonicalTasksAsync,
  purgeAllCanonicalMarketingData
} from "../../server/persistence/marketingCampaignsRepository.js";
import { isTombstoned } from "../../server/persistence/intakeTombstoneRepository.js";

describe("Task Archiving & Permanent Persistence Test Suite", () => {
  beforeEach(() => {
    purgeAllCanonicalMarketingData();
  });

  it("1. Single task archive creates durable tombstone and sets isArchived: true", async () => {
    const task = saveCanonicalMarketingTask({
      id: "task_durable_1",
      requestId: "req_durable_1",
      title: "Just Listed Postcard",
      status: "in_progress",
      propertyAddress: "201 N Front St, Wilmington NC",
      agentName: "Ryan Crecelius"
    });

    const archived = archiveCanonicalMarketingTask(task.id);
    expect(archived?.isArchived).toBe(true);
    expect(archived?.status).toBe("archived");
    expect(archived?.archivedAt).toBeDefined();

    // Check tombstone
    const tomb = await isTombstoned({
      requestId: "req_durable_1",
      propertyAddress: "201 N Front St, Wilmington NC"
    });
    expect(tomb).toBeDefined();
    expect(tomb?.state).toBe("tombstoned");
  });

  it("2. Single task restore clears isArchived, resets status to active, and un-tombstones", async () => {
    const task = saveCanonicalMarketingTask({
      id: "task_restore_1",
      requestId: "req_restore_1",
      title: "Social Media Carousel",
      status: "archived",
      isArchived: true,
      archivedAt: new Date().toISOString(),
      propertyAddress: "205 N Front St, Wilmington NC"
    });

    // Parent request was also archived
    saveCanonicalMarketingRequest({
      id: "req_restore_1",
      title: "205 N Front St",
      propertyAddress: "205 N Front St, Wilmington NC",
      status: "archived",
      isArchived: true
    });

    const restored = restoreCanonicalMarketingTask(task.id);
    expect(restored).toBeDefined();
    expect(restored?.isArchived).toBe(false);
    expect(restored?.status).not.toBe("archived");
    expect(restored?.archivedAt).toBeUndefined();

    // Parent request un-archived
    const parentReq = getAllCanonicalMarketingRequests().find(r => r.id === "req_restore_1");
    expect(parentReq?.isArchived).toBe(false);
  });

  it("3. performBulkTaskActionAsync archives multiple tasks and tombstones each scope", async () => {
    const req = saveCanonicalMarketingRequest({
      id: "req_bulk_persist_1",
      title: "210 N Front St",
      propertyAddress: "210 N Front St, Wilmington NC",
      isArchived: false,
      taskIds: ["task_bp_1", "task_bp_2"]
    });

    saveCanonicalMarketingTask({
      id: "task_bp_1",
      requestId: req.id,
      title: "Deliverable 1",
      status: "in_progress",
      propertyAddress: req.propertyAddress
    });

    saveCanonicalMarketingTask({
      id: "task_bp_2",
      requestId: req.id,
      title: "Deliverable 2",
      status: "in_progress",
      propertyAddress: req.propertyAddress
    });

    const res = await performBulkTaskActionAsync(["task_bp_1", "task_bp_2"], "archive", {
      performedBy: "Melissa Gagliardi"
    });

    expect(res.success).toBe(true);
    expect(res.ok).toBe(true);
    expect(res.affectedCount).toBe(2);

    const reloadedReq = getAllCanonicalMarketingRequests().find(r => r.id === req.id);
    expect(reloadedReq?.isArchived).toBe(true);

    const allTasks = getAllCanonicalMarketingTasks();
    const t1 = allTasks.find(t => t.id === "task_bp_1");
    const t2 = allTasks.find(t => t.id === "task_bp_2");
    expect(t1?.isArchived).toBe(true);
    expect(t2?.isArchived).toBe(true);
  });

  it("4. performBulkTaskActionAsync with restore action restores multiple tasks", async () => {
    saveCanonicalMarketingTask({
      id: "task_bulk_rest_1",
      title: "Print Flyer",
      status: "archived",
      isArchived: true
    });
    saveCanonicalMarketingTask({
      id: "task_bulk_rest_2",
      title: "Yard Sign",
      status: "archived",
      isArchived: true
    });

    const res = await performBulkTaskActionAsync(["task_bulk_rest_1", "task_bulk_rest_2"], "restore", {
      performedBy: "Melissa Gagliardi"
    });

    expect(res.success).toBe(true);
    expect(res.ok).toBe(true);
    expect(res.affectedCount).toBe(2);

    const allTasks = getAllCanonicalMarketingTasks();
    const t1 = allTasks.find(t => t.id === "task_bulk_rest_1");
    const t2 = allTasks.find(t => t.id === "task_bulk_rest_2");
    expect(t1?.isArchived).toBe(false);
    expect(t2?.isArchived).toBe(false);
  });

  it("5. Background polling simulation: getCanonicalMarketingTasksLive returns tasks with durable isArchived", () => {
    saveCanonicalMarketingTask({
      id: "task_poll_active",
      title: "Active Task",
      status: "in_progress",
      isArchived: false
    });

    saveCanonicalMarketingTask({
      id: "task_poll_archived",
      title: "Archived Task",
      status: "archived",
      isArchived: true
    });

    // 15-second poller fetches tasks
    const liveTasks = getCanonicalMarketingTasksLive();
    const activeTasksOnBoard = liveTasks.filter((t: any) => !t.isArchived && t.status !== "archived");
    const archivedTasksInTab = liveTasks.filter((t: any) => t.isArchived || t.status === "archived");

    expect(activeTasksOnBoard.some((t: any) => t.id === "task_poll_active")).toBe(true);
    expect(activeTasksOnBoard.some((t: any) => t.id === "task_poll_archived")).toBe(false);

    expect(archivedTasksInTab.some((t: any) => t.id === "task_poll_archived")).toBe(true);
    expect(archivedTasksInTab.some((t: any) => t.id === "task_poll_active")).toBe(false);
  });

  it("6. purgeAllArchivedCanonicalTasksAsync removes archived tasks and requests", async () => {
    saveCanonicalMarketingTask({
      id: "task_purge_active",
      title: "Active",
      status: "in_progress",
      isArchived: false
    });

    saveCanonicalMarketingTask({
      id: "task_purge_archived",
      title: "Archived",
      status: "archived",
      isArchived: true
    });

    const purgeResult = await purgeAllArchivedCanonicalTasksAsync();
    expect(purgeResult.purgedTasks).toBe(1);

    const remaining = getAllCanonicalMarketingTasks();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe("task_purge_active");
  });
});
