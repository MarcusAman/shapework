/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, Link2, FileText, Briefcase } from 'lucide-react';

interface RecordRelationshipsProps {
  recordType: string;
  record: any;
}

export default function RecordRelationships({
  recordType,
  record
}: RecordRelationshipsProps) {
  
  // Custom mock relationship links mapping
  const getRelationships = () => {
    switch (recordType) {
      case 'transaction':
        return [
          { label: 'Listing Coordinator', value: 'Ann Gunn', type: 'person' },
          { label: 'Listing Agent', value: record.listing_agent || 'Randy Smith', type: 'person' },
          { label: 'Escrow Title Provider', value: 'Land Title Escrow Corp', type: 'integration' },
          { label: 'Connected Disclosures', value: 'Docusign Envelope #2981a', type: 'document' }
        ];
      case 'listing':
        return [
          { label: 'Managing Broker', value: 'Eric Knight', type: 'person' },
          { label: 'Listing Agent', value: record.listing_agent || 'Randy Smith', type: 'person' },
          { label: 'Marketing Channel', value: 'Rechat Platform Sync', type: 'integration' }
        ];
      case 'communication':
        return [
          { label: 'Sender Profile', value: record.sender || 'Apex Mortgage Representative', type: 'person' },
          { label: 'Matched Property File', value: record.matched_property || '102 Pine Street', type: 'transaction' }
        ];
      default:
        return [
          { label: 'Workspace Administrator', value: 'Ann Gunn (Operations Lead)', type: 'person' }
        ];
    }
  };

  const relations = getRelationships();

  return (
    <div className="space-y-3 font-sans text-left">
      <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">Connected Workspace Entities</span>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        {relations.map((rel, idx) => (
          <div key={idx} className="p-3 bg-secondary-surface/40 border border-border-subtle rounded-xl flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-surface border border-border-subtle flex items-center justify-center shrink-0 text-text-tertiary">
              {rel.type === 'person' ? <User className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
            </div>
            <div className="min-w-0">
              <span className="text-[8px] text-text-tertiary block font-mono uppercase tracking-wider">{rel.label}</span>
              <span className="font-bold text-text-secondary mt-0.5 block truncate">{rel.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
