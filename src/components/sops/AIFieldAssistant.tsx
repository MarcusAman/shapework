import React, { useState } from 'react';
import { Zap, HelpCircle, Loader2, RefreshCw, X, Check, ArrowRight } from 'lucide-react';

interface AIFieldAssistantProps {
  fieldType?: string;
  field?: string;
  fieldValue?: string;
  value?: string;
  sopContext?: any;
  onApply?: (newValue: string) => void;
  onChange?: (newValue: string) => void;
}

export default function AIFieldAssistant({
  fieldType,
  field,
  fieldValue,
  value,
  sopContext,
  onApply,
  onChange
}: AIFieldAssistantProps) {
  const actualFieldType = fieldType || field || 'general';
  const actualFieldValue = fieldValue ?? value ?? '';
  const handleApplyValue = onApply || onChange || (() => {});

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [whyStronger, setWhyStronger] = useState<string>('');
  const [missingInfo, setMissingInfo] = useState<string[]>([]);
  const [examples, setExamples] = useState<string[]>([]);
  
  const [editValue, setEditValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  const actions = [
    { type: 'help_write', label: 'Help Me Write This' },
    { type: 'improve_clarity', label: 'Improve Clarity' },
    { type: 'make_actionable', label: 'Make More Actionable' },
    { type: 'add_detail', label: 'Add Detail' },
    { type: 'make_shorter', label: 'Make Shorter' },
    { type: 'identify_missing', label: 'Identify Missing Info' },
    { type: 'suggest_example', label: 'Suggest Example' }
  ];

  const handleAction = async (actionType: string) => {
    setLoading(true);
    setError(null);
    setIsEditing(false);
    try {
      const res = await fetch('/api/ops/ai/field-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: actualFieldType,
          value: actualFieldValue,
          actionType,
          sopForm: sopContext
        })
      });
      if (!res.ok) {
        throw new Error('Failed to fetch AI suggestions.');
      }
      const data = await res.json();
      if (data.response && data.response.result) {
        const result = data.response.result;
        setSuggestion(result.suggestion || '');
        setExplanation(result.explanation || '');
        setWhyStronger(result.explanation || 'Refining text helps ensure compliance consistency.');
        setMissingInfo(result.missingInfo || []);
        setExamples(result.examples || []);
        setEditValue(result.suggestion || '');
      }
    } catch (err: any) {
      setError(err.message || 'AI drafting assistance is currently unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (state: 'accepted' | 'edited' | 'rejected' | 'dismissed') => {
    try {
      await fetch('/api/ops/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectType: 'ai_response',
          objectId: `field_${actualFieldType}`,
          interactionType: 'field_assist',
          helpful: state === 'accepted' || state === 'edited',
          reasonCodes: state === 'rejected' ? ['not_useful'] : [],
          comment: `State: ${state} for field: ${actualFieldType}`,
          createdAt: new Date().toISOString()
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="mt-1.5 select-none font-sans text-xs">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E5EFEA] hover:bg-[#d5e7df] border border-[#00635C]/20 text-[#00635C] rounded-lg transition-colors cursor-pointer text-[11px] font-semibold"
        >
          <Zap className="w-3 h-3 text-[#00635C]" />
          <span>AI Field Assist</span>
        </button>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3.5 shadow-md text-left animate-fadeIn">
          <div className="flex justify-between items-center border-b border-stone-100 pb-2">
            <span className="font-bold text-xs text-[#00635C] uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#00635C]" /> AI Field Assistant
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setSuggestion('');
                setError(null);
                handleFeedback('dismissed');
              }}
              className="text-stone-400 hover:text-stone-700 transition-colors cursor-pointer p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!suggestion && !loading && !error && (
            <div className="flex flex-wrap gap-1.5">
              {actions.map(a => (
                <button
                  type="button"
                  key={a.type}
                  onClick={() => handleAction(a.type)}
                  className="px-2.5 py-1.5 bg-stone-50 hover:bg-[#E5EFEA] border border-stone-200 hover:border-[#00635C]/30 text-stone-700 hover:text-[#00635C] rounded-xl cursor-pointer text-xs transition-colors font-medium"
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 py-4 justify-center text-stone-500 font-sans text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-[#00635C]" />
              <span>Analyzing context & rewriting...</span>
            </div>
          )}

          {error && (
            <div className="space-y-2">
              <p className="text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-xl text-xs">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg cursor-pointer text-xs font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {suggestion && !loading && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase text-stone-400 block font-bold">Original</span>
                  <p className="text-stone-600 italic leading-relaxed text-xs">{actualFieldValue || '(Empty)'}</p>
                </div>
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase text-emerald-800 block font-bold">Suggested</span>
                  {isEditing ? (
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                      rows={3}
                    />
                  ) : (
                    <p className="text-stone-900 font-medium leading-relaxed text-xs">{editValue}</p>
                  )}
                </div>
              </div>

              {explanation && (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <span className="text-[10px] uppercase text-stone-400 block font-bold">Why this is stronger</span>
                  <p className="text-stone-600 text-xs mt-0.5 leading-relaxed">{explanation}</p>
                </div>
              )}

              {missingInfo.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase text-amber-800 block font-bold">Missing Details to Supply</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-amber-900 text-xs">
                    {missingInfo.map((m, idx) => <li key={idx}>{m}</li>)}
                  </ul>
                </div>
              )}

              {examples.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase text-blue-800 block font-bold">Suggested Examples</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-blue-900 text-xs">
                    {examples.map((ex, idx) => <li key={idx}>{ex}</li>)}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2 justify-end text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSuggestion('');
                    handleFeedback('rejected');
                  }}
                  className="px-3 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-xl transition-colors cursor-pointer font-semibold"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(!isEditing);
                  }}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors cursor-pointer font-semibold"
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Before Applying'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleApplyValue(actualFieldValue ? `${actualFieldValue}\n${editValue}` : editValue);
                    setSuggestion('');
                    setIsOpen(false);
                    handleFeedback('edited');
                  }}
                  className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl transition-colors cursor-pointer font-semibold"
                >
                  Append
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleApplyValue(editValue);
                    setSuggestion('');
                    setIsOpen(false);
                    handleFeedback(isEditing ? 'edited' : 'accepted');
                  }}
                  className="px-3.5 py-1.5 bg-[#00635C] hover:bg-[#00514B] text-white rounded-xl transition-colors cursor-pointer font-semibold shadow-xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Replace
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
