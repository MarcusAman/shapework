/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Execution Engine — Controlled, Audited Action Execution
 * Enforces authorization, input validation, risk gates, execution limits, post-verification, and structured auditing.
 */

import { NoraActionRegistry } from './noraActionRegistry.js';
import { NoraActionResult, NoraContext } from './types.js';
import { NoraContextEngine } from './noraContextEngine.js';
import { NoraIdempotencyEngine } from './noraIdempotencyEngine.js';
import { NoraDurableActionLedger } from './noraDurableActionLedger.js';
import { BackupSnapshotService } from '../persistence/backupSnapshotService.js';

export interface ExecuteActionOptions {
  actionName: string;
  input: Record<string, any>;
  context: NoraContext;
  dbState?: any;
}

export class NoraExecutionEngine {
  private static readonly EXECUTION_TIMEOUT_MS = 15000;

  /**
   * Executes a registered Nora action through the full controlled lifecycle:
   * AUTHORIZE -> VALIDATE -> CONFIRMATION CHECK -> EXECUTE -> VERIFY -> AUDIT LOG
   */
  public static async executeAction(options: ExecuteActionOptions): Promise<NoraActionResult> {
    const { actionName, input, context, dbState } = options;
    const action = NoraActionRegistry.getAction(actionName);
    const timestamp = new Date().toISOString();
    const actionId = `act_exec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // 1. Action Existence Check
    if (!action) {
      const errResult: NoraActionResult = {
        success: false,
        actionName,
        status: 'failed',
        error: `Action "${actionName}" is not registered in the NORA action registry.`,
        humanReadableSummary: `Unknown action: ${actionName}.`,
        auditMetadata: {
          actionId,
          timestamp,
          actorUserId: context.user.id,
          actorRole: context.user.role,
          tenantId: context.tenantId,
          workspaceId: context.workspaceId,
          riskLevel: 'LOW',
          verified: false,
          verificationNotes: 'Action not found',
          impactArea: 'nora_agent'
        }
      };
      this.logAudit(errResult, dbState);
      return errResult;
    }

    // 2. Authorization Gate (Enforced outside the LLM)
    const isOwnerOrAdmin = context.user.role === 'admin' || context.user.role === 'owner' || context.permissions.includes('access_developer_tools');
    if (action.requiredPermission && !isOwnerOrAdmin && !context.permissions.includes(action.requiredPermission)) {
      const unauthResult: NoraActionResult = {
        success: false,
        actionName,
        status: 'unauthorized',
        error: `User ${context.user.email} (${context.user.role}) lacks required permission: ${action.requiredPermission}`,
        humanReadableSummary: `Action "${actionName}" requires the "${action.requiredPermission}" permission, which is not granted to role "${context.user.role}".`,
        auditMetadata: {
          actionId,
          timestamp,
          actorUserId: context.user.id,
          actorRole: context.user.role,
          tenantId: context.tenantId,
          workspaceId: context.workspaceId,
          riskLevel: action.riskLevel,
          verified: false,
          verificationNotes: 'Permission denied',
          impactArea: action.domain
        }
      };
      this.logAudit(unauthResult, dbState);
      return unauthResult;
    }

    // 3. Input Schema Validation
    const parsed = action.inputSchema.safeParse(input);
    if (!parsed.success) {
      const validationResult: NoraActionResult = {
        success: false,
        actionName,
        status: 'failed',
        error: `Invalid action input: ${parsed.error.message}`,
        humanReadableSummary: `Input validation failed for action "${actionName}". Please check the required parameters.`,
        auditMetadata: {
          actionId,
          timestamp,
          actorUserId: context.user.id,
          actorRole: context.user.role,
          tenantId: context.tenantId,
          workspaceId: context.workspaceId,
          riskLevel: action.riskLevel,
          verified: false,
          verificationNotes: 'Schema validation error',
          impactArea: action.domain
        }
      };
      this.logAudit(validationResult, dbState);
      return validationResult;
    }

    // 4. Human Confirmation Gate for High Risk Actions
    const needsConfirmation = typeof action.requiresConfirmation === 'function'
      ? action.requiresConfirmation(parsed.data, context)
      : (action.requiresConfirmation === true || (action.riskLevel === 'HIGH' && !parsed.data.confirmed));

    if (needsConfirmation) {
      const prompt = typeof action.confirmationPrompt === 'function'
        ? (action.confirmationPrompt as any)(parsed.data, context)
        : (action.confirmationPrompt || `Action "${actionName}" requires human confirmation before execution.`);

      const confirmResult: NoraActionResult = {
        success: false,
        actionName,
        status: 'requires_confirmation',
        requiresConfirmation: true,
        confirmationPrompt: prompt,
        humanReadableSummary: `Awaiting human confirmation to proceed with ${actionName}.`,
        auditMetadata: {
          actionId,
          timestamp,
          actorUserId: context.user.id,
          actorRole: context.user.role,
          tenantId: context.tenantId,
          workspaceId: context.workspaceId,
          riskLevel: action.riskLevel,
          verified: false,
          verificationNotes: 'Waiting for human confirmation',
          impactArea: action.domain
        }
      };
      this.logAudit(confirmResult, dbState);
      return confirmResult;
    }

    // 5. Idempotency Check for Side-Effect Actions (MEDIUM and HIGH Risk)
    const idempotencyKey = NoraIdempotencyEngine.computeKey(
      context.workspaceId,
      actionName,
      parsed.data,
      parsed.data.idempotencyKey
    );

    if (action.riskLevel !== 'LOW') {
      const cached = NoraIdempotencyEngine.getCachedResult(idempotencyKey);
      if (cached) {
        return cached;
      }

      if (action.riskLevel === 'HIGH') {
        const durableRecord = await NoraDurableActionLedger.findAction(idempotencyKey);
        if (durableRecord && durableRecord.finalResultStatus === 'completed') {
          return {
            success: true,
            actionName,
            status: 'completed',
            data: durableRecord.cachedResult?.data || { workOrderId: durableRecord.entityId, status: 'dispatched' },
            humanReadableSummary: `${durableRecord.humanReadableSummary} (Persistent idempotent replay)`,
            idempotencyKey,
            auditMetadata: {
              actionId: durableRecord.id,
              timestamp: durableRecord.executionTimestamp,
              actorUserId: durableRecord.authenticatedUserId,
              actorRole: context.user.role,
              tenantId: durableRecord.tenantId,
              workspaceId: durableRecord.workspaceId,
              riskLevel: 'HIGH',
              verified: durableRecord.verificationStatus,
              verificationNotes: 'Found in persistent durable action ledger',
              impactArea: action.domain
            }
          };
        }
      }
    }

    // 6. Execution with Timeout & Error Boundary
    try {
      const executePromise = action.execute(parsed.data, context);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Action ${actionName} execution timed out after ${this.EXECUTION_TIMEOUT_MS}ms`)), this.EXECUTION_TIMEOUT_MS)
      );

      const rawResult = await Promise.race([executePromise, timeoutPromise]);

      // 7. Post-Execution Verification
      let verification: { verified: boolean; notes?: string } = { verified: rawResult.success, notes: 'Default execution verification' };
      if (action.verify && rawResult.success) {
        try {
          const tempResult: NoraActionResult = {
            ...rawResult,
            actionName,
            auditMetadata: {
              actionId,
              timestamp,
              actorUserId: context.user.id,
              actorRole: context.user.role,
              tenantId: context.tenantId,
              workspaceId: context.workspaceId,
              riskLevel: action.riskLevel,
              verified: false,
              impactArea: action.domain
            }
          };
          verification = await action.verify(tempResult, context);
        } catch (vErr: any) {
          verification = { verified: false, notes: `Verification check error: ${vErr.message}` };
        }
      }

      // 8. Assemble Complete ActionResult (Enforcing Verification Gate)
      const isOverallSuccess = rawResult.success && verification.verified;
      const finalStatus = isOverallSuccess ? rawResult.status : (rawResult.success ? 'verification_failed' : (rawResult.status || 'failed'));
      const finalSummary = !verification.verified && rawResult.success
        ? `Action "${actionName}" executed, but post-execution verification failed: ${verification.notes || 'Entity state could not be verified'}.`
        : rawResult.humanReadableSummary;

      const finalResult: NoraActionResult = {
        success: isOverallSuccess,
        actionName,
        status: finalStatus as any,
        data: rawResult.data,
        humanReadableSummary: finalSummary,
        error: rawResult.error || (!verification.verified ? (verification.notes || 'Verification failed') : undefined),
        requiresConfirmation: rawResult.requiresConfirmation,
        confirmationPrompt: rawResult.confirmationPrompt,
        idempotencyKey,
        auditMetadata: {
          actionId,
          timestamp,
          actorUserId: context.user.id,
          actorRole: context.user.role,
          tenantId: context.tenantId,
          workspaceId: context.workspaceId,
          riskLevel: action.riskLevel,
          verified: verification.verified,
          verificationNotes: verification.notes,
          impactArea: action.domain
        }
      };

      // Record in Idempotency Cache if successful side-effect
      if (isOverallSuccess && action.riskLevel !== 'LOW') {
        NoraIdempotencyEngine.recordExecution(idempotencyKey, finalResult);
      }

      // 9. Synchronous Durable Persistence for HIGH-risk actions
      if (isOverallSuccess && action.riskLevel === 'HIGH') {
        try {
          await NoraDurableActionLedger.recordAction({
            id: actionId,
            requestId: (input as any).requestId || `req_${Date.now()}`,
            idempotencyKey,
            authenticatedUserId: context.user.id,
            tenantId: context.tenantId,
            workspaceId: context.workspaceId,
            actionName,
            entityId: rawResult.data?.workOrderId || rawResult.data?.messageSid || (input as any).propertyAddress,
            normalizedArgs: parsed.data,
            externalProviderId: rawResult.data?.workOrderId || rawResult.data?.messageSid,
            executionTimestamp: timestamp,
            verificationStatus: verification.verified,
            finalResultStatus: finalStatus,
            humanReadableSummary: finalSummary,
            cachedResult: finalResult
          });
          BackupSnapshotService.createSnapshot(`high_risk_action_${actionName}`);
        } catch (snapErr) {
          console.warn('[Durable Persistence] Failed to commit durable action record:', snapErr);
        }
      }

      // 10. Audit Logging
      this.logAudit(finalResult, dbState);
      return finalResult;
    } catch (err: any) {
      const failResult: NoraActionResult = {
        success: false,
        actionName,
        status: 'failed',
        error: err.message || 'Execution error',
        humanReadableSummary: `Failed to execute action "${actionName}": ${err.message || 'Unknown error'}`,
        auditMetadata: {
          actionId,
          timestamp,
          actorUserId: context.user.id,
          actorRole: context.user.role,
          tenantId: context.tenantId,
          workspaceId: context.workspaceId,
          riskLevel: action.riskLevel,
          verified: false,
          verificationNotes: `Execution threw error: ${err.message}`,
          impactArea: action.domain
        }
      };
      this.logAudit(failResult, dbState);
      return failResult;
    }
  }

  /**
   * Persists structured audit record into dbState.auditEvents and context memory.
   */
  private static logAudit(result: NoraActionResult, dbState?: any) {
    const auditEntry = {
      id: result.auditMetadata.actionId,
      actionName: result.actionName,
      timestamp: result.auditMetadata.timestamp,
      userId: result.auditMetadata.actorUserId,
      userRole: result.auditMetadata.actorRole,
      tenantId: result.auditMetadata.tenantId,
      workspaceId: result.auditMetadata.workspaceId,
      riskLevel: result.auditMetadata.riskLevel,
      success: result.success,
      status: result.status,
      humanReadableSummary: result.humanReadableSummary,
      error: result.error,
      impactArea: result.auditMetadata.impactArea
    };

    NoraContextEngine.recordAction(auditEntry);

    if (dbState) {
      if (!dbState.auditEvents) dbState.auditEvents = [];
      dbState.auditEvents.unshift({
        id: `evt_${result.auditMetadata.actionId}`,
        workspaceId: result.auditMetadata.workspaceId,
        timestamp: result.auditMetadata.timestamp,
        userName: result.auditMetadata.actorUserId,
        userRole: result.auditMetadata.actorRole,
        actionDescription: `NORA Agent Action: ${result.actionName} - ${result.humanReadableSummary}`,
        impactArea: result.auditMetadata.impactArea,
        createdAt: result.auditMetadata.timestamp,
        updatedAt: result.auditMetadata.timestamp
      });
    }
  }
}
