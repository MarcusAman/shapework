# shapework. Command Center Specification

## Overview
The **Command Center** is the heart of shapework., serving as the executive operating briefing for the brokerage's leadership team (COO, Director of Operations, Managing Broker, and Owner). It allows the leadership to comprehend the health of the entire brokerage operation in under three minutes.

Instead of displaying a chaotic grid of generic KPI widgets, it is structured as an editorial, priority-ranked briefing combined with actionable decision flows.

---

## Key Layout Blocks

### 1. Above-the-Fold Operational Briefing
* **Current Status Headline**: Summarizes exactly what requires immediate action or leadership judgment.
* **Prose-Driven AI Summary**: Integrates concise operational metrics and qualitative alerts in a natural, editorial narrative.
* **Primary Recommendation**: Prompts the leader with the single most impactful recommendation of the morning.

### 2. Decision Queue (Leadership Exclusives)
* Displays only items requiring leadership judgment (e.g., reassigning an overloaded coordinator, approving a workflow exception, delaying a listing launch due to seller delays, authorizing an external escalation).
* Every item outlines:
  * **Why it matters**: Operational/financial impact (e.g., "$8,400 in commission revenue at risk").
  * **Supporting evidence**: Associated emails, messages, or calendar events.
  * **Actions**: Approve, Edit, Delegate, Request More Information, Dismiss.

### 3. Operational Risk Table
* Lists at-risk transactions, listings, compliance exemptions, and critical communications.
* Columns:
  * Property or Workflow
  * Agent & Coordinator
  * Risk Level (Healthy, Needs Attention, At Risk, Blocked)
  * Revenue Impact
  * Next Action / Waiting On

### 4. Waiting on People & Team Capacity
* **Waiting On**: Groups outstanding items by Agents, Lenders, Closing Attorneys, Title, and Vendors to identify who is stalling progress.
* **Team Capacity**: Displays workload balance across transaction and listing coordinators, preventing burnout.

---

## Responsive & Aesthetic States
* **Default Desktop**: Two-column layout with Center Dashboard core (8 cols) and Right AI Assistant Panel (4 cols).
* **Minimized state**: The AI Assistant Panel can be minimized to expand the Center Dashboard to full width.
* **Aesthetics**: Premium off-white styling, tabular figures for finance, and crisp micro-labels.
