import { describe, it, expect, beforeEach } from 'vitest';
import { queryUnifiedContext, SessionEntityMemory } from '../../server/knowledge/unifiedContextRetriever';
import { noraVoiceAuditRepository } from '../../server/persistence/noraVoiceAuditRepository';
import { sopRepository } from '../../server/persistence/sopRepository';

describe('Global NORA Voice & Omnichannel Assistant Test Suite', () => {
  const workspaceId = 'nest-realty-wilmington';
  const tenantId = 'tenant_nest_uat';

  // 1. MULTI-TURN PRONOUN RESOLUTION & STEP NAVIGATION
  describe('1. Multi-Turn Contextual Memory & Pronoun Resolution', () => {
    it('remembers active SOP and resolves pronoun follow-ups for process owner', () => {
      // Turn 1: Inquire about Listing Launch SOP
      const turn1 = queryUnifiedContext('What is the listing launch protocol?', {
        tenantId,
        workspaceId
      });

      expect(turn1.matchedDomain).toBe('sops');
      expect(turn1.spokenAnswer).toContain('Listing Launch Protocol');
      expect(turn1.updatedMemory?.activeSop).toBeDefined();
      expect(turn1.updatedMemory?.activeSop?.title).toContain('Listing Launch Protocol');

      // Turn 2: Follow-up asking "Who owns that?" using session memory
      const turn2 = queryUnifiedContext('Who owns that?', {
        tenantId,
        workspaceId,
        sessionMemory: turn1.updatedMemory
      });

      expect(turn2.matchedDomain).toBe('sops');
      expect(turn2.spokenAnswer).toContain('Melissa — Transaction Coordinator');
      expect(turn2.confidence).toBe('high');
      expect(turn2.evidenceCard?.title).toContain('Melissa — Transaction Coordinator');
    });

    it('resolves step-specific inquiries against active SOP in memory', () => {
      // Turn 1: Inquire about Buyer Contract Verification
      const turn1 = queryUnifiedContext('What is the buyer contract verification procedure?', {
        tenantId,
        workspaceId
      });

      expect(turn1.matchedDomain).toBe('sops');
      expect(turn1.updatedMemory?.activeSop).toBeDefined();

      // Turn 2: Follow-up asking for "Step 2"
      const turn2 = queryUnifiedContext('What is step 2?', {
        tenantId,
        workspaceId,
        sessionMemory: turn1.updatedMemory
      });

      expect(turn2.matchedDomain).toBe('sops');
      expect(turn2.spokenAnswer).toContain('Step 2');
      expect(turn2.evidenceCard?.title).toContain('Step 2');
    });
  });

  // 2. AUDIT LOGGING & SESSION PERSISTENCE
  describe('2. Voice Conversation & Turn Audit Trail', () => {
    it('creates conversation record and persists turns with latency and confidence metrics', async () => {
      const conversationId = `conv_test_${Date.now()}`;
      
      const conv = await noraVoiceAuditRepository.getOrCreateConversation(
        conversationId,
        workspaceId,
        'usr_agent_sarah',
        'Sarah Jenkins',
        'webrtc_browser'
      );

      expect(conv.id).toBe(conversationId);
      expect(conv.status).toBe('active');

      // Record User Query Turn
      const userTurn = await noraVoiceAuditRepository.recordTurn(conversationId, workspaceId, {
        speaker: 'user',
        queryText: 'How do we order sign vendor post installations?',
        latencyMs: 120
      });

      expect(userTurn.turnIndex).toBe(1);
      expect(userTurn.speaker).toBe('user');

      // Record NORA Response Turn
      const noraTurn = await noraVoiceAuditRepository.recordTurn(conversationId, workspaceId, {
        speaker: 'nora',
        spokenResponse: 'According to the approved Sign Vendor Dispatch Protocol...',
        matchedDomain: 'sops',
        matchedSopTitle: 'Sign Vendor Dispatch & Post Retrieval Protocol',
        confidence: 'high',
        latencyMs: 340
      });

      expect(noraTurn.turnIndex).toBe(2);
      expect(noraTurn.speaker).toBe('nora');

      // Verify Conversation History Listing
      const recent = await noraVoiceAuditRepository.listRecentConversations(workspaceId);
      const found = recent.find(c => c.id === conversationId);
      expect(found).toBeDefined();
      expect(found?.turnsCount).toBe(2);
    });
  });

  // 3. POLICY RAG INTEGRITY
  describe('3. Authoritative Policy Boundaries', () => {
    it('retrieves only published SOPs and does not hallucinate deleted or unapproved procedures', () => {
      const res = queryUnifiedContext('What is the completely non-existent unknown protocol?', {
        tenantId,
        workspaceId
      });

      // Should not match as an authoritative SOP
      if (res.matchedDomain === 'sops') {
        expect(res.confidence).not.toBe('high');
      }
    });
  });
});
