/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IntegrationCategory } from './types';

export type IntegrationBacklogItem = {
  id: string;
  name: string;
  category: IntegrationCategory;
  priority: "core_mvp" | "important" | "future" | "long_tail";
  targetLevel: "catalog" | "demo_connector" | "sandbox_scaffold" | "production_scaffold";
  status:
    | "not_started"
    | "in_progress"
    | "blocked_credentials"
    | "blocked_partner_access"
    | "ready_for_review"
    | "completed";
  dependencies: string[];
  definitionOfDone: string[];
  notes: string[];
};

export const initialBacklog: IntegrationBacklogItem[] = [
  // --- CORE MVP CONNECTORS ---
  {
    id: "i_gmail",
    name: "Gmail Workspace",
    category: "Communication",
    priority: "core_mvp",
    targetLevel: "demo_connector",
    status: "completed",
    dependencies: [],
    definitionOfDone: ["Connector exists in registry", "Demo event triggers Email Triage Agent and updates Operating Memory", "Audit events generated"],
    notes: ["Core communication hub"]
  },
  {
    id: "i_outlook",
    name: "Microsoft Outlook / Exchange",
    category: "Communication",
    priority: "core_mvp",
    targetLevel: "demo_connector",
    status: "completed",
    dependencies: [],
    definitionOfDone: ["Connector exists in registry", "Demo event triggers Email Triage Agent and Closing Risk updates"],
    notes: ["Alternative email client"]
  },
  {
    id: "i_gcal",
    name: "Google Calendar",
    category: "Calendar",
    priority: "core_mvp",
    targetLevel: "demo_connector",
    status: "completed",
    dependencies: [],
    definitionOfDone: ["Connector exists in registry", "Calendar event updates Closing Risk Agent status"],
    notes: ["Google Calendar slots"]
  },
  {
    id: "i_mscal",
    name: "Microsoft Calendar",
    category: "Calendar",
    priority: "core_mvp",
    targetLevel: "demo_connector",
    status: "completed",
    dependencies: [],
    definitionOfDone: ["Connector exists in registry", "Calendar sync updates internal tasks in command center"],
    notes: ["Outlook calendar"]
  },
  {
    id: "i_gdrive",
    name: "Google Drive",
    category: "Documents",
    priority: "core_mvp",
    targetLevel: "demo_connector",
    status: "completed",
    dependencies: [],
    definitionOfDone: ["Connector exists in registry", "Upload events trigger Compliance Agent checking"],
    notes: ["Shared transaction files storage"]
  },
  {
    id: "i_onedrive",
    name: "OneDrive",
    category: "Documents",
    priority: "core_mvp",
    targetLevel: "demo_connector",
    status: "completed",
    dependencies: [],
    definitionOfDone: ["Connector exists in registry", "Buyer agency document uploads sync to Compliance Agent"],
    notes: ["Microsoft shared folders"]
  },
  {
    id: "i_sharepoint",
    name: "SharePoint",
    category: "Documents",
    priority: "core_mvp",
    targetLevel: "demo_connector",
    status: "completed",
    dependencies: [],
    definitionOfDone: ["Connector exists in registry", "SharePoint file updates trigger Compliance Agent checking"],
    notes: ["Corporate rule repositories"]
  },
  {
    id: "i_docusign",
    name: "DocuSign",
    category: "E-Signature",
    priority: "core_mvp",
    targetLevel: "demo_connector",
    status: "completed",
    dependencies: [],
    definitionOfDone: ["Connector exists in registry", "Completed envelope trigger Compliance Agent checking"],
    notes: ["Digital envelope signatures"]
  },
  {
    id: "i_dotloop",
    name: "Dotloop",
    category: "Transaction Management",
    priority: "core_mvp",
    targetLevel: "demo_connector",
    status: "completed",
    dependencies: [],
    definitionOfDone: ["Connector exists in registry", "Heartbeat sync fail updates Integration Health Agent"],
    notes: ["Loop folders"]
  },
  {
    id: "i_skyslope",
    name: "SkySlope",
    category: "Transaction Management",
    priority: "core_mvp",
    targetLevel: "demo_connector",
    status: "completed",
    dependencies: [],
    definitionOfDone: ["Connector exists in registry", "Compliance file omissions trigger alerts"],
    notes: ["SkySlope checklists"]
  },
  {
    id: "i_rechat",
    name: "Rechat",
    category: "CRM & Front Office",
    priority: "core_mvp",
    targetLevel: "demo_connector",
    status: "completed",
    dependencies: [],
    definitionOfDone: ["Connector exists in registry", "Deal stage sync updates Transaction Stage Agent"],
    notes: ["Primary CRM platform"]
  },
  {
    id: "i_fub",
    name: "Follow Up Boss",
    category: "CRM & Front Office",
    priority: "core_mvp",
    targetLevel: "demo_connector",
    status: "completed",
    dependencies: [],
    definitionOfDone: ["Connector exists in registry", "Delayed responsive alert triggers draft follow-ups"],
    notes: ["Lead pipeline system"]
  },
  {
    id: "i_reso",
    name: "RESO Web API",
    category: "MLS & Listings",
    priority: "core_mvp",
    targetLevel: "demo_connector",
    status: "completed",
    dependencies: [],
    definitionOfDone: ["Connector exists in registry", "Listing active updates syndications"],
    notes: ["MLS listing indexes"]
  },
  {
    id: "i_mls_manual",
    name: "CSV Import",
    category: "MLS & Listings",
    priority: "core_mvp",
    targetLevel: "demo_connector",
    status: "completed",
    dependencies: [],
    definitionOfDone: ["Connector exists in registry", "CSV uploading triggers local database imports"],
    notes: ["Manual file imports"]
  },
  {
    id: "i_generic_webhooks",
    name: "Generic Webhooks",
    category: "Automation & Webhooks",
    priority: "core_mvp",
    targetLevel: "demo_connector",
    status: "completed",
    dependencies: [],
    definitionOfDone: ["Connector exists in registry", "Ingests external milestone webhook dispatches"],
    notes: ["HTTP post payloads"]
  },
  {
    id: "i_zapier",
    name: "Zapier",
    category: "Automation & Webhooks",
    priority: "core_mvp",
    targetLevel: "demo_connector",
    status: "completed",
    dependencies: [],
    definitionOfDone: ["Connector exists in registry", "Zapier signal creates a new lead profile record match"],
    notes: ["Outbound automations bridge"]
  }
];
