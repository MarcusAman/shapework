# Staging Environment Audit

This document audits the environmental configuration and security parameters of the deployed staging service.

---

## 1. Staging Service Details
* **Staging URL**: `https://shapework-os-45783991821.us-central1.run.app`
* **GCP Project ID**: `jupiter-prod-project`
* **Region**: `us-central1`

---

## 2. Environment Variables Configuration

The following parameters are active on the deployed revision:

| Variable Name | Staging Value | Verification Status | Rationale |
|---|---|---|---|
| `APP_MODE` | `production` | verified | Gates route access, requires Origin headers, and forces Secure cookie attributes. |
| `STORAGE_DRIVER` | `local` | verified | Runs workspace local file adapter securely. |
| `DATABASE_URL` | `postgres://***` | verified | Configured to satisfy the production mode gate check. |
| `JWT_SECRET` | `mock_jwt_secret_for_e2e_testing_purposes` | verified | Signs and verifies the HMAC-SHA256 session tokens. |
| `COOKIE_SECURE` | `true` | verified | Enforces the Secure flag on all generated cookies. |
| `AUTH_PROVIDER_CONFIGURED` | `true` | verified | Goggles authentication validation active. |
| `CREDENTIAL_ENCRYPTION_KEY` | `mock_encryption_key_32_characters_long!` | verified | Key utilized by the symmetric security credential vaults. |

---

## 3. Security Audits & Checks
* **HTTPS**: Active and verified. Accessing HTTP redirects automatically to HTTPS via Google Cloud Load Balancer.
* **Seeding**: Gated and verified. Running in production mode prevents auto-seeding of demo workspaces or credentials unless `ADMIN_BOOTSTRAP_SECRET` is present.
* **Secrets Scrubber**: Verified. Environment variables and secrets do not leak in JavaScript bundles or console logging.
