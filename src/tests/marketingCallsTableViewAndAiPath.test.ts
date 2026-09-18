import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getAiRecommendedPath, TelephonyCallItem } from '../components/marketing/CallsTableView';

describe('Marketing Intake Calls Table View & AI Recommended Path Suite', () => {
  const mockCalls: TelephonyCallItem[] = [
    {
      id: 'call_01',
      callerName: 'Marcus Aman',
      callerPhone: '+1 (252) 717-0595',
      propertyAddress: '312 Mayfaire Way, Wilmington NC',
      timestamp: 'Today 9:15 AM',
      rawTimestamp: new Date().toISOString(),
      duration: '1m 45s',
      departmentCategory: 'sign_vendor',
      transcript: 'Marcus Aman requesting yard sign post and custom rider installation before open house.',
      requestExcerpt: 'Install sign post and rider at 312 Mayfaire Way.'
    },
    {
      id: 'call_02',
      callerName: 'Sarah Jenkins',
      callerPhone: '+1 (910) 612-4411',
      propertyAddress: '742 Lumina Ave, Wrightsville Beach NC',
      timestamp: 'Yesterday 3:40 PM',
      rawTimestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      duration: '2m 10s',
      departmentCategory: 'compliance_contract',
      transcript: 'Need Form 2-T validation and MOGS disclosure audit for purchase agreement.',
      requestExcerpt: 'Form 2-T validation hold.'
    },
    {
      id: 'call_03',
      callerName: 'Eric Miller',
      callerPhone: '+1 (910) 443-1288',
      propertyAddress: '304 Ocean Blvd, Topsail Beach NC',
      timestamp: '2 days ago',
      rawTimestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      duration: '3m 05s',
      departmentCategory: 'marketing_collateral',
      missingDetailsPrompt: 'Confirm Sunday Open House start and end hours',
      transcript: 'Putting together 5-asset package. Missing open house hours.',
      requestExcerpt: 'Confirm Open House hours.'
    },
    {
      id: 'call_04',
      callerName: 'David Ross',
      callerPhone: '+1 (910) 555-8921',
      propertyAddress: '1104 Arboretum Dr, Wilmington NC',
      timestamp: '45 days ago',
      rawTimestamp: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // > 30 days
      duration: '2m 30s',
      departmentCategory: 'marketing_collateral',
      transcript: 'Full golf villa marketing collateral package.',
      requestExcerpt: 'Luxury collateral package.'
    }
  ];

  it('1. Generates accurate AI Recommended Paths based on department and transcript context', () => {
    // Call 1: Sign post vendor -> Ann Gunn
    const rec1 = getAiRecommendedPath(mockCalls[0]);
    expect(rec1.actionKey).toBe('sign_dispatch');
    expect(rec1.title).toContain('Ann');
    expect(rec1.targetPerson).toBe('Ann Gunn');

    // Call 2: Compliance Form 2-T -> Ryan Crecelius
    const rec2 = getAiRecommendedPath(mockCalls[1]);
    expect(rec2.actionKey).toBe('compliance_audit');
    expect(rec2.title).toContain('Ryan');
    expect(rec2.targetPerson).toBe('Ryan Crecelius');

    // Call 3: Missing open house hours -> Ask Agent
    const rec3 = getAiRecommendedPath(mockCalls[2]);
    expect(rec3.actionKey).toBe('ask_agent');
    expect(rec3.title).toContain('Ask Agent');

    // Call 4: General collateral -> Eduardo Lovo (VA)
    const rec4 = getAiRecommendedPath(mockCalls[3]);
    expect(rec4.actionKey).toBe('assign_va');
    expect(rec4.title).toContain('Eduardo');
    expect(rec4.targetPerson).toBe('Eduardo Lovo');
  });

  it('2. Verifies strictly zero sparkles icons in CallsTableView component', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/marketing/CallsTableView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).not.toContain('Sparkles');
    expect(content).not.toContain('sparkles');
  });

  it('3. Verifies CallsTableView includes all required table headers and interactive controls', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/marketing/CallsTableView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('Date &amp; Time');
    expect(content).toContain('Caller &amp; Requester');
    expect(content).toContain('Property');
    expect(content).toContain('Suggested next step');
    expect(content).toContain('Verbatim Retell Dialogue Transcript');
    expect(content).toContain('Assign Work');
    expect(content).toContain('Internal Follow-Up');
    expect(content).toContain('AskRequesterQuestionsModal');
  });

  it('4. Verifies CallsTableView correctly handles callsTimeframe state and memoization dependency', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/marketing/CallsTableView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain("callsTimeframe === 'today'");
    expect(content).toContain("callsTimeframe === 'all'");
    expect(content).toContain('callsTimeframe, sortField');
  });
});
