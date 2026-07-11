# QuickBooks Online Integration Guide

This document outlines the architecture, setup, and synchronization logic for the read-first QuickBooks Online integration in **shapework.** (the brokerage operating layer).

## 1. Scope Constraints
- **Read-First Integration**: QuickBooks is used strictly as a source of truth for payment and deposit signals. No accounting records are written back to QuickBooks in this sprint.
- **Writeback Disabled**: State mutation queries (e.g. creating/modifying invoices or payments in QuickBooks) are completely disabled.
- **Security Isolation**: Workspaces must be isolated. Tokens connected to one workspace must never be accessible or used by another workspace.

---

## 2. Technical Stack
- **OAuth Client Library**: `intuit-oauth` (Official Intuit SDK).
- **Direct REST Calls**: Standard HTTP requests using native Node fetch or the Axios wrapper, pointing to the resolved sandbox or production QBO Environment URIs.
- **Node & TypeScript**: Fully type-safe schemas mapping to the shapework PostgreSQL relational schema.

---

## 3. Configuration & Boot Sequence
Environment variables are parsed and validated on startup (`quickbooksConfig.ts`). If required QuickBooks variables are missing when QuickBooks integration is enabled, the server fails closed.

### Required Environment Variables:
```env
QUICKBOOKS_CLIENT_ID=your_client_id
QUICKBOOKS_CLIENT_SECRET=your_client_secret
QUICKBOOKS_REDIRECT_URI=http://localhost:3000/api/integrations/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=sandbox # or production
QUICKBOOKS_SYNC_LOOKBACK_DAYS=90
```

---

## 4. OAuth 2.0 Flow & Token Storage
### CSRF Protection
The authorization flow generates a secure random state token containing the binding:
`state = BASE64(JSON.stringify({ workspaceId, userId, expiresAt, nonce }))`
The state token is validated during the callback redirect before the authorization code is exchanged for tokens.

### Token Encryption
Access and refresh tokens are encrypted using **AES-256-GCM** inside the `AesGcmCredentialVault` (`server/security/vault.ts`) before being stored in the database.
- **Key Prefix**: Encrypted strings are prefixed with `ref_v1:` to verify storage format.
- **Frontend Protection**: Tokens and client secrets are never sent to the frontend or printed in audit logs.

---

## 5. Synchronization Engine & Exception Mappers
The synchronization routine (`runQuickBooksSync`) runs on-demand or via the background job scheduler.

### Sync Pipeline:
1. Retrieves and decrypts connection tokens.
2. Checks token expiration; auto-refreshes if needed.
3. Fetches raw data from QuickBooks REST API:
   - `Invoice` records (receivables within the lookback window)
   - `Payment` records (inbound payments within the lookback window)
   - `Deposit` records (escrow/earnest money deposits)
   - `ProfitAndLoss` report (30-day summary)
4. Maps records into shapework `FinanceSignals` (`quickbooksMappers.ts`).
5. Updates the global `financeSignals` store.

### Exception Raising Rules:
During mapping, the engine checks for anomalies and creates deterministic, actionable **Work Queue Exceptions**:
- **Unmatched Open Invoice**: If an invoice exists in QuickBooks but has no matching address or client name in shapework transactions, raised as:
  `quickbooks:${realmId}:invoice:${invoiceId}:open_receivable`
- **Unmatched Payment**: If a payment is received but can't be linked to a transaction:
  `quickbooks:${realmId}:payment:${paymentId}:match_needed`
- **Large Expense Review**: If a payment or deposit exceeds $10,000, raised for Owner review:
  `quickbooks:${realmId}:expense:${recordId}:large_spend`
- **Commission Gap**: If a transaction stage is `Closed` but no matching QuickBooks payment is found:
  `quickbooks:${realmId}:transaction:${transactionId}:commission_gap`
- **Sync Failure**: If a synchronization error occurs, raised as:
  `quickbooks:${realmId}:sync:error`

---

## 6. Endpoints
- `GET /api/integrations/quickbooks/connect` - Initiates OAuth authorization.
- `GET /api/integrations/quickbooks/callback` - OAuth code redirect exchange.
- `GET /api/integrations/quickbooks/status` - Returns current workspace connection details.
- `POST /api/integrations/quickbooks/sync` - Triggers sync run (requires CSRF protection).
- `POST /api/integrations/quickbooks/disconnect` - Purges connection tokens (requires CSRF protection).

---

## 7. Testing & Verification
A pure-backend test script is available to verify all QuickBooks components:
```bash
npm run test:quickbooks
```
This suite tests state token serialization, client mock returns, fuzzy transaction mappers, and exceptions.
