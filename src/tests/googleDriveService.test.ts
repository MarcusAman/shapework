import { describe, it, expect } from 'vitest';
import { GoogleDriveService } from '../../server/services/googleDriveService.js';
import { executeGoogleDriveTool } from '../../server/ai/tools/googleDriveMcpTools.js';

describe('Google Drive API v3 Service Suite', () => {
  it('1. Retrieves linked operational knowledge folders with compliance playbooks', () => {
    const folders = GoogleDriveService.getLinkedFolders();
    expect(folders.length).toBeGreaterThanOrEqual(2);

    const policyFolder = folders.find(f => f.id === 'folder_policies');
    expect(policyFolder).toBeDefined();
    expect(policyFolder?.category).toBe('Compliance & Legal');
    expect(policyFolder?.documentCount).toBeGreaterThanOrEqual(10);
  });

  it('2. Scaffolds a new property listing folder with standard subfolder hierarchy', async () => {
    const scaffold = await GoogleDriveService.scaffoldListingFolder({
      propertyAddress: '104 Live Oak Dr, Wrightsville Beach NC',
      agentName: 'Melissa Gagliardi',
      agentEmail: 'melissa.g@nestrealty.com',
      deliverables: '8.5x11 Flyer, 6x9 Postcards, High-Res Photos, Signed Disclosures'
    });

    expect(scaffold.id).toBeDefined();
    expect(scaffold.propertyAddress).toBe('104 Live Oak Dr, Wrightsville Beach NC');
    expect(scaffold.agentName).toBe('Melissa Gagliardi');
    expect(scaffold.agentEmail).toBe('melissa.g@nestrealty.com');
    expect(scaffold.subfolders.length).toBe(4);
    expect(scaffold.subfolders.some(s => s.name === '01_Photos_Media')).toBe(true);
    expect(scaffold.subfolders.some(s => s.name === '02_Contracts_Disclosures')).toBe(true);
    expect(scaffold.subfolders.some(s => s.name === '03_Marketing_Flyers')).toBe(true);
    expect(scaffold.subfolders.some(s => s.name === '04_FloorPlans')).toBe(true);

    const allScaffolds = GoogleDriveService.getScaffolds();
    expect(allScaffolds.some(s => s.id === scaffold.id)).toBe(true);
  });

  it('3. Searches Drive documents and brokerage SOPs', async () => {
    const results = await GoogleDriveService.searchDriveDocuments('NCREC');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].name).toContain('NCREC');
    expect(results[0].webViewLink).toBeDefined();
  });

  it('4. Executes Google Drive tool calls from Nora AI', async () => {
    const searchRes = await executeGoogleDriveTool('search_google_drive', { query: 'Brand' });
    expect(searchRes.length).toBeGreaterThanOrEqual(1);
    expect(searchRes[0].name).toContain('Brand Standard');

    const scaffoldRes = await executeGoogleDriveTool('scaffold_listing_drive_folder', {
      propertyAddress: '518 Chestnut St, Wilmington NC',
      agentName: 'Ann Gunn',
      agentEmail: 'ann.gunn@nestrealty.com'
    });
    expect(scaffoldRes.propertyAddress).toBe('518 Chestnut St, Wilmington NC');
    expect(scaffoldRes.subfolders.length).toBe(4);
  });

  it('5. Synchronizes a linked folder to Nora RAG vector knowledge base', async () => {
    const syncRes = await GoogleDriveService.syncFolder('folder_policies');
    expect(syncRes.success).toBe(true);
    expect(syncRes.documentCount).toBeGreaterThanOrEqual(10);
    expect(syncRes.message).toContain('synchronized');
  });
});
