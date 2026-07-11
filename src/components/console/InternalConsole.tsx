import React, { useState } from 'react';
import { useWorkspaceConsoleState } from '../../state/useWorkspaceConsoleState';
import InternalNavigationRail from '../layout/InternalNavigationRail';
import TopBar from '../layout/TopBar';
import ContextRail from '../layout/ContextRail';
import OperatorDock from '../layout/OperatorDock';
import InternalRoutes from '../../routes/InternalRoutes';
import ErrorBoundary from '../system/ErrorBoundary';
import { Lock, ArrowRight, Menu } from 'lucide-react';


export default function InternalConsole() {
  const state = useWorkspaceConsoleState();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [operatorMinimized, setOperatorMinimized] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);

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
      else if (sub === 'webhook-delivery' || sub === 'webhooks') setCurrentTab('Webhook Delivery');
      else if (sub === 'notification-diagnostics' || sub === 'notifications') setCurrentTab('Notification Diagnostics');
      else if (sub === 'voice-diagnostics' || sub === 'voice-provider') setCurrentTab('Voice Provider Diagnostics');
      else if (sub === 'camera-signals' || sub === 'cameras') setCurrentTab('Camera Signals');
      else if (sub === 'token-registry' || sub === 'action-links' || sub === 'action-tokens') setCurrentTab('Action Token Registry');
      else if (sub === 'security-audit' || sub === 'security') setCurrentTab('Security & Audit');
      else if (sub === 'support-console' || sub === 'support') setCurrentTab('Support Console');
      else if (sub === 'feature-flags') setCurrentTab('Feature Flags');
      else if (sub === 'pilot-readiness') setCurrentTab('Pilot Readiness');
      else if (sub === 'system-logs' || sub === 'logs') setCurrentTab('System Logs');
      else if (sub === 'clients') setCurrentTab('Clients');
      else if (sub === 'market-intelligence') setCurrentTab('Market Intelligence');
      else if (sub.startsWith('assessments/')) setCurrentTab('Assessment Detail');
      else if (sub === 'assessments') setCurrentTab('Assessments');
      else if (sub === 'operational-records' || sub === 'operating-records') setCurrentTab('Operational Records');
      else if (sub === 'sop-gaps') setCurrentTab('SOP Gaps');
      else if (sub === 'workflow-library') setCurrentTab('Workflow Library');
      else if (sub === 'agent-activity') setCurrentTab('Agent Activity');
      else if (sub === 'intake-routing') setCurrentTab('Intake and Routing');
    }
  }, [window.location.pathname]);

  const handleSetTab = (tabName: string) => {
    setCurrentTab(tabName);
    let path = '/internal/overview';
    if (tabName === 'System Overview') path = '/internal/overview';
    else if (tabName === 'Workspaces') path = '/internal/workspaces';
    else if (tabName === 'Workspace Detail') path = '/internal/workspace-detail';
    else if (tabName === 'Integration Health') path = '/internal/integration-health';
    else if (tabName === 'Webhook Delivery') path = '/internal/webhooks';
    else if (tabName === 'Notification Diagnostics') path = '/internal/notifications';
    else if (tabName === 'Voice Provider Diagnostics') path = '/internal/voice-provider';
    else if (tabName === 'Camera Signals') path = '/internal/cameras';
    else if (tabName === 'Action Token Registry') path = '/internal/action-tokens';
    else if (tabName === 'Security & Audit') path = '/internal/security';
    else if (tabName === 'Support Console') path = '/internal/support';
    else if (tabName === 'Feature Flags') path = '/internal/feature-flags';
    else if (tabName === 'Pilot Readiness') path = '/internal/pilot-readiness';
    else if (tabName === 'System Logs') path = '/internal/logs';
    else if (tabName === 'Clients') path = '/internal/clients';
    else if (tabName === 'Assessments') path = '/internal/assessments';
    else if (tabName === 'Market Intelligence') path = '/internal/market-intelligence';
    else if (tabName === 'Operational Records') path = '/internal/operational-records';
    else if (tabName === 'SOP Gaps') path = '/internal/sop-gaps';
    else if (tabName === 'Workflow Library') path = '/internal/workflow-library';
    else if (tabName === 'Agent Activity') path = '/internal/agent-activity';
    else if (tabName === 'Intake and Routing') path = '/internal/intake-routing';
    window.history.pushState({}, '', path);
  };
  const allowedRoles = ['admin', 'shapework_admin', 'shapework_operator', 'implementation_lead', 'support_admin', 'developer'];  
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
  console.log('[InternalConsole] activeProfile:', JSON.stringify(activeProfile), 'allowed:', allowedRoles.includes(activeProfile?.role?.toLowerCase() || ''));
  if (!allowedRoles.includes(activeProfile.role.toLowerCase())) {
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
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getTabSubtitle = (tab: string): string => {
    switch (tab) {
      case 'System Overview': return 'Overview of active brokerages, system health, and pilot metrics.';
      case 'Workspaces': return 'Manage client workspaces, environments, and custom databases.';
      case 'Workspace Detail': return 'Detailed environment stats and database tables.';
      case 'Integration Health': return 'Monitor connection status, failures, and recent delivery activity.';
      case 'Webhook Delivery': return 'Live event ledger tracing incoming webhook signals and delivery.';
      case 'Notification Diagnostics': return 'Inspect SMS/Email delivery pipelines and logs.';
      case 'Voice Provider Diagnostics': return 'Track Retell AI phone session history and audio streams.';
      case 'Camera Signals': return 'Local camera diagnostics, snapshot capture, and event evidence for workspace operations.';
      case 'Action Token Registry': return 'Token management for external client/agent action links.';
      case 'Security & Audit': return 'Track security policies, audit logs, and permission updates.';
      case 'Support Console': return 'Manage unresolved user support queues and operations requests.';
      case 'Feature Flags': return 'Control runtime feature flags and canary deployments.';
      case 'Pilot Readiness': return 'Checklist and readiness dashboard for initial client deployment.';
      case 'System Logs': return 'Stdout and stderr stream from asynchronous worker queues.';
      case 'Clients': return 'Configure brokerage accounts, tenant domains, and license status.';
      case 'Assessments': return 'Conduct and monitor Brokerage Operational Intelligence Assessments.';
      case 'Assessment Detail': return 'Detailed survey answers and operational analysis report.';
      case 'Market Intelligence': return 'Market-wide aggregated operational insights and pain point frequency.';
      case 'Operational Records': return 'Searchable operational records and system transactions.';
      case 'SOP Gaps': return 'Analyze documented operating manuals versus actual execution gaps.';
      case 'Workflow Library': return 'Explore, design, and clone standardized workspace workflows.';
      case 'Agent Activity': return 'Audit log of active background AI agent operations.';
      case 'Intake and Routing': return 'Manage incoming request channels and automated agent assignment.';
      default: return 'Shapework Internal Console.';
    }
  };

  const currentContextProperty = selectedContextItem ? selectedContextItem.property_address?.split(',')[0] : null;

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden font-sans text-xs text-text-primary internal-theme">
      
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
        {/* Simplified Internal Top Bar */}
        <div className="h-16 border-b border-[var(--border-soft)] bg-[var(--sw-bg-soft)] flex items-center justify-between px-6 shrink-0 relative z-30 select-none">
          <div className="flex flex-col text-left">
            <h1 className="text-sm font-bold text-[var(--text-primary)] tracking-tight leading-none uppercase font-mono">
              {currentTab}
            </h1>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-sans">
              {getTabSubtitle(currentTab)}
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            {/* Environment Badge */}
            <span className="px-2.5 py-1 bg-white/5 text-[9px] font-bold text-[#D0D6BB] border border-white/10 uppercase rounded-lg font-mono">
              Dev Mode
            </span>
            {/* Server Status Badge */}
            <span className="px-2.5 py-1 bg-white/5 text-[9px] font-bold text-[#D0D6BB] border border-white/10 uppercase rounded-lg font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Server Online
            </span>
            {/* Divider */}
            <span className="text-white/15 mx-1 hidden sm:inline">|</span>
            {/* Logged in Internal Operator */}
            <span className="text-[10px] text-[var(--text-secondary)] font-mono font-medium hidden sm:inline">
              Operator: <strong className="text-white">{activeProfile.name}</strong>
            </span>
 
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-secondary)] transition-colors"
              aria-label="Toggle Navigation Drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-20 relative">
          <div className="max-w-[1600px] mx-auto space-y-6">
            <ErrorBoundary>
              <InternalRoutes 
                state={state} 
                selectedResponseId={selectedResponseId}
                setSelectedResponseId={setSelectedResponseId}
                onNavigateTab={handleSetTab}
              />
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
