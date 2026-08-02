/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, ClipboardCopy } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    if (typeof window !== 'undefined' && error && error.message && (
      error.message.includes('dynamically imported module') ||
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Loading chunk')
    )) {
      window.location.reload();
      return { hasError: false, error: null, errorInfo: null };
    }
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    (this as any).setState({ error, errorInfo });
    console.error("Uncaught error caught by shapework ErrorBoundary:", error, errorInfo);

    // Auto-recover if browser tries to load a stale pre-deployment chunk hash
    if (error && error.message && (
      error.message.includes('dynamically imported module') ||
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Loading chunk')
    )) {
      window.location.reload();
    }
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleCopyLogs = () => {
    if (this.state.error) {
      const text = `Error: ${this.state.error.message}\nStack: ${this.state.error.stack || ''}\nInfo: ${JSON.stringify(this.state.errorInfo || {})}`;
      navigator.clipboard.writeText(text);
      alert("Error logs copied to clipboard.");
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50/50 p-6 font-sans">
          <div className="w-full max-w-lg bg-surface border border-border-subtle rounded-3xl p-8 space-y-6 shadow-xl text-left">
            <div className="flex items-center gap-3 text-red-600">
              <AlertOctagon className="w-8 h-8" />
              <h1 className="font-serif font-bold text-xl text-text-primary leading-tight">Operating System Interruption</h1>
            </div>

            <p className="text-sm text-text-secondary leading-relaxed">
              shapework. encountered a runtime exception during page execution. The active workspace state was preserved.
            </p>

            {this.state.error && (
              <div className="p-4 bg-red-50/40 border border-red-100 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider font-mono">Trace Logs</span>
                <p className="text-xs font-mono text-red-700 break-words leading-relaxed whitespace-pre-wrap">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-hover text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleCopyLogs}
                className="flex items-center gap-1.5 border border-border-subtle bg-surface hover:bg-secondary-surface text-text-secondary px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors"
              >
                <ClipboardCopy className="w-4 h-4" />
                <span>Copy Diagnostic Logs</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
