import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Plus, 
  Trash2, 
  Download, 
  ShieldCheck, 
  ArrowUp, 
  ArrowDown, 
  Sparkles,
  Layers,
  User,
  Zap,
  Check
} from 'lucide-react';
import { SopDocument, SopStep } from '../../types/sopWorkflow';

interface StaffSopStudioModalProps {
  sop: SopDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedSop: SopDocument) => Promise<void>;
  onPublish?: (publishedSop: SopDocument) => Promise<void>;
}

export const StaffSopStudioModal: React.FC<StaffSopStudioModalProps> = ({
  sop,
  isOpen,
  onClose,
  onSave,
  onPublish
}) => {
  if (!isOpen || !sop) return null;

  const [activeTab, setActiveTab] = useState<'steps' | 'metadata' | 'export'>('steps');
  const [currentSop, setCurrentSop] = useState<SopDocument>({ ...sop });
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleAddStep = () => {
    const nextStepNum = (currentSop.orderedSteps || []).length + 1;
    const newStep: SopStep = {
      id: `st_${Date.now()}_${nextStepNum}`,
      stepNumber: nextStepNum,
      action: '',
      role: currentSop.processOwner || 'Listing Agent',
      systemUsed: 'Dotloop'
    };
    setCurrentSop(prev => ({
      ...prev,
      orderedSteps: [...(prev.orderedSteps || []), newStep]
    }));
  };

  const handleUpdateStep = (index: number, field: keyof SopStep, value: any) => {
    setCurrentSop(prev => {
      const updated = [...(prev.orderedSteps || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, orderedSteps: updated };
    });
  };

  const handleDeleteStep = (index: number) => {
    setCurrentSop(prev => {
      const filtered = (prev.orderedSteps || []).filter((_, i) => i !== index);
      const renumbered = filtered.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
      return { ...prev, orderedSteps: renumbered };
    });
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const steps = [...(currentSop.orderedSteps || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;

    const temp = steps[index];
    steps[index] = steps[targetIndex];
    steps[targetIndex] = temp;

    const renumbered = steps.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    setCurrentSop(prev => ({ ...prev, orderedSteps: renumbered }));
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const updated: SopDocument = {
        ...currentSop,
        updatedAt: new Date().toISOString()
      };
      if (onSave) {
        await onSave(updated);
      }
      showToast('Draft SOP saved successfully!');
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBicApprovalPublish = async () => {
    setIsPublishing(true);
    try {
      const published: SopDocument = {
        ...currentSop,
        status: 'published',
        reviewer: 'Matt Orr — Broker-in-Charge (#281940)',
        publisher: 'Matt Orr',
        effectiveDate: new Date().toISOString().split('T')[0],
        reviewDate: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0],
        version: currentSop.status === 'published' ? currentSop.version + 1 : currentSop.version || 1,
        updatedAt: new Date().toISOString()
      };
      setCurrentSop(published);
      if (onPublish) {
        await onPublish(published);
      } else if (onSave) {
        await onSave(published);
      }
      showToast(`SOP Approved & Published as v${published.version}! Live in Lorena Context Engine.`);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsPublishing(false);
    }
  };

  const generateMarkdownExport = (): string => {
    const stepsMd = (currentSop.orderedSteps || [])
      .map(s => `${s.stepNumber}. **${s.role}**: ${s.action} *(System: ${s.systemUsed || 'Internal'})*`)
      .join('\n');

    return `# ${currentSop.title} (v${currentSop.version})

- **Status**: ${currentSop.status.toUpperCase()}
- **Process Owner**: ${currentSop.processOwner}
- **Reviewer / BIC**: ${currentSop.reviewer || 'Matt Orr — BIC'}
- **Trigger**: ${currentSop.trigger}
- **Expected Turnaround**: ${currentSop.expectedTiming || 'Standard turnaround'}
- **Effective Date**: ${currentSop.effectiveDate || 'Immediate'}
- **Systems Used**: ${(currentSop.systemsUsed || []).join(', ')}

---

## Purpose & Summary
${currentSop.purpose}

---

## Step-by-Step Execution Protocol
${stepsMd}

---

## Completion & Verification
- **Completion Evidence**: ${currentSop.completionEvidence || 'All required checklists verified in Dotloop & transaction file.'}
- **Escalation Contact**: Escalates to Broker-in-Charge (Matt Orr) for non-standard variations.
`;
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownExport();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSop.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_v${currentSop.version}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Markdown file exported!');
  };

  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const md = generateMarkdownExport();
    printWindow.document.write(`
      <html>
        <head>
          <title>${currentSop.title} - Nest SOP</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1c1917; line-height: 1.6; }
            h1 { font-family: Georgia, serif; color: #01362D; border-bottom: 2px solid #00635C; padding-bottom: 8px; }
            h2 { color: #00635C; margin-top: 24px; }
            .badge { display: inline-block; padding: 4px 10px; background: #E8F3EE; color: #00635C; font-weight: bold; border-radius: 12px; font-size: 12px; }
            ol { padding-left: 20px; }
            li { margin-bottom: 10px; }
            .footer { margin-top: 40px; border-top: 1px solid #e7e5e4; padding-top: 10px; font-size: 11px; color: #78716c; }
          </style>
        </head>
        <body>
          <span class="badge">${currentSop.status.toUpperCase()} • v${currentSop.version}</span>
          <h1>${currentSop.title}</h1>
          <p><strong>Process Owner:</strong> ${currentSop.processOwner} | <strong>BIC Reviewer:</strong> ${currentSop.reviewer || 'Matt Orr — BIC'}</p>
          <p><strong>Trigger:</strong> ${currentSop.trigger} | <strong>Turnaround:</strong> ${currentSop.expectedTiming || 'Standard'}</p>
          
          <h2>Purpose & Scope</h2>
          <p>${currentSop.purpose}</p>

          <h2>Standard Operating Procedure Steps</h2>
          <ol>
            ${(currentSop.orderedSteps || []).map(s => `<li><strong>${s.role}:</strong> ${s.action} <em>(System: ${s.systemUsed || 'Internal'})</em></li>`).join('')}
          </ol>

          <h2>Completion Evidence</h2>
          <p>${currentSop.completionEvidence || 'Checklists verified and archived.'}</p>

          <div class="footer">
            Authoritative Nest Realty Brokerage Policy • Auto-synced with Lorena Voice Context Engine
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  const isPublished = currentSop.status === 'published';

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-200 bg-[#FAF9F6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00635C]/10 text-[#00635C] flex items-center justify-center font-serif font-bold text-lg">
              📋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-lg text-stone-900">{currentSop.title}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  isPublished 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {isPublished ? `v${currentSop.version} Published` : `v${currentSop.version} Draft`}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Owner: {currentSop.processOwner} • Reviewer: {currentSop.reviewer || 'BIC Matt Orr'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-stone-200 bg-white flex gap-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('steps')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'steps' ? 'border-[#00635C] text-[#00635C] font-bold' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Step-by-Step Checklist ({(currentSop.orderedSteps || []).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('metadata')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'metadata' ? 'border-[#00635C] text-[#00635C] font-bold' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            SOP Parameters & Trigger
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'export' ? 'border-[#00635C] text-[#00635C] font-bold' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Export & PDF Preview
          </button>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="bg-emerald-600 text-white text-xs py-2 px-4 flex items-center justify-between animate-in slide-in-from-top">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {successToast}
            </span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50">
          
          {/* TAB 1: STEPS CHECKLIST BUILDER */}
          {activeTab === 'steps' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-sm text-stone-900">Ordered Execution Protocol</h3>
                  <p className="text-xs text-stone-500">Each step is indexed and spoken step-by-step by Lorena during voice queries.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="px-3 py-1.5 bg-[#00635C] text-white rounded-lg text-xs font-bold hover:bg-[#007c73] transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Step
                </button>
              </div>

              <div className="space-y-3">
                {(currentSop.orderedSteps || []).map((step, idx) => (
                  <div 
                    key={step.id || idx} 
                    className="p-3.5 bg-white border border-stone-200 rounded-xl shadow-2xs space-y-2 hover:border-stone-300 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-center">
                          {step.stepNumber}
                        </span>
                        <input
                          type="text"
                          value={step.role}
                          onChange={(e) => handleUpdateStep(idx, 'role', e.target.value)}
                          placeholder="Responsible Role (e.g. Listing Agent)"
                          className="text-xs font-bold text-[#00635C] bg-stone-50 border border-stone-200 rounded-md px-2 py-1 w-48 focus:outline-hidden focus:border-[#00635C]"
                        />
                        <input
                          type="text"
                          value={step.systemUsed || ''}
                          onChange={(e) => handleUpdateStep(idx, 'systemUsed', e.target.value)}
                          placeholder="System (e.g. Dotloop)"
                          className="text-[11px] text-stone-600 bg-stone-50 border border-stone-200 rounded-md px-2 py-1 w-32 focus:outline-hidden focus:border-[#00635C]"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveStep(idx, 'up')}
                          className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === (currentSop.orderedSteps || []).length - 1}
                          onClick={() => handleMoveStep(idx, 'down')}
                          className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStep(idx)}
                          className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={step.action}
                      onChange={(e) => handleUpdateStep(idx, 'action', e.target.value)}
                      placeholder="Specify the exact procedural action required for this step..."
                      rows={2}
                      className="w-full text-xs text-stone-800 bg-white border border-stone-200 rounded-lg p-2 focus:outline-hidden focus:border-[#00635C] resize-none leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: METADATA & TRIGGER PARAMETERS */}
          {activeTab === 'metadata' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">SOP Title</label>
                  <input
                    type="text"
                    value={currentSop.title}
                    onChange={(e) => setCurrentSop({ ...currentSop, title: e.target.value })}
                    className="w-full text-xs bg-white border border-stone-200 rounded-lg p-2.5 font-bold focus:outline-hidden focus:border-[#00635C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Process Owner</label>
                  <input
                    type="text"
                    value={currentSop.processOwner}
                    onChange={(e) => setCurrentSop({ ...currentSop, processOwner: e.target.value })}
                    className="w-full text-xs bg-white border border-stone-200 rounded-lg p-2.5 focus:outline-hidden focus:border-[#00635C]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">Operational Purpose & Scope</label>
                  <textarea
                    value={currentSop.purpose}
                    onChange={(e) => setCurrentSop({ ...currentSop, purpose: e.target.value })}
                    rows={3}
                    className="w-full text-xs bg-white border border-stone-200 rounded-lg p-2.5 focus:outline-hidden focus:border-[#00635C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Trigger Event</label>
                  <input
                    type="text"
                    value={currentSop.trigger}
                    onChange={(e) => setCurrentSop({ ...currentSop, trigger: e.target.value })}
                    className="w-full text-xs bg-white border border-stone-200 rounded-lg p-2.5 focus:outline-hidden focus:border-[#00635C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Expected Turnaround Timing</label>
                  <input
                    type="text"
                    value={currentSop.expectedTiming}
                    onChange={(e) => setCurrentSop({ ...currentSop, expectedTiming: e.target.value })}
                    className="w-full text-xs bg-white border border-stone-200 rounded-lg p-2.5 focus:outline-hidden focus:border-[#00635C]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">Completion Evidence & Audit Standard</label>
                  <input
                    type="text"
                    value={currentSop.completionEvidence}
                    onChange={(e) => setCurrentSop({ ...currentSop, completionEvidence: e.target.value })}
                    className="w-full text-xs bg-white border border-stone-200 rounded-lg p-2.5 focus:outline-hidden focus:border-[#00635C]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EXPORT & PRINTABLE PREVIEW */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-sm text-stone-900">Document Export & PDF Printing</h3>
                  <p className="text-xs text-stone-500">Generate formatted brokerage policy documents and Markdown packages.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadMarkdown}
                    className="px-3 py-1.5 bg-stone-100 text-stone-800 border border-stone-300 rounded-lg text-xs font-bold hover:bg-stone-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Markdown
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintPdf}
                    className="px-3 py-1.5 bg-[#00635C] text-white rounded-lg text-xs font-bold hover:bg-[#007c73] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Print PDF Document
                  </button>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-5 font-mono text-[11px] leading-relaxed text-stone-800 whitespace-pre-wrap max-h-96 overflow-y-auto">
                {generateMarkdownExport()}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 bg-[#FAF9F6] flex items-center justify-between">
          <div className="text-xs text-stone-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00635C]" />
            <span>Changes reflect across voice RAG with 0-second sync lag.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving || isPublishing}
              className="px-4 py-2 bg-stone-100 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold hover:bg-stone-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Draft SOP'}
            </button>

            <button
              type="button"
              onClick={handleBicApprovalPublish}
              disabled={isSaving || isPublishing}
              className="px-5 py-2 bg-[#00635C] text-white rounded-xl text-xs font-bold hover:bg-[#007c73] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isPublishing ? 'Publishing...' : 'BIC Approve & Publish (v' + (currentSop.status === 'published' ? currentSop.version + 1 : currentSop.version || 1) + ')'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
