import { useState, useEffect } from 'react';
import { RoutingRule, SecureActionLink, IntegrationEvent } from '../types/operatingMemory';
import { defaultRoutingRules, defaultSecureLinks, defaultIntegrationEvents } from '../data/seedOperatingMemory';
import { AgentRequest } from '../types/shapework';

const STORAGE_KEYS = {
  ROUTING_RULES: 'shapework_ops_routing_rules',
  SECURE_LINKS: 'shapework_ops_secure_links',
  INTEGRATION_EVENTS: 'shapework_ops_integration_events',
  AGENT_REQUESTS: 'shapework_ops_agent_requests',
  CSV_IMPORTS: 'shapework_ops_csv_imports'
};

export function getSessionData<T>(key: string, defaultValue: T): T {
  try {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

export function setSessionData<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving to sessionStorage for key ${key}:`, e);
  }
}

export function resetOperatingMemory() {
  sessionStorage.removeItem(STORAGE_KEYS.ROUTING_RULES);
  sessionStorage.removeItem(STORAGE_KEYS.SECURE_LINKS);
  sessionStorage.removeItem(STORAGE_KEYS.INTEGRATION_EVENTS);
  sessionStorage.removeItem(STORAGE_KEYS.AGENT_REQUESTS);
  sessionStorage.removeItem(STORAGE_KEYS.CSV_IMPORTS);
  try {
    window.dispatchEvent(new Event('shapework_ops_reset'));
  } catch (e) {
    if (typeof document !== 'undefined' && document.createEvent) {
      const evt = document.createEvent('Event');
      evt.initEvent('shapework_ops_reset', true, true);
      window.dispatchEvent(evt);
    }
  }
}

export function useOperatingMemoryStore() {
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>(() => 
    getSessionData<RoutingRule[]>(STORAGE_KEYS.ROUTING_RULES, defaultRoutingRules)
  );

  const [secureLinks, setSecureLinks] = useState<SecureActionLink[]>(() => 
    getSessionData<SecureActionLink[]>(STORAGE_KEYS.SECURE_LINKS, defaultSecureLinks)
  );

  const [integrationEvents, setIntegrationEvents] = useState<IntegrationEvent[]>(() => 
    getSessionData<IntegrationEvent[]>(STORAGE_KEYS.INTEGRATION_EVENTS, defaultIntegrationEvents)
  );

  // Initialize with the standard Todd Howard vague request as seed
  const [agentRequests, setAgentRequests] = useState<AgentRequest[]>(() => 
    getSessionData<AgentRequest[]>(STORAGE_KEYS.AGENT_REQUESTS, [
      {
        id: 'req_vague_mktg',
        source: 'sms',
        requesterRole: 'agent',
        requesterName: 'Todd Howard',
        requestType: 'marketing',
        title: 'Vague Promo Request',
        rawMessage: 'Can someone help me get this listing promoted? Need it soon.',
        structuredSummary: 'Requesting promotional marketing collateral for an unspecified property listing.',
        priority: 'normal',
        assignedTeam: 'Unassigned',
        assignedOwner: 'Awaiting Triage',
        status: 'new',
        missingInfo: ['property_address', 'launch_date', 'asset_type'],
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        shouldEscalateToOwner: false,
        recommendedAction: 'Generate secure clarification request for missing listing details.',
        auditEvents: []
      }
    ])
  );

  const [csvImports, setCsvImports] = useState<Record<string, any[]>>(() => 
    getSessionData<Record<string, any[]>>(STORAGE_KEYS.CSV_IMPORTS, {
      roster: [],
      deals: [],
      compliance: [],
      inventory: []
    })
  );

  // Sync to session storage on update
  useEffect(() => {
    setSessionData(STORAGE_KEYS.ROUTING_RULES, routingRules);
  }, [routingRules]);

  useEffect(() => {
    setSessionData(STORAGE_KEYS.SECURE_LINKS, secureLinks);
  }, [secureLinks]);

  useEffect(() => {
    setSessionData(STORAGE_KEYS.INTEGRATION_EVENTS, integrationEvents);
  }, [integrationEvents]);

  useEffect(() => {
    setSessionData(STORAGE_KEYS.AGENT_REQUESTS, agentRequests);
  }, [agentRequests]);

  useEffect(() => {
    setSessionData(STORAGE_KEYS.CSV_IMPORTS, csvImports);
  }, [csvImports]);

  // Listen for reset events
  useEffect(() => {
    const handleReset = () => {
      setRoutingRules(defaultRoutingRules);
      setSecureLinks(defaultSecureLinks);
      setIntegrationEvents(defaultIntegrationEvents);
      setAgentRequests([
        {
          id: 'req_vague_mktg',
          source: 'sms',
          requesterRole: 'agent',
          requesterName: 'Todd Howard',
          requestType: 'marketing',
          title: 'Vague Promo Request',
          rawMessage: 'Can someone help me get this listing promoted? Need it soon.',
          structuredSummary: 'Requesting promotional marketing collateral for an unspecified property listing.',
          priority: 'normal',
          assignedTeam: 'Unassigned',
          assignedOwner: 'Awaiting Triage',
          status: 'new',
          missingInfo: ['property_address', 'launch_date', 'asset_type'],
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
          shouldEscalateToOwner: false,
          recommendedAction: 'Generate secure clarification request for missing listing details.',
          auditEvents: []
        }
      ]);
      setCsvImports({
        roster: [],
        deals: [],
        compliance: [],
        inventory: []
      });
    };

    window.addEventListener('shapework_ops_reset', handleReset);
    return () => window.removeEventListener('shapework_ops_reset', handleReset);
  }, []);

  return {
    routingRules,
    setRoutingRules,
    secureLinks,
    setSecureLinks,
    integrationEvents,
    setIntegrationEvents,
    agentRequests,
    setAgentRequests,
    csvImports,
    setCsvImports,
    resetOperatingMemory
  };
}
