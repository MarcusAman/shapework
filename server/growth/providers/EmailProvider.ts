/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DomainSetup {
  id: string;
  domain: string;
  spfRecord: string;
  dkimRecord: string;
  dmarcRecord: string;
  status: 'pending' | 'verified';
}

export interface DomainStatus {
  id: string;
  status: 'pending' | 'verified';
}

export interface EmailPayload {
  to: string;
  from: string;
  subject: string;
  body: string;
  campaignId?: string;
  enrollmentId?: string;
  stepId?: string;
  headers?: Record<string, string>;
}

export interface SendResult {
  messageId: string;
  status: 'sent' | 'failed';
}

export interface BatchSendResult {
  results: SendResult[];
}

export interface ContactPayload {
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface ContactResult {
  id: string;
}

export interface EmailProvider {
  createDomain(domain: string): Promise<DomainSetup>;
  verifyDomain(domainId: string): Promise<DomainStatus>;
  sendEmail(payload: EmailPayload): Promise<SendResult>;
  sendBatch(payloads: EmailPayload[]): Promise<BatchSendResult>;
  createContact(contact: ContactPayload): Promise<ContactResult>;
  suppressContact(email: string): Promise<void>;
  verifyWebhookSignature(headers: Record<string, string>, rawBody: string, webhookSecret: string): boolean;
  parseWebhookEvent(body: any): any;
}
