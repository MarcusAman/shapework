import React, { useState, useEffect } from 'react';
import { Shield, Users, FileText, ExternalLink, Menu, X, ChevronRight, ChevronLeft, LogOut, HelpCircle, PhoneCall, Calendar } from 'lucide-react';
import { orgChartService } from '../../services/orgChartService';
import {
  buildRyanShieldSummary,
  buildRoleEscalationMap,
  buildOwnerWeeklyBrief,
} from './adapters';
import type { RyanShieldData, RoleEscalationData, OwnerWeeklyBriefData } from './adapters';
import RyanShieldPage from './RyanShieldPage';
import RoleEscalationMapPage from './RoleEscalationMapPage';
import OwnerWeeklyBriefPage from './OwnerWeeklyBriefPage';
import SectionNavigationBar from '../ui/SectionNavigationBar';
import SOPStudio from '../sops/SOPStudio';
import MarketingIntakeConsole from '../marketing/MarketingIntakeConsole';

type NavId = 'shield' | 'roles' | 'sops' | 'marketing' | 'brief';

const NAV_ITEMS: Array<{ id: NavId; label: string; sub: string; icon: React.FC<{ className?: string }> }> = [
  {
    id: 'shield',
    label: 'Ryan Shield',
    sub: 'What needs you. What got handled.',
    icon: Shield,
  },
  {
    id: 'roles',
    label: 'Role & Escalation Map',
    sub: 'Who handles what. Edit & remove roles for Tuesday.',
    icon: Users,
  },
  {
    id: 'sops',
    label: 'Staff SOP Templates',
    sub: '5-section staff self-authoring & review.',
    icon: FileText,
  },
  {
    id: 'marketing',
    label: 'Marketing Intake',
    sub: 'Hotline call logs, AI transcripts & VA delegation.',
    icon: PhoneCall,
  },
  {
    id: 'brief',
    label: 'Owner Weekly Brief',
    sub: 'Weekly digest of brokerage activity.',
    icon: Calendar,
  },
];

interface NestWilmingtonDashboardProps {
  currentTab?: string;
  state?: any;
  embedded?: boolean;
}

