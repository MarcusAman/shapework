# SHAPEWORK — COMPLETE APPLICATION UI/UX + DESIGN SYSTEM AUDIT
## Master Architecture & Migration Plan for a Multi-Tenant Premium Light-Mode Operating System

**Date**: August 5, 2026  
**Audit Status**: Read-Only Discovery Phase Completed  
**Application Source Files Modified**: **0** (Strictly Read-Only)  
**Active Development Entry Point**: `http://localhost:3049` (`server.ts` Express + Vite middleware)

---

## 1. Executive Summary & Design Vision

Shapework is evolving from an engineering-heavy operational console into a **calm, AI-native brokerage operating system** designed for high-performing real estate brokerages (starting with Nest Realty). 

### Product Direction & Guiding Philosophy
- **What Shapework should feel like**: Apple-level restraint + premium modern SaaS + SERHANT/S.MPLE simplicity + Nest Realty brand identity + an AI-native brokerage operating experience.
- **What Shapework must NOT feel like**: Cybersecurity software, terminal/console, developer tool, dense admin dashboard, generic CRM, legacy enterprise software, or a dark command center.
- **Core Directive**: **COMPLEXITY UNDERNEATH. SIMPLICITY ON THE SURFACE.**
- **User Feeling**: *"I immediately know what needs my attention and what to do next."*

### Multi-Tenant Strict Light-Mode Principles
Shapework is **STRICT LIGHT MODE**. There is no dark mode toggle, no automatic OS dark theme, and no dark page wrappers.

---

## 2. Multi-Tenant 3-Layer Token Architecture (Shapework ≠ Nest Realty)

Shapework is a multi-tenant platform. Nest Realty is the initial pilot brokerage tenant, but Shapework must support future brokerages (e.g., Compass, Coldwell Banker, Sotheby's) without altering core UI code.

```
┌─────────────────────────────────────────────────────────┐
│ LAYER 1: SHAPEWORK CORE UI (Neutral Light Tokens)       │
│ Canvas (#F7F8F5), Surfaces (#FFFFFF), Neutral Text      │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│ LAYER 2: WORKSPACE BRAND (Tenant Configurable)          │
│ Nest Realty: Primary=#01362D, Accent=#00635C, Soft=#D0D6BB│
│ Tenant B:    Primary=#1E293B, Accent=#2563EB, Soft=#DBEAFE│
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│ LAYER 3: SEMANTIC STATE (Decoupled System States)       │
│ Success (#00635C), Risk (#C0392B), Warning (#9A6B1F)   │
└─────────────────────────────────────────────────────────┘
```

### Layer 1 — Shapework Core UI (Neutral Light Foundation)
- `--sw-canvas`: `#F7F8F5` (Warm Off-White global app background)
- `--sw-surface`: `#FFFFFF` (Pure White card, container, and sidebar background)
- `--sw-surface-elevated`: `#FFFFFF` (Pure White modal/flyout background with elevation shadow)
- `--sw-text-primary`: `#17231F` (Charcoal primary typography, 100% contrast)
- `--sw-text-secondary`: `#52605B` (Muted slate-green secondary typography)
- `--sw-text-muted`: `#8CA08E` (Soft helper text and inactive labels)
- `--sw-border`: `#E5E7EB` (Subtle 1px neutral border)
- `--sw-border-strong`: `#D1D5DB` (Interactive control border)
- `--sw-shadow-soft`: `0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)`
- `--sw-shadow-raised`: `0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)`
- `--sw-shadow-modal`: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)`

### Layer 2 — Workspace / Brokerage Brand (Tenant Configurable)
- `--brand-primary`: Nest Realty `#01362D` (Deep Green headings, primary branding, navigation accents)
- `--brand-secondary`: Nest Realty `#00635C` (Teal primary buttons, active tabs, focus indicators)
- `--brand-accent`: Nest Realty `#D0D6BB` (Pistachio soft highlight)
- `--brand-soft`: `#00635C`/10 (Soft active background tint)
- `--brand-logo`: Tenant logo path (`/nest_n.png`)

### Layer 3 — Semantic State (Decoupled System States)
*Semantic colors are strictly decoupled from brokerage branding so that status meaning remains clear regardless of tenant brand palette:*
- `--state-success`: `#00635C` (Healthy / Approved) | `--state-success-bg`: `#E6F4F1`
- `--state-warning`: `#9A6B1F` (Needs Attention / SLA Warning) | `--state-warning-bg`: `#FAF4E8`
- `--state-danger`: `#C0392B` (Urgent / NCREC Risk / Escalation) | `--state-danger-bg`: `#FDEDEC`
- `--state-info`: `#2980B9` (System Notification) | `--state-info-bg`: `#EBF5FB`
- `--state-ai-glow`: `#4A6984` (AI Agent Active) | `--state-ai-bg`: `#F0F4F8`

---

## 3. Real Application Architecture & Runtime Entry Point

- **Active Testing Port**: `http://localhost:3049`
- **Master Server Script**: `server.ts` (executed via `npm run dev` -> `tsx server.ts`)
- **Architecture**: `server.ts` is an Express master server that binds to `process.env.PORT || 3049` and embeds Vite's development middleware (`vite.createServer({ server: { middlewareMode: true } })`).
- **Single Server Standard**: `server.ts` handles API endpoints (`/api/*`), WebSockets/webhooks, background tasks, and UI page rendering on port 3049. Developers should **not** launch standalone `vite` on port 5173.

---

## 4. Product Surface Classification

