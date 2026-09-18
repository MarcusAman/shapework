/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  scaffoldListingDriveFolder,
  listScaffoldedListingFolders,
  determineSubfoldersForDeliverables,
  getScaffoldedFolderForProperty
} from '../../server/integrations/google/googleDriveScaffolding';
import {
  syncEventToGoogleCalendar,
  generateIcsContent,
  listMasterCalendarEvents
} from '../../server/integrations/google/googleCalendarSyncService';
import {
  syncAppToGoogleSheets,
  syncGoogleSheetsToApp,
  getMasterSheetMetadata
} from '../../server/integrations/google/googleSheetsSyncService';
import {
  processVendorEmailReply,
  createGmailDraft,
  dispatchGmailDraft,
  listGmailDrafts
} from '../../server/integrations/google/googleGmailVendorIntelligence';

describe('Ask Nora Google Workspace 4-Pillar Expansion Test Suite', () => {
  describe('Pillar 1: Dynamic Google Drive Folder Scaffolding', () => {
    it('1. Correctly determines subfolders based on requested deliverables', () => {
      const subfolders = determineSubfoldersForDeliverables(['8.5x11 Flyer', 'Instagram Story Graphics', 'Form 2-T Disclosures', 'Drone 4K']);
      const names = subfolders.map(s => s.name);

      expect(names).toContain('01_High_Res_Photos');
      expect(names).toContain('02_Print_Collateral_PDFs');
      expect(names).toContain('03_Social_Media_Graphics');
      expect(names).toContain('04_NCREC_Disclosures_Signed');
      expect(names).toContain('05_Video_Drone_3D_Tours');
    });

    it('2. Scaffolds a new listing Google Drive folder hierarchy with sharable links', async () => {
      const result = await scaffoldListingDriveFolder({
        propertyAddress: '714 Coral Reef Lane, Carolina Beach, NC 28428',
        agentName: 'Eric Knight',
        deliverables: ['Flyer', 'Postcard', 'Social Graphics']
      });

      expect(result.id).toBeDefined();
      expect(result.rootFolderName).toContain('714 Coral Reef Lane - Eric Knight');
      expect(result.rootDriveUrl).toContain('https://drive.google.com/drive/folders/');
      expect(result.subfolders.length).toBeGreaterThanOrEqual(3);

      const found = getScaffoldedFolderForProperty('714 Coral Reef Lane');
      expect(found).toBeDefined();
      expect(found?.agentName).toBe('Eric Knight');
    });
  });

  describe('Pillar 2: Google Calendar Master Ops Sync & Direct Invites', () => {
    it('3. Generates compliant iCalendar .ics format and dispatches calendar invitations', async () => {
      const eventData = {
        title: 'Open House: 714 Coral Reef Lane',
        description: 'Coastal Beach weekend open house hosted by Eric Knight.',
        location: '714 Coral Reef Lane, Carolina Beach, NC',
        startTime: new Date(Date.now() + 86400000 * 3).toISOString(),
        endTime: new Date(Date.now() + 86400000 * 3 + 7200000).toISOString(),
        eventType: 'open_house' as const,
        attendees: [
          { email: 'eric@nestrealty.com', name: 'Eric Knight', role: 'Host Agent' },
          { email: 'melissa@nestrealty.com', name: 'Melissa Gagliardi', role: 'Marketing Lead' },
          { email: 'asknora@nestrealty.com', name: 'Nora (Nest Operations)', role: 'Organizer' }
        ]
      };

      const ics = generateIcsContent(eventData);
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('METHOD:REQUEST');
      expect(ics).toContain('SUMMARY:Open House: 714 Coral Reef Lane');
      expect(ics).toContain('ORGANIZER;CN=Nora (Nest Operations):mailto:asknora@nestrealty.com');

      const syncResult = await syncEventToGoogleCalendar(eventData);
      expect(syncResult.success).toBe(true);
      expect(syncResult.invitesDispatched).toBe(2);
      expect(syncResult.googleCalendarUrl).toContain('calendar.google.com');

      const allEvents = listMasterCalendarEvents();
      expect(allEvents.some(e => e.title.includes('714 Coral Reef'))).toBe(true);
    });
  });

  describe('Pillar 3: Two-Way Google Sheets Pipeline Sync', () => {
    it('4. Pushes live application state into the 3-Tab Master Google Sheet', async () => {
      const sheetState = await syncAppToGoogleSheets({
        pipelineTasks: [
          {
            taskId: 'tsk_714_coral',
            propertyAddress: '714 Coral Reef Lane, Carolina Beach, NC',
            clientAgent: 'Eric Knight',
            assignedTo: 'Eduardo Lovo',
            deliverables: 'Flyer, Social Graphics',
            status: 'Assigned',
            dueDate: 'Friday at 2:00 PM EST',
            driveFolderUrl: 'https://drive.google.com/drive/folders/1DRV_714_CORAL',
            lastUpdated: new Date().toISOString()
          }
        ]
      });

      expect(sheetState.spreadsheetId).toBe('1SHT_NEST_WILMINGTON_MARKETING_2026');
      expect(sheetState.tabs.marketingPipeline.rowCount).toBe(1);
      expect(sheetState.tabs.vendorDispatches.rowCount).toBeGreaterThanOrEqual(1);
      expect(sheetState.tabs.listingAssetPacks.rowCount).toBeGreaterThanOrEqual(1);
      expect(sheetState.lastSyncDirection).toBe('app_to_sheets');
    });

    it('5. Ingests row updates from Google Sheets back into Nest App state', async () => {
      const ingestResult = await syncGoogleSheetsToApp({
        pipelineTasks: [
          {
            taskId: 'tsk_714_coral',
            status: 'Completed'
          }
        ]
      });

      expect(ingestResult.success).toBe(true);
      expect(ingestResult.appliedUpdatesCount).toBe(1);

      const metadata = getMasterSheetMetadata();
      const updatedTask = metadata.tabs.marketingPipeline.rows.find(r => r.taskId === 'tsk_714_coral');
      expect(updatedTask?.status).toBe('Completed');
    });
  });

  describe('Pillar 4: Gmail Vendor Thread Intelligence & Auto-Drafting', () => {
    it('6. Parses incoming vendor emails to auto-detect completion and update work order status', async () => {
      const parseResult = await processVendorEmailReply({
        fromEmail: 'dispatch@coastalsignpost.com',
        fromName: 'Coastal Sign Post Co. Dispatch',
        subject: 'Completed: Sign Post Install at 304 Ocean Blvd',
        bodyText: 'Hi Nora, the 4x4 vinyl post and Coming Soon rider was installed today at 304 Ocean Boulevard. Work Order #CSP-8921-WB is complete.'
      });

      expect(parseResult.success).toBe(true);
      expect(parseResult.isVendorReply).toBe(true);
      expect(parseResult.vendorName).toBe('Coastal Sign Post Co.');
      expect(parseResult.detectedStatus).toBe('completed');
      expect(parseResult.trackingNumber).toBe('CSP-8921-WB');
      expect(parseResult.workOrderUpdated).toBe(true);
    });

    it('7. Stages reviewable Gmail Drafts and dispatches with Human-in-the-Loop approval', async () => {
      const draft = await createGmailDraft({
        toEmail: 'orders@coastalprintworks.com',
        toName: 'Coastal Print Works',
        subject: 'Print Order: 714 Coral Reef Lane Postcards',
        bodyText: 'Please print 100x 6x9 satin finish postcards for 714 Coral Reef Lane.',
        category: 'vendor_order',
        relatedPropertyAddress: '714 Coral Reef Lane, Carolina Beach, NC'
      });

      expect(draft.id).toBeDefined();
      expect(draft.status).toBe('draft_staged');

      const allDrafts = listGmailDrafts();
      expect(allDrafts.some(d => d.id === draft.id)).toBe(true);

      const dispatchResult = await dispatchGmailDraft(draft.id, 'Ann Gunn (Ops Lead)');
      expect(dispatchResult.success).toBe(true);
      expect(dispatchResult.draft.status).toBe('sent');
      expect(dispatchResult.draft.approvedBy).toBe('Ann Gunn (Ops Lead)');
    });
  });
});
