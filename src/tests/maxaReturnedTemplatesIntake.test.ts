/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Maxa Returned Templates & Proofs Intake Integration', () => {

  it('1. Verifies MarketingIntakeConsole contains proof and deliverable inspection handlers', () => {
    const consolePath = path.join(process.cwd(), 'src/components/marketing/MarketingIntakeConsole.tsx');
    const content = fs.readFileSync(consolePath, 'utf-8');

    // Deliverables structure and proof handlers
    expect(content).toContain('proofUrl');
    expect(content).toContain('proofPackage');
    expect(content).toContain('generatedDeliverables');
    expect(content).toContain('MarketingHomeInbox');
  });

  it('2. Verifies MarketingHomeInbox displays returned proof indicators and links to RequestActionModal', () => {
    const inboxPath = path.join(process.cwd(), 'src/components/marketing/MarketingHomeInbox.tsx');
    const content = fs.readFileSync(inboxPath, 'utf-8');

    // Proofs indicator in table
    expect(content).toContain('Maxa Proofs:');
    expect(content).toContain('📄 Flyer');
    expect(content).toContain('📱 Story');
    expect(content).toContain('📬 Postcard');
    expect(content).toContain('Proofs Ready');

    // RequestActionModal integration
    expect(content).toContain('<RequestActionModal');
    expect(content).toContain('selectedActionCampaign');
  });

  it('3. Verifies RequestActionModal renders 300 DPI proof cards and multi-select approval workflow', () => {
    const modalPath = path.join(process.cwd(), 'src/components/marketing/RequestActionModal.tsx');
    const content = fs.readFileSync(modalPath, 'utf-8');

    // No sparkles
    expect(content).not.toContain('<Sparkles');
    expect(content).not.toContain('SparklesIcon');
    expect(content).toContain('Generated Marketing Proofs (300 DPI Vector PDF)');
    expect(content).toContain('Property Flyer');
    expect(content).toContain('Social Story');
    expect(content).toContain('EDDM Postcard');

    // Multi-select reviewer checkboxes
    expect(content).toContain('selectedRecipients.eduardo');
    expect(content).toContain('selectedRecipients.melissa');
    expect(content).toContain('Eduardo Lovo (Virtual Assistant)');
    expect(content).toContain('Melissa Gagliardi (Marketing Director)');
    expect(content).toContain('Send for Approval');
  });

  it('4. Verifies VAWorkspaceView displays staged proofs and approval pathways in slide-over drawer', () => {
    const workspacePath = path.join(process.cwd(), 'src/components/marketing/VAWorkspaceView.tsx');
    const content = fs.readFileSync(workspacePath, 'utf-8');
    expect(content).toContain('Autonomous Maxa Staged Package');
    expect(content).toContain('Approve & Deliver to Agent');
    expect(content).toContain('8.5x11 Property Flyer');
    expect(content).toContain('9:16 Story Carousel');
    expect(content).toContain('6x9 EDDM Postcard');
  });

});
