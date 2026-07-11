/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, Edit2, UserPlus, Trash2, Loader2 } from 'lucide-react';

interface ApprovalControlsProps {
  onApprove: () => void;
  onDismiss: () => void;
  onDelegate?: () => void;
  onEdit?: () => void;
  isProcessing?: boolean;
  disabled?: boolean;
}

export default function ApprovalControls({
  onApprove,
  onDismiss,
  onDelegate,
  onEdit,
  isProcessing = false,
  disabled = false
}: ApprovalControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Approve Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onApprove();
        }}
        disabled={disabled || isProcessing}
        className="flex items-center gap-1 bg-brand-green hover:bg-brand-green-hover text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Check className="w-3.5 h-3.5" />
        )}
        <span>Approve</span>
      </button>

      {/* Edit Button */}
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          disabled={disabled || isProcessing}
          className="flex items-center gap-1 border border-border-subtle hover:bg-brand-green-soft text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>
      )}

      {/* Delegate Button */}
      {onDelegate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelegate();
          }}
          disabled={disabled || isProcessing}
          className="flex items-center gap-1 border border-border-subtle hover:bg-brand-green-soft text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Delegate</span>
        </button>
      )}

      {/* Dismiss Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        disabled={disabled || isProcessing}
        className="flex items-center gap-1 border border-border-subtle hover:bg-status-atrisk-soft text-text-secondary hover:text-status-atrisk px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Dismiss</span>
      </button>
    </div>
  );
}
