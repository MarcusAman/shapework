/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical SearchInput Primitive — Phase B1 Foundation
 * Search input field with search icon, clear button, and Enter submit handling.
 */

import React, { useId } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchInput({
  value,
  onChange,
  onSearchSubmit,
  placeholder = 'Search...',
  id,
  className = '',
  ...props
}: SearchInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit(value);
    }
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <Search className="w-4 h-4 absolute left-3 text-[var(--sw-text-secondary)] pointer-events-none shrink-0" />
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full h-9 bg-[var(--sw-surface)] text-[var(--sw-text-primary)] placeholder-[var(--sw-text-muted)] text-xs font-medium rounded-full pl-9 pr-8 border border-[var(--sw-border)] hover:border-[var(--sw-border-strong)] focus:border-[var(--brand-secondary)] focus:ring-2 focus:ring-[var(--brand-secondary)]/30 outline-none transition-all"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2.5 p-1 text-[var(--sw-text-muted)] hover:text-[var(--sw-text-primary)] rounded-full hover:bg-[var(--sw-canvas)] transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
