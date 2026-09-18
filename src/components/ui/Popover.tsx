/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical Popover Primitive — Phase B2 Foundation
 * Anchored floating popover panel with backdrop/click-outside protection and Escape close.
 */

import React, { useEffect, useRef } from 'react';

export interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export default function Popover({
  isOpen,
  onClose,
  trigger,
  children,
  align = 'left',
  className = ''
}: PopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const getAlignClasses = () => {
    switch (align) {
      case 'right':
        return 'right-0';
      case 'center':
        return 'left-1/2 -translate-x-1/2';
      case 'left':
      default:
        return 'left-0';
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {trigger}

      {isOpen && (
        <div
          role="dialog"
          tabIndex={-1}
          className={`absolute top-full mt-2 z-[var(--z-popover)] bg-[var(--sw-surface-elevated)] border border-[var(--sw-border)] rounded-[var(--radius-md)] shadow-[var(--sw-shadow-modal)] p-4 text-[var(--sw-text-primary)] outline-none min-w-[220px] animate-fade-in ${getAlignClasses()} ${className}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
