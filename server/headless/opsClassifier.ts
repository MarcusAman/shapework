import { OpsRequest } from './opsBlueprintTypes';

export interface RouteAssignment {
  category: OpsRequest['category'];
  assignedRole: string;
  assignedOwner: string;
  slaDays: number;
}

/**
 * Deterministic keyword-based AI Classifier
 */
export function classifyRequest(title: string, description: string): RouteAssignment {
  const safeTitle = (title || '').toString().toLowerCase();
  const safeDesc = (description || '').toString().toLowerCase();
  const text = `${safeTitle} ${safeDesc}`;

  // 1. Ryan / Leadership
  // policy, cost, sensitive, complaint, leadership decision, audit review
  if (
    text.includes('policy') || 
    text.includes('cost') || 
    text.includes('sensitive') || 
    text.includes('complaint') || 
    text.includes('leadership') || 
    text.includes('audit review')
  ) {
    return {
      category: 'leadership_decision',
      assignedRole: 'regional_leader',
      assignedOwner: 'Ryan',
      slaDays: 1
    };
  }

  // 2. BIC / Compliance
  // contract, compliance, license, CE, disclosure, transaction, broker, agent question
  if (
    text.includes('contract') || 
    text.includes('compliance') || 
    text.includes('license') || 
    text.includes('ce reminder') || 
    text.includes('ce hours') ||
    text.includes('disclosure') || 
    text.includes('transaction issue') || 
    text.includes('dispute') ||
    text.includes('bic question') ||
    text.includes('broker-in-charge')
  ) {
    return {
      category: 'compliance',
      assignedRole: 'bic',
      assignedOwner: 'BIC Demo User',
      slaDays: 1 // compliance is usually high priority
    };
  }

  // 3. James / Accounting
  // commission, payment, bill, receipt, check, tax, deposit, trust, payables, bills, invoices
  if (
    text.includes('commission') || 
    text.includes('payment') || 
    text.includes('payables') ||
    text.includes('invoice') ||
    text.includes('bill') || 
    text.includes('receipt') || 
    text.includes('check') || 
    text.includes('tax') || 
    text.includes('deposit') || 
    text.includes('trust account') ||
    text.includes('accounting')
  ) {
    return {
      category: 'accounting_commissions',
      assignedRole: 'accounting_manager',
      assignedOwner: 'James',
      slaDays: 2
    };
  }

  // 4. Melissa / Marketing
  // marketing, listing, social, branding, business card, flyer, open house, video, rider
  if (
    text.includes('marketing') || 
    text.includes('social') || 
    text.includes('branding') || 
    text.includes('business card') || 
    text.includes('flyer') || 
    text.includes('open house promotion') || 
    text.includes('video design') || 
    text.includes('postcard') ||
    text.includes('listing campaign')
  ) {
    return {
      category: 'marketing_request',
      assignedRole: 'marketing_manager',
      assignedOwner: 'Melissa',
      slaDays: 3
    };
  }

  // 5. Ann / Operations
  // office, vendor, room, supplies, maintenance, signs, lockboxes, keys, event logistics, cleaning
  if (
    text.includes('office') || 
    text.includes('vendor') || 
    text.includes('room reservation') || 
    text.includes('conference room') ||
    text.includes('supplies') || 
    text.includes('maintenance') || 
    text.includes('cleaning') || 
    text.includes('sign missing') || 
    text.includes('lockbox') || 
    text.includes('keys set') || 
    text.includes('event logistics')
  ) {
    return {
      category: 'office_supplies',
      assignedRole: 'operations_manager',
      assignedOwner: 'Ann',
      slaDays: 2
    };
  }

  // 6. Unknown / Shapework Triage
  return {
    category: 'unknown_owner',
    assignedRole: 'triage_operator',
    assignedOwner: 'Shapework Triage',
    slaDays: 4
  };
}
export type ClassifierType = typeof classifyRequest;
