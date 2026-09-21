import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = join(__dirname, '../..');

describe('Nora personality pass', () => {
  it('warms Ask Nora shell and hero copy', () => {
    const shell = readFileSync(join(root, 'src/components/layout/AppShell.tsx'), 'utf8');
    expect(shell).toContain('bg-[#F7F3EC]');
    expect(shell).toContain('nora-warm');
    const hub = readFileSync(join(root, 'src/components/brokerage-ops/NestOpsHub.tsx'), 'utf8');
    expect(hub).toContain('Coastal brokerage ops');
    expect(hub).toContain('data-personality="nora-hero"');
  });

  it('gives sidebar Nora presence + warmer help card', () => {
    const nav = readFileSync(join(root, 'src/components/layout/CollapsibleNavigationRail.tsx'), 'utf8');
    expect(nav).toContain('sidebar-nora-help');
    expect(nav).toContain('Stuck on something?');
    expect(nav).toContain("item.name === 'Ask Nora'");
  });

  it('rewrites quiet empty states with Nora presence', () => {
    const wyt = readFileSync(join(root, 'src/components/news/WorthKnowingDashboardModule.tsx'), 'utf8');
    expect(wyt).toContain('worth-knowing-quiet');
    expect(wyt).toContain('Quiet morning');
    const news = readFileSync(join(root, 'src/components/news/NewsPage.tsx'), 'utf8');
    expect(news).toContain('news-empty-quiet');
    expect(news).toContain('Quiet on the wire');
    const tasks = readFileSync(join(root, 'src/components/marketing/MarketingHomeInbox.tsx'), 'utf8');
    expect(tasks).toContain('tasks-empty-quiet');
    expect(tasks).toContain('Intake is clear');
  });
});
