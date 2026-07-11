/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface SourceBadgeProps {
  source: 'gmail' | 'outlook' | 'sms' | 'docusign' | 'gcal' | 'gdrive' | 'rechat' | 'webhook';
}

export default function SourceBadge({ source }: SourceBadgeProps) {
  const getStyles = () => {
    switch (source) {
      case 'gmail':
        return 'bg-red-50 text-red-700 border-red-200/50';
      case 'outlook':
        return 'bg-blue-50 text-blue-700 border-blue-200/50';
      case 'docusign':
        return 'bg-blue-50 text-[#093070] border-blue-200/50';
      case 'rechat':
        return 'bg-rose-50 text-rose-700 border-rose-200/50';
      case 'gcal':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/50';
      case 'gdrive':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
      case 'sms':
        return 'bg-stone-50 text-stone-700 border-stone-200/50';
      case 'webhook':
      default:
        return 'bg-teal-50 text-teal-700 border-teal-200/50';
    }
  };

  const formatText = () => {
    switch (source) {
      case 'gcal':
        return 'Google Calendar';
      case 'gdrive':
        return 'Google Drive';
      case 'docusign':
        return 'DocuSign';
      case 'rechat':
        return 'Rechat';
      case 'gmail':
        return 'Gmail';
      case 'outlook':
        return 'Outlook';
      case 'sms':
        return 'SMS Link';
      case 'webhook':
      default:
        return 'Webhook API';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border select-none ${getStyles()}`}>
      {formatText()}
    </span>
  );
}
