import { describe, it, expect } from 'vitest';
import { NoraVideoStudioService } from '../../server/services/noraVideoStudioService';

describe('Nora Video Studio & Teleprompter Suite', () => {
  it('1. Generates 30s TikTok/Reels script with viral hook, B-roll shot list, and teleprompter text', () => {
    const script = NoraVideoStudioService.generateVideoScript({
      propertyAddress: '312 Mayfaire Way, Wilmington NC',
      format: 'tiktok_reels_30s',
      price: '$720,000',
      agentName: 'Ryan Crecelius'
    });

    expect(script).toBeDefined();
    expect(script.format).toBe('tiktok_reels_30s');
    expect(script.estimatedDurationSeconds).toBe(30);
    expect(script.segments.length).toBe(4);
    expect(script.segments[0].timeCode).toBe('0:00 - 0:05');
    expect(script.segments[0].cameraDirection).toContain('Push-in');
    expect(script.teleprompterText).toContain('312 Mayfaire Way');
  });

  it('2. Generates 2-minute YouTube luxury home tour script with cinematic pacing', () => {
    const script = NoraVideoStudioService.generateVideoScript({
      propertyAddress: '742 Lumina Avenue, Wrightsville Beach NC',
      format: 'youtube_luxury_2min',
      price: '$1,950,000',
      agentName: 'Ryan Crecelius'
    });

    expect(script.format).toBe('youtube_luxury_2min');
    expect(script.estimatedDurationSeconds).toBe(120);
    expect(script.segments.length).toBe(5);
    expect(script.suggestedMusicVibe).toContain('Cinematic');
  });

  it('3. Returns curated brokerage video SOP tutorial library', () => {
    const tutorials = NoraVideoStudioService.getVideoTutorialLibrary();
    expect(tutorials.length).toBeGreaterThanOrEqual(4);
    const maxaTutorial = tutorials.find(t => t.category === 'Maxa Design Studio');
    expect(maxaTutorial).toBeDefined();
    expect(maxaTutorial?.instructor).toContain('Melissa Gagliardi');
  });
});