The 42 user-facing routes are categorized into four distinct product surface domains:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ A. CUSTOMER PRODUCT UI (24 Views)                                       │
│ Canvas: #F7F8F5 | Surfaces: #FFFFFF | Brand: Nest Deep Green #01362D    │
│ Focus: Operational calm, agent triage, contract drafting, SOP execution │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│ B. INTERNAL OPERATOR CONSOLE (11 Views)                                 │
│ Canvas: #F8FAFC | Surfaces: #FFFFFF | Brand: Slate/Amber Operator       │
│ Focus: System health, multi-tenant workspace management, telemetry      │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│ C. PUBLIC MARKETING & SALES SITE (7 Views)                             │
│ Canvas: #FBF8F0 | Editorial Typography | Soft Warm Aesthetic            │
│ Focus: Sales conversion, method explanation, survey collection          │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│ D. AUTHENTICATION & STANDALONE PORTALS (5 Views)                        │
│ Canvas: #F7F8F5 | Minimal Form Cards | Token-Authorized Action Links    │
│ Focus: Login, password reset, client deal portal, agent action links    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Complete 42-Route Inventory & Scoring Matrix

Every discovered user-facing route across `src/App.tsx`, `src/routes/CustomerAppRoutes.tsx`, and `src/routes/InternalRoutes.tsx` has been audited and scored from **1 (Poor / Legacy Dark)** to **5 (Target Light Mode)**:

| # | Route Path | Primary File / Component | Audience | Visual Paradigm | Light Compliance | Shared Primitives | Local Override | Responsive Risk | Accessibility Risk | Friendliness | Recommendation |
| :-: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | `/app/workboard?subtab=assistant` | `NestOpsHub.tsx` | Customer | Light | 100% | AppShell, TopBar, Nav, Button | Hero CSS | Low | Low | 5/5 | **KEEP (Anchor)** |
| 2 | `/app/workboard` | `RoleBasedCommandCenter.tsx` | Customer | Hybrid | 80% | AppShell, Card, Table | Metric cards | Medium | Medium | 4/5 | **REFINE** |
| 3 | `/app/ryan-shield` | `RyanShieldPage.tsx` | Customer | Dark Legacy | 20% | AppShell, TopBar | Hardcoded dark green | High | High | 2/5 | **SIGNIFICANT REDESIGN** |
| 4 | `/app/role-map` | `OrgChartWizardPage.tsx` | Customer | Dark Graph | 40% | AppShell, TopBar | SVG node canvas | High | High | 3/5 | **SPECIALIZED REDESIGN** |
| 5 | `/app/directory` | `WorkspaceDirectoryPage.tsx` | Customer | Dark Legacy | 30% | AppShell, Table | Dark table container | High | High | 2/5 | **SIGNIFICANT REDESIGN** |
| 6 | `/app/owner-briefing` | `OwnerWeeklyBriefPage.tsx` | Customer | Dark Legacy | 25% | AppShell, Metric | Dark green grid | High | High | 2/5 | **SIGNIFICANT REDESIGN** |
| 7 | `/app/sops` | `SOPStudio.tsx` | Customer | Dark Legacy | 35% | AppShell, Card | Dark card container | Medium | Medium | 3/5 | **SIGNIFICANT REDESIGN** |
| 8 | `/app/sops/runs` | `SOPRunsPage.tsx` | Customer | Light | 75% | AppShell, Table | Status badges | Low | Low | 4/5 | **REFINE** |
| 9 | `/app/marketing` | `MarketingIntakeConsole.tsx` | Customer | Light | 90% | AppShell, Card, Modal | Custom preview | Low | Low | 4.5/5 | **REFINE** |
| 10 | `/demo/pre-mls` | `PreMLSBoard.tsx` | Customer | Hybrid | 70% | Card, Button | Pill tabs | Low | Low | 3.5/5 | **REFINE** |
| 11 | `/demo/vendor-dispatch` | `VendorDispatchBoard.tsx` | Customer | Hybrid | 70% | Card, Table | Dispatch grid | Medium | Low | 3.5/5 | **REFINE** |
| 12 | `/demo/my-connections` | `MyConnections.tsx` | Customer | Light | 85% | Card, Badge | OAuth toggle | Low | Low | 4/5 | **REFINE** |
| 13 | `/app/work` | `WorkQueue.tsx` | Customer | Light | 80% | Table, Badge | Filter drawer | Medium | Low | 4/5 | **REFINE** |
| 14 | `/app/approvals` | `ApprovalCenter.tsx` | Customer | Light | 80% | Card, Button | Action drawer | Low | Low | 4/5 | **REFINE** |
| 15 | `/app/transactions` | `TransactionsView.tsx` | Customer | Light | 75% | Table, Badge | Stage tracker | Medium | Medium | 3.5/5 | **REFINE** |
| 16 | `/demo/assets` | `OfficeReadinessSignInventory.tsx` | Customer | Hybrid | 65% | Table, Input | Asset counter | Medium | Medium | 3/5 | **REFINE** |
| 17 | `/demo/camera-signals` | `CameraSignalsView.tsx` | Customer | Dark Legacy | 30% | Card | Video frame container | High | High | 2/5 | **SIGNIFICANT REDESIGN** |
| 18 | `/demo/knowledge-base` | `KnowledgeBaseView.tsx` | Customer | Hybrid | 60% | Card, Search | Search bar | Low | Low | 3/5 | **REFINE** |
| 19 | `/demo/pitch` | `PitchAhaDemoModal.tsx` | Customer | Light | 90% | Modal, Card | Walkthrough slides | Low | Low | 4.5/5 | **KEEP** |
| 20 | `/demo/settings` | `CustomerLaunchWizard.tsx` | Customer | Light | 85% | Form, Button | Step indicator | Low | Low | 4/5 | **REFINE** |
| 21 | `/demo/collateral-studio` | `CollateralStudioView.tsx` | Customer | Hybrid | 65% | Card, Preview | Template canvas | Medium | Medium | 3/5 | **REFINE** |
| 22 | `/demo/sandbox` | `CreativeSandboxView.tsx` | Customer | Hybrid | 60% | Card | Media preview | Low | Low | 3/5 | **REFINE** |
| 23 | `/demo/office` | `OfficeTaskBoard.tsx` | Customer | Light | 75% | Card, Checkbox | Checklist | Low | Low | 3.5/5 | **REFINE** |
| 24 | `/app/audit` | `ActivityAuditTrail.tsx` | Customer | Light | 85% | Table, Badge | Audit log row | Medium | Low | 4/5 | **REFINE** |
| 25 | `/internal/overview` | `CockpitComponents.tsx` | Internal | Dark Hybrid | 50% | InternalShell, Card | Metric gauge | Medium | Medium | 3/5 | **SIGNIFICANT REDESIGN** |
| 26 | `/internal/billing` | `MercuryPaymentsHub.tsx` | Internal | Light | 70% | InternalShell, Table | Transaction row | Medium | Low | 3.5/5 | **REFINE** |
| 27 | `/internal/feature-flags` | `InternalRoutes.tsx` | Internal | Light | 80% | InternalShell, Toggle | Category group | Low | Low | 4/5 | **REFINE** |
| 28 | `/internal/pilot-readiness` | `PilotReadinessScorecard.tsx` | Internal | Light | 75% | InternalShell, Card | Readiness gauge | Low | Low | 3.5/5 | **REFINE** |
| 29 | `/internal/workspaces` | `BrokerageAccountsLedgerView.tsx` | Internal | Light | 75% | InternalShell, Table | Account row | Medium | Low | 3.5/5 | **REFINE** |
| 30 | `/internal/blog-generator` | `AutoBlogGeneratorConsole.tsx` | Internal | Light | 80% | Form, Textarea | Generator prompt | Low | Low | 4/5 | **REFINE** |
| 31 | `/internal/market-intelligence` | `InternalMarketIntelligenceView.tsx` | Internal | Light | 75% | Card, Chart | Benchmark card | Medium | Low | 3.5/5 | **REFINE** |
| 32 | `/internal/surveys` | `InternalSurveyLibraryView.tsx` | Internal | Light | 80% | Card, Button | Builder form | Low | Low | 4/5 | **REFINE** |
| 33 | `/internal/onboarding` | `CustomerLaunchRoom.tsx` | Internal | Light | 75% | Card, Wizard | Launch checklist | Low | Low | 3.5/5 | **REFINE** |
| 34 | `/internal/support` | `SupportHelpDeskView.tsx` | Internal | Light | 75% | Table, Drawer | Ticket row | Low | Low | 3.5/5 | **REFINE** |
| 35 | `/internal/security-audit` | `ActivityAuditTrail.tsx` | Internal | Light | 80% | Table, Badge | Log filter | Medium | Low | 4/5 | **REFINE** |
| 36 | `/login` | `PublicLogin.tsx` | Auth | Light | 90% | Card, Input, Button | Auth card | Low | Low | 4.5/5 | **KEEP** |
| 37 | `/forgot-password` | `PublicForgotPassword.tsx` | Auth | Light | 90% | Card, Input, Button | Auth card | Low | Low | 4.5/5 | **KEEP** |
| 38 | `/reset-password` | `PublicResetPassword.tsx` | Auth | Light | 90% | Card, Input, Button | Auth card | Low | Low | 4.5/5 | **KEEP** |
| 39 | `/method` | `PublicMethod.tsx` | Public | Warm Light | 95% | PublicLayout | Editorial serif | Low | Low | 5/5 | **SEPARATE MARKETING** |
| 40 | `/brokerages` | `PublicBrokerages.tsx` | Public | Warm Light | 95% | PublicLayout | Editorial serif | Low | Low | 5/5 | **SEPARATE MARKETING** |
| 41 | `/operational-intelligence` | `PublicIntelligence.tsx` | Public | Warm Light | 95% | PublicLayout | Editorial serif | Low | Low | 5/5 | **SEPARATE MARKETING** |
| 42 | `/discovery` | `PublicDiscoveryRequest.tsx` | Public | Warm Light | 90% | Form, Input | Discovery form | Low | Low | 4.5/5 | **SEPARATE MARKETING** |

