# Audit Report: Current Integrations Page State

This document inventories the visual cards, brand assets, button behaviors, and routes in the current integrations implementation of shapework.

## 1. Cards Currently Shown
The `/app/integrations` hub presently shows two categories of cards:
1. **Hardcoded Connection Panels**:
   * Rechat Partner Integration
   * Dotloop via API Nation
   * QuickBooks Online
   * Basecamp
   * Google Workspace
   * Microsoft 365
2. **Category/Phase Catalog Sections**:
   * Priority 1: Internal Operating Memory, Secure Agent Links, Manual CSV Import, Demo Webhook Ingest.
   * Priority 2: Gmail Workspace, Microsoft Outlook / Exchange, Twilio SMS Gateway, Google & Microsoft Calendars, Google Drive & OneDrive / SharePoint.
   * Priority 3: Dotloop Transaction Rooms, SkySlope Escrow Files, MLS / RESO API Feed.

---

## 2. Issues & Discrepancies Found

### Missing Local Logos/Assets:
* Brand logos (Gmail, Outlook, QuickBooks, Google Calendar, Microsoft 365, etc.) are rendered inline via SVG paths in `BrandIcon.tsx` but do not exist in the file system as separate `.svg` assets.
* standalone Plaid, API Nation, Zapier, Google Business Profile, SMTP Email, and SMS Provider lack assets and fallback placeholders.

### Dead Buttons or Broken CTAs:
* Twilio SMS Gateway, Google Calendar, OneDrive/SharePoint cards in the phase sections do not have active interactive buttons.
* standalone Plaid, Zapier, Google Business Profile, and SMS Provider are not represented in the registry lists.

### /demo Leakage:
* The default React router maps `/demo/integrations` instead of `/app/integrations` in `appRoutes.ts`.
* The dashboard status pills and links occasionally route users to `/demo/` pages.

---

## 3. Route and Env Var Gaps

### Implemented Routes:
* `/api/integrations/google/*`
* `/api/integrations/microsoft/*`
* `/api/integrations/quickbooks/*`
* `/api/integrations/basecamp/*`
* `/api/integrations/rechat/*`
* `/api/integrations/apination/dotloop/*`

### Missing Routes:
* `/api/integrations/plaid/*`
* `/api/integrations/api-nation/*`
* `/api/integrations/zapier/*`
* `/api/integrations/google-business-profile/*`
* `/api/integrations/email/*`
* `/api/integrations/sms/*`
