/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import LegalPageLayout from '../legal/LegalPageLayout';
import { smsTermsContent } from '../../content/legal/smsTerms';

interface PublicSmsTermsProps {
  onNavigate: (path: string) => void;
}

export default function PublicSmsTerms({ onNavigate }: PublicSmsTermsProps) {
  return (
    <LegalPageLayout
      title="SMS Terms of Service"
      effectiveDate="July 2, 2026"
      content={smsTermsContent}
      onNavigate={onNavigate}
    />
  );
}
