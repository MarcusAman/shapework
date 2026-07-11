/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Paperclip, Sparkles } from 'lucide-react';
import { Communication } from '../../types/shapework';
import ChannelBadge from '../ui/ChannelBadge';
import { safeLower } from '../../utils/string';

interface InboxListProps {
  items: Communication[];
  selectedId: string;
  onSelectItem: (id: string) => void;
  activeSidebarTab: string;
}

export default function InboxList({
  items,
  selectedId,
  onSelectItem,
  activeSidebarTab
}: InboxListProps) {
  
  // Filter the communications based on the left navigation filter inside Operations Inbox
  const filteredItems = (items || []).filter((item) => {
    if (!item) return false;
    switch (safeLower(activeSidebarTab)) {
      case 'needs attention':
        return item.urgency === 'high';
      case 'awaiting approval':
        return item.action_proposal_id !== undefined && item.status !== 'completed';
      case 'waiting on agent':
        return item.related_agent !== '';
      case 'documents received':
        return item.type === 'document';
      case 'completed':
        return item.status === 'completed';
      case 'all':
      default:
        return true;
    }
  });

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-border-subtle bg-surface">
      {filteredItems.map((item) => {
        const isSelected = item.id === selectedId;
        const isUnread = item.status === 'unread';

        return (
          <div
            key={item.id}
            onClick={() => onSelectItem(item.id)}
            className={`p-4 cursor-pointer hover:bg-secondary-surface transition-all flex flex-col gap-2 relative ${
              isSelected ? 'bg-brand-green-soft/40 border-r-2 border-brand-green' : ''
            }`}
          >
            {/* Unread indicator dot */}
            {isUnread && (
              <span className="absolute top-4 left-2 w-1.5 h-1.5 bg-brand-green rounded-full" />
            )}

            {/* Header info */}
            <div className="flex items-start justify-between gap-2 pl-2">
              <span className={`text-xs text-text-primary ${isUnread ? 'font-bold' : 'font-semibold'}`}>
                {item.sender}
              </span>
              <span className="text-[10px] text-text-tertiary font-mono shrink-0">{item.time}</span>
            </div>

            {/* Subject / Title */}
            <h4 className={`text-xs pl-2 truncate ${isUnread ? 'font-bold text-text-primary' : 'text-text-secondary'}`}>
              {item.subject}
            </h4>

            {/* Extracted Intent with AI sparkles */}
            <div className="flex gap-1.5 items-start bg-secondary-surface p-2 rounded-lg border border-border-subtle/40 pl-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-green shrink-0 mt-0.5" />
              <p className="text-[11px] text-text-secondary leading-snug line-clamp-2">
                <span className="font-semibold text-text-primary">Intent:</span> {item.intent}
              </p>
            </div>

            {/* Badge Footer row */}
            <div className="flex items-center justify-between pl-2 pt-1">
              <div className="flex items-center gap-1.5">
                <ChannelBadge channel={item.type} />
                {item.attachment_indicator && (
                  <Paperclip className="w-3.5 h-3.5 text-text-tertiary" title="Attachments included" />
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-text-tertiary font-medium">
                  {item.related_property ? item.related_property.split(',')[0] : 'No Property'}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {filteredItems.length === 0 && (
        <div className="p-8 text-center text-xs text-text-tertiary italic">
          No communication events match the active view.
        </div>
      )}
    </div>
  );
}
