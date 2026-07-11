# final-auth-risk-assessment.md

## 1. Core Authentication Audit Questions & Answers

| # | Question | Answer | Details |
| :--- | :--- | :--- | :--- |
| **1** | Are bearer tokens stored in localStorage? | **Yes** | Stored under `shapework_session_token` on the client. |
| **2** | Are tokens cryptographically verified? | **No** | Verified via simple string equality checks against database user IDs or emails. No signature, hashing, or validation is performed. |
| **3** | Is there a real auth provider? | **No** | Live authentication is fully simulated by matching against local memory structures. |
| **4** | Are sessions server-side? | **No** | Stateless token lookup. The server doesn't track active sessions. |
| **5** | Are cookies httpOnly and secure? | **No** | Cookies are not utilized. LocalStorage is vulnerable to XSS. |
| **6** | Can a fake Bearer token pass? | **Yes** | Any string matching a valid user ID or email (e.g. `usr_sarah` or `owner@nestrealty.com`) will authenticate. |
| **7** | Can a copied token be replayed? | **Yes** | Replayable indefinitely. No token expiration or usage limit is enforced. |
| **8** | Does logout revoke the token? | **No** | Logout only clears the token from the client's `localStorage`. |
| **9** | Are tokens ever logged? | **No** | Bearer headers are filtered out of audit trails and server logs. |
| **10**| Are tokens included in exports? | **No** | Excluded from settings backups, database state logs, and JSON exports. |

---

## 2. Risk Classification

Due to the stateless plain-text matching of bearer tokens stored in `localStorage`:

**`high risk for self-serve production`**

This authentication layer is **NOT safe** for open public internet routing or self-serve customer sign-ups.

---

## 3. Controlled Pilot Authorization Limits

This scheme is classified as acceptable for:

**`controlled manual-first pilot with shapework present`**

Only under the following operational restrictions:

* **No Sensitive Data**: No real social security numbers, bank routing information, or proprietary financial assets may be imported.
* **Limited Access**: The site must be gated behind a secure passcode block (`shapework2026` or IP restrictions).
* **Supervised Sessions**: shapework personnel must be physically or virtually present during pilot testing sessions.
* **Manual Approvals**: All external integrations must be kept in `Manual-first active` mode. No writes to Twilio, Gmail, or Rechat can occur without manual button approval.
* **No Public URLs**: The deployment must not be shared publicly on social media or search engines.
