/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { qaTrackerRepository } from '../../server/persistence/qaTrackerRepository';

describe('Pilot QA & Issue Tracker Suite', () => {
  it('loads all initial issues seeded from Google Sheets tracker', async () => {
    const issues = await qaTrackerRepository.getAllIssues();
    expect(issues.length).toBeGreaterThanOrEqual(20);
    
    // Check specific items from sheet
    const deleteDraftIssue = issues.find(i => i.summary.includes('Delete') && i.areaModule.includes('SOP'));
    expect(deleteDraftIssue).toBeDefined();
    expect(deleteDraftIssue?.reportedBy).toBe('Matt');

    const escalationFontIssue = issues.find(i => i.summary.includes('Font Color') || i.summary.includes('Contrast'));
    expect(escalationFontIssue).toBeDefined();

    const resetPassIssue = issues.find(i => i.summary.includes('Reset Password'));
    expect(resetPassIssue).toBeDefined();
  });

  it('verifies all 24 pilot QA issues are marked Resolved with resolution notes', async () => {
    const issues = await qaTrackerRepository.getAllIssues();
    expect(issues.length).toBe(24);
    
    const unresolved = issues.filter(i => i.status !== 'Resolved');
    expect(unresolved.length).toBe(0);

    // Verify all have resolutionNotes and dateResolved
    issues.forEach(issue => {
      expect(issue.status).toBe('Resolved');
      expect(issue.dateResolved).toBeDefined();
      expect(issue.resolutionNotes).toBeTruthy();
    });
  });

  it('loads all feature ideas from backlog', async () => {
    const features = await qaTrackerRepository.getAllFeatures();
    expect(features.length).toBeGreaterThanOrEqual(1);
    const digest = features.find(f => f.idea.includes('Weekly Owner Digest') || f.idea.includes('digest'));
    expect(digest).toBeDefined();
    expect(digest?.addedBy).toBe('Adam');
  });

  it('allows creating, updating, and querying QA issues', async () => {
    const newIssue = await qaTrackerRepository.createIssue({
      reportedBy: 'Adam',
      areaModule: 'Directory',
      summary: 'Test issue for verification',
      description: 'Verifying automated tracking workflow',
      severity: 'Low',
      status: 'New',
      owner: 'Marcus'
    });

    expect(newIssue.id).toBeDefined();
    expect(newIssue.summary).toBe('Test issue for verification');

    const updated = await qaTrackerRepository.updateIssue(newIssue.id, {
      status: 'Resolved',
      dateResolved: '2026-08-18',
      resolutionNotes: 'Verified with Vitest suite'
    });

    expect(updated?.status).toBe('Resolved');
    expect(updated?.resolutionNotes).toBe('Verified with Vitest suite');

    // Cleanup
    await qaTrackerRepository.deleteIssue(newIssue.id);
  });

  it('allows creating and updating feature ideas', async () => {
    const newFeat = await qaTrackerRepository.createFeature({
      addedBy: 'Matt',
      areaModule: 'SOP Builder',
      idea: 'Bulk SOP Step Reordering',
      problemSolved: 'Easier drag-and-drop workflow for long SOPs',
      valueImpact: 'High',
      effort: 'S',
      owner: 'Marcus'
    });

    expect(newFeat.id).toBeDefined();
    expect(newFeat.idea).toBe('Bulk SOP Step Reordering');

    const updated = await qaTrackerRepository.updateFeature(newFeat.id, {
      status: 'Planned'
    });

    expect(updated?.status).toBe('Planned');

    // Cleanup to prevent polluting feature backlog across test runs
    await qaTrackerRepository.deleteFeature(newFeat.id);
  });

  it('supports automated AI dispatch with formatted Antigravity prompt generation', async () => {
    const testIssue = await qaTrackerRepository.createIssue({
      reportedBy: 'Matt',
      areaModule: 'Role & Escalation Map',
      summary: 'Map nodes need click-through zoom',
      description: 'Zoom into department sub-trees when clicking cluster node.',
      severity: 'Medium',
      status: 'New',
      owner: 'Marcus',
      relatedComponent: 'RoleEscalationMapPage.tsx'
    });

    const dispatchResult = await qaTrackerRepository.dispatchToAi(testIssue.id);
    expect(dispatchResult).not.toBeNull();
    expect(dispatchResult?.issue.status).toBe('In Progress');
    expect(dispatchResult?.issue.owner).toBe('Marcus / Antigravity AI');
    expect(dispatchResult?.issue.resolutionNotes).toContain('[Antigravity AI]');
    expect(dispatchResult?.prompt).toContain(testIssue.id);
    expect(dispatchResult?.prompt).toContain('RoleEscalationMapPage.tsx');
    expect(dispatchResult?.prompt).toContain('Task Instructions:');

    // Cleanup
    await qaTrackerRepository.deleteIssue(testIssue.id);
  });
});
