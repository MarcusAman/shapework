/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * googleYouTubeMcpTools
 * Gemini tool definitions and execution handlers for YouTube Data API (v3).
 */

import { GoogleYouTubeService } from '../../services/googleYouTubeService.js';

export const googleYouTubeFunctionDeclarations = [
  {
    name: 'publish_youtube_listing_video',
    description: 'Publish a cinematic property walkthrough video to the Nest Realty YouTube channel with SEO tags, specs, agent details, and playlist assignment.',
    parameters: {
      type: 'OBJECT',
      properties: {
        propertyAddress: {
          type: 'STRING',
          description: 'Property address (e.g. "104 Live Oak Dr, Wrightsville Beach NC").'
        },
        listPrice: {
          type: 'STRING',
          description: 'List price (e.g. "$1,850,000").'
        },
        beds: {
          type: 'NUMBER',
          description: 'Bedroom count.'
        },
        baths: {
          type: 'NUMBER',
          description: 'Bathroom count.'
        },
        sqft: {
          type: 'NUMBER',
          description: 'Heated square footage.'
        },
        agentName: {
          type: 'STRING',
          description: 'Presenting agent name.'
        },
        playlistCategory: {
          type: 'STRING',
          description: 'Playlist: "Luxury Coastal Tours", "Downtown & Historic District", "New Construction & Communities", or "Broker Training Academy & SOPs".'
        },
        privacyStatus: {
          type: 'STRING',
          description: 'Privacy: "unlisted", "public", or "private".'
        }
      },
      required: ['propertyAddress', 'listPrice', 'beds', 'baths', 'sqft']
    }
  },
  {
    name: 'search_youtube_channel_videos',
    description: 'Search the Nest Realty YouTube channel for property walkthroughs, video tours, and agent training masterminds.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'Search term (e.g. address, neighborhood, or topic).'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_youtube_video_analytics',
    description: 'Fetch view counts, likes, and engagement metrics for a YouTube property walkthrough video.',
    parameters: {
      type: 'OBJECT',
      properties: {
        videoId: {
          type: 'STRING',
          description: 'The YouTube video ID.'
        }
      },
      required: ['videoId']
    }
  },
  {
    name: 'get_youtube_channel_playlists',
    description: 'Retrieve all organized YouTube playlists on the brokerage channel.',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  }
];

export async function executeGoogleYouTubeTool(toolName: string, args: any, workspaceId: string = 'nest-realty-demo'): Promise<any> {
  switch (toolName) {
    case 'publish_youtube_listing_video':
      return await GoogleYouTubeService.publishListingVideo({
        propertyAddress: args.propertyAddress,
        listPrice: args.listPrice,
        specs: {
          beds: args.beds || 4,
          baths: args.baths || 3.5,
          sqft: args.sqft || 3000
        },
        agentName: args.agentName,
        playlistCategory: args.playlistCategory,
        privacyStatus: args.privacyStatus,
        workspaceId
      });

    case 'search_youtube_channel_videos':
      return await GoogleYouTubeService.searchChannelVideos(args.query, workspaceId);

    case 'get_youtube_video_analytics':
      return GoogleYouTubeService.getVideoAnalytics(args.videoId);

    case 'get_youtube_channel_playlists':
      return GoogleYouTubeService.getPlaylists();

    default:
      throw new Error(`Unknown Google YouTube tool: ${toolName}`);
  }
}
