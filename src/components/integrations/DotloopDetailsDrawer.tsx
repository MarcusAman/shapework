/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertTriangle, 
  Activity, 
  Sliders, 
  Link as LinkIcon,
  RefreshCw,
  Trash2
} from 'lucide-react';

interface DotloopDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  status: any;
  onTriggerTestEvent: (scenario: string) => void;
  onStatusRefresh?: () => void;
  isProd?: boolean;
}

export default function DotloopDetailsDrawer({ 
  isOpen, 
  onClose, 
  status, 
  onTriggerTestEvent,
  onStatusRefresh,
  isProd = false
}: DotloopDetailsDrawerProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [isRotatingToken, setIsRotatingToken] = useState(false);
  const [isRotatingSecret, setIsRotatingSecret] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(status.webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(status.webhookSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleRotateToken = async () => {
    setIsRotatingToken(true);
    try {
      const res = await fetch('/api/integrations/apination/dotloop/webhook/rotate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok && onStatusRefresh) {
        onStatusRefresh();
      }
    } catch (e) {
      console.error('Error rotating token:', e);
    } finally {
      setIsRotatingToken(false);
    }
  };

  const handleRotateSecret = async () => {
    setIsRotatingSecret(true);
    try {
      const res = await fetch('/api/integrations/apination/dotloop/webhook/rotate-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok && onStatusRefresh) {
        onStatusRefresh();
      }
    } catch (e) {
      console.error('Error rotating secret:', e);
    } finally {
      setIsRotatingSecret(false);
    }
  };

  const handleRevoke = async () => {
    if (!window.confirm('Are you sure you want to revoke and deactivate this webhook? API Nation notifications will fail.')) {
      return;
    }
    setIsRevoking(true);
    try {
      const res = await fetch('/api/integrations/apination/dotloop/webhook/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok && onStatusRefresh) {
        onStatusRefresh();
      }
    } catch (e) {
      console.error('Error revoking webhook:', e);
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none font-sans">
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-surface border-l border-border-soft shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b border-border-soft flex items-center justify-between bg-stone-50">
            <div>
              <div className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-brand-primary" />
                <h2 className="font-serif font-bold text-base text-text-primary">
                  Dotloop via API Nation Configuration
                </h2>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Configure webhook channels and trigger event validation audits.
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-stone-200 border border-border-soft rounded-lg text-text-tertiary hover:text-text-primary transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 select-text">
            
            {/* Status card */}
            <div className="p-4 bg-stone-900 border border-stone-850 rounded-2xl text-stone-300 space-y-3">
              <div className="flex justify-between items-center select-none">
                <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider font-mono">
                  Integration Health Status
                </span>
                <span className={`text-[9px] font-bold font-mono uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  status.status === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50' : 'bg-red-950 text-red-400 border border-red-900/50'
                }`}>
                  {status.status === 'active' ? 'Active' : 'Revoked / Inactive'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-[9px] text-stone-500 font-bold uppercase font-sans block">Events Today</span>
                  <span className="text-stone-100 font-bold mt-0.5 block">{status.eventsReceivedToday || 0} events</span>
                </div>
                <div>
                  <span className="text-[9px] text-stone-500 font-bold uppercase font-sans block">Last Active</span>
                  <span className="text-stone-100 mt-0.5 block truncate">
                    {status.lastEventAt ? new Date(status.lastEventAt).toLocaleTimeString() : 'No events yet'}
                  </span>
                </div>
              </div>
            </div>

            {/* Setup Wizard */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider select-none">
                API Nation Setup Wizard
              </h3>
              
              <div className="space-y-4 border border-border-soft rounded-2xl p-5 bg-stone-50/50">
                
                {/* Step 1 */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-brand-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold select-none">1</span>
                    <span className="text-xs font-bold text-text-primary">Copy Webhook Endpoint URL (Opaque Tokenized)</span>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={status.webhookUrl} 
                      className="flex-1 bg-white border border-border-soft rounded-lg px-3 py-1.5 text-xs font-mono text-text-secondary select-text focus:outline-none"
                    />
                    <button 
                      onClick={handleCopyUrl}
                      className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-border-soft rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                    <button 
                      onClick={handleRotateToken}
                      disabled={isRotatingToken}
                      className="p-1.5 bg-white hover:bg-stone-100 border border-border-soft rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer text-text-secondary hover:text-text-primary"
                      title="Rotate Webhook URL Token"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRotatingToken ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-brand-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold select-none">2</span>
                    <span className="text-xs font-bold text-text-primary">Shared Secret Verification Header</span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Configure API Nation request header <code>x-shapework-webhook-secret</code> using this key:
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={status.webhookSecret} 
                      className="flex-1 bg-white border border-border-soft rounded-lg px-3 py-1.5 text-xs font-mono text-text-secondary select-text focus:outline-none"
                    />
                    <button 
                      onClick={handleCopySecret}
                      className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-border-soft rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {copiedSecret ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                    <button 
                      onClick={handleRotateSecret}
                      disabled={isRotatingSecret}
                      className="p-1.5 bg-white hover:bg-stone-100 border border-border-soft rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer text-text-secondary hover:text-text-primary"
                      title="Rotate Header Secret"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRotatingSecret ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Revoke Option */}
                <div className="pt-4 border-t border-border-soft flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider block select-none">Endpoint Lifecycle</span>
                    <span className="text-xs text-text-secondary mt-0.5 block">Disable and revoke all webhook access to this workspace.</span>
                  </div>
                  <button
                    onClick={handleRevoke}
                    disabled={isRevoking || status.status !== 'active'}
                    className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      status.status !== 'active' 
                        ? 'border-border-soft text-text-tertiary bg-stone-100 cursor-not-allowed'
                        : 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Revoke Endpoint</span>
                  </button>
                </div>

              </div>
            </div>

            {/* Test Simulation trigger */}
            {!isProd && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider select-none flex items-center gap-1">
                  <Activity className="w-4 h-4 text-brand-primary" />
                  <span>Simulate Webhook Signal</span>
                </h3>
                <p className="text-xs text-text-secondary">
                  Trigger sandbox compliance events directly to verify matching engines and audit event logs.
                </p>
                
                <div className="grid grid-cols-2 gap-2 select-none">
                  <button
                    onClick={() => onTriggerTestEvent('loop_created_unmatched')}
                    className="p-3 bg-white hover:bg-stone-50 border border-border-soft hover:border-border-medium rounded-xl text-left transition-all cursor-pointer"
                  >
                    <span className="font-bold text-text-primary block text-xs">Loop Created (No Intake)</span>
                    <span className="text-[10px] text-text-tertiary block mt-0.5">Triggers Deal Intake Guard missing dossier alert.</span>
                  </button>

                  <button
                    onClick={() => onTriggerTestEvent('participant_added')}
                    className="p-3 bg-white hover:bg-stone-50 border border-border-soft hover:border-border-medium rounded-xl text-left transition-all cursor-pointer"
                  >
                    <span className="font-bold text-text-primary block text-xs">Participant Added</span>
                    <span className="text-[10px] text-text-tertiary block mt-0.5">Appends agent/TC role to loop and updates records.</span>
                  </button>

                  <button
                    onClick={() => onTriggerTestEvent('document_updated')}
                    className="p-3 bg-white hover:bg-stone-50 border border-border-soft hover:border-border-medium rounded-xl text-left transition-all cursor-pointer"
                  >
                    <span className="font-bold text-text-primary block text-xs">Compliance Doc Uploaded</span>
                    <span className="text-[10px] text-text-tertiary block mt-0.5">Matches checklist and solves active escrow requirements.</span>
                  </button>

                  <button
                    onClick={() => onTriggerTestEvent('ambiguous_name')}
                    className="p-3 bg-white hover:bg-stone-50 border border-border-soft hover:border-border-medium rounded-xl text-left transition-all cursor-pointer"
                  >
                    <span className="font-bold text-text-primary block text-xs">Ambiguous Name Match</span>
                    <span className="text-[10px] text-text-tertiary block mt-0.5">Triggers Manual Cross-System resolver dashboard.</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
