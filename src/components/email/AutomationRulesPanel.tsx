/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, ShieldAlert, AlertTriangle, Eye, Shield, Save, CheckCircle2 } from 'lucide-react';
import { AutomationRule, AutomationPolicy } from '../../types/shapework';

interface AutomationRulesPanelProps {
  rules: AutomationRule[];
  policy: AutomationPolicy;
  onSaveConfig: (updatedRules: AutomationRule[], updatedPolicy: AutomationPolicy) => void;
}

export default function AutomationRulesPanel({
  rules,
  policy,
  onSaveConfig
}: AutomationRulesPanelProps) {
  const [localRules, setLocalRules] = useState<AutomationRule[]>(rules || []);
  const [localPolicy, setLocalPolicy] = useState<AutomationPolicy>(policy || {
    redact_sensitive_data: true,
    business_only: true,
    notify_broker_on_escalation: true,
    external_requires_approval: true
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleToggleRule = (id: string) => {
    setLocalRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleThresholdChange = (id: string, val: number) => {
    setLocalRules(prev => prev.map(r => r.id === id ? { ...r, confidence_threshold: val } : r));
  };

  const handleTogglePolicy = (key: keyof AutomationPolicy) => {
    setLocalPolicy(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    onSaveConfig(localRules, localPolicy);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const getCategoryColor = (category: AutomationRule['category']) => {
    switch (category) {
      case 'high':
        return 'border-status-atrisk/30 text-status-atrisk bg-status-atrisk-soft/30';
      case 'medium':
        return 'border-status-attention/30 text-status-attention bg-status-attention-soft/30';
      case 'low':
      default:
        return 'border-brand-green/30 text-brand-green bg-brand-green-soft/30';
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Automation Rules list */}
        <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center pb-2 border-b border-border-subtle/50">
            <div>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">AI Operations Safeguards Policy</h3>
              <p className="text-[11px] text-text-secondary mt-0.5">Toggle automation dispatches and adjust the confidence metrics required for automatic execution.</p>
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-hover text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors shrink-0"
            >
              {saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{saveSuccess ? 'Saved' : 'Save Rules'}</span>
            </button>
          </div>

          <div className="space-y-4 pt-1">
            {localRules.map((rule) => {
              return (
                <div 
                  key={rule.id}
                  className="p-4 bg-secondary-surface rounded-xl border border-border-subtle flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-strong-border transition-all"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-xs text-text-primary">{rule.name}</h4>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase shrink-0 ${getCategoryColor(rule.category)}`}>
                        {rule.category} Risk
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed pr-4">
                      {rule.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-none pt-3 md:pt-0 mt-1 md:mt-0">
                    {/* Confidence Threshold Selector */}
                    {rule.enabled && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-text-tertiary">Min Conf:</span>
                        <input
                          type="range"
                          min="50"
                          max="98"
                          value={rule.confidence_threshold}
                          onChange={(e) => handleThresholdChange(rule.id, parseInt(e.target.value))}
                          className="w-20 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-brand-green"
                        />
                        <span className="font-mono text-xs font-bold text-text-secondary w-8 text-right">
                          {rule.confidence_threshold}%
                        </span>
                      </div>
                    )}

                    {/* Enable Toggle Button */}
                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      className="text-text-secondary hover:text-text-primary transition-colors focus:outline-none"
                    >
                      {rule.enabled ? (
                        <ToggleRight className="w-8 h-8 text-brand-green" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-text-tertiary" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Global Data & Governance Controls */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Data & Privacy Controls</h3>
              <p className="text-[11px] text-text-secondary mt-0.5">Global constraints enforced on AI monitoring pipelines.</p>
            </div>

            <div className="space-y-4 pt-1">
              {/* Redact sensitive data */}
              <div className="flex items-start justify-between gap-3 text-xs">
                <div className="space-y-0.5 flex-1 pr-2">
                  <h4 className="font-bold text-text-primary">Redact Sensitive Records</h4>
                  <p className="text-[10px] text-text-secondary leading-relaxed">
                    Instantly redact wire routing numbers, social security items, tax numbers, and personal passwords in parsed body logs.
                  </p>
                </div>
                <button onClick={() => handleTogglePolicy('redact_sensitive_data')} className="shrink-0 pt-0.5 focus:outline-none">
                  {localPolicy.redact_sensitive_data ? (
                    <ToggleRight className="w-7 h-7 text-brand-green" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-text-tertiary" />
                  )}
                </button>
              </div>

              {/* Business only communications */}
              <div className="flex items-start justify-between gap-3 text-xs">
                <div className="space-y-0.5 flex-1 pr-2">
                  <h4 className="font-bold text-text-primary">Filter Business Signals Only</h4>
                  <p className="text-[10px] text-text-secondary leading-relaxed">
                    Filter out personal emails or non-brokerage transactions (e.g. social calendars, subscription mail).
                  </p>
                </div>
                <button onClick={() => handleTogglePolicy('business_only')} className="shrink-0 pt-0.5 focus:outline-none">
                  {localPolicy.business_only ? (
                    <ToggleRight className="w-7 h-7 text-brand-green" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-text-tertiary" />
                  )}
                </button>
              </div>

              {/* Notify Broker on Escalation */}
              <div className="flex items-start justify-between gap-3 text-xs">
                <div className="space-y-0.5 flex-1 pr-2">
                  <h4 className="font-bold text-text-primary">Escalate High-Risk Issues</h4>
                  <p className="text-[10px] text-text-secondary leading-relaxed">
                    Notify brokerage owners immediately via email if compliance issues or legal objection risks remain pending for over 24 hours.
                  </p>
                </div>
                <button onClick={() => handleTogglePolicy('notify_broker_on_escalation')} className="shrink-0 pt-0.5 focus:outline-none">
                  {localPolicy.notify_broker_on_escalation ? (
                    <ToggleRight className="w-7 h-7 text-brand-green" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-text-tertiary" />
                  )}
                </button>
              </div>

              {/* External requires approval */}
              <div className="flex items-start justify-between gap-3 text-xs">
                <div className="space-y-0.5 flex-1 pr-2">
                  <h4 className="font-bold text-text-primary">Outbound Guardrails</h4>
                  <p className="text-[10px] text-text-secondary leading-relaxed">
                    All client or external agent emails compiled by shapework require manual reviewer approval prior to dispatch.
                  </p>
                </div>
                <button onClick={() => handleTogglePolicy('external_requires_approval')} className="shrink-0 pt-0.5 focus:outline-none">
                  {localPolicy.external_requires_approval ? (
                    <ToggleRight className="w-7 h-7 text-brand-green" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-text-tertiary" />
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
