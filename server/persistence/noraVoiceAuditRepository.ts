/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { dbPool } from './repositories.js';

export interface NoraVoiceTurnRecord {
  id: string;
  conversationId: string;
  workspaceId: string;
  turnIndex: number;
  speaker: 'user' | 'nora' | 'system';
  queryText?: string;
  spokenResponse?: string;
  displayResponse?: string;
  matchedDomain?: string;
  matchedSopId?: string;
  matchedSopTitle?: string;
  confidence?: string;
  needsEscalation?: boolean;
  latencyMs?: number;
  createdAt: string;
}

export interface NoraVoiceConversationRecord {
  id: string;
  workspaceId: string;
  userId?: string;
  userName?: string;
  channel: 'webrtc_browser' | 'phone_twilio' | 'sms';
  status: 'active' | 'completed' | 'escalated';
  turnsCount: number;
  lastSopId?: string;
  lastSopTitle?: string;
  turns: NoraVoiceTurnRecord[];
  createdAt: string;
  updatedAt: string;
}

// In-Memory Fallback Storage
const memoryConversations: Map<string, NoraVoiceConversationRecord> = new Map();

export const noraVoiceAuditRepository = {
  async getOrCreateConversation(
    conversationId: string,
    workspaceId: string,
    userId?: string,
    userName?: string,
    channel: 'webrtc_browser' | 'phone_twilio' | 'sms' = 'webrtc_browser'
  ): Promise<NoraVoiceConversationRecord> {
    if (dbPool) {
      try {
        const res = await dbPool.query(
          'SELECT * FROM nora_voice_conversations WHERE id = $1',
          [conversationId]
        );
        if (res.rows.length > 0) {
          const row = res.rows[0];
          const turnsRes = await dbPool.query(
            'SELECT * FROM nora_voice_turns WHERE conversation_id = $1 ORDER BY turn_index ASC',
            [conversationId]
          );
          return {
            id: row.id,
            workspaceId: row.workspace_id,
            userId: row.user_id,
            userName: row.user_name,
            channel: row.channel,
            status: row.status,
            turnsCount: row.turns_count,
            lastSopId: row.last_sop_id,
            lastSopTitle: row.last_sop_title,
            turns: turnsRes.rows.map(t => ({
              id: t.id,
              conversationId: t.conversation_id,
              workspaceId: t.workspace_id,
              turnIndex: t.turn_index,
              speaker: t.speaker,
              queryText: t.query_text,
              spokenResponse: t.spoken_response,
              displayResponse: t.display_response,
              matchedDomain: t.matched_domain,
              matchedSopId: t.matched_sop_id,
              matchedSopTitle: t.matched_sop_title,
              confidence: t.confidence,
              needsEscalation: t.needs_escalation,
              latencyMs: t.latency_ms,
              createdAt: t.created_at
            })),
            createdAt: row.created_at,
            updatedAt: row.updated_at
          };
        }

        // Insert new conversation
        const now = new Date().toISOString();
        await dbPool.query(
          `INSERT INTO nora_voice_conversations 
           (id, workspace_id, user_id, user_name, channel, status, turns_count, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [conversationId, workspaceId, userId || 'usr_anonymous', userName || 'Agent / Staff', channel, 'active', 0, now, now]
        );
        return {
          id: conversationId,
          workspaceId,
          userId,
          userName,
          channel,
          status: 'active',
          turnsCount: 0,
          turns: [],
          createdAt: now,
          updatedAt: now
        };
      } catch (err) {
        console.error('[NoraVoiceAuditRepository] DB error:', err);
      }
    }

    // Memory Mode
    let conv = memoryConversations.get(conversationId);
    if (!conv) {
      const now = new Date().toISOString();
      conv = {
        id: conversationId,
        workspaceId,
        userId,
        userName,
        channel,
        status: 'active',
        turnsCount: 0,
        turns: [],
        createdAt: now,
        updatedAt: now
      };
      memoryConversations.set(conversationId, conv);
    }
    return conv;
  },

  async recordTurn(
    conversationId: string,
    workspaceId: string,
    turnData: {
      speaker: 'user' | 'nora' | 'system';
      queryText?: string;
      spokenResponse?: string;
      displayResponse?: string;
      matchedDomain?: string;
      matchedSopId?: string;
      matchedSopTitle?: string;
      confidence?: string;
      needsEscalation?: boolean;
      latencyMs?: number;
    }
  ): Promise<NoraVoiceTurnRecord> {
    const turnId = `turn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const conv = await this.getOrCreateConversation(conversationId, workspaceId);
    const turnIndex = conv.turnsCount + 1;

    const record: NoraVoiceTurnRecord = {
      id: turnId,
      conversationId,
      workspaceId,
      turnIndex,
      ...turnData,
      createdAt: now
    };

    if (dbPool) {
      try {
        await dbPool.query(
          `INSERT INTO nora_voice_turns 
           (id, conversation_id, workspace_id, turn_index, speaker, query_text, spoken_response, display_response, matched_domain, matched_sop_id, matched_sop_title, confidence, needs_escalation, latency_ms, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            turnId, conversationId, workspaceId, turnIndex, turnData.speaker,
            turnData.queryText || null, turnData.spokenResponse || null, turnData.displayResponse || null,
            turnData.matchedDomain || null, turnData.matchedSopId || null, turnData.matchedSopTitle || null,
            turnData.confidence || null, turnData.needsEscalation || false, turnData.latencyMs || null,
            now
          ]
        );
        await dbPool.query(
          `UPDATE nora_voice_conversations 
           SET turns_count = turns_count + 1, last_sop_id = COALESCE($1, last_sop_id), last_sop_title = COALESCE($2, last_sop_title), updated_at = $3
           WHERE id = $4`,
          [turnData.matchedSopId || null, turnData.matchedSopTitle || null, now, conversationId]
        );
      } catch (err) {
        console.error('[NoraVoiceAuditRepository] DB recordTurn error:', err);
      }
    }

    // Update memory cache
    conv.turnsCount = turnIndex;
    if (turnData.matchedSopId) conv.lastSopId = turnData.matchedSopId;
    if (turnData.matchedSopTitle) conv.lastSopTitle = turnData.matchedSopTitle;
    conv.turns.push(record);
    conv.updatedAt = now;
    memoryConversations.set(conversationId, conv);

    return record;
  },

  async listRecentConversations(workspaceId: string, limit = 20): Promise<NoraVoiceConversationRecord[]> {
    if (dbPool) {
      try {
        const res = await dbPool.query(
          'SELECT * FROM nora_voice_conversations WHERE workspace_id = $1 ORDER BY updated_at DESC LIMIT $2',
          [workspaceId, limit]
        );
        return res.rows.map(row => ({
          id: row.id,
          workspaceId: row.workspace_id,
          userId: row.user_id,
          userName: row.user_name,
          channel: row.channel,
          status: row.status,
          turnsCount: row.turns_count,
          lastSopId: row.last_sop_id,
          lastSopTitle: row.last_sop_title,
          turns: [],
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
      } catch (err) {
        console.error('[NoraVoiceAuditRepository] DB list error:', err);
      }
    }

    return Array.from(memoryConversations.values())
      .filter(c => c.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }
};
