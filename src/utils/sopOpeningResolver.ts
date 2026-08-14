export interface SopVoicePersonalization {
  first_name: string;
  full_name: string;
  role_title: string;
  process_name: string;
  has_existing_draft: boolean;
  first_open_question: string;
  next_incomplete_section: string;
}

export type SopOpeningMode =
  | 'new_draft'
  | 'existing_open_question'
  | 'existing_incomplete_section'
  | 'existing_review';

export function getCleanFirstName(rawName?: string | null): string {
  if (!rawName || typeof rawName !== 'string') return '';
  const trimmed = rawName.trim();
  if (!trimmed || trimmed.includes('@')) return '';
  const parts = trimmed.split(/\s+/);
  const candidate = parts[0] || '';
  if (/^(user|admin|owner|null|undefined)$/i.test(candidate)) {
    return '';
  }
  return candidate;
}

export function formatQuestionText(question: string): string {
  if (!question) return '';
  let q = question.trim();
  if (!q) return '';

  // Remove trailing extra question marks or punctuation
  q = q.replace(/\?+$/, '').trim();

  // If question starts with capital letter and not an acronym like 'SOP' or 'NCREC' or 'DA'
  if (/^[A-Z][a-z]/.test(q)) {
    q = q.charAt(0).toLowerCase() + q.slice(1);
  }

  return `${q}?`;
}

export function resolveSopOpening(context: SopVoicePersonalization): {
  message: string;
  openingMode: SopOpeningMode;
  context: {
    firstName: string;
    fullName: string;
    hasTitle: boolean;
    firstOpenQuestion: string;
    nextIncompleteSection: string;
  };
} {
  const firstNameCandidate = getCleanFirstName(context.first_name || context.full_name);
  const greetingPrefix = firstNameCandidate ? `Hi, ${firstNameCandidate}.` : 'Hi there.';
  const nameForAgent = firstNameCandidate || 'there';

  const processName = (context.process_name || '').trim();
  const hasDraft = Boolean(context.has_existing_draft && processName.length > 0);
  const openQ = (context.first_open_question || '').trim();
  const nextSection = (context.next_incomplete_section || '').trim();

  const ctxSummary = {
    firstName: nameForAgent,
    fullName: context.full_name || '',
    hasTitle: hasDraft,
    firstOpenQuestion: openQ,
    nextIncompleteSection: nextSection
  };

  // Case 1: Brand New Draft
  if (!hasDraft) {
    return {
      openingMode: 'new_draft',
      message: `${greetingPrefix} I’m here to help you turn the way this work gets done into a clear SOP. I’ll ask one simple question at a time, and I’ll build the draft as we talk. You can correct anything, stop at any time, or type instead. Nothing will be published until you and your team review it. To get started, what process would you like to document today?`,
      context: ctxSummary
    };
  }

  // Case 2: Existing Draft with Unresolved Open Question
  if (openQ.length > 0) {
    const formattedQ = formatQuestionText(openQ);
    return {
      openingMode: 'existing_open_question',
      message: `${greetingPrefix} We already have the basics for ${processName}. I’d like to help you finish the questions that are still open. First, ${formattedQ}`,
      context: ctxSummary
    };
  }

  // Case 3: Existing Draft with Missing Incomplete Section
  if (nextSection.length > 0) {
    let sectionPrompt = 'What happens first?';
    if (nextSection === 'completionEvidence') {
      sectionPrompt = 'Next, let’s add how someone knows the process is complete. What should be true when the work is finished?';
    } else if (nextSection === 'trigger') {
      sectionPrompt = 'Next, let’s specify when this process starts. What event or action triggers it?';
    } else if (nextSection === 'processOwner') {
      sectionPrompt = 'Next, who owns and oversees this process?';
    } else if (nextSection === 'orderedSteps') {
      sectionPrompt = 'Next, let’s outline the step-by-step actions. What happens first?';
    }

    return {
      openingMode: 'existing_incomplete_section',
      message: `${greetingPrefix} We have a good start on the ${processName}. ${sectionPrompt}`,
      context: ctxSummary
    };
  }

  // Case 4: Existing Draft Ready for Review
  return {
    openingMode: 'existing_review',
    message: `${greetingPrefix} The draft for ${processName} is ready to review. I can walk through the steps with you or help make a change. Where would you like to begin?`,
    context: ctxSummary
  };
}
