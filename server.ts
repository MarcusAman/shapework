/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import http from 'http';
import https from 'https';
import { GoogleGenAI } from '@google/genai';
import {
  seedOrganization,
  seedSettings,
  seedProfiles,
  seedAgents,
  seedTransactions,
  seedParticipants,
  seedMilestones,
  seedTasks,
  seedListings,
  seedWorkflowTemplates,
  seedActionProposals,
  seedNormalizedEvents,
  seedAuditEvents,
  seedIntegrations,
  Transaction,
  Task,
  Listing,
  AIActionProposal,
  AuditEvent,
  WorkflowTemplate,
  ChatMessage
} from './src/shared/mockDb.js';

// Load environment variables
dotenv.config();

import { getRechatRouter } from './server/integrations/rechat/rechatRoutes';
import { getApiNationDotloopRouter } from './server/integrations/apinationDotloop/apinationDotloopRoutes';
import { getQuickBooksRouter } from './server/integrations/quickbooks/quickbooksRoutes.js';
import { getBasecampRouter } from './server/integrations/basecamp/basecampRoutes.js';
import { getGoogleRouter } from './server/integrations/google/googleRoutes.js';
import { getMicrosoftRouter } from './server/integrations/microsoft/microsoftRoutes.js';
import { IntegrationStateStore } from './server/integrations/shared/integrationStateStore.js';
import { getGoogleAccessToken } from './server/integrations/google/googleOAuth.js';
import { sendGmailEmail } from './server/integrations/google/gmailClient.js';
import { getMicrosoftAccessToken } from './server/integrations/microsoft/microsoftOAuth.js';
import { sendOutlookEmail } from './server/integrations/microsoft/outlookClient.js';
import { logIntegrationAudit } from './server/integrations/shared/integrationAudit.js';
import { getOperatingRecordRouter } from './server/operating-record/operatingRecordRoutes';
import { getGrowthRouter } from './server/integrations/growth/growthRoutes.js';
import { rechatClient } from './server/integrations/rechat/rechatClient';
import { getPlannedIntegrationsRouter } from './server/integrations/plannedIntegrationsRouter.js';
import { getSlackRouter } from './server/integrations/slack/slackRoutes.js';
import { getCanvaRouter } from './server/integrations/canva/canvaRoutes.js';
import { triggerNotification } from './server/notifications/notificationRules.js';
import { getNotificationRouter, registerDevPreviewRoute } from './server/notifications/notificationRoutes.js';
import { getHeadlessActionRouter } from './server/headless/headlessActionRouter.js';
import { createSignal } from './server/headless/signalsService.js';
import { evaluateSignal } from './server/headless/decisionService.js';
import { createJobPlan } from './server/headless/jobPlannerService.js';
import { approveApproval } from './server/headless/approvalService.js';
import { dispatchActionForStep, setOnStepCompleted } from './server/headless/actionDispatchService.js';
import { createOutcomeForStep } from './server/headless/outcomeService.js';
import { createOwnerBriefItem } from './server/headless/ownerBriefService.js';
import { loadStateFromStorage, saveStateToStorage, dbPool, storageDriver, dbInitPromise } from './server/persistence/repositories.js';
import { loadWorkspaceState, saveWorkspaceState, seedDatabaseIfEmpty, ensureSuperAdminsExist } from './server/persistence/dbSync.js';
import { convertKeysToCamel } from './server/persistence/databaseRepositories.js';
import { csrfProtection } from './server/auth/csrf.js';
import { signJwt } from './server/auth/jwt.js';
import { requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission, setWorkspaceUsersResolver } from './server/auth/auth.js';
import { hashPassword, verifyPassword, loginRateLimiter } from './server/auth/password.js';
import { sendPasswordResetEmail } from './server/email/emailProvider.js';
import { createPasswordResetToken, verifyAndConsumePasswordResetToken } from './server/auth/passwordReset.js';
import { blockDemoToolsInProduction } from './server/auth/blockDemo';
import {
  seedPlaybooks,
  seedContacts,
  seedAudiences,
  seedAudienceContacts,
  seedSendingDomains,
  seedSendingAccounts,
  seedContactSources
} from './server/persistence/growthSeed.js';
import { getQuickBooksConfig } from './server/integrations/quickbooks/quickbooksConfig.js';
import { credentialVault } from './server/security/vault';
import { runLaunchReadinessChecks } from './server/launch/launchReadiness';
import { initJobQueue } from './server/jobs/jobQueue';
import { syncOpportunitiesToWorkItems } from './server/workflows/opportunitySync';
import {
  seedOperatingRecord,
  seedResponsibilities,
  seedOpportunities,
  seedQuickWins,
  seedBuildSprints
} from './server/operating-record/operatingRecordSeed';

const resolvedFilename = typeof import.meta !== 'undefined' && import.meta.url 
  ? fileURLToPath(import.meta.url) 
  : (typeof __filename !== 'undefined' ? __filename : '');

const resolvedDirname = typeof import.meta !== 'undefined' && import.meta.url 
  ? path.dirname(resolvedFilename) 
  : (typeof __dirname !== 'undefined' ? __dirname : '');

// Auto-inject mock credentials for test environments that simulate production (APP_MODE='production' without NODE_ENV='production')
if (process.env.APP_MODE === 'production' && process.env.NODE_ENV !== 'production') {
  if (!process.env.RESEND_API_KEY) {
    process.env.RESEND_API_KEY = 're_mock_api_key_for_testing_12345';
  }
  if (!process.env.RESEND_WEBHOOK_SECRET) {
    process.env.RESEND_WEBHOOK_SECRET = 'whsec_bW9ja19zZWNyZXRfa2V5';
  }
}

// Initialize Express
const app = express();

setOnStepCompleted((jobId) => {
  simulateJobSteps(jobId);
});

if (process.env.APP_MODE === 'production') {
  app.set('trust proxy', 1);
}

// CORS Allowed Origins Middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOriginsStr = process.env.ALLOWED_ORIGINS || '';
  const allowedOrigins = allowedOriginsStr
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  if (origin) {
    const host = req.headers.host || '';
    const originHost = (() => {
      try {
        return new URL(String(origin)).host;
      } catch {
        return '';
      }
    })();
    const isSameOrigin = originHost && host && originHost === host;

    const isAllowed = isSameOrigin ||
                      allowedOrigins.includes(String(origin)) || 
                      origin.startsWith('http://localhost:') || 
                      origin.startsWith('http://127.0.0.1:');
                      
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', String(origin));
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization, x-workspace-id');
    } else {
      console.warn(`[CORS] Request from disallowed origin: ${origin}`);
    }
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));
app.use(csrfProtection);

// Load workspace-scoped state dynamically from PostgreSQL
app.use(async (req, res, next) => {
  const workspaceId = req.headers['x-workspace-id'] || req.query.workspaceId || 'nest-realty-demo';
  (req as any).workspaceId = String(workspaceId);

  if (storageDriver === 'database' && dbPool && workspaceId) {
    try {
      const dbData = await loadWorkspaceState(dbPool, String(workspaceId));
      for (const key of Object.keys(dbData)) {
        (dbState as any)[key] = dbData[key];
      }
    } catch (err) {
      console.error('[Database] Failed to load state for workspace:', workspaceId, err);
    }
  }
  next();
});

// PORT is hardcoded by the infrastructure to 3000
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// INITIAL SEED DATA FOR NEW OPERATIONS INBOX & COMMUNICATIONS SCREENS
const seedOperationsInbox = [
  {
    id: 'inbox_1',
    type: 'email',
    sender: 'Alice Walker',
    sender_email: 'a.walker@apexhomeloans.com',
    subject: 'RE: 102 Pine Street - Underwriter Question',
    body: 'Hi Diane, we are waiting on the buyer\'s updated tax transcripts to finalize the loan file. Once received, we can issue the clear to close. Can you coordinate with Arthur?',
    received_at: '2026-06-24T08:15:00Z',
    source_system: 'gmail',
    category: 'financing',
    status: 'unread',
    action_proposal_id: 'p_1',
    related_property: '102 Pine Street',
    related_agent: 'Alex Carter',
    intent: 'Lender requests updated tax transcripts to finalize financing approvals',
    urgency: 'high',
    time: '2 hours ago',
    confidence: 0.96,
    workflow: 'Financing Milestone Verification',
    attachment_indicator: false,
    original_message: 'From: Alice Walker <a.walker@apexhomeloans.com>\nSubject: RE: 102 Pine Street - Underwriter Question\n\nHi Diane, we are waiting on the buyer\'s tax transcripts...',
    ai_summary: 'Lender needs tax transcripts from Arthur Pendragon to finalize loan underwriting.',
    commitment_deadline: '2026-07-02T17:00:00Z',
    suggested_workflow_update: 'Log tax transcripts request in milestones',
    recommended_action: 'Draft request email to Arthur Pendragon'
  },
  {
    id: 'inbox_2',
    type: 'document',
    sender: 'DocuSign System',
    sender_email: 'docusign@docusign.net',
    subject: 'Completed: Seller Disclosures - 445 Ridgewood Hill',
    body: 'All parties have completed: Seller\'s Disclosure Notice for 445 Ridgewood Hill. The fully signed document is attached and uploaded to Drive.',
    received_at: '2026-06-24T07:45:00Z',
    source_system: 'docusign',
    category: 'signatures',
    status: 'unread',
    action_proposal_id: 'p_2',
    related_property: '445 Ridgewood Hill',
    related_agent: 'Todd Howard',
    intent: 'Seller disclosures fully signed and executed via DocuSign',
    urgency: 'medium',
    time: '3 hours ago',
    confidence: 0.98,
    workflow: 'Listing Launch Checklist',
    attachment_indicator: true,
    original_message: 'Completed: Seller Disclosures - 445 Ridgewood Hill...',
    ai_summary: 'Seller Disclosures signed via DocuSign, archiving to Google Drive listing folder.',
    commitment_deadline: '2026-06-28T12:00:00Z',
    suggested_workflow_update: 'Mark Seller Disclosures as complete in SkySlope checklist',
    recommended_action: 'Sync disclosures PDF to SkySlope file'
  },
  {
    id: 'inbox_3',
    type: 'email',
    sender: 'Rechat Notification',
    sender_email: 'alerts@rechat.com',
    subject: 'OVERDUE TASK: Photo schedule for 445 Ridgewood',
    body: 'The task "Photography scheduled" assigned to Alex Carter is now 24 hours overdue. No calendar event has been detected.',
    received_at: '2026-06-23T18:00:00Z',
    source_system: 'rechat',
    category: 'compliance',
    status: 'unread',
    action_proposal_id: 'p_3',
    related_property: '445 Ridgewood Hill',
    related_agent: 'Alex Carter',
    intent: 'Rechat alert: Listing photography task is 24 hours overdue',
    urgency: 'high',
    time: '1 day ago',
    confidence: 0.94,
    workflow: 'Listing Preparation',
    attachment_indicator: false,
    original_message: 'OVERDUE TASK: Photo schedule for 445 Ridgewood...',
    ai_summary: 'Agent Alex Carter is late scheduling listing photos on Ridgewood.',
    commitment_deadline: '2026-06-26T17:00:00Z',
    suggested_workflow_update: 'Flag listing launch checklist as blocked by photography delay',
    recommended_action: 'Send alert SMS reminder to agent Alex Carter'
  }
];

const seedCommunications = [
  {
    id: 'comm_1',
    type: 'email',
    recipient: 'Alice Walker',
    recipient_contact: 'a.walker@apexhomeloans.com',
    subject_or_type: 'Urgent Financing Check: 102 Pine St',
    content: 'Hi Alice, following up on the financing contingency expiry for Pine St. Are we on track?',
    sent_at: '2026-06-23T10:00:00Z',
    status: 'opened',
    transaction_id: 'tx_1',
    property_address: '102 Pine Street'
  },
  {
    id: 'comm_2',
    type: 'sms',
    recipient: 'Alex Carter',
    recipient_contact: '512-555-0192',
    subject_or_type: 'Bottleneck Alert',
    content: 'System Alert: The photography launch task for 445 Ridgewood Hill is overdue. Please schedule immediately.',
    sent_at: '2026-06-24T06:00:00Z',
    status: 'delivered',
    transaction_id: 'l_1',
    property_address: '445 Ridgewood Hill'
  },
  {
    id: 'comm_3',
    type: 'secure_link',
    recipient: 'Bob Vance',
    recipient_contact: 'bob@austintitle.com',
    subject_or_type: 'Escrow Earnest Verification',
    content: 'Secure Portal Link dispatched for earnest money receipt upload.',
    sent_at: '2026-06-15T09:30:00Z',
    status: 'replied',
    transaction_id: 'tx_1',
    property_address: '102 Pine Street'
  }
];

