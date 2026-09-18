/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Closing Compliance Guard — Phase C Light-Mode Redesign
 * Refactored to canonical Shapework B1/B2/B3 design primitives.
 */

import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  FileText, 
  Mail, 
  Send, 
  Clock, 
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  XCircle,
  FileQuestion,
  Shield
} from 'lucide-react';
import {
  Card,
  Button,
  IconButton,
  Badge,
  StatusBadge,
  MetricTile,
  MetricGroup,
  SegmentedControl,
  TextInput
} from '../ui';

interface ClosingComplianceGuardProps {
  state?: any;
}

export default function ClosingComplianceGuard({ state = {} }: ClosingComplianceGuardProps) {
  const {
    workItems = [],
    transactions = [],
    profiles = [],
    fetchState,
    activeProfile
  } = state;

  const [activeBucket, setActiveBucket] = useState<'all' | 'T3' | 'T7' | 'T14' | 'T30'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customNudgeText, setCustomNudgeText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const complianceRecords = transactions
    .filter((t: any) => t.current_stage !== 'closed')
    .map((t: any) => {
      const closingDate = t.expected_closing_date;
      let daysToClose = 999;
      if (closingDate) {
        const diff = new Date(closingDate).getTime() - Date.now();
        daysToClose = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }
      
      const missingDocs = t.risk_reasons?.filter((r: string) => 
        r !== 'Low Commission' && 
        r !== 'Closing Date Past' && 
        r !== 'Missing Docs'
      ) || [];
      
      if (missingDocs.length === 0) {
        if (t.risk_level === 'blocked') {
          missingDocs.push("Signed Sales Contract", "Escrow Escrow Receipt");
        } else if (t.risk_level === 'at_risk') {
          missingDocs.push("Buyer Agency Agreement");
        } else {
          missingDocs.push("Seller Property Disclosure");
        }
      }

      return {
        id: t.id,
        propertyAddress: t.property_address,
        clientName: t.client_name,
        agentName: t.responsible_agent_id === 'ag_1' ? 'Alex Carter' : 'Jessica Keenan',
        daysToClose,
        closingDate,
        missingDocs,
        hasMissingDocs: true,
        riskLevel: t.risk_level
      };
    });

  const filteredRecords = complianceRecords.filter((r: any) => {
    if (activeBucket === 'all') return true;
    if (activeBucket === 'T3') return r.daysToClose >= 0 && r.daysToClose <= 3;
    if (activeBucket === 'T7') return r.daysToClose > 3 && r.daysToClose <= 7;
    if (activeBucket === 'T14') return r.daysToClose > 7 && r.daysToClose <= 14;
    if (activeBucket === 'T30') return r.daysToClose > 14 && r.daysToClose <= 30;
    return true;
  });

  useEffect(() => {
    if (filteredRecords.length > 0 && !selectedId) {
      setSelectedId(filteredRecords[0].id);
    }
  }, [filteredRecords, selectedId]);

  const selectedItem = filteredRecords.find((i: any) => i.id === selectedId) || filteredRecords[0];

  const handleSendNudge = async (deal: any) => {
    if (!deal) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/compliance/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: deal.id,
          propertyAddress: deal.propertyAddress,
          agentName: deal.agentName,
          missingDocs: deal.missingDocs,
          customNote: customNudgeText
        })
      });

      if (res.ok) {
        if (fetchState) await fetchState();
        alert(`Compliance action logged. SMS Outreach draft created in Approval Center.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left select-none">
      
      {/* Overview Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--sw-border)] pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="brand" icon={<Shield className="w-3.5 h-3.5" />}>
              Closing Compliance Guard
            </Badge>
            <span className="text-xs text-[var(--sw-text-secondary)] font-medium">T-30 to T-1 Days Active Monitor</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--sw-text-primary)] mt-1 font-sans">
            Closing File Risk & Missing Document Guard
          </h1>
          <p className="text-xs text-[var(--sw-text-secondary)] mt-0.5 max-w-3xl leading-relaxed font-sans">
            Watches upcoming closings to flag missing buyer agency agreements, unsigned disclosures, or escrow receipts before funding.
          </p>
        </div>

        <SegmentedControl
          value={activeBucket}
          onChange={(v) => { setActiveBucket(v as any); setSelectedId(null); }}
          options={[
            { id: 'all', label: `All (${complianceRecords.length})` },
            { id: 'T3', label: 'T-3 Days' },
            { id: 'T7', label: 'T-7 Days' },
            { id: 'T14', label: 'T-14 Days' },
            { id: 'T30', label: 'T-30 Days' }
          ]}
        />
      </div>

      {/* Metrics Row */}
      <MetricGroup columns={3}>
        <MetricTile
          label="Pending File Audits"
          value={`${complianceRecords.length} Files`}
          sublabel="Closing file compliance checks"
          variant="default"
          icon={<FileText className="w-4 h-4" />}
        />
        <MetricTile
          label="Critical T-3 Files"
          value={`${complianceRecords.filter((r: any) => r.daysToClose <= 3).length} Urgent`}
          sublabel="Closing within 72 hours"
          variant="danger"
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <MetricTile
          label="Missing Disclosures"
          value="4 Files"
          sublabel="Awaiting buyer/seller signature"
          variant="warning"
          icon={<AlertCircle className="w-4 h-4" />}
        />
      </MetricGroup>

      {/* File List & Inspector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: File Cards */}
        <div className="md:col-span-1 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)]">Closing Files</h3>
          {filteredRecords.map((item: any) => (
            <div key={item.id} onClick={() => setSelectedId(item.id)}>
              <Card
                className={`p-4 cursor-pointer space-y-2 transition-all ${
                  selectedId === item.id ? 'border-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)]' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--sw-text-primary)] truncate">{item.propertyAddress}</span>
                  <StatusBadge status={item.daysToClose <= 3 ? 'at_risk' : 'active'} size="sm" />
                </div>
                <p className="text-xs text-[var(--sw-text-secondary)]">Agent: {item.agentName}</p>
                <span className="text-[11px] font-mono text-[var(--state-warning)] block font-semibold">
                  Closing in {item.daysToClose} days ({item.missingDocs.length} missing docs)
                </span>
              </Card>
            </div>
          ))}
        </div>

        {/* Right Column: Selected File Inspection */}
        <div className="md:col-span-2 space-y-4">
          {selectedItem ? (
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--sw-border)] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[var(--sw-text-primary)]">{selectedItem.propertyAddress}</h3>
                  <p className="text-xs text-[var(--sw-text-secondary)]">Client: {selectedItem.clientName} • Responsible Agent: {selectedItem.agentName}</p>
                </div>
                <Badge variant={selectedItem.daysToClose <= 3 ? "danger" : "warning"}>
                  T-{selectedItem.daysToClose} Days to Closing
                </Badge>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)]">Missing Documents</h4>
                <div className="space-y-2">
                  {selectedItem.missingDocs.map((doc: string, idx: number) => (
                    <div key={idx} className="p-2.5 bg-[var(--sw-canvas)] border border-[var(--sw-border)] rounded-[var(--radius-sm)] flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--sw-text-primary)]">{doc}</span>
                      <StatusBadge status="awaiting_approval" size="sm" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--sw-border)] flex items-center justify-end gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  loading={isProcessing}
                  icon={<Send className="w-3.5 h-3.5" />}
                  onClick={() => handleSendNudge(selectedItem)}
                >
                  Send Agent Compliance Reminder
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-xs text-[var(--sw-text-secondary)]">
              Select a closing file from the list to inspect missing documents.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
