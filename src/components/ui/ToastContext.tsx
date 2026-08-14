/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Phase C.4 — Shapework Canonical Toast System Context
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'info' | 'warning' | 'error' | 'ai';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  id?: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  action?: ToastAction;
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration: number;
  action?: ToastAction;
  createdAt: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  dismiss: (id: string) => void;
  dismissAll: () => void;
  addToast: (options: ToastOptions) => string;
  toast: {
    success: (opts: string | ToastOptions) => string;
    info: (opts: string | ToastOptions) => string;
    warning: (opts: string | ToastOptions) => string;
    error: (opts: string | ToastOptions) => string;
    ai: (opts: string | ToastOptions) => string;
    dismiss: (id: string) => void;
    dismissAll: () => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  info: 5000,
  warning: 7000,
  error: 8000,
  ai: 5000,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = useCallback((options: ToastOptions): string => {
    const id = options.id || `toast-${Date.now()}-${nextIdRef.current++}`;
    const type = options.type || 'info';
    const duration = options.duration ?? DEFAULT_DURATIONS[type];

    const newItem: ToastItem = {
      id,
      title: options.title,
      description: options.description,
      type,
      duration,
      action: options.action,
      createdAt: Date.now(),
    };

    setToasts((prev) => {
      // Filter out duplicate IDs or existing identical titles
      const filtered = prev.filter((t) => t.id !== id && t.title !== options.title);
      // Keep max 5 visible toasts
      const updated = [newItem, ...filtered];
      return updated.slice(0, 5);
    });

    return id;
  }, []);

  const normalizeOptions = (opts: string | ToastOptions, type: ToastType): ToastOptions => {
    if (typeof opts === 'string') {
      return { title: opts, type };
    }
    return { ...opts, type: opts.type || type };
  };

  const toastObj = useRef({
    success: (opts: string | ToastOptions) => addToast(normalizeOptions(opts, 'success')),
    info: (opts: string | ToastOptions) => addToast(normalizeOptions(opts, 'info')),
    warning: (opts: string | ToastOptions) => addToast(normalizeOptions(opts, 'warning')),
    error: (opts: string | ToastOptions) => addToast(normalizeOptions(opts, 'error')),
    ai: (opts: string | ToastOptions) => addToast(normalizeOptions(opts, 'ai')),
    dismiss,
    dismissAll,
  });

  // Keep references current
  toastObj.current.dismiss = dismiss;
  toastObj.current.dismissAll = dismissAll;
  toastObj.current.success = (opts) => addToast(normalizeOptions(opts, 'success'));
  toastObj.current.info = (opts) => addToast(normalizeOptions(opts, 'info'));
  toastObj.current.warning = (opts) => addToast(normalizeOptions(opts, 'warning'));
  toastObj.current.error = (opts) => addToast(normalizeOptions(opts, 'error'));
  toastObj.current.ai = (opts) => addToast(normalizeOptions(opts, 'ai'));

  if (typeof window !== 'undefined') {
    (window as any).__toast = toastObj.current;
  }

  return (
    <ToastContext.Provider
      value={{
        toasts,
        dismiss,
        dismissAll,
        addToast,
        toast: toastObj.current,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    const noopId = 'noop-toast';
    return {
      toasts: [],
      dismiss: () => {},
      dismissAll: () => {},
      toast: {
        success: () => noopId,
        info: () => noopId,
        warning: () => noopId,
        error: () => noopId,
        ai: () => noopId,
        dismiss: () => {},
        dismissAll: () => {},
      },
    };
  }
  return ctx;
}
