/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import CollapsibleNavigationRail from './CollapsibleNavigationRail';
import TopBar from './TopBar';
import ContextRail from './ContextRail';
import OperatorDock from './OperatorDock';
import { Profile, ChatMessage } from '../../types/shapework';
import ErrorBoundary from '../system/ErrorBoundary';

interface AppShellProps {
  children: React.ReactNode;
  
  // Navigation State
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (col: boolean) => void;
  
  // TopBar State
  activeProfile: Profile;
  profiles: Profile[];
  onSwitchProfile: (profileId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  isSyncing?: boolean;
  onSync?: () => void;
  
  // ContextRail State
  selectedContextItem: any;
  selectedContextType: 'transaction' | 'listing' | 'inbox' | 'work_item' | 'integration' | 'agent' | null;
  onCloseContext: () => void;
  
  // OperatorDock State
  operatorMinimized: boolean;
  setOperatorMinimized: (min: boolean) => void;
  chatInput: string;
  demoMode: 'founder' | 'coo' | 'tech';
  onChangeDemoMode: (mode: 'founder' | 'coo' | 'tech') => void;
  setChatInput: (query: string) => void;
  onSendChatMessage: (msg: string) => void;
  chatHistory: ChatMessage[];
  isGeneratingChat: boolean;
  currentContextProperty: string | null;
  onClearContext?: () => void;
  onExecuteCommandPlan?: (planId: string) => void;
  onCancelCommandPlan?: (planId: string) => void;
  auditEvents?: any[];
  decisions?: any[];
  integrations?: any[];
  aiAgents?: any[];
  appMode?: string;
  workspaceId?: string;
}

export default function AppShell({
  children,
  currentTab,
  setCurrentTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  activeProfile,
  profiles,
  onSwitchProfile,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  isSyncing,
  onSync,
  selectedContextItem,
  selectedContextType,
  onCloseContext,
  operatorMinimized,
  setOperatorMinimized,
  chatInput,
  setChatInput,
  onSendChatMessage,
  chatHistory,
  isGeneratingChat,
  currentContextProperty,
  onClearContext,
  onExecuteCommandPlan,
  onCancelCommandPlan,
  demoMode,
  onChangeDemoMode,
  auditEvents,
  decisions,
  integrations,
  aiAgents,
  appMode,
  workspaceId
}: AppShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);

  // Auto-open drawer when a new context item is inspected
  React.useEffect(() => {
    if (selectedContextItem) {
      setIsRightDrawerOpen(true);
    }
  }, [selectedContextItem]);

  const getPageTitle = (tab: string): string => {
    switch (tab) {
      case 'Workboard':
      case 'Nest Ops Hub':
        return 'Today in the Brokerage';
      case 'Work Queue':
        return 'Requests & Tasks';
      case 'Approvals':
        return 'Approvals & Governance';
      case 'Owner Brief':
        return 'Owner Brief';
      case 'Work':
        return 'Assets & Collateral';
      case 'Compliance':
        return 'Compliance';
      case 'Marketing Requests':
        return 'Marketing';
      case 'My Connections':
        return 'Connections';
      case 'Settings':
        return 'Settings';
      default:
        return tab;
    }
  };

  const allowedRoles = ['admin', 'owner', 'operations_lead', 'transaction_coordinator'];
  const showOperationsPulse = activeProfile ? allowedRoles.includes(activeProfile.role) : false;
  const isTableHeavy = currentTab === 'Transactions' || currentTab === 'Work Queue';
  const isAppRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/app');

  return (
    <div className="flex h-screen bg-[#01362D] overflow-hidden font-sans text-xs text-text-primary">
      
      {/* Navigation sidebar */}
      <CollapsibleNavigationRail
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        activeProfile={activeProfile}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        appMode={appMode}
      />

      {/* Main viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative nest-layered-bg">
        {/* Top Header */}
        {!(typeof window !== 'undefined' && window.location.pathname.includes('/org-chart-wizard')) && (
          <TopBar
            variant="minimal"
            title={getPageTitle(currentTab)}
            activeProfile={activeProfile}
            profiles={profiles}
            onSwitchProfile={onSwitchProfile}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearchSubmit={onSearchSubmit}
            isSyncing={isSyncing}
            onSync={onSync}
            onToggleSidebar={() => setIsMobileOpen(!isMobileOpen)}
            demoMode={demoMode}
            onChangeDemoMode={onChangeDemoMode}
            appMode={appMode}
            workspaceName={workspaceId === 'nest-realty-demo' ? 'Nest Ops Hub' : 'Nest Realty Wilmington'}
            onToggleOperator={() => setOperatorMinimized(!operatorMinimized)}
          />
        )}

        {/* Scrollable View Content */}
        {typeof window !== 'undefined' && window.location.pathname.includes('/org-chart-wizard') ? (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-20 relative">
            <div className="max-w-[1600px] mx-auto space-y-6">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </div>
          </main>
        )}
      </div>



      {/* Right Diagnostic context panel as sliding drawer */}
      {showOperationsPulse && (
        <div
          className={`fixed md:relative top-0 right-0 h-screen z-40 bg-surface shadow-2xl md:shadow-none transition-all duration-300 transform flex shrink-0 ${
            isRightDrawerOpen ? 'w-80 translate-x-0 border-l border-border-soft' : 'w-0 translate-x-full overflow-hidden border-l-0'
          }`}
        >
          <div className="w-80 h-full flex flex-col shrink-0 overflow-hidden">
            <ContextRail
              selectedItem={selectedContextItem}
              type={selectedContextType}
              onClose={() => {
                onCloseContext();
                setIsRightDrawerOpen(false);
              }}
              auditEvents={auditEvents}
              decisions={decisions}
              integrations={integrations}
              aiAgents={aiAgents}
              onNavigateTab={setCurrentTab}
            />
          </div>
        </div>
      )}

      {/* Bottom Floating AI Dock */}
      {!isAppRoute && (
        <OperatorDock
          minimized={operatorMinimized}
          setMinimized={setOperatorMinimized}
          chatInput={chatInput}
          setChatInput={setChatInput}
          onSendMessage={onSendChatMessage}
          chatHistory={chatHistory}
          isGeneratingChat={isGeneratingChat}
          currentContextProperty={currentContextProperty}
          onClearContext={onClearContext}
          onExecuteCommandPlan={onExecuteCommandPlan}
          onCancelCommandPlan={onCancelCommandPlan}
          isTableHeavy={isTableHeavy}
        />
      )}
    </div>
  );
}
