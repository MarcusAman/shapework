/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite for Team Member Workstation Task Routing and Forwarding (Melissa's Workspace)
 */

import { describe, it, expect, vi } from 'vitest';
import { TEAM_MEMBERS } from '../components/marketing/MarketingHomeInbox';
import fs from 'fs';
import path from 'path';

describe('Team Member Workstation Task Routing & Forwarding Suite', () => {
  it('1. TEAM_MEMBERS contains all operations and brokerage team members', () => {
    expect(TEAM_MEMBERS.length).toBeGreaterThanOrEqual(8);
    const memberNames = TEAM_MEMBERS.map(m => m.name);

    expect(memberNames).toContain('Melissa Gagliardi');
    expect(memberNames).toContain('Eduardo Lovo');
    expect(memberNames).toContain('Ann Gunn');
    expect(memberNames).toContain('Marcus Aman');
    expect(memberNames).toContain('Ryan Crecelius');
    expect(memberNames).toContain('Jessica Keenan');
    expect(memberNames).toContain('Eric Knight');
    expect(memberNames).toContain('James Fort');
    expect(memberNames).not.toContain('Matt Orr');
  });

  it('2. VAWorkspaceView includes Send to... routing button and dropdown in table actions', () => {
    const filePath = path.resolve(__dirname, '../components/marketing/VAWorkspaceView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Verifies table action cell includes send-to-btn and send-to-dropdown
    expect(content).toContain('data-testid={`send-to-btn-${t.id}`}');
    expect(content).toContain('data-testid={`send-to-dropdown-${t.id}`}');
    expect(content).toContain('Route Task To:');
    expect(content).toContain('handleReassignTask(t.id, member.name)');
  });

  it('3. VAWorkspaceView includes Send to... button and dropdown in drawer top action bar', () => {
    const filePath = path.resolve(__dirname, '../components/marketing/VAWorkspaceView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Verifies drawer top bar includes drawer-send-to-btn and drawer-send-to-dropdown
    expect(content).toContain('data-testid="drawer-send-to-btn"');
    expect(content).toContain('data-testid="drawer-send-to-dropdown"');
    expect(content).toContain('handleReassignTask(activeTask.id, member.name)');
  });

  it('4. VAWorkspaceView defines onReassignTask prop and passes it cleanly', () => {
    const filePath = path.resolve(__dirname, '../components/marketing/VAWorkspaceView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('onReassignTask?: (taskId: string, newAssignee: string) => void;');
    expect(content).toContain('if (onReassignTask) {');
    expect(content).toContain('onReassignTask(taskId, member.name);');
  });

  it('5. MarketingIntakeConsole wires onReassignTask to update canonicalTasks', () => {
    const filePath = path.resolve(__dirname, '../components/marketing/MarketingIntakeConsole.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('onReassignTask={(taskId, newAssignee) => {');
    expect(content).toContain('setCanonicalTasks(prev => prev.map(t => t.id === taskId ? {');
  });

  it('6. Complies with Zero Sparkles Icon rule in VAWorkspaceView', () => {
    const filePath = path.resolve(__dirname, '../components/marketing/VAWorkspaceView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).not.toContain('Sparkles');
    expect(content).not.toContain('sparkles');
  });
});
