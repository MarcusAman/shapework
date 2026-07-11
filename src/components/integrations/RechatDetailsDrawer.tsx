/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Database, Shield, ShieldCheck, Activity, RefreshCw, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { rechatWorkflowMappings } from '../../data/rechatWorkflowMap';
import { maskEmail, maskPhone } from '../../integrations/rechat/rechatMappings';

interface RechatDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rechatStatus: any;
  onSync: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onTestWebhook: (topic: string, recordId: string) => Promise<void>;
  dbState: any;
  refreshDbState: () => Promise<void>;
  isProd?: boolean;
}

export default function RechatDetailsDrawer({
  isOpen,
  onClose,
  rechatStatus,
  onSync,
  onDisconnect,
  onTestWebhook,
  dbState,
  refreshDbState,
  isProd = false
}: RechatDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'data' | 'webhooks' | 'workflows' | 'writeback' | 'logs'>('overview');
  const [isSyncing, setIsSyncing] = useState(false);
  const [testTopic, setTestTopic] = useState('Deals');
  const [testRecordId, setTestRecordId] = useState('deal_woodlawn');
  const [testLog, setTestLog] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      refreshDbState();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSyncClick = async () => {
    setIsSyncing(true);
    await onSync();
    await refreshDbState();
    setIsSyncing(false);
  };

  const handleTestWebhookClick = async () => {
    setTestLog('Sending simulated webhook request with valid HMAC signature...');
    try {
      await onTestWebhook(testTopic, testRecordId);
      await refreshDbState();
      setTestLog(`Simulated Webhook event [Topic: ${testTopic}] verified & processed successfully.`);
    } catch (err: any) {
      setTestLog(`Simulated Webhook failed: ${err.message}`);
    }
  };

  // Filter logs for Rechat
  const rechatLogs = dbState?.auditEvents?.filter((event: any) => 
    event.action_description.toLowerCase().includes('rechat') || 
    event.impact_area.toLowerCase().includes('rechat') ||
    event.impact_area.toLowerCase().includes('webhook')
  ) || [];

  return (
    <div className="fixed inset-0 overflow-hidden z-50 flex justify-end font-sans">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity" 
      />

      {/* Drawer Panel */}
      <div className="w-full max-w-2xl bg-surface border-l border-border-subtle shadow-2xl flex flex-col h-full relative z-10">
        
        {/* Header */}
        <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-secondary-surface shrink-0">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-primary" />
            <div>
              <h3 className="font-serif font-bold text-sm text-text-primary">Rechat Partner Integration Console</h3>
              <span className="font-mono text-[9px] text-text-tertiary">
                Status: {rechatStatus.connected ? 'OAuth Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary border border-border-subtle p-1.5 rounded-lg shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-border-subtle bg-stone-50 overflow-x-auto shrink-0 select-none">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'data', label: 'Data Synced' },
            { id: 'webhooks', label: 'Webhooks' },
            { id: 'workflows', label: 'Workflow Mappings' },
            { id: 'writeback', label: 'Writeback Rules' },
            { id: 'logs', label: 'Audit Logs' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-semibold font-mono border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-brand-primary text-brand-primary bg-surface' 
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-stone-100/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-text-primary">Integration Architecture</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  The Rechat Integration uses OAuth 2.0 Authorization Code flow for secure API access. 
                  Incoming data updates are consumed in real-time via Brand Webhooks with mandatory HMAC-SHA256 signature verification.
                </p>
              </div>

              {/* Status Table */}
              <div className="border border-border-subtle rounded-2xl overflow-hidden text-xs">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-border-subtle">
                      <td className="p-3 bg-stone-50 font-semibold font-mono text-text-secondary w-1/3">Connection Mode</td>
                      <td className="p-3 font-semibold text-text-primary">
                        {rechatStatus.isSandbox ? 'Transparent Sandbox Mode' : 'Production API Server'}
                      </td>
                    </tr>
                    <tr className="border-b border-border-subtle">
                      <td className="p-3 bg-stone-50 font-semibold font-mono text-text-secondary">Connected Brand ID</td>
                      <td className="p-3 font-mono text-text-primary">{rechatStatus.brandId || 'mock_brand_nest_realty'}</td>
                    </tr>
                    <tr className="border-b border-border-subtle">
                      <td className="p-3 bg-stone-50 font-semibold font-mono text-text-secondary">Token Status</td>
                      <td className="p-3 text-text-primary">
                        {rechatStatus.connected ? (
                          <span className="text-success font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Active (Server-Side Storage Only)</span>
                          </span>
                        ) : (
                          <span className="text-text-tertiary">No credentials stored</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 bg-stone-50 font-semibold font-mono text-text-secondary">Granted Scopes</td>
                      <td className="p-3 text-text-primary">
                        <div className="flex flex-wrap gap-1">
                          {rechatStatus.scopes?.map((s: string) => (
                            <span key={s} className="bg-stone-100 px-2 py-0.5 rounded text-[10px] font-mono text-text-secondary">{s}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Sync Actions */}
              {rechatStatus.connected && (
                <div className="p-4 bg-brand-soft/20 border border-brand-primary/10 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-text-primary text-xs block">Baseline Synchronization</span>
                    <span className="text-text-secondary text-[11px] block">Trigger a manual sweep of deals, tasks, and calendar events.</span>
                  </div>
                  <button
                    disabled={isSyncing}
                    onClick={handleSyncClick}
                    className="px-3.5 py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg text-xs font-mono font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* DATA SYNCED TAB */}
          {activeTab === 'data' && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="flex justify-between items-center select-none">
                <h4 className="text-sm font-bold text-text-primary">Synchronized Records Registry</h4>
                <span className="text-[10px] font-mono text-text-secondary bg-stone-100 px-2 py-0.5 rounded">
                  Masking Rule: PII Obfuscation Enabled
                </span>
              </div>

              {/* Transactions */}
              <div className="space-y-2">
                <h5 className="font-bold text-text-primary font-mono text-[10px] uppercase tracking-wider">Normalized Transactions ({dbState?.transactions?.length || 0})</h5>
                <div className="border border-border-subtle rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-stone-50 border-b border-border-subtle text-text-secondary font-mono text-[10px]">
                      <tr>
                        <th className="p-2.5">Address</th>
                        <th className="p-2.5">Client</th>
                        <th className="p-2.5">Stage</th>
                        <th className="p-2.5">Close Date</th>
                        <th className="p-2.5">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbState?.transactions?.map((tx: any) => (
                        <tr key={tx.id} className="border-b border-border-subtle last:border-0 hover:bg-stone-50/50">
                          <td className="p-2.5 font-semibold text-text-primary">{tx.property_address}</td>
                          <td className="p-2.5 text-text-secondary">{tx.client_name}</td>
                          <td className="p-2.5 font-mono text-[10px] capitalize text-text-secondary">{tx.current_stage?.replace(/_/g, ' ')}</td>
                          <td className="p-2.5 font-mono text-text-secondary">{tx.expected_closing_date}</td>
                          <td className="p-2.5">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              tx.risk_level === 'healthy' ? 'bg-success-soft text-success' :
                              tx.risk_level === 'watch' ? 'bg-warning-soft text-warning' :
                              'bg-risk-red-soft text-risk-red'
                            }`}>
                              {tx.risk_level}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CRM Contacts */}
              <div className="space-y-2">
                <h5 className="font-bold text-text-primary font-mono text-[10px] uppercase tracking-wider">Normalized Contacts</h5>
                <div className="border border-border-subtle rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-stone-50 border-b border-border-subtle text-text-secondary font-mono text-[10px]">
                      <tr>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Masked Email</th>
                        <th className="p-2.5">Masked Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbState?.participants?.map((p: any) => (
                        <tr key={p.id} className="border-b border-border-subtle last:border-0 hover:bg-stone-50/50">
                          <td className="p-2.5 font-semibold text-text-primary">{p.name}</td>
                          <td className="p-2.5 font-mono text-text-secondary">{maskEmail(p.email)}</td>
                          <td className="p-2.5 font-mono text-text-secondary">{maskPhone(p.phone)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* WEBHOOKS TAB */}
          {activeTab === 'webhooks' && (
            <div className="space-y-5 animate-fade-in text-xs">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-text-primary">Brand Webhooks Receiver</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Incoming events are ingested securely at <code className="bg-stone-100 px-1 py-0.5 rounded font-mono font-semibold">/api/integrations/rechat/webhook</code>. 
                  Every payload must contain a valid signature in the <code className="bg-stone-100 px-1 py-0.5 rounded font-mono font-semibold">x-rechat-signature</code> header.
                </p>
              </div>

              {!isProd && (
                <div className="p-4 bg-stone-900 border border-stone-800 text-stone-300 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <span className="text-[10px] font-bold text-stone-500 font-mono uppercase tracking-widest">WEBHOOK SIGNATURE INJECTOR</span>
                    <span className="text-[8px] font-mono text-brand-soft uppercase bg-brand-primary/20 border border-brand-primary/10 px-2 py-0.5 rounded">
                      Security Test Tool
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] text-stone-400 font-mono uppercase tracking-wider block mb-1">Webhook Topic</label>
                      <select
                        value={testTopic}
                        onChange={(e) => setTestTopic(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 text-stone-200 rounded-lg p-2 focus:outline-none"
                      >
                        <option value="Deals">Deals (Triggers Intake/Closing compliance)</option>
                        <option value="Contacts">Contacts (Triggers CRM profile sync)</option>
                        <option value="Showings">Showings (Triggers Lockbox log updates)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-stone-400 font-mono uppercase tracking-wider block mb-1">Record ID to Sync</label>
                      <input
                        type="text"
                        value={testRecordId}
                        onChange={(e) => setTestRecordId(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 text-stone-200 rounded-lg p-2 font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleTestWebhookClick}
                    className="w-full py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg text-xs font-mono font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Signed Test Webhook Payload</span>
                  </button>

                  {testLog && (
                    <pre className="p-3 bg-stone-950 border border-stone-800 rounded-xl font-mono text-[9px] text-brand-soft whitespace-pre-wrap leading-relaxed">
                      {testLog}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {/* WORKFLOW MAPPINGS TAB */}
          {activeTab === 'workflows' && (
            <div className="space-y-4 animate-fade-in">
              <h4 className="text-sm font-bold text-text-primary">Integrations Compliance Guards</h4>
              <div className="space-y-4">
                {rechatWorkflowMappings.map((map) => (
                  <div key={map.guardName} className="border border-border-subtle rounded-2xl p-4 bg-secondary-surface/40 space-y-2">
                    <div className="flex justify-between items-center select-none">
                      <span className="font-serif font-bold text-sm text-text-primary">{map.guardName}</span>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-soft text-brand-primary">
                        Topic: {map.rechatTopic}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{map.logicDescription}</p>
                    
                    <div className="pt-2 border-t border-border-soft/60 space-y-1.5 text-[11px]">
                      <div>
                        <span className="font-mono text-[9px] text-text-tertiary block">MONITORED SCHEMAS:</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {map.monitoredFields.map(f => (
                            <span key={f} className="bg-stone-100 px-1.5 py-0.2 rounded font-mono text-[9px] text-text-secondary">{f}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-mono text-[9px] text-text-tertiary block">PROPOSED OUTBOUND ACTIONS:</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-text-secondary mt-1">
                          {map.proposedActions.map(act => (
                            <li key={act}>{act}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WRITEBACK RULES TAB */}
          {activeTab === 'writeback' && (
            <div className="space-y-5 animate-fade-in text-xs leading-relaxed text-text-secondary">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-text-primary">Approval-Gated Writeback Rules</h4>
                <p>
                  To secure Rechat database integrity and prevent unauthorized external notifications, shapework enforces a strict <strong>Human-in-the-loop</strong> policy:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-border-subtle rounded-2xl p-4 bg-secondary-surface/40 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-text-primary">
                    <Shield className="w-4 h-4 text-brand-primary" />
                    <span>Quarantine Phase</span>
                  </div>
                  <p className="text-[11px]">
                    All API writes (e.g. creating tasks, adding notes, updating listings) are intercepted and held in the Action Center queue as pending proposals. No writeback occurs automatically.
                  </p>
                </div>

                <div className="border border-border-subtle rounded-2xl p-4 bg-secondary-surface/40 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-text-primary">
                    <CheckCircle className="w-4 h-4 text-brand-green" />
                    <span>Coordinator Sign-Off</span>
                  </div>
                  <p className="text-[11px]">
                    Once a Coordinator reviews the evidence and clicks "EXECUTE", the backend issues a verified Bearer token request to Rechat. A ledger event logs the authorization details.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl flex items-start gap-2.5 text-amber-800 text-[11px]">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold">Strict Production Storage Warning</span>
                  <p className="leading-normal">
                    This sandbox environment manages token state in local memory. For production environments, token storage must be encrypted utilizing a secure credentials vault or database encryption keys (AES-256-GCM).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* LOGS TAB */}
          {activeTab === 'logs' && (
            <div className="space-y-4 animate-fade-in">
              <h4 className="text-sm font-bold text-text-primary">Rechat Execution Audit Trail</h4>
              
              {rechatLogs.length > 0 ? (
                <div className="space-y-2 text-xs font-mono">
                  {rechatLogs.map((log: any) => (
                    <div key={log.id} className="p-3 bg-secondary-surface border border-border-subtle rounded-xl space-y-1">
                      <div className="flex justify-between text-[10px] text-text-tertiary">
                        <span>{log.timestamp}</span>
                        <span>{log.impact_area.toUpperCase()}</span>
                      </div>
                      <p className="text-text-primary text-[11px] font-semibold">{log.action_description}</p>
                      <div className="text-[9px] text-text-secondary flex justify-between pt-1 border-t border-border-soft/40">
                        <span>Operator: {log.user_name} ({log.user_role})</span>
                        {log.impact_property && <span>Target: {log.impact_property}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-text-tertiary">
                  No Rechat integration sync or webhook events recorded in this session.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border-subtle bg-secondary-surface shrink-0 flex justify-between items-center select-none">
          <span className="text-[10px] text-text-tertiary font-mono">NEst Realty Operations System</span>
          {rechatStatus.connected && (
            <button
              onClick={async () => {
                await onDisconnect();
                onClose();
              }}
              className="px-3.5 py-1.5 border border-risk-red text-risk-red hover:bg-risk-red-soft rounded-lg text-xs font-mono font-bold transition-all cursor-pointer"
            >
              Disconnect Partner Integration
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
