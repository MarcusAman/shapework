# Integration Testing Guide

This guide describes how to run and verify integration event flows inside the shapework sandbox environment.

## Verification Checkpoints

### 1. Health and Routes Check
Verify that the full-stack server is running and listening:
```bash
# Execute local pre-flight checks
npm run test:local-routes
```
This script calls:
- `GET /api/health` (Confirm Express server health)
- `GET /api/debug/routes` (Verify client-side route maps)
- `GET /api/debug/integrations` (Expose sandbox connector statuses)

### 2. Sandbox Ingestion Webhooks
You can simulate live webhooks by posting mock payloads directly using curl or the **Integration Test Console**:
- Webhook endpoint: `POST /api/integrations/apination/dotloop/webhook`
- Default local secret header: `x-shapework-webhook-secret: test_secret_123`

```bash
# Example Loop Created trigger
curl -X POST http://localhost:3000/api/integrations/apination/dotloop/webhook \
  -H "Content-Type: application/json" \
  -H "x-shapework-webhook-secret: test_secret_123" \
  -d '{
    "eventType": "loop.created",
    "channel": "loop_created_or_updated",
    "loopId": "dl_loop_901",
    "loopName": "204 Birch Lane",
    "loopStatus": "Pre-Listing"
  }'
```

### 3. Inspecting Ingest Logs
The **Live Event Receipt Log** is mounted at the bottom of the **Integrations** dashboard. It lists:
- Ingestion timestamps
- HMAC / query verification outcomes
- Normalization statuses
- Resolved cross-system matches
- Redacted payload JSON blocks (Confirming no client names/emails/phones are exposed raw)

## Staging Deployment Audits
When sharing the public Cloud Run demo, complete the staging checks listed in **Settings → Demo QA** to verify webhook routes.
