/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import LegalPageLayout from '../legal/LegalPageLayout';
import { smsConsentContent } from '../../content/legal/smsConsent';

interface PublicSmsConsentProps {
  onNavigate: (path: string) => void;
}

export default function PublicSmsConsent({ onNavigate }: PublicSmsConsentProps) {
  return (
    <LegalPageLayout
      title="SMS & Text Messaging Consent Policy"
      effectiveDate="July 2, 2026"
      content={smsConsentContent}
      onNavigate={onNavigate}
    />
  );
}
