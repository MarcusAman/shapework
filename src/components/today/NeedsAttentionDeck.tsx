import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, Zap } from 'lucide-react';
import { useNeedsAttentionDeck, AttentionCardData, DeckTab } from '../../hooks/useNeedsAttentionDeck';
import AttentionCard from './AttentionCard';

interface NeedsAttentionDeckProps {
  state: any;
}

export default function NeedsAttentionDeck({ state }: NeedsAttentionDeckProps) {
  const {
    workItems = [],
    actionProposals = [],
    attentionStates = [],
    activeProfile,
    fetchState,
    setSelectedWorkItemId,
    workspaceId = 'nest-realty-demo'
  } = state;

  const userId = activeProfile?.id || 'usr_owner';

  const {
    cards,
    activeIndex,
    activeCard,
    setActiveIndex,
    totalCount,
    activeTab,
    setActiveTab,
    counts
  } = useNeedsAttentionDeck(workItems, actionProposals, attentionStates, userId);

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
  };

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // Headers helper
  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'x-workspace-id': workspaceId
    };
  };

  // Log presentation event when active card changes
  useEffect(() => {
    if (activeCard) {
      fetch('/api/attention-states/present', {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          workItemId: activeCard.id,
          userName: activeProfile?.name || 'Operations Lead',
          userRole: activeProfile?.role || 'operations_lead'
        })
      }).catch(console.error);
    }
  }, [activeCard?.id, activeProfile, workspaceId]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (totalCount === 0) return;
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Enter' && activeCard) {
        handleOpen(activeCard);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, totalCount, activeCard]);

  const handleNext = () => {
    if (totalCount > 1) {
      setActiveIndex((activeIndex + 1) % totalCount);
    }
  };

  const handlePrev = () => {
    if (totalCount > 1) {
      setActiveIndex((activeIndex - 1 + totalCount) % totalCount);
    }
  };

  const handleSnooze = async (card: AttentionCardData) => {
    try {
      const isOverdue = card.dueDate ? new Date(card.dueDate) < new Date() : false;
      const res = await fetch('/api/attention-states/snooze', {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          workItemId: card.id,
          priority: card.priority,
          isOverdue,
          userName: activeProfile?.name || 'Operations Lead',
          userRole: activeProfile?.role || 'operations_lead'
        })
      });
      if (res.ok) {
        let durationText = '1 hour';
        if (isOverdue) durationText = '15 minutes';
        else if (card.priority === 'owner_worthy') durationText = '30 minutes';
        else if (card.priority === 'high' || card.priority === 'critical') durationText = '1 hour';
        else if (card.priority === 'medium') durationText = '4 hours';
        else if (card.priority === 'low') durationText = 'tomorrow';

        showToast(`Snoozed: "${card.title}" will reappear in ${durationText}.`);
        await fetchState();
      }
    } catch (e) {
      showToast('Error snoozing attention card.');
    }
  };

  const handleOpen = (card: AttentionCardData) => {
    setSelectedWorkItemId(card.id);
    showToast(`Opened detail view for "${card.title}"`);
  };

  const handleAction = async (card: AttentionCardData) => {
    try {
      await fetch('/api/attention-states/action', {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          workItemId: card.id,
          actionType: 'resolve',
          userName: activeProfile?.name || 'Operations Lead',
          userRole: activeProfile?.role || 'operations_lead'
        })
      });

      if (card.sourceType === 'approval') {
        const approveRes = await fetch('/api/action/approve', {
          method: 'POST',
          headers: getHeaders(),
          credentials: 'include',
          body: JSON.stringify({
            actionId: card.id,
            userName: activeProfile?.name || 'Operations Lead',
            userRole: activeProfile?.role || 'operations_lead'
          })
        });
        if (approveRes.ok) {
          showToast(`Approved & Executed: "${card.title}"`);
        } else {
          showToast('Approval action failed.');
        }
      } else {
        const completeRes = await fetch(`/api/work-items/${card.id}/update-status`, {
          method: 'POST',
          headers: getHeaders(),
          credentials: 'include',
          body: JSON.stringify({
            status: 'completed',
            userName: activeProfile?.name || 'Operations Lead',
            userRole: activeProfile?.role || 'operations_lead'
          })
        });
        if (completeRes.ok) {
          showToast(`Marked complete: "${card.title}"`);
        } else {
          showToast('Failed to resolve work item.');
        }
      }

      await fetchState();
    } catch (e) {
      showToast('Error resolving card item.');
    }
  };

  const getEmptyStateText = (tab: DeckTab) => {
    switch (tab) {
      case 'all':
        return 'No operational workflow items.';
      case 'attention':
        return 'No critical items need urgent attention.';
      case 'due_soon':
        return 'No items due soon.';
      case 'blocked':
        return 'No blocked operations.';
      case 'approval':
        return 'No pending approvals.';
      case 'completed':
        return 'No recently completed items.';
    }
  };

  const getTabLabel = (tab: DeckTab) => {
    switch (tab) {
      case 'all': return 'All work';
      case 'attention': return 'Needs attention';
      case 'due_soon': return 'Due soon';
      case 'blocked': return 'Blocked';
      case 'approval': return 'Needs approval';
      case 'completed': return 'Completed';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Container */}
      {toast.visible && (
        <div 
          className="fixed top-6 right-6 z-[100] bg-stone-900 text-[#fffdf7] border border-stone-800 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300"
          role="alert"
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span className="text-xs font-bold font-mono">{toast.message}</span>
        </div>
      )}

      {/* Tabs navigation above the cards */}
      <div className="flex flex-wrap gap-2 border-b border-[#e4decb]/60 pb-2.5 select-none">
        {(['all', 'attention', 'due_soon', 'blocked', 'approval', 'completed'] as DeckTab[]).map((tab) => {
          const isActive = activeTab === tab;
          const count = counts[tab] ?? 0;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#18382b] ${
                isActive 
                  ? 'bg-[#18382b] text-[#fffdf7]' 
                  : 'bg-[#e4decb]/20 hover:bg-[#e4decb]/40 text-stone-700'
              }`}
            >
              <span>{getTabLabel(tab)}</span>
              <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-mono font-bold ${
                isActive 
                  ? 'bg-[#fffdf7]/25 text-[#fffdf7]' 
                  : 'bg-stone-200/80 text-stone-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Deck stats / headers */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5 text-left">
          <h3 className="font-serif font-bold text-sm text-[#1e2520]">{getTabLabel(activeTab)}</h3>
          <p className="text-[10px] text-stone-500">Swipe or use arrows on the card to cycle items.</p>
        </div>
        {totalCount > 0 && (
          <span className="text-[10px] font-mono text-stone-600 font-bold bg-[#e4decb]/30 px-2.5 py-1 rounded-full">
            {activeIndex + 1} of {totalCount}
          </span>
        )}
      </div>

      {/* Stack & Cards Area */}
      <div className="relative h-[400px] w-full max-w-xl mx-auto px-6 mt-8 md:mt-10">
        {totalCount === 0 ? (
          <div className="bg-[#fffdf7] border border-[#e4decb] rounded-[28px] p-10 text-center shadow-sm space-y-6">
            <div className="w-16 h-16 bg-[#eaf2ee] text-[#18382b] rounded-full flex items-center justify-center mx-auto shadow-sm border border-[#18382b]/5">
              <CheckCircle2 className="w-8 h-8 text-[#18382b]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-serif font-bold text-lg text-[#1e2520]">You’re clear for now.</h3>
              <p className="text-stone-500 text-xs max-w-sm mx-auto leading-relaxed font-medium">
                shapework will bring new work here when something needs action.
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setActiveTab('all')}
                className="px-4 py-2 border border-stone-200 hover:border-[#18382b] hover:bg-stone-50 text-[#18382b] rounded-xl transition-all text-xs font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#18382b]"
              >
                View all work
              </button>
              <button
                onClick={() => {
                  if (state.setCurrentTab) {
                    sessionStorage.setItem('shapework_active_subtab_Work Queue', 'owner_shield');
                    state.setCurrentTab('Work Queue');
                  }
                }}
                className="px-4 py-2 bg-[#18382b] hover:bg-[#1f4938] text-white rounded-xl transition-all text-xs font-bold cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[#18382b]"
              >
                Open Owner Brief
              </button>
            </div>
          </div>
        ) : (
          /* Render visual stack of cards - up to 4 stacked behind (5 total) */
          Array.from({ length: Math.min(5, totalCount) })
            .map((_, sliceIndex) => {
              const cardIndex = (activeIndex + sliceIndex) % totalCount;
              return { card: cards[cardIndex], sliceIndex };
            })
            .reverse()
            .map(({ card, sliceIndex }) => {
              const isFront = sliceIndex === 0;
              const displayIndex = ((activeIndex + sliceIndex) % totalCount) + 1;

              return (
                <div key={card.id} className="absolute inset-0">
                  <AttentionCard
                    card={card}
                    index={sliceIndex}
                    total={totalCount}
                    displayIndex={displayIndex}
                    isFront={isFront}
                    onSnooze={() => handleSnooze(card)}
                    onAction={() => handleAction(card)}
                    onOpen={() => handleOpen(card)}
                    onPrev={handlePrev}
                    onNext={handleNext}
                  />
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
