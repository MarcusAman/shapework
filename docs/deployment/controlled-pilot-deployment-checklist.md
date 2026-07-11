# Controlled Pilot Deployment Checklist

This document contains the step-by-step checklists and environment requirements for deploying a secure, customer-safe pilot instance of shapework.

---

## 1. Environment Variable Specification

The following variables must be configured in the production environment. Defaults are strictly disabled on startup.

| Environment Variable | Required Value / Format | Security Rationale |
|----------------------|-------------------------|--------------------|
| `APP_MODE` | `production` | Deactivates dev/staging seeds, overrides query parameter tenant parsing, enforces HTTP cookie Secure flag. |
| `STORAGE_DRIVER` | `database` | Directs persistence to relational PostgreSQL instance, disabling transient mock JSON flat files. |
| `DATABASE_URL` | `postgres://<user>:<password>@<host>:<port>/<db>` | Target database connection URI. Startup fails closed if missing. |
| `JWT_SECRET` | Cryptographically random string (min 32 chars) | Key utilized to sign and verify HMAC-SHA256 session cookies. |
| `CREDENTIAL_ENCRYPTION_KEY` | 32-character ASCII key | Symmetric encryption key used by the credential vault. |
| `AUTH_PROVIDER_CONFIGURED` | `true` | Declares active production authentication, gating route access. |
| `ADMIN_BOOTSTRAP_SECRET` | Unique, random setup secret | Gates default pilot workspace and owner account seeding. |

---

## 2. Bootstrapping and Seeding Checklist

1. [ ] **DB Migrations Verification**:
   - Apply schema changes by booting the server.
   - Assert that tables, indexes, and primary/foreign keys are successfully populated in target database.
2. [ ] **Initial Tenant Bootstrap**:
   - Start the application with `ADMIN_BOOTSTRAP_SECRET` set to a secure token.
   - Verify that the pilot workspace (`nest-realty-demo`) and owner operator (`sarah.j@nest-demo.local`) are successfully seeded with a cryptographically hashed password.
3. [ ] **Deactivate Bootstrap Secret**:
   - Restart the server process *without* `ADMIN_BOOTSTRAP_SECRET` defined.
   - Verify the server continues to boot cleanly and does not re-attempt seeding.

---

## 3. Pre-Flight Security Gate Checks

- [ ] **HTTPS/TLS Enforced**: Secure cookie flag requires SSL/TLS. Assert that the server is behind an HTTPS reverse proxy (e.g. Nginx, Cloudflare) and that TLS 1.3 is enforced.
- [ ] **Session Expiry**: Confirm session expiration is set to 1 hour (`Max-Age=3600`).
- [ ] **CSRF Verification**: Verify that the Reverse Proxy/Load Balancer forwards the correct `Host` header, so that global CSRF origin comparisons match.
- [ ] **Log Inspections**: Check system output to confirm that no environment secrets (e.g. `JWT_SECRET`, `ADMIN_BOOTSTRAP_SECRET`) or plaintext client passwords are printed in startup/request logs.
