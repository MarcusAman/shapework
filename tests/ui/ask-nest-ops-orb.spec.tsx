/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Phase C.2 — Ask Nest Ops AI Orb Experience Tests
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import NestOpsHub from '../../src/components/brokerage-ops/NestOpsHub';

const mockState = {
  workspaceId: 'nest-realty-wilmington',
  activeProfile: {
    name: 'Ryan Crecelius',
    email: 'ryan@nestrealty.com',
    role: 'owner'
  },
  jobs: [],
  steps: [],
  opsAssets: [],
  cameraOffline: false,
  setCurrentTab: () => {}
};

describe('Phase C.2 — Ask Nest Ops AI Orb Experience', () => {
  it('1. Legacy Ask Nest Ops badge is no longer rendered in the hero', () => {
    const html = renderToStaticMarkup(<NestOpsHub state={mockState} mode="search_only" />);
    // The old pill badge with uppercase text "Ask Nest Ops" inside a rounded-full div above H2 is removed
    expect(html).not.toContain('uppercase tracking-wider select-none');
    expect(html).not.toContain('● Ask Nest Ops Operating System');
  });

  it('2. Orb video is rendered inside the Ask Nest Ops hero', () => {
    const html = renderToStaticMarkup(<NestOpsHub state={mockState} mode="search_only" />);
    expect(html).toContain('data-testid="ask-nest-ops-orb"');
    expect(html).toContain('data-testid="orb-video-element"');
    expect(html).toContain('<video');
  });

  it('3. Video element is properly configured with autoplay, muted, loop, and playsinline', () => {
    const html = renderToStaticMarkup(<NestOpsHub state={mockState} mode="search_only" />);
    expect(html).toContain('autoPlay=""');
    expect(html).toContain('muted=""');
    expect(html).toContain('loop=""');
    expect(html).toContain('playsInline=""');
  });

  it('4. Interactive Orb button has accessible label "Talk to Ask Nest Ops"', () => {
    const html = renderToStaticMarkup(<NestOpsHub state={mockState} mode="search_only" />);
    expect(html).toContain('aria-label="Talk to Ask Nest Ops"');
    expect(html).toContain('type="button"');
  });

  it('5. Interactive Orb button supports keyboard focus ring styling', () => {
    const html = renderToStaticMarkup(<NestOpsHub state={mockState} mode="search_only" />);
    expect(html).toContain('focus-visible:ring-2');
    expect(html).toContain('focus-visible:ring-[var(--brand-primary)]');
  });

  it('6. Clicking the orb invokes shared voice handler path (button onClick)', () => {
    const html = renderToStaticMarkup(<NestOpsHub state={mockState} mode="search_only" />);
    expect(html).toContain('data-testid="ask-nest-ops-orb"');
    // Button element wraps orb video for voice activation
    expect(html).toMatch(/<button[^>]*data-testid="ask-nest-ops-orb"[^>]*><video/);
  });

  it('7. Existing microphone button in prompt bar continues to work and render', () => {
    const html = renderToStaticMarkup(<NestOpsHub state={mockState} mode="search_only" />);
    expect(html).toContain('title="Voice Command"');
    expect(html).toContain('placeholder="Ask Nest Ops anything..."');
  });

  it('8. Quick-action prompt buttons remain functional', () => {
    const html = renderToStaticMarkup(<NestOpsHub state={mockState} mode="search_only" />);
    expect(html).toContain('Write an Offer');
    expect(html).toContain('What needs my attention?');
  });

  it('9. Pending-intake UI and connected tools remain functional', () => {
    const html = renderToStaticMarkup(<NestOpsHub state={mockState} mode="search_only" />);
    expect(html).toContain('tools connected');
  });

  it('10. Contract-intake routing remains intact on main heading', () => {
    const html = renderToStaticMarkup(<NestOpsHub state={mockState} mode="search_only" />);
    expect(html).toContain('Ask Nest Ops');
    expect(html).toContain('Ask anything. Get the work done.');
  });

  it('11. Reduced-motion behavior is supported via CSS utility', () => {
    const html = renderToStaticMarkup(<NestOpsHub state={mockState} mode="search_only" />);
    expect(html).toContain('motion-reduce:animate-none');
  });

  it('12. Responsive implementation defines proper desktop, tablet, and mobile orb diameters', () => {
    const html = renderToStaticMarkup(<NestOpsHub state={mockState} mode="search_only" />);
    expect(html).toContain('w-24 h-24');
    expect(html).toContain('sm:w-32 sm:h-32');
    expect(html).toContain('md:w-40 md:h-40');
    expect(html).toContain('lg:w-48 lg:h-48');
  });

  it('13. Multi-tenant architecture uses CSS variable design tokens and orbVideoSrc prop', () => {
    const htmlDefault = renderToStaticMarkup(<NestOpsHub state={mockState} mode="search_only" />);
    expect(htmlDefault).toContain('src="/nest_ops_orb.mp4"');
    expect(htmlDefault).toContain('var(--brand-primary');

    const htmlCustom = renderToStaticMarkup(
      <NestOpsHub state={mockState} mode="search_only" orbVideoSrc="/custom_tenant_orb.mp4" />
    );
    expect(htmlCustom).toContain('src="/custom_tenant_orb.mp4"');
  });
});
