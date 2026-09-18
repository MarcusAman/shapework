/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, DollarSign, Wrench, CheckSquare } from 'lucide-react';
import { OperatingOpportunity } from '../../types/operatingRecord';

interface OpportunityDetailDrawerProps {
  opportunity: OperatingOpportunity | null;
  onClose: () => void;
  onSave: (updated: OperatingOpportunity) => void;
  onPromoteToSprint?: (oppId: string) => void;
  onPromoteToRoleMap?: (oppId: string) => void;
}

export default function OpportunityDetailDrawer({
  opportunity,
  onClose,
  onSave,
  onPromoteToSprint,
  onPromoteToRoleMap
}: OpportunityDetailDrawerProps) {
  const [form, setForm] = useState<Partial<OperatingOpportunity>>({});

  useEffect(() => {
    if (opportunity) {
      setForm({ ...opportunity });
    }
  }, [opportunity]);

  if (!opportunity) return null;

  const handleScoreChange = (field: string, val: number) => {
    const nextForm = { ...form, [field]: val };
    const friction = nextForm.frictionScore || 0;
    const dependency = nextForm.dependencyScore || 0;
    const waste = nextForm.wasteScore || 0;
    const visibility = nextForm.visibilityScore || 0;
    const readiness = nextForm.readinessScore || 0;
    const impact = nextForm.impactScore || 0;

    nextForm.totalScore = Math.round(((friction + dependency + waste + visibility + readiness + impact) / 60) * 100);
    setForm(nextForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form as OperatingOpportunity);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-surface border-l border-border-soft shadow-2xl z-[100] flex flex-col font-sans text-xs text-text-secondary select-none">
      <div className="p-5 border-b border-border-soft flex items-center justify-between bg-stone-50 select-none">
        <div>
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider font-mono">Opportunity Diagnostics</span>
          <h2 className="text-sm font-bold text-text-primary mt-0.5">{form.title || 'Edit Opportunity'}</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-stone-200 rounded-lg cursor-pointer transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
        {/* Quick Win / Build Sprint Promo actions */}
        <div className="flex flex-wrap gap-2 pb-4 border-b border-border-soft">
          {onPromoteToSprint && form.status !== 'planned' && form.status !== 'in_progress' && (
            <button
              type="button"
              onClick={() => onPromoteToSprint(form.id!)}
              className="px-3 py-1.5 bg-brand-primary text-white hover:bg-brand-secondary rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Promote to Build Sprint
            </button>
          )}
          {onPromoteToRoleMap && (
            <button
              type="button"
              onClick={() => onPromoteToRoleMap(form.id!)}
              className="px-3 py-1.5 bg-white border border-border-medium hover:bg-stone-50 text-text-primary rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Assign Role Owner
            </button>
          )}
        </div>

        {/* Basic Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-bold text-text-primary">Opportunity Title</label>
            <input
              type="text"
              value={form.title || ''}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-2 border border-border-soft rounded-lg bg-white text-text-primary"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-text-primary">Category</label>
            <select
              value={form.category || 'ownership'}
              onChange={(e) => setForm({ ...form, category: e.target.value as any })}
              className="w-full p-2 border border-border-soft rounded-lg bg-white"
            >
              <option value="ownership">Roles & Ownership</option>
              <option value="marketing">Agent Marketing</option>
              <option value="transaction">Transaction Management</option>
              <option value="compliance">Document Compliance</option>
              <option value="finance">Finance / Cash-Flow</option>
              <option value="office_operations">Office Operations</option>
              <option value="agent_experience">Agent Experience</option>
              <option value="customer_experience">Customer Experience</option>
              <option value="integration">System Integrations</option>
              <option value="reporting">Management Reporting</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-bold text-text-primary">Severity</label>
            <select
              value={form.severity || 'medium'}
              onChange={(e) => setForm({ ...form, severity: e.target.value as any })}
              className="w-full p-2 border border-border-soft rounded-lg bg-white"
            >
              <option value="low">Low Severity</option>
              <option value="medium">Medium Severity</option>
              <option value="high">High Severity</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-bold text-text-primary">Status</label>
            <select
              value={form.status || 'identified'}
              onChange={(e) => setForm({ ...form, status: e.target.value as any })}
              className="w-full p-2 border border-border-soft rounded-lg bg-white"
            >
              <option value="identified">Identified</option>
              <option value="accepted">Accepted</option>
              <option value="planned">Planned (In Build Sprint)</option>
              <option value="in_progress">In Progress</option>
              <option value="implemented">Implemented</option>
              <option value="deferred">Deferred</option>
            </select>
          </div>
        </div>

        {/* Narrative Description fields */}
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <label className="font-bold text-text-primary block">What is Happening? (Problem Detail)</label>
            <textarea
              rows={3}
              value={form.whatIsHappening || ''}
              onChange={(e) => setForm({ ...form, whatIsHappening: e.target.value })}
              className="w-full p-2 border border-border-soft rounded-lg bg-white text-text-primary resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-text-primary block">Hidden Operating Cost (Friction Impact)</label>
            <textarea
              rows={2}
              value={form.hiddenCost || ''}
              onChange={(e) => setForm({ ...form, hiddenCost: e.target.value })}
              className="w-full p-2 border border-border-soft rounded-lg bg-white text-text-primary resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-text-primary block">Recommended Fix</label>
            <textarea
              rows={2}
              value={form.recommendedFix || ''}
              onChange={(e) => setForm({ ...form, recommendedFix: e.target.value })}
              className="w-full p-2 border border-border-soft rounded-lg bg-white text-text-primary resize-none"
            />
          </div>
        </div>

        {/* Est Savings */}
        <div className="grid grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-border-soft">
          <div className="space-y-1">
            <label className="font-bold text-text-primary flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-text-tertiary" />
              Est. Saved Hours / Wk
            </label>
            <input
              type="number"
              value={form.estimatedHoursPerWeek || ''}
              onChange={(e) => setForm({ ...form, estimatedHoursPerWeek: Number(e.target.value) })}
              className="w-full p-2 border border-border-soft rounded-lg bg-white text-text-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-text-primary flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-text-tertiary" />
              Est. Annualized Waste Cost ($)
            </label>
            <input
              type="number"
              value={form.estimatedAnnualCost || ''}
              onChange={(e) => setForm({ ...form, estimatedAnnualCost: Number(e.target.value) })}
              className="w-full p-2 border border-border-soft rounded-lg bg-white text-text-primary"
            />
          </div>
        </div>

        {/* Scores & Weights */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-text-primary uppercase tracking-wider text-[10px] font-mono border-b border-border-soft pb-1">
            // Diagnostics Severity Weighting
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {[
              { id: 'frictionScore', label: 'Operational Friction' },
              { id: 'dependencyScore', label: 'Manual Dependency' },
              { id: 'wasteScore', label: 'Time Waste / Latency' },
              { id: 'visibilityScore', label: 'Owner Blind Spot' },
              { id: 'readinessScore', label: 'Client Readiness' },
              { id: 'impactScore', label: 'Operating Capacity Impact' }
            ].map((score) => (
              <div key={score.id} className="space-y-1">
                <div className="flex justify-between font-bold text-text-secondary select-none">
                  <span>{score.label}</span>
                  <span className="text-brand-primary">{(form as any)[score.id] || 0} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={(form as any)[score.id] || 0}
                  onChange={(e) => handleScoreChange(score.id, Number(e.target.value))}
                  className="w-full accent-brand-primary"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center bg-brand-soft/20 border border-brand-primary/10 p-3.5 rounded-xl mt-4">
            <span className="font-bold text-brand-primary">Calculated Pain Score Index</span>
            <div className="text-right">
              <span className="text-lg font-black text-brand-primary font-mono">{form.totalScore || 0}%</span>
              <span className="block text-[9px] text-text-tertiary">Weighted across 6 parameters</span>
            </div>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="grid grid-cols-2 gap-4 pt-2 select-none">
          <label className="flex items-center gap-2 border border-border-soft p-3 rounded-xl hover:bg-stone-50 cursor-pointer font-bold text-text-primary">
            <input
              type="checkbox"
              checked={!!form.quickWinCandidate}
              onChange={(e) => setForm({ ...form, quickWinCandidate: e.target.checked })}
              className="rounded border-border-medium text-brand-primary focus:ring-brand-primary"
            />
            <div>
              <span>Quick Win Candidate</span>
              <span className="block text-[9px] font-normal text-text-tertiary">Implementable under 4 hours</span>
            </div>
          </label>

          <label className="flex items-center gap-2 border border-border-soft p-3 rounded-xl hover:bg-stone-50 cursor-pointer font-bold text-text-primary">
            <input
              type="checkbox"
              checked={!!form.buildSprintCandidate}
              onChange={(e) => setForm({ ...form, buildSprintCandidate: e.target.checked })}
              className="rounded border-border-medium text-brand-primary focus:ring-brand-primary"
            />
            <div>
              <span>Build Sprint Candidate</span>
              <span className="block text-[9px] font-normal text-text-tertiary">Requires template customization</span>
            </div>
          </label>
        </div>
      </form>

      <div className="p-5 border-t border-border-soft flex justify-between gap-3 bg-stone-50">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-border-medium bg-white hover:bg-stone-50 text-text-primary rounded-lg font-bold cursor-pointer transition-all shrink-0"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-5 py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-lg font-bold shadow-sm cursor-pointer transition-all flex-1"
        >
          Save Diagnostics Changes
        </button>
      </div>
    </div>
  );
}
