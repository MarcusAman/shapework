import React from 'react';
import OrgChartWizardPage from '../settings/OrgChartWizardPage';
import type { RoleEscalationData } from './adapters';
import type { OrgModel } from '../../services/orgChartService';

interface RoleEscalationMapPageProps {
  data: RoleEscalationData;
  model: OrgModel;
}

export default function RoleEscalationMapPage({ data, model }: RoleEscalationMapPageProps) {
  return (
    <div className="w-full h-full flex flex-col relative select-none">
      <OrgChartWizardPage 
        state={{ workspaceId: 'nest-realty-demo' }} 
        embeddedTab="visual" 
      />
    </div>
  );
}
