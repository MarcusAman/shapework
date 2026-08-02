import React, { useState } from 'react';
import { X, Edit3, AlertTriangle, Layers, FileText } from 'lucide-react';

export interface RequestChangeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAsset?: string;
  onSubmitChange?: (assetId: string, description: string, scope: 'single' | 'cross', affectedAssets: string[]) => Promise<void>;
}

export const RequestChangeDrawer: React.FC<RequestChangeDrawerProps> = ({
  isOpen,
  onClose,
  selectedAsset = 'flyer',
  onSubmitChange,
}) => {
  const [changeScope, setChangeScope] = useState<'single' | 'cross'>('single');
  const [changeDescription, setChangeDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeDescription.trim()) return;
    setIsSubmitting(true);
    try {
      if (onSubmitChange) {
        await onSubmitChange(
          selectedAsset,
          changeDescription,
          changeScope,
          changeScope === 'cross' ? ['flyer', 'social', 'postcard', 'sign_rider', 'email'] : [selectedAsset]
        );
      }
      setChangeDescription('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedMaterialName = selectedAsset === 'flyer'
    ? 'Property Flyer'
    : selectedAsset === 'carousel'
    ? 'Social Package'
    : selectedAsset === 'postcard'
    ? 'Direct Mail Postcard'
    : selectedAsset === 'sign_rider'
    ? 'Open-House Sign Rider'
    : 'Email Announcement';

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex justify-end transition-opacity duration-300"
      data-testid="request-change-drawer"
    >
      <div className="w-full max-w-lg bg-[#fffdf8] text-[#13231e] h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slide-in-right overflow-hidden text-left font-sans">
        
        {/* LIGHT DRAWER HEADER */}
        <header className="p-6 bg-[#f6f7f1] border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#00635c]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#00635c]">Revision Request</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#13231e]">
              Request a change
            </h2>
            <p className="text-xs text-[#64716b]">
              Material: <span className="font-bold text-[#13231e]">{formattedMaterialName}</span> · Requested by <span className="font-bold text-[#13231e]">Eric Anderson</span>
            </p>
          </div>

          <button
            type="button"
            data-testid="close-change-drawer"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* DRAWER FORM BODY */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* INPUT FIELD: WHAT SHOULD CHANGE? */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#64716b] block">
                What should change?
              </label>
              <textarea
                value={changeDescription}
                onChange={(e) => setChangeDescription(e.target.value)}
                placeholder="e.g. Change headline to 'DIRECT OCEANFRONT ESTATE IN WRIGHTSVILLE BEACH' and update agent phone number to (910) 555-0199."
                className="w-full h-36 p-4 bg-[#f6f7f1] border border-slate-300 rounded-xl text-sm text-[#13231e] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00635c] resize-none"
                required
              />
            </div>

            {/* SCOPE SELECTION: APPLY TO */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#64716b] block">
                Apply to
              </label>

              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3.5 bg-[#f6f7f1] border border-slate-200 rounded-xl cursor-pointer transition-all hover:bg-slate-100">
                  <input
                    type="radio"
                    name="changeScope"
                    value="single"
                    checked={changeScope === 'single'}
                    onChange={() => setChangeScope('single')}
                    className="w-4 h-4 text-[#00635c] focus:ring-[#00635c]"
                    data-testid="change-scope-single"
                  />
                  <div>
                    <span className="font-bold text-xs text-[#13231e] block">● {formattedMaterialName} only</span>
                    <span className="text-[11px] text-[#64716b]">Isolates modification to this specific material</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 bg-[#f6f7f1] border border-slate-200 rounded-xl cursor-pointer transition-all hover:bg-slate-100">
                  <input
                    type="radio"
                    name="changeScope"
                    value="cross"
                    checked={changeScope === 'cross'}
                    onChange={() => setChangeScope('cross')}
                    className="w-4 h-4 text-[#00635c] focus:ring-[#00635c]"
                    data-testid="change-scope-cross"
                  />
                  <div>
                    <span className="font-bold text-xs text-[#13231e] block">○ Other related materials</span>
                    <span className="text-[11px] text-[#64716b]">Applies update across all related package materials</span>
                  </div>
                </label>
              </div>

              {/* CROSS-MATERIAL IMPACT WARNING */}
              {changeScope === 'cross' && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2" data-testid="reapprove-warning-box">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Cross-Material Impact & Re-approval Required</span>
                  </div>
                  <p className="text-[11px] text-amber-950 leading-relaxed">
                    Modifying shared copy or listing facts will trigger automatic re-audits across all affected materials.
                  </p>
                  <div className="text-[10px] font-medium text-amber-900" data-testid="cross-affected-materials-list">
                    Affected: Property Flyer, Social Package, Postcard, Sign Rider, Email
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DRAWER SUBMIT FOOTER */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-[#13231e] font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="submit-change-request-btn"
              className="px-6 py-2.5 bg-[#00635c] hover:bg-[#004d48] text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? 'Submitting...' : 'Submit change request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
