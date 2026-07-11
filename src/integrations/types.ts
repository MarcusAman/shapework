/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IntegrationReadiness =
  | "connected_demo"
  | "demo_only"
  | "oauth_ready"
  | "api_key_ready"
  | "partner_approval_required"
  | "webhook_ready"
  | "csv_import"
  | "sftp_import"
  | "manual_upload"
  | "requires_credentials"
  | "requires_partner_access"
  | "production_roadmap"
  | "not_configured"
  | "error";

export type IntegrationAuthMethod =
  | "oauth"
  | "api_key"
  | "partner_api"
  | "webhook"
  | "csv"
  | "sftp"
  | "manual"
  | "none"
  | "unknown";

export type IntegrationCategory =
  | "Communication"
  | "Calendar"
  | "Documents"
  | "E-Signature"
  | "Transaction Management"
  | "CRM & Front Office"
  | "MLS & Listings"
  | "Showings & Access"
  | "Back Office & Accounting"
  | "Analytics & Reporting"
  | "Automation & Webhooks"
  | "AI & Data Infrastructure";

export type ConnectorDemoEvent = {
  id: string;
  label: string;
  description: string;
  eventType: string;
  sourceSystem: string;
  payload: Record<string, unknown>;
  expectedAgents: string[];
  expectedActions: string[];
  expectedAuditEvents: string[];
};

export type ConnectorTestResult = {
  connectorId: string;
  status: "success" | "warning" | "error";
  message: string;
  checkedAt: string;
};

export type ConnectorDemoResult = {
  connectorId: string;
  eventId: string;
  status: "created" | "failed";
  createdSignals: string[];
  activatedAgents: string[];
  createdActions: string[];
  createdAuditEvents: string[];
};

export type IntegrationConnector = {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  logoKey: string;
  readiness: IntegrationReadiness;
  priority: "core_mvp" | "important" | "future" | "long_tail";
  authMethod: IntegrationAuthMethod;
  productionStatus:
    | "demo"
    | "architecture_ready"
    | "requires_credentials"
    | "requires_partner_access"
    | "ready_for_backend"
    | "future";
  readCapabilities: string[];
  writeCapabilities: string[];
  webhookSupport: "yes" | "no" | "unknown" | "partner_dependent";
  dataObjects: string[];
  dependentAgents: string[];
  automationExamples: string[];
  approvalRequiredFor: string[];
  riskNotes: string[];
  setupChecklist: string[];
  demoEvents?: ConnectorDemoEvent[];
  testConnectionDemo?: () => Promise<ConnectorTestResult>;
  runDemoEvent?: (eventId: string) => Promise<ConnectorDemoResult>;
  
  // Staging metrics for demo states
  connected: boolean;
  lastSync?: string;
  recordsSynchronized: number;
  errorsCount: number;
  recentErrors?: string[];
  docsUrlLabel?: string;
};
