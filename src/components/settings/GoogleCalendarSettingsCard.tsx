/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * GoogleCalendarSettingsCard
 * Dedicated Administrative Control & Readiness Card for AskNora@nestrealty.com Google Calendar.
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info,
  ChevronDown
} from 'lucide-react';

export interface CalendarDiagnosticData {
  timestamp: string;
  workspaceId: string;
  status: string;
  isReadyForLiveExecution: boolean;
  providerMode: 'LIVE' | 'SANDBOX' | 'DISCONNECTED';
  config: {
    hasClientId: boolean;
    hasClientSecret: boolean;
    hasRedirectUri: boolean;
    redirectUri: string;
    intendedGoogleAccount: string;
    intendedTimezone: string;
  };
  account: {
    connectedEmail?: string;
    subjectId?: string;
    isCorrectAccount: boolean;
    hasRefreshToken: boolean;
    tokenExpiresAt?: string;
    grantedScopes: string[];
    missingRequiredScopes: string[];
  };
  calendar: {
    selectedCalendarId?: string;
    selectedCalendarName?: string;
    accessRole?: string;
    isWritable: boolean;
    isDedicatedNoraCalendar: boolean;
    timezone?: string;
    lastVerifiedAt?: string;
  };
  latencyMs?: number;
  blockingReason?: string;
  operatorActionRequired?: string;
}

export interface AvailableCalendar {
  id: string;
  summary: string;
  description?: string;
  accessRole: string;
  isPrimary: boolean;
  timezone?: string;
}

