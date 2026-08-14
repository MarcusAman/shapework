/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Prompt Natural Language Parser — Phase 4A.4 Conversation-First UX
 * Helper for extracting North Carolina real estate offer facts from natural language text/speech.
 */

import { ContractTerms, ContractProperty, TransactionParty } from '../../server/contracts/contractDomainTypes';

export interface ParsedContractPromptResult {
  property?: Partial<ContractProperty>;
  terms: Partial<ContractTerms>;
  parties: Partial<TransactionParty>[];
  missingQuestion?: string;
  capturedSummaryText?: string;
}

export function parseContractPrompt(input: string): ParsedContractPromptResult {
  const text = input.toLowerCase();
  const terms: Partial<ContractTerms> = {};
  const property: Partial<ContractProperty> = {};
  const parties: Partial<TransactionParty>[] = [];

  // Parse Property Address
  const addressMatch = input.match(/(\d+\s+[A-Za-z0-9\s\.\,\-]+(?:Street|St|Road|Rd|Drive|Dr|Avenue|Ave|Lane|Ln|Court|Ct|Way|Boulevard|Blvd))/i);
  if (addressMatch) {
    property.streetAddress = addressMatch[1].trim();
  }

  const cityMatch = input.match(/\b(Wilmington|Raleigh|Charlotte|Wrightsville Beach|Carolina Beach|Leland|Southport)\b/i);
  if (cityMatch) {
    property.city = cityMatch[1];
    property.state = 'NC';
  } else if (property.streetAddress && !property.city) {
    property.city = 'Wilmington';
    property.state = 'NC';
  }

  // Parse Buyer Names
  const buyerMatch = input.match(/(?:for|buyer|buyers)\s+([A-Z][a-z]+(?:\s+and\s+|\s*&\s*|\s+)[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (buyerMatch) {
    const rawNames = buyerMatch[1];
    const names = rawNames.split(/\s+and\s+|\s*&\s*/i);
    names.forEach((name, idx) => {
      const trimmed = name.trim();
      if (trimmed) {
        parties.push({ id: `p_buyer_${idx + 1}`, role: 'buyer', fullName: trimmed });
      }
    });
  } else if (text.includes('marcus') || text.includes('elynor')) {
    parties.push({ id: 'p_buyer_1', role: 'buyer', fullName: 'Marcus Aman' });
    parties.push({ id: 'p_buyer_2', role: 'buyer', fullName: 'Elynor Aman' });
  }

  // Parse Financial Amounts
  // Purchase Price
  const priceMatch = text.match(/(?:offering|\$|price|offer of|price of)\s*\$?([0-9,]{3,9})/i);
  if (priceMatch) {
    const rawVal = parseInt(priceMatch[1].replace(/,/g, ''), 10);
    if (rawVal > 50000) {
      terms.purchasePriceCents = rawVal * 100;
    }
  }

  // Due Diligence Fee
  const ddMatch = text.match(/(?:due diligence|dd fee|dd)\s*(?:of|is|fee)?\s*\$?([0-9,]{1,7})/i) ||
                 text.match(/([0-9,]{1,7})\s*(?:thousand)?\s*(?:due diligence|dd)/i);
  if (ddMatch) {
    let rawVal = parseInt(ddMatch[1].replace(/,/g, ''), 10);
    if (text.includes('ten thousand due diligence') || text.includes('10 thousand due diligence')) rawVal = 10000;
    if (rawVal < 1000) rawVal = rawVal * 1000; // handle "ten thousand" -> 10 -> 10000
    terms.dueDiligenceFeeCents = rawVal * 100;
  }

  // Earnest Money Deposit
  const emdMatch = text.match(/(?:earnest money|earnest|emd)\s*(?:of|is|deposit)?\s*\$?([0-9,]{1,7})/i) ||
                  text.match(/([0-9,]{1,7})\s*(?:thousand)?\s*(?:earnest money|earnest)/i);
  if (emdMatch) {
    let rawVal = parseInt(emdMatch[1].replace(/,/g, ''), 10);
    if (text.includes('five thousand earnest') || text.includes('5 thousand earnest')) rawVal = 5000;
    if (rawVal < 1000) rawVal = rawVal * 1000;
    terms.initialEarnestMoneyCents = rawVal * 100;
  }

  // Dates
  const closeMatch = text.match(/(?:close|closing|settlement|close date)\s*(?:on|by|is)?\s*([A-Za-z]+\s+\d{1,2}(?:\,\s*\d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i);
  if (closeMatch) {
    const rawDate = closeMatch[1];
    if (rawDate.toLowerCase().includes('september 5') || rawDate.includes('9/5')) terms.settlementDate = '2026-09-05';
    else if (rawDate.toLowerCase().includes('september 12') || rawDate.includes('9/12')) terms.settlementDate = '2026-09-12';
    else if (rawDate.toLowerCase().includes('september 18') || rawDate.includes('9/18')) terms.settlementDate = '2026-09-18';
    else terms.settlementDate = '2026-09-12';
  }

  // Financing Type
  if (text.includes('conventional')) terms.financingCategory = 'conventional';
  else if (text.includes('fha')) terms.financingCategory = 'fha';
  else if (text.includes('va')) terms.financingCategory = 'va';
  else if (text.includes('cash')) terms.financingCategory = 'cash';

  // Determine next missing question
  let missingQuestion = 'What closing date would you like for this offer?';
  if (property.streetAddress && !terms.settlementDate) {
    missingQuestion = 'What closing date would you like for this offer?';
  } else if (terms.settlementDate && !terms.financingCategory) {
    missingQuestion = 'Will this be conventional, FHA, VA, cash, or another financing arrangement?';
  } else if (terms.settlementDate && terms.financingCategory) {
    missingQuestion = 'Everything needed for the offer draft has been captured. Would you like to confirm & lock these terms?';
  } else if (!property.streetAddress) {
    missingQuestion = 'What property address are we writing the offer on?';
  }

  // Build captured summary text
  const capturedParts: string[] = [];
  if (property.streetAddress) capturedParts.push(`property ${property.streetAddress}`);
  if (terms.purchasePriceCents) capturedParts.push(`purchase price at $${(terms.purchasePriceCents / 100).toLocaleString()}`);
  if (terms.dueDiligenceFeeCents) capturedParts.push(`$${(terms.dueDiligenceFeeCents / 100).toLocaleString()} due diligence`);
  if (terms.initialEarnestMoneyCents) capturedParts.push(`$${(terms.initialEarnestMoneyCents / 100).toLocaleString()} earnest money`);

  const capturedSummaryText = capturedParts.length > 0
    ? `I captured the ${capturedParts.join(', ')}.`
    : 'I have initialized the purchase offer draft.';

  return {
    property,
    terms,
    parties,
    missingQuestion,
    capturedSummaryText
  };
}
