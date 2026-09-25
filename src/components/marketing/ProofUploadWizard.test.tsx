/** @vitest-environment happy-dom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/assetInspection', () => ({
  extractDpiFromBuffer: vi.fn(() => ({ dpi: null, dpiVerified: false, dpiLabel: 'Not verified' })),
  inspectPdfBuffer: vi.fn(() => ({ pageCount: 2, orientation: 'landscape', dimensions: '11 × 8.5 in' })),
  validateDeliverableFormat: vi.fn(() => ({ formatMatch: 'matches', formatMatchMessage: 'Matches requested format' })),
}));
import { ProofUploadWizard } from './ProofUploadWizard';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let host: HTMLDivElement;
let readFails: boolean;
const bytes = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55]);
const encoded = 'JVBERi0xLjc=';
const confirmed = vi.fn();
const closed = vi.fn();
let upload: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks(); readFails = false;
  vi.stubGlobal('localStorage', { getItem: () => null });
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:local-file-preview');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  vi.stubGlobal('FileReader', class {
    result: string | null = null;
    onload?: () => void; onerror?: () => void;
    readAsDataURL(file: File) {
      queueMicrotask(() => {
        if (readFails) { this.onerror?.(); return; }
        this.result = `data:${file.type};base64,${encoded}`;
        this.onload?.();
      });
    }
  });
  vi.stubGlobal('Image', class {
    naturalWidth = 3000; naturalHeight = 2000;
    onload?: () => void;
    set src(_value: string) { queueMicrotask(() => this.onload?.()); }
  });
  upload = vi.fn(async () => ({ ok: true, json: async () => ({ success: true, assetId: 'asset_durable_mock', url: '/uploads/asset_durable_mock.pdf' }) }));
  vi.stubGlobal('fetch', upload);
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

async function renderWizard() {
  await act(async () => { root.render(<ProofUploadWizard isOpen storageConfigured taskId="task_pdf_mock"
    onClose={closed} onAssetConfirmed={confirmed} requestedDeliverables={[{ name: 'Tri-fold brochure' }]}
    currentUser={{ id: 'producer_mock', name: 'Producer' }} />); });
}
async function selectFile(type = 'application/pdf', name = 'brochure.pdf') {
  const file = new File([bytes], name, { type });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => bytes.buffer });
  const input = host.querySelector('input[type="file"]')!;
  Object.defineProperty(input, 'files', { configurable: true, value: [file] });
  await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); });
}
async function clickButton(label: string) {
  const button = [...host.querySelectorAll('button')].find(candidate => candidate.textContent?.includes(label));
  expect(button).toBeDefined();
  await act(async () => { button!.click(); });
}
async function confirm() { await clickButton('Proceed to Preview'); await clickButton('Confirm & Stage Proof'); }

describe('Proof upload bytes and durable confirmation', () => {
  it.each([
    ['application/pdf', 'brochure.pdf'], ['image/jpeg', 'photo.jpg'], ['image/png', 'photo.png'], ['image/webp', 'photo.webp'],
  ])('uploads actual file bytes for accepted %s files instead of the local preview URL', async (type, name) => {
    await renderWizard(); await selectFile(type, name); await confirm();
    expect(upload).toHaveBeenCalledTimes(1);
    const [url, options] = upload.mock.calls[0] as any;
    expect(url).toBe('/api/marketing/upload-asset');
    expect(JSON.parse(options.body)).toEqual({ taskId: 'task_pdf_mock', filename: name, contentType: type, fileBase64: `data:${type};base64,${encoded}` });
    expect(confirmed).toHaveBeenCalledWith(expect.objectContaining({ id: 'asset_durable_mock', previewUrl: '/uploads/asset_durable_mock.pdf', mimeType: type }));
    expect(closed).toHaveBeenCalledOnce();
  });

  it('shows a read error without staging a PDF or advancing to confirmation', async () => {
    readFails = true;
    await renderWizard(); await selectFile();
    expect(host.textContent).toMatch(/could not read|failed to read/i);
    expect(host.textContent).not.toContain('Proceed to Preview');
    expect(upload).not.toHaveBeenCalled(); expect(confirmed).not.toHaveBeenCalled(); expect(closed).not.toHaveBeenCalled();
  });

  it('keeps the PDF wizard open and reports a server save failure without confirming success', async () => {
    upload.mockResolvedValue({ ok: false, json: async () => ({ success: false, error: 'Storage temporarily unavailable' }) });
    await renderWizard(); await selectFile(); await confirm();
    expect(upload).toHaveBeenCalledOnce();
    expect(host.textContent).toContain('Storage temporarily unavailable');
    expect(confirmed).not.toHaveBeenCalled(); expect(closed).not.toHaveBeenCalled();
  });

  it('rejects a successful response that still supplies an ephemeral preview URL', async () => {
    upload.mockResolvedValue({ ok: true, json: async () => ({ success: true, assetId: 'asset_mock', url: 'blob:server-must-not-return-this' }) });
    await renderWizard(); await selectFile(); await confirm();
    expect(host.textContent).toContain('Save the file successfully');
    expect(confirmed).not.toHaveBeenCalled(); expect(closed).not.toHaveBeenCalled();
  });
});
