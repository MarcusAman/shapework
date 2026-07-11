# final-readiness-decision.md

This report registers the final deployment readiness decision and technical graduation roadmap for **shapework.**.

---

## 1. Final Deployment Decision

The deployment readiness status is:

**`controlled_manual_first_pilot_with_shapework_present`**

* **Why**: All frontend UI leaks, robotic panels, and brand overlays have been successfully eliminated. Tenant isolation and workspace onboarding flows are functional. However, security (plaintext bearer auth tokens in `localStorage`) and persistence (local JSON flat-file db without real PostgreSQL writes) prevent graduation to self-serve or full production.

---

## 2. Readiness Breakdown

### What is Verified & Production-Grade
* **Visual Polish**: 100% of the 10 core views show no sandbox/demo/synthetic data leaks. 
* **Workspace Isolation**: Fully gated route tenant boundaries preventing cross-tenant access.
* **Onboarding & Setup**: Creation of dynamic new workspaces, matching profiles, and dynamic permission resolution.
* **Esc Drawer Audits**: All details drawers and search grids support keyboard escape-key closes.

### What is NOT Production-Grade
* **Authentication**: Plaintext user ID/email matching inside requests. No cryptographic verification (JWT check).
* **Database Driver**: The Supabase client is a mock structure. All writes fall back to in-memory JSON serialization.
* **Disk Resilience**: flat-file JSON storage (`/data/db.json`) is vulnerable to data loss on container redeployment.

---

## 3. Scope Boundaries

### Safe Pilot Scope
* Gated in-office testing sessions.
* Supervised manual transaction logging.
* Interactive walkthroughs with shapework personnel present.
* Using mock files or non-sensitive, public deal listings.

### Unsafe / Prohibited Use Cases
* Deploying to a public, unpasscoded domain.
* Allowing customer sign-ups without direct shapework staff supervision.
* Importing authentic agent tax records, banking details, or encrypted credential keys.
* Automated email or SMS campaigns dispatched to real end-clients.

---

## 4. Graduation Roadmap

### Requirements for Customer Self-Serve Launch
1. **Cryptographic Authentication**: Integrate a standard identity provider (e.g. Supabase Auth or Firebase Auth).
2. **Secure Session Cache**: Transition session variables to secure, httpOnly cookies to prevent XSS scraping.

### Requirements for Full Production Release
1. **Live PostgreSQL Integration**: Implement database schemas and link repositories to make SQL queries.
2. **Persistent Volumes**: Configure AWS/GCP disk mounts to secure storage if flat-file structures remain active.

---

## 5. Recommended Next Sprint

* **Sprint Theme**: **"Secure Identity & Relational Persistence Migration"**
* **Primary Target**: Replace mock memory repositories with live PostgreSQL tables and migrate authentication to a JWT-signed verification provider.