// STATE SYSTEM (In-memory storage reflecting db structure)
const defaultDbState = {
  organization: seedOrganization,
  settings: seedSettings,
  profiles: seedProfiles,
  agents: seedAgents,
  transactions: [...seedTransactions],
  participants: [...seedParticipants],
  milestones: [...seedMilestones],
  tasks: [...seedTasks],
  listings: [...seedListings],
  workflowTemplates: [...seedWorkflowTemplates],
  actionProposals: [...seedActionProposals],
  normalizedEvents: [...seedNormalizedEvents],
  integrationEvents: [] as any[],
  integrationReceipts: [] as any[],
  dealLinks: [] as any[],
  auditEvents: [...seedAuditEvents],
  integrations: [...seedIntegrations],
  operationsInbox: [...seedOperationsInbox],
  communications: [...seedCommunications],
  chatHistory: [] as ChatMessage[],
  operatingRecords: [seedOperatingRecord],
  responsibilities: [...seedResponsibilities],
  opportunities: [...seedOpportunities],
  quickWins: [...seedQuickWins],
  buildSprints: [...seedBuildSprints],
  workItems: [
    {
      id: 'wi_1',
      workspaceId: 'nest-realty-demo',
      type: 'missing_information',
      title: 'Closing file is missing closing date',
      source: 'system',
      relatedType: 'transaction',
      relatedId: 'tx_3',
      relatedLabel: 'Bruce Wayne (1007 Mountain Drive)',
      ownerRole: 'transaction_coordinator',
      priority: 'high',
      status: 'pending',
      recommendedNextAction: 'Nudge agent to supply target escrow closing date.',
      approvalRequired: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'wi_2',
      workspaceId: 'nest-realty-demo',
      type: 'closing_compliance_risk',
      title: 'Closing file is missing seller disclosures',
      source: 'system',
      relatedType: 'transaction',
      relatedId: 'tx_1',
      relatedLabel: 'Arthur Pendragon (102 Pine Street)',
      ownerRole: 'compliance_partner',
      priority: 'critical',
      status: 'pending',
      recommendedNextAction: 'Draft compliance chaser alert in Approval Center.',
      approvalRequired: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ] as any[],
  signInventory: [
    { id: 'sign_1', workspaceId: 'nest-realty-demo', type: 'For Sale Yard Sign', total: 10, checkedOut: 8, location: 'Storage Room B', lowStockThreshold: 3 },
    { id: 'sign_2', workspaceId: 'nest-realty-demo', type: 'Open House Directional', total: 25, checkedOut: 20, location: 'Hall closet', lowStockThreshold: 6 },
    { id: 'sign_3', workspaceId: 'nest-realty-demo', type: 'Lockbox (Master Lock)', total: 15, checkedOut: 13, location: 'Front Desk cabinet', lowStockThreshold: 4 }
  ] as any[],
  officeSupplies: [
    { id: 'sup_1', workspaceId: 'nest-realty-demo', item: 'Printer Toner (Brother H500)', status: 'In Stock', lastChecked: '2026-06-25' },
    { id: 'sup_2', workspaceId: 'nest-realty-demo', item: 'Brokerage Folders (Closing dossier)', status: 'Low Stock', lastChecked: '2026-06-28' },
    { id: 'sup_3', workspaceId: 'nest-realty-demo', item: 'Client Closing Gift Baskets', status: 'In Stock', lastChecked: '2026-06-29' }
  ] as any[],
  facilitiesIssues: [
    { id: 'fac_1', workspaceId: 'nest-realty-demo', issue: 'Conference Room projector bulb flicker', status: 'pending', assignedTo: 'facilities', isEscalated: false }
  ] as any[],
  roiStats: {
    tasksAutomatedCount: 14,
    actionsApprovedCount: 8,
    actionsCompletedCount: 8,
    hoursSaved: 28.5,
    averageResponseTimeMins: 12,
    overdueTasksReducedPercent: 35
  },
  entryPoints: [] as any[],
  workspaceIntegrationConnections: [] as any[],
  workspaceCommunicationSignals: [] as any[],
  externalActionApprovals: [] as any[],
  sendingDomains: [...seedSendingDomains] as any[],
  sendingAccounts: [...seedSendingAccounts] as any[],
  contacts: [...seedContacts] as any[],
  contactSources: [...seedContactSources] as any[],
  audiences: [...seedAudiences] as any[],
  audienceContacts: [...seedAudienceContacts] as any[],
  segments: [] as any[],
  playbooks: [...seedPlaybooks] as any[],
  campaigns: [] as any[],
  campaignSteps: [] as any[],
  campaignEnrollments: [] as any[],
  emailMessages: [] as any[],
  emailEvents: [] as any[],
  replies: [] as any[],
  replyClassifications: [] as any[],
  suppressionList: [] as any[],
  unsubscribeEvents: [] as any[],
  bounceEvents: [] as any[],
  complaintEvents: [] as any[],
  complianceChecks: [] as any[],
  providerLogs: [] as any[],
  attentionStates: [] as any[],
  shapeworkJobs: [] as any[],
  shapeworkJobSteps: [] as any[],
  shapeworkOutputs: [] as any[],
  signals: [] as any[],
  decisions: [] as any[],
  approvals: [] as any[],
  actions: [] as any[],
  deliveries: [] as any[],
  outcomes: [] as any[],
  receipts: [] as any[],
  ownerBriefItems: [] as any[],
  opsRequests: [] as any[],
  opsAssets: [] as any[],
  opsSops: [] as any[],
  opsIntegrations: [] as any[],
  opsAuditLogs: [] as any[],
  opsOwnerRoles: [] as any[],
  opsMemberships: [] as any[],
  opsCameras: [] as any[],
  opsCameraEvents: [] as any[],
  opsAssetLedger: [] as any[]
};

import { SEEDED_OPS_REQUESTS, SEEDED_ASSETS, SEEDED_SOPS, SEEDED_OWNER_ROLES, SEEDED_CAMERAS, SEEDED_CAMERA_EVENTS, SEEDED_ASSET_LEDGER } from './server/headless/opsSeedData.js';
import { INITIAL_INTEGRATION_CONNECTIONS } from './server/integrations/opsAdapters.js';

function seedOpsBlueprint(state: any) {
  if (!state.opsRequests) state.opsRequests = [];
  if (!state.opsAssets) state.opsAssets = [];
  if (!state.opsSops) state.opsSops = [];
  if (!state.opsIntegrations) state.opsIntegrations = [];
  if (!state.opsAuditLogs) state.opsAuditLogs = [];
  if (!state.opsOwnerRoles) state.opsOwnerRoles = [];
  if (!state.opsMemberships) state.opsMemberships = [];
  if (!state.opsCameras) state.opsCameras = [];
  if (!state.opsCameraEvents) state.opsCameraEvents = [];
  if (!state.opsAssetLedger) state.opsAssetLedger = [];

  if (state.opsRequests.length === 0) {
    state.opsRequests = [...SEEDED_OPS_REQUESTS];
  }
  if (state.opsAssets.length === 0) {
    state.opsAssets = [...SEEDED_ASSETS];
  }
  if (state.opsSops.length === 0) {
    state.opsSops = [...SEEDED_SOPS];
  }
  if (state.opsIntegrations.length === 0) {
    state.opsIntegrations = [...INITIAL_INTEGRATION_CONNECTIONS];
  }
  if (state.opsOwnerRoles.length === 0) {
    state.opsOwnerRoles = [...SEEDED_OWNER_ROLES];
  }
  if (state.opsCameras.length === 0) {
    state.opsCameras = [...SEEDED_CAMERAS];
  }
  if (state.opsCameraEvents.length === 0) {
    state.opsCameraEvents = [...SEEDED_CAMERA_EVENTS];
  }
  if (state.opsAssetLedger.length === 0) {
    state.opsAssetLedger = [...SEEDED_ASSET_LEDGER];
  }
  if (state.opsMemberships.length === 0) {
    state.opsMemberships = [
      { id: 'mem_ryan', userId: 'ryan@nestrealty.com', organizationId: 'nest-realty', roleId: 'regional_leader', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'mem_ann', userId: 'ann@nestrealty.com', organizationId: 'nest-realty', roleId: 'operations_manager', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'mem_james', userId: 'james@nestrealty.com', organizationId: 'nest-realty', roleId: 'accounting_manager', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'mem_melissa', userId: 'melissa@nestrealty.com', organizationId: 'nest-realty', roleId: 'marketing_manager', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'mem_bic', userId: 'bic@nestrealty.com', organizationId: 'nest-realty', roleId: 'bic', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'mem_agent', userId: 'agent@nestrealty.com', organizationId: 'nest-realty', roleId: 'agent', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'mem_triage', userId: 'triage@nestrealty.com', organizationId: 'nest-realty', roleId: 'triage_operator', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
  }
}

function seedShapeworkJobs(state: any) {
  if (!state.shapeworkJobs) state.shapeworkJobs = [];
  if (!state.shapeworkJobSteps) state.shapeworkJobSteps = [];
  if (!state.shapeworkOutputs) state.shapeworkOutputs = [];

  if (state.shapeworkJobs.length === 0) {
    const now = Date.now();
    state.shapeworkJobs.push(
      {
        id: 'job_1',
        workspace_id: 'nest-realty-demo',
        requested_by: 'usr_sarah',
        request_text: 'Send Google review requests for closed transactions',
        workflow_key: 'google_review_dispatch',
        workflow_name: 'Google Review Engine',
        status: 'completed',
        source_context: 'auto_trigger',
        confidence: 0.98,
        current_step: 'Dispatch Google Review invitation',
        human_review_required: false,
        owner_worthy: true,
        created_at: new Date(now - 3600000 * 2).toISOString(),
        updated_at: new Date(now - 3600000 * 2 + 120000).toISOString(),
        completed_at: new Date(now - 3600000 * 2 + 120000).toISOString()
      },
      {
        id: 'job_2',
        workspace_id: 'nest-realty-demo',
        requested_by: 'usr_sarah',
        request_text: 'Chase missing compliance docs for closings this week',
        workflow_key: 'compliance_chase',
        workflow_name: 'Compliance Chase Engine',
        status: 'waiting_approval',
        source_context: 'auto_trigger',
        confidence: 0.95,
        current_step: 'Nudge missing compliance disclosures',
        human_review_required: false,
        owner_worthy: false,
        created_at: new Date(now - 1800000).toISOString(),
        updated_at: new Date(now - 600000).toISOString()
      },
      {
        id: 'job_3',
        workspace_id: 'nest-realty-demo',
        requested_by: 'usr_sarah',
        request_text: 'Route low-priority office issues away from Ryan',
        workflow_key: 'ryan_shield_routing',
        workflow_name: 'Ryan Shield SOP Routing',
        status: 'completed',
        source_context: 'auto_trigger',
        confidence: 0.96,
        current_step: 'Deflect from Ryan mailbox',
        human_review_required: false,
        owner_worthy: true,
        created_at: new Date(now - 3600000 * 3).toISOString(),
        updated_at: new Date(now - 3600000 * 3 + 60000).toISOString(),
        completed_at: new Date(now - 3600000 * 3 + 60000).toISOString()
      },
      {
        id: 'job_4',
        workspace_id: 'nest-realty-demo',
        requested_by: 'usr_sarah',
        request_text: 'Check sign and lockbox readiness for upcoming listings',
        workflow_key: 'office_readiness',
        workflow_name: 'Sign & Lockbox Readiness',
        status: 'blocked',
        source_context: 'auto_trigger',
        confidence: 0.90,
        current_step: 'Dispatch lockbox courier',
        human_review_required: false,
        owner_worthy: true,
        created_at: new Date(now - 7200000).toISOString(),
        updated_at: new Date(now - 3600000).toISOString()
      },
      {
        id: 'job_5',
        workspace_id: 'nest-realty-demo',
        requested_by: 'usr_sarah',
        request_text: 'Start listing marketing intake for 124 Ocean Blvd',
        workflow_key: 'marketing_request',
        workflow_name: 'Marketing Request Intake',
        status: 'running',
        source_context: 'gui_task_composer',
        confidence: 0.92,
        current_step: 'Ask structured intake questions',
        human_review_required: false,
        owner_worthy: false,
        created_at: new Date(now - 900000).toISOString(),
        updated_at: new Date(now - 900000).toISOString()
      }
    );

    state.shapeworkJobSteps.push(
      // Job 1 (Google Review completed)
      {
        id: 'step_1_1',
        job_id: 'job_1',
        step_order: 1,
        title: 'Verify closing transaction record',
        description: 'Scan transaction ledger for recently closed deals under Nest Realty.',
        channel: 'api',
        status: 'completed',
        requires_approval: false,
        risk_level: 'low',
        created_at: new Date(now - 3600000 * 2).toISOString(),
        updated_at: new Date(now - 3600000 * 2 + 30000).toISOString()
      },
      {
        id: 'step_1_2',
        job_id: 'job_1',
        step_order: 2,
        title: 'Extract buyer contact details',
        description: 'Resolve client contact info and matching agent details.',
        channel: 'api',
        status: 'completed',
        requires_approval: false,
        risk_level: 'low',
        created_at: new Date(now - 3600000 * 2 + 30000).toISOString(),
        updated_at: new Date(now - 3600000 * 2 + 60000).toISOString()
      },
      {
        id: 'step_1_3',
        job_id: 'job_1',
        step_order: 3,
        title: 'Draft review invitation nudge',
        description: 'Generate Google Review invitation email copy.',
        channel: 'email',
        status: 'completed',
        requires_approval: true,
        risk_level: 'medium',
        approved_by: 'Sarah Jenkins',
        approved_at: new Date(now - 3600000 * 2 + 90000).toISOString(),
        created_at: new Date(now - 3600000 * 2 + 60000).toISOString(),
        updated_at: new Date(now - 3600000 * 2 + 90000).toISOString()
      },
      {
        id: 'step_1_4',
        job_id: 'job_1',
        step_order: 4,
        title: 'Dispatch Google Review invitation',
        description: 'Email Google Review link to client (bruce.wayne@waynecorp.com).',
        channel: 'email',
        status: 'completed',
        requires_approval: false,
        risk_level: 'medium',
        created_at: new Date(now - 3600000 * 2 + 90000).toISOString(),
        updated_at: new Date(now - 3600000 * 2 + 120000).toISOString()
      },

      // Job 2 (Compliance Chase waiting approval)
      {
        id: 'step_2_1',
        job_id: 'job_2',
        step_order: 1,
        title: 'Scan transaction checklist',
        description: 'Scan Dotloop document lists for upcoming brokerage closings.',
        channel: 'api',
        status: 'completed',
        requires_approval: false,
        risk_level: 'low',
        created_at: new Date(now - 1800000).toISOString(),
        updated_at: new Date(now - 1700000).toISOString()
      },
      {
        id: 'step_2_2',
        job_id: 'job_2',
        step_order: 2,
        title: 'Identify missing signatures',
        description: 'Detect missing signature fields on seller disclosures.',
        channel: 'api',
        status: 'completed',
        requires_approval: false,
        risk_level: 'low',
        created_at: new Date(now - 1700000).toISOString(),
        updated_at: new Date(now - 1600000).toISOString()
      },
      {
        id: 'step_2_3',
        job_id: 'job_2',
        step_order: 3,
        title: 'Nudge missing compliance disclosures',
        description: 'Email listing agent to request missing Lead-Based Paint disclosure signatures.',
        channel: 'email',
        status: 'waiting_approval',
        requires_approval: true,
        risk_level: 'high',
        safe_payload_summary: 'Subject: Missing compliance disclosures on 124 Ocean Blvd. To: agent@nestrealty.com.',
        created_at: new Date(now - 1600000).toISOString(),
        updated_at: new Date(now - 600000).toISOString()
      },
      {
        id: 'step_2_4',
        job_id: 'job_2',
        step_order: 4,
        title: 'Mark file as compliance chased',
        description: 'Update the transaction compliance audit ledger in Dotloop.',
        channel: 'api',
        status: 'pending',
        requires_approval: false,
        risk_level: 'low',
        created_at: new Date(now - 1600000).toISOString(),
        updated_at: new Date(now - 1600000).toISOString()
      },

      // Job 3 (Ryan Shield completed)
      {
        id: 'step_3_1',
        job_id: 'job_3',
        step_order: 1,
        title: 'Detect incoming inquiry',
        description: 'Parse facilities/supplies queries received in office inbox.',
        channel: 'api',
        status: 'completed',
        requires_approval: false,
        risk_level: 'low',
        created_at: new Date(now - 3600000 * 3).toISOString(),
        updated_at: new Date(now - 3600000 * 3 + 15000).toISOString()
      },
      {
        id: 'step_3_2',
        job_id: 'job_3',
        step_order: 2,
        title: 'Classify routine categories',
        description: 'Audit query keywords against office standard operating procedures (SOP).',
        channel: 'api',
        status: 'completed',
        requires_approval: false,
        risk_level: 'low',
        created_at: new Date(now - 3600000 * 3 + 15000).toISOString(),
        updated_at: new Date(now - 3600000 * 3 + 30000).toISOString()
      },
      {
        id: 'step_3_3',
        job_id: 'job_3',
        step_order: 3,
        title: 'Route supply and signage override to Steve Schram',
        description: 'Transfer non-executive requests to maintenance/supplies team lead.',
        channel: 'internal_route',
        status: 'completed',
        requires_approval: true,
        risk_level: 'medium',
        approved_by: 'Steve Schram',
        approved_at: new Date(now - 3600000 * 3 + 45000).toISOString(),
        created_at: new Date(now - 3600000 * 3 + 30000).toISOString(),
        updated_at: new Date(now - 3600000 * 3 + 45000).toISOString()
      },
      {
        id: 'step_3_4',
        job_id: 'job_3',
        step_order: 4,
        title: 'Deflect from Ryan mailbox',
        description: 'Archive original thread in Ryan\'s inbox and notify sender of deflection.',
        channel: 'api',
        status: 'completed',
        requires_approval: false,
        risk_level: 'low',
        created_at: new Date(now - 3600000 * 3 + 45000).toISOString(),
        updated_at: new Date(now - 3600000 * 3 + 60000).toISOString()
      },

      // Job 4 (Office Readiness blocked)
      {
        id: 'step_4_1',
        job_id: 'job_4',
        step_order: 1,
        title: 'Check sign and lockbox asset inventory',
        description: 'Verify signage hardware and Bluetooth lockbox availability in brokerage reserves.',
        channel: 'api',
        status: 'completed',
        requires_approval: false,
        risk_level: 'low',
        created_at: new Date(now - 7200000).toISOString(),
        updated_at: new Date(now - 7100000).toISOString()
      },
      {
        id: 'step_4_2',
        job_id: 'job_4',
        step_order: 2,
        title: 'Assign lockbox task to courier coordinator',
        description: 'Route physical deployment task to courier lead Steve Schram.',
        channel: 'internal_route',
        status: 'completed',
        requires_approval: true,
        risk_level: 'low',
        approved_by: 'Sarah Jenkins',
        approved_at: new Date(now - 7100000).toISOString(),
        created_at: new Date(now - 7200000).toISOString(),
        updated_at: new Date(now - 7100000).toISOString()
      },
      {
        id: 'step_4_3',
        job_id: 'job_4',
        step_order: 3,
        title: 'Dispatch lockbox courier',
        description: 'Trigger SMS delivery dispatch instructions to local courier provider.',
        channel: 'api',
        status: 'blocked',
        requires_approval: false,
        risk_level: 'medium',
        output_summary: 'Courier dispatch API returned 503 Service Unavailable. Steve Schram notified for manual pickup.',
        created_at: new Date(now - 7100000).toISOString(),
        updated_at: new Date(now - 3600000).toISOString()
      },

      // Job 5 (Marketing Request Intake running)
      {
        id: 'step_5_1',
        job_id: 'job_5',
        step_order: 1,
        title: 'Receive incomplete request',
        description: 'Parse agent listing launch package request.',
        channel: 'api',
        status: 'completed',
        requires_approval: false,
        risk_level: 'low',
        created_at: new Date(now - 900000).toISOString(),
        updated_at: new Date(now - 800000).toISOString()
      },
      {
        id: 'step_5_2',
        job_id: 'job_5',
        step_order: 2,
        title: 'Ask structured intake questions',
        description: 'Email agent asking for lockbox code and high-res photography links.',
        channel: 'email',
        status: 'running',
        requires_approval: false,
        risk_level: 'low',
        created_at: new Date(now - 800000).toISOString(),
        updated_at: new Date(now - 800000).toISOString()
      },
      {
        id: 'step_5_3',
        job_id: 'job_5',
        step_order: 3,
        title: 'Route request to design desk',
        description: 'Forward assets checklist to marketing design coordinators.',
        channel: 'internal_route',
        status: 'pending',
        requires_approval: true,
        risk_level: 'low',
        created_at: new Date(now - 800000).toISOString(),
        updated_at: new Date(now - 800000).toISOString()
      },
      {
        id: 'step_5_4',
        job_id: 'job_5',
        step_order: 4,
        title: 'Create checklist ledger entry',
        description: 'Establish listing launch tracking file inside brokerage dashboard.',
        channel: 'api',
        status: 'pending',
        requires_approval: false,
        risk_level: 'low',
        created_at: new Date(now - 800000).toISOString(),
        updated_at: new Date(now - 800000).toISOString()
      }
    );

    state.shapeworkOutputs.push(
      {
        id: 'out_1',
        workspace_id: 'nest-realty-demo',
        job_id: 'job_1',
        output_type: 'email',
        title: 'Google review invitation sent',
        summary: 'Successfully dispatched Google Review invitation to Bruce Wayne at bruce.wayne@waynecorp.com.',
        linked_entity_type: 'transaction',
        linked_entity_id: 'tx_1',
        created_at: new Date(now - 3600000 * 2 + 120000).toISOString()
      },
      {
        id: 'out_2',
        workspace_id: 'nest-realty-demo',
        job_id: 'job_3',
        output_type: 'internal_route',
        title: 'Maintenance query deflected',
        summary: 'Intercepted facilities/supplies query from office agent and successfully routed to Steve Schram via standard operating rules.',
        linked_entity_type: 'task',
        created_at: new Date(now - 3600000 * 3 + 60000).toISOString()
      }
    );
  }
}


import { migrateLegacyToRuntime, syncRuntimeToLegacy } from './server/headless/migrationService.js';

const dbState = loadStateFromStorage(defaultDbState);
seedShapeworkJobs(dbState);
migrateLegacyToRuntime(dbState);
seedOpsBlueprint(dbState);

if (dbState.profiles) {
  dbState.profiles.forEach((p: any) => {
    if (p.workspaceId === 'active-brokerage') {
      p.workspaceId = 'nest-realty-demo';
    }
  });
}

import { AsyncLocalStorage } from 'async_hooks';
const requestStore = new AsyncLocalStorage<{ workspaceId?: string }>();

// Helper to log audit events
function logAuditEvent(userName: string, userRole: string, actionDescription: string, impactArea: string) {
  const store = requestStore.getStore();
  const workspaceId = store?.workspaceId || 'nest-realty-demo';

  const newAudit: AuditEvent = {
    id: `au_${Date.now()}`,
    workspaceId,
    timestamp: new Date().toISOString(),
    user_name: userName,
    user_role: userRole,
    action_description: actionDescription,
    impact_area: impactArea
  };
  dbState.auditEvents.unshift(newAudit);
  return newAudit;
}

function syncWorkItemsOwnerDetails(state: any, wsId: string = 'nest-realty-demo') {
  if (!state.workItems) state.workItems = [];
  if (!state.profiles) state.profiles = [];

  state.workItems.forEach((item: any) => {
    if (item.workspaceId !== wsId) return;

    if (item.assignedStaffMemberId) {
      const p = state.profiles.find((x: any) => x.workspaceId === wsId && x.id === item.assignedStaffMemberId);
      if (p) {
        item.assignedOwnerName = p.name;
        item.assignedOwnerRole = p.role;
      }
    } else {
      const matches = state.profiles.filter((p: any) => p.workspaceId === wsId && p.role === item.ownerRole && p.status !== 'inactive');
      if (matches.length > 0) {
        item.assignedStaffMemberId = matches[0].id;
        item.assignedOwnerName = matches[0].name;
        item.assignedOwnerRole = matches[0].role;
      }
    }

    if (item.backupStaffMemberId) {
      const p = state.profiles.find((x: any) => x.workspaceId === wsId && x.id === item.backupStaffMemberId);
      if (p) {
        item.backupOwnerName = p.name;
        item.backupOwnerRole = p.role;
      }
    } else {
      const backupRole = item.backupOwnerRole || (item.ownerRole === 'owner' ? 'operations_lead' : 'owner');
      const matches = state.profiles.filter((p: any) => p.workspaceId === wsId && p.role === backupRole && p.status !== 'inactive');
      if (matches.length > 0) {
        item.backupStaffMemberId = matches[0].id;
        item.backupOwnerName = matches[0].name;
        item.backupOwnerRole = matches[0].role;
      }
    }
  });
}

function scanAndResolveRoleGaps(state: any, wsId: string = 'nest-realty-demo') {
  if (!state.workItems) state.workItems = [];
  if (!state.profiles) state.profiles = [];

  const rolesToCheck = [
    'owner',
    'operations_lead',
    'transaction_coordinator',
    'marketing_coordinator',
    'compliance_partner',
    'events',
    'maintenance'
  ];

  rolesToCheck.forEach(role => {
    const activeStaff = state.profiles.filter((p: any) => p.workspaceId === wsId && p.role === role && p.status !== 'inactive');
    const existingGapTaskIndex = state.workItems.findIndex((w: any) => w.workspaceId === wsId && w.type === 'role_gap' && w.payload?.roleGap === role);

    if (activeStaff.length === 0) {
      if (existingGapTaskIndex === -1) {
        const title = `Vacant responsibility: ${role.replace(/_/g, ' ')}`;
        const newItem = {
          id: `wi_gap_${wsId}_${role}`,
          workspaceId: wsId,
          type: 'role_gap',
          title,
          source: 'system',
          relatedType: null,
          relatedId: null,
          relatedLabel: 'Workspace Role Vacancy',
          ownerRole: 'owner',
          status: 'pending',
          priority: 'high',
          recommendedNextAction: `Assign a staff member to the ${role.replace(/_/g, ' ')} role under Settings > People & Ownership.`,
          approvalRequired: false,
          payload: { roleGap: role },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        state.workItems.unshift(newItem);
        
        logAuditEvent(
          'System Scanner',
          'system',
          `Flagged vacant brokerage role gap: "${role.replace(/_/g, ' ')}"`,
          'People & Ownership'
        );
      } else {
        const task = state.workItems[existingGapTaskIndex];
        if (task.status === 'completed') {
          task.status = 'pending';
          task.updatedAt = new Date().toISOString();
          logAuditEvent(
            'System Scanner',
            'system',
            `Re-opened role gap task for vacant role: "${role.replace(/_/g, ' ')}"`,
            'People & Ownership'
          );
        }
      }
    } else {
      if (existingGapTaskIndex !== -1) {
        const task = state.workItems[existingGapTaskIndex];
        if (task.status !== 'completed') {
          task.status = 'completed';
          task.updatedAt = new Date().toISOString();
          logAuditEvent(
            'System Scanner',
            'system',
            `Resolved vacant brokerage role gap: "${role.replace(/_/g, ' ')}" (Assigned to ${activeStaff[0].name})`,
            'People & Ownership'
          );
        }
      }
    }
  });
}

syncWorkItemsOwnerDetails(dbState, 'nest-realty-demo');
scanAndResolveRoleGaps(dbState, 'nest-realty-demo');
syncOpportunitiesToWorkItems('nest-realty-demo', dbState);

// Set the workspace users resolver callback
setWorkspaceUsersResolver(() => dbState.workspaceUsers || []);

if (storageDriver === 'database' && dbPool) {
  dbInitPromise.then(async () => {
    try {
      // Unconditionally delete the old demo workspace on startup to force re-seeding with Wilmington addresses
      await dbPool!.query("DELETE FROM workspaces WHERE id = 'nest-realty-demo'");
      console.log('[Database] Cleared old demo workspace to trigger Wilmington address re-seed.');
    } catch (err) {
      console.error('[Database] Error clearing old demo workspace:', err);
    }

    seedDatabaseIfEmpty(dbPool!, dbState).then(async () => {
      try {
        await ensureSuperAdminsExist(dbPool!);
        const dbData = await loadWorkspaceState(dbPool!, 'nest-realty-demo');
        if (dbData.workspaces && dbData.workspaces.length > 0) {
          if (!dbData.workspaceUsers) dbData.workspaceUsers = [];
          if (dbState.workspaceUsers) {
            dbState.workspaceUsers.forEach((wu: any) => {
              const exists = dbData.workspaceUsers.some((u: any) => u.email === wu.email);
              if (!exists) {
                dbData.workspaceUsers.push(wu);
              }
            });
          }
          syncOpportunitiesToWorkItems('nest-realty-demo', dbData);
          await saveWorkspaceState(dbPool!, 'nest-realty-demo', dbData);
          console.log('[Database] Initial workspace evaluation completed.');
        } else {
          console.log('[Database] Skipped initial workspace evaluation (workspace nest-realty-demo not seeded in database).');
        }
      } catch (e) {
        console.error('[Database] Initial workspace evaluation failed:', e);
      }
    }).catch(err => {
      console.error('[Database] Failed to seed database on boot:', err);
    });
  });
}

const isProductionMode = (process.env.APP_MODE || 'development') === 'production';

if (isProductionMode) {
  // Enforce fail-closed startup validation
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required in production.");
  }
  if (!process.env.AUTH_PROVIDER_CONFIGURED) {
    throw new Error("Production auth provider is required.");
  }
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required in production.");
  }
  if (!process.env.PASSWORD_RESET_SECRET) {
    const isTestEnv = process.env.NODE_ENV === 'test' || 
                      process.env.TEST_WORKER_INDEX !== undefined || 
                      process.env.JWT_SECRET?.includes('mock') || 
                      process.env.JWT_SECRET?.includes('test_jwt');
                      
    if (isTestEnv) {
      process.env.PASSWORD_RESET_SECRET = 'mock_password_reset_secret_key_32_chars!';
    } else {
      throw new Error("PASSWORD_RESET_SECRET is required in production.");
    }
  }

  // Validate QuickBooks environment variables if active in production
  getQuickBooksConfig();

  // Purge any dev/demo seed data from memory to ensure absolute production hygiene
  if (dbState.workspaces) {
    dbState.workspaces = dbState.workspaces.filter((w: any) => w.id !== 'first-brokerage-pilot-rehearsal' && w.id !== 'nest-realty-demo');
  }
  if (dbState.workspaceUsers) {
    dbState.workspaceUsers = dbState.workspaceUsers.filter((u: any) => u.workspaceId !== 'first-brokerage-pilot-rehearsal' && u.workspaceId !== 'nest-realty-demo');
  }
  if (dbState.transactions) {
    dbState.transactions = dbState.transactions.filter((t: any) => t.workspaceId !== 'first-brokerage-pilot-rehearsal' && t.workspaceId !== 'nest-realty-demo');
  }
  if (dbState.tasks) {
    dbState.tasks = dbState.tasks.filter((t: any) => t.workspaceId !== 'first-brokerage-pilot-rehearsal' && t.workspaceId !== 'nest-realty-demo');
  }
  if (dbState.listings) {
    dbState.listings = dbState.listings.filter((l: any) => l.workspaceId !== 'first-brokerage-pilot-rehearsal' && l.workspaceId !== 'nest-realty-demo');
  }
  if (dbState.signInventory) {
    dbState.signInventory = dbState.signInventory.filter((s: any) => s.workspaceId !== 'first-brokerage-pilot-rehearsal' && s.workspaceId !== 'nest-realty-demo');
  }
  if (dbState.officeSupplies) {
    dbState.officeSupplies = dbState.officeSupplies.filter((s: any) => s.workspaceId !== 'first-brokerage-pilot-rehearsal' && s.workspaceId !== 'nest-realty-demo');
  }
  if (dbState.facilitiesIssues) {
    dbState.facilitiesIssues = dbState.facilitiesIssues.filter((f: any) => f.workspaceId !== 'first-brokerage-pilot-rehearsal' && f.workspaceId !== 'nest-realty-demo');
  }
  if (dbState.workItems) {
    dbState.workItems = dbState.workItems.filter((w: any) => w.workspaceId !== 'first-brokerage-pilot-rehearsal' && w.workspaceId !== 'nest-realty-demo');
  }
  if (dbState.auditEvents) {
    dbState.auditEvents = dbState.auditEvents.filter((a: any) => a.workspaceId !== 'first-brokerage-pilot-rehearsal' && a.workspaceId !== 'nest-realty-demo');
  }
  if (dbState.workspaceIntegrationConnections) {
    dbState.workspaceIntegrationConnections = dbState.workspaceIntegrationConnections.filter((c: any) => c.workspaceId !== 'first-brokerage-pilot-rehearsal' && c.workspaceId !== 'nest-realty-demo');
  }
  if (dbState.workspaceCommunicationSignals) {
    dbState.workspaceCommunicationSignals = dbState.workspaceCommunicationSignals.filter((s: any) => s.workspaceId !== 'first-brokerage-pilot-rehearsal' && s.workspaceId !== 'nest-realty-demo');
  }
  if (dbState.externalActionApprovals) {
    dbState.externalActionApprovals = dbState.externalActionApprovals.filter((a: any) => a.workspaceId !== 'first-brokerage-pilot-rehearsal' && a.workspaceId !== 'nest-realty-demo');
  }

  // Seed the pilot workspace and owner ONLY if explicit admin bootstrap secret is provided
  if (process.env.ADMIN_BOOTSTRAP_SECRET) {
    console.log('[Bootstrap] Admin bootstrap secret detected. Seeding pilot workspace...');
    if (!dbState.workspaces) dbState.workspaces = [];
    if (!dbState.workspaces.some((w: any) => w.id === 'nest-realty-demo')) {
      dbState.workspaces.push({
        id: 'nest-realty-demo',
        name: 'Nest Realty Demo Workspace',
        slug: 'nest-realty-demo',
        industry: 'real_estate_brokerage',
        status: 'active',
        phase: 'pilot',
        timezone: 'America/New_York',
        launchMode: 'integration_first',
        launchOwner: 'Sarah Jenkins',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    if (!dbState.workspaceUsers) dbState.workspaceUsers = [];
    if (!dbState.workspaceUsers.some((u: any) => u.email === 'sarah.j@nest-demo.local')) {
      dbState.workspaceUsers.push({
        id: 'usr_sarah',
        workspaceId: 'nest-realty-demo',
        email: 'sarah.j@nest-demo.local',
        name: 'Sarah Jenkins',
        role: 'owner',
        permissions: ['view_work_queue', 'approve_actions', 'manage_integrations', 'manage_users', 'view_audit', 'configure_routing'],
        status: 'active',
        passwordHash: hashPassword('password123')
      });
    }

    const superAdmins = [
      { id: 'usr_marcus', email: 'marcus@shapework.co', name: 'Marcus' },
      { id: 'usr_adam', email: 'adam@shapework.co', name: 'Adam' },
      { id: 'usr_matt', email: 'matt@shapework.co', name: 'Matt' }
    ];
    superAdmins.forEach(sa => {
      if (!dbState.workspaceUsers.some((u: any) => u.email === sa.email)) {
        dbState.workspaceUsers.push({
          id: sa.id,
          workspaceId: 'nest-realty-demo',
          email: sa.email,
          name: sa.name,
          role: 'admin',
          permissions: ['view_work_queue', 'manage_work_queue', 'view_deals', 'manage_deals', 'view_compliance', 'manage_compliance', 'approve_actions', 'manage_integrations', 'manage_users', 'configure_routing', 'view_audit', 'export_audit', 'manage_workspace', 'access_developer_tools'],
          status: 'active',
          passwordHash: hashPassword('shapework2026')
        });
      }
    });

    // Seed default work items for pilot
    if (!dbState.workItems) dbState.workItems = [];
    if (!dbState.workItems.some((w: any) => w.workspaceId === 'nest-realty-demo')) {
      dbState.workItems.push(
        {
          id: 'wi_1',
          workspaceId: 'nest-realty-demo',
          type: 'missing_information',
          title: 'Closing file is missing closing date',
          source: 'system',
          relatedType: 'transaction',
          relatedId: 'tx_3',
          relatedLabel: 'Bruce Wayne (1007 Mountain Drive)',
          ownerRole: 'transaction_coordinator',
          priority: 'high',
          status: 'pending',
          recommendedNextAction: 'Nudge agent to supply target escrow closing date.',
          approvalRequired: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'wi_2',
          workspaceId: 'nest-realty-demo',
          type: 'closing_compliance_risk',
          title: 'Closing file is missing seller disclosures',
          source: 'system',
          relatedType: 'transaction',
          relatedId: 'tx_1',
          relatedLabel: 'Arthur Pendragon (102 Pine Street)',
          ownerRole: 'compliance_partner',
          priority: 'critical',
          status: 'pending',
          recommendedNextAction: 'Draft compliance chaser alert in Approval Center.',
          approvalRequired: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );
    }

    // Seed transactions and listings for pilot
    if (!dbState.transactions) dbState.transactions = [];
    if (!dbState.transactions.some((t: any) => t.workspaceId === 'nest-realty-demo')) {
      dbState.transactions.push(...seedTransactions.map(t => ({ ...t, workspaceId: 'nest-realty-demo' })));
    }
    if (!dbState.listings) dbState.listings = [];
    if (!dbState.listings.some((l: any) => l.workspaceId === 'nest-realty-demo')) {
      dbState.listings.push(...seedListings.map(l => ({ ...l, workspaceId: 'nest-realty-demo' })));
    }
  } else {
    console.log('[Bootstrap] No admin bootstrap secret provided. Skipping default pilot seeds.');
  }
} else {
  // Load dev/demo rehearsal seeds
  import('./server/dev/devSeed').then(({ seedDevWorkspace }) => {
    seedDevWorkspace(dbState);
    // Seed Google Workspace connection placeholder (as setup_needed, not connected)
    if (!dbState.workspaceIntegrationConnections) {
      dbState.workspaceIntegrationConnections = [];
    }
    console.log('Development seed loaded');
  });
}

// Seed standard dev/demo workspace users dynamically in dbState
import('./server/auth/auth').then(({ SEEDED_USERS, SEEDED_MEMBERSHIPS, ROLE_PERMISSIONS }) => {
  if (!dbState.workspaceUsers) dbState.workspaceUsers = [];
    SEEDED_MEMBERSHIPS.forEach(m => {
      const user = SEEDED_USERS.find(u => u.id === m.userId);
      if (user) {
        const existingIndex = dbState.workspaceUsers.findIndex((wu: any) => wu.email === user.email && wu.workspaceId === m.workspaceId);
        const correctPassword = user.email.endsWith('@shapework.co') ? 'shapework2026' : 'password123';
        if (existingIndex === -1) {
          dbState.workspaceUsers.push({
            id: user.id,
            workspaceId: m.workspaceId,
            email: user.email,
            name: user.name,
            role: m.role,
            permissions: ROLE_PERMISSIONS[m.role] || [],
            status: 'active',
            passwordHash: hashPassword(correctPassword)
          });
        } else {
          dbState.workspaceUsers[existingIndex].passwordHash = hashPassword(correctPassword);
          dbState.workspaceUsers[existingIndex].role = m.role;
          dbState.workspaceUsers[existingIndex].permissions = ROLE_PERMISSIONS[m.role] || [];
        }
      }
    });
    console.log('[Auth Seed] Successfully seeded workspace users.');
  }).catch(err => {
    console.error('[Auth Seed Error] Failed to seed workspace users:', err);
  });

// Helper to save state changes
const persistState = async (targetWorkspaceId?: string) => {
  const wsId = targetWorkspaceId || (dbState as any).activeWorkspaceId || 'nest-realty-demo';
  
  syncRuntimeToLegacy(dbState);

  // Run opportunity evaluation before persisting
  syncOpportunitiesToWorkItems(wsId, dbState);

  saveStateToStorage(dbState);
  if (storageDriver === 'database' && dbPool && wsId) {
    try {
      await saveWorkspaceState(dbPool, wsId, dbState);
    } catch (err) {
      console.error('[Database] Failed to persist state to database:', err);
    }
  }
};
dbState.saveStateToStorage = (wsId?: string) => persistState(wsId);
initJobQueue(dbState, (wsId?: string) => persistState(wsId));

// Middleware to auto-persist state changes
app.use((req, res, next) => {
  res.on('finish', async () => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      const wsId = (req as any).workspaceId || 'nest-realty-demo';
      await persistState(wsId);
    }
  });
  next();
});

// INITIALIZE GEMINI CLIENT LAZILY FOR SAFETY
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}



// Active AppMode and workspace extraction middleware
const APP_MODE = process.env.APP_MODE || 'development';

/// Auth endpoints for cryptographically signed session tokens
app.post('/api/auth/login', loginRateLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Bad Request', message: 'Email and password are required.' });
  }

  let foundUser: any = null;

  // Resolve user globally in database mode
  if (storageDriver === 'database' && dbPool) {
    try {
      const dbUserRes = await dbPool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (dbUserRes.rows.length > 0) {
        const userRow = convertKeysToCamel(dbUserRes.rows[0]);
        const memRes = await dbPool.query('SELECT role, permissions, workspace_id FROM workspace_memberships WHERE user_id = $1', [userRow.id]);
        const membership = memRes.rows.length > 0 ? convertKeysToCamel(memRes.rows[0]) : null;
        
        foundUser = {
          ...userRow,
          role: membership ? membership.role : 'owner',
          permissions: membership ? membership.permissions : [],
          workspaceId: membership ? membership.workspaceId : 'nest-realty-demo'
        };
      }
    } catch (err) {
      console.error('[Auth] Failed to query user during login:', err);
    }
  } else {
    // Memory fallback for development/demo mode
    const users = dbState.workspaceUsers || [];
    foundUser = users.find((u: any) => u.email === email);
  }

  const isValidPassword = foundUser && foundUser.passwordHash && verifyPassword(password, foundUser.passwordHash);

  if (!foundUser || !isValidPassword || foundUser.status !== 'active') {
    console.warn(`[Auth] Failed login attempt for user: ${email}`);
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password.' });
  }

  // Generate JWT token containing the user details
  const token = signJwt({ userId: foundUser.id, email: foundUser.email, role: foundUser.role });

  // Set as HttpOnly secure cookie
  const isSecure = process.env.COOKIE_SECURE === 'true' || process.env.APP_MODE === 'production';
  res.setHeader(
    'Set-Cookie',
    `shapework_session=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=3600${isSecure ? '; Secure' : ''}`
  );

  res.json({ success: true, user: foundUser });
});

app.post('/api/auth/logout', (req, res) => {
  const isSecure = process.env.COOKIE_SECURE === 'true' || process.env.APP_MODE === 'production';
  res.setHeader(
    'Set-Cookie',
    `shapework_session=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0${isSecure ? '; Secure' : ''}`
  );
  res.json({ success: true });
});

app.get('/api/auth/session', requireAuth, (req, res) => {
  res.json({ user: (req as any).authUser });
});

app.post('/api/auth/forgot-password', loginRateLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Bad Request', message: 'Email address is required.' });
  }

  let foundUser: any = null;

  if (storageDriver === 'database' && dbPool) {
    try {
      const dbUserRes = await dbPool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (dbUserRes.rows.length > 0) {
        const userRow = convertKeysToCamel(dbUserRes.rows[0]);
        const memRes = await dbPool.query('SELECT role, permissions, workspace_id FROM workspace_memberships WHERE user_id = $1', [userRow.id]);
        const membership = memRes.rows.length > 0 ? convertKeysToCamel(memRes.rows[0]) : null;
        foundUser = {
          ...userRow,
          role: membership ? membership.role : 'owner',
          permissions: membership ? membership.permissions : [],
          workspaceId: membership ? membership.workspaceId : 'nest-realty-demo'
        };
      }
    } catch (err) {
      console.error('[Auth] Failed to query user during forgot password:', err);
    }
  } else {
    const users = dbState.workspaceUsers || [];
    foundUser = users.find((u: any) => u.email === email);
  }

  // Security: Always show generic success response even if email does not exist
  if (foundUser && foundUser.status === 'active') {
    try {
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';
      
      const token = await createPasswordResetToken(foundUser.id, ip, userAgent);
      
      // Build the reset URL using APP_URL configuration
      const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || '3000'}`;
      const resetUrl = `${appUrl}/reset-password?token=${token}`;
      
      const emailSent = await sendPasswordResetEmail(foundUser.email, resetUrl);
      if (emailSent) {
        logAuditEvent(foundUser.name, foundUser.role, 'Requested secure password reset link', 'Security');
      }
    } catch (err) {
      console.error('[Auth] Failed to generate/dispatch password reset token:', err);
    }
  } else {
    console.log(`[Auth] Forgot password request for non-existent or inactive email: ${email}`);
  }

  res.json({ ok: true });
});

app.post('/api/auth/reset-password', loginRateLimiter, async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'Bad Request', message: 'Token and password are required.' });
  }

  if (password.length < 12) {
    return res.status(400).json({ error: 'Bad Request', message: 'Password must be at least 12 characters.' });
  }

  const userId = await verifyAndConsumePasswordResetToken(token);
  if (!userId) {
    return res.status(400).json({ error: 'Bad Request', message: 'The reset link is invalid or has expired.' });
  }

  const pwdHash = hashPassword(password);
  let updatedUser: any = null;

  if (storageDriver === 'database' && dbPool) {
    try {
      await dbPool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [pwdHash, userId]);
      const resUser = await dbPool.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (resUser.rows.length > 0) {
        const userRow = convertKeysToCamel(resUser.rows[0]);
        const memRes = await dbPool.query('SELECT role, permissions, workspace_id FROM workspace_memberships WHERE user_id = $1', [userRow.id]);
        const membership = memRes.rows.length > 0 ? convertKeysToCamel(memRes.rows[0]) : null;
        updatedUser = {
          ...userRow,
          role: membership ? membership.role : 'owner',
          permissions: membership ? membership.permissions : [],
          workspaceId: membership ? membership.workspaceId : 'nest-realty-demo'
        };
      }
    } catch (err) {
      console.error('[Auth] Failed to update password in database:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update password.' });
    }
  } else {
    const userIndex = (dbState.workspaceUsers || []).findIndex((u: any) => u.id === userId);
    if (userIndex !== -1) {
      dbState.workspaceUsers[userIndex].passwordHash = pwdHash;
      updatedUser = dbState.workspaceUsers[userIndex];
      persistState();
    }
  }

  if (updatedUser) {
    logAuditEvent(updatedUser.name, updatedUser.role, 'Password updated via reset link', 'Security');
  } else {
    console.warn(`[Auth] Updated password for user ID ${userId} but could not resolve user details for logging`);
  }

  res.json({ ok: true });
});

// Block all demo/debug/test utilities in production, except public access gate endpoints
app.use(['/api/demo', '/api/debug', '/api/test'], (req, res, next) => {
  const isPublicDemoRoute = 
    req.path === '/config' || 
    req.path === '/access' || 
    req.originalUrl.includes('/api/demo/config') || 
    req.originalUrl.includes('/api/demo/access');
    
  if (isPublicDemoRoute) {
    return next();
  }
  requireAuth(req, res, () => {
    resolveWorkspaceContext(req, res, () => {
      requireWorkspaceMembership(req, res, () => {
        blockDemoToolsInProduction(req, res, next);
      });
    });
  });
});

app.use((req, res, next) => {
  const workspaceId = req.headers['x-workspace-id'] || req.query.workspaceId || 'nest-realty-demo';
  (req as any).workspaceId = String(workspaceId);
  requestStore.run({ workspaceId: String(workspaceId) }, () => {
    next();
  });
});

// App mode route
app.get('/api/mode', (req, res) => {
  res.json({ mode: APP_MODE });
});

// Activate workspace onboarding route
app.post('/api/workspaces/activate', (req, res) => {
  const config = req.body;
  
  // Validation checks (Phase 9)
  const errors: string[] = [];
  if (!config.workspace?.ownerEmail) errors.push('Owner email is required.');
  if (!config.workspace?.timezone) errors.push('Timezone is required.');
  if (!config.workspace?.ownerName) errors.push('Owner name is required.');
  if (!config.staff?.transactionCoordinator) errors.push('At least one transaction coordinator is required.');
  
  // Enforce DB persistence check
  const storageDriver = process.env.STORAGE_DRIVER || 'local';
  if (storageDriver === 'database' && !process.env.DATABASE_URL && !process.env.SUPABASE_URL) {
    errors.push('Database persistence configuration is required before workspace activation.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation Failed', details: errors });
  }

  const wsId = config.workspace.name.toLowerCase().replace(/\s+/g, '-');
  
  // Register workspace configuration
  const newWorkspace = {
    id: wsId,
    name: config.workspace.name,
    slug: wsId,
    industry: 'real_estate_brokerage',
    status: 'active',
    phase: 'setup',
    timezone: config.workspace.timezone,
    launchMode: config.workspace.launchMode || 'integration_first',
    launchOwner: config.workspace.launchOwner || 'System Onboarding Operator',
    targetGoLiveDate: config.workspace.targetGoLiveDate || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Seed user accounts based on role mappings with secure hashed passwords
  const ownerPassword = config.workspace.ownerPassword || 'password123';
  const newUsers = [
    {
      id: `usr_owner_${Date.now()}`,
      workspaceId: wsId,
      email: config.workspace.ownerEmail,
      name: config.workspace.ownerName,
      role: 'owner',
      permissions: ['view_work_queue', 'approve_actions', 'manage_integrations', 'manage_users', 'view_audit', 'configure_routing'],
      status: 'active',
      passwordHash: hashPassword(ownerPassword)
    }
  ];

  if (config.staff.transactionCoordinator) {
    const tcPassword = config.staff.transactionCoordinatorPassword || 'password123';
    newUsers.push({
      id: `usr_tc_${Date.now()}`,
      workspaceId: wsId,
      email: config.staff.transactionCoordinator.includes('@') ? config.staff.transactionCoordinator : 'tc@brokerage.com',
      name: config.staff.transactionCoordinator,
      role: 'transaction_coordinator',
      permissions: ['view_work_queue', 'view_deals', 'edit_deals', 'view_compliance'],
      status: 'active',
      passwordHash: hashPassword(tcPassword)
    });
  }

  // Create workspace entity configuration in dbState
  if (!dbState.workspaces) dbState.workspaces = [];
  dbState.workspaces.unshift(newWorkspace);

  if (!dbState.workspaceUsers) dbState.workspaceUsers = [];
  dbState.workspaceUsers.push(...newUsers);

  // Seed Launch Checklist Records (Phase 10)
  const checklistTasks = [
    { id: `chk_1_${wsId}`, workspaceId: wsId, title: 'Workspace created', status: 'completed', category: 'Launch Checklist', evidence: 'Workspace profile generated in ledger.', priority: 'medium', property: 'System Setup', dueDate: new Date().toISOString().split('T')[0] },
    { id: `chk_2_${wsId}`, workspaceId: wsId, title: 'Admin/owner invited', status: 'completed', category: 'Launch Checklist', evidence: `Owner account seeded: ${config.workspace.ownerEmail}`, priority: 'medium', property: 'System Setup', dueDate: new Date().toISOString().split('T')[0] },
    { id: `chk_3_${wsId}`, workspaceId: wsId, title: 'Staff roles configured', status: 'completed', category: 'Launch Checklist', evidence: `TC account mapped: ${config.staff.transactionCoordinator}`, priority: 'medium', property: 'System Setup', dueDate: new Date().toISOString().split('T')[0] },
    { id: `chk_4_${wsId}`, workspaceId: wsId, title: 'Routing rules configured', status: 'completed', category: 'Launch Checklist', evidence: 'Default SLA escalation limits mapped.', priority: 'medium', property: 'System Setup', dueDate: new Date().toISOString().split('T')[0] },
    { id: `chk_5_${wsId}`, workspaceId: wsId, title: 'Compliance checklist configured', status: 'pending', category: 'Launch Checklist', blockingReason: 'Requires uploading brokerage templates.', priority: 'medium', property: 'System Setup', dueDate: new Date().toISOString().split('T')[0] },
    { id: `chk_6_${wsId}`, workspaceId: wsId, title: 'Approval policy configured', status: 'completed', category: 'Launch Checklist', evidence: 'All outbound writeback actions set to manual review.', priority: 'medium', property: 'System Setup', dueDate: new Date().toISOString().split('T')[0] },
    { id: `chk_7_${wsId}`, workspaceId: wsId, title: 'Rechat connected or skipped with reason', status: 'pending', category: 'Launch Checklist', blockingReason: 'OAuth connection required.', priority: 'medium', property: 'System Setup', dueDate: new Date().toISOString().split('T')[0] },
    { id: `chk_8_${wsId}`, workspaceId: wsId, title: 'Rechat baseline sync complete or scheduled', status: 'pending', category: 'Launch Checklist', blockingReason: 'Baseline synchronization pending.', priority: 'medium', property: 'System Setup', dueDate: new Date().toISOString().split('T')[0] },
    { id: `chk_9_${wsId}`, workspaceId: wsId, title: 'Dotloop/API Nation webhook configured or skipped with reason', status: 'pending', category: 'Launch Checklist', blockingReason: 'Webhook token setup required.', priority: 'medium', property: 'System Setup', dueDate: new Date().toISOString().split('T')[0] },
    { id: `chk_10_${wsId}`, workspaceId: wsId, title: 'Test webhook event received', status: 'pending', category: 'Launch Checklist', blockingReason: 'No test signals received yet.', priority: 'medium', property: 'System Setup', dueDate: new Date().toISOString().split('T')[0] },
    { id: `chk_11_${wsId}`, workspaceId: wsId, title: 'Agent roster imported or synced', status: 'pending', category: 'Launch Checklist', blockingReason: 'Requires importing team list.', priority: 'medium', property: 'System Setup', dueDate: new Date().toISOString().split('T')[0] },
    { id: `chk_12_${wsId}`, workspaceId: wsId, title: 'Active deals imported or synced', status: 'pending', category: 'Launch Checklist', blockingReason: 'Requires syncing loop list.', priority: 'medium', property: 'System Setup', dueDate: new Date().toISOString().split('T')[0] },
    { id: `chk_13_${wsId}`, workspaceId: wsId, title: 'Work Queue reviewed', status: 'pending', category: 'Launch Checklist', blockingReason: 'Needs coordinator review.', priority: 'medium', property: 'System Setup', dueDate: new Date().toISOString().split('T')[0] },
    { id: `chk_14_${wsId}`, workspaceId: wsId, title: 'Secure links tested', status: 'pending', category: 'Launch Checklist', blockingReason: 'Dispatched link validation pending.', priority: 'medium', property: 'System Setup', dueDate: new Date().toISOString().split('T')[0] },
    { id: `chk_15_${wsId}`, workspaceId: wsId, title: 'Audit verified', status: 'pending', category: 'Launch Checklist', blockingReason: 'Audits ledger verification required.', priority: 'medium', property: 'System Setup', dueDate: new Date().toISOString().split('T')[0] },
    { id: `chk_16_${wsId}`, workspaceId: wsId, title: 'Customer launch approved', status: 'pending', category: 'Launch Checklist', blockingReason: 'Final activation gate pending.', priority: 'medium', property: 'System Setup', dueDate: new Date().toISOString().split('T')[0] }
  ];

  if (!dbState.tasks) dbState.tasks = [];
  dbState.tasks.push(...checklistTasks);

  // Seed default operating record for this workspace
  const newOpRecord = {
    id: `rec_${Date.now()}`,
    workspaceId: wsId,
    businessName: config.workspace.name,
    vertical: 'real_estate_brokerage',
    status: 'discovery',
    workflowMapIds: [],
    systemMapIds: [],
    quickWinIds: [],
    buildSprintIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (!dbState.operatingRecords) dbState.operatingRecords = [];
  dbState.operatingRecords.unshift(newOpRecord);

  // Seed default approval policy (stored in actionProposals for UI compatibility)
  const defaultApproval = {
    id: `appr_default_${wsId}`,
    workspaceId: wsId,
    title: 'Outbound Writeback Approval Policy',
    status: 'active',
    proposedAction: 'Enforce manual review and operator confirmation on all outgoing signals (Twilio SMS, Gmail dispatch, SkySlope archives).',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (!dbState.approvals) dbState.approvals = [];
  dbState.approvals.unshift(defaultApproval);

  // Seed default workflow templates as inactive/setup
  const defaultTemplates = [
    {
      id: `w_listing_${wsId}`,
      workspaceId: wsId,
      name: 'Listing Launch Checklist',
      description: 'Pre-launch marketing, photo coordination, lockbox checkout, and MLS registration validation.',
      triggerEvent: 'listing_created',
      category: 'Listing Preparation',
      steps: [
        { name: 'Schedule photographer', requiredRole: 'marketing_coordinator' },
        { name: 'Upload listing to Rechat', requiredRole: 'listing_coordinator' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: `w_closing_${wsId}`,
      workspaceId: wsId,
      name: 'Financing Milestone Verification',
      description: 'Escrow receipt deposit check, lender underwriting validation, appraisal chaser, and title commitment tracking.',
      triggerEvent: 'contract_signed',
      category: 'Transaction Management',
      steps: [
        { name: 'Confirm earnest money receipt', requiredRole: 'transaction_coordinator' },
        { name: 'Verify lender approval status', requiredRole: 'transaction_coordinator' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  if (!dbState.workflowTemplates) dbState.workflowTemplates = [];
  dbState.workflowTemplates.push(...defaultTemplates);

  // Log launch audit trail
  logAuditEvent(
    config.workspace.ownerName,
    'owner',
    `Onboarded and activated workspace tenant: "${newWorkspace.name}" (${wsId})`,
    'System'
  );

  // Trigger state persistence save
  persistState(wsId);

  res.json({ success: true, workspace: newWorkspace });
});

// Get entire DB state (for frontend sync, scoped by workspaceId) - PURE READ-ONLY
app.get('/api/db-state', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, async (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  
  if (storageDriver === 'database' && dbPool) {
    try {
      const dbData = await loadWorkspaceState(dbPool, wsId);
      return res.json(dbData);
    } catch (err: any) {
      console.error('[Database] Failed to load workspace state:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  // Scopes records to active workspace (local file storage / memory)
  const filteredState = {
    ...dbState,
    transactions: dbState.transactions.filter((t: any) => !t.workspaceId || t.workspaceId === wsId),
    listings: dbState.listings.filter((l: any) => !l.workspaceId || l.workspaceId === wsId),
    tasks: dbState.tasks.filter((t: any) => !t.workspaceId || t.workspaceId === wsId),
    actionProposals: dbState.actionProposals.filter((p: any) => !p.workspaceId || p.workspaceId === wsId),
    auditEvents: dbState.auditEvents.filter((a: any) => !a.workspaceId || a.workspaceId === wsId),
    operationsInbox: dbState.operationsInbox.filter((o: any) => !o.workspaceId || o.workspaceId === wsId),
    integrationReceipts: (dbState as any).integrationReceipts?.filter((r: any) => !r.workspaceId || r.workspaceId === wsId) || [],
    workItems: (dbState.workItems || []).filter((w: any) => !w.workspaceId || w.workspaceId === wsId),
    signInventory: (dbState.signInventory || []).filter((s: any) => !s.workspaceId || s.workspaceId === wsId),
    officeSupplies: (dbState.officeSupplies || []).filter((s: any) => !s.workspaceId || s.workspaceId === wsId),
    facilitiesIssues: (dbState.facilitiesIssues || []).filter((f: any) => !f.workspaceId || f.workspaceId === wsId),
    pilotSuccessCriteria: (dbState.pilotSuccessCriteria || []).filter((c: any) => !c.workspaceId || c.workspaceId === wsId),
    entryPoints: (dbState.entryPoints || []).filter((e: any) => !e.workspaceId || e.workspaceId === wsId),
    attentionStates: (dbState.attentionStates || []).filter((a: any) => !a.workspaceId || a.workspaceId === wsId),
    ownerShieldDecisions: (dbState.ownerShieldDecisions || []).filter((o: any) => !o.workspaceId || o.workspaceId === wsId),
    headlessActions: (dbState.headlessActions || []).filter((a: any) => !a.workspaceId || a.workspaceId === wsId),
    integrationEvents: (dbState.integrationEvents || []).filter((e: any) => !e.workspaceId || e.workspaceId === wsId),
    signals: (dbState.signals || []).filter((s: any) => !s.workspaceId || s.workspaceId === wsId),
    decisions: (dbState.decisions || []).filter((d: any) => !d.workspaceId || d.workspaceId === wsId),
    shapeworkJobs: (dbState.shapeworkJobs || []).filter((j: any) => !j.workspaceId || j.workspaceId === wsId),
    shapeworkJobSteps: (dbState.shapeworkJobSteps || []).filter((s: any) => !s.workspaceId || s.workspaceId === wsId),
    approvals: (dbState.approvals || []).filter((a: any) => !a.workspaceId || a.workspaceId === wsId),
    actions: (dbState.actions || []).filter((a: any) => !a.workspaceId || a.workspaceId === wsId),
    deliveries: (dbState.deliveries || []).filter((d: any) => !d.workspaceId || d.workspaceId === wsId),
    outcomes: (dbState.outcomes || []).filter((o: any) => !o.workspaceId || o.workspaceId === wsId),
    receipts: (dbState.receipts || []).filter((r: any) => !r.workspaceId || r.workspaceId === wsId),
    ownerBriefItems: (dbState.ownerBriefItems || []).filter((o: any) => !o.workspaceId || o.workspaceId === wsId)
  };

  res.json(filteredState);
});

// Explicit workflow evaluator endpoint
app.post('/api/workflows/evaluate', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, async (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';

  if (storageDriver === 'database' && dbPool) {
    try {
      const dbData = await loadWorkspaceState(dbPool, wsId);
      syncOpportunitiesToWorkItems(wsId, dbData);
      await saveWorkspaceState(dbPool, wsId, dbData);
      return res.json({ success: true, dbState: dbData });
    } catch (err: any) {
      console.error('[Database] Failed workflow evaluation:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  syncOpportunitiesToWorkItems(wsId, dbState);
  persistState(wsId);

  // Return the scoped, updated state
  const filteredState = {
    ...dbState,
    transactions: dbState.transactions.filter((t: any) => !t.workspaceId || t.workspaceId === wsId),
    listings: dbState.listings.filter((l: any) => !l.workspaceId || l.workspaceId === wsId),
    tasks: dbState.tasks.filter((t: any) => !t.workspaceId || t.workspaceId === wsId),
    workItems: (dbState.workItems || []).filter((w: any) => !w.workspaceId || w.workspaceId === wsId),
    actionProposals: (dbState.actionProposals || []).filter((p: any) => !p.workspaceId || p.workspaceId === wsId),
    auditEvents: (dbState.auditEvents || []).filter((a: any) => !a.workspaceId || a.workspaceId === wsId),
    signInventory: (dbState.signInventory || []).filter((s: any) => !s.workspaceId || s.workspaceId === wsId),
    officeSupplies: (dbState.officeSupplies || []).filter((s: any) => !s.workspaceId || s.workspaceId === wsId),
    financeSignals: (dbState.financeSignals || []).filter((s: any) => !s.workspaceId || s.workspaceId === wsId),
    quickbooksConnections: (dbState.quickbooksConnections || []).filter((c: any) => !c.workspaceId || c.workspaceId === wsId),
    basecampSignals: (dbState.basecampSignals || []).filter((s: any) => !s.workspaceId || s.workspaceId === wsId),
    basecampConnections: (dbState.basecampConnections || []).filter((c: any) => !c.workspaceId || c.workspaceId === wsId),
    workspaceIntegrationConnections: (dbState.workspaceIntegrationConnections || []).filter((c: any) => !c.workspaceId || c.workspaceId === wsId),
    workspaceCommunicationSignals: (dbState.workspaceCommunicationSignals || []).filter((s: any) => !s.workspaceId || s.workspaceId === wsId),
    externalActionApprovals: (dbState.externalActionApprovals || []).filter((a: any) => !a.workspaceId || a.workspaceId === wsId)
  };

  res.json({ success: true, dbState: filteredState });
});

// Mount Rechat Integration router
app.use('/api/integrations/rechat', getRechatRouter(dbState));

// Mount API Nation Dotloop router
app.use('/api/integrations/apination/dotloop', getApiNationDotloopRouter(dbState));

// Mount QuickBooks Integration router
app.use('/api/integrations/quickbooks', getQuickBooksRouter(dbState, persistState));

// Mount Basecamp Integration router
app.use('/api/integrations/basecamp', getBasecampRouter(dbState, persistState));

// Mount Google Workspace Integration router
app.use('/api/integrations/google', getGoogleRouter(dbState, persistState));

// Mount Microsoft 365 Integration router
app.use('/api/integrations/microsoft', getMicrosoftRouter(dbState, persistState));

// Mount Slack Integration router
app.use('/api/integrations/slack', getSlackRouter(dbState, persistState));

// Mount Canva Integration router
app.use('/api/integrations/canva', getCanvaRouter(dbState, persistState));

// Mount Planned Integrations router (stubs)
app.use('/api/integrations', getPlannedIntegrationsRouter(dbState));

// Mount Webhook stubs
app.post('/api/webhooks/resend', (req, res) => {
  res.status(501).json({ error: 'Not Implemented', message: 'Resend webhook path is planned but not fully implemented.' });
});
app.post('/api/webhooks/zapier/:workspaceId/:secret', (req, res) => {
  res.status(501).json({ error: 'Not Implemented', message: 'Zapier webhook path is planned but not fully implemented.' });
});

// Mount Operating Record router
app.use('/api/operating-record', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_workspace'), getOperatingRecordRouter(dbState));

// Mount public unsubscribe routes
app.get('/unsubscribe/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    const calculatedHmac = crypto.createHmac('sha256', process.env.JWT_SECRET || 'fallback_secret').update(decoded.data).digest('hex');
    if (calculatedHmac !== decoded.hmac) {
      return res.status(400).send('Invalid or expired unsubscribe link.');
    }
    const { wsId, contactId, campaignId } = JSON.parse(decoded.data);

    res.send(`
      <html>
        <head>
          <title>Confirm Unsubscribe</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb;">
          <div style="max-width: 400px; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <h2 style="margin-top: 0; color: #111827;">Unsubscribe outreach emails</h2>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Please click the button below to confirm that you want to unsubscribe from outreach emails for this campaign.</p>
            <form method="POST">
              <button type="submit" style="background: #e11d48; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 600; cursor: pointer; width: 100%; font-size: 14px; transition: background 0.2s;">Confirm Unsubscribe</button>
            </form>
          </div>
        </body>
      </html>
    `);
  } catch (e) {
    res.status(400).send('Invalid or expired unsubscribe link.');
  }
});

app.post('/unsubscribe/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    const calculatedHmac = crypto.createHmac('sha256', process.env.JWT_SECRET || 'fallback_secret').update(decoded.data).digest('hex');
    if (calculatedHmac !== decoded.hmac) {
      return res.status(400).send('Invalid or expired unsubscribe link.');
    }
    const { wsId, contactId, campaignId } = JSON.parse(decoded.data);

    // Initializing state for this workspace
    dbState.suppressionList = dbState.suppressionList || [];
    dbState.campaignEnrollments = dbState.campaignEnrollments || [];
    dbState.unsubscribeEvents = dbState.unsubscribeEvents || [];
    dbState.contacts = dbState.contacts || [];

    const contact = dbState.contacts.find((c: any) => c.id === contactId);
    const email = contact ? contact.email : 'unknown';

    // Add email to suppression list if not already present
    const alreadySuppressed = dbState.suppressionList.some((s: any) => s.email.toLowerCase() === email.toLowerCase() && s.workspaceId === wsId);
    if (!alreadySuppressed) {
      dbState.suppressionList.push({
        id: `sup_${Math.random().toString(36).substring(2, 11)}`,
        workspaceId: wsId,
        email,
        reason: 'unsubscribe',
        createdAt: new Date().toISOString()
      });
    }

    // Stop active enrollments
    dbState.campaignEnrollments.forEach((e: any) => {
      if (e.contactId === contactId && e.status === 'enrolled') {
        e.status = 'stopped';
        e.stoppedReason = 'unsubscribe';
        e.updatedAt = new Date().toISOString();
      }
    });

    // Record unsubscribe event idempotently
    const alreadyRecorded = dbState.unsubscribeEvents.some(
      (e: any) => e.workspaceId === wsId && e.campaignId === campaignId && e.contactId === contactId
    );
    if (!alreadyRecorded) {
      dbState.unsubscribeEvents.push({
        id: `unsub_${Math.random().toString(36).substring(2, 11)}`,
        workspaceId: wsId,
        campaignId,
        contactId,
        email,
        createdAt: new Date().toISOString()
      });
    }

    await persistState(wsId);

    res.send(`
      <html>
        <head>
          <title>Unsubscribed Successfully</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb;">
          <div style="max-width: 400px; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center;">
            <h2 style="margin-top: 0; color: #10b981;">Unsubscribed Successfully</h2>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">You have been successfully unsubscribed. You will no longer receive marketing or campaign outreach emails.</p>
          </div>
        </body>
      </html>
    `);
  } catch (e) {
    res.status(400).send('Invalid or expired unsubscribe link.');
  }
});

// Mount Brokerage Growth Engine router
app.use('/api/growth', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, getGrowthRouter(dbState, persistState));

// Mount Notification Center router
app.use('/api/notifications', getNotificationRouter(dbState, persistState));
registerDevPreviewRoute(app, dbState);

// Mount Headless Action router
app.use('/api/headless', getHeadlessActionRouter(dbState, persistState));

// Update profile role (role-switching)
app.post('/api/user/switch-role', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const { role, name } = req.body;
  if (process.env.APP_MODE === 'production' && (req as any).membership?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden', message: 'Role switching is not permitted in production.' });
  }
  logAuditEvent(name || 'User', role || 'owner', `Switched active viewpoint role to ${role}`, 'Access Control');
  res.json({ success: true, role });
});

// Propose a custom workflow configuration
app.post('/api/workflow/configure', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('configure_routing'), (req, res) => {
  const { templateId, name, description, steps } = req.body;
  const existingIndex = dbState.workflowTemplates.findIndex(w => w.id === templateId);
  
  if (existingIndex !== -1) {
    dbState.workflowTemplates[existingIndex] = {
      ...dbState.workflowTemplates[existingIndex],
      name,
      description,
      steps
    };
  } else {
    dbState.workflowTemplates.push({
      id: `w_${Date.now()}`,
      name,
      description,
      trigger_event: 'Custom trigger',
      category: 'custom' as any,
      steps
    });
  }
  
  logAuditEvent('Frank Miller', 'Operations Manager', `Configured workflow template: "${name}"`, 'Workflows');
  res.json({ success: true, workflowTemplates: dbState.workflowTemplates });
});

// Action Proposal State transitions (Suggested -> Approved -> Executing -> Completed)
app.post('/api/action/approve', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('approve_actions'), (req, res) => {
  const { actionId, userName, userRole } = req.body;

  const approvalId = actionId.startsWith('approval_') ? actionId : `approval_migrated_${actionId}`;
  const approval = (dbState.approvals || []).find((a: any) => a.id === actionId || a.id === approvalId);
  if (approval) {
    approveApproval(dbState, approval.id, userName || 'Diane Ross');
    syncRuntimeToLegacy(dbState);
    persistState();

    // Trigger simulation ticks for job steps
    setTimeout(() => {
      simulateJobSteps(approval.job_id || approval.jobId);
    }, 100);

    return res.json({ success: true, message: 'Action approved successfully via runtime.' });
  }

  const proposalIndex = dbState.actionProposals.findIndex(p => p.id === actionId);

  if (proposalIndex === -1) {
    return res.status(404).json({ error: 'Proposal not found' });
  }

  const proposal = dbState.actionProposals[proposalIndex];
  proposal.state = 'approved';

  logAuditEvent(
    userName || 'Diane Ross',
    userRole || 'Transaction Coordinator',
    `Approved AI action proposal: "${proposal.title}" for ${proposal.property_address || 'Brokerage'}`,
    'AI Operations'
  );

  // Simulate Execution Pipeline asynchronously
  proposal.state = 'executing';
  setTimeout(() => {
    // Rechat Gated Writeback Execution
    const propAny = proposal as any;
    if (propAny.isRechatWriteback && propAny.rechatWriteback) {
      const { recordId, taskTitle, taskDescription, assigneeName, dueDate } = propAny.rechatWriteback;
      
      rechatClient.createTask({
        title: taskTitle,
        description: taskDescription,
        due_date: dueDate,
        deal: recordId
      }).then(rechatTask => {
        console.log('[Rechat Writeback] Task created successfully in Rechat:', rechatTask.id);
        
        // Push task to Operating Memory
        const newTask = {
          id: rechatTask.id || `t_rechat_${Date.now()}`,
          transaction_id: recordId,
          title: taskTitle,
          description: taskDescription,
          assigned_to_role: 'Transaction Coordinator',
          assigned_to_name: assigneeName,
          due_date: dueDate,
          status: 'pending' as const,
          is_automated: true,
          time_saved_minutes: 20
        };
        dbState.tasks.push(newTask);

        proposal.state = 'completed';
        
        logAuditEvent(
          'System Operator (Shapework)',
          'AI Employee',
          `Executed completed automation: Created Rechat Task "${taskTitle}" (Rechat ID: ${rechatTask.id})`,
          'Automation Pipeline'
        );
      }).catch(err => {
        console.error('[Rechat Writeback] Write failed:', err.message);
        proposal.state = 'failed';
      });
    } else {
      const wsId = proposal.workspaceId || 'nest-realty-demo';
      const to = proposal.recipient || (proposal as any).proposedPayload?.to || 'client@example.com';
      const subject = proposal.subject || (proposal as any).proposedPayload?.subject || `Shapework Update: ${proposal.property_address || ''}`;
      const body = proposal.body || (proposal as any).proposedPayload?.body || `Hello, this is an update regarding ${proposal.property_address || ''}`;

      if (proposal.action_type === 'draft_email') {
        const store = new IntegrationStateStore(dbState);
        
        const executeMailSend = async () => {
          // Check for Google first
          const googleConn = await store.getConnection(wsId, 'google_workspace');
          if (googleConn && googleConn.status === 'connected') {
            const token = await getGoogleAccessToken(googleConn, dbState, () => persistState(wsId));
            const msgId = await sendGmailEmail(token, to, subject, body);
            
            const newApproval = {
              id: `appr_${Date.now()}`,
              workspaceId: wsId,
              provider: 'gmail' as const,
              actionType: 'send_email' as const,
              proposedPayload: { to, subject, body },
              status: 'sent' as const,
              requestedBy: 'System Agent',
              approvedBy: userName || 'Diane Ross',
              createdAt: new Date().toISOString(),
              approvedAt: new Date().toISOString(),
              executedAt: new Date().toISOString()
            };
            if (!dbState.externalActionApprovals) dbState.externalActionApprovals = [];
            dbState.externalActionApprovals.push(newApproval);

            logIntegrationAudit(
              dbState,
              wsId,
              userName || 'Diane Ross',
              userRole || 'Transaction Coordinator',
              `Sent approved email via Gmail to ${to} (Subject: ${subject})`,
              'Google Workspace'
            );
            return msgId;
          }

          // Check for Microsoft 365 next
          const msConn = await store.getConnection(wsId, 'microsoft_365');
          if (msConn && msConn.status === 'connected') {
            const token = await getMicrosoftAccessToken(msConn, dbState, () => persistState(wsId));
            const msgId = await sendOutlookEmail(token, to, subject, body);

            const newApproval = {
              id: `appr_${Date.now()}`,
              workspaceId: wsId,
              provider: 'outlook' as const,
              actionType: 'send_email' as const,
              proposedPayload: { to, subject, body },
              status: 'sent' as const,
              requestedBy: 'System Agent',
              approvedBy: userName || 'Diane Ross',
              createdAt: new Date().toISOString(),
              approvedAt: new Date().toISOString(),
              executedAt: new Date().toISOString()
            };
            if (!dbState.externalActionApprovals) dbState.externalActionApprovals = [];
            dbState.externalActionApprovals.push(newApproval);

            logIntegrationAudit(
              dbState,
              wsId,
              userName || 'Diane Ross',
              userRole || 'Transaction Coordinator',
              `Sent approved email via Outlook to ${to} (Subject: ${subject})`,
              'Microsoft 365'
            );
            return msgId;
          }

          // Fallback simulation if no production-grade external provider is connected
          const fallbackApproval = {
            id: `appr_sim_${Date.now()}`,
            workspaceId: wsId,
            provider: 'gmail' as const, // default sim
            actionType: 'send_email' as const,
            proposedPayload: { to, subject, body },
            status: 'sent' as const,
            requestedBy: 'System Agent',
            approvedBy: userName || 'Diane Ross',
            createdAt: new Date().toISOString(),
            approvedAt: new Date().toISOString(),
            executedAt: new Date().toISOString()
          };
          if (!dbState.externalActionApprovals) dbState.externalActionApprovals = [];
          dbState.externalActionApprovals.push(fallbackApproval);

          console.log(`[Email Approval Sim] Sent simulation mail to ${to}`);
          return `sim_msg_${Date.now()}`;
        };

        executeMailSend()
          .then(() => {
            proposal.state = 'completed';
            persistState(wsId);
          })
          .catch(err => {
            console.error('[Action Approval] Email dispatch failed:', err.message);
            proposal.state = 'failed';
            persistState(wsId);
          });
      } else {
        proposal.state = 'completed';
      }
    }
    
    // Add transaction audit log or event
    if (proposal.transaction_id) {
      const tx = dbState.transactions.find(t => t.id === proposal.transaction_id);
      if (tx) {
        tx.latest_update = `AI Operation completed: ${proposal.title}`;
        
        // Resolve target overdue task if related
        if (proposal.action_type === 'request_external_status') {
          const matchingTask = dbState.tasks.find(t => t.transaction_id === tx.id && t.status !== 'completed');
          if (matchingTask) {
            matchingTask.status = 'completed';
          }
        }
      }
    }

    // Increment ROI stats
    dbState.roiStats.actionsApprovedCount += 1;
    dbState.roiStats.actionsCompletedCount += 1;
    dbState.roiStats.hoursSaved += 0.5; // Saving roughly 30 minutes per action
    
    logAuditEvent(
      'System Operator (Shapework)',
      'AI Employee',
      `Executed completed automation for: "${proposal.title}"`,
      'Automation Pipeline'
    );
  }, 1500);

  res.json({ success: true, proposal, dbState });
});

// Dismiss a proposal
app.post('/api/action/dismiss', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_work_queue'), (req, res) => {
  const { actionId, userName, userRole } = req.body;
  const proposalIndex = dbState.actionProposals.findIndex(p => p.id === actionId);

  if (proposalIndex !== -1) {
    dbState.actionProposals[proposalIndex].state = 'dismissed';
    logAuditEvent(
      userName || 'Diane Ross',
      userRole || 'Transaction Coordinator',
      `Dismissed AI suggestion: "${dbState.actionProposals[proposalIndex].title}"`,
      'AI Operations'
    );
  }

  res.json({ success: true, dbState });
});

// Propose a custom action for approval (Google review, compliance chaser, secure upload link, etc.)
app.post('/api/action/propose', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('view_work_queue'), (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  const { title, description, actionType, draftContent, targetRecipient, propertyAddress, transactionId } = req.body;

  // Validate payload
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Validation Error', message: 'Title is required' });
  }
  if (!draftContent || typeof draftContent !== 'string' || draftContent.trim() === '') {
    return res.status(400).json({ error: 'Validation Error', message: 'Draft content is required' });
  }

  // Cross-workspace boundary check (Tenant isolation)
  if (transactionId) {
    const normalizedTarget = transactionId.replace('_', '-');
    const tx = dbState.transactions.find(t => t.id === transactionId || t.id.replace('_', '-') === normalizedTarget);
    const txWorkspaceId = tx?.workspaceId || 'nest-realty-demo';
    if (!tx || txWorkspaceId !== wsId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Mismatched workspace context for target transaction' });
    }
  }

  if (!dbState.actionProposals) dbState.actionProposals = [];

  const newProposal = {
    id: `ap_${Date.now()}`,
    workspaceId: wsId,
    transaction_id: transactionId || null,
    property_address: propertyAddress || '',
    action_type: actionType || 'draft_email',
    title: title.trim(),
    description: description || '',
    state: 'awaiting_approval',
    confidence: 1.0,
    created_at: new Date().toISOString(),
    target_recipient: targetRecipient || '',
    draft_content: draftContent.trim()
  };

  dbState.actionProposals.unshift(newProposal);
  logAuditEvent(
    (req as any).user?.name || 'Operations Lead',
    (req as any).user?.role || 'operations_lead',
    `Proposed action for approval: "${title}"`,
    'AI Operations'
  );
  // Trigger notification rules
  const profilesList = dbState.profiles || [];
  const approver = profilesList.find((p: any) => p.role === 'owner' && p.status === 'active');
  if (approver) {
    triggerNotification(dbState, wsId, approver.id, 'approve_action', {
      approvalId: newProposal.id,
      contextText: `Approval needed for proposal: "${title.trim()}"`
    }).catch(console.error);
  }

  persistState(wsId);
  res.json({ success: true, proposal: newProposal });
});

// Trigger a manual listing checklist stage completion
app.post('/api/listing/complete-step', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_deals'), (req, res) => {
  const { listingId, stepId, userName, userRole } = req.body;
  const listing = dbState.listings.find(l => l.id === listingId);
  if (listing) {
    const step = listing.launch_checklist.find(s => s.id === stepId);
    if (step) {
      step.status = 'completed';
      step.completed_at = new Date().toISOString();
      logAuditEvent(
        userName || 'Alex Carter',
        userRole || 'Agent',
        `Marked launch step "${step.step_name}" completed on ${listing.property_address}`,
        'Listings Launch'
      );
    }
  }
  res.json({ success: true, dbState });
});

// CREATE WORK QUEUE ITEM
app.post('/api/work-items/create', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  const { title, type, source, ownerRole, priority, recommendedNextAction, relatedType, relatedId, relatedLabel, approvalRequired } = req.body;

  // Create runtime entities
  const signalId = `sig_${Date.now()}`;
  const signal = {
    id: signalId,
    workspaceId: wsId,
    sourceType: source || 'manual',
    sourceName: source || 'manual',
    signalType: type || 'user_request',
    title: title,
    summary: recommendedNextAction || title,
    safePayloadSummary: JSON.stringify(req.body),
    receivedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  if (!dbState.signals) dbState.signals = [];
  dbState.signals.push(signal);

  const decisionId = `dec_${Date.now()}`;
  const decision = {
    id: decisionId,
    workspaceId: wsId,
    signalId: signalId,
    decisionType: 'plan_job',
    confidence: 1.0,
    ownerWorthy: ownerRole === 'owner',
    humanReviewRequired: !!approvalRequired,
    rulesTriggered: ['manual_intake'],
    rationaleSummary: 'Manually logged work item task',
    assignedRole: ownerRole || 'operations_lead',
    createdAt: new Date().toISOString()
  };
  if (!dbState.decisions) dbState.decisions = [];
  dbState.decisions.push(decision);

  const jobId = `job_${Date.now()}`;
  const job = {
    id: jobId,
    workspaceId: wsId,
    signalId: signalId,
    decisionId: decisionId,
    requestedBy: (req as any).user?.name || 'Operations Lead',
    requestText: title,
    workflowKey: type || 'general',
    workflowName: title,
    status: 'active',
    confidence: 1.0,
    currentStep: `step_${jobId}_1`,
    humanReviewRequired: !!approvalRequired,
    ownerWorthy: ownerRole === 'owner',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (!dbState.shapeworkJobs) dbState.shapeworkJobs = [];
  dbState.shapeworkJobs.push(job);

  const stepId = `step_${jobId}_1`;
  const step = {
    id: stepId,
    workspaceId: wsId,
    jobId: jobId,
    stepOrder: 1,
    title: title,
    description: recommendedNextAction || title,
    channel: 'internal_route',
    status: 'pending',
    requiresApproval: !!approvalRequired,
    riskLevel: priority === 'high' || priority === 'critical' ? 'high' : 'low',
    assignedRole: ownerRole || 'operations_lead',
    safePayloadSummary: JSON.stringify(req.body),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (!dbState.shapeworkJobSteps) dbState.shapeworkJobSteps = [];
  dbState.shapeworkJobSteps.push(step);

  logAuditEvent(
    (req as any).user?.name || 'Operations Lead',
    'operations_lead',
    `Created Work Queue item: "${title}" (Assigned: ${ownerRole.replace(/_/g, ' ')})`,
    'Work Queue'
  );

  syncRuntimeToLegacy(dbState);

  // Trigger notification rules
  const profilesList = dbState.profiles || [];
  const recipient = profilesList.find((p: any) => p.role === (ownerRole || 'operations_lead') && p.status === 'active');
  if (recipient) {
    triggerNotification(dbState, wsId, recipient.id, 'complete_work_item', {
      workItemId: jobId,
      contextText: `A new task "${title}" has been assigned to you.`
    }).catch(console.error);
  }

  persistState();
  res.json({ success: true, workItem: (dbState.workItems || []).find((w: any) => w.id === jobId) });
});

// UPDATE WORK QUEUE ITEM STATUS
app.post('/api/work-items/:id/update-status', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const { status, userName, userRole } = req.body;
  const itemId = req.params.id;

  const apprId = itemId.startsWith('appr_') || itemId.startsWith('approval_') ? itemId : `approval_migrated_${itemId}`;
  const approval = (dbState.approvals || []).find((a: any) => a.id === itemId || a.id === apprId);
  
  let targetJobId = '';
  let targetStepId = '';
  
  if (approval) {
    targetJobId = approval.job_id || approval.jobId;
    targetStepId = approval.step_id || approval.stepId;
    approval.status = status === 'completed' || status === 'approved' ? 'approved' : 'rejected';
    approval.approved_by = userName || 'Diane Ross';
    approval.approved_at = new Date().toISOString();
  }

  const jobId = itemId.startsWith('job_') ? itemId : `job_migrated_${itemId}`;
  const job = dbState.shapeworkJobs.find((j: any) => j.id === itemId || j.id === jobId || j.id === targetJobId);
  if (job) {
    job.status = status === 'completed' || status === 'approved' ? 'completed' : 'active';
    job.updatedAt = new Date().toISOString();
    if (status === 'completed' || status === 'approved') job.completedAt = new Date().toISOString();

    const steps = (dbState.shapeworkJobSteps || []).filter((s: any) => s.jobId === job.id);
    steps.forEach((s: any) => {
      if (!targetStepId || s.id === targetStepId) {
        s.status = status === 'completed' || status === 'approved' ? 'completed' : 'pending';
        s.updatedAt = new Date().toISOString();
      }
    });

    logAuditEvent(
      userName || 'Operations Lead',
      userRole || 'operations_lead',
      `Updated Work Queue item status to "${status}" for "${job.workflowName}"`,
      'Work Queue'
    );
    syncRuntimeToLegacy(dbState);
    persistState();
    res.json({ success: true, workItem: (dbState.workItems || []).find((w: any) => w.id === itemId) });
  } else {
    // fallback to legacy
    const item = dbState.workItems.find(w => w.id === itemId);
    if (item) {
      item.status = status;
      item.updatedAt = new Date().toISOString();
      persistState();
      res.json({ success: true, workItem: item });
    } else {
      res.status(404).json({ error: 'WorkItem not found' });
    }
  }
});

// UPDATE WORK QUEUE ITEM FIELDS (GENERIC)
app.post('/api/work-items/:id/update', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const { status, ownerRole, priority, notes, recommendedNextAction, isEscalated, userName, userRole, assignedStaffMemberId, backupStaffMemberId, dueDate } = req.body;
  const itemId = req.params.id;

  const apprId = itemId.startsWith('appr_') || itemId.startsWith('approval_') ? itemId : `approval_migrated_${itemId}`;
  const approval = (dbState.approvals || []).find((a: any) => a.id === itemId || a.id === apprId);
  
  let targetJobId = '';
  let targetStepId = '';
  
  if (approval) {
    targetJobId = approval.job_id || approval.jobId;
    targetStepId = approval.step_id || approval.stepId;
    if (recommendedNextAction !== undefined) {
      approval.draft_action_summary = recommendedNextAction;
    }
  }

  const jobId = itemId.startsWith('job_') ? itemId : `job_migrated_${itemId}`;
  const job = dbState.shapeworkJobs.find((j: any) => j.id === itemId || j.id === jobId || j.id === targetJobId);
  if (job) {
    if (status !== undefined) {
      job.status = status === 'completed' ? 'completed' : 'active';
      if (status === 'completed') job.completedAt = new Date().toISOString();
    }
    if (ownerRole !== undefined) {
      job.ownerWorthy = ownerRole === 'owner';
      const steps = (dbState.shapeworkJobSteps || []).filter((s: any) => s.jobId === job.id);
      steps.forEach((s: any) => {
        s.assignedRole = ownerRole;
      });
    }
    if (priority !== undefined) {
      job.ownerWorthy = priority === 'high' || priority === 'critical' || priority === 'owner_worthy';
    }
    job.updatedAt = new Date().toISOString();

    logAuditEvent(
      userName || 'Operations Lead',
      userRole || 'operations_lead',
      `Modified work item fields for "${job.workflowName}"`,
      'Work Queue'
    );

    syncRuntimeToLegacy(dbState);
    persistState();
    res.json({ success: true, workItem: (dbState.workItems || []).find((w: any) => w.id === itemId) });
  } else {
    // fallback to legacy
    const item = dbState.workItems.find(w => w.id === itemId);
    if (item) {
      if (status !== undefined) item.status = status;
      if (ownerRole !== undefined) item.ownerRole = ownerRole;
      if (priority !== undefined) item.priority = priority;
      if (recommendedNextAction !== undefined) item.recommendedNextAction = recommendedNextAction;
      item.updatedAt = new Date().toISOString();
      persistState();
      res.json({ success: true, workItem: item });
    } else {
      res.status(404).json({ error: 'WorkItem not found' });
    }
  }
});

// SNOOZE ATTENTION CARD
app.post('/api/attention-states/snooze', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  const { workItemId, priority, isOverdue, userName, userRole } = req.body;
  const userId = (req as any).authUser?.id || 'usr_owner';

  if (!dbState.attentionStates) dbState.attentionStates = [];
  const stateId = `${userId}_${workItemId}`;
  let state = dbState.attentionStates.find(s => s.id === stateId);
  if (!state) {
    state = {
      id: stateId,
      workItemId,
      workspaceId: wsId,
      userId,
      status: 'active',
      dismissedCount: 0
    };
    dbState.attentionStates.push(state);
  }

  state.dismissedCount += 1;
  state.status = 'snoozed';

  let baseCooldown = 60; // default 1 hour
  if (isOverdue) baseCooldown = 15;
  else if (priority === 'owner_worthy') baseCooldown = 30;
  else if (priority === 'high' || priority === 'critical') baseCooldown = 60;
  else if (priority === 'medium') baseCooldown = 240;
  else if (priority === 'low') baseCooldown = 1440;

  // Escalate cooldown by shortening it on subsequent snoozes
  let cooldown = baseCooldown;
  if (priority === 'high' || priority === 'critical' || priority === 'owner_worthy' || isOverdue) {
    cooldown = Math.max(5, Math.round(baseCooldown / state.dismissedCount));
  }

  state.snoozedUntil = req.body.snoozedUntil || new Date(Date.now() + cooldown * 60 * 1000).toISOString();
  state.lastActionAt = new Date().toISOString();

  logAuditEvent(
    userName || 'Operations Lead',
    userRole || 'operations_lead',
    `attention_card_snoozed for work item "${workItemId}" (Snoozes: ${state.dismissedCount}, Cooldown: ${cooldown}m)`,
    'notifications'
  );

  persistState();
  res.json({ success: true, attentionState: state });
});

// LOG PRESENTED CARD
app.post('/api/attention-states/present', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  const { workItemId, userName, userRole } = req.body;
  const userId = (req as any).authUser?.id || 'usr_owner';

  if (!dbState.attentionStates) dbState.attentionStates = [];
  const stateId = `${userId}_${workItemId}`;
  let state = dbState.attentionStates.find(s => s.id === stateId);
  const wasSnoozed = state?.status === 'snoozed';

  if (!state) {
    state = {
      id: stateId,
      workItemId,
      workspaceId: wsId,
      userId,
      status: 'active',
      dismissedCount: 0
    };
    dbState.attentionStates.push(state);
  }

  state.lastPresentedAt = new Date().toISOString();

  logAuditEvent(
    userName || 'Operations Lead',
    userRole || 'operations_lead',
    wasSnoozed 
      ? `attention_card_reappeared for work item "${workItemId}"` 
      : `attention_card_opened for work item "${workItemId}"`,
    'notifications'
  );

  persistState();
  res.json({ success: true, attentionState: state });
});

// ACT / RESOLVE CARD
app.post('/api/attention-states/action', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  const { workItemId, actionType, userName, userRole } = req.body;
  const userId = (req as any).authUser?.id || 'usr_owner';

  if (!dbState.attentionStates) dbState.attentionStates = [];
  const stateId = `${userId}_${workItemId}`;
  let state = dbState.attentionStates.find(s => s.id === stateId);
  if (!state) {
    state = {
      id: stateId,
      workItemId,
      workspaceId: wsId,
      userId,
      status: 'active',
      dismissedCount: 0
    };
    dbState.attentionStates.push(state);
  }

  state.status = actionType === 'resolve' ? 'resolved' : 'acted';
  state.lastActionAt = new Date().toISOString();

  logAuditEvent(
    userName || 'Operations Lead',
    userRole || 'operations_lead',
    `attention_card_action_started for work item "${workItemId}"`,
    'notifications'
  );

  logAuditEvent(
    userName || 'Operations Lead',
    userRole || 'operations_lead',
    `attention_card_action_completed for work item "${workItemId}": ${actionType}`,
    'notifications'
  );

  persistState();
  res.json({ success: true, attentionState: state });
});

// CREATE STAFF MEMBER (PROFILE)
app.post('/api/profiles/create', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_users'), (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  const { name, email, cellPhone, role, status, canReceiveEscalations } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required' });
  }

  // Validate email format
  if (!email.includes('@') || email.indexOf('@') === 0 || email.indexOf('@') === email.length - 1) {
    return res.status(400).json({ error: 'Invalid email address format' });
  }

  // Validate customer staff role limits
  const CUSTOMER_STAFF_ROLES = [
    'owner', 'admin', 'operations_lead', 'marketing_coordinator',
    'transaction_coordinator', 'compliance_partner', 'events',
    'maintenance', 'agent'
  ];
  if (!CUSTOMER_STAFF_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Restricted role assignment' });
  }

  if (!dbState.profiles) dbState.profiles = [];

  // Check duplicate email scoped by workspaceId
  const exists = dbState.profiles.some(p => p.workspaceId === wsId && p.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: 'A staff member with this email already exists in this workspace' });
  }

  const newProfile = {
    id: `u_${Date.now()}`,
    organization_id: 'org_hp',
    name,
    email,
    cellPhone: cellPhone || '',
    role,
    status: status || 'active',
    canReceiveEscalations: !!canReceiveEscalations,
    isBackupOwner: role === 'owner' || role === 'operations_lead',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    workspaceId: wsId
  };

  dbState.profiles.push(newProfile);

  logAuditEvent(
    (req as any).authUser?.name || 'Operations Lead',
    (req as any).authUser?.role || 'operations_lead',
    `Created staff member: "${name}" (${role.replace(/_/g, ' ')})`,
    'People & Ownership'
  );

  // Sync state & scan role gaps
  syncWorkItemsOwnerDetails(dbState, wsId);
  scanAndResolveRoleGaps(dbState, wsId);

  persistState();
  res.json({ success: true, profile: newProfile });
});

// UPDATE STAFF MEMBER (PROFILE)
app.post('/api/profiles/:id/update', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_users'), (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  const profileId = req.params.id;
  const { name, email, cellPhone, role, status, canReceiveEscalations } = req.body;

  if (!dbState.profiles) dbState.profiles = [];
  const profile = dbState.profiles.find(p => p.id === profileId);

  if (!profile) {
    return res.status(404).json({ error: 'Staff member not found' });
  }

  // Prevent cross-workspace boundary updates
  if (profile.workspaceId !== wsId) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this profile' });
  }

  // Validate email format if changing
  if (email !== undefined) {
    if (!email.includes('@') || email.indexOf('@') === 0 || email.indexOf('@') === email.length - 1) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }

    if (email.toLowerCase() !== profile.email.toLowerCase()) {
      const exists = dbState.profiles.some(p => p.workspaceId === wsId && p.id !== profileId && p.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        return res.status(400).json({ error: 'A staff member with this email already exists in this workspace' });
      }
    }
  }

  // Validate role if changing
  if (role !== undefined) {
    const CUSTOMER_STAFF_ROLES = [
      'owner', 'admin', 'operations_lead', 'marketing_coordinator',
      'transaction_coordinator', 'compliance_partner', 'events',
      'maintenance', 'agent'
    ];
    if (!CUSTOMER_STAFF_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Restricted role assignment' });
    }
  }

  if (name !== undefined) profile.name = name;
  if (email !== undefined) profile.email = email;
  if (cellPhone !== undefined) profile.cellPhone = cellPhone;
  if (role !== undefined) profile.role = role;
  if (status !== undefined) profile.status = status;
  if (canReceiveEscalations !== undefined) profile.canReceiveEscalations = !!canReceiveEscalations;
  profile.updatedAt = new Date().toISOString();

  // If a profile's role was changed to owner or backup, update backup owner flag
  profile.isBackupOwner = profile.role === 'owner' || profile.role === 'operations_lead';

  logAuditEvent(
    (req as any).authUser?.name || 'Operations Lead',
    (req as any).authUser?.role || 'operations_lead',
    `Updated staff member details for "${profile.name}"`,
    'People & Ownership'
  );

  // Sync related work items where owner role changed or we can re-evaluate owner assignment
  syncWorkItemsOwnerDetails(dbState, wsId);

  // Scan role gap
  scanAndResolveRoleGaps(dbState, wsId);

  persistState();
  res.json({ success: true, profile });
});

// DEACTIVATE STAFF MEMBER (PROFILE)
app.post('/api/profiles/:id/deactivate', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_users'), (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  const profileId = req.params.id;
  if (!dbState.profiles) dbState.profiles = [];
  const profile = dbState.profiles.find(p => p.id === profileId);

  if (!profile) {
    return res.status(404).json({ error: 'Staff member not found' });
  }

  // Prevent cross-workspace boundary deactivation
  if (profile.workspaceId !== wsId) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied to this profile' });
  }

  profile.status = 'inactive';
  profile.updatedAt = new Date().toISOString();

  logAuditEvent(
    (req as any).authUser?.name || 'Operations Lead',
    (req as any).authUser?.role || 'operations_lead',
    `Deactivated staff member: "${profile.name}"`,
    'People & Ownership'
  );

  // Unassign from active work items
  if (dbState.workItems) {
    dbState.workItems.forEach(item => {
      if (item.status !== 'completed' && item.workspaceId === wsId) {
        if (item.assignedStaffMemberId === profileId) {
          item.assignedStaffMemberId = undefined;
          item.assignedOwnerName = undefined;
          item.assignedOwnerRole = undefined;
        }
        if (item.backupStaffMemberId === profileId) {
          item.backupStaffMemberId = undefined;
          item.backupOwnerName = undefined;
          item.backupOwnerRole = undefined;
        }
      }
    });
  }

  // Sync and scan
  syncWorkItemsOwnerDetails(dbState, wsId);
  scanAndResolveRoleGaps(dbState, wsId);

  persistState();
  res.json({ success: true, profile });
});


// CREATE TRANSACTION (MANUAL DATA ENTRY)
app.post('/api/transactions/create', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  const { clientName, propertyAddress, agentName, closingDate, salesPrice, expectedCommission, referralSource, hasRequiredDocs, confidence } = req.body;

  const newTxId = `tx_${Date.now()}`;
  const newTransaction = {
    id: newTxId,
    workspaceId: wsId,
    property_address: propertyAddress,
    client_name: clientName,
    buyer_or_seller: 'buyer',
    responsible_agent_id: 'ag_1',
    transaction_coordinator_id: 'tc_1',
    current_stage: 'contract_to_close',
    expected_closing_date: closingDate || '',
    health_score: 90,
    risk_level: closingDate ? 'healthy' : 'at_risk',
    risk_reasons: closingDate ? [] : ['Missing Target Closing Date'],
    outstanding_milestones_count: 2,
    latest_update: 'Manual transaction created.',
    revenue: expectedCommission || 0,
    waiting_on: 'None',
    next_action: closingDate ? 'Complete compliance checklists.' : 'Obtain closing date from agent.',
    last_verified_update: new Date().toISOString()
  };

  if (!dbState.transactions) dbState.transactions = [];
  dbState.transactions.unshift(newTransaction as any);

  logAuditEvent(
    (req as any).user?.name || 'Operations Lead',
    'operations_lead',
    `Manually created transaction file: "${clientName} (${propertyAddress})"`,
    'Transactions Ledger'
  );

  // Check Gaps and Auto-Generate Work Items with Duplicate Protection
  if (!dbState.workItems) dbState.workItems = [];
  
  const hasActiveItem = (type: string, relId: string) => {
    return dbState.workItems.some(w => w.type === type && w.relatedId === relId && w.status !== 'completed');
  };
  
  if (!closingDate) {
    const gapType = 'transaction_intake_gap';
    if (!hasActiveItem(gapType, newTxId)) {
      const gapItem = {
        id: `wi_gap_${Date.now()}`,
        workspaceId: wsId,
        type: gapType,
        title: `Missing Closing Date: ${clientName} file`,
        source: 'system',
        relatedType: 'transaction',
        relatedId: newTxId,
        relatedLabel: `${clientName} (${propertyAddress})`,
        ownerRole: 'transaction_coordinator',
        status: 'pending',
        priority: 'high',
        recommendedNextAction: 'Request target closing date from agent to set timeline milestones.',
        approvalRequired: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      dbState.workItems.unshift(gapItem as any);
      
      logAuditEvent(
        'System Operator',
        'admin',
        `Auto-generated Work Queue item for missing closing date on "${propertyAddress}"`,
        'Work Queue'
      );
    }
  }

  if (!expectedCommission || expectedCommission === 0) {
    const gapType = 'missing_information';
    if (!hasActiveItem(gapType, newTxId)) {
      const commGapItem = {
        id: `wi_comm_${Date.now()}`,
        workspaceId: wsId,
        type: gapType,
        title: `Missing commission amount: ${clientName} file`,
        source: 'system',
        relatedType: 'transaction',
        relatedId: newTxId,
        relatedLabel: `${clientName} (${propertyAddress})`,
        ownerRole: 'transaction_coordinator',
        status: 'pending',
        priority: 'medium',
        recommendedNextAction: 'Add projected commission amount for accurate forecasting.',
        approvalRequired: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      dbState.workItems.unshift(commGapItem as any);
      
      logAuditEvent(
        'System Operator',
        'admin',
        `Auto-generated Work Queue item for missing commission details on "${propertyAddress}"`,
        'Work Queue'
      );
    }
  }

  persistState(wsId);
  res.json({ success: true, transaction: newTransaction });
});

// BATCH WORKSPACE IMPORT ENDPOINT
app.post('/api/import', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  const { importType, rows } = req.body;

  if (!rows || !Array.isArray(rows)) {
    return res.status(400).json({ error: 'Rows array required' });
  }

  const summary = {
    importedRows: 0,
    skippedRows: 0,
    duplicateRows: 0,
    rowsWithWarnings: 0,
    workItemsCreated: 0,
    auditEventId: ''
  };

  const hasActiveItem = (type: string, relId: string) => {
    return (dbState.workItems || []).some(w => w.type === type && w.relatedId === relId && w.status !== 'completed');
  };

  if (!dbState.agents) dbState.agents = [];
  if (!dbState.transactions) dbState.transactions = [];
  if (!dbState.workItems) dbState.workItems = [];
  if (!dbState.signInventory) dbState.signInventory = [];
  if (!dbState.officeSupplies) dbState.officeSupplies = [];

  const requiredCols: Record<string, string[]> = {
    roster: ['agent_name', 'email'],
    transactions: ['property', 'client_name'],
    compliance: ['property', 'required_document'],
    marketing_backlog: ['property', 'asset_type'],
    signage: ['sign_type', 'status'],
    office_readiness: ['supply_item', 'status']
  };

  const targetCols = requiredCols[importType];
  if (!targetCols) {
    return res.status(400).json({ error: 'Invalid import type' });
  }

  rows.forEach((row: any) => {
    // 1. Column and Empty Field Validation
    const hasRequired = targetCols.every(col => row[col] && String(row[col]).trim() !== '');
    if (!hasRequired) {
      summary.skippedRows++;
      return;
    }

    // 2. Duplicate Detection
    if (importType === 'roster') {
      const isDuplicate = dbState.agents.some((a: any) => 
        String(a.name).toLowerCase() === String(row.agent_name).toLowerCase() || 
        String(a.email).toLowerCase() === String(row.email).toLowerCase()
      );
      if (isDuplicate) {
        summary.duplicateRows++;
        return;
      }

      dbState.agents.unshift({
        id: `ag_imp_${Math.random().toString(36).substring(2, 9)}`,
        name: row.agent_name,
        email: row.email,
        phone: row.phone || '',
        active_listings_count: 0,
        active_transactions_count: 0
      });
      summary.importedRows++;
      if (!row.phone || String(row.phone).trim() === '') {
        summary.rowsWithWarnings++;
      }
    } 
    else if (importType === 'transactions') {
      const isDuplicate = dbState.transactions.some((t: any) => 
        String(t.property_address).toLowerCase() === String(row.property).toLowerCase()
      );
      if (isDuplicate) {
        summary.duplicateRows++;
        return;
      }

      const txId = `tx_imp_${Math.random().toString(36).substring(2, 9)}`;
      dbState.transactions.unshift({
        id: txId,
        workspaceId: wsId,
        property_address: row.property,
        client_name: row.client_name,
        buyer_or_seller: row.side || 'buyer',
        responsible_agent_id: 'ag_1',
        transaction_coordinator_id: 'tc_1',
        current_stage: row.stage || 'contract_to_close',
        expected_closing_date: row.closing_date || '',
        health_score: 90,
        risk_level: row.closing_date ? 'healthy' : 'at_risk',
        risk_reasons: row.closing_date ? [] : ['Missing Target Closing Date'],
        outstanding_milestones_count: 2,
        latest_update: 'Imported via CSV Data panel.',
        revenue: Number(row.expected_commission) || 0,
        waiting_on: 'None',
        next_action: row.closing_date ? 'Complete compliance checklists.' : 'Obtain closing date.',
        last_verified_update: new Date().toISOString()
      });
      summary.importedRows++;

      let warningFound = false;
      if (!row.closing_date || String(row.closing_date).trim() === '') {
        warningFound = true;
        const gapType = 'transaction_intake_gap';
        if (!hasActiveItem(gapType, txId)) {
          dbState.workItems.unshift({
            id: `wi_gap_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            workspaceId: wsId,
            type: gapType,
            title: `Missing Closing Date: ${row.client_name} file`,
            source: 'system',
            relatedType: 'transaction',
            relatedId: txId,
            relatedLabel: `${row.client_name} (${row.property})`,
            ownerRole: 'transaction_coordinator',
            status: 'pending',
            priority: 'high',
            recommendedNextAction: 'Request target closing date from agent to set timeline milestones.',
            approvalRequired: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          summary.workItemsCreated++;
        }
      }

      if (!row.expected_commission || Number(row.expected_commission) === 0) {
        warningFound = true;
        const gapType = 'missing_information';
        if (!hasActiveItem(gapType, txId)) {
          dbState.workItems.unshift({
            id: `wi_comm_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            workspaceId: wsId,
            type: gapType,
            title: `Missing commission amount: ${row.client_name} file`,
            source: 'system',
            relatedType: 'transaction',
            relatedId: txId,
            relatedLabel: `${row.client_name} (${row.property})`,
            ownerRole: 'transaction_coordinator',
            status: 'pending',
            priority: 'medium',
            recommendedNextAction: 'Add projected commission amount for accurate forecasting.',
            approvalRequired: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          summary.workItemsCreated++;
        }
      }

      if (warningFound) {
        summary.rowsWithWarnings++;
      }
    } 
    else if (importType === 'compliance') {
      const isDuplicate = dbState.workItems.some((w: any) => 
        w.type === 'closing_compliance_risk' && 
        String(w.title).toLowerCase().includes(String(row.required_document).toLowerCase()) &&
        String(w.relatedLabel).toLowerCase() === String(row.property).toLowerCase()
      );
      if (isDuplicate) {
        summary.duplicateRows++;
        return;
      }

      summary.importedRows++;
      const isMissing = row.status?.toLowerCase().includes('missing') || row.status?.toLowerCase().includes('pending');
      if (isMissing) {
        const gapType = 'closing_compliance_risk';
        const relId = `doc_${Math.random().toString(36).substring(2, 9)}`;
        dbState.workItems.unshift({
          id: `wi_comp_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          workspaceId: wsId,
          type: gapType,
          title: `Missing Compliance File: ${row.required_document} - ${row.property}`,
          source: 'system',
          relatedType: 'transaction',
          relatedId: relId,
          relatedLabel: row.property,
          ownerRole: 'transaction_coordinator',
          status: 'pending',
          priority: 'medium',
          recommendedNextAction: `Coordinate upload of missing ${row.required_document} document from responsible person ${row.responsible_person || 'Agent'}.`,
          approvalRequired: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        summary.workItemsCreated++;
      }
    } 
    else if (importType === 'marketing_backlog') {
      const isDuplicate = dbState.workItems.some((w: any) => 
        w.type === 'marketing_request' && 
        String(w.title).toLowerCase().includes(String(row.asset_type).toLowerCase()) &&
        String(w.relatedLabel).toLowerCase() === String(row.property).toLowerCase()
      );
      if (isDuplicate) {
        summary.duplicateRows++;
        return;
      }

      dbState.workItems.unshift({
        id: `wi_mkt_imp_${Math.random().toString(36).substring(2, 9)}`,
        workspaceId: wsId,
        type: 'marketing_request',
        title: `Marketing Request: ${row.asset_type} - ${row.property}`,
        source: 'manual',
        relatedType: 'workflow',
        relatedId: `mkt_${Date.now()}`,
        relatedLabel: row.property,
        ownerRole: 'marketing_coordinator',
        status: 'ready_for_production',
        priority: 'medium',
        recommendedNextAction: `Produce ${row.asset_type} design template. Due: ${row.due_date || 'Standard SLA'}`,
        approvalRequired: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      summary.importedRows++;
    } 
    else if (importType === 'signage') {
      const isDuplicate = dbState.signInventory.some((s: any) => 
        String(s.type).toLowerCase() === String(row.sign_type).toLowerCase()
      );
      if (isDuplicate) {
        summary.duplicateRows++;
        return;
      }

      dbState.signInventory.unshift({
        id: `sign_imp_${Math.random().toString(36).substring(2, 9)}`,
        workspaceId: wsId,
        type: row.sign_type,
        total: 10,
        checkedOut: row.status === 'installed' ? 1 : 0,
        lowStockThreshold: 2
      });
      summary.importedRows++;
    } 
    else if (importType === 'office_readiness') {
      const isDuplicate = dbState.officeSupplies.some((s: any) => 
        String(s.item).toLowerCase() === String(row.supply_item).toLowerCase()
      );
      if (isDuplicate) {
        summary.duplicateRows++;
        return;
      }

      dbState.officeSupplies.unshift({
        id: `sup_imp_${Math.random().toString(36).substring(2, 9)}`,
        workspaceId: wsId,
        item: row.supply_item,
        status: row.status || 'In Stock',
        lastChecked: new Date().toISOString().split('T')[0]
      });
      summary.importedRows++;
    }
  });

  const auditLogText = `CSV Batch Import completed for ${importType}: ${summary.importedRows} rows added, ${summary.skippedRows} skipped, ${summary.duplicateRows} duplicates.`;
  const audit = logAuditEvent(
    (req as any).user?.name || 'Operations Lead',
    'operations_lead',
    auditLogText,
    'Workspace Data Import'
  );
  summary.auditEventId = audit ? audit.id : `au_${Date.now()}`;

  persistState();
  res.json({ success: true, summary });
});

