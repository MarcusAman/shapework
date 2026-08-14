/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical DataTable Primitive — Phase B3 Foundation
 * Clean, editorial data table with proper semantic table structure,
 * sortable headers, row selection, and row action menus.
 */

import React from 'react';
import Checkbox from './Checkbox';
import DropdownMenu, { DropdownMenuItem } from './DropdownMenu';
import IconButton from './IconButton';
import { ArrowUpDown, ArrowUp, ArrowDown, MoreVertical } from 'lucide-react';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  selectable?: boolean;
  selectedKeys?: string[];
  onSelectRow?: (key: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  actions?: (row: T) => DropdownMenuItem[];
  ariaLabel?: string;
  emptyState?: React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor = (row: any) => row?.id || row?.key || row?.code || String(Math.random()),
  sortColumn,
  sortDirection,
  onSort,
  selectable = false,
  selectedKeys = [],
  onSelectRow,
  onSelectAll,
  actions,
  ariaLabel = 'Data table',
  emptyState,
  className = ''
}: DataTableProps<T>) {
  const [openActionRowKey, setOpenActionRowKey] = React.useState<string | null>(null);

  const allSelected = data.length > 0 && data.every(row => selectedKeys.includes(keyExtractor(row)));
  const someSelected = selectedKeys.length > 0 && !allSelected;

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="w-3 h-3 text-[var(--sw-text-muted)]" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[var(--brand-secondary)]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[var(--brand-secondary)]" />
    );
  };

  const getAriaSort = (columnKey: string): 'ascending' | 'descending' | 'none' | undefined => {
    if (!onSort) return undefined;
    if (sortColumn !== columnKey) return 'none';
    return sortDirection === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div className={`w-full overflow-x-auto border border-[var(--sw-border)] rounded-[var(--radius-md)] bg-[var(--sw-surface)] shadow-[var(--sw-shadow-soft)] ${className}`}>
      <table className="w-full text-left border-collapse text-xs select-none" aria-label={ariaLabel}>
        <thead>
          <tr className="border-b border-[var(--sw-border)] bg-[var(--sw-canvas)] text-[var(--sw-text-secondary)] font-semibold">
            {selectable && (
              <th scope="col" className="p-3 w-10 text-center">
                <Checkbox
                  checked={allSelected}
                  onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                aria-sort={getAriaSort(col.key)}
                style={{ width: col.width }}
                className={`p-3 text-${col.align || 'left'} font-semibold text-[11px] uppercase tracking-wider text-[var(--sw-text-secondary)]`}
              >
                {col.sortable && onSort ? (
                  <button
                    type="button"
                    onClick={() => onSort(col.key)}
                    className="inline-flex items-center gap-1.5 hover:text-[var(--sw-text-primary)] cursor-pointer outline-none focus:ring-2 focus:ring-[var(--brand-secondary)]/30 rounded px-1 -mx-1"
                  >
                    <span>{col.header}</span>
                    {getSortIcon(col.key)}
                  </button>
                ) : (
                  <span>{col.header}</span>
                )}
              </th>
            ))}
            {actions && <th scope="col" className="p-3 w-12 text-right"><span className="sr-only">Actions</span></th>}
          </tr>
        </thead>

        <tbody className="divide-y divide-[var(--sw-border)] bg-[var(--sw-surface)] text-[var(--sw-text-primary)]">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="p-8 text-center">
                {emptyState || <span className="text-xs text-[var(--sw-text-secondary)]">No records found.</span>}
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const rowKey = keyExtractor(row);
              const isSelected = selectedKeys.includes(rowKey);
              const rowActions = actions ? actions(row) : [];

              return (
                <tr
                  key={rowKey}
                  className={`transition-colors hover:bg-[var(--sw-canvas)] ${
                    isSelected ? 'bg-[var(--brand-soft)]/50' : ''
                  }`}
                >
                  {selectable && (
                    <td className="p-3 text-center">
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => onSelectRow && onSelectRow(rowKey, e.target.checked)}
                        aria-label={`Select row ${rowKey}`}
                      />
                    </td>
                  )}

                  {columns.map((col) => (
                    <td key={col.key} className={`p-3 text-${col.align || 'left'} align-middle font-medium`}>
                      {col.accessor(row)}
                    </td>
                  ))}

                  {actions && (
                    <td className="p-3 text-right align-middle">
                      <DropdownMenu
                        isOpen={openActionRowKey === rowKey}
                        onClose={() => setOpenActionRowKey(null)}
                        align="right"
                        trigger={
                          <IconButton
                            icon={<MoreVertical className="w-4 h-4" />}
                            aria-label={`Row actions for ${rowKey}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => setOpenActionRowKey(openActionRowKey === rowKey ? null : rowKey)}
                          />
                        }
                        items={rowActions}
                      />
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
