# ASK NEST OPS CONTRACT COPILOT: PHASE 4A FORMS PROVIDER READINESS & DISCOVERY REPORT
**Phase 4A: Licensed North Carolina Forms Provider Readiness & Adapter Architecture**  
**Target Scope:** Nest Realty Wilmington / Coastal NC Pilot (`nest-realty-wilmington`)  
**Date:** August 5, 2026  

---

## 1. Existing Architecture & Reusability

Phases 1 through 3 established a channel-independent, state-machine-driven contract domain in Shapework.

### Reusable Components Implemented:
1. **Canonical Intake Session (`ContractIntakeSession`)**: Channels (ElevenLabs WebRTC voice, SMS, email, Nest Ops Hub) write to a single source of truth.
2. **Deterministic State Machine & Validation (`ContractStateMachine`, `ContractValidationEngine`)**: Enforces required terms, valid date sequences, prohibited content, sensitive data redaction, and capability authorization before allowing draft generation.
3. **Capability-Based BIC Authorization**: Requires explicit `contract_bic_review` capability for exception approvals. Admin roles alone cannot approve contract exceptions.
4. **Production Safety Gate (`ProductionSafetyGate`)**: Fails closed if durable database persistence (`STORAGE_DRIVER === 'database'`) is missing in production.
5. **Voice Authorization Subsystem (`ContractVoiceTokenService`)**: Issues short-lived HMAC-signed tokens bound to user, workspace, session, and capability for ElevenLabs tools.
6. **Provider-Neutral Adapter Interface (`ILicensedContractFormProvider`)**: Defines standard lifecycle methods (`getAvailableForms`, `getFormMetadata`, `getCurrentFormVersion`, `createDraftTransaction`, `populateAuthorizedFields`, `getDraftPreview`, `getProviderTransactionStatus`).

---

## 2. Provider Findings & Legal Constraints

### North Carolina Real Estate Forms Legal Context:
- **Form 2-T Official Terminology**: Form 2-T is the **Joint NC REALTORS / North Carolina Bar Association Offer to Purchase and Contract (Transactional Form)**. It is NOT an "NCREC form." NCREC (North Carolina Real Estate Commission) is the state regulatory body that produces mandatory disclosures (e.g. Residential Property and Owners' Association Disclosure Statement), not transactional contract forms.
- **Official Member Benefit Software**: NC REALTORS designates **Transactions (zipForm Edition)** / **Lone Wolf Transactions** as its official member benefit forms software.

### Strict Boundaries & Safety Rules:
- **NO Copyrighted Text**: The repository contains **ZERO** copyrighted preprinted form text or binary PDF templates.
- **NO Web Scraping or Credential Automation**: Shapework will **NEVER** scrape zipForm, request agent login passwords, or automate browser interactions against individual member accounts.
- **Fail-Closed Gate Active**: In production (`APP_MODE === 'production'` or `NODE_ENV === 'production'`), if no authorized licensed provider is configured (`FORMS_PROVIDER`), the system throws `LICENSED_FORMS_PROVIDER_NOT_CONFIGURED` and blocks draft generation.

---

## 3. Missing Credentials & Integration Agreements

To transition from the Phase 4A fail-closed adapter scaffold to live forms population, Nest Realty must obtain:

| Credential / Agreement | Provider | Description | Required Environment Var |
| :--- | :--- | :--- | :--- |
| **Lone Wolf Partner API Agreement** | Lone Wolf Technologies | Formal enterprise API integration contract | N/A (Commercial Agreement) |
| **Lone Wolf Client ID** | Lone Wolf Transactions | OAuth 2.0 Client Application ID | `LONE_WOLF_CLIENT_ID` |
| **Lone Wolf Client Secret** | Lone Wolf Transactions | OAuth 2.0 Client Application Secret | `LONE_WOLF_CLIENT_SECRET` |
| **Lone Wolf Account / Office ID** | Lone Wolf Transactions | Brokerage Account Identifier | `LONE_WOLF_ACCOUNT_ID` |
| **zipForm Partner API Key** | zipLogix / Lone Wolf | Enterprise Partner API Key (if zipForm REST API used) | `ZIPFORM_PARTNER_API_KEY` |

---

## 4. Discovery Questions for Ryan Crecelius & Nest Realty Leadership

Before enabling production third-party forms population:

1. **Current Forms Software**: What specific software do Nest Realty Wilmington brokers currently use to prepare Form 2-T purchase offers? (e.g., Transactions / zipForm Edition, Lone Wolf Transact, SkySlope Forms, Dotloop, or Authentisign?)
2. **Account Hierarchy**: Is forms software access provisioned via individual agent accounts, a central Nest Realty brokerage master account, or both?
3. **Existing API Agreements**: Does Nest Realty or its franchisor already possess a commercial API or developer agreement with Lone Wolf, SkySlope, or Dotloop?
4. **Forms System Administration**: Who owns technical administration and template management for Nest Realty's forms software?
5. **E-Signature Platform**: What e-signature platform does Nest Wilmington currently use for contract execution? (e.g., DocuSign, Authentisign, SignNow?)
6. **Brokerage Addenda & Custom Forms**: Does Nest Realty maintain approved brokerage-specific addenda or disclosures beyond standard NC REALTORS forms?
7. **Compliance Policy Ownership**: Who at Nest Realty (BIC / Operations / Legal Counsel) holds final compliance authority for approving form version updates?

---

## 5. Recommended Integration Roadmap

```
Phase 4A: Fail-Closed Provider Adapter Architecture (COMPLETED)
    │
    ├─► Phase 4B: Provider Credentials & OAuth Binding (Awaiting Credentials)
    │      ├─► Obtain Lone Wolf / zipForm API credentials from Nest Realty
    │      └─► Implement LoneWolfFormsProviderAdapter with OAuth token refresh
    │
    ├─► Phase 4C: Field Mapping & Version Sync
    │      ├─► Map ContractTerms fields to Lone Wolf API data fields
    │      └─► Automated nightly sync of NC REALTORS form version registry
    │
    └─► Phase 5: E-Signature Integration (DocuSign / Authentisign)
           ├─► Broker reviews populated draft in forms platform
           └─► Broker triggers e-sign routing (Out of Scope for Phase 4A)
```

### Status Matrix:

- **[CONFIRMED]**: Channel-independent contract domain, state machine, HMAC voice tokens, fail-closed production safety gate, and `ILicensedContractFormProvider` adapter interface implemented and 100% verified.
- **[ASSUMED]**: Nest Realty Wilmington uses NC REALTORS / NC Bar Association Form 2-T as its primary buyer offer form.
- **[BLOCKED / NEEDS PROVIDER CONFIRMATION]**: Obtaining official Lone Wolf / zipForm API developer credentials and partner agreement from Nest Realty leadership.
