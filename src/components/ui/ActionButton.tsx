/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Backward compatibility wrapper for ActionButton -> canonical Button primitive.
 */

import React from 'react';
import Button, { ButtonProps } from './Button';

export default function ActionButton({
  variant = 'secondary',
  size = 'md',
  loading,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      loading={loading}
      className={className}
      {...props}
    >
      {children}
    </Button>
  );
}
