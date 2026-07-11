# Staging Cookie Session Audit

This audit documents cookie-based session delivery, lifetimes, and storage parameters verified on the live staging environment.

---

## 1. Cookie Specification & Verification

| Property | Value / Setting | Verification Method | Security Rationale |
|---|---|---|---|
| **HttpOnly** | `true` | Browser DevTools / Playwright test | Prevents client-side scripts from reading the JWT session token (mitigates XSS extraction). |
| **Secure** | `true` | Browser DevTools / Playwright test | Prevents the browser from sending the cookie over unencrypted HTTP requests (mitigates eavesdropping). |
| **SameSite** | `Strict` | Browser DevTools / Playwright test | Restricts cookie sending to same-site navigation only (mitigates CSRF). |
| **Path** | `/` | Browser DevTools / Playwright test | Restricts cookie access to the target root domain scope. |
| **Max-Age** | `3600` (1 hour) | Response header check | Enforces session timeouts. |

---

## 2. Session Lifecycle Tests
* **Unauthenticated Access**: Requests to protected routes without a cookie return `401 Unauthorized` or redirect to the login screen.
* **Token Tampering**: Appending random characters to the cookie signature causes cryptographic verification to fail, resulting in immediate session rejection.
* **Logout Revocation**: Logging out sets the `Max-Age=0` cookie header, successfully purging the browser's cookie storage.
* **Storage Isolation**: Verification asserts that no session tokens are stored in `localStorage` or `sessionStorage`.
