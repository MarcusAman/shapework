/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Task Quick Actions Modal Suite', () => {
  it('1. Verifies TaskQuickActionsModal component definition and all action handlers', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/marketing/TaskQuickActionsModal.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Props & Export
    expect(content).toContain('export interface TaskQuickActionsModalProps');
    expect(content).toContain('export const TaskQuickActionsModal');

    // Action Options
    expect(content).toContain('Open Maxa Proof Assets & Workstation');
    expect(content).toContain('Dispatch Nora Autonomous Maxa Agent');
    expect(content).toContain('Ask Requester via Nora Hotline');
    expect(content).toContain('Inspect Call Audio & Intake Brief');
    expect(content).toContain('Reassign Task Lead');
    expect(content).toContain('Archive Task');

    // Team Members
    expect(content).toContain('Melissa Gagliardi');
    expect(content).toContain('Eduardo Lovo');
    expect(content).toContain('Ann Gunn');
    expect(content).toContain('Ryan Crecelius');
    expect(content).toContain("name: 'Ryan Crecelius', role: 'Owner'");
  });

  it('2. Verifies MarketingHomeInbox integrates TaskQuickActionsModal for 3-dot trigger', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/marketing/MarketingHomeInbox.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Import & State
    expect(content).toContain("import { TaskQuickActionsModal } from './TaskQuickActionsModal'");
    expect(content).toContain('const [quickActionsTask, setQuickActionsTask] = useState');

    // Modal Trigger
    expect(content).toContain('setQuickActionsTask(task)');

    // Mounted Modal with full handlers
    expect(content).toContain('<TaskQuickActionsModal');
    expect(content).toContain('isOpen={!!quickActionsTask}');
    expect(content).toContain('onOpenProofWorkstation');
    expect(content).toContain('onDispatchBrowserAgent');
    expect(content).toContain('onAskRequester');
    expect(content).toContain('onAssignTeamMember');
    expect(content).toContain('onArchiveTask');
  });
});