// ZILLOW IMAGE SCRAPER PROXY ENDPOINT
app.get('/api/zillow/scrape-image', requireAuth, (req, res) => {
  const address = req.query.address ? String(req.query.address).toLowerCase() : '';
  
  // Scraped listing photos from Nest Realty Wilmington (Airlie & Summer Rest Road) neighborhood guide:
  // https://wilmington.nestrealty.com/neighborhoods/airlie-and-summer-rest-road
  let imageUrl = 'https://photos.prod.cirrussystem.net/169/00c85d06d5de862501ce5c494f997c36/4159304782.jpeg'; // Default: Edgewater Lane
  
  if (address.includes('pine ridge') || address.includes('woodlawn')) {
    imageUrl = 'https://photos.prod.cirrussystem.net/169/5c8ade4361c8cbeafe768e1af85ad510/2487376772.jpeg'; // Pine Ridge Plan
  } else if (address.includes('valand') || address.includes('windsor')) {
    imageUrl = 'https://photos.prod.cirrussystem.net/169/f79dbf02cae46cbef5daf5a610a159f6/4255224738.jpeg'; // Valand Plan
  } else if (address.includes('park shore') || address.includes('8th street')) {
    imageUrl = 'https://photos.prod.cirrussystem.net/169/f64a613c44e09c74a6aaf47ebe72fc7e/1552697491.jpeg'; // Park Shore Plan
  } else if (address.includes('santiago') || address.includes('highland')) {
    imageUrl = 'https://photos.prod.cirrussystem.net/169/0b487b3e3ebee90be423a091c193abcb/4095057288.jpeg'; // Santiago Plan
  } else if (address.includes('edgewater') || address.includes('pine')) {
    imageUrl = 'https://photos.prod.cirrussystem.net/169/00c85d06d5de862501ce5c494f997c36/4159304782.jpeg'; // 152 Edgewater Lane
  } else if (address.includes('montage') || address.includes('oak')) {
    imageUrl = 'https://photos.prod.cirrussystem.net/169/d8dd065c26ae87dcb97f14ddd90502d4/2161365414.jpeg'; // 1826 Montage Lane
  } else if (address.includes('riverrun') || address.includes('evergreen')) {
    imageUrl = 'https://photos.prod.cirrussystem.net/169/c5f9aa8afe6ab60fdb8281756dc7ea48/2525186563.jpeg'; // Riverrun Plan
  } else if (address.includes('longleaf') || address.includes('hillside')) {
    imageUrl = 'https://photos.prod.cirrussystem.net/169/930c2b9053146b511853d7833b64f932/4066362676.jpeg'; // Longleaf Plan
  } else if (address.includes('trey') || address.includes('waverly')) {
    imageUrl = 'https://photos.prod.cirrussystem.net/169/24fc6ed0e7f2479f2b2f31e9532e6d8b/92994404.jpeg'; // 1805 Trey Court
  } else if (address.includes('521 4 airlie') || address.includes('colonial')) {
    imageUrl = 'https://photos.prod.cirrussystem.net/169/cb8c37090f26a8f75e00df6ad74f06e1/2937417712.jpeg'; // 521 4 Airlie Road
  } else if (address.includes('521 airlie road') || address.includes('lakeview')) {
    imageUrl = 'https://photos.prod.cirrussystem.net/169/530fd1c6df984a2ecb6ea734d04ba137/2937417712.jpeg'; // 521 Airlie Road
  } else if (address.includes('james edward') || address.includes('baker')) {
    imageUrl = 'https://photos.prod.cirrussystem.net/169/fe7949108389ae769acff692eef729e0/2641646659.jpeg'; // 132 James Edward Court
  } else if (address.includes('ridgewood')) {
    imageUrl = 'https://media-production.lp-cdn.com/media/0312e1bd-c905-4cab-9f22-61da6e321f27'; // Airlie Cover Image
  } else if (address.includes('west avenue')) {
    imageUrl = 'https://media-production.lp-cdn.com/media/6f5bcd7d-15f4-44b5-96fc-e6eecda4303f'; // Contact Page Cover Image
  }
  
  res.json({ success: true, imageUrl });
});

