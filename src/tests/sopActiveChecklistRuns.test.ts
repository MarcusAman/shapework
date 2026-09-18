import { describe, it, expect, beforeEach } from 'vitest';
import { sopRunRepository } from '../../server/persistence/sopRunRepository';
import { sopRepository } from '../../server/persistence/sopRepository';

describe('Active SOP Checklist Runs & Evidence Dashboard Test Suite', () => {
  const workspaceId = 'nest-realty-wilmington';
  const tenantId = 'tenant_nest_uat';

  // 1. RUN CREATION FROM PUBLISHED SOP
  describe('1. Run Instantiation from Published SOP', () => {
    it('creates active run, copies ordered steps with default SLAs, and initializes progress at 0%', async () => {
      const publishedSops = (sopRepository.listDraftsSync(tenantId, workspaceId) || []).filter(s => s.status === 'published');
      const sop = publishedSops[0];
      expect(sop).toBeDefined();

      const run = await sopRunRepository.createRunFromSop(
        sop,
        '518 Chestnut St, Wilmington NC',
        'Melissa Gagliardi',
        {
          workspaceId,
          tenantId,
          assigneeRole: 'Transaction Coordinator',
          priority: 'high'
        }
      );

      expect(run.id).toBeDefined();
      expect(run.propertyAddress).toBe('518 Chestnut St, Wilmington NC');
      expect(run.status).toBe('in_progress');
      expect(run.progressPercent).toBe(0);
      expect(run.currentStepNumber).toBe(1);
      expect(run.totalSteps).toBe(sop.orderedSteps?.length || 1);
      expect(run.steps.length).toBe(run.totalSteps);
      expect(run.steps[0].status).toBe('pending');
    });
  });

  // 2. STEP COMPLETION & EVIDENCE CAPTURE
  describe('2. Step-Level Evidence Capture & Progress Tracking', () => {
    it('completes step with URL evidence, updates actor/timestamp, and advances progress', async () => {
      const publishedSops = (sopRepository.listDraftsSync(tenantId, workspaceId) || []).filter(s => s.status === 'published');
      const sop = publishedSops[0];

      const run = await sopRunRepository.createRunFromSop(
        sop,
        '702 Grace St, Wilmington NC',
        'Melissa Gagliardi',
        { workspaceId, tenantId }
      );

      // Complete Step 1 with Dotloop link evidence
      const res = await sopRunRepository.completeStep(run.id, 1, {
        completedById: 'usr_melissa',
        completedByName: 'Melissa Gagliardi',
        evidenceType: 'url_link',
        evidenceValue: 'https://dotloop.com/loop/702-grace-st-wilmington',
        notes: 'Listing agreement and WWREA fully signed by seller.'
      });

      expect(res).toBeDefined();
      expect(res?.step.status).toBe('completed');
      expect(res?.step.completedByName).toBe('Melissa Gagliardi');
      expect(res?.step.evidenceValue).toContain('https://dotloop.com/loop/702-grace-st-wilmington');
      expect(res?.run.progressPercent).toBeGreaterThan(0);
      expect(res?.run.currentStepNumber).toBe(2);
    });

    it('allows reopening completed steps and decrements progress accordingly', async () => {
      const publishedSops = (sopRepository.listDraftsSync(tenantId, workspaceId) || []).filter(s => s.status === 'published');
      const sop = publishedSops[0];

      const run = await sopRunRepository.createRunFromSop(
        sop,
        '312 Red Cross St, Wilmington NC',
        'Melissa Gagliardi',
        { workspaceId, tenantId }
      );

      await sopRunRepository.completeStep(run.id, 1, {
        completedByName: 'Melissa Gagliardi',
        evidenceValue: 'Proof #1'
      });

      const updatedAfterComplete = await sopRunRepository.getRunById(run.id);
      expect(updatedAfterComplete?.progressPercent).toBeGreaterThan(0);

      // Reopen Step 1
      const updatedAfterReopen = await sopRunRepository.reopenStep(run.id, 1);
      expect(updatedAfterReopen?.steps[0].status).toBe('pending');
      expect(updatedAfterReopen?.progressPercent).toBe(0);
    });
  });

  // 3. FULL COMPLETION LIFECYCLE
  describe('3. Full Procedure Completion & Auditing', () => {
    it('marks entire run as completed and records completedAt timestamp once all steps are checked off', async () => {
      const contractSop = (sopRepository.listDraftsSync(tenantId, workspaceId) || []).find(s => s.id === 'sop_contract_verification_002');
      expect(contractSop).toBeDefined();

      const run = await sopRunRepository.createRunFromSop(
        contractSop!,
        '104 Live Oak Dr, Wrightsville Beach NC',
        'Eric Knight (BIC)',
        { workspaceId, tenantId }
      );

      // Complete all steps
      for (const step of run.steps) {
        await sopRunRepository.completeStep(run.id, step.stepNumber, {
          completedByName: 'Eric Knight (BIC)',
          evidenceType: 'confirmation',
          evidenceValue: `Verified Step ${step.stepNumber}`
        });
      }

      const finalRun = await sopRunRepository.getRunById(run.id);
      expect(finalRun?.status).toBe('completed');
      expect(finalRun?.progressPercent).toBe(100);
      expect(finalRun?.completedAt).toBeDefined();
    });
  });
});
