import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = join(__dirname, '../..');

describe('Tasks Received column + ops yard-sign fulfillment', () => {
  it('renames All queues to Workspace and adds sortable Received column', () => {
    const src = readFileSync(join(root, 'src/components/marketing/MarketingHomeInbox.tsx'), 'utf8');
    expect(src).toContain('>Workspace</option>');
    expect(src).not.toContain('>All queues</option>');
    expect(src).toContain('data-testid="tasks-sort-received"');
    expect(src).toContain("sortField === 'receivedAt'");
    expect(src).toContain('getTaskReceivedIso');
    expect(src).toContain('data-testid="task-received-cell"');
  });

  it('yard sign pickup skips address; install requires it; ops attachments optional', () => {
    const src = readFileSync(join(root, 'src/components/marketing/NewMarketingRequestModal.tsx'), 'utf8');
    expect(src).toContain('ops-yard-sign-fulfillment');
    expect(src).toContain("fulfillmentMode === 'pickup'");
    expect(src).toContain('Agent pickup — address not required');
    expect(src).not.toContain("1916 Wolcott Ave, Wilmington, NC 28403");
    expect(src).toContain('Attachments (optional)');
  });

  it('ops tasks skip proof/photo blocking in drawer', () => {
    const src = readFileSync(join(root, 'src/components/marketing/WorkspaceTaskDrawer.tsx'), 'utf8');
    expect(src).toContain('ops-optional-attachments-panel');
    expect(src).toContain('if (isMarketingTask)');
    expect(src).toContain('Operational tasks do not need source photos');
  });
});
