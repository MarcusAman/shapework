import React, { useState } from 'react';
import { Search, Bell, Plus, Calendar, ChevronDown, Check, Menu, X, LogOut } from 'lucide-react';
import { Profile } from '../../types/shapework';

interface TopBarProps {
  activeProfile: Profile;
  profiles: Profile[];
  onSwitchProfile: (profileId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  onTriggerCreateAction?: () => void;
  isSyncing?: boolean;
  onSync?: () => void;
  onToggleSidebar?: () => void;
  demoMode: 'founder' | 'coo' | 'tech';
  onChangeDemoMode: (mode: 'founder' | 'coo' | 'tech') => void;
  appMode?: string;
  workspaceName?: string;
  onToggleOperator?: () => void;
  variant?: 'default' | 'minimal';
  title?: string;
}

export default function TopBar({
  activeProfile,
  profiles,
  onSwitchProfile,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  onTriggerCreateAction,
  isSyncing = false,
  onSync,
  onToggleSidebar,
  demoMode,
  onChangeDemoMode,
  appMode = 'development',
  workspaceName = 'Brokerage Workspace',
  onToggleOperator,
  variant = 'default',
  title
}: TopBarProps) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

  const mockNotifications = [
    { id: 1, title: 'Appraisal Contingency Warning', detail: '102 Pine St finance expiry is in 5 days.', time: '2h ago', read: false },
    { id: 2, title: 'Listing Rejected by MLS', detail: '3206 Highland Ave lacks initials on page 4.', time: 'Yesterday', read: false },
    { id: 3, title: 'Workload Capacity Alert', detail: 'Diane Ross is currently at 95% workload.', time: 'Yesterday', read: true },
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit(searchQuery);
    }
  };

  if (variant === 'minimal') {
    return (
      <header className="h-14 bg-transparent flex items-center justify-between px-6 shrink-0 relative z-30 gap-4 select-none">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3.5 shrink-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-1.5 rounded-lg hover:bg-[rgba(246,247,241,0.06)] shrink-0 transition-colors text-white"
              aria-label="Toggle Navigation Drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          {title && (
            <h1 className="font-serif font-black text-[17px] md:text-lg text-white tracking-tight leading-none pt-0.5">
              {title}
            </h1>
          )}
        </div>

        {/* Right: Contact Info Card */}
        <div className="flex items-center gap-3 select-none">
          <div className="flex items-center gap-3.5 text-[10px] font-mono text-[#D0D6BB] font-semibold bg-[rgba(246,247,241,0.04)] px-3.5 py-1.5 border border-[rgba(246,247,241,0.1)] rounded-full backdrop-blur-sm">
            <span className="text-[#F6F7F1]">AskNestOps@nestrealty.com</span>
            <span className="text-[rgba(246,247,241,0.22)]">|</span>
            <span className="text-[#F6F7F1]">+1 (910) -507-2047</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 border-b border-[rgba(246,247,241,0.12)] bg-[rgba(1, 54, 45, 0.55)] backdrop-blur-md flex items-center justify-between px-6 shrink-0 relative z-30 gap-4 select-none">
      {/* Left side: Menu toggle & Workspace name */}
      <div className="flex items-center gap-4 shrink-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-lg hover:bg-[rgba(246,247,241,0.08)] text-[#D0D6BB] hover:text-white shrink-0 transition-colors"
            aria-label="Toggle Navigation Drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <span className="px-3 py-1 bg-[#00635C] text-white text-[10px] font-bold uppercase rounded-lg shadow-sm border border-[rgba(246,247,241,0.15)] select-none">
          {workspaceName || 'Nest Ops Hub'}
        </span>
      </div>

      {/* Center Spacer */}
      <div className="flex-1" />

      {/* Actions and Profile */}
      <div className="flex items-center gap-3">
        {onToggleOperator && (
          <button
            type="button"
            onClick={onToggleOperator}
            className="w-7 h-7 rounded-full overflow-hidden bg-[var(--sw-mint-100)] flex items-center justify-center cursor-pointer border border-[var(--sw-border)] hover:scale-105 active:scale-95 transition-all shadow-sm shrink-0 mr-1"
            title="Open AI Command Center (Cmd+K)"
          >
            <video
              src="/Blue_ai.mp4#t=5,10"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </button>
        )}

        {/* Contact Info Group */}
        <div className="hidden lg:flex items-center gap-3.5 text-[10px] font-mono text-[#D0D6BB] font-semibold bg-[rgba(246,247,241,0.05)] px-4 py-1.5 border border-[rgba(246,247,241,0.12)] rounded-full">
          <span className="text-[#F6F7F1]">askNestOps@nestrealty.com</span>
          <span className="text-[rgba(246,247,241,0.22)]">|</span>
          <span className="text-[#F6F7F1]">+1 (910) -507-2047</span>
        </div>

        {/* Sync Button with pulsing green dot */}
        {onSync && (
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="hidden sm:flex items-center gap-1.5 text-xs text-[#F6F7F1]/80 hover:text-white px-3 py-1.5 border border-[rgba(246,247,241,0.12)] rounded-full bg-[rgba(246,247,241,0.05)] hover:bg-[rgba(246,247,241,0.1)] font-semibold transition-all select-none cursor-pointer"
          >
            <span className={isSyncing ? 'w-2 h-2 rounded-full bg-amber-500 animate-pulse' : 'sync-dot'} />
            <span className="font-mono">{isSyncing ? 'Syncing...' : 'Synced'}</span>
          </button>
        )}

        {/* Create Action Button */}
        <button
          onClick={onTriggerCreateAction}
          className="sw-btn sw-btn-primary py-1.5 px-3.5 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Action</span>
        </button>

        {/* Notifications Indicator */}
        <div className="relative">
          <button
            onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
            className="p-2 text-[#D0D6BB] hover:text-white hover:bg-[rgba(246,247,241,0.08)] rounded-full relative transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D96B5F] rounded-full" />
          </button>

          {notificationDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotificationDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-[#01362D] border border-[rgba(246,247,241,0.12)] rounded-2xl shadow-[var(--sw-shadow-soft)] py-2 z-50 text-sm">
                <div className="px-4 py-2 border-b border-[rgba(246,247,241,0.08)] flex justify-between items-center">
                  <span className="font-semibold text-white">Notifications</span>
                  <span className="text-xs text-[#D0D6BB] font-medium cursor-pointer hover:underline">Mark all read</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {mockNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 border-b border-[rgba(246,247,241,0.08)] hover:bg-[rgba(246,247,241,0.04)] cursor-pointer last:border-none ${
                        !notif.read ? 'bg-[rgba(0,99,92,0.15)]' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-xs text-white">{notif.title}</span>
                        <span className="text-[10px] text-[#D0D6BB]/75 shrink-0 ml-2">{notif.time}</span>
                      </div>
                      <p className="text-xs text-[#D0D6BB]/60 mt-1">{notif.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile */}
        {activeProfile && (() => {
          const showPersonaSwitcher = appMode === 'development' || (activeProfile.role as string) === 'platform_admin' || activeProfile.role === 'admin';
          return (
            <div className="relative">
              <button
                onClick={() => showPersonaSwitcher && setProfileDropdownOpen(!profileDropdownOpen)}
                className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full transition-colors border border-[rgba(246,247,241,0.12)] bg-[rgba(246,247,241,0.05)] ${
                  showPersonaSwitcher ? 'hover:bg-[rgba(246,247,241,0.10)] cursor-pointer' : ''
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-[#D0D6BB] text-[#01362D] flex items-center justify-center text-xs font-bold">
                  {activeProfile.name.charAt(0)}
                </div>
                <div className="hidden lg:flex flex-col items-start text-left">
                  <span className="text-xs font-semibold text-white leading-tight">{activeProfile.name}</span>
                  <span className="text-[10px] text-[#D0D6BB] capitalize leading-none">{activeProfile.role.replace('_', ' ')}</span>
                </div>
                {showPersonaSwitcher && <ChevronDown className="w-3.5 h-3.5 text-[#D0D6BB]" />}
              </button>

              {showPersonaSwitcher && profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-2xl shadow-[var(--sw-shadow-soft)] py-2 z-50 text-sm">
                    <div className="px-4 py-1.5 border-b border-[var(--sw-border)] text-[10px] font-bold text-[var(--sw-muted)] uppercase tracking-wider">
                      Switch Persona Demo
                    </div>
                    {profiles.map((p) => {
                      const isActive = p.id === activeProfile.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            onSwitchProfile(p.id);
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-4 py-2 text-left text-[var(--sw-text)] hover:bg-[var(--sw-card)] transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-xs">{p.name}</span>
                            <span className="text-[10px] text-[var(--sw-muted)] capitalize">{p.role.replace('_', ' ')}</span>
                          </div>
                          {isActive && <Check className="w-4 h-4 text-[var(--sw-green-700)]" />}
                        </button>
                      );
                    })}
                    <div className="border-t border-[var(--sw-border)] mt-2 pt-2">
                      <button
                        onClick={async () => {
                          try {
                            await fetch('/api/auth/logout', { method: 'POST' });
                          } catch {}
                          window.location.href = '/login';
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-[var(--sw-card)] transition-colors font-medium text-xs cursor-pointer bg-transparent border-none"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })()}
      </div>
    </header>
  );
}
