/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Database, ShieldCheck, HelpCircle } from 'lucide-react';

interface RecordEvidenceProps {
  recordType: string;
  record: any;
}

export default function RecordEvidence({
  recordType,
  record
}: RecordEvidenceProps) {
  
  // Custom mock evidence quote mapping
  const getEvidenceText = () => {
    if (recordType === 'transaction') {
      if (record.property_address && record.property_address.includes('Pine')) {
        return "Gmail Ingestion Hub Node: loan-officer@apexmortgage.com -> 'Underwriting approved clear to close on Pine Street. Scheduling closing session.'";
      }
      if (record.property_address && record.property_address.includes('Colonial')) {
        return "Gmail Ingestion Hub Node: closing-attorney@landtitle.com -> 'Rescheduling closing session to July 15 due to outstanding title clear.'";
      }
      return "RESO Sync Match: Brokerage MLS active database node matching deal ID.";
    }

    if (recordType === 'listing') {
      return `MLS launch checklists database entry matching ${record.property_address || 'listing'}. Launch scheduled in 48 hours. Photo upload required.`;
    }

    if (recordType === 'communication') {
      return record.body || "Raw email body content ingested via connected Gmail Workspace mailbox.";
    }

    return null;
  };

  const evidence = getEvidenceText();

  if (!evidence) return null;

  return (
    <div className="space-y-3 font-sans text-left">
      <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Source Ingest Evidence</span>
      
      <div className="border border-border-subtle rounded-2xl p-4 bg-stone-50 space-y-2.5">
        <div className="flex justify-between items-center text-[9px] text-text-tertiary font-mono">
          <span className="flex items-center gap-1">
            <Database className="w-3 h-3" />
            Verified Source Signal
          </span>
          <span className="text-brand-green font-semibold flex items-center gap-0.5">
            <ShieldCheck className="w-3 h-3" />
            Audited Match
          </span>
        </div>
        <p className="text-[11px] font-mono text-text-secondary leading-relaxed whitespace-pre-wrap italic">
          "{evidence}"
        </p>
      </div>
    </div>
  );
}
