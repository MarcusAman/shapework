import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MarketingErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MarketingErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null });
  };

  public render() {
    const state = (this as any).state as State;
    const props = (this as any).props as Props;

    if (state?.hasError) {
      return (
        <div
          data-testid="marketing-error-boundary"
          className="p-8 my-6 bg-[#062f28] border border-rose-500/40 rounded-2xl text-left space-y-4 shadow-lg text-[#fffdf8]"
          role="alert"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400 border border-rose-500/30 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {props?.fallbackTitle || 'Unable to render this marketing view'}
              </h2>
              <p className="text-xs text-slate-300">
                An unexpected component error occurred. Your existing work and data have not been affected.
              </p>
            </div>
          </div>

          {state.error && (
            <div className="p-3 bg-[#01251f] rounded-xl border border-rose-500/20 text-xs font-mono text-rose-300 overflow-x-auto">
              {state.error.message}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Component</span>
            </button>
          </div>
        </div>
      );
    }

    return props?.children;
  }
}
