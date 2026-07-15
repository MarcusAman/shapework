/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, AlertTriangle, Shield } from 'lucide-react';

interface ApprovalPolicyReasonProps {
  policy: string;
}

export default function ApprovalPolicyReason({ policy }: ApprovalPolicyReasonProps) {
  const getBadgeStyle = () => {
    if (policy.includes('Signature') || policy.includes('Capacity')) {
      return 'bg-amber-50 text-amber-800 border-amber-100';
    }
    if (policy.includes('Client') || policy.includes('Recipient')) {
      return 'bg-blue-50 text-blue-800 border-blue-100';
    }
    return 'bg-stone-50 text-stone-600 border-stone-100';
  };

  const getIcon = () => {
    if (policy.includes('Signature') || policy.includes('Capacity')) {
      return <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />;
    }
    return <Shield className="w-3 h-3 text-brand-green shrink-0" />;
  };

  return (
    <div className={`px-2 py-0.5 border rounded-lg text-[9px] font-bold font-mono flex items-center gap-1 shrink-0 ${getBadgeStyle()}`}>
      {getIcon()}
      <span className="truncate max-w-[150px]" title={policy}>{policy}</span>
    </div>
  );
}
