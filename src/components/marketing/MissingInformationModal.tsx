import React, { useState } from 'react';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';

export interface MissingInformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (date: string, startTime: string, endTime: string) => Promise<void>;
  affectedMaterials?: string[];
  unaffectedMaterials?: string[];
}

export const MissingInformationModal: React.FC<MissingInformationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  affectedMaterials = ['Open-house sign rider', 'Social slide 3', 'Email announcement'],
  unaffectedMaterials = ['Property flyer', 'Direct-mail postcard'],
}) => {
  const [dateText, setDateText] = useState('Sunday, August 9, 2026');
  const [startTime, setStartTime] = useState('2:00 PM');
  const [endTime, setEndTime] = useState('4:00 PM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(dateText, startTime, endTime);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-sans"
      data-testid="missing-information-modal"
    >
      <div className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.24)] rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl text-[#FFFDF8] text-left">
        <div className="flex items-center justify-between border-b border-[rgba(208,214,187,0.14)] pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-300 shrink-0" />
            <h3 className="font-serif font-bold text-base text-[#FFFDF8]" data-testid="missing-info-title">
              Open-house time needed
            </h3>
          </div>
          <button
            type="button"
            data-testid="close-missing-info-modal"
            onClick={onClose}
            className="p-1 text-[rgba(246,247,241,0.6)] hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[rgba(246,247,241,0.85)] leading-relaxed">
          Eric requested an open-house sign rider for 304 Ocean Blvd. The date was included in the phone request, but the start and end times were not confirmed.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-emerald-200 block flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Date</span>
            </label>
            <input
              type="text"
              value={dateText}
              data-testid="input-open-house-date"
              onChange={(e) => setDateText(e.target.value)}
              className="w-full p-2.5 bg-[#073F35] border border-[rgba(208,214,187,0.2)] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-emerald-200 block flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Start</span>
              </label>
              <input
                type="text"
                value={startTime}
                data-testid="input-open-house-start"
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2.5 bg-[#073F35] border border-[rgba(208,214,187,0.2)] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-emerald-200 block flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>End</span>
              </label>
              <input
                type="text"
                value={endTime}
                data-testid="input-open-house-end"
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2.5 bg-[#073F35] border border-[rgba(208,214,187,0.2)] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>

          <div className="p-3 bg-[#073F35] border border-[rgba(208,214,187,0.12)] rounded-xl space-y-2 text-[11px]">
            <div>
              <span className="font-bold text-amber-300 block">Affected Materials:</span>
              <p className="text-amber-100" data-testid="affected-materials-list">{affectedMaterials.join(' • ')}</p>
            </div>

            <div className="pt-1.5 border-t border-[rgba(208,214,187,0.08)]">
              <span className="font-bold text-emerald-300 block">Other Materials Continuing:</span>
              <p className="text-emerald-100" data-testid="unaffected-materials-list">{unaffectedMaterials.join(' • ')}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#073F35] text-white rounded-xl text-xs font-bold border border-[rgba(208,214,187,0.2)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="missing-info-submit-btn"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#00635C] hover:bg-[#004d48] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all border border-emerald-400/40"
            >
              {isSubmitting ? 'Saving...' : 'Save and continue preparation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
