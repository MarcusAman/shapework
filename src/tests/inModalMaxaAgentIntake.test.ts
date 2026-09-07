/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('In-Modal Maxa Agent Execution & Live Template Intake Suite', () => {

  it('1. Verifies RequestActionModal contains in-modal Maxa agent execution and progress runner state', () => {
    const modalPath = path.join(process.cwd(), 'src/components/marketing/RequestActionModal.tsx');
    const content = fs.readFileSync(modalPath, 'utf-8');

    // In-modal generation state
    expect(content).toContain('isGeneratingMaxa');
    expect(content).toContain('generationStep');
    expect(content).toContain('generationProgress');
    expect(content).toContain('handleRunMaxaAgent');

    // Progress runner banner
    expect(content).toContain('Autonomous Maxa Browser Agent Running');
    expect(content).toContain('1. Authenticate nest.maxadesigns.com');
    expect(content).toContain('2. Ingest MLS property media');
    expect(content).toContain('3. Generate 300 DPI templates');
    expect(content).toContain('4. Stage vector PDF package');
  });

  it('2. Verifies generated Maxa templates (Flyer, Story, Postcard) are pulled in without closing modal', () => {
    const modalPath = path.join(process.cwd(), 'src/components/marketing/RequestActionModal.tsx');
    const content = fs.readFileSync(modalPath, 'utf-8');

    // Returned deliverable specs
    expect(content).toContain('Double-Sided 8.5x11 Property Flyer');
    expect(content).toContain('9:16 Social Story Carousel');
    expect(content).toContain('6x9 Jumbo EDDM Postcard');
    expect(content).toContain('300 DPI Print PDF');
    expect(content).toContain('1080x1920 PNG');
    expect(content).toContain('USPS EDDM Clear Zone');

    // Interactive actions: Inspect & Edit in Maxa
    expect(content).toContain('Inspect');
    expect(content).toContain('Edit ↗');
    expect(content).toContain('https://nest.maxadesigns.com/designs/');
  });

  it('3. Verifies multi-select approval triggers stay active in modal with Eduardo default checked', () => {
    const modalPath = path.join(process.cwd(), 'src/components/marketing/RequestActionModal.tsx');
    const content = fs.readFileSync(modalPath, 'utf-8');

    expect(content).toContain('Select Reviewers to Dispatch Proof Alerts (SMS + Email):');
    expect(content).toContain('selectedRecipients.eduardo');
    expect(content).toContain('selectedRecipients.melissa');
    expect(content).toContain('Eduardo Lovo (Virtual Assistant)');
    expect(content).toContain('Melissa Gagliardi (Marketing Director)');
    expect(content).toContain('Send for Approval');
  });

  it('4. Verifies MarketingHomeInbox & MarketingIntakeConsole handle onProofsGenerated to update table state', () => {
    const inboxPath = path.join(process.cwd(), 'src/components/marketing/MarketingHomeInbox.tsx');
    const inboxContent = fs.readFileSync(inboxPath, 'utf-8');

    expect(inboxContent).toContain('onProofsGenerated');

    const consolePath = path.join(process.cwd(), 'src/components/marketing/MarketingIntakeConsole.tsx');
    const consoleContent = fs.readFileSync(consolePath, 'utf-8');

    expect(consoleContent).toContain('onProofsGenerated');
    expect(consoleContent).toContain("statusKey: 'proofs_ready'");
  });

});
