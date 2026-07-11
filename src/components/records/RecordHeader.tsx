/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers, Database, User, Mail, ShieldAlert, FileText, CheckCircle2, Cpu } from 'lucide-react';
import BrandIcon from '../ui/BrandIcon';

interface RecordHeaderProps {
  title: string;
  subtitle: string;
  recordType: string;
  status: string;
}

export default function RecordHeader({
  title,
  subtitle,
  recordType,
  status
}: RecordHeaderProps) {
  
  // Icon selector based on record type
  const getHeaderIcon = () => {
    switch (recordType) {
      case 'transaction':
        return <Layers className="w-5 h-5 text-brand-green" />;
      case 'listing':
        return <FileText className="w-5 h-5 text-brand-green" />;
      case 'communication':
        return <Mail className="w-5 h-5 text-brand-green" />;
      case 'audit':
        return <ShieldAlert className="w-5 h-5 text-brand-green" />;
      case 'run':
        return <Cpu className="w-5 h-5 text-brand-green" />;
      case 'integration':
        return <Database className="w-5 h-5 text-brand-green" />;
      default:
        return <Layers className="w-5 h-5 text-text-tertiary" />;
    }
  };

  return (
    <div className="flex items-center gap-3 text-left font-sans">
      <div className="w-9 h-9 rounded-xl border border-border-subtle bg-surface flex items-center justify-center shadow-sm shrink-0">
        {getHeaderIcon()}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-serif font-bold text-sm text-text-primary leading-tight">{title}</h3>
          <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold font-mono uppercase tracking-wider ${
            status === 'healthy' || status === 'completed' || status === 'compliant' || status === 'active'
              ? 'bg-brand-green-soft text-brand-green'
              : status === 'blocked' || status === 'error' || status === 'failed' || status === 'at_risk' || status === 'non_compliant'
              ? 'bg-red-50 text-red-700 border border-red-100'
              : 'bg-stone-100 text-stone-600'
          }`}>
            {status}
          </span>
        </div>
        <p className="text-[10px] text-text-secondary mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
