import React from 'react';
import AppShell from '../layout/AppShell';
import CustomerAppRoutes from '../../routes/CustomerAppRoutes';
import EvidenceDrawer from '../ui/EvidenceDrawer';
import { useWorkspaceConsoleState } from '../../state/useWorkspaceConsoleState';
import ErrorBoundary from '../system/ErrorBoundary';
import WorkspaceAccessGate from '../system/WorkspaceAccessGate';

export default function WorkspaceConsole() {
  const state = useWorkspaceConsoleState();

  const handleSetTab = (tabName: string) => {
    state.setCurrentTab(tabName);
  };

  const {
    currentTab,
    setCurrentTab,
    sidebarCollapsed,
    setSidebarCollapsed,
    activeProfile,
    profiles,
    searchQuery,
    setSearchQuery,
    isSyncing,
    isLoading,
    operatorMinimized,
    setOperatorMinimized,
    chatInput,
    setChatInput,
    chatHistory,
    isGeneratingChat,
    demoMode,
    setDemoMode,
    evidenceDrawerOpen,
    setEvidenceDrawerOpen,
    activeEvidenceProposal,
    setActiveEvidenceProposal,
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

  const isProduction = appMode === 'production';

  // Redirect to login if not loading and not authenticated (production only)
  React.useEffect(() => {
    if (isProduction && !isLoading && !activeProfile) {
      window.location.href = '/login';
    }
  }, [isProduction, isLoading, activeProfile]);

  // Global escape key listener to close ContextRail/drawer
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedTransactionId(null);
        setSelectedListingId(null);
        setSelectedWorkItemId(null);
        setSelectedIntegrationId(null);
        setSelectedAgentId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedTransactionId, setSelectedListingId, setSelectedWorkItemId, setSelectedIntegrationId, setSelectedAgentId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center font-sans text-xs text-text-secondary animate-pulse">
        Loading shapework...
      </div>
    );
  }

  const allowedCustomerRoles = [
    'owner',
    'admin',
    'operations_lead',
    'transaction_coordinator',
    'compliance_partner',
    'listing_coordinator',
    'marketing_coordinator',
    'events',
    'maintenance',
    'agent_support',
    'shapework_operator'
  ];

  if (!activeProfile) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center font-sans text-xs text-text-secondary animate-pulse">
        Authenticating console profile...
      </div>
    );
  }

  if (!allowedCustomerRoles.includes(activeProfile.role)) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center font-sans p-6 text-left">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl p-8 shadow-xl space-y-6">
          <div className="w-12 h-12 bg-red-100 text-red-700 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-base font-bold text-text-primary uppercase tracking-wider font-mono">403 Forbidden</h1>
            <p className="text-xs text-text-secondary leading-relaxed">
              This area is restricted to brokerage staff, owners, and coordinators.
            </p>
            <p className="text-[11px] text-text-tertiary leading-normal">
              Your profile (<strong className="text-text-secondary">{activeProfile?.name || 'Guest'}</strong>) is registered as a role (<strong className="capitalize">{activeProfile?.role?.replace('_', ' ') || 'None'}</strong>) which is not authorized to access this command center.
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
                window.location.pathname = '/login';
              }}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Return to Login</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppShell
        appMode={appMode}
        workspaceId={workspaceId}
        currentTab={currentTab}
        setCurrentTab={handleSetTab}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        activeProfile={activeProfile}
        profiles={profiles}
        onSwitchProfile={handleRoleSwitch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleGlobalSearchSubmit}
        isSyncing={isSyncing}
        onSync={fetchState}
        selectedContextItem={selectedContextItem}
        selectedContextType={selectedContextType}
        onCloseContext={() => {
          setSelectedTransactionId(null);
          setSelectedListingId(null);
          setSelectedWorkItemId(null);
          setSelectedIntegrationId(null);
          setSelectedAgentId(null);
        }}
        operatorMinimized={operatorMinimized}
        setOperatorMinimized={setOperatorMinimized}
        chatInput={chatInput}
        setChatInput={setChatInput}
        onSendChatMessage={handleSendChatMessage}
        chatHistory={chatHistory}
        isGeneratingChat={isGeneratingChat}
        currentContextProperty={selectedContextItem ? selectedContextItem.property_address?.split(',')[0] : null}
        demoMode={demoMode}
        onChangeDemoMode={setDemoMode}
        onClearContext={() => {
          setSelectedTransactionId(null);
          setSelectedListingId(null);
          setSelectedWorkItemId(null);
          setSelectedIntegrationId(null);
          setSelectedAgentId(null);
        }}
        onExecuteCommandPlan={handleExecuteCommandPlan}
        onCancelCommandPlan={handleCancelCommandPlan}
        auditEvents={auditEvents}
        decisions={decisions}
        integrations={integrations}
        aiAgents={aiAgents}
      >
        <div className="flex-1 overflow-auto">
          <ErrorBoundary>
            <CustomerAppRoutes state={state} />
          </ErrorBoundary>
        </div>
      </AppShell>

      {/* Diagnostics Evidence Ingest drawer */}
      {activeEvidenceProposal && (
        <EvidenceDrawer
          isOpen={evidenceDrawerOpen}
          onClose={() => {
            setEvidenceDrawerOpen(false);
            setActiveEvidenceProposal(null);
          }}
          title={activeEvidenceProposal.title}
          evidenceText={activeEvidenceProposal.draft_content || 'No text content available'}
          confidence={activeEvidenceProposal.confidence}
        />
      )}
    </>
  );
}
