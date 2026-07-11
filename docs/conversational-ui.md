# .shapework. Conversational UI Directions
*Last Updated: June 2026*

## The Non-Chatbot Philosophy
We do not use generic, blank-page chat boxes that ask the user to "Ask me anything." The `.shapework.` AI Operator is a hybrid control cockpit where natural language commands coexist with structured bento grids, risk indicators, and checklists.

```
+--------------------------------------------------------------+
| [Suggested Prompts / Context Indicators]                     |
| "Show at-risk closings this week" | "Analyze 102 Pine Street"|
+--------------------------------------------------------------+
| [Conversational Feed / Dynamic Output Canvas]                |
| Outputs are structured cards, timelines, comparison matrices|
+--------------------------------------------------------------+
| [Intelligent Operator Command Input Box]                     |
| [Voice] [Attach Files / Images] [Active Context Status] [Go] |
+--------------------------------------------------------------+
```

---

## Response Component Standards
The AI Operator avoids verbose, unformatted paragraphs. Responses are delivered as functional, interactive blocks:

### 1. The Evidence Checklist
* **Use Case**: Used when verifying contract completeness or analyzing missing disclosures.
* **Structure**: A numbered list of checklist items with progress bars and interactive "Show Sources" triggers.

### 2. The Risk Breakdown Matrix
* **Use Case**: Delivered when analyzing loan contingencies or appraisal delays.
* **Structure**: A two-column bento card matching *EVIDENCE OBSERVED* (e.g., "Apex silent 48 hrs") to *PROPOSED ESCALATION ACTION* (e.g., "Send underwriters nudge").

---

## Command Input Box (The Operator Dock)
* **Visual Styling**: Centered at the bottom margin of the screen, floating with a high-index shadow backdrop.
* **Multimodal Attachments**: Dedicated buttons for attaching images (e.g., screenshot of contract anomalies) and voice recording buttons to dictate immediate follow-ups.
