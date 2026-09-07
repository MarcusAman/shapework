/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers, Mail, Users, Sliders, History, ArrowRight } from 'lucide-react';
import MorningBriefing from '../components/command/MorningBriefing';
import DecisionQueue from '../components/command/DecisionQueue';
import OperationalRiskTable from '../components/command/OperationalRiskTable';
import WaitingOnPeople from '../components/command/WaitingOnPeople';
import TeamCapacity from '../components/command/TeamCapacity';
import AIWorkbench from '../components/command/AIWorkbench';
import OperatingMemoryPanel from '../components/command/OperatingMemoryPanel';
import OperationsInbox from '../components/inbox/OperationsInbox';
import AIOperatorWorkspace from '../components/ai/AIOperatorWorkspace';
import EmailIntelligence from '../components/email/EmailIntelligence';
import TransactionsView from '../components/transactions/TransactionsView';
import ListingsView from '../components/listings/ListingsView';
import IntegrationsHub from '../components/integrations/IntegrationsHub';
import BrokerageHealth from '../components/command/BrokerageHealth';
import RoleBasedCommandCenter from '../components/command/RoleBasedCommandCenter';
import CustomerLaunchWizard from '../components/settings/CustomerLaunchWizard';
import FirstBrokeragePilotChecklist from '../components/settings/FirstBrokeragePilotChecklist';
import PilotReadinessScorecard from '../components/settings/PilotReadinessScorecard';
import FirstPilotLaunchPack from '../components/settings/FirstPilotLaunchPack';
import PilotLaunchDecisionPanel from '../components/settings/PilotLaunchDecisionPanel';
import DailyCheckInView from '../components/command/DailyCheckInView';
import CustomerLaunchRoom from '../components/settings/CustomerLaunchRoom';
import OperatingRecordPage from '../components/operating-record/OperatingRecordPage';
import OperatingMemoryDetail from '../components/command/OperatingMemoryDetail';
import AICOOMissions from '../components/command/AICOOMissions';
import AgentActionPage from '../components/ui/AgentActionPage';
import ActivityAuditTrail from '../components/command/ActivityAuditTrail';
import AIAgentWorkforce from '../components/agents/AIAgentWorkforce';
import AgentWorkforceWidgets from '../components/command/AgentWorkforceWidgets';
import ApprovalCenter from '../components/approvals/ApprovalCenter';
import Record360 from '../components/records/Record360';
import LiveOperationsTimeline from '../components/live/LiveOperationsTimeline';
import WorkQueue from '../components/layout/WorkQueue';
import AgentRunTable from '../components/agents/AgentRunTable';
import MarketingRequestDesk from '../components/workflows/MarketingRequestDesk';
import WeeklyOwnerBrief from '../components/command/WeeklyOwnerBrief';
import PipelineClosingTracker from '../components/transactions/PipelineClosingTracker';
import DealIntakeGuard from '../components/transactions/DealIntakeGuard';
import ClosingComplianceGuard from '../components/transactions/ClosingComplianceGuard';
import ListingLaunchBoard from '../components/listings/ListingLaunchBoard';
import AgentOnboardingBoard from '../components/people/AgentOnboardingBoard';
import OfficeReadinessSignInventory from '../components/workflows/OfficeReadinessSignInventory';
import ReviewRequestTrigger from '../components/transactions/ReviewRequestTrigger';
import DiscoveryPrioritiesView from '../components/settings/DiscoveryPrioritiesView';
import DataImportCenter from '../components/settings/DataImportCenter';
import AvoidableWorkTracker from '../components/transactions/AvoidableWorkTracker';
import IntegrationTestConsole from '../components/settings/IntegrationTestConsole';

interface AppRoutesProps {
  state: any; // Holds all state properties returned from useShapeworkDemoState
}

