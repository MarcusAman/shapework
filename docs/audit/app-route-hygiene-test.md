# App Route & UI Copy Hygiene Report

This document reports on routing hygiene and sandbox copy isolation under the production `/app` path.

---

## 1. Route Layout Audits

* **Primary Route Entry**: The workspace console loads cleanly on `http://localhost:3000/app`.
* **Internal Routing Links**: All sidebars, subtab rails, and drawer redirects generate relative paths containing the active `/app` prefix. No links leak to the `/demo` sub-route.
* **Secure Link Integration**: Direct links under `/link/*` (e.g. agent signoff pages) bypass the `/app` console container and render their respective views independently.

---

## 2. Sandbox Label Isolation Checklist

| Demo/Sandbox Element | Expected (Production Mode) | Observed (Production Mode) | Result |
| :--- | :--- | :--- | :---: |
| **"Exit Demo" Button** | Completely hidden from navigation rail. | Hidden. Toggle button takes full width. | **PASS** |
| **"Nest Realty Demo Workspace"** | Completely hidden. | Hidden. Header shows "Operations Console". | **PASS** |
| **"Synthetic Data" Banners** | Completely hidden. | Hidden. Notice banner does not render. | **PASS** |
| **"COO Focus" / "Tech Specs"** | Demo toggle capsule hidden. | Hidden from the top header bar. | **PASS** |
| **"Demo QA" Subtab** | Hidden from Settings menu list. | Hidden. Gated behind appMode check. | **PASS** |

---

## 3. Route Security Compliance

The settings `'qa'` subtab has been secured using a nested condition inside the router:
```typescript
{settingsTab === 'qa' && state.appMode !== 'production' && (
```
This ensures that even if a client attempts to override browser state variables to target `'qa'`, the troubleshooting ledger and checklists will not render on the screen.
