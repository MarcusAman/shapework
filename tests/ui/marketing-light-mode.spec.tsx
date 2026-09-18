import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MelissaTodayView } from '../../src/components/marketing/MelissaTodayView';
import { VAWorkspaceView } from '../../src/components/marketing/VAWorkspaceView';

describe('Marketing Workspace Canonical Light Mode Enforcement', () => {
  it('1. MelissaTodayView renders zero dark green stage containers (#073F35, #062f28)', () => {
    const html = renderToStaticMarkup(
      <MelissaTodayView
        workItems={[]}
        onOpenDetail={() => {}}
      />
    );

    expect(html).not.toContain('bg-[#073F35]');
    expect(html).not.toContain('bg-[#062f28]');
    expect(html).not.toContain('bg-[#01251f]');
    expect(html).toContain('var(--sw-surface');
  });

  it('2. VAWorkspaceView renders zero dark green stage containers (#062f28, #01251f)', () => {
    const html = renderToStaticMarkup(
      <VAWorkspaceView
        vaWorkItems={[]}
        onUpdateItemStatus={() => {}}
      />
    );

    expect(html).not.toContain('bg-[#062f28]');
    expect(html).not.toContain('bg-[#01251f]');
    expect(html).not.toContain('bg-[#073F35]');
    expect(html).toContain('var(--sw-surface');
  });
});
