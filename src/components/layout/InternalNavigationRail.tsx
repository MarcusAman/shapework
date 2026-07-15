import React from 'react';
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
  LogOut,
  X,
  Inbox,
  Mail,
  Link,
  RefreshCw,
  Sparkles,
  Phone
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
  const controlPlaneItems = [
    { name: 'System Overview', icon: Sliders },
    { name: 'Workspaces', icon: Layers },
    { name: 'Workspace Detail', icon: Compass },
    { name: 'Support Console', icon: Inbox },
    { name: 'Feature Flags', icon: Settings },
    { name: 'Pilot Readiness', icon: Play },
  ];

  const diagnosticItems = [
    { name: 'Integration Health', icon: RefreshCw },
    { name: 'Webhook Delivery', icon: Activity },
    { name: 'Notification Diagnostics', icon: Mail },
    { name: 'Voice Provider Diagnostics', icon: Phone },
    { name: 'Action Token Registry', icon: Link },
    { name: 'Security & Audit', icon: Shield },
    { name: 'System Logs', icon: Cpu },
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
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-medium transition-all group relative ${
          isActive
            ? 'bg-[var(--brand-soft)] text-[var(--brand-primary)] shadow-sm font-bold'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        }`}
        title={collapsed ? item.name : undefined}
        aria-label={item.name}
      >
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[var(--brand-primary)]' : 'text-white/70 group-hover:text-white'}`} />
        {(!collapsed || isMobileOpen) && <span className="truncate">{item.name}</span>}
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#1A1A1A] border-r border-[#1A1A1A] select-none text-white font-sans text-xs">
      {/* Branding Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
        {(!collapsed || isMobileOpen) ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center relative bg-orange-600 shrink-0 font-serif font-black text-lg select-none">
              SW
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-white text-base tracking-tight leading-none">shapework.</span>
              <span className="text-[9px] text-orange-400 uppercase tracking-widest font-mono font-bold mt-0.5">INTERNAL</span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center relative bg-orange-600 shrink-0 font-serif font-black text-lg select-none">
            SW
          </div>
        )}

        {isMobileOpen && (
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
        {/* Control Plane Section */}
        <div className="space-y-1">
          {(!collapsed || isMobileOpen) && (
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider font-mono block px-3 mb-2">
              Control Plane
            </span>
          )}
          {controlPlaneItems.map(renderItem)}
        </div>

        {/* Diagnostics Section */}
        <div className="space-y-1">
          {(!collapsed || isMobileOpen) && (
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider font-mono block px-3 mb-2 mt-4">
              Diagnostics & System
            </span>
          )}
          {diagnosticItems.map(renderItem)}
        </div>
      </div>

      {/* User Profile Block */}
      {activeProfile && (
        <div className="p-3 border-t border-white/10 bg-white/5 shrink-0">
          <div className={`flex items-center ${(!collapsed || isMobileOpen) ? 'gap-3 px-1' : 'justify-center'} py-1.5`}>
            <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {activeProfile.name.charAt(0)}
            </div>
            {(!collapsed || isMobileOpen) && (
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-xs font-semibold text-white truncate">{activeProfile.name}</span>
                <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wider truncate font-mono">{activeProfile.role?.replace('shapework_', '')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom control rail */}
      <div className="p-3 border-t border-white/10 shrink-0 flex gap-2">
        <button
          onClick={() => {
            window.location.pathname = '/app';
          }}
          className="flex-1 flex items-center justify-center py-2 text-white/70 hover:text-orange-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          title="Return to Customer App"
        >
          <LogOut className="w-4 h-4" />
          {(!collapsed || isMobileOpen) && <span className="text-xs font-semibold ml-2">Exit Admin</span>}
        </button>
        
        <button
          onClick={handleToggle}
          className="hidden md:flex p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer justify-center items-center"
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
