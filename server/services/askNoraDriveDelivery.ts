/**
 * AskNora marketing delivery Drive pack:
 * create/reuse a real Google Drive folder (AskNora@nestrealty.com),
 * upload finished proofs, persist driveFolderUrl on the task.
 * Never invents 1DRV_ / folder_* placeholder URLs.
 */

import fs from 'fs';
import path from 'path';
import { GoogleDriveService } from './googleDriveService.js';
import { validateProofUrl } from '../../src/utils/assetInspection.js';

export function isPlaceholderDriveUrl(url?: string | null): boolean {
  const u = String(url || '').trim();
  if (!u) return true;
  if (!/^https?:\/\//i.test(u)) return true;
  if (/\/folders\/1DRV_/i.test(u)) return true;
  if (/\/folders\/folder_/i.test(u)) return true;
  if (/\/folders\/sub_/i.test(u)) return true;
  if (/\/file\/d\/file_/i.test(u)) return true;
  if (/\/file\/d\/sample_/i.test(u)) return true;
  return false;
}

export function isRealGoogleDriveUrl(url?: string | null): boolean {
  const u = String(url || '').trim();
  if (!u || isPlaceholderDriveUrl(u)) return false;
  return /drive\.google\.com\/(drive\/folders\/|file\/d\/|open\?id=)/i.test(u);
}

/** Pull real Drive URLs out of notes / free text (ignore 1DRV_ fakes). */
export function extractRealDriveUrlsFromText(text?: string | null): string[] {
  const raw = String(text || '');
  const matches = raw.match(/https?:\/\/drive\.google\.com\/[^\s)\]>"']+/gi) || [];
  return Array.from(new Set(matches.map((m) => m.replace(/[.,;]+$/, '')).filter((u) => isRealGoogleDriveUrl(u))));
}

export function isSyntheticDriveId(id?: string | null): boolean {
  const v = String(id || '').trim();
  if (!v) return true;
  return /^(1DRV_|folder_|sub_|file_|sample_)/i.test(v);
}

/** Street line used to reuse one AskNora folder per property. */
export function listingAddressKey(address?: string | null): string {
  const street = String(address || '').split(',')[0].trim();
  if (!street) return '';
  if (/address pending/i.test(street) || /address needed/i.test(street)) return '';
  return street.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function coalesceRealDriveUrl(...urls: Array<string | null | undefined>): string {
  for (const url of urls) {
    const u = String(url || '').trim();
    if (u && isRealGoogleDriveUrl(u) && !/1DRV_/i.test(u)) return u;
  }
  return '';
}

/** Durable review proof: https Drive file/folder (or other approved https host), never data:/local/stub. */
export function isDurableHttpsProofUrl(url?: string | null): boolean {
  const u = String(url || '').trim();
  if (!u) return false;
  if (/^data:/i.test(u) || /^blob:/i.test(u) || /^file:/i.test(u) || u.startsWith('/')) return false;
  if (isPlaceholderDriveUrl(u) || /1DRV_/i.test(u)) return false;
  const id = u.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1] || u.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] || '';
  if (id && isSyntheticDriveId(id)) return false;
  return validateProofUrl(u).valid === true;
}

export type AskNoraFolderRef = { id: string; url: string };

export type AskNoraDriveDeps = {
  findFolderByAddress: (address: string, workspaceId?: string) => Promise<AskNoraFolderRef | null>;
  createFolder: (params: {
    propertyAddress: string;
    agentName?: string;
    agentEmail?: string;
    workspaceId?: string;
  }) => Promise<{ isLive: boolean; driveFolderId: string; driveFolderUrl: string }>;
  uploadFile: (params: {
    folderId: string;
    fileName: string;
    mimeType: string;
    content: Buffer;
    workspaceId?: string;
  }) => Promise<{ isLive: boolean; fileId: string; webViewLink: string }>;
  /** Names already in the folder. Re-copy skips these so files are not duplicated. */
  listFolderFileNames?: (folderId: string, workspaceId?: string) => Promise<string[]>;
  /** Copy a Drive file that is already linked on the task into the listing folder. */
  copyDriveFile?: (params: {
    folderId: string;
    fileId: string;
    fileName: string;
    workspaceId?: string;
  }) => Promise<{ isLive: boolean; fileId: string; webViewLink: string }>;
};

