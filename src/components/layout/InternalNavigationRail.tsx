import React, { useState } from 'react';
import {
  Sliders,
  Layers,
  Compass,
  TrendingUp,
  Settings,
  Play,
  Activity,
  Cpu,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  X,
  Inbox,
  Mail,
  Link,
  RefreshCw,
  Zap,
  Phone,
  FileText
} from 'lucide-react';
import { Profile } from '../../types/shapework';

interface InternalNavigationRailProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  activeProfile: Profile;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  appMode?: string;
}

export default function InternalNavigationRail({
  currentTab,
  setCurrentTab,
  collapsed,
  setCollapsed,
  activeProfile,
  isMobileOpen,
  setIsMobileOpen,
  appMode
}: InternalNavigationRailProps) {
  // Accordion section collapse state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'Control Plane': true,
    'Market Intelligence': true,
    'Diagnostics & System': true
  });

  const toggleSection = (sectionKey: string) => {
    setOpenSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const navItems = [
    { name: 'Control Center', icon: Sliders, desc: 'Overview, feature flags & pilot readiness' },
    { name: 'Content & Intelligence', icon: FileText, desc: 'Auto blog generator & survey studio' },
    { name: 'Workspace Management', icon: Layers, desc: 'Tenant workspaces, detail & support impersonator' },
    { name: 'Security, Audit & Logs', icon: Shield, desc: 'Security audit, system logs & feedback intelligence' },
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

  const renderItem = (item: { name: string; icon: React.ComponentType<any> }) => {
    const Icon = item.icon;
    const isActive = currentTab === item.name;

    return (
      <button
        key={item.name}
        onClick={() => handleNavClick(item.name)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all group relative ${
          isActive
            ? 'bg-slate-900 text-white shadow-md font-bold'
            : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
        }`}
        title={collapsed ? item.name : undefined}
        aria-label={item.name}
      >
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'}`} />
        {(!collapsed || isMobileOpen) && <span className="truncate">{item.name}</span>}
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#F8FAFC] border-r border-slate-200 select-none text-slate-800 font-sans text-xs">
      {/* Branding Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 shrink-0 bg-white/50 backdrop-blur-sm">
        {(!collapsed || isMobileOpen) ? (
          <div className="flex items-center justify-center w-full">
            <span className="font-sans font-extrabold text-slate-900 text-lg tracking-tight leading-none text-center">shapework.</span>
          </div>
        ) : (
          <div className="w-8 h-8 mx-auto rounded-full flex items-center justify-center relative bg-slate-900 text-white shrink-0 font-sans font-black text-xs shadow-sm">
            SW
          </div>
        )}

        {isMobileOpen && (
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Consolidated Nav List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
        {(!collapsed || isMobileOpen) && (
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono px-2 mb-2 block">
            Control Plane Hubs
          </span>
        )}
        {navItems.map(renderItem)}
      </div>

      {/* User Profile Block */}
      {activeProfile && (
        <div className="p-3 border-t border-slate-200 bg-white/80 shrink-0">
          <div className={`flex items-center ${(!collapsed || isMobileOpen) ? 'gap-3 px-1' : 'justify-center'} py-1`}>
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
              {activeProfile.name.charAt(0)}
            </div>
            {(!collapsed || isMobileOpen) && (
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-xs font-bold text-slate-900 truncate">{activeProfile.name}</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider truncate font-mono">
                  {activeProfile.role?.replace('shapework_', '')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Control Rail */}
      <div className="p-3 border-t border-slate-200 shrink-0 flex gap-2 bg-slate-100/60">
        <button
          onClick={() => {
            window.location.pathname = '/app';
          }}
          className="flex-1 flex items-center justify-center py-2 px-3 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-200/80 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-xs text-xs font-bold gap-2"
          title="Return to Customer App"
        >
          <LogOut className="w-4 h-4 text-slate-500" />
          {(!collapsed || isMobileOpen) && <span>Exit Admin</span>}
        </button>
        
        <button
          onClick={handleToggle}
          className="hidden md:flex p-2 text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-200/80 border border-slate-200 rounded-xl transition-all cursor-pointer justify-center items-center shadow-xs"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden md:block h-screen shrink-0 transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
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
