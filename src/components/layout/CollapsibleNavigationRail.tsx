/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sliders,
  Inbox,
  Zap,
  FolderOpen,
  Home,
  Layers,
  Mail,
  Users,
  Link2,
  TrendingUp,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  HelpCircle,
  LogOut,
  Brain,
  Compass,
  Smartphone,
  Wrench,
  Play,
  Activity,
  Cpu,
  Shield,
  CheckCircle,
  FileText,
  Phone,
  Key,
  Video,
  CheckSquare,
  Contact,
  BookOpen,
  Building2,
  BarChart3,
  Link,
  Newspaper
} from 'lucide-react';
import { NestOrbVisualizer } from '../shared/NestOrbVisualizer';
import ContactSupportModal from '../shared/ContactSupportModal';
import { Profile } from '../../types/shapework';
import { getProductProfile } from '../../config/productProfiles';

interface CollapsibleNavigationRailProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  activeProfile: Profile;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  appMode?: string;
  workspaceId?: string;
}

export default function CollapsibleNavigationRail({
  currentTab,
  setCurrentTab,
  collapsed,
  setCollapsed,
  activeProfile,
  isMobileOpen,
  setIsMobileOpen,
  appMode,
  workspaceId
}: CollapsibleNavigationRailProps) {
  const [counts, setCounts] = useState({ active: 0, approvals: 0 });
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [collapsedLogoFailed, setCollapsedLogoFailed] = useState(false);

  // Accordion section open/collapsed state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'Daily Operations': true,
    'Brokerage Management': true
  });

  React.useEffect(() => {
    let isMounted = true;
    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem('shapework_session_token') || 'usr_ryan';
        const headers = {
          'Authorization': `Bearer ${token}`,
          'x-workspace-id': workspaceId || 'nest-realty-wilmington'
        };

        const [tasksRes, jobsRes] = await Promise.all([
          fetch('/api/marketing/tasks', { headers }),
          fetch('/api/shapework/jobs', { headers })
        ]);

        let activeCount = 0;
        let approvalsCount = 0;

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          const tasks = tasksData.tasks || [];
          activeCount = tasks.filter((t: any) => !t.isArchived && t.status !== 'archived' && t.status !== 'completed' && t.status !== 'approved').length;
        }

        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          const approvalSteps = (jobsData.steps || []).filter((s: any) => s.status === 'waiting_approval');
          approvalsCount = approvalSteps.length;
        }

        if (isMounted) {
          setCounts({
            active: activeCount,
            approvals: approvalsCount
          });
        }
      } catch {
        // Gracefully ignore network dropouts during server rebuilds
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [workspaceId]);

  const { modules } = getProductProfile(
    activeProfile?.email,
    activeProfile?.role,
    workspaceId || 'nest-realty-demo'
  );

  const navItems = modules
    .filter(m => m.visible)
    .map(m => ({
      ...m,
      badge: m.tab === 'Work Queue' ? counts.active : (m.tab === 'Approvals' ? counts.approvals : undefined)
    }));

  const isRyanDashboardScope = 
    typeof window !== 'undefined' && (
      new URLSearchParams(window.location.search).get('scope') === 'ryans-dashboard' ||
      localStorage.getItem('customer_app_scope') === 'ryans-dashboard'
    );

  // Categorize nav items into accordion groups based on scope
  const categorizedGroups: { category: string; isStandalone?: boolean; items: any[] }[] = isRyanDashboardScope ? [
    {
      category: "Ask Nora",
      isStandalone: true,
      items: [
        {
          name: "Ask Nora",
          tab: "Workboard",
          icon: Brain,
          enabled: true
        }
      ]
    },
    {
      category: "Daily Work",
      items: [
        {
          name: "Tasks",
          tab: "Tasks",
          icon: CheckSquare,
          enabled: true,
          badge: counts.active > 0 ? counts.active : undefined
        },
        {
          name: "News",
          tab: "News",
          icon: Newspaper,
          enabled: true
        }
      ]
    },
    {
      category: "Brokerage Operations",
      items: [
        {
          name: "Role Map & Escalations",
          tab: "Role Map",
          icon: Users,
          enabled: true
        },
        {
          name: "Directory",
          tab: "Directory",
          icon: Contact,
          enabled: true
        },
        {
          name: "Knowledge Library",
          tab: "Knowledge Library",
          icon: BookOpen,
          enabled: true
        },
        {
          name: "Market Intelligence",
          tab: "Market Intelligence",
          icon: BarChart3,
          enabled: true
        }
      ]
    }
  ] : [
    {
      category: 'Ask Nora',
      isStandalone: true,
      items: navItems.filter(i => i.tab === 'Workboard' || i.tab === 'Nest Ops Hub' || i.name === 'Ask Nora')
    },
    {
      category: 'Daily Operations',
      items: [
        ...navItems.filter(i => i.tab === 'Tasks' || i.name === 'Tasks' || i.tab === 'Marketing Intake' || i.name === 'Marketing Intake'),
        ...navItems.filter(i => i.tab === 'News' || i.name === 'News'),
        ...navItems.filter(i => i.tab === 'Pre-MLS Board' || i.name === 'Pre-MLS Board')
      ]
    },
    {
      category: 'Brokerage Management',
      items: navItems.filter(i => 
        !['Workboard', 'Nest Ops Hub', 'Ask Nora', 'Tasks', 'Marketing Intake', 'News', 'Pre-MLS Board', 'Work Queue', 'Approvals', 'Operating Record', 'Settings', 'Workspace Settings'].includes(i.tab)
      )
    }
  ];

  const handleToggle = () => {
    const nextVal = !collapsed;
    setCollapsed(nextVal);
    localStorage.setItem('shapework-sidebar-collapsed', String(nextVal));
  };

  const handleNavClick = (tabName: string) => {
    setCurrentTab(tabName);
    setIsMobileOpen(false);
  };

  const toggleSection = (category: string) => {
    setOpenSections(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const renderItem = (item: { 
    name: string; 
    tab: string; 
    icon: React.ComponentType<any>; 
    badge?: number;
    enabled: boolean;
    comingSoon?: boolean;
  }) => {
    const Icon = item.icon;
    const isActive = item.enabled && currentTab === item.tab;
    const isDisabled = !item.enabled;

    let animClass = 'nav-icon-motion';
    if (Icon === Brain) animClass += ' nav-icon-brain';
    else if (Icon === Phone) animClass += ' nav-icon-phone';
    else if (Icon === Wrench) animClass += ' nav-icon-wrench';
    else if (Icon === TrendingUp || Icon === BarChart3) animClass += ' nav-icon-trend';
    else if (Icon === Users || Icon === Contact) animClass += ' nav-icon-users';
    else if (Icon === Settings) animClass += ' nav-icon-gear';
    else if (Icon === Inbox) animClass += ' nav-icon-inbox';
    else if (Icon === CheckCircle || Icon === CheckSquare) animClass += ' nav-icon-check';
    else if (Icon === Zap) animClass += ' nav-icon-sparkle';
    else if (Icon === Layers) animClass += ' nav-icon-layers';
    else if (Icon === FolderOpen) animClass += ' nav-icon-folder';
    else if (Icon === Shield) animClass += ' nav-icon-shield';
    else if (Icon === FileText || Icon === BookOpen) animClass += ' nav-icon-book';
    else if (Icon === Building2 || Icon === Home) animClass += ' nav-icon-building';
    else if (Icon === Link2 || Icon === Link) animClass += ' nav-icon-link';
    else if (Icon === Clock) animClass += ' nav-icon-clock';

    return (
      <button
        key={item.name}
        onClick={() => {
          if (!isDisabled) {
            handleNavClick(item.tab);
          }
        }}
        disabled={isDisabled}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group relative nav-item-shell focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 focus-visible:outline-none min-h-[40px] cursor-pointer ${
          isDisabled
            ? 'opacity-40 cursor-not-allowed text-[var(--sw-text-muted)]'
            : isActive
              ? 'nav-item-active text-white bg-[var(--brand-primary)] border border-[var(--brand-primary)] shadow-2xs font-bold'
              : 'text-[var(--sw-text-secondary)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-primary)]'
        }`}
        aria-label={item.name}
      >
        {item.tab === 'Workboard' || item.tab === 'Nest Ops Hub' || item.tab === 'Ask Nest Ops' || item.tab === 'Ask Nora' || item.name === 'Ask Nest Ops' || item.name === 'Ask Nora' || Icon === Brain ? (
          <NestOrbVisualizer size="sm" customSize={24} className="shadow-xs" />
        ) : (
          <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${animClass} ${isActive ? 'text-white' : isDisabled ? 'text-[var(--sw-text-muted)]' : 'text-[var(--brand-primary)] group-hover:text-[var(--brand-primary)]'}`} />
        )}
        {(!collapsed || isMobileOpen) && <span className="truncate text-left">{item.name}</span>}

        {item.comingSoon && (!collapsed || isMobileOpen) && (
          <span className="ml-auto px-2 py-0.5 text-[8px] font-extrabold font-mono uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 rounded-full whitespace-nowrap shadow-2xs">
            Coming Soon
          </span>
        )}

        {item.badge && item.badge > 0 && (!collapsed || isMobileOpen) && (
          <span className={`ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full ${
            isActive ? 'bg-white/20 text-white border border-white/30' : 'bg-[var(--sw-canvas)] text-[var(--sw-text-secondary)] group-hover:bg-white group-hover:text-[var(--brand-primary)]'
          }`}>
            {item.badge}
          </span>
        )}
        {item.badge && item.badge > 0 && collapsed && !isMobileOpen && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--brand-primary)] rounded-full" />
        )}

        {/* Custom CSS tooltips when collapsed: light surface with dark readable text */}
        {collapsed && !isMobileOpen && (
          <div className="absolute left-full ml-2.5 px-3 py-1.5 bg-[var(--sw-surface)] text-[var(--sw-text-primary)] border border-[var(--sw-border)] text-[11px] font-bold font-sans uppercase tracking-wider rounded-lg shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 z-50 whitespace-nowrap">
            {item.name} {item.comingSoon ? '(Coming Soon)' : ''}
            {item.badge && item.badge > 0 ? (
              <span className="ml-1.5 px-1.5 py-0.2 bg-[var(--brand-soft)] text-[var(--brand-primary)] border border-[var(--brand-primary)]/20 rounded-full text-[9px] font-bold">
                {item.badge}
              </span>
            ) : null}
          </div>
        )}
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[var(--sw-surface)] border-r border-[var(--sw-border)] select-none text-[var(--sw-text-primary)] overflow-x-hidden">
      {/* Branding Header */}
      <div className="h-16 flex items-center justify-center px-4 border-b border-[var(--sw-border)] shrink-0 bg-[var(--sw-surface)]">
        {(!collapsed || isMobileOpen) ? (
          <div className="flex items-center justify-center gap-2.5 py-2 w-full px-1 mx-auto">
            {!logoFailed ? (
              <picture className="flex items-center justify-center">
                <source srcSet="/grvvh438gkf2xs9ggdjf.avif" type="image/avif" />
                <img 
                  src="/nest-realty-logo-green.png" 
                  alt="Nest Realty"
                  className="h-8 max-w-[140px] object-contain shrink-0 mx-auto"
                  onError={() => setLogoFailed(true)}
                />
              </picture>
            ) : (
              <div className="flex items-center justify-center gap-2.5 font-serif font-bold select-none mx-auto">
                <div className="w-8 h-8 rounded-xl bg-[var(--brand-primary)] text-white flex items-center justify-center font-sans text-xs font-black shadow-sm shrink-0">
                  N
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs tracking-tight text-[var(--brand-primary)] font-extrabold uppercase font-sans leading-none">NEST REALTY</span>
                  <span className="text-[9px] text-stone-500 font-medium font-sans mt-0.5">Wilmington Ops</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto flex items-center justify-center py-2 w-full">
            {!collapsedLogoFailed ? (
              <img 
                src="/nest_n_green.svg" 
                alt="Nest"
                className="h-8 w-8 object-contain shrink-0 mx-auto rounded-full"
                onError={() => setCollapsedLogoFailed(true)}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center font-serif text-sm font-bold shadow-sm mx-auto select-none">
                n
              </div>
            )}
          </div>
        )}

        {/* Mobile close button */}
        {isMobileOpen && (
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1 rounded-lg hover:bg-[var(--sw-canvas)] text-[var(--brand-primary)] shrink-0 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List with Accordion Categories & Hidden Scrollbar */}
      <div 
        className="flex-1 overflow-y-auto py-3 px-3 space-y-4 overflow-x-hidden"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {categorizedGroups.map(group => {
          if (group.items.length === 0) return null;
          const isOpen = openSections[group.category] !== false;

          if (group.isStandalone) {
            return (
              <div key={group.category} className="space-y-1 pb-2 border-b border-[var(--sw-border)]">
                {(!collapsed || isMobileOpen) && (
                  <div className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-[var(--brand-secondary)]">
                    {group.category}
                  </div>
                )}
                <div className="space-y-0.5">
                  {group.items.map(renderItem)}
                </div>
              </div>
            );
          }

          return (
            <div key={group.category} className="space-y-1">
              {/* Category Accordion Header */}
              {(!collapsed || isMobileOpen) && (
                <button
                  onClick={() => toggleSection(group.category)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--sw-text-secondary)] hover:text-[var(--brand-primary)] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:outline-none rounded-md"
                >
                  <span>{group.category}</span>
                  {isOpen ? (
                    <ChevronDown className="w-3 h-3 text-[var(--sw-text-secondary)]" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-[var(--sw-text-secondary)]" />
                  )}
                </button>
              )}

              {/* Category Items */}
              {(isOpen || collapsed) && (
                <div className="space-y-0.5">
                  {group.items.map(renderItem)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Support Card */}
      {(!collapsed || isMobileOpen) && (
        <div className="mx-3 my-2 p-3 bg-[var(--sw-canvas)] border border-[var(--sw-border)] rounded-xl space-y-2 text-left shrink-0">
          <div className="flex items-center gap-1.5 text-[var(--sw-text-primary)] font-sans font-bold text-[11px]">
            <HelpCircle className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
            <span>Need help?</span>
          </div>
          <p className="text-[10px] text-[var(--sw-text-secondary)] leading-normal">
            Connect with the Ops team.
          </p>
          <button 
            onClick={() => setIsSupportModalOpen(true)}
            className="w-full py-1.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center shadow-xs border border-transparent focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:outline-none"
          >
            Contact Support
          </button>
        </div>
      )}

      {/* Contact Support Modal Overlay */}
      <ContactSupportModal 
        isOpen={isSupportModalOpen} 
        onClose={() => setIsSupportModalOpen(false)} 
      />

      {/* Integrated Sidebar Footer */}
      <div className="border-t border-[var(--sw-border)] bg-[var(--sw-surface)] shrink-0 flex flex-col overflow-hidden">
        {/* Operator Control Plane Link for Admins */}
        {(['marcus@shapework.co', 'adam@shapework.co', 'matt@shapework.co', 'admin@shapework.co'].includes(activeProfile?.email?.toLowerCase() || '') || activeProfile?.role === 'admin') && (
          <div className="px-3 pt-2">
            <a
              href="/internal"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-[10px] font-mono font-bold uppercase transition-all shadow-xs focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
              title="Switch to Internal Operator Console"
            >
              <Sliders className="w-3.5 h-3.5 shrink-0 text-amber-700" />
              {(!collapsed || isMobileOpen) && <span className="truncate">Operator Console</span>}
            </a>
          </div>
        )}

        {/* User Profile Block */}
        {activeProfile && (
          <div className="flex flex-col border-t border-[var(--sw-border)] bg-[var(--sw-surface)]">
            <div className={`flex items-center ${(!collapsed || isMobileOpen) ? 'gap-3 px-4 py-2.5' : 'justify-center py-2.5'} min-w-0`}>
              <div className="w-8 h-8 rounded-full bg-[var(--brand-soft)] text-[var(--brand-primary)] font-bold flex items-center justify-center shrink-0 text-xs shadow-xs border border-[var(--brand-primary)]/20">
                {activeProfile.name.charAt(0)}
              </div>
              {(!collapsed || isMobileOpen) && (
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-xs font-bold text-[var(--sw-text-primary)] truncate">{activeProfile.name}</span>
                  <span className="text-[10px] text-[var(--sw-text-secondary)] capitalize font-medium truncate">{activeProfile.role.replace(/_/g, ' ')}</span>
                </div>
              )}
            </div>

            {/* Workspace Settings Button below Ryan's Name */}
            <div className="px-3 pb-2.5">
              <button
                type="button"
                onClick={() => handleNavClick('Settings')}
                className={`w-full flex items-center ${(!collapsed || isMobileOpen) ? 'gap-2.5 px-3 py-2' : 'justify-center p-2'} rounded-xl text-xs font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 focus-visible:outline-none ${
                  currentTab === 'Settings' || currentTab === 'Workspace Settings'
                    ? 'bg-[var(--brand-primary)] text-white border border-[var(--brand-primary)] font-bold shadow-2xs'
                    : 'text-[var(--sw-text-secondary)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-primary)] border border-transparent'
                }`}
                title="Workspace Settings"
              >
                <Settings className={`w-4 h-4 shrink-0 ${currentTab === 'Settings' || currentTab === 'Workspace Settings' ? 'text-white' : 'text-[var(--brand-primary)]'}`} />
                {(!collapsed || isMobileOpen) && <span className="truncate font-sans font-semibold text-[11px]">Workspace Settings</span>}
              </button>
            </div>
          </div>
        )}

        {/* Bottom control rail */}
        <div className={`p-3 border-t border-[var(--sw-border)] bg-[var(--sw-canvas)] flex ${collapsed && !isMobileOpen ? 'flex-col items-center' : 'flex-row'} gap-2 overflow-hidden`}>
          <button
            onClick={async () => {
              sessionStorage.setItem('shapework_logged_out', 'true');
              sessionStorage.removeItem('shapework_demo_access');
              localStorage.removeItem('shapework_session_token');
              localStorage.removeItem('shapework_demo_access');
              try {
                await fetch('/api/auth/logout', { method: 'POST' });
              } catch {}
              window.location.href = '/login';
            }}
            className={`flex items-center justify-center text-[var(--sw-text-secondary)] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-soft)] rounded-lg transition-colors cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 focus-visible:outline-none ${collapsed && !isMobileOpen ? 'w-8 h-8' : 'flex-1 py-1.5'}`}
            title="Logout"
          >
            <LogOut className="w-4 h-4 shrink-0 text-[var(--sw-text-secondary)]" />
            {(!collapsed || isMobileOpen) && <span className="text-[10px] font-bold uppercase tracking-wider ml-2 truncate">Logout</span>}
          </button>
          
          <button
            onClick={handleToggle}
            className={`flex text-[var(--sw-text-secondary)] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-soft)] rounded-lg transition-colors cursor-pointer justify-center items-center shrink-0 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 focus-visible:outline-none ${collapsed && !isMobileOpen ? 'w-8 h-8' : 'p-1.5'}`}
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0" />}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block h-screen shrink-0 transition-all duration-300 overflow-x-hidden ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="relative w-64 h-full flex flex-col z-50 animate-slide-in">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