export type PromoteAsset = { fileName: string; mimeType: string; content: Buffer };

const listingFolderRegistry = new Map<string, AskNoraFolderRef>();
let depsOverride: AskNoraDriveDeps | null = null;

export function resetAskNoraListingFolderRegistry(): void {
  listingFolderRegistry.clear();
}

export function __setAskNoraDriveDepsForTests(deps: AskNoraDriveDeps | null): void {
  depsOverride = deps;
  listingFolderRegistry.clear();
}

function realFolderRef(id?: string | null, url?: string | null): AskNoraFolderRef | null {
  const folderId = String(id || '').trim();
  const folderUrl = String(url || '').trim();
  if (!folderUrl || isSyntheticDriveId(folderId)) return null;
  if (!isRealGoogleDriveUrl(folderUrl) || isPlaceholderDriveUrl(folderUrl) || /1DRV_/i.test(folderUrl)) return null;
  return { id: folderId, url: folderUrl };
}

function refFromUrl(url?: string | null): AskNoraFolderRef | null {
  const u = String(url || '').trim();
  const id = u.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1] || '';
  return realFolderRef(id, u);
}

async function defaultFindFolderByAddress(address: string, workspaceId?: string): Promise<AskNoraFolderRef | null> {
  const key = listingAddressKey(address);
  if (key && listingFolderRegistry.has(key)) return listingFolderRegistry.get(key) || null;
  const found = await GoogleDriveService.findListingFolderByAddress(address, workspaceId || 'ws_wilmington');
  const ref = found ? realFolderRef(found.id, found.url) : null;
  if (ref && key) listingFolderRegistry.set(key, ref);
  return ref;
}

async function defaultCreateFolder(params: {
  propertyAddress: string;
  agentName?: string;
  agentEmail?: string;
  workspaceId?: string;
}): Promise<{ isLive: boolean; driveFolderId: string; driveFolderUrl: string }> {
  const scaffold = await GoogleDriveService.scaffoldListingFolder({
    propertyAddress: params.propertyAddress,
    agentName: params.agentName || 'Nest Agent',
    agentEmail: params.agentEmail || 'AskNora@nestrealty.com',
    workspaceId: params.workspaceId || 'ws_wilmington',
  });
  const ref = scaffold.isLiveDrive ? realFolderRef(scaffold.driveFolderId, scaffold.driveFolderUrl) : null;
  if (!ref) return { isLive: false, driveFolderId: '', driveFolderUrl: '' };
  const key = listingAddressKey(params.propertyAddress);
  if (key) listingFolderRegistry.set(key, ref);
  return { isLive: true, driveFolderId: ref.id, driveFolderUrl: ref.url };
}

async function defaultUploadFile(params: {
  folderId: string;
  fileName: string;
  mimeType: string;
  content: Buffer;
  workspaceId?: string;
}): Promise<{ isLive: boolean; fileId: string; webViewLink: string }> {
  const result = await GoogleDriveService.exportFileToDrive({
    folderId: params.folderId,
    fileName: params.fileName,
    mimeType: params.mimeType,
    contentBuffer: params.content,
    workspaceId: params.workspaceId,
  });
  if (!result.isLive || isSyntheticDriveId(result.fileId) || !isDurableHttpsProofUrl(result.webViewLink)) {
    return { isLive: false, fileId: '', webViewLink: '' };
  }
  return { isLive: true, fileId: result.fileId, webViewLink: result.webViewLink };
}

async function defaultListFolderFileNames(folderId: string, workspaceId?: string): Promise<string[]> {
  const listed = await GoogleDriveService.listFilesInFolder(folderId, workspaceId || 'ws_wilmington');
  if (!listed.ok) return [];
  return listed.files.map((file) => String(file.name || '').trim()).filter(Boolean);
}

async function defaultCopyDriveFile(params: {
  folderId: string;
  fileId: string;
  fileName: string;
  workspaceId?: string;
}): Promise<{ isLive: boolean; fileId: string; webViewLink: string }> {
  return GoogleDriveService.copyFileToFolder(params);
}

