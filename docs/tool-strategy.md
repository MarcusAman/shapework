# Tool Strategy In Brokerage Operations

A core principle of the shapework. platform is that third-party software tools are replaceable connectors, while shapework. owns the operating intelligence.

## 1. Connector vs. Operating Layer
```
  MCP / API / Webhook = How software connects to a tool.
  shapework. Operating Layer = How the business decides what should happen next.
```

## 2. Declarative Scopes for Core Workflows

### Marketing Request Desk
- **Third-Party Tools**: Rechat Design Center, Google Drive, Canva, Gmail/SMS.
- **shapework. Logic**: Intake validation, SLA routing, deflections knowledge base, approvals, audit logs.
- **Manual Fallback**: Secure operator intake form + Work Queue task management.

### Pipeline / Closing Tracker
- **Third-Party Tools**: Rechat API, Dotloop loops, MLS/RESO, QuickBooks.
- **shapework. Logic**: Financial forecast summaries, risk-adjusted commission calculations, data gap notifications, owner brief.
- **Manual Fallback**: Direct CSV file upload template parser.

### Closing Document Compliance
- **Third-Party Tools**: Dotloop/SkySlope folders, SMS chasers.
- **shapework. Logic**: Milestone checklist enforcement, late upload risk scoring, reminders drafting.
- **Manual Fallback**: Manual checkoff task verification inside the transaction sidebar.
