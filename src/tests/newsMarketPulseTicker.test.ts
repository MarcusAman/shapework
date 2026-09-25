import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CURRENT_MARKET_INDICATORS } from '../components/news/newsThemeAssets';

describe('Market Pulse Left-to-Right Ticker Suite', () => {
  describe('1. NewsPage Layout & Ticker Track Structure', () => {
    const pagePath = path.resolve(process.cwd(), 'src/components/news/NewsPage.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    it('contains data-testid="market-pulse-ticker-container" and track element', () => {
      expect(content).toContain('data-testid="market-pulse-ticker-container"');
      expect(content).toContain('data-testid="market-pulse-ticker-track"');
    });

    it('pins Market Pulse badge on the left with pulsating emerald indicator', () => {
      expect(content).toContain('Market Pulse');
      expect(content).toContain('animate-pulse');
      expect(content).toContain('bg-emerald-400');
    });

    it('pins Wilmington MLS Benchmark label on large displays', () => {
      expect(content).toContain('Wilmington MLS Benchmark');
    });

    it('includes left and right gradient fade masks for smooth marquee transitions', () => {
      expect(content).toContain('bg-gradient-to-r from-[#01362D] to-transparent');
      expect(content).toContain('bg-gradient-to-l from-[#01362D] to-transparent');
    });

    it('applies .animate-marquee-ltr class and duplicates indicator items for seamless looping', () => {
      expect(content).toContain('animate-marquee-ltr');
      expect(content).toContain('[...CURRENT_MARKET_INDICATORS, ...CURRENT_MARKET_INDICATORS]');
    });
  });

  describe('2. CSS Marquee Animation & Direction Verification', () => {
    const cssPath = path.resolve(process.cwd(), 'src/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    it('defines @keyframes marquee-ltr with translateX(-50%) to translateX(0%) for left-to-right scroll', () => {
      expect(cssContent).toContain('@keyframes marquee-ltr');
      expect(cssContent).toContain('transform: translateX(-50%);');
      expect(cssContent).toContain('transform: translateX(0%);');
    });

    it('configures .animate-marquee-ltr with continuous linear animation', () => {
      expect(cssContent).toContain('.animate-marquee-ltr');
      expect(cssContent).toContain('animation: marquee-ltr');
      expect(cssContent).toContain('linear infinite');
      expect(cssContent).toContain('width: max-content');
    });

    it('pauses marquee scroll on user hover for readable interaction', () => {
      expect(cssContent).toContain('.animate-marquee-ltr:hover');
      expect(cssContent).toContain('animation-play-state: paused');
    });
  });

  describe('3. Market Indicators Data Integrity', () => {
    it('contains essential Cape Fear and national real estate benchmarks', () => {
      expect(CURRENT_MARKET_INDICATORS.length).toBeGreaterThanOrEqual(4);
      const labels = CURRENT_MARKET_INDICATORS.map(i => i.label);
      expect(labels).toContain('30-Yr Fixed');
      expect(labels).toContain('Wilmington Median');
      expect(labels).toContain('Cape Fear DOM');
    });

    it('each indicator has valid trend and formatted values', () => {
      for (const ind of CURRENT_MARKET_INDICATORS) {
        expect(['up', 'down', 'neutral']).toContain(ind.trend);
        expect(ind.value).toBeTruthy();
        expect(ind.change).toBeTruthy();
        expect(ind.context).toBeTruthy();
      }
    });
  });
});
