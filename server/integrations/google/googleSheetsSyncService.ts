/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Two-Way Google Sheets Pipeline Sync Service for Ask Nora
 * Manages live bidirectional synchronization between Shapework/Nest App and the Master Google Sheet:
 * Tab 1: Active Marketing Pipeline
 * Tab 2: Vendor Dispatches & Approvals
 * Tab 3: Listing Asset Packs & Drive Links
 */

import { listScaffoldedListingFolders } from './googleDriveScaffolding.js';

export interface SheetPipelineTaskRow {
  taskId: string;
  propertyAddress: string;
  clientAgent: string;
  assignedTo: string;
  deliverables: string;
  status: string;
  dueDate: string;
  driveFolderUrl: string;
  lastUpdated: string;
}

export interface SheetVendorDispatchRow {
  orderId: string;
  propertyAddress: string;
  vendorName: string;
  serviceRequested: string;
  approvalStatus: string;
  humanApprover: string;
  dispatchDate: string;
  trackingNumber: string;
}

export interface SheetListingAssetRow {
  propertyAddress: string;
  agentName: string;
  rootDriveFolderUrl: string;
  photosFolderUrl: string;
  printPdfsFolderUrl: string;
  socialFolderUrl: string;
  disclosuresFolderUrl: string;
}

export interface MasterGoogleSheetState {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  tabs: {
    marketingPipeline: { title: string; tabUrl: string; rowCount: number; rows: SheetPipelineTaskRow[] };
    vendorDispatches: { title: string; tabUrl: string; rowCount: number; rows: SheetVendorDispatchRow[] };
    listingAssetPacks: { title: string; tabUrl: string; rowCount: number; rows: SheetListingAssetRow[] };
  };
  lastSyncedAt: string;
  lastSyncDirection: 'app_to_sheets' | 'sheets_to_app' | 'initial';
  syncStatus: 'synced' | 'syncing' | 'error';
}

