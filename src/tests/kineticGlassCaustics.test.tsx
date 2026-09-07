import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { KineticGlassCaustics } from '../components/shared/KineticGlassCaustics';

describe('KineticGlassCaustics UI Component Suite', () => {
  it('renders default hero frosted glass caustics with blur filters and gradients', () => {
    const html = renderToStaticMarkup(<KineticGlassCaustics variant="hero" />);
    expect(html).toContain('data-testid="kinetic-glass-caustics"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('id="causticTeal"');
    expect(html).toContain('id="causticGold"');
    expect(html).toContain('id="causticAqua"');
    expect(html).toContain('class="caustic-layer"');
  });

  it('renders drawer variant cleanly', () => {
    const html = renderToStaticMarkup(<KineticGlassCaustics variant="drawer" />);
    expect(html).toContain('data-testid="kinetic-glass-caustics"');
    expect(html).toContain('class="caustic-layer"');
  });

  it('includes reduced-motion accessibility styles in keyframes', () => {
    const html = renderToStaticMarkup(<KineticGlassCaustics />);
    expect(html).toContain('prefers-reduced-motion: reduce');
    expect(html).toContain('causticDrift1');
  });
});
