/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Play, RefreshCw, AlertTriangle, Info, Check, Zap } from 'lucide-react';
import { IntegrationConnector } from '../../types/integrations';
import IntegrationReadinessBadge from './IntegrationReadinessBadge';
import IntegrationCapabilityGrid from './IntegrationCapabilityGrid';
import IntegrationAgentUsage from './IntegrationAgentUsage';
import IntegrationSetupChecklist from './IntegrationSetupChecklist';
import BrandIcon from '../ui/BrandIcon';

interface IntegrationDrawerProps {
  connector: IntegrationConnector | null;
  onClose: () => void;
  onToggle: (id: string) => void;
  onTestSync: (id: string) => void;
  onTriggerEvent: (id: string) => void;
  onAddRoadmap: (id: string) => void;
  isSyncing: boolean;
}

export default function IntegrationDrawer({
  connector,
  onClose,
  onToggle,
  onTestSync,
  onTriggerEvent,
  onAddRoadmap,
  isSyncing
}: IntegrationDrawerProps) {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [authCredential, setAuthCredential] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  React.useEffect(() => {
    setShowSetup(false);
    setAuthCredential('');
    setIsConnecting(false);
  }, [connector?.id]);
  
  if (!connector) return null;
  const isConnected = connector.connected;

  const triggerEventWithFeedback = (id: string) => {
    onTriggerEvent(id);
    let msg = 'Demo event triggered successfully!';
    if (id === 'i_gmail') msg = 'Gmail signal ingested: "Apex Mortgage escrow clear to close"';
    if (id === 'i_docusign') msg = 'DocuSign completed envelope callback received: "742 Evergreen disclosures"';
    if (id === 'i_dotloop') msg = 'Dotloop loop sync failure warning generated';
    if (id === 'i_skyslope') msg = 'SkySlope compliance exception flagged: "Missing Buyer Broker Agreement"';
    if (id === 'i_reso') msg = 'MLS RESO status update received: "109 Woodlawn set to active"';
    if (id === 'i_fub') msg = 'Follow Up Boss communication warning triggered';
    if (id === 'i_gcal') msg = 'Google Calendar closing date extension sync complete';
    if (id === 'i_twilio') msg = 'Twilio SMS signal ingested: "Buyer offer withdrawal intent"';
    if (id === 'i_quickbooks' || id === 'i_qbo') msg = 'QuickBooks Online wire matching complete: Commission paid';

    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Check if this connector supports demo interactive events - enabled for all connected integrations!
  const hasInteractiveEvent = isConnected;

  return (
    <div className="fixed inset-0 overflow-hidden z-50 flex justify-end font-sans">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/35 backdrop-blur-xs transition-opacity" 
      />

      {/* Content wrapper */}
      <div className="w-full max-w-md bg-surface border-l border-border-soft shadow-xl flex flex-col h-full relative z-10 animate-fade-in text-left">
        {/* Header */}
        <div className="p-5 border-b border-border-soft flex items-center justify-between bg-surface-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg border border-border-soft bg-surface flex items-center justify-center shadow-sm shrink-0">
              <BrandIcon name={connector.logoKey} className="w-5.5 h-5.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-primary leading-tight">{connector.name}</h3>
              <p className="text-[10px] text-text-secondary mt-0.5">Integrations Configuration Sheet</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary border border-border-soft p-1.5 rounded-lg hover:bg-surface-subtle transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable details */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Success toast inside drawer */}
          {successMsg && (
            <div className="p-3 bg-brand-100 text-accent-green text-[10px] rounded-xl flex items-center gap-2 border border-accent-green/10 font-semibold animate-pulse">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Warning banner */}
          <div className="p-3 bg-brand-100/30 border border-border-soft text-text-primary text-[10px] rounded-xl flex items-start gap-2.5 leading-relaxed">
            <Info className="w-4.5 h-4.5 shrink-0 text-brand-900 mt-0.5" />
            <div>
              <span className="font-bold text-xs">Nest Realty Synthetic Sandbox</span>
              <p className="text-[9px] text-text-secondary font-medium mt-0.5">
                This integration is configured in synthetic demo mode. No production credentials or live accounts will be connected.
              </p>
            </div>
          </div>

          {/* Connection status */}
          <div className="p-3.5 rounded-xl border border-border-soft flex items-center justify-between text-xs bg-surface-subtle">
            <span className="text-text-secondary font-medium">Integration Status:</span>
            <div className="flex items-center gap-1.5">
              <IntegrationReadinessBadge readiness={connector.readiness} />
              <span className={`px-2 py-0.5 border rounded text-[9px] font-bold uppercase tracking-wider font-mono select-none ${
                isConnected ? 'bg-brand-100 text-accent-green border-accent-green/10' : 'bg-stone-100 text-text-tertiary border-border-soft'
              }`}>
                {isConnected ? 'Connected' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Purpose & Description */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Purpose</span>
            <p className="text-xs text-text-secondary leading-relaxed font-medium">
              {connector.description}
            </p>
          </div>

          {/* Setup Checklist */}
          {connector.setupChecklist && connector.setupChecklist.length > 0 && (
            <IntegrationSetupChecklist checklist={connector.setupChecklist} />
          )}

          {/* Schema Capabilities */}
          <IntegrationCapabilityGrid connector={connector} />

          {/* Dependent Agents */}
          <IntegrationAgentUsage agents={connector.dependentAgents} />

          {/* Example Automations */}
          {connector.automationExamples && connector.automationExamples.length > 0 && (
            <div className="space-y-1.5 text-xs">
              <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">
                Automation triggers
              </span>
              <div className="p-3.5 border border-border-soft rounded-xl bg-surface-subtle/50 space-y-1.5">
                {connector.automationExamples.map((ex, idx) => (
                  <div key={idx} className="flex gap-2 items-start text-[11px] text-text-secondary">
                    <span className="text-brand-900 font-bold">•</span>
                    <p className="leading-relaxed">{ex}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Notes */}
          {connector.riskNotes && connector.riskNotes.length > 0 && (
            <div className="space-y-1.5 text-xs">
              <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">
                Governance Safeguards
              </span>
              <div className="p-3.5 border border-status-attention/10 rounded-xl bg-status-attention-soft/10 text-status-attention">
                {connector.riskNotes.map((note, idx) => (
                  <p key={idx} className="leading-relaxed text-[11px] font-medium">
                    ⚠️ {note}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Interactive event triggers area */}
          {isConnected && hasInteractiveEvent && (
            <div className="p-4 border border-brand-900/10 rounded-2xl bg-brand-100/20 space-y-3">
              <div className="flex items-center gap-1.5 text-brand-900">
                <Zap className="w-4 h-4 fill-brand-900/20" />
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Interactive Demo Playback</span>
              </div>
              <p className="text-[10px] text-text-secondary leading-relaxed">
                Trigger a synthetic mock signal from this integration to verify agent workflow activation, action staging, and ledger audit logging.
              </p>
              <button
                onClick={() => triggerEventWithFeedback(connector.id)}
                className="w-full py-2 bg-brand-900 hover:bg-brand-800 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Trigger Mock Event Signal</span>
              </button>
            </div>
          )}

          {!isConnected && showSetup && (
            <div className="p-4 border border-border-medium rounded-lg bg-surface-subtle space-y-4 animate-fade-in text-left">
              <div className="border-b border-border-soft pb-1.5">
                <span className="text-[9px] font-mono font-bold text-brand-900 uppercase tracking-wider block">CREDENTIAL CONFIGURATION</span>
              </div>
              
              {connector.authMethod === 'oauth' && (
                <div className="space-y-3">
                  <p className="text-[10px] text-text-secondary leading-relaxed">
                    Authorization protocol: **OAuth 2.0 Web Flow**. shapework. will request authorization scopes to sync records immutably.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsConnecting(true);
                      setTimeout(() => {
                        onToggle(connector.id);
                        setIsConnecting(false);
                        setShowSetup(false);
                      }, 1200);
                    }}
                    disabled={isConnecting}
                    className="w-full py-2 bg-brand-900 hover:bg-brand-800 text-white rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : null}
                    <span>{isConnecting ? 'ESTABLISHING HANDSHAKE...' : '[ SIMULATE OAUTH WEB FLOW ]'}</span>
                  </button>
                </div>
              )}

              {(connector.authMethod === 'api_key' || connector.authMethod === 'partner_api') && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold font-mono text-text-secondary uppercase">Secret Endpoint API Key</label>
                    <input
                      type="password"
                      placeholder="sk_live_..."
                      value={authCredential}
                      onChange={(e) => setAuthCredential(e.target.value)}
                      className="w-full p-2 border border-border-medium rounded bg-surface font-mono text-xs focus:outline-none focus:border-brand-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsConnecting(true);
                      setTimeout(() => {
                        onToggle(connector.id);
                        setIsConnecting(false);
                        setShowSetup(false);
                      }, 1200);
                    }}
                    disabled={isConnecting || !authCredential}
                    className="w-full py-2 bg-brand-900 hover:bg-brand-800 text-white rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : null}
                    <span>{isConnecting ? 'VALIDATING API KEY...' : '[ SAVE & CONNECT ENDPOINT ]'}</span>
                  </button>
                </div>
              )}

              {connector.authMethod === 'webhook' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold font-mono text-text-secondary uppercase">Ingest Endpoint URL</label>
                    <input
                      type="text"
                      readOnly
                      value={`https://api.shapework.co/v1/webhooks/inbound/${connector.id}`}
                      className="w-full p-2 border border-border-medium rounded bg-surface-subtle font-mono text-[9px] select-all focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold font-mono text-text-secondary uppercase">Signing Secret Key</label>
                    <input
                      type="text"
                      placeholder="whsec_..."
                      value={authCredential}
                      onChange={(e) => setAuthCredential(e.target.value)}
                      className="w-full p-2 border border-border-medium rounded bg-surface font-mono text-xs focus:outline-none focus:border-brand-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsConnecting(true);
                      setTimeout(() => {
                        onToggle(connector.id);
                        setIsConnecting(false);
                        setShowSetup(false);
                      }, 1200);
                    }}
                    disabled={isConnecting || !authCredential}
                    className="w-full py-2 bg-brand-900 hover:bg-brand-800 text-white rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : null}
                    <span>{isConnecting ? 'LISTENING FOR WEBHOOK...' : '[ SAVE & START WEBHOOK LISTENER ]'}</span>
                  </button>
                </div>
              )}

              {connector.authMethod === 'csv' && (
                <div className="space-y-3">
                  <div className="border border-dashed border-border-medium rounded-lg p-5 text-center bg-surface hover:bg-surface-subtle transition-colors cursor-pointer select-none">
                    <span className="text-[10px] text-text-secondary font-mono">Drop transaction spreadsheet file (.CSV) here</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsConnecting(true);
                      setTimeout(() => {
                        onToggle(connector.id);
                        setIsConnecting(false);
                        setShowSetup(false);
                      }, 1200);
                    }}
                    disabled={isConnecting}
                    className="w-full py-2 bg-brand-900 hover:bg-brand-800 text-white rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : null}
                    <span>{isConnecting ? 'PARSING FILE SCHEMA...' : '[ SIMULATE DATA IMPORT ]'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="p-5 border-t border-border-soft bg-surface-subtle flex flex-col gap-2">
          {/* Test sync button */}
          {isConnected && (
            <button
              onClick={() => onTestSync(connector.id)}
              disabled={isSyncing}
              className="w-full py-2 bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border border-border-soft hover:border-border-medium rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Test Connection Synchronizer</span>
            </button>
          )}

          {/* Add to roadmap button if roadmap status */}
          {connector.readiness === 'production_roadmap' && (
            <button
              onClick={() => onAddRoadmap(connector.id)}
              className="w-full py-2 bg-surface hover:bg-brand-100/40 text-brand-900 hover:text-brand-900 border border-border-soft hover:border-brand-900/20 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <span>Add to Production Roadmap</span>
            </button>
          )}

          {/* Disconnect/Connect */}
          <button
            onClick={() => {
              if (isConnected) {
                onToggle(connector.id);
              } else {
                setShowSetup(!showSetup);
              }
            }}
            className={`w-full py-2 text-xs font-bold rounded-lg transition-colors border ${
              isConnected 
                ? 'border-accent-red/30 hover:bg-red-50 text-accent-red font-mono uppercase tracking-wider' 
                : showSetup 
                  ? 'border-border-medium hover:bg-stone-50 text-text-secondary font-mono uppercase tracking-wider'
                  : 'bg-brand-900 hover:bg-brand-800 border-transparent text-white shadow-sm font-mono uppercase tracking-wider'
            }`}
          >
            {isConnected ? '[ Disconnect Connection ]' : showSetup ? '[ Cancel Setup ]' : '[ Activate Connector ]'}
          </button>
        </div>
      </div>
    </div>
  );
}
