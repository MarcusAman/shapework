/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  getGoogleWorkspaceHubStatus,
  linkDriveFolder,
  syncDriveFolder,
  processInboundGoogleEmail,
  exportToGoogleDocs
} from '../../server/integrations/google/googleWorkspaceHubService';

describe('Google Workspace Hub & Nest U Integration for AskNora@nestrealty.com', () => {
  it('1. Reports active AskNora@nestrealty.com account status and all 5 core capabilities', async () => {
    const status = await getGoogleWorkspaceHubStatus();
    expect(status.accountEmail).toBe('asknora@nestrealty.com');
    expect(status.organization).toBe('Nest Realty Wilmington');
    expect(status.status).toBe('connected');
    expect(status.capabilities.inboundEmailAutopilot).toBe(true);
    expect(status.capabilities.driveRagSync).toBe(true);
    expect(status.capabilities.humanInTheLoopGating).toBe(true);
    expect(status.capabilities.docsExport).toBe(true);
    expect(status.linkedFolders.length).toBeGreaterThanOrEqual(4);
  });

  it('2. Links and synchronizes Google Drive & Nest U folders into Nora RAG brain', async () => {
    const linked = await linkDriveFolder({
      name: 'Nest U 2026 Listing Strategy Workshop',
      driveFolderId: '1E_NestU_Listing_Strategy',
      category: 'nest_u',
      description: 'Advanced listing presentation playbooks and client scripts.',
      autoSync: true
    });

    expect(linked.id).toBeDefined();
    expect(linked.name).toBe('Nest U 2026 Listing Strategy Workshop');
    expect(linked.syncStatus).toBe('synced');
    expect(linked.documentCount).toBeGreaterThan(0);

    const syncResult = await syncDriveFolder(linked.id);
    expect(syncResult.success).toBe(true);
    expect(syncResult.indexedCount).toBeGreaterThan(0);
    expect(syncResult.message).toContain('Successfully synchronized');
  });

  it('3. Processes inbound email task requests, extracts property & deliverables, and dispatches tracking link', async () => {
    const result = await processInboundGoogleEmail({
      fromEmail: 'ryan@nestrealty.com',
      fromName: 'Ryan Crecelius',
      toEmail: 'asknora@nestrealty.com',
      subject: 'New Listing Marketing for 304 Ocean Blvd - flyers and postcards',
      bodyText: 'Nora, please generate the 8.5x11 flyers and 6x9 postcards for 304 Ocean Boulevard.'
    });

    expect(result.success).toBe(true);
    expect(result.intent).toBe('task_request');
    expect(result.propertyAddress).toContain('304 Ocean');
    expect(result.extractedDeliverables?.length).toBeGreaterThan(0);
    expect(result.receiptDispatched).toBe(true);
    expect(result.trackingUrl).toContain('/app/marketing');
  });

  it('4. Enforces Human-in-the-Loop safeguards on external vendor sign post actions', async () => {
    const result = await processInboundGoogleEmail({
      fromEmail: 'melissa@nestrealty.com',
      fromName: 'Melissa Gagliardi',
      toEmail: 'asknora@nestrealty.com',
      subject: 'Order sign post install at 152 Edgewater Lane',
      bodyText: 'Please dispatch Coastal Sign Post Co to install the post and rider at 152 Edgewater Lane.'
    });

    expect(result.success).toBe(true);
    expect(result.intent).toBe('task_request');
    expect(result.requiresHumanApproval).toBe(true);
    expect(result.approvalItemId).toBeDefined();
    expect(result.logMessage).toContain('Staged vendor dispatch in Approvals queue');
  });

  it('5. Answers brokerage policy and Nest U inquiries with grounded citations', async () => {
    const result = await processInboundGoogleEmail({
      fromEmail: 'eric@nestrealty.com',
      fromName: 'Eric Knight',
      toEmail: 'asknora@nestrealty.com',
      subject: 'Earnest money trust deposit deadline rule',
      bodyText: 'What is the required banking days rule for depositing earnest money under our SOP?'
    });

    expect(result.success).toBe(true);
    expect(result.intent).toBe('policy_question');
    expect(result.aiResponseText).toContain('3 banking days');
    expect(result.citedSources?.length).toBeGreaterThan(0);
    expect(result.receiptDispatched).toBe(true);
  });

  it('6. Generates formatted Google Docs export URLs for marketing packages', async () => {
    const exportResult = await exportToGoogleDocs('304 Ocean Blvd Marketing Package', '# Marketing Summary\n- Flyer\n- Postcard');
    expect(exportResult.success).toBe(true);
    expect(exportResult.googleDocUrl).toContain('https://docs.google.com/document/d/');
  });

  it('7. Frontend Settings UI cleanly manages tab navigation', () => {
    const hubViewPath = path.resolve(__dirname, '../components/settings/GoogleWorkspaceHubView.tsx');
    const settingsPath = path.resolve(__dirname, '../components/nest-wilmington/RyanSettingsPage.tsx');

    const hubContent = fs.readFileSync(hubViewPath, 'utf-8');
    const settingsContent = fs.readFileSync(settingsPath, 'utf-8');

    expect(hubContent).toContain('Google Workspace Hub');
    expect(hubContent).toContain('AskNora@nestrealty.com');
    expect(hubContent).toContain('Linked Google Drive & Nest U RAG Folders');
    expect(hubContent).toContain('Dynamic Google Drive Listing Asset Packs');

    expect(settingsContent).not.toContain('google_workspace');
    expect(settingsContent).not.toContain('Google Workspace Hub (Ask Nora)');
  });
});
