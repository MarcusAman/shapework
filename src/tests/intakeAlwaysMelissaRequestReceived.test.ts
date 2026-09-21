import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getCanonicalLaneForTask } from '../components/marketing/MarketingHomeInbox';

describe('New marketing intake always Intake Received + Melissa', () => {
  it('lane maps request_received + Melissa to Intake Received (not In Progress)', () => {
    expect(getCanonicalLaneForTask({
      status: 'request_received',
      assignedTo: 'Melissa Gagliardi'
    })).toBe('request_received');
    expect(getCanonicalLaneForTask({
      status: 'in_progress',
      assignedTo: 'Melissa Gagliardi'
    })).toBe('in_progress');
  });

  it('email intake no longer auto-promotes to in_progress when photos attach', () => {
    const src = readFileSync(join(__dirname, '../../server/integrations/google/noraEmailIntakeService.ts'), 'utf8');
    expect(src).toContain("status: 'request_received'");
    expect(src).not.toContain("photoAttachments.length > 0 ? 'in_progress'");
    expect(src).not.toMatch(/matchedTask\.status = 'in_progress'/);
  });

  it('address reconcile keeps tasks in request_received', () => {
    const src = readFileSync(join(__dirname, '../../server/services/inboundEmailIngestionEngine.ts'), 'utf8');
    expect(src).toContain("task.status = 'request_received'");
    expect(src).not.toMatch(/for \(const task of pendingTasks\) \{\s*task\.propertyAddress = propertyAddress;\s*task\.status = 'in_progress'/);
  });
});
