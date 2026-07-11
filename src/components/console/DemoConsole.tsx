import React from 'react';
import AppShell from '../layout/AppShell';
import CustomerAppRoutes from '../../routes/CustomerAppRoutes';
import EvidenceDrawer from '../ui/EvidenceDrawer';
import { useDemoConsoleState } from '../../state/useDemoConsoleState';
import ErrorBoundary from '../system/ErrorBoundary';
import DemoDataNotice from '../system/DemoDataNotice';
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

  // Synchronize demo url pathname with demo currentTab state
  React.useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/demo')) {
      const clean = path;
      if (clean.startsWith('/demo/nest-ops-hub')) setCurrentTab('Nest Ops Hub');
      else if (clean.startsWith('/demo/my-connections')) setCurrentTab('My Connections');
      else if (clean.startsWith('/demo/work')) setCurrentTab('Work Queue');
      else if (clean.startsWith('/demo/operating-record')) setCurrentTab('Operating Record');
      else if (clean.startsWith('/demo/opportunities')) setCurrentTab('Opportunities');
      else if (clean.startsWith('/demo/workflows')) setCurrentTab('Workflows');
      else if (clean.startsWith('/demo/transactions')) setCurrentTab('Transactions');
      else if (clean.startsWith('/demo/deals')) setCurrentTab('Transactions');
      else if (clean.startsWith('/demo/listings')) setCurrentTab('Transactions');
      else if (clean.startsWith('/demo/compliance')) setCurrentTab('Compliance');
      else if (clean.startsWith('/demo/marketing')) setCurrentTab('Marketing Requests');
      else if (clean.startsWith('/demo/people')) setCurrentTab('People & Ownership');
      else if (clean.startsWith('/demo/growth')) setCurrentTab('Growth Engine');
      else if (clean.startsWith('/demo/office')) setCurrentTab('Office & Signage');
      else if (clean.startsWith('/demo/approvals')) setCurrentTab('Approvals');
      else if (clean.startsWith('/demo/owner-brief')) setCurrentTab('Owner Brief');
      else if (clean.startsWith('/demo/integrations')) setCurrentTab('Integrations');
      else if (clean.startsWith('/demo/audit')) setCurrentTab('Audit');
      else if (clean.startsWith('/demo/settings')) setCurrentTab('Settings');
      else if (clean === '/demo' || clean === '/demo/') setCurrentTab('Nest Ops Hub'); // Default to Ask Nest Ops
    }
  }, [window.location.pathname]);

  const handleSetTab = (tabName: string) => {
    setCurrentTab(tabName);
    let path = '/demo';
    if (tabName === 'Nest Ops Hub') path = '/demo/nest-ops-hub';
    else if (tabName === 'My Connections') path = '/demo/my-connections';
    else if (tabName === 'Work Queue') path = '/demo/work';
    else if (tabName === 'Operating Record') path = '/demo/operating-record';
    else if (tabName === 'Opportunities') path = '/demo/opportunities';
    else if (tabName === 'Workflows') path = '/demo/workflows';
    else if (tabName === 'Transactions') path = '/demo/transactions';
    else if (tabName === 'Compliance') path = '/demo/compliance';
    else if (tabName === 'Marketing Requests') path = '/demo/marketing';
    else if (tabName === 'People & Ownership') path = '/demo/people';
    else if (tabName === 'Growth Engine') path = '/demo/growth';
    else if (tabName === 'Office & Signage') path = '/demo/office';
    else if (tabName === 'Approvals') path = '/demo/approvals';
    else if (tabName === 'Owner Brief') path = '/demo/owner-brief';
    else if (tabName === 'Integrations') path = '/demo/integrations';
    else if (tabName === 'Audit') path = '/demo/audit';
    else if (tabName === 'Settings') path = '/demo/settings';
    window.history.pushState({}, '', path);
  };

  return (
    <WorkspaceAccessGate>
      <div className="flex flex-col h-screen w-screen overflow-hidden">
        <DemoDataNotice />
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
