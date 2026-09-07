import { describe, it, expect } from 'vitest';
import { GoogleYouTubeService } from '../../server/services/googleYouTubeService.js';
import { executeGoogleYouTubeTool } from '../../server/ai/tools/googleYouTubeMcpTools.js';

describe('YouTube Data API (v3) Service Suite', () => {
  it('1. Retrieves default channel playlists and seeded listing videos', () => {
    const playlists = GoogleYouTubeService.getPlaylists();
    expect(playlists.length).toBeGreaterThanOrEqual(4);
    expect(playlists.some(p => p.title === 'Luxury Coastal Tours')).toBe(true);
    expect(playlists.some(p => p.title === 'Broker Training Academy & SOPs')).toBe(true);

    const videos = GoogleYouTubeService.getVideos();
    expect(videos.length).toBeGreaterThanOrEqual(1);
    expect(videos[0].watchUrl).toContain('youtube.com/watch?v=');
  });

  it('2. Publishes a new luxury listing property walkthrough video', async () => {
    const video = await GoogleYouTubeService.publishListingVideo({
      propertyAddress: '104 Live Oak Dr, Wrightsville Beach NC',
      listPrice: '$1,850,000',
      specs: { beds: 4, baths: 4.5, sqft: 3650 },
      agentName: 'Melissa Gagliardi',
      agentTitle: 'Luxury Specialist & Partner',
      privacyStatus: 'unlisted',
      playlistCategory: 'Luxury Coastal Tours'
    });

    expect(video.id).toBeDefined();
    expect(video.propertyAddress).toBe('104 Live Oak Dr, Wrightsville Beach NC');
    expect(video.privacyStatus).toBe('unlisted');
    expect(video.watchUrl).toBeDefined();
    expect(video.description).toContain('Melissa Gagliardi');
    expect(video.description).toContain('$1,850,000');

    const fetched = GoogleYouTubeService.getVideoById(video.id);
    expect(fetched).toBeDefined();
  });

  it('3. Fetches engagement analytics for a published video', () => {
    const analytics = GoogleYouTubeService.getVideoAnalytics('v_ocean_blvd_2026');
    expect(analytics.viewCount).toBeGreaterThan(0);
    expect(analytics.duration).toBeDefined();
    expect(analytics.engagementRate).toBeDefined();
  });

  it('4. Searches brokerage YouTube channel for property walkthroughs', async () => {
    const results = await GoogleYouTubeService.searchChannelVideos('Ocean Blvd');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].propertyAddress).toContain('Ocean');
  });

  it('5. Executes YouTube tools via Nora AI tool caller', async () => {
    const aiVideo = await executeGoogleYouTubeTool('publish_youtube_listing_video', {
      propertyAddress: '518 Chestnut St, Wilmington NC',
      listPrice: '$625,000',
      beds: 3,
      baths: 2,
      sqft: 2200,
      agentName: 'Ann Gunn',
      playlistCategory: 'Downtown & Historic District'
    });

    expect(aiVideo.id).toBeDefined();
    expect(aiVideo.playlistCategory).toBe('Downtown & Historic District');

    const searchRes = await executeGoogleYouTubeTool('search_youtube_channel_videos', {
      query: 'Chestnut'
    });
    expect(searchRes.length).toBeGreaterThanOrEqual(1);

    const playlists = await executeGoogleYouTubeTool('get_youtube_channel_playlists', {});
    expect(playlists.length).toBeGreaterThanOrEqual(4);
  });
});
