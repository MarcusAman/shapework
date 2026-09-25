import { describe, expect, it } from 'vitest';
import { applyEmailReply, findEmailReplyTarget, isRevisionRequest, recordEmailConversation } from './noraEmailReplyLifecycle.js';

const request = (id = 'req_a', workspaceId = 'ws_a', email = 'agent@nestrealty.com', status = 'request_received') => ({
  id, workspaceId, agentEmail: email, agentName: 'Agent', title: 'Flyer', propertyAddress: '123 Main St',
  taskIds: [`${id}_task`], status, createdAt: '', updatedAt: '', channel: 'email' as const,
});
const task = (req = request()) => ({
  id: `${req.id}_task`, requestId: req.id, workspaceId: req.workspaceId, agentEmail: req.agentEmail,
  title: 'Flyer', status: req.status, assignedTo: 'Melissa Gagliardi', photos: [], createdAt: '', updatedAt: '',
});

describe('Nora request-scoped email reply lifecycle', () => {
  it('matches exact conversation without repeating the property address and persists through serialization', () => {
    const req = request(); const t = task(req);
    recordEmailConversation(t, { messageId: '<intake@example>', threadId: 'gmail_thread' });
    const restored = JSON.parse(JSON.stringify(t));
    const match = findEmailReplyTarget({ workspaceId: 'ws_a', senderEmail: req.agentEmail, subject: 'Re: Flyer',
      text: 'Here are the photos', hasAttachments: true, inReplyTo: '<intake@example>', requests: [req], tasks: [restored] });
    expect(match?.request.id).toBe(req.id);
    expect(match?.exactConversation).toBe(true);
  });

  it.each([['ws_b', 'agent@nestrealty.com'], ['ws_a', 'other@nestrealty.com']])('rejects another tenant/requester even with matching ancestry (%s, %s)', (workspaceId, senderEmail) => {
    const req = request(); const t = task(req); recordEmailConversation(t, { messageId: '<sent@example>' });
    expect(findEmailReplyTarget({ workspaceId, senderEmail, subject: 'Re: Flyer', text: 'Please change the price',
      hasAttachments: false, inReplyTo: '<sent@example>', requests: [req], tasks: [t] })).toBeNull();
  });

  it('appends photos once and keeps Melissa in Intake Received', () => {
    const t = task();
    const input = { messageId: '<photos@example>', photos: [{ id: 'photo', hash: 'same', url: '/uploads/unique.jpg' }],
      attachments: [], text: 'Photos attached', senderName: 'Agent', reopen: false };
    applyEmailReply(t, input); applyEmailReply(t, input);
    expect(t.status).toBe('request_received'); expect(t.assignedTo).toBe('Melissa Gagliardi'); expect(t.photos).toHaveLength(1);
  });

  it('reopens completed work for Melissa review and invalidates approval without deleting old proof', () => {
    const t: any = { ...task(request('req_a', 'ws_a', 'agent@nestrealty.com', 'completed')), proofUrl: '/uploads/approved.pdf',
      completedAt: '2026-09-25', approvedProofVersion: 2, approvedChecksum: 'approved', proofVersion: 2 };
    applyEmailReply(t, { photos: [], attachments: [], text: 'Please change the price to $500,000.', senderName: 'Agent', reopen: true });
    expect(t.status).toBe('needs_review'); expect(t.reviewState).toBe('awaiting_review');
    expect(t.completedAt).toBeUndefined(); expect(t.approvedProofVersion).toBeUndefined();
    expect(t.proofUrl).toBe('/uploads/approved.pdf'); expect(t.reviewOwnerName).toBe('Melissa Gagliardi');
  });

  it('does not reopen completed work based on address or an unrelated new request', () => {
    const req = request('req_a', 'ws_a', 'agent@nestrealty.com', 'completed'); const t = task(req);
    recordEmailConversation(t, { messageId: '<sent@example>' });
    const base = { workspaceId: 'ws_a', senderEmail: req.agentEmail, subject: 'Flyer', propertyAddress: '123 Main St',
      hasAttachments: true, requests: [req], tasks: [t] };
    expect(findEmailReplyTarget({ ...base, text: 'Photos for another marketing request', inReplyTo: '<sent@example>' })).toBeNull();
    expect(findEmailReplyTarget({ ...base, text: 'Please change the price' })).toBeNull();
  });

  it('does not mistake a thank-you quoting old revision text for a new revision', () => {
    expect(isRevisionRequest('Thanks, looks great!\nOn Friday, Agent wrote:\nPlease change the price.')).toBe(false);
    expect(isRevisionRequest('No changes needed, thank you!')).toBe(false);
    expect(isRevisionRequest('Please swap the front photo.')).toBe(true);
  });

  it('refuses ambiguous address fallback and unknown explicit reply ancestry', () => {
    const a = request(), b = request('req_b');
    const base = { workspaceId: 'ws_a', senderEmail: a.agentEmail, subject: 'Re: Flyer', text: 'Photos attached',
      propertyAddress: '123 Main St', hasAttachments: true, requests: [a,b], tasks: [task(a),task(b)] };
    expect(findEmailReplyTarget(base)).toBeNull();
    expect(findEmailReplyTarget({ ...base, requests: [a], tasks: [task(a)], inReplyTo: '<unrelated@example>' })).toBeNull();
  });
});
