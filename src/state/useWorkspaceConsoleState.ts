/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Profile, Agent, Transaction, Listing, Communication, AIActionProposal, 
  AuditEvent, IntegrationConnection, CapacityMetric, EmailAccount, 
  EmailMessage, AutomationRule, AutomationPolicy, ChatMessage, CommandPlan,
  AgentDefinition, AgentRun, AgentEvent, AgentGovernancePolicy, BrokerageEntryPoint
} from '../types/shapework';
import { getRegistryConnectors } from '../integrations/registry';
import { createAuditEvent, rollbackTransactionStage, normalizeAuditEvent } from '../utils/audit';
import { safeLower } from '../utils/string';
import { getCommandResponse } from '../data/demoCommands';
import { runDemoEventInSandbox } from '../integrations/demoConnectorRunner';
import { initialCatalogConnectors } from '../data/integrationCatalog';
import { apiClient } from '../utils/apiClient';

export function useWorkspaceConsoleState() {
  const getTabFromPath = useCallback((path: string): string => {
    if (path.startsWith('/internal')) {
      const sub = path.replace('/internal', '').replace(/^\//, '');
      if (!sub || sub === 'overview' || sub === 'feature-flags' || sub === 'pilot-readiness') return 'Control Center';
      if (sub === 'blog-generator' || sub === 'content' || sub === 'market-intelligence' || sub.startsWith('market-intelligence/surveys') || sub.startsWith('assessments')) return 'Content & Intelligence';
      if (sub === 'workspaces' || sub === 'workspace-detail' || sub === 'support-console') return 'Workspace Management';
      if (sub === 'integration-health' || sub === 'diagnostics' || sub === 'webhook-delivery' || sub === 'notification-diagnostics' || sub === 'voice-diagnostics' || sub === 'token-registry') return 'System Diagnostics';
      if (sub === 'security-audit' || sub === 'audit' || sub === 'system-logs' || sub === 'feedback') return 'Security, Audit & Logs';
      return 'Control Center';
    }
    const clean = path.replace(/^\/app/, '/demo');
    if (clean.startsWith('/demo/pitch')) return "Pitch & 'Aha!' Demo";
    if (clean.startsWith('/demo/pre-mls')) return 'Pre-MLS Board';
    if (clean.startsWith('/demo/vendor-dispatch')) return 'Vendor Dispatch';
    if (clean.startsWith('/demo/nest-ops-hub') || clean.startsWith('/demo/ask-nest-ops')) return 'Ask Nest Ops';
    if (clean.startsWith('/demo/my-connections')) return 'My Connections';
    if (clean.startsWith('/demo/command-center')) return 'Workboard';
    if (clean.startsWith('/demo/workboard')) return 'Workboard';
    if (clean.startsWith('/demo/sops/runs') || clean.includes('/sops/runs')) return 'SOP Runs';
    if (clean.startsWith('/demo/sops') || clean.includes('/sops') || clean.includes('/sop-library')) return 'Staff SOP Templates';
    if (clean.startsWith('/demo/work')) return 'Work Queue';
    if (clean.startsWith('/demo/approvals')) return 'Approvals';
    if (clean.includes('/approval')) return 'Agent Approval Portal';
    if (clean.startsWith('/demo/assets')) return 'Physical Assets';
    if (clean.startsWith('/demo/camera-signals')) return 'Camera Signals';
    if (clean.startsWith('/demo/knowledge-base')) return 'Knowledge Base';
    if (clean.startsWith('/demo/knowledge')) return 'Knowledge Base';
    if (clean.startsWith('/demo/marketing') || clean.includes('/marketing')) return 'Marketing Intake';
    if (clean.startsWith('/demo/integrations')) return 'Integrations';
    if (clean.startsWith('/demo/settings')) return 'Settings';
    if (clean.startsWith('/demo/ryan-shield')) return 'Ryan Shield';
    if (clean.startsWith('/demo/role-map')) return 'Role Map';
    if (clean.startsWith('/demo/directory')) return 'Directory';
    
    // Support legacy sub-page routes for E2E tests
    if (clean.startsWith('/demo/transactions')) return 'Transactions';
    if (clean.startsWith('/demo/compliance')) return 'Compliance';
    if (clean.startsWith('/demo/marketing')) return 'Marketing Requests';
    if (clean.startsWith('/demo/people')) return 'People';
    if (clean.startsWith('/demo/office')) return 'Office';
    if (clean.startsWith('/demo/owner-brief')) return 'Owner Brief';
    if (clean.startsWith('/demo/audit')) return 'Audit';
    if (clean.startsWith('/demo/operating-record')) return 'Operating Record';
    
    return 'Workboard';
  }, []);

  const getPathFromTab = useCallback((tab: string): string => {
    const prefix = window.location.pathname.startsWith('/app') ? '/app' : '/demo';
    switch (tab) {
      case "Pitch & 'Aha!' Demo":
      case 'Pitch Demo':
        return `${prefix}/pitch-demo`;
      case 'Pre-MLS Board':
      case 'Pocket Matches':
        return `${prefix}/pre-mls`;
      case 'Vendor Dispatch':
      case 'Repair Board':
        return `${prefix}/vendor-dispatch`;
      case 'Ask Nest Ops':
      case 'Nest Ops Hub':
        return `${prefix}/nest-ops-hub`;
      case 'My Connections': return `${prefix}/my-connections`;
      case 'Workboard': return `${prefix}/workboard`;
      case 'Work Queue': return `${prefix}/work`;
      case 'Approvals': return `${prefix}/approvals`;
      case 'Physical Assets': return `${prefix}/assets`;
      case 'Camera Signals': return `${prefix}/camera-signals`;
      case 'Knowledge Base':
      case 'Knowledge / SOPs':
        return `${prefix}/knowledge-base`;
      case 'SOP Studio':
      case 'SOP Library':
      case 'Staff SOP Templates':
        return `${prefix}/sops`;
      case 'SOP Runs': return `${prefix}/sops/runs`;
      case 'Integrations': return `${prefix}/integrations`;
      case 'Settings': return `${prefix}/settings`;
      case 'Ryan Shield': return `${prefix}/ryan-shield`;
      case 'Role Map':
      case 'Role & Escalation Map':
        return `${prefix}/role-map`;
      case 'Directory': return `${prefix}/directory`;
      case 'Transactions': return `${prefix}/transactions`;
      case 'Compliance': return `${prefix}/compliance`;
      case 'Marketing':
      case 'Marketing Requests':
      case 'Marketing Intake':
      case 'Marketing Intake (Melissa)':
      case 'Creative Asset Sandbox':
      case 'Creative Asset Sandbox (Templates)':
      case 'Automated Collateral Studio':
      case 'Automated Collateral Studio (Templates)':
      case 'Collateral Studio':
      case 'Sandbox':
        return `${prefix}/marketing`;
      case 'People': return `${prefix}/people`;
      case 'Office': return `${prefix}/office`;
      case 'Owner Brief': return `${prefix}/owner-brief`;
      case 'Control Center': return '/internal/overview';
      case 'Content & Intelligence': return '/internal/content';
      case 'Workspace Management': return '/internal/workspaces';
      case 'System Diagnostics': return '/internal/diagnostics';
      case 'Security, Audit & Logs': return '/internal/audit';
      case 'Audit': return `${prefix}/audit`;
      case 'Operating Record': return `${prefix}/operating-record`;
      default: return `${prefix}/workboard`;
    }
  }, []);

  const [currentTab, setCurrentTabState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      return getTabFromPath(path);
    }
    return 'Workboard';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromPath = () => {
      const nextTab = getTabFromPath(window.location.pathname);
      setCurrentTabState(prev => {
        if (prev === nextTab) return prev;
        if (getPathFromTab(prev) === getPathFromTab(nextTab)) return prev;
        return nextTab;
      });
    };

    syncFromPath();
    window.addEventListener('popstate', syncFromPath);

    const handleLocationChanged = (e: any) => {
      const detail = e.detail;
      const targetTab = detail?.targetTab;
      const isExplicitUserClick = detail?.isUserClick === true;

      // ONLY redirect tab if user explicitly clicked Wilmington in the location dropdown!
      if (isExplicitUserClick && targetTab === 'Ryan Shield') {
        setCurrentTabState('Ryan Shield');
        if (window.location.pathname.startsWith('/app') || window.location.pathname.startsWith('/demo')) {
          const prefix = window.location.pathname.startsWith('/app') ? '/app' : '/demo';
          window.history.pushState({}, '', `${prefix}/ryan-shield`);
        }
      } else if (isExplicitUserClick && targetTab === 'Workboard') {
        setCurrentTabState('Workboard');
        if (window.location.pathname.startsWith('/app') || window.location.pathname.startsWith('/demo')) {
          const prefix = window.location.pathname.startsWith('/app') ? '/app' : '/demo';
          window.history.pushState({}, '', `${prefix}/workboard`);
        }
      }
    };

    window.addEventListener('shapework_location_changed', handleLocationChanged);

    return () => {
      window.removeEventListener('popstate', syncFromPath);
      window.removeEventListener('shapework_location_changed', handleLocationChanged);
    };
  }, [getTabFromPath]);

  const setCurrentTab = useCallback((tab: string) => {
    if (typeof window === 'undefined') return;

    setCurrentTabState(prev => {
      if (prev === tab) return prev;
      return tab;
    });

    const nextPath = getPathFromTab(tab);
    if (window.location.pathname !== nextPath) {
      const search = window.location.search || '';
      window.history.pushState({}, '', `${nextPath}${search}`);
    }
  }, [getPathFromTab]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    localStorage.getItem('shapework-sidebar-collapsed') === 'true'
  );
  const [operatorMinimized, setOperatorMinimized] = useState<boolean>(true);
  const [demoMode, setDemoMode] = useState<'founder' | 'coo' | 'tech'>('coo');
  
  // Active Context drawer states
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState<boolean>(false);
  const [activeEvidenceProposal, setActiveEvidenceProposal] = useState<AIActionProposal | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isAppPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/app');

  // Primary Database State
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile>({ id: 'usr_loading', name: 'Loading...', email: '', role: 'owner', permissions: [], status: 'active' });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [actionProposals, setActionProposals] = useState<AIActionProposal[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationConnection[]>([]);
  const [googleConnections, setGoogleConnections] = useState<any[]>([]);
  const [microsoftConnections, setMicrosoftConnections] = useState<any[]>([]);
  const [capacityMetrics, setCapacityMetrics] = useState<CapacityMetric[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [roiStats, setRoiStats] = useState(() => ({ actionsApprovedCount: 0, actionsCompletedCount: 0, hoursSaved: 0, averageResponseTimeMins: 0, overdueTasksReducedPercent: 0 }));
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [appMode, setAppMode] = useState<string>('development');
  
  const [workspaceId, setWorkspaceIdState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const wsParam = params.get('workspace');
      if (wsParam) {
        const normalized = wsParam === 'nest-realty-wilmington' ? 'nest-realty-demo' : wsParam;
        localStorage.setItem('shapework_active_workspace', normalized);
        return normalized;
      }
      const saved = localStorage.getItem('shapework_active_workspace');
      if (saved) return saved;
      if (window.location.pathname.startsWith('/app')) return 'nest-realty-demo';
    }
    return 'nest-realty-demo';
  });

  const setWorkspaceId = (id: string) => {
    setWorkspaceIdState(id);
    localStorage.setItem('shapework_active_workspace', id);
  };

  const [sessionToken, setSessionTokenState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shapework_session_token');
      if (saved) return saved;
    }
    return '';
  });

  const setSessionToken = (token: string) => {
    setSessionTokenState(token);
    localStorage.setItem('shapework_session_token', token);
  };

  const [workItems, setWorkItems] = useState<any[]>([]);
  const [signInventory, setSignInventory] = useState<any[]>([]);
  const [officeSupplies, setOfficeSupplies] = useState<any[]>([]);
  const [facilitiesIssues, setFacilitiesIssues] = useState<any[]>([]);
  const [entryPoints, setEntryPoints] = useState<BrokerageEntryPoint[]>([]);
  const [attentionStates, setAttentionStates] = useState<any[]>([]);
  const [ownerShieldDecisions, setOwnerShieldDecisions] = useState<any[]>([]);
  const [headlessActions, setHeadlessActions] = useState<any[]>([]);
  const [integrationEvents, setIntegrationEvents] = useState<any[]>([]);
  const [directoryPeople, setDirectoryPeople] = useState<any[]>([]);

  // 10 Runtime collections
  const [signals, setSignals] = useState<any[]>([]);
  const [decisionsState, setDecisionsState] = useState<any[]>([]);
  const [shapeworkJobs, setShapeworkJobs] = useState<any[]>([]);
  const [shapeworkJobSteps, setShapeworkJobSteps] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [ownerBriefItems, setOwnerBriefItems] = useState<any[]>([]);

  // Email Ingest and Command states
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [emailMessages, setEmailMessages] = useState<EmailMessage[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [automationPolicy, setAutomationPolicy] = useState<AutomationPolicy>({ autoApproveThreshold: 100, autoExecuteDelayMins: 0, notificationChannels: [], safetyChecksEnabled: true });
  const [commandPlans, setCommandPlans] = useState<CommandPlan[]>([]);

  // Syncing states
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dailyBriefing, setDailyBriefing] = useState<string>('');
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState<boolean>(false);
  const [isGeneratingChat, setIsGeneratingChat] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');

  // Selection states
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [selectedInboxId, setSelectedInboxId] = useState<string>('comm_1');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string | null>(null);
  const [riskTableFilter, setRiskTableFilter] = useState<'all' | 'closing' | 'risk' | 'attention'>('all');

  // AI Agent Workforce State
  const [aiAgents, setAiAgents] = useState<AgentDefinition[]>([]);
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const [governancePolicy, setGovernancePolicy] = useState<AgentGovernancePolicy>({
    globalAutomationPause: false,
    requireApprovalExternalMessages: true,
    requireApprovalComplianceSensitive: true,
    requireApprovalMaterialChanges: true,
    lowConfidenceThreshold: 85,
    retentionDays: 90
  });

  // Fetch state on boot
  const fetchState = async () => {
    setIsSyncing(true);
    try {
      // Fetch app mode
      let activeAppMode = 'development';
      try {
        const modeRes = await fetch('/api/mode');
        if (modeRes.ok) {
          const modeData = await modeRes.json();
          activeAppMode = modeData.mode || 'development';
          setAppMode(activeAppMode);
        }
      } catch (e) {
        console.error('Failed to load mode:', e);
      }

      // Fetch active workspace state
      const response = await apiClient.get(`/api/db-state?workspaceId=${workspaceId}`, { workspaceId });

      if (response.status === 401) {
        const fallbackOperator: Profile = {
          id: 'usr_marcus',
          name: 'Marcus Aman',
          email: 'marcus@shapework.co',
          role: 'owner',
          permissions: ['all'],
          status: 'active'
        };
        setActiveProfile(fallbackOperator);
        setIsLoading(false);
        setIsSyncing(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.profiles) {
          setProfiles(data.profiles);
          
          let loggedInUser = null;
          try {
            const sessRes = await apiClient.get('/api/auth/session', { workspaceId });
            if (sessRes.ok) {
              const sessData = await sessRes.json();
              if (sessData && sessData.user) {
                loggedInUser = sessData.user;
              }
            }
          } catch {}

          if (loggedInUser) {
            setActiveProfile(loggedInUser);
          } else if (data.profiles.length > 0) {
            const currentToken = localStorage.getItem('shapework_session_token') || '';
            const userProfile = data.profiles.find((p: any) => p.email === currentToken || p.id === currentToken) || data.profiles[0];
            setActiveProfile(userProfile);
          }
        }
        if (data.agents) setAgents(data.agents);
        if (data.transactions) {
          setTransactions(data.transactions.map((t: any) => ({
            ...t,
            risk_reasons: t.risk_reasons ?? [],
            revenue: t.revenue ?? 0,
            waiting_on: t.waiting_on ?? 'None',
            risk_level: t.risk_level ?? 'healthy'
          })));
        }
        if (data.actionProposals) setActionProposals(data.actionProposals);
        if (data.auditEvents) {
          setAuditEvents((data.auditEvents || []).map((e: any) => normalizeAuditEvent(e)));
        }
        if (data.integrations) setIntegrations(data.integrations);
        if (data.workspaceIntegrationConnections) {
          setGoogleConnections(data.workspaceIntegrationConnections.filter((c: any) => c.provider === 'google_workspace'));
          setMicrosoftConnections(data.workspaceIntegrationConnections.filter((c: any) => c.provider === 'microsoft_365'));
        }
        if (data.listings) {
          setListings(data.listings.map((l: any) => ({
            ...l,
            blocking_items: l.blocking_items ?? [],
            launch_checklist: l.launch_checklist ?? [],
            status: l.status ?? 'draft',
            compliance_status: l.compliance_status ?? 'pending',
            marketing_readiness: l.marketing_readiness ?? 'not_started'
          })));
        }
        if (data.chatHistory) setChatHistory(data.chatHistory);
        if (data.operationsInbox) setCommunications(data.operationsInbox);
        if (data.workItems) setWorkItems(data.workItems);
        if (data.entryPoints) setEntryPoints(data.entryPoints);
        if (data.signInventory) setSignInventory(data.signInventory);
        if (data.officeSupplies) setOfficeSupplies(data.officeSupplies);
        if (data.facilitiesIssues) setFacilitiesIssues(data.facilitiesIssues);
        if (data.attentionStates) setAttentionStates(data.attentionStates);
        if (data.ownerShieldDecisions) setOwnerShieldDecisions(data.ownerShieldDecisions);
        if (data.headlessActions) setHeadlessActions(data.headlessActions);
        if (data.integrationEvents) setIntegrationEvents(data.integrationEvents);
        if (data.signals) setSignals(data.signals);
        if (data.decisions) {
          setDecisions(data.decisions);
          setDecisionsState(data.decisions);
        }
        if (data.shapeworkJobs) setShapeworkJobs(data.shapeworkJobs);
        if (data.shapeworkJobSteps) setShapeworkJobSteps(data.shapeworkJobSteps);
        if (data.approvals) setApprovals(data.approvals);
        if (data.actions) setActions(data.actions);
        if (data.deliveries) setDeliveries(data.deliveries);
        if (data.outcomes) setOutcomes(data.outcomes);
        if (data.receipts) setReceipts(data.receipts);
        if (data.ownerBriefItems) setOwnerBriefItems(data.ownerBriefItems);

        try {
          const dirRes = await apiClient.get(`/api/directory?workspaceId=${workspaceId}`, { workspaceId });
          if (dirRes.ok) {
            const dirData = await dirRes.json();
            if (dirData && dirData.directoryPeople) {
              setDirectoryPeople(dirData.directoryPeople);
            }
          }
        } catch (dirErr) {
          console.warn('Failed to load directory inside sync:', dirErr);
        }
      }
    } catch (err) {
      console.warn('Network issue or backend server offline. Using static client fallback states.', err);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  // Generate briefing
  const loadBriefing = async () => {
    setIsGeneratingBriefing(true);
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        // Just checking basic health endpoint; load static briefing as fallback
      }
      throw new Error('Briefing failed');
    } catch (err) {
      // Fallback
      setDailyBriefing(`**Active Operations Summary**  
      Operational monitoring is steady. There are currently **5 active transaction files** being observed. **2 transactions** have elevated risk factors (notably **102 Pine Street** facing a financing milestone expiry and outstanding utility disclosures). 
    
      **Priority Action Points**
      * **Critical Review Required:** **742 Evergreen Terrace** has been flagged by the coordinator due to structural foundation cracking. Immediate client exception review advised.
      * **Lender Outreach Pending:** **102 Pine Street** financing contingency expires in five days; the AI Operator has prepared a follow-up letter to lender Alice Walker awaiting your approval.
      * **Launch Preparation:** Photography launch coordinate checklist is overdue for **109 Woodlawn**. Todd Howard has been notified.`);
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  useEffect(() => {
    fetchState();
    loadBriefing();
  }, []);

  // Email and Automation Handlers
  const handleToggleEmailConnection = (id: string) => {
    setEmailAccounts(prev => prev.map(a => a.id === id ? {
      ...a,
      status: a.status === 'connected' ? 'disconnected' : 'connected',
      last_sync: new Date().toISOString()
    } : a));

    const account = emailAccounts.find(a => a.id === id);
    if (account) {
      const isConnecting = account.status !== 'connected';
      const event = createAuditEvent(
        activeProfile,
        `${isConnecting ? 'Connected' : 'Disconnected'} email connector: ${account.address}`,
        'Integrations Security'
      );
      setAuditEvents(prev => [event, ...prev]);
    }
  };

  const handleSyncEmailAccount = (id: string) => {
    setEmailAccounts(prev => prev.map(a => a.id === id ? { ...a, status: 'connected', last_sync: new Date().toISOString() } : a));
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setEmailAccounts(prev => prev.map(a => a.id === id ? {
        ...a,
        processed_count: a.processed_count + 14,
        matched_count: a.matched_count + 11,
        proposed_actions_count: a.proposed_actions_count + 2
      } : a));
      
      const account = emailAccounts.find(a => a.id === id);
      if (account) {
        const event = createAuditEvent(
          activeProfile,
          `Synchronized email account: ${account.address}. Ingested 14 new signals, mapped 11 transaction reference matches.`,
          'Data Ingestion Pipeline'
        );
        setAuditEvents(prev => [event, ...prev]);
      }
    }, 1200);
  };

  const handleProcessEmailMessage = (id: string, selectProperty?: string) => {
    const msg = emailMessages.find(m => m.id === id);
    if (!msg) return;

    setEmailMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'auto_updated', matched_property: selectProperty || m.matched_property } : m));
    const finalProperty = selectProperty || msg.matched_property;
    
    const event = createAuditEvent(
      activeProfile,
      `Processed email message from ${msg.sender}. Extracted intent: '${msg.intent}'. Matched property: '${finalProperty}'.`,
      'Operational Automation'
    );
    setAuditEvents(prev => [event, ...prev]);

    if (msg.id === 'em_1') {
      setTransactions(prev => prev.map(tx => tx.id === 'tx_1' ? {
        ...tx,
        current_stage: 'closing_prep',
        waiting_on: 'None',
        latest_update: 'Clear to close verified via Coastal Lending email confirmation.',
        next_action: 'Verify buyer wired closing funds to escrow',
        health_score: 95,
        risk_level: 'healthy',
        risk_reasons: []
      } : tx));
    } else if (msg.id === 'em_2' && finalProperty) {
      setListings(prev => prev.map(l => l.property_address === finalProperty ? {
        ...l,
        compliance_status: 'approved',
        blocking_items: l.blocking_items.filter(b => !safeLower(b).includes('disclosure')),
        launch_checklist: l.launch_checklist.map(step => safeLower(step.step_name).includes('disclosure') ? { ...step, status: 'completed' } : step)
      } : l));
    } else if (msg.id === 'em_3') {
      setTransactions(prev => prev.map(tx => tx.id === 'tx_2' ? {
        ...tx,
        risk_level: 'blocked',
        risk_reasons: ['Apex Home Inspection foundation crack report flagged structural warnings'],
        waiting_on: 'Client',
        next_action: 'Negotiate repair amendment responses prior to contract contingency deadlines'
      } : tx));
    }
  };

  const handleSaveAutomationRules = (updatedRules: AutomationRule[], updatedPolicy: AutomationPolicy) => {
    setAutomationRules(updatedRules);
    setAutomationPolicy(updatedPolicy);
    
    const event = createAuditEvent(
      activeProfile,
      'Updated operational automation safeguards and confidence thresholds',
      'Governance Policy'
    );
    setAuditEvents(prev => [event, ...prev]);
  };

  // Command Execution Handlers
  const handleExecuteCommandPlan = (planId: string) => {
    setChatHistory(prev => prev.map(msg => {
      if (msg.commandPlan && msg.commandPlan.id === planId) {
        const updatedSteps = msg.commandPlan.steps.map(step => ({ ...step, status: 'completed' as const }));
        
        const auditLog = createAuditEvent(
          activeProfile,
          `Executed AI Command Plan: ${msg.commandPlan.intent_detected}`,
          'Operational Command Engine'
        );
        setAuditEvents(aud => [auditLog, ...aud]);

        if (planId === 'cmd_1' || planId === 'cmd_cost') {
          const newProposals: AIActionProposal[] = [
            {
              id: `p_new_1`,
              action_type: 'draft_email',
              title: 'Draft email followup reminder to Brooke Shields',
              description: 'Requested executed disclosures for 221 B Baker Street.',
              state: 'suggested',
              confidence: 0.95,
              created_at: new Date().toISOString(),
              target_recipient: 'brooke.s@nest-demo.local',
              draft_content: 'Hi Brooke,\n\nPlease upload the remaining signed disclosures for 221 B Baker Street contract compliance review.\n\nThanks,\nSarah'
            },
            {
              id: `p_new_2`,
              action_type: 'draft_email',
              title: 'Draft email followup reminder to Diana Prince',
              description: 'Credit review status query on 305 Hillside Drive.',
              state: 'suggested',
              confidence: 0.92,
              created_at: new Date().toISOString(),
              target_recipient: 'diana.p@nest-demo.local',
              draft_content: 'Hi Diana,\n\nI noticed the buyer credit review is still pending. Can we get an update from the lender prior to contingency deadlines?\n\nBest,\nSarah'
            }
          ];
          setActionProposals(prop => [...newProposals, ...prop]);
          
          setDecisions(dec => [
            {
              id: 'p_new_1',
              title: 'Approve Outbound Agent Email: Brooke Shields',
              description: 'Awaiting authorization to send 221 B Baker Street missing document reminder.',
              financial_impact: 18000,
              owner: 'Diane Ross (TC)',
              time_remaining: '24 hours',
              why_it_matters: 'Missing earnest or disclosure compliance items flags escrow compliance audits.',
              evidence: 'Command Audit: Sourced missing disclosures from baker file',
              recommended_action: 'Approve reminder dispatch'
            },
            ...dec
          ]);
        } else if (planId === 'cmd_closings') {
          setTransactions(prev => prev.map(tx => tx.id === 'tx_1' ? { ...tx, risk_level: 'warning', latest_update: 'Appraisal escalation email drafted and queued.' } : tx));
        } else if (planId === 'cmd_compliance') {
          setListings(prev => prev.map(l => l.id === 'l_1' ? { ...l, compliance_status: 'approved' } : l));
        }

        return {
          ...msg,
          commandPlan: {
            ...msg.commandPlan,
            steps: updatedSteps,
            execution_status: 'completed' as const
          }
        };
      }
      return msg;
    }));
  };

  const handleCancelCommandPlan = (planId: string) => {
    setChatHistory(prev => prev.map(msg => {
      if (msg.commandPlan && msg.commandPlan.id === planId) {
        return {
          ...msg,
          commandPlan: {
            ...msg.commandPlan,
            execution_status: 'cancelled' as const
          }
        };
      }
      return msg;
    }));
  };

  // Switch Active Sandbox Role
  const handleRoleSwitch = (profileId: string) => {
    const matchedProfile = profiles.find(p => p.id === profileId);
    if (!matchedProfile) return;
    
    setActiveProfile(matchedProfile);
    setSessionToken(matchedProfile.email || matchedProfile.id);

    const newAudit = createAuditEvent(
      matchedProfile,
      `Switched view context to ${matchedProfile.role.replace('_', ' ')}`,
      'Access Context'
    );
    setAuditEvents(prev => [newAudit, ...prev]);
  };

  // Helper to post changes to Express server backend for real data persistence
  const postAction = async (endpoint: string, body: any) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-workspace-id': workspaceId
      };
      // Drop localStorage token fallback in production
      const token = typeof window !== 'undefined' && window.location.pathname.startsWith('/app')
        ? null
        : localStorage.getItem('shapework_session_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        credentials: 'include'
      });
      // Synchronize backend state reactive updates
      await fetchState();
    } catch (e) {
      console.error('[shapework State Sync] Failed to post action update:', e);
    }
  };

  // Approve action proposal
  const handleApproveAction = async (actionId: string) => {
    setActionProposals(prev => prev.map(p => p.id === actionId ? { ...p, state: 'approved' } : p));
    setCommunications(prev => prev.map(c => c.action_proposal_id === actionId ? { ...c, status: 'completed' } : c));
    setDecisions(prev => prev.filter(d => d.id !== actionId));

    setRoiStats(prev => ({
      ...prev,
      actionsApprovedCount: prev.actionsApprovedCount + 1,
      actionsCompletedCount: prev.actionsCompletedCount + 1,
      hoursSaved: prev.hoursSaved + 0.5
    }));

    const action = actionProposals.find(p => p.id === actionId);
    if (action) {
      const audit = createAuditEvent(
        activeProfile,
        `Approved proposed action: "${action.title}"`,
        'Action Approval',
        action.title
      );
      setAuditEvents(prev => [audit, ...prev]);
    }

    await postAction('/api/action/approve', { actionId });
  };

  // Dismiss action proposal
  const handleDismissAction = async (actionId: string) => {
    setActionProposals(prev => prev.map(p => p.id === actionId ? { ...p, state: 'dismissed' } : p));
    setDecisions(prev => prev.filter(d => d.id !== actionId));

    await postAction('/api/action/dismiss', { actionId });
  };

  // Conversational operator messaging
  const handleSendChatMessage = (msg: string) => {
    if (!msg.trim()) return;

    const userMessage: ChatMessage = {
      id: `m_${Date.now()}_u`,
      sender: 'user',
      text: msg,
      timestamp: new Date().toISOString()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setChatInput('');
    setIsGeneratingChat(true);

    setTimeout(() => {
      const response = getCommandResponse(msg);
      const aiMessage: ChatMessage = {
        id: `m_${Date.now()}_a`,
        sender: 'ai',
        text: response.replyText,
        timestamp: new Date().toISOString(),
        commandPlan: response.commandPlan
      };

      setChatHistory(prev => [...prev, aiMessage]);
      setIsGeneratingChat(false);
    }, 800);
  };

  // Reassignment trigger (Capacity metrics)
  const handleTriggerReassignment = (coordinator: string, suggestion: string) => {
    setCapacityMetrics(prev => prev.map(m => {
      if (m.coordinator_name === 'Diane Ross') {
        return { ...m, assigned_work: m.assigned_work - 1, capacity_percentage: 80, overdue_items: m.overdue_items - 1 };
      }
      if (m.coordinator_name === 'Emma Watson') {
        return { ...m, assigned_work: m.assigned_work + 1, capacity_percentage: 55 };
      }
      return m;
    }));

    setTransactions(prev => prev.map(tx => tx.id === 'tx_1' ? { ...tx, transaction_coordinator_id: 'u_tc2' } : tx));

    const newAudit = createAuditEvent(
      activeProfile,
      `Executed workload re-balancing: shifted 102 Pine Street coordinating file from Diane Ross to Emma Watson`,
      'Workload Capacity Balancing'
    );
    setAuditEvents(prev => [newAudit, ...prev]);
  };

  const handleRollbackAuditAction = (logId: string) => {
    const log = auditEvents.find(e => e.id === logId);
    if (!log) return;
    
    const rollbackLog = createAuditEvent(
      activeProfile,
      `Rolled back operation: "${log.action || log.action_description}"`,
      'Audit Verification Rollback'
    );
    
    setAuditEvents(prev => [rollbackLog, ...prev]);
    setTransactions(prev => rollbackTransactionStage(log, prev));
  };

  // Ingestion evidence view drawer trigger
  const handleViewEvidence = (proposal: AIActionProposal) => {
    setActiveEvidenceProposal(proposal);
    setEvidenceDrawerOpen(true);
  };

  const handleTriggerDemoEvent = (connectorId: string) => {
    const connectors = getRegistryConnectors();
    const connector = connectors.find(c => c.id === connectorId);
    if (!connector) return;

    const event = connector.demoEvents?.[0];
    if (event) {
      const stateObj = {
        transactions,
        setTransactions,
        listings,
        setListings,
        communications,
        setCommunications,
        auditEvents,
        setAuditEvents,
        decisions,
        setDecisions,
        integrations,
        setIntegrations
      };

      runDemoEventInSandbox(connectorId, event.id, event, stateObj).then((res) => {
        // Find which agents are expected to activate and run them visually
        if (res.activatedAgents && res.activatedAgents.length > 0) {
          setAiAgents((prev) =>
            prev.map((a) =>
              res.activatedAgents.some(agName => 
                a.name.toLowerCase().includes(agName.toLowerCase()) || 
                a.role.toLowerCase().includes(agName.toLowerCase())
              )
                ? {
                    ...a,
                    status: 'running',
                    last_run: 'Just now',
                    actions_completed_today: a.actions_completed_today + 1
                  }
                : a
            )
          );
        }
      });
      return;
    }

    // Fallback: If no custom demo event in factory, use legacy generic fallback behavior
    const timestamp = new Date().toISOString();
    const name = connector.name;
    const category = connector.category;
    const primaryAgent = connector.dependentAgents?.[0] || 'System Integration Agent';

    // 1. Log a custom audit entry
    const newAudit = createAuditEvent(
      { name: primaryAgent, role: 'Agent' },
      `Dynamic Webhook Sync: Ingested telemetry from ${name} API channel. Synchronized 14 new records. Validated secure signature matching.`,
      `${category} Ingestion`,
      'Platform Sync'
    );
    setAuditEvents(prev => [newAudit, ...prev]);

    // 2. Generate custom alert notifications or communications based on categories
    if (category === 'CRM & Front Office') {
      const newComm = {
        id: `comm_dyn_${Date.now()}`,
        sender: `${name} Webhook Router`,
        sender_email: `webhooks@${connectorId.replace('i_', '')}.service.local`,
        recipient: 'sarah.j@nest-demo.local',
        subject: `Contact Update Sync from ${name}`,
        body: `Integrated webhook lead data: buyer Arthur Pendragon has updated his preference profile for 109 Woodlawn in ${name}. Contact synced.`,
        timestamp,
        channel: 'email' as const,
        urgency: 'low' as const,
        status: 'unread' as const,
        related_property: '109 Woodlawn',
        related_agent: 'Emma Watson',
        extracted_intent: 'lead_profile_sync'
      };
      setCommunications(prev => [newComm, ...prev]);
    } else if (category === 'Showings & Access') {
      const newAuditShow = createAuditEvent(
        { name: 'Showings Audit Agent', role: 'Agent' },
        `${name} Lockbox Access Alert: Lockbox was opened by Buyer Agent Alex Carter for 109 Woodlawn showing appointment.`,
        'Lockbox Security',
        '109 Woodlawn'
      );
      setAuditEvents(prev => [newAuditShow, ...prev]);
    } else if (category === 'Analytics & Reporting' || category === 'AI & Data Infrastructure') {
      const newComm = {
        id: `comm_dyn_${Date.now()}`,
        sender: `${name} Operations Agent`,
        sender_email: `analytics@${connectorId.replace('i_', '')}.service.local`,
        recipient: 'sarah.j@nest-demo.local',
        subject: `${name} Analytics Ingest Report`,
        body: `Daily operation metrics and intelligence vectors parsed successfully via ${name}. Operational score: 98.4%.`,
        timestamp,
        channel: 'email' as const,
        urgency: 'low' as const,
        status: 'unread' as const,
        related_property: 'All Active files',
        related_agent: 'Sarah Jenkins',
        extracted_intent: 'analytics_report'
      };
      setCommunications(prev => [newComm, ...prev]);
    } else {
      const newDecision = {
        id: `dec_dyn_${Date.now()}`,
        title: `Integrations Sync Notice: ${name}`,
        description: `Telemetry matching completed via ${name}. Ingested capabilities grid verification matches secure parameters.`,
        financial_impact: 0,
        owner: 'Sarah Jenkins (COO)',
        time_remaining: '48 hours',
        why_it_matters: `Keeps shapework. operations aligned with the latest ${name} data exports.`,
        evidence: `Connection parameters: ${connector.authMethod.toUpperCase()} credentials validated.`,
        recommended_action: 'Dismiss notification'
      };
      setDecisions(prev => [newDecision, ...prev]);
    }
  };

  // Sync / Ingestion test connections
  const handleToggleConnection = (id: string) => {
    setIntegrations(prev => {
      const exists = prev.some(i => i.id === id);
      if (exists) {
        return prev.map(i => i.id === id ? { ...i, connected: !i.connected } : i);
      } else {
        const catalogConnector = initialCatalogConnectors.find(c => c.id === id);
        const newConnection: IntegrationConnection = {
          id,
          name: catalogConnector?.name || id,
          icon: catalogConnector?.logoKey || 'webhook',
          connected: true,
          last_sync: new Date().toISOString(),
          permissions_granted: catalogConnector?.readCapabilities || [],
          records_synchronized: 12,
          errors_count: 0,
          purpose: catalogConnector?.description || '',
          data_categories: catalogConnector?.dataObjects || []
        };
        return [...prev, newConnection];
      }
    });
  };

  const handleTestConnection = (id: string) => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setIntegrations(prev => prev.map(i => i.id === id ? { ...i, last_sync: new Date().toISOString(), errors_count: 0 } : i));
    }, 1000);
  };

  const handleGlobalSearchSubmit = (query: string) => {
    if (!query.trim()) return;
    setOperatorMinimized(false);
    handleSendChatMessage(query);
  };

  const handleUpdatePolicy = (newPolicy: Partial<AgentGovernancePolicy>) => {
    setGovernancePolicy(prev => ({ ...prev, ...newPolicy }));
  };

  const handleTriggerRunAgent = (agentId: string) => {
    setAiAgents(prev => prev.map(a => {
      if (a.id === agentId) {
        return {
          ...a,
          status: 'running',
          last_run: 'Just now',
          actions_completed_today: a.actions_completed_today + 1
        };
      }
      return a;
    }));

    const newRunId = `run_${agentId.replace('agent_', '')}_${Date.now()}`;
    const newRun: AgentRun = {
      runId: newRunId,
      agentId: agentId,
      status: 'completed',
      trigger: 'Manual User Trigger',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      recordsScanned: 5,
      findings: [`Triggered manual execution check for ${agentId}.`],
      recommendations: ['All records verified successfully.'],
      actionsPrepared: 0,
      actionsExecuted: 0,
      approvalsRequired: 0,
      evidence: 'Manual invocation via agent control room.',
      auditEventsCreated: [`audit_man_${newRunId}`]
    };
    setAgentRuns(prev => [newRun, ...prev]);

    const newEvent: AgentEvent = {
      id: `evt_man_${Date.now()}`,
      timestamp: new Date().toISOString(),
      trigger: 'Manual run command',
      agentId: agentId,
      recordsInspected: ['Global database'],
      findings: ['System state checks verified.'],
      recommendedAction: 'Keep operating status monitoring active.',
      approvalStatus: 'auto-safe',
      auditEventId: `audit_man_${newRunId}`,
      rollbackAvailable: false
    };
    setAgentEvents(prev => [newEvent, ...prev]);

    setTimeout(() => {
      setAiAgents(prev => prev.map(a => {
        if (a.id === agentId) {
          return { ...a, status: 'monitoring' };
        }
        return a;
      }));
    }, 1500);
  };

  const handleTriggerSimulation = (scenarioId: string) => {
    const timestamp = new Date().toISOString();
    
    switch (scenarioId) {
      case 'sim_clear_to_close': {
        setTransactions(prev => prev.map(t => {
          if (t.id === 'tx_102' || t.property_address.includes('Pine')) {
            return {
              ...t,
              current_stage: 'closing_prep',
              last_verified_update: 'Just now by Transaction Stage Agent'
            };
          }
          return t;
        }));
        
        const newAudit = createAuditEvent(
          { name: 'Transaction Stage Agent', role: 'Agent' },
          'Stage transitioned to closing prep due to clear to close email.',
          'auto_update_stage',
          '102 Pine St',
          { before_value: 'under_contract', after_value: 'closing_prep' }
        );
        setAuditEvents(prev => [newAudit, ...prev]);

        const newRun: AgentRun = {
          runId: `run_stage_${Date.now()}`,
          agentId: 'agent_stage',
          status: 'completed',
          trigger: 'Lender email: "underwriting approved clear to close" for 102 Pine St',
          startedAt: timestamp,
          completedAt: timestamp,
          recordsScanned: 2,
          findings: ['Found "clear to close" indicator in email body.'],
          recommendations: ['Transition stage to closing prep.'],
          actionsPrepared: 1,
          actionsExecuted: 1,
          approvalsRequired: 0,
          evidence: 'Email from lender-inbox (loan-officer@apexmortgage.com): "Underwriting approved clear to close on Pine Street."',
          auditEventsCreated: [newAudit.id]
        };
        setAgentRuns(prev => [newRun, ...prev]);

        const newEvent: AgentEvent = {
          id: `evt_sim_${Date.now()}`,
          timestamp,
          trigger: 'Lender email received',
          agentId: 'agent_stage',
          recordsInspected: ['102 Pine St (Transaction ID: tx_102)'],
          findings: ['Found "clear to close" indicator.'],
          recommendedAction: 'Transition transaction stage to Closing Prep.',
          approvalStatus: 'auto-safe',
          auditEventId: newAudit.id,
          rollbackAvailable: true
        };
        setAgentEvents(prev => [newEvent, ...prev]);

        setAiAgents(prev => prev.map(a => {
          if (a.id === 'agent_stage') {
            return {
              ...a,
              status: 'monitoring',
              actions_completed_today: a.actions_completed_today + 1,
              last_run: 'Just now'
            };
          }
          return a;
        }));
        break;
      }

      case 'sim_low_confidence': {
        const newProposal: AIActionProposal = {
          id: `prop_low_${Date.now()}`,
          action_type: 'flag_transaction_risk' as any,
          title: 'Ambiguous Seller Signature Match',
          description: 'Randy Agent forwarded a seller signed addendum, but the signature field extraction match rating is 78%. Human verification required.',
          confidence: 0.78,
          state: 'awaiting_approval',
          draft_content: 'Audit Attachment ID: doc_randy_addendum.pdf. Extracted signature: Randy Smith.',
          target_recipient: 'Sarah Jenkins',
          created_at: timestamp
        };
        setActionProposals(prev => [newProposal, ...prev]);

        const newRun: AgentRun = {
          runId: `run_support_${Date.now()}`,
          agentId: 'agent_support',
          status: 'completed',
          trigger: 'Agent email: "seller signed docs"',
          startedAt: timestamp,
          completedAt: timestamp,
          recordsScanned: 1,
          findings: ['Found signature match rating of 78% which is below the 85% threshold.'],
          recommendations: ['Generate decision queue item for Sarah Jenkins.'],
          actionsPrepared: 1,
          actionsExecuted: 0,
          approvalsRequired: 1,
          evidence: 'Email attachment: doc_randy_addendum.pdf from randy.agent@nestrealty.com',
          auditEventsCreated: []
        };
        setAgentRuns(prev => [newRun, ...prev]);

        const newEvent: AgentEvent = {
          id: `evt_sim_${Date.now()}`,
          timestamp,
          trigger: 'Agent email update attachment',
          agentId: 'agent_support',
          recordsInspected: ['Randy Agent profile', 'Randy signature file'],
          findings: ['Signature match rating 78% (Threshold: 85%)'],
          recommendedAction: 'Queue manual decision review for Sarah Jenkins.',
          approvalStatus: 'approval required',
          rollbackAvailable: false
        };
        setAgentEvents(prev => [newEvent, ...prev]);

        setAiAgents(prev => prev.map(a => {
          if (a.id === 'agent_support') {
            return {
              ...a,
              status: 'needs_approval',
              items_requiring_approval: a.items_requiring_approval + 1,
              last_run: 'Just now'
            };
          }
          return a;
        }));
        break;
      }

      case 'sim_docusign_fail': {
        setIntegrations(prev => prev.map(conn => {
          if (conn.id === 'connector_docusign' || safeLower(conn.name).includes('docusign')) {
            return {
              ...conn,
              status: 'error',
              last_sync_time: 'Sync failed just now'
            };
          }
          return conn;
        }));

        setRoiStats(prev => ({
          ...prev,
          averageResponseTimeMins: prev.averageResponseTimeMins + 5,
        }));

        const newAudit = createAuditEvent(
          { name: 'Integration Health Agent', role: 'System' },
          'DocuSign Webhook handshake failed. Stale credentials alert logged ($400 waste estimate).',
          'webhook_handshake_failure',
          'DocuSign API Connector',
          { before_value: 'healthy', after_value: 'error' }
        );
        setAuditEvents(prev => [newAudit, ...prev]);

        const newRun: AgentRun = {
          runId: `run_health_${Date.now()}`,
          agentId: 'agent_health',
          status: 'failed',
          trigger: 'DocuSign webhook sync timeout',
          startedAt: timestamp,
          completedAt: timestamp,
          recordsScanned: 1,
          findings: ['API sync timed out. Webhook handshake returned 502 Bad Gateway.'],
          recommendations: ['Mark DocuSign credentials as stale.', 'Create admin notification.'],
          actionsPrepared: 0,
          actionsExecuted: 0,
          approvalsRequired: 0,
          evidence: 'API endpoint https://api.docusign.com/v2.1/accounts/nest/webhooks returned 502.',
          auditEventsCreated: [newAudit.id],
          errors: ['Webhook handshake failed. Connection timed out.']
        };
        setAgentRuns(prev => [newRun, ...prev]);

        const newEvent: AgentEvent = {
          id: `evt_sim_${Date.now()}`,
          timestamp,
          trigger: 'Integration sync failure',
          agentId: 'agent_health',
          recordsInspected: ['DocuSign connection properties'],
          findings: ['API credentials expired. Connection timed out.'],
          recommendedAction: 'Flag integration stale. Log $400 waste.',
          approvalStatus: 'needs human review',
          auditEventId: newAudit.id,
          rollbackAvailable: false
        };
        setAgentEvents(prev => [newEvent, ...prev]);

        setAiAgents(prev => prev.map(a => {
          if (a.id === 'agent_health') {
            return {
              ...a,
              status: 'error',
              last_run: 'Just now'
            };
          }
          return a;
        }));
        break;
      }

      case 'sim_listing_photos_blocked': {
        setListings(prev => prev.map(l => {
          if (l.id === 'lst_104' || l.property_address.includes('Maple')) {
            return {
              ...l,
              status: 'draft',
              marketing_readiness: 'not_started',
              blocking_items: ['Missing photography invoice and file uploads']
            };
          }
          return l;
        }));

        const newRun: AgentRun = {
          runId: `run_listing_${Date.now()}`,
          agentId: 'agent_listing',
          status: 'completed',
          trigger: 'Listing launch date within 48 hours check',
          startedAt: timestamp,
          completedAt: timestamp,
          recordsScanned: 4,
          findings: ['104 Maple Ave is missing photographs. Target launch is in 48 hours.'],
          recommendations: ['Block Listing Stage.', 'Alert Listing Coordinator.'],
          actionsPrepared: 1,
          actionsExecuted: 1,
          approvalsRequired: 0,
          evidence: 'Scan of /listings/lst_104/assets returned 0 image files.',
          auditEventsCreated: []
        };
        setAgentRuns(prev => [newRun, ...prev]);

        const newEvent: AgentEvent = {
          id: `evt_sim_${Date.now()}`,
          timestamp,
          trigger: 'Listing launch target approaching',
          agentId: 'agent_listing',
          recordsInspected: ['104 Maple Ave listing files'],
          findings: ['Checklist item "Upload Photos" is empty.'],
          recommendedAction: 'Block listing status transition to active. Alert agent Randy.',
          approvalStatus: 'approval required',
          rollbackAvailable: false
        };
        setAgentEvents(prev => [newEvent, ...prev]);

        setAiAgents(prev => prev.map(a => {
          if (a.id === 'agent_listing') {
            return {
              ...a,
              status: 'needs_approval',
              last_run: 'Just now'
            };
          }
          return a;
        }));
        break;
      }

      case 'sim_attorney_closing_change': {
        setTransactions(prev => prev.map(t => {
          if (t.id === 'tx_908' || t.property_address.includes('Colonial')) {
            return {
              ...t,
              risk_level: 'at_risk',
              risk_reasons: ['Closing date pushed back 10 days by title attorney'],
              last_verified_update: 'Pushed back 10 days by attorney email'
            };
          }
          return t;
        }));

        const newAudit = createAuditEvent(
          { name: 'Closing Risk Agent', role: 'Agent' },
          'Transaction flagged at risk. Attorney email shifted escrow closing timeline.',
          'risk_assessment_change',
          '908 Colonial Ave',
          { before_value: 'healthy', after_value: 'at_risk' }
        );
        setAuditEvents(prev => [newAudit, ...prev]);

        const newRun: AgentRun = {
          runId: `run_closing_${Date.now()}`,
          agentId: 'agent_closing',
          status: 'completed',
          trigger: 'Attorney email: closing rescheduled',
          startedAt: timestamp,
          completedAt: timestamp,
          recordsScanned: 1,
          findings: ['Escrow rescheduling event detected. Escrow timeline shifted out by 10 days.'],
          recommendations: ['Recalculate risk rating to at_risk.', 'Alert Sarah COO.'],
          actionsPrepared: 1,
          actionsExecuted: 1,
          approvalsRequired: 0,
          evidence: 'Attorney email (closing-attorney@landtitle.com): "Closing session rescheduled to July 15."',
          auditEventsCreated: [newAudit.id]
        };
        setAgentRuns(prev => [newRun, ...prev]);

        const newEvent: AgentEvent = {
          id: `evt_sim_${Date.now()}`,
          timestamp,
          trigger: 'Attorney closing date change email',
          agentId: 'agent_closing',
          recordsInspected: ['908 Colonial Ave files'],
          findings: ['Closing session rescheduled to July 15 (shifted by 10 days)'],
          recommendedAction: 'Flag transaction at risk. Notify Sarah Jenkins.',
          approvalStatus: 'auto-safe',
          auditEventId: newAudit.id,
          rollbackAvailable: true
        };
        setAgentEvents(prev => [newEvent, ...prev]);

        setAiAgents(prev => prev.map(a => {
          if (a.id === 'agent_closing') {
            return {
              ...a,
              status: 'monitoring',
              actions_completed_today: a.actions_completed_today + 1,
              last_run: 'Just now'
            };
          }
          return a;
        }));
        break;
      }

      case 'sim_agent_support_load': {
        const newProposal: AIActionProposal = {
          id: `prop_supp_${Date.now()}`,
          action_type: 'flag_transaction_risk' as any,
          title: 'Overloaded Agent Support Request',
          description: 'Randy Agent is currently managing 9 active escrows and has emailed requesting assistance with SkySlope document uploads. Recommend linking TC Diane Ross.',
          confidence: 0.94,
          state: 'suggested',
          draft_content: 'Link Diane Ross (TC) to Randy Agent active escrow loops.',
          target_recipient: 'Sarah Jenkins',
          created_at: timestamp
        };
        setActionProposals(prev => [newProposal, ...prev]);

        const newRun: AgentRun = {
          runId: `run_support_${Date.now()}`,
          agentId: 'agent_support',
          status: 'completed',
          trigger: 'Randy Agent support query: SkySlope upload help',
          startedAt: timestamp,
          completedAt: timestamp,
          recordsScanned: 2,
          findings: ['Randy Agent active transaction count is 9 (threshold 7). Support load is critical.'],
          recommendations: ['Propose linking auxiliary TC to help Randy Agent.'],
          actionsPrepared: 1,
          actionsExecuted: 0,
          approvalsRequired: 1,
          evidence: 'Randy Agent email: "Need help setting up disclosures folders on Westlake listing. Super behind."',
          auditEventsCreated: []
        };
        setAgentRuns(prev => [newRun, ...prev]);

        const newEvent: AgentEvent = {
          id: `evt_sim_${Date.now()}`,
          timestamp,
          trigger: 'Agent support request email',
          agentId: 'agent_support',
          recordsInspected: ['Randy Agent volume metrics', 'Roster capacity'],
          findings: ['Randy Agent volume critical (9 active deals). Support load exceeds limits.'],
          recommendedAction: 'Delegate auxiliary TC workload support to Randy.',
          approvalStatus: 'approval required',
          rollbackAvailable: false
        };
        setAgentEvents(prev => [newEvent, ...prev]);

        setAiAgents(prev => prev.map(a => {
          if (a.id === 'agent_support') {
            return {
              ...a,
              status: 'needs_approval',
              actions_prepared_today: a.actions_prepared_today + 1,
              last_run: 'Just now'
            };
          }
          return a;
        }));
        break;
      }

      case 'sim_missing_compliance': {
        setTransactions(prev => prev.map(t => {
          if (t.id === 'tx_evergreen' || t.property_address.includes('Evergreen')) {
            return {
              ...t,
              compliance_status: 'pending',
              risk_level: 'blocked',
              risk_reasons: ['Buyer Brokerage Agreement unsigned/missing in DocuSign loop']
            };
          }
          return t;
        }));

        const newAudit = createAuditEvent(
          { name: 'Compliance Agent', role: 'Agent' },
          'Compliance alert logged: Missing mandatory Buyer Agency contract disclosure.',
          'compliance_exception_logged',
          'Evergreen transaction folder',
          { before_value: 'compliant', after_value: 'non_compliant' }
        );
        setAuditEvents(prev => [newAudit, ...prev]);

        const newRun: AgentRun = {
          runId: `run_compliance_${Date.now()}`,
          agentId: 'agent_compliance',
          status: 'completed',
          trigger: 'Contract signature scan',
          startedAt: timestamp,
          completedAt: timestamp,
          recordsScanned: 5,
          findings: ['Evergreen escrow file contains purchase contract, but lacks signed Buyer Agency agreement.'],
          recommendations: ['Flag transaction as non-compliant.', 'Draft document request email.'],
          actionsPrepared: 1,
          actionsExecuted: 1,
          approvalsRequired: 0,
          evidence: 'Evergreen DocuSign folder scan returned 2/3 signed disclosures.',
          auditEventsCreated: [newAudit.id]
        };
        setAgentRuns(prev => [newRun, ...prev]);

        const newEvent: AgentEvent = {
          id: `evt_sim_${Date.now()}`,
          timestamp,
          trigger: 'Compliance checklist scan',
          agentId: 'agent_compliance',
          recordsInspected: ['Evergreen transaction folders'],
          findings: ['Checklist item "Buyer Broker Agreement" is unsigned/missing.'],
          recommendedAction: 'Log compliance exception. Block deal progression.',
          approvalStatus: 'compliance-sensitive',
          auditEventId: newAudit.id,
          rollbackAvailable: false
        };
        setAgentEvents(prev => [newEvent, ...prev]);

        setAiAgents(prev => prev.map(a => {
          if (a.id === 'agent_compliance') {
            return {
              ...a,
              status: 'monitoring',
              actions_completed_today: a.actions_completed_today + 1,
              last_run: 'Just now'
            };
          }
          return a;
        }));
        break;
      }

      case 'sim_overnight_briefing': {
        setIsGeneratingBriefing(true);
        setTimeout(() => {
          setDailyBriefing(
            `Nest Realty Daily Operations Briefing - June 28, 2026 [SYNTHETIC DATA DEMO]
======================================================================
AI COO Orchestrator monitored overnight changes:
* Transaction Stage Agent analyzed lender emails and auto-transitioned 102 Pine St to Closing Prep.
* Compliance Agent scanned active escrow folders and flagged a missing Buyer Brokerage Agreement on Evergreen deal.
* Closing Risk Agent updated risk ratings for 908 Colonial Ave after escrow shifted by attorney email.
* Integration Health Agent flagged a transient webhook failure. Sync connections are stable.

Sarah Jenkins (COO) recommended tasks:
1. Verify signature match threshold (78%) for Randy Agent document addendum.
2. Coordinate photography delivery check for 104 Maple Ave launch.`
          );
          setIsGeneratingBriefing(false);
        }, 1000);

        const newRun: AgentRun = {
          runId: `run_coo_${Date.now()}`,
          agentId: 'agent_coo',
          status: 'completed',
          trigger: 'Scheduled Mission (Daily Operations Briefing)',
          startedAt: timestamp,
          completedAt: timestamp,
          recordsScanned: 24,
          findings: ['Calculated daily operational briefs across 10 specialists.'],
          recommendations: ['Compile morning brief.', 'Refresh operations panel.'],
          actionsPrepared: 0,
          actionsExecuted: 1,
          approvalsRequired: 0,
          evidence: 'Consolidated report from 10 active specialist event logs.',
          auditEventsCreated: []
        };
        setAgentRuns(prev => [newRun, ...prev]);

        const newEvent: AgentEvent = {
          id: `evt_sim_${Date.now()}`,
          timestamp,
          trigger: 'Scheduled morning sweep',
          agentId: 'agent_coo',
          recordsInspected: ['Global database logs'],
          findings: ['Morning brief refreshed.'],
          recommendedAction: 'Present daily briefing feed to Sarah COO.',
          approvalStatus: 'auto-safe',
          rollbackAvailable: false
        };
        setAgentEvents(prev => [newEvent, ...prev]);

        setAiAgents(prev => prev.map(a => {
          if (a.id === 'agent_coo') {
            return {
              ...a,
              status: 'monitoring',
              actions_completed_today: a.actions_completed_today + 1,
              last_run: 'Just now'
            };
          }
          return a;
        }));
        break;
      }

      default:
        break;
    }
  };

  const getContextItem = () => {
    if (selectedTransactionId) {
      return { item: (transactions || []).find(t => t?.id === selectedTransactionId), type: 'transaction' as const };
    }
    if (selectedListingId) {
      return { item: (listings || []).find(l => l?.id === selectedListingId), type: 'listing' as const };
    }
    if (selectedWorkItemId) {
      const decision = (decisions || []).find(d => d?.id === selectedWorkItemId);
      if (decision) return { item: decision, type: 'work_item' as const };
      const comm = (communications || []).find(c => c?.id === selectedWorkItemId);
      if (comm) return { item: comm, type: 'work_item' as const };
      const prop = (actionProposals || []).find(p => p?.id === selectedWorkItemId);
      if (prop) return { item: prop, type: 'work_item' as const };
    }
    if (selectedIntegrationId) {
      return { item: (integrations || []).find(i => i?.id === selectedIntegrationId), type: 'integration' as const };
    }
    if (selectedAgentId) {
      return { item: (aiAgents || []).find(a => a?.id === selectedAgentId), type: 'agent' as const };
    }
    return null;
  };

  useEffect(() => {
    const isRestricted = activeProfile?.email === 'ryan@nestrealty.com';
    if (isRestricted) {
      const allowedTabs = [
        "Pitch & 'Aha!' Demo", 'Pitch Demo',
        'Pre-MLS Board', 'Pocket Matches',
        'Vendor Dispatch', 'Repair Board',
        'Ask Nest Ops', 'Workboard', 'Nest Ops Hub', 'Today', 'Command Center', 'Today in the Brokerage', 'Overview',
        'My Connections',
        'Work Queue', 'Work',
        'Approvals', 'Agent Approval Portal', 'Approval Portal',
        'Physical Assets',
        'Camera Signals',
        'Knowledge Base', 'Knowledge / SOPs', 'Knowledge', 'SOP Studio', 'SOP Library', 'Staff SOP Templates', 'SOPs', 'SOP Runs',
        'Marketing', 'Marketing Requests', 'Marketing Intake', 'Marketing Intake (Melissa)', 'Creative Asset Sandbox', 'Creative Asset Sandbox (Templates)', 'Automated Collateral Studio', 'Automated Collateral Studio (Templates)', 'Collateral Studio', 'Sandbox', 'Inbound Call Log',
        'Integrations',
        'Settings', 'Workspace Settings',
        'Ryan Shield',
        'Role Map', 'Role & Escalation Map',
        'Directory',
        'Transactions', 'Deals', 'Listings',
        'Compliance',
        'People', 'People & Ownership',
        'Growth Engine', 'Growth',
        'Opportunities',
        'Workflows',
        'Office', 'Office & Signage',
        'Owner Brief', 'Owner Briefing',
        'Audit',
        'Operating Record',
        'Control Center', 'Content & Intelligence', 'Workspace Management', 'System Diagnostics', 'Security, Audit & Logs'
      ];
      if (currentTab && !allowedTabs.includes(currentTab)) {
        setCurrentTab('Workboard');
      }
    }
  }, [activeProfile, currentTab, setCurrentTab]);

  return {
    appMode, setAppMode,
    workspaceId, setWorkspaceId,
    currentTab, setCurrentTab,
    workItems, setWorkItems,
    entryPoints, setEntryPoints,
    signInventory, setSignInventory,
    officeSupplies, setOfficeSupplies,
    facilitiesIssues, setFacilitiesIssues,
    sidebarCollapsed, setSidebarCollapsed,
    operatorMinimized, setOperatorMinimized,
    demoMode, setDemoMode,
    evidenceDrawerOpen, setEvidenceDrawerOpen,
    activeEvidenceProposal, setActiveEvidenceProposal,
    searchQuery, setSearchQuery,
    profiles, activeProfile, handleRoleSwitch,
    agents, setAgents,
    transactions, setTransactions,
    listings, setListings,
    communications, setCommunications,
    actionProposals, setActionProposals,
    auditEvents, setAuditEvents,
    integrations, setIntegrations,
    googleConnections, setGoogleConnections,
    microsoftConnections, setMicrosoftConnections,
    capacityMetrics, setCapacityMetrics,
    decisions, setDecisions,
    roiStats, setRoiStats,
    chatHistory, setChatHistory,
    emailAccounts, setEmailAccounts,
    emailMessages, setEmailMessages,
    automationRules, setAutomationRules,
    automationPolicy, setAutomationPolicy,
    commandPlans, setCommandPlans,
    isSyncing, setIsSyncing,
    isLoading, setIsLoading,
    dailyBriefing, setDailyBriefing,
    isGeneratingBriefing, setIsGeneratingBriefing,
    isGeneratingChat, setIsGeneratingChat,
    chatInput, setChatInput,
    selectedTransactionId, setSelectedTransactionId,
    selectedListingId, setSelectedListingId,
    selectedInboxId, setSelectedInboxId,
    selectedAgentId, setSelectedAgentId,
    selectedIntegrationId, setSelectedIntegrationId,
    selectedWorkItemId, setSelectedWorkItemId,
    riskTableFilter, setRiskTableFilter,
    aiAgents, setAiAgents,
    agentRuns, setAgentRuns,
    agentEvents, setAgentEvents,
    governancePolicy, setGovernancePolicy,
    handleUpdatePolicy,
    handleTriggerDemoEvent,
    handleTriggerSimulation,
    handleTriggerRunAgent,
    handleToggleEmailConnection,
    handleSyncEmailAccount,
    handleProcessEmailMessage,
    handleSaveAutomationRules,
    handleExecuteCommandPlan,
    handleCancelCommandPlan,
    handleApproveAction,
    handleDismissAction,
    handleSendChatMessage,
    handleTriggerReassignment,
    handleRollbackAuditAction,
    handleViewEvidence,
    handleToggleConnection,
    handleTestConnection,
    handleGlobalSearchSubmit,
    getContextItem,
    loadBriefing,
    fetchState,
    attentionStates,
    setAttentionStates,
    ownerShieldDecisions,
    setOwnerShieldDecisions,
    headlessActions,
    setHeadlessActions,
    integrationEvents,
    setIntegrationEvents,
    signals,
    setSignals,
    decisionsState,
    setDecisionsState,
    shapeworkJobs,
    setShapeworkJobs,
    shapeworkJobSteps,
    setShapeworkJobSteps,
    approvals,
    setApprovals,
    actions,
    setActions,
    deliveries,
    setDeliveries,
    outcomes,
    setOutcomes,
    receipts,
    setReceipts,
    ownerBriefItems,
    setOwnerBriefItems,
    directoryPeople,
    setDirectoryPeople
  };
}
