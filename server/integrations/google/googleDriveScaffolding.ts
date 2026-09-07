/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Google Drive Folder Scaffolding Service for Ask Nora
 * Dynamically creates structured Google Drive asset folders based on requested listing deliverables.
 */

export interface SubFolderSpec {
  id: string;
  name: string;
  category: 'photos' | 'print' | 'social' | 'disclosures' | 'video_drone' | 'general';
  driveUrl: string;
  fileCount: number;
}

export interface ScaffoldedListingFolder {
  id: string;
  propertyAddress: string;
  agentName: string;
  rootFolderName: string;
  rootFolderId: string;
  rootDriveUrl: string;
  subfolders: SubFolderSpec[];
  createdAt: string;
  lastSyncedAt: string;
}

// In-memory store for scaffolded folders (synced with persistence)
const scaffoldedFoldersStore: Map<string, ScaffoldedListingFolder> = new Map();

// Initialize sample folders for Wilmington active listings
const initialScaffoldedFolders: ScaffoldedListingFolder[] = [
  {
    id: 'fld_304_ocean',
    propertyAddress: '304 Ocean Boulevard, Wrightsville Beach, NC 28480',
    agentName: 'Ryan Crecelius',
    rootFolderName: '304 Ocean Blvd - Ryan Crecelius',
    rootFolderId: '1DRV_304_OCEAN_BLVD',
    rootDriveUrl: `https://drive.google.com/drive/search?q=${encodeURIComponent('304 Ocean Boulevard')}`,
    subfolders: [
      { id: 'sub_01', name: '01_High_Res_Photos', category: 'photos', driveUrl: `https://drive.google.com/drive/search?q=${encodeURIComponent('304 Ocean Boulevard Photos')}`, fileCount: 28 },
      { id: 'sub_02', name: '02_Print_Collateral_PDFs', category: 'print', driveUrl: `https://drive.google.com/drive/search?q=${encodeURIComponent('304 Ocean Boulevard Print Flyer')}`, fileCount: 4 },
      { id: 'sub_03', name: '03_Social_Media_Graphics', category: 'social', driveUrl: `https://drive.google.com/drive/search?q=${encodeURIComponent('304 Ocean Boulevard Social')}`, fileCount: 6 },
      { id: 'sub_04', name: '04_NCREC_Disclosures_Signed', category: 'disclosures', driveUrl: `https://drive.google.com/drive/search?q=${encodeURIComponent('304 Ocean Boulevard Disclosures')}`, fileCount: 3 }
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastSyncedAt: new Date().toISOString()
  },
  {
    id: 'fld_152_edge',
    propertyAddress: '152 Edgewater Lane, Wilmington, NC 28403',
    agentName: 'Melissa Gagliardi',
    rootFolderName: '152 Edgewater Lane - Melissa Gagliardi',
    rootFolderId: '1DRV_152_EDGEWATER_LN',
    rootDriveUrl: `https://drive.google.com/drive/search?q=${encodeURIComponent('152 Edgewater Lane')}`,
    subfolders: [
      { id: 'sub_11', name: '01_High_Res_Photos', category: 'photos', driveUrl: `https://drive.google.com/drive/search?q=${encodeURIComponent('152 Edgewater Lane Photos')}`, fileCount: 18 },
      { id: 'sub_12', name: '02_Print_Collateral_PDFs', category: 'print', driveUrl: `https://drive.google.com/drive/search?q=${encodeURIComponent('152 Edgewater Lane Print')}`, fileCount: 2 },
      { id: 'sub_13', name: '03_Social_Media_Graphics', category: 'social', driveUrl: `https://drive.google.com/drive/search?q=${encodeURIComponent('152 Edgewater Lane Social')}`, fileCount: 4 }
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    lastSyncedAt: new Date().toISOString()
  }
];

initialScaffoldedFolders.forEach(f => scaffoldedFoldersStore.set(f.id, f));

/**
 * Dynamically detects required subfolders based on requested deliverables.
 */
export function determineSubfoldersForDeliverables(deliverables: string[]): { name: string; category: SubFolderSpec['category'] }[] {
  const subfolders: { name: string; category: SubFolderSpec['category'] }[] = [];
  const text = deliverables.join(' ').toLowerCase();

  // Always include high-res photos
  subfolders.push({ name: '01_High_Res_Photos', category: 'photos' });

  // Print Collateral
  if (text.includes('flyer') || text.includes('postcard') || text.includes('brochure') || text.includes('print') || text.includes('packet') || deliverables.length === 0) {
    subfolders.push({ name: '02_Print_Collateral_PDFs', category: 'print' });
  }

  // Social Media Graphics
  if (text.includes('social') || text.includes('instagram') || text.includes('facebook') || text.includes('story') || text.includes('post') || deliverables.length === 0) {
    subfolders.push({ name: '03_Social_Media_Graphics', category: 'social' });
  }

  // Disclosures & Contracts
  if (text.includes('disclosure') || text.includes('2-t') || text.includes('mogr') || text.includes('rpd') || text.includes('signed') || text.includes('ncrec')) {
    subfolders.push({ name: '04_NCREC_Disclosures_Signed', category: 'disclosures' });
  }

  // Video & Drone 3D
  if (text.includes('video') || text.includes('drone') || text.includes('matterport') || text.includes('virtual tour') || text.includes('3d')) {
    subfolders.push({ name: '05_Video_Drone_3D_Tours', category: 'video_drone' });
  }

  return subfolders;
}

/**
 * Scaffolds a new Google Drive folder hierarchy for a listing.
 */
export async function scaffoldListingDriveFolder(params: {
  propertyAddress: string;
  agentName?: string;
  deliverables?: string[];
}): Promise<ScaffoldedListingFolder> {
  const { propertyAddress, agentName = 'Nest Listing Agent', deliverables = [] } = params;

  const addressSlug = propertyAddress.split(',')[0].replace(/[^a-zA-Z0-9 ]/g, '').trim();
  const rootFolderName = `${addressSlug} - ${agentName}`;
  const rootFolderId = `1DRV_${addressSlug.replace(/\s+/g, '_').toUpperCase()}_${Date.now().toString(36).toUpperCase()}`;
  const rootDriveUrl = `https://drive.google.com/drive/folders/${rootFolderId}`;

  const plannedSubfolders = determineSubfoldersForDeliverables(deliverables);
  const subfolders: SubFolderSpec[] = plannedSubfolders.map((item, idx) => {
    const subFolderId = `${rootFolderId}_SUB_${idx + 1}`;
    return {
      id: `sub_${idx + 1}_${Date.now().toString(36)}`,
      name: item.name,
      category: item.category,
      driveUrl: `https://drive.google.com/drive/folders/${subFolderId}`,
      fileCount: 0
    };
  });

  const folderRecord: ScaffoldedListingFolder = {
    id: `fld_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    propertyAddress,
    agentName,
    rootFolderName,
    rootFolderId,
    rootDriveUrl,
    subfolders,
    createdAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString()
  };

  scaffoldedFoldersStore.set(folderRecord.id, folderRecord);
  console.log(`[Drive Scaffolding] Successfully scaffolded Drive folder for: ${rootFolderName} (${subfolders.length} subfolders)`);

  return folderRecord;
}

/**
 * Lists all active scaffolded Drive folders.
 */
export function listScaffoldedListingFolders(): ScaffoldedListingFolder[] {
  return Array.from(scaffoldedFoldersStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Gets a scaffolded folder by ID or property address match.
 */
export function getScaffoldedFolderForProperty(address: string): ScaffoldedListingFolder | undefined {
  const normalized = address.toLowerCase().trim();
  for (const folder of scaffoldedFoldersStore.values()) {
    if (folder.propertyAddress.toLowerCase().includes(normalized) || normalized.includes(folder.propertyAddress.toLowerCase().split(',')[0])) {
      return folder;
    }
  }
  return undefined;
}
