/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import LegalPageLayout from '../legal/LegalPageLayout';
import { termsContent } from '../../content/legal/terms';

interface PublicTermsProps {
  onNavigate: (path: string) => void;
}

export default function PublicTerms({ onNavigate }: PublicTermsProps) {
  return (
    <LegalPageLayout
      title="Terms of Service and End User License Agreement"
      effectiveDate="July 2, 2026"
      content={termsContent}
      onNavigate={onNavigate}
    />
  );
}
