import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = join(__dirname, '../..');

describe('Ask Requester delivery outreach (Melissa approve gate)', () => {
  it('portals Ask Requester above the task drawer (z-120)', () => {
    const src = readFileSync(join(root, 'src/components/marketing/AskRequesterQuestionsModal.tsx'), 'utf8');
    expect(src).toContain("createPortal");
    expect(src).toContain('z-[120]');
    expect(src).toContain("delivery_complete");
    expect(src).toContain('outreach-email-card');
    expect(src).toContain('melissa.gagliardi@nestrealty.com');
    expect(src).toContain('AskNora@NestRealty.com');
  });

  it('Approve & Notify opens delivery outreach instead of auto-send', () => {
    const drawer = readFileSync(join(root, 'src/components/marketing/WorkspaceTaskDrawer.tsx'), 'utf8');
    expect(drawer).toContain('openDeliveryOutreach');
    expect(drawer).toContain("intent: 'delivery_complete'");
    expect(drawer).toContain('Approve & Notify Agent');
    expect(drawer).toContain('skipAgentEmail: true');
  });

  it('inbox completes with skipAgentEmail after outreach send', () => {
    const inbox = readFileSync(join(root, 'src/components/marketing/MarketingHomeInbox.tsx'), 'utf8');
    expect(inbox).toContain("outreachIntent: intent");
    expect(inbox).toContain('skipAgentEmail: true');
    expect(inbox).toContain('approve-and-dispatch');
  });

  it('server skips auto completion email when skipAgentEmail is set', () => {
    const server = readFileSync(join(root, 'server.ts'), 'utf8');
    expect(server).toContain('skipAgentEmail');
    expect(server).toContain('skippedAutoEmail');
  });
});

  it('inbox refuses approve-complete when outreach send failed or draft-only', () => {
    const inbox = readFileSync(join(root, 'src/components/marketing/MarketingHomeInbox.tsx'), 'utf8');
    expect(inbox).toContain('sendFailed');
    expect(inbox).toContain('task left open');
    expect(inbox).toContain('driveFolderUrl');
  });

  it('modal includes completed assets in delivery payload and message', () => {
    const src = readFileSync(join(root, 'src/components/marketing/AskRequesterQuestionsModal.tsx'), 'utf8');
    expect(src).toContain('collectDeliveryAssetLinks');
    expect(src).toContain('outreach-delivery-assets');
    expect(src).toContain('assetUrls');
  });

  it('send-questions route embeds asset links and uses real SMS provider', () => {
    const server = readFileSync(join(root, 'server/routes/marketingQuestionsRoute.ts'), 'utf8');
    expect(server).toContain('assetLinksHtml');
    expect(server).toContain('sendSmsNotification');
    expect(server).toContain('reallySent');
    expect(server).not.toContain('recordSmsDispatch');
  });