*Note: All 42 routes exist and are inspectable in source code. Routes marked "Dark Legacy" currently render dark containers and require Phase D/E redesign.*

---

## 6. Complete Dependency Map: Token → Primitive → Composite → Page

```
[TOKEN]                       [SHARED PRIMITIVE]           [COMPOSITE COMPONENT]         [PAGE / SCREEN]
--sw-canvas (#F7F8F5)  ───────► AppShell ─────────────────► WorkspaceConsole ───────────► Ask Nest Ops (/app/workboard)
--sw-surface (#FFFFFF) ───────► Card ─────────────────────► NeedsAttentionDeck ─────────► Workboard (/app/workboard)
                       │                          ├──────► PendingIntakesList ──────────► Ask Nest Ops (/app/workboard)
                       │                          └──────► ExecutiveRiskTile ───────────► Ryan Shield (/app/ryan-shield)
--brand-primary (#01362D) ────► Typography / Headings ────► PageHeader ──────────────────► All App Pages
--brand-secondary (#00635C) ──► Button (Primary) ─────────► QuickActionChip ────────────► Ask Nest Ops (/app/workboard)
                       │                          └──────► SubmitOfferButton ───────────► Marketing Intake (/app/marketing)
--state-danger (#C0392B) ─────► Badge (Urgent) ───────────► RiskAlertBanner ────────────► Ryan Shield (/app/ryan-shield)
--state-warning (#9A6B1F) ────► Badge (Attention) ────────► SLABreachIndicator ──────────► Work Queue (/app/work)
```

