/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProofUploadWizard — Managed Asset Upload & Verification Wizard
 * 4-Step Wizard: Deliverable Selection -> File Upload -> Metadata Inspection -> Preview & Confirm.
 * Enforces verifiable DPI honesty (never fakes "300 DPI verified") and truthful storage capability status.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  Info,
  FileText,
  Image as ImageIcon,
  X,
  ArrowRight,
  ChevronLeft,
  ShieldCheck,
  RefreshCw,
  Layers,
  AlertCircle,
  Eye,
  Trash2
} from 'lucide-react';
import {
  extractDpiFromBuffer,
  inspectPdfBuffer,
  validateDeliverableFormat,
  InspectedAssetMetadata
} from '../../utils/assetInspection';

export interface UploadedProofAsset {
  id: string;
  deliverableName: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  previewUrl: string;
  width: number | null;
  height: number | null;
  aspectRatio: string | null;
  orientation: 'portrait' | 'landscape' | 'square' | 'unknown';
  dpi: number | null;
  dpiVerified: boolean;
  dpiLabel: string;
  pageCount: number;
  validationStatus: 'matches' | 'warning' | 'unverified';
  validationMessage: string;
  uploadedBy: string;
  uploadedById?: string;
  uploadedAt: string;
  version: number;
}

interface ProofUploadWizardProps {
  taskId?: string;
  isOpen: boolean;
  onClose: () => void;
  onAssetConfirmed: (asset: UploadedProofAsset) => void;
  requestedDeliverables: Array<{ name: string; format?: string; dimensions?: string }>;
  currentProofVersion?: number;
  currentUser: { id: string; name: string };
  storageConfigured?: boolean;
  /** When set, uploads attach to this exact task deliverable (e.g. Tri-fold Brochure). */
  lockedDeliverableName?: string;
  /** Sibling linked tasks the user may switch to when needed. */
  siblingDeliverables?: Array<{ name: string; format?: string; dimensions?: string }>;
}

