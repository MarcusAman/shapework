# .Shapework
> The AI Operations Employee for Real Estate Brokerages

.Shapework is a premium, configurable vertical SaaS platform that turns operational audit methodology into software. It does not replace transaction managers or CRM tools; rather, it sits as a system of operational intelligence and execution directly across systems of record (including Rechat, Dotloop, SkySlope, DocuSign, Gmail, Outlook, and Google Drive).

This application runs an active multi-tenant simulation of real estate operations with stateful memory, interactive mock adapters, and genuine Gemini AI task planners.

---

## 🚀 Quick Start / Local Setup

### Prerequisites
* **Node.js** (v20+ recommended)
* **npm** (installed automatically)

### Installation
1. Install base dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```bash
   cp .env.example .env
   ```
   * *Note: The Gemini API key will be automatically loaded if running in Google AI Studio.*

3. Start the unified full-stack dev server:
   ```bash
   npm run dev
   ```
   * Open your browser to [http://localhost:3000](http://localhost:3000) to view the live app!

---

## 📁 Project Workspace Layout
* `/server.ts` - Unified Express entry point that boots Vite in dev middleware mode and exposes backend API endpoints.
* `/src/App.tsx` - Premium, high-fidelity UI layout styled with responsive, editorial Tailwind CSS. Includes 11 active screen views.
* `/src/shared/mockDb.ts` - Master seed data schema containing 35 agents, 18 transactions, and active listings launch templates.
* `/supabase/migrations/` - Production-ready schema migrations with Row Level Security (RLS) rules.
* `/docs/` - Complete modular system documentation files:
  - `/docs/product-spec.md` - Core features and role experiences.
  - `/docs/architecture.md` - Full-stack design and adapter models.
  - `/docs/data-model.md` - Schema and common multi-tenant fields.
  - `/docs/integrations.md` - Google Workspace and Rechat synchronizer details.
  - `/docs/ai-safety.md` - Business safety guardrails and autonomous blocks.
  - `/docs/mvp-roadmap.md` - High-level release milestones.

---

## 🛠️ Sandbox Role Switcher
Test distinct persona views instantly using the **Operational Sandbox Banner** at the top of the screen:
1. **Brokerage Owner / Executive:** Track macro ROI indicators, estimated labor savings, and total at-risk warnings.
2. **Brokerage Administrator / Ops Manager:** Customize active workflow templates, task due-date offsets, and integration connections.
3. **Transaction Coordinator (TC):** Manage the daily risk digest and execute suggested AI follow-ups.
4. **Real Estate Agent:** Track listing launch steps (such as photography coordinates or MLS formatting).
5. **External Participant:** Update loan contingency progress through secure, expiring link interfaces.

---

## 🔐 AI Safety & Business Boundaries
To remain compliant inside highly regulated real estate markets, the AI Operator has the following strict boundaries:
* **No Price Negotiating:** .Shapework cannot negotiate credits or purchase offsets.
* **No Contract Interpretation:** The AI does not make legal claims or advise waiving contingencies.
* **Double-Approval Loop:** No external email or calendar invite is sent without active human review and authorization from the Command Center.

---

## 📋 Known Limitations & Phase 2 Roadmap

### Current Limitations (MVP)
* Webhook payloads are simulated in-memory and do not persist across server restarts unless committed to db migrations.
* File uploads are mocked within the document pane without active S3 storage bindings.

### Phase 2 Roadmap
* Active write-backs to live Rechat transaction pipelines.
* Gmail label folders automated syncing using minimal secure OAuth.
* OCR extraction on seller disclosure files with Zod structured output validation.
