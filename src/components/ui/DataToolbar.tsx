/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical DataToolbar & FilterBar Primitive — Phase B3 Foundation
 * Calm, composed filter & search toolbar for data views with mobile filter collapse.
 */

import React, { useState } from 'react';
import SearchInput from './SearchInput';
import Button from './Button';
import Drawer from './Drawer';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';

export interface DataToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  activeFilterCount?: number;
  onResetFilters?: () => void;
  className?: string;
}

export function DataToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters,
  actions,
  activeFilterCount = 0,
  onResetFilters,
  className = ''
}: DataToolbarProps) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  return (
    <div className={`flex flex-col gap-3 w-full mb-4 ${className}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        {/* Search Bar */}
        <div className="flex-1 min-w-[200px]">
          <SearchInput
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        </div>

        {/* Desktop Filters */}
        {filters && (
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {filters}
          </div>
        )}

        {/* Mobile Filter Toggle */}
        {filters && (
          <div className="flex md:hidden items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              icon={<SlidersHorizontal className="w-4 h-4" />}
              onClick={() => setMobileFilterOpen(true)}
            >
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
          </div>
        )}

        {/* Additional Actions */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Mobile Filters Drawer */}
      {filters && (
        <Drawer
          isOpen={mobileFilterOpen}
          onClose={() => setMobileFilterOpen(false)}
          title="Filter Records"
          subtitle="Refine table results by office or status"
          footer={
            <div className="flex items-center justify-between w-full">
              {onResetFilters && (
                <Button variant="tertiary" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={onResetFilters}>
                  Reset
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={() => setMobileFilterOpen(false)}>
                Apply Filters
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {filters}
          </div>
        </Drawer>
      )}
    </div>
  );
}