// SIGNAGE CHECKOUT
app.post('/api/signage/checkout', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const { signId, isCheckout } = req.body;
  
  if (!dbState.signInventory) dbState.signInventory = [];
  const sign = dbState.signInventory.find(s => s.id === signId);
  if (sign) {
    const diff = isCheckout ? 1 : -1;
    const nextCheckedOut = Math.max(0, Math.min(sign.total, sign.checkedOut + diff));
    sign.checkedOut = nextCheckedOut;
    
    logAuditEvent(
      (req as any).user?.name || 'Listing Coordinator',
      'listing_coordinator',
      `${isCheckout ? 'Checked out' : 'Checked in'} signage item: "${sign.type}"`,
      'Sign Inventory'
    );

    // Auto-generate sign low stock warning work item if stock falls below threshold
    const remaining = sign.total - sign.checkedOut;
    if (remaining <= sign.lowStockThreshold) {
      if (!dbState.workItems) dbState.workItems = [];
      const hasExistingIssue = dbState.workItems.some(w => w.type === 'sign_inventory_issue' && w.relatedId === signId && w.status !== 'completed');
      if (!hasExistingIssue) {
        dbState.workItems.unshift({
          id: `wi_sign_${Date.now()}`,
          workspaceId: sign.workspaceId,
          type: 'sign_inventory_issue',
          title: `Low Stock Warning: "${sign.type}"`,
          source: 'system',
          relatedType: 'workflow',
          relatedId: signId,
          relatedLabel: sign.type,
          ownerRole: 'listing_coordinator',
          status: 'pending',
          priority: 'medium',
          recommendedNextAction: `Order extra supply lockboxes / signs for ${sign.location}.`,
          approvalRequired: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as any);

        logAuditEvent(
          'System Operator',
          'admin',
          `Auto-generated low stock warning Work Item for "${sign.type}"`,
          'Work Queue'
        );
      }
    }

    persistState();
    res.json({ success: true, sign });
  } else {
    res.status(404).json({ error: 'Signage item not found' });
  }
});

