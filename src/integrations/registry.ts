/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IntegrationConnector, ConnectorDemoEvent } from './types';
import { initialCatalogConnectors } from '../data/integrationCatalog';
import { createIntegrationConnector } from './connectorFactory';
import { createConnectorDemoEvent } from './connectorEvents';

// Gmail Workspace Demo Events
const gmailDemoEvents: ConnectorDemoEvent[] = [
  createConnectorDemoEvent(
    'evt_gmail_clear_to_close',
    'Lender email says 102 Pine Street is clear to close.',
    'Ingest lender email confirming clear to close stage on 102 Pine St.',
    'gmail.clear_to_close',
    'Gmail Workspace',
    { subject: 'Underwriting Approved / Clear to Close - 102 Pine St' },
    ['Email Triage Agent', 'Transaction Stage Agent'],
    ['Update stage to closing prep'],
    ['Ingested lender email notice']
  )
];

// Outlook Workspace Demo Events
const outlookDemoEvents: ConnectorDemoEvent[] = [
  createConnectorDemoEvent(
    'evt_outlook_date_change',
    'Attorney email changes closing appointment.',
    'Ingest attorney mail request to push closing date by 2 days.',
    'outlook.date_change',
    'Microsoft Outlook',
    { subject: 'Schedule Update: 742 Evergreen Terr Close' },
    ['Email Triage Agent', 'Closing Risk Agent'],
    ['Gated material date change approval request'],
    ['Ingested attorney schedule update']
  )
];

// Google Calendar Demo Events
const gcalDemoEvents: ConnectorDemoEvent[] = [
  createConnectorDemoEvent(
    'evt_gcal_close_delay',
    'Closing appointment moved by two days.',
    'Google Calendar event closing appointment postponed 2 days.',
    'gcal.close_delay',
    'Google Calendar',
    { title: 'Postpone Close - 742 Evergreen Terr' },
    ['Closing Risk Agent'],
    ['Update transaction expected close date'],
    ['Calendar escrow close date adjusted']
  )
];

// Microsoft Calendar Demo Events
const mscalDemoEvents: ConnectorDemoEvent[] = [
  createConnectorDemoEvent(
    'evt_mscal_review_meeting',
    'Coordinator review meeting added for at-risk transaction.',
    'Outlook Exchange calendar invites internal TC review meeting.',
    'mscal.review_meeting',
    'Microsoft Calendar',
    { title: 'At-risk TC Review - 908 Colonial Ave' },
    ['AI COO Orchestrator'],
    ['Create internal follow-up checklist task'],
    ['Meeting sync scheduled']
  )
];

// Google Drive Demo Events
const gdriveDemoEvents: ConnectorDemoEvent[] = [
  createConnectorDemoEvent(
    'evt_gdrive_disclosure',
    'Seller disclosure PDF added to transaction folder.',
    'Google Drive webhook flags new PDF upload in folder.',
    'gdrive.file_upload',
    'Google Drive',
    { fileName: 'Seller_Disclosure_Signed.pdf', property: '742 Evergreen Terr' },
    ['Compliance Agent'],
    ['Mark checklist document received'],
    ['New folder document uploaded']
  )
];

// OneDrive Demo Events
const onedriveDemoEvents: ConnectorDemoEvent[] = [
  createConnectorDemoEvent(
    'evt_onedrive_agency',
    'Buyer agency agreement uploaded to shared transaction folder.',
    'OneDrive webhook detects new representation file upload.',
    'onedrive.file_upload',
    'OneDrive',
    { fileName: 'Buyer_Agency_Agreement.pdf', property: '102 Pine St' },
    ['Compliance Agent'],
    ['Mark checklist document received'],
    ['OneDrive sync completed']
  )
];

// SharePoint Demo Events
const sharepointDemoEvents: ConnectorDemoEvent[] = [
  createConnectorDemoEvent(
    'evt_sharepoint_checklist',
    'Broker review checklist updated.',
    'SharePoint document sync logs updated checklist files.',
    'sharepoint.file_update',
    'SharePoint',
    { fileName: 'TC_Broker_Review_Checklist.docx' },
    ['Compliance Agent'],
    ['Update broker review status'],
    ['SharePoint file synced']
  )
];

// DocuSign Demo Events
const docusignDemoEvents: ConnectorDemoEvent[] = [
  createConnectorDemoEvent(
    'evt_docusign_disclosure',
    'Envelope completed for seller disclosure.',
    'DocuSign envelope status completed. Downloaded executed lead paint disclosures PDF for 742 Evergreen Terr.',
    'docusign.envelope_completed',
    'DocuSign',
    { envelopeId: 'ds-env-12345', property: '742 Evergreen Terr' },
    ['Compliance Agent'],
    ['Mark checklist document received'],
    ['DocuSign envelope completed']
  )
];

// Dotloop Demo Events
const dotloopDemoEvents: ConnectorDemoEvent[] = [
  createConnectorDemoEvent(
    'evt_dotloop_sync_failure',
    'Loop sync failed for 18 hours.',
    'Dotloop API heartbeat credentials expired. Created priority decision to re-authorize loop connection.',
    'dotloop.sync_failure',
    'Dotloop',
    { errorCode: 401, errorMsg: 'Unauthorized OAuth token refresh' },
    ['Integration Health Agent'],
    ['Created priority decision to re-authorize connection'],
    ['Dotloop webhook auth alert logged']
  )
];

