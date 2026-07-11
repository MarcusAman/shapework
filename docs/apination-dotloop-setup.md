# API Nation Dotloop Integration Setup

This guide details configuring and validating the API Nation Dotloop webhook integration bridge with shapework.

## Configuration & Environment Variables

Make sure the following variables are loaded on the backend environment:

```env
PUBLIC_WEBHOOK_BASE_URL=https://your-domain.com
APINATION_DOTLOOP_WEBHOOK_SECRET=your_secret_passphrase_here
APINATION_DOTLOOP_WEBHOOK_ENABLED=true
```

- `PUBLIC_WEBHOOK_BASE_URL`: Base URL used to construct the webhook target (e.g. `https://shapework-os.a.run.app`). If empty, it falls back to `APP_BASE_URL`.
- `APINATION_DOTLOOP_WEBHOOK_SECRET`: Secure passphrase compared against incoming webhook headers. 

## Ingestion Webhook URL

The active webhook URL displayed in shapework is:
```txt
{PUBLIC_WEBHOOK_BASE_URL}/api/integrations/apination/dotloop/webhook
```
If both environment variables are missing, the UI will warn: *“Webhook public base URL is not configured.”*

### Staging Fallback Option
If API Nation does not support custom headers, you can append the secret passphrase as a query parameter for local development and staging validation:
```txt
https://your-domain.com/api/integrations/apination/dotloop/webhook?secret=your_secret_passphrase_here
```
> [!CAUTION]
> Rotate this secret immediately after public staging runs to prevent unauthorized events replication.

## Supported Dotloop Channels

API Nation syncs should target these event channels:
1. **loops_send_webhook**: Triggered when a new Loop is created.
2. **loop_participants_send_webhook**: Triggered when parties (agents, buyers, lenders) are added.
3. **contacts_send_webhook**: Triggered on profile/contact updates in loops.
4. **contact_created_or_updated**: Ingests new contact details.
5. **loop_created_or_updated**: Ingests changes to closing dates and stages.
6. **document_created_or_updated**: Ingests document checkoffs and status signals.
7. **participant_created_or_updated**: Ingests added party roles.

## Normalized Output Schema

Incoming payloads are automatically sanitized, masked of PII, and converted into this standard format:

```typescript
export type ApiNationDotloopEvent = {
  id: string;
  source: "apination_dotloop";
  channel: string;
  receivedAt: string;
  eventType: string;
  loopId?: string;
  loopName?: string;
  loopStatus?: string;
  propertyAddressMasked?: string;
  participantName?: string;
  participantRole?: string;
  documentName?: string;
  documentStatus?: string;
  rawPayloadRedacted: Record<string, unknown>;
  matchStatus: "matched" | "needs_review";
  auditEventIds: string[];
};
```

## Testing Webhooks Locally

1. **Tunnel Setup**: Use an ngrok tunnel to expose your local port 3000:
   ```bash
   ngrok http 3000
   ```
2. **Configure Base URL**: Set `PUBLIC_WEBHOOK_BASE_URL=https://<your-ngrok-subdomain>.ngrok-free.app`.
3. **Console Simulation**: Click the mock triggers in the **Integration Test Console** inside shapework to trace execution pipelines before wiring live API Nation pipelines.
