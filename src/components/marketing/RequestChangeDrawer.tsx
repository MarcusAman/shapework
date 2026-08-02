import { useState } from 'react';
import { X, Sparkles, AlertTriangle } from 'lucide-react';

export interface RequestChangeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAsset: string;
  onSubmitChange: (assetId: string, changeDescription: string, applyScope: 'single' | 'cross', affectedAssets: string[]) => Promise<void>;
}

export const RequestChangeDrawer: React.FC<RequestChangeDrawerProps> = ({
  isOpen,
  onClose,
  selectedAsset,
  onSubmitChange,
}) => {
  const [changeText, setChangeText] = useState('Make the headline warmer and move the price closer to the address.');
  const [applyScope, setApplyScope] = useState<'single' | 'cross'>('single');
  const [selectedAffectedAssets, setSelectedAffectedAssets] = useState<string[]>(['carousel', 'postcard']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReapproveWarning, setShowReapproveWarning] = useState(false);

  if (!isOpen) return null;

  const assetDisplayNames: Record<string, string> = {
    flyer: 'Property Flyer',
    carousel: 'Social Package',
    postcard: 'Direct-Mail Postcard',
    sign_rider: 'Open-House Sign Rider',
    email: 'Email Announcement',
  };

  const potentialAffected: Record<string, Array<{ id: string; label: string }>> = {
    flyer: [
      { id: 'carousel', label: 'Social slide 1 headline' },
      { id: 'postcard', label: 'Postcard front tagline' },
      { id: 'email', label: 'Email announcement header' },
    ],
    carousel: [
      { id: 'flyer', label: 'Property Flyer main copy' },
      { id: 'postcard', label: 'Postcard front tagline' },
    ],
    postcard: [
      { id: 'flyer', label: 'Property Flyer headline' },
      { id: 'email', label: 'Email announcement copy' },
    ],
    sign_rider: [
      { id: 'flyer', label: 'Property Flyer open house line' },
    ],
    email: [
      { id: 'flyer', label: 'Property Flyer main copy' },
    ],
  };

  const currentAffectedList = potentialAffected[selectedAsset] || [];

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeText.trim()) return;

    if (applyScope === 'cross' && !showReapproveWarning) {
      setShowReapproveWarning(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitChange(
        selectedAsset,
        changeText,
        applyScope,
        applyScope === 'cross' ? selectedAffectedAssets : [selectedAsset]
      );
      onClose();
    } finally {
      setIsSubmitting(false);
      setShowReapproveWarning(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0B4A3F] border-l border-[rgba(208,214,187,0.24)] shadow-2xl p-6 z-50 animate-slide-in-right flex flex-col justify-between font-sans text-[#FFFDF8] text-left">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(208,214,187,0.14)] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-300 shrink-0" />
            <h3 className="font-serif font-bold text-base text-[#FFFDF8]">Request a change</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[rgba(246,247,241,0.6)] hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Asset Identifier */}
        <div className="p-3 bg-[#073F35] border border-[rgba(208,214,187,0.14)] rounded-xl text-xs space-y-0.5">
          <span className="text-[rgba(246,247,241,0.6)] text-[10px] uppercase tracking-wider font-bold block">
            Selected material:
          </span>
          <span className="font-bold text-emerald-200 text-sm">
            {assetDisplayNames[selectedAsset] || selectedAsset}
          </span>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-emerald-200 block">What should change?</label>
            <textarea
              rows={4}
              value={changeText}
              onChange={(e) => setChangeText(e.target.value)}
              placeholder="Describe requested adjustments clearly..."
              className="w-full p-3 bg-[#073F35] border border-[rgba(208,214,187,0.2)] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 font-sans"
            />
          </div>

          {/* Scope Radios (Default: Single Material Only) */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-200 block">Apply to:</span>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="applyScope"
                  value="single"
                  checked={applyScope === 'single'}
                  onChange={() => setApplyScope('single')}
                  className="accent-emerald-400"
                />
                <span className="font-medium">This material only</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="applyScope"
                  value="cross"
                  checked={applyScope === 'cross'}
                  onChange={() => setApplyScope('cross')}
                  className="accent-emerald-400"
                />
                <span className="font-medium">Other affected materials</span>
              </label>
            </div>
          </div>

          {/* Affected Materials Listing (When Cross Scope Selected) */}
          {applyScope === 'cross' && (
            <div className="p-3 bg-[#073F35] border border-[rgba(208,214,187,0.14)] rounded-xl space-y-2 text-xs animate-fade-in">
              <span className="font-bold text-emerald-200 block text-[11px]">
                Potentially affected materials:
              </span>
              <div className="space-y-1.5 pl-1">
                {currentAffectedList.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 cursor-pointer text-[11px]">
                    <input
                      type="checkbox"
                      checked={selectedAffectedAssets.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAffectedAssets([...selectedAffectedAssets, item.id]);
                        } else {
                          setSelectedAffectedAssets(selectedAffectedAssets.filter((a) => a !== item.id));
                        }
                      }}
                      className="accent-emerald-400 rounded"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Cross-Asset Re-approval Warning */}
          {showReapproveWarning && (
            <div className="p-3 bg-amber-500/20 border border-amber-400/40 rounded-xl space-y-1.5 text-xs animate-fade-in">
              <div className="flex items-center gap-2 text-amber-200 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Re-approval Required</span>
              </div>
              <p className="text-[11px] text-amber-100/90 leading-relaxed">
                Applying changes across multiple materials will invalidate current material approvals. Affected materials will return to Ready for review.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[rgba(208,214,187,0.14)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#073F35] text-white rounded-xl text-xs font-bold border border-[rgba(208,214,187,0.2)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#00635C] hover:bg-[#004d48] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all border border-emerald-400/40"
            >
              {isSubmitting ? 'Submitting...' : showReapproveWarning ? 'Confirm & Submit' : 'Submit request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
