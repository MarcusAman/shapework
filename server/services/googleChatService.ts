/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * googleChatService
 * Live Google Chat API Integration Engine for Google Workspace.
 * Handles space listing, live message threads, direct messages, and autonomous Nora AI responses.
 */

import { google } from 'googleapis';
import { NEST_FULL_ROSTER_77, DirectorySeedPerson } from '../persistence/nestRosterSeed.js';
import { NoraDatabaseGroundingService } from '../ai/noraDatabaseGroundingService.js';
import { getOAuthClient, getGoogleAccessToken } from '../integrations/google/googleOAuth.js';
import { IntegrationStateStore } from '../integrations/shared/integrationStateStore.js';

export interface GoogleChatMessage {
  id: string;
  spaceId: string;
  senderName: string;
  senderEmail: string;
  senderAvatar?: string;
  isNoraBot?: boolean;
  text: string;
  formattedText?: string;
  timestamp: string;
  attachments?: { name: string; url: string; type: string }[];
  reactions?: { emoji: string; count: number; users: string[] }[];
}

export interface GoogleChatSpace {
  id: string;
  name: string;
  type: 'dm' | 'space';
  memberCount: number;
  members: { name: string; email: string; role?: string; avatar?: string }[];
  lastMessage?: GoogleChatMessage;
  unreadCount: number;
  updatedAt: string;
  isNoraAssistant?: boolean;
}

class GoogleChatServiceEngine {
  private localSpaces: Map<string, GoogleChatSpace> = new Map();
  private localMessages: Map<string, GoogleChatMessage[]> = new Map();

  constructor() {
    this.initializeDefaultSpace();
  }

  private initializeDefaultSpace() {
    const noraDmId = 'dm_nora_ai';
    this.localSpaces.set(noraDmId, {
      id: noraDmId,
      name: 'Ask Nora (Operational AI Assistant)',
      type: 'dm',
      memberCount: 2,
      members: [
        { name: 'Nora AI', email: 'AskNora@nestrealty.com', role: 'Brokerage AI Agent' },
        { name: 'Ryan Crecelius', email: 'ryan@nestrealty.com', role: 'Principal Broker' }
      ],
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
      isNoraAssistant: true,
      lastMessage: {
        id: 'msg_nora_welcome',
        spaceId: noraDmId,
        senderName: 'Nora AI',
        senderEmail: 'AskNora@nestrealty.com',
        isNoraBot: true,
        text: "Hi Ryan! I'm connected to your Nest Google Workspace. You can tag @Nora in your 'Ask Nora' Space or send direct messages to brokers right from this drawer.",
        timestamp: new Date().toISOString()
      }
    });

    this.localMessages.set(noraDmId, [
      {
        id: 'msg_nora_welcome',
        spaceId: noraDmId,
        senderName: 'Nora AI',
        senderEmail: 'AskNora@nestrealty.com',
        isNoraBot: true,
        text: "Hi Ryan! I'm connected to your Nest Google Workspace. You can tag @Nora in your 'Ask Nora' Space or send direct messages to brokers right from this drawer.",
        timestamp: new Date().toISOString()
      }
    ]);
  }

  /**
   * Helper to retrieve active Google OAuth client for a workspace if authenticated
   */
  private async getAuthenticatedGoogleChat(workspaceId: string = 'nest-realty-demo'): Promise<{ chat: any; userEmail: string } | null> {
    try {
      const dbState = (global as any).__SHAPEWORK_DB_STATE || {};
      const store = new IntegrationStateStore(dbState);
      const connection = await store.getConnection(workspaceId, 'google_workspace');
      if (!connection || connection.status !== 'connected') {
        return null;
      }

      const saveCallback = async () => {};
      const accessToken = await getGoogleAccessToken(connection, dbState, saveCallback);
      const oauth2Client = getOAuthClient();
      oauth2Client.setCredentials({ access_token: accessToken });

      const chat = google.chat({ version: 'v1', auth: oauth2Client });
      return { chat, userEmail: connection.accountEmail || 'AskNora@nestrealty.com' };
    } catch (err: any) {
      console.warn('[GoogleChatService] Unable to get authenticated Google Chat client:', err.message);
      return null;
    }
  }

  public getRoster(): DirectorySeedPerson[] {
    return NEST_FULL_ROSTER_77;
  }

