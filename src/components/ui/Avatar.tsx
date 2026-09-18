/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Canonical Avatar Primitive — Phase B1 Foundation
 * Multi-size user avatar container with fallback initials and image support.
 */

import React, { useState } from 'react';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function Avatar({
  name,
  src,
  size = 'md',
  className = ''
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-6 h-6 text-[10px]';
      case 'lg':
        return 'w-10 h-10 text-sm';
      case 'xl':
        return 'w-12 h-12 text-base';
      case 'md':
      default:
        return 'w-8 h-8 text-xs';
    }
  };

  const getInitials = (n: string) => {
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-bold select-none overflow-hidden shrink-0 border border-[var(--sw-border)] ${
        src && !imageError
          ? 'bg-[var(--sw-canvas)]'
          : 'bg-[var(--brand-soft)] text-[var(--brand-primary)]'
      } ${getSizeClasses()} ${className}`}
      title={name}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
