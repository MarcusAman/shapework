import React, { useState, useMemo } from 'react';
import { ChevronRight, ArrowRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { 
  MarketingWorkItem, 
  MarketingExecutionMode, 
  MarketingPriority 
} from '../../shared/marketingStateModel';
import { getWorkTypeDisplayLabel } from '../../shared/marketingWorkItemBoundary';

export interface MelissaTodayViewProps {
  workItems: MarketingWorkItem[];
  tasks?: any[];
  onOpenItem: (item: MarketingWorkItem) => void;
  onOpenPlanTomorrow: () => void;
  onOverrideRoute?: (item: MarketingWorkItem, newMode: MarketingExecutionMode, reason: string) => void;
  onApproveQuote?: (item: MarketingWorkItem) => void;
  onAddPrivateNote?: (item: MarketingWorkItem, noteText: string) => void;
}

export const MelissaTodayView: React.FC<MelissaTodayViewProps> = ({
  workItems,
  tasks,
  onOpenItem,
  onOpenPlanTomorrow,
  onOverrideRoute,
  onApproveQuote,
  onAddPrivateNote
}) => {
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [activeNoteItemId, setActiveNoteItemId] = useState<string | null>(null);
  const [noteInputText, setNoteInputText] = useState<string>('');

  const effectiveWorkItems = useMemo(() => {
    if (tasks !== undefined) {
      return (tasks || [])
        .filter((t: any) => !t.isArchived && t.status !== 'archived')
        .map((t: any) => ({
          id: t.id,
          taskId: t.id,
          requestId: t.requestId || t.id,
          campaignId: t.requestId || t.id,
          title: t.title || 'Marketing Deliverable',
          domain: 'marketing',
          workType: (t.title?.toLowerCase().includes('postcard') ? 'postcard' : t.title?.toLowerCase().includes('flyer') ? 'flyer' : 'digital_campaign') as any,
          priority: (t.priority || (t.dueAt?.toLowerCase().includes('today') ? 'urgent' : 'standard')) as MarketingPriority,
          status: (t.status === 'completed' || t.status === 'approved' ? 'complete' : t.status === 'agent_review' ? 'ready_for_review' : 'in_progress') as any,
          executionMode: (t.assignedTo === 'Eduardo Lovo' || t.assignedToRole?.includes('Virtual Assistant') ? 'assign_to_va' : 'direct_delivery') as MarketingExecutionMode,
          executorType: (t.assignedTo === 'Eduardo Lovo' || t.assignedToRole?.includes('Virtual Assistant') ? 'virtual_assistant' : 'staff') as any,
          requestedDueAt: t.dueAt || 'Today 5:00 PM',
          propertyAddress: t.propertyAddress || t.requestTitle || 'Wilmington Listing',
          agentName: t.agentName || 'Marcus Aman',
          createdAt: t.createdAt || new Date().toISOString()
        }));
    }
    return (workItems || []).filter((w: any) => !w.isArchived && w.status !== 'archived');
  }, [tasks, workItems]);

  // 1. STRICT MARKETING DOMAIN FILTERING
  // Excludes facilities, projector bulb flicker, office supply folders, general ops
  const marketingOnlyWorkItems = useMemo(() => {
    return effectiveWorkItems.filter((i: any) => {
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
  }, [effectiveWorkItems]);

  // Priority filter
  const filteredItems = useMemo(() => {
    return marketingOnlyWorkItems.filter(item => {
      if (filterPriority !== 'all' && item.priority !== filterPriority) return false;
      return true;
    });
  }, [marketingOnlyWorkItems, filterPriority]);

  const isDueToday = (dueStr?: string, priority?: string) => {
    if (priority === 'urgent') return true;
    if (!dueStr) return false;
    const lower = dueStr.toLowerCase();
    if (lower.includes('today') || lower.includes('due today')) return true;
    const d = new Date(dueStr);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  };

  // Derive Summary Counts from the filtered Marketing-only dataset
  const overdueItems = filteredItems.filter(i => i.status === 'blocked');
  const dueTodayItems = filteredItems.filter(i => isDueToday(i.requestedDueAt, i.priority) && i.status !== 'complete' && i.status !== 'physically_delivered' && !overdueItems.includes(i));
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
        className="bg-white border border-slate-200/80 hover:border-[#00635C]/50 rounded-2xl p-4 md:p-5 space-y-3.5 shadow-xs hover:shadow-sm transition-all text-left"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            {getPriorityBadge(item.priority)}
            <span className="text-xs font-mono font-bold text-[#00635C] uppercase tracking-wider">
              {getWorkTypeDisplayLabel((item as any).workType)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-sans text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-[#00635C]" />
            <span>Due: {item.requestedDueAt ? item.requestedDueAt.split('T')[0] : 'Today'}</span>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="font-bold text-base text-slate-900">
            {propertyLabel} — {item.title}
          </h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {item.nextAction || item.description || 'Draft ready for review.'}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-500 font-medium">
            <span>Owner: <strong className="text-slate-900 font-bold">HQ Operations</strong></span>
            <span>Executor: <strong className="text-[#00635C] font-bold">{isVaItem ? 'Eduardo (VA)' : 'Shapework AI'}</strong></span>
          </div>

          <button
            type="button"
            data-testid={`open-card-btn-${item.id}`}
            onClick={() => onOpenItem(item)}
            className="px-3.5 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>Open Review</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-w-0 space-y-5 text-left font-sans" data-testid="marketing-today-view">
      {/* 1. MARKETING TODAY TOP BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--sw-surface,#FFFFFF)] bg-white border border-slate-200/80 p-4 md:p-5 rounded-2xl shadow-xs">
        <div>
          <span className="text-[10px] font-bold text-[#00635C] uppercase tracking-widest">Marketing Operations Workspace</span>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">Today's Priority Marketing Queue</h1>
        </div>

        <button
          type="button"
          data-testid="plan-tomorrow-btn"
          onClick={onOpenPlanTomorrow}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs border border-slate-200 transition cursor-pointer flex items-center gap-2 shrink-0 shadow-2xs"
        >
          <span>📋 Daily Planning Notes</span>
        </button>
      </div>

      {/* 2. DERIVED SUMMARY METRICS BAR (STRICT MARKETING DATASET) */}
      <div 
        data-testid="marketing-summary-counts-bar"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-left"
      >
        <div className={`rounded-xl py-2.5 px-3 text-center flex flex-col justify-center items-center transition-all bg-white border border-slate-200/80 shadow-xs ${overdueCount > 0 ? 'border-rose-300' : ''}`}>
          <div className={`text-xl font-extrabold ${overdueCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>{overdueCount}</div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">Overdue / Blocked</div>
        </div>
        <div className={`rounded-xl py-2.5 px-3 text-center flex flex-col justify-center items-center transition-all bg-white border border-slate-200/80 shadow-xs ${dueTodayCount > 0 ? 'border-amber-300' : ''}`}>
          <div className={`text-xl font-extrabold ${dueTodayCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>{dueTodayCount}</div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">Due Today</div>
        </div>
        <div className={`rounded-xl py-2.5 px-3 text-center flex flex-col justify-center items-center transition-all bg-white border border-slate-200/80 shadow-xs ${waitingApprovalCount > 0 ? 'border-emerald-300' : ''}`}>
          <div className={`text-xl font-extrabold ${waitingApprovalCount > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>{waitingApprovalCount}</div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">Approval Needed</div>
        </div>
        <div className={`rounded-xl py-2.5 px-3 text-center flex flex-col justify-center items-center transition-all bg-white border border-slate-200/80 shadow-xs ${quotePendingCount > 0 ? 'border-amber-300' : ''}`}>
          <div className={`text-xl font-extrabold ${quotePendingCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>{quotePendingCount}</div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">Quote Pending</div>
        </div>
        <div className={`rounded-xl py-2.5 px-3 text-center flex flex-col justify-center items-center transition-all bg-white border border-slate-200/80 shadow-xs ${readyToSendCount > 0 ? 'border-cyan-300' : ''}`}>
          <div className={`text-xl font-extrabold ${readyToSendCount > 0 ? 'text-cyan-600' : 'text-slate-700'}`}>{readyToSendCount}</div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">Ready to Send</div>
        </div>
        <div className={`rounded-xl py-2.5 px-3 text-center flex flex-col justify-center items-center transition-all bg-white border border-slate-200/80 shadow-xs ${assignedVaCount > 0 ? 'border-purple-300' : ''}`}>
          <div className={`text-xl font-extrabold ${assignedVaCount > 0 ? 'text-purple-600' : 'text-slate-700'}`}>{assignedVaCount}</div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">Assigned to VA</div>
        </div>
      </div>

      {/* 3. PRIORITY FILTERS & COUNT */}
      <div 
        data-testid="marketing-priority-filters"
        className="flex w-full min-w-0 flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3 text-left"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1">Priority:</span>
          {['all', 'urgent', 'high', 'standard', 'low'].map(p => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-3 py-1 text-xs font-semibold rounded-xl capitalize transition-all cursor-pointer ${
                filterPriority === p 
                  ? 'bg-slate-900 text-white shadow-xs font-bold' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {p === 'all' ? 'All' : p}
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-slate-400 font-medium shrink-0" data-testid="today-active-work-count">
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

        {/* Clean Zero-State: Queue is Clear */}
        {filteredItems.length === 0 && (
          <div className="py-16 px-6 text-center bg-stone-50/60 rounded-2xl border border-stone-200/80 flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E5EFEA] text-[#00635C] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-900">Today's Queue is Clear</h3>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                No active tasks or deliverables are currently scheduled for today. New requests, AI voice intakes, and field tasks will automatically populate here in real time.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
