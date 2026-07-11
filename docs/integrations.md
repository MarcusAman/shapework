# Integrations & Sourcing Strategy: .Shapework

## Overview
.Shapework does not replace existing software suites; it synchronizes them. This document specifies the integration boundaries and the normalized pipeline for external APIs.

## Integration Registry

### Sourced Systems of Record (Active MVP)
1. **Rechat:** Sourced contacts, active listing milestones, agent directories, and transaction tasks.
2. **Gmail:** Threading and extraction on transaction-specific folder labels (e.g., `Shapework/123-Main`).
3. **Google Calendar:** Inspection and appraisal timelines synchronized into unified brokerage timeline.
4. **Google Drive:** Transaction-associated folders analyzed for missing seller disclosures or incomplete agreements.

### Coming Soon integrations
* Dotloop, SkySlope, Follow Up Boss, kvCORE, MLS / RESO, Twilio, and Title / Escrow platforms.

## OAuth and Minimal Scope Strategy
* **Permission Isolation:** Google OAuth requests the minimal scope necessary (e.g., read-only access to custom Gmail labels rather than full inbox access).
* **Decoupled Refresh Tokens:** API keys, access tokens, and refresh credentials are stored securely in backend-encrypted databases.
* **Fallback Design:** When credentials are absent or expired, adapters gracefully switch into simulated Mode, displaying clear status indicators in the Integrations Panel.
