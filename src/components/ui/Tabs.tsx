/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical Tabs Primitive — Phase B1 Foundation
 * Quiet, light tab navigation list with keyboard navigation support.
 */

import React, { useRef } from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'soft';
  className?: string;
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className = ''
}: TabsProps) {
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const enabledTabs = tabs.filter(t => !t.disabled);
    const currentIndex = enabledTabs.findIndex(t => t.id === tabs[index].id);
    let nextIndex = currentIndex;

    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % enabledTabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = enabledTabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const nextTab = enabledTabs[nextIndex];
    if (nextTab) {
      onChange(nextTab.id);
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      const targetIndex = tabs.findIndex(t => t.id === nextTab.id);
      buttons?.[targetIndex]?.focus();
    }
  };

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-orientation="horizontal"
      className={`flex items-center gap-1 select-none border-b border-[var(--sw-border)] ${className}`}
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.id === activeTab;
        const isDisabled = !!tab.disabled;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={isDisabled}
            tabIndex={isActive ? 0 : -1}
            onClick={() => !isDisabled && onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold transition-all relative outline-none cursor-pointer ${
              isDisabled
                ? 'opacity-40 cursor-not-allowed text-[var(--sw-text-muted)]'
                : isActive
                ? 'text-[var(--brand-secondary)] font-bold'
                : 'text-[var(--sw-text-secondary)] hover:text-[var(--sw-text-primary)]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                  isActive
                    ? 'bg-[var(--brand-soft)] text-[var(--brand-secondary)]'
                    : 'bg-[var(--sw-canvas)] text-[var(--sw-text-secondary)]'
                }`}
              >
                {tab.count}
              </span>
            )}

            {isActive && variant === 'underline' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand-secondary)] rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
