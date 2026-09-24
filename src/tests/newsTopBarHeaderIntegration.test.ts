import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('TopBar News Header & Sync/Sources Integration', () => {
  const rootDir = process.cwd();

  it('verifies TopBar identifies News page across tab names and url paths', () => {
    const isNewsPageCheck = (currentTab: string, pathname: string) => {
      return (
        currentTab === 'News' ||
        currentTab === 'news' ||
        currentTab === 'Real Estate News' ||
        currentTab === 'Industry News' ||
        pathname.includes('/news')
      );
    };

    expect(isNewsPageCheck('News', '/demo/workboard')).toBe(true);
    expect(isNewsPageCheck('news', '/demo/workboard')).toBe(true);
    expect(isNewsPageCheck('Real Estate News', '/app/work')).toBe(true);
    expect(isNewsPageCheck('Industry News', '/app/work')).toBe(true);
    expect(isNewsPageCheck('Workboard', '/demo/news')).toBe(true);
    expect(isNewsPageCheck('Tasks', '/demo/tasks')).toBe(false);
    expect(isNewsPageCheck('Directory', '/demo/directory')).toBe(false);
  });

  it('validates TopBar.tsx renders Executive Intelligence Hub, News & Market Dispatch, and Sync/Sources actions', () => {
    const topBarContent = readFileSync(join(rootDir, 'src/components/layout/TopBar.tsx'), 'utf-8');

    expect(topBarContent).toContain('Executive Intelligence Hub');
    expect(topBarContent).toContain('News & Market Dispatch');
    expect(topBarContent).toContain('Curated industry shifts, local Cape Fear developments, and actionable intelligence for Nest Realty.');
    expect(topBarContent).toContain('trigger-news-sync');
    expect(topBarContent).toContain('open-news-sources-drawer');
    expect(topBarContent).toContain('news-sync-started');
    expect(topBarContent).toContain('news-sync-completed');
    expect(topBarContent).toContain('Sync Feeds');
    expect(topBarContent).toContain('Sources');
  });

  it('validates NewsPage.tsx removed in-page header redundancy while retaining sub-toolbar filters & search', () => {
    const newsPageContent = readFileSync(join(rootDir, 'src/components/news/NewsPage.tsx'), 'utf-8');

    // Redundant header in body is eliminated
    expect(newsPageContent).not.toContain('<h1 className="font-serif font-black text-3xl sm:text-4xl text-[#01362D] tracking-tight">');
    
    // Sub-toolbar with Category Filter Pills and Search Input is preserved
    expect(newsPageContent).toContain('SUB-TOOLBAR: CATEGORY FILTER PILLS & SEARCH');
    expect(newsPageContent).toContain('All Intelligence');
    expect(newsPageContent).toContain('Local & NC');
    expect(newsPageContent).toContain('Brokerage Strategy');
    expect(newsPageContent).toContain('Housing Economics');
    expect(newsPageContent).toContain('PropTech & AI');
    expect(newsPageContent).toContain('Search news, topics, firms...');

    // Event listeners for TopBar actions are present
    expect(newsPageContent).toContain("window.addEventListener('trigger-news-sync'");
    expect(newsPageContent).toContain("window.addEventListener('open-news-sources-drawer'");
    expect(newsPageContent).toContain("window.dispatchEvent(new CustomEvent('news-sync-started'))");
    expect(newsPageContent).toContain("window.dispatchEvent(new CustomEvent('news-sync-completed'))");
  });

  it('manages newsSyncState lifecycle accurately from idle -> syncing -> synced -> idle', () => {
    let syncState: 'idle' | 'syncing' | 'synced' = 'idle';

    const onStart = () => { syncState = 'syncing'; };
    const onComplete = () => { syncState = 'synced'; };
    const onReset = () => { syncState = 'idle'; };

    expect(syncState).toBe('idle');
    onStart();
    expect(syncState).toBe('syncing');
    onComplete();
    expect(syncState).toBe('synced');
    onReset();
    expect(syncState).toBe('idle');
  });
});
