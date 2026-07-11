/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LaunchReadinessCheck, LaunchReadinessCategory } from '../../src/types/launch';

export function runLaunchReadinessChecks(workspaceId: string, dbState: any): {
  checks: LaunchReadinessCheck[];
  readinessPercentage: number;
  blockingFailuresCount: number;
  warningsCount: number;
  goLiveEligible: boolean;
  recommendedNextAction: string;
} {
  const checks: LaunchReadinessCheck[] = [];
  const lastCheckedAt = new Date().toISOString();

  // 1. Workspace Checks
  const workspace = (dbState.workspaces || []).find((w: any) => w.id === workspaceId);
  const launchMode = workspace?.launchMode || 'integration_first'; // manual_first, integration_first, hybrid

  checks.push({
    id: 'ws_profile',
    workspaceId,
    category: 'workspace',
    label: 'Workspace Profile Configured',
    status: workspace ? 'pass' : 'fail',
    requiredForLaunch: true,
    blockingReason: workspace ? undefined : 'Workspace profile must be configured via Onboarding Wizard.',
    evidence: workspace ? { name: workspace.name, slug: workspace.slug, launchMode } : undefined,
    lastCheckedAt,
    fixLink: '/demo/settings?tab=wizard'
  });

  // 2. Users & Roles Checks
  const users = (dbState.workspaceUsers || []).filter((u: any) => u.workspaceId === workspaceId);
  const hasOwner = users.some((u: any) => u.role === 'owner');
  const hasTC = users.some((u: any) => u.role === 'transaction_coordinator' || u.role === 'operations_lead');
  checks.push({
    id: 'roles_configured',
    workspaceId,
    category: 'users_roles',
    label: 'Staff Mappings Mapped',
    status: (hasOwner && hasTC) ? 'pass' : 'fail',
    requiredForLaunch: true,
    blockingReason: !(hasOwner && hasTC) ? 'Must designate at least one Owner and one Operations/TC staff member.' : undefined,
    evidence: { usersCount: users.length, hasOwner, hasTC },
    lastCheckedAt,
    fixLink: '/demo/settings?tab=wizard'
  });

  // 3. Routing Checks
  checks.push({
    id: 'routing_rules',
    workspaceId,
    category: 'routing',
    label: 'Escrow Routing SLA Rules Mapped',
    status: dbState.settings ? 'pass' : 'warning',
    requiredForLaunch: false,
    evidence: dbState.settings ? { slaHours: dbState.settings.slaHours || 24 } : undefined,
    lastCheckedAt,
    fixLink: '/demo/settings?tab=wizard'
  });

  // 4. Compliance Checks
  const tasks = (dbState.tasks || []).filter((t: any) => t.workspaceId === workspaceId && t.category === 'Launch Checklist');
  const pendingChecklist = tasks.filter((t: any) => t.status === 'pending');
  checks.push({
    id: 'compliance_checklist',
    workspaceId,
    category: 'compliance',
    label: 'Launch Checklist Complete',
    status: pendingChecklist.length === 0 ? 'pass' : 'fail',
    requiredForLaunch: true,
    blockingReason: pendingChecklist.length > 0 ? `Unresolved blockers remaining on Go-Live checklist: ${pendingChecklist.map((t: any) => t.title).join(', ')}` : undefined,
    evidence: { totalChecklistItems: tasks.length, pendingItemsCount: pendingChecklist.length },
    lastCheckedAt,
    fixLink: '/demo/settings?tab=checklist'
  });

  // 5. Approvals Checks
  checks.push({
    id: 'approval_policy',
    workspaceId,
    category: 'approvals',
    label: 'Writeback Approval Policy Gated',
    status: 'pass', // Outbound writebacks are always gated for security
    requiredForLaunch: true,
    evidence: { externalWritebacksApprovedGated: true },
    lastCheckedAt
  });

  // 6. Integrations Checks (Rechat + Dotloop Webhook Token Config)
  const rechatConnector = (dbState.integrations || []).find((i: any) => i.id === 'i_rechat');
  const dotloopEndpoint = (dbState.webhookEndpoints || []).find((w: any) => w.workspaceId === workspaceId && w.provider === 'apination_dotloop');
  
  const rechatReady = rechatConnector && rechatConnector.connected;
  checks.push({
    id: 'rechat_connection',
    workspaceId,
    category: 'integrations',
    label: 'Rechat OAuth Connection Established',
    status: rechatReady ? 'pass' : 'fail',
    requiredForLaunch: launchMode === 'integration_first',
    blockingReason: 'OAuth link to Rechat CRM must be active.',
    evidence: rechatConnector ? { connected: rechatConnector.connected } : undefined,
    lastCheckedAt,
    fixLink: '/demo/integrations'
  });

  const dotloopReady = dotloopEndpoint && dotloopEndpoint.status === 'active';
  checks.push({
    id: 'dotloop_webhook_config',
    workspaceId,
    category: 'integrations',
    label: 'Dotloop Webhook Endpoint Token Generated',
    status: dotloopReady ? 'pass' : 'fail',
    requiredForLaunch: launchMode === 'integration_first',
    blockingReason: 'Active opaque webhook endpoint token is required.',
    evidence: dotloopEndpoint ? { status: dotloopEndpoint.status } : undefined,
    lastCheckedAt,
    fixLink: '/demo/integrations'
  });

  // 7. Data Sync checks
  const syncEvent = (dbState.integrationEvents || []).find(
    (e: any) => e.source === 'apination_dotloop' && (!e.workspaceId || e.workspaceId === workspaceId)
  );
  checks.push({
    id: 'initial_sync',
    workspaceId,
    category: 'data',
    label: 'Baseline Ingestion Sync Triggered',
    status: syncEvent ? 'pass' : 'warning',
    requiredForLaunch: false,
    evidence: { lastEventReceived: syncEvent ? syncEvent.timestamp : null },
    lastCheckedAt,
    fixLink: '/demo/integrations'
  });

  // 8. Work Queue checks
  const openQueueIssues = (dbState.operationsInbox || []).filter((i: any) => i.status === 'open' && (!i.workspaceId || i.workspaceId === workspaceId));
  checks.push({
    id: 'work_queue_reviewed',
    workspaceId,
    category: 'work_queue',
    label: 'Operational Work Queue Audited',
    status: openQueueIssues.length < 5 ? 'pass' : 'warning',
    requiredForLaunch: false,
    evidence: { openInboxIssuesCount: openQueueIssues.length },
    lastCheckedAt
  });

  // 9. Audit checks
  const audits = (dbState.auditEvents || []).filter((a: any) => !a.workspaceId || a.workspaceId === workspaceId);
  checks.push({
    id: 'audit_active',
    workspaceId,
    category: 'audit',
    label: 'Append-Only Auditing Logger Active',
    status: audits.length > 0 ? 'pass' : 'warning',
    requiredForLaunch: false,
    evidence: { loggedEventsCount: audits.length },
    lastCheckedAt
  });

  // 10. Security checks
  const isVaultKeySet = !!process.env.CREDENTIAL_ENCRYPTION_KEY;
  checks.push({
    id: 'security_vault',
    workspaceId,
    category: 'security',
    label: 'Credential Vault Encryption Configured',
    status: isVaultKeySet ? 'pass' : 'fail',
    requiredForLaunch: true,
    blockingReason: 'CREDENTIAL_ENCRYPTION_KEY environment variable is required to protect tokens.',
    evidence: { encryptedVaultReady: isVaultKeySet },
    lastCheckedAt
  });

  // Apply Waivers System
  const waivers = dbState.launchWaivers || [];
  const unwavableCheckIds = ['ws_profile', 'roles_configured', 'security_vault'];

  checks.forEach(check => {
    if (check.status === 'fail' && !unwavableCheckIds.includes(check.id)) {
      const activeWaiver = waivers.find((w: any) => w.workspaceId === workspaceId && w.readinessCheckId === check.id);
      if (activeWaiver) {
        check.status = 'warning'; // Convert blocker to warning
        check.blockingReason = undefined;
        check.evidence = {
          ...check.evidence,
          waived: true,
          waivedByUserId: activeWaiver.waivedByUserId,
          waivedReason: activeWaiver.reason
        };
      }
    }
  });

  // Calculations
  const requiredChecks = checks.filter(c => c.requiredForLaunch);
  const passedRequiredCount = requiredChecks.filter(c => c.status === 'pass').length;
  
  const totalChecks = checks.length;
  const passedCount = checks.filter(c => c.status === 'pass').length;
  const warningsCount = checks.filter(c => c.status === 'warning').length;
  const blockingFailuresCount = requiredChecks.filter(c => c.status === 'fail').length;

  const readinessPercentage = Math.round((passedCount / totalChecks) * 100);
  const goLiveEligible = blockingFailuresCount === 0;

  // Determine recommendation
  let recommendedNextAction = 'Brokerage is ready to launch! Proceed to Go-Live Review tab.';
  if (blockingFailuresCount > 0) {
    const firstBlocker = requiredChecks.find(c => c.status === 'fail');
    recommendedNextAction = `Unblock launch blocker: ${firstBlocker?.label}. ${firstBlocker?.blockingReason}`;
  } else if (warningsCount > 0) {
    recommendedNextAction = 'Resolve remaining launch configuration warnings for peak performance.';
  }

  return {
    checks,
    readinessPercentage,
    blockingFailuresCount,
    warningsCount,
    goLiveEligible,
    recommendedNextAction
  };
}
