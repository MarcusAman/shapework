import { describe, it, expect } from 'vitest';
import { GoogleChatService } from '../../server/services/googleChatService';

describe('Google Chat & Brokerage Directory Service Suite', () => {
  it('1. Loads the complete 77-member Google Workspace directory', () => {
    const roster = GoogleChatService.getRoster();
    expect(roster.length).toBe(77);
    const ryan = roster.find(p => p.firstName === 'Ryan' && p.lastName === 'Crecelius');
    expect(ryan).toBeDefined();
    expect(ryan?.email).toBe('ryan@nestrealty.com');
  });

  it('2. Retrieves default team spaces and Nora AI 1-on-1 assistant', async () => {
    const spaces = await GoogleChatService.getSpacesAndDMs();
    expect(spaces.length).toBeGreaterThanOrEqual(1);
    const noraSpace = spaces.find(s => s.isNoraAssistant);
    expect(noraSpace).toBeDefined();
    expect(noraSpace?.name).toContain('Nora');
  });

  it('3. Creates a new direct message thread with any broker in the 77-member roster', () => {
    const dm = GoogleChatService.createOrGetDirectMessage(
      'chris.brown@nestrealty.com',
      'Ryan Crecelius',
      'ryan@nestrealty.com'
    );
    expect(dm).toBeDefined();
    expect(dm.id).toContain('chris_brown');
    expect(dm.members.length).toBe(2);
    expect(dm.members.some(m => m.email === 'chris.brown@nestrealty.com')).toBe(true);
  });

  it('4. Sends message between brokers and stores message in thread', async () => {
    const dm = GoogleChatService.createOrGetDirectMessage('ann.gunn@nestrealty.com');
    const result = await GoogleChatService.sendMessage({
      spaceId: dm.id,
      senderName: 'Ryan Crecelius',
      senderEmail: 'ryan@nestrealty.com',
      text: 'Hey Ann, can you review the contract on 312 Mayfaire Way?'
    });

    expect(result.userMessage).toBeDefined();
    expect(result.userMessage.text).toContain('312 Mayfaire Way');

    const messages = await GoogleChatService.getMessages(dm.id);
    expect(messages.some(m => m.text.includes('312 Mayfaire Way'))).toBe(true);
  });

  it('5. Autonomously generates grounded Nora AI reply when @Nora is tagged', async () => {
    const wilmSpace = 'space_wilmington_all';
    const result = await GoogleChatService.sendMessage({
      spaceId: wilmSpace,
      senderName: 'Ryan Crecelius',
      senderEmail: 'ryan@nestrealty.com',
      text: '@Nora what are the 3-day banking rules for earnest money deposits under NCREC Rule 58A?'
    });

    expect(result.userMessage).toBeDefined();
    expect(result.noraReply).toBeDefined();
    expect(result.noraReply?.isNoraBot).toBe(true);
    expect(result.noraReply?.senderName).toBe('Nora AI');
    expect(result.noraReply?.text).toBeDefined();
  });
});
