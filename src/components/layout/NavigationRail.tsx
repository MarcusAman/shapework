/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
  ChevronRight
} from 'lucide-react';

interface NavigationRailProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function NavigationRail({
  currentTab,
  setCurrentTab,
  collapsed,
  setCollapsed
}: NavigationRailProps) {
  const primaryNavItems = [
    { name: 'Command Center', icon: Sliders },
    { name: 'Operations Inbox', icon: Inbox, badge: 3 },
    { name: 'AI Operator', icon: Zap },
    { name: 'Transactions', icon: FolderOpen },
    { name: 'Listings', icon: Home },
  ];

  const secondaryNavItems = [
    { name: 'Workflows', icon: Layers },
    { name: 'Communications', icon: Mail },
    { name: 'People', icon: Users },
    { name: 'Integrations', icon: Link2 },
    { name: 'Analytics', icon: TrendingUp },
    { name: 'Activity & Audit', icon: Clock },
    { name: 'Settings', icon: Settings },
  ];

  const renderItem = (item: { name: string; icon: React.ComponentType<any>; badge?: number }) => {
    const Icon = item.icon;
    const isActive = currentTab === item.name;

    return (
      <button
        key={item.name}
        onClick={() => setCurrentTab(item.name)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
          isActive
            ? 'bg-brand-green text-white shadow-sm'
            : 'text-text-secondary hover:bg-brand-green-soft hover:text-text-primary'
        }`}
        title={collapsed ? item.name : undefined}
      >
        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-text-secondary group-hover:text-text-primary'}`} />
        {!collapsed && <span className="truncate">{item.name}</span>}
        {item.badge && !collapsed && (
          <span className={`ml-auto px-2 py-0.5 text-xs font-bold rounded-full ${
            isActive ? 'bg-white/20 text-white' : 'bg-status-attention-soft text-status-attention'
          }`}>
            {item.badge}
          </span>
        )}
        {item.badge && collapsed && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-attention rounded-full" />
        )}
      </button>
    );
  };

  return (
    <aside
      className={`h-screen flex flex-col border-r border-border-subtle bg-surface transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Branding */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border-subtle shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center text-white font-serif font-bold text-lg">
              h
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-text-primary text-base tracking-tight leading-none">shapework.</span>
              <span className="text-[10px] text-text-tertiary mt-0.5">brokerage ops</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 mx-auto rounded-lg bg-brand-green flex items-center justify-center text-white font-serif font-bold text-lg">
            h
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
              Command
            </p>
          )}
          {primaryNavItems.map(renderItem)}
        </div>

        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
              System
            </p>
          )}
          {secondaryNavItems.map(renderItem)}
        </div>
      </div>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-border-subtle shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2 text-text-secondary hover:text-text-primary hover:bg-brand-green-soft rounded-lg transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
