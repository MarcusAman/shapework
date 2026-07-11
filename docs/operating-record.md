# The shapework. Operating Record

The Operating Record is the core database entity representing the digital operating blueprint of a brokerage workspace. It decouples the operational strategy from specific third-party API configurations.

## 1. Schema Structure
```ts
export type OperatingRecord = {
  id: string;
  workspaceId: string;
  businessName: string;
  vertical: "real_estate_brokerage";
  status: "discovery" | "build_sprint" | "launching" | "active" | "paused";
  currentStateMapId?: string;
  opportunityRegisterId?: string;
  roleMapId?: string;
  workflowMapIds: string[];
  systemMapIds: string[];
  routingPolicyId?: string;
  approvalPolicyId?: string;
  auditPolicyId?: string;
  quickWinIds: string[];
  buildSprintIds: string[];
  createdAt: string;
  updatedAt: string;
};
```

## 2. Core Tabs in the Operating Record
1. **Business Snapshot**: Captures active tool stacks, headcount, timezone, and primary owner goals.
2. **Roles & Ownership**: Defines who owns each of the 16 core responsibilities, backup roles, and SLA timeframes.
3. **Workflow Maps**: Scopes active process mappings, required inputs, and tool strategies.
4. **Opportunity Register**: Logs operational pain points ranked by calculated pain index scores.
5. **Quick Wins**: Track implementation of low-cost shippable improvements (reusable playbooks).
6. **Build Sprint Plan**: Scopes accepted opportunities into active sprints.
7. **Active Operating System**: Real-time health metrics of active workflow engines.
8. **Audit Log**: Immutable ledger of changes to the operating record.
