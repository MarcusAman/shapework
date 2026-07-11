# Office, Signage, and Vendor Nest Check

This document verifies the inventory checkoffs, facilities issue routing, and the lightweight Vendor Knowledge Base lookup table in the brokerage console.

---

## 1. Office & Signage Inventory

- **Signage Tracking**: Displays yard signs, directional open house signs, lockbox units, and office stationery supplies.
- **Stock Indicators**: Checks stock thresholds, creating `low_sign_inventory` or `office_supply_gap` Work Queue items when stock drops below minimum limits.
- **Facilities Issues**: Building/facilities maintenance requests are tracked, routing tasks to `operations_lead` without owner interruption.

---

## 2. Vendor Knowledge Base

- **Lightweight Structure**: Features simple lookup tables for signage installation vendors, locksmiths, and printers.
- **Vendor Attributes Checked**:
  - Vendor name
  - Use case/services
  - Phone & email
  - Primary internal owner
  - Notes
  - Date last active/used
- **No Complex CRM**: Contains no messaging logs, pipeline stages, or client database integrations.
