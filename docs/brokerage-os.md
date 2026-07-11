# Brokerage Operating System (OS) Architectural Overview

shapework. is a specialized operating layer built to handle real estate brokerage operations. 

Third-party systems (Rechat, Dotloop, QuickBooks, Google Drive) are replaceable infrastructure. shapework. owns the proprietary business rules, roles assignments, opportunity registers, and audit verification trails that make up a brokerage's core intellectual property.

## 1. Operating Design Principles
Every system feature and workflow solves at least one of the following key operational questions:
1. **Who owns this?** (Role Matrix)
2. **What changed?** (Audit Trail)
3. **What is missing?** (Gaps & Warning flags)
4. **What is at risk?** (Pain indices)
5. **What should happen next?** (Workflow cues)
6. **Who needs to approve it?** (Gated approvals)
7. **What system should be updated?** (Sync runs)
8. **What evidence proves it happened?** (Audit ledger)
9. **Can this pattern be reused across brokerages?** (Generic playbooks)

## 2. Structural Layer
```
   +-------------------------------------------------------+
   |                  shapework. UI Layer                  |
   |   (Command Briefs, Roles Maps, Scopes Sprints)        |
   +-------------------------------------------------------+
                              |
   +-------------------------------------------------------+
   |            shapework. Core Operating Layer            |
   |  (Operating Records, Gaps Registers, Workflow Engine)  |
   +-------------------------------------------------------+
                              |
   +-------------------------------------------------------+
   |                 Connectors (MCP/APIs)                 |
   |    (Rechat API, Dotloop Webhooks, QuickBooks Sync)    |
   +-------------------------------------------------------+
```
- **Connectors** act as communication channels to write and read external events.
- **Operating Layer** holds the state, audits, and decision rules.
