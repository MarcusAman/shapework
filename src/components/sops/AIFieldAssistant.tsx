import React, { useState } from 'react';
import { Zap, HelpCircle, Loader2, RefreshCw, X, Check, ArrowRight } from 'lucide-react';

interface AIFieldAssistantProps {
  fieldType: string; // e.g. "purpose", "expectedOutcome", "scope", etc.
  fieldValue: string;
  sopContext: any;
  onApply: (newValue: string) => void;
}

export default function AIFieldAssistant({
  fieldType,
  fieldValue,
  sopContext,
  onApply
}: AIFieldAssistantProps) {
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
          field: fieldType,
          value: fieldValue,
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
      setError(err.message || 'AI service unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (state: 'accepted' | 'edited' | 'rejected' | 'dismissed') => {
    // Send feedback to server
    try {
      await fetch('/api/ops/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectType: 'ai_response',
          objectId: `field_${fieldType}`,
          interactionType: 'field_assist',
          helpful: state === 'accepted' || state === 'edited',
          reasonCodes: state === 'rejected' ? ['not_useful'] : [],
          comment: `State: ${state} for field: ${fieldType}`,
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
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#00635C]/30 hover:bg-[#00635C]/50 border border-white/10 text-emerald-300 hover:text-emerald-200 rounded-xl transition-all cursor-pointer font-mono text-[9px] uppercase tracking-wider block"
        >
          <Zap className="w-3 h-3 text-emerald-400" />
          <span>AI Field Assist</span>
        </button>
      ) : (
        <div className="bg-[#01241f] border border-white/10 rounded-2xl p-4 space-y-3.5 shadow-xl text-left animate-scale-in">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="font-mono font-bold text-[9px] text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> AI Field Assistant
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setSuggestion('');
                setError(null);
                handleFeedback('dismissed');
              }}
              className="text-stone-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {!suggestion && !loading && !error && (
            <div className="flex flex-wrap gap-1.5">
              {actions.map(a => (
                <button
                  type="button"
                  key={a.type}
                  onClick={() => handleAction(a.type)}
                  className="px-2.5 py-1.5 bg-black/25 hover:bg-black/40 border border-white/5 hover:border-emerald-500/20 text-[#D0D6BB] hover:text-emerald-300 rounded-xl cursor-pointer text-[10px] transition-all font-mono"
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 py-4 justify-center text-stone-400 font-mono text-[10px]">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Analyzing context & rewriting...</span>
            </div>
          )}

          {error && (
            <div className="space-y-2">
              <p className="text-red-400 bg-red-950/20 border border-red-500/10 p-2.5 rounded-xl font-mono text-[10px]">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          {suggestion && !loading && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3 bg-black/20 border border-white/5 rounded-xl space-y-1">
                  <span className="text-[8px] font-mono uppercase text-stone-500 block font-bold">Original</span>
                  <p className="text-[#D0D6BB] italic leading-relaxed text-[11px]">{fieldValue || '(Empty)'}</p>
                </div>
                <div className="p-3 bg-emerald-950/15 border border-emerald-500/10 rounded-xl space-y-1">
                  <span className="text-[8px] font-mono uppercase text-emerald-400 block font-bold">Suggested</span>
                  {isEditing ? (
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-lg p-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                      rows={3}
                    />
                  ) : (
                    <p className="text-white font-medium leading-relaxed text-[11px]">{editValue}</p>
                  )}
                </div>
              </div>

              {explanation && (
                <div className="p-3 bg-[#013028] border border-white/5 rounded-xl">
                  <span className="text-[8px] font-mono uppercase text-[#D0D6BB]/50 block font-bold">Why this is stronger</span>
                  <p className="text-[#D0D6BB] text-[10px] mt-0.5 leading-relaxed">{explanation}</p>
                </div>
              )}

              {missingInfo.length > 0 && (
                <div className="p-3 bg-amber-950/20 border border-amber-500/10 rounded-xl space-y-1">
                  <span className="text-[8px] font-mono uppercase text-amber-400 block font-bold">Missing Details to Supply</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-amber-300 text-[10px]">
                    {missingInfo.map((m, idx) => <li key={idx}>{m}</li>)}
                  </ul>
                </div>
              )}

              {examples.length > 0 && (
                <div className="p-3 bg-blue-950/20 border border-blue-500/10 rounded-xl space-y-1">
                  <span className="text-[8px] font-mono uppercase text-blue-400 block font-bold">Suggested Examples</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-blue-300 text-[10px]">
                    {examples.map((ex, idx) => <li key={idx}>{ex}</li>)}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2 justify-end text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setSuggestion('');
                    handleFeedback('rejected');
                  }}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white rounded-xl transition-all cursor-pointer font-mono font-bold uppercase"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(!isEditing);
                  }}
                  className="px-3 py-1.5 bg-black/30 hover:bg-black/50 border border-white/5 rounded-xl transition-all cursor-pointer font-mono font-bold uppercase"
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Before Applying'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onApply(editValue + '\n' + fieldValue);
                    setSuggestion('');
                    setIsOpen(false);
                    handleFeedback('edited');
                  }}
                  className="px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/20 text-emerald-300 rounded-xl transition-all cursor-pointer font-mono font-bold uppercase"
                >
                  Insert Below
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onApply(editValue);
                    setSuggestion('');
                    setIsOpen(false);
                    handleFeedback(isEditing ? 'edited' : 'accepted');
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all cursor-pointer font-mono font-bold uppercase flex items-center gap-1"
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
