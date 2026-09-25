import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ requests: [] as any[], tasks: [] as any[], missing: vi.fn(), dispatch: vi.fn() }));
vi.mock('../persistence/marketingCampaignsRepository.js', () => ({
  getAllCanonicalMarketingRequests: () => state.requests, getAllCanonicalMarketingTasks: () => state.tasks,
  saveCanonicalMarketingRequest: (r: any) => { const i = state.requests.findIndex(v => v.id === r.id); if (i < 0) state.requests.push(r); else state.requests[i] = r; },
  saveCanonicalMarketingTask: (t: any) => { const i = state.tasks.findIndex(v => v.id === t.id); if (i < 0) state.tasks.push(t); else state.tasks[i] = t; },
}));
vi.mock('../integrations/mls/mlsProviderAdapter.js', () => ({ NoraMlsProviderAdapter: class {} }));
vi.mock('./canonicalTaskRoutingService.js', () => ({ canonicalTaskRoutingService: {
  resolveRouting: async () => ({ assigneeName: 'Eduardo Lovo', assigneeStaffId: 'eduardo', departmentId: 'marketing', routingState: 'resolved' }),
  recordRoutingAudit: vi.fn(),
} }));
vi.mock('./askNoraDriveDelivery.js', () => ({ coalesceRealDriveUrl: (...values: string[]) => values.find(Boolean) || '' }));
vi.mock('./inboundEmailIngestionEngine.js', () => ({ enqueueMissingPhotoRequest: state.missing, processOutboundEmailOutbox: state.dispatch }));
import { NoraMarketingIntakeOrchestrator } from './noraMarketingIntakeOrchestrator.js';

const evaluation = (channel: string, extra: any = {}) => ({
  workspaceId: 'ws_wilmington', channel, requester: { name: 'Agent', email: 'agent@nestrealty.com' },
  propertyAddress: '123 Main St', normalizedPropertyKey: '123MAINST', readinessStatus: 'ready_for_review',
  intakeType: 'property_listing', isAddressConfirmed: true, missingFields: [], fieldConflicts: [], fieldProvenance: {},
  extractedFields: { photos: [], deliverables: ['Property Flyer'] }, policyVersion: 'v1', ...extra,
});
beforeEach(() => { state.requests.length = 0; state.tasks.length = 0; state.missing.mockClear(); state.dispatch.mockClear(); });

describe('Phone, email and web intake handoff to Melissa', () => {
  it.each(['phone', 'email', 'web'])('%s creates Intake Received even when all inputs are ready', async channel => {
    const result = await new NoraMarketingIntakeOrchestrator().persistIntakeEvaluation(evaluation(channel) as any);
    expect(result.tasks[0]).toMatchObject({ assignedTo: 'Melissa Gagliardi', status: 'request_received', agentEmail: 'agent@nestrealty.com' });
    expect(result.request.status).toBe('request_received');
    expect(state.missing).toHaveBeenCalledWith(result.request, result.tasks[0]);
    expect(state.dispatch).toHaveBeenCalledOnce();
  });

  it('appending photos to a merged request preserves Eduardo production and proof metadata', async () => {
    const orchestrator = new NoraMarketingIntakeOrchestrator();
    const first = await orchestrator.persistIntakeEvaluation(evaluation('web') as any);
    first.tasks[0].assignedTo = 'Eduardo Lovo'; first.tasks[0].status = 'in_progress';
    first.tasks[0].proofUrl = '/uploads/work-in-progress.pdf';
    const result = await orchestrator.persistIntakeEvaluation(evaluation('web', {
      existingOpenRequest: first.request, extractedFields: { photos: [{ url: '/uploads/photo.jpg', name: 'photo.jpg' }], deliverables: ['Property Flyer'] },
    }) as any);
    expect(result.tasks[0]).toMatchObject({ id: first.tasks[0].id, status: 'in_progress', assignedTo: 'Eduardo Lovo', proofUrl: '/uploads/work-in-progress.pdf' });
    expect(result.tasks[0].photos).toHaveLength(1); expect(state.tasks).toHaveLength(1);
  });

  it('does not trust a cross-tenant existing request passed in an evaluation', async () => {
    const orchestrator = new NoraMarketingIntakeOrchestrator();
    const first = await orchestrator.persistIntakeEvaluation(evaluation('web') as any);
    const second = await orchestrator.persistIntakeEvaluation(evaluation('web', { workspaceId: 'ws_other', existingOpenRequest: first.request }) as any);
    expect(second.isMerged).toBe(false); expect(second.request.id).not.toBe(first.request.id);
    expect(second.tasks[0].workspaceId).toBe('ws_other');
  });
});
