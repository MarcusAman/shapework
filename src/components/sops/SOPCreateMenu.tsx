import React, { useState } from 'react';
import { Plus, GitBranch, Zap, FileText, ArrowLeft, ArrowRight, AlertCircle, X, Sparkles, ChevronRight, Check, Upload, Tag } from 'lucide-react';
import { SOP_TEMPLATES, SOP_CATEGORY_TEMPLATES, SOPTemplate } from './sopTemplates';

interface SOPCreateMenuProps {
  onBack: () => void;
  onSelectBlank: () => void;
  onSelectTemplate: (template: SOPTemplate) => void;
  onSelectAI: (brief: string) => Promise<void>;
  sops: any[];
  onSelectDuplicate: (sopId: string) => void;
  onSelectUpload?: () => void;
}

export default function SOPCreateMenu({
  onBack,
  onSelectBlank,
  onSelectTemplate,
  onSelectAI,
  sops,
  onSelectDuplicate,
  onSelectUpload
}: SOPCreateMenuProps) {
  const [aiBrief, setAiBrief] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showDuplicateSelect, setShowDuplicateSelect] = useState(false);

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiBrief.trim()) return;

    setAiLoading(true);
    setAiError(null);
    try {
      await onSelectAI(aiBrief);
    } catch (err: any) {
      setAiError(err.message || 'AI Drafting service is currently unavailable.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleStartWithNora = () => {
    // Scroll or focus the AI brief input, or pre-seed prompt
    setAiBrief('Write an authoritative Standard Operating Procedure for Nest Realty Wilmington. Guide me step-by-step through required information, assigned roles, compliance review gates, and completion evidence.');
  };

  return (
    <div className="flex-grow p-6 sm:p-8 bg-white text-left select-none relative overflow-y-auto font-sans min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back button */}
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-xl text-xs font-semibold text-stone-700 transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Knowledge Library</span>
          </button>
        </div>

        {/* Page Header */}
        <div className="border-b border-stone-200/80 pb-4">
          <h1 className="font-serif font-bold text-2xl text-stone-900 tracking-tight">
            Create an SOP
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Choose how you’d like to begin. Select a category starter template (Finance, Transactions, Office, Vendor, Systems, Marketing), build with NORA, or begin blank.
          </p>
        </div>

        {/* FEATURED OPTION: Build it with NORA */}
        <div 
          onClick={handleStartWithNora}
          className="p-6 bg-white border-2 border-[#00635C]/30 hover:border-[#00635C] rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#E5EFEA] text-[#00635C] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-base text-stone-900">
                  Build it with NORA
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#E5EFEA] text-[#00635C] text-[10px] font-semibold tracking-wide">
                  Featured
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed max-w-xl">
                Answer one question at a time and turn your process knowledge into an editable SOP draft.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-4 py-2 bg-[#00635C] group-hover:bg-[#00514B] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0">
            <span>Start with NORA</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* SUPPORTING OPTIONS: 4 Clean Light Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Card 1: Upload Document */}
          <div 
            onClick={onSelectUpload}
            className="p-5 bg-white border-2 border-[#00635C]/20 hover:border-[#00635C] rounded-2xl hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#E5EFEA] text-[#00635C] flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <h3 className="font-serif font-bold text-sm text-stone-900 group-hover:text-[#00635C] transition-colors">
                Upload Document
              </h3>
              <p className="text-xs text-stone-500 leading-normal">
                Import PDF or Word doc to extract or update an SOP.
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs font-semibold text-[#00635C]">
              <span>Upload SOP file</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 2: Use a Template */}
          <div 
            onClick={() => setShowTemplatePicker(!showTemplatePicker)}
            className="p-5 bg-white border border-stone-200 rounded-2xl hover:border-[#00635C]/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-serif font-bold text-sm text-stone-900">
                Use a Template
              </h3>
              <p className="text-xs text-stone-500 leading-normal">
                Start with a proven Nest structure.
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs font-semibold text-[#00635C]">
              <span>Choose template</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3: Start Blank */}
          <div 
            onClick={onSelectBlank}
            className="p-5 bg-white border border-stone-200 rounded-2xl hover:border-[#00635C]/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00635C] flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="font-serif font-bold text-sm text-stone-900 group-hover:text-[#00635C] transition-colors">
                Start Blank
              </h3>
              <p className="text-xs text-stone-500 leading-normal">
                Create the procedure manually.
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs font-semibold text-[#00635C]">
              <span>Create blank</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 4: Duplicate Existing SOP */}
          <div 
            onClick={() => setShowDuplicateSelect(true)}
            className="p-5 bg-white border border-stone-200 rounded-2xl hover:border-[#00635C]/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <GitBranch className="w-4 h-4" />
              </div>
              <h3 className="font-serif font-bold text-sm text-stone-900 group-hover:text-amber-800 transition-colors">
                Duplicate Existing SOP
              </h3>
              <p className="text-xs text-stone-500 leading-normal">
                Clone an existing procedure.
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs font-semibold text-stone-700 group-hover:text-stone-900">
              <span>Select to copy</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* PROGRESSIVE DISCLOSURE: Template Picker Sheet / List */}
        {showTemplatePicker && (
          <div className="p-5 bg-white border border-stone-200 rounded-2xl shadow-sm space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div>
                <h4 className="font-serif font-bold text-sm text-stone-900">Category Starter Templates & SOPs</h4>
                <p className="text-[11px] text-stone-500">Select a category starter template (Finance, Transactions, Office, Vendor, Systems, Marketing)</p>
              </div>
              <button 
                onClick={() => setShowTemplatePicker(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Quick Starters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SOP_CATEGORY_TEMPLATES.map((cat) => {
                const matched = SOP_TEMPLATES.find(t => t.id === cat.templateId);
                return (
                  <button
                    key={cat.category}
                    onClick={() => {
                      if (matched) {
                        onSelectTemplate(matched);
                      }
                    }}
                    className="p-3 bg-[#E5EFEA]/30 hover:bg-[#E5EFEA] border border-[#00635C]/20 hover:border-[#00635C] rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <span className="text-[10px] font-bold uppercase text-[#00635C] block">
                      {cat.category}
                    </span>
                    <strong className="text-xs text-stone-900 font-semibold block mt-0.5 group-hover:text-[#00635C]">
                      {cat.label}
                    </strong>
                    <span className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                      {cat.description}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-stone-100">
              <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-2">
                All Available Nest Standards
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SOP_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => onSelectTemplate(tmpl)}
                    className="p-3.5 bg-[#F7F8F5] hover:bg-[#E5EFEA]/40 border border-stone-200/80 hover:border-[#00635C] rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#00635C]">
                        {tmpl.category || tmpl.department || 'Operations'}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {tmpl.steps?.length || 0} Steps
                      </span>
                    </div>
                    <h5 className="font-semibold text-xs text-stone-900 mt-1 group-hover:text-[#00635C] transition-colors">
                      {tmpl.title}
                    </h5>
                    <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">
                      {tmpl.purpose || tmpl.scope}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Generator Box (Light Mode) */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4 text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-stone-900">
                Generate SOP Draft with AI
              </h3>
              <p className="text-xs text-stone-500">
                Provide an operational policy description to draft a structured SOP sequence instantly.
              </p>
            </div>
          </div>

          <form onSubmit={handleGenerateAI} className="space-y-3">
            <textarea
              value={aiBrief}
              onChange={(e) => setAiBrief(e.target.value)}
              placeholder="e.g. Write a Standard Operating Procedure for agent onboarding. It needs to include a welcome package step, a CRM account activation step, and a final broker review step."
              className="w-full bg-[#F7F8F5] border border-stone-200 rounded-xl p-3.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C] min-h-[80px]"
            />

            {aiError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{aiError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 select-none pt-1">
              <span className="text-[11px] text-stone-400">
                AI creates a draft labeled: "AI-generated draft — review required"
              </span>
              <button
                type="submit"
                disabled={!aiBrief.trim() || aiLoading}
                className="px-4 py-2.5 bg-[#00635C] hover:bg-[#00514B] text-white font-semibold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-40 shadow-xs flex items-center justify-center gap-1.5"
              >
                {aiLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Drafting...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Generate with AI</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Modal: Duplicate SOP Selector (Light Mode) */}
      {showDuplicateSelect && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-stone-900">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-sm text-stone-900">Duplicate Existing SOP</h3>
              <button onClick={() => setShowDuplicateSelect(false)} className="text-stone-400 hover:text-stone-600 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {sops.filter(s => s.status === 'published' || s.status === 'draft').map((sop) => (
                <button
                  key={sop.id}
                  onClick={() => {
                    onSelectDuplicate(sop.sopId);
                    setShowDuplicateSelect(false);
                  }}
                  className="w-full text-left p-3.5 bg-[#F7F8F5] hover:bg-[#E5EFEA]/40 border border-stone-200/80 hover:border-[#00635C] rounded-xl block transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold text-[#00635C] block">
                      {sop.status === 'published' ? 'Published' : 'Draft'} v{sop.version}.0
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {sop.department}
                    </span>
                  </div>
                  <strong className="text-xs text-stone-900 block mt-1 group-hover:text-[#00635C] transition-colors">
                    {sop.title}
                  </strong>
                </button>
              ))}

              {sops.length === 0 && (
                <p className="text-xs text-stone-500 py-6 text-center">No active SOP records found to duplicate.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