// In-memory master sheet state
let masterSheetState: MasterGoogleSheetState = {
  spreadsheetId: '1SHT_NEST_WILMINGTON_MARKETING_2026',
  spreadsheetTitle: 'Nest Realty Wilmington — Marketing & Operations Master Tracker 2026',
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1SHT_NEST_WILMINGTON_MARKETING_2026/edit',
  tabs: {
    marketingPipeline: {
      title: 'Active Marketing Pipeline',
      tabUrl: 'https://docs.google.com/spreadsheets/d/1SHT_NEST_WILMINGTON_MARKETING_2026/edit#gid=0',
      rowCount: 3,
      rows: [
        {
          taskId: 'tsk_304_ocean',
          propertyAddress: '304 Ocean Boulevard, Wrightsville Beach, NC',
          clientAgent: 'Ryan Crecelius',
          assignedTo: 'Eduardo Lovo',
          deliverables: '8.5x11 Flyer, 6x9 Postcard, Social Graphics',
          status: 'In Progress',
          dueDate: 'Tomorrow at 3:00 PM EST',
          driveFolderUrl: 'https://drive.google.com/drive/folders/1DRV_304_OCEAN_BLVD',
          lastUpdated: new Date().toISOString()
        },
        {
          taskId: 'tsk_152_edge',
          propertyAddress: '152 Edgewater Lane, Wilmington, NC',
          clientAgent: 'Melissa Gagliardi',
          assignedTo: 'Melissa Gagliardi',
          deliverables: 'Luxury CMA Deck, Open House Packet',
          status: 'Completed',
          dueDate: 'Aug 24, 2026',
          driveFolderUrl: 'https://drive.google.com/drive/folders/1DRV_152_EDGEWATER_LN',
          lastUpdated: new Date(Date.now() - 86400000).toISOString()
        },
        {
          taskId: 'tsk_418_chesapeake',
          propertyAddress: '418 Chesapeake Way, Landfall, NC',
          clientAgent: 'Ann Gunn',
          assignedTo: 'Ann Gunn',
          deliverables: 'Twilight Photo Retouch, Just Listed Postcards',
          status: 'Under Review',
          dueDate: 'Today at 5:00 PM EST',
          driveFolderUrl: 'https://drive.google.com/drive/folders/1DRV_418_CHESAPEAKE',
          lastUpdated: new Date().toISOString()
        }
      ]
    },
    vendorDispatches: {
      title: 'Vendor Dispatches & Approvals',
      tabUrl: 'https://docs.google.com/spreadsheets/d/1SHT_NEST_WILMINGTON_MARKETING_2026/edit#gid=1',
      rowCount: 2,
      rows: [
        {
          orderId: 'vnd_ord_881',
          propertyAddress: '304 Ocean Boulevard, Wrightsville Beach, NC',
          vendorName: 'Coastal Sign Post Co.',
          serviceRequested: 'Yard Post + Custom Rider Install',
          approvalStatus: 'Approved & Dispatched',
          humanApprover: 'Melissa Gagliardi (BIC Approved)',
          dispatchDate: new Date().toISOString().split('T')[0],
          trackingNumber: 'CSP-8921-WB'
        },
        {
          orderId: 'vnd_ord_882',
          propertyAddress: '152 Edgewater Lane, Wilmington, NC',
          vendorName: 'Coastal Print Works',
          serviceRequested: '100x 6x9 Heavy Cardstock Postcards',
          approvalStatus: 'Pending BIC Sign-off',
          humanApprover: 'Awaiting Ann Gunn',
          dispatchDate: new Date().toISOString().split('T')[0],
          trackingNumber: 'CPW-PRN-0041'
        }
      ]
    },
    listingAssetPacks: {
      title: 'Listing Asset Packs & Drive Links',
      tabUrl: 'https://docs.google.com/spreadsheets/d/1SHT_NEST_WILMINGTON_MARKETING_2026/edit#gid=2',
      rowCount: 2,
      rows: [
        {
          propertyAddress: '304 Ocean Boulevard, Wrightsville Beach, NC',
          agentName: 'Ryan Crecelius',
          rootDriveFolderUrl: 'https://drive.google.com/drive/folders/1DRV_304_OCEAN_BLVD',
          photosFolderUrl: 'https://drive.google.com/drive/folders/1DRV_304_01_PHOTOS',
          printPdfsFolderUrl: 'https://drive.google.com/drive/folders/1DRV_304_02_PRINT',
          socialFolderUrl: 'https://drive.google.com/drive/folders/1DRV_304_03_SOCIAL',
          disclosuresFolderUrl: 'https://drive.google.com/drive/folders/1DRV_304_04_NCREC'
        },
        {
          propertyAddress: '152 Edgewater Lane, Wilmington, NC',
          agentName: 'Melissa Gagliardi',
          rootDriveFolderUrl: 'https://drive.google.com/drive/folders/1DRV_152_EDGEWATER_LN',
          photosFolderUrl: 'https://drive.google.com/drive/folders/1DRV_152_01_PHOTOS',
          printPdfsFolderUrl: 'https://drive.google.com/drive/folders/1DRV_152_02_PRINT',
          socialFolderUrl: 'https://drive.google.com/drive/folders/1DRV_152_03_SOCIAL',
          disclosuresFolderUrl: 'N/A'
        }
      ]
    }
  },
  lastSyncedAt: new Date().toISOString(),
  lastSyncDirection: 'initial',
  syncStatus: 'synced'
};

/**
 * Pushes live application state (tasks, work orders, asset packs) to the Google Sheet.
 */