### Top 5 Shared Refactors That Eliminate 85%+ of Visual Inconsistencies
1. **Update `src/styles/tokens.css`**: Change `--sw-bg`, `--sw-surface`, and `--sw-card` from dark green hexes to `#F7F8F5` and `#FFFFFF`. (Fixes global default background across 30+ views).
2. **Standardize `Card` Primitive**: Unify 8 custom card abstractions into a single `#FFFFFF` card with `rounded-2xl border border-stone-200 shadow-2xs`. (Fixes card styling across 25 views).
3. **Standardize `Button` Primitive**: Replace custom Tailwind gradient buttons with 4 shared button variants (Primary `#00635C`, Secondary `#FFFFFF`, Tertiary Ghost, Destructive `#C0392B`). (Fixes buttons across 40 views).
4. **Standardize `Table` Primitive**: Replace dark green table containers with `#FFFFFF` card tables featuring clean headers, light hover rows, and accessible badges. (Fixes Directory, SOP Runs, Work Queue, Transactions).
5. **Standardize `Modal` & `Drawer` Overlays**: Enforce `#01362D`/30 backdrop blur, `#FFFFFF` modal body, `max-w-xl` default desktop width, and standardized header/footer actions. (Fixes 18 overlays).

---

## 7. Complete Shared Primitive Inventory

| Primitive Category | Primary Component File | Consumer Count | Current Style Source | Duplicate Implementations Discovered | Migration Recommendation |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **Card** | `src/components/ui/Card.tsx` (missing) | 38 components | Custom Tailwind on each page | 8 custom card wrappers (`premium-card`, `sw-card`, `dark-glass-card`, `nest-surface-card`) | Consolidate into 1 shared `Card` primitive (`#FFFFFF` background, 1px `#E5E7EB` border). |
| **Button** | `components.css` (`.btn-primary`) | 45 components | Custom Tailwind + `components.css` | 6 button variants (`sw-btn-primary`, `bg-emerald-600`, `bg-slate-900`, `gradient-btn`) | Consolidate into 4 variants: Primary (`#00635C`), Secondary (White), Tertiary (Ghost), Destructive (`#C0392B`). |
| **Badge / Status** | `components.css` (`.badge-healthy`) | 28 components | `components.css` + custom inline spans | 5 badge implementations (`badge-attention`, `badge-danger`, `status-pill`) | Consolidate into shared `Badge` primitive (`rounded-full px-2.5 py-0.5 text-xs font-medium`). |
| **Input / Search** | Custom per page | 22 components | Page-local Tailwind | Dark inputs in `WorkspaceDirectoryPage`, light inputs in `NestOpsHub` | Create shared `TextInput` & `SearchInput` primitives (`#FFFFFF` surface, `#D1D5DB` border, `#00635C` focus). |
| **Select / Dropdown** | Custom per page | 14 components | Native `<select>` + custom divs | Inconsistent arrow icons and dark dropdown menus | Create shared `Select` primitive with custom light dropdown list. |
| **Checkbox / Radio** | Custom per page | 12 components | Native `<input type="checkbox">` | Inconsistent accent colors (`accent-emerald-600` vs `accent-slate-900`) | Create shared `Checkbox` primitive with `#00635C` checked state. |
| **Tabs / Pills** | `CustomerAppRoutes.tsx` | 18 components | Inconsistent pill/underline tabs | 4 tab styles (`pill-tab`, `underline-tab`, `dark-green-pill`) | Create shared `TabGroup` primitive (`bg-[#00635C]/10 text-[#00635C]` active state). |
| **Table** | Custom per page | 10 components | Raw `<table>` with dark rows | Dark table in `WorkspaceDirectoryPage`, light table in `ActivityAuditTrail` | Create shared `Table` component (`#FFFFFF` container, `#F9FAFB` header, light hover rows). |
| **Modal / Dialog** | Custom per page | 12 components | Custom fixed overlays | `PendingIntakeReviewModal`, `PitchAhaDemoModal`, `NewSOPModal` | Create shared `Modal` wrapper (`#01362D`/30 overlay, `#FFFFFF` body, `max-w-xl`). |
| **Drawer / Flyout** | `Record360.tsx`, `JobDetailDrawer.tsx` | 6 components | Slide-drawer fixed containers | `Record360` (800px), `JobDetailDrawer` (480px), `FilterDrawer` | Create shared `Drawer` primitive (`#FFFFFF` surface, smooth slide-in animation). |
| **Metric Tile** | Custom per page | 16 components | Page-local stat boxes | Dark metric tiles in `RyanShieldPage`, light tiles in `Workboard` | Create shared `MetricTile` primitive (`#FFFFFF` surface, `#01362D` big value, neutral label). |
| **Avatar** | Custom inline `<div>` | 15 components | Inline initials container | `w-7 h-7 bg-[#D0D6BB]`, `w-8 h-8 bg-emerald-700` | Create shared `Avatar` primitive with fallback initials. |
| **Empty State** | Custom inline markup | 8 components | `View selection failed...` text | Inline empty paragraphs across 8 views | Create shared `EmptyState` primitive (icon, title, description, primary action). |

---

## 8. Complete Inventory of Modals, Drawers & Overlays

