import React, { useState } from 'react';
import { useWorkspaceConsoleState } from '../../state/useWorkspaceConsoleState';
import InternalNavigationRail from '../layout/InternalNavigationRail';
import TopBar from '../layout/TopBar';
import ContextRail from '../layout/ContextRail';
import OperatorDock from '../layout/OperatorDock';
import InternalRoutes from '../../routes/InternalRoutes';
import ErrorBoundary from '../system/ErrorBoundary';
import { Lock, ArrowRight, Menu, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import FirstLoginToolConnectionModal from '../integrations/FirstLoginToolConnectionModal';

export default function InternalConsole() {
  const state = useWorkspaceConsoleState();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [operatorMinimized, setOperatorMinimized] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(() => {
    return typeof window !== 'undefined' && !localStorage.getItem('shapework_tools_onboarding_completed');
  });
  const [selectedScope, setSelectedScope] = useState(() => {
    return localStorage.getItem('internal_selected_scope') || 'ryans-dashboard';
  });

  const {
    currentTab,
    setCurrentTab,
    activeProfile,
    profiles,
    searchQuery,
    setSearchQuery,
    isSyncing,
    chatInput,
    setChatInput,
    chatHistory,
    isGeneratingChat,
    selectedTransactionId,
    setSelectedTransactionId,
    selectedListingId,
    setSelectedListingId,
    selectedWorkItemId,
    setSelectedWorkItemId,
    selectedIntegrationId,
    setSelectedIntegrationId,
    selectedAgentId,
    setSelectedAgentId,
    handleRoleSwitch,
    handleGlobalSearchSubmit,
    handleSendChatMessage,
    handleExecuteCommandPlan,
    handleCancelCommandPlan,
    getContextItem,
    fetchState,
    auditEvents,
    decisions,
    integrations,
    aiAgents,
    appMode,
    workspaceId
  } = state;

  const contextInfo = getContextItem();
  const selectedContextItem = contextInfo ? contextInfo.item : null;
  const selectedContextType = contextInfo ? contextInfo.type : null;

  React.useEffect(() => {
    if (selectedContextItem) {
      setIsRightDrawerOpen(true);
    }
  }, [selectedContextItem]);



  const handleSetTab = (tabName: string) => {
    setCurrentTab(tabName);
  };

  const allowedEmails = ['marcus@shapework.co', 'matt@shapework.co', 'adam@shapework.co', 'admin@shapework.co'];
  const allowedIds = ['usr_marcus', 'usr_matt', 'usr_adam', 'usr_admin'];
  const hasAccess = activeProfile && (
    allowedEmails.includes(activeProfile.email) ||
    allowedIds.includes(activeProfile.id)
  );

  if (state.isLoading || activeProfile?.id === 'usr_loading') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-sans text-xs text-slate-500 animate-pulse relative overflow-hidden">
        <div className="relative z-10">Checking internal authorizations...</div>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-sans p-6 text-left">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6 text-slate-800">
          <div className="w-12 h-12 bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center border border-slate-200">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-base font-bold text-slate-900 font-serif">Authentication Required</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Please sign in with your shapework operator credentials to access the Internal Control Plane.
            </p>
          </div>
          <a
            href="/login"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  // 403 Forbidden Screen for Restricted profiles
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#01362D] flex items-center justify-center font-sans p-6 text-left relative overflow-hidden">
        <div className="absolute inset-0 nest-layered-bg opacity-30 pointer-events-none" />
        
        <div className="relative z-10 max-w-md w-full bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl p-8 shadow-2xl space-y-6 backdrop-blur-md">
          <div className="w-12 h-12 bg-rose-500/10 text-rose-300 rounded-full flex items-center justify-center border border-rose-500/25">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-sm font-bold text-[var(--sw-text)] uppercase tracking-wider font-serif">403 Forbidden</h1>
            <p className="text-xs text-[var(--sw-muted)] leading-relaxed">
              This console is restricted to private shapework delivery engineers and implementation operators.
            </p>
            <p className="text-[11px] text-[var(--sw-muted-light)] leading-normal">
              Your profile (<strong className="text-[var(--sw-text)]">{activeProfile?.name || 'Guest'}</strong>) is registered as a customer brokerage role (<strong className="capitalize">{activeProfile?.role?.replace('_', ' ') || 'None'}</strong>).
            </p>
          </div>

          {appMode !== 'production' && (
            <div className="p-4 bg-[var(--sw-bg-soft)] border border-[var(--sw-border)] rounded-xl space-y-2">
              <label className="text-[9px] font-bold text-[var(--sw-muted)] uppercase tracking-wider font-mono block">
                Sandbox Identity Switcher (Dev Mode)
              </label>
              <select
                value={activeProfile?.id || ''}
                onChange={(e) => handleRoleSwitch(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#01362D] border border-[var(--sw-border)] rounded-xl text-xs text-[var(--sw-text)] font-semibold focus:outline-none focus:border-emerald-500/50"
              >
                {profiles.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <button
              onClick={() => {
                window.location.pathname = '/app';
              }}
              className="w-full py-2.5 bg-[var(--sw-green-700)] hover:bg-[var(--sw-green-500)] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer select-none"
            >
              <span>Return to Customer App</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentContextProperty = selectedContextItem ? selectedContextItem.property_address?.split(',')[0] : null;

  return (
    <div className="internal-layout flex h-screen bg-[#F8FAFC] overflow-hidden font-sans text-xs text-slate-800">
      
      {/* Navigation sidebar */}
      <InternalNavigationRail
        currentTab={currentTab}
        setCurrentTab={handleSetTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        activeProfile={activeProfile}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        appMode={appMode}
      />

      {/* Main viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#F8FAFC]">
        {/* Dedicated Internal Control Plane Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 relative z-30 gap-4 select-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 shrink-0"
              aria-label="Toggle Navigation Drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 shrink-0 transition-all shadow-xs cursor-pointer"
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm text-slate-900">{currentTab}</h1>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[9px] font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>ALL SYSTEMS OPERATIONAL</span>
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Shapework Internal Control Plane • Operator Console</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Workspace / Scope Selector */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-700 bg-slate-100/80 border border-slate-200 px-3 py-1.5 rounded-xl font-mono shadow-2xs">
              <span className="text-slate-500 font-bold">Scope:</span>
              <select
                value={selectedScope}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedScope(val);
                  localStorage.setItem('internal_selected_scope', val);
                }}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="ryans-dashboard">👑 Ryan's Dashboard</option>
                <option value="nest-realty-demo">🏢 nest-realty-demo (Full Workspace)</option>
              </select>
            </div>

            {/* Connected Tools Onboarding Trigger */}
            <button
              onClick={() => setIsOnboardingModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition shadow-xs cursor-pointer"
              title="Manage connected tools & logins (Rechat, Dotloop, Google, Maxa)"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Connected Tools</span>
            </button>

            {/* Exit to Customer App Button */}
            <button
              onClick={() => {
                if (selectedScope === 'ryans-dashboard') {
                  localStorage.setItem('customer_app_scope', 'ryans-dashboard');
                  localStorage.setItem('shapework_active_profile_id', 'usr_ryan');
                  window.location.href = '/app/workboard?scope=ryans-dashboard';
                } else {
                  localStorage.setItem('customer_app_scope', 'nest-realty-demo');
                  window.location.href = '/app/workboard?scope=nest-realty-demo';
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              title={selectedScope === 'ryans-dashboard' ? "Open Ryan's Executive Dashboard (Ask Nora)" : "Open Full Customer Brokerage Console"}
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Customer App</span>
            </button>
          </div>
        </header>

        {/* First Login Tool Connection Modal */}
        <FirstLoginToolConnectionModal
          isOpen={isOnboardingModalOpen}
          onClose={() => setIsOnboardingModalOpen(false)}
        />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-20 relative">
          <div className="max-w-[1600px] mx-auto space-y-6">
            <ErrorBoundary>
              <InternalRoutes state={state} />
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Bottom Floating AI Command Dock */}
      <OperatorDock
        minimized={operatorMinimized}
        setMinimized={setOperatorMinimized}
        chatInput={chatInput}
        setChatInput={setChatInput}
        onSendMessage={handleSendChatMessage}
        chatHistory={chatHistory}
        isGeneratingChat={isGeneratingChat}
        currentContextProperty={currentContextProperty}
        onClearContext={() => {
          setSelectedTransactionId(null);
          setSelectedListingId(null);
          setSelectedWorkItemId(null);
          setSelectedIntegrationId(null);
          setSelectedAgentId(null);
        }}
        onExecuteCommandPlan={handleExecuteCommandPlan}
        onCancelCommandPlan={handleCancelCommandPlan}
        isTableHeavy={false}
      />
    </div>
  );
}
