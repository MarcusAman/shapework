/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Follow-Up Decision Engine
 * Deterministically evaluates whether a conversation outcome warrants an automated follow-up email.
 * Prevents spamming agents for trivial lookups while ensuring high-value resources and action confirmations arrive promptly.
 */

import { 
  NoraFollowUpDecision, 
  NoraFollowUpType, 
  NoraAgentIdentity, 
  NoraCallerIdentity, 
  NoraKnowledgeItem, 
  NoraSopItem 
} from './noraOutcomeTypes.js';

export interface DecisionEvaluationInput {
  conversationId: string;
  transcript: string;
  query?: string;
  intent?: string;
  agentIdentity: NoraAgentIdentity;
  callerIdentity: NoraCallerIdentity;
  knowledgeUsed?: NoraKnowledgeItem[];
  sopsUsed?: NoraSopItem[];
  requestsCreated?: Array<{ requestId: string; type: string; assignedTo: string; summary: string }>;
  isSupplyDeduplicated?: boolean;
}

export class NoraFollowUpDecisionEngine {
  /**
   * Evaluates if a conversation warrants an automated follow-up email.
   */
  public static evaluateFollowUp(input: DecisionEvaluationInput): NoraFollowUpDecision {
    const text = `${input.query || ''} ${input.transcript || ''}`.toLowerCase();
    const conversationId = input.conversationId || `conv_${Date.now()}`;

    // 1. Unverified Caller Gate: Never email an unverified identity
    if (input.agentIdentity.status !== 'verified' || !input.agentIdentity.email) {
      return {
        recommended: false,
        reason: 'Unverified caller identity; follow-up email suppressed for security.',
        followUpType: 'NONE',
        idempotencyKey: `${conversationId}_NONE`
      };
    }

    // 2. Trivial Single-Fact Lookups Gate: Office phone, office address, simple hours, greetings
    if (this.isTrivialInquiry(text)) {
      return {
        recommended: false,
        reason: 'Trivial single-fact inquiry resolved on call; follow-up email suppressed.',
        followUpType: 'NONE',
        idempotencyKey: `${conversationId}_NONE`
      };
    }

    // 3. Operational Request Confirmation Gate: Request/ticket created
    if (input.requestsCreated && input.requestsCreated.length > 0) {
      return {
        recommended: true,
        reason: 'Operational request created; confirmation and tracking sent to agent.',
        followUpType: 'REQUEST_CONFIRMATION',
        idempotencyKey: `${conversationId}_REQUEST_CONFIRMATION`
      };
    }

    // 4. Escalation Notice Gate: Unverified policy or unanswered operational question
    if (this.isEscalationQuery(text, input.knowledgeUsed)) {
      return {
        recommended: true,
        reason: 'Operational inquiry contains unverified policy or escalation to brokerage leadership.',
        followUpType: 'ESCALATION_NOTICE',
        idempotencyKey: `${conversationId}_ESCALATION_NOTICE`
      };
    }

    // 5. Substantive SOP / Process Protocol Gate: Sign posts, CDA, contract checklists, compliance
    if (this.isSopQuery(text, input.sopsUsed)) {
      return {
        recommended: true,
        reason: 'Brokerage operating procedure and vendor instructions provided.',
        followUpType: 'SOP_INSTRUCTIONS',
        idempotencyKey: `${conversationId}_SOP_INSTRUCTIONS`
      };
    }

    // 6. Substantive Knowledge & Resource Guidance Gate: Branding, FON, Rechat, Marketing, Farming
    if (this.isSubstantiveKnowledgeQuery(text, input.knowledgeUsed)) {
      return {
        recommended: true,
        reason: 'Substantive brand standards, program guidelines, or technology resources provided.',
        followUpType: 'KNOWLEDGE_RESOURCES',
        idempotencyKey: `${conversationId}_KNOWLEDGE_RESOURCES`
      };
    }

    // Default fallback: Suppress if no material value
    return {
      recommended: false,
      reason: 'General conversational inquiry resolved on call without external resources or action items.',
      followUpType: 'NONE',
      idempotencyKey: `${conversationId}_NONE`
    };
  }

  /**
   * Identifies trivial single-fact questions where an email would be annoying.
   */
  private static isTrivialInquiry(text: string): boolean {
    const isPhoneQuery = /(?:phone number|office phone|what(?:'s| is) (?:the )?(?:wilmington|mayfaire|downtown|carolina beach)? ?office phone|what is your number)/i.test(text);
    const isAddressQuery = /(?:office address|where is the (?:wilmington|mayfaire|downtown)? ?office|what is the address of the office)/i.test(text);
    const isHoursQuery = /(?:office hours|what time does the office (?:open|close)|are you open today)/i.test(text);
    const isCasualGreeting = /^(?:hello|hi|hey|test|testing|can you hear me)\b/i.test(text.trim()) && text.trim().split(/\s+/).length < 6;

    // Must NOT have action words like "order", "help with", "branding", "rechat", "sign", "agreement"
    const hasSubstantiveIntent = /(?:brand|font|logo|guideline|sign|rider|post|rechat|cma|agreement|compensation|policy|farm|fon|friends of nest|suppl|flyer|marketing|listing)/i.test(text);

    if ((isPhoneQuery || isAddressQuery || isHoursQuery || isCasualGreeting) && !hasSubstantiveIntent) {
      return true;
    }

    return false;
  }

  /**
   * Detects queries requiring an escalation notice.
   */
  private static isEscalationQuery(text: string, knowledgeUsed?: NoraKnowledgeItem[]): boolean {
    if (knowledgeUsed && knowledgeUsed.some(k => k.verificationStatus === 'UNVERIFIED' || k.verificationStatus === 'CONFLICTING')) {
      return true;
    }
    return /(?:escalat|don't know|not documented|confirm with bic|check with ryan|ask ryan|ask ann|unverified)/i.test(text);
  }

  /**
   * Detects operational SOP queries (e.g. sign posts, riders, CDA approvals).
   */
  private static isSopQuery(text: string, sopsUsed?: NoraSopItem[]): boolean {
    if (sopsUsed && sopsUsed.length > 0) return true;
    return /(?:sign post|sign rider|yard post|coastal sign|nc811|cda|commission disbursement|form 2-t|buyer broker agreement|compensation policy|closing checklist)/i.test(text);
  }

  /**
   * Detects substantive knowledge queries (e.g. branding, FON, Rechat setup).
   */
  private static isSubstantiveKnowledgeQuery(text: string, knowledgeUsed?: NoraKnowledgeItem[]): boolean {
    if (knowledgeUsed && knowledgeUsed.length > 0) return true;
    return /(?:brand|font|logo|elza|larken|videograph|photograph|watermark|friends of nest|fon|50 mailer|greeting card|farming|elevated farming|rechat|maxa|design center|showingtime|zillow showcase|luxury presence|homestack|buyer guide|seller advantage)/i.test(text);
  }
}
