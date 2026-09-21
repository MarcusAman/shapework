/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RequestSourceIcon — Standardized accessible source channel indicator
 * Displays Phone, Email, Chat, SMS, or Web intake origin across
 * Kanban cards, table views, and modal headers.
 */

import React from 'react';
import { Phone, Mail, MessageSquare, FileText } from 'lucide-react';

export type SourceChannelType = 'phone' | 'email' | 'chat' | 'sms' | 'web';

export interface SourceChannelMeta {
  type: SourceChannelType;
  label: string;
  badgeLabel: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  colorClasses: string;
  badgeClasses: string;
}

export function normalizeSourceChannel(
  channel?: string,
  callId?: string,
  id?: string
): SourceChannelMeta {
  const raw = (channel || '').toLowerCase();
  const hasCall = Boolean(callId) || (id && id.includes('call_'));

  if (hasCall || raw === 'phone' || raw === 'voice' || raw === 'call' || raw === 'retell') {
    return {
      type: 'phone',
      label: 'Phone call',
      badgeLabel: 'Call',
      icon: Phone,
      colorClasses: 'text-blue-600',
      badgeClasses: 'bg-slate-50 text-slate-500 border-slate-200/70'
    };
  }

  if (raw === 'email' || (id && id.includes('email'))) {
    return {
      type: 'email',
      label: 'Email Intake',
      badgeLabel: 'Email',
      icon: Mail,
      colorClasses: 'text-amber-600',
      badgeClasses: 'bg-amber-50 text-amber-800 border-amber-200/80'
    };
  }

  if (raw === 'chat' || raw === 'nora_chat' || (id && id.includes('chat'))) {
    return {
      type: 'chat',
      label: 'Ask Nora Chat',
      badgeLabel: 'Chat',
      icon: MessageSquare,
      colorClasses: 'text-emerald-600',
      badgeClasses: 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
    };
  }

  if (raw === 'sms' || raw === 'mms' || raw === 'text') {
    return {
      type: 'sms',
      label: 'SMS / Text Intake',
      badgeLabel: 'SMS',
      icon: MessageSquare,
      colorClasses: 'text-indigo-600',
      badgeClasses: 'bg-indigo-50 text-indigo-800 border-indigo-200/80'
    };
  }

  return {
    type: 'web',
    label: 'Web Form / Portal',
    badgeLabel: 'Web',
    icon: FileText,
    colorClasses: 'text-slate-500',
    badgeClasses: 'bg-slate-50 text-slate-700 border-slate-200/80'
  };
}

export interface RequestSourceIconProps {
  channel?: string;
  callId?: string;
  id?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'icon' | 'badge' | 'subdued';
  showLabel?: boolean;
}

export const RequestSourceIcon: React.FC<RequestSourceIconProps> = ({
  channel,
  callId,
  id,
  className = '',
  size = 'xs',
  variant = 'subdued',
  showLabel = false
}) => {
  const meta = normalizeSourceChannel(channel, callId, id);
  const IconComponent = meta.icon;

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5'
  };

  const currentIconSize = iconSizes[size] || iconSizes.xs;

  if (variant === 'badge' || showLabel) {
    return (
      <span
        data-testid={`source-channel-badge-${meta.type}`}
        title={meta.label}
        className={`nest-chip-morph inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border ${meta.badgeClasses} ${className}`}
      >
        <IconComponent className={`${currentIconSize} shrink-0`} aria-hidden={true} />
        <span>{meta.badgeLabel}</span>
      </span>
    );
  }

  return (
    <span
      data-testid={`source-channel-icon-${meta.type}`}
      title={meta.label}
      aria-label={meta.label}
      className={`inline-flex items-center justify-center p-0.5 rounded text-[9px] transition-colors ${meta.badgeClasses} ${className}`}
    >
      <IconComponent className={`${currentIconSize} shrink-0`} aria-hidden={true} />
    </span>
  );
};
