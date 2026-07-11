# shapework. Demo Deployment & Safety Policy

This document outlines the safety guidelines for hosting shapework. public demos. 

## 1. Zero-Trust Client Privacy Policy
- **No Real Client Data**: No real customer names, phone numbers, email addresses, or actual transaction records may ever be stored or rendered in the demo environment.
- **Anonymization Standard**: Fictionalized characters and addresses are used exclusively (e.g. `Brokerage Owner`, `Emma Watson`, `Evergreen Terrace`).
- **No Direct Discovery Matches**: Real notes or direct quotes from Nest Realty operations discovery have been scrubbed or generalized.

## 2. Environment Variables & Auth Gate
- **Passcode Gate**: The server handles validation via `POST /api/demo/access`.
- **Server Environment Variable**: Passcode must be set via the `DEMO_PASSCODE` server-side environment variable.
- **Vite Security**: Do not use `VITE_DEMO_PASSCODE` in the frontend code. Frontend Vite variables are exposed to client-side bundles and are not secure.

## 3. Recommended Cloud Run Protection
- **Remove Public Access**: If the demo workspace ever exposes sensitive internal material, disable the public Cloud Run endpoint or restrict permissions.
- **Use Identity-Aware Proxy (IAP) or IAM**: Prefer Google Cloud IAP or Cloud Run IAM policies to protect private staging deployments.
- **Rotate Credentials**: Instantly rotate any passcodes shared in chat history, documentation, or screenshot uploads.
- **No Fallback Passcodes**: Do not hardcode default passcodes in the repository source code.

## 4. Sandboxed Connectors
- **Mock Events only**: All integrations run in sandbox simulation mode.
- **No Real OAuth Credentials**: Active OAuth tokens are mocked and stored safely in temporary local states. No outbound emails, SMS, or webhooks are dispatched to external client endpoints.
- **Outbound Guard**: The file `src/integrations/productionGuards.ts` intercepts and blocks any outbound integration payloads before they are submitted.