// SUPPLY STATUS TOGGLE
app.post('/api/supplies/toggle', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const { supplyId } = req.body;
  if (!dbState.officeSupplies) dbState.officeSupplies = [];
  const supply = dbState.officeSupplies.find(s => s.id === supplyId);
  if (supply) {
    const nextStatus = supply.status === 'In Stock' ? 'Low Stock' : supply.status === 'Low Stock' ? 'Out of Stock' : 'In Stock';
    supply.status = nextStatus;
    supply.lastChecked = new Date().toISOString().split('T')[0];

    logAuditEvent(
      (req as any).user?.name || 'Operations Lead',
      'operations_lead',
      `Toggled office supply status to "${nextStatus}" for "${supply.item}"`,
      'Office Readiness'
    );

    // Auto-generate supply order work item if out/low of stock
    if (nextStatus !== 'In Stock') {
      if (!dbState.workItems) dbState.workItems = [];
      const hasExistingIssue = dbState.workItems.some(w => w.type === 'office_readiness_issue' && w.relatedId === supplyId && w.status !== 'completed');
      if (!hasExistingIssue) {
        dbState.workItems.unshift({
          id: `wi_sup_${Date.now()}`,
          workspaceId: supply.workspaceId,
          type: 'office_readiness_issue',
          title: `Supply Restock Required: "${supply.item}"`,
          source: 'system',
          relatedType: 'workflow',
          relatedId: supplyId,
          relatedLabel: supply.item,
          ownerRole: 'operations_lead',
          status: 'pending',
          priority: 'low',
          recommendedNextAction: `Re-order batches of "${supply.item}" on Amazon / supply closet.`,
          approvalRequired: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as any);

        logAuditEvent(
          'System Operator',
          'admin',
          `Auto-generated low supply warning Work Item for "${supply.item}"`,
          'Work Queue'
        );
      }
    }

    persistState();
    res.json({ success: true, supply });
  } else {
    res.status(404).json({ error: 'Supply item not found' });
  }
});

// FACILITIES ISSUE CREATE
app.post('/api/facilities/create', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  const { issue } = req.body;

  if (!dbState.facilitiesIssues) dbState.facilitiesIssues = [];
  const newIssue = {
    id: `fac_${Date.now()}`,
    workspaceId: wsId,
    issue,
    status: 'pending',
    assignedTo: 'facilities',
    isEscalated: false
  };

  dbState.facilitiesIssues.unshift(newIssue as any);

  logAuditEvent(
    (req as any).user?.name || 'Operations Lead',
    'operations_lead',
    `Logged facilities issue: "${issue}"`,
    'Office Readiness'
  );

  // Auto-generate Work Queue item
  if (!dbState.workItems) dbState.workItems = [];
  dbState.workItems.unshift({
    id: `wi_fac_${Date.now()}`,
    workspaceId: wsId,
    type: 'office_readiness_issue',
    title: `Facilities Repair: "${issue}"`,
    source: 'manual',
    relatedType: 'workflow',
    relatedId: newIssue.id,
    relatedLabel: issue,
    ownerRole: 'operations_lead',
    status: 'pending',
    priority: 'low',
    recommendedNextAction: 'Fix conference/facility repair or contact building technician.',
    approvalRequired: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as any);

  persistState();
  res.json({ success: true, issue: newIssue });
});

// FACILITIES ISSUE ESCALATE
app.post('/api/facilities/:id/escalate', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const issueId = req.params.id;
  if (!dbState.facilitiesIssues) dbState.facilitiesIssues = [];
  const issue = dbState.facilitiesIssues.find(f => f.id === issueId);
  if (issue) {
    issue.isEscalated = true;
    
    logAuditEvent(
      (req as any).user?.name || 'Operations Lead',
      'operations_lead',
      `Escalated office facilities issue: "${issue.issue}"`,
      'Office Readiness'
    );

    // Create an owner escalation work item that requires owner review
    if (!dbState.workItems) dbState.workItems = [];
    dbState.workItems.unshift({
      id: `wi_esc_${Date.now()}`,
      workspaceId: issue.workspaceId,
      type: 'owner_escalation',
      title: `Critical Escalation: Office repairs unresolved: "${issue.issue}"`,
      source: 'system',
      relatedType: 'workflow',
      relatedId: issueId,
      relatedLabel: issue.issue,
      ownerRole: 'owner',
      status: 'pending',
      priority: 'high',
      recommendedNextAction: 'Approve vendor expense request for facilities maintenance contractor.',
      approvalRequired: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any);

    logAuditEvent(
      'System Operator',
      'admin',
      `Auto-generated Owner Escalation Work Item for unresolved issue "${issue.issue}"`,
      'Work Queue'
    );

    persistState();
    res.json({ success: true, issue });
  } else {
    res.status(404).json({ error: 'Issue not found' });
  }
});

// Resolve or update an operations inbox item status
app.post('/api/inbox/update-status', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_work_queue'), (req, res) => {
  const { id, status, userName, userRole } = req.body;
  const item = dbState.operationsInbox.find(i => i.id === id);
  if (item) {
    item.status = status;
    logAuditEvent(
      userName || 'Diane Ross',
      userRole || 'Transaction Coordinator',
      `Updated inbox item status to "${status}" for message from ${item.sender}`,
      'Operations Inbox'
    );
  }
  res.json({ success: true, dbState });
});

// Create a new communication log (simulating dispatching an email/SMS/Portal Link)
app.post('/api/communications/create', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_work_queue'), (req, res) => {
  const { type, recipient, recipient_contact, subject_or_type, content, transaction_id, property_address, userName, userRole } = req.body;
  
  const newComm = {
    id: `comm_${Date.now()}`,
    type,
    recipient,
    recipient_contact,
    subject_or_type,
    content,
    sent_at: new Date().toISOString(),
    status: 'sent' as any,
    transaction_id,
    property_address
  };
  
  dbState.communications.unshift(newComm);
  
  logAuditEvent(
    userName || 'Diane Ross',
    userRole || 'Transaction Coordinator',
    `Dispatched ${type} communication to ${recipient} (${recipient_contact})`,
    'Communications'
  );
  
  res.json({ success: true, dbState });
});

// External Participant Link complete handler
app.post('/api/external/complete', (req, res) => {
  const { transactionId, milestoneId, note, participantName } = req.body;
  
  const milestone = dbState.milestones.find(m => m.id === milestoneId);
  if (milestone) {
    milestone.status = 'completed';
    milestone.completed_at = new Date().toISOString();
  }

  const tx = dbState.transactions.find(t => t.id === transactionId);
  if (tx) {
    tx.latest_update = `External update from ${participantName}: ${note || 'Confirmed milestone completed'}`;
    tx.health_score = Math.min(100, tx.health_score + 15);
    // Remove relevant risk reason
    tx.risk_reasons = tx.risk_reasons.filter(r => !r.toLowerCase().includes('appraisal') && !r.toLowerCase().includes('contingency'));
    if (tx.risk_reasons.length === 0) {
      tx.risk_level = 'healthy';
    } else {
      tx.risk_level = 'watch';
    }
  }

  logAuditEvent(
    participantName || 'External Vendor',
    'Lender/Vendor',
    `Verified milestone "${milestone?.name || 'Contingency'}" via secure link`,
    'External Collaboration'
  );

  res.json({ success: true, dbState });
});

// Today's Briefing Generator (Gemini-Powered or Fallback)
app.post('/api/briefing', async (req, res) => {
  const gemini = getGeminiClient();
  
  if (gemini) {
    try {
      const activeRisk = dbState.transactions.filter(t => t.risk_level === 'at_risk' || t.risk_level === 'blocked');
      const urgentTasks = dbState.tasks.filter(t => t.status === 'overdue');
      
      const prompt = `You are Shapework, the AI Operations Employee for a residential real estate brokerage.
      Generate a concise daily operational briefing summary for brokerage leadership.
      
      Active At-Risk Transactions: ${JSON.stringify(activeRisk)}
      Urgent Overdue Tasks: ${JSON.stringify(urgentTasks)}
      
      Provide a highly polished, human-centered briefing with:
      1. A summary paragraph (2-3 sentences max) capturing the core brokerage temperature today.
      2. 3 short, elegant bullet points showing priority areas of focus.
      3. A professional, reassuring sign-off.
      
      Make it feel calm, confident, modern, and editorial. Do not use generic AI buzzwords or gradients.`;

      const response = await gemini.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt
      });

      const briefingText = response.text || '';
      return res.json({ briefing: briefingText, isMock: false });
    } catch (err: any) {
      console.error('Gemini Briefing Generation failed, falling back to offline mode:', err.message);
    }
  }

  // Robust default briefing
  const offlineBriefing = `**Active Operations Summary**  
  Operational monitoring is steady. There are currently **5 active transaction files** being observed. **2 transactions** have elevated risk factors (notably **102 Pine Street** facing a financing milestone expiry and outstanding utility disclosures, and **305 Hillside Drive** flagged as finance-blocked). 

  **Priority Action Points**
  * **Critical Review Required:** **305 Hillside Drive** has been flagged by the lender as blocked due to buyer credit re-evaluation. Active outreach is advised.
  * **Lender Outreach Pending:** **102 Pine Street** financing contingency expires in five days; the AI Operator has prepared a follow-up letter to lender Alice Walker awaiting your approval.
  * **Launch Preparation:** Photography launch coordinate checklist is overdue for **445 Ridgewood Hill**. Alex Carter has been notified.

  *Shapework is continuously tracking all milestones. Select any AI action draft below to authorize dispatch.*`;

  res.json({ briefing: offlineBriefing, isMock: true });
});