export const ProofUploadWizard: React.FC<ProofUploadWizardProps> = ({
  taskId,
  isOpen,
  onClose,
  onAssetConfirmed,
  requestedDeliverables = [],
  currentProofVersion = 0,
  currentUser,
  storageConfigured,
  lockedDeliverableName,
  siblingDeliverables = []
}) => {
  const [isStorageAvailable, setIsStorageAvailable] = useState<boolean>(storageConfigured ?? false);
  const [storageHintDismissed, setStorageHintDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem('shapework.dismissLocalStorageHint') === '1'; } catch { return false; }
  });

  useEffect(() => {
    let active = true;
    if (storageConfigured === undefined) {
      fetch('/api/marketing/assets/upload-config', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (active && data && typeof data.storageConfigured === 'boolean') {
            setIsStorageAvailable(data.storageConfigured);
          }
        })
        .catch(() => {});
    } else {
      setIsStorageAvailable(storageConfigured);
    }
    return () => { active = false; };
  }, [storageConfigured]);

  const resolvedLockedName = (lockedDeliverableName || requestedDeliverables[0]?.name || '').trim();
  const hasLockedDeliverable = Boolean(resolvedLockedName);
  const deliverableChoices = (() => {
    const fromRequest = (requestedDeliverables || []).filter(d => d?.name);
    const fromSiblings = (siblingDeliverables || []).filter(d => d?.name);
    const merged = [...fromRequest];
    for (const s of fromSiblings) {
      if (!merged.some(m => m.name === s.name)) merged.push(s);
    }
    if (resolvedLockedName && !merged.some(m => m.name === resolvedLockedName)) {
      merged.unshift({ name: resolvedLockedName, format: 'Task deliverable', dimensions: 'As specified' });
    }
    return merged;
  })();
  // Skip generic Flyer/Story/Postcard menu when the task already names its deliverable.
  const startStep: 1 | 2 = hasLockedDeliverable || deliverableChoices.length === 1 ? 2 : 1;

  // Wizard steps: 1: Select deliverable (only when unlocked), 2: Choose/Drop files, 3: Inspect, 4: Preview/Confirm
  const [step, setStep] = useState<1 | 2 | 3 | 4>(startStep);
  const [selectedDeliverable, setSelectedDeliverable] = useState<string>(() => {
    return resolvedLockedName || deliverableChoices[0]?.name || requestedDeliverables[0]?.name || 'Task deliverable';
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inspected Metadata State
  const [inspectedMetadata, setInspectedMetadata] = useState<InspectedAssetMetadata | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [durablePreviewUrl, setDurablePreviewUrl] = useState<string | null>(null);

  const resetWizard = useCallback((revoke = true) => {
    setStep(hasLockedDeliverable || deliverableChoices.length === 1 ? 2 : 1);
    if (resolvedLockedName) setSelectedDeliverable(resolvedLockedName);
    setSelectedFile(null);
    if (revoke && filePreviewUrl && filePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setFilePreviewUrl(null);
    setDurablePreviewUrl(null);
    setInspectedMetadata(null);
    setErrorMessage(null);
  }, [filePreviewUrl]);

  const handleClose = () => {
    resetWizard(true);
    onClose();
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);

    // File type validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage(`UNSUPPORTED_TYPE: "${file.type || file.name.split('.').pop()}" is not supported. Please upload JPEG, PNG, WEBP, or PDF.`);
      setIsProcessing(false);
      return;
    }

    // Size check: 50MB
    if (file.size > 52428800) {
      setErrorMessage('FILE_TOO_LARGE: File size exceeds the 50MB limit.');
      setIsProcessing(false);
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreviewUrl(objectUrl);

    // Read as Data URL for durable preview that survives dialog closure without ERR_FILE_NOT_FOUND
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setDurablePreviewUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setDurablePreviewUrl(objectUrl);
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      const isPdf = file.type === 'application/pdf';

      let width: number | null = null;
      let height: number | null = null;
      let aspectRatio: string | null = null;
      let aspectRatioValue: number | null = null;
      let orientation: 'portrait' | 'landscape' | 'square' | 'unknown' = 'unknown';
      let dpi: number | null = null;
      let dpiVerified = false;
      let dpiLabel = 'DPI could not be verified from this file.';
      let pageCount = 1;

      if (isPdf) {
        const pdfInfo = inspectPdfBuffer(uint8);
        pageCount = pdfInfo.pageCount;
        orientation = pdfInfo.orientation;
        if (pdfInfo.dimensions) {
          aspectRatio = pdfInfo.dimensions;
        }
      } else {
        // Parse Genuine Embedded DPI from JFIF / PNG chunks
        const dpiInfo = extractDpiFromBuffer(uint8);
        dpi = dpiInfo.dpi;
        dpiVerified = dpiInfo.dpiVerified;
        dpiLabel = dpiInfo.dpiLabel;

        // Image natural dimensions
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            width = img.naturalWidth;
            height = img.naturalHeight;
            aspectRatioValue = width / height;
            if (Math.abs(aspectRatioValue - 1) < 0.05) {
              aspectRatio = '1:1 Square';
              orientation = 'square';
            } else if (aspectRatioValue > 1) {
              aspectRatio = `${width} × ${height} (${(width / height).toFixed(2)}:1)`;
              orientation = 'landscape';
            } else {
              aspectRatio = `${width} × ${height} (1:${(height / width).toFixed(2)})`;
              orientation = 'portrait';
            }
            resolve();
          };
          img.onerror = () => resolve();
          img.src = objectUrl;
        });
      }

      // Check Deliverable Match
      const matchResult = validateDeliverableFormat(selectedDeliverable, width, height, isPdf);

      const metadata: InspectedAssetMetadata = {
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type,
        width,
        height,
        aspectRatio,
        aspectRatioValue,
        orientation,
        dpi,
        dpiVerified,
        dpiLabel,
        pageCount,
        formatMatch: matchResult.formatMatch,
        formatMatchMessage: matchResult.formatMatchMessage
      };

      setInspectedMetadata(metadata);
      setStep(3); // Advance to Inspection review
    } catch (err: any) {
      setErrorMessage(`INSPECTION_FAILED: Failed to inspect file headers: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmAsset = async () => {
    if (!selectedFile || (!filePreviewUrl && !durablePreviewUrl)) return;
    setIsProcessing(true);

    let finalPreviewUrl = durablePreviewUrl || filePreviewUrl || '';
    let durableAssetId: string | undefined;
    setErrorMessage(null);

    // Attempt to upload to durable backend storage if base64 data is present
    try {
      if (durablePreviewUrl && (durablePreviewUrl.startsWith('data:') || durablePreviewUrl.length > 500)) {
        const uploadRes = await fetch('/api/marketing/upload-asset', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId,
            filename: selectedFile.name,
            fileBase64: durablePreviewUrl,
            contentType: selectedFile.type
          })
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success || !uploadData.url || !uploadData.assetId) {
          throw new Error(uploadData.error || 'The file could not be saved. Please retry.');
        }
        finalPreviewUrl = uploadData.url;
        durableAssetId = uploadData.assetId;
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'The file could not be saved. Please retry.');
      return;
    } finally {
      setIsProcessing(false);
    }
    if (!finalPreviewUrl || /^(?:data|blob|file):/i.test(finalPreviewUrl) || !durableAssetId) {
      setErrorMessage('Save the file successfully before sending it for review.');
      return;
    }

    const confirmedAsset: UploadedProofAsset = {
      id: durableAssetId,
      deliverableName: selectedDeliverable,
      fileName: selectedFile.name,
      fileSizeBytes: selectedFile.size,
      mimeType: selectedFile.type,
      previewUrl: finalPreviewUrl,
      width: inspectedMetadata?.width || null,
      height: inspectedMetadata?.height || null,
      aspectRatio: inspectedMetadata?.aspectRatio || null,
      orientation: inspectedMetadata?.orientation || 'unknown',
      dpi: inspectedMetadata?.dpi || null,
      dpiVerified: inspectedMetadata?.dpiVerified || false,
      dpiLabel: inspectedMetadata?.dpiLabel || 'DPI could not be verified from this file.',
      pageCount: inspectedMetadata?.pageCount || 1,
      validationStatus: inspectedMetadata?.formatMatch || 'unverified',
      validationMessage: inspectedMetadata?.formatMatchMessage || 'Dimensions recorded',
      uploadedBy: currentUser.name || 'Producer',
      uploadedById: currentUser.id,
      uploadedAt: new Date().toISOString(),
      version: currentProofVersion + 1
    };

    onAssetConfirmed(confirmedAsset);
    // Reset state without revoking the confirmed asset's URL
    resetWizard(false);
    onClose();
  };

  if (!isOpen) return null;

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upload Finished Proof Asset"
      data-testid="proof-upload-wizard"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150">
        
        {/* Wizard Top Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#00635C] flex items-center justify-center font-bold text-sm">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Upload Finished Proof Asset</h3>
              <p className="text-xs text-slate-500">Step {step} of 4: {
                step === 1 ? 'Select Deliverable' :
                step === 2 ? 'Choose or Drop File' :
                step === 3 ? 'Inspect Asset & Specifications' :
                'Confirm & Stage Proof'
              }</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            title="Cancel and close wizard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Step Progression Bar */}
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs">
          {[
            { num: 1, label: 'Deliverable' },
            { num: 2, label: 'Upload' },
            { num: 3, label: 'Inspect' },
            { num: 4, label: 'Confirm' }
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === s.num
                  ? 'bg-[#00635C] text-white shadow-2xs'
                  : step > s.num
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {step > s.num ? '✓' : s.num}
              </span>
              <span className={`hidden sm:inline font-medium ${step === s.num ? 'text-[#00635C] font-bold' : 'text-slate-500'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Quiet local-preview hint — not an error. Dismissible; preview still works without a bucket. */}
        {!isStorageAvailable && !storageHintDismissed && (
          <div className="mx-6 mt-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-[11px] text-slate-600" data-testid="local-preview-hint">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="flex-1">
              Local preview only — cloud bucket not configured. Staging and browser preview still work.
            </span>
            <button
              type="button"
              className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer shrink-0"
              onClick={() => {
                try { localStorage.setItem('shapework.dismissLocalStorageHint', '1'); } catch {}
                setStorageHintDismissed(true);
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Upload Error: </span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          
          {/* STEP 1: SELECT DELIVERABLE */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  Associate Upload with Requested Deliverable:
                </label>
                <p className="text-xs text-slate-500">
                  Select which package collateral item this finished proof satisfies.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(deliverableChoices.length > 0 ? deliverableChoices : [{ name: 'Task deliverable', format: 'As specified', dimensions: '' }]).map((deliv) => {
                  const id = deliv.name;
                  const isSelected = selectedDeliverable === id;
                  const isLocked = Boolean(resolvedLockedName && id === resolvedLockedName);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedDeliverable(id)}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                        isSelected
                          ? 'border-[#00635C] bg-emerald-50/50 shadow-xs ring-2 ring-[#00635C]/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2">
                        <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                          <FileText className="w-4 h-4 text-[#00635C]" />
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-[#00635C]" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{deliv.name}{isLocked ? ' (this task)' : ''}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{deliv.format || deliv.dimensions || 'Task deliverable'}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500">
                Generic Flyer / Story / Postcard presets are not offered when this task already has a named deliverable.
              </p>
            </div>
          )}

          {/* STEP 2: CHOOSE OR DROP FILES */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-950">
                Attaching to: <strong>{selectedDeliverable}</strong>
                {deliverableChoices.length > 1 && !hasLockedDeliverable && (
                  <button type="button" className="ml-2 underline font-semibold" onClick={() => setStep(1)}>Change</button>
                )}
                {deliverableChoices.length > 1 && hasLockedDeliverable && (
                  <button type="button" className="ml-2 underline font-semibold" onClick={() => setStep(1)}>Use a sibling task deliverable</button>
                )}
              </div>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-3 transition cursor-pointer ${
                  isDragging
                    ? 'border-[#00635C] bg-emerald-50/70 scale-[0.99]'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      processFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-[#00635C] shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Click to select file or drag and drop here
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    JPEG, PNG, WEBP, or high-res vector PDF (Max 50MB)
                  </p>
                </div>

                <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-2xs">
                  Browse Files
                </span>
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#00635C]" />
                  <span>Inspecting file headers and DPI metadata...</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: INSPECT ASSET & METADATA */}
          {step === 3 && inspectedMetadata && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                  Automated Asset Inspection Results:
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  inspectedMetadata.formatMatch === 'matches'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : inspectedMetadata.formatMatch === 'warning'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {inspectedMetadata.formatMatch === 'matches' ? '✓ Matches Specification' :
                   inspectedMetadata.formatMatch === 'warning' ? '⚠ Review Dimensions' : 'Unverified'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-slate-400 font-medium">Deliverable</div>
                  <div className="font-bold text-slate-900 truncate mt-0.5">{selectedDeliverable}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-slate-400 font-medium">Dimensions</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {inspectedMetadata.width && inspectedMetadata.height
                      ? `${inspectedMetadata.width} × ${inspectedMetadata.height} px`
                      : inspectedMetadata.aspectRatio || 'Standard Page'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-slate-400 font-medium">Orientation</div>
                  <div className="font-semibold text-slate-900 capitalize mt-0.5">
                    {inspectedMetadata.orientation}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-slate-400 font-medium">File Size / Type</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {formatBytes(inspectedMetadata.fileSizeBytes)} ({inspectedMetadata.mimeType.split('/')[1]?.toUpperCase()})
                  </div>
                </div>

                {/* Genuine DPI Box */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl sm:col-span-2">
                  <div className="text-slate-400 font-medium">Embedded DPI Resolution</div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {inspectedMetadata.dpiVerified && inspectedMetadata.dpi ? (
                      <span className="font-bold text-emerald-800 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{inspectedMetadata.dpiLabel}</span>
                      </span>
                    ) : (
                      <span className="text-slate-600 font-medium text-[11px] flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>DPI could not be verified from this file.</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {inspectedMetadata.formatMatchMessage && (
                <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  Specification note: <strong>{inspectedMetadata.formatMatchMessage}</strong>
                </p>
              )}
            </div>
          )}

          {/* STEP 4: PREVIEW AND CONFIRM */}
          {step === 4 && selectedFile && filePreviewUrl && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                Preview Finished Proof Card
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 items-start shadow-xs">
                <div className="w-28 h-36 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 shrink-0 relative group">
                  {selectedFile.type === 'application/pdf' ? (
                    <FileText className="w-10 h-10 text-emerald-400" />
                  ) : (
                    <img src={filePreviewUrl} alt="Proof Thumbnail" className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">{selectedDeliverable}</span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                      v{currentProofVersion + 1}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 truncate">{selectedFile.name}</div>
                  
                  <div className="text-[11px] text-slate-500 font-mono space-y-0.5">
                    <div>Size: {formatBytes(selectedFile.size)}</div>
                    <div>
                      {inspectedMetadata?.dpiVerified
                        ? `DPI: ${inspectedMetadata.dpi} (Verified)`
                        : 'DPI: Unverified in header'}
                    </div>
                    <div>Uploaded by: {currentUser.name}</div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-xs text-[#00635C] font-bold hover:underline cursor-pointer"
                    >
                      Replace File
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={resetWizard}
                      className="text-xs text-rose-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Wizard Navigation Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(prev => (prev > 1 ? ((prev - 1) as any) : 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
            >
              Cancel
            </button>

            {step === 1 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <span>Proceed to Preview</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                onClick={handleConfirmAsset}
                className="px-5 py-2 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm &amp; Stage Proof</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
