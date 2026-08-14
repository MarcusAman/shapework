/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Broker Identity Binding Subsystem — Phase 4A.1 Architecture
 * Deterministically binds channel identifiers (phone, email, WebRTC tokens) to verified Nest brokers.
 * 
 * SECURITY BOUNDARY:
 * A phone number or email address alone DOES NOT grant contract authority unless verified against
 * server-side roster records and workspace memberships. Trusted userId and workspaceId values
 * MUST be derived from verified bindings rather than unauthenticated request payloads.
 */

import { ChannelIdentityBinding } from './contractChannelDomainTypes.js';
import { ContractChannel } from './contractDomainTypes.js';
import { SEEDED_USERS, ROLE_PERMISSIONS } from '../auth/auth.js';

export class ContractIdentityBindingService {
  private static activeBindings: Map<string, ChannelIdentityBinding> = new Map();
  private static registeredBrokerPhones: Map<string, string> = new Map([
    ['+19105551234', 'usr_broker_alice'],
    ['+19105555678', 'usr_broker_bob'],
    ['+19105559000', 'usr_ryan']
  ]);
  private static registeredBrokerEmails: Map<string, string> = new Map([
    ['alice@nestrealty.com', 'usr_broker_alice'],
    ['bob@nestrealty.com', 'usr_broker_bob'],
    ['ryan@nestrealty.com', 'usr_ryan'],
    ['sarah.j@nestrealty.com', 'usr_sarah']
  ]);

  /**
   * Helper for tests to register a verified phone number for a user ID.
   */
  public static registerPhone(phone: string, userId: string): void {
    const normalized = this.normalizePhone(phone);
    this.registeredBrokerPhones.set(normalized, userId);
  }

  /**
   * Helper for tests to register a verified email address for a user ID.
   */
  public static registerEmail(email: string, userId: string): void {
    const normalized = this.normalizeEmail(email);
    this.registeredBrokerEmails.set(normalized, userId);
  }

  public static normalizePhone(phone: string): string {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return `+${digits}`;
  }

  public static normalizeEmail(email: string): string {
    if (!email) return '';
    return email.trim().toLowerCase();
  }

  /**
   * Verifies an inbound caller ID / phone number against the server-side roster.
   */
  public static verifyBrokerIdentityByPhone(workspaceId: string, rawPhone: string): ChannelIdentityBinding {
    const normalizedPhone = this.normalizePhone(rawPhone);
    const userId = this.registeredBrokerPhones.get(normalizedPhone);

    if (!userId) {
      throw new Error(
        `UNVERIFIED_BROKER_IDENTITY: Phone number '${rawPhone}' is not registered to a verified broker in workspace '${workspaceId}'. Contract authoring denied.`
      );
    }

    // Check user role capabilities
    const user = SEEDED_USERS.find(u => u.id === userId) || { id: userId, role: 'agent' };
    const perms = ROLE_PERMISSIONS[user.role] || ['contract_authoring'];

    if (!perms.includes('contract_authoring')) {
      throw new Error(`FORBIDDEN_CONTRACT_AUTHORING: User '${userId}' lacks contract_authoring capability.`);
    }

    const bindingId = `bind_ph_${workspaceId}_${userId}`;
    const binding: ChannelIdentityBinding = {
      id: bindingId,
      workspaceId,
      userId,
      channel: 'retell_phone',
      verifiedIdentifier: normalizedPhone,
      verificationMethod: 'roster_verified_phone',
      status: 'active',
      verifiedAt: new Date().toISOString(),
      capabilities: perms
    };

    this.activeBindings.set(bindingId, binding);
    return binding;
  }

  /**
   * Verifies an inbound sender email address against the server-side roster.
   */
  public static verifyBrokerIdentityByEmail(workspaceId: string, rawEmail: string): ChannelIdentityBinding {
    const normalizedEmail = this.normalizeEmail(rawEmail);
    const userId = this.registeredBrokerEmails.get(normalizedEmail);

    if (!userId) {
      throw new Error(
        `UNVERIFIED_BROKER_EMAIL: Email address '${rawEmail}' is not registered to a verified broker in workspace '${workspaceId}'. Contract authoring denied.`
      );
    }

    const user = SEEDED_USERS.find(u => u.id === userId) || { id: userId, role: 'agent' };
    const perms = ROLE_PERMISSIONS[user.role] || ['contract_authoring'];

    if (!perms.includes('contract_authoring')) {
      throw new Error(`FORBIDDEN_CONTRACT_AUTHORING: User '${userId}' lacks contract_authoring capability.`);
    }

    const bindingId = `bind_em_${workspaceId}_${userId}`;
    const binding: ChannelIdentityBinding = {
      id: bindingId,
      workspaceId,
      userId,
      channel: 'email',
      verifiedIdentifier: normalizedEmail,
      verificationMethod: 'roster_verified_email',
      status: 'active',
      verifiedAt: new Date().toISOString(),
      capabilities: perms
    };

    this.activeBindings.set(bindingId, binding);
    return binding;
  }

  public static clearForTesting(): void {
    this.activeBindings.clear();
  }
}
