/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical DropdownMenu Primitive — Phase B2 Foundation
 * Floating menu list with keyboard navigation (ArrowDown/ArrowUp/Enter/Escape),
 * click-outside listener, and multi-tenant brand item selection.
 */

import React, { useEffect, useRef, useState } from 'react';

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

export interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: 'left' | 'right';
  className?: string;
}

export default function DropdownMenu({
  isOpen,
  onClose,
  trigger,
  items,
  align = 'left',
  className = ''
}: DropdownMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  const clickableItems = items.filter(item => !item.divider && !item.disabled);

  useEffect(() => {
    if (!isOpen) return;

    setHighlightedIndex(0);

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % clickableItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + clickableItems.length) % clickableItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = clickableItems[highlightedIndex];
        if (selected && selected.onClick) {
          selected.onClick();
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, clickableItems, highlightedIndex]);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {trigger}

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`absolute top-full mt-1.5 z-[var(--z-dropdown)] bg-[var(--sw-surface-elevated)] border border-[var(--sw-border)] rounded-[var(--radius-md)] shadow-[var(--sw-shadow-modal)] py-1.5 min-w-[180px] text-[var(--sw-text-primary)] outline-none animate-fade-in ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${className}`}
        >
          {items.map((item, idx) => {
            if (item.divider) {
              return <div key={`divider-${idx}`} className="my-1 border-t border-[var(--sw-border)]" />;
            }

            const clickableIdx = clickableItems.findIndex(i => i.id === item.id);
            const isHighlighted = clickableIdx === highlightedIndex;

            return (
              <button
                key={item.id}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  if (item.onClick && !item.disabled) {
                    item.onClick();
                    onClose();
                  }
                }}
                className={`w-full px-3.5 py-2 text-xs font-medium flex items-center gap-2.5 transition-all text-left outline-none cursor-pointer ${
                  item.disabled
                    ? 'opacity-40 cursor-not-allowed text-[var(--sw-text-muted)]'
                    : item.danger
                    ? 'text-[var(--state-danger)] hover:bg-[var(--state-danger-bg)]'
                    : isHighlighted
                    ? 'bg-[var(--brand-soft)] text-[var(--brand-secondary)] font-bold'
                    : 'text-[var(--sw-text-primary)] hover:bg-[var(--sw-canvas)]'
                }`}
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
