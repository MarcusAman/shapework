import React, { useState } from 'react';
import { Search, Bell, Plus, Calendar, ChevronDown, Check, Menu, X, LogOut, Zap, FileText, Upload } from 'lucide-react';
import { Profile } from '../../types/shapework';
import LocationSelectorDropdown from '../ui/LocationSelectorDropdown';

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
  onOpenPitchDemo?: () => void;
  variant?: 'default' | 'minimal';
  title?: string;
  currentTab?: string;
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
  onOpenPitchDemo,
  variant = 'default',
  title,
  currentTab
}: TopBarProps) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [globalDrawerOpen, setGlobalDrawerOpen] = useState(false);
  const [globalEvidenceCard, setGlobalEvidenceCard] = useState<GlobalEvidenceCardData | null>(null);

  React.useEffect(() => {
    const handleVoiceTool = (event: any) => {
      if (event.detail?.data?.evidenceCard) {
        setGlobalEvidenceCard(event.detail.data.evidenceCard);
        setGlobalDrawerOpen(true);
      }
    };
    window.addEventListener('voice_tool_executed', handleVoiceTool);
    return () => window.removeEventListener('voice_tool_executed', handleVoiceTool);
  }, []);

  const isAskNestOpsPage = currentTab === 'Ask Nest Ops' || currentTab === 'Workboard' || currentTab === 'Nest Ops Hub' || !currentTab;

  const mockNotifications = [
    { id: 1, title: 'Appraisal Contingency Warning', detail: '102 Pine St finance expiry is in 5 days.', time: '2h ago', read: false },
    { id: 2, title: 'Listing Rejected by MLS', detail: '3206 Highland Ave lacks initials on page 4.', time: 'Yesterday', read: false },
    { id: 3, title: 'Workload Capacity Alert', detail: 'Diane Ross is currently at 95% workload.', time: 'Yesterday', read: true },
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit(searchQuery);
    }
  };

  const isOperator = activeProfile?.role === 'shapework_admin' || activeProfile?.role === 'shapework_operator';

  const isMarketingPage = currentTab?.toLowerCase().includes('marketing');
  const isSopPage = currentTab === 'Staff SOP Templates' || currentTab === 'SOP Studio' || currentTab === 'SOP Library' || currentTab === 'SOP Runs';
  const isRyanShieldPage = currentTab === 'Ryan Shield';
  const isOwnerBriefPage = currentTab === 'Owner Brief' || currentTab === 'Owner Briefing';
  const isDirectoryPage = currentTab === 'Directory' || currentTab === 'Workspace Directory';
  const isRoleMapPage = currentTab === 'Role Map' || currentTab === 'Role & Escalation Map';
  const isSettingsPage = currentTab === 'Settings' || currentTab === 'Workspace Settings';

  if (variant === 'minimal') {
    return (
      <header className="h-16 bg-[var(--sw-surface)] border-b border-[var(--sw-border)] flex items-center justify-between px-6 shrink-0 relative z-20 gap-4 select-none">
        {/* Left: Mobile Toggle & Page Headers */}
        <div className="flex items-center gap-3.5 shrink-0 min-w-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-1.5 rounded-lg hover:bg-[var(--sw-canvas)] shrink-0 transition-colors text-[var(--brand-primary)]"
              aria-label="Toggle Navigation Drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {isRyanShieldPage ? (
            <div className="flex flex-col text-left">
              <h1 className="font-serif font-black text-sm md:text-base text-[var(--brand-primary)] uppercase tracking-wider leading-tight">
                Good morning, Ryan
              </h1>
              <p className="hidden md:block text-[11px] text-[var(--sw-text-secondary)] font-sans pt-0.5">
                <span className="text-amber-700 font-bold">2 items</span> need you. The team handled <span className="text-[var(--brand-secondary)] font-bold">24</span> without you.
              </p>
            </div>
          ) : isRoleMapPage ? (
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2.5">
                <h1 className="font-serif font-black text-sm md:text-base text-[var(--brand-primary)] uppercase tracking-wider leading-tight">
                  Role & Escalation Map
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-secondary)]/20 text-[var(--brand-secondary)] text-[10px] font-mono font-bold">
                  Nest Wilmington
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-[var(--sw-text-secondary)] font-sans pt-0.5">
                Who handles what, fallback delegates, and automated escalation guardrails for Ryan.
              </p>
            </div>
          ) : isOwnerBriefPage ? (
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2.5">
                <h1 className="font-serif font-black text-sm md:text-base text-[var(--brand-primary)] uppercase tracking-wider leading-tight">
                  Owner Weekly Brief
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-secondary)]/20 text-[var(--brand-secondary)] text-[10px] font-mono font-bold">
                  Week of March 24, 2026
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-[var(--sw-text-secondary)] font-sans pt-0.5">
                A complete summary of what moved through the brokerage this week.
              </p>
            </div>
          ) : isDirectoryPage ? (
            <div className="flex flex-col text-left">
              <h1 className="font-serif font-black text-sm md:text-base text-[var(--brand-primary)] uppercase tracking-wider leading-tight">
                Directory
              </h1>
              <p className="hidden md:block text-[11px] text-[var(--sw-text-secondary)] font-sans pt-0.5">
                Find and contact people across the Wilmington and Carolina Beach offices.
              </p>
            </div>
          ) : isMarketingPage ? (
            <div className="flex flex-col text-left">
              <h1 className="font-serif font-black text-sm md:text-base text-[var(--brand-primary)] uppercase tracking-wider leading-tight">
                Marketing
              </h1>
              <p className="hidden md:block text-[11px] text-[var(--sw-text-secondary)] font-sans pt-0.5">
                Requests and work handled by Shapework.
              </p>
            </div>
          ) : isSopPage ? (
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2.5">
                <h1 className="font-serif font-black text-sm md:text-base text-[var(--brand-primary)] uppercase tracking-wider leading-tight">
                  SOP Library
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-secondary)]/20 text-[var(--brand-secondary)] text-[10px] font-mono font-bold">
                  0 active runs
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-[var(--sw-text-secondary)] font-sans pt-0.5">
                Manage executable standard operating procedure checklists for Nest Realty Wilmington.
              </p>
            </div>
          ) : isSettingsPage ? (
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2.5">
                <h1 className="font-serif font-black text-sm md:text-base text-[var(--brand-primary)] uppercase tracking-wider leading-tight">
                  Workspace Settings
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-secondary)]/20 text-[var(--brand-secondary)] text-[10px] font-mono font-bold">
                  Ryan's Dashboard
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-[var(--sw-text-secondary)] font-sans pt-0.5">
                Manage brokerage team access, Mercury billing receipts, SLA guardrails, and connected tools.
              </p>
            </div>
          ) : isAskNestOpsPage ? (
            <div className="flex flex-col text-left">
              <h1 className="font-sans font-bold text-base text-[var(--brand-primary)] tracking-tight leading-tight">
                Today in the Brokerage
              </h1>
              <div className="hidden sm:flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 font-sans pt-0.5">
                <span className="font-semibold text-[#00635C]">Office: All Locations (Mayfaire & Carolina Beach)</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-800 font-medium">Ryan Crecelius (Broker / Owner)</span>
                <span className="text-slate-300">•</span>
                <span className="text-[#00635C] font-semibold">74 Agents</span>
              </div>
            </div>
          ) : (
            title && <h1 className="font-sans font-bold text-lg text-[var(--brand-primary)]">{title}</h1>
          )}
        </div>

        {/* Right Actions */}
        {isRoleMapPage ? (
          <div className="flex items-center gap-2 select-none shrink-0">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-add-team-member'))}
              className="px-3.5 py-1.5 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-xs font-mono font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer uppercase tracking-wider border border-emerald-500/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Team Member</span>
            </button>
          </div>
        ) : isDirectoryPage ? (
          <div className="flex items-center gap-2 select-none shrink-0">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-import-directory'))}
              className="hidden sm:flex px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import Directory</span>
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-add-person'))}
              className="px-3.5 py-1.5 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-xs font-mono font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer uppercase tracking-wider border border-emerald-500/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Person</span>
            </button>
          </div>
        ) : isMarketingPage && isOperator ? (
          <div className="flex items-center gap-2.5 select-none shrink-0">
            <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] bg-[#002b24]/80 px-3 py-1.5 border border-[#00635C]/60 rounded-xl shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[#D0D6BB]">Marketing Hotline:</span>
              <strong className="text-emerald-300 font-bold tracking-wider">(910) 555-MKTG</strong>
            </div>

            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-simulate-marketing-call'))}
              className="px-3.5 py-1.5 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer font-mono uppercase tracking-wider border border-emerald-500/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Simulate Inbound Call</span>
            </button>
          </div>
        ) : isMarketingPage ? (
          <div className="flex items-center gap-2.5 select-none shrink-0">
            <span className="text-xs text-[rgba(246,247,241,0.7)] font-sans font-medium">
              Shapework Marketing Workspace
            </span>
          </div>
        ) : isSopPage ? (
          <div className="flex items-center gap-2 select-none shrink-0">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-staff-sop-template'))}
              className="px-3 py-1.5 bg-[#00635C] hover:bg-[#01362D] text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md border border-[#00635C]"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Staff Template</span>
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-new-sop-modal'))}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-lg border border-emerald-400"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New SOP</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 select-none shrink-0">
            {isAskNestOpsPage && <LocationSelectorDropdown variant="header" />}
            <div className="flex shrink-0 items-center gap-2 sm:gap-3 text-[9px] xs:text-[10px] font-sans text-[var(--sw-text-secondary)] font-semibold bg-[var(--sw-canvas)] px-2.5 sm:px-3.5 py-1 sm:py-1.5 border border-[var(--sw-border)] rounded-full shadow-xs backdrop-blur-md">
              <span className="text-[var(--sw-text-primary)] font-bold whitespace-nowrap">AskNestOps@nestrealty.com</span>
              <span className="text-[var(--sw-text-secondary)] opacity-40">|</span>
              <span className="text-[var(--sw-text-primary)] font-bold whitespace-nowrap">+1 (910) 275-6672</span>
            </div>
          </div>
        )}
      </header>
    );
  }

  return (
    <header className="h-16 border-b border-[rgba(246,247,241,0.12)] bg-[rgba(1, 54, 45, 0.55)] backdrop-blur-md flex items-center justify-between px-6 shrink-0 relative z-20 gap-4 select-none">
      {/* Left side: Menu toggle, Location Selector & Workspace name */}
      <div className="flex items-center gap-3 shrink-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-lg hover:bg-[rgba(246,247,241,0.08)] text-[#D0D6BB] hover:text-white shrink-0 transition-colors"
            aria-label="Toggle Navigation Drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        {isAskNestOpsPage && <LocationSelectorDropdown variant="header" />}
        {isAskNestOpsPage && (
          <div className="hidden lg:flex items-center gap-2 text-xs text-[#D0D6BB] font-sans font-semibold bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
            <span className="text-emerald-300 font-bold">All Locations</span>
            <span className="text-white/30">•</span>
            <span className="text-emerald-200">74 Agents</span>
          </div>
        )}
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
        <div className="hidden lg:flex items-center gap-3.5 text-[10px] font-mono text-[var(--sw-text-secondary)] font-semibold bg-[var(--sw-canvas)] px-4 py-1.5 border border-[var(--sw-border)] rounded-full shadow-xs">
          <span className="text-[var(--sw-text-primary)] font-bold">AskNestOps@nestrealty.com</span>
          <span className="text-[var(--sw-text-secondary)] opacity-40">|</span>
          <span className="text-[var(--sw-text-primary)] font-bold">+1 (910) 275-6672</span>
        </div>

        {/* Pitch & 'Aha!' Demo Launch Button */}
        {onOpenPitchDemo && (
          <button
            onClick={onOpenPitchDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 text-black text-xs font-black shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-emerald-300/40"
          >
            <Zap className="w-3.5 h-3.5 fill-black text-black" />
            <span>Pitch & 'Aha!' Demo</span>
          </button>
        )}

        {/* Shapework Operator Console Quick Access Button */}
        {(activeProfile?.email?.endsWith('@shapework.co') || activeProfile?.role?.includes('admin')) && (
          <button
            onClick={() => {
              window.location.pathname = window.location.pathname.startsWith('/internal') ? '/app' : '/internal';
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400 text-[#01362D] font-bold text-xs shadow-md hover:bg-amber-300 transition-all cursor-pointer border border-amber-300/50"
            title="Switch between Customer App and Operator Control Plane"
          >
            <Shield className="w-3.5 h-3.5 text-[#01362D] fill-[#01362D]" />
            <span>{window.location.pathname.startsWith('/internal') ? 'Customer App' : 'Operator Console'}</span>
          </button>
        )}

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

      <GlobalEvidenceDrawer
        isOpen={globalDrawerOpen}
        onClose={() => setGlobalDrawerOpen(false)}
        evidenceCard={globalEvidenceCard}
      />
    </header>
  );
}
