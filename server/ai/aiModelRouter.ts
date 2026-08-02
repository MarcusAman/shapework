export class AIModelRouter {
  static getModelForCapability(capability: string): string {
    const modelFast = process.env.AI_MODEL_FAST || 'gemini-2.5-flash';
    const modelReasoning = process.env.AI_MODEL_REASONING || 'gemini-2.5-flash';
    const modelDocument = process.env.AI_MODEL_DOCUMENT || 'gemini-2.5-flash';

    switch (capability) {
      case 'improveText':
        return modelFast;
      case 'generateDraft':
      case 'reviewSop':
      case 'stageSuggest':
        return modelReasoning;
      case 'analyzeKnowledge':
      case 'answerFromKnowledge':
        return modelDocument;
      default:
        return modelFast;
    }
  }
}
