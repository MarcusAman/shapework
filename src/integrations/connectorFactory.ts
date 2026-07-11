/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IntegrationConnector, ConnectorTestResult, ConnectorDemoResult, ConnectorDemoEvent } from './types';

/**
 * Factory options to instantiate an IntegrationConnector.
 */
export interface ConnectorOptions {
  id: string;
  name: string;
  category: IntegrationConnector['category'];
  description: string;
  logoKey: string;
  readiness: IntegrationConnector['readiness'];
  priority: IntegrationConnector['priority'];
  authMethod: IntegrationConnector['authMethod'];
  productionStatus: IntegrationConnector['productionStatus'];
  readCapabilities: string[];
  writeCapabilities: string[];
  webhookSupport?: IntegrationConnector['webhookSupport'];
  dataObjects?: string[];
  dependentAgents?: string[];
  automationExamples?: string[];
  approvalRequiredFor?: string[];
  riskNotes?: string[];
  setupChecklist?: string[];
  demoEvents?: ConnectorDemoEvent[];
  testConnectionHandler?: () => Promise<ConnectorTestResult>;
  runDemoEventHandler?: (eventId: string) => Promise<ConnectorDemoResult>;
}

/**
 * Instantiates a fully-typed IntegrationConnector with standard defaults.
 */
export function createIntegrationConnector(options: ConnectorOptions): IntegrationConnector {
  const defaultTestConnection = async (): Promise<ConnectorTestResult> => {
    return {
      connectorId: options.id,
      status: 'success',
      message: `Successfully verified sandbox credentials for ${options.name}.`,
      checkedAt: new Date().toISOString()
    };
  };

  const defaultRunDemoEvent = async (eventId: string): Promise<ConnectorDemoResult> => {
    const event = (options.demoEvents || []).find(e => e.id === eventId);
    return {
      connectorId: options.id,
      eventId,
      status: event ? 'created' : 'failed',
      createdSignals: event ? [event.eventType] : [],
      activatedAgents: event ? event.expectedAgents : [],
      createdActions: event ? event.expectedActions : [],
      createdAuditEvents: event ? event.expectedAuditEvents : []
    };
  };

  return {
    id: options.id,
    name: options.name,
    category: options.category,
    description: options.description,
    logoKey: options.logoKey,
    readiness: options.readiness,
    priority: options.priority,
    authMethod: options.authMethod,
    productionStatus: options.productionStatus,
    readCapabilities: options.readCapabilities,
    writeCapabilities: options.writeCapabilities,
    webhookSupport: options.webhookSupport || 'no',
    dataObjects: options.dataObjects || [],
    dependentAgents: options.dependentAgents || [],
    automationExamples: options.automationExamples || [],
    approvalRequiredFor: options.approvalRequiredFor || [],
    riskNotes: options.riskNotes || [],
    setupChecklist: options.setupChecklist || [],
    demoEvents: options.demoEvents || [],
    testConnectionDemo: options.testConnectionHandler || defaultTestConnection,
    runDemoEvent: options.runDemoEventHandler || defaultRunDemoEvent,
    connected: options.readiness === 'connected_demo',
    recordsSynchronized: options.readiness === 'connected_demo' ? 100 : 0,
    errorsCount: 0
  };
}
