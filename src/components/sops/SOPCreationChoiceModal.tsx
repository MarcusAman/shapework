import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Plus, 
  Edit3, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  Search, 
  CheckCircle2, 
  ChevronRight,
  Layers
} from 'lucide-react';

export interface SOPCreationChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sops?: any[];
  onSelectUpload: () => void;
  onSelectCreateNew: () => void;
  onSelectEditExisting: (sop: any) => void;
}

export const SOPCreationChoiceModal: React.FC<SOPCreationChoiceModalProps> = ({
  isOpen,
  onClose,
  sops = [],
  onSelectUpload,
  onSelectCreateNew,
  onSelectEditExisting
}) => {
  const [showExistingList, setShowExistingList] = useState(false);
  const [searchExisting, setSearchExisting] = useState('');

  if (!isOpen) return null;

  const filteredSops = sops.filter(s => {
    if (!searchExisting.trim()) return true;
    const q = searchExisting.toLowerCase();
    return (s.title && s.title.toLowerCase().includes(q)) ||
           (s.department && s.department.toLowerCase().includes(q)) ||
           (s.processOwner && s.processOwner.toLowerCase().includes(q));
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-fadeIn select-none font-sans text-left">
      <div className="bg-white border border-stone-200/90 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden transition-all">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#E5EFEA] text-[#00635C] flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="font-serif font-bold text-xl text-stone-900">
                {showExistingList ? 'Select an SOP to Edit' : 'Create or Edit an SOP'}
              </h2>
            </div>
            <p className="text-xs text-stone-500">
              {showExistingList 
                ? 'Choose an existing Standard Operating Procedure to modify in the SOP Builder.'
                : 'Select how you would like to proceed with your Standard Operating Procedure.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowExistingList(false);
              onClose();
            }}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {!showExistingList ? (
            <div className="grid grid-cols-1 gap-3.5">
              
              {/* Option 1: Upload a SOP Document */}
              <div
                onClick={() => {
                  onClose();
                  onSelectUpload();
                }}
                className="p-5 rounded-2xl bg-white hover:bg-[#F7F8F5] border-2 border-stone-200/80 hover:border-[#00635C] shadow-2xs hover:shadow-sm transition-all cursor-pointer group flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00635C] border border-emerald-200/70 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-stone-900 group-hover:text-[#00635C] transition-colors">
                        Upload a SOP Document
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                        PDF • Word • Markdown
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed max-w-md">
                      Upload an existing PDF, Word (.docx), or text document. Nora will automatically parse and convert it into a structured SOP with checklist steps and roles.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-[#00635C] group-hover:translate-x-1 transition-transform shrink-0 pt-2">
                  <span>Upload</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Option 2: Create New SOP */}
              <div
                onClick={() => {
                  onClose();
                  onSelectCreateNew();
                }}
                className="p-5 rounded-2xl bg-white hover:bg-[#F7F8F5] border-2 border-stone-200/80 hover:border-[#00635C] shadow-2xs hover:shadow-sm transition-all cursor-pointer group flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#E5EFEA] text-[#00635C] border border-[#00635C]/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-stone-900 group-hover:text-[#00635C] transition-colors">
                        Create New SOP
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-[#E5EFEA] text-[#00635C] text-[10px] font-semibold">
                        SOP Builder
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed max-w-md">
                      Build a brand new Standard Operating Procedure step-by-step or enter a rough description to have Shapework AI draft it for you.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-[#00635C] group-hover:translate-x-1 transition-transform shrink-0 pt-2">
                  <span>Start</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Option 3: Edit an Existing SOP */}
              <div
                onClick={() => setShowExistingList(true)}
                className="p-5 rounded-2xl bg-white hover:bg-[#F7F8F5] border-2 border-stone-200/80 hover:border-[#00635C] shadow-2xs hover:shadow-sm transition-all cursor-pointer group flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/70 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                    <Edit3 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-stone-900 group-hover:text-[#00635C] transition-colors">
                        Edit an Existing SOP
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
                        {sops.length} In Library
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed max-w-md">
                      Select an existing published procedure or draft from your knowledge library to modify its steps, triggers, roles, or rules.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-[#00635C] group-hover:translate-x-1 transition-transform shrink-0 pt-2">
                  <span>Browse</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

            </div>
          ) : (
            /* Subview: Existing SOP List Selector */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <button
                  type="button"
                  onClick={() => setShowExistingList(false)}
                  className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>← Back to Options</span>
                </button>
                <span className="text-xs text-stone-400 font-mono">
                  {filteredSops.length} available
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchExisting}
                  onChange={(e) => setSearchExisting(e.target.value)}
                  placeholder="Search existing SOPs by title, role, or department..."
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                />
              </div>

              {/* SOP List */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredSops.length === 0 ? (
                  <div className="p-8 text-center text-xs text-stone-500">
                    No SOPs match your search query.
                  </div>
                ) : (
                  filteredSops.map((sop) => (
                    <div
                      key={sop.id || sop.sopId}
                      onClick={() => {
                        onClose();
                        onSelectEditExisting(sop);
                      }}
                      className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-emerald-50/60 hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-stone-900 group-hover:text-[#00635C]">
                            {sop.title}
                          </h4>
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                            sop.status === 'published' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {sop.status || 'Draft'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500">
                          {sop.department || 'Operations'} • Owner: {sop.processOwner || sop.ownerRole || 'Admin'} • {(sop.steps || []).length} Steps
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-[#00635C] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Edit</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-between items-center text-xs text-stone-500">
          <span>Need help documenting? Ask Nora in the Knowledge Library.</span>
          <button
            type="button"
            onClick={() => {
              setShowExistingList(false);
              onClose();
            }}
            className="px-4 py-2 border border-stone-200 hover:bg-white text-stone-700 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};
