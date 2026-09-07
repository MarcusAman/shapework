/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical Drawer / Sheet Primitive — Phase B2 Foundation
 * Slide-over side drawer with portal inheritance, focus trap, Escape close,
 * and responsive width management.
 */

import React, { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import IconButton from './IconButton';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: 'right' | 'left';
  size?: 'sm' | 'md' | 'lg' | 'full';
  closeOnBackdropClick?: boolean;
  ariaLabel?: string;
  className?: string;
}

export default function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  position = 'right',
  size = 'md',
  closeOnBackdropClick = true,
  ariaLabel,
  className = ''
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const timer = setTimeout(() => {
        if (drawerRef.current) {
          if (!drawerRef.current.contains(document.activeElement)) {
            const firstInput = drawerRef.current.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])');
            if (firstInput) {
              firstInput.focus();
            } else {
              drawerRef.current.focus();
            }
          }
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
        if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-sm';
      case 'lg':
        return 'max-w-2xl';
      case 'full':
        return 'max-w-full';
      case 'md':
      default:
        return 'max-w-lg';
    }
  };

  const getPositionClasses = () => {
    return position === 'left' ? 'left-0' : 'right-0';
  };

  const drawerContent = (
    <div
      aria-hidden={!isOpen}
      className="fixed inset-0 z-[var(--z-drawer)] flex animate-fade-in"
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={() => closeOnBackdropClick && onClose()}
        aria-hidden="true"
      />

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? ariaLabel || 'Drawer' : undefined}
        tabIndex={-1}
        className={`fixed top-0 bottom-0 ${getPositionClasses()} w-full ${getSizeClasses()} bg-[var(--sw-surface-elevated)] border-${
          position === 'left' ? 'r' : 'l'
        } border-[var(--sw-border)] shadow-xl flex flex-col overflow-hidden text-[var(--sw-text-primary)] outline-none transition-transform duration-200 ${className}`}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-[var(--sw-border)] flex items-center justify-between bg-[var(--sw-surface)] shrink-0 gap-4">
          <div className="flex flex-col text-left">
            {title && (
              <h3 id={titleId} className="text-base font-bold tracking-tight text-[var(--sw-text-primary)]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[var(--sw-text-secondary)] mt-0.5 font-normal">
                {subtitle}
              </p>
            )}
          </div>

          <IconButton
            icon={<X className="w-4 h-4" />}
            aria-label="Close drawer"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="shrink-0"
          />
        </div>

        {/* Drawer Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-xs text-[var(--sw-text-primary)]">
          {children}
        </div>

        {/* Drawer Footer */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-[var(--sw-border)] bg-[var(--sw-surface)] flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}

// Canonical Sheet Alias
export { Drawer as Sheet };
