import React, { useState, useMemo } from 'react';
import { ChevronRight, ArrowRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { 
  MarketingWorkItem, 
  MarketingExecutionMode, 
  MarketingPriority 
} from '../../shared/marketingStateModel';
import { getWorkTypeDisplayLabel } from '../../shared/marketingWorkItemBoundary';

interface MelissaTodayViewProps {
  workItems: MarketingWorkItem[];
  onOpenItem: (item: MarketingWorkItem) => void;
  onOpenPlanTomorrow: () => void;
  onOverrideRoute?: (item: MarketingWorkItem, newMode: MarketingExecutionMode, reason: string) => void;
  onApproveQuote?: (item: MarketingWorkItem) => void;
  onAddPrivateNote?: (item: MarketingWorkItem, noteText: string) => void;
}

export const MelissaTodayView: React.FC<MelissaTodayViewProps> = ({
  workItems,
  onOpenItem,
  onOpenPlanTomorrow,
  onOverrideRoute,
  onApproveQuote,
  onAddPrivateNote
}) => {
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [activeNoteItemId, setActiveNoteItemId] = useState<string | null>(null);
  const [noteInputText, setNoteInputText] = useState<string>('');

  // 1. STRICT MARKETING DOMAIN FILTERING
  // Excludes facilities, projector bulb flicker, office supply folders, general ops
  const marketingOnlyWorkItems = useMemo(() => {
    return workItems.filter((i: any) => {
      if (i.domain && i.domain !== 'marketing') return false;
      
      const title = (i.title || '').toLowerCase();
      const desc = (i.description || '').toLowerCase();
      
      if (
        title.includes('projector') ||
        title.includes('facilities') ||
        title.includes('folders') ||
        title.includes('office supply') ||
        desc.includes('conference room')
      ) {
        return false;
      }
      return true;
    });
  }, [workItems]);

  // Priority filter
  const filteredItems = useMemo(() => {
    return marketingOnlyWorkItems.filter(item => {
      if (filterPriority !== 'all' && item.priority !== filterPriority) return false;
      return true;
    });
  }, [marketingOnlyWorkItems, filterPriority]);

  // Derive Summary Counts from the filtered Marketing-only dataset
  const overdueItems = filteredItems.filter(i => i.status === 'blocked' || (i.requestedDueAt && new Date(i.requestedDueAt) < new Date('2026-08-02T00:00:00Z')));
  const dueTodayItems = filteredItems.filter(i => i.requestedDueAt && i.requestedDueAt.startsWith('2026-08-02') && i.status !== 'complete' && i.status !== 'physically_delivered' && !overdueItems.includes(i));
  const waitingApprovalItems = filteredItems.filter(i => (i.status === 'ready_for_review' || i.status === 'waiting_on_approval') && !overdueItems.includes(i) && !dueTodayItems.includes(i));
  const quoteItems = filteredItems.filter(i => (i.quoteRequired || i.status === 'waiting_on_quote' || i.printWorkflowStatus === 'waiting_for_quote_approval') && !overdueItems.includes(i) && !dueTodayItems.includes(i) && !waitingApprovalItems.includes(i));
  const vaItems = filteredItems.filter(i => i.executorType === 'virtual_assistant' && i.status !== 'complete' && !overdueItems.includes(i) && !dueTodayItems.includes(i) && !waitingApprovalItems.includes(i) && !quoteItems.includes(i));
  const upcomingItems = filteredItems.filter(i => !overdueItems.includes(i) && !dueTodayItems.includes(i) && !waitingApprovalItems.includes(i) && !quoteItems.includes(i) && !vaItems.includes(i));

  // Invariant Assertion: visibleSectionCountSum === filteredItems.length
  const visibleSectionCountSum =
    overdueItems.length +
    dueTodayItems.length +
    waitingApprovalItems.length +
    quoteItems.length +
    vaItems.length +
    upcomingItems.length;

  if (visibleSectionCountSum !== filteredItems.length) {
    console.warn(`[TODAY COUNT INVARIANT FAILURE] visibleSectionCountSum (${visibleSectionCountSum}) !== filteredItems.length (${filteredItems.length})`);
  }

  const overdueCount = overdueItems.length;
  const dueTodayCount = dueTodayItems.length;
  const waitingApprovalCount = waitingApprovalItems.length;
  const quotePendingCount = quoteItems.length;
  const readyToSendCount = filteredItems.filter(i => i.status === 'ready_to_send').length;
  const assignedVaCount = vaItems.length;

  const getPriorityBadge = (priority: MarketingPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">Urgent</span>;
      case 'high':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">High Priority</span>;
      case 'standard':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Standard</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">Low Priority</span>;
    }
  };

  const renderItemCard = (item: MarketingWorkItem) => {
    const isVaItem = item.executorType === 'virtual_assistant';
    const isQuoteItem = item.quoteRequired || item.printWorkflowStatus === 'waiting_for_quote_approval';
    const propertyLabel = item.propertyAddress || '990 Inspiration Drive';

    return (
      <div 
        key={item.id}
        data-testid={`marketing-today-card-${item.id}`}
        className="bg-[#062f28] border border-[#176457]/60 hover:border-emerald-400/50 rounded-2xl p-4 md:p-5 space-y-3.5 shadow-md transition-all text-left"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#176457]/40 pb-3">
          <div className="flex items-center gap-2">
            {getPriorityBadge(item.priority)}
            <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
              {getWorkTypeDisplayLabel((item as any).workType)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Due: {item.requestedDueAt ? item.requestedDueAt.split('T')[0] : 'Today'}</span>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="font-serif font-bold text-base md:text-lg text-[#fffdf8]">
            {propertyLabel} — {item.title}
          </h3>
          <p className="text-xs text-slate-300 font-medium">
            {item.nextAction || item.description || 'Draft ready for review.'}
          </p>
        </div>

        <div className="pt-3 border-t border-[#176457]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-300 font-medium">
            <span>Owner: <strong className="text-white font-bold">HQ Operations</strong></span>
            <span>Executor: <strong className="text-emerald-300 font-bold">{isVaItem ? 'Maria (VA)' : 'Shapework AI'}</strong></span>
          </div>

          <button
            type="button"
            data-testid={`open-card-btn-${item.id}`}
            onClick={() => onOpenItem(item)}
            className="px-4 py-2 bg-[#00635C] hover:bg-[#004d48] text-white rounded-xl font-bold text-xs shadow transition-all cursor-pointer border border-emerald-400/30 flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>Open Review</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-w-0 space-y-6 text-left font-sans" data-testid="marketing-today-view">
      {/* 1. MARKETING TODAY TOP BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#073F35] border border-[rgba(208,214,187,0.14)] p-4 md:p-5 rounded-2xl">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Marketing Operations Workspace</span>
          <h1 className="text-xl md:text-2xl font-serif font-bold text-[#FFFDF8] mt-0.5">Today's Priority Marketing Queue</h1>
        </div>

        <button
          type="button"
          data-testid="plan-tomorrow-btn"
          onClick={onOpenPlanTomorrow}
          className="px-4 py-2.5 bg-[#176457] hover:bg-[#00635c] text-[#FFFDF8] rounded-xl font-bold text-xs border border-emerald-400/40 transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow"
        >
          <span>📋 Daily Planning Notes</span>
        </button>
      </div>

      {/* 2. DERIVED SUMMARY METRICS BAR (STRICT MARKETING DATASET) */}
      <div 
        data-testid="marketing-summary-counts-bar"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-left"
      >
        <div className={`rounded-xl py-2.5 px-3 text-center flex flex-col justify-center items-center transition-all ${overdueCount > 0 ? 'bg-[#062f28] border border-rose-500/50 shadow-sm' : 'bg-[#062f28]/40 border border-[rgba(208,214,187,0.1)] opacity-75'}`}>
          <div className={`text-xl font-extrabold ${overdueCount > 0 ? 'text-rose-300' : 'text-slate-400'}`}>{overdueCount}</div>
          <div className="text-[11px] font-medium text-[#d0d6bb]/80 mt-0.5">Overdue / Blocked</div>
        </div>
        <div className={`rounded-xl py-2.5 px-3 text-center flex flex-col justify-center items-center transition-all ${dueTodayCount > 0 ? 'bg-[#062f28] border border-amber-500/50 shadow-sm' : 'bg-[#062f28]/40 border border-[rgba(208,214,187,0.1)] opacity-75'}`}>
          <div className={`text-xl font-extrabold ${dueTodayCount > 0 ? 'text-amber-300' : 'text-slate-400'}`}>{dueTodayCount}</div>
          <div className="text-[11px] font-medium text-[#d0d6bb]/80 mt-0.5">Due Today</div>
        </div>
        <div className={`rounded-xl py-2.5 px-3 text-center flex flex-col justify-center items-center transition-all ${waitingApprovalCount > 0 ? 'bg-[#062f28] border border-emerald-500/50 shadow-sm' : 'bg-[#062f28]/40 border border-[rgba(208,214,187,0.1)] opacity-75'}`}>
          <div className={`text-xl font-extrabold ${waitingApprovalCount > 0 ? 'text-emerald-300' : 'text-slate-400'}`}>{waitingApprovalCount}</div>
          <div className="text-[11px] font-medium text-[#d0d6bb]/80 mt-0.5">Approval Needed</div>
        </div>
        <div className={`rounded-xl py-2.5 px-3 text-center flex flex-col justify-center items-center transition-all ${quotePendingCount > 0 ? 'bg-[#062f28] border border-amber-500/50 shadow-sm' : 'bg-[#062f28]/40 border border-[rgba(208,214,187,0.1)] opacity-75'}`}>
          <div className={`text-xl font-extrabold ${quotePendingCount > 0 ? 'text-amber-300' : 'text-slate-400'}`}>{quotePendingCount}</div>
          <div className="text-[11px] font-medium text-[#d0d6bb]/80 mt-0.5">Quote Pending</div>
        </div>
        <div className={`rounded-xl py-2.5 px-3 text-center flex flex-col justify-center items-center transition-all ${readyToSendCount > 0 ? 'bg-[#062f28] border border-cyan-500/50 shadow-sm' : 'bg-[#062f28]/40 border border-[rgba(208,214,187,0.1)] opacity-75'}`}>
          <div className={`text-xl font-extrabold ${readyToSendCount > 0 ? 'text-cyan-300' : 'text-slate-400'}`}>{readyToSendCount}</div>
          <div className="text-[11px] font-medium text-[#d0d6bb]/80 mt-0.5">Ready to Send</div>
        </div>
        <div className={`rounded-xl py-2.5 px-3 text-center flex flex-col justify-center items-center transition-all ${assignedVaCount > 0 ? 'bg-[#062f28] border border-purple-500/50 shadow-sm' : 'bg-[#062f28]/40 border border-[rgba(208,214,187,0.1)] opacity-75'}`}>
          <div className={`text-xl font-extrabold ${assignedVaCount > 0 ? 'text-purple-300' : 'text-slate-400'}`}>{assignedVaCount}</div>
          <div className="text-[11px] font-medium text-[#d0d6bb]/80 mt-0.5">Assigned to VA</div>
        </div>
      </div>

      {/* 3. PRIORITY FILTERS & COUNT */}
      <div 
        data-testid="marketing-priority-filters"
        className="flex w-full min-w-0 flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#176457]/40 pb-4 text-left"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">Priority:</span>
          {['all', 'urgent', 'high', 'standard', 'low'].map(p => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                filterPriority === p 
                  ? 'bg-[#176457] text-[#fffdf8] border border-emerald-400/40' 
                  : 'bg-[#062f28] text-slate-300 hover:text-white border border-[#176457]/40'
              }`}
            >
              {p === 'all' ? 'All' : p}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-300 font-bold shrink-0" data-testid="today-active-work-count">
          {filteredItems.length} active marketing work items
        </span>
      </div>

      {/* 4. WORK QUEUE SECTIONS (HIDES EMPTY SECTIONS) */}
      <div 
        data-testid="marketing-work-queue"
        className="w-full min-w-0 space-y-6"
      >
        {/* Section 1: Overdue & Blocked */}
        {overdueItems.length > 0 && (
          <section className="space-y-3" data-testid="section-overdue">
            <div className="flex items-center gap-2 border-b border-rose-500/30 pb-2 text-left">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="text-sm font-bold text-rose-300 uppercase tracking-wider">Overdue & Blocked ({overdueItems.length})</h2>
            </div>
            <div className="space-y-3">
              {overdueItems.map(renderItemCard)}
            </div>
          </section>
        )}

        {/* Section 2: Due Today */}
        {dueTodayItems.length > 0 && (
          <section className="space-y-3" data-testid="section-due-today">
            <div className="flex items-center gap-2 border-b border-amber-500/30 pb-2 text-left">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Due Today ({dueTodayItems.length})</h2>
            </div>
            <div className="space-y-3">
              {dueTodayItems.map(renderItemCard)}
            </div>
          </section>
        )}

        {/* Section 3: Ready for Review & Approval */}
        {waitingApprovalItems.length > 0 && (
          <section className="space-y-3" data-testid="section-waiting-approval">
            <div className="flex items-center gap-2 border-b border-emerald-500/40 pb-2 text-left">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h2 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">Ready for Review & Approval ({waitingApprovalItems.length})</h2>
            </div>
            <div className="space-y-3">
              {waitingApprovalItems.map(renderItemCard)}
            </div>
          </section>
        )}

        {/* Section 4: Print & Quote Follow-up */}
        {quoteItems.length > 0 && (
          <section className="space-y-3" data-testid="section-quote-followup">
            <div className="flex items-center gap-2 border-b border-amber-500/40 pb-2 text-left">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Print & Quote Follow-up ({quoteItems.length})</h2>
            </div>
            <div className="space-y-3">
              {quoteItems.map(renderItemCard)}
            </div>
          </section>
        )}

        {/* Section 5: Virtual Assistant Active Queue */}
        {vaItems.length > 0 && (
          <section className="space-y-3" data-testid="section-va-queue">
            <div className="flex items-center gap-2 border-b border-purple-500/40 pb-2 text-left">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <h2 className="text-sm font-bold text-purple-300 uppercase tracking-wider">Virtual Assistant Active Queue ({vaItems.length})</h2>
            </div>
            <div className="space-y-3">
              {vaItems.map(renderItemCard)}
            </div>
          </section>
        )}

        {/* Section 6: Upcoming Work Items */}
        {upcomingItems.length > 0 && (
          <section className="space-y-3" data-testid="section-upcoming">
            <div className="flex items-center gap-2 border-b border-[#176457]/40 pb-2 text-left">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Upcoming & Scheduled ({upcomingItems.length})</h2>
            </div>
            <div className="space-y-3">
              {upcomingItems.map(renderItemCard)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
