/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Event Deduplication & Turn Ownership Verification Suite
 * Specifically tests Phase 7 (shared numeric event_id = 235) and Phase 6 (authoritative turn ownership).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NoraVoiceSessionManager } from '../services/noraVoiceSessionManager';

describe('Phase 7: Composite Event Deduplication & Shared Event ID Collision Safety', () => {
  let manager: NoraVoiceSessionManager;

  beforeEach(() => {
    manager = new NoraVoiceSessionManager();
  });

  it('correctly distinguishes and renders both user and agent messages when they share numeric event_id = 235', () => {
    // Exact scenario from prompt:
    // User: event_id = 235, message = "What's your name?"
    // Agent: event_id = 235, message = "I'm NORA, your Nest operations assistant."

    // 1. User event arrives with event_id = 235
    manager.commitTranscriptEvent({
      sender: 'user',
      text: "What's your name?",
      eventId: 235,
      isPartial: false
    });

    // 2. Agent event arrives with the same numeric event_id = 235
    manager.commitTranscriptEvent({
      sender: 'nora',
      text: "I'm NORA, your Nest operations assistant.",
      eventId: 235,
      isPartial: false
    });

    const transcripts = manager.getTranscripts();

    // Verify exactly two messages exist
    expect(transcripts).toHaveLength(2);

    // Verify user bubble
    expect(transcripts[0].sender).toBe('user');
    expect(transcripts[0].text).toBe("What's your name?");
    expect(transcripts[0].eventId).toBe(235);

    // Verify NORA bubble
    expect(transcripts[1].sender).toBe('nora');
    expect(transcripts[1].text).toBe("I'm NORA, your Nest operations assistant.");
    expect(transcripts[1].eventId).toBe(235);

    // Verify neither message was discarded or overwritten
    expect(transcripts.filter(t => t.sender === 'user')).toHaveLength(1);
    expect(transcripts.filter(t => t.sender === 'nora')).toHaveLength(1);
  });

  it('suppresses duplicate delivery of the exact same event without adding extra bubbles', () => {
    // Deliver User turn with event_id = 450
    manager.commitTranscriptEvent({
      sender: 'user',
      text: 'Show the earnest money deposit procedure',
      eventId: 450,
      isPartial: false
    });

    // Redelivery of the exact same event
    manager.commitTranscriptEvent({
      sender: 'user',
      text: 'Show the earnest money deposit procedure',
      eventId: 450,
      isPartial: false
    });

    const transcripts = manager.getTranscripts();
    expect(transcripts).toHaveLength(1);
    expect(transcripts[0].text).toBe('Show the earnest money deposit procedure');
  });

  it('updates in-progress streaming partial transcripts rather than creating duplicate bubbles', () => {
    // Partial 1
    manager.commitTranscriptEvent({
      sender: 'nora',
      text: 'The listing launch',
      eventId: 'stream_1',
      isPartial: true
    });

    expect(manager.getTranscripts()).toHaveLength(1);
    expect(manager.getTranscripts()[0].text).toBe('The listing launch');
    expect(manager.getTranscripts()[0].isPartial).toBe(true);

    // Partial 2
    manager.commitTranscriptEvent({
      sender: 'nora',
      text: 'The listing launch procedure requires BIC review.',
      eventId: 'stream_1',
      isPartial: true
    });

    expect(manager.getTranscripts()).toHaveLength(1);
    expect(manager.getTranscripts()[0].text).toBe('The listing launch procedure requires BIC review.');
    expect(manager.getTranscripts()[0].isPartial).toBe(true);

    // Final
    manager.commitTranscriptEvent({
      sender: 'nora',
      text: 'The listing launch procedure requires BIC review.',
      eventId: 'stream_1',
      isPartial: false
    });

    expect(manager.getTranscripts()).toHaveLength(1);
    expect(manager.getTranscripts()[0].text).toBe('The listing launch procedure requires BIC review.');
    expect(manager.getTranscripts()[0].isPartial).toBe(false);
  });

  it('preserves order of multiple sequential turns across user and agent', () => {
    manager.commitTranscriptEvent({
      sender: 'user',
      text: 'Who is the BIC for Mayfaire?',
      eventId: 101
    });

    manager.commitTranscriptEvent({
      sender: 'nora',
      text: 'Jessica Keenan is Broker-in-Charge for the Mayfaire / Wilmington Central Office.',
      eventId: 102
    });

    manager.commitTranscriptEvent({
      sender: 'user',
      text: 'Who is the BIC for Carolina Beach?',
      eventId: 103
    });

    manager.commitTranscriptEvent({
      sender: 'nora',
      text: 'Eric Knight is Broker-in-Charge for the Carolina Beach / Coastal Office.',
      eventId: 104
    });

    const transcripts = manager.getTranscripts();
    expect(transcripts).toHaveLength(4);
    expect(transcripts[0].sender).toBe('user');
    expect(transcripts[1].sender).toBe('nora');
    expect(transcripts[2].sender).toBe('user');
    expect(transcripts[3].sender).toBe('nora');
    expect(transcripts[1].text).toContain('Jessica Keenan');
    expect(transcripts[3].text).toContain('Eric Knight');
  });
});
