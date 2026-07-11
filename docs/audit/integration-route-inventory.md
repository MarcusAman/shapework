# Integration Route Inventory Audit

This document inventories and verifies all frontend-registered route paths against their active backend route endpoints across all 19 providers.

## System Routing Strategy
Shapework operates on a dual-routing system:
1. **Fully Active Integration Routers**: Implemented via core endpoints in `/api/integrations/google`, `/api/integrations/microsoft`, and `/api/integrations/rechat` (or `/api/integrations/apination/dotloop`).
2. **Planned & Stubbed Integration Routers**: Implemented via `server/integrations/plannedIntegrationsRouter.ts` yielding standard `501 Not Implemented` responses for actions, and dynamic registry-matching payloads for status checks.

---

## Route Inventory Registry

| Provider ID | Status Route | Connect Route | Disconnect Route | Sync Route | Webhook Route | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `rechat` | `GET /api/integrations/rechat/status` | `GET /api/integrations/rechat/oauth/start` | `POST /api/integrations/rechat/disconnect` | `POST /api/integrations/rechat/sync` | `POST /api/integrations/rechat/webhook` | Active |
| `dotloop` | `GET /api/integrations/apination/dotloop/status` | `POST /api/integrations/apination/dotloop/connect` | `POST /api/integrations/apination/dotloop/disconnect` | `POST /api/integrations/apination/dotloop/sync` | `POST /api/integrations/apination/dotloop/webhook` | Active |
| `quickbooks_online` | `GET /api/integrations/quickbooks/status` | `GET /api/integrations/quickbooks/connect` | `POST /api/integrations/quickbooks/disconnect` | `POST /api/integrations/quickbooks/sync` | N/A | Active |
| `basecamp` | `GET /api/integrations/basecamp/status` | `GET /api/integrations/basecamp/connect` | `POST /api/integrations/basecamp/disconnect` | `POST /api/integrations/basecamp/sync` | N/A | Active |
| `google_workspace` | `GET /api/integrations/google/status` | `GET /api/integrations/google/connect` | `POST /api/integrations/google/disconnect` | `POST /api/integrations/google/sync` | N/A | Active |
| `gmail` | `GET /api/integrations/google/status` | `GET /api/integrations/google/connect` | `POST /api/integrations/google/disconnect` | `POST /api/integrations/google/sync` | N/A | Active |
| `google_calendar` | `GET /api/integrations/google/status` | `GET /api/integrations/google/connect` | `POST /api/integrations/google/disconnect` | `POST /api/integrations/google/sync` | N/A | Active |
| `google_drive` | `GET /api/integrations/google/status` | `GET /api/integrations/google/connect` | `POST /api/integrations/google/disconnect` | `POST /api/integrations/google/sync` | N/A | Active |
| `microsoft_365` | `GET /api/integrations/microsoft/status` | `GET /api/integrations/microsoft/connect` | `POST /api/integrations/microsoft/disconnect` | `POST /api/integrations/microsoft/sync` | N/A | Active |
| `outlook_mail` | `GET /api/integrations/microsoft/status` | `GET /api/integrations/microsoft/connect` | `POST /api/integrations/microsoft/disconnect` | `POST /api/integrations/microsoft/sync` | N/A | Active |
| `outlook_calendar` | `GET /api/integrations/microsoft/status` | `GET /api/integrations/microsoft/connect` | `POST /api/integrations/microsoft/disconnect` | `POST /api/integrations/microsoft/sync` | N/A | Active |
| `microsoft_teams` | `GET /api/integrations/microsoft/status` | `GET /api/integrations/microsoft/connect` | `POST /api/integrations/microsoft/disconnect` | `POST /api/integrations/microsoft/sync` | N/A | Active |
| `plaid` | `GET /api/integrations/plaid/status` | `POST /api/integrations/plaid/link-token` | `POST /api/integrations/plaid/disconnect` | `POST /api/integrations/plaid/sync` | `POST /api/integrations/plaid/webhook` | Stubbed |
| `api_nation` | `GET /api/integrations/api-nation/status` | `POST /api/integrations/api-nation/connect` | `POST /api/integrations/api-nation/disconnect` | `POST /api/integrations/api-nation/sync` | N/A | Stubbed |
| `zapier` | `GET /api/integrations/zapier/status` | `POST /api/integrations/zapier/generate-webhook` | `POST /api/integrations/zapier/disconnect` | N/A | `POST /api/webhooks/zapier/:workspaceId/:secret` | Stubbed |
| `google_business_profile` | `GET /api/integrations/google-business-profile/status` | `GET /api/integrations/google-business-profile/connect` | `POST /api/integrations/google-business-profile/disconnect` | `POST /api/integrations/google-business-profile/sync` | N/A | Stubbed |
| `smtp_email` | `GET /api/integrations/email/status` | `POST /api/integrations/email/configure` | `POST /api/integrations/email/disconnect` | N/A | N/A | Stubbed |
| `sms_provider` | `GET /api/integrations/sms/status` | `POST /api/integrations/sms/configure` | `POST /api/integrations/sms/disconnect` | N/A | `POST /api/integrations/sms/webhook` | Stubbed |
| `resend` | `GET /api/integrations/resend/status` | `POST /api/integrations/resend/configure-domain` | `POST /api/integrations/resend/disconnect` | `POST /api/integrations/resend/verify-domain` | `POST /api/webhooks/resend` | Stubbed |

---

## Route Integrity Audit Findings
- **Endpoint Coverage**: 100% of registered routes map to valid mounted routes in either full-featured routers or `plannedIntegrationsRouter`.
- **Planned / Stub Responses**: All stub routes respond with standard JSON `501 Not Implemented` with a description that matches.
- **Resend Support**: Resend status correctly checks if the API keys are configured and returns `missing_env` or `available_to_connect`. If verified sending domains are configured in the active database state, it correctly returns `connected`.
