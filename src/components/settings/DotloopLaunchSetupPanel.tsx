/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Sliders, 
  Copy, 
  Check, 
  AlertTriangle,
  Play,
  RotateCw,
  Trash2
} from 'lucide-react';

interface DotloopLaunchSetupPanelProps {
  workspaceId: string;
  onConfigChanged?: () => void;
}

export default function DotloopLaunchSetupPanel({ 
  workspaceId, 
  onConfigChanged 
}: DotloopLaunchSetupPanelProps) {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  
  const [isRotatingToken, setIsRotatingToken] = useState(false);
  const [isRotatingSecret, setIsRotatingSecret] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/integrations/apination/dotloop/status?workspaceId=${workspaceId}`);
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [workspaceId]);

  const handleCopyUrl = () => {
    if (!status?.webhookUrl) return;
    navigator.clipboard.writeText(status.webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopySecret = () => {
    if (!status?.webhookSecret) return;
    navigator.clipboard.writeText(status.webhookSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleRotateToken = async () => {
    setIsRotatingToken(true);
    try {
      const res = await fetch(`/api/integrations/apination/dotloop/webhook/rotate-token?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        await fetchStatus();
        if (onConfigChanged) onConfigChanged();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRotatingToken(false);
    }
  };

  const handleRotateSecret = async () => {
    setIsRotatingSecret(true);
    try {
      const res = await fetch(`/api/integrations/apination/dotloop/webhook/rotate-secret?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        await fetchStatus();
        if (onConfigChanged) onConfigChanged();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRotatingSecret(false);
    }
  };

  const handleRevoke = async () => {
    if (!window.confirm('Revoke this endpoint? Webhook ingestion will immediately halt.')) return;
    setIsRevoking(true);
    try {
      const res = await fetch(`/api/integrations/apination/dotloop/webhook/revoke?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        await fetchStatus();
        if (onConfigChanged) onConfigChanged();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRevoking(false);
    }
  };

  if (isLoading) {
    return <div className="text-xs text-text-tertiary">Loading Dotloop webhook configuration...</div>;
  }

  return (
    <div className="space-y-6 font-sans text-xs text-text-secondary leading-normal text-left">
      
      {/* Webhook Configuration Details */}
      <div className="border border-border-soft rounded-2xl p-5 bg-white shadow-sm flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-brand-primary" />
            <h4 className="font-bold text-text-primary text-sm">Dotloop API Nation Webhook</h4>
          </div>
          <p className="text-text-tertiary max-w-md">
            Receives real-time channel events for loop creations, participant additions, and checklist document status updates.
          </p>

          <div className="flex items-center gap-2 mt-2">
            {status?.status === 'active' ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[10px]">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Opaque Webhook Token Active</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium text-[10px]">
                <XCircle className="w-3.5 h-3.5" />
                <span>Revoked / Inactive</span>
              </span>
            )}
          </div>
        </div>

        <div>
          <button 
            onClick={handleRevoke}
            disabled={isRevoking || status?.status !== 'active'}
            className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Revoke Endpoint</span>
          </button>
        </div>
      </div>

      {/* Copy parameters details */}
      <div className="border border-border-soft rounded-2xl p-5 bg-stone-50/50 space-y-4">
        <h5 className="font-bold text-text-primary">Opaque Webhook Configuration</h5>
        
        {/* URL Endpoint */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Opaque Webhook Endpoint URL</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              readOnly 
              value={status?.webhookUrl || ''} 
              className="flex-1 bg-white border border-border-soft rounded-lg px-3 py-1.5 text-xs font-mono text-text-secondary select-text focus:outline-none"
            />
            <button 
              onClick={handleCopyUrl}
              className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-border-soft rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer text-text-primary"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy</span>
            </button>
            <button 
              onClick={handleRotateToken}
              disabled={isRotatingToken}
              className="p-1.5 bg-white hover:bg-stone-100 border border-border-soft rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer text-text-secondary hover:text-text-primary"
              title="Rotate Token"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRotatingToken ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Security header secret */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">x-shapework-webhook-secret Key</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              readOnly 
              value={status?.webhookSecret || ''} 
              className="flex-1 bg-white border border-border-soft rounded-lg px-3 py-1.5 text-xs font-mono text-text-secondary select-text focus:outline-none"
            />
            <button 
              onClick={handleCopySecret}
              className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-border-soft rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer text-text-primary"
            >
              {copiedSecret ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy</span>
            </button>
            <button 
              onClick={handleRotateSecret}
              disabled={isRotatingSecret}
              className="p-1.5 bg-white hover:bg-stone-100 border border-border-soft rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer text-text-secondary hover:text-text-primary"
              title="Rotate Secret"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRotatingSecret ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Verification Instructions */}
      <div className="border border-border-soft rounded-2xl p-5 bg-white space-y-3">
        <h5 className="font-bold text-text-primary">API Nation Platform Setup Instructions</h5>
        <ol className="list-decimal pl-4 text-xs text-text-secondary space-y-1.5 leading-relaxed">
          <li>Access the <strong>API Nation Dashboard</strong> and locate the Dotloop webhook integration module.</li>
          <li>Paste the copied Opaque Webhook Endpoint URL into the sync destination URL field.</li>
          <li>Add custom request header <code>x-shapework-webhook-secret</code> and supply the verification secret copy.</li>
          <li>Select the required channel hooks: <strong>Loops</strong>, <strong>Participants</strong>, and <strong>Documents</strong>.</li>
          <li>Save the configuration. The integration checklist will verify event receipt dynamically.</li>
        </ol>
      </div>

    </div>
  );
}
