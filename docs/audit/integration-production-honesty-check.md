# Integration Production Honesty Audit

This document checks the system for compliance with "Production Honesty" requirements—ensuring that mock OAuth consent flows, simulated connection states, and unconfigured routes are never exposed in production mode.

---

## Production vs. Development Separation

### 1. Mock OAuth Consent Flows
- **Rule**: No mock consent page redirection when running in production.
- **Code Enforcement**:
  In [googleRoutes.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/server/integrations/google/googleRoutes.ts) and [microsoftRoutes.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/server/integrations/microsoft/microsoftRoutes.ts), we verified and hardened `isMock` resolution to respect production modes:
  ```typescript
  const isProd = process.env.APP_MODE === 'production' || process.env.NODE_ENV === 'production';
  const isMock = !isProd && (process.env.APP_MODE === 'development' || !process.env.GOOGLE_CLIENT_ID);
  ```
  This ensures that when `APP_MODE` or `NODE_ENV` is set to `production`, `isMock` evaluates to `false` and mock redirection never fires, even if configuration keys are missing. Instead, the backend throws a configuration error or uses the real OAuth clients which safely fail closed.

### 2. Connection Integrity on `/app/integrations`
- **Rule**: Integrations must never pretend to be connected unless a real connection exists.
- **Code Enforcement**:
  - Google Workspace default connection seed (`'nest-realty-demo'`) is kept strictly inside development / demo data.
  - The UI fetches connection status directly from active backend database records and config states via `/api/integrations/[provider]/status` API queries.
  - No client-side `localStorage` or session-storage is used to fake connected states or store integration secrets.

### 3. Disabled UI Action Buttons (CTA States)
- **Rule**: Card footer actions must represent actual implementation/connection capabilities.
- **Code Enforcement**:
  - `connected`: Active **Sync now** and **Disconnect** buttons.
  - `expired`: Active **Reconnect** button.
  - `available_to_connect`: Active **Connect** button.
  - `route_shell_exists`: Disabled **Setup pending** button.
  - `missing_env`: Disabled **Missing setup** button.
  - `missing_routes`: Disabled **Route missing** button.
  - `planned`: Disabled **Planned** button.
  - `disabled`: Disabled **Disabled** button.

---

## Audit Verification Status

- [x] Verified mock OAuth redirect is blocked in production.
- [x] Verified card CTA states render accurately and represent actual backend state.
- [x] Verified no hardcoded connection states exist outside test/dev seeds.
- [x] Verified that client secrets are never sent to or cached in the frontend.