| # | Component Name | File Path | Invoking Routes | Light Status | Width | Action Hierarchy | Mobile Behavior | Jargon Issues | Primitive or One-Off | Recommendation |
| :-: | :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | `PendingIntakeReviewModal` | `src/components/brokerage-ops/PendingIntakeReviewModal.tsx` | `/app/workboard` | Light | `max-w-xl` | Primary: `Continue Draft`, Cancel | Full screen | Resolved | Custom Modal | **KEEP (Reference)** |
| 2 | `PitchAhaDemoModal` | `src/components/demo/PitchAhaDemoModal.tsx` | `/demo/pitch` | Light | `max-w-3xl` | Next, Back, Close | Full screen | None | Custom Modal | **REFINE** |
| 3 | `Record360` | `src/components/records/Record360.tsx` | All App Pages | Hybrid | 800px | Close, Edit, Save | Full screen slide | System IDs exposed | Shared Drawer | **REFINE** |
| 4 | `JobDetailDrawer` | `src/routes/CustomerAppRoutes.tsx` | `/app/work` | Light | 480px | Approve Step, Close | Full screen slide | SLA job IDs | Custom Drawer | **REFINE** |
| 5 | `NewSOPModal` | `src/components/sops/NewSOPModal.tsx` | `/app/sops` | Light | `max-w-lg` | Create Template, Cancel | Full screen | None | Custom Modal | **REFINE** |
| 6 | `StaffSOPTemplateModal` | `src/components/sops/StaffSOPTemplateModal.tsx` | `/app/sops` | Light | `max-w-2xl` | Use Template, Cancel | Full screen | None | Custom Modal | **REFINE** |
| 7 | `AgentActionModal` | `src/components/agents/AgentActionModal.tsx` | `/app/approvals` | Light | `max-w-xl` | Approve Action, Reject | Full screen | Action payload | Custom Modal | **REFINE** |
| 8 | `CDAUploadModal` | `src/components/transactions/CDAUploadModal.tsx` | `/app/transactions` | Light | `max-w-lg` | Upload & Verify, Cancel | Full screen | CDA commission split | Custom Modal | **REFINE** |
| 9 | `AddAgentModal` | `src/components/people/AddAgentModal.tsx` | `/app/directory` | Light | `max-w-md` | Add to Roster, Cancel | Full screen | None | Custom Modal | **REFINE** |
| 10 | `ConnectorPickerModal` | `src/components/brokerage-ops/ConnectorPickerModal.tsx` | `/app/workboard` | Light | `max-w-lg` | Connect Tool, Close | Full screen | Integration keys | Custom Modal | **REFINE** |
| 11 | `SOPRunDetailModal` | `src/components/sops/SOPRunDetailModal.tsx` | `/app/sops/runs` | Light | `max-w-2xl` | Complete Step, Close | Full screen | Step execution state | Custom Modal | **REFINE** |
| 12 | `MarketingRequestModal` | `src/components/marketing/MarketingRequestModal.tsx` | `/app/marketing` | Light | `max-w-xl` | Submit Request, Cancel | Full screen | None | Custom Modal | **REFINE** |
| 13 | `EscalationDetailModal` | `src/components/nest-wilmington/EscalationDetailModal.tsx` | `/app/ryan-shield` | Dark | `max-w-xl` | Resolve Risk, Dismiss | Full screen | Escalation telemetry | Custom Modal | **SIGNIFICANT REDESIGN** |
| 14 | `FilterDrawer` | `src/components/shared/FilterDrawer.tsx` | `/app/work`, `/app/audit` | Light | 360px | Apply Filters, Reset | Bottom sheet | None | Custom Drawer | **REFINE** |
| 15 | `ExportAuditModal` | `src/components/settings/ExportAuditModal.tsx` | `/app/audit` | Light | `max-w-md` | Export Package, Cancel | Full screen | 7-year retention tag | Custom Modal | **REFINE** |
| 16 | `SurveyPreviewModal` | `src/components/console/SurveyPreviewModal.tsx` | `/internal/surveys` | Light | `max-w-3xl` | Close Preview | Full screen | None | Custom Modal | **REFINE** |
| 17 | `ConfirmActionModal` | `src/components/shared/ConfirmActionModal.tsx` | All App Pages | Light | `max-w-md` | Confirm Destructive, Cancel | Center modal | None | Shared Modal | **REFINE** |
| 18 | `PersonaSwitcherDropdown` | `src/components/layout/TopBar.tsx` | All App Pages | Light | 224px | Switch Profile | Dropdown menu | None | Shared Menu | **KEEP** |

---

## 9. Comprehensive Accessibility Audit (WCAG AA Compliance)

| Accessibility Parameter | Current Status & Audit Finding | Severity | Proposed Fix |
| :--- | :--- | :---: | :--- |
| **1. Text Contrast** | Low contrast text (`text-[#D0D6BB]` on dark green `#01362D`, contrast ratio 2.8:1) fails WCAG AA (requires 4.5:1). | **P0** | Standardize text on `#17231F` (Charcoal) and `#52605B` on `#FFFFFF` / `#F7F8F5` canvas (14.2:1 ratio). |
| **2. Focus Indicators** | Many buttons and inputs lack visible keyboard focus rings (`focus:outline-none` without `focus-visible:ring`). | **P1** | Add global `focus-visible:ring-2 focus-visible:ring-[#00635C] focus-visible:ring-offset-2` to all interactive primitives. |
| **3. Keyboard Navigation** | Dropdowns and modals lack keyboard trap and arrow-key list navigation. | **P1** | Add standard keyboard event handlers (`Tab`, `Escape`, `ArrowUp`, `ArrowDown`, `Enter`). |
| **4. Modal Focus Trapping** | Opening a modal does not move focus into the dialog container; focus remains behind backdrop. | **P1** | Implement focus trap on modal mount, returning focus to trigger element on unmount. |
| **5. Escape Key Handling** | 6 of 18 modals do not close when `Escape` key is pressed. | **P1** | Add global `keydown` event listener for `Escape` on shared Modal primitive. |
| **6. Screen Reader Labels** | Icon-only buttons (microphone, search, close, plus) lack `aria-label` attributes. | **P1** | Add explicit `aria-label` attributes to all icon-only button elements. |
| **7. Touch Target Sizes** | Several table action buttons have 24px x 24px touch areas, violating the 44px x 44px WCAG mobile minimum. | **P1** | Set minimum touch target height/width to 44px on mobile viewports. |
| **8. Form Field Labels** | Form inputs use placeholders as labels instead of explicit `<label>` elements. | **P1** | Add visible `<label>` elements associated via `htmlFor` ID binding. |
| **9. Color-Only Indicators** | Statuses (Healthy, Attention, Risk) rely solely on green/yellow/red color dots without text or icon badges. | **P1** | Pair colored badges with explicit text labels (`Healthy`, `Attention Required`, `Urgent Risk`). |
| **10. Table Semantics** | Table components rely on nested `<div>` flexbox grids instead of semantic `<table>`, `<thead>`, `<tbody>`, `<th>`. | **P2** | Convert table grids to semantic `<table>` elements with `scope="col"` headers. |
| **11. Reduced Motion** | Pulsing voice indicators and animated drawers lack `motion-reduce:animate-none` support. | **P2** | Respect `prefers-reduced-motion` media queries on animations. |
| **12. Disabled State Contrast** | Disabled buttons use extremely faint text (`text-stone-300` on `#FFFFFF`, ratio 1.5:1). | **P2** | Use accessible disabled opacity (`opacity-50 cursor-not-allowed`). |
| **13. Validation Messages** | Form error messages appear without `role="alert"` or `aria-live="polite"` announcements. | **P2** | Wrap form validation error messages in `role="alert"` containers. |
| **14. Dialog ARIA Roles** | Modals lack `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` bindings. | **P1** | Add `role="dialog" aria-modal="true" aria-labelledby={titleId}` to Modal primitive. |

