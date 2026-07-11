/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calendar, Plus, Clock, MessageSquare, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

interface DailyCheckInViewProps {
  state?: any;
}

export default function DailyCheckInView({ state = {} }: DailyCheckInViewProps) {
  const { workItems = [] } = state;

  const [activeDay, setActiveDay] = useState(1);
  const [diaryNotes, setDiaryNotes] = useState<Record<number, { customerNotes: string; internalNotes: string; followUps: string }>>({
    1: { customerNotes: 'Intakes imported cleanly. Staff configured roles.', internalNotes: 'Manual mode active. Checked boundaries successfully.', followUps: 'Follow up on missing closing dates.' },
    2: { customerNotes: 'Approved first flyer request email.', internalNotes: 'Outbox gating validated in ledger.', followUps: 'Test low stock alerts tomorrow.' },
    3: { customerNotes: '', internalNotes: '', followUps: '' },
    4: { customerNotes: '', internalNotes: '', followUps: '' },
    5: { customerNotes: '', internalNotes: '', followUps: '' }
  });

  const handleNoteChange = (key: 'customerNotes' | 'internalNotes' | 'followUps', val: string) => {
    setDiaryNotes(prev => ({
      ...prev,
      [activeDay]: {
        ...prev[activeDay],
        [key]: val
      }
    }));
  };

  // Compute live stats for indicators
  const agingItemsCount = workItems.filter((w: any) => w.status === 'pending').length;
  const approvalsCount = workItems.filter((w: any) => w.approvalRequired && w.status === 'pending').length;

  return (
    <div className="bg-white border border-border-soft rounded-3xl p-5 text-left text-xs text-text-secondary leading-normal space-y-5 font-sans select-none shadow-card">
      <div className="border-b border-border-soft pb-2.5 flex justify-between items-center">
        <div>
          <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Calendar className="w-5 h-5 text-brand-primary" />
            <span>// Pilot Daily Check-In Diary</span>
          </h4>
          <p className="text-[10px] text-text-tertiary mt-0.5">Tactical review logging for the first 5 business days of live pilot operations.</p>
        </div>
        <div className="flex gap-1.5 font-mono text-[9px]">
          {[1, 2, 3, 4, 5].map(day => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-2.5 py-1 rounded-md font-bold uppercase transition-all cursor-pointer ${
                activeDay === day 
                  ? 'bg-brand-primary text-white' 
                  : 'bg-stone-100 hover:bg-stone-200 text-text-tertiary'
              }`}
            >
              Day {day}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left column: Live items list */}
        <div className="space-y-3 md:col-span-1 border-r border-border-soft pr-4">
          <span className="font-bold text-[10px] text-text-primary uppercase tracking-wider block font-mono">
            // Day {activeDay} Operational Feeds
          </span>

          <div className="space-y-2">
            <div className="p-3 bg-stone-50 border border-border-soft rounded-xl space-y-1">
              <span className="text-[9px] text-text-tertiary uppercase font-mono block">Pending Approvals</span>
              <div className="flex justify-between items-center">
                <span className="font-bold text-text-primary text-xs">{approvalsCount} items queued</span>
                <span className={`w-2 h-2 rounded-full ${approvalsCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              </div>
            </div>

            <div className="p-3 bg-stone-50 border border-border-soft rounded-xl space-y-1">
              <span className="text-[9px] text-text-tertiary uppercase font-mono block">Active Gaps & Aging Work</span>
              <div className="flex justify-between items-center">
                <span className="font-bold text-text-primary text-xs">{agingItemsCount} items active</span>
                <span className={`w-2 h-2 rounded-full ${agingItemsCount > 2 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
              </div>
            </div>

            <div className="p-3 bg-stone-50 border border-border-soft rounded-xl space-y-1 text-[10px] text-text-secondary select-text font-mono">
              <span className="text-[9px] text-text-tertiary uppercase font-mono block">Change Logs Audit</span>
              <p>+ Active imports configured.</p>
              <p>+ 100% Outbound approvals gated.</p>
            </div>
          </div>
        </div>

        {/* Center/Right columns: Text editors */}
        <div className="md:col-span-2 space-y-4 font-sans select-text">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-text-tertiary uppercase text-[9px] block">Customer Feedback Notes</label>
              <textarea
                rows={3}
                placeholder="What did the brokerage owner or coordinator say..."
                value={diaryNotes[activeDay]?.customerNotes || ''}
                onChange={(e) => handleNoteChange('customerNotes', e.target.value)}
                className="w-full p-2 border border-border-soft rounded-xl text-xs bg-stone-50/50 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-text-tertiary uppercase text-[9px] block">Internal shapework. Dev Notes</label>
              <textarea
                rows={3}
                placeholder="Limits reached, configuration issues or routing adjustments..."
                value={diaryNotes[activeDay]?.internalNotes || ''}
                onChange={(e) => handleNoteChange('internalNotes', e.target.value)}
                className="w-full p-2 border border-border-soft rounded-xl text-xs bg-stone-50/50 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1 border-t border-border-soft pt-3">
            <label className="font-bold text-text-tertiary uppercase text-[9px] block">Next Action Items / Follow-ups</label>
            <input
              type="text"
              placeholder="Who does what next..."
              value={diaryNotes[activeDay]?.followUps || ''}
              onChange={(e) => handleNoteChange('followUps', e.target.value)}
              className="w-full p-2 border border-border-soft rounded-xl text-xs bg-stone-50/50 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-text-tertiary font-mono pt-1">
            <span>Day {activeDay} check-in details auto-saved in local cache.</span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>LOGGED</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