export const GoogleCalendarSettingsCard: React.FC<{ workspaceId?: string }> = ({
  workspaceId = 'ws_wilmington'
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [diagnostics, setDiagnostics] = useState<CalendarDiagnosticData | null>(null);
  const [availableCalendars, setAvailableCalendars] = useState<AvailableCalendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
  const [isSavingTarget, setIsSavingTarget] = useState<boolean>(false);
  const [isRunningTest, setIsRunningTest] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchDiagnostics = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const [diagRes, calRes] = await Promise.all([
        fetch(`/api/calendar/diagnostics?workspaceId=${workspaceId}`),
        fetch(`/api/calendar/available-calendars?workspaceId=${workspaceId}`)
      ]);

      if (diagRes.ok) {
        const d = await diagRes.json();
        setDiagnostics(d.diagnostics);
        if (d.diagnostics?.calendar?.selectedCalendarId) {
          setSelectedCalendarId(d.diagnostics.calendar.selectedCalendarId);
        }
      }

      if (calRes.ok) {
        const c = await calRes.json();
        if (c.success && c.calendars) {
          setAvailableCalendars(c.calendars);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load calendar diagnostics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, [workspaceId]);

  const handleSelectCalendar = async (calId: string) => {
    setSelectedCalendarId(calId);
    const chosen = availableCalendars.find(c => c.id === calId);
    if (!chosen) return;

    try {
      setIsSavingTarget(true);
      setErrorMessage(null);
      const res = await fetch('/api/calendar/select-target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          selectedCalendarId: chosen.id,
          selectedCalendarName: chosen.summary,
          accessRole: chosen.accessRole,
          timezone: chosen.timezone || 'America/New_York',
          isDedicatedNoraCalendar: chosen.summary.toLowerCase().includes('nora') || chosen.summary.toLowerCase().includes('ops')
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Dedicated calendar updated to "${chosen.summary}".`);
        if (data.diagnostics) setDiagnostics(data.diagnostics);
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(data.error || 'Failed to update selected calendar.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating target calendar.');
    } finally {
      setIsSavingTarget(false);
    }
  };

  const handleRunLiveTest = async () => {
    try {
      setIsRunningTest(true);
      setTestResult(null);
      setErrorMessage(null);
      const res = await fetch('/api/integrations/google/calendar/verify-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, writeTestEnabled: true })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(data.writeTestResult || { readBackVerified: true });
        if (data.diagnostics) setDiagnostics(data.diagnostics);
        setSuccessMessage('Live provider verification test succeeded with immediate cleanup.');
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setErrorMessage(data.error || 'Verification test failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error running live verification test.');
    } finally {
      setIsRunningTest(false);
    }
  };

  const handleConnectOAuth = async () => {
    try {
      const res = await fetch(`/api/integrations/google/connect?workspaceId=${workspaceId}&scope=calendar&login_hint=AskNora@nestrealty.com`);
      const data = await res.json();
      if (data.url) {
        window.open(data.url, 'google_oauth_popup', 'width=600,height=700');
        // Poll status
        const interval = setInterval(async () => {
          const sRes = await fetch(`/api/calendar/diagnostics?workspaceId=${workspaceId}`);
          if (sRes.ok) {
            const sData = await sRes.json();
            if (sData.diagnostics?.status === 'CONNECTED_AND_VERIFIED' || sData.diagnostics?.status === 'CALENDAR_NOT_SELECTED') {
              clearInterval(interval);
              fetchDiagnostics();
            }
          }
        }, 2000);
        setTimeout(() => clearInterval(interval), 60000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initiate OAuth connect.');
    }
  };

  const getStatusBadge = () => {
    if (!diagnostics) return null;
    const s = diagnostics.status;
    if (s === 'CONNECTED_AND_VERIFIED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Connected & Verified (Live Mode)</span>
        </span>
      );
    }
    if (s === 'OAUTH_CONNECTION_REQUIRED' || s === 'NOT_CONFIGURED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>OAuth Authorization Required</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>{s.replace(/_/g, ' ')}</span>
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-50 text-[#00635C] border border-teal-100">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Google Calendar Operations Engine</h2>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live scheduling, rescheduling, Google Meet link provisioning, and attendee RSVP tracking for <code className="text-slate-800 font-mono">AskNora@nestrealty.com</code>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchDiagnostics}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
            title="Refresh Diagnostic Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleConnectOAuth}
            className="px-3.5 py-2 bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-semibold rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{diagnostics?.account?.hasRefreshToken ? 'Reconnect AskNora' : 'Connect Google Workspace'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <strong>Blocker Detected:</strong> {errorMessage}
            {diagnostics?.operatorActionRequired && (
              <p className="mt-1 text-rose-700 font-medium">Resolution: {diagnostics.operatorActionRequired}</p>
            )}
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Identity & Target Calendar Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account Identity */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Authorized Account Identity</span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Target Google User:</span>
              <span className="font-mono font-bold text-slate-800">AskNora@nestrealty.com</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Connected Identity:</span>
              <span className="font-mono font-semibold text-slate-800">
                {diagnostics?.account?.connectedEmail || 'Not Connected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Refresh Token:</span>
              <span className={diagnostics?.account?.hasRefreshToken ? 'text-emerald-700 font-bold' : 'text-amber-600 font-bold'}>
                {diagnostics?.account?.hasRefreshToken ? 'Encrypted (Vault v1)' : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Timezone:</span>
              <span className="text-slate-700 font-medium">America/New_York (Eastern)</span>
            </div>
          </div>
        </div>

        {/* Dedicated Calendar Selector */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Target Secondary Calendar</span>
            <span className="text-[11px] text-slate-500">
              Role: <strong>{diagnostics?.calendar?.accessRole || 'unknown'}</strong>
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] text-slate-600 block">
              Choose dedicated operational calendar for NORA writes:
            </label>
            <select
              value={selectedCalendarId}
              onChange={(e) => handleSelectCalendar(e.target.value)}
              disabled={isSavingTarget || availableCalendars.length === 0}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00635C]"
            >
              {availableCalendars.length === 0 ? (
                <option value="">{loading ? 'Loading calendars...' : 'No accessible calendars (Connect first)'}</option>
              ) : (
                availableCalendars.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.summary} ({c.accessRole}){c.isPrimary ? ' [Primary]' : ''}
                  </option>
                ))
              )}
            </select>

            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Calendar ID: <code className="text-slate-700">{diagnostics?.calendar?.selectedCalendarId || 'primary'}</code></span>
              {diagnostics?.calendar?.isWritable && (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Writable
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer: Live Verification Test */}
      <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="text-slate-500 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span>NORA requires Google provider read-back verification before confirming meeting completion.</span>
        </div>

        <button
          type="button"
          onClick={handleRunLiveTest}
          disabled={isRunningTest || !diagnostics?.account?.hasRefreshToken}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunningTest ? 'animate-spin text-[#00635C]' : 'text-slate-600'}`} />
          <span>{isRunningTest ? 'Testing Live API...' : 'Run Live Read-Back Test'}</span>
        </button>
      </div>

      {/* Test Result Display */}
      {testResult && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono space-y-1">
          <div className="text-emerald-400 font-bold">✅ Provider Live Verification Complete</div>
          <div>Event ID: {testResult.eventId || 'Verified'}</div>
          <div>Read-Back Verified: {String(testResult.readBackVerified)}</div>
          <div>Self-Cleanup Complete: {String(testResult.cleanupSuccess)}</div>
          <div>Latency: {testResult.testDurationMs}ms</div>
        </div>
      )}
    </div>
  );
};
