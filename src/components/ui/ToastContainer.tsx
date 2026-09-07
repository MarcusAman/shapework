/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Phase C.4 — Shapework Canonical Toast Container & Render Primitive
 */

import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, Sparkles, X } from 'lucide-react';
import { useToast, ToastItem } from './ToastContext';

function ToastCard({ toast, onDismiss }: { key?: any; toast: ToastItem; onDismiss: (id: string) => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (toast.duration <= 0 || isHovered) return;

    timerRef.current = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, toast.duration, isHovered, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-[var(--state-success,#059669)] shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[var(--state-warning,#D97706)] shrink-0 mt-0.5" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-[var(--state-danger,#DC2626)] shrink-0 mt-0.5" />;
      case 'ai':
        return <Sparkles className="w-5 h-5 text-[var(--brand-primary,#00635C)] shrink-0 mt-0.5 animate-pulse" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />;
    }
  };

  const getRole = () => {
    return toast.type === 'error' || toast.type === 'warning' ? 'alert' : 'status';
  };

  return (
    <div
      role={getRole()}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      data-testid={`toast-${toast.type}`}
      data-toast-id={toast.id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="pointer-events-auto w-full bg-[var(--sw-surface,#FFFFFF)] text-[var(--sw-text-primary,#17231F)] border border-[var(--sw-border,#E2E4DA)] shadow-lg rounded-2xl p-3.5 flex items-start gap-3 transition-all duration-200 animate-fade-in font-sans motion-reduce:animate-none"
    >
      {getIcon()}
      <div className="flex-1 min-w-0 pr-1 text-left">
        <h4 className="font-bold text-xs text-[var(--sw-text-primary,#17231F)] leading-snug tracking-tight">
          {toast.title}
        </h4>
        {toast.description && (
          <p className="text-[11px] text-[var(--sw-text-secondary,#52605B)] mt-0.5 font-medium leading-relaxed">
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              onDismiss(toast.id);
            }}
            className="mt-2 text-xs font-bold text-[var(--brand-primary,#00635C)] hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--brand-primary)] rounded"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Close notification"
        className="p-1 text-[var(--sw-text-secondary,#52605B)] hover:text-[var(--sw-text-primary,#17231F)] hover:bg-[var(--sw-canvas,#FBF8F0)] rounded-lg shrink-0 ml-auto cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      data-testid="toast-container"
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[9999] flex flex-col gap-2.5 w-full max-w-xs sm:max-w-sm pointer-events-none"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}
