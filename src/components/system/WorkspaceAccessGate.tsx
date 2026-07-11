import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, AlertTriangle } from 'lucide-react';

interface WorkspaceAccessGateProps {
  children: React.ReactNode;
}

export default function WorkspaceAccessGate({ children }: WorkspaceAccessGateProps) {
  const [passcode, setPasscode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [serverUnconfigured, setServerUnconfigured] = useState(false);
  const [appMode, setAppMode] = useState('development');
  const isDemoPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/demo');

  useEffect(() => {
    // 1. Fetch app mode first
    fetch('/api/mode')
      .then(res => res.json())
      .then(data => {
        const mode = data.mode || 'development';
        setAppMode(mode);

        const checkDemoAccess = () => {
          const access = sessionStorage.getItem('shapework_demo_access');
          if (access === 'granted') {
            setHasAccess(true);
            return;
          }

          fetch('/api/demo/config')
            .then(res => {
              if (!res.ok) throw new Error('Failed to fetch config');
              return res.json();
            })
            .then(data => {
              if (!data.passcodeRequired) {
                sessionStorage.setItem('shapework_demo_access', 'granted');
                setHasAccess(true);
              }
            })
            .catch(err => {
              console.error('Error fetching demo config:', err);
            });
        };

        if (mode === 'production' || !isDemoPath) {
          fetch('/api/auth/session')
            .then(res => {
              if (res.ok) {
                setHasAccess(true);
              } else if (mode === 'development') {
                checkDemoAccess();
              }
            })
            .catch(() => {
              if (mode === 'development') {
                checkDemoAccess();
              }
            });
        } else {
          checkDemoAccess();
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmitPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    setIsVerifying(true);
    setError('');
    setServerError(false);
    setServerUnconfigured(false);

    try {
      const response = await fetch('/api/demo/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ passcode })
      });

      if (!response.ok) {
        throw new Error('Server responded with an error');
      }

      const data = await response.json();

      if (data.unconfigured) {
        setServerUnconfigured(true);
      } else if (data.ok) {
        sessionStorage.setItem('shapework_demo_access', 'granted');
        if (typeof window !== 'undefined') {
          const currentToken = localStorage.getItem('shapework_session_token');
          if (!currentToken) {
            localStorage.setItem('shapework_session_token', 'sarah.j@nestrealty.com');
          }
        }
        setHasAccess(true);
      } else {
        setError(isDemoPath ? 'Incorrect demo passcode. Please try again.' : 'Incorrect passcode. Please try again.');
      }
    } catch (err) {
      console.error('Passcode verification failed:', err);
      setServerError(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setIsVerifying(true);
    setError('');
    setServerError(false);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        setHasAccess(true);
        // Refresh page to populate global React state from database
        window.location.reload();
      } else {
        const data = await response.json();
        setError(data.message || 'Invalid operator credentials.');
      }
    } catch (err) {
      console.error('Login request failed:', err);
      setServerError(true);
    } finally {
      setIsVerifying(false);
    }
  };

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 font-sans select-none text-left">
      <div className="w-full max-w-sm bg-surface border border-border-soft rounded-3xl p-8 shadow-card space-y-6">
        
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="w-12 h-12 bg-brand-soft rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5 text-brand-primary" />
          </div>
          <h1 className="text-xl font-serif font-bold text-text-primary">
            shapework.
          </h1>
          <p className="text-xs text-text-secondary">
            {appMode === 'production' ? 'AI Operations Console' : (isDemoPath ? 'AI Operations Command Center Demo' : 'Private Console Access')}
          </p>
          <div className="p-3.5 bg-stone-50 border border-border-soft rounded-xl text-[10px] text-text-secondary leading-normal text-left font-light">
            {appMode === 'production'
              ? 'Authorized Operator access only. Authenticate with secure email credentials.'
              : (isDemoPath ? 'Private shapework. demo environment. Synthetic data only. Access is limited to approved viewers.' : 'Authorized workspace operator access only. Please enter passcode.')}
          </div>
        </div>

        {appMode === 'production' ? (
          /* Production User Login Form */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
                Operator Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@brokerage.com"
                disabled={isVerifying}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-border-soft rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all disabled:opacity-50"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isVerifying}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-border-soft rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all disabled:opacity-50"
              />
            </div>

            {error && (
              <p className="text-[11px] text-risk-red font-medium leading-relaxed bg-risk-red-soft px-3 py-2 rounded-lg border border-risk-red/10">
                {error}
              </p>
            )}

            {serverError && (
              <p className="text-[11px] text-risk-red font-medium leading-relaxed bg-risk-red-soft px-3 py-2 rounded-lg border border-risk-red/10">
                Authentication server is offline or database connection is unconfigured.
              </p>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isVerifying ? 'Authenticating...' : 'Sign In to Console'}</span>
            </button>
          </form>
        ) : serverUnconfigured ? (
          <div className="p-4 bg-risk-red-soft text-risk-red border border-risk-red/10 rounded-xl text-xs leading-relaxed space-y-2">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
              <AlertTriangle className="w-4 h-4 text-risk-red" />
              <span>Access Warning</span>
            </div>
            <p className="font-semibold text-text-primary">
              Private shapework. console environment. Access passcode is not configured in production.
            </p>
            <p className="text-[11px] text-text-secondary leading-normal">
              Please contact the system administrator to configure the access passcode server-side environment variables.
            </p>
          </div>
        ) : (
          /* Demo Passcode Form */
          <form onSubmit={handleSubmitPasscode} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
                Enter Access Passcode
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••••"
                disabled={isVerifying}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-border-soft rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-mono disabled:opacity-50"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-[11px] text-risk-red font-medium leading-relaxed bg-risk-red-soft px-3 py-2 rounded-lg border border-risk-red/10">
                {error}
              </p>
            )}

            {serverError && (
              <p className="text-[11px] text-risk-red font-medium leading-relaxed bg-risk-red-soft px-3 py-2 rounded-lg border border-risk-red/10">
                Unable to verify passcode. The server endpoint is currently offline or unreachable.
              </p>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isVerifying ? 'Verifying...' : 'Access Workspace'}</span>
            </button>
          </form>
        )}

        {/* Sandbox Notice */}
        <div className="pt-2 border-t border-border-soft/60">
          <p className="text-[9px] text-text-tertiary text-center leading-normal">
            {appMode === 'production'
              ? 'shapework. Operations Console · Secure Workspace Environment'
              : (isDemoPath ? 'Nest Realty Demo Workspace · Synthetic Data · No real client data connected · Private demo. Do not distribute without approval.' : 'shapework. Operations Console · Private Workspace Access')}
          </p>
        </div>

      </div>
    </div>
  );
}
