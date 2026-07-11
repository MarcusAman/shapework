# Staging CORS and CSRF Audit

This document details the cross-origin sharing and request forgery mitigation controls verified on the staging deployment.

---

## 1. CORS Allowed Origins Policy
* CORS is configured using a strict origin matching mechanism.
* Allowed origins are defined in the environment via the `ALLOWED_ORIGINS` variable.
* Same-origin requests (where the origin matches the `Host` header) are dynamically trusted to support the native pilot workspace workflow.
* Wildcard origins (`*`) are strictly prohibited for requests requesting credentials (`Access-Control-Allow-Credentials: true`).

---

## 2. CSRF Mitigation Checks
* For all state-changing methods (`POST`, `PUT`, `DELETE`, `PATCH`), the server validates:
  1. `Origin` header matches the trusted host or same-site allowed domains.
  2. `Referer` header matches the trusted host if the `Origin` header is absent.
  3. If both headers are absent, state-changing requests fail with `403 Forbidden` in production mode.
* Cross-site form submissions are blocked because the SameSite cookie attribute is set to `Strict`.

---

## 3. Test Results Summary
* **Allowed Origin (Same-Origin)**: Handled successfully, returns `200 OK`.
* **Disallowed Origin**: Blocked immediately, returns `403 Forbidden`.
* **Spoofed Referer**: Blocked immediately, returns `403 Forbidden`.
* **Missing Headers in Production**: Blocked immediately, returns `403 Forbidden`.
