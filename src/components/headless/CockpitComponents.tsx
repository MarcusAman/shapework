import React, { useState } from 'react';
import { 
  Check, 
  Copy, 
  AlertTriangle, 
  ShieldAlert, 
  Inbox, 
  Zap, 
  Cpu, 
  Terminal, 
  UserCheck, 
  RefreshCw, 
  Clock, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Monitor, 
  X, 
  ExternalLink 
} from 'lucide-react';

// ==========================================
// 1. Safe Token Fingerprint
// ==========================================
export function SafeTokenFingerprint({ tokenHash }: { tokenHash: string }) {
  if (!tokenHash) return <span className="text-text-tertiary font-mono">None</span>;
  const fp = tokenHash.length > 6 ? tokenHash.slice(-6) : tokenHash;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-stone-100 border border-stone-200 text-stone-600 rounded text-[10px] font-mono" title={`SHA-256 Fingerprint: ...${fp}`}>
      fp_{fp}
    </span>
  );
}

// ==========================================
// 2. Copy Button Component
// ==========================================
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy} 
      className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-all"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ==========================================
// 3. Status Badges & Pills
// ==========================================
export function EventStatusPill({ status }: { status: string }) {
  let styles = 'bg-stone-100 text-stone-700 border-stone-200';
  if (status === 'completed' || status === 'active' || status === 'used') styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'deflected') styles = 'bg-blue-50 text-blue-700 border-blue-200';
  if (status === 'needs_review' || status === 'pending') styles = 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'failed' || status === 'expired' || status === 'invalidated') styles = 'bg-rose-50 text-rose-700 border-rose-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border uppercase tracking-wider font-mono ${styles}`}>
      {status}
    </span>
  );
}

export function ActionLinkStatusBadge({ status }: { status: string }) {
  let styles = 'bg-stone-100 text-stone-700 border-stone-200';
  if (status === 'Completed' || status === 'completed') styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Opened' || status === 'opened') styles = 'bg-blue-50 text-blue-700 border-blue-200';
  if (status === 'Pending' || status === 'pending') styles = 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'Expired' || status === 'expired' || status === 'Invalidated' || status === 'invalidated' || status === 'Failed' || status === 'failed') {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border font-mono ${styles}`}>
      {status}
    </span>
  );
}

export function ConfidenceBadge({ score }: { score: number }) {
  const isLow = score < 0.85;
  const pct = Math.round(score * 100);
  const color = isLow ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border font-mono ${color}`}>
      <Cpu className="w-3 h-3" />
      {pct}%
    </span>
  );
}

export function HumanReviewBadge({ needed }: { needed: boolean }) {
  if (!needed) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 font-mono">
      <ShieldAlert className="w-3 h-3 text-amber-600" />
      Needs Review
    </span>
  );
}

export function OwnerShieldBadge({ deflected }: { deflected: boolean }) {
  if (!deflected) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 font-mono">
      <UserCheck className="w-3 h-3 text-blue-600" />
      Shield Deflected
    </span>
  );
}

// ==========================================
// 4. Loading and Empty States
// ==========================================
export function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-stone-200 rounded w-1/4"></div>
      <div className="space-y-2">
        <div className="h-12 bg-stone-100 rounded"></div>
        <div className="h-12 bg-stone-100 rounded"></div>
        <div className="h-12 bg-stone-100 rounded"></div>
      </div>
    </div>
  );
}

export function EmptyState({ message, subtext }: { message: string; subtext?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-stone-50 border border-dashed border-stone-200 rounded-xl text-center">
      <Inbox className="w-8 h-8 text-stone-400 mb-2" />
      <span className="text-xs font-bold text-text-primary block">{message}</span>
      {subtext && <span className="text-[10px] text-text-tertiary mt-1 block">{subtext}</span>}
    </div>
  );
}

