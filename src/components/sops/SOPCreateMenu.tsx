import React, { useState } from 'react';
import { Plus, GitBranch, Zap, FileText, ArrowLeft, ArrowRight, AlertCircle, X } from 'lucide-react';
import { SOP_TEMPLATES, SOPTemplate } from './sopTemplates';

interface SOPCreateMenuProps {
  onBack: () => void;
  onSelectBlank: () => void;
  onSelectTemplate: (template: SOPTemplate) => void;
  onSelectAI: (brief: string) => Promise<void>;
  sops: any[];
  onSelectDuplicate: (sopId: string) => void;
}

export default function SOPCreateMenu({
  onBack,
  onSelectBlank,
  onSelectTemplate,
  onSelectAI,
  sops,
  onSelectDuplicate
}: SOPCreateMenuProps) {
  const [aiBrief, setAiBrief] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const [showImportDrawer, setShowImportDrawer] = useState(false);
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

  return (
    <div className="flex-grow p-8 bg-[#01362D] text-left select-none relative overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 border border-white/10 rounded-xl text-xs text-[#D0D6BB] hover:text-white transition-all cursor-pointer font-mono"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Library
        </button>

        <div>
          <h2 className="font-serif font-black text-xl text-white uppercase tracking-wide">Create New Standard Operating Procedure</h2>
          <p className="text-[10px] font-mono text-[#D0D6BB]/50 mt-1">Select a starting path to design and publish your operating policy</p>
        </div>

        {/* Card Options Deck */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Blank Canvas */}
          <div 
            onClick={onSelectBlank}
            className="p-6 bg-[#012a23] border border-white/10 rounded-3xl hover:border-emerald-500/30 transition-all shadow-xl cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-black text-sm text-white uppercase tracking-wider mt-2 group-hover:text-emerald-300 transition-colors">Start Blank Canvas</h3>
              <p className="text-[10px] font-mono text-[#D0D6BB]/55 leading-normal">Begin with a completely empty draft. Manually architect your custom SOP stages from scratch.</p>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 mt-4">
              Create blank <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Clone Template */}
          <div className="p-6 bg-[#012a23] border border-white/10 rounded-3xl shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-black text-sm text-white uppercase tracking-wider mt-2">Clone Templates</h3>
              <p className="text-[10px] font-mono text-[#D0D6BB]/55 leading-normal">Clone one of our predefined default checklists without altering the source template.</p>
            </div>

            <div className="space-y-1.5 pt-2">
              {SOP_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => onSelectTemplate(tmpl)}
                  className="w-full text-left p-2.5 bg-black/20 hover:bg-black/30 border border-white/5 rounded-xl text-[10px] text-white font-mono hover:border-white/10 transition-all cursor-pointer block"
                >
                  📄 {tmpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* Card 3: Duplicate Active SOP */}
          <div 
            onClick={() => setShowDuplicateSelect(true)}
            className="p-6 bg-[#012a23] border border-white/10 rounded-3xl hover:border-emerald-500/30 transition-all shadow-xl cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <GitBranch className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-black text-sm text-white uppercase tracking-wider mt-2 group-hover:text-amber-300 transition-colors">Duplicate Existing</h3>
              <p className="text-[10px] font-mono text-[#D0D6BB]/55 leading-normal">Deep clone an existing SOP and assign it a completely separate ID, runs, and audit logs.</p>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-amber-400 mt-4">
              Select SOP to copy <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* AI Generator Box */}
        <div className="bg-[#012a23] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4 text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-xs text-white uppercase tracking-wider">Generate SOP Draft with AI</h3>
              <p className="text-[9px] font-mono text-[#D0D6BB]/55">Provide an operational policy description to draft a structured SOP sequence instantly</p>
            </div>
          </div>

          <form onSubmit={handleGenerateAI} className="space-y-3">
            <textarea
              value={aiBrief}
              onChange={(e) => setAiBrief(e.target.value)}
              placeholder="e.g. Write a Standard Operating Procedure for agent onboarding. It needs to include a welcome package step, a CRM account activation step, and a final broker review step."
              className="w-full bg-black/25 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-purple-500 min-h-[70px]"
            />

            {aiError && (
              <div className="p-3 bg-red-500/15 border border-red-500/25 text-red-300 rounded-xl text-[10px] flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{aiError}</span>
              </div>
            )}

            <div className="flex justify-between items-center select-none">
              <span className="text-[8px] font-mono text-[#D0D6BB]/40">AI creates a DRAFT with label: "AI-generated draft — review required"</span>
              <button
                type="submit"
                disabled={!aiBrief.trim() || aiLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-mono font-bold text-[10px] rounded-xl transition-all cursor-pointer disabled:opacity-40 uppercase"
              >
                {aiLoading ? 'Drafting...' : 'Generate with AI'}
              </button>
            </div>
          </form>
        </div>

        {/* Import card (Coming Soon) */}
        <div 
          className="p-4 bg-stone-900/10 border border-white/5 rounded-2xl flex justify-between items-center opacity-60 cursor-not-allowed group"
        >
          <span className="text-[10px] font-mono text-[#D0D6BB]/50">Have an offline document? <strong>Import SOP</strong> from PDF, Word, or Markdown (Coming Soon)</span>
          <span className="text-[10px] font-mono text-stone-600 transition-colors">Unavailable ➔</span>
        </div>

      </div>

      {/* Selector Modal: Duplicate SOP */}
      {showDuplicateSelect && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#012a23] border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-serif font-black text-sm uppercase text-white tracking-wide">Duplicate Existing SOP</h3>
              <button onClick={() => setShowDuplicateSelect(false)} className="text-stone-400 hover:text-white transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
              {sops.filter(s => s.status === 'published' || s.status === 'draft').map((sop) => (
                <button
                  key={sop.id}
                  onClick={() => {
                    onSelectDuplicate(sop.sopId);
                    setShowDuplicateSelect(false);
                  }}
                  className="w-full text-left p-3 bg-black/20 hover:bg-black/30 border border-white/5 hover:border-white/10 rounded-2xl text-[10px] text-white font-mono block transition-all"
                >
                  <span className="text-[8px] uppercase tracking-wider text-emerald-400 block">{sop.status} v{sop.version}</span>
                  <strong className="block mt-0.5">{sop.title}</strong>
                </button>
              ))}

              {sops.length === 0 && (
                <p className="text-xs text-stone-500 py-6 text-center">No active SOP records found to duplicate.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Drawer: Import File - Not Yet Available Notification */}
      {showImportDrawer && (
        <div className="fixed inset-y-0 right-0 bg-[#012a23] border-l border-white/15 w-[380px] z-50 p-6 shadow-2xl flex flex-col justify-between text-left animate-slide-in">
          <div className="space-y-5">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-serif font-black text-xs text-white uppercase tracking-wider">Import Offline SOP</h3>
              <button onClick={() => setShowImportDrawer(false)} className="text-stone-400 hover:text-white cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-4 bg-stone-900/35 border border-white/5 rounded-2xl space-y-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <h4 className="font-serif font-black text-[11px] uppercase tracking-wider text-white">Feature Not Yet Available</h4>
              <p className="text-[10px] font-sans text-[#D0D6BB]/70 leading-relaxed">
                Direct file ingestion (PDF, Word, or Markdown) is currently undergoing directory parser integrations. 
                Please start with a <strong>Blank Canvas</strong> or paste details into the <strong>AI Draft Generator</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowImportDrawer(false)}
            className="w-full py-2.5 bg-[#00635C] hover:bg-[#004d47] text-white text-[10px] font-mono font-bold uppercase rounded-xl transition-all cursor-pointer text-center"
          >
            Understood
          </button>
        </div>
      )}

    </div>
  );
}
