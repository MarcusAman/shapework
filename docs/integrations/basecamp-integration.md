# Basecamp Integration Architecture Manual

This manual details the architecture and operational rules of the **Basecamp read-first integration** in the **shapework.** brokerage operating layer.

---

## 1. Architectural Architecture & Flow
```txt
 +-------------------+           Redirect & Auth          +-----------------------+
 |   shapework UI    | ---------------------------------> |  37signals Launchpad  |
 | (Integrations Hub)| <--------------------------------- | (Authorization/Token) |
 +-------------------+             OAuth Code             +-----------------------+
           |
           v
 +-----------------------------+     AES-256-GCM      +-----------------------+
 |      Express Server         | -------------------> |    Relational DB      |
 | (Encrypt & Store Connection)|                      | (basecamp_connections)|
 +-----------------------------+                      +-----------------------+
```

---

## 2. Environment Variables Configuration
The integration uses the following environment variables:
- `BASECAMP_CLIENT_ID`: Public application key registered in Launchpad.
- `BASECAMP_CLIENT_SECRET`: Shared secret key used for token exchange.
- `BASECAMP_REDIRECT_URI`: Exact redirect OAuth callback endpoint.
- `BASECAMP_BASE_URL`: Base URL (default is `https://3.basecampapi.com`).
- `BASECAMP_USER_AGENT`: User-Agent header (default is `shapework (support@shapework.ai)`).
- `CREDENTIAL_ENCRYPTION_KEY`: AES encryption key (32 bytes).
- `BASECAMP_SYNC_LOOKBACK_DAYS`: Active sync lookback window (default is `30`).

---

## 3. Cryptographic Token Storage
Tokens are encrypted prior to database storage using **AES-256-GCM** inside the `AesGcmCredentialVault`. Access tokens are automatically refreshed in the background using refresh tokens upon expiration.

---

## 4. Account ID Behavior & Multi-Account Handling
37signals Launchpad authentication supports multi-account profiles. Upon a successful OAuth callback, shapework:
1. Queries the identity endpoint (`https://launchpad.37signals.com/authorization.json`).
2. Extracts the lists of available accounts.
3. Automatically selects the first active Basecamp 3 (`bc3`) account to scope synchronization.

---

## 5. Read-Only Sync & Mapped Signals
Synchronization is strictly **read-only**. shapework queries projects, open to-dos, recent messages, and recent events, then normalizes them into `BasecampSignal` records:
- `todo_overdue`: Task due date is in the past.
- `todo_unassigned`: To-do task has no assigned staff or agent.
- `owner_mentioned`: Mention of "Sarah Jenkins" or "Sarah Jennings" detected.
- `task_stuck`: Task created over 14 days ago and remains uncompleted.
- `vendor_followup_detected`: Keyword matches indicating unresolved coordinator-to-vendor wires, title, or escrow checklists.

---

## 6. Work Queue Exceptions & Owner Brief Rollup
Deterministic source keys prevent duplicate tickets:
- `basecamp:{accountId}:todo:{todoId}:overdue`
- `basecamp:{accountId}:todo:{todoId}:unassigned`
- `basecamp:{accountId}:message:{messageId}:owner_mentioned`

Owner Brief rendering includes the **"Team execution signals"** section to surface overdue tasks, owner-specific notifications, and stuck follow-ups.

---

## 7. What shapework Does NOT Do & Remaining Limitations
- **No Writeback**: shapework never writes back to Basecamp, updates to-dos, or posts messages.
- **No Project Creation**: Projects must be created directly in Basecamp.
- **No Private Files**: Private attachments, personal chats, and files are excluded from synchronization.
