# Architecture Documentation: .Shapework

## High-Level System Architecture
.Shapework is designed as a system of operational intelligence sitting atop existing real estate systems of record. It acts as an orchestrator and an AI-driven operations employee.

```
+------------------------------------------------------------+
|                       Client Tier                          |
|  - Elegant React SPA (with Tailwind CSS + Framer Motion)    |
|  - Rich state machine for simulation & mock system states  |
+-----------------------------+------------------------------+
                              |
                              v
+------------------------------------------------------------+
|                       Service Tier                         |
|  - Express / Node.js backend proxying Gemini API           |
|  - Tenant-isolated Row Level Security (RLS) policies       |
|  - BrokerageSystemAdapter interface                        |
+-----------------------------+------------------------------+
                              |
                              v
+------------------------------------------------------------+
|                       Adapter Layer                        |
|  - RechatAdapter (Normalized brokerage sync)               |
|  - MockBrokerageAdapter (Realistic out-of-the-box demo)    |
|  - Google Workspace adapters (Gmail, Calendar, Drive)      |
+------------------------------------------------------------+
```

## Modular Integration Adapters
The application uses the `BrokerageSystemAdapter` interface to ensure strict decoupling from any single proprietary transaction management software:

```typescript
interface BrokerageSystemAdapter {
  connect(): Promise<void>;
  testConnection(): Promise<ConnectionResult>;
  syncContacts(cursor?: string): Promise<SyncResult>;
  syncAgents(cursor?: string): Promise<SyncResult>;
  syncListings(cursor?: string): Promise<SyncResult>;
  syncTransactions(cursor?: string): Promise<SyncResult>;
  syncTasks(cursor?: string): Promise<SyncResult>;
  handleWebhook(event: unknown): Promise<NormalizedEvent[]>;
  createTask?(input: CreateTaskInput): Promise<ExternalReference>;
  updateTask?(input: UpdateTaskInput): Promise<ExternalReference>;
}
```

## AI Agent Framework
The server-side AI implementation is split into a modular process:
1. **Observer:** Filters normalized activity events for friction, risk metrics, or delays.
2. **Planner:** Devises recommended task sequences and draft messages.
3. **Approval Layer:** Restricts destructive actions to require human confirmation.
4. **Executor:** Controlled registry of approved tools (e.g., `draft_email`, `flag_transaction_risk`).
5. **Auditor:** Persists AI actions, confidence levels, and user approvals/denials.