export default function AppRoutes({ state }: AppRoutesProps) {
  const [commandTab, setCommandTab] = React.useState<'briefing' | 'decisions' | 'registry' | 'capacity'>('briefing');

  const {
    currentTab,
    setCurrentTab,
    dailyBriefing,
    isGeneratingBriefing,
    loadBriefing,
    transactions,
    listings,
    decisions,
    riskTableFilter,
    setRiskTableFilter,
    capacityMetrics,
    actionProposals,
    auditEvents,
    communications,
    selectedInboxId,
    setSelectedInboxId,
    chatHistory,
    isGeneratingChat,
    emailAccounts,
    emailMessages,
    automationRules,
    automationPolicy,
    integrations,
    aiAgents,
    agentRuns,
    agentEvents,
    governancePolicy,
    handleUpdatePolicy,
    handleTriggerSimulation,
    handleTriggerRunAgent,
    selectedTransactionId,
    setSelectedTransactionId,
    selectedListingId,
    setSelectedListingId,
    isSyncing,
    handleApproveAction,
    handleDismissAction,
    handleExecuteCommandPlan,
    handleCancelCommandPlan,
    handleToggleEmailConnection,
    handleSyncEmailAccount,
    handleProcessEmailMessage,
    handleSaveAutomationRules,
    handleTriggerReassignment,
    handleRollbackAuditAction,
    handleViewEvidence,
    handleToggleConnection,
    handleTestConnection,
    handleTriggerDemoEvent,
    handleSendChatMessage
  } = state;

  const [active360Type, setActive360Type] = React.useState<string | null>(null);
  const [active360Id, setActive360Id] = React.useState<string | null>(null);
  const [workQueueTab, setWorkQueueTab] = React.useState<'tasks' | 'request_desk' | 'owner_shield' | 'sign_inventory'>('tasks');
  const [dealsTab, setDealsTab] = React.useState<'all' | 'intake_guard' | 'compliance_guard' | 'review_trigger' | 'avoidable_work'>('all');
  const [listingsTab, setListingsTab] = React.useState<'all' | 'launch_board'>('all');
  const [peopleTab, setPeopleTab] = React.useState<'all' | 'onboarding'>('all');
  const [agentsTab, setAgentsTab] = React.useState<'workforce' | 'missions' | 'runs' | 'governance'>('workforce');
  const [auditTab, setAuditTab] = React.useState<'timeline' | 'log' | 'approvals' | 'agent_runs' | 'system'>('timeline');
  const [settingsTab, setSettingsTab] = React.useState<'data' | 'priorities' | 'wizard' | 'checklist' | 'governance' | 'links' | 'qa' | 'launch_room'>('priorities');
  React.useEffect(() => {
    const redirectSubTab = sessionStorage.getItem(`shapework_active_subtab_${currentTab}`);
    if (redirectSubTab) {
      if (currentTab === 'Work Queue') {
        setWorkQueueTab(redirectSubTab as any);
      } else if (currentTab === 'Transactions' || currentTab === 'Deals') {
        setDealsTab(redirectSubTab as any);
      } else if (currentTab === 'Listings') {
        setListingsTab(redirectSubTab as any);
      } else if (currentTab === 'People') {
        setPeopleTab(redirectSubTab as any);
      }
      sessionStorage.removeItem(`shapework_active_subtab_${currentTab}`);
    }
  }, [currentTab]);

  const handleInspectRecord = (type: string, id: string) => {
    setActive360Type(type);
    setActive360Id(id);
  };

  const renderViewContent = () => {
    switch (currentTab) {
      case 'Command Center': {
        const attentionCount = 
          (transactions || []).filter((t: any) => t?.risk_level !== 'healthy').length +
          (listings || []).filter((l: any) => (l?.blocking_items || []).length > 0).length;

        const revAtRisk = (transactions || []).filter((t: any) => t?.risk_level === 'at_risk' || t?.risk_level === 'blocked').reduce((acc: number, curr: any) => acc + (curr?.revenue || 0), 0);
        const decCount = (decisions || []).length;

        const activeWorkspace = (state.workspaces || []).find((w: any) => w.id === state.workspaceId);
        const isWorkspaceLive = activeWorkspace?.status === 'active';

        return (
          <div className="max-w-6xl mx-auto space-y-6 animate-fade-in text-left">
            {!isWorkspaceLive && (
              <div className="border border-amber-250 bg-amber-50/40 rounded-2xl p-4 flex items-center justify-between gap-4 select-none">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <strong className="text-amber-800 text-xs font-sans">Workspace Onboarding Mode</strong>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-normal max-w-xl">
                    This workspace is in onboarding mode. Please complete the setup checklist and integrations in the Customer Onboarding & Launch Room to go-live.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCurrentTab('Settings');
                    setSettingsTab('launch_room');
                  }}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1 shrink-0"
                >
                  <span>Go to Launch Room</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Grid layout containing dynamic tab workspace + persistent telemetry sidecar */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              
              {/* Left Column: Switchable sub-tab command workspaces */}
              <div className="xl:col-span-2 space-y-6">
                
                {/* Sub-tab navigation bar with telemetry badges */}
                <div className="flex flex-wrap items-center justify-between border-b border-border-strong pb-2 gap-4 select-none">
                  <div className="flex gap-4">
                    {[
                      { id: 'briefing', label: 'Briefing', count: attentionCount, countColor: 'text-brand-green' },
                      { id: 'decisions', label: 'Decisions', count: decCount, countColor: 'text-status-attention' },
                      { id: 'registry', label: 'Risk Monitor', count: (transactions || []).filter((t: any) => t?.risk_level === 'blocked').length, countColor: 'text-status-atrisk' },
                      { id: 'capacity', label: 'Workforce', count: (capacityMetrics || []).filter((m: any) => m.capacity_percentage >= 85).length, countColor: 'text-status-attention' }
                    ].map((tab) => {
                      const isActive = commandTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setCommandTab(tab.id as any)}
                          className={`pb-2.5 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                            isActive
                              ? 'border-brand-green text-brand-green'
                              : 'border-transparent text-text-tertiary hover:text-text-secondary'
                          }`}
                        >
                          <span>{tab.label}</span>
                          {tab.count > 0 && (
                            <span className={`text-[10px] font-bold ${tab.countColor} font-mono bg-secondary-surface px-1.5 py-0.2 rounded border border-border-subtle ml-1`}>
                              {tab.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="text-[10px] font-mono font-bold text-text-tertiary uppercase tracking-widest bg-secondary-surface border border-border-subtle px-2.5 py-1 rounded">
                    Operations Control
                  </div>
                </div>

                {/* Switch tab bodies */}
                {commandTab === 'briefing' && (
                  <div className="space-y-6 animate-fade-in">
                    <MorningBriefing
                      briefing={dailyBriefing}
                      isGenerating={isGeneratingBriefing}
                      onGenerate={loadBriefing}
                      itemsNeedingAttentionCount={attentionCount}
                      revenueAtRisk={revAtRisk}
                      decisionsCount={decCount}
                      primaryActionText="Resolve Evergreen foundation slab crack contingency to protect $11,200 closing revenue."
                      onNavigateTab={setCurrentTab}
                    />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-border-subtle pb-1">
                        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Live Operating Signals</h3>
                        <span className="text-[9px] text-brand-green font-mono font-bold blink">● LIVE TELEMETRY</span>
                      </div>
                      <LiveOperationsTimeline onInspectRecord={handleInspectRecord} maxCount={3} />
                    </div>

                    <AgentWorkforceWidgets agents={aiAgents} />
                  </div>
                )}

                {commandTab === 'decisions' && (
                  <div className="space-y-6 animate-fade-in">
                    <DecisionQueue
                      decisions={decisions || []}
                      onApprove={handleApproveAction}
                      onDismiss={handleDismissAction}
                      onDelegate={(id: string) => handleDismissAction(id)}
                    />

                    <AIWorkbench
                      proposals={actionProposals}
                      onApprove={handleApproveAction}
                      onDismiss={handleDismissAction}
                      onViewEvidence={handleViewEvidence}
                    />
                  </div>
                )}

                {commandTab === 'registry' && (
                  <div className="space-y-6 animate-fade-in">
                    <OperationalRiskTable
                      transactions={transactions}
                      onSelectTransaction={(id: string) => {
                        setSelectedTransactionId(id);
                        setSelectedListingId(null);
                      }}
                      activeFilter={riskTableFilter}
                      setActiveFilter={setRiskTableFilter}
                      onApproveAction={handleApproveAction}
                    />

                    <WaitingOnPeople />
                  </div>
                )}

                {commandTab === 'capacity' && (
                  <div className="space-y-6 animate-fade-in">
                    <TeamCapacity
                      metrics={capacityMetrics}
                      onTriggerReassignment={handleTriggerReassignment}
                    />
                  </div>
                )}
              </div>

              {/* Right Column: Persistent sidecar metrics telemetry panel */}
              <div className="xl:col-span-1">
                <OperatingMemoryPanel
                  transactions={transactions}
                  listings={listings}
                  communications={communications}
                  auditLogs={auditEvents}
                  onNavigateToTab={setCurrentTab}
                />
              </div>
            </div>

            {(activeWorkspace?.phase === 'controlled_pilot' || activeWorkspace?.phase === 'pilot_rehearsal') && (
              <DailyCheckInView state={state} />
            )}
          </div>
        );
      }

      case 'Work Queue': {
        return (
          <div className="space-y-6 text-left animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-soft pb-2 select-none">
              <div className="flex gap-4">
                {[
                  { id: 'tasks', label: 'Structured Tasks' },
                  { id: 'request_desk', label: 'Marketing Request Desk' },
                  { id: 'owner_shield', label: 'Weekly Owner Brief & Shield' },
                  { id: 'sign_inventory', label: 'Office Readiness & Signage' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setWorkQueueTab(tab.id as any)}
                    className={`pb-2 text-xs font-bold tracking-wider uppercase border-b-2 transition-all focus:outline-none cursor-pointer ${
                      workQueueTab === tab.id
                        ? 'border-brand-primary text-brand-primary font-bold'
                        : 'border-transparent text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {workQueueTab === 'tasks' && <WorkQueue state={state} />}
            {workQueueTab === 'request_desk' && <MarketingRequestDesk state={state} />}
            {workQueueTab === 'owner_shield' && <WeeklyOwnerBrief state={state} />}
            {workQueueTab === 'sign_inventory' && <OfficeReadinessSignInventory state={state} />}
          </div>
        );
      }

      case 'Operating Record': {
        return <OperatingRecordPage defaultTab="snapshot" />;
      }

      case 'Opportunities': {
        return <OperatingRecordPage defaultTab="opportunities" />;
      }

      case 'Workflows': {
        return <OperatingRecordPage defaultTab="workflows" />;
      }

      case 'Transactions':
      case 'Deals': {
        return (
          <div className="space-y-6 text-left animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-soft pb-2 select-none">
              <div className="flex gap-4">
                {[
                  { id: 'all', label: 'Active Transactions Ledger' },
                  { id: 'intake_guard', label: 'Transaction Intake Guard' },
                  { id: 'compliance_guard', label: 'Closing Compliance Guard' },
                  { id: 'review_trigger', label: 'Review Request Trigger' },
                  { id: 'avoidable_work', label: 'TC Avoidable Work Tracker' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDealsTab(tab.id as any)}
                    className={`pb-2 text-xs font-bold tracking-wider uppercase border-b-2 transition-all focus:outline-none cursor-pointer ${
                      dealsTab === tab.id
                        ? 'border-brand-primary text-brand-primary font-bold'
                        : 'border-transparent text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {dealsTab === 'all' && (
              <PipelineClosingTracker state={state} onInspectRecord={handleInspectRecord} />
            )}
            {dealsTab === 'intake_guard' && <DealIntakeGuard state={state} />}
            {dealsTab === 'compliance_guard' && <ClosingComplianceGuard state={state} />}
            {dealsTab === 'review_trigger' && <ReviewRequestTrigger />}
            {dealsTab === 'avoidable_work' && <AvoidableWorkTracker />}
          </div>
        );
      }

      case 'Listings': {
        return (
          <div className="space-y-6 text-left animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-soft pb-2 select-none">
              <div className="flex gap-4">
                {[
                  { id: 'all', label: 'Active Listings Ledger' },
                  { id: 'launch_board', label: 'Listing Launch Board' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setListingsTab(tab.id as any)}
                    className={`pb-2 text-xs font-bold tracking-wider uppercase border-b-2 transition-all focus:outline-none cursor-pointer ${
                      listingsTab === tab.id
                        ? 'border-brand-primary text-brand-primary font-bold'
                        : 'border-transparent text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {listingsTab === 'all' && (
              <ListingsView
                listings={listings || []}
                onSelectListing={(id: string) => {
                  setSelectedListingId(id);
                  setSelectedTransactionId(null);
                }}
                selectedListingId={selectedListingId}
                onCloseDetail={() => setSelectedListingId(null)}
              />
            )}
            {listingsTab === 'launch_board' && <ListingLaunchBoard />}
          </div>
        );
      }

      case 'People & Roles':
      case 'People': {
        return (
          <div className="space-y-6 text-left animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-soft pb-2 select-none">
              <div className="flex gap-4">
                {[
                  { id: 'all', label: 'Specialist Workforce' },
                  { id: 'onboarding', label: 'Agent Onboarding Board' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setPeopleTab(tab.id as any)}
                    className={`pb-2 text-xs font-bold tracking-wider uppercase border-b-2 transition-all focus:outline-none cursor-pointer ${
                      peopleTab === tab.id
                        ? 'border-brand-primary text-brand-primary font-bold'
                        : 'border-transparent text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {peopleTab === 'all' && (
              <AIAgentWorkforce
                agents={aiAgents}
                runs={agentRuns}
                events={agentEvents}
                governancePolicy={governancePolicy}
                onUpdatePolicy={handleUpdatePolicy}
                onTriggerSimulation={handleTriggerSimulation}
                onTriggerRunAgent={(id) => {
                  handleTriggerRunAgent(id);
                  if (state.setSelectedAgentId) {
                    state.setSelectedAgentId(id);
                  }
                }}
                activeSection={agentsTab === 'workforce' ? 'workforce' : agentsTab === 'runs' ? 'runs' : 'governance'}
              />
            )}
            {peopleTab === 'onboarding' && <AgentOnboardingBoard />}
          </div>
        );
      }

      case 'Integrations':
        return (
          <IntegrationsHub
            connections={integrations}
            onToggleConnection={handleToggleConnection}
            onTestConnection={handleTestConnection}
            onTriggerDemoEvent={handleTriggerDemoEvent}
            isSyncing={isSyncing}
            state={state}
          />
        );

      case 'Audit': {
        return (
          <div className="space-y-6 text-left animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-soft pb-2 select-none">
              <div className="flex gap-4">
                {[
                  { id: 'timeline', label: 'Timeline' },
                  { id: 'log', label: 'Audit Log' },
                  { id: 'approvals', label: 'Approvals History' },
                  { id: 'agent_runs', label: 'Agent Runs' },
                  { id: 'system', label: 'System Events' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setAuditTab(tab.id as any)}
                    className={`pb-2 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all focus:outline-none ${
                      auditTab === tab.id
                        ? 'border-brand-primary text-brand-primary font-bold'
                        : 'border-transparent text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {auditTab === 'timeline' && (
              <div className="bg-surface border border-border-soft rounded-2xl p-6 shadow-card space-y-4">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Timeline</h3>
                <LiveOperationsTimeline onInspectRecord={handleInspectRecord} maxCount={15} />
              </div>
            )}

            {auditTab === 'log' && (
              <ActivityAuditTrail
                auditLogs={auditEvents}
                onRollback={handleRollbackAuditAction}
              />
            )}

            {auditTab === 'approvals' && (
              <div className="bg-surface border border-border-soft rounded-2xl p-6 shadow-card space-y-4">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Resolved Approvals</h3>
                <div className="divide-y divide-border-soft/60">
                  <div className="py-3 text-xs flex justify-between">
                    <span className="text-success font-semibold">Approved: Foundation Contingency Crack Waiver</span>
                    <span className="text-text-tertiary">Jessica Keenan · 15m ago</span>
                  </div>
                  <div className="py-3 text-xs flex justify-between">
                    <span className="text-success font-semibold">Approved: Wire Ingest Matching Exception Close</span>
                    <span className="text-text-tertiary">Jessica Keenan · 1h ago</span>
                  </div>
                  <div className="py-3 text-xs flex justify-between">
                    <span className="text-text-secondary">Auto-logged: Lockbox opened at 109 Woodlawn</span>
                    <span className="text-text-tertiary">System Gateway · 2h ago</span>
                  </div>
                </div>
              </div>
            )}

            {auditTab === 'agent_runs' && (
              <AgentRunTable onInspectRun={(run) => alert(`Inspecting run ${run.runId}`)} />
            )}

            {auditTab === 'system' && (
              <div className="bg-surface border border-border-soft rounded-2xl p-6 shadow-card space-y-4">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">System Events</h3>
                <div className="p-4 bg-zinc-950 text-zinc-300 font-mono text-[10px] space-y-1.5 border border-zinc-800 rounded-xl">
                  <div>Webhook listener connected to: Twilio, RESO MLS, Follow Up Boss</div>
                  <div>Email Triage engine initialized successfully.</div>
                  <div>SECURE ENVELOPE: Decrypted secret tokens on 7 catalog channels.</div>
                  <div>MEMORY STAGING: Synchronized transaction schemas.</div>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'Settings': {
        const isProd = state.appMode === 'production';
        
        // Define settings navigation structure grouped into 5 categories
        const settingsGroups = [
          {
            title: "Workspace Setup",
            items: [
              { id: 'priorities', label: isProd ? 'Operational Priorities' : 'Discovery Priorities' },
              { id: 'wizard', label: 'Customer Onboarding Wizard' }
            ]
          },
          {
            title: "Customer Launch",
            items: [
              ...(state.activeProfile?.role === 'owner' || state.activeProfile?.role === 'admin' || state.activeProfile?.role === 'operations_lead' 
                ? [{ id: 'launch_room', label: 'Customer Launch Room' }] 
                : []),
              { id: 'checklist', label: 'Customer Launch Checklist' },
              { id: 'scorecard', label: 'Readiness Scorecard' },
              { id: 'launch_pack', label: 'Customer Launch Pack' },
              { id: 'decision_console', label: 'Launch Decision Console' }
            ]
          },
          {
            title: "Data & Imports",
            items: [
              { id: 'data', label: 'Organization Data Controls' }
            ]
          },
          {
            title: "Integrations & Safeguards",
            items: [
              { id: 'governance', label: 'Approval & Safety Rules' },
              { id: 'links', label: 'Secure Request Links' }
            ]
          },
          ...(!isProd ? [
            {
              title: "Admin & Maintenance",
              items: [
                { id: 'qa', label: 'Demo QA' }
              ]
            }
          ] : [])
        ];

        return (
          <div className="flex flex-col lg:flex-row gap-8 text-left animate-fade-in pb-10">
            {/* Vertical settings sidebar navigation */}
            <div className="w-full lg:w-60 shrink-0 flex flex-col gap-6 select-none border-b lg:border-b-0 lg:border-r border-border-soft pb-6 lg:pb-0 lg:pr-6">
              {settingsGroups.map((group) => (
                <div key={group.title} className="space-y-1.5">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block font-mono">
                    {group.title}
                  </span>
                  <div className="flex flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
                    {group.items.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setSettingsTab(tab.id as any)}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all shrink-0 cursor-pointer ${
                          settingsTab === tab.id
                            ? 'bg-brand-900 text-white font-bold'
                            : 'text-text-secondary hover:bg-stone-100 hover:text-text-primary'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Main Settings Form Container */}
            <div className="flex-1 min-w-0">

            {settingsTab === 'priorities' && (
              <DiscoveryPrioritiesView />
            )}

            {settingsTab === 'launch_room' && (
              <CustomerLaunchRoom 
                workspaceId={state.workspaceId}
                state={state}
                onLaunchWorkspace={(config) => {
                  const wsId = config.workspace?.name ? config.workspace.name.toLowerCase().replace(/\s+/g, '-') : 'active-brokerage';
                  state.setWorkspaceId(wsId);
                  setTimeout(() => {
                    state.fetchState();
                  }, 100);
                }}
              />
            )}

            {settingsTab === 'wizard' && (
              <CustomerLaunchWizard onLaunchWorkspace={(config) => {
                const wsId = config.workspace?.name ? config.workspace.name.toLowerCase().replace(/\s+/g, '-') : 'active-brokerage';
                state.setWorkspaceId(wsId);
                setTimeout(() => {
                  state.fetchState();
                }, 100);
                setCurrentTab('Command Center');
              }} />
            )}

            {settingsTab === 'checklist' && (
              <FirstBrokeragePilotChecklist />
            )}

            {settingsTab === 'scorecard' && (
              <PilotReadinessScorecard state={state} />
            )}

            {settingsTab === 'launch_pack' && (
              <FirstPilotLaunchPack state={state} />
            )}

            {settingsTab === 'decision_console' && (
              <PilotLaunchDecisionPanel state={state} />
            )}

            {settingsTab === 'governance' && (
              <AIAgentWorkforce
                agents={aiAgents}
                runs={agentRuns}
                events={agentEvents}
                governancePolicy={governancePolicy}
                onUpdatePolicy={handleUpdatePolicy}
                onTriggerSimulation={handleTriggerSimulation}
                onTriggerRunAgent={handleTriggerRunAgent}
                activeSection="governance"
              />
            )}

            {settingsTab === 'links' && (
              <AgentActionPage />
            )}

            {settingsTab === 'data' && (
              <div className="bg-surface border border-border-soft rounded-2xl p-6 shadow-card space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Workspace Maintenance & Data Reset</h3>
                  <p className="text-xs text-text-secondary mt-1">Configure global boundaries for your active workspace environment.</p>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-stone-50 border border-border-soft rounded-xl text-xs space-y-2">
                    <span className="font-bold text-text-primary block">Active Cache Scope</span>
                    <p className="text-text-secondary">Workspace Mode: **COO Operations Focus**. Cached transaction and checklist records are currently active.</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        alert('Staged active cache resets. All logs synchronized.');
                      }}
                      className="px-4 py-2.5 bg-brand-900 hover:bg-brand-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      Reset Workspace Cache
                    </button>
                    <button 
                      onClick={async () => {
                        sessionStorage.removeItem('shapework_demo_access');
                        try {
                          await fetch('/api/auth/logout', { method: 'POST' });
                        } catch {}
                        window.location.href = '/login';
                      }}
                      className="px-4 py-2.5 border border-risk-red text-risk-red hover:bg-risk-red-soft rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      Clear Session Profile
                    </button>
                  </div>
                </div>
                <div className="border-t border-border-soft pt-6 mt-6">
                  <DataImportCenter state={state} />
                </div>
              </div>
            )}

            {settingsTab === 'qa' && state.appMode !== 'production' && (
              <div className="space-y-6">
                
                {/* QA URL Utility */}
                <div className="bg-surface border border-border-soft rounded-2xl p-5 shadow-card space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono select-none">// Internal QA Test URLs</h3>
                    <p className="text-xs text-text-secondary mt-1">Copy local URLs to test and verify route integration bypass systems.</p>
                  </div>

                  <div className="divide-y divide-border-subtle/40 border border-border-soft rounded-xl overflow-hidden text-xs">
                    {[
                      { label: 'Local Demo URL', url: 'http://localhost:3000/demo' },
                      { label: 'Integrations Test Route', url: 'http://localhost:3000/app/integrations' },
                      { label: 'Rechat Test Route', url: 'http://localhost:3000/api/integrations/rechat/oauth/start' },
                      { label: 'Dotloop Webhook Route', url: 'http://localhost:3000/api/integrations/apination/dotloop/webhook' },
                      { label: 'Demo Events Route', url: 'http://localhost:3000/api/demo/events' },
                      { label: 'Health Endpoint', url: 'http://localhost:3000/api/health' }
                    ].map((item) => (
                      <div key={item.label} className="p-3 bg-stone-50/50 hover:bg-stone-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 select-text">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-text-primary">{item.label}</span>
                          <code className="text-[10px] text-text-tertiary block font-mono font-medium">{item.url}</code>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.url);
                            alert(`Copied to clipboard: ${item.url}`);
                          }}
                          className="px-2 py-1 bg-white hover:bg-stone-100 border border-border-soft rounded text-[10px] font-bold transition-all shrink-0 cursor-pointer"
                        >
                          Copy URL
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Integration Verification Checklists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none">
                  
                  {/* Local Checklist */}
                  <div className="bg-surface border border-border-soft rounded-2xl p-5 shadow-card space-y-3">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">// Local QA Checklist</span>
                    <div className="space-y-2 text-xs">
                      {[
                        'Dev server active & listening on port 3000',
                        'Route /demo dashboard loads correctly',
                        'System /api/health endpoint passes',
                        'Registry /api/debug/routes returns JSON route maps',
                        'Integration Test Console mounts in settings QA',
                        'Trigger mock Dotloop events successfully',
                        'Trigger mock Rechat events successfully'
                      ].map((item) => (
                        <label key={item} className="flex items-start gap-2.5 cursor-pointer font-medium text-text-secondary">
                          <input type="checkbox" defaultChecked className="mt-0.5 rounded border-border-medium text-brand-primary focus:ring-brand-primary" />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Staging Checklist */}
                  <div className="bg-surface border border-border-soft rounded-2xl p-5 shadow-card space-y-3">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">// Staging Deployment Checklist</span>
                    <div className="space-y-2 text-xs">
                      {[
                        'Public webhook URL configured (Cloud Run domain)',
                        'Dotloop webhook secret token configured in env',
                        'API Nation webhook target channel activated',
                        'Live sync webhook test event received',
                        'Payload fields parsed and normalized correctly',
                        'Deal Intake Guard checklist task created',
                        'Transaction operations audit logs registered'
                      ].map((item) => (
                        <label key={item} className="flex items-start gap-2.5 cursor-pointer font-medium text-text-secondary">
                          <input type="checkbox" className="mt-0.5 rounded border-border-medium text-brand-primary focus:ring-brand-primary" />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Testbed simulator panel */}
                <IntegrationTestConsole />
              </div>
            )}
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="p-8 text-center text-xs text-text-tertiary">
            View selection failed to load. Please return to the Command Center.
          </div>
        );
    }
  };

  return (
    <>
      {renderViewContent()}

      {active360Id && active360Type && (
        <Record360
          recordType={active360Type}
          recordId={active360Id}
          isOpen={!!active360Id}
          onClose={() => {
            setActive360Id(null);
            setActive360Type(null);
          }}
          state={state}
        />
      )}
    </>
  );
}
