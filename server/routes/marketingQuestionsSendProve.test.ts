/**
 * Approve & Notify send-questions prove.
 * Root 400 was RECIPIENT_UNRESOLVED for Marcus Aman (tri-fold requester is not in
 * NEST_FULL_ROSTER_77). Valid https Drive proof + reviewer session must persist
 * proofUrl and leave awaiting_review without flipping outbound kill flags.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
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
import { DISPATCH_REASON, dispatchBlockCode, driveCreateFailureReason, evaluateDispatch, setDispatchOutboundModeForTests } from '../services/evaluateDispatch.js';
import { setDriveFilesListForTests } from '../services/googleDriveService.js';
import {
  __setAskNoraDriveDepsForTests,
  resetAskNoraListingFolderRegistry,
  type AskNoraDriveDeps,
} from '../services/askNoraDriveDelivery.js';
import { resolveServerCanonicalRecipient } from '../services/canonicalRecipientService.js';
import {
  getAllCanonicalMarketingTasks,
  getCanonicalMarketingTaskById,
  saveCanonicalMarketingTask,
} from '../persistence/marketingCampaignsRepository.js';
import type { Server } from 'http';

const TASK_ID = 'tsk_send_questions_prove_trifold';
const HTTPS_PROOF = 'https://drive.google.com/file/d/1AbCrealFile999xyz/view';
const DRIVE_FOLDER = 'https://drive.google.com/drive/folders/1AbCrealFolder999xyz';
const DRIVE_FOLDER_ID = '1AbCrealFolder999xyz';
const UPLOAD_PHOTO = '/uploads/1789593612358_Test_marcusgmail.png';
const CREATE_FAILED = driveCreateFailureReason('Drive folder create failed; no folder URL stored.');
const STORE = path.join(process.cwd(), 'server/data/canonical_marketing_store_test.json');

describe('POST /api/marketing/requests/send-questions Approve & Notify', () => {
  let server: Server;
  let baseUrl: string;
  let storeSnapshot = '';
  const outboundMaster = process.env.OUTBOUND_MASTER_MODE;
  const outboundMode = process.env.OUTBOUND_MODE;
  const allowDispatch = process.env.ALLOW_EXTERNAL_DISPATCH;
  const appMode = process.env.APP_MODE;
  const appEnv = process.env.APP_ENV;
  const isProduction = process.env.IS_PRODUCTION;

  beforeAll(async () => {
    process.env.OUTBOUND_MASTER_MODE = 'hold';
    process.env.APP_MODE = 'development';
    process.env.APP_ENV = 'development';
    process.env.IS_PRODUCTION = 'false';
    installDefaultDriveList();
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
    setDriveFilesListForTests(null);
    __setAskNoraDriveDepsForTests(null);
    resetAskNoraListingFolderRegistry();
    if (outboundMaster === undefined) delete process.env.OUTBOUND_MASTER_MODE;
    else process.env.OUTBOUND_MASTER_MODE = outboundMaster;
    if (appMode === undefined) delete process.env.APP_MODE;
    else process.env.APP_MODE = appMode;
    if (appEnv === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = appEnv;
    if (isProduction === undefined) delete process.env.IS_PRODUCTION;
    else process.env.IS_PRODUCTION = isProduction;
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
      driveFolderUrl: DRIVE_FOLDER,
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

  it('requires a scoped finished proof or a verified nonempty Drive folder', async () => {
    const beforeKeys = new Set(memoryOutbox.keys());
    const melissa = { 'x-user-email': 'melissa.gagliardi@nestrealty.com' };
    const empty = await post(payload({ proofUrl: undefined, driveFolderUrl: undefined }), melissa);
    expect(empty.status, JSON.stringify(empty.data)).toBe(400);
    expect(empty.data.reason).toBe(DISPATCH_REASON.durable);
    expect(empty.data.code).toBe(dispatchBlockCode(DISPATCH_REASON.durable));
    expect(getCanonicalMarketingTaskById(TASK_ID)?.reviewState).toBe('awaiting_review');
    const emptyRows = [...memoryOutbox.entries()].filter(([key]) => !beforeKeys.has(key));
    expect(emptyRows.length).toBe(0);

    const uploadOnly = await post(payload({
      proofUrl: undefined,
      driveFolderUrl: undefined,
      attachments: [{ url: '/uploads/1789593612358_Test_marcusgmail.png', filename: 'Test_marcusgmail.png' }],
    }), melissa);
    expect(uploadOnly.status, JSON.stringify(uploadOnly.data)).toBe(400);
    expect(uploadOnly.data.reason).toBe(DISPATCH_REASON.durable);
    expect(uploadOnly.data.code).toBe(dispatchBlockCode(DISPATCH_REASON.durable));

    setDriveFilesListForTests(async () => ({ data: { files: [] } }));
    const folderOnly = await post(payload({
      proofUrl: undefined,
      driveFolderUrl: DRIVE_FOLDER,
      attachments: [],
      assetUrls: [],
    }), melissa);
    installDefaultDriveList();
    expect(folderOnly.status, JSON.stringify(folderOnly.data)).toBe(400);
    expect(folderOnly.data.reason).toBe(DISPATCH_REASON.emptyFolder);

    const fileOnly = await post(payload({ driveFolderUrl: undefined, proofUrl: HTTPS_PROOF }), melissa);
    expect(fileOnly.status, JSON.stringify(fileOnly.data)).toBe(400);
    expect(fileOnly.data.reason).toBe(DISPATCH_REASON.durable);

    const pasted = await post(payload({ driveFolderUrl: DRIVE_FOLDER, proofUrl: HTTPS_PROOF }), melissa);
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
      outboundMode?: string;
      allowed: boolean;
      reason: string;
      status: number;
      recipientStatus?: string;
      driveList?: 'empty' | 'error' | 'one';
      seedUploadPhoto?: boolean;
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
        reason: DISPATCH_REASON.durable,
        status: 400,
      },
      {
        name: 'upload without drive folder',
        headers: melissa,
        body: payload({
          proofUrl: undefined,
          driveFolderUrl: undefined,
          attachments: [{ url: '/uploads/1789593612358_Test_marcusgmail.png' }],
        }),
        allowed: false,
        reason: DISPATCH_REASON.durable,
        status: 400,
      },
      {
        name: 'drive folder with zero files',
        headers: melissa,
        body: payload({ proofUrl: undefined, driveFolderUrl: DRIVE_FOLDER, attachments: [], assetUrls: [] }),
        driveList: 'empty',
        allowed: false,
        reason: DISPATCH_REASON.emptyFolder,
        status: 400,
      },
      {
        name: 'qa.random example.com no proof',
        headers: melissa,
        body: payload({
          recipientName: 'QA Random',
          recipientEmail: 'qa.random@example.com',
          recipientPhone: undefined,
          channels: ['email'],
          proofUrl: undefined,
        }),
        allowed: false,
        reason: DISPATCH_REASON.recipient,
        status: 400,
      },
      {
        name: 'qa.random gmail no proof',
        headers: melissa,
        body: payload({
          recipientName: 'QA Random',
          recipientEmail: 'qa.random@gmail.com',
          recipientPhone: undefined,
          channels: ['email'],
          proofUrl: undefined,
        }),
        allowed: false,
        reason: DISPATCH_REASON.recipient,
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
        outboundMode: 'disabled',
        allowed: false,
        reason: DISPATCH_REASON.outbound,
        status: 400,
      },
      {
        name: 'pasted drive file link is not a folder',
        headers: melissa,
        body: payload({
          proofUrl: HTTPS_PROOF,
          driveFolderUrl: undefined,
          attachments: [],
          assetUrls: [],
        }),
        allowed: false,
        reason: DISPATCH_REASON.durable,
        status: 400,
      },
      {
        name: 'pasted folder link with no file',
        headers: melissa,
        body: payload({
          proofUrl: DRIVE_FOLDER,
          driveFolderUrl: undefined,
          attachments: [],
          assetUrls: [],
        }),
        driveList: 'empty',
        allowed: false,
        reason: DISPATCH_REASON.emptyFolder,
        status: 400,
      },
      {
        name: 'pasted folder empty while the task has an uploads photo',
        headers: melissa,
        body: payload({
          proofUrl: DRIVE_FOLDER,
          driveFolderUrl: undefined,
          attachments: [{ url: UPLOAD_PHOTO, filename: 'Test.png' }],
          assetUrls: [UPLOAD_PHOTO],
        }),
        driveList: 'empty',
        seedUploadPhoto: true,
        allowed: false,
        reason: DISPATCH_REASON.emptyFolder,
        status: 400,
      },
      {
        name: 'pasted folder list error',
        headers: melissa,
        body: payload({
          proofUrl: DRIVE_FOLDER,
          driveFolderUrl: undefined,
          attachments: [{ url: UPLOAD_PHOTO, filename: 'Test.png' }],
          assetUrls: [UPLOAD_PHOTO],
        }),
        driveList: 'error',
        seedUploadPhoto: true,
        allowed: false,
        reason: DISPATCH_REASON.unreadFolder,
        status: 400,
      },
      {
        name: 'pasted folder lists one file',
        headers: melissa,
        body: payload({
          proofUrl: DRIVE_FOLDER,
          driveFolderUrl: undefined,
          attachments: [{ url: UPLOAD_PHOTO, filename: 'Test.png' }],
          assetUrls: [UPLOAD_PHOTO],
        }),
        driveList: 'one',
        seedUploadPhoto: true,
        allowed: true,
        reason: '',
        status: 200,
        recipientStatus: 'allowlisted_prove',
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
      setDispatchOutboundModeForTests(row.outboundMode || null);
      const driveList = row.driveList ? stubPastedFolderList(row.driveList) : null;
      if (row.seedUploadPhoto) {
        const task = getCanonicalMarketingTaskById(TASK_ID);
        saveCanonicalMarketingTask({
          ...(task || {}),
          id: TASK_ID,
          photos: [{ id: 'photo_upload', url: UPLOAD_PHOTO, name: 'Test.png' }],
          attachments: [{ url: UPLOAD_PHOTO, filename: 'Test.png' }],
        } as any);
      }
      try {
        const check = await postCheck(row.body, row.headers);
        const send = await post(row.body, row.headers);
        expect(check.data.allowed, row.name).toBe(row.allowed);
        expect(check.data.reason, `${row.name} ${JSON.stringify(check.data)}`).toBe(row.reason);
        expect(check.status, row.name).toBe(row.status);
        if (!row.allowed) {
          expect(send.status, `${row.name} ${JSON.stringify(send.data)}`).toBe(check.status);
          expect(send.data.code, row.name).toBe(check.data.code);
          expect(send.data.reason, `${row.name} ${JSON.stringify(send.data)}`).toBe(check.data.reason);
          expect(send.data.code, row.name).toBe(dispatchBlockCode(row.reason));
          expect(String(send.data.error || '')).not.toContain('Prohibited recipient');
        } else {
          expect(send.status, `${row.name} ${JSON.stringify(send.data)}`).toBe(row.status);
          expect(send.data.allowed, row.name).toBe(row.allowed);
        }
        if (row.recipientStatus) {
          expect(check.data.recipientStatus).toBe(row.recipientStatus);
          expect(check.data.effectiveTo).toEqual(['marcus.aman@gmail.com']);
          expect(check.data.effectiveCc).toEqual([]);
        }
        if (driveList) {
          expect(driveList.mock.calls.length, row.name).toBeGreaterThan(0);
          for (const call of driveList.mock.calls) {
            expect(String(call[0]?.q), row.name).toContain(DRIVE_FOLDER_ID);
            expect(String(call[0]?.q), row.name).not.toContain('/uploads/');
          }
          const task = getCanonicalMarketingTaskById(TASK_ID);
          const approve = await evaluateDispatch({
            task: {
              ...(task || { id: TASK_ID }),
              id: TASK_ID,
              workspaceId: 'ws_wilmington',
            },
            actor: {
              id: 'dir_melissa_gagliardi_33',
              name: 'Melissa Gagliardi',
              email: 'melissa.gagliardi@nestrealty.com',
            },
            recipient: {
              email: String(row.body.recipientEmail || 'marcus.aman@gmail.com'),
              name: String(row.body.recipientName || 'Marcus Aman'),
            },
            channel: 'email',
            cc: ['melissa.gagliardi@nestrealty.com'],
            intent: 'delivery_complete',
            proofUrl: typeof row.body.proofUrl === 'string' ? row.body.proofUrl : undefined,
            driveFolderUrl: typeof row.body.driveFolderUrl === 'string' ? row.body.driveFolderUrl : undefined,
          });
          expect(approve.reason, `${row.name} approve-and-dispatch`).toBe(check.data.reason);
          expect(approve.allowed, `${row.name} approve-and-dispatch`).toBe(check.data.allowed);
        }
      } finally {
        process.env.OUTBOUND_MASTER_MODE = 'hold';
        setDispatchOutboundModeForTests(null);
        installDefaultDriveList();
      }
    }
  });

function installDefaultDriveList() {
  setDriveFilesListForTests(async () => ({
    data: { files: [{ id: '1AbCrealFileInFolder', name: 'Tri-fold.pdf', mimeType: 'application/pdf' }] },
  }));
}

function stubPastedFolderList(mode: 'empty' | 'error' | 'one') {
  const list = vi.fn(async () => {
    if (mode === 'error') {
      const err = new Error('File not found') as Error & { code?: number };
      err.code = 404;
      throw err;
    }
    if (mode === 'one') {
      return {
        data: {
          files: [{ id: '1AbCrealFileInFolder', name: 'Tri-fold.pdf', mimeType: 'application/pdf' }],
        },
      };
    }
    return { data: { files: [] } };
  });
  setDriveFilesListForTests(list);
  return list;
}

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

  it('never stores a data: image as proofUrl', () => {
    saveCanonicalMarketingTask({
      id: TASK_ID,
      title: 'Tri-fold brochure',
      status: 'in_progress',
      reviewState: 'awaiting_review',
      proofUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      proofVersion: 4,
      proofHistory: [{ version: 4, proofUrl: 'data:image/png;base64,iVBORw0KGgo=' }],
      workspaceId: 'ws_wilmington',
      reviewOwnerId: 'dir_melissa_gagliardi_33',
      reviewOwnerName: 'Melissa Gagliardi',
    } as any);
    const task = getCanonicalMarketingTaskById(TASK_ID);
    expect(task?.proofUrl || '').not.toMatch(/^data:/);
    expect(task?.proofUrl || null).toBeFalsy();
    expect(JSON.stringify(task?.proofHistory || [])).not.toContain('data:');
  });

  it('uses a pasted https proof ahead of the stored proof', async () => {
    const stored = 'https://drive.google.com/file/d/1StoredProofOnly111abc/view';
    saveCanonicalMarketingTask({
      id: TASK_ID,
      title: 'Tri-fold brochure',
      status: 'in_progress',
      reviewState: 'awaiting_review',
      proofUrl: stored,
      driveFolderUrl: DRIVE_FOLDER,
      propertyAddress: '7174 Peachtree Way, Wilmington, NC 28403',
      agentName: 'Marcus Aman',
      agentEmail: 'marcus.aman@gmail.com',
      workspaceId: 'ws_wilmington',
      reviewOwnerId: 'dir_melissa_gagliardi_33',
      reviewOwnerName: 'Melissa Gagliardi',
    } as any);
    const melissa = { 'x-user-email': 'melissa.gagliardi@nestrealty.com' };
    const check = await postCheck(payload({ proofUrl: HTTPS_PROOF, driveFolderUrl: DRIVE_FOLDER }), melissa);
    expect(check.data.allowed, JSON.stringify(check.data)).toBe(true);
    const send = await post(payload({ proofUrl: HTTPS_PROOF, driveFolderUrl: DRIVE_FOLDER }), melissa);
    expect(send.status, JSON.stringify(send.data)).toBe(200);
    expect(send.data.task?.proofUrl).toBe(HTTPS_PROOF);
    expect(getCanonicalMarketingTaskById(TASK_ID)?.proofUrl).toBe(HTTPS_PROOF);
  });

  it('auto-creates the AskNora folder, copies intake files, and blocks a failed or empty copy', async () => {
    const uploadName = 'trifold-intake-prove.png';
    const uploadPath = path.join(process.cwd(), 'uploads', uploadName);
    fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
    fs.writeFileSync(uploadPath, Buffer.from('png'));
    const folders = new Map<string, { id: string; url: string; files: string[] }>();
    let seq = 0;
    let failCreate = false;
    let dropCopies = false;
    let createCount = 0;
    let uploadCount = 0;
    let copyCount = 0;
    const deps: AskNoraDriveDeps = {
      async findFolderByAddress() {
        return null;
      },
      async createFolder() {
        createCount += 1;
        if (failCreate) return { isLive: false, driveFolderId: '', driveFolderUrl: '' };
        seq += 1;
        const id = `1AbCautoFolder${seq}xyz`;
        const url = `https://drive.google.com/drive/folders/${id}`;
        folders.set(id, { id, url, files: [] });
        return { isLive: true, driveFolderId: id, driveFolderUrl: url };
      },
      async uploadFile({ folderId, fileName }) {
        uploadCount += 1;
        if (dropCopies) return { isLive: false, fileId: '', webViewLink: '' };
        const folder = folders.get(folderId);
        if (!folder) return { isLive: false, fileId: '', webViewLink: '' };
        folder.files.push(fileName);
        seq += 1;
        const fileId = `1FileUp${seq}xyz`;
        return { isLive: true, fileId, webViewLink: `https://drive.google.com/file/d/${fileId}/view` };
      },
      async listFolderFileNames(folderId) {
        return folders.get(folderId)?.files.slice() || [];
      },
      async copyDriveFile({ folderId, fileName }) {
        copyCount += 1;
        if (dropCopies) return { isLive: false, fileId: '', webViewLink: '' };
        const folder = folders.get(folderId);
        if (!folder) return { isLive: false, fileId: '', webViewLink: '' };
        folder.files.push(fileName);
        seq += 1;
        const fileId = `1FileCopy${seq}xyz`;
        return { isLive: true, fileId, webViewLink: `https://drive.google.com/file/d/${fileId}/view` };
      },
    };
    setDriveFilesListForTests(async (args) => {
      const id = String(args?.q || '').match(/'([^']+)'/)?.[1] || '';
      const files = (folders.get(id)?.files || []).map((name) => ({ id: name, name, mimeType: 'image/png' }));
      return { data: { files } };
    });
    __setAskNoraDriveDepsForTests(deps);
    resetAskNoraListingFolderRegistry();

    const melissa = { 'x-user-email': 'melissa.gagliardi@nestrealty.com' };
    const photoUrl = `/uploads/${uploadName}`;
    const linked = 'https://drive.google.com/file/d/1AbClinkedIntakeFile/view';
    const saveTask = (extra: Record<string, unknown> = {}) => {
      saveCanonicalMarketingTask({
        id: TASK_ID,
        title: 'Tri-fold brochure',
        status: 'in_progress',
        reviewState: 'awaiting_review',
        propertyAddress: '7174 Peachtree Way, Wilmington, NC 28403',
        agentName: 'Marcus Aman',
        agentEmail: 'marcus.aman@gmail.com',
        workspaceId: 'ws_wilmington',
        reviewOwnerId: 'dir_melissa_gagliardi_33',
        reviewOwnerName: 'Melissa Gagliardi',
        notes: '',
        driveFolderUrl: undefined,
        photos: [{ id: 'photo_intake', url: photoUrl, name: uploadName }],
        attachments: [{ url: linked, driveUrl: linked, filename: 'linked.pdf' }],
        ...extra,
      } as any);
    };
    const postEnsure = async () => {
      const res = await fetch(`${baseUrl}/api/marketing/tasks/${TASK_ID}/ensure-drive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...melissa },
        body: JSON.stringify({ propertyAddress: '7174 Peachtree Way, Wilmington, NC 28403' }),
      });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    };
    const sameReason = async (body: Record<string, unknown>, reason: string) => {
      const check = await postCheck(body, melissa);
      const send = await post(body, melissa);
      const task = getCanonicalMarketingTaskById(TASK_ID);
      const approve = await evaluateDispatch({
        task: { ...(task || { id: TASK_ID }), id: TASK_ID, workspaceId: 'ws_wilmington' },
        actor: { id: 'dir_melissa_gagliardi_33', name: 'Melissa Gagliardi', email: 'melissa.gagliardi@nestrealty.com' },
        recipient: { email: 'marcus.aman@gmail.com', name: 'Marcus Aman' },
        channel: 'email',
        cc: ['melissa.gagliardi@nestrealty.com'],
        intent: 'delivery_complete',
        proofUrl: typeof body.proofUrl === 'string' ? body.proofUrl : undefined,
        driveFolderUrl: typeof body.driveFolderUrl === 'string' ? body.driveFolderUrl : task?.driveFolderUrl,
      });
      expect(check.data.reason, JSON.stringify(check.data)).toBe(reason);
      expect(send.data.reason, JSON.stringify(send.data)).toBe(reason);
      expect(send.status).toBe(check.status);
      expect(approve.reason, 'approve-and-dispatch').toBe(reason);
    };

    try {
      saveTask();
      const ensured = await postEnsure();
      expect(ensured.status, JSON.stringify(ensured.data)).toBe(200);
      expect(ensured.data.linkable).toBe(true);
      expect(String(ensured.data.driveFolderUrl)).toMatch(/\/folders\/1AbCautoFolder1xyz/);
      expect(getCanonicalMarketingTaskById(TASK_ID)?.driveFolderUrl).toBe(ensured.data.driveFolderUrl);
      expect(createCount).toBe(1);
      const folder = folders.get('1AbCautoFolder1xyz');
      expect(folder?.files).toEqual([uploadName, 'linked.pdf']);

      const noPaste = payload({ proofUrl: undefined, driveFolderUrl: undefined });
      const check = await postCheck(noPaste, melissa);
      expect(check.data.allowed, JSON.stringify(check.data)).toBe(true);
      expect(check.data.effectiveTo).toEqual(['marcus.aman@gmail.com']);
      expect(check.data.effectiveCc).toEqual([]);
      const send = await post(noPaste, melissa);
      expect(send.status, JSON.stringify(send.data)).toBe(200);
      expect(send.data.allowed).toBe(true);

      const again = await postEnsure();
      expect(again.data.driveFolderUrl).toBe(ensured.data.driveFolderUrl);
      expect(createCount).toBe(1);
      expect(uploadCount).toBe(1);
      expect(copyCount).toBe(1);
      expect(folder?.files).toEqual([uploadName, 'linked.pdf']);

      dropCopies = true;
      resetAskNoraListingFolderRegistry();
      saveTask({ photos: [], attachments: [], driveFolderUrl: undefined, notes: '' });
      const emptyEnsure = await postEnsure();
      expect(emptyEnsure.status, JSON.stringify(emptyEnsure.data)).toBe(200);
      expect(emptyEnsure.data.linkable).toBe(false);
      expect(emptyEnsure.data.driveFolderUrl).toBeTruthy();
      await sameReason(
        payload({ proofUrl: undefined, driveFolderUrl: emptyEnsure.data.driveFolderUrl, attachments: [], assetUrls: [] }),
        DISPATCH_REASON.emptyFolder
      );

      failCreate = true;
      resetAskNoraListingFolderRegistry();
      saveTask({ photos: [], attachments: [], driveFolderUrl: undefined, notes: '' });
      const failed = await postEnsure();
      expect(failed.status).toBe(400);
      expect(failed.data.reason).toBe(CREATE_FAILED);
      await sameReason(payload({ proofUrl: undefined, driveFolderUrl: undefined, attachments: [], assetUrls: [] }), DISPATCH_REASON.durable);
    } finally {
      fs.rmSync(uploadPath, { force: true });
      __setAskNoraDriveDepsForTests(null);
      resetAskNoraListingFolderRegistry();
      installDefaultDriveList();
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

  it('does not prefill the proof input from a data: proofUrl', () => {
    const html = renderToStaticMarkup(
      React.createElement(WorkspaceTaskDrawer, {
        isOpen: true,
        activeTask: {
          ...task,
          proofUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ',
        },
        onClose: () => {},
        currentUser: melissa,
      })
    );
    expect(html).not.toContain('data:image/png');
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

describe('Notify modal reads dispatch-check To, CC, and allowed', () => {
  const campaign = {
    id: TASK_ID,
    agentName: 'Marcus Aman',
    agentEmail: 'marcus.aman@gmail.com',
    phone: '(252) 717-0595',
    propertyAddress: '7174 Peachtree Way',
    outreachIntent: 'delivery_complete',
    proofUrl: 'data:image/png;base64,iVBORw0KGgo=',
    approvePayload: { proofUrl: HTTPS_PROOF },
  };

  it('renders To and CC only from the verdict and blocks Send while allowed is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(AskRequesterQuestionsModal, {
        isOpen: true,
        onClose: () => {},
        intent: 'delivery_complete',
        isOutboundEnabled: true,
        dispatchVerdict: {
          allowed: false,
          reason: 'Proof link must use https.',
          recipientStatus: 'allowlisted_prove',
          recipientId: null,
          effectiveTo: ['marcus.aman@gmail.com'],
          effectiveCc: [],
        },
        campaign,
      })
    );
    expect(html).toContain('data-testid="outreach-effective-to"');
    expect(html).toContain('marcus.aman@gmail.com');
    expect(html).toContain('data-testid="outreach-effective-cc"');
    expect(html).toContain('No one is CC&#x27;d.');
    expect(html).not.toContain('Marketing completes CC Melissa automatically');
    expect(html).not.toContain('melissa.gagliardi@nestrealty.com');
    expect(html).toContain('Send &amp; complete');
    expect(html).toContain('Proof link must use https.');
    expect(html).toContain('data-send-ready="false"');
    const button = html.match(/<button[^>]*data-testid="ask-agent-submit-btn"[^>]*>/);
    expect(button?.[0]).toContain('disabled=""');
  });

  it('enables Send & complete only when dispatch-check allowed is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(AskRequesterQuestionsModal, {
        isOpen: true,
        onClose: () => {},
        intent: 'delivery_complete',
        isOutboundEnabled: true,
        dispatchVerdict: {
          allowed: true,
          reason: '',
          recipientStatus: 'allowlisted_prove',
          recipientId: null,
          effectiveTo: ['marcus.aman@gmail.com'],
          effectiveCc: [],
        },
        campaign,
      })
    );
    expect(html).not.toContain('melissa.gagliardi@nestrealty.com');
    expect(html).toContain('No one is CC&#x27;d.');
    expect(html).toContain('data-send-ready="true"');
    const button = html.match(/<button[^>]*data-testid="ask-agent-submit-btn"[^>]*>/);
    expect(button?.[0]).not.toContain('disabled=""');
    expect(html).not.toContain('data-testid="dispatch-block-reason"');
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
