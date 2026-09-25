import { renderNoraEmailLayout } from '../../email/noraEmailLayout.js';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Knowledge-Grounded Email Composer
 * Composes natural, colleague-like follow-up emails grounded in verified Nest U and Handbook knowledge.
 * 
 * Epistemic Standards:
 * - Sounds like an attentive coworker ("Earlier we were talking about...").
 * - Strictly filters out OUTDATED, UNVERIFIED, or CONFLICTING claims.
 * - Handles direct agents and "on-behalf-of" represented agents seamlessly.
 * - Generates both clean plain text and responsive HTML.
 */

import { 
  NoraConversationOutcome, 
  NoraKnowledgeItem, 
  NoraSopItem, 
  NoraResourceItem, 
  NoraFollowUpType 
} from './noraOutcomeTypes.js';

export interface ComposedEmailResult {
  subject: string;
  bodyText: string;
  bodyHtml: string;
  recipientEmail: string;
  recipientName: string;
  knowledgeAssertionIds: string[];
  sopCodes: string[];
  resourceUrls: string[];
  warnings: string[];
}

export class NoraEmailComposer {
  /**
   * Composes a follow-up email from a structured Conversation Outcome.
   */
  public static composeFollowUpEmail(outcome: NoraConversationOutcome): ComposedEmailResult | null {
    const { agentIdentity, callerIdentity, followUp } = outcome;
    if (!agentIdentity.email || !followUp.recommended || followUp.followUpType === 'NONE') {
      return null;
    }

    const agentFirstName = agentIdentity.fullName ? agentIdentity.fullName.split(' ')[0] : 'there';
    const isRepresented = callerIdentity.isRepresentingAgent && callerIdentity.name && callerIdentity.name.toLowerCase() !== agentIdentity.fullName.toLowerCase();
    const callerName = callerIdentity.name || 'Your assistant';

    // 1. Knowledge Freshness & Safety Filtering
    const verifiedKnowledge = (outcome.knowledgeUsed || []).filter(k => 
      k.verificationStatus === 'VERIFIED' || k.verificationStatus === 'PARTIALLY_VERIFIED'
    );
    const unverifiedKnowledge = (outcome.knowledgeUsed || []).filter(k => 
      k.verificationStatus === 'UNVERIFIED' || k.verificationStatus === 'CONFLICTING'
    );

    const assertionIds = verifiedKnowledge
      .map(k => k.assertionId)
      .filter((id): id is string => Boolean(id));

    const sopCodes = (outcome.sopsUsed || []).map(s => s.code);
    const resourceUrls = (outcome.resourcesUsed || []).map(r => r.url);
    const warnings = outcome.warnings || [];

    // 2. Select Composition Strategy based on FollowUpType
    let subject = '';
    let openingText = '';
    let stepsText = '';
    let resourcesText = '';
    let warningsText = '';
    let actionConfirmationText = '';
    let closingText = '';

    switch (followUp.followUpType) {
      case 'REQUEST_CONFIRMATION': {
        subject = outcome.goal 
          ? `✓ Update: ${outcome.goal}`
          : `✓ Your request from our conversation`;
        
        openingText = isRepresented
          ? `Hi ${agentFirstName},\n\n${callerName} called earlier on your behalf regarding ${outcome.goal || 'an operational task'}. I submitted the request so our team can take care of it right away.`
          : `Hi ${agentFirstName},\n\nEarlier we spoke about ${outcome.goal || 'an operational task'}. I submitted your request to make sure it's handled promptly.`;

        if (outcome.requestsCreated && outcome.requestsCreated.length > 0) {
          const reqList = outcome.requestsCreated
            .map(r => `• **${r.type}** (Assigned to ${r.assignedTo}): ${r.summary}`)
            .join('\n');
          actionConfirmationText = `**Request Details:**\n${reqList}\n\nYour request is linked to today's conversation and our team is on it.`;
        }
        break;
      }

      case 'ESCALATION_NOTICE': {
        subject = `Follow-up on your question regarding ${outcome.goal || 'Nest policy'}`;
        openingText = isRepresented
          ? `Hi ${agentFirstName},\n\n${callerName} called earlier on your behalf asking about ${outcome.goal || 'an internal procedure'}.`
          : `Hi ${agentFirstName},\n\nEarlier we were talking about ${outcome.goal || 'an internal procedure'}.`;

        const unverifiedTopic = unverifiedKnowledge[0]?.title || outcome.goal || 'this specific policy';
        stepsText = `I checked our internal Nest U documentation and operating handbook, but Nest does not currently publish explicit, verified guidelines for ${unverifiedTopic}. Rather than giving you an unverified answer, I have escalated this question to your Broker-in-Charge and operations leadership so you get an authoritative response.`;
        break;
      }

      case 'SOP_INSTRUCTIONS': {
        subject = outcome.goal 
          ? `Instructions for ${outcome.goal}`
          : `Brokerage procedures from our conversation`;

        openingText = isRepresented
          ? `Hi ${agentFirstName},\n\n${callerName} called earlier on your behalf regarding ${outcome.goal || 'an upcoming brokerage process'}. I put together the verified procedures and vendor instructions so you have them in one place:`
          : `Hi ${agentFirstName},\n\nEarlier we were talking about ${outcome.goal || 'an upcoming brokerage process'}. Here are the verified procedures and instructions we went over:`;

        if (outcome.sopsUsed && outcome.sopsUsed.length > 0) {
          const sopLines = outcome.sopsUsed.map(s => {
            const steps = s.stepsSummary?.map(st => `  1. ${st}`).join('\n') || '';
            return `**${s.title} (${s.code}, Owner: ${s.owner})**\n${steps}`;
          }).join('\n\n');
          stepsText = `${sopLines}`;
        }
        break;
      }

      case 'KNOWLEDGE_RESOURCES':
      default: {
        subject = outcome.goal 
          ? `Nest resources for ${outcome.goal}`
          : `Approved Nest resources from our conversation`;

        openingText = isRepresented
          ? `Hi ${agentFirstName},\n\n${callerName} called earlier on your behalf regarding ${outcome.goal || 'Nest branding and tools'}. Since you're working on this, I put together the approved brand standards and direct links so you have everything in one place:`
          : `Hi ${agentFirstName},\n\nEarlier we were talking about ${outcome.goal || 'Nest branding and tools'}. Since you're working on this, I put together the approved standards and direct resources so you have them in one place:`;

        if (verifiedKnowledge.length > 0) {
          const kLines = verifiedKnowledge.map(k => {
            const caveatStr = k.caveat ? ` *(Note: ${k.caveat})*` : '';
            return `• **${k.title}**: ${k.summary}${caveatStr}`;
          }).join('\n');
          stepsText = `**Key Guidelines:**\n${kLines}`;
        }
        break;
      }
    }

    // Resources Section
    if (outcome.resourcesUsed && outcome.resourcesUsed.length > 0) {
      const resLines = outcome.resourcesUsed
        .map(r => `• [${r.title}](${r.url})${r.description ? ` — ${r.description}` : ''}`)
        .join('\n');
      resourcesText = `**Direct Resources & Links:**\n${resLines}`;
    }

    // Warnings / Compliance Safeguards Section
    if (warnings.length > 0) {
      const wLines = warnings.map(w => `⚠️ **Important:** ${w}`).join('\n');
      warningsText = `${wLines}`;
    }

    // Closing
    closingText = `Let me know if you need anything else!\n\nBest,\nNORA\nNest Realty Operations\nAskNora@nestrealty.com`;

    // 3. Assemble Plain Text Body
    const textSections = [
      openingText,
      stepsText,
      resourcesText,
      warningsText,
      actionConfirmationText,
      closingText
    ].filter(Boolean);
    const bodyText = textSections.join('\n\n');

    // 4. Assemble HTML Body
    const htmlBodyContent = textSections.map(section => {
      // Format markdown links to HTML links
      let formatted = section
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #00635C; font-weight: 600; text-decoration: underline;">$1</a>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\n• /g, '</li><li style="margin-bottom: 6px;">')
        .replace(/\n  1\. /g, '</li><li style="margin-bottom: 6px;">')
        .replace(/\n\n/g, '</p><p style="margin-bottom: 14px; line-height: 1.6;">')
        .replace(/\n/g, '<br/>');

      if (formatted.includes('<li style=')) {
        formatted = formatted.replace(/(?:^|<br\/>)(<li style=[\s\S]+)/, '<ul style="margin: 8px 0 16px 20px; padding: 0;">$1</li></ul>');
      }

      if (section.startsWith('⚠️')) {
        return `<div style="background-color: #FEF3C7; border-left: 4px solid #D97706; padding: 12px 16px; border-radius: 4px; margin: 16px 0; color: #92400E; font-size: 14px;">${formatted}</div>`;
      }

      return `<p style="margin: 0 0 14px 0; line-height: 1.6; color: #1C1917; font-size: 14px;">${formatted}</p>`;
    }).join('\n');

    const bodyHtml = renderNoraEmailLayout({
      title: subject.replace(/^✓\s*/, ''),
      status: 'RECEIVED',
      bodyHtml: htmlBodyContent,
      cta: resourceUrls[0]
        ? { label: 'Open resource', url: resourceUrls[0] }
        : { label: 'Reply to Nora', url: 'mailto:asknora@nestrealty.com' },
    });

    return {
      subject,
      bodyText,
      bodyHtml,
      recipientEmail: agentIdentity.email,
      recipientName: agentIdentity.fullName,
      knowledgeAssertionIds: assertionIds,
      sopCodes,
      resourceUrls,
      warnings
    };
  }
}