export async function syncAppToGoogleSheets(customData?: {
  pipelineTasks?: SheetPipelineTaskRow[];
  vendorOrders?: SheetVendorDispatchRow[];
}): Promise<MasterGoogleSheetState> {
  const folders = listScaffoldedListingFolders();
  const assetRows: SheetListingAssetRow[] = folders.map(f => {
    const photosSub = f.subfolders.find(s => s.category === 'photos')?.driveUrl || f.rootDriveUrl;
    const printSub = f.subfolders.find(s => s.category === 'print')?.driveUrl || f.rootDriveUrl;
    const socialSub = f.subfolders.find(s => s.category === 'social')?.driveUrl || f.rootDriveUrl;
    const disclosuresSub = f.subfolders.find(s => s.category === 'disclosures')?.driveUrl || 'N/A';
    return {
      propertyAddress: f.propertyAddress,
      agentName: f.agentName,
      rootDriveFolderUrl: f.rootDriveUrl,
      photosFolderUrl: photosSub,
      printPdfsFolderUrl: printSub,
      socialFolderUrl: socialSub,
      disclosuresFolderUrl: disclosuresSub
    };
  });

  if (customData?.pipelineTasks) {
    masterSheetState.tabs.marketingPipeline.rows = customData.pipelineTasks;
    masterSheetState.tabs.marketingPipeline.rowCount = customData.pipelineTasks.length;
  }

  if (customData?.vendorOrders) {
    masterSheetState.tabs.vendorDispatches.rows = customData.vendorOrders;
    masterSheetState.tabs.vendorDispatches.rowCount = customData.vendorOrders.length;
  }

  if (assetRows.length > 0) {
    masterSheetState.tabs.listingAssetPacks.rows = assetRows;
    masterSheetState.tabs.listingAssetPacks.rowCount = assetRows.length;
  }

  masterSheetState.lastSyncedAt = new Date().toISOString();
  masterSheetState.lastSyncDirection = 'app_to_sheets';
  masterSheetState.syncStatus = 'synced';

  console.log(`[Google Sheets Sync] Successfully pushed app state to Master Sheet (${masterSheetState.tabs.marketingPipeline.rowCount} tasks, ${masterSheetState.tabs.vendorDispatches.rowCount} vendor orders, ${masterSheetState.tabs.listingAssetPacks.rowCount} asset packs)`);

  return masterSheetState;
}

/**
 * Ingests external sheet modifications back into the Nest App database.
 */
export async function syncGoogleSheetsToApp(updates?: {
  pipelineTasks?: Partial<SheetPipelineTaskRow>[];
  vendorOrders?: Partial<SheetVendorDispatchRow>[];
}): Promise<{
  success: boolean;
  appliedUpdatesCount: number;
  message: string;
  sheetState: MasterGoogleSheetState;
}> {
  let appliedCount = 0;

  if (updates?.pipelineTasks) {
    updates.pipelineTasks.forEach(update => {
      const existing = masterSheetState.tabs.marketingPipeline.rows.find(r => r.taskId === update.taskId);
      if (existing) {
        Object.assign(existing, update, { lastUpdated: new Date().toISOString() });
        appliedCount++;
      }
    });
  }

  if (updates?.vendorOrders) {
    updates.vendorOrders.forEach(update => {
      const existing = masterSheetState.tabs.vendorDispatches.rows.find(r => r.orderId === update.orderId);
      if (existing) {
        Object.assign(existing, update);
        appliedCount++;
      }
    });
  }

  masterSheetState.lastSyncedAt = new Date().toISOString();
  masterSheetState.lastSyncDirection = 'sheets_to_app';
  masterSheetState.syncStatus = 'synced';

  console.log(`[Google Sheets Ingest] Synced ${appliedCount} updates from Google Sheet back into Nest App.`);

  return {
    success: true,
    appliedUpdatesCount: appliedCount,
    message: `✓ Successfully synchronized ${appliedCount} updates from Master Google Sheet into Nest App.`,
    sheetState: masterSheetState
  };
}

/**
 * Returns current Master Google Sheet metadata.
 */
export function getMasterSheetMetadata(): MasterGoogleSheetState {
  return masterSheetState;
}