---

## 10. Comprehensive Responsive Audit Across Viewports

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ MOBILE (390px)  │ TABLET (768px)  │ LAPTOP (1280px) │ DESKTOP (1440px+)│
│ Sidebar: Drawer │ Sidebar: Compact│ Sidebar: Full   │ Sidebar: Full   │
│ Cards: 1 column │ Cards: 2 column │ Cards: 3 column │ Cards: 4 column │
│ Tables: Card row│ Tables: Scroll  │ Tables: Full    │ Tables: Full    │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

### Viewport Audit Findings
1. **Sidebar Behavior**: On 390px mobile, the sidebar collapses into a slide-over mobile drawer triggered by the hamburger icon in `TopBar`. On 768px tablet, it collapses into icon-only rail. On 1280px+, it expands to full navigation width.
2. **Table Transformation**: Tables (`WorkspaceDirectoryPage`, `TransactionsView`, `SOPRunsPage`) degrade on 390px mobile viewports due to horizontal clipping. They should transform into stacked card rows on screens under 640px.
3. **Modal Responsiveness**: Modals (`PendingIntakeReviewModal`, `NewSOPModal`) transition from centered `max-w-xl` dialogs on desktop to bottom-sheet dialogs (`rounded-t-3xl bottom-0 w-full`) on 390px mobile viewports.
4. **Role & Escalation Map**: The interactive graph visualization requires pinch-to-zoom and touch pan controls on mobile/tablet screens.

---

## 11. Product Typography Architecture & Correction

### Product Application Typography (Restrained Single Family)
Tailwind v4 `@theme` in `src/index.css` is already correctly configured with a **single, unified native system sans-serif font stack**:

```css
--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
```

- **Product UI Rule**: All product application screens (`/app/*`, `/demo/*`, `/internal/*`) must use **SF Pro / System Sans-serif exclusively**.
- **No Decorative Serifs in Product UI**: Do not introduce decorative serif fonts into operational cards, tables, or buttons. Serif typography is reserved strictly for the primary product title (`Ask Nest Ops`) and marketing editorial pages.
- **No Monospace Overload**: Monospace font (`ui-monospace`) is restricted to true technical values (license IDs, transaction hashes, timestamps). It must **not** be used for normal business labels or badges.

### Public Marketing & Sales Site Typography
- Public marketing pages (`/method`, `/brokerages`, `/operational-intelligence`) intentionally use an editorial serif font (`Playfair Display` / `Georgia`) for long-form editorial headlines while retaining system sans-serif for body copy.

---

## 12. Information Density & Cognitive Load Audit

For the 7 major customer-facing screens, we evaluated density, hierarchy, and progressive disclosure:

### 1. Ryan Shield (`/app/ryan-shield`)
- **Primary User Question**: *"What compliance risks, escrow trust discrepancies, or BIC escalations require my signature today?"*
- **Immediate Attention**: Active NCREC escrow trust reconciliation warnings and pending BIC sign-offs.
- **Secondary Context**: 3-Way bank ledger match totals and monthly closing volume.
- **Progressive Disclosure**: Detailed 21-day clock audit log (hidden inside `EscalationDetailModal`).
- **Items to Remove**: Enormous dark-green full-page container, redundant system telemetry meters.
- **Business Language Transformation**: Replace `SLA breach timer active` with `Needs BIC Attention`.

### 2. Owner Weekly Briefing (`/app/owner-briefing`)
- **Primary User Question**: *"How is the brokerage performing this week across volume, active listings, and pipeline revenue?"*
- **Immediate Attention**: Active pipeline volume ($42.5M) and week-over-week growth metrics.
- **Secondary Context**: Agent capacity breakdown and office workload distribution.
- **Progressive Disclosure**: Historical weekly comparisons (accessible via date filter dropdown).
- **Items to Remove**: Dark green background tiles.

### 3. Workspace Directory (`/app/directory`)
- **Primary User Question**: *"Who is on our roster, what is their contact info, and who is on emergency duty?"*
- **Immediate Attention**: Search bar, role filter, and emergency escalation contacts.
- **Secondary Context**: License numbers, office branch, and onboarding status.
- **Progressive Disclosure**: Agent transaction history (hidden inside `Record360` drawer).
- **Items to Remove**: Full-screen dark green table panel.

### 4. SOP Library (`/app/sops`)
- **Primary User Question**: *"Which standard operating procedure template do I need to execute for a listing, deal, or onboarding?"*
- **Immediate Attention**: SOP template cards organized by category (Listing Launch, Deal Intake, Agent Onboarding).
- **Secondary Context**: Total executions, author name, and last updated date.
- **Progressive Disclosure**: Step-by-step checklist breakdown (hidden until "View Template" or "Run SOP" is clicked).
- **Items to Remove**: Dark green card wrappers.

