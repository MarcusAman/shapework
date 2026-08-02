import React, { useState, useEffect } from 'react';
import { Zap, AlertCircle, AlertTriangle, Check, X, Loader2 } from 'lucide-react';
import HelpfulnessFeedback from '../shared/HelpfulnessFeedback';

interface Finding {
  level: 'critical' | 'recommended' | 'optional';
  section: string;
  problem: string;
  reason: string;
  proposedImprovement: string;
  sourceContext?: string;
  dismissed?: boolean;
  applied?: boolean;
}

interface SOPQualityReviewProps {
  sop: any;
  onUpdateSop: (updatedSop: any) => Promise<void>;
  onClose: () => void;
}

export default function SOPQualityReview({
  sop,
  onUpdateSop,
  onClose
}: SOPQualityReviewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [applyStatus, setApplyStatus] = useState<string | null>(null);

  const runAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ops/ai/review-sop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sop })
      });
      if (!res.ok) {
        throw new Error('AI Quality Audit service is currently offline.');
      }
      const data = await res.json();
      if (data.response && data.response.result && data.response.result.findings) {
        setFindings(data.response.result.findings.map((f: any) => ({ ...f, dismissed: false, applied: false })));
      } else {
        setFindings([]);
      }
    } catch (err: any) {
      setError(err.message || 'Audit failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAudit();
  }, [sop.id]);

  const handleDismiss = (idx: number) => {
    const updated = [...findings];
    updated[idx].dismissed = true;
    setFindings(updated);
  };

  const handleApply = async (idx: number, finding: Finding) => {
    setApplyStatus(`Applying fix to section: ${finding.section}...`);
    try {
      // Build updated SOP
      const updatedSop = { ...sop };
      const sec = finding.section.toLowerCase();

      // Simple mapping from finding section to SOP fields
      if (sec.includes('purpose')) {
        updatedSop.purpose = finding.proposedImprovement;
      } else if (sec.includes('outcome')) {
        updatedSop.expectedOutcome = finding.proposedImprovement;
      } else if (sec.includes('scope')) {
        updatedSop.scope = finding.proposedImprovement;
      } else if (sec.includes('exclusion')) {
        updatedSop.exclusions = finding.proposedImprovement;
      } else if (sec.includes('trigger')) {
        updatedSop.trigger = finding.proposedImprovement;
      } else if (sec.includes('governance')) {
        if (!updatedSop.governance) updatedSop.governance = {};
        updatedSop.governance.changeSummary = finding.proposedImprovement;
      } else if (sec.includes('step')) {
        // Append step
        if (!updatedSop.steps) updatedSop.steps = [];
        updatedSop.steps.push({
          id: `step_${Date.now()}`,
          title: `AI: Resolved step finding`,
          instruction: finding.proposedImprovement,
          assignedRole: updatedSop.ownerRole || 'marketing_coordinator',
          backupRole: 'owner',
          type: 'manual',
          expectedDuration: '1h',
          evidenceRequired: ''
        });
      } else {
        // Fallback: put in changeSummary
        updatedSop.changeSummary = `AI applied fix: ${finding.proposedImprovement}`;
      }

      // Save to database
      await onUpdateSop(updatedSop);

      const updatedFindings = [...findings];
      updatedFindings[idx].applied = true;
      setFindings(updatedFindings);
      setApplyStatus('Fix applied successfully!');
      setTimeout(() => setApplyStatus(null), 2500);
    } catch (err: any) {
      setApplyStatus(`Failed to apply fix: ${err.message}`);
      setTimeout(() => setApplyStatus(null), 4000);
    }
  };

  const activeFindings = findings.filter(f => !f.dismissed);
  const criticalFindings = activeFindings.filter(f => f.level === 'critical');
  const recommendedFindings = activeFindings.filter(f => f.level === 'recommended');
  const optionalFindings = activeFindings.filter(f => f.level === 'optional');

  return (
    <div className="bg-[#012a23] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 text-left select-none">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <span className="text-[9px] font-mono uppercase tracking-widest text-purple-400 block font-bold">Compliance Checklist Audit</span>
          <h3 className="font-serif font-black text-base text-white uppercase mt-0.5">SOP Quality Review</h3>
          <p className="text-[10px] text-[#D0D6BB]/60 font-mono mt-0.5">Automated assessment against org charts, governance models, and logic check routes</p>
        </div>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-white transition-all cursor-pointer font-bold font-mono text-xs uppercase"
        >
          ✕ Close
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3 font-mono text-xs text-stone-400">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          <span>Analyzing SOP layout and checking logic flow...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-955/20 border border-red-500/20 rounded-2xl space-y-3">
          <p className="text-xs text-red-300 font-mono">{error}</p>
          <button
            onClick={runAudit}
            className="px-3 py-1.5 bg-red-800 text-white rounded-xl text-[10px] font-mono cursor-pointer"
          >
            Retry Audit
          </button>
        </div>
      )}

      {applyStatus && (
        <div className="p-3 bg-purple-950/30 border border-purple-500/25 rounded-2xl text-[10px] font-mono text-purple-300 animate-pulse">
          {applyStatus}
        </div>
      )}

      {!loading && !error && findings.length === 0 && (
        <div className="p-6 text-center bg-black/15 border border-white/5 rounded-2xl space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6" />
          </div>
          <h4 className="font-serif font-black text-xs text-white uppercase tracking-wider">Perfect Health Check Score</h4>
          <p className="text-[10px] text-[#D0D6BB]/60 max-w-sm mx-auto">No compliance issues, ownership coverage gaps, or dead ends detected.</p>
        </div>
      )}

      {!loading && !error && findings.length > 0 && (
        <div className="space-y-6">
          {/* Critical Section */}
          {criticalFindings.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-505 shrink-0" />
                Critical findings ({criticalFindings.length})
              </h4>
              <div className="space-y-3">
                {findings.map((f, idx) => f.level === 'critical' && !f.dismissed && (
                  <div key={idx} className="p-4 bg-red-950/5 border border-red-500/15 rounded-2xl space-y-3 text-xs">
                    <div className="flex justify-between items-start gap-2.5">
                      <div>
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-[8px] font-mono uppercase font-bold">{f.section}</span>
                        <strong className="block text-white text-[12px] mt-1.5">{f.problem}</strong>
                        <p className="text-[#D0D6BB]/75 mt-1 leading-relaxed text-[11px]">{f.reason}</p>
                      </div>
                      {f.applied ? (
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-mono uppercase flex items-center gap-0.5"><Check className="w-3 h-3" /> Applied</span>
                      ) : (
                        <div className="flex gap-1.5 shrink-0 select-none text-[9px] font-mono">
                          <button
                            onClick={() => handleDismiss(idx)}
                            className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors hover:bg-white/5 cursor-pointer uppercase font-bold"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => handleApply(idx, f)}
                            className="px-2.5 py-1.5 bg-red-900/35 hover:bg-red-800 border border-red-500/25 text-red-200 rounded-lg transition-colors cursor-pointer uppercase font-bold"
                          >
                            Apply Fix
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 bg-black/20 rounded-xl space-y-1">
                      <span className="text-[8px] font-mono text-stone-500 uppercase block font-bold">Proposed Fix</span>
                      <p className="text-white italic leading-relaxed text-[11px]">{f.proposedImprovement}</p>
                    </div>

                    {/* Feedback component */}
                    <div className="border-t border-white/5 pt-2 flex justify-between items-center text-[10px]">
                      <span className="text-stone-550">Was this audit finding helpful?</span>
                      <HelpfulnessFeedback
                        objectType="recommendation"
                        objectId={`finding_${idx}`}
                        interactionType="sop_review"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Section */}
          {recommendedFindings.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-505 shrink-0" />
                Recommended findings ({recommendedFindings.length})
              </h4>
              <div className="space-y-3">
                {findings.map((f, idx) => f.level === 'recommended' && !f.dismissed && (
                  <div key={idx} className="p-4 bg-amber-955/5 border border-amber-500/15 rounded-2xl space-y-3 text-xs">
                    <div className="flex justify-between items-start gap-2.5">
                      <div>
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[8px] font-mono uppercase font-bold">{f.section}</span>
                        <strong className="block text-white text-[12px] mt-1.5">{f.problem}</strong>
                        <p className="text-[#D0D6BB]/75 mt-1 leading-relaxed text-[11px]">{f.reason}</p>
                      </div>
                      {f.applied ? (
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-mono uppercase flex items-center gap-0.5"><Check className="w-3 h-3" /> Applied</span>
                      ) : (
                        <div className="flex gap-1.5 shrink-0 select-none text-[9px] font-mono">
                          <button
                            onClick={() => handleDismiss(idx)}
                            className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors hover:bg-white/5 cursor-pointer uppercase font-bold"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => handleApply(idx, f)}
                            className="px-2.5 py-1.5 bg-amber-900/35 hover:bg-amber-805 border border-amber-500/25 text-amber-200 rounded-lg transition-colors cursor-pointer uppercase font-bold"
                          >
                            Apply Fix
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 bg-black/20 rounded-xl space-y-1">
                      <span className="text-[8px] font-mono text-stone-500 uppercase block font-bold">Proposed Fix</span>
                      <p className="text-white italic leading-relaxed text-[11px]">{f.proposedImprovement}</p>
                    </div>

                    {/* Feedback component */}
                    <div className="border-t border-white/5 pt-2 flex justify-between items-center text-[10px]">
                      <span className="text-stone-550">Was this audit finding helpful?</span>
                      <HelpfulnessFeedback
                        objectType="recommendation"
                        objectId={`finding_${idx}`}
                        interactionType="sop_review"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Section */}
          {optionalFindings.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-blue-405 shrink-0" />
                Optional details ({optionalFindings.length})
              </h4>
              <div className="space-y-3">
                {findings.map((f, idx) => f.level === 'optional' && !f.dismissed && (
                  <div key={idx} className="p-4 bg-blue-955/5 border border-blue-500/15 rounded-2xl space-y-3 text-xs">
                    <div className="flex justify-between items-start gap-2.5">
                      <div>
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[8px] font-mono uppercase font-bold">{f.section}</span>
                        <strong className="block text-white text-[12px] mt-1.5">{f.problem}</strong>
                        <p className="text-[#D0D6BB]/75 mt-1 leading-relaxed text-[11px]">{f.reason}</p>
                      </div>
                      {f.applied ? (
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-mono uppercase flex items-center gap-0.5"><Check className="w-3 h-3" /> Applied</span>
                      ) : (
                        <div className="flex gap-1.5 shrink-0 select-none text-[9px] font-mono">
                          <button
                            onClick={() => handleDismiss(idx)}
                            className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors hover:bg-white/5 cursor-pointer uppercase font-bold"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => handleApply(idx, f)}
                            className="px-2.5 py-1.5 bg-blue-900/35 hover:bg-blue-805 border border-blue-500/25 text-blue-200 rounded-lg transition-colors cursor-pointer uppercase font-bold"
                          >
                            Apply Fix
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 bg-black/20 rounded-xl space-y-1">
                      <span className="text-[8px] font-mono text-stone-500 uppercase block font-bold">Proposed Fix</span>
                      <p className="text-white italic leading-relaxed text-[11px]">{f.proposedImprovement}</p>
                    </div>

                    {/* Feedback component */}
                    <div className="border-t border-white/5 pt-2 flex justify-between items-center text-[10px]">
                      <span className="text-stone-550">Was this audit finding helpful?</span>
                      <HelpfulnessFeedback
                        objectType="recommendation"
                        objectId={`finding_${idx}`}
                        interactionType="sop_review"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
