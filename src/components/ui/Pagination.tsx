/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical Pagination Primitive — Phase B3 Foundation
 * Standardized pagination bar with accessible Previous/Next controls and page context.
 */

import React from 'react';
import Button from './Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className = ''
}: PaginationProps) {
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  const getSummaryText = () => {
    if (totalItems !== undefined && pageSize !== undefined) {
      const start = Math.min((currentPage - 1) * pageSize + 1, totalItems);
      const end = Math.min(currentPage * pageSize, totalItems);
      return `Showing ${start} to ${end} of ${totalItems} records`;
    }
    return `Page ${currentPage} of ${totalPages}`;
  };

  return (
    <nav
      aria-label="Pagination Navigation"
      className={`flex items-center justify-between gap-4 py-3 px-4 bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-[var(--radius-md)] text-xs text-[var(--sw-text-secondary)] select-none ${className}`}
    >
      <div className="font-medium text-[var(--sw-text-secondary)]">
        {getSummaryText()}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={isFirstPage}
          onClick={() => !isFirstPage && onPageChange(currentPage - 1)}
          aria-label="Previous Page"
          icon={<ChevronLeft className="w-4 h-4" />}
        >
          Previous
        </Button>

        <Button
          variant="secondary"
          size="sm"
          disabled={isLastPage}
          onClick={() => !isLastPage && onPageChange(currentPage + 1)}
          aria-label="Next Page"
          icon={<ChevronRight className="w-4 h-4" />}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
