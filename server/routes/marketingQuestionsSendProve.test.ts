/**
 * Approve & Notify send-questions prove.
 * Root 400 was RECIPIENT_UNRESOLVED for Marcus Aman (tri-fold requester is not in
 * NEST_FULL_ROSTER_77). Valid https Drive proof + reviewer session must persist
 * proofUrl and leave awaiting_review without flipping outbound kill flags.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { marketingQuestionsRouter } from './marketingQuestionsRoute.js';
import { memoryOutbox } from '../services/inboundEmailIngestionEngine.js';
import { AskRequesterQuestionsModal } from '../../src/components/marketing/AskRequesterQuestionsModal.js';
import {
  getAllCanonicalMarketingTasks,
  getCanonicalMarketingTaskById,
  saveCanonicalMarketingTask,
} from '../persistence/marketingCampaignsRepository.js';
import type { Server } from 'http';

const TASK_ID = 'tsk_send_questions_prove_trifold';
const HTTPS_PROOF = 'https://drive.google.com/file/d/1AbCrealFile999xyz/view';
const STORE = path.join(process.cwd(), 'server/data/canonical_marketing_store_test.json');

describe('POST /api/marketing/requests/send-questions Approve & Notify', () => {
  let server: Server;
  let baseUrl: string;
  let storeSnapshot = '';
  const outboundMaster = process.env.OUTBOUND_MASTER_MODE;
  const outboundMode = process.env.OUTBOUND_MODE;
  const allowDispatch = process.env.ALLOW_EXTERNAL_DISPATCH;

  beforeAll(async () => {
    process.env.OUTBOUND_MASTER_MODE = 'hold';
    storeSnapshot = fs.existsSync(STORE) ? fs.readFileSync(STORE, 'utf8') : '';
    const app = express();
    app.use(express.json({ limit: '2mb' }));
    app.use(marketingQuestionsRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (outboundMaster === undefined) delete process.env.OUTBOUND_MASTER_MODE;
    else process.env.OUTBOUND_MASTER_MODE = outboundMaster;
    const items = getAllCanonicalMarketingTasks();
    const idx = items.findIndex((t) => t.id === TASK_ID);
    if (idx >= 0) items.splice(idx, 1);
    if (storeSnapshot) fs.writeFileSync(STORE, storeSnapshot);
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(() => {
    saveCanonicalMarketingTask({
      id: TASK_ID,
      title: 'Tri-fold brochure',
      status: 'in_progress',
      reviewState: 'awaiting_review',
      proofUrl: undefined,
      propertyAddress: '7174 Peachtree Way, Wilmington, NC 28403',
      agentName: 'Marcus Aman',
      agentEmail: 'marcus.aman@gmail.com',
      agentPhone: '(252) 717-0595',
      workspaceId: 'ws_wilmington',
      assignedTo: 'Eduardo Lovo',
      assignedToId: 'dir_eduardo_lovo_73',
      reviewOwnerId: 'dir_melissa_gagliardi_33',
      reviewOwnerName: 'Melissa Gagliardi',
    } as any);
  });

  function payload(overrides: Record<string, unknown> = {}) {
    return {
      campaignId: TASK_ID,
      taskId: TASK_ID,
      recipientName: 'Marcus Aman',
      recipientEmail: 'marcus.aman@gmail.com',
      recipientPhone: '(252) 717-0595',
      channels: ['email', 'sms'],
      message: 'Marcus, we have your requested marketing assets ready. Click the Google Drive link below to view.',
      selectedQuestions: ['delivery_ready'],
      propertyAddress: '7174 Peachtree Way, Wilmington, NC 28403',
      intent: 'delivery_complete',
      subject: 'Your marketing materials are ready — 7174 Peachtree Way',
      domain: 'marketing',
      workspaceId: 'ws_wilmington',
      proofUrl: HTTPS_PROOF,
      ...overrides,
    };
  }

  async function post(body: Record<string, unknown>, headers: Record<string, string> = {}) {
    const res = await fetch(`${baseUrl}/api/marketing/requests/send-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  it('still 400 RECIPIENT_UNRESOLVED when the requester is not in the directory', async () => {
    const res = await post(payload({
      recipientName: 'Nobody Special',
      recipientEmail: 'qa.unknown.agent@nestrealty.com',
      recipientPhone: undefined,
      channels: ['email'],
    }), { 'x-user-email': 'melissa.gagliardi@nestrealty.com' });
    expect(res.status).toBe(400);
    expect(res.data.code).toBe('RECIPIENT_UNRESOLVED');
    expect(res.data.error).toContain('Could not resolve a canonical directory record');
    const task = getCanonicalMarketingTaskById(TASK_ID);
    expect(task?.proofUrl || null).toBeFalsy();
    expect(task?.reviewState).toBe('awaiting_review');
  });

  it('400 INVALID_PROTOCOL for staged data: proof and does not update the task', async () => {
    const res = await post(payload({
      proofUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      channels: ['email'],
    }), { 'x-user-email': 'melissa.gagliardi@nestrealty.com' });
    expect(res.status).toBe(400);
    expect(res.data.code).toBe('INVALID_PROTOCOL');
    const task = getCanonicalMarketingTaskById(TASK_ID);
    expect(task?.proofUrl || null).toBeFalsy();
    expect(task?.reviewState).toBe('awaiting_review');
  });

  it('403 FORBIDDEN_NOT_TASK_REVIEWER for the assignee even with a valid https proof', async () => {
    const res = await post(payload(), { 'x-user-email': 'eduardo.lovo@nestrealty.com' });
    expect(res.status).toBe(403);
    expect(res.data.code).toBe('FORBIDDEN_NOT_TASK_REVIEWER');
    const task = getCanonicalMarketingTaskById(TASK_ID);
    expect(task?.proofUrl || null).toBeFalsy();
    expect(task?.reviewState).toBe('awaiting_review');
  });

  it('succeeds for https Drive proof + Melissa reviewer without flipping outbound kill flags', async () => {
    const beforeKeys = new Set(memoryOutbox.keys());
    const res = await post(payload(), { 'x-user-email': 'melissa.gagliardi@nestrealty.com' });
    expect(res.status, JSON.stringify(res.data)).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.persisted).toBe(true);
    expect(res.data.code).not.toBe('RECIPIENT_UNRESOLVED');
    expect(res.data.task?.proofUrl).toBe(HTTPS_PROOF);
    expect(res.data.task?.reviewState).not.toBe('awaiting_review');
    expect(res.data.task?.reviewState).toBe('approved');

    const task = getCanonicalMarketingTaskById(TASK_ID);
    expect(task?.proofUrl).toBe(HTTPS_PROOF);
    expect(task?.reviewState).toBe('approved');

    expect(process.env.OUTBOUND_MASTER_MODE).toBe('hold');
    expect(process.env.OUTBOUND_MODE).toBe(outboundMode);
    expect(process.env.ALLOW_EXTERNAL_DISPATCH).toBe(allowDispatch);
    expect(res.data.dispatchHeld).toBe(true);
    const created = [...memoryOutbox.entries()].filter(([key]) => !beforeKeys.has(key));
    expect(created.length).toBe(1);
    expect(created[0][1].recipient).toBe('marcus.aman@gmail.com');
  });

  it('does not 400 when Drive is empty, and a pasted https proof stays valid', async () => {
    const beforeKeys = new Set(memoryOutbox.keys());
    const empty = await post(payload({ proofUrl: undefined, driveFolderUrl: undefined }), {
      'x-user-email': 'melissa.gagliardi@nestrealty.com',
    });
    expect(empty.status, JSON.stringify(empty.data)).toBe(200);
    expect(empty.data.code).not.toBe('INVALID_PROTOCOL');
    expect(getCanonicalMarketingTaskById(TASK_ID)?.reviewState).not.toBe('awaiting_review');
    const emptyRows = [...memoryOutbox.entries()].filter(([key]) => !beforeKeys.has(key));
    expect(emptyRows.every(([, row]) => row.recipient === 'marcus.aman@gmail.com')).toBe(true);

    saveCanonicalMarketingTask({
      id: TASK_ID,
      title: 'Tri-fold brochure',
      status: 'in_progress',
      reviewState: 'awaiting_review',
      proofUrl: undefined,
      propertyAddress: '7174 Peachtree Way, Wilmington, NC 28403',
      agentName: 'Marcus Aman',
      agentEmail: 'marcus.aman@gmail.com',
      workspaceId: 'ws_wilmington',
      reviewOwnerId: 'dir_melissa_gagliardi_33',
      reviewOwnerName: 'Melissa Gagliardi',
    } as any);
    const pasted = await post(payload({ driveFolderUrl: undefined, proofUrl: HTTPS_PROOF }), {
      'x-user-email': 'melissa.gagliardi@nestrealty.com',
    });
    expect(pasted.status, JSON.stringify(pasted.data)).toBe(200);
    expect(pasted.data.task?.proofUrl).toBe(HTTPS_PROOF);
  });

  it('drops the prove Gmail when outbound kill-off is restored to live', async () => {
    process.env.OUTBOUND_MASTER_MODE = 'live';
    try {
      const res = await post(payload(), { 'x-user-email': 'melissa.gagliardi@nestrealty.com' });
      expect(res.status).toBe(400);
      expect(res.data.code).toBe('RECIPIENT_UNRESOLVED');
    } finally {
      process.env.OUTBOUND_MASTER_MODE = 'hold';
    }
  });

  it('shows Allowlisted (prove) and never Verified Contact for the directory-miss To', () => {
    const proveHtml = renderToStaticMarkup(
      React.createElement(AskRequesterQuestionsModal, {
        isOpen: true,
        onClose: () => {},
        campaign: {
          id: TASK_ID,
          agentName: 'Marcus Aman',
          agentEmail: 'marcus.aman@gmail.com',
          phone: '(252) 717-0595',
          propertyAddress: '7174 Peachtree Way',
        },
      })
    );
    expect(proveHtml).toContain('Allowlisted (prove)');
    expect(proveHtml).not.toContain('Verified Contact');

    const directoryHtml = renderToStaticMarkup(
      React.createElement(AskRequesterQuestionsModal, {
        isOpen: true,
        onClose: () => {},
        campaign: {
          id: 'camp_matt',
          agentName: 'Matt Orr',
          agentEmail: 'matt.orr@nestrealty.com',
          phone: '(910) 612-8283',
          propertyAddress: '100 Matt Way',
        },
      })
    );
    expect(directoryHtml).toContain('Verified Contact');
    expect(directoryHtml).not.toContain('Allowlisted (prove)');
  });
});
