/**
 * One proof choice for the modal, dispatch-check, and send-questions.
 * A pasted link wins. The stored task proof is used only when nothing was pasted.
 * A data:, blob:, or file: value is never a stored proof.
 */

const INLINE_PROOF = /^(?:data|blob|file):/i;

export function isInlineDataProof(url?: string | null): boolean {
  return INLINE_PROOF.test(String(url || '').trim());
}

/** Value safe to put in the proof link input. Never a data: URL. */
export function proofInputValue(url?: string | null): string {
  const value = String(url || '').trim();
  if (!value || isInlineDataProof(value)) return '';
  return value;
}

export function resolveProofPrecedence(pasted?: string | null, stored?: string | null): string {
  if (pasted != null && String(pasted).trim()) return String(pasted).trim();
  return proofInputValue(stored);
}

type PastedProofRecord = {
  attachments?: Array<{ url?: string | null; driveUrl?: string | null } | null> | null;
  photos?: Array<{ url?: string | null; driveUrl?: string | null } | null> | null;
};

/**
 * Link the user pasted. An attachment URL, an /uploads/ path, or a stored
 * task proof is not a paste. Shared by the drawer and the Notify modal.
 */
export function userPastedProofUrl(record?: PastedProofRecord | null, explicit?: string | null): string {
  const text = String(explicit ?? '').trim();
  if (!text) return '';
  const urls = new Set<string>();
  const take = (value?: string | null) => {
    const item = String(value || '').trim();
    if (item) urls.add(item);
  };
  for (const item of record?.attachments || []) {
    take(item?.url);
    take(item?.driveUrl);
  }
  for (const item of record?.photos || []) {
    take(item?.url);
    take(item?.driveUrl);
  }
  if (urls.has(text)) return '';
  if (/^\/?uploads\//i.test(text)) return '';
  if (!/^https:\/\//i.test(text)) return '';
  return text;
}

/**
 * A pasted https://drive.google.com/drive/folders/<id> link is a Drive folder.
 * A file link (drive.google.com/file/...) is not a folder. Synthetic ids are not folders.
 * Files inside that folder are listed by the Drive client; this helper only identifies the folder.
 */
export function pastedDriveFolderId(url?: string | null): string {
  const value = pastedDriveFolderUrl(url);
  if (!value) return '';
  try {
    return new URL(value).pathname.match(/^\/drive\/folders\/([a-zA-Z0-9_-]+)/)?.[1] || '';
  } catch {
    return '';
  }
}

export function pastedDriveFolderUrl(url?: string | null): string {
  const value = String(url || '').trim();
  if (!value) return '';
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return '';
  }
  if (parsed.protocol !== 'https:') return '';
  if (parsed.hostname.toLowerCase() !== 'drive.google.com') return '';
  const match = parsed.pathname.match(/^\/drive\/folders\/([a-zA-Z0-9_-]+)/);
  if (!match) return '';
  const id = match[1];
  if (/^(?:1DRV_|folder_|sub_|file_|sample_)/i.test(id)) return '';
  return value;
}

/**
 * Pasted proof wins. A pasted Drive folder link is the folder for dispatch.
 * An explicit folder is used only when the paste is not itself a folder link.
 */
export function resolveDispatchProofAndFolder(input: {
  pastedProof?: string | null;
  storedProof?: string | null;
  driveFolderUrl?: string | null;
  storedFolderUrl?: string | null;
}): { proofUrl: string; driveFolderUrl: string } {
  const proofUrl = resolveProofPrecedence(input.pastedProof, input.storedProof);
  const pastedFolder = pastedDriveFolderUrl(input.pastedProof);
  const explicit = String(input.driveFolderUrl || '').trim();
  const storedFolder = String(input.storedFolderUrl || '').trim();
  return {
    proofUrl,
    driveFolderUrl: pastedFolder || explicit || storedFolder,
  };
}

export function firstNonInlineProof(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const text = String(value || '').trim();
    if (text && !isInlineDataProof(text)) return text;
  }
  return '';
}

type ProofCarrier = {
  proofUrl?: string | null;
  proofHistory?: Array<{ proofUrl?: string | null } | null> | null;
};

/** Drop inline proof URLs before the task is stored or served. */
export function scrubInlineProof<T extends ProofCarrier>(task: T): T {
  if (isInlineDataProof(task.proofUrl)) task.proofUrl = undefined;
  if (Array.isArray(task.proofHistory)) {
    for (const entry of task.proofHistory) {
      if (entry && isInlineDataProof(entry.proofUrl)) entry.proofUrl = '';
    }
  }
  return task;
}
