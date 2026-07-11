# .shapework. Interaction Patterns
*Last Updated: June 2026*

## Human-in-the-Loop Approvals
Every transaction-affecting or external-affecting message prepared by `.shapework.` must flow through a deterministic validation cycle.

```
+-------------------------------------------------------------+
| [A] AI DRAWS RECOMMENDATION                                 |
|     Based on parsed files, calendar events, or text lags    |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| [B] OPERATOR VALIDATES ENGINE                               |
|     Proposes edit, dismisses, snoozes, or authorizes draft  |
+-------------------------------------------------------------+
          /                   |                   \
         /                    |                    \
        v                     v                     v
 [DISMISS]               [SNOOZE]              [AUTHORIZE]
 Removes proposal       Delays alarm 4 hrs    Dispatches via API,
 from active queue      or sets manual date    archives, logs event
```

---

## Key Interaction Specs

### 1. The Snooze Action
* **Visual Presentation**: Secondary icon button with stopwatch or clock emblem, opening a minimal overlay menu.
* **Menu Options**: `Snooze 4 Hours`, `Snooze Till Morning (8 AM)`, `Snooze Till Monday`, or `Select Custom Date`.
* **State Behavior**: The card smoothly fades out with a sliding exit animation and returns to the active queue only when the specified timer expires.

### 2. The Bulk Approval Panel
* **Visual Presentation**: Activated automatically upon selecting multiple items via checkboxes in operational grids.
* **Component Anatomy**: A persistent floating bar anchored to the bottom stage of the screen.
* **Actions Available**: `Approve All Selected`, `Mark Selected as Resolved`, `Assign Coordinator`, or `Snooze`.
* **Verification**: Shows the exact count of affected recipients and target channels to avoid unintended bulk outputs.
