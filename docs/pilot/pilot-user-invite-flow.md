# Pilot User Invite Flow

This document details the invite, suspension, and permissions revocation process for pilot users.

---

## 1. Invite and Account Setup
* For the controlled customer pilot sprint, self-serve registration is **disabled**.
* To add a new pilot user:
  1. Admin logs in.
  2. Navigates to Workspace settings.
  3. Fills in the email, name, and role (e.g. `agent`, `transaction_coordinator`, `operations_lead`) of the invitee.
  4. The system generates an initial hashed password block or dynamic setup URL.
  5. The pilot user sets a secure password during onboarding.

---

## 2. Revocation and Suspension
* Admin/Owner can suspend any operator dynamically:
  - Setting status to `suspended` in the users database.
  - The status change takes effect immediately.
* Any active session for a suspended user is terminated immediately on the next API request because the `requireAuth` middleware queries user status dynamically from the database.
* Suspended users are locked out from logging back in.
