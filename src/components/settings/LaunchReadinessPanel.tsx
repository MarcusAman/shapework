/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Play, 
  ArrowRight 
} from 'lucide-react';
import { LaunchReadinessCheck } from '../../types/launch';

interface LaunchReadinessPanelProps {
  report: {
    checks: LaunchReadinessCheck[];
    readinessPercentage: number;
    blockingFailuresCount: number;
    warningsCount: number;
    goLiveEligible: boolean;
    recommendedNextAction: string;
  };
  onFixClick?: (tab: string) => void;
  onRefresh?: () => void;
}

export default function LaunchReadinessPanel({ 
  report, 
  onFixClick,
  onRefresh 
}: LaunchReadinessPanelProps) {
  if (!report) {
    return <div className="text-xs text-text-tertiary">Evaluating diagnostics...</div>;
  }
  const { checks, readinessPercentage, blockingFailuresCount, warningsCount, recommendedNextAction } = report;

  return (
    <div className="space-y-6 font-sans text-xs text-text-secondary leading-normal text-left">
      
      {/* Overview Block */}
      <div className="grid grid-cols-3 gap-4">
        {/* Score Card */}
        <div className="border border-border-soft rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider block">Launch Readiness Score</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-serif font-bold text-text-primary">{readinessPercentage}%</span>
            <span className="text-text-tertiary">ready</span>
          </div>
          <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mt-3">
            <div 
              className="bg-brand-primary h-full transition-all duration-500" 
              style={{ width: `${readinessPercentage}%` }} 
            />
          </div>
        </div>

        {/* Blockers Card */}
        <div className="border border-border-soft rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider block">Required Launch Blockers</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`text-3xl font-serif font-bold ${blockingFailuresCount > 0 ? 'text-red-650 font-serif' : 'text-text-primary'}`}>{blockingFailuresCount}</span>
            <span className="text-text-tertiary">failing checks</span>
          </div>
          <span className="text-[10px] text-text-tertiary mt-3 block">
            {blockingFailuresCount === 0 ? '✓ Ready to authorize go-live' : 'All blockers must pass before launch'}
          </span>
        </div>

        {/* Action Recommendation Card */}
        <div className="border border-border-soft rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider block">Next Recommendation Action</span>
          <p className="mt-2 text-text-primary font-bold leading-snug">
            {recommendedNextAction}
          </p>
          <span className="text-[10px] text-brand-primary font-bold flex items-center gap-0.5 mt-3 select-none">
            <span>Action guided below</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Checklist list */}
      <div className="border border-border-soft rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="p-4 border-b border-border-soft bg-stone-50 flex items-center justify-between select-none">
          <span className="font-serif font-bold text-text-primary text-sm">Launch Compliance Verifications</span>
          <button 
            onClick={onRefresh}
            className="px-2.5 py-1 text-[11px] font-bold border border-border-soft bg-white hover:bg-stone-50 rounded-lg text-text-primary transition-all cursor-pointer flex items-center gap-1"
          >
            <span>Run Diagnostic checks</span>
          </button>
        </div>

        <div className="divide-y divide-border-soft">
          {checks.map(check => {
            const hasFix = !!check.fixLink;
            return (
              <div key={check.id} className="p-4 flex items-start justify-between hover:bg-stone-50/40 transition-all">
                <div className="space-y-1 pr-6">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      check.status === 'pass' ? 'bg-emerald-500' :
                      check.status === 'fail' ? 'bg-red-500' : 'bg-amber-500'
                    }`} />
                    <span className="font-bold text-text-primary font-sans">{check.label}</span>
                    {check.requiredForLaunch && (
                      <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                        Launch Blocker
                      </span>
                    )}
                  </div>
                  {check.status !== 'pass' && check.blockingReason && (
                    <p className="text-red-650 font-medium text-[11px] mt-0.5">{check.blockingReason}</p>
                  )}
                  {check.evidence && (check.evidence as any).waived && (
                    <div className="mt-1 bg-amber-50 border border-amber-250 text-amber-900 rounded-xl p-2.5 text-[10px]">
                      <span className="font-bold">⚠️ Block Waived:</span> {(check.evidence as any).waivedReason}
                    </div>
                  )}
                  {check.status === 'pass' && check.evidence && !(check.evidence as any).waived && (
                    <div className="text-[10px] text-text-tertiary font-mono bg-stone-50 border border-stone-200/50 p-2 rounded-xl mt-1.5">
                      <span className="font-sans font-bold text-text-secondary block mb-0.5 select-none">Diagnostic Evidence:</span>
                      {JSON.stringify(check.evidence, null, 2)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {check.status === 'fail' && !['ws_profile', 'roles_configured', 'security_vault'].includes(check.id) && (
                    <WaiverForm checkId={check.id} onWaiverSubmitted={onRefresh} />
                  )}

                  {hasFix && check.status !== 'pass' && (
                    <button
                      onClick={() => {
                        if (onFixClick && check.fixLink) {
                          const tab = check.fixLink.split('tab=')[1] || 'wizard';
                          onFixClick(tab);
                        }
                      }}
                      className="px-3 py-1.5 border border-border-soft hover:border-border-medium rounded-lg text-xs font-bold text-text-primary bg-white hover:bg-stone-100 transition-all cursor-pointer shrink-0 flex items-center gap-1 select-none"
                    >
                      <span>Configure</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WaiverForm({ checkId, onWaiverSubmitted }: { checkId: string; onWaiverSubmitted?: () => void }) {
  const [showForm, setShowForm] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/launch/waiver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readinessCheckId: checkId, reason })
      });
      if (res.ok) {
        setShowForm(false);
        setReason('');
        if (onWaiverSubmitted) onWaiverSubmitted();
      } else {
        const err = await res.json();
        alert(`Failed to apply waiver: ${err.message || err.error}`);
      }
    } catch (err: any) {
      alert(`Waiver submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="px-2.5 py-1.5 border border-amber-250 hover:bg-amber-50 rounded-lg text-xs font-bold text-amber-800 transition-all cursor-pointer select-none"
      >
        Waive Blocker
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-stone-50 border border-border-soft rounded-xl p-3 flex flex-col gap-2 max-w-xs select-none">
      <span className="font-bold text-text-primary">Apply Launch Waiver</span>
      <input
        type="text"
        placeholder="Reason for waiving blocker..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="border border-border-soft rounded-lg px-2.5 py-1.5 bg-white text-xs text-text-primary focus:outline-none"
        required
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="px-2 py-1 text-text-tertiary font-bold hover:text-text-secondary cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-3 py-1 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? 'Waiving...' : 'Submit'}
        </button>
      </div>
    </form>
  );
}
