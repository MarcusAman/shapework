import {
  Brain,
  Inbox,
  CheckCircle,
  Sparkles,
  Layers,
  FolderOpen,
  Shield,
  Users,
  FileText,
  Link2,
  Settings
} from 'lucide-react';

export type ProductExperience =
  | 'full_customer'
  | 'ryan_pilot'
  | 'internal'
  | 'admin';

export interface ProductModuleAccess {
  moduleId: string;
  name: string;
  tab: string;
  icon: any;
  visible: boolean;
  enabled: boolean;
  comingSoon?: boolean;
}

export function getProductProfile(
  email: string | undefined,
  role: string | undefined,
  workspaceId: string
): { experience: ProductExperience; modules: ProductModuleAccess[] } {
  const isWilmington = workspaceId === 'nest-realty-demo' || workspaceId === 'nest-realty-wilmington';
  
  if (isWilmington) {
    return {
      experience: 'ryan_pilot',
      modules: [
        {
          moduleId: 'ryan_shield',
          name: 'Ryan Shield',
          tab: 'Ryan Shield',
          icon: Shield,
          visible: true,
          enabled: false,
          comingSoon: true
        },
        {
          moduleId: 'role_map',
          name: 'Role & Escalation Map',
          tab: 'Role Map',
          icon: Users,
          visible: true,
          enabled: true
        },
        {
          moduleId: 'owner_briefing',
          name: 'Owner Briefing',
          tab: 'Owner Brief',
          icon: Sparkles,
          visible: true,
          enabled: false,
          comingSoon: true
        }
      ]
    };
  }

  // 2. Admin Experience: Platform Administrators or special operator accounts
  if (role === 'admin' || email?.endsWith('@shapework.co')) {
    return {
      experience: 'admin',
      modules: getFullCustomerModules()
    };
  }

  // 3. Full Customer Experience (Default)
  return {
    experience: 'full_customer',
    modules: getFullCustomerModules()
  };
}

function getFullCustomerModules(): ProductModuleAccess[] {
  return [
    {
      moduleId: 'workboard',
      name: 'Command Center',
      tab: 'Workboard',
      icon: Brain,
      visible: true,
      enabled: true
    },
    {
      moduleId: 'work_queue',
      name: 'Requests',
      tab: 'Work Queue',
      icon: Inbox,
      visible: true,
      enabled: true
    },
    {
      moduleId: 'approvals',
      name: 'Approvals',
      tab: 'Approvals',
      icon: CheckCircle,
      visible: true,
      enabled: true
    },
    {
      moduleId: 'owner_brief',
      name: 'Owner Brief',
      tab: 'Owner Brief',
      icon: Sparkles,
      visible: true,
      enabled: true
    },
    {
      moduleId: 'operating_record',
      name: 'Operating Record',
      tab: 'Operating Record',
      icon: Layers,
      visible: true,
      enabled: true
    },
    {
      moduleId: 'physical_assets',
      name: 'Assets',
      tab: 'Physical Assets',
      icon: FolderOpen,
      visible: true,
      enabled: true
    },
    {
      moduleId: 'compliance',
      name: 'Compliance',
      tab: 'Compliance',
      icon: Shield,
      visible: true,
      enabled: true
    },
    {
      moduleId: 'marketing',
      name: 'Marketing',
      tab: 'Marketing',
      icon: FileText,
      visible: true,
      enabled: true
    },
    {
      moduleId: 'connections',
      name: 'Connections',
      tab: 'My Connections',
      icon: Link2,
      visible: true,
      enabled: true
    },
    {
      moduleId: 'settings',
      name: 'Settings',
      tab: 'Settings',
      icon: Settings,
      visible: true,
      enabled: true
    }
  ];
}
