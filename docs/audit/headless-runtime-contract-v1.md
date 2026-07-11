# Audit Log: Headless Runtime Contract v1

**Date**: July 8, 2026  
**Status**: Completed  
**Sprint**: Headless Runtime Contract v1  

## Overview
Shapework is designed to operate primarily as a headless action engine rather than a dashboard-first application. This sprint establishes a rigorous, unified, and traceable headless runtime pipeline. All incoming operations (triggers, demo scripts, and manual commands) are processed through a standardized Signal -> Decision -> Job -> Steps -> Action -> Outcome -> Receipt chain.

---

## 1. Unified Backend Services & Models
We formalized and created 10 runtime entities, implemented as modular TypeScript services in `server/headless/`:
1. **[runtimeTypes.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/server/headless/runtimeTypes.ts)**: Declares strict interface schemas for `Signal`, `Decision`, `ShapeworkJob`, `ShapeworkJobStep`, `Approval`, `Action`, `Delivery`, `Outcome`, `Receipt`, and `OwnerBriefItem`.
2. **[signalsService.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/server/headless/signalsService.ts)**: Registers raw external triggers and manual commands in `dbState.signals`.
3. **[decisionService.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/server/headless/decisionService.ts)**: Evaluates signals against standard operating rules (e.g. `RULE_RYAN_SHIELD_ROUTING`, `RULE_COMPLIANCE_GATE_REQUIRED`) and generates confidence and deflection metrics.
4. **[jobPlannerService.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/server/headless/jobPlannerService.ts)**: Maps the decided workflows into a sequence of `ShapeworkJobStep` objects and schedules approval gate objects.
5. **[approvalService.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/server/headless/approvalService.ts)**: Tracks human review decisions, updating step status to `dispatched` or `completed`.
6. **[actionDispatchService.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/server/headless/actionDispatchService.ts)**: Executes action adapter stubs (email, SMS, internal routing) and writes `Action` and `Delivery` log entries.
7. **[outcomeService.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/server/headless/outcomeService.ts)**: Logs step outcomes, completes jobs, generates receipts, and synchronizes legacy output fields.
8. **[ownerBriefService.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/server/headless/ownerBriefService.ts)**: Rolls up executive summary items in the `ownerBriefItems` database array.

---

## 2. Cockpit UI Integration
- **`server.ts`**:
  - Initialized all new array collections on startup database schemas.
  - Refactored `POST /api/shapework/demo/trigger-scenario` to run the full headless pipeline.
  - Refactored `POST /api/shapework/jobs/create` (composer input) to construct manual signals and evaluate decisions.
  - Updated `/api/shapework/jobs/steps/:id/approve` to resolve approval gates and resume the background simulation loop via step callbacks.
- **Frontend App**:
  - `CustomerAppRoutes.tsx` polls and passes down `ownerBriefItems` and `setCurrentTab` props.
  - `WeeklyOwnerBrief.tsx` displays active approvals and deflections directly from `ownerBriefItems` and links them back to the Workboard cockpit.

---

## 3. E2E Verification Results
We wrote a dedicated E2E test file validating the full contract loop:

```bash
npx playwright test tests/e2e/headless-runtime-contract.spec.ts

Running 1 test using 1 worker

[Job Queue] Asynchronous background worker polling initialized.
[Auth Seed] Successfully seeded workspace users.
Development seed loaded
[Shapework] Master full-stack server running on http://0.0.0.0:3096
  ✓  1 tests/e2e/headless-runtime-contract.spec.ts:50:3 › Headless Runtime Contract v1 E2E Verification › 1. Trigger Compliance Chase Scenario and Verify Signals, Decisions, Jobs, Steps, Actions, and Receipts (5.3s)

  1 passed (13.9s)
```
All system assertions, database entries, and state transitions successfully pass.
