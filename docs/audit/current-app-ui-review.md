# Pre-Polish App UI Review

Audit review of the application UI running on production-like mode under the `/app` route.

---

## 1. /app Screenshot Analysis

| Page Screenshot | No `/demo` Route | No "Nest Realty" | No "Synthetic / Sandbox / Private Demo" | No "COO Focus / Tech Specs / Demo QA" | No Pop-Culture Fake Names | No Fake Audit Logs | No Simulator Controls |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| [Command Center](file:///Users/marcusaman/Downloads/shapework%20(2)/docs/audit/current-app-ui-screenshots/command-center.png) | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| [Work Queue](file:///Users/marcusaman/Downloads/shapework%20(2)/docs/audit/current-app-ui-screenshots/work-queue.png) | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| [Operating Record](file:///Users/marcusaman/Downloads/shapework%20(2)/docs/audit/current-app-ui-screenshots/operating-record.png) | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No (Sim panels) |
| [Opportunities](file:///Users/marcusaman/Downloads/shapework%20(2)/docs/audit/current-app-ui-screenshots/opportunities.png) | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| [Workflows](file:///Users/marcusaman/Downloads/shapework%20(2)/docs/audit/current-app-ui-screenshots/workflows.png) | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| [Transactions](file:///Users/marcusaman/Downloads/shapework%20(2)/docs/audit/current-app-ui-screenshots/transactions.png) | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| [People & Roles](file:///Users/marcusaman/Downloads/shapework%20(2)/docs/audit/current-app-ui-screenshots/people.png) | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No (AI controls) |
| [Integrations](file:///Users/marcusaman/Downloads/shapework%20(2)/docs/audit/current-app-ui-screenshots/integrations.png) | ✅ Yes | ❌ No | ❌ No (Sandbox text) | ✅ Yes | ✅ Yes | ❌ No (Receipt logs) | ✅ Yes |
| [Audit](file:///Users/marcusaman/Downloads/shapework%20(2)/docs/audit/current-app-ui-screenshots/audit.png) | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No (Fake events) | ✅ Yes |
| [Settings](file:///Users/marcusaman/Downloads/shapework%20(2)/docs/audit/current-app-ui-screenshots/settings.png) | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 2. Issues Logged & High Priority Fixes

1. **Nest Realty Leaks**: Default data files (`src/data/demoData.ts` and UI views) contain references to "Nest Realty" which appear in production `/app` modes.
2. **Operations Pulse & Ask shapework Overcrowding**: Right diagnostic rail and bottom floating dock overlap components and compete for layout space.
3. **Sparse Gaps & Opportunities Tab**: The Priorities view renders a generic empty screen if empty.
4. **Audit Fake Events**: Leftover simulated logs (e.g. fake email sweeps, DocuSign errors) display on production audit lists.
5. **AI controls in Workforce tab**: AIAgentWorkforce still shows robotic AI triggers and confidence values in some components.
