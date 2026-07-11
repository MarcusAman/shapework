# Authentication & Authorization Reality Check

This document reports on the cryptographic integrity and deployment limitations of the current authorization layer in production mode.

---

## 1. Authentication Infrastructure Questions

* **Is a real authentication provider integrated?**
  * *No*. The backend uses a stateless token extraction routine. There is no active integration with an Identity Provider (IdP) like Firebase Auth, Auth0, or Supabase Auth.
* **Is `AUTH_PROVIDER_CONFIGURED` just a flag?**
  * *Yes*. It is an environment boolean flag (`process.env.AUTH_PROVIDER_CONFIGURED`) used to toggle the strict path enforcement during server boot.
* **Are session tokens validated cryptographically?**
  * *No*. Tokens are checked directly as plain strings. There is no JWT signature verification, public key lookup, or symmetric hash check.
* **Are sessions verified server-side?**
  * *No*. There is no server-side session registry or cookie store validation.
* **Can a fake Bearer token pass?**
  * *Yes*. Any string that matches a registered user's ID or email address (e.g. `owner@prod.co`) in the dynamically loaded user database is trusted immediately as a valid Bearer token.
* **Can a seeded token pass in production?**
  * *No*. Seeded tokens like `token_usr_sarah` are explicitly blocked in production.
* **Can auth be bypassed locally?**
  * *Yes*. When running in development/demo mode (`APP_MODE !== 'production'`), requests without authorization headers fall back to the default user `usr_sarah` automatically.
* **Are user IDs trusted from the client?**
  * *Yes*. The client asserts the token, and the server resolves the user identity directly from the token string.

---

## 2. Security Decision & Boundary Constraints

> [!CAUTION]
> **Controlled Pilot Restrictions**: Because tokens are validated as plain text strings without cryptographic signatures, **the production customer pilot must remain controlled and internal**.
> 
> **Customer self-serve access is NOT approved** until a real authentication provider is integrated to handle secure password/session management.
