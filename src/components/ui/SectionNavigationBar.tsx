import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SectionNavigationBarProps {
  activeTab: string;
  onChangeTab: (tabId: string) => void;
  variant: 'admin' | 'client' | 'client-reduced';
}

const ADMIN_GROUPS = [
  {
    category: 'Understand',
    items: [
      { id: 'overview', label: 'Overview' },
      { id: 'org_chart', label: 'Org Chart' },
      { id: 'by_position', label: 'By Position' }
    ]
  },
  {
    category: 'Route',
    items: [
      { id: 'routing', label: 'Request Routing' },
      { id: 'workflow', label: 'Request Flow Studio' },
      { id: 'escalations', label: 'Escalation Paths' }
    ]
  },
  {
    category: 'Power',
    items: [
      { id: 'sops_knowledge', label: 'SOPs & Knowledge' },
      { id: 'connected_tools', label: 'Connected Tools' }
    ]
  }
];

const CLIENT_ITEMS = [
  { id: 'shield', label: 'Ryan Shield' },
  { id: 'roles', label: 'Role & Escalation Map' },
  { id: 'dispatch', label: 'Vendor Dispatch & Equipment' },
  { id: 'brief', label: 'Owner Weekly Brief' }
];

const CLIENT_REDUCED_ITEMS = [
  { id: 'org_chart', label: 'Org Chart' },
  { id: 'by_position', label: 'By Position' },
  { id: 'escalations', label: 'Escalation Paths' }
];

export default function SectionNavigationBar({ activeTab, onChangeTab, variant }: SectionNavigationBarProps) {
  if (variant === 'client' || variant === 'client-reduced') {
    const items = variant === 'client' ? CLIENT_ITEMS : CLIENT_REDUCED_ITEMS;
    return (
      <div className="w-full sticky top-0 z-25 bg-[rgba(255,255,255,0.85)] border-b border-[var(--border-soft)] backdrop-blur-md flex items-center h-[52px] select-none text-left print:hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 px-6 shrink-0 no-horizontal-scrollbar">
          {items.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeTab(item.id)}
                className={`px-4 py-1.5 rounded-lg text-[14px] font-medium transition-all cursor-pointer whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-[var(--accent)] ${
                  isActive
                    ? 'bg-[var(--accent)] text-white font-semibold shadow-sm'
                    : 'text-[var(--text-primary)] hover:bg-[var(--border-soft)]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full sticky top-0 z-25 bg-[rgba(255,255,255,0.85)] border-b border-[var(--border-soft)] backdrop-blur-md flex items-center h-[52px] select-none text-left print:hidden overflow-x-auto no-horizontal-scrollbar">
      <div className="flex items-center gap-5 py-2 px-6 shrink-0">
        {ADMIN_GROUPS.map((group, idx) => (
          <div key={group.category} className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider select-none pr-1">
              {group.category}
            </span>
            <div className="flex gap-1.5">
              {group.items.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChangeTab(item.id)}
                    className={`px-3 py-1 rounded-lg text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-[var(--accent)] ${
                      isActive
                        ? 'bg-[var(--accent)] text-white font-semibold shadow-sm'
                        : 'text-[var(--text-primary)] hover:bg-[var(--border-soft)]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            {idx < ADMIN_GROUPS.length - 1 && (
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)] mx-1 shrink-0 opacity-40" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
