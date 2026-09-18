/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Truth Layer — Strict Truth Response Composer
 * 
 * Governing Principle:
 * "The final response composer must not introduce facts absent from this envelope."
 */

import { NoraTruthEnvelope, NoraEvidence, NoraProposedAction } from './noraTruthEnvelope.js';

export interface ComposedNoraResponse {
  spokenAnswer: string;
  displayResponse: string;
  answerStatus: NoraTruthEnvelope['answerStatus'];
  evidenceUsed: NoraEvidence[];
  executableActions: NoraProposedAction[];
  hasUnavailableSources: boolean;
  isDerived: boolean;
  hasConflicts: boolean;
}

export class TruthResponseComposer {
  /**
   * Composes both spokenAnswer and displayResponse deterministically from the Truth Envelope.
   */
  public static compose(envelope: NoraTruthEnvelope): ComposedNoraResponse {
    const { answerStatus, facts, inferences, unknowns, evidence, proposedActions } = envelope;

    const executableActions = proposedActions.filter(a => a.isExecutable);
    const disabledActions = proposedActions.filter(a => !a.isExecutable);

    const hasUnavailableSources = evidence.some(e => e.providerMode === 'DISCONNECTED' || e.status === 'UNVERIFIED') || 
                                  unknowns.some(u => u.reason.toLowerCase().includes('not connected') || u.reason.toLowerCase().includes('disconnected'));
    const isDerived = inferences.length > 0 || evidence.some(e => e.status === 'DERIVED');
    const hasConflicts = unknowns.some(u => u.reason.toLowerCase().includes('conflict'));

    // -------------------------------------------------------------------------
    // 1. DISCONNECTED / PROVIDER UNAVAILABLE SCENARIO
    // -------------------------------------------------------------------------
    if (answerStatus === 'PROVIDER_UNAVAILABLE' || (facts.length === 0 && hasUnavailableSources)) {
      const unavailReason = unknowns[0]?.reason || 'The required external provider is disconnected.';
      const spokenAnswer = `I can't verify that information because the live provider is not connected. I have not used fallback sample data.`;
      
      let displayResponse = `### ⚠️ Live Integration Disconnected\n\n${unavailReason}\n\n`;
      displayResponse += `*NORA will not generate synthetic or mock data in place of live verified records.*`;

      if (proposedActions.length > 0) {
        displayResponse += `\n\n#### Available Next Steps\n`;
        for (const act of proposedActions) {
          if (act.isExecutable) {
            displayResponse += `- **[${act.label}]**: ${act.description || 'Proceed with action'}\n`;
          } else {
            displayResponse += `- 🔒 **${act.label}** *(Disabled: ${act.reasonDisabled || 'Integration disconnected'})*\n`;
          }
        }
      }

      return {
        spokenAnswer,
        displayResponse,
        answerStatus,
        evidenceUsed: evidence,
        executableActions,
        hasUnavailableSources: true,
        isDerived: false,
        hasConflicts: false
      };
    }

    // -------------------------------------------------------------------------
    // 2. CONFLICTING EVIDENCE SCENARIO
    // -------------------------------------------------------------------------
    if (hasConflicts) {
      const conflictDetail = unknowns.find(u => u.reason.toLowerCase().includes('conflict'))?.reason || 
        'There is conflicting information across multiple records.';
      
      const spokenAnswer = `There is conflicting information between records and I cannot verify which is current. Would you like me to route this to the transaction owner?`;
      let displayResponse = `### ⚠️ Conflicting Records Detected\n\n${conflictDetail}\n\n`;
      
      if (evidence.length > 0) {
        displayResponse += `#### Evidence Checked\n`;
        for (const ev of evidence) {
          displayResponse += `- **${ev.label}** (${ev.sourceType.toUpperCase()} · \`${ev.providerMode}\`)\n`;
        }
        displayResponse += `\n`;
      }

      if (proposedActions.length > 0) {
        displayResponse += `#### Recommended Action\n`;
        for (const act of proposedActions) {
          displayResponse += `- **Action:** ${act.label} ${act.isExecutable ? '' : `*(Disabled: ${act.reasonDisabled})*`}\n`;
        }
      }

      return {
        spokenAnswer,
        displayResponse,
        answerStatus: 'HUMAN_REVIEW_REQUIRED',
        evidenceUsed: evidence,
        executableActions,
        hasUnavailableSources,
        isDerived,
        hasConflicts: true
      };
    }

    // -------------------------------------------------------------------------
    // 3. UNKNOWN / KNOWLEDGE GAP SCENARIO
    // -------------------------------------------------------------------------
    if (answerStatus === 'UNKNOWN' || (facts.length === 0 && inferences.length === 0)) {
      const unknownReason = unknowns[0]?.reason || "I don't have approved knowledge on this topic in our verified operating records.";
      const escalationTarget = unknowns[0]?.suggestedEscalationTarget || 'the designated team lead';

      const spokenAnswer = `I don't have approved knowledge for that in our verified records. Would you like me to route this to ${escalationTarget}?`;
      let displayResponse = `### ❓ Unverified Information\n\n${unknownReason}\n\n`;
      displayResponse += `> **Escalation Path:** This inquiry can be routed to **${escalationTarget}** for authoritative guidance.\n\n`;

      if (proposedActions.length > 0) {
        displayResponse += `#### Next Actions\n`;
        for (const act of proposedActions) {
          displayResponse += `- **Action:** ${act.label}\n`;
        }
      }

      return {
        spokenAnswer,
        displayResponse,
        answerStatus,
        evidenceUsed: evidence,
        executableActions,
        hasUnavailableSources,
        isDerived: false,
        hasConflicts: false
      };
    }

    // -------------------------------------------------------------------------
    // 4. VERIFIED / PARTIALLY VERIFIED / DERIVED FACTUAL RESPONSE
    // -------------------------------------------------------------------------
    
    // Build direct spoken answer from verified primary facts/inferences
    let spokenAnswer = '';
    const primaryFact = facts[0];
    if (primaryFact) {
      if (typeof primaryFact.value === 'string') {
        spokenAnswer = primaryFact.value;
      } else {
        spokenAnswer = `${primaryFact.field}: ${JSON.stringify(primaryFact.value)}`;
      }
    } else if (inferences[0]) {
      spokenAnswer = inferences[0].statement;
    }

    // Clean up spoken answer: remove markdown links or brackets for speech synthesis
    spokenAnswer = spokenAnswer.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`#]/g, '').trim();

    // Build structured displayResponse
    // 1. Direct answer
    let displayParts: string[] = [];

    if (facts.length > 0) {
      for (const fact of facts) {
        if (typeof fact.value === 'string' && (fact.value.startsWith('###') || fact.value.includes('\n'))) {
          displayParts.push(fact.value);
        } else if (typeof fact.value === 'string') {
          displayParts.push(fact.value);
        } else {
          displayParts.push(`**${fact.field}**: ${JSON.stringify(fact.value)}`);
        }
      }
    }

    // 2. Inferences / Derived notes
    if (inferences.length > 0) {
      for (const inf of inferences) {
        displayParts.push(`\n> **Derived Note:** ${inf.statement}\n> *${inf.explanation}*`);
      }
    }

    // 3. Unknowns or qualifiers
    if (unknowns.length > 0) {
      for (const unk of unknowns) {
        displayParts.push(`\n*Note:* ${unk.reason}`);
      }
    }

    // 4. Source & Evidence attribution
    if (evidence.length > 0) {
      const sourceCitations = evidence.map(ev => {
        let text = `Source: **${ev.label}**`;
        if (ev.lastVerifiedAt) {
          text += `, verified ${new Date(ev.lastVerifiedAt).toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric' })}`;
        }
        if (ev.providerMode !== 'LIVE') {
          text += ` [${ev.providerMode} mode]`;
        }
        return text;
      });
      displayParts.push(`\n\n${sourceCitations.join('\n')}`);
    }

    // 5. One primary relevant executable action (or disabled action with clear reason)
    if (proposedActions.length > 0) {
      displayParts.push('\n');
      for (const act of proposedActions) {
        if (act.isExecutable) {
          displayParts.push(`**Action:** ${act.label}`);
          if (act.description) {
            displayParts.push(`*${act.description}*`);
          }
        } else {
          displayParts.push(`🔒 **Action:** ${act.label} *(Unavailable: ${act.reasonDisabled || 'Not connected in this workspace'})*`);
        }
      }
    }

    const displayResponse = displayParts.join('\n').trim();

    return {
      spokenAnswer,
      displayResponse,
      answerStatus,
      evidenceUsed: evidence,
      executableActions,
      hasUnavailableSources,
      isDerived,
      hasConflicts
    };
  }
}