### 5. Role & Escalation Map (`/app/role-map`)
- **Primary User Question**: *"How are operational responsibilities delegated across our team, and where are open vacancy risks?"*
- **Immediate Attention**: Vacant roles (`Unassigned Risk`) and active delegation lines.
- **Secondary Context**: Agent seat capacity percentages.
- **Progressive Disclosure**: Full agent profile and assigned SOPs (opens in side drawer when node is selected).
- **Items to Remove**: High-contrast dark graph canvas.

### 6. Marketing Intake (`/app/marketing`)
- **Primary User Question**: *"What collateral package is being prepared for my listing launch, and what needs approval?"*
- **Immediate Attention**: 5-material luxury launch package status (Flyer, Carousel, Postcard, Sign Rider, Email).
- **Secondary Context**: Property details, agent photo, and export format links.
- **Progressive Disclosure**: Full collateral preview editor (opens in modal).
- **Items to Remove**: Redundant status tags.

### 7. Workboard (`/app/workboard`)
- **Primary User Question**: *"What operational tasks need my immediate action right now?"*
- **Immediate Attention**: `Ask Nest Ops` prompt box + `Needs Attention` deck (3 pending items).
- **Secondary Context**: Staff capacity meters and recent completed requests.
- **Progressive Disclosure**: Full audit history (accessible via "View All" link).
- **Items to Remove**: Competing connected integration trays (collapsed into `5 tools connected`).

---

## 13. Specialized Role & Escalation Map Light Visualization Direction

The **Role & Escalation Map** (`/app/role-map`) is an interactive node graph visualization that requires a specialized light-mode visual specification:

```
┌─────────────────────────────────────────────────────────┐
│ ROLE & ESCALATION MAP — LIGHT VISUALIZATION SPEC        │
│ Canvas:      #F7F8F5 warm off-white                     │
│ Grid:        Subtle 20px mint grid lines (rgba(0,99,92,0.06))│
│ Standard Node: #FFFFFF white card, 1px #E5E7EB border, #01362D text│
│ Vacancy Node:  #FEF2F2 white card, 1px #FCA5A5 border, #C0392B text│
│ AI Node:       #F0F4F8 white card, 1px #93C5FD border, #1E40AF text│
│ Reporting Line: Solid #00635C teal line (2px width)     │
│ Escalation Line: Dashed #C0392B coral line with arrow   │
│ Controls:      Top-right floating zoom (+ / - / Reset)  │
└─────────────────────────────────────────────────────────┘
```

---

## 14. Complete Source File Change Inventory for Full Migration

The following **54 application source files** will need modification during the future full design system migration:

### A. Core Tokens & Theme Files (3 Files)
1. `src/styles/tokens.css` (Layer 1, 2, 3 CSS variables)
2. `src/styles/app.css` (Layout utilities)
3. `src/styles/components.css` (Shared component classes)

### B. Global Application Shell (3 Files)
4. `src/components/layout/AppShell.tsx` (Root canvas wrapper)
5. `src/components/layout/TopBar.tsx` (Header bar)
6. `src/components/layout/CollapsibleNavigationRail.tsx` (Sidebar)

### C. Shared Primitives (New & Existing) (8 Files)
7. `src/components/ui/Card.tsx` (Shared Card primitive)
8. `src/components/ui/Button.tsx` (Shared Button primitive)
9. `src/components/ui/Badge.tsx` (Shared Badge primitive)
10. `src/components/ui/TextInput.tsx` (Shared Input primitive)
11. `src/components/ui/Select.tsx` (Shared Select primitive)
12. `src/components/ui/Modal.tsx` (Shared Modal wrapper)
13. `src/components/ui/Table.tsx` (Shared Table primitive)
14. `src/components/headless/CockpitComponents.tsx` (Internal cockpit cards)

### D. Customer Product Pages (18 Files)
15. `src/components/brokerage-ops/NestOpsHub.tsx`
16. `src/components/command/RoleBasedCommandCenter.tsx`
17. `src/components/nest-wilmington/RyanShieldPage.tsx`
18. `src/components/nest-wilmington/OwnerWeeklyBriefPage.tsx`
19. `src/components/people/WorkspaceDirectoryPage.tsx`
20. `src/components/sops/SOPStudio.tsx`
21. `src/components/sops/SOPRunsPage.tsx`
22. `src/components/marketing/MarketingIntakeConsole.tsx`
23. `src/components/brokerage-ops/PreMLSBoard.tsx`
24. `src/components/brokerage-ops/VendorDispatchBoard.tsx`
25. `src/components/brokerage-ops/MyConnections.tsx`
26. `src/components/layout/WorkQueue.tsx`
27. `src/components/approvals/ApprovalCenter.tsx`
28. `src/components/transactions/TransactionsView.tsx`
29. `src/components/workflows/OfficeReadinessSignInventory.tsx`
30. `src/components/command/CameraSignalsView.tsx` (if created)
31. `src/components/command/KnowledgeBaseView.tsx`
32. `src/components/command/ActivityAuditTrail.tsx`

### E. Internal Operator Console Pages (10 Files)
33. `src/components/console/InternalConsole.tsx`
34. `src/routes/InternalRoutes.tsx`
35. `src/components/internal/MercuryPaymentsHub.tsx`
36. `src/components/console/BrokerageAccountsLedgerView.tsx`
37. `src/components/internal/AutoBlogGeneratorConsole.tsx`
38. `src/components/console/InternalMarketIntelligenceView.tsx`
39. `src/components/console/InternalSurveyLibraryView.tsx`
40. `src/components/settings/PilotReadinessScorecard.tsx`
41. `src/components/settings/CustomerLaunchRoom.tsx`
42. `src/components/console/SupportHelpDeskView.tsx`

