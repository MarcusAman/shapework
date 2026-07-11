# controlled-manual-first-pilot-rules.md

This document establishes the binding operational rules for conducting the custom **shapework.** workspace pilot program. These boundaries ensure security and operational safety.

---

## 1. Core Pilot Boundaries

1. **shapework Presence Required**: At least one member of the shapework technical or operations team must be present (either physically or via screen-share session) during any active usage of the app by the customer.
2. **Manual-First Workflows Only**: All workflow automations must remain in `Manual-first active` mode. Any action proposing writebacks or integrations modifications must halt and wait for human coordinator confirmation.
3. **No Unsupervised Access**: No self-serve customer login links or open public URL routes can be dispatched. Users must not be left to navigate the application without guidance.
4. **Data Scope Limits**: Under no circumstances should real bank routing codes, social security numbers, or sensitive financial dossiers be imported or typed into the system. Only basic transaction addresses, synthetic client contacts, and agent assignment matrices should be populated.
5. **Approval Gated Messaging**: All emails, SMS dispatches, or document packets proposed by the AI workbench must route to the **Approval Center** drawer. Direct automated delivery to clients is prohibited.
6. **No Auto-Writeback**: External systems connector writebacks (e.g. archiving files to SkySlope, updating Rechat records) must be verified manually by the Broker Owner or Operations Lead.
7. **Auth Security Gating**: The present `localStorage` plain-text bearer authentication is temporary. A cryptographically verified auth provider (e.g., Supabase Auth) must be configured and active before launching any unsupervised client access.
8. **Persistence Safeguards**: The present flat-file JSON local driver is temporary. The database driver must be connected to a live secure Postgres instance before migrating out of the pilot environment.
9. **Support Boundaries Acknowledgment**: The customer must sign the Support Boundaries Manual, agreeing that shapework is not responsible for upstream third-party service outages (e.g., Rechat, Dotloop, SkySlope API drops).
10. **Success Metrics & Exit Criteria**:
    * **Success**: 100% of deal compliance documents correctly triaged and verified via the manual checkoff queues over a 14-day cycle.
    * **Exit**: Successful completion of the pilot period without data loss, leading to the graduation requirement list for database and cryptographic auth migration.