function activeDeps(): AskNoraDriveDeps {
  return {
    findFolderByAddress: defaultFindFolderByAddress,
    createFolder: defaultCreateFolder,
    uploadFile: defaultUploadFile,
    listFolderFileNames: defaultListFolderFileNames,
    copyDriveFile: defaultCopyDriveFile,
    ...(depsOverride || {}),
  };
}

const deferredFolder = {
  ok: false,
  deferred: true,
  created: false,
  reused: false,
  driveFolderUrl: '',
  driveFolderId: '',
  uploaded: [] as Array<{ fileName: string; webViewLink: string; fileId: string }>,
  fileCount: 0,
};

/**
 * Single promote path for intake and the first durable upload.
 * Same address reuses one live folder. Create failure stores no URL.
 */
export async function promoteAskNoraListingFolder(input: {
  propertyAddress?: string | null;
  agentName?: string | null;
  agentEmail?: string | null;
  workspaceId?: string | null;
  existingFolderUrl?: string | null;
  assets?: PromoteAsset[];
  driveFiles?: Array<{ fileId: string; fileName: string }>;
}): Promise<{
  ok: boolean;
  deferred: boolean;
  created: boolean;
  reused: boolean;
  driveFolderUrl: string;
  driveFolderId: string;
  uploaded: Array<{ fileName: string; webViewLink: string; fileId: string }>;
  fileCount: number;
  error?: string;
}> {
  const propertyAddress = String(input.propertyAddress || '').trim();
  const key = listingAddressKey(propertyAddress);
  const workspaceId = input.workspaceId || 'ws_wilmington';
  const deps = activeDeps();

  let folder: AskNoraFolderRef | null = refFromUrl(input.existingFolderUrl);
  let created = false;
  let reused = Boolean(folder);

  if (folder && key) listingFolderRegistry.set(key, folder);
  if (!folder && key && listingFolderRegistry.has(key)) {
    folder = listingFolderRegistry.get(key) || null;
    reused = Boolean(folder);
  }
  if (!folder && key) {
    try {
      const found = await deps.findFolderByAddress(propertyAddress, workspaceId);
      const ref = found ? realFolderRef(found.id, found.url) : null;
      if (ref) {
        folder = ref;
        reused = true;
        listingFolderRegistry.set(key, ref);
      }
    } catch (err: any) {
      console.warn('[AskNoraDrive] find folder failed:', err?.message || err);
    }
  }

  if (!folder) {
    if (!key) {
      return { ...deferredFolder, uploaded: [], error: 'Drive folder deferred: property address is required.' };
    }
    try {
      const createdRes = await deps.createFolder({
        propertyAddress,
        agentName: input.agentName || 'Nest Agent',
        agentEmail: input.agentEmail || 'AskNora@nestrealty.com',
        workspaceId,
      });
      const ref = createdRes.isLive ? realFolderRef(createdRes.driveFolderId, createdRes.driveFolderUrl) : null;
      if (!ref) {
        return { ...deferredFolder, uploaded: [], error: 'Drive folder create failed; no folder URL stored.' };
      }
      folder = ref;
      created = true;
      reused = false;
      listingFolderRegistry.set(key, ref);
    } catch (err: any) {
      console.warn('[AskNoraDrive] create folder failed:', err?.message || err);
      return { ...deferredFolder, uploaded: [], error: 'Drive folder create failed; no folder URL stored.' };
    }
  }

  const uploaded: Array<{ fileName: string; webViewLink: string; fileId: string }> = [];
  const existingNames = new Set<string>();
  try {
    const names = await deps.listFolderFileNames?.(folder.id, workspaceId);
    for (const name of names || []) {
      const key = String(name || '').trim().toLowerCase();
      if (key) existingNames.add(key);
    }
  } catch (err: any) {
    console.warn('[AskNoraDrive] list folder names failed:', err?.message || err);
  }
  const remember = (fileName: string) => {
    const key = String(fileName || '').trim().toLowerCase();
    if (key) existingNames.add(key);
  };
  for (const asset of input.assets || []) {
    const fileName = asset.fileName || 'asset';
    if (!asset?.content?.length || existingNames.has(fileName.toLowerCase())) continue;
    try {
      const up = await deps.uploadFile({
        folderId: folder.id,
        fileName,
        mimeType: asset.mimeType || 'application/octet-stream',
        content: asset.content,
        workspaceId,
      });
      if (up.isLive && up.webViewLink && isDurableHttpsProofUrl(up.webViewLink) && !isSyntheticDriveId(up.fileId)) {
        uploaded.push({ fileName, webViewLink: up.webViewLink, fileId: up.fileId });
        remember(fileName);
      }
    } catch (err: any) {
      console.warn('[AskNoraDrive] upload failed:', err?.message || err);
    }
  }
  for (const driveFile of input.driveFiles || []) {
    const fileName = driveFile.fileName || driveFile.fileId;
    if (!driveFile.fileId || existingNames.has(fileName.toLowerCase())) continue;
    try {
      const copied = await deps.copyDriveFile?.({
        folderId: folder.id,
        fileId: driveFile.fileId,
        fileName,
        workspaceId,
      });
      if (copied?.isLive && copied.webViewLink && isDurableHttpsProofUrl(copied.webViewLink) && !isSyntheticDriveId(copied.fileId)) {
        uploaded.push({ fileName, webViewLink: copied.webViewLink, fileId: copied.fileId });
        remember(fileName);
      }
    } catch (err: any) {
      console.warn('[AskNoraDrive] copy failed:', err?.message || err);
    }
  }

  return {
    ok: true,
    deferred: false,
    created,
    reused,
    driveFolderUrl: folder.url,
    driveFolderId: folder.id,
    uploaded,
    fileCount: uploaded.length,
  };
}

