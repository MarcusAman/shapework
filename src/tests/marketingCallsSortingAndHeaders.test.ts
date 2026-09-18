import { describe, it, expect } from 'vitest';
import { parseCallDateToTimestamp, parseDurationToSeconds } from '../components/marketing/CallsTableView';
import fs from 'fs';
import path from 'path';

describe('Calls Log Sorting & Interactive Column Headers Test Suite', () => {
  it('1. parseCallDateToTimestamp accurately parses all string and relative timestamp formats', () => {
    const now = Date.now();

    // Standard ISO
    const isoCall: any = { rawTimestamp: '2026-08-19T14:30:00.000Z' };
    expect(parseCallDateToTimestamp(isoCall)).toBe(new Date('2026-08-19T14:30:00.000Z').getTime());

    // "Jul 28 · 11:15 AM"
    const julCall: any = { timestamp: 'Jul 28 · 11:15 AM' };
    const parsedJul = parseCallDateToTimestamp(julCall);
    expect(parsedJul).toBeGreaterThan(0);
    expect(isNaN(parsedJul)).toBe(false);

    // "Jul 29 · 2:10 PM" vs "Jul 28 · 11:15 AM"
    const jul29Call: any = { timestamp: 'Jul 29 · 2:10 PM' };
    const parsedJul29 = parseCallDateToTimestamp(jul29Call);
    expect(parsedJul29).toBeGreaterThan(parsedJul);

    // "Today at 6:42 PM"
    const todayCall: any = { timestamp: 'Today at 6:42 PM' };
    const parsedToday = parseCallDateToTimestamp(todayCall);
    expect(parsedToday).toBeGreaterThan(0);
    expect(isNaN(parsedToday)).toBe(false);

    // "Yesterday 3:40 PM"
    const yesterdayCall: any = { timestamp: 'Yesterday 3:40 PM' };
    const parsedYesterday = parseCallDateToTimestamp(yesterdayCall);
    expect(parsedToday).toBeGreaterThan(parsedYesterday);

    // "10m ago" vs "2 hours ago"
    const tenMinCall: any = { timestamp: '10m ago' };
    const twoHrCall: any = { timestamp: '2 hours ago' };
    expect(parseCallDateToTimestamp(tenMinCall)).toBeGreaterThan(parseCallDateToTimestamp(twoHrCall));
  });

  it('2. parseDurationToSeconds accurately parses human-readable duration strings', () => {
    expect(parseDurationToSeconds({ duration: '1 min 50 sec' } as any)).toBe(110);
    expect(parseDurationToSeconds({ duration: '8 sec' } as any)).toBe(8);
    expect(parseDurationToSeconds({ duration: '2 min 38 sec' } as any)).toBe(158);
    expect(parseDurationToSeconds({ durationSeconds: 45 } as any)).toBe(45);
  });

  it('3. CallsTableView contains clickable sortable column headers with indicators', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/marketing/CallsTableView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Sort handlers on table headers
    expect(content).toContain("handleHeaderSort('date')");
    expect(content).toContain("handleHeaderSort('caller')");
    expect(content).toContain("handleHeaderSort('property')");
    expect(content).toContain("handleHeaderSort('category')");

    // Sort Dropdown Options
    expect(content).toContain('Date (Newest First)');
    expect(content).toContain('Date (Oldest First)');
    expect(content).toContain('Caller Name (A to Z)');
    expect(content).toContain('Property Address (A to Z)');

    // Zero Sparkles rule verified
    expect(content).not.toContain('<Sparkles');
    expect(content).not.toContain('<SparklesIcon');
  });
});
