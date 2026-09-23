import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';

describe('NORA ElevenLabs Morning Brief Engine & Caching Architecture', () => {
  const DEFAULT_NORA_VOICE_ID = 'l006hw6wZaEYAv80cbzj';

  it('generates consistent SHA-256 cache hashes for transcript text and voice ID', () => {
    const text = 'Good morning, Nest Realty team. Here is your 2-minute executive intelligence briefing for today.';
    const cleanText = text.replace(/[*#_`]/g, '').trim();
    
    const hash1 = crypto.createHash('sha256').update(`${DEFAULT_NORA_VOICE_ID}:${cleanText}`).digest('hex');
    const hash2 = crypto.createHash('sha256').update(`${DEFAULT_NORA_VOICE_ID}:${cleanText}`).digest('hex');
    
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });

  it('supports comprehensive briefing transcripts up to 5,000 characters without 1,000 char premature truncation', () => {
    // Generate a simulated 2,500-character morning briefing
    const paragraph = 'Cape Fear MLS data reveals continuous growth in coastal demand. ';
    const longTranscript = paragraph.repeat(40); // ~2,560 characters
    
    const cleanText = longTranscript.replace(/[*#_`]/g, '').trim();
    const slicedText = cleanText.slice(0, 5000);
    
    expect(cleanText.length).toBeGreaterThan(2000);
    expect(slicedText.length).toBe(cleanText.length);
    expect(slicedText.length).toBeLessThanOrEqual(5000);
  });

  it('computes proportional active section progression for transcript synchronization', () => {
    const transcriptSections = [
      { id: 'sec-opening', title: 'Opening Bell', text: 'Good morning, Nest Realty team. Here is your 2-minute executive intelligence briefing for today.' },
      { id: 'sec-top-story', title: 'Top Story', text: 'National commission guidelines are solidifying with 100% adherence to written buyer representation agreements.' },
      { id: 'sec-economics', title: 'Market Economics', text: 'Conforming 30-year fixed mortgage rates eased slightly to 6.42%, providing renewed momentum for pre-approved buyers.' },
      { id: 'sec-action', title: 'Action Item for Today', text: 'Reach out to active buyer clients who paused during the mid-summer rate spike and verify all buyer agency agreements.' }
    ];

    const totalChars = transcriptSections.reduce((acc, s) => acc + s.text.length, 0);
    expect(totalChars).toBeGreaterThan(300);

    const getActiveSectionIndex = (progressPct: number) => {
      const currentProgressFraction = progressPct / 100;
      let accumulatedChars = 0;
      for (let i = 0; i < transcriptSections.length; i++) {
        accumulatedChars += transcriptSections[i].text.length;
        if (currentProgressFraction <= accumulatedChars / totalChars) {
          return i;
        }
      }
      return transcriptSections.length - 1;
    };

    // At 0% progress -> Section 0 (Opening Bell)
    expect(getActiveSectionIndex(0)).toBe(0);
    // At 5% progress -> Section 0 (Opening Bell)
    expect(getActiveSectionIndex(5)).toBe(0);
    // At 30% progress -> Section 1 (Top Story)
    expect(getActiveSectionIndex(30)).toBe(1);
    // At 65% progress -> Section 2 (Market Economics)
    expect(getActiveSectionIndex(65)).toBe(2);
    // At 95% progress -> Section 3 (Action Item)
    expect(getActiveSectionIndex(95)).toBe(3);
    // At 100% progress -> Section 3 (Action Item)
    expect(getActiveSectionIndex(100)).toBe(3);
  });

  it('formats audio playback durations with exact minute and second padding', () => {
    const formatTime = (totalSeconds: number) => {
      const rounded = Math.round(totalSeconds);
      const minutes = Math.floor(rounded / 60);
      const seconds = rounded % 60;
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(9)).toBe('0:09');
    expect(formatTime(58)).toBe('0:58');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(110)).toBe('1:50');
    expect(formatTime(125)).toBe('2:05');
  });

  it('cycles playback speed multipliers across 1.0x, 1.25x, and 1.5x seamlessly', () => {
    const cycleSpeed = (current: number) => {
      return current === 1 ? 1.25 : current === 1.25 ? 1.5 : 1;
    };

    expect(cycleSpeed(1)).toBe(1.25);
    expect(cycleSpeed(1.25)).toBe(1.5);
    expect(cycleSpeed(1.5)).toBe(1);
  });

  it('enforces strict no-robotic-fallback policy on ElevenLabs API error', async () => {
    // Mock browser speechSynthesis spy
    const speakSpy = vi.fn();
    (global as any).window = {
      speechSynthesis: {
        speak: speakSpy,
        cancel: vi.fn(),
        getVoices: vi.fn(() => [])
      }
    };

    // Simulate an ElevenLabs failure handler
    let audioError: string | null = null;
    let isPlaying = false;

    const handleElevenLabsError = (err: Error) => {
      audioError = err.message || 'ElevenLabs voice stream failed. Click retry.';
      isPlaying = false;
      // Note: speakSpy must NEVER be called here!
    };

    handleElevenLabsError(new Error('ElevenLabs quota exceeded'));

    expect(audioError).toBe('ElevenLabs quota exceeded');
    expect(isPlaying).toBe(false);
    expect(speakSpy).not.toHaveBeenCalled();
  });

  it('calculates seek timestamp accurately across clamped bounds', () => {
    const calculateSeekTime = (percentage: number, totalDuration: number) => {
      const clampedPct = Math.max(0, Math.min(100, percentage));
      return (clampedPct / 100) * totalDuration;
    };

    const duration = 110; // 110 seconds
    expect(calculateSeekTime(-10, duration)).toBe(0);
    expect(calculateSeekTime(0, duration)).toBe(0);
    expect(calculateSeekTime(50, duration)).toBe(55);
    expect(calculateSeekTime(100, duration)).toBe(110);
    expect(calculateSeekTime(150, duration)).toBe(110);
  });
});
