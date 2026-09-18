/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Production Acceptance Baseline Unit Test Suite
 * Tests all 14 mandatory invariants of the Release A clean production baseline.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { validateProductionAcceptanceBaseline } from '../../scripts/migration/validate_production_acceptance_baseline.js';

describe('Production Acceptance Baseline Invariant Suite', () => {
  const baselinePath = path.join(process.cwd(), 'server/data/canonical_marketing_store_production_acceptance.json');
  const excludedPath = path.join(process.cwd(), 'artifacts/nora-production-reconciliation/legacy-candidate-records-excluded-from-release-a.json');

  it('1. Confirms production acceptance baseline file exists and passes all 14 invariants', () => {
    const res = validateProductionAcceptanceBaseline(baselinePath, excludedPath);
    expect(res.isValid).toBe(true);
    expect(res.errors.length).toBe(0);
    expect(res.totalRequests).toBe(3);
    expect(res.totalTasks).toBe(4);
    expect(res.excludedRequestsCount).toBe(30);
    expect(res.excludedTasksCount).toBe(14);
    expect(res.isInvalidReconciledQuarantined).toBe(true);
  });

  it('2. Confirms exact retained request IDs and relationships', () => {
    const raw = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
    const requests = raw.requests;
    const tasks = raw.tasks;

    const reqIds = requests.map((r: any) => r.id);
    expect(reqIds).toContain('req_email_1788463431715_uypg7'); // 310 Chestnut
    expect(reqIds).toContain('req_active_survivor_1788463390481'); // 5077 Soundview
    expect(reqIds).toContain('req_seed_recon_1788463348828'); // 2381 Pembroke Jones

    // 310 Chestnut has 2 tasks
    const chestnutTasks = tasks.filter((t: any) => t.requestId === 'req_email_1788463431715_uypg7');
    expect(chestnutTasks.length).toBe(2);
    expect(chestnutTasks.map((t: any) => t.id)).toContain('tsk_email_1788463431716_1_tl2ti');
    expect(chestnutTasks.map((t: any) => t.id)).toContain('tsk_email_1788463431715_0_a2up2');

    // 5077 Soundview has 1 task
    const soundviewTasks = tasks.filter((t: any) => t.requestId === 'req_active_survivor_1788463390481');
    expect(soundviewTasks.length).toBe(1);
    expect(soundviewTasks[0].id).toBe('tsk_active_survivor_1788463390481');

    // 2381 Pembroke Jones has 1 task
    const pembrokeTasks = tasks.filter((t: any) => t.requestId === 'req_seed_recon_1788463348828');
    expect(pembrokeTasks.length).toBe(1);
    expect(pembrokeTasks[0].id).toBe('tsk_seed_recon_1788463348828');
  });

  it('3. Confirms status distribution: 1 needs_info, 1 in_progress, 1 ready_for_review', () => {
    const raw = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
    const req1 = raw.requests.find((r: any) => r.id === 'req_email_1788463431715_uypg7');
    const req2 = raw.requests.find((r: any) => r.id === 'req_active_survivor_1788463390481');
    const req3 = raw.requests.find((r: any) => r.id === 'req_seed_recon_1788463348828');

    expect(req1.status).toBe('needs_info');
    expect(req2.status).toBe('in_progress');
    expect(req3.status).toBe('ready_for_review');
  });

  it('4. Confirms acceptance test warning is present on every retained record', () => {
    const raw = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
    const warning = "LIVE ACCEPTANCE TEST — MARCUS AMAN / MATT ORR — NO EXTERNAL DISPATCH";

    raw.requests.forEach((r: any) => {
      const text = `${r.requestExcerpt || ''} ${r.notes || ''}`;
      expect(text).toContain(warning);
    });

    raw.tasks.forEach((t: any) => {
      expect(t.notes).toContain(warning);
    });
  });

  it('5. Confirms zero placeholders or security-test identities in baseline', () => {
    const raw = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
    raw.requests.forEach((r: any) => {
      expect(r.propertyAddress).not.toMatch(/pending|needed|area listing|tbd/i);
      expect(r.agentName).not.toMatch(/hacker|attacker|external person|external client/i);
    });
  });

  it('6. Confirms legacy excluded candidate archive contains exactly 30 requests and 14 tasks', () => {
    const raw = JSON.parse(fs.readFileSync(excludedPath, 'utf-8'));
    expect(raw.totalExcludedRequests).toBe(30);
    expect(raw.totalExcludedTasks).toBe(14);
    expect(raw.requests.length).toBe(30);
    expect(raw.tasks.length).toBe(14);
  });
});
