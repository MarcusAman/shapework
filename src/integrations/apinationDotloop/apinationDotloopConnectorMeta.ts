/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiNationDotloopStatus } from './apinationDotloopTypes';

export const APINATION_DOTLOOP_CONNECTOR_ID = 'i_apination_dotloop';

export const APINATION_DOTLOOP_CONNECTOR_DEFAULT_META = {
  id: APINATION_DOTLOOP_CONNECTOR_ID,
  name: 'Dotloop via API Nation',
  category: 'Escrow & Transaction' as const,
  description: 'Receives Dotloop loop, participant, contact, and document activity through API Nation webhook syncs so shapework. can detect intake gaps, compliance risks, and transaction-file changes.',
  logoKey: 'dotloop',
  authMethod: 'webhook' as const,
  productionStatus: 'demo' as const,
  readCapabilities: ['Ingest loop details', 'Sync contact events', 'Receive participant roles', 'Track document updates'],
  writeCapabilities: ['Create checklist alerts', 'Route missing file gaps'],
  webhookSupport: 'yes' as const,
  dataObjects: ['loops', 'participants', 'contacts', 'documents'],
  dependentAgents: ['Transaction Stage Agent', 'Compliance Agent', 'Audit Agent'],
  automationExamples: [
    'Trigger Deal Intake checklist when new Loop is created',
    'Flag Compliance risk if Buyer Agency file is missing within 7 days of close'
  ],
  approvalRequiredFor: ['Updating external transaction rooms (all writes are approval-gated)'],
  riskNotes: ['Access token validation runs strictly in back-office sandbox'],
  setupChecklist: [
    'Copy the shapework webhook URL.',
    'Open the API Nation Dotloop/Webhooks application.',
    'Select the desired Dotloop sync channel.',
    'Paste the copied shapework webhook URL.',
    'Optionally add a shared secret header (x-shapework-webhook-secret).',
    'Enable the sync pipeline and send a test event.'
  ]
};
