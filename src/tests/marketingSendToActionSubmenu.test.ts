/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { TEAM_MEMBERS } from '../components/marketing/MarketingHomeInbox';

describe("Marketing Intake 'Send to...' Flyout Team Member Submenu", () => {
  const componentPath = path.resolve(__dirname, '../components/marketing/MarketingHomeInbox.tsx');
  const componentContent = fs.readFileSync(componentPath, 'utf-8');

  it('contains the complete Nest Realty team roster in TEAM_MEMBERS', () => {
    expect(TEAM_MEMBERS.length).toBeGreaterThanOrEqual(7);
    const names = TEAM_MEMBERS.map(m => m.name);
    expect(names).toContain('Melissa Gagliardi');
    expect(names).toContain('Eduardo Lovo');
    expect(names).toContain('Ann Gunn');
    expect(names).toContain('Ryan Crecelius');
    expect(names).toContain('Jessica Keenan');
    expect(names).toContain('Eric Knight');
    expect(names).toContain('James Fort');
  });

  it('implements sendToSubmenuTaskId state and interactive flyout menu', () => {
    expect(componentContent).toContain('sendToSubmenuTaskId');
    expect(componentContent).toContain('setSendToSubmenuTaskId');
    expect(componentContent).toContain('Assign Team Member');
    expect(componentContent).toContain('TEAM_MEMBERS.map(member =>');
  });

  it('binds 1-click reassignment handler with role attribution and clean dismissal', () => {
    expect(componentContent).toContain('handleAssignTask(task.id, member.name)');
    expect(componentContent).toContain('setSendToSubmenuTaskId(null)');
    expect(componentContent).toContain('setActiveActionDropdownId(null)');
  });

  it('formats specific toast message including assigned person and role', () => {
    expect(componentContent).toContain('✓ Task assigned to ${extra.assignedTo} (${extra.assignedToRole || \'Team Member\'})');
  });
});
