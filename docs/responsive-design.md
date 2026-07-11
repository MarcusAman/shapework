# shapework. Responsive Design Specification

## Principles
While the heavy lifting of compliance and operational planning occurs on desktop monitors, brokerage owners and on-the-move agents require mobile-first visual layouts.

Rather than shrinking the complex 3-column desktop layout, shapework. refactors the interface for mobile to emphasize immediate action and real-time alerts.

---

## Screen Adapters

### 1. Left Sidebar Navigation
* **Desktop**: Fully expanded sidebar (256px wide) with readable typography, profile blocks, and Act metrics.
* **Compact Desktop**: Shrinks to a clean icon-only rail (76px wide) showing tooltips on hover.
* **Mobile**: Off-canvas sliding drawer triggered by a persistent hamburger button in the global top header.

### 2. Dual-Column CommandCenter Layout
* **Desktop & Large Tablets (xl)**: Dual columns with Center Dashboard (8 cols) and Right AI Assistant (4 cols) sitting side-by-side.
* **Smaller Screens**: The right panel stacks cleanly below the main dashboard core, or can be toggled using a top floating action.

### 3. Mobile Execution Focus
Mobile screens concentrate on:
* Consuming the executive **Morning Briefing** text.
* Reviewing and authorizing items in the **Decision Queue**.
* Submitting files and secure responses via agent-specific micro-links.
* One-tap communication (phone call, email draft, SMS reply).
