/**
 * Rules-Based Triage Recommendation Service (AI-Ready Triage Layer)
 * 
 * Labeling Honesty: This module utilizes regex and keyword parsing heuristics 
 * to classify incoming signals. It does not load large language models locally.
 * Low confidence classifications default to require manual human-in-the-loop review.
 */

export type TriageClassification = {
  signalText: string;
  category: 'compliance' | 'marketing' | 'facilities' | 'dispute' | 'general';
  suggestedPriority: 'low' | 'medium' | 'high' | 'critical';
  confidenceScore: number;
  routedQueue: 'operations_lead' | 'marketing_coordinator' | 'maintenance' | 'owner';
  requiresHumanReview: boolean;
  escalatedToOwner: boolean;
  triageNotes: string;
  triageMethod: 'heuristic_rules' | 'ai_model_fallback';
};

export function triageRecommendationService(signalText: string): TriageClassification {
  const text = signalText.toLowerCase();

  // 1. Identify high-risk or owner-worthy terms: legal, lawsuit, commission dispute, fine
  if (text.includes('lawsuit') || text.includes('court') || text.includes('dispute') || text.includes('legal threat')) {
    return {
      signalText,
      category: 'dispute',
      suggestedPriority: 'critical',
      confidenceScore: 0.96,
      routedQueue: 'owner',
      requiresHumanReview: true,
      escalatedToOwner: true,
      triageNotes: 'Escalated to owner automatically due to legal risk keywords.',
      triageMethod: 'heuristic_rules'
    };
  }

  // 2. Compliance / Disclosures / MLS checks
  if (text.includes('disclosure') || text.includes('compliance') || text.includes('audit') || text.includes('license') || text.includes('mls missing')) {
    const confidence = text.includes('disclosure') ? 0.91 : 0.85;
    return {
      signalText,
      category: 'compliance',
      suggestedPriority: text.includes('urgent') ? 'high' : 'medium',
      confidenceScore: confidence,
      routedQueue: 'operations_lead',
      requiresHumanReview: false,
      escalatedToOwner: false,
      triageNotes: 'Routed to Operations Lead for routine compliance review.',
      triageMethod: 'heuristic_rules'
    };
  }

  // 3. Marketing / Flyers / Photos
  if (text.includes('flyer') || text.includes('photos') || text.includes('brochure') || text.includes('listing post')) {
    return {
      signalText,
      category: 'marketing',
      suggestedPriority: 'medium',
      confidenceScore: 0.89,
      routedQueue: 'marketing_coordinator',
      requiresHumanReview: false,
      escalatedToOwner: false,
      triageNotes: 'Routed to Marketing Coordinator.',
      triageMethod: 'heuristic_rules'
    };
  }

  // 4. Facilities / Signs / Repairs
  if (text.includes('lockbox') || text.includes('signage') || text.includes('broken') || text.includes('repair') || text.includes('office key')) {
    return {
      signalText,
      category: 'facilities',
      suggestedPriority: 'low',
      confidenceScore: 0.88,
      routedQueue: 'maintenance',
      requiresHumanReview: false,
      escalatedToOwner: false,
      triageNotes: 'Routed to Maintenance queue for lockbox or facility issues.',
      triageMethod: 'heuristic_rules'
    };
  }

  // 5. Default Fallback (General / Unclear) - requires human-in-the-loop review
  return {
    signalText,
    category: 'general',
    suggestedPriority: 'medium',
    confidenceScore: 0.45, // Low confidence
    routedQueue: 'operations_lead',
    requiresHumanReview: true,
    escalatedToOwner: false,
    triageNotes: 'Low classification confidence. Flagged for human review.',
    triageMethod: 'heuristic_rules'
  };
}

// Backward-compatible alias for existing imports
export const classifySignal = triageRecommendationService;
export const rules_based_triage = triageRecommendationService;
export const ai_ready_triage = triageRecommendationService;
export const triage_recommendation_service = triageRecommendationService;
