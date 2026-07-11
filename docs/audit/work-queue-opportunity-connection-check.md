# Work Queue Opportunity Connection Check

This document audit-checks the dynamic integration between operational issues and the Work Queue, verifying that all Nest opportunities create distinct, traceable tasks with clear ownership.

---

## Connection Check Matrix

### 1. People & Ownership
- **Issue Type**: vacant role
  - **Work Item type**: `vacant_role`
  - **Owner Role**: `operations_lead`
  - **Priority**: `high`
  - **Remediation**: Assign a team member to the vacant role in settings.
  - **Status**: Checked and working.
- **Issue Type**: missing backup owner
  - **Work Item type**: `missing_backup`
  - **Owner Role**: `operations_lead`
  - **Priority**: `medium`
  - **Remediation**: Assign backup coordinator role to responsibility definition.
  - **Status**: Checked and working.
- **Issue Type**: unclear escalation path
  - **Work Item type**: `unclear_escalation`
  - **Owner Role**: `operations_lead`
  - **Priority**: `medium`
  - **Remediation**: Define clear SLA threshold and escalation manager.
  - **Status**: Checked and working.
- **Issue Type**: owner-worthy decision
  - **Work Item type**: `owner_worthy_decision`
  - **Owner Role**: `operations_lead`
  - **Priority**: `high`
  - **Remediation**: Review proposal and approve/dismiss in Approvals Center.
  - **Status**: Checked and working.
- **Issue Type**: staff workload capacity
  - **Work Item type**: `staff_workflow_reassignment`
  - **Owner Role**: `operations_lead`
  - **Priority**: `high`
  - **Remediation**: Reallocate active files to balance capacity.
  - **Status**: Checked and working.

### 2. Transactions
- **Issue Type**: missing referral/source
  - **Work Item type**: `missing_source`
  - **Owner Role**: `transaction_coordinator`
  - **Priority**: `medium`
  - **Remediation**: Contact agent to document commission referral source.
  - **Status**: Checked and working.
- **Issue Type**: missing expected commission
  - **Work Item type**: `missing_commission`
  - **Owner Role**: `transaction_coordinator`
  - **Priority**: `high`
  - **Remediation**: Log the forecast contract commission value.
  - **Status**: Checked and working.
- **Issue Type**: closing date missing
  - **Work Item type**: `missing_closing_date`
  - **Owner Role**: `transaction_coordinator`
  - **Priority**: `high`
  - **Remediation**: Supply target escrow closing date.
  - **Status**: Checked and working.
- **Issue Type**: closing soon
  - **Work Item type**: `closing_soon`
  - **Owner Role**: `transaction_coordinator`
  - **Priority**: `high`
  - **Remediation**: Execute pre-closing checklist.
  - **Status**: Checked and working.
- **Issue Type**: surprise closing risk
  - **Work Item type**: `surprise_closing_risk`
  - **Owner Role**: `transaction_coordinator`
  - **Priority**: `high`
  - **Remediation**: Review foundation cracking or lender status blocks.
  - **Status**: Checked and working.
- **Issue Type**: commission readiness gap
  - **Work Item type**: `commission_readiness_gap`
  - **Owner Role**: `compliance_partner`
  - **Priority**: `high`
  - **Remediation**: Audit outstanding compliance checklists before commission release.
  - **Status**: Checked and working.

### 3. Compliance
- **Issue Type**: missing required document
  - **Work Item type**: `missing_document`
  - **Owner Role**: `compliance_partner`
  - **Priority**: `high`
  - **Remediation**: Request signed agreement copy from the agent.
  - **Status**: Checked and working.
- **Issue Type**: signature/initials/form issue
  - **Work Item type**: `document_issue`
  - **Owner Role**: `compliance_partner`
  - **Priority**: `high`
  - **Remediation**: Notify agent regarding missing page initials.
  - **Status**: Checked and working.
- **Issue Type**: closing countdown risk buckets
  - **Work Item type**: `closing_risk_t3` / `closing_risk_t7` / `closing_risk_t14` / `closing_risk_t30`
  - **Owner Role**: `compliance_partner`
  - **Priority**: `critical`
  - **Remediation**: Ensure all compliance documents are executed before closing.
  - **Status**: Checked and working.
