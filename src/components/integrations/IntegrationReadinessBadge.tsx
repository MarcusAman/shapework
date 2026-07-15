/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IntegrationReadiness } from '../../types/integrations';

interface IntegrationReadinessBadgeProps {
  readiness: IntegrationReadiness;
}

export default function IntegrationReadinessBadge({ readiness }: IntegrationReadinessBadgeProps) {
  const getStyles = () => {
    switch (readiness) {
      case 'connected_demo':
        return 'bg-brand-100 text-accent-green border-accent-green/10';
      case 'oauth_ready':
      case 'api_key_ready':
      case 'webhook_ready':
        return 'bg-blue-50 text-accent-blue border-accent-blue/10';
      case 'partner_approval_required':
        return 'bg-status-attention-soft text-status-attention border-status-attention/10';
      case 'csv_import':
      case 'sftp_import':
      case 'manual_upload':
        return 'bg-status-attention-soft/50 text-text-secondary border-border-soft';
      case 'production_roadmap':
        return 'bg-stone-100 text-text-tertiary border-border-soft';
      case 'error':
        return 'bg-status-atrisk-soft text-accent-red border-status-atrisk/10';
      default:
        return 'bg-stone-50 text-text-tertiary border-border-soft';
    }
  };

  const getLabel = () => {
    switch (readiness) {
      case 'connected_demo':
        return 'Connected (Demo)';
      case 'oauth_ready':
        return 'OAuth Ready';
      case 'api_key_ready':
        return 'API Key Ready';
      case 'webhook_ready':
        return 'Webhook Ready';
      case 'partner_approval_required':
        return 'Partner API Scopes';
      case 'csv_import':
        return 'CSV Import';
      case 'sftp_import':
        return 'SFTP Import';
      case 'manual_upload':
        return 'Manual Upload';
      case 'production_roadmap':
        return 'Future Roadmap';
      case 'error':
        return 'Sync Error';
      default:
        return readiness.replace('_', ' ');
    }
  };

  return (
    <span className={`inline-block px-1.5 py-0.5 border rounded text-[9px] font-bold uppercase tracking-wider font-mono select-none ${getStyles()}`}>
      {getLabel()}
    </span>
  );
}