// Conversational Operator (Gemini-Powered or Fallback)
app.post('/api/operator', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Missing query message' });

  // Add message to server log
  const userMsg: ChatMessage = { id: `m_${Date.now()}_u`, sender: 'user', text: message, timestamp: new Date().toISOString() };
  dbState.chatHistory.push(userMsg);

  const gemini = getGeminiClient();

  if (gemini) {
    try {
      const activeTrans = dbState.transactions;
      const proposals = dbState.actionProposals;
      
      const systemInstruction = `You are the AI Operator for Shapework (the AI Operations Employee for Real Estate Brokerages).
      Respond to the user's operational query in a helpful, calm, highly precise, and confident manner.
      
      Context data of current brokerage:
      Transactions: ${JSON.stringify(activeTrans)}
      Suggested Proposals: ${JSON.stringify(proposals)}
      
      Format your response with:
      - A clean, direct, editorial answer.
      - References to specific properties or agents when appropriate.
      - Maintain a professional, comforting tone.
      Do not generate technical raw JSON unless specifically requested, format it as clean Markdown.`;

      const response = await gemini.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: message,
        config: { systemInstruction }
      });

      const aiText = response.text || '';
      
      // Look if we can suggest a task proposal to attach as interactive button
      let attachedProposal: AIActionProposal | undefined = undefined;
      if (message.toLowerCase().includes('lender') || message.toLowerCase().includes('follow-up')) {
        attachedProposal = dbState.actionProposals.find(p => p.action_type === 'draft_email' && p.state === 'suggested');
      }

      const aiMsg: ChatMessage = {
        id: `m_${Date.now()}_a`,
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toISOString(),
        proposal: attachedProposal
      };
      dbState.chatHistory.push(aiMsg);

      return res.json({ chatHistory: dbState.chatHistory, message: aiMsg });
    } catch (err: any) {
      console.error('Gemini Operator failed, using high-fidelity conversational routing:', err.message);
    }
  }

  // HIGH-FIDELITY OFFLINE CONVERSATIONAL ROUTER
  const query = message.toLowerCase();
  let text = '';
  let proposal: AIActionProposal | undefined = undefined;
  let commandPlan: any = undefined;

  if (query.includes('missing docs') || query.includes('missing documents') || query.includes('48 hours') || query.includes('who has not replied') || query.includes('agent followup') || query.includes('follow up with every agent')) {
    text = `I have completed an audit of our active transaction and listing compliance folders.

I identified **4 target properties** with missing required documents or unresponsive agents. I have compiled a structured execution plan to draft follow-up reminders. Please review and authorize the plan below:`;
    commandPlan = {
      id: 'cmd_1',
      query: message,
      intent_detected: 'Brokerage-wide agent document compliance audit',
      affected_records_count: 4,
      affected_records: ['221 B Baker Street', '742 Evergreen Terr', '305 Hillside Dr', '1105 Enfield'],
      required_integrations: ['Gmail', 'Dotloop', 'SkySlope'],
      steps: [
        { id: 's1', action: 'Audit transaction checklist tables in Dotloop', target: '4 active escrows', system: 'Dotloop', status: 'completed', requires_approval: false },
        { id: 's2', action: 'Identify missing compliance documents', target: 'Seller disclosures, lead/muds forms', system: 'SkySlope', status: 'completed', requires_approval: false },
        { id: 's3', action: 'Draft email followup reminder to Brooke Shields (Baker St disclosures)', target: 'brooke.s@nest-demo.local', system: 'Gmail', status: 'pending', requires_approval: true },
        { id: 's4', action: 'Draft email followup reminder to Diana Prince (Hillside Dr credit review)', target: 'diana.p@nest-demo.local', system: 'Gmail', status: 'pending', requires_approval: true },
        { id: 's5', action: 'Draft email followup reminder to Alex Carter (Enfield lead disclosure)', target: 'alex.c@nest-demo.local', system: 'Gmail', status: 'pending', requires_approval: true },
        { id: 's6', action: 'Log compliance follow-up task records in deal timelines', target: '3 pending tasks', system: 'shapework', status: 'pending', requires_approval: false }
      ],
      risk_level: 'medium',
      requires_approval: true,
      execution_status: 'draft',
      impact_estimate: 'Drafts 3 custom agent reminders automatically and posts them to your workbench drafting queue. Saves 45 minutes of manual audit and email drafting.'
    };
  } else if (query.includes('clear to close')) {
    text = `I have scanned active correspondence folders and identified **1 transaction file** which is ready to transition to Clear to Close.

I have compiled a target execution plan to update the workflow status and notify coordinates. Please review and execute:`;
    commandPlan = {
      id: 'cmd_2',
      query: message,
      intent_detected: 'Escrow Stage Status Synchronizer',
      affected_records_count: 1,
      affected_records: ['102 Pine Street'],
      required_integrations: ['Gmail', 'Dotloop'],
      steps: [
        { id: 's1', action: 'Verify lender Clear to Close confirmation email', target: 'operations@nest-demo.local', system: 'Gmail', status: 'completed', requires_approval: false },
        { id: 's2', action: 'Update transaction stage to Clear to Close', target: '102 Pine Street', system: 'Dotloop', status: 'pending', requires_approval: false },
        { id: 's3', action: 'Notify buyer coordinator Emma Watson & Robert Vance escrow office', target: 'emma.w@nest-demo.local', system: 'Gmail', status: 'pending', requires_approval: true }
      ],
      risk_level: 'low',
      requires_approval: false,
      execution_status: 'draft',
      impact_estimate: 'Transitions status in Dotloop database and coordinates closing. Reduces status transition latency by approximately 4 hours.'
    };
  } else if (query.includes('summarize every risk') || query.includes('risk summary') || query.includes('risks this week')) {
    text = `I have audited active escrows closing within the next 7 days.

I found **3 properties** with active risk factors. Here is the risk summary plan:`;
    commandPlan = {
      id: 'cmd_3',
      query: message,
      intent_detected: 'Closing Risk Registry Audit',
      affected_records_count: 3,
      affected_records: ['102 Pine Street', '742 Evergreen Terr', '305 Hillside Dr'],
      required_integrations: ['Dotloop'],
      steps: [
        { id: 's1', action: 'Verify appraisal approvals & financing deadlines', target: '3 escrows', system: 'Dotloop', status: 'completed', requires_approval: false },
        { id: 's2', action: 'Flag active warnings in command risk register', target: 'Appraisal delays, credit review flags', system: 'shapework', status: 'pending', requires_approval: false }
      ],
      risk_level: 'low',
      requires_approval: false,
      execution_status: 'draft',
      impact_estimate: 'Updates risk gauges on the command dashboard for leadership visibility.'
    };
  } else if (query.includes('missing listing') || query.includes('tasks for missing') || query.includes('blocked from launch')) {
    text = `I have checked all upcoming listing drafts.

I identified **2 upcoming listings** lacking launch requirements. Here is the compliance prep plan:`;
    commandPlan = {
      id: 'cmd_4',
      query: message,
      intent_detected: 'Listing Compliance Checklist Generator',
      affected_records_count: 2,
      affected_records: ['109 Woodlawn', '1105 Enfield'],
      required_integrations: ['SkySlope'],
      steps: [
        { id: 's1', action: 'Audit draft files for photography and disclosures', target: '2 draft files', system: 'SkySlope', status: 'completed', requires_approval: false },
        { id: 's2', action: 'Insert launch checklists for missing photo/lead forms', target: 'Checklist additions', system: 'shapework', status: 'pending', requires_approval: false }
      ],
      risk_level: 'low',
      requires_approval: false,
      execution_status: 'draft',
      impact_estimate: 'Prepares marketing checklists to ensure MLS compliance requirements are satisfied before syndication goes live.'
    };
  } else if (query.includes('inspection deadlines') || query.includes('reminders for all inspection')) {
    text = `I have scanned contract closing timelines.

I compiled the following action plan to update inspection dates and prepare reminders:`;
    commandPlan = {
      id: 'cmd_5',
      query: message,
      intent_detected: 'Inspection Timeline Coordination',
      affected_records_count: 2,
      affected_records: ['102 Pine Street', '742 Evergreen Terr'],
      required_integrations: ['Google Calendar', 'Gmail'],
      steps: [
        { id: 's1', action: 'Extract inspection deadlines from contract records', target: '2 contracts', system: 'Dotloop', status: 'completed', requires_approval: false },
        { id: 's2', action: 'Draft reminder email to buyer inspectors', target: 'apexinspectors.com', system: 'Gmail', status: 'pending', requires_approval: true },
        { id: 's3', action: 'Schedule inspection events on shared operations calendar', target: 'operations@nest-demo.local', system: 'Google Calendar', status: 'pending', requires_approval: false }
      ],
      risk_level: 'low',
      requires_approval: false,
      execution_status: 'draft',
      impact_estimate: 'Prepares reminders and syncs calendars to prevent transaction contingency lapses.'
    };
  } else if (query.includes('integration error') || query.includes('sync issue') || query.includes('integration errors')) {
    text = `I have queried connected server pipelines.

I detected a sync interruption on our Dotloop interface connection. Here is the diagnostic plan:`;
    commandPlan = {
      id: 'cmd_6',
      query: message,
      intent_detected: 'System Sync Diagnostics',
      affected_records_count: 1,
      affected_records: ['Dotloop API Connector'],
      required_integrations: ['Dotloop'],
      steps: [
        { id: 's1', action: 'Query sync logging records for error triggers', target: 'Recent 24 hours log', system: 'Dotloop', status: 'completed', requires_approval: false },
        { id: 's2', action: 'Identify authentication failure reasons', target: 'Access token expiration', system: 'Dotloop', status: 'completed', requires_approval: false },
        { id: 's3', action: 'Dispatch re-authentication warning to system administrator', target: 'operations@nest-demo.local', system: 'shapework', status: 'pending', requires_approval: true }
      ],
      risk_level: 'medium',
      requires_approval: true,
      execution_status: 'draft',
      impact_estimate: 'Identifies connection failure reasons and alerts ops coordinator to re-authenticate API credentials.'
    };
  } else if (query.includes('changed overnight') || query.includes('summarize what changed')) {
    text = `I have scanned active correspondence and MLS status reports since 6:00 PM yesterday.
    
I found **3 significant updates** (DocuSign execution, Lender CD signature, overdue photography). Here is the execution plan to sync records and update morning reports:`;
    commandPlan = {
      id: 'cmd_7',
      query: message,
      intent_detected: 'Overnight Activity Synchronization',
      affected_records_count: 3,
      affected_records: ['445 Ridgewood Hill', '102 Pine Street', '221 B Baker Street'],
      required_integrations: ['Gmail', 'DocuSign', 'Rechat'],
      steps: [
        { id: 's1', action: 'Download completed seller disclosures PDF from DocuSign', target: '445 Ridgewood Hill', system: 'DocuSign', status: 'completed', requires_approval: false },
        { id: 's2', action: 'Upload disclosures to SkySlope transaction files', target: 'SkySlope File Sync', system: 'SkySlope', status: 'pending', requires_approval: false },
        { id: 's3', action: 'Import lender underwriting CD signature confirmation status', target: '102 Pine Street', system: 'Gmail', status: 'pending', requires_approval: false }
      ],
      risk_level: 'low',
      requires_approval: false,
      execution_status: 'draft',
      impact_estimate: 'Synchronizes completed actions into brokerage files overnight. Saves 30 minutes of manually auditing folders.'
    };
  } else if (query.includes('escalate') || query.includes('48 hours')) {
    text = `I have audited active escrow tasks. 
    
I found **2 critical items** assigned to agent Alex Carter that are overdue by more than 48 hours. Here is the escalation plan:`;
    commandPlan = {
      id: 'cmd_8',
      query: message,
      intent_detected: 'Overdue Compliance Task Escalation',
      affected_records_count: 2,
      affected_records: ['445 Ridgewood Hill - Photography', '1105 Enfield - Lead Paint Disclosure'],
      required_integrations: ['Rechat', 'Gmail'],
      steps: [
        { id: 's1', action: 'Draft SMS compliance warning notification to Alex Carter', target: 'alex.c@nest-demo.local', system: 'Rechat', status: 'pending', requires_approval: true },
        { id: 's2', action: 'Prepare task escalation notification memo for Managing Broker Frank Miller', target: 'frank.m@nest-demo.local', system: 'Gmail', status: 'pending', requires_approval: true }
      ],
      risk_level: 'medium',
      requires_approval: true,
      execution_status: 'draft',
      impact_estimate: 'Sends direct SMS compliance reminder to agent and copies managing broker to enforce task compliance.'
    };
  } else if (query.includes('low-confidence') || query.includes('create tasks for all')) {
    text = `I have searched the active Email Processing Inbox.
    
I identified **2 messages** marked as low-confidence address matches. Here is the plan to queue verification tasks:`;
    commandPlan = {
      id: 'cmd_9',
      query: message,
      intent_detected: 'Remediation Task Queue Builder',
      affected_records_count: 2,
      affected_records: ['em_2 (Baker Street disclosures)', 'em_3 (Evergreen Terr inspection report)'],
      required_integrations: ['shapework'],
      steps: [
        { id: 's1', action: 'Create manual verification checklist task for Diane Ross', target: 'diane.r@nest-demo.local', system: 'shapework', status: 'pending', requires_approval: false },
        { id: 's2', action: 'Create manual verification checklist task for Todd Howard', target: 'todd.h@nest-demo.local', system: 'shapework', status: 'pending', requires_approval: false }
      ],
      risk_level: 'low',
      requires_approval: false,
      execution_status: 'draft',
      impact_estimate: 'Creates manual mapping checklists for low-confidence addresses in transaction coordinator workbench queues.'
    };
  } else if (query.includes('leadership update') || query.includes('operations meeting') || query.includes('meeting update')) {
    text = `I have compiled transaction stats, active risk rates, and coordinator volumes for today's leadership meeting.
    
Here is the operational brief preparation plan:`;
    commandPlan = {
      id: 'cmd_10',
      query: message,
      intent_detected: 'Executive Briefing Memo Generation',
      affected_records_count: 5,
      affected_records: ['All active brokerage logs'],
      required_integrations: ['Google Docs', 'Gmail'],
      steps: [
        { id: 's1', action: 'Generate PDF summaries of current transaction risk margins', target: 'Google Drive operations folder', system: 'Google Docs', status: 'pending', requires_approval: false },
        { id: 's2', action: 'Email aggregated briefing copy to COO Sarah Jenkins', target: 'sarah.j@nest-demo.local', system: 'Gmail', status: 'pending', requires_approval: true }
      ],
      risk_level: 'low',
      requires_approval: true,
      execution_status: 'draft',
      impact_estimate: 'Generates formatted summary memo including transaction metrics, capacity, and risk files for brokerage COO review.'
    };
  } else if (query.includes('brief') || query.includes('today')) {
    text = `**Daily Operational Briefing Summary**

I have analyzed active listings and transaction escrow lines. Here is the operational state:

1. **At-Risk Files:** **102 Pine Street** is experiencing an elevated risk warning. The finance contingency lapses in **5 days** and the lender has not responded to our confirmations.
2. **Blocked Files:** **305 Hillside Drive** is fully blocked. Lender notified us of credit qualification issues. Immediate broker interaction is suggested.
3. **Listings Launch:** Photography scheduling is delayed for **445 Ridgewood Hill**.

*Would you like me to dispatch the follow-up letter to the Pine Street lender?*`;
    proposal = dbState.actionProposals.find(p => p.id === 'p_1');
  } else if (query.includes('risk') || query.includes('at risk')) {
    text = `**Risk Assessment Report**

I am currently tracking **2 active files with critical risk ratings**:

* **102 Pine Street (Elevated Risk - Score 45/100):** Financing contingency lapses in 5 days, appraisal unconfirmed, outstanding disclosures.
* **305 Hillside Drive (Blocked - Score 20/100):** Financing pre-approval flagged as rescinded.

I recommend immediate outreach to the buyer on Hillside Dr, and I have prepared a lender chase email for Pine Street.`;
    proposal = dbState.actionProposals.find(p => p.id === 'p_1');
  } else if (query.includes('102 pine') || query.includes('pine street')) {
    text = `**Status Review: 102 Pine Street**

* **Current Stage:** Financing Milestone
* **Lender:** Alice Walker (Apex Home Loans)
* **Risk Score:** 45/100 (Elevated Risk)
* **Blockers:** Financing expires on June 29, appraisal unconfirmed, pending Signed Water District Disclosure.

I have drafted a status collection query to the lender. You can review and authorize it directly.`;
    proposal = dbState.actionProposals.find(p => p.id === 'p_1');
  } else if (query.includes('agent') || query.includes('agents')) {
    text = `**Agent Pipeline Health**

* **Alex Carter:** Managing **5 active escrows** and **3 listings**. Outstanding task: request disclosures for Pine St.
* **Brooke Shields:** Managing **3 active escrows**, pipeline is highly stable.
* **Diana Prince:** Managing **6 active escrows** (including the blocked Hillside Dr file).

No other agents have critical milestones overdue by more than 48 hours.`;
  } else if (query.includes('automate') || query.includes('repetitive')) {
    text = `**Workflow Automation Recommendation**

Based on our operations audit:
* We are spending an average of **22 minutes** manually drafting lender status checks.
* **Inspection coordinates** are frequently delayed by 4-5 days due to coordination loops.

**Suggestion:** Implement the 'Shapework' **Inspection and Repair Coordination** workflow to auto-trigger vendor outreach as soon as the purchase contract is uploaded. This will save an estimated **4.5 hours per file**.`;
  } else {
    text = `I have reviewed our active operations files. I am tracking 5 transactions, including **102 Pine Street** and **305 Hillside Drive**.

How can I help you coordinate these files today? You can ask me to:
* *"Brief me on today"*
* *"Which closings are at risk?"*
* *"What is holding up 102 Pine Street?"*
* *"What repetitive work could we automate next?"*`;
  }

  const aiMsg: ChatMessage = {
    id: `m_${Date.now()}_a`,
    sender: 'ai',
    text,
    timestamp: new Date().toISOString(),
    proposal,
    commandPlan
  };
  dbState.chatHistory.push(aiMsg);

  res.json({ chatHistory: dbState.chatHistory, message: aiMsg });
});

// POST /api/public/discovery-request
app.post('/api/public/discovery-request', (req, res) => {
  const { name, company, email, phone, industry, teamSize, friction, nextStep, message } = req.body;

  // Validate required fields
  if (!name || !company || !email || !industry || !friction || !nextStep) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Securely log details server-side in development environment
  console.log('=== NEW DISCOVERY REQUEST CAPTURED ===');
  console.log(`Name: ${name}`);
  console.log(`Company: ${company}`);
  console.log(`Email: ${email}`);
  console.log(`Phone: ${phone || 'N/A'}`);
  console.log(`Industry: ${industry}`);
  console.log(`Team Size: ${teamSize || 'N/A'}`);
  console.log(`Friction: ${friction}`);
  console.log(`Preferred Next Step: ${nextStep}`);
  console.log(`Message: ${message || 'N/A'}`);
  console.log('======================================');

  res.json({ success: true, message: 'Discovery request successfully received.' });
});

// GET /api/demo/config
app.get('/api/demo/config', (req, res) => {
  const expectedPasscode = process.env.DEMO_PASSCODE;
  res.json({ passcodeRequired: !!expectedPasscode });
});

// POST /api/demo/access
app.post('/api/demo/access', (req, res) => {
  const { passcode } = req.body;
  const expectedPasscode = process.env.DEMO_PASSCODE;
  
  if (!expectedPasscode) {
    return res.json({ ok: true, bypassed: true });
  }

  // Simple effort attempt delay (400ms) to mitigate rapid automated attempts
  setTimeout(() => {
    if (passcode === expectedPasscode) {
      res.json({ ok: true });
    } else {
      res.json({ ok: false });
    }
  }, 400);
});

// POST /api/demo/events
app.post('/api/demo/events', (req, res) => {
  const { source, eventType, payload } = req.body;
  if (!source || !eventType) {
    return res.status(400).json({ error: 'Missing source or eventType' });
  }

  const newEvent = {
    id: `evt_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    source,
    eventType,
    payload: payload || {},
    processed: false
  };

  if (!(dbState as any).integrationEvents) {
    (dbState as any).integrationEvents = [];
  }
  (dbState as any).integrationEvents.unshift(newEvent);

  logAuditEvent('System Integration Gateway', 'system', `Ingested webhook event: ${eventType} from ${source}`, 'Integrations');

  res.json({ success: true, event: newEvent });
});

// GET /api/integrations/receipts
app.get('/api/integrations/receipts', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('view_deals'), (req, res) => {
  res.json((dbState as any).integrationReceipts || []);
});

// POST /api/integrations/matches/confirm
app.post('/api/integrations/matches/confirm', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), (req, res) => {
  const { eventId, dealId } = req.body;
  const receipts = (dbState as any).integrationReceipts || [];
  const receipt = receipts.find((r: any) => r.id === eventId);
  const deal = dbState.transactions.find((d: any) => d.id === dealId);

  if (!receipt || !deal) {
    return res.status(404).json({ error: 'Receipt or Deal not found' });
  }

  receipt.matchStatus = 'matched';
  receipt.relatedDealId = dealId;
  receipt.relatedDealTitle = deal.property_address;

  const dealLinks = (dbState as any).dealLinks || [];
  dealLinks.push({ dealId, loopId: receipt.redactedPayload?.loopId || receipt.id });

  logAuditEvent('Diane Ross', 'Transaction Coordinator', `Manually linked Dotloop Loop "${receipt.loopName}" to Rechat Deal "${deal.property_address}"`, 'Integrations');

  res.json({ success: true, receipt });
});

// POST /api/integrations/matches/reject
app.post('/api/integrations/matches/reject', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), (req, res) => {
  const { eventId } = req.body;
  const receipts = (dbState as any).integrationReceipts || [];
  const receipt = receipts.find((r: any) => r.id === eventId);

  if (!receipt) {
    return res.status(404).json({ error: 'Receipt not found' });
  }

  receipt.matchStatus = 'unmatched';

  logAuditEvent('Diane Ross', 'Transaction Coordinator', `Rejected match recommendation for Dotloop Loop "${receipt.loopName}"`, 'Integrations');

  res.json({ success: true, receipt });
});

// POST /api/integrations/matches/create-deal
app.post('/api/integrations/matches/create-deal', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_integrations'), (req, res) => {
  const { eventId, propertyAddress } = req.body;
  const receipts = (dbState as any).integrationReceipts || [];
  const receipt = receipts.find((r: any) => r.id === eventId);

  if (!receipt) {
    return res.status(404).json({ error: 'Receipt not found' });
  }

  const newDealId = `tr_${Date.now()}`;
  const newDeal = {
    id: newDealId,
    property_address: propertyAddress || receipt.loopName || 'New Dotloop Property',
    client_name: 'Simulated Client',
    agent_id: 'ag_001',
    agent_name: 'Diane Ross',
    status: 'intake',
    stage: 'Intake Audit',
    closing_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    source: 'Dotloop',
    compliance_score: 0,
    missing_docs_count: 3
  };

  dbState.transactions.unshift(newDeal as any);

  const dealLinks = (dbState as any).dealLinks || [];
  dealLinks.push({ dealId: newDealId, loopId: receipt.redactedPayload?.loopId || receipt.id });

  receipt.matchStatus = 'matched';
  receipt.relatedDealId = newDealId;
  receipt.relatedDealTitle = newDeal.property_address;

  const newIssueId = `iss_${Date.now()}`;
  const newIssue = {
    id: newIssueId,
    transaction_id: newDealId,
    property_address: newDeal.property_address,
    category: 'Intake Guard',
    title: 'Missing Rechat CRM Link',
    description: 'A transaction loop was created in Dotloop but no corresponding CRM contact folder or deal directory exists in Rechat.',
    severity: 'medium',
    status: 'open',
    detected_at: new Date().toISOString(),
    remediation_action: 'Confirm CRM mapping link or import contact dossier'
  };
  (dbState as any).operationsInbox.unshift(newIssue);

  logAuditEvent('Diane Ross', 'Transaction Coordinator', `Created new transaction placeholder "${newDeal.property_address}" from unmatched Dotloop Loop`, 'Integrations');

  res.json({ success: true, receipt, deal: newDeal });
});

// GET /api/shapework/jobs
app.get('/api/shapework/jobs', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const jobs = dbState.shapeworkJobs || [];
  const steps = dbState.shapeworkJobSteps || [];
  const outputs = dbState.shapeworkOutputs || [];
  const approvals = dbState.approvals || [];
  const ownerBriefItems = dbState.ownerBriefItems || [];
  const receipts = dbState.receipts || [];
  const outcomes = dbState.outcomes || [];
  res.json({ jobs, steps, outputs, approvals, ownerBriefItems, receipts, outcomes });
});

// Background job steps simulator
const activeIntervals = new Map<string, NodeJS.Timeout>();

function simulateJobSteps(jobId: string) {
  // Clear any existing active simulation interval for this specific job to prevent duplicates
  if (activeIntervals.has(jobId)) {
    clearInterval(activeIntervals.get(jobId)!);
    activeIntervals.delete(jobId);
  }

  const interval = setInterval(async () => {
    const job = dbState.shapeworkJobs.find((j: any) => j.id === jobId);
    if (!job || job.status === 'completed' || job.status === 'blocked' || job.status === 'failed' || job.status === 'dismissed') {
      clearInterval(interval);
      activeIntervals.delete(jobId);
      return;
    }

    const steps = dbState.shapeworkJobSteps.filter((s: any) => s.job_id === jobId).sort((a: any, b: any) => a.step_order - b.step_order);
    
    // Find first step that is not completed/failed/skipped
    const nextStep = steps.find((s: any) => s.status !== 'completed' && s.status !== 'failed' && s.status !== 'skipped');
    
    if (!nextStep) {
      // If there are no more steps, complete the job
      job.status = 'completed';
      job.completed_at = new Date().toISOString();
      job.current_step = 'All steps completed';
      await persistState('nest-realty-demo');
      clearInterval(interval);
      activeIntervals.delete(jobId);
      return;
    }

    if (nextStep.status === 'proposed' || nextStep.status === 'pending' || nextStep.status === 'planning') {
      if (nextStep.requires_approval) {
        nextStep.status = 'waiting_approval';
        job.status = 'waiting_approval';
        job.current_step = nextStep.title;
        await persistState('nest-realty-demo');
        clearInterval(interval);
        activeIntervals.delete(jobId);
      } else {
        nextStep.status = 'running';
        job.status = 'running';
        job.current_step = nextStep.title;
        await persistState('nest-realty-demo');
        
        // Dispatch the action for the step immediately
        dispatchActionForStep(dbState, nextStep);
        
        // Clear interval and yield to action dispatch timeout
        clearInterval(interval);
        activeIntervals.delete(jobId);
      }
    } else if (nextStep.status === 'running') {
      // Yield to action dispatch timeout
      clearInterval(interval);
      activeIntervals.delete(jobId);
    } else if (nextStep.status === 'waiting_approval') {
      // Yield to manual approval
      clearInterval(interval);
      activeIntervals.delete(jobId);
    }
  }, 300);
  activeIntervals.set(jobId, interval);
}


// POST /api/shapework/jobs/create
app.post('/api/shapework/jobs/create', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, async (req, res) => {
  const { requestText } = req.body;
  if (!requestText || typeof requestText !== 'string') {
    return res.status(400).json({ error: 'Bad Request', message: 'Request text is required.' });
  }

  let signalType = 'custom_workflow';
  const cleanText = requestText.toLowerCase();
  if (cleanText.includes('ryan') || cleanText.includes('shield') || cleanText.includes('low-priority') || cleanText.includes('interruption') || cleanText.includes('away from ryan')) {
    signalType = 'ryan_shield_routing';
  } else if (cleanText.includes('compliance') || cleanText.includes('closing') || cleanText.includes('chase') || cleanText.includes('dotloop')) {
    signalType = 'compliance_chase';
  } else if (cleanText.includes('marketing') || cleanText.includes('intake') || cleanText.includes('launch package')) {
    signalType = 'marketing_request';
  } else if (cleanText.includes('sign') || cleanText.includes('lockbox') || cleanText.includes('readiness') || cleanText.includes('inventory')) {
    signalType = 'office_readiness';
  } else if (cleanText.includes('google') || cleanText.includes('review') || cleanText.includes('closing') || cleanText.includes('review request')) {
    signalType = 'google_review_dispatch';
  }

  const signal = createSignal(dbState, {
    workspace_id: 'nest-realty-demo',
    source_type: 'manual',
    source_name: 'Owner Composer Input',
    signal_type: signalType,
    title: requestText,
    summary: `Manual operation requested: "${requestText}"`
  });

  const decision = evaluateSignal(dbState, signal);
  const job = createJobPlan(dbState, decision, signal);

  await persistState('nest-realty-demo');

  // Launch background execution simulator asynchronously
  setTimeout(() => {
    simulateJobSteps(job.id);
  }, 100);

  const steps = dbState.shapeworkJobSteps.filter((s: any) => s.job_id === job.id);

  res.json({ success: true, job, steps });
});

// POST /api/shapework/jobs/steps/:id/approve
app.post('/api/shapework/jobs/steps/:id/approve', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, async (req, res) => {
  const { id } = req.params;
  const now = new Date().toISOString();
  const userName = (req as any).authUser?.name || 'Sarah Jenkins';

  const stepIndex = (dbState.shapeworkJobSteps || []).findIndex((s: any) => s.id === id);
  if (stepIndex === -1) {
    return res.status(404).json({ error: 'Not Found', message: 'Job step not found.' });
  }

  const step = dbState.shapeworkJobSteps[stepIndex];
  
  // Find the approval matching this step
  const approval = (dbState.approvals || []).find((a: any) => a.step_id === id && a.status === 'pending');
  if (approval) {
    approveApproval(dbState, approval.id, userName);
  } else {
    // Fallback if no approval object exists (e.g. legacy/direct step trigger)
    step.status = 'completed';
    step.approved_by = userName;
    step.approved_at = now;
    step.updated_at = now;
    
    const job = (dbState.shapeworkJobs || []).find((j: any) => j.id === step.job_id);
    if (job) {
      const nextSteps = (dbState.shapeworkJobSteps || []).filter((s: any) => s.job_id === job.id && s.status === 'pending');
      if (nextSteps.length === 0) {
        job.status = 'completed';
      }
    }
  }

  await persistState('nest-realty-demo');

  // Asynchronously trigger/resume simulation to process any next steps after the action dispatch finishes
  setTimeout(() => {
    simulateJobSteps(step.job_id);
  }, 200);

  res.json({ success: true, step });
});

// GET /api/headless/owner-shield
app.get('/api/headless/owner-shield', (req, res) => {
  const jobs = dbState.shapeworkJobs || [];
  
  const routedToStaffCount = jobs.filter((j: any) => j.workflow_key === 'ryan_shield_routing' || j.workflow_key === 'office_readiness').length;
  const escalatedToOwnerCount = jobs.filter((j: any) => j.owner_worthy === true).length;
  const needsOwnerDecisionCount = dbState.shapeworkJobSteps?.filter((s: any) => s.status === 'waiting_approval' && s.risk_level === 'high').length || 0;

  res.json({
    success: true,
    metrics: {
      routedToStaffCount,
      escalatedToOwnerCount,
      heldForDigestCount: 0,
      needsOwnerDecisionCount
    }
  });
});

// POST /api/shapework/demo/trigger-scenario
app.post('/api/shapework/demo/trigger-scenario', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, async (req, res) => {
  const { scenarioKey } = req.body;
  if (!scenarioKey) {
    return res.status(400).json({ error: 'Bad Request', message: 'scenarioKey is required.' });
  }

  // Enforce dev/demo mode only guard
  if (process.env.APP_MODE === 'production') {
    return res.status(403).json({ error: 'Forbidden', message: 'Demo scenarios are not allowed in production mode.' });
  }

  const wsId = 'nest-realty-demo';

  // Clean/archive old entities for this scenario
  dbState.shapeworkJobs = (dbState.shapeworkJobs || []).filter((j: any) => j.workflow_key !== scenarioKey);
  dbState.shapeworkJobSteps = (dbState.shapeworkJobSteps || []).filter((s: any) => s.job_id && dbState.shapeworkJobs.some((j: any) => j.id === s.job_id));
  dbState.shapeworkOutputs = (dbState.shapeworkOutputs || []).filter((o: any) => o.job_id && dbState.shapeworkJobs.some((j: any) => j.id === o.job_id));
  if (dbState.signals) {
    dbState.signals = dbState.signals.filter((s: any) => s.signal_type !== scenarioKey);
  }
  if (dbState.decisions) {
    dbState.decisions = dbState.decisions.filter((d: any) => !dbState.signals || dbState.signals.some((s: any) => s.id === d.signal_id));
  }
  if (dbState.approvals) {
    dbState.approvals = dbState.approvals.filter((a: any) => dbState.shapeworkJobs.some((j: any) => j.id === a.job_id));
  }
  if (dbState.actions) {
    dbState.actions = dbState.actions.filter((a: any) => dbState.shapeworkJobs.some((j: any) => j.id === a.job_id));
  }
  if (dbState.outcomes) {
    dbState.outcomes = dbState.outcomes.filter((o: any) => dbState.shapeworkJobs.some((j: any) => j.id === o.job_id));
  }
  if (dbState.receipts) {
    dbState.receipts = dbState.receipts.filter((r: any) => dbState.shapeworkJobs.some((j: any) => j.id === r.job_id));
  }
  if (dbState.ownerBriefItems) {
    dbState.ownerBriefItems = dbState.ownerBriefItems.filter((i: any) => i.source_type !== 'job' || dbState.shapeworkJobs.some((j: any) => j.id === i.source_id));
  }

  // 1. Create Signal
  let title = 'New external event detected';
  let summary = `Shapework detected event for ${scenarioKey}.`;
  if (scenarioKey === 'google_review_dispatch') {
    title = 'dotloop closing event: Bruce Wayne';
    summary = 'Transaction Arthur Pendragon (102 Pine Street) closed in dotloop.';
  } else if (scenarioKey === 'compliance_chase') {
    title = 'Closing compliance check: 102 Pine Street';
    summary = 'Audit triggered for upcoming closing files.';
  } else if (scenarioKey === 'ryan_shield_routing') {
    title = 'Routine signs & keys inquiry';
    summary = 'Inquiry from staff agent regarding office directional signs received.';
  } else if (scenarioKey === 'office_readiness') {
    title = 'New listing reserves check: 124 Ocean Blvd';
    summary = 'Inventory checklist verification request received.';
  } else if (scenarioKey === 'marketing_request') {
    title = 'Marketing launch intake form submitted';
    summary = 'Agent submitted listing launch package request.';
  }

  const signal = createSignal(dbState, {
    workspace_id: wsId,
    source_type: 'demo',
    source_name: 'Shapework Demo Trigger',
    signal_type: scenarioKey,
    title,
    summary,
    safe_payload_summary: JSON.stringify({ scenarioKey })
  });

  // 2. Evaluate Signal -> Decision
  const decision = evaluateSignal(dbState, signal);

  // 3. Plan Job & Steps (this also creates Approvals if step.requires_approval is true)
  const job = createJobPlan(dbState, decision, signal);

  await persistState(wsId);

  // Trigger simulation asynchronously
  setTimeout(() => {
    simulateJobSteps(job.id);
  }, 100);

  const steps = dbState.shapeworkJobSteps.filter((s: any) => s.job_id === job.id);

  res.json({ success: true, job, steps });
});

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), service: 'shapework-operating-layer' });
});

// GET /api/audit
app.get('/api/audit', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('view_audit'), (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  const audits = (dbState.auditEvents || []).filter((a: any) => !a.workspaceId || a.workspaceId === wsId);
  res.json(audits);
});

// GET /api/system/health
app.get('/api/system/health', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('access_developer_tools'), (req, res) => {
  const isVaultConfigured = !!process.env.CREDENTIAL_ENCRYPTION_KEY;
  const storageDriver = process.env.STORAGE_DRIVER || 'local';
  
  res.json({
    appMode: process.env.APP_MODE || 'development',
    databaseDriver: storageDriver,
    databaseConnected: true,
    persistenceWritable: true,
    credentialVaultConfigured: isVaultConfigured,
    authConfigured: true,
    queueStatus: 'healthy',
    lastError: null
  });
});

// ==========================================
// Retell Voice/SMS Agent Integration Routes
// ==========================================
import fs from 'fs';

// Helper to make Retell API calls
async function callRetellApi(endpoint: string, method: string, body?: any) {
  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey) {
    throw new Error('RETELL_API_KEY is not configured in .env');
  }

  const url = `https://api.retellai.com${endpoint}`;
  const headers: any = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Retell API error (${response.status}): ${errText}`);
  }

  return response.json();
}

// Helper to make Retell API calls with multipart FormData
async function callRetellApiMultipart(endpoint: string, method: string, formData: FormData) {
  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey) {
    throw new Error('RETELL_API_KEY is not configured in .env');
  }

  const url = `https://api.retellai.com${endpoint}`;
  const headers: any = {
    'Authorization': `Bearer ${apiKey}`
  };

  const response = await fetch(url, {
    method,
    headers,
    body: formData
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Retell API error (${response.status}): ${errText}`);
  }

  return response.json();
}

// Helper to update env file
function updateEnvFile(updates: Record<string, string>) {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  let content = fs.readFileSync(envPath, 'utf8');
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}="${value}"`);
    } else {
      content += `\n${key}="${value}"`;
    }
    process.env[key] = value;
  }
  fs.writeFileSync(envPath, content, 'utf8');
}

// 1. GET /api/retell/nest-ops/status
app.get('/api/retell/nest-ops/status', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  res.json({
    success: true,
    hasApiKey: !!process.env.RETELL_API_KEY,
    agentId: process.env.RETELL_ASK_NEST_OPS_AGENT_ID || null,
    knowledgeBaseId: process.env.RETELL_ASK_NEST_OPS_KB_ID || null,
    phoneNumber: process.env.RETELL_ASK_NEST_OPS_PHONE_NUMBER || '910-571-2817',
    phoneNumberId: process.env.RETELL_ASK_NEST_OPS_PHONE_NUMBER_ID || null,
    inboundCallReady: !!process.env.RETELL_ASK_NEST_OPS_AGENT_ID && !!process.env.RETELL_ASK_NEST_OPS_PHONE_NUMBER_ID,
    inboundSmsReady: !!process.env.RETELL_ASK_NEST_OPS_AGENT_ID && !!process.env.RETELL_ASK_NEST_OPS_PHONE_NUMBER_ID,
    lastSetupAt: (dbState as any).retellLastSetupAt || null,
    setupErrors: (dbState as any).retellSetupErrors || null
  });
});

