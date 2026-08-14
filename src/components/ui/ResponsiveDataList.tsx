/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical ResponsiveDataList Primitive — Phase B3 Foundation
 * Mobile-friendly list component that formats table rows into accessible cards
 * at small viewports without obscuring critical data fields.
 */

import React from 'react';
import Card from './SurfaceCard';
import DropdownMenu, { DropdownMenuItem } from './DropdownMenu';
import IconButton from './IconButton';
import { MoreVertical } from 'lucide-react';

export interface ResponsiveDataItem<T> {
  title: (row: T) => React.ReactNode;
  subtitle?: (row: T) => React.ReactNode;
  badge?: (row: T) => React.ReactNode;
  details: {
    label: string;
    value: (row: T) => React.ReactNode;
  }[];
}

export interface ResponsiveDataListProps<T> {
  data: T[];
  keyExtractor: (row: T) => string;
  itemConfig: ResponsiveDataItem<T>;
  actions?: (row: T) => DropdownMenuItem[];
  emptyState?: React.ReactNode;
  className?: string;
}

export function ResponsiveDataList<T>({
  data,
  keyExtractor,
  itemConfig,
  actions,
  emptyState,
  className = ''
}: ResponsiveDataListProps<T>) {
  const [openActionKey, setOpenActionKey] = React.useState<string | null>(null);

  if (data.length === 0) {
    return (
      <div className={`p-8 text-center bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-[var(--radius-md)] ${className}`}>
        {emptyState || <span className="text-xs text-[var(--sw-text-secondary)]">No items to display.</span>}
      </div>
    );
  }

  return (
    <div className={`space-y-3 w-full ${className}`}>
      {data.map((row) => {
        const rowKey = keyExtractor(row);
        const rowActions = actions ? actions(row) : [];

        return (
          <div key={rowKey}>
            <Card className="p-4 text-left space-y-3 relative">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="font-bold text-sm text-[var(--sw-text-primary)] truncate">
                  {itemConfig.title(row)}
                </div>
                {itemConfig.subtitle && (
                  <div className="text-xs text-[var(--sw-text-secondary)]">
                    {itemConfig.subtitle(row)}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {itemConfig.badge && <div>{itemConfig.badge(row)}</div>}

                {actions && rowActions.length > 0 && (
                  <DropdownMenu
                    isOpen={openActionKey === rowKey}
                    onClose={() => setOpenActionKey(null)}
                    align="right"
                    trigger={
                      <IconButton
                        icon={<MoreVertical className="w-4 h-4" />}
                        aria-label={`Actions for ${rowKey}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => setOpenActionKey(openActionKey === rowKey ? null : rowKey)}
                      />
                    }
                    items={rowActions}
                  />
                )}
              </div>
            </div>

            {itemConfig.details.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--sw-border)] text-xs">
                {itemConfig.details.map((detail, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--sw-text-secondary)]">
                      {detail.label}
                    </span>
                    <span className="font-medium text-[var(--sw-text-primary)] truncate mt-0.5">
                      {detail.value(row)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            </Card>
          </div>
        );
      })}
    </div>
  );
}
