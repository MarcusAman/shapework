/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RefreshCw, ArrowRight, Eye, Cpu } from 'lucide-react';
import { IntegrationConnector } from '../../types/integrations';
import IntegrationReadinessBadge from './IntegrationReadinessBadge';
import BrandIcon from '../ui/BrandIcon';

interface IntegrationCardProps {
  connector: IntegrationConnector;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onTestSync: (id: string) => void;
  isSyncing: boolean;
  key?: any;
}

export default function IntegrationCard({
  connector,
  onSelect,
  onToggle,
  onTestSync,
  isSyncing
}: IntegrationCardProps) {
  const isConnected = connector.connected;

  return (
    <div
      onClick={() => onSelect(connector.id)}
      className={`p-4 rounded-xl border flex flex-col justify-between space-y-4 hover:border-border-medium hover:shadow-md cursor-pointer transition-all ${
        isConnected ? 'bg-surface border-border-soft shadow-soft' : 'bg-surface-subtle/50 border-border-soft/60'
      }`}
    >
      {/* Header Info */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 shadow-sm ${
            isConnected ? 'bg-surface border-border-soft' : 'bg-stone-100 border-stone-200'
          }`}>
            <BrandIcon name={connector.logoKey} className="w-5.5 h-5.5" />
          </div>
          <div>
            <h4 className="font-bold text-text-primary text-xs leading-tight">{connector.name}</h4>
            <span className="text-[9px] text-text-tertiary font-mono uppercase tracking-wider block mt-0.5">
              {connector.category}
            </span>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(connector.id);
          }}
          className={`w-9 h-5.5 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 ${
            isConnected ? 'bg-brand-900' : 'bg-stone-300'
          }`}
        >
          <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transform transition-transform ${
            isConnected ? 'translate-x-3.5' : 'translate-x-0'
          }`} />
        </button>
      </div>

      {/* Purpose and Badges */}
      <div className="space-y-2">
        <p className="text-[11px] text-text-secondary leading-normal line-clamp-2">
          {connector.description}
        </p>
        
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <IntegrationReadinessBadge readiness={connector.readiness} />
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded font-mono select-none bg-stone-100 text-text-secondary border border-border-soft/40">
            {connector.authMethod.toUpperCase()}
          </span>
          {connector.dependentAgents.length > 0 && (
            <span className="flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 bg-brand-100 text-brand-900 rounded font-mono border border-brand-900/5">
              <Cpu className="w-2.5 h-2.5" />
              <span>{connector.dependentAgents.length} AGENTS</span>
            </span>
          )}
        </div>
      </div>

      {/* Connection Stats / Sync Log */}
      {isConnected && (
        <div className="pt-3.5 border-t border-border-soft/50 flex items-center justify-between text-[10px] text-text-secondary font-mono">
          <div className="flex items-center gap-1">
            <span className="text-text-tertiary">Synced:</span>
            <span className="font-semibold text-text-primary">{connector.recordsSynchronized}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTestSync(connector.id);
            }}
            className="flex items-center gap-1 text-text-secondary hover:text-brand-900 transition-colors py-0.5 px-1.5 rounded hover:bg-stone-50"
            title="Sync this connection now"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      )}
    </div>
  );
}
