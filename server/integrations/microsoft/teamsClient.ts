/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getMicrosoftGraphClient } from './graphClient.js';

export interface TeamsMessage {
  id: string;
  chatId?: string;
  channelId?: string;
  teamId?: string;
  body?: {
    content?: string;
  };
  from?: {
    user?: {
      id?: string;
      displayName?: string;
    };
  };
  createdDateTime?: string;
  webUrl?: string;
}

export async function fetchRecentTeamsMessages(
  accessToken: string,
  teamId = 'mock-team-123',
  channelId = 'mock-channel-456'
): Promise<TeamsMessage[]> {
  if (process.env.MOCK_INTEGRATIONS === 'true' || accessToken.startsWith('dev_mock_')) {
    return [
      {
        id: 'teams_msg_1',
        teamId,
        channelId,
        body: { content: 'Hey @owner, we have an unassigned escrow lead at 109 Woodlawn.' },
        from: { user: { id: 'usr_staff_1', displayName: 'Sarah Jenkins' } },
        createdDateTime: new Date().toISOString(),
        webUrl: 'https://teams.microsoft.com/l/message/mock-channel-456'
      },
      {
        id: 'teams_msg_2',
        teamId,
        channelId,
        body: { content: 'Is anyone monitoring the marketing coordination thread for Woodlawn?' },
        from: { user: { id: 'usr_staff_2', displayName: 'Michael Agent' } },
        createdDateTime: new Date(Date.now() - 25 * 3600 * 1000).toISOString(), // > 24 hours ago
        webUrl: 'https://teams.microsoft.com/l/message/mock-channel-456'
      }
    ];
  }

  const client = getMicrosoftGraphClient(accessToken);
  try {
    // Fetch from a specific channel's message list
    const res = await client.api(`/teams/${teamId}/channels/${channelId}/messages`)
      .top(20)
      .get();
    return (res.value || []) as TeamsMessage[];
  } catch (err: any) {
    console.error('[Teams Client] Failed to fetch channel messages:', err.message);
    throw new Error(`Teams Graph API failure: ${err.message}`);
  }
}
