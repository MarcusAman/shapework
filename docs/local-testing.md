# Local Testing & Automation Guide

This guide details port configurations, endpoint routing, and automated testing setups for the shapework platform.

## Local Environment Config

Configure these environment variables in your local `.env` file or terminal session to override the port bindings and API configurations:

```env
PORT=3000
APP_BASE_URL=http://localhost:3000
DEMO_BASE_PATH=/demo
TEST_BASE_URL=http://localhost:3000/demo
APINATION_DOTLOOP_WEBHOOK_SECRET=test_secret_123
APINATION_DOTLOOP_WEBHOOK_ENABLED=true
```

## Running the App Locally

1. **Port Bindings**: The default port is `3000`. If port 3000 is occupied, you will see an `EADDRINUSE` error. Run `lsof -i :3000` to find the process ID and terminate it (`kill -9 PID`) before starting.
2. **Start Command**: Run:
   ```bash
   npm run dev
   ```
   This command starts the Express master full-stack server (`tsx server.ts`) which boots both the API backend endpoints and mounts the Vite frontend dev server as middleware.
3. **Browser URL**: Always navigate to:
   ```txt
   http://localhost:3000/demo
   ```
   Directly visiting paths (such as `/demo/integrations`) will automatically select the active view inside the App Shell.

## Debug API Endpoints

- **Health Status**: `GET /api/health`
- **Active Routes Registry**: `GET /api/debug/routes`
- **Active Integrations Status**: `GET /api/debug/integrations`

## Webhook testing

To test webhook payloads from Dotloop or Rechat without connecting live systems, open the **Integration Test Console** inside the app at:
`Settings → Demo QA → Open Integration Test Console`.
You can dispatch pre-seeded JSON event streams and trace their normalization and routing logs instantly in the admin dashboards.
