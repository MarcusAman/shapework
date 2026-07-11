/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, ShieldAlert, Inbox, CheckCircle2, UserCheck, AlertTriangle, FileText } from 'lucide-react';
import InboxList from './InboxList';
import InboxDetail from './InboxDetail';
import { Communication } from '../../types/shapework';

interface OperationsInboxProps {
  communications: Communication[];
  selectedInboxId: string;
  setSelectedInboxId: (id: string) => void;
  onApproveAction: (id: string) => void;
  onDismissAction: (id: string) => void;
}

export default function OperationsInbox({
  communications,
  selectedInboxId,
  setSelectedInboxId,
  onApproveAction,
  onDismissAction
}: OperationsInboxProps) {
  const [activeInboxTab, setActiveInboxTab] = useState('All');

  const commList = communications || [];

  const sidebarCategories = [
    { name: 'All', icon: Inbox, count: commList.length },
    { name: 'Needs Attention', icon: AlertTriangle, count: commList.filter(c => c && c.urgency === 'high' && c.status !== 'completed').length },
    { name: 'Awaiting Approval', icon: ShieldAlert, count: commList.filter(c => c && c.action_proposal_id && c.status !== 'completed').length },
    { name: 'Waiting on Agent', icon: UserCheck, count: commList.filter(c => c && c.related_agent !== '' && c.status !== 'completed').length },
    { name: 'Documents Received', icon: FileText, count: commList.filter(c => c && c.type === 'document' && c.status !== 'completed').length },
    { name: 'Completed', icon: CheckCircle2, count: commList.filter(c => c && c.status === 'completed').length },
  ];

  const selectedItem = commList.find(c => c && c.id === selectedInboxId) || null;

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl shadow-sm overflow-hidden h-[600px] flex">
      {/* 1. Left Sub-pane: Filter Categories */}
      <div className="w-56 border-r border-border-subtle bg-secondary-surface flex flex-col p-3 space-y-1 shrink-0">
        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider px-3 mb-2 block">
          Inbox View Filters
        </span>
        {sidebarCategories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeInboxTab === cat.name;

          return (
            <button
              key={cat.name}
              onClick={() => setActiveInboxTab(cat.name)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'text-text-secondary hover:bg-brand-green-soft hover:text-text-primary'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{cat.name}</span>
              {cat.count > 0 && (
                <span className={`ml-auto px-1.5 py-0.2 text-[9px] rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                }`}>
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Middle Pane: Card lists of messages */}
      <div className="w-80 border-r border-border-subtle flex flex-col shrink-0">
        <div className="p-3 border-b border-border-subtle bg-secondary-surface text-xs font-bold text-text-primary">
          Incoming Signal Queue
        </div>
        <InboxList
          items={communications}
          selectedId={selectedInboxId}
          onSelectItem={setSelectedInboxId}
          activeSidebarTab={activeInboxTab}
        />
      </div>

      {/* 3. Right Pane: Detailed analysis and actions */}
      <InboxDetail
        item={selectedItem}
        onApproveAction={onApproveAction}
        onDismissAction={onDismissAction}
      />
    </div>
  );
}
