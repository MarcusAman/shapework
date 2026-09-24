import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CallRecordingPanel } from '../components/marketing/CallRecordingPanel';

const root = join(__dirname, '..');

describe('Nest Critiquito UX pack', () => {
  it('renders Recording not available (no scrubber) when no call is linked', () => {
    const html = renderToStaticMarkup(<CallRecordingPanel callId={null} />);
    expect(html).toContain('Recording not available');
    expect(html).toContain('No telephony call is linked');
    expect(html).not.toContain('title="Play"');
  });

  it('TaskRequestDetailModal hydrates via CallRecordingPanel and collapses raw IDs by default', () => {
    const src = readFileSync(join(root, 'components/marketing/TaskRequestDetailModal.tsx'), 'utf8');
    expect(src).toContain("from './CallRecordingPanel'");
    expect(src).toContain('<CallRecordingPanel');
    expect(src).toContain('useState<boolean>(false)');
    expect(src).toContain('<span>Workstation</span>');
    expect(src).toContain('<span>History &amp; Activity</span>');
    expect(src).not.toContain('Call Recording &amp; Transcript</h3>');
  });

  it('WorkspaceTaskDrawer proof card previews first and call panel replaces empty scrubber', () => {
    const src = readFileSync(join(root, 'components/marketing/WorkspaceTaskDrawer.tsx'), 'utf8');
    expect(src).toContain('collateral-proof-card');
    expect(src).toContain('<span>Preview</span>');
    expect(src).toContain('<CallRecordingPanel');
    expect(src).not.toContain('Originating Call Audio Player');
    expect(src).toContain('events');
  });

  it('VA board hides duplicate stage pills; Calls badge counts today only', () => {
    const va = readFileSync(join(root, 'components/marketing/VAWorkspaceView.tsx'), 'utf8');
    expect(va).toContain("viewMode === 'table'");
    expect(va).toContain('workspace-filters-toggle');
    const consoleSrc = readFileSync(join(root, 'components/marketing/MarketingIntakeConsole.tsx'), 'utf8');
    expect(consoleSrc).toContain('calls.filter(isCallFromToday)');
    expect(consoleSrc).not.toContain('telephonyLinkedOnBoard');
  });

});
