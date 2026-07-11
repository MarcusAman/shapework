# Smart Intake Link Security Audit Report

## 1. Scope & Audited Files
* [`src/components/headless/HeadlessPortals.tsx`](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/headless/HeadlessPortals.tsx) (SmartIntakeLink component)
* [`server/headless/headlessActionRouter.ts`](file:///Users/marcusaman/Downloads/shapework%20(2)/server/headless/headlessActionRouter.ts) (`/intake/submit` route)

---

## 2. Findings and Verification

### A. Route Type Allowlist Enforced
* **Validation**: Verified. In `/intake/submit`, the incoming `type` parameter is compared against an explicit allowlist:
  `const ALLOWED_INTAKE_TYPES = ['marketing', 'compliance', 'office', 'support'];`
* **Deflection of Arbitrary Types**: Requests containing any other type (such as `admin`, `system`, or `database`) are immediately rejected with a `400 Bad Request` error.

### B. Input Validation and Sanitization
* Submission forms validate that the `title` field is populated.
* The created Work Item is assigned to a specific role queue based on the intake type:
  * `marketing` -> `marketing_coordinator`
  * `compliance` -> `operations_lead`
  * `office` -> `maintenance`
  * `support` -> `operations_lead`

### C. Owner Shield Hook
* Every smart intake submission triggers the `runOwnerShieldForWorkItem` ruleset, ensuring routing and deflection rules are evaluated in real-time.

---

## 3. Remaining Risks
* Spammer submissions: The intake portal is public. If exposed to the internet, it could receive spam.
* *Mitigation*: The pilot will deploy these routes behind standard Cloudflare Bot Management or simple rate limiting.
