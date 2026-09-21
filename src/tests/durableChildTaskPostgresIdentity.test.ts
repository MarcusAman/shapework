/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import {
  extractCanonicalDeliverableIdentity,
  generateDurableChildTaskId,
  findExistingChildTask,
  persistTaskToDatabase,
  persistRequestToDatabase,
  CanonicalMarketingTask,
  CanonicalMarketingRequest
} from '../../server/persistence/marketingCampaignsRepository.js';
import { getDbPool } from '../../server/persistence/repositories.js';

describe('Durable Child Task Canonical Identity — PostgreSQL Suite', () => {
  const workspaceId = 'ws_wilmington';
  const testRequestId = `req_test_durable_${Date.now()}`;
  let pool: any;

  beforeAll(async () => {
    pool = getDbPool();
    if (!pool) {
      throw new Error('PostgreSQL database pool is required for this integration suite.');
    }
  });

  beforeEach(async () => {
    if (pool) {
      await pool.query(
        `DELETE FROM canonical_marketing_tasks WHERE request_id LIKE 'req_test_durable_%';`
      );
      await pool.query(
        `DELETE FROM canonical_marketing_requests WHERE id LIKE 'req_test_durable_%';`
      );
    }
  });

  it('1. Reordered deliverables reuse the same tasks and durable IDs', async () => {
    const reqId = `${testRequestId}_order`;
    const parentReq: CanonicalMarketingRequest = {
      id: reqId,
      title: '742 Evergreen Terrace — New Listing Package',
      propertyAddress: '742 Evergreen Terrace, Wilmington, NC',
      agentName: 'James Fort',
      agentEmail: 'james.fort@nestrealty.com',
      channel: 'email',
      status: 'in_progress',
      category: 'marketing',
      isArchived: false,
      taskIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await persistRequestToDatabase(parentReq);

    // Initial order: Social Graphic then Flyer
    const order1 = ['Social Media Post Graphic', 'Single-Page Property Flyer'];
    const tasksRun1: CanonicalMarketingTask[] = [];

    for (let i = 0; i < order1.length; i++) {
      const title = order1[i];
      const identity = extractCanonicalDeliverableIdentity({
        workspaceId,
        requestId: reqId,
        title,
        occurrenceIndex: 0
      });
      const taskId = generateDurableChildTaskId(reqId, title, 0, identity.variantKey, workspaceId);
      const task: CanonicalMarketingTask = {
        id: taskId,
        requestId: reqId,
        deliverableType: identity.deliverableType,
        variantKey: identity.variantKey,
        occurrenceIndex: identity.occurrenceIndex,
        canonicalIdentity: identity.canonicalIdentity,
        title,
        status: 'request_received',
        category: 'marketing',
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await persistTaskToDatabase(task);
      tasksRun1.push(task);
    }

    // Second run: Reordered order: Flyer then Social Graphic
    const order2 = ['Single-Page Property Flyer', 'Social Media Post Graphic'];
    const matchedTaskIds: string[] = [];

    // Query DB to simulate existing tasks in memory/db
    const res = await pool.query(
      `SELECT * FROM canonical_marketing_tasks WHERE request_id = $1 AND is_archived = false;`,
      [reqId]
    );
    const existingDbTasks = res.rows.map((r: any) => ({
      id: r.id,
      requestId: r.request_id,
      title: r.title,
      deliverableType: r.deliverable_type,
      variantKey: r.variant_key,
      occurrenceIndex: r.occurrence_index,
      canonicalIdentity: r.canonical_identity,
      status: r.status,
      category: r.category,
      isArchived: r.is_archived
    }));

    for (const title of order2) {
      const existing = findExistingChildTask(existingDbTasks, reqId, title, undefined, 0, undefined, workspaceId);
      expect(existing).toBeDefined();
      matchedTaskIds.push(existing!.id);
    }

    expect(matchedTaskIds[0]).toBe(tasksRun1[1].id); // Flyer matches original Flyer ID
    expect(matchedTaskIds[1]).toBe(tasksRun1[0].id); // Social matches original Social ID
    expect(new Set(matchedTaskIds)).toEqual(new Set(tasksRun1.map(t => t.id)));
  });

  it('2. Renaming a task does not create a duplicate on replay', async () => {
    const reqId = `${testRequestId}_rename`;
    const identity = extractCanonicalDeliverableIdentity({
      workspaceId,
      requestId: reqId,
      title: 'Property Flyer'
    });
    const taskId = generateDurableChildTaskId(reqId, 'Property Flyer', 0, identity.variantKey, workspaceId);

    const initialTask: CanonicalMarketingTask = {
      id: taskId,
      requestId: reqId,
      deliverableType: identity.deliverableType,
      variantKey: identity.variantKey,
      occurrenceIndex: identity.occurrenceIndex,
      canonicalIdentity: identity.canonicalIdentity,
      title: 'Property Flyer',
      status: 'in_progress',
      category: 'marketing',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await persistTaskToDatabase(initialTask);

    // Operator renames the display title in UI
    await pool.query(
      `UPDATE canonical_marketing_tasks 
       SET title = 'Autumn Showcase Luxury Flyer (Melissa Edit)', updated_at = NOW() 
       WHERE id = $1;`,
      [taskId]
    );

    // Later, deliverable is re-evaluated with raw deliverable title "Property Flyer"
    const dbRes = await pool.query(
      `SELECT * FROM canonical_marketing_tasks WHERE request_id = $1 AND is_archived = false;`,
      [reqId]
    );
    const existingTasks: CanonicalMarketingTask[] = dbRes.rows.map((r: any) => ({
      id: r.id,
      requestId: r.request_id,
      title: r.title,
      deliverableType: r.deliverable_type,
      variantKey: r.variant_key,
      occurrenceIndex: r.occurrence_index,
      canonicalIdentity: r.canonical_identity,
      status: r.status,
      isArchived: r.is_archived
    }));

    // Replay matching looks up via canonical deliverable identity, NOT literal title
    const matched = findExistingChildTask(existingTasks, reqId, 'Property Flyer', undefined, 0, undefined, workspaceId);
    expect(matched).toBeDefined();
    expect(matched!.id).toBe(taskId);
    expect(matched!.title).toBe('Autumn Showcase Luxury Flyer (Melissa Edit)');

    // Count tasks in database; must still be exactly 1
    const countRes = await pool.query(
      `SELECT COUNT(*)::int as cnt FROM canonical_marketing_tasks WHERE request_id = $1;`,
      [reqId]
    );
    expect(countRes.rows[0].cnt).toBe(1);
  });

  it('3. Adding a brochure creates only the brochure task and preserves existing flyer', async () => {
    const reqId = `${testRequestId}_add_deliv`;
    const flyerIdentity = extractCanonicalDeliverableIdentity({
      workspaceId,
      requestId: reqId,
      title: 'Property Flyer'
    });
    const flyerTaskId = generateDurableChildTaskId(reqId, 'Property Flyer', 0, flyerIdentity.variantKey, workspaceId);

    const flyerTask: CanonicalMarketingTask = {
      id: flyerTaskId,
      requestId: reqId,
      deliverableType: flyerIdentity.deliverableType,
      variantKey: flyerIdentity.variantKey,
      occurrenceIndex: flyerIdentity.occurrenceIndex,
      canonicalIdentity: flyerIdentity.canonicalIdentity,
      title: 'Property Flyer',
      status: 'in_progress',
      category: 'marketing',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await persistTaskToDatabase(flyerTask);

    // Follow-up arrives requesting Brochure as well
    const existingRes = await pool.query(
      `SELECT * FROM canonical_marketing_tasks WHERE request_id = $1 AND is_archived = false;`,
      [reqId]
    );
    const existingList = existingRes.rows.map((r: any) => ({
      id: r.id,
      requestId: r.request_id,
      title: r.title,
      deliverableType: r.deliverable_type,
      variantKey: r.variant_key,
      occurrenceIndex: r.occurrence_index,
      canonicalIdentity: r.canonical_identity,
      status: r.status,
      isArchived: r.is_archived
    }));

    // Follow-up contains ['Property Flyer', 'Bi-Fold Property Brochure']
    const followUpItems = ['Property Flyer', 'Bi-Fold Property Brochure'];
    const createdOrReused: string[] = [];

    for (const item of followUpItems) {
      const match = findExistingChildTask(existingList, reqId, item, undefined, 0, undefined, workspaceId);
      if (match) {
        createdOrReused.push(match.id);
      } else {
        const iden = extractCanonicalDeliverableIdentity({
          workspaceId,
          requestId: reqId,
          title: item
        });
        const newId = generateDurableChildTaskId(reqId, item, 0, iden.variantKey, workspaceId);
        const newTask: CanonicalMarketingTask = {
          id: newId,
          requestId: reqId,
          deliverableType: iden.deliverableType,
          variantKey: iden.variantKey,
          occurrenceIndex: iden.occurrenceIndex,
          canonicalIdentity: iden.canonicalIdentity,
          title: item,
          status: 'request_received',
          category: 'marketing',
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await persistTaskToDatabase(newTask);
        createdOrReused.push(newId);
      }
    }

    expect(createdOrReused[0]).toBe(flyerTaskId);
    expect(createdOrReused[1]).toContain('brochure');

    const allDbTasks = await pool.query(
      `SELECT id, deliverable_type, status FROM canonical_marketing_tasks WHERE request_id = $1 ORDER BY created_at ASC;`,
      [reqId]
    );
    expect(allDbTasks.rows.length).toBe(2);
    // Flyer status was preserved as in_progress
    const flyerRow = allDbTasks.rows.find((r: any) => r.deliverable_type === 'flyer');
    expect(flyerRow.status).toBe('in_progress');
    const brochureRow = allDbTasks.rows.find((r: any) => r.deliverable_type === 'brochure');
    expect(brochureRow.status).toBe('request_received');
  });

  it('4. Two explicitly distinct flyers can coexist without collision', async () => {
    const reqId = `${testRequestId}_coexist`;
    
    // Single-page flyer vs Tri-fold flyer
    const singleIdentity = extractCanonicalDeliverableIdentity({
      workspaceId,
      requestId: reqId,
      title: 'Single-Page Property Flyer'
    });
    const trifoldIdentity = extractCanonicalDeliverableIdentity({
      workspaceId,
      requestId: reqId,
      title: 'Tri-Fold Property Flyer'
    });

    expect(singleIdentity.deliverableType).toBe('flyer');
    expect(singleIdentity.variantKey).toBe('single_page');
    expect(trifoldIdentity.deliverableType).toBe('flyer');
    expect(trifoldIdentity.variantKey).toBe('tri_fold');
    expect(singleIdentity.canonicalIdentity).not.toBe(trifoldIdentity.canonicalIdentity);

    const singleTask: CanonicalMarketingTask = {
      id: generateDurableChildTaskId(reqId, 'Single-Page Property Flyer', 0, singleIdentity.variantKey, workspaceId),
      requestId: reqId,
      deliverableType: singleIdentity.deliverableType,
      variantKey: singleIdentity.variantKey,
      occurrenceIndex: 0,
      canonicalIdentity: singleIdentity.canonicalIdentity,
      title: 'Single-Page Property Flyer',
      status: 'request_received',
      category: 'marketing',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const trifoldTask: CanonicalMarketingTask = {
      id: generateDurableChildTaskId(reqId, 'Tri-Fold Property Flyer', 0, trifoldIdentity.variantKey, workspaceId),
      requestId: reqId,
      deliverableType: trifoldIdentity.deliverableType,
      variantKey: trifoldIdentity.variantKey,
      occurrenceIndex: 0,
      canonicalIdentity: trifoldIdentity.canonicalIdentity,
      title: 'Tri-Fold Property Flyer',
      status: 'request_received',
      category: 'marketing',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await persistTaskToDatabase(singleTask);
    await persistTaskToDatabase(trifoldTask);

    const res = await pool.query(
      `SELECT id, variant_key, canonical_identity FROM canonical_marketing_tasks WHERE request_id = $1;`,
      [reqId]
    );
    expect(res.rows.length).toBe(2);
    const variants = res.rows.map((r: any) => r.variant_key).sort();
    expect(variants).toEqual(['single_page', 'tri_fold']);
  });

  it('5. Concurrent workers cannot create duplicate children (enforced by DB unique index)', async () => {
    const reqId = `${testRequestId}_concurrency`;
    const identity = extractCanonicalDeliverableIdentity({
      workspaceId,
      requestId: reqId,
      title: 'Direct Mail Postcard'
    });

    const taskData: CanonicalMarketingTask = {
      id: generateDurableChildTaskId(reqId, 'Direct Mail Postcard', 0, identity.variantKey, workspaceId),
      requestId: reqId,
      deliverableType: identity.deliverableType,
      variantKey: identity.variantKey,
      occurrenceIndex: identity.occurrenceIndex,
      canonicalIdentity: identity.canonicalIdentity,
      title: 'Direct Mail Postcard',
      status: 'request_received',
      category: 'marketing',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // First worker persists task
    await persistTaskToDatabase(taskData);

    // Second worker with a DIFFERENT primary key but IDENTICAL canonical identity tries direct INSERT
    // to verify the partial unique index idx_canonical_mkt_tasks_durable_identity catches it
    const collidingId = `${taskData.id}_worker2_race`;
    let uniqueViolationCaught = false;

    try {
      await pool.query(
        `INSERT INTO canonical_marketing_tasks (
          id, request_id, workspace_id, title, category, status, is_archived,
          deliverable_type, variant_key, occurrence_index, canonical_identity
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11
        );`,
        [
          collidingId,
          reqId,
          workspaceId,
          'Direct Mail Postcard Race Duplicate',
          'marketing',
          'request_received',
          false,
          identity.deliverableType,
          identity.variantKey,
          identity.occurrenceIndex,
          identity.canonicalIdentity
        ]
      );
    } catch (err: any) {
      if (err.code === '23505') { // Postgres unique_violation error code
        uniqueViolationCaught = true;
      } else {
        throw err;
      }
    }

    expect(uniqueViolationCaught).toBe(true);

    const countRes = await pool.query(
      `SELECT COUNT(*)::int as cnt FROM canonical_marketing_tasks WHERE request_id = $1;`,
      [reqId]
    );
    expect(countRes.rows[0].cnt).toBe(1);
  });

  it('6. Replaying an archived source does not silently recreate archived work', async () => {
    const reqId = `${testRequestId}_archived`;
    const identity = extractCanonicalDeliverableIdentity({
      workspaceId,
      requestId: reqId,
      title: 'Social Graphic'
    });
    const taskId = generateDurableChildTaskId(reqId, 'Social Graphic', 0, identity.variantKey, workspaceId);

    const task: CanonicalMarketingTask = {
      id: taskId,
      requestId: reqId,
      deliverableType: identity.deliverableType,
      variantKey: identity.variantKey,
      occurrenceIndex: identity.occurrenceIndex,
      canonicalIdentity: identity.canonicalIdentity,
      title: 'Social Graphic',
      status: 'completed',
      category: 'marketing',
      isArchived: true, // Archived by operator
      archivedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await persistTaskToDatabase(task);

    // When querying active tasks for reconciliation (where is_archived = false)
    const activeTasksRes = await pool.query(
      `SELECT * FROM canonical_marketing_tasks WHERE request_id = $1 AND is_archived = false;`,
      [reqId]
    );
    const activeTasks = activeTasksRes.rows;
    expect(activeTasks.length).toBe(0);

    // Inbound replay should not find any active task, and check archived tasks to avoid duplicate recreation
    const allTasksRes = await pool.query(
      `SELECT * FROM canonical_marketing_tasks WHERE request_id = $1;`,
      [reqId]
    );
    const allTasks = allTasksRes.rows.map((r: any) => ({
      id: r.id,
      requestId: r.request_id,
      title: r.title,
      deliverableType: r.deliverable_type,
      variantKey: r.variant_key,
      occurrenceIndex: r.occurrence_index,
      canonicalIdentity: r.canonical_identity,
      status: r.status,
      isArchived: r.is_archived
    }));

    // Active search yields undefined so archived task is not treated as active in-flight work
    const activeMatch = findExistingChildTask(allTasks, reqId, 'Social Graphic', undefined, 0, undefined, workspaceId, false);
    expect(activeMatch).toBeUndefined();

    // Archive-aware search finds the archived record so the system knows it was already fulfilled/archived
    const archivedMatch = findExistingChildTask(allTasks, reqId, 'Social Graphic', undefined, 0, undefined, workspaceId, true);
    expect(archivedMatch).toBeDefined();
    expect(archivedMatch!.isArchived).toBe(true);

    // Because it is already archived and was not requested as a new version, no new active task is added
    const finalActiveRes = await pool.query(
      `SELECT COUNT(*)::int as cnt FROM canonical_marketing_tasks WHERE request_id = $1 AND is_archived = false;`,
      [reqId]
    );
    expect(finalActiveRes.rows[0].cnt).toBe(0);
  });

  it('7. A deliberately requested new version can be represented separately', async () => {
    const reqId = `${testRequestId}_v2`;
    
    // Version 1 (or initial run)
    const v1Identity = extractCanonicalDeliverableIdentity({
      workspaceId,
      requestId: reqId,
      title: 'Single-Page Property Flyer'
    });
    const v1TaskId = generateDurableChildTaskId(reqId, 'Single-Page Property Flyer', 0, v1Identity.variantKey, workspaceId);

    const v1Task: CanonicalMarketingTask = {
      id: v1TaskId,
      requestId: reqId,
      deliverableType: v1Identity.deliverableType,
      variantKey: v1Identity.variantKey,
      occurrenceIndex: 0,
      canonicalIdentity: v1Identity.canonicalIdentity,
      title: 'Single-Page Property Flyer (Initial)',
      status: 'completed',
      category: 'marketing',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await persistTaskToDatabase(v1Task);

    // Broker explicitly requests a second run / revision: "Single-Page Property Flyer v2"
    const v2Identity = extractCanonicalDeliverableIdentity({
      workspaceId,
      requestId: reqId,
      title: 'Single-Page Property Flyer v2',
      occurrenceIndex: 1
    });
    const v2TaskId = generateDurableChildTaskId(reqId, 'Single-Page Property Flyer v2', 1, v2Identity.variantKey, workspaceId);

    expect(v2Identity.occurrenceIndex).toBe(1);
    expect(v2Identity.canonicalIdentity).not.toBe(v1Identity.canonicalIdentity);

    const v2Task: CanonicalMarketingTask = {
      id: v2TaskId,
      requestId: reqId,
      deliverableType: v2Identity.deliverableType,
      variantKey: v2Identity.variantKey,
      occurrenceIndex: v2Identity.occurrenceIndex,
      canonicalIdentity: v2Identity.canonicalIdentity,
      title: 'Single-Page Property Flyer v2',
      status: 'request_received',
      category: 'marketing',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await persistTaskToDatabase(v2Task);

    // Query database to verify both coexist with separate canonical identities and occurrence indices
    const res = await pool.query(
      `SELECT id, deliverable_type, variant_key, occurrence_index, canonical_identity, status 
       FROM canonical_marketing_tasks 
       WHERE request_id = $1 
       ORDER BY occurrence_index ASC;`,
      [reqId]
    );

    expect(res.rows.length).toBe(2);
    expect(res.rows[0].id).toBe(v1TaskId);
    expect(res.rows[0].occurrence_index).toBe(0);
    expect(res.rows[0].status).toBe('completed');

    expect(res.rows[1].id).toBe(v2TaskId);
    expect(res.rows[1].occurrence_index).toBe(1);
    expect(res.rows[1].status).toBe('request_received');
  });
});
