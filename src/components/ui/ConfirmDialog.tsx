/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical ConfirmDialog Primitive — Phase B2 Foundation
 * Specialized confirmation dialog for destructive or high-consequence actions.
 */

import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, Info } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div
          className={`p-2.5 rounded-full shrink-0 ${
            variant === 'danger'
              ? 'bg-[var(--state-danger-bg)] text-[var(--state-danger)]'
              : 'bg-[var(--brand-soft)] text-[var(--brand-primary)]'
          }`}
        >
          {variant === 'danger' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
        </div>
        <div className="space-y-1.5 text-left">
          <h4 className="text-sm font-bold text-[var(--sw-text-primary)]">{title}</h4>
          <div className="text-xs text-[var(--sw-text-secondary)] leading-relaxed font-normal">
            {message}
          </div>
        </div>
      </div>
    </Modal>
  );
}
