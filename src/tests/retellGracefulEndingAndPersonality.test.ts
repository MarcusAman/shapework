import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { processUserUtterance } from '../services/voice-agent/transcriptRouter';
import { initialRuntimeState } from '../services/voice-agent/agentRuntimeReducer';

describe('Retell Graceful Call Ending Protocol & Coastal Personality Suite', () => {
  const baseState = { ...initialRuntimeState };

  describe('1. Retell Prompt Specification Standards', () => {
    it('verifies ask_nest_ops_retell_agent_prompt.md contains 3-Phase Graceful Wrap-Up Protocol', () => {
      const promptPath = path.resolve(__dirname, '../../server/knowledge/ask_nest_ops_retell_agent_prompt.md');
      const promptContent = fs.readFileSync(promptPath, 'utf8');

      expect(promptContent).toContain('3-Phase Graceful Wrap-Up Protocol');
      expect(promptContent).toContain('Phase 1 (Assistance Check)');
      expect(promptContent).toContain('Phase 2 (Warm Closing Wish on \'No / That\'s all\')');
      expect(promptContent).toContain('Phase 3 (Explicit Farewell & Disconnect)');
      expect(promptContent).toContain('STRICT PROHIBITION ON ABRUPT HANG-UPS');
      expect(promptContent).toContain('Never trigger `end_call` immediately after taking an order or delivering an answer');
      expect(promptContent).toContain('Always wait for the caller to say "Bye" or "Goodbye" before hanging up');
    });

    it('verifies Warm Coastal Real Estate Colleague personality definition', () => {
      const promptPath = path.resolve(__dirname, '../../server/knowledge/ask_nest_ops_retell_agent_prompt.md');
      const promptContent = fs.readFileSync(promptPath, 'utf8');

      expect(promptContent).toContain('Warm Coastal Real Estate Colleague');
      expect(promptContent).toContain('Congrats on the new listing!');
      expect(promptContent).toContain('First Name Usage');
    });
  });

  describe('2. Conversational Gratitude Intent Classification', () => {
    it('recognizes "Thanks Nora" and responds warmly without hanging up', () => {
      const result = processUserUtterance('Thanks Nora!', baseState, 'Matt');
      expect(result.intentType).toBe('CONVERSATIONAL_GRATITUDE');
      expect(result.category).toBe('conversation_control');
      expect(result.spokenResponse).toContain("You're so welcome!");
      expect(result.displayResponse).toContain("You're very welcome!");
    });

    it('recognizes "Thank you so much" as gratitude', () => {
      const result = processUserUtterance('Thank you so much', baseState, 'Sarah');
      expect(result.intentType).toBe('CONVERSATIONAL_GRATITUDE');
      expect(result.spokenResponse).toContain("You're so welcome!");
    });

    it('recognizes "Appreciate your help"', () => {
      const result = processUserUtterance('Appreciate your help', baseState, 'Ryan');
      expect(result.intentType).toBe('CONVERSATIONAL_GRATITUDE');
      expect(result.spokenResponse).toContain("You're so welcome!");
    });
  });

  describe('3. Conversational Farewell Intent Classification', () => {
    it('recognizes "Bye Nora!" as explicit farewell turn', () => {
      const result = processUserUtterance('Bye Nora!', baseState, 'Matt');
      expect(result.intentType).toBe('CONVERSATIONAL_FAREWELL');
      expect(result.category).toBe('conversation_control');
      expect(result.spokenResponse).toContain('take care');
      expect(result.displayResponse).toContain('Goodbye!');
    });

    it('recognizes "Goodbye" as farewell turn', () => {
      const result = processUserUtterance('Goodbye', baseState, 'Sarah');
      expect(result.intentType).toBe('CONVERSATIONAL_FAREWELL');
      expect(result.spokenResponse).toContain('fantastic day');
    });

    it('recognizes "See ya later" as farewell turn', () => {
      const result = processUserUtterance('See you later', baseState, 'Marcus');
      expect(result.intentType).toBe('CONVERSATIONAL_FAREWELL');
      expect(result.spokenResponse).toContain('take care');
    });

    it('recognizes "Have a great day" as farewell turn', () => {
      const result = processUserUtterance('Have a great day', baseState, 'Ryan');
      expect(result.intentType).toBe('CONVERSATIONAL_FAREWELL');
      expect(result.spokenResponse).toContain('fantastic day');
    });
  });
});
