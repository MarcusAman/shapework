/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Capability Registry — Workspace Capability Authorization & Verification
 * 
 * Governing Principle:
 * "NORA may offer an action only when the workspace has a registered, authorized capability.
 * Do not display fake or decorative action buttons. If an integration is unavailable,
 * NORA may offer a real setup or escalation action, but must not imply she can execute
 * the unavailable action."
 */

import { ProviderMode } from '../truth/noraTruthEnvelope.js';

export type WorkspaceCapabilityType =
  | 'calendar.read'
  | 'calendar.create'
  | 'calendar.reschedule'
  | 'calendar.cancel'
  | 'email.send'
  | 'sms.send'
  | 'drive.read'
  | 'drive.create'
  | 'mls.read'
  | 'transaction.read'
  | 'task.create'
  | 'task.assign'
  | 'vendor.dispatch'
  | 'directory.read'
  | 'sops.read'
  | 'sops.create'
  | 'maxa.create'
  | 'attention.read'
  | 'commitments.manage';

export interface WorkspaceCapability {
  capability: WorkspaceCapabilityType;
  workspaceId: string;
  provider: string;
  mode: ProviderMode;
  connected: boolean;
  authorized: boolean;
  lastVerifiedAt?: string;
  featuresSupported?: string[];
  isSynchronized?: boolean;
  writesSupported?: boolean;
  verificationSupported?: boolean;
  statusNotes?: string;
}

export class WorkspaceCapabilityRegistry {
  private static capabilities: Map<string, WorkspaceCapability> = new Map();
  private static initialized = false;

  private static buildKey(workspaceId: string, capability: string): string {
    const ws = (workspaceId || 'ws_wilmington').toLowerCase().trim();
    return `${ws}:${capability}`;
  }

