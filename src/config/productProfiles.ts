import { isMarketingOpsRole } from '../utils/customerWorkboardRoles';
import {
  Brain,
  Inbox,
  CheckCircle,
  Zap,
  Layers,
  FolderOpen,
  Shield,
  Users,
  FileText,
  BookOpen,
  Link2,
  Settings,
  Contact,
  CheckSquare,
  Clock,
  Building2,
  BarChart3,
  Phone,
  TrendingUp,
  Newspaper
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

export const PILOT_TEAM_EMAILS = [
  'ryan@nestrealty.com',
  'matt@nestrealty.com',
  'matt.orr@nestrealty.com',
  'marcus@nestrealty.com',
  'marcus@capefearai.com',
  'mg@nestrealty.com',
  'melissa@nestrealty.com',
  'melissa.gagliardi@nestrealty.com',
  'ann@nestrealty.com',
  'ann.gunn@nestrealty.com',
  'james@nestrealty.com',
  'james.fort@nestrealty.com',
  'eric@nestrealty.com',
  'eric.knight@nestrealty.com',
  'jessica.keenan@nestrealty.com',
  'jessica@nestrealty.com',
  'eduardo.lovo@nestrealty.com',
  'eduardo@nestrealty.com',
  'asknora@nestrealty.com',
  'ask-nora@nestrealty.com'
];

export function getProductProfile(
  email: string | undefined,
  role: string | undefined,
  workspaceId: string
): { experience: ProductExperience; modules: ProductModuleAccess[] } {
  // Marketing ops land on Tasks/Calls — not Wilmington Ask Nora / Workboard.
  if (isMarketingOpsRole(role)) {
    return {
      experience: 'ryan_pilot',
      modules: [
        {
          moduleId: 'marketing',
          name: 'Tasks',
          tab: 'Tasks',
          icon: CheckSquare,
          visible: true,
          enabled: true
        },
        {
          moduleId: 'workboard',
          name: 'Ask Nora',
          tab: 'Workboard',
          icon: Brain,
          visible: true,
          enabled: true
        },
        {
          moduleId: 'news',
          name: 'News',
          tab: 'News',
          icon: Newspaper,
          visible: true,
          enabled: true
        },
        {
          moduleId: 'directory',
          name: 'Directory',
          tab: 'Directory',
          icon: Contact,
          visible: true,
          enabled: true
        },
        {
          moduleId: 'sops',
          name: 'Knowledge Library',
          tab: 'Staff SOP Templates',
          icon: FileText,
          visible: true,
          enabled: true
        },
        {
          moduleId: 'settings',
          name: 'Workspace Settings',
          tab: 'Settings',
          icon: Settings,
          visible: true,
          enabled: true
        }
      ]
    };
  }

  const isWilmington = workspaceId === 'nest-realty-demo' || workspaceId === 'nest-realty-wilmington' || workspaceId === 'ws_wilmington';
  
  if (isWilmington) {
    const cleanEmail = (email || '').toLowerCase().trim();
    const isPilotUser = PILOT_TEAM_EMAILS.includes(cleanEmail) || (!role?.includes('admin') && cleanEmail.endsWith('@nestrealty.com'));
    if (isPilotUser) {
      return {
        experience: 'ryan_pilot',
        modules: [
          {
            moduleId: 'workboard',
            name: 'Ask Nora',
            tab: 'Workboard',
            icon: Brain,
            visible: true,
            enabled: true
          },
          {
            moduleId: 'marketing',
            name: 'Tasks',
            tab: 'Tasks',
            icon: CheckSquare,
            visible: true,
            enabled: true
          },
          {
            moduleId: 'news',
            name: 'News',
            tab: 'News',
            icon: Newspaper,
            visible: true,
            enabled: true
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
            moduleId: 'directory',
            name: 'Directory',
            tab: 'Directory',
            icon: Contact,
            visible: true,
            enabled: true
          },
          {
            moduleId: 'sops',
            name: 'Knowledge Library',
            tab: 'Staff SOP Templates',
            icon: FileText,
            visible: true,
            enabled: true
          },
          {
            moduleId: 'market_intelligence',
            name: 'Market Intelligence',
            tab: 'Market Intelligence',
            icon: TrendingUp,
            visible: true,
            enabled: true
          },
          {
            moduleId: 'settings',
            name: 'Workspace Settings',
            tab: 'Settings',
            icon: Settings,
            visible: true,
            enabled: true
          }
        ]
      };
    } else {
      // Non-restricted users (administrators or coordinators) in Wilmington get full customer modules!
      return {
        experience: 'full_customer',
        modules: getFullCustomerModules()
      };
    }
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
      moduleId: 'pocket_matches',
      name: 'Pre-MLS Board',
      tab: 'Pre-MLS Board',
      icon: Building2,
      visible: true,
      enabled: true
    },
    {
      moduleId: 'workboard',
      name: 'Ask Nora',
      tab: 'Workboard',
      icon: Brain,
      visible: true,
      enabled: true
    },
    {
      moduleId: 'owner_brief',
      name: 'Owner Brief',
      tab: 'Owner Brief',
      icon: BarChart3,
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
      name: 'Tasks',
      tab: 'Tasks',
      icon: CheckSquare,
      visible: true,
      enabled: true
    },
    {
      moduleId: 'news',
      name: 'News',
      tab: 'News',
      icon: Newspaper,
      visible: true,
      enabled: true
    },
    {
      moduleId: 'market_intelligence',
      name: 'Market Intelligence',
      tab: 'Market Intelligence',
      icon: TrendingUp,
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
      moduleId: 'directory',
      name: 'Directory',
      tab: 'Directory',
      icon: Contact,
      visible: true,
      enabled: true
    },
    {
      moduleId: 'sops',
      name: 'Knowledge Library',
      tab: 'Staff SOP Templates',
      icon: CheckSquare,
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

/** Settings-page access helpers (used by RyanSettingsPage). */
export function isUserAdmin(email?: string, role?: string): boolean {
  const r = (role || '').toLowerCase();
  if (r.includes('admin') || r.includes('owner') || r.includes('broker-owner') || r === 'broker') {
    return true;
  }
  const e = (email || '').toLowerCase().trim();
  return PILOT_TEAM_EMAILS.includes(e) && (r.includes('broker') || r.includes('leadership') || r.includes('admin'));
}

export function getAllowedSettingsTabs(email?: string, role?: string): string[] {
  if (isUserAdmin(email, role)) {
    return ['team', 'billing', 'profile', 'tools', 'skills_matrix'];
  }
  return ['tools', 'skills_matrix'];
}
