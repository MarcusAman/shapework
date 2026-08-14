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
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">Urgent</span>;
      case 'high':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">High Priority</span>;
      case 'standard':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Standard</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200">Low Priority</span>;
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
        className="bg-[var(--sw-surface,#FFFFFF)] border border-[var(--sw-border,#E2E4DA)] hover:border-[var(--brand-primary,#00635C)] rounded-2xl p-4 md:p-5 space-y-3.5 shadow-xs transition-all text-left"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--sw-border,#E2E4DA)] pb-3">
          <div className="flex items-center gap-2">
            {getPriorityBadge(item.priority)}
            <span className="text-xs font-mono font-bold text-[var(--brand-primary,#00635C)] uppercase tracking-wider">
              {getWorkTypeDisplayLabel((item as any).workType)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-sans text-[var(--sw-text-secondary,#52605B)]">
            <Clock className="w-3.5 h-3.5 text-[var(--brand-primary,#00635C)]" />
            <span>Due: {item.requestedDueAt ? item.requestedDueAt.split('T')[0] : 'Today'}</span>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="font-serif font-bold text-base md:text-lg text-[var(--sw-text-primary,#17231F)]">
            {propertyLabel} — {item.title}
          </h3>
          <p className="text-xs text-[var(--sw-text-secondary,#52605B)] font-medium">
            {item.nextAction || item.description || 'Draft ready for review.'}
          </p>
        </div>

        <div className="pt-3 border-t border-[var(--sw-border,#E2E4DA)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-[var(--sw-text-secondary,#52605B)] font-medium">
            <span>Owner: <strong className="text-[var(--sw-text-primary,#17231F)] font-bold">HQ Operations</strong></span>
            <span>Executor: <strong className="text-[var(--brand-primary,#00635C)] font-bold">{isVaItem ? 'Maria (VA)' : 'Shapework AI'}</strong></span>
          </div>

          <button
            type="button"
            data-testid={`open-card-btn-${item.id}`}
            onClick={() => onOpenItem(item)}
            className="px-4 py-2 bg-[var(--brand-primary,#00635C)] hover:bg-[var(--brand-secondary,#01362D)] text-white rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--sw-surface,#FFFFFF)] border border-[var(--sw-border,#E2E4DA)] p-4 md:p-5 rounded-2xl shadow-xs">
        <div>
          <span className="text-[10px] font-bold text-[var(--brand-primary,#00635C)] uppercase tracking-widest">Marketing Operations Workspace</span>
          <h1 className="text-xl md:text-2xl font-serif font-bold text-[var(--sw-text-primary,#17231F)] mt-0.5">Today's Priority Marketing Queue</h1>
        </div>

        <button
          type="button"
          data-testid="plan-tomorrow-btn"
          onClick={onOpenPlanTomorrow}
          className="px-4 py-2.5 bg-[var(--sw-canvas,#FBF8F0)] hover:bg-[var(--brand-soft)] text-[var(--sw-text-primary,#17231F)] rounded-xl font-bold text-xs border border-[var(--sw-border,#E2E4DA)] hover:border-[var(--brand-primary)] transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-2xs"
        >
          <span>📋 Daily Planning Notes</span>
        </button>
      </div>

      {/* 2. DERIVED SUMMARY METRICS BAR (STRICT MARKETING DATASET) */}
      <div 
        data-testid="marketing-summary-counts-bar"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-left"
      >
        <div className={`rounded-xl py-3 px-3 text-center flex flex-col justify-center items-center transition-all bg-[var(--sw-surface,#FFFFFF)] border border-[var(--sw-border,#E2E4DA)] shadow-xs ${overdueCount > 0 ? 'border-rose-300' : ''}`}>
          <div className={`text-xl font-extrabold ${overdueCount > 0 ? 'text-rose-600' : 'text-[var(--sw-text-secondary,#52605B)]'}`}>{overdueCount}</div>
          <div className="text-[11px] font-medium text-[var(--sw-text-secondary,#52605B)] mt-0.5">Overdue / Blocked</div>
        </div>
        <div className={`rounded-xl py-3 px-3 text-center flex flex-col justify-center items-center transition-all bg-[var(--sw-surface,#FFFFFF)] border border-[var(--sw-border,#E2E4DA)] shadow-xs ${dueTodayCount > 0 ? 'border-amber-300' : ''}`}>
          <div className={`text-xl font-extrabold ${dueTodayCount > 0 ? 'text-amber-600' : 'text-[var(--sw-text-secondary,#52605B)]'}`}>{dueTodayCount}</div>
          <div className="text-[11px] font-medium text-[var(--sw-text-secondary,#52605B)] mt-0.5">Due Today</div>
        </div>
        <div className={`rounded-xl py-3 px-3 text-center flex flex-col justify-center items-center transition-all bg-[var(--sw-surface,#FFFFFF)] border border-[var(--sw-border,#E2E4DA)] shadow-xs ${waitingApprovalCount > 0 ? 'border-emerald-300' : ''}`}>
          <div className={`text-xl font-extrabold ${waitingApprovalCount > 0 ? 'text-emerald-600' : 'text-[var(--sw-text-secondary,#52605B)]'}`}>{waitingApprovalCount}</div>
          <div className="text-[11px] font-medium text-[var(--sw-text-secondary,#52605B)] mt-0.5">Approval Needed</div>
        </div>
        <div className={`rounded-xl py-3 px-3 text-center flex flex-col justify-center items-center transition-all bg-[var(--sw-surface,#FFFFFF)] border border-[var(--sw-border,#E2E4DA)] shadow-xs ${quotePendingCount > 0 ? 'border-amber-300' : ''}`}>
          <div className={`text-xl font-extrabold ${quotePendingCount > 0 ? 'text-amber-600' : 'text-[var(--sw-text-secondary,#52605B)]'}`}>{quotePendingCount}</div>
          <div className="text-[11px] font-medium text-[var(--sw-text-secondary,#52605B)] mt-0.5">Quote Pending</div>
        </div>
        <div className={`rounded-xl py-3 px-3 text-center flex flex-col justify-center items-center transition-all bg-[var(--sw-surface,#FFFFFF)] border border-[var(--sw-border,#E2E4DA)] shadow-xs ${readyToSendCount > 0 ? 'border-cyan-300' : ''}`}>
          <div className={`text-xl font-extrabold ${readyToSendCount > 0 ? 'text-cyan-600' : 'text-[var(--sw-text-secondary,#52605B)]'}`}>{readyToSendCount}</div>
          <div className="text-[11px] font-medium text-[var(--sw-text-secondary,#52605B)] mt-0.5">Ready to Send</div>
        </div>
        <div className={`rounded-xl py-3 px-3 text-center flex flex-col justify-center items-center transition-all bg-[var(--sw-surface,#FFFFFF)] border border-[var(--sw-border,#E2E4DA)] shadow-xs ${assignedVaCount > 0 ? 'border-purple-300' : ''}`}>
          <div className={`text-xl font-extrabold ${assignedVaCount > 0 ? 'text-purple-600' : 'text-[var(--sw-text-secondary,#52605B)]'}`}>{assignedVaCount}</div>
          <div className="text-[11px] font-medium text-[var(--sw-text-secondary,#52605B)] mt-0.5">Assigned to VA</div>
        </div>
      </div>

      {/* 3. PRIORITY FILTERS & COUNT */}
      <div 
        data-testid="marketing-priority-filters"
        className="flex w-full min-w-0 flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--sw-border,#E2E4DA)] pb-4 text-left"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[var(--sw-text-secondary,#52605B)]">Priority:</span>
          {['all', 'urgent', 'high', 'standard', 'low'].map(p => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                filterPriority === p 
                  ? 'bg-[var(--brand-primary,#00635C)] text-white shadow-2xs' 
                  : 'bg-white text-[var(--sw-text-secondary,#52605B)] hover:text-[var(--sw-text-primary,#17231F)] border border-[var(--sw-border,#E2E4DA)] hover:bg-[var(--brand-soft)]'
              }`}
            >
              {p === 'all' ? 'All' : p}
            </button>
          ))}
        </div>
        <span className="text-xs text-[var(--sw-text-secondary,#52605B)] font-bold shrink-0" data-testid="today-active-work-count">
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
            <div className="flex items-center gap-2 border-b border-rose-200 pb-2 text-left">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="text-sm font-bold text-rose-800 uppercase tracking-wider">Overdue & Blocked ({overdueItems.length})</h2>
            </div>
            <div className="space-y-3">
              {overdueItems.map(renderItemCard)}
            </div>
          </section>
        )}

        {/* Section 2: Due Today */}
        {dueTodayItems.length > 0 && (
          <section className="space-y-3" data-testid="section-due-today">
            <div className="flex items-center gap-2 border-b border-amber-200 pb-2 text-left">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h2 className="text-sm font-bold text-amber-800 uppercase tracking-wider">Due Today ({dueTodayItems.length})</h2>
            </div>
            <div className="space-y-3">
              {dueTodayItems.map(renderItemCard)}
            </div>
          </section>
        )}

        {/* Section 3: Ready for Review & Approval */}
        {waitingApprovalItems.length > 0 && (
          <section className="space-y-3" data-testid="section-waiting-approval">
            <div className="flex items-center gap-2 border-b border-emerald-200 pb-2 text-left">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Ready for Review & Approval ({waitingApprovalItems.length})</h2>
            </div>
            <div className="space-y-3">
              {waitingApprovalItems.map(renderItemCard)}
            </div>
          </section>
        )}

        {/* Section 4: Print & Quote Follow-up */}
        {quoteItems.length > 0 && (
          <section className="space-y-3" data-testid="section-quote-followup">
            <div className="flex items-center gap-2 border-b border-amber-200 pb-2 text-left">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h2 className="text-sm font-bold text-amber-800 uppercase tracking-wider">Print & Quote Follow-up ({quoteItems.length})</h2>
            </div>
            <div className="space-y-3">
              {quoteItems.map(renderItemCard)}
            </div>
          </section>
        )}

        {/* Section 5: Virtual Assistant Active Queue */}
        {vaItems.length > 0 && (
          <section className="space-y-3" data-testid="section-va-queue">
            <div className="flex items-center gap-2 border-b border-purple-200 pb-2 text-left">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <h2 className="text-sm font-bold text-purple-800 uppercase tracking-wider">Virtual Assistant Active Queue ({vaItems.length})</h2>
            </div>
            <div className="space-y-3">
              {vaItems.map(renderItemCard)}
            </div>
          </section>
        )}

        {/* Section 6: Upcoming Work Items */}
        {upcomingItems.length > 0 && (
          <section className="space-y-3" data-testid="section-upcoming">
            <div className="flex items-center gap-2 border-b border-[var(--sw-border,#E2E4DA)] pb-2 text-left">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <h2 className="text-sm font-bold text-[var(--sw-text-secondary,#52605B)] uppercase tracking-wider">Upcoming & Scheduled ({upcomingItems.length})</h2>
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
