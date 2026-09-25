/**
 * QA gate findings on 96635dd. Each case is written against the unsafe behavior
 * so it fails until the fix lands.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Server } from 'http';
import { marketingQuestionsRouter } from './routes/marketingQuestionsRoute.js';
import {
  DISPATCH_REASON,
  driveCreateFailureReason,
  evaluateDispatch,
} from './services/evaluateDispatch.js';
import { setDriveFilesListForTests, GoogleDriveService } from './services/googleDriveService.js';
import {
  __setAskNoraDriveDepsForTests,
  promoteAskNoraListingFolder,
  resetAskNoraListingFolderRegistry,
} from './services/askNoraDriveDelivery.js';
import { resolveServerCanonicalRecipient } from './services/canonicalRecipientService.js';
import {
  getCanonicalMarketingTaskById,
  saveCanonicalMarketingTask,
} from './persistence/marketingCampaignsRepository.js';
import { WorkspaceTaskDrawer } from '../src/components/marketing/WorkspaceTaskDrawer.js';
import { resolveSurfaceDrawerGates } from '../src/lib/surfaceDrawerLock2.js';

const NOT_CONNECTED = "Google Drive isn't connected for this workspace.";
const TASK_ID = 'tsk_qa_gate_shapework_co';
const HTTPS_PROOF = 'https://drive.google.com/file/d/1QaGateProofFile999xyz/view';
const DRIVE_FOLDER = 'https://drive.google.com/drive/folders/1QaGateFolder999xyz';
const PASTED = 'https://evil.example/client-pasted-proof';
const STORED_PROOF = 'https://drive.google.com/file/d/1StoredBeforeEnsure999xyz/view';

describe('QA gate: allowlisted prove recipients', () => {
  let server: Server;
  let baseUrl: string;
  const outboundMaster = process.env.OUTBOUND_MASTER_MODE;
  const appMode = process.env.APP_MODE;
  const appEnv = process.env.APP_ENV;
  const isProduction = process.env.IS_PRODUCTION;

  beforeAll(async () => {
    process.env.OUTBOUND_MASTER_MODE = 'hold';
    process.env.APP_MODE = 'development';
    process.env.APP_ENV = 'development';
    process.env.IS_PRODUCTION = 'false';
    setDriveFilesListForTests(async () => ({
      data: { files: [{ id: '1QaGateFile', name: 'Tri-fold.pdf', mimeType: 'application/pdf' }] },
    }));
    const app = express();
    app.use(express.json({ limit: '1mb' }));
    app.use(marketingQuestionsRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as { port: number };
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
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(() => {
    process.env.OUTBOUND_MASTER_MODE = 'hold';
    process.env.APP_MODE = 'development';
    saveCanonicalMarketingTask({
      id: TASK_ID,
      title: 'QA gate brochure',
      status: 'in_progress',
      reviewState: 'awaiting_review',
      proofUrl: undefined,
      propertyAddress: '9 QA Gate Lane, Wilmington, NC',
      agentName: 'Marcus Aman',
      agentEmail: 'marcus@shapework.co',
      workspaceId: 'ws_wilmington',
      reviewOwnerId: 'dir_melissa_gagliardi_33',
      reviewOwnerName: 'Melissa Gagliardi',
    } as any);
  });

  function body(overrides: Record<string, unknown> = {}) {
    return {
      campaignId: TASK_ID,
      taskId: TASK_ID,
      recipientName: 'Marcus Aman',
      recipientEmail: 'marcus@shapework.co',
      channels: ['email'],
      message: 'Materials are ready.',
      selectedQuestions: ['delivery_ready'],
      propertyAddress: '9 QA Gate Lane, Wilmington, NC',
      intent: 'delivery_complete',
      subject: 'Your marketing materials are ready',
      domain: 'marketing',
      workspaceId: 'ws_wilmington',
      proofUrl: HTTPS_PROOF,
      driveFolderUrl: DRIVE_FOLDER,
      ...overrides,
    };
  }

  async function post(pathname: string, payload: Record<string, unknown>) {
    const res = await fetch(`${baseUrl}${pathname}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': 'melissa.gagliardi@nestrealty.com',
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  it('resolves marcus@shapework.co from the allowlist on dispatch-check and send, with no directory row', async () => {
    const directory = await resolveServerCanonicalRecipient({
      requesterEmail: 'marcus@shapework.co',
      requesterName: 'Marcus Aman',
      workspaceId: 'ws_wilmington',
    });
    expect(directory).toBeNull();

    const check = await post(`/api/marketing/requests/${TASK_ID}/dispatch-check`, body());
    expect(check.status, JSON.stringify(check.data)).toBe(200);
    expect(check.data.recipientStatus).toBe('allowlisted_prove');
    expect(check.data.recipientId).toBeNull();
    expect(check.data.effectiveTo).toEqual(['marcus@shapework.co']);
    expect(check.data.effectiveCc).toEqual([]);
    const droppedCc = (check.data.dropped || []).find((row: { email: string }) => row.email === 'melissa.gagliardi@nestrealty.com');
    expect(droppedCc?.reason).toBe('Not on the outbound allowlist.');

    const send = await post('/api/marketing/requests/send-questions', body());
    expect(send.status, JSON.stringify(send.data)).toBe(200);
    expect(send.data.recipientStatus).toBe('allowlisted_prove');
    expect(send.data.recipientId ?? null).toBeNull();
    expect(send.data.effectiveTo).toEqual(['marcus@shapework.co']);
    const again = await resolveServerCanonicalRecipient({ requesterEmail: 'marcus@shapework.co' });
    expect(again).toBeNull();
  });

  it('resolves the allowlist during hold even when APP_MODE is production', async () => {
    process.env.APP_MODE = 'production';
    const check = await post(`/api/marketing/requests/${TASK_ID}/dispatch-check`, body());
    expect(check.data.recipientStatus, JSON.stringify(check.data)).toBe('allowlisted_prove');
    expect(check.data.recipientId).toBeNull();
    expect(check.data.effectiveTo).toEqual(['marcus@shapework.co']);
    process.env.APP_MODE = 'development';
  });

  it('leaves effectiveTo empty while unresolved and says why the address was dropped', async () => {
    const unknown = await post(`/api/marketing/requests/${TASK_ID}/dispatch-check`, body({
      recipientName: 'Nobody Special',
      recipientEmail: 'qa.unknown.agent@nestrealty.com',
    }));
    expect(unknown.status).toBe(400);
    expect(unknown.data.code).toBe('RECIPIENT_UNRESOLVED');
    expect(unknown.data.effectiveTo).toEqual([]);
    const droppedTo = (unknown.data.dropped || []).find((row: { email: string }) => row.email === 'qa.unknown.agent@nestrealty.com');
    expect(droppedTo?.reason).toBe(DISPATCH_REASON.recipient);

    process.env.OUTBOUND_MASTER_MODE = 'live';
    const live = await post(`/api/marketing/requests/${TASK_ID}/dispatch-check`, body());
    expect(live.data.code).toBe('RECIPIENT_UNRESOLVED');
    expect(live.data.recipientStatus).toBe('unresolved');
    expect(live.data.effectiveTo).toEqual([]);
    const droppedLive = (live.data.dropped || []).find((row: { email: string }) => row.email === 'marcus@shapework.co');
    expect(droppedLive?.reason).toBe(DISPATCH_REASON.recipient);
    process.env.OUTBOUND_MASTER_MODE = 'hold';
  });
});

describe('QA gate: ensure-drive must not keep a pasted proof', () => {
  function ensureDriveHandler(): string {
    const src = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
    const start = src.indexOf("app.post('/api/marketing/tasks/:id/ensure-drive'");
    const end = src.indexOf("app.post('/api/marketing/tasks/:id/approve-and-dispatch'");
    return src.slice(start, end);
  }

  it('a failed create plus a pasted URL leaves the task proof unchanged', () => {
    const handler = ensureDriveHandler();
    const task: { proofUrl?: string } = { proofUrl: STORED_PROOF };
    const req = { body: { proofUrl: PASTED } };
    const copiesClientProof = /if\s*\(\s*!task\.proofUrl\s*&&\s*req\.body\?\.proofUrl\s*\)\s*task\.proofUrl\s*=\s*String\(req\.body\.proofUrl\)/.test(handler);
    if (copiesClientProof) {
      const empty: { proofUrl?: string } = {};
      if (!empty.proofUrl && req.body.proofUrl) empty.proofUrl = String(req.body.proofUrl);
      task.proofUrl = empty.proofUrl;
    }
    expect(copiesClientProof).toBe(false);
    expect(task.proofUrl).toBe(STORED_PROOF);
    expect(handler).not.toMatch(/task\.proofUrl\s*=\s*String\(req\.body/);
  });

  it('router ensure-drive does not persist a pasted URL when create fails', async () => {
    const id = 'tsk_qa_ensure_drive_paste';
    saveCanonicalMarketingTask({
      id,
      title: 'Paste must not stick',
      status: 'in_progress',
      reviewState: 'awaiting_review',
      proofUrl: STORED_PROOF,
      propertyAddress: '11 Paste Lane, Wilmington, NC',
      agentName: 'Marcus Aman',
      agentEmail: 'marcus@shapework.co',
      workspaceId: 'ws_wilmington',
      driveFolderUrl: undefined,
    } as any);
    __setAskNoraDriveDepsForTests({
      async findFolderByAddress() { return null; },
      async createFolder() { return { isLive: false, driveFolderId: '', driveFolderUrl: '' }; },
      async uploadFile() { return { isLive: false, fileId: '', webViewLink: '' }; },
    });
    resetAskNoraListingFolderRegistry();
    const app = express();
    app.use(express.json());
    app.use(marketingQuestionsRouter);
    const server = await new Promise<Server>((resolve) => {
      const listening = app.listen(0, () => resolve(listening));
    });
    const addr = server.address() as { port: number };
    try {
      const res = await fetch(`http://127.0.0.1:${addr.port}/api/marketing/tasks/${id}/ensure-drive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': 'melissa.gagliardi@nestrealty.com' },
        body: JSON.stringify({ proofUrl: PASTED, propertyAddress: '11 Paste Lane, Wilmington, NC' }),
      });
      expect(res.status).toBe(400);
      const task = getCanonicalMarketingTaskById(id);
      expect(task?.proofUrl).toBe(STORED_PROOF);
      expect(String(task?.driveFolderUrl || '')).not.toContain('evil.example');
      expect(String(task?.proofUrl || '')).not.toContain('evil.example');
    } finally {
      __setAskNoraDriveDepsForTests(null);
      resetAskNoraListingFolderRegistry();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});

describe('QA gate: Drive create failure', () => {
  afterAll(() => {
    __setAskNoraDriveDepsForTests(null);
    resetAskNoraListingFolderRegistry();
  });

  it('logs a failed folder create with a cause and returns that reason', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    __setAskNoraDriveDepsForTests({
      async findFolderByAddress() { return null; },
      async createFolder() {
        return { isLive: false, driveFolderId: '', driveFolderUrl: '', error: 'permission denied by Drive' };
      },
      async uploadFile() { return { isLive: false, fileId: '', webViewLink: '' }; },
    });
    resetAskNoraListingFolderRegistry();
    const result = await promoteAskNoraListingFolder({
      propertyAddress: '12 Create Fail Lane, Wilmington, NC',
      workspaceId: 'ws_wilmington',
    });
    expect(result.driveFolderUrl).toBe('');
    expect(result.error).toContain('permission denied by Drive');
    const logged = warn.mock.calls.map((call) => call.map(String).join(' ')).join('\n');
    expect(logged).toMatch(/\[AskNoraDrive\] create folder failed:/);
    expect(logged).toMatch(/permission denied by Drive/);
    warn.mockRestore();
  });

  it('says Google Drive is not connected when there is no workspace connection', async () => {
    const scaffold = await GoogleDriveService.scaffoldListingFolder({
      propertyAddress: '13 No Google Lane',
      agentName: 'Marcus Aman',
      agentEmail: 'marcus@shapework.co',
      workspaceId: 'ws_qa_no_google_connection',
    });
    expect(scaffold.isLiveDrive).toBe(false);
    expect(scaffold.error).toBe(NOT_CONNECTED);
    expect(driveCreateFailureReason(scaffold.error)).toBe(NOT_CONNECTED);
    expect(driveCreateFailureReason(NOT_CONNECTED)).not.toContain("Couldn't create the Drive folder");
  });

  it('says Google Drive is not connected when the connection flag is false', async () => {
    const dbState = ((global as any).__SHAPEWORK_DB_STATE ||= {});
    const previous = dbState.workspaceIntegrationConnections;
    dbState.workspaceIntegrationConnections = [{
      id: 'conn_qa',
      workspaceId: 'ws_qa_connected_false',
      provider: 'google_workspace',
      status: 'connected',
      connected: false,
      connectedByUserId: 'u',
      connectedAt: new Date().toISOString(),
      scopes: [],
      encryptedAccessToken: 'x',
    }];
    try {
      const scaffold = await GoogleDriveService.scaffoldListingFolder({
        propertyAddress: '14 Flag Off Lane',
        agentName: 'Marcus Aman',
        agentEmail: 'marcus@shapework.co',
        workspaceId: 'ws_qa_connected_false',
      });
      expect(scaffold.error).toBe(NOT_CONNECTED);
    } finally {
      dbState.workspaceIntegrationConnections = previous;
    }
  });
});

describe('QA gate: resend-photo outcome', () => {
  function resendHandler(): string {
    const src = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
    const start = src.indexOf("app.post('/api/marketing/requests/:id/resend-photo-request'");
    const end = src.indexOf("app.post('/api/marketing/tasks/:id/submit-manager-review'");
    return src.slice(start, end);
  }

  it('does not report success or outreach.sent when the gate holds the photo email', () => {
    const handler = resendHandler();
    expect(handler).not.toMatch(/eventType:\s*'outreach\.sent'/);
    expect(handler).not.toMatch(/success:\s*true,\s*\n\s*message: `Nora photo upload request dispatched/);
    expect(handler).toMatch(/classifyOutboundEmailResult/);
  });

  it('classifies sent, held, suppressed, and failed', async () => {
    let classify: ((result: Record<string, unknown> | null | undefined) => {
      outcome: string;
      success: boolean;
      reason?: string;
      activityEvent: string;
    }) | null = null;
    try {
      const mod = await import('./email/outboundSendOutcome.js');
      classify = mod.classifyOutboundEmailResult;
    } catch {
      classify = null;
    }
    expect(typeof classify).toBe('function');
    const sent = classify!({ success: true, messageId: 'msg_1' });
    expect(sent.outcome).toBe('sent');
    expect(sent.success).toBe(true);
    expect(sent.activityEvent).toBe('outreach.sent');

    const held = classify!({ success: true, suppressed: true, held: true, reason: 'held', messageId: 'suppressed_safe_mode_1' });
    expect(held.outcome).toBe('held');
    expect(held.success).toBe(false);
    expect(held.activityEvent).toBe('outreach.held');

    const suppressed = classify!({ success: true, suppressed: true, held: false, reason: 'outbound_disabled' });
    expect(suppressed.outcome).toBe('suppressed');
    expect(suppressed.success).toBe(false);
    expect(suppressed.activityEvent).toBe('outreach.blocked');

    const failed = classify!({ success: false, error: 'smtp down' });
    expect(failed.outcome).toBe('failed');
    expect(failed.success).toBe(false);
    expect(failed.reason).toBe('smtp down');
    expect(failed.activityEvent).toBe('outreach.blocked');
  });
});

describe('QA gate: Approve & Notify without a paste', () => {
  it('shows Approve for the reviewer when nothing has been pasted', () => {
    const gates = resolveSurfaceDrawerGates({
      shell: 'B1_creative',
      pagerIndex: 0,
      pagerTotal: 1,
      hasProof: false,
      task: {
        propertyAddress: '9 QA Gate Lane',
        title: 'Brochure',
        status: 'in_progress',
        category: 'marketing',
      },
    });
    expect(gates.showApproveNotify).toBe(true);

    const html = renderToStaticMarkup(
      React.createElement(WorkspaceTaskDrawer, {
        isOpen: true,
        onClose: () => {},
        activeTask: {
          id: 'tsk_qa_no_paste',
          propertyAddress: '9 QA Gate Lane, Wilmington, NC',
          agentName: 'Marcus Aman',
          agentEmail: 'marcus@shapework.co',
          packageType: 'Brochure',
          priority: 'normal',
          status: 'in_production',
          proofVersion: 1,
          targetSla: 'Deadline not specified',
          receivedAt: 'Today',
          assignedTo: 'Eduardo Lovo',
          assignedToId: 'dir_eduardo_lovo_73',
          reviewOwnerId: 'dir_melissa_gagliardi_33',
          reviewOwnerName: 'Melissa Gagliardi',
          proofUrl: '',
          photos: [],
          category: 'print',
        },
        currentUser: {
          id: 'dir_melissa_gagliardi_33',
          name: 'Melissa Gagliardi',
          role: 'marketing_director',
          email: 'melissa.gagliardi@nestrealty.com',
          permissions: ['marketing.final_approval', 'marketing.approve'],
        },
        dispatchVerdict: {
          allowed: true,
          reason: '',
          recipientStatus: 'allowlisted_prove',
          recipientId: null,
          effectiveTo: ['marcus@shapework.co'],
          effectiveCc: [],
        },
      })
    );
    expect(html).toContain('Approve &amp; Notify Agent');
    const button = html.match(/<button[^>]*data-action="Approve &amp; send to agent"[^>]*>/);
    expect(button?.[0]).toBeTruthy();
    expect(button?.[0]).not.toContain('disabled');
  });

  it('still hides Approve while chasing photos', () => {
    const gates = resolveSurfaceDrawerGates({
      shell: 'B1_creative',
      pagerIndex: 0,
      pagerTotal: 1,
      hasProof: false,
      nextVerb: 'Chase photos',
      task: {
        propertyAddress: '9 QA Gate Lane',
        title: 'Chase photos from agent',
        missingFacts: ['photos_needed'],
        status: 'in_progress',
        category: 'marketing',
      },
    });
    expect(gates.showApproveNotify).toBe(false);
  });
});

describe('QA gate: evaluateDispatch effectiveTo', () => {
  it('does not keep an unresolved allowlisted address in effectiveTo', async () => {
    process.env.OUTBOUND_MASTER_MODE = 'live';
    const verdict = await evaluateDispatch({
      task: { id: 'tsk_eval_live', workspaceId: 'ws_wilmington' },
      actor: { id: 'dir_melissa_gagliardi_33', name: 'Melissa Gagliardi', email: 'melissa.gagliardi@nestrealty.com' },
      recipient: { email: 'marcus@shapework.co', name: 'Marcus Aman' },
      channel: 'email',
      cc: ['melissa.gagliardi@nestrealty.com'],
      intent: 'ask_missing',
      outboundMode: 'live',
    });
    expect(verdict.recipientStatus).toBe('unresolved');
    expect(verdict.effectiveTo).toEqual([]);
    expect(verdict.dropped?.some((row) => row.email === 'marcus@shapework.co' && row.reason === DISPATCH_REASON.recipient)).toBe(true);
    process.env.OUTBOUND_MASTER_MODE = 'hold';
  });
});
