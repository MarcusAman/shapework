import React from 'react';
import AppShell from '../layout/AppShell';
import CustomerAppRoutes from '../../routes/CustomerAppRoutes';
import EvidenceDrawer from '../ui/EvidenceDrawer';
import { useDemoConsoleState } from '../../state/useDemoConsoleState';
import ErrorBoundary from '../system/ErrorBoundary';
import WorkspaceAccessGate from '../system/WorkspaceAccessGate';

export default function DemoConsole() {
  const state = useDemoConsoleState();

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

  const handleSetTab = (tabName: string) => {
    setCurrentTab(tabName);
  };

  return (
    <WorkspaceAccessGate>
      <div className="flex flex-col h-screen w-screen overflow-hidden">
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
      </div>

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
    </WorkspaceAccessGate>
  );
}