function extensionForMime(mime: string): string {
  if (mime.includes('png')) return '.png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg';
  if (mime.includes('webp')) return '.webp';
  if (mime.includes('pdf')) return '.pdf';
  if (mime.includes('gif')) return '.gif';
  return '';
}

function decodeDataUrl(dataUrl: string): { mimeType: string; buffer: Buffer } | null {
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/i.exec(String(dataUrl || '').trim());
  if (!match) return null;
  const mimeType = match[1] || 'application/octet-stream';
  try {
    const buffer = match[2]
      ? Buffer.from(match[3] || '', 'base64')
      : Buffer.from(decodeURIComponent(match[3] || ''), 'utf8');
    if (!buffer.length) return null;
    return { mimeType, buffer };
  } catch {
    return null;
  }
}

/**
 * Send-for-review proof: keep durable https, otherwise promote staged/data/local bytes
 * onto the address folder. Never returns data: or a synthetic Drive URL.
 */
export async function resolveReviewProofUrl(input: {
  proofUrl?: string | null;
  stagedAssets?: Array<{ previewUrl?: string; url?: string; downloadUrl?: string; fileName?: string; name?: string; mimeType?: string }>;
  propertyAddress?: string | null;
  agentName?: string | null;
  agentEmail?: string | null;
  workspaceId?: string | null;
  existingFolderUrl?: string | null;
}): Promise<{
  ok: boolean;
  proofUrl: string;
  driveFolderUrl: string;
  errorCode?: string;
  error?: string;
}> {
  const candidates: string[] = [];
  const push = (u?: string | null) => {
    const s = String(u || '').trim();
    if (s && !candidates.includes(s)) candidates.push(s);
  };
  push(input.proofUrl);
  for (const asset of input.stagedAssets || []) push(asset?.previewUrl || asset?.downloadUrl || asset?.url);

  for (const candidate of candidates) {
    if (isDurableHttpsProofUrl(candidate)) {
      const folder = refFromUrl(input.existingFolderUrl) || (/\/folders\//.test(candidate) ? refFromUrl(candidate) : null);
      return { ok: true, proofUrl: candidate, driveFolderUrl: folder?.url || '' };
    }
  }

  const assets: PromoteAsset[] = [];
  for (const candidate of candidates) {
    const hint = (input.stagedAssets || []).find((a) => (a.previewUrl || a.url || a.downloadUrl) === candidate);
    const fileNameHint = hint?.fileName || hint?.name;
    if (/^data:/i.test(candidate)) {
      const decoded = decodeDataUrl(candidate);
      if (!decoded) continue;
      const ext = extensionForMime(decoded.mimeType);
      const fileName = fileNameHint && fileNameHint.includes('.') ? fileNameHint : `proof${ext || '.bin'}`;
      assets.push({ fileName, mimeType: hint?.mimeType || decoded.mimeType, content: decoded.buffer });
      continue;
    }
    const local = resolveLocalUploadPath(candidate);
    if (!local) continue;
    try {
      assets.push({
        fileName: fileNameHint || path.basename(local),
        mimeType: hint?.mimeType || guessMime(fileNameHint || path.basename(local)),
        content: fs.readFileSync(local),
      });
    } catch {
      /* skip unreadable local proof */
    }
  }

  if (assets.length === 0) {
    return {
      ok: false,
      proofUrl: '',
      driveFolderUrl: '',
      errorCode: 'INVALID_PROOF_URL',
      error: 'INVALID_PROTOCOL: Proof link must use a durable https:// Drive file or folder URL. data:, local, and synthetic Drive links are not accepted.',
    };
  }

  const promoted = await promoteAskNoraListingFolder({
    propertyAddress: input.propertyAddress,
    agentName: input.agentName,
    agentEmail: input.agentEmail,
    workspaceId: input.workspaceId,
    existingFolderUrl: input.existingFolderUrl,
    assets,
  });
  const fileUrl = promoted.uploaded.find((u) => isDurableHttpsProofUrl(u.webViewLink))?.webViewLink || '';
  if (!fileUrl) {
    return {
      ok: false,
      proofUrl: '',
      driveFolderUrl: coalesceRealDriveUrl(promoted.driveFolderUrl),
      errorCode: 'INVALID_PROOF_URL',
      error: 'INVALID_PROTOCOL: Staged proof was not promoted to a durable https Drive file. Local and data: proofs are not accepted.',
    };
  }
  return {
    ok: true,
    proofUrl: fileUrl,
    driveFolderUrl: coalesceRealDriveUrl(promoted.driveFolderUrl),
  };
}

function resolveLocalUploadPath(proofUrl: string): string | null {
  const clean = String(proofUrl || '').trim();
  if (!clean) return null;
  let filename = '';
  if (clean.startsWith('/uploads/')) {
    filename = clean.replace(/^\/uploads\//, '').split('?')[0].split('#')[0];
  } else if (/^https?:\/\/[^/]+\/uploads\//i.test(clean)) {
    filename = clean.replace(/^https?:\/\/[^/]+\/uploads\//i, '').split('?')[0].split('#')[0];
  } else {
    return null;
  }
  if (!filename || filename.includes('..') || filename.includes('/')) return null;
  const candidates = [
    path.join(process.cwd(), 'dist', 'uploads', filename),
    path.join(process.cwd(), 'uploads', filename),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function guessMime(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  return 'application/octet-stream';
}

export type DeliveryDriveTaskLike = {
  id: string;
  title?: string;
  propertyAddress?: string;
  agentName?: string;
  agentEmail?: string;
  mlsNumber?: string | null;
  driveFolderUrl?: string | null;
  proofUrl?: string | null;
  notes?: string | null;
  proofs?: Array<{ url?: string }>;
  proofHistory?: Array<{ proofUrl?: string }>;
  attachments?: Array<{ url?: string; filename?: string }>;
  photos?: Array<{ url?: string; name?: string }>;
  workspaceId?: string;
};

export async function ensureAskNoraDeliveryDrivePack(task: DeliveryDriveTaskLike, opts?: {
  stagedAssets?: Array<{ previewUrl?: string; url?: string; downloadUrl?: string; fileName?: string; name?: string }>;
  forceUpload?: boolean;
}): Promise<{
  success: boolean;
  isLive: boolean;
  /** Only set when folder verifies openable AND has ≥1 uploaded/non-folder file. */
  driveFolderUrl: string;
  driveFolderId: string;
  uploaded: Array<{ fileName: string; webViewLink: string }>;
  linkable: boolean;
  error?: string;
}> {
  const propertyAddress = String(task.propertyAddress || task.title || 'Nest Listing').trim();
  const agentName = String(task.agentName || 'Nest Agent').trim();
  const agentEmail = String(task.agentEmail || '').trim();
  const workspaceId = task.workspaceId || 'ws_wilmington';

  // Reuse the task folder. A second ensure must not create another one.
  let driveFolderUrl = isRealGoogleDriveUrl(task.driveFolderUrl) ? String(task.driveFolderUrl) : '';
  const fromNotes = extractRealDriveUrlsFromText(task.notes).find((url) => /\/folders\//i.test(url));
  if (!driveFolderUrl && fromNotes) driveFolderUrl = fromNotes;

  const { assets, driveFiles } = collectIntakeCopies(task, opts?.stagedAssets);
  const promoted = await promoteAskNoraListingFolder({
    propertyAddress,
    agentName,
    agentEmail: agentEmail || 'AskNora@nestrealty.com',
    workspaceId,
    existingFolderUrl: driveFolderUrl,
    assets,
    driveFiles,
  });
  if (!promoted.ok || !promoted.driveFolderId || !promoted.driveFolderUrl || isPlaceholderDriveUrl(promoted.driveFolderUrl)) {
    return {
      success: false,
      isLive: false,
      driveFolderUrl: '',
      driveFolderId: '',
      uploaded: [],
      linkable: false,
      error: promoted.error || 'Drive folder create failed; no folder URL stored.',
    };
  }

  const listed = await GoogleDriveService.listFilesInFolder(promoted.driveFolderId, workspaceId);
  const fileCount = listed.ok ? listed.files.length : 0;
  const linkable = Boolean(listed.ok && fileCount > 0 && isRealGoogleDriveUrl(promoted.driveFolderUrl));
  return {
    success: true,
    isLive: true,
    driveFolderUrl: promoted.driveFolderUrl,
    driveFolderId: promoted.driveFolderId,
    uploaded: promoted.uploaded.map((file) => ({ fileName: file.fileName, webViewLink: file.webViewLink })),
    linkable,
    error: !listed.ok
      ? "Can't read that Drive folder."
      : fileCount === 0
        ? 'Drive folder is empty.'
        : undefined,
  };
}

function driveFileIdFromUrl(url?: string | null): string {
  const value = String(url || '').trim();
  if (!value || /\/folders\//i.test(value)) return '';
  const fromPath = value.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] || '';
  if (fromPath && !isSyntheticDriveId(fromPath)) return fromPath;
  try {
    const parsed = new URL(value);
    if (!/drive\.google\.com$/i.test(parsed.hostname)) return '';
    const id = parsed.searchParams.get('id') || '';
    if (id && !isSyntheticDriveId(id)) return id;
  } catch {
    return '';
  }
  return '';
}

/** Intake photos and /uploads attachments are copied in. Drive files already linked on attachments are copied too. */
function collectIntakeCopies(
  task: DeliveryDriveTaskLike,
  stagedAssets?: Array<{ previewUrl?: string; url?: string; downloadUrl?: string; fileName?: string; name?: string }>
): { assets: PromoteAsset[]; driveFiles: Array<{ fileId: string; fileName: string }> } {
  const assets: PromoteAsset[] = [];
  const driveFiles: Array<{ fileId: string; fileName: string }> = [];
  const seen = new Set<string>();
  const take = (url?: string | null, name?: string | null) => {
    const value = String(url || '').trim();
    if (!value || seen.has(value)) return;
    seen.add(value);
    const driveId = driveFileIdFromUrl(value);
    if (driveId) {
      driveFiles.push({ fileId: driveId, fileName: String(name || '').trim() || `drive-${driveId}` });
      return;
    }
    const localPath = resolveLocalUploadPath(value);
    if (!localPath) return;
    try {
      const fileName = String(name || '').trim() || path.basename(localPath);
      assets.push({ fileName, mimeType: guessMime(fileName), content: fs.readFileSync(localPath) });
    } catch {
      /* unreadable local upload is skipped */
    }
  };
  for (const photo of task.photos || []) take(photo?.url || (photo as { driveUrl?: string })?.driveUrl, photo?.name);
  for (const attachment of task.attachments || []) {
    const record = attachment as { url?: string; driveUrl?: string; filename?: string; name?: string };
    take(record.driveUrl || record.url, record.filename || record.name);
  }
  for (const staged of stagedAssets || []) take(staged?.previewUrl || staged?.downloadUrl || staged?.url, staged?.fileName || staged?.name);
  return { assets, driveFiles };
}

export function applyEnsuredFolder<T extends { driveFolderUrl?: string | null; notes?: string | null; updatedAt?: string }>(
  task: T,
  folderUrl?: string | null
): boolean {
  const url = String(folderUrl || '').trim();
  if (!url || !isRealGoogleDriveUrl(url)) return false;
  task.driveFolderUrl = url;
  const stamp = `AskNora Drive folder: ${url}`;
  if (!String(task.notes || '').includes(url)) {
    task.notes = `${task.notes || ''}\n${stamp}`.trim();
  }
  task.updatedAt = new Date().toISOString();
  return true;
}

export function loadLocalProofAttachments(task: DeliveryDriveTaskLike, stagedAssets?: Array<{ previewUrl?: string; url?: string; downloadUrl?: string; fileName?: string; name?: string }>): Array<{ filename: string; content: Buffer; contentType: string }> {
  const urls: string[] = [];
  const push = (u?: string | null) => {
    const s = String(u || '').trim();
    if (s && !urls.includes(s)) urls.push(s);
  };
  push(task.proofUrl);
  for (const p of task.proofHistory || []) push(p?.proofUrl);
  for (const p of task.proofs || []) push(p?.url);
  for (const a of task.attachments || []) push(a?.url);
  for (const a of stagedAssets || []) push(a?.previewUrl || a?.downloadUrl || a?.url);

  const out: Array<{ filename: string; content: Buffer; contentType: string }> = [];
  for (const u of urls) {
    const localPath = resolveLocalUploadPath(u);
    if (!localPath) continue;
    try {
      const fileName = path.basename(localPath);
      out.push({
        filename: fileName,
        content: fs.readFileSync(localPath),
        contentType: guessMime(fileName),
      });
    } catch {}
  }
  return out;
}


/** Fail-closed gate for Approve & Notify: real folder id + ≥1 file, never stub/synthetic. */
export function assertDriveReadyForApproveNotify(input: {
  stub?: boolean;
  linkable?: boolean;
  driveFolderUrl?: string | null;
  driveFolderId?: string | null;
  fileCount?: number;
  uploaded?: unknown[] | null;
  error?: string;
}): { allowed: boolean; errorCode?: string; reason?: string } {
  if (input.stub) {
    return {
      allowed: false,
      errorCode: 'DRIVE_STUB',
      reason: 'Approve & Notify refused: Drive pack is stub/synthetic.',
    };
  }
  const url = String(input.driveFolderUrl || '').trim();
  const id =
    String(input.driveFolderId || '').trim() ||
    (url.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1] || '');
  if (!url || isPlaceholderDriveUrl(url) || !isRealGoogleDriveUrl(url)) {
    return {
      allowed: false,
      errorCode: 'DRIVE_STUB_OR_MISSING',
      reason: 'Approve & Notify refused: Drive folder URL is missing, stub, or synthetic.',
    };
  }
  if (!id || /^(1DRV_|folder_|sub_)/i.test(id)) {
    return {
      allowed: false,
      errorCode: 'DRIVE_STUB_OR_MISSING',
      reason: 'Approve & Notify refused: Drive folder id is missing or synthetic.',
    };
  }
  const uploadedCount = Array.isArray(input.uploaded) ? input.uploaded.length : 0;
  const fileCount = Number(input.fileCount || 0) + uploadedCount;
  // linkable:true means ensureAskNoraDeliveryDrivePack already verified ≥1 file.
  if (input.linkable === true) {
    return { allowed: true };
  }
  if (input.linkable === false || fileCount < 1) {
    return {
      allowed: false,
      errorCode: 'DRIVE_EMPTY',
      reason: input.error || 'Approve & Notify refused: Drive folder is empty or not linkable (need ≥1 file).',
    };
  }
  return { allowed: true };
}
