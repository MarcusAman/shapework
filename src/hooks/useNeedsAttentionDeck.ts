import { useState, useMemo } from 'react';

export type DeckTab = 'all' | 'attention' | 'due_soon' | 'blocked' | 'approval' | 'completed';

export interface AttentionCardData {
  id: string;
  sourceType: 'work_item' | 'approval';
  title: string;
  summary: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical' | 'owner_worthy';
  dueDate?: string;
  assignedTo: string;
  recommendedNextAction: string;
  originalRecord: any;
}

const isOverdue = (dateStr?: string) => {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  return due < today;
};

const isDueToday = (dateStr?: string) => {
  if (!dateStr) return false;
  const today = new Date().toDateString();
  const due = new Date(dateStr).toDateString();
  return due === today;
};

const getSortScore = (card: AttentionCardData) => {
  let score = 0;
  if (card.priority === 'owner_worthy') score += 1000;
  if (isOverdue(card.dueDate)) score += 500;
  if (card.sourceType === 'approval' || card.originalRecord.approvalRequired) score += 250;
  if (card.originalRecord.status === 'blocked') score += 100;
  if (isDueToday(card.dueDate)) score += 50;
  if (card.priority === 'high' || card.priority === 'critical') score += 20;
  if (card.originalRecord.createdAt) {
    const timeScore = new Date(card.originalRecord.createdAt).getTime() / 1e12;
    score += timeScore;
  }
  return score;
};

export function useNeedsAttentionDeck(
  workItems: any[] = [],
  actionProposals: any[] = [],
  attentionStates: any[] = [],
  userId: string = 'usr_owner'
) {
  const [activeTab, setActiveTab] = useState<DeckTab>('attention');
  const [activeIndex, setActiveIndex] = useState(0);

  const { cards, counts } = useMemo(() => {
    const lists: Record<DeckTab, AttentionCardData[]> = {
      all: [],
      attention: [],
      due_soon: [],
      blocked: [],
      approval: [],
      completed: []
    };

    // Map Work Items
    workItems.forEach((w) => {
      const cardData: AttentionCardData = {
        id: w.id,
        sourceType: 'work_item',
        title: w.title,
        summary: w.summary || w.description || 'Action required to resolve this item.',
        type: w.type || 'task',
        priority: w.priority || 'medium',
        dueDate: w.dueDate,
        assignedTo: w.assignedOwnerName || 'Brokerage Operations',
        recommendedNextAction: w.recommendedNextAction || 'Review and update status.',
        originalRecord: w
      };

      // Completed Tab
      if (w.status === 'completed' || w.status === 'resolved') {
        lists.completed.push(cardData);
        return;
      }

      // Exclude inactive for active categories
      if (w.status === 'archived' || w.status === 'inactive') {
        return;
      }

      // Check snooze
      const stateId = `${userId}_${w.id}`;
      const state = attentionStates.find((s) => s.id === stateId);
      const isSnoozedActive = state && state.status === 'snoozed' && state.snoozedUntil && new Date(state.snoozedUntil) > new Date();

      if (isSnoozedActive) return;

      // Add to All Items
      lists.all.push(cardData);

      // Needs Attention
      const isHighOrAbove = w.priority === 'high' || w.priority === 'critical' || w.priority === 'owner_worthy';
      const isItemOverdue = isOverdue(w.dueDate);
      const isItemDueToday = isDueToday(w.dueDate);
      const isBlocked = w.status === 'blocked';
      const needsApproval = w.approvalRequired === true;

      if (isHighOrAbove || isItemOverdue || isItemDueToday || isBlocked || needsApproval) {
        lists.attention.push(cardData);
      }

      // Due Soon
      if (w.dueDate) {
        lists.due_soon.push(cardData);
      }

      // Blocked Items
      if (w.status === 'blocked') {
        lists.blocked.push(cardData);
      }

      // Needs Approval
      if (w.approvalRequired === true || w.status === 'needs_approval') {
        lists.approval.push(cardData);
      }
    });

    // Map Action Proposals / Approvals
    actionProposals.forEach((p) => {
      const cardData: AttentionCardData = {
        id: p.id,
        sourceType: 'approval',
        title: p.title || 'AI Action Proposal Pending',
        summary: p.draft_content || p.description || 'Verify and approve this AI agent recommendation.',
        type: p.action_type || 'approval',
        priority: p.priority || 'high',
        dueDate: p.dueDate || p.created_at,
        assignedTo: p.assigneeName || 'Broker Owner',
        recommendedNextAction: p.recommendedNextAction || 'Review details and sign-off.',
        originalRecord: p
      };

      // Completed Tab
      if (p.state === 'approved' || p.state === 'completed' || p.state === 'executing' || p.state === 'executed') {
        lists.completed.push(cardData);
        return;
      }

      if (p.state === 'rejected' || p.state === 'dismissed') {
        return;
      }

      // Check snooze
      const stateId = `${userId}_${p.id}`;
      const state = attentionStates.find((s) => s.id === stateId);
      const isSnoozedActive = state && state.status === 'snoozed' && state.snoozedUntil && new Date(state.snoozedUntil) > new Date();

      if (isSnoozedActive) return;

      // Add to All Items
      lists.all.push(cardData);

      // Add to Needs Attention (approvals are always attention items)
      lists.attention.push(cardData);

      // Due Soon
      if (p.dueDate || p.created_at) {
        lists.due_soon.push(cardData);
      }

      // Needs Approval
      lists.approval.push(cardData);
    });

    // Sort categories
    const sortedCompleted = lists.completed.sort((a, b) => {
      const dateA = new Date(a.originalRecord.updatedAt || a.originalRecord.createdAt || 0).getTime();
      const dateB = new Date(b.originalRecord.updatedAt || b.originalRecord.createdAt || 0).getTime();
      return dateB - dateA;
    }).slice(0, 10);

    const sortedDueSoon = lists.due_soon.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    const sortStandard = (arr: AttentionCardData[]) => arr.sort((a, b) => getSortScore(b) - getSortScore(a));

    const finalLists: Record<DeckTab, AttentionCardData[]> = {
      all: sortStandard(lists.all),
      attention: sortStandard(lists.attention),
      due_soon: sortedDueSoon,
      blocked: sortStandard(lists.blocked),
      approval: sortStandard(lists.approval),
      completed: sortedCompleted
    };

    const finalCounts: Record<DeckTab, number> = {
      all: lists.all.length,
      attention: lists.attention.length,
      due_soon: lists.due_soon.length,
      blocked: lists.blocked.length,
      approval: lists.approval.length,
      completed: lists.completed.length
    };

    return {
      cards: finalLists[activeTab],
      counts: finalCounts
    };
  }, [workItems, actionProposals, attentionStates, activeTab, userId]);

  // Adjust active index if count shrinks
  const safeActiveIndex = Math.max(0, Math.min(activeIndex, Math.max(0, cards.length - 1)));

  // Wrap active index reset on tab change
  const handleTabChange = (tab: DeckTab) => {
    setActiveTab(tab);
    setActiveIndex(0);
  };

  return {
    cards,
    activeIndex: safeActiveIndex,
    activeCard: cards[safeActiveIndex] || null,
    setActiveIndex,
    totalCount: cards.length,
    activeTab,
    setActiveTab: handleTabChange,
    counts
  };
}
