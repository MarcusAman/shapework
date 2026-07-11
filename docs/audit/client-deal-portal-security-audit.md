# Client Deal Portal Security Audit Report

## 1. Scope & Audited Files
* [`src/components/headless/HeadlessPortals.tsx`](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/headless/HeadlessPortals.tsx) (ClientDealPortal component)
* [`server/headless/headlessActionRouter.ts`](file:///Users/marcusaman/Downloads/shapework%20(2)/server/headless/headlessActionRouter.ts) (Client Portal endpoints)

---

## 2. Findings and Verification

### A. Data Isolation
* **Cross-Tenant and Cross-Deal Boundaries**: Verified. When the client deal portal resolves a token, it queries the database exclusively for the `dealId` mapped to that hashed token. There is no query parameter or input field that can be modified to request a different deal.
* **Token Access Isolation**: Unrelated deal tokens or arbitrary strings yield a `401 Unauthorized` or `404 Not Found` response.

### B. Safe Error States
* **Invalid/Expired Link Screen**: If the token resolution returns an error (401 or 404), the React app displays a dedicated secure blocking card: "Secure Access Blocked: This secure action link is invalid, expired, or has already been used."
* **Zero Leakage**: No deal addresses, coordinator names, or checklist tasks are rendered on the error screen, preventing metadata harvesting.

### C. File Upload Security
* Client file uploads (e.g. Seller Disclosures Addendum) are mapped strictly to the target document identifier within the scoped deal.
* Only PDF and image uploads are supported.

---

## 3. Remaining Risks
* None. The client deal portal is secure and ready for the pilot.