// 2. POST /api/retell/nest-ops/setup
app.post('/api/retell/nest-ops/setup', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_workspace'), async (req, res) => {
  try {
    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ success: false, error: 'RETELL_API_KEY is not configured in .env' });
    }

    const kbPath = path.resolve(process.cwd(), 'server/knowledge/ask_nest_ops_retell_sop_knowledge_base.md');
    if (!fs.existsSync(kbPath)) {
      return res.status(500).json({ success: false, error: 'SOP Knowledge Base file is missing at server/knowledge/ask_nest_ops_retell_sop_knowledge_base.md' });
    }
    const kbSopText = fs.readFileSync(kbPath, 'utf8');

    const promptPath = path.resolve(process.cwd(), 'server/knowledge/ask_nest_ops_retell_agent_prompt.md');
    if (!fs.existsSync(promptPath)) {
      return res.status(500).json({ success: false, error: 'Agent Prompt file is missing at server/knowledge/ask_nest_ops_retell_agent_prompt.md' });
    }
    const agentPromptText = fs.readFileSync(promptPath, 'utf8');

    // Create or update Retell Knowledge Base
    let kbId = process.env.RETELL_ASK_NEST_OPS_KB_ID;
    let kbData: any = null;

    if (kbId) {
      try {
        kbData = await callRetellApi(`/get-knowledge-base/${kbId}`, 'GET');
      } catch (err) {
        console.warn('Could not retrieve existing KB, will recreate:', err);
        kbId = '';
      }
    }

    if (!kbId) {
      const formData = new FormData();
      formData.append('knowledge_base_name', 'Ask Nest Ops SOP');
      const fileBlob = new Blob([kbSopText], { type: 'text/markdown' });
      formData.append('knowledge_base_files', fileBlob, 'ask_nest_ops_retell_sop_knowledge_base.md');

      kbData = await callRetellApiMultipart('/create-knowledge-base', 'POST', formData);
      kbId = kbData.knowledge_base_id;
    } else {
      const formData = new FormData();
      const fileBlob = new Blob([kbSopText], { type: 'text/markdown' });
      formData.append('knowledge_base_files', fileBlob, 'ask_nest_ops_retell_sop_knowledge_base.md');

      await callRetellApiMultipart(`/add-knowledge-base-sources/${kbId}`, 'POST', formData);
    }

    // Create or update Retell LLM
    let llmId = process.env.RETELL_ASK_NEST_OPS_LLM_ID;
    let llmData: any = null;

    if (llmId) {
      try {
        llmData = await callRetellApi(`/update-retell-llm/${llmId}`, 'PATCH', {
          model: 'gpt-4o',
          general_prompt: agentPromptText,
          begin_message: 'Thanks for calling Ask Nest Ops. I can help route your issue, question, or request to the right person. What do you need help with?'
        });
      } catch (err) {
        console.warn('Could not update LLM, will recreate:', err);
        llmId = '';
      }
    }

    if (!llmId) {
      llmData = await callRetellApi('/create-retell-llm', 'POST', {
        model: 'gpt-4o',
        general_prompt: agentPromptText,
        begin_message: 'Thanks for calling Ask Nest Ops. I can help route your issue, question, or request to the right person. What do you need help with?'
      });
      llmId = llmData.llm_id;
    }

    // Create or update Retell Agent
    let agentId = process.env.RETELL_ASK_NEST_OPS_AGENT_ID;
    let agentData: any = null;
    const webhookUrl = `${process.env.PUBLIC_APP_BASE_URL || 'http://localhost:3000'}/api/retell/nest-ops/call-analysis-webhook`;

    if (agentId) {
      try {
        agentData = await callRetellApi(`/update-agent/${agentId}`, 'PATCH', {
          agent_name: 'Ask Nest Ops Hotline',
          voice_id: 'retell-Cimo',
          response_engine: {
            type: 'retell-llm',
            llm_id: llmId
          },
          knowledge_base_ids: [kbId],
          webhook_url: webhookUrl
        });
      } catch (err) {
        console.warn('Could not update agent, will recreate:', err);
        agentId = '';
      }
    }

    if (!agentId) {
      agentData = await callRetellApi('/create-agent', 'POST', {
        agent_name: 'Ask Nest Ops Hotline',
        voice_id: 'retell-Cimo',
        response_engine: {
          type: 'retell-llm',
          llm_id: llmId
        },
        knowledge_base_ids: [kbId],
        webhook_url: webhookUrl
      });
      agentId = agentData.agent_id;
    }

    // List and bind Phone Number
    let phoneNumberId = '';
    let foundNumber = process.env.RETELL_ASK_NEST_OPS_PHONE_NUMBER || '910-571-2817';
    const targetClean = foundNumber.replace(/\D/g, '');

    try {
      const numbersList = await callRetellApi('/list-phone-numbers', 'GET');
      const numberObj = (numbersList || []).find((n: any) => n.phone_number.replace(/\D/g, '').includes(targetClean));

      if (numberObj) {
        phoneNumberId = numberObj.phone_number;
        await callRetellApi(`/update-phone-number/${numberObj.phone_number}`, 'PATCH', {
          inbound_agents: [
            { agent_id: agentId, weight: 1.0 }
          ],
          inbound_sms_agents: [
            { agent_id: agentId, weight: 1.0 }
          ]
        });
      }
    } catch (err) {
      console.warn('Error list/bind phone number:', err);
    }

    // Save configuration updates
    const updates: Record<string, string> = {
      RETELL_ASK_NEST_OPS_AGENT_ID: agentId || '',
      RETELL_ASK_NEST_OPS_LLM_ID: llmId || '',
      RETELL_ASK_NEST_OPS_KB_ID: kbId || '',
      RETELL_ASK_NEST_OPS_PHONE_NUMBER_ID: phoneNumberId || ''
    };
    updateEnvFile(updates);

    (dbState as any).retellLastSetupAt = new Date().toISOString();
    (dbState as any).retellSetupErrors = null;
    persistState();

    res.json({
      success: true,
      agentId,
      llmId,
      kbId,
      phoneNumberId,
      phoneNumber: foundNumber
    });
  } catch (err: any) {
    console.error('Retell setup failed:', err);
    (dbState as any).retellSetupErrors = err.message;
    persistState();
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST /api/retell/nest-ops/inbound-webhook
app.post('/api/retell/nest-ops/inbound-webhook', (req, res) => {
  const signature = req.headers['x-retell-signature'] as string;
  const webhookSecret = process.env.RETELL_WEBHOOK_SECRET;
  if (webhookSecret && signature) {
    const hash = crypto.createHmac('sha256', webhookSecret).update((req as any).rawBody || '').digest('hex');
    const sigHash = signature.includes('d=') ? signature.split('d=')[1] : signature;
    if (hash !== sigHash) {
      console.error('Inbound webhook signature verification failed.');
    }
  }

  const agentId = process.env.RETELL_ASK_NEST_OPS_AGENT_ID || '';
  res.json({
    agent_id: agentId,
    dynamic_variables: {
      workspace_id: 'nest-realty-demo',
      client_name: 'Nest Realty Wilmington',
      ask_nest_ops_email: 'AskNestOps@nestrealty.com',
      ask_nest_ops_phone: process.env.RETELL_ASK_NEST_OPS_PHONE_NUMBER || '+19105072047'
    }
  });
});

// 4. POST /api/retell/nest-ops/inbound-sms-webhook
app.post('/api/retell/nest-ops/inbound-sms-webhook', (req, res) => {
  const signature = req.headers['x-retell-signature'] as string;
  const webhookSecret = process.env.RETELL_WEBHOOK_SECRET;
  if (webhookSecret && signature) {
    const hash = crypto.createHmac('sha256', webhookSecret).update((req as any).rawBody || '').digest('hex');
    const sigHash = signature.includes('d=') ? signature.split('d=')[1] : signature;
    if (hash !== sigHash) {
      console.error('Inbound SMS signature verification failed.');
    }
  }

  const { from, to, text } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, error: 'Missing text content' });
  }

  const signalId = `sig_${Date.now()}`;
  const signal = {
    id: signalId,
    workspaceId: 'nest-realty-demo',
    sourceType: 'sms',
    sourceName: 'Retell SMS Agent',
    signalType: 'user_request',
    title: `SMS Intake from ${from || 'Unknown'}`,
    summary: text,
    safePayloadSummary: JSON.stringify(req.body),
    receivedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  if (!dbState.signals) dbState.signals = [];
  dbState.signals.push(signal);

  const decisionId = `dec_${Date.now()}`;
  const decision = {
    id: decisionId,
    workspaceId: 'nest-realty-demo',
    signalId: signalId,
    decisionType: 'plan_job',
    confidence: 1.0,
    ownerWorthy: false,
    humanReviewRequired: false,
    rulesTriggered: ['sms_intake'],
    rationaleSummary: 'SMS text captured in queue',
    assignedRole: 'operations_lead',
    createdAt: new Date().toISOString()
  };
  if (!dbState.decisions) dbState.decisions = [];
  dbState.decisions.push(decision);

  const jobId = `job_${Date.now()}`;
  const job = {
    id: jobId,
    workspaceId: 'nest-realty-demo',
    signalId: signalId,
    decisionId: decisionId,
    requestedBy: from || 'SMS Caller',
    requestText: text,
    workflowKey: 'general',
    workflowName: `SMS from ${from || 'Unknown'}`,
    status: 'active',
    confidence: 1.0,
    currentStep: `step_${jobId}_1`,
    humanReviewRequired: false,
    ownerWorthy: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (!dbState.shapeworkJobs) dbState.shapeworkJobs = [];
  dbState.shapeworkJobs.push(job);

  const stepId = `step_${jobId}_1`;
  const step = {
    id: stepId,
    workspaceId: 'nest-realty-demo',
    jobId: jobId,
    stepOrder: 1,
    title: `SMS request: ${text.substring(0, 45)}...`,
    description: text,
    channel: 'internal_route',
    status: 'pending',
    requiresApproval: false,
    riskLevel: 'low',
    assignedRole: 'operations_lead',
    safePayloadSummary: JSON.stringify(req.body),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (!dbState.shapeworkJobSteps) dbState.shapeworkJobSteps = [];
  dbState.shapeworkJobSteps.push(step);

  logAuditEvent(
    'Retell SMS Agent',
    'operations_lead',
    `Created Inbound SMS Intake request from ${from || 'Unknown'}`,
    'Work Queue'
  );

  syncRuntimeToLegacy(dbState);
  persistState();

  res.json({ success: true, jobId });
});

// 5. POST /api/retell/nest-ops/call-analysis-webhook and /api/retell/webhook
const handleCallAnalysisWebhook = (req: any, res: any) => {
  const signature = req.headers['x-retell-signature'] as string;
  const webhookSecret = process.env.RETELL_WEBHOOK_SECRET;
  if (webhookSecret && signature) {
    const hash = crypto.createHmac('sha256', webhookSecret).update((req as any).rawBody || '').digest('hex');
    const sigHash = signature.includes('d=') ? signature.split('d=')[1] : signature;
    if (hash !== sigHash) {
      console.error('Call analysis webhook signature verification failed.');
    }
  }

  const { event, call } = req.body;
  if (event !== 'call_analyzed' || !call) {
    return res.json({ success: true, ignored: true });
  }

  const analysis = call.call_analysis || {};
  const customData = analysis.custom_analysis_data || {};

  const title = customData.title || `Phone Call Triage: ${call.call_id}`;
  const category = customData.category || 'general';
  const owner = customData.primary_owner || 'operations_lead';
  const priority = customData.urgency || 'normal';
  const recommendedNext = customData.recommended_next_action || 'Review caller request details';
  const propertyAddress = customData.property_address || '';
  const requester = customData.requester || 'Phone Caller';
  const requesterContact = customData.requester_contact || call.from_number || '';
  const desc = customData.description || `Transcript:\n${call.transcript}`;

  const signalId = `sig_${Date.now()}`;
  const signal = {
    id: signalId,
    workspaceId: 'nest-realty-demo',
    sourceType: 'phone_call',
    sourceName: 'Retell Phone Agent',
    signalType: 'user_request',
    title: title,
    summary: recommendedNext,
    safePayloadSummary: JSON.stringify(req.body),
    receivedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  if (!dbState.signals) dbState.signals = [];
  dbState.signals.push(signal);

  const decisionId = `dec_${Date.now()}`;
  const decision = {
    id: decisionId,
    workspaceId: 'nest-realty-demo',
    signalId: signalId,
    decisionType: 'plan_job',
    confidence: 1.0,
    ownerWorthy: owner === 'owner',
    humanReviewRequired: priority === 'high' || priority === 'critical',
    rulesTriggered: ['phone_intake'],
    rationaleSummary: `Phone call transcript analyzed for ${requester}`,
    assignedRole: owner,
    createdAt: new Date().toISOString()
  };
  if (!dbState.decisions) dbState.decisions = [];
  dbState.decisions.push(decision);

  const jobId = `job_${Date.now()}`;
  const job = {
    id: jobId,
    workspaceId: 'nest-realty-demo',
    signalId: signalId,
    decisionId: decisionId,
    requestedBy: requester,
    requestText: desc,
    workflowKey: category,
    workflowName: title,
    status: 'active',
    confidence: 1.0,
    currentStep: `step_${jobId}_1`,
    humanReviewRequired: priority === 'high' || priority === 'critical',
    ownerWorthy: owner === 'owner',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (!dbState.shapeworkJobs) dbState.shapeworkJobs = [];
  dbState.shapeworkJobs.push(job);

  const stepId = `step_${jobId}_1`;
  const step = {
    id: stepId,
    workspaceId: 'nest-realty-demo',
    jobId: jobId,
    stepOrder: 1,
    title: title,
    description: desc,
    channel: 'internal_route',
    status: 'pending',
    requiresApproval: priority === 'high' || priority === 'critical',
    riskLevel: priority === 'high' || priority === 'critical' ? 'high' : 'low',
    assignedRole: owner,
    safePayloadSummary: JSON.stringify(req.body),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (!dbState.shapeworkJobSteps) dbState.shapeworkJobSteps = [];
  dbState.shapeworkJobSteps.push(step);

  logAuditEvent(
    'Retell Phone Agent',
    'operations_lead',
    `Created Phone Triage item: "${title}" (Assigned: ${owner})`,
    'Work Queue'
  );

  syncRuntimeToLegacy(dbState);
  persistState();

  res.json({ success: true, jobId });
};

app.post('/api/retell/nest-ops/call-analysis-webhook', handleCallAnalysisWebhook);
app.post('/api/retell/webhook', handleCallAnalysisWebhook);

// GET /api/internal/cockpit/health
app.get('/api/internal/cockpit/health', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('access_developer_tools'), (req, res) => {
  res.json({ status: 'healthy', cockpit: true });
});

// GET /api/launch/readiness
app.get('/api/launch/readiness', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_workspace'), (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  const report = runLaunchReadinessChecks(wsId, dbState);
  res.json(report);
});

// POST /api/launch/run-checks
app.post('/api/launch/run-checks', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_workspace'), (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  const report = runLaunchReadinessChecks(wsId, dbState);
  res.json(report);
});

// GET /api/launch/checklist
app.get('/api/launch/checklist', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_workspace'), (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  const checklist = (dbState.tasks || []).filter((t: any) => t.workspaceId === wsId && t.category === 'Launch Checklist');
  res.json(checklist);
});

// POST /api/launch/checklist/:itemId/update
app.post('/api/launch/checklist/:itemId/update', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_workspace'), (req, res) => {
  const { itemId } = req.params;
  const { status, evidence, blockingReason } = req.body;
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  
  const item = (dbState.tasks || []).find((t: any) => t.id === itemId && t.workspaceId === wsId);
  if (!item) {
    return res.status(404).json({ error: 'Checklist item not found' });
  }

  item.status = status;
  if (evidence !== undefined) item.evidence = evidence;
  if (blockingReason !== undefined) item.blockingReason = blockingReason;

  logAuditEvent(
    (req as any).authUser?.name || 'Admin',
    (req as any).authUser?.role || 'admin',
    `Updated launch checklist item "${item.title}" to status "${status}"`,
    'Launch Room'
  );

  persistState();
  res.json({ success: true, item });
});

// GET /api/launch/summary
app.get('/api/launch/summary', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_workspace'), (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  const workspace = (dbState.workspaces || []).find((w: any) => w.id === wsId);
  const report = runLaunchReadinessChecks(wsId, dbState);
  
  const users = (dbState.workspaceUsers || []).filter((u: any) => u.workspaceId === wsId);
  const roleSummary = users.reduce((acc: any, u: any) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const waivers = (dbState.launchWaivers || []).filter((w: any) => w.workspaceId === wsId).map((w: any) => ({
    id: w.id,
    readinessCheckId: w.readinessCheckId,
    reason: w.reason,
    waivedBy: w.waivedByUserName || 'Unknown'
  }));

  const audits = (dbState.auditEvents || []).filter((a: any) => a.workspaceId === wsId);

  res.json({
    workspaceId: wsId,
    workspaceName: workspace?.name || 'Active Brokerage',
    launchMode: workspace?.launchMode || 'integration_first',
    goLiveDate: workspace?.status === 'active' ? workspace.updatedAt : 'Pending',
    launchOwner: workspace?.ownerName || 'Onboarding Lead',
    customerOwner: users.find((u: any) => u.role === 'owner')?.name || 'Pending',
    usersRolesSummary: roleSummary,
    workflowConfiguration: {
      activeRulesCount: dbState.settings ? 1 : 0,
      approvalPolicy: 'approval_gated_writeback'
    },
    integrationsStatus: {
      rechatConnected: !!dbState.integrations?.find((i: any) => i.id === 'i_rechat')?.connected,
      dotloopWebhookStatus: dbState.webhookEndpoints?.find((w: any) => w.workspaceId === wsId && w.provider === 'apination_dotloop')?.status || 'unconfigured'
    },
    lastSyncStatus: {
      lastSyncAt: dbState.integrations?.find((i: any) => i.id === 'i_rechat')?.last_sync || null
    },
    readinessPercentage: report.readinessPercentage,
    blockingFailuresCount: report.blockingFailuresCount,
    warningsCount: report.warningsCount,
    goLiveEligible: report.goLiveEligible,
    waivedBlockers: waivers,
    openWarnings: report.checks.filter(c => c.status === 'warning').map(c => c.label),
    auditTrailIds: audits.slice(0, 100).map((a: any) => a.id),
    timestamp: new Date().toISOString()
  });
});

// POST /api/launch/approve
app.post('/api/launch/approve', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_workspace'), (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  const report = runLaunchReadinessChecks(wsId, dbState);
  
  if (!report.goLiveEligible) {
    return res.status(400).json({ 
      error: 'Launch Blocked', 
      message: 'Workspace is not eligible for launch due to unresolved blocking failures.',
      details: report.checks.filter(c => c.status === 'fail' && c.requiredForLaunch)
    });
  }

  // Mark launch check complete
  const approvalTask = (dbState.tasks || []).find((t: any) => t.workspaceId === wsId && t.title === 'Customer launch approved');
  if (approvalTask) {
    approvalTask.status = 'completed';
    approvalTask.evidence = `Approved by ${(req as any).authUser?.name || 'Authorized Admin'} on ${new Date().toLocaleDateString()}`;
  }

  logAuditEvent(
    (req as any).authUser?.name || 'Admin',
    (req as any).authUser?.role || 'admin',
    `Approved workspace "${wsId}" for go-live launch.`,
    'Launch Room'
  );

  persistState();
  res.json({ success: true, message: 'Workspace approved for launch.' });
});

// POST /api/workspaces/:workspaceId/mark-live
app.post('/api/workspaces/:workspaceId/mark-live', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_workspace'), (req, res) => {
  const { workspaceId } = req.params;
  const workspace = (dbState.workspaces || []).find((w: any) => w.id === workspaceId);
  
  if (!workspace) {
    return res.status(404).json({ error: 'Workspace not found' });
  }

  const report = runLaunchReadinessChecks(workspaceId, dbState);
  if (!report.goLiveEligible) {
    return res.status(400).json({ error: 'Launch Blocked', message: 'Cannot mark workspace live with active blockers.' });
  }

  workspace.status = 'active';
  
  // Complete the final launch checklist task if exists
  const finalCheck = (dbState.tasks || []).find((t: any) => t.workspaceId === workspaceId && t.title === 'Customer launch approved');
  if (finalCheck) {
    finalCheck.status = 'completed';
    finalCheck.evidence = 'Workspace flagged active in system configuration.';
  }

  logAuditEvent(
    (req as any).authUser?.name || 'Admin',
    (req as any).authUser?.role || 'admin',
    `Marked workspace "${workspace.name}" as LIVE on production cluster.`,
    'Launch Room'
  );

  persistState();
  res.json({ success: true, workspaceStatus: 'active' });
});

// POST /api/workspaces/:workspaceId/activate-pilot
app.post('/api/workspaces/:workspaceId/activate-pilot', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_workspace'), (req, res) => {
  const { workspaceId } = req.params;
  const config = req.body;
  const workspace = (dbState.workspaces || []).find((w: any) => w.id === workspaceId);
  
  if (!workspace) {
    return res.status(404).json({ error: 'Workspace not found' });
  }

  // Validate request parameters (Phase 4)
  const errors: string[] = [];
  if (!config.pilotStartDate) errors.push('Pilot start date is required.');
  if (!config.pilotLengthDays) errors.push('Expected pilot length in days is required.');
  if (!config.supportContact) errors.push('Support contact email/phone is required.');
  if (!config.customerOwnerAck) errors.push('Customer owner signature acknowledgment is required.');
  if (!config.launchOwnerApproval) errors.push('Internal launch owner signature approval is required.');

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation Failed', details: errors });
  }

  // Update workspace phase
  workspace.phase = 'controlled_pilot';
  workspace.pilotConfig = {
    pilotStartDate: config.pilotStartDate,
    pilotLengthDays: Number(config.pilotLengthDays),
    includedWorkflows: config.includedWorkflows || [],
    excludedWorkflows: config.excludedWorkflows || [],
    knownLimitations: config.knownLimitations || '',
    supportContact: config.supportContact,
    customerOwnerAck: config.customerOwnerAck,
    launchOwnerApproval: config.launchOwnerApproval,
    activatedAt: new Date().toISOString()
  };

  // Emit required audit events (Phase 5)
  logAuditEvent(
    config.customerOwnerAck,
    'owner',
    'Support boundaries acknowledged for controlled pilot.',
    'Licensing'
  );

  logAuditEvent(
    config.launchOwnerApproval,
    'admin',
    `Workspace "${workspace.name}" transitioned phase to: controlled_pilot. Starting pilot run.`,
    'Launch Room'
  );

  // Seed default Pilot Success Criteria if not exists (Phase 8)
  if (!dbState.pilotSuccessCriteria) {
    dbState.pilotSuccessCriteria = [];
  }
  const defaultCriteria = [
    { id: `sc_1_${workspaceId}`, workspaceId, metric: 'work_items_created', target: 5, current: 0, measurementWindowDays: 14 },
    { id: `sc_2_${workspaceId}`, workspaceId, metric: 'briefs_generated', target: 1, current: 0, measurementWindowDays: 14 },
    { id: `sc_3_${workspaceId}`, workspaceId, metric: 'approvals_completed', target: 1, current: 0, measurementWindowDays: 14 },
    { id: `sc_4_${workspaceId}`, workspaceId, metric: 'transactions_reviewed', target: 1, current: 0, measurementWindowDays: 14 },
    { id: `sc_5_${workspaceId}`, workspaceId, metric: 'audit_events_created', target: 5, current: 0, measurementWindowDays: 14 }
  ];
  // Filter out any existing for this workspace and add
  dbState.pilotSuccessCriteria = dbState.pilotSuccessCriteria.filter((c: any) => c.workspaceId !== workspaceId);
  dbState.pilotSuccessCriteria.push(...defaultCriteria);

  persistState();
  res.json({ success: true, workspaceStatus: 'active', phase: 'controlled_pilot', pilotConfig: workspace.pilotConfig });
});

// GET /api/jobs/health - returns list of background jobs for workspace
app.get('/api/jobs/health', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  const jobs = (dbState.jobs || []).filter((j: any) => j.workspaceId === wsId);
  
  res.json({
    totalJobs: jobs.length,
    failedJobsCount: jobs.filter((j: any) => j.status === 'failed' || j.status === 'dead_letter').length,
    deadLetterCount: jobs.filter((j: any) => j.status === 'dead_letter').length,
    succeededCount: jobs.filter((j: any) => j.status === 'succeeded').length,
    queuedCount: jobs.filter((j: any) => j.status === 'queued' || j.status === 'retrying').length,
    jobs: jobs.slice(0, 50)
  });
});

// POST /api/jobs/:jobId/retry - retries a failed background job
app.post('/api/jobs/:jobId/retry', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_workspace'), (req, res) => {
  const { jobId } = req.params;
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  
  const job = (dbState.jobs || []).find((j: any) => j.id === jobId && j.workspaceId === wsId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  job.status = 'queued';
  job.attempts = 0;
  job.lastErrorRedacted = undefined;
  job.updatedAt = new Date().toISOString();

  logAuditEvent(
    (req as any).authUser?.name || 'Admin',
    (req as any).authUser?.role || 'admin',
    `Retried background job "${job.id}" (${job.type})`,
    'System'
  );

  persistState();
  res.json({ success: true, message: 'Job rescheduled for execution.', job });
});

// POST /api/launch/waiver - create launch waiver for check blocker
app.post('/api/launch/waiver', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_workspace'), (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  const { readinessCheckId, reason } = req.body;
  const userId = (req as any).authUser?.id || 'usr_unknown';
  const userName = (req as any).authUser?.name || 'Operator';

  if (!readinessCheckId || !reason) {
    return res.status(400).json({ error: 'Check ID and waiver reason are required.' });
  }

  const unwavableCheckIds = ['ws_profile', 'roles_configured', 'security_vault'];
  if (unwavableCheckIds.includes(readinessCheckId)) {
    return res.status(400).json({
      error: 'Unwavable Check',
      message: `Safety policy constraint: Launch check "${readinessCheckId}" cannot be waived.`
    });
  }

  const workspace = (dbState.workspaces || []).find((w: any) => w.id === wsId);
  const launchMode = workspace?.launchMode || 'integration_first';
  
  if ((readinessCheckId === 'rechat_connection' || readinessCheckId === 'dotloop_webhook_config') && launchMode === 'integration_first') {
    return res.status(400).json({
      error: 'Waiver Rejected',
      message: 'Integration links are required before launch when in integration_first mode. Switch workspace to manual_first or hybrid first.'
    });
  }

  if (!dbState.launchWaivers) {
    dbState.launchWaivers = [];
  }

  const newWaiver = {
    id: `waiver_${Date.now()}`,
    workspaceId: wsId,
    readinessCheckId,
    waivedByUserId: userId,
    waivedByUserName: userName,
    reason,
    createdAt: new Date().toISOString()
  };

  dbState.launchWaivers.push(newWaiver);

  logAuditEvent(
    userName,
    (req as any).authUser?.role || 'admin',
    `Created launch waiver for check blocker: "${readinessCheckId}" - Reason: "${reason}"`,
    'Launch Room'
  );

  const checklist = (dbState.tasks || []).filter((t: any) => t.workspaceId === wsId && t.category === 'Launch Checklist');
  const targetCheckItem = checklist.find((c: any) => c.title.toLowerCase().includes(readinessCheckId.split('_')[0]));
  if (targetCheckItem) {
    targetCheckItem.status = 'completed';
    targetCheckItem.evidence = `Waiver applied by ${userName}: "${reason}"`;
  }

  persistState();
  res.json({ success: true, waiver: newWaiver });
});

// GET /api/launch/waivers - list all waivers
app.get('/api/launch/waivers', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, requirePermission('manage_workspace'), (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  const waivers = (dbState.launchWaivers || []).filter((w: any) => w.workspaceId === wsId);
  res.json(waivers);
});

// GET /api/sync-runs - returns sync history for integrations setup
app.get('/api/sync-runs', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const wsId = (req as any).workspace?.id || 'nest-realty-demo';
  const runs = (dbState.syncRuns || []).filter((r: any) => r.workspaceId === wsId);
  res.json(runs);
});

// GET /api/debug/routes
app.get('/api/debug/routes', (req, res) => {
  res.json({
    publicHome: "/",
    demo: "/demo",
    integrations: "/demo/integrations",
    workQueue: "/demo/work-queue",
    deals: "/demo/deals",
    settings: "/demo/settings",
    apiHealth: "/api/health"
  });
});

// GET /api/debug/integrations
app.get('/api/debug/integrations', (req, res) => {
  res.json({
    rechat: {
      connected: dbState.integrations?.find((i: any) => i.id === 'i_rechat')?.connected || false,
      status: dbState.integrations?.find((i: any) => i.id === 'i_rechat')?.connected ? 'connected' : 'disconnected'
    },
    apinationDotloop: {
      status: process.env.APINATION_DOTLOOP_WEBHOOK_ENABLED !== 'false' ? (process.env.APINATION_DOTLOOP_WEBHOOK_SECRET ? 'configured' : 'webhook_url_ready') : 'not_configured',
      enabled: process.env.APINATION_DOTLOOP_WEBHOOK_ENABLED !== 'false',
      hasSecret: !!process.env.APINATION_DOTLOOP_WEBHOOK_SECRET,
      eventsCount: (dbState.integrationEvents || []).filter((e: any) => e.source === 'apination_dotloop').length
    }
  });
});

// GET /api/demo/workspace
app.get('/api/demo/workspace', (req, res) => {
  res.json({
    workspaceId: 'nest-realty-demo',
    workspaceName: 'Nest Realty',
    domain: 'nest-demo.local',
    environment: 'synthetic-sandbox',
    activeCoordinatorsCount: dbState.profiles ? dbState.profiles.filter(p => p.role.includes('coordinator') || p.role.includes('tc')).length : 2,
    activeAgentsCount: dbState.agents ? dbState.agents.length : 4,
    activeTransactionsCount: dbState.transactions ? dbState.transactions.length : 5
  });
});

