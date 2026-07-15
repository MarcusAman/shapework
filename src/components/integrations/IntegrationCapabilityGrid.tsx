/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IntegrationConnector } from '../../types/integrations';

interface IntegrationCapabilityGridProps {
  connector: IntegrationConnector;
}

export default function IntegrationCapabilityGrid({ connector }: IntegrationCapabilityGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 text-xs font-mono p-3 bg-surface-subtle border border-border-soft rounded-xl">
      <div>
        <span className="text-[10px] text-text-tertiary block font-bold uppercase tracking-wider font-sans mb-1">
          Read Capabilities
        </span>
        {connector.readCapabilities.length > 0 ? (
          <div className="space-y-0.5">
            {connector.readCapabilities.map((cap, idx) => (
              <span key={idx} className="block text-[10px] text-text-secondary leading-tight">
                • {cap}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-text-tertiary italic text-[10px]">None available</span>
        )}
      </div>
      <div>
        <span className="text-[10px] text-text-tertiary block font-bold uppercase tracking-wider font-sans mb-1">
          Write Capabilities
        </span>
        {connector.writeCapabilities.length > 0 ? (
          <div className="space-y-0.5">
            {connector.writeCapabilities.map((cap, idx) => (
              <span key={idx} className="block text-[10px] text-text-secondary leading-tight">
                • {cap}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-text-tertiary italic text-[10px]">None available</span>
        )}
      </div>
    </div>
  );
}
