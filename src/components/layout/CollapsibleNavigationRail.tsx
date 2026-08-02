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
  CheckSquare
} from 'lucide-react';
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

  // Accordion section open/collapsed state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'Daily Operations': true,
    'Work & Approvals': true,
    'Brokerage Management': true
  });

  React.useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/shapework/jobs');
        if (res.ok) {
          const data = await res.json();
          const activeJobs = (data.jobs || []).filter((j: any) => j.status === 'running' || j.status === 'planning');
          const approvalSteps = (data.steps || []).filter((s: any) => s.status === 'waiting_approval');
          setCounts({
            active: activeJobs.length,
            approvals: approvalSteps.length
          });
        }
      } catch (err) {
        console.error('Failed to fetch nav counts:', err);
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 4000);
    return () => clearInterval(interval);
  }, []);

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

  // Categorize nav items into accordion groups
  const categorizedGroups: { category: string; isStandalone?: boolean; items: typeof navItems }[] = [
    {
      category: 'Ask Nest Ops',
      isStandalone: true,
      items: navItems.filter(i => i.tab === 'Workboard' || i.tab === 'Nest Ops Hub')
    },
    {
      category: 'Daily Operations',
      items: navItems.filter(i => 
        ["Pitch & 'Aha!' Demo", 'Pre-MLS Board', 'Vendor Dispatch'].includes(i.tab)
      )
    },
    {
      category: 'Work & Approvals',
      items: navItems.filter(i => 
        ['Work Queue', 'Approvals', 'Operating Record'].includes(i.tab)
      )
    },
    {
      category: 'Brokerage Management',
      items: navItems.filter(i => 
        !['Workboard', 'Nest Ops Hub', "Pitch & 'Aha!' Demo", 'Pre-MLS Board', 'Vendor Dispatch', 'Work Queue', 'Approvals', 'Operating Record', 'Settings', 'Workspace Settings'].includes(i.tab)
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
    else if (Icon === Inbox) animClass += ' nav-icon-inbox';
    else if (Icon === CheckCircle) animClass += ' nav-icon-check';
    else if (Icon === Zap) animClass += ' nav-icon-sparkle';
    else if (Icon === Layers) animClass += ' nav-icon-layers';
    else if (Icon === FolderOpen) animClass += ' nav-icon-folder';
    else if (Icon === Shield) animClass += ' nav-icon-shield';
    else if (Icon === FileText) animClass += ' nav-icon-marketing';
    else if (Icon === Link2) animClass += ' nav-icon-link';
    else if (Icon === Settings) animClass += ' nav-icon-gear';
    else if (Icon === Users) animClass += ' nav-icon-users';
    else if (Icon === CheckSquare) animClass += ' nav-icon-check';

    return (
      <button
        key={item.name}
        onClick={() => {
          if (!isDisabled) {
            handleNavClick(item.tab);
          }
        }}
        disabled={isDisabled}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all group relative nav-item-shell ${
          isDisabled
            ? 'opacity-40 cursor-not-allowed text-[#F6F7F1]/40'
            : isActive
              ? 'nav-item-active text-white bg-white/10 shadow-sm border border-emerald-500/30'
              : 'text-[#F6F7F1]/70 hover:bg-white/5 hover:text-white'
        }`}
        aria-label={item.name}
      >
        <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${animClass} ${isActive ? 'text-emerald-300' : isDisabled ? 'text-[#F6F7F1]/40' : 'text-[#F6F7F1]/70 group-hover:text-white'}`} />
        {(!collapsed || isMobileOpen) && <span className="truncate">{item.name}</span>}

        {item.comingSoon && (!collapsed || isMobileOpen) && (
          <span className="ml-auto px-2 py-0.5 text-[8px] font-extrabold font-mono uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full whitespace-nowrap shadow-sm">
            Coming Soon
          </span>
        )}

        {item.badge && item.badge > 0 && (!collapsed || isMobileOpen) && (
          <span className={`ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full ${
            isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/10 text-white/80'
          }`}>
            {item.badge}
          </span>
        )}
        {item.badge && item.badge > 0 && collapsed && !isMobileOpen && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full" />
        )}

        {/* Custom CSS tooltips when collapsed */}
        {collapsed && !isMobileOpen && (
          <div className="absolute left-full ml-2 px-2.5 py-1 bg-stone-900 text-white text-[10px] font-bold font-sans uppercase tracking-wider rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 z-50 whitespace-nowrap">
            {item.name} {item.comingSoon ? '(Coming Soon)' : ''}
            {item.badge && item.badge > 0 ? (
              <span className="ml-1.5 px-1.5 py-0.2 bg-emerald-500 text-white rounded-full text-[9px] font-bold">
                {item.badge}
              </span>
            ) : null}
          </div>
        )}
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#01362D] border-r border-[#01362D] select-none text-white overflow-x-hidden">
      {/* Branding Header */}
      <div className="h-16 flex items-center justify-center px-4 border-b border-white/5 shrink-0">
        {(!collapsed || isMobileOpen) ? (
          <div className="flex items-center justify-center py-2 w-full px-2">
            <img src="/nest-realty-logo.png" alt="Nest Realty" className="h-8 w-auto object-contain max-w-[130px]" />
          </div>
        ) : (
          <div className="mx-auto flex items-center justify-center py-2 w-full">
            <img src="/nest_n.png" alt="Nest" className="h-[22px] w-[22px] object-contain" />
          </div>
        )}

        {/* Mobile close button */}
        {isMobileOpen && (
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white shrink-0"
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
              <div key={group.category} className="space-y-1 pb-2 border-b border-white/10">
                {(!collapsed || isMobileOpen) && (
                  <div className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-emerald-400">
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
                  className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#D0D6BB]/70 hover:text-white transition-colors cursor-pointer"
                >
                  <span>{group.category}</span>
                  {isOpen ? (
                    <ChevronDown className="w-3 h-3 text-[#D0D6BB]/60" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-[#D0D6BB]/60" />
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
        <div className="mx-3 my-2 p-3 bg-[rgba(246,247,241,0.08)] border border-[rgba(246,247,241,0.16)] rounded-xl space-y-2 text-left shrink-0">
          <div className="flex items-center gap-1.5 text-[#F6F7F1] font-sans font-bold text-[11px]">
            <HelpCircle className="w-3.5 h-3.5 text-[#D0D6BB]" />
            <span>Need help?</span>
          </div>
          <p className="text-[10px] text-[#F6F7F1]/60 leading-normal">
            Connect with the Ops team.
          </p>
          <button 
            onClick={() => setIsSupportModalOpen(true)}
            className="w-full py-1.5 bg-[#00635C] hover:bg-[#007c73] text-[#F6F7F1] text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center shadow-[0_2px_6px_rgba(0,99,92,0.3)] border-none"
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
      <div className="border-t border-white/5 bg-white/[0.02] shrink-0 flex flex-col overflow-hidden">
        {/* Operator Control Plane Link for Admins */}
        {(['marcus@shapework.co', 'adam@shapework.co', 'matt@shapework.co', 'admin@shapework.co'].includes(activeProfile?.email?.toLowerCase() || '') || activeProfile?.role === 'admin') && (
          <div className="px-3 pt-2">
            <a
              href="/internal"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 rounded-xl text-[10px] font-mono font-bold uppercase transition-all shadow-sm"
              title="Switch to Internal Operator Console"
            >
              <Sliders className="w-3.5 h-3.5 shrink-0 text-amber-300" />
              {(!collapsed || isMobileOpen) && <span className="truncate">Operator Console</span>}
            </a>
          </div>
        )}

        {/* User Profile Block */}
        {activeProfile && (
          <div className="flex flex-col border-t border-white/5 bg-black/10">
            <div className={`flex items-center ${(!collapsed || isMobileOpen) ? 'gap-3 px-4 py-2.5' : 'justify-center py-2.5'} min-w-0`}>
              <div className="w-8 h-8 rounded-full bg-[#D0D6BB] text-[#01362D] font-bold flex items-center justify-center shrink-0 text-xs shadow-sm border border-[rgba(246,247,241,0.15)]">
                {activeProfile.name.charAt(0)}
              </div>
              {(!collapsed || isMobileOpen) && (
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-xs font-bold text-white truncate">{activeProfile.name}</span>
                  <span className="text-[9px] text-[#D0D6BB] capitalize truncate">{activeProfile.role.replace(/_/g, ' ')}</span>
                </div>
              )}
            </div>

            {/* Workspace Settings Button below Ryan's Name */}
            <div className="px-3 pb-2.5">
              <button
                type="button"
                onClick={() => handleNavClick('Settings')}
                className={`w-full flex items-center ${(!collapsed || isMobileOpen) ? 'gap-2.5 px-3 py-2' : 'justify-center p-2'} rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'Settings' || currentTab === 'Workspace Settings'
                    ? 'bg-[#00635C] text-white shadow-md border border-emerald-400/40 font-bold'
                    : 'text-[#D0D6BB] hover:bg-white/5 hover:text-white border border-transparent'
                }`}
                title="Workspace Settings"
              >
                <Settings className="w-4 h-4 text-emerald-300 shrink-0" />
                {(!collapsed || isMobileOpen) && <span className="truncate font-mono text-[11px]">Workspace Settings</span>}
              </button>
            </div>
          </div>
        )}

        {/* Bottom control rail */}
        <div className={`p-3 border-t border-white/5 flex ${collapsed && !isMobileOpen ? 'flex-col items-center' : 'flex-row'} gap-2 overflow-hidden`}>
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
            className={`flex items-center justify-center text-[#D0D6BB] hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer shrink-0 ${collapsed && !isMobileOpen ? 'w-8 h-8' : 'flex-1 py-1.5'}`}
            title="Logout"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {(!collapsed || isMobileOpen) && <span className="text-[10px] font-bold uppercase tracking-wider ml-2 truncate">Logout</span>}
          </button>
          
          <button
            onClick={handleToggle}
            className={`flex text-[#D0D6BB] hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer justify-center items-center shrink-0 ${collapsed && !isMobileOpen ? 'w-8 h-8' : 'p-1.5'}`}
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
