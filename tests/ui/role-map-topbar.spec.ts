import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase C.1.2 — Role & Escalation Map Top-Bar Readability', () => {
  const componentPath = path.resolve(__dirname, '../../src/components/settings/OrgChartWizardPage.tsx');
  const tokensPath = path.resolve(__dirname, '../../src/styles/tokens.css');
  const componentContent = fs.readFileSync(componentPath, 'utf8');
  const tokensContent = fs.readFileSync(tokensPath, 'utf8');

  const topBarHeader = componentContent.slice(
    componentContent.indexOf('TOP HEADER BAR'),
    componentContent.indexOf('STEPPER PROGRESS BAR')
  );

  it('1. Operational summary labels (Total, Vacant, Planned, AI, Saved) use token-based foregrounds', () => {
    expect(topBarHeader).toContain('text-[var(--sw-text-secondary)]');
    expect(topBarHeader).toContain('text-[var(--sw-text-primary)]');
    expect(topBarHeader).toContain('text-[var(--state-danger)]');
    expect(topBarHeader).toContain('text-[var(--state-info)]');
    expect(topBarHeader).toContain('text-[var(--state-ai)]');
    expect(topBarHeader).toContain('text-[var(--state-success)]');
  });

  it('2. Top bar summary container does not use inherited reduced opacity or faint legacy colors', () => {
    // Ensure legacy dark mode low-opacity text colors are removed from top bar metrics
    expect(topBarHeader).not.toContain('text-[#D0D6BB]/50 uppercase');
    expect(topBarHeader).not.toContain('text-rose-300/60');
    expect(topBarHeader).not.toContain('text-sky-300/60');
    expect(topBarHeader).not.toContain('text-emerald-400/60');
  });

  it('3. Disabled Save Changes remains readable and programmatically disabled', () => {
    expect(topBarHeader).toContain('disabled={!hasChanges || saveStatus === \'saving\'}');
    expect(topBarHeader).toContain('aria-disabled={!hasChanges || saveStatus === \'saving\'}');
    expect(topBarHeader).toContain('opacity-[var(--sw-opacity-disabled)]');
    expect(topBarHeader).toContain('cursor-not-allowed');
  });

  it('4. Dirty-state Save Changes uses high-contrast enabled brand-primary treatment', () => {
    expect(topBarHeader).toContain('bg-[var(--brand-primary)]');
    expect(topBarHeader).toContain('text-[var(--brand-on-primary)]');
  });

  it('5. Hover on Save Changes button maintains high-contrast background without fading label', () => {
    expect(topBarHeader).toContain('hover:bg-[var(--brand-primary)]/90');
  });

  it('6. Keyboard focus exposes a visible focus ring', () => {
    expect(topBarHeader).toContain('focus-visible:ring-2');
    expect(topBarHeader).toContain('focus-visible:ring-[var(--brand-primary)]');
  });

  it('7. Semantic state colors remain separate from workspace brand colors', () => {
    expect(tokensContent).toContain('--state-danger');
    expect(tokensContent).toContain('--state-info');
    expect(tokensContent).toContain('--state-ai');
    expect(tokensContent).toContain('--state-success');
    expect(tokensContent).toContain('--brand-on-primary');
  });

  it('8. Top bar does not hardcode Nest Realty hex colors in shared components', () => {
    expect(topBarHeader).not.toContain('#00635C');
    expect(topBarHeader).not.toContain('#D0D6BB');
    expect(topBarHeader).not.toContain('bg-emerald-600');
  });

  it('9. Responsive layout keeps Save Changes accessible on narrow viewports', () => {
    expect(topBarHeader).toContain('min-h-[44px]');
    expect(topBarHeader).toContain('flex-wrap');
  });
});
