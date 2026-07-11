/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mail, MessageSquare, FileText, Calendar, Globe } from 'lucide-react';

interface ChannelBadgeProps {
  channel: 'email' | 'sms' | 'document' | 'webhook' | 'calendar';
}

export default function ChannelBadge({ channel }: ChannelBadgeProps) {
  const getIcon = () => {
    switch (channel) {
      case 'email':
        return <Mail className="w-3.5 h-3.5" />;
      case 'sms':
        return <MessageSquare className="w-3.5 h-3.5" />;
      case 'document':
        return <FileText className="w-3.5 h-3.5" />;
      case 'calendar':
        return <Calendar className="w-3.5 h-3.5" />;
      case 'webhook':
      default:
        return <Globe className="w-3.5 h-3.5" />;
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-100 border border-stone-200 text-stone-600 select-none uppercase tracking-wider">
      {getIcon()}
      <span>{channel}</span>
    </span>
  );
}
