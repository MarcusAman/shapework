/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X } from 'lucide-react';

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function DetailDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer
}: DetailDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-hidden z-50 flex justify-end font-sans">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/30 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer */}
      <div className="w-full max-w-md bg-surface border-l border-border-soft shadow-xl flex flex-col h-full relative z-10 animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-border-soft flex items-center justify-between bg-surface-subtle">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="w-8 h-8 rounded-lg border border-border-soft bg-surface flex items-center justify-center shadow-sm shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h3 className="font-bold text-sm text-text-primary leading-tight">{title}</h3>
              {subtitle && <p className="text-[10px] text-text-secondary mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary border border-border-soft p-1.5 rounded-lg hover:bg-surface-subtle transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-5 border-t border-border-soft bg-surface-subtle">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
