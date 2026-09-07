/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical Modal / Dialog Primitive — Phase B2 Foundation
 * Accessible React Portal dialog with focus trapping, focus restoration,
 * Escape key handling, scroll locking, and multi-tenant portal inheritance.
 */

import React, { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import IconButton from './IconButton';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdropClick?: boolean;
  showCloseButton?: boolean;
  ariaLabel?: string;
  className?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  closeOnBackdropClick = true,
  showCloseButton = true,
  ariaLabel,
  className = ''
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();

  // Store trigger element and restore focus on unmount/close
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Lock document scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Auto-focus container or first focusable element ONLY once on open if not already focused
      const timer = setTimeout(() => {
        if (modalRef.current) {
          if (!modalRef.current.contains(document.activeElement)) {
            const firstInput = modalRef.current.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])');
            if (firstInput) {
              firstInput.focus();
            } else {
              modalRef.current.focus();
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

  // Focus trap & Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
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
        return 'max-w-md';
      case 'lg':
        return 'max-w-3xl';
      case 'xl':
        return 'max-w-5xl';
      case 'full':
        return 'max-w-[95vw] h-[95vh]';
      case 'md':
      default:
        return 'max-w-xl';
    }
  };

  const modalContent = (
    <div
      aria-hidden={!isOpen}
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fade-in"
    >
      {/* Neutral System Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={() => closeOnBackdropClick && onClose()}
        aria-hidden="true"
      />

      {/* Modal Dialog Surface */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? ariaLabel || 'Dialog' : undefined}
        tabIndex={-1}
        className={`relative w-full bg-[var(--sw-surface-elevated)] border border-[var(--sw-border)] rounded-[var(--radius-lg)] shadow-[var(--sw-shadow-modal)] flex flex-col overflow-hidden text-[var(--sw-text-primary)] max-h-[90vh] my-auto outline-none transition-all duration-200 ${getSizeClasses()} ${className}`}
      >
        {/* Modal Header */}
        {(title || showCloseButton) && (
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

            {showCloseButton && (
              <IconButton
                icon={<X className="w-4 h-4" />}
                aria-label="Close dialog"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="shrink-0"
              />
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-xs text-[var(--sw-text-primary)]">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-[var(--sw-border)] bg-[var(--sw-surface)] flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// Canonical Dialog Alias
export { Modal as Dialog };
