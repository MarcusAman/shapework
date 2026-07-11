/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mail, ShieldAlert, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';

interface RecordActionsProps {
  recordType: 'transaction' | 'listing' | 'person' | 'communication' | 'document' | 'integration' | 'run' | 'audit' | string;
  recordId: string;
  record: any;
  onCloseDrawer: () => void;
  state: any;
}

export default function RecordActions({
  recordType,
  recordId,
  record,
  onCloseDrawer,
  state
}: RecordActionsProps) {
  
  const handleTriggerAudit = () => {
    alert(`Triggered manual operations sweep audit for record ${recordId}`);
    onCloseDrawer();
  };

  const handleCreateReminder = () => {
    alert(`Drafted email reminder for record ${recordId}. Placed in Approval Center.`);
    onCloseDrawer();
  };

  return (
    <div className="flex flex-wrap gap-2 text-xs font-sans text-left pb-4 border-b border-border-subtle/50 shrink-0">
      
      {/* Transaction Actions */}
      {recordType === 'transaction' && (
        <>
          <button
            onClick={handleTriggerAudit}
            className="flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-hover text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Trigger Risk Sweep</span>
          </button>
          
          <button
            onClick={handleCreateReminder}
            className="flex items-center gap-1.5 border border-border-subtle bg-surface hover:bg-secondary-surface text-text-secondary px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Draft Document Request</span>
          </button>
        </>
      )}

      {/* Listing Actions */}
      {recordType === 'listing' && (
        <>
          <button
            onClick={handleCreateReminder}
            className="flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-hover text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Draft Photos Reminder</span>
          </button>

          <button
            onClick={handleTriggerAudit}
            className="flex items-center gap-1.5 border border-border-subtle bg-surface hover:bg-secondary-surface text-text-secondary px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Re-verify MLS Status</span>
          </button>
        </>
      )}

      {/* Audit Actions */}
      {recordType === 'audit' && record.rollback_indicator && (
        <button
          onClick={() => {
            alert(`Reverting stage transition changes for ledger ID ${recordId}`);
            onCloseDrawer();
          }}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Execute Cryptographic Rollback</span>
        </button>
      )}

      {/* Generic fallback action */}
      {recordType !== 'transaction' && recordType !== 'listing' && recordType !== 'audit' && (
        <button
          onClick={handleTriggerAudit}
          className="flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-hover text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Verify State Calibration</span>
        </button>
      )}

    </div>
  );
}
