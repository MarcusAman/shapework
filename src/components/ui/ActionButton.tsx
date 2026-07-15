/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export default function ActionButton({
  children,
  variant = 'secondary',
  size = 'md',
  loading,
  className = '',
  ...props
}: ActionButtonProps) {
  const getStyles = () => {
    const sizeStyle = size === 'sm' ? 'px-3 py-1.5 text-[10px]' : 'px-4 py-2 text-xs';
    
    let colorStyle = 'bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary border border-border-soft hover:border-border-medium';
    if (variant === 'primary') {
      colorStyle = 'bg-brand-900 hover:bg-brand-800 text-white border border-transparent';
    } else if (variant === 'danger') {
      colorStyle = 'bg-status-atrisk-soft hover:bg-red-100 text-accent-red border border-status-atrisk/10';
    }
    
    return `${sizeStyle} ${colorStyle}`;
  };

  return (
    <button
      className={`font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 focus:outline-none disabled:opacity-40 disabled:pointer-events-none ${getStyles()} ${className}`}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      <span>{children}</span>
    </button>
  );
}
