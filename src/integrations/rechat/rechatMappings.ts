/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShapeworkRechatDeal, ShapeworkRechatContact, ShapeworkRechatTask } from './rechatTypes';

/**
 * Mask email to prevent PII exposure in the UI:
 * alex@example.com -> a***@example.com
 */
export function maskEmail(email: string | undefined | null): string {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const username = parts[0];
  const domain = parts[1];
  if (username.length <= 1) {
    return `${username}***@${domain}`;
  }
  return `${username[0]}***@${domain}`;
}

/**
 * Mask phone number to prevent PII exposure in the UI:
 * +1 555 123 4567 -> +1 *** *** 4567
 */
export function maskPhone(phone: string | undefined | null): string {
  if (!phone) return '';
  const cleaned = phone.trim();
  if (cleaned.length < 5) return '***';
  const lastFour = cleaned.slice(-4);
  const prefix = cleaned.length > 7 ? cleaned.slice(0, cleaned.length - 8) : '';
  return `${prefix ? prefix + ' ' : ''}*** *** ${lastFour}`;
}

/**
 * Normalizes a raw Rechat Deal record into the ShapeworkRechatDeal schema.
 */
export function normalizeRechatDeal(rawDeal: any): ShapeworkRechatDeal {
  const rechatId = rawDeal.id || String(rawDeal.rechatId || '');
  const title = rawDeal.title || rawDeal.deal_name || 'Untitled Deal';
  
  // Extract roles and mask PII
  const rawRoles = rawDeal.roles || [];
  const roles = rawRoles.map((r: any) => ({
    role: r.role || 'Client',
    name: r.name || r.legal_first_name ? `${r.legal_first_name} ${r.legal_last_name || ''}`.trim() : undefined,
    emailMasked: r.email ? maskEmail(r.email) : undefined,
    phoneMasked: r.phone_number ? maskPhone(r.phone_number) : undefined,
    rechatUserId: r.user ? String(r.user.id || r.user) : undefined
  }));

  const context = rawDeal.context || {};
  
  // Detect fields that might be missing
  const deal: ShapeworkRechatDeal = {
    source: 'rechat',
    rechatId,
    title,
    dealType: rawDeal.deal_type,
    listingId: rawDeal.listing,
    brandId: rawDeal.brand,
    stage: rawDeal.stage,
    status: rawDeal.status,
    propertyAddress: rawDeal.property_address || context.property_address || undefined,
    closingDate: rawDeal.closing_date || context.closing_date || undefined,
    contractDate: rawDeal.contract_date || context.contract_date || undefined,
    listPrice: rawDeal.list_price || context.list_price || undefined,
    salesPrice: rawDeal.sales_price || context.sales_price || undefined,
    roles,
    context,
    missingFields: [],
    lastSyncedAt: new Date().toISOString()
  };

  deal.missingFields = detectDealGaps(deal);
  return deal;
}

/**
 * Detects gaps in Rechat Deal records to power guards (e.g. Deal Intake Guard).
 */
export function detectDealGaps(deal: ShapeworkRechatDeal): string[] {
  const gaps: string[] = [];
  
  // 1. Missing intake form
  if (!deal.context?.intakeFormCompleted && !deal.context?.intake_form) {
    gaps.push('missing intake form');
  }
  // 2. Missing coordinator
  const hasCoordinator = deal.roles?.some(r => 
    r.role?.toLowerCase().includes('coordinator') || 
    r.role?.toLowerCase().includes('agent')
  );
  if (!hasCoordinator) {
    gaps.push('missing coordinator');
  }
  // 3. Missing closing date
  if (!deal.closingDate) {
    gaps.push('missing closing date');
  }
  // 4. Missing compliance checklist
  if (!deal.context?.complianceChecklistId && !deal.context?.checklist) {
    gaps.push('missing compliance checklist');
  }
  // 5. Missing commission details
  if (!deal.context?.commissionDetails && !deal.context?.commission) {
    gaps.push('missing commission details');
  }
  // 6. Missing transaction file
  if (!deal.context?.transactionFileId && !deal.context?.file) {
    gaps.push('missing transaction file');
  }

  return gaps;
}

/**
 * Normalizes a raw Rechat Contact into ShapeworkRechatContact.
 */
export function normalizeRechatContact(rawContact: any): ShapeworkRechatContact {
  const rechatId = rawContact.id || String(rawContact.rechatId || '');
  const displayName = rawContact.display_name || 
    (rawContact.first_name ? `${rawContact.first_name} ${rawContact.last_name || ''}`.trim() : 'Unknown Contact');
  
  return {
    source: 'rechat',
    rechatId,
    displayName,
    emailMasked: rawContact.email ? maskEmail(rawContact.email) : undefined,
    phoneMasked: rawContact.phone_number || rawContact.phone ? maskPhone(rawContact.phone_number || rawContact.phone) : undefined,
    ownerId: rawContact.user ? String(rawContact.user) : undefined,
    tags: rawContact.tags || [],
    lastSyncedAt: new Date().toISOString()
  };
}

/**
 * Normalizes a raw Rechat Task into ShapeworkRechatTask.
 */
export function normalizeRechatTask(rawTask: any): ShapeworkRechatTask {
  const rechatId = rawTask.id || String(rawTask.rechatId || '');
  const title = rawTask.title || 'Untitled CRM Task';
  
  let status: 'PENDING' | 'DONE' | 'unknown' = 'unknown';
  if (rawTask.status === 'PENDING' || rawTask.status === 'DONE') {
    status = rawTask.status;
  } else if (rawTask.status === 'completed' || rawTask.completed) {
    status = 'DONE';
  } else if (rawTask.status === 'pending' || !rawTask.completed) {
    status = 'PENDING';
  }

  const assigneeIds = rawTask.assignees ? rawTask.assignees.map((a: any) => String(a.id || a)) : [];

  return {
    source: 'rechat',
    rechatId,
    title,
    description: rawTask.description || rawTask.text || undefined,
    status,
    taskType: rawTask.task_type || rawTask.type || 'Todo',
    dueDate: rawTask.due_date || rawTask.due || undefined,
    assigneeIds,
    associatedDealId: rawTask.deal ? String(rawTask.deal) : undefined,
    associatedContactId: rawTask.contact ? String(rawTask.contact) : undefined,
    associatedListingId: rawTask.listing ? String(rawTask.listing) : undefined,
    lastSyncedAt: new Date().toISOString()
  };
}
