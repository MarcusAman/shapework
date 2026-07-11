/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import LegalPageLayout from '../legal/LegalPageLayout';
import { privacyContent } from '../../content/legal/privacy';

interface PublicPrivacyProps {
  onNavigate: (path: string) => void;
}

export default function PublicPrivacy({ onNavigate }: PublicPrivacyProps) {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      effectiveDate="July 2, 2026"
      content={privacyContent}
      onNavigate={onNavigate}
    />
  );
}