export default function NestWilmingtonDashboard({ currentTab, state, embedded = true }: NestWilmingtonDashboardProps) {
  const mapTabToNav = (tab?: string): NavId => {
    if (!tab) return 'shield';
    const lower = tab.toLowerCase();
    if (lower.includes('role')) return 'roles';
    if (lower.includes('sop')) return 'sops';
    if (lower.includes('marketing')) return 'marketing';
    if (lower.includes('brief')) return 'brief';
    return 'shield';
  };

  const [activeNav, setActiveNav] = useState<NavId>(() => mapTabToNav(currentTab));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [askOpsOpen, setAskOpsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('shapework-sidebar-collapsed') === 'true');

  const [shieldData, setShieldData] = useState<RyanShieldData | null>(null);
  const [rolesData, setRolesData] = useState<RoleEscalationData | null>(null);
  const [briefData, setBriefData] = useState<OwnerWeeklyBriefData | null>(null);
  const [rawModel, setRawModel] = useState<any>(null);
  const [activeProfile, setActiveProfile] = useState<any>(null);

  useEffect(() => {
    if (currentTab) {
      setActiveNav(mapTabToNav(currentTab));
    }
  }, [currentTab]);

  useEffect(() => {
    // Fetch profile session
    fetch('/api/auth/session')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not logged in');
      })
      .then(data => {
        setActiveProfile(data.profile || { name: 'Ryan Crecelius', role: 'owner' });
      })
      .catch(() => {
        setActiveProfile({ name: 'Ryan Crecelius', role: 'owner' });
      });

    // Fetch org chart
    (async () => {
      try {
        const model = await orgChartService.getOrgChart('nest-realty-demo');
        setRawModel(model);
        setShieldData(buildRyanShieldSummary(model));
        setRolesData(buildRoleEscalationMap(model));
        setBriefData(buildOwnerWeeklyBrief());
      } catch (err) {
        console.error('[NestWilmington] Failed to load org model:', err);
        const fallback = { positions: [], roles: [], sops: [], connections: [], escalationPolicies: [], routingMatrix: [] };
        setRawModel(fallback);
        setShieldData(buildRyanShieldSummary(fallback as any));
        setRolesData(buildRoleEscalationMap(fallback as any));
        setBriefData(buildOwnerWeeklyBrief());
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleToggle = () => {
    const nextVal = !collapsed;
    setCollapsed(nextVal);
    localStorage.setItem('shapework-sidebar-collapsed', String(nextVal));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)] flex items-center justify-center internal-theme">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#00635C]/30 border border-[#00635C]/40 flex items-center justify-center mx-auto animate-pulse">
            <Shield className="w-5 h-5 text-emerald-300" />
          </div>
          <p className="text-[11px] font-mono text-[#D0D6BB] uppercase tracking-widest animate-pulse">Loading owner command center…</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    if (activeNav === 'shield') {
      return <RyanShieldPage data={shieldData || buildRyanShieldSummary(rawModel || fallbackModel as any)} state={state} />;
    }
    if (activeNav === 'roles') {
      return (
        <RoleEscalationMapPage 
          data={rolesData || buildRoleEscalationMap(rawModel || fallbackModel as any)} 
          model={rawModel || fallbackModel} 
        />
      );
    }
    if (activeNav === 'sops') {
      return (
        <div className="p-6">
          <SOPStudio state={state || { workspaceId: 'nest-realty-demo' }} />
        </div>
      );
    }
    if (activeNav === 'marketing') {
      return (
        <div className="p-6">
          <MarketingIntakeConsole state={state || { workspaceId: 'nest-realty-demo' }} />
        </div>
      );
    }
    if (activeNav === 'brief') {
      return <OwnerWeeklyBriefPage data={briefData || buildOwnerWeeklyBrief()} />;
    }
    return null;
  };

  const activeNavItem = NAV_ITEMS.find(n => n.id === activeNav)!;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[var(--sidebar-bg)] border-r border-[var(--border-soft)] select-none text-white overflow-x-hidden no-horizontal-scrollbar">
      {/* Branding Header */}
      <div className="h-16 flex items-center justify-center px-4 border-b border-white/5 shrink-0">
        {!collapsed || mobileOpen ? (
          <div className="flex items-center justify-center py-2 w-full px-2">
            <img src="/nest-realty-logo-green.png" alt="Nest Realty" className="h-8 w-auto object-contain max-w-[130px]" />
          </div>
        ) : (
          <div className="mx-auto flex items-center justify-center py-2 w-full">
            <img src="/nest_n_green.png" alt="Nest" className="h-[22px] w-[22px] object-contain" />
          </div>
        )}

        {mobileOpen && (
          <button 
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 overflow-x-hidden">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveNav(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group relative nav-item-shell cursor-pointer ${
                isActive
                  ? 'nav-item-active text-white bg-[var(--brand-primary)]'
                  : 'text-[var(--sw-text-secondary)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-primary)]'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 nav-icon-motion ${isActive ? 'text-white' : 'text-[var(--brand-primary)]'}`} />
              {(!collapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
              
              {collapsed && !mobileOpen && (
                <div className="absolute left-full ml-2.5 px-3 py-1.5 bg-[var(--sw-surface)] text-[var(--sw-text-primary)] border border-[var(--sw-border)] text-[10px] font-bold font-sans uppercase tracking-wider rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Support Card */}
      {(!collapsed || mobileOpen) && (
        <div className="mx-3 my-2 p-3 bg-[var(--surface-2)] border border-[var(--border-soft)] rounded-xl space-y-2 text-left">
          <div className="flex items-center gap-1.5 text-white font-sans font-bold text-[11px]">
            <HelpCircle className="w-3.5 h-3.5 text-[#D0D6BB]" />
            <span>Need help?</span>
          </div>
          <p className="text-[10px] text-[#F6F7F1]/60 leading-normal">
            Connect with the Ops team.
          </p>
          <button 
            onClick={() => setAskOpsOpen(true)}
            className="w-full py-1.5 bg-[#00635C] hover:bg-[#007c73] text-[#F6F7F1] text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center shadow-[0_2px_6px_rgba(0,99,92,0.3)]"
          >
            Contact Support
          </button>
        </div>
      )}

      {/* Sidebar Footer */}
      <div className="border-t border-white/5 bg-white/[0.02] shrink-0 flex flex-col overflow-hidden">
        {/* User Profile Block */}
        {activeProfile && (
          <div className={`flex items-center ${(!collapsed || mobileOpen) ? 'gap-3 px-4 py-3' : 'justify-center py-3'} min-w-0`}>
            <div className="w-8 h-8 rounded-full bg-[#D0D6BB] text-[#01362D] font-bold flex items-center justify-center shrink-0 text-xs shadow-sm border border-[rgba(246,247,241,0.15)]">
              {activeProfile.name.charAt(0)}
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-xs font-bold text-white truncate">{activeProfile.name}</span>
                <span className="text-[9px] text-[#D0D6BB] capitalize truncate">{activeProfile.role.replace(/_/g, ' ')}</span>
              </div>
            )}
          </div>
        )}

        {/* Bottom control rail */}
        <div className={`p-3 border-t border-white/5 flex ${collapsed && !mobileOpen ? 'flex-col items-center' : 'flex-row'} gap-2 overflow-hidden`}>
          <button
            onClick={async () => {
              sessionStorage.removeItem('shapework_demo_access');
              try {
                await fetch('/api/auth/logout', { method: 'POST' });
              } catch {}
              window.location.href = '/login';
            }}
            className={`flex items-center justify-center text-[#D0D6BB] hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer shrink-0 ${collapsed && !mobileOpen ? 'w-8 h-8' : 'flex-1 py-1.5'}`}
            title="Log Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {(!collapsed || mobileOpen) && <span className="text-[10px] font-bold uppercase tracking-wider ml-2 truncate">Log Out</span>}
          </button>
          
          <button
            onClick={handleToggle}
            className={`flex text-[#D0D6BB] hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer justify-center items-center shrink-0 ${collapsed && !mobileOpen ? 'w-8 h-8' : 'p-1.5'}`}
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0" />}
          </button>
        </div>
      </div>
    </div>
  );

  const fallbackModel = { positions: [], roles: [], sops: [], connections: [], escalationPolicies: [], routingMatrix: [] };

  if (embedded) {
    return (
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative nest-layered-bg">
        {/* Scrollable page body or full-bleed Map */}
        {activeNav === 'roles' ? (
          <div className="flex-1 min-h-0 relative p-6">
            <RoleEscalationMapPage 
              data={rolesData || buildRoleEscalationMap(rawModel || fallbackModel as any)} 
              model={rawModel || fallbackModel} 
            />
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-20 relative">
            <div className="max-w-[1600px] mx-auto space-y-6">
              {renderPage()}
            </div>
          </main>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--app-bg)] overflow-hidden font-sans text-xs text-text-primary internal-theme">
      {/* Mobile Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-5 border-b border-[var(--border-soft)] bg-[var(--app-bg)] z-30">
        <div className="flex items-center gap-2">
          <img src="/nest_n_green.png" alt="Nest" className="h-6 w-auto" />
          <span className="text-xs font-serif font-black text-white">Nest Wilmington</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#D0D6BB]">{activeNavItem.label}</span>
          <button type="button" onClick={() => setMobileOpen(true)} className="text-white hover:text-[#D0D6BB] cursor-pointer">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full flex flex-col z-50 animate-slide-in">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block h-screen shrink-0 transition-all duration-300 overflow-x-hidden no-horizontal-scrollbar ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative nest-layered-bg pt-16 lg:pt-0">
        <SectionNavigationBar 
          activeTab={activeNav} 
          onChangeTab={(navId) => setActiveNav(navId as any)} 
          variant="client" 
        />

        {/* Scrollable page body or full-bleed Map */}
        {activeNav === 'roles' && rolesData && rawModel ? (
          <div className="flex-1 min-h-0 relative p-6">
            <RoleEscalationMapPage data={rolesData} model={rawModel} />
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-20 relative">
            <div className="max-w-[1600px] mx-auto space-y-6">
              {renderPage()}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
