import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ tasks: [] as any[], requests: [] as any[], preferenceStored: false,
  send: vi.fn(async () => ({ held: true, reason: 'held' })), media: vi.fn(), evaluation: vi.fn(), seq: 0 }));
vi.mock('../persistence/marketingCampaignsRepository.js', () => ({
  getAllCanonicalMarketingTasks: () => state.tasks, getAllCanonicalMarketingRequests: () => state.requests,
  saveCanonicalMarketingTask: (task: any) => { const i = state.tasks.findIndex(t => t.id === task.id); if (i < 0) state.tasks.push(task); else state.tasks[i] = task; },
  saveCanonicalMarketingRequest: (req: any) => { const i = state.requests.findIndex(t => t.id === req.id); if (i < 0) state.requests.push(req); else state.requests[i] = req; },
  persistTaskToDatabase: vi.fn(), persistRequestToDatabase: vi.fn(),
  computeCanonicalDeliverableKey: (v: any) => String(v), generateDurableChildTaskId: (id: string, title: string) => `${id}_${title}`,
  findExistingChildTask: (tasks: any[], _request: string, title: string) => tasks.find(t => t.title === title),
  extractCanonicalDeliverableIdentity: (v: any) => ({ deliverableType: v.title, variantKey: 'default', occurrenceIndex: 0, canonicalIdentity: v.title }),
}));
vi.mock('../persistence/repositories.js', () => ({ getStorageDriver: () => 'memory', getDbPool: () => null, dbPool: null }));
vi.mock('../persistence/telephonyCallsRepository.js', () => ({}));
vi.mock('../persistence/notificationPreferencesRepository.js', () => ({
  hasStoredNotificationPreferencesAsync: async () => state.preferenceStored,
  canSendAgentOutbound: async () => ({ allowed: false, reason: 'member_disabled' }),
}));
vi.mock('../email/emailProvider.js', () => ({
  sendMarketingIntakeConfirmationEmail: state.send, sendAddressRequestEmail: state.send,
  sendPhotoUploadRequestEmail: state.send, sendIntakeMissingInfoAcknowledgmentEmail: state.send,
  isAllowedEmailRecipient: () => true,
}));
vi.mock('../email/outboundDispatchGuards.js', () => ({ evaluateOutboundDispatchGuard: async () => ({ allowed: true }), looksLikeSmokeOrTestThread: () => false }));
vi.mock('../email/outboundGate.js', () => ({ checkOutbound: () => ({ allowed: false, reason: 'held' }) }));
vi.mock('../persistence/intakeTombstoneRepository.js', () => ({ isTombstoned: async () => null }));
vi.mock('./taskTrackerService.js', () => ({ generateMarketingTrackerToken: async (id: string) => `opaque_${id}` }));
vi.mock('./listingMediaStorageService.js', () => ({ saveListingMediaAsset: state.media }));
vi.mock('./noraMarketingIntakeOrchestrator.js', () => ({
  noraMarketingIntakeOrchestrator: { evaluateMarketingIntake: state.evaluation }, NORA_POLICY_VERSION: 'v1', NORA_KNOWLEDGE_VERSION: 'v1',
}));
vi.mock('./canonicalDirectoryService.js', () => ({ getActiveDirectoryMemberByEmail: async (email: string) => ({ name: 'Agent', email, role: 'Broker' }) }));
vi.mock('./activityHistoryService.js', () => ({ recordActivityEvent: vi.fn(async () => ({})) }));
vi.mock('./canonicalTaskRoutingService.js', () => ({ canonicalTaskRoutingService: {
  resolveRouting: async () => ({ routingState: 'resolved', departmentId: 'marketing', assigneeName: 'Eduardo Lovo', snapshot: {} }),
  recordRoutingAudit: vi.fn(),
} }));
vi.mock('./askNoraDriveDelivery.js', () => ({
  coalesceRealDriveUrl: (...urls: string[]) => urls.find(Boolean) || '', extractRealDriveUrlsFromText: () => [],
  isRealGoogleDriveUrl: () => false, listingAddressKey: (v: string) => v, promoteAskNoraListingFolder: vi.fn(() => { throw new Error('Drive must not be called'); }),
}));
vi.mock('../policies/departmentNotificationPolicyEngine.js', () => ({
  getResponsibleDepartmentOwner: () => ({ name: 'Melissa Gagliardi', email: 'melissa.gagliardi@nestrealty.com' }),
  getNotificationCcEmail: () => 'melissa.gagliardi@nestrealty.com',
}));