// SkySlope Demo Events
const skyslopeDemoEvents: ConnectorDemoEvent[] = [
  createConnectorDemoEvent(
    'evt_skyslope_missing_file',
    'Required compliance file missing.',
    'SkySlope folder scan flagged document omission exception: Buyer Broker Agreement. Created broker review item.',
    'skyslope.missing_document',
    'SkySlope',
    { missingFile: 'Buyer Broker Representation Agreement', property: '102 Pine St' },
    ['Compliance Agent'],
    ['Gated compliance exception created'],
    ['SkySlope folder scanner warning logged']
  )
];

// Rechat Demo Events
const rechatDemoEvents: ConnectorDemoEvent[] = [
  createConnectorDemoEvent(
    'evt_rechat_deal_stage',
    'Deal stage changed in Rechat.',
    'Rechat deal webhook logs stage transition.',
    'rechat.deal_stage_changed',
    'Rechat',
    { stage: 'under_contract', property: '109 Woodlawn' },
    ['Transaction Stage Agent'],
    ['Update Operating Memory stage'],
    ['Rechat status change synced']
  )
];

// Follow Up Boss Demo Events
const fubDemoEvents: ConnectorDemoEvent[] = [
  createConnectorDemoEvent(
    'evt_fub_no_response',
    'Agent/client communication has no response after 48 hours.',
    'Follow Up Boss webhook synced unresponsive client thread.',
    'fub.no_response_alert',
    'Follow Up Boss',
    { delayHours: 54, property: '908 Colonial Ave' },
    ['Agent Support Agent'],
    ['Auto-draft reminder for missing disclosures'],
    ['FUB client unresponsive alert logged']
  )
];

// RESO Web API Demo Events
const resoDemoEvents: ConnectorDemoEvent[] = [
  createConnectorDemoEvent(
    'evt_reso_listing_active',
    'Listing status changed to active.',
    'RESO Web API status update synced: 109 Woodlawn listing set to Active on MLS Board.',
    'reso.status_active',
    'RESO Web API',
    { status: 'active', property: '109 Woodlawn' },
    ['Listing Launch Agent'],
    ['Syndication listing readiness active'],
    ['MLS Board sync event processed']
  )
];

// CSV Ingestion Demo Events
const csvDemoEvents: ConnectorDemoEvent[] = [
  createConnectorDemoEvent(
    'evt_csv_import_run',
    'Manual transaction import processed.',
    'Process manual CSV transaction spreadsheets.',
    'csv.import_completed',
    'CSV Import Ingestion',
    { rowCount: 14 },
    ['AI COO Orchestrator'],
    ['Update Operating Memory lists'],
    ['Manual CSV upload parsed']
  )
];

// Webhooks Demo Events
const webhookDemoEvents: ConnectorDemoEvent[] = [
  createConnectorDemoEvent(
    'evt_webhook_milestone',
    'External system sends transaction milestone webhook.',
    'External Escrow gateway webhook post milestone.',
    'webhook.milestone_reached',
    'Generic Webhooks',
    { milestone: 'earnest_money_received' },
    ['AI COO Orchestrator'],
    ['Ingest webhook payload'],
    ['Generic milestone webhook received']
  )
];

// Zapier Demo Events
const zapierDemoEvents: ConnectorDemoEvent[] = [
  createConnectorDemoEvent(
    'evt_zapier_new_lead',
    'Zapier automation forwards new lead/deal signal.',
    'Zapier forwards webhook lead ingest signals.',
    'zapier.new_lead_forwarded',
    'Zapier Webhooks',
    { leadName: 'Arthur Pendragon', property: '109 Woodlawn' },
    ['AI COO Orchestrator'],
    ['Created contact match record'],
    ['Zapier pipeline triggered']
  )
];

// Mapping of custom demo events by connector ID
const customDemoEventsRegistry: Record<string, ConnectorDemoEvent[]> = {
  i_gmail: gmailDemoEvents,
  i_outlook: outlookDemoEvents,
  i_gcal: gcalDemoEvents,
  i_mscal: mscalDemoEvents,
  i_gdrive: gdriveDemoEvents,
  i_onedrive: onedriveDemoEvents,
  i_sharepoint: sharepointDemoEvents,
  i_docusign: docusignDemoEvents,
  i_dotloop: dotloopDemoEvents,
  i_skyslope: skyslopeDemoEvents,
  i_rechat: rechatDemoEvents,
  i_fub: fubDemoEvents,
  i_reso: resoDemoEvents,
  i_mls_manual: csvDemoEvents,
  i_generic_webhooks: webhookDemoEvents,
  i_zapier: zapierDemoEvents
};

/**
 * Returns all catalog connectors instantiated via the factory.
 */
export const getRegistryConnectors = (): IntegrationConnector[] => {
  return initialCatalogConnectors.map((catalogConnector) => {
    const demoEvents = customDemoEventsRegistry[catalogConnector.id] || [];
    return createIntegrationConnector({
      ...catalogConnector,
      demoEvents,
      readiness: demoEvents.length > 0 ? 'connected_demo' : catalogConnector.readiness
    });
  });
};
