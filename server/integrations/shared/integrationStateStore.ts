/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  WorkspaceIntegrationConnection, 
  WorkspaceCommunicationSignal, 
  ExternalActionApproval 
} from './integrationTypes.js';

export class IntegrationStateStore {
  private dbState: any;

  constructor(dbState: any) {
    this.dbState = dbState;
  }

  // --- Workspace Connection Operations ---
  public async getConnection(
    workspaceId: string, 
    provider: "google_workspace" | "microsoft_365"
  ): Promise<WorkspaceIntegrationConnection | null> {
    if (!this.dbState.workspaceIntegrationConnections) {
      this.dbState.workspaceIntegrationConnections = [];
    }
    const list: WorkspaceIntegrationConnection[] = this.dbState.workspaceIntegrationConnections;
    return list.find(c => c.workspaceId === workspaceId && c.provider === provider) || null;
  }

  public async upsertConnection(
    connection: WorkspaceIntegrationConnection
  ): Promise<WorkspaceIntegrationConnection> {
    if (!this.dbState.workspaceIntegrationConnections) {
      this.dbState.workspaceIntegrationConnections = [];
    }
    const list: WorkspaceIntegrationConnection[] = this.dbState.workspaceIntegrationConnections;
    const index = list.findIndex(c => c.workspaceId === connection.workspaceId && c.provider === connection.provider);
    if (index > -1) {
      list[index] = { ...list[index], ...connection };
    } else {
      list.push(connection);
    }
    return connection;
  }

  public async deleteConnection(
    workspaceId: string, 
    provider: "google_workspace" | "microsoft_365"
  ): Promise<boolean> {
    if (!this.dbState.workspaceIntegrationConnections) {
      this.dbState.workspaceIntegrationConnections = [];
      return false;
    }
    const initialLen = this.dbState.workspaceIntegrationConnections.length;
    this.dbState.workspaceIntegrationConnections = this.dbState.workspaceIntegrationConnections.filter(
      (c: any) => !(c.workspaceId === workspaceId && c.provider === provider)
    );
    return this.dbState.workspaceIntegrationConnections.length < initialLen;
  }

  // --- Communication Signal Operations ---
  public async listSignals(workspaceId: string): Promise<WorkspaceCommunicationSignal[]> {
    if (!this.dbState.workspaceCommunicationSignals) {
      this.dbState.workspaceCommunicationSignals = [];
    }
    const list: WorkspaceCommunicationSignal[] = this.dbState.workspaceCommunicationSignals;
    return list.filter(s => s.workspaceId === workspaceId);
  }

  public async addSignal(signal: WorkspaceCommunicationSignal): Promise<WorkspaceCommunicationSignal> {
    if (!this.dbState.workspaceCommunicationSignals) {
      this.dbState.workspaceCommunicationSignals = [];
    }
    const list: WorkspaceCommunicationSignal[] = this.dbState.workspaceCommunicationSignals;
    // Prevent duplicate signals based on sourceRecordId and provider
    const exists = list.some(s => s.workspaceId === signal.workspaceId && s.provider === signal.provider && s.sourceRecordId === signal.sourceRecordId);
    if (!exists) {
      list.push(signal);
    }
    return signal;
  }

  public async updateSignal(
    id: string, 
    updates: Partial<WorkspaceCommunicationSignal>
  ): Promise<WorkspaceCommunicationSignal | null> {
    if (!this.dbState.workspaceCommunicationSignals) return null;
    const list: WorkspaceCommunicationSignal[] = this.dbState.workspaceCommunicationSignals;
    const index = list.findIndex(s => s.id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...updates };
    return list[index];
  }

  // --- External Action Approval Operations ---
  public async getApproval(id: string): Promise<ExternalActionApproval | null> {
    if (!this.dbState.externalActionApprovals) {
      this.dbState.externalActionApprovals = [];
    }
    const list: ExternalActionApproval[] = this.dbState.externalActionApprovals;
    return list.find(a => a.id === id) || null;
  }

  public async addApproval(approval: ExternalActionApproval): Promise<ExternalActionApproval> {
    if (!this.dbState.externalActionApprovals) {
      this.dbState.externalActionApprovals = [];
    }
    const list: ExternalActionApproval[] = this.dbState.externalActionApprovals;
    list.push(approval);
    return approval;
  }

  public async updateApproval(
    id: string, 
    updates: Partial<ExternalActionApproval>
  ): Promise<ExternalActionApproval | null> {
    if (!this.dbState.externalActionApprovals) return null;
    const list: ExternalActionApproval[] = this.dbState.externalActionApprovals;
    const index = list.findIndex(a => a.id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...updates };
    return list[index];
  }

  public async listApprovals(workspaceId: string): Promise<ExternalActionApproval[]> {
    if (!this.dbState.externalActionApprovals) {
      this.dbState.externalActionApprovals = [];
    }
    const list: ExternalActionApproval[] = this.dbState.externalActionApprovals;
    return list.filter(a => a.workspaceId === workspaceId);
  }
}
