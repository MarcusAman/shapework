# Headless Notification Preview Gallery Report

## 1. Scope & Gallery Component
* [`src/components/headless/HeadlessPreviewGallery.tsx`](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/headless/HeadlessPreviewGallery.tsx)
* [`server/headless/headlessActionRouter.ts`](file:///Users/marcusaman/Downloads/shapework%20(2)/server/headless/headlessActionRouter.ts)

---

## 2. Active Notification Catalog Previews

The preview gallery supports interactive, real-time rendering of all 11 notification templates across email and SMS channels:

1. **Client Deal Invitation (`client_portal_invite`)**: Secure action invite for clients to view transaction checklist and message coordinators.
2. **Agent Action Notification (`agent_action_portal`)**: Prompts listing agents to complete compliance tasks (e.g. upload verification).
3. **Smart Intake Portal Link (`smart_intake_link`)**: Form links for routing marketing, compliance, or maintenance requests.
4. **Owner Shield Deflection Log (`owner_shield_review`)**: Summarizes deflected routine tasks and held items in the weekly owner digest.
5. **Triage Low-Confidence Alert (`triage_low_confidence`)**: Escalates signal messages to operations coordinators for manual classification.
6. **Webhook Delivery Failure (`webhook_delivery_failure`)**: Alerts operations of offline callback URLs and exhausted delivery retries.
7. **Document Upload Confirmation (`upload_received`)**: Acknowledges safe file reception in client portal.
8. **Transaction Status Update (`deal_status_changed`)**: Signals client/coordinator of milestone transitions.
9. **Compliance Issue Correction (`compliance_issue_flagged`)**: Notifies agent of document rejection reasons.
10. **Help Desk Acknowledgment (`support_request_received`)**: Acknowledges ticket creation and queue routing.
11. **Pilot Welcome / Activation (`pilot_welcome`)**: Initializer notice for brokerage workspace pilots.

---

## 3. Security and Testing Guards

### A. Preview Authorization
* In production mode (`APP_MODE === 'production'`), loading previews requires matching `NOTIFICATION_PREVIEW_TOKEN` query parameter. Invalid or missing tokens block rendering with a strict 401 response.
* In development mode, the token validation is bypassed.

### B. Safe Sending Control
* **Test Sending Gate**: Test dispatches are blocked unless `ENABLE_NOTIFICATION_TEST_SEND=true` is set.
* **Allowlist Enforcement**: Dest email must match a comma-separated list in `NOTIFICATION_TEST_ALLOWLIST` (e.g., `marcus@shapework.co`).
* **Subject Prefix**: Outbound test emails use the forced prefix `[Shapework Preview]`.
