# ASK NEST OPS CONTRACT COPILOT: PHASE 4A.2 EXTERNAL CHANNEL SECURITY IMPLEMENTATION REPORT
**Phase 4A.2: External Channel Security Hardening & Verified Broker Claiming**  
**Target Scope:** Nest Realty Wilmington / Coastal NC Pilot (`nest-realty-wilmington`)  
**Date:** August 5, 2026  

---

## 1. Executive Summary & Critical Security Finding

Phase 4A.2 performs a focused security hardening pass on external intake channels (Retell phone, Retell SMS, email).

### Security Gap Discovered in Phase 4A.1:
In Phase 4A.1, external intake endpoints (`/api/contracts/channels/*`) matched an incoming caller ID or sender email address against the Nest roster and immediately derived identity and updated `ContractIntakeSession`.
- **Finding**: Phone number / email matching is **candidate identification**. It is **NOT** authentication and **MUST NOT** grant `contract_authoring` by itself. Unauthenticated HTTP POST requests containing a registered phone number could previously trigger session modifications.

### Corrected Architecture (Three Independent Security Layers):
1. **TRANSPORT AUTHENTICITY**: Cryptographic HMAC signature verification (`X-Retell-Signature` / `X-Email-Signature`) on raw HTTP request bodies. Invalid signatures fail closed (403/Forbidden). Stale timestamps (> 300s) fail with replay errors. In production, missing signing keys fail closed (`RETELL_INTEGRATION_NOT_CONFIGURED`, `EMAIL_VERIFIER_NOT_CONFIGURED`).
2. **BROKER IDENTITY STATE MACHINE**: Decoupled from transport. States: `unidentified` $\rightarrow$ `candidate_identified` $\rightarrow$ `verification_required` $\rightarrow$ `verified` $\rightarrow$ `revoked`.
3. **EXTERNAL INTAKE QUARANTINE (`PendingContractIntake`)**: Proposed contract facts from external channels are quarantined as `PendingContractIntake` records (`claimStatus: 'pending'`). Unverified inputs **CANNOT** mutate canonical `ContractIntakeSession` records, confirm terms, or request form generation until an authenticated broker claiming step occurs.

---

## 2. Architecture Implemented

```
Inbound Retell / Email Webhook
            │
            ▼
┌────────────────────────────────────────────────────────┐
│ 1. TRANSPORT AUTHENTICITY LAYER                       │
│ - RetellWebhookVerifier (X-Retell-Signature)           │
│ - EmailWebhookVerifier (X-Email-Signature)             │
│ - Raw Request Body HMAC SHA-256 Verification           │
│ - Replay Protection (Max 300s Timestamp Age)          │
│ - Fails Closed in Production if Keys Missing           │
└────────────────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────┐
│ 2. BROKER IDENTITY CANDIDATE RESOLUTION               │
│ - Match Phone/Email to Server-Side Roster              │
│ - Status: candidate_identified                         │
└────────────────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────┐
│ 3. PENDING INTAKE QUARANTINE (`PendingContractIntake`)  │
│ - Quarantines Proposed Terms, Address, Parties         │
│ - Redacts Sensitive Financial Data in-place            │
│ - Claim Status: pending                                │
│ - Cannot mutate canonical ContractIntakeSession!       │
└────────────────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────┐
│ 4. AUTHENTICATED BROKER CLAIM & AUTHORIZATION          │
│ - Authenticated Broker (Nest Ops Hub / Token) Claims   │
│ - Validates User ID Matches Candidate User ID          │
│ - Validates Workspace ID matches                       │
│ - Checks contract_authoring capability                │
│ - Merges facts into canonical ContractIntakeSession    │
└────────────────────────────────────────────────────────┘
```

---

## 3. Files Created & Modified

### Files Created
1. `server/contracts/retellWebhookVerifier.ts`: Cryptographic Retell signature verifier (`X-Retell-Signature`) with raw body HMAC SHA-256 verification, replay protection, and production fail-closed gate.
2. `server/contracts/emailWebhookVerifier.ts`: Provider-neutral email webhook signature verifier with production fail-closed gate.
3. `server/contracts/pendingContractIntake.ts`: Pending intake quarantine model and `PendingContractIntakeService` handling creation, quarantine, and authenticated broker claiming (`claimPendingIntake`).
4. `tests/contracts/contract-copilot-phase4a2-security.spec.ts`: Phase 4A.2 test suite (20 adversarial tests).
5. `ASK_NEST_OPS_CONTRACT_PHASE4A_2_EXTERNAL_CHANNEL_SECURITY.md`: Security implementation report.

### Files Modified
1. `server/contracts/retellContractIntakeAdapter.ts`: Refactored to enforce transport verification and quarantine proposed facts in `PendingContractIntake`.
2. `server/contracts/emailContractIntakeAdapter.ts`: Refactored to enforce transport verification and quarantine proposed facts in `PendingContractIntake`.
3. `server/contracts/contractChannelRoutes.ts`: Added `/api/contracts/channels/pending/:id/claim` endpoint.
4. `tests/contracts/contract-copilot-phase4a1-omnichannel.spec.ts`: Updated test payloads to include valid signature fixtures and claim steps.

---

## 4. Test Suite & Build Verification Results

| Test Suite | Scope | Result | Notes |
| :--- | :--- | :--- | :--- |
| **Phase 4A.2 Security Suite** | `tests/contracts/contract-copilot-phase4a2-security.spec.ts` | **20 / 20 Passed (100%)** | HMAC signatures, replay, quarantine, & claim security verified |
| **Phase 4A.1 Omnichannel Suite** | `tests/contracts/contract-copilot-phase4a1-omnichannel.spec.ts` | **16 / 16 Passed (100%)** | Multi-channel continuity & claim workflows pass |
| **Phase 4A Forms Provider Suite** | `tests/contracts/contract-copilot-phase4a-forms-provider.spec.ts` | **12 / 12 Passed (100%)** | Fail-closed gate, registry, & versioning pass |
| **Phase 3 Voice Suite** | `tests/contracts/contract-copilot-phase3-voice.spec.ts` | **15 / 15 Passed (100%)** | Voice authorization & 10 conversation scenarios pass |
| **Phase 2 & 2.1 Backend Suite** | `tests/contracts/contract-copilot-phase2.spec.ts` | **10 / 10 Passed (100%)** | Capability authorization, safety gate, & state machine pass |
| **Combined Contract Suite** | `tests/contracts/` | **73 / 73 Passed (100%)** | All 73 contract tests pass cleanly |
| **Vite & Node Build** | `npm run build` | **Build Success (4.53s)** | Generated `dist/index.html` & `dist/server.cjs` with 0 errors |

---

## 5. Explicit Confirmation of Non-Negotiable Boundaries

- **0 outbound or inbound external telephone calls executed**.
- **0 real SMS messages sent or received from cellular networks**.
- **0 real emails sent or received from external SMTP servers**.
- **0 production Retell or ElevenLabs external account actions taken**.
- **0 forms-provider transactions executed**.
- **0 e-signature delivery calls executed**.
- **0 code committed or pushed to remote git repository**.
