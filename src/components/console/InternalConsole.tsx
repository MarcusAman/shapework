import React, { useState } from 'react';
import { useWorkspaceConsoleState } from '../../state/useWorkspaceConsoleState';
import InternalNavigationRail from '../layout/InternalNavigationRail';
import TopBar from '../layout/TopBar';
import ContextRail from '../layout/ContextRail';
import OperatorDock from '../layout/OperatorDock';
import InternalRoutes from '../../routes/InternalRoutes';
import ErrorBoundary from '../system/ErrorBoundary';
import { Lock, ArrowRight } from 'lucide-react';

export default function InternalConsole() {
  const state = useWorkspaceConsoleState();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [operatorMinimized, setOperatorMinimized] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);

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

  // Synchronize internal url pathname with internal currentTab state
  React.useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/internal')) {
      const sub = path.replace('/internal', '').replace(/^\//, '');
      if (!sub || sub === 'overview') setCurrentTab('System Overview');
      else if (sub === 'workspaces') setCurrentTab('Workspaces');
      else if (sub === 'workspace-detail') setCurrentTab('Workspace Detail');
      else if (sub === 'integration-health') setCurrentTab('Integration Health');
      else if (sub === 'webhook-delivery') setCurrentTab('Webhook Delivery');
      else if (sub === 'notification-diagnostics') setCurrentTab('Notification Diagnostics');
      else if (sub === 'voice-diagnostics') setCurrentTab('Voice Provider Diagnostics');
      else if (sub === 'token-registry') setCurrentTab('Action Token Registry');
      else if (sub === 'security-audit') setCurrentTab('Security & Audit');
      else if (sub === 'support-console') setCurrentTab('Support Console');
      else if (sub === 'feature-flags') setCurrentTab('Feature Flags');
      else if (sub === 'pilot-readiness') setCurrentTab('Pilot Readiness');
      else if (sub === 'system-logs') setCurrentTab('System Logs');
    }
  }, [window.location.pathname]);

  const handleSetTab = (tabName: string) => {
    setCurrentTab(tabName);
    let path = '/internal';
    if (tabName === 'System Overview') path = '/internal/overview';
    else if (tabName === 'Workspaces') path = '/internal/workspaces';
    else if (tabName === 'Workspace Detail') path = '/internal/workspace-detail';
    else if (tabName === 'Integration Health') path = '/internal/integration-health';
    else if (tabName === 'Webhook Delivery') path = '/internal/webhook-delivery';
    else if (tabName === 'Notification Diagnostics') path = '/internal/notification-diagnostics';
    else if (tabName === 'Voice Provider Diagnostics') path = '/internal/voice-diagnostics';
    else if (tabName === 'Action Token Registry') path = '/internal/token-registry';
    else if (tabName === 'Security & Audit') path = '/internal/security-audit';
    else if (tabName === 'Support Console') path = '/internal/support-console';
    else if (tabName === 'Feature Flags') path = '/internal/feature-flags';
    else if (tabName === 'Pilot Readiness') path = '/internal/pilot-readiness';
    else if (tabName === 'System Logs') path = '/internal/system-logs';
    window.history.pushState({}, '', path);
  };

  const allowedRoles = ['shapework_admin', 'shapework_operator', 'implementation_lead', 'support_admin', 'developer'];
  
  React.useEffect(() => {
    if (!state.isLoading && !activeProfile) {
      window.location.href = '/login';
    }
  }, [state.isLoading, activeProfile]);

  if (state.isLoading || activeProfile?.id === 'usr_loading') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center font-sans text-xs text-text-secondary animate-pulse">
        Checking internal authorizations...
      </div>
    );
  }

  if (!activeProfile) {
    return null;
  }

  // 403 Forbidden Screen for Customer roles
  if (!allowedRoles.includes(activeProfile.role)) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center font-sans p-6 text-left">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl p-8 shadow-xl space-y-6">
          <div className="w-12 h-12 bg-red-100 text-red-700 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-base font-bold text-text-primary uppercase tracking-wider font-mono">403 Forbidden</h1>
            <p className="text-xs text-text-secondary leading-relaxed">
              This console is restricted to private shapework delivery engineers and implementation operators.
            </p>
            <p className="text-[11px] text-text-tertiary leading-normal">
              Your profile (<strong className="text-text-secondary">{activeProfile?.name || 'Guest'}</strong>) is registered as a customer brokerage role (<strong className="capitalize">{activeProfile?.role?.replace('_', ' ') || 'None'}</strong>).
            </p>
          </div>

          {appMode !== 'production' && (
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
              <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono block">
                Sandbox Identity Switcher (Dev Mode)
              </label>
              <select
                value={activeProfile?.id || ''}
                onChange={(e) => handleRoleSwitch(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold focus:outline-none"
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
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
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
    <div className="flex h-screen bg-stone-50 overflow-hidden font-sans text-xs text-text-primary">
      
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <TopBar
          activeProfile={activeProfile}
          profiles={profiles}
          onSwitchProfile={handleRoleSwitch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearchSubmit={handleGlobalSearchSubmit}
          isSyncing={isSyncing}
          onSync={fetchState}
          onToggleSidebar={() => setIsMobileOpen(!isMobileOpen)}
          demoMode="tech"
          onChangeDemoMode={() => {}}
          appMode={appMode}
          workspaceName="Delivery Workspace"
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

      {/* Right context diagnostic sidecar */}
      {isRightDrawerOpen && (
        <div className="fixed md:relative top-0 right-0 h-screen z-40 bg-surface border-l border-border-soft w-80 shrink-0 transform transition-all duration-300">
          <div className="w-80 h-full flex flex-col shrink-0 overflow-hidden">
            <ContextRail
              selectedItem={selectedContextItem}
              type={selectedContextType}
              onClose={() => {
                setSelectedTransactionId(null);
                setSelectedListingId(null);
                setSelectedWorkItemId(null);
                setSelectedIntegrationId(null);
                setSelectedAgentId(null);
                setIsRightDrawerOpen(false);
              }}
              auditEvents={auditEvents}
              decisions={decisions}
              integrations={integrations}
              aiAgents={aiAgents}
              onNavigateTab={handleSetTab}
            />
          </div>
        </div>
      )}

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
