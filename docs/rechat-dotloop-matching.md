# Rechat + Dotloop Matching Specifications

This document outlines the address-matching criteria, manual overrides, and writeback security policies applied to the Rechat CRM $\leftrightarrow$ Dotloop Loop matching bridge.

## Matching Criteria & Confidence Scores

The Cross-System Matcher uses the following heuristics to align Rechat deals with Dotloop loops:

1. **Address Normalization Match (90-95% Confidence)**:
   - Compares alphanumeric property addresses (e.g. `204 Birch Lane` vs `204 Birch Ln`).
   - If a normalized address substring matches, records are linked automatically.
   
2. **Ambiguous Address Match (50-65% Confidence)**:
   - Property name or street matches partially, but client names mismatch or are missing (e.g. `Birch Lane Escrow`).
   - These are flagged as `needs_review` and sent to the manual match queue.

3. **Orphan Loops (0% Confidence)**:
   - Loop title has no address signature or client match. Queued for manual triage.

## Manual Resolution Controls

Inside the **Cross-System Match Review** panel, transaction coordinators have three stateful choices:

- **Confirm Link**: Stores the record mapping, updates the Operating Memory, and runs Deal Intake checks.
- **Reject Match**: Removes match recommendations, keeping the loop visible in the Needs Review queue.
- **Orphan & Create New Escrow**: Seeds a new transaction placeholder with the loop's details, bypassing the Rechat CRM dependency, and logging a missing-link issue in the guard.

## Production Writeback Safety

To prevent accidental data pollution:
- **Automatic external writes are disabled**.
- All outbound communication triggers (outbound emails, text alerts, secure link dispatches, task writebacks) require explicit coordinator approval in the **Approval Center** before execution.
