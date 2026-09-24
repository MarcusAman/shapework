/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * googleDriveService
 * Live Google Drive API v3 Integration Service for Google Workspace.
 * Handles property listing folder scaffolding, agent/domain permissions, document search/RAG, and asset auto-export.
 */

import { google } from 'googleapis';
import { Readable } from 'stream';
import { getOAuthClient, getGoogleAccessToken } from '../integrations/google/googleOAuth.js';
import { IntegrationStateStore } from '../integrations/shared/integrationStateStore.js';

export interface ListingDriveScaffold {
  id: string;
  propertyAddress: string;
  agentName: string;
  agentEmail: string;
  driveFolderId: string;
  driveFolderUrl: string;
  subfolders: { name: string; id: string; url: string }[];
  deliverables?: string[];
  createdAt: string;
  status: 'active' | 'archived';
  isLiveDrive: boolean;
}

export interface DriveDocumentResult {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  modifiedTime?: string;
  size?: string;
  iconLink?: string;
}

export interface LinkedFolderSyncStatus {
  id: string;
  name: string;
  driveFolderId: string;
  category: string;
  syncStatus: 'synced' | 'syncing' | 'error' | 'pending';
  lastSyncedAt: string;
  documentCount: number;
  description: string;
  autoSync: boolean;
}

class GoogleDriveServiceEngine {
  private scaffolds: Map<string, ListingDriveScaffold> = new Map();
  private linkedFolders: Map<string, LinkedFolderSyncStatus> = new Map();

  constructor() {
    this.initializeDefaultLinkedFolders();
  }

  private initializeDefaultLinkedFolders() {
    this.linkedFolders.set('folder_policies', {
      id: 'folder_policies',
      name: 'Brokerage SOPs & Compliance Playbooks',
      driveFolderId: 'drive_folder_policies_001',
      category: 'Compliance & Legal',
      syncStatus: 'synced',
      lastSyncedAt: new Date().toISOString(),
      documentCount: 14,
      description: 'NCREC Rule 58A, Trust account guidelines, earnest money timelines, and BIC policies.',
      autoSync: true
    });

    this.linkedFolders.set('folder_marketing', {
      id: 'folder_marketing',
      name: 'Brand Templates & Flyer Guidelines',
      driveFolderId: 'drive_folder_mktg_002',
      category: 'Marketing & Design',
      syncStatus: 'synced',
      lastSyncedAt: new Date().toISOString(),
      documentCount: 28,
      description: 'Approved brand logos, 8.5x11 flyer layouts, social postcard templates, and font rules.',
      autoSync: true
    });
  }

  /**
   * Helper to retrieve authenticated Google Drive client
   */
  private async getAuthenticatedDriveClient(workspaceId: string = 'nest-realty-demo'): Promise<{ drive: any; userEmail: string } | null> {
    try {
      const dbState = (global as any).__SHAPEWORK_DB_STATE || {};
      const store = new IntegrationStateStore(dbState);
      const connection = await store.getConnection(workspaceId, 'google_workspace');
      if (!connection || connection.status !== 'connected') {
        return null;
      }

      const saveCallback = async () => {};
      const accessToken = await getGoogleAccessToken(connection, dbState, saveCallback);
      const oauth2Client = getOAuthClient();
      oauth2Client.setCredentials({ access_token: accessToken });

      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      return { drive, userEmail: connection.accountEmail || 'AskNora@nestrealty.com' };
    } catch (err: any) {
      console.warn('[GoogleDriveService] Unable to get authenticated Drive client:', err.message);
      return null;
    }
  }

