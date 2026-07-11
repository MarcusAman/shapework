# Production Launch Configuration Guide

This document outlines the security, authorization, persistence, and integration requirements to deploy and run shapework. in a live real estate brokerage production environment.

---

## 1. Environment Variables

Create a secure `.env` file containing:

```env
# Application Settings
APP_MODE=production
PORT=3000
APP_BASE_URL=https://shapework.yourdomain.com

# Persistence Setup
STORAGE_DRIVER=database
DATABASE_URL=postgres://user:pass@host:5432/dbname
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-secure-service-role-token

# Security Credential Vault Encryption Key
CREDENTIAL_ENCRYPTION_KEY=your-32-byte-base64-or-strong-passphrase

# Rechat CRM OAuth Setup
RECHAT_CLIENT_ID=your-rechat-client-id
RECHAT_CLIENT_SECRET=your-rechat-client-secret
RECHAT_WEBHOOK_SECRET=your-verified-rechat-secret

# API Nation Dotloop Webhook Setup
APINATION_DOTLOOP_WEBHOOK_SECRET=your-dotloop-secret
APINATION_DOTLOOP_WEBHOOK_ENABLED=true
PUBLIC_WEBHOOK_BASE_URL=https://webhooks.yourdomain.com
```

---

## 2. Authentication & Tenancy Setup

### Session Authentication
- User session requests must supply an HTTP header `Authorization: Bearer <session_token>`.
- The token is validated server-side by the `requireAuth` middleware against registered user session repositories.

### Tenant Isolation
- Under the `resolveWorkspaceContext` middleware, the system identifies the user's active workspace membership.
- Arbitrary `x-workspace-id` headers supplied by the client are rejected in production unless verified against the user's authenticated `WorkspaceMembership` registry.
- All protected API routes receive `req.authUser`, `req.workspace`, and `req.membership`.

---

## 3. Server-Side RBAC Role Matrix

Permission restrictions are enforced server-side. The following default role permissions are mapped:

| Role | Permissions |
| :--- | :--- |
| **Owner** | All business permission scopes (`view_work_queue`, `manage_work_queue`, `view_deals`, `manage_deals`, `view_compliance`, `manage_compliance`, `approve_actions`, `manage_integrations`, `manage_users`, `configure_routing`, `view_audit`, `export_audit`, `manage_workspace`). No dev tools access. |
| **Admin** | All permissions including `access_developer_tools`. |
| **Operations Lead** | `view_work_queue`, `manage_work_queue`, `view_deals`, `manage_deals`, `view_compliance`, `manage_compliance`, `approve_actions`, `configure_routing`, `view_audit`. |
| **Transaction Coordinator** | `view_work_queue`, `manage_work_queue`, `view_deals`, `manage_deals`, `view_compliance`, `manage_compliance`. |
| **Compliance Partner** | `view_work_queue`, `view_compliance`, `manage_compliance`, `view_audit`. |
| **Listing Coordinator** | `view_work_queue`, `view_deals`, `manage_deals`. |
| **Marketing Coordinator** | `view_work_queue`. |
| **Agent** | `view_work_queue` (restricted access). |

---

## 4. Credential Vault Setup (AES-256-GCM)

- shapework. uses a server-side `CredentialVault` utilizing authenticated AES-256-GCM encryption.
- Integration credentials (Rechat access/refresh tokens, webhook secrets) are encrypted before write.
- **Boot Validation**: If `APP_MODE=production` and `CREDENTIAL_ENCRYPTION_KEY` is blank or invalid, the Express server will immediately print a fatal log and halt.

---

## 5. Webhook Security & Rotations

### Opaque Routing Token
- The public Dotloop webhook endpoint is:
  `POST /api/integrations/apination/dotloop/webhook/:webhookToken`
- Webhook tokens are random strings. The server hashes (`SHA-256`) the token parameter to resolve the tenant workspace ID, preventing webhook URL guessing.

### Rotations & Revocation
- **Rotate Endpoint Token**: `POST /api/integrations/apination/dotloop/webhook/rotate-token` (Admin only). Regenerates the token.
- **Rotate Secret**: `POST /api/integrations/apination/dotloop/webhook/rotate-secret` (Admin only). Regenerates the payload verification secret.
- **Revoke Endpoint**: `POST /api/integrations/apination/dotloop/webhook/revoke` (Admin only). Deactivates the webhook.

---

## 6. Immutable Audit Trail

- Audit events are strictly append-only.
- Normal users cannot modify or delete logs.
- Audit ledger queries require the `view_audit` permission and are scoped strictly by the user's active workspace.

---

## 7. Customer Launch checklist

The Customer Launch Checklist requires verifying 16 milestones before a workspace status transitions to `active`:

1. **Workspace created**: Basic profile setup.
2. **Admin/owner invited**: Registered owner account.
3. **Staff roles configured**: TC and Compliance staff mapped.
4. **Routing rules configured**: SLA timelines confirmed.
5. **Compliance checklist configured**: Brokerage checklist uploaded.
6. **Approval policy configured**: Outbound email gates active.
7. **Rechat connected**: Connected via OAuth 2.0.
8. **Rechat baseline sync complete**: Initial records synced.
9. **Dotloop webhook configured**: Opaque webhook token generated.
10. **Test webhook event received**: Verified event receipt logic.
11. **Agent roster imported**: Active agents rostered.
12. **Active deals imported**: Escalations mapped.
13. **Work Queue reviewed**: Initial queue tasks resolved.
14. **Secure links tested**: Outbound request desk test passed.
15. **Audit verified**: Initial log trace checked.
16. **Customer launch approved**: Final activation gate confirmed.

---

## 8. Incident Response & Rollback Procedures

### Go-Live Verification
After workspace activation, execute diagnostics checks:
```bash
curl -H "Authorization: Bearer token_admin" https://shapework.yourdomain.com/api/system/health
```

### Rollback Plan
- In case of critical failure, restore database records to the baseline backup snapshot.
- Revoke compromised OAuth client tokens immediately using `/api/integrations/rechat/disconnect` or the API Nation console.
