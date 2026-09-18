import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, X, CheckCircle2, AlertCircle, Sparkles, 
  ArrowRight, Search, FileUp, RefreshCw, Check, Layers, UserCheck, Settings,
  Edit3, Link2, Trash2, Eye, EyeOff, Download
} from 'lucide-react';

interface SOPDocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  sops: any[];
  onLoadIntoWizard: (sopData: any) => void;
  onSaveDraft?: (sopData: any) => Promise<void>;
  onPublishDirect?: (sopData: any) => Promise<void>;
  wsId?: string;
}

export const SOPDocumentUploadModal: React.FC<SOPDocumentUploadModalProps> = ({
  isOpen,
  onClose,
  sops = [],
  onLoadIntoWizard,
  onSaveDraft,
  onPublishDirect,
  wsId = 'nest-realty-wilmington'
}) => {
  const [mode, setMode] = useState<'auto' | 'create' | 'update'>('auto');
  const [selectedExistingSopId, setSelectedExistingSopId] = useState<string>('');
  const [searchExistingQuery, setSearchExistingQuery] = useState('');
  
  const [file, setFile] = useState<File | null>(null);
  const [filePayload, setFilePayload] = useState<string>('');
  const [inputMethod, setInputMethod] = useState<'file' | 'text'>('file');
  const [manualText, setManualText] = useState<string>('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStage, setProcessStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const [extractedSop, setExtractedSop] = useState<any | null>(null);
  const [detectedMode, setDetectedMode] = useState<'create' | 'update'>('create');
  const [matchReason, setMatchReason] = useState<string>('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [showDocPreview, setShowDocPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setError(null);
    setFile(selected);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFilePayload(content || '');
    };
    reader.onerror = () => {
      setError('Failed to read selected file.');
    };

    // Safely encode all file types (PDF, Word, TXT, MD) as Base64 Data URL
    reader.readAsDataURL(selected);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      setError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setFilePayload(content || '');
      };
      reader.readAsDataURL(dropped);
    }
  };

  const handleProcessDocument = async () => {
    const contentToProcess = inputMethod === 'file' ? filePayload : manualText;
    const documentName = inputMethod === 'file' && file ? file.name : 'Pasted_Procedure_Notes.txt';

    if (!contentToProcess.trim()) {
      setError('Please provide document content or select a file to process.');
      return;
    }

    if (mode === 'update' && !selectedExistingSopId) {
      setError('Please select an existing SOP to update with this document.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessStage('Reading document structure & formatting...');

    try {
      setTimeout(() => setProcessStage('Analyzing procedure scope & matching existing library...'), 400);
      setTimeout(() => setProcessStage('Detecting operational roles, systems & decision paths...'), 900);
      setTimeout(() => setProcessStage('Mapping chronological checklist steps & evidence criteria...'), 1400);

      const res = await fetch('/api/ops/sops/upload-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('shapework_session_token') || 'usr_ryan'}`
        },
        body: JSON.stringify({
          fileContent: contentToProcess,
          fileName: documentName,
          mode: mode === 'auto' ? undefined : mode,
          existingSopId: mode === 'update' ? selectedExistingSopId : undefined,
          workspaceId: wsId
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to extract SOP from uploaded document.');
      }

      const data = await res.json();
      if (data.success && data.sop) {
        setExtractedSop(data.sop);
        setDetectedMode(data.detectedMode || data.mode || 'create');
        setMatchReason(data.matchReason || '');
        setCustomTitle(data.sop.title || '');
      } else {
        throw new Error('No structured SOP was returned by the extraction engine.');
      }
    } catch (err: any) {
      console.error('Document extraction error:', err);
      setError(err.message || 'Encountered an error while extracting SOP. You can enter details manually.');
    } finally {
      setIsProcessing(false);
      setProcessStage('');
    }
  };

  const handleToggleExtractedMode = (targetMode: 'create' | 'update') => {
    if (!extractedSop) return;
    if (targetMode === 'create') {
      const freshId = `sop_doc_${Date.now()}`;
      setExtractedSop({
        ...extractedSop,
        id: freshId,
        sopId: freshId,
        version: 1,
        title: customTitle || extractedSop.title,
        changeSummary: `Created from uploaded document: ${extractedSop.sourceDocument?.fileName || 'Document'}`
      });
      setDetectedMode('create');
    } else {
      // Find default target
      const match = sops[0];
      if (match) {
        setExtractedSop({
          ...extractedSop,
          id: match.id || match.sopId,
          sopId: match.id || match.sopId,
          title: match.title,
          version: typeof match.version === 'number' ? match.version + 1 : 2,
          changeSummary: `Updated from uploaded document: ${extractedSop.sourceDocument?.fileName || 'Document'} (v${(match.version || 1) + 1})`
        });
        setCustomTitle(match.title);
        setDetectedMode('update');
      }
    }
  };

  const handleOpenInWizard = () => {
    if (!extractedSop) return;
    const finalSop = { ...extractedSop, title: customTitle || extractedSop.title };
    onLoadIntoWizard(finalSop);
    onClose();
  };

  const handleSaveDirectDraft = async () => {
    if (!extractedSop) return;
    const finalSop = { ...extractedSop, title: customTitle || extractedSop.title, status: 'draft' };
    if (onSaveDraft) {
      setIsProcessing(true);
      try {
        await onSaveDraft(finalSop);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to save draft SOP.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      handleOpenInWizard();
    }
  };

  const handleCreateAndPublish = async () => {
    if (!extractedSop) return;
    const finalSop = {
      ...extractedSop,
      title: customTitle || extractedSop.title,
      status: 'published',
      publishedAt: new Date().toISOString()
    };
    setIsProcessing(true);
    try {
      if (onPublishDirect) {
        await onPublishDirect(finalSop);
      } else if (onSaveDraft) {
        await onSaveDraft(finalSop);
      } else {
        onLoadIntoWizard(finalSop);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to publish SOP to Knowledge Library.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveStep = (indexToRemove: number) => {
    if (!extractedSop) return;
    const updatedSteps = (extractedSop.orderedSteps || [])
      .filter((_: any, idx: number) => idx !== indexToRemove)
      .map((st: any, idx: number) => ({ ...st, stepNumber: idx + 1 }));
    setExtractedSop({ ...extractedSop, orderedSteps: updatedSteps });
  };

  const filteredExistingSops = sops.filter(s => {
    if (!searchExistingQuery.trim()) return true;
    const q = searchExistingQuery.toLowerCase();
    return s.title?.toLowerCase().includes(q) || s.department?.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 font-sans text-left select-none animate-fadeIn">
      <div className="bg-[#FFFDF7] border border-stone-200 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl text-stone-900 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-stone-200 flex items-center justify-between bg-[#F7F8F5] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E5EFEA] text-[#00635C] flex items-center justify-center font-bold shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-stone-900">
                  Create New SOP
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#E5EFEA] text-[#00635C] text-[10px] font-bold tracking-wide uppercase">
                  Studio & AI Extractor
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Upload SOP Document (.pdf, .docx, .txt) with AI extraction or launch the interactive step-by-step SOP wizard.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {!extractedSop ? (
            <>
              {/* Direct Interactive Wizard Action Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#E5EFEA] to-[#edf5f1] border border-[#00635C]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#01362D]">Step-by-Step SOP Wizard</span>
                    <span className="px-2 py-0.2 rounded-full bg-[#00635C] text-white text-[9px] font-bold tracking-wider uppercase">Direct Authoring</span>
                  </div>
                  <p className="text-[11px] text-stone-600">
                    Walk through the interactive wizard to define roles, triggers, step checklists, decisions, and escalation rules.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onLoadIntoWizard({
                      id: `sop_${Date.now()}`,
                      sopId: `sop_${Date.now()}`,
                      title: '',
                      version: '1.0',
                      status: 'draft',
                      department: 'Operations',
                      ownerRole: 'operations_lead',
                      purpose: '',
                      expectedOutcome: '',
                      scope: '',
                      steps: [
                        {
                          stepNumber: 1,
                          title: 'Initial Procedure Step',
                          role: 'Operations Director',
                          action: 'Define initial action and verify required documentation.',
                          systemUsed: 'Nest Realty Hub',
                          expectedDurationMinutes: 15
                        }
                      ],
                      decisions: [],
                      escalationBehavior: {
                        expectedResponse: 'Expected Response: 1 hour',
                        escalationPolicy: 'If unacknowledged within 1 hour, auto-escalate to Owner.'
                      }
                    });
                    onClose();
                  }}
                  className="px-4 py-2.5 bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <span>Start SOP Wizard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action Mode Toggle */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                  Or Import Document & Auto-Extract
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => { setMode('auto'); setSelectedExistingSopId(''); }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      mode === 'auto'
                        ? 'bg-[#E5EFEA]/60 border-[#00635C] text-[#00635C] shadow-2xs ring-1 ring-[#00635C]'
                        : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${mode === 'auto' ? 'bg-[#00635C] text-white' : 'bg-stone-100 text-stone-600'}`}>
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-stone-900">Auto-Detect</div>
                      <div className="text-[10px] text-stone-500 mt-0.5 leading-tight">AI determines new vs revision</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMode('create'); setSelectedExistingSopId(''); }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      mode === 'create'
                        ? 'bg-[#E5EFEA]/60 border-[#00635C] text-[#00635C] shadow-2xs ring-1 ring-[#00635C]'
                        : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${mode === 'create' ? 'bg-[#00635C] text-white' : 'bg-stone-100 text-stone-600'}`}>
                      <FileUp className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-stone-900">Create New SOP</div>
                      <div className="text-[10px] text-stone-500 mt-0.5 leading-tight">Fresh procedure</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('update')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      mode === 'update'
                        ? 'bg-[#E5EFEA]/60 border-[#00635C] text-[#00635C] shadow-2xs ring-1 ring-[#00635C]'
                        : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${mode === 'update' ? 'bg-[#00635C] text-white' : 'bg-stone-100 text-stone-600'}`}>
                      <RefreshCw className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-stone-900">Update Existing</div>
                      <div className="text-[10px] text-stone-500 mt-0.5 leading-tight">Revise specific SOP</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* If Update Mode: Search & Select Target SOP */}
              {mode === 'update' && (
                <div className="p-4 bg-white border border-stone-200 rounded-2xl space-y-2.5 animate-fadeIn">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                    Target SOP to Update
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchExistingQuery}
                      onChange={(e) => setSearchExistingQuery(e.target.value)}
                      placeholder="Search existing procedures..."
                      className="w-full pl-8.5 pr-3 py-2 bg-[#F7F8F5] border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#00635C]"
                    />
                  </div>
                  <div className="max-h-36 overflow-y-auto divide-y divide-stone-100 border border-stone-100 rounded-xl">
                    {filteredExistingSops.map(s => {
                      const isSelected = selectedExistingSopId === (s.id || s.sopId);
                      return (
                        <div
                          key={s.id || s.sopId}
                          onClick={() => setSelectedExistingSopId(s.id || s.sopId)}
                          className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#E5EFEA] text-[#00635C]' : 'hover:bg-stone-50 text-stone-800'
                          }`}
                        >
                          <div>
                            <span className="font-semibold">{s.title}</span>
                            <span className="text-[10px] text-stone-400 block">{s.department || 'Operations'} · v{s.version || '1.0'}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#00635C]" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upload Input Method Switch */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    Document Source
                  </label>
                  <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setInputMethod('file')}
                      className={`px-2.5 py-1 rounded-md transition-all ${inputMethod === 'file' ? 'bg-white text-[#00635C] font-bold shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                    >
                      File Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMethod('text')}
                      className={`px-2.5 py-1 rounded-md transition-all ${inputMethod === 'text' ? 'bg-white text-[#00635C] font-bold shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                    >
                      Paste Text
                    </button>
                  </div>
                </div>

                {inputMethod === 'file' ? (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                      file 
                        ? 'border-[#00635C] bg-[#E5EFEA]/30' 
                        : 'border-stone-300 hover:border-[#00635C]/50 bg-white hover:bg-stone-50/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,.md,.rtf,.json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-[#F7F8F5] border border-stone-200 flex items-center justify-center mx-auto mb-3 text-stone-500 shadow-2xs">
                      <FileText className="w-6 h-6 text-[#00635C]" />
                    </div>
                    {file ? (
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-stone-900">{file.name}</div>
                        <div className="text-stone-500 text-[11px]">
                          {(file.size / 1024).toFixed(1)} KB · Ready to extract
                        </div>
                        <div className="pt-2 text-[#00635C] font-semibold text-[11px] underline">
                          Click or drag another file to replace
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-stone-900">Drag & drop your SOP document here</div>
                        <div className="text-stone-500 text-xs">Supports PDF, Word (.docx), Markdown, or plain text files up to 50MB</div>
                        <div className="pt-2 text-[#00635C] font-semibold text-xs">or browse local files</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <textarea
                      rows={8}
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      placeholder="Paste procedure notes, checklist steps, policy handbook excerpts, or guidelines here..."
                      className="w-full p-4 bg-white border border-stone-200 rounded-2xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C] font-mono leading-relaxed"
                    />
                  </div>
                )}
              </div>

              {/* Extraction Processing State */}
              {isProcessing && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2 text-emerald-900 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-[#00635C] animate-spin" />
                    <span>Extracting SOP Structure & Determining Mode</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">{processStage || 'Processing document content...'}</p>
                </div>
              )}
            </>
          ) : (
            /* Extracted Result Review */
            <div className="space-y-4 animate-fadeIn">
              
              {/* Intelligent Detection Banner */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                detectedMode === 'update' 
                  ? 'bg-blue-50/80 border-blue-200 text-blue-900' 
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  {detectedMode === 'update' ? (
                    <RefreshCw className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-xs truncate">
                      {detectedMode === 'update' 
                        ? `Auto-Matched Revision of: "${extractedSop.title}"` 
                        : `Auto-Detected: New SOP Document`}
                    </div>
                    {matchReason && (
                      <div className="text-[10px] opacity-80 truncate">{matchReason}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {detectedMode === 'update' ? (
                    <button
                      type="button"
                      onClick={() => handleToggleExtractedMode('create')}
                      className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      Switch to New SOP
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleExtractedMode('update')}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      Link as Revision
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setExtractedSop(null)}
                    className="text-[10px] text-stone-500 hover:text-stone-800 underline cursor-pointer"
                  >
                    Different File
                  </button>
                </div>
              </div>

              {/* Extracted SOP Meta Box */}
              <div className="p-4 bg-white border border-stone-200 rounded-2xl space-y-3 shadow-2xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="px-2.5 py-0.5 bg-[#E5EFEA] text-[#00635C] rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {extractedSop.department || 'Operations'}
                    </span>
                    
                    {/* Editable Title */}
                    <div className="mt-1.5 flex items-center gap-2">
                      {isEditingTitle ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            type="text"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            onBlur={() => setIsEditingTitle(false)}
                            onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingTitle(false); }}
                            autoFocus
                            className="w-full px-2.5 py-1 bg-stone-50 border border-[#00635C] rounded-lg font-serif font-bold text-sm text-stone-900 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setIsEditingTitle(false)}
                            className="p-1 bg-[#00635C] text-white rounded-md text-[10px] font-bold"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => setIsEditingTitle(true)}
                          className="group flex items-center gap-2 cursor-pointer"
                          title="Click to rename SOP"
                        >
                          <h3 className="font-serif font-bold text-base text-stone-900 group-hover:text-[#00635C] transition-colors">
                            {customTitle || extractedSop.title}
                          </h3>
                          <Edit3 className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#00635C] transition-colors" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <span className="text-xs text-stone-400 font-mono shrink-0">
                    v{extractedSop.version || '1.0'} (Draft)
                  </span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed bg-[#F7F8F5] p-3 rounded-xl">
                  {extractedSop.purpose || 'No purpose extracted.'}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                  <div className="p-2.5 bg-[#F7F8F5] rounded-xl border border-stone-100">
                    <span className="text-stone-400 uppercase tracking-wider text-[10px] block font-semibold">Process Owner</span>
                    <span className="font-bold text-stone-800 truncate block mt-0.5">{extractedSop.processOwner || 'Admin Coordinator'}</span>
                  </div>
                  <div className="p-2.5 bg-[#F7F8F5] rounded-xl border border-stone-100">
                    <span className="text-stone-400 uppercase tracking-wider text-[10px] block font-semibold">Trigger Event</span>
                    <span className="font-bold text-stone-800 truncate block mt-0.5">{extractedSop.trigger || 'Manual checklist'}</span>
                  </div>
                  <div className="p-2.5 bg-[#F7F8F5] rounded-xl border border-stone-100 col-span-2 sm:col-span-1">
                    <span className="text-stone-400 uppercase tracking-wider text-[10px] block font-semibold">Extracted Steps</span>
                    <span className="font-bold text-emerald-800 block mt-0.5">{(extractedSop.orderedSteps || []).length} Ordered Steps</span>
                  </div>
                </div>

                {/* Source Document File Bar & Preview Toggle */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-stone-600 text-[11px]">
                    <FileText className="w-3.5 h-3.5 text-[#00635C]" />
                    <span className="font-semibold">{extractedSop.sourceDocument?.fileName || file?.name || 'Uploaded Document'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDocPreview(!showDocPreview)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      {showDocPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3 text-[#00635C]" />}
                      <span>{showDocPreview ? 'Hide Document' : 'View Uploaded Document'}</span>
                    </button>
                  </div>
                </div>

                {/* Document Embedded Viewer */}
                {showDocPreview && (
                  <div className="pt-2 animate-fadeIn border-t border-stone-100">
                    {filePayload && filePayload.startsWith('data:') ? (
                      <iframe
                        src={filePayload}
                        title="Document Preview"
                        className="w-full h-80 rounded-xl border border-stone-200 bg-white"
                      />
                    ) : (
                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] font-mono text-stone-700 max-h-60 overflow-y-auto whitespace-pre-wrap">
                        {manualText || 'No direct text preview available.'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Extracted Steps Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                    Extracted Checklist Steps ({(extractedSop.orderedSteps || []).length})
                  </label>
                  <span className="text-[10px] text-stone-400">Hover step to delete</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 border border-stone-200 p-3 rounded-2xl bg-white divide-y divide-stone-100">
                  {(extractedSop.orderedSteps || []).map((st: any, idx: number) => (
                    <div key={st.id || idx} className="pt-2 first:pt-0 flex items-start justify-between gap-3 text-xs group">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span className="w-5 h-5 rounded-full bg-[#E5EFEA] text-[#00635C] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-stone-900 leading-snug">{st.action}</div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-stone-400">
                            <span>Role: <strong className="text-stone-700 font-semibold">{st.role || extractedSop.processOwner || 'Admin Coordinator'}</strong></span>
                            <span>·</span>
                            <span>Tool: <strong className="text-[#00635C] font-semibold">{st.systemUsed || 'Rechat'}</strong></span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="opacity-0 group-hover:opacity-100 hover:text-rose-600 text-stone-400 p-1 rounded-md transition-opacity cursor-pointer shrink-0"
                        title="Remove this step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-between bg-[#F7F8F5] shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {extractedSop && (
              <button
                type="button"
                onClick={handleOpenInWizard}
                className="text-xs text-stone-500 hover:text-[#00635C] underline font-medium transition-colors cursor-pointer"
              >
                Advanced: Open in SOP Builder
              </button>
            )}
          </div>

          {!extractedSop ? (
            <button
              type="button"
              onClick={handleProcessDocument}
              disabled={isProcessing || (inputMethod === 'file' && !file) || (inputMethod === 'text' && !manualText.trim())}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#00635C] hover:bg-[#00514B] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Extracting...' : 'Extract SOP Structure'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDirectDraft}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={handleCreateAndPublish}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>{detectedMode === 'update' ? 'Update & Publish to Knowledge Library' : 'Create & Publish SOP'}</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
