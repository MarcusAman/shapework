/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, CheckCircle2, XCircle, RefreshCw, Eye, Settings, Shield, AlertTriangle } from 'lucide-react';
import { EmailAccount } from '../../types/shapework';

interface ConnectedEmailAccountsProps {
  accounts: EmailAccount[];
  onToggleConnection: (id: string) => void;
  onSyncAccount: (id: string) => void;
}

export default function ConnectedEmailAccounts({
  accounts,
  onToggleConnection,
  onSyncAccount
}: ConnectedEmailAccountsProps) {
  const [selectedAccountForConfig, setSelectedAccountForConfig] = useState<string | null>(null);

  const getAccountBadge = (status: EmailAccount['status']) => {
    switch (status) {
      case 'connected':
        return (
          <span className="flex items-center gap-1.5 text-xs text-status-healthy font-semibold bg-status-healthy-soft px-2 py-0.5 rounded border border-status-healthy/10">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Connected</span>
          </span>
        );
      case 'error':
      case 'needs_attention':
        return (
          <span className="flex items-center gap-1.5 text-xs text-status-atrisk font-semibold bg-status-atrisk-soft px-2 py-0.5 rounded border border-status-atrisk/15 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Needs Attention</span>
          </span>
        );
      case 'disconnected':
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs text-text-tertiary font-semibold bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
            <XCircle className="w-3.5 h-3.5" />
            <span>Disconnected</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(accounts || []).map((account) => {
          const isConnected = account.status === 'connected';
          const showConfig = selectedAccountForConfig === account.id;

          return (
            <div
              key={account.id}
              className={`bg-surface border rounded-2xl p-5 shadow-sm space-y-4 transition-all relative ${
                isConnected ? 'border-border-subtle hover:border-strong-border' : 'border-border-subtle/50 opacity-80'
              }`}
            >
              {/* Account Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-green-soft flex items-center justify-center text-brand-green">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary text-sm font-mono">{account.address}</h3>
                    <p className="text-[10px] text-text-tertiary uppercase font-bold tracking-wider mt-0.5">
                      {account.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                {getAccountBadge(account.status)}
              </div>

              {/* Scope & Purpose */}
              <p className="text-xs text-text-secondary leading-relaxed">
                {account.scope_purpose}
              </p>

              {/* Statistics Pane */}
              {isConnected && (
                <div className="grid grid-cols-3 gap-2 bg-secondary-surface p-3 rounded-xl border border-border-subtle/70 text-center font-mono">
                  <div>
                    <span className="text-[9px] text-text-tertiary block uppercase">Processed</span>
                    <span className="text-sm font-bold text-text-primary mt-0.5 block">{account.processed_count}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-tertiary block uppercase">Matched</span>
                    <span className="text-sm font-bold text-brand-green mt-0.5 block">{account.matched_count}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-tertiary block uppercase">Low Conf</span>
                    <span className="text-sm font-bold text-status-attention mt-0.5 block">{account.low_confidence_count}</span>
                  </div>
                </div>
              )}

              {/* Controls Footer */}
              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => onToggleConnection(account.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      isConnected
                        ? 'bg-white hover:bg-stone-50 text-status-atrisk border-border-subtle hover:border-status-atrisk/35'
                        : 'bg-brand-green hover:bg-brand-green-hover text-white border-transparent'
                    }`}
                  >
                    {isConnected ? 'Disconnect' : 'Connect Account'}
                  </button>
                  {isConnected && (
                    <button
                      onClick={() => setSelectedAccountForConfig(showConfig ? null : account.id)}
                      className="p-1.5 rounded-lg border border-border-subtle hover:bg-secondary-surface text-text-secondary hover:text-text-primary transition-colors"
                      title="Monitored Folders & Permissions"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isConnected && (
                  <button
                    onClick={() => onSyncAccount(account.id)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-brand-green hover:text-brand-green-hover bg-brand-green-soft/50 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync Now</span>
                  </button>
                )}
              </div>

              {/* Config Panel */}
              {showConfig && isConnected && (
                <div className="mt-4 pt-4 border-t border-border-subtle/50 space-y-3 text-xs animate-fade-in">
                  {/* Folders monitored */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Monitored Folders</span>
                    <div className="flex flex-wrap gap-1">
                      {account.monitored_folders.map((f, idx) => (
                        <span key={idx} className="bg-secondary-surface border border-border-subtle/80 px-2 py-0.5 rounded text-[10px] font-medium text-text-secondary font-mono">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Scopes */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">API Access Tokens</span>
                    <div className="space-y-1 bg-secondary-surface p-2 rounded-lg border border-border-subtle/80 text-[10px] text-text-secondary font-mono leading-tight max-h-24 overflow-y-auto">
                      {account.permissions.map((p, idx) => (
                        <div key={idx} className="flex gap-1 items-start">
                          <Shield className="w-3.5 h-3.5 text-brand-green shrink-0" />
                          <span className="break-all">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Security Privacy Notice */}
      <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl flex items-start gap-3 text-xs leading-relaxed text-text-primary">
        <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-amber-800">Brokerage Governance & Sensitive Data Policy</span>
          <p className="text-text-secondary text-[11px]">
            shapework operates strictly in read-only matching modes for connected mailboxes. Personal, non-business keywords, or highly sensitive financial attachments (e.g. wire instructions, tax filings) are automatically redacted. Outbound dispatches will not leave the system without human check and explicit authorization.
          </p>
        </div>
      </div>
    </div>
  );
}
