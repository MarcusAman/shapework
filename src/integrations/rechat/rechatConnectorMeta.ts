/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const RECHAT_CONNECTOR_ID = 'i_rechat';

export const RECHAT_CONNECTOR_DEFAULT_META = {
  id: RECHAT_CONNECTOR_ID,
  name: 'Rechat Platform',
  category: 'CRM & Front Office' as const,
  description: 'Primary brokerage agent CRM, messaging hub, and transaction deals directory.',
  logoKey: 'rechat',
  authMethod: 'oauth' as const,
  productionStatus: 'demo' as const,
  readCapabilities: ['Read transaction files', 'Ingest CRM contacts', 'Monitor messaging webhooks'],
  writeCapabilities: ['Create deal tasks', 'Update transaction stages', 'Assign coordinator tasks'],
  webhookSupport: 'yes' as const,
  dataObjects: ['transactions', 'listings', 'tasks', 'agents', 'contacts'],
  dependentAgents: ['Transaction Stage Agent', 'Listing Launch Agent', 'Audit Agent', 'AI COO Orchestrator'],
  automationExamples: ['Update Rechat Deal Stage once underwriting clear to close is verified', 'Create transaction coordination file from Rechat CRM contact triggers'],
  approvalRequiredFor: ['Updating Rechat deals milestones'],
  riskNotes: ['Requires agent-by-agent scope authorizations for personal contact feeds'],
  setupChecklist: ['Install shapework connector from Rechat marketplace', 'Provide office broker API access keys']
};
