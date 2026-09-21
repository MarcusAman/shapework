import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { MARKETING_SUBTABS } from '../components/marketing/marketingSubtabs';

describe('Marketing Production Workspace & Slide-Over Drawer Integration', () => {
  it('1. Verifies Workspace tab is folded into Tasks (no separate Workspace pill)', () => {
    expect(MARKETING_SUBTABS.find(t => t.id === 'va')).toBeUndefined();
    expect(MARKETING_SUBTABS.find(t => t.id === 'requests')?.label).toBe('Tasks');
  });

  it('2. Verifies VAWorkspaceView has header "Marketing Production Workspace"', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/marketing/VAWorkspaceView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('Marketing Production Workspace');
    expect(content).toContain('Click any task row to open the workstation drawer.');
  });

  it('3. Verifies clicking any task row triggers the slide-over drawer (isDrawerOpen state)', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/marketing/VAWorkspaceView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Drawer state and backdrop
    expect(content).toContain('isDrawerOpen, setIsDrawerOpen');
    expect(content).toContain('SLIDE-OVER TASK WORKSTATION DRAWER');
    expect(content).toContain('isDrawerOpen && activeTask');
    expect(content).toContain('onClose={() => setIsDrawerOpen(false)}');

    // Row click sets selectedTaskId and opens drawer
    expect(content).toContain('setIsDrawerOpen(true);');
  });

  it('4. Verifies Escape key listener to close the workstation drawer', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/marketing/VAWorkspaceView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain("e.key === 'Escape'");
    expect(content).toContain('setIsDrawerOpen(false)');
  });

  it('5. Verifies redesigned drawer eliminates autonomous Maxa presentation and provides managed asset proof submission', () => {
    const drawerPath = path.resolve(process.cwd(), 'src/components/marketing/WorkspaceTaskDrawer.tsx');
    const content = fs.readFileSync(drawerPath, 'utf-8');

    // Autonomous Maxa presentation removed
    expect(content).not.toContain('Autonomous Maxa Staged Package');
    // Producer does not receive Approve & Deliver to Agent
    expect(content).toContain('Send to Manager for Approval');
    expect(content).toContain('Upload Finished Asset');
    expect(content).toContain('activeTask.requestedAssets');
    expect(content).toContain('ProofUploadWizard');
    expect(content).toContain('ProofLightboxViewer');
  });

  it('6. Verifies transcript drawer renders Maxa template snapshot cards in multi-asset matrix', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/marketing/MarketingIntakeConsole.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('Template Visual Snapshot Thumbnail');
    expect(content).toContain('Copy Brief');
  });

  it('7. Verifies drawer segmented tabs, previous/next task cycle, and 1-click copy all details', () => {
    const drawerPath = path.resolve(process.cwd(), 'src/components/marketing/WorkspaceTaskDrawer.tsx');
    const content = fs.readFileSync(drawerPath, 'utf-8');

    // 4 Simplified Drawer Tabs
    expect(content).toContain("label: 'Assignment'");
    expect(content).toContain("label: 'Source Photos'");
    expect(content).toContain("label: 'Requirements'");
    expect(content).toContain("label: 'Proofs & Submission'");

    // Previous / Next task navigation
    expect(content).toContain('title="Previous Task"');
    expect(content).toContain('title="Next Task"');

    // 1-Click Copy All Details
    expect(content).toContain('Copy All Copy');
    expect(content).toContain('handleCopyAllDetails');
  });

  it('8. Verifies role-based proof permissions: Producer submits proofs for review, routing to Melissa/Manager', () => {
    const drawerPath = path.resolve(process.cwd(), 'src/components/marketing/WorkspaceTaskDrawer.tsx');
    const content = fs.readFileSync(drawerPath, 'utf-8');

    // Producer state & handler routing
    expect(content).toContain('isProducer');
    expect(content).toContain('Send to Manager for Approval');
    expect(content).not.toContain('Approve & Deliver to Agent');
  });

  it('9. Verifies role-based proof permissions: Director can Approve for Delivery and Request Revisions', () => {
    const drawerPath = path.resolve(process.cwd(), 'src/components/marketing/WorkspaceTaskDrawer.tsx');
    const content = fs.readFileSync(drawerPath, 'utf-8');

    // Director review actions
    expect(content).toContain('isMarketingDirector');
    expect(content).toContain('Approve for Delivery');
    expect(content).toContain('Request Revisions');
  });

  it('10. Verifies dynamic photo aggregation from AskNora@nestrealty.com and SMS (910) 507-2047', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/marketing/VAWorkspaceView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('aggregatedPhotos');
    expect(content).toContain('AskNora@nestrealty.com');
    expect(content).toContain('(910) 507-2047');
    expect(content).toContain('sourceBadge');
  });
});


