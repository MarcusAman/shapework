/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, Circle, HelpCircle, Save } from 'lucide-react';

interface RunbookStep {
  id: string;
  category: 'before_launch' | 'launch_day' | 'first_48_hours';
  title: string;
  owner: string;
  dueDate: string;
  blocking: boolean;
  notes?: string;
  completed: boolean;
  evidence?: string;
}

export default function CustomerCutoverRunbook() {
  const [steps, setSteps] = useState<RunbookStep[]>([]);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const defaultSteps: RunbookStep[] = [
      // Before Launch
      { id: 'b1', category: 'before_launch', title: 'Confirm workspace profile', owner: 'Onboarding Lead', dueDate: 'T-5 Days', blocking: true, completed: true, evidence: 'Wizard profile complete' },
      { id: 'b2', category: 'before_launch', title: 'Confirm users and roles', owner: 'Onboarding Lead', dueDate: 'T-5 Days', blocking: true, completed: true, evidence: 'Ann & Diane mapped' },
      { id: 'b3', category: 'before_launch', title: 'Confirm routing rules', owner: 'Operations Lead', dueDate: 'T-4 Days', blocking: false, completed: true, evidence: '24h SLA target active' },
      { id: 'b4', category: 'before_launch', title: 'Confirm approval policy', owner: 'Operations Lead', dueDate: 'T-4 Days', blocking: true, completed: true, evidence: 'Outbound writeback locked' },
      { id: 'b5', category: 'before_launch', title: 'Confirm compliance checklist', owner: 'Operations Lead', dueDate: 'T-3 Days', blocking: true, completed: false },
      { id: 'b6', category: 'before_launch', title: 'Connect Rechat or mark skipped with reason', owner: 'Admin', dueDate: 'T-3 Days', blocking: true, completed: false },
      { id: 'b7', category: 'before_launch', title: 'Configure Dotloop/API Nation or mark skipped with reason', owner: 'Admin', dueDate: 'T-3 Days', blocking: true, completed: false },
      { id: 'b8', category: 'before_launch', title: 'Import agent roster', owner: 'Operations Lead', dueDate: 'T-2 Days', blocking: false, completed: false },
      { id: 'b9', category: 'before_launch', title: 'Import/sync active deals', owner: 'Operations Lead', dueDate: 'T-2 Days', blocking: false, completed: false },
      { id: 'b10', category: 'before_launch', title: 'Review unmatched records', owner: 'Operations Lead', dueDate: 'T-1 Day', blocking: false, completed: false },
      { id: 'b11', category: 'before_launch', title: 'Review Work Queue', owner: 'Operations Lead', dueDate: 'T-1 Day', blocking: false, completed: false },
      { id: 'b12', category: 'before_launch', title: 'Send launch summary to internal team', owner: 'Onboarding Lead', dueDate: 'T-1 Day', blocking: false, completed: false },
      
      // Launch Day
      { id: 'l1', category: 'launch_day', title: 'Confirm system health', owner: 'Admin', dueDate: 'Launch Day', blocking: true, completed: false },
      { id: 'l2', category: 'launch_day', title: 'Confirm credential vault', owner: 'Admin', dueDate: 'Launch Day', blocking: true, completed: false },
      { id: 'l3', category: 'launch_day', title: 'Confirm latest sync', owner: 'Admin', dueDate: 'Launch Day', blocking: false, completed: false },
      { id: 'l4', category: 'launch_day', title: 'Confirm webhook receiver', owner: 'Admin', dueDate: 'Launch Day', blocking: true, completed: false },
      { id: 'l5', category: 'launch_day', title: 'Confirm Work Queue owner', owner: 'Operations Lead', dueDate: 'Launch Day', blocking: false, completed: false },
      { id: 'l6', category: 'launch_day', title: 'Confirm Approval Center owner', owner: 'Operations Lead', dueDate: 'Launch Day', blocking: false, completed: false },
      { id: 'l7', category: 'launch_day', title: 'Mark workspace live', owner: 'Onboarding Lead', dueDate: 'Launch Day', blocking: true, completed: false },
      { id: 'l8', category: 'launch_day', title: 'Watch first live events', owner: 'Operations Lead', dueDate: 'Launch Day', blocking: false, completed: false },
      { id: 'l9', category: 'launch_day', title: 'Verify first audit entry after launch', owner: 'Admin', dueDate: 'Launch Day', blocking: false, completed: false },
      { id: 'l10', category: 'launch_day', title: 'Record go-live note', owner: 'Onboarding Lead', dueDate: 'Launch Day', blocking: false, completed: false },
      
      // First 48 Hours
      { id: 'f1', category: 'first_48_hours', title: 'Review failed jobs', owner: 'Admin', dueDate: 'Post Launch', blocking: false, completed: false },
      { id: 'f2', category: 'first_48_hours', title: 'Review unmatched records', owner: 'Operations Lead', dueDate: 'Post Launch', blocking: false, completed: false },
      { id: 'f3', category: 'first_48_hours', title: 'Review owner escalations', owner: 'Operations Lead', dueDate: 'Post Launch', blocking: false, completed: false },
      { id: 'f4', category: 'first_48_hours', title: 'Review compliance risks', owner: 'Operations Lead', dueDate: 'Post Launch', blocking: false, completed: false },
      { id: 'f5', category: 'first_48_hours', title: 'Review integration errors', owner: 'Admin', dueDate: 'Post Launch', blocking: false, completed: false },
      { id: 'f6', category: 'first_48_hours', title: 'Confirm brokerage team usage', owner: 'Operations Lead', dueDate: 'Post Launch', blocking: false, completed: false },
      { id: 'f7', category: 'first_48_hours', title: 'Send internal launch summary', owner: 'Onboarding Lead', dueDate: 'Post Launch', blocking: false, completed: false }
    ];

    const cached = sessionStorage.getItem('shapework_runbook_steps');
    if (cached) {
      setSteps(JSON.parse(cached));
    } else {
      setSteps(defaultSteps);
      sessionStorage.setItem('shapework_runbook_steps', JSON.stringify(defaultSteps));
    }
  }, []);

  const saveSteps = (updated: RunbookStep[]) => {
    setSteps(updated);
    sessionStorage.setItem('shapework_runbook_steps', JSON.stringify(updated));
  };

  const toggleStep = (id: string) => {
    const updated = steps.map(s => {
      if (s.id === id) {
        const completed = !s.completed;
        return {
          ...s,
          completed,
          evidence: completed ? `Confirmed by operator at ${new Date().toLocaleTimeString()}` : undefined
        };
      }
      return s;
    });
    saveSteps(updated);
  };

  const handleNotesChange = (id: string, val: string) => {
    setEditingNotes(prev => ({ ...prev, [id]: val }));
  };

  const saveNotes = (id: string) => {
    const updated = steps.map(s => {
      if (s.id === id) {
        return { ...s, notes: editingNotes[id] };
      }
      return s;
    });
    saveSteps(updated);
  };

  const renderCategoryTable = (cat: 'before_launch' | 'launch_day' | 'first_48_hours', title: string) => {
    const filtered = steps.filter(s => s.category === cat);
    return (
      <div className="border border-border-soft rounded-2xl bg-white shadow-sm overflow-hidden select-none">
        <div className="p-4 bg-stone-50 border-b border-border-soft flex items-center justify-between">
          <span className="font-serif font-bold text-text-primary text-sm">{title}</span>
          <span className="text-[10px] text-text-tertiary">
            {filtered.filter(s => s.completed).length} / {filtered.length} Complete
          </span>
        </div>
        <div className="divide-y divide-border-soft text-[11px]">
          {filtered.map(s => (
            <div key={s.id} className="p-4 hover:bg-stone-50/40 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1.5 max-w-lg">
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleStep(s.id)} className="cursor-pointer text-text-secondary hover:text-brand-primary">
                    {s.completed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                    ) : (
                      <Circle className="w-4 h-4 text-text-tertiary" />
                    )}
                  </button>
                  <span className={`font-bold font-sans ${s.completed ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
                    {s.title}
                  </span>
                  {s.blocking && (
                    <span className="text-[8px] font-mono font-bold uppercase px-1 py-0.2 bg-red-100 text-red-700 border border-red-200 rounded">
                      Go-Live Blocker
                    </span>
                  )}
                </div>
                {s.evidence && (
                  <div className="text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-150 p-1.5 rounded-lg">
                    {s.evidence}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add operational notes..."
                    value={editingNotes[s.id] !== undefined ? editingNotes[s.id] : s.notes || ''}
                    onChange={(e) => handleNotesChange(s.id, e.target.value)}
                    className="border border-border-soft rounded-lg px-2 py-1 bg-white text-[10px] text-text-primary focus:outline-none w-64"
                  />
                  <button onClick={() => saveNotes(s.id)} className="p-1 hover:bg-stone-100 rounded text-brand-primary cursor-pointer">
                    <Save className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col text-right text-[10px] text-text-tertiary shrink-0">
                <span>**Owner**: {s.owner}</span>
                <span>**Timeline**: {s.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-border-soft rounded-3xl p-5 shadow-sm flex items-center gap-3 select-none">
        <ClipboardList className="w-5 h-5 text-brand-primary" />
        <div>
          <h3 className="font-serif font-bold text-text-primary text-sm">Customer Go-Live Cutover Runbook</h3>
          <p className="text-[11px] text-text-tertiary">
            Systematic cutover blueprint tracking before launch milestones, deployment verification, and first 48 hours health checks.
          </p>
        </div>
      </div>

      {renderCategoryTable('before_launch', 'Phase A — Before Launch Checklist (T-5 to T-1 Days)')}
      {renderCategoryTable('launch_day', 'Phase B — Launch Day Cutover Steps')}
      {renderCategoryTable('first_48_hours', 'Phase C — First 48 Hours Post-Launch Verification')}
    </div>
  );
}