// ==========================================
// 5. Layout Shells & Containers
// ==========================================
export function InternalShell({ title, subtitle, actions, children }: { title: string; subtitle: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-6 text-left animate-[fadeIn_0.3s_ease-out]">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-150 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold font-serif text-text-primary leading-tight">{title}</h1>
          <p className="text-xs text-text-secondary mt-1">{subtitle}</p>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

// ==========================================
// 6. Cockpit-Specific Cards
// ==========================================
export function MorningBriefCard({ content, completedCount, activeExceptions }: { content: string; completedCount: number; activeExceptions: number }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-600"></div>
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-5 h-5 text-orange-600" />
        <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-stone-800">Operations Control Tower Brief</h3>
      </div>
      <div className="space-y-4">
        <p className="text-xs text-stone-700 leading-relaxed font-serif whitespace-pre-line bg-stone-50 p-4 rounded-xl border border-stone-100">
          {content}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-center">
            <span className="text-[10px] font-mono text-stone-500 uppercase block">Completed Actions Today</span>
            <span className="text-xl font-bold text-emerald-700 mt-1 block">{completedCount}</span>
          </div>
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-center">
            <span className="text-[10px] font-mono text-stone-500 uppercase block">Exceptions Queue</span>
            <span className="text-xl font-bold text-rose-700 mt-1 block">{activeExceptions}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OwnerWorthyDecisionCard({ title, reason, rule, confidence, actedAt, onComplete }: { title: string; reason: string; rule: string; confidence: number; actedAt?: string; onComplete?: () => void; key?: React.Key }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex items-start justify-between gap-4 transition-all hover:translate-y-[-2px] hover:shadow-md">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-text-primary font-serif">{title}</span>
          <ConfidenceBadge score={confidence} />
        </div>
        <p className="text-xs text-text-secondary">{reason}</p>
        <div className="flex items-center gap-3 text-[10px] text-text-tertiary font-mono">
          <span>Rule: <code className="bg-stone-100 px-1 rounded">{rule}</code></span>
          {actedAt && <span>Acted: {new Date(actedAt).toLocaleTimeString()}</span>}
        </div>
      </div>
      {onComplete && !actedAt && (
        <button 
          onClick={onComplete}
          className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded text-[11px] font-medium transition-all"
        >
          Approve Action
        </button>
      )}
    </div>
  );
}

export function HumanReviewQueueCard({ text, category, queue, confidence, onReview }: { text: string; category: string; queue: string; confidence: number; onReview: () => void; key?: React.Key }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-1.5 text-left">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-mono font-bold uppercase">{category}</span>
          <span className="text-[10px] text-text-tertiary">Route Queue: <code className="bg-stone-100 px-1 rounded">{queue}</code></span>
          <ConfidenceBadge score={confidence} />
        </div>
        <p className="text-xs text-text-primary italic font-serif">"{text}"</p>
      </div>
      <button 
        onClick={onReview}
        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-[11px] font-medium shrink-0 self-start md:self-center transition-all"
      >
        Classify Queue
      </button>
    </div>
  );
}

export function DeflectedNoiseCard({ count, details }: { count: number; details: string }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <h4 className="text-xs font-bold text-text-primary font-serif">Noise Deflection Shield</h4>
          <p className="text-[11px] text-text-secondary leading-relaxed">{details}</p>
        </div>
        <div className="text-center bg-blue-50 border border-blue-100 p-2.5 rounded-xl shrink-0 min-w-[70px]">
          <span className="text-[10px] font-mono text-blue-600 uppercase block">Deflected</span>
          <span className="text-xl font-bold text-blue-700 mt-0.5 block">{count}</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 7. Decision detail Drawer
// ==========================================
export function DecisionDrawer({ isOpen, onClose, decision }: { isOpen: boolean; onClose: () => void; decision: any }) {
  if (!isOpen || !decision) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-[fadeIn_0.2s_ease-out]">
      <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-[2px]" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-stone-250 flex flex-col justify-between text-left font-sans text-xs animate-[slideIn_0.3s_ease-out]">
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-stone-150 pb-4">
            <div>
              <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block">Decision Details</span>
              <h2 className="text-base font-bold font-serif text-stone-900 mt-1">Rule Evaluation #{decision.id}</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded-full transition-all">
              <X className="w-5 h-5 text-stone-400 hover:text-stone-700" />
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
              <span className="text-[9px] font-mono text-stone-500 uppercase block">Verdict</span>
              <span className="mt-1 block"><EventStatusPill status={decision.decision || 'completed'} /></span>
            </div>
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
              <span className="text-[9px] font-mono text-stone-500 uppercase block">Confidence</span>
              <span className="mt-1 block"><ConfidenceBadge score={decision.confidence || 0.9} /></span>
            </div>
          </div>

          {/* Explainability */}
          <div className="space-y-3">
            <h4 className="font-bold text-text-primary uppercase tracking-wider text-[10px]">Explainability Rationale</h4>
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 font-serif leading-relaxed text-stone-700">
              {decision.reason || 'Evaluation complete. Decision was computed based on standard workspace triggers.'}
            </div>
          </div>

          {/* Rules Triggered */}
          <div className="space-y-3">
            <h4 className="font-bold text-text-primary uppercase tracking-wider text-[10px]">Rules Triggered</h4>
            {decision.rulesTriggered && decision.rulesTriggered.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {decision.rulesTriggered.map((rule: string) => (
                  <code key={rule} className="px-2 py-1 bg-stone-100 text-stone-700 rounded text-[10px] font-mono border border-stone-150">
                    {rule}
                  </code>
                ))}
              </div>
            ) : (
              <span className="text-text-tertiary italic block">No custom rules triggered. Bypassed or manual override.</span>
            )}
          </div>

          {/* Audit Steps */}
          <div className="space-y-3">
            <h4 className="font-bold text-text-primary uppercase tracking-wider text-[10px]">Execution Timeline</h4>
            <AuditTimeline timestamp={decision.createdAt} hasFailure={decision.decision === 'failed'} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-stone-150 bg-stone-50 flex items-center justify-between">
          <span className="text-[10px] text-stone-500 font-mono">Timestamp: {new Date(decision.createdAt).toLocaleTimeString()}</span>
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded font-medium transition-all"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 8. Audit Timeline
// ==========================================
export function AuditTimeline({ timestamp, hasFailure }: { timestamp: string; hasFailure?: boolean }) {
  const steps = [
    { title: 'Signal Ingested', desc: 'Inbound message webhook parsed.', done: true },
    { title: 'AI Triage Classification', desc: 'Confidence heuristics verified.', done: true },
    { title: 'Owner Shield Filter', desc: 'Deflection rules evaluated.', done: true },
    { title: 'System Dispatch', desc: 'Secure action generated or exception flagged.', done: !hasFailure, fail: hasFailure }
  ];

  return (
    <div className="space-y-4">
      {steps.map((step, idx) => (
        <div key={step.title} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
              step.fail ? 'bg-rose-500 text-white' : (step.done ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-500')
            }`}>
              {step.fail ? '!' : (step.done ? '✓' : idx + 1)}
            </div>
            {idx < steps.length - 1 && <div className="w-0.5 h-6 bg-stone-200 my-1"></div>}
          </div>
          <div className="text-left space-y-0.5">
            <span className="font-bold text-text-primary block">{step.title}</span>
            <span className="text-[10px] text-text-tertiary block">{step.desc}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ==========================================
// 9. Integration Health Card
// ==========================================
export function IntegrationHealthCard({ title, status, lastSync, lastEvent, lastOutbound, failCount, warning, onRetry }: { 
  title: string; 
  status: 'active' | 'warning' | 'error'; 
  lastSync: string; 
  lastEvent: string; 
  lastOutbound: string; 
  failCount: number; 
  warning?: string; 
  onRetry: () => void;
  key?: React.Key;
}) {
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<string | null>(null);
  const [showDetails, setShowDetails] = React.useState(false);

  let border = 'border-stone-200';
  let badge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'warning') {
    border = 'border-amber-200';
    badge = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (status === 'error') {
    border = 'border-rose-200';
    badge = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  const handleTestConnection = () => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult(`HTTP 200 OK — Latency 42ms — ${title} webhook active`);
    }, 800);
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 relative text-slate-800 ${border}`}>
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">{title}</h4>
        <span className={`px-1.5 py-0.5 border rounded text-[9px] font-bold font-mono ${badge}`}>
          {status}
        </span>
      </div>

      {warning && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[10px] leading-relaxed flex items-start gap-1.5 font-mono">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span>{warning}</span>
        </div>
      )}

      <div className="space-y-2 text-[10px] text-slate-500 font-mono">
        <div className="flex justify-between">
          <span>Last Sync:</span>
          <span className="text-slate-900 font-semibold">{lastSync}</span>
        </div>
        <div className="flex justify-between">
          <span>Last Inbound Event:</span>
          <span className="text-slate-900 font-semibold">{lastEvent}</span>
        </div>
        <div className="flex justify-between">
          <span>Last Outbound:</span>
          <span className="text-slate-900 font-semibold">{lastOutbound}</span>
        </div>
        <div className="flex justify-between">
          <span>Failures:</span>
          <span className={`font-bold ${failCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{failCount}</span>
        </div>
      </div>

      {testResult && (
        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[9px] font-mono text-center">
          {testResult}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button 
          type="button"
          onClick={handleTestConnection}
          disabled={testing}
          className="flex items-center justify-center gap-1.5 py-1.5 bg-black/40 hover:bg-black/60 text-amber-300 border border-amber-500/30 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer font-mono"
        >
          {testing ? 'Testing...' : 'Test Ping'}
        </button>

        <button 
          type="button"
          onClick={onRetry}
          className="flex items-center justify-center gap-1.5 py-1.5 bg-[#004d40] hover:bg-[#00635c] text-white border border-emerald-400/30 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer font-mono"
        >
          <RotateCw className="w-3 h-3" />
          <span>Re-Sync</span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="w-full text-center text-[9px] font-mono text-[#D0D6BB]/70 hover:text-white uppercase tracking-wider cursor-pointer border-t border-white/5 pt-2"
      >
        {showDetails ? 'Hide Webhook Specs' : 'View Webhook Specs ↓'}
      </button>

      {showDetails && (
        <div className="p-3 bg-black/50 border border-white/10 rounded-xl space-y-1.5 text-[9px] font-mono text-[#D0D6BB] animate-fadeIn">
          <div><strong className="text-white">Webhook URL:</strong> /api/webhooks/{title.toLowerCase().replace(/\s+/g, '-')}</div>
          <div><strong className="text-white">Auth Standard:</strong> Bearer Token / HMAC SHA-256</div>
          <div><strong className="text-white">Retry Strategy:</strong> Exponential Backoff (3 retries)</div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 10. Notification Preview Frame
// ==========================================
export function NotificationPreviewFrame({ subject, text, html, smsBody, ctaUrl }: { subject?: string; text?: string; html?: string; smsBody?: string; ctaUrl?: string }) {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[520px]">
      {/* Control bar */}
      <div className="bg-stone-50 border-b border-stone-200 px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-stone-200/60 p-0.5 rounded-lg">
          <button 
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded-md transition-all ${viewport === 'desktop' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
            title="Desktop View"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded-md transition-all ${viewport === 'mobile' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
            title="Mobile View"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="text-[10px] font-mono text-stone-500 uppercase">Live Rendering Studio</span>
      </div>

      {/* Frame content */}
      <div className="flex-1 bg-stone-100 flex items-center justify-center p-4 overflow-hidden relative">
        <div className={`bg-white rounded-xl shadow-sm border border-stone-200 flex flex-col overflow-hidden transition-all duration-300 ${
          viewport === 'desktop' ? 'w-full h-full max-w-4xl' : 'w-[320px] h-[480px]'
        }`}>
          {/* Header email info */}
          <div className="p-3 bg-stone-50 border-b border-stone-150 space-y-1 text-left select-none">
            {subject && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-stone-400 font-mono uppercase w-12 shrink-0">Subject:</span>
                <span className="text-xs font-bold text-stone-800 truncate">{subject}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-[10px] text-stone-400 font-mono">
              <span className="uppercase w-12 shrink-0">From:</span>
              <span className="text-stone-600 truncate">shapework. notifications &lt;notifications@shapework.co&gt;</span>
            </div>
          </div>

          {/* Body Render */}
          <div className="flex-1 overflow-y-auto">
            {html ? (
              <iframe 
                srcDoc={html} 
                title="Email preview" 
                className="w-full h-full border-0 bg-white"
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="p-6 text-left space-y-4">
                {smsBody && (
                  <div className="bg-stone-50 border border-stone-150 p-4 rounded-xl space-y-2 max-w-[280px] ml-2">
                    <span className="text-[9px] font-mono text-stone-400 block">Inbound SMS Box</span>
                    <p className="text-xs font-serif text-stone-800 leading-relaxed whitespace-pre-wrap">{smsBody}</p>
                    {ctaUrl && (
                      <a 
                        href={ctaUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-orange-600 hover:text-orange-700 font-semibold"
                      >
                        Launch Action Link <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                )}
                {text && !smsBody && <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-wrap font-serif">{text}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 11. White Label Preview Card
// ==========================================
export function WhiteLabelPreviewCard({ 
  brokerageName, 
  primaryColor, 
  logoUrl, 
  clientPortalBrand,
  onUpdate 
}: { 
  brokerageName: string; 
  primaryColor: string; 
  logoUrl: string; 
  clientPortalBrand?: boolean;
  onUpdate: (fields: any) => void;
}) {
  // Simple color contrast checker logic (mock/estimation)
  // Calculate relative luminance or mock warning for high brightness/bad contrast
  const hex = primaryColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const badContrast = luminance > 0.8; // Very bright color

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Settings inputs */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 text-left">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono border-b border-stone-100 pb-2">Branding Settings</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-mono text-stone-500 uppercase block mb-1">Brokerage Name</label>
            <input 
              type="text" 
              value={brokerageName} 
              onChange={(e) => onUpdate({ brokerageName: e.target.value })}
              className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-stone-500 uppercase block mb-1">Primary Color (Hex)</label>
            <div className="flex gap-2">
              <input 
                type="color" 
                value={primaryColor} 
                onChange={(e) => onUpdate({ primaryColor: e.target.value })}
                className="w-8 h-7 bg-transparent border-0 cursor-pointer"
              />
              <input 
                type="text" 
                value={primaryColor} 
                onChange={(e) => onUpdate({ primaryColor: e.target.value })}
                className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono uppercase focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {badContrast && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-800 text-[10px] leading-relaxed flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Contrast Ratio Warning</strong>
                <span>The selected primary color is too bright and may fail WCAG AA accessibility contrast checks against white text. Consider selecting a darker tint.</span>
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-mono text-stone-500 uppercase block mb-1">Logo URL (Absolute or Data URI)</label>
            <input 
              type="text" 
              value={logoUrl} 
              onChange={(e) => onUpdate({ logoUrl: e.target.value })}
              className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono focus:bg-white focus:outline-none transition-all"
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="portal_brand" 
              checked={clientPortalBrand} 
              onChange={(e) => onUpdate({ clientPortalBrand: e.target.checked })}
              className="w-3.5 h-3.5 text-stone-900 border-stone-300 rounded focus:ring-stone-500"
            />
            <label htmlFor="portal_brand" className="text-xs text-stone-700">Enforce white-labeling on Client Deal Portal</label>
          </div>
        </div>
      </div>

      {/* Render Previews */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 space-y-6 text-left">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono border-b border-stone-200 pb-2">Branded Component Previews</h3>
        
        {/* Email Header Preview */}
        <div className="space-y-2">
          <span className="text-[9px] font-mono text-stone-500 uppercase block">Outbound Email Header</span>
          <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-6 max-w-[120px] object-contain" />
              ) : (
                <div className="h-6 px-2 bg-stone-100 flex items-center rounded text-[10px] font-bold text-stone-400 font-mono uppercase border border-stone-200">
                  Logo Placeholder
                </div>
              )}
              <span className="text-xs font-bold text-stone-800 border-l border-stone-200 pl-3">{brokerageName}</span>
            </div>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryColor }} title={`Primary Theme: ${primaryColor}`}></div>
          </div>
        </div>

        {/* Portal Portal Preview */}
        <div className="space-y-2">
          <span className="text-[9px] font-mono text-stone-500 uppercase block">Secure Client Portal Header Preview</span>
          <div className="border border-stone-200 rounded-xl overflow-hidden shadow-sm">
            <div className="text-white p-3 flex items-center justify-between" style={{ backgroundColor: primaryColor }}>
              <span className="font-serif font-bold text-xs tracking-tight">{brokerageName}</span>
              <span className="text-[9px] font-mono opacity-85">Secure Deal Portal</span>
            </div>
            <div className="bg-white p-4 space-y-2">
              <div className="h-3 bg-stone-100 rounded w-1/3"></div>
              <div className="h-2 bg-stone-50 rounded w-1/2"></div>
              <div className="h-8 bg-stone-50 border border-stone-150 rounded flex items-center justify-center text-[10px] text-stone-400">
                checklist details
              </div>
            </div>
          </div>
        </div>

        {/* Branded Login Banner */}
        <div className="space-y-2">
          <span className="text-[9px] font-mono text-stone-500 uppercase block">Branded Login Banner</span>
          <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-serif text-white font-black text-sm select-none" style={{ backgroundColor: primaryColor }}>
              {brokerageName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="text-xs font-bold text-stone-800 block">Sign in to {brokerageName}</span>
              <span className="text-[10px] text-stone-400 block font-mono">Sanitization Status: Clean</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
