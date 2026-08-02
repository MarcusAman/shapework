import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, AlertCircle, Check } from 'lucide-react';

interface HelpfulnessFeedbackProps {
  objectType: 'ai_response' | 'recommendation' | 'routing_decision' | 'notification' | 'automation' | 'sop_step' | 'sop_run' | 'resolution';
  objectId: string;
  interactionType?: string;
  workspaceId?: string;
  context?: any;
  compact?: boolean;
}

export default function HelpfulnessFeedback({
  objectType,
  objectId,
  interactionType = 'click',
  workspaceId = 'nest-realty-demo',
  context = {},
  compact = true
}: HelpfulnessFeedbackProps) {
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [showReasons, setShowReasons] = useState<boolean>(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState<string>('');
  const [submittingDetails, setSubmittingDetails] = useState<boolean>(false);
  const [undoTimer, setUndoTimer] = useState<any>(null);

  const reasons = [
    { code: 'incorrect', label: 'Incorrect information' },
    { code: 'not_useful', label: 'Not useful / Irrelevant' },
    { code: 'incomplete', label: 'Incomplete instructions' },
    { code: 'hard_to_understand', label: 'Hard to understand' },
    { code: 'wrong_recipient', label: 'Sent to the wrong person' },
    { code: 'too_late', label: 'Arrived too late' },
    { code: 'too_early', label: 'Arrived too early' },
    { code: 'wrong_channel', label: 'Wrong communication channel' },
    { code: 'automation_fail', label: 'Automation did not work' },
    { code: 'more_work', label: 'Created more work' },
    { code: 'other', label: 'Other issue' }
  ];

  const handleLike = async (isHelpful: boolean) => {
    setLiked(isHelpful);
    
    if (isHelpful) {
      setSubmitted(true);
      // Submit positive feedback
      try {
        await fetch('/api/ops/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId,
            userId: 'usr_ryan',
            objectType,
            objectId,
            interactionType,
            helpful: true,
            reasonCodes: [],
            createdAt: new Date().toISOString()
          })
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      setShowReasons(true);
    }
  };

  const handleUndo = () => {
    setSubmitted(false);
    setLiked(null);
    setShowReasons(false);
    setSelectedReasons([]);
    setComment('');
  };

  const toggleReason = (code: string) => {
    if (selectedReasons.includes(code)) {
      setSelectedReasons(selectedReasons.filter(r => r !== code));
    } else {
      setSelectedReasons([...selectedReasons, code]);
    }
  };

  const handleSubmitReasons = async () => {
    setSubmittingDetails(true);
    try {
      // Submit negative feedback
      const fbRes = await fetch('/api/ops/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId: 'usr_ryan',
          objectType,
          objectId,
          interactionType,
          helpful: false,
          reasonCodes: selectedReasons,
          comment,
          createdAt: new Date().toISOString()
        })
      });

      let branched: any = null;
      if (objectType === 'sop_run' || objectType === 'sop_step') {
        try {
          const branchRes = await fetch('/api/ops/sops/branch-draft-from-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              runId: objectId,
              comment: comment || `User reported issues with reason codes: ${selectedReasons.join(', ')}`,
              helpful: false
            })
          });
          const branchJson = await branchRes.json();
          if (branchJson.success && branchJson.draftSop) {
            branched = branchJson.draftSop;
          }
        } catch (branchErr) {
          console.error('Failed to auto-branch draft:', branchErr);
        }
      }

      setBranchedDraft(branched);
      setSubmitted(true);
      setShowReasons(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingDetails(false);
    }
  };

  const [branchedDraft, setBranchedDraft] = useState<any>(null);

  if (submitted) {
    return (
      <div className="flex flex-col gap-2 select-none font-mono text-left">
        <div className="flex items-center gap-2 text-[10px] text-emerald-300 bg-emerald-950/40 border border-emerald-500/20 px-3 py-1.5 rounded-lg w-max">
          <Check className="w-3.5 h-3.5" />
          <span>Thanks for the feedback!</span>
          <button
            onClick={handleUndo}
            className="text-stone-400 hover:text-white underline cursor-pointer ml-1 text-[9px] uppercase font-bold"
          >
            Undo
          </button>
        </div>

        {branchedDraft && (
          <div className="p-3 bg-[#01362D] border border-[#00E5C9]/30 rounded-xl text-[10px] space-y-1">
            <span className="text-[#00E5C9] font-bold block uppercase tracking-wider">⚡ Governed Improvement Draft Created</span>
            <p className="text-white/80 font-sans">
              A new draft (v{branchedDraft.version}) was branched with your feedback attached. Review and apply AI recommendations in Phase 4 of the SOP Builder.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${compact ? 'max-w-md' : 'w-full'} text-left font-sans`}>
      {!showReasons ? (
        <div className="flex items-center gap-2 select-none">
          <span className="text-[10px] text-[#D0D6BB]/60 font-mono uppercase tracking-wider">Was this helpful?</span>
          <button
            onClick={() => handleLike(true)}
            className="p-1 bg-white/5 border border-white/10 hover:border-emerald-400/50 hover:bg-emerald-950/20 text-[#D0D6BB]/75 hover:text-emerald-300 rounded transition-all cursor-pointer"
            title="Helpful"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleLike(false)}
            className="p-1 bg-white/5 border border-white/10 hover:border-red-400/50 hover:bg-red-950/20 text-[#D0D6BB]/75 hover:text-red-300 rounded transition-all cursor-pointer"
            title="Not Helpful"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="bg-[#012620] border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl animate-scale-in">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">What could be improved?</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {reasons.map(r => (
              <label
                key={r.code}
                className={`flex items-center gap-2 px-2.5 py-1.5 border rounded-xl cursor-pointer text-[10px] font-medium transition-all ${
                  selectedReasons.includes(r.code)
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold'
                    : 'bg-black/10 border-white/5 text-[#D0D6BB]/70 hover:border-white/15'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedReasons.includes(r.code)}
                  onChange={() => toggleReason(r.code)}
                  className="hidden"
                />
                <span className="leading-tight">{r.label}</span>
              </label>
            ))}
          </div>

          <div className="space-y-1">
            <label className="text-[9px] uppercase font-bold text-[#D0D6BB]/50 block font-mono">
              Tell us what happened
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What should have happened instead?"
              className="w-full bg-black/25 border border-white/10 rounded-xl p-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 min-h-[50px] resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end text-[10px]">
            <button
              onClick={handleUndo}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[#D0D6BB]/80 hover:text-white rounded-lg cursor-pointer font-mono font-bold uppercase"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitReasons}
              disabled={submittingDetails || selectedReasons.length === 0}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-mono uppercase tracking-wider"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
