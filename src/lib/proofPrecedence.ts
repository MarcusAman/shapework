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

/**
 * A pasted https://drive.google.com/drive/folders/<id> link is a Drive folder.
 * A file link (drive.google.com/file/...) is not a folder. Synthetic ids are not folders.
 */
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