  public async getSpacesAndDMs(workspaceId: string = 'nest-realty-demo'): Promise<GoogleChatSpace[]> {
    const auth = await this.getAuthenticatedGoogleChat(workspaceId);
    
    if (auth && auth.chat) {
      try {
        const res = await auth.chat.spaces.list({ pageSize: 100 });
        const liveSpaces: any[] = res.data?.spaces || [];

        if (liveSpaces.length > 0) {
          const mapped: GoogleChatSpace[] = liveSpaces.map((s: any) => ({
            id: s.name, // e.g. "spaces/AAAAAAAAAAA"
            name: s.displayName || (s.spaceType === 'DIRECT_MESSAGE' ? 'Direct Message' : 'Google Workspace Space'),
            type: s.spaceType === 'DIRECT_MESSAGE' ? 'dm' : 'space',
            memberCount: s.membershipCount?.joinedDirectHumanUserCount || 2,
            members: [
              { name: s.displayName || 'Space Member', email: auth.userEmail, role: 'Member' }
            ],
            unreadCount: 0,
            updatedAt: new Date().toISOString(),
            isNoraAssistant: s.displayName?.toLowerCase().includes('nora') || false
          }));

          // Merge with local assistant space if not present
          const hasNoraSpace = mapped.some(s => s.name.toLowerCase().includes('nora'));
          if (!hasNoraSpace && this.localSpaces.has('dm_nora_ai')) {
            mapped.unshift(this.localSpaces.get('dm_nora_ai')!);
          }
          return mapped;
        }
      } catch (err: any) {
        console.warn('[GoogleChatService] Google Chat API spaces.list call error:', err.message);
      }
    }

    // Return active local/tracked spaces
    const list = Array.from(this.localSpaces.values());
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public async getMessages(spaceId: string, workspaceId: string = 'nest-realty-demo'): Promise<GoogleChatMessage[]> {
    const auth = await this.getAuthenticatedGoogleChat(workspaceId);

    if (auth && auth.chat && spaceId.startsWith('spaces/')) {
      try {
        const res = await auth.chat.spaces.messages.list({
          parent: spaceId,
          pageSize: 50
        });
        const liveMsgs = res.data?.messages || [];
        if (liveMsgs.length > 0) {
          return liveMsgs.map((m: any) => ({
            id: m.name || `msg_${Date.now()}`,
            spaceId,
            senderName: m.sender?.displayName || m.sender?.name || 'Google Chat User',
            senderEmail: m.sender?.email || 'user@nestrealty.com',
            isNoraBot: m.sender?.email?.toLowerCase().includes('nora') || m.text?.includes('@Nora'),
            text: m.text || m.formattedText || '',
            formattedText: m.formattedText,
            timestamp: m.createTime || new Date().toISOString()
          }));
        }
      } catch (err: any) {
        console.warn(`[GoogleChatService] Google Chat API messages.list error for ${spaceId}:`, err.message);
      }
    }

    return this.localMessages.get(spaceId) || [];
  }

  public createOrGetDirectMessage(
    recipientEmail: string,
    currentUserName: string = 'Ryan Crecelius',
    currentUserEmail: string = 'ryan@nestrealty.com'
  ): GoogleChatSpace {
    // Check if DM with this recipient already exists
    for (const space of this.localSpaces.values()) {
      if (space.type === 'dm' && space.members.some(m => m.email.toLowerCase() === recipientEmail.toLowerCase())) {
        return space;
      }
    }

    // Find person in 77-person roster or check if Nora
    const targetPerson: DirectorySeedPerson | undefined = NEST_FULL_ROSTER_77.find(
      p => p.email.toLowerCase() === recipientEmail.toLowerCase()
    );

    let spaceName = targetPerson ? targetPerson.displayName : recipientEmail.split('@')[0];
    const isNora = recipientEmail.toLowerCase().includes('nora');

    if (isNora) {
      spaceName = 'Ask Nora Assistant';
    }

    const spaceId = `dm_${recipientEmail.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
    const newSpace: GoogleChatSpace = {
      id: spaceId,
      name: spaceName,
      type: 'dm',
      memberCount: 2,
      members: [
        {
          name: spaceName,
          email: recipientEmail,
          role: targetPerson?.role || (isNora ? 'Brokerage AI Agent' : 'Broker')
        },
        {
          name: currentUserName,
          email: currentUserEmail,
          role: 'Broker'
        }
      ],
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
      isNoraAssistant: isNora
    };

    this.localSpaces.set(spaceId, newSpace);
    if (!this.localMessages.has(spaceId)) {
      this.localMessages.set(spaceId, []);
    }
    return newSpace;
  }

  public async sendMessage(params: {
    spaceId: string;
    senderName: string;
    senderEmail: string;
    text: string;
    attachments?: { name: string; url: string; type: string }[];
    workspaceId?: string;
  }): Promise<{ userMessage: GoogleChatMessage; noraReply?: GoogleChatMessage; isLiveGoogleChat?: boolean }> {
    const { spaceId, senderName, senderEmail, text, attachments, workspaceId = 'nest-realty-demo' } = params;

    let space = this.localSpaces.get(spaceId);
    if (!space && !spaceId.startsWith('spaces/')) {
      space = this.createOrGetDirectMessage(spaceId.replace('dm_', ''), senderName, senderEmail);
    }

    let isLiveGoogleChat = false;
    let liveMessageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // 1. Attempt Live Google Chat API Dispatch
    const auth = await this.getAuthenticatedGoogleChat(workspaceId);
    if (auth && auth.chat) {
      try {
        let targetSpaceName = spaceId;
        // If spaceId is a local DM key, attempt to find matching Google space or use root space
        if (!targetSpaceName.startsWith('spaces/')) {
          const spacesListRes = await auth.chat.spaces.list({ pageSize: 10 });
          const spaces = spacesListRes.data?.spaces || [];
          const matchedSpace = spaces.find((s: any) => s.displayName?.toLowerCase().includes('nora') || s.displayName?.toLowerCase().includes('ask'));
          if (matchedSpace) {
            targetSpaceName = matchedSpace.name;
          }
        }

        if (targetSpaceName.startsWith('spaces/')) {
          const createRes = await auth.chat.spaces.messages.create({
            parent: targetSpaceName,
            requestBody: {
              text: `${text}`
            }
          });
          if (createRes.data?.name) {
            liveMessageId = createRes.data.name;
            isLiveGoogleChat = true;
            console.log(`[GoogleChatService] Successfully posted live message to Google Chat: ${liveMessageId}`);
          }
        }
      } catch (err: any) {
        console.warn('[GoogleChatService] Failed to post live message to Google Chat API:', err.message);
      }
    }

    // 2. Record message locally for immediate UI reactivity
    const userMessage: GoogleChatMessage = {
      id: liveMessageId,
      spaceId,
      senderName,
      senderEmail,
      text,
      timestamp: new Date().toISOString(),
      attachments
    };

    const thread = this.localMessages.get(spaceId) || [];
    thread.push(userMessage);
    this.localMessages.set(spaceId, thread);

    if (space) {
      space.lastMessage = userMessage;
      space.updatedAt = userMessage.timestamp;
    }

    // 3. Check if Nora AI should reply:
    // Condition 1: It is Nora AI's DM
    // Condition 2: Message contains "@nora", "@Nora", or "Nora"
    const lowerText = text.toLowerCase();
    const isNoraSpace = space?.isNoraAssistant || spaceId.includes('nora');
    const shouldNoraReply = isNoraSpace || lowerText.includes('@nora') || lowerText.includes('nora,') || lowerText.startsWith('nora ');

    let noraReply: GoogleChatMessage | undefined;

    if (shouldNoraReply) {
      const cleanPrompt = text.replace(/@nora/gi, '').trim();
      let replyText = '';

      try {
        const groundedRes = await NoraDatabaseGroundingService.resolveGroundedQuery({
          query: cleanPrompt || 'Help with brokerage operations',
          userRole: 'broker',
          channel: 'google_chat'
        });

        if (groundedRes && groundedRes.spokenAnswer) {
          replyText = groundedRes.spokenAnswer;
        } else {
          replyText = `I'm on it! I've noted: "${cleanPrompt}". Let me know if you'd like me to draft an offer, check 3-day trust deposits, or sync to Google Drive.`;
        }
      } catch (err: any) {
        replyText = `Got it! I processed your request: "${cleanPrompt}". You can check our Google Drive Vault or ask me for MLS comps.`;
      }

      let noraLiveId = `msg_nora_${Date.now()}`;

      // If live Google Chat is connected, also broadcast Nora's reply back to Google Chat
      if (auth && auth.chat && spaceId.startsWith('spaces/')) {
        try {
          const noraLiveRes = await auth.chat.spaces.messages.create({
            parent: spaceId,
            requestBody: { text: replyText }
          });
          if (noraLiveRes.data?.name) {
            noraLiveId = noraLiveRes.data.name;
          }
        } catch (e: any) {
          console.warn('[GoogleChatService] Failed to post Nora reply to Google Chat API:', e.message);
        }
      }

      noraReply = {
        id: noraLiveId,
        spaceId,
        senderName: 'Nora AI',
        senderEmail: 'AskNora@nestrealty.com',
        isNoraBot: true,
        text: replyText,
        timestamp: new Date().toISOString()
      };

      thread.push(noraReply);
      this.localMessages.set(spaceId, thread);

      if (space) {
        space.lastMessage = noraReply;
        space.updatedAt = noraReply.timestamp;
      }
    }

    return { userMessage, noraReply, isLiveGoogleChat };
  }
}

export const GoogleChatService = new GoogleChatServiceEngine();
