import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  expandConversationalTranscript,
  getCallAudioStream,
  streamLocalAudioFile
} from '../../server/integrations/marketingCallsService';
import { parseTranscriptTurns } from '../components/marketing/CallsTableView';

describe('Telephony Call ID Visibility & Real Audio Engine Suite', () => {
  describe('1. Conversational Dialogue Turn Parser (parseTranscriptTurns)', () => {
    it('correctly parses multi-turn dialogue into speech turns with AI identification', () => {
      const sample = [
        "Ask Nora (Voice Agent): Thanks for calling Nest Realty! How can I help you today?",
        "Matt Orr: Hi Nora, I have a new listing on Wrightsville Ave and need flyers.",
        "Ask Nora (Voice Agent): Got it! What is the price and square footage?",
        "Matt Orr: $895,000 and around 3,100 square feet.",
        "Ask Nora (Voice Agent): Wonderful. I have logged your marketing package request."
      ].join('\n');

      const turns = parseTranscriptTurns(sample, 'Matt Orr');
      expect(turns).toHaveLength(5);
      expect(turns[0].isAi).toBe(true);
      expect(turns[0].speaker).toContain('Ask Nora');
      expect(turns[0].text).toContain('Thanks for calling Nest Realty');

      expect(turns[1].isAi).toBe(false);
      expect(turns[1].speaker).toBe('Matt Orr');
      expect(turns[1].text).toContain('Wrightsville Ave');

      expect(turns[2].isAi).toBe(true);
      expect(turns[3].isAi).toBe(false);
      expect(turns[4].isAi).toBe(true);
    });

    it('falls back gracefully to caller name when no speaker prefix exists', () => {
      const singleLine = 'Inbound caller requested 50 property brochures for 1204 Military Cutoff.';
      const turns = parseTranscriptTurns(singleLine, 'Julie Brown');
      expect(turns).toHaveLength(1);
      expect(turns[0].isAi).toBe(false);
      expect(turns[0].speaker).toBe('Julie Brown');
      expect(turns[0].text).toBe(singleLine);
    });

    it('returns empty array when transcript is empty or undefined', () => {
      expect(parseTranscriptTurns(undefined)).toEqual([]);
      expect(parseTranscriptTurns('')).toEqual([]);
    });
  });

  describe('2. Conversational Transcript Expansion (expandConversationalTranscript)', () => {
    it('expands concise water bottle / facilities request into multi-turn dialogue', () => {
      const summary = 'Caller Matt Orr requested more water bottles restocked at Mayfaire office.';
      const expanded = expandConversationalTranscript(summary, 'Matt Orr', 'Mayfaire office', 'Facilities');

      expect(expanded).toContain('Nora:');
      expect(expanded).toContain('Matt Orr:');
      expect(expanded).toContain('water bottles');
      expect(expanded).toContain('Ann Gunn');

      const turns = parseTranscriptTurns(expanded, 'Matt Orr');
      expect(turns.length).toBeGreaterThanOrEqual(4);
      expect(turns[0].isAi).toBe(true);
      expect(turns[0].speaker).toBe('Ask Nora (Voice Agent)');
    });

    it('preserves existing multi-turn dialogue without overwriting', () => {
      const multi = [
        "Nora: Hi there!",
        "User: Hello.",
        "Nora: How can I help you?",
        "User: All good thanks."
      ].join('\n');

      const result = expandConversationalTranscript(multi);
      expect(result).toBe(multi);
    });
  });

  describe('3. Frontend Calls Table & Drawer Call ID Prominence', () => {
    const viewPath = path.resolve(process.cwd(), 'src/components/marketing/CallsTableView.tsx');
    const content = fs.readFileSync(viewPath, 'utf-8');

    it('includes data-testid="drawer-call-id-header" in drawer header with copy action', () => {
      expect(content).toContain('data-testid="drawer-call-id-header"');
      expect(content).toContain('{drawerCall.id}');
      expect(content).toContain("handleCopyText(drawerCall.id, 'Call ID')");
    });

    it('includes data-testid="banner-call-id" in the active top audio banner', () => {
      expect(content).toContain('data-testid="banner-call-id"');
      expect(content).toContain('ID: {activePlayingCall.id}');
    });

    it('renders copyable Call ID chip on each table row', () => {
      expect(content).toContain('data-testid={`call-row-id-${c.id}`}');
      expect(content).toContain('handleCopyText(c.id, \'Call ID\')');
    });

    it('renders conversational bubble styles with brand green for Ask Nora and white for caller', () => {
      expect(content).toContain('bg-[#E5EFEA]');
      expect(content).toContain('Ask Nora (Voice Agent)');
      expect(content).toContain('parseTranscriptTurns');
    });
  });

  describe('4. Byte-Range Streaming Audio Engine', () => {
    it('streamLocalAudioFile calculates byte range slices and 206 Partial Content', () => {
      const testFilePath = path.resolve(process.cwd(), 'package.json');
      const stat = fs.statSync(testFilePath);
      const total = stat.size;

      const result = streamLocalAudioFile(testFilePath, 'bytes=0-49', 'application/json');
      expect(result.statusCode).toBe(206);
      expect(result.acceptRanges).toBe('bytes');
      expect(result.contentLength).toBe('50');
      expect(result.contentRange).toBe(`bytes 0-49/${total}`);
      expect(typeof result.pipe).toBe('function');
    });

    it('streamLocalAudioFile streams whole file with 200 OK when no range header is provided', () => {
      const testFilePath = path.resolve(process.cwd(), 'package.json');
      const stat = fs.statSync(testFilePath);

      const result = streamLocalAudioFile(testFilePath, undefined, 'application/json');
      expect(result.statusCode).toBe(200);
      expect(result.acceptRanges).toBe('bytes');
      expect(result.contentLength).toBe(String(stat.size));
      expect(result.contentRange).toBeUndefined();
    });
  });

  describe('5. Authentic Call Audio Policy & Default All-Calls Timeframe', () => {
    const viewPath = path.resolve(process.cwd(), 'src/components/marketing/CallsTableView.tsx');
    const viewContent = fs.readFileSync(viewPath, 'utf-8');

    it('defaults callsTimeframe state to "all" so 50+ recent calls show immediately', () => {
      expect(viewContent).toContain("useState<'today' | 'all'>(initialTimeframe || 'all')");
    });

    it('prioritizes proxy audio endpoint over raw signed URL in table player', () => {
      expect(viewContent).toContain("call.audioUrl || `/api/marketing/calls/${call.id}/audio`");
    });

    it('preserves authentic Retell dialogue with Agent: and User: prefixes in expandConversationalTranscript', () => {
      const authentic = [
        "Agent: Thanks for calling Nest. I'm Nora. Who am I speaking with?",
        "User: Hi Nora, this is Matt Orr."
      ].join('\n');
      const result = expandConversationalTranscript(authentic, 'Matt Orr', 'Mayfaire Office');
      expect(result).toBe(authentic);
    });

    it('returns null cleanly instead of synthesizing fake ElevenLabs voice when call audio is unavailable', async () => {
      const nonExistentCallId = 'call_non_existent_recording_test_12345';
      const stream = await getCallAudioStream(nonExistentCallId, undefined, 'ws_wilmington');
      expect(stream).toBeNull();
    });
  });
});