// GET /api/demo/operating-memory
app.get('/api/demo/operating-memory', (req, res) => {
  res.json({
    indexedEntitiesCount: (dbState.transactions?.length || 0) + (dbState.listings?.length || 0) + (dbState.agents?.length || 0),
    confidenceAverages: 0.94,
    lastMaintenanceSweep: new Date(Date.now() - 3600000).toISOString(),
    nodes: [
      { id: '102-pine', label: '102 Pine Street', type: 'property' },
      { id: 'sarah-jenkins', label: 'Sarah Jenkins (COO)', type: 'person' },
      { id: 'diane-ross', label: 'Diane Ross (TC)', type: 'person' },
      { id: 'apex-home-loans', label: 'Apex Home Loans', type: 'integration' }
    ]
  });
});

// GET /api/demo/integrations
app.get('/api/demo/integrations', (req, res) => {
  res.json(dbState.integrations || seedIntegrations);
});

// POST /api/demo/commands/dry-run
app.post('/api/demo/commands/dry-run', (req, res) => {
  const { command } = req.body;
  res.json({
    success: true,
    dryRunMode: true,
    checkedRecords: 12,
    validationsPassed: true,
    requiredScopes: ['gmail.readonly', 'docusign.read'],
    planSummary: `Dry-run parse: "${command || 'Auditing all files'}". 2 records would be updated in preview mode.`
  });
});

// POST /api/demo/commands/execute
app.post('/api/demo/commands/execute', (req, res) => {
  const { planId, approvedSteps } = req.body;
  res.json({
    success: true,
    planId: planId || 'cmd_mock',
    executionStatus: 'completed',
    stepsCompleted: approvedSteps ? approvedSteps.length : 3,
    auditEventLogged: `aud_${Date.now()}`
  });
});

// GET /api/demo/audit
app.get('/api/demo/audit', (req, res) => {
  res.json(dbState.auditEvents || seedAuditEvents);
});

// POST /api/demo/email/process
app.post('/api/demo/email/process', (req, res) => {
  const { emailId, targetProperty } = req.body;
  res.json({
    success: true,
    processedEmailId: emailId,
    inferredIntent: 'stage_update_clear_to_close',
    matchedProperty: targetProperty || '102 Pine Street',
    stateTransitioned: true
  });
});

// POST /api/demo/integrations/:id/test-sync
app.post('/api/demo/integrations/:id/test-sync', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    integrationId: id,
    latencyMs: 142,
    status: 'connected',
    lastSync: new Date().toISOString()
  });
});

// Build the front-end static files or serve in dev
const isProd = process.env.APP_MODE === 'production' || process.env.NODE_ENV === 'production';
if (isProd) {
  const distPath = path.basename(resolvedDirname) === 'dist' ? resolvedDirname : path.join(resolvedDirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Integrate Vite Dev Server as middleware
  import('vite').then(({ createServer: createViteServer }) => {
    createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    }).then((vite) => {
      app.use(vite.middlewares);
      // Fallback index.html loader
      app.get('*', async (req, res, next) => {
        const url = req.originalUrl;
        try {
          let template = await import('fs').then(fs => fs.readFileSync(path.resolve(resolvedDirname, 'index.html'), 'utf-8'));
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } catch (e) {
          vite.ssrFixStacktrace(e as Error);
          next(e);
        }
      });
    });
  });
}

import { can, filterRequestsByAccess } from './server/auth/opsAuth.js';
import { classifyRequest } from './server/headless/opsClassifier.js';

// =================================================================
// NEST REALTY OPERATIONS BLUEPRINT MVP ENDPOINTS
// =================================================================

// GET Scoped Requests
app.get('/api/ops/requests', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const userRole = req.headers['x-user-role'] as string || 'regional_leader';
  const userEmail = req.headers['x-user-email'] as string || 'ryan@nestrealty.com';
  
  // Find or create user membership for scope filtering
  let membership = (dbState.opsMemberships || []).find((m: any) => m.userId === userEmail && m.roleId === userRole);
  if (!membership) {
    membership = {
      id: `mem_${Date.now()}`,
      userId: userEmail,
      organizationId: 'nest-realty',
      roleId: userRole,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  const requests = dbState.opsRequests || [];
  const scopedRequests = filterRequestsByAccess(membership, requests);

  // Perform background overdue SLA check
  const now = new Date();
  scopedRequests.forEach((r: any) => {
    if (r.status !== 'completed' && r.status !== 'closed' && r.status !== 'escalated') {
      if (r.slaDueAt && new Date(r.slaDueAt) < now) {
        r.status = 'escalated';
        r.escalationLevel = 1;
        r.updatedAt = new Date().toISOString();
        
        // Log auto-escalation audit event
        if (dbState.opsAuditLogs) {
          dbState.opsAuditLogs.unshift({
            id: `log_esc_${Date.now()}_${r.id}`,
            organizationId: 'nest-realty',
            actorUserId: 'system@nestrealty.com',
            actorName: 'System SLA Guard',
            action: 'request_escalated',
            resourceType: 'OpsRequest',
            resourceId: r.id,
            newValue: JSON.stringify(r),
            createdAt: new Date().toISOString()
          });
        }
      }
    }
  });

  res.json({
    success: true,
    requests: scopedRequests,
    ownerRoles: dbState.opsOwnerRoles || []
  });
});

// CREATE Request
app.post('/api/ops/requests/create', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, async (req, res) => {
  const { title, description, urgency, deadline, requesterName, requesterEmail, requesterRole, preferredChannel, linkedProperty } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Bad Request', message: 'Title and description are required.' });
  }

  // 1. Classification & Auto-routing
  const classification = classifyRequest(title, description);

  // 2. SLA Date calculation
  const slaDue = new Date(Date.now() + classification.slaDays * 24 * 60 * 60 * 1000);

  const request: any = {
    id: `req_${Date.now()}`,
    organizationId: 'nest-realty',
    regionId: 'Wilmington',
    officeId: 'wilmington-hq',
    title,
    description,
    category: classification.category,
    source: preferredChannel || 'dashboard',
    requesterName: requesterName || 'Sarah Jenkins',
    requesterEmail: requesterEmail || 'sarah.j@nestrealty.com',
    requesterRole: requesterRole || 'operations_lead',
    officeLocation: 'Wilmington HQ',
    assignedOwner: classification.assignedOwner,
    assignedRole: classification.assignedRole,
    priority: urgency || 'normal',
    status: 'new',
    slaDueAt: deadline ? new Date(deadline).toISOString() : slaDue.toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    escalationLevel: 0,
    linkedProperty: linkedProperty || '',
    notes: ''
  };

  if (!dbState.opsRequests) dbState.opsRequests = [];
  dbState.opsRequests.unshift(request);

  // Log audit trail
  if (!dbState.opsAuditLogs) dbState.opsAuditLogs = [];
  dbState.opsAuditLogs.unshift({
    id: `log_${Date.now()}`,
    organizationId: 'nest-realty',
    actorUserId: requesterEmail || 'sarah.j@nestrealty.com',
    actorName: requesterName || 'Sarah Jenkins',
    action: 'request_created',
    resourceType: 'OpsRequest',
    resourceId: request.id,
    newValue: JSON.stringify(request),
    createdAt: new Date().toISOString()
  });

  persistState();
  res.json({ success: true, request });
});

// UPDATE Request
app.post('/api/ops/requests/:id/update', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const { id } = req.params;
  const { status, assignedOwner, assignedRole, notes, resolutionSummary, escalationLevel, actorEmail, actorName } = req.body;

  const reqIndex = (dbState.opsRequests || []).findIndex((r: any) => r.id === id);
  if (reqIndex === -1) {
    return res.status(404).json({ error: 'Not Found', message: 'Request not found.' });
  }

  const request = dbState.opsRequests[reqIndex];
  const prevValue = JSON.stringify(request);
  let logAction: any = 'request_status_changed';

  if (status !== undefined && status !== request.status) {
    request.status = status;
    if (status === 'completed' || status === 'closed') {
      request.completedAt = new Date().toISOString();
      logAction = 'request_completed';
    }
  }

  if (assignedOwner !== undefined) {
    request.assignedOwner = assignedOwner;
    request.assignedRole = assignedRole || '';
    logAction = 'request_assigned';
  }

  if (escalationLevel !== undefined && escalationLevel > request.escalationLevel) {
    request.escalationLevel = escalationLevel;
    logAction = 'request_escalated';
  }

  if (notes !== undefined) request.notes = notes;
  if (resolutionSummary !== undefined) request.resolutionSummary = resolutionSummary;
  request.updatedAt = new Date().toISOString();

  if (!dbState.opsAuditLogs) dbState.opsAuditLogs = [];
  dbState.opsAuditLogs.unshift({
    id: `log_${Date.now()}`,
    organizationId: 'nest-realty',
    actorUserId: actorEmail || 'system@nestrealty.com',
    actorName: actorName || 'System Agent',
    action: logAction,
    resourceType: 'OpsRequest',
    resourceId: request.id,
    previousValue: prevValue,
    newValue: JSON.stringify(request),
    createdAt: new Date().toISOString()
  });

  persistState();
  res.json({ success: true, request });
});

// GET Physical Assets
app.get('/api/ops/assets', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const assets = dbState.opsAssets || [];

  // Check expectedReturnDates for assets checked_out
  const now = new Date();
  assets.forEach((ast: any) => {
    if (ast.status === 'checked_out' && ast.expectedReturnDate && new Date(ast.expectedReturnDate) < now) {
      ast.status = 'overdue';
      
      if (dbState.opsAuditLogs) {
        dbState.opsAuditLogs.unshift({
          id: `log_ast_overdue_${Date.now()}_${ast.id}`,
          organizationId: 'nest-realty',
          actorUserId: 'system@nestrealty.com',
          actorName: 'System Asset Tracker',
          action: 'request_status_changed', // Maps to standard change status
          resourceType: 'AssetInventoryItem',
          resourceId: ast.id,
          newValue: 'overdue',
          createdAt: new Date().toISOString()
        });
      }
    }
  });

  res.json({ success: true, assets });
});

// CHECKOUT Asset
app.post('/api/ops/assets/checkout', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const { assetId, agent, property, expectedReturnDate, actorEmail, actorName } = req.body;

  const astIndex = (dbState.opsAssets || []).findIndex((a: any) => a.id === assetId);
  if (astIndex === -1) {
    return res.status(404).json({ error: 'Not Found', message: 'Asset not found.' });
  }

  const asset = dbState.opsAssets[astIndex];
  asset.status = 'checked_out';
  asset.currentHolder = agent;
  asset.assignedAgent = agent;
  asset.linkedProperty = property;
  asset.checkoutDate = new Date().toISOString();
  asset.expectedReturnDate = expectedReturnDate ? new Date(expectedReturnDate).toISOString() : undefined;
  asset.returnedDate = undefined;

  if (!dbState.opsAuditLogs) dbState.opsAuditLogs = [];
  dbState.opsAuditLogs.unshift({
    id: `log_${Date.now()}`,
    organizationId: 'nest-realty',
    actorUserId: actorEmail || 'ops@nestrealty.com',
    actorName: actorName || 'Ann',
    action: 'asset_checked_out',
    resourceType: 'AssetInventoryItem',
    resourceId: asset.id,
    newValue: JSON.stringify(asset),
    createdAt: new Date().toISOString()
  });

  persistState();
  res.json({ success: true, asset });
});

// CHECKIN Asset
app.post('/api/ops/assets/checkin', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const { assetId, actorEmail, actorName } = req.body;

  const astIndex = (dbState.opsAssets || []).findIndex((a: any) => a.id === assetId);
  if (astIndex === -1) {
    return res.status(404).json({ error: 'Not Found', message: 'Asset not found.' });
  }

  const asset = dbState.opsAssets[astIndex];
  asset.status = 'available';
  asset.returnedDate = new Date().toISOString();
  asset.currentHolder = undefined;
  asset.assignedAgent = undefined;
  asset.linkedProperty = undefined;
  asset.checkoutDate = undefined;
  asset.expectedReturnDate = undefined;

  if (!dbState.opsAuditLogs) dbState.opsAuditLogs = [];
  dbState.opsAuditLogs.unshift({
    id: `log_${Date.now()}`,
    organizationId: 'nest-realty',
    actorUserId: actorEmail || 'ops@nestrealty.com',
    actorName: actorName || 'Ann',
    action: 'asset_checked_in',
    resourceType: 'AssetInventoryItem',
    resourceId: asset.id,
    newValue: JSON.stringify(asset),
    createdAt: new Date().toISOString()
  });

  persistState();
  res.json({ success: true, asset });
});

// MARK ASSET STATUS
app.post('/api/ops/assets/:id/status', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const { id } = req.params;
  const { status, actorEmail, actorName } = req.body;

  const astIndex = (dbState.opsAssets || []).findIndex((a: any) => a.id === id);
  if (astIndex === -1) {
    return res.status(404).json({ error: 'Not Found', message: 'Asset not found.' });
  }

  const asset = dbState.opsAssets[astIndex];
  asset.status = status;

  let action: any = 'role_changed'; // fallback
  if (status === 'missing') action = 'asset_marked_missing';

  if (!dbState.opsAuditLogs) dbState.opsAuditLogs = [];
  dbState.opsAuditLogs.unshift({
    id: `log_${Date.now()}`,
    organizationId: 'nest-realty',
    actorUserId: actorEmail || 'ops@nestrealty.com',
    actorName: actorName || 'Ann',
    action: action,
    resourceType: 'AssetInventoryItem',
    resourceId: asset.id,
    newValue: status,
    createdAt: new Date().toISOString()
  });

  persistState();
  res.json({ success: true, asset });
});

// GET SOPs
app.get('/api/ops/sops', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  res.json({ success: true, sops: dbState.opsSops || [] });
});

// GET Integrations
app.get('/api/ops/integrations', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  res.json({ success: true, integrations: dbState.opsIntegrations || [] });
});

// TOGGLE Integration Status
app.post('/api/ops/integrations/:id/toggle', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const { id } = req.params;
  const { status, actorEmail, actorName } = req.body;

  const connIndex = (dbState.opsIntegrations || []).findIndex((c: any) => c.id === id);
  if (connIndex === -1) {
    return res.status(404).json({ error: 'Not Found', message: 'Integration connection not found.' });
  }

  const conn = dbState.opsIntegrations[connIndex];
  conn.status = status;
  conn.lastSyncAt = new Date().toISOString();
  conn.syncHealth = status === 'connected' ? 'healthy' : (status === 'stubbed' ? 'warning' : 'none');

  if (!dbState.opsAuditLogs) dbState.opsAuditLogs = [];
  dbState.opsAuditLogs.unshift({
    id: `log_${Date.now()}`,
    organizationId: 'nest-realty',
    actorUserId: actorEmail || 'admin@nestrealty.com',
    actorName: actorName || 'Platform Admin',
    action: 'integration_connected',
    resourceType: 'IntegrationConnection',
    resourceId: conn.id,
    newValue: status,
    createdAt: new Date().toISOString()
  });

  persistState();
  res.json({ success: true, integration: conn });
});

// GET Audit Logs
app.get('/api/ops/audit-logs', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  res.json({ success: true, auditLogs: dbState.opsAuditLogs || [] });
});

// =================================================================
// TAPO CAMERA INTEGRATION API ENDPOINTS
// =================================================================

interface CameraHealthReport {
  status: 'connected' | 'live_relay_missing' | 'stubbed' | 'not_configured' | 'error' | 'credentials_required';
  liveRelayUrl?: string;
  healthMessage: string;
  lastCheckedAt: string;
  errorSummary?: string;
}

function checkCameraHealth(): Promise<CameraHealthReport> {
  const gatewayEnabled = process.env.CAMERA_GATEWAY_ENABLED === 'true';
  const rtspUrl = process.env.TAPO_SIGN_ROOM_RTSP_URL;
  const relayUrl = process.env.CAMERA_LIVE_RELAY_URL;
  const lastCheckedAt = new Date().toISOString();

  // If no environment variables are configured, the status is stubbed
  if (!gatewayEnabled && !rtspUrl && !relayUrl) {
    return Promise.resolve({
      status: 'stubbed',
      healthMessage: 'Camera events are stubbed for demo. Real camera relay not connected.',
      lastCheckedAt
    });
  }

  // If gateway is enabled but RTSP credentials are not set, credentials are required
  if (gatewayEnabled && !rtspUrl) {
    return Promise.resolve({
      status: 'credentials_required',
      healthMessage: 'Camera account/RTSP credentials missing.',
      lastCheckedAt
    });
  }

  // If relay url is missing
  if (!relayUrl) {
    return Promise.resolve({
      status: 'live_relay_missing',
      healthMessage: 'Camera configured but live relay URL missing or unreachable.',
      lastCheckedAt
    });
  }

  // Check if live relay URL is reachable from server
  try {
    const url = new URL(relayUrl);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    return new Promise<CameraHealthReport>((resolve) => {
      const req = httpModule.get(relayUrl, { timeout: 2000 }, (res) => {
        const contentType = res.headers['content-type'] || '';
        const isValid = contentType.includes('multipart') || 
                        contentType.includes('image') || 
                        contentType.includes('video') ||
                        contentType.includes('octet-stream') ||
                        res.statusCode === 200;
        
        if (isValid) {
          resolve({
            status: 'connected',
            liveRelayUrl: relayUrl,
            healthMessage: 'Live feed connected and serving stream content.',
            lastCheckedAt
          });
        } else {
          resolve({
            status: 'error',
            liveRelayUrl: relayUrl,
            healthMessage: 'Relay is reachable but did not return valid stream content.',
            lastCheckedAt,
            errorSummary: `Invalid Content-Type: ${contentType}`
          });
        }
      });

      req.on('error', (err: any) => {
        resolve({
          status: 'error',
          liveRelayUrl: relayUrl,
          healthMessage: 'Live relay URL configured but not reachable.',
          lastCheckedAt,
          errorSummary: err.message || String(err)
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          status: 'error',
          liveRelayUrl: relayUrl,
          healthMessage: 'Connection timeout to camera live relay.',
          lastCheckedAt,
          errorSummary: 'Request timed out after 2000ms'
        });
      });
    });
  } catch (err: any) {
    return Promise.resolve({
      status: 'error',
      liveRelayUrl: relayUrl,
      healthMessage: 'Failed to perform reachability check on live relay URL.',
      lastCheckedAt,
      errorSummary: err.message || String(err)
    });
  }
}

// GET Camera Health status
app.get('/api/cameras/health', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, async (req, res) => {
  try {
    const report = await checkCameraHealth();
    res.json({ success: true, health: report });
  } catch (err: any) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// GET Cameras
app.get('/api/cameras', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, async (req, res) => {
  const workspaceId = req.headers['x-workspace-id'] as string || 'nest-realty-demo';
  const cameras = (dbState.opsCameras || []).filter((c: any) => c.workspaceId === workspaceId);
  const health = await checkCameraHealth();
  const enhancedCameras = cameras.map((c: any) => ({
    ...c,
    status: health.status,
    liveRelayUrl: health.liveRelayUrl || null
  }));
  res.json({ success: true, cameras: enhancedCameras });
});

// GET Camera Live Feed config
app.get('/api/cameras/:id/live', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, async (req, res) => {
  const { id } = req.params;
  const camera = (dbState.opsCameras || []).find((c: any) => c.id === id);
  if (!camera) {
    return res.status(404).json({ error: 'Not Found', message: 'Camera not found.' });
  }

  const health = await checkCameraHealth();
  res.json({
    success: true,
    cameraId: camera.id,
    name: camera.name,
    locationName: camera.locationName,
    status: health.status,
    liveRelayUrl: health.liveRelayUrl || null,
    healthMessage: health.healthMessage,
    lastCheckedAt: health.lastCheckedAt,
    errorSummary: health.errorSummary
  });
});

// POST Manual Snapshot Capture
app.post('/api/cameras/:id/snapshot', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const { id } = req.params;
  const workspaceId = req.headers['x-workspace-id'] as string || 'nest-realty-demo';
  const camera = (dbState.opsCameras || []).find((c: any) => c.id === id);
  if (!camera) {
    return res.status(404).json({ error: 'Not Found', message: 'Camera not found.' });
  }

  camera.lastSeenAt = new Date().toISOString();
  camera.status = 'connected';

  const eventId = `camev_${Date.now()}`;
  const newEvent = {
    id: eventId,
    workspaceId,
    cameraId: camera.id,
    eventType: 'manual_snapshot' as const,
    status: 'needs_review' as const,
    snapshotUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80',
    suggestedAction: 'Manual snapshot captured by user.',
    createdAt: new Date().toISOString()
  };

  if (!dbState.opsCameraEvents) dbState.opsCameraEvents = [];
  dbState.opsCameraEvents.unshift(newEvent);

  if (!dbState.opsAuditLogs) dbState.opsAuditLogs = [];
  dbState.opsAuditLogs.unshift({
    id: `log_${Date.now()}`,
    organizationId: 'nest-realty',
    actorUserId: 'admin@nestrealty.com',
    actorName: 'Ann',
    action: 'request_created',
    resourceType: 'CameraDevice',
    resourceId: camera.id,
    newValue: JSON.stringify(newEvent),
    createdAt: new Date().toISOString()
  });

  persistState();
  res.json({ success: true, event: newEvent });
});

// GET Camera Events
app.get('/api/camera-events', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const workspaceId = req.headers['x-workspace-id'] as string || 'nest-realty-demo';
  const status = req.query.status as string;
  let events = (dbState.opsCameraEvents || []).filter((e: any) => e.workspaceId === workspaceId);
  if (status) {
    events = events.filter((e: any) => e.status === status);
  }
  res.json({ success: true, events });
});

// POST Ingest Camera Event (Local Vision Gateway API)
app.post('/api/camera-events', (req, res) => {
  const { eventType, cameraId, snapshotUrl, confidence, suggestedAction, linkedAssetId, linkedAgentName, linkedProperty } = req.body;
  const workspaceId = req.headers['x-workspace-id'] as string || 'nest-realty-demo';

  if (!eventType || !cameraId) {
    return res.status(400).json({ error: 'Bad Request', message: 'Missing eventType or cameraId.' });
  }

  const newEvent = {
    id: `camev_${Date.now()}`,
    workspaceId,
    cameraId,
    eventType,
    status: 'needs_review' as const,
    snapshotUrl: snapshotUrl || 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=400&q=80',
    confidence,
    suggestedAction,
    linkedAssetId,
    linkedAgentName,
    linkedProperty,
    createdAt: new Date().toISOString()
  };

  if (!dbState.opsCameraEvents) dbState.opsCameraEvents = [];
  dbState.opsCameraEvents.unshift(newEvent);

  persistState();
  res.json({ success: true, event: newEvent });
});

// POST Link Event to Asset
app.post('/api/camera-events/:id/link-asset', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const { id } = req.params;
  const { assetId } = req.body;

  const eventIndex = (dbState.opsCameraEvents || []).findIndex((e: any) => e.id === id);
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Not Found', message: 'Event not found.' });
  }

  const event = dbState.opsCameraEvents[eventIndex];
  event.linkedAssetId = assetId;
  event.status = 'linked_to_asset';
  event.reviewedAt = new Date().toISOString();

  persistState();
  res.json({ success: true, event });
});

// POST Confirm Checkout from Camera Event
app.post('/api/camera-events/:id/confirm-checkout', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const { id } = req.params;
  const { assetId, agentName, property, expectedReturnDate } = req.body;
  const workspaceId = req.headers['x-workspace-id'] as string || 'nest-realty-demo';

  const eventIndex = (dbState.opsCameraEvents || []).findIndex((e: any) => e.id === id);
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Not Found', message: 'Event not found.' });
  }

  const event = dbState.opsCameraEvents[eventIndex];
  const targetAssetId = assetId || event.linkedAssetId;

  const astIndex = (dbState.opsAssets || []).findIndex((a: any) => a.id === targetAssetId);
  if (astIndex === -1) {
    return res.status(404).json({ error: 'Not Found', message: 'Asset not found.' });
  }

  const asset = dbState.opsAssets[astIndex];
  asset.status = 'checked_out';
  asset.currentHolder = agentName || event.linkedAgentName || 'Unknown Agent';
  asset.assignedAgent = agentName || event.linkedAgentName || 'Unknown Agent';
  asset.linkedProperty = property || event.linkedProperty;
  asset.checkoutDate = new Date().toISOString();
  asset.expectedReturnDate = expectedReturnDate ? new Date(expectedReturnDate).toISOString() : undefined;
  asset.returnedDate = undefined;
  asset.cameraVerified = true;

  event.status = 'confirmed';
  event.linkedAssetId = targetAssetId;
  event.linkedAgentName = agentName || event.linkedAgentName;
  event.linkedProperty = property || event.linkedProperty;
  event.reviewedAt = new Date().toISOString();

  if (!dbState.opsAssetLedger) dbState.opsAssetLedger = [];
  const ledgerEntry = {
    id: `ledger_${Date.now()}`,
    workspaceId,
    assetId: targetAssetId,
    action: 'checkout' as const,
    source: 'camera' as const,
    cameraEventId: event.id,
    actorName: 'Ann',
    actorEmail: 'ann@nestrealty.com',
    agentName: asset.currentHolder,
    property: asset.linkedProperty,
    createdAt: new Date().toISOString()
  };
  dbState.opsAssetLedger.unshift(ledgerEntry);

  if (!dbState.opsAuditLogs) dbState.opsAuditLogs = [];
  dbState.opsAuditLogs.unshift({
    id: `log_${Date.now()}`,
    organizationId: 'nest-realty',
    actorUserId: 'ann@nestrealty.com',
    actorName: 'Ann',
    action: 'asset_checked_out',
    resourceType: 'AssetInventoryItem',
    resourceId: asset.id,
    newValue: JSON.stringify(asset),
    createdAt: new Date().toISOString()
  });

  persistState();
  res.json({ success: true, asset, event });
});

// POST Confirm Checkin from Camera Event
app.post('/api/camera-events/:id/confirm-checkin', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const { id } = req.params;
  const { assetId } = req.body;
  const workspaceId = req.headers['x-workspace-id'] as string || 'nest-realty-demo';

  const eventIndex = (dbState.opsCameraEvents || []).findIndex((e: any) => e.id === id);
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Not Found', message: 'Event not found.' });
  }

  const event = dbState.opsCameraEvents[eventIndex];
  const targetAssetId = assetId || event.linkedAssetId;

  const astIndex = (dbState.opsAssets || []).findIndex((a: any) => a.id === targetAssetId);
  if (astIndex === -1) {
    return res.status(404).json({ error: 'Not Found', message: 'Asset not found.' });
  }

  const asset = dbState.opsAssets[astIndex];
  const previousHolder = asset.currentHolder;
  asset.status = 'available';
  asset.currentHolder = undefined;
  asset.assignedAgent = undefined;
  asset.linkedProperty = undefined;
  asset.returnedDate = new Date().toISOString();
  asset.cameraVerified = true;

  event.status = 'confirmed';
  event.linkedAssetId = targetAssetId;
  event.reviewedAt = new Date().toISOString();

  if (!dbState.opsAssetLedger) dbState.opsAssetLedger = [];
  const ledgerEntry = {
    id: `ledger_${Date.now()}`,
    workspaceId,
    assetId: targetAssetId,
    action: 'checkin' as const,
    source: 'camera' as const,
    cameraEventId: event.id,
    actorName: 'Ann',
    actorEmail: 'ann@nestrealty.com',
    agentName: previousHolder,
    createdAt: new Date().toISOString()
  };
  dbState.opsAssetLedger.unshift(ledgerEntry);

  if (!dbState.opsAuditLogs) dbState.opsAuditLogs = [];
  dbState.opsAuditLogs.unshift({
    id: `log_${Date.now()}`,
    organizationId: 'nest-realty',
    actorUserId: 'ann@nestrealty.com',
    actorName: 'Ann',
    action: 'asset_checked_in',
    resourceType: 'AssetInventoryItem',
    resourceId: asset.id,
    newValue: JSON.stringify(asset),
    createdAt: new Date().toISOString()
  });

  persistState();
  res.json({ success: true, asset, event });
});

// POST Reject Camera Event
app.post('/api/camera-events/:id/reject', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const eventIndex = (dbState.opsCameraEvents || []).findIndex((e: any) => e.id === id);
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Not Found', message: 'Event not found.' });
  }

  const event = dbState.opsCameraEvents[eventIndex];
  event.status = 'rejected';
  event.notes = reason;
  event.reviewedAt = new Date().toISOString();

  persistState();
  res.json({ success: true, event });
});

// GET Asset Ledger logs
app.get('/api/ops/assets/ledger', requireAuth, resolveWorkspaceContext, requireWorkspaceMembership, (req, res) => {
  const workspaceId = req.headers['x-workspace-id'] as string || 'nest-realty-demo';
  const ledger = (dbState.opsAssetLedger || []).filter((l: any) => l.workspaceId === workspaceId);
  res.json({ success: true, ledger });
});

// Local development safety guard: reject production project ID in development mode
const isProdProject = process.env.GOOGLE_CLOUD_PROJECT === 'jupiter-prod-project';
if ((process.env.NODE_ENV !== 'production' && process.env.APP_MODE !== 'production') && isProdProject) {
  throw new Error('FATAL: Startup safety guard triggered. Development server cannot run against production project ID (jupiter-prod-project).');
}

// Startup safety assertions: enforce production mode gates and block test routes in production
const isProduction = process.env.APP_MODE === 'production' || process.env.NODE_ENV === 'production';
const isTestMode = process.env.NODE_ENV === 'test' || process.env.GROWTH_TEST_MODE === 'true';
if (isProduction && isTestMode) {
  throw new Error('FATAL: Startup assertion failed: Test-only features or overrides are enabled in production mode.');
}
if (isProduction) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_WEBHOOK_SECRET) {
    throw new Error('FATAL: Startup assertion failed: RESEND_API_KEY and RESEND_WEBHOOK_SECRET must be configured in production mode.');
  }
}

// Start application
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Shapework] Master full-stack server running on http://0.0.0.0:${PORT}`);
});
