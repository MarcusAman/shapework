# .shapework. Accessibility & Compliance Standards
*Last Updated: June 2026*

## Compliance Goals
`.shapework.` is built to conform with the **Web Content Accessibility Guidelines (WCAG) 2.2 Level AA** standards. All operations professionals must have uninterrupted, rapid, and predictable access to key actions and analytical streams.

---

## Core Accessibility Specifications

### 1. Contrast Verification
All text pairings must meet a minimum contrast ratio of **4.5:1** for normal text and **3.0:1** for large display headings.

* **Primary Charcoal Text** (`#16181B`) on **Canvas** (`#F5F4F0`) yields **13.5:1** (AA and AAA compliant).
* **Titanium Gray copy** (`#5F646B`) on **Canvas** (`#F5F4F0`) yields **4.9:1** (AA compliant).
* **Forest Green status text** (`#2D6A4F`) on its light pastel mint background (`#E8F5E9`) is fully legible and paired with a clear textual label.

### 2. Tab & Focus Navigation
All interactive inputs, buttons, and row expansions must support full keyboard navigation.

* **Interactive Elements**: All custom toggle tabs and filter buttons use a distinctive, high-contrast outline border when focused (`focus-visible:ring-2 focus-visible:ring-brand-green`).
* **Checkboxes & Lists**: Users must be able to scroll transaction cards, expand rows, and hit Spacebar or Enter to open the detail drawers or confirm approvals.
* **Skip to Main Content**: A hidden anchor tag is placed at the top level of the DOM to let keyboard operators bypass sidebar navigation links and jump directly to active stages.

### 3. Screen-Reader Landmarks
Our HTML DOM structure utilizes expressive semantic elements instead of empty generic divider spans.

```html
<nav aria-label="Primary Navigation"> ... </nav>
<main id="main-content">
  <header>
    <h1>.shapework. Command Center</h1>
  </header>
  <section aria-labelledby="priority-actions-title"> ... </section>
</main>
```
