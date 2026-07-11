# CSRF Risk & Origin Verification Audit Report

This document reports findings from the comprehensive security review of Cross-Site Request Forgery (CSRF) defenses for state-changing endpoints.

---

## 1. Mapped State-Changing Endpoints

The following POST, PUT, DELETE, and PATCH endpoints perform modifications to workspace states, user memberships, transaction records, or user sessions:

* `/api/workspaces/activate` (POST)
* `/api/auth/login` (POST)
* `/api/auth/logout` (POST)
* `/api/import` (POST)
* `/api/actions/approve` (POST)
* `/api/actions/reject` (POST)
* `/api/integrations/rechat` (POST)
* `/api/integrations/apination/dotloop` (POST)
* `/api/operating-record/log` (POST)
* `/api/transactions/create` (POST)

---

## 2. Implemented Defense Strategy

* **Cookie Level Defense**: The session cookie `shapework_session` is configured with `SameSite=Strict`. Standard modern browsers automatically block delivery of strict cookies on all cross-origin requests, eliminating cross-site request replay risks.
* **Middleware Level Defense**: A custom global `csrfProtection` middleware is registered directly inside the HTTP pipeline. For all state-changing HTTP methods (`POST`, `PUT`, `DELETE`, `PATCH`), the middleware executes the following checks:
  1. **Origin Verification**: If the request contains an `Origin` header, the host part is extracted and compared directly against the server's `Host` header.
  2. **Referer Verification**: If the `Origin` header is missing but `Referer` is present, the referer URL's host is verified against the `Host` header.
  3. **Strict Production Enforcement**: In `APP_MODE=production`, if BOTH `Origin` and `Referer` headers are missing, the request is immediately rejected with `403 Forbidden` to block API consumer tampering or server-to-server CSRF spoofing.
  4. **Host Mismatch Handling**: Any mismatch triggers a security warning warning log and immediate return of `403 Forbidden`.
