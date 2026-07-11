/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Settings, RefreshCw, BarChart2, ShieldCheck } from 'lucide-react';
import ConnectedEmailAccounts from './ConnectedEmailAccounts';
import EmailProcessingPipeline from './EmailProcessingPipeline';
import AutomationRulesPanel from './AutomationRulesPanel';
import MatchReviewQueue from './MatchReviewQueue';
import { EmailAccount, EmailMessage, AutomationRule, AutomationPolicy } from '../../types/shapework';

interface EmailIntelligenceProps {
  accounts: EmailAccount[];
  messages: EmailMessage[];
  rules: AutomationRule[];
  policy: AutomationPolicy;
  onToggleConnection: (id: string) => void;
  onSyncAccount: (id: string) => void;
  onProcessMessage: (id: string, selectProperty?: string) => void;
  onSaveConfig: (updatedRules: AutomationRule[], updatedPolicy: AutomationPolicy) => void;
}

export default function EmailIntelligence({
  accounts,
  messages,
  rules,
  policy,
  onToggleConnection,
  onSyncAccount,
  onProcessMessage,
  onSaveConfig
}: EmailIntelligenceProps) {
  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'pipeline' | 'review' | 'rules'>('accounts');

  // Sum stats
  const totalProcessed = (accounts || []).reduce((acc, curr) => acc + (curr.processed_count || 0), 0);
  const totalMatched = (accounts || []).reduce((acc, curr) => acc + (curr.matched_count || 0), 0);
  const totalLowConfidence = (accounts || []).reduce((acc, curr) => acc + (curr.low_confidence_count || 0), 0);

  return (
    <div className="space-y-6 text-left">
      
      {/* Page Header */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-5 h-5 text-brand-green" />
              <span>Email Intelligence Core</span>
            </h2>
            <p className="text-xs text-text-secondary mt-0.5 font-medium">Turn authorized business communication into structured operational action.</p>
          </div>

          {/* Sub-tab selection */}
          <div className="flex bg-secondary-surface p-1 rounded-lg border border-border-subtle gap-1 text-xs font-semibold">
            <button
              onClick={() => setActiveSubTab('accounts')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeSubTab === 'accounts' ? 'bg-white text-text-primary shadow-sm border border-border-subtle' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Connected Accounts
            </button>
            <button
              onClick={() => setActiveSubTab('pipeline')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeSubTab === 'pipeline' ? 'bg-white text-text-primary shadow-sm border border-border-subtle' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Email Pipeline
            </button>
            <button
              onClick={() => setActiveSubTab('review')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeSubTab === 'review' ? 'bg-white text-text-primary shadow-sm border border-border-subtle' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Match Review
            </button>
            <button
              onClick={() => setActiveSubTab('rules')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeSubTab === 'rules' ? 'bg-white text-text-primary shadow-sm border border-border-subtle' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Automation Safeguards
            </button>
          </div>
        </div>

        {/* Global summary stats banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-border-subtle/50 text-xs font-mono font-bold">
          <div className="p-3 bg-secondary-surface rounded-xl border border-border-subtle/50">
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider block">Sync Mailboxes</span>
            <span className="text-lg text-text-primary mt-1 block">{(accounts || []).filter(a => a.status === 'connected').length} / {(accounts || []).length}</span>
          </div>
          <div className="p-3 bg-secondary-surface rounded-xl border border-border-subtle/50">
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider block">Total Ingested Messages</span>
            <span className="text-lg text-text-primary mt-1 block">{totalProcessed}</span>
          </div>
          <div className="p-3 bg-secondary-surface rounded-xl border border-border-subtle/50">
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider block">Escrow File Matches</span>
            <span className="text-lg text-brand-green mt-1 block">{totalMatched} ({Math.round((totalMatched / (totalProcessed || 1)) * 100)}%)</span>
          </div>
          <div className="p-3 bg-secondary-surface rounded-xl border border-border-subtle/50">
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider block">Escalation Warnings</span>
            <span className="text-lg text-status-attention mt-1 block">{totalLowConfidence} pending</span>
          </div>
        </div>
      </div>

      {/* Render sub-tabs */}
      {activeSubTab === 'accounts' && (
        <ConnectedEmailAccounts
          accounts={accounts}
          onToggleConnection={onToggleConnection}
          onSyncAccount={onSyncAccount}
        />
      )}

      {activeSubTab === 'pipeline' && (
        <EmailProcessingPipeline
          messages={messages}
          onProcessMessage={onProcessMessage}
        />
      )}

      {activeSubTab === 'review' && (
        <MatchReviewQueue
          messages={messages}
          onProcessMessage={onProcessMessage}
        />
      )}

      {activeSubTab === 'rules' && (
        <AutomationRulesPanel
          rules={rules}
          policy={policy}
          onSaveConfig={onSaveConfig}
        />
      )}

    </div>
  );
}
