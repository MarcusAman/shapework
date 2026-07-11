# Audit Trail Specification

This document details the telemetry format and evidence schema recorded in the **shapework.** activity logs.

## 1. Audit Log Schema

Every action is recorded as a structured event. The JSON contract for an audit entry is structured as follows:

```typescript
export interface AuditEvent {
  // Identification
  id: string;                     // Unique log ID (prefixed with 'aud_')
  timestamp: string;              // ISO-8601 timestamp of action execution
  
  // Actor context
  actor: string;                  // System username or 'shapework AI Operator'
  role: string;                   // 'broker_owner' | 'coordinator' | 'system_agent'
  
  // Action details
  action: string;                 // High-level title of what was done
  action_description: string;     // Detailed summary including inputs
  impact_area: string;            // 'Integrations' | 'Compliance' | 'Deal Status' | 'Autos'
  
  // Decision validation & Evidence
  source: string;                 // 'gmail_webhook' | 'dotloop_poller' | 'coo_command'
  evidence: string;               // Snippet of text, email matching token, or file hash
  confidence: number;             // NLP score (0.0 to 1.0)
  
  // Before / After State tracking
  target_record?: string;         // E.g. '102 Pine Street'
  metadata?: {
    before_value?: string;        // State string before action
    after_value?: string;         // State string after action
  };
  
  // Guardrails
  approval_status: 'authorized' | 'auto_safe' | 'bypass_override';
  approved_by?: string;           // Username of approving COO/Broker
  rollback_available: boolean;    // True if action supports compensation rollback
}
```

## 2. Evidence Grounding

To guarantee accountability, shapework. prohibits black-box updates. Every audit event must point to verifiable evidence:
* **Email Ingestion:** Must contain the message subject, date, and matching snippet.
* **File Uploads:** Must link to the file hash and target system folder path.
* **COO Missions:** Must log the target database record counts scanned.
* **CommandPlan:** Must list the approval token signed by the user.
