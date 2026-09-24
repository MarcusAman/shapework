/**
 * AskNora marketing delivery Drive pack:
 * create/reuse a real Google Drive folder (AskNora@nestrealty.com),
 * upload finished proofs, persist driveFolderUrl on the task.
 * Never invents 1DRV_ / folder_* placeholder URLs.
 */

import fs from 'fs';
import path from 'path';
import { GoogleDriveService } from './googleDriveService.js';

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

  // Create folder if missing
  if (!driveFolderId) {
    const scaffold = await GoogleDriveService.scaffoldListingFolder({
      propertyAddress,
      agentName,
      agentEmail: agentEmail || 'AskNora@nestrealty.com',
      deliverables: task.title || 'Marketing deliverables',
      workspaceId,
      mlsNumber: (task as any).mlsNumber,
    });
    if (!scaffold.isLiveDrive || !scaffold.driveFolderUrl || isPlaceholderDriveUrl(scaffold.driveFolderUrl)) {
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
    driveFolderUrl = scaffold.driveFolderUrl;
    driveFolderId = scaffold.driveFolderId;
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

  // If proofs exist but upload into existing (often SA-owned) folder failed, create a fresh AskNora folder and retry once
  if (hasProofs && uploaded.length === 0) {
    console.warn('[AskNoraDriveDelivery] uploads empty — scaffolding fresh AskNora folder and retrying');
    const scaffold = await GoogleDriveService.scaffoldListingFolder({
      propertyAddress: `${propertyAddress} · Assets`,
      agentName,
      agentEmail: agentEmail || 'AskNora@nestrealty.com',
      deliverables: task.title || 'Marketing deliverables',
      workspaceId,
      mlsNumber: (task as any).mlsNumber,
    });
    if (scaffold.isLiveDrive && scaffold.driveFolderId && !isPlaceholderDriveUrl(scaffold.driveFolderUrl)) {
      driveFolderId = scaffold.driveFolderId;
      driveFolderUrl = scaffold.driveFolderUrl;
      const freshParent =
        scaffold.subfolders.find((s) => /^marketing$/i.test(String(s.name || '').trim()))?.id ||
        scaffold.subfolders.find((s) => /marketing|flyer|social|03_/i.test(s.name))?.id ||
        scaffold.driveFolderId;
      uploadParentId = freshParent;
      for (const proof of proofUrls) {
        if (isRealGoogleDriveUrl(proof)) continue;
        const localPath = resolveLocalUploadPath(proof);
        if (!localPath) continue;
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
            console.log('[AskNoraDriveDelivery] retry uploaded', fileName, '→', uploadParentId);
          }
        } catch (err: any) {
          console.warn('[AskNoraDriveDelivery] retry upload failed:', fileName, err?.message || err);
        }
      }
    }
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
