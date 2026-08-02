import { ZodSchema } from 'zod';

export class AIOutputValidator {
  static async validateAndRepair<T>(
    rawOutput: string,
    schema: ZodSchema<T>,
    repairFn: (malformedJson: string, errorMsg: string) => Promise<string>
  ): Promise<T> {
    const cleaned = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsed = JSON.parse(cleaned);
      const validated = schema.parse(parsed);
      return validated;
    } catch (err: any) {
      console.warn('[AI Validator] First validation failed. Initiating controlled repair...', err.message);
      try {
        const repairedText = await repairFn(cleaned, err.message);
        const repairedCleaned = repairedText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedRepaired = JSON.parse(repairedCleaned);
        const validatedRepaired = schema.parse(parsedRepaired);
        return validatedRepaired;
      } catch (repairErr: any) {
        console.error('[AI Validator] Controlled repair failed:', repairErr.message);
        throw new Error(`Structured response failed validation: ${err.message}. Repair also failed: ${repairErr.message}`);
      }
    }
  }
}
