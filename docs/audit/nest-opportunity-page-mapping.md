# Nest Opportunity Page Mapping

This document maps each business opportunity identified in the Nest Realty Opportunity Register to its corresponding customer-facing application page, component file, ownership structure, and integration with the shapework operating spine.

---

## 1. Fuzzy Operations Roles
- **Opportunity Name**: Fuzzy Operations Roles
- **Existing App Page**: `/app/people`
- **Component/File**: [CustomerAppRoutes.tsx:PeopleOwnershipPage](file:///Users/marcusaman/Downloads/shapework%20(2)/src/routes/CustomerAppRoutes.tsx)
- **User-Visible Label**: People & Ownership
- **Problem Solved**: Lack of clear ownership boundaries and unassigned operational roles pulling managing partners into routine tasks. Delineates "Owner-Worthy Decisions" from "Staff-Owned Workflows".
- **What Work Item it Creates**: `vacant_role` (for unassigned coordinators), `missing_backup` (for responsibilities without backups), `unclear_escalation` (for responsibilities without SLAs/escalations), and `staff_workflow_reassignment` (for high workload capacity).
- **What Owner/Backup Owner it Uses**: `operations_lead` (Primary) / Backup owner roles.
- **Whether Approval is Required**: No.
- **Audit Event Created**: Yes (`Created Work Queue item: "Vacant Role Alert..."`).
- **Whether it Appears in Today**: Yes, under role gaps.
- **Whether it Appears in Owner Brief**: Yes, under vacant responsibilities.
- **Status**: `working`

---

## 2. Agent Marketing Request Bottlenecks
- **Opportunity Name**: Agent Marketing Request Bottlenecks
- **Existing App Page**: `/app/marketing`
- **Component/File**: [MarketingRequestDesk.tsx](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/workflows/MarketingRequestDesk.tsx)
- **User-Visible Label**: Marketing Requests
- **Problem Solved**: Incomplete marketing details submitted by agents. Prevents coordinator rework by gating incomplete entries and validating required photography or assets upfront.
- **What Work Item it Creates**: `marketing_request` (for completed assets) and `missing_information` (for incomplete requests).
- **What Owner/Backup Owner it Uses**: `marketing_coordinator` (Primary) / `operations_lead` (Backup).
- **Whether Approval is Required**: Yes, for agent clarification outreach.
- **Audit Event Created**: Yes (`Created Work Queue item: "[MISSING INFO]..."`).
- **Whether it Appears in Today**: Yes, under pending decisions and bottlenecks.
- **Whether it Appears in Owner Brief**: Yes, under marketing requests stuck.
- **Status**: `working`

---

## 3. Manual Closing Tracker Sheets
- **Opportunity Name**: Manual Closing Tracker Sheets
- **Existing App Page**: `/app/transactions`
- **Component/File**: [PipelineClosingTracker.tsx](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/transactions/PipelineClosingTracker.tsx)
- **User-Visible Label**: Transactions
- **Problem Solved**: Manual spreadsheet tracking lags, leading to surprise closing risks and missed expected commission values.
- **What Work Item it Creates**: `missing_source`, `missing_commission`, `missing_closing_date`, `closing_soon`, `surprise_closing_risk`, and `commission_readiness_gap`.
- **What Owner/Backup Owner it Uses**: `transaction_coordinator` (Primary) / `operations_lead` (Backup).
- **Whether Approval is Required**: No.
- **Audit Event Created**: Yes (`Created Work Queue item: "Missing expected commission..."`).
- **Whether it Appears in Today**: Yes, under revenue at risk.
- **Whether it Appears in Owner Brief**: Yes, under closings at risk.
- **Status**: `working`

---

## 4. Late Compliance Uploads
- **Opportunity Name**: Late Compliance Uploads
- **Existing App Page**: `/app/compliance`
- **Component/File**: [ClosingComplianceGuard.tsx](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/transactions/ClosingComplianceGuard.tsx)
- **User-Visible Label**: Compliance
- **Problem Solved**: Frantic document chasing right at closing. Establishes T-30, T-14, T-7, and T-3 risk buckets to automate chasers.
- **What Work Item it Creates**: `missing_document`, `document_issue`, and countdown risk tasks (`closing_risk_t3`, `closing_risk_t7`, `closing_risk_t14`, `closing_risk_t30`).
- **What Owner/Backup Owner it Uses**: `compliance_partner` (Primary) / `transaction_coordinator` (Backup).
- **Whether Approval is Required**: Yes, for agent reminder drafts.
- **Audit Event Created**: Yes (`Proposed action for approval: "Approve Outbound Agent Email..."`).
- **Whether it Appears in Today**: Yes, under files needing attention.
- **Whether it Appears in Owner Brief**: Yes, under compliance risks.
- **Status**: `working`

---

## 5. Signage & Lockboxes
- **Opportunity Name**: Signage & Lockboxes
- **Existing App Page**: `/app/office`
- **Component/File**: [OfficeReadinessSignInventory.tsx](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/workflows/OfficeReadinessSignInventory.tsx)
- **User-Visible Label**: Office & Signage
- **Problem Solved**: Unmonitored lockbox units, damaged yard signs, and low stock of key brokerage supplies.
- **What Work Item it Creates**: `low_sign_inventory`, `office_supply_gap`, and `facilities_issue`.
- **What Owner/Backup Owner it Uses**: `listing_coordinator` (Primary) / `facilities` (Backup).
- **Whether Approval is Required**: No.
- **Audit Event Created**: Yes (`Created Work Queue item: "Low stock alert..."`).
- **Whether it Appears in Today**: Yes, under office/signage issues.
- **Whether it Appears in Owner Brief**: Yes, under office/signage issues.
- **Status**: `working`

---

## 6. Google Review Dispatch
- **Opportunity Name**: Google Review Dispatch
- **Existing App Page**: `/app/marketing` (within request desk)
- **Component/File**: [MarketingRequestDesk.tsx](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/workflows/MarketingRequestDesk.tsx)
- **User-Visible Label**: Google Review Request
- **Problem Solved**: Missed customer reviews due to manual post-closing request delays. Ensures a neutral draft is created post-closing and human-authorized before dispatch.
- **What Work Item it Creates**: `review_request_draft`
- **What Owner/Backup Owner it Uses**: `operations_lead` (Primary) / `marketing_coordinator` (Backup).
- **Whether Approval is Required**: Yes.
- **Audit Event Created**: Yes (`Proposed action for approval: "Approve outbound neutral review request..."`).
- **Whether it Appears in Today**: Yes, under pending decisions.
- **Whether it Appears in Owner Brief**: Yes, under marketing requests stuck.
- **Status**: `working`