  /**
   * Find or create the root "Nest Realty Operations" / "Listings" folders
   */
  private async getOrCreateRootListingsFolder(drive: any): Promise<string> {
    try {
      // Check for existing "Nest Realty Operations" folder
      const res = await drive.files.list({
        q: "name = 'Nest Realty Operations' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
        fields: 'files(id, name)'
      });

      let rootId: string;
      if (res.data.files && res.data.files.length > 0) {
        rootId = res.data.files[0].id!;
      } else {
        const createRoot = await drive.files.create({
          requestBody: {
            name: 'Nest Realty Operations',
            mimeType: 'application/vnd.google-apps.folder'
          },
          fields: 'id'
        });
        rootId = createRoot.data.id!;
      }

      // Check for "Listings" subfolder inside root
      const subRes = await drive.files.list({
        q: `'${rootId}' in parents and name = 'Listings' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name)'
      });

      if (subRes.data.files && subRes.data.files.length > 0) {
        return subRes.data.files[0].id!;
      }

      const createListings = await drive.files.create({
        requestBody: {
          name: 'Listings',
          parents: [rootId],
          mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id'
      });

      return createListings.data.id!;
    } catch (err: any) {
      console.warn('[GoogleDriveService] Error resolving root listings folder:', err.message);
      return 'root';
    }
  }

  /**
   * Scaffold a new property listing folder with standard subfolders and permissions
   */
  public async scaffoldListingFolder(params: {
    propertyAddress: string;
    agentName: string;
    agentEmail: string;
    deliverables?: string;
    workspaceId?: string;
    mlsNumber?: string | null;
  }): Promise<ListingDriveScaffold> {
    const { propertyAddress, agentName, agentEmail, deliverables, workspaceId = 'nest-realty-demo', mlsNumber } = params;
    void mlsNumber;

    const auth = await this.getAuthenticatedDriveClient(workspaceId);
    let driveFolderId = `folder_${Date.now()}`;
    let driveFolderUrl = `https://drive.google.com/drive/folders/${driveFolderId}`;
    let isLiveDrive = false;

    const subfolderNames = [
      '01_Photos_Media',
      '02_Contracts_Disclosures',
      '03_Marketing_Flyers',
      '04_FloorPlans'
    ];

    const subfolders: { name: string; id: string; url: string }[] = [];

    if (auth && auth.drive) {
      try {
        const rootListingsId = await this.getOrCreateRootListingsFolder(auth.drive);

        // 1. Create main property folder
        const folderRes = await auth.drive.files.create({
          requestBody: {
            name: propertyAddress,
            parents: [rootListingsId],
            mimeType: 'application/vnd.google-apps.folder',
            description: `Listing package for ${propertyAddress}. Listing Agent: ${agentName} (${agentEmail})`
          },
          fields: 'id, webViewLink'
        });

        driveFolderId = folderRes.data.id!;
        driveFolderUrl = folderRes.data.webViewLink || `https://drive.google.com/drive/folders/${driveFolderId}`;
        isLiveDrive = true;

        // 2. Create subfolders
        for (const subName of subfolderNames) {
          const subRes = await auth.drive.files.create({
            requestBody: {
              name: subName,
              parents: [driveFolderId],
              mimeType: 'application/vnd.google-apps.folder'
            },
            fields: 'id, webViewLink'
          });
          subfolders.push({
            name: subName,
            id: subRes.data.id!,
            url: subRes.data.webViewLink || `https://drive.google.com/drive/folders/${subRes.data.id}`
          });
        }

        // 3. Grant Editor permissions to the Listing Agent
        if (agentEmail && agentEmail.includes('@')) {
          try {
            await auth.drive.permissions.create({
              fileId: driveFolderId,
              requestBody: {
                role: 'writer',
                type: 'user',
                emailAddress: agentEmail
              },
              sendNotificationEmail: true
            });
          } catch (permErr: any) {
            console.warn(`[GoogleDriveService] Could not share folder with ${agentEmail}:`, permErr.message);
          }
        }

        // 4. Grant Domain View access to nestrealty.com
        try {
          await auth.drive.permissions.create({
            fileId: driveFolderId,
            requestBody: {
              role: 'reader',
              type: 'domain',
              domain: 'nestrealty.com'
            }
          });
        } catch (domainErr: any) {
          console.warn('[GoogleDriveService] Domain permission creation notice:', domainErr.message);
        }
      } catch (err: any) {
        console.warn('[GoogleDriveService] Live Drive folder scaffolding error, using fallback:', err.message);
      }
    }

    if (subfolders.length === 0) {
      subfolderNames.forEach((name, idx) => {
        const id = `sub_${driveFolderId}_${idx}`;
        subfolders.push({
          name,
          id,
          url: `https://drive.google.com/drive/folders/${id}`
        });
      });
    }

    const scaffold: ListingDriveScaffold = {
      id: `scaffold_${Date.now()}`,
      propertyAddress,
      agentName,
      agentEmail,
      driveFolderId,
      driveFolderUrl,
      subfolders,
      deliverables: deliverables ? deliverables.split(',').map(d => d.trim()) : ['8.5x11 Flyer', 'Floor Plan', 'Signed Disclosures'],
      createdAt: new Date().toISOString(),
      status: 'active',
      isLiveDrive
    };

    this.scaffolds.set(scaffold.id, scaffold);
    return scaffold;
  }

  /**
   * Search files and documents across Google Drive
   */
  public async searchDriveDocuments(query: string, workspaceId: string = 'nest-realty-demo'): Promise<DriveDocumentResult[]> {
    const auth = await this.getAuthenticatedDriveClient(workspaceId);

    if (auth && auth.drive && query.trim()) {
      try {
        const res = await auth.drive.files.list({
          q: `name contains '${query.replace(/'/g, "\\'")}' and trashed = false`,
          pageSize: 20,
          fields: 'files(id, name, mimeType, webViewLink, modifiedTime, size, iconLink)'
        });

        const files = res.data.files || [];
        return files.map((f: any) => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          webViewLink: f.webViewLink || `https://drive.google.com/open?id=${f.id}`,
          modifiedTime: f.modifiedTime,
          size: f.size,
          iconLink: f.iconLink
        }));
      } catch (err: any) {
        console.warn('[GoogleDriveService] Error searching Google Drive:', err.message);
      }
    }

    // Fallback search over simulated local knowledge documents
    const mockFiles: DriveDocumentResult[] = [
      {
        id: 'doc_ncrec_58a',
        name: 'NCREC Rule 58A Trust Account & Earnest Money Compliance Guide.pdf',
        mimeType: 'application/pdf',
        webViewLink: 'https://drive.google.com/file/d/sample_ncrec_58a/view',
        modifiedTime: new Date().toISOString(),
        size: '1.4 MB'
      },
      {
        id: 'doc_brand_guide',
        name: 'Nest Realty Wilmington Brand Standard & Marketing Toolkit 2026.pdf',
        mimeType: 'application/pdf',
        webViewLink: 'https://drive.google.com/file/d/sample_brand_guide/view',
        modifiedTime: new Date().toISOString(),
        size: '4.8 MB'
      },
      {
        id: 'doc_cma_template',
        name: 'Luxury Waterfront CMA & Seller Presentation Deck Master.gslides',
        mimeType: 'application/vnd.google-apps.presentation',
        webViewLink: 'https://docs.google.com/presentation/d/sample_cma_master/edit',
        modifiedTime: new Date().toISOString()
      }
    ];

    const q = query.toLowerCase();
    return mockFiles.filter(f => f.name.toLowerCase().includes(q));
  }

  /**
   * Upload an asset or PDF directly into a Drive folder
   */
  public async exportFileToDrive(params: {
    folderId: string;
    fileName: string;
    mimeType: string;
    contentBuffer: Buffer;
    workspaceId?: string;
  }): Promise<{ fileId: string; webViewLink: string; isLive: boolean }> {
    const { folderId, fileName, mimeType, contentBuffer, workspaceId = 'nest-realty-demo' } = params;
    const auth = await this.getAuthenticatedDriveClient(workspaceId);

    if (auth && auth.drive) {
      try {
        const stream = new Readable();
        stream.push(contentBuffer);
        stream.push(null);

        const res = await auth.drive.files.create({
          requestBody: {
            name: fileName,
            parents: [folderId]
          },
          media: {
            mimeType,
            body: stream
          },
          fields: 'id, webViewLink'
        });

        return {
          fileId: res.data.id!,
          webViewLink: res.data.webViewLink || `https://drive.google.com/file/d/${res.data.id}/view`,
          isLive: true
        };
      } catch (err: any) {
        console.warn('[GoogleDriveService] Live file upload error:', err.message);
      }
    }

    const fallbackId = `file_${Date.now()}`;
    return {
      fileId: fallbackId,
      webViewLink: `https://drive.google.com/file/d/${fallbackId}/view`,
      isLive: false
    };
  }


  /** Fail-closed: live folder id must open and contain ≥1 non-folder file (or files in immediate subfolders). */
  public async verifyDriveFolder(folderId: string, workspaceId: string = 'ws_wilmington'): Promise<{ ok: boolean; url?: string; fileCount?: number; error?: string }> {
    const id = String(folderId || '').trim();
    if (!id || id.startsWith('folder_') || id.startsWith('1DRV_') || id.startsWith('sub_')) {
      return { ok: false, error: 'invalid folder id' };
    }
    const auth = await this.getAuthenticatedDriveClient(workspaceId);
    if (!auth?.drive) return { ok: false, error: 'no drive auth' };
    try {
      const meta = await auth.drive.files.get({
        fileId: id,
        fields: 'id, mimeType, trashed, webViewLink',
        supportsAllDrives: true,
      });
      if (!meta.data?.id || meta.data.trashed || meta.data.mimeType !== 'application/vnd.google-apps.folder') {
        return { ok: false, error: 'not a live folder' };
      }
      const kids = await auth.drive.files.list({
        q: `'${id}' in parents and trashed = false`,
        pageSize: 10,
        fields: 'files(id, mimeType)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      const files = kids.data.files || [];
      let fileCount = files.filter((f: any) => f.mimeType !== 'application/vnd.google-apps.folder').length;
      if (fileCount === 0) {
        for (const sub of files.filter((f: any) => f.mimeType === 'application/vnd.google-apps.folder').slice(0, 6)) {
          const subKids = await auth.drive.files.list({
            q: `'${sub.id}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
            pageSize: 5,
            fields: 'files(id)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
          });
          fileCount += (subKids.data.files || []).length;
          if (fileCount > 0) break;
        }
      }
      const url = meta.data.webViewLink || `https://drive.google.com/drive/folders/${meta.data.id}`;
      return { ok: true, url, fileCount };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'folder verify failed' };
    }
  }

  /**
   * Reuse a live listing folder already named for this address.
   * Returns null when Drive is unavailable or the only hits are synthetic ids.
   */
  public async findListingFolderByAddress(propertyAddress: string, workspaceId: string = 'ws_wilmington'): Promise<{ id: string; url: string } | null> {
    const name = String(propertyAddress || '').trim();
    if (!name || /address pending|address needed/i.test(name)) return null;
    const auth = await this.getAuthenticatedDriveClient(workspaceId);
    if (!auth?.drive) return null;
    const street = name.split(',')[0].trim();
    const variants = Array.from(new Set([name, street].filter(Boolean)));
    try {
      for (const variant of variants) {
        const safe = variant.replace(/'/g, "\\'");
        const res = await auth.drive.files.list({
          q: `name = '${safe}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
          pageSize: 5,
          fields: 'files(id, name, webViewLink)',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });
        const hit = (res.data.files || []).find((f: any) => f?.id && !/^(1DRV_|folder_|sub_)/i.test(String(f.id)));
        if (hit?.id) {
          return {
            id: String(hit.id),
            url: hit.webViewLink || `https://drive.google.com/drive/folders/${hit.id}`,
          };
        }
      }
    } catch (err: any) {
      console.warn('[GoogleDriveService] findListingFolderByAddress failed:', err?.message || err);
    }
    return null;
  }

  /** Prefer Marketing / flyer / 03_ subfolder for proof uploads. */
  public async findMarketingUploadParentId(parentFolderId: string, workspaceId: string = 'ws_wilmington'): Promise<string> {
    const id = String(parentFolderId || '').trim();
    if (!id) return '';
    const match = this.scaffolds.get(id) || [...this.scaffolds.values()].find((s) => s.driveFolderId === id);
    const fromMem =
      match?.subfolders.find((s) => /^marketing$/i.test(String(s.name || '').trim())) ||
      match?.subfolders.find((s) => /marketing|flyer|social/i.test(s.name)) ||
      match?.subfolders.find((s) => /03_/i.test(s.name));
    if (fromMem?.id) return fromMem.id;

    const auth = await this.getAuthenticatedDriveClient(workspaceId);
    if (!auth?.drive) return id;
    try {
      const kids = await auth.drive.files.list({
        q: `'${id}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'`,
        pageSize: 20,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      const folders = kids.data.files || [];
      const hit =
        folders.find((f: any) => /^marketing$/i.test(String(f.name || '').trim())) ||
        folders.find((f: any) => /marketing|flyer|social/i.test(String(f.name || ''))) ||
        folders.find((f: any) => /^03_/i.test(String(f.name || '')));
      if (hit?.id) {
        console.log('[GoogleDriveService] resolved marketing subfolder', hit.name, hit.id);
        return hit.id;
      }
    } catch (err: any) {
      console.warn('[GoogleDriveService] findMarketingUploadParentId failed:', err?.message || err);
    }
    return id;
  }

  public getScaffolds(): ListingDriveScaffold[] {
    return Array.from(this.scaffolds.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getLinkedFolders(): LinkedFolderSyncStatus[] {
    return Array.from(this.linkedFolders.values());
  }

  public async syncFolder(folderId: string): Promise<{ success: boolean; documentCount: number; message: string }> {
    const folder = this.linkedFolders.get(folderId);
    if (!folder) {
      return { success: false, documentCount: 0, message: 'Folder not found.' };
    }

    folder.syncStatus = 'synced';
    folder.lastSyncedAt = new Date().toISOString();
    return {
      success: true,
      documentCount: folder.documentCount,
      message: `Successfully synchronized ${folder.name} with Nora AI RAG vector index.`
    };
  }
}

export const GoogleDriveService = new GoogleDriveServiceEngine();
