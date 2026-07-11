import { test, expect } from '@playwright/test';
import { triageRecommendationService } from '../../server/headless/aiTriage';

test('Triage Recommendation Service - Confidence scoring and fallbacks', async () => {
  // Test legal term (should be high confidence legal triage)
  const legalSignal = triageRecommendationService('Lawsuit threat received from client.');
  expect(legalSignal.category).toBe('dispute');
  expect(legalSignal.confidenceScore).toBe(0.96);
  expect(legalSignal.requiresHumanReview).toBe(true);

  // Test marketing term
  const marketingSignal = triageRecommendationService('Need flyers for open house.');
  expect(marketingSignal.category).toBe('marketing');
  expect(marketingSignal.confidenceScore).toBe(0.89);
  expect(marketingSignal.requiresHumanReview).toBe(false);

  // Test random term (should fallback to general low confidence and human review)
  const unclearSignal = triageRecommendationService('Banana pancake recipe.');
  expect(unclearSignal.category).toBe('general');
  expect(unclearSignal.confidenceScore).toBe(0.45);
  expect(unclearSignal.requiresHumanReview).toBe(true);
});
