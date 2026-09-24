import React from 'react';
import { Lock } from 'lucide-react';
import AppShell from '../layout/AppShell';
import CustomerAppRoutes from '../../routes/CustomerAppRoutes';
import EvidenceDrawer from '../ui/EvidenceDrawer';
import { useWorkspaceConsoleState } from '../../state/useWorkspaceConsoleState';
import ErrorBoundary from '../system/ErrorBoundary';
import WorkspaceAccessGate from '../system/WorkspaceAccessGate';
import {
  clearSandboxIdentity,
  isAllowedCustomerRole,
  uniqueProfilesByEmail,
} from '../../utils/sandboxIdentity';


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

  if (isLoading || !activeProfile) {
    return (
      <div className="min-h-screen bg-[#01362D] text-[#F6F7F1] flex flex-col items-center justify-center font-sans p-6 text-center select-none">
        <div className="space-y-4 max-w-sm w-full flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-[#00635C] border border-white/10 flex items-center justify-center shadow-xl animate-pulse">
            <span className="text-white font-serif font-black text-xl">S</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Loading your workspace…</h3>
            <p className="text-[11px] text-[#D0D6BB]/70">Connecting to Nest Realty operational intelligence</p>
          </div>
          <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="w-full h-full bg-[#00635C] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAllowedCustomerRole(activeProfile?.role || '')) {
    return (
      <div className="min-h-screen bg-[#012822] flex items-center justify-center font-sans p-6 text-left text-[#F6F7F1] select-none">
        <div className="max-w-md w-full bg-[#013028] border border-emerald-500/20 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="w-12 h-12 bg-red-950/60 text-red-400 border border-red-500/30 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-base font-bold text-white tracking-wide">403 Restricted Access</h1>
            <p className="text-xs text-[#D0D6BB] leading-relaxed">
              This area is restricted to authorized brokerage staff, owners, and coordinators.
            </p>
            <p className="text-[11px] text-[#D0D6BB]/70 leading-normal">
              Your profile (<strong className="text-white">{activeProfile?.name || 'Guest'}</strong>) is registered as role (<strong className="capitalize text-emerald-300">{activeProfile?.role?.replace('_', ' ') || 'None'}</strong>) which is not authorized to access this section.
            </p>
          </div>
          {appMode !== 'production' && (
            <div className="p-4 bg-black/40 border border-white/10 rounded-xl space-y-2">
              <label className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider block font-sans">
                Sandbox Identity Switcher (Dev Mode)
              </label>
              <select
                value={activeProfile?.id || ''}
                onChange={(e) => handleRoleSwitch(e.target.value)}
                className="w-full px-3 py-2 bg-[#01241E] border border-white/15 text-white rounded-lg text-xs font-semibold focus:outline-none"
              >
                {uniqueProfilesByEmail(profiles).map((p: any) => (
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
                clearSandboxIdentity();
                window.location.pathname = '/login';
              }}
              className="w-full py-2.5 bg-[#00635C] hover:bg-[#004d47] text-white border border-emerald-400/30 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
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
        profiles={uniqueProfilesByEmail(profiles)}
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
        <div className="flex-grow flex flex-col min-h-0">
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
