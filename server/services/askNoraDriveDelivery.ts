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

function activeDeps(): AskNoraDriveDeps {
  if (depsOverride) return depsOverride;
  return {
    findFolderByAddress: defaultFindFolderByAddress,
    createFolder: defaultCreateFolder,
    uploadFile: defaultUploadFile,
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
  for (const asset of input.assets || []) {
    if (!asset?.content?.length) continue;
    try {
      const up = await deps.uploadFile({
        folderId: folder.id,
        fileName: asset.fileName || 'asset',
        mimeType: asset.mimeType || 'application/octet-stream',
        content: asset.content,
        workspaceId,
      });
      if (up.isLive && up.webViewLink && isDurableHttpsProofUrl(up.webViewLink) && !isSyntheticDriveId(up.fileId)) {
        uploaded.push({ fileName: asset.fileName, webViewLink: up.webViewLink, fileId: up.fileId });
      }
    } catch (err: any) {
      console.warn('[AskNoraDrive] upload failed:', err?.message || err);
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

/** e.g. "414 Help Me Street, Wilmington, NC 28412" → "414 Help Me St" */
function shortAddressLabel(address?: string | null): string {
  const raw = String(address || '').trim();
  if (!raw) return 'Listing';
  const street = raw.split(',')[0].trim();
  return street
    .replace(/\bStreet\b/gi, 'St')
    .replace(/\bAvenue\b/gi, 'Ave')
    .replace(/\bBoulevard\b/gi, 'Blvd')
    .replace(/\bDrive\b/gi, 'Dr')
    .replace(/\bRoad\b/gi, 'Rd')
    .replace(/\bLane\b/gi, 'Ln')
    .replace(/\s+/g, ' ')
    .trim() || 'Listing';
}

function deliverableLabel(task: DeliveryDriveTaskLike): string {
  const raw = String(task.title || (task as any).packageType || 'Marketing asset').trim();
  return raw
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60) || 'Marketing asset';
}

function buildAgentFacingFileName(task: DeliveryDriveTaskLike, localPath: string): string {
  const ext = path.extname(localPath) || '.png';
  const day = new Date().toISOString().slice(0, 10);
  const base = `${shortAddressLabel(task.propertyAddress || task.title)} — ${deliverableLabel(task)} — ${day}${ext}`;
  // Drive-safe: strip characters Drive rejects in names
  return base.replace(/[\/\?\*:"<>|]/g, '').trim();
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

  // Reuse existing real folder if present
  let driveFolderUrl = isRealGoogleDriveUrl(task.driveFolderUrl) ? String(task.driveFolderUrl) : '';
  const fromNotes = extractRealDriveUrlsFromText(task.notes);
  if (!driveFolderUrl && fromNotes[0]) driveFolderUrl = fromNotes[0];

  let driveFolderId = '';
  if (driveFolderUrl) {
    const m = driveFolderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (m) driveFolderId = m[1];
  }

  // Collect proof URLs (local uploads + remote)
  const proofUrls: string[] = [];
  const push = (u?: string | null) => {
    const s = String(u || '').trim();
    if (s && !proofUrls.includes(s)) proofUrls.push(s);
  };
  push(task.proofUrl);
  for (const p of task.proofHistory || []) push(p?.proofUrl);
  for (const p of task.proofs || []) push(p?.url);
  for (const a of task.attachments || []) push(a?.url);
  for (const a of opts?.stagedAssets || []) push(a?.previewUrl || a?.downloadUrl || a?.url);

  const hasProofs = proofUrls.length > 0;

  // Create or reuse the address folder. Same promote path as intake. Never a second folder.
  if (!driveFolderId) {
    const promoted = await promoteAskNoraListingFolder({
      propertyAddress,
      agentName,
      agentEmail: agentEmail || 'AskNora@nestrealty.com',
      workspaceId,
      existingFolderUrl: driveFolderUrl,
    });
    if (!promoted.ok || !promoted.driveFolderId || !promoted.driveFolderUrl || isPlaceholderDriveUrl(promoted.driveFolderUrl)) {
      return {
        success: false,
        isLive: false,
        driveFolderUrl: '',
        driveFolderId: '',
        uploaded: [],
        linkable: false,
        error: hasProofs
          ? 'Could not create a real AskNora Google Drive folder for this task. Check Google Workspace / service-account Drive access.'
          : 'No Drive folder and no proofs to upload.',
      };
    }
    driveFolderUrl = promoted.driveFolderUrl;
    driveFolderId = promoted.driveFolderId;
  }

  // Prefer Marketing_Flyers subfolder (list from Drive if in-memory scaffold lost after restart)
  let uploadParentId = driveFolderId;
  try {
    uploadParentId = await GoogleDriveService.findMarketingUploadParentId(driveFolderId, workspaceId);
  } catch (e: any) {
    console.warn('[AskNoraDriveDelivery] subfolder resolve failed:', e?.message || e);
  }

  const uploaded: Array<{ fileName: string; webViewLink: string }> = [];
  const skippedLocal: string[] = [];
  for (const proof of proofUrls) {
    if (isRealGoogleDriveUrl(proof)) continue; // already on Drive
    const localPath = resolveLocalUploadPath(proof);
    if (!localPath) {
      skippedLocal.push(proof);
      continue;
    }
    const fileName = buildAgentFacingFileName(task, localPath);
    try {
      const buf = fs.readFileSync(localPath);
      const result = await GoogleDriveService.exportFileToDrive({
        folderId: uploadParentId,
        fileName,
        mimeType: guessMime(fileName),
        contentBuffer: buf,
        workspaceId,
      });
      if (result.isLive && result.webViewLink && !isPlaceholderDriveUrl(result.webViewLink)) {
        uploaded.push({ fileName, webViewLink: result.webViewLink });
        console.log('[AskNoraDriveDelivery] uploaded', fileName, '→', uploadParentId);
      } else {
        console.warn('[AskNoraDriveDelivery] upload returned non-live for', fileName);
      }
    } catch (err: any) {
      console.warn('[AskNoraDriveDelivery] upload failed:', fileName, err?.message || err);
    }
  }
  if (skippedLocal.length) {
    console.warn('[AskNoraDriveDelivery] could not resolve local paths:', skippedLocal.slice(0, 5));
  }

  if (!driveFolderId || !driveFolderUrl || isPlaceholderDriveUrl(driveFolderUrl)) {
    return {
      success: false,
      isLive: false,
      driveFolderUrl: '',
      driveFolderId: '',
      uploaded,
      linkable: false,
      error: 'Could not create a real AskNora Google Drive folder.',
    };
  }

  // Verify the exact folder id is openable and has ≥1 file (never ship empty/404 ids).
  const verified = await GoogleDriveService.verifyDriveFolder(driveFolderId, workspaceId);
  const hasUploaded = uploaded.length > 0;
  const hasFiles = hasUploaded || (verified.ok && (verified.fileCount || 0) > 0);
  const linkable = Boolean(verified.ok && hasFiles && verified.url && isRealGoogleDriveUrl(verified.url));

  // Agent-facing link: Marketing subfolder (where proofs live), not the empty parent shell
  let agentFacingUrl = linkable ? String(verified.url) : '';
  let agentFacingId = linkable ? driveFolderId : '';
  if (linkable && uploadParentId && uploadParentId !== driveFolderId) {
    const marketingVerified = await GoogleDriveService.verifyDriveFolder(uploadParentId, workspaceId);
    if (marketingVerified.ok && marketingVerified.url && isRealGoogleDriveUrl(marketingVerified.url)) {
      agentFacingUrl = String(marketingVerified.url);
      agentFacingId = uploadParentId;
    }
  } else if (linkable && uploaded[0]?.webViewLink && isRealGoogleDriveUrl(uploaded[0].webViewLink)) {
    // Fallback: first uploaded file link if Marketing folder id unknown
    agentFacingUrl = uploaded[0].webViewLink;
  }

  return {
    success: true,
    isLive: true,
    // Only expose URL when linkable — otherwise callers must use email attachments only.
    driveFolderUrl: agentFacingUrl,
    driveFolderId: agentFacingId,
    uploaded,
    linkable,
    error: !linkable
      ? (hasProofs
          ? 'Proofs attached to email only — Drive folder empty or not verifiable (upload may need AskNora OAuth Drive quota).'
          : 'Drive folder not linkable (empty or unverified).')
      : undefined,
  };
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
