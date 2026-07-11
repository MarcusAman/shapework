# Integrations Connector Architecture

This document defines the interface and data contract for external third-party software connectors (Dotloop, SkySlope, CRM, Google Calendar) linking to **shapework.**.

## 1. The Connector Interface Schema

All native integrations must implement the following TypeScript interface structure to register on the nervous system pipelines:

```typescript
export interface IntegrationConnector {
  // Identification
  connectorId: string;           // Unique UUID representing the connector instance
  connectorType: string;         // 'crm' | 'esignature' | 'email' | 'calendar' | 'storage' | 'mls'
  name: string;                  // User-facing label (e.g. 'Dotloop Westlake')
  
  // Security & Authentication
  authMethod: 'oauth2' | 'apikey' | 'basic' | 'jwt';
  scopes: string[];              // Authorized OAuth scopes (e.g. ['deals.read', 'loops.write'])
  tokenRefreshedAt?: string;     // ISO timestamp of last credentials rotation
  
  // Capability Flags
  readCapabilities: string[];    // Sourced data scopes (e.g. ['transactions', 'disclosures'])
  writeCapabilities: string[];   // Allowed update targets (e.g. ['checklists', 'task_status'])
  webhookSupport: boolean;       // True if API supports real-time event alerts
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual';
  
  // System Health & State
  status: 'connected' | 'stale_credentials' | 'offline' | 'rate_limited' | 'error';
  lastSync: string;              // ISO timestamp of last successful heartbeat
  eventsProcessed: number;       // Cumulative audit count
  recentErrors: Array<{
    timestamp: string;
    code: string;
    message: string;
    criticality: 'low' | 'medium' | 'high';
  }>;
}
```

## 2. Sync Lifecycle Webhooks

Connectors use webhook endpoints to stream events. Registered webhooks process payloads through the ingestion queue:

```
POST /api/webhooks/ingress/:connectorId
Headers:
  Authorization: Bearer <shapework-ingress-token>
  X-Webhook-Signature: sha256=<hmac-hash>
```

### Heartbeat Latency Rule
If the webhook latency exceeds **5000ms** or returns a status code outside the 2xx range over 3 consecutive attempts:
1. Status is automatically changed to `stale_credentials` or `error`.
2. A priority alert is routed to the **Integration Reliability** dashboard.
3. The system reverts to manual staging files or coordinator email forwarding.
