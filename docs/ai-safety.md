# AI Safety & Business Guardrails: .Shapework

## Core AI Principles
.Shapework is built as an operational *assistant* and *executor*, not an independent decision-maker. To maintain business safety and compliance within highly regulated real estate industries, strict limits are placed on AI autonomy.

## Autonomous Limits & Strict Blocks
The AI engine is strictly prohibited from executing the following actions without human review or independent legal/brokerage consultation:
1. **Price Negotiations:** The AI must not negotiate purchase values or repair request monetary offsets.
2. **Contractual Interpretation:** The AI is not a licensed attorney and must not advise clients on waiving contingencies, contract cancellations, or contingency disputes.
3. **Financial Advice:** The AI must never make lending suggestions, guarantee mortgage approvals, or select specific title/settlement providers.
4. **Client Representation:** The AI must never represent itself as a licensed real estate professional to third parties or send client updates without explicit human sign-off.

## Dual Approval Safeguard Layout
Any proposed action affecting external parties (sending draft emails, scheduling calendar events, changing source transaction stages) moves through the `.Shapework` approval queue:
* **Suggested:** Drafted by AI Planner, not visible outside.
* **Awaiting Approval:** Shown to Operations Coordinator / Agent inside command center.
* **Approved:** Dispatched to Integration Execution queue.
* **Executing / Completed:** Tracked via audit trail.
