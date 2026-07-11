# Production Seeding Audit Report

This document reports findings from the comprehensive security review of data seeding and bootstrap mechanics in production environments.

---

## 1. Zero Default-Seeding Guard

* **Startup Hygiene**: In `production` mode, the server initializes with an empty database. No default workspaces, administrator/owner credentials, transaction ledger lines, or debug objects are seeded.
* **Demo Data Isolation**: Dev/staging seeds and simulated workspaces are strictly gated behind `APP_MODE !== 'production'`.

---

## 2. Gated Bootstrap Flow

* **Secret Protection**: Production initialization and default seeding are gated behind the `ADMIN_BOOTSTRAP_SECRET` environment variable.
* **Seeding Trigger**: The system will ONLY execute default seeding of the pilot workspace (`nest-realty-demo`) and owner account if `process.env.ADMIN_BOOTSTRAP_SECRET` is configured and matches a secure bootstrap token.
* **Auditability**: Seeding events print clear log notices:
  `[Bootstrap] Admin bootstrap secret detected. Seeding pilot workspace...`
  The actual value of the `ADMIN_BOOTSTRAP_SECRET` is never logged, printed, or returned by any API endpoint.