- **Issue Type**: agent reminder draft
  - **Work Item type**: `agent_reminder_draft`
  - **Owner Role**: `operations_lead`
  - **Priority**: `medium`
  - **Remediation**: Approve reminder email draft in Approvals.
  - **Status**: Checked and working.
- **Issue Type**: secure upload request
  - **Work Item type**: `secure_upload_request`
  - **Owner Role**: `operations_lead`
  - **Priority**: `medium`
  - **Remediation**: Authorize client upload link release.
  - **Status**: Checked and working.

### 4. Marketing
- **Issue Type**: incomplete marketing request
  - **Work Item type**: `incomplete_marketing_request`
  - **Owner Role**: `marketing_coordinator`
  - **Priority**: `high`
  - **Remediation**: Queue clarification follow-up regarding missing launch assets details.
  - **Status**: Checked and working.
- **Issue Type**: listing launch checklist item
  - **Work Item type**: `listing_launch_checklist_item`
  - **Owner Role**: `listing_coordinator`
  - **Priority**: `medium`
  - **Remediation**: Complete and coordinate photography/sign dispatch tasks.
  - **Status**: Checked and working.
- **Issue Type**: missing photo/vendor/status
  - **Work Item type**: `missing_photo_vendor`
  - **Owner Role**: `marketing_coordinator`
  - **Priority**: `high`
  - **Remediation**: Confirm photographer appointment or schedule setup task.
  - **Status**: Checked and working.
- **Issue Type**: review request draft
  - **Work Item type**: `review_request_draft`
  - **Owner Role**: `operations_lead`
  - **Priority**: `medium`
  - **Remediation**: Release neutral post-closing Google review request draft.
  - **Status**: Checked and working.
- **Issue Type**: overdue marketing asset
  - **Work Item type**: `overdue_marketing_asset`
  - **Owner Role**: `marketing_coordinator`
  - **Priority**: `medium`
  - **Remediation**: Finalize overdue marketing flyer template designs.
  - **Status**: Checked and working.

### 5. Office & Signage
- **Issue Type**: low sign inventory
  - **Work Item type**: `low_sign_inventory`
  - **Owner Role**: `listing_coordinator`
  - **Priority**: `medium`
  - **Remediation**: Order replacement lockboxes or directionals.
  - **Status**: Checked and working.
- **Issue Type**: missing lockbox
  - **Work Item type**: `missing_lockbox`
  - **Owner Role**: `listing_coordinator`
  - **Priority**: `medium`
  - **Remediation**: Confirm lockbox deployment serial numbers.
  - **Status**: Checked and working.
- **Issue Type**: dirty/damaged sign
  - **Work Item type**: `damaged_sign`
  - **Owner Role**: `listing_coordinator`
  - **Priority**: `medium`
  - **Remediation**: Mark damaged signage out of circulation.
  - **Status**: Checked and working.
- **Issue Type**: office supply gap
  - **Work Item type**: `office_supply_gap`
  - **Owner Role**: `operations_lead`
  - **Priority**: `medium`
  - **Remediation**: Reorder office supply and restock front desk kits.
  - **Status**: Checked and working.
- **Issue Type**: facilities issue
  - **Work Item type**: `facilities_issue`
  - **Owner Role**: `operations_lead`
  - **Priority**: `medium`
  - **Remediation**: Assign facility maintenance issue to repair vendor.
  - **Status**: Checked and working.
- **Issue Type**: vendor follow-up
  - **Work Item type**: `vendor_follow_up`
  - **Owner Role**: `operations_lead`
  - **Priority**: `medium`
  - **Remediation**: Contact vendor for lockbox/sign maintenance updates.
  - **Status**: Checked and working.

---

## Integrity Audit Rules
1. **Uniqueness**: Work Item IDs are constructed deterministically as `wi_gen_${type}_${relatedId || 'no_id'}` to prevent duplicates on repeat evaluations.
2. **Reconciliation**: Once an issue condition is no longer met (e.g. role is assigned or document is uploaded), the status transitions to `completed` automatically during sync checks.
3. **Traceability**: Each item maintains links to the correct transaction, task, or listing record.
