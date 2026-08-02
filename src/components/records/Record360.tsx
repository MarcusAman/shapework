/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Layers, Database, Shield, FileText, User, Mail, Zap } from 'lucide-react';
import RecordHeader from './RecordHeader';
import RecordTimeline from './RecordTimeline';
import RecordEvidence from './RecordEvidence';
import RecordRelationships from './RecordRelationships';
import RecordActions from './RecordActions';

interface Record360Props {
  recordType: 'transaction' | 'listing' | 'person' | 'communication' | 'document' | 'integration' | 'run' | 'audit' | string;
  recordId: string;
  isOpen: boolean;
  onClose: () => void;
  state: any; // Context state containing transactions, listings, emailMessages, etc.
}

export default function Record360({
  recordType,
  recordId,
  isOpen,
  onClose,
  state
}: Record360Props) {
  if (!isOpen || !recordId) return null;

  // Unpack state databases
  const {
    transactions = [],
    listings = [],
    emailMessages = [],
    auditEvents = [],
    aiAgents = [],
    agentRuns = [],
    integrations = []
  } = state;

  // Resolves the exact mock record profile based on ID and type
  let recordData: any = null;
  let title = '';
  let subtitle = '';

  switch (recordType) {
    case 'transaction':
      recordData = (transactions || []).find((t: any) => t.id === recordId || t.property_address.includes(recordId));
      title = recordData ? recordData.property_address : 'Transaction Inspection';
      subtitle = `Transaction Escrow Profile · ID: ${recordId}`;
      break;
    case 'listing':
      recordData = (listings || []).find((l: any) => l.id === recordId || l.property_address.includes(recordId));
      title = recordData ? recordData.property_address : 'Listing Launch Profile';
      subtitle = `Active Brokerage Listing · ID: ${recordId}`;
      break;
    case 'communication':
      recordData = (emailMessages || []).find((m: any) => m.id === recordId || m.sender.includes(recordId));
      title = recordData ? recordData.subject : 'Communication Log';
      subtitle = `Gmail/Outlook message packet · ID: ${recordId}`;
      break;
    case 'audit':
      recordData = (auditEvents || []).find((a: any) => a.id === recordId);
      title = recordData ? `Ledger Commit: ${recordData.impact_area}` : 'Audit Ledger Log';
      subtitle = `Immutable cryptographic entry · ID: ${recordId}`;
      break;
    case 'run':
      recordData = (agentRuns || []).find((r: any) => r.runId === recordId);
      title = recordData ? `Agent Execution Run` : 'Specialist Run Log';
      subtitle = `Agent execution history trace · ID: ${recordId}`;
      break;
    case 'integration':
      recordData = (integrations || []).find((i: any) => i.id === recordId || i.name.includes(recordId));
      title = recordData ? recordData.name : 'Integration Health Profile';
      subtitle = `Connected API connector state · ID: ${recordId}`;
      break;
    default:
      // Fallback fallback resolver search
      recordData = { id: recordId, name: recordId };
      title = recordId;
      subtitle = (state?.appMode === 'production')
        ? `Record View · Type: ${recordType}`
        : `Fictional Synthetic Record · Type: ${recordType}`;
  }

  if (!recordData) {
    recordData = { id: recordId, name: 'Record Not Found', status: 'missing' };
  }

  return (
    <div className="fixed inset-0 overflow-hidden z-50 flex justify-end font-sans">
      
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity" 
      />

      {/* Drawer Body Panel */}
      <div className="w-full max-w-xl bg-surface border-l border-border-subtle shadow-xl flex flex-col h-full relative z-10 transition-all duration-300">
        
        {/* Header wrapper */}
        <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-secondary-surface shrink-0">
          <RecordHeader 
            title={title} 
            subtitle={subtitle} 
            recordType={recordType} 
            status={recordData?.status || recordData?.current_stage || recordData?.compliance_status || 'active'} 
          />
          
          <button 
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary border border-border-subtle p-1.5 rounded-lg shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable details */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-left">
          
          {/* Action buttons bar */}
          <RecordActions 
            recordType={recordType} 
            recordId={recordId} 
            record={recordData} 
            onCloseDrawer={onClose}
            state={state}
          />

          {/* Dynamic properties card */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Record State Indices</span>
            
            <div className="grid grid-cols-2 gap-3 p-4 bg-secondary-surface/40 border border-border-subtle/80 rounded-2xl text-xs">
              {recordType === 'transaction' && (
                <>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Current Escrow Stage</span>
                    <span className="font-bold text-text-primary mt-0.5 block">{recordData.current_stage || 'Under Contract'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Projected Revenue</span>
                    <span className="font-bold text-brand-green mt-0.5 block">${(recordData.revenue || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Closing Target Date</span>
                    <span className="font-bold text-text-primary mt-0.5 block">{recordData.target_closing_date || 'July 15, 2026'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Compliance Audit</span>
                    <span className="font-bold text-text-primary mt-0.5 block capitalize">{recordData.compliance_status || 'Pending'}</span>
                  </div>
                  {(() => {
                    const qbSignals = (state.financeSignals || []).filter(
                      (s: any) => s.relatedTransactionId === recordData.id && s.sourceSystem === 'quickbooks'
                    );
                    const hasPayment = qbSignals.some((s: any) => s.signalType === 'payment_received');
                    const hasDeposit = qbSignals.some((s: any) => s.signalType === 'deposit_received');
                    
                    let payoutStatusText = 'Pending Verification';
                    let payoutStatusColor = 'text-text-tertiary font-bold';
                    
                    if (recordData.status?.toLowerCase() === 'closed' || recordData.current_stage?.toLowerCase() === 'closed') {
                      if (hasPayment) {
                        payoutStatusText = 'Payout Ready (Verified)';
                        payoutStatusColor = 'text-brand-green font-bold';
                      } else {
                        payoutStatusText = 'Expected Payment Missing';
                        payoutStatusColor = 'text-rose-500 font-bold';
                      }
                    } else if (hasPayment) {
                      payoutStatusText = 'Payment Received';
                      payoutStatusColor = 'text-amber-500 font-bold';
                    } else if (hasDeposit) {
                      payoutStatusText = 'Escrow Deposit Verified';
                      payoutStatusColor = 'text-blue-400 font-bold';
                    }

                    return (
                      <div>
                        <span className="text-[9px] text-text-tertiary block font-mono">QuickBooks Payout Status</span>
                        <span className={`mt-0.5 block ${payoutStatusColor}`}>{payoutStatusText}</span>
                      </div>
                    );
                  })()}
                </>
              )}

              {recordType === 'listing' && (
                <>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Listing Status</span>
                    <span className="font-bold text-text-primary mt-0.5 block capitalize">{recordData.status || 'Active'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">MLS Launch Price</span>
                    <span className="font-bold text-text-primary mt-0.5 block">${(recordData.price || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Marketing Readiness</span>
                    <span className="font-bold text-text-primary mt-0.5 block capitalize">{recordData.marketing_readiness || 'Pending'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Listing Coordinator</span>
                    <span className="font-bold text-text-primary mt-0.5 block">{recordData.listing_coordinator || 'Sarah Jenkins'}</span>
                  </div>
                </>
              )}

              {recordType === 'communication' && (
                <>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Sender Name</span>
                    <span className="font-bold text-text-primary mt-0.5 block">{recordData.sender}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Ingest Timestamp</span>
                    <span className="font-bold text-text-primary mt-0.5 block">{recordData.received_at ? new Date(recordData.received_at).toLocaleTimeString() : 'Recent'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Intent Classification</span>
                    <span className="font-bold text-brand-green mt-0.5 block capitalize">{recordData.intent || 'Status Inquiry'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Match Target Address</span>
                    <span className="font-bold text-text-primary mt-0.5 block">{recordData.matched_property || 'Baker Street'}</span>
                  </div>
                </>
              )}

              {recordType === 'audit' && (
                <>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Recorded Actor</span>
                    <span className="font-bold text-text-primary mt-0.5 block">{recordData.user_name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Commit Timestamp</span>
                    <span className="font-bold text-text-primary mt-0.5 block">{new Date(recordData.timestamp).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Audit Area Impacted</span>
                    <span className="font-bold text-text-primary mt-0.5 block font-mono">{recordData.impact_area}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Verification Mode</span>
                    <span className="font-bold text-brand-green mt-0.5 block font-mono">Ledger Cryptographic Match</span>
                  </div>
                </>
              )}

              {recordType === 'run' && (
                <>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Specialist Agent ID</span>
                    <span className="font-bold text-text-primary mt-0.5 block">{recordData.agentId}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Run Status</span>
                    <span className="font-bold text-text-primary mt-0.5 block capitalize">{recordData.status}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Records Scanned</span>
                    <span className="font-bold text-text-primary mt-0.5 block">{recordData.recordsScanned} files</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Actions Prepared</span>
                    <span className="font-bold text-text-primary mt-0.5 block">{recordData.actionsPrepared} actions</span>
                  </div>
                </>
              )}

              {recordType === 'integration' && (
                <>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Connected App</span>
                    <span className="font-bold text-text-primary mt-0.5 block">{recordData.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Connector Status</span>
                    <span className="font-bold text-brand-green mt-0.5 block">{recordData.connected ? 'Active Sync' : 'Offline'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Last Ingest Sync</span>
                    <span className="font-bold text-text-primary mt-0.5 block">{recordData.last_sync ? new Date(recordData.last_sync).toLocaleTimeString() : 'Never'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-tertiary block font-mono">Synced Record Count</span>
                    <span className="font-bold text-text-primary mt-0.5 block">{recordData.records_synchronized} records</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Relationship graphs links */}
          <RecordRelationships 
            recordType={recordType} 
            record={recordData} 
          />

          {/* Ingest text evidence quotes */}
          <RecordEvidence 
            recordType={recordType} 
            record={recordData} 
          />

          {/* Associated timelines logs */}
          <RecordTimeline 
            recordType={recordType} 
            recordId={recordId} 
            state={state} 
          />

        </div>

      </div>

    </div>
  );
}
