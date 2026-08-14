/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ryan Shield Owner Experience — Phase C Light-Mode Redesign
 * Migrated to canonical Shapework B1/B2/B3 design primitives.
 * Focuses on principal escalation hierarchy ("Needs Ryan") with quiet proof of team handling.
 */

import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, ShieldCheck, ArrowRight, Clock, Users, Building2 } from 'lucide-react';
import type { RyanShieldData, NeedsRyanItem } from './adapters';
import SOPRunsPage from '../sops/SOPRunsPage';
import NeedsRyanActionDrawer from './NeedsRyanActionDrawer';
import {
  Card,
  Button,
  IconButton,
  Badge,
  StatusBadge,
  MetricTile,
  MetricGroup,
  ProgressBar,
  SegmentedControl
} from '../ui';

interface RyanShieldPageProps {
  data: RyanShieldData;
  onAction?: (action: string, item: NeedsRyanItem) => void | Promise<void>;
  state?: any;
}

export default function RyanShieldPage({ data, onAction, state }: RyanShieldPageProps) {
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'runs'>('dashboard');
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<NeedsRyanItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [extraProtectedItems, setExtraProtectedItems] = useState<any[]>([]);

  const handleOpenDrawer = (item: NeedsRyanItem) => {
    setSelectedDrawerItem(item);
    setIsDrawerOpen(true);
  };

  const handleDrawerResolve = async (actionType: string, payload: any) => {
    if (selectedDrawerItem) {
      setReviewedIds(prev => new Set([...prev, selectedDrawerItem.id]));
      setExtraProtectedItems(prev => [
        {
          id: selectedDrawerItem.id,
          request: selectedDrawerItem.type,
          routedTo: payload.targetOwnerName || 'Ann Gunn (Operations)',
          timeSaved: '45 min'
        },
        ...prev
      ]);

      if (onAction) {
        await onAction(actionType, selectedDrawerItem);
      }
    }
  };

  const activeNeedsRyan = data.needsRyan.filter(i => !reviewedIds.has(i.id));

  const handledExamples = [
    { category: 'Marketing request', handler: 'Melissa Gagliardi', title: 'Marketing' },
    { category: 'Commission question', handler: 'James Fort', title: 'Firm Finance' },
    { category: 'Lockbox issue', handler: 'Ann Gunn', title: 'Operations Director' },
    { category: 'Agent question', handler: 'Jessica Vance', title: 'Broker-in-Charge' },
  ];

  return (
    <div className="space-y-6 text-left select-none">
      {/* Sub-tab Switcher */}
      <div className="flex items-center justify-between gap-4 border-b border-[var(--sw-border)] pb-3">
        <SegmentedControl
          value={activeSubTab}
          onChange={(val) => setActiveSubTab(val as any)}
          options={[
            { id: 'dashboard', label: 'Shield Dashboard' },
            { id: 'runs', label: 'SOP Checklist Runs' }
          ]}
        />
      </div>

      {activeSubTab === 'dashboard' ? (
        <div className="space-y-6 animate-fade-in">
          {/* Header Context */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--sw-text-primary)]">
                Good morning, Ryan
              </h1>
              <p className="text-xs text-[var(--sw-text-secondary)] mt-0.5">
                <span className="text-[var(--state-warning)] font-bold">{activeNeedsRyan.length} items</span> need you. The team handled <span className="text-[var(--brand-secondary)] font-bold">24</span> without you.
              </p>
            </div>

            <Badge variant="brand" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
              Ryan Owner Shield Active
            </Badge>
          </div>

          {/* Metrics Overview */}
          <MetricGroup columns={3}>
            <MetricTile
              label="Needs Ryan"
              value={activeNeedsRyan.length}
              sublabel="Escalations pending principal decision"
              variant={activeNeedsRyan.length > 0 ? "warning" : "success"}
              icon={<AlertTriangle className="w-4 h-4" />}
            />
            <MetricTile
              label="Routed For You"
              value="24"
              sublabel="Requests resolved by team without escalating"
              variant="success"
              icon={<CheckCircle className="w-4 h-4" />}
            />
            <MetricTile
              label="At Risk"
              value="1"
              sublabel="Past response window threshold"
              variant="danger"
              icon={<Clock className="w-4 h-4" />}
            />
          </MetricGroup>

          {/* Visually Dominant "Needs Ryan" Section */}
          <Card elevated className="border-l-4 border-l-[var(--state-warning)] space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--sw-border)] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[var(--state-warning)] shrink-0" />
                <h3 className="text-base font-bold text-[var(--sw-text-primary)]">
                  Needs Ryan ({activeNeedsRyan.length})
                </h3>
              </div>
              <span className="text-xs text-[var(--sw-text-secondary)]">Priority Principal Action Queue</span>
            </div>

            {activeNeedsRyan.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--sw-text-secondary)] space-y-1">
                <CheckCircle className="w-6 h-6 text-[var(--state-success)] mx-auto mb-2" />
                <p className="font-bold text-[var(--sw-text-primary)]">Zero pending escalations for Ryan.</p>
                <p>All active compliance and operational requests are handled.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeNeedsRyan.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-[var(--sw-canvas)] border border-[var(--sw-border)] rounded-[var(--radius-md)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-[var(--sw-border-strong)]"
                  >
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[var(--sw-text-primary)]">{item.type}</span>
                        <StatusBadge status={item.urgency === 'urgent' ? 'at_risk' : 'awaiting_approval'} size="sm" />
                      </div>
                      <p className="text-xs text-[var(--sw-text-secondary)]">{item.summary}</p>
                      <span className="text-[11px] text-[var(--sw-text-muted)] font-mono">{item.impact}</span>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenDrawer(item)}
                      className="shrink-0"
                    >
                      Resolve Action
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 1-Click Monthly NCREC Trust Reconciliation Card */}
          <Card className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--sw-border)] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-secondary)] font-mono block">
                  NCREC Compliance Engine • Monthly Escrow Trust Reconciliation
                </span>
                <h3 className="text-sm font-bold text-[var(--sw-text-primary)] mt-0.5">
                  July 2026 Monthly Escrow Trust Reconciliation Package
                </h3>
                <p className="text-xs text-[var(--sw-text-secondary)] mt-0.5">
                  3-Way Bank Ledger vs. Earnest Deposit Log matched across all 76 Nest Realty Wilmington transactions.
                </p>
              </div>

              <Button variant="primary" size="sm" icon={<CheckCircle className="w-4 h-4" />}>
                1-Click Sign NCREC Escrow Package
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-[var(--sw-canvas)] border border-[var(--sw-border)] rounded-[var(--radius-sm)]">
                <span className="text-[10px] font-semibold text-[var(--sw-text-secondary)] uppercase">Escrow Account Balance</span>
                <p className="text-base font-bold text-[var(--sw-text-primary)] font-mono mt-0.5">$1,482,910.00</p>
                <span className="text-[10px] text-[var(--state-success)] font-medium">✓ Balanced to zero discrepancy</span>
              </div>
              <div className="p-3 bg-[var(--sw-canvas)] border border-[var(--sw-border)] rounded-[var(--radius-sm)]">
                <span className="text-[10px] font-semibold text-[var(--sw-text-secondary)] uppercase">Auto CDA Dispatches</span>
                <p className="text-base font-bold text-[var(--sw-text-primary)] font-mono mt-0.5">14 Closing Files</p>
                <span className="text-[10px] text-[var(--sw-text-secondary)] font-medium">Auto-emailed agent links</span>
              </div>
              <div className="p-3 bg-[var(--sw-canvas)] border border-[var(--sw-border)] rounded-[var(--radius-sm)]">
                <span className="text-[10px] font-semibold text-[var(--sw-text-secondary)] uppercase">NCREC Audit Trail</span>
                <p className="text-base font-bold text-[var(--sw-text-primary)] font-mono mt-0.5">21-Day Clock Guard</p>
                <span className="text-[10px] text-[var(--state-success)] font-medium">0 compliance violations</span>
              </div>
            </div>
          </Card>

          {/* Team Capacity & Operational Shield Proof */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--sw-border)] pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)]">What Shapework Handled</h4>
                <Badge variant="success">24 Handled</Badge>
              </div>

              <div className="space-y-3">
                {handledExamples.map((ex, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2.5 bg-[var(--sw-canvas)] border border-[var(--sw-border)] rounded-[var(--radius-sm)]">
                    <span className="font-medium text-[var(--sw-text-primary)]">{ex.category}</span>
                    <span className="text-[var(--sw-text-secondary)] font-medium">{ex.handler}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--sw-border)] pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)]">Team Operational Capacity</h4>
                <Users className="w-4 h-4 text-[var(--sw-text-secondary)]" />
              </div>

              <div className="space-y-3">
                <ProgressBar label="Melissa Gagliardi (Marketing Lead)" value={82} max={100} variant="warning" />
                <ProgressBar label="Ann Gunn (Operations Director)" value={45} max={100} variant="success" />
                <ProgressBar label="Jessica Vance (Virtual Assistant)" value={68} max={100} variant="brand" />
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <SOPRunsPage state={state} />
      )}

      {/* Action Drawer */}
      {selectedDrawerItem && (
        <NeedsRyanActionDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          item={selectedDrawerItem}
          onResolve={handleDrawerResolve}
        />
      )}
    </div>
  );
}
