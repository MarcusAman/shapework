export interface AIAuditLog {
  id: string;
  workspaceId: string;
  userId: string;
  capability: string;
  objectType?: string;
  objectId?: string;
  promptId: string;
  promptVersion: string;
  model: string;
  requestTime: string;
  completionTime: string;
  success: boolean;
  error?: string;
  suggestionApplied?: 'applied' | 'dismissed' | 'pending' | 'none';
  userFeedback?: any;
  metadata?: any;
}

export class AIAuditService {
  static logEvent(
    dbState: any,
    persistFn: (wsId?: string) => Promise<void>,
    log: Omit<AIAuditLog, 'id'>
  ) {
    const logId = `ai_log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const fullLog = { id: logId, ...log };

    if (!dbState.opsAuditLogs) dbState.opsAuditLogs = [];
    dbState.opsAuditLogs.unshift(fullLog);

    // Also add to global workspace audit events
    if (!dbState.auditEvents) dbState.auditEvents = [];
    dbState.auditEvents.unshift({
      id: `evt_ai_${Date.now()}`,
      workspaceId: log.workspaceId,
      timestamp: new Date().toISOString(),
      userName: log.userId,
      userRole: 'ops_ai_copilot',
      actionDescription: `AI Copilot execution: ${log.capability} (${log.success ? 'Success' : 'Failure'})`,
      impactArea: 'ai_copilot',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    persistFn(log.workspaceId).catch(err => {
      console.error('[AI Audit] Failed to persist AI audit event:', err);
    });
  }
}
