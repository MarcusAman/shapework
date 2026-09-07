import { describe, it, expect } from 'vitest';
import { NoraTrainingAcademyService } from '../../server/services/noraTrainingAcademyService';

describe('Nora Training & Objection Roleplay Academy Suite', () => {
  it('1. Provides structured objection scenarios across seller, buyer, and negotiation categories', () => {
    const scenarios = NoraTrainingAcademyService.getRoleplayScenarios();
    expect(scenarios.length).toBeGreaterThanOrEqual(4);
    const commScen = scenarios.find(s => s.id === 'scen_commission_discount');
    expect(commScen).toBeDefined();
    expect(commScen?.initialCounterpartStatement).toContain('4% total commission');
  });

  it('2. Evaluates objection turn in real time and grades empathy, compliance, and CTA', () => {
    const evalResult = NoraTrainingAcademyService.evaluateRoleplayTurn({
      scenarioId: 'scen_commission_discount',
      agentUtterance: 'I completely understand your focus on costs. In North Carolina, our 300 DPI Maxa marketing and professional presentation yield a 98.6% list-to-sale ratio, putting more net money in your pocket. Can I show you our seller net sheet tomorrow at 2:00 PM?'
    });

    expect(evalResult).toBeDefined();
    expect(evalResult.overallScore).toBeGreaterThanOrEqual(75);
    expect(evalResult.passed).toBe(true);
    expect(evalResult.scoreBreakdown.reframingAndEmpathy).toBeGreaterThanOrEqual(80);
    expect(evalResult.counterpartResponse).toContain('That actually makes a lot of sense');
    expect(evalResult.coachingFeedback.strengths.length).toBeGreaterThan(0);
  });

  it('3. Provides 30-day provisional broker roadmap across Weeks 1 to 4', () => {
    const roadmap = NoraTrainingAcademyService.getOnboardingRoadmap();
    expect(roadmap.length).toBe(4);
    expect(roadmap[0].week).toBe(1);
    expect(roadmap[0].milestones.length).toBeGreaterThan(0);
  });

  it('4. Provides verified NCREC Rule 58A flashcards with statutory citations', () => {
    const flashcards = NoraTrainingAcademyService.getNcrecFlashcards();
    expect(flashcards.length).toBeGreaterThanOrEqual(4);
    const trustCard = flashcards.find(f => f.category === 'Trust Accounts');
    expect(trustCard).toBeDefined();
    expect(trustCard?.statutoryRule).toContain('58A .0106');
  });
});
