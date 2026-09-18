import { SopDocument } from '../types/sopWorkflow';

export interface SopDraftProgress {
  percent: number;
  label: 'Getting started' | 'A few details added' | 'Draft taking shape' | 'Ready to review';
  missingRequiredFields: string[];
  openQuestionCount: number;
}

export function calculateSopDraftProgress(draft: SopDocument | null | undefined): SopDraftProgress {
  if (!draft) {
    return {
      percent: 0,
      label: 'Getting started',
      missingRequiredFields: ['title', 'purpose', 'processOwner', 'orderedSteps'],
      openQuestionCount: 0
    };
  }

  const missingRequiredFields: string[] = [];

  const hasTitle = Boolean(draft.title && draft.title.trim().length > 0);
  if (!hasTitle) missingRequiredFields.push('title');

  const hasPurpose = Boolean(draft.purpose && draft.purpose.trim().length > 0);
  if (!hasPurpose) missingRequiredFields.push('purpose');

  const hasOwner = Boolean(draft.processOwner && draft.processOwner.trim().length > 0);
  if (!hasOwner) missingRequiredFields.push('processOwner');

  const hasSteps = Array.isArray(draft.orderedSteps) && draft.orderedSteps.length > 0;
  if (!hasSteps) missingRequiredFields.push('orderedSteps');

  const openQuestionCount = Array.isArray(draft.openQuestions) ? draft.openQuestions.length : 0;

  let percent = 0;
  if (hasTitle) percent += 25;
  if (hasPurpose) percent += 25;
  if (hasOwner) percent += 25;
  if (hasSteps) percent += 25;

  let label: SopDraftProgress['label'] = 'Getting started';

  if (percent === 0) {
    label = 'Getting started';
  } else if (percent < 50) {
    label = 'A few details added';
  } else if (percent < 100 || openQuestionCount > 0) {
    label = 'Draft taking shape';
  } else if (percent === 100 && openQuestionCount === 0) {
    label = 'Ready to review';
  }

  return {
    percent,
    label,
    missingRequiredFields,
    openQuestionCount
  };
}