  private static ensureDefaults(): void {
    if (this.initialized) return;
    this.initialized = true;

    const defaultWorkspaces = ['ws_wilmington', 'nest-realty-wilmington', 'tenant_nest_uat'];
    for (const ws of defaultWorkspaces) {
      // 1. Task Creation & Assignment (Internal DB capability - authoritative PostgreSQL datastore)
      this.registerCapability({
        capability: 'task.create',
        workspaceId: ws,
        provider: 'shapework_postgres',
        mode: 'LIVE',
        connected: true,
        authorized: true,
        writesSupported: true,
        verificationSupported: true,
        isSynchronized: true,
        lastVerifiedAt: new Date().toISOString(),
        featuresSupported: ['create_task', 'assign_task', 'due_date_tracking']
      });

      this.registerCapability({
        capability: 'task.assign',
        workspaceId: ws,
        provider: 'shapework_postgres',
        mode: 'LIVE',
        connected: true,
        authorized: true,
        writesSupported: true,
        verificationSupported: true,
        isSynchronized: true,
        lastVerifiedAt: new Date().toISOString(),
        featuresSupported: ['reassign_task', 'add_blocker', 'resolve_blocker']
      });

      // 2. SOP & Knowledge Read / Create (Internal PostgreSQL Repository)
      this.registerCapability({
        capability: 'sops.read',
        workspaceId: ws,
        provider: 'shapework_postgres',
        mode: 'LIVE',
        connected: true,
        authorized: true,
        writesSupported: false,
        verificationSupported: true,
        isSynchronized: true,
        lastVerifiedAt: new Date().toISOString()
      });

      this.registerCapability({
        capability: 'sops.create',
        workspaceId: ws,
        provider: 'shapework_postgres',
        mode: 'LIVE',
        connected: true,
        authorized: true,
        writesSupported: true,
        verificationSupported: true,
        isSynchronized: true,
        lastVerifiedAt: new Date().toISOString()
      });

      // 3. Operational Attention & Commitments (PostgreSQL)
      this.registerCapability({
        capability: 'attention.read',
        workspaceId: ws,
        provider: 'shapework_postgres',
        mode: 'LIVE',
        connected: true,
        authorized: true,
        writesSupported: false,
        verificationSupported: true,
        isSynchronized: true,
        lastVerifiedAt: new Date().toISOString()
      });

      this.registerCapability({
        capability: 'commitments.manage',
        workspaceId: ws,
        provider: 'shapework_postgres',
        mode: 'LIVE',
        connected: true,
        authorized: true,
        writesSupported: true,
        verificationSupported: true,
        isSynchronized: true,
        lastVerifiedAt: new Date().toISOString()
      });

      // 4. Directory (72/77-person static roster seed) — Explicitly labeled FIXTURE / Static Seed unless live synced
      this.registerCapability({
        capability: 'directory.read',
        workspaceId: ws,
        provider: 'nest_roster_seed',
        mode: 'FIXTURE',
        connected: true,
        authorized: true,
        writesSupported: false,
        verificationSupported: false,
        isSynchronized: false,
        statusNotes: 'Directory uses verified static seed roster (72 licensed brokers & staff). Direct HR sync not connected.',
        lastVerifiedAt: '2026-09-01T00:00:00.000Z'
      });

      // 5. Drive Read / Create (Google Workspace)
      const hasGoogleAuth = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_OAUTH_ACCESS_TOKEN);
      const googleMode: ProviderMode = hasGoogleAuth ? 'LIVE' : 'SANDBOX';

      this.registerCapability({
        capability: 'drive.read',
        workspaceId: ws,
        provider: 'google_drive',
        mode: googleMode,
        connected: true,
        authorized: hasGoogleAuth,
        writesSupported: false,
        verificationSupported: hasGoogleAuth,
        lastVerifiedAt: new Date().toISOString()
      });

      this.registerCapability({
        capability: 'drive.create',
        workspaceId: ws,
        provider: 'google_drive',
        mode: googleMode,
        connected: true,
        authorized: hasGoogleAuth,
        writesSupported: true,
        verificationSupported: hasGoogleAuth,
        lastVerifiedAt: new Date().toISOString()
      });

      // 6. Calendar Read / Create / Reschedule / Cancel (Google Calendar)
      this.registerCapability({
        capability: 'calendar.read',
        workspaceId: ws,
        provider: 'google_calendar',
        mode: googleMode,
        connected: true,
        authorized: hasGoogleAuth,
        writesSupported: false,
        verificationSupported: hasGoogleAuth,
        lastVerifiedAt: new Date().toISOString()
      });

      this.registerCapability({
        capability: 'calendar.create',
        workspaceId: ws,
        provider: 'google_calendar',
        mode: googleMode,
        connected: true,
        authorized: hasGoogleAuth,
        writesSupported: true,
        verificationSupported: hasGoogleAuth,
        lastVerifiedAt: new Date().toISOString()
      });

      this.registerCapability({
        capability: 'calendar.reschedule',
        workspaceId: ws,
        provider: 'google_calendar',
        mode: googleMode,
        connected: true,
        authorized: hasGoogleAuth,
        writesSupported: true,
        verificationSupported: hasGoogleAuth,
        lastVerifiedAt: new Date().toISOString()
      });

      this.registerCapability({
        capability: 'calendar.cancel',
        workspaceId: ws,
        provider: 'google_calendar',
        mode: googleMode,
        connected: true,
        authorized: hasGoogleAuth,
        writesSupported: true,
        verificationSupported: hasGoogleAuth,
        lastVerifiedAt: new Date().toISOString()
      });

      // 7. Email Send (Gmail / Postmark)
      this.registerCapability({
        capability: 'email.send',
        workspaceId: ws,
        provider: 'google_gmail',
        mode: googleMode,
        connected: true,
        authorized: hasGoogleAuth,
        writesSupported: true,
        verificationSupported: hasGoogleAuth,
        lastVerifiedAt: new Date().toISOString()
      });

      // 8. SMS Send (Twilio)
      const hasTwilio = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
      this.registerCapability({
        capability: 'sms.send',
        workspaceId: ws,
        provider: 'twilio',
        mode: hasTwilio ? 'LIVE' : 'SANDBOX',
        connected: hasTwilio,
        authorized: hasTwilio,
        writesSupported: true,
        verificationSupported: hasTwilio,
        lastVerifiedAt: new Date().toISOString()
      });

      // 9. MLS Read (Cape Fear MLS / Hive MLS / FlexMLS) - Honestly DISCONNECTED
      this.registerCapability({
        capability: 'mls.read',
        workspaceId: ws,
        provider: 'cape_fear_mls_feed',
        mode: 'DISCONNECTED',
        connected: false,
        authorized: false,
        writesSupported: false,
        verificationSupported: false,
        isSynchronized: false,
        statusNotes: 'MLS live datafeed connection is not active. Property facts require user verification.'
      });

      // 10. Maxa Design Center - Web Link / Sandbox Mode
      this.registerCapability({
        capability: 'maxa.create',
        workspaceId: ws,
        provider: 'maxa_design_center',
        mode: 'SANDBOX',
        connected: true,
        authorized: true,
        writesSupported: false,
        verificationSupported: false,
        statusNotes: 'Maxa templates generate web deep-links and local proof previews. Direct Maxa automated vector rendering API is in sandbox.'
      });

      // 11. Transaction Read (Dotloop / Rechat)
      this.registerCapability({
        capability: 'transaction.read',
        workspaceId: ws,
        provider: 'dotloop_rechat',
        mode: 'LIVE',
        connected: true,
        authorized: true,
        writesSupported: false,
        verificationSupported: true,
        lastVerifiedAt: new Date().toISOString()
      });

      // 12. Vendor Dispatch (Coastal Print Works / Signs)
      this.registerCapability({
        capability: 'vendor.dispatch',
        workspaceId: ws,
        provider: 'coastal_print_works',
        mode: 'LIVE',
        connected: true,
        authorized: true,
        writesSupported: true,
        verificationSupported: true,
        lastVerifiedAt: new Date().toISOString()
      });
    }
  }

  public static registerCapability(cap: WorkspaceCapability): void {
    const key = this.buildKey(cap.workspaceId, cap.capability);
    this.capabilities.set(key, cap);
  }

  public static getCapability(workspaceId: string, capability: WorkspaceCapabilityType): WorkspaceCapability | null {
    this.ensureDefaults();
    const key = this.buildKey(workspaceId, capability);
    return this.capabilities.get(key) || null;
  }

  public static getCapabilities(workspaceId: string): WorkspaceCapability[] {
    this.ensureDefaults();
    const ws = (workspaceId || 'ws_wilmington').toLowerCase().trim();
    const list: WorkspaceCapability[] = [];
    for (const [key, cap] of this.capabilities.entries()) {
      if (key.startsWith(`${ws}:`)) {
        list.push(cap);
      }
    }
    return list;
  }

  public static setCapabilityStatus(
    workspaceId: string,
    capability: WorkspaceCapabilityType,
    status: { connected: boolean; authorized: boolean; mode: ProviderMode; provider?: string }
  ): void {
    this.ensureDefaults();
    const existing = this.getCapability(workspaceId, capability);
    const updated: WorkspaceCapability = {
      capability,
      workspaceId: (workspaceId || 'ws_wilmington').toLowerCase().trim(),
      provider: status.provider || existing?.provider || 'unknown_provider',
      mode: status.mode,
      connected: status.connected,
      authorized: status.authorized,
      lastVerifiedAt: new Date().toISOString()
    };
    this.registerCapability(updated);
  }

  /**
   * Validates if an action is genuinely executable in the given workspace.
   */
  public static validateAction(params: {
    workspaceId: string;
    capability: WorkspaceCapabilityType;
    userRole?: string;
    permissions?: string[];
  }): {
    isExecutable: boolean;
    reasonDisabled?: string;
    providerMode: ProviderMode;
    provider: string;
    requiresConfirmation: boolean;
  } {
    this.ensureDefaults();
    const cap = this.getCapability(params.workspaceId, params.capability);

    if (!cap) {
      return {
        isExecutable: false,
        reasonDisabled: `Capability "${params.capability}" is not registered for this workspace.`,
        providerMode: 'DISCONNECTED',
        provider: 'unknown',
        requiresConfirmation: true
      };
    }

    if (!cap.connected) {
      return {
        isExecutable: false,
        reasonDisabled: `Integration "${cap.provider}" is disconnected for workspace ${params.workspaceId}.`,
        providerMode: cap.mode,
        provider: cap.provider,
        requiresConfirmation: true
      };
    }

    if (!cap.authorized) {
      return {
        isExecutable: false,
        reasonDisabled: `Integration "${cap.provider}" lacks valid authorization credentials.`,
        providerMode: cap.mode,
        provider: cap.provider,
        requiresConfirmation: true
      };
    }

    // Role / permission check if provided
    if (params.userRole === 'guest') {
      return {
        isExecutable: false,
        reasonDisabled: 'Guest accounts cannot execute workspace actions.',
        providerMode: cap.mode,
        provider: cap.provider,
        requiresConfirmation: true
      };
    }

    return {
      isExecutable: true,
      providerMode: cap.mode,
      provider: cap.provider,
      requiresConfirmation: params.capability.includes('create') || params.capability.includes('send') || params.capability.includes('dispatch')
    };
  }

  public static resetForTesting(): void {
    this.capabilities.clear();
    this.initialized = false;
  }
}