import { ingestInboundEmailToTask, memoryOutbox } from './inboundEmailIngestionEngine.js';
import { dispatchMissingPhotosNotification } from '../integrations/marketingCallsService.js';

const intake = (extra: any = {}) => ({ from: 'agent@nestrealty.com', workspaceId: 'ws_a', mailboxId: 'asknora@nestrealty.com',
  subject: 'Flyer for 123 Main St', textContent: 'Please prepare a flyer for 123 Main St.', messageId: `<inbound_${++state.seq}@example>`, ...extra });
beforeEach(() => {
  state.tasks.length = 0; state.requests.length = 0; memoryOutbox.clear(); state.send.mockClear().mockResolvedValue({ held: true, reason: 'held' }); state.preferenceStored = false;
  state.media.mockReset().mockImplementation(async (input: any) => ({ id: `asset_${++state.seq}`, url: `/uploads/unique_${state.seq}.jpg`, filename: input.filename }));
  state.evaluation.mockResolvedValue({ readinessStatus: 'ready_for_review', missingFields: [], fieldConflicts: [], policyVersion: 'v1', knowledgeVersion: 'v1' });
});

describe('Marketing email intake lifecycle with mocked persistence/transports', () => {
  it('creates Melissa intake and requests missing photos once despite default-disabled optional notifications', async () => {
    const payload = intake(); const first = await ingestInboundEmailToTask(payload);
    expect(first.success).toBe(true); expect(first.task?.status).toBe('request_received');
    expect(first.task?.workspaceId).toBe('ws_a'); expect(first.task?.assignedTo).toBe('Melissa Gagliardi');
    await ingestInboundEmailToTask(payload);
    const photoEmails = [...memoryOutbox.values()].filter(row => row.messageType === 'photo_request');
    expect(photoEmails).toHaveLength(1); expect(photoEmails[0].status).toBe('held');
    expect(photoEmails[0].payload.inReplyTo).toBe(payload.messageId);
  });

  it('honors explicitly disabled member notifications without bypassing the outbound hold', async () => {
    state.preferenceStored = true; await ingestInboundEmailToTask(intake());
    expect(memoryOutbox.size).toBe(0); expect(state.send).not.toHaveBeenCalled();
  });

  it('photo reply updates the same task while preserving Intake Received and its assignee', async () => {
    const firstPayload = intake(); const first = await ingestInboundEmailToTask(firstPayload);
    const result = await ingestInboundEmailToTask(intake({ subject: 'Re: Flyer', textContent: 'Photos attached.', inReplyTo: firstPayload.messageId,
      attachments: [{ filename: 'IMG_0001.jpg', contentType: 'image/jpeg', content: Buffer.from('jpeg') }] }));
    expect(result.taskId).toBe(first.taskId); expect(state.tasks).toHaveLength(1);
    expect(result.task?.status).toBe('request_received'); expect(result.task?.photos).toHaveLength(1);
    expect((result.task?.photos[0] as any).assetId).toMatch(/^asset_/);
    expect(state.media).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 'ws_a', buffer: expect.any(Buffer) }));
  });

  it('fills the missing address from an exact conversation reply without advancing or replacing the task', async () => {
    const payload = intake({ subject: 'Listing launch', textContent: 'Please prepare a flyer.' });
    const first = await ingestInboundEmailToTask(payload);
    expect(first.request?.propertyAddress).toBe('Address Pending');
    const result = await ingestInboundEmailToTask(intake({ subject: 'Re: Listing launch',
      textContent: 'The address is 880 Wrightsville Ave, Wilmington NC.', inReplyTo: payload.messageId }));
    expect(result.requestId).toBe(first.requestId); expect(result.taskId).toBe(first.taskId);
    expect(result.request?.propertyAddress).toContain('880 Wrightsville Ave');
    expect(result.task?.propertyAddress).toContain('880 Wrightsville Ave');
    expect(result.task?.status).toBe('request_received'); expect(result.task?.assignedTo).toBe('Melissa Gagliardi');
    expect(result.request?.title).not.toContain('[Address Needed]');
  });

  it('does not apply address clarification to an unrelated conversation or ambiguous pending request', async () => {
    const first = await ingestInboundEmailToTask(intake({ subject: 'Listing launch', textContent: 'Please prepare a flyer.' }));
    const unrelated = await ingestInboundEmailToTask(intake({ subject: 'Re: Other listing',
      textContent: 'The address is 880 Wrightsville Ave.', inReplyTo: '<unknown@example>' }));
    expect(unrelated.requestId).not.toBe(first.requestId); expect(first.request?.propertyAddress).toBe('Address Pending');
    const second = await ingestInboundEmailToTask(intake({ subject: 'Another listing', textContent: 'A separate marketing request: please prepare a flyer.' }));
    const ambiguous = await ingestInboundEmailToTask(intake({ subject: 'Re: Property address', textContent: 'The address is 882 Wrightsville Ave.' }));
    expect(ambiguous.requestId).not.toBe(first.requestId); expect(ambiguous.requestId).not.toBe(second.requestId);
    expect(first.request?.propertyAddress).toBe('Address Pending'); expect(second.request?.propertyAddress).toBe('Address Pending');
  });

  it('revision reply to a sent message reopens completed task; unrelated new work at same property does not', async () => {
    const payload = intake(); const first = await ingestInboundEmailToTask(payload);
    first.task!.status = 'completed'; first.request!.status = 'completed';
    const result = await ingestInboundEmailToTask(intake({ subject: 'Re: Flyer', textContent: 'Please replace the kitchen photo.', inReplyTo: payload.messageId }));
    expect(result.taskId).toBe(first.taskId); expect(result.task?.status).toBe('needs_review');
    first.task!.status = 'completed'; first.request!.status = 'completed';
    const newWork = await ingestInboundEmailToTask(intake({ textContent: 'A new marketing request: please prepare a flyer for 123 Main St.' }));
    expect(newWork.taskId).not.toBe(first.taskId); expect(first.task!.status).toBe('completed');
  });

  it('never merges another workspace or requester at the same property', async () => {
    const first = await ingestInboundEmailToTask(intake());
    const second = await ingestInboundEmailToTask(intake({ workspaceId: 'ws_b' }));
    const third = await ingestInboundEmailToTask(intake({ from: 'other@nestrealty.com' }));
    expect(new Set([first.taskId, second.taskId, third.taskId]).size).toBe(3);
  });

  it('rejects failed durable media instead of attaching a temporary path; claim can be retried', async () => {
    const payload = intake({ attachments: [{ filename: 'photo.jpg', contentType: 'image/jpeg', content: Buffer.from('jpeg') }] });
    state.media.mockRejectedValueOnce(new Error('Durable storage unavailable'));
    await expect(ingestInboundEmailToTask(payload)).rejects.toThrow('Durable storage unavailable');
    expect(state.tasks).toHaveLength(0);
    const result = await ingestInboundEmailToTask(payload); expect(result.success).toBe(true); expect(result.task?.photos).toHaveLength(1);
  });

  it('manual phone photo action shares the automatic intake key, sends no duplicate, and reports the real receipt', async () => {
    state.send.mockResolvedValue({ success: true, smtpAccepted: true, messageId: '<smtp-accepted@example>' } as any);
    const first = await ingestInboundEmailToTask(intake());
    (first.request as any).telephonyCallId = 'call_a';
    const sendsAfterIntake = state.send.mock.calls.length;
    const result = await dispatchMissingPhotosNotification({ id: 'call_a', phone: '+19105550123',
      brokerDetails: { email: 'agent@nestrealty.com' } } as any, 'ws_a');
    expect(result).toMatchObject({ smsSent: false, emailSent: true, status: 'sent', recipientEmail: 'agent@nestrealty.com', driveFolderUrl: '' });
    expect(state.send).toHaveBeenCalledTimes(sendsAfterIntake);
    const rows = [...memoryOutbox.values()].filter(row => row.messageType === 'photo_request');
    expect(rows).toHaveLength(1); expect(rows[0].idempotencyKey).toBe(`ws_a:req:${first.requestId}:photo_request:v1`);
  });

  it('manual phone dispatch stays honest about hold and refuses missing or foreign canonical scope', async () => {
    const first = await ingestInboundEmailToTask(intake());
    (first.request as any).telephonyCallId = 'call_a';
    const call = { id: 'call_a', brokerDetails: { email: 'agent@nestrealty.com' } } as any;
    const result = await dispatchMissingPhotosNotification(call, 'ws_a');
    expect(result).toMatchObject({ smsSent: false, emailSent: false, status: 'held' });
    const sendsAfterIntake = state.send.mock.calls.length;
    await expect(dispatchMissingPhotosNotification(call, 'ws_other')).rejects.toMatchObject({ code: 'PHOTO_REQUEST_SCOPE_UNAVAILABLE' });
    await expect(dispatchMissingPhotosNotification(call)).rejects.toMatchObject({ code: 'PHOTO_REQUEST_SCOPE_UNAVAILABLE' });
    expect(state.send).toHaveBeenCalledTimes(sendsAfterIntake); expect(state.tasks).toHaveLength(1);
  });
});
