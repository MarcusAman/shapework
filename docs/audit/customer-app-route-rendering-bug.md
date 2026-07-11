# Audit Report — Customer `/app` Route Rendering Bug

## 1. Current `/app` Route Configuration
All routes starting with `/app` are loaded dynamically in `src/App.tsx` and routed directly to the `WorkspaceConsole` component. 
```tsx
const isApp = currentPath.startsWith('/app');
// ...
} else if (isDemo || isApp || isInternal) {
  return (
    <React.Suspense fallback={...}>
      {isInternal ? (
        <InternalConsole />
      ) : isDemo ? (
        <DemoConsole />
      ) : (
        <WorkspaceConsole />
      )}
    </React.Suspense>
  );
}
```

## 2. Current Nav Configuration
Inside `src/components/layout/CollapsibleNavigationRail.tsx`, the primary navigation items list defines the available screens for the customer-facing console:
```typescript
const primaryNavItems = [
  { name: 'Today', icon: Sliders },
  { name: 'Work Queue', icon: Inbox, badge: 7 },
  { name: 'Transactions', icon: FolderOpen },
  { name: 'Compliance', icon: Shield },
  { name: 'Marketing Requests', icon: Layers },
  { name: 'People & Ownership', icon: Users },
  { name: 'Office & Signage', icon: Home },
  { name: 'Approvals', icon: CheckCircle },
  { name: 'Owner Brief', icon: FileText },
  { name: 'Integrations', icon: Link2 },
  { name: 'Audit', icon: Clock },
  { name: 'Settings', icon: Settings },
];
```

## 3. Current Active Tab Resolver & Route-to-Component Mapping
In `src/state/useWorkspaceConsoleState.ts`, the `getTabFromPath` function resolves the current path into an active tab name, and `getPathFromTab` maps the active tab name back into a URL:

```typescript
const getTabFromPath = (path: string): string => {
  const clean = path.replace(/^\/app/, '/demo');
  if (clean.startsWith('/demo/work-queue')) return 'Work Queue';
  if (clean.startsWith('/demo/operating-record')) return 'Operating Record';
  if (clean.startsWith('/demo/opportunities')) return 'Opportunities';
  if (clean.startsWith('/demo/workflows')) return 'Workflows';
  if (clean.startsWith('/demo/transactions')) return 'Transactions';
  if (clean.startsWith('/demo/deals')) return 'Transactions';
  if (clean.startsWith('/demo/listings')) return 'Transactions';
  if (clean.startsWith('/demo/people')) return 'People & Roles';
  if (clean.startsWith('/demo/integrations')) return 'Integrations';
  if (clean.startsWith('/demo/audit')) return 'Audit';
  if (clean.startsWith('/demo/settings')) return 'Settings';
  return 'Command Center';
};
```

## 4. Why the Wrong Component is Rendering (Root Cause Analysis)
1. **Missing Paths in `getTabFromPath`**:
   - Routes like `/app/compliance`, `/app/marketing`, `/app/office`, `/app/approvals`, `/app/owner-brief` are completely omitted. They clean to `/demo/compliance`, `/demo/marketing`, etc.
   - Because they are omitted, they all fall back to returning `'Command Center'`.
2. **Tab Names vs. Route Path Incompatibilities**:
   - For `/app/people`, it maps to `'People & Roles'` in `getTabFromPath`. However, `CustomerAppRoutes.tsx` expects the tab key to be `'People & Ownership'` or `'People'`. This discrepancy causes rendering failure.
3. **Mismatched Default Tab Name**:
   - For the main route `/app`, `getTabFromPath` returns `'Command Center'`. But `CustomerAppRoutes.tsx` expects the tab key to be `'Today'` (the first case in its switch statement), leading to a fallback error.
4. **Missing Navigation Mapping in `getPathFromTab`**:
   - The tabs `'Compliance'`, `'Marketing Requests'`, `'People & Ownership'`, `'Office & Signage'`, `'Approvals'`, `'Owner Brief'` do not have cases in `getPathFromTab` in `useWorkspaceConsoleState.ts`.
   - Therefore, clicking any of these sidebar navigation links maps to the fallback case (`default: return prefix;` which is `/app`).
   - This causes the address bar to revert back to `/app`, rendering the fallback screen or `'Command Center'` on all page transitions.
5. **No popstate/route synchronization in `WorkspaceConsole`**:
   - Unlike `DemoConsole.tsx`, `WorkspaceConsole.tsx` does not have a `useEffect` to listen to window location and update the tab state, leaving route switching broken on history back/forward operations.

## 5. Files to be Changed
- `src/state/useWorkspaceConsoleState.ts`: Update path resolvers `getTabFromPath` and `getPathFromTab`.
- `src/state/useDemoConsoleState.ts`: Sync path resolvers for consistency.
- `src/components/demo/WorkspaceConsole.tsx`: Add popstate synchronization `useEffect`.
- `src/routes/CustomerAppRoutes.tsx`: Define route structure, map customer views properly, and eliminate fallback overlap.
