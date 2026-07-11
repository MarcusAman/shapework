/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sliders,
  Inbox,
  Sparkles,
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
  Video
} from 'lucide-react';
import { Profile } from '../../types/shapework';

interface CollapsibleNavigationRailProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  activeProfile: Profile;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  appMode?: string;
}

export default function CollapsibleNavigationRail({
  currentTab,
  setCurrentTab,
  collapsed,
  setCollapsed,
  activeProfile,
  isMobileOpen,
  setIsMobileOpen,
  appMode
}: CollapsibleNavigationRailProps) {
  const [counts, setCounts] = React.useState({ active: 0, approvals: 0 });

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

  const primaryNavItems = [
    { name: 'Command Center', tab: 'Workboard', icon: Brain },
    { name: 'Requests', tab: 'Work Queue', icon: Inbox, badge: counts.active },
    { name: 'Approvals', tab: 'Approvals', icon: CheckCircle, badge: counts.approvals },
    { name: 'Owner Brief', tab: 'Owner Brief', icon: Sparkles },
    { name: 'Operating Record', tab: 'Operating Record', icon: Layers },
    { name: 'Assets', tab: 'Physical Assets', icon: FolderOpen },
    { name: 'Compliance', tab: 'Compliance', icon: Shield },
    { name: 'Marketing', tab: 'Marketing', icon: FileText },
    { name: 'Connections', tab: 'My Connections', icon: Link2 },
    { name: 'Settings', tab: 'Settings', icon: Settings },
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

  const renderItem = (item: { name: string; tab: string; icon: React.ComponentType<any>; badge?: number }) => {
    const Icon = item.icon;
    const isActive = currentTab === item.tab;

    // Map icon components to custom animation selectors
    let animClass = 'nav-icon-motion';
    if (Icon === Brain) animClass += ' nav-icon-brain';
    else if (Icon === Inbox) animClass += ' nav-icon-inbox';
    else if (Icon === CheckCircle) animClass += ' nav-icon-check';
    else if (Icon === Sparkles) animClass += ' nav-icon-sparkle';
    else if (Icon === Layers) animClass += ' nav-icon-layers';
    else if (Icon === FolderOpen) animClass += ' nav-icon-folder';
    else if (Icon === Shield) animClass += ' nav-icon-shield';
    else if (Icon === FileText) animClass += ' nav-icon-marketing';
    else if (Icon === Link2) animClass += ' nav-icon-link';
    else if (Icon === Settings) animClass += ' nav-icon-gear';

    return (
      <button
        key={item.name}
        onClick={() => handleNavClick(item.tab)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group relative nav-item-shell ${
          isActive
            ? 'nav-item-active text-white'
            : 'text-[#F6F7F1]/70 hover:bg-white/5 hover:text-white'
        }`}
        aria-label={
          item.tab === 'Workboard' 
            ? 'Workboard' 
            : item.tab === 'Work Queue' 
              ? 'Work Queue' 
              : item.tab === 'Compliance'
                ? 'Compliance Desk'
                : item.name
        }
      >
        <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 ${animClass} ${isActive ? 'text-white' : 'text-[#F6F7F1]/70 group-hover:text-white'}`} />
        {(!collapsed || isMobileOpen) && <span className="truncate">{item.name}</span>}
        {item.tab === 'Workboard' && <span className="sr-only">Workboard</span>}
        
        {item.badge && item.badge > 0 && (!collapsed || isMobileOpen) && (
          <span className={`ml-auto px-2 py-0.5 text-xs font-bold rounded-full ${
            isActive ? 'bg-[var(--sw-green-900)]/15 text-white' : 'bg-white/10 text-white/80'
          }`}>
            {item.badge}
          </span>
        )}
        {item.badge && item.badge > 0 && collapsed && !isMobileOpen && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
        )}

        {/* Custom CSS tooltips when collapsed */}
        {collapsed && !isMobileOpen && (
          <div className="absolute left-full ml-2 px-2.5 py-1 bg-stone-900 text-white text-[10px] font-bold font-sans uppercase tracking-wider rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 z-50 whitespace-nowrap">
            {item.name}
            {item.badge && item.badge > 0 ? (
              <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[9px] font-bold">
                {item.badge}
              </span>
            ) : null}
          </div>
        )}
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#01362D] border-r border-[#01362D] select-none text-white overflow-x-hidden no-horizontal-scrollbar">
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

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 overflow-x-hidden">
        {primaryNavItems.map(renderItem)}
      </div>

      {/* Support Card */}
      {(!collapsed || isMobileOpen) && (
        <div className="mx-3 my-2 p-3 bg-[rgba(246,247,241,0.08)] border border-[rgba(246,247,241,0.16)] rounded-xl space-y-2 text-left">
          <div className="flex items-center gap-1.5 text-[#F6F7F1] font-sans font-bold text-[11px]">
            <HelpCircle className="w-3.5 h-3.5 text-[#D0D6BB]" />
            <span>Need help?</span>
          </div>
          <p className="text-[10px] text-[#F6F7F1]/60 leading-normal">
            Connect with the Ops team.
          </p>
          <button 
            onClick={() => {
              setCurrentTab('Nest Ops Hub');
              window.dispatchEvent(new CustomEvent('open-intake-modal'));
            }}
            className="w-full py-1.5 bg-[#00635C] hover:bg-[#007c73] text-[#F6F7F1] text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center shadow-[0_2px_6px_rgba(0,99,92,0.3)]"
          >
            Contact Support
          </button>
        </div>
      )}

      {/* Integrated Sidebar Footer */}
      <div className="border-t border-white/5 bg-white/[0.02] shrink-0 flex flex-col overflow-hidden">
        {/* User Profile Block */}
        {activeProfile && (
          <div className={`flex items-center ${(!collapsed || isMobileOpen) ? 'gap-3 px-4 py-3' : 'justify-center py-3'} min-w-0`}>
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
        )}

        {/* Bottom control rail */}
        <div className={`p-3 border-t border-white/5 flex ${collapsed && !isMobileOpen ? 'flex-col items-center' : 'flex-row'} gap-2 overflow-hidden`}>
          {appMode !== 'production' && (
            <button
              onClick={async () => {
                sessionStorage.removeItem('shapework_demo_access');
                try {
                  await fetch('/api/auth/logout', { method: 'POST' });
                } catch {}
                window.location.href = '/login';
              }}
              className={`flex items-center justify-center text-[#D0D6BB] hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer shrink-0 ${collapsed && !isMobileOpen ? 'w-8 h-8' : 'flex-1 py-1.5'}`}
              title="Exit Demo Access"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {(!collapsed || isMobileOpen) && <span className="text-[10px] font-bold uppercase tracking-wider ml-2 truncate">Exit Demo</span>}
            </button>
          )}
          
          <button
            onClick={handleToggle}
            className={`flex text-[#D0D6BB] hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer justify-center items-center shrink-0 ${appMode === 'production' ? 'w-full py-1.5' : (collapsed && !isMobileOpen ? 'w-8 h-8' : 'p-1.5')}`}
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
        className={`hidden md:block h-screen shrink-0 transition-all duration-300 overflow-x-hidden no-horizontal-scrollbar ${
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
          <aside className="relative w-64 h-full flex flex-col z-50 animate-slide-in no-horizontal-scrollbar">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
