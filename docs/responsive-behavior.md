# .shapework. Responsive Layout Behavior
*Last Updated: June 2026*

## Device Adaptation Breakpoints

### 1. Large Desktop (1440px - 1280px)
* **Layout**: Full-screen split view.
* **Navigation**: Persistent left rail (256px wide) showing categories and user profile.
* **Canvas**: Fluid primary stage with bento metrics, dynamic briefings, and actions.
* **Drawer / Sheet**: Collapsible Right Context Rail for active inspection logs and audit logs.

### 2. Tablet (1024px - 768px)
* **Navigation**: Left sidebar collapses into a slim icon rail (64px wide). Expandable via hamburger gesture.
* **Tables**: Grid systems hide secondary columns (e.g., secondary coordinator initials, last sync timestamps) and introduce horizontal touch-scrolling.
* **Context panels**: Right Context Rail slides into a full-height interactive Drawer / Sheet, toggled via primary header action.

### 3. Mobile (430px - 390px)
* **Navigation**: Bottom-anchored navigation system focusing strictly on `Command Center`, `Operations Inbox`, and `AI Operator`.
* **Prose & Briefings**: Multi-column editorial summaries condense into single, highly scannable bullet points.
* **Action cards**: Tables morph into rich card blocks. Each block highlights:
  * Address / Client Identity
  * Overdue / Critical Blockers (using restrained status pill backgrounds)
  * Immediate interactive CTA (e.g., `Approve Response`).
