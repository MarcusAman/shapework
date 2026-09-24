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
import { WorkspaceTaskDrawer } from '../../src/components/marketing/WorkspaceTaskDrawer.js';
import { confirmRequesterWrite } from '../../src/lib/confirmRequesterWrite.js';
import { DISPATCH_REASON } from '../services/evaluateDispatch.js';
import { resolveServerCanonicalRecipient } from '../services/canonicalRecipientService.js';
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
    expect(res.data.reason).toBe(DISPATCH_REASON.recipient);
    expect(res.data.error).toBe(DISPATCH_REASON.recipient);
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

  it('blocks an empty Drive with no file, and a pasted https proof stays valid', async () => {
    const beforeKeys = new Set(memoryOutbox.keys());
    const empty = await post(payload({ proofUrl: undefined, driveFolderUrl: undefined }), {
      'x-user-email': 'melissa.gagliardi@nestrealty.com',
    });
    expect(empty.status, JSON.stringify(empty.data)).toBe(400);
    expect(empty.data.reason).toBe(DISPATCH_REASON.file);
    expect(empty.data.code).toBe('NO_SENDABLE_FILE');
    expect(getCanonicalMarketingTaskById(TASK_ID)?.reviewState).toBe('awaiting_review');
    const emptyRows = [...memoryOutbox.entries()].filter(([key]) => !beforeKeys.has(key));
    expect(emptyRows.length).toBe(0);

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
      expect(res.data.reason).toBe(DISPATCH_REASON.recipient);
    } finally {
      process.env.OUTBOUND_MASTER_MODE = 'hold';
    }
  });

  it('shows Allowlisted (prove) and never Verified Contact for the directory-miss To', () => {
    const proveHtml = renderToStaticMarkup(
      React.createElement(AskRequesterQuestionsModal, {
        isOpen: true,
        onClose: () => {},
        dispatchVerdict: {
          allowed: true,
          reason: '',
          recipientStatus: 'allowlisted_prove',
          recipientId: null,
          effectiveCc: [],
        },
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
    expect(proveHtml).toContain('data-send-ready="true"');
    expect(proveHtml).toContain('data-recipient-status="allowlisted_prove"');

    const directoryHtml = renderToStaticMarkup(
      React.createElement(AskRequesterQuestionsModal, {
        isOpen: true,
        onClose: () => {},
        dispatchVerdict: {
          allowed: true,
          reason: '',
          recipientStatus: 'directory',
          recipientId: 'dir_matt_orr',
          effectiveCc: ['melissa.gagliardi@nestrealty.com'],
        },
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

  async function postCheck(body: Record<string, unknown>, headers: Record<string, string> = {}) {
    const res = await fetch(`${baseUrl}/api/marketing/requests/${TASK_ID}/dispatch-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  it('dispatch-check matches send-questions on the five blocks and the allowed prove', async () => {
    const melissa = { 'x-user-email': 'melissa.gagliardi@nestrealty.com' };
    const cases: Array<{
      name: string;
      headers: Record<string, string>;
      body: Record<string, unknown>;
      mode?: string;
      allowed: boolean;
      reason: string;
      status: number;
      recipientStatus?: string;
    }> = [
      {
        name: 'wrong role',
        headers: { 'x-user-email': 'eduardo.lovo@nestrealty.com' },
        body: payload(),
        allowed: false,
        reason: DISPATCH_REASON.role,
        status: 403,
      },
      {
        name: 'proof not https',
        headers: melissa,
        body: payload({ proofUrl: 'data:image/png;base64,iVBORw0KGgo=' }),
        allowed: false,
        reason: DISPATCH_REASON.proof,
        status: 400,
      },
      {
        name: 'no drive and no file',
        headers: melissa,
        body: payload({ proofUrl: undefined, driveFolderUrl: undefined }),
        allowed: false,
        reason: DISPATCH_REASON.file,
        status: 400,
      },
      {
        name: 'recipient not allowed',
        headers: melissa,
        body: payload({
          recipientName: 'Random Person',
          recipientEmail: 'random.person@gmail.com',
          recipientPhone: undefined,
          channels: ['email'],
        }),
        allowed: false,
        reason: DISPATCH_REASON.recipient,
        status: 400,
      },
      {
        name: 'outbound off',
        headers: melissa,
        body: payload({
          recipientName: 'Eduardo Lovo',
          recipientEmail: 'eduardo.lovo@nestrealty.com',
          recipientPhone: undefined,
          channels: ['email'],
        }),
        mode: 'disabled',
        allowed: false,
        reason: DISPATCH_REASON.outbound,
        status: 400,
      },
      {
        name: 'allowlisted marcus',
        headers: melissa,
        body: payload(),
        allowed: true,
        reason: '',
        status: 200,
        recipientStatus: 'allowlisted_prove',
      },
    ];

    for (const row of cases) {
      if (row.mode) process.env.OUTBOUND_MASTER_MODE = row.mode;
      else process.env.OUTBOUND_MASTER_MODE = 'hold';
      try {
        const check = await postCheck(row.body, row.headers);
        const send = await post(row.body, row.headers);
        expect(check.data.allowed, row.name).toBe(row.allowed);
        expect(check.data.reason, row.name).toBe(row.reason);
        expect(send.status, `${row.name} ${JSON.stringify(send.data)}`).toBe(row.status);
        expect(send.data.allowed, row.name).toBe(row.allowed);
        expect(send.data.gateReason ?? send.data.reason, row.name).toBe(check.data.reason);
        expect(send.data.reason === check.data.reason || send.data.gateReason === check.data.reason, row.name).toBe(true);
        if (row.recipientStatus) {
          expect(check.data.recipientStatus).toBe(row.recipientStatus);
          expect(check.data.effectiveTo).toEqual(['marcus.aman@gmail.com']);
          expect(check.data.effectiveCc).toEqual([]);
        }
      } finally {
        process.env.OUTBOUND_MASTER_MODE = 'hold';
      }
    }
  });

  it('hold outbox to/cc deep-equal dispatch-check effectiveTo and effectiveCc', async () => {
    const melissa = { 'x-user-email': 'melissa.gagliardi@nestrealty.com' };
    const check = await postCheck(payload(), melissa);
    expect(check.data.allowed).toBe(true);
    expect(check.data.effectiveTo).toEqual(['marcus.aman@gmail.com']);
    expect(check.data.effectiveCc).toEqual([]);

    for (const key of [...memoryOutbox.keys()]) {
      if (String(key).includes(TASK_ID)) memoryOutbox.delete(key);
    }
    const before = new Set(memoryOutbox.keys());
    const send = await post(payload(), melissa);
    expect(send.status, JSON.stringify(send.data)).toBe(200);
    expect(process.env.OUTBOUND_MASTER_MODE).toBe('hold');
    const created = [...memoryOutbox.entries()].filter(([key]) => !before.has(key));
    expect(created.length).toBe(1);
    expect(created[0][1].to).toEqual(check.data.effectiveTo);
    expect(created[0][1].cc).toEqual(check.data.effectiveCc);
    expect(created[0][1].payload.to).toEqual(check.data.effectiveTo);
    expect(created[0][1].payload.cc).toEqual(check.data.effectiveCc);
  });

  it('drops every @nestrealty.com address from effectiveTo and effectiveCc while the prove allowlist is active', async () => {
    expect(process.env.OUTBOUND_MASTER_MODE).toBe('hold');
    const melissa = { 'x-user-email': 'melissa.gagliardi@nestrealty.com' };
    const bodies = [
      payload(),
      payload({
        recipientName: 'Eduardo Lovo',
        recipientEmail: 'eduardo.lovo@nestrealty.com',
        recipientPhone: undefined,
        channels: ['email'],
        ccEmails: ['melissa.gagliardi@nestrealty.com', 'dawn@nestrealty.com'],
      }),
      payload({ ccEmails: ['someone@nestrealty.com'] }),
    ];
    for (const body of bodies) {
      const check = await postCheck(body, melissa);
      const lists = [...(check.data.effectiveTo || []), ...(check.data.effectiveCc || [])];
      expect(
        lists.some((email: string) => String(email).toLowerCase().endsWith('@nestrealty.com')),
        JSON.stringify({ to: check.data.effectiveTo, cc: check.data.effectiveCc })
      ).toBe(false);
    }
  });

  it('drops Melissa CC while the allowlist is active and keeps it for a directory recipient in prod', async () => {
    const melissa = { 'x-user-email': 'melissa.gagliardi@nestrealty.com' };
    const held = await postCheck(payload(), melissa);
    expect(held.data.allowed).toBe(true);
    expect(held.data.recipientStatus).toBe('allowlisted_prove');
    expect(held.data.effectiveCc).not.toContain('melissa.gagliardi@nestrealty.com');

    const appMode = process.env.APP_MODE;
    process.env.APP_MODE = 'production';
    try {
      const prod = await postCheck(payload({
        recipientName: 'Eduardo Lovo',
        recipientEmail: 'eduardo.lovo@nestrealty.com',
        recipientPhone: undefined,
        channels: ['email'],
      }), melissa);
      expect(prod.data.recipientStatus, JSON.stringify(prod.data)).toBe('directory');
      expect(prod.data.effectiveCc).toContain('melissa.gagliardi@nestrealty.com');
      expect(prod.data.allowed).toBe(true);
    } finally {
      if (appMode === undefined) delete process.env.APP_MODE;
      else process.env.APP_MODE = appMode;
    }
  });

  it('keeps a Nest roster person on the directory and does not mint Marcus', async () => {
    const eduardo = await resolveServerCanonicalRecipient({ requesterEmail: 'eduardo.lovo@nestrealty.com' });
    expect(eduardo?.id).toBe('dir_eduardo_lovo_73');
    const marcus = await resolveServerCanonicalRecipient({
      requesterEmail: 'marcus.aman@gmail.com',
      requesterName: 'Marcus Aman',
      requesterId: 'dir_marcus_aman',
    });
    expect(marcus).toBeNull();
  });
});

describe('Approve & Notify drawer reads the server verdict', () => {
  const task = {
    id: 'tsk_drawer_marcus',
    campaignId: 'tsk_drawer_marcus',
    propertyAddress: '7174 Peachtree Way, Wilmington, NC 28403',
    agentName: 'Marcus Aman',
    agentPhone: '(252) 717-0595',
    agentEmail: 'marcus.aman@gmail.com',
    agentRole: 'Requester',
    packageType: 'Tri-fold brochure',
    priority: 'normal',
    status: 'in_production',
    proofVersion: 1,
    targetSla: 'Deadline not specified',
    receivedAt: 'Today',
    assignedTo: 'Eduardo Lovo',
    assignedToId: 'dir_eduardo_lovo_73',
    reviewOwnerId: 'dir_melissa_gagliardi_33',
    reviewOwnerName: 'Melissa Gagliardi',
    proofUrl: 'https://drive.google.com/file/d/1AbCrealFile999xyz/view',
    category: 'print',
    requestedAssets: [{ name: 'Tri-fold brochure', format: 'PDF', dimensions: 'tri-fold' }],
    photos: [],
  };

  const melissa = {
    id: 'dir_melissa_gagliardi_33',
    name: 'Melissa Gagliardi',
    role: 'marketing_director',
    email: 'melissa.gagliardi@nestrealty.com',
    permissions: ['marketing.final_approval', 'marketing.approve'],
  };

  it('enables Approve & Notify when dispatch-check says allowlisted_prove', () => {
    const html = renderToStaticMarkup(
      React.createElement(WorkspaceTaskDrawer, {
        isOpen: true,
        activeTask: task,
        onClose: () => {},
        currentUser: melissa,
        dispatchVerdict: {
          allowed: true,
          reason: '',
          recipientStatus: 'allowlisted_prove',
          recipientId: null,
          effectiveCc: [],
        },
      })
    );
    expect(html).toContain('Approve &amp; Notify Agent');
    expect(html).toContain('data-recipient-status="allowlisted_prove"');
    const button = html.match(/<button[^>]*data-action="Approve &amp; send to agent"[^>]*>/);
    expect(button, html.slice(html.indexOf('Approve &amp; Notify'))).toBeTruthy();
    expect(button?.[0]).not.toContain('disabled');
    expect(html).not.toContain('Requester needs confirmation');
  });

  it('leaves Approve & Notify disabled until a server verdict arrives', () => {
    const html = renderToStaticMarkup(
      React.createElement(WorkspaceTaskDrawer, {
        isOpen: true,
        activeTask: task,
        onClose: () => {},
        currentUser: melissa,
      })
    );
    const button = html.match(/<button[^>]*data-action="Approve &amp; send to agent"[^>]*>/);
    expect(button?.[0]).toContain('disabled');
  });
});

describe('Confirm Requester persist', () => {
  it('writes no dir_* id for allowlisted Marcus', () => {
    const patch = confirmRequesterWrite(
      {
        id: 'dir_marcus_aman',
        name: 'Marcus Aman',
        email: 'marcus.aman@gmail.com',
        phone: '(252) 717-0595',
      },
      { recipientStatus: 'allowlisted_prove', recipientId: null }
    );
    expect(JSON.stringify(patch)).not.toContain('dir_');
    expect(patch.agentEmail).toBe('marcus.aman@gmail.com');
    expect(patch.requesterEmail).toBe('marcus.aman@gmail.com');
    expect(patch.requesterId).toBeNull();
    expect(patch.recipientKind).toBe('allowlisted_prove');
  });
});