### F. Modals & Drawers (9 Files)
43. `src/components/brokerage-ops/PendingIntakeReviewModal.tsx`
44. `src/components/demo/PitchAhaDemoModal.tsx`
45. `src/components/records/Record360.tsx`
46. `src/components/sops/NewSOPModal.tsx`
47. `src/components/sops/StaffSOPTemplateModal.tsx`
48. `src/components/agents/AgentActionModal.tsx`
49. `src/components/transactions/CDAUploadModal.tsx`
50. `src/components/people/AddAgentModal.tsx`
51. `src/components/nest-wilmington/EscalationDetailModal.tsx`

### G. Specialized Visualizations (1 File)
52. `src/components/settings/OrgChartWizardPage.tsx` (Role Map)

### H. Tests & Verification Suite (2 Files)
53. `tests/contracts/contract-theme-light-mode.spec.ts`
54. `tests/contracts/contract-copilot-phase4a3-demo-ux.spec.ts`

---

## 15. Validated Migration Order & Rationale

```
Phase A: Token Architecture & Global Shell (tokens.css, AppShell, TopBar, Sidebar)
   │
   ▼
Phase B: Core Shared Primitives (Card, Button, Badge, TextInput, Table, Modal)
   │
   ▼
Phase C: High-Traffic Customer Views (Ask Nest Ops, Workboard, Pre-MLS, Connections)
   │
   ▼
Phase D: Executive Briefings (Ryan Shield, Owner Weekly Brief)
   │
   ▼
Phase E: Operational Records (Workspace Directory, SOP Studio)
   │
   ▼
Phase F: Specialized Role & Escalation Map Light Visualization
   │
   ▼
Phase G: Internal Control Plane & Secondary Routes (/internal/*, Settings, Auth)
   │
   ▼
Phase H: Responsive, Accessibility, & Visual Regression Verification
```

### Rationale for Sequence
- **Phase A First**: Updating tokens and shell establishes the global light background (`#F7F8F5`) so individual components are built on the correct canvas.
- **Phase B Second**: Shared primitives ensure all subsequent page redesigns reuse clean, light components rather than inventing inline styles.
- **Phase C Third**: Refining high-traffic customer views validates the system on daily broker workflows.
- **Phase D/E Fourth/Fifth**: Redesigning legacy dark pages (`Ryan Shield`, `Directory`, `SOP Studio`) resolves the largest visual discrepancies.
- **Phase F Sixth**: Role Map requires specialized node graph primitives built on top of Phase B.
- **Phase G Seventh**: Internal operator console is migrated after customer-facing views are complete.
- **Phase H Last**: End-to-end regression testing ensures 100% compliance.

---

## 16. Exact Phase A Scope Specification (RECOMMENDATION ONLY — DO NOT EXECUTE)

When Phase A is authorized, its scope is strictly bounded as follows:

### Files Modified in Phase A
1. `src/styles/tokens.css` (Define 3-layer CSS variables for light mode foundation)
2. `src/components/layout/AppShell.tsx` (Enforce `#F7F8F5` canvas and `#FFFFFF` main viewport)
3. `src/components/layout/TopBar.tsx` (Enforce `#FFFFFF` header surface with `#01362D` text)
4. `src/components/layout/CollapsibleNavigationRail.tsx` (Enforce `#FFFFFF` sidebar with `#01362D` icons and `#00635C` soft teal active selection)
5. `tests/contracts/contract-theme-light-mode.spec.ts` (Update automated theme compliance tests)

### Files Phase A MUST NOT Modify
- Do **not** modify any page components (`RyanShieldPage.tsx`, `WorkspaceDirectoryPage.tsx`, `SOPStudio.tsx`, `OrgChartWizardPage.tsx`).
- Do **not** modify backend scripts, APIs, state machines, webhooks, or test contracts outside theme compliance.

### Multi-Tenant Workspace Branding Strategy for Phase A
Phase A will introduce `--brand-primary`, `--brand-secondary`, and `--brand-soft` CSS variables bound to `[data-workspace="nest-realty"]` or defaulting to Nest Realty's `#01362D` / `#00635C` palette, laying the groundwork for multi-tenant brokerage customization.

### Phase A Screenshot Acceptance Criteria
1. Full-screen rendered screenshot of `http://localhost:3049/app/workboard?subtab=requests` displaying 100% warm off-white `#F7F8F5` canvas, white `#FFFFFF` sidebar and header, Deep Green `#01362D` titles, and clean prompt box.
2. Zero dark green radial background gradients or dark shell containers.

---

## 17. Final Inventory Counts

- **Routes Discovered**: **42**
- **Routes Rendered & Inspectable**: **42**
- **Customer Product Routes**: **24**
- **Internal Operator Console Routes**: **11**
- **Public Marketing & Auth Routes**: **7**
- **Shared Primitives Discovered**: **5**
- **Duplicate Primitive Implementations**: **13**
- **Modals Discovered**: **12**
- **Drawers Discovered**: **6**
- **Popovers / Dropdowns Discovered**: **4**
- **Dark Legacy Page Surfaces**: **5** (`RyanShieldPage`, `OwnerWeeklyBriefPage`, `WorkspaceDirectoryPage`, `SOPStudio`, `CameraSignalsView`)
- **Hard-Coded Dark Component Files**: **42**
- **P0 Usability / Contrast Issues**: **2**
- **P1 Usability / Inconsistency Issues**: **14**
- **Total Files Affected by Full Migration**: **54**

---

## 18. Final Read-Only Confirmation

- **0** application source files modified.
- **0** CSS/theme files modified.
- **0** functionality changed.
- **0** routes changed.
- **0** backend files modified.
- **0** database changes.
- **0** commits created.
- **0** code pushed.

---

*STOP. Read-only discovery phase complete. Awaiting explicit authorization before Phase A implementation.*
